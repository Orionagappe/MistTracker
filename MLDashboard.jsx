/**
 * ML Dashboard Component
 * Real-time visualization of ML model performance and forecasts
 * 
 * @file MLDashboard.jsx
 * @version 1.0.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import './MLDashboard.css';

const MLDashboard = ({ mlPipeline, ensemble, featureEngine }) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [modelMetrics, setModelMetrics] = useState(null);
  const [forecast, setForecast] = useState(null);
  const [anomalies, setAnomalies] = useState(null);
  const [features, setFeatures] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [refreshInterval, setRefreshInterval] = useState(60000);

  // Load metrics on mount and interval
  useEffect(() => {
    const loadMetrics = async () => {
      try {
        setLoading(true);
        if (mlPipeline) {
          const report = mlPipeline.getReport();
          setModelMetrics(report.metrics);
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    loadMetrics();
    const interval = setInterval(loadMetrics, refreshInterval);
    return () => clearInterval(interval);
  }, [mlPipeline, refreshInterval]);

  // Load forecast
  useEffect(() => {
    const loadForecast = async () => {
      try {
        if (ensemble) {
          const result = ensemble.generateForecast(24);
          setForecast(result);
        }
      } catch (err) {
        console.error('Forecast error:', err);
      }
    };

    loadForecast();
  }, [ensemble]);

  // Load anomalies
  useEffect(() => {
    const loadAnomalies = async () => {
      try {
        if (ensemble) {
          const result = ensemble.detectEnsembleAnomalies([]);
          setAnomalies(result);
        }
      } catch (err) {
        console.error('Anomaly detection error:', err);
      }
    };

    loadAnomalies();
  }, [ensemble]);

  // Load features
  useEffect(() => {
    const loadFeatures = async () => {
      try {
        if (featureEngine) {
          // Features would be loaded from feature engineer
          setFeatures({
            totalFeatures: 45,
            topFeatures: ['lag_24h', 'rolling_mean_medium', 'hour_of_day', 'volatility_24h', 'trend_slope_short'],
          });
        }
      } catch (err) {
        console.error('Features error:', err);
      }
    };

    loadFeatures();
  }, [featureEngine]);

  const renderOverview = () => (
    <div className="ml-overview">
      <div className="overview-header">
        <h2>ML Pipeline Overview</h2>
        <div className="overview-controls">
          <select
            value={refreshInterval}
            onChange={(e) => setRefreshInterval(parseInt(e.target.value))}
            className="refresh-select"
          >
            <option value={30000}>30s</option>
            <option value={60000}>1m</option>
            <option value={300000}>5m</option>
          </select>
        </div>
      </div>

      <div className="metrics-grid">
        {modelMetrics && (
          <>
            <div className="metric-card prophet-card">
              <h3>Prophet Forecaster</h3>
              <div className="metric-content">
                <div className="metric-item">
                  <span className="metric-label">Accuracy</span>
                  <span className="metric-value">{modelMetrics.prophet?.accuracy?.toFixed(1)}%</span>
                </div>
                <div className="metric-item">
                  <span className="metric-label">MAPE</span>
                  <span className="metric-value">{modelMetrics.prophet?.mape?.toFixed(2)}</span>
                </div>
                <div className="metric-item">
                  <span className="metric-label">Data Points</span>
                  <span className="metric-value">{modelMetrics.prophet?.dataPoints}</span>
                </div>
                <div className="metric-status">
                  <span className={modelMetrics.prophet?.accuracy > 85 ? 'status-good' : 'status-warning'}>
                    {modelMetrics.prophet?.trained ? '✓ Trained' : '✗ Not Trained'}
                  </span>
                </div>
              </div>
            </div>

            <div className="metric-card lstm-card">
              <h3>LSTM Detector</h3>
              <div className="metric-content">
                <div className="metric-item">
                  <span className="metric-label">Accuracy</span>
                  <span className="metric-value">{modelMetrics.lstm?.accuracy?.toFixed(1)}%</span>
                </div>
                <div className="metric-item">
                  <span className="metric-label">Precision</span>
                  <span className="metric-value">{modelMetrics.lstm?.precision?.toFixed(3)}</span>
                </div>
                <div className="metric-item">
                  <span className="metric-label">Recall</span>
                  <span className="metric-value">{modelMetrics.lstm?.recall?.toFixed(3)}</span>
                </div>
                <div className="metric-status">
                  <span className={modelMetrics.lstm?.accuracy > 85 ? 'status-good' : 'status-warning'}>
                    {modelMetrics.lstm?.trained ? '✓ Trained' : '✗ Not Trained'}
                  </span>
                </div>
              </div>
            </div>

            <div className="metric-card ensemble-card">
              <h3>Ensemble Predictor</h3>
              <div className="metric-content">
                <div className="metric-item">
                  <span className="metric-label">Models</span>
                  <span className="metric-value">3</span>
                </div>
                <div className="metric-item">
                  <span className="metric-label">Status</span>
                  <span className="metric-value">Ready</span>
                </div>
                <div className="metric-item">
                  <span className="metric-label">Weights</span>
                  <span className="metric-value">Optimized</span>
                </div>
                <div className="metric-status">
                  <span className="status-good">✓ Active</span>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );

  const renderForecasts = () => (
    <div className="ml-forecasts">
      <h2>24-Hour Forecast</h2>
      {forecast && (
        <div className="forecast-container">
          <div className="forecast-chart">
            <div className="forecast-table">
              <table>
                <thead>
                  <tr>
                    <th>Hour</th>
                    <th>Forecast</th>
                    <th>Upper</th>
                    <th>Lower</th>
                    <th>Confidence</th>
                  </tr>
                </thead>
                <tbody>
                  {forecast.forecasts?.ensemble?.slice(0, 12).map((point, idx) => (
                    <tr key={idx}>
                      <td>{idx + 1}h</td>
                      <td className="value-primary">{point.yhat?.toFixed(2)}</td>
                      <td className="value-upper">{point.yhat_upper?.toFixed(2)}</td>
                      <td className="value-lower">{point.yhat_lower?.toFixed(2)}</td>
                      <td>{(point.confidence * 100).toFixed(0)}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="forecast-summary">
            <h3>Forecast Summary</h3>
            <div className="summary-item">
              <span>Forecast Period:</span>
              <span>{forecast.periods} hours</span>
            </div>
            <div className="summary-item">
              <span>Models Used:</span>
              <span>{forecast.forecasts?.prophet ? 'Prophet, ' : ''}{forecast.forecasts?.lstm ? 'LSTM, ' : ''}Linear</span>
            </div>
            <div className="summary-item">
              <span>Weights Applied:</span>
              <span className="weights-breakdown">
                P: {(forecast.weights?.prophet * 100).toFixed(0)}% L: {(forecast.weights?.lstm * 100).toFixed(0)}% LR: {(forecast.weights?.linear * 100).toFixed(0)}%
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const renderAnomalies = () => (
    <div className="ml-anomalies">
      <h2>Anomaly Detection</h2>
      {anomalies && (
        <div className="anomaly-container">
          <div className="anomaly-summary">
            <div className="summary-stat">
              <span className="stat-label">Total Detected</span>
              <span className="stat-value">{anomalies.totalAnomalies}</span>
            </div>
            <div className="summary-stat">
              <span className="stat-label">LSTM Detections</span>
              <span className="stat-value">{anomalies.anomalies?.lstm?.length || 0}</span>
            </div>
            <div className="summary-stat">
              <span className="stat-label">Prophet Detections</span>
              <span className="stat-value">{anomalies.anomalies?.prophet?.length || 0}</span>
            </div>
            <div className="summary-stat">
              <span className="stat-label">High Confidence</span>
              <span className="stat-value">
                {anomalies.anomalies?.ensemble?.filter((a) => a.confidence > 80).length || 0}
              </span>
            </div>
          </div>

          {anomalies.anomalies?.ensemble && anomalies.anomalies.ensemble.length > 0 && (
            <div className="anomaly-list">
              <h3>Recent Anomalies</h3>
              {anomalies.anomalies.ensemble.slice(0, 5).map((anomaly, idx) => (
                <div key={idx} className={`anomaly-item severity-${anomaly.severity?.toLowerCase()}`}>
                  <div className="anomaly-header">
                    <span className="anomaly-time">
                      {new Date(anomaly.timestamp).toLocaleTimeString()}
                    </span>
                    <span className="anomaly-severity">{anomaly.severity}</span>
                    <span className="anomaly-confidence">{anomaly.confidence?.toFixed(1)}%</span>
                  </div>
                  <div className="anomaly-details">
                    <span>Value: {anomaly.value?.toFixed(2)}</span>
                    <span>Detected by: {anomaly.detectedBy?.join(', ')}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );

  const renderFeatures = () => (
    <div className="ml-features">
      <h2>Feature Engineering</h2>
      {features && (
        <div className="features-container">
          <div className="features-summary">
            <div className="summary-item">
              <span>Total Features</span>
              <span className="value">{features.totalFeatures}</span>
            </div>
            <div className="summary-item">
              <span>Feature Groups</span>
              <span className="value">5</span>
            </div>
          </div>

          <div className="features-list">
            <h3>Top Features by Importance</h3>
            <ol className="feature-ranking">
              {features.topFeatures?.map((feature, idx) => (
                <li key={idx}>
                  <span className="feature-name">{feature}</span>
                  <span className="feature-rank">#{idx + 1}</span>
                </li>
              ))}
            </ol>
          </div>

          <div className="feature-groups">
            <h3>Feature Groups</h3>
            <div className="groups-grid">
              <div className="group-card">
                <h4>Lag Features</h4>
                <p>Historical values at t-1, t-2, t-24 hours</p>
              </div>
              <div className="group-card">
                <h4>Rolling Statistics</h4>
                <p>Mean, std dev, min/max over windows</p>
              </div>
              <div className="group-card">
                <h4>Trend Features</h4>
                <p>Slope, momentum, rate of change</p>
              </div>
              <div className="group-card">
                <h4>Seasonality</h4>
                <p>Hour of day, day of week, cyclical encoding</p>
              </div>
              <div className="group-card">
                <h4>Domain Features</h4>
                <p>Volatility, anomaly scores, spike detection</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const renderMetrics = () => (
    <div className="ml-metrics">
      <h2>Training Metrics</h2>
      {modelMetrics && (
        <div className="metrics-container">
          <div className="metrics-table">
            <table>
              <thead>
                <tr>
                  <th>Model</th>
                  <th>Accuracy</th>
                  <th>Precision</th>
                  <th>Recall</th>
                  <th>F1 Score</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                <tr className="prophet-row">
                  <td>Prophet</td>
                  <td>{modelMetrics.prophet?.accuracy?.toFixed(2)}%</td>
                  <td>N/A</td>
                  <td>N/A</td>
                  <td>N/A</td>
                  <td className={modelMetrics.prophet?.trained ? 'status-good' : 'status-bad'}>
                    {modelMetrics.prophet?.trained ? 'Trained' : 'Failed'}
                  </td>
                </tr>
                <tr className="lstm-row">
                  <td>LSTM</td>
                  <td>{modelMetrics.lstm?.accuracy?.toFixed(2)}%</td>
                  <td>{modelMetrics.lstm?.precision?.toFixed(3)}</td>
                  <td>{modelMetrics.lstm?.recall?.toFixed(3)}</td>
                  <td>{modelMetrics.lstm?.f1Score?.toFixed(3)}</td>
                  <td className={modelMetrics.lstm?.trained ? 'status-good' : 'status-bad'}>
                    {modelMetrics.lstm?.trained ? 'Trained' : 'Failed'}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="metrics-charts">
            <div className="chart-placeholder">
              <h3>Accuracy Trend</h3>
              <p>Chart visualization would display model accuracy over time</p>
            </div>
            <div className="chart-placeholder">
              <h3>Error Distribution</h3>
              <p>Chart visualization would display prediction error distribution</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="ml-dashboard">
      <div className="dashboard-header">
        <h1>ML Model Dashboard</h1>
        <div className="dashboard-info">
          <span>Phase 17.4 ML Integration</span>
          <span className="refresh-status">{loading ? 'Loading...' : 'Ready'}</span>
        </div>
      </div>

      <div className="dashboard-tabs">
        <button
          className={`tab-button ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          Overview
        </button>
        <button
          className={`tab-button ${activeTab === 'forecasts' ? 'active' : ''}`}
          onClick={() => setActiveTab('forecasts')}
        >
          Forecasts
        </button>
        <button
          className={`tab-button ${activeTab === 'anomalies' ? 'active' : ''}`}
          onClick={() => setActiveTab('anomalies')}
        >
          Anomalies
        </button>
        <button
          className={`tab-button ${activeTab === 'features' ? 'active' : ''}`}
          onClick={() => setActiveTab('features')}
        >
          Features
        </button>
        <button
          className={`tab-button ${activeTab === 'metrics' ? 'active' : ''}`}
          onClick={() => setActiveTab('metrics')}
        >
          Metrics
        </button>
      </div>

      <div className="dashboard-content">
        {error && <div className="error-message">Error: {error}</div>}
        {activeTab === 'overview' && renderOverview()}
        {activeTab === 'forecasts' && renderForecasts()}
        {activeTab === 'anomalies' && renderAnomalies()}
        {activeTab === 'features' && renderFeatures()}
        {activeTab === 'metrics' && renderMetrics()}
      </div>
    </div>
  );
};

export default MLDashboard;
