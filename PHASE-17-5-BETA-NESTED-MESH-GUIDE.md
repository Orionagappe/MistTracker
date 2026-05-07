# Phase 17.5-Beta Network Extension: Nested Mesh Setup Guide

## Your Network Architecture

```
                    ┌─────────────────────────────────┐
                    │   Internet (Broadband)          │
                    └─────────────┬───────────────────┘
                                  │
                        ┌─────────▼──────────┐
                        │  Primary Modem     │
                        │  (CRITICAL)        │
                        └─────────┬──────────┘
                                  │
                        ┌─────────▼──────────┐
                        │  Primary Router    │
                        │  (Network Hub)     │
                        └────────┬┬──────────┘
                                 ││
                    ┌────────────┘│└─────────────┐
                    │             │              │
            ┌───────▼─────┐  ┌────▼──────┐  ┌───▼────────┐
            │    WiFi AP  │  │   Switch   │  │ MOCA Adapt │
            │  (Primary)  │  │   (Core)   │  │ (Backbone) │
            └─────────────┘  └────┬───────┘  └───────┬────┘
                                  │                  │
                          ┌───────▼──────────┐       │ (Coax)
                          │  Wired Devices   │       │
                          │  (Servers, etc)  │       │
                          └──────────────────┘  ┌────▼──────────┐
                                               │ Satellite Site │
                                               │  (Remote)      │
                                               ├────────────────┤
                                               │ Satellite      │
                                               │ Router         │
                                               ├────────────────┤
                                               │ WiFi AP        │
                                               │ (Secondary)    │
                                               ├────────────────┤
                                               │ MOCA Adapter 2 │
                                               │ (Unused)       │
                                               └────────────────┘
```

---

## Device Inventory for Your Network

### Devices to Track

```javascript
const meshNetworkDevices = [
  // Critical Path (Internet → Network Hub)
  {
    name: 'Primary Modem',
    model: 'Motorola MB8621',
    type: 'modem',
    location: 'Network Hub',
    criticality: 'CRITICAL',
    ageYears: 3,
    currentTemp: 48,
    bandwidth: 1000,
    maxBandwidth: 1000,
    description: 'Primary WAN connection (DOCSIS 3.1)'
  },
  {
    name: 'Primary Router',
    model: 'MikroTik RouterOS7',
    type: 'router',
    location: 'Network Hub',
    criticality: 'CRITICAL',
    ageYears: 2,
    currentTemp: 52,
    bandwidth: 1000,
    maxBandwidth: 10000,
    description: 'Main network router (runs RouterOS 7)'
  },

  // Backbone Infrastructure
  {
    name: 'Core Network Switch',
    model: 'MikroTik Cloud',
    type: 'switch',
    location: 'Network Hub',
    criticality: 'HIGH',
    ageYears: 2,
    currentTemp: 45,
    bandwidth: 10000,
    maxBandwidth: 40000,
    description: 'Managed switch for wired devices'
  },

  // MOCA Backbone (Coax)
  {
    name: 'MOCA Adapter 1',
    model: 'Motorola MOCA 2.0',
    type: 'moca',
    location: 'Primary Site',
    criticality: 'HIGH',
    ageYears: 2,
    currentTemp: 40,
    bandwidth: 500,
    maxBandwidth: 500,
    description: 'Coax backbone adapter (active)'
  },
  {
    name: 'MOCA Adapter 2',
    model: 'Motorola MOCA 2.0',
    type: 'moca',
    location: 'Secondary Site',
    criticality: 'LOW',
    ageYears: 1,
    currentTemp: 35,
    bandwidth: 0,
    maxBandwidth: 500,
    description: 'Secondary coax adapter (currently unused)'
  },

  // WiFi Coverage
  {
    name: 'WiFi AP - Primary',
    model: 'Ubiquiti UAP-AC-HD',
    type: 'wifiap',
    location: 'Network Hub',
    criticality: 'MEDIUM',
    ageYears: 3,
    currentTemp: 50,
    bandwidth: 800,
    maxBandwidth: 1300,
    description: 'Primary WiFi access point'
  },
  {
    name: 'WiFi AP - Secondary',
    model: 'Ubiquiti UAP-AC-HD',
    type: 'wifiap',
    location: 'Satellite Location',
    criticality: 'MEDIUM',
    ageYears: 2,
    currentTemp: 48,
    bandwidth: 600,
    maxBandwidth: 1300,
    description: 'Secondary WiFi for remote access'
  },

  // Satellite Interface (Remote/Backup)
  {
    name: 'Satellite Router',
    model: 'Ubiquiti EdgeRouter',
    type: 'router',
    location: 'Satellite Interface',
    criticality: 'CRITICAL',
    ageYears: 4,
    currentTemp: 58,
    bandwidth: 500,
    maxBandwidth: 1000,
    description: 'Remote site router (geographic reach)'
  }
];
```

---

## Step-by-Step: Analyze Your Network

### Step 1: Import Devices

```javascript
const { NetworkDevicePredictor } = require('./phase-17-5-beta-network-predictor');

const predictor = new NetworkDevicePredictor();
const meshNetworkDevices = [/* from above */];

console.log(`Analyzing ${meshNetworkDevices.length} network devices...`);
```

### Step 2: Analyze Topology

```javascript
const topology = predictor.analyzeMeshTopology(meshNetworkDevices);

console.log('\n=== YOUR NETWORK TOPOLOGY ===\n');

console.log('Device Summary:');
console.log(`  Total Devices: ${topology.totalDevices}`);
Object.entries(topology.devicesByType).forEach(([type, count]) => {
  console.log(`    ${type}: ${count}`);
});

console.log('\nConnectivity:');
console.log(`  Status: ${topology.connectivity.status}`);
console.log(`  Routers: ${topology.connectivity.routers} (Primary + Satellite)`);
console.log(`  Modems: ${topology.connectivity.modems} (WAN connection)`);
console.log(`  Switches: ${topology.connectivity.switches} (Wired backbone)`);
console.log(`  Redundancy: ${topology.connectivity.redundancy}`);

console.log('\nRedundancy Analysis:');
topology.redundancy.vulnerablePoints.forEach(type => {
  console.log(`  ⚠ ${type}: SINGLE POINT OF FAILURE`);
});
if (topology.redundancy.vulnerablePoints.length === 0) {
  console.log('  ✓ No single points of failure detected');
}

console.log('\nCritical Devices:');
topology.criticalPath.forEach(cp => {
  console.log(`  • ${cp.device} (${cp.type}) - ${cp.role}`);
});
```

### Step 3: Health Check Per Device

```javascript
console.log('\n=== DEVICE HEALTH ASSESSMENT ===\n');

meshNetworkDevices.forEach(device => {
  const prediction = predictor.predictDeviceHealth(device);

  console.log(`${device.name} (${device.model})`);
  console.log(`  Location: ${device.location}`);
  console.log(`  Overall Health: ${prediction.health.score}/100 (${prediction.health.level})`);

  console.log(`  Firmware:  ${prediction.firmwareStatus.status}`);
  if (prediction.firmwareStatus.status !== 'CURRENT') {
    console.log(`    → EOL: ${prediction.firmwareStatus.eolDate.toLocaleDateString()}`);
  }

  console.log(`  Hardware:  ${prediction.hardwareStatus.condition}`);
  console.log(`    → Age: ${prediction.hardwareStatus.age}`);
  console.log(`    → Lifespan: ${prediction.hardwareStatus.expectedLifespan} years`);

  console.log(`  Security:  ${prediction.cveExposure.severity} risk`);
  console.log(`    → Vendor: ${prediction.cveExposure.vendor}`);
  console.log(`    → Active CVEs: ~${prediction.cveExposure.estimatedActiveCVEs}`);

  console.log(`  Urgency:   ${prediction.urgency}`);

  if (prediction.recommendation.length > 0) {
    console.log(`  Actions:`);
    prediction.recommendation.forEach(rec => {
      console.log(`    [${rec.priority}] ${rec.action}`);
      console.log(`      → ${rec.reasoning}`);
    });
  }

  console.log();
});
```

### Step 4: Bandwidth Forecast

```javascript
console.log('\n=== BANDWIDTH UTILIZATION FORECAST ===\n');

meshNetworkDevices
  .filter(d => ['modem', 'router'].includes(d.type))
  .forEach(device => {
    const prediction = predictor.predictDeviceHealth(device);

    if (prediction.bandwidth) {
      console.log(`${device.name}:`);
      console.log(`  Current: ${prediction.bandwidth.current} Mbps`);
      console.log(`  Capacity: ${prediction.bandwidth.capacity} Mbps`);
      console.log(`  Utilization: ${((prediction.bandwidth.current / prediction.bandwidth.capacity) * 100).toFixed(1)}%`);
      console.log(`  Projected Needs:`);

      prediction.bandwidth.projected3Year.forEach(proj => {
        const percent = ((proj.projected / prediction.bandwidth.capacity) * 100).toFixed(1);
        const warning = percent > 80 ? ' ⚠ APPROACHING LIMIT' : '';
        console.log(`    Year ${proj.year}: ${proj.projected} Mbps (${percent}%)${warning}`);
      });
    }

    console.log();
  });
```

### Step 5: Replacement Planning

```javascript
console.log('\n=== REPLACEMENT PLANNING ===\n');

const replacementNeeded = meshNetworkDevices
  .map(device => {
    const pred = predictor.predictDeviceHealth(device);
    return { device, prediction: pred };
  })
  .filter(item => item.prediction.replacement.recommended);

if (replacementNeeded.length === 0) {
  console.log('✓ No immediate replacements recommended');
} else {
  console.log(`${replacementNeeded.length} devices need attention:\n`);

  let totalCost = 0;

  replacementNeeded.forEach(item => {
    const { device, prediction } = item;
    console.log(`• ${device.name}`);
    console.log(`  Reasons: ${prediction.replacement.reasons.join(', ')}`);
    console.log(`  Cost: $${prediction.replacement.estimatedCost}`);

    if (prediction.replacement.roi.breakEven) {
      console.log(`  ✓ ROI Justified (Replacement cost vs. failure risk)`);
    }

    totalCost += prediction.replacement.estimatedCost;
    console.log();
  });

  console.log(`Total Replacement Cost: $${totalCost}`);
}
```

### Step 6: Generate Recommendations

```javascript
console.log('\n=== TOPOLOGY RECOMMENDATIONS ===\n');

topology.recommendations.forEach(rec => {
  console.log(`[${rec.priority}] ${rec.action}`);
  console.log(`  → ${rec.reasoning}`);
  if (rec.devices) {
    console.log(`  Devices: ${rec.devices.join(', ')}`);
  }
  console.log();
});
```

---

## Your Network: Specific Insights

### Current State Assessment

**Primary Modem (MB8621, 3 years old)**
- Status: Approaching EOL (June 2026)
- Recommendation: Plan replacement within 6 months
- Urgency: PLANNED

**Primary Router (MikroTik RouterOS7, 2 years old)**
- Status: Current firmware support until June 2028
- Recommendation: Monitor for patches
- Urgency: MONITOR

**Satellite Router (Ubiquiti EdgeRouter, 4 years old)**
- Status: Past recommended lifespan (5 years)
- Recommendation: Plan replacement in next cycle
- Urgency: PLANNED

**MOCA Adapter 1 (Active backbone)**
- Status: Healthy (2 years old)
- Recommendation: Monitor coax signal quality
- Urgency: MONITOR

**MOCA Adapter 2 (Currently unused)**
- Status: Reserve device for redundancy
- Recommendation: Keep as backup
- Urgency: RESERVE

### Unique Mesh Considerations

1. **Coaxial Backbone Quality**
   - MOCA 2.0 limited to ~500 Mbps
   - Upgrade path: MOCA 2.5 (higher bandwidth)
   - Consider timing with modem/router upgrades

2. **Satellite Link Dependency**
   - EdgeRouter is critical for remote access
   - Aging (4 years) - higher failure risk
   - Should plan redundancy (2nd satellite router)

3. **WiFi Coverage Strategy**
   - Two APs provide good redundancy
   - Primary AP (3 years) approaching typical lifespan
   - Plan replacement as part of overall refresh

4. **Mesh Complexity**
   - Nested mesh more resilient than star
   - Multiple paths for traffic routing
   - Firmware updates must be coordinated across all devices

---

## Recommended Timeline

### Immediate (Next 3 Months)
- ✓ Monitor all devices for thermal/performance issues
- ✓ Document current configuration of each device
- ✓ Test satellite link redundancy
- ✓ Verify MOCA coax signal quality

### Near-Term (3-6 Months)
- ⏳ Plan Primary Modem upgrade (EOL approaching)
  - Estimated cost: $300
  - Downtime: 30 minutes
  - Coordinate with routing

- ⏳ Plan Satellite Router upgrade (aging)
  - Estimated cost: $800
  - Downtime: 1-2 hours
  - Consider redundancy option

### Medium-Term (6-12 Months)
- 📅 Plan Primary WiFi AP refresh (3-year mark)
  - Estimated cost: $400
  - Opportunity to add WiFi 6
  - Upgrade both APs together for consistency

- 📅 Evaluate MOCA Adapter 2 activation
  - Consider MOCA 2.5 upgrade for bandwidth
  - Full redundant coax backbone

### Long-Term (12+ Months)
- 🔮 Monitor MikroTik RouterOS 7 support (until 2028)
- 🔮 Plan eventual EdgeRouter replacement
- 🔮 Consider nested mesh expansion (more remote sites)

---

## Integration with Software Predictions

Your complete infrastructure includes:

```javascript
const { ExtendedPredictionAggregator } = require('./phase-17-5-beta-extended-aggregator');

// Software assets (from Phase 17.5-Alpha)
const softwareAssets = [
  { name: 'PostgreSQL', version: '12.8', ... },
  { name: 'Node.js', version: '16.14.0', ... },
  // ... others
];

// Network devices (your mesh)
const meshDevices = [/* as defined above */];

// Unified analysis
const aggregator = new ExtendedPredictionAggregator();
const portfolio = aggregator.aggregateExtendedPortfolio(softwareAssets, meshDevices);

console.log(portfolio.unified.timeline);
// Timeline shows software AND network events
// Helps coordinate upgrades across entire stack
```

---

## Monitoring & Alerts

### Key Metrics to Track

1. **Monthly**: Device temperatures, bandwidth utilization
2. **Quarterly**: Firmware availability, CVE disclosures
3. **Annually**: MTBF percentage, degradation trends

### Alert Thresholds

```javascript
const alerts = {
  temperature_warning: 65,    // Celsius
  temperature_critical: 75,
  bandwidth_utilization: 0.80, // 80% capacity
  mtbf_percentage: 60,        // Approach MTBF
  eol_warning_days: 180,      // 6 months before EOL
  eol_critical_days: 90       // 3 months before EOL
};
```

---

## File: Your Network Configuration

Save this as `meshNetworkConfig.js`:

```javascript
module.exports = {
  topology: 'nested_mesh',
  backbone: 'moca_2.0',
  satellite: true,
  redundancy: {
    modems: 1,
    routers: 2,
    wifiAPs: 2
  },
  devices: [
    // Copy device array from Step 1
  ],
  environment: 'business',  // affects bandwidth growth projections
  criticalLocation: 'Network Hub'
};
```

---

## Quick Reference: Commands

```javascript
// Analyze your mesh
const topo = predictor.analyzeMeshTopology(meshNetworkDevices);

// Check individual device
const modemHealth = predictor.predictDeviceHealth(meshNetworkDevices[0]);

// Get topology recommendations
topo.recommendations.forEach(r => console.log(r));

// Run full validation
const { NestedMeshNetworkValidation } = require('./phase-17-5-beta-network-integration-test');
NestedMeshNetworkValidation.runValidation();
```

---

## Summary

Your nested mesh network is now **predictive and managed**:

✓ Know exactly when firmware support ends
✓ Predict hardware failures before they happen
✓ Plan bandwidth upgrades before limits are hit
✓ Coordinate network + software upgrades strategically
✓ Maintain mesh redundancy and reliability

**Next Step:** Run the network integration test to validate predictions against your actual device models.
