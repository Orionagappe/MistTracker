/**
 * Escalation Engine
 * Handles alert escalation workflows and notification routing
 * 
 * @file escalation-engine.js
 * @version 1.0.0
 */

class EscalationEngine {
  constructor(options = {}) {
    this.escalationChains = new Map();
    this.escalationHistory = [];
    this.notificationQueue = [];
    this.maxHistorySize = options.maxHistorySize || 10000;
    this.notificationDelay = options.notificationDelay || 1000;
    this.processingInterval = null;
    this.metrics = {
      totalEscalations: 0,
      totalNotifications: 0,
      totalDelayed: 0,
      averageEscalationTime: 0,
    };
  }

  /**
   * Create escalation chain
   * @param {string} chainId - Chain identifier
   * @param {Object} config - Configuration
   */
  createEscalationChain(chainId, config) {
    const chain = {
      id: chainId,
      name: config.name,
      levels: config.levels || [
        { level: 0, delay: 0, teams: ['ops'], repeat: false },
        { level: 1, delay: 300000, teams: ['ops-lead'], repeat: false },
        { level: 2, delay: 900000, teams: ['director'], repeat: false },
        { level: 3, delay: 1800000, teams: ['cto'], repeat: true },
      ],
      conditions: config.conditions || {},
      createdAt: new Date(),
      enabled: true,
    };

    this.escalationChains.set(chainId, chain);

    return {
      success: true,
      chainId,
      levels: chain.levels.length,
    };
  }

  /**
   * Start escalation for alert
   * @param {Object} alert - Alert object
   * @param {string} chainId - Escalation chain ID
   * @returns {Object} Escalation started
   */
  startEscalation(alert, chainId) {
    const chain = this.escalationChains.get(chainId);

    if (!chain || !chain.enabled) {
      return { success: false, error: 'Escalation chain not found or disabled' };
    }

    const escalationId = `esc-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const escalation = {
      id: escalationId,
      alertId: alert.id,
      chainId,
      severity: alert.severity,
      status: 'ACTIVE',
      currentLevel: 0,
      startedAt: new Date(),
      scheduledNotifications: [],
      sentNotifications: [],
    };

    // Schedule first level notifications
    this.scheduleNotificationsForLevel(escalation, chain, 0);

    this.escalationHistory.push({
      escalationId,
      alertId: alert.id,
      chainId,
      startedAt: escalation.startedAt,
      severity: alert.severity,
    });

    // Trim history
    if (this.escalationHistory.length > this.maxHistorySize) {
      this.escalationHistory = this.escalationHistory.slice(-this.maxHistorySize);
    }

    this.metrics.totalEscalations++;

    return {
      success: true,
      escalationId,
      chainId,
      initialLevel: 0,
      notificationsScheduled: escalation.scheduledNotifications.length,
    };
  }

  /**
   * Schedule notifications for level
   * @param {Object} escalation - Escalation object
   * @param {Object} chain - Escalation chain
   * @param {number} level - Level number
   */
  scheduleNotificationsForLevel(escalation, chain, level) {
    const levelConfig = chain.levels[level];

    if (!levelConfig) {
      return;
    }

    const scheduleTime = new Date(Date.now() + levelConfig.delay);

    for (const team of levelConfig.teams) {
      const notification = {
        id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        escalationId: escalation.id,
        alertId: escalation.alertId,
        team,
        level,
        scheduledFor: scheduleTime,
        sentAt: null,
        status: 'SCHEDULED',
      };

      this.notificationQueue.push(notification);
      escalation.scheduledNotifications.push(notification.id);
      this.metrics.totalDelayed++;
    }
  }

  /**
   * Process notification queue
   */
  async processNotificationQueue() {
    const now = new Date();
    const toProcess = [];

    // Find notifications ready to send
    for (let i = this.notificationQueue.length - 1; i >= 0; i--) {
      const notification = this.notificationQueue[i];

      if (notification.status === 'SCHEDULED' && notification.scheduledFor <= now) {
        toProcess.push(i);
      }
    }

    // Process from back to front to avoid index issues
    for (const index of toProcess) {
      const notification = this.notificationQueue[index];

      try {
        await this.sendNotification(notification);
        notification.status = 'SENT';
        notification.sentAt = now;
        this.metrics.totalNotifications++;
      } catch (error) {
        notification.status = 'FAILED';
        notification.error = error.message;
      }
    }
  }

  /**
   * Send notification (simulated)
   * @param {Object} notification - Notification object
   * @returns {Promise} Send result
   */
  async sendNotification(notification) {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          team: notification.team,
          level: notification.level,
          alertId: notification.alertId,
          message: `Alert escalated to level ${notification.level} - Team: ${notification.team}`,
        });
      }, Math.random() * 500);
    });
  }

  /**
   * Escalate to next level
   * @param {string} escalationId - Escalation ID
   * @param {string} chainId - Chain ID
   * @returns {Object} Escalation result
   */
  escalateToNextLevel(escalationId, chainId) {
    const chain = this.escalationChains.get(chainId);

    if (!chain) {
      return { success: false, error: 'Chain not found' };
    }

    const escalation = this.escalationHistory.find((e) => e.id === escalationId);

    if (!escalation) {
      return { success: false, error: 'Escalation not found' };
    }

    const currentLevel = escalation.currentLevel || 0;

    if (currentLevel >= chain.levels.length - 1) {
      return {
        success: false,
        error: 'Already at max escalation level',
        currentLevel,
        maxLevel: chain.levels.length - 1,
      };
    }

    const nextLevel = currentLevel + 1;

    // Mock escalation object for scheduling
    const mockEscalation = {
      id: escalationId,
      alertId: escalation.alertId,
      scheduledNotifications: [],
    };

    this.scheduleNotificationsForLevel(mockEscalation, chain, nextLevel);

    escalation.currentLevel = nextLevel;

    return {
      success: true,
      escalationId,
      previousLevel: currentLevel,
      newLevel: nextLevel,
      notificationsScheduled: mockEscalation.scheduledNotifications.length,
    };
  }

  /**
   * Escalate based on severity
   * @param {string} severity - Alert severity
   * @returns {Object} Appropriate chain
   */
  getChainBySeverity(severity) {
    const severityMap = {
      CRITICAL: { delay: 0, levels: 4 },
      HIGH: { delay: 300000, levels: 3 },
      MEDIUM: { delay: 600000, levels: 2 },
      LOW: { delay: 1800000, levels: 2 },
    };

    return severityMap[severity] || severityMap.MEDIUM;
  }

  /**
   * Should escalate check
   * @param {Object} escalation - Escalation object
   * @param {Object} chain - Chain object
   * @returns {boolean} Whether to escalate
   */
  shouldEscalate(escalation, chain) {
    if (escalation.status !== 'ACTIVE') {
      return false;
    }

    const currentLevel = escalation.currentLevel || 0;

    if (currentLevel >= chain.levels.length - 1) {
      return false; // Already at max level
    }

    const levelConfig = chain.levels[currentLevel];

    if (levelConfig.repeat) {
      // Can repeat this level
      const timeSinceStart = Date.now() - escalation.startedAt;
      const repeatInterval = 1800000; // 30 minutes

      return timeSinceStart % repeatInterval < 60000; // Check within first minute of each interval
    }

    return false;
  }

  /**
   * Get escalation status
   * @param {string} escalationId - Escalation ID
   * @returns {Object} Status
   */
  getEscalationStatus(escalationId) {
    const escalation = this.escalationHistory.find((e) => e.id === escalationId);

    if (!escalation) {
      return { error: 'Escalation not found' };
    }

    const notifications = this.notificationQueue.filter(
      (n) => n.escalationId === escalationId
    );

    const sentCount = notifications.filter((n) => n.status === 'SENT').length;
    const scheduledCount = notifications.filter((n) => n.status === 'SCHEDULED').length;
    const failedCount = notifications.filter((n) => n.status === 'FAILED').length;

    return {
      id: escalationId,
      alertId: escalation.alertId,
      chainId: escalation.chainId,
      severity: escalation.severity,
      startedAt: escalation.startedAt,
      status: escalation.status,
      currentLevel: escalation.currentLevel || 0,
      notifications: {
        total: notifications.length,
        sent: sentCount,
        scheduled: scheduledCount,
        failed: failedCount,
      },
      age: Date.now() - escalation.startedAt,
    };
  }

  /**
   * Get all escalations
   * @returns {Array} All escalations
   */
  getAllEscalations() {
    return this.escalationHistory.map((e) => this.getEscalationStatus(e.id));
  }

  /**
   * Get pending notifications
   * @returns {Array} Pending notifications
   */
  getPendingNotifications() {
    return this.notificationQueue.filter((n) => n.status === 'SCHEDULED');
  }

  /**
   * Get notification history
   * @param {string} escalationId - Escalation ID (optional)
   * @returns {Array} History
   */
  getNotificationHistory(escalationId = null) {
    let notifications = this.notificationQueue.filter((n) => n.status === 'SENT');

    if (escalationId) {
      notifications = notifications.filter((n) => n.escalationId === escalationId);
    }

    return notifications.sort((a, b) => b.sentAt - a.sentAt);
  }

  /**
   * Get metrics
   * @returns {Object} Metrics
   */
  getMetrics() {
    const sentNotifications = this.notificationQueue.filter((n) => n.status === 'SENT');

    return {
      ...this.metrics,
      activeEscalations: this.escalationHistory.filter((e) => e.status === 'ACTIVE').length,
      completedEscalations: this.escalationHistory.filter((e) => e.status === 'COMPLETED')
        .length,
      averageNotificationTime: this.calculateAverageNotificationTime(),
      escalationChains: this.escalationChains.size,
    };
  }

  /**
   * Calculate average notification time
   * @returns {number} Average time in ms
   */
  calculateAverageNotificationTime() {
    const sentNotifications = this.notificationQueue.filter((n) => n.status === 'SENT');

    if (sentNotifications.length === 0) {
      return 0;
    }

    const totalTime = sentNotifications.reduce((sum, n) => {
      return sum + (n.sentAt - n.scheduledFor);
    }, 0);

    return Math.round(totalTime / sentNotifications.length);
  }

  /**
   * Get chains
   * @returns {Array} All chains
   */
  getAllChains() {
    return Array.from(this.escalationChains.values());
  }

  /**
   * Modify escalation chain
   * @param {string} chainId - Chain ID
   * @param {Object} updates - Updates
   */
  modifyChain(chainId, updates) {
    const chain = this.escalationChains.get(chainId);

    if (!chain) {
      return { success: false, error: 'Chain not found' };
    }

    if (updates.levels) {
      chain.levels = updates.levels;
    }

    if (updates.enabled !== undefined) {
      chain.enabled = updates.enabled;
    }

    if (updates.conditions) {
      chain.conditions = { ...chain.conditions, ...updates.conditions };
    }

    return {
      success: true,
      chainId,
      modified: Object.keys(updates),
    };
  }

  /**
   * Get summary
   * @returns {Object} Summary
   */
  getSummary() {
    return {
      chains: this.getAllChains().length,
      metrics: this.getMetrics(),
      activeEscalations: this.escalationHistory.filter((e) => e.status === 'ACTIVE'),
      pendingNotifications: this.getPendingNotifications().length,
      recentNotifications: this.getNotificationHistory().slice(0, 10),
    };
  }

  /**
   * Start processing notifications
   */
  startProcessing() {
    if (this.processingInterval) {
      return; // Already processing
    }

    this.processingInterval = setInterval(
      () => this.processNotificationQueue(),
      this.notificationDelay
    );
  }

  /**
   * Stop processing notifications
   */
  stopProcessing() {
    if (this.processingInterval) {
      clearInterval(this.processingInterval);
      this.processingInterval = null;
    }
  }

  /**
   * Health check
   * @returns {Object} Health status
   */
  healthCheck() {
    const pendingNotifications = this.getPendingNotifications();
    const expiredNotifications = pendingNotifications.filter(
      (n) => n.scheduledFor < Date.now() - 600000
    ); // Older than 10 minutes

    let status = 'HEALTHY';
    if (expiredNotifications.length > 0) {
      status = 'DEGRADED';
    }

    return {
      status,
      activeEscalations: this.escalationHistory.filter((e) => e.status === 'ACTIVE').length,
      pendingNotifications: pendingNotifications.length,
      expiredNotifications: expiredNotifications.length,
      metrics: this.getMetrics(),
    };
  }
}

module.exports = EscalationEngine;
