/**
 * ElectronDynamics.js
 * 
 * Extends physics engine with electron cloud tracking and dynamics.
 * Integrates quantum orbitals with the wave propagation system.
 * 
 * Features:
 * - Electron cloud state management
 * - Orbital transitions and waveform updates
 * - Wave emission from electron motion
 * - Orbital-wave interaction detection
 */

import { getElectronConfiguration, probabilityDensity } from './QuantumOrbitals.js';

/**
 * Add electron cloud tracking to a geometry object
 * Called when a timeline object is registered as a physics object
 * 
 * @param {Object} geometry - Physics geometry object from engine
 * @param {Object} atomConfig - Atom configuration with electron clouds
 * @returns {Object} Updated geometry with electron clouds
 */
export function addElectronClouds(geometry, atomConfig) {
  geometry.atomType = atomConfig.name;
  geometry.atomicNumber = atomConfig.atomicNumber;
  
  geometry.electronClouds = atomConfig.electronClouds.map((cloud, idx) => ({
    ...cloud,
    id: geometry.itemId + '-electron-' + idx,
    
    // Quantum state
    orbitalState: cloud.orbitalState,
    
    // Dynamic properties
    amplitude: cloud.amplitude || 1.0,
    phase: cloud.phase || 0,
    energy: cloud.energy,
    position: geometry.position ? [...geometry.position] : [0, 0, 0],
    velocity: [0, 0, 0],
    
    // Interaction tracking
    waveIntensityAt: 0, // Current incident wave intensity
    absorptionFactor: 0 // How much wave is absorbed
  }));
  
  // Add electron emission flag
  geometry.isWaveEmitter = true;
  
  return geometry;
}

/**
 * Update electron cloud states based on incident wave field
 * Called each physics timestep to apply wave-electron interactions
 * 
 * @param {Object} geometry - Geometry with electron clouds
 * @param {number} dt - Timestep
 * @param {Array} waveState - Current global wave state info
 */
export function updateElectronClouds(geometry, dt, waveState = {}) {
  if (!geometry.electronClouds || !geometry.electronClouds.length) {
    return;
  }

  for (const cloud of geometry.electronClouds) {
    // Update phase (natural orbital evolution)
    const {n, l, m} = cloud.orbitalState;
    const orbitalFrequency = getOrbitalFrequency(n, geometry.atomicNumber);
    cloud.phase += orbitalFrequency * 2 * Math.PI * dt;
    cloud.phase %= (2 * Math.PI);
    
    // Apply wave-electron coupling if present
    if (waveState && waveState.incidentWaves) {
      for (const wave of waveState.incidentWaves) {
        const distance = vectorDistance(cloud.position, wave.position);
        if (distance < wave.range) {
          // Wave intensity at electron cloud location
          const intensity = waveIntensityAtDistance(wave.amplitude, distance);
          
          // Check resonance condition: wave contains ≥ 50% of orbital period
          const waveOrbitalRatio = wave.frequency / orbitalFrequency;
          if (waveOrbitalRatio >= 0.5) {
            // Orbital responds to wave
            const displacement = incidentWaveDisplacement(wave, intensity, cloud.orbitalState);
            cloud.position = vectorAdd(cloud.position, vectorScale(displacement, dt));
            cloud.waveIntensityAt = intensity;
          }
        }
      }
    }
  }
}

/**
 * Calculate wave emission from electron motion
 * Electrons in motion emit electromagnetic waves
 * 
 * @param {Object} geometry - Geometry with electron clouds
 * @returns {Array} Wave emission events {position, frequency, amplitude, phase}
 */
export function getElectronWaveEmissions(geometry) {
  if (!geometry.electronClouds || !geometry.electronClouds.length) {
    return [];
  }

  const emissions = [];
  
  for (const cloud of geometry.electronClouds) {
    const {n, l, m} = cloud.orbitalState;
    const orbitalFrequency = getOrbitalFrequency(n, geometry.atomicNumber);
    
    // Emission intensity proportional to velocity
    const velocity = vectorMagnitude(cloud.velocity);
    const emissionAmplitude = Math.min(1.0, velocity * 0.1 + cloud.amplitude * 0.01);
    
    // Emit at orbital frequency
    emissions.push({
      sourceId: cloud.id,
      position: [...cloud.position],
      frequency: orbitalFrequency * 1000, // Convert to Hz
      amplitude: emissionAmplitude,
      phase: cloud.phase,
      wavelength: 299792458 / (orbitalFrequency * 1000)
    });
  }
  
  return emissions;
}

/**
 * Get orbital frequency from quantum shell
 * Frequency ∝ Z² / n³
 * 
 * @param {number} n - Principal quantum number
 * @param {number} Z - Nuclear charge
 * @returns {number} Frequency in arbitrary units
 */
export function getOrbitalFrequency(n, Z = 1) {
  const rydbergFrequency = 3.29e15; // Hz (Rydberg frequency)
  return (rydbergFrequency * Z * Z) / (n ** 3);
}

/**
 * Calculate wave intensity at a distance
 * Follows inverse-square law
 * 
 * @param {number} amplitude - Wave amplitude at source
 * @param {number} distance - Distance from source
 * @returns {number} Intensity at distance
 */
export function waveIntensityAtDistance(amplitude, distance) {
  if (distance === 0) return amplitude;
  return (amplitude * amplitude) / (1 + distance * distance);
}

/**
 * Calculate displacement imparted to electron cloud by incident wave
 * 
 * @param {Object} wave - Wave properties {amplitude, frequency, phase, position}
 * @param {number} intensity - Intensity at cloud location
 * @param {Object} orbitalState - {n, l, m}
 * @returns {Array} Displacement vector [x, y, z]
 */
export function incidentWaveDisplacement(wave, intensity, orbitalState) {
  const {n, l, m} = orbitalState;
  
  // Displacement amplitude depends on interaction strength
  // Stronger for p/d orbitals than s
  const angularFactor = 1 + l * 0.5; // s gets 1.0x, p gets 1.5x, d gets 2.0x
  
  const displacement = intensity * 0.001 * angularFactor;
  
  // Direction: toward wave source
  const directionNorm = 1 / Math.sqrt(3);
  
  return [
    displacement * directionNorm,
    displacement * directionNorm,
    displacement * directionNorm
  ];
}

/**
 * Detect when electrons form "real" particles
 * Simplification: photon-like interaction when:
 * - Wave intersects orbital
 * - Resonance condition met (wave amplitude ≥ 50% orbital cycle)
 * - Electron absorbs and re-emits energy
 * 
 * @param {Object} geometry - Target geometry
 * @param {Array} incomingWaves - Array of incident waves
 * @returns {Array} Detected particle interactions
 */
export function detectParticleInteractions(geometry, incomingWaves = []) {
  if (!geometry.electronClouds) return [];
  
  const interactions = [];
  
  for (const wave of incomingWaves) {
    for (const cloud of geometry.electronClouds) {
      const distance = vectorDistance(cloud.position, wave.position);
      
      if (distance > wave.range) continue;
      
      const {n, l, m} = cloud.orbitalState;
      const orbitalFreq = getOrbitalFrequency(n, geometry.atomicNumber);
      const intensity = waveIntensityAtDistance(wave.amplitude, distance);
      
      // Resonance condition: incident wave contains ≥ 50% of orbital period
      const resonanceRatio = wave.frequency / orbitalFreq;
      if (resonanceRatio >= 0.5 && intensity > 0.01) {
        interactions.push({
          type: 'photon-like',
          sourceWave: wave,
          targetElectron: cloud,
          geometry: geometry.itemId,
          resonanceStrength: Math.min(1.0, resonanceRatio),
          intensity: intensity,
          position: cloud.position,
          timestamp: Date.now()
        });
      }
    }
  }
  
  return interactions;
}

/**
 * Get probability density at a point for visualization
 * 
 * @param {Object} cloud - Electron cloud
 * @param {Array} point - [x, y, z] position
 * @returns {number} Probability density |ψ|²
 */
export function getDensityAtPoint(cloud, point) {
  const {n, l, m} = cloud.orbitalState;
  
  // Convert to spherical coordinates relative to atom center
  const dx = point[0], dy = point[1], dz = point[2];
  const r = Math.sqrt(dx*dx + dy*dy + dz*dz);
  const theta = Math.atan2(Math.sqrt(dx*dx + dy*dy), dz);
  const phi = Math.atan2(dy, dx);
  
  // Use quantum orbital probability density
  return probabilityDensity(n, l, m, r, theta, phi);
}

// ============= Helper Functions =============

function vectorDistance(a, b) {
  const dx = a[0] - b[0];
  const dy = a[1] - b[1];
  const dz = a[2] - b[2];
  return Math.sqrt(dx*dx + dy*dy + dz*dz);
}

function vectorMagnitude(v) {
  return Math.sqrt(v[0]*v[0] + v[1]*v[1] + v[2]*v[2]);
}

function vectorAdd(a, b) {
  return [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
}

function vectorScale(v, s) {
  return [v[0] * s, v[1] * s, v[2] * s];
}

function vectorNormalize(v) {
  const mag = vectorMagnitude(v);
  if (mag === 0) return [0, 0, 0];
  return [v[0]/mag, v[1]/mag, v[2]/mag];
}

export {
  vectorDistance,
  vectorMagnitude,
  vectorAdd,
  vectorScale,
  vectorNormalize
};
