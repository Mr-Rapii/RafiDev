// ================================
// PARTICLES & EFFECTS SYSTEM
// Confetti, Ripples, and Interactive Particles
// ================================

/**
 * Particle effects system for various interactive elements
 */

class ParticleEffects {
    constructor() {
        this.particles = [];
        this.container = document.body;
        this.config = {
            particleSize: 10,
            particleLife: 1000,
            particleCount: 30,
            colors: ['#00ff88', '#0066ff', '#ff00ff', '#00ffff', '#ff0080']
        };
    }

    /**
     * Create ripple effect at mouse position
     */
    createRipple(x, y) {
        const ripple = document.createElement('div');
        ripple.style.position = 'fixed';
        ripple.style.left = x + 'px';
        ripple.style.top = y + 'px';
        ripple.style.width = '20px';
        ripple.style.height = '20px';
        ripple.style.borderRadius = '50%';
        ripple.style.border = '2px solid #00ff88';
        ripple.style.pointerEvents = 'none';
        ripple.style.transform = 'translate(-50%, -50%)';
        ripple.style.zIndex = '10000';
        ripple.style.animation = 'rippleEffect 0.6s ease-out forwards';
        
        this.container.appendChild(ripple);
        
        setTimeout(() => ripple.remove(), 600);
    }

    /**
     * Create floating particles (hearts, stars, etc)
     */
    createFloatingParticles(x, y, type = 'star', count = 5) {
        for (let i = 0; i < count; i++) {
            const particle = document.createElement('div');
            particle.style.position = 'fixed';
            particle.style.left = x + 'px';
            particle.style.top = y + 'px';
            particle.style.pointerEvents = 'none';
            particle.style.zIndex = '9999';
            particle.style.fontSize = '20px';
            particle.style.animation = `floatUp ${2 + Math.random() * 1}s ease-out forwards`;
            
            const angle = (i / count) * Math.PI * 2;
            const distance = 100;
            const tx = Math.cos(angle) * distance;
            const ty = Math.sin(angle) * distance;
            
            particle.style.setProperty('--tx', tx + 'px');
            particle.style.setProperty('--ty', ty + 'px');
            
            if (type === 'heart') {
                particle.textContent = '❤️';
            } else if (type === 'star') {
                particle.textContent = '⭐';
            } else if (type === 'sparkle') {
                particle.textContent = '✨';
            }
            
            this.container.appendChild(particle);
            
            setTimeout(() => particle.remove(), (2 + Math.random() * 1) * 1000);
        }
    }

    /**
     * Create mouse trail effect
     */
    createMouseTrail(x, y) {
        const trail = document.createElement('div');
        trail.style.position = 'fixed';
        trail.style.left = x + 'px';
        trail.style.top = y + 'px';
        trail.style.width = '8px';
        trail.style.height = '8px';
        trail.style.borderRadius = '50%';
        trail.style.background = `radial-gradient(circle, ${this.config.colors[Math.floor(Math.random() * this.config.colors.length)]}, transparent)`;
        trail.style.pointerEvents = 'none';
        trail.style.zIndex = '9998';
        trail.style.opacity = '0.7';
        trail.style.transform = 'translate(-50%, -50%)';
        trail.style.animation = 'fadeOut 0.5s ease-out forwards';
        
        this.container.appendChild(trail);
        
        setTimeout(() => trail.remove(), 500);
    }

    /**
     * Create bubble effect
     */
    createBubble(x, y) {
        const bubble = document.createElement('div');
        const size = 20 + Math.random() * 40;
        
        bubble.style.position = 'fixed';
        bubble.style.left = x + 'px';
        bubble.style.top = y + 'px';
        bubble.style.width = size + 'px';
        bubble.style.height = size + 'px';
        bubble.style.borderRadius = '50%';
        bubble.style.border = '2px solid rgba(0, 255, 136, 0.5)';
        bubble.style.pointerEvents = 'none';
        bubble.style.zIndex = '9997';
        bubble.style.transform = 'translate(-50%, -50%)';
        bubble.style.animation = `bubbleRise ${2 + Math.random() * 1}s ease-out forwards`;
        
        this.container.appendChild(bubble);
        
        setTimeout(() => bubble.remove(), (2 + Math.random() * 1) * 1000);
    }

    /**
     * Create glow pulse effect
     */
    createGlowPulse(element) {
        if (!element) return;
        
        const pulse = document.createElement('div');
        pulse.style.position = 'absolute';
        pulse.style.top = '0';
        pulse.style.left = '0';
        pulse.style.right = '0';
        pulse.style.bottom = '0';
        pulse.style.borderRadius = window.getComputedStyle(element).borderRadius;
        pulse.style.background = 'radial-gradient(circle, rgba(0, 255, 136, 0.5), transparent)';
        pulse.style.pointerEvents = 'none';
        pulse.style.animation = 'glowPulse 1s ease-out forwards';
        
        element.style.position = 'relative';
        element.appendChild(pulse);
        
        setTimeout(() => pulse.remove(), 1000);
    }

    /**
     * Create text pop effect (like "+1")
     */
    createTextPop(x, y, text = '+1') {
        const textPop = document.createElement('div');
        textPop.style.position = 'fixed';
        textPop.style.left = x + 'px';
        textPop.style.top = y + 'px';
        textPop.style.pointerEvents = 'none';
        textPop.style.zIndex = '9999';
        textPop.style.fontSize = '24px';
        textPop.style.fontWeight = 'bold';
        textPop.style.color = '#00ff88';
        textPop.style.textShadow = '0 0 10px rgba(0, 255, 136, 0.8)';
        textPop.style.animation = 'textPopUp 1s ease-out forwards';
        textPop.style.transform = 'translate(-50%, -50%)';
        textPop.textContent = text;
        
        this.container.appendChild(textPop);
        
        setTimeout(() => textPop.remove(), 1000);
    }

    /**
     * Create shake effect
     */
    createShake(element, intensity = 5, duration = 500) {
        const originalTransform = element.style.transform;
        let startTime = Date.now();
        
        const shake = () => {
            const elapsed = Date.now() - startTime;
            
            if (elapsed < duration) {
                const offset = (Math.random() - 0.5) * intensity;
                element.style.transform = originalTransform + ` translateX(${offset}px)`;
                requestAnimationFrame(shake);
            } else {
                element.style.transform = originalTransform;
            }
        };
        
        shake();
    }

    /**
     * Create confetti burst
     */
    createConfettiBurst(x, y, count = 50) {
        for (let i = 0; i < count; i++) {
            const confetti = document.createElement('div');
            const size = 5 + Math.random() * 10;
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
            
            const angle = (i / count) * Math.PI * 2;
            const velocity = 3 + Math.random() * 5;
            const tx = Math.cos(angle) * velocity * 30;
            const ty = Math.sin(angle) * velocity * 30 - 50;
            
            confetti.style.animation = `confettiFloat ${3 + Math.random() * 1}s ease-out forwards`;
            confetti.style.setProperty('--tx', tx + 'px');
            confetti.style.setProperty('--ty', ty + 'px');
            
            this.container.appendChild(confetti);
            
            setTimeout(() => confetti.remove(), (3 + Math.random() * 1) * 1000);
        }
    }

    /**
     * Create rain effect
     */
    createRainEffect(duration = 2000) {
        for (let i = 0; i < 20; i++) {
            setTimeout(() => {
                const drop = document.createElement('div');
                const x = Math.random() * window.innerWidth;
                
                drop.style.position = 'fixed';
                drop.style.left = x + 'px';
                drop.style.top = '-10px';
                drop.style.width = '2px';
                drop.style.height = '10px';
                drop.style.background = 'rgba(0, 255, 136, 0.5)';
                drop.style.pointerEvents = 'none';
                drop.style.zIndex = '9998';
                drop.style.animation = `rainFall ${1 + Math.random() * 0.5}s linear forwards`;
                
                this.container.appendChild(drop);
                
                setTimeout(() => drop.remove(), (1 + Math.random() * 0.5) * 1000);
            }, i * 100);
        }
    }

    /**
     * Create wave effect
     */
    createWaveEffect(startX, startY) {
        const waves = 3;
        for (let i = 0; i < waves; i++) {
            setTimeout(() => {
                const wave = document.createElement('div');
                const size = 30 + i * 20;
                
                wave.style.position = 'fixed';
                wave.style.left = startX + 'px';
                wave.style.top = startY + 'px';
                wave.style.width = size + 'px';
                wave.style.height = size + 'px';
                wave.style.borderRadius = '50%';
                wave.style.border = '2px solid rgba(0, 255, 136, 0.6)';
                wave.style.pointerEvents = 'none';
                wave.style.zIndex = '9997';
                wave.style.transform = 'translate(-50%, -50%)';
                wave.style.animation = `waveExpand ${0.8 + i * 0.2}s ease-out forwards`;
                
                this.container.appendChild(wave);
                
                setTimeout(() => wave.remove(), (0.8 + i * 0.2) * 1000);
            }, i * 150);
        }
    }
}

// Initialize particle effects
const particleEffects = new ParticleEffects();

// Export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ParticleEffects;
}
