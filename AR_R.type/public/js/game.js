const socket = io();
let gameId;

// 게임 초기화
socket.emit('game-connect');
socket.on('connect', () => {
    gameId = socket.id;
    console.log('Game ID:', gameId);

    // 컨트롤러 URL 생성 및 링크 설정
    const controllerUrl = `${window.location.origin}/controller?gameId=${gameId}`;
    const urlElement = document.getElementById('controller-url');
    urlElement.innerHTML = `<a href="${controllerUrl}" target="_blank">${controllerUrl}</a>`;
});

// 키 상태 관리 추가
const keyStates = {
    up: false,
    down: false
};

// 컨트롤러 입력 처리 수정
socket.on('game-control', (data) => {
    if (data.action === 'fire' && data.pressed) {
        fireBullet();
        return;
    }
    keyStates[data.action] = data.pressed;
});

// 게임 루프 함수
function gameLoop() {
    if (keyStates.up) {
        movePlayer('up');
    }
    if (keyStates.down) {
        movePlayer('down');
    }
    requestAnimationFrame(gameLoop);
}

// 컨트롤러 입력 처리
socket.on('game-control', (data) => {
    switch(data.action) {
        case 'up':
            movePlayer('up');
            break;
        case 'down':
            movePlayer('down');
            break;
        case 'fire':
            fireBullet();
            break;
    }
});

// 플레이어 이동 함수
function movePlayer(direction) {
    const player = document.getElementById('player');
    const currentBottom = parseInt(getComputedStyle(player).bottom);
    const newBottom = direction === 'up' ?
        Math.min(550, currentBottom + 10) :
        Math.max(20, currentBottom - 10);
    player.style.bottom = `${newBottom}px`;
}

// 총알 발사 함수
function fireBullet() {
    const bullet = document.createElement('div');
    bullet.className = 'bullet';
    const player = document.getElementById('player');
    const playerPos = player.getBoundingClientRect();
    const gameContainer = document.getElementById('game-container');
    const containerPos = gameContainer.getBoundingClientRect();

    // 플레이어 중앙에서 총알 시작 위치 설정
    const playerCenterX = playerPos.left - containerPos.left + (playerPos.width / 2);
    const playerCenterY = playerPos.top - containerPos.top + (playerPos.height / 2);

    bullet.style.left = `${playerCenterX}px`;
    bullet.style.top = `${playerCenterY - 2.5}px`; // 총알 높이의 절반만큼 조정
    gameContainer.appendChild(bullet);

    moveBullet(bullet);
}

// 총알 이동 함수
function moveBullet(bullet) {
    let position = parseInt(bullet.style.left);
    const interval = setInterval(() => {
        if (position >= 800) {
            clearInterval(interval);
            bullet.remove();
        } else {
            position += 15;  // 총알 속도 증가
            bullet.style.left = `${position}px`;
            checkCollision(bullet);
        }
    }, 16);  // 부드러운 움직임을 위해 간격 조정
}

// 게임 상태 관리
const gameState = {
    score: 0,
    isGameOver: false,
    bossHealth: 100,
    currentPattern: 0,
    patternInterval: null
};

// 보스 패턴 정의
const bossPatterns = [
    // 패턴 1: 상하 이동
    function verticalMove() {
        const boss = document.getElementById('boss');
        let direction = 1;
        let position = parseInt(getComputedStyle(boss).top);

        return setInterval(() => {
            if (position >= 500) direction = -1;
            if (position <= 50) direction = 1;
            position += direction * 5;
            boss.style.top = `${position}px`;
        }, 50);
    },

    // 패턴 2: 대각선 이동
    function diagonalMove() {
        const boss = document.getElementById('boss');
        let xDirection = 1;
        let yDirection = 1;
        let xPos = parseInt(getComputedStyle(boss).right);
        let yPos = parseInt(getComputedStyle(boss).top);

        return setInterval(() => {
            if (xPos >= 150) xDirection = -1;
            if (xPos <= 50) xDirection = 1;
            if (yPos >= 500) yDirection = -1;
            if (yPos <= 50) yDirection = 1;

            xPos += xDirection * 3;
            yPos += yDirection * 5;
            boss.style.right = `${xPos}px`;
            boss.style.top = `${yPos}px`;
        }, 50);
    },

    // 패턴 3: 원형 이동
    function circularMove() {
        const boss = document.getElementById('boss');
        let angle = 0;
        const centerY = 275;
        const centerX = 700;  // 오른쪽으로 이동
        const radius = 100;

        return setInterval(() => {
            const x = centerX + radius * Math.cos(angle);
            const y = centerY + radius * Math.sin(angle);
            angle += 0.05;

            boss.style.right = `${800 - x}px`;  // 오른쪽 기준으로 위치 계산
            boss.style.top = `${y}px`;
        }, 50);
    }
];

// 충돌 효과 생성 함수 수정
function createHitEffect(bossRect) {
    const effect = document.createElement('div');
    effect.className = 'hit-effect';

    // 보스의 중앙 위치 계산
    const centerX = bossRect.left + (bossRect.width / 2);
    const centerY = bossRect.top + (bossRect.height / 2);

    // 충돌 효과의 중앙 정렬을 위해 위치 조정
    effect.style.left = `${centerX - 10}px`;
    effect.style.top = `${centerY - 10}px`;

    document.getElementById('game-container').appendChild(effect);
    effect.addEventListener('animationend', () => effect.remove());
}

// 충돌 감지 함수 수정
function checkCollision(bullet) {
    const boss = document.getElementById('boss');
    const bulletRect = bullet.getBoundingClientRect();
    const bossRect = boss.getBoundingClientRect();

    if (bulletRect.left < bossRect.right &&
        bulletRect.right > bossRect.left &&
        bulletRect.top < bossRect.bottom &&
        bulletRect.bottom > bossRect.top) {

        // 보스와의 충돌 시 효과 생성
        createHitEffect(bossRect);
        gameState.bossHealth -= 10;
        bullet.remove();
        updateBossState();
    }
}

// 보스 상태 업데이트
function updateBossState() {
    if (gameState.bossHealth <= 0) {
        endGame(true);
        return;
    }

    // 체력에 따라 패턴 변경
    if (gameState.bossHealth <= 30 && gameState.currentPattern !== 2) {
        changePattern(2);
    } else if (gameState.bossHealth <= 60 && gameState.currentPattern !== 1) {
        changePattern(1);
    }
}

// 패턴 변경 함수
function changePattern(patternIndex) {
    if (gameState.patternInterval) {
        clearInterval(gameState.patternInterval);
    }
    gameState.currentPattern = patternIndex;
    gameState.patternInterval = bossPatterns[patternIndex]();
}

// 게임 종료 함수
function endGame(isVictory) {
    gameState.isGameOver = true;
    clearInterval(gameState.patternInterval);

    const message = isVictory ? 'Victory!' : 'Game Over';
    const overlay = document.createElement('div');
    overlay.id = 'game-over';
    overlay.innerHTML = `
        <h1>${message}</h1>
        <p>Score: ${gameState.score}</p>
        <button onclick="location.reload()">Refresh</button>
    `;
    document.getElementById('game-container').appendChild(overlay);
}

// 게임 초기화
window.onload = () => {
    changePattern(0);
    gameLoop();  // 게임 루프 시작
};