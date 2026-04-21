# Phase 17.5-Beta Network Predictor: Quick Reference

## One-Minute Quick Start

```javascript
const { NetworkDevicePredictor } = require('./phase-17-5-beta-network-predictor');
const predictor = new NetworkDevicePredictor();

// Single device health check
const device = { 
  name: 'Primary Modem',
  model: 'Motorola MB8621', 
  type: 'modem',
  ageYears: 3,
  currentTemp: 48,
  criticality: 'CRITICAL'
};

const health = predictor.predictDeviceHealth(device);
console.log(`Health: ${health.health.score}/100 (${health.health.level})`);
console.log(`Action: ${health.recommendation[0].action}`);
```

---

## Common Tasks

### 1. Check Overall Network Health

```javascript
const devices = [ /* your 8 devices */ ];
const topology = predictor.analyzeMeshTopology(devices);

console.log(`Overall Status: ${topology.connectivity.status}`);
console.log(`Vulnerable Points: ${topology.redundancy.vulnerablePoints.length}`);
console.log(`Critical Devices: ${topology.criticalPath.length}`);
```

### 2. List All Devices Needing Attention

```javascript
devices.forEach(d => {
  const health = predictor.predictDeviceHealth(d);
  if (health.health.score > 40) {  // FAIR or worse
    console.log(`${d.name}: ${health.health.level} (${health.urgency})`);
    console.log(`  → ${health.recommendation[0].action}`);
  }
});
```

### 3. Check Firmware Status

```javascript
devices.forEach(d => {
  const health = predictor.predictDeviceHealth(d);
  if (health.firmwareStatus.status !== 'CURRENT') {
    console.log(`${d.name}: ${health.firmwareStatus.status}`);
    console.log(`  EOL: ${health.firmwareStatus.eolDate.toLocaleDateString()}`);
  }
});
```

### 4. Forecast Bandwidth Needs

```javascript
devices
  .filter(d => d.type === 'modem')
  .forEach(d => {
    const health = predictor.predictDeviceHealth(d);
    const year1 = health.bandwidth.projected3Year[0];
    if (year1.projected > health.bandwidth.capacity) {
      console.log(`${d.name}: Will exceed capacity in Year 1!`);
    }
  });
```

### 5. Calculate Total Replacement Cost

```javascript
let totalCost = 0;
devices.forEach(d => {
  const health = predictor.predictDeviceHealth(d);
  if (health.replacement.recommended) {
    totalCost += health.replacement.estimatedCost;
  }
});
console.log(`Total replacement cost: $${totalCost}`);
```

---

## Device Object Structure

```javascript
{
  // Required fields
  name: string,              // e.g., 'Primary Modem'
  model: string,             // e.g., 'Motorola MB8621'
  type: 'router'|'modem'|'switch'|'wifiap'|'moca',
  location: string,          // e.g., 'Network Hub'
  ageYears: number,          // e.g., 3
  currentTemp: number,       // Celsius (e.g., 48)
  bandwidth: number,         // Current usage Mbps
  maxBandwidth: number,      // Max capacity Mbps
  
  // Optional fields
  criticality?: 'CRITICAL'|'HIGH'|'MEDIUM'|'LOW',
  description?: string,
  lastServiceDate?: Date,
  serialNumber?: string,
  firmware?: string,
  location?: string
}
```

---

## Health Score Interpretation

| Score | Level | Meaning | Action |
|-------|-------|---------|--------|
| 0-20 | EXCELLENT | New device | Monitor |
| 20-40 | GOOD | Normal operation | Routine maintenance |
| 40-60 | FAIR | Approaching limits | Plan upgrades |
| 60-80 | POOR | Significant risk | Urgent action |
| 80-100 | CRITICAL | Immediate threat | Replace now |

---

## Status Values

### Firmware Status
```
'CURRENT'          - Active support, regular patches
'APPROACHING_EOL'  - Support ending soon (6-18 months)
'PAST_EOL'         - No longer supported, security risk
'UNKNOWN'          - Model not in database
```

### Hardware Status
```
'HEALTHY'          - Well within lifespan
'AGING'            - Approaching end of typical life
'BEYOND_LIFESPAN'  - Exceeds typical service years
'CRITICAL'         - Near or past MTBF
```

### Security Status
```
'LOW'              - Vendor patches quickly, few CVEs
'MEDIUM'           - Moderate CVE rate, decent support
'HIGH'             - Frequent CVEs, slow patches
'CRITICAL'         - High risk vendor, exploitation likely
```

### Urgency Levels
```
'IMMEDIATE'        - Action required now
'URGENT'           - Action required within 1 month
'PLANNED'          - Schedule within 3-6 months
'ROUTINE'          - Normal replacement cycle (6+ months)
'MONITOR'          - Watch for changes, no action needed
```

---

## Recommendation Priority Levels

```
'CRITICAL'  - Do this immediately, impacts operations
'HIGH'      - Do this within 1 month
'MEDIUM'    - Schedule within 3 months
'LOW'       - Nice to have, no rush
```

---

## Prediction Output Structure

```javascript
health = {
  health: {
    score: 0-100,
    level: 'EXCELLENT'|'GOOD'|'FAIR'|'POOR'|'CRITICAL',
    components: {
      firmware: { score, status, eolDate, daysUntilEOL },
      hardware: { score, status, ageYears, degradation, mtbfPercentage },
      security: { score, riskLevel, vendor, cveRate, patchingSpeed }
    }
  },
  
  urgency: 'IMMEDIATE'|'URGENT'|'PLANNED'|'ROUTINE'|'MONITOR',
  
  firmwareStatus: {
    status: 'CURRENT'|'APPROACHING_EOL'|'PAST_EOL',
    eolDate: Date,
    daysUntilEOL: number,
    supportLevel: 'active'|'extended'|'ended'
  },
  
  hardwareStatus: {
    condition: 'HEALTHY'|'AGING'|'BEYOND_LIFESPAN',
    age: string,  // e.g., '3 years 2 months'
    expectedLifespan: number,  // years
    degradationPercent: number,
    mtbfPercentage: number,
    thermalStatus: string  // 'NORMAL'|'WARNING'|'CRITICAL'
  },
  
  cveExposure: {
    severity: 'LOW'|'MEDIUM'|'HIGH'|'CRITICAL',
    vendor: string,
    cveRate: number,  // CVEs per year
    estimatedActiveCVEs: number,
    patchingSpeed: 'FAST'|'MODERATE'|'SLOW'
  },
  
  bandwidth: {
    current: number,  // Mbps
    capacity: number,  // Mbps
    utilizationHealth: string,  // % of capacity
    projected3Year: [
      { year, projected }  // Year 1-3 projections
    ]
  },
  
  replacement: {
    recommended: boolean,
    reasons: [string],
    estimatedCost: number,
    roi: { replacementCost, expectedCostOfFailure, breakEven }
  },
  
  recommendation: [
    { priority, action, reasoning }
  ]
}
```

---

## Topology Output Structure

```javascript
topology = {
  totalDevices: number,
  
  devicesByType: {
    router: count,
    modem: count,
    // ...
  },
  
  connectivity: {
    status: 'CONNECTED'|'DEGRADED'|'FAILED',
    routers: count,
    modems: count,
    switches: count,
    redundancy: 'SINGLE'|'PARTIAL'|'REDUNDANT'
  },
  
  redundancy: {
    vulnerablePoints: [string],  // Single points of failure
    fullyRedundant: boolean,
    byType: {
      router: { count, redundant },
      modem: { count, redundant }
      // ...
    }
  },
  
  criticalPath: [
    { device, type, role }  // Devices critical to operations
  ],
  
  healthDistribution: {
    'EXCELLENT': [devices],
    'GOOD': [devices],
    'FAIR': [devices],
    'POOR': [devices],
    'CRITICAL': [devices]
  },
  
  recommendations: [
    { priority, action, reasoning, devices: [string] }
  ]
}
```

---

## Common Scenarios

### Scenario 1: Device Nearing EOL

**Problem:** Firmware support ending soon

```javascript
const device = predictor.predictDeviceHealth(modem);

if (device.firmwareStatus.status === 'APPROACHING_EOL') {
  console.log(`
    Device: ${device.model}
    EOL Date: ${device.firmwareStatus.eolDate.toLocaleDateString()}
    Days Until EOL: ${device.firmwareStatus.daysUntilEOL}
    Action: Plan replacement in next ${Math.floor(device.firmwareStatus.daysUntilEOL / 90)} quarters
  `);
}
```

### Scenario 2: Device Exceeding Bandwidth Capacity

**Problem:** Growing data needs outpacing device capacity

```javascript
const device = predictor.predictDeviceHealth(modem);
const year3 = device.bandwidth.projected3Year[2];

if (year3.projected > device.bandwidth.capacity) {
  console.log(`
    Device will exceed capacity in Year 3
    Current: ${device.bandwidth.current} Mbps
    Year 3: ${year3.projected} Mbps
    Capacity: ${device.bandwidth.capacity} Mbps
    Upgrade recommendation: ${device.recommendation[0].action}
  `);
}
```

### Scenario 3: High CVE Risk from Vendor

**Problem:** Vendor has history of security vulnerabilities

```javascript
const device = predictor.predictDeviceHealth(router);

if (device.cveExposure.severity === 'HIGH') {
  console.log(`
    SECURITY ALERT: ${device.model}
    Vendor CVE Rate: ${device.cveExposure.cveRate}/year
    Patching Speed: ${device.cveExposure.patchingSpeed}
    Current CVEs: ~${device.cveExposure.estimatedActiveCVEs}
    Risk Level: ${device.cveExposure.severity}
  `);
}
```

### Scenario 4: Device Aging Beyond Lifespan

**Problem:** Hardware degrading, failure risk increasing

```javascript
const device = predictor.predictDeviceHealth(satellite);

if (device.hardwareStatus.condition === 'BEYOND_LIFESPAN') {
  console.log(`
    Device has exceeded typical lifespan
    Age: ${device.hardwareStatus.age}
    Expected Lifespan: ${device.hardwareStatus.expectedLifespan} years
    MTBF: ${device.hardwareStatus.mtbfPercentage}%
    Risk: Device failure likely within next 12 months
  `);
}
```

---

## Mesh Network Quick Check

```javascript
function quickMeshCheck(devices) {
  const topology = predictor.analyzeMeshTopology(devices);
  
  console.log(`\n=== MESH QUICK CHECK ===\n`);
  console.log(`Status: ${topology.connectivity.status}`);
  console.log(`Devices: ${topology.totalDevices}`);
  console.log(`Routers: ${topology.connectivity.routers}`);
  console.log(`Redundancy: ${topology.connectivity.redundancy}`);
  
  if (topology.redundancy.vulnerablePoints.length > 0) {
    console.log(`⚠ Single Points of Failure:`);
    topology.redundancy.vulnerablePoints.forEach(p => {
      console.log(`  • ${p}`);
    });
  } else {
    console.log(`✓ No single points of failure`);
  }
  
  console.log(`\nCritical Devices:`);
  topology.criticalPath.forEach(cp => {
    console.log(`  • ${cp.device} (${cp.type})`);
  });
}
```

---

## Aggregator Quick Start

```javascript
const { ExtendedPredictionAggregator } = require('./phase-17-5-beta-extended-aggregator');

const agg = new ExtendedPredictionAggregator();
const portfolio = agg.aggregateExtendedPortfolio(softwareAssets, networkDevices);

// Unified timeline
console.log(portfolio.unified.timeline);

// Resource planning
console.log(`Total cost: $${portfolio.unified.resourcePlan.combined.totalCost}`);
console.log(`Total hours: ${portfolio.unified.resourcePlan.combined.totalStaffHours}`);

// Critical items
portfolio.unified.recommendations
  .filter(r => r.priority === 'CRITICAL')
  .forEach(r => console.log(`CRITICAL: ${r.action}`));
```

---

## Caching & Performance

```javascript
// Create once, reuse multiple times
const predictor = new NetworkDevicePredictor();

// Fast for repeated calls on same device
const health1 = predictor.predictDeviceHealth(device);
const health2 = predictor.predictDeviceHealth(device);  // ~same speed

// Topology analysis is more expensive, cache results
const topology = predictor.analyzeMeshTopology(devices);
// Reuse topology for multiple operations
```

---

## Troubleshooting

### Device Model Not Recognized

```javascript
// If model not in firmware EOL database:
const health = predictor.predictDeviceHealth(device);

if (health.firmwareStatus.status === 'UNKNOWN') {
  console.log('Device model not in database');
  console.log('Add to custom database or use generic timelines');
  
  // Add custom firmware EOL data
  predictor.firmwareEOL['router']['MyCustomRouter'] = {
    eolDate: new Date('2027-12-31'),
    support: 'extended',
    criticality: 'critical'
  };
}
```

### Unrealistic Predictions

```javascript
// Validate device data before analysis
if (!device.ageYears || device.ageYears < 0) {
  console.log('Error: Invalid ageYears');
}

if (device.currentTemp < 20 || device.currentTemp > 80) {
  console.log('Warning: Temperature outside typical range');
}

if (device.bandwidth > device.maxBandwidth) {
  console.log('Error: Current bandwidth exceeds maximum');
}
```

---

## Tips & Best Practices

1. **Update quarterly** - Refresh CVE data, check for new firmware releases
2. **Monitor trends** - Track health scores over time to spot degradation
3. **Plan proactively** - Replace before failures cascade
4. **Coordinate upgrades** - Use ExtendedAggregator to sync software + network
5. **Test mesh redundancy** - Verify failover paths work as predicted
6. **Document baseline** - Save initial device specs for comparison
7. **Calibrate for your environment** - Adjust growth rates if different from defaults
8. **Alert on changes** - Track when urgency escalates from MONITOR→PLANNED

---

## Support

- **API Docs:** See PHASE-17-5-BETA-NETWORK-EXTENSION.md
- **Setup Guide:** See PHASE-17-5-BETA-NESTED-MESH-GUIDE.md
- **Examples:** Review phase-17-5-beta-network-integration-test.js
- **Customization:** Edit firmwareEOLDatabase, deviceCVEDatabase in source code
