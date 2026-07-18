// ================================
// COUNTDOWN TIMER SYSTEM
// Real-time birthday countdown with celebrations
// ================================

/**
 * Birthday countdown system with real-time updates and celebration triggering
 */

class CountdownTimer {
    constructor(options = {}) {
        this.targetDate = options.targetDate || this.getNextBirthday();
        this.timezone = options.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone;
        
        this.elements = {
            days: document.getElementById('countdownDays'),
            hours: document.getElementById('countdownHours'),
            minutes: document.getElementById('countdownMinutes'),
            seconds: document.getElementById('countdownSeconds')
        };
        
        this.state = {
            isRunning: true,
            hasCelebrated: false,
            lastValues: { days: 0, hours: 0, minutes: 0, seconds: 0 }
        };
        
        this.onCelebrate = options.onCelebrate || null;
        this.updateFrequency = options.updateFrequency || 1000; // ms
        this.lastUpdateTime = 0;
        
        this.setupListeners();
        this.update();
        
        console.log('⏱️ Countdown timer initialized for', this.targetDate);
    }

    /**
     * Get next birthday (current year or next year)
     */
    getNextBirthday() {
        // Raffi's birthday: November 24
        const today = new Date();
        const thisYear = new Date(today.getFullYear(), 10, 24); // Month is 0-indexed
        
        if (today > thisYear) {
            return new Date(today.getFullYear() + 1, 10, 24);
        }
        return thisYear;
    }

    /**
     * Setup event listeners
     */
    setupListeners() {
        // Handle visibility changes
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this.pause();
            } else {
                this.resume();
            }
        });
    }

    /**
     * Calculate time remaining
     */
    calculateTimeRemaining() {
        const now = new Date();
        const difference = this.targetDate - now;
        
        if (difference <= 0) {
            return { days: 0, hours: 0, minutes: 0, seconds: 0, isComplete: true };
        }
        
        const days = Math.floor(difference / (1000 * 60 * 60 * 24));
        const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((difference % (1000 * 60)) / 1000);
        
        return { days, hours, minutes, seconds, isComplete: false };
    }

    /**
     * Update countdown display with animation
     */
    update() {
        if (!this.state.isRunning) return;
        
        const time = this.calculateTimeRemaining();
        
        // Update DOM elements with animation
        this.updateElement(this.elements.days, time.days, this.state.lastValues.days);
        this.updateElement(this.elements.hours, time.hours, this.state.lastValues.hours);
        this.updateElement(this.elements.minutes, time.minutes, this.state.lastValues.minutes);
        this.updateElement(this.elements.seconds, time.seconds, this.state.lastValues.seconds);
        
        // Store last values
        this.state.lastValues = { ...time };
        
        // Check if celebration time
        if (time.isComplete && !this.state.hasCelebrated) {
            this.celebrate();
        }
        
        // Schedule next update
        const now = Date.now();
        const timeToNextSecond = 1000 - (now % 1000);
        
        setTimeout(() => this.update(), Math.min(timeToNextSecond, this.updateFrequency));
    }

    /**
     * Update individual element with flip animation
     */
    updateElement(element, newValue, oldValue) {
        if (!element) return;
        
        const formattedValue = String(newValue).padStart(2, '0');
        
        if (newValue !== oldValue) {
            // Add animation class
            element.classList.add('flip-animation');
            element.textContent = formattedValue;
            
            // Remove animation class after animation
            setTimeout(() => {
                element.classList.remove('flip-animation');
            }, 600);
        } else {
            element.textContent = formattedValue;
        }
    }

    /**
     * Trigger birthday celebration
     */
    celebrate() {
        this.state.hasCelebrated = true;
        this.pause();
        
        console.log('🎉 HAPPY BIRTHDAY! Celebration triggered!');
        
        // Dispatch custom event
        const event = new CustomEvent('birthday:celebrate', {
            detail: { timestamp: Date.now() }
        });
        document.dispatchEvent(event);
        
        // Call custom callback
        if (this.onCelebrate) {
            this.onCelebrate();
        }
        
        // Trigger effects
        this.triggerCelebrationEffects();
    }

    /**
     * Trigger all celebration effects
     */
    triggerCelebrationEffects() {
        // Confetti burst
        if (typeof confettiSystem !== 'undefined') {
            confettiSystem.burst(window.innerWidth / 2, window.innerHeight / 2, 200);
            setTimeout(() => confettiSystem.burst(window.innerWidth / 4, window.innerHeight / 3, 100), 500);
            setTimeout(() => confettiSystem.burst((window.innerWidth * 3) / 4, window.innerHeight / 3, 100), 1000);
        }
        
        // Fireworks burst
        if (typeof fireworksSystem !== 'undefined') {
            fireworksSystem.burst(window.innerWidth / 2, window.innerHeight / 3, 10);
        }
        
        // Aurora effect
        if (typeof threeSceneManager !== 'undefined' && threeSceneManager) {
            threeSceneManager.triggerAuroraEffect();
            threeSceneManager.spawnShootingStars(20);
        }
        
        // Music player
        if (typeof musicPlayer !== 'undefined' && musicPlayer) {
            musicPlayer.play();
        }
    }

    /**
     * Pause countdown
     */
    pause() {
        this.state.isRunning = false;
        console.log('⏸️ Countdown paused');
    }

    /**
     * Resume countdown
     */
    resume() {
        this.state.isRunning = true;
        this.update();
        console.log('▶️ Countdown resumed');
    }

    /**
     * Set new target date
     */
    setTargetDate(date) {
        this.targetDate = new Date(date);
        this.state.hasCelebrated = false;
        console.log('📅 Target date updated to', this.targetDate);
    }

    /**
     * Get countdown info
     */
    getInfo() {
        const time = this.calculateTimeRemaining();
        return {
            targetDate: this.targetDate,
            timeRemaining: time,
            isRunning: this.state.isRunning,
            hasCelebrated: this.state.hasCelebrated
        };
    }
}

// Global instance
let countdownTimer = null;

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', () => {
    if (!countdownTimer) {
        countdownTimer = new CountdownTimer({
            onCelebrate: () => {
                // Additional celebration logic
            }
        });
    }
});

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CountdownTimer;
}