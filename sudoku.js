// Fixed Sudoku puzzle generation and solving logic

class SudokuGenerator {
    constructor() {
        this.board = Array.from({ length: 9 }, () => Array(9).fill(0));
        this.solution = null;
        this.fallbackBoards = [
            // Add more fallback boards for variety
            [
                [5, 3, 4, 6, 7, 8, 9, 1, 2],
                [6, 7, 2, 1, 9, 5, 3, 4, 8],
                [1, 9, 8, 3, 4, 2, 5, 6, 7],
                [8, 5, 9, 7, 6, 1, 4, 2, 3],
                [4, 2, 6, 8, 5, 3, 7, 9, 1],
                [7, 1, 3, 9, 2, 4, 8, 5, 6],
                [9, 6, 1, 5, 3, 7, 2, 8, 4],
                [2, 8, 7, 4, 1, 9, 6, 3, 5],
                [3, 4, 5, 2, 8, 6, 1, 7, 9]
            ],
            [
                [1, 2, 3, 4, 5, 6, 7, 8, 9],
                [4, 5, 6, 7, 8, 9, 1, 2, 3],
                [7, 8, 9, 1, 2, 3, 4, 5, 6],
                [2, 3, 4, 5, 6, 7, 8, 9, 1],
                [5, 6, 7, 8, 9, 1, 2, 3, 4],
                [8, 9, 1, 2, 3, 4, 5, 6, 7],
                [3, 4, 5, 6, 7, 8, 9, 1, 2],
                [6, 7, 8, 9, 1, 2, 3, 4, 5],
                [9, 1, 2, 3, 4, 5, 6, 7, 8]
            ]
        ];
    }

    // Generate a complete valid Sudoku board
    async generateCompleteBoard() {
        console.log('Starting board generation...');
        let attempts = 0;
        const maxAttempts = 5;

        while (attempts < maxAttempts) {
            try {
                // Reset board
                this.board = Array.from({ length: 9 }, () => Array(9).fill(0));
                
                // Use a simpler approach - start with a valid base pattern
                this.createBasePattern();
                
                if (this.fillRemainingCells(0, 0)) {
                    console.log('Board generated successfully');
                    return this.board.map(row => [...row]);
                }
            } catch (error) {
                console.warn(`Attempt ${attempts + 1} failed:`, error);
            }
            
            attempts++;
            await new Promise(resolve => setTimeout(resolve, 1));
        }

        // Fallback to a known valid pattern if generation fails
        console.log('Using fallback pattern');
        return this.getFallbackBoard();
    }

    // Create a base pattern for the Sudoku board
    createBasePattern() {
        // Fill the first box (top-left 3x3) with numbers 1-9
        const numbers = [1, 2, 3, 4, 5, 6, 7, 8, 9];
        this.shuffleArray(numbers);
        
        let index = 0;
        for (let row = 0; row < 3; row++) {
            for (let col = 0; col < 3; col++) {
                this.board[row][col] = numbers[index++];
            }
        }
    }

    // Fill remaining cells using backtracking
    fillRemainingCells(row, col) {
        // Move to next row if we've filled current row
        if (col === 9) {
            row++;
            col = 0;
        }
        
        // If we've filled all rows, we're done
        if (row === 9) {
            return true;
        }
        
        // If cell is already filled, move to next
        if (this.board[row][col] !== 0) {
            return this.fillRemainingCells(row, col + 1);
        }
        
        // Try numbers 1-9 in random order
        const numbers = this.getShuffledNumbers();
        for (const num of numbers) {
            if (this.isValidMove(row, col, num)) {
                this.board[row][col] = num;
                if (this.fillRemainingCells(row, col + 1)) {
                    return true;
                }
                this.board[row][col] = 0;
            }
        }
        
        return false;
    }

    // Get a fallback valid Sudoku board
    getFallbackBoard() {
        // Randomly select a fallback board
        const index = Math.floor(Math.random() * this.fallbackBoards.length);
        return this.fallbackBoards[index].map(row => [...row]);
    }

    // Shuffle array in place
    shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
    }

    // Get shuffled numbers 1-9
    getShuffledNumbers() {
        const arr = [1, 2, 3, 4, 5, 6, 7, 8, 9];
        this.shuffleArray(arr);
        return arr;
    }

    // Check if a number can be placed at given position
    isValidMove(row, col, num) {
        // Check row
        for (let x = 0; x < 9; x++) {
            if (this.board[row][x] === num) return false;
        }

        // Check column
        for (let x = 0; x < 9; x++) {
            if (this.board[x][col] === num) return false;
        }

        // Check 3x3 box
        const startRow = Math.floor(row / 3) * 3;
        const startCol = Math.floor(col / 3) * 3;
        for (let i = 0; i < 3; i++) {
            for (let j = 0; j < 3; j++) {
                if (this.board[startRow + i][startCol + j] === num) return false;
            }
        }

        return true;
    }

    // Create puzzle by removing numbers (FIXED VERSION)
    async createPuzzle(completeBoard, difficulty) {
        console.log('Creating puzzle for difficulty:', difficulty);
        const puzzle = completeBoard.map(row => [...row]);
        const cellsToRemove = this.getCellsToRemove(difficulty);
        
        // Generate random positions to remove
        const positions = this.generateShuffledPositions();
        let removed = 0;
        let attempts = 0;
        const maxAttempts = 100;
        
        // Remove cells more aggressively for easier puzzles
        const removalStrategy = this.getRemovalStrategy(difficulty);
        
        for (const [row, col] of positions) {
            if (removed >= cellsToRemove) break;
            if (attempts >= maxAttempts) break;
            
            // Skip if already empty
            if (puzzle[row][col] === 0) continue;
            
            const backup = puzzle[row][col];
            puzzle[row][col] = 0;
            
            // For easier difficulties, remove more liberally
            // For harder difficulties, be more selective
            const shouldRemove = removalStrategy === 'aggressive' || 
                                Math.random() < removalStrategy;
            
            if (shouldRemove) {
                // Check if the puzzle still has a unique solution
                if (await this.hasUniqueSolution(puzzle)) {
                    removed++;
                } else {
                    // If no unique solution, restore the number
                    puzzle[row][col] = backup;
                }
            } else {
                // Restore the number if we're not removing it
                puzzle[row][col] = backup;
            }
            
            attempts++;
            
            // Yield control periodically
            if (attempts % 10 === 0) {
                await new Promise(resolve => setTimeout(resolve, 0));
            }
        }
        
        // If we haven't removed enough cells, try to remove more
        if (removed < cellsToRemove * 0.7) {
            console.warn(`Could only remove ${removed} cells out of ${cellsToRemove} for ${difficulty} difficulty`);
            // Try to remove more cells with a different strategy
            const remainingPositions = positions.filter(([row, col]) => puzzle[row][col] !== 0);
            for (const [row, col] of remainingPositions) {
                if (removed >= cellsToRemove) break;
                
                const backup = puzzle[row][col];
                puzzle[row][col] = 0;
                
                if (await this.hasUniqueSolution(puzzle)) {
                    removed++;
                } else {
                    puzzle[row][col] = backup;
                }
            }
        }
        
        const emptyCells = puzzle.flat().filter(cell => cell === 0).length;
        console.log(`Puzzle created with ${emptyCells} empty cells (target: ${cellsToRemove})`);
        
        return puzzle;
    }

    // Get removal strategy based on difficulty
    getRemovalStrategy(difficulty) {
        const strategies = {
            easy: 'aggressive',     // Remove cells more freely
            medium: 0.8,           // 80% chance to remove
            hard: 0.6,             // 60% chance to remove  
            expert: 0.4            // 40% chance to remove
        };
        
        return strategies[difficulty] || 0.6;
    }

    // Generate shuffled positions
    generateShuffledPositions() {
        const positions = [];
        for (let row = 0; row < 9; row++) {
            for (let col = 0; col < 9; col++) {
                positions.push([row, col]);
            }
        }
        
        this.shuffleArray(positions);
        return positions;
    }

    // Get number of cells to remove based on difficulty (FIXED)
    getCellsToRemove(difficulty) {
        const cellCounts = {
            easy: 40,    // ~49% empty (easier)
            medium: 50,  // ~62% empty  
            hard: 58,    // ~72% empty
            expert: 64   // ~79% empty (very hard)
        };
        return cellCounts[difficulty] || 50;
    }

    // Check if puzzle has unique solution
    async hasUniqueSolution(puzzle) {
        const testBoard = puzzle.map(row => [...row]);
        let count = 0;
        const maxSolutions = 2;

        const countSolutions = async (board) => {
            if (count >= maxSolutions) return;

            const empty = this.findEmptyCell(board);
            if (!empty) {
                count++;
                return;
            }

            const [row, col] = empty;
            const numbers = this.getShuffledNumbers();

            for (const num of numbers) {
                if (this.isValidMove(row, col, num)) {
                    board[row][col] = num;
                    await countSolutions(board);
                    board[row][col] = 0;
                    if (count >= maxSolutions) return;
                }
            }
        };

        await countSolutions(testBoard);
        return count === 1;
    }

    // Find first empty cell
    findEmptyCell(board) {
        for (let row = 0; row < 9; row++) {
            for (let col = 0; col < 9; col++) {
                if (board[row][col] === 0) {
                    return [row, col];
                }
            }
        }
        return null;
    }
}

// Main function to generate puzzle (FIXED)
async function generatePuzzle(difficulty = 'medium') {
    console.log('Starting puzzle generation for difficulty:', difficulty);
    try {
        const generator = new SudokuGenerator();
        
        // Generate complete board
        console.log('Generating complete board...');
        const completeBoard = await generator.generateCompleteBoard();
        
        // Validate complete board
        if (!isValidBoard(completeBoard)) {
            throw new Error('Generated board is invalid');
        }
        console.log('Complete board is valid');

        // Create puzzle
        console.log('Creating puzzle...');
        const puzzleBoard = await generator.createPuzzle(completeBoard, difficulty);
        
        // Ensure puzzle has empty cells
        const emptyCells = puzzleBoard.flat().filter(cell => cell === 0).length;
        if (emptyCells === 0) {
            console.warn('No empty cells found, forcing some cells to be empty');
            // Force some cells to be empty
            const positions = generator.generateShuffledPositions();
            const targetEmpty = generator.getCellsToRemove(difficulty);
            
            for (let i = 0; i < Math.min(targetEmpty, positions.length); i++) {
                const [row, col] = positions[i];
                puzzleBoard[row][col] = 0;
            }
        }
        
        console.log('Puzzle created successfully with', puzzleBoard.flat().filter(cell => cell === 0).length, 'empty cells');

        return {
            board: puzzleBoard,
            solution: completeBoard
        };
    } catch (error) {
        console.error('Error in generatePuzzle:', error);
        
        // Fallback puzzle generation
        console.log('Using fallback puzzle generation');
        const generator = new SudokuGenerator();
        const fallbackBoard = generator.getFallbackBoard();
        const puzzleBoard = await generator.createPuzzle(fallbackBoard, difficulty);
        
        return {
            board: puzzleBoard,
            solution: fallbackBoard
        };
    }
}

// Validate board
function isValidBoard(board) {
    // Check if board is empty
    const emptyCells = board.flat().filter(cell => cell === 0).length;
    if (emptyCells === 81) return false; // Completely empty board is invalid

    // Check rows
    for (let row = 0; row < 9; row++) {
        const numbers = new Set();
        for (let col = 0; col < 9; col++) {
            const num = board[row][col];
            if (num === 0) continue;
            if (numbers.has(num)) return false;
            numbers.add(num);
        }
    }

    // Check columns
    for (let col = 0; col < 9; col++) {
        const numbers = new Set();
        for (let row = 0; row < 9; row++) {
            const num = board[row][col];
            if (num === 0) continue;
            if (numbers.has(num)) return false;
            numbers.add(num);
        }
    }

    // Check 3x3 boxes
    for (let boxRow = 0; boxRow < 3; boxRow++) {
        for (let boxCol = 0; boxCol < 3; boxCol++) {
            const numbers = new Set();
            for (let row = 0; row < 3; row++) {
                for (let col = 0; col < 3; col++) {
                    const num = board[boxRow * 3 + row][boxCol * 3 + col];
                    if (num === 0) continue;
                    if (numbers.has(num)) return false;
                    numbers.add(num);
                }
            }
        }
    }

    return true;
}

// Get possible numbers for a cell
function getPossibleNumbers(board, row, col) {
    if (board[row][col] !== 0) return [];

    const possible = new Set([1, 2, 3, 4, 5, 6, 7, 8, 9]);

    // Remove numbers from row and column
    for (let i = 0; i < 9; i++) {
        possible.delete(board[row][i]);
        possible.delete(board[i][col]);
    }

    // Remove numbers from 3x3 box
    const startRow = Math.floor(row / 3) * 3;
    const startCol = Math.floor(col / 3) * 3;
    for (let i = 0; i < 3; i++) {
        for (let j = 0; j < 3; j++) {
            possible.delete(board[startRow + i][startCol + j]);
        }
    }

    return Array.from(possible);
}

// Export functions
export { SudokuGenerator, generatePuzzle, isValidBoard, getPossibleNumbers };