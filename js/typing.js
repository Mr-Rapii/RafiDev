// ================================
// TYPING EFFECT SYSTEM
// Typewriter animation for text display
// ================================

/**
 * Typing effect system with cursor animation and performance optimization
 */

class TypingEffect {
    constructor(options = {}) {
        this.options = {
            speed: options.speed || 50, // ms per character
            delay: options.delay || 0, // ms before starting
            cursor: options.cursor !== false, // Show cursor
            cursorChar: options.cursorChar || '|',
            onComplete: options.onComplete || null,
            ...options
        };
        
        this.element = null;
        this.text = '';
        this.currentIndex = 0;
        this.isTyping = false;
        this.isPaused = false;
        this.timeoutId = null;
        this.cursorElement = null;
        
        // Check for reduced motion preference
        this.prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        
        // Handle visibility
        document.addEventListener('visibilitychange', () => this.handleVisibilityChange());
        
        console.log('⌨️ Typing effect system initialized');
    }

    /**
     * Start typing effect on element
     */
    type(element, text, options = {}) {
        const mergedOptions = { ...this.options, ...options };
        
        this.element = element;
        this.text = text;
        this.options = mergedOptions;
        this.currentIndex = 0;
        this.isTyping = true;
        this.isPaused = false;
        
        // Clear element
        element.textContent = '';
        
        // Create cursor
        if (this.options.cursor) {
            this.cursorElement = document.createElement('span');
            this.cursorElement.className = 'typing-cursor';
            this.cursorElement.textContent = this.options.cursorChar;
            this.cursorElement.style.animation = 'blink 1s infinite';
            element.appendChild(this.cursorElement);
        }
        
        // Start with delay
        this.timeoutId = setTimeout(() => {
            this.typeCharacter();
        }, this.options.delay);
    }

    /**
     * Type one character
     */
    typeCharacter() {
        if (!this.isTyping || this.isPaused || document.hidden) {
            this.timeoutId = setTimeout(() => this.typeCharacter(), 100);
            return;
        }
        
        if (this.currentIndex < this.text.length) {
            const char = this.text[this.currentIndex];
            
            // Insert character before cursor
            if (this.cursorElement) {
                this.element.insertBefore(
                    document.createTextNode(char),
                    this.cursorElement
                );
            } else {
                this.element.textContent += char;
            }
            
            this.currentIndex++;
            
            // Calculate speed
            const speed = this.prefersReducedMotion ? 10 : this.options.speed;
            const charSpeed = char === ' ' ? speed * 0.5 : speed;
            
            this.timeoutId = setTimeout(() => this.typeCharacter(), charSpeed);
        } else {
            // Typing complete
            this.isTyping = false;
            
            // Remove cursor
            if (this.cursorElement) {
                this.cursorElement.remove();
                this.cursorElement = null;
            }
            
            if (this.options.onComplete) {
                this.options.onComplete();
            }
        }
    }

    /**
     * Pause typing
     */
    pause() {
        this.isPaused = true;
        console.log('⏸️ Typing paused');
    }

    /**
     * Resume typing
     */
    resume() {
        this.isPaused = false;
        if (this.isTyping) {
            this.typeCharacter();
        }
        console.log('▶️ Typing resumed');
    }

    /**
     * Stop typing
     */
    stop() {
        this.isTyping = false;
        if (this.timeoutId) {
            clearTimeout(this.timeoutId);
        }
        if (this.cursorElement) {
            this.cursorElement.remove();
        }
        console.log('⏹️ Typing stopped');
    }

    /**
     * Skip to end
     */
    skip() {
        this.stop();
        if (this.element) {
            this.element.textContent = this.text;
        }
        if (this.options.onComplete) {
            this.options.onComplete();
        }
    }

    /**
     * Handle visibility changes
     */
    handleVisibilityChange() {
        if (document.hidden) {
            this.pause();
        } else if (this.isTyping) {
            this.resume();
        }
    }
}

// Type multiple messages sequentially
class TypingSequence {
    constructor(element, messages = [], options = {}) {
        this.element = element;
        this.messages = messages;
        this.options = options;
        this.currentMessageIndex = 0;
        this.typing = new TypingEffect(options);
        this.isRunning = false;
    }

    /**
     * Start typing sequence
     */
    start() {
        this.isRunning = true;
        this.currentMessageIndex = 0;
        this.typeNext();
    }

    /**
     * Type next message
     */
    typeNext() {
        if (this.currentMessageIndex < this.messages.length) {
            const message = this.messages[this.currentMessageIndex];
            
            this.typing.type(this.element, message.text, {
                speed: message.speed || this.options.speed,
                delay: message.delay || 0,
                onComplete: () => {
                    this.currentMessageIndex++;
                    
                    // Pause before next message
                    const pauseTime = message.pause || 1000;
                    setTimeout(() => {
                        if (this.isRunning) {
                            this.element.textContent = '';
                            this.typeNext();
                        }
                    }, pauseTime);
                }
            });
        } else {
            this.isRunning = false;
            if (this.options.onComplete) {
                this.options.onComplete();
            }
        }
    }

    /**
     * Stop sequence
     */
    stop() {
        this.isRunning = false;
        this.typing.stop();
    }
}

// Initialize typing effect for hero text
document.addEventListener('DOMContentLoaded', () => {
    const typingElement = document.querySelector('.typing-text');
    if (typingElement && typingElement.textContent.trim()) {
        const text = typingElement.textContent.trim();
        typingElement.textContent = '';
        
        const typing = new TypingEffect({
            speed: 40,
            delay: 300,
            onComplete: () => {
                console.log('✅ Typing effect complete');
            }
        });
        
        typing.type(typingElement, text);
    }
});

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { TypingEffect, TypingSequence };
}
