#!/usr/bin/env node
/**
 * Phase 53C: Bridge Correlation Monitor
 * ═════════════════════════════════════════════════════════════════════════════
 * 
 * Real-time monitoring of bridge correlation metrics.
 * - Threshold: Alert if correlation < 0.70
 * - Continuous status dashboard
 * - Historical trend tracking
 * - Alert event logging
 * 
 * Execution: node phase-53c-correlation-monitor.cjs [--interval=60]
 * Output: phase-53-results/phase-53c-monitoring-dashboard.json
 */

const fs = require('fs');
const path = require('path');

// ═════════════════════════════════════════════════════════════════════════════
// CONFIGURATION
// ═════════════════════════════════════════════════════════════════════════════

const DATASET_PATH = 'phase-17-data/bridge-dataset-v1.json';
const CHECKPOINT_PATH = 'phase-53-results/phase-53b-dataset-checkpoint.json';
const OUTPUT_DIR = 'phase-53-results';
const MONITOR_DASHBOARD = path.join(OUTPUT_DIR, 'phase-53c-monitoring-dashboard.json');
const ALERT_LOG = path.join(OUTPUT_DIR, 'phase-53c-alert-log.json');

const CORRELATION_ALERT_THRESHOLD = 0.70;
const COHERENCE_WARNING_THRESHOLD = 0.90;
const POLL_INTERVAL = parseInt(process.argv[2]?.split('=')[1] || '60') * 1000;

// ═════════════════════════════════════════════════════════════════════════════
// CORRELATION MONITOR
// ═════════════════════════════════════════════════════════════════════════════

class BridgeCorrelationMonitor {
  constructor() {
    this.dashboard = {
      monitoring_start: new Date().toISOString(),
      poll_count: 0,
      alerts: [],
      historical_measurements: []
    };
    this.previousCorrelation = null;
    this.alertEvents = [];
  }

  /**
   * Load dataset and extract correlation
   */
  loadAndAnalyze() {
    let dataset = null;
    let dataPath = null;

    // Try checkpoint first (most recent), then original
    if (fs.existsSync(CHECKPOINT_PATH)) {
      dataPath = CHECKPOINT_PATH;
    } else if (fs.existsSync(DATASET_PATH)) {
      dataPath = DATASET_PATH;
    }

    if (!dataPath) {
      throw new Error('No dataset found');
    }

    const rawData = fs.readFileSync(dataPath, 'utf-8');
    dataset = JSON.parse(rawData);

    return { dataset, dataPath };
  }

  /**
   * Calculate correlation from paired findings
   */
  calculateCorrelation(pairedFindings) {
    if (!pairedFindings || pairedFindings.length < 2) {
      return { correlation: null, sample_size: 0 };
    }

    const linguisticScores = [];
    const physicalScores = [];

    for (const pair of pairedFindings) {
      if (pair.linguistic?.emergence_signature && pair.physical?.emergence_signature) {
        const lingScore = this.signatureToScore(pair.linguistic.emergence_signature);
        const physScore = this.signatureToScore(pair.physical.emergence_signature);
        
        linguisticScores.push(lingScore);
        physicalScores.push(physScore);
      }
    }

    if (linguisticScores.length < 2) {
      return { correlation: null, sample_size: 0 };
    }

    const correlation = this.calculatePearson(linguisticScores, physicalScores);
    
    return {
      correlation: correlation,
      sample_size: linguisticScores.length,
      linguistic_mean: linguisticScores.reduce((a, b) => a + b, 0) / linguisticScores.length,
      physical_mean: physicalScores.reduce((a, b) => a + b, 0) / physicalScores.length
    };
  }

  /**
   * Convert emergence signature to single score
   */
  signatureToScore(signature) {
    if (!signature) return 0;
    return (
      signature.complexity * 0.3 +
      (signature.hierarchical_depth / 10) * 0.25 +
      signature.information_gain * 0.25 +
      signature.emergence_potential * 0.2
    );
  }

  /**
   * Calculate Pearson correlation coefficient
   */
  calculatePearson(arr1, arr2) {
    if (arr1.length !== arr2.length || arr1.length === 0) return 0;

    const n = arr1.length;
    const mean1 = arr1.reduce((a, b) => a + b, 0) / n;
    const mean2 = arr2.reduce((a, b) => a + b, 0) / n;

    let numerator = 0;
    let denominator1 = 0;
    let denominator2 = 0;

    for (let i = 0; i < n; i++) {
      const dev1 = arr1[i] - mean1;
      const dev2 = arr2[i] - mean2;
      numerator += dev1 * dev2;
      denominator1 += dev1 * dev1;
      denominator2 += dev2 * dev2;
    }

    const denominator = Math.sqrt(denominator1 * denominator2);
    return denominator === 0 ? 0 : numerator / denominator;
  }

  /**
   * Calculate coherence metrics
   */
  analyzeCoherence(pairedFindings) {
    const coherences = pairedFindings
      .map(p => p.coherence)
      .filter(c => c !== undefined && c !== null);

    if (coherences.length === 0) {
      return { mean: 0, min: 0, max: 0 };
    }

    const sorted = [...coherences].sort((a, b) => a - b);
    const mean = coherences.reduce((a, b) => a + b, 0) / coherences.length;

    return {
      mean: mean,
      median: sorted.length % 2 === 0
        ? (sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2
        : sorted[Math.floor(sorted.length / 2)],
      min: Math.min(...coherences),
      max: Math.max(...coherences)
    };
  }

  /**
   * Analyze domain distribution
   */
  analyzeDomainDistribution(pairedFindings) {
    const domains = {};
    
    for (const pair of pairedFindings) {
      if (pair.domain) {
        domains[pair.domain] = (domains[pair.domain] || 0) + 1;
      }
    }

    return domains;
  }

  /**
   * Generate alert if threshold breached
   */
  checkAlertConditions(measurement) {
    const alerts = [];

    if (measurement.correlation !== null && measurement.correlation < CORRELATION_ALERT_THRESHOLD) {
      alerts.push({
        severity: 'CRITICAL',
        type: 'CORRELATION_LOW',
        threshold: CORRELATION_ALERT_THRESHOLD,
        actual: measurement.correlation,
        message: `Bridge correlation dropped to ${measurement.correlation.toFixed(4)} (threshold: ${CORRELATION_ALERT_THRESHOLD})`
      });
    }

    if (measurement.coherence?.mean < COHERENCE_WARNING_THRESHOLD) {
      alerts.push({
        severity: 'WARNING',
        type: 'COHERENCE_DEGRADED',
        threshold: COHERENCE_WARNING_THRESHOLD,
        actual: measurement.coherence.mean,
        message: `Mean coherence: ${measurement.coherence.mean.toFixed(4)} (below ${COHERENCE_WARNING_THRESHOLD})`
      });
    }

    if (this.previousCorrelation !== null && 
        measurement.correlation !== null &&
        (measurement.correlation - this.previousCorrelation) < -0.1) {
      alerts.push({
        severity: 'WARNING',
        type: 'CORRELATION_TREND_DROP',
        change: measurement.correlation - this.previousCorrelation,
        message: `Correlation dropped by ${Math.abs((measurement.correlation - this.previousCorrelation)).toFixed(4)}`
      });
    }

    return alerts;
  }

  /**
   * Record measurement
   */
  recordMeasurement() {
    try {
      const { dataset, dataPath } = this.loadAndAnalyze();

      const correlationAnalysis = this.calculateCorrelation(dataset.paired_findings);
      const coherenceAnalysis = this.analyzeCoherence(dataset.paired_findings);
      const domainDistribution = this.analyzeDomainDistribution(dataset.paired_findings);

      const measurement = {
        timestamp: new Date().toISOString(),
        data_source: dataPath,
        correlation_analysis: correlationAnalysis,
        coherence_analysis: coherenceAnalysis,
        domain_distribution: domainDistribution,
        dataset_size: dataset.paired_findings.length,
        expansion_status: `${dataset.paired_findings.length}/250`
      };

      // Check for alerts
      const alerts = this.checkAlertConditions(measurement);
      if (alerts.length > 0) {
        measurement.alerts = alerts;
        this.alertEvents.push(...alerts.map(a => ({
          ...a,
          timestamp: measurement.timestamp,
          correlation: correlationAnalysis.correlation
        })));
      }

      this.dashboard.poll_count++;
      this.dashboard.last_measurement = measurement;
      this.dashboard.historical_measurements.push({
        timestamp: measurement.timestamp,
        correlation: correlationAnalysis.correlation,
        coherence_mean: coherenceAnalysis.mean,
        dataset_size: dataset.paired_findings.length,
        alerts: alerts.length > 0
      });

      // Keep only last 100 measurements
      if (this.dashboard.historical_measurements.length > 100) {
        this.dashboard.historical_measurements.shift();
      }

      this.previousCorrelation = correlationAnalysis.correlation;

      return measurement;
    } catch (error) {
      console.error(`Monitor error: ${error.message}`);
      return null;
    }
  }

  /**
   * Print dashboard status
   */
  printDashboard(measurement) {
    if (!measurement) return;

    const status = measurement.correlation_analysis.correlation < CORRELATION_ALERT_THRESHOLD 
      ? '🔴 ALERT'
      : measurement.correlation_analysis.correlation > 0.85
      ? '🟢 EXCELLENT'
      : '🟡 GOOD';

    console.log(`
┌${'─'.repeat(78)}┐
│ 📊 BRIDGE CORRELATION MONITOR - ${new Date().toLocaleTimeString()}
├${'─'.repeat(78)}┤
│ Status: ${status}
│ Correlation: ${measurement.correlation_analysis.correlation?.toFixed(4) || 'N/A'} (threshold: ${CORRELATION_ALERT_THRESHOLD})
│ Sample size: ${measurement.correlation_analysis.sample_size}
│ Mean coherence: ${measurement.coherence_analysis.mean?.toFixed(4) || 'N/A'}
│ Dataset size: ${measurement.dataset_size}
│ Domains: ${Object.keys(measurement.domain_distribution).length}
│ Alerts: ${measurement.alerts?.length || 0}
└${'─'.repeat(78)}┘
    `);

    if (measurement.alerts && measurement.alerts.length > 0) {
      console.log('⚠️  ACTIVE ALERTS:');
      for (const alert of measurement.alerts) {
        console.log(`  [${alert.severity}] ${alert.message}`);
      }
      console.log('');
    }
  }

  /**
   * Start monitoring loop
   */
  startMonitoring(durationSeconds = 300) {
    const endTime = Date.now() + (durationSeconds * 1000);

    console.log(`\n${'═'.repeat(80)}`);
    console.log('⚡ PHASE 53C: BRIDGE CORRELATION MONITOR');
    console.log(`${'═'.repeat(80)}`);
    console.log(`Monitoring duration: ${durationSeconds} seconds`);
    console.log(`Poll interval: ${POLL_INTERVAL / 1000} seconds`);
    console.log(`Alert threshold: ${CORRELATION_ALERT_THRESHOLD}\n`);

    const pollLoop = setInterval(() => {
      const measurement = this.recordMeasurement();
      this.printDashboard(measurement);

      if (Date.now() >= endTime) {
        clearInterval(pollLoop);
        this.finalize();
      }
    }, POLL_INTERVAL);
  }

  /**
   * Finalize monitoring and save reports
   */
  finalize() {
    console.log(`\n${'═'.repeat(80)}`);
    console.log('🏁 MONITORING SESSION COMPLETE');
    console.log(`${'═'.repeat(80)}`);
    console.log(`Total polls: ${this.dashboard.poll_count}`);
    console.log(`Total alerts: ${this.alertEvents.length}\n`);

    // Save dashboard
    if (!fs.existsSync(OUTPUT_DIR)) {
      fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    }

    fs.writeFileSync(MONITOR_DASHBOARD, JSON.stringify(this.dashboard, null, 2));
    console.log(`📊 Dashboard saved: ${MONITOR_DASHBOARD}`);

    if (this.alertEvents.length > 0) {
      fs.writeFileSync(ALERT_LOG, JSON.stringify(this.alertEvents, null, 2));
      console.log(`⚠️  Alerts saved: ${ALERT_LOG}`);
    }

    process.exit(0);
  }
}

// ═════════════════════════════════════════════════════════════════════════════
// MAIN EXECUTION
// ═════════════════════════════════════════════════════════════════════════════

const monitor = new BridgeCorrelationMonitor();

// Run monitoring for 5 minutes by default (adjustable)
const durationSeconds = process.argv[3] ? parseInt(process.argv[3]) : 300;
monitor.startMonitoring(durationSeconds);
