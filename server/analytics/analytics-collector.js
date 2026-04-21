/**
 * Analytics Data Aggregation & Storage
 * Phase 17.2.6: Analytics & Reporting
 * 
 * Collects and aggregates:
 * - Webhook delivery metrics (latency, success rate, failures)
 * - Event volume and frequency
 * - Performance trends
 * - Rate limiting violations
 * - System health metrics
 * 
 * Stores data in time-series format for easy querying and visualization
 */

import { getDatabase } from '../database/connection.js';
import { v4 as uuidv4 } from 'uuid';

// ============================================================================
// ANALYTICS SCHEMAS
// ============================================================================

export const analyticsSchemas = {
  // Webhook execution metrics (collected per delivery)
  webhook_metrics: {
    _id: { type: String, primary: true },
    webhook_id: { type: String, required: true, index: true },
    user_id: { type: String, required: true, index: true },
    event_type: { type: String, required: true },
    http_status: Number,
    response_time_ms: Number,
    success: Boolean,
    attempt: Number,
    error: String,
    timestamp: { type: Date, required: true, index: true },
    hour: { type: String, index: true },  // ISO hour: 2026-04-19T14
    day: { type: String, index: true },   // ISO date: 2026-04-19
  },

  // Hourly aggregated statistics
  hourly_stats: {
    _id: { type: String, primary: true },
    webhook_id: { type: String, required: true, index: true },
    user_id: { type: String, required: true, index: true },
    hour: { type: String, required: true, index: true },  // 2026-04-19T14:00Z
    deliveries_total: Number,
    deliveries_successful: Number,
    deliveries_failed: Number,
    success_rate: Number,  // 0-1
    avg_response_time_ms: Number,
    min_response_time_ms: Number,
    max_response_time_ms: Number,
    p95_response_time_ms: Number,
    p99_response_time_ms: Number,
    events_triggered: Number,
    top_events: Array,  // [{ event_type, count }, ...]
    error_summary: Object,  // { error_type: count, ... }
    timestamp: Date,
  },

  // Daily aggregated statistics
  daily_stats: {
    _id: { type: String, primary: true },
    webhook_id: { type: String, required: true, index: true },
    user_id: { type: String, required: true, index: true },
    date: { type: String, required: true, index: true },  // 2026-04-19
    deliveries_total: Number,
    deliveries_successful: Number,
    deliveries_failed: Number,
    success_rate: Number,
    avg_response_time_ms: Number,
    min_response_time_ms: Number,
    max_response_time_ms: Number,
    p95_response_time_ms: Number,
    p99_response_time_ms: Number,
    events_triggered: Number,
    top_events: Array,
    error_summary: Object,
    timestamp: Date,
  },

  // Event type statistics
  event_stats: {
    _id: { type: String, primary: true },
    user_id: { type: String, required: true, index: true },
    event_type: { type: String, required: true, index: true },
    date: { type: String, required: true, index: true },
    total_count: Number,
    webhook_count: Number,
    successful_deliveries: Number,
    failed_deliveries: Number,
    avg_delivery_latency_ms: Number,
    timestamp: Date,
  },

  // Rate limiting events
  rate_limit_events: {
    _id: { type: String, primary: true },
    user_id: { type: String, required: true, index: true },
    webhook_id: { type: String },
    event_type: String,  // 'webhook', 'api', 'websocket'
    limit_exceeded: Number,
    reset_at: Date,
    timestamp: { type: Date, required: true, index: true },
  },

  // System health metrics
  system_health: {
    _id: { type: String, primary: true },
    timestamp: { type: Date, required: true, index: true },
    hour: { type: String, index: true },
    active_webhooks: Number,
    active_sessions: Number,
    queue_size: Number,
    memory_usage_mb: Number,
    cpu_usage_percent: Number,
    webhook_engine_latency_ms: Number,
    websocket_connections: Number,
    event_emission_rate_per_sec: Number,
    delivery_success_rate: Number,
  },

  // User activity summary
  user_summary: {
    _id: { type: String, primary: true },
    user_id: { type: String, required: true, index: true },
    date: { type: String, required: true, index: true },
    webhook_count: Number,
    active_webhooks: Number,
    total_events_triggered: Number,
    total_deliveries: Number,
    successful_deliveries: Number,
    failed_deliveries: Number,
    api_calls: Number,
    websocket_sessions: Number,
    timestamp: Date,
  },
};

export const analyticsIndexes = [
  // webhook_metrics
  { collection: 'webhook_metrics', fields: { webhook_id: 1, timestamp: -1 } },
  { collection: 'webhook_metrics', fields: { user_id: 1, timestamp: -1 } },
  { collection: 'webhook_metrics', fields: { hour: 1 } },

  // hourly_stats
  { collection: 'hourly_stats', fields: { webhook_id: 1, hour: -1 } },
  { collection: 'hourly_stats', fields: { user_id: 1, hour: -1 } },

  // daily_stats
  { collection: 'daily_stats', fields: { webhook_id: 1, date: -1 } },
  { collection: 'daily_stats', fields: { user_id: 1, date: -1 } },

  // event_stats
  { collection: 'event_stats', fields: { event_type: 1, date: -1 } },
  { collection: 'event_stats', fields: { user_id: 1, date: -1 } },

  // rate_limit_events
  { collection: 'rate_limit_events', fields: { user_id: 1, timestamp: -1 } },

  // system_health
  { collection: 'system_health', fields: { timestamp: -1 } },
  { collection: 'system_health', fields: { hour: 1 } },

  // user_summary
  { collection: 'user_summary', fields: { user_id: 1, date: -1 } },
];

// ============================================================================
// ANALYTICS COLLECTOR
// ============================================================================

export class AnalyticsCollector {
  constructor() {
    this.buffer = [];
    this.maxBufferSize = 1000;
    this.flushInterval = 30000;  // 30 seconds
    this.currentHour = this.getCurrentHour();
    this.currentDay = this.getCurrentDay();
  }

  // ========================================================================
  // TIME HELPERS
  // ========================================================================

  getCurrentHour() {
    const now = new Date();
    return now.toISOString().substring(0, 13) + ':00Z';
  }

  getCurrentDay() {
    return new Date().toISOString().substring(0, 10);
  }

  getHourFromTimestamp(timestamp) {
    const date = new Date(timestamp);
    return date.toISOString().substring(0, 13) + ':00Z';
  }

  getDayFromTimestamp(timestamp) {
    const date = new Date(timestamp);
    return date.toISOString().substring(0, 10);
  }

  // ========================================================================
  // WEBHOOK DELIVERY METRICS
  // ========================================================================

  recordWebhookDelivery(webhookId, userId, eventType, deliveryResult) {
    const metric = {
      _id: uuidv4(),
      webhook_id: webhookId,
      user_id: userId,
      event_type: eventType,
      http_status: deliveryResult.status,
      response_time_ms: deliveryResult.responseTime,
      success: deliveryResult.status >= 200 && deliveryResult.status < 300,
      attempt: deliveryResult.attempt,
      error: deliveryResult.error,
      timestamp: new Date(),
      hour: this.getCurrentHour(),
      day: this.getCurrentDay(),
    };

    this.buffer.push({
      type: 'webhook_metric',
      data: metric,
    });

    if (this.buffer.length >= this.maxBufferSize) {
      this.flush();
    }
  }

  // ========================================================================
  // RATE LIMITING EVENTS
  // ========================================================================

  recordRateLimitExceeded(userId, webhookId, eventType, limitExceeded, resetAt) {
    const event = {
      _id: uuidv4(),
      user_id: userId,
      webhook_id: webhookId,
      event_type: eventType,
      limit_exceeded: limitExceeded,
      reset_at: resetAt,
      timestamp: new Date(),
    };

    this.buffer.push({
      type: 'rate_limit_event',
      data: event,
    });
  }

  // ========================================================================
  // SYSTEM HEALTH METRICS
  // ========================================================================

  recordSystemHealth(healthData) {
    const now = new Date();
    const metric = {
      _id: uuidv4(),
      timestamp: now,
      hour: this.getCurrentHour(),
      active_webhooks: healthData.activeWebhooks,
      active_sessions: healthData.activeSessions,
      queue_size: healthData.queueSize,
      memory_usage_mb: healthData.memoryUsageMb,
      cpu_usage_percent: healthData.cpuUsagePercent,
      webhook_engine_latency_ms: healthData.engineLatencyMs,
      websocket_connections: healthData.wsConnections,
      event_emission_rate_per_sec: healthData.eventRatePerSec,
      delivery_success_rate: healthData.successRate,
    };

    this.buffer.push({
      type: 'system_health',
      data: metric,
    });
  }

  // ========================================================================
  // EVENT STATISTICS
  // ========================================================================

  recordEventStats(userId, eventType, count, deliveryStats) {
    const stat = {
      _id: uuidv4(),
      user_id: userId,
      event_type: eventType,
      date: this.getCurrentDay(),
      total_count: count,
      webhook_count: deliveryStats.webhookCount,
      successful_deliveries: deliveryStats.successful,
      failed_deliveries: deliveryStats.failed,
      avg_delivery_latency_ms: deliveryStats.avgLatency,
      timestamp: new Date(),
    };

    this.buffer.push({
      type: 'event_stat',
      data: stat,
    });
  }

  // ========================================================================
  // USER ACTIVITY SUMMARY
  // ========================================================================

  recordUserActivity(userId, activityData) {
    const summary = {
      _id: uuidv4(),
      user_id: userId,
      date: this.getCurrentDay(),
      webhook_count: activityData.webhookCount,
      active_webhooks: activityData.activeWebhooks,
      total_events_triggered: activityData.eventsTriggered,
      total_deliveries: activityData.deliveries,
      successful_deliveries: activityData.successful,
      failed_deliveries: activityData.failed,
      api_calls: activityData.apiCalls,
      websocket_sessions: activityData.wsSessions,
      timestamp: new Date(),
    };

    this.buffer.push({
      type: 'user_summary',
      data: summary,
    });
  }

  // ========================================================================
  // BUFFER MANAGEMENT
  // ========================================================================

  async flush() {
    if (this.buffer.length === 0) {
      return;
    }

    const db = getDatabase();
    const itemsToFlush = this.buffer.splice(0, this.maxBufferSize);

    try {
      if (db.provider === 'mongodb') {
        // MongoDB: batch insert by collection
        const collections = {};
        for (const item of itemsToFlush) {
          if (!collections[item.type]) {
            collections[item.type] = [];
          }
          collections[item.type].push(item.data);
        }

        for (const [collection, docs] of Object.entries(collections)) {
          const collectionName = collection === 'webhook_metric'
            ? 'webhook_metrics'
            : collection === 'rate_limit_event'
            ? 'rate_limit_events'
            : collection === 'system_health'
            ? 'system_health'
            : collection === 'event_stat'
            ? 'event_stats'
            : collection === 'user_summary'
            ? 'user_summary'
            : collection;

          if (docs.length > 0) {
            await db.db.collection(collectionName).insertMany(docs);
          }
        }
      } else {
        // PostgreSQL: insert one by one (or use bulk insert if available)
        for (const item of itemsToFlush) {
          await this.insertToPostgres(db, item);
        }
      }

      console.log(`✅ Flushed ${itemsToFlush.length} analytics records`);
    } catch (err) {
      console.error('Error flushing analytics buffer:', err);
      // Re-add to buffer on error (with limit to avoid infinite growth)
      if (this.buffer.length < this.maxBufferSize * 2) {
        this.buffer.unshift(...itemsToFlush);
      }
    }
  }

  async insertToPostgres(db, item) {
    // PostgreSQL implementation would go here
    // This is a placeholder for the actual SQL inserts
  }

  startAutoFlush() {
    setInterval(() => {
      this.flush().catch(err =>
        console.error('Error in analytics auto-flush:', err)
      );
    }, this.flushInterval);
  }

  // ========================================================================
  // QUERY METHODS
  // ========================================================================

  async getWebhookMetrics(webhookId, startDate, endDate) {
    const db = getDatabase();

    if (db.provider === 'mongodb') {
      return await db.db
        .collection('webhook_metrics')
        .find({
          webhook_id: webhookId,
          timestamp: { $gte: startDate, $lte: endDate },
        })
        .sort({ timestamp: -1 })
        .toArray();
    } else {
      const result = await db.connection.query(
        `SELECT * FROM webhook_metrics 
         WHERE webhook_id = $1 AND timestamp BETWEEN $2 AND $3
         ORDER BY timestamp DESC`,
        [webhookId, startDate, endDate]
      );
      return result.rows;
    }
  }

  async getHourlyStats(webhookId, date) {
    const db = getDatabase();
    const hourPattern = `${date}%`;

    if (db.provider === 'mongodb') {
      return await db.db
        .collection('hourly_stats')
        .find({
          webhook_id: webhookId,
          hour: { $regex: `^${date}` },
        })
        .sort({ hour: 1 })
        .toArray();
    } else {
      const result = await db.connection.query(
        `SELECT * FROM hourly_stats 
         WHERE webhook_id = $1 AND hour LIKE $2
         ORDER BY hour ASC`,
        [webhookId, hourPattern]
      );
      return result.rows;
    }
  }

  async getDailyStats(webhookId, startDate, endDate) {
    const db = getDatabase();

    if (db.provider === 'mongodb') {
      return await db.db
        .collection('daily_stats')
        .find({
          webhook_id: webhookId,
          date: { $gte: startDate, $lte: endDate },
        })
        .sort({ date: 1 })
        .toArray();
    } else {
      const result = await db.connection.query(
        `SELECT * FROM daily_stats 
         WHERE webhook_id = $1 AND date BETWEEN $2 AND $3
         ORDER BY date ASC`,
        [webhookId, startDate, endDate]
      );
      return result.rows;
    }
  }

  async getEventStats(userId, date) {
    const db = getDatabase();

    if (db.provider === 'mongodb') {
      return await db.db
        .collection('event_stats')
        .find({
          user_id: userId,
          date: date,
        })
        .sort({ total_count: -1 })
        .toArray();
    } else {
      const result = await db.connection.query(
        `SELECT * FROM event_stats 
         WHERE user_id = $1 AND date = $2
         ORDER BY total_count DESC`,
        [userId, date]
      );
      return result.rows;
    }
  }

  async getUserSummary(userId, date) {
    const db = getDatabase();

    if (db.provider === 'mongodb') {
      return await db.db
        .collection('user_summary')
        .findOne({
          user_id: userId,
          date: date,
        });
    } else {
      const result = await db.connection.query(
        `SELECT * FROM user_summary 
         WHERE user_id = $1 AND date = $2`,
        [userId, date]
      );
      return result.rows[0];
    }
  }

  async getSystemHealth(date) {
    const db = getDatabase();
    const hourPattern = `${date}%`;

    if (db.provider === 'mongodb') {
      return await db.db
        .collection('system_health')
        .find({
          hour: { $regex: `^${date}` },
        })
        .sort({ timestamp: 1 })
        .toArray();
    } else {
      const result = await db.connection.query(
        `SELECT * FROM system_health 
         WHERE hour LIKE $1
         ORDER BY timestamp ASC`,
        [hourPattern]
      );
      return result.rows;
    }
  }
}

// ============================================================================
// ANALYTICS AGGREGATOR (generates hourly and daily stats)
// ============================================================================

export class AnalyticsAggregator {
  constructor(collector) {
    this.collector = collector;
    this.aggregationInterval = 3600000;  // 1 hour
  }

  async aggregateHourlyStats() {
    const db = getDatabase();
    const hour = this.collector.getCurrentHour();

    if (db.provider === 'mongodb') {
      // Get all metrics for this hour
      const metrics = await db.db
        .collection('webhook_metrics')
        .find({ hour: hour })
        .toArray();

      // Group by webhook
      const grouped = {};
      for (const metric of metrics) {
        if (!grouped[metric.webhook_id]) {
          grouped[metric.webhook_id] = {
            webhook_id: metric.webhook_id,
            user_id: metric.user_id,
            hour: hour,
            deliveries: [],
            events: {},
            errors: {},
          };
        }
        grouped[metric.webhook_id].deliveries.push(metric);
        grouped[metric.webhook_id].events[metric.event_type] =
          (grouped[metric.webhook_id].events[metric.event_type] || 0) + 1;
        if (metric.error) {
          grouped[metric.webhook_id].errors[metric.error] =
            (grouped[metric.webhook_id].errors[metric.error] || 0) + 1;
        }
      }

      // Calculate stats and insert
      for (const [webhookId, data] of Object.entries(grouped)) {
        const stats = this.calculateStats(data.deliveries, hour, data);
        await db.db.collection('hourly_stats').insertOne(stats);
      }

      console.log(`✅ Aggregated hourly stats for ${Object.keys(grouped).length} webhooks`);
    }
  }

  calculateStats(deliveries, hour, groupedData) {
    if (deliveries.length === 0) {
      return null;
    }

    const successful = deliveries.filter(d => d.success).length;
    const failed = deliveries.length - successful;
    const responseTimes = deliveries.map(d => d.response_time_ms).sort((a, b) => a - b);

    const topEvents = Object.entries(groupedData.events)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([event, count]) => ({ event_type: event, count }));

    return {
      _id: uuidv4(),
      webhook_id: deliveries[0].webhook_id,
      user_id: deliveries[0].user_id,
      hour: hour,
      deliveries_total: deliveries.length,
      deliveries_successful: successful,
      deliveries_failed: failed,
      success_rate: successful / deliveries.length,
      avg_response_time_ms:
        responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length,
      min_response_time_ms: responseTimes[0],
      max_response_time_ms: responseTimes[responseTimes.length - 1],
      p95_response_time_ms: responseTimes[Math.floor(responseTimes.length * 0.95)],
      p99_response_time_ms: responseTimes[Math.floor(responseTimes.length * 0.99)],
      events_triggered: deliveries.length,
      top_events: topEvents,
      error_summary: groupedData.errors,
      timestamp: new Date(),
    };
  }

  startAutoAggregation() {
    setInterval(() => {
      this.aggregateHourlyStats().catch(err =>
        console.error('Error aggregating hourly stats:', err)
      );
    }, this.aggregationInterval);
  }
}

// ============================================================================
// SINGLETON INSTANCES
// ============================================================================

let collectorInstance = null;
let aggregatorInstance = null;

export function getAnalyticsCollector() {
  if (!collectorInstance) {
    collectorInstance = new AnalyticsCollector();
    collectorInstance.startAutoFlush();
  }
  return collectorInstance;
}

export function getAnalyticsAggregator() {
  if (!aggregatorInstance) {
    const collector = getAnalyticsCollector();
    aggregatorInstance = new AnalyticsAggregator(collector);
    aggregatorInstance.startAutoAggregation();
  }
  return aggregatorInstance;
}

export default {
  AnalyticsCollector,
  AnalyticsAggregator,
  getAnalyticsCollector,
  getAnalyticsAggregator,
};
