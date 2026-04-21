const ExpressionType = {
  CONST: 2,
  RATIONAL: 3,
  CONST_PLUS_IRR: 5,
  CONST_TIMES_IRR: 7,
  IRR_ONLY: 11,
  SUM: 13,
  PRODUCT: 17,
  POWER: 19,
  LOG: 23,
  EXP: 29,
  CONST_PLUS_LOG: 31,
  CONST_PLUS_EXP: 37,
  // Phase 16.4: Complex number support
  COMPLEX: 41,
  COMPLEX_PLUS_CONST: 43,
  COMPLEX_TIMES_CONST: 47,
  // Quaternions (future: Phase 17+)
  QUATERNION: 53,
  // Octonions (future: Phase 18+)
  OCTONION: 59
};

const IrrationalType = {
  NONE: 2,
  SQRT: 3,
  CBRT: 5,
  NTH_ROOT: 7,
  PI: 11,
  E: 13,
  PHI: 17,
  LN2: 19,
  LN10: 23,
  // Phase 16.4: Imaginary unit
  I: 29
};

const ComplexType = {
  CARTESIAN: 1,    // a + bi representation
  POLAR: 2,        // r∠θ representation
  EXPONENTIAL: 3   // r*e^(iθ) representation
};

// 2. Symbolic List Constructor
function makeSymbolic(
  expressionType = ExpressionType.CONST,
  constant = 0,
  irrationalType = IrrationalType.NONE,
  irrationalInt = 0,
) {
  return [
    expressionType,
    constant,
    irrationalType,
    irrationalInt
  ];
}

// 3. Example: 3 * sqrt(2)
const expr = makeSymbolic(
  ExpressionType.CONST_TIMES_IRR,
  3, // constant
  IrrationalType.SQRT,
  2, // sqrt(2)
);

// 4. Evaluation (to float, for demonstration)
function evaluateSymbolic(expr) {
  const [
    expressionType,
    constant,
    irrationalType,
    irrationalInt
  ] = expr;

  // Irrational value
  let irrValue = 0;
  switch (irrationalType) {
    case IrrationalType.SQRT: irrValue = Math.sqrt(irrationalInt);
    case IrrationalType.CBRT: irrValue = Math.cbrt(irrationalInt);
    case IrrationalType.PI: irrValue = Math.PI;
    case IrrationalType.E: irrValue = Math.E;
    case IrrationalType.NTH_ROOT: irrValue = Math.pow(constant, 1/irrationalInt);
    case IrrationalType.PHI: irrValue = Math.PHI;
    case IrrationalType.LN2: irrValue = Math.LN2;
    case IrrationalType.LN10: irrValue = Math.LN10;
    
    default: irrValue = 0;
  }

  // Expression evaluation (simplified)
  switch (expressionType) {
    case ExpressionType.CONST: return constant;
    case ExpressionType.CONST_PLUS_IRR: return constant + irrValue;
    case ExpressionType.CONST_TIMES_IRR: return constant * irrValue;
    default: return NaN;
  }
  
}

// ============================================================================
// PHASE 16.4: COMPLEX NUMBER SUPPORT
// ============================================================================
// Enables quantum mechanics, wave equations, and physics-informed learning
// without requiring hidden layers in neural networks
// ============================================================================

/**
 * Create a complex number in Cartesian form: a + bi
 * @param {number} real - Real part (a)
 * @param {number} imag - Imaginary part (b)
 * @returns {Array} [type, real, imag, 0]
 */
function makeComplex(real = 0, imag = 0) {
  return [
    ExpressionType.COMPLEX,
    real,
    imag,
    ComplexType.CARTESIAN
  ];
}

/**
 * Create a complex number in polar form: r∠θ
 * @param {number} magnitude - Radius (r)
 * @param {number} angle - Angle in radians (θ)
 * @returns {Array} [type, magnitude, angle, polar_type]
 */
function makeComplexPolar(magnitude = 1, angle = 0) {
  return [
    ExpressionType.COMPLEX,
    magnitude,
    angle,
    ComplexType.POLAR
  ];
}

/**
 * Convert Cartesian to Polar form
 * @param {Array} complex - Complex number [type, real, imag, cartesian_type]
 * @returns {Array} [type, magnitude, angle, polar_type]
 */
function complexToPolar(complex) {
  const [type, real, imag, formType] = complex;
  
  if (formType === ComplexType.POLAR) return complex;
  
  const magnitude = Math.sqrt(real * real + imag * imag);
  const angle = Math.atan2(imag, real);
  
  return [type, magnitude, angle, ComplexType.POLAR];
}

/**
 * Convert Polar to Cartesian form
 * @param {Array} complex - Complex number [type, magnitude, angle, polar_type]
 * @returns {Array} [type, real, imag, cartesian_type]
 */
function complexToCartesian(complex) {
  const [type, mag, angle, formType] = complex;
  
  if (formType === ComplexType.CARTESIAN) return complex;
  
  const real = mag * Math.cos(angle);
  const imag = mag * Math.sin(angle);
  
  return [type, real, imag, ComplexType.CARTESIAN];
}

/**
 * Add two complex numbers: (a + bi) + (c + di) = (a+c) + (b+d)i
 * @param {Array} c1 - First complex number
 * @param {Array} c2 - Second complex number
 * @returns {Array} Result in Cartesian form
 */
function addComplex(c1, c2) {
  const [, r1, i1] = complexToCartesian(c1);
  const [, r2, i2] = complexToCartesian(c2);
  
  return makeComplex(r1 + r2, i1 + i2);
}

/**
 * Subtract two complex numbers: (a + bi) - (c + di) = (a-c) + (b-d)i
 * @param {Array} c1 - First complex number
 * @param {Array} c2 - Second complex number
 * @returns {Array} Result in Cartesian form
 */
function subtractComplex(c1, c2) {
  const [, r1, i1] = complexToCartesian(c1);
  const [, r2, i2] = complexToCartesian(c2);
  
  return makeComplex(r1 - r2, i1 - i2);
}

/**
 * Multiply two complex numbers: (a + bi)(c + di) = (ac - bd) + (ad + bc)i
 * @param {Array} c1 - First complex number
 * @param {Array} c2 - Second complex number
 * @returns {Array} Result in Cartesian form
 */
function multiplyComplex(c1, c2) {
  const [, r1, i1] = complexToCartesian(c1);
  const [, r2, i2] = complexToCartesian(c2);
  
  const realPart = r1 * r2 - i1 * i2;
  const imagPart = r1 * i2 + i1 * r2;
  
  return makeComplex(realPart, imagPart);
}

/**
 * Divide two complex numbers: (a + bi) / (c + di) = [(ac + bd) + (bc - ad)i] / (c² + d²)
 * @param {Array} c1 - Numerator (complex number)
 * @param {Array} c2 - Denominator (complex number)
 * @returns {Array} Result in Cartesian form
 */
function divideComplex(c1, c2) {
  const [, r1, i1] = complexToCartesian(c1);
  const [, r2, i2] = complexToCartesian(c2);
  
  const denominator = r2 * r2 + i2 * i2;
  
  if (denominator === 0) {
    throw new Error("Cannot divide by zero complex number");
  }
  
  const realPart = (r1 * r2 + i1 * i2) / denominator;
  const imagPart = (i1 * r2 - r1 * i2) / denominator;
  
  return makeComplex(realPart, imagPart);
}

/**
 * Compute complex conjugate: conj(a + bi) = a - bi
 * @param {Array} complex - Complex number
 * @returns {Array} Conjugate in Cartesian form
 */
function conjugateComplex(complex) {
  const [, real, imag] = complexToCartesian(complex);
  return makeComplex(real, -imag);
}

/**
 * Compute modulus (magnitude): |a + bi| = √(a² + b²)
 * @param {Array} complex - Complex number
 * @returns {number} Magnitude
 */
function modulusComplex(complex) {
  const [, real, imag] = complexToCartesian(complex);
  return Math.sqrt(real * real + imag * imag);
}

/**
 * Compute argument (phase angle) in radians: arg(a + bi) = atan2(b, a)
 * @param {Array} complex - Complex number
 * @returns {number} Angle in radians [-π, π]
 */
function argumentComplex(complex) {
  const [, real, imag] = complexToCartesian(complex);
  return Math.atan2(imag, real);
}

/**
 * Raise complex number to integer power: (a + bi)^n
 * @param {Array} complex - Complex number
 * @param {number} n - Integer exponent
 * @returns {Array} Result in Cartesian form
 */
function powerComplex(complex, n) {
  if (n === 0) return makeComplex(1, 0);
  if (n === 1) return complexToCartesian(complex);
  
  const polar = complexToPolar(complex);
  const [, magnitude, angle] = polar;
  
  const newMagnitude = Math.pow(magnitude, n);
  const newAngle = angle * n;
  
  return complexToCartesian(
    makeComplexPolar(newMagnitude, newAngle)
  );
}

/**
 * Square root of complex number
 * @param {Array} complex - Complex number
 * @returns {Array} Principal square root in Cartesian form
 */
function sqrtComplex(complex) {
  const [, magnitude, angle] = complexToPolar(complex);
  
  const newMagnitude = Math.sqrt(magnitude);
  const newAngle = angle / 2;
  
  return complexToCartesian(
    makeComplexPolar(newMagnitude, newAngle)
  );
}

/**
 * Evaluate complex number to decimal representation
 * @param {Array} complex - Complex number
 * @returns {Object} {real, imag, magnitude, phase}
 */
function evaluateComplex(complex) {
  const [, real, imag] = complexToCartesian(complex);
  const magnitude = modulusComplex(complex);
  const phase = argumentComplex(complex);
  
  return {
    real: real,
    imag: imag,
    magnitude: magnitude,
    phase: phase,
    toString: function() {
      const sign = this.imag >= 0 ? '+' : '-';
      return `${this.real.toFixed(4)} ${sign} ${Math.abs(this.imag).toFixed(4)}i`;
    },
    toPolar: function() {
      return `${this.magnitude.toFixed(4)}∠${(this.phase * 180 / Math.PI).toFixed(2)}°`;
    }
  };
}

/**
 * QUANTUM MECHANICS APPLICATION: Hydrogen wave function representation
 * Expresses Ψ(n,l,m) using complex exponentials without neural network hidden layers
 * 
 * Example: Ground state 1s orbital
 * Ψ₁ₛ(r) = (1/√π) * exp(-r) * e^(i*0)  = (1/√π) * exp(-r)
 * 
 * Example: 2p orbital with phase
 * Ψ₂ₚ(r,θ) involves e^(i*m*θ) for magnetic quantum number m
 */

function makeHydrogenWavefunction(n, l, m, r, theta = 0) {
  // Radial part (real)
  let radialPart = 0;
  
  if (n === 1 && l === 0) {
    // 1s: R₁₀(r) = 2*exp(-r)
    radialPart = 2 * Math.exp(-r);
  } else if (n === 2 && l === 0) {
    // 2s: R₂₀(r) = (1/√2)*exp(-r/2)*(1 - r/2)
    radialPart = (1 / Math.sqrt(2)) * Math.exp(-r / 2) * (1 - r / 2);
  } else if (n === 2 && l === 1) {
    // 2p: R₂₁(r) = (1/(2√6))*exp(-r/2)*r
    radialPart = (1 / (2 * Math.sqrt(6))) * Math.exp(-r / 2) * r;
  } else if (n === 3 && l === 0) {
    // 3s: R₃₀(r) = (2/(3√3))*exp(-r/3)*(1 - 2r/3 + 2r²/27)
    radialPart = (2 / (3 * Math.sqrt(3))) * Math.exp(-r / 3) * (1 - 2*r/3 + 2*r*r/27);
  } else if (n === 3 && l === 1) {
    // 3p: R₃₁(r) = (4/(27√30))*exp(-r/3)*r*(1 - r/6)
    radialPart = (4 / (27 * Math.sqrt(30))) * Math.exp(-r / 3) * r * (1 - r / 6);
  }
  
  // Angular part (complex exponential): e^(i*m*θ)
  const angularPhase = m * theta;
  
  // Combined: Ψ = R(r) * e^(i*m*θ)
  return makeComplex(
    radialPart * Math.cos(angularPhase),
    radialPart * Math.sin(angularPhase)
  );
}

/**
 * Compute probability density: |Ψ|² = Ψ* * Ψ
 * @param {Array} wavefunction - Complex wavefunction
 * @returns {number} Probability density (real value)
 */
function probabilityDensity(wavefunction) {
  const magnitude = modulusComplex(wavefunction);
  return magnitude * magnitude;
}

/**
 * Format complex number for display
 * @param {Array} complex - Complex number
 * @param {number} decimals - Decimal places
 * @returns {string} Formatted string
 */
function formatComplex(complex, decimals = 4) {
  const result = evaluateComplex(complex);
  const sign = result.imag >= 0 ? '+' : '';
  return `${result.real.toFixed(decimals)} ${sign} ${result.imag.toFixed(decimals)}i`;
}

// ============================================================================
// 5. Usage
// ============================================================================
// Examples of complex arithmetic (commented out for library use)
// 
// const c1 = makeComplex(3, 4);        // 3 + 4i
// const c2 = makeComplex(1, -2);       // 1 - 2i
// 
// console.log(formatComplex(addComplex(c1, c2)));           // 4 + 2i
// console.log(formatComplex(multiplyComplex(c1, c2)));      // (3+4i)(1-2i) = 11 - 2i
// console.log(modulusComplex(c1));                          // √(9+16) = 5
// console.log(conjugateComplex(c1));                        // 3 - 4i
// 
// Quantum mechanics example:
// const psi_1s = makeHydrogenWavefunction(1, 0, 0, 1.0, 0);
// console.log(formatComplex(psi_1s));
// console.log(probabilityDensity(psi_1s));

// ============================================================================
// EXPORTS (ES6 Module)
// ============================================================================

export {
  // Original symbolic expression API
  ExpressionType,
  IrrationalType,
  ComplexType,
  makeSymbolic,
  evaluateSymbolic,
  
  // Phase 16.4: Complex number API
  makeComplex,
  makeComplexPolar,
  complexToPolar,
  complexToCartesian,
  addComplex,
  subtractComplex,
  multiplyComplex,
  divideComplex,
  conjugateComplex,
  modulusComplex,
  argumentComplex,
  powerComplex,
  sqrtComplex,
  evaluateComplex,
  
  // Quantum mechanics helpers
  makeHydrogenWavefunction,
  probabilityDensity,
  formatComplex
};