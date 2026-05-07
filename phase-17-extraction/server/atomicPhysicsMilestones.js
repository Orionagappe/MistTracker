/**
 * Atomic Physics Research Milestones
 * Domain-specific milestone types for atom model validation in Mist physics
 * 
 * Workflow: Theory Definition → Experimental Setup → Data Collection → 
 *           Validation → Model Refinement → Proxy Generation → Prediction
 */

/**
 * Atomic Physics Milestone Types
 * 
 * Each milestone represents a critical checkpoint in validating atom models
 * against scientific definitions within the Mist physics framework.
 */
export const ATOMIC_PHYSICS_MILESTONES = {
  // THEORY & SETUP PHASE
  THEORY_DEFINED: {
    id: 'theory-defined',
    name: 'Theory Defined',
    description: 'Atom model selected with initial parameters',
    phase: 'setup',
    example: 'Hydrogen: Bohr model (n=1,2,3 shells) or QM wavefunction',
    metadata: {
      atomType: 'string (e.g., "Hydrogen", "Helium")',
      modelType: 'string (e.g., "Bohr", "Quantum", "Classical")',
      parameters: 'JSON (orbital_radius, electron_mass, charge, etc.)',
      scientificTarget: 'string (reference model or publication)'
    }
  },

  EXPERIMENTAL_SETUP_COMPLETE: {
    id: 'experimental-setup-complete',
    name: 'Experimental Setup Complete',
    description: 'Atom initialized in Mist physics with boundary conditions',
    phase: 'setup',
    example: 'Hydrogen placed at origin, vacuum boundary conditions set, electron cloud initialized',
    metadata: {
      geometry: 'JSON (spatial bounds, vacuum/material boundaries)',
      initialConditions: 'JSON (electron position/velocity, orbital shape)',
      boundaryConditions: 'string (reflective/absorbing/periodic)',
      gridResolution: 'number (lattice points for wave propagation)'
    }
  },

  // DATA COLLECTION PHASE
  DATA_COLLECTION_START: {
    id: 'data-collection-start',
    name: 'Data Collection Started',
    description: 'Simulation begun to gather atom observables',
    phase: 'collection',
    example: 'Hydrogen simulation running, collecting orbital shapes and wave patterns',
    metadata: {
      simulationSteps: 'number (total integration steps)',
      timeStep: 'number (dt in natural units)',
      observables: 'array (["orbital_radius", "ionization_probability", "wave_amplitude"])'
    }
  },

  DATA_COLLECTION_COMPLETE: {
    id: 'data-collection-complete',
    name: 'Data Collection Complete',
    description: 'Simulation finished, observables extracted',
    phase: 'collection',
    example: 'Collected 10,000 orbital snapshots, extracted energy levels and transition rates',
    metadata: {
      samplesCollected: 'number (snapshots or time points)',
      averageOrbitalRadius: 'number (in Bohr radii)',
      energyLevels: 'array (computed from simulation)',
      transitionRates: 'JSON (state → state probabilities)',
      convergence: 'number (error estimate, 0-1)'
    }
  },

  // VALIDATION PHASE
  VALIDATION_STARTED: {
    id: 'validation-started',
    name: 'Validation Started',
    description: 'Comparing simulated atom properties against scientific definitions',
    phase: 'validation',
    example: 'Checking simulated Bohr radius against 0.53 Ångströms',
    metadata: {
      validationTests: 'array (["bohr_radius", "ionization_energy", "fine_structure"])',
      scienceReference: 'string (NIST, PubMed ID, publication year)'
    }
  },

  VALIDATION_PASSED: {
    id: 'validation-passed',
    name: 'Validation Passed',
    description: 'Atom model matches scientific definitions within tolerance',
    phase: 'validation',
    example: 'Bohr radius matches: simulated 0.531 Å vs reference 0.529 Å (0.4% error)',
    metadata: {
      passedTests: 'array (test names)',
      tolerances: 'JSON (test → acceptable_error_percent)',
      scienceMetrics: 'JSON (ionization_energy_eV, orbital_radius_angstrom, etc.)',
      residualError: 'number (overall model error, 0-1 scale)'
    }
  },

  VALIDATION_FAILED: {
    id: 'validation-failed',
    name: 'Validation Failed',
    description: 'Atom model deviates from scientific definitions',
    phase: 'validation',
    example: 'Ionization energy off by 15% - model parameters need adjustment',
    metadata: {
      failedTests: 'array (test names)',
      residualError: 'number (how far from target)',
      suggestedAdjustments: 'JSON (param → suggested_new_value)',
      failureReason: 'string (analysis of deviation)'
    }
  },

  // REFINEMENT PHASE
  MODEL_PARAMETER_ADJUSTED: {
    id: 'model-parameter-adjusted',
    name: 'Model Parameter Adjusted',
    description: 'Atom model parameters refined based on validation',
    phase: 'refinement',
    example: 'Adjusted electron mass from 1.0 to 0.98 me; adjusted orbital_radius from 0.50 to 0.52 Å',
    metadata: {
      parametersChanged: 'JSON (param_name → {old_value, new_value})',
      adjustmentReason: 'string (e.g., "correct ionization energy")',
      expectedImprovement: 'number (predicted error reduction, %)'
    }
  },

  MODEL_PREDICTION_GENERATED: {
    id: 'model-prediction-generated',
    name: 'Model Prediction Generated',
    description: 'Validated atom model used to predict new properties',
    phase: 'refinement',
    example: 'Predicted transition rates between n=1 and n=2 orbitals',
    metadata: {
      predictions: 'array (predicted observable names)',
      method: 'string ("theory", "proxy", "interpolation")',
      confidence: 'number (0-1)'
    }
  },

  // PROXY GENERATION PHASE
  PROXY_GENERATED: {
    id: 'proxy-generated',
    name: 'Proxy Generated',
    description: 'Fast approximation proxy created for validated atom model',
    phase: 'acceleration',
    example: 'Polynomial proxy for Hydrogen orbital deformation vs wave amplitude',
    metadata: {
      proxyType: 'string ("algebraic", "lookup_table", "neural_network", "geometric_transform")',
      trainedOn: 'number (data points used for training)',
      accuracy: 'number (mean error vs full model, 0-1)',
      speedup: 'number (x times faster than full simulation)',
      validRange: 'string (e.g., "1 < n < 100, E < 100 eV")'
    }
  },

  // PREDICTION & APPLICATION PHASE
  PREDICTION_VALIDATED: {
    id: 'prediction-validated',
    name: 'Prediction Validated',
    description: 'Model predictions confirmed experimentally or via new simulation',
    phase: 'application',
    example: 'Predicted transition rate now experimentally measured, matches prediction',
    metadata: {
      predictionType: 'string (what was predicted)',
      experimentalValue: 'number (observed value)',
      predictedValue: 'number (model predicted value)',
      agreementError: 'number (% difference)'
    }
  },

  ATOM_MODEL_COMPLETE: {
    id: 'atom-model-complete',
    name: 'Atom Model Complete',
    description: 'Atom model fully validated and ready for use in multi-atom systems',
    phase: 'completion',
    example: 'Hydrogen model validated: energy levels, orbitals, transition rates, interactions',
    metadata: {
      atomType: 'string',
      modelVersion: 'string (semantic version)',
      validationCriteria: 'array (all passed tests)',
      proxyAvailable: 'boolean (proxy for fast evaluation)',
      readyForMultiAtom: 'boolean (can be used in molecules/compounds)',
      nextStep: 'string (e.g., "combine with Helium to model water")'
    }
  }
};

/**
 * Atomic Physics Research Session State
 * 
 * Tracks the current state of an atom model within a research workflow
 */
export const ATOMIC_PHYSICS_SESSION_STATE = {
  // Session phases
  PHASES: [
    'theory_definition',
    'experimental_setup',
    'data_collection',
    'validation',
    'refinement',
    'proxy_generation',
    'prediction',
    'completion'
  ],

  // Active atom model info
  ACTIVE_ATOM: {
    type: 'string (e.g., "Hydrogen", "Helium")',
    modelType: 'string (e.g., "Bohr", "Quantum")',
    currentPhase: 'enum (PHASES)',
    validationStatus: 'enum ("untested", "passed", "failed")',
    proxiesGenerated: 'array of proxy IDs',
    parameters: 'JSON (current model parameters)'
  },

  // Iteration history
  ITERATIONS: 'array of {milestone, timestamp, results, adjustments}'
};

/**
 * Milestone Comparison Queries for Atomic Physics
 * 
 * Domain-specific comparisons to understand atom model evolution
 */
export const ATOMIC_PHYSICS_QUERIES = {
  // Convergence tracking
  'has-atom-converged': `
    Compare milestone data_collection_complete results across iterations:
    Does orbital_radius stabilize? Does energy_level match target?
  `,

  // Validation improvement
  'validation-improvement': `
    Between VALIDATION_FAILED and next VALIDATION_PASSED:
    What parameter adjustments were made?
    By how much did residual_error decrease?
  `,

  // Model robustness
  'parameter-sensitivity': `
    From MODEL_PARAMETER_ADJUSTED milestones:
    Which parameters most impact validation?
    Which parameters can be held constant?
  `,

  // Proxy accuracy
  'proxy-fidelity': `
    PROXY_GENERATED vs DATA_COLLECTION_COMPLETE:
    Does proxy accuracy match claimed speedup?
    In what range is proxy most accurate?
  `,

  // Theory evolution
  'theory-trajectory': `
    From THEORY_DEFINED to ATOM_MODEL_COMPLETE:
    How many iterations did convergence take?
    What was the biggest adjustment?
  `
};

/**
 * Example Atomic Physics Workflow
 */
export const EXAMPLE_HYDROGEN_WORKFLOW = `
# Hydrogen Model Validation Workflow

## Session: Hydrogen_Bohr_v2 (April 2026)

### 1. Theory Definition
Milestone: THEORY_DEFINED
- Atom: Hydrogen
- Model: Bohr classical model
- Parameters: 
  - electron_mass: 1.0 me
  - nuclear_charge: +1.0 e
  - Bohr_radius_target: 0.529 Å

### 2. Experimental Setup
Milestone: EXPERIMENTAL_SETUP_COMPLETE
- Placed nucleus at origin
- Electron cloud initialized at n=1 shell
- Grid: 200x200x200 lattice
- Wave boundary: absorbing

### 3. Data Collection
Milestones: DATA_COLLECTION_START → DATA_COLLECTION_COMPLETE
- Simulation ran 50,000 time steps
- Collected orbital snapshots every 10 steps
- Extracted:
  - Average orbital radius: 0.508 Å (3.9% error)
  - Ground state energy: -13.4 eV (vs -13.6 eV target)
  - Convergence: 0.96

### 4. Validation
Milestones: VALIDATION_STARTED → VALIDATION_PASSED
- Passed tests:
  - ✓ Bohr radius: 0.508 Å (within 5% tolerance)
  - ✓ Ionization energy: 13.4 eV (within 2% tolerance)
  - ✓ Ground state probability: matches 1s orbital
- Residual error: 0.04

### 5. Refinement (Iteration 1)
Milestone: MODEL_PARAMETER_ADJUSTED
- Adjusted electron_mass: 1.0 → 0.97 me
- Reason: Better match ionization energy
- Expected improvement: +3%

### 6. Validation (Re-check)
Milestone: VALIDATION_PASSED (second time)
- All tests still pass
- Residual error: 0.038 (improved!)

### 7. Proxy Generation
Milestone: PROXY_GENERATED
- Type: Neural Network (single layer)
- Trained on: 1000 orbital snapshots
- Accuracy: 0.94 (6% error vs full sim)
- Speedup: 25x

### 8. Prediction
Milestone: MODEL_PREDICTION_GENERATED
- Predicted n=1→n=2 transition rate
- Predicted wave emission spectrum

### 9. Completion
Milestone: ATOM_MODEL_COMPLETE
- Status: Ready for H₂ molecule simulation
- Version: hydrogen-bohr-v2.1
- Next: Model Helium, then test H₂

---

## Key Insights from Milestones
- Convergence: 2 data collection runs + 1 parameter adjustment
- Total iterations: 2 (quite efficient!)
- Dominant adjustment: electron_mass (3% change)
- Proxy speedup: 25x enables fast multi-atom predictions
`;

export default {
  ATOMIC_PHYSICS_MILESTONES,
  ATOMIC_PHYSICS_SESSION_STATE,
  ATOMIC_PHYSICS_QUERIES,
  EXAMPLE_HYDROGEN_WORKFLOW
};
