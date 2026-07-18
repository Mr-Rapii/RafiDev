// ================================
// CONFETTI EFFECTS SYSTEM
// Performance-optimized confetti animations
// ================================

/**
 * Confetti system with performance optimization and mobile support
 */

class ConfettiSystem {
    constructor() {
        this.container = document.body;
        this.confetti = [];
        this.animationFrameId = null;
        this.isAnimating = false;
        
        this.config = {
            particleCount: this.getOptimalParticleCount(),
            duration: 3000,
            colors: ['#00ff88', '#0066ff', '#ff00ff', '#00ffff', '#ff0080', '#ffff00'],
            minSize: 5,
            maxSize: 15,
            minVelocity: 2,
            maxVelocity: 8,
            gravity: 0.1,
            wind: 0.05
        };
        
        // Check for reduced motion preference
        this.prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        
        // Listen for visibility changes
        document.addEventListener('visibilitychange', () => this.handleVisibilityChange());
        
        console.log('🎉 Confetti system initialized');
    }

    /**
     * Get optimal particle count based on device
     */
    getOptimalParticleCount() {
        // Check device memory
        if (navigator.deviceMemory) {
            if (navigator.deviceMemory < 4) return 30;
            if (navigator.deviceMemory < 8) return 80;
        }
        
        // Check for mobile/low-end devices
        const ua = navigator.userAgent.toLowerCase();
        const isMobile = /iphone|ipad|ipod|android/.test(ua);
        
        if (isMobile) {
            return navigator.hardwareConcurrency && navigator.hardwareConcurrency < 4 ? 40 : 80;
        }
        
        return 150;
    }

    /**
     * Create single confetti piece
     */
    createConfetti(x, y) {
        const confetti = document.createElement('div');
        const size = this.config.minSize + Math.random() * (this.config.maxSize - this.config.minSize);
        const color = this.config.colors[Math.floor(Math.random() * this.config.colors.length)];
        
        confetti.style.position = 'fixed';
        confetti.style.left = x + 'px';
        confetti.style.top = y + 'px';
        confetti.style.width = size + 'px';
        confetti.style.height = size + 'px';
        confetti.style.background = color;
        confetti.style.pointerEvents = 'none';
        confetti.style.zIndex = '9999';
        confetti.style.transform = `translate(-50%, -50%) rotate(${Math.random() * 360}deg)`;
        confetti.style.borderRadius = Math.random() > 0.5 ? '50%' : '0%';
        confetti.style.opacity = '1';
        confetti.style.boxShadow = `0 0 ${size * 0.5}px ${color}`;
        
        // Physics properties
        confetti.userData = {
            x: x,
            y: y,
            vx: (Math.random() - 0.5) * this.config.maxVelocity,
            vy: -Math.random() * this.config.maxVelocity - 2,
            rotation: Math.random() * 360,
            rotationVelocity: (Math.random() - 0.5) * 10,
            size: size,
            color: color,
            life: 1,
            decay: 1 / (this.config.duration / 16.67) // Decay over duration
        };
        
        this.container.appendChild(confetti);
        this.confetti.push(confetti);
        
        return confetti;
    }

    /**
     * Burst confetti from a point
     */
    burst(x = window.innerWidth / 2, y = window.innerHeight / 2, count = null) {
        if (this.prefersReducedMotion) {
            console.log('⏭️ Confetti skipped - reduced motion preference');
            return;
        }
        
        const particleCount = count || this.config.particleCount;
        
        for (let i = 0; i < particleCount; i++) {
            this.createConfetti(x, y);
        }
        
        this.startAnimation();
        console.log(`🎉 Confetti burst with ${particleCount} particles`);
    }

    /**
     * Cannon mode - continuous firing
     */
    cannon(x, y, duration = 2000, fireRate = 20) {
        if (this.prefersReducedMotion) return;
        
        const startTime = Date.now();
        
        const fire = () => {
            if (Date.now() - startTime < duration) {
                for (let i = 0; i < fireRate; i++) {
                    this.createConfetti(x, y);
                }
                setTimeout(fire, 50);
            } else {
                this.startAnimation();
            }
        };
        
        fire();
    }

    /**
     * Rain mode - gentle falling confetti
     */
    rain(duration = 3000, rate = 10) {
        if (this.prefersReducedMotion) return;
        
        const startTime = Date.now();
        this.config.maxVelocity = 2;
        this.config.gravity = 0.05;
        
        const fall = () => {
            if (Date.now() - startTime < duration) {
                for (let i = 0; i < rate; i++) {
                    const x = Math.random() * window.innerWidth;
                    this.createConfetti(x, -20);
                }
                setTimeout(fall, 200);
            } else {
                this.startAnimation();
                // Restore defaults
                this.config.maxVelocity = 8;
                this.config.gravity = 0.1;
            }
        };
        
        fall();
    }

    /**
     * Start animation loop
     */
    startAnimation() {
        if (this.isAnimating) return;
        
        this.isAnimating = true;
        this.animate();
    }

    /**
     * Animation loop
     */
    animate() {
        if (!this.isAnimating || document.hidden) {
            this.animationFrameId = requestAnimationFrame(() => this.animate());
            return;
        }
        
        // Update confetti
        for (let i = this.confetti.length - 1; i >= 0; i--) {
            const confetti = this.confetti[i];
            const data = confetti.userData;
            
            // Update physics
            data.vy += this.config.gravity;
            data.vx += (Math.random() - 0.5) * this.config.wind;
            
            data.x += data.vx;
            data.y += data.vy;
            data.rotation += data.rotationVelocity;
            
            // Update opacity
            data.life -= data.decay;
            
            // Remove if dead
            if (data.life <= 0 || data.y > window.innerHeight + 100) {
                confetti.remove();
                this.confetti.splice(i, 1);
                continue;
            }
            
            // Update DOM
            confetti.style.left = data.x + 'px';
            confetti.style.top = data.y + 'px';
            confetti.style.transform = `translate(-50%, -50%) rotate(${data.rotation}deg)`;
            confetti.style.opacity = Math.max(0, data.life);
        }
        
        // Continue animation if confetti remains
        if (this.confetti.length > 0) {
            this.animationFrameId = requestAnimationFrame(() => this.animate());
        } else {
            this.isAnimating = false;
        }
    }

    /**
     * Stop all animations
     */
    stop() {
        this.isAnimating = false;
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
        }
        this.confetti.forEach(c => c.remove());
        this.confetti = [];
    }

    /**
     * Handle visibility changes
     */
    handleVisibilityChange() {
        if (document.hidden && this.isAnimating) {
            if (this.animationFrameId) {
                cancelAnimationFrame(this.animationFrameId);
            }
        } else if (!document.hidden && this.confetti.length > 0) {
            this.animate();
        }
    }

    /**
     * Clear all confetti
     */
    clear() {
        this.confetti.forEach(c => c.remove());
        this.confetti = [];
    }
}

// Global instance
const confettiSystem = new ConfettiSystem();

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ConfettiSystem;
}
