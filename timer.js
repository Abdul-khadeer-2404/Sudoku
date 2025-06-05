// Timer functionality for Sudoku game

class GameTimer {
    constructor() {
        this.startTime = 0;
        this.elapsedTime = 0;
        this.timerInterval = null;
        this.isPaused = false;
        this.pauseStartTime = 0;
        this.totalPausedTime = 0;
        this.displayElement = document.getElementById('timer');
        this.bestTime = this.loadBestTime();
    }

    // Start the timer
    start() {
        if (this.timerInterval) {
            this.stop();
        }
        this.startTime = Date.now();
        this.totalPausedTime = 0;
        this.isPaused = false;
        this.updateDisplay();
        this.timerInterval = setInterval(() => this.updateDisplay(), 1000);
    }

    // Stop the timer
    stop() {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
        this.elapsedTime = this.getElapsedTime();
    }

    // Pause the timer
    pause() {
        if (!this.isPaused && this.timerInterval) {
            this.pauseStartTime = Date.now();
            this.isPaused = true;
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
    }

    // Resume the timer
    resume() {
        if (this.isPaused) {
            this.totalPausedTime += Date.now() - this.pauseStartTime;
            this.isPaused = false;
            this.updateDisplay();
            this.timerInterval = setInterval(() => this.updateDisplay(), 1000);
        }
    }

    // Reset the timer
    reset() {
        this.stop();
        this.startTime = 0;
        this.elapsedTime = 0;
        this.totalPausedTime = 0;
        this.isPaused = false;
        this.updateDisplay();
    }

    // Get elapsed time in milliseconds
    getElapsedTime() {
        if (this.isPaused) {
            return this.pauseStartTime - this.startTime - this.totalPausedTime;
        }
        return Date.now() - this.startTime - this.totalPausedTime;
    }

    // Update the display
    updateDisplay() {
        const time = this.getElapsedTime();
        const minutes = Math.floor(time / 60000);
        const seconds = Math.floor((time % 60000) / 1000);
        this.displayElement.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }

    // Get formatted time
    getFormattedTime() {
        const time = this.getElapsedTime();
        const minutes = Math.floor(time / 60000);
        const seconds = Math.floor((time % 60000) / 1000);
        return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }

    // Save best time
    saveBestTime(difficulty) {
        const currentTime = this.getElapsedTime();
        const key = `bestTime_${difficulty}`;
        
        if (!this.bestTime[difficulty] || currentTime < this.bestTime[difficulty]) {
            this.bestTime[difficulty] = currentTime;
            localStorage.setItem(key, currentTime.toString());
            return true;
        }
        return false;
    }

    // Load best time from localStorage
    loadBestTime() {
        const difficulties = ['easy', 'medium', 'hard', 'expert'];
        const bestTimes = {};
        
        difficulties.forEach(difficulty => {
            const time = localStorage.getItem(`bestTime_${difficulty}`);
            if (time) {
                bestTimes[difficulty] = parseInt(time);
            }
        });
        
        return bestTimes;
    }

    // Get formatted best time for a difficulty
    getFormattedBestTime(difficulty) {
        const time = this.bestTime[difficulty];
        if (!time) return '--:--';
        
        const minutes = Math.floor(time / 60000);
        const seconds = Math.floor((time % 60000) / 1000);
        return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }

    // Check if current time is better than best time
    isNewBestTime(difficulty) {
        const currentTime = this.getElapsedTime();
        return !this.bestTime[difficulty] || currentTime < this.bestTime[difficulty];
    }
}

// Global timer instance
let gameTimer = null;

// Initialize timer
function initializeTimer() {
    const timerDisplay = document.getElementById('timer');
    gameTimer = new GameTimer(timerDisplay);
}

// Start timer
function startTimer() {
    if (!gameTimer) {
        initializeTimer();
    }
    gameTimer.start();
}

// Stop timer
function stopTimer() {
    if (gameTimer) {
        gameTimer.stop();
    }
}

// Pause timer
function pauseTimer() {
    if (gameTimer) {
        gameTimer.pause();
    }
}

// Resume timer
function resumeTimer() {
    if (gameTimer) {
        gameTimer.resume();
    }
}

// Reset timer
function resetTimer() {
    if (gameTimer) {
        gameTimer.reset();
    }
}

// Get current time
function getCurrentTime() {
    if (gameTimer) {
        return gameTimer.getFormattedTime();
    }
    return '00:00';
}

// Get elapsed seconds
function getElapsedSeconds() {
    if (gameTimer) {
        return gameTimer.getElapsedTime();
    }
    return 0;
}

// Timer utilities
const TimerUtils = {
    // Format seconds to MM:SS
    formatTime(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    },

    // Format seconds to detailed string
    formatDetailedTime(seconds) {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const remainingSeconds = seconds % 60;

        if (hours > 0) {
            return `${hours}h ${minutes}m ${remainingSeconds}s`;
        } else if (minutes > 0) {
            return `${minutes}m ${remainingSeconds}s`;
        } else {
            return `${remainingSeconds}s`;
        }
    },

    // Convert MM:SS to seconds
    parseTime(timeString) {
        const [minutes, seconds] = timeString.split(':').map(Number);
        return minutes * 60 + seconds;
    },

    // Get performance rating based on time and difficulty
    getPerformanceRating(seconds, difficulty) {
        const benchmarks = {
            easy: { excellent: 180, good: 300, average: 600 },
            medium: { excellent: 300, good: 480, average: 900 },
            hard: { excellent: 600, good: 900, average: 1800 },
            expert: { excellent: 900, good: 1500, average: 2700 }
        };

        const bench = benchmarks[difficulty] || benchmarks.medium;

        if (seconds <= bench.excellent) return 'Excellent';
        if (seconds <= bench.good) return 'Good';
        if (seconds <= bench.average) return 'Average';
        return 'Practice More';
    }
};

// Auto-save timer state (for page refresh scenarios)
function saveTimerState() {
    if (gameTimer && gameTimer.isRunning) {
        const state = {
            elapsedTime: gameTimer.getElapsedTime(),
            isRunning: gameTimer.isRunning,
            isPaused: gameTimer.isPaused,
            timestamp: Date.now()
        };
        sessionStorage.setItem('timerState', JSON.stringify(state));
    }
}

// Restore timer state
function restoreTimerState() {
    const savedState = sessionStorage.getItem('timerState');
    if (savedState) {
        const state = JSON.parse(savedState);
        // Only restore if saved within last 30 minutes
        if (Date.now() - state.timestamp < 30 * 60 * 1000) {
            if (!gameTimer) {
                initializeTimer();
            }
            gameTimer.elapsedTime = state.elapsedTime * 1000;
            if (state.isRunning && !state.isPaused) {
                gameTimer.start();
            }
        }
        sessionStorage.removeItem('timerState');
    }
}

// Save timer state before page unload
window.addEventListener('beforeunload', saveTimerState);

// Initialize timer on DOM load
document.addEventListener('DOMContentLoaded', function() {
    initializeTimer();
    // Restore timer state if available
    restoreTimerState();
});

// Export the GameTimer class
export default GameTimer;