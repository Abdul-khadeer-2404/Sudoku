// Main game script
import { generatePuzzle, isValidBoard, getPossibleNumbers } from './sudoku.js';
import GameTimer from './timer.js';
import DifficultyManager from './difficulty.js';
import HintSystem from './hints.js';

export class SudokuGame {
    constructor() {
        // Ensure DOM is ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.initializeGame());
        } else {
            this.initializeGame();
        }
    }

    async initializeGame() {
        try {
            // Initialize properties
            this.board = null;
            this.solution = null;
            this.initialBoard = null; // Add this to store initial puzzle state
            this.selectedCell = null;
            this.mistakes = 0;
            this.isGameActive = false;
            this.isDarkMode = false;

            // Initialize managers
            this.timer = new GameTimer();
            this.difficultyManager = new DifficultyManager();
            this.hintSystem = new HintSystem();

            // Cache DOM elements
            await this.cacheDOMElements();

            // Initialize event listeners
            this.initializeEventListeners();

            // Load game state
            await this.loadGameState();

            // Enable controls
            this.enableControls();
        } catch (error) {
            console.error('Error initializing game:', error);
            this.showError('Failed to initialize the game. Please refresh the page.');
        }
    }

    async cacheDOMElements() {
        // Wait for elements to be available
        const waitForElement = (selector) => {
            return new Promise((resolve) => {
                if (document.querySelector(selector)) {
                    return resolve(document.querySelector(selector));
                }

                const observer = new MutationObserver(() => {
                    if (document.querySelector(selector)) {
                        observer.disconnect();
                        resolve(document.querySelector(selector));
                    }
                });

                observer.observe(document.body, {
                    childList: true,
                    subtree: true
                });
            });
        };

        // Wait for all required elements
        this.grid = await waitForElement('#sudoku-grid');
        this.mistakesDisplay = await waitForElement('#mistakes-count');
        this.darkModeToggle = await waitForElement('#dark-mode-toggle');
        this.newGameBtn = await waitForElement('#new-game-btn');
        this.resetBtn = await waitForElement('#reset-btn');
        this.victoryModal = await waitForElement('#victory-modal');
        this.finalTimeDisplay = await waitForElement('#final-time');
        this.finalHintsDisplay = await waitForElement('#final-hints');
        this.playAgainBtn = await waitForElement('#play-again-btn');

        // Validate required elements
        if (!this.grid || !this.mistakesDisplay || !this.darkModeToggle || 
            !this.newGameBtn || !this.resetBtn || !this.victoryModal) {
            throw new Error('Required DOM elements not found');
        }
    }

    enableControls() {
        this.newGameBtn.disabled = false;
        this.resetBtn.disabled = false;
        this.darkModeToggle.disabled = false;
        document.getElementById('hint-btn').disabled = false;
        this.difficultyManager.difficultySelect.disabled = false;
    }

    showError(message) {
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message';
        errorDiv.textContent = message;
        document.body.appendChild(errorDiv);

        setTimeout(() => {
            errorDiv.remove();
        }, 5000);
    }

    // Initialize event listeners
    initializeEventListeners() {
        // Grid cell selection
        this.grid.addEventListener('click', (e) => {
            const cell = e.target.closest('.sudoku-cell');
            if (cell && !cell.classList.contains('prefilled')) {
                this.selectCell(cell);
            }
        });

        // Number input
        document.addEventListener('keydown', (e) => {
            if (!this.isGameActive || !this.selectedCell) return;

            const key = e.key;
            if (/^[1-9]$/.test(key)) {
                this.handleNumberInput(parseInt(key));
            } else if (key === 'Backspace' || key === 'Delete') {
                this.handleNumberInput(0);
            } else if (key === 'ArrowUp' || key === 'ArrowDown' || 
                      key === 'ArrowLeft' || key === 'ArrowRight') {
                this.handleArrowKey(key);
            }
        });

        // Control buttons
        this.newGameBtn.addEventListener('click', () => this.startNewGame());
        this.resetBtn.addEventListener('click', () => this.resetGame());
        this.darkModeToggle.addEventListener('click', () => this.toggleDarkMode());
        this.playAgainBtn.addEventListener('click', () => this.startNewGame());

        // Difficulty selection
        this.difficultyManager.difficultySelect.addEventListener('change', (e) => {
            this.difficultyManager.setDifficulty(e.target.value);
            this.startNewGame();
        });

        // Hint button
        document.getElementById('hint-btn').addEventListener('click', () => this.getHint());
    }

    // Start a new game
    async startNewGame() {
        try {
            console.log('Starting new game...');
            const { board, solution } = await generatePuzzle(this.difficultyManager.currentDifficulty);
            console.log('Puzzle generated:', { board, solution });
            
            this.board = board;
            this.solution = solution;
            this.initialBoard = board.map(row => [...row]); // Store initial state
            this.mistakes = 0;
            this.isGameActive = true;
            this.selectedCell = null;

            this.renderBoard();
            this.timer.reset();
            this.timer.start();
            this.hintSystem.initialize(solution, board, this.difficultyManager.currentDifficulty);
            this.updateMistakesDisplay();
            this.hideVictoryModal();
            this.saveGameState();
        } catch (error) {
            console.error('Error starting new game:', error);
            this.showError('Failed to generate a new puzzle. Please try again.');
        }
    }

    // Reset the current game
    resetGame() {
        if (!this.isGameActive) return;

        // Reset the board to its initial state
        this.board = this.initialBoard.map(row => [...row]);

        // Reset game state
        this.mistakes = 0;
        this.selectedCell = null;
        
        // Update UI
        this.renderBoard();
        this.timer.reset();
        this.timer.start();
        this.hintSystem.reset();
        this.updateMistakesDisplay();
        this.saveGameState();

        // Clear any incorrect cell highlights
        this.grid.querySelectorAll('.incorrect').forEach(cell => {
            cell.classList.remove('incorrect');
        });
    }

    // Render the game board
    renderBoard() {
        this.grid.innerHTML = '';
        for (let row = 0; row < 9; row++) {
            for (let col = 0; col < 9; col++) {
                const cell = document.createElement('div');
                cell.className = 'sudoku-cell';
                cell.dataset.row = row;
                cell.dataset.col = col;

                const value = this.board[row][col];
                if (value !== 0) {
                    cell.textContent = value;
                    cell.classList.add('prefilled');
                }

                // Add data attributes for validation
                cell.dataset.value = value;
                cell.dataset.solution = this.solution[row][col];

                this.grid.appendChild(cell);
            }
        }
    }

    // Select a cell
    selectCell(cell) {
        // Don't allow selecting prefilled cells
        if (cell.classList.contains('prefilled')) {
            return;
        }

        if (this.selectedCell) {
            this.selectedCell.classList.remove('selected');
        }
        this.selectedCell = cell;
        cell.classList.add('selected');
        this.highlightRelatedCells(cell);
    }

    // Handle number input
    handleNumberInput(number) {
        if (!this.selectedCell) return;

        const row = parseInt(this.selectedCell.dataset.row);
        const col = parseInt(this.selectedCell.dataset.col);

        // Don't allow modifying prefilled cells
        if (this.selectedCell.classList.contains('prefilled')) {
            return;
        }

        if (this.board[row][col] === number) return;

        this.board[row][col] = number;
        this.selectedCell.textContent = number || '';
        this.selectedCell.classList.toggle('incorrect', 
            number !== 0 && number !== this.solution[row][col]);

        if (number !== 0 && number !== this.solution[row][col]) {
            this.handleMistake();
        }

        this.checkVictory();
        this.saveGameState();
    }

    // Handle arrow key navigation
    handleArrowKey(key) {
        if (!this.selectedCell) return;

        const row = parseInt(this.selectedCell.dataset.row);
        const col = parseInt(this.selectedCell.dataset.col);
        let newRow = row;
        let newCol = col;

        switch (key) {
            case 'ArrowUp':
                newRow = Math.max(0, row - 1);
                break;
            case 'ArrowDown':
                newRow = Math.min(8, row + 1);
                break;
            case 'ArrowLeft':
                newCol = Math.max(0, col - 1);
                break;
            case 'ArrowRight':
                newCol = Math.min(8, col + 1);
                break;
        }

        const newCell = this.grid.querySelector(`[data-row="${newRow}"][data-col="${newCol}"]`);
        if (newCell && !newCell.classList.contains('prefilled')) {
            this.selectCell(newCell);
        }
    }

    // Handle mistake
    handleMistake() {
        this.mistakes++;
        this.updateMistakesDisplay();

        if (!this.difficultyManager.areMistakesAllowed()) {
            this.resetGame();
        }
    }

    // Update mistakes display
    updateMistakesDisplay() {
        if (this.mistakesDisplay) {
            this.mistakesDisplay.textContent = this.mistakes;
        }
    }

    // // Highlight related cells
    // highlightRelatedCells(cell) {
    //     const row = parseInt(cell.dataset.row);
    //     const col = parseInt(cell.dataset.col);

    //     // Remove previous highlights
    //     this.grid.querySelectorAll('.highlighted').forEach(cell => {
    //         cell.classList.remove('highlighted');
    //     });

    //     // Highlight row, column, and box
    //     for (let i = 0; i < 9; i++) {
    //         // Row
    //         this.grid.querySelector(`[data-row="${row}"][data-col="${i}"]`)
    //             ?.classList.add('highlighted');
    //         // Column
    //         this.grid.querySelector(`[data-row="${i}"][data-col="${col}"]`)
    //             ?.classList.add('highlighted');
    //     }

    //     // Box
    //     const boxRow = Math.floor(row / 3) * 3;
    //     const boxCol = Math.floor(col / 3) * 3;
    //     for (let i = 0; i < 3; i++) {
    //         for (let j = 0; j < 3; j++) {
    //             this.grid.querySelector(`[data-row="${boxRow + i}"][data-col="${boxCol + j}"]`)
    //                 ?.classList.add('highlighted');
    //         }
    //     }
    // }

    // Get a hint
    getHint() {
        if (!this.isGameActive) return;

        const hint = this.hintSystem.getHint();
        if (hint) {
            const cell = this.grid.querySelector(`[data-row="${hint.row}"][data-col="${hint.col}"]`);
            if (cell) {
                this.selectCell(cell);
                this.handleNumberInput(hint.value);
            }
        }
    }

    // Check for victory
    checkVictory() {
        if (!this.isGameActive) return;

        const isComplete = this.board.every((row, i) =>
            row.every((cell, j) => cell === this.solution[i][j])
        );

        if (isComplete) {
            this.handleVictory();
        }
    }

    // Handle victory
    handleVictory() {
        this.isGameActive = false;
        this.timer.stop();
        this.showVictoryModal();
        this.saveGameState();
    }

    // Show victory modal
    showVictoryModal() {
        if (this.finalTimeDisplay) {
            this.finalTimeDisplay.textContent = this.timer.getFormattedTime();
        }
        if (this.finalHintsDisplay) {
            this.finalHintsDisplay.textContent = this.hintSystem.getHintsUsed();
        }
        this.victoryModal.classList.remove('hidden');
        // Add celebration animation
        const celebrationIcon = document.createElement('div');
        celebrationIcon.className = 'celebration-icon';
        celebrationIcon.innerHTML = '<i class="fas fa-trophy"></i>';
        this.victoryModal.querySelector('.modal-content').prepend(celebrationIcon);
    }

    // Hide victory modal
    hideVictoryModal() {
        this.victoryModal.classList.add('hidden');
    }

    // Toggle dark mode
    toggleDarkMode() {
        this.isDarkMode = !this.isDarkMode;
        document.body.classList.toggle('dark-mode', this.isDarkMode);
        this.darkModeToggle.innerHTML = this.isDarkMode ? '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>';
        localStorage.setItem('darkMode', this.isDarkMode);
    }

    // Save game state
    saveGameState() {
        const gameState = {
            board: this.board,
            solution: this.solution,
            initialBoard: this.initialBoard, // Save initial board state
            mistakes: this.mistakes,
            isGameActive: this.isGameActive,
            elapsedTime: this.timer.getElapsedTime(),
            hintsUsed: this.hintSystem.getHintsUsed()
        };
        localStorage.setItem('sudokuGameState', JSON.stringify(gameState));
    }

    async loadGameState() {
        try {
            const savedState = localStorage.getItem('sudokuGameState');
            const savedDarkMode = localStorage.getItem('darkMode');

            if (savedDarkMode) {
                this.isDarkMode = savedDarkMode === 'true';
                document.body.classList.toggle('dark-mode', this.isDarkMode);
                this.darkModeToggle.textContent = this.isDarkMode ? '☀️' : '🌙';
            }

            if (savedState) {
                const state = JSON.parse(savedState);
                this.board = state.board;
                this.solution = state.solution;
                this.initialBoard = state.initialBoard; // Load initial board state
                this.mistakes = state.mistakes;
                this.isGameActive = state.isGameActive;

                this.renderBoard();
                this.updateMistakesDisplay();
                this.hintSystem.initialize(this.solution, this.board, 
                    this.difficultyManager.currentDifficulty);

                if (this.isGameActive) {
                    this.timer.start();
                    this.timer.elapsedTime = state.elapsedTime;
                }
            } else {
                await this.startNewGame();
            }
        } catch (error) {
            console.error('Error loading game state:', error);
            await this.startNewGame();
        }
    }
}

// Export default for backward compatibility
export default SudokuGame;