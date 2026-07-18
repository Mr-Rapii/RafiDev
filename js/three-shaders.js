// ================================
// THREE.JS CUSTOM SHADERS
// Aurora, Nebula, and Galaxy Effects
// ================================

/**
 * Custom GLSL shaders for advanced visual effects
 */

const ThreeShaders = {
    // ================================
    // AURORA SHADER
    // ================================
    aurora: {
        uniforms: {
            time: { value: 0 },
            speed: { value: 1.0 },
            intensity: { value: 1.5 },
            color1: { value: new THREE.Color(0x00ff88) },
            color2: { value: new THREE.Color(0x0066ff) },
            color3: { value: new THREE.Color(0xff00ff) }
        },
        vertexShader: `
            varying vec2 vUv;
            varying vec3 vPosition;
            varying float vNoise;

            // Simple 2D noise function
            float noise(vec2 p) {
                return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
            }

            void main() {
                vUv = uv;
                vPosition = position;
                vNoise = noise(position.xy * 0.5 + time * 0.1);
                gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
        `,
        fragmentShader: `
            uniform float time;
            uniform float speed;
            uniform float intensity;
            uniform vec3 color1;
            uniform vec3 color2;
            uniform vec3 color3;

            varying vec2 vUv;
            varying vec3 vPosition;
            varying float vNoise;

            float fbm(vec2 p) {
                float value = 0.0;
                float amplitude = 0.5;
                for (int i = 0; i < 4; i++) {
                    value += amplitude * fract(sin(dot(p, vec2(12.9898 + float(i), 78.233 + float(i)))) * 43758.5453);
                    p *= 2.0;
                    amplitude *= 0.5;
                }
                return value;
            }

            void main() {
                vec2 p = vUv;
                p.x += time * speed * 0.3;
                
                float noise1 = fbm(p);
                float noise2 = fbm(p + time * speed * 0.2);
                float noise3 = fbm(p - time * speed * 0.15);

                vec3 color = mix(color1, color2, noise1);
                color = mix(color, color3, noise2);

                float alpha = noise1 * noise2 * noise3 * intensity;
                gl_FragColor = vec4(color, alpha);
            }
        `
    },

    // ================================
    // NEBULA SHADER
    // ================================
    nebula: {
        uniforms: {
            time: { value: 0 },
            scale: { value: 2.0 },
            intensity: { value: 1.0 },
            color1: { value: new THREE.Color(0xff00ff) },
            color2: { value: new THREE.Color(0x00ffff) },
            color3: { value: new THREE.Color(0xff0080) }
        },
        vertexShader: `
            varying vec2 vUv;
            varying vec3 vPosition;

            void main() {
                vUv = uv;
                vPosition = position;
                gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
        `,
        fragmentShader: `
            uniform float time;
            uniform float scale;
            uniform float intensity;
            uniform vec3 color1;
            uniform vec3 color2;
            uniform vec3 color3;

            varying vec2 vUv;
            varying vec3 vPosition;

            // Improved Perlin-like noise
            vec3 hash3(vec2 p) {
                vec3 q = vec3(dot(p, vec2(127.1, 311.7)),
                             dot(p, vec2(269.5, 183.3)),
                             dot(p, vec2(419.2, 371.9)));
                return fract(sin(q) * 43758.5453);
            }

            float noise3d(vec2 p) {
                vec2 i = floor(p);
                vec2 f = fract(p);
                f = f * f * (3.0 - 2.0 * f);

                vec3 ra = hash3(i + vec2(0.0, 0.0));
                vec3 rb = hash3(i + vec2(1.0, 0.0));
                vec3 rc = hash3(i + vec2(0.0, 1.0));
                vec3 rd = hash3(i + vec2(1.0, 1.0));

                float a = mix(ra.x, rb.x, f.x);
                float b = mix(rc.x, rd.x, f.x);
                return mix(a, b, f.y);
            }

            float fbm(vec2 p) {
                float value = 0.0;
                float amplitude = 1.0;
                for (int i = 0; i < 5; i++) {
                    value += amplitude * noise3d(p);
                    p *= 2.0;
                    amplitude *= 0.5;
                }
                return value;
            }

            void main() {
                vec2 p = vUv * scale;
                p += vec2(time * 0.1, time * 0.15);

                float n1 = fbm(p);
                float n2 = fbm(p + 100.0);
                float n3 = fbm(p + 200.0);

                vec3 color = mix(color1, color2, n1);
                color = mix(color, color3, n2);

                float alpha = (n1 + n2 + n3) * 0.33 * intensity;
                gl_FragColor = vec4(color, clamp(alpha, 0.0, 1.0));
            }
        `
    },

    // ================================
    // GALAXY SHADER
    // ================================
    galaxy: {
        uniforms: {
            time: { value: 0 },
            rotation: { value: 0.0 },
            armCount: { value: 3.0 },
            color: { value: new THREE.Color(0x0066ff) }
        },
        vertexShader: `
            varying vec2 vUv;
            varying vec3 vPosition;
            varying float vDepth;

            void main() {
                vUv = uv;
                vPosition = position;
                vDepth = position.z;
                gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
        `,
        fragmentShader: `
            uniform float time;
            uniform float rotation;
            uniform float armCount;
            uniform vec3 color;

            varying vec2 vUv;
            varying vec3 vPosition;
            varying float vDepth;

            void main() {
                vec2 center = vec2(0.5, 0.5);
                vec2 p = vUv - center;
                
                float angle = atan(p.y, p.x);
                float distance = length(p);
                
                // Spiral arms
                float spiralAngle = angle - distance * 5.0 + time * 0.5;
                float arms = abs(sin(spiralAngle * armCount));
                
                // Brightness falloff
                float brightness = 1.0 / (1.0 + distance * distance * 4.0);
                brightness *= arms;
                
                vec3 galaxyColor = color * brightness;
                float alpha = brightness;
                
                gl_FragColor = vec4(galaxyColor, alpha);
            }
        `
    },

    // ================================
    // LENS FLARE SHADER
    // ================================
    lensFlare: {
        uniforms: {
            time: { value: 0 },
            position: { value: new THREE.Vector2(0.5, 0.5) },
            intensity: { value: 1.0 }
        },
        vertexShader: `
            varying vec2 vUv;

            void main() {
                vUv = uv;
                gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
        `,
        fragmentShader: `
            uniform float time;
            uniform vec2 position;
            uniform float intensity;

            varying vec2 vUv;

            void main() {
                vec2 p = vUv - position;
                float distance = length(p);
                
                // Main flare
                float flare = intensity / (distance * distance + 0.1);
                
                // Secondary flares
                vec2 reflected = position + p * 0.5;
                float flare2 = 0.3 / (length(vUv - reflected) + 0.1);
                
                float totalFlare = flare + flare2;
                
                gl_FragColor = vec4(vec3(1.0, 0.9, 0.7) * totalFlare, totalFlare * 0.5);
            }
        `
    },

    // ================================
    // BLOOM SHADER (Post-processing)
    // ================================
    bloom: {
        uniforms: {
            tDiffuse: { value: null },
            threshold: { value: 0.5 },
            intensity: { value: 1.0 }
        },
        vertexShader: `
            varying vec2 vUv;

            void main() {
                vUv = uv;
                gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
        `,
        fragmentShader: `
            uniform sampler2D tDiffuse;
            uniform float threshold;
            uniform float intensity;

            varying vec2 vUv;

            void main() {
                vec4 texel = texture2D(tDiffuse, vUv);
                float luminance = dot(texel.rgb, vec3(0.299, 0.587, 0.114));
                
                if (luminance > threshold) {
                    gl_FragColor = vec4(texel.rgb * intensity, texel.a);
                } else {
                    gl.FragColor = vec4(0.0);
                }
            }
        `
    },

    // ================================
    // STAR FIELD SHADER
    // ================================
    starField: {
        uniforms: {
            time: { value: 0 },
            density: { value: 0.5 },
            brightness: { value: 1.0 }
        },
        vertexShader: `
            varying vec3 vPosition;

            void main() {
                vPosition = position;
                gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
        `,
        fragmentShader: `
            uniform float time;
            uniform float density;
            uniform float brightness;

            varying vec3 vPosition;

            float hash(vec3 p) {
                p = fract(p * vec3(0.1031, 0.1030, 0.0973));
                p += dot(p, p.yzx + 33.33);
                return fract((p.x + p.y) * p.z);
            }

            void main() {
                vec3 p = vPosition * density;
                float h = hash(p);
                
                if (h > 0.99) {
                    // Twinkling effect
                    float twinkle = sin(time * (1.0 + h * 10.0)) * 0.5 + 0.5;
                    gl_FragColor = vec4(vec3(1.0) * brightness * twinkle, 1.0);
                } else {
                    gl_FragColor = vec4(0.0);
                }
            }
        `
    },

    // ================================
    // PARTICLE SHADER
    // ================================
    particle: {
        uniforms: {
            time: { value: 0 },
            color: { value: new THREE.Color(0x00ff88) },
            size: { value: 1.0 }
        },
        vertexShader: `
            uniform float time;
            uniform float size;

            attribute float lifetime;
            attribute float age;

            varying float vAlpha;
            varying float vAge;

            void main() {
                vAge = age;
                vAlpha = 1.0 - (age / lifetime);
                
                float scale = size * vAlpha;
                gl_PointSize = scale;
                gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
        `,
        fragmentShader: `
            uniform vec3 color;

            varying float vAlpha;
            varying float vAge;

            void main() {
                vec2 p = gl_PointCoord - 0.5;
                float dist = length(p);
                
                if (dist > 0.5) {
                    discard;
                }
                
                float alpha = vAlpha * (1.0 - dist * 2.0);
                gl_FragColor = vec4(color, alpha);
            }
        `
    },

    // ================================
    // GLOW SHADER
    // ================================
    glow: {
        uniforms: {
            time: { value: 0 },
            glowColor: { value: new THREE.Color(0x00ff88) },
            glowIntensity: { value: 1.0 }
        },
        vertexShader: `
            varying vec3 vNormal;
            varying vec3 vPosition;

            void main() {
                vNormal = normalize(normalMatrix * normal);
                vPosition = (modelViewMatrix * vec4(position, 1.0)).xyz;
                gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
        `,
        fragmentShader: `
            uniform vec3 glowColor;
            uniform float glowIntensity;
            uniform float time;

            varying vec3 vNormal;
            varying vec3 vPosition;

            void main() {
                vec3 viewDir = normalize(-vPosition);
                float rim = 1.0 - abs(dot(viewDir, vNormal));
                rim = pow(rim, 2.0);
                
                vec3 glow = glowColor * rim * glowIntensity;
                float alpha = rim * (sin(time) * 0.5 + 0.5);
                
                gl_FragColor = vec4(glow, alpha);
            }
        `
    },

    // ================================
    // VOLUMETRIC LIGHT SHADER
    // ================================
    volumetricLight: {
        uniforms: {
            lightPosition: { value: new THREE.Vector3(0, 0, 0) },
            density: { value: 0.5 },
            decay: { value: 0.95 },
            exposure: { value: 0.6 },
            samples: { value: 30.0 }
        },
        vertexShader: `
            varying vec2 vUv;

            void main() {
                vUv = uv;
                gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
        `,
        fragmentShader: `
            uniform vec3 lightPosition;
            uniform float density;
            uniform float decay;
            uniform float exposure;
            uniform float samples;

            varying vec2 vUv;

            void main() {
                vec2 texCoord = vUv;
                vec2 lightScreenPos = vec2(0.5, 0.5);
                
                vec2 deltaTexCoord = (texCoord - lightScreenPos) / samples;
                vec3 illuminationDecay = vec3(1.0);
                vec3 color = vec3(0.0);
                
                for (float i = 0.0; i < 100.0; i += 1.0) {
                    if (i >= samples) break;
                    
                    texCoord -= deltaTexCoord;
                    color += illuminationDecay;
                    illuminationDecay *= decay;
                }
                
                color *= exposure * density;
                gl_FragColor = vec4(color, 1.0);
            }
        `
    }
};

// Export shaders
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ThreeShaders;
}
