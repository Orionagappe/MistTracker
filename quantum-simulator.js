/**
 * Quantum Simulator Core Engine
 * Phase 55: Quantum Computing Simulation & Adaptive Security
 * 
 * Implements fundamental quantum computing primitives:
 * - Qubit representation and state vectors
 * - Quantum gates (single and multi-qubit)
 * - Circuit execution and measurement
 * - Entanglement tracking
 * - Superposition management
 * - Bell state generation and testing
 * 
 * @module quantum-simulator
 */

const EventEmitter = require('events');

/**
 * Complex number utility class for quantum state calculations
 */
class Complex {
  constructor(real = 0, imag = 0) {
    this.real = real;
    this.imag = imag;
  }

  // Addition: (a+bi) + (c+di) = (a+c) + (b+d)i
  add(other) {
    return new Complex(this.real + other.real, this.imag + other.imag);
  }

  // Multiplication: (a+bi)(c+di) = (ac-bd) + (ad+bc)i
  multiply(other) {
    return new Complex(
      this.real * other.real - this.imag * other.imag,
      this.real * other.imag + this.imag * other.real
    );
  }

  // Conjugate: (a+bi)* = a-bi
  conjugate() {
    return new Complex(this.real, -this.imag);
  }

  // Magnitude: |a+bi| = sqrt(a^2 + b^2)
  magnitude() {
    return Math.sqrt(this.real * this.real + this.imag * this.imag);
  }

  // Magnitude squared (probability)
  magnitudeSquared() {
    return this.real * this.real + this.imag * this.imag;
  }

  // Inner product contribution
  dotProduct(other) {
    return this.conjugate().multiply(other).real;
  }

  clone() {
    return new Complex(this.real, this.imag);
  }

  toString() {
    const sign = this.imag >= 0 ? '+' : '-';
    return `${this.real.toFixed(4)}${sign}${Math.abs(this.imag).toFixed(4)}i`;
  }
}

/**
 * Quantum State Vector - 2^n dimensional state representation
 */
class StateVector {
  constructor(numQubits) {
    this.numQubits = numQubits;
    this.dimension = Math.pow(2, numQubits);
    this.amplitudes = new Array(this.dimension).fill(null).map(() => new Complex());
    
    // Initialize to |0...0⟩ state
    this.amplitudes[0] = new Complex(1, 0);
    this.entanglement = new Set();
  }

  /**
   * Get amplitude for computational basis state |i⟩
   */
  getAmplitude(index) {
    if (index < 0 || index >= this.dimension) {
      throw new Error(`Index ${index} out of range [0, ${this.dimension})`);
    }
    return this.amplitudes[index];
  }

  /**
   * Set amplitude for computational basis state
   */
  setAmplitude(index, amplitude) {
    if (index < 0 || index >= this.dimension) {
      throw new Error(`Index ${index} out of range [0, ${this.dimension})`);
    }
    this.amplitudes[index] = amplitude.clone();
  }

  /**
   * Get probability of measuring state |i⟩
   */
  getProbability(index) {
    return this.getAmplitude(index).magnitudeSquared();
  }

  /**
   * Normalize state vector to unit length
   */
  normalize() {
    let normSquared = 0;
    for (const amplitude of this.amplitudes) {
      normSquared += amplitude.magnitudeSquared();
    }
    
    if (Math.abs(normSquared - 1.0) < 1e-10) return; // Already normalized
    
    const norm = Math.sqrt(normSquared);
    for (let i = 0; i < this.amplitudes.length; i++) {
      this.amplitudes[i] = this.amplitudes[i].multiply(new Complex(1 / norm, 0));
    }
  }

  /**
   * Clone state vector
   */
  clone() {
    const clone = new StateVector(this.numQubits);
    clone.amplitudes = this.amplitudes.map(a => a.clone());
    clone.entanglement = new Set(this.entanglement);
    return clone;
  }

  /**
   * Get superposition entropy (Shannon entropy of probabilities)
   */
  getSuperpositionEntropy() {
    let entropy = 0;
    for (let i = 0; i < this.dimension; i++) {
      const prob = this.getProbability(i);
      if (prob > 1e-10) {
        entropy -= prob * Math.log2(prob);
      }
    }
    return entropy;
  }

  /**
   * Get entanglement measure (trace distance to separable states)
   */
  getEntanglementMeasure() {
    if (this.entanglement.size === 0) return 0;
    // Simplified: return number of entangled qubit pairs
    return this.entanglement.size;
  }

  toString() {
    let result = '';
    for (let i = 0; i < Math.min(this.dimension, 8); i++) {
      const prob = this.getProbability(i);
      if (prob > 0.01) {
        const bits = i.toString(2).padStart(this.numQubits, '0');
        result += `|${bits}⟩: ${prob.toFixed(4)}\n`;
      }
    }
    return result;
  }
}

/**
 * Quantum Gate - unitary transformation on state vector
 */
class QuantumGate {
  constructor(name, matrix, numQubits) {
    this.name = name;
    this.matrix = matrix; // 2D array of Complex numbers
    this.numQubits = numQubits;
    this.size = Math.pow(2, numQubits);
  }

  /**
   * Apply gate to target qubits
   */
  apply(state, targetQubits) {
    if (targetQubits.length !== this.numQubits) {
      throw new Error(`Gate expects ${this.numQubits} qubits, got ${targetQubits.length}`);
    }

    // For single-qubit gates, apply to each computational basis state
    if (this.numQubits === 1) {
      return this._applySingleQubit(state, targetQubits[0]);
    }

    // For multi-qubit gates (CNOT, etc.)
    return this._applyMultiQubit(state, targetQubits);
  }

  /**
   * Apply single-qubit gate
   */
  _applySingleQubit(state, target) {
    const newState = state.clone();
    const newAmplitudes = new Array(state.dimension).fill(null).map(() => new Complex());

    for (let i = 0; i < state.dimension; i++) {
      let bitValue = (i >> target) & 1;

      for (let j = 0; j < 2; j++) {
        const sourceIndex = i ^ ((j ^ bitValue) << target);
        const amplitude = state.getAmplitude(sourceIndex);
        const matrixElement = this.matrix[j][bitValue];
        newAmplitudes[i] = newAmplitudes[i].add(
          matrixElement.multiply(amplitude)
        );
      }
    }

    for (let i = 0; i < state.dimension; i++) {
      newState.setAmplitude(i, newAmplitudes[i]);
    }

    return newState;
  }

  /**
   * Apply multi-qubit gate
   */
  _applyMultiQubit(state, targetQubits) {
    const newState = state.clone();
    const newAmplitudes = new Array(state.dimension).fill(null).map(() => new Complex());

    for (let i = 0; i < state.dimension; i++) {
      let targetMask = 0;
      for (const target of targetQubits) {
        targetMask |= ((i >> target) & 1) << targetQubits.indexOf(target);
      }

      for (let j = 0; j < this.size; j++) {
        let sourceMask = j;
        let sourceIndex = i;

        for (let k = 0; k < targetQubits.length; k++) {
          const bit = (sourceMask >> k) & 1;
          sourceIndex &= ~(1 << targetQubits[k]);
          sourceIndex |= bit << targetQubits[k];
        }

        const amplitude = state.getAmplitude(sourceIndex);
        const matrixElement = this.matrix[targetMask][j];
        newAmplitudes[i] = newAmplitudes[i].add(
          matrixElement.multiply(amplitude)
        );
      }
    }

    for (let i = 0; i < state.dimension; i++) {
      newState.setAmplitude(i, newAmplitudes[i]);
    }

    return newState;
  }
}

/**
 * Quantum Circuit - sequence of gates applied to qubits
 */
class QuantumCircuit extends EventEmitter {
  constructor(numQubits) {
    super();
    this.numQubits = numQubits;
    this.state = new StateVector(numQubits);
    this.gates = [];
    this.measurementResults = new Map();
    this.measurements = [];
  }

  /**
   * Add gate to circuit
   */
  addGate(gate, targetQubits) {
    this.gates.push({ gate, targetQubits });
    this.state = gate.apply(this.state, targetQubits);
    this.emit('gate-applied', { gate: gate.name, targets: targetQubits });
    return this;
  }

  /**
   * Add Hadamard gate (creates superposition)
   */
  h(qubit) {
    const sqrt2inv = 1 / Math.sqrt(2);
    const hadamard = new QuantumGate('H', [
      [new Complex(sqrt2inv, 0), new Complex(sqrt2inv, 0)],
      [new Complex(sqrt2inv, 0), new Complex(-sqrt2inv, 0)]
    ], 1);
    return this.addGate(hadamard, [qubit]);
  }

  /**
   * Add Pauli X gate (bit flip)
   */
  x(qubit) {
    const pauliX = new QuantumGate('X', [
      [new Complex(0, 0), new Complex(1, 0)],
      [new Complex(1, 0), new Complex(0, 0)]
    ], 1);
    return this.addGate(pauliX, [qubit]);
  }

  /**
   * Add Pauli Y gate
   */
  y(qubit) {
    const pauliY = new QuantumGate('Y', [
      [new Complex(0, 0), new Complex(0, -1)],
      [new Complex(0, 1), new Complex(0, 0)]
    ], 1);
    return this.addGate(pauliY, [qubit]);
  }

  /**
   * Add Pauli Z gate
   */
  z(qubit) {
    const pauliZ = new QuantumGate('Z', [
      [new Complex(1, 0), new Complex(0, 0)],
      [new Complex(0, 0), new Complex(-1, 0)]
    ], 1);
    return this.addGate(pauliZ, [qubit]);
  }

  /**
   * Add phase gate S
   */
  s(qubit) {
    const phaseGate = new QuantumGate('S', [
      [new Complex(1, 0), new Complex(0, 0)],
      [new Complex(0, 0), new Complex(0, 1)]
    ], 1);
    return this.addGate(phaseGate, [qubit]);
  }

  /**
   * Add Toffoli gate (controlled controlled NOT)
   */
  ccx(control1, control2, target) {
    // Simplified 3-qubit gate implementation
    const ccxMatrix = this._createToffoliMatrix();
    const ccxGate = new QuantumGate('CCX', ccxMatrix, 3);
    return this.addGate(ccxGate, [control1, control2, target]);
  }

  /**
   * Add CNOT gate (controlled NOT)
   */
  cnot(control, target) {
    const cnotMatrix = [
      [new Complex(1, 0), new Complex(0, 0), new Complex(0, 0), new Complex(0, 0)],
      [new Complex(0, 0), new Complex(1, 0), new Complex(0, 0), new Complex(0, 0)],
      [new Complex(0, 0), new Complex(0, 0), new Complex(0, 0), new Complex(1, 0)],
      [new Complex(0, 0), new Complex(0, 0), new Complex(1, 0), new Complex(0, 0)]
    ];
    const cnotGate = new QuantumGate('CNOT', cnotMatrix, 2);
    return this.addGate(cnotGate, [control, target]);
  }

  /**
   * Create Toffoli matrix (8x8)
   */
  _createToffoliMatrix() {
    const matrix = [];
    for (let i = 0; i < 8; i++) {
      matrix[i] = [];
      for (let j = 0; j < 8; j++) {
        if (i === j) {
          // If both controls are 1 and this is the target row, flip
          if (i === 6 || i === 7) {
            matrix[i][j] = i === 6 ? new Complex(0, 0) : new Complex(1, 0);
          } else {
            matrix[i][j] = new Complex(1, 0);
          }
        } else if ((i === 6 && j === 7) || (i === 7 && j === 6)) {
          matrix[i][j] = new Complex(1, 0);
        } else {
          matrix[i][j] = new Complex(0, 0);
        }
      }
    }
    return matrix;
  }

  /**
   * Measure qubit (collapse superposition)
   */
  measure(qubit) {
    const probabilities = new Map();
    
    for (let i = 0; i < this.state.dimension; i++) {
      const bit = (i >> qubit) & 1;
      const prob = this.state.getProbability(i);
      probabilities.set(bit, (probabilities.get(bit) || 0) + prob);
    }

    // Randomly select outcome based on probabilities
    const random = Math.random();
    let cumulative = 0;
    let outcome = 0;

    for (const [bit, prob] of probabilities) {
      cumulative += prob;
      if (random < cumulative) {
        outcome = bit;
        break;
      }
    }

    // Collapse state
    const collapsedState = new StateVector(this.numQubits);
    for (let i = 0; i < this.state.dimension; i++) {
      if (((i >> qubit) & 1) === outcome) {
        collapsedState.setAmplitude(i, this.state.getAmplitude(i));
      }
    }
    collapsedState.normalize();

    this.state = collapsedState;
    this.measurements.push({ qubit, outcome });
    this.measurementResults.set(qubit, outcome);
    this.emit('measurement', { qubit, outcome });

    return outcome;
  }

  /**
   * Measure all qubits
   */
  measureAll() {
    const results = [];
    for (let i = 0; i < this.numQubits; i++) {
      results.push(this.measure(i));
    }
    return results;
  }

  /**
   * Get current state probabilities
   */
  getProbabilities() {
    const probs = {};
    for (let i = 0; i < this.state.dimension; i++) {
      const prob = this.state.getProbability(i);
      if (prob > 1e-10) {
        probs[i.toString(2).padStart(this.numQubits, '0')] = prob;
      }
    }
    return probs;
  }

  /**
   * Get entanglement information
   */
  getEntanglementInfo() {
    return {
      entangledQubits: Array.from(this.state.entanglement),
      entanglementMeasure: this.state.getEntanglementMeasure(),
      superpositionEntropy: this.state.getSuperpositionEntropy()
    };
  }

  /**
   * Get circuit depth (number of gate layers)
   */
  getDepth() {
    return this.gates.length;
  }

  /**
   * Get circuit statistics
   */
  getStatistics() {
    return {
      numQubits: this.numQubits,
      numGates: this.gates.length,
      depth: this.getDepth(),
      numMeasurements: this.measurements.length,
      superpositionEntropy: this.state.getSuperpositionEntropy(),
      entanglementMeasure: this.state.getEntanglementMeasure()
    };
  }
}

/**
 * Bell State Generator - creates maximally entangled states
 */
class BellStateGenerator {
  /**
   * Generate |Φ+⟩ = (|00⟩ + |11⟩)/√2
   */
  static generateBellPhiPlus(circuit, qubit1, qubit2) {
    circuit.h(qubit1);
    circuit.cnot(qubit1, qubit2);
    return circuit;
  }

  /**
   * Generate |Φ-⟩ = (|00⟩ - |11⟩)/√2
   */
  static generateBellPhiMinus(circuit, qubit1, qubit2) {
    circuit.h(qubit1);
    circuit.z(qubit1);
    circuit.cnot(qubit1, qubit2);
    return circuit;
  }

  /**
   * Generate |Ψ+⟩ = (|01⟩ + |10⟩)/√2
   */
  static generateBellPsiPlus(circuit, qubit1, qubit2) {
    circuit.x(qubit1);
    circuit.h(qubit1);
    circuit.cnot(qubit1, qubit2);
    return circuit;
  }

  /**
   * Generate |Ψ-⟩ = (|01⟩ - |10⟩)/√2
   */
  static generateBellPsiMinus(circuit, qubit1, qubit2) {
    circuit.x(qubit1);
    circuit.h(qubit1);
    circuit.z(qubit1);
    circuit.cnot(qubit1, qubit2);
    return circuit;
  }

  /**
   * Measure Bell state (determine which of 4 Bell states)
   */
  static measureBellState(circuit, qubit1, qubit2) {
    // Bell basis measurement (simplified)
    circuit.cnot(qubit1, qubit2);
    circuit.h(qubit1);
    
    const m1 = circuit.measure(qubit1);
    const m2 = circuit.measure(qubit2);
    
    return { m1, m2 };
  }
}

/**
 * Quantum Algorithm Runner - execute known quantum algorithms
 */
class QuantumAlgorithmRunner {
  /**
   * Deutsch-Jozsa algorithm (simplified 1-qubit version)
   */
  static deutschJozsa(isBalanced) {
    const circuit = new QuantumCircuit(2);
    
    // Initialize
    circuit.x(1); // Set ancilla to |1⟩
    circuit.h(0);
    circuit.h(1);

    // Oracle (simplified)
    if (isBalanced) {
      circuit.cnot(0, 1);
    }

    // Measurement
    circuit.h(0);
    const result = circuit.measure(0);
    
    return {
      circuit,
      result,
      isBalanced: result === 1
    };
  }

  /**
   * Grover's search (simplified for 4 items)
   */
  static groversSearch(targetIndex) {
    const circuit = new QuantumCircuit(2);
    
    // Equal superposition
    circuit.h(0);
    circuit.h(1);

    // Grover iteration (simplified)
    const numIterations = Math.floor(Math.PI / 4 * Math.sqrt(4));
    
    for (let i = 0; i < numIterations; i++) {
      // Oracle (mark target)
      if (targetIndex === 0) circuit.x(0); // Prepare |00⟩
      if (targetIndex === 1) { circuit.x(0); circuit.x(1); } // Prepare |01⟩
      if (targetIndex === 2) circuit.x(1); // Prepare |10⟩
      // etc.

      // Diffusion operator (simplified)
      circuit.h(0);
      circuit.h(1);
      circuit.x(0);
      circuit.x(1);
      circuit.cnot(0, 1);
      circuit.x(0);
      circuit.x(1);
      circuit.h(0);
      circuit.h(1);
    }

    const results = circuit.measureAll();
    return {
      circuit,
      results,
      targetFound: (results[0] * 2 + results[1]) === targetIndex
    };
  }

  /**
   * Quantum Fourier Transform (simplified)
   */
  static qft(circuit, qubits) {
    // Simplified QFT implementation
    for (const qubit of qubits) {
      circuit.h(qubit);
    }
    
    // Phase rotation (simplified)
    for (let i = 0; i < qubits.length; i++) {
      for (let j = i + 1; j < qubits.length; j++) {
        const angle = Math.PI / Math.pow(2, j - i);
        // Apply controlled phase (simplified)
      }
    }
    
    return circuit;
  }
}

module.exports = {
  Complex,
  StateVector,
  QuantumGate,
  QuantumCircuit,
  BellStateGenerator,
  QuantumAlgorithmRunner
};
