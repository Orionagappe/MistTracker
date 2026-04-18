/**
 * ORBITALS_CONFIG.js
 * Phase 9.2: Orbital configuration definitions
 * 
 * Defines available electron orbitals (1s, 2s, 2p, 3s, 3p, 3d)
 * with quantum numbers and visual properties
 */

export const ORBITALS_CONFIG = [
  {
    id: '1s',
    name: '1s',
    quantum: { n: 1, l: 0, m: 0, s: -0.5 },
    description: 'Principal quantum n=1, s orbital',
    color: 0xff6b6b,        // Red
    energy: -13.6,          // eV (relative to hydrogen)
    icon: '●',
    size: 0.3,              // Relative size visualization
    category: 'primary'
  },
  {
    id: '2s',
    name: '2s',
    quantum: { n: 2, l: 0, m: 0, s: -0.5 },
    description: 'Principal quantum n=2, s orbital',
    color: 0xffa500,        // Orange
    energy: -3.4,
    icon: '●',
    size: 0.6,
    category: 'secondary'
  },
  {
    id: '2p',
    name: '2p',
    quantum: { n: 2, l: 1, m: 0, s: -0.5 },
    description: 'Principal quantum n=2, p orbital (mₗ=0)',
    color: 0x44dd88,        // Green
    energy: -3.4,
    icon: '◐',
    size: 0.65,
    category: 'secondary'
  },
  {
    id: '3s',
    name: '3s',
    quantum: { n: 3, l: 0, m: 0, s: -0.5 },
    description: 'Principal quantum n=3, s orbital',
    color: 0xffff00,        // Yellow
    energy: -1.51,
    icon: '●',
    size: 0.9,
    category: 'tertiary'
  },
  {
    id: '3p',
    name: '3p',
    quantum: { n: 3, l: 1, m: 0, s: -0.5 },
    description: 'Principal quantum n=3, p orbital (mₗ=0)',
    color: 0x00d9ff,        // Cyan
    energy: -1.51,
    icon: '◐',
    size: 0.95,
    category: 'tertiary'
  },
  {
    id: '3d',
    name: '3d',
    quantum: { n: 3, l: 2, m: 0, s: -0.5 },
    description: 'Principal quantum n=3, d orbital (mₗ=0)',
    color: 0xbe73ff,        // Purple
    energy: -1.51,
    icon: '◊',
    size: 1.0,
    category: 'tertiary'
  }
];

/**
 * Get orbital by ID
 */
export function getOrbitalById(id) {
  return ORBITALS_CONFIG.find(o => o.id === id);
}

/**
 * Get orbital by quantum numbers
 */
export function getOrbitalByQuantum(n, l, m) {
  return ORBITALS_CONFIG.find(o => 
    o.quantum.n === n && 
    o.quantum.l === l && 
    o.quantum.m === m
  );
}

/**
 * Get orbitals by principal quantum number n
 */
export function getOrbitalsByPrincipal(n) {
  return ORBITALS_CONFIG.filter(o => o.quantum.n === n);
}

/**
 * Get orbitals by angular momentum quantum number l
 * l=0: s, l=1: p, l=2: d, l=3: f
 */
export function getOrbitalsByAngularMomentum(l) {
  return ORBITALS_CONFIG.filter(o => o.quantum.l === l);
}

/**
 * Format quantum numbers for display
 */
export function formatQuantumNumbers(quantum) {
  if (!quantum) return '';
  const symbols = {
    0: 's',
    1: 'p',
    2: 'd',
    3: 'f',
    4: 'g'
  };
  const lSymbol = symbols[quantum.l] || '?';
  return `${quantum.n}${lSymbol}`;
}

/**
 * Get orbital energy in eV
 */
export function getOrbitalEnergy(orbital) {
  return orbital?.energy || 0;
}

/**
 * Compare two orbitals for equality
 */
export function compareOrbitals(orbital1, orbital2) {
  if (!orbital1 || !orbital2) return false;
  return (
    orbital1.quantum.n === orbital2.quantum.n &&
    orbital1.quantum.l === orbital2.quantum.l &&
    orbital1.quantum.m === orbital2.quantum.m
  );
}

/**
 * Get orbital transition energy (for decay/excitation)
 */
export function getTransitionEnergy(fromOrbital, toOrbital) {
  if (!fromOrbital || !toOrbital) return 0;
  return Math.abs(toOrbital.energy - fromOrbital.energy);
}

/**
 * Export all orbital data for serialization
 */
export function serializeOrbital(orbital) {
  return {
    id: orbital.id,
    name: orbital.name,
    quantum: orbital.quantum,
    energy: orbital.energy
  };
}

/**
 * Import orbital from serialized data
 */
export function deserializeOrbital(data) {
  if (typeof data === 'string') {
    // Assume it's an ID
    return getOrbitalById(data);
  }
  if (data?.id) {
    return getOrbitalById(data.id);
  }
  // Try to match by quantum numbers
  return getOrbitalByQuantum(data.quantum?.n, data.quantum?.l, data.quantum?.m);
}

export default ORBITALS_CONFIG;
