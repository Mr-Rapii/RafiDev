// ================================
// MUSIC PLAYER SYSTEM
// Advanced floating music player with playlist support
// ================================

/**
 * Advanced music player with playlist support and audio visualization
 */

class MusicPlayer {
    constructor(options = {}) {
        this.audioElement = document.getElementById('audioElement');
        this.playerContainer = document.getElementById('musicPlayer');
        
        this.playlist = options.playlist || [
            {
                title: 'Happy Birthday - Piano',
                artist: 'Special Gift for Raffi',
                url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3'
            }
        ];
        
        this.currentTrackIndex = 0;
        this.isPlaying = false;
        this.isMuted = false;
        this.repeatMode = 0; // 0: no repeat, 1: repeat all, 2: repeat one
        this.isShuffled = false;
        this.volume = this.getSavedVolume() || 0.7;
        
        // UI Elements
        this.buttons = {
            play: document.getElementById('playBtn'),
            prev: document.getElementById('prevBtn'),
            next: document.getElementById('nextBtn'),
            shuffle: document.getElementById('shuffleBtn'),
            repeat: document.getElementById('repeatBtn')
        };
        
        this.controls = {
            progressBar: document.getElementById('playerProgressBar'),
            volumeSlider: document.getElementById('volumeSlider'),
            volumeValue: document.getElementById('volumeValue'),
            currentTime: document.querySelector('.current-time'),
            durationTime: document.querySelector('.duration-time'),
            title: document.querySelector('.player-title'),
            artist: document.querySelector('.player-artist')
        };
        
        // Visualizer
        this.visualizer = document.getElementById('audioVisualizer');
        this.visualizerBars = this.visualizer ? this.visualizer.querySelectorAll('.visualizer-bar') : [];
        
        // Audio context for visualization
        this.audioContext = null;
        this.analyser = null;
        this.dataArray = null;
        this.animationId = null;
        
        // Check for reduced motion preference
        this.prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        
        this.setupEventListeners();
        this.initAudio();
        this.updateDisplay();
        
        console.log('🎵 Music player initialized with', this.playlist.length, 'track(s)');
    }

    /**
     * Setup all event listeners
     */
    setupEventListeners() {
        // Playback controls
        this.buttons.play.addEventListener('click', () => this.togglePlay());
        this.buttons.next.addEventListener('click', () => this.nextTrack());
        this.buttons.prev.addEventListener('click', () => this.previousTrack());
        this.buttons.shuffle.addEventListener('click', () => this.toggleShuffle());
        this.buttons.repeat.addEventListener('click', () => this.cycleRepeat());
        
        // Audio events
        this.audioElement.addEventListener('timeupdate', () => this.updateProgress());
        this.audioElement.addEventListener('loadedmetadata', () => this.updateDuration());
        this.audioElement.addEventListener('ended', () => this.onTrackEnd());
        this.audioElement.addEventListener('play', () => {
            this.isPlaying = true;
            this.updatePlayButton();
            this.startVisualization();
        });
        this.audioElement.addEventListener('pause', () => {
            this.isPlaying = false;
            this.updatePlayButton();
            this.stopVisualization();
        });
        
        // Volume control
        this.controls.volumeSlider.addEventListener('input', (e) => {
            this.setVolume(e.target.value / 100);
        });
        
        // Progress bar seeking
        this.controls.progressBar.addEventListener('click', (e) => {
            const rect = e.currentTarget.querySelector('.progress-fill').parentElement.getBoundingClientRect();
            const percent = (e.clientX - rect.left) / rect.width;
            this.seek(percent);
        });
        
        // Handle visibility changes
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this.pause();
            }
        });
    }

    /**
     * Initialize audio element
     */
    initAudio() {
        this.audioElement.volume = this.volume;
        this.controls.volumeSlider.value = this.volume * 100;
        this.controls.volumeValue.textContent = Math.round(this.volume * 100);
        
        // Load first track
        if (this.playlist.length > 0) {
            this.loadTrack(0);
        }
    }

    /**
     * Load track
     */
    loadTrack(index) {
        if (index < 0 || index >= this.playlist.length) return;
        
        this.currentTrackIndex = index;
        const track = this.playlist[index];
        
        this.audioElement.src = track.url;
        this.updateDisplay();
        
        console.log('📀 Loaded track:', track.title);
    }

    /**
     * Update display information
     */
    updateDisplay() {
        const track = this.playlist[this.currentTrackIndex];
        if (track) {
            this.controls.title.textContent = track.title;
            this.controls.artist.textContent = track.artist;
        }
    }

    /**
     * Toggle play/pause
     */
    togglePlay() {
        if (this.isPlaying) {
            this.pause();
        } else {
            this.play();
        }
    }

    /**
     * Play audio
     */
    play() {
        // Handle autoplay restrictions
        const playPromise = this.audioElement.play();
        
        if (playPromise !== undefined) {
            playPromise.catch(error => {
                console.log('⚠️ Autoplay restricted:', error);
                // Fallback: set as playing but don't actually play
                this.isPlaying = true;
                this.updatePlayButton();
            });
        }
    }

    /**
     * Pause audio
     */
    pause() {
        this.audioElement.pause();
    }

    /**
     * Next track
     */
    nextTrack() {
        let nextIndex = this.currentTrackIndex + 1;
        
        if (nextIndex >= this.playlist.length) {
            nextIndex = 0;
        }
        
        this.loadTrack(nextIndex);
        if (this.isPlaying) {
            this.play();
        }
    }

    /**
     * Previous track
     */
    previousTrack() {
        if (this.audioElement.currentTime > 3) {
            // Restart current track
            this.audioElement.currentTime = 0;
        } else {
            // Go to previous track
            let prevIndex = this.currentTrackIndex - 1;
            
            if (prevIndex < 0) {
                prevIndex = this.playlist.length - 1;
            }
            
            this.loadTrack(prevIndex);
        }
        
        if (this.isPlaying) {
            this.play();
        }
    }

    /**
     * Toggle shuffle
     */
    toggleShuffle() {
        this.isShuffled = !this.isShuffled;
        this.buttons.shuffle.classList.toggle('active', this.isShuffled);
        console.log('🔀 Shuffle:', this.isShuffled ? 'enabled' : 'disabled');
    }

    /**
     * Cycle repeat modes
     */
    cycleRepeat() {
        this.repeatMode = (this.repeatMode + 1) % 3;
        this.buttons.repeat.classList.toggle('active', this.repeatMode > 0);
        console.log('🔁 Repeat mode:', this.repeatMode);
    }

    /**
     * Set volume
     */
    setVolume(value) {
        this.volume = Math.max(0, Math.min(1, value));
        this.audioElement.volume = this.volume;
        this.controls.volumeValue.textContent = Math.round(this.volume * 100);
        this.saveVolume(this.volume);
    }

    /**
     * Seek to position
     */
    seek(percent) {
        const duration = this.audioElement.duration;
        this.audioElement.currentTime = percent * duration;
    }

    /**
     * Update progress bar
     */
    updateProgress() {
        if (this.audioElement.duration) {
            const percent = (this.audioElement.currentTime / this.audioElement.duration) * 100;
            this.controls.progressBar.querySelector('.progress-fill').style.width = percent + '%';
            this.controls.currentTime.textContent = this.formatTime(this.audioElement.currentTime);
        }
    }

    /**
     * Update duration display
     */
    updateDuration() {
        this.controls.durationTime.textContent = this.formatTime(this.audioElement.duration);
    }

    /**
     * Handle track end
     */
    onTrackEnd() {
        if (this.repeatMode === 2) {
            // Repeat one
            this.audioElement.currentTime = 0;
            this.play();
        } else {
            // Next track or stop
            if (this.currentTrackIndex < this.playlist.length - 1 || this.repeatMode === 1) {
                this.nextTrack();
            } else {
                this.isPlaying = false;
                this.updatePlayButton();
            }
        }
    }

    /**
     * Update play button state
     */
    updatePlayButton() {
        const icon = this.isPlaying ? '⏸' : '▶';
        this.buttons.play.textContent = icon;
    }

    /**
     * Format time to MM:SS
     */
    formatTime(seconds) {
        if (!seconds || isNaN(seconds)) return '0:00';
        
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    }

    /**
     * Initialize audio visualization
     */
    initVisualization() {
        if (this.audioContext) return;
        
        try {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            this.audioContext = new AudioContext();
            this.analyser = this.audioContext.createAnalyser();
            
            const source = this.audioContext.createMediaElementAudioSource(this.audioElement);
            source.connect(this.analyser);
            this.analyser.connect(this.audioContext.destination);
            
            this.analyser.fftSize = 256;
            this.dataArray = new Uint8Array(this.analyser.frequencyBinCount);
        } catch (e) {
            console.log('⚠️ Audio visualization not supported');
        }
    }

    /**
     * Start visualization
     */
    startVisualization() {
        if (this.prefersReducedMotion || !this.visualizerBars.length) return;
        
        this.initVisualization();
        this.visualize();
    }

    /**
     * Stop visualization
     */
    stopVisualization() {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
        }
        this.visualizerBars.forEach(bar => bar.style.height = '8px');
    }

    /**
     * Animate visualizer
     */
    visualize() {
        if (!this.isPlaying || !this.analyser) return;
        
        this.analyser.getByteFrequencyData(this.dataArray);
        
        const barCount = this.visualizerBars.length;
        for (let i = 0; i < barCount; i++) {
            const index = Math.floor((i / barCount) * this.dataArray.length);
            const value = this.dataArray[index];
            const percent = (value / 255) * 100;
            this.visualizerBars[i].style.height = Math.max(8, percent) + '%';
        }
        
        this.animationId = requestAnimationFrame(() => this.visualize());
    }

    /**
     * Save volume to localStorage
     */
    saveVolume(volume) {
        try {
            localStorage.setItem('birthdayPlayerVolume', volume);
        } catch (e) {
            console.log('⚠️ Could not save volume preference');
        }
    }

    /**
     * Get saved volume from localStorage
     */
    getSavedVolume() {
        try {
            const saved = localStorage.getItem('birthdayPlayerVolume');
            return saved ? parseFloat(saved) : null;
        } catch (e) {
            return null;
        }
    }
}

// Global instance
let musicPlayer = null;

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', () => {
    if (!musicPlayer) {
        musicPlayer = new MusicPlayer();
    }
});

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = MusicPlayer;
}