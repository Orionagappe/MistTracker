/**
 * Phase 17.5-Beta: System Stability Modeler
 * 
 * Predicts system degradation, chaos emergence (rampancy),
 * and stability trajectories based on software composition
 */

/**
 * SystemStabilityModeler: Forecast system health trajectories
 */
class SystemStabilityModeler {
  constructor() {
    // Stability baseline factors
    this.stabilityFactors = this.initializeStabilityFactors();

    // Chaos indicators (rampancy detection)
    this.chaosIndicators = this.initializeChaosIndicators();

    this.predictions = new Map();
    this.systemMetrics = new Map();
  }

  /**
   * Initialize stability baseline factors
   */
  initializeStabilityFactors() {
    return {
      // Software age impact on stability
      ageStability: {
        '< 3 months': 70,    // New software: inherent instability
        '3-6 months': 75,    // Settling in
        '6-12 months': 82,   // Maturing
        '1-2 years': 88,     // Stable
        '2-3 years': 85,     // Approaching EOL, slight decline
        '3+ years': 75       // Post-EOL, degrading
      },

      // CVE impact on stability
      cveStability: {
        activeCVEs: {
          0: 0,              // No active CVEs: 0 points penalty
          1: -5,             // 1 active CVE: -5 stability
          3: -15,            // 3 active CVEs: -15 stability
          5: -25,            // 5+ active CVEs: -25 stability
          10: -40            // 10+ active CVEs: severe instability
        },

        // CVE acceleration (more CVEs discovered recently = worse)
        discoveryRate: {
          stable: 0,         // Normal discovery rate
          accelerating: -10, // More CVEs per month
          critical: -20      // Vulnerability floodgates opened
        }
      },

      // Dependency complexity impact
      dependencyStability: {
        'simple': 0,         // 0-2 dependencies: no penalty
        'moderate': -5,      // 3-5 dependencies: slight instability
        'complex': -15,      // 6-10 dependencies: increased instability
        'tangled': -25       // 10+ dependencies: severe complexity risk
      },

      // Version divergence (how far behind latest)
      versionDriftPenalty: {
        0: 0,                // Current version
        1: -3,               // 1 minor version behind
        3: -8,               // 3 minor versions behind
        5: -15,              // 5+ minor versions behind
        'major': -25         // Major version behind
      }
    };
  }

  /**
   * Initialize chaos indicators (rampancy detection)
   */
  initializeChaosIndicators() {
    return {
      // Signs of system degradation
      degradationSigns: {
        'increasing_error_rates': {
          weight: 3,
          threshold: 0.5, // 50% increase in errors
          impact: -15
        },
        'memory_leaks': {
          weight: 4,
          indicator: 'memory_usage_trend',
          impact: -20
        },
        'hanging_processes': {
          weight: 3,
          indicator: 'timeout_count',
          impact: -18
        },
        'cascading_failures': {
          weight: 5,
          indicator: 'failure_propagation',
          impact: -30
        },
        'resource_exhaustion': {
          weight: 4,
          indicator: 'cpu_memory_saturation',
          impact: -25
        }
      },

      // Rampancy indicators (system going chaotic)
      rampancyIndicators: {
        'exponential_errors': {
          description: 'Error rate doubling every N days',
          severity: 'CRITICAL',
          impact: -40
        },
        'dependency_breaking': {
          description: 'Dependent systems failing due to upstream changes',
          severity: 'HIGH',
          impact: -30
        },
        'recovery_failing': {
          description: 'Restart/recovery procedures not working',
          severity: 'CRITICAL',
          impact: -35
        },
        'resource_thrashing': {
          description: 'System oscillating between high/low resource usage',
          severity: 'HIGH',
          impact: -25
        }
      }
    };
  }

  /**
   * Predict system stability trajectory
   */
  predictSystemStability(systemName, assets, timeframeMonths = 12) {
    const key = `${systemName}:${timeframeMonths}m`;

    if (this.predictions.has(key)) {
      return this.predictions.get(key);
    }

    const baseline = this.calculateStabilityBaseline(assets);
    const trajectory = this.calculateTrajectory(assets, timeframeMonths);
    const chaosRisk = this.assessChaosRisk(assets);

    const prediction = {
      system: systemName,
      forecastMonths: timeframeMonths,
      timestamp: new Date(),

      current: {
        stabilityScore: baseline.score,
        stabilityLevel: this.getStabilityLevel(baseline.score),
        components: baseline.components,
        riskFactors: baseline.riskFactors
      },

      trajectory: trajectory,

      forecast: {
        timeframeMonths,
        projectedScore: trajectory.endScore,
        projectedLevel: this.getStabilityLevel(trajectory.endScore),
        trend: trajectory.trend,
        degradationRate: trajectory.degradationRate
      },

      chaosRisk: chaosRisk,

      milestones: this.identifyStabilityMilestones(baseline, trajectory),

      recommendations: this.generateStabilityRecommendations(
        baseline.score,
        trajectory.trend,
        chaosRisk
      )
    };

    this.predictions.set(key, prediction);
    return prediction;
  }

  /**
   * Calculate baseline stability score
   */
  calculateStabilityBaseline(assets) {
    let totalScore = 85; // Start at "good"
    const components = {};

    // Age factor
    const avgAge = this.calculateAverageAge(assets);
    const ageFactor = this.getAgeFactor(avgAge);
    components.ageFactor = ageFactor;
    totalScore += ageFactor;

    // CVE factor
    const totalActiveCVEs = assets.reduce((sum, a) => sum + (a.analysis?.cveActivated || 0), 0);
    const cveFactor = this.getCVEFactor(totalActiveCVEs);
    components.cveFactor = cveFactor;
    totalScore += cveFactor;

    // Dependency complexity
    const depComplexity = this.calculateDependencyComplexity(assets);
    const depFactor = this.getDependencyFactor(depComplexity);
    components.dependencyFactor = depFactor;
    totalScore += depFactor;

    // Version drift
    const versionDrift = this.calculateVersionDrift(assets);
    const driftFactor = this.getDriftFactor(versionDrift);
    components.versionDriftFactor = driftFactor;
    totalScore += driftFactor;

    // Cap at 0-100
    totalScore = Math.max(0, Math.min(100, totalScore));

    return {
      score: Math.round(totalScore),
      components,
      riskFactors: {
        activeCVEs: totalActiveCVEs,
        averageAge: avgAge,
        dependencyComplexity: depComplexity,
        versionDrift
      }
    };
  }

  /**
   * Calculate average software age (days)
   */
  calculateAverageAge(assets) {
    const ages = assets.map(a => a.analysis?.daysUntilEOL || 365 * 2);
    return Math.round(ages.reduce((a, b) => a + b, 0) / ages.length);
  }

  /**
   * Get age factor
   */
  getAgeFactor(avgAgeDays) {
    const months = avgAgeDays / 30;
    if (months < 3) return -8;      // New, immature
    if (months < 6) return -3;
    if (months < 12) return 0;
    if (months < 24) return 5;      // Sweet spot
    if (months < 36) return 2;
    return -8;                       // Post-EOL
  }

  /**
   * Get CVE factor
   */
  getCVEFactor(totalActiveCVEs) {
    if (totalActiveCVEs === 0) return 0;
    if (totalActiveCVEs === 1) return -5;
    if (totalActiveCVEs <= 3) return -12;
    if (totalActiveCVEs <= 5) return -20;
    return -35; // 5+ active CVEs
  }

  /**
   * Calculate dependency complexity (degree in graph)
   */
  calculateDependencyComplexity(assets) {
    const totalDeps = assets.reduce((sum, a) => sum + (a.dependencies?.length || 0), 0);
    const totalDependents = assets.reduce((sum, a) => sum + (a.dependents?.length || 0), 0);
    return totalDeps + totalDependents;
  }

  /**
   * Get dependency factor
   */
  getDependencyFactor(complexity) {
    if (complexity <= 2) return 0;
    if (complexity <= 5) return -5;
    if (complexity <= 10) return -12;
    if (complexity <= 20) return -20;
    return -30;
  }

  /**
   * Calculate version drift (how far behind)
   */
  calculateVersionDrift(assets) {
    return assets.reduce((sum, a) => {
      const current = this.parseVersion(a.version);
      const target = this.parseVersion(a.analysis?.targetVersion || a.version);

      const majorGap = Math.abs(target.major - current.major);
      const minorGap = Math.abs(target.minor - current.minor);

      return sum + (majorGap * 5 + minorGap);
    }, 0);
  }

  /**
   * Get drift factor
   */
  getDriftFactor(drift) {
    if (drift === 0) return 0;
    if (drift <= 5) return -3;
    if (drift <= 15) return -10;
    if (drift <= 30) return -18;
    return -25;
  }

  /**
   * Parse version
   */
  parseVersion(versionStr) {
    const parts = versionStr.split('.');
    return {
      major: parseInt(parts[0]) || 0,
      minor: parseInt(parts[1]) || 0
    };
  }

  /**
   * Calculate trajectory over timeframe
   */
  calculateTrajectory(assets, monthsAhead) {
    const currentScore = this.calculateStabilityBaseline(assets).score;

    // Degradation factors
    let monthlyDegradation = 0;

    // Factor 1: Version aging
    const futureAge = monthsAhead / 12;
    monthlyDegradation += futureAge * 0.5; // 0.5 points/month degradation from aging

    // Factor 2: CVE accumulation
    const avgCVEsPerMonth = 0.8; // Typical software accumulates ~1 CVE/year
    const projectedNewCVEs = monthsAhead * avgCVEsPerMonth;
    monthlyDegradation += projectedNewCVEs * 0.3; // 0.3 points per new CVE

    // Factor 3: Dependency drift (more out-of-date)
    monthlyDegradation += 0.2; // Slight drift degradation

    // Calculate end score
    let endScore = currentScore - (monthlyDegradation * monthsAhead);
    endScore = Math.max(0, Math.min(100, endScore));

    // Determine trend
    let trend = 'STABLE';
    const degradationRate = monthlyDegradation;

    if (degradationRate > 1.0) trend = 'RAPIDLY DEGRADING';
    else if (degradationRate > 0.5) trend = 'DEGRADING';
    else if (degradationRate < 0.1) trend = 'STABLE';

    return {
      startScore: currentScore,
      endScore: Math.round(endScore),
      monthlyDegradationRate: Math.round(degradationRate * 100) / 100,
      totalDegradation: Math.round((currentScore - endScore) * 10) / 10,
      trend,
      projectedCVEs: Math.round(projectedNewCVEs)
    };
  }

  /**
   * Get stability level descriptor
   */
  getStabilityLevel(score) {
    if (score >= 85) return 'EXCELLENT';
    if (score >= 70) return 'GOOD';
    if (score >= 50) return 'FAIR';
    if (score >= 30) return 'POOR';
    return 'CHAOTIC';
  }

  /**
   * Assess chaos/rampancy risk
   */
  assessChaosRisk(assets) {
    let chaosScore = 0;

    // Active CVE cascading
    const activeCVEs = assets.reduce((sum, a) => sum + (a.analysis?.cveActivated || 0), 0);
    if (activeCVEs > 3) chaosScore += 20;
    if (activeCVEs > 10) chaosScore += 30;

    // Dependency complexity
    const complexDeps = assets.reduce((sum, a) => {
      const deps = a.dependencies?.length || 0;
      if (deps > 5) return sum + 1;
      return sum;
    }, 0);
    if (complexDeps > 0) chaosScore += complexDeps * 10;

    // Version out-of-sync
    const outOfSync = assets.filter(a => {
      const current = this.parseVersion(a.version);
      const target = this.parseVersion(a.analysis?.targetVersion || a.version);
      return Math.abs(target.major - current.major) > 1;
    }).length;
    if (outOfSync > 0) chaosScore += outOfSync * 5;

    chaosScore = Math.min(100, chaosScore);

    return {
      riskScore: chaosScore,
      riskLevel: chaosScore > 70 ? 'CRITICAL' : chaosScore > 50 ? 'HIGH' : 'MODERATE',
      indicators: this.identifyRampancyIndicators(assets, chaosScore),
      mitigation: this.generateChaosmitigation(chaosScore)
    };
  }

  /**
   * Identify rampancy indicators
   */
  identifyRampancyIndicators(assets, chaosScore) {
    const indicators = [];

    if (chaosScore > 70) {
      indicators.push({
        indicator: 'CVE Cascade',
        severity: 'CRITICAL',
        description: 'Multiple active CVEs detected - system vulnerable to cascading failures'
      });

      indicators.push({
        indicator: 'Dependency Explosion',
        severity: 'HIGH',
        description: 'Complex dependency graph - changes propagate unpredictably'
      });
    }

    if (chaosScore > 50) {
      indicators.push({
        indicator: 'Version Misalignment',
        severity: 'MEDIUM',
        description: 'Software versions significantly out of sync - compatibility issues likely'
      });
    }

    return indicators;
  }

  /**
   * Generate chaos mitigation strategies
   */
  generateChaosmitigation(chaosScore) {
    const strategies = [];

    if (chaosScore > 80) {
      strategies.push({
        priority: 'CRITICAL',
        action: 'Emergency stabilization protocol',
        steps: [
          '1. Isolate affected systems',
          '2. Apply critical security patches immediately',
          '3. Establish monitoring dashboards',
          '4. Prepare rollback procedures'
        ]
      });
    }

    if (chaosScore > 60) {
      strategies.push({
        priority: 'HIGH',
        action: 'Accelerated upgrade plan',
        steps: [
          '1. Prioritize CVE remediation',
          '2. Stage upgrades in controlled environment',
          '3. Increase monitoring sensitivity',
          '4. Shorten release windows'
        ]
      });
    }

    if (chaosScore > 40) {
      strategies.push({
        priority: 'MEDIUM',
        action: 'Enhanced monitoring and dependencies',
        steps: [
          '1. Establish SLA for version drift',
          '2. Implement automated CVE alerting',
          '3. Schedule quarterly review cycles',
          '4. Document dependency graph'
        ]
      });
    }

    return strategies;
  }

  /**
   * Identify stability milestones
   */
  identifyStabilityMilestones(baseline, trajectory) {
    const milestones = [];

    if (trajectory.trend === 'DEGRADING' || trajectory.trend === 'RAPIDLY DEGRADING') {
      // Identify when system crosses stability thresholds
      const currentScore = baseline.score;
      const monthlyDegradation = trajectory.monthlyDegradationRate;

      // When does it cross "FAIR" (50)?
      if (currentScore > 50 && (currentScore - trajectory.endScore) > (currentScore - 50)) {
        const monthsToCross = (currentScore - 50) / monthlyDegradation;
        milestones.push({
          milestone: 'Crosses into FAIR zone',
          monthsAhead: Math.round(monthsToCross),
          action: 'Plan major upgrade campaign'
        });
      }

      // When does it cross "POOR" (30)?
      if (currentScore > 30 && (currentScore - trajectory.endScore) > (currentScore - 30)) {
        const monthsToCross = (currentScore - 30) / monthlyDegradation;
        milestones.push({
          milestone: 'Enters POOR zone',
          monthsAhead: Math.round(monthsToCross),
          action: 'Escalate to emergency protocols'
        });
      }
    }

    return milestones;
  }

  /**
   * Generate stability-based recommendations
   */
  generateStabilityRecommendations(currentScore, trend, chaosRisk) {
    const recommendations = [];

    if (currentScore < 50 || trend === 'RAPIDLY DEGRADING') {
      recommendations.push({
        priority: 'CRITICAL',
        title: 'Emergency Stabilization Required',
        action: 'Immediate action needed to prevent system failure'
      });
    }

    if (chaosRisk.riskLevel === 'CRITICAL') {
      recommendations.push({
        priority: 'CRITICAL',
        title: 'Chaos Detected - Implement Containment',
        action: 'Risk of cascade failure - activate monitoring and prepare rollbacks'
      });
    }

    if (trend === 'DEGRADING') {
      recommendations.push({
        priority: 'HIGH',
        title: 'Accelerate Upgrade Timeline',
        action: 'Begin major version upgrades to improve trajectory'
      });
    }

    return recommendations;
  }

  /**
   * Forecast portfolio stability
   */
  forecastPortfolioStability(systems) {
    console.log(`\n[StabilityModeler] Forecasting stability for ${systems.length} systems...`);

    const forecast = {
      timestamp: new Date(),
      systemCount: systems.length,

      byStabilityLevel: {
        'EXCELLENT': [],
        'GOOD': [],
        'FAIR': [],
        'POOR': [],
        'CHAOTIC': []
      },

      trends: {
        stable: 0,
        degrading: 0,
        rapidlyDegrading: 0
      },

      riskSummary: {
        criticalChaos: 0,
        highChaos: 0,
        moderateChaos: 0
      },

      recommendations: []
    };

    systems.forEach(system => {
      const prediction = this.predictSystemStability(system.name, system.assets);

      forecast.byStabilityLevel[prediction.current.stabilityLevel].push({
        system: system.name,
        score: prediction.current.stabilityScore,
        trend: prediction.forecast.trend
      });

      if (prediction.forecast.trend === 'STABLE') forecast.trends.stable++;
      else if (prediction.forecast.trend === 'DEGRADING') forecast.trends.degrading++;
      else forecast.trends.rapidlyDegrading++;

      if (prediction.chaosRisk.riskLevel === 'CRITICAL') forecast.riskSummary.criticalChaos++;
      else if (prediction.chaosRisk.riskLevel === 'HIGH') forecast.riskSummary.highChaos++;
      else forecast.riskSummary.moderateChaos++;
    });

    console.log(`[StabilityModeler] Forecast complete:`);
    console.log(`  Stable: ${forecast.trends.stable}, Degrading: ${forecast.trends.degrading}`);
    console.log(`  Critical Chaos: ${forecast.riskSummary.criticalChaos}`);

    return forecast;
  }
}

/**
 * Export
 */
module.exports = {
  SystemStabilityModeler
};
