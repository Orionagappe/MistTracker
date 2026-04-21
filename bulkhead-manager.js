/**
 * Bulkhead Pattern Implementation
 * Resource isolation to prevent cascading failures
 * 
 * @file bulkhead-manager.js
 * @version 1.0.0
 */

class BulkheadManager {
  constructor(options = {}) {
    this.bulkheads = new Map();
    this.defaultMaxConcurrent = options.defaultMaxConcurrent || 10;
    this.defaultQueueSize = options.defaultQueueSize || 100;
    this.defaultTimeout = options.defaultTimeout || 30000;
    this.metrics = {
      totalBulkheads: 0,
      totalQueued: 0,
      totalExecuted: 0,
      totalRejected: 0,
    };
  }

  /**
   * Create a bulkhead
   * @param {string} bulkheadId - Bulkhead identifier
   * @param {Object} config - Configuration
   */
  createBulkhead(bulkheadId, config = {}) {
    const bulkhead = {
      id: bulkheadId,
      maxConcurrent: config.maxConcurrent || this.defaultMaxConcurrent,
      maxQueue: config.maxQueue || this.defaultQueueSize,
      timeout: config.timeout || this.defaultTimeout,
      activeCount: 0,
      queue: [],
      executedCount: 0,
      rejectedCount: 0,
      totalDuration: 0,
      averageDuration: 0,
      createdAt: new Date(),
      metadata: {
        name: config.name || bulkheadId,
        description: config.description || '',
        owner: config.owner || 'system',
      },
    };

    this.bulkheads.set(bulkheadId, bulkhead);
    this.updateMetrics();

    return {
      success: true,
      bulkheadId,
      config: {
        maxConcurrent: bulkhead.maxConcurrent,
        maxQueue: bulkhead.maxQueue,
        timeout: bulkhead.timeout,
      },
    };
  }

  /**
   * Submit task to bulkhead
   * @param {string} bulkheadId - Bulkhead ID
   * @param {Function} task - Task to execute
   * @param {Object} options - Execution options
   * @returns {Promise} Task result
   */
  async submitTask(bulkheadId, task, options = {}) {
    const bulkhead = this.bulkheads.get(bulkheadId);

    if (!bulkhead) {
      throw new Error(`Bulkhead not found: ${bulkheadId}`);
    }

    // Check if we can execute immediately
    if (bulkhead.activeCount < bulkhead.maxConcurrent) {
      return this.executeTask(bulkheadId, task);
    }

    // Check queue
    if (bulkhead.queue.length >= bulkhead.maxQueue) {
      this.metrics.totalRejected++;
      throw new Error(
        `Bulkhead ${bulkheadId} queue is full (${bulkhead.maxQueue} items)`
      );
    }

    // Queue task
    return new Promise((resolve, reject) => {
      bulkhead.queue.push({
        task,
        resolve,
        reject,
        priority: options.priority || 0,
        createdAt: Date.now(),
      });

      this.metrics.totalQueued++;

      // Try to process queue
      this.processQueue(bulkheadId);
    });
  }

  /**
   * Execute task
   * @param {string} bulkheadId - Bulkhead ID
   * @param {Function} task - Task to execute
   * @returns {Promise} Task result
   */
  async executeTask(bulkheadId, task) {
    const bulkhead = this.bulkheads.get(bulkheadId);

    if (!bulkhead) {
      throw new Error(`Bulkhead not found: ${bulkheadId}`);
    }

    bulkhead.activeCount++;
    const startTime = Date.now();

    try {
      const result = await Promise.race([
        task(),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Task timeout')), bulkhead.timeout)
        ),
      ]);

      const duration = Date.now() - startTime;
      bulkhead.executedCount++;
      bulkhead.totalDuration += duration;
      bulkhead.averageDuration = bulkhead.totalDuration / bulkhead.executedCount;

      this.metrics.totalExecuted++;

      return result;
    } finally {
      bulkhead.activeCount--;
      this.processQueue(bulkheadId);
    }
  }

  /**
   * Process queued tasks
   * @param {string} bulkheadId - Bulkhead ID
   */
  processQueue(bulkheadId) {
    const bulkhead = this.bulkheads.get(bulkheadId);

    if (!bulkhead) return;

    while (bulkhead.queue.length > 0 && bulkhead.activeCount < bulkhead.maxConcurrent) {
      // Sort by priority
      bulkhead.queue.sort((a, b) => b.priority - a.priority);

      const { task, resolve, reject } = bulkhead.queue.shift();

      this.executeTask(bulkheadId, task)
        .then(resolve)
        .catch(reject);
    }
  }

  /**
   * Update metrics
   */
  updateMetrics() {
    this.metrics.totalBulkheads = this.bulkheads.size;
  }

  /**
   * Get bulkhead status
   * @param {string} bulkheadId - Bulkhead ID
   * @returns {Object} Status
   */
  getBulkheadStatus(bulkheadId) {
    const bulkhead = this.bulkheads.get(bulkheadId);

    if (!bulkhead) {
      return { error: 'Bulkhead not found' };
    }

    const utilizationPercent = (bulkhead.activeCount / bulkhead.maxConcurrent) * 100;
    const queueUtilizationPercent = (bulkhead.queue.length / bulkhead.maxQueue) * 100;

    return {
      id: bulkheadId,
      name: bulkhead.metadata.name,
      config: {
        maxConcurrent: bulkhead.maxConcurrent,
        maxQueue: bulkhead.maxQueue,
        timeout: `${bulkhead.timeout}ms`,
      },
      current: {
        activeCount: bulkhead.activeCount,
        queuedCount: bulkhead.queue.length,
        utilizationPercent: Number(utilizationPercent.toFixed(2)),
        queueUtilizationPercent: Number(queueUtilizationPercent.toFixed(2)),
      },
      statistics: {
        executedCount: bulkhead.executedCount,
        rejectedCount: bulkhead.rejectedCount,
        averageDuration: Number(bulkhead.averageDuration.toFixed(0)),
        totalDuration: bulkhead.totalDuration,
      },
      metadata: bulkhead.metadata,
      createdAt: bulkhead.createdAt,
    };
  }

  /**
   * Get all bulkheads status
   * @returns {Array} All status
   */
  getAllBulkheadsStatus() {
    return Array.from(this.bulkheads.keys()).map((id) => this.getBulkheadStatus(id));
  }

  /**
   * Adjust bulkhead capacity
   * @param {string} bulkheadId - Bulkhead ID
   * @param {Object} config - New configuration
   */
  adjustCapacity(bulkheadId, config) {
    const bulkhead = this.bulkheads.get(bulkheadId);

    if (!bulkhead) {
      return { success: false, error: 'Bulkhead not found' };
    }

    const changes = {};

    if (config.maxConcurrent !== undefined) {
      changes.maxConcurrent = {
        from: bulkhead.maxConcurrent,
        to: config.maxConcurrent,
      };
      bulkhead.maxConcurrent = Math.max(1, config.maxConcurrent);
    }

    if (config.maxQueue !== undefined) {
      changes.maxQueue = {
        from: bulkhead.maxQueue,
        to: config.maxQueue,
      };
      bulkhead.maxQueue = Math.max(1, config.maxQueue);
    }

    if (config.timeout !== undefined) {
      changes.timeout = {
        from: bulkhead.timeout,
        to: config.timeout,
      };
      bulkhead.timeout = Math.max(1000, config.timeout);
    }

    return {
      success: true,
      bulkheadId,
      changes,
    };
  }

  /**
   * Get queue depth
   * @param {string} bulkheadId - Bulkhead ID
   * @returns {Object} Queue depth
   */
  getQueueDepth(bulkheadId) {
    const bulkhead = this.bulkheads.get(bulkheadId);

    if (!bulkhead) {
      return { error: 'Bulkhead not found' };
    }

    return {
      bulkheadId,
      queuedCount: bulkhead.queue.length,
      maxQueue: bulkhead.maxQueue,
      utilizationPercent: `${((bulkhead.queue.length / bulkhead.maxQueue) * 100).toFixed(2)}%`,
      activeCount: bulkhead.activeCount,
      maxConcurrent: bulkhead.maxConcurrent,
    };
  }

  /**
   * Get all queue depths
   * @returns {Array} All queue depths
   */
  getAllQueueDepths() {
    return Array.from(this.bulkheads.keys()).map((id) => this.getQueueDepth(id));
  }

  /**
   * Drain queue (wait for all tasks to complete)
   * @param {string} bulkheadId - Bulkhead ID
   * @returns {Promise} Drain completion
   */
  async drainQueue(bulkheadId) {
    const bulkhead = this.bulkheads.get(bulkheadId);

    if (!bulkhead) {
      return { success: false, error: 'Bulkhead not found' };
    }

    return new Promise((resolve) => {
      const checkInterval = setInterval(() => {
        if (bulkhead.queue.length === 0 && bulkhead.activeCount === 0) {
          clearInterval(checkInterval);
          resolve({
            success: true,
            message: `Queue drained for bulkhead ${bulkheadId}`,
          });
        }
      }, 100);
    });
  }

  /**
   * Clear queue
   * @param {string} bulkheadId - Bulkhead ID
   * @returns {Object} Clear result
   */
  clearQueue(bulkheadId) {
    const bulkhead = this.bulkheads.get(bulkheadId);

    if (!bulkhead) {
      return { success: false, error: 'Bulkhead not found' };
    }

    const clearedCount = bulkhead.queue.length;
    const rejectedTasks = [...bulkhead.queue];

    bulkhead.queue = [];

    // Reject all queued tasks
    for (const task of rejectedTasks) {
      task.reject(new Error(`Queue cleared for bulkhead ${bulkheadId}`));
      bulkhead.rejectedCount++;
    }

    this.metrics.totalRejected += clearedCount;

    return {
      success: true,
      bulkheadId,
      clearedCount,
    };
  }

  /**
   * Delete bulkhead
   * @param {string} bulkheadId - Bulkhead ID
   */
  deleteBulkhead(bulkheadId) {
    const bulkhead = this.bulkheads.get(bulkheadId);

    if (!bulkhead) {
      return { success: false, error: 'Bulkhead not found' };
    }

    // Reject all queued tasks
    for (const task of bulkhead.queue) {
      task.reject(new Error(`Bulkhead ${bulkheadId} deleted`));
    }

    this.bulkheads.delete(bulkheadId);
    this.updateMetrics();

    return {
      success: true,
      message: `Bulkhead ${bulkheadId} deleted`,
    };
  }

  /**
   * Get metrics
   * @returns {Object} Metrics
   */
  getMetrics() {
    return {
      ...this.metrics,
      configuration: {
        defaultMaxConcurrent: this.defaultMaxConcurrent,
        defaultQueueSize: this.defaultQueueSize,
        defaultTimeout: this.defaultTimeout,
      },
      summary: this.getSummary(),
    };
  }

  /**
   * Get summary
   * @returns {Object} Summary
   */
  getSummary() {
    const statuses = this.getAllBulkheadsStatus();

    const totalActive = statuses.reduce((sum, s) => sum + s.current.activeCount, 0);
    const totalQueued = statuses.reduce((sum, s) => sum + s.current.queuedCount, 0);
    const avgUtilization = statuses.length > 0
      ? statuses.reduce((sum, s) => sum + s.current.utilizationPercent, 0) / statuses.length
      : 0;

    return {
      totalBulkheads: statuses.length,
      totalActive,
      totalQueued,
      averageUtilization: Number(avgUtilization.toFixed(2)),
      statuses,
    };
  }

  /**
   * Health check
   * @returns {Object} Health status
   */
  healthCheck() {
    const summary = this.getSummary();
    const avgUtilization = summary.averageUtilization;

    let status = 'HEALTHY';
    if (avgUtilization > 80) {
      status = 'DEGRADED';
    } else if (avgUtilization > 90) {
      status = 'CRITICAL';
    }

    return {
      status,
      averageUtilization: avgUtilization,
      summary,
    };
  }
}

module.exports = BulkheadManager;
