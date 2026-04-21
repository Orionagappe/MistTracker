/**
 * Webhook Performance Metrics
 * Phase 17.2.6: Analytics & Reporting
 * 
 * Tracks and calculates:
 * - Delivery success rates
 * - Response time percentiles
 * - Failure rates and error trends
 * - Reliability scores
 * - Performance degradation alerts
 */

import { getAnalyticsCollector } from './analytics-collector.js';
import { getDatabase } from '../database/connection.js';

// ============================================================================
// PERFORMANCE METRICS CALCULATOR
// ============================================================================

export class PerformanceMetrics {
  constructor() {
    this.collector = getAnalyticsCollector();
  }

  // ========================================================================
  // REAL-TIME METRICS
  // ========================================================================

  async getWebhookHealthScore(webhookId, timeWindowMinutes = 60) {
    const db = getDatabase();
    const startTime = new Date(Date.now() - timeWindowMinutes * 60000);

    let metrics;
    if (db.provider === 'mongodb') {
      metrics = await db.db
        .collection('webhook_metrics')
        .find({
          webhook_id: webhookId,
          timestamp: { $gte: startTime },
        })
        .toArray();
    } else {
      const result = await db.connection.query(
        `SELECT * FROM webhook_metrics 
         WHERE webhook_id = $1 AND timestamp >= $2`,
        [webhookId, startTime]
      );
      metrics = result.rows;
    }

    if (metrics.length === 0) {
      return {
        health_score: 100,
        message: 'No recent activity',
        status: 'unknown',
      };
    }

    const successful = metrics.filter(m => m.success).length;
    const failed = metrics.length - successful;
    const successRate = successful / metrics.length;
    const avgLatency =
      metrics.reduce((sum, m) => sum + m.response_time_ms, 0) / metrics.length;

    // Calculate health score (0-100)
    let score = 100;

    // Success rate: 0-30 points
    score -= (1 - successRate) * 30;

    // Latency: 0-30 points (50% if >1000ms, 100% if >5000ms)
    if (avgLatency > 5000) {
      score -= 30;
    } else if (avgLatency > 1000) {
      score -= 15 + (avgLatency - 1000) / 400;
    } else if (avgLatency > 500) {
      score -= (avgLatency - 500) / 50;
    }

    // Failure trends: 0-40 points
    const recentFailures = metrics.slice(-10).filter(m => !m.success).length;
    const failureRatio = recentFailures / 10;
    score -= failureRatio * 40;

    score = Math.max(0, Math.min(100, score));

    const status =
      score >= 95
        ? 'excellent'
        : score >= 85
        ? 'good'
        : score >= 70
        ? 'fair'
        : score >= 50
        ? 'poor'
        : 'critical';

    return {
      health_score: Math.round(score),
      status,
      metrics_count: metrics.length,
      success_rate: Math.round(successRate * 10000) / 100,  // percentage
      failure_count: failed,
      avg_latency_ms: Math.round(avgLatency),
      trend: this.calculateTrend(metrics),
    };
  }

  calculateTrend(metrics) {
    if (metrics.length < 10) {
      return 'stable';
    }

    const firstHalf = metrics.slice(0, Math.floor(metrics.length / 2));
    const secondHalf = metrics.slice(Math.floor(metrics.length / 2));

    const firstRate =
      firstHalf.filter(m => m.success).length / firstHalf.length;
    const secondRate =
      secondHalf.filter(m => m.success).length / secondHalf.length;

    const difference = secondRate - firstRate;

    if (Math.abs(difference) < 0.05) {
      return 'stable';
    } else if (difference > 0.05) {
      return 'improving';
    } else {
      return 'degrading';
    }
  }

  // ========================================================================
  // DELIVERY STATISTICS
  // ========================================================================

  async getDeliveryStats(webhookId, date) {
    const db = getDatabase();
    const dayPattern = `${date}%`;

    if (db.provider === 'mongodb') {
      const metrics = await db.db
        .collection('webhook_metrics')
        .find({
          webhook_id: webhookId,
          day: date,
        })
        .toArray();

      return this.calculateDeliveryStats(metrics);
    } else {
      const result = await db.connection.query(
        `SELECT * FROM webhook_metrics 
         WHERE webhook_id = $1 AND day = $2`,
        [webhookId, date]
      );

      return this.calculateDeliveryStats(result.rows);
    }
  }

  calculateDeliveryStats(metrics) {
    if (metrics.length === 0) {
      return {
        total: 0,
        successful: 0,
        failed: 0,
        success_rate: 0,
        avg_latency_ms: 0,
        min_latency_ms: 0,
        max_latency_ms: 0,
      };
    }

    const successful = metrics.filter(m => m.success).length;
    const latencies = metrics.map(m => m.response_time_ms).sort((a, b) => a - b);

    return {
      total: metrics.length,
      successful,
      failed: metrics.length - successful,
      success_rate: (successful / metrics.length) * 100,
      avg_latency_ms:
        latencies.reduce((a, b) => a + b, 0) / latencies.length,
      min_latency_ms: latencies[0],
      max_latency_ms: latencies[latencies.length - 1],
      p50_latency_ms: latencies[Math.floor(latencies.length * 0.5)],
      p95_latency_ms: latencies[Math.floor(latencies.length * 0.95)],
      p99_latency_ms: latencies[Math.floor(latencies.length * 0.99)],
    };
  }

  // ========================================================================
  // ERROR ANALYSIS
  // ========================================================================

  async getErrorBreakdown(webhookId, date) {
    const db = getDatabase();

    if (db.provider === 'mongodb') {
      const errors = await db.db
        .collection('webhook_metrics')
        .aggregate([
          {
            $match: {
              webhook_id: webhookId,
              day: date,
              error: { $exists: true, $ne: null },
            },
          },
          {
            $group: {
              _id: '$error',
              count: { $sum: 1 },
              last_seen: { $max: '$timestamp' },
            },
          },
          { $sort: { count: -1 } },
          { $limit: 10 },
        ])
        .toArray();

      return errors.map(e => ({
        error: e._id,
        count: e.count,
        last_seen: e.last_seen,
      }));
    } else {
      const result = await db.connection.query(
        `SELECT error, COUNT(*) as count, MAX(timestamp) as last_seen
         FROM webhook_metrics 
         WHERE webhook_id = $1 AND day = $2 AND error IS NOT NULL
         GROUP BY error
         ORDER BY count DESC
         LIMIT 10`,
        [webhookId, date]
      );

      return result.rows;
    }
  }

  // ========================================================================
  // PERFORMANCE TRENDS
  // ========================================================================

  async getPerformanceTrend(webhookId, days = 7) {
    const db = getDatabase();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    const startDateStr = startDate.toISOString().substring(0, 10);

    if (db.provider === 'mongodb') {
      return await db.db
        .collection('daily_stats')
        .find({
          webhook_id: webhookId,
          date: { $gte: startDateStr },
        })
        .sort({ date: 1 })
        .toArray();
    } else {
      const result = await db.connection.query(
        `SELECT date, success_rate, avg_response_time_ms, 
                deliveries_total, deliveries_failed
         FROM daily_stats 
         WHERE webhook_id = $1 AND date >= $2
         ORDER BY date ASC`,
        [webhookId, startDateStr]
      );

      return result.rows;
    }
  }

  // ========================================================================
  // HOURLY BREAKDOWN
  // ========================================================================

  async getHourlyBreakdown(webhookId, date) {
    const db = getDatabase();

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
        `SELECT hour, success_rate, avg_response_time_ms,
                deliveries_total, deliveries_successful, deliveries_failed
         FROM hourly_stats 
         WHERE webhook_id = $1 AND hour LIKE $2
         ORDER BY hour ASC`,
        [webhookId, `${date}%`]
      );

      return result.rows;
    }
  }

  // ========================================================================
  // SLA COMPLIANCE
  // ========================================================================

  async calculateSLACompliance(webhookId, startDate, endDate) {
    const db = getDatabase();

    if (db.provider === 'mongodb') {
      const metrics = await db.db
        .collection('webhook_metrics')
        .find({
          webhook_id: webhookId,
          timestamp: { $gte: startDate, $lte: endDate },
        })
        .toArray();

      return this.verifySLACompliance(metrics);
    } else {
      const result = await db.connection.query(
        `SELECT * FROM webhook_metrics 
         WHERE webhook_id = $1 AND timestamp BETWEEN $2 AND $3`,
        [webhookId, startDate, endDate]
      );

      return this.verifySLACompliance(result.rows);
    }
  }

  verifySLACompliance(metrics) {
    if (metrics.length === 0) {
      return {
        compliant: false,
        uptime_sla_target: 99.9,
        uptime_achieved: 0,
        details: 'No data available',
      };
    }

    const successful = metrics.filter(m => m.success).length;
    const uptime = (successful / metrics.length) * 100;

    // SLA targets
    const uptimeSlaTarget = 99.9;  // 99.9% uptime
    const latencySlaTarget = 1000;  // 1000ms max latency

    const avgLatency =
      metrics.reduce((sum, m) => sum + m.response_time_ms, 0) / metrics.length;
    const p95Latency = metrics
      .map(m => m.response_time_ms)
      .sort((a, b) => a - b)[Math.floor(metrics.length * 0.95)];

    return {
      period: { start: metrics[0].timestamp, end: metrics[metrics.length - 1].timestamp },
      availability: {
        target: uptimeSlaTarget,
        achieved: uptime,
        compliant: uptime >= uptimeSlaTarget,
      },
      latency: {
        target_ms: latencySlaTarget,
        avg_ms: Math.round(avgLatency),
        p95_ms: Math.round(p95Latency),
        compliant: p95Latency <= latencySlaTarget,
      },
      overall_compliant: uptime >= uptimeSlaTarget && p95Latency <= latencySlaTarget,
      total_deliveries: metrics.length,
      successful_deliveries: successful,
      failed_deliveries: metrics.length - successful,
    };
  }

  // ========================================================================
  // COMPARISON METRICS
  // ========================================================================

  async compareWebhooks(userId, date) {
    const db = getDatabase();

    if (db.provider === 'mongodb') {
      return await db.db
        .collection('webhook_metrics')
        .aggregate([
          {
            $match: {
              user_id: userId,
              day: date,
            },
          },
          {
            $group: {
              _id: '$webhook_id',
              total: { $sum: 1 },
              successful: {
                $sum: { $cond: [{ $eq: ['$success', true] }, 1, 0] },
              },
              avg_latency: { $avg: '$response_time_ms' },
              max_latency: { $max: '$response_time_ms' },
              min_latency: { $min: '$response_time_ms' },
            },
          },
          { $sort: { total: -1 } },
        ])
        .toArray();
    } else {
      const result = await db.connection.query(
        `SELECT webhook_id, COUNT(*) as total,
                SUM(CASE WHEN success = true THEN 1 ELSE 0 END) as successful,
                AVG(response_time_ms)::int as avg_latency,
                MAX(response_time_ms) as max_latency,
                MIN(response_time_ms) as min_latency
         FROM webhook_metrics 
         WHERE user_id = $1 AND day = $2
         GROUP BY webhook_id
         ORDER BY total DESC`,
        [userId, date]
      );

      return result.rows;
    }
  }
}

// ============================================================================
// PERFORMANCE ALERTS
// ============================================================================

export class PerformanceAlerts {
  constructor() {
    this.metrics = new PerformanceMetrics();
    this.alerts = [];
  }

  async checkPerformance(webhookId) {
    const healthScore = await this.metrics.getWebhookHealthScore(webhookId, 60);

    const alerts = [];

    if (healthScore.health_score <= 50) {
      alerts.push({
        severity: 'critical',
        type: 'health_score_critical',
        message: `Webhook health score is ${healthScore.health_score}. Immediate attention required.`,
        webhook_id: webhookId,
        score: healthScore.health_score,
        timestamp: new Date(),
      });
    }

    if (healthScore.success_rate < 80) {
      alerts.push({
        severity: 'warning',
        type: 'low_success_rate',
        message: `Success rate dropped to ${healthScore.success_rate}%`,
        webhook_id: webhookId,
        success_rate: healthScore.success_rate,
        timestamp: new Date(),
      });
    }

    if (healthScore.avg_latency_ms > 5000) {
      alerts.push({
        severity: 'warning',
        type: 'high_latency',
        message: `Average latency is ${healthScore.avg_latency_ms}ms (threshold: 5000ms)`,
        webhook_id: webhookId,
        latency_ms: healthScore.avg_latency_ms,
        timestamp: new Date(),
      });
    }

    if (healthScore.trend === 'degrading') {
      alerts.push({
        severity: 'info',
        type: 'performance_degrading',
        message: 'Performance is degrading. Monitor closely.',
        webhook_id: webhookId,
        timestamp: new Date(),
      });
    }

    return alerts;
  }

  async checkAllWebhooks(userId) {
    const db = getDatabase();

    if (db.provider === 'mongodb') {
      const webhooks = await db.db
        .collection('webhooks')
        .find({ user_id: userId, status: 'active' })
        .toArray();

      const allAlerts = [];
      for (const webhook of webhooks) {
        const alerts = await this.checkPerformance(webhook._id);
        allAlerts.push(...alerts);
      }

      return allAlerts;
    } else {
      const result = await db.connection.query(
        'SELECT id FROM webhooks WHERE user_id = $1 AND status = $2',
        [userId, 'active']
      );

      const allAlerts = [];
      for (const row of result.rows) {
        const alerts = await this.checkPerformance(row.id);
        allAlerts.push(...alerts);
      }

      return allAlerts;
    }
  }
}

// ============================================================================
// SINGLETON INSTANCES
// ============================================================================

let metricsInstance = null;
let alertsInstance = null;

export function getPerformanceMetrics() {
  if (!metricsInstance) {
    metricsInstance = new PerformanceMetrics();
  }
  return metricsInstance;
}

export function getPerformanceAlerts() {
  if (!alertsInstance) {
    alertsInstance = new PerformanceAlerts();
  }
  return alertsInstance;
}

export default {
  PerformanceMetrics,
  PerformanceAlerts,
  getPerformanceMetrics,
  getPerformanceAlerts,
};
