/**
 * Webhook Health Monitoring
 * Phase 17.2.6: Analytics & Reporting
 * 
 * Provides:
 * - Real-time webhook health status
 * - Continuous monitoring
 * - Anomaly detection
 * - Alerting
 * - Recovery recommendations
 */

import { getDatabase } from '../database/connection.js';
import { getPerformanceMetrics, getPerformanceAlerts } from './performance-metrics.js';
import { getAnalyticsCollector } from './analytics-collector.js';

// ============================================================================
// WEBHOOK HEALTH MONITOR
// ============================================================================

export class WebhookHealthMonitor {
  constructor() {
    this.alerts = new Map();  // webhook_id -> alert
    this.monitoringInterval = 60000;  // 1 minute
    this.anomalyThresholds = {
      success_rate_drop: 0.2,  // 20% drop
      latency_spike: 2,  // 2x increase
      error_rate_increase: 0.15,  // 15% increase
    };
  }

  // ========================================================================
  // HEALTH STATUS
  // ========================================================================

  async getWebhookStatus(webhookId) {
    const metrics = getPerformanceMetrics();
    const healthScore = await metrics.getWebhookHealthScore(webhookId);
    const stats = await metrics.getDeliveryStats(
      webhookId,
      new Date().toISOString().substring(0, 10)
    );
    const errors = await metrics.getErrorBreakdown(
      webhookId,
      new Date().toISOString().substring(0, 10)
    );

    return {
      webhook_id: webhookId,
      status: healthScore.status,
      health_score: healthScore.health_score,
      last_updated: new Date().toISOString(),
      metrics: {
        success_rate: stats.success_rate,
        total_deliveries: stats.total,
        successful: stats.successful,
        failed: stats.failed,
        avg_latency_ms: Math.round(stats.avg_latency_ms),
        p95_latency_ms: stats.p95_latency_ms,
        p99_latency_ms: stats.p99_latency_ms,
      },
      top_errors: errors.slice(0, 3),
      trend: healthScore.trend,
      alert: this.alerts.get(webhookId) || null,
    };
  }

  async getTeamStatus(userId) {
    const db = getDatabase();

    if (db.provider === 'mongodb') {
      const webhooks = await db.db
        .collection('webhooks')
        .find({ user_id: userId })
        .toArray();

      const statuses = [];
      for (const webhook of webhooks) {
        const status = await this.getWebhookStatus(webhook._id);
        statuses.push(status);
      }

      return {
        user_id: userId,
        total_webhooks: webhooks.length,
        webhooks: statuses,
        summary: this.summarizeStatuses(statuses),
      };
    } else {
      const result = await db.connection.query(
        'SELECT id FROM webhooks WHERE user_id = $1',
        [userId]
      );

      const statuses = [];
      for (const row of result.rows) {
        const status = await this.getWebhookStatus(row.id);
        statuses.push(status);
      }

      return {
        user_id: userId,
        total_webhooks: result.rows.length,
        webhooks: statuses,
        summary: this.summarizeStatuses(statuses),
      };
    }
  }

  summarizeStatuses(statuses) {
    if (statuses.length === 0) {
      return {
        healthy: 0,
        degraded: 0,
        critical: 0,
        overall_health: 'unknown',
      };
    }

    const summary = {
      excellent: statuses.filter(s => s.status === 'excellent').length,
      good: statuses.filter(s => s.status === 'good').length,
      fair: statuses.filter(s => s.status === 'fair').length,
      poor: statuses.filter(s => s.status === 'poor').length,
      critical: statuses.filter(s => s.status === 'critical').length,
    };

    const avgScore =
      statuses.reduce((sum, s) => sum + s.health_score, 0) / statuses.length;

    let overallHealth;
    if (avgScore >= 95) overallHealth = 'excellent';
    else if (avgScore >= 85) overallHealth = 'good';
    else if (avgScore >= 70) overallHealth = 'fair';
    else if (avgScore >= 50) overallHealth = 'poor';
    else overallHealth = 'critical';

    return {
      ...summary,
      avg_health_score: Math.round(avgScore),
      overall_health: overallHealth,
    };
  }

  // ========================================================================
  // ANOMALY DETECTION
  // ========================================================================

  async detectAnomalies(webhookId) {
    const metrics = getPerformanceMetrics();
    const alerts = [];

    // Get historical data
    const trend = await metrics.getPerformanceTrend(webhookId, 7);

    if (trend.length < 2) {
      return alerts;  // Not enough data
    }

    const today = trend[trend.length - 1];
    const yesterday = trend[trend.length - 2];

    // Detect success rate drop
    if (
      yesterday.success_rate &&
      today.success_rate < yesterday.success_rate * (1 - this.anomalyThresholds.success_rate_drop)
    ) {
      alerts.push({
        type: 'success_rate_drop',
        severity: 'warning',
        message: `Success rate dropped from ${yesterday.success_rate}% to ${today.success_rate}%`,
        yesterday: yesterday.success_rate,
        today: today.success_rate,
        threshold: this.anomalyThresholds.success_rate_drop * 100,
      });
    }

    // Detect latency spike
    if (
      yesterday.avg_response_time_ms &&
      today.avg_response_time_ms > yesterday.avg_response_time_ms * this.anomalyThresholds.latency_spike
    ) {
      alerts.push({
        type: 'latency_spike',
        severity: 'info',
        message: `Average latency increased from ${yesterday.avg_response_time_ms}ms to ${today.avg_response_time_ms}ms`,
        yesterday_ms: yesterday.avg_response_time_ms,
        today_ms: today.avg_response_time_ms,
      });
    }

    return alerts;
  }

  // ========================================================================
  // CONTINUOUS MONITORING
  // ========================================================================

  async monitorWebhook(webhookId, userId) {
    try {
      // Get anomalies
      const anomalies = await this.detectAnomalies(webhookId);

      if (anomalies.length > 0) {
        // Store alert
        this.alerts.set(webhookId, {
          webhook_id: webhookId,
          user_id: userId,
          anomalies,
          detected_at: new Date().toISOString(),
          acknowledged: false,
        });

        // Emit event if webhook is degrading
        const critical = anomalies.some(a => a.severity === 'warning');
        if (critical) {
          console.warn(`⚠️ Webhook ${webhookId} anomaly detected:`, anomalies[0]);
        }

        return this.alerts.get(webhookId);
      } else {
        // Clear alert if no anomalies
        this.alerts.delete(webhookId);
        return null;
      }
    } catch (err) {
      console.error(`Error monitoring webhook ${webhookId}:`, err);
      return null;
    }
  }

  async startMonitoring() {
    const db = getDatabase();
    console.log('🔍 Starting webhook health monitoring...');

    setInterval(async () => {
      try {
        // Get all active webhooks
        let webhooks;

        if (db.provider === 'mongodb') {
          webhooks = await db.db
            .collection('webhooks')
            .find({ status: 'active' })
            .toArray();
        } else {
          const result = await db.connection.query(
            "SELECT id, user_id FROM webhooks WHERE status = $1",
            ['active']
          );
          webhooks = result.rows.map(r => ({ _id: r.id, user_id: r.user_id }));
        }

        // Monitor each webhook
        for (const webhook of webhooks) {
          await this.monitorWebhook(webhook._id, webhook.user_id);
        }
      } catch (err) {
        console.error('Error in monitoring loop:', err);
      }
    }, this.monitoringInterval);

    console.log('✅ Webhook health monitoring started');
  }

  // ========================================================================
  // RECOMMENDATIONS
  // ========================================================================

  async getRecommendations(webhookId) {
    const metrics = getPerformanceMetrics();
    const stats = await metrics.getDeliveryStats(
      webhookId,
      new Date().toISOString().substring(0, 10)
    );
    const errors = await metrics.getErrorBreakdown(
      webhookId,
      new Date().toISOString().substring(0, 10)
    );

    const recommendations = [];

    // Low success rate
    if (stats.success_rate < 80) {
      recommendations.push({
        priority: 'high',
        category: 'reliability',
        title: 'Improve Success Rate',
        message: `Success rate is only ${stats.success_rate.toFixed(1)}%. Consider:`,
        actions: [
          'Review most common errors',
          'Increase retry attempts in webhook configuration',
          'Check if endpoint is accessible',
          'Verify webhook secret matches your system',
        ],
      });
    }

    // High latency
    if (stats.avg_latency_ms > 5000) {
      recommendations.push({
        priority: 'medium',
        category: 'performance',
        title: 'Reduce Response Latency',
        message: `Average latency is ${stats.avg_latency_ms}ms. Consider:`,
        actions: [
          'Move webhook endpoint closer to server',
          'Optimize endpoint logic (async processing)',
          'Check network connectivity',
          'Upgrade server resources if CPU-bound',
        ],
      });
    }

    // High error rate
    if (errors.length > 0 && errors[0].count > stats.total / 10) {
      recommendations.push({
        priority: 'high',
        category: 'errors',
        title: `High ${errors[0].error} Error Rate`,
        message: `${errors[0].error} accounts for ${errors[0].count} deliveries`,
        actions: [
          'Check webhook endpoint implementation',
          'Review error details and logs',
          'Consider temporary deactivation',
          'Test webhook manually with test delivery',
        ],
      });
    }

    // Too many deliveries (potential DOS)
    if (stats.total > 100000) {
      recommendations.push({
        priority: 'medium',
        category: 'optimization',
        title: 'High Volume Activity',
        message: `${stats.total} deliveries today. Consider:`,
        actions: [
          'Review webhook filters to reduce unnecessary events',
          'Implement batch processing on your end',
          'Consider webhooks consolidation',
        ],
      });
    }

    return recommendations;
  }

  // ========================================================================
  // ALERT MANAGEMENT
  // ========================================================================

  acknowledgeAlert(webhookId) {
    const alert = this.alerts.get(webhookId);
    if (alert) {
      alert.acknowledged = true;
      alert.acknowledged_at = new Date().toISOString();
    }
  }

  clearAlert(webhookId) {
    this.alerts.delete(webhookId);
  }

  getAllAlerts() {
    return Array.from(this.alerts.values()).filter(a => !a.acknowledged);
  }

  getAlertsByUser(userId) {
    return Array.from(this.alerts.values()).filter(
      a => a.user_id === userId && !a.acknowledged
    );
  }
}

// ============================================================================
// SINGLETON INSTANCE
// ============================================================================

let monitorInstance = null;

export function getWebhookHealthMonitor() {
  if (!monitorInstance) {
    monitorInstance = new WebhookHealthMonitor();
    monitorInstance.startMonitoring();
  }
  return monitorInstance;
}

export default {
  WebhookHealthMonitor,
  getWebhookHealthMonitor,
};
