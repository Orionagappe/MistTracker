# Phase 17.5-Alpha Implementation Guide

## Quick Start: Deploy Phase 17.5-Alpha to MistTracker

### Step 1: Verify Installation

Ensure all Phase 17.5-Alpha modules are in place:

```bash
# Required files
ls -l phase-17-5-orchestrator.js
ls -l phase-17-5-inventory-manager.js
ls -l phase-17-5-roadmap-generator.js
ls -l phase-17-5-risk-aggregation.js
ls -l phase-17-5-dashboard.js
ls -l phase-17-5-integration-test.js

# Should also have:
# - phase-58-orchestration-engine.js (from Phase 58)
# - phase-58-1-remediation-framework.js (from Phase 58.1)
```

### Step 2: Initialize Orchestrator

```javascript
const { Phase17_5_Orchestrator } = require('./phase-17-5-orchestrator');
const { AssetInventoryManager } = require('./phase-17-5-inventory-manager');
const { RiskAggregationEngine } = require('./phase-17-5-risk-aggregation');
const { UpgradeRoadmapGenerator } = require('./phase-17-5-roadmap-generator');
const { OrchestrationDashboard } = require('./phase-17-5-dashboard');

// Initialize
const orchestrator = new Phase17_5_Orchestrator();
const inventoryMgr = new AssetInventoryManager(orchestrator);
const riskEngine = new RiskAggregationEngine(orchestrator);
const roadmapGen = new UpgradeRoadmapGenerator(orchestrator);
const dashboard = new OrchestrationDashboard(orchestrator, riskEngine);
```

### Step 3: Import Software Inventory

**Option A: From CSV**
```csv
name,version,category,criticality,systems,owner
Node.js,18.15.0,runtime,critical,Backend-Primary;Backend-Secondary,Platform Team
Express.js,4.18.2,framework,critical,Backend-Primary,Backend Team
axios,1.15.0,library,high,Backend-Primary,Integration Team
PostgreSQL,14.5,database,critical,Data-Primary,DBA Team
```

```javascript
// Import
const assets = inventoryMgr.importFromCSV('inventory.csv');
orchestrator.importAssets(assets);

// Analyze composition
const composition = inventoryMgr.analyzeComposition(assets);
console.log(`Loaded ${composition.totalAssets} software items`);
```

**Option B: From Database**
```javascript
const assets = [
  {
    name: 'Node.js',
    version: '18.15.0',
    category: 'runtime',
    criticality: 'critical',
    systems: ['Backend-Primary', 'Backend-Secondary'],
    owner: 'Platform Team'
  },
  // ... more assets
];

orchestrator.importAssets(assets);
```

### Step 4: Define Dependencies

```javascript
// Tell orchestrator what depends on what
orchestrator.addDependency('Express.js', 'Node.js');
orchestrator.addDependency('axios', 'Express.js');
orchestrator.addDependency('React', 'axios');
orchestrator.addDependency('Database', 'PostgreSQL');

// Generates topological sort automatically
const sortedOrder = orchestrator.dependencyGraph.topologicalSort();
console.log(`Safe upgrade order:`, sortedOrder);
```

### Step 5: Run Analysis

```javascript
// Initialize Phase 58/58.1 engines
orchestrator.initializeAnalysisEngines();

// Run batch analysis (parallel)
await orchestrator.performBatchAnalysis(10); // 10 parallel
// Result: Each asset gets Phase 58/58.1 analysis

// Check results
console.log(`Analyzed: ${orchestrator.analysisResults.size}`);
console.log(`Upgrade: ${orchestrator.statistics.upgradeRecommended}`);
console.log(`Remediate: ${orchestrator.statistics.remediateRecommended}`);
```

### Step 6: Calculate Risk

```javascript
// Enterprise risk score
orchestrator.calculateEnterpriseRiskScore();
console.log(`Risk: ${orchestrator.statistics.enterpriseRiskScore}/100`);

// Detailed risk analysis
const riskSummary = riskEngine.generateRiskSummary();
console.log(`Risk Level: ${riskSummary.enterpriseRisk.overall.level}`);
console.log(`Top Risk: ${riskSummary.enterpriseRisk.overall.topRisks[0].asset}`);

// Identify hotspots
const hotspots = riskEngine.identifyHotspots();
console.log(`Past EOL: ${hotspots.pastEOL.length}`);
console.log(`Active CVEs: ${hotspots.criticalCVEs.length}`);
```

### Step 7: Generate Roadmap

```javascript
// Create 12-week upgrade roadmap
const roadmap = roadmapGen.generateRoadmap({
  weeksToComplete: 12,
  upgradesPerWeek: 5,
  maxSystemDowntimePerWeek: 4,
  maxTeamHoursPerWeek: 40
});

// View roadmap
console.log(`Phases: ${roadmap.phases.length}`);
console.log(`Estimated Cost: $${roadmap.summary.estimatedCost}`);
console.log(`Estimated Hours: ${roadmap.summary.estimatedHours}`);
console.log(`Estimated Downtime: ${roadmap.summary.estimatedDowntime}h`);

// Export as report
const report = roadmapGen.exportRoadmapReport(roadmap, 'text');
console.log(report);
```

### Step 8: Build Dashboard

```javascript
// Generate complete dashboard
const dashboardData = dashboard.buildDashboard();

// Export options
const jsonDash = dashboard.exportAsJSON();
fs.writeFileSync('dashboard.json', JSON.stringify(jsonDash, null, 2));

const htmlDash = dashboard.exportAsHTML();
fs.writeFileSync('dashboard.html', htmlDash);

// View key metrics
console.log(`Executive Risk: ${dashboardData.executiveOverview.keyMetrics.enterpriseRiskScore}`);
console.log(`System Health: ${dashboardData.systemHealth.overallHealth}/100`);
```

### Step 9: Run Integration Test

```javascript
const { Phase17_5_IntegrationTest } = require('./phase-17-5-integration-test');

const test = new Phase17_5_IntegrationTest();
const results = await test.runCompleteTest();

// Test output includes:
// - Inventory summary
// - Decision analysis
// - Risk assessment
// - Roadmap generation
// - Dashboard metrics
```

---

## Common Workflows

### Workflow 1: Quick Risk Assessment

```javascript
// Just need risk?
const assets = inventoryMgr.importFromCSV('inventory.csv');
orchestrator.importAssets(assets);
orchestrator.initializeAnalysisEngines();
await orchestrator.performBatchAnalysis(10);

const riskSummary = riskEngine.generateRiskSummary();
console.log(`Enterprise Risk: ${riskSummary.enterpriseRisk.overall.score}/100`);

// Takes < 2 minutes for 1000 assets
```

### Workflow 2: Executive Report

```javascript
// Generate executive summary
const orchestrator = new Phase17_5_Orchestrator();
// ... import and analyze ...

const dashboard = new OrchestrationDashboard(orchestrator, riskEngine);
dashboard.buildDashboard();

const html = dashboard.exportAsHTML();
// Open in browser for visual dashboard
```

### Workflow 3: Detailed Roadmap Planning

```javascript
// Full roadmap with risk mitigation
orchestrator.importAssets(assets);
await orchestrator.performBatchAnalysis(10);

const roadmap = roadmapGen.generateRoadmap({
  weeksToComplete: 12,
  upgradesPerWeek: 3, // Conservative
  maxSystemDowntimePerWeek: 2,
  maxTeamHoursPerWeek: 30
});

// Review risks
console.log('Identified Risks:');
Object.entries(roadmap.risks).forEach(([level, risks]) => {
  risks.forEach(r => console.log(`  ${level}: ${r.risk}`));
});

// Review recommendations
roadmap.recommendations.forEach(r => {
  console.log(`[${r.priority}] ${r.recommendation}: ${r.action}`);
});

// Export detailed report
const report = roadmapGen.exportRoadmapReport(roadmap, 'text');
console.log(report);
```

### Workflow 4: System Health Check

```javascript
// Focus on specific systems
const systemRisk = riskEngine.calculateSystemRisk();

Array.from(systemRisk.entries()).forEach(([system, risk]) => {
  console.log(`\n${system}: Health ${100 - risk.avgRisk}/100`);
  risk.assets.slice(0, 3).forEach(asset => {
    console.log(`  - ${asset.name} (Risk: ${asset.risk})`);
  });
});
```

---

## API Reference

### Phase17_5_Orchestrator

```javascript
// Asset Management
orchestrator.importAssets(assetList)
orchestrator.addAsset(asset)
orchestrator.addDependency(fromId, toId)

// Analysis
orchestrator.initializeAnalysisEngines()
await orchestrator.performBatchAnalysis(parallelCount)
orchestrator.calculateEnterpriseRiskScore()

// Roadmapping
orchestrator.generateUpgradeRoadmap(weeks)

// Querying
orchestrator.getStatus()
orchestrator.generateSummaryReport()
orchestrator.exportAsJSON()
```

### AssetInventoryManager

```javascript
manager.importFromCSV(filePath)
manager.importFromJSON(filePath)
manager.importFromAPI(endpoint)
manager.validateAsset(asset)
manager.detectDuplicates(assets)
manager.mergeDuplicates(assets)
manager.enrichAssets(assets)
manager.analyzeComposition(assets)
manager.exportInventory(format)
```

### RiskAggregationEngine

```javascript
engine.calculateAssetRisk(asset)
engine.calculateCriticalityRisk()
engine.calculateSystemRisk()
engine.calculateCategoryRisk()
engine.calculateDecisionRisk()
engine.calculateEnterpriseRisk()
engine.identifyHotspots()
engine.generateRiskSummary()
engine.exportRiskProfile(format)
```

### UpgradeRoadmapGenerator

```javascript
generator.generateRoadmap(options)
generator.prioritizeUpgrades(assets)
generator.generateTimeline(phases)
generator.assessRoadmapRisks(phases)
generator.generateRecommendations(phases)
generator.exportRoadmapReport(roadmap, format)
```

### OrchestrationDashboard

```javascript
dashboard.buildDashboard()
dashboard.buildExecutiveOverview()
dashboard.buildRiskDashboard()
dashboard.buildInventoryDashboard()
dashboard.buildDecisionDashboard()
dashboard.buildSystemHealth()
dashboard.buildRoadmapProgress()
dashboard.buildAlerts()
dashboard.exportAsHTML()
dashboard.exportAsJSON()
```

---

## Troubleshooting

### Issue: "Insufficient assets analyzed"
**Cause:** Analysis didn't complete  
**Solution:** Check for errors in Phase 58/58.1, verify asset structure

### Issue: "Roadmap too aggressive"
**Cause:** Default parameters too ambitious  
**Solution:** Reduce `upgradesPerWeek` and `maxTeamHoursPerWeek`

### Issue: "Risk score seems high"
**Cause:** Many EOL or CVE assets  
**Solution:** This is expected! Indicates immediate action needed

### Issue: "Dependency order impossible"
**Cause:** Circular dependencies  
**Solution:** Review dependency definitions, break cycles

---

## Performance Tuning

**For 1000+ assets:**
```javascript
// Increase parallelism
await orchestrator.performBatchAnalysis(20); // vs default 10

// Reduce analysis frequency
const analysisInterval = 24 * 60 * 60 * 1000; // 24 hours
```

**For real-time dashboards:**
```javascript
// Cache results
const cachedDashboard = dashboard.dashboardMetrics;
// Refresh every 1 hour instead of every request
```

**For large roadmaps:**
```javascript
// Generate in phases
const phase1Roadmap = roadmapGen.generateRoadmap({ weeksToComplete: 4 });
const phase2Roadmap = roadmapGen.generateRoadmap({ weeksToComplete: 8 });
// Combine later
```

---

## Integration with Phase 17.4

Phase 17.5-Alpha integrates with Phase 17.4 (dashboards, alerts, workflows):

```javascript
const phase17_4Platform = getPhase17_4Instance();
const orchestrator = new Phase17_5_Orchestrator(phase17_4Platform);

// Orchestrator automatically:
// - Registers dashboards with Phase 17.4
// - Creates alert rules for critical assets
// - Publishes workflow events
// - Stores decisions in shared database
```

---

## Next Phase: 17.5-Beta

After Alpha validation on MistTracker:
- Predictive analytics for CVE forecasting
- Automated change management integration
- Real upgrade execution and tracking
- Cost optimization analysis
- Emergence/chaos monitoring

---

## Support & Questions

For Phase 17.5-Alpha support:
1. Check integration test results
2. Review PHASE-17-5-ALPHA-COMPLETE.md documentation
3. Validate asset inventory format
4. Check Phase 58/58.1 analysis output
5. Review risk aggregation calculations

---

**Status:** ✅ Phase 17.5-Alpha Ready for Production Deployment

