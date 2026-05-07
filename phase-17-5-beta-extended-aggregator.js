/**
 * Phase 17.5-Beta: Extended Aggregator (with Network Devices)
 * 
 * Extends PredictionAggregator to include network infrastructure
 * Combines software + hardware + network predictions
 */

const { PredictionAggregator } = require('./phase-17-5-beta-aggregator');
const { NetworkDevicePredictor } = require('./phase-17-5-beta-network-predictor');

/**
 * ExtendedPredictionAggregator: Software + Network Infrastructure
 */
class ExtendedPredictionAggregator {
  constructor() {
    this.softwareAggregator = new PredictionAggregator();
    this.networkPredictor = new NetworkDevicePredictor();

    this.aggregatedPredictions = new Map();
  }

  /**
   * Generate unified recommendation (software + network)
   */
  generateUnifiedRecommendation(asset) {
    const key = `${asset.name}@${asset.version || asset.model}`;

    // Software recommendation
    let softwareRec = null;
    if (asset.version) {  // Software asset
      softwareRec = this.softwareAggregator.generateUpgradeRecommendation(asset);
    }

    // Network recommendation
    let networkRec = null;
    if (asset.type && ['router', 'modem', 'switch', 'wifiap', 'moca'].includes(asset.type)) {
      networkRec = this.networkPredictor.predictDeviceHealth(asset);
    }

    const recommendation = {
      asset: asset.name,
      assetType: asset.type || asset.category,

      ...(softwareRec && { software: softwareRec }),
      ...(networkRec && { network: networkRec }),

      unified: this.synthesizeUnifiedRecommendation(softwareRec, networkRec),
      priority: this.calculateUnifiedPriority(softwareRec, networkRec),
      actionItems: this.generateActionItems(softwareRec, networkRec)
    };

    return recommendation;
  }

  /**
   * Synthesize unified recommendation from software + network
   */
  synthesizeUnifiedRecommendation(softwareRec, networkRec) {
    if (!softwareRec && !networkRec) {
      return { decision: 'UNKNOWN', confidence: 0 };
    }

    if (softwareRec && !networkRec) {
      return {
        decision: softwareRec.recommendation.decision,
        confidence: softwareRec.confidence
      };
    }

    if (networkRec && !softwareRec) {
      return {
        decision: networkRec.urgency === 'IMMEDIATE' ? 'REPLACE_IMMEDIATELY'
                : networkRec.urgency === 'URGENT' ? 'REPLACE_URGENT'
                : networkRec.urgency === 'PLANNED' ? 'PLAN_REPLACEMENT'
                : 'MONITOR',
        confidence: 75
      };
    }

    // Both exist - combine
    const softwareUrgency = softwareRec.urgency;
    const networkUrgency = networkRec.urgency;

    // Escalate if either is critical
    let combinedDecision = softwareRec.recommendation.decision;
    if (networkRec.health.score > 70) {
      combinedDecision = networkUrgency === 'IMMEDIATE' ? 'URGENT_ACTION_REQUIRED'
                       : networkUrgency === 'URGENT' ? 'ACCELERATE_UPGRADE'
                       : 'MONITOR_HEALTH';
    }

    return {
      decision: combinedDecision,
      reason: `Software: ${softwareRec.urgency}/100, Network: ${networkRec.health.score}/100`,
      confidence: (softwareRec.confidence + 75) / 2
    };
  }

  /**
   * Calculate unified priority
   */
  calculateUnifiedPriority(softwareRec, networkRec) {
    let priority = 5;  // Default middle

    if (softwareRec) {
      priority += softwareRec.urgency / 20;  // Max +5 points
    }

    if (networkRec) {
      priority += networkRec.health.score / 20;  // Max +5 points
    }

    return Math.max(1, Math.min(10, Math.round(priority)));
  }

  /**
   * Generate action items
   */
  generateActionItems(softwareRec, networkRec) {
    const actions = [];

    if (softwareRec?.recommendedTiming) {
      actions.push({
        category: 'SOFTWARE',
        timeframe: softwareRec.recommendedTiming.recommendation,
        actions: [
          `Upgrade ${softwareRec.predictions.friction.software} (${softwareRec.predictions.friction.frictionScore} friction)`,
          `Estimated effort: ${softwareRec.predictions.friction.estimatedEffort.totalHours} hours`
        ]
      });
    }

    if (networkRec?.replacement?.recommended) {
      actions.push({
        category: 'NETWORK',
        timeframe: 'PLANNED',
        actions: networkRec.replacement.reasons.map(r => `• ${r}`),
        cost: networkRec.replacement.estimatedCost
      });
    }

    if (networkRec?.recommendation) {
      networkRec.recommendation.forEach(rec => {
        actions.push({
          category: 'NETWORK_MAINTENANCE',
          priority: rec.priority,
          action: rec.action,
          reasoning: rec.reasoning
        });
      });
    }

    return actions;
  }

  /**
   * Aggregate portfolio with network devices
   */
  aggregateExtendedPortfolio(softwareAssets, networkDevices) {
    console.log(`\n[ExtendedAggregator] Analyzing ${softwareAssets.length} software + ${networkDevices.length} network devices...`);

    const aggregated = {
      timestamp: new Date(),
      software: this.softwareAggregator.aggregatePortfolioRecommendations(softwareAssets),
      network: this.networkPredictor.analyzeMeshTopology(networkDevices),

      unified: {
        criticalItems: [],
        dependencyMap: this.buildDependencyMap(softwareAssets, networkDevices),
        timeline: this.generateUnifiedTimeline(softwareAssets, networkDevices),
        resourcePlan: this.planResources(softwareAssets, networkDevices)
      },

      recommendations: this.synthesizePortfolioRecommendations(
        softwareAssets,
        networkDevices
      )
    };

    console.log(`[ExtendedAggregator] Analysis complete:`);
    console.log(`  Software items: ${softwareAssets.length}`);
    console.log(`  Network devices: ${networkDevices.length}`);
    console.log(`  Critical issues: ${aggregated.unified.criticalItems.length}`);

    return aggregated;
  }

  /**
   * Build dependency map (software ↔ network)
   */
  buildDependencyMap(softwareAssets, networkDevices) {
    const map = {
      softwareOnNetwork: [],
      networkDependencies: [],
      criticalPaths: []
    };

    // Critical applications depend on specific network paths
    const criticalSoftware = softwareAssets.filter(a => a.criticality === 'critical');
    criticalSoftware.forEach(software => {
      // Assume critical software depends on:
      // 1. At least one router
      // 2. At least one modem (for WAN)
      // 3. May have affinity to specific WiFi AP or switch
      map.softwareOnNetwork.push({
        software: software.name,
        requiredNetwork: ['router', 'modem'],
        preferredLocation: software.location || 'primary'
      });
    });

    // Network device redundancy
    const devicesByType = {};
    networkDevices.forEach(device => {
      if (!devicesByType[device.type]) devicesByType[device.type] = [];
      devicesByType[device.type].push(device);
    });

    Object.entries(devicesByType).forEach(([type, devices]) => {
      if (devices.length === 1) {
        map.networkDependencies.push({
          type,
          status: 'SINGLE_POINT_OF_FAILURE',
          devices: devices.map(d => d.name),
          impact: 'HIGH'
        });
      }
    });

    // Identify critical paths
    const modems = networkDevices.filter(d => d.type === 'modem' && d.criticality === 'CRITICAL');
    const routers = networkDevices.filter(d => d.type === 'router' && d.criticality === 'CRITICAL');

    if (modems.length > 0 && routers.length > 0) {
      map.criticalPaths.push({
        path: `WAN (${modems.map(m => m.name).join(',')}) → Router (${routers.map(r => r.name).join(',')})`
      });
    }

    return map;
  }

  /**
   * Generate unified timeline
   */
  generateUnifiedTimeline(softwareAssets, networkDevices) {
    const timeline = {
      immediate: [],
      week1_2: [],
      week2_4: [],
      month2_3: [],
      deferred: []
    };

    // Software actions
    this.softwareAggregator.aggregatePortfolioRecommendations(softwareAssets)
      .timeline.immediate.forEach(item => {
        timeline.immediate.push({ type: 'SOFTWARE', name: item });
      });

    // Network actions
    networkDevices.forEach(device => {
      const health = this.networkPredictor.predictDeviceHealth(device);
      const urgency = health.urgency;

      if (urgency === 'IMMEDIATE') {
        timeline.immediate.push({ type: 'NETWORK', name: device.name, action: 'REPLACE' });
      } else if (urgency === 'URGENT') {
        timeline.week1_2.push({ type: 'NETWORK', name: device.name, action: 'PLAN_REPLACEMENT' });
      } else if (urgency === 'PLANNED') {
        timeline.week2_4.push({ type: 'NETWORK', name: device.name, action: 'SCHEDULE' });
      }
    });

    return timeline;
  }

  /**
   * Plan resources
   */
  planResources(softwareAssets, networkDevices) {
    let estimatedDevHours = 0, estimatedQAHours = 0, estimatedDeployHours = 0;
    let networkReplacementCount = 0, networkReplacementCost = 0;

    // Software effort
    this.softwareAggregator.aggregatePortfolioRecommendations(softwareAssets)
      .decisionBreakdown['UPGRADE_IMMEDIATELY']?.forEach(item => {
        estimatedDevHours += 16;
        estimatedQAHours += 12;
        estimatedDeployHours += 4;
      });

    // Network effort
    networkDevices.forEach(device => {
      const health = this.networkPredictor.predictDeviceHealth(device);
      if (health.replacement.recommended) {
        networkReplacementCount++;
        networkReplacementCost += health.replacement.estimatedCost;
      }
    });

    return {
      software: {
        estimatedDevHours,
        estimatedQAHours,
        estimatedDeployHours,
        totalHours: estimatedDevHours + estimatedQAHours + estimatedDeployHours
      },
      network: {
        replacementsNeeded: networkReplacementCount,
        estimatedCost: networkReplacementCost,
        installationHours: networkReplacementCount * 2  // 2 hours per device
      },
      combined: {
        totalStaffHours: estimatedDevHours + estimatedQAHours + estimatedDeployHours + (networkReplacementCount * 2),
        totalCost: networkReplacementCost,
        duration: 'Staggered over 4-6 weeks'
      }
    };
  }

  /**
   * Synthesize portfolio recommendations
   */
  synthesizePortfolioRecommendations(softwareAssets, networkDevices) {
    const recommendations = {
      immediate: [],
      urgent: [],
      planned: [],
      deferred: []
    };

    // Analyze software
    const softwareAgg = this.softwareAggregator.aggregatePortfolioRecommendations(softwareAssets);
    Object.entries(softwareAgg.decisionBreakdown).forEach(([decision, items]) => {
      items.forEach(item => {
        if (decision.includes('IMMEDIATE')) {
          recommendations.immediate.push({
            asset: item.software,
            type: 'SOFTWARE',
            action: 'UPGRADE',
            confidence: item.confidence
          });
        } else if (decision.includes('URGENT')) {
          recommendations.urgent.push({
            asset: item.software,
            type: 'SOFTWARE',
            action: 'UPGRADE'
          });
        }
      });
    });

    // Analyze network
    networkDevices.forEach(device => {
      const health = this.networkPredictor.predictDeviceHealth(device);
      if (health.urgency === 'IMMEDIATE') {
        recommendations.immediate.push({
          asset: device.name,
          type: 'NETWORK',
          action: 'REPLACE',
          reason: health.health.level,
          health: health.health.score
        });
      } else if (health.urgency === 'URGENT') {
        recommendations.urgent.push({
          asset: device.name,
          type: 'NETWORK',
          action: 'PLAN_REPLACEMENT'
        });
      }
    });

    return recommendations;
  }
}

/**
 * Export
 */
module.exports = {
  ExtendedPredictionAggregator
};
