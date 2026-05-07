/**
 * Auto-Remediation Engine
 * Intelligent automatic recovery from issues using ML predictions and remediation actions
 * 
 * @file auto-remediation.js
 * @version 1.0.0
 */

class AutoRemediationEngine {
  constructor(options = {}) {
    this.enabled = options.enabled !== false;
    this.maxRetries = options.maxRetries || 3;
    this.decayFactor = options.decayFactor || 0.8; // Reduce retry delay each attempt
    this.timeout = options.timeout || 30000; // 30 seconds
    this.parallelExecutions = options.parallelExecutions || 3;
    this.remediationHistory = [];
    this.activeRemediations = new Map();
    this.actionHandlers = new Map();
    this.metrics = {
      totalAttempted: 0,
      totalSuccessful: 0,
      totalFailed: 0,
      successRate: 0,
      averageRecoveryTime: 0,
    };
  }

  /**
   * Register custom action handler
   * @param {string} actionType - Type of action
   * @param {Function} handler - Handler function
   */
  registerActionHandler(actionType, handler) {
    this.actionHandlers.set(actionType, handler);
  }

  /**
   * Execute remediation for detected issue
   * @param {Object} issue - Issue object with detection data
   * @param {Object} context - Context including ML predictions
   * @returns {Promise} Remediation result
   */
  async executeRemediation(issue, context = {}) {
    if (!this.enabled) {
      return { success: false, reason: 'Auto-remediation disabled' };
    }

    const remediationId = this.generateId();
    const startTime = Date.now();

    try {
      this.metrics.totalAttempted++;

      // Check if already remediating
      if (this.activeRemediations.has(issue.id)) {
        return {
          success: false,
          reason: 'Remediation already in progress',
          remediationId,
        };
      }

      this.activeRemediations.set(issue.id, {
        remediationId,
        issueId: issue.id,
        startTime,
        status: 'running',
      });

      // Determine best remediation strategy
      const strategy = this.selectRemediationStrategy(issue, context);

      if (!strategy) {
        throw new Error(`No remediation strategy found for issue type: ${issue.type}`);
      }

      // Execute remediation
      const result = await this.executeStrategy(strategy, issue, context);

      // Record success
      const duration = Date.now() - startTime;
      this.recordRemediation(remediationId, issue, strategy, result, duration, true);

      this.metrics.totalSuccessful++;
      this.updateMetrics();

      this.activeRemediations.delete(issue.id);

      return {
        success: true,
        remediationId,
        strategy: strategy.name,
        actions: result.actions,
        duration,
        recoveryConfidence: strategy.confidence,
      };
    } catch (error) {
      this.metrics.totalFailed++;
      this.updateMetrics();

      const duration = Date.now() - startTime;
      this.recordRemediation(remediationId, issue, null, { error: error.message }, duration, false);

      this.activeRemediations.delete(issue.id);

      return {
        success: false,
        remediationId,
        error: error.message,
        duration,
      };
    }
  }

  /**
   * Select best remediation strategy
   * @param {Object} issue - Issue object
   * @param {Object} context - Context with ML predictions
   * @returns {Object} Selected strategy
   */
  selectRemediationStrategy(issue, context = {}) {
    const strategies = this.getStrategiesForIssue(issue);

    if (strategies.length === 0) {
      return null;
    }

    // Score strategies based on ML predictions and history
    const scored = strategies.map((strategy) => ({
      ...strategy,
      score: this.scoreStrategy(strategy, issue, context),
    }));

    // Sort by score and return best
    scored.sort((a, b) => b.score - a.score);

    return scored[0];
  }

  /**
   * Get available strategies for issue type
   * @param {Object} issue - Issue object
   * @returns {Array} Available strategies
   */
  getStrategiesForIssue(issue) {
    const strategies = {
      HIGH_LATENCY: [
        { name: 'cache_clear', actions: ['clear_cache'], confidence: 0.7, priority: 1 },
        { name: 'scale_up', actions: ['scale_instances'], confidence: 0.8, priority: 2 },
        { name: 'circuit_break', actions: ['circuit_break'], confidence: 0.6, priority: 3 },
      ],
      HIGH_ERROR_RATE: [
        { name: 'retry_failed', actions: ['retry_requests'], confidence: 0.75, priority: 1 },
        { name: 'fallback_service', actions: ['fallback'], confidence: 0.8, priority: 2 },
        { name: 'scale_up', actions: ['scale_instances'], confidence: 0.7, priority: 3 },
      ],
      DATABASE_OVERLOAD: [
        { name: 'optimize_queries', actions: ['optimize_queries'], confidence: 0.65, priority: 1 },
        { name: 'connection_pool', actions: ['increase_pool'], confidence: 0.7, priority: 2 },
        { name: 'cache_database', actions: ['enable_cache'], confidence: 0.75, priority: 3 },
      ],
      MEMORY_PRESSURE: [
        { name: 'gc_trigger', actions: ['trigger_gc'], confidence: 0.6, priority: 1 },
        { name: 'clear_caches', actions: ['clear_cache'], confidence: 0.7, priority: 2 },
        { name: 'scale_up', actions: ['scale_instances'], confidence: 0.8, priority: 3 },
      ],
      WEBHOOK_FAILURES: [
        { name: 'retry_webhook', actions: ['retry_webhook'], confidence: 0.8, priority: 1 },
        { name: 'reroute', actions: ['reroute_webhook'], confidence: 0.7, priority: 2 },
        { name: 'fallback', actions: ['fallback_webhook'], confidence: 0.65, priority: 3 },
      ],
      ANOMALY_DETECTED: [
        { name: 'isolate', actions: ['isolate_component'], confidence: 0.6, priority: 1 },
        { name: 'circuit_break', actions: ['circuit_break'], confidence: 0.7, priority: 2 },
        { name: 'alert_ops', actions: ['escalate_alert'], confidence: 0.9, priority: 3 },
      ],
    };

    return strategies[issue.type] || [];
  }

  /**
   * Score strategy based on context
   * @param {Object} strategy - Strategy to score
   * @param {Object} issue - Issue object
   * @param {Object} context - Context
   * @returns {number} Score
   */
  scoreStrategy(strategy, issue, context = {}) {
    let score = strategy.confidence;

    // Boost score if ML predicts this will work
    if (context.mlPrediction && context.mlPrediction.recommendedActions) {
      if (context.mlPrediction.recommendedActions.includes(strategy.name)) {
        score *= 1.2;
      }
    }

    // Adjust based on issue severity
    if (issue.severity === 'CRITICAL') {
      score *= (1 + strategy.priority * 0.1);
    }

    // Consider success history
    const history = this.remediationHistory.filter(
      (r) => r.strategyName === strategy.name && r.successful
    );
    const successRate = history.length / Math.max(1, history.length + 2);
    score *= (0.8 + successRate * 0.4);

    return Math.min(1.0, score);
  }

  /**
   * Execute remediation strategy
   * @param {Object} strategy - Strategy to execute
   * @param {Object} issue - Issue object
   * @param {Object} context - Context
   * @returns {Promise} Execution result
   */
  async executeStrategy(strategy, issue, context) {
    const actions = [];
    const results = [];

    for (const actionType of strategy.actions) {
      try {
        const handler = this.actionHandlers.get(actionType);
        if (!handler) {
          throw new Error(`No handler for action: ${actionType}`);
        }

        const result = await this.executeWithTimeout(
          handler(issue, context),
          this.timeout
        );

        actions.push({
          type: actionType,
          success: true,
          result,
        });

        results.push(result);
      } catch (error) {
        actions.push({
          type: actionType,
          success: false,
          error: error.message,
        });
      }
    }

    return { actions, results };
  }

  /**
   * Execute with timeout
   * @param {Promise} promise - Promise to execute
   * @param {number} timeout - Timeout in ms
   * @returns {Promise} Result
   */
  executeWithTimeout(promise, timeout) {
    return Promise.race([
      promise,
      new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), timeout)),
    ]);
  }

  /**
   * Record remediation attempt
   * @param {string} remediationId - Remediation ID
   * @param {Object} issue - Issue object
   * @param {Object} strategy - Strategy used
   * @param {Object} result - Result object
   * @param {number} duration - Duration in ms
   * @param {boolean} successful - Success flag
   */
  recordRemediation(remediationId, issue, strategy, result, duration, successful) {
    const record = {
      remediationId,
      timestamp: new Date(),
      issueId: issue.id,
      issueType: issue.type,
      issueSeverity: issue.severity,
      strategyName: strategy ? strategy.name : null,
      strategyActions: strategy ? strategy.actions : [],
      successful,
      duration,
      result,
    };

    this.remediationHistory.push(record);

    // Keep only last 10000 records
    if (this.remediationHistory.length > 10000) {
      this.remediationHistory = this.remediationHistory.slice(-10000);
    }
  }

  /**
   * Update metrics
   */
  updateMetrics() {
    const total = this.metrics.totalSuccessful + this.metrics.totalFailed;
    this.metrics.successRate = total > 0 ? (this.metrics.totalSuccessful / total) * 100 : 0;

    const successful = this.remediationHistory.filter((r) => r.successful);
    const totalDuration = successful.reduce((sum, r) => sum + r.duration, 0);
    this.metrics.averageRecoveryTime =
      successful.length > 0 ? totalDuration / successful.length : 0;
  }

  /**
   * Generate unique ID
   * @returns {string} ID
   */
  generateId() {
    return `rem-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get remediation history
   * @param {Object} filters - Filter options
   * @returns {Array} History records
   */
  getRemediationHistory(filters = {}) {
    let history = [...this.remediationHistory];

    if (filters.issueType) {
      history = history.filter((r) => r.issueType === filters.issueType);
    }

    if (filters.successful !== undefined) {
      history = history.filter((r) => r.successful === filters.successful);
    }

    if (filters.since) {
      history = history.filter((r) => r.timestamp >= filters.since);
    }

    if (filters.limit) {
      history = history.slice(-filters.limit);
    }

    return history;
  }

  /**
   * Get metrics
   * @returns {Object} Metrics
   */
  getMetrics() {
    return {
      ...this.metrics,
      successRate: Number(this.metrics.successRate.toFixed(2)),
      averageRecoveryTime: Number(this.metrics.averageRecoveryTime.toFixed(0)),
      activeRemediations: this.activeRemediations.size,
      totalHistoryRecords: this.remediationHistory.length,
    };
  }

  /**
   * Get remediation status
   * @param {string} remediationId - Remediation ID
   * @returns {Object} Status
   */
  getRemediationStatus(remediationId) {
    const history = this.remediationHistory.find((r) => r.remediationId === remediationId);
    return history || { error: 'Remediation not found' };
  }

  /**
   * Cancel active remediation
   * @param {string} issueId - Issue ID
   * @returns {boolean} Success
   */
  cancelRemediation(issueId) {
    if (this.activeRemediations.has(issueId)) {
      this.activeRemediations.delete(issueId);
      return true;
    }
    return false;
  }

  /**
   * Get summary
   * @returns {Object} Summary
   */
  getSummary() {
    return {
      enabled: this.enabled,
      metrics: this.getMetrics(),
      activeRemediations: Array.from(this.activeRemediations.values()),
      recentRemediations: this.remediationHistory.slice(-5),
    };
  }
}

module.exports = AutoRemediationEngine;
