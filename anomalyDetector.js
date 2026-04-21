/**
 * Anomaly Detector - Statistical anomaly detection for webhook metrics
 * Uses Z-score, IQR, and pattern analysis to identify unusual behavior
 * 
 * @file server/services/anomalyDetector.js
 * @version 1.0.0
 */

class AnomalyDetector {
  constructor(options = {}) {
    this.sensitivityLevel = options.sensitivityLevel || 'WARNING'; // CRITICAL, WARNING, INFO
    this.historyWindow = options.historyWindow || 86400000; // 24 hours in ms
    this.minDataPoints = options.minDataPoints || 10;
    
    // Sensitivity thresholds (in standard deviations)
    this.thresholds = {
      CRITICAL: 3.0,   // 0.1% false positive rate
      WARNING: 2.0,    // 2% false positive rate
      INFO: 1.5,       // 5% false positive rate
    };

    // Anomaly types
    this.anomalyTypes = {
      SPIKE: 'Unexpected volume spike',
      DROP: 'Unexpected volume drop',
      DEGRADATION: 'Gradual performance decline',
      LATENCY_SPIKE: 'Sudden latency increase',
      ERROR_RATE_HIGH: 'Error rate above threshold',
      PATTERN_BREAK: 'Departure from cyclic pattern',
      DISTRIBUTION_SHIFT: 'Success rate distribution changed',
      CORRELATION_BREAK: 'Expected correlation failed',
    };

    this.detectedAnomalies = new Map();
  }

  /**
   * Detect anomalies in webhook metrics
   */
  detectAnomalies(webhookId, metrics, historicalData = []) {
    const anomalies = [];
    const threshold = this.thresholds[this.sensitivityLevel];

    // 1. Statistical anomaly detection
    const statsAnomalies = this.detectStatisticalAnomalies(
      metrics,
      historicalData,
      threshold
    );
    anomalies.push(...statsAnomalies);

    // 2. Pattern-based detection
    const patternAnomalies = this.detectPatternAnomalies(
      metrics,
      historicalData
    );
    anomalies.push(...patternAnomalies);

    // 3. Threshold-based detection
    const thresholdAnomalies = this.detectThresholdAnomalies(metrics);
    anomalies.push(...thresholdAnomalies);

    // 4. Time series anomaly detection
    const timeSeriesAnomalies = this.detectTimeSeriesAnomalies(
      metrics,
      historicalData
    );
    anomalies.push(...timeSeriesAnomalies);

    // Store detected anomalies
    if (anomalies.length > 0) {
      this.detectedAnomalies.set(webhookId, {
        timestamp: Date.now(),
        anomalies,
        metrics,
      });
    }

    return anomalies;
  }

  /**
   * Detect statistical anomalies using Z-score and IQR
   */
  detectStatisticalAnomalies(metrics, historicalData, threshold) {
    const anomalies = [];

    // Check event volume
    if (metrics.eventVolume !== undefined) {
      const volumes = historicalData
        .map(d => d.eventVolume)
        .filter(v => v !== undefined && v !== null);

      if (volumes.length >= this.minDataPoints) {
        const stats = this.calculateStats(volumes);
        const zScore = Math.abs((metrics.eventVolume - stats.mean) / stats.stdDev);

        if (zScore > threshold) {
          anomalies.push({
            type: metrics.eventVolume > stats.mean ? 'SPIKE' : 'DROP',
            severity: this.calculateSeverity(zScore),
            metric: 'eventVolume',
            value: metrics.eventVolume,
            expected: stats.mean,
            zscore: zScore.toFixed(2),
            message: this.anomalyTypes[metrics.eventVolume > stats.mean ? 'SPIKE' : 'DROP'],
          });
        }
      }
    }

    // Check success rate
    if (metrics.successRate !== undefined) {
      const rates = historicalData
        .map(d => d.successRate)
        .filter(r => r !== undefined && r !== null);

      if (rates.length >= this.minDataPoints) {
        const stats = this.calculateStats(rates);
        const zScore = Math.abs((metrics.successRate - stats.mean) / stats.stdDev);

        if (zScore > threshold && metrics.successRate < stats.mean) {
          anomalies.push({
            type: 'DISTRIBUTION_SHIFT',
            severity: this.calculateSeverity(zScore),
            metric: 'successRate',
            value: metrics.successRate,
            expected: stats.mean,
            zscore: zScore.toFixed(2),
            message: `Success rate dropped to ${metrics.successRate.toFixed(1)}% (expected ${stats.mean.toFixed(1)}%)`,
          });
        }
      }
    }

    // Check latency
    if (metrics.avgLatency !== undefined) {
      const latencies = historicalData
        .map(d => d.avgLatency)
        .filter(l => l !== undefined && l !== null);

      if (latencies.length >= this.minDataPoints) {
        const stats = this.calculateStats(latencies);
        const zScore = Math.abs((metrics.avgLatency - stats.mean) / stats.stdDev);

        if (zScore > threshold && metrics.avgLatency > stats.mean) {
          anomalies.push({
            type: 'LATENCY_SPIKE',
            severity: this.calculateSeverity(zScore),
            metric: 'avgLatency',
            value: metrics.avgLatency.toFixed(0),
            expected: stats.mean.toFixed(0),
            zscore: zScore.toFixed(2),
            message: `Latency spiked to ${metrics.avgLatency.toFixed(0)}ms (expected ${stats.mean.toFixed(0)}ms)`,
          });
        }
      }
    }

    // Check error rate
    if (metrics.errorRate !== undefined) {
      if (metrics.errorRate > 5) {
        anomalies.push({
          type: 'ERROR_RATE_HIGH',
          severity: metrics.errorRate > 20 ? 'CRITICAL' : 'WARNING',
          metric: 'errorRate',
          value: metrics.errorRate,
          expected: 1, // Assume <1% is normal
          message: `Error rate elevated to ${metrics.errorRate.toFixed(1)}%`,
        });
      }
    }

    return anomalies;
  }

  /**
   * Detect pattern-based anomalies
   */
  detectPatternAnomalies(metrics, historicalData) {
    const anomalies = [];

    if (historicalData.length < 20) return anomalies;

    // Get time series data
    const eventVolumes = historicalData.map(d => d.eventVolume || 0);

    // 1. Detect sudden changes
    const recentVolume = eventVolumes[eventVolumes.length - 1];
    const previousVolume = eventVolumes[eventVolumes.length - 2];

    if (previousVolume > 0) {
      const changePercent = Math.abs((recentVolume - previousVolume) / previousVolume * 100);

      if (changePercent > 100) { // More than 100% change
        anomalies.push({
          type: 'SPIKE',
          severity: changePercent > 200 ? 'CRITICAL' : 'WARNING',
          metric: 'eventVolume',
          value: recentVolume,
          expected: previousVolume,
          changePercent: changePercent.toFixed(1),
          message: `Sudden ${recentVolume > previousVolume ? 'increase' : 'decrease'} of ${changePercent.toFixed(0)}% detected`,
        });
      }
    }

    // 2. Detect gradual degradation
    const trend = this.calculateTrend(eventVolumes.slice(-10));
    if (trend.slope < -0.1 && metrics.successRate !== undefined && metrics.successRate < 95) {
      anomalies.push({
        type: 'DEGRADATION',
        severity: 'WARNING',
        metric: 'eventVolume',
        trend: 'decreasing',
        successRate: metrics.successRate,
        message: 'Gradual performance degradation detected',
      });
    }

    // 3. Detect cyclic pattern breaks
    const expectedPattern = this.detectCyclicPattern(historicalData);
    if (expectedPattern && metrics.eventVolume) {
      const deviation = Math.abs(metrics.eventVolume - expectedPattern.expected) / expectedPattern.expected;

      if (deviation > 0.4) { // 40% deviation from expected
        anomalies.push({
          type: 'PATTERN_BREAK',
          severity: 'INFO',
          metric: 'eventVolume',
          value: metrics.eventVolume,
          expected: expectedPattern.expected,
          deviation: (deviation * 100).toFixed(1),
          message: `Departure from cyclic pattern (${(deviation * 100).toFixed(0)}% deviation)`,
        });
      }
    }

    return anomalies;
  }

  /**
   * Detect threshold-based anomalies
   */
  detectThresholdAnomalies(metrics) {
    const anomalies = [];

    // SLA violation checks
    if (metrics.p95Latency && metrics.p95Latency > 1000) {
      anomalies.push({
        type: 'LATENCY_SPIKE',
        severity: metrics.p95Latency > 2000 ? 'CRITICAL' : 'WARNING',
        metric: 'p95Latency',
        value: metrics.p95Latency,
        threshold: 1000,
        message: `P95 latency exceeds SLA (${metrics.p95Latency}ms > 1000ms)`,
      });
    }

    // Success rate threshold
    if (metrics.successRate && metrics.successRate < 90) {
      anomalies.push({
        type: 'ERROR_RATE_HIGH',
        severity: metrics.successRate < 80 ? 'CRITICAL' : 'WARNING',
        metric: 'successRate',
        value: metrics.successRate,
        threshold: 90,
        message: `Success rate below threshold (${metrics.successRate.toFixed(1)}% < 90%)`,
      });
    }

    return anomalies;
  }

  /**
   * Detect time series anomalies (ARIMA-like)
   */
  detectTimeSeriesAnomalies(metrics, historicalData) {
    const anomalies = [];

    if (historicalData.length < 50) return anomalies; // Need more data

    const volumes = historicalData.map(d => d.eventVolume || 0);
    const residuals = this.calculateARIMAResiduals(volumes);

    // Check if current metrics deviate from ARIMA forecast
    if (residuals && residuals.length > 0) {
      const residualStats = this.calculateStats(residuals);
      const currentResidual = volumes[volumes.length - 1] - this.predictARIMA(volumes);

      const zScore = Math.abs(currentResidual / residualStats.stdDev);

      if (zScore > 3) { // 3-sigma rule
        anomalies.push({
          type: 'SPIKE',
          severity: 'CRITICAL',
          metric: 'timeSeriesDeviation',
          zscore: zScore.toFixed(2),
          message: `Time series deviated significantly from forecast (${zScore.toFixed(1)}σ)`,
        });
      }
    }

    return anomalies;
  }

  /**
   * Calculate basic statistics (mean, std dev, etc.)
   */
  calculateStats(values) {
    if (values.length === 0) {
      return { mean: 0, stdDev: 0, min: 0, max: 0, median: 0 };
    }

    const sorted = [...values].sort((a, b) => a - b);
    const mean = values.reduce((a, b) => a + b) / values.length;
    const variance = values.reduce((sq, n) => sq + Math.pow(n - mean, 2), 0) / values.length;
    const stdDev = Math.sqrt(variance);
    const median = sorted[Math.floor(sorted.length / 2)];
    const q1 = sorted[Math.floor(sorted.length / 4)];
    const q3 = sorted[Math.floor((sorted.length * 3) / 4)];
    const iqr = q3 - q1;

    return {
      mean: mean.toFixed(2),
      stdDev: stdDev.toFixed(2),
      median,
      min: Math.min(...values),
      max: Math.max(...values),
      q1,
      q3,
      iqr,
    };
  }

  /**
   * Calculate trend (linear regression)
   */
  calculateTrend(values) {
    if (values.length < 2) return { slope: 0, intercept: 0 };

    const n = values.length;
    const sumX = (n * (n + 1)) / 2;
    const sumXX = (n * (n + 1) * (2 * n + 1)) / 6;
    const sumY = values.reduce((a, b) => a + b);
    const sumXY = values.reduce((sum, y, i) => sum + y * (i + 1), 0);

    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;

    return { slope, intercept };
  }

  /**
   * Detect cyclic patterns (hourly/daily)
   */
  detectCyclicPattern(historicalData) {
    if (historicalData.length < 48) return null; // Need 48 data points for pattern

    const volumes = historicalData.map(d => d.eventVolume || 0);
    const recent = volumes.slice(-24); // Last 24 periods
    const previous = volumes.slice(-48, -24); // Previous 24 periods

    if (recent.length === 24 && previous.length === 24) {
      // Calculate average volume at this hour
      const avgRecent = recent.reduce((a, b) => a + b) / recent.length;
      const avgPrevious = previous.reduce((a, b) => a + b) / previous.length;

      // If similar pattern, return expected value
      if (Math.abs(avgRecent - avgPrevious) / avgPrevious < 0.2) {
        return {
          expected: (avgRecent + avgPrevious) / 2,
          pattern: 'cyclic',
        };
      }
    }

    return null;
  }

  /**
   * Calculate ARIMA residuals
   */
  calculateARIMAResiduals(values) {
    // Simplified ARIMA using exponential smoothing
    const alpha = 0.3;
    let smoothed = values[0];
    const residuals = [];

    for (let i = 1; i < values.length; i++) {
      const residual = values[i] - smoothed;
      residuals.push(residual);
      smoothed = alpha * values[i] + (1 - alpha) * smoothed;
    }

    return residuals;
  }

  /**
   * Predict using simplified ARIMA
   */
  predictARIMA(values) {
    if (values.length === 0) return 0;

    const alpha = 0.3;
    let smoothed = values[0];

    for (let i = 1; i < values.length; i++) {
      smoothed = alpha * values[i] + (1 - alpha) * smoothed;
    }

    return smoothed;
  }

  /**
   * Calculate severity level based on Z-score
   */
  calculateSeverity(zScore) {
    if (zScore > 3) return 'CRITICAL';
    if (zScore > 2) return 'WARNING';
    return 'INFO';
  }

  /**
   * Get detected anomalies
   */
  getAnomalies(webhookId = null) {
    if (webhookId) {
      return this.detectedAnomalies.get(webhookId) || null;
    }
    return Array.from(this.detectedAnomalies.values());
  }

  /**
   * Clear anomalies
   */
  clearAnomalies(webhookId = null) {
    if (webhookId) {
      this.detectedAnomalies.delete(webhookId);
    } else {
      this.detectedAnomalies.clear();
    }
  }

  /**
   * Get anomaly statistics
   */
  getAnomalyStats() {
    const stats = {
      total: 0,
      bySeverity: {
        CRITICAL: 0,
        WARNING: 0,
        INFO: 0,
      },
      byType: {},
    };

    for (const data of this.detectedAnomalies.values()) {
      for (const anomaly of data.anomalies) {
        stats.total++;
        stats.bySeverity[anomaly.severity]++;

        if (!stats.byType[anomaly.type]) {
          stats.byType[anomaly.type] = 0;
        }
        stats.byType[anomaly.type]++;
      }
    }

    return stats;
  }
}

// Create singleton instance
let anomalyDetector = null;

/**
 * Get or create anomaly detector singleton
 */
function getAnomalyDetector(options) {
  if (!anomalyDetector) {
    anomalyDetector = new AnomalyDetector(options);
  }
  return anomalyDetector;
}

module.exports = {
  AnomalyDetector,
  getAnomalyDetector,
};
