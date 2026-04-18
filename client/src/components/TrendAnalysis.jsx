/**
 * TrendAnalysis.jsx
 * Phase 9.5: Trend visualization and analysis
 * 
 * Features:
 * - Trend line visualization
 * - Direction and strength indicators
 * - Moving average overlay
 * - Changepoint detection
 * - Projection display
 */

import React, { useMemo, useState } from 'react';
import '../styles/Analytics.css';

function TrendAnalysis({
  data = [],
  type = 'distance',
  showMovingAverage = true,
  movingAverageWindow = 5,
  showProjection = true,
  projectionSteps = 5,
  onTrendDetected
}) {
  const [selectedMetrics, setSelectedMetrics] = useState({
    slope: true,
    strength: true,
    changepoints: true,
    projection: true
  });

  /**
   * Calculate moving average
   */
  const calculateMovingAverage = (values, window) => {
    const result = [];
    for (let i = 0; i < values.length; i++) {
      if (i < window - 1) {
        result.push(null);
      } else {
        const slice = values.slice(i - window + 1, i + 1);
        const avg = slice.reduce((a, b) => a + b, 0) / slice.length;
        result.push(avg);
      }
    }
    return result;
  };

  /**
   * Calculate trend statistics
   */
  const trendStats = useMemo(() => {
    if (!Array.isArray(data) || data.length < 2) {
      return null;
    }

    const values = data;
    const n = values.length;

    // Linear regression
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

    // R²
    let ssRes = 0;
    let ssTot = 0;

    for (let i = 0; i < n; i++) {
      const predicted = slope * xs[i] + intercept;
      ssRes += Math.pow(ys[i] - predicted, 2);
      ssTot += Math.pow(ys[i] - yMean, 2);
    }

    const r2 = ssTot !== 0 ? 1 - (ssRes / ssTot) : 0;

    // Direction
    const direction = slope > 0.01 ? 'Increasing' :
                     slope < -0.01 ? 'Decreasing' : 'Stable';

    // Trend points for visualization
    const trendPoints = [];
    const yMin = Math.min(...values);
    const yMax = Math.max(...values);

    trendPoints.push({ x: 0, y: intercept });
    trendPoints.push({ x: n - 1, y: slope * (n - 1) + intercept });

    // Detect changepoints
    const changepoints = [];
    const diffs = [];

    for (let i = 1; i < n; i++) {
      diffs.push(values[i] - values[i - 1]);
    }

    const meanDiff = diffs.reduce((a, b) => a + b) / diffs.length;
    const varDiff = diffs.reduce((sum, d) => sum + Math.pow(d - meanDiff, 2)) / diffs.length;
    const stdDevDiff = Math.sqrt(varDiff);
    const threshold = 2;

    for (let i = 0; i < diffs.length; i++) {
      if (Math.abs(diffs[i] - meanDiff) > threshold * stdDevDiff) {
        changepoints.push(i + 1);
      }
    }

    // Projection
    const projection = [];
    for (let i = 0; i < projectionSteps; i++) {
      projection.push(slope * (n + i) + intercept);
    }

    const stats = {
      slope: slope.toFixed(4),
      intercept: intercept.toFixed(2),
      r2: r2.toFixed(4),
      strength: (r2 * 100).toFixed(1),
      direction,
      equation: `y = ${slope.toFixed(4)}x + ${intercept.toFixed(2)}`,
      changepoints,
      projection,
      trendPoints,
      min: Math.min(...values).toFixed(2),
      max: Math.max(...values).toFixed(2),
      mean: (values.reduce((a, b) => a + b) / n).toFixed(2),
      variance: (values.reduce((sum, v) => sum + Math.pow(v - yMean, 2), 0) / n).toFixed(2)
    };

    onTrendDetected?.(stats);
    return stats;
  }, [data, projectionSteps, onTrendDetected]);

  /**
   * Calculate moving average
   */
  const movingAverage = useMemo(() => {
    if (!showMovingAverage || !trendStats) return null;
    return calculateMovingAverage(data, movingAverageWindow);
  }, [data, showMovingAverage, movingAverageWindow, trendStats]);

  if (!trendStats) {
    return (
      <div className="trend-analysis empty">
        <p>📊 Insufficient data for trend analysis (minimum 2 points required)</p>
      </div>
    );
  }

  /**
   * Render simple ASCII chart
   */
  const renderChart = () => {
    const chartHeight = 10;
    const chartWidth = 40;
    
    const min = Math.min(...data);
    const max = Math.max(...data);
    const range = max - min || 1;

    const lines = Array(chartHeight).fill('');

    // Plot actual values
    for (let i = 0; i < Math.min(data.length, chartWidth); i++) {
      const normalized = (data[i] - min) / range;
      const y = Math.floor((1 - normalized) * (chartHeight - 1));
      if (y >= 0 && y < chartHeight) {
        lines[y] = lines[y] + '●';
      }
    }

    return lines.map((line, i) => (
      <div key={i} style={{ fontFamily: 'monospace', fontSize: '10px' }}>
        {line || ' '}
      </div>
    ));
  };

  return (
    <div className="trend-analysis-container">
      {/* Header */}
      <div className="trend-header">
        <h3>📈 Trend Analysis: {type}</h3>
        <div className={`trend-badge ${trendStats.direction.toLowerCase()}`}>
          {trendStats.direction}
        </div>
      </div>

      {/* Main Metrics Grid */}
      <div className="trend-metrics-grid">
        <div className="metric-card">
          <div className="metric-label">Slope</div>
          <div className="metric-value" style={{ fontSize: '1.5em' }}>
            {trendStats.slope}
          </div>
          <div className="metric-sub">units per step</div>
        </div>

        <div className="metric-card">
          <div className="metric-label">Strength (R²)</div>
          <div className="metric-value" style={{ fontSize: '1.5em' }}>
            {trendStats.strength}%
          </div>
          <div className="metric-sub">goodness of fit</div>
        </div>

        <div className="metric-card">
          <div className="metric-label">Direction</div>
          <div className="metric-value" style={{ fontSize: '1.5em' }}>
            {trendStats.direction === 'Increasing' ? '↗' :
             trendStats.direction === 'Decreasing' ? '↘' : '→'}
          </div>
          <div className="metric-sub">{trendStats.direction}</div>
        </div>

        <div className="metric-card">
          <div className="metric-label">Changepoints</div>
          <div className="metric-value" style={{ fontSize: '1.5em' }}>
            {trendStats.changepoints.length}
          </div>
          <div className="metric-sub">significant changes</div>
        </div>
      </div>

      {/* Equation and Statistics */}
      <div className="trend-equation-box">
        <code>{trendStats.equation}</code>
      </div>

      {/* Chart */}
      <div className="trend-chart">
        <div className="chart-title">Trend Visualization</div>
        <div className="chart-area">
          {renderChart()}
        </div>
      </div>

      {/* Data Summary */}
      <div className="trend-summary">
        <h4>Data Summary</h4>
        <div className="summary-grid">
          <div className="summary-item">
            <span className="label">Min:</span>
            <span className="value">{trendStats.min}</span>
          </div>
          <div className="summary-item">
            <span className="label">Max:</span>
            <span className="value">{trendStats.max}</span>
          </div>
          <div className="summary-item">
            <span className="label">Mean:</span>
            <span className="value">{trendStats.mean}</span>
          </div>
          <div className="summary-item">
            <span className="label">Variance:</span>
            <span className="value">{trendStats.variance}</span>
          </div>
        </div>
      </div>

      {/* Changepoints */}
      {trendStats.changepoints.length > 0 && (
        <div className="changepoints-section">
          <h4>Significant Changepoints</h4>
          <div className="changepoints-list">
            {trendStats.changepoints.slice(0, 5).map((cp, i) => (
              <div key={i} className="changepoint-badge">
                Position {cp}
              </div>
            ))}
            {trendStats.changepoints.length > 5 && (
              <div className="changepoint-badge more">
                +{trendStats.changepoints.length - 5} more
              </div>
            )}
          </div>
        </div>
      )}

      {/* Projection */}
      {showProjection && trendStats.projection.length > 0 && (
        <div className="projection-section">
          <h4>Trend Projection (Next {projectionSteps} Steps)</h4>
          <div className="projection-chart">
            {trendStats.projection.map((value, i) => (
              <div key={i} className="projection-bar">
                <div className="bar-value">{value.toFixed(2)}</div>
                <div className="bar-label">+{i + 1}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Moving Average Info */}
      {showMovingAverage && (
        <div className="moving-average-info">
          <small>💡 Moving average (window: {movingAverageWindow}) smooths short-term fluctuations</small>
        </div>
      )}

      {/* Metrics Toggle */}
      <div className="metrics-toggle">
        <label>
          <input
            type="checkbox"
            checked={selectedMetrics.slope}
            onChange={(e) => setSelectedMetrics({ ...selectedMetrics, slope: e.target.checked })}
          />
          Show Slope
        </label>
        <label>
          <input
            type="checkbox"
            checked={selectedMetrics.strength}
            onChange={(e) => setSelectedMetrics({ ...selectedMetrics, strength: e.target.checked })}
          />
          Show Strength
        </label>
        <label>
          <input
            type="checkbox"
            checked={selectedMetrics.changepoints}
            onChange={(e) => setSelectedMetrics({ ...selectedMetrics, changepoints: e.target.checked })}
          />
          Show Changepoints
        </label>
        <label>
          <input
            type="checkbox"
            checked={selectedMetrics.projection}
            onChange={(e) => setSelectedMetrics({ ...selectedMetrics, projection: e.target.checked })}
          />
          Show Projection
        </label>
      </div>
    </div>
  );
}

export default TrendAnalysis;
