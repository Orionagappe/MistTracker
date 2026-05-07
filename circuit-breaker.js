/**
 * Circuit Breaker Pattern Implementation
 * Distributed circuit breaker for handling service failures gracefully
 * 
 * @file circuit-breaker.js
 * @version 1.0.0
 */

class CircuitBreaker {
  constructor(options = {}) {
    this.circuits = new Map();
    this.failureThreshold = options.failureThreshold || 50; // Percentage
    this.successThreshold = options.successThreshold || 5; // Number of successful calls
    this.timeout = options.timeout || 60000; // 60 seconds
    this.halfOpenMaxCalls = options.halfOpenMaxCalls || 3;
    this.metrics = {
      totalCircuits: 0,
      openCircuits: 0,
      halfOpenCircuits: 0,
      closedCircuits: 0,
    };
  }

  /**
   * Create a circuit for a service
   * @param {string} serviceId - Service identifier
   * @param {Object} config - Circuit configuration
   */
  createCircuit(serviceId, config = {}) {
    const circuit = {
      id: serviceId,
      state: 'CLOSED', // CLOSED, OPEN, HALF_OPEN
      failureCount: 0,
      successCount: 0,
      totalRequests: 0,
      lastFailureTime: null,
      openedAt: null,
      config: {
        failureThreshold: config.failureThreshold || this.failureThreshold,
        successThreshold: config.successThreshold || this.successThreshold,
        timeout: config.timeout || this.timeout,
        halfOpenMaxCalls: config.halfOpenMaxCalls || this.halfOpenMaxCalls,
      },
      metadata: {
        createdAt: new Date(),
        service: config.service || serviceId,
        environment: config.environment || 'production',
      },
    };

    this.circuits.set(serviceId, circuit);
    this.updateMetrics();

    return {
      success: true,
      circuitId: serviceId,
      state: circuit.state,
      created: circuit.metadata.createdAt,
    };
  }

  /**
   * Execute function with circuit breaker protection
   * @param {string} circuitId - Circuit ID
   * @param {Function} fn - Function to execute
   * @param {Object} context - Execution context
   * @returns {Promise} Result or rejection
   */
  async execute(circuitId, fn, context = {}) {
    const circuit = this.circuits.get(circuitId);

    if (!circuit) {
      throw new Error(`Circuit not found: ${circuitId}`);
    }

    // Check circuit state
    if (circuit.state === 'OPEN') {
      if (Date.now() - circuit.openedAt >= circuit.config.timeout) {
        circuit.state = 'HALF_OPEN';
        circuit.successCount = 0;
        this.updateMetrics();
      } else {
        throw new Error(`Circuit is OPEN for service: ${circuitId}`);
      }
    }

    // Check half-open call limit
    if (circuit.state === 'HALF_OPEN' && circuit.totalRequests >= circuit.config.halfOpenMaxCalls) {
      throw new Error(`Half-open circuit has reached max calls for: ${circuitId}`);
    }

    try {
      const result = await fn(context);
      this.recordSuccess(circuitId);
      return result;
    } catch (error) {
      this.recordFailure(circuitId);
      throw error;
    }
  }

  /**
   * Record successful call
   * @param {string} circuitId - Circuit ID
   */
  recordSuccess(circuitId) {
    const circuit = this.circuits.get(circuitId);

    if (!circuit) return;

    circuit.successCount++;
    circuit.failureCount = 0;

    if (circuit.state === 'HALF_OPEN') {
      if (circuit.successCount >= circuit.config.successThreshold) {
        circuit.state = 'CLOSED';
        circuit.successCount = 0;
        circuit.totalRequests = 0;
        this.updateMetrics();
      }
    }
  }

  /**
   * Record failed call
   * @param {string} circuitId - Circuit ID
   */
  recordFailure(circuitId) {
    const circuit = this.circuits.get(circuitId);

    if (!circuit) return;

    circuit.failureCount++;
    circuit.lastFailureTime = new Date();

    // Calculate failure rate
    circuit.totalRequests++;
    const failureRate = (circuit.failureCount / circuit.totalRequests) * 100;

    if (circuit.state === 'CLOSED' && failureRate >= circuit.config.failureThreshold) {
      circuit.state = 'OPEN';
      circuit.openedAt = Date.now();
      this.updateMetrics();
    } else if (circuit.state === 'HALF_OPEN') {
      // Reopen if any failure in half-open
      circuit.state = 'OPEN';
      circuit.openedAt = Date.now();
      circuit.failureCount = 0;
      circuit.successCount = 0;
      circuit.totalRequests = 0;
      this.updateMetrics();
    }
  }

  /**
   * Update metrics
   */
  updateMetrics() {
    this.metrics.totalCircuits = this.circuits.size;
    this.metrics.openCircuits = 0;
    this.metrics.halfOpenCircuits = 0;
    this.metrics.closedCircuits = 0;

    for (const circuit of this.circuits.values()) {
      switch (circuit.state) {
        case 'OPEN':
          this.metrics.openCircuits++;
          break;
        case 'HALF_OPEN':
          this.metrics.halfOpenCircuits++;
          break;
        case 'CLOSED':
          this.metrics.closedCircuits++;
          break;
      }
    }
  }

  /**
   * Get circuit status
   * @param {string} circuitId - Circuit ID
   * @returns {Object} Circuit status
   */
  getCircuitStatus(circuitId) {
    const circuit = this.circuits.get(circuitId);

    if (!circuit) {
      return { error: 'Circuit not found' };
    }

    const failureRate = circuit.totalRequests > 0
      ? ((circuit.failureCount / circuit.totalRequests) * 100).toFixed(2)
      : 0;

    return {
      id: circuitId,
      state: circuit.state,
      service: circuit.metadata.service,
      failureCount: circuit.failureCount,
      successCount: circuit.successCount,
      totalRequests: circuit.totalRequests,
      failureRate: `${failureRate}%`,
      failureThreshold: `${circuit.config.failureThreshold}%`,
      successThreshold: circuit.config.successThreshold,
      lastFailureTime: circuit.lastFailureTime,
      openedAt: circuit.openedAt ? new Date(circuit.openedAt) : null,
      createdAt: circuit.metadata.createdAt,
    };
  }

  /**
   * Get all circuits status
   * @returns {Array} All circuits status
   */
  getAllCircuitsStatus() {
    return Array.from(this.circuits.keys()).map((id) => this.getCircuitStatus(id));
  }

  /**
   * Reset circuit
   * @param {string} circuitId - Circuit ID
   */
  resetCircuit(circuitId) {
    const circuit = this.circuits.get(circuitId);

    if (!circuit) {
      return { success: false, error: 'Circuit not found' };
    }

    circuit.state = 'CLOSED';
    circuit.failureCount = 0;
    circuit.successCount = 0;
    circuit.totalRequests = 0;
    circuit.lastFailureTime = null;
    circuit.openedAt = null;

    this.updateMetrics();

    return {
      success: true,
      message: `Circuit ${circuitId} reset to CLOSED state`,
    };
  }

  /**
   * Force circuit state
   * @param {string} circuitId - Circuit ID
   * @param {string} state - New state (CLOSED, OPEN, HALF_OPEN)
   */
  forceCircuitState(circuitId, state) {
    const validStates = ['CLOSED', 'OPEN', 'HALF_OPEN'];

    if (!validStates.includes(state)) {
      return { success: false, error: `Invalid state: ${state}` };
    }

    const circuit = this.circuits.get(circuitId);

    if (!circuit) {
      return { success: false, error: 'Circuit not found' };
    }

    const previousState = circuit.state;
    circuit.state = state;

    if (state === 'OPEN') {
      circuit.openedAt = Date.now();
    } else if (state === 'CLOSED') {
      circuit.failureCount = 0;
      circuit.successCount = 0;
      circuit.totalRequests = 0;
    }

    this.updateMetrics();

    return {
      success: true,
      circuitId,
      previousState,
      newState: state,
    };
  }

  /**
   * Get circuit metrics
   * @returns {Object} Metrics
   */
  getMetrics() {
    return {
      ...this.metrics,
      configuration: {
        defaultFailureThreshold: this.failureThreshold,
        defaultSuccessThreshold: this.successThreshold,
        defaultTimeout: this.timeout,
        defaultHalfOpenMaxCalls: this.halfOpenMaxCalls,
      },
    };
  }

  /**
   * Get circuits by state
   * @param {string} state - State filter
   * @returns {Array} Circuits in specified state
   */
  getCircuitsByState(state) {
    return Array.from(this.circuits.values())
      .filter((c) => c.state === state)
      .map((c) => this.getCircuitStatus(c.id));
  }

  /**
   * Get open circuits
   * @returns {Array} Open circuits
   */
  getOpenCircuits() {
    return this.getCircuitsByState('OPEN');
  }

  /**
   * Get half-open circuits
   * @returns {Array} Half-open circuits
   */
  getHalfOpenCircuits() {
    return this.getCircuitsByState('HALF_OPEN');
  }

  /**
   * Delete circuit
   * @param {string} circuitId - Circuit ID
   */
  deleteCircuit(circuitId) {
    const existed = this.circuits.delete(circuitId);
    this.updateMetrics();

    return {
      success: existed,
      message: existed ? `Circuit ${circuitId} deleted` : 'Circuit not found',
    };
  }

  /**
   * Get circuit summary
   * @returns {Object} Summary
   */
  getSummary() {
    return {
      metrics: this.getMetrics(),
      openCircuits: this.getOpenCircuits(),
      halfOpenCircuits: this.getHalfOpenCircuits(),
      allCircuitsStatus: this.getAllCircuitsStatus(),
    };
  }

  /**
   * Health check all circuits
   * @returns {Object} Health check results
   */
  healthCheck() {
    const circuits = this.getAllCircuitsStatus();
    const openCount = circuits.filter((c) => c.state === 'OPEN').length;
    const healthStatus = openCount === 0 ? 'HEALTHY' : 'DEGRADED';

    return {
      status: healthStatus,
      totalCircuits: circuits.length,
      openCircuits: openCount,
      circuitDetails: circuits,
    };
  }
}

module.exports = CircuitBreaker;
