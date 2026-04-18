/**
 * Task A2: Proxy Definition Schema
 * Phase 15: ML Proxy Framework
 * 
 * Defines proxy types and validation for composable runtime proxies.
 * Supports: algebraic expression, lookup table, neural network, geometric transform
 */

import { v4 as uuidv4 } from 'uuid';

export const PROXY_TYPES = {
  ALGEBRAIC: 'algebraic',
  LOOKUP_TABLE: 'lookup_table',
  NEURAL_NETWORK: 'neural_network',
  GEOMETRIC_TRANSFORM: 'geometric_transform'
};

/**
 * Base ProxyDefinition class
 */
export class ProxyDefinition {
  constructor({
    proxyId = uuidv4(),
    type = PROXY_TYPES.ALGEBRAIC,
    name = '',
    description = '',
    inputs = [],
    outputs = [],
    version = 1,
    accuracy = 0.0,
    metadata = {}
  } = {}) {
    this.proxyId = proxyId;
    this.type = type;
    this.name = name;
    this.description = description;
    this.inputs = inputs; // Array of {name, type, unit}
    this.outputs = outputs; // Array of {name, type, unit}
    this.version = version;
    this.accuracy = accuracy;
    this.metadata = metadata;
    this.createdAt = new Date();
    this.updatedAt = new Date();
  }

  /**
   * Validate inputs match proxy input schema
   * @param {Object} inputValues - {inputName: value, ...}
   * @returns {Boolean|String} true or error message
   */
  validateInputs(inputValues) {
    for (const inputDef of this.inputs) {
      if (!(inputDef.name in inputValues)) {
        return `Missing required input: ${inputDef.name}`;
      }
      
      const value = inputValues[inputDef.name];
      if (inputDef.type === 'number' && typeof value !== 'number') {
        return `Input ${inputDef.name} must be a number, got ${typeof value}`;
      }
      if (inputDef.type === 'vector' && !Array.isArray(value)) {
        return `Input ${inputDef.name} must be an array, got ${typeof value}`;
      }
      if (inputDef.type === 'matrix' && !Array.isArray(value)) {
        return `Input ${inputDef.name} must be a matrix (array of arrays)`;
      }
    }
    return true;
  }

  /**
   * Get output schema
   * @returns {Array} Output definitions
   */
  getOutputSchema() {
    return this.outputs;
  }

  /**
   * Serialize proxy definition
   */
  toJSON() {
    return {
      proxyId: this.proxyId,
      type: this.type,
      name: this.name,
      description: this.description,
      inputs: this.inputs,
      outputs: this.outputs,
      version: this.version,
      accuracy: this.accuracy,
      metadata: this.metadata,
      createdAt: this.createdAt.toISOString(),
      updatedAt: this.updatedAt.toISOString()
    };
  }

  static fromJSON(json) {
    const proxy = new ProxyDefinition(json);
    proxy.createdAt = new Date(json.createdAt);
    proxy.updatedAt = new Date(json.updatedAt);
    return proxy;
  }
}

/**
 * Algebraic Expression Proxy: y = f(x) with symbolic representation
 * Example: linear (a*x + b), polynomial (a*x^2 + b*x + c), etc.
 */
export class AlgebraicExpressionProxy extends ProxyDefinition {
  constructor({
    proxyId = uuidv4(),
    expression = '',
    coefficients = {},
    ...rest
  } = {}) {
    super({ proxyId, type: PROXY_TYPES.ALGEBRAIC, ...rest });
    this.expression = expression; // e.g., "a*x + b", "a*x^2 + b*x + c"
    this.coefficients = coefficients; // e.g., {a: 1.5, b: 2.0}
  }

  /**
   * Evaluate algebraic expression with given inputs
   * @param {Object} inputValues - {x: value, ...}
   * @returns {Number} Result
   */
  evaluate(inputValues) {
    const validation = this.validateInputs(inputValues);
    if (validation !== true) throw new Error(validation);

    // Simple evaluator for common patterns
    if (this.expression.includes('x^2')) {
      // Quadratic: ax^2 + bx + c
      const x = inputValues[this.inputs[0].name];
      return this.coefficients.a * x * x + this.coefficients.b * x + this.coefficients.c;
    } else if (this.expression.includes('x')) {
      // Linear: ax + b
      const x = inputValues[this.inputs[0].name];
      return this.coefficients.a * x + this.coefficients.b;
    } else if (this.expression.includes('sin')) {
      // Sinusoidal: A*sin(ω*x + φ) + offset
      const x = inputValues[this.inputs[0].name];
      return this.coefficients.A * Math.sin(this.coefficients.omega * x + this.coefficients.phi) + this.coefficients.offset;
    } else if (this.expression.includes('e^')) {
      // Exponential: a*e^(b*x)
      const x = inputValues[this.inputs[0].name];
      return this.coefficients.a * Math.exp(this.coefficients.b * x);
    }

    throw new Error(`Cannot evaluate expression: ${this.expression}`);
  }

  toJSON() {
    return {
      ...super.toJSON(),
      expression: this.expression,
      coefficients: this.coefficients
    };
  }
}

/**
 * Lookup Table Proxy: discrete input-output mapping
 * Useful for previously computed simulation results
 */
export class LookupTableProxy extends ProxyDefinition {
  constructor({
    proxyId = uuidv4(),
    table = [],
    ...rest
  } = {}) {
    super({ proxyId, type: PROXY_TYPES.LOOKUP_TABLE, ...rest });
    this.table = table; // Array of {inputs: {x: value}, outputs: {y: value}}
  }

  /**
   * Find closest entry in lookup table (nearest neighbor)
   * @param {Object} inputValues - {x: value, ...}
   * @returns {Object} {inputs, outputs, distance}
   */
  lookup(inputValues) {
    const validation = this.validateInputs(inputValues);
    if (validation !== true) throw new Error(validation);

    let closestEntry = null;
    let minDistance = Infinity;

    for (const entry of this.table) {
      let distance = 0;
      for (const [key, value] of Object.entries(inputValues)) {
        distance += Math.pow(value - (entry.inputs[key] || 0), 2);
      }
      distance = Math.sqrt(distance);

      if (distance < minDistance) {
        minDistance = distance;
        closestEntry = entry;
      }
    }

    if (!closestEntry) {
      throw new Error('Lookup table is empty or no matching entry found');
    }

    return { ...closestEntry, distance: minDistance };
  }

  /**
   * Add entry to lookup table
   * @param {Object} inputs - {x: value, ...}
   * @param {Object} outputs - {y: value, ...}
   */
  addEntry(inputs, outputs) {
    this.table.push({ inputs, outputs });
  }

  toJSON() {
    return {
      ...super.toJSON(),
      table: this.table
    };
  }
}

/**
 * Neural Network Proxy: learned function via weights + activation
 * Simplified single-layer implementation
 */
export class NeuralNetworkProxy extends ProxyDefinition {
  constructor({
    proxyId = uuidv4(),
    weights = [],
    biases = [],
    activation = 'relu',
    ...rest
  } = {}) {
    super({ proxyId, type: PROXY_TYPES.NEURAL_NETWORK, ...rest });
    this.weights = weights; // Array of weight matrices
    this.biases = biases; // Array of bias vectors
    this.activation = activation; // 'relu', 'sigmoid', 'tanh'
  }

  /**
   * Forward pass through network
   * @param {Array} inputVector - Input values
   * @returns {Array} Output values
   */
  forward(inputVector) {
    let x = inputVector;

    for (let layer = 0; layer < this.weights.length; layer++) {
      // Matrix multiply: x = weights[layer] @ x + biases[layer]
      const output = [];
      const W = this.weights[layer];
      const b = this.biases[layer] || [];

      for (let i = 0; i < W.length; i++) {
        let sum = b[i] || 0;
        for (let j = 0; j < x.length; j++) {
          sum += W[i][j] * x[j];
        }
        output.push(this._applyActivation(sum, this.activation));
      }

      x = output;
    }

    return x;
  }

  /**
   * Apply activation function
   */
  _applyActivation(value, activation) {
    switch (activation) {
      case 'relu':
        return Math.max(0, value);
      case 'sigmoid':
        return 1 / (1 + Math.exp(-value));
      case 'tanh':
        return Math.tanh(value);
      default:
        return value;
    }
  }

  /**
   * Evaluate with input mapping to network
   * @param {Object} inputValues - {inputName: value, ...}
   * @returns {Object} {outputName: value, ...}
   */
  evaluate(inputValues) {
    const validation = this.validateInputs(inputValues);
    if (validation !== true) throw new Error(validation);

    // Convert input object to vector
    const inputVector = this.inputs.map(inputDef => inputValues[inputDef.name]);

    // Forward pass
    const outputVector = this.forward(inputVector);

    // Convert output vector to object
    const result = {};
    this.outputs.forEach((outputDef, idx) => {
      result[outputDef.name] = outputVector[idx] || 0;
    });

    return result;
  }

  toJSON() {
    return {
      ...super.toJSON(),
      weights: this.weights,
      biases: this.biases,
      activation: this.activation
    };
  }
}

/**
 * Geometric Transform Proxy: spatial transformations (rotation, scale, translation)
 */
export class GeometricTransformProxy extends ProxyDefinition {
  constructor({
    proxyId = uuidv4(),
    transformType = 'rotation', // 'rotation', 'scale', 'translation'
    matrix = [],
    ...rest
  } = {}) {
    super({ proxyId, type: PROXY_TYPES.GEOMETRIC_TRANSFORM, ...rest });
    this.transformType = transformType;
    this.matrix = matrix; // 3x3 or 4x4 transformation matrix
  }

  /**
   * Apply geometric transformation to point/vector
   * @param {Array} point - [x, y, z] or [x, y]
   * @returns {Array} Transformed point
   */
  transform(point) {
    if (this.matrix.length === 0) {
      throw new Error('Transformation matrix not initialized');
    }

    // Matrix multiplication
    const result = [];
    const dim = Math.min(this.matrix.length, point.length);

    for (let i = 0; i < dim; i++) {
      let sum = 0;
      for (let j = 0; j < point.length; j++) {
        sum += this.matrix[i][j] * point[j];
      }
      result.push(sum);
    }

    return result;
  }

  /**
   * Evaluate: transform input point
   * @param {Object} inputValues - {x: number, y: number, z?: number}
   * @returns {Object} Transformed point
   */
  evaluate(inputValues) {
    const validation = this.validateInputs(inputValues);
    if (validation !== true) throw new Error(validation);

    const point = this.inputs.map(inputDef => inputValues[inputDef.name]);
    const transformed = this.transform(point);

    const result = {};
    this.outputs.forEach((outputDef, idx) => {
      result[outputDef.name] = transformed[idx] || 0;
    });

    return result;
  }

  toJSON() {
    return {
      ...super.toJSON(),
      transformType: this.transformType,
      matrix: this.matrix
    };
  }
}

/**
 * Proxy Factory: create proxy from type and parameters
 */
export function createProxy(type, params = {}) {
  switch (type) {
    case PROXY_TYPES.ALGEBRAIC:
      return new AlgebraicExpressionProxy(params);
    case PROXY_TYPES.LOOKUP_TABLE:
      return new LookupTableProxy(params);
    case PROXY_TYPES.NEURAL_NETWORK:
      return new NeuralNetworkProxy(params);
    case PROXY_TYPES.GEOMETRIC_TRANSFORM:
      return new GeometricTransformProxy(params);
    default:
      throw new Error(`Unknown proxy type: ${type}`);
  }
}

/**
 * Validate proxy definition structure
 * @param {Object} proxyDef - Proxy definition to validate
 * @returns {Boolean|String} true or error message
 */
export function validateProxyDefinition(proxyDef) {
  if (!proxyDef.proxyId) return 'Missing proxyId';
  if (!proxyDef.type) return 'Missing type';
  if (!Object.values(PROXY_TYPES).includes(proxyDef.type)) {
    return `Invalid type: ${proxyDef.type}`;
  }
  if (!Array.isArray(proxyDef.inputs)) return 'inputs must be an array';
  if (!Array.isArray(proxyDef.outputs)) return 'outputs must be an array';
  if (proxyDef.inputs.length === 0) return 'At least one input required';
  if (proxyDef.outputs.length === 0) return 'At least one output required';

  return true;
}

export default {
  ProxyDefinition,
  AlgebraicExpressionProxy,
  LookupTableProxy,
  NeuralNetworkProxy,
  GeometricTransformProxy,
  PROXY_TYPES,
  createProxy,
  validateProxyDefinition
};
