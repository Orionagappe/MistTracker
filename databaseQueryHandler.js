/**
 * Database Query Handler - Execute advanced queries against webhook metrics database
 * Integrates with caching and provides query optimization
 * 
 * @file services/databaseQueryHandler.js
 * @version 1.0.0
 */

const redisCache = require('./redisCache');

class DatabaseQueryHandler {
  constructor() {
    this.db = null; // Will be initialized with database connection
    this.queryLog = [];
    this.maxLogSize = 1000;
  }

  /**
   * Initialize database connection
   * @param {Object} connection - Database connection object
   */
  initialize(connection) {
    this.db = connection;
  }

  /**
   * Execute query with automatic caching and optimization
   * @param {Object} query - Query object with filters
   * @param {Object} options - Query options
   * @returns {Promise<Array>} Query results
   */
  async executeQuery(query, options = {}) {
    const {
      useCache = true,
      cacheTTL = 600,
      limit = 1000,
      offset = 0,
      sort = {},
    } = options;

    // Generate cache key
    const cacheKey = this._generateCacheKey(query, options);

    // Check cache first
    if (useCache) {
      const cached = await redisCache.get(cacheKey);
      if (cached) {
        this._logQuery('CACHE_HIT', query, options);
        return cached;
      }
    }

    try {
      // Execute query
      const startTime = Date.now();
      const results = await this._buildAndExecuteQuery(query, limit, offset, sort);
      const executionTime = Date.now() - startTime;

      // Cache results
      if (useCache && results.length > 0) {
        await redisCache.set(cacheKey, results, cacheTTL);
      }

      // Log query
      this._logQuery('EXECUTED', query, { ...options, executionTime });

      return results;
    } catch (error) {
      this._logQuery('ERROR', query, { error: error.message });
      throw error;
    }
  }

  /**
   * Build and execute query against database
   * @private
   */
  async _buildAndExecuteQuery(query, limit, offset, sort) {
    if (!this.db) {
      throw new Error('Database not initialized');
    }

    // Handle simple single-condition queries
    if (query.field && query.operator && query.value !== undefined) {
      return this._executeSingleFilterQuery(query, limit, offset, sort);
    }

    // Handle complex multi-condition queries
    if (query.operator === 'AND' && query.conditions) {
      return this._executeMultiFilterQuery(query.conditions, limit, offset, sort);
    }

    // Handle OR queries
    if (query.operator === 'OR' && query.conditions) {
      return this._executeOrQuery(query.conditions, limit, offset, sort);
    }

    throw new Error('Invalid query structure');
  }

  /**
   * Execute single filter query
   * @private
   */
  async _executeSingleFilterQuery(query, limit, offset, sort) {
    const { field, operator, value } = query;

    // Build SQL-like query (database-agnostic)
    let sqlQuery = `SELECT * FROM webhooks WHERE ${field} ${this._operatorToSQL(operator)} ?`;

    // Add sorting
    if (Object.keys(sort).length > 0) {
      const sortStr = Object.entries(sort)
        .map(([field, dir]) => `${field} ${dir === -1 ? 'DESC' : 'ASC'}`)
        .join(', ');
      sqlQuery += ` ORDER BY ${sortStr}`;
    }

    // Add pagination
    sqlQuery += ` LIMIT ${limit} OFFSET ${offset}`;

    // Execute query
    return await this.db.query(sqlQuery, [value]);
  }

  /**
   * Execute multi-condition AND query
   * @private
   */
  async _executeMultiFilterQuery(conditions, limit, offset, sort) {
    let sqlQuery = 'SELECT * FROM webhooks WHERE ';

    const parts = [];
    const values = [];

    for (const condition of conditions) {
      parts.push(`${condition.field} ${this._operatorToSQL(condition.operator)} ?`);
      values.push(condition.value);
    }

    sqlQuery += parts.join(' AND ');

    // Add sorting
    if (Object.keys(sort).length > 0) {
      const sortStr = Object.entries(sort)
        .map(([field, dir]) => `${field} ${dir === -1 ? 'DESC' : 'ASC'}`)
        .join(', ');
      sqlQuery += ` ORDER BY ${sortStr}`;
    }

    // Add pagination
    sqlQuery += ` LIMIT ${limit} OFFSET ${offset}`;

    return await this.db.query(sqlQuery, values);
  }

  /**
   * Execute OR query
   * @private
   */
  async _executeOrQuery(conditions, limit, offset, sort) {
    let sqlQuery = 'SELECT * FROM webhooks WHERE ';

    const parts = [];
    const values = [];

    for (const condition of conditions) {
      parts.push(`${condition.field} ${this._operatorToSQL(condition.operator)} ?`);
      values.push(condition.value);
    }

    sqlQuery += parts.join(' OR ');

    // Add sorting
    if (Object.keys(sort).length > 0) {
      const sortStr = Object.entries(sort)
        .map(([field, dir]) => `${field} ${dir === -1 ? 'DESC' : 'ASC'}`)
        .join(', ');
      sqlQuery += ` ORDER BY ${sortStr}`;
    }

    // Add pagination
    sqlQuery += ` LIMIT ${limit} OFFSET ${offset}`;

    return await this.db.query(sqlQuery, values);
  }

  /**
   * Get webhook statistics for dashboard
   */
  async getWebhookStats() {
    const cacheKey = 'stats:webhooks:all';

    // Check cache
    const cached = await redisCache.get(cacheKey);
    if (cached) return cached;

    const stats = {
      totalWebhooks: await this._count(),
      activeWebhooks: await this._countByStatus('active'),
      failedWebhooks: await this._countByStatus('error'),
      avgSuccessRate: await this._calculateAverage('successRate'),
      avgLatency: await this._calculateAverage('avgLatency'),
      highErrorWebhooks: await this._getHighErrorWebhooks(),
      slowWebhooks: await this._getSlowWebhooks(),
    };

    await redisCache.set(cacheKey, stats, 300); // 5 min cache
    return stats;
  }

  /**
   * Get webhook health overview
   */
  async getWebhookHealth(webhookId) {
    const cacheKey = `health:${webhookId}`;

    const cached = await redisCache.get(cacheKey);
    if (cached) return cached;

    const health = await this.db.query(
      `SELECT 
        webhookId,
        webhookName,
        status,
        successRate,
        errorRate,
        avgLatency,
        p95Latency,
        totalEvents,
        lastFailureTime,
        updatedAt
      FROM webhooks WHERE webhookId = ?`,
      [webhookId]
    );

    if (health.length === 0) {
      return null;
    }

    const healthData = health[0];

    // Calculate health score
    healthData.healthScore = this._calculateHealthScore(healthData);
    healthData.status = this._determineStatus(healthData);

    await redisCache.set(cacheKey, healthData, 120); // 2 min cache
    return healthData;
  }

  /**
   * Get historical metrics for forecasting
   */
  async getHistoricalMetrics(webhookId, metric, days = 30) {
    const cacheKey = `history:${webhookId}:${metric}:${days}d`;

    const cached = await redisCache.get(cacheKey);
    if (cached) return cached;

    const daysMs = days * 86400000;
    const startTime = new Date(Date.now() - daysMs);

    const data = await this.db.query(
      `SELECT 
        timestamp,
        ${metric} as value
      FROM webhook_metrics 
      WHERE webhookId = ? AND timestamp > ?
      ORDER BY timestamp ASC`,
      [webhookId, startTime]
    );

    await redisCache.set(cacheKey, data, 1800); // 30 min cache
    return data;
  }

  /**
   * Get anomaly history
   */
  async getAnomalyHistory(webhookId, limit = 100) {
    const cacheKey = `anomalies:${webhookId}`;

    const cached = await redisCache.get(cacheKey);
    if (cached) return cached;

    const anomalies = await this.db.query(
      `SELECT 
        id,
        webhookId,
        type,
        severity,
        value,
        threshold,
        detectedAt
      FROM anomalies 
      WHERE webhookId = ?
      ORDER BY detectedAt DESC
      LIMIT ?`,
      [webhookId, limit]
    );

    await redisCache.set(cacheKey, anomalies, 600); // 10 min cache
    return anomalies;
  }

  /**
   * Batch insert metrics (for bulk imports)
   */
  async batchInsertMetrics(metrics) {
    if (!Array.isArray(metrics) || metrics.length === 0) {
      throw new Error('Invalid metrics array');
    }

    try {
      const inserted = await this.db.batchInsert('webhook_metrics', metrics);

      // Invalidate cache for affected webhooks
      const webhookIds = [...new Set(metrics.map(m => m.webhookId))];
      for (const id of webhookIds) {
        await redisCache.delete(`health:${id}`);
        await redisCache.delete(`history:${id}:*`);
      }

      await redisCache.delete('stats:webhooks:all');

      return { inserted, webhookIds };
    } catch (error) {
      this._logQuery('BATCH_INSERT_ERROR', { metrics: metrics.length }, { error: error.message });
      throw error;
    }
  }

  /**
   * Update webhook metrics
   */
  async updateWebhookMetrics(webhookId, metrics) {
    try {
      await this.db.query(
        `UPDATE webhooks SET 
          successRate = ?,
          errorRate = ?,
          avgLatency = ?,
          p95Latency = ?,
          totalEvents = ?,
          lastFailureTime = ?,
          updatedAt = NOW()
        WHERE webhookId = ?`,
        [
          metrics.successRate,
          metrics.errorRate,
          metrics.avgLatency,
          metrics.p95Latency,
          metrics.totalEvents,
          metrics.lastFailureTime,
          webhookId,
        ]
      );

      // Invalidate cache
      await redisCache.delete(`health:${webhookId}`);
      await redisCache.delete('stats:webhooks:all');

      return { updated: true };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get query statistics
   */
  getQueryStats() {
    const stats = {
      totalQueries: this.queryLog.length,
      cacheHits: this.queryLog.filter(q => q.type === 'CACHE_HIT').length,
      executed: this.queryLog.filter(q => q.type === 'EXECUTED').length,
      errors: this.queryLog.filter(q => q.type === 'ERROR').length,
    };

    stats.cacheHitRate = stats.totalQueries > 0
      ? ((stats.cacheHits / stats.totalQueries) * 100).toFixed(2)
      : 0;

    const avgExecutionTime = this.queryLog
      .filter(q => q.executionTime)
      .map(q => q.executionTime)
      .reduce((a, b) => a + b, 0) / (this.queryLog.filter(q => q.executionTime).length || 1);

    stats.avgExecutionTime = avgExecutionTime.toFixed(2);

    return stats;
  }

  /**
   * Clear query log
   */
  clearQueryLog() {
    this.queryLog = [];
  }

  // ============= Private Helper Methods =============

  /**
   * Generate cache key from query
   * @private
   */
  _generateCacheKey(query, options) {
    return `query:${JSON.stringify(query)}:${JSON.stringify(options)}`.substring(0, 256);
  }

  /**
   * Convert filter operator to SQL
   * @private
   */
  _operatorToSQL(operator) {
    const mapping = {
      '>': '>',
      '<': '<',
      '>=': '>=',
      '<=': '<=',
      '==': '=',
      '!=': '!=',
      'contains': 'LIKE',
      'startsWith': 'LIKE',
      'endsWith': 'LIKE',
      'in': 'IN',
    };

    return mapping[operator] || '=';
  }

  /**
   * Log query for monitoring
   * @private
   */
  _logQuery(type, query, options = {}) {
    this.queryLog.push({
      type,
      query,
      options,
      timestamp: new Date().toISOString(),
    });

    // Keep log size manageable
    if (this.queryLog.length > this.maxLogSize) {
      this.queryLog = this.queryLog.slice(-this.maxLogSize);
    }
  }

  /**
   * Count webhooks
   * @private
   */
  async _count() {
    const result = await this.db.query('SELECT COUNT(*) as count FROM webhooks');
    return result[0]?.count || 0;
  }

  /**
   * Count by status
   * @private
   */
  async _countByStatus(status) {
    const result = await this.db.query(
      'SELECT COUNT(*) as count FROM webhooks WHERE status = ?',
      [status]
    );
    return result[0]?.count || 0;
  }

  /**
   * Calculate average for field
   * @private
   */
  async _calculateAverage(field) {
    const result = await this.db.query(
      `SELECT AVG(${field}) as avg FROM webhooks`
    );
    return (result[0]?.avg || 0).toFixed(2);
  }

  /**
   * Get webhooks with high error rates
   * @private
   */
  async _getHighErrorWebhooks() {
    const result = await this.db.query(
      `SELECT webhookId, webhookName, errorRate 
       FROM webhooks 
       WHERE errorRate > 5 
       ORDER BY errorRate DESC 
       LIMIT 10`
    );
    return result;
  }

  /**
   * Get slow webhooks
   * @private
   */
  async _getSlowWebhooks() {
    const result = await this.db.query(
      `SELECT webhookId, webhookName, avgLatency 
       FROM webhooks 
       WHERE avgLatency > 500 
       ORDER BY avgLatency DESC 
       LIMIT 10`
    );
    return result;
  }

  /**
   * Calculate health score
   * @private
   */
  _calculateHealthScore(health) {
    let score = 100;

    // Penalize for low success rate
    score -= (100 - health.successRate) * 0.5;

    // Penalize for high latency
    if (health.avgLatency > 1000) score -= 25;
    else if (health.avgLatency > 500) score -= 15;

    // Penalize for recent failures
    if (health.lastFailureTime) {
      const hoursSinceFailure = (Date.now() - new Date(health.lastFailureTime)) / 3600000;
      if (hoursSinceFailure < 1) score -= 25;
      else if (hoursSinceFailure < 24) score -= 10;
    }

    return Math.max(0, Math.round(score));
  }

  /**
   * Determine status from health metrics
   * @private
   */
  _determineStatus(health) {
    if (health.status === 'inactive') return 'inactive';
    if (health.healthScore >= 90) return 'healthy';
    if (health.healthScore >= 70) return 'warning';
    return 'critical';
  }
}

module.exports = new DatabaseQueryHandler();
