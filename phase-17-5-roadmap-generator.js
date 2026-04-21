/**
 * Phase 17.5-Alpha: Upgrade Roadmap Generator
 * 
 * Creates strategic phased upgrade plans that minimize risk
 * and organizational disruption
 */

/**
 * UpgradeRoadmapGenerator: Strategic upgrade planning
 */
class UpgradeRoadmapGenerator {
  constructor(orchestrator) {
    this.orchestrator = orchestrator;
  }

  /**
   * Generate complete upgrade roadmap
   */
  generateRoadmap(options = {}) {
    const {
      weeksToComplete = 12,
      upgradesPerWeek = 5,
      maxSystemDowntimePerWeek = 4, // hours
      maxTeamHoursPerWeek = 40,
      criticalFirst = true,
      includeRemediationPhase = true
    } = options;

    console.log('\n[RoadmapGenerator] Generating upgrade roadmap...');
    console.log(`  Timeline: ${weeksToComplete} weeks`);
    console.log(`  Max upgrades/week: ${upgradesPerWeek}`);
    console.log(`  Max downtime/week: ${maxSystemDowntimePerWeek}h`);

    // Collect all assets
    const allAssets = Array.from(this.orchestrator.assets.values());

    // Separate by decision
    const upgradeAssets = allAssets.filter(a => this.orchestrator.decisions.get(a.id) === 'upgrade');
    const remediateAssets = allAssets.filter(a => this.orchestrator.decisions.get(a.id) === 'remediate');

    // Sort upgrade candidates by priority
    const sortedUpgrades = this.prioritizeUpgrades(upgradeAssets);

    // Create phases
    const phases = [];
    let weekCounter = 1;
    let weekAssets = [];
    let weekHours = 0;
    let weekDowntime = 0;

    for (const asset of sortedUpgrades) {
      const analysis = asset.analysis || {};
      const estimatedHours = (analysis.friction || 30) / 10;
      const estimatedDowntime = asset.systems.length * 0.5;

      // Check if adding this asset exceeds weekly limits
      if (
        (weekAssets.length >= upgradesPerWeek ||
         weekHours + estimatedHours > maxTeamHoursPerWeek ||
         weekDowntime + estimatedDowntime > maxSystemDowntimePerWeek) &&
        weekAssets.length > 0
      ) {
        // Finish current week
        const phase = this.createPhase(weekCounter, weekAssets, 'upgrade');
        phases.push(phase);

        weekCounter++;
        weekAssets = [];
        weekHours = 0;
        weekDowntime = 0;
      }

      weekAssets.push(asset);
      weekHours += estimatedHours;
      weekDowntime += estimatedDowntime;
    }

    // Final week if assets remain
    if (weekAssets.length > 0) {
      const phase = this.createPhase(weekCounter, weekAssets, 'upgrade');
      phases.push(phase);
    }

    // Add remediation phase
    if (includeRemediationPhase && remediateAssets.length > 0) {
      const remediationPhase = {
        number: phases.length + 1,
        week: phases.length + 1,
        type: 'remediation',
        title: 'Dependency Locking & Monitoring Setup',
        assets: remediateAssets.map(a => ({
          id: a.id,
          name: a.name,
          version: a.version,
          criticality: a.criticality,
          systems: a.systems,
          strategy: 'lock-and-monitor',
          estimatedHours: 2
        })),
        description: 'Lock stable EOL software and establish vulnerability monitoring',
        estimatedTotalHours: remediateAssets.length * 2,
        estimatedCost: remediateAssets.length * 300
      };

      phases.push(remediationPhase);
    }

    // Calculate total metrics
    const totalMetrics = this.calculateMetrics(phases);

    const roadmap = {
      metadata: {
        generatedAt: new Date().toISOString(),
        version: '17.5-Alpha',
        totalWeeks: phases.length,
        planningWeeks: weeksToComplete
      },
      phases,
      summary: {
        totalUpgrades: sortedUpgrades.length,
        totalRemediations: remediateAssets.length,
        totalPhases: phases.length,
        ...totalMetrics
      },
      timeline: this.generateTimeline(phases),
      risks: this.assessRoadmapRisks(phases),
      recommendations: this.generateRecommendations(phases, totalMetrics)
    };

    console.log(`[RoadmapGenerator] Roadmap complete:`);
    console.log(`  Phases: ${phases.length}`);
    console.log(`  Upgrades: ${sortedUpgrades.length}`);
    console.log(`  Est. Cost: $${totalMetrics.estimatedCost}`);
    console.log(`  Est. Downtime: ${totalMetrics.estimatedDowntime}h`);

    return roadmap;
  }

  /**
   * Prioritize upgrades by risk and criticality
   */
  prioritizeUpgrades(assets) {
    return assets.sort((a, b) => {
      // Priority 1: Critical systems with active CVEs
      const aCveScore = (a.analysis?.cveActivated || 0) * (a.criticality === 'critical' ? 3 : 1);
      const bCveScore = (b.analysis?.cveActivated || 0) * (b.criticality === 'critical' ? 3 : 1);

      if (aCveScore !== bCveScore) return bCveScore - aCveScore;

      // Priority 2: EOL status
      const aEolScore = a.analysis?.daysUntilEOL || 365 * 3;
      const bEolScore = b.analysis?.daysUntilEOL || 365 * 3;

      if (aEolScore !== bEolScore) return aEolScore - bEolScore;

      // Priority 3: Low friction upgrades (easier first)
      const aFriction = a.analysis?.friction || 50;
      const bFriction = b.analysis?.friction || 50;

      return aFriction - bFriction;
    });
  }

  /**
   * Create a phase definition
   */
  createPhase(number, assets, type = 'upgrade') {
    const phaseDef = {
      number,
      week: number,
      type,
      title: `Week ${number}: ${type === 'upgrade' ? 'Planned Upgrades' : 'Remediation'}`,
      assets: assets.map(a => ({
        id: a.id,
        name: a.name,
        version: a.version,
        targetVersion: a.analysis?.targetVersion || 'latest',
        criticality: a.criticality,
        systems: a.systems,
        friction: a.analysis?.friction || 50,
        cvesActivated: a.analysis?.cveActivated || 0,
        daysUntilEOL: a.analysis?.daysUntilEOL || 365
      })),
      statistics: {
        assetCount: assets.length,
        systemsAffected: new Set(assets.flatMap(a => a.systems)).size,
        estimatedHours: assets.reduce((sum, a) => sum + ((a.analysis?.friction || 30) / 10), 0),
        estimatedDowntime: assets.filter(a => a.systems.length > 1).length * 0.5,
        totalCriticality: assets.filter(a => a.criticality === 'critical').length
      }
    };

    phaseDef.statistics.estimatedCost = 
      (phaseDef.statistics.estimatedHours * 150) +
      (phaseDef.statistics.estimatedDowntime * 5000);

    return phaseDef;
  }

  /**
   * Calculate total roadmap metrics
   */
  calculateMetrics(phases) {
    let totalHours = 0;
    let totalDowntime = 0;
    let totalCost = 0;
    let totalAssets = 0;
    let totalSystems = new Set();

    phases.forEach(phase => {
      if (phase.type === 'upgrade') {
        totalHours += phase.statistics.estimatedHours;
        totalDowntime += phase.statistics.estimatedDowntime;
        totalCost += phase.statistics.estimatedCost;
      } else if (phase.type === 'remediation') {
        totalHours += phase.estimatedTotalHours || 0;
        totalCost += phase.estimatedCost || 0;
      }

      totalAssets += phase.assets.length;
      phase.assets.forEach(a => {
        if (a.systems) {
          a.systems.forEach(sys => totalSystems.add(sys));
        }
      });
    });

    return {
      estimatedHours: Math.round(totalHours * 10) / 10,
      estimatedDowntime: Math.round(totalDowntime * 10) / 10,
      estimatedCost: Math.round(totalCost),
      totalAssets,
      totalSystems: totalSystems.size,
      avgCostPerAsset: Math.round(totalCost / totalAssets),
      avgHoursPerAsset: Math.round((totalHours / totalAssets) * 10) / 10
    };
  }

  /**
   * Generate timeline representation
   */
  generateTimeline(phases) {
    const timeline = {};

    phases.forEach(phase => {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() + (phase.week - 1) * 7);

      const endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + 6);

      timeline[`Week ${phase.week}`] = {
        dateRange: `${startDate.toISOString().split('T')[0]} to ${endDate.toISOString().split('T')[0]}`,
        assets: phase.assets.map(a => a.name),
        type: phase.type
      };
    });

    return timeline;
  }

  /**
   * Assess roadmap risks
   */
  assessRoadmapRisks(phases) {
    const risks = {
      high: [],
      medium: [],
      low: []
    };

    phases.forEach((phase, index) => {
      if (phase.type !== 'upgrade') return;

      // Risk 1: Too many critical assets in one phase
      const criticalCount = phase.assets.filter(a => a.criticality === 'critical').length;
      if (criticalCount > 2) {
        risks.high.push({
          phase: phase.number,
          risk: `${criticalCount} critical assets in single phase (recommended max: 2)`,
          mitigation: 'Split critical upgrades across multiple weeks'
        });
      }

      // Risk 2: High downtime
      if (phase.statistics.estimatedDowntime > 3) {
        risks.medium.push({
          phase: phase.number,
          risk: `High downtime: ${phase.statistics.estimatedDowntime}h (recommended max: 3h/week)`,
          mitigation: 'Consider staggering to multiple weeks'
        });
      }

      // Risk 3: Tight schedule with high friction
      const avgFriction = phase.assets.reduce((sum, a) => sum + (a.friction || 50), 0) / phase.assets.length;
      if (avgFriction > 70 && phase.assets.length > 2) {
        risks.medium.push({
          phase: phase.number,
          risk: `High friction upgrades in same week (avg: ${avgFriction.toFixed(0)}/100)`,
          mitigation: 'Reduce upgrades per week or allow more time'
        });
      }

      // Risk 4: Dependent upgrades in wrong order
      phase.assets.forEach(asset => {
        const dependents = this.orchestrator.dependencyGraph.getAllDependents(asset.id) || [];
        const laterPhasesDependents = dependents.filter(depId => {
          const depAsset = this.orchestrator.assets.get(depId);
          const depPhase = phases.find(p => p.assets.some(a => a.id === depId));
          return depPhase && depPhase.number <= phase.number;
        });

        if (laterPhasesDependents.length > 0) {
          risks.high.push({
            phase: phase.number,
            risk: `${asset.name} has dependent upgrades in earlier phases`,
            mitigation: `Reorder: upgrade dependencies first`
          });
        }
      });
    });

    return risks;
  }

  /**
   * Generate recommendations
   */
  generateRecommendations(phases, metrics) {
    const recommendations = [];

    // Recommendation 1: Communication plan
    recommendations.push({
      priority: 'high',
      recommendation: 'Implement Change Management',
      action: 'Notify stakeholders 2 weeks before first upgrade',
      rationale: `${metrics.totalAssets} software items will be updated. Early notification reduces resistance.`,
      owner: 'Change Manager'
    });

    // Recommendation 2: Testing plan
    const criticalUpgrades = phases
      .filter(p => p.type === 'upgrade')
      .flatMap(p => p.assets.filter(a => a.criticality === 'critical'));

    if (criticalUpgrades.length > 0) {
      recommendations.push({
        priority: 'critical',
        recommendation: 'Establish Critical Path Testing',
        action: `Create regression test suite for ${criticalUpgrades.length} critical upgrades`,
        rationale: 'Critical upgrades need thorough testing before production',
        owner: 'QA Team'
      });
    }

    // Recommendation 3: Contingency
    recommendations.push({
      priority: 'high',
      recommendation: 'Prepare Rollback Plans',
      action: `Document rollback procedures for all ${metrics.totalAssets} upgrades`,
      rationale: 'Be ready to revert if unintended consequences occur',
      owner: 'DevOps/SRE'
    });

    // Recommendation 4: Monitoring
    recommendations.push({
      priority: 'high',
      recommendation: 'Enhanced Monitoring During Rollout',
      action: 'Enable detailed logging and alerting for all ${metrics.totalAssets} during upgrade phases',
      rationale: 'Detect issues immediately for rapid response',
      owner: 'Monitoring/Observability'
    });

    // Recommendation 5: Team capacity
    const estimatedTeamWeeks = metrics.estimatedHours / 40;
    if (estimatedTeamWeeks > phases.length) {
      recommendations.push({
        priority: 'medium',
        recommendation: 'Secure Additional Resources',
        action: `Request ${Math.ceil(estimatedTeamWeeks / phases.length)} FTE for ${phases.length} weeks`,
        rationale: `Current roadmap requires ${metrics.estimatedHours} hours across ${phases.length} weeks`,
        owner: 'Project Manager'
      });
    }

    return recommendations;
  }

  /**
   * Export roadmap as detailed report
   */
  exportRoadmapReport(roadmap, format = 'json') {
    if (format === 'json') {
      return roadmap;
    } else if (format === 'text') {
      let report = `\n${'='.repeat(80)}\n`;
      report += `UPGRADE ROADMAP REPORT\n`;
      report += `${'='.repeat(80)}\n\n`;

      report += `SUMMARY\n${'-'.repeat(80)}\n`;
      report += `Total Phases: ${roadmap.summary.totalPhases}\n`;
      report += `Total Upgrades: ${roadmap.summary.totalUpgrades}\n`;
      report += `Total Remediations: ${roadmap.summary.totalRemediations}\n`;
      report += `Estimated Cost: $${roadmap.summary.estimatedCost}\n`;
      report += `Estimated Downtime: ${roadmap.summary.estimatedDowntime} hours\n`;
      report += `Systems Affected: ${roadmap.summary.totalSystems}\n\n`;

      roadmap.phases.forEach(phase => {
        report += `PHASE ${phase.number}: ${phase.title}\n${'-'.repeat(80)}\n`;
        report += `Assets: ${phase.assets.length}\n`;
        if (phase.statistics) {
          report += `Systems Affected: ${phase.statistics.systemsAffected}\n`;
          report += `Estimated Hours: ${phase.statistics.estimatedHours}\n`;
          report += `Estimated Downtime: ${phase.statistics.estimatedDowntime}h\n`;
          report += `Estimated Cost: $${phase.statistics.estimatedCost}\n`;
        }
        report += `\nAssets:\n`;
        phase.assets.forEach(asset => {
          report += `  - ${asset.name} v${asset.version} → v${asset.targetVersion} (${asset.criticality})\n`;
        });
        report += `\n`;
      });

      report += `RISKS\n${'-'.repeat(80)}\n`;
      Object.entries(roadmap.risks).forEach(([level, riskList]) => {
        if (riskList.length > 0) {
          report += `${level.toUpperCase()} RISKS (${riskList.length}):\n`;
          riskList.slice(0, 3).forEach(risk => {
            report += `  Phase ${risk.phase}: ${risk.risk}\n`;
            report += `    Mitigation: ${risk.mitigation}\n`;
          });
        }
      });
      report += `\n`;

      report += `RECOMMENDATIONS\n${'-'.repeat(80)}\n`;
      roadmap.recommendations.forEach(rec => {
        report += `[${rec.priority.toUpperCase()}] ${rec.recommendation}\n`;
        report += `  Action: ${rec.action}\n`;
        report += `  Owner: ${rec.owner}\n\n`;
      });

      return report;
    }
  }
}

/**
 * Export
 */
module.exports = {
  UpgradeRoadmapGenerator
};
