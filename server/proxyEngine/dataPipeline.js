/**
 * Task A1: Data Pipeline Architecture
 * Phase 15: ML Proxy Framework
 * 
 * Converts simulation output into extractable patterns for proxy compilation.
 * Input: Session config + simulation output
 * Output: Extracted patterns (differential equations, relationships)
 */

/**
 * Detect linear relationships: y = mx + b
 * @param {Array} data - Array of {x, y} points
 * @returns {Object|null} {slope, intercept, r_squared} or null if not linear
 */
function detectLinearPattern(data) {
  if (data.length < 2) return null;
  
  const n = data.length;
  let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0, sumY2 = 0;
  
  data.forEach(({x, y}) => {
    sumX += x;
    sumY += y;
    sumXY += x * y;
    sumX2 += x * x;
    sumY2 += y * y;
  });
  
  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;
  
  // Calculate R² for fit quality
  const meanY = sumY / n;
  const ssRes = data.reduce((sum, {y}) => sum + Math.pow(y - (slope * sumX / n + intercept), 2), 0);
  const ssTot = data.reduce((sum, {y}) => sum + Math.pow(y - meanY, 2), 0);
  const r_squared = 1 - (ssRes / ssTot);
  
  return r_squared > 0.95 ? { type: 'linear', slope, intercept, r_squared } : null;
}

/**
 * Detect polynomial relationships: y = a*x^n + ... + c
 * @param {Array} data - Array of {x, y} points
 * @param {Number} degree - Polynomial degree to test
 * @returns {Object|null} {type, coefficients, r_squared} or null if poor fit
 */
function detectPolynomialPattern(data, degree = 2) {
  if (data.length < degree + 1) return null;
  
  // Simple polynomial fitting (least squares)
  const n = data.length;
  const matrix = [];
  const vector = [];
  
  for (let i = 0; i <= degree; i++) {
    matrix[i] = [];
    for (let j = 0; j <= degree; j++) {
      matrix[i][j] = data.reduce((sum, {x}) => sum + Math.pow(x, i + j), 0);
    }
    vector[i] = data.reduce((sum, {x, y}) => sum + y * Math.pow(x, i), 0);
  }
  
  // Gaussian elimination
  const coefficients = gaussianElimination(matrix, vector);
  if (!coefficients) return null;
  
  // Calculate R²
  const meanY = data.reduce((sum, {y}) => sum + y, 0) / n;
  const predictions = data.map(({x}) => 
    coefficients.reduce((sum, coef, idx) => sum + coef * Math.pow(x, idx), 0)
  );
  const ssRes = data.reduce((sum, {y}, i) => sum + Math.pow(y - predictions[i], 2), 0);
  const ssTot = data.reduce((sum, {y}) => sum + Math.pow(y - meanY, 2), 0);
  const r_squared = 1 - (ssRes / ssTot);
  
  return r_squared > 0.95 ? { 
    type: `polynomial_${degree}`, 
    coefficients, 
    r_squared 
  } : null;
}

/**
 * Detect exponential relationships: y = a * e^(bx)
 * @param {Array} data - Array of {x, y} points
 * @returns {Object|null} {type, a, b, r_squared} or null
 */
function detectExponentialPattern(data) {
  if (data.length < 2) return null;
  
  // Transform: ln(y) = ln(a) + bx (linear in ln(y))
  const transformedData = data
    .filter(({y}) => y > 0)
    .map(({x, y}) => ({x, y: Math.log(y)}));
  
  if (transformedData.length < 2) return null;
  
  const linearFit = detectLinearPattern(transformedData);
  if (!linearFit || linearFit.r_squared < 0.95) return null;
  
  const a = Math.exp(linearFit.intercept);
  const b = linearFit.slope;
  
  return { type: 'exponential', a, b, r_squared: linearFit.r_squared };
}

/**
 * Detect periodic (sinusoidal) relationships: y = A * sin(ωx + φ) + offset
 * @param {Array} data - Array of {x, y} points
 * @returns {Object|null} {type, amplitude, frequency, phase, offset, r_squared} or null
 */
function detectPeriodicPattern(data) {
  if (data.length < 4) return null;
  
  const meanY = data.reduce((sum, {y}) => sum + y, 0) / data.length;
  const amplitude = (Math.max(...data.map(d => d.y)) - Math.min(...data.map(d => d.y))) / 2;
  
  // Estimate frequency via FFT-like approach (simplified)
  let maxCorrelation = 0;
  let bestFreq = 1;
  
  for (let freq = 0.1; freq <= 10; freq += 0.1) {
    const correlation = data.reduce((sum, {x, y}) => 
      sum + (y - meanY) * Math.sin(freq * x), 0
    ) / data.length;
    
    if (Math.abs(correlation) > maxCorrelation) {
      maxCorrelation = Math.abs(correlation);
      bestFreq = freq;
    }
  }
  
  // Calculate R² for periodic fit
  const predictions = data.map(({x}) => amplitude * Math.sin(bestFreq * x) + meanY);
  const meanYVal = meanY;
  const ssRes = data.reduce((sum, {y}, i) => sum + Math.pow(y - predictions[i], 2), 0);
  const ssTot = data.reduce((sum, {y}) => sum + Math.pow(y - meanYVal, 2), 0);
  const r_squared = 1 - (ssRes / ssTot);
  
  return r_squared > 0.90 ? {
    type: 'periodic',
    amplitude,
    frequency: bestFreq,
    offset: meanY,
    r_squared
  } : null;
}

/**
 * Gaussian elimination for solving linear systems
 * @param {Array} matrix - Coefficient matrix
 * @param {Array} vector - Constants vector
 * @returns {Array|null} Solution vector or null if singular
 */
function gaussianElimination(matrix, vector) {
  const n = matrix.length;
  const m = [...matrix.map(row => [...row])];
  const v = [...vector];
  
  for (let i = 0; i < n; i++) {
    // Find pivot
    let maxRow = i;
    for (let k = i + 1; k < n; k++) {
      if (Math.abs(m[k][i]) > Math.abs(m[maxRow][i])) {
        maxRow = k;
      }
    }
    
    // Swap rows
    [m[i], m[maxRow]] = [m[maxRow], m[i]];
    [v[i], v[maxRow]] = [v[maxRow], v[i]];
    
    if (Math.abs(m[i][i]) < 1e-10) return null;
    
    // Eliminate column
    for (let k = i + 1; k < n; k++) {
      const factor = m[k][i] / m[i][i];
      for (let j = i; j < n; j++) {
        m[k][j] -= factor * m[i][j];
      }
      v[k] -= factor * v[i];
    }
  }
  
  // Back substitution
  const solution = new Array(n);
  for (let i = n - 1; i >= 0; i--) {
    solution[i] = v[i];
    for (let j = i + 1; j < n; j++) {
      solution[i] -= m[i][j] * solution[j];
    }
    solution[i] /= m[i][i];
  }
  
  return solution;
}

/**
 * Extract mathematical patterns from simulation output
 * @param {Object} simOutput - Simulation result {atomStates, emitterStates, timeline}
 * @returns {Array} Array of extracted patterns with type, inputs, outputs, confidence
 */
export function extractPatterns(simOutput) {
  const patterns = [];
  
  if (!simOutput || !simOutput.atomStates) {
    console.log('⚠️ No simulation output to extract patterns from');
    return patterns;
  }
  
  // Pattern 1: Atom position over time (linear/polynomial trajectory)
  if (simOutput.atomStates.length > 0) {
    const atom = simOutput.atomStates[0];
    
    if (atom.trajectory && atom.trajectory.length > 2) {
      // Try linear trajectory first
      const timeData = atom.trajectory.map((pos, idx) => ({
        x: idx,
        y: Math.sqrt(pos.x * pos.x + pos.y * pos.y + pos.z * pos.z)
      }));
      
      const linearPattern = detectLinearPattern(timeData);
      if (linearPattern) {
        patterns.push({
          type: 'linear',
          description: 'Atom distance from origin over time',
          inputs: ['time'],
          outputs: ['distance'],
          parameters: linearPattern,
          confidence: linearPattern.r_squared,
          pattern: 'linear'
        });
      }
      
      // Try polynomial
      const polyPattern = detectPolynomialPattern(timeData, 2);
      if (polyPattern && polyPattern.r_squared > 0.96) {
        patterns.push({
          type: 'polynomial',
          description: 'Quadratic trajectory',
          inputs: ['time'],
          outputs: ['distance'],
          parameters: polyPattern,
          confidence: polyPattern.r_squared,
          pattern: 'polynomial_2'
        });
      }
    }
  }
  
  // Pattern 2: Emitter energy over time (exponential decay)
  if (simOutput.emitterStates && simOutput.emitterStates.length > 0) {
    const emitter = simOutput.emitterStates[0];
    
    if (emitter.energyHistory && emitter.energyHistory.length > 2) {
      const energyData = emitter.energyHistory.map((energy, idx) => ({
        x: idx,
        y: energy
      }));
      
      const expPattern = detectExponentialPattern(energyData);
      if (expPattern) {
        patterns.push({
          type: 'exponential',
          description: 'Emitter energy decay',
          inputs: ['time'],
          outputs: ['energy'],
          parameters: expPattern,
          confidence: expPattern.r_squared,
          pattern: 'exponential'
        });
      }
    }
  }
  
  // Pattern 3: Periodic oscillations (if detected)
  if (simOutput.oscillationData && simOutput.oscillationData.length > 4) {
    const periodicPattern = detectPeriodicPattern(simOutput.oscillationData);
    if (periodicPattern) {
      patterns.push({
        type: 'periodic',
        description: 'System oscillation',
        inputs: ['time'],
        outputs: ['amplitude'],
        parameters: periodicPattern,
        confidence: periodicPattern.r_squared,
        pattern: 'periodic'
      });
    }
  }
  
  console.log(`✓ Extracted ${patterns.length} patterns from simulation output`);
  return patterns;
}

/**
 * Compile patterns into a simplified proxy representation
 * @param {Array} patterns - Extracted patterns from extractPatterns()
 * @returns {Object} Proxy definition with type, inputs, outputs
 */
export function compilePatternToProxy(pattern) {
  return {
    proxyId: `proxy-${Date.now()}`,
    type: pattern.pattern,
    inputs: pattern.inputs,
    outputs: pattern.outputs,
    parameters: pattern.parameters,
    accuracy: pattern.confidence,
    description: pattern.description
  };
}

export default {
  extractPatterns,
  compilePatternToProxy,
  detectLinearPattern,
  detectPolynomialPattern,
  detectExponentialPattern,
  detectPeriodicPattern
};
