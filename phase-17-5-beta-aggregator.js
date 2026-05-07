/**
 * Phase 17.5-Beta: Prediction Aggregator
 * 
 * Combines CVE emergence, friction predictions, and stability forecasts
 * into cohesive upgrade recommendations
 */

const { CVEEmergenceForecaster } = require('./phase-17-5-beta-cve-forecaster');
const { FrictionPredictionEngine } = require('./phase-17-5-beta-friction-predictor');
const { SystemStabilityModeler } = require('./phase-17-5-beta-stability-modeler');

/**
 * PredictionAggregator: Unified predictive framework
 */
class PredictionAggregator {
  constructor() {
    this.cveForecaster = new CVEEmergenceForecaster();
    this.frictionEngine = new FrictionPredictionEngine();
    this.stabilityModeler = new SystemStabilityModeler();

    this.aggregatedPredictions = new Map();
  }

  /**
   * Generate unified upgrade recommendation
   */
  generateUpgradeRecommendation(asset, systemContext = {}) {
    const key = `${asset.name}@${asset.version}`;

    // Get predictions from each engine
    const cvePrediction = this.cveForecaster.predictCVEEmergence(
      asset.name,
      asset.version,
      asset.category,
      asset.analysis?.daysUntilEOL || 365
    );

    const frictionPrediction = this.frictionEngine.predictUpgradeFriction(
      asset.name,
      asset.version,
      asset.analysis?.targetVersion || 'latest',
      asset.category,
      asset.dependents?.length || 0
    );

    // Aggregate into unified recommendation
    const recommendation = {
      software: asset.name,
      currentVersion: asset.version,
      targetVersion: frictionPrediction.targetVersion,

      predictions: {
        cve: cvePrediction,
        friction: frictionPrediction
      },

      // Unified urgency score (0-100)
      urgency: this.calculateUnifiedUrgency(cvePrediction, frictionPrediction),

      // Recommended timing
      recommendedTiming: this.recommendUpgradeTiming(cvePrediction, frictionPrediction),

      // Risk vs. Benefit analysis
      riskBenefit: this.analyzeRiskBenefit(cvePrediction, frictionPrediction),

      // When to upgrade in portfolio context
      portfolioPosition: this.calculatePortfolioPosition(asset, frictionPrediction),

      // Overall recommendation
      recommendation: this.synthesizeRecommendation(cvePrediction, frictionPrediction),

      // Confidence score (0-100, how confident in recommendation)
      confidence: this.calculateConfidence(cvePrediction, frictionPrediction)
    };

    this.aggregatedPredictions.set(key, recommendation);
    return recommendation;
  }

  /**
   * Calculate unified urgency (0-100)
   */
  calculateUnifiedUrgency(cvePrediction, frictionPrediction) {
    // CVE urgency: higher = more urgent (0-100)
    const cveUrgency = cvePrediction.forecast.urgency;

    // Friction urgency: higher friction = less urgent (inverted)
    const frictionUrgency = 100 - frictionPrediction.frictionScore;

    // Weight: CVE exposure is more important than friction
    const weightedUrgency = (cveUrgency * 0.65) + (frictionUrgency * 0.35);

    return Math.round(weightedUrgency);
  }

  /**
   * Recommend upgrade timing
   */
  recommendUpgradeTiming(cvePrediction, frictionPrediction) {
    const cveUrgency = cvePrediction.forecast.urgency;
    const frictionScore = frictionPrediction.frictionScore;

    let timing = {
      recommendation: 'STANDARD',
      daysToStart: 30,
      daysToComplete: 7,
      rationale: ''
    };

    // High CVE risk + Low friction = IMMEDIATE
    if (cveUrgency > 75 && frictionScore < 40) {
      timing = {
        recommendation: 'IMMEDIATE',
        daysToStart: 1,
        daysToComplete: 3,
        rationale: 'Critical CVE risk with low upgrade friction - execute immediately'
      };
    }

    // High CVE risk + High friction = URGENT BUT PLAN
    else if (cveUrgency > 75 && frictionScore > 60) {
      timing = {
        recommendation: 'URGENT PLANNING',
        daysToStart: 7,
        daysToComplete: 21,
        rationale: 'Critical CVE but complex upgrade - begin planning immediately'
      };
    }

    // Medium CVE risk + Low friction = NEAR TERM
    else if (cveUrgency > 50 && frictionScore < 40) {
      timing = {
        recommendation: 'NEAR TERM',
        daysToStart: 14,
        daysToComplete: 5,
        rationale: 'Moderate CVE risk with manageable upgrade - schedule within 2 weeks'
      };
    }

    // Medium CVE risk + Moderate friction = STANDARD
    else if (cveUrgency > 50 && frictionScore < 60) {
      timing = {
        recommendation: 'STANDARD',
        daysToStart: 30,
        daysToComplete: 7,
        rationale: 'Balanced risk/effort - schedule in normal release window'
      };
    }

    // Low CVE risk + High friction = DEFERRED
    else if (cveUrgency < 50 && frictionScore > 70) {
      timing = {
        recommendation: 'DEFERRED',
        daysToStart: 90,
        daysToComplete: 30,
        rationale: 'Low CVE risk but complex upgrade - defer to next major cycle'
      };
    }

    // Low CVE risk + Low friction = CONSIDER REMEDIATION
    else if (cveUrgency < 30 && frictionScore < 30) {
      timing = {
        recommendation: 'CONSIDER REMEDIATION',
        daysToStart: 180,
        daysToComplete: 0,
        rationale: 'Minimal risk/effort - consider locking and monitoring instead'
      };
    }

    return timing;
  }

  /**
   * Analyze risk vs. benefit of upgrade
   */
  analyzeRiskBenefit(cvePrediction, frictionPrediction) {
    // Risk of upgrade (friction-based)
    const upgradeRisk = {
      regressionProbability: frictionPrediction.riskFactors.regressionRisk,
      downtime: frictionPrediction.rollbackPlan.estimatedRollbackTime,
      complexity: frictionPrediction.frictionLevel,
      score: frictionPrediction.frictionScore
    };

    // Benefit of upgrade (CVE reduction)
    const upgradeBenefit = {
      cveReduction: cvePrediction.exploitationRisk.probabilityOfActivation * 100,
      emergenceDelayed: cvePrediction.nextCVEExpected.daysUntilDiscovery,
      riskEliminated: cvePrediction.forecast.urgency,
      score: 100 - cvePrediction.forecast.urgency
    };

    // Calculate benefit/risk ratio
    const benefitToRiskRatio = upgradeBenefit.score / (upgradeRisk.score + 1); // +1 to avoid division by zero

    return {
      upgradeRisk,
      upgradeBenefit,
      benefitToRiskRatio: Math.round(benefitToRiskRatio * 100) / 100,
      verdict: this.getBenefitVerdict(benefitToRiskRatio, cvePrediction, frictionPrediction)
    };
  }

  /**
   * Get benefit/risk verdict
   */
  getBenefitVerdict(ratio, cvePrediction, frictionPrediction) {
    if (ratio > 2) {
      return 'HIGHLY BENEFICIAL - Upgrade significantly reduces risk with manageable effort';
    } else if (ratio > 1) {
      return 'BENEFICIAL - Benefits outweigh upgrade complexity';
    } else if (ratio > 0.5) {
      return 'MARGINAL - Benefits roughly equal effort';
    } else if (cvePrediction.forecast.urgency > 75) {
      return 'NECESSARY DESPITE FRICTION - Critical CVE risk justifies complex upgrade';
    } else {
      return 'QUESTIONABLE - Consider remediation/locking instead of upgrade';
    }
  }

  /**
   * Calculate portfolio position
   */
  calculatePortfolioPosition(asset, frictionPrediction) {
    return {
      priority: this.calculatePriority(asset, frictionPrediction),
      sequencing: this.recommendSequencing(asset, frictionPrediction),
      batching: this.recommendBatching(asset, frictionPrediction)
    };
  }

  /**
   * Calculate priority (1-10, with 10 = highest)
   */
  calculatePriority(asset, frictionPrediction) {
    let priority = 5; // Start at middle

    // Criticality adjustment
    if (asset.criticality === 'critical') priority += 3;
    else if (asset.criticality === 'high') priority += 1;

    // Friction adjustment (inverse)
    if (frictionPrediction.frictionScore < 30) priority += 1;
    if (frictionPrediction.frictionScore > 70) priority -= 1;

    return Math.max(1, Math.min(10, priority));
  }

  /**
   * Recommend sequencing
   */
  recommendSequencing(asset, frictionPrediction) {
    if (asset.dependencies && asset.dependencies.length > 0) {
      return {
        recommendation: 'AFTER DEPENDENCIES',
        rationale: `This software depends on ${asset.dependencies.length} other items - upgrade those first`
      };
    } else if (asset.dependents && asset.dependents.length > 3) {
      return {
        recommendation: 'BEFORE DEPENDENTS',
        rationale: `${asset.dependents.length} items depend on this - upgrade early to unblock others`
      };
    } else {
      return {
        recommendation: 'FLEXIBLE',
        rationale: 'No critical dependencies - can upgrade independently'
      };
    }
  }

  /**
   * Recommend batching
   */
  recommendBatching(asset, frictionPrediction) {
    if (frictionPrediction.frictionScore > 70) {
      return {
        recommendation: 'STANDALONE',
        rationale: 'High friction upgrade - requires dedicated window'
      };
    } else if (frictionPrediction.frictionScore < 20) {
      return {
        recommendation: 'BATCH WITH OTHERS',
        rationale: 'Low friction - can combine with other routine upgrades'
      };
    } else {
      return {
        recommendation: 'SMALL BATCH',
        rationale: 'Moderate friction - group with 1-2 similar upgrades'
      };
    }
  }

  /**
   * Synthesize unified recommendation
   */
  synthesizeRecommendation(cvePrediction, frictionPrediction) {
    const cveUrgency = cvePrediction.forecast.urgency;
    const frictionScore = frictionPrediction.frictionScore;

    // Decision tree
    if (cveUrgency > 80 && frictionScore < 50) {
      return {
        decision: 'UPGRADE_IMMEDIATELY',
        confidence: 'HIGH',
        rationale: 'Critical CVE vulnerability with manageable upgrade effort'
      };
    } else if (cveUrgency > 75 && frictionScore < 70) {
      return {
        decision: 'UPGRADE_URGENT',
        confidence: 'HIGH',
        rationale: 'High CVE risk - prioritize despite moderate friction'
      };
    } else if (cveUrgency > 60 && frictionScore < 40) {
      return {
        decision: 'UPGRADE_PLANNED',
        confidence: 'HIGH',
        rationale: 'Moderate CVE risk with low friction - schedule in 2-4 weeks'
      };
    } else if (cveUrgency > 50 && frictionScore < 60) {
      return {
        decision: 'UPGRADE_STANDARD',
        confidence: 'MEDIUM',
        rationale: 'Balanced decision - include in regular maintenance cycle'
      };
    } else if (cveUrgency < 40 && frictionScore > 70) {
      return {
        decision: 'REMEDIATE_LOCK_MONITOR',
        confidence: 'HIGH',
        rationale: 'Low CVE risk but high upgrade friction - lock and monitor instead'
      };
    } else if (cveUrgency < 30 && frictionScore < 30) {
      return {
        decision: 'REMEDIATE_PREFER',
        confidence: 'HIGH',
        rationale: 'Minimal risk and effort - locking provides better stability'
      };
    } else if (frictionScore > 80) {
      return {
        decision: 'CONSULT_TECHNICAL_TEAM',
        confidence: 'MEDIUM',
        rationale: 'Upgrade complexity is extreme - requires specialized analysis'
      };
    } else {
      return {
        decision: 'UPGRADE_EVALUATE',
        confidence: 'MEDIUM',
        rationale: 'Mixed signals - requires context-specific evaluation'
      };
    }
  }

  /**
   * Calculate confidence (0-100)
   */
  calculateConfidence(cvePrediction, frictionPrediction) {
    // Start at 75% confidence
    let confidence = 75;

    // Increase if both predictors align
    const cveUrgency = cvePrediction.forecast.urgency;
    const frictionScore = frictionPrediction.frictionScore;

    // Both say upgrade (high CVE + low friction)
    if (cveUrgency > 65 && frictionScore < 45) {
      confidence += 15; // Strong upgrade signal
    }

    // Both say hold (low CVE + high friction)
    if (cveUrgency < 35 && frictionScore > 65) {
      confidence += 15; // Strong hold signal
    }

    // Conflicting signals reduce confidence
    if ((cveUrgency > 65 && frictionScore > 65) || (cveUrgency < 35 && frictionScore < 45)) {
      confidence -= 10;
    }

    return Math.max(0, Math.min(100, confidence));
  }

  /**
   * Aggregate recommendations for entire portfolio
   */
  aggregatePortfolioRecommendations(assets) {
    console.log(`\n[PredictionAggregator] Generating unified recommendations for ${assets.length} assets...`);

    const aggregated = {
      timestamp: new Date(),
      assetCount: assets.length,

      decisionBreakdown: {
        'UPGRADE_IMMEDIATELY': [],
        'UPGRADE_URGENT': [],
        'UPGRADE_PLANNED': [],
        'UPGRADE_STANDARD': [],
        'REMEDIATE_LOCK_MONITOR': [],
        'REMEDIATE_PREFER': [],
        'CONSULT_TECHNICAL_TEAM': [],
        'UPGRADE_EVALUATE': []
      },

      statistics: {
        avgUrgency: 0,
        avgFriction: 0,
        avgConfidence: 0,
        highConfidenceCount: 0
      },

      timeline: this.generateConsolidatedTimeline(assets),

      executiveSummary: {}
    };

    let totalUrgency = 0, totalFriction = 0, totalConfidence = 0;

    assets.forEach(asset => {
      const recommendation = this.generateUpgradeRecommendation(asset);
      const decision = recommendation.recommendation.decision;

      aggregated.decisionBreakdown[decision].push({
        software: asset.name,
        version: asset.version,
        decision,
        confidence: recommendation.confidence
      });

      totalUrgency += recommendation.urgency;
      totalFriction += recommendation.predictions.friction.frictionScore;
      totalConfidence += recommendation.confidence;

      if (recommendation.confidence > 80) aggregated.statistics.highConfidenceCount++;
    });

    aggregated.statistics.avgUrgency = Math.round(totalUrgency / assets.length);
    aggregated.statistics.avgFriction = Math.round(totalFriction / assets.length);
    aggregated.statistics.avgConfidence = Math.round(totalConfidence / assets.length);

    // Executive summary
    const immediateCount = aggregated.decisionBreakdown['UPGRADE_IMMEDIATELY'].length;
    const urgentCount = aggregated.decisionBreakdown['UPGRADE_URGENT'].length;
    const remediateCount =
      aggregated.decisionBreakdown['REMEDIATE_LOCK_MONITOR'].length +
      aggregated.decisionBreakdown['REMEDIATE_PREFER'].length;

    aggregated.executiveSummary = {
      totalAssets: assets.length,
      immediateAction: immediateCount,
      urgentPlanning: urgentCount,
      canRemediate: remediateCount,
      requiresReview: aggregated.decisionBreakdown['CONSULT_TECHNICAL_TEAM'].length,
      highConfidenceRecommendations: aggregated.statistics.highConfidenceCount,
      overallTrend: this.getPortfolioTrend(aggregated.statistics)
    };

    console.log(`[PredictionAggregator] Recommendations complete:`);
    console.log(`  Immediate: ${immediateCount}`);
    console.log(`  Urgent: ${urgentCount}`);
    console.log(`  Can Remediate: ${remediateCount}`);

    return aggregated;
  }

  /**
   * Generate consolidated timeline
   */
  generateConsolidatedTimeline(assets) {
    const timeline = {
      immediate: [],
      week1to2: [],
      week2to4: [],
      month2to3: [],
      deferred: []
    };

    assets.forEach(asset => {
      const recommendation = this.generateUpgradeRecommendation(asset);
      const timing = recommendation.recommendedTiming;

      if (timing.daysToStart <= 1) {
        timeline.immediate.push(asset.name);
      } else if (timing.daysToStart <= 14) {
        timeline.week1to2.push(asset.name);
      } else if (timing.daysToStart <= 28) {
        timeline.week2to4.push(asset.name);
      } else if (timing.daysToStart <= 90) {
        timeline.month2to3.push(asset.name);
      } else {
        timeline.deferred.push(asset.name);
      }
    });

    return timeline;
  }

  /**
   * Get portfolio trend
   */
  getPortfolioTrend(statistics) {
    if (statistics.avgUrgency > 70) {
      return 'CRITICAL - Urgent action needed across portfolio';
    } else if (statistics.avgUrgency > 55) {
      return 'HIGH - Significant vulnerabilities in multiple systems';
    } else if (statistics.avgFriction > 60) {
      return 'COMPLEX - Portfolio facing significant upgrade challenges';
    } else {
      return 'BALANCED - Mixed portfolio with varied upgrade needs';
    }
  }
}

/**
 * Export
 */
module.exports = {
  PredictionAggregator
};
