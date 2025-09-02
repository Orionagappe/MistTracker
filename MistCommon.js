// --- Physics Engine Classes ---
class MistPhysicsEngineND {
  constructor(config = {}) {
    // Default to 4D Minkowski metric, but allow 3D mode
    this.metric3D = new MetricTensor3D();
    this.metric4D = config.metric || new MetricTensorND(4, [
      [-1, 0, 0, 0],
      [0, 1, 0, 0],
      [0, 0, 1, 0],
      [0, 0, 0, 1]
    ]);
    this.mode = config.mode || '4D'; // '3D' or '4D'
    this.G = config.G || 6.67430e-11; // Gravitational constant
    this.M = config.M || 1.0; // Mass for gravity calculations
  }

  setMode(mode) {
    this.mode = mode;
  }

  // Use the appropriate metric for distance
  distance(p1, p2) {
    if (this.mode === '3D') {
      return Math.sqrt(this.metric3D.intervalSquared(p1, p2));
    } else {
      return Math.sqrt(this.metric4D.intervalSquared(p1, p2));
    }
  }

  // Gravity as a function of distance in 3D at a given time
  gravityAt(p, mass = this.M) {
    // p: [x, y, z]
    const r = Math.sqrt(p[0] * p[0] + p[1] * p[1] + p[2] * p[2]);
    if (r === 0) return 0;
    // Newtonian gravity: g = G * M / r^2
    return this.G * mass / (r * r);
  }

  // For compatibility: project to 3D view
  projectToView(vec, viewRank = 3) {
    if (this.mode === '3D') {
      return this.metric3D.project ? this.metric3D.project(vec, viewRank) : vec.slice(0, 3);
    } else {
      return this.metric4D.project(vec, viewRank);
    }
  }

  // For compatibility: collision detection in 3D
  checkCollision3D(p1, p2, threshold = 1e-6) {
    return Math.abs(this.metric3D.intervalSquared(p1, p2)) < threshold;
  }

/**
   * Bell's theorem culling logic.
   * Returns true if Bell's inequality is satisfied for the given variables.
   * @param {number} a
   * @param {number} b
   * @param {number} c
   * @param {number} d
   * @returns {boolean}
   */
  bellTheorem(a, b, c, d) {
    return Math.abs(a * b + c * d) <= 2;
  }

  // --- Pilot Wave Theory ---
  /**
   * Pilot wave theory for defined objects.
   * Calculates the pilot wave based on the wave function and potential.
   * @param {number} psi - The wave function value.
   * @param {number} potential - The potential at the object's location.
   * @returns {number}
   */
  pilotWave(psi, potential) {
    return psi * potential;
  }

  // --- Locality ---
  /**
   * Check if two points are local to each other (distance < 1 unit).
   * @param {Array<number>} p1 - First point [x, y, z].
   * @param {Array<number>} p2 - Second point [x, y, z].
   * @returns {boolean}
   */
  locality(p1, p2) {
    const distance = Math.sqrt(
      Math.pow(p2[0] - p1[0], 2) +
      Math.pow(p2[1] - p1[1], 2) +
      Math.pow(p2[2] - p1[2], 2)
    );
    return distance < 1;
  }

  // --- Light Wave Propagation ---
  /**
   * Relationship between light wave emitted by a single source object and the wave arriving at two objects.
   * Returns the time taken for light to reach each object.
   * @param {Array<number>} source - Source position [x, y, z].
   * @param {Array<number>} obj1 - First object position [x, y, z].
   * @param {Array<number>} obj2 - Second object position [x, y, z].
   * @returns {{time1: number, time2: number}}
   */
  lightWave(source, obj1, obj2) {
    const D = (p1, p2) => Math.sqrt(
      Math.pow(p2[0] - p1[0], 2) +
      Math.pow(p2[1] - p1[1], 2) +
      Math.pow(p2[2] - p1[2], 2)
    );
    const distance1 = D(source, obj1);
    const distance2 = D(source, obj2);
    return {
      time1: distance1 / this.C,
      time2: distance2 / this.C
    };
  }

  // --- Relative Acceleration ---
  /**
   * Relative acceleration between two velocities over time.
   * @param {number} v1 - Initial velocity.
   * @param {number} v2 - Final velocity.
   * @param {number} t - Time interval.
   * @returns {number}
   */
  relativeAcceleration(v1, v2, t) {
    return (v2 - v1) / t;
  }

eulerLagrange(L, q, qDot, t = 0, dt = 1e-5) {
    const n = q.length;
    const result = [];
    for (let i = 0; i < n; i++) {
      // ∂L/∂q_i
      const dq = [...q];
      dq[i] += dt;
      const dL_dq = (L(dq, qDot, t) - L(q, qDot, t)) / dt;

      // ∂L/∂qDot_i
      const dqDot = [...qDot];
      dqDot[i] += dt;
      const dL_dqDot = (L(q, dqDot, t) - L(q, qDot, t)) / dt;

      // d/dt(∂L/∂qDot_i) ≈ (∂L/∂qDot_i at t+dt - ∂L/∂qDot_i at t) / dt
      const dqDotNext = [...qDot];
      dqDotNext[i] += dt;
      const dL_dqDot_next = (L(q, dqDotNext, t + dt) - L(q, qDot, t + dt)) / dt;
      const d_dt_dL_dqDot = (dL_dqDot_next - dL_dqDot) / dt;

      // Euler-Lagrange: d/dt(∂L/∂qDot_i) - ∂L/∂q_i
      result.push(d_dt_dL_dqDot - dL_dq);
    }
    return result;
  }

  /**
   * Gauss's law for magnetism: net magnetic flux through any closed surface is zero.
   * @param {number|Array<number>} B - Magnetic field or array of flux values.
   * @param {number} [tolerance=1e-10]
   * @returns {boolean}
   */
  gaussLawMagnetism(B, tolerance = 1e-10) {
    let totalFlux = Array.isArray(B) ? B.reduce((sum, val) => sum + val, 0) : B;
    return Math.abs(totalFlux) < tolerance;
  }

  /**
   * Principle of stationary action: action is stationary (variation ≈ 0).
   * @param {number|Array<number>} actionVariation
   * @param {number} [tolerance=1e-10]
   * @returns {boolean}
   */
  principleOfStationaryAction(actionVariation, tolerance = 1e-10) {
    let variation = Array.isArray(actionVariation)
      ? Math.max(...actionVariation.map(Math.abs))
      : Math.abs(actionVariation);
    return variation < tolerance;
  }

  /**
   * Compose multiple wave objects by summing intensities and averaging properties.
   * @param {Array<Object>} waves
   * @returns {Object}
   */
  composeWaves(waves) {
    if (!Array.isArray(waves) || waves.length === 0) return { intensity: 0 };
    let totalIntensity = 0;
    let totalFrequency = 0;
    let totalWavelength = 0;
    let count = 0;
    waves.forEach(wave => {
      totalIntensity += wave.intensity || 0;
      if (wave.frequency) totalFrequency += wave.frequency;
      if (wave.wavelength) totalWavelength += wave.wavelength;
      count++;
    });
    return {
      intensity: totalIntensity,
      frequency: count ? totalFrequency / count : undefined,
      wavelength: count ? totalWavelength / count : undefined
    };
  }

  /**
   * Relationship between intensity and object hardness.
   * @param {number} intensity
   * @param {number} hardness
   * @returns {number}
   */
  intensityHardnessRelationship(intensity, hardness) {
    return intensity * hardness;
  }

  /**
   * Particle-wave duality model.
   * @param {Object} particle - { position, mass }
   * @param {Object} wave - { wavelength, frequency }
   * @returns {Object}
   */
  particleWaveDuality(particle, wave) {
    return {
      position: particle.position,
      mass: particle.mass,
      wavelength: wave.wavelength,
      frequency: wave.frequency,
      duality: true
    };
  };

}

// --- Metric Tensor for nD Physics ---
class MetricTensorND {
  /**
   * @param {number} rank - The rank (dimensions) of the tensor.
   * @param {Array<Array<number>>} data - The metric tensor matrix.
   */
  constructor(rank, data) {
    this.rank = rank;
    this.data = data; // e.g., 4x4 or 5x5 array
  }

  /**
   * Calculate the squared interval (distance) between two points in this metric.
   * @param {Array<number>} p1 - First point (array of coordinates).
   * @param {Array<number>} p2 - Second point.
   * @returns {number} - The squared interval.
   */
  intervalSquared(p1, p2) {
    let delta = p1.map((v, i) => v - p2[i]);
    let sum = 0;
    for (let i = 0; i < this.rank; i++) {
      for (let j = 0; j < this.rank; j++) {
        sum += this.data[i][j] * delta[i] * delta[j];
      }
    }
    return sum;
  }
  

  /**
   * Project a vector from higher to lower dimension using the metric.
   * @param {Array<number>} vec - The vector to project.
   * @param {number} targetRank - The target dimension.
   * @returns {Array<number>} - Projected vector.
   */
  project(vec, targetRank) {
    return vec.slice(0, targetRank);
  }

  /**
   * Apply the metric to transform a vector (for orientation/navigation).
   * @param {Array<number>} vec
   * @returns {Array<number>}
   */
  transform(vec) {
    let result = Array(this.rank).fill(0);
    for (let i = 0; i < this.rank; i++) {
      for (let j = 0; j < this.rank; j++) {
        result[i] += this.data[i][j] * vec[j];
      }
    }
    return result;
  }
}

// --- Selection and User Management ---
class SelectionModeState {
  constructor() {
    this.currentStep = null;
    this.selectedIndices = [];
    this.inputBoxOpen = false;
    this.inputBoxType = null;
  }
}

// --- Object Management Functions ---
function createVoxelObject(center, size, angularMomentumMap = {}) {
  return {
    position: center,
    size: size,
    angularMomentumMap: angularMomentumMap || {}
  };
}

function updateDistanceFromObserver(object, observer) {
  const distance = Math.sqrt(
    object.position.reduce((sum, coord, i) => 
      sum + Math.pow(coord - observer.position[i], 2), 0)
  );
  object.distanceFromObserver = distance;
  return distance;
}

function computeAngularMomentumMap(object) {
  if (!object.angularMomentumMap) {
    object.angularMomentumMap = {};
  }
  return object.angularMomentumMap;
}

// --- Dimensional Management Functions ---
/**
 * Stack objects or spaces in higher dimensions.
 * Each object is placed along the specified dimension, spaced equally.
 * @param {Array} objects - Array of objects or spaces to stack.
 * @param {number} dimension - The dimension to stack along (e.g., 3 for W in 4D).
 * @returns {Array} - Stacked representation (array of objects with updated positions).
 */
function dimensionalStack(objects, dimension) {
  // Place each object at a unique coordinate along the stacking dimension
  return objects.map((obj, idx) => {
    let pos = Array.isArray(obj.position) ? [...obj.position] : [0, 0, 0, 0];
    pos[dimension] = idx; // Stack along the specified dimension
    return { ...obj, position: pos };
  });
}

/**
 * Treat extra dimensions as either spatial axes or as object properties.
 * @param {Object} object - The object to analyze (with position).
 * @param {boolean} asObject - If true, treat extra dimensions as object properties.
 * @returns {Object} - Modified object or space.
 */
function extraDimensionMode(object, asObject) {
  const pos = object.position || [];
  if (asObject) {
    // Move extra dimensions into object properties
    const extra = pos.slice(3); // Assume 3D is spatial, rest are "object"
    return { ...object, extraDimensions: extra, position: pos.slice(0, 3) };
  } else {
    // Treat all as spatial
    return { ...object, position: pos };
  }
}

/**
 * Project a higher-dimensional object into a lower dimension over time or motion.
 * @param {Object} object - The higher-dimensional object (with position).
 * @param {number} fromDimension - The original dimension.
 * @param {number} toDimension - The target (lower) dimension.
 * @param {number} time - Time parameter for the projection (optional).
 * @returns {Object} - Lower-dimensional projection at given time.
 */
function projectToLowerDimension(object, fromDimension, toDimension, time = 0) {
  // Simple orthogonal projection: drop extra dimensions
  const pos = object.position || [];
  const projected = pos.slice(0, toDimension);
  // Optionally, animate projection over time (e.g., interpolate extra dims to zero)
  if (fromDimension > toDimension && time > 0) {
    for (let i = toDimension; i < fromDimension; i++) {
      projected[toDimension - 1] += (pos[i] || 0) * Math.exp(-time); // Fade out extra dims
    }
  }
  return { ...object, position: projected };
}

export {
  // Classes
  MistPhysicsEngineND,
  MetricTensorND,
  SelectionModeState,
  
  // Functions
  createVoxelObject,
  updateDistanceFromObserver,
  computeAngularMomentumMap,
  dimensionalStack,
  extraDimensionMode,
  projectToLowerDimension
};