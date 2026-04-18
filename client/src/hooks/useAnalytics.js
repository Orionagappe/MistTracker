/**
 * useAnalytics.js
 * Phase 9.5: React hooks for analytics
 * 
 * Provides:
 * - useAnalytics: Main hook for analytics management
 * - useTrendAnalysis: Trend-specific operations
 * - useComparison: Dataset comparison
 * - useStatistics: Statistics and distribution
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { AnalyticsEngine } from '../utils/AnalyticsEngine';

/**
 * Main analytics hook
 */
export function useAnalytics(measurementEngine, options = {}) {
  const engineRef = useRef(new AnalyticsEngine(options));
  const [events, setEvents] = useState([]);
  const [report, setReport] = useState(null);
  const [trends, setTrends] = useState({});
  const [statistics, setStatistics] = useState({});
  const [selectedTimeRange, setSelectedTimeRange] = useState({
    start: null,
    end: null
  });

  const engine = engineRef.current;

  /**
   * Add measurement to analytics
   */
  const addMeasurement = useCallback((measurement) => {
    const event = engine.addMeasurement(measurement);
    setEvents([...engine.events]);
    return event;
  }, [engine]);

  /**
   * Get timeline with optional filtering
   */
  const getTimeline = useCallback((filter = {}) => {
    return engine.getTimeline({
      startTime: selectedTimeRange.start,
      endTime: selectedTimeRange.end,
      ...filter
    });
  }, [engine, selectedTimeRange]);

  /**
   * Analyze trends
   */
  const analyzeTrends = useCallback((measurementType = null) => {
    const trendData = engine.detectTrends(measurementType);
    setTrends(trendData);
    return trendData;
  }, [engine]);

  /**
   * Get statistical analysis
   */
  const analyzeStatistics = useCallback((measurementType = null) => {
    const stats = engine.getStatistics(measurementType);
    setStatistics(stats);
    return stats;
  }, [engine]);

  /**
   * Get distribution for a measurement type
   */
  const getDistribution = useCallback((measurementType) => {
    return engine.getDistribution(measurementType);
  }, [engine]);

  /**
   * Load external dataset
   */
  const loadDataset = useCallback((id, data) => {
    return engine.loadDataset(id, data);
  }, [engine]);

  /**
   * Compare two datasets
   */
  const compareDatasets = useCallback((ds1, ds2) => {
    return engine.compareDatasets(ds1, ds2);
  }, [engine]);

  /**
   * Generate full report
   */
  const generateReport = useCallback((includeOptions = {}) => {
    const fullReport = engine.generateReport({
      includeTimeline: true,
      includeTrends: true,
      includeStatistics: true,
      includeDistribution: false,
      ...includeOptions
    });
    setReport(fullReport);
    return fullReport;
  }, [engine]);

  /**
   * Export report
   */
  const exportReport = useCallback((format = 'json') => {
    return engine.exportReport(format);
  }, [engine]);

  /**
   * Set time range for filtering
   */
  const setTimeRange = useCallback((start, end) => {
    setSelectedTimeRange({ start, end });
  }, []);

  /**
   * Clear time range filter
   */
  const clearTimeRange = useCallback(() => {
    setSelectedTimeRange({ start: null, end: null });
  }, []);

  /**
   * Clear all analytics data
   */
  const clear = useCallback(() => {
    engine.clear();
    setEvents([]);
    setReport(null);
    setTrends({});
    setStatistics({});
  }, [engine]);

  /**
   * Get cache statistics
   */
  const getCacheStats = useCallback(() => {
    return engine.getCacheStats();
  }, [engine]);

  /**
   * List loaded datasets
   */
  const listDatasets = useCallback(() => {
    return engine.listDatasets();
  }, [engine]);

  return {
    // State
    events,
    report,
    trends,
    statistics,
    selectedTimeRange,
    
    // Timeline operations
    addMeasurement,
    getTimeline,
    setTimeRange,
    clearTimeRange,
    
    // Analysis operations
    analyzeTrends,
    analyzeStatistics,
    getDistribution,
    
    // Dataset operations
    loadDataset,
    compareDatasets,
    listDatasets,
    
    // Reporting
    generateReport,
    exportReport,
    
    // Management
    clear,
    getCacheStats,
    
    // Direct access to engine for advanced use
    engine
  };
}

/**
 * Hook for trend analysis
 */
export function useTrendAnalysis(data = []) {
  const [trends, setTrends] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const calculateTrends = useCallback((values) => {
    setIsLoading(true);
    setError(null);

    try {
      if (!Array.isArray(values) || values.length < 2) {
        throw new Error('Invalid data for trend analysis');
      }

      // Calculate trend using linear regression
      const n = values.length;
      const xs = Array.from({ length: n }, (_, i) => i);
      const ys = values;

      const xMean = xs.reduce((a, b) => a + b) / n;
      const yMean = ys.reduce((a, b) => a + b) / n;

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

      // Detect direction
      const direction = slope > 0.01 ? 'increasing' :
                       slope < -0.01 ? 'decreasing' : 'stable';

      setTrends({
        slope,
        intercept,
        r2,
        direction,
        strength: Math.abs(r2),
        equation: `y = ${slope.toFixed(4)}x + ${intercept.toFixed(2)}`
      });
    } catch (err) {
      setError(err.message);
      setTrends(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Recalculate when data changes
  useEffect(() => {
    if (data.length > 0) {
      calculateTrends(data);
    }
  }, [data, calculateTrends]);

  return {
    trends,
    isLoading,
    error,
    calculateTrends
  };
}

/**
 * Hook for dataset comparison
 */
export function useComparison() {
  const [datasets, setDatasets] = useState(new Map());
  const [comparisonResult, setComparisonResult] = useState(null);
  const [isComparing, setIsComparing] = useState(false);

  /**
   * Add a dataset to comparison pool
   */
  const addDataset = useCallback((id, data, label = '') => {
    setDatasets(prev => new Map([
      ...prev,
      [id, { id, data, label, addedAt: Date.now() }]
    ]));
  }, []);

  /**
   * Remove a dataset
   */
  const removeDataset = useCallback((id) => {
    setDatasets(prev => {
      const next = new Map(prev);
      next.delete(id);
      return next;
    });
  }, []);

  /**
   * Compare two datasets
   */
  const compareTwoDatasets = useCallback((id1, id2) => {
    setIsComparing(true);

    try {
      const ds1 = datasets.get(id1);
      const ds2 = datasets.get(id2);

      if (!ds1 || !ds2) {
        throw new Error('One or both datasets not found');
      }

      // Perform comparison
      const minLength = Math.min(ds1.data.length, ds2.data.length);
      const aligned1 = ds1.data.slice(0, minLength);
      const aligned2 = ds2.data.slice(0, minLength);

      const stats1 = calculateBasicStats(aligned1);
      const stats2 = calculateBasicStats(aligned2);

      const correlation = calculateCorrelation(aligned1, aligned2);

      setComparisonResult({
        dataset1: { label: ds1.label, stats: stats1 },
        dataset2: { label: ds2.label, stats: stats2 },
        correlation,
        meanDiff: stats1.mean - stats2.mean,
        aligned: true,
        alignedLength: minLength
      });
    } catch (error) {
      console.error('Comparison failed:', error);
      setComparisonResult(null);
    } finally {
      setIsComparing(false);
    }
  }, [datasets]);

  /**
   * List available datasets
   */
  const listDatasets = useCallback(() => {
    return Array.from(datasets.values()).map(ds => ({
      id: ds.id,
      label: ds.label,
      size: ds.data.length,
      addedAt: ds.addedAt
    }));
  }, [datasets]);

  /**
   * Clear all datasets
   */
  const clearDatasets = useCallback(() => {
    setDatasets(new Map());
    setComparisonResult(null);
  }, []);

  return {
    datasets: listDatasets(),
    comparisonResult,
    isComparing,
    addDataset,
    removeDataset,
    compareDatasets: compareTwoDatasets,
    clearDatasets
  };
}

/**
 * Hook for statistics and distribution analysis
 */
export function useStatistics(data = []) {
  const [stats, setStats] = useState(null);
  const [distribution, setDistribution] = useState(null);

  /**
   * Calculate statistics
   */
  const calculateStats = useCallback(() => {
    if (!Array.isArray(data) || data.length === 0) {
      setStats(null);
      return;
    }

    const sorted = [...data].sort((a, b) => a - b);
    const n = data.length;

    const sum = data.reduce((a, b) => a + b, 0);
    const mean = sum / n;
    const variance = data.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / n;
    const stdDev = Math.sqrt(variance);

    const q1 = sorted[Math.floor(n * 0.25)];
    const median = sorted[Math.floor(n * 0.50)];
    const q3 = sorted[Math.floor(n * 0.75)];

    const newStats = {
      count: n,
      sum,
      mean,
      median,
      mode: findMode(data),
      min: sorted[0],
      max: sorted[n - 1],
      range: sorted[n - 1] - sorted[0],
      q1,
      q3,
      iqr: q3 - q1,
      variance,
      stdDev,
      skewness: calculateSkewness(data, mean, stdDev),
      kurtosis: calculateKurtosis(data, mean, stdDev)
    };

    setStats(newStats);

    // Calculate distribution
    const binCount = Math.ceil(Math.sqrt(n));
    const binWidth = (newStats.max - newStats.min) / binCount || 1;
    const bins = Array(binCount).fill(0);

    for (const value of data) {
      const binIndex = Math.floor((value - newStats.min) / binWidth);
      if (binIndex < bins.length) bins[binIndex]++;
    }

    setDistribution({
      bins,
      binWidth,
      binCount,
      min: newStats.min,
      max: newStats.max
    });
  }, [data]);

  // Recalculate when data changes
  useEffect(() => {
    calculateStats();
  }, [data, calculateStats]);

  return {
    stats,
    distribution,
    calculateStats
  };
}

/**
 * Hook for exporting analytics data
 */
export function useAnalyticsExport() {
  const [isExporting, setIsExporting] = useState(false);
  const [exportResult, setExportResult] = useState(null);

  const exportData = useCallback((data, format = 'json', filename = null) => {
    setIsExporting(true);

    try {
      let content = '';

      if (format === 'json') {
        content = JSON.stringify(data, null, 2);
      } else if (format === 'csv') {
        content = convertToCSV(data);
      } else {
        throw new Error(`Unsupported format: ${format}`);
      }

      const blob = new Blob([content], { 
        type: format === 'json' ? 'application/json' : 'text/csv' 
      });

      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename || `analytics-${Date.now()}.${format}`;

      setExportResult({
        blob,
        url,
        filename: link.download,
        size: blob.size,
        type: blob.type
      });

      return { blob, url, filename: link.download };
    } catch (error) {
      console.error('Export failed:', error);
      setExportResult(null);
      throw error;
    } finally {
      setIsExporting(false);
    }
  }, []);

  const triggerDownload = useCallback((data, format = 'json') => {
    const result = exportData(data, format);
    if (result) {
      const link = document.createElement('a');
      link.href = result.url;
      link.download = result.filename;
      link.click();
      URL.revokeObjectURL(result.url);
    }
  }, [exportData]);

  return {
    isExporting,
    exportResult,
    exportData,
    triggerDownload
  };
}

// ============ UTILITY FUNCTIONS ============

function calculateBasicStats(values) {
  if (!Array.isArray(values) || values.length === 0) {
    return { mean: 0, median: 0, min: 0, max: 0, stdDev: 0 };
  }

  const sorted = [...values].sort((a, b) => a - b);
  const n = values.length;
  const sum = values.reduce((a, b) => a + b, 0);
  const mean = sum / n;
  const variance = values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / n;

  return {
    mean,
    median: sorted[Math.floor(n / 2)],
    min: sorted[0],
    max: sorted[n - 1],
    stdDev: Math.sqrt(variance),
    count: n
  };
}

function calculateCorrelation(ds1, ds2) {
  const len = Math.min(ds1.length, ds2.length);
  if (len < 2) return 0;

  const stats1 = calculateBasicStats(ds1);
  const stats2 = calculateBasicStats(ds2);

  let covariance = 0;
  for (let i = 0; i < len; i++) {
    covariance += (ds1[i] - stats1.mean) * (ds2[i] - stats2.mean);
  }
  covariance /= len;

  const correlation = covariance / (stats1.stdDev * stats2.stdDev);
  return Math.max(-1, Math.min(1, correlation));
}

function findMode(values) {
  const counts = {};
  let maxCount = 0;
  let mode = values[0];

  for (const value of values) {
    counts[value] = (counts[value] || 0) + 1;
    if (counts[value] > maxCount) {
      maxCount = counts[value];
      mode = value;
    }
  }

  return mode;
}

function calculateSkewness(values, mean, stdDev) {
  let sum = 0;
  for (const v of values) {
    sum += Math.pow((v - mean) / stdDev, 3);
  }
  return sum / values.length;
}

function calculateKurtosis(values, mean, stdDev) {
  let sum = 0;
  for (const v of values) {
    sum += Math.pow((v - mean) / stdDev, 4);
  }
  return (sum / values.length) - 3;
}

function convertToCSV(data) {
  let csv = '';
  
  if (Array.isArray(data)) {
    if (data.length === 0) return csv;

    const headers = Object.keys(data[0]);
    csv += headers.join(',') + '\n';

    for (const row of data) {
      csv += headers.map(h => {
        const value = row[h];
        return typeof value === 'string' && value.includes(',') 
          ? `"${value}"` 
          : value;
      }).join(',') + '\n';
    }
  } else if (typeof data === 'object') {
    for (const [key, value] of Object.entries(data)) {
      csv += `${key},${value}\n`;
    }
  }

  return csv;
}

export default useAnalytics;
