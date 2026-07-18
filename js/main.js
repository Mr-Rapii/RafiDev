// ================================
// MAIN APPLICATION INITIALIZATION
// Integration of all modules and features
// ================================

/**
 * Main application controller
 */

class BirthdayApp {
    constructor() {
        this.initModules();
        this.setupEventListeners();
        this.setupLetterSection();
        this.setupSurpriseSection();
        this.setupContactForm();
        this.setupWishesSection();
        
        console.log('🎉 Birthday App initialized');
    }

    /**
     * Initialize all modules
     */
    initModules() {
        // Loading screen
        this.initLoadingScreen();
    }

    /**
     * Initialize loading screen
     */
    initLoadingScreen() {
        const loadingScreen = document.getElementById('loadingScreen');
        const progressFill = loadingScreen.querySelector('.progress-fill');
        const loadingPercent = document.getElementById('loadingPercent');
        
        let progress = 0;
        const interval = setInterval(() => {
            progress += Math.random() * 30;
            if (progress > 100) progress = 100;
            
            progressFill.style.width = progress + '%';
            loadingPercent.textContent = Math.floor(progress);
            
            if (progress >= 100) {
                clearInterval(interval);
                this.hideLoadingScreen();
            }
        }, 200);
    }

    /**
     * Hide loading screen
     */
    hideLoadingScreen() {
        const loadingScreen = document.getElementById('loadingScreen');
        setTimeout(() => {
            loadingScreen.classList.add('hidden');
            console.log('✅ Loading complete');
        }, 500);
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Listen for birthday celebration
        document.addEventListener('birthday:celebrate', () => {
            this.onBirthdayCelebrate();
        });
    }

    /**
     * Handle birthday celebration
     */
    onBirthdayCelebrate() {
        console.log('🎊 Happy Birthday Celebration!');
        
        // Create special message
        const message = document.createElement('div');
        message.style.position = 'fixed';
        message.style.top = '50%';
        message.style.left = '50%';
        message.style.transform = 'translate(-50%, -50%)';
        message.style.fontSize = '3rem';
        message.style.zIndex = '10000';
        message.style.animation = 'slideUpIn 1s ease';
        message.textContent = '🎉 SELAMAT ULANG TAHUN RAFFI! 🎉';
        
        document.body.appendChild(message);
        
        setTimeout(() => message.remove(), 3000);
    }

    /**
     * Setup letter section
     */
    setupLetterSection() {
        const letterText = document.querySelector('.letter-text');
        const letterButton = document.querySelector('.letter-button');
        
        if (letterText) {
            const fullLetter = `
Raffi, Sayang,

Selamat ulang tahun untuk kamu di usia 16 tahun yang indah ini!

Sepanjang perjalananmu, kamu telah menunjukkan dedikasi luar biasa, kreativitas yang tak terbatas, dan semangat yang menginspirasi banyak orang. Dari menjadi web developer hingga content creator, kamu terus berkembang dan mencapai hal-hal yang amazing.

Di hari istimewa ini, aku ingin mengingatkanmu bahwa setiap langkahmu penting, setiap impianmu layak diperjuangkan, dan setiap pencapaianmu patut dibanggakan.

Semoga tahun ini membawamu lebih dekat dengan mimpi-mimpimu, memberimu kesehatan yang sempurna, kebahagiaan yang melimpah, keberkahan dalam setiap usaha, dan kesuksesan yang gemilang.

Terus bersinar, Raffi! Dunia membutuhkan orang-orang sepertimu.

With love and infinite wishes,
Your Birthday Gift Generator 🎁`;
            
            const typing = new TypingEffect({
                speed: 30,
                delay: 500
            });
            
            typing.type(letterText, fullLetter);
        }
        
        if (letterButton) {
            letterButton.addEventListener('click', () => {
                particleEffects.createFloatingParticles(letterButton.getBoundingClientRect().left + letterButton.offsetWidth / 2, letterButton.getBoundingClientRect().top + letterButton.offsetHeight / 2, 'heart', 10);
                fireworksSystem.burst(window.innerWidth / 2, window.innerHeight / 2, 3);
            });
        }
    }

    /**
     * Setup surprise section
     */
    setupSurpriseSection() {
        // Blow candles button
        const blowButton = document.getElementById('blowCandlesBtn');
        if (blowButton) {
            blowButton.addEventListener('click', () => {
                const candles = document.querySelectorAll('.candle');
                candles.forEach(candle => {
                    const flame = candle.querySelector('.flame');
                    if (flame) {
                        flame.style.display = 'none';
                    }
                });
                
                confettiSystem.burst(window.innerWidth / 2, window.innerHeight / 2, 100);
                fireworksSystem.burst(window.innerWidth / 2, window.innerHeight / 3, 5);
                
                if (musicPlayer && !musicPlayer.isPlaying) {
                    musicPlayer.play();
                }
                
                setTimeout(() => {
                    candles.forEach(candle => {
                        const flame = candle.querySelector('.flame');
                        if (flame) {
                            flame.style.display = 'block';
                        }
                    });
                }, 2000);
            });
        }
        
        // Open gift button
        const openGiftBtn = document.getElementById('openGiftBtn');
        if (openGiftBtn) {
            openGiftBtn.addEventListener('click', () => {
                const giftBox = document.getElementById('giftBox');
                giftBox.style.animation = 'shakeHeavy 0.5s';
                
                setTimeout(() => {
                    confettiSystem.burst(window.innerWidth / 2, window.innerHeight / 2, 150);
                    fireworksSystem.burst(window.innerWidth / 2, window.innerHeight / 2, 8);
                    
                    if (typeof threeSceneManager !== 'undefined' && threeSceneManager) {
                        threeSceneManager.triggerAuroraEffect();
                    }
                }, 250);
            });
        }
        
        // Pop balloons button
        const popBalloonsBtn = document.getElementById('popBalloonsBtn');
        if (popBalloonsBtn) {
            popBalloonsBtn.addEventListener('click', () => {
                const balloons = document.querySelectorAll('.balloon');
                balloons.forEach((balloon, index) => {
                    setTimeout(() => {
                        balloon.style.opacity = '0';
                        particleEffects.createFloatingParticles(
                            window.innerWidth / 2 + (Math.random() - 0.5) * 200,
                            window.innerHeight / 2 + (Math.random() - 0.5) * 200,
                            'sparkle',
                            5
                        );
                    }, index * 100);
                });
                
                confettiSystem.burst(window.innerWidth / 2, window.innerHeight / 2, 100);
            });
        }
    }

    /**
     * Setup contact form
     */
    setupContactForm() {
        const contactForm = document.getElementById('contactForm');
        const contactSuccess = document.getElementById('contactSuccess');
        
        if (contactForm) {
            contactForm.addEventListener('submit', (e) => {
                e.preventDefault();
                
                const name = document.getElementById('contactName').value;
                const email = document.getElementById('contactEmail').value;
                const message = document.getElementById('contactMessage').value;
                
                if (name && email && message) {
                    // Show success message
                    contactForm.style.display = 'none';
                    contactSuccess.style.display = 'block';
                    
                    particleEffects.createFloatingParticles(
                        window.innerWidth / 2,
                        window.innerHeight / 2,
                        'star',
                        15
                    );
                    
                    // Reset form after 3 seconds
                    setTimeout(() => {
                        contactForm.reset();
                        contactForm.style.display = 'block';
                        contactSuccess.style.display = 'none';
                    }, 3000);
                    
                    console.log('📧 Message sent:', { name, email, message });
                }
            });
        }
    }

    /**
     * Setup wishes section
     */
    setupWishesSection() {
        const wishesContainer = document.getElementById('wishesContainer');
        
        if (wishesContainer) {
            const wishes = [
                { name: 'Keluarga', text: 'Semoga tahun ini dipenuhi dengan kasih sayang dan kebersamaan yang indah.' },
                { name: 'Teman-teman', text: 'Terima kasih telah menjadi bagian dari perjalananmu yang luar biasa!' },
                { name: 'Sahabat', text: 'Terus bersinar dan menginspirasi kami semua dengan dedikasi dan kreativitasmu.' },
                { name: 'Komunitas', text: 'Kami menunggu karya-karya amazing darimu di masa depan!' }
            ];
            
            wishes.forEach(wish => {
                const item = document.createElement('div');
                item.className = 'wish-item';
                item.innerHTML = `
                    <div class="wish-name">${wish.name}</div>
                    <div class="wish-text">"${wish.text}"</div>
                `;
                wishesContainer.appendChild(item);
            });
        }
    }

    /**
     * Handle gift button
     */
    setupGiftButton() {
        const giftButton = document.getElementById('giftButton');
        
        if (giftButton) {
            giftButton.addEventListener('click', () => {
                // Trigger all celebration effects
                confettiSystem.burst(window.innerWidth / 2, window.innerHeight / 2, 200);
                fireworksSystem.burst(window.innerWidth / 2, window.innerHeight / 2, 15);
                
                if (typeof threeSceneManager !== 'undefined' && threeSceneManager) {
                    threeSceneManager.triggerAuroraEffect();
                    threeSceneManager.spawnShootingStars(15);
                }
                
                if (musicPlayer) {
                    musicPlayer.play();
                }
                
                particleEffects.createFloatingParticles(window.innerWidth / 2, window.innerHeight / 2, 'heart', 20);
            });
        }
    }
}

// Global app instance
let birthdayApp = null;

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', () => {
    birthdayApp = new BirthdayApp();
});

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = BirthdayApp;
}