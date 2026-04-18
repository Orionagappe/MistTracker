import { useState, useCallback, useMemo } from 'react';

/**
 * useAtomBuilder Hook
 * Phase 7.3: Live predictions for atom builder configurations
 * 
 * Calculates resonance properties based on atomic configurations and wave parameters
 * Provides real-time feedback during model building
 */

// Physics constants
const RYDBERG_FREQUENCY = 3.29e15; // Hz - Fundamental resonance for hydrogen
const PARTICLE_GENERATION_THRESHOLD = 0.5; // Coupling × Amplitude threshold
const SPEED_OF_LIGHT = 3e8; // m/s
const PLANCK_CONSTANT = 6.626e-34; // J·s
const ELECTRON_MASS = 9.109e-31; // kg

/**
 * Get orbital response based on quantum numbers
 * Deeper orbitals (higher n) respond less strongly
 */
function getOrbitalResponse(n, l, m) {
  const depthFactor = 1 / (1 + n * n); // Range: 1 (n=1) to 0.25 (n=2) to 0.111 (n=3)
  const angularFactor = (l + 1) / (l + 1 + Math.abs(m)); // Angular momentum weighting
  return depthFactor * angularFactor;
}

/**
 * Calculate resonance coupling percentage
 * Based on frequency match and orbital response
 */
function calculateResonanceCoupling(waveFreq, atomOrbital, atomicNumber = 1) {
  const orbitalResponse = getOrbitalResponse(atomOrbital.n, atomOrbital.l, atomOrbital.m);
  
  // Z-dependent frequency scaling (nuclear charge effect)
  const zFactor = Math.pow(atomicNumber, 2) * RYDBERG_FREQUENCY;
  const frequencyRatio = Math.min(waveFreq / zFactor, 2.0); // Cap at 2x for numerical stability
  
  // Gaussian resonance peak centered at orbital frequency
  const resonanceFactor = Math.exp(-Math.pow(frequencyRatio - 1, 2) / 0.2);
  
  // Combined coupling: orbital response × resonance peak × Z adjustment
  const zAdjustment = 1 / (1 + (atomicNumber - 1) * 0.1); // Heavier elements slightly weaker
  const coupling = orbitalResponse * resonanceFactor * zAdjustment;
  
  return Math.min(coupling, 1.0); // Clamp to 0-1
}

/**
 * Calculate particle generation probability
 * Depends on coupling strength and wave amplitude
 */
function calculateParticleGeneration(coupling, amplitude) {
  // Base threshold
  const effectiveEnergy = coupling * amplitude;
  
  if (effectiveEnergy < PARTICLE_GENERATION_THRESHOLD) {
    return 0;
  }
  
  // Sigmoidal curve for probability ramp-up
  const excess = effectiveEnergy - PARTICLE_GENERATION_THRESHOLD;
  const probability = Math.min(1 / (1 + Math.exp(-10 * excess)), 1.0);
  
  return probability;
}

/**
 * Calculate orbital displacement (orbital expansion/contraction)
 * In meters, based on energy transfer
 */
function calculateDisplacement(coupling, amplitude, n) {
  // Bohr radius: 5.29e-11 m
  const bohrRadius = 5.29e-11;
  
  // Energy-dependent displacement
  const energyFactor = coupling * amplitude;
  const displacement = bohrRadius * Math.pow(n, 2) * energyFactor * 0.01; // 1% max distortion
  
  return displacement;
}

/**
 * Calculate emission frequency after resonance
 * Energy conservation with damping
 */
function calculateEmissionFrequency(waveFreq, coupling, n) {
  const zFactor = Math.pow(1, 2) * RYDBERG_FREQUENCY; // Using Z=1 for reference
  
  // Frequency shift based on coupling strength
  const frequencyShift = 1 + (coupling * 0.2); // Up to 20% shift
  const emissionFreq = (waveFreq / frequencyShift) * Math.pow(n, 2);
  
  return Math.max(emissionFreq, 1e14); // Clamp to visible spectrum range
}

/**
 * Calculate quality factor (coherence measure)
 * Range: 0.1 (weak) to 1.0 (perfect coherence)
 */
function calculateQualityFactor(coupling, atoms, distance = 100) {
  // Base quality from primary atom
  let q = coupling * 0.7;
  
  // Multi-atom interaction effect (slightly reduces coherence)
  const interactionDamping = Math.exp(-atoms.length / 5); // Multiple atoms slightly reduce Q
  q *= interactionDamping;
  
  // Distance damping (inverse-square law)
  if (distance > 0) {
    const distanceDamping = 1 / Math.sqrt(1 + Math.pow(distance / 50, 2));
    q *= distanceDamping;
  }
  
  return Math.min(Math.max(q, 0.1), 1.0); // Clamp to 0.1-1.0
}

/**
 * Predict wave propagation effects
 * Returns intensity degradation at various distances
 */
function predictWavePropagation(amplitude, numAtoms) {
  const distances = [0, 50, 100, 200];
  
  return distances.map(dist => ({
    distance: dist,
    intensity: amplitude / (1 + Math.pow(dist / 50, 2)) // Inverse-square fall-off
  }));
}

/**
 * Check for harmonic resonance (multiple frequency components)
 */
function checkHarmonicResonance(waveFreq, atoms) {
  // Always return a consistent object structure
  if (atoms.length < 2) {
    return { detected: false, order: 1, frequency: waveFreq };
  }
  
  const fundamentalRatio = waveFreq / RYDBERG_FREQUENCY;
  const harmonicOrder = Math.round(fundamentalRatio);
  
  if (Math.abs(fundamentalRatio - harmonicOrder) < 0.1 && harmonicOrder > 1) {
    return {
      detected: true,
      order: harmonicOrder,
      frequency: RYDBERG_FREQUENCY * harmonicOrder
    };
  }
  
  return { detected: false, order: 1, frequency: waveFreq };
}

/**
 * Main hook: Calculate all predictions for builder configuration
 * Phase 8.2: Optimized with memoization to prevent unnecessary recalculations
 */

// Memoized atomic number map (never changes)
const ATOMIC_NUMBERS = { H: 1, He: 2, Li: 3, C: 6, N: 7, O: 8 };

export function useAtomBuilder(atoms = [], emitters = []) {
  const [predictions, setPredictions] = useState(null);
  const [warnings, setWarnings] = useState([]);

  // Main calculation - memoized to only run when atoms/emitters actually change
  const calculatePredictions = useCallback(() => {
    if (atoms.length === 0 || emitters.length === 0) {
      setPredictions(null);
      setWarnings([]);
      return;
    }

    const newWarnings = [];

    // Calculate per-emitter predictions
    const emitterPredictions = emitters.map(emitter => {
      const waveFreq = emitter.frequency || RYDBERG_FREQUENCY;
      const waveAmplitude = emitter.amplitude || 0.5;
      
      // Per-atom predictions
      const atomPredictions = atoms.map(atom => {
        const elementSymbol = atom.orbital_name?.[0]?.toUpperCase() || 'H';
        const z = ATOMIC_NUMBERS[elementSymbol] || 1;
        const n = atom.orbital?.n || 2;
        const l = atom.orbital?.l || 0;
        const m = atom.orbital?.m || 0;

        const coupling = calculateResonanceCoupling(waveFreq, { n, l, m }, z);
        const particleGen = calculateParticleGeneration(coupling, waveAmplitude);
        const displacement = calculateDisplacement(coupling, waveAmplitude, n);
        const emissionFreq = calculateEmissionFrequency(waveFreq, coupling, n);
        const q = calculateQualityFactor(coupling, atoms);

        return {
          atomId: atom.id,
          coupling: (coupling * 100).toFixed(1),
          particleGeneration: (particleGen * 100).toFixed(1),
          displacement: displacement.toExponential(2),
          emissionFrequency: emissionFreq.toExponential(2),
          qualityFactor: q.toFixed(3)
        };
      });

      // Check for harmonics
      const harmonic = checkHarmonicResonance(waveFreq, atoms);
      if (harmonic.detected) {
        newWarnings.push(`⚠️ Detected harmonic resonance (${harmonic.order}× fundamental)`);
      }

      // Wave propagation
      const propagation = predictWavePropagation(waveAmplitude, atoms.length);

      // Aggregate metrics
      const totalParticles = atomPredictions.reduce(
        (sum, pred) => sum + parseFloat(pred.particleGeneration),
        0
      ).toFixed(0);

      const avgCoupling = (
        atomPredictions.reduce((sum, pred) => sum + parseFloat(pred.coupling), 0) /
        atomPredictions.length
      ).toFixed(1);

      return {
        emitterId: emitter.id,
        frequency: waveFreq.toExponential(2),
        amplitude: waveAmplitude.toFixed(2),
        atomPredictions,
        totalParticles,
        averageCoupling: avgCoupling,
        propagation,
        harmonic
      };
    });

    // Configuration warnings
    if (atoms.length > 5) {
      newWarnings.push('⚠️ Large atom count may reduce simulation performance');
    }

    const lowestCoupling = Math.min(
      ...emitterPredictions.flatMap(ep =>
        ep.atomPredictions.map(ap => parseFloat(ap.coupling))
      )
    );

    if (lowestCoupling < 10) {
      newWarnings.push('⚠️ Low coupling detected - increase wave amplitude or use different orbits');
    }

    setPredictions({
      emitters: emitterPredictions,
      timestamp: Date.now(),
      totalAtoms: atoms.length,
      totalEmitters: emitters.length
    });

    setWarnings(newWarnings);
  }, [atoms, emitters]);

  // Auto-calculate when atoms/emitters change (now with proper dependencies)
  useMemo(() => {
    calculatePredictions();
  }, [calculatePredictions]);

  // Memoize return object to ensure stable reference
  const returnValue = useMemo(() => ({
    predictions,
    warnings,
    recalculate: calculatePredictions,
    constants: {
      RYDBERG_FREQUENCY,
      PARTICLE_GENERATION_THRESHOLD,
      SPEED_OF_LIGHT,
      PLANCK_CONSTANT,
      ELECTRON_MASS
    }
  }), [predictions, warnings, calculatePredictions]);

  return returnValue;
}

export default useAtomBuilder;
