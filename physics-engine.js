/**
 * MistTracker Physics Engine (Server-Side)
 * Implements wave-based physics with real-time geometry and tensor field updates
 * Integrates relativity (metric tensors, curvature) with quantum mechanics (wave functions, interference)
 * Provides dimensional coupling between 3D geometries and 4D tensor fields
 * 
 * Key concepts from pureMathPhysicsEngine.js:
 * - Wave functions: ψ = A * e^(i(kx - ωt))
 * - Interference patterns for light/gravity interactions
 * - Metric tensors for spacetime transformations
 * - Energy distribution across dimensions
 * - Dimensional perspective transforms
 */

// Phase 5.2: Electron dynamics support
import { 
  addElectronClouds, 
  updateElectronClouds, 
  getElectronWaveEmissions,
  detectParticleInteractions 
} from './client/src/utils/ElectronDynamics.js';
import { getObjectPhysicsConfiguration } from './client/src/utils/AtomTypeSystem.js';

// Phase 5.4: Wave-orbital interaction detection
import {
  detectResonance,
  calculateOrbitalResponse,
  calculateWaveEmission,
  detectParticleGeneration,
  processOrbitalTransition,
  getOrbitalFrequency,
  getWaveIntensityAtDistance,
  calculateInteractionMetrics
} from './client/src/utils/WaveOrbitalInteraction.js';

export class MistPhysicsEngine {
  /**
   * Initialize physics engine with simulation parameters
   * @param {Object} config - Configuration object
   * @param {number} config.timeStep - Simulation timestep in seconds (default: 0.016 = ~60fps)
   * @param {number} config.gravityStrength - Gravity wave amplitude (default: 9.81)
   * @param {number} config.lightSpeed - Speed of light in simulation units (default: 299792458)
   * @param {number} config.waveSpeedMultiplier - Scale factor for wave propagation (default: 1.0)
   * @param {number} config.dimensionalCouplingStrength - Strength of 3D↔4D coupling (default: 0.5)
   */
  constructor(config = {}) {
    this.config = {
      timeStep: config.timeStep ?? 0.016,
      gravityStrength: config.gravityStrength ?? 9.81,
      lightSpeed: config.lightSpeed ?? 299792458,
      waveSpeedMultiplier: config.waveSpeedMultiplier ?? 1.0,
      dimensionalCouplingStrength: config.dimensionalCouplingStrength ?? 0.5,
      ...config
    };

    // Simulation state
    this.isRunning = false;
    this.currentTime = 0;
    this.simulationTime = 0;
    
    // Physics objects and fields
    this.geometries = new Map(); // { itemId: { position, velocity, mass, waveFunction } }
    this.tensorFields = new Map(); // { itemId: { d0, d1, intensity, frequency, phase, energy } }
    this.waveEmitters = new Map(); // { emitterId: { position, frequency, amplitude, wavelength } }
    this.forceFields = new Map(); // { fieldId: { type, position, strength, affectedObjects } }
    
    // Phase 5.2: Quantum electron cloud and particle interaction tracking
    this.particleInteractions = []; // Detected emergent particles (photons, etc.)
    
    // Metric tensors for different dimensional contexts
    this.metricTensor3D = [
      [1, 0, 0],
      [0, 1, 0],
      [0, 0, 1]
    ];

    this.metricTensor4D = [
      [-1, 0, 0, 0],
      [0, 1, 0, 0],
      [0, 0, 1, 0],
      [0, 0, 0, 1]
    ];

    // Dimensional coupling state
    this.couplingEnabled = true;
    this.dimensionLimit = null; // null = infinite, number = 3D limit
    
    // Physics statistics for monitoring
    this.stats = {
      totalEnergy: 0,
      averageWaveIntensity: 0,
      activeWaveEmitters: 0,
      geometryUpdates: 0,
      tensorUpdates: 0,
      interactionCount: 0
    };
  }

  /**
   * Register a geometry for physics simulation
   */
  registerGeometry(itemId, initialState = {}, atomConfiguration = null) {
    const geometry = {
      itemId,
      position: initialState.position || [0, 0, 0],
      velocity: initialState.velocity || [0, 0, 0],
      acceleration: [0, 0, 0],
      mass: initialState.mass ?? 1.0,
      scale: initialState.scale || [1, 1, 1],
      rotation: initialState.rotation || [0, 0, 0],
      angularVelocity: [0, 0, 0],
      
      // Wave properties for material interaction
      waveFunction: {
        amplitude: initialState.amplitude ?? 1.0,
        frequency: initialState.frequency ?? 440, // Hz
        phase: initialState.phase ?? 0,
        wavelength: 0 // computed
      },
      
      // Energy and forces
      energy: initialState.energy ?? 0,
      internalEnergy: 0,
      forces: [],
      
      // Coupling state
      couplingEnergy: 0, // Energy exchanged with 4D tensor field
      timeDilation: 1.0, // Relativistic time dilation factor
      
      // Physics flags
      isWaveEmitter: initialState.isWaveEmitter ?? false,
      isWaveAbsorber: initialState.isWaveAbsorber ?? false,
      collisionEnabled: initialState.collisionEnabled ?? true,
      
      // Phase 5.2: Electron cloud support
      electronClouds: [],
      atomType: null,
      atomicNumber: 0,
      
      lastUpdateTime: this.simulationTime
    };

    // Compute initial wavelength
    geometry.waveFunction.wavelength = this.config.lightSpeed / geometry.waveFunction.frequency;
    
    // Phase 5.2: Initialize electron clouds if atom configuration provided
    if (atomConfiguration) {
      addElectronClouds(geometry, atomConfiguration);
    }

    this.geometries.set(itemId, geometry);
    return geometry;
  }

  /**
   * Register a tensor field for physics simulation
   */
  registerTensorField(itemId, initialState = {}) {
    const tensorField = {
      itemId,
      d0: initialState.d0 ?? 0.5, // Dimension 0 component
      d1: initialState.d1 ?? 0.5, // Dimension 1 component
      intensity: initialState.intensity ?? 1.0,
      frequency: initialState.frequency ?? 440,
      phase: initialState.phase ?? 0,
      wavelength: 0, // computed
      
      // Energy distribution
      energy: initialState.energy ?? 0,
      energyDistribution: { x: 0, y: 0, z: 0, w: 0 },
      
      // Coupling with 3D geometry
      geometryItemId: initialState.geometryItemId || itemId,
      couplingStrength: this.config.dimensionalCouplingStrength,
      
      lastUpdateTime: this.simulationTime
    };

    tensorField.wavelength = this.config.lightSpeed / tensorField.frequency;
    this.tensorFields.set(itemId, tensorField);
    return tensorField;
  }

  /**
   * Create a wave emitter (light source, gravity wave, etc.)
   */
  createWaveEmitter(emitterId, config = {}) {
    const emitter = {
      emitterId,
      type: config.type || 'light', // 'light', 'gravity', 'quantum'
      position: config.position || [0, 0, 0],
      frequency: config.frequency ?? 440,
      amplitude: config.amplitude ?? 1.0,
      phase: config.phase ?? 0,
      wavelength: this.config.lightSpeed / (config.frequency ?? 440),
      
      // Emission properties
      isActive: config.isActive ?? true,
      intensity: config.intensity ?? 1.0,
      range: config.range ?? 100, // Emission range
      
      // Affected objects
      affectedGeometries: new Set(),
      affectedTensors: new Set(),
      
      lastEmissionTime: this.simulationTime
    };

    this.waveEmitters.set(emitterId, emitter);
    return emitter;
  }

  /**
   * Simulate physics for one timestep
   * Updates geometries, tensor fields, and handles wave interactions
   */
  simulateStep(deltaTime = this.config.timeStep) {
    this.simulationTime += deltaTime;
    const dt = deltaTime;

    // 1. Update wave functions and propagate waves
    this._propagateWaves(dt);
    
    // 1.5. Phase 5.2: Update electron clouds and orbital dynamics
    this._updateElectronClouds(dt);

    // 2. Calculate forces and accelerations
    this._calculateForces(dt);

    // 3. Update geometry positions and velocities (classical mechanics)
    this._updateGeometries(dt);

    // 4. Apply relativistic corrections (metric tensor transformations)
    this._applyRelativisticCorrections(dt);

    // 5. Update tensor fields (quantum aspects)
    this._updateTensorFields(dt);

    // 6. Apply dimensional coupling (3D↔4D interactions)
    this._applyDimensionalCoupling(dt);

    // 7. Handle wave interactions and interference
    this._handleInterferences(dt);

    // 8. Update statistics
    this._updateStatistics();

    return {
      geometryUpdates: Array.from(this.geometries.values()),
      tensorUpdates: Array.from(this.tensorFields.values()),
      waveState: this._getWaveState(),
      particleInteractions: this.particleInteractions
    };
  }

  /**
   * Propagate wave functions through space
   * Calculates wave function evolution: ψ(x,t) = A * e^(i(kx - ωt))
   */
  _propagateWaves(dt) {
    // Update phase for all active wave functions
    for (const [itemId, geometry] of this.geometries) {
      const wf = geometry.waveFunction;
      const k = (2 * Math.PI) / wf.wavelength; // wave number
      const omega = 2 * Math.PI * (geometry.waveFunction.frequency / 1000); // angular frequency (normalized)
      
      // Update phase: φ += ω*dt
      wf.phase += omega * dt;
      
      // Normalize phase to [0, 2π]
      wf.phase = wf.phase % (2 * Math.PI);
    }

    // Emit waves from active emitters
    for (const [emitterId, emitter] of this.waveEmitters) {
      if (!emitter.isActive) continue;
      
      const k = (2 * Math.PI) / emitter.wavelength;
      const omega = 2 * Math.PI * (emitter.frequency / 1000);
      emitter.phase += omega * dt;
      
      // Propagate to affected geometries
      for (const [itemId, geometry] of this.geometries) {
        const distance = this._distance(emitter.position, geometry.position);
        
        if (distance <= emitter.range) {
          // Phase shift based on distance
          const distancePhaseShift = k * distance;
          geometry.waveFunction.phase += distancePhaseShift * dt * 0.1;
          
          // Amplitude affected by distance (inverse square law)
          const amplitudeAtDistance = emitter.amplitude / (1 + distance * distance);
          geometry.waveFunction.amplitude = Math.max(
            geometry.waveFunction.amplitude * 0.9,
            amplitudeAtDistance * 0.1
          );
        }
      }
    }
  }

  /**
   * Phase 5.2-5.4: Update electron cloud states for all quantum objects
   * Handles:
   * - Natural orbital evolution (phase rotation)
   * - Wave-electron interactions (resonance effects from Phase 5.4)
   * - Orbital response to incident waves
   * - Wave emission from accelerating charges
   * - Particle detection (emergent photons)
   * - Orbital transitions and quantum state changes
   */
  _updateElectronClouds(dt) {
    // Collect current wave state for interaction calculations
    const waveState = {
      incidentWaves: Array.from(this.waveEmitters.values()).map(emitter => ({
        position: emitter.position,
        frequency: emitter.frequency,
        amplitude: emitter.amplitude,
        range: emitter.range || 100
      }))
    };

    // Update electron clouds in all geometries
    for (const geometry of this.geometries.values()) {
      if (geometry.electronClouds && geometry.electronClouds.length > 0) {
        updateElectronClouds(geometry, dt, waveState);
        
        // Phase 5.4: Advanced wave-orbital interaction processing
        this._processWaveOrbitalInteractions(geometry, waveState, dt);
      }
    }

    // Collect waves emitted from electrons
    const electronEmissions = [];
    for (const geometry of this.geometries.values()) {
      if (geometry.atomType) {
        const emissions = getElectronWaveEmissions(geometry);
        electronEmissions.push(...emissions);
      }
    }

    // Add electron-emitted waves to wave emitter system
    for (const emission of electronEmissions) {
      this.waveEmitters.set(emission.sourceId, {
        itemId: emission.sourceId,
        position: emission.position,
        type: 'electron-emission',
        frequency: emission.frequency,
        amplitude: emission.amplitude,
        phase: emission.phase,
        wavelength: emission.wavelength,
        intensity: emission.amplitude * emission.amplitude,
        range: 100,
        isActive: true,
        lastEmissionTime: this.simulationTime
      });
    }

    // Detect particle interactions (photons forming at orbital-wave intersections)
    this.particleInteractions = [];
    for (const geometry of this.geometries.values()) {
      if (geometry.electronClouds) {
        const interactions = detectParticleInteractions(
          geometry,
          waveState.incidentWaves
        );
        this.particleInteractions.push(...interactions);
        
        // Phase 5.4: Add advanced particle generation from resonances
        const advancedParticles = this._detectAdvancedParticleGeneration(
          geometry,
          waveState.incidentWaves,
          dt
        );
        this.particleInteractions.push(...advancedParticles);
      }
    }
  }

  /**
   * Phase 5.4: Process wave-orbital interactions for each electron orbital
   * Applies quantum mechanics from WaveOrbitalInteraction library
   */
  _processWaveOrbitalInteractions(geometry, waveState, dt) {
    if (!geometry.electronClouds || geometry.electronClouds.length === 0) return;
    if (!waveState || !waveState.incidentWaves || waveState.incidentWaves.length === 0) return;

    // Initialize interaction tracking if needed
    if (!geometry._orbitalInteractionHistory) {
      geometry._orbitalInteractionHistory = [];
    }

    // For each electron orbital in this geometry
    for (let orbitalIndex = 0; orbitalIndex < geometry.electronClouds.length; orbitalIndex++) {
      const orbital = geometry.electronClouds[orbitalIndex];
      const orbitalFrequency = getOrbitalFrequency(orbital.n || 1, geometry.atomicNumber || 1);

      // For each incident wave, check for resonance and orbital response
      for (const wave of waveState.incidentWaves) {
        // 1. Detect resonance
        const resonance = detectResonance(
          wave.frequency,
          orbitalFrequency,
          wave.amplitude
        );

        if (!resonance.isResonant) continue; // Skip non-resonant waves

        // 2. Calculate orbital response to resonant wave
        const waveAtOrbital = {
          ...wave,
          intensity: getWaveIntensityAtDistance(
            wave.amplitude,
            this._distance(wave.position, orbital.position || geometry.position)
          ),
          phase: 0 // Will be calculated based on distance
        };

        const response = calculateOrbitalResponse(
          orbital,
          waveAtOrbital,
          resonance,
          dt
        );

        // 3. Apply orbital displacement from wave interaction
        if (response.displacement && response.displacement > 0) {
          // Store original position for acceleration calculation
          const origPosition = [...(orbital.position || [0, 0, 0])];
          
          // Apply displacement perpendicular to wave direction
          const displacementVec = [
            (Math.random() - 0.5) * response.displacement * 2,
            (Math.random() - 0.5) * response.displacement * 2,
            (Math.random() - 0.5) * response.displacement * 2
          ];
          
          orbital.position = [
            (orbital.position?.[0] || 0) + displacementVec[0],
            (orbital.position?.[1] || 0) + displacementVec[1],
            (orbital.position?.[2] || 0) + displacementVec[2]
          ];
          
          // Track acceleration for wave emission calculation
          orbital._acceleration = [
            displacementVec[0] / (dt * dt || 0.001),
            displacementVec[1] / (dt * dt || 0.001),
            displacementVec[2] / (dt * dt || 0.001)
          ];
        }

        // 4. Handle orbital transitions if probability exceeded
        if (response.stateChange && response.stateChange.probability > Math.random()) {
          processOrbitalTransition(orbital, response.stateChange);
        }

        // 5. Calculate wave emission from accelerating orbital
        const emissionFrequency = orbitalFrequency + (Math.random() - 0.5) * orbitalFrequency * 0.1;
        const emission = calculateWaveEmission(
          orbital,
          response.displacement,
          emissionFrequency,
          dt
        );

        if (emission && emission.amplitude > 0.001) {
          // Create new wave emitter from orbital response
          const emitterId = `orbital-response-${geometry.itemId}-${orbitalIndex}-${Date.now()}`;
          this.waveEmitters.set(emitterId, {
            itemId: emitterId,
            position: orbital.position || geometry.position,
            type: 'orbital-response',
            frequency: emission.frequency,
            amplitude: emission.amplitude * 0.1,
            phase: emission.phase,
            wavelength: this.config.lightSpeed / emission.frequency,
            intensity: emission.amplitude * emission.amplitude * 0.01,
            range: 50,
            isActive: true,
            lastEmissionTime: this.simulationTime
          });
        }

        // 6. Track interaction for particle generation coherence
        geometry._orbitalInteractionHistory.push({
          timestamp: this.simulationTime,
          orbitalIndex,
          waveFrequency: wave.frequency,
          coupling: resonance.coupling,
          type: resonance.type
        });

        // Clean up old interactions (keep only last 100ms)
        geometry._orbitalInteractionHistory = geometry._orbitalInteractionHistory.filter(
          interaction => (this.simulationTime - interaction.timestamp) < 0.1
        );
      }
    }
  }

  /**
   * Phase 5.4: Detect advanced particle generation from coherent wave-orbital interactions
   * Uses coherence tracking for realistic photon creation
   */
  _detectAdvancedParticleGeneration(geometry, incidentWaves, dt) {
    const particles = [];
    
    if (!geometry.electronClouds || geometry.electronClouds.length === 0) return particles;
    if (!geometry._orbitalInteractionHistory || geometry._orbitalInteractionHistory.length === 0) return particles;

    // For each electron orbital
    for (let orbitalIndex = 0; orbitalIndex < geometry.electronClouds.length; orbitalIndex++) {
      const orbital = geometry.electronClouds[orbitalIndex];
      const orbitalFrequency = getOrbitalFrequency(orbital.n || 1, geometry.atomicNumber || 1);

      // Check each incident wave for particle generation threshold
      for (const wave of incidentWaves) {
        const resonance = detectResonance(
          wave.frequency,
          orbitalFrequency,
          wave.amplitude
        );

        if (resonance.coupling < 0.3) continue; // Too weak to generate particles

        // Get coherence factor from interaction history
        const recentInteractions = geometry._orbitalInteractionHistory.filter(
          i => i.orbitalIndex === orbitalIndex
        );

        // Generate particles with probability based on coupling × coherence
        const particle = detectParticleGeneration(
          orbital,
          wave,
          resonance,
          recentInteractions
        );

        // Add particle with probability
        if (particle && particle.emergenceProbability > Math.random()) {
          particles.push({
            id: `particle-${geometry.itemId}-${orbitalIndex}-${Date.now()}-${Math.random()}`,
            position: orbital.position || geometry.position,
            frequency: particle.frequency,
            energy: particle.energy,
            type: particle.type || 'photon-like',
            sourceOrbital: `${geometry.itemId}-${orbitalIndex}`,
            timestamp: this.simulationTime,
            emergenceProbability: particle.emergenceProbability,
            momentum: particle.momentum || [0, 0, 0]
          });
        }
      }
    }

    return particles;
  }

  /**
   * Calculate forces acting on geometries
   * Includes gravity waves, light pressure, wave interference forces
   */
  _calculateForces(dt) {
    for (const [itemId, geometry] of this.geometries) {
      geometry.forces = [];

      // 1. Gravity (wave-based)
      const gravityForce = this._calculateGravityForce(geometry);
      if (gravityForce) geometry.forces.push(gravityForce);

      // 2. Light pressure from wave emitters
      for (const [emitterId, emitter] of this.waveEmitters) {
        if (emitter.type === 'light') {
          const lightForce = this._calculateLightPressureForce(geometry, emitter);
          if (lightForce) geometry.forces.push(lightForce);
        }
      }

      // 3. Wave interference forces (constructive/destructive)
      const interferenceForce = this._calculateInterferenceForce(geometry);
      if (interferenceForce) geometry.forces.push(interferenceForce);

      // 4. Damping force (energy loss)
      const dampingForce = this._calculateDampingForce(geometry);
      if (dampingForce) geometry.forces.push(dampingForce);

      // Calculate net force and acceleration
      const netForce = this._sumForces(geometry.forces);
      geometry.acceleration = [
        netForce[0] / geometry.mass,
        netForce[1] / geometry.mass,
        netForce[2] / geometry.mass
      ];
    }
  }

  /**
   * Calculate gravity force (wave-based, from metric tensor curvature)
   */
  _calculateGravityForce(geometry) {
    // Simple gravity towards origin (can be enhanced with other mass sources)
    const distance = Math.sqrt(
      geometry.position[0] ** 2 +
      geometry.position[1] ** 2 +
      geometry.position[2] ** 2
    ) || 1;

    if (distance === 0) return null;

    const gravityStrength = (this.config.gravityStrength * geometry.mass) / (distance * distance);
    
    return [
      -geometry.position[0] / distance * gravityStrength * 0.01,
      -geometry.position[1] / distance * gravityStrength * 0.01,
      -geometry.position[2] / distance * gravityStrength * 0.01
    ];
  }

  /**
   * Calculate light pressure force
   */
  _calculateLightPressureForce(geometry, emitter) {
    const direction = this._normalize([
      geometry.position[0] - emitter.position[0],
      geometry.position[1] - emitter.position[1],
      geometry.position[2] - emitter.position[2]
    ]);

    const distance = this._distance(geometry.position, emitter.position);
    if (distance <= 0) return null;

    // Light pressure: inversely proportional to distance squared
    const pressure = (emitter.intensity * emitter.amplitude) / (distance * distance + 1);

    return [
      direction[0] * pressure * 0.001,
      direction[1] * pressure * 0.001,
      direction[2] * pressure * 0.001
    ];
  }

  /**
   * Calculate interference force from overlapping wave functions
   */
  _calculateInterferenceForce(geometry) {
    let totalForce = [0, 0, 0];
    
    // Check interference with all other geometries' waves
    for (const [otherId, other] of this.geometries) {
      if (otherId === geometry.itemId) continue;

      const phaseDifference = geometry.waveFunction.phase - other.waveFunction.phase;
      
      // Interference pattern: cos(phase difference)
      const interference = Math.cos(phaseDifference);
      
      // Attractive if constructive (interference > 0), repulsive if destructive
      const direction = this._normalize([
        other.position[0] - geometry.position[0],
        other.position[1] - geometry.position[1],
        other.position[2] - geometry.position[2]
      ]);

      const forceStrength = interference * 0.01 * geometry.waveFunction.amplitude * other.waveFunction.amplitude;

      totalForce[0] += direction[0] * forceStrength;
      totalForce[1] += direction[1] * forceStrength;
      totalForce[2] += direction[2] * forceStrength;
    }

    return totalForce;
  }

  /**
   * Calculate damping force (energy dissipation)
   */
  _calculateDampingForce(geometry) {
    const dampingCoefficient = 0.02; // Energy loss per frame
    return [
      -geometry.velocity[0] * dampingCoefficient,
      -geometry.velocity[1] * dampingCoefficient,
      -geometry.velocity[2] * dampingCoefficient
    ];
  }

  /**
   * Update geometry positions and velocities using integration
   */
  _updateGeometries(dt) {
    for (const [itemId, geometry] of this.geometries) {
      // Velocity Verlet integration: v(t+dt) = v(t) + a(t)*dt
      geometry.velocity[0] += geometry.acceleration[0] * dt;
      geometry.velocity[1] += geometry.acceleration[1] * dt;
      geometry.velocity[2] += geometry.acceleration[2] * dt;

      // Position update: x(t+dt) = x(t) + v(t)*dt
      geometry.position[0] += geometry.velocity[0] * dt;
      geometry.position[1] += geometry.velocity[1] * dt;
      geometry.position[2] += geometry.velocity[2] * dt;

      // Update energy
      const kineticEnergy = 0.5 * geometry.mass * (
        geometry.velocity[0] ** 2 +
        geometry.velocity[1] ** 2 +
        geometry.velocity[2] ** 2
      );
      geometry.energy = kineticEnergy + geometry.internalEnergy;

      this.stats.geometryUpdates++;
    }
  }

  /**
   * Apply relativistic corrections using metric tensor transformations
   * Implements time dilation from special relativity
   */
  _applyRelativisticCorrections(dt) {
    for (const [itemId, geometry] of this.geometries) {
      // Calculate velocity relative to light speed
      const speed = Math.sqrt(
        geometry.velocity[0] ** 2 +
        geometry.velocity[1] ** 2 +
        geometry.velocity[2] ** 2
      );

      // Time dilation factor: γ = 1/sqrt(1 - v²/c²)
      const speedRatio = speed / this.config.lightSpeed;
      const timeDilation = speedRatio < 0.99999 ? Math.sqrt(1 - speedRatio * speedRatio) : 1e-5;
      geometry.timeDilation = 1 / timeDilation;

      // Apply metric tensor transformation to position
      // For Schwarzschild-like spacetime (simplified)
      const r = Math.sqrt(
        geometry.position[0] ** 2 +
        geometry.position[1] ** 2 +
        geometry.position[2] ** 2
      ) || 1;

      // Schwarzschild factor
      const G = 6.67430e-11;
      const M = 1; // Central mass
      const schwarzschildFactor = Math.sqrt(1 - (2 * G * M) / (r * this.config.lightSpeed * this.config.lightSpeed));

      // Apply curvature correction (scale factor decreases near massive objects)
      for (let i = 0; i < 3; i++) {
        geometry.scale[i] = Math.max(0.1, geometry.scale[i] * schwarzschildFactor);
      }
    }
  }

  /**
   * Update tensor fields based on physics
   */
  _updateTensorFields(dt) {
    for (const [itemId, tensorField] of this.tensorFields) {
      const geometry = this.geometries.get(tensorField.geometryItemId);
      if (!geometry) continue;

      // Update phase evolution
      const omega = 2 * Math.PI * (tensorField.frequency / 1000);
      tensorField.phase += omega * dt;

      // Influence from nearby wave emitters
      for (const [emitterId, emitter] of this.waveEmitters) {
        const distance = this._distance(geometry.position, emitter.position);
        if (distance <= emitter.range) {
          // Intensity modulation
          const emitterInfluence = emitter.intensity / (1 + distance * distance);
          tensorField.intensity = Math.max(
            tensorField.intensity * 0.95,
            emitterInfluence * 0.05
          );
        }
      }

      // Update energy distribution across dimensions
      tensorField.energyDistribution = this._distributeEnergyAcrossDimensions(
        tensorField.energy,
        tensorField.d0,
        tensorField.d1
      );

      this.stats.tensorUpdates++;
    }
  }

  /**
   * Distribute energy across 3D+4D dimensions
   */
  _distributeEnergyAcrossDimensions(totalEnergy, d0, d1) {
    // Weight by dimensional components
    const d0_weight = d0 / (d0 + d1 + 0.001);
    const d1_weight = d1 / (d0 + d1 + 0.001);

    return {
      x: totalEnergy * d0_weight * 0.3,
      y: totalEnergy * d0_weight * 0.3,
      z: totalEnergy * d0_weight * 0.4,
      w: totalEnergy * d1_weight // 4D component
    };
  }

  /**
   * Apply dimensional coupling: 3D↔4D interactions
   * Changes in 4D tensor fields affect 3D geometries and vice versa
   */
  _applyDimensionalCoupling(dt) {
    if (!this.couplingEnabled) return;

    const couplingStr = this.config.dimensionalCouplingStrength;

    // 1. 4D → 3D: Tensor field intensity affects geometry motion
    for (const [itemId, tensorField] of this.tensorFields) {
      const geometry = this.geometries.get(tensorField.geometryItemId);
      if (!geometry) continue;

      // Energy exchange: tensor field couples energy to geometry
      const energyExchange = tensorField.energy * couplingStr * dt;
      geometry.internalEnergy += energyExchange;
      tensorField.energy -= energyExchange;

      // Acceleration boost from tensor field intensity
      const intensityBoost = tensorField.intensity * couplingStr * 0.001;
      geometry.acceleration[0] += intensityBoost * (Math.random() - 0.5);
      geometry.acceleration[1] += intensityBoost * (Math.random() - 0.5);
      geometry.acceleration[2] += intensityBoost * (Math.random() - 0.5);

      geometry.couplingEnergy = energyExchange;
      this.stats.interactionCount++;
    }

    // 2. 3D → 4D: Geometry movement affects tensor fields
    for (const [itemId, geometry] of this.geometries) {
      const tensorField = this.tensorFields.get(itemId);
      if (!tensorField) continue;

      // Movement coupling: velocity affects tensor frequency
      const movementMagnitude = Math.sqrt(
        geometry.velocity[0] ** 2 +
        geometry.velocity[1] ** 2 +
        geometry.velocity[2] ** 2
      );

      const frequencyShift = movementMagnitude * couplingStr * 10;
      tensorField.frequency = Math.max(100, tensorField.frequency + frequencyShift * dt);

      // Energy transfer: geometric motion generates tensor field energy
      const geometricEnergy = geometry.energy * couplingStr * 0.01 * dt;
      tensorField.energy += geometricEnergy;
      geometry.energy -= geometricEnergy;
    }
  }

  /**
   * Handle wave interference between geometries
   */
  _handleInterferences(dt) {
    const geometriesArray = Array.from(this.geometries.values());

    for (let i = 0; i < geometriesArray.length; i++) {
      for (let j = i + 1; j < geometriesArray.length; j++) {
        const g1 = geometriesArray[i];
        const g2 = geometriesArray[j];

        const distance = this._distance(g1.position, g2.position);
        if (distance > 20) continue; // Only consider nearby objects

        // Calculate phase difference
        const phaseDiff = Math.abs(g1.waveFunction.phase - g2.waveFunction.phase);
        
        // Interference pattern
        const interference = Math.cos(phaseDiff);

        // Update amplitudes based on interference
        if (interference > 0.5) {
          // Constructive interference: amplitudes increase
          g1.waveFunction.amplitude *= 1.01;
          g2.waveFunction.amplitude *= 1.01;
        } else if (interference < -0.5) {
          // Destructive interference: amplitudes decrease
          g1.waveFunction.amplitude *= 0.99;
          g2.waveFunction.amplitude *= 0.99;
        }

        this.stats.interactionCount++;
      }
    }
  }

  /**
   * Get current wave state for broadcasting
   */
  _getWaveState() {
    const waveState = {};
    
    for (const [emitterId, emitter] of this.waveEmitters) {
      waveState[emitterId] = {
        position: emitter.position,
        phase: emitter.phase,
        frequency: emitter.frequency,
        amplitude: emitter.amplitude
      };
    }

    return waveState;
  }

  /**
   * Update physics statistics
   */
  _updateStatistics() {
    let totalEnergy = 0;
    let totalIntensity = 0;
    let tensorCount = 0;

    for (const [itemId, geometry] of this.geometries) {
      totalEnergy += geometry.energy;
    }

    for (const [itemId, tensorField] of this.tensorFields) {
      totalEnergy += tensorField.energy;
      totalIntensity += tensorField.intensity;
      tensorCount++;
    }

    this.stats.totalEnergy = totalEnergy;
    this.stats.averageWaveIntensity = tensorCount > 0 ? totalIntensity / tensorCount : 0;
    this.stats.activeWaveEmitters = this.waveEmitters.size;
  }

  /**
   * Utility: Calculate distance between two 3D points
   */
  _distance(p1, p2) {
    return Math.sqrt(
      (p2[0] - p1[0]) ** 2 +
      (p2[1] - p1[1]) ** 2 +
      (p2[2] - p1[2]) ** 2
    );
  }

  /**
   * Utility: Normalize vector
   */
  _normalize(v) {
    const len = Math.sqrt(v[0] ** 2 + v[1] ** 2 + v[2] ** 2) || 1;
    return [v[0] / len, v[1] / len, v[2] / len];
  }

  /**
   * Utility: Sum force vectors
   */
  _sumForces(forces) {
    const sum = [0, 0, 0];
    for (const force of forces) {
      sum[0] += force[0];
      sum[1] += force[1];
      sum[2] += force[2];
    }
    return sum;
  }

  // ===== PUBLIC API =====

  /**
   * Get geometry state
   */
  getGeometry(itemId) {
    return this.geometries.get(itemId);
  }

  /**
   * Get tensor field state
   */
  getTensorField(itemId) {
    return this.tensorFields.get(itemId);
  }

  /**
   * Get all geometries
   */
  getAllGeometries() {
    return Array.from(this.geometries.values());
  }

  /**
   * Get all tensor fields
   */
  getAllTensorFields() {
    return Array.from(this.tensorFields.values());
  }

  /**
   * Update geometry properties
   */
  updateGeometry(itemId, updates) {
    const geometry = this.geometries.get(itemId);
    if (!geometry) return null;

    Object.assign(geometry, updates);
    geometry.lastUpdateTime = this.simulationTime;
    return geometry;
  }

  /**
   * Update tensor field properties
   */
  updateTensorField(itemId, updates) {
    const tensorField = this.tensorFields.get(itemId);
    if (!tensorField) return null;

    Object.assign(tensorField, updates);
    tensorField.lastUpdateTime = this.simulationTime;
    return tensorField;
  }

  /**
   * Remove geometry from simulation
   */
  removeGeometry(itemId) {
    this.geometries.delete(itemId);
  }

  /**
   * Remove tensor field from simulation
   */
  removeTensorField(itemId) {
    this.tensorFields.delete(itemId);
  }

  /**
   * Enable/disable wave emitter
   */
  setWaveEmitterActive(emitterId, isActive) {
    const emitter = this.waveEmitters.get(emitterId);
    if (emitter) {
      emitter.isActive = isActive;
    }
  }

  /**
   * Enable/disable dimensional coupling
   */
  setCouplingEnabled(enabled) {
    this.couplingEnabled = enabled;
  }

  /**
   * Get physics statistics
   */
  getStatistics() {
    return { ...this.stats };
  }

  /**
   * Get engine configuration
   */
  getConfig() {
    return { ...this.config };
  }

  /**
   * Set engine configuration
   */
  setConfig(updates) {
    Object.assign(this.config, updates);
  }

  /**
   * Get current simulation time
   */
  getSimulationTime() {
    return this.simulationTime;
  }

  /**
   * Get dimensionally coupled state (for broadcasting)
   */
  getCoupledState() {
    return {
      geometries: this.getAllGeometries(),
      tensorFields: this.getAllTensorFields(),
      waveEmitters: Array.from(this.waveEmitters.values()),
      stats: this.getStatistics(),
      couplingEnabled: this.couplingEnabled,
      simulationTime: this.simulationTime
    };
  }
}

export default MistPhysicsEngine;
