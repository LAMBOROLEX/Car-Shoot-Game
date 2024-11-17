function autoPlay(grid, score, gridSize, moveTiles, drawGrid, updateScore, isGameOver, addRandomTile) {
    const maxStep = 3; // Default search depth
    const directions = [[-1, 0], [1, 0], [0, -1], [0, 1]]; // Up, Down, Left, Right

    // Main search function
    function search(grid, step) {
        if (step === maxStep) {
            return estimate(grid);
        }

        let bestScore = -Infinity;
        for (let i = 0; i < directions.length; ++i) {
            let [newGrid, score] = move(grid, directions[i]);
            if (newGrid.toString() === grid.toString()) continue;

            let k = countEmptySlots(newGrid);
            if (k === 0) {
                score -= 10000; // Penalty for no empty slots
            } else {
                for (let j = 0; j < 16; ++j) {
                    if (newGrid[Math.floor(j / gridSize)][j % gridSize] === 0) {
                        newGrid[Math.floor(j / gridSize)][j % gridSize] = 2;
                        score += 0.9 * search(newGrid, step + 1);
                        newGrid[Math.floor(j / gridSize)][j % gridSize] = 4;
                        score += 0.1 * search(newGrid, step + 1);
                        newGrid[Math.floor(j / gridSize)][j % gridSize] = 0;
                    }
                }
            }

            if (score > bestScore) bestScore = score;
        }
        return bestScore;
    }

    // Estimate the state of the grid
    function estimate(grid) {
        let sum = 0;
        let penalty = 0;
        for (let i = 0; i < gridSize; ++i) {
            for (let j = 0; j < gridSize; ++j) {
                sum += grid[i][j];
                if (j < gridSize - 1) {
                    penalty += Math.abs(grid[i][j] - grid[i][j + 1]);
                }
                if (i < gridSize - 1) {
                    penalty += Math.abs(grid[i][j] - grid[i + 1][j]);
                }
            }
        }
        return sum - penalty;
    }

    // Count empty slots
    function countEmptySlots(grid) {
        let count = 0;
        for (let i = 0; i < gridSize; ++i) {
            for (let j = 0; j < gridSize; ++j) {
                if (grid[i][j] === 0) count++;
            }
        }
        return count;
    }

    // Move tiles in a given direction and return new grid and score
    function move(grid, direction) {
        let moved = false;
        let newGrid = JSON.parse(JSON.stringify(grid));
        let score = 0;

        function slide(row) {
            let arr = row.filter(val => val);
            let missing = row.length - arr.length;
            let zeros = Array(missing).fill(0);
            return arr.concat(zeros);
        }

        function combine(row) {
            for (let i = 0; i < row.length - 1; i++) {
                if (row[i] === row[i + 1] && row[i] !== 0) {
                    row[i] *= 2;
                    row[i + 1] = 0;
                    score += row[i];
                }
            }
            return row;
        }

        function operate(row) {
            row = slide(row);
            row = combine(row);
            row = slide(row);
            return row;
        }

        if (direction[0] === 0) {
            for (let i = 0; i < gridSize; i++) {
                let row = newGrid.map(row => row[i]);
                let operatedRow = operate(row);
                for (let j = 0; j < gridSize; j++) {
                    newGrid[j][i] = operatedRow[j];
                }
            }
        } else {
            for (let i = 0; i < gridSize; i++) {
                let row = newGrid[i];
                if (direction[0] === 1) row = row.reverse();
                let operatedRow = operate(row);
                if (direction[0] === 1) operatedRow = operatedRow.reverse();
                newGrid[i] = operatedRow;
            }
        }

        return [newGrid, score];
    }

    let bestMove = null;
    let bestScore = -Infinity;

    for (let i = 0; i < directions.length; ++i) {
        let [newGrid, score] = move(grid, directions[i]);
        if (newGrid.toString() === grid.toString()) continue;

        let moveScore = search(newGrid, 0);
        if (moveScore > bestScore) {
            bestScore = moveScore;
            bestMove = directions[i];
        }
    }

    if (bestMove !== null) {
        moveTiles(bestMove);
    }

    if (!isGameOver()) {
        setTimeout(() => autoPlay(grid, score, gridSize, moveTiles, drawGrid, updateScore, isGameOver, addRandomTile), 1);
    }
}