// ================================
// THREE.JS PERFORMANCE OPTIMIZATION
// ================================

/**
 * Performance monitoring and optimization utilities
 * Handles device capabilities, memory detection, and rendering optimization
 */

class ThreePerformance {
    constructor() {
        this.canvas = document.getElementById('threeCanvas');
        this.renderer = null;
        this.capabilities = {
            maxTextureSize: 0,
            maxAnisotropy: 0,
            isLowEnd: false,
            isAndroid: false,
            isMobile: false,
            availableMemory: 0,
            hardwareConcurrency: 0
        };

        this.settings = {
            targetFPS: 60,
            pixelRatio: window.devicePixelRatio,
            enableBloom: true,
            enableLensFlare: true,
            particleCount: 10000,
            shadowMapSize: 2048,
            textureQuality: 1
        };

        this.performance = {
            fps: 0,
            frameTime: 0,
            lastFrameTime: Date.now(),
            frameCount: 0,
            avgFrameTime: 0
        };

        this.detectCapabilities();
        this.optimizeSettings();
    }

    /**
     * Detect device capabilities and memory
     */
    detectCapabilities() {
        // Detect platform
        const ua = navigator.userAgent.toLowerCase();
        this.capabilities.isAndroid = ua.includes('android');
        this.capabilities.isMobile = /iphone|ipad|ipod|android/.test(ua);

        // Detect hardware concurrency
        this.capabilities.hardwareConcurrency = navigator.hardwareConcurrency || 1;

        // Detect available memory (if available)
        if (navigator.deviceMemory) {
            this.capabilities.availableMemory = navigator.deviceMemory;
        } else {
            this.capabilities.availableMemory = this.capabilities.isMobile ? 2 : 8;
        }

        // Determine if low-end device
        this.capabilities.isLowEnd = 
            this.capabilities.isMobile ||
            this.capabilities.availableMemory < 4 ||
            this.capabilities.hardwareConcurrency < 2;

        console.log('🎮 Device Capabilities:', this.capabilities);
    }

    /**
     * Optimize settings based on device capabilities
     */
    optimizeSettings() {
        if (this.capabilities.isLowEnd) {
            // Low-end device optimizations
            this.settings.targetFPS = 30;
            this.settings.pixelRatio = Math.min(window.devicePixelRatio, 1);
            this.settings.particleCount = 2000;
            this.settings.shadowMapSize = 512;
            this.settings.textureQuality = 0.5;
            this.settings.enableBloom = false;
            this.settings.enableLensFlare = false;

            console.log('⚙️ Low-end device mode activated');
        } else if (this.capabilities.isMobile) {
            // Mobile device optimizations
            this.settings.targetFPS = 45;
            this.settings.pixelRatio = Math.min(window.devicePixelRatio, 2);
            this.settings.particleCount = 5000;
            this.settings.shadowMapSize = 1024;
            this.settings.textureQuality = 0.75;
            this.settings.enableBloom = true;
            this.settings.enableLensFlare = false;

            console.log('📱 Mobile device mode activated');
        } else {
            // Desktop optimizations
            this.settings.targetFPS = 60;
            this.settings.pixelRatio = window.devicePixelRatio;
            this.settings.particleCount = 10000;
            this.settings.shadowMapSize = 2048;
            this.settings.textureQuality = 1;
            this.settings.enableBloom = true;
            this.settings.enableLensFlare = true;

            console.log('🖥️ Desktop mode activated');
        }
    }

    /**
     * Initialize renderer with optimal settings
     */
    initRenderer() {
        const renderer = new THREE.WebGLRenderer({
            canvas: this.canvas,
            antialias: !this.capabilities.isLowEnd,
            alpha: true,
            powerPreference: this.capabilities.isLowEnd ? 'low-power' : 'high-performance'
        });

        // Set size and pixel ratio
        this.updateRendererSize(renderer);

        // Set color space
        renderer.outputColorSpace = THREE.SRGBColorSpace;
        renderer.toneMapping = THREE.ACESFilmicToneMapping;
        renderer.toneMappingExposure = 1;

        // Optimize rendering
        renderer.shadowMap.enabled = true;
        renderer.shadowMap.type = THREE.PCFShadowShadowMap;
        renderer.shadowMap.autoUpdate = false;

        // Clamp pixel ratio
        const clampedRatio = Math.min(this.settings.pixelRatio, 2);
        renderer.setPixelRatio(clampedRatio);

        // Store max texture size
        this.capabilities.maxTextureSize = renderer.capabilities.maxTextureSize;
        this.capabilities.maxAnisotropy = renderer.capabilities.maxAnisotropy;

        this.renderer = renderer;

        console.log('✅ Renderer initialized:', {
            pixelRatio: clampedRatio,
            maxTextureSize: this.capabilities.maxTextureSize,
            maxAnisotropy: this.capabilities.maxAnisotropy
        });

        return renderer;
    }

    /**
     * Update renderer size based on window
     */
    updateRendererSize(renderer) {
        const width = window.innerWidth;
        const height = window.innerHeight;
        renderer.setSize(width, height);
    }

    /**
     * Handle window resize
     */
    onWindowResize(renderer, camera) {
        const width = window.innerWidth;
        const height = window.innerHeight;

        camera.aspect = width / height;
        camera.updateProjectionMatrix();

        renderer.setSize(width, height);

        console.log('📐 Resized to', width, 'x', height);
    }

    /**
     * Pause rendering when tab is not active
     */
    setupTabVisibilityListener(onHidden, onVisible) {
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                onHidden?.();
                console.log('👁️ Tab hidden - pausing renderer');
            } else {
                onVisible?.();
                console.log('👁️ Tab visible - resuming renderer');
            }
        });
    }

    /**
     * Monitor FPS and performance
     */
    updatePerformanceMetrics() {
        const now = Date.now();
        const deltaTime = now - this.performance.lastFrameTime;
        this.performance.lastFrameTime = now;

        this.performance.frameTime = deltaTime;
        this.performance.fps = Math.round(1000 / deltaTime);
        this.performance.frameCount++;

        // Calculate average frame time every 60 frames
        if (this.performance.frameCount % 60 === 0) {
            const totalFrameTime = this.performance.frameTime;
            this.performance.avgFrameTime = totalFrameTime / 60;
            console.log(`📊 FPS: ${this.performance.fps}, Avg Frame Time: ${this.performance.avgFrameTime.toFixed(2)}ms`);
        }

        return this.performance;
    }

    /**
     * Adaptive rendering quality based on FPS
     */
    adaptiveQuality() {
        if (this.performance.fps < this.settings.targetFPS * 0.8) {
            // Performance too low, reduce quality
            this.settings.particleCount = Math.floor(this.settings.particleCount * 0.8);
            console.log('⬇️ Reducing particle count to', this.settings.particleCount);
        }
    }

    /**
     * Enable frustum culling helper
     */
    setupFrustumCulling(scene, camera) {
        const frustum = new THREE.Frustum();
        const matrix = new THREE.Matrix4();

        return () => {
            matrix.multiplyMatrices(
                camera.projectionMatrix,
                camera.matrixWorldInverse
            );
            frustum.setFromProjectionMatrix(matrix);

            scene.traverse((object) => {
                if (object.geometry) {
                    object.frustumCulled = true;
                }
            });

            return frustum;
        };
    }

    /**
     * Setup object pooling for particles and effects
     */
    createObjectPool(count, createFn) {
        const pool = [];
        const active = [];

        for (let i = 0; i < count; i++) {
            pool.push(createFn());
        }

        return {
            get: () => {
                if (pool.length > 0) {
                    const obj = pool.pop();
                    active.push(obj);
                    return obj;
                }
                return createFn();
            },
            release: (obj) => {
                const index = active.indexOf(obj);
                if (index > -1) {
                    active.splice(index, 1);
                    pool.push(obj);
                }
            },
            getActive: () => active,
            getPool: () => pool
        };
    }

    /**
     * Texture compression detection
     */
    supportsTextureCompression() {
        if (!this.renderer) return false;
        
        const gl = this.renderer.getContext();
        const ext = gl.getExtension('WEBGL_compressed_texture_etc1') ||
                    gl.getExtension('WEBGL_compressed_texture_s3tc') ||
                    gl.getExtension('WEBGL_compressed_texture_pvrtc');
        
        return !!ext;
    }

    /**
     * Get device memory class for texture loading
     */
    getMemoryClass() {
        if (this.capabilities.availableMemory < 4) return 'low';
        if (this.capabilities.availableMemory < 8) return 'medium';
        return 'high';
    }

    /**
     * Request animation frame with adaptive frame rate
     */
    requestAnimationFrame(callback) {
        const frameInterval = 1000 / this.settings.targetFPS;
        let lastTime = Date.now();

        const loop = () => {
            const now = Date.now();
            if (now - lastTime >= frameInterval) {
                callback(now);
                lastTime = now;
            }
            window.requestAnimationFrame(loop);
        };

        window.requestAnimationFrame(loop);
    }

    /**
     * Get performance report
     */
    getPerformanceReport() {
        return {
            capabilities: this.capabilities,
            settings: this.settings,
            performance: this.performance,
            memoryClass: this.getMemoryClass()
        };
    }

    /**
     * Log performance report to console
     */
    logPerformanceReport() {
        const report = this.getPerformanceReport();
        console.table(report);
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ThreePerformance;
}
