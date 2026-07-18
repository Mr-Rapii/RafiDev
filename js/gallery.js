// ================================
// GALLERY SYSTEM
// Image gallery with lightbox and lazy loading
// ================================

/**
 * Gallery system with lazy loading and lightbox functionality
 */

class Gallery {
    constructor() {
        this.galleryGrid = document.getElementById('galleryGrid');
        this.lightbox = document.getElementById('lightbox');
        this.lightboxImage = document.getElementById('lightboxImage');
        this.lightboxClose = document.getElementById('lightboxClose');
        this.lightboxPrev = document.getElementById('lightboxPrev');
        this.lightboxNext = document.getElementById('lightboxNext');
        
        this.images = [];
        this.currentImageIndex = 0;
        
        // Demo images - can be replaced with real images
        this.demoImages = [
            { title: 'Moment 1', src: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="300" height="300"%3E%3Crect fill="%230066ff" width="300" height="300"/%3E%3Ctext x="50%" y="50%" font-size="24" fill="white" text-anchor="middle" dominant-baseline="middle"%3E🎉 Birthday Moment 1%3C/text%3E%3C/svg%3E' },
            { title: 'Moment 2', src: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="300" height="300"%3E%3Crect fill="%2300ff88" width="300" height="300"/%3E%3Ctext x="50%" y="50%" font-size="24" fill="white" text-anchor="middle" dominant-baseline="middle"%3E🎂 Birthday Moment 2%3C/text%3E%3C/svg%3E' },
            { title: 'Moment 3', src: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="300" height="300"%3E%3Crect fill="%23ff00ff" width="300" height="300"/%3E%3Ctext x="50%" y="50%" font-size="24" fill="white" text-anchor="middle" dominant-baseline="middle"%3E🎁 Birthday Moment 3%3C/text%3E%3C/svg%3E' },
            { title: 'Moment 4', src: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="300" height="300"%3E%3Crect fill="%2300ffff" width="300" height="300"/%3E%3Ctext x="50%" y="50%" font-size="24" fill="white" text-anchor="middle" dominant-baseline="middle"%3E✨ Birthday Moment 4%3C/text%3E%3C/svg%3E' },
            { title: 'Moment 5', src: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="300" height="300"%3E%3Crect fill="%23ff0080" width="300" height="300"/%3E%3Ctext x="50%" y="50%" font-size="24" fill="white" text-anchor="middle" dominant-baseline="middle"%3E🎈 Birthday Moment 5%3C/text%3E%3C/svg%3E' },
            { title: 'Moment 6', src: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="300" height="300"%3E%3Crect fill="%23ffff00" width="300" height="300"/%3E%3Ctext x="50%" y="50%" font-size="24" fill="%23333" text-anchor="middle" dominant-baseline="middle"%3E🌟 Birthday Moment 6%3C/text%3E%3C/svg%3E' }
        ];
        
        this.setupEventListeners();
        this.loadGallery();
        
        console.log('🖼️ Gallery system initialized');
    }

    /**
     * Load gallery items
     */
    loadGallery() {
        this.images = this.demoImages;
        this.renderGallery();
    }

    /**
     * Render gallery grid
     */
    renderGallery() {
        this.galleryGrid.innerHTML = '';
        
        this.images.forEach((image, index) => {
            const item = document.createElement('div');
            item.className = 'gallery-item';
            item.innerHTML = `
                <img class="gallery-image" src="${image.src}" alt="${image.title}" loading="lazy">
                <div class="gallery-overlay">
                    <span>View</span>
                </div>
            `;
            
            item.addEventListener('click', () => this.openLightbox(index));
            this.galleryGrid.appendChild(item);
        });
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        this.lightboxClose.addEventListener('click', () => this.closeLightbox());
        this.lightboxPrev.addEventListener('click', () => this.previousImage());
        this.lightboxNext.addEventListener('click', () => this.nextImage());
        
        // Close on background click
        this.lightbox.addEventListener('click', (e) => {
            if (e.target === this.lightbox) {
                this.closeLightbox();
            }
        });
        
        // Keyboard navigation
        document.addEventListener('keydown', (e) => {
            if (this.lightbox.classList.contains('active')) {
                if (e.key === 'ArrowLeft') this.previousImage();
                if (e.key === 'ArrowRight') this.nextImage();
                if (e.key === 'Escape') this.closeLightbox();
            }
        });
    }

    /**
     * Open lightbox
     */
    openLightbox(index) {
        this.currentImageIndex = index;
        this.updateLightboxImage();
        this.lightbox.classList.add('active');
        document.body.classList.add('no-scroll');
    }

    /**
     * Close lightbox
     */
    closeLightbox() {
        this.lightbox.classList.remove('active');
        document.body.classList.remove('no-scroll');
    }

    /**
     * Update lightbox image
     */
    updateLightboxImage() {
        const image = this.images[this.currentImageIndex];
        this.lightboxImage.src = image.src;
        this.lightboxImage.alt = image.title;
    }

    /**
     * Next image
     */
    nextImage() {
        this.currentImageIndex = (this.currentImageIndex + 1) % this.images.length;
        this.updateLightboxImage();
    }

    /**
     * Previous image
     */
    previousImage() {
        this.currentImageIndex = (this.currentImageIndex - 1 + this.images.length) % this.images.length;
        this.updateLightboxImage();
    }

    /**
     * Add image to gallery
     */
    addImage(image) {
        this.images.push(image);
        this.renderGallery();
    }

    /**
     * Remove image from gallery
     */
    removeImage(index) {
        this.images.splice(index, 1);
        this.renderGallery();
    }
}

// Global instance
let gallery = null;

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', () => {
    if (!gallery) {
        gallery = new Gallery();
    }
});

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Gallery;
}