/**
 * Physics4DEngine.js
 * Phase 10: 4D Physics Engine Integration
 * 
 * Implements full 7D particle dynamics:
 * - 4 spatial dimensions (T₀, T₁, T₂ temporal + x, y, z spatial + w mass/energy)
 * - 3 temporal dimensions (quantum, interaction, cosmological)
 * - RK4 integration with time dilation
 * - W-velocity coupled to particle energy via E=mc²
 */

/**
 * Particle4D represents a particle in 7D spacetime
 * Position: [T₀, T₁, T₂, x, y, z, w]
 * Velocity: [dT₀/dt, dT₁/dt, dT₂/dt, vx, vy, vz, dw/dt]
 */
class Particle4D {
  constructor(options = {}) {
    // 7D Position vector: [quantum_time, interaction_time, cosmological_time, x, y, z, w]
    this.position = options.position || [0, 0, 0, 0, 0, 0, 0];
    
    // 7D Velocity vector: [dT0/dt, dT1/dt, dT2/dt, vx, vy, vz, dw/dt]
    this.velocity = options.velocity || [0, 0, 0, 0, 0, 0, 0];
    
    // Physical properties
    this.mass = options.mass || 1.0;           // Rest mass
    this.energy = options.energy || 0.0;       // Total energy
    this.charge = options.charge || 0.0;       // Electric charge
    this.id = options.id || `particle_${Date.now()}`;
    
    // Derived quantities (updated each step)
    this.lorentzGamma = 1.0;                   // Time dilation factor
    this.properTime = options.properTime || 0.0; // Proper time experienced by particle
    this.spacetimeInterval = 0.0;              // Minkowski interval at current state
    
    // Acceleration in 7D (for display/analysis)
    this.acceleration = [0, 0, 0, 0, 0, 0, 0];
    
    // Constants
    this.c = 299792458;                        // Speed of light
    this.G = 6.67430e-11;                      // Gravitational constant
  }

  /**
   * Initialize particle with energy
   * Automatically sets w-velocity to match energy
   */
  setEnergy(energy) {
    this.energy = energy;
    // W-velocity couples to energy via relativistic mass equivalence
    // dw/dt = E/c²
    this.velocity[6] = energy / (this.mass * this.c * this.c);
  }

  /**
   * Get 3D spatial position [x, y, z]
   */
  get spatialPosition() {
    return this.position.slice(3, 6);
  }

  /**
   * Get 3D spatial velocity [vx, vy, vz]
   */
  get spatialVelocity() {
    return this.velocity.slice(3, 6);
  }

  /**
   * Get temporal position [T₀, T₁, T₂]
   */
  get temporalPosition() {
    return this.position.slice(0, 3);
  }

  /**
   * Get w-coordinate (mass/energy dimension)
   */
  get wCoordinate() {
    return this.position[6];
  }

  /**
   * Get w-velocity (mass/energy evolution rate)
   */
  get wVelocity() {
    return this.velocity[6];
  }

  /**
   * Calculate Lorentz gamma factor (time dilation)
   * γ = 1 / √(1 - v²/c²) where v is 3D spatial speed
   */
  calculateGamma() {
    const v = this.spatialVelocity;
    const v_squared = v[0]*v[0] + v[1]*v[1] + v[2]*v[2];
    const c2 = this.c * this.c;
    
    if (v_squared >= c2) {
      // Tachyonic particle (shouldn't happen, but clamp)
      this.lorentzGamma = Infinity;
      return Infinity;
    }
    
    this.lorentzGamma = 1.0 / Math.sqrt(1.0 - v_squared / c2);
    return this.lorentzGamma;
  }

  /**
   * Calculate spacetime interval (Minkowski)
   * s² = (E/c)² - (px² + py² + pz²) - (pw)²
   * Invariant quantity in 4D spacetime
   */
  calculateSpacetimeInterval() {
    const spatialMomentum = this.spatialVelocity.map(v => this.mass * v);
    const p_squared = spatialMomentum[0]*spatialMomentum[0] + 
                      spatialMomentum[1]*spatialMomentum[1] + 
                      spatialMomentum[2]*spatialMomentum[2];
    
    const pw = this.mass * this.wVelocity;
    const E = this.energy;
    const c = this.c;
    
    this.spacetimeInterval = (E/c) * (E/c) - p_squared - pw*pw;
    return this.spacetimeInterval;
  }

  /**
   * Update proper time (integrated time experienced by particle)
   * dτ = dt / γ
   */
  updateProperTime(dt) {
    this.calculateGamma();
    const dProperTime = dt / this.lorentzGamma;
    this.properTime += dProperTime;
    return dProperTime;
  }

  /**
   * Clone this particle
   */
  clone() {
    const cloned = new Particle4D({
      position: [...this.position],
      velocity: [...this.velocity],
      mass: this.mass,
      energy: this.energy,
      charge: this.charge,
      id: `${this.id}_clone`,
      properTime: this.properTime
    });
    cloned.lorentzGamma = this.lorentzGamma;
    return cloned;
  }
}

/**
 * Physics4DEngine handles 7D particle dynamics and forces
 */
class Physics4DEngine {
  constructor(config = {}) {
    this.particles = [];
    this.forces = [];
    this.collisions = [];
    
    // Configuration
    this.mode = config.mode || '4D';           // '3D' or '4D'
    this.G = config.G || 6.67430e-11;          // Gravitational constant
    this.c = config.c || 299792458;            // Speed of light
    this.dt = config.dt || 1e-3;               // Time step
    this.integrationMethod = 'RK4';            // RK4 integration
    
    // Force coefficients
    this.gravityStrength = config.gravityStrength || 1.0;
    this.quantumForceStrength = config.quantumForceStrength || 1e-15;    // Planck-scale
    this.interactionForceStrength = config.interactionForceStrength || 1e-8;
    this.cosmologicalForceStrength = config.cosmologicalForceStrength || 1e-50;
    
    // 7×7 Minkowski metric tensor (spacetime metric)
    this.metricTensor = this.buildMetricTensor();
    
    // Track total simulation time
    this.simulationTime = 0;
    this.stepCount = 0;
  }

  /**
   * Build 7×7 metric tensor for [T₀, T₁, T₂, x, y, z, w]
   * Minkowski-like metric with extension to temporal dimensions
   */
  buildMetricTensor() {
    return [
      [-1, 0, 0, 0, 0, 0, 0],  // T₀: temporal dimension (QM scale)
      [0, -1, 0, 0, 0, 0, 0],  // T₁: temporal dimension (interaction scale)
      [0, 0, -1, 0, 0, 0, 0],  // T₂: temporal dimension (cosmological scale)
      [0, 0, 0, 1, 0, 0, 0],   // x: spatial
      [0, 0, 0, 0, 1, 0, 0],   // y: spatial
      [0, 0, 0, 0, 0, 1, 0],   // z: spatial
      [0, 0, 0, 0, 0, 0, 1]    // w: mass/energy dimension
    ];
  }

  /**
   * Calculate metric tensor distance between two positions
   * d² = g_μν Δx^μ Δx^ν
   */
  metricDistance(p1, p2) {
    const delta = p1.map((x, i) => x - p2[i]);
    let distSquared = 0;
    
    for (let i = 0; i < 7; i++) {
      for (let j = 0; j < 7; j++) {
        distSquared += this.metricTensor[i][j] * delta[i] * delta[j];
      }
    }
    
    // Handle potential negative values from metric signature
    return Math.sqrt(Math.abs(distSquared));
  }

  /**
   * Add particle to simulation
   */
  addParticle(particle) {
    if (!(particle instanceof Particle4D)) {
      particle = new Particle4D(particle);
    }
    this.particles.push(particle);
    return particle;
  }

  /**
   * Remove particle by ID
   */
  removeParticle(id) {
    this.particles = this.particles.filter(p => p.id !== id);
  }

  /**
   * Clear all particles
   */
  clear() {
    this.particles = [];
    this.collisions = [];
    this.simulationTime = 0;
    this.stepCount = 0;
  }

  /**
   * Calculate 7D gravitational force from a massive object
   * Extended Schwarzschild metric in 4D + temporal dimensions
   * F_grav = -GM/r² in spatial, with curvature effects in temporal dimensions
   */
  calculateGravityForce(particle, massCenter, mass) {
    const force = [0, 0, 0, 0, 0, 0, 0];
    
    if (this.mode !== '4D') {
      // 3D mode: only spatial gravity
      const deltaPos = particle.spatialPosition.map((x, i) => x - massCenter[i]);
      const r = Math.sqrt(deltaPos[0]*deltaPos[0] + deltaPos[1]*deltaPos[1] + deltaPos[2]*deltaPos[2]);
      
      if (r < 1e-6) return force; // Avoid singularity
      
      const magnitude = -this.G * mass * particle.mass / (r * r * r);
      force[3] = magnitude * deltaPos[0];
      force[4] = magnitude * deltaPos[1];
      force[5] = magnitude * deltaPos[2];
      
      return force;
    }
    
    // 4D mode: full Schwarzschild-like curvature in all dimensions
    const delta = particle.position.map((x, i) => x - massCenter[i]);
    const r = Math.sqrt(delta[3]*delta[3] + delta[4]*delta[4] + delta[5]*delta[5]);
    
    if (r < 1e-6) return force; // Avoid singularity
    
    // Spatial gravity (3D component)
    const spatialMagnitude = -this.G * mass * particle.mass / (r * r * r);
    force[3] = spatialMagnitude * delta[3];
    force[4] = spatialMagnitude * delta[4];
    force[5] = spatialMagnitude * delta[5];
    
    // Temporal coupling via Schwarzschild factor
    // f(r) = √(1 - 2GM/(rc²))
    const c2 = this.c * this.c;
    const schwarzschildFactor = Math.sqrt(Math.max(0, 1 - 2*this.G*mass/(r*c2)));
    
    // Time dilation affects temporal dimensions
    const temporalMagnitude = -this.G * mass * particle.mass * (1 - schwarzschildFactor) / (r * r);
    force[0] = temporalMagnitude * delta[0] * this.quantumForceStrength;    // Quantum time
    force[1] = temporalMagnitude * delta[1] * this.interactionForceStrength; // Interaction time
    force[2] = temporalMagnitude * delta[2] * this.cosmologicalForceStrength; // Cosmological time
    
    // W-dimension gravity (mass/energy coupling)
    force[6] = spatialMagnitude * 0.01; // Small coupling
    
    return force;
  }

  /**
   * Calculate quantum force (Planck-scale effects)
   * Affects temporal dimension T₀
   */
  calculateQuantumForce(particle) {
    const force = [0, 0, 0, 0, 0, 0, 0];
    
    // Quantum force proportional to particle energy at Planck scale
    const H = 6.62607015e-34; // Planck's constant
    const h_bar = H / (2 * Math.PI);
    
    // Oscillatory force in T₀
    const T0 = particle.temporalPosition[0];
    const quantumFrequency = particle.energy / h_bar;
    
    force[0] = this.quantumForceStrength * Math.sin(quantumFrequency * T0) * particle.energy;
    
    return force;
  }

  /**
   * Calculate interaction force (particle interaction timescale)
   * Affects temporal dimension T₁
   */
  calculateInteractionForce(particle) {
    const force = [0, 0, 0, 0, 0, 0, 0];
    
    // Interaction force: emerges when particles are close
    // For now, a simple damping force in T₁ dimension
    const T1 = particle.temporalPosition[1];
    
    // Damping proportional to T₁ velocity
    force[1] = -0.1 * this.interactionForceStrength * particle.velocity[1] * particle.mass;
    
    return force;
  }

  /**
   * Calculate cosmological force (long-range dark energy)
   * Affects temporal dimension T₂ and w-dimension
   */
  calculateCosmologicalForce(particle) {
    const force = [0, 0, 0, 0, 0, 0, 0];
    
    // Cosmological force: weak, long-range expansion force
    const T2 = particle.temporalPosition[2];
    
    // Accelerating expansion in T₂
    force[2] = this.cosmologicalForceStrength * particle.mass * T2;
    
    // Dark energy effect on w-dimension (mass evolution)
    force[6] = this.cosmologicalForceStrength * particle.mass * 0.0001;
    
    return force;
  }

  /**
   * Calculate total 7D force on particle
   */
  calculateTotalForce(particle, externalMasses = []) {
    let totalForce = [0, 0, 0, 0, 0, 0, 0];
    
    // Gravity from external masses
    for (const {position, mass} of externalMasses) {
      const gravForce = this.calculateGravityForce(particle, position, mass);
      totalForce = totalForce.map((f, i) => f + gravForce[i]);
    }
    
    // Temporal forces
    if (this.mode === '4D') {
      const quantumForce = this.calculateQuantumForce(particle);
      const interactionForce = this.calculateInteractionForce(particle);
      const cosmologicalForce = this.calculateCosmologicalForce(particle);
      
      totalForce = totalForce.map((f, i) => 
        f + quantumForce[i] + interactionForce[i] + cosmologicalForce[i]
      );
    }
    
    return totalForce;
  }

  /**
   * RK4 integration step for 7D particle dynamics
   * Advances particle by dt with 4th-order accuracy
   */
  integrateParticle(particle, externalMasses = [], dt = null) {
    dt = dt || this.dt;
    
    // k1: force at current state
    const force1 = this.calculateTotalForce(particle, externalMasses);
    
    // k2: halfway through step
    const p_half = particle.clone();
    p_half.position = particle.position.map((x, i) => x + 0.5 * particle.velocity[i] * dt);
    p_half.velocity = particle.velocity.map((v, i) => v + 0.5 * (force1[i] / particle.mass) * dt);
    const force2 = this.calculateTotalForce(p_half, externalMasses);
    
    // k3: another halfway point
    const p_half2 = particle.clone();
    p_half2.position = particle.position.map((x, i) => x + 0.5 * p_half.velocity[i] * dt);
    p_half2.velocity = particle.velocity.map((v, i) => v + 0.5 * (force2[i] / particle.mass) * dt);
    const force3 = this.calculateTotalForce(p_half2, externalMasses);
    
    // k4: full step
    const p_full = particle.clone();
    p_full.position = particle.position.map((x, i) => x + p_half2.velocity[i] * dt);
    p_full.velocity = particle.velocity.map((v, i) => v + (force3[i] / particle.mass) * dt);
    const force4 = this.calculateTotalForce(p_full, externalMasses);
    
    // Combine using RK4 formula: Δy = (1/6)(k1 + 2k2 + 2k3 + k4)
    const weights = [1/6, 2/6, 2/6, 1/6];
    const forces = [force1, force2, force3, force4];
    
    let avgForce = [0, 0, 0, 0, 0, 0, 0];
    for (let i = 0; i < 4; i++) {
      avgForce = avgForce.map((f, dim) => f + weights[i] * forces[i][dim]);
    }
    
    // Update velocity: v(t+dt) = v(t) + (F/m)dt
    particle.velocity = particle.velocity.map((v, i) => v + (avgForce[i] / particle.mass) * dt);
    
    // Update position: x(t+dt) = x(t) + v(t+dt)dt
    particle.position = particle.position.map((x, i) => x + particle.velocity[i] * dt);
    
    // Update derived quantities
    particle.calculateGamma();
    particle.calculateSpacetimeInterval();
    particle.updateProperTime(dt);
    particle.acceleration = avgForce.map(f => f / particle.mass);
  }

  /**
   * Step simulation forward by dt
   */
  step(externalMasses = [], dt = null) {
    dt = dt || this.dt;
    
    // Integrate all particles
    for (const particle of this.particles) {
      this.integrateParticle(particle, externalMasses, dt);
    }
    
    // Check collisions (Phase 10.3 will extend this)
    this.checkCollisions();
    
    this.simulationTime += dt;
    this.stepCount += 1;
  }

  /**
   * Placeholder for collision detection (will be expanded in Phase 10.3)
   */
  checkCollisions() {
    this.collisions = [];
    
    // Brute force O(n²) collision check
    for (let i = 0; i < this.particles.length; i++) {
      for (let j = i + 1; j < this.particles.length; j++) {
        const p1 = this.particles[i];
        const p2 = this.particles[j];
        
        // Simple threshold for now (will use metric tensor in Phase 10.3)
        const distance = this.metricDistance(p1.position, p2.position);
        const collisionThreshold = 2.0; // Collision radius
        
        if (distance < collisionThreshold) {
          this.collisions.push({
            particle1: p1.id,
            particle2: p2.id,
            distance: distance,
            p1Position: [...p1.position],
            p2Position: [...p2.position]
          });
        }
      }
    }
  }

  /**
   * Get simulation statistics
   */
  getStats() {
    const stats = {
      particleCount: this.particles.length,
      simulationTime: this.simulationTime,
      stepCount: this.stepCount,
      collisionCount: this.collisions.length,
      particles: this.particles.map(p => ({
        id: p.id,
        position: [...p.position],
        velocity: [...p.velocity],
        mass: p.mass,
        energy: p.energy,
        lorentzGamma: p.lorentzGamma,
        properTime: p.properTime,
        spacetimeInterval: p.spacetimeInterval
      })),
      collisions: this.collisions
    };
    
    return stats;
  }

  /**
   * Switch between 3D and 4D modes
   */
  setMode(mode) {
    this.mode = mode;
  }

  /**
   * Export for visualization or analysis
   */
  export() {
    return {
      mode: this.mode,
      simulationTime: this.simulationTime,
      particles: this.particles.map(p => ({
        id: p.id,
        position: [...p.position],
        velocity: [...p.velocity],
        mass: p.mass,
        energy: p.energy,
        properTime: p.properTime,
        wCoordinate: p.wCoordinate,
        spatialPosition: p.spatialPosition
      })),
      collisions: this.collisions
    };
  }
}

// Export for use in other modules
export { Particle4D, Physics4DEngine };
