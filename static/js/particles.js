/**
 * DUODRIVEN Particle System
 * Three.js based neural network particle visualization
 */

class ParticleSystem {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        if (!this.canvas) return;
        
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.particles = null;
        this.connections = null;
        this.mouseX = 0;
        this.mouseY = 0;
        this.targetMouseX = 0;
        this.targetMouseY = 0;
        this.windowHalfX = window.innerWidth / 2;
        this.windowHalfY = window.innerHeight / 2;
        this.particleCount = window.innerWidth < 768 ? 80 : 150;
        this.connectionDistance = window.innerWidth < 768 ? 100 : 150;
        
        this.init();
    }
    
    init() {
        // Check if Three.js is available
        if (typeof THREE === 'undefined') {
            console.warn('Three.js not loaded, skipping particle system');
            return;
        }
        
        // Check for reduced motion preference
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
            return;
        }
        
        this.createScene();
        this.createParticles();
        this.createConnections();
        this.addEventListeners();
        this.animate();
    }
    
    createScene() {
        // Scene
        this.scene = new THREE.Scene();
        
        // Camera
        this.camera = new THREE.PerspectiveCamera(
            75,
            window.innerWidth / window.innerHeight,
            1,
            2000
        );
        this.camera.position.z = 500;
        
        // Renderer
        this.renderer = new THREE.WebGLRenderer({
            canvas: this.canvas,
            alpha: true,
            antialias: true
        });
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setClearColor(0x000000, 0);
    }
    
    createParticles() {
        const geometry = new THREE.BufferGeometry();
        const positions = new Float32Array(this.particleCount * 3);
        const velocities = new Float32Array(this.particleCount * 3);
        const colors = new Float32Array(this.particleCount * 3);
        
        // Color palette
        const colorPalette = [
            new THREE.Color(0x3B82F6), // Blue
            new THREE.Color(0x06B6D4), // Cyan
            new THREE.Color(0x8B5CF6), // Purple
            new THREE.Color(0x10B981), // Emerald
        ];
        
        for (let i = 0; i < this.particleCount; i++) {
            const i3 = i * 3;
            
            // Position - spread in a sphere
            positions[i3] = (Math.random() - 0.5) * 1000;
            positions[i3 + 1] = (Math.random() - 0.5) * 600;
            positions[i3 + 2] = (Math.random() - 0.5) * 500;
            
            // Velocity
            velocities[i3] = (Math.random() - 0.5) * 0.5;
            velocities[i3 + 1] = (Math.random() - 0.5) * 0.5;
            velocities[i3 + 2] = (Math.random() - 0.5) * 0.5;
            
            // Color - random from palette
            const color = colorPalette[Math.floor(Math.random() * colorPalette.length)];
            colors[i3] = color.r;
            colors[i3 + 1] = color.g;
            colors[i3 + 2] = color.b;
        }
        
        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        
        // Store velocities for animation
        this.velocities = velocities;
        
        // Material
        const material = new THREE.PointsMaterial({
            size: 4,
            vertexColors: true,
            transparent: true,
            opacity: 0.8,
            blending: THREE.AdditiveBlending,
            sizeAttenuation: true
        });
        
        this.particles = new THREE.Points(geometry, material);
        this.scene.add(this.particles);
    }
    
    createConnections() {
        // Create line geometry for connections
        const geometry = new THREE.BufferGeometry();
        const maxConnections = this.particleCount * 10;
        const positions = new Float32Array(maxConnections * 6);
        const colors = new Float32Array(maxConnections * 6);
        
        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        geometry.setDrawRange(0, 0);
        
        const material = new THREE.LineBasicMaterial({
            vertexColors: true,
            transparent: true,
            opacity: 0.4,
            blending: THREE.AdditiveBlending
        });
        
        this.connections = new THREE.LineSegments(geometry, material);
        this.scene.add(this.connections);
    }
    
    updateConnections() {
        if (!this.particles || !this.connections) return;
        
        const positions = this.particles.geometry.attributes.position.array;
        const particleColors = this.particles.geometry.attributes.color.array;
        const connectionPositions = this.connections.geometry.attributes.position.array;
        const connectionColors = this.connections.geometry.attributes.color.array;
        
        let vertexIndex = 0;
        
        for (let i = 0; i < this.particleCount; i++) {
            const i3 = i * 3;
            const x1 = positions[i3];
            const y1 = positions[i3 + 1];
            const z1 = positions[i3 + 2];
            
            for (let j = i + 1; j < this.particleCount; j++) {
                const j3 = j * 3;
                const x2 = positions[j3];
                const y2 = positions[j3 + 1];
                const z2 = positions[j3 + 2];
                
                const dx = x1 - x2;
                const dy = y1 - y2;
                const dz = z1 - z2;
                const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
                
                if (dist < this.connectionDistance) {
                    const alpha = 1 - (dist / this.connectionDistance);
                    
                    connectionPositions[vertexIndex] = x1;
                    connectionPositions[vertexIndex + 1] = y1;
                    connectionPositions[vertexIndex + 2] = z1;
                    connectionPositions[vertexIndex + 3] = x2;
                    connectionPositions[vertexIndex + 4] = y2;
                    connectionPositions[vertexIndex + 5] = z2;
                    
                    // Blend colors
                    connectionColors[vertexIndex] = particleColors[i3] * alpha;
                    connectionColors[vertexIndex + 1] = particleColors[i3 + 1] * alpha;
                    connectionColors[vertexIndex + 2] = particleColors[i3 + 2] * alpha;
                    connectionColors[vertexIndex + 3] = particleColors[j3] * alpha;
                    connectionColors[vertexIndex + 4] = particleColors[j3 + 1] * alpha;
                    connectionColors[vertexIndex + 5] = particleColors[j3 + 2] * alpha;
                    
                    vertexIndex += 6;
                }
            }
        }
        
        this.connections.geometry.setDrawRange(0, vertexIndex / 3);
        this.connections.geometry.attributes.position.needsUpdate = true;
        this.connections.geometry.attributes.color.needsUpdate = true;
    }
    
    addEventListeners() {
        // Mouse move
        document.addEventListener('mousemove', (event) => {
            this.targetMouseX = (event.clientX - this.windowHalfX) * 0.5;
            this.targetMouseY = (event.clientY - this.windowHalfY) * 0.5;
        });
        
        // Touch move for mobile
        document.addEventListener('touchmove', (event) => {
            if (event.touches.length === 1) {
                this.targetMouseX = (event.touches[0].clientX - this.windowHalfX) * 0.5;
                this.targetMouseY = (event.touches[0].clientY - this.windowHalfY) * 0.5;
            }
        });
        
        // Window resize
        window.addEventListener('resize', () => {
            this.windowHalfX = window.innerWidth / 2;
            this.windowHalfY = window.innerHeight / 2;
            
            this.camera.aspect = window.innerWidth / window.innerHeight;
            this.camera.updateProjectionMatrix();
            
            this.renderer.setSize(window.innerWidth, window.innerHeight);
        });
    }
    
    animate() {
        if (!this.renderer) return;
        
        requestAnimationFrame(() => this.animate());
        
        // Smooth mouse movement
        this.mouseX += (this.targetMouseX - this.mouseX) * 0.05;
        this.mouseY += (this.targetMouseY - this.mouseY) * 0.05;
        
        // Rotate camera based on mouse
        this.camera.position.x += (this.mouseX - this.camera.position.x) * 0.05;
        this.camera.position.y += (-this.mouseY - this.camera.position.y) * 0.05;
        this.camera.lookAt(this.scene.position);
        
        // Animate particles
        if (this.particles) {
            const positions = this.particles.geometry.attributes.position.array;
            
            for (let i = 0; i < this.particleCount; i++) {
                const i3 = i * 3;
                
                // Move particles
                positions[i3] += this.velocities[i3];
                positions[i3 + 1] += this.velocities[i3 + 1];
                positions[i3 + 2] += this.velocities[i3 + 2];
                
                // Bounce off boundaries
                if (positions[i3] > 500 || positions[i3] < -500) {
                    this.velocities[i3] *= -1;
                }
                if (positions[i3 + 1] > 300 || positions[i3 + 1] < -300) {
                    this.velocities[i3 + 1] *= -1;
                }
                if (positions[i3 + 2] > 250 || positions[i3 + 2] < -250) {
                    this.velocities[i3 + 2] *= -1;
                }
            }
            
            this.particles.geometry.attributes.position.needsUpdate = true;
        }
        
        // Update connections
        this.updateConnections();
        
        // Render
        this.renderer.render(this.scene, this.camera);
    }
    
    destroy() {
        if (this.renderer) {
            this.renderer.dispose();
        }
        if (this.particles) {
            this.particles.geometry.dispose();
            this.particles.material.dispose();
        }
        if (this.connections) {
            this.connections.geometry.dispose();
            this.connections.material.dispose();
        }
    }
}

// Initialize particle system when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    // Only initialize on pages with the canvas
    const canvas = document.getElementById('particles-canvas');
    if (canvas) {
        window.particleSystem = new ParticleSystem('particles-canvas');
    }
});

// Export for module usage
window.ParticleSystem = ParticleSystem;
