/**
 * Quantum Metrics & Monitoring
 * Phase 55: Quantum Computing Simulation & Adaptive Security
 * 
 * Provides observability into quantum systems:
 * - Quantum circuit performance metrics
 * - Entanglement tracking and measurement
 * - Decoherence rate estimation
 * - State fidelity monitoring
 * - Real-time anomaly detection
 * - Alerting and dashboards
 * 
 * @module quantum-metrics
 */

const EventEmitter = require('events');

/**
 * Quantum Metrics Collector - tracks quantum system metrics
 */
class QuantumMetricsCollector extends EventEmitter {
  constructor(circuitName) {
    super();
    this.circuitName = circuitName;
    this.metrics = {
      circuitDepth: 0,
      numQubits: 0,
      numGates: 0,
      superpositionEntropy: 0,
      entanglementMeasure: 0,
      coherenceTime: 0,
      errorRate: 0,
      measuredQubits: new Set(),
      measurements: []
    };
    this.timeSeries = [];
    this.startTime = Date.now();
  }

  /**
   * Record metrics from quantum circuit
   */
  recordMetrics(circuit) {
    const stats = circuit.getStatistics();
    const entanglementInfo = circuit.getEntanglementInfo();

    const measurement = {
      timestamp: Date.now(),
      timeSinceStart: Date.now() - this.startTime,
      circuitDepth: stats.depth,
      numGates: stats.numGates,
      numQubits: stats.numQubits,
      superpositionEntropy: stats.superpositionEntropy,
      entanglementMeasure: entanglementInfo.entanglementMeasure,
      measuredQubits: circuit.measurementResults.size
    };

    this.metrics = {
      circuitDepth: stats.depth,
      numQubits: stats.numQubits,
      numGates: stats.numGates,
      superpositionEntropy: stats.superpositionEntropy,
      entanglementMeasure: entanglementInfo.entanglementMeasure,
      lastMeasurementTime: measurement.timestamp,
      measurements: (this.metrics.measurements || []) + 1
    };

    this.timeSeries.push(measurement);
    this.emit('metrics-recorded', measurement);

    return measurement;
  }

  /**
   * Calculate average metrics over time window
   */
  getAverageMetrics(windowMs = 60000) {
    const cutoff = Date.now() - windowMs;
    const recentMeasurements = this.timeSeries.filter(m => m.timestamp > cutoff);

    if (recentMeasurements.length === 0) {
      return null;
    }

    const avg = {
      avgCircuitDepth: recentMeasurements.reduce((sum, m) => sum + m.circuitDepth, 0) / recentMeasurements.length,
      avgEntropy: recentMeasurements.reduce((sum, m) => sum + m.superpositionEntropy, 0) / recentMeasurements.length,
      avgEntanglement: recentMeasurements.reduce((sum, m) => sum + m.entanglementMeasure, 0) / recentMeasurements.length,
      sampleCount: recentMeasurements.length
    };

    return avg;
  }

  /**
   * Get time series data
   */
  getTimeSeries(limit = 100) {
    return this.timeSeries.slice(-limit);
  }

  /**
   * Clear metrics
   */
  clear() {
    this.timeSeries = [];
    this.startTime = Date.now();
  }
}

/**
 * Entanglement Tracker - monitors quantum entanglement state
 */
class EntanglementTracker extends EventEmitter {
  constructor() {
    super();
    this.entangledPairs = new Map(); // Maps qubit pairs to entanglement degree
    this.entanglementHistory = [];
  }

  /**
   * Record entanglement between qubit pair
   */
  recordEntanglement(qubit1, qubit2, degree = 1.0) {
    const key = `${Math.min(qubit1, qubit2)}-${Math.max(qubit1, qubit2)}`;

    if (!this.entangledPairs.has(key)) {
      this.entangledPairs.set(key, 0);
    }

    const newDegree = this.entangledPairs.get(key) + degree;
    this.entangledPairs.set(key, Math.min(newDegree, 1.0)); // Cap at 1.0

    const record = {
      timestamp: Date.now(),
      qubit1,
      qubit2,
      degree: newDegree,
      type: 'entanglement-recorded'
    };

    this.entanglementHistory.push(record);
    this.emit('entanglement-changed', record);

    return record;
  }

  /**
   * Get entanglement between specific qubits
   */
  getEntanglement(qubit1, qubit2) {
    const key = `${Math.min(qubit1, qubit2)}-${Math.max(qubit1, qubit2)}`;
    return this.entangledPairs.get(key) || 0;
  }

  /**
   * Measure bipartite entanglement (simplified concurrence)
   */
  calculateConcurrence(qubit1, qubit2) {
    const degree = this.getEntanglement(qubit1, qubit2);
    // Concurrence = 0 for separable, 1 for maximally entangled
    return degree;
  }

  /**
   * Get all entangled pairs
   */
  getEntangledPairs() {
    const pairs = [];
    for (const [key, degree] of this.entangledPairs) {
      if (degree > 0.1) { // Only include significant entanglement
        const [q1, q2] = key.split('-').map(Number);
        pairs.push({ qubit1: q1, qubit2: q2, degree });
      }
    }
    return pairs;
  }

  /**
   * Calculate total entanglement entropy
   */
  getTotalEntanglementEntropy() {
    let entropy = 0;
    for (const degree of this.entangledPairs.values()) {
      if (degree > 0.01) {
        entropy -= degree * Math.log2(degree) + (1 - degree) * Math.log2(1 - degree);
      }
    }
    return entropy;
  }

  /**
   * Clear history
   */
  clear() {
    this.entangledPairs.clear();
    this.entanglementHistory = [];
  }
}

/**
 * Decoherence Monitor - tracks quantum state degradation
 */
class DecoherenceMonitor extends EventEmitter {
  constructor(params = {}) {
    super();
    this.T1 = params.T1 || 20000; // Amplitude damping time (ms)
    this.T2 = params.T2 || 10000; // Dephasing time (ms)
    this.errorRate = params.errorRate || 0.001; // Error probability per gate
    this.lastResetTime = Date.now();
    this.decoherenceEvents = [];
  }

  /**
   * Simulate decoherence over time period
   */
  simulateDecoherence(timePeriodMs) {
    // Exponential decay: fidelity = exp(-t/T)
    const amplitudeDamping = Math.exp(-timePeriodMs / this.T1);
    const dephasing = Math.exp(-timePeriodMs / this.T2);

    // Combined effect (simplified)
    const fidelity = amplitudeDamping * dephasing;

    const event = {
      timestamp: Date.now(),
      timePeriodMs,
      amplitudeDamping,
      dephasing,
      fidelity,
      noiseLevel: 1 - fidelity
    };

    this.decoherenceEvents.push(event);
    this.emit('decoherence-event', event);

    return event;
  }

  /**
   * Estimate error accumulation from gate depth
   */
  estimateGateErrors(gateCount) {
    // Errors accumulate linearly with gate count
    const totalErrorRate = 1 - Math.pow(1 - this.errorRate, gateCount);
    return totalErrorRate;
  }

  /**
   * Calculate decoherence time to reach error threshold
   */
  timeToErrorThreshold(threshold = 0.1) {
    // Solve: 1 - exp(-t/T2) = threshold
    const T_eff = Math.min(this.T1, this.T2);
    const timeMs = -T_eff * Math.log(1 - threshold);
    return timeMs;
  }

  /**
   * Get decoherence statistics
   */
  getStatistics() {
    if (this.decoherenceEvents.length === 0) {
      return null;
    }

    const events = this.decoherenceEvents;
    const avgFidelity = events.reduce((sum, e) => sum + e.fidelity, 0) / events.length;
    const maxNoiseLevel = Math.max(...events.map(e => e.noiseLevel));

    return {
      T1: this.T1,
      T2: this.T2,
      errorRate: this.errorRate,
      averageFidelity: avgFidelity,
      maxNoiseLevel,
      eventsRecorded: events.length,
      timeToThreshold: this.timeToErrorThreshold(0.1)
    };
  }

  /**
   * Clear history
   */
  clear() {
    this.decoherenceEvents = [];
  }
}

/**
 * Fidelity Monitor - tracks quantum state quality
 */
class FidelityMonitor extends EventEmitter {
  constructor() {
    super();
    this.fidelityHistory = [];
    this.targetStates = new Map(); // Store reference states for comparison
  }

  /**
   * Register target state for fidelity comparison
   */
  registerTargetState(stateId, stateVector) {
    this.targetStates.set(stateId, stateVector.clone());
  }

  /**
   * Measure fidelity between current state and target
   */
  measureFidelity(stateId, currentState) {
    const targetState = this.targetStates.get(stateId);
    
    if (!targetState) {
      throw new Error(`Unknown state ID: ${stateId}`);
    }

    if (targetState.numQubits !== currentState.numQubits) {
      throw new Error('State dimension mismatch');
    }

    // Calculate fidelity: F = |⟨ψ|φ⟩|^2
    let innerProduct = 0;
    for (let i = 0; i < targetState.dimension; i++) {
      const targetAmp = targetState.getAmplitude(i);
      const currentAmp = currentState.getAmplitude(i);
      
      // ⟨ψ|φ⟩ = sum(ψ*_i * φ_i)
      innerProduct += targetAmp.conjugate().multiply(currentAmp).real;
    }

    const fidelity = Math.pow(Math.abs(innerProduct), 2);

    const measurement = {
      timestamp: Date.now(),
      stateId,
      fidelity,
      purity: this._calculatePurity(currentState)
    };

    this.fidelityHistory.push(measurement);
    this.emit('fidelity-measured', measurement);

    return measurement;
  }

  /**
   * Calculate purity of state: P = Tr(ρ^2)
   */
  _calculatePurity(state) {
    let purity = 0;
    for (let i = 0; i < state.dimension; i++) {
      const prob = state.getProbability(i);
      purity += prob * prob;
    }
    return purity;
  }

  /**
   * Get fidelity statistics
   */
  getStatistics() {
    if (this.fidelityHistory.length === 0) {
      return null;
    }

    const fidelities = this.fidelityHistory.map(m => m.fidelity);
    const avg = fidelities.reduce((sum, f) => sum + f) / fidelities.length;
    const min = Math.min(...fidelities);
    const max = Math.max(...fidelities);

    return {
      averageFidelity: avg,
      minFidelity: min,
      maxFidelity: max,
      measurements: this.fidelityHistory.length
    };
  }

  /**
   * Clear history
   */
  clear() {
    this.fidelityHistory = [];
    this.targetStates.clear();
  }
}

/**
 * Quantum Monitoring Dashboard - aggregates all metrics
 */
class QuantumMonitoringDashboard extends EventEmitter {
  constructor() {
    super();
    this.collectors = new Map();
    this.entanglementTracker = new EntanglementTracker();
    this.decoherenceMonitor = new DecoherenceMonitor();
    this.fidelityMonitor = new FidelityMonitor();
    this.alerts = [];
    this.thresholds = {
      maxEntropy: 3.0,
      minFidelity: 0.9,
      maxErrorRate: 0.05,
      maxDecoherence: 0.2
    };
  }

  /**
   * Create metrics collector for circuit
   */
  createCollector(circuitName) {
    const collector = new QuantumMetricsCollector(circuitName);
    this.collectors.set(circuitName, collector);
    return collector;
  }

  /**
   * Get collector by name
   */
  getCollector(circuitName) {
    return this.collectors.get(circuitName);
  }

  /**
   * Check metrics for anomalies
   */
  checkAnomalies() {
    const issues = [];

    for (const [name, collector] of this.collectors) {
      const metrics = collector.metrics;

      // Check entropy threshold
      if (metrics.superpositionEntropy > this.thresholds.maxEntropy) {
        issues.push({
          type: 'high-entropy',
          circuit: name,
          value: metrics.superpositionEntropy,
          threshold: this.thresholds.maxEntropy,
          severity: 'warning'
        });
      }

      // Check entanglement level
      if (metrics.entanglementMeasure > 5) { // Excessive entanglement
        issues.push({
          type: 'excessive-entanglement',
          circuit: name,
          value: metrics.entanglementMeasure,
          severity: 'warning'
        });
      }
    }

    return issues;
  }

  /**
   * Generate health report
   */
  generateHealthReport() {
    const report = {
      timestamp: Date.now(),
      circuits: {},
      entanglement: {},
      decoherence: {},
      alerts: []
    };

    // Circuit metrics
    for (const [name, collector] of this.collectors) {
      const avgMetrics = collector.getAverageMetrics(60000);
      if (avgMetrics) {
        report.circuits[name] = avgMetrics;
      }
    }

    // Entanglement status
    report.entanglement = {
      entangledPairs: this.entanglementTracker.getEntangledPairs(),
      totalEntropy: this.entanglementTracker.getTotalEntanglementEntropy()
    };

    // Decoherence status
    const decoStats = this.decoherenceMonitor.getStatistics();
    if (decoStats) {
      report.decoherence = decoStats;
    }

    // Check for issues
    report.alerts = this.checkAnomalies();

    return report;
  }

  /**
   * Get dashboard snapshot
   */
  getSnapshot() {
    return {
      timestamp: Date.now(),
      circulitMetrics: Array.from(this.collectors.entries()).map(([name, collector]) => ({
        name,
        metrics: collector.metrics
      })),
      entanglement: this.entanglementTracker.getEntangledPairs(),
      decoherence: this.decoherenceMonitor.getStatistics(),
      fidelity: this.fidelityMonitor.getStatistics(),
      anomalies: this.checkAnomalies()
    };
  }

  /**
   * Enable metric recording
   */
  enableMetricRecording(circuitName, interval = 5000) {
    const collector = this.getCollector(circuitName);
    if (!collector) return;

    const intervalId = setInterval(() => {
      // Record metrics would be called externally
      this.emit('metric-recording-tick', { circuit: circuitName });
    }, interval);

    return intervalId;
  }

  /**
   * Clear all data
   */
  clear() {
    this.collectors.clear();
    this.entanglementTracker.clear();
    this.decoherenceMonitor.clear();
    this.fidelityMonitor.clear();
    this.alerts = [];
  }
}

/**
 * Quantum Performance Analyzer - analyzes quantum algorithm performance
 */
class QuantumPerformanceAnalyzer {
  /**
   * Analyze circuit efficiency
   */
  static analyzeCircuitEfficiency(circuit) {
    const stats = circuit.getStatistics();

    return {
      depth: stats.depth,
      gates: stats.numGates,
      qubits: stats.numQubits,
      depthToQubitsRatio: stats.depth / stats.numQubits,
      gatesPerQubit: stats.numGates / stats.numQubits,
      efficiency: this._calculateEfficiency(stats)
    };
  }

  /**
   * Calculate efficiency score (0-1)
   */
  static _calculateEfficiency(stats) {
    // Lower depth and gates = higher efficiency
    // Entropy indicates utilization of superposition
    const depthScore = Math.max(0, 1 - (stats.depth / 100));
    const entropyScore = Math.min(stats.superpositionEntropy / 2, 1);
    
    return (depthScore + entropyScore) / 2;
  }

  /**
   * Estimate quantum speedup
   */
  static estimateSpeedup(quantumGates, classicalGates) {
    // Simplified: quantum advantage roughly proportional to gate count ratio
    return Math.sqrt(classicalGates / (quantumGates || 1));
  }

  /**
   * Get optimization suggestions
   */
  static getSuggestions(circuit) {
    const suggestions = [];
    const stats = circuit.getStatistics();

    if (stats.depth > 50) {
      suggestions.push({
        type: 'deep-circuit',
        severity: 'warning',
        message: 'Circuit depth is high. Consider gate fusion or algorithm optimization.'
      });
    }

    if (stats.superpositionEntropy < 0.5) {
      suggestions.push({
        type: 'low-superposition',
        severity: 'info',
        message: 'Low superposition utilization. Consider adding more Hadamard gates.'
      });
    }

    if (stats.entanglementMeasure > 8) {
      suggestions.push({
        type: 'high-entanglement',
        severity: 'warning',
        message: 'High entanglement may increase decoherence. Review circuit design.'
      });
    }

    return suggestions;
  }
}

module.exports = {
  QuantumMetricsCollector,
  EntanglementTracker,
  DecoherenceMonitor,
  FidelityMonitor,
  QuantumMonitoringDashboard,
  QuantumPerformanceAnalyzer
};
