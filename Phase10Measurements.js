/**
 * Phase 10.5: 4D Measurement System
 * 
 * Provides comprehensive measurement capabilities for 4D/7D spacetime:
 * - Minkowski distance calculations
 * - 4D angle measurements
 * - Hypervolume calculations
 * - Schwarzschild curvature
 * - Property extraction (momentum, energy, mass)
 * - Conservation law validation
 * 
 * @module Phase10Measurements
 */

/**
 * Core measurement engine for 4D/7D physics
 */
class Phase10Measurements {
  /**
   * Initialize measurement system
   * @param {Object} config - Configuration object
   * @param {number} config.c - Speed of light (default: 299792458 m/s)
   * @param {number} config.G - Gravitational constant (default: 6.674e-11)
   * @param {number} config.hbar - Reduced Planck constant (default: 1.055e-34)
   */
  constructor(config = {}) {
    this.c = config.c || 299792458; // m/s
    this.G = config.G || 6.674e-11; // m³/(kg·s²)
    this.hbar = config.hbar || 1.055e-34; // J·s
    
    this.metrics = {
      distanceMeasurements: 0,
      angleMeasurements: 0,
      energyChecks: 0,
      momentumChecks: 0,
      totalMeasurements: 0
    };
  }

  /**
   * Calculate Minkowski distance between two 4D spacetime points
   * Distance = sqrt(-(t1-t2)² + (x1-x2)² + (y1-y2)² + (z1-z2)²)
   * Uses spacetime metric signature (-,+,+,+)
   * 
   * @param {Array<number>} p1 - First point [t, x, y, z]
   * @param {Array<number>} p2 - Second point [t, x, y, z]
   * @returns {Object} {distance, type, interval}
   */
  calculateMinkowskiDistance(p1, p2) {
    const dt = p1[0] - p2[0];
    const dx = p1[1] - p2[1];
    const dy = p1[2] - p2[2];
    const dz = p1[3] - p2[3];
    
    // Minkowski metric: ds² = -(c*dt)² + dx² + dy² + dz²
    const ds2 = -((this.c * dt) ** 2) + dx**2 + dy**2 + dz**2;
    const ds = Math.sqrt(Math.abs(ds2));
    
    // Classify interval type
    let intervalType = 'spacelike';
    if (ds2 < 0) intervalType = 'timelike';
    if (Math.abs(ds2) < 1e-10) intervalType = 'lightlike';
    
    this.metrics.distanceMeasurements++;
    this.metrics.totalMeasurements++;
    
    return {
      distance: ds,
      intervalType: intervalType,
      ds2: ds2,
      components: { dt, dx, dy, dz }
    };
  }

  /**
   * Calculate 7D distance in full spacetime
   * Distance = sqrt(-(T0)² + (T1)² + (T2)² + (x)² + (y)² + (z)² + (w)²)
   * 
   * @param {Array<number>} p1 - First point [T0, T1, T2, x, y, z, w]
   * @param {Array<number>} p2 - Second point [T0, T1, T2, x, y, z, w]
   * @returns {Object} {distance, componentDistances}
   */
  calculate7DDistance(p1, p2) {
    const dT0 = p1[0] - p2[0];
    const dT1 = p1[1] - p2[1];
    const dT2 = p1[2] - p2[2];
    const dx = p1[3] - p2[3];
    const dy = p1[4] - p2[4];
    const dz = p1[5] - p2[5];
    const dw = p1[6] - p2[6];
    
    // 7D metric with temporal dimensions treated as spacelike for measurement
    const dist2 = dT0**2 + dT1**2 + dT2**2 + dx**2 + dy**2 + dz**2 + dw**2;
    const distance = Math.sqrt(dist2);
    
    this.metrics.distanceMeasurements++;
    this.metrics.totalMeasurements++;
    
    return {
      distance: distance,
      componentDistances: {
        temporal: Math.sqrt(dT0**2 + dT1**2 + dT2**2),
        spatial: Math.sqrt(dx**2 + dy**2 + dz**2),
        mass: Math.abs(dw)
      }
    };
  }

  /**
   * Calculate angle between two 4D vectors using Minkowski metric
   * cos(θ) = (v1·v2) / (|v1| |v2|) in Minkowski space
   * 
   * @param {Array<number>} v1 - First 4D vector [t, x, y, z]
   * @param {Array<number>} v2 - Second 4D vector [t, x, y, z]
   * @returns {Object} {angleRadians, angleDegrees, cosineSimilarity}
   */
  calculateAngle4D(v1, v2) {
    // Minkowski product: v1·v2 = -(t1*t2) + (x1*x2) + (y1*y2) + (z1*z2)
    const product = -((this.c * v1[0]) * (this.c * v2[0])) 
                  + v1[1] * v2[1] 
                  + v1[2] * v2[2] 
                  + v1[3] * v2[3];
    
    // Norm: |v| = sqrt(|-(c*t)² + x² + y² + z²|)
    const norm1_sq = Math.abs(-((this.c * v1[0])**2) + v1[1]**2 + v1[2]**2 + v1[3]**2);
    const norm2_sq = Math.abs(-((this.c * v2[0])**2) + v2[1]**2 + v2[2]**2 + v2[3]**2);
    
    if (norm1_sq < 1e-10 || norm2_sq < 1e-10) {
      return { angleRadians: 0, angleDegrees: 0, cosineSimilarity: 0 };
    }
    
    const norm1 = Math.sqrt(norm1_sq);
    const norm2 = Math.sqrt(norm2_sq);
    const cosineSimilarity = product / (norm1 * norm2);
    
    // Clamp to [-1, 1] to avoid numerical errors in acos
    const clamped = Math.max(-1, Math.min(1, cosineSimilarity));
    const angleRadians = Math.acos(clamped);
    const angleDegrees = angleRadians * 180 / Math.PI;
    
    this.metrics.angleMeasurements++;
    this.metrics.totalMeasurements++;
    
    return {
      angleRadians: angleRadians,
      angleDegrees: angleDegrees,
      cosineSimilarity: cosineSimilarity
    };
  }

  /**
   * Calculate hypervolume of collision region in 7D space
   * Hypervolume = ∏(dimension_size) for axis-aligned region
   * 
   * @param {Array<Object>} collisions - Array of collision objects with bounds
   * @returns {Object} {hypervolume, dimensionSizes, boundingBox}
   */
  calculateHypervolumeCollisionRegion(collisions) {
    if (collisions.length === 0) {
      return { hypervolume: 0, dimensionSizes: [], boundingBox: {} };
    }
    
    // Find bounding box in 7D space
    const bounds = {
      minT0: Infinity, maxT0: -Infinity,
      minT1: Infinity, maxT1: -Infinity,
      minT2: Infinity, maxT2: -Infinity,
      minX: Infinity, maxX: -Infinity,
      minY: Infinity, maxY: -Infinity,
      minZ: Infinity, maxZ: -Infinity,
      minW: Infinity, maxW: -Infinity
    };
    
    collisions.forEach(col => {
      const p = col.point || [0,0,0,0,0,0,0];
      bounds.minT0 = Math.min(bounds.minT0, p[0]); bounds.maxT0 = Math.max(bounds.maxT0, p[0]);
      bounds.minT1 = Math.min(bounds.minT1, p[1]); bounds.maxT1 = Math.max(bounds.maxT1, p[1]);
      bounds.minT2 = Math.min(bounds.minT2, p[2]); bounds.maxT2 = Math.max(bounds.maxT2, p[2]);
      bounds.minX = Math.min(bounds.minX, p[3]); bounds.maxX = Math.max(bounds.maxX, p[3]);
      bounds.minY = Math.min(bounds.minY, p[4]); bounds.maxY = Math.max(bounds.maxY, p[4]);
      bounds.minZ = Math.min(bounds.minZ, p[5]); bounds.maxZ = Math.max(bounds.maxZ, p[5]);
      bounds.minW = Math.min(bounds.minW, p[6]); bounds.maxW = Math.max(bounds.maxW, p[6]);
    });
    
    // Calculate dimension sizes
    const sizes = {
      T0: bounds.maxT0 - bounds.minT0,
      T1: bounds.maxT1 - bounds.minT1,
      T2: bounds.maxT2 - bounds.minT2,
      X: bounds.maxX - bounds.minX,
      Y: bounds.maxY - bounds.minY,
      Z: bounds.maxZ - bounds.minZ,
      W: bounds.maxW - bounds.minW
    };
    
    // Calculate hypervolume as product of dimension sizes
    const hypervolume = Object.values(sizes).reduce((acc, val) => acc * val, 1);
    
    return {
      hypervolume: hypervolume,
      dimensionSizes: sizes,
      boundingBox: bounds,
      dimensionality: 7
    };
  }

  /**
   * Calculate Schwarzschild curvature at a 4D spacetime point
   * R = 2*G*M/c² (Schwarzschild radius)
   * Curvature parameter k = 1 - R/r
   * 
   * @param {Array<number>} point - 4D point [t, x, y, z]
   * @param {number} mass - Mass of central body (kg)
   * @returns {Object} {curvature, schwarzschildRadius, timeDialation}
   */
  getSchwarzschildCurvature(point, mass = 1) {
    const x = point[1];
    const y = point[2];
    const z = point[3];
    
    // Distance from origin (center of mass)
    const r = Math.sqrt(x**2 + y**2 + z**2);
    
    // Schwarzschild radius: Rs = 2*G*M/c²
    const Rs = (2 * this.G * mass) / (this.c ** 2);
    
    // Avoid singularity at r = 0
    if (r < Rs) {
      return {
        curvature: Infinity,
        schwarzschildRadius: Rs,
        timeDialation: 0,
        region: 'inside event horizon'
      };
    }
    
    // Curvature parameter: k = 1 - Rs/r
    const curvature = 1 - Rs / r;
    
    // Time dilation factor: dt_proper/dt_coord = sqrt(1 - Rs/r)
    const timeDialation = Math.sqrt(Math.max(0, 1 - Rs / r));
    
    return {
      curvature: curvature,
      schwarzschildRadius: Rs,
      timeDialation: timeDialation,
      region: r < Rs ? 'inside' : (r < 3*Rs ? 'near' : 'far'),
      radialDistance: r
    };
  }

  /**
   * Extract momentum vector from particle
   * p = m * v (3-vector momentum)
   * p0 = E/c (energy component)
   * 
   * @param {Object} particle - Particle object with mass and velocity
   * @returns {Object} {momentum3D, energy, momentum4D, magnitude}
   */
  extractParticleMomentum(particle) {
    const m = particle.mass || 1;
    const vx = particle.vx || 0;
    const vy = particle.vy || 0;
    const vz = particle.vz || 0;
    
    // 3D momentum
    const px = m * vx;
    const py = m * vy;
    const pz = m * vz;
    
    // Lorentz factor: γ = 1 / sqrt(1 - v²/c²)
    const v2 = vx**2 + vy**2 + vz**2;
    const gamma = 1 / Math.sqrt(Math.max(1e-10, 1 - v2 / (this.c ** 2)));
    
    // Energy: E = γ*m*c²
    const energy = gamma * m * (this.c ** 2);
    
    // Energy component of 4-momentum: p0 = E/c
    const p0 = energy / this.c;
    
    // 4-momentum magnitude: |p|² = p0² - (px² + py² + pz²) = (mc)²
    const magnitude = m * this.c;
    
    return {
      momentum3D: { px, py, pz, magnitude: Math.sqrt(px**2 + py**2 + pz**2) },
      energy: energy,
      momentum4D: { p0, px, py, pz },
      lorentzFactor: gamma,
      magnitude: magnitude
    };
  }

  /**
   * Extract total energy from particle
   * E = γ*m*c² (relativistic)
   * E_kinetic = (γ-1)*m*c²
   * E_rest = m*c²
   * 
   * @param {Object} particle - Particle with mass and velocity
   * @returns {Object} {totalEnergy, restEnergy, kineticEnergy, lorentzFactor}
   */
  extractParticleEnergy(particle) {
    const m = particle.mass || 1;
    const vx = particle.vx || 0;
    const vy = particle.vy || 0;
    const vz = particle.vz || 0;
    
    // Velocity magnitude
    const v2 = vx**2 + vy**2 + vz**2;
    
    // Lorentz factor
    const gamma = 1 / Math.sqrt(Math.max(1e-10, 1 - v2 / (this.c ** 2)));
    
    // Rest energy: E0 = mc²
    const restEnergy = m * (this.c ** 2);
    
    // Total energy: E = γmc²
    const totalEnergy = gamma * restEnergy;
    
    // Kinetic energy: K = (γ-1)mc²
    const kineticEnergy = (gamma - 1) * restEnergy;
    
    // Binding energy (if in system): typically -E
    const bindingEnergy = -totalEnergy;
    
    this.metrics.energyChecks++;
    this.metrics.totalMeasurements++;
    
    return {
      totalEnergy: totalEnergy,
      restEnergy: restEnergy,
      kineticEnergy: kineticEnergy,
      bindingEnergy: bindingEnergy,
      lorentzFactor: gamma,
      ratio: totalEnergy / restEnergy
    };
  }

  /**
   * Extract mass/rest mass from particle
   * If velocity known: m = E / (γc²) = sqrt(E² - |p|²c²) / c²
   * 
   * @param {Object} particle - Particle object
   * @returns {Object} {mass, restMass, invariantMass}
   */
  extractParticleMass(particle) {
    const m = particle.mass || 1;
    const energy = this.extractParticleEnergy(particle);
    const momentum = this.extractParticleMomentum(particle);
    
    // Invariant mass from 4-vector: M² = E²/c² - |p|²
    const E = energy.totalEnergy;
    const p_mag = momentum.momentum3D.magnitude;
    const invariantMass2 = (E / this.c) ** 2 - p_mag ** 2;
    const invariantMass = Math.sqrt(Math.max(0, invariantMass2)) / this.c;
    
    return {
      mass: m,
      restMass: m,
      invariantMass: invariantMass,
      validation: {
        matchesRest: Math.abs(invariantMass - m) < 1e-6,
        error: Math.abs(invariantMass - m)
      }
    };
  }

  /**
   * Analyze conservation of momentum during collision
   * Returns: {conserved: boolean, totalBefore, totalAfter, loss, percentError}
   * 
   * @param {Object} collision - Collision object with particle1, particle2, before, after
   * @returns {Object} Conservation analysis
   */
  analyzeMomentumConservation(collision) {
    const p1_before = this.extractParticleMomentum(collision.particle1Before || collision.particle1);
    const p2_before = this.extractParticleMomentum(collision.particle2Before || collision.particle2);
    
    const p1_after = this.extractParticleMomentum(collision.particle1After || collision.particle1);
    const p2_after = this.extractParticleMomentum(collision.particle2After || collision.particle2);
    
    // 3-momentum conservation
    const before_px = p1_before.momentum3D.px + p2_before.momentum3D.px;
    const before_py = p1_before.momentum3D.py + p2_before.momentum3D.py;
    const before_pz = p1_before.momentum3D.pz + p2_before.momentum3D.pz;
    
    const after_px = p1_after.momentum3D.px + p2_after.momentum3D.px;
    const after_py = p1_after.momentum3D.py + p2_after.momentum3D.py;
    const after_pz = p1_after.momentum3D.pz + p2_after.momentum3D.pz;
    
    const dpx = Math.abs(after_px - before_px);
    const dpy = Math.abs(after_py - before_py);
    const dpz = Math.abs(after_pz - before_pz);
    
    const totalBefore = Math.sqrt(before_px**2 + before_py**2 + before_pz**2);
    const totalAfter = Math.sqrt(after_px**2 + after_py**2 + after_pz**2);
    const loss = totalBefore - totalAfter;
    const percentError = (loss / (totalBefore + 1e-10)) * 100;
    
    this.metrics.momentumChecks++;
    this.metrics.totalMeasurements++;
    
    return {
      conserved: percentError < 0.01, // Allow 0.01% error
      totalBefore: totalBefore,
      totalAfter: totalAfter,
      loss: loss,
      percentError: percentError,
      components: {
        dpx, dpy, dpz,
        maxComponentError: Math.max(dpx, dpy, dpz)
      }
    };
  }

  /**
   * Analyze conservation of energy during collision
   * Returns: {conserved: boolean, totalBefore, totalAfter, loss, percentError}
   * 
   * @param {Object} collision - Collision object with before/after states
   * @returns {Object} Conservation analysis
   */
  analyzeEnergyConservation(collision) {
    const E1_before = this.extractParticleEnergy(collision.particle1Before || collision.particle1);
    const E2_before = this.extractParticleEnergy(collision.particle2Before || collision.particle2);
    
    const E1_after = this.extractParticleEnergy(collision.particle1After || collision.particle1);
    const E2_after = this.extractParticleEnergy(collision.particle2After || collision.particle2);
    
    const totalBefore = E1_before.totalEnergy + E2_before.totalEnergy;
    const totalAfter = E1_after.totalEnergy + E2_after.totalEnergy;
    
    const loss = Math.abs(totalBefore - totalAfter);
    const percentError = (loss / (totalBefore + 1e-10)) * 100;
    
    this.metrics.energyChecks++;
    this.metrics.totalMeasurements++;
    
    return {
      conserved: percentError < 0.01, // Allow 0.01% error for inelastic losses
      totalBefore: totalBefore,
      totalAfter: totalAfter,
      loss: loss,
      percentError: percentError,
      details: {
        elastic: percentError < 0.001,
        inelastic: percentError < 0.1,
        dissipated: loss
      }
    };
  }

  /**
   * Get complete physics metrics for system
   * Returns: {metrics, derived}
   * 
   * @param {Array<Object>} particles - System particles
   * @param {Array<Object>} collisions - System collisions (optional)
   * @returns {Object} System-wide metrics
   */
  getPhysicsMetrics(particles = [], collisions = []) {
    let totalKineticEnergy = 0;
    let totalRestEnergy = 0;
    let totalMomentum = { px: 0, py: 0, pz: 0 };
    
    particles.forEach(p => {
      const energy = this.extractParticleEnergy(p);
      const momentum = this.extractParticleMomentum(p);
      
      totalKineticEnergy += energy.kineticEnergy;
      totalRestEnergy += energy.restEnergy;
      totalMomentum.px += momentum.momentum3D.px;
      totalMomentum.py += momentum.momentum3D.py;
      totalMomentum.pz += momentum.momentum3D.pz;
    });
    
    const totalMomentumMagnitude = Math.sqrt(
      totalMomentum.px**2 + totalMomentum.py**2 + totalMomentum.pz**2
    );
    
    const totalEnergy = totalKineticEnergy + totalRestEnergy;
    
    // Collision statistics
    let energyConserved = 0;
    let momentumConserved = 0;
    
    collisions.forEach(col => {
      const ec = this.analyzeEnergyConservation(col);
      const pc = this.analyzeMomentumConservation(col);
      
      if (ec.conserved) energyConserved++;
      if (pc.conserved) momentumConserved++;
    });
    
    return {
      particles: {
        count: particles.length,
        totalKineticEnergy: totalKineticEnergy,
        totalRestEnergy: totalRestEnergy,
        totalEnergy: totalEnergy,
        totalMomentum: totalMomentum,
        totalMomentumMagnitude: totalMomentumMagnitude,
        averageLorentzFactor: particles.reduce((sum, p) => {
          const e = this.extractParticleEnergy(p);
          return sum + e.lorentzFactor;
        }, 0) / Math.max(1, particles.length)
      },
      collisions: {
        count: collisions.length,
        energyConserved: energyConserved,
        momentumConserved: momentumConserved,
        energyConservationRate: collisions.length > 0 ? energyConserved / collisions.length : 0,
        momentumConservationRate: collisions.length > 0 ? momentumConserved / collisions.length : 0
      },
      measurements: this.metrics,
      systemHealth: {
        energyBalance: totalEnergy,
        momentumBalance: totalMomentumMagnitude,
        isStable: energyConserved === collisions.length && momentumConserved === collisions.length
      }
    };
  }

  /**
   * Calculate spacetime interval classification
   * Determines if particles can interact causally
   * 
   * @param {Array<number>} event1 - First spacetime event [t, x, y, z]
   * @param {Array<number>} event2 - Second spacetime event [t, x, y, z]
   * @returns {Object} {interval, canInteract, classification}
   */
  classifySpacetimeInterval(event1, event2) {
    const minkowski = this.calculateMinkowskiDistance(event1, event2);
    
    let classification = {
      timelike: {
        description: 'Time-like separated',
        canInteract: true,
        relationship: 'causal',
        maxVelocity: this.c
      },
      spacelike: {
        description: 'Space-like separated',
        canInteract: false,
        relationship: 'acausal',
        maxVelocity: Infinity
      },
      lightlike: {
        description: 'Light-like separated',
        canInteract: true,
        relationship: 'causal (at light speed)',
        maxVelocity: this.c
      }
    };
    
    return {
      interval: minkowski.ds2,
      intervalType: minkowski.intervalType,
      distance: minkowski.distance,
      details: classification[minkowski.intervalType],
      canInteract: ['timelike', 'lightlike'].includes(minkowski.intervalType)
    };
  }

  /**
   * Reset measurement metrics
   */
  resetMetrics() {
    this.metrics = {
      distanceMeasurements: 0,
      angleMeasurements: 0,
      energyChecks: 0,
      momentumChecks: 0,
      totalMeasurements: 0
    };
  }
}

export default Phase10Measurements;
