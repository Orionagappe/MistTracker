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
  // ...add more as needed
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
  LN10: 23
  // ...add more as needed
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

// 5. Usage
console.log(evaluateSymbolic(expr)); // Example output

// 6. Extend: Add arithmetic, simplification