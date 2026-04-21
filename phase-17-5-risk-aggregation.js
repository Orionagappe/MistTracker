/**
 * Phase 17.5-Alpha: Enterprise Risk Aggregation Engine
 * 
 * Calculates enterprise-wide risk scores by aggregating
 * individual asset risks across systems and criticalities
 */

/**
 * RiskAggregationEngine: Calculate enterprise risk profile
 */
class RiskAggregationEngine {
  constructor(orchestrator) {
    this.orchestrator = orchestrator;
    this.riskCache = new Map();
    this.lastCalculation = null;
  }

  /**
   * Calculate individual asset risk score (0-100)
   */
  calculateAssetRisk(asset) {
    const analysis = asset.analysis;
    if (!analysis) return 0;

    let riskScore = 0;

    // Factor 1: Vulnerability Exposure (0-40 points)
    const cveActivated = analysis.cveActivated || 0;
    const cveTotal = analysis.cveCount || 0;
    const activationRatio = cveTotal > 0 ? cveActivated / cveTotal : 0;

    riskScore += Math.min(40, cveActivated * 10 + activationRatio * 5);

    // Factor 2: EOL Status (0-35 points)
    const daysUntilEOL = analysis.daysUntilEOL || 365 * 3;

    if (daysUntilEOL < 0) {
      riskScore += 35; // Past EOL
    } else if (daysUntilEOL < 30) {
      riskScore += 30; // Critical window
    } else if (daysUntilEOL < 90) {
      riskScore += 20;
    } else if (daysUntilEOL < 180) {
      riskScore += 10;
    } else if (daysUntilEOL < 365) {
      riskScore += 5;
    }

    // Factor 3: System Impact (0-15 points)
    const systemCount = asset.systems?.length || 0;
    riskScore += Math.min(15, systemCount * 2);

    // Factor 4: Stability Concerns (0-10 points)
    const stability = analysis.stability || 80;
    if (stability < 50) riskScore += 10; // Chaotic/rampant
    else if (stability < 70) riskScore += 5;

    return Math.min(100, riskScore);
  }

  /**
   * Calculate risk by criticality level
   */
  calculateCriticalityRisk() {
    const risks = {
      critical: [],
      high: [],
      medium: [],
      low: []
    };

    this.orchestrator.assets.forEach(asset => {
      const risk = this.calculateAssetRisk(asset);
      risks[asset.criticality || 'medium'].push({
        asset: asset.name,
        risk,
        version: asset.version,
        cveActivated: asset.analysis?.cveActivated || 0,
        systems: asset.systems?.length || 0
      });
    });

    // Sort by risk descending
    Object.keys(risks).forEach(level => {
      risks[level].sort((a, b) => b.risk - a.risk);
    });

    return risks;
  }

  /**
   * Calculate risk by system
   */
  calculateSystemRisk() {
    const systemRisks = new Map();

    this.orchestrator.assets.forEach(asset => {
      const assetRisk = this.calculateAssetRisk(asset);

      asset.systems?.forEach(system => {
        if (!systemRisks.has(system)) {
          systemRisks.set(system, {
            system,
            assets: [],
            totalRisk: 0,
            avgRisk: 0,
            maxRisk: 0
          });
        }

        const systemEntry = systemRisks.get(system);
        systemEntry.assets.push({
          name: asset.name,
          risk: assetRisk,
          criticality: asset.criticality
        });
        systemEntry.totalRisk += assetRisk;
        systemEntry.maxRisk = Math.max(systemEntry.maxRisk, assetRisk);
      });
    });

    // Calculate averages
    systemRisks.forEach(systemEntry => {
      systemEntry.avgRisk = systemEntry.totalRisk / systemEntry.assets.length;
      systemEntry.riskLevel = this.getRiskLevel(systemEntry.avgRisk);
      systemEntry.assets.sort((a, b) => b.risk - a.risk);
    });

    return new Map([...systemRisks.entries()].sort((a, b) => b[1].avgRisk - a[1].avgRisk));
  }

  /**
   * Calculate risk by category (runtime, database, framework, etc.)
   */
  calculateCategoryRisk() {
    const categoryRisks = new Map();

    this.orchestrator.assets.forEach(asset => {
      const assetRisk = this.calculateAssetRisk(asset);
      const category = asset.category || 'unknown';

      if (!categoryRisks.has(category)) {
        categoryRisks.set(category, {
          category,
          assets: [],
          totalRisk: 0,
          avgRisk: 0,
          maxRisk: 0
        });
      }

      const catEntry = categoryRisks.get(category);
      catEntry.assets.push({
        name: asset.name,
        risk: assetRisk,
        version: asset.version
      });
      catEntry.totalRisk += assetRisk;
      catEntry.maxRisk = Math.max(catEntry.maxRisk, assetRisk);
    });

    // Calculate averages
    categoryRisks.forEach(catEntry => {
      catEntry.avgRisk = catEntry.totalRisk / catEntry.assets.length;
      catEntry.riskLevel = this.getRiskLevel(catEntry.avgRisk);
    });

    return new Map([...categoryRisks.entries()].sort((a, b) => b[1].avgRisk - a[1].avgRisk));
  }

  /**
   * Calculate decision-based risk (upgrade vs remediate)
   */
  calculateDecisionRisk() {
    const decisionRisks = {
      upgrade: {
        count: 0,
        totalRisk: 0,
        avgRisk: 0,
        riskLevel: 'LOW',
        assets: []
      },
      remediate: {
        count: 0,
        totalRisk: 0,
        avgRisk: 0,
        riskLevel: 'MEDIUM',
        assets: []
      },
      watch: {
        count: 0,
        totalRisk: 0,
        avgRisk: 0,
        riskLevel: 'LOW',
        assets: []
      }
    };

    this.orchestrator.assets.forEach(asset => {
      const decision = this.orchestrator.decisions.get(asset.id) || 'watch';
      const risk = this.calculateAssetRisk(asset);

      decisionRisks[decision].count++;
      decisionRisks[decision].totalRisk += risk;
      decisionRisks[decision].assets.push({
        name: asset.name,
        risk,
        criticality: asset.criticality
      });
    });

    Object.keys(decisionRisks).forEach(decision => {
      const entry = decisionRisks[decision];
      if (entry.count > 0) {
        entry.avgRisk = entry.totalRisk / entry.count;
        entry.riskLevel = this.getRiskLevel(entry.avgRisk);
      }
      entry.assets.sort((a, b) => b.risk - a.risk);
    });

    return decisionRisks;
  }

  /**
   * Get risk level (string) from score (0-100)
   */
  getRiskLevel(score) {
    if (score >= 80) return 'CRITICAL';
    if (score >= 60) return 'HIGH';
    if (score >= 40) return 'MEDIUM';
    if (score >= 20) return 'LOW';
    return 'VERY LOW';
  }

  /**
   * Get risk color for visualization
   */
  getRiskColor(score) {
    if (score >= 80) return '#CC0000'; // Red
    if (score >= 60) return '#FF6600'; // Orange
    if (score >= 40) return '#FFCC00'; // Yellow
    if (score >= 20) return '#99CC00'; // Light Green
    return '#00CC00'; // Green
  }

  /**
   * Calculate enterprise-wide risk score (aggregate)
   */
  calculateEnterpriseRisk() {
    const allRisks = [];

    this.orchestrator.assets.forEach(asset => {
      const risk = this.calculateAssetRisk(asset);
      const weight = this.calculateRiskWeight(asset);
      allRisks.push({
        asset: asset.name,
        baseRisk: risk,
        weight,
        weightedRisk: risk * weight
      });
    });

    const totalWeightedRisk = allRisks.reduce((sum, r) => sum + r.weightedRisk, 0);
    const totalWeight = allRisks.reduce((sum, r) => sum + r.weight, 0);

    const enterpriseRisk = totalWeight > 0 ? totalWeightedRisk / totalWeight : 0;

    return {
      score: Math.round(enterpriseRisk),
      level: this.getRiskLevel(enterpriseRisk),
      color: this.getRiskColor(enterpriseRisk),
      trend: this.calculateRiskTrend(),
      topRisks: allRisks.sort((a, b) => b.weightedRisk - a.weightedRisk).slice(0, 10)
    };
  }

  /**
   * Calculate risk weight for an asset
   */
  calculateRiskWeight(asset) {
    let weight = 1;

    // Criticality multiplier
    if (asset.criticality === 'critical') weight *= 4;
    else if (asset.criticality === 'high') weight *= 2;

    // System count multiplier
    weight *= (1 + (asset.systems?.length || 0) * 0.1);

    return weight;
  }

  /**
   * Calculate risk trend (is it improving or worsening?)
   */
  calculateRiskTrend() {
    // Simplified: check if we have more upgrades than remediations
    const upgradeCount = Array.from(this.orchestrator.decisions.values())
      .filter(d => d === 'upgrade').length;
    const remediateCount = Array.from(this.orchestrator.decisions.values())
      .filter(d => d === 'remediate').length;

    if (upgradeCount > remediateCount * 2) {
      return { direction: 'IMPROVING', reason: 'Most assets being upgraded to latest versions' };
    } else if (remediateCount > upgradeCount * 2) {
      return { direction: 'STABLE', reason: 'Choosing stability over aggressive upgrades' };
    } else {
      return { direction: 'MIXED', reason: 'Balanced upgrade and remediation strategy' };
    }
  }

  /**
   * Identify high-risk hotspots
   */
  identifyHotspots() {
    const hotspots = {
      criticalCVEs: [],
      pastEOL: [],
      highFriction: [],
      systemClusters: []
    };

    this.orchestrator.assets.forEach(asset => {
      if (!asset.analysis) return;

      // Hotspot 1: Critical CVEs (activated)
      if ((asset.analysis.cveActivated || 0) >= 3) {
        hotspots.criticalCVEs.push({
          asset: asset.name,
          cveActivated: asset.analysis.cveActivated,
          criticality: asset.criticality,
          systems: asset.systems
        });
      }

      // Hotspot 2: Past EOL
      if ((asset.analysis.daysUntilEOL || 0) < 0) {
        hotspots.pastEOL.push({
          asset: asset.name,
          version: asset.version,
          daysPastEOL: Math.abs(asset.analysis.daysUntilEOL),
          systems: asset.systems
        });
      }

      // Hotspot 3: High friction + high risk
      if ((asset.analysis.friction || 0) > 70 && this.calculateAssetRisk(asset) > 60) {
        hotspots.highFriction.push({
          asset: asset.name,
          friction: asset.analysis.friction,
          risk: this.calculateAssetRisk(asset),
          systems: asset.systems
        });
      }
    });

    // Hotspot 4: System clusters (multiple critical assets in one system)
    const systemCriticalCounts = new Map();
    this.orchestrator.assets.forEach(asset => {
      if (this.calculateAssetRisk(asset) > 60 && asset.criticality === 'critical') {
        asset.systems?.forEach(sys => {
          systemCriticalCounts.set(sys, (systemCriticalCounts.get(sys) || 0) + 1);
        });
      }
    });

    Array.from(systemCriticalCounts.entries())
      .filter(([_, count]) => count >= 2)
      .forEach(([system, count]) => {
        hotspots.systemClusters.push({ system, criticalAssets: count });
      });

    return hotspots;
  }

  /**
   * Generate risk summary report
   */
  generateRiskSummary() {
    const enterpriseRisk = this.calculateEnterpriseRisk();
    const criticalityRisk = this.calculateCriticalityRisk();
    const systemRisk = this.calculateSystemRisk();
    const categoryRisk = this.calculateCategoryRisk();
    const decisionRisk = this.calculateDecisionRisk();
    const hotspots = this.identifyHotspots();

    const summary = {
      generatedAt: new Date().toISOString(),
      enterpriseRisk: {
        overall: enterpriseRisk,
        riskStatement: `Enterprise risk is ${enterpriseRisk.level}. ${enterpriseRisk.trend.reason}`
      },
      riskByDimension: {
        byCriticality: criticalityRisk,
        bySystem: Array.from(systemRisk.entries()).slice(0, 10),
        byCategory: Array.from(categoryRisk.entries()),
        byDecision: decisionRisk
      },
      topThreats: {
        highestRisk: enterpriseRisk.topRisks.slice(0, 5),
        pastEOL: hotspots.pastEOL.slice(0, 5),
        activeCVEs: hotspots.criticalCVEs.slice(0, 5),
        highFrictionUpgrades: hotspots.highFriction.slice(0, 5)
      },
      recommendations: this.generateRiskRecommendations(
        enterpriseRisk,
        criticalityRisk,
        hotspots
      )
    };

    this.lastCalculation = summary;
    return summary;
  }

  /**
   * Generate risk-based recommendations
   */
  generateRiskRecommendations(enterpriseRisk, criticalityRisk, hotspots) {
    const recommendations = [];

    // Recommendation 1: Enterprise risk level
    if (enterpriseRisk.score >= 80) {
      recommendations.push({
        priority: 'CRITICAL',
        title: 'Enterprise Risk Level - CRITICAL',
        action: 'Declare software lifecycle emergency. Activate rapid remediation protocol.',
        rationale: 'Enterprise risk score is critically high. Escalate to executive leadership.'
      });
    } else if (enterpriseRisk.score >= 60) {
      recommendations.push({
        priority: 'HIGH',
        title: 'Accelerate Critical Upgrades',
        action: `Upgrade ${criticalityRisk.critical.length} critical assets within 30 days`,
        rationale: `${criticalityRisk.critical.length} critical systems have high risk exposure`
      });
    }

    // Recommendation 2: Past EOL urgency
    if (hotspots.pastEOL.length > 0) {
      recommendations.push({
        priority: hotspots.pastEOL.length > 5 ? 'CRITICAL' : 'HIGH',
        title: 'Address Past-EOL Software',
        action: `${hotspots.pastEOL.length} software items are past end-of-life. Plan urgent upgrades.`,
        rationale: 'No security updates available. Vulnerability risk continues to grow.'
      });
    }

    // Recommendation 3: Active CVE exposure
    if (hotspots.criticalCVEs.length > 0) {
      recommendations.push({
        priority: 'CRITICAL',
        title: 'Mitigate Active CVE Exposure',
        action: `${hotspots.criticalCVEs.length} assets have activated CVEs. Implement mitigations.`,
        rationale: 'Exploitable vulnerabilities are actively being attacked in the wild.'
      });
    }

    // Recommendation 4: High friction considerations
    if (hotspots.highFriction.length > 0) {
      recommendations.push({
        priority: 'MEDIUM',
        title: 'Plan High-Friction Upgrades Carefully',
        action: `${hotspots.highFriction.length} upgrades have high friction scores. Plan extended timelines.`,
        rationale: 'These upgrades will disrupt operations. Require careful planning and testing.'
      });
    }

    // Recommendation 5: System cluster protection
    if (hotspots.systemClusters.length > 0) {
      recommendations.push({
        priority: 'HIGH',
        title: 'Protect System Clusters',
        action: `${hotspots.systemClusters.length} systems have multiple critical risk assets. Implement redundancy.`,
        rationale: 'Single system failure could cascade across dependent systems.'
      });
    }

    return recommendations;
  }

  /**
   * Export risk profile
   */
  exportRiskProfile(format = 'json') {
    const summary = this.generateRiskSummary();

    if (format === 'json') {
      return summary;
    } else if (format === 'csv') {
      let csv = 'Asset,Risk Score,Risk Level,Criticality,CVEs Activated,Days Until EOL,Systems,Category\n';

      this.orchestrator.assets.forEach(asset => {
        const risk = this.calculateAssetRisk(asset);
        csv += `"${asset.name}",${risk},"${this.getRiskLevel(risk)}","${asset.criticality}",${asset.analysis?.cveActivated || 0},${asset.analysis?.daysUntilEOL || 'N/A'},${asset.systems?.length || 0},"${asset.category}"\n`;
      });

      return csv;
    }
  }
}

/**
 * Export
 */
module.exports = {
  RiskAggregationEngine
};
