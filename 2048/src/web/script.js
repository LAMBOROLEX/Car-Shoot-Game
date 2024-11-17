document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('game-board');
    const ctx = canvas.getContext('2d');
    const scoreDisplay = document.getElementById('score');
    const countdownElement = document.getElementById('countdown');
    const gridSize = 4;
    const tileSize = canvas.width / gridSize;
    let grid = [];
    let score = 0;

    // Initialize the game
    function init() {
        grid = Array.from({ length: gridSize }, () => Array(gridSize).fill(0));
        score = 0; // Reset the score
        addRandomTile();
        addRandomTile();
        drawGrid();
        updateScore();
        setTimeout(() => autoPlay(grid, score, gridSize, moveTiles, drawGrid, updateScore, isGameOver, addRandomTile), 1000);
    }

    // Add a random tile (2 or 4) to the grid
    function addRandomTile() {
        let emptyCells = [];
        for (let row = 0; row < gridSize; row++) {
            for (let col = 0; col < gridSize; col++) {
                if (grid[row][col] === 0) {
                    emptyCells.push({ row, col });
                }
            }
        }

        if (emptyCells.length > 0) {
            let { row, col } = emptyCells[Math.floor(Math.random() * emptyCells.length)];
            grid[row][col] = Math.random() < 0.9 ? 2 : 4;
        }
    }

    // Draw the grid and tiles
    function drawGrid() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        for (let row = 0; row < gridSize; row++) {
            for (let col = 0; col < gridSize; col++) {
                drawTile(row, col, grid[row][col]);
            }
        }
    }

    // Draw an individual tile
    function drawTile(row, col, value) {
        ctx.fillStyle = getTileColor(value);
        ctx.fillRect(col * tileSize, row * tileSize, tileSize, tileSize);
        ctx.strokeStyle = '#bbada0';
        ctx.strokeRect(col * tileSize, row * tileSize, tileSize, tileSize);
        if (value) {
            ctx.font = `${tileSize / 2}px Arial`;
            ctx.fillStyle = '#776e65';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(value, col * tileSize + tileSize / 2, row * tileSize + tileSize / 2);
        }
    }

    // Get color for a tile based on its value
    function getTileColor(value) {
        switch (value) {
            case 2: return '#eee4da';
            case 4: return '#ede0c8';
            case 8: return '#f2b179';
            case 16: return '#f59563';
            case 32: return '#f67c5f';
            case 64: return '#f65e3b';
            case 128: return '#edcf72';
            case 256: return '#edcc61';
            case 512: return '#edc850';
            case 1024: return '#edc53f';
            case 2048: return '#edc22e';
            default: return '#cdc1b4';
        }
    }

    // Update the score display
    function updateScore() {
        scoreDisplay.textContent = score;
    }

    // Move tiles in a given direction
    function moveTiles(direction) {
        let moved = false;

        for (let row = 0; row < gridSize; row++) {
            for (let col = 0; col < gridSize; col++) {
                if (grid[row][col] === 0) continue;

                let newRow = row;
                let newCol = col;

                while (true) {
                    let nextRow = newRow + direction[0];
                    let nextCol = newCol + direction[1];

                    if (nextRow < 0 || nextRow >= gridSize || nextCol < 0 || nextCol >= gridSize) break;

                    if (grid[nextRow][nextCol] === 0) {
                        grid[nextRow][nextCol] = grid[newRow][newCol];
                        grid[newRow][newCol] = 0;
                        newRow = nextRow;
                        newCol = nextCol;
                        moved = true;
                    } else if (grid[nextRow][nextCol] === grid[newRow][newCol]) {
                        grid[nextRow][nextCol] *= 2;
                        grid[newRow][newCol] = 0;
                        score += grid[nextRow][nextCol];
                        moved = true;
                        break;
                    } else {
                        break;
                    }
                }
            }
        }

        if (moved) {
            addRandomTile();
            drawGrid();
            updateScore();
            if (isGameOver()) {
                alert('Game Over!');
                startCountdown(); // Restart the countdown on game over
            }
        }

        return moved;
    }

    // Check if the game is over
    function isGameOver() {
        for (let row = 0; row < gridSize; row++) {
            for (let col = 0; col < gridSize; col++) {
                if (grid[row][col] === 0) return false;
                if (row > 0 && grid[row][col] === grid[row - 1][col]) return false;
                if (row < gridSize - 1 && grid[row][col] === grid[row + 1][col]) return false;
                if (col > 0 && grid[row][col] === grid[row][col - 1]) return false;
                if (col < gridSize - 1 && grid[row][col] === grid[row][col + 1]) return false;
            }
        }
        return true;
    }

    // Countdown before game starts
    function startCountdown() {
        let countdown = 5;
        countdownElement.textContent = countdown;
        countdownElement.style.display = 'block';

        const countdownInterval = setInterval(() => {
            countdown -= 1;
            countdownElement.textContent = countdown;

            if (countdown === 0) {
                clearInterval(countdownInterval);
                countdownElement.style.display = 'none';
                init();
            }
        }, 1000);
    }

    // Start the initial countdown
    startCountdown();
});