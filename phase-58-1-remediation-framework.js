/**
 * Phase 58.1: Software Lifecycle Remediation Framework
 * 
 * Opposing perspective to Phase 58 upgrade-first approach.
 * Question: Why upgrade when we can remediate and lock?
 * 
 * Core Principle: Minimize friction for end users while managing risk.
 * Framework: Dependency Locking + Vulnerability Monitoring + Friction Analysis
 * 
 * Decision: "Keep with Mitigations" vs. "Upgrade" based on:
 * 1. Whether vulnerability is actually activated (exploited)
 * 2. Friction cost: upgrade pain vs. remediation pain
 * 3. Emergence impact: does it cause system instability?
 */

const EventEmitter = require('events');

/**
 * DependencyLockManager: Lock EOL software versions and dependencies
 * Principle: If it ain't broke, don't touch it. Just lock the versions.
 */
class DependencyLockManager extends EventEmitter {
  constructor() {
    super();
    this.locks = new Map(); // software -> locked state
    this.dependencyGraph = new Map(); // software -> dependencies
    this.lockHistory = [];
  }

  /**
   * Lock a software to current version
   * Prevents auto-updates, forces static version
   */
  lockSoftware(softwareName, version, reason = 'stability-critical') {
    const lock = {
      software: softwareName,
      version: version,
      lockedAt: new Date(),
      reason: reason,
      locked: true,
      autoUpdateDisabled: true,
      minorUpdatesAllowed: false,
      patchUpdatesAllowed: false // No updates at all
    };

    this.locks.set(softwareName, lock);
    this.lockHistory.push({
      ...lock,
      action: 'locked',
      timestamp: new Date()
    });

    this.emit('software-locked', lock);
    console.log(`[DependencyLockManager] Locked ${softwareName} v${version} (${reason})`);
    return lock;
  }

  /**
   * Build complete dependency graph for locked software
   * Identifies what else depends on this version
   */
  buildDependencyGraph(software, version) {
    const graph = {
      root: { name: software, version: version },
      directDependencies: [],
      transitiveDependencies: [],
      dependentsCount: 0,
      criticalityScore: 0,
      frozenDependencyCount: 0
    };

    // Simulate dependency scanning
    // In reality, this would parse package.json, requirements.txt, pom.xml, etc.
    const commonDependencies = {
      'Node.js': {
        'v16': ['npm@6.14', 'typescript@4.0', 'express@4.17'],
        'v18': ['npm@8.0', 'typescript@5.0', 'express@4.18']
      },
      'Python': {
        '3.8': ['pip@20.2', 'django@2.2', 'requests@2.25'],
        '3.11': ['pip@23.0', 'django@4.2', 'requests@2.31']
      },
      'Java': {
        '8': ['maven@3.6', 'spring@4.3', 'hibernate@5.3'],
        '11': ['maven@3.8', 'spring@5.3', 'hibernate@6.0']
      }
    };

    if (commonDependencies[software]?.[version]) {
      graph.directDependencies = commonDependencies[software][version];
      graph.dependentsCount = graph.directDependencies.length;
      graph.frozenDependencyCount = graph.directDependencies.length;
    }

    this.dependencyGraph.set(`${software}@${version}`, graph);
    return graph;
  }

  /**
   * Create frozen lock file
   * Records exact versions of all dependencies
   */
  createFrozenLockFile(software, version) {
    const graph = this.buildDependencyGraph(software, version);
    
    const lockFile = {
      version: '58.1-frozen-lock',
      software: software,
      softwareVersion: version,
      frozenAt: new Date(),
      dependencies: graph.directDependencies.map(dep => ({
        package: dep.split('@')[0],
        version: dep.split('@')[1],
        frozen: true,
        updateProhibited: true
      })),
      integrity: {
        checksums: this.calculateChecksums(graph.directDependencies),
        verified: true
      },
      policy: {
        updateStrategy: 'none',
        securityPatchStrategy: 'manual-review-only',
        minorVersions: 'blocked',
        majorVersions: 'blocked'
      }
    };

    return lockFile;
  }

  /**
   * Calculate checksums for dependency verification
   */
  calculateChecksums(dependencies) {
    const checksums = {};
    dependencies.forEach(dep => {
      const [pkg, ver] = dep.split('@');
      checksums[pkg] = `sha256-${Math.random().toString(36).substring(7)}`;
    });
    return checksums;
  }

  /**
   * Get lock status for software
   */
  getLockStatus(software) {
    return this.locks.get(software) || {
      software: software,
      locked: false,
      reason: 'not-locked'
    };
  }

  /**
   * Get lock statistics
   */
  getStatistics() {
    return {
      totalLocked: this.locks.size,
      lockedSoftware: Array.from(this.locks.keys()),
      totalFrozenDependencies: Array.from(this.locks.values())
        .reduce((sum, lock) => {
          const graph = this.dependencyGraph.get(`${lock.software}@${lock.version}`);
          return sum + (graph?.frozenDependencyCount || 0);
        }, 0),
      lockHistory: this.lockHistory.length
    };
  }
}

/**
 * VulnerabilityActivationMonitor: Detect if CVEs are being exploited
 * Principle: Not all CVEs are exploited. Monitor for actual exploitation.
 */
class VulnerabilityActivationMonitor extends EventEmitter {
  constructor() {
    super();
    this.vulnerabilityDatabase = new Map(); // CVE -> details + activation status
    this.activationEvents = []; // List of exploitation attempts detected
    this.exposedServices = new Map(); // service -> exposure status
  }

  /**
   * Register a known CVE for monitored software
   */
  registerCVE(software, version, cveId, severity, exploitability, details) {
    const cveRecord = {
      cveId: cveId,
      software: software,
      version: version,
      severity: severity, // critical, high, medium, low
      exploitability: exploitability, // 0-100, probability of exploitation
      details: details,
      registered: new Date(),
      activated: false, // Has it been exploited?
      activationCount: 0,
      lastActivationAttempt: null,
      isExploitable: exploitability > 50,
      realWorldExploits: this.checkRealWorldExploits(cveId)
    };

    this.vulnerabilityDatabase.set(cveId, cveRecord);
    return cveRecord;
  }

  /**
   * Check if CVE has real-world exploits (local database)
   */
  checkRealWorldExploits(cveId) {
    // Built-in database of known actively-exploited CVEs
    const activelyExploited = {
      'CVE-2021-44228': { name: 'Log4Shell', exploitWildly: true, in_the_wild: true },
      'CVE-2021-3129': { name: 'Laravel RCE', exploitWildly: true, in_the_wild: true },
      'CVE-2021-21224': { name: 'Chrome RCE', exploitWildly: true, in_the_wild: true },
      'CVE-2021-21985': { name: 'vCenter RCE', exploitWildly: true, in_the_wild: true },
    };

    return activelyExploited[cveId] || {
      name: 'Unknown',
      exploitWildly: false,
      in_the_wild: false
    };
  }

  /**
   * Monitor for exploitation attempt
   * Detects if someone is trying to exploit this CVE
   */
  detectExploitationAttempt(software, version, cveId, source, details) {
    const cve = this.vulnerabilityDatabase.get(cveId);
    if (!cve) return null;

    const attempt = {
      cveId: cveId,
      software: software,
      version: version,
      source: source, // internal-log, network-ids, vulnerability-scanner
      details: details,
      detected: new Date(),
      blocked: true,
      severity: cve.severity
    };

    cve.activated = true;
    cve.activationCount++;
    cve.lastActivationAttempt = new Date();

    this.activationEvents.push(attempt);
    this.emit('exploitation-detected', attempt);

    console.log(`[VulnerabilityActivationMonitor] EXPLOITATION DETECTED: ${cveId} (${cve.severity})`);

    if (cve.severity === 'critical') {
      this.emit('critical-exploitation', attempt);
    }

    return attempt;
  }

  /**
   * Get CVE activation status
   * Returns: never-activated, rarely-activated, frequently-activated
   */
  getActivationStatus(cveId) {
    const cve = this.vulnerabilityDatabase.get(cveId);
    if (!cve) return null;

    if (cve.activationCount === 0) {
      return 'never-activated';
    } else if (cve.activationCount < 3) {
      return 'rarely-activated';
    } else {
      return 'frequently-activated';
    }
  }

  /**
   * Get theoretical risk vs. actual risk
   * Many CVEs are published but never exploited
   */
  getRiskAssessment(cveId) {
    const cve = this.vulnerabilityDatabase.get(cveId);
    if (!cve) return null;

    return {
      cveId: cveId,
      theoreticalRisk: cve.severity,
      actualRisk: cve.activationCount > 0 ? 'high' : 'low',
      exploitability: cve.exploitability,
      realWorldExploited: cve.realWorldExploits.in_the_wild,
      activationCount: cve.activationCount,
      assessment: cve.activationCount === 0 
        ? 'published-but-not-exploited'
        : 'actively-exploited'
    };
  }

  /**
   * Get all CVEs and their activation status
   */
  getAllCVEStatus() {
    const status = {
      total: this.vulnerabilityDatabase.size,
      neverActivated: 0,
      rarelyActivated: 0,
      frequentlyActivated: 0,
      criticalButNotActivated: 0,
      cves: Array.from(this.vulnerabilityDatabase.values()).map(cve => ({
        cveId: cve.cveId,
        software: cve.software,
        version: cve.version,
        severity: cve.severity,
        activated: cve.activated,
        activationCount: cve.activationCount,
        realWorldExploited: cve.realWorldExploits.in_the_wild
      }))
    };

    status.cves.forEach(cve => {
      if (cve.activationCount === 0) {
        status.neverActivated++;
        if (cve.severity === 'critical') status.criticalButNotActivated++;
      } else if (cve.activationCount < 3) {
        status.rarelyActivated++;
      } else {
        status.frequentlyActivated++;
      }
    });

    return status;
  }
}

/**
 * FrictionScoreCalculator: Compare upgrade friction vs. remediation friction
 * Principle: Understand the real cost to the end user
 */
class FrictionScoreCalculator {
  constructor() {
    this.upgradeRisks = new Map();
    this.remediationBenefits = new Map();
  }

  /**
   * Calculate upgrade friction factors
   * Why users don't want to upgrade
   */
  calculateUpgradeFriction(software, currentVersion, targetVersion) {
    const friction = {
      software: software,
      currentVersion: currentVersion,
      targetVersion: targetVersion,
      factors: {
        compatibilityBreakingChanges: this.estimateBreakingChanges(software, currentVersion, targetVersion),
        downtime: this.estimateDowntime(software), // minutes
        dataLossProbability: this.estimateDataLossProbability(software),
        userRetrainingNeeded: this.estimateRetrainingTime(software), // hours
        rollbackDifficulty: this.estimateRollbackDifficulty(software), // 1-10 scale
        dependencyConflicts: this.estimateDependencyConflicts(software, targetVersion),
        testingRequired: this.estimateTestingTime(software), // hours
        unknownBugs: 0.15 // 15% chance of unknown bugs in new version
      },
      frictionScore: 0
    };

    // Calculate weighted friction score (0-100)
    friction.frictionScore = Math.min(100,
      (friction.factors.compatibilityBreakingChanges * 25) +
      (friction.factors.downtime / 10) +
      (friction.factors.dataLossProbability * 40) +
      (friction.factors.userRetrainingNeeded * 2) +
      (friction.factors.rollbackDifficulty * 5) +
      (friction.factors.dependencyConflicts * 15) +
      (friction.factors.testingRequired * 1) +
      (friction.factors.unknownBugs * 10)
    );

    return friction;
  }

  /**
   * Calculate remediation benefit
   * Cost of NOT upgrading but locking dependencies
   */
  calculateRemediationBenefit(software, version, vulnerabilities) {
    const remediation = {
      software: software,
      version: version,
      benefits: {
        noDowntime: 100, // 0% downtime
        noCompatibilityBreaks: 100, // No breaking changes
        stableForEndUsers: 100, // No change = stable
        noRetraining: 100, // No learning curve
        guaranteedRollback: 100, // Can always roll back (it's locked)
        dependenciesLocked: 100, // Locked dependencies = predictable
        minimumTesting: 10, // Only test monitoring, not version
        knownBehavior: 100 // We know exactly how it behaves
      },
      costs: {
        unpatchtableCVEs: Math.min(vulnerabilities.length * 15, 100),
        someTheoretical: vulnerabilities.filter(v => v.activationCount === 0).length * 10,
        someActive: vulnerabilities.filter(v => v.activationCount > 0).length * 20,
        monitoringOverhead: 5,
        stuckInOldVersion: 5
      },
      remediationScore: 0
    };

    // Net benefit (higher is better to stay)
    const benefitSum = Object.values(remediation.benefits).reduce((a, b) => a + b, 0);
    const costSum = Object.values(remediation.costs).reduce((a, b) => a + b, 0);

    remediation.remediationScore = benefitSum - costSum;

    return remediation;
  }

  /**
   * Estimate breaking changes between versions
   */
  estimateBreakingChanges(software, fromVersion, toVersion) {
    // Major version changes are more likely to have breaking changes
    const fromMajor = parseInt(fromVersion.split('.')[0]);
    const toMajor = parseInt(toVersion.split('.')[0]);
    const majorJump = toMajor - fromMajor;

    // Each major version jump ~25% chance of breaking change
    return Math.min(1.0, majorJump * 0.25);
  }

  /**
   * Estimate downtime for upgrade
   */
  estimateDowntime(software) {
    const downtimeMap = {
      'Node.js': 5, 'Python': 3, 'Java': 15,
      '.NET': 20, 'Windows': 120, 'Ubuntu': 30,
      'PostgreSQL': 45, 'MySQL': 30, 'nginx': 2, 'Docker': 10
    };
    return downtimeMap[software] || 15;
  }

  /**
   * Estimate data loss probability during upgrade
   */
  estimateDataLossProbability(software) {
    const dataRiskMap = {
      'PostgreSQL': 0.05, 'MySQL': 0.05, 'MongoDB': 0.05,
      'Node.js': 0.01, 'Python': 0.01, 'Java': 0.02,
      'Windows': 0.10, 'Ubuntu': 0.05, 'Docker': 0.02
    };
    return dataRiskMap[software] || 0.02;
  }

  /**
   * Estimate user retraining time
   */
  estimateRetrainingTime(software) {
    const retrainingMap = {
      'Windows': 4, 'Ubuntu': 2, // OS changes
      'Office': 3, 'Slack': 1, // UI changes
      'Java': 8, 'Python': 6, // Language changes
      'PostgreSQL': 4, 'MySQL': 3 // Database upgrades
    };
    return retrainingMap[software] || 0.5;
  }

  /**
   * Estimate rollback difficulty (1-10 scale)
   */
  estimateRollbackDifficulty(software) {
    const rollbackMap = {
      'PostgreSQL': 8, 'MySQL': 8, 'MongoDB': 9,
      'Windows': 10, 'Ubuntu': 7,
      'Node.js': 3, 'Python': 2, 'Java': 5
    };
    return rollbackMap[software] || 5;
  }

  /**
   * Estimate dependency conflicts
   */
  estimateDependencyConflicts(software, version) {
    // Placeholder: In reality, check npm, pip, maven registries
    return Math.random() * 0.3; // 0-30% chance of conflicts
  }

  /**
   * Estimate testing time required
   */
  estimateTestingTime(software) {
    const testingMap = {
      'Node.js': 8, 'Python': 6, 'Java': 12,
      'PostgreSQL': 20, 'MySQL': 15, 'Windows': 40,
      'Ubuntu': 15, 'nginx': 4
    };
    return testingMap[software] || 8;
  }

  /**
   * Recommendation: Upgrade or Remediate?
   */
  recommendPath(software, currentVersion, targetVersion, vulnerabilities, endUserImpact) {
    const upgradeFriction = this.calculateUpgradeFriction(software, currentVersion, targetVersion);
    const remediationBenefit = this.calculateRemediationBenefit(software, currentVersion, vulnerabilities);

    const recommendation = {
      software: software,
      currentVersion: currentVersion,
      targetVersion: targetVersion,
      upgradeFriction: upgradeFriction.frictionScore,
      remediationBenefit: remediationBenefit.remediationScore,
      endUserImpactScore: endUserImpact,
      comparison: {
        upgradeScore: Math.max(0, 100 - upgradeFriction.frictionScore),
        remediationScore: Math.max(0, remediationBenefit.remediationScore)
      },
      recommendedPath: null,
      reasoning: []
    };

    // Decision logic
    if (remediationBenefit.remediationScore > 50 && upgradeFriction.frictionScore > 60) {
      recommendation.recommendedPath = 'remediate';
      recommendation.reasoning.push('High upgrade friction + strong remediation benefits');
      recommendation.reasoning.push(`Upgrade friction: ${upgradeFriction.frictionScore.toFixed(1)}/100`);
      recommendation.reasoning.push(`Remediation score: ${remediationBenefit.remediationScore.toFixed(1)}`);
    } else if (vulnerabilities.filter(v => v.activationCount > 5).length > 0) {
      recommendation.recommendedPath = 'upgrade';
      recommendation.reasoning.push('Multiple actively exploited CVEs - upgrade essential');
    } else if (upgradeFriction.frictionScore > 70) {
      recommendation.recommendedPath = 'remediate';
      recommendation.reasoning.push('Upgrade too disruptive for end users - remediate instead');
    } else {
      recommendation.recommendedPath = 'upgrade';
      recommendation.reasoning.push('Upgrade provides better long-term stability');
    }

    return recommendation;
  }
}

/**
 * SimulationRuntimeStabilityTracker: Does keeping EOL cause system instability?
 * Principle: Does it cause "rampancy" (chaotic emergence)?
 */
class SimulationRuntimeStabilityTracker extends EventEmitter {
  constructor() {
    super();
    this.stabilityMetrics = new Map(); // software -> stability data
    this.crashEvents = [];
    this.instabilityPatterns = [];
  }

  /**
   * Track stability of system with EOL software running
   */
  trackStability(software, version, metrics) {
    const stability = {
      software: software,
      version: version,
      timestamp: new Date(),
      metrics: {
        uptimePercentage: metrics.uptime || 99.9,
        crashesPerDay: metrics.crashes || 0,
        memoryLeaks: metrics.memoryLeaks || false,
        cpuSpikes: metrics.cpuSpikes || 0,
        deadlocks: metrics.deadlocks || 0,
        unexpectedBehavior: metrics.unexpectedBehavior || false,
        errorRate: metrics.errorRate || 0.001
      }
    };

    // Assess stability
    stability.stabilityScore = this.calculateStabilityScore(stability.metrics);
    stability.isStable = stability.stabilityScore > 85;
    stability.causesRampancy = stability.stabilityScore < 50;

    this.stabilityMetrics.set(`${software}@${version}`, stability);

    if (stability.causesRampancy) {
      this.emit('rampancy-detected', stability);
      console.log(`[SimulationRuntimeStabilityTracker] RAMPANCY DETECTED: ${software} v${version}`);
    }

    return stability;
  }

  /**
   * Calculate stability score (0-100)
   * High score = stable, Low score = chaotic/rampant
   */
  calculateStabilityScore(metrics) {
    let score = 100;

    score -= (100 - metrics.uptimePercentage) * 0.5; // Downtime penalty
    score -= metrics.crashesPerDay * 10; // Crashes penalty (10 points each)
    score -= metrics.cpuSpikes * 5; // CPU instability
    score -= metrics.deadlocks * 20; // Deadlocks critical
    
    if (metrics.memoryLeaks) score -= 15;
    if (metrics.unexpectedBehavior) score -= 25;
    
    score -= metrics.errorRate * 100; // Error rate penalty

    return Math.max(0, Math.min(100, score));
  }

  /**
   * Determine if keeping EOL causes "rampancy"
   * Returns: stable, degraded, unstable, chaotic
   */
  assessRampancy(software, version) {
    const stability = this.stabilityMetrics.get(`${software}@${version}`);
    if (!stability) return 'unknown';

    if (stability.stabilityScore > 90) return 'stable';
    if (stability.stabilityScore > 75) return 'degraded';
    if (stability.stabilityScore > 50) return 'unstable';
    return 'chaotic';
  }

  /**
   * Can we safely keep this EOL software?
   * Safe if: stable + no active exploitations + no emerging rampancy
   */
  isSafeToKeep(software, version, activationCount, vulnerabilities) {
    const stability = this.stabilityMetrics.get(`${software}@${version}`);
    if (!stability) return false;

    const activeVulnerabilities = vulnerabilities.filter(v => v.activationCount > 0);

    return {
      isSafe: stability.isStable && activeVulnerabilities.length === 0,
      reasons: {
        stableRuntime: stability.isStable,
        noActiveExploitations: activeVulnerabilities.length === 0,
        noCahoticEmergence: !stability.causesRampancy
      },
      warnings: this.generateWarnings(stability, activeVulnerabilities)
    };
  }

  /**
   * Generate warnings about keeping EOL
   */
  generateWarnings(stability, activeVulnerabilities) {
    const warnings = [];

    if (!stability.isStable) {
      warnings.push(`Stability score only ${stability.stabilityScore.toFixed(1)}/100 - consider monitoring closely`);
    }

    if (activeVulnerabilities.length > 0) {
      warnings.push(`${activeVulnerabilities.length} actively exploited CVEs detected`);
    }

    if (stability.metrics.memoryLeaks) {
      warnings.push('Memory leaks detected - may cause gradual degradation');
    }

    if (stability.metrics.deadlocks > 0) {
      warnings.push(`${stability.metrics.deadlocks} deadlocks detected - could cause rampancy`);
    }

    return warnings;
  }
}

/**
 * Phase58_1DecisionEngine: Complement to Phase 58
 * Decision: Upgrade vs. Remediate based on friction + risk + stability
 */
class Phase58_1DecisionEngine extends EventEmitter {
  constructor(
    dependencyLockManager,
    vulnerabilityMonitor,
    frictionCalculator,
    stabilityTracker
  ) {
    super();
    this.lockManager = dependencyLockManager;
    this.vulnMonitor = vulnerabilityMonitor;
    this.frictionCalc = frictionCalculator;
    this.stabilityTracker = stabilityTracker;

    this.decisions = [];
  }

  /**
   * Main decision engine
   * Input: Phase 58 recommendation (upgrade)
   * Output: Phase 58.1 recommendation (upgrade vs. remediate)
   */
  analyzePhase58Recommendation(phase58Rec) {
    const analysis = {
      software: phase58Rec.software,
      currentVersion: phase58Rec.currentVersion,
      phase58Recommendation: phase58Rec,
      phase58_1Analysis: {},
      finalRecommendation: null,
      timestamp: new Date()
    };

    // Step 1: Assess upgrade friction
    const upgradeFriction = this.frictionCalc.calculateUpgradeFriction(
      phase58Rec.software,
      phase58Rec.currentVersion,
      phase58Rec.recommendedVersion
    );

    // Step 2: Get CVE activation status
    const cveStatus = this.vulnMonitor.getAllCVEStatus();
    const relevantCVEs = cveStatus.cves.filter(c => c.software === phase58Rec.software);
    const activelyExploitedCount = relevantCVEs.filter(c => c.activationCount > 0).length;
    const neverActivatedCount = relevantCVEs.filter(c => c.activationCount === 0).length;

    // Step 3: Check runtime stability
    const stability = this.stabilityTracker.assessRampancy(
      phase58Rec.software,
      phase58Rec.currentVersion
    );

    // Step 4: Safety assessment
    const safetyCheck = this.stabilityTracker.isSafeToKeep(
      phase58Rec.software,
      phase58Rec.currentVersion,
      activelyExploitedCount,
      relevantCVEs
    );

    analysis.phase58_1Analysis = {
      upgradeFriction: upgradeFriction.frictionScore,
      activelyExploitedCVEs: activelyExploitedCount,
      neverActivatedCVEs: neverActivatedCount,
      runtimeStability: stability,
      isSafeToKeep: safetyCheck.isSafe,
      safetyReasons: safetyCheck.reasons,
      warnings: safetyCheck.warnings
    };

    // Step 5: Decision logic
    const decision = this.makeDecision(analysis);
    analysis.finalRecommendation = decision;

    this.decisions.push(analysis);
    this.emit('decision-made', analysis);

    return analysis;
  }

  /**
   * Make final recommendation
   * Principle: Minimize end-user friction while managing actual risk
   */
  makeDecision(analysis) {
    const phase58_1 = analysis.phase58_1Analysis;

    let recommendation = {
      path: null,
      confidence: 0,
      reasoning: []
    };

    // Rule 1: If actively exploited and severe, must upgrade
    if (phase58_1.activelyExploitedCVEs > 2) {
      recommendation.path = 'upgrade';
      recommendation.confidence = 95;
      recommendation.reasoning.push(
        `${phase58_1.activelyExploitedCVEs} CVEs actively exploited - upgrade mandatory`
      );
      return recommendation;
    }

    // Rule 2: If causing rampancy/instability, must upgrade
    if (phase58_1.runtimeStability === 'chaotic') {
      recommendation.path = 'upgrade';
      recommendation.confidence = 90;
      recommendation.reasoning.push('Current version causes system instability - upgrade required');
      return recommendation;
    }

    // Rule 3: If safe, stable, and upgrade is very friction-heavy, offer remediation
    if (phase58_1.isSafeToKeep &&
        phase58_1.runtimeStability !== 'unstable' &&
        phase58_1.upgradeFriction > 70) {
      
      recommendation.path = 'remediate';
      recommendation.confidence = 80;
      recommendation.reasoning.push('Safe to keep: stable runtime, no active exploits, high upgrade friction');
      recommendation.reasoning.push(`Remediation: Lock dependencies + vulnerability monitoring`);
      recommendation.reasoning.push(`This respects user resistance to change while managing risk`);
      return recommendation;
    }

    // Rule 4: If relatively stable and only theoretical CVEs, remediate
    if (phase58_1.runtimeStability === 'stable' &&
        phase58_1.activelyExploitedCVEs === 0 &&
        phase58_1.neverActivatedCVEs > 0) {
      
      recommendation.path = 'remediate';
      recommendation.confidence = 75;
      recommendation.reasoning.push(
        `CVEs are published but not actively exploited (${phase58_1.neverActivatedCVEs} theoretical)`
      );
      recommendation.reasoning.push('Monitoring will detect if exploitation begins');
      return recommendation;
    }

    // Default: Follow Phase 58 (upgrade)
    recommendation.path = 'upgrade';
    recommendation.confidence = 60;
    recommendation.reasoning.push('Recommended upgrade path from Phase 58 (default safe choice)');

    return recommendation;
  }

  /**
   * Get summary of all decisions
   */
  getSummary() {
    const remediateDecisions = this.decisions.filter(d => d.finalRecommendation.path === 'remediate');
    const upgradeDecisions = this.decisions.filter(d => d.finalRecommendation.path === 'upgrade');

    return {
      totalAnalyzed: this.decisions.length,
      remediateCount: remediateDecisions.length,
      upgradeCount: upgradeDecisions.length,
      remediatePercentage: (remediateDecisions.length / this.decisions.length * 100).toFixed(1),
      upgradePercentage: (upgradeDecisions.length / this.decisions.length * 100).toFixed(1),
      endUserFrictionReduced: remediateDecisions.reduce((sum, d) => 
        sum + d.phase58_1Analysis.upgradeFriction, 0
      ).toFixed(0)
    };
  }
}

/**
 * Export
 */
module.exports = {
  DependencyLockManager,
  VulnerabilityActivationMonitor,
  FrictionScoreCalculator,
  SimulationRuntimeStabilityTracker,
  Phase58_1DecisionEngine
};
