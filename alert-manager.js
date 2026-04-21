/**
 * Alert Manager
 * Manages alert generation, suppression, escalation, and routing
 * 
 * @file alert-manager.js
 * @version 1.0.0
 */

class AlertManager {
  constructor(options = {}) {
    this.alerts = new Map();
    this.suppressionRules = new Map();
    this.escalationPolicies = new Map();
    this.notificationChannels = new Map();
    this.alertHistory = [];
    this.maxHistorySize = options.maxHistorySize || 50000;
    this.metrics = {
      totalAlerts: 0,
      suppressedAlerts: 0,
      escalatedAlerts: 0,
      resolvedAlerts: 0,
      activeAlerts: 0,
    };
  }

  /**
   * Create alert
   * @param {Object} alertData - Alert data
   * @returns {Object} Created alert
   */
  createAlert(alertData) {
    const alertId = `alert-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const alert = {
      id: alertId,
      title: alertData.title,
      description: alertData.description || '',
      severity: alertData.severity || 'MEDIUM', // LOW, MEDIUM, HIGH, CRITICAL
      source: alertData.source || 'system',
      service: alertData.service || 'unknown',
      tags: alertData.tags || [],
      createdAt: new Date(),
      status: 'OPEN',
      suppressed: false,
      escalationLevel: 0,
      notificationsSent: [],
      acknowledgement: null,
      resolvedAt: null,
      metadata: alertData.metadata || {},
    };

    // Check suppression rules
    if (this.isAlertSuppressed(alert)) {
      alert.suppressed = true;
      this.metrics.suppressedAlerts++;
    }

    this.alerts.set(alertId, alert);
    this.metrics.totalAlerts++;
    this.metrics.activeAlerts = Array.from(this.alerts.values()).filter(
      (a) => a.status === 'OPEN'
    ).length;

    // Record in history
    this.recordAlertHistory(alert);

    return alert;
  }

  /**
   * Check if alert is suppressed
   * @param {Object} alert - Alert to check
   * @returns {boolean} Suppression status
   */
  isAlertSuppressed(alert) {
    for (const [_, rule] of this.suppressionRules) {
      if (this.matchesSuppressionRule(alert, rule)) {
        return true;
      }
    }
    return false;
  }

  /**
   * Match alert against suppression rule
   * @param {Object} alert - Alert
   * @param {Object} rule - Suppression rule
   * @returns {boolean} Match status
   */
  matchesSuppressionRule(alert, rule) {
    if (rule.severity && !rule.severity.includes(alert.severity)) {
      return false;
    }

    if (rule.source && rule.source !== alert.source) {
      return false;
    }

    if (rule.service && rule.service !== alert.service) {
      return false;
    }

    if (rule.tags && rule.tags.length > 0) {
      const hasTag = rule.tags.some((tag) => alert.tags.includes(tag));
      if (!hasTag) return false;
    }

    if (rule.titlePattern) {
      const regex = new RegExp(rule.titlePattern, 'i');
      if (!regex.test(alert.title)) {
        return false;
      }
    }

    return true;
  }

  /**
   * Add suppression rule
   * @param {Object} ruleData - Rule data
   * @returns {Object} Created rule
   */
  addSuppressionRule(ruleData) {
    const ruleId = `rule-${Date.now()}`;

    const rule = {
      id: ruleId,
      name: ruleData.name,
      severity: ruleData.severity || null,
      source: ruleData.source || null,
      service: ruleData.service || null,
      tags: ruleData.tags || [],
      titlePattern: ruleData.titlePattern || null,
      duration: ruleData.duration || null, // null = permanent
      createdAt: new Date(),
      expiresAt: ruleData.duration ? new Date(Date.now() + ruleData.duration) : null,
      enabled: true,
    };

    this.suppressionRules.set(ruleId, rule);

    return rule;
  }

  /**
   * Remove suppression rule
   * @param {string} ruleId - Rule ID
   * @returns {boolean} Success
   */
  removeSuppressionRule(ruleId) {
    return this.suppressionRules.delete(ruleId);
  }

  /**
   * Get suppression rules
   * @returns {Array} All rules
   */
  getSuppressionRules() {
    const now = new Date();
    const validRules = [];

    for (const [id, rule] of this.suppressionRules) {
      // Check expiration
      if (rule.expiresAt && rule.expiresAt < now) {
        this.suppressionRules.delete(id);
      } else if (rule.enabled) {
        validRules.push(rule);
      }
    }

    return validRules;
  }

  /**
   * Add escalation policy
   * @param {Object} policyData - Policy data
   * @returns {Object} Created policy
   */
  addEscalationPolicy(policyData) {
    const policyId = `policy-${Date.now()}`;

    const policy = {
      id: policyId,
      name: policyData.name,
      severity: policyData.severity,
      escalations: policyData.escalations || [
        { level: 0, delay: 0, notifyTeams: ['ops'] },
        { level: 1, delay: 300000, notifyTeams: ['ops-lead'] }, // 5 min
        { level: 2, delay: 900000, notifyTeams: ['director'] }, // 15 min
      ],
      createdAt: new Date(),
      enabled: true,
    };

    this.escalationPolicies.set(policyId, policy);

    return policy;
  }

  /**
   * Get escalation policy
   * @param {string} severity - Alert severity
   * @returns {Object} Matching policy
   */
  getEscalationPolicy(severity) {
    for (const [_, policy] of this.escalationPolicies) {
      if (policy.enabled && policy.severity === severity) {
        return policy;
      }
    }

    // Return default
    return {
      escalations: [
        { level: 0, delay: 0, notifyTeams: ['ops'] },
      ],
    };
  }

  /**
   * Acknowledge alert
   * @param {string} alertId - Alert ID
   * @param {Object} ackData - Acknowledgement data
   * @returns {Object} Acknowledgement
   */
  acknowledgeAlert(alertId, ackData) {
    const alert = this.alerts.get(alertId);

    if (!alert) {
      return { success: false, error: 'Alert not found' };
    }

    const ack = {
      acknowledgedAt: new Date(),
      acknowledgedBy: ackData.acknowledgedBy || 'unknown',
      comment: ackData.comment || '',
    };

    alert.acknowledgement = ack;
    alert.status = 'ACKNOWLEDGED';

    return {
      success: true,
      alertId,
      acknowledgement: ack,
    };
  }

  /**
   * Resolve alert
   * @param {string} alertId - Alert ID
   * @param {Object} resolveData - Resolution data
   * @returns {Object} Resolution
   */
  resolveAlert(alertId, resolveData) {
    const alert = this.alerts.get(alertId);

    if (!alert) {
      return { success: false, error: 'Alert not found' };
    }

    alert.status = 'RESOLVED';
    alert.resolvedAt = new Date();
    alert.resolution = {
      resolvedBy: resolveData.resolvedBy || 'system',
      resolution: resolveData.resolution || '',
      resolutionTime: alert.resolvedAt - alert.createdAt,
    };

    this.metrics.resolvedAlerts++;
    this.metrics.activeAlerts = Array.from(this.alerts.values()).filter(
      (a) => a.status === 'OPEN'
    ).length;

    return {
      success: true,
      alertId,
      resolution: alert.resolution,
    };
  }

  /**
   * Escalate alert
   * @param {string} alertId - Alert ID
   * @returns {Object} Escalation result
   */
  escalateAlert(alertId) {
    const alert = this.alerts.get(alertId);

    if (!alert) {
      return { success: false, error: 'Alert not found' };
    }

    const policy = this.getEscalationPolicy(alert.severity);
    alert.escalationLevel++;

    if (alert.escalationLevel >= policy.escalations.length) {
      alert.escalationLevel = policy.escalations.length - 1;
    }

    const currentEscalation = policy.escalations[alert.escalationLevel];

    const notification = {
      level: alert.escalationLevel,
      teams: currentEscalation.notifyTeams,
      notifiedAt: new Date(),
      channel: 'multi', // email, slack, pagerduty, etc.
    };

    alert.notificationsSent.push(notification);
    this.metrics.escalatedAlerts++;

    return {
      success: true,
      alertId,
      escalationLevel: alert.escalationLevel,
      notification,
    };
  }

  /**
   * Register notification channel
   * @param {string} channelId - Channel ID
   * @param {Object} channelConfig - Configuration
   */
  registerNotificationChannel(channelId, channelConfig) {
    const channel = {
      id: channelId,
      type: channelConfig.type, // email, slack, pagerduty, webhook
      config: channelConfig.config || {},
      enabled: true,
      createdAt: new Date(),
    };

    this.notificationChannels.set(channelId, channel);

    return { success: true, channelId };
  }

  /**
   * Send notification
   * @param {string} channelId - Channel ID
   * @param {Object} alert - Alert object
   * @returns {Promise} Send result
   */
  async sendNotification(channelId, alert) {
    const channel = this.notificationChannels.get(channelId);

    if (!channel || !channel.enabled) {
      return { success: false, error: 'Channel not found or disabled' };
    }

    try {
      // Simulate sending notification
      const result = await this.simulateNotificationSend(channel, alert);

      return {
        success: true,
        channelId,
        alertId: alert.id,
        sentAt: new Date(),
        result,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Simulate notification send
   * @param {Object} channel - Channel
   * @param {Object} alert - Alert
   * @returns {Promise} Result
   */
  simulateNotificationSend(channel, alert) {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          type: channel.type,
          alertTitle: alert.title,
          severity: alert.severity,
          timestamp: new Date(),
        });
      }, Math.random() * 1000);
    });
  }

  /**
   * Record alert in history
   * @param {Object} alert - Alert
   */
  recordAlertHistory(alert) {
    this.alertHistory.push({
      id: alert.id,
      title: alert.title,
      severity: alert.severity,
      createdAt: alert.createdAt,
      suppressed: alert.suppressed,
      source: alert.source,
    });

    if (this.alertHistory.length > this.maxHistorySize) {
      this.alertHistory = this.alertHistory.slice(-this.maxHistorySize);
    }
  }

  /**
   * Get alert
   * @param {string} alertId - Alert ID
   * @returns {Object} Alert
   */
  getAlert(alertId) {
    return this.alerts.get(alertId) || { error: 'Alert not found' };
  }

  /**
   * Get all active alerts
   * @returns {Array} Active alerts
   */
  getActiveAlerts(filters = {}) {
    let alerts = Array.from(this.alerts.values()).filter((a) => a.status === 'OPEN');

    if (filters.severity) {
      alerts = alerts.filter((a) => a.severity === filters.severity);
    }

    if (filters.service) {
      alerts = alerts.filter((a) => a.service === filters.service);
    }

    if (filters.suppressed !== undefined) {
      alerts = alerts.filter((a) => a.suppressed === filters.suppressed);
    }

    return alerts.sort((a, b) => b.createdAt - a.createdAt);
  }

  /**
   * Get metrics
   * @returns {Object} Metrics
   */
  getMetrics() {
    const openAlerts = Array.from(this.alerts.values()).filter((a) => a.status === 'OPEN');
    const criticalAlerts = openAlerts.filter((a) => a.severity === 'CRITICAL');
    const suppressedOpenAlerts = openAlerts.filter((a) => a.suppressed);

    return {
      ...this.metrics,
      openAlerts: openAlerts.length,
      criticalAlerts: criticalAlerts.length,
      suppressedOpenAlerts: suppressedOpenAlerts.length,
      acknowledgedAlerts: Array.from(this.alerts.values()).filter(
        (a) => a.status === 'ACKNOWLEDGED'
      ).length,
      suppressionRulesCount: this.suppressionRules.size,
      escalationPoliciesCount: this.escalationPolicies.size,
      notificationChannelsCount: this.notificationChannels.size,
    };
  }

  /**
   * Get alerts by severity
   * @returns {Object} Grouped by severity
   */
  getAlertsBySeverity() {
    const grouped = {
      CRITICAL: [],
      HIGH: [],
      MEDIUM: [],
      LOW: [],
    };

    for (const alert of this.alerts.values()) {
      if (alert.status === 'OPEN' && grouped[alert.severity]) {
        grouped[alert.severity].push(alert);
      }
    }

    return grouped;
  }

  /**
   * Get alerts by service
   * @returns {Object} Grouped by service
   */
  getAlertsByService() {
    const grouped = {};

    for (const alert of this.alerts.values()) {
      if (alert.status === 'OPEN') {
        if (!grouped[alert.service]) {
          grouped[alert.service] = [];
        }
        grouped[alert.service].push(alert);
      }
    }

    return grouped;
  }

  /**
   * Bulk resolve alerts
   * @param {Array} alertIds - Alert IDs
   * @param {Object} resolveData - Resolution data
   * @returns {Object} Bulk result
   */
  bulkResolveAlerts(alertIds, resolveData) {
    const results = [];

    for (const alertId of alertIds) {
      const result = this.resolveAlert(alertId, resolveData);
      results.push(result);
    }

    const successful = results.filter((r) => r.success).length;
    return {
      total: results.length,
      successful,
      failed: results.length - successful,
      results,
    };
  }

  /**
   * Get summary
   * @returns {Object} Summary
   */
  getSummary() {
    return {
      metrics: this.getMetrics(),
      alertsBySeverity: this.getAlertsBySeverity(),
      alertsByService: this.getAlertsByService(),
      recentAlerts: this.getActiveAlerts().slice(0, 10),
      suppressionRules: Array.from(this.suppressionRules.values()).slice(0, 5),
    };
  }

  /**
   * Health check
   * @returns {Object} Health status
   */
  healthCheck() {
    const metrics = this.getMetrics();
    let status = 'HEALTHY';

    if (metrics.criticalAlerts > 0) {
      status = 'CRITICAL';
    } else if (metrics.openAlerts > 10) {
      status = 'DEGRADED';
    } else if (metrics.openAlerts > 5) {
      status = 'WARNING';
    }

    return {
      status,
      metrics,
      alertsBySeverity: this.getAlertsBySeverity(),
    };
  }
}

module.exports = AlertManager;
