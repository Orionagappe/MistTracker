/**
 * AtomTypeSystem.js
 * 
 * Defines atomic types with electron configurations, quantum properties,
 * and orbital patterns. Maps timeline categories to atom types.
 * 
 * Features:
 * - Element definitions with electron configurations
 * - Ground state energy levels
 * - Orbital pattern mapping
 * - Timeline category → atom type mapping
 * - Isotope support
 */

import { getElectronConfiguration, getOrbitalName } from './QuantumOrbitals.js';

/**
 * Core element database
 * Includes up to 18 elements (up to Argon)
 */
const ELEMENT_DATABASE = {
  'H': {
    name: 'Hydrogen',
    atomicNumber: 1,
    mass: 1.008,
    electronConfiguration: [[1, 0, 0]],
    groundStateEnergy: -13.6, // eV
    description: 'Simplest atomic system, single electron in 1s orbital'
  },
  'He': {
    name: 'Helium',
    atomicNumber: 2,
    mass: 4.003,
    electronConfiguration: [[1, 0, 0], [1, 0, 0]],
    groundStateEnergy: -24.6,
    description: 'Noble gas, filled 1s shell'
  },
  'Li': {
    name: 'Lithium',
    atomicNumber: 3,
    mass: 6.941,
    electronConfiguration: [[1, 0, 0], [1, 0, 0], [2, 0, 0]],
    groundStateEnergy: -5.39,
    description: 'Alkali metal, single valence electron'
  },
  'Be': {
    name: 'Beryllium',
    atomicNumber: 4,
    mass: 9.012,
    electronConfiguration: [[1, 0, 0], [1, 0, 0], [2, 0, 0], [2, 0, 0]],
    groundStateEnergy: -9.32,
    description: 'Alkaline earth, filled 2s shell'
  },
  'B': {
    name: 'Boron',
    atomicNumber: 5,
    mass: 10.811,
    electronConfiguration: [[1, 0, 0], [1, 0, 0], [2, 0, 0], [2, 0, 0], [2, 1, 0]],
    groundStateEnergy: -8.30,
    description: 'Semimetal, begins p-orbital filling'
  },
  'C': {
    name: 'Carbon',
    atomicNumber: 6,
    mass: 12.011,
    electronConfiguration: [[1, 0, 0], [1, 0, 0], [2, 0, 0], [2, 0, 0], [2, 1, 0], [2, 1, 1]],
    groundStateEnergy: -11.26,
    description: 'Key element for chemistry, 2p² configuration'
  },
  'N': {
    name: 'Nitrogen',
    atomicNumber: 7,
    mass: 14.007,
    electronConfiguration: [
      [1, 0, 0], [1, 0, 0],
      [2, 0, 0], [2, 0, 0],
      [2, 1, 0], [2, 1, 1], [2, 1, -1]
    ],
    groundStateEnergy: -14.53,
    description: 'Atmospheric element, half-filled 2p shell'
  },
  'O': {
    name: 'Oxygen',
    atomicNumber: 8,
    mass: 15.999,
    electronConfiguration: [
      [1, 0, 0], [1, 0, 0],
      [2, 0, 0], [2, 0, 0],
      [2, 1, 0], [2, 1, 1], [2, 1, -1], [2, 1, 0]
    ],
    groundStateEnergy: -13.61,
    description: 'Highly reactive, 2p⁴ configuration'
  },
  'F': {
    name: 'Fluorine',
    atomicNumber: 9,
    mass: 18.998,
    electronConfiguration: [
      [1, 0, 0], [1, 0, 0],
      [2, 0, 0], [2, 0, 0],
      [2, 1, 0], [2, 1, 1], [2, 1, -1], [2, 1, 1], [2, 1, -1]
    ],
    groundStateEnergy: -17.42,
    description: 'Most electronegative element, 2p⁵'
  },
  'Ne': {
    name: 'Neon',
    atomicNumber: 10,
    mass: 20.180,
    electronConfiguration: [
      [1, 0, 0], [1, 0, 0],
      [2, 0, 0], [2, 0, 0],
      [2, 1, 0], [2, 1, 1], [2, 1, -1], [2, 1, 1], [2, 1, -1], [2, 1, 0]
    ],
    groundStateEnergy: -21.56,
    description: 'Noble gas, filled 2p shell'
  }
};

/**
 * Molecular definitions
 * Simple diatomic and triatomic molecules
 */
const MOLECULE_DATABASE = {
  'H2': {
    name: 'Hydrogen mol',
    atoms: [{ type: 'H', position: [-0.5, 0, 0] }, { type: 'H', position: [0.5, 0, 0] }],
    bondLength: 0.74, // Angstroms
    description: 'Diatomic hydrogen molecule'
  },
  'H2O': {
    name: 'Water',
    atoms: [
      { type: 'O', position: [0, 0, 0] },
      { type: 'H', position: [0.96, 0, 0] },
      { type: 'H', position: [-0.24, 0.93, 0] }
    ],
    bondLength: 0.96,
    description: 'Triatomic water molecule'
  },
  'CO2': {
    name: 'Carbon dioxide',
    atoms: [
      { type: 'C', position: [0, 0, 0] },
      { type: 'O', position: [-1.16, 0, 0] },
      { type: 'O', position: [1.16, 0, 0] }
    ],
    bondLength: 1.16,
    description: 'Linear triatomic molecule'
  }
};

/**
 * Timeline category → atom type mapping rules
 * Supports regex patterns and exact matches
 */
const CATEGORY_MAPPING = {
  // Exact matches
  'Hydrogen': 'H',
  'Helium': 'He',
  'Carbon': 'C',
  'Nitrogen': 'N',
  'Oxygen': 'O',
  'Fluorine': 'F',
  'Neon': 'Ne',
  'Lithium': 'Li',
  'Beryllium': 'Be',
  'Boron': 'B',
  
  // Regex patterns (for more flexible matching)
  // e.g., "Hydrogen.*" matches "Hydrogen atom", "Hydrogen ion"
};

/**
 * Get atom type definition from element symbol
 * 
 * @param {string} symbol - Element symbol (e.g., 'H', 'C', 'O')
 * @returns {Object|null} Atom type definition or null if not found
 */
export function getAtomType(symbol) {
  return ELEMENT_DATABASE[symbol.toUpperCase()] || null;
}

/**
 * Get molecule definition from formula
 * 
 * @param {string} formula - Molecule formula (e.g., 'H2', 'H2O')
 * @returns {Object|null} Molecule definition or null if not found
 */
export function getMoleculeType(formula) {
  return MOLECULE_DATABASE[formula] || null;
}

/**
 * Map timeline category/item to atom type
 * Uses category mapping rules to determine atom type
 * 
 * @param {string} category - Timeline category name
 * @param {string} item - Optional timeline item value
 * @returns {Object|null} Atom type definition or null if no match
 */
export function mapCategoryToAtomType(category, item = null) {
  // First check exact matches
  if (CATEGORY_MAPPING[category]) {
    return getAtomType(CATEGORY_MAPPING[category]);
  }
  
  // Check item value
  if (item && CATEGORY_MAPPING[item]) {
    return getAtomType(CATEGORY_MAPPING[item]);
  }
  
  // Check regex patterns
  for (const [pattern, symbol] of Object.entries(CATEGORY_MAPPING)) {
    if (pattern.includes('.*') || pattern.includes('.*')) {
      try {
        const regex = new RegExp(pattern);
        if (regex.test(category) || regex.test(item)) {
          return getAtomType(symbol);
        }
      } catch (e) {
        // Invalid regex, skip
      }
    }
  }
  
  // Default: try to match item value directly as element symbol
  if (item) {
    const type = getAtomType(item);
    if (type) return type;
  }
  
  return null;
}

/**
 * Get electron orbital configuration for timeline object
 * 
 * @param {Object} timelineObject - Object with category and item properties
 * @returns {Object} Configuration including atoms and electron clouds
 */
export function getObjectPhysicsConfiguration(timelineObject) {
  const { category, value } = timelineObject;
  
  // Try to map to atom type
  const atomType = mapCategoryToAtomType(category, value);
  
  if (!atomType) {
    // Default: treat as neutral particle
    return {
      type: 'unknown',
      atoms: [],
      electronClouds: [],
      description: `Unknown type: ${category} / ${value}`
    };
  }
  
  // Generate electron clouds from configuration
  const electronClouds = atomType.electronConfiguration.map((config, idx) => {
    const [n, l, m] = config;
    return {
      id: `electron-${idx}`,
      orbitalState: { n, l, m },
      amplitude: 1.0,
      phase: 0,
      energy: getOrbitalEnergy(n, atomType.atomicNumber),
      position: [0, 0, 0],
      velocity: [0, 0, 0]
    };
  });
  
  return {
    type: 'atom',
    name: atomType.name,
    symbol: Object.entries(ELEMENT_DATABASE).find(([k, v]) => v === atomType)?.[0],
    atomicNumber: atomType.atomicNumber,
    mass: atomType.mass,
    atoms: [atomType],
    electronClouds,
    groundStateEnergy: atomType.groundStateEnergy,
    description: atomType.description,
    sourceTimeline: { category, value }
  };
}

/**
 * Calculate orbital energy for hydrogen-like atom
 * E_n = -13.6 eV × (Z/n)²
 * 
 * @param {number} n - Principal quantum number
 * @param {number} Z - Nuclear charge (atomic number)
 * @returns {number} Energy in eV
 */
export function getOrbitalEnergy(n, Z = 1) {
  const rydbergEnergy = 13.6; // eV
  return -(rydbergEnergy * Z * Z) / (n * n);
}

/**
 * Get all available atom types (for UI dropdowns, etc.)
 * 
 * @returns {Array} Array of {symbol, name, description}
 */
export function getAllAtomTypes() {
  return Object.entries(ELEMENT_DATABASE).map(([symbol, data]) => ({
    symbol,
    name: data.name,
    description: data.description,
    atomicNumber: data.atomicNumber
  }));
}

/**
 * Register custom category mapping rule
 * 
 * @param {string} pattern - Pattern to match (can include regex)
 * @param {string} atomSymbol - Element symbol to map to
 */
export function registerCategoryMapping(pattern, atomSymbol) {
  if (!getAtomType(atomSymbol)) {
    console.warn(`Atom symbol "${atomSymbol}" not found in database`);
    return false;
  }
  CATEGORY_MAPPING[pattern] = atomSymbol;
  return true;
}

/**
 * Add custom element to database
 * 
 * @param {string} symbol - Element symbol
 * @param {Object} definition - Element definition
 */
export function registerElement(symbol, definition) {
  ELEMENT_DATABASE[symbol.toUpperCase()] = {
    ...definition,
    electronConfiguration: definition.electronConfiguration || []
  };
}

/**
 * Export database for inspection/debugging
 */
export const DATABASE = {
  elements: ELEMENT_DATABASE,
  molecules: MOLECULE_DATABASE,
  categories: CATEGORY_MAPPING
};
