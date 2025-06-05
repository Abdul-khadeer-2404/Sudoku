// Hint system for Sudoku game

class HintSystem {
    constructor() {
        this.maxHints = 3;
        this.hintsUsed = 0;
        this.hintStrategies = [
            'naked_singles',
            'hidden_singles',
            'naked_pairs',
            'pointing_pairs',
            'box_line_reduction'
        ];
        this.hintButton = document.getElementById('hint-btn');
        this.hintsCountDisplay = document.getElementById('hints-count');
        this.hintHistory = new Set();
        this.solution = null;
        this.currentBoard = null;
        this.difficulty = 'medium';
    }

    // Initialize the hint system
    initialize(solution, currentBoard, difficulty) {
        this.solution = solution;
        this.currentBoard = currentBoard;
        this.difficulty = difficulty;
        this.hintsUsed = 0;
        this.hintHistory.clear();
        this.updateHintsDisplay();
        this.updateHintButton();
    }

    // Get a hint for the current board state
    getHint() {
        if (!this.canProvideHint()) {
            this.showHintLimitMessage();
            return null;
        }

        const emptyCells = this.findEmptyCells();
        if (emptyCells.length === 0) {
            return null;
        }

        // Find the cell with the most impact
        const bestHint = this.findBestHint(emptyCells);
        if (!bestHint) {
            return null;
        }

        this.hintsUsed++;
        this.hintHistory.add(`${bestHint.row}-${bestHint.col}`);
        this.updateHintsDisplay();
        this.updateHintButton();

        return bestHint;
    }

    // Check if a hint can be provided
    canProvideHint() {
        return this.hintsUsed < this.maxHints && this.solution && this.currentBoard;
    }

    // Find all empty cells in the current board
    findEmptyCells() {
        const emptyCells = [];
        for (let row = 0; row < 9; row++) {
            for (let col = 0; col < 9; col++) {
                if (this.currentBoard[row][col] === 0) {
                    emptyCells.push({ row, col });
                }
            }
        }
        return emptyCells;
    }

    // Find the best hint based on impact and difficulty
    findBestHint(emptyCells) {
        const hints = emptyCells.map(cell => ({
            ...cell,
            impact: this.calculateHintImpact(cell),
            value: this.solution[cell.row][cell.col]
        }));

        // Sort hints by impact and filter out previously used hints
        const validHints = hints
            .filter(hint => !this.hintHistory.has(`${hint.row}-${hint.col}`))
            .sort((a, b) => b.impact - a.impact);

        return validHints[0] || null;
    }

    // Calculate the impact of a hint based on difficulty
    calculateHintImpact(cell) {
        const { row, col } = cell;
        let impact = 0;

        // Count empty cells in the same row, column, and box
        const emptyInRow = this.countEmptyInRow(row);
        const emptyInCol = this.countEmptyInCol(col);
        const emptyInBox = this.countEmptyInBox(row, col);

        // Calculate impact based on difficulty
        switch (this.difficulty) {
            case 'easy':
                impact = (emptyInRow + emptyInCol + emptyInBox) * 0.5;
                break;
            case 'medium':
                impact = (emptyInRow + emptyInCol + emptyInBox) * 0.7;
                break;
            case 'hard':
                impact = (emptyInRow + emptyInCol + emptyInBox) * 0.9;
                break;
            case 'expert':
                impact = (emptyInRow + emptyInCol + emptyInBox);
                break;
            default:
                impact = (emptyInRow + emptyInCol + emptyInBox) * 0.7;
        }

        return impact;
    }

    // Count empty cells in a row
    countEmptyInRow(row) {
        return this.currentBoard[row].filter(cell => cell === 0).length;
    }

    // Count empty cells in a column
    countEmptyInCol(col) {
        return this.currentBoard.filter(row => row[col] === 0).length;
    }

    // Count empty cells in a 3x3 box
    countEmptyInBox(row, col) {
        const startRow = Math.floor(row / 3) * 3;
        const startCol = Math.floor(col / 3) * 3;
        let count = 0;

        for (let i = 0; i < 3; i++) {
            for (let j = 0; j < 3; j++) {
                if (this.currentBoard[startRow + i][startCol + j] === 0) {
                    count++;
                }
            }
        }

        return count;
    }

    // Update the hints count display
    updateHintsDisplay() {
        if (this.hintsCountDisplay) {
            this.hintsCountDisplay.textContent = this.hintsUsed;
        }
    }

    // Update the hint button state
    updateHintButton() {
        if (this.hintButton) {
            const canHint = this.canProvideHint();
            this.hintButton.disabled = !canHint;
            this.hintButton.classList.toggle('disabled', !canHint);
        }
    }

    // Show message when hint limit is reached
    showHintLimitMessage() {
        const message = document.createElement('div');
        message.className = 'hint-message';
        message.textContent = `You've used all ${this.maxHints} hints!`;
        document.body.appendChild(message);

        setTimeout(() => {
            message.remove();
        }, 3000);
    }

    // Reset the hint system
    reset() {
        this.hintsUsed = 0;
        this.hintHistory.clear();
        this.updateHintsDisplay();
        this.updateHintButton();
    }

    // Get the number of hints used
    getHintsUsed() {
        return this.hintsUsed;
    }

    // Set the maximum number of hints
    setMaxHints(max) {
        this.maxHints = max;
        this.updateHintButton();
    }

    // Check if a value can be placed in a cell
    canPlaceValue(board, row, col, value) {
        // Check row
        for (let i = 0; i < 9; i++) {
            if (board[row][i] === value) return false;
        }

        // Check column
        for (let i = 0; i < 9; i++) {
            if (board[i][col] === value) return false;
        }

        // Check box
        const startRow = Math.floor(row / 3) * 3;
        const startCol = Math.floor(col / 3) * 3;
        for (let i = 0; i < 3; i++) {
            for (let j = 0; j < 3; j++) {
                if (board[startRow + i][startCol + j] === value) return false;
            }
        }

        return true;
    }

    // Get possible values for a cell
    getPossibleValues(board, row, col) {
        const possibleValues = [];
        for (let value = 1; value <= 9; value++) {
            if (this.canPlaceValue(board, row, col, value)) {
                possibleValues.push(value);
            }
        }
        return possibleValues;
    }

    // Check if a value exists in a row
    isValueInRow(board, row, value) {
        return board[row].includes(value);
    }

    // Check if a value exists in a column
    isValueInColumn(board, col, value) {
        return board.some(row => row[col] === value);
    }

    // Check if a value exists in a box
    isValueInBox(board, boxIndex, value) {
        const startRow = Math.floor(boxIndex / 3) * 3;
        const startCol = (boxIndex % 3) * 3;
        
        for (let i = 0; i < 3; i++) {
            for (let j = 0; j < 3; j++) {
                if (board[startRow + i][startCol + j] === value) {
                    return true;
                }
            }
        }
        return false;
    }

    // Get hint analysis for educational purposes
    getHintAnalysis(board, row, col) {
        const possibleValues = this.getPossibleValues(board, row, col);
        const analysis = {
            possibleValues: possibleValues,
            eliminatedBy: this.getEliminationReasons(board, row, col),
            techniques: this.getSuggestedTechniques(board, row, col)
        };
        return analysis;
    }

    // Get reasons why certain values are eliminated
    getEliminationReasons(board, row, col) {
        const eliminated = [];
        
        for (let value = 1; value <= 9; value++) {
            if (!this.canPlaceValue(board, row, col, value)) {
                const reasons = [];
                
                if (this.isValueInRow(board, row, value)) {
                    reasons.push(`${value} already in row ${row + 1}`);
                }
                if (this.isValueInColumn(board, col, value)) {
                    reasons.push(`${value} already in column ${col + 1}`);
                }
                
                const boxIndex = Math.floor(row / 3) * 3 + Math.floor(col / 3);
                if (this.isValueInBox(board, boxIndex, value)) {
                    reasons.push(`${value} already in box ${boxIndex + 1}`);
                }
                
                eliminated.push({
                    value: value,
                    reasons: reasons
                });
            }
        }
        
        return eliminated;
    }

    // Get suggested solving techniques
    getSuggestedTechniques(board, row, col) {
        const techniques = [];
        const possibleValues = this.getPossibleValues(board, row, col);
        
        if (possibleValues.length === 1) {
            techniques.push('Naked Single: Only one value possible');
        }
        
        if (possibleValues.length > 1) {
            techniques.push('Look for Hidden Singles in row, column, or box');
            techniques.push('Consider elimination techniques');
        }
        
        return techniques;
    }
}

export default HintSystem;