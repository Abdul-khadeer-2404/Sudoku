// Fixed Difficulty management system for Sudoku game
class DifficultyManager {
    constructor() {
        this.currentDifficulty = 'medium';
        this.difficultySelect = null;
        this.difficultyDisplay = null;
        this.settings = {
            easy: {
                emptyCells: 40,      // ~49% empty
                maxHints: 5,
                timeLimit: 0,        // No time limit
                allowMistakes: true,
                highlightConflicts: true,
                showPossibleNumbers: true
            },
            medium: {
                emptyCells: 50,      // ~62% empty
                maxHints: 3,
                timeLimit: 0,        // No time limit
                allowMistakes: true,
                highlightConflicts: true,
                showPossibleNumbers: false
            },
            hard: {
                emptyCells: 58,      // ~72% empty
                maxHints: 2,
                timeLimit: 0,        // No time limit
                allowMistakes: true,
                highlightConflicts: true,
                showPossibleNumbers: false
            },
            expert: {
                emptyCells: 64,      // ~79% empty
                maxHints: 1,
                timeLimit: 0,        // No time limit
                allowMistakes: false,
                highlightConflicts: true,
                showPossibleNumbers: false
            }
        };

        // Initialize after DOM is ready
        this.initializeWhenReady();
    }

    // Initialize when DOM elements are ready
    async initializeWhenReady() {
        // Wait for DOM elements to be available
        const maxRetries = 50;
        let retries = 0;
        
        while (retries < maxRetries) {
            this.difficultySelect = document.getElementById('difficulty-select');
            this.difficultyDisplay = document.getElementById('current-difficulty');
            
            if (this.difficultySelect && this.difficultyDisplay) {
                this.initializeEventListeners();
                this.loadDifficulty();
                this.updateDisplay();
                console.log('Difficulty manager initialized successfully');
                break;
            }
            
            retries++;
            await new Promise(resolve => setTimeout(resolve, 100));
        }
        
        if (retries >= maxRetries) {
            console.warn('Could not find difficulty DOM elements');
        }
    }

    // Initialize event listeners
    initializeEventListeners() {
        if (this.difficultySelect) {
            this.difficultySelect.addEventListener('change', (e) => {
                this.setDifficulty(e.target.value);
            });
            
            // Set the select value to current difficulty
            this.difficultySelect.value = this.currentDifficulty;
        }
    }

    // Set the current difficulty
    setDifficulty(difficulty) {
        if (this.settings[difficulty]) {
            console.log('Setting difficulty to:', difficulty);
            this.currentDifficulty = difficulty;
            this.updateDisplay();
            this.saveDifficulty();
            
            // Update select element if it exists
            if (this.difficultySelect && this.difficultySelect.value !== difficulty) {
                this.difficultySelect.value = difficulty;
            }
            
            return true;
        }
        console.warn('Invalid difficulty:', difficulty);
        return false;
    }

    // Get current difficulty settings
    getCurrentSettings() {
        return { ...this.settings[this.currentDifficulty] };
    }

    // Update the difficulty display
    updateDisplay() {
        if (this.difficultyDisplay) {
            const displayText = this.currentDifficulty.charAt(0).toUpperCase() + 
                               this.currentDifficulty.slice(1);
            this.difficultyDisplay.textContent = displayText;
        }
    }

    // Save difficulty (using memory instead of localStorage for Claude.ai compatibility)
    saveDifficulty() {
        try {
            // Store in memory for this session
            window.sudokuDifficulty = this.currentDifficulty;
            console.log('Difficulty saved:', this.currentDifficulty);
        } catch (error) {
            console.warn('Could not save difficulty:', error);
        }
    }

    // Load difficulty (using memory instead of localStorage for Claude.ai compatibility)
    loadDifficulty() {
        try {
            // Try to load from memory
            const savedDifficulty = window.sudokuDifficulty;
            if (savedDifficulty && this.settings[savedDifficulty]) {
                this.setDifficulty(savedDifficulty);
                console.log('Difficulty loaded:', savedDifficulty);
            } else {
                console.log('No saved difficulty found, using default:', this.currentDifficulty);
            }
        } catch (error) {
            console.warn('Could not load difficulty:', error);
        }
    }

    // Get number of empty cells for current difficulty
    getEmptyCellsCount() {
        return this.settings[this.currentDifficulty].emptyCells;
    }

    // Get maximum hints for current difficulty
    getMaxHints() {
        return this.settings[this.currentDifficulty].maxHints;
    }

    // Get time limit for current difficulty
    getTimeLimit() {
        return this.settings[this.currentDifficulty].timeLimit;
    }

    // Check if mistakes are allowed for current difficulty
    areMistakesAllowed() {
        return this.settings[this.currentDifficulty].allowMistakes;
    }

    // Check if conflicts should be highlighted
    shouldHighlightConflicts() {
        return this.settings[this.currentDifficulty].highlightConflicts;
    }

    // Check if possible numbers should be shown
    shouldShowPossibleNumbers() {
        return this.settings[this.currentDifficulty].showPossibleNumbers;
    }

    // Get all available difficulties
    getAvailableDifficulties() {
        return Object.keys(this.settings);
    }

    // Update difficulty settings
    updateSettings(difficulty, newSettings) {
        if (this.settings[difficulty]) {
            this.settings[difficulty] = {
                ...this.settings[difficulty],
                ...newSettings
            };
            return true;
        }
        return false;
    }

    // Reset all settings to default
    resetSettings() {
        this.settings = {
            easy: {
                emptyCells: 40,
                maxHints: 5,
                timeLimit: 0,
                allowMistakes: true,
                highlightConflicts: true,
                showPossibleNumbers: true
            },
            medium: {
                emptyCells: 50,
                maxHints: 3,
                timeLimit: 0,
                allowMistakes: true,
                highlightConflicts: true,
                showPossibleNumbers: false
            },
            hard: {
                emptyCells: 58,
                maxHints: 2,
                timeLimit: 0,
                allowMistakes: true,
                highlightConflicts: true,
                showPossibleNumbers: false
            },
            expert: {
                emptyCells: 64,
                maxHints: 1,
                timeLimit: 0,
                allowMistakes: false,
                highlightConflicts: true,
                showPossibleNumbers: false
            }
        };
    }

    // Get difficulty statistics
    getDifficultyStats() {
        const stats = {};
        for (const [difficulty, settings] of Object.entries(this.settings)) {
            stats[difficulty] = {
                emptyPercentage: Math.round((settings.emptyCells / 81) * 100),
                hintCount: settings.maxHints,
                timeLimit: settings.timeLimit,
                allowsMistakes: settings.allowMistakes
            };
        }
        return stats;
    }

    // Get difficulty description
    getDifficultyDescription(difficulty = null) {
        const diff = difficulty || this.currentDifficulty;
        const settings = this.settings[diff];
        if (!settings) return '';
        
        const descriptions = {
            easy: 'Perfect for beginners - more clues, unlimited hints, and helpful features enabled.',
            medium: 'Balanced challenge - moderate number of clues with some assistance.',
            hard: 'For experienced players - fewer clues and limited hints.',
            expert: 'Ultimate challenge - minimal clues, very limited hints, no mistakes allowed!'
        };
        
        return descriptions[diff] || '';
    }

    // Check if current difficulty allows feature
    allowsFeature(feature) {
        const settings = this.getCurrentSettings();
        switch (feature) {
            case 'hints':
                return settings.maxHints > 0;
            case 'mistakes':
                return settings.allowMistakes;
            case 'conflicts':
                return settings.highlightConflicts;
            case 'possibleNumbers':
                return settings.showPossibleNumbers;
            default:
                return false;
        }
    }
}

// Export the DifficultyManager class
export default DifficultyManager;