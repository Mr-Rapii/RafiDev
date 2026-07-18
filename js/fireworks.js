// ================================
// FIREWORKS EFFECTS SYSTEM
// High-performance fireworks and explosions
// ================================

/**
 * Fireworks system with particle pooling and performance optimization
 */

class FireworksSystem {
    constructor() {
        this.container = document.body;
        this.fireworks = [];
        this.animationFrameId = null;
        this.isAnimating = false;
        
        this.config = {
            particleCount: this.getOptimalParticleCount(),
            particleLife: 2000,
            colors: [
                { r: 255, g: 0, b: 136 },     // Pink
                { r: 0, g: 255, b: 136 },     // Green
                { r: 0, g: 102, b: 255 },     // Blue
                { r: 255, g: 0, b: 255 },     // Magenta
                { r: 0, g: 255, b: 255 },     // Cyan
                { r: 255, g: 255, b: 0 }      // Yellow
            ],
            gravity: 0.15,
            friction: 0.98
        };
        
        // Check for reduced motion preference
        this.prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        
        // Listen for visibility changes
        document.addEventListener('visibilitychange', () => this.handleVisibilityChange());
        
        console.log('🎆 Fireworks system initialized');
    }

    /**
     * Get optimal particle count based on device
     */
    getOptimalParticleCount() {
        if (navigator.deviceMemory) {
            if (navigator.deviceMemory < 4) return 20;
            if (navigator.deviceMemory < 8) return 50;
        }
        
        const ua = navigator.userAgent.toLowerCase();
        const isMobile = /iphone|ipad|ipod|android/.test(ua);
        
        if (isMobile) {
            return navigator.hardwareConcurrency && navigator.hardwareConcurrency < 4 ? 30 : 60;
        }
        
        return 100;
    }

    /**
     * Create firework burst at position
     */
    createFirework(x, y) {
        const firework = {
            x: x,
            y: y,
            particles: [],
            active: true
        };
        
        // Determine color
        const colorData = this.config.colors[Math.floor(Math.random() * this.config.colors.length)];
        const color = `rgb(${colorData.r}, ${colorData.g}, ${colorData.b})`;
        
        // Create particles
        for (let i = 0; i < this.config.particleCount; i++) {
            const angle = (i / this.config.particleCount) * Math.PI * 2;
            const velocity = 3 + Math.random() * 6;
            
            const particle = {
                x: x,
                y: y,
                vx: Math.cos(angle) * velocity,
                vy: Math.sin(angle) * velocity,
                life: 1,
                maxLife: 1,
                decay: 1 / (this.config.particleLife / 16.67),
                color: color,
                size: 3 + Math.random() * 4,
                dom: this.createParticleDom(x, y, color, 3 + Math.random() * 4)
            };
            
            firework.particles.push(particle);
        }
        
        this.fireworks.push(firework);
        this.startAnimation();
        
        return firework;
    }

    /**
     * Create particle DOM element
     */
    createParticleDom(x, y, color, size) {
        const particle = document.createElement('div');
        particle.style.position = 'fixed';
        particle.style.left = x + 'px';
        particle.style.top = y + 'px';
        particle.style.width = size + 'px';
        particle.style.height = size + 'px';
        particle.style.background = color;
        particle.style.borderRadius = '50%';
        particle.style.pointerEvents = 'none';
        particle.style.zIndex = '9999';
        particle.style.boxShadow = `0 0 ${size}px ${color}`;
        particle.style.opacity = '1';
        
        this.container.appendChild(particle);
        
        return particle;
    }

    /**
     * Burst fireworks - explosion effect
     */
    burst(x = window.innerWidth / 2, y = window.innerHeight / 2, count = 1) {
        if (this.prefersReducedMotion) {
            console.log('⏭️ Fireworks skipped - reduced motion preference');
            return;
        }
        
        for (let i = 0; i < count; i++) {
            setTimeout(() => {
                const offsetX = x + (Math.random() - 0.5) * 100;
                const offsetY = y + (Math.random() - 0.5) * 100;
                this.createFirework(offsetX, offsetY);
            }, i * 150);
        }
        
        console.log(`🎆 ${count} fireworks burst`);
    }

    /**
     * Fountain effect - continuous fireworks
     */
    fountain(x, y, duration = 3000) {
        if (this.prefersReducedMotion) return;
        
        const startTime = Date.now();
        
        const fire = () => {
            if (Date.now() - startTime < duration && !document.hidden) {
                this.createFirework(x + (Math.random() - 0.5) * 50, y);
                setTimeout(fire, 100);
            }
        };
        
        fire();
    }

    /**
     * Rain fireworks - falling bursts
     */
    rain(duration = 3000, intensity = 5) {
        if (this.prefersReducedMotion) return;
        
        const startTime = Date.now();
        
        const fall = () => {
            if (Date.now() - startTime < duration && !document.hidden) {
                for (let i = 0; i < intensity; i++) {
                    const x = Math.random() * window.innerWidth;
                    const y = Math.random() * (window.innerHeight * 0.5);
                    this.createFirework(x, y);
                }
                setTimeout(fall, 200);
            }
        };
        
        fall();
    }

    /**
     * Sky launch - fireworks shot upward
     */
    skyLaunch(x, y, count = 5) {
        if (this.prefersReducedMotion) return;
        
        for (let i = 0; i < count; i++) {
            setTimeout(() => {
                this.createFirework(
                    x + (Math.random() - 0.5) * 200,
                    y - Math.random() * 300
                );
            }, i * 200);
        }
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
        
        // Update fireworks
        for (let i = this.fireworks.length - 1; i >= 0; i--) {
            const firework = this.fireworks[i];
            
            // Update particles
            for (let j = firework.particles.length - 1; j >= 0; j--) {
                const particle = firework.particles[j];
                
                // Update physics
                particle.vy += this.config.gravity;
                particle.vx *= this.config.friction;
                particle.vy *= this.config.friction;
                
                particle.x += particle.vx;
                particle.y += particle.vy;
                
                // Update life
                particle.life -= particle.decay;
                
                // Remove if dead
                if (particle.life <= 0) {
                    particle.dom.remove();
                    firework.particles.splice(j, 1);
                    continue;
                }
                
                // Update DOM
                particle.dom.style.left = particle.x + 'px';
                particle.dom.style.top = particle.y + 'px';
                particle.dom.style.opacity = Math.max(0, particle.life);
            }
            
            // Remove firework if no particles
            if (firework.particles.length === 0) {
                this.fireworks.splice(i, 1);
            }
        }
        
        // Continue animation if fireworks remain
        if (this.fireworks.length > 0) {
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
        this.clear();
    }

    /**
     * Handle visibility changes
     */
    handleVisibilityChange() {
        if (document.hidden && this.isAnimating) {
            if (this.animationFrameId) {
                cancelAnimationFrame(this.animationFrameId);
            }
        } else if (!document.hidden && this.fireworks.length > 0) {
            this.animate();
        }
    }

    /**
     * Clear all fireworks
     */
    clear() {
        this.fireworks.forEach(firework => {
            firework.particles.forEach(particle => {
                if (particle.dom) particle.dom.remove();
            });
        });
        this.fireworks = [];
    }
}

// Global instance
const fireworksSystem = new FireworksSystem();

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = FireworksSystem;
}
