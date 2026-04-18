/**
 * PHASE 10.9: VISUALIZATION PANEL COMPONENT
 * 
 * Main React component for 4D physics visualization
 * Integrates Phase 10 GPU renderer with React
 */

import React, { useRef, useEffect, useState } from 'react';
import { usePhase10Integration } from '../hooks/usePhase10Integration';
import '../styles/Phase10.css';

/**
 * Phase10VisualizationPanel Component
 * Renders 4D physics simulation with real-time optimization
 */
export function Phase10VisualizationPanel({
  particles = [],
  onModeChange = null,
  onError = null,
  config = {}
}) {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  
  const [displayMode, setDisplayMode] = useState('3D');
  const [showStats, setShowStats] = useState(true);
  const [showControls, setShowControls] = useState(true);
  const [quality, setQuality] = useState('high'); // low, medium, high, ultra
  const [fullscreen, setFullscreen] = useState(false);

  // Initialize Phase 10 integration
  const phase10 = usePhase10Integration(canvasRef, {
    enableGPU: config.enableGPU !== false,
    enableDiagnostics: config.enableDiagnostics !== false,
    enableCollisionVisualizer: config.enableCollisionVisualizer !== false,
    renderMode: config.renderMode || 'spheres',
    colorScheme: config.colorScheme || 'energy'
  });

  // Update particles when they change
  useEffect(() => {
    if (phase10.isInitialized && particles.length > 0) {
      phase10.updateParticles(particles);
    }
  }, [particles, phase10.isInitialized, phase10]);

  // Handle mode changes
  const handleModeSwitch = (newMode) => {
    setDisplayMode(newMode);
    phase10.switchMode(newMode, 1000);
    if (onModeChange) {
      onModeChange(newMode);
    }
  };

  // Handle fullscreen toggle
  const handleFullscreenToggle = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen?.();
      setFullscreen(true);
    } else {
      document.exitFullscreen?.();
      setFullscreen(false);
    }
  };

  // Handle render mode change
  const handleRenderModeChange = (mode) => {
    phase10.setRenderMode(mode);
  };

  // Handle color scheme change
  const handleColorSchemeChange = (scheme) => {
    phase10.setColorScheme(scheme);
  };

  // Handle quality setting
  const handleQualityChange = (newQuality) => {
    setQuality(newQuality);
    // Adjust particle rendering based on quality
    const qualitySettings = {
      'low': { maxParticles: 1000, geometry: 'points' },
      'medium': { maxParticles: 5000, geometry: 'points' },
      'high': { maxParticles: 10000, geometry: 'spheres' },
      'ultra': { maxParticles: 20000, geometry: 'spheres' }
    };
    const settings = qualitySettings[newQuality] || qualitySettings.high;
    // Apply settings
  };

  return (
    <div
      ref={containerRef}
      className={`phase10-visualization-panel ${fullscreen ? 'fullscreen' : ''}`}
    >
      {/* Canvas Container */}
      <div className="phase10-canvas-container">
        <canvas
          ref={canvasRef}
          className="phase10-canvas"
          style={{
            width: '100%',
            height: '100%',
            display: 'block',
            background: '#1a1a2e'
          }}
        />

        {/* Stats Overlay */}
        {showStats && (
          <div className="phase10-stats-overlay">
            <div className="stats-group">
              <div className="stat-item">
                <span className="stat-label">FPS:</span>
                <span className="stat-value">{phase10.stats?.fps || 0}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Mode:</span>
                <span className="stat-value">{displayMode}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Particles:</span>
                <span className="stat-value">
                  {phase10.stats?.particleCount || 0}
                </span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Speed:</span>
                <span className="stat-value">
                  {(phase10.stats?.simulationSpeed || 1).toFixed(1)}x
                </span>
              </div>
            </div>

            {/* Quality Indicator */}
            <div className="quality-indicator">
              <span>Quality: {quality}</span>
            </div>
          </div>
        )}

        {/* Mode Indicator Badge */}
        <div className={`mode-badge ${displayMode.toLowerCase()}`}>
          <span>{displayMode}</span>
          {phase10.stats?.isTransitioning && (
            <div className="transition-bar">
              <div
                className="transition-progress"
                style={{
                  width: `${(phase10.stats.transitionProgress || 0) * 100}%`
                }}
              />
            </div>
          )}
        </div>

        {/* Error Display */}
        {phase10.error && (
          <div className="phase10-error">
            <span className="error-icon">⚠️</span>
            <span className="error-message">{phase10.error}</span>
          </div>
        )}

        {/* Loading Indicator */}
        {!phase10.isInitialized && (
          <div className="phase10-loading">
            <div className="spinner"></div>
            <span>Initializing Phase 10 Engine...</span>
          </div>
        )}
      </div>

      {/* Control Bar */}
      {showControls && phase10.isInitialized && (
        <div className="phase10-control-bar">
          {/* Mode Selector */}
          <div className="control-group">
            <label>Mode:</label>
            <div className="button-group">
              <button
                className={`btn ${displayMode === '3D' ? 'active' : ''}`}
                onClick={() => handleModeSwitch('3D')}
                title="Switch to 3D classical visualization"
              >
                3D
              </button>
              <button
                className={`btn ${displayMode === '4D' ? 'active' : ''}`}
                onClick={() => handleModeSwitch('4D')}
                title="Switch to 4D relativistic visualization"
              >
                4D
              </button>
            </div>
          </div>

          {/* Render Mode Selector */}
          <div className="control-group">
            <label>Render:</label>
            <select
              onChange={(e) => handleRenderModeChange(e.target.value)}
              defaultValue="spheres"
            >
              <option value="points">Points</option>
              <option value="spheres">Spheres</option>
              <option value="trails">Trails</option>
            </select>
          </div>

          {/* Color Scheme Selector */}
          <div className="control-group">
            <label>Colors:</label>
            <select
              onChange={(e) => handleColorSchemeChange(e.target.value)}
              defaultValue="energy"
            >
              <option value="energy">Energy</option>
              <option value="temporal">Temporal</option>
              <option value="velocity">Velocity</option>
            </select>
          </div>

          {/* Quality Selector */}
          <div className="control-group">
            <label>Quality:</label>
            <select
              value={quality}
              onChange={(e) => handleQualityChange(e.target.value)}
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="ultra">Ultra</option>
            </select>
          </div>

          {/* Display Toggles */}
          <div className="control-group">
            <button
              className={`btn ${showStats ? 'active' : ''}`}
              onClick={() => setShowStats(!showStats)}
              title="Toggle statistics display"
            >
              Stats
            </button>
            <button
              className="btn"
              onClick={handleFullscreenToggle}
              title="Toggle fullscreen mode"
            >
              {fullscreen ? '⛶' : '⛶'}
            </button>
          </div>

          {/* Simulation Speed Control */}
          <div className="control-group">
            <label>Speed:</label>
            <input
              type="range"
              min="0.1"
              max="5"
              step="0.1"
              defaultValue="1"
              onChange={(e) => phase10.setSimulationSpeed(parseFloat(e.target.value))}
              title="Adjust simulation speed"
            />
          </div>
        </div>
      )}
    </div>
  );
}

export default Phase10VisualizationPanel;
