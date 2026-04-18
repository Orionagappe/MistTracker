/**
 * DEMO_PHYSICS_CONFIGS.js - Physics Model Demo Configurations
 * Aligned with test-physics-integration.js test scenarios
 * Phase 11: Unified atom model with orbital (EM−) and nuclear (EM+) properties
 */

/**
 * Scenario 1: Simple Hydrogen Atom with Resonant Wave
 * Basic test of atom registration and electron evolution
 */
export const HYDROGEN_SIMPLE = {
  name: 'Hydrogen Simple',
  description: 'Single hydrogen atom with resonant wave emitter',
  timestamp: new Date().toISOString(),
  atoms: [
    {
      id: 'demo-h-1',
      orbital_name: '1s',
      orbital: { n: 1, l: 0, m: 0 },
      position: [0, 0, 0],
      // Orbital properties (Electrons - EM−)
      orbitalAmplitude: 0.5,
      orbitalFrequency: 4.84e14,     // ~620 nm (red)
      orbitalIntensity: 1.0,
      // Nuclear properties (Protons - EM+)
      nucleusAmplitude: 0.3,
      nucleusFrequency: 3.29e15,     // ~90 nm (UV)
      nucleusIntensity: 1.0
    }
  ],
  waveEmitters: [
    {
      id: 'emit-h-simple',
      position: [0, 0, 0],
      frequency: 7000,                // Resonant frequency for H
      amplitude: 0.8,
      wavelength: 50
    }
  ],
  simulationParams: {
    timeDilation: 1.0,
    fieldStrength: 1.0,
    gravityStrength: 1.0,
    waveSpeedMultiplier: 1.0
  }
};

/**
 * Scenario 2: Multi-Atom System (H, He, C)
 * Tests independent evolution of multiple atoms
 */
export const MULTI_ATOM = {
  name: 'Multi-Atom Array',
  description: 'Three different atoms evolving independently',
  timestamp: new Date().toISOString(),
  atoms: [
    {
      id: 'demo-h-multi',
      orbital_name: '2p',
      orbital: { n: 2, l: 1, m: 0 },
      position: [-80, 0, 0],
      orbitalAmplitude: 0.5,
      orbitalFrequency: 5.0e14,       // Optical range
      orbitalIntensity: 1.0,
      nucleusAmplitude: 0.3,
      nucleusFrequency: 3.29e15,
      nucleusIntensity: 1.0
    },
    {
      id: 'demo-he-multi',
      orbital_name: '2p',
      orbital: { n: 2, l: 1, m: 0 },
      position: [0, 0, 0],
      orbitalAmplitude: 0.5,
      orbitalFrequency: 5.0e14,
      orbitalIntensity: 1.0,
      nucleusAmplitude: 0.3,
      nucleusFrequency: 5.84e15,      // Helium (higher Z, higher frequency)
      nucleusIntensity: 1.0
    },
    {
      id: 'demo-c-multi',
      orbital_name: '2p',
      orbital: { n: 2, l: 1, m: 0 },
      position: [80, 0, 0],
      orbitalAmplitude: 0.5,
      orbitalFrequency: 5.0e14,
      orbitalIntensity: 1.0,
      nucleusAmplitude: 0.3,
      nucleusFrequency: 1.22e16,      // Carbon (even higher Z)
      nucleusIntensity: 1.0
    }
  ],
  waveEmitters: [
    {
      id: 'emit-multi-1',
      position: [-80, 0, 0],
      frequency: 7200,
      amplitude: 1.2,
      wavelength: 50
    }
  ],
  simulationParams: {
    timeDilation: 1.0,
    fieldStrength: 1.0,
    gravityStrength: 1.0,
    waveSpeedMultiplier: 1.0
  }
};

/**
 * Scenario 3: Wave-Orbital Coupling → Particle Generation
 * Tests resonance and particle generation at 2 atoms
 */
export const WAVE_COUPLING = {
  name: 'Wave-Orbital Coupling',
  description: 'Two atoms with wave emitter between them triggering particle generation',
  timestamp: new Date().toISOString(),
  atoms: [
    {
      id: 'atom-coupling-1',
      orbital_name: '2p',
      orbital: { n: 2, l: 1, m: 0 },
      position: [-60, 0, 0],
      orbitalAmplitude: 1.0,
      orbitalFrequency: 5.5e14,
      orbitalIntensity: 1.2,
      nucleusAmplitude: 0.5,
      nucleusFrequency: 3.29e15,
      nucleusIntensity: 1.5
    },
    {
      id: 'atom-coupling-2',
      orbital_name: '2p',
      orbital: { n: 2, l: 1, m: 0 },
      position: [60, 0, 0],
      orbitalAmplitude: 1.0,
      orbitalFrequency: 5.5e14,
      orbitalIntensity: 1.2,
      nucleusAmplitude: 0.5,
      nucleusFrequency: 3.29e15,
      nucleusIntensity: 1.5
    }
  ],
  waveEmitters: [
    {
      id: 'emit-coupling',
      position: [0, 0, 0],           // Between atoms
      frequency: 7000,                // Resonant for H
      amplitude: 0.8,
      wavelength: 50
    }
  ],
  simulationParams: {
    timeDilation: 1.0,
    fieldStrength: 1.2,              // Increased for stronger coupling
    gravityStrength: 0.9,
    waveSpeedMultiplier: 1.1
  }
};

/**
 * Scenario 4: Frequency-Dependent Particle Generation
 * Tests that higher frequencies generate more particles
 */
export const FREQUENCY_SWEEP = {
  name: 'Frequency Sweep',
  description: 'Carbon atom with variable frequency emitters for resonance testing',
  timestamp: new Date().toISOString(),
  atoms: [
    {
      id: 'demo-c-resonance',
      orbital_name: '2p',
      orbital: { n: 2, l: 1, m: 0 },
      position: [0, 0, 0],
      orbitalAmplitude: 1.2,
      orbitalFrequency: 6.5e14,
      orbitalIntensity: 1.2,
      nucleusAmplitude: 0.5,
      nucleusFrequency: 1.22e16,
      nucleusIntensity: 1.5
    }
  ],
  waveEmitters: [
    {
      id: 'emit-freq-low',
      position: [0, 0, 0],
      frequency: 4000,                // Low frequency
      amplitude: 0.5,
      wavelength: 75
    },
    {
      id: 'emit-freq-resonant',
      position: [0, 0, 0],
      frequency: 7000,                // More resonant
      amplitude: 0.5,
      wavelength: 50
    }
  ],
  simulationParams: {
    timeDilation: 1.0,
    fieldStrength: 1.0,
    gravityStrength: 1.0,
    waveSpeedMultiplier: 1.0
  }
};

/**
 * Scenario 5: Long-Range Wave Propagation Through Metric Tensor
 * Tests 4D wave propagation via spacetime metric
 */
export const LONG_RANGE = {
  name: 'Long-Range Propagation',
  description: 'Spatially separated atoms testing wave propagation through metric tensor',
  timestamp: new Date().toISOString(),
  atoms: [
    {
      id: 'wave-src',
      orbital_name: '1s',
      orbital: { n: 1, l: 0, m: 0 },
      position: [-150, 0, 0],
      orbitalAmplitude: 1.2,
      orbitalFrequency: 5.5e14,
      orbitalIntensity: 1.0,
      nucleusAmplitude: 0.4,
      nucleusFrequency: 3.29e15,
      nucleusIntensity: 1.2
    },
    {
      id: 'wave-dst',
      orbital_name: '1s',
      orbital: { n: 1, l: 0, m: 0 },
      position: [150, 0, 0],         // 300 units distant
      orbitalAmplitude: 1.0,
      orbitalFrequency: 5.5e14,
      orbitalIntensity: 1.0,
      nucleusAmplitude: 0.3,
      nucleusFrequency: 3.29e15,
      nucleusIntensity: 1.0
    }
  ],
  waveEmitters: [
    {
      id: 'emit-long-range',
      position: [-150, 0, 0],        // At source
      frequency: 6500,
      amplitude: 1.0,
      wavelength: 50
    }
  ],
  simulationParams: {
    timeDilation: 1.0,
    fieldStrength: 0.9,              // Slightly reduced for metric effects
    gravityStrength: 1.0,
    waveSpeedMultiplier: 0.95        // Reduced for propagation delay simulation
  }
};

/**
 * Scenario 6: Amplitude Falloff with Distance
 * Tests metric tensor-based falloff: 3 atoms at increasing distances
 */
export const AMPLITUDE_FALLOFF = {
  name: 'Amplitude Falloff Test',
  description: 'Three atoms at 50, 100, 150 unit distances measuring wave attenuation',
  timestamp: new Date().toISOString(),
  atoms: [
    {
      id: 'dist-50',
      orbital_name: '2s',
      orbital: { n: 2, l: 0, m: 0 },
      position: [50, 0, 0],
      orbitalAmplitude: 1.0,
      orbitalFrequency: 5.5e14,
      orbitalIntensity: 1.0,
      nucleusAmplitude: 0.3,
      nucleusFrequency: 5.84e15,     // He
      nucleusIntensity: 1.0
    },
    {
      id: 'dist-100',
      orbital_name: '2s',
      orbital: { n: 2, l: 0, m: 0 },
      position: [100, 0, 0],
      orbitalAmplitude: 1.0,
      orbitalFrequency: 5.5e14,
      orbitalIntensity: 1.0,
      nucleusAmplitude: 0.3,
      nucleusFrequency: 5.84e15,
      nucleusIntensity: 1.0
    },
    {
      id: 'dist-150',
      orbital_name: '2s',
      orbital: { n: 2, l: 0, m: 0 },
      position: [150, 0, 0],
      orbitalAmplitude: 1.0,
      orbitalFrequency: 5.5e14,
      orbitalIntensity: 1.0,
      nucleusAmplitude: 0.3,
      nucleusFrequency: 5.84e15,
      nucleusIntensity: 1.0
    }
  ],
  waveEmitters: [
    {
      id: 'emit-falloff',
      position: [0, 0, 0],           // At origin
      frequency: 6000,
      amplitude: 1.0,
      wavelength: 50
    }
  ],
  simulationParams: {
    timeDilation: 1.0,
    fieldStrength: 1.0,
    gravityStrength: 1.0,
    waveSpeedMultiplier: 1.0
  }
};

/**
 * Scenario 7: Multi-Object Resonance Cascade
 * Tests 3-atom resonance cascade with phase coherence
 */
export const RESONANCE_CASCADE = {
  name: 'Resonance Cascade',
  description: '3-atom array in line configuration with resonance cascade propagation',
  timestamp: new Date().toISOString(),
  atoms: [
    {
      id: 'cascade-1',
      orbital_name: '3s',
      orbital: { n: 3, l: 0, m: 0 },
      position: [-80, 0, 0],
      orbitalAmplitude: 0.6,
      orbitalFrequency: 5.5e14,
      orbitalIntensity: 1.0,
      nucleusAmplitude: 0.4,
      nucleusFrequency: 3.09e15,
      nucleusIntensity: 0.8
    },
    {
      id: 'cascade-2',
      orbital_name: '2p',
      orbital: { n: 2, l: 1, m: 0 },
      position: [0, 0, 0],
      orbitalAmplitude: 0.5,
      orbitalFrequency: 5.5e14,
      orbitalIntensity: 1.0,
      nucleusAmplitude: 0.3,
      nucleusFrequency: 3.09e15,
      nucleusIntensity: 0.8
    },
    {
      id: 'cascade-3',
      orbital_name: '2s',
      orbital: { n: 2, l: 0, m: 0 },
      position: [80, 0, 0],
      orbitalAmplitude: 0.5,
      orbitalFrequency: 5.5e14,
      orbitalIntensity: 1.0,
      nucleusAmplitude: 0.3,
      nucleusFrequency: 3.09e15,
      nucleusIntensity: 0.8
    }
  ],
  waveEmitters: [
    {
      id: 'cascade-source',
      position: [-80, 0, 0],         // At first atom
      frequency: 7200,
      amplitude: 1.2,
      wavelength: 50
    }
  ],
  simulationParams: {
    timeDilation: 1.0,
    fieldStrength: 1.2,              // Increased for cascade
    gravityStrength: 1.0,
    waveSpeedMultiplier: 1.1
  }
};

/**
 * Scenario 8: Complex Multi-Frequency System
 * Multiple emitters at different frequencies for advanced testing
 */
export const MULTI_FREQUENCY = {
  name: 'Multi-Frequency System',
  description: 'Multiple atoms with varied nuclear frequencies for complex simulations',
  timestamp: new Date().toISOString(),
  atoms: [
    {
      id: 'mf-h1',
      orbital_name: '2p',
      orbital: { n: 2, l: 1, m: 0 },
      position: [-100, 0, 0],
      orbitalAmplitude: 0.8,
      orbitalFrequency: 5.0e14,
      orbitalIntensity: 1.0,
      nucleusAmplitude: 0.4,
      nucleusFrequency: 3.29e15,     // H
      nucleusIntensity: 1.0
    },
    {
      id: 'mf-he1',
      orbital_name: '2p',
      orbital: { n: 2, l: 1, m: 0 },
      position: [-50, 0, 0],
      orbitalAmplitude: 0.8,
      orbitalFrequency: 5.2e14,
      orbitalIntensity: 1.0,
      nucleusAmplitude: 0.4,
      nucleusFrequency: 5.84e15,     // He
      nucleusIntensity: 1.0
    },
    {
      id: 'mf-c1',
      orbital_name: '2p',
      orbital: { n: 2, l: 1, m: 0 },
      position: [50, 0, 0],
      orbitalAmplitude: 0.8,
      orbitalFrequency: 5.5e14,
      orbitalIntensity: 1.0,
      nucleusAmplitude: 0.4,
      nucleusFrequency: 1.22e16,     // C
      nucleusIntensity: 1.0
    },
    {
      id: 'mf-o1',
      orbital_name: '2p',
      orbital: { n: 2, l: 1, m: 0 },
      position: [100, 0, 0],
      orbitalAmplitude: 0.8,
      orbitalFrequency: 5.8e14,
      orbitalIntensity: 1.0,
      nucleusAmplitude: 0.4,
      nucleusFrequency: 2.04e16,     // O
      nucleusIntensity: 1.0
    }
  ],
  waveEmitters: [
    {
      id: 'emit-mf-low',
      position: [-100, 0, 0],
      frequency: 5000,
      amplitude: 0.7,
      wavelength: 60
    },
    {
      id: 'emit-mf-mid',
      position: [0, 0, 0],
      frequency: 7000,
      amplitude: 0.8,
      wavelength: 50
    },
    {
      id: 'emit-mf-high',
      position: [100, 0, 0],
      frequency: 9000,
      amplitude: 0.7,
      wavelength: 40
    }
  ],
  simulationParams: {
    timeDilation: 1.0,
    fieldStrength: 1.1,
    gravityStrength: 0.95,
    waveSpeedMultiplier: 1.0
  }
};

/**
 * All available demo configurations
 * Indexed by name for quick access
 */
export const DEMO_CONFIGS = {
  HYDROGEN_SIMPLE,
  MULTI_ATOM,
  WAVE_COUPLING,
  FREQUENCY_SWEEP,
  LONG_RANGE,
  AMPLITUDE_FALLOFF,
  RESONANCE_CASCADE,
  MULTI_FREQUENCY
};

/**
 * Get all available demo configuration names
 */
export const getDemoConfigNames = () => {
  return Object.keys(DEMO_CONFIGS);
};

/**
 * Get a specific demo configuration by name
 * @param {string} name - Configuration name
 * @returns {object} Configuration object
 */
export const getDemoConfig = (name) => {
  return DEMO_CONFIGS[name];
};

/**
 * Export demo configuration for use in AtomBuilder
 * Converts to format expected by AtomBuilder component
 * @param {string} configName - Name of demo configuration
 * @returns {object} AtomBuilder-compatible configuration
 */
export const exportAtomBuilderConfig = (configName) => {
  const config = getDemoConfig(configName);
  if (!config) return null;

  return {
    atoms: config.atoms.map(atom => ({
      ...atom,
      frequency: atom.orbitalFrequency,  // For compatibility with older code
      amplitude: atom.orbitalAmplitude
    })),
    simulationParams: config.simulationParams,
    metadata: {
      demoName: config.name,
      description: config.description,
      timestamp: config.timestamp
    }
  };
};

/**
 * Export for physics engine simulation
 * Separates atoms and emitter configurations
 * @param {string} configName
 * @returns {object} Physics engine compatible format
 */
export const exportPhysicsEngineConfig = (configName) => {
  const config = getDemoConfig(configName);
  if (!config) return null;

  return {
    atoms: config.atoms,
    emitters: config.waveEmitters,
    params: config.simulationParams,
    metadata: {
      scenario: config.name,
      description: config.description,
      createdAt: config.timestamp
    }
  };
};

export default DEMO_CONFIGS;
