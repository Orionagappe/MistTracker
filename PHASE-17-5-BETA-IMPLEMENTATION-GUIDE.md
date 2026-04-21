# Phase 17.5-Beta: Implementation Guide

## Quick Start

### 1. Basic Workflow (5 minutes)

```javascript
// Step 1: Import modules
const { PredictionAggregator } = require('./phase-17-5-beta-aggregator');
const { PredictiveDashboard } = require('./phase-17-5-beta-dashboard');

// Step 2: Prepare assets from Phase 17.5-Alpha inventory
const assets = [
  { name: 'PostgreSQL', version: '12.8', category: 'database', ... },
  { name: 'Node.js', version: '16.14.0', category: 'runtime', ... }
];

// Step 3: Generate predictions
const aggregator = new PredictionAggregator();
const recommendations = aggregator.aggregatePortfolioRecommendations(assets);

// Step 4: Create dashboard
const dashboard = new PredictiveDashboard();
const dashboardOutput = dashboard.generateDashboard(recommendations);

// Step 5: Export
const html = dashboard.exportAsHTML(dashboardOutput);
```

### 2. Individual Predictions (Module by Module)

#### CVE Forecasting
```javascript
const { CVEEmergenceForecaster } = require('./phase-17-5-beta-cve-forecaster');

const forecaster = new CVEEmergenceForecaster();

// Single asset prediction
const cvePredict = forecaster.predictCVEEmergence(
  'PostgreSQL',
  '12.8',
  'database',
  365 * 3  // 3 years until EOL
);

console.log(cvePredict.nextCVEExpected.daysUntilDiscovery);  // ~150 days
console.log(cvePredict.forecast.probability90Day);          // ~68%
console.log(cvePredict.forecast.urgency);                   // 72/100

// Portfolio forecast
const portfolio = forecaster.forecastPortfolioCVEEmergence(assets);
console.log(portfolio.totalProjectedCVEs);  // Total CVEs in 12 months
```

#### Friction Analysis
```javascript
const { FrictionPredictionEngine } = require('./phase-17-5-beta-friction-predictor');

const engine = new FrictionPredictionEngine();

// Single upgrade friction
const frictionPredict = engine.predictUpgradeFriction(
  'PostgreSQL',
  '12.8',
  '14.6',
  'database',
  2  // depends on 2 systems
);

console.log(frictionPredict.frictionScore);         // 78/100
console.log(frictionPredict.frictionLevel);         // 'VERY HIGH'
console.log(frictionPredict.estimatedEffort);       // { dev: 20, qa: 15, deploy: 3 }
console.log(frictionPredict.riskFactors.regressionRisk);  // 0.65

// Portfolio distribution
const distribution = engine.predictPortfolioFriction(assets);
console.log(distribution.statistics.averageFriction);  // Portfolio avg
console.log(distribution.byFrictionLevel);             // Breakdown by level
```

#### Stability Modeling
```javascript
const { SystemStabilityModeler } = require('./phase-17-5-beta-stability-modeler');

const modeler = new SystemStabilityModeler();

// System trajectory
const trajectory = modeler.predictSystemStability(
  'Production',
  assets,
  12  // 12-month forecast
);

console.log(trajectory.current.stabilityScore);      // 62/100
console.log(trajectory.forecast.projectedScore);     // 38/100 (projected)
console.log(trajectory.forecast.trend);              // 'DEGRADING'
console.log(trajectory.milestones);                  // When critical thresholds crossed

// Chaos risk
const chaosAssessment = modeler.assessChaosRisk(assets);
console.log(chaosAssessment.riskScore);              // 45/100
console.log(chaosAssessment.riskLevel);              // 'MODERATE'
console.log(chaosAssessment.indicators);             // Specific chaos signals
```

#### Unified Recommendations
```javascript
const { PredictionAggregator } = require('./phase-17-5-beta-aggregator');

const aggregator = new PredictionAggregator();

// Single recommendation combines all predictions
const recommendation = aggregator.generateUpgradeRecommendation({
  name: 'PostgreSQL',
  version: '12.8',
  category: 'database',
  analysis: { targetVersion: '14.6', cveActivated: 4 },
  dependents: ['DB1', 'DB2']
});

console.log(recommendation.urgency);                     // 89/100
console.log(recommendation.recommendedTiming.recommendation);  // 'IMMEDIATE'
console.log(recommendation.riskBenefit.verdict);         // Why upgrade
console.log(recommendation.confidence);                  // 92% confidence

// Portfolio aggregation
const portfolio = aggregator.aggregatePortfolioRecommendations(assets);
console.log(portfolio.decisionBreakdown['UPGRADE_IMMEDIATELY']);  // Critical items
console.log(portfolio.timeline.immediate);                       // 0-1 day items
console.log(portfolio.executiveSummary);                         // High-level summary
```

---

## Decision Making Framework

### Use This For...

#### Planning Upgrades
```javascript
// Question: "Which upgrades should we prioritize?"

const recommendation = aggregator.generateUpgradeRecommendation(asset);

if (recommendation.urgency > 80) {
  // Start within 1-7 days
  scheduleUpgrade('IMMEDIATE', asset);
} else if (recommendation.urgency > 60) {
  // Schedule in 2-4 weeks
  scheduleUpgrade('PLANNED', asset);
} else if (recommendation.frictionScore > 70) {
  // High friction + low CVE = remediate instead
  applyRemediationStrategy(asset);
}
```

#### Assessing Risk
```javascript
// Question: "What's our CVE exposure in 90 days?"

const cveForecasts = assets.map(a => 
  forecaster.predictCVEEmergence(a.name, a.version, a.category)
);

const riskIn90Days = cveForecasts.reduce((sum, p) => 
  sum + p.forecast.probability90Day
, 0);

console.log(`Expected CVEs in 90 days: ${riskIn90Days.toFixed(1)}`);
```

#### Modeling Impact
```javascript
// Question: "How will our system stability change if we don't upgrade?"

const trajectory = modeler.predictSystemStability('Prod', assets, 12);

if (trajectory.forecast.trend === 'RAPIDLY DEGRADING') {
  alertTeam('STABILITY_CRITICAL', trajectory.milestones);
}
```

#### Resource Planning
```javascript
// Question: "How many developer hours needed for upgrades?"

const recommendations = aggregator.aggregatePortfolioRecommendations(assets);
const totalHours = recommendations.decisionBreakdown['UPGRADE_IMMEDIATELY']
  .reduce((sum, item) => sum + item.estimatedEffort?.totalHours || 0, 0);

console.log(`Total effort for immediate upgrades: ${totalHours} hours`);
```

---

## Integration with Phase 17.5-Alpha

### Alpha provides inventory and context:
```javascript
// From Phase 17.5-Alpha orchestrator
const orchestrator = new Phase17_5_Orchestrator();
const inventory = orchestrator.importAssets(csvFile);
```

### Beta uses that context for predictions:
```javascript
// From Phase 17.5-Beta aggregator
const recommendations = aggregator.aggregatePortfolioRecommendations(inventory);
```

### Together they create actionable strategy:
```javascript
// Combine: Alpha roadmap + Beta timing = Optimal strategy
const roadmap = alphaRoadmapGenerator.generateUpgradeRoadmap(inventory);
const predictions = betaAggregator.aggregatePortfolioRecommendations(inventory);

// Reorder roadmap by Beta predictions
const optimizedRoadmap = reorderByPredictedUrgency(roadmap, predictions);
```

---

## Customization

### Adjust CVE Patterns
```javascript
// Modify historical CVE patterns in CVEEmergenceForecaster
const patterns = {
  'runtime': {
    avgCVEsPerYear: 15,    // Increase from 12.5
    activationRate: 0.45,  // Increase from 0.35
    discovery: { avg: '4 months' }  // Decrease from 6
  }
};
```

### Adjust Friction Factors
```javascript
// Modify friction weights in FrictionPredictionEngine
const factors = {
  majorVersionFactor: 20,      // Increase from 12
  dependentCount: 3.0,         // Increase multiplier
  breakingChangeRisk: 0.75     // Increase from 0.65
};
```

### Adjust Stability Thresholds
```javascript
// Modify stability baselines in SystemStabilityModeler
const thresholds = {
  critical: 30,    // Below this = CHAOTIC
  poor: 50,        // Below this = POOR
  fair: 70,        // Below this = FAIR
  good: 85         // Below this = GOOD
};
```

---

## Output Formats

### Console Output (Development)
```javascript
const recommendations = aggregator.aggregatePortfolioRecommendations(assets);
// Logs detailed breakdown to console
```

### JSON Output (Integration)
```javascript
const json = JSON.stringify(recommendations, null, 2);
// Machine-readable format for downstream systems
```

### HTML Dashboard (Executive)
```javascript
const dashboard = new PredictiveDashboard();
const dashboardOutput = dashboard.generateDashboard(recommendations);
const html = dashboard.exportAsHTML(dashboardOutput);

// Save to file
fs.writeFileSync('dashboard.html', html);
```

### Structured Report (Analysis)
```javascript
const report = {
  timestamp: new Date(),
  summary: recommendations.executiveSummary,
  timelines: recommendations.timeline,
  decisions: recommendations.decisionBreakdown,
  alerts: dashboardOutput.alerts
};
```

---

## Performance Considerations

### For Small Portfolios (< 20 assets)
```javascript
// Direct aggregation is fast
const recommendations = aggregator.aggregatePortfolioRecommendations(assets);
// Completes in < 100ms
```

### For Medium Portfolios (20-100 assets)
```javascript
// Still direct, slightly slower
const recommendations = aggregator.aggregatePortfolioRecommendations(assets);
// Completes in < 500ms
```

### For Large Portfolios (100+ assets)
```javascript
// Consider batching
const batch1 = assets.slice(0, 50);
const batch2 = assets.slice(50, 100);

const rec1 = aggregator.aggregatePortfolioRecommendations(batch1);
const rec2 = aggregator.aggregatePortfolioRecommendations(batch2);

// Merge results
const combined = mergeRecommendations(rec1, rec2);
```

---

## Troubleshooting

### Issue: "Invalid friction score"
**Solution:** Verify asset has `version`, `category`, and `analysis.targetVersion`

```javascript
// Check asset structure
if (!asset.version || !asset.category) {
  console.error('Asset missing required fields');
}
```

### Issue: "Prediction differs from expected"
**Solution:** Check historical pattern assumptions

```javascript
// Verify CVE patterns match your environment
const patterns = forecaster.frictionPatterns[asset.category];
console.log('Current patterns:', patterns);
// May need adjustment based on your actual CVE history
```

### Issue: "Dashboard not rendering correctly"
**Solution:** Verify HTML export compatibility

```javascript
// Test HTML output
const html = dashboard.exportAsHTML(dashboardOutput);
if (!html.includes('</html>')) {
  console.error('HTML export incomplete');
}
```

---

## Common Queries

### "What needs immediate upgrade?"
```javascript
const immediate = recommendations.decisionBreakdown['UPGRADE_IMMEDIATELY'];
immediate.forEach(item => console.log(`${item.software}: ${item.confidence}% confidence`));
```

### "What can we defer?"
```javascript
const deferred = recommendations.decisionBreakdown['REMEDIATE_LOCK_MONITOR'];
deferred.forEach(item => console.log(`${item.software}: Lock and monitor`));
```

### "When's the peak upgrade period?"
```javascript
const timeline = recommendations.timeline;
const peak = Object.entries(timeline).reduce((max, [period, items]) =>
  items.length > max.length ? items : max
);
console.log(`Peak period: ${peak.period} with ${peak.length} upgrades`);
```

### "What's our stability trend?"
```javascript
const stability = systemModeler.predictSystemStability('Production', assets, 12);
console.log(`Current: ${stability.current.stabilityScore}`);
console.log(`Projected: ${stability.forecast.projectedScore}`);
console.log(`Trend: ${stability.forecast.trend}`);
```

---

## API Reference

See individual module documentation:
- `phase-17-5-beta-cve-forecaster.js` - CVE Emergence Methods
- `phase-17-5-beta-friction-predictor.js` - Friction Analysis Methods
- `phase-17-5-beta-stability-modeler.js` - Stability Methods
- `phase-17-5-beta-aggregator.js` - Aggregation Methods
- `phase-17-5-beta-dashboard.js` - Visualization Methods

---

## Summary

Phase 17.5-Beta provides **production-ready predictive analytics** for software lifecycle management. Use it to:

1. **Forecast** CVE emergence 30/90/365 days in advance
2. **Assess** upgrade complexity before committing resources
3. **Model** system stability trajectories
4. **Prioritize** upgrades based on risk/benefit analysis
5. **Visualize** predictions in executive-friendly dashboards
6. **Automate** upgrade decision making

All modules work together seamlessly, or independently based on your needs.
