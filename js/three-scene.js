// ================================
// THREE.JS SCENE MANAGER
// Galaxy, Aurora, and Particle Effects
// ================================

/**
 * Main Three.js scene manager for the birthday website
 * Handles galaxy rendering, aurora effects, particles, and post-processing
 */

class ThreeSceneManager {
    constructor() {
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.composer = null;
        this.performance = null;
        
        // Scene objects
        this.galaxy = null;
        this.aurora = null;
        this.particles = [];
        this.stars = null;
        this.shootingStars = [];
        
        // Effects
        this.bloomPass = null;
        this.renderPass = null;
        
        // State
        this.isRunning = true;
        this.time = 0;
        this.mousePosition = new THREE.Vector2(0, 0);
        
        this.init();
    }

    /**
     * Initialize the Three.js scene
     */
    init() {
        // Initialize performance monitoring
        this.performance = new ThreePerformance();
        
        // Create scene
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x0a0e27);
        this.scene.fog = new THREE.FogExp2(0x0a0e27, 0.002);
        
        // Create camera
        this.createCamera();
        
        // Initialize renderer
        this.renderer = this.performance.initRenderer();
        
        // Create scene elements
        this.createGalaxy();
        this.createStars();
        this.createAurora();
        this.createLighting();
        
        // Setup post-processing if not low-end
        if (!this.performance.capabilities.isLowEnd) {
            this.setupPostProcessing();
        }
        
        // Setup event listeners
        this.setupEventListeners();
        
        // Handle tab visibility
        this.performance.setupTabVisibilityListener(
            () => this.pause(),
            () => this.resume()
        );
        
        // Start animation loop
        this.animate();
        
        console.log('✅ Three.js Scene initialized successfully');
    }

    /**
     * Create camera with proper aspect ratio
     */
    createCamera() {
        const width = window.innerWidth;
        const height = window.innerHeight;
        const aspectRatio = width / height;
        
        this.camera = new THREE.PerspectiveCamera(
            75,
            aspectRatio,
            0.1,
            10000
        );
        this.camera.position.z = 2;
        this.camera.lookAt(0, 0, 0);
    }

    /**
     * Create galaxy using custom shader
     */
    createGalaxy() {
        const geometry = new THREE.PlaneGeometry(4, 4, 64, 64);
        
        const material = new THREE.ShaderMaterial({
            uniforms: ThreeShaders.galaxy.uniforms,
            vertexShader: ThreeShaders.galaxy.vertexShader,
            fragmentShader: ThreeShaders.galaxy.fragmentShader,
            transparent: true,
            depthWrite: false
        });
        
        this.galaxy = new THREE.Mesh(geometry, material);
        this.galaxy.position.z = -2;
        this.scene.add(this.galaxy);
        
        console.log('🌌 Galaxy created');
    }

    /**
     * Create star field background
     */
    createStars() {
        const starCount = this.performance.settings.particleCount;
        const starsGeometry = new THREE.BufferGeometry();
        
        const positions = new Float32Array(starCount * 3);
        const colors = new Float32Array(starCount * 3);
        
        for (let i = 0; i < starCount * 3; i += 3) {
            positions[i] = (Math.random() - 0.5) * 100;
            positions[i + 1] = (Math.random() - 0.5) * 100;
            positions[i + 2] = (Math.random() - 0.5) * 100;
            
            const brightness = Math.random();
            colors[i] = brightness;
            colors[i + 1] = brightness;
            colors[i + 2] = brightness;
        }
        
        starsGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        starsGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        
        const starsMaterial = new THREE.PointsMaterial({
            size: 0.05,
            vertexColors: true,
            transparent: true,
            sizeAttenuation: true
        });
        
        this.stars = new THREE.Points(starsGeometry, starsMaterial);
        this.scene.add(this.stars);
        
        console.log(`⭐ ${starCount} stars created`);
    }

    /**
     * Create aurora borealis effect
     */
    createAurora() {
        const geometry = new THREE.PlaneGeometry(8, 8, 128, 128);
        
        const material = new THREE.ShaderMaterial({
            uniforms: ThreeShaders.aurora.uniforms,
            vertexShader: ThreeShaders.aurora.vertexShader,
            fragmentShader: ThreeShaders.aurora.fragmentShader,
            transparent: true,
            depthWrite: false,
            blending: THREE.AdditiveBlending
        });
        
        this.aurora = new THREE.Mesh(geometry, material);
        this.aurora.position.z = -1;
        this.aurora.rotation.x = Math.PI * 0.3;
        this.scene.add(this.aurora);
        
        console.log('🌌 Aurora created');
    }

    /**
     * Create lighting
     */
    createLighting() {
        // Ambient light
        const ambientLight = new THREE.AmbientLight(0x00ff88, 0.3);
        this.scene.add(ambientLight);
        
        // Point lights
        const pointLight1 = new THREE.PointLight(0x0066ff, 1, 100);
        pointLight1.position.set(5, 5, 5);
        this.scene.add(pointLight1);
        
        const pointLight2 = new THREE.PointLight(0xff00ff, 0.8, 100);
        pointLight2.position.set(-5, -5, 5);
        this.scene.add(pointLight2);
        
        console.log('💡 Lighting setup complete');
    }

    /**
     * Setup post-processing effects
     */
    setupPostProcessing() {
        // EffectComposer setup
        const canvas = document.getElementById('threeCanvas');
        this.composer = new THREE.EffectComposer(this.renderer);
        
        // Render pass
        this.renderPass = new THREE.RenderPass(this.scene, this.camera);
        this.composer.addPass(this.renderPass);
        
        // Bloom pass (if available in Three.js)
        if (THREE.UnrealBloomPass) {
            this.bloomPass = new THREE.UnrealBloomPass(
                new THREE.Vector2(window.innerWidth, window.innerHeight),
                1.5,
                0.4,
                0.85
            );
            this.composer.addPass(this.bloomPass);
        }
        
        console.log('✨ Post-processing setup complete');
    }

    /**
     * Create shooting stars
     */
    createShootingStar() {
        const length = 0.5 + Math.random() * 1;
        const width = 0.02;
        
        const geometry = new THREE.BufferGeometry();
        const positions = new Float32Array([
            0, 0, 0,
            length, 0, 0
        ]);
        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        
        const material = new THREE.LineBasicMaterial({
            color: new THREE.Color(0x00ff88),
            linewidth: width,
            transparent: true,
            fog: false
        });
        
        const shootingStar = new THREE.Line(geometry, material);
        
        // Random position
        shootingStar.position.set(
            (Math.random() - 0.5) * 20,
            (Math.random() - 0.5) * 20,
            (Math.random() - 0.5) * 10
        );
        
        shootingStar.rotation.z = Math.random() * Math.PI * 2;
        
        // Animation properties
        shootingStar.userData = {
            velocity: new THREE.Vector3(
                (Math.random() - 0.5) * 0.1,
                (Math.random() - 0.5) * 0.1,
                (Math.random() - 0.5) * 0.05
            ),
            lifetime: 0,
            maxLifetime: 3 + Math.random() * 2
        };
        
        this.scene.add(shootingStar);
        this.shootingStars.push(shootingStar);
        
        return shootingStar;
    }

    /**
     * Create particle system for effects
     */
    createParticleSystem(position, count = 100) {
        const geometry = new THREE.BufferGeometry();
        
        const positions = new Float32Array(count * 3);
        const velocities = new Float32Array(count * 3);
        const lifetimes = new Float32Array(count);
        const ages = new Float32Array(count);
        
        for (let i = 0; i < count; i++) {
            positions[i * 3] = position.x + (Math.random() - 0.5) * 0.5;
            positions[i * 3 + 1] = position.y + (Math.random() - 0.5) * 0.5;
            positions[i * 3 + 2] = position.z + (Math.random() - 0.5) * 0.5;
            
            velocities[i * 3] = (Math.random() - 0.5) * 0.1;
            velocities[i * 3 + 1] = (Math.random() - 0.5) * 0.1;
            velocities[i * 3 + 2] = (Math.random() - 0.5) * 0.1;
            
            lifetimes[i] = 2 + Math.random() * 2;
            ages[i] = 0;
        }
        
        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geometry.setAttribute('velocity', new THREE.BufferAttribute(velocities, 3));
        geometry.setAttribute('lifetime', new THREE.BufferAttribute(lifetimes, 1));
        geometry.setAttribute('age', new THREE.BufferAttribute(ages, 1));
        
        const material = new THREE.ShaderMaterial({
            uniforms: ThreeShaders.particle.uniforms,
            vertexShader: ThreeShaders.particle.vertexShader,
            fragmentShader: ThreeShaders.particle.fragmentShader,
            transparent: true,
            depthWrite: false
        });
        
        const particles = new THREE.Points(geometry, material);
        this.scene.add(particles);
        
        particles.userData = {
            velocities: velocities,
            lifetimes: lifetimes,
            ages: ages
        };
        
        this.particles.push(particles);
        
        return particles;
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Mouse move for parallax
        document.addEventListener('mousemove', (e) => {
            this.mousePosition.x = (e.clientX / window.innerWidth) * 2 - 1;
            this.mousePosition.y = -(e.clientY / window.innerHeight) * 2 + 1;
        });
        
        // Window resize
        window.addEventListener('resize', () => this.onWindowResize());
        
        // Tab visibility
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this.pause();
            } else {
                this.resume();
            }
        });
    }

    /**
     * Handle window resize
     */
    onWindowResize() {
        this.performance.onWindowResize(this.renderer, this.camera);
        
        if (this.composer) {
            this.composer.setSize(window.innerWidth, window.innerHeight);
        }
    }

    /**
     * Update scene (called every frame)
     */
    update(deltaTime) {
        this.time += deltaTime;
        
        // Update galaxy
        if (this.galaxy) {
            this.galaxy.material.uniforms.time.value = this.time;
            this.galaxy.rotation.z += deltaTime * 0.01;
        }
        
        // Update aurora
        if (this.aurora) {
            this.aurora.material.uniforms.time.value = this.time;
            this.aurora.material.uniforms.speed.value = 0.5;
        }
        
        // Update stars
        if (this.stars) {
            this.stars.rotation.z += deltaTime * 0.0001;
        }
        
        // Update camera parallax
        this.camera.position.x += (this.mousePosition.x * 0.5 - this.camera.position.x) * 0.05;
        this.camera.position.y += (this.mousePosition.y * 0.5 - this.camera.position.y) * 0.05;
        this.camera.lookAt(0, 0, 0);
        
        // Update shooting stars
        this.updateShootingStars(deltaTime);
        
        // Update particles
        this.updateParticles(deltaTime);
        
        // Update performance metrics
        this.performance.updatePerformanceMetrics();
    }

    /**
     * Update shooting stars
     */
    updateShootingStars(deltaTime) {
        for (let i = this.shootingStars.length - 1; i >= 0; i--) {
            const star = this.shootingStars[i];
            
            star.position.add(star.userData.velocity);
            star.userData.lifetime += deltaTime;
            
            const progress = star.userData.lifetime / star.userData.maxLifetime;
            star.material.opacity = 1 - progress;
            
            if (progress >= 1) {
                this.scene.remove(star);
                this.shootingStars.splice(i, 1);
            }
        }
    }

    /**
     * Update particles
     */
    updateParticles(deltaTime) {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const particles = this.particles[i];
            const ages = particles.userData.ages;
            const lifetimes = particles.userData.lifetimes;
            const positions = particles.geometry.attributes.position.array;
            const velocities = particles.userData.velocities;
            
            let allDead = true;
            
            for (let j = 0; j < ages.length; j++) {
                ages[j] += deltaTime;
                
                if (ages[j] < lifetimes[j]) {
                    allDead = false;
                    
                    positions[j * 3] += velocities[j * 3];
                    positions[j * 3 + 1] += velocities[j * 3 + 1];
                    positions[j * 3 + 2] += velocities[j * 3 + 2];
                }
            }
            
            particles.geometry.attributes.position.needsUpdate = true;
            
            if (allDead) {
                this.scene.remove(particles);
                this.particles.splice(i, 1);
            }
        }
    }

    /**
     * Animation loop
     */
    animate() {
        if (!this.isRunning) {
            requestAnimationFrame(() => this.animate());
            return;
        }
        
        const deltaTime = 0.016; // ~60 FPS
        
        this.update(deltaTime);
        this.render();
        
        requestAnimationFrame(() => this.animate());
    }

    /**
     * Render scene
     */
    render() {
        if (this.composer) {
            this.composer.render();
        } else {
            this.renderer.render(this.scene, this.camera);
        }
    }

    /**
     * Pause animation
     */
    pause() {
        this.isRunning = false;
        console.log('⏸️ Animation paused');
    }

    /**
     * Resume animation
     */
    resume() {
        this.isRunning = true;
        console.log('▶️ Animation resumed');
    }

    /**
     * Trigger aurora effect
     */
    triggerAuroraEffect() {
        if (this.aurora) {
            this.aurora.material.uniforms.intensity.value = 2;
            this.aurora.material.uniforms.speed.value = 2;
            
            setTimeout(() => {
                if (this.aurora) {
                    this.aurora.material.uniforms.intensity.value = 1.5;
                    this.aurora.material.uniforms.speed.value = 0.5;
                }
            }, 1000);
        }
    }

    /**
     * Trigger particle burst
     */
    triggerParticleBurst(position, count = 200) {
        this.createParticleSystem(position, count);
    }

    /**
     * Spawn multiple shooting stars
     */
    spawnShootingStars(count = 5) {
        for (let i = 0; i < count; i++) {
            setTimeout(() => {
                this.createShootingStar();
            }, i * 100);
        }
    }

    /**
     * Change galaxy colors
     */
    setGalaxyColors(color1, color2, color3) {
        if (this.galaxy) {
            this.galaxy.material.uniforms.color1.value = new THREE.Color(color1);
            this.galaxy.material.uniforms.color2.value = new THREE.Color(color2);
            this.galaxy.material.uniforms.color3.value = new THREE.Color(color3);
        }
    }

    /**
     * Get scene info
     */
    getSceneInfo() {
        return {
            shootingStars: this.shootingStars.length,
            particles: this.particles.length,
            time: this.time,
            isRunning: this.isRunning
        };
    }

    /**
     * Cleanup and dispose
     */
    dispose() {
        this.scene.traverse((child) => {
            if (child.geometry) child.geometry.dispose();
            if (child.material) child.material.dispose();
        });
        
        this.renderer.dispose();
        console.log('🧹 Three.js scene disposed');
    }
}

// Global scene manager instance
let threeSceneManager = null;

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    if (!threeSceneManager) {
        threeSceneManager = new ThreeSceneManager();
    }
});

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ThreeSceneManager;
}
