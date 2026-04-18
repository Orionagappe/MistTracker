/**
 * ParticleVisualizer.js - Phase 5.6: Particle Visualization
 * 
 * Renders emergent particles (photons) from wave-orbital interactions
 * with trajectories, energy-based coloring, and lifetime animation.
 * 
 * Features:
 * - Renders particles as glowing spheres
 * - Color-codes by frequency/energy (red=low → violet=high)
 * - Animated trails showing particle trajectories
 * - Fade-out effect as particles decay
 * - Statistics tracking (creation rate, energy distribution)
 * - Coherence visualization (brightness = coherence)
 */

import * as THREE from 'three';

class ParticleVisualizer {
  constructor(scene) {
    this.scene = scene;
    this.particles = new Map();        // itemId → particle data
    this.particleMeshes = new Map();   // itemId → Three.js mesh
    this.particleTrails = new Map();   // itemId → trail line
    this.particleGroups = new Map();   // itemId → Group (mesh + trail)
    
    // Frequency to color mapping (photon spectrum)
    // Red (low freq) → Orange → Yellow → Green → Blue → Violet (high freq)
    this.spectrumColors = [
      { freq: 1e14, color: 0xff0000 },   // Red (infrared)
      { freq: 5e14, color: 0xff6600 },   // Orange
      { freq: 6e14, color: 0xffff00 },   // Yellow (visible)
      { freq: 7e14, color: 0x00ff00 },   // Green
      { freq: 8e14, color: 0x0000ff },   // Blue
      { freq: 1e15, color: 0x8800ff }    // Violet (UV)
    ];
    
    // Particle pool for reuse
    this.particlePool = [];
    this.maxPoolSize = 1000;
    
    // Statistics
    this.stats = {
      totalParticlesCreated: 0,
      activeParticles: 0,
      maxConcurrent: 0,
      totalEnergy: 0,
      averageEnergy: 0
    };
  }

  /**
   * Get color for particle frequency
   * Maps spectrum of electromagnetic radiation to RGB colors
   * @param {number} frequency - Particle frequency in Hz
   * @returns {THREE.Color}
   */
  getColorForFrequency(frequency) {
    // Find surrounding spectrum stops
    let lower = this.spectrumColors[0];
    let upper = this.spectrumColors[this.spectrumColors.length - 1];
    
    for (let i = 0; i < this.spectrumColors.length - 1; i++) {
      if (frequency >= this.spectrumColors[i].freq 
          && frequency <= this.spectrumColors[i + 1].freq) {
        lower = this.spectrumColors[i];
        upper = this.spectrumColors[i + 1];
        break;
      }
    }
    
    // Interpolate between spectrum colors
    const t = (frequency - lower.freq) / (upper.freq - lower.freq);
    const lowerColor = new THREE.Color(lower.color);
    const upperColor = new THREE.Color(upper.color);
    
    const color = new THREE.Color();
    color.r = lowerColor.r + (upperColor.r - lowerColor.r) * t;
    color.g = lowerColor.g + (upperColor.g - lowerColor.g) * t;
    color.b = lowerColor.b + (upperColor.b - lowerColor.b) * t;
    
    return color;
  }

  /**
   * Create a particle visualization
   * @param {string} particleId - Unique particle ID
   * @param {Object} particleData - Particle data {position, frequency, energy, emergenceProbability}
   * @returns {string} Particle ID
   */
  createParticle(particleId, particleData) {
    if (!particleData) return null;
    
    const {
      position = [0, 0, 0],
      frequency = 6e14,  // Default: yellow light
      energy = 2.5,      // eV
      emergenceProbability = 0.8,
      momentum = [0, 0, 0],
      sourceOrbital = null
    } = particleData;

    // Create group for particle + trail
    const group = new THREE.Group();
    group.name = `particle-group-${particleId}`;
    this.scene.add(group);

    // Create particle mesh (small glowing sphere)
    const geometry = new THREE.SphereGeometry(0.5, 8, 8);  // Small, simple geometry
    const color = this.getColorForFrequency(frequency);
    
    const material = new THREE.MeshBasicMaterial({
      color,
      emissive: color,
      emissiveIntensity: 0.8,
      transparent: true,
      opacity: 0.9
    });

    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(position[0], position[1], position[2]);
    mesh.castShadow = false;
    mesh.receiveShadow = false;
    group.add(mesh);

    // Create particle trail (line following trajectory)
    const trailGeometry = new THREE.BufferGeometry();
    const trailPositions = new Float32Array([
      position[0], position[1], position[2],
      position[0], position[1], position[2]
    ]);
    trailGeometry.setAttribute('position', new THREE.BufferAttribute(trailPositions, 3));

    const trailMaterial = new THREE.LineBasicMaterial({
      color,
      transparent: true,
      opacity: 0.5,
      linewidth: 2
    });

    const trail = new THREE.Line(trailGeometry, trailMaterial);
    group.add(trail);

    // Store particle data
    const particle = {
      id: particleId,
      position: [...position],
      frequency,
      energy,
      emergenceProbability,
      momentum: [...momentum],
      sourceOrbital,
      creationTime: Date.now(),
      lifetime: 2000,  // ms - how long particle persists
      traveled: 0,     // distance traveled
      color,
      alive: true,
      mesh,
      trail,
      group
    };

    this.particles.set(particleId, particle);
    this.particleMeshes.set(particleId, mesh);
    this.particleTrails.set(particleId, trail);
    this.particleGroups.set(particleId, group);

    // Track statistics
    this.stats.totalParticlesCreated++;
    this.stats.activeParticles++;
    this.stats.totalEnergy += energy;
    this.stats.maxConcurrent = Math.max(
      this.stats.maxConcurrent,
      this.stats.activeParticles
    );

    return particleId;
  }

  /**
   * Update particle positions and animations
   * Called every frame to animate particles
   */
  updateParticles(dt = 0.016) {
    const currentTime = Date.now();
    const particlesToRemove = [];

    for (const [particleId, particle] of this.particles) {
      if (!particle.alive) continue;

      // Calculate age and lifetime progress
      const age = currentTime - particle.creationTime;
      const lifetimeProgress = age / particle.lifetime;

      // Check if particle should decay
      if (lifetimeProgress >= 1.0) {
        particlesToRemove.push(particleId);
        continue;
      }

      // Animate particle movement (initial momentum)
      const momentum = particle.momentum;
      const moveAmount = [
        momentum[0] * dt * 0.1,  // Scale for visualization
        momentum[1] * dt * 0.1,
        momentum[2] * dt * 0.1
      ];

      particle.position[0] += moveAmount[0];
      particle.position[1] += moveAmount[1];
      particle.position[2] += moveAmount[2];
      particle.traveled += Math.sqrt(
        moveAmount[0] ** 2 + moveAmount[1] ** 2 + moveAmount[2] ** 2
      );

      // Update mesh position
      particle.mesh.position.set(
        particle.position[0],
        particle.position[1],
        particle.position[2]
      );

      // Update trail
      const positions = particle.trail.geometry.attributes.position.array;
      positions[3] = particle.position[0];
      positions[4] = particle.position[1];
      positions[5] = particle.position[2];
      particle.trail.geometry.attributes.position.needsUpdate = true;

      // Fade out effect (opacity decays with age)
      const opacity = 0.9 * (1.0 - lifetimeProgress);
      particle.mesh.material.opacity = opacity;
      particle.trail.material.opacity = opacity * 0.5;

      // Pulse effect (brightness varies with coherence/probability)
      const pulse = 0.5 + 0.5 * Math.sin(lifetimeProgress * Math.PI * 4);
      particle.mesh.material.emissiveIntensity = particle.emergenceProbability * pulse * 0.8;

      // Slight size increase toward end (expansion effect)
      const scale = 1.0 + lifetimeProgress * 0.3;
      particle.mesh.scale.setScalar(scale);
    }

    // Remove expired particles
    for (const particleId of particlesToRemove) {
      this.removeParticle(particleId);
    }

    // Update statistics
    this.stats.activeParticles = this.particles.size;
    if (this.particles.size > 0) {
      this.stats.averageEnergy = this.stats.totalEnergy / this.stats.totalParticlesCreated;
    }
  }

  /**
   * Remove particle visualization
   * @param {string} particleId - Particle ID
   */
  removeParticle(particleId) {
    const particle = this.particles.get(particleId);
    if (!particle) return;

    // Mark as dead
    particle.alive = false;

    // Remove from scene
    if (particle.group) {
      this.scene.remove(particle.group);
      
      // Dispose geometries and materials
      particle.group.traverse(child => {
        if (child.geometry) child.geometry.dispose();
        if (child.material) child.material.dispose();
      });
    }

    // Clean up maps
    this.particles.delete(particleId);
    this.particleMeshes.delete(particleId);
    this.particleTrails.delete(particleId);
    this.particleGroups.delete(particleId);

    // Update statistics
    this.stats.activeParticles--;
  }

  /**
   * Add particles from physics update
   * @param {Array} newParticles - Array of particle data from physics engine
   */
  addParticles(newParticles) {
    if (!Array.isArray(newParticles)) return;

    for (const particleData of newParticles) {
      if (particleData && particleData.id) {
        // Only add if not already exists
        if (!this.particles.has(particleData.id)) {
          this.createParticle(particleData.id, particleData);
        }
      }
    }
  }

  /**
   * Remove all particles (cleanup)
   */
  removeAllParticles() {
    const particleIds = Array.from(this.particles.keys());
    for (const particleId of particleIds) {
      this.removeParticle(particleId);
    }
  }

  /**
   * Get particle statistics
   * @returns {Object} Statistics including count, energy, etc.
   */
  getStatistics() {
    return {
      ...this.stats,
      creationRate: this.stats.totalParticlesCreated > 0 
        ? (this.stats.totalParticlesCreated / (Date.now() / 1000)).toFixed(1)
        : 0
    };
  }

  /**
   * Get particle debug info
   * @returns {Array} Array of particle info objects
   */
  getParticleInfo() {
    const info = [];
    for (const particle of this.particles.values()) {
      info.push({
        id: particle.id,
        frequency: particle.frequency.toExponential(2),
        energy: particle.energy.toFixed(2),
        probability: particle.emergenceProbability.toFixed(2),
        traveled: particle.traveled.toExponential(2),
        age: (Date.now() - particle.creationTime).toFixed(0),
        lifetime: particle.lifetime,
        sourceOrbital: particle.sourceOrbital
      });
    }
    return info;
  }

  /**
   * Dispose of all particle resources
   */
  dispose() {
    this.removeAllParticles();
    this.particles.clear();
    this.particleMeshes.clear();
    this.particleTrails.clear();
    this.particleGroups.clear();
  }
}

export { ParticleVisualizer };
