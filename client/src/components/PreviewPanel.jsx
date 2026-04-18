import React from 'react';
import '../styles/PreviewPanel.css';

/**
 * PreviewPanel Component
 * Phase 7.3: Live prediction display for atom builder
 * Phase 8.2: Memoized to prevent unnecessary re-renders
 * 
 * Shows resonance calculations, particle generation, and wave propagation
 * Real-time feedback during model configuration
 */

function PreviewPanel({ predictions, warnings, atoms, emitters }) {
  if (!predictions) {
    return (
      <div className="preview-panel empty">
        <div className="preview-empty-state">
          <p className="empty-icon">📊</p>
          <p className="empty-text">Add atoms and emitters to see predictions</p>
        </div>
      </div>
    );
  }

  const { emitters: emitterPredictions, totalAtoms, totalEmitters } = predictions;

  return (
    <div className="preview-panel">
      {/* Header */}
      <div className="preview-header">
        <h3>Live Predictions</h3>
        <p className="preview-subtitle">
          {totalAtoms} atoms · {totalEmitters} emitter{totalEmitters !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Warnings */}
      {warnings.length > 0 && (
        <div className="preview-warnings">
          {warnings.map((warning, idx) => (
            <div key={idx} className="warning-item">
              {warning}
            </div>
          ))}
        </div>
      )}

      {/* Emitter predictions */}
      <div className="preview-content">
        {emitterPredictions.map((emitterPred, emitterIdx) => (
          <div key={emitterIdx} className="emitter-prediction">
            {/* Emitter header */}
            <div className="emitter-header">
              <h4>Wave Emitter {emitterIdx + 1}</h4>
              <span className="emitter-meta">
                {emitterPred.frequency} Hz · {emitterPred.amplitude} A
              </span>
            </div>

            {/* Harmonic detection */}
            {emitterPred.harmonic?.detected && (
              <div className="harmonic-badge">
                ✨ {emitterPred.harmonic.order}× Harmonic Detected
              </div>
            )}

            {/* Aggregate metrics */}
            <div className="aggregate-metrics">
              <div className="metric-row">
                <span className="metric-label">Avg Coupling:</span>
                <span className="metric-value">{emitterPred.averageCoupling}%</span>
              </div>
              <div className="metric-row">
                <span className="metric-label">Total Particles:</span>
                <span className="metric-value">{emitterPred.totalParticles}%</span>
              </div>
            </div>

            {/* Per-atom predictions */}
            <div className="atoms-section">
              <h5>Per-Atom Results</h5>
              <div className="atoms-list">
                {emitterPred.atomPredictions.map((atomPred, atomIdx) => {
                  const atom = atoms.find(a => a.id === atomPred.atomId);
                  return (
                    <div key={atomIdx} className="atom-prediction">
                      <div className="atom-title">
                        {atom?.orbital_name || 'Atom'} {atomIdx + 1}
                      </div>
                      <div className="prediction-grid">
                        <div className="pred-item">
                          <span className="pred-label">Coupling</span>
                          <span className="pred-value">{atomPred.coupling}%</span>
                        </div>
                        <div className="pred-item">
                          <span className="pred-label">Particles</span>
                          <span className="pred-value">{atomPred.particleGeneration}%</span>
                        </div>
                        <div className="pred-item">
                          <span className="pred-label">Q-Factor</span>
                          <span className="pred-value">{atomPred.qualityFactor}</span>
                        </div>
                        <div className="pred-item">
                          <span className="pred-label">Displacement</span>
                          <span className="pred-value">{atomPred.displacement} m</span>
                        </div>
                        <div className="pred-item">
                          <span className="pred-label">Emission</span>
                          <span className="pred-value">{atomPred.emissionFrequency} Hz</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Wave propagation */}
            {emitterPred.propagation && (
              <div className="propagation-section">
                <h5>Wave Propagation</h5>
                <div className="propagation-chart">
                  {emitterPred.propagation.map((point, idx) => {
                    const barWidth = (point.intensity / emitterPred.amplitude) * 100;
                    return (
                      <div key={idx} className="propagation-row">
                        <span className="distance-label">{point.distance}m</span>
                        <div className="propagation-bar-container">
                          <div
                            className="propagation-bar"
                            style={{ width: `${Math.min(barWidth, 100)}%` }}
                          />
                        </div>
                        <span className="intensity-label">{point.intensity.toFixed(2)}A</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Footer info */}
      <div className="preview-footer">
        <p className="footer-text">
          💡 Predictions update in real-time. Load a demo for reference values.
        </p>
      </div>
    </div>
  );
}

// Phase 8.2: Memoize component to prevent unnecessary re-renders
// Only re-renders when predictions, warnings, atoms, or emitters actually change
export default React.memo(PreviewPanel);
