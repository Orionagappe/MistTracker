/**
 * Phase 17.5-Alpha: Enterprise Orchestration Dashboard
 * 
 * Real-time visibility into enterprise software lifecycle
 * decisions, risks, and upgrade progress
 */

/**
 * OrchestrationDashboard: Visualization and reporting hub
 */
class OrchestrationDashboard {
  constructor(orchestrator, riskEngine) {
    this.orchestrator = orchestrator;
    this.riskEngine = riskEngine;
    this.dashboardMetrics = {};
    this.lastUpdate = null;
  }

  /**
   * Build complete dashboard data
   */
  buildDashboard() {
    console.log('\n[Dashboard] Building enterprise orchestration dashboard...');

    const dashboard = {
      metadata: {
        generatedAt: new Date().toISOString(),
        version: '17.5-Alpha',
        dataSource: 'Phase17_5_Orchestrator'
      },

      // 1. Executive Overview
      executiveOverview: this.buildExecutiveOverview(),

      // 2. Risk Dashboard
      riskDashboard: this.buildRiskDashboard(),

      // 3. Inventory Dashboard
      inventoryDashboard: this.buildInventoryDashboard(),

      // 4. Decision Dashboard
      decisionDashboard: this.buildDecisionDashboard(),

      // 5. System Health Dashboard
      systemHealth: this.buildSystemHealth(),

      // 6. Roadmap Progress
      roadmapProgress: this.buildRoadmapProgress(),

      // 7. Alerts and Notifications
      alerts: this.buildAlerts()
    };

    this.dashboardMetrics = dashboard;
    this.lastUpdate = new Date();

    console.log('[Dashboard] Dashboard ready');
    return dashboard;
  }

  /**
   * Executive Overview (C-level view)
   */
  buildExecutiveOverview() {
    const assets = Array.from(this.orchestrator.assets.values());
    const enterpriseRisk = this.riskEngine.calculateEnterpriseRisk();

    return {
      title: 'Executive Overview',
      keyMetrics: {
        totalSoftware: assets.length,
        systemsManaged: this.orchestrator.assetsBySystem.size,
        enterpriseRiskScore: enterpriseRisk.score,
        enterpriseRiskLevel: enterpriseRisk.level,
        riskTrend: enterpriseRisk.trend.direction
      },
      decisionBreakdown: {
        upgradeRequired: this.orchestrator.statistics.upgradeRecommended,
        remediateRecommended: this.orchestrator.statistics.remediateRecommended,
        monitorAndWatch: this.orchestrator.statistics.watchRecommendation || 0
      },
      criticality: {
        critical: assets.filter(a => a.criticality === 'critical').length,
        high: assets.filter(a => a.criticality === 'high').length,
        medium: assets.filter(a => a.criticality === 'medium').length,
        low: assets.filter(a => a.criticality === 'low').length
      },
      businessImpact: {
        systemsAtRisk: assets.filter(a => this.riskEngine.calculateAssetRisk(a) > 60).length,
        immediateActionNeeded: assets.filter(a => this.riskEngine.calculateAssetRisk(a) > 80).length,
        burndownTarget: `${((this.orchestrator.statistics.upgradeRecommended / assets.length) * 100).toFixed(1)}% to eliminate`
      }
    };
  }

  /**
   * Risk Dashboard
   */
  buildRiskDashboard() {
    const riskSummary = this.riskEngine.generateRiskSummary();
    const hotspots = this.riskEngine.identifyHotspots();

    return {
      title: 'Risk Analysis',
      enterpriseRisk: riskSummary.enterpriseRisk,
      riskDistribution: {
        critical: this.countByRiskLevel('CRITICAL'),
        high: this.countByRiskLevel('HIGH'),
        medium: this.countByRiskLevel('MEDIUM'),
        low: this.countByRiskLevel('LOW'),
        veryLow: this.countByRiskLevel('VERY LOW')
      },
      riskByDimension: {
        byCriticality: this.formatCriticalityRisks(riskSummary.riskByDimension.byCriticality),
        topSystems: this.formatSystemRisks(riskSummary.riskByDimension.bySystem),
        byCategory: this.formatCategoryRisks(riskSummary.riskByDimension.byCategory)
      },
      topThreats: riskSummary.topThreats,
      hotspots: {
        pastEOL: hotspots.pastEOL.length,
        activeCVEs: hotspots.criticalCVEs.length,
        highFrictionUpgrades: hotspots.highFriction.length,
        systemClusters: hotspots.systemClusters.length
      }
    };
  }

  /**
   * Inventory Dashboard
   */
  buildInventoryDashboard() {
    const assets = Array.from(this.orchestrator.assets.values());

    const categories = {};
    const eolStatus = { current: 0, approaching: 0, upcoming: 0, stable: 0 };

    assets.forEach(asset => {
      if (!categories[asset.category]) categories[asset.category] = 0;
      categories[asset.category]++;

      const daysUntilEOL = asset.analysis?.daysUntilEOL || 365 * 3;
      if (daysUntilEOL < 0) eolStatus.current++;
      else if (daysUntilEOL < 90) eolStatus.approaching++;
      else if (daysUntilEOL < 180) eolStatus.upcoming++;
      else eolStatus.stable++;
    });

    return {
      title: 'Inventory Management',
      totalAssets: assets.length,
      byCategory: categories,
      eolStatus,
      oldestAssets: assets
        .map(a => ({
          name: a.name,
          version: a.version,
          daysOld: a.analysis?.daysUntilEOL ? Math.abs(a.analysis.daysUntilEOL) : 0,
          systems: a.systems?.length || 0
        }))
        .sort((a, b) => a.daysOld - b.daysOld)
        .slice(0, 10),
      systemCoverage: {
        totalSystems: this.orchestrator.assetsBySystem.size,
        avgAssetsPerSystem: (assets.reduce((sum, a) => sum + (a.systems?.length || 0), 0) / this.orchestrator.assetsBySystem.size).toFixed(1)
      }
    };
  }

  /**
   * Decision Dashboard
   */
  buildDecisionDashboard() {
    const decisionRisk = this.riskEngine.calculateDecisionRisk();
    const assets = Array.from(this.orchestrator.assets.values());

    return {
      title: 'Decision Analysis',
      decisions: {
        upgrade: {
          count: decisionRisk.upgrade.count,
          avgRisk: decisionRisk.upgrade.avgRisk.toFixed(1),
          riskLevel: decisionRisk.upgrade.riskLevel,
          reason: 'Active CVE or critical vulnerability'
        },
        remediate: {
          count: decisionRisk.remediate.count,
          avgRisk: decisionRisk.remediate.avgRisk.toFixed(1),
          riskLevel: decisionRisk.remediate.riskLevel,
          reason: 'Stable with monitoring'
        },
        watch: {
          count: decisionRisk.watch.count,
          avgRisk: decisionRisk.watch.avgRisk.toFixed(1),
          riskLevel: decisionRisk.watch.riskLevel,
          reason: 'Monitor for changes'
        }
      },
      decisionDistribution: {
        percentUpgrade: ((decisionRisk.upgrade.count / assets.length) * 100).toFixed(1),
        percentRemediate: ((decisionRisk.remediate.count / assets.length) * 100).toFixed(1),
        percentWatch: ((decisionRisk.watch.count / assets.length) * 100).toFixed(1)
      },
      highestRiskByDecision: {
        upgrade: decisionRisk.upgrade.assets.slice(0, 5),
        remediate: decisionRisk.remediate.assets.slice(0, 5),
        watch: decisionRisk.watch.assets.slice(0, 5)
      }
    };
  }

  /**
   * System Health Dashboard
   */
  buildSystemHealth() {
    const systemRisk = this.riskEngine.calculateSystemRisk();

    const systemHealth = Array.from(systemRisk.values()).map(sys => ({
      system: sys.system,
      healthScore: 100 - sys.avgRisk,
      riskLevel: sys.riskLevel,
      assetsManaged: sys.assets.length,
      maxRisk: sys.maxRisk.toFixed(1),
      avgRisk: sys.avgRisk.toFixed(1),
      topRiskAssets: sys.assets.slice(0, 3)
    }));

    return {
      title: 'System Health',
      overallHealth: (
        systemHealth.reduce((sum, s) => sum + s.healthScore, 0) / systemHealth.length
      ).toFixed(1),
      systems: systemHealth.slice(0, 15),
      healthTrend: this.calculateHealthTrend()
    };
  }

  /**
   * Roadmap Progress
   */
  buildRoadmapProgress() {
    const totalAssets = this.orchestrator.assets.size;
    const analyzed = this.orchestrator.analysisResults.size;
    const decisionMade = this.orchestrator.decisions.size;

    return {
      title: 'Roadmap & Progress',
      analysisProgress: {
        total: totalAssets,
        analyzed,
        percentComplete: ((analyzed / totalAssets) * 100).toFixed(1)
      },
      decisionProgress: {
        total: totalAssets,
        made: decisionMade,
        percentComplete: ((decisionMade / totalAssets) * 100).toFixed(1)
      },
      recommendedSchedule: {
        phase1: '0-4 weeks: Critical upgrades',
        phase2: '4-8 weeks: High-priority upgrades',
        phase3: '8-12 weeks: Medium-priority and remediation',
        phase4: '12+ weeks: Monitoring and watch'
      },
      estimatedDuration: '12 weeks',
      estimatedCost: '$' + this.estimateRoadmapCost()
    };
  }

  /**
   * Build alerts and notifications
   */
  buildAlerts() {
    const alerts = [];
    const hotspots = this.riskEngine.identifyHotspots();

    // Critical alerts
    if (hotspots.criticalCVEs.length > 0) {
      alerts.push({
        severity: 'CRITICAL',
        title: `${hotspots.criticalCVEs.length} Assets with Active CVEs`,
        message: `${hotspots.criticalCVEs.length} software items have activated CVEs requiring immediate attention`,
        action: 'Review and prioritize upgrades'
      });
    }

    if (hotspots.pastEOL.length > 0) {
      alerts.push({
        severity: 'CRITICAL',
        title: `${hotspots.pastEOL.length} Past End-of-Life`,
        message: `${hotspots.pastEOL.length} software items are past EOL with no security updates`,
        action: 'Plan urgent upgrades'
      });
    }

    // High alerts
    if (hotspots.highFriction.length > 0) {
      alerts.push({
        severity: 'HIGH',
        title: `${hotspots.highFriction.length} High-Friction Upgrades`,
        message: 'These upgrades carry high complexity and disruption risk',
        action: 'Extend planning timeline'
      });
    }

    // Medium alerts
    const unstableCount = Array.from(this.orchestrator.assets.values())
      .filter(a => (a.analysis?.stability || 80) < 50).length;

    if (unstableCount > 0) {
      alerts.push({
        severity: 'MEDIUM',
        title: `${unstableCount} Systems Showing Instability`,
        message: 'Potential rampancy or chaos detected in software stack',
        action: 'Investigate stability issues'
      });
    }

    return alerts;
  }

  /**
   * Helper: Count assets by risk level
   */
  countByRiskLevel(level) {
    let count = 0;
    this.orchestrator.assets.forEach(asset => {
      const risk = this.riskEngine.calculateAssetRisk(asset);
      const riskLevel = this.riskEngine.getRiskLevel(risk);
      if (riskLevel === level) count++;
    });
    return count;
  }

  /**
   * Helper: Format criticality risks
   */
  formatCriticalityRisks(criticalityRisk) {
    return {
      critical: {
        count: criticalityRisk.critical.length,
        highRiskCount: criticalityRisk.critical.filter(r => r.risk > 60).length
      },
      high: {
        count: criticalityRisk.high.length,
        highRiskCount: criticalityRisk.high.filter(r => r.risk > 60).length
      },
      medium: {
        count: criticalityRisk.medium.length,
        highRiskCount: criticalityRisk.medium.filter(r => r.risk > 60).length
      },
      low: {
        count: criticalityRisk.low.length,
        highRiskCount: criticalityRisk.low.filter(r => r.risk > 60).length
      }
    };
  }

  /**
   * Helper: Format system risks
   */
  formatSystemRisks(systemRisks) {
    return systemRisks.slice(0, 10).map(([system, risk]) => ({
      system,
      riskScore: risk.avgRisk.toFixed(1),
      riskLevel: risk.riskLevel,
      assets: risk.assets.length
    }));
  }

  /**
   * Helper: Format category risks
   */
  formatCategoryRisks(categoryRisks) {
    return Array.from(categoryRisks.entries()).map(([category, risk]) => ({
      category,
      riskScore: risk.avgRisk.toFixed(1),
      riskLevel: risk.riskLevel,
      assets: risk.assets.length
    }));
  }

  /**
   * Helper: Calculate health trend
   */
  calculateHealthTrend() {
    const upgradeCount = this.orchestrator.statistics.upgradeRecommended;
    const totalCount = this.orchestrator.assets.size;
    const upgradePercentage = ((upgradeCount / totalCount) * 100).toFixed(1);

    if (upgradePercentage < 10) return 'Excellent - Very healthy software stack';
    if (upgradePercentage < 30) return 'Good - Most software current';
    if (upgradePercentage < 60) return 'Fair - Notable upgrades needed';
    return 'Poor - Majority of software needs updating';
  }

  /**
   * Helper: Estimate roadmap cost
   */
  estimateRoadmapCost() {
    const assets = Array.from(this.orchestrator.assets.values());
    const upgradeCount = this.orchestrator.statistics.upgradeRecommended;
    const remediateCount = this.orchestrator.statistics.remediateRecommended;

    const upgradeCost = upgradeCount * 500; // $500 per upgrade
    const remediateCost = remediateCount * 300; // $300 per remediation
    const downtime = upgradeCount * 2000; // $2000 downtime per upgrade
    const labor = assets.reduce((sum, a) => sum + ((a.analysis?.friction || 30) / 10 * 150), 0);

    return (upgradeCost + remediateCost + downtime + labor).toFixed(0);
  }

  /**
   * Export dashboard as HTML report
   */
  exportAsHTML() {
    const dashboard = this.dashboardMetrics;

    let html = `
<!DOCTYPE html>
<html>
<head>
  <title>Enterprise Software Lifecycle Dashboard - Phase 17.5</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 20px; background: #f5f5f5; }
    .container { max-width: 1400px; margin: 0 auto; }
    .header { background: #003366; color: white; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
    .metric { background: white; padding: 15px; margin: 10px 0; border-radius: 8px; border-left: 4px solid #003366; }
    .critical { border-left-color: #CC0000; }
    .high { border-left-color: #FF6600; }
    .medium { border-left-color: #FFCC00; }
    .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 15px; margin: 15px 0; }
    .card { background: white; padding: 15px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
    .alert { padding: 12px; margin: 10px 0; border-radius: 4px; border-left: 4px solid; }
    .alert-critical { background: #ffcccc; border-left-color: #CC0000; }
    .alert-high { background: #ffe6cc; border-left-color: #FF6600; }
    h2 { color: #003366; border-bottom: 2px solid #003366; padding-bottom: 10px; margin-top: 30px; }
    .number { font-size: 24px; font-weight: bold; color: #003366; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Enterprise Software Lifecycle Orchestration Dashboard</h1>
      <p>Phase 17.5-Alpha | Generated: ${dashboard.metadata.generatedAt}</p>
    </div>

    <h2>Executive Summary</h2>
    <div class="grid">
      <div class="card">
        <div class="number">${dashboard.executiveOverview.keyMetrics.totalSoftware}</div>
        <div>Software Items Managed</div>
      </div>
      <div class="card">
        <div class="number">${dashboard.executiveOverview.keyMetrics.enterpriseRiskScore}</div>
        <div>Enterprise Risk Score (${dashboard.executiveOverview.keyMetrics.enterpriseRiskLevel})</div>
      </div>
      <div class="card">
        <div class="number">${dashboard.executiveOverview.decisionBreakdown.upgradeRequired}</div>
        <div>Upgrades Recommended</div>
      </div>
      <div class="card">
        <div class="number">${dashboard.executiveOverview.keyMetrics.systemsManaged}</div>
        <div>Systems Managed</div>
      </div>
    </div>

    <h2>Risk Analysis</h2>
    <div class="grid">
      <div class="card">
        <div>Critical Risk: <strong>${this.countByRiskLevel('CRITICAL')}</strong></div>
        <div>High Risk: <strong>${this.countByRiskLevel('HIGH')}</strong></div>
        <div>Medium Risk: <strong>${this.countByRiskLevel('MEDIUM')}</strong></div>
      </div>
    </div>

    <h2>Alerts & Actions</h2>
    ${dashboard.alerts.map(alert => `
      <div class="alert alert-${alert.severity.toLowerCase()}">
        <strong>${alert.severity}:</strong> ${alert.title}<br>
        ${alert.message}<br>
        <em>Action: ${alert.action}</em>
      </div>
    `).join('')}

    <h2>Decision Summary</h2>
    <div class="grid">
      <div class="card">
        <div class="number">${dashboard.decisionDashboard.decisions.upgrade.count}</div>
        <div>Upgrade</div>
      </div>
      <div class="card">
        <div class="number">${dashboard.decisionDashboard.decisions.remediate.count}</div>
        <div>Remediate</div>
      </div>
      <div class="card">
        <div class="number">${dashboard.decisionDashboard.decisions.watch.count}</div>
        <div>Watch</div>
      </div>
    </div>

    <h2>System Health</h2>
    <div>Overall Health Score: <strong>${dashboard.systemHealth.overallHealth}/100</strong></div>
    <div>${dashboard.systemHealth.healthTrend}</div>
  </div>
</body>
</html>
    `;

    return html;
  }

  /**
   * Export dashboard as JSON
   */
  exportAsJSON() {
    return this.dashboardMetrics;
  }
}

/**
 * Export
 */
module.exports = {
  OrchestrationDashboard
};
