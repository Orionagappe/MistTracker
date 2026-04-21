/**
 * Phase 16.10: SimulatorTab - Refactored
 * Dual-track simulator tab using Phase 16.9 server
 * 
 * Features:
 * - Track 1 (Cached): Fast visualization with unlimited scaling
 * - Track 2 (Simulation): Research mode with accurate physics
 * - Real-time switching between tracks
 * - Unified statistics and performance monitoring
 */

import React, { useState, useEffect, useRef } from 'react';
import CachedModelVisualizer from './CachedModelVisualizer';

/**
 * SimulatorTab: Dual-track simulator interface
 * 
 * @param {Object} props
 * @param {Object} props.server - Phase 16.9 DualTrackServer instance
 * @param {Function} props.onTrackChange - Callback when track switches
 */
export function SimulatorTab({ server, onTrackChange = null }) {
  // State
  const [activeTrack, setActiveTrack] = useState('cached');
  const [mode, setMode] = useState('visualization'); // 'visualization' | 'research'
  const [particleCount, setParticleCount] = useState(100);
  const [simulationStats, setSimulationStats] = useState({});
  const [isWarning, setIsWarning] = useState(false);
  const visualizerRef = useRef(null);

  // Effect: Auto-switch track based on mode
  useEffect(() => {
    let newTrack = 'cached';

    // Research mode → prefer simulation
    if (mode === 'research') {
      newTrack = 'simulation';
      setParticleCount(300); // Limit particles
    }
    // Visualization mode → use cached
    else {
      newTrack = 'cached';
    }

    if (newTrack !== activeTrack) {
      setActiveTrack(newTrack);
      if (onTrackChange) {
        onTrackChange(newTrack);
      }
    }
  }, [mode, activeTrack, onTrackChange]);

  // Effect: Warn if particles exceed limit for simulation track
  useEffect(() => {
    if (activeTrack === 'simulation' && particleCount > 500) {
      setIsWarning(true);
    } else {
      setIsWarning(false);
    }
  }, [activeTrack, particleCount]);

  /**
   * Handle stats update from visualizer
   */
  const handleStatsUpdate = (stats) => {
    setSimulationStats(stats);
  };

  /**
   * Handle track manual switch
   */
  const handleTrackSwitch = (track) => {
    // Allow manual override, but warn about limitations
    setActiveTrack(track);

    if (track === 'simulation' && particleCount > 500) {
      setIsWarning(true);
    }

    if (onTrackChange) {
      onTrackChange(track);
    }
  };

  /**
   * Handle particle count change
   */
  const handleParticleCountChange = (count) => {
    setParticleCount(count);

    // Auto-warn if simulation + too many particles
    if (activeTrack === 'simulation' && count > 500) {
      setIsWarning(true);
    } else {
      setIsWarning(false);
    }
  };

  return (
    <div className="simulator-tab">
      {/* Header */}
      <div className="simulator-header">
        <h1>🚀 Quantum Particle Simulator (Phase 16.10)</h1>
        <p>Dual-track system: Fast visualization (Cached) or accurate physics (Simulation)</p>
      </div>

      {/* Warning Banner */}
      {isWarning && (
        <div className="warning-banner">
          <span>⚠️</span>
          <div>
            <strong>Simulation Track Limit</strong>
            <p>
              Simulation track is limited to 300-500 particles for real-time performance.
              Current: {particleCount} particles.
              Consider switching to Cached track or reducing particle count.
            </p>
          </div>
          <button onClick={() => setIsWarning(false)}>Dismiss</button>
        </div>
      )}

      {/* Main Content */}
      <div className="simulator-content">
        {/* Control Panel */}
        <div className="control-panel">
          <div className="control-section">
            <h3>⚙️ Simulation Mode</h3>
            <div className="mode-selector">
              <button
                className={`mode-btn ${mode === 'visualization' ? 'active' : ''}`}
                onClick={() => setMode('visualization')}
              >
                <span className="icon">🎨</span>
                <span>Visualization</span>
                <span className="desc">Fast & Scalable</span>
              </button>
              <button
                className={`mode-btn ${mode === 'research' ? 'active' : ''}`}
                onClick={() => setMode('research')}
              >
                <span className="icon">🔬</span>
                <span>Research</span>
                <span className="desc">Accurate Physics</span>
              </button>
            </div>
          </div>

          <div className="control-section">
            <h3>🎯 Active Track</h3>
            <div className="track-info">
              <div className={`track-badge ${activeTrack}`}>
                {activeTrack === 'cached' ? (
                  <>
                    <span className="icon">⚡</span>
                    <span>Cached Models</span>
                    <span className="note">0 FP ops, Unlimited scale</span>
                  </>
                ) : (
                  <>
                    <span className="icon">⚛️</span>
                    <span>Physics Simulation</span>
                    <span className="note">2 FP ops, ≤500 particles</span>
                  </>
                )}
              </div>

              {mode === 'visualization' && (
                <button className="track-override" onClick={() => handleTrackSwitch('simulation')}>
                  Switch to Simulation
                </button>
              )}

              {mode === 'research' && (
                <button className="track-override" onClick={() => handleTrackSwitch('cached')}>
                  Switch to Cached
                </button>
              )}
            </div>
          </div>

          <div className="control-section">
            <h3>🎛️ Parameters</h3>
            <div className="parameter">
              <label>
                Particles: <span className="value">{particleCount}</span>
              </label>
              <input
                type="range"
                min="10"
                max={activeTrack === 'cached' ? '10000' : '500'}
                value={particleCount}
                onChange={(e) => handleParticleCountChange(parseInt(e.target.value))}
                className="slider"
              />
              <div className="param-hint">
                {activeTrack === 'cached'
                  ? 'Unlimited scaling with cached models'
                  : 'Limited to 500 for real-time 60fps'}
              </div>
            </div>
          </div>

          <div className="control-section">
            <h3>📊 Active Statistics</h3>
            <div className="stats-panel">
              {Object.entries(simulationStats).map(([key, value]) => (
                <div key={key} className="stat-line">
                  <span className="stat-key">{formatStatLabel(key)}:</span>
                  <span className="stat-value">{formatStatValue(value)}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="control-section info">
            <h3>ℹ️ About</h3>
            <div className="info-text">
              <p>
                <strong>Phase 16.10:</strong> Dual-track simulator using Phase 16.9 server
              </p>
              <p>
                <strong>Visualization Mode:</strong> Uses cached precomputed models for instant results. Excellent for
                exploration and rendering.
              </p>
              <p>
                <strong>Research Mode:</strong> Uses real-time physics simulation with accurate quantum calculations.
                Best for physics validation.
              </p>
              <p>
                <strong>Integration:</strong> Powered by Phase 16.9 DualTrackServer with Phase 16.7 coordinate
                validation.
              </p>
            </div>
          </div>
        </div>

        {/* Visualizer */}
        <div className="visualizer-container">
          {server ? (
            <CachedModelVisualizer
              ref={visualizerRef}
              server={server}
              proxyId="hydrogen-proxy-v5"
              particleLimit={activeTrack === 'cached' ? Infinity : 500}
              updateRate={60}
              onStatsUpdate={handleStatsUpdate}
              onError={(err) => console.error('Visualizer error:', err)}
            />
          ) : (
            <div className="no-server">
              <p>⚠️ Server not initialized</p>
              <p>Please ensure Phase 16.9 DualTrackServer is running</p>
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        .simulator-tab {
          padding: 20px;
          background: #fafafa;
          min-height: 100vh;
        }

        .simulator-header {
          margin-bottom: 20px;
        }

        .simulator-header h1 {
          margin: 0 0 10px 0;
          color: #333;
          font-size: 24px;
        }

        .simulator-header p {
          margin: 0;
          color: #666;
          font-size: 14px;
        }

        .warning-banner {
          display: flex;
          gap: 12px;
          align-items: flex-start;
          padding: 12px 15px;
          background: #fff3cd;
          border: 1px solid #ffc107;
          border-radius: 6px;
          margin-bottom: 20px;
        }

        .warning-banner span:first-child {
          font-size: 18px;
          flex-shrink: 0;
        }

        .warning-banner strong {
          color: #856404;
        }

        .warning-banner p {
          margin: 4px 0 0 0;
          color: #856404;
          font-size: 13px;
        }

        .warning-banner button {
          margin-left: auto;
          flex-shrink: 0;
          padding: 6px 12px;
          background: #ffc107;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 12px;
          font-weight: bold;
          color: #333;
        }

        .warning-banner button:hover {
          background: #ffb300;
        }

        .simulator-content {
          display: grid;
          grid-template-columns: 300px 1fr;
          gap: 20px;
        }

        .control-panel {
          background: white;
          border: 1px solid #ddd;
          border-radius: 8px;
          padding: 15px;
          height: fit-content;
          max-height: calc(100vh - 200px);
          overflow-y: auto;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }

        .control-section {
          margin-bottom: 20px;
          padding-bottom: 15px;
          border-bottom: 1px solid #eee;
        }

        .control-section:last-child {
          border-bottom: none;
        }

        .control-section h3 {
          margin: 0 0 12px 0;
          color: #333;
          font-size: 13px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          font-weight: 600;
        }

        .control-section.info h3 {
          margin-top: 10px;
        }

        .mode-selector {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .mode-btn {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          gap: 4px;
          padding: 10px 12px;
          background: #f5f5f5;
          border: 2px solid #ddd;
          border-radius: 6px;
          cursor: pointer;
          transition: all 0.2s;
          font-size: 13px;
        }

        .mode-btn:hover {
          background: #efefef;
          border-color: #999;
        }

        .mode-btn.active {
          background: #e3f2fd;
          border-color: #2196f3;
          color: #1976d2;
        }

        .mode-btn .icon {
          font-size: 16px;
        }

        .mode-btn .desc {
          font-size: 11px;
          color: #999;
          font-weight: normal;
        }

        .mode-btn.active .desc {
          color: #1976d2;
        }

        .track-info {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .track-badge {
          display: flex;
          flex-direction: column;
          gap: 6px;
          padding: 12px;
          background: #f9f9f9;
          border: 1px solid #ddd;
          border-radius: 6px;
          font-size: 13px;
          border-left: 4px solid #2196f3;
        }

        .track-badge.simulation {
          border-left-color: #ff9800;
        }

        .track-badge .icon {
          font-size: 16px;
        }

        .track-badge .note {
          font-size: 11px;
          color: #999;
        }

        .track-override {
          padding: 8px 12px;
          background: #f0f0f0;
          border: 1px solid #ccc;
          border-radius: 4px;
          cursor: pointer;
          font-size: 12px;
          color: #666;
          width: 100%;
          transition: all 0.2s;
        }

        .track-override:hover {
          background: #e0e0e0;
          border-color: #999;
        }

        .parameter {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .parameter label {
          display: flex;
          justify-content: space-between;
          font-size: 13px;
          color: #666;
          font-weight: 500;
        }

        .parameter .value {
          color: #333;
          font-weight: bold;
        }

        .slider {
          width: 100%;
          cursor: pointer;
        }

        .param-hint {
          font-size: 11px;
          color: #999;
          margin-top: 4px;
        }

        .stats-panel {
          display: flex;
          flex-direction: column;
          gap: 6px;
          font-size: 12px;
        }

        .stat-line {
          display: flex;
          justify-content: space-between;
          padding: 4px 0;
        }

        .stat-key {
          color: #666;
        }

        .stat-value {
          color: #333;
          font-family: 'Courier New', monospace;
          font-weight: bold;
        }

        .info-text {
          font-size: 12px;
          color: #666;
          line-height: 1.6;
        }

        .info-text p {
          margin: 8px 0;
        }

        .info-text strong {
          color: #333;
        }

        .visualizer-container {
          background: white;
          border: 1px solid #ddd;
          border-radius: 8px;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
          min-height: 600px;
        }

        .no-server {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 600px;
          color: #999;
          font-size: 14px;
        }

        @media (max-width: 1200px) {
          .simulator-content {
            grid-template-columns: 1fr;
          }

          .control-panel {
            max-height: none;
          }
        }
      `}</style>
    </div>
  );
}

/**
 * Helper: Format stat label for display
 */
function formatStatLabel(key) {
  return key
    .split(/(?=[A-Z])/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Helper: Format stat value for display
 */
function formatStatValue(value) {
  if (typeof value === 'number') {
    if (value > 1000) {
      return (value / 1000).toFixed(2) + 'k';
    }
    if (Number.isInteger(value)) {
      return value.toString();
    }
    return value.toFixed(2);
  }
  if (typeof value === 'object' && value !== null) {
    return JSON.stringify(value);
  }
  return String(value);
}

export default SimulatorTab;
