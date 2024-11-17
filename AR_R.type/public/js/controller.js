const socket = io();
const gameId = new URLSearchParams(window.location.search).get('gameId');

if (gameId) {
    socket.emit('controller-connect', gameId);

    const buttons = {
        'btn-up': 'up',
        'btn-down': 'down',
        'btn-fire': 'fire'
    };

    Object.entries(buttons).forEach(([btnId, action]) => {
        const button = document.getElementById(btnId);
        if (button) {
            // 터치 시작
            button.addEventListener('touchstart', (e) => {
                e.preventDefault();
                socket.emit('control-input', { action, pressed: true });
            });

            // 터치 종료
            button.addEventListener('touchend', (e) => {
                e.preventDefault();
                socket.emit('control-input', { action, pressed: false });
            });

            // 마우스 이벤트 (데스크톱 테스트용)
            button.addEventListener('mousedown', () => {
                socket.emit('control-input', { action, pressed: true });
            });

            button.addEventListener('mouseup', () => {
                socket.emit('control-input', { action, pressed: false });
            });
        }
    });
}