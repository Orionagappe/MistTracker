/**
 * Phase 58: Software Lifecycle Management - Phase 17.4 Integration
 * 
 * Complete integration of Phase 58 with Phase 17.4 platform:
 * - Registry scanning
 * - EOL tracking
 * - Upgrade recommendations
 * - Compliance monitoring
 * - Automated reporting
 */

const EventEmitter = require('events');
const { WindowsRegistryScanner, RegistryScannerAgent } = require('./phase-58-registry-scanner');
const { EndOfLifeDatabase, NetworkUpdateCenter } = require('./phase-58-eol-database');
const { UpgradeAdvisor, UpgradeScheduler } = require('./phase-58-upgrade-advisor');
const { SoftwareLifecycleMonitor, ComplianceChecker } = require('./phase-58-lifecycle-monitor');
const { LifecycleComplianceEngine } = require('./phase-58-compliance-engine');

/**
 * Phase58OrchestrationEngine: Main Phase 58 orchestrator
 */
class Phase58OrchestrationEngine extends EventEmitter {
  constructor(phase17_4Platform) {
    super();
    this.phase17_4 = phase17_4Platform;
    
    // Initialize all Phase 58 components
    this.scanner = new WindowsRegistryScanner();
    this.scannerAgent = new RegistryScannerAgent();
    
    this.eolDb = new EndOfLifeDatabase();
    this.updateCenter = new NetworkUpdateCenter(this.eolDb);
    
    this.advisor = new UpgradeAdvisor(this.scanner, this.eolDb);
    this.scheduler = new UpgradeScheduler(this.advisor);
    
    this.monitor = new SoftwareLifecycleMonitor(this.scanner, this.eolDb, this.advisor, phase17_4Platform);
    this.complianceChecker = new ComplianceChecker(this.monitor);
    
    this.complianceEngine = new LifecycleComplianceEngine(this.monitor);
    
    this.setupListeners();
  }

  /**
   * Setup event listeners
   */
  setupListeners() {
    // Monitor events
    this.monitor.on('scan-completed', (result) => {
      this.emit('scan-completed', result);
      this.handleScanCompleted(result);
    });

    this.monitor.on('critical-alert', (alert) => {
      this.emit('critical-alert', alert);
      this.handleCriticalAlert(alert);
    });

    // Advisor events
    this.advisor.on('assessment-complete', (assessment) => {
      this.emit('assessment-complete', assessment);
    });
  }

  /**
   * Initialize Phase 58 on platform
   */
  async initialize() {
    console.log('Initializing Phase 58 - Software Lifecycle Management');

    try {
      // Setup compliance policies
      this.setupCompliancePolicies();

      // Create Phase 17.4 resources
      await this.createPhase17_4Resources();

      // Start monitoring
      await this.monitor.startMonitoring(24); // Daily monitoring

      this.emit('initialized');
      console.log('Phase 58 initialized successfully');
    } catch (error) {
      console.error('Phase 58 initialization failed:', error);
      this.emit('initialization-error', error);
      throw error;
    }
  }

  /**
   * Setup compliance policies
   */
  setupCompliancePolicies() {
    this.complianceEngine.defineNoEolPolicy();
    this.complianceEngine.defineSecuritySoftwarePolicy();
    this.complianceEngine.defineRuntimeSupportPolicy();
    this.complianceEngine.defineAdvanceWarningPolicy();
  }

  /**
   * Create Phase 17.4 resources
   */
  async createPhase17_4Resources() {
    if (!this.phase17_4) return;

    console.log('Creating Phase 17.4 resources for Phase 58...');

    try {
      // 1. Create dashboard for software lifecycle
      await this.phase17_4.createDashboard({
        name: 'phase58-software-lifecycle',
        title: 'Software Lifecycle Management',
        panels: [
          {
            title: 'Total Software Inventory',
            metric: 'software_total_count',
            type: 'gauge'
          },
          {
            title: 'Critical EOL Alerts',
            metric: 'eol_critical_count',
            type: 'counter',
            threshold: { warning: 1, critical: 5 }
          },
          {
            title: 'Recommended Upgrades',
            metric: 'recommended_upgrades_count',
            type: 'gauge'
          },
          {
            title: 'Compliance Status',
            metric: 'compliance_score',
            type: 'gauge'
          },
          {
            title: 'EOL Timeline',
            metric: 'eol_timeline',
            type: 'timeline'
          },
          {
            title: 'Software by Category',
            metric: 'software_by_category',
            type: 'pie'
          }
        ]
      });

      // 2. Create alert rules
      await this.phase17_4.createAlertRule({
        name: 'phase58-eol-critical',
        condition: 'eol_critical_count > 0',
        severity: 'critical',
        action: 'page-on-call',
        description: 'Critical software EOL alert'
      });

      await this.phase17_4.createAlertRule({
        name: 'phase58-upgrade-overdue',
        condition: 'upgrade_overdue > 0',
        severity: 'high',
        action: 'send-notification',
        description: 'Upgrade recommendations overdue'
      });

      // 3. Create automated workflows
      await this.createAutomatedWorkflows();

      // 4. Create scheduled tasks
      await this.phase17_4.createScheduledTask({
        name: 'phase58-daily-scan',
        schedule: '0 2 * * *', // 2 AM daily
        action: 'run-software-scan',
        description: 'Daily software lifecycle scan'
      });

      await this.phase17_4.createScheduledTask({
        name: 'phase58-compliance-audit',
        schedule: '0 3 * * 0', // Weekly
        action: 'perform-compliance-audit',
        description: 'Weekly compliance audit'
      });

      // 5. Create webhooks for alerts
      await this.phase17_4.createWebhook({
        name: 'phase58-critical-alert',
        event: 'critical-alert',
        url: '/phase58/webhooks/critical-alert',
        description: 'Handle critical software alerts'
      });

      console.log('Phase 17.4 resources created successfully');
    } catch (error) {
      console.error('Error creating Phase 17.4 resources:', error);
      throw error;
    }
  }

  /**
   * Create automated workflows
   */
  async createAutomatedWorkflows() {
    if (!this.phase17_4) return;

    // Workflow: Automatic upgrade scheduling
    await this.phase17_4.createWorkflow({
      name: 'phase58-auto-upgrade-scheduler',
      trigger: { type: 'event', event: 'assessment-complete' },
      steps: [
        {
          id: 'filter-critical',
          name: 'Filter Critical Upgrades',
          action: 'filter',
          params: { criteria: 'severity === "critical"' }
        },
        {
          id: 'schedule-upgrade',
          name: 'Schedule Upgrade',
          action: 'schedule-upgrade',
          params: { window: 'maintenance' }
        },
        {
          id: 'notify-admin',
          name: 'Notify Administrator',
          action: 'send-notification',
          params: { recipients: ['admin'] }
        }
      ]
    });

    // Workflow: Compliance audit
    await this.phase17_4.createWorkflow({
      name: 'phase58-compliance-audit-workflow',
      trigger: { type: 'scheduled', schedule: '0 3 * * 0' },
      steps: [
        {
          id: 'perform-audit',
          name: 'Perform Compliance Audit',
          action: 'compliance-audit'
        },
        {
          id: 'generate-report',
          name: 'Generate Report',
          action: 'generate-report'
        },
        {
          id: 'send-report',
          name: 'Send Report',
          action: 'send-notification',
          params: { channels: ['email', 'dashboard'] }
        }
      ]
    });

    // Workflow: EOL response
    await this.phase17_4.createWorkflow({
      name: 'phase58-eol-response-workflow',
      trigger: { type: 'event', event: 'eol-reached' },
      steps: [
        {
          id: 'create-ticket',
          name: 'Create Incident Ticket',
          action: 'create-ticket',
          params: { priority: 'critical', assignee: 'on-call' }
        },
        {
          id: 'page-oncall',
          name: 'Page On-Call Team',
          action: 'page-on-call'
        },
        {
          id: 'audit-log',
          name: 'Log Event',
          action: 'audit-log'
        }
      ]
    });
  }

  /**
   * Handle scan completed event
   */
  async handleScanCompleted(result) {
    console.log(`Scan completed: ${result.totalSoftware} software items`);

    // Perform compliance audit
    const compliance = this.complianceEngine.performComplianceAudit();

    // Send metrics to Phase 17.4
    if (this.phase17_4) {
      await this.phase17_4.recordMetrics({
        'software_total_count': result.totalSoftware,
        'eol_critical_count': result.alerts.filter(a => a.severity === 'critical').length,
        'recommended_upgrades_count': result.recommendations.totalRecommendations,
        'compliance_score': 100 - (compliance.violations.length / compliance.software.length) * 100
      });
    }
  }

  /**
   * Handle critical alert
   */
  async handleCriticalAlert(alert) {
    console.log(`Critical alert: ${alert.message}`);

    if (!this.phase17_4) return;

    // Create incident
    await this.phase17_4.createIncident({
      title: `Software EOL: ${alert.software}`,
      description: alert.message,
      severity: 'critical',
      assignee: 'on-call',
      tags: ['phase58', 'software-eol', 'immediate-action']
    });

    // Send notification
    await this.phase17_4.sendNotification({
      type: 'critical',
      title: 'Critical Software EOL',
      message: `${alert.software} v${alert.currentVersion} has reached end-of-life`,
      channels: ['slack', 'pagerduty', 'email']
    });
  }

  /**
   * Run complete Phase 58 analysis
   */
  async runFullAnalysis() {
    console.log('Running full Phase 58 analysis...');

    try {
      // 1. Scan registry
      const scanResult = await this.monitor.performFullScan();

      // 2. Check compliance
      const compliance = this.complianceEngine.performComplianceAudit();

      // 3. Generate reports
      const analysis = {
        timestamp: new Date().toISOString(),
        scan: scanResult,
        compliance,
        recommendations: this.advisor.recommendations,
        reportGenerated: new Date().toISOString()
      };

      this.emit('full-analysis-complete', analysis);
      return analysis;
    } catch (error) {
      console.error('Full analysis failed:', error);
      throw error;
    }
  }

  /**
   * Get comprehensive status
   */
  getStatus() {
    return {
      phase: 'Phase 58 - Software Lifecycle Management',
      timestamp: new Date().toISOString(),
      monitoring: this.monitor.getStatus(),
      lastScan: this.monitor.lastFullScan,
      activeAlerts: this.monitor.getActiveAlerts().length,
      recommendations: this.advisor.recommendations.length,
      compliance: this.complianceEngine.compliancePolicies.size > 0
        ? { policies: this.complianceEngine.compliancePolicies.size }
        : { policies: 0 },
      phase17_4Connected: !!this.phase17_4
    };
  }

  /**
   * Generate comprehensive report
   */
  generateReport(format = 'json') {
    const report = {
      type: 'Phase 58 Software Lifecycle Management Report',
      generatedAt: new Date().toISOString(),
      summary: this.monitor.lastFullScan?.recommendations?.summary || {},
      alerts: this.monitor.getActiveAlerts(),
      compliance: this.complianceEngine.generateComplianceReport(),
      recommendations: this.advisor.recommendations.slice(0, 50),
      status: this.getStatus()
    };

    if (format === 'html') {
      return this.advisor.generateHtmlReport();
    } else if (format === 'csv') {
      return this.advisor.exportAsCSV();
    }

    return report;
  }

  /**
   * Shutdown Phase 58
   */
  shutdown() {
    console.log('Shutting down Phase 58...');
    this.monitor.stopMonitoring();
    this.emit('shutdown');
  }
}

/**
 * Export
 */
module.exports = {
  Phase58OrchestrationEngine,
  WindowsRegistryScanner,
  EndOfLifeDatabase,
  UpgradeAdvisor,
  SoftwareLifecycleMonitor,
  LifecycleComplianceEngine
};
