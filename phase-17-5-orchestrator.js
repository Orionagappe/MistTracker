/**
 * Phase 17.5-Alpha: Enterprise Software Lifecycle Orchestrator
 * 
 * Core orchestration engine for managing 1000+ software items
 * across enterprise with Phase 58/58.1 decision framework
 * 
 * Capabilities:
 * - Asset inventory management
 * - Batch Phase 58/58.1 analysis (parallel)
 * - Upgrade roadmap generation
 * - Risk aggregation
 * - Dependency resolution
 */

const EventEmitter = require('events');
const { Phase58OrchestrationEngine } = require('./phase-58-orchestration-engine');
const {
  DependencyLockManager,
  VulnerabilityActivationMonitor,
  FrictionScoreCalculator,
  SimulationRuntimeStabilityTracker,
  Phase58_1DecisionEngine
} = require('./phase-58-1-remediation-framework');

/**
 * Enterprise Asset: Individual software item in inventory
 */
class EnterpriseAsset {
  constructor(id, name, version, category, criticality, systems, owner) {
    this.id = id;
    this.name = name;
    this.version = version;
    this.category = category; // 'runtime', 'framework', 'library', 'tool', 'os'
    this.criticality = criticality; // 'critical', 'high', 'medium', 'low'
    this.systems = systems; // array of systems using this software
    this.owner = owner; // team/person responsible
    this.dependencies = []; // software that depends on this
    this.dependents = []; // software that this depends on
    this.phase58_1Decision = null;
    this.analysis = null;
    this.status = 'pending-analysis'; // pending, analyzed, scheduled, in-progress, complete, failed
    this.createdAt = new Date();
  }

  addDependency(softwareId) {
    if (!this.dependencies.includes(softwareId)) {
      this.dependencies.push(softwareId);
    }
  }

  addDependent(softwareId) {
    if (!this.dependents.includes(softwareId)) {
      this.dependents.push(softwareId);
    }
  }
}

/**
 * Enterprise Dependency Graph: Manages relationships between software
 */
class EnterpriseDependencyGraph {
  constructor() {
    this.graph = new Map(); // software -> dependencies
    this.reverseGraph = new Map(); // software -> dependents
    this.sortedOrder = []; // topological sort
  }

  /**
   * Add edge: A depends on B
   */
  addEdge(fromId, toId) {
    if (!this.graph.has(fromId)) this.graph.set(fromId, []);
    if (!this.graph.has(toId)) this.graph.set(toId, []);

    if (!this.graph.get(fromId).includes(toId)) {
      this.graph.get(fromId).push(toId);
    }

    if (!this.reverseGraph.has(toId)) this.reverseGraph.set(toId, []);
    if (!this.reverseGraph.get(toId).includes(fromId)) {
      this.reverseGraph.get(toId).push(fromId);
    }
  }

  /**
   * Get all dependencies recursively
   */
  getAllDependencies(id, visited = new Set()) {
    if (visited.has(id)) return [];
    visited.add(id);

    const direct = this.graph.get(id) || [];
    let all = [...direct];

    direct.forEach(dep => {
      all = [...all, ...this.getAllDependencies(dep, visited)];
    });

    return [...new Set(all)];
  }

  /**
   * Get all dependents recursively
   */
  getAllDependents(id, visited = new Set()) {
    if (visited.has(id)) return [];
    visited.add(id);

    const direct = this.reverseGraph.get(id) || [];
    let all = [...direct];

    direct.forEach(dep => {
      all = [...all, ...this.getAllDependents(dep, visited)];
    });

    return [...new Set(all)];
  }

  /**
   * Topological sort: order for safe upgrades
   */
  topologicalSort() {
    const visited = new Set();
    const stack = [];

    const visit = (id) => {
      if (visited.has(id)) return;
      visited.add(id);

      const dependents = this.reverseGraph.get(id) || [];
      dependents.forEach(dep => visit(dep));

      stack.push(id);
    };

    this.graph.forEach((_, id) => visit(id));

    this.sortedOrder = stack.reverse();
    return this.sortedOrder;
  }

  /**
   * Find critical path: software that must upgrade first
   */
  findCriticalPath() {
    const depths = new Map();

    const calculateDepth = (id, visited = new Set()) => {
      if (visited.has(id)) return 0;
      visited.add(id);

      const dependencies = this.graph.get(id) || [];
      if (dependencies.length === 0) return 1;

      const maxDepth = Math.max(...dependencies.map(dep => calculateDepth(dep, visited)));
      return maxDepth + 1;
    };

    this.graph.forEach((_, id) => {
      depths.set(id, calculateDepth(id));
    });

    return Array.from(depths.entries())
      .sort((a, b) => b[1] - a[1])
      .map(entry => entry[0]);
  }
}

/**
 * Phase17_5_Orchestrator: Main orchestration engine
 */
class Phase17_5_Orchestrator extends EventEmitter {
  constructor(phase17_4Platform = null) {
    super();

    this.phase17_4 = phase17_4Platform;

    // Asset management
    this.assets = new Map(); // id -> EnterpriseAsset
    this.assetsByName = new Map(); // name -> [assets]
    this.assetsBySystem = new Map(); // systemName -> [assets]

    // Dependency management
    this.dependencyGraph = new EnterpriseDependencyGraph();

    // Analysis results
    this.analysisResults = new Map(); // assetId -> analysisResult
    this.decisions = new Map(); // assetId -> decision

    // Phase 58/58.1 components (reused for all assets)
    this.phase58Engines = new Map(); // systemName -> Phase58OrchestrationEngine
    this.phase58_1Engines = new Map(); // systemName -> Phase58_1DecisionEngine

    // Statistics
    this.statistics = {
      totalAssets: 0,
      upgradeRecommended: 0,
      remediateRecommended: 0,
      watchRecommended: 0,
      enterpriseRiskScore: 0,
      totalCriticalItems: 0
    };

    this.setupListeners();
  }

  /**
   * Setup event listeners
   */
  setupListeners() {
    this.on('asset-added', (asset) => {
      console.log(`[Orchestrator] Asset added: ${asset.name} v${asset.version}`);
    });

    this.on('analysis-complete', (result) => {
      console.log(`[Orchestrator] Analysis complete: ${result.software}`);
    });

    this.on('roadmap-generated', (roadmap) => {
      console.log(`[Orchestrator] Roadmap generated (${roadmap.phases.length} phases)`);
    });
  }

  /**
   * Import assets from inventory (CSV format)
   */
  importAssets(assetList) {
    console.log(`\n[Orchestrator] Importing ${assetList.length} assets...`);

    assetList.forEach(assetData => {
      const asset = new EnterpriseAsset(
        assetData.id || `asset-${this.assets.size + 1}`,
        assetData.name,
        assetData.version,
        assetData.category || 'library',
        assetData.criticality || 'medium',
        assetData.systems || [],
        assetData.owner || 'unknown'
      );

      this.addAsset(asset);
    });

    console.log(`[Orchestrator] Imported ${this.assets.size} assets`);
    this.emit('inventory-imported', { count: this.assets.size });
  }

  /**
   * Add individual asset
   */
  addAsset(asset) {
    this.assets.set(asset.id, asset);

    if (!this.assetsByName.has(asset.name)) {
      this.assetsByName.set(asset.name, []);
    }
    this.assetsByName.get(asset.name).push(asset);

    asset.systems.forEach(system => {
      if (!this.assetsBySystem.has(system)) {
        this.assetsBySystem.set(system, []);
      }
      this.assetsBySystem.get(system).push(asset);
    });

    this.statistics.totalAssets = this.assets.size;
    this.emit('asset-added', asset);
  }

  /**
   * Define dependencies between assets
   */
  addDependency(fromId, toId) {
    const fromAsset = this.assets.get(fromId);
    const toAsset = this.assets.get(toId);

    if (!fromAsset || !toAsset) {
      console.warn(`[Orchestrator] Dependency missing asset: ${fromId} -> ${toId}`);
      return;
    }

    fromAsset.addDependency(toId);
    toAsset.addDependent(fromId);
    this.dependencyGraph.addEdge(fromId, toId);
  }

  /**
   * Initialize Phase 58/58.1 engines for each system
   */
  initializeAnalysisEngines() {
    console.log('\n[Orchestrator] Initializing Phase 58/58.1 analysis engines...');

    const systems = new Set();
    this.assets.forEach(asset => {
      asset.systems.forEach(sys => systems.add(sys));
    });

    systems.forEach(system => {
      const phase58Engine = new Phase58OrchestrationEngine(this.phase17_4);
      this.phase58Engines.set(system, phase58Engine);
      console.log(`  ✓ Phase 58 engine for ${system}`);
    });

    console.log(`[Orchestrator] ${this.phase58Engines.size} analysis engines ready`);
  }

  /**
   * Perform batch Phase 58/58.1 analysis on all assets (parallel)
   */
  async performBatchAnalysis(parallel = 10) {
    console.log(`\n[Orchestrator] Starting batch analysis (${this.assets.size} assets, ${parallel} parallel)...`);

    const assetArray = Array.from(this.assets.values());
    const startTime = Date.now();

    // Process in batches for parallelism
    for (let i = 0; i < assetArray.length; i += parallel) {
      const batch = assetArray.slice(i, Math.min(i + parallel, assetArray.length));

      const promises = batch.map(asset => this.analyzeAsset(asset));
      await Promise.all(promises);

      const progress = Math.min(i + parallel, assetArray.length);
      console.log(`  [${progress}/${assetArray.length}] assets analyzed`);
    }

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`[Orchestrator] Batch analysis complete (${duration}s)`);

    this.emit('batch-analysis-complete', {
      assetsAnalyzed: assetArray.length,
      durationSeconds: parseFloat(duration),
      results: {
        upgrade: this.statistics.upgradeRecommended,
        remediate: this.statistics.remediateRecommended,
        watch: this.statistics.watchRecommendation
      }
    });
  }

  /**
   * Analyze individual asset using Phase 58/58.1
   */
  async analyzeAsset(asset) {
    return new Promise((resolve) => {
      try {
        // Simulate Phase 58/58.1 analysis
        const analysis = {
          software: asset.name,
          currentVersion: asset.version,
          targetVersion: this.getTargetVersion(asset.name, asset.version),
          cveCount: Math.floor(Math.random() * 15),
          cveActivated: Math.floor(Math.random() * 3),
          friction: Math.floor(Math.random() * 100),
          stability: 75 + Math.floor(Math.random() * 25),
          daysUntilEOL: Math.floor(Math.random() * 365 * 3) - 180
        };

        // Phase 58.1 decision logic (simplified)
        let decision = 'watch';
        if (analysis.cveActivated > 2 || analysis.daysUntilEOL < 0) {
          decision = 'upgrade';
        } else if (analysis.friction < 40 && analysis.daysUntilEOL < 180) {
          decision = 'upgrade';
        } else if (analysis.friction > 60 && analysis.stability > 85 && analysis.cveCount < 5) {
          decision = 'remediate';
        }

        asset.analysis = analysis;
        asset.phase58_1Decision = decision;
        asset.status = 'analyzed';

        this.analysisResults.set(asset.id, analysis);
        this.decisions.set(asset.id, decision);

        // Update statistics
        if (decision === 'upgrade') this.statistics.upgradeRecommended++;
        else if (decision === 'remediate') this.statistics.remediateRecommended++;
        else if (decision === 'watch') this.statistics.watchRecommendation++;

        if (asset.criticality === 'critical') this.statistics.totalCriticalItems++;

        this.emit('analysis-complete', { asset, analysis, decision });
        resolve({ asset, analysis, decision });
      } catch (error) {
        console.error(`[Orchestrator] Analysis failed for ${asset.name}:`, error);
        resolve({ asset, error });
      }
    });
  }

  /**
   * Get target version for software
   */
  getTargetVersion(softwareName, currentVersion) {
    // Simplified version mapping
    const versionMap = {
      'Node.js': { '16': '20', '18': '20', '20': '20' },
      'Python': { '3.8': '3.12', '3.10': '3.12', '3.11': '3.12', '3.12': '3.12' },
      'Java': { '8': '21', '11': '21', '17': '21', '21': '21' },
      'axios': { '1.6.5': '1.17.2', '1.15.0': '1.17.2' },
      'express': { '4.17': '5.0', '4.18': '5.0', '5.0': '5.0' }
    };

    if (versionMap[softwareName]) {
      return versionMap[softwareName][currentVersion] || '1.0.0';
    }
    return '1.0.0';
  }

  /**
   * Calculate enterprise risk score
   */
  calculateEnterpriseRiskScore() {
    if (this.assets.size === 0) return 0;

    let totalRisk = 0;

    this.assets.forEach(asset => {
      if (!asset.analysis) return;

      const analysis = asset.analysis;

      // Risk factors
      let assetRisk = 0;

      // Factor 1: CVE activation (immediate risk)
      assetRisk += analysis.cveActivated * 20;

      // Factor 2: EOL proximity
      if (analysis.daysUntilEOL < 0) assetRisk += 30; // Past EOL
      else if (analysis.daysUntilEOL < 90) assetRisk += 20;
      else if (analysis.daysUntilEOL < 180) assetRisk += 10;

      // Factor 3: Criticality multiplier
      if (asset.criticality === 'critical') assetRisk *= 3;
      else if (asset.criticality === 'high') assetRisk *= 2;

      // Factor 4: System count (more systems = more risk)
      assetRisk += asset.systems.length * 2;

      totalRisk += Math.min(100, assetRisk); // Cap at 100 per asset
    });

    const avgRisk = totalRisk / this.assets.size;
    this.statistics.enterpriseRiskScore = Math.round(avgRisk);

    return this.statistics.enterpriseRiskScore;
  }

  /**
   * Generate upgrade roadmap
   */
  generateUpgradeRoadmap(weeksToComplete = 12) {
    console.log(`\n[Orchestrator] Generating upgrade roadmap (${weeksToComplete} weeks)...`);

    const roadmap = {
      generatedAt: new Date(),
      totalWeeks: weeksToComplete,
      phases: [],
      schedule: {},
      estimatedCosts: {
        labor: 0,
        downtime: 0,
        testing: 0,
        total: 0
      }
    };

    // Topological sort: dependencies first
    const sortedIds = this.dependencyGraph.topologicalSort();

    // Categorize by decision
    const upgrades = Array.from(this.assets.values())
      .filter(a => this.decisions.get(a.id) === 'upgrade')
      .sort((a, b) => {
        // Critical first, then higher CVE count
        if (a.criticality !== b.criticality) {
          const critOrder = { critical: 0, high: 1, medium: 2, low: 3 };
          return critOrder[a.criticality] - critOrder[b.criticality];
        }
        return (b.analysis?.cveActivated || 0) - (a.analysis?.cveActivated || 0);
      });

    const remediates = Array.from(this.assets.values())
      .filter(a => this.decisions.get(a.id) === 'remediate');

    // Distribute upgrades across phases
    const upgradesPerWeek = Math.ceil(upgrades.length / weeksToComplete);
    let weekCounter = 1;
    let weekAssets = [];

    upgrades.forEach((asset, index) => {
      weekAssets.push(asset);

      if (weekAssets.length >= upgradesPerWeek || index === upgrades.length - 1) {
        const phase = {
          number: weekCounter,
          week: weekCounter,
          assets: weekAssets.map(a => ({
            id: a.id,
            name: a.name,
            version: a.version,
            targetVersion: a.analysis.targetVersion,
            criticality: a.criticality,
            friction: a.analysis.friction,
            systems: a.systems
          })),
          estimatedHours: weekAssets.reduce((sum, a) => sum + (a.analysis.friction / 10), 0),
          estimatedDowntime: weekAssets.filter(a => a.systems.length > 1).length * 0.5,
          priority: weekCounter === 1 ? 'critical' : 'normal'
        };

        roadmap.phases.push(phase);
        roadmap.schedule[`Week ${weekCounter}`] = phase.assets.map(a => a.name);

        roadmap.estimatedCosts.labor += phase.estimatedHours * 150;
        roadmap.estimatedCosts.downtime += phase.estimatedDowntime * 5000;
        roadmap.estimatedCosts.testing += phase.estimatedHours * 1.5 * 150;

        weekAssets = [];
        weekCounter++;
      }
    });

    // Add remediation phase
    if (remediates.length > 0) {
      roadmap.phases.push({
        number: weekCounter,
        type: 'remediation',
        assets: remediates.map(a => ({
          id: a.id,
          name: a.name,
          version: a.version,
          criticality: a.criticality,
          strategy: 'lock-and-monitor'
        })),
        estimatedHours: remediates.length * 2,
        estimatedCost: remediates.length * 300
      });
    }

    roadmap.estimatedCosts.total = Math.round(
      roadmap.estimatedCosts.labor +
      roadmap.estimatedCosts.downtime +
      roadmap.estimatedCosts.testing
    );

    console.log(`[Orchestrator] Roadmap generated:`);
    console.log(`  Phases: ${roadmap.phases.length}`);
    console.log(`  Upgrades: ${upgrades.length}`);
    console.log(`  Remediations: ${remediates.length}`);
    console.log(`  Est. Cost: $${roadmap.estimatedCosts.total}`);

    this.emit('roadmap-generated', roadmap);
    return roadmap;
  }

  /**
   * Get comprehensive orchestration status
   */
  getStatus() {
    return {
      timestamp: new Date().toISOString(),
      assets: {
        total: this.statistics.totalAssets,
        analyzed: this.analysisResults.size,
        pending: this.statistics.totalAssets - this.analysisResults.size
      },
      decisions: {
        upgrade: this.statistics.upgradeRecommended,
        remediate: this.statistics.remediateRecommended,
        watch: this.statistics.watchRecommendation
      },
      risk: {
        enterpriseScore: this.statistics.enterpriseRiskScore,
        critical: this.statistics.totalCriticalItems,
        assessment: this.getEnterpriseRiskAssessment()
      },
      systems: this.assetsBySystem.size,
      dependencies: this.dependencyGraph.graph.size
    };
  }

  /**
   * Get enterprise risk assessment narrative
   */
  getEnterpriseRiskAssessment() {
    const score = this.statistics.enterpriseRiskScore;

    if (score >= 80) return 'CRITICAL - Immediate action required';
    if (score >= 60) return 'HIGH - Plan upgrades urgently';
    if (score >= 40) return 'MEDIUM - Prioritize critical systems';
    if (score >= 20) return 'LOW - Monitor and plan strategically';
    return 'VERY LOW - Maintain current strategy';
  }

  /**
   * Generate summary report
   */
  generateSummaryReport() {
    const report = {
      generatedAt: new Date().toISOString(),
      enterprise: {
        totalSoftware: this.statistics.totalAssets,
        systems: this.assetsBySystem.size
      },
      recommendations: {
        upgrade: {
          count: this.statistics.upgradeRecommended,
          percentage: ((this.statistics.upgradeRecommended / this.statistics.totalAssets) * 100).toFixed(1),
          reason: 'Active CVE or critical vulnerability'
        },
        remediate: {
          count: this.statistics.remediateRecommended,
          percentage: ((this.statistics.remediateRecommended / this.statistics.totalAssets) * 100).toFixed(1),
          reason: 'Stable with monitoring'
        },
        watch: {
          count: this.statistics.watchRecommendation,
          percentage: ((this.statistics.watchRecommendation / this.statistics.totalAssets) * 100).toFixed(1),
          reason: 'Monitor for changes'
        }
      },
      riskProfile: {
        score: this.statistics.enterpriseRiskScore,
        assessment: this.getEnterpriseRiskAssessment(),
        criticalItems: this.statistics.totalCriticalItems
      },
      dependencies: {
        total: this.dependencyGraph.graph.size,
        criticalPath: this.dependencyGraph.findCriticalPath().slice(0, 5)
      }
    };

    return report;
  }

  /**
   * Export orchestration data
   */
  exportAsJSON() {
    const data = {
      assets: Array.from(this.assets.values()).map(asset => ({
        id: asset.id,
        name: asset.name,
        version: asset.version,
        category: asset.category,
        criticality: asset.criticality,
        systems: asset.systems,
        owner: asset.owner,
        decision: this.decisions.get(asset.id),
        analysis: this.analysisResults.get(asset.id)
      })),
      status: this.getStatus(),
      summary: this.generateSummaryReport(),
      dependencies: {
        graph: Array.from(this.dependencyGraph.graph.entries())
      }
    };

    return data;
  }
}

/**
 * Export
 */
module.exports = {
  Phase17_5_Orchestrator,
  EnterpriseAsset,
  EnterpriseDependencyGraph
};
