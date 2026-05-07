/**
 * Phase 58: Continuous Software Lifecycle Monitoring Agent
 * 
 * Autonomous monitoring agent that:
 * - Continuously scans system registry
 * - Checks for EOL software
 * - Generates upgrade recommendations
 * - Sends alerts and reports
 * - Tracks compliance status
 */

const EventEmitter = require('events');

/**
 * SoftwareLifecycleMonitor: Central monitoring orchestrator
 */
class SoftwareLifecycleMonitor extends EventEmitter {
  constructor(scanner, eolDb, advisor, phase17_4Platform = null) {
    super();
    this.scanner = scanner;
    this.eolDb = eolDb;
    this.advisor = advisor;
    this.phase17_4 = phase17_4Platform;
    
    this.isMonitoring = false;
    this.monitoringInterval = null;
    this.scanInterval = 24 * 60 * 60 * 1000; // 24 hours default
    this.lastFullScan = null;
    this.monitoringHistory = [];
    this.alerts = [];
  }

  /**
   * Start continuous monitoring
   */
  async startMonitoring(intervalHours = 24) {
    if (this.isMonitoring) {
      console.log('Monitoring already active');
      return;
    }

    this.isMonitoring = true;
    this.scanInterval = intervalHours * 60 * 60 * 1000;
    console.log(`Starting software lifecycle monitoring every ${intervalHours} hours`);

    // Initial scan
    await this.performFullScan();

    // Schedule recurring scans
    this.monitoringInterval = setInterval(() => {
      this.performFullScan().catch(error => {
        console.error('Monitoring error:', error);
        this.emit('monitoring-error', error);
      });
    }, this.scanInterval);

    this.emit('monitoring-started', { interval: intervalHours });
  }

  /**
   * Stop monitoring
   */
  stopMonitoring() {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
      this.isMonitoring = false;
      console.log('Software lifecycle monitoring stopped');
      this.emit('monitoring-stopped');
    }
  }

  /**
   * Perform complete monitoring scan
   */
  async performFullScan() {
    console.log('Performing full software lifecycle scan...');
    const startTime = Date.now();

    try {
      // Step 1: Scan registry
      console.log('  [1/4] Scanning Windows registry...');
      const software = await this.scanner.scanRegistry();

      // Step 2: Check EOL status
      console.log('  [2/4] Checking end-of-life status...');
      const eolSummary = this.eolDb.getEolSummary(
        software.map(s => ({ name: s.name, version: s.version }))
      );

      // Step 3: Generate recommendations
      console.log('  [3/4] Generating upgrade recommendations...');
      const recommendations = await this.advisor.analyzeInstalled();

      // Step 4: Generate alerts
      console.log('  [4/4] Generating alerts...');
      const alerts = this.generateAlerts(recommendations);

      const scanResult = {
        timestamp: new Date().toISOString(),
        duration: Date.now() - startTime,
        totalSoftware: software.length,
        eolSummary,
        recommendations,
        alerts,
        status: 'completed'
      };

      this.lastFullScan = scanResult;
      this.monitoringHistory.push(scanResult);

      // Keep only last 30 scans
      if (this.monitoringHistory.length > 30) {
        this.monitoringHistory.shift();
      }

      this.emit('scan-completed', scanResult);
      this.emitAlerts(alerts);

      // Send to Phase 17.4 if available
      if (this.phase17_4) {
        await this.reportToPhase17_4(scanResult);
      }

      console.log(`Scan completed in ${scanResult.duration}ms`);
      return scanResult;
    } catch (error) {
      console.error('Scan failed:', error);
      this.emit('scan-failed', error);
      throw error;
    }
  }

  /**
   * Generate alerts from recommendations
   */
  generateAlerts(recommendations) {
    const alerts = [];

    for (const rec of recommendations.recommendations) {
      if (rec.severity === 'critical' || rec.severity === 'high') {
        const alert = {
          id: `alert-${Date.now()}-${Math.random()}`,
          timestamp: new Date().toISOString(),
          software: rec.name,
          currentVersion: rec.currentVersion,
          severity: rec.severity,
          type: rec.eolInfo.eol ? 'eol-reached' : 'eol-approaching',
          message: this.generateAlertMessage(rec),
          reasons: rec.reasons,
          action: this.suggestAction(rec),
          priority: rec.priority
        };

        alerts.push(alert);
      }
    }

    this.alerts = alerts;
    return alerts;
  }

  /**
   * Generate alert message
   */
  generateAlertMessage(rec) {
    if (rec.eolInfo.eol) {
      return `${rec.name} v${rec.currentVersion} has reached end-of-life. Immediate upgrade required.`;
    }

    if (rec.eolInfo.daysUntilEol !== null) {
      return `${rec.name} v${rec.currentVersion} reaches end-of-life in ${rec.eolInfo.daysUntilEol} days.`;
    }

    return `${rec.name} v${rec.currentVersion} requires upgrade: ${rec.reasons.join(', ')}`;
  }

  /**
   * Suggest action for alert
   */
  suggestAction(rec) {
    if (rec.severity === 'critical') {
      return {
        recommended: 'immediate',
        action: `Upgrade ${rec.name} to v${rec.recommendedVersions[0]?.version || 'latest'} immediately`,
        automaticOptions: ['auto-download', 'schedule-maintenance-window']
      };
    }

    return {
      recommended: 'within-week',
      action: `Plan upgrade of ${rec.name} to v${rec.recommendedVersions[0]?.version || 'latest'}`,
      automaticOptions: ['auto-download', 'notify-admin']
    };
  }

  /**
   * Emit alerts to subscribers
   */
  emitAlerts(alerts) {
    for (const alert of alerts) {
      if (alert.severity === 'critical') {
        this.emit('critical-alert', alert);
      } else if (alert.severity === 'high') {
        this.emit('warning-alert', alert);
      }
    }
  }

  /**
   * Report to Phase 17.4 platform
   */
  async reportToPhase17_4(scanResult) {
    if (!this.phase17_4) return;

    try {
      // Create alert rules in Phase 17.4
      for (const alert of scanResult.alerts) {
        await this.phase17_4.createAlert({
          source: 'Phase58-LifecycleMonitor',
          title: `Software EOL Alert: ${alert.software}`,
          message: alert.message,
          severity: alert.severity,
          tags: ['software-lifecycle', 'eol', 'upgrade-required'],
          metadata: {
            software: alert.software,
            currentVersion: alert.currentVersion,
            type: alert.type
          }
        });
      }

      // Create workflow for critical upgrades
      const critical = scanResult.recommendations.recommendations
        .filter(r => r.severity === 'critical');

      if (critical.length > 0) {
        await this.phase17_4.createWorkflow({
          name: `critical-software-upgrades-${Date.now()}`,
          trigger: 'manual',
          steps: critical.map((rec, idx) => ({
            id: `upgrade-${idx}`,
            name: `Upgrade ${rec.name}`,
            action: 'schedule-upgrade',
            params: {
              software: rec.name,
              targetVersion: rec.recommendedVersions[0]?.version,
              reason: rec.reasons[0]
            }
          }))
        });
      }

      // Log to audit
      await this.phase17_4.auditLog({
        eventType: 'software-lifecycle-scan',
        timestamp: scanResult.timestamp,
        details: {
          totalSoftware: scanResult.totalSoftware,
          criticalAlerts: scanResult.alerts.filter(a => a.severity === 'critical').length,
          recommendations: scanResult.recommendations.totalRecommendations
        }
      });
    } catch (error) {
      console.error('Error reporting to Phase 17.4:', error);
    }
  }

  /**
   * Get monitoring status
   */
  getStatus() {
    return {
      isMonitoring: this.isMonitoring,
      lastScan: this.lastFullScan?.timestamp || null,
      nextScan: this.isMonitoring 
        ? new Date(Date.now() + this.scanInterval).toISOString()
        : null,
      totalScans: this.monitoringHistory.length,
      activeAlerts: this.alerts.filter(a => a.severity === 'critical').length,
      softwareTracked: this.lastFullScan?.totalSoftware || 0,
      recommendedUpgrades: this.lastFullScan?.recommendations?.totalRecommendations || 0
    };
  }

  /**
   * Get monitoring history
   */
  getHistory(limit = 10) {
    return this.monitoringHistory.slice(-limit);
  }

  /**
   * Get active alerts
   */
  getActiveAlerts() {
    return this.alerts.filter(a => a.severity === 'critical' || a.severity === 'high');
  }

  /**
   * Generate monitoring report
   */
  generateReport(days = 30) {
    const startTime = new Date();
    startTime.setDate(startTime.getDate() - days);

    const recentScans = this.monitoringHistory.filter(
      scan => new Date(scan.timestamp) >= startTime
    );

    if (recentScans.length === 0) {
      return { error: 'No scans in selected period' };
    }

    const totalAlerts = recentScans.reduce((sum, s) => sum + s.alerts.length, 0);
    const avgRecommendations = recentScans.reduce(
      (sum, s) => sum + s.recommendations.totalRecommendations, 0
    ) / recentScans.length;

    return {
      period: `Last ${days} days`,
      scans: recentScans.length,
      totalAlerts,
      averageRecommendations: avgRecommendations.toFixed(1),
      criticalAlerts: recentScans.reduce(
        (sum, s) => sum + s.alerts.filter(a => a.severity === 'critical').length, 0
      ),
      averageSoftwareCount: (
        recentScans.reduce((sum, s) => sum + s.totalSoftware, 0) / recentScans.length
      ).toFixed(0)
    };
  }
}

/**
 * ComplianceChecker: Check software compliance status
 */
class ComplianceChecker extends EventEmitter {
  constructor(monitor) {
    super();
    this.monitor = monitor;
    this.complianceRules = [];
    this.violations = [];
  }

  /**
   * Add compliance rule
   */
  addRule(rule) {
    this.complianceRules.push({
      id: rule.id || `rule-${Date.now()}`,
      name: rule.name,
      description: rule.description,
      check: rule.check, // function
      severity: rule.severity || 'high'
    });
  }

  /**
   * Check compliance against all rules
   */
  async checkCompliance() {
    this.violations = [];
    const results = [];

    for (const rule of this.complianceRules) {
      try {
        const passed = await rule.check(this.monitor.lastFullScan);
        
        results.push({
          rule: rule.name,
          passed,
          severity: rule.severity,
          timestamp: new Date().toISOString()
        });

        if (!passed) {
          this.violations.push({
            rule: rule.name,
            description: rule.description,
            severity: rule.severity,
            timestamp: new Date().toISOString()
          });

          this.emit('compliance-violation', {
            rule: rule.name,
            severity: rule.severity
          });
        }
      } catch (error) {
        console.error(`Compliance check error for ${rule.name}:`, error);
      }
    }

    this.emit('compliance-check-complete', results);
    return { results, violations: this.violations };
  }

  /**
   * Get compliance status
   */
  getStatus() {
    if (this.complianceRules.length === 0) {
      return { compliant: true, reason: 'No rules configured' };
    }

    const passedRules = this.complianceRules.length - this.violations.length;
    const complianceScore = (passedRules / this.complianceRules.length) * 100;

    return {
      compliant: this.violations.length === 0,
      complianceScore: complianceScore.toFixed(1),
      totalRules: this.complianceRules.length,
      violations: this.violations.length,
      criticalViolations: this.violations.filter(v => v.severity === 'critical').length
    };
  }
}

/**
 * Export
 */
module.exports = {
  SoftwareLifecycleMonitor,
  ComplianceChecker
};
