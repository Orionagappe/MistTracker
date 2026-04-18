/**
 * QuantumOrbitals.js
 * 
 * Library for generating quantum electron orbital probability densities.
 * Implements hydrogen-like wavefunctions: ψ_nlm(r, θ, φ) = R_nl(r) × Y_lm(θ, φ)
 * 
 * Features:
 * - Radial wavefunctions R_nl(r) for all (n, l) combinations
 * - Spherical harmonics Y_lm(θ, φ) for angular components
 * - Probability density generation: |ψ|² 
 * - 3D point cloud generation for visualization
 * - Pre-computed orbital shapes (1s, 2s, 2p, 3s, 3p, 3d)
 */

/**
 * Radial wavefunction component R_nl(r)
 * Laguerre polynomial-based solutions for hydrogen-like atoms
 * 
 * @param {number} n - Principal quantum number (n >= 1)
 * @param {number} l - Orbital angular momentum (0 <= l < n)
 * @param {number} r - Radial distance (in Bohr radii)
 * @param {number} Z - Effective nuclear charge (default: 1 for hydrogen)
 * @returns {number} R_nl(r)
 */
export function radialWavefunction(n, l, r, Z = 1) {
  const a0 = 1; // Bohr radius (normalized to 1)
  const rho = (2 * Z * r) / (n * a0);
  
  // Normalization constant
  const norm = Math.sqrt(
    (2 * Z) ** 3 / (n ** 4 * factorial(n - l - 1) * factorial(n + l))
  );
  
  // Exponential factor
  const expFactor = Math.exp(-rho / 2);
  
  // Associated Laguerre polynomial L^(2l+1)_(n-l-1)(rho)
  const laguerrePoly = associatedLaguerre(n - l - 1, 2 * l + 1, rho);
  
  // Power factor
  const powerFactor = Math.pow(rho, l);
  
  return norm * Math.pow(rho, l) * laguerrePoly * expFactor;
}

/**
 * Spherical harmonic Y_lm(θ, φ)
 * 
 * @param {number} l - Orbital angular momentum (l >= 0)
 * @param {number} m - Magnetic quantum number (-l <= m <= l)
 * @param {number} theta - Polar angle (0 to π)
 * @param {number} phi - Azimuthal angle (0 to 2π)
 * @returns {Array} [real, imaginary] components of Y_lm
 */
export function sphericalHarmonic(l, m, theta, phi) {
  // Normalization constant
  const norm = Math.sqrt(
    ((2 * l + 1) * factorial(l - Math.abs(m))) /
    (4 * Math.PI * factorial(l + Math.abs(m)))
  );
  
  // Associated Legendre polynomial P^|m|_l(cos θ)
  const cosTheta = Math.cos(theta);
  const legendrePoly = associatedLegendre(l, Math.abs(m), cosTheta);
  
  // Exponential phase factor e^(imφ)
  const phase = m * phi;
  const realPart = norm * legendrePoly * Math.cos(phase);
  const imagPart = norm * legendrePoly * Math.sin(phase);
  
  return [realPart, imagPart];
}

/**
 * Probability density |ψ_nlm(r, θ, φ)|²
 * 
 * @param {number} n - Principal quantum number
 * @param {number} l - Orbital angular momentum
 * @param {number} m - Magnetic quantum number
 * @param {number} r - Radial distance
 * @param {number} theta - Polar angle
 * @param {number} phi - Azimuthal angle
 * @param {number} Z - Nuclear charge
 * @returns {number} Probability density
 */
export function probabilityDensity(n, l, m, r, theta, phi, Z = 1) {
  const radial = radialWavefunction(n, l, r, Z);
  const [yReal, yImag] = sphericalHarmonic(l, m, theta, phi);
  
  // |ψ|² = |R|² × |Y|²
  const radialSquared = radial * radial;
  const sphericalSquared = yReal * yReal + yImag * yImag;
  
  return radialSquared * sphericalSquared;
}

/**
 * Generate orbital point cloud for visualization
 * 
 * @param {number} n - Principal quantum number
 * @param {number} l - Orbital angular momentum
 * @param {number} m - Magnetic quantum number (optional, default uses all m)
 * @param {number} numPoints - Number of sample points (default: 5000)
 * @param {number} maxRadius - Maximum radius in Bohr radii (default: 10*n)
 * @returns {Array} Array of {x, y, z, density} points
 */
export function generateOrbitalPointCloud(n, l, m = null, numPoints = 5000, maxRadius = null) {
  if (!maxRadius) maxRadius = 10 * n;
  
  const points = [];
  const densities = [];
  
  // Use m=-l to m=l if not specified
  const mValues = m !== null ? [m] : Array.from({length: 2*l+1}, (_, i) => i - l);
  
  // Generate points using importance sampling
  for (let i = 0; i < numPoints; i++) {
    // Random point in spherical coordinates
    const r = maxRadius * Math.pow(Math.random(), 1/3); // Biased toward shell
    const theta = Math.acos(2 * Math.random() - 1); // Uniform in theta
    const phi = 2 * Math.PI * Math.random();
    
    // Use first m value for wavefunction (or sum over all m)
    const density = probabilityDensity(n, l, mValues[0], r, theta, phi);
    
    // Weight by probability to do importance sampling
    if (Math.random() < density * 100) { // Adjust scaling as needed
      // Convert to Cartesian
      const x = r * Math.sin(theta) * Math.cos(phi);
      const y = r * Math.sin(theta) * Math.sin(phi);
      const z = r * Math.cos(theta);
      
      points.push({x, y, z, density});
      densities.push(density);
    }
  }
  
  // Normalize densities
  const maxDensity = Math.max(...densities);
  points.forEach(p => p.density /= maxDensity);
  
  return points;
}

/**
 * Generate orbital geometry info for Three.js visualization
 * 
 * @param {number} n - Principal quantum number
 * @param {number} l - Orbital angular momentum
 * @param {number} m - Magnetic quantum number
 * @param {Object} options - {numPoints, maxRadius, probability}
 * @returns {Object} Geometry data with vertices and metadata
 */
export function getOrbitalGeometry(n, l, m = 0, options = {}) {
  const {
    numPoints = 5000,
    maxRadius = 10 * n,
    probabilityThreshold = 0.01
  } = options;
  
  const points = generateOrbitalPointCloud(n, l, m, numPoints, maxRadius);
  
  // Filter by probability threshold
  const filtered = points.filter(p => p.density > probabilityThreshold);
  
  return {
    name: getOrbitalName(n, l),
    points: filtered,
    n, l, m,
    maxRadius,
    color: getOrbitalColor(l),
    metadata: {
      type: `orbital_${n}${['s','p','d','f'][l]}`,
      quantumNumbers: [n, l, m],
      numSamples: filtered.length
    }
  };
}

/**
 * Get orbital name (e.g., "1s", "2p", "3d")
 */
export function getOrbitalName(n, l) {
  const lNames = ['s', 'p', 'd', 'f', 'g', 'h', 'i'];
  return `${n}${lNames[l] || '?'}`;
}

/**
 * Get orbital color by angular momentum
 * s: red, p: green, d: blue, f: yellow
 */
export function getOrbitalColor(l) {
  const colors = [0xFF0000, 0x00FF00, 0x0000FF, 0xFFFF00];
  return colors[l] || 0xFFFFFF;
}

/**
 * Get electron configuration for an atom (up to 54 electrons)
 * Returns array of (n, l, m) tuples
 */
export function getElectronConfiguration(Z) {
  // Aufbau principle: 1s, 2s, 2p, 3s, 3p, 4s, 3d, 4p, 5s, 4d, 5p, 6s, 4f, 5d, 6p...
  const orbitals = [
    [1, 0], // 1s (2)
    [2, 0], // 2s (2)
    [2, 1], // 2p (6)
    [3, 0], // 3s (2)
    [3, 1], // 3p (6)
    [4, 0], // 4s (2)
    [3, 2], // 3d (10)
    [4, 1], // 4p (6)
    [5, 0], // 5s (2)
    [4, 2], // 4d (10)
    [5, 1], // 5p (6)
    [6, 0], // 6s (2)
    [4, 3], // 4f (14)
    [5, 2], // 5d (10)
    [6, 1]  // 6p (6)
  ];
  
  const maxElectrons = [2, 2, 6, 2, 6, 2, 10, 6, 2, 10, 6, 2, 14, 10, 6];
  
  const config = [];
  let electronCount = 0;
  
  for (let i = 0; i < orbitals.length && electronCount < Z; i++) {
    const [n, l] = orbitals[i];
    const max = maxElectrons[i];
    const toAdd = Math.min(max, Z - electronCount);
    
    // For each electron in this orbital, add with different m values
    for (let e = 0; e < toAdd; e++) {
      // Distribute electrons: m ranges from -l to +l
      const m = (e % (2 * l + 1)) - l;
      config.push([n, l, m]);
      electronCount++;
    }
  }
  
  return config;
}

// ============= Helper Functions =============

/**
 * Factorial function (n!)
 */
function factorial(n) {
  if (n <= 1) return 1;
  let result = 1;
  for (let i = 2; i <= n; i++) {
    result *= i;
  }
  return result;
}

/**
 * Associated Laguerre polynomial L^α_n(x)
 * Used in radial wavefunctions
 */
function associatedLaguerre(n, alpha, x) {
  // Base cases
  if (n === 0) {
    return 1;
  }
  if (n === 1) {
    return 1 + alpha - x;
  }
  
  // Recurrence relation
  let L0 = 1;
  let L1 = 1 + alpha - x;
  let Ln;
  
  for (let i = 2; i <= n; i++) {
    Ln = ((2 * i - 1 + alpha - x) * L1 - (i - 1 + alpha) * L0) / i;
    L0 = L1;
    L1 = Ln;
  }
  
  return Ln;
}

/**
 * Associated Legendre polynomial P^m_n(x)
 * Used in spherical harmonics
 */
function associatedLegendre(n, m, x) {
  // Base cases
  if (m < 0 || m > n || Math.abs(x) > 1) return 0;
  
  let pmm = 1;
  if (m > 0) {
    const sqrtFactor = Math.sqrt(1 - x * x);
    for (let i = 1; i <= m; i++) {
      pmm *= -(2 * i - 1) * sqrtFactor;
    }
  }
  
  if (n === m) return pmm;
  
  let pmm1 = x * (2 * m + 1) * pmm;
  if (n === m + 1) return pmm1;
  
  let pnn;
  for (let i = m + 2; i <= n; i++) {
    pnn = ((2 * i - 1) * x * pmm1 - (i + m - 1) * pmm) / (i - m);
    pmm = pmm1;
    pmm1 = pnn;
  }
  
  return pnn;
}

// ============= Pre-computed Orbital Data =============

/**
 * Get all pre-computed active orbitals for visualization
 */
export const ORBITAL_LIBRARY = {
  '1s': { n: 1, l: 0, m: 0 },
  '2s': { n: 2, l: 0, m: 0 },
  '2p': { n: 2, l: 1, m: 0 },
  '3s': { n: 3, l: 0, m: 0 },
  '3p': { n: 3, l: 1, m: 0 },
  '3d': { n: 3, l: 2, m: 0 }
};

/**
 * Pre-compute and cache orbital geometries
 */
const orbitalCache = new Map();

export function getCachedOrbital(n, l, m = 0) {
  const key = `${n}_${l}_${m}`;
  if (!orbitalCache.has(key)) {
    orbitalCache.set(key, getOrbitalGeometry(n, l, m));
  }
  return orbitalCache.get(key);
}

/**
 * Clear orbital cache
 */
export function clearOrbitalCache() {
  orbitalCache.clear();
}
