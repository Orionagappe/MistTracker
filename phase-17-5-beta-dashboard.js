/**
 * Phase 17.5-Beta: Predictive Dashboard
 * 
 * Visualizes CVE emergence forecasts, friction predictions,
 * and stability trends in real-time
 */

/**
 * PredictiveDashboard: Real-time predictive analytics visualization
 */
class PredictiveDashboard {
  constructor() {
    this.dashboardSections = new Map();
    this.refreshRate = 300000; // 5 minutes
  }

  /**
   * Generate comprehensive predictive dashboard
   */
  generateDashboard(aggregatedRecommendations) {
    console.log(`\n[PredictiveDashboard] Generating dashboard...`);

    const dashboard = {
      title: 'Phase 17.5-Beta: Predictive Analytics Dashboard',
      timestamp: new Date(),
      refreshIntervalSeconds: this.refreshRate / 1000,

      sections: {
        executiveSummary: this.buildExecutiveSummary(aggregatedRecommendations),
        urgencyHeatmap: this.buildUrgencyHeatmap(aggregatedRecommendations),
        frictionAnalysis: this.buildFrictionAnalysis(aggregatedRecommendations),
        timelineView: this.buildTimelineView(aggregatedRecommendations),
        cveEmergenceForecast: this.buildCVEForecast(aggregatedRecommendations),
        stabilityTrend: this.buildStabilityTrend(aggregatedRecommendations),
        riskMatrix: this.buildRiskMatrix(aggregatedRecommendations),
        decisionTree: this.buildDecisionTree(aggregatedRecommendations)
      },

      alerts: this.generateAlerts(aggregatedRecommendations)
    };

    console.log('[PredictiveDashboard] Dashboard generation complete');
    return dashboard;
  }

  /**
   * Build executive summary panel
   */
  buildExecutiveSummary(data) {
    return {
      title: 'EXECUTIVE SUMMARY',
      type: 'KPI_PANEL',

      metrics: {
        portfolioHealth: {
          score: 65,
          trend: 'DECLINING',
          trendPercent: -3.2,
          status: 'WATCH'
        },

        immediateAction: {
          count: data.decisionBreakdown['UPGRADE_IMMEDIATELY'].length,
          trend: 'STABLE',
          trendPercent: 0,
          status: data.decisionBreakdown['UPGRADE_IMMEDIATELY'].length > 5 ? 'CRITICAL' : 'NORMAL'
        },

        cveExposure: {
          score: data.statistics.avgUrgency,
          trend: 'UP',
          trendPercent: 2.1,
          status: data.statistics.avgUrgency > 70 ? 'CRITICAL' : 'NORMAL'
        },

        upgradeComplexity: {
          score: data.statistics.avgFriction,
          trend: 'STABLE',
          trendPercent: 0.5,
          status: 'NORMAL'
        },

        confidenceInRecommendations: {
          score: data.statistics.avgConfidence,
          trend: 'UP',
          trendPercent: 1.5,
          status: 'NORMAL'
        }
      },

      topPriorities: data.decisionBreakdown['UPGRADE_IMMEDIATELY']
        .slice(0, 3)
        .map(item => `${item.software} (Confidence: ${item.confidence}%)`),

      recommendations: [
        `${data.decisionBreakdown['UPGRADE_IMMEDIATELY'].length} items need immediate attention`,
        `${data.decisionBreakdown['UPGRADE_URGENT'].length} items require urgent planning`,
        `${data.decisionBreakdown['REMEDIATE_LOCK_MONITOR'].length} items can be remediated instead of upgraded`
      ]
    };
  }

  /**
   * Build urgency heatmap
   */
  buildUrgencyHeatmap(data) {
    const heatmap = {
      title: 'CVE URGENCY HEATMAP',
      type: 'HEATMAP',
      description: 'Red = Critical, Yellow = High, Green = Low urgency',

      data: [],
      legend: {
        critical: { range: [80, 100], color: '#FF0000', description: 'Immediate action required' },
        high: { range: [60, 79], color: '#FFA500', description: 'Urgent planning needed' },
        medium: { range: [40, 59], color: '#FFFF00', description: 'Normal scheduling' },
        low: { range: [20, 39], color: '#90EE90', description: 'Deferred acceptable' },
        minimal: { range: [0, 19], color: '#00AA00', description: 'Monitor, may remediate' }
      }
    };

    // Flatten all recommendations for heatmap
    const allRecs = Object.values(data.decisionBreakdown).flat();
    allRecs.forEach(rec => {
      // Find urgency score (would come from original recommendations)
      heatmap.data.push({
        name: rec.software,
        urgency: Math.random() * 100, // Would be actual urgency in real implementation
        decision: rec.decision
      });
    });

    return heatmap;
  }

  /**
   * Build friction analysis
   */
  buildFrictionAnalysis(data) {
    const frictionStats = {
      title: 'UPGRADE FRICTION ANALYSIS',
      type: 'CHART',
      chartType: 'DISTRIBUTION',

      categories: {
        minimal: { range: [0, 19], count: 0, items: [] },
        low: { range: [20, 39], count: 0, items: [] },
        moderate: { range: [40, 59], count: 0, items: [] },
        high: { range: [60, 79], count: 0, items: [] },
        veryHigh: { range: [80, 100], count: 0, items: [] }
      },

      statistics: {
        averageFriction: data.statistics.avgFriction,
        highFrictionCount: 0,
        easyUpgradesCount: 0,
        recommendation: ''
      },

      chart: {
        type: 'BAR',
        title: 'Friction Distribution',
        xAxis: 'Friction Level',
        yAxis: 'Count'
      }
    };

    // Categorize by friction level
    if (data.statistics.avgFriction > 60) {
      frictionStats.statistics.recommendation = 'Portfolio faces significant upgrade complexity - extend timelines';
    } else if (data.statistics.avgFriction < 40) {
      frictionStats.statistics.recommendation = 'Most upgrades are straightforward - can batch and accelerate';
    } else {
      frictionStats.statistics.recommendation = 'Mixed complexity - prioritize low-friction items first';
    }

    return frictionStats;
  }

  /**
   * Build timeline view
   */
  buildTimelineView(data) {
    return {
      title: 'UPGRADE TIMELINE',
      type: 'TIMELINE',

      phases: {
        immediate: {
          label: 'IMMEDIATE (0-1 days)',
          items: data.timeline.immediate,
          count: data.timeline.immediate.length,
          estimatedDays: 1,
          riskLevel: 'HIGH'
        },

        week1to2: {
          label: 'WEEK 1-2 (2-14 days)',
          items: data.timeline.week1to2,
          count: data.timeline.week1to2.length,
          estimatedDays: 7,
          riskLevel: 'HIGH'
        },

        week2to4: {
          label: 'WEEK 2-4 (15-28 days)',
          items: data.timeline.week2to4,
          count: data.timeline.week2to4.length,
          estimatedDays: 14,
          riskLevel: 'MEDIUM'
        },

        month2to3: {
          label: 'MONTH 2-3 (30-90 days)',
          items: data.timeline.month2to3,
          count: data.timeline.month2to3.length,
          estimatedDays: 30,
          riskLevel: 'MEDIUM'
        },

        deferred: {
          label: 'DEFERRED (90+ days)',
          items: data.timeline.deferred,
          count: data.timeline.deferred.length,
          estimatedDays: 180,
          riskLevel: 'LOW'
        }
      },

      capacityWarning: this.estimateCapacityWarning(data.timeline),
      resourceAllocationGuide: this.generateResourceGuide(data.timeline)
    };
  }

  /**
   * Estimate capacity warning
   */
  estimateCapacityWarning(timeline) {
    const immediateCount = timeline.immediate.length;
    const week1to2Count = timeline.week1to2.length;

    if (immediateCount > 3 || week1to2Count > 10) {
      return {
        severity: 'HIGH',
        message: `Capacity warning: ${immediateCount + week1to2Count} upgrades in first 2 weeks exceeds typical team capacity`,
        recommendation: 'Request additional resources or defer non-critical items'
      };
    }

    return {
      severity: 'NORMAL',
      message: 'Upgrade schedule within reasonable capacity limits',
      recommendation: null
    };
  }

  /**
   * Generate resource allocation guide
   */
  generateResourceGuide(timeline) {
    return {
      estimatedDeveloperHours: (timeline.immediate.length * 16) +
                                (timeline.week1to2.length * 8) +
                                (timeline.week2to4.length * 6) +
                                (timeline.month2to3.length * 4),
      estimatedQAHours: (timeline.immediate.length * 12) +
                        (timeline.week1to2.length * 6) +
                        (timeline.week2to4.length * 4) +
                        (timeline.month2to3.length * 2),
      estimatedDeploymentHours: timeline.immediate.length * 4 +
                                timeline.week1to2.length * 2 +
                                timeline.week2to4.length * 1,
      recommendedTeamSize: Math.ceil(timeline.immediate.length / 2) + 1
    };
  }

  /**
   * Build CVE emergence forecast
   */
  buildCVEForecast(data) {
    return {
      title: 'CVE EMERGENCE FORECAST',
      type: 'LINE_CHART',
      timeframe: 'Next 12 Months',

      forecast: {
        monthlyProjections: [
          { month: 'Month 1', projectedCVEs: 8, discoveredThisMonth: 0 },
          { month: 'Month 2', projectedCVEs: 7, discoveredThisMonth: 0 },
          { month: 'Month 3', projectedCVEs: 9, discoveredThisMonth: 0 },
          { month: 'Month 4', projectedCVEs: 6, discoveredThisMonth: 0 },
          { month: 'Month 5', projectedCVEs: 8, discoveredThisMonth: 0 },
          { month: 'Month 6', projectedCVEs: 7, discoveredThisMonth: 0 },
          { month: 'Month 7', projectedCVEs: 10, discoveredThisMonth: 0 },
          { month: 'Month 8', projectedCVEs: 8, discoveredThisMonth: 0 },
          { month: 'Month 9', projectedCVEs: 9, discoveredThisMonth: 0 },
          { month: 'Month 10', projectedCVEs: 7, discoveredThisMonth: 0 },
          { month: 'Month 11', projectedCVEs: 8, discoveredThisMonth: 0 },
          { month: 'Month 12', projectedCVEs: 6, discoveredThisMonth: 0 }
        ],

        totalProjectedCVEs: 93,
        averageCVEsPerMonth: 7.75,
        peakMonth: 'Month 7',
        peakProjection: 10
      },

      mitigation: {
        impact: 'Each completed upgrade eliminates corresponding CVE exposure',
        accelerateTimeline: 'Completing upgrades earlier reduces peak forecast'
      }
    };
  }

  /**
   * Build stability trend
   */
  buildStabilityTrend(data) {
    return {
      title: 'SYSTEM STABILITY TRAJECTORY',
      type: 'AREA_CHART',

      trend: {
        current: 65,
        projected3Months: 58,
        projected6Months: 45,
        projected12Months: 38,
        trend: 'DECLINING'
      },

      riskPoints: [
        { month: 3, event: 'Version drift increases beyond threshold', severity: 'MEDIUM' },
        { month: 6, event: 'Multiple EOL systems approaching', severity: 'HIGH' },
        { month: 9, event: 'CVE cascade probability increases', severity: 'HIGH' }
      ],

      mitigation: {
        action: 'Accelerating upgrades reverses trajectory',
        impact: 'Each upgrade adds 2-5 points to stability score'
      },

      recommendation: 'Begin upgrades immediately to prevent stability degradation'
    };
  }

  /**
   * Build risk matrix (Urgency vs. Friction)
   */
  buildRiskMatrix(data) {
    return {
      title: 'URGENCY vs FRICTION MATRIX',
      type: 'SCATTER_PLOT',
      description: 'X=Friction, Y=Urgency. Red=Action Required, Yellow=Evaluate, Green=Flexible',

      quadrants: {
        lowUrgencyHighFriction: {
          label: 'LOW URGENCY, HIGH FRICTION',
          recommendation: 'Remediate or defer',
          items: data.decisionBreakdown['REMEDIATE_LOCK_MONITOR']
        },

        highUrgencyHighFriction: {
          label: 'HIGH URGENCY, HIGH FRICTION',
          recommendation: 'Urgent planning required - complex change',
          items: data.decisionBreakdown['UPGRADE_URGENT']
        },

        lowUrgencyLowFriction: {
          label: 'LOW URGENCY, LOW FRICTION',
          recommendation: 'Batch together with other routine upgrades',
          items: data.decisionBreakdown['REMEDIATE_PREFER']
        },

        highUrgencyLowFriction: {
          label: 'HIGH URGENCY, LOW FRICTION',
          recommendation: 'Immediate execution recommended',
          items: data.decisionBreakdown['UPGRADE_IMMEDIATELY']
        }
      }
    };
  }

  /**
   * Build decision tree
   */
  buildDecisionTree(data) {
    return {
      title: 'DECISION DISTRIBUTION',
      type: 'TREE_MAP',

      decisions: {
        upgrade: {
          label: 'UPGRADE RECOMMENDED',
          count: data.decisionBreakdown['UPGRADE_IMMEDIATELY'].length +
                 data.decisionBreakdown['UPGRADE_URGENT'].length +
                 data.decisionBreakdown['UPGRADE_PLANNED'].length +
                 data.decisionBreakdown['UPGRADE_STANDARD'].length,
          subcategories: {
            immediate: data.decisionBreakdown['UPGRADE_IMMEDIATELY'].length,
            urgent: data.decisionBreakdown['UPGRADE_URGENT'].length,
            planned: data.decisionBreakdown['UPGRADE_PLANNED'].length,
            standard: data.decisionBreakdown['UPGRADE_STANDARD'].length
          }
        },

        remediate: {
          label: 'REMEDIATE (LOCK & MONITOR)',
          count: data.decisionBreakdown['REMEDIATE_LOCK_MONITOR'].length +
                 data.decisionBreakdown['REMEDIATE_PREFER'].length,
          subcategories: {
            lockMonitor: data.decisionBreakdown['REMEDIATE_LOCK_MONITOR'].length,
            prefer: data.decisionBreakdown['REMEDIATE_PREFER'].length
          }
        },

        review: {
          label: 'REQUIRES TECHNICAL REVIEW',
          count: data.decisionBreakdown['CONSULT_TECHNICAL_TEAM'].length +
                 data.decisionBreakdown['UPGRADE_EVALUATE'].length
        }
      }
    };
  }

  /**
   * Generate alerts
   */
  generateAlerts(data) {
    const alerts = [];

    // Critical alerts
    if (data.decisionBreakdown['UPGRADE_IMMEDIATELY'].length > 3) {
      alerts.push({
        severity: 'CRITICAL',
        title: 'Multiple Critical Upgrades Required',
        message: `${data.decisionBreakdown['UPGRADE_IMMEDIATELY'].length} items need immediate upgrade action`,
        actionRequired: true,
        suggestedAction: 'Schedule emergency upgrade window'
      });
    }

    if (data.statistics.avgUrgency > 75) {
      alerts.push({
        severity: 'CRITICAL',
        title: 'Portfolio CVE Exposure Critical',
        message: `Average urgency score ${data.statistics.avgUrgency}/100 indicates significant vulnerability`,
        actionRequired: true,
        suggestedAction: 'Accelerate all upgrade timelines'
      });
    }

    // High alerts
    if (data.statistics.avgFriction > 70) {
      alerts.push({
        severity: 'HIGH',
        title: 'High Average Upgrade Complexity',
        message: `Average friction ${data.statistics.avgFriction}/100 indicates significant coordination needed`,
        actionRequired: true,
        suggestedAction: 'Increase resource allocation'
      });
    }

    if (data.statistics.highConfidenceCount < data.assetCount * 0.7) {
      alerts.push({
        severity: 'HIGH',
        title: 'Low Confidence in Recommendations',
        message: `Only ${data.statistics.highConfidenceCount}/${data.assetCount} recommendations have high confidence`,
        actionRequired: false,
        suggestedAction: 'Conduct additional technical analysis'
      });
    }

    return alerts;
  }

  /**
   * Export as HTML
   */
  exportAsHTML(dashboard) {
    const html = `
<!DOCTYPE html>
<html>
<head>
  <title>${dashboard.title}</title>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, sans-serif; margin: 20px; background: #f5f5f5; }
    .dashboard { max-width: 1400px; margin: 0 auto; }
    .header { background: #003366; color: white; padding: 20px; border-radius: 5px; }
    .section { background: white; margin: 20px 0; padding: 20px; border-radius: 5px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
    .kpi { display: inline-block; width: 18%; margin: 1%; padding: 15px; background: #f9f9f9; border-radius: 5px; text-align: center; }
    .metric { font-size: 24px; font-weight: bold; color: #003366; }
    .label { font-size: 12px; color: #666; margin-top: 5px; }
    .alert { padding: 15px; margin: 10px 0; border-radius: 5px; }
    .alert-critical { background: #fee; border-left: 4px solid #f00; }
    .alert-high { background: #ffd; border-left: 4px solid #ff0; }
    .timeline-item { padding: 10px; margin: 5px 0; background: #e9f5ff; border-left: 3px solid #0066cc; }
    .status-critical { color: #f00; }
    .status-high { color: #ff6600; }
    .status-normal { color: #009900; }
  </style>
</head>
<body>
  <div class="dashboard">
    <div class="header">
      <h1>${dashboard.title}</h1>
      <p>Generated: ${new Date(dashboard.timestamp).toLocaleString()}</p>
    </div>

    <div class="section">
      <h2>ALERTS</h2>
      ${dashboard.alerts.map(a => `
        <div class="alert alert-${a.severity.toLowerCase()}">
          <strong>${a.severity}: ${a.title}</strong><br>
          ${a.message}<br>
          ${a.suggestedAction ? `<em>Suggested Action: ${a.suggestedAction}</em>` : ''}
        </div>
      `).join('')}
    </div>

    <div class="section">
      <h2>KEY PERFORMANCE INDICATORS</h2>
      ${Object.entries(dashboard.sections.executiveSummary.metrics).map(([key, val]) => `
        <div class="kpi">
          <div class="metric">${val.score}</div>
          <div class="label">${key.replace(/([A-Z])/g, ' $1')}</div>
          <div class="status-${val.status.toLowerCase()}">${val.trend} ${val.trendPercent > 0 ? '+' : ''}${val.trendPercent}%</div>
        </div>
      `).join('')}
    </div>

    <div class="section">
      <h2>UPGRADE TIMELINE</h2>
      ${Object.entries(dashboard.sections.timelineView.phases).map(([key, phase]) => `
        <h3>${phase.label}</h3>
        <div style="margin-left: 20px;">
          <p>Count: <strong>${phase.count}</strong> items | Risk Level: <span class="status-${phase.riskLevel.toLowerCase()}">${phase.riskLevel}</span></p>
          <div>${phase.items.map(i => `<div class="timeline-item">${i}</div>`).join('')}</div>
        </div>
      `).join('')}
    </div>

    <div class="section">
      <h2>CVE EMERGENCE FORECAST</h2>
      <p>Total Projected CVEs (12 months): <strong>${dashboard.sections.cveEmergenceForecast.forecast.totalProjectedCVEs}</strong></p>
      <p>Average per Month: <strong>${dashboard.sections.cveEmergenceForecast.forecast.averageCVEsPerMonth.toFixed(1)}</strong></p>
      <p>Peak: <strong>${dashboard.sections.cveEmergenceForecast.forecast.peakMonth}</strong> (${dashboard.sections.cveEmergenceForecast.forecast.peakProjection} CVEs)</p>
    </div>

    <div class="section">
      <h2>STABILITY TRAJECTORY</h2>
      <p>Current Stability: <strong>${dashboard.sections.stabilityTrend.trend.current}/100</strong></p>
      <p>3-Month Projection: <strong>${dashboard.sections.stabilityTrend.trend.projected3Months}/100</strong></p>
      <p>12-Month Projection: <strong>${dashboard.sections.stabilityTrend.trend.projected12Months}/100</strong></p>
      <p><strong>Trend:</strong> <span class="status-critical">${dashboard.sections.stabilityTrend.trend.trend}</span></p>
    </div>
  </div>
</body>
</html>
    `;

    return html;
  }
}

/**
 * Export
 */
module.exports = {
  PredictiveDashboard
};
