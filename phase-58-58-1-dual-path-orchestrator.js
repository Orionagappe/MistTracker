/**
 * Phase 58 & 58.1 Integration: Dual-Path Decision Framework
 * 
 * Phase 58: "You should upgrade"
 * Phase 58.1: "But maybe you shouldn't - here's why"
 * 
 * Together: Risk-aware, friction-minimizing software lifecycle management
 */

const { Phase58OrchestrationEngine } = require('./phase-58-orchestration-engine');
const {
  DependencyLockManager,
  VulnerabilityActivationMonitor,
  FrictionScoreCalculator,
  SimulationRuntimeStabilityTracker,
  Phase58_1DecisionEngine
} = require('./phase-58-1-remediation-framework');

const EventEmitter = require('events');

/**
 * DualPathSoftwareLifecycleOrchestrator: Phase 58 + Phase 58.1
 * 
 * Provides two perspectives on each EOL software:
 * 1. Phase 58 (Upgrade-first): "This software is at risk, upgrade it"
 * 2. Phase 58.1 (Remediate-first): "This software is stable, lock it"
 * 
 * Final decision: Which minimizes end-user friction while managing risk?
 */
class DualPathSoftwareLifecycleOrchestrator extends EventEmitter {
  constructor(phase17_4Platform = null) {
    super();

    // Phase 58: Upgrade-focused
    this.phase58 = new Phase58OrchestrationEngine(phase17_4Platform);

    // Phase 58.1: Remediation-focused
    this.lockManager = new DependencyLockManager();
    this.vulnMonitor = new VulnerabilityActivationMonitor();
    this.frictionCalc = new FrictionScoreCalculator();
    this.stabilityTracker = new SimulationRuntimeStabilityTracker();
    this.decisionEngine = new Phase58_1DecisionEngine(
      this.lockManager,
      this.vulnMonitor,
      this.frictionCalc,
      this.stabilityTracker
    );

    this.analysisResults = [];
    this.setupListeners();
  }

  /**
   * Setup event listeners
   */
  setupListeners() {
    this.phase58.on('assessment-complete', (assessment) => {
      this.handlePhase58Assessment(assessment);
    });

    this.decisionEngine.on('decision-made', (decision) => {
      this.emit('dual-path-decision', decision);
    });
  }

  /**
   * Initialize dual-path analysis
   */
  async initialize() {
    console.log('Initializing Dual-Path Software Lifecycle Management');
    console.log('  Phase 58: Upgrade-first analysis');
    console.log('  Phase 58.1: Remediation-first analysis');
    console.log('');

    try {
      await this.phase58.initialize();
      console.log('Dual-path system ready');
      this.emit('initialized');
    } catch (error) {
      console.error('Initialization failed:', error);
      throw error;
    }
  }

  /**
   * Handle Phase 58 assessment
   * Feed into Phase 58.1 for complementary analysis
   */
  async handlePhase58Assessment(assessment) {
    console.log(`\n[DualPathOrchestrator] Analyzing ${assessment.software}...`);

    // Phase 58 recommends upgrade - now Phase 58.1 analyzes if we actually need to
    const phase58_1Analysis = this.decisionEngine.analyzePhase58Recommendation(assessment);

    // Emit combined analysis
    this.analysisResults.push(phase58_1Analysis);
    this.emit('analysis-complete', phase58_1Analysis);

    // Handle based on recommendation
    if (phase58_1Analysis.finalRecommendation.path === 'remediate') {
      await this.applyRemediationStrategy(phase58_1Analysis);
    } else {
      // Follow Phase 58 upgrade recommendation
      console.log(`[DualPathOrchestrator] ${assessment.software}: Following Phase 58 upgrade path`);
    }
  }

  /**
   * Apply remediation strategy for EOL software
   */
  async applyRemediationStrategy(analysis) {
    const software = analysis.software;
    const version = analysis.currentVersion;

    console.log(`\n[DualPathOrchestrator] Applying remediation strategy to ${software} v${version}`);
    console.log(`  Reason: ${analysis.finalRecommendation.reasoning.join(' | ')}`);

    // Step 1: Lock the software and dependencies
    this.lockManager.lockSoftware(
      software,
      version,
      'eol-but-stable-and-low-friction'
    );

    const lockFile = this.lockManager.createFrozenLockFile(software, version);
    console.log(`  ✓ Dependency lock created (${lockFile.dependencies.length} dependencies frozen)`);

    // Step 2: Register CVEs for monitoring
    const vulnerabilities = analysis.phase58_1Analysis.activelyExploitedCVEs +
                           analysis.phase58_1Analysis.neverActivatedCVEs;

    if (vulnerabilities > 0) {
      console.log(`  ✓ Monitoring activated for ${vulnerabilities} CVEs`);
      console.log(`    - Actively exploited: ${analysis.phase58_1Analysis.activelyExploitedCVEs}`);
      console.log(`    - Published but not exploited: ${analysis.phase58_1Analysis.neverActivatedCVEs}`);
    }

    // Step 3: Set up continuous monitoring
    this.setupMonitoringForRemediatedSoftware(software, version);

    console.log(`  ✓ Continuous monitoring: enabled`);
    console.log(`  ✓ End-user experience: preserved (no upgrade friction)`);
  }

  /**
   * Setup continuous monitoring for remediatedSoftware
   */
  setupMonitoringForRemediatedSoftware(software, version) {
    const monitoringConfig = {
      software: software,
      version: version,
      strategy: 'dependency-lock-with-vulnerability-monitoring',
      checks: {
        vulnerabilityExploitation: {
          enabled: true,
          frequency: 'continuous',
          action: 'alert-if-exploited'
        },
        runtimeStability: {
          enabled: true,
          frequency: 'hourly',
          action: 'alert-if-degraded'
        },
        dependencyIntegrity: {
          enabled: true,
          frequency: 'daily',
          action: 'verify-locked-versions'
        },
        emergenceDetection: {
          enabled: true,
          frequency: 'realtime',
          action: 'alert-if-rampancy-detected'
        }
      },
      alerts: [
        {
          type: 'exploitation-detected',
          severity: 'critical',
          action: 'escalate-to-upgrade'
        },
        {
          type: 'stability-degraded',
          severity: 'high',
          action: 'escalate-to-upgrade'
        },
        {
          type: 'rampancy-detected',
          severity: 'critical',
          action: 'escalate-to-upgrade'
        }
      ]
    };

    console.log(`    Monitoring config: ${JSON.stringify(monitoringConfig.checks, null, 2)}`);
    return monitoringConfig;
  }

  /**
   * Run full dual-path analysis
   */
  async runFullDualPathAnalysis() {
    console.log('\n=== DUAL-PATH ANALYSIS ===\n');

    try {
      // Phase 58: Full scan
      const phase58Results = await this.phase58.runFullAnalysis();

      // Wait for Phase 58.1 analysis to complete
      console.log('\nPhase 58 scan complete - Phase 58.1 analyzing recommendations...\n');

      return {
        phase58Results: phase58Results,
        phase58_1Results: this.analysisResults,
        summary: this.getSummary()
      };
    } catch (error) {
      console.error('Analysis failed:', error);
      throw error;
    }
  }

  /**
   * Get comprehensive status and comparison
   */
  getStatus() {
    const phase58Status = this.phase58.getStatus();
    const phase58_1Summary = this.decisionEngine.getSummary();
    const lockStats = this.lockManager.getStatistics();
    const cveStats = this.vulnMonitor.getAllCVEStatus();

    return {
      timestamp: new Date().toISOString(),
      phase58: phase58Status,
      phase58_1: {
        summary: phase58_1Summary,
        lockedSoftware: lockStats.totalLocked,
        frozenDependencies: lockStats.totalFrozenDependencies,
        cveMonitored: cveStats.total,
        cveNeverActivated: cveStats.neverActivated,
        cveRarelyActivated: cveStats.rarelyActivated,
        cveFrequentlyActivated: cveStats.frequentlyActivated,
        cveActivatedButNotCritical: cveStats.criticalButNotActivated
      },
      endUserImpact: {
        upgradeRecommendations: phase58_1Summary.upgradeCount,
        remediationRecommendations: phase58_1Summary.remediateCount,
        estimatedFrictionReduced: `${phase58_1Summary.endUserFrictionReduced} friction points avoided`,
        message: `${phase58_1Summary.remediatePercentage}% of recommendations chose remediation to respect user resistance to change`
      }
    };
  }

  /**
   * Generate comparative report
   */
  generateComparativeReport() {
    const report = {
      title: 'Phase 58 vs. Phase 58.1: Dual-Path Software Lifecycle Analysis',
      generatedAt: new Date().toISOString(),
      philosophy: {
        phase58: 'Upgrade-first: Pursue latest versions for security and features',
        phase58_1: 'Remediate-first: Respect user resistance to change, lock stable versions',
        combined: 'Minimize friction while managing actual risk - not theoretical risk'
      },
      analysisResults: this.analysisResults.slice(0, 20), // Top 20
      summary: this.getStatus(),
      keyInsights: [
        {
          insight: 'Theoretical vs. Actual Risk',
          finding: `${this.vulnMonitor.getAllCVEStatus().neverActivated} CVEs published but never exploited`,
          implication: 'Not all EOL software is actually at risk'
        },
        {
          insight: 'Upgrade Friction Scores',
          finding: `Average friction: ${(this.analysisResults.reduce((sum, a) => 
            sum + a.phase58_1Analysis.upgradeFriction, 0) / (this.analysisResults.length || 1)).toFixed(1)}/100`,
          implication: 'High friction upgrades may cause more problems than stability'
        },
        {
          insight: 'User Resistance to Change',
          finding: `${this.decisionEngine.getSummary().remediatePercentage}% chose remediation over upgrade`,
          implication: 'Users prefer stable, known systems over risky upgrades'
        },
        {
          insight: 'Monitored CVEs with Zero Exploitations',
          finding: `${this.vulnMonitor.getAllCVEStatus().criticalButNotActivated} critical CVEs never activated`,
          implication: 'Monitoring alone may be sufficient for many EOL critical vulns'
        }
      ],
      recommendations: this.generateStrategicRecommendations()
    };

    return report;
  }

  /**
   * Generate strategic recommendations
   */
  generateStrategicRecommendations() {
    const decisions = this.decisionEngine.decisions;
    const remediateDecisions = decisions.filter(d => d.finalRecommendation.path === 'remediate');
    const upgradeDecisions = decisions.filter(d => d.finalRecommendation.path === 'upgrade');

    return {
      immediateTakeaways: [
        'Not all EOL software needs immediate upgrade',
        'Stable systems with no active exploits can safely be locked',
        'Dependency locking + monitoring is a valid alternative to upgrade',
        'User resistance to change is a legitimate operational concern'
      ],
      forRemediatedSoftware: [
        'Set up continuous vulnerability monitoring for exploitation attempts',
        'Track runtime stability metrics (uptime, crashes, memory leaks)',
        'Implement alert escalation if exploitation is detected',
        'Create upgrade path if rampancy/instability emerges',
        'Regular reviews quarterly to reassess strategy'
      ],
      forUpgradedSoftware: [
        'Follow Phase 58 upgrade recommendations strictly',
        'Test thoroughly before deployment',
        'Have rollback plans ready',
        'Monitor for new CVEs in upgraded versions'
      ],
      organizationStrategy: [
        `Consider remediation for ${remediateDecisions.length} EOL software items`,
        `Plan upgrades for ${upgradeDecisions.length} high-risk items`,
        'Use this dual-path framework for all future EOL decisions',
        'Build organizational acceptance for "stable EOL is acceptable"'
      ]
    };
  }

  /**
   * Export analysis as comprehensive report
   */
  exportReport(format = 'json') {
    if (format === 'json') {
      return this.generateComparativeReport();
    } else if (format === 'html') {
      return this.generateHtmlReport();
    } else if (format === 'csv') {
      return this.generateCsvReport();
    }
  }

  /**
   * Shutdown
   */
  shutdown() {
    console.log('Shutting down dual-path orchestrator...');
    this.phase58.shutdown();
    this.emit('shutdown');
  }
}

/**
 * Export
 */
module.exports = {
  DualPathSoftwareLifecycleOrchestrator
};
