// ================================
// UI SYSTEM
// Navigation, scrolling, and interactive elements
// ================================

/**
 * UI system for navigation and interactive elements
 */

class UIManager {
    constructor() {
        this.navbar = document.querySelector('.navbar');
        this.navbarMenu = document.getElementById('navbarMenu');
        this.navbarToggle = document.getElementById('navbarToggle');
        this.navLinks = document.querySelectorAll('.nav-link');
        this.backToTop = document.getElementById('backToTop');
        this.scrollProgress = document.getElementById('scrollProgress');
        this.floatingMusicBtn = document.getElementById('floatingMusicBtn');
        
        this.setupEventListeners();
        this.setupScrollBehavior();
        
        console.log('🎮 UI Manager initialized');
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Mobile menu toggle
        this.navbarToggle.addEventListener('click', () => this.toggleMenu());
        
        // Navigation links
        this.navLinks.forEach(link => {
            link.addEventListener('click', (e) => this.handleNavClick(e));
        });
        
        // Back to top button
        this.backToTop.addEventListener('click', () => this.scrollToTop());
        
        // Floating music button
        if (this.floatingMusicBtn) {
            this.floatingMusicBtn.addEventListener('click', () => this.toggleMusicPlayer());
        }
        
        // Scroll events
        window.addEventListener('scroll', () => this.updateScrollState());
    }

    /**
     * Setup scroll behavior
     */
    setupScrollBehavior() {
        // Smooth scroll for navigation links
        this.navLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                const href = link.getAttribute('href');
                if (href.startsWith('#')) {
                    e.preventDefault();
                    const target = document.querySelector(href);
                    if (target) {
                        target.scrollIntoView({ behavior: 'smooth' });
                        this.closeMenu();
                    }
                }
            });
        });
    }

    /**
     * Toggle mobile menu
     */
    toggleMenu() {
        this.navbarMenu.classList.toggle('active');
        this.navbarToggle.classList.toggle('active');
    }

    /**
     * Close mobile menu
     */
    closeMenu() {
        this.navbarMenu.classList.remove('active');
        this.navbarToggle.classList.remove('active');
    }

    /**
     * Handle navigation click
     */
    handleNavClick(e) {
        const link = e.target.closest('.nav-link');
        if (!link) return;
        
        // Update active state
        this.navLinks.forEach(l => l.classList.remove('active'));
        link.classList.add('active');
        
        // Close menu on mobile
        if (window.innerWidth < 1024) {
            this.closeMenu();
        }
    }

    /**
     * Update scroll state
     */
    updateScrollState() {
        const scrollTop = window.scrollY;
        const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
        const scrollPercent = (scrollTop / scrollHeight) * 100;
        
        // Update navbar style
        if (scrollTop > 50) {
            this.navbar.classList.add('scrolled');
        } else {
            this.navbar.classList.remove('scrolled');
        }
        
        // Update scroll progress bar
        if (this.scrollProgress) {
            this.scrollProgress.style.width = scrollPercent + '%';
        }
        
        // Update back to top button
        if (scrollTop > 300) {
            this.backToTop.classList.add('visible');
        } else {
            this.backToTop.classList.remove('visible');
        }
        
        // Update active nav link based on scroll position
        this.updateActiveSection();
    }

    /**
     * Update active section based on scroll
     */
    updateActiveSection() {
        const sections = document.querySelectorAll('.section');
        const scrollPosition = window.scrollY + 100;
        
        sections.forEach(section => {
            const sectionTop = section.offsetTop;
            const sectionHeight = section.offsetHeight;
            
            if (scrollPosition >= sectionTop && scrollPosition < sectionTop + sectionHeight) {
                const sectionId = section.getAttribute('id');
                this.navLinks.forEach(link => {
                    link.classList.remove('active');
                    if (link.getAttribute('href') === '#' + sectionId) {
                        link.classList.add('active');
                    }
                });
            }
        });
    }

    /**
     * Scroll to top
     */
    scrollToTop() {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    }

    /**
     * Toggle music player visibility
     */
    toggleMusicPlayer() {
        const player = document.getElementById('musicPlayer');
        if (player) {
            player.style.display = player.style.display === 'none' ? 'block' : 'none';
        }
    }
}

// Global instance
let uiManager = null;

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', () => {
    if (!uiManager) {
        uiManager = new UIManager();
    }
});

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = UIManager;
}