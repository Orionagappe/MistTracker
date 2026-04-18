/**
 * Physics7DIntegration.js
 * Phase 10.2: Integration layer connecting Physics4DEngine, Physics7DForces, and pureMathPhysicsEngine
 * 
 * Bridges:
 * - Physics4DEngine (particle dynamics with RK4)
 * - Physics7DForces (full tensor force calculations)
 * - pureMathPhysicsEngine.js (7D framework with 3-time dimensions)
 */

import { Physics7DForces } from './Physics7DForces.js';

/**
 * Physics7DIntegrationEngine: Extended physics engine with full 7D forces
 * Replaces simple placeholder forces with tensor-based calculations
 */
class Physics7DIntegrationEngine {
  constructor(physics4DEngine, config = {}) {
    this.engine4D = physics4DEngine;
    this.forces7D = new Physics7DForces(config);
    
    // Simulation parameters
    this.mode = config.mode || '4D';
    this.dt = config.dt || 0.01;
    
    // Field definitions
    this.electricField = config.electricField || [0, 0, 0];
    this.magneticField = config.magneticField || [0, 0, 0];
    
    // Gravitational configuration
    this.gravitationalSources = config.gravitationalSources || [];
    
    // Integration from pureMathPhysicsEngine framework
    this.timeQuantumScale = config.timeQuantumScale || 1e-44;      // T₀ Planck time
    this.timeInteractionScale = config.timeInteractionScale || 1e-12;  // T₁ collision scale
    this.timeCosmoScale = config.timeCosmoScale || 1e9 * 365.25 * 24 * 3600;  // T₂ age of universe
    
    // Temporal dimensions state (from pureMathPhysicsEngine model)
    this.T0 = config.T0 || 0;  // Quantum time coordinate
    this.T1 = config.T1 || 0;  // Interaction time coordinate
    this.T2 = config.T2 || 0;  // Cosmological time coordinate
    
    this.simulationTime = 0;
  }

  /**
   * Map between Physics4DEngine force format and Physics7DForces tensors
   * Replaces placeholder forces with proper tensor calculations
   */
  replaceForcesWithTensor(particle, externalMasses = []) {
    const config = {
      electricField: this.electricField,
      magneticField: this.magneticField,
      gravitationalMass: externalMasses.length > 0 ? externalMasses[0].mass : 0,
      otherParticles: externalMasses.map(m => ({
        position: m.position || [0, 0, 0, m.position_spatial?.[0] || 0, m.position_spatial?.[1] || 0, m.position_spatial?.[2] || 0, 0],
        velocity: [0, 0, 0, 0, 0, 0, 0]
      })),
      metricTensor: this.engine4D.metricTensor,
      cosmicTime: this.simulationTime
    };
    
    // Compute total 7D force
    const force7D = this.forces7D.computeTotalForce7D(particle, config);
    
    return force7D;
  }

  /**
   * Enhanced integration step using tensor forces
   * Replaces Physics4DEngine.step() with extended calculations
   */
  step(externalMasses = [], dt = null) {
    dt = dt || this.dt;
    
    // Integrate all particles with tensor forces
    for (const particle of this.engine4D.particles) {
      this.integrateParticle7D(particle, externalMasses, dt);
    }
    
    // Check collisions
    this.engine4D.checkCollisions();
    
    // Update temporal coordinates (from pureMathPhysicsEngine model)
    this.updateTemporalCoordinates(dt);
    
    this.simulationTime += dt;
    this.engine4D.simulationTime += dt;
    this.engine4D.stepCount += 1;
  }

  /**
   * RK4 integration using tensor forces
   * Enhanced version of Physics4DEngine.integrateParticle()
   */
  integrateParticle7D(particle, externalMasses = [], dt = null) {
    dt = dt || this.dt;
    
    // Stage 1: Force at current state
    const force1 = this.replaceForcesWithTensor(particle, externalMasses);
    const accel1 = force1.map(f => f / particle.mass);
    
    // Stage 2: Halfway point (first)
    const p_half = particle.clone();
    p_half.position = particle.position.map((x, i) => x + 0.5 * particle.velocity[i] * dt);
    p_half.velocity = particle.velocity.map((v, i) => v + 0.5 * accel1[i] * dt);
    p_half.calculateGamma();
    
    const force2 = this.replaceForcesWithTensor(p_half, externalMasses);
    const accel2 = force2.map(f => f / particle.mass);
    
    // Stage 3: Halfway point (second)
    const p_half2 = particle.clone();
    p_half2.position = particle.position.map((x, i) => x + 0.5 * p_half.velocity[i] * dt);
    p_half2.velocity = particle.velocity.map((v, i) => v + 0.5 * accel2[i] * dt);
    p_half2.calculateGamma();
    
    const force3 = this.replaceForcesWithTensor(p_half2, externalMasses);
    const accel3 = force3.map(f => f / particle.mass);
    
    // Stage 4: Full step
    const p_full = particle.clone();
    p_full.position = particle.position.map((x, i) => x + p_half2.velocity[i] * dt);
    p_full.velocity = particle.velocity.map((v, i) => v + accel3[i] * dt);
    p_full.calculateGamma();
    
    const force4 = this.replaceForcesWithTensor(p_full, externalMasses);
    const accel4 = force4.map(f => f / particle.mass);
    
    // Combine using RK4 formula
    const weights = [1/6, 2/6, 2/6, 1/6];
    const accels = [accel1, accel2, accel3, accel4];
    
    let avgAccel = [0, 0, 0, 0, 0, 0, 0];
    for (let i = 0; i < 4; i++) {
      avgAccel = avgAccel.map((a, dim) => a + weights[i] * accels[i][dim]);
    }
    
    // Update particle state
    particle.velocity = particle.velocity.map((v, i) => v + avgAccel[i] * dt);
    particle.position = particle.position.map((x, i) => x + particle.velocity[i] * dt);
    
    // Update derived quantities
    particle.calculateGamma();
    particle.calculateSpacetimeInterval();
    particle.updateProperTime(dt);
    particle.acceleration = avgAccel;
  }

  /**
   * Update temporal dimensions according to 3-time-scale model from pureMathPhysicsEngine
   * T₀ (quantum): Planck scale oscillations
   * T₁ (interaction): Collision/scattering events
   * T₂ (cosmological): Long-term universe evolution
   */
  updateTemporalCoordinates(dt) {
    // Quantum time evolution (small oscillations)
    // dT₀/dt ~ ℏ·frequency (from quantum field)
    const quantumFrequency = 1 / this.timeQuantumScale;
    this.T0 += quantumFrequency * dt;
    
    // Interaction time evolution (collision events)
    // dT₁/dt ~ 1 (interaction scale)
    this.T1 += dt / this.timeInteractionScale;
    
    // Cosmological time evolution (expansion)
    // dT₂/dt ~ H₀ (Hubble parameter)
    const H0 = 2.2e-18;  // Hubble parameter
    this.T2 += H0 * dt;
  }

  /**
   * Validate energy-momentum conservation across all particles
   * Returns cumulative conservation error
   */
  validateEnergyMomentumConservation() {
    let totalEnergyError = 0;
    const results = [];
    
    for (const particle of this.engine4D.particles) {
      const conservation = this.forces7D.checkEnergyMomentumConservation(particle);
      results.push({
        particleId: particle.id,
        conserved: conservation.conserved,
        error: conservation.error,
        invariant: conservation.invariant,
        expected: conservation.expected
      });
      
      totalEnergyError += conservation.error;
    }
    
    return {
      particleResults: results,
      averageError: totalEnergyError / results.length,
      allConserved: results.every(r => r.conserved)
    };
  }

  /**
   * Get Schwarzschild metric at particle location
   */
  getSchwarzSchildMetric(particle, centralMass) {
    const r = Math.sqrt(
      particle.position[3]*particle.position[3] +
      particle.position[4]*particle.position[4] +
      particle.position[5]*particle.position[5]
    );
    
    return this.forces7D.schwarzschildMetric(r, centralMass);
  }

  /**
   * Get curvature information at particle
   */
  getSpacetimeCurvature(particle, centralMass) {
    return this.forces7D.ricciBEarlyScalar(particle.position, centralMass);
  }

  /**
   * Compute tidal forces between two particles
   */
  getTidalForces(particle1, particle2, centralMass) {
    return this.forces7D.tidalForces(particle1, particle2, centralMass);
  }

  /**
   * Export comprehensive force analysis
   */
  analyzeParticleForces(particle, centralMass = 0) {
    const config = {
      electricField: this.electricField,
      magneticField: this.magneticField,
      gravitationalMass: centralMass,
      otherParticles: [],
      metricTensor: this.engine4D.metricTensor,
      cosmicTime: this.simulationTime
    };
    
    return {
      particle: {
        id: particle.id,
        position: [...particle.position],
        velocity: [...particle.velocity],
        mass: particle.mass,
        energy: particle.energy,
        gamma: particle.lorentzGamma
      },
      forceAnalysis: this.forces7D.exportForceAnalysis(particle, config),
      schwarzschildMetric: this.getSchwarzSchildMetric(particle, centralMass),
      spacetimeCurvature: this.getSpacetimeCurvature(particle, centralMass),
      energyMomentumConservation: this.forces7D.checkEnergyMomentumConservation(particle),
      stressEnergyTensor: this.forces7D.stressEnergyTensor(particle)
    };
  }

  /**
   * Apply electromagnetic field configuration
   */
  setElectromagneticField(E_field, B_field) {
    this.electricField = E_field || [0, 0, 0];
    this.magneticField = B_field || [0, 0, 0];
  }

  /**
   * Export complete system state for analysis
   */
  export() {
    return {
      mode: this.mode,
      simulationTime: this.simulationTime,
      temporalCoordinates: {
        T0: this.T0,
        T1: this.T1,
        T2: this.T2
      },
      particles: this.engine4D.particles.map(p => ({
        id: p.id,
        position: [...p.position],
        velocity: [...p.velocity],
        mass: p.mass,
        energy: p.energy,
        properTime: p.properTime,
        gamma: p.lorentzGamma
      })),
      field: {
        electricField: this.electricField,
        magneticField: this.magneticField
      },
      collisions: this.engine4D.collisions
    };
  }
}

/**
 * PureMathPhysicsAdapter: Bridge to pureMathPhysicsEngine.js framework
 * Extracts 7D physics relationships and applies to particles
 */
class PureMathPhysicsAdapter {
  constructor(config = {}) {
    // Time dimension scales from pureMathPhysicsEngine.js
    this.quantumTime = config.quantumTime || 5.39e-44;      // Planck time
    this.interactionTime = config.interactionTime || 1e-12;  // QED scale
    this.cosmoTime = config.cosmoTime || 1e9 * 365.25 * 86400;  // Age of universe
    
    // Mass evolution from quantumMassEvolution(masses, T)
    this.massEvolutionCoeff = config.massEvolutionCoeff || 1.0;
    
    // Gravitational wave effects from gravWaveDeltaV(T)
    this.gravWaveStrength = config.gravWaveStrength || 1.5e-55;
    
    // Time-to-space mapping from timeToSpace(T)
    this.timeSpaceMapping = this.buildTimeSpaceMapping();
  }

  /**
   * Build time-to-space mapping: T[0], T[1], T[2] → physical space
   * From: timeToSpace(T) = [T₀*T₁, T₁*T₂, T₂*T₀]
   */
  buildTimeSpaceMapping() {
    return {
      spaceFromTime: (T0, T1, T2) => [T0*T1, T1*T2, T2*T0],
      timeFromSpace: (x, y, z) => {
        // Inverse mapping (approximated)
        const r = Math.sqrt(x*x + y*y + z*z);
        return [r, r, r];  // Simplified
      }
    };
  }

  /**
   * Calculate mass evolution according to quantum time
   * m(t) = m₀ · exp(-T₀ / τ₀)
   */
  getMassEvolution(initialMass, T0) {
    return initialMass * Math.exp(-T0 / this.quantumTime);
  }

  /**
   * Calculate gravitational wave-induced velocity change
   * Δv = 1.5e-55 · c · T₂
   */
  getGravWaveDeltaV(T2, c) {
    return this.gravWaveStrength * c * T2;
  }

  /**
   * Generate energy landscape from temporal dimensions
   * Energy ∝ |T₀ · T₁ · T₂|
   */
  generateEnergyLandscape(T0_range, T1_range, T2_range, samples = 10) {
    const landscape = [];
    
    for (let t0 = -T0_range; t0 <= T0_range; t0 += 2*T0_range/(samples-1)) {
      for (let t1 = -T1_range; t1 <= T1_range; t1 += 2*T1_range/(samples-1)) {
        for (let t2 = -T2_range; t2 <= T2_range; t2 += 2*T2_range/(samples-1)) {
          const energy = Math.abs(t0 * t1 * t2);
          landscape.push({
            T0: t0,
            T1: t1,
            T2: t2,
            energy: energy,
            coordinates: this.timeSpaceMapping.spaceFromTime(t0, t1, t2)
          });
        }
      }
    }
    
    return landscape;
  }

  /**
   * Map pureMathPhysicsEngine forces to 7D particle forces
   */
  mapPureMathForcesToParticle(particle, T0, T1, T2, c = 299792458) {
    const forces = [0, 0, 0, 0, 0, 0, 0];
    
    // Quantum force (T₀ dimension)
    forces[0] = 1e-15 * Math.sin(particle.mass * T0);
    
    // Interaction force (T₁ dimension)
    forces[1] = 1e-8 * Math.cos(particle.energy * T1);
    
    // Cosmological force (T₂ dimension)
    forces[2] = 1e-50 * particle.mass * T2;
    
    // Gravitational wave effect (spatial)
    const deltaV = this.getGravWaveDeltaV(T2, c);
    forces[5] += deltaV;  // Z-component
    
    return forces;
  }

  /**
   * Extract energy distribution from particle system
   */
  getEnergyDistribution(particles, T0, T1, T2) {
    let totalEnergy = 0;
    const energies = [];
    
    for (const particle of particles) {
      // Energy from kinetic + rest mass
      const gamma = particle.lorentzGamma;
      const kinetic = (gamma - 1) * particle.mass * 299792458 * 299792458;
      const rest = particle.mass * 299792458 * 299792458;
      const total = rest + kinetic;
      
      energies.push({
        particleId: particle.id,
        restEnergy: rest,
        kineticEnergy: kinetic,
        totalEnergy: total,
        mass: particle.mass
      });
      
      totalEnergy += total;
    }
    
    return {
      particleEnergies: energies,
      totalEnergy: totalEnergy,
      averageEnergy: totalEnergy / particles.length,
      maxEnergy: Math.max(...energies.map(e => e.totalEnergy)),
      minEnergy: Math.min(...energies.map(e => e.totalEnergy))
    };
  }

  /**
   * Validate physics consistency with pureMathPhysicsEngine model
   */
  validatePhysicsConsistency(particle, T0, T1, T2) {
    const consistency = {
      massEvolution: this.getMassEvolution(particle.mass, T0),
      expectedMass: particle.mass,
      massError: Math.abs(this.getMassEvolution(particle.mass, T0) - particle.mass) / particle.mass,
      timeSpaceMapping: this.timeSpaceMapping.spaceFromTime(T0, T1, T2),
      physically_consistent: true
    };
    
    // Check if mass evolution is reasonable (shouldn't change by more than 10%)
    if (consistency.massError > 0.1) {
      consistency.physically_consistent = false;
    }
    
    return consistency;
  }
}

export { Physics7DIntegrationEngine, PureMathPhysicsAdapter };
