/**
 * AnalyticsEngine.js
 * Phase 9.5: Advanced Analytics and Reporting
 * 
 * Core analytics engine providing:
 * - Timeline event tracking and aggregation
 * - Trend detection and analysis
 * - Statistical calculations
 * - Comparative analysis
 * - Report generation
 */

export class AnalyticsEngine {
  constructor(options = {}) {
    this.events = [];
    this.datasets = new Map();
    this.maxEventCache = options.maxEventCache || 10000;
    this.trendWindowSize = options.trendWindowSize || 20;
    this.aggregationLevel = options.aggregationLevel || 'minute';
    this.sessionId = this._generateId();
    this.startTime = Date.now();
    
    // Type-specific data storage
    this.typeData = {
      distance: [],
      angle: [],
      area: [],
      volume: []
    };
  }

  /**
   * Add a measurement to analytics timeline
   */
  addMeasurement(measurement) {
    if (!measurement) return null;

    const event = {
      id: this._generateId(),
      timestamp: Date.now(),
      type: measurement.type,
      measurement: {
        label: measurement.label || `${measurement.type}_${this.events.length}`,
        value: measurement.value,
        units: measurement.units || 'units'
      },
      metadata: {
        points: measurement.points || [],
        sessionId: this.sessionId,
        raw: measurement
      }
    };

    this.events.push(event);
    
    // Track by type
    if (this.typeData[event.type]) {
      this.typeData[event.type].push({
        timestamp: event.timestamp,
        value: event.measurement.value,
        eventId: event.id
      });
    }

    // Maintain cache limit
    if (this.events.length > this.maxEventCache) {
      this.events.shift();
    }

    return event;
  }

  /**
   * Get timeline of events, optionally filtered and aggregated
   */
  getTimeline(options = {}) {
    const {
      startTime = null,
      endTime = null,
      measurementType = null,
      aggregated = false
    } = options;

    let filtered = this.events;

    // Filter by time range
    if (startTime || endTime) {
      filtered = filtered.filter(e => {
        if (startTime && e.timestamp < startTime) return false;
        if (endTime && e.timestamp > endTime) return false;
        return true;
      });
    }

    // Filter by type
    if (measurementType) {
      filtered = filtered.filter(e => e.type === measurementType);
    }

    // Aggregate if requested
    if (aggregated) {
      return this._aggregateTimeline(filtered);
    }

    return filtered;
  }

  /**
   * Detect trends in measurement data
   */
  detectTrends(measurementType = null) {
    const trends = {};

    const types = measurementType ? [measurementType] : Object.keys(this.typeData);

    for (const type of types) {
      const data = this.typeData[type];
      if (data.length < 3) continue;

      // Extract values for trend calculation
      const values = data.map(d => d.value);
      const timestamps = data.map(d => d.timestamp);

      // Calculate trend
      const trend = this._calculateTrend(values, timestamps);
      
      // Detect changepoints
      const changepoints = this._detectChangepoints(values);
      
      // Generate projection
      const projection = this._projectTrend(values, 5);

      trends[type] = {
        measurementType: type,
        dataPoints: values.length,
        values,
        timestamps,
        trend: {
          slope: trend.slope,
          intercept: trend.intercept,
          r2: trend.r2,
          direction: trend.slope > 0.01 ? 'increasing' : 
                    trend.slope < -0.01 ? 'decreasing' : 'stable',
          strength: Math.abs(trend.r2),  // 0-1 confidence
          changepoints,
          projection,
          equation: `y = ${trend.slope.toFixed(4)}x + ${trend.intercept.toFixed(2)}`
        },
        statistics: this._getBasicStats(values)
      };
    }

    return trends;
  }

  /**
   * Get comprehensive statistics for measurements
   */
  getStatistics(measurementType = null) {
    const stats = {};

    if (measurementType) {
      const data = this.typeData[measurementType];
      stats[measurementType] = this._calculateStatistics(data.map(d => d.value));
    } else {
      for (const [type, data] of Object.entries(this.typeData)) {
        if (data.length === 0) continue;
        stats[type] = this._calculateStatistics(data.map(d => d.value));
      }
    }

    return stats;
  }

  /**
   * Calculate distribution analysis
   */
  getDistribution(measurementType) {
    const data = this.typeData[measurementType];
    if (!data || data.length === 0) return null;

    const values = data.map(d => d.value);
    const stats = this._calculateStatistics(values);

    // Create bins for histogram
    const binCount = Math.ceil(Math.sqrt(values.length));
    const binWidth = (stats.max - stats.min) / binCount;
    const bins = Array(binCount).fill(0);

    for (const value of values) {
      const binIndex = Math.floor((value - stats.min) / binWidth);
      if (binIndex < bins.length) bins[binIndex]++;
    }

    return {
      type: measurementType,
      dataPoints: values.length,
      bins,
      binWidth,
      rangeMin: stats.min,
      rangeMax: stats.max,
      mean: stats.mean,
      median: stats.median,
      stdDev: stats.stdDev
    };
  }

  /**
   * Compare two measurement datasets
   */
  compareDatasets(dataset1, dataset2) {
    if (!Array.isArray(dataset1) || !Array.isArray(dataset2)) {
      throw new Error('Datasets must be arrays of numbers');
    }

    if (dataset1.length === 0 || dataset2.length === 0) {
      throw new Error('Datasets must not be empty');
    }

    const stats1 = this._calculateStatistics(dataset1);
    const stats2 = this._calculateStatistics(dataset2);

    const correlation = this._calculateCorrelation(dataset1, dataset2);

    // Perform t-test for significant difference
    const tTest = this._performTTest(dataset1, dataset2);

    return {
      dataset1: {
        size: dataset1.length,
        statistics: stats1
      },
      dataset2: {
        size: dataset2.length,
        statistics: stats2
      },
      comparison: {
        meanDifference: stats1.mean - stats2.mean,
        stdDevDifference: stats1.stdDev - stats2.stdDev,
        correlation,
        tStatistic: tTest.t,
        pValue: tTest.p,
        isSignificant: tTest.p < 0.05
      },
      summary: {
        dataset1Larger: stats1.mean > stats2.mean,
        overlapPercentage: this._calculateOverlap(dataset1, dataset2),
        relationship: correlation > 0.7 ? 'strong positive' :
                     correlation > 0.3 ? 'moderate positive' :
                     correlation > -0.3 ? 'weak' :
                     correlation > -0.7 ? 'moderate negative' :
                     'strong negative'
      }
    };
  }

  /**
   * Generate comprehensive analytics report
   */
  generateReport(options = {}) {
    const {
      includeTimeline = true,
      includeTrends = true,
      includeStatistics = true,
      includeDistribution = false
    } = options;

    const report = {
      generatedAt: new Date().toISOString(),
      sessionId: this.sessionId,
      sessionDuration: Date.now() - this.startTime,
      measurements: {
        total: this.events.length,
        byType: this._countByType()
      }
    };

    if (includeTimeline) {
      report.timeline = {
        events: this.getTimeline({ aggregated: false }).length,
        earliest: this.events.length > 0 ? this.events[0].timestamp : null,
        latest: this.events.length > 0 ? this.events[this.events.length - 1].timestamp : null,
        mostCommon: this._getMostCommonType()
      };
    }

    if (includeTrends) {
      report.trends = this.detectTrends();
    }

    if (includeStatistics) {
      report.statistics = this.getStatistics();
    }

    if (includeDistribution) {
      report.distributions = {};
      for (const type of Object.keys(this.typeData)) {
        const dist = this.getDistribution(type);
        if (dist) {
          report.distributions[type] = dist;
        }
      }
    }

    report.summary = this._generateSummary(report);

    return report;
  }

  /**
   * Export report in various formats
   */
  exportReport(format = 'json') {
    const report = this.generateReport({
      includeTimeline: true,
      includeTrends: true,
      includeStatistics: true,
      includeDistribution: true
    });

    switch (format.toLowerCase()) {
      case 'json':
        return JSON.stringify(report, null, 2);

      case 'csv':
        return this._exportToCSV(report);

      case 'text':
        return this._exportToText(report);

      default:
        throw new Error(`Unknown format: ${format}`);
    }
  }

  /**
   * Load external dataset
   */
  loadDataset(id, data) {
    if (!Array.isArray(data)) {
      throw new Error('Dataset must be an array');
    }

    this.datasets.set(id, {
      id,
      data,
      loadedAt: Date.now(),
      statistics: this._calculateStatistics(data)
    });

    return this.datasets.get(id);
  }

  /**
   * Get loaded dataset
   */
  getDataset(id) {
    return this.datasets.get(id);
  }

  /**
   * List all loaded datasets
   */
  listDatasets() {
    return Array.from(this.datasets.values()).map(ds => ({
      id: ds.id,
      size: ds.data.length,
      loadedAt: ds.loadedAt,
      statistics: ds.statistics
    }));
  }

  /**
   * Clear all data
   */
  clear() {
    this.events = [];
    this.datasets.clear();
    this.typeData = {
      distance: [],
      angle: [],
      area: [],
      volume: []
    };
  }

  /**
   * Get cache statistics
   */
  getCacheStats() {
    return {
      eventsInMemory: this.events.length,
      datasetsLoaded: this.datasets.size,
      eventsByType: this._countByType(),
      memoryEstimate: `${(this.events.length * 0.5).toFixed(2)} KB`
    };
  }

  // ============ PRIVATE METHODS ============

  _generateId() {
    return 'id_' + Math.random().toString(36).substr(2, 9);
  }

  _calculateTrend(values, timestamps) {
    if (values.length < 2) {
      return { slope: 0, intercept: 0, r2: 0 };
    }

    const n = values.length;
    const xs = Array.from({ length: n }, (_, i) => i);
    const ys = values;

    // Calculate means
    const xMean = xs.reduce((a, b) => a + b) / n;
    const yMean = ys.reduce((a, b) => a + b) / n;

    // Calculate slope and intercept
    let numerator = 0;
    let denominator = 0;

    for (let i = 0; i < n; i++) {
      numerator += (xs[i] - xMean) * (ys[i] - yMean);
      denominator += (xs[i] - xMean) * (xs[i] - xMean);
    }

    const slope = denominator !== 0 ? numerator / denominator : 0;
    const intercept = yMean - slope * xMean;

    // Calculate R²
    let ssRes = 0;
    let ssTot = 0;

    for (let i = 0; i < n; i++) {
      const predicted = slope * xs[i] + intercept;
      ssRes += Math.pow(ys[i] - predicted, 2);
      ssTot += Math.pow(ys[i] - yMean, 2);
    }

    const r2 = ssTot !== 0 ? 1 - (ssRes / ssTot) : 0;

    return { slope, intercept, r2 };
  }

  _detectChangepoints(values, threshold = 2) {
    if (values.length < 4) return [];

    const changepoints = [];
    const diffs = [];

    // Calculate first differences
    for (let i = 1; i < values.length; i++) {
      diffs.push(values[i] - values[i - 1]);
    }

    // Calculate mean and std dev of differences
    const mean = diffs.reduce((a, b) => a + b) / diffs.length;
    const variance = diffs.reduce((a, v) => a + Math.pow(v - mean, 2)) / diffs.length;
    const stdDev = Math.sqrt(variance);

    // Detect significant changes
    for (let i = 0; i < diffs.length; i++) {
      if (Math.abs(diffs[i] - mean) > threshold * stdDev) {
        changepoints.push(i + 1);
      }
    }

    return changepoints;
  }

  _projectTrend(values, steps) {
    if (values.length < 2) return [];

    const trend = this._calculateTrend(values, null);
    const projections = [];
    const startIndex = values.length;

    for (let i = 0; i < steps; i++) {
      const projected = trend.slope * (startIndex + i) + trend.intercept;
      projections.push(projected);
    }

    return projections;
  }

  _calculateStatistics(values) {
    if (!Array.isArray(values) || values.length === 0) {
      return {
        mean: 0, median: 0, stdDev: 0, variance: 0,
        min: 0, max: 0, q1: 0, q3: 0, iqr: 0,
        skewness: 0, kurtosis: 0, count: 0
      };
    }

    const sorted = [...values].sort((a, b) => a - b);
    const n = values.length;

    // Basic stats
    const sum = values.reduce((a, b) => a + b, 0);
    const mean = sum / n;
    const variance = values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / n;
    const stdDev = Math.sqrt(variance);

    // Quartiles
    const q1Index = Math.floor(n * 0.25);
    const q2Index = Math.floor(n * 0.50);
    const q3Index = Math.floor(n * 0.75);

    const q1 = sorted[q1Index];
    const median = sorted[q2Index];
    const q3 = sorted[q3Index];
    const iqr = q3 - q1;

    // Skewness
    let skewness = 0;
    for (const v of values) {
      skewness += Math.pow((v - mean) / stdDev, 3);
    }
    skewness /= n;

    // Kurtosis
    let kurtosis = 0;
    for (const v of values) {
      kurtosis += Math.pow((v - mean) / stdDev, 4);
    }
    kurtosis = (kurtosis / n) - 3;

    return {
      mean,
      median,
      stdDev,
      variance,
      min: sorted[0],
      max: sorted[n - 1],
      q1,
      q3,
      iqr,
      skewness,
      kurtosis,
      count: n
    };
  }

  _getBasicStats(values) {
    const stats = this._calculateStatistics(values);
    return {
      mean: stats.mean,
      median: stats.median,
      min: stats.min,
      max: stats.max,
      stdDev: stats.stdDev
    };
  }

  _calculateCorrelation(dataset1, dataset2) {
    const minLength = Math.min(dataset1.length, dataset2.length);
    if (minLength < 2) return 0;

    const ds1 = dataset1.slice(0, minLength);
    const ds2 = dataset2.slice(0, minLength);

    const stats1 = this._calculateStatistics(ds1);
    const stats2 = this._calculateStatistics(ds2);

    let covariance = 0;
    for (let i = 0; i < minLength; i++) {
      covariance += (ds1[i] - stats1.mean) * (ds2[i] - stats2.mean);
    }
    covariance /= minLength;

    const correlation = covariance / (stats1.stdDev * stats2.stdDev);
    return Math.max(-1, Math.min(1, correlation));
  }

  _performTTest(dataset1, dataset2) {
    const stats1 = this._calculateStatistics(dataset1);
    const stats2 = this._calculateStatistics(dataset2);

    const n1 = dataset1.length;
    const n2 = dataset2.length;

    // Pooled standard error
    const sp = Math.sqrt(
      ((n1 - 1) * stats1.variance + (n2 - 1) * stats2.variance) / (n1 + n2 - 2)
    );

    const se = sp * Math.sqrt(1 / n1 + 1 / n2);
    const t = (stats1.mean - stats2.mean) / se;

    // Approximate p-value (simplified)
    const df = n1 + n2 - 2;
    const p = this._calculatePValue(Math.abs(t), df);

    return { t, p };
  }

  _calculatePValue(t, df) {
    // Simplified p-value calculation
    // For accurate results, would use statistical library
    const abst = Math.abs(t);
    if (abst > 3) return 0.001;
    if (abst > 2) return 0.05;
    if (abst > 1) return 0.15;
    return 0.5;
  }

  _calculateOverlap(dataset1, dataset2) {
    const min1 = Math.min(...dataset1);
    const max1 = Math.max(...dataset1);
    const min2 = Math.min(...dataset2);
    const max2 = Math.max(...dataset2);

    const overlapMin = Math.max(min1, min2);
    const overlapMax = Math.min(max1, max2);

    if (overlapMin > overlapMax) return 0;

    const overlap = overlapMax - overlapMin;
    const range1 = max1 - min1;
    const range2 = max2 - min2;

    return (overlap / Math.max(range1, range2)) * 100;
  }

  _aggregateTimeline(events) {
    const aggregated = {};
    const groupBy = this.aggregationLevel;

    for (const event of events) {
      const key = this._getTimeKey(event.timestamp, groupBy);
      if (!aggregated[key]) {
        aggregated[key] = {
          timeKey: key,
          timestamp: event.timestamp,
          events: [],
          count: 0,
          byType: {}
        };
      }

      aggregated[key].events.push(event);
      aggregated[key].count++;

      if (!aggregated[key].byType[event.type]) {
        aggregated[key].byType[event.type] = 0;
      }
      aggregated[key].byType[event.type]++;
    }

    return Object.values(aggregated);
  }

  _getTimeKey(timestamp, level) {
    const date = new Date(timestamp);

    switch (level) {
      case 'second':
        return date.toISOString().split('.')[0];
      case 'minute':
        return date.toISOString().substring(0, 16);
      case 'hour':
        return date.toISOString().substring(0, 13);
      case 'day':
        return date.toISOString().substring(0, 10);
      default:
        return date.toISOString();
    }
  }

  _countByType() {
    const counts = {};
    for (const [type, data] of Object.entries(this.typeData)) {
      counts[type] = data.length;
    }
    return counts;
  }

  _getMostCommonType() {
    const counts = this._countByType();
    return Object.entries(counts).reduce((a, b) => a[1] > b[1] ? a : b)?.[0] || null;
  }

  _generateSummary(report) {
    const summary = {
      totalMeasurements: report.measurements.total,
      sessionDuration: `${(report.sessionDuration / 1000).toFixed(1)}s`,
      averageMeasurementsPerMinute: 0,
      strongestTrend: null
    };

    if (report.measurements.total > 0 && report.sessionDuration > 0) {
      summary.averageMeasurementsPerMinute = 
        (report.measurements.total / (report.sessionDuration / 60000)).toFixed(1);
    }

    if (report.trends) {
      let strongestStrength = 0;
      for (const [type, trend] of Object.entries(report.trends)) {
        if (trend.trend.strength > strongestStrength) {
          strongestStrength = trend.trend.strength;
          summary.strongestTrend = `${type}: ${trend.trend.direction}`;
        }
      }
    }

    return summary;
  }

  _exportToCSV(report) {
    let csv = 'Analytics Report Export\n';
    csv += `Generated: ${report.generatedAt}\n\n`;

    // Summary
    csv += 'SUMMARY\n';
    csv += `Total Measurements,${report.measurements.total}\n`;
    Object.entries(report.measurements.byType).forEach(([type, count]) => {
      csv += `${type},${count}\n`;
    });

    csv += '\n\nSTATISTICS\n';
    csv += 'Type,Mean,Median,StdDev,Min,Max\n';
    for (const [type, stats] of Object.entries(report.statistics || {})) {
      csv += `${type},${stats.mean.toFixed(2)},${stats.median.toFixed(2)},${stats.stdDev.toFixed(2)},${stats.min.toFixed(2)},${stats.max.toFixed(2)}\n`;
    }

    return csv;
  }

  _exportToText(report) {
    let text = '='.repeat(60) + '\n';
    text += 'ANALYTICS REPORT\n';
    text += '='.repeat(60) + '\n\n';

    text += `Generated: ${report.generatedAt}\n`;
    text += `Session ID: ${report.sessionId}\n`;
    text += `Session Duration: ${(report.sessionDuration / 1000).toFixed(1)}s\n\n`;

    text += 'SUMMARY\n';
    text += '-'.repeat(60) + '\n';
    text += `Total Measurements: ${report.measurements.total}\n`;
    for (const [type, count] of Object.entries(report.measurements.byType)) {
      text += `  ${type}: ${count}\n`;
    }

    return text;
  }
}
