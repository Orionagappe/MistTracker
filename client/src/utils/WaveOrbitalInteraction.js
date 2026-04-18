/**
 * WaveOrbitalInteraction.js
 * 
 * Advanced wave-orbital interaction detection and response algorithms
 * Implements quantum mechanical coupling between wave field and electron orbitals
 * 
 * Phase 5.4: Enhanced interaction mechanics including:
 * - Sophisticated resonance detection
 * - Orbital response to incident waves
 * - Energy transfer calculations
 * - Particle generation tracking
 */

/**
 * Detect resonance between wave and orbital
 * Returns detailed resonance characteristics
 * 
 * @param {number} waveFrequency - Frequency of incident wave (Hz)
 * @param {number} orbitalFrequency - Natural orbital frequency (Hz)
 * @param {number} waveAmplitude - Wave amplitude at orbital location
 * @returns {Object} Resonance data {isResonant, strengthFactor, phase, coupling}
 */
export function detectResonance(waveFrequency, orbitalFrequency, waveAmplitude) {
  if (!waveFrequency || !orbitalFrequency || waveAmplitude <= 0) {
    return {
      isResonant: false,
      strengthFactor: 0,
      resonanceRatio: 0,
      phase: 0,
      coupling: 0
    };
  }

  // Resonance ratio: how close to harmony
  const resonanceRatio = waveFrequency / orbitalFrequency;
  
  // Determine resonance type and strength
  let resonanceType = 'off';
  let strengthFactor = 0;
  
  // Direct resonance (fundamental)
  if (resonanceRatio >= 0.9 && resonanceRatio <= 1.1) {
    resonanceType = 'fundamental';
    strengthFactor = 1.0 - Math.abs(resonanceRatio - 1.0) * 5; // Peak at 1.0
  }
  // First harmonic (2:1)
  else if (resonanceRatio >= 1.8 && resonanceRatio <= 2.2) {
    resonanceType = 'harmonic-2';
    strengthFactor = (0.8 - Math.abs(resonanceRatio - 2.0) * 4) * 0.6;
  }
  // Half harmonic (1:2)
  else if (resonanceRatio >= 0.4 && resonanceRatio <= 0.6) {
    resonanceType = 'subharmonic';
    strengthFactor = (0.8 - Math.abs(resonanceRatio - 0.5) * 4) * 0.4;
  }
  // Threshold resonance (≥50% period)
  else if (resonanceRatio >= 0.5 && resonanceRatio <= 2.0) {
    resonanceType = 'threshold';
    strengthFactor = 0.2; // Weak coupling
  }

  // Wave-amplitude coupling
  const amplitudeCoupling = Math.min(1.0, waveAmplitude * 2.0);
  
  return {
    isResonant: strengthFactor > 0.1,
    type: resonanceType,
    strengthFactor: strengthFactor,
    resonanceRatio: resonanceRatio,
    amplitudeCoupling: amplitudeCoupling,
    coupling: strengthFactor * amplitudeCoupling,
    phase: (resonanceRatio % 1.0) * 2 * Math.PI
  };
}

/**
 * Calculate orbital response to incident wave
 * Computes position update, energy transfer, and state changes
 * 
 * @param {Object} orbital - {orbitalState: {n,l,m}, position, phase, energy}
 * @param {Object} wave - {position, frequency, amplitude, phase}
 * @param {Object} resonance - Result from detectResonance
 * @param {number} dt - Timestep
 * @returns {Object} Response {displacement, energyTransfer, stateChange}
 */
export function calculateOrbitalResponse(orbital, wave, resonance, dt) {
  if (!resonance.isResonant) {
    return {
      displacement: [0, 0, 0],
      energyTransfer: 0,
      stateChange: null,
      responseFactor: 0
    };
  }

  const {n, l, m} = orbital.orbitalState;
  
  // Orbital size (Bohr radius scaled by n²)
  const orbitalRadius = 0.53e-10 * (n * n); // meters, but we work in normalized units
  
  // Angular momentum effects (more responsive for p, d, f orbitals)
  const angularFactor = 1.0 + l * 0.3 + (l > 0 ? 0.2 : 0);
  
  // Distance from wave source (use existing position)
  const dx = orbital.position[0] - wave.position[0];
  const dy = orbital.position[1] - wave.position[1];
  const dz = orbital.position[2] - wave.position[2];
  const distance = Math.sqrt(dx*dx + dy*dy + dz*dz) || 1;
  
  // Wave propagation direction (normalized)
  const dirX = dx / distance;
  const dirY = dy / distance;
  const dirZ = dz / distance;
  
  // Displacement magnitude proportional to:
  // - Resonance coupling strength
  // - Wave amplitude
  // - Orbital angular momentum
  // - Inversely proportional to orbital size (* binding strength)
  const displacementMagnitude = 
    resonance.coupling * 
    wave.amplitude * 
    angularFactor * 
    0.01 *  // Scale factor
    (1.0 / (1.0 + n * n)); // Deeper shells less responsive
  
  // Phase-dependent displacement (constructive/destructive)
  const phaseDiff = (wave.phase - orbital.phase) / Math.PI;
  const phaseEffect = Math.cos(phaseDiff);
  
  const displacement = [
    dirX * displacementMagnitude * phaseEffect,
    dirY * displacementMagnitude * phaseEffect,
    dirZ * displacementMagnitude * phaseEffect
  ];
  
  // Energy transfer (Rabi oscillations analog)
  const energyTransfer = resonance.strengthFactor * wave.amplitude * wave.amplitude * dt;
  
  // State change (potential orbital transition)
  let stateChange = null;
  if (resonance.strengthFactor > 0.7 && energyTransfer > 0.01) {
    // Strong resonance might cause transition to nearby orbital
    stateChange = {
      type: 'potential-transition',
      strength: resonance.strengthFactor,
      targetOrbital: getNextOrbital(n, l, m),
      probability: Math.min(0.5, resonance.strengthFactor * 0.5)
    };
  }
  
  return {
    displacement: displacement,
    energyTransfer: energyTransfer,
    stateChange: stateChange,
    responseFactor: Math.sqrt(displacementMagnitude * displacementMagnitude 
      * 3), // Magnitude of total displacement
    resonanceDetails: resonance
  };
}

/**
 * Calculate wave emission from orbital response
 * When orbital is displaced, it emits a new wave
 * 
 * @param {Object} orbital - Electron cloud
 * @param {Object} displacement - {displacement, responseFactor, energyTransfer}
 * @param {number} orbitalFrequency - Natural frequency
 * @param {number} dt - Timestep
 * @returns {Object} Emitted wave {frequency, amplitude, phase, position}
 */
export function calculateWaveEmission(orbital, displacement, orbitalFrequency, dt) {
  if (!displacement || displacement.responseFactor === 0) {
    return null;
  }

  // Accelerating charge emits radiation
  const velocity = [
    displacement.displacement[0] / dt,
    displacement.displacement[1] / dt,
    displacement.displacement[2] / dt
  ];
  
  const acceleration = Math.sqrt(
    velocity[0]**2 + velocity[1]**2 + velocity[2]**2
  ) / dt;

  // Dipole radiation formula: amplitude ∝ acceleration
  const emissionAmplitude = Math.min(1.0, acceleration * 0.1);
  
  if (emissionAmplitude < 0.01) return null;
  
  // Frequency can shift slightly from resonance
  const frequencyShift = (orbital.phase / Math.PI) * orbitalFrequency * 0.05;
  const emissionFrequency = orbitalFrequency + frequencyShift;
  
  return {
    frequency: emissionFrequency,
    amplitude: emissionAmplitude,
    phase: orbital.phase,
    position: orbital.position,
    type: 'orbital-response',
    sourceOrbital: orbital.id,
    energyContent: displacement.energyTransfer
  };
}

/**
 * Detect particle-like interactions
 * When wave amplitude reaches threshold at orbital site
 * 
 * @param {Object} orbital - Electron cloud state
 * @param {Object} wave - Incident wave
 * @param {Object} resonance - Resonance calculation
 * @param {Array} interactionHistory - Previous interactions at this site
 * @returns {Object|null} Particle interaction details
 */
export function detectParticleGeneration(orbital, wave, resonance, interactionHistory = []) {
  if (!resonance.isResonant || resonance.coupling < 0.3) {
    return null;
  }

  // Photon-like particle generation threshold
  const generationThreshold = 0.5;
  const couplingProduct = resonance.strengthFactor * wave.amplitude;
  
  if (couplingProduct < generationThreshold) {
    return null;
  }

  // Track interaction frequency at this location
  const recentInteractions = interactionHistory.filter(
    i => i.timestamp > Date.now() - 1000 && // Last 1 second
        Math.hypot(i.position[0] - orbital.position[0],
                   i.position[1] - orbital.position[1],
                   i.position[2] - orbital.position[2]) < 1.0
  );

  // Multiple interactions increase coherence
  const coherenceFactor = 1.0 + recentInteractions.length * 0.1;
  
  // Probability of particle emergence
  const emergenceProbability = Math.min(1.0, couplingProduct * coherenceFactor);
  
  return {
    type: 'photon-like',
    position: orbital.position,
    frequency: Math.sqrt(wave.frequency * orbitalFrequency), // Geometric mean
    amplitude: wave.amplitude * resonance.strengthFactor,
    momentum: wave.amplitude * Math.PI * 2, // De Broglie relation
    energy: resonance.strengthFactor * wave.amplitude**2,
    emergenceProbability: emergenceProbability,
    resonanceQuality: resonance.strengthFactor,
    sourceWave: wave,
    sourceOrbital: orbital
  };
}

/**
 * Get next possible orbital for transition
 * Simple approximation: next shell same angular momentum
 * 
 * @param {number} n - Current principal quantum number
 * @param {number} l - Angular momentum number
 * @param {number} m - Magnetic quantum number
 * @returns {Object} Next orbital {n, l, m}
 */
export function getNextOrbital(n, l, m) {
  // Simple progression: move to next shell with same/lower l
  if (n <= 2) {
    return {n: n + 1, l: Math.min(l, n), m: m};
  } else if (l > 0) {
    return {n: n, l: l - 1, m: Math.min(m, l - 1)};
  } else {
    return {n: n + 1, l: 0, m: 0};
  }
}

/**
 * Calculate interaction metrics for telemetry
 * Used for debugging and understanding quantum state
 * 
 * @param {Array} interactions - Array of recent interactions
 * @returns {Object} Metrics {totalEnergy, meanCoupling, interactionRate, etc.}
 */
export function calculateInteractionMetrics(interactions) {
  if (!interactions || interactions.length === 0) {
    return {
      totalInteractions: 0,
      totalEnergy: 0,
      meanCoupling: 0,
      maxCoupling: 0,
      interactionRate: 0,
      avgParticleEnergy: 0
    };
  }

  const totalEnergy = interactions.reduce((sum, i) => sum + (i.energy || 0), 0);
  const couplings = interactions.map(i => i.resonanceQuality || 0);
  const maxCoupling = Math.max(...couplings);
  const meanCoupling = couplings.reduce((a, b) => a + b) / couplings.length;
  
  // Interactions per second (roughly)
  const timeSpan = Math.max(...interactions.map(i => i.timestamp || 0)) - 
                   Math.min(...interactions.map(i => i.timestamp || 0));
  const interactionRate = timeSpan > 0 ? interactions.length / (timeSpan / 1000) : 0;
  
  const particleInteractions = interactions.filter(i => i.type === 'photon-like');
  const avgParticleEnergy = particleInteractions.length > 0
    ? particleInteractions.reduce((sum, i) => sum + i.energy, 0) / particleInteractions.length
    : 0;
  
  return {
    totalInteractions: interactions.length,
    totalEnergy: totalEnergy,
    meanCoupling: meanCoupling,
    maxCoupling: maxCoupling,
    interactionRate: interactionRate,
    avgParticleEnergy: avgParticleEnergy,
    particleCount: particleInteractions.length
  };
}

/**
 * Process orbital state transition if probability exceeded
 * 
 * @param {Object} orbital - Electron cloud
 * @param {Object} stateChange - Transition data from calculateOrbitalResponse
 * @returns {boolean} Whether transition occurred
 */
export function processOrbitalTransition(orbital, stateChange) {
  if (!stateChange || Math.random() > stateChange.probability) {
    return false;
  }

  // Execute transition
  orbital.orbitalState = stateChange.targetOrbital;
  orbital.phase = 0; // Reset phase on transition
  orbital.amplitude *= 0.9; // Slight attenuation on transition
  
  console.log(`[Quantum] Orbital transition: (${stateChange.targetOrbital.n},${stateChange.targetOrbital.l},${stateChange.targetOrbital.m})`);
  return true;
}

/**
 * Helper: Calculate orbital frequency given quantum numbers
 * 
 * @param {number} n - Principal quantum number
 * @param {number} Z - Nuclear charge (atomic number)
 * @returns {number} Frequency in Hz
 */
export function getOrbitalFrequency(n, Z = 1) {
  const rydbergFrequency = 3.29e15; // Hz
  return (rydbergFrequency * Z * Z) / (n ** 3);
}

/**
 * Utility: Calculate distance-based wave intensity
 * 
 * @param {number} amplitude - Wave amplitude at source
 * @param {number} distance - Distance from source
 * @returns {number} Intensity at distance
 */
export function getWaveIntensityAtDistance(amplitude, distance) {
  if (distance === 0) return amplitude;
  return (amplitude * amplitude) / (1 + distance * distance);
}
