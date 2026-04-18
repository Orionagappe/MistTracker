/**
 * PHASE 10.9: DIAGNOSTICS PANEL COMPONENT
 * 
 * Real-time physics system health monitoring
 * Conservation laws, anomalies, causality verification
 */

import React, { useState, useEffect } from 'react';
import '../styles/Phase10.css';

/**
 * Phase10DiagnosticsPanel Component
 * Monitors physics system health and displays metrics
 */
export function Phase10DiagnosticsPanel({
  module = null,
  particles = [],
  updateInterval = 1000
}) {
  const [diagnostics, setDiagnostics] = useState({
    energyConserved: true,
    momentumConserved: true,
    massConserved: true,
    causalityViolations: 0,
    systemHealth: 100,
    anomalies: [],
    timestamp: Date.now()
  });

  const [showHistory, setShowHistory] = useState(false);
  const [history, setHistory] = useState([]);

  // Update diagnostics periodically
  useEffect(() => {
    const interval = setInterval(() => {
      if (module) {
        const diags = module.getDiagnostics();
        if (diags) {
          setDiagnostics(prev => ({
            ...diags,
            timestamp: Date.now()
          }));

          // Keep history of last 10 updates
          setHistory(prev => [...prev.slice(-9), diags]);
        }
      }
    }, updateInterval);

    return () => clearInterval(interval);
  }, [module, updateInterval]);

  // Get health indicator color
  const getHealthColor = (health) => {
    if (health >= 90) return '#00ff88'; // Green
    if (health >= 70) return '#ffff00'; // Yellow
    if (health >= 50) return '#ff8800'; // Orange
    return '#ff0000'; // Red
  };

  // Get health indicator icon
  const getHealthIcon = (health) => {
    if (health >= 90) return '✓';
    if (health >= 70) return '⚠';
    return '✕';
  };

  return (
    <div className="phase10-diagnostics-panel">
      <div className="panel-header">
        <h2>System Diagnostics</h2>
      </div>

      <div className="panel-content">
        {/* System Health Overview */}
        <section className="diagnostic-section">
          <h3>System Health</h3>

          <div className="health-meter">
            <div className="health-bar-container">
              <div
                className="health-bar"
                style={{
                  width: `${diagnostics.systemHealth}%`,
                  backgroundColor: getHealthColor(diagnostics.systemHealth)
                }}
              />
            </div>
            <div className="health-display">
              <span className="health-score">{diagnostics.systemHealth}%</span>
              <span className="health-status">
                {getHealthIcon(diagnostics.systemHealth)} {
                  diagnostics.systemHealth >= 90 ? 'Optimal' :
                  diagnostics.systemHealth >= 70 ? 'Good' :
                  diagnostics.systemHealth >= 50 ? 'Degraded' :
                  'Critical'
                }
              </span>
            </div>
          </div>
        </section>

        {/* Conservation Laws */}
        <section className="diagnostic-section">
          <h3>Conservation Laws</h3>

          <div className="conservation-checks">
            <div className="conservation-item energy">
              <div className="check-icon" style={{
                color: diagnostics.energyConserved ? '#00ff88' : '#ff6666'
              }}>
                {diagnostics.energyConserved ? '✓' : '✕'}
              </div>
              <div className="check-label">Energy Conservation</div>
              <div className="check-status">
                {diagnostics.energyConserved ? 'Conserved' : 'Violated'}
              </div>
            </div>

            <div className="conservation-item momentum">
              <div className="check-icon" style={{
                color: diagnostics.momentumConserved ? '#00ff88' : '#ff6666'
              }}>
                {diagnostics.momentumConserved ? '✓' : '✕'}
              </div>
              <div className="check-label">Momentum Conservation</div>
              <div className="check-status">
                {diagnostics.momentumConserved ? 'Conserved' : 'Violated'}
              </div>
            </div>

            <div className="conservation-item mass">
              <div className="check-icon" style={{
                color: diagnostics.massConserved ? '#00ff88' : '#ff6666'
              }}>
                {diagnostics.massConserved ? '✓' : '✕'}
              </div>
              <div className="check-label">Mass Conservation</div>
              <div className="check-status">
                {diagnostics.massConserved ? 'Conserved' : 'Violated'}
              </div>
            </div>
          </div>
        </section>

        {/* Anomalies */}
        <section className="diagnostic-section">
          <h3>Anomalies</h3>

          <div className="anomalies-count">
            <span className="count-display">
              {diagnostics.anomalies?.length || 0} detected
            </span>
          </div>

          {diagnostics.anomalies && diagnostics.anomalies.length > 0 ? (
            <div className="anomalies-list">
              {diagnostics.anomalies.slice(-5).map((anomaly, idx) => (
                <div key={idx} className="anomaly-item">
                  <div className="anomaly-severity" style={{
                    backgroundColor: anomaly.severity === 'critical' ? '#ff0000' :
                                     anomaly.severity === 'warning' ? '#ffaa00' : '#00ff88'
                  }} />
                  <div className="anomaly-info">
                    <div className="anomaly-type">{anomaly.type}</div>
                    <div className="anomaly-message">{anomaly.message}</div>
                    <div className="anomaly-time">
                      {new Date(anomaly.timestamp).toLocaleTimeString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="no-anomalies">No anomalies detected</p>
          )}
        </section>

        {/* Causality Verification */}
        <section className="diagnostic-section">
          <h3>Causality Verification</h3>

          <div className="causality-info">
            <div className="causality-stat">
              <span className="stat-label">Light-Cone Violations:</span>
              <span className="stat-value" style={{
                color: diagnostics.causalityViolations === 0 ? '#00ff88' : '#ff6666'
              }}>
                {diagnostics.causalityViolations}
              </span>
            </div>
            <div className="causality-status">
              {diagnostics.causalityViolations === 0 ? (
                <span style={{ color: '#00ff88' }}>✓ Causality maintained</span>
              ) : (
                <span style={{ color: '#ff6666' }}>✕ Causality violated</span>
              )}
            </div>
          </div>
        </section>

        {/* Performance Metrics */}
        <section className="diagnostic-section">
          <h3>Performance Metrics</h3>

          <div className="metrics-grid">
            <div className="metric-item">
              <span className="metric-label">Particles</span>
              <span className="metric-value">{particles.length}</span>
            </div>
            <div className="metric-item">
              <span className="metric-label">Update Freq</span>
              <span className="metric-value">{(1000 / updateInterval).toFixed(1)} Hz</span>
            </div>
            <div className="metric-item">
              <span className="metric-label">Last Update</span>
              <span className="metric-value">
                {((Date.now() - diagnostics.timestamp) / 1000).toFixed(2)}s ago
              </span>
            </div>
          </div>
        </section>

        {/* History */}
        <section className="diagnostic-section">
          <button
            className="history-toggle"
            onClick={() => setShowHistory(!showHistory)}
          >
            {showHistory ? '▼' : '▶'} Historical Data ({history.length} records)
          </button>

          {showHistory && history.length > 0 && (
            <div className="history-chart">
              <div className="health-timeline">
                {history.map((h, idx) => (
                  <div
                    key={idx}
                    className="health-point"
                    style={{
                      backgroundColor: getHealthColor(h.systemHealth || 100),
                      opacity: 0.3 + (idx / history.length) * 0.7
                    }}
                    title={`${h.systemHealth || 100}%`}
                  />
                ))}
              </div>
            </div>
          )}
        </section>

        {/* Recommendations */}
        <section className="diagnostic-section">
          <h3>Recommendations</h3>

          <div className="recommendations-list">
            {diagnostics.systemHealth < 70 && (
              <div className="recommendation warning">
                <span className="rec-icon">⚠</span>
                <span className="rec-text">System health is degraded. Consider reducing particle count or increasing time step.</span>
              </div>
            )}

            {!diagnostics.energyConserved && (
              <div className="recommendation error">
                <span className="rec-icon">✕</span>
                <span className="rec-text">Energy conservation violated. Check collision response parameters.</span>
              </div>
            )}

            {diagnostics.causalityViolations > 0 && (
              <div className="recommendation error">
                <span className="rec-icon">✕</span>
                <span className="rec-text">Causality violations detected. Reduce simulation speed or increase accuracy.</span>
              </div>
            )}

            {diagnostics.systemHealth >= 90 && !diagnostics.anomalies?.length && (
              <div className="recommendation success">
                <span className="rec-icon">✓</span>
                <span className="rec-text">All systems operating normally.</span>
              </div>
            )}
          </div>
        </section>
      </div>

      <div className="panel-footer">
        <small>Last update: {new Date(diagnostics.timestamp).toLocaleTimeString()}</small>
      </div>
    </div>
  );
}

// Continued in next part...

/**
 * Phase10MeasurementsPanel Component
 * Displays detailed 4D measurements and statistics
 */
export function Phase10MeasurementsPanel({
  module = null,
  particles = [],
  selectedParticleIndex = null
}) {
  const [measurements, setMeasurements] = useState({
    minkowskiDistances: {},
    spacetimeIntervals: {},
    hypervolume: 0,
    lorentzFactors: {},
    angleData: {}
  });

  // Update measurements periodically
  React.useEffect(() => {
    const interval = setInterval(() => {
      if (module) {
        const m = module.getMeasurements();
        if (m) {
          setMeasurements(m);
        }
      }
    }, 500);

    return () => clearInterval(interval);
  }, [module]);

  return (
    <div className="phase10-measurements-panel">
      <div className="panel-header">
        <h2>4D Measurements</h2>
      </div>

      <div className="panel-content">
        {/* Minkowski Distance */}
        <section className="measurement-section">
          <h3>Minkowski Distances</h3>
          {particles.length < 2 ? (
            <p className="empty-message">Need at least 2 particles to calculate distances</p>
          ) : (
            <div className="distance-summary">
              <div className="measurement-item">
                <span className="measurement-label">Pair Count:</span>
                <span className="measurement-value">{particles.length * (particles.length - 1) / 2}</span>
              </div>
              {measurements.minkowskiDistances && Object.entries(measurements.minkowskiDistances).slice(0, 5).map(([key, value]) => (
                <div key={key} className="measurement-item">
                  <span className="measurement-label">{key}:</span>
                  <span className="measurement-value">{value?.toFixed(3)}</span>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Spacetime Intervals */}
        <section className="measurement-section">
          <h3>Spacetime Intervals</h3>
          <div className="intervals-grid">
            {measurements.spacetimeIntervals && Object.entries(measurements.spacetimeIntervals).map(([key, interval]) => (
              <div key={key} className="interval-item">
                <div className="interval-type">{interval.type}</div>
                <div className="interval-value">{interval.value?.toFixed(3)}</div>
              </div>
            ))}
          </div>
        </section>

        {/* Hypervolume */}
        <section className="measurement-section">
          <h3>System Properties</h3>
          <div className="system-props">
            <div className="prop-item">
              <span className="prop-label">Hypervolume:</span>
              <span className="prop-value">{measurements.hypervolume?.toFixed(2)}</span>
            </div>
            <div className="prop-item">
              <span className="prop-label">Particle Count:</span>
              <span className="prop-value">{particles.length}</span>
            </div>
          </div>
        </section>

        {/* Lorentz Factors */}
        {selectedParticleIndex !== null && particles[selectedParticleIndex] && (
          <section className="measurement-section">
            <h3>Relativistic Parameters (Particle {selectedParticleIndex})</h3>
            <div className="relativistic-props">
              {measurements.lorentzFactors && Object.entries(measurements.lorentzFactors).map(([key, factor]) => (
                <div key={key} className="rel-prop">
                  <span className="rel-label">{key}:</span>
                  <span className="rel-value">{factor?.toFixed(4)}</span>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>

      <div className="panel-footer">
        <small>Measurements are approximate. Check conservation laws in Diagnostics.</small>
      </div>
    </div>
  );
}

export default Phase10DiagnosticsPanel;
