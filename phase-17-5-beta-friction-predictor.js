/**
 * Phase 17.5-Beta: Friction Prediction Engine
 * 
 * Forecasts upgrade complexity based on historical patterns,
 * version deltas, and dependency changes
 */

/**
 * FrictionPredictionEngine: Predict upgrade complexity
 */
class FrictionPredictionEngine {
  constructor() {
    // Historical friction patterns
    this.frictionPatterns = this.initializeFrictionPatterns();

    // Version delta complexity rules
    this.versionDeltaRules = this.initializeVersionDeltaRules();

    // Dependency complexity factors
    this.dependencyFactors = this.initializeDependencyFactors();

    this.predictions = new Map();
  }

  /**
   * Initialize friction patterns by software type
   */
  initializeFrictionPatterns() {
    return {
      'runtime': {
        baseComplexity: 25,
        // Major version changes: significant breaking changes
        majorVersionFactor: 12,
        minorVersionFactor: 4,
        patchVersionFactor: 1,
        // Patterns from upgrade history
        testingRequired: 0.8,
        regressionRisk: 0.35,
        rollbackComplexity: 'medium'
      },

      'framework': {
        baseComplexity: 35,
        majorVersionFactor: 15,
        minorVersionFactor: 6,
        patchVersionFactor: 1,
        testingRequired: 0.9,
        regressionRisk: 0.45,
        rollbackComplexity: 'medium'
      },

      'library': {
        baseComplexity: 15,
        majorVersionFactor: 8,
        minorVersionFactor: 3,
        patchVersionFactor: 0.5,
        testingRequired: 0.6,
        regressionRisk: 0.25,
        rollbackComplexity: 'low'
      },

      'database': {
        baseComplexity: 45,
        majorVersionFactor: 18,
        minorVersionFactor: 8,
        patchVersionFactor: 2,
        testingRequired: 1.0,
        regressionRisk: 0.65,
        rollbackComplexity: 'high'
      },

      'tool': {
        baseComplexity: 20,
        majorVersionFactor: 10,
        minorVersionFactor: 4,
        patchVersionFactor: 1,
        testingRequired: 0.7,
        regressionRisk: 0.30,
        rollbackComplexity: 'low'
      }
    };
  }

  /**
   * Initialize version delta rules
   */
  initializeVersionDeltaRules() {
    return {
      majorMajor: { label: '2.x to 4.x', complexity: 50, reasoning: 'Multiple major versions apart' },
      majorMinor: { label: '2.x to 2.10.x', complexity: 8, reasoning: 'Multiple minor versions' },
      majorPatch: { label: '2.x to 2.5.7', complexity: 15, reasoning: 'Jump within major' },
      singleMajor: { label: '2.x to 3.x', complexity: 25, reasoning: 'Single major version upgrade' },
      singleMinor: { label: '2.5 to 2.6', complexity: 5, reasoning: 'Single minor version upgrade' },
      singlePatch: { label: '2.5.1 to 2.5.2', complexity: 1, reasoning: 'Patch version upgrade' }
    };
  }

  /**
   * Initialize dependency complexity factors
   */
  initializeDependencyFactors() {
    return {
      // Dependencies that depend on this software
      dependentCount: {
        0: 1.0,      // No dependents: 1x multiplier
        1: 1.2,      // 1 dependent: 1.2x
        3: 1.5,      // 3 dependents: 1.5x
        10: 2.0,     // 10+ dependents: 2.0x (many components depend on this)
      },

      // Breaking changes likelihood
      breakingChangeRisk: {
        patch: 0.05,
        minor: 0.15,
        major: 0.65,
        majorMajor: 0.95
      },

      // Team experience factor
      experienceFactor: {
        experienced: 0.7,   // Experienced team: -30% friction
        moderate: 1.0,      // Average team: baseline
        novice: 1.5         // New team: +50% friction
      }
    };
  }

  /**
   * Predict upgrade friction (0-100 score)
   */
  predictUpgradeFriction(
    softwareName,
    currentVersion,
    targetVersion,
    category,
    dependentCount = 1,
    teamExperience = 'moderate'
  ) {
    const key = `${softwareName}:${currentVersion}->${targetVersion}`;

    if (this.predictions.has(key)) {
      return this.predictions.get(key);
    }

    const pattern = this.frictionPatterns[category] || this.frictionPatterns['library'];
    const versionDelta = this.parseVersionDelta(currentVersion, targetVersion);
    const versionComplexity = this.getVersionDeltaComplexity(versionDelta);

    // Base friction
    let friction = pattern.baseComplexity;

    // Add version delta complexity
    friction += versionComplexity.complexity;

    // Dependency multiplier
    const depMultiplier = this.getDependencyMultiplier(dependentCount);
    friction *= depMultiplier;

    // Team experience adjustment
    const expFactor = this.dependencyFactors.experienceFactor[teamExperience] || 1.0;
    friction *= expFactor;

    // Breaking change risk
    const breakingRisk = this.dependencyFactors.breakingChangeRisk[versionDelta.changeType] || 0.3;
    friction += breakingRisk * 20; // Up to 20 additional points

    // Cap at 100
    friction = Math.min(100, friction);

    const prediction = {
      software: softwareName,
      currentVersion,
      targetVersion,
      category,

      frictionScore: Math.round(friction),
      frictionLevel: this.getFrictionLevel(friction),

      components: {
        baseComplexity: pattern.baseComplexity,
        versionDeltaComplexity: versionComplexity.complexity,
        dependencyFactor: depMultiplier,
        teamExperienceFactor: expFactor,
        breakingChangeRisk: breakingRisk
      },

      versionDelta: versionDelta,
      versionAnalysis: versionComplexity.reasoning,

      riskFactors: {
        testingRequired: pattern.testingRequired,
        regressionRisk: pattern.regressionRisk,
        breakingChangeLikelihood: breakingRisk,
        dependents: dependentCount,
        dependencyImpact: this.calculateDependencyImpact(dependentCount)
      },

      estimatedEffort: {
        developmentHours: this.estimateDevelopmentHours(friction, category),
        testingHours: this.estimateTestingHours(friction, pattern.testingRequired),
        deploymentHours: this.estimateDeploymentHours(friction, category),
        totalHours: 0 // Will calculate below
      },

      recommendations: this.generateFrictionRecommendations(friction, versionDelta, dependentCount),

      rollbackPlan: {
        complexity: pattern.rollbackComplexity,
        estimatedRollbackTime: this.estimateRollbackTime(pattern.rollbackComplexity),
        riskOfRollbackFailure: this.calculateRollbackFailureRisk(pattern.rollbackComplexity)
      }
    };

    // Calculate total hours
    prediction.estimatedEffort.totalHours =
      prediction.estimatedEffort.developmentHours +
      prediction.estimatedEffort.testingHours +
      prediction.estimatedEffort.deploymentHours;

    this.predictions.set(key, prediction);
    return prediction;
  }

  /**
   * Parse version delta
   */
  parseVersionDelta(currentVersion, targetVersion) {
    const current = this.parseVersion(currentVersion);
    const target = this.parseVersion(targetVersion);

    const majorDiff = target.major - current.major;
    const minorDiff = target.minor - current.minor;
    const patchDiff = target.patch - current.patch;

    let changeType = 'singlePatch';
    if (majorDiff > 1) changeType = 'majorMajor';
    else if (majorDiff === 1) changeType = 'singleMajor';
    else if (minorDiff > 0) changeType = 'majorMinor';
    else if (patchDiff > 0) changeType = 'singlePatch';

    return {
      current: `${current.major}.${current.minor}.${current.patch}`,
      target: `${target.major}.${target.minor}.${target.patch}`,
      majorDiff,
      minorDiff,
      patchDiff,
      changeType,
      span: `${current.major}.x to ${target.major}.x`
    };
  }

  /**
   * Parse semantic version
   */
  parseVersion(versionStr) {
    const parts = versionStr.split('.');
    return {
      major: parseInt(parts[0]) || 0,
      minor: parseInt(parts[1]) || 0,
      patch: parseInt(parts[2]) || 0
    };
  }

  /**
   * Get version delta complexity
   */
  getVersionDeltaComplexity(versionDelta) {
    const { majorDiff, minorDiff, patchDiff, changeType } = versionDelta;

    let complexity = 0;
    let reasoning = '';

    if (majorDiff > 1) {
      complexity = 50 + (majorDiff - 2) * 15;
      reasoning = `Skipping ${majorDiff} major versions - likely significant API changes`;
    } else if (majorDiff === 1) {
      complexity = 25;
      reasoning = 'Single major version jump - breaking changes expected';
    } else if (minorDiff > 0) {
      complexity = 8 + (minorDiff - 1) * 3;
      reasoning = `${minorDiff} minor versions ahead - new features with some compatibility`;
    } else if (patchDiff > 0) {
      complexity = 1;
      reasoning = 'Patch version - bug fixes, minimal compatibility risk';
    }

    return { complexity, reasoning };
  }

  /**
   * Get friction level descriptor
   */
  getFrictionLevel(score) {
    if (score >= 80) return 'VERY HIGH';
    if (score >= 60) return 'HIGH';
    if (score >= 40) return 'MODERATE';
    if (score >= 20) return 'LOW';
    return 'MINIMAL';
  }

  /**
   * Get dependency multiplier
   */
  getDependencyMultiplier(dependentCount) {
    if (dependentCount <= 0) return 1.0;
    if (dependentCount === 1) return 1.2;
    if (dependentCount <= 3) return 1.5;
    if (dependentCount <= 10) return 2.0;
    return 2.5; // 10+ dependents
  }

  /**
   * Calculate dependency impact
   */
  calculateDependencyImpact(dependentCount) {
    if (dependentCount === 0) return 'none';
    if (dependentCount === 1) return 'low';
    if (dependentCount <= 3) return 'medium';
    if (dependentCount <= 10) return 'high';
    return 'critical';
  }

  /**
   * Estimate development hours
   */
  estimateDevelopmentHours(friction, category) {
    const baseHours = {
      'runtime': 8,
      'framework': 12,
      'library': 4,
      'database': 20,
      'tool': 6
    };

    const base = baseHours[category] || 6;
    return Math.round((base * friction / 50) * 10) / 10; // 2x hours if friction = 100
  }

  /**
   * Estimate testing hours
   */
  estimateTestingHours(friction, testingFactor) {
    const baseHours = friction * 0.5; // 0.5 hours per friction point
    return Math.round((baseHours * testingFactor) * 10) / 10;
  }

  /**
   * Estimate deployment hours
   */
  estimateDeploymentHours(friction, category) {
    const baseHours = {
      'runtime': 2,
      'framework': 3,
      'library': 1,
      'database': 5,
      'tool': 1.5
    };

    const base = baseHours[category] || 1.5;
    return Math.round((base * friction / 50) * 10) / 10;
  }

  /**
   * Estimate rollback time
   */
  estimateRollbackTime(complexity) {
    const times = {
      'low': '30 minutes',
      'medium': '2 hours',
      'high': '4+ hours'
    };
    return times[complexity] || '2 hours';
  }

  /**
   * Calculate rollback failure risk
   */
  calculateRollbackFailureRisk(complexity) {
    const risks = {
      'low': 0.05,
      'medium': 0.15,
      'high': 0.35
    };
    return (risks[complexity] || 0.15) * 100; // As percentage
  }

  /**
   * Generate friction-based recommendations
   */
  generateFrictionRecommendations(friction, versionDelta, dependentCount) {
    const recommendations = [];

    // High friction
    if (friction > 70) {
      recommendations.push({
        priority: 'HIGH',
        action: 'Consider phased deployment strategy',
        reasoning: 'Upgrade complexity is high - test thoroughly before full rollout'
      });
    }

    // Breaking changes
    if (versionDelta.majorDiff > 0) {
      recommendations.push({
        priority: 'HIGH',
        action: 'Comprehensive API compatibility review required',
        reasoning: 'Major version change - breaking changes very likely'
      });
    }

    // Many dependents
    if (dependentCount > 5) {
      recommendations.push({
        priority: 'CRITICAL',
        action: 'Coordinate with all dependent teams',
        reasoning: `${dependentCount} components depend on this - synchronize upgrade timing`
      });
    }

    // Moderate friction
    if (friction > 40 && friction <= 70) {
      recommendations.push({
        priority: 'MEDIUM',
        action: 'Plan dedicated testing window',
        reasoning: 'Upgrade requires significant testing - allocate 2+ weeks'
      });
    }

    return recommendations;
  }

  /**
   * Predict friction distribution across portfolio
   */
  predictPortfolioFriction(assets) {
    console.log(`\n[FrictionEngine] Predicting friction for ${assets.length} upgrades...`);

    const distribution = {
      byFrictionLevel: {
        'MINIMAL': [],
        'LOW': [],
        'MODERATE': [],
        'HIGH': [],
        'VERY HIGH': []
      },

      statistics: {
        totalAssets: assets.length,
        averageFriction: 0,
        medianFriction: 0,
        maxFriction: 0,
        minFriction: 100
      },

      criticalUpgrades: [],
      recommendations: []
    };

    const frictions = [];

    assets.forEach(asset => {
      const prediction = this.predictUpgradeFriction(
        asset.name,
        asset.version,
        asset.analysis?.targetVersion || 'latest',
        asset.category,
        asset.dependents?.length || 0,
        'moderate'
      );

      frictions.push(prediction.frictionScore);
      distribution.byFrictionLevel[prediction.frictionLevel].push({
        software: asset.name,
        friction: prediction.frictionScore,
        version: `${asset.version} → ${asset.analysis?.targetVersion}`
      });

      // Track critical
      if (prediction.frictionScore > 70) {
        distribution.criticalUpgrades.push({
          software: asset.name,
          friction: prediction.frictionScore,
          recommendation: 'Requires extended planning and testing'
        });
      }
    });

    // Calculate statistics
    frictions.sort((a, b) => a - b);
    distribution.statistics.averageFriction = Math.round(
      frictions.reduce((a, b) => a + b, 0) / frictions.length
    );
    distribution.statistics.medianFriction = frictions[Math.floor(frictions.length / 2)];
    distribution.statistics.maxFriction = frictions[frictions.length - 1];
    distribution.statistics.minFriction = frictions[0];

    console.log(`[FrictionEngine] Friction analysis complete:`);
    console.log(`  Average: ${distribution.statistics.averageFriction}/100`);
    console.log(`  Range: ${distribution.statistics.minFriction}-${distribution.statistics.maxFriction}`);
    console.log(`  High Friction: ${distribution.byFrictionLevel['HIGH'].length + distribution.byFrictionLevel['VERY HIGH'].length}`);

    return distribution;
  }
}

/**
 * Export
 */
module.exports = {
  FrictionPredictionEngine
};
