// tensor-field-visualizer.js
// Utilities for visualizing 4D tensor fields in 3D space
// Maps higher dimensions to visual properties like color, particle density, and animation

/**
 * TensorFieldVisualizer - Renders 4D tensor spaces as 3D visual effects
 * Uses Three.js particles, shaders, and volumetric techniques
 */
export class TensorFieldVisualizer {
  constructor(scene, options = {}) {
    this.scene = scene;
    this.tensorMeshes = new Map(); // itemId -> particle system/mesh
    this.tensorData = new Map(); // itemId -> tensor properties
    
    this.options = {
      particleCount: options.particleCount || 1000,
      particleSize: options.particleSize || 0.5,
      particleSpeed: options.particleSpeed || 0.01,
      useVolume: options.useVolume !== false,
      animationEnabled: options.animationEnabled !== false,
      ...options
    };

    this.animationTime = 0;
  }

  /**
   * Create particle cloud for a tensor field
   * Projects 4D tensor into 3D space with color and animation
   */
  createTensorFieldVisualization(itemId, tensorData, geometryPosition = { x: 0, y: 0, z: 0 }) {
    const { d0, d1, intensity, frequency, phase } = tensorData;

    // Normalize d0, d1 to [0, 1] range for particle distribution
    const normalizedD0 = (d0 + 1) / 2; // Assume d0 in [-1, 1]
    const normalizedD1 = (d1 + 1) / 2; // Assume d1 in [-1, 1]

    // Create particle geometry
    const particleGeometry = new THREE.BufferGeometry();
    const particleCount = Math.max(100, Math.floor(this.options.particleCount * intensity));

    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);
    const velocities = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount; i++) {
      // Random position around the center (spread based on tensor dimensions)
      const spreadRadius = 5 * intensity;
      positions[i * 3] = geometryPosition.x + (Math.random() - 0.5) * spreadRadius;
      positions[i * 3 + 1] = geometryPosition.y + (Math.random() - 0.5) * spreadRadius;
      positions[i * 3 + 2] = geometryPosition.z + (Math.random() - 0.5) * spreadRadius;

      // Color based on 4D values (d0 -> red, d1 -> green, intensity -> blue)
      colors[i * 3] = normalizedD0 * intensity;     // Red channel
      colors[i * 3 + 1] = normalizedD1 * intensity; // Green channel
      colors[i * 3 + 2] = intensity;                // Blue channel

      // Velocity based on frequency
      const angle = Math.random() * Math.PI * 2;
      const speed = this.options.particleSpeed * frequency;
      velocities[i * 3] = Math.cos(angle) * speed;
      velocities[i * 3 + 1] = Math.sin(angle) * speed;
      velocities[i * 3 + 2] = (Math.random() - 0.5) * speed;
    }

    particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    particleGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    particleGeometry.setAttribute('velocity', new THREE.BufferAttribute(velocities, 3));

    // Create particle material
    const material = new THREE.PointsMaterial({
      size: this.options.particleSize,
      sizeAttenuation: true,
      vertexColors: true,
      transparent: true,
      opacity: 0.6,
      map: this._createParticleTexture()
    });

    // Create particle system
    const particles = new THREE.Points(particleGeometry, material);
    particles.userData.frequency = frequency;
    particles.userData.phase = phase;
    particles.userData.intensity = intensity;
    particles.userData.d0 = d0;
    particles.userData.d1 = d1;
    particles.userData.geometryPosition = geometryPosition;

    this.scene.add(particles);
    this.tensorMeshes.set(itemId, particles);
    this.tensorData.set(itemId, { d0, d1, intensity, frequency, phase, particleCount });

    return particles;
  }

  /**
   * Create texture for particles (soft circle)
   * @private
   */
  _createParticleTexture() {
    // In browser environment, create a canvas texture
    if (typeof document !== 'undefined') {
      const canvas = document.createElement('canvas');
      canvas.width = 32;
      canvas.height = 32;

      const ctx = canvas.getContext('2d');
      ctx.fillStyle = 'white';
      ctx.beginPath();
      ctx.arc(16, 16, 16, 0, Math.PI * 2);
      ctx.fill();

      const texture = new THREE.CanvasTexture(canvas);
      return texture;
    }
    // In Node.js environment (testing), return null or a mock
    return null;
  }

  /**
   * Update tensor field animation
   * Called each frame to animate particles
   */
  updateTensorFields(deltaTime = 0.016) {
    this.animationTime += deltaTime;

    this.tensorMeshes.forEach((particles, itemId) => {
      if (!this.options.animationEnabled) return;

      const positionAttr = particles.geometry.getAttribute('position');
      const positions = positionAttr.array;
      const velocities = particles.geometry.getAttribute('velocity').array;

      const { frequency, phase, geometryPosition } = particles.userData;
      const time = this.animationTime * frequency + phase;

      // Update particle positions with orbital motion
      for (let i = 0; i < positions.length; i += 3) {
        const idx = i / 3;
        const angle = (idx / (positions.length / 3)) * Math.PI * 2 + time;
        const radius = 5 * particles.userData.intensity;

        // Circular orbit around the base geometry
        positions[i] = geometryPosition.x + Math.cos(angle) * radius;
        positions[i + 1] = geometryPosition.y + Math.sin(angle * 0.7) * radius;
        positions[i + 2] = geometryPosition.z + Math.sin(angle) * radius;
      }

      positionAttr.needsUpdate = true;
    });
  }

  /**
   * Update tensor field properties (e.g., when mutation occurs)
   */
  updateTensorField(itemId, updates = {}) {
    const particles = this.tensorMeshes.get(itemId);
    if (!particles) return;

    const tensorData = this.tensorData.get(itemId);
    if (!tensorData) return;

    const { intensity, frequency, phase, color } = updates;

    if (intensity !== undefined) {
      particles.userData.intensity = intensity;
      tensorData.intensity = intensity;
      // Adjust particle opacity based on intensity
      particles.material.opacity = Math.min(1, 0.6 * intensity);
    }

    if (frequency !== undefined) {
      particles.userData.frequency = frequency;
      tensorData.frequency = frequency;
    }

    if (phase !== undefined) {
      particles.userData.phase = phase;
      tensorData.phase = phase;
    }

    if (color) {
      // Update color mapping
      const colorAttr = particles.geometry.getAttribute('color');
      const colors = colorAttr.array;
      const rgb = this._hexToRgb(color);
      for (let i = 0; i < colors.length; i += 3) {
        colors[i] = rgb.r / 255;
        colors[i + 1] = rgb.g / 255;
        colors[i + 2] = rgb.b / 255;
      }
      colorAttr.needsUpdate = true;
    }
  }

  /**
   * Remove tensor field visualization
   */
  removeTensorField(itemId) {
    const particles = this.tensorMeshes.get(itemId);
    if (particles) {
      this.scene.remove(particles);
      particles.geometry.dispose();
      particles.material.dispose();
      this.tensorMeshes.delete(itemId);
      this.tensorData.delete(itemId);
    }
  }

  /**
   * Get all active tensor visualizations
   */
  getTensorFields() {
    return Array.from(this.tensorData.entries()).map(([itemId, data]) => ({
      itemId,
      ...data,
      isVisible: this.tensorMeshes.has(itemId)
    }));
  }

  /**
   * Toggle tensor field visibility
   */
  setTensorFieldVisible(itemId, visible) {
    const particles = this.tensorMeshes.get(itemId);
    if (particles) {
      particles.visible = visible;
    }
  }

  /**
   * Get statistics for debugging
   */
  getStatistics() {
    let totalParticles = 0;
    this.tensorMeshes.forEach(particles => {
      totalParticles += particles.geometry.getAttribute('position').count;
    });

    return {
      activeTensorFields: this.tensorMeshes.size,
      totalParticles,
      animationTime: this.animationTime
    };
  }

  /**
   * Convert hex color to RGB
   * @private
   */
  _hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : { r: 255, g: 107, b: 107 };
  }

  /**
   * Clear all tensor visualizations
   */
  clear() {
    this.tensorMeshes.forEach((particles) => {
      this.scene.remove(particles);
      particles.geometry.dispose();
      particles.material.dispose();
    });
    this.tensorMeshes.clear();
    this.tensorData.clear();
  }

  /**
   * Get animation time (for shader uniforms)
   */
  getAnimationTime() {
    return this.animationTime;
  }

  /**
   * Set animation time manually (for synchronization)
   */
  setAnimationTime(time) {
    this.animationTime = time;
  }
}

/**
 * Helper: Analyze tensor field intensity distribution
 */
export function analyzeTensorFieldIntensity(tensorFields) {
  if (tensorFields.length === 0) {
    return { min: 0, max: 0, average: 0, distribution: [] };
  }

  const intensities = tensorFields.map(t => t.intensity);
  const min = Math.min(...intensities);
  const max = Math.max(...intensities);
  const average = intensities.reduce((a, b) => a + b, 0) / intensities.length;

  // Create 10-bucket histogram
  const buckets = Array(10).fill(0);
  for (const intensity of intensities) {
    const bucket = Math.floor((intensity - min) / (max - min + 0.001) * 9);
    buckets[bucket]++;
  }

  return { min, max, average, distribution: buckets };
}

/**
 * Helper: Generate heatmap texture for tensor visualization
 */
export function generateTensorHeatmap(width = 128, height = 128) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext('2d');
  const imageData = ctx.createImageData(width, height);
  const data = imageData.data;

  for (let i = 0; i < data.length; i += 4) {
    const value = Math.random();
    data[i] = Math.floor(value * 255);     // Red
    data[i + 1] = Math.floor((1 - value) * 255); // Green
    data[i + 2] = 128;                     // Blue
    data[i + 3] = 200;                     // Alpha
  }

  ctx.putImageData(imageData, 0, 0);
  return new THREE.CanvasTexture(canvas);
}
