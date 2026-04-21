/**
 * Phase 17.5-Beta: Network Device Predictor
 * 
 * Extends predictive analytics to network infrastructure:
 * routers, modems, switches, WiFi APs, logistics hubs, MOCA adapters
 * Tracks firmware EOL, CVEs, hardware degradation, bandwidth forecasting
 */

/**
 * NetworkDevicePredictor: Predict network infrastructure issues
 */
class NetworkDevicePredictor {
  constructor() {
    // Network device firmware databases
    this.firmwareEOL = this.initializeFirmwareEOLDatabase();
    this.deviceCVEs = this.initializeDeviceCVEDatabase();
    this.hardwareDegradation = this.initializeHardwareDegradationModels();
    this.bandwidthPatterns = this.initializeBandwidthPatterns();

    this.predictions = new Map();
    this.meshTopology = new Map();
  }

  /**
   * Initialize firmware EOL database for network devices
   */
  initializeFirmwareEOLDatabase() {
    return {
      'router': {
        // Major brands/models
        'Cisco ASR': { eolDate: new Date('2025-06-30'), support: 'extended', criticality: 'critical' },
        'Cisco ISR': { eolDate: new Date('2026-01-31'), support: 'standard', criticality: 'critical' },
        'MikroTik RouterOS6': { eolDate: new Date('2025-12-31'), support: 'extended', criticality: 'high' },
        'MikroTik RouterOS7': { eolDate: new Date('2028-06-30'), support: 'standard', criticality: 'high' },
        'Ubiquiti EdgeRouter': { eolDate: new Date('2025-09-30'), support: 'extended', criticality: 'medium' },
        'Ubiquiti UniFi': { eolDate: new Date('2027-03-31'), support: 'standard', criticality: 'medium' },
        'TP-Link Enterprise': { eolDate: new Date('2025-05-31'), support: 'standard', criticality: 'medium' }
      },

      'modem': {
        'Motorola SB': { eolDate: new Date('2024-12-31'), support: 'standard', criticality: 'high' },
        'Motorola MB': { eolDate: new Date('2026-06-30'), support: 'extended', criticality: 'high' },
        'Netgear DOCSIS3': { eolDate: new Date('2025-03-31'), support: 'standard', criticality: 'high' },
        'Netgear DOCSIS31': { eolDate: new Date('2027-12-31'), support: 'standard', criticality: 'high' },
        'Arris SB': { eolDate: new Date('2025-08-31'), support: 'extended', criticality: 'high' },
        'Arris MB': { eolDate: new Date('2027-09-30'), support: 'standard', criticality: 'high' }
      },

      'switch': {
        'Cisco Catalyst 2960': { eolDate: new Date('2024-03-31'), support: 'standard', criticality: 'high' },
        'Cisco Catalyst 3850': { eolDate: new Date('2027-03-31'), support: 'extended', criticality: 'critical' },
        'HP Aruba S2500': { eolDate: new Date('2025-06-30'), support: 'standard', criticality: 'high' },
        'HP Aruba S3500': { eolDate: new Date('2028-06-30'), support: 'standard', criticality: 'high' },
        'MikroTik Cloud': { eolDate: new Date('2026-12-31'), support: 'extended', criticality: 'medium' }
      },

      'wifiap': {
        'Cisco Aironet 1800': { eolDate: new Date('2024-09-30'), support: 'standard', criticality: 'medium' },
        'Cisco Aironet 1815': { eolDate: new Date('2027-03-31'), support: 'extended', criticality: 'medium' },
        'Ubiquiti UAP-AC-Pro': { eolDate: new Date('2025-12-31'), support: 'standard', criticality: 'medium' },
        'Ubiquiti UAP-AC-HD': { eolDate: new Date('2026-06-30'), support: 'standard', criticality: 'medium' },
        'TP-Link Omada EAP': { eolDate: new Date('2026-03-31'), support: 'standard', criticality: 'low' }
      },

      'moca': {
        // MOCA (Multimedia over Coaxial Alliance) adapters
        'Motorola MOCA 2.0': { eolDate: new Date('2026-12-31'), support: 'extended', criticality: 'medium' },
        'Netgear MOCA 2.0': { eolDate: new Date('2027-06-30'), support: 'standard', criticality: 'medium' },
        'Arris MOCA 2.5': { eolDate: new Date('2028-12-31'), support: 'extended', criticality: 'medium' }
      }
    };
  }

  /**
   * Initialize device CVE database
   */
  initializeDeviceCVEDatabase() {
    return {
      'Cisco': {
        recentCVEs: 8.2,  // CVEs per year
        avgSeverity: 'HIGH',
        disclosureRate: 'monthly',
        patchingSpeed: 'moderate'
      },
      'MikroTik': {
        recentCVEs: 5.1,
        avgSeverity: 'HIGH',
        disclosureRate: 'quarterly',
        patchingSpeed: 'fast'
      },
      'Ubiquiti': {
        recentCVEs: 3.2,
        avgSeverity: 'MEDIUM',
        disclosureRate: 'quarterly',
        patchingSpeed: 'moderate'
      },
      'TP-Link': {
        recentCVEs: 4.7,
        avgSeverity: 'MEDIUM',
        disclosureRate: 'quarterly',
        patchingSpeed: 'slow'
      },
      'Netgear': {
        recentCVEs: 6.3,
        avgSeverity: 'HIGH',
        disclosureRate: 'quarterly',
        patchingSpeed: 'moderate'
      },
      'Motorola': {
        recentCVEs: 3.8,
        avgSeverity: 'HIGH',
        disclosureRate: 'quarterly',
        patchingSpeed: 'slow'
      },
      'Arris': {
        recentCVEs: 4.2,
        avgSeverity: 'HIGH',
        disclosureRate: 'quarterly',
        patchingSpeed: 'moderate'
      }
    };
  }

  /**
   * Initialize hardware degradation models
   */
  initializeHardwareDegradationModels() {
    return {
      'router': {
        mtbf: 50000,  // Mean time between failures (hours)
        lifespan: 7,  // Years of typical service
        degradationRate: 0.15,  // 15% performance per year after 3 years
        thermalThreshold: 65  // Celsius
      },
      'modem': {
        mtbf: 35000,
        lifespan: 5,
        degradationRate: 0.20,
        thermalThreshold: 55
      },
      'switch': {
        mtbf: 55000,
        lifespan: 8,
        degradationRate: 0.10,
        thermalThreshold: 70
      },
      'wifiap': {
        mtbf: 30000,
        lifespan: 5,
        degradationRate: 0.18,
        thermalThreshold: 60
      },
      'moca': {
        mtbf: 40000,
        lifespan: 6,
        degradationRate: 0.12,
        thermalThreshold: 50
      }
    };
  }

  /**
   * Initialize bandwidth utilization patterns
   */
  initializeBandwidthPatterns() {
    return {
      residential: {
        avgUtilization: 0.35,
        peakHours: [18, 19, 20, 21, 22],  // 6-10 PM
        peakFactor: 2.5,
        weekdayPattern: 1.0,
        weekendPattern: 1.2,
        yearlyGrowth: 0.15  // 15% annual growth
      },
      businessMesh: {
        avgUtilization: 0.55,
        peakHours: [9, 10, 14, 15, 16],  // Business hours
        peakFactor: 1.8,
        weekdayPattern: 1.0,
        weekendPattern: 0.3,
        yearlyGrowth: 0.20  // 20% annual growth
      }
    };
  }

  /**
   * Predict network device health and risks
   */
  predictDeviceHealth(device, context = {}) {
    const key = `${device.name}@${device.model}`;

    if (this.predictions.has(key)) {
      return this.predictions.get(key);
    }

    const firmwareRisk = this.assessFirmwareRisk(device);
    const hardwareRisk = this.assessHardwareRisk(device);
    const cveRisk = this.assessCVERisk(device);

    const prediction = {
      device: device.name,
      model: device.model,
      type: device.type,
      location: device.location,

      health: {
        score: this.calculateHealthScore(firmwareRisk, hardwareRisk, cveRisk),
        level: this.getHealthLevel(this.calculateHealthScore(firmwareRisk, hardwareRisk, cveRisk)),
        components: {
          firmware: firmwareRisk,
          hardware: hardwareRisk,
          security: cveRisk
        }
      },

      firmwareStatus: this.analyzeFirmwareStatus(device),
      hardwareStatus: this.analyzeHardwareStatus(device),
      cveExposure: this.analyzeCVEExposure(device),

      recommendation: this.generateDeviceRecommendation(device, firmwareRisk, hardwareRisk, cveRisk),
      urgency: this.calculateDeviceUrgency(firmwareRisk, hardwareRisk, cveRisk),

      bandwidth: device.type === 'modem' || device.type === 'router'
        ? this.forecastBandwidthNeeds(device, context)
        : null,

      replacement: this.assessReplacementNeed(device, hardwareRisk, cveRisk)
    };

    this.predictions.set(key, prediction);
    return prediction;
  }

  /**
   * Assess firmware risk
   */
  assessFirmwareRisk(device) {
    const eolDb = this.firmwareEOL[device.type] || {};
    const modelEntry = eolDb[device.model];

    if (!modelEntry) {
      return {
        score: 50,
        status: 'UNKNOWN',
        reasoning: 'Model not in database'
      };
    }

    const now = new Date();
    const daysUntilEOL = (modelEntry.eolDate - now) / (1000 * 60 * 60 * 24);

    let score = 0;
    let status = 'UNKNOWN';

    if (daysUntilEOL < 0) {
      score = 85;  // Already past EOL
      status = 'PAST_EOL';
    } else if (daysUntilEOL < 90) {
      score = 70;  // Critical EOL
      status = 'CRITICAL_EOL';
    } else if (daysUntilEOL < 180) {
      score = 50;  // Warning EOL
      status = 'WARNING_EOL';
    } else if (daysUntilEOL < 365) {
      score = 30;  // Planning needed
      status = 'PLAN_REPLACEMENT';
    } else {
      score = 10;  // Safe
      status = 'CURRENT';
    }

    return {
      score,
      status,
      eolDate: modelEntry.eolDate,
      daysUntilEOL: Math.max(0, daysUntilEOL),
      support: modelEntry.support,
      criticality: modelEntry.criticality
    };
  }

  /**
   * Assess hardware risk
   */
  assessHardwareRisk(device) {
    const model = this.hardwareDegradation[device.type] || {};
    const ageYears = device.ageYears || 3;
    const hoursOperating = (ageYears * 365 * 24);

    let score = 0;
    let status = 'HEALTHY';
    let degradation = 0;

    // Calculate MTBF risk
    const mtbfPercentage = (hoursOperating / model.mtbf) * 100;
    if (mtbfPercentage > 80) {
      score += 40;
      status = 'HIGH_FAILURE_RISK';
    } else if (mtbfPercentage > 60) {
      score += 25;
      status = 'MODERATE_FAILURE_RISK';
    } else if (mtbfPercentage > 40) {
      score += 15;
    }

    // Calculate age-related degradation
    if (ageYears > model.lifespan) {
      score += 35;  // Beyond typical lifespan
      degradation = 100;
      status = 'BEYOND_LIFESPAN';
    } else if (ageYears > model.lifespan * 0.8) {
      score += 20;
      degradation = Math.round((ageYears / model.lifespan) * 100);
      status = 'APPROACHING_EOL';
    } else if (ageYears > 3) {
      degradation = Math.round(ageYears * model.degradationRate * 100);
      score += degradation / 5;
      status = ageYears > 5 ? 'DEGRADING' : 'AGING';
    }

    // Thermal issues
    if (device.currentTemp && device.currentTemp > model.thermalThreshold) {
      score += 20;
      status = 'THERMAL_WARNING';
    }

    return {
      score: Math.min(100, score),
      status,
      ageYears,
      degradation,
      mtbfPercentage: Math.round(mtbfPercentage),
      lifespan: model.lifespan,
      thermalStatus: device.currentTemp
        ? device.currentTemp > model.thermalThreshold * 0.9
          ? 'WARNING'
          : 'NORMAL'
        : 'UNKNOWN'
    };
  }

  /**
   * Assess CVE risk
   */
  assessCVERisk(device) {
    const vendor = this.extractVendor(device.model);
    const cveProfile = this.deviceCVEs[vendor] || { recentCVEs: 5, avgSeverity: 'MEDIUM' };

    let score = 0;

    // CVE disclosure rate
    if (cveProfile.disclosureRate === 'monthly') {
      score += 25;
    } else if (cveProfile.disclosureRate === 'quarterly') {
      score += 15;
    } else {
      score += 10;
    }

    // Patching speed
    if (cveProfile.patchingSpeed === 'slow') {
      score += 30;
    } else if (cveProfile.patchingSpeed === 'moderate') {
      score += 15;
    } else {
      score += 5;
    }

    // Severity
    if (cveProfile.avgSeverity === 'CRITICAL') {
      score += 25;
    } else if (cveProfile.avgSeverity === 'HIGH') {
      score += 15;
    } else {
      score += 5;
    }

    return {
      score: Math.min(100, score),
      vendor,
      recentCVEs: cveProfile.recentCVEs,
      avgSeverity: cveProfile.avgSeverity,
      disclosureRate: cveProfile.disclosureRate,
      patchingSpeed: cveProfile.patchingSpeed,
      riskLevel: score > 60 ? 'HIGH' : score > 40 ? 'MEDIUM' : 'LOW'
    };
  }

  /**
   * Calculate overall health score
   */
  calculateHealthScore(firmwareRisk, hardwareRisk, cveRisk) {
    // Weighted calculation
    const score = (firmwareRisk.score * 0.25) +
                  (hardwareRisk.score * 0.35) +
                  (cveRisk.score * 0.40);

    return Math.round(score);
  }

  /**
   * Get health level descriptor
   */
  getHealthLevel(score) {
    if (score >= 80) return 'CRITICAL';
    if (score >= 60) return 'POOR';
    if (score >= 40) return 'FAIR';
    if (score >= 20) return 'GOOD';
    return 'EXCELLENT';
  }

  /**
   * Analyze firmware status
   */
  analyzeFirmwareStatus(device) {
    const eolDb = this.firmwareEOL[device.type] || {};
    const entry = eolDb[device.model];

    return {
      model: device.model,
      eolDate: entry?.eolDate,
      support: entry?.support,
      status: entry
        ? new Date() > entry.eolDate
          ? 'PAST_EOL'
          : (entry.eolDate - new Date()) / (1000 * 60 * 60 * 24) < 180
            ? 'APPROACHING_EOL'
            : 'CURRENT'
        : 'UNKNOWN'
    };
  }

  /**
   * Analyze hardware status
   */
  analyzeHardwareStatus(device) {
    return {
      age: `${device.ageYears || 3} years`,
      condition: device.ageYears > 5 ? 'AGING' : 'NORMAL',
      temperature: device.currentTemp
        ? `${device.currentTemp}°C (${device.currentTemp > 60 ? 'ELEVATED' : 'NORMAL'})`
        : 'Unknown',
      expectedLifespan: this.hardwareDegradation[device.type]?.lifespan || 5
    };
  }

  /**
   * Analyze CVE exposure
   */
  analyzeCVEExposure(device) {
    const vendor = this.extractVendor(device.model);
    const cveProfile = this.deviceCVEs[vendor];

    return {
      vendor,
      estimatedActiveCVEs: Math.round(cveProfile?.recentCVEs / 4) || 1,  // Assuming 1/4 active
      severity: cveProfile?.avgSeverity,
      patchingLag: cveProfile?.patchingSpeed,
      recommendation: cveProfile?.patchingSpeed === 'slow'
        ? 'Consider replacement for security-critical locations'
        : 'Monitor for patches regularly'
    };
  }

  /**
   * Generate device recommendation
   */
  generateDeviceRecommendation(device, firmwareRisk, hardwareRisk, cveRisk) {
    const recommendations = [];

    // Firmware issues
    if (firmwareRisk.status === 'PAST_EOL') {
      recommendations.push({
        priority: 'CRITICAL',
        action: 'URGENT_REPLACEMENT',
        reasoning: 'Device is past end-of-life'
      });
    } else if (firmwareRisk.status === 'CRITICAL_EOL') {
      recommendations.push({
        priority: 'HIGH',
        action: 'PLAN_REPLACEMENT',
        reasoning: 'Device EOL in < 90 days'
      });
    }

    // Hardware issues
    if (hardwareRisk.status === 'BEYOND_LIFESPAN') {
      recommendations.push({
        priority: 'HIGH',
        action: 'PLAN_REPLACEMENT',
        reasoning: 'Device beyond expected lifespan'
      });
    }

    // CVE issues
    if (cveRisk.riskLevel === 'HIGH' && device.type === 'modem') {
      recommendations.push({
        priority: 'HIGH',
        action: 'PATCH_OR_REPLACE',
        reasoning: 'Modem security risk - critical for network perimeter'
      });
    }

    if (recommendations.length === 0) {
      recommendations.push({
        priority: 'LOW',
        action: 'MONITOR',
        reasoning: 'Device in acceptable condition'
      });
    }

    return recommendations;
  }

  /**
   * Calculate device urgency
   */
  calculateDeviceUrgency(firmwareRisk, hardwareRisk, cveRisk) {
    const maxRisk = Math.max(
      firmwareRisk.score,
      hardwareRisk.score,
      cveRisk.score
    );

    if (maxRisk >= 80) return 'IMMEDIATE';
    if (maxRisk >= 60) return 'URGENT';
    if (maxRisk >= 40) return 'PLANNED';
    return 'ROUTINE';
  }

  /**
   * Forecast bandwidth needs
   */
  forecastBandwidthNeeds(device, context = {}) {
    const pattern = context.environment === 'business'
      ? this.bandwidthPatterns.businessMesh
      : this.bandwidthPatterns.residential;

    const currentBandwidth = device.bandwidth || 1000;  // Mbps
    const projectedNeeds = [];

    for (let year = 1; year <= 3; year++) {
      const growth = Math.pow(1 + pattern.yearlyGrowth, year);
      projectedNeeds.push({
        year,
        projected: Math.round(currentBandwidth * growth),
        trend: 'INCREASING'
      });
    }

    return {
      current: currentBandwidth,
      projected3Year: projectedNeeds,
      capacity: device.maxBandwidth || 10000,
      utilizationHealth: currentBandwidth / (device.maxBandwidth || 10000) < 0.8 ? 'GOOD' : 'CONCERNING'
    };
  }

  /**
   * Assess replacement need
   */
  assessReplacementNeed(device, hardwareRisk, cveRisk) {
    const reasons = [];

    if (hardwareRisk.status === 'BEYOND_LIFESPAN') {
      reasons.push('Beyond typical lifespan');
    }

    if (cveRisk.riskLevel === 'HIGH') {
      reasons.push('High CVE/patching risk');
    }

    if (device.criticality === 'CRITICAL' && hardwareRisk.score > 50) {
      reasons.push('Critical device with deteriorating health');
    }

    return {
      recommended: reasons.length > 0,
      reasons,
      estimatedCost: this.estimateReplacementCost(device.type),
      roi: this.calculateReplaceROI(device, hardwareRisk)
    };
  }

  /**
   * Estimate replacement cost
   */
  estimateReplacementCost(deviceType) {
    const costs = {
      'router': 2000,
      'modem': 300,
      'switch': 1500,
      'wifiap': 400,
      'moca': 150
    };
    return costs[deviceType] || 500;
  }

  /**
   * Calculate replacement ROI
   */
  calculateReplaceROI(device, hardwareRisk) {
    const cost = this.estimateReplacementCost(device.type);
    const failureCost = 5000;  // Estimated business impact of device failure
    const probabilityOfFailure = Math.min(100, hardwareRisk.mtbfPercentage) / 100;
    const expectedCost = failureCost * probabilityOfFailure;

    return {
      replacementCost: cost,
      expectedCostOfFailure: Math.round(expectedCost),
      breakEven: expectedCost > cost * 1.5
    };
  }

  /**
   * Extract vendor from model string
   */
  extractVendor(model) {
    const prefixes = ['Cisco', 'MikroTik', 'Ubiquiti', 'TP-Link', 'Netgear', 'Motorola', 'Arris'];
    for (const prefix of prefixes) {
      if (model.includes(prefix)) return prefix;
    }
    return 'Unknown';
  }

  /**
   * Analyze mesh network topology
   */
  analyzeMeshTopology(devices) {
    console.log(`\n[NetworkDevicePredictor] Analyzing mesh topology with ${devices.length} devices...`);

    const topology = {
      totalDevices: devices.length,
      devicesByType: this.groupByType(devices),
      connectivity: this.analyzeConnectivity(devices),
      redundancy: this.analyzeRedundancy(devices),
      healthDistribution: this.getHealthDistribution(devices),
      criticalPath: this.identifyCriticalPath(devices),
      recommendations: this.generateTopologyRecommendations(devices)
    };

    console.log(`[NetworkDevicePredictor] Mesh analysis complete:`);
    console.log(`  Device types: ${Object.keys(topology.devicesByType).join(', ')}`);
    console.log(`  Connectivity: ${topology.connectivity.status}`);
    console.log(`  Critical devices: ${topology.criticalPath.length}`);

    return topology;
  }

  /**
   * Group devices by type
   */
  groupByType(devices) {
    const grouped = {};
    devices.forEach(device => {
      if (!grouped[device.type]) grouped[device.type] = [];
      grouped[device.type].push(device);
    });
    return grouped;
  }

  /**
   * Analyze connectivity
   */
  analyzeConnectivity(devices) {
    const routers = devices.filter(d => d.type === 'router').length;
    const modems = devices.filter(d => d.type === 'modem').length;
    const switches = devices.filter(d => d.type === 'switch').length;

    return {
      status: routers > 0 && modems > 0 ? 'CONNECTED' : 'ISOLATED',
      routers,
      modems,
      switches,
      redundancy: routers > 1 && modems > 1 ? 'REDUNDANT' : 'SINGLE_PATH'
    };
  }

  /**
   * Analyze redundancy
   */
  analyzeRedundancy(devices) {
    const byType = this.groupByType(devices);
    const redundancy = {};

    Object.entries(byType).forEach(([type, items]) => {
      redundancy[type] = {
        count: items.length,
        redundant: items.length > 1,
        backups: Math.max(0, items.length - 1)
      };
    });

    const isFullyRedundant = Object.values(redundancy)
      .every(r => r.redundant || r.count === 0);

    return {
      byType: redundancy,
      fullyRedundant: isFullyRedundant,
      vulnerablePoints: Object.entries(redundancy)
        .filter(([_, r]) => !r.redundant && r.count > 0)
        .map(([type, _]) => type)
    };
  }

  /**
   * Get health distribution
   */
  getHealthDistribution(devices) {
    const distribution = {
      EXCELLENT: [],
      GOOD: [],
      FAIR: [],
      POOR: [],
      CRITICAL: []
    };

    devices.forEach(device => {
      const prediction = this.predictDeviceHealth(device);
      distribution[prediction.health.level].push(device.name);
    });

    return distribution;
  }

  /**
   * Identify critical path (devices that affect network availability)
   */
  identifyCriticalPath(devices) {
    return devices
      .filter(d => ['modem', 'router'].includes(d.type) && d.criticality === 'CRITICAL')
      .map(d => ({
        device: d.name,
        type: d.type,
        role: 'Network Gateway'
      }));
  }

  /**
   * Generate topology recommendations
   */
  generateTopologyRecommendations(devices) {
    const recommendations = [];
    const redundancy = this.analyzeRedundancy(devices);

    // Check for single points of failure
    redundancy.vulnerablePoints.forEach(type => {
      recommendations.push({
        priority: 'HIGH',
        type: 'REDUNDANCY',
        action: `Add backup ${type} for redundancy`,
        reasoning: `Only one ${type} detected - single point of failure`
      });
    });

    // Check for aging infrastructure
    const agingDevices = devices.filter(d => d.ageYears > 5);
    if (agingDevices.length > 0) {
      recommendations.push({
        priority: 'MEDIUM',
        type: 'REPLACEMENT',
        action: `Plan replacement for ${agingDevices.length} aging devices`,
        devices: agingDevices.map(d => d.name)
      });
    }

    return recommendations;
  }
}

/**
 * Export
 */
module.exports = {
  NetworkDevicePredictor
};
