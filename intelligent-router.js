/**
 * Intelligent Webhook Router
 * Smart routing of webhooks based on success rates, latency, and health
 * 
 * @file intelligent-router.js
 * @version 1.0.0
 */

class IntelligentWebhookRouter {
  constructor(options = {}) {
    this.endpoints = new Map();
    this.routingHistory = [];
    this.healthCheckInterval = options.healthCheckInterval || 30000;
    this.roundRobinIndex = 0;
    this.weightingStrategy = options.weightingStrategy || 'success_rate'; // success_rate, latency, combined
    this.maxHistorySize = options.maxHistorySize || 50000;
    this.metrics = {
      totalRequests: 0,
      totalSuccessful: 0,
      totalFailed: 0,
      totalLatency: 0,
    };
  }

  /**
   * Register endpoint
   * @param {string} id - Endpoint ID
   * @param {Object} config - Endpoint configuration
   */
  registerEndpoint(id, config) {
    this.endpoints.set(id, {
      id,
      url: config.url,
      weight: config.weight || 1.0,
      priority: config.priority || 5,
      healthy: true,
      lastHealthCheck: Date.now(),
      stats: {
        requests: 0,
        successful: 0,
        failed: 0,
        totalLatency: 0,
        averageLatency: 0,
        successRate: 1.0,
      },
    });
  }

  /**
   * Route webhook to best endpoint
   * @param {Object} webhook - Webhook object
   * @param {Object} context - Routing context
   * @returns {Object} Routing decision
   */
  routeWebhook(webhook, context = {}) {
    const candidateEndpoints = this.getCandidateEndpoints();

    if (candidateEndpoints.length === 0) {
      return {
        success: false,
        reason: 'No healthy endpoints available',
        webhook: webhook.id,
      };
    }

    const selectedEndpoint = this.selectBestEndpoint(candidateEndpoints, webhook, context);

    if (!selectedEndpoint) {
      return {
        success: false,
        reason: 'Could not select endpoint',
        webhook: webhook.id,
      };
    }

    return {
      success: true,
      webhook: webhook.id,
      selectedEndpoint: selectedEndpoint.id,
      url: selectedEndpoint.url,
      priority: selectedEndpoint.priority,
      estimatedSuccessRate: Number((selectedEndpoint.stats.successRate * 100).toFixed(2)),
      estimatedLatency: `${selectedEndpoint.stats.averageLatency.toFixed(0)}ms`,
    };
  }

  /**
   * Get candidate endpoints (healthy ones)
   * @returns {Array} Candidate endpoints
   */
  getCandidateEndpoints() {
    const candidates = Array.from(this.endpoints.values()).filter(
      (ep) => ep.healthy && ep.lastHealthCheck > Date.now() - this.healthCheckInterval
    );

    return candidates.sort((a, b) => b.priority - a.priority);
  }

  /**
   * Select best endpoint
   * @param {Array} candidates - Candidate endpoints
   * @param {Object} webhook - Webhook object
   * @param {Object} context - Context
   * @returns {Object} Selected endpoint
   */
  selectBestEndpoint(candidates, webhook, context = {}) {
    let selected;

    switch (this.weightingStrategy) {
      case 'success_rate':
        selected = this.selectBySuccessRate(candidates);
        break;
      case 'latency':
        selected = this.selectByLowestLatency(candidates);
        break;
      case 'combined':
        selected = this.selectByCombined(candidates);
        break;
      default:
        selected = this.selectByRoundRobin(candidates);
    }

    return selected;
  }

  /**
   * Select by highest success rate
   * @param {Array} candidates - Candidates
   * @returns {Object} Selected endpoint
   */
  selectBySuccessRate(candidates) {
    return candidates.reduce((best, current) => {
      return current.stats.successRate > best.stats.successRate ? current : best;
    });
  }

  /**
   * Select by lowest latency
   * @param {Array} candidates - Candidates
   * @returns {Object} Selected endpoint
   */
  selectByLowestLatency(candidates) {
    return candidates.reduce((best, current) => {
      return current.stats.averageLatency < best.stats.averageLatency ? current : best;
    });
  }

  /**
   * Select by combined score
   * @param {Array} candidates - Candidates
   * @returns {Object} Selected endpoint
   */
  selectByCombined(candidates) {
    const scored = candidates.map((ep) => ({
      endpoint: ep,
      score: this.calculateCombinedScore(ep),
    }));

    scored.sort((a, b) => b.score - a.score);
    return scored[0].endpoint;
  }

  /**
   * Calculate combined score
   * @param {Object} endpoint - Endpoint
   * @returns {number} Score
   */
  calculateCombinedScore(endpoint) {
    const successWeight = 0.6;
    const latencyWeight = 0.4;

    // Normalize success rate (0-1)
    const successScore = endpoint.stats.successRate;

    // Normalize latency (lower is better, so invert)
    const maxLatency = 5000; // 5 seconds
    const latencyScore = Math.max(0, 1 - endpoint.stats.averageLatency / maxLatency);

    return successScore * successWeight + latencyScore * latencyWeight;
  }

  /**
   * Select by round robin
   * @param {Array} candidates - Candidates
   * @returns {Object} Selected endpoint
   */
  selectByRoundRobin(candidates) {
    const selected = candidates[this.roundRobinIndex % candidates.length];
    this.roundRobinIndex++;
    return selected;
  }

  /**
   * Record webhook delivery
   * @param {Object} delivery - Delivery details
   */
  recordDelivery(delivery) {
    const endpoint = this.endpoints.get(delivery.endpointId);

    if (!endpoint) {
      return;
    }

    endpoint.stats.requests++;
    endpoint.stats.totalLatency += delivery.latency;
    endpoint.stats.averageLatency = endpoint.stats.totalLatency / endpoint.stats.requests;

    if (delivery.successful) {
      endpoint.stats.successful++;
    } else {
      endpoint.stats.failed++;
    }

    endpoint.stats.successRate = endpoint.stats.successful / endpoint.stats.requests;

    this.metrics.totalRequests++;
    this.metrics.totalLatency += delivery.latency;
    if (delivery.successful) {
      this.metrics.totalSuccessful++;
    } else {
      this.metrics.totalFailed++;
    }

    // Record in history
    this.routingHistory.push({
      timestamp: new Date(),
      endpointId: delivery.endpointId,
      webhookId: delivery.webhookId,
      successful: delivery.successful,
      latency: delivery.latency,
      statusCode: delivery.statusCode,
    });

    // Keep history size under control
    if (this.routingHistory.length > this.maxHistorySize) {
      this.routingHistory = this.routingHistory.slice(-this.maxHistorySize);
    }
  }

  /**
   * Update endpoint health
   * @param {string} endpointId - Endpoint ID
   * @param {boolean} healthy - Health status
   */
  updateEndpointHealth(endpointId, healthy) {
    const endpoint = this.endpoints.get(endpointId);
    if (endpoint) {
      endpoint.healthy = healthy;
      endpoint.lastHealthCheck = Date.now();
    }
  }

  /**
   * Check endpoint health
   * @param {string} endpointId - Endpoint ID
   * @returns {Promise} Health check result
   */
  async checkEndpointHealth(endpointId) {
    const endpoint = this.endpoints.get(endpointId);

    if (!endpoint) {
      return { endpointId, healthy: false, reason: 'Endpoint not found' };
    }

    try {
      // Simulate health check
      const startTime = Date.now();
      const result = await this.performHealthCheck(endpoint.url);
      const latency = Date.now() - startTime;

      const healthy = result.statusCode === 200 || result.statusCode === 204;

      this.updateEndpointHealth(endpointId, healthy);

      return {
        endpointId,
        healthy,
        statusCode: result.statusCode,
        latency,
        checkedAt: new Date(),
      };
    } catch (error) {
      this.updateEndpointHealth(endpointId, false);

      return {
        endpointId,
        healthy: false,
        error: error.message,
        checkedAt: new Date(),
      };
    }
  }

  /**
   * Perform health check
   * @param {string} url - Endpoint URL
   * @returns {Promise} Health check result
   */
  async performHealthCheck(url) {
    return new Promise((resolve) => {
      setTimeout(() => {
        // Simulate health check with 95% success rate
        const isHealthy = Math.random() > 0.05;
        resolve({
          url,
          statusCode: isHealthy ? 200 : 503,
          timestamp: new Date(),
        });
      }, Math.random() * 1000);
    });
  }

  /**
   * Check all endpoints health
   * @returns {Promise} All health checks
   */
  async checkAllEndpointsHealth() {
    const checks = Array.from(this.endpoints.keys()).map((id) => this.checkEndpointHealth(id));

    return Promise.all(checks);
  }

  /**
   * Get endpoint stats
   * @param {string} endpointId - Endpoint ID
   * @returns {Object} Endpoint statistics
   */
  getEndpointStats(endpointId) {
    const endpoint = this.endpoints.get(endpointId);

    if (!endpoint) {
      return { error: 'Endpoint not found' };
    }

    return {
      id: endpoint.id,
      url: endpoint.url,
      healthy: endpoint.healthy,
      priority: endpoint.priority,
      weight: endpoint.weight,
      stats: {
        ...endpoint.stats,
        successRate: `${(endpoint.stats.successRate * 100).toFixed(2)}%`,
        averageLatency: `${endpoint.stats.averageLatency.toFixed(0)}ms`,
      },
    };
  }

  /**
   * Get all endpoints stats
   * @returns {Array} All endpoints stats
   */
  getAllEndpointsStats() {
    return Array.from(this.endpoints.keys()).map((id) => this.getEndpointStats(id));
  }

  /**
   * Get routing metrics
   * @returns {Object} Routing metrics
   */
  getRoutingMetrics() {
    const successRate = this.metrics.totalRequests > 0
      ? (this.metrics.totalSuccessful / this.metrics.totalRequests) * 100
      : 0;

    const averageLatency = this.metrics.totalRequests > 0
      ? this.metrics.totalLatency / this.metrics.totalRequests
      : 0;

    return {
      totalRequests: this.metrics.totalRequests,
      totalSuccessful: this.metrics.totalSuccessful,
      totalFailed: this.metrics.totalFailed,
      successRate: Number(successRate.toFixed(2)),
      averageLatency: Number(averageLatency.toFixed(0)),
      healthyEndpoints: Array.from(this.endpoints.values()).filter((ep) => ep.healthy).length,
      totalEndpoints: this.endpoints.size,
    };
  }

  /**
   * Get routing decisions
   * @param {Object} filters - Filter options
   * @returns {Array} Routing decisions
   */
  getRoutingHistory(filters = {}) {
    let history = [...this.routingHistory];

    if (filters.endpointId) {
      history = history.filter((h) => h.endpointId === filters.endpointId);
    }

    if (filters.successful !== undefined) {
      history = history.filter((h) => h.successful === filters.successful);
    }

    if (filters.since) {
      history = history.filter((h) => h.timestamp >= filters.since);
    }

    if (filters.limit) {
      history = history.slice(-filters.limit);
    }

    return history;
  }

  /**
   * Get router summary
   * @returns {Object} Router summary
   */
  getSummary() {
    return {
      strategy: this.weightingStrategy,
      metrics: this.getRoutingMetrics(),
      endpointStats: this.getAllEndpointsStats(),
      healthyEndpoints: Array.from(this.endpoints.values())
        .filter((ep) => ep.healthy)
        .map((ep) => ({ id: ep.id, url: ep.url })),
      recentHistory: this.routingHistory.slice(-10),
    };
  }

  /**
   * Set routing strategy
   * @param {string} strategy - Strategy name
   */
  setRoutingStrategy(strategy) {
    const validStrategies = ['success_rate', 'latency', 'combined', 'round_robin'];
    if (validStrategies.includes(strategy)) {
      this.weightingStrategy = strategy;
      return { success: true, strategy };
    }
    return { success: false, error: 'Invalid strategy' };
  }

  /**
   * Adjust endpoint weight
   * @param {string} endpointId - Endpoint ID
   * @param {number} weight - New weight
   */
  adjustEndpointWeight(endpointId, weight) {
    const endpoint = this.endpoints.get(endpointId);
    if (endpoint) {
      endpoint.weight = Math.max(0.1, Math.min(10, weight));
      return { success: true, weight: endpoint.weight };
    }
    return { success: false, error: 'Endpoint not found' };
  }

  /**
   * Adjust endpoint priority
   * @param {string} endpointId - Endpoint ID
   * @param {number} priority - New priority (1-10)
   */
  adjustEndpointPriority(endpointId, priority) {
    const endpoint = this.endpoints.get(endpointId);
    if (endpoint) {
      endpoint.priority = Math.max(1, Math.min(10, priority));
      return { success: true, priority: endpoint.priority };
    }
    return { success: false, error: 'Endpoint not found' };
  }
}

module.exports = IntelligentWebhookRouter;
