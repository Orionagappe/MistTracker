/**
 * Comprehensive Milestone System for Phases 17-25+
 * Phase 16.1: Verification and Implementation
 * 
 * Defines milestone types across all 6 physics domains
 * Supports: Atomic (17), Subatomic (18), Chemistry (19-20), Materials (21-22),
 *           Astrophysics (23-24), Cosmology (25+)
 */

// ============================================================================
// PHASE 17: ATOMIC PHYSICS (Electron Scale)
// ============================================================================

export const PHASE_17_ATOMIC_MILESTONES = {
  THEORY_DEFINED: {
    id: 'atomic-theory-defined',
    name: 'Theory Defined',
    phase: 17,
    domain: 'Atomic',
    description: 'Atom model selected with initial parameters',
    phase_category: 'theory',
    metadata: {
      atom_type: 'string (H, He, Li, etc.)',
      model_type: 'string (Bohr, Quantum, Classical)',
      parameters: 'JSON (orbital_radius, electron_mass, charge)',
      scientific_target: 'string (NIST reference, publication)'
    },
    validation_rules: {
      required_fields: ['atom_type', 'model_type', 'parameters'],
      atom_types: ['H', 'He', 'Li', 'Be', 'B', 'C', 'N', 'O', 'F', 'Ne', 'Na', 'Mg', 'Al', 'Si', 'P', 'S', 'Cl', 'Ar']
    }
  },

  EXPERIMENTAL_SETUP_COMPLETE: {
    id: 'atomic-experimental-setup-complete',
    name: 'Experimental Setup Complete',
    phase: 17,
    domain: 'Atomic',
    description: 'Atom initialized in Mist physics with boundary conditions',
    phase_category: 'setup',
    metadata: {
      geometry: 'JSON (spatial bounds, boundary types)',
      initial_conditions: 'JSON (electron position/velocity)',
      boundary_conditions: 'string (reflective/absorbing/periodic)',
      grid_resolution: 'number (lattice points)'
    },
    validation_rules: {
      required_fields: ['geometry', 'initial_conditions', 'boundary_conditions']
    }
  },

  DATA_COLLECTION_START: {
    id: 'atomic-data-collection-start',
    name: 'Data Collection Started',
    phase: 17,
    domain: 'Atomic',
    description: 'Simulation begun to gather atom observables',
    phase_category: 'collection',
    metadata: {
      simulation_steps: 'number (total integration steps)',
      time_step: 'number (dt in natural units)',
      observables: 'array (orbital_radius, ionization_probability, wave_amplitude)',
      collection_frequency: 'number (snapshot every N steps)'
    },
    validation_rules: {
      required_fields: ['simulation_steps', 'time_step'],
      observable_count_min: 1
    }
  },

  DATA_COLLECTION_COMPLETE: {
    id: 'atomic-data-collection-complete',
    name: 'Data Collection Complete',
    phase: 17,
    domain: 'Atomic',
    description: 'Simulation finished, observables extracted',
    phase_category: 'collection',
    metadata: {
      samples_collected: 'number (snapshots)',
      average_orbital_radius: 'number (Bohr radii)',
      energy_levels: 'array (computed energies)',
      transition_rates: 'JSON (state transitions)',
      convergence: 'number (error estimate, 0-1)'
    },
    validation_rules: {
      required_fields: ['samples_collected', 'energy_levels', 'convergence'],
      convergence_threshold: 0.95
    }
  },

  VALIDATION_STARTED: {
    id: 'atomic-validation-started',
    name: 'Validation Started',
    phase: 17,
    domain: 'Atomic',
    description: 'Comparing simulated properties against scientific definitions',
    phase_category: 'validation',
    metadata: {
      validation_tests: 'array (test names)',
      science_reference: 'string (NIST, PubMed ID, publication)',
      tolerance_percent: 'number (acceptable error %)'
    },
    validation_rules: {
      required_fields: ['validation_tests', 'science_reference']
    }
  },

  VALIDATION_PASSED: {
    id: 'atomic-validation-passed',
    name: 'Validation Passed',
    phase: 17,
    domain: 'Atomic',
    description: 'Atom model matches scientific definitions within tolerance',
    phase_category: 'validation',
    metadata: {
      passed_tests: 'array (test names)',
      tolerances: 'JSON (test → acceptable_error)',
      science_metrics: 'JSON (ionization_energy_eV, orbital_radius)',
      residual_error: 'number (0-1 scale)'
    },
    validation_rules: {
      required_fields: ['passed_tests', 'residual_error'],
      residual_error_max: 0.1
    }
  },

  VALIDATION_FAILED: {
    id: 'atomic-validation-failed',
    name: 'Validation Failed',
    phase: 17,
    domain: 'Atomic',
    description: 'Atom model deviates from scientific definitions',
    phase_category: 'validation',
    metadata: {
      failed_tests: 'array (test names)',
      residual_error: 'number (deviation magnitude)',
      suggested_adjustments: 'JSON (param → new_value)',
      failure_reason: 'string (analysis)'
    },
    validation_rules: {
      required_fields: ['failed_tests', 'residual_error']
    }
  },

  MODEL_PARAMETER_ADJUSTED: {
    id: 'atomic-model-parameter-adjusted',
    name: 'Model Parameter Adjusted',
    phase: 17,
    domain: 'Atomic',
    description: 'Atom model parameters refined based on validation',
    phase_category: 'refinement',
    metadata: {
      parameters_changed: 'JSON (param → {old_value, new_value})',
      adjustment_reason: 'string (why adjusted)',
      expected_improvement: 'number (predicted error reduction %)'
    },
    validation_rules: {
      required_fields: ['parameters_changed', 'adjustment_reason']
    }
  },

  MODEL_PREDICTION_GENERATED: {
    id: 'atomic-model-prediction-generated',
    name: 'Model Prediction Generated',
    phase: 17,
    domain: 'Atomic',
    description: 'Validated atom model used to predict new properties',
    phase_category: 'refinement',
    metadata: {
      predictions: 'array (predicted observable names)',
      method: 'string (theory, proxy, interpolation)',
      confidence: 'number (0-1)'
    },
    validation_rules: {
      required_fields: ['predictions', 'method', 'confidence']
    }
  },

  PROXY_GENERATED: {
    id: 'atomic-proxy-generated',
    name: 'Proxy Generated',
    phase: 17,
    domain: 'Atomic',
    description: 'Fast approximation proxy created for validated atom',
    phase_category: 'acceleration',
    metadata: {
      proxy_type: 'string (algebraic, lookup_table, neural_network, geometric)',
      trained_on: 'number (data points)',
      accuracy: 'number (mean error, 0-1)',
      speedup: 'number (x times faster)',
      valid_range: 'string (domain restriction)'
    },
    validation_rules: {
      required_fields: ['proxy_type', 'accuracy', 'speedup'],
      accuracy_min: 0.9,
      speedup_min: 10
    }
  },

  PREDICTION_VALIDATED: {
    id: 'atomic-prediction-validated',
    name: 'Prediction Validated',
    phase: 17,
    domain: 'Atomic',
    description: 'Model predictions confirmed experimentally or via fresh simulation',
    phase_category: 'application',
    metadata: {
      prediction_type: 'string (what was predicted)',
      experimental_value: 'number (observed)',
      predicted_value: 'number (model value)',
      agreement_error: 'number (% difference)'
    },
    validation_rules: {
      required_fields: ['prediction_type', 'experimental_value', 'agreement_error'],
      agreement_error_max: 0.05
    }
  },

  ATOM_MODEL_COMPLETE: {
    id: 'atomic-atom-model-complete',
    name: 'Atom Model Complete',
    phase: 17,
    domain: 'Atomic',
    description: 'Atom model fully validated and production-ready',
    phase_category: 'completion',
    metadata: {
      atom_type: 'string',
      model_version: 'string (semantic version)',
      validation_criteria: 'array (all passed tests)',
      proxy_available: 'boolean',
      ready_for_multi_atom: 'boolean',
      next_step: 'string (usage target)'
    },
    validation_rules: {
      required_fields: ['atom_type', 'model_version', 'ready_for_multi_atom']
    }
  }
};

// ============================================================================
// PHASE 18: SUBATOMIC PHYSICS (Quark Scale)
// ============================================================================

export const PHASE_18_SUBATOMIC_MILESTONES = {
  QUARK_MODEL_DEFINED: {
    id: 'subatomic-quark-model-defined',
    name: 'Quark Model Defined',
    phase: 18,
    domain: 'Subatomic',
    description: 'Quark composition model selected for nucleon',
    phase_category: 'theory',
    metadata: {
      nucleon_type: 'string (proton, neutron, hyperon)',
      quark_composition: 'JSON (u, d, s, c, b, t counts)',
      model_type: 'string (constituent_quark, parton, etc.)',
      scientific_reference: 'string (PDG, publication)'
    },
    validation_rules: {
      required_fields: ['nucleon_type', 'quark_composition'],
      nucleon_types: ['proton', 'neutron', 'lambda', 'sigma', 'xi', 'omega']
    }
  },

  NUCLEON_MASS_VERIFIED: {
    id: 'subatomic-nucleon-mass-verified',
    name: 'Nucleon Mass Verified',
    phase: 18,
    domain: 'Subatomic',
    description: 'Quark model produces correct nucleon mass',
    phase_category: 'validation',
    metadata: {
      computed_mass: 'number (MeV)',
      reference_mass: 'number (PDG MeV)',
      error_percent: 'number (%)',
      model_contributions: 'JSON (quark_mass, QCD_binding, etc.)'
    },
    validation_rules: {
      required_fields: ['computed_mass', 'reference_mass', 'error_percent'],
      error_percent_max: 0.1
    }
  },

  FORM_FACTOR_COMPUTED: {
    id: 'subatomic-form-factor-computed',
    name: 'Form Factor Computed',
    phase: 18,
    domain: 'Subatomic',
    description: 'Electromagnetic form factors calculated from quark structure',
    phase_category: 'prediction',
    metadata: {
      form_factor_type: 'string (charge, magnetic, axial)',
      form_factors: 'array (F1, F2, FA values)',
      momentum_range: 'JSON (Q2_min, Q2_max)',
      experimental_data: 'array (comparison values)'
    },
    validation_rules: {
      required_fields: ['form_factor_type', 'form_factors']
    }
  },

  SPIN_STRUCTURE_MAPPED: {
    id: 'subatomic-spin-structure-mapped',
    name: 'Spin Structure Mapped',
    phase: 18,
    domain: 'Subatomic',
    description: 'Quark spin contributions computed',
    phase_category: 'prediction',
    metadata: {
      total_spin: 'number (1/2 for nucleons)',
      quark_spin_contributions: 'JSON (flavor → contribution)',
      gluon_spin_contribution: 'number',
      orbital_angular_momentum: 'number'
    },
    validation_rules: {
      required_fields: ['total_spin', 'quark_spin_contributions']
    }
  },

  HYPERFINE_COUPLING_COMPUTED: {
    id: 'subatomic-hyperfine-coupling-computed',
    name: 'Hyperfine Coupling Computed',
    phase: 18,
    domain: 'Subatomic',
    description: 'Hyperfine splitting predicted from nucleon properties',
    phase_category: 'prediction',
    metadata: {
      computed_coupling: 'number (MHz)',
      experimental_coupling: 'number (MHz)',
      coupling_constant: 'number',
      error_percent: 'number (%)'
    },
    validation_rules: {
      required_fields: ['computed_coupling', 'experimental_coupling']
    }
  },

  PARTON_DISTRIBUTION_GENERATED: {
    id: 'subatomic-parton-distribution-generated',
    name: 'Parton Distribution Generated',
    phase: 18,
    domain: 'Subatomic',
    description: 'Parton distribution functions (PDFs) computed',
    phase_category: 'acceleration',
    metadata: {
      pdf_type: 'string (quark_u, quark_d, gluon, etc.)',
      x_range: 'array (Bjorken x values)',
      q2_range: 'array (momentum transfer squared)',
      moments_computed: 'array (n-th moment values)'
    },
    validation_rules: {
      required_fields: ['pdf_type', 'x_range', 'q2_range']
    }
  },

  NUCLEON_MODEL_COMPLETE: {
    id: 'subatomic-nucleon-model-complete',
    name: 'Nucleon Model Complete',
    phase: 18,
    domain: 'Subatomic',
    description: 'Nucleon model fully validated, ready for nuclear scale',
    phase_category: 'completion',
    metadata: {
      nucleon_type: 'string',
      model_version: 'string',
      validated_properties: 'array (mass, magnetic_moment, form_factors, etc.)',
      next_scale: 'string (nuclear physics - deuteron, helium, etc.)'
    },
    validation_rules: {
      required_fields: ['nucleon_type', 'model_version', 'validated_properties']
    }
  },

  QUARK_GLUON_INTERACTION_VERIFIED: {
    id: 'subatomic-quark-gluon-interaction-verified',
    name: 'Quark-Gluon Interaction Verified',
    phase: 18,
    domain: 'Subatomic',
    description: 'QCD running coupling verified against data',
    phase_category: 'validation',
    metadata: {
      alpha_s_values: 'array (at different Q2 scales)',
      reference_values: 'array (PDG values)',
      running_behavior: 'JSON (coupling_evolution)',
      error_percent: 'number (%)'
    },
    validation_rules: {
      required_fields: ['alpha_s_values', 'reference_values']
    }
  }
};

// ============================================================================
// PHASE 19-20: CHEMISTRY (Molecular Scale)
// ============================================================================

export const PHASE_19_20_CHEMISTRY_MILESTONES = {
  BONDING_TYPE_DEFINED: {
    id: 'chemistry-bonding-type-defined',
    name: 'Bonding Type Defined',
    phase: 19,
    domain: 'Chemistry',
    description: 'Chemical bond type selected (covalent, ionic, metallic, etc.)',
    phase_category: 'theory',
    metadata: {
      molecule: 'string (e.g., "H2", "H2O", "NaCl")',
      bonding_type: 'string (covalent, ionic, metallic, van_der_waals)',
      atoms_involved: 'array (atomic composition)',
      theoretical_model: 'string (HF, DFT, post-HF)'
    },
    validation_rules: {
      required_fields: ['molecule', 'bonding_type', 'atoms_involved']
    }
  },

  ORBITAL_OVERLAP_COMPUTED: {
    id: 'chemistry-orbital-overlap-computed',
    name: 'Orbital Overlap Computed',
    phase: 19,
    domain: 'Chemistry',
    description: 'Electron orbital overlaps calculated for bond formation',
    phase_category: 'prediction',
    metadata: {
      overlap_integrals: 'array (S_ab values)',
      bonding_orbitals: 'array (MO descriptions)',
      molecular_geometry: 'JSON (bond_lengths, angles)',
      hybridization: 'string (sp, sp2, sp3, etc.)'
    },
    validation_rules: {
      required_fields: ['overlap_integrals', 'bonding_orbitals']
    }
  },

  BOND_ENERGY_VERIFIED: {
    id: 'chemistry-bond-energy-verified',
    name: 'Bond Energy Verified',
    phase: 19,
    domain: 'Chemistry',
    description: 'Computed bond dissociation energy matches experimental',
    phase_category: 'validation',
    metadata: {
      computed_energy: 'number (eV)',
      experimental_energy: 'number (eV)',
      error_percent: 'number (%)',
      bond_order: 'number (1, 1.5, 2, 3)'
    },
    validation_rules: {
      required_fields: ['computed_energy', 'experimental_energy'],
      error_percent_max: 0.05
    }
  },

  REACTION_PRODUCT_VERIFIED: {
    id: 'chemistry-reaction-product-verified',
    name: 'Reaction Product Verified',
    phase: 19,
    domain: 'Chemistry',
    description: 'Chemical reaction prediction validated',
    phase_category: 'validation',
    metadata: {
      reaction_equation: 'string (e.g., "H2 + O2 → H2O")',
      predicted_products: 'array (products)',
      experimental_products: 'array (observed)',
      reaction_energy: 'number (kcal/mol)',
      barrier_height: 'number (eV)'
    },
    validation_rules: {
      required_fields: ['reaction_equation', 'predicted_products']
    }
  },

  SPECTROSCOPIC_DATA_MATCHED: {
    id: 'chemistry-spectroscopic-data-matched',
    name: 'Spectroscopic Data Matched',
    phase: 19,
    domain: 'Chemistry',
    description: 'Computed IR/UV/NMR spectra match experimental',
    phase_category: 'validation',
    metadata: {
      spectrum_type: 'string (IR, UV-Vis, NMR, Raman)',
      computed_peaks: 'array (frequencies or shifts)',
      experimental_peaks: 'array (observed)',
      peak_intensities: 'array (relative intensities)',
      assignments: 'JSON (peak → mode)'
    },
    validation_rules: {
      required_fields: ['spectrum_type', 'computed_peaks', 'experimental_peaks']
    }
  },

  THERMODYNAMIC_PROPERTIES_COMPUTED: {
    id: 'chemistry-thermodynamic-properties-computed',
    name: 'Thermodynamic Properties Computed',
    phase: 19,
    domain: 'Chemistry',
    description: 'Enthalpy, entropy, Gibbs free energy computed',
    phase_category: 'prediction',
    metadata: {
      enthalpy: 'number (kJ/mol)',
      entropy: 'number (J/mol·K)',
      gibbs_free_energy: 'number (kJ/mol)',
      temperature_range: 'JSON (T_min, T_max)',
      phase_transitions: 'array (melting, boiling points)'
    },
    validation_rules: {
      required_fields: ['enthalpy', 'entropy', 'gibbs_free_energy']
    }
  },

  MOLECULAR_MODEL_COMPLETE: {
    id: 'chemistry-molecular-model-complete',
    name: 'Molecular Model Complete',
    phase: 20,
    domain: 'Chemistry',
    description: 'Molecular model fully validated, ready for materials scale',
    phase_category: 'completion',
    metadata: {
      molecule: 'string',
      model_version: 'string',
      validated_properties: 'array (structure, energy, spectra, reactions)',
      next_scale: 'string (crystal/material formation)'
    },
    validation_rules: {
      required_fields: ['molecule', 'model_version', 'validated_properties']
    }
  },

  QUANTUM_YIELD_VERIFIED: {
    id: 'chemistry-quantum-yield-verified',
    name: 'Quantum Yield Verified',
    phase: 20,
    domain: 'Chemistry',
    description: 'Photochemical quantum yield predicted correctly',
    phase_category: 'validation',
    metadata: {
      process: 'string (photosynthesis, photodissociation, etc.)',
      computed_yield: 'number (0-1)',
      experimental_yield: 'number (0-1)',
      wavelength: 'number (nm)',
      error_percent: 'number (%)'
    },
    validation_rules: {
      required_fields: ['process', 'computed_yield', 'experimental_yield']
    }
  },

  REACTION_MECHANISM_ELUCIDATED: {
    id: 'chemistry-reaction-mechanism-elucidated',
    name: 'Reaction Mechanism Elucidated',
    phase: 20,
    domain: 'Chemistry',
    description: 'Multi-step reaction mechanism with intermediates predicted',
    phase_category: 'prediction',
    metadata: {
      reaction: 'string (reaction description)',
      steps: 'array (elementary steps)',
      intermediates: 'array (identified species)',
      transition_states: 'array (TS geometries and energies)',
      rate_limiting_step: 'string'
    },
    validation_rules: {
      required_fields: ['reaction', 'steps', 'transition_states']
    }
  }
};

// ============================================================================
// PHASE 21-22: MATERIALS SCIENCE (Crystal Scale)
// ============================================================================

export const PHASE_21_22_MATERIALS_MILESTONES = {
  CRYSTAL_STRUCTURE_VERIFIED: {
    id: 'materials-crystal-structure-verified',
    name: 'Crystal Structure Verified',
    phase: 21,
    domain: 'Materials',
    description: 'Computed crystal structure matches experimental',
    phase_category: 'validation',
    metadata: {
      material: 'string (e.g., "NaCl", "Diamond", "Fe-BCC")',
      crystal_system: 'string (cubic, tetragonal, etc.)',
      lattice_parameters: 'JSON (a, b, c, angles)',
      computed_parameters: 'JSON',
      experimental_parameters: 'JSON',
      error_percent: 'number (%)'
    },
    validation_rules: {
      required_fields: ['material', 'crystal_system', 'computed_parameters'],
      error_percent_max: 0.02
    }
  },

  BAND_STRUCTURE_MAPPED: {
    id: 'materials-band-structure-mapped',
    name: 'Band Structure Mapped',
    phase: 21,
    domain: 'Materials',
    description: 'Electronic band structure computed and mapped',
    phase_category: 'prediction',
    metadata: {
      material: 'string',
      band_gap: 'number (eV)',
      band_structure_points: 'JSON (high_symmetry_k_points)',
      effective_masses: 'JSON (electron, hole)',
      band_character: 'string (s, p, d, f dominated)'
    },
    validation_rules: {
      required_fields: ['material', 'band_gap', 'band_structure_points']
    }
  },

  DENSITY_OF_STATES_COMPUTED: {
    id: 'materials-density-of-states-computed',
    name: 'Density of States Computed',
    phase: 21,
    domain: 'Materials',
    description: 'Total and partial density of states calculated',
    phase_category: 'prediction',
    metadata: {
      material: 'string',
      dos_type: 'string (total, partial, angular)',
      energy_range: 'JSON (E_min, E_max)',
      fermi_level: 'number (eV)',
      dos_values: 'array (density values)'
    },
    validation_rules: {
      required_fields: ['material', 'dos_type', 'fermi_level']
    }
  },

  ELASTIC_PROPERTIES_VERIFIED: {
    id: 'materials-elastic-properties-verified',
    name: 'Elastic Properties Verified',
    phase: 21,
    domain: 'Materials',
    description: 'Elastic constants and moduli computed correctly',
    phase_category: 'validation',
    metadata: {
      material: 'string',
      elastic_constants: 'JSON (C11, C12, C44, etc.)',
      bulk_modulus: 'number (GPa)',
      shear_modulus: 'number (GPa)',
      computed_values: 'JSON',
      experimental_values: 'JSON',
      error_percent: 'number (%)'
    },
    validation_rules: {
      required_fields: ['material', 'elastic_constants', 'bulk_modulus']
    }
  },

  THERMAL_PROPERTIES_PREDICTED: {
    id: 'materials-thermal-properties-predicted',
    name: 'Thermal Properties Predicted',
    phase: 21,
    domain: 'Materials',
    description: 'Thermal conductivity, heat capacity computed',
    phase_category: 'prediction',
    metadata: {
      material: 'string',
      thermal_conductivity: 'number (W/m·K)',
      heat_capacity: 'number (J/kg·K)',
      debye_temperature: 'number (K)',
      temperature_range: 'JSON (T_min, T_max)'
    },
    validation_rules: {
      required_fields: ['material', 'thermal_conductivity', 'debye_temperature']
    }
  },

  OPTICAL_PROPERTIES_VERIFIED: {
    id: 'materials-optical-properties-verified',
    name: 'Optical Properties Verified',
    phase: 22,
    domain: 'Materials',
    description: 'Refractive index, absorption spectra match experimental',
    phase_category: 'validation',
    metadata: {
      material: 'string',
      refractive_index: 'number (real part)',
      extinction_coefficient: 'number (imaginary part)',
      wavelength_range: 'JSON (lambda_min, lambda_max)',
      bandgap_energy: 'number (eV)',
      error_percent: 'number (%)'
    },
    validation_rules: {
      required_fields: ['material', 'refractive_index', 'wavelength_range']
    }
  },

  DEFECT_STRUCTURE_ANALYZED: {
    id: 'materials-defect-structure-analyzed',
    name: 'Defect Structure Analyzed',
    phase: 22,
    domain: 'Materials',
    description: 'Point and line defects characterized',
    phase_category: 'prediction',
    metadata: {
      material: 'string',
      defect_types: 'array (vacancy, interstitial, dislocation)',
      formation_energies: 'JSON (type → energy)',
      migration_barriers: 'JSON (type → barrier)',
      equilibrium_concentration: 'JSON (type → concentration)'
    },
    validation_rules: {
      required_fields: ['material', 'defect_types', 'formation_energies']
    }
  },

  MATERIAL_MODEL_COMPLETE: {
    id: 'materials-material-model-complete',
    name: 'Material Model Complete',
    phase: 22,
    domain: 'Materials',
    description: 'Material model fully characterized, ready for astrophysics',
    phase_category: 'completion',
    metadata: {
      material: 'string',
      model_version: 'string',
      validated_properties: 'array (structure, band, elastic, thermal, optical)',
      next_scale: 'string (stellar material composition)'
    },
    validation_rules: {
      required_fields: ['material', 'model_version', 'validated_properties']
    }
  }
};

// ============================================================================
// PHASE 23-24: ASTROPHYSICS (Stellar Scale)
// ============================================================================

export const PHASE_23_24_ASTROPHYSICS_MILESTONES = {
  PLASMA_MODEL_DEFINED: {
    id: 'astrophysics-plasma-model-defined',
    name: 'Plasma Model Defined',
    phase: 23,
    domain: 'Astrophysics',
    description: 'Stellar plasma physics model selected',
    phase_category: 'theory',
    metadata: {
      star_type: 'string (Main-Sequence, Red-Giant, etc.)',
      plasma_composition: 'JSON (H, He, heavier elements %)',
      temperature_range: 'JSON (core, surface)',
      pressure_regime: 'string (non-relativistic, degenerate, relativistic)'
    },
    validation_rules: {
      required_fields: ['star_type', 'plasma_composition', 'temperature_range']
    }
  },

  FUSION_MODEL_VERIFIED: {
    id: 'astrophysics-fusion-model-verified',
    name: 'Fusion Model Verified',
    phase: 23,
    domain: 'Astrophysics',
    description: 'Nuclear fusion rate correctly predicted',
    phase_category: 'validation',
    metadata: {
      fusion_chain: 'string (pp_chain, CNO_cycle, etc.)',
      computed_power: 'number (solar luminosities)',
      observed_power: 'number (solar luminosities)',
      reaction_rates: 'JSON (chain → rate)',
      error_percent: 'number (%)'
    },
    validation_rules: {
      required_fields: ['fusion_chain', 'computed_power', 'observed_power'],
      error_percent_max: 0.1
    }
  },

  STELLAR_EVOLUTION_MODELED: {
    id: 'astrophysics-stellar-evolution-modeled',
    name: 'Stellar Evolution Modeled',
    phase: 23,
    domain: 'Astrophysics',
    description: 'Star evolution track (HR diagram) accurately computed',
    phase_category: 'prediction',
    metadata: {
      mass: 'number (solar masses)',
      metallicity: 'number (Z)',
      age: 'number (Gyr)',
      hr_track: 'array (Teff, Lbol points)',
      lifetimes: 'JSON (main_sequence, red_giant, etc.)'
    },
    validation_rules: {
      required_fields: ['mass', 'metallicity', 'hr_track']
    }
  },

  OPACITY_TABLE_GENERATED: {
    id: 'astrophysics-opacity-table-generated',
    name: 'Opacity Table Generated',
    phase: 23,
    domain: 'Astrophysics',
    description: 'Radiative opacity computed across stellar conditions',
    phase_category: 'acceleration',
    metadata: {
      opacity_type: 'string (radiative, conductive, etc.)',
      temperature_points: 'array (K)',
      density_points: 'array (g/cm³)',
      composition: 'JSON (H, He, Z fractions)',
      opacity_values: 'array (cm²/g)'
    },
    validation_rules: {
      required_fields: ['opacity_type', 'temperature_points', 'density_points']
    }
  },

  CONVECTION_ZONE_CHARACTERIZED: {
    id: 'astrophysics-convection-zone-characterized',
    name: 'Convection Zone Characterized',
    phase: 23,
    domain: 'Astrophysics',
    description: 'Convective zones identified and modeled',
    phase_category: 'prediction',
    metadata: {
      convection_zones: 'array (radial location)',
      mixing_length: 'number (scale height ratio)',
      overshoot_distance: 'number (scale heights)',
      convective_velocity: 'number (km/s)',
      superadiabaticity: 'number'
    },
    validation_rules: {
      required_fields: ['convection_zones', 'mixing_length']
    }
  },

  SURFACE_COMPOSITION_VERIFIED: {
    id: 'astrophysics-surface-composition-verified',
    name: 'Surface Composition Verified',
    phase: 24,
    domain: 'Astrophysics',
    description: 'Spectroscopic abundances match models',
    phase_category: 'validation',
    metadata: {
      star_name: 'string',
      element_abundances: 'JSON (element → log10 relative to H)',
      computed_abundances: 'JSON',
      observed_abundances: 'JSON',
      error_percent: 'number (%)'
    },
    validation_rules: {
      required_fields: ['star_name', 'element_abundances', 'computed_abundances']
    }
  },

  ASTEROSEISMIC_FREQUENCIES_MATCHED: {
    id: 'astrophysics-asteroseismic-frequencies-matched',
    name: 'Asteroseismic Frequencies Matched',
    phase: 24,
    domain: 'Astrophysics',
    description: 'Computed oscillation modes match observations',
    phase_category: 'validation',
    metadata: {
      star_name: 'string',
      numax: 'number (maximum power frequency in μHz)',
      delta_nu: 'number (large frequency separation in μHz)',
      mode_frequencies: 'array (computed)',
      observed_frequencies: 'array (Kepler/TESS)',
      error_percent: 'number (%)'
    },
    validation_rules: {
      required_fields: ['star_name', 'numax', 'delta_nu', 'mode_frequencies']
    }
  },

  STELLAR_MODEL_COMPLETE: {
    id: 'astrophysics-stellar-model-complete',
    name: 'Stellar Model Complete',
    phase: 24,
    domain: 'Astrophysics',
    description: 'Stellar model fully validated, ready for cosmological scale',
    phase_category: 'completion',
    metadata: {
      star_type: 'string',
      model_version: 'string',
      validated_properties: 'array (fusion, evolution, oscillations, composition)',
      next_scale: 'string (galactic star populations, nucleosynthesis)'
    },
    validation_rules: {
      required_fields: ['star_type', 'model_version', 'validated_properties']
    }
  }
};

// ============================================================================
// PHASE 25+: COSMOLOGY (Universe Scale)
// ============================================================================

export const PHASE_25_COSMOLOGY_MILESTONES = {
  BBN_MODEL_DEFINED: {
    id: 'cosmology-bbn-model-defined',
    name: 'BBN Model Defined',
    phase: 25,
    domain: 'Cosmology',
    description: 'Big Bang Nucleosynthesis model selected',
    phase_category: 'theory',
    metadata: {
      bbn_code: 'string (PArthENoPE, AlterBBN, etc.)',
      baryon_density: 'number (Omega_b h²)',
      neutron_lifetime: 'number (seconds)',
      number_of_neutrinos: 'number'
    },
    validation_rules: {
      required_fields: ['bbn_code', 'baryon_density']
    }
  },

  BBN_ABUNDANCES_VERIFIED: {
    id: 'cosmology-bbn-abundances-verified',
    name: 'BBN Abundances Verified',
    phase: 25,
    domain: 'Cosmology',
    description: 'Primordial element abundances match observations',
    phase_category: 'validation',
    metadata: {
      abundances: 'JSON (He-4, D, He-3, Li-7)',
      computed_abundances: 'JSON (mass fractions)',
      observed_abundances: 'JSON (from CMB + observations)',
      measurement_uncertainties: 'JSON (abundances)',
      chi_squared: 'number'
    },
    validation_rules: {
      required_fields: ['abundances', 'computed_abundances', 'observed_abundances']
    }
  },

  RECOMBINATION_EPOCH_MODELED: {
    id: 'cosmology-recombination-epoch-modeled',
    name: 'Recombination Epoch Modeled',
    phase: 25,
    domain: 'Cosmology',
    description: 'Recombination dynamics accurately computed',
    phase_category: 'prediction',
    metadata: {
      ionization_fraction: 'array (z → x_e)',
      redshift_range: 'JSON (z_min, z_max)',
      cmb_temperature_evolution: 'array',
      effective_recombination_redshift: 'number',
      sound_horizon_at_recombination: 'number (Mpc)'
    },
    validation_rules: {
      required_fields: ['ionization_fraction', 'redshift_range']
    }
  },

  CMB_POWER_SPECTRUM_COMPUTED: {
    id: 'cosmology-cmb-power-spectrum-computed',
    name: 'CMB Power Spectrum Computed',
    phase: 25,
    domain: 'Cosmology',
    description: 'CMB power spectrum (TT, EE, TE) correctly predicted',
    phase_category: 'validation',
    metadata: {
      cls_computed: 'array (l, Cl_TT, Cl_EE, Cl_TE)',
      cls_observed: 'array (from Planck/WMAP)',
      multipole_range: 'JSON (l_min, l_max)',
      cosmic_parameters: 'JSON (H0, Omega_m, Omega_Lambda, etc.)',
      chi_squared: 'number'
    },
    validation_rules: {
      required_fields: ['cls_computed', 'cls_observed', 'cosmic_parameters']
    }
  },

  STRUCTURE_FORMATION_MODELED: {
    id: 'cosmology-structure-formation-modeled',
    name: 'Structure Formation Modeled',
    phase: 25,
    domain: 'Cosmology',
    description: 'Structure growth via gravitational instability computed',
    phase_category: 'prediction',
    metadata: {
      growth_factor: 'array (a → D)',
      matter_power_spectrum: 'array (k, P(k))',
      redshift_range: 'JSON (z_min, z_max)',
      nonlinear_scales_identified: 'boolean',
      halo_mass_function: 'array (M, dn/dM)'
    },
    validation_rules: {
      required_fields: ['growth_factor', 'matter_power_spectrum']
    }
  },

  DARK_MATTER_MODEL_TESTED: {
    id: 'cosmology-dark-matter-model-tested',
    name: 'Dark Matter Model Tested',
    phase: 25,
    domain: 'Cosmology',
    description: 'Dark matter model constraints from observations',
    phase_category: 'validation',
    metadata: {
      dm_model: 'string (CDM, WDM, SIDM, etc.)',
      abundance_constraint: 'number (Omega_m h²)',
      structure_constraint: 'JSON (small-scale power)',
      direct_detection_constraints: 'JSON (cross_section_limits)',
      observational_signatures: 'array'
    },
    validation_rules: {
      required_fields: ['dm_model', 'abundance_constraint']
    }
  },

  DARK_ENERGY_EVOLUTION_MAPPED: {
    id: 'cosmology-dark-energy-evolution-mapped',
    name: 'Dark Energy Evolution Mapped',
    phase: 25,
    domain: 'Cosmology',
    description: 'Dark energy equation of state evolution determined',
    phase_category: 'prediction',
    metadata: {
      de_model: 'string (Λ-CDM, w0-wa, quintessence, etc.)',
      w0: 'number (equation of state at z=0)',
      wa: 'number (evolution parameter)',
      redshift_samples: 'array (z)',
      w_evolution: 'array (w(z) values)',
      observational_constraints: 'JSON (SNe, BAO, weak_lensing)'
    },
    validation_rules: {
      required_fields: ['de_model', 'w0', 'redshift_samples']
    }
  },

  COSMOLOGY_MODEL_COMPLETE: {
    id: 'cosmology-cosmology-model-complete',
    name: 'Cosmology Model Complete',
    phase: 25,
    domain: 'Cosmology',
    description: 'Cosmological model fully validated across all scales',
    phase_category: 'completion',
    metadata: {
      model_name: 'string (e.g., "Λ-CDM+Sterile", "Modified-Gravity")',
      model_version: 'string',
      validated_scales: 'array (BBN, CMB, structure, expansion_history)',
      unresolved_issues: 'array (if any)',
      conclusion: 'string (unified physics confirmed or new physics needed)'
    },
    validation_rules: {
      required_fields: ['model_name', 'model_version', 'validated_scales', 'conclusion']
    }
  }
};

// ============================================================================
// CONSOLIDATED MILESTONE REGISTRY
// ============================================================================

export const ALL_PHASE_MILESTONES = {
  17: PHASE_17_ATOMIC_MILESTONES,
  18: PHASE_18_SUBATOMIC_MILESTONES,
  19: PHASE_19_20_CHEMISTRY_MILESTONES,
  20: PHASE_19_20_CHEMISTRY_MILESTONES,
  21: PHASE_21_22_MATERIALS_MILESTONES,
  22: PHASE_21_22_MATERIALS_MILESTONES,
  23: PHASE_23_24_ASTROPHYSICS_MILESTONES,
  24: PHASE_23_24_ASTROPHYSICS_MILESTONES,
  25: PHASE_25_COSMOLOGY_MILESTONES
};

/**
 * Helper function: Get all milestone types for a phase
 */
export function getMilestonesForPhase(phase) {
  return ALL_PHASE_MILESTONES[phase] || {};
}

/**
 * Helper function: Get milestone by ID
 */
export function getMilestoneById(phase, milestoneId) {
  const phaseMilestones = getMilestonesForPhase(phase);
  for (const key in phaseMilestones) {
    if (phaseMilestones[key].id === milestoneId) {
      return phaseMilestones[key];
    }
  }
  return null;
}

/**
 * Helper function: Count total milestones across all phases
 */
export function getTotalMilestoneCount() {
  let count = 0;
  for (const phase in ALL_PHASE_MILESTONES) {
    count += Object.keys(ALL_PHASE_MILESTONES[phase]).length;
  }
  return count;
}

export default {
  ALL_PHASE_MILESTONES,
  getMilestonesForPhase,
  getMilestoneById,
  getTotalMilestoneCount
};
