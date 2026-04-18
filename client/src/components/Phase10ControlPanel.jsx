/**
 * PHASE 10.9: CONTROL PANEL COMPONENT
 * 
 * Comprehensive controls for Phase 10 simulation
 * Mode switching, simulation control, visualization options
 */

import React, { useState, useCallback } from 'react';
import '../styles/Phase10.css';

/**
 * Phase10ControlPanel Component
 * Main control interface for 4D physics simulation
 */
export function Phase10ControlPanel({
  module,
  onModeChange = null,
  onSimulationStateChange = null,
  currentMode = '3D',
  isPlaying = true,
  simulationSpeed = 1.0
}) {
  // State
  const [mode, setMode] = useState(currentMode);
  const [playing, setPlaying] = useState(isPlaying);
  const [speed, setSpeed] = useState(simulationSpeed);
  const [renderMode, setRenderMode] = useState('spheres');
  const [colorScheme, setColorScheme] = useState('energy');
  const [showGrid, setShowGrid] = useState(true);
  const [showAxes, setShowAxes] = useState(true);
  const [selectedPreset, setSelectedPreset] = useState('custom');

  // Presets
  const presets = {
    'binary-collision': {
      description: 'Binary particle collision',
      particleCount: 2,
      particleConfig: {}
    },
    'orbital-system': {
      description: 'Multi-body orbital system',
      particleCount: 10,
      particleConfig: {}
    },
    'spacetime-wave': {
      description: 'Gravitational wave propagation',
      particleCount: 100,
      particleConfig: {}
    },
    'quantum-superposition': {
      description: 'Quantum superposition field',
      particleCount: 500,
      particleConfig: {}
    }
  };

  // Mode switching handler
  const handleModeSwitch = useCallback((newMode) => {
    setMode(newMode);
    if (module) {
      module.switchMode(newMode, 1000);
    }
    if (onModeChange) {
      onModeChange(newMode);
    }
  }, [module, onModeChange]);

  // Play/pause handler
  const handlePlayPause = useCallback(() => {
    const newState = !playing;
    setPlaying(newState);
    if (module) {
      module.setSimulationRunning(newState);
    }
    if (onSimulationStateChange) {
      onSimulationStateChange({ isPlaying: newState });
    }
  }, [playing, module, onSimulationStateChange]);

  // Speed change handler
  const handleSpeedChange = useCallback((newSpeed) => {
    setSpeed(newSpeed);
    if (module) {
      module.setSimulationSpeed(newSpeed);
    }
    if (onSimulationStateChange) {
      onSimulationStateChange({ speed: newSpeed });
    }
  }, [module, onSimulationStateChange]);

  // Render mode handler
  const handleRenderModeChange = useCallback((newMode) => {
    setRenderMode(newMode);
    if (module) {
      module.setRenderMode(newMode);
    }
    if (onSimulationStateChange) {
      onSimulationStateChange({ renderMode: newMode });
    }
  }, [module, onSimulationStateChange]);

  // Color scheme handler
  const handleColorSchemeChange = useCallback((newScheme) => {
    setColorScheme(newScheme);
    if (module) {
      module.setColorScheme(newScheme);
    }
    if (onSimulationStateChange) {
      onSimulationStateChange({ colorScheme: newScheme });
    }
  }, [module, onSimulationStateChange]);

  // Preset selector handler
  const handlePresetSelect = useCallback((presetName) => {
    setSelectedPreset(presetName);
    const preset = presets[presetName];
    // Load preset simulation
    console.log(`Loading preset: ${presetName}`, preset);
  }, [presets]);

  return (
    <div className="phase10-control-panel">
      <div className="panel-header">
        <h2>Physics Control Panel</h2>
      </div>

      <div className="panel-content">
        {/* Mode Section */}
        <section className="control-section">
          <h3>Visualization Mode</h3>
          <div className="mode-selector">
            <button
              className={`mode-btn ${mode === '3D' ? 'active' : ''}`}
              onClick={() => handleModeSwitch('3D')}
              title="Classical 3D Euclidean space visualization"
            >
              <span className="mode-label">3D Classical</span>
              <span className="mode-desc">Euclidean space</span>
            </button>
            <button
              className={`mode-btn ${mode === '4D' ? 'active' : ''}`}
              onClick={() => handleModeSwitch('4D')}
              title="4D spacetime relativistic visualization"
            >
              <span className="mode-label">4D Relativistic</span>
              <span className="mode-desc">Minkowski space</span>
            </button>
          </div>
          <div className="mode-info">
            <p className="info-text">
              {mode === '3D'
                ? 'Classical 3D visualization with Newtonian physics'
                : '4D spacetime visualization with relativistic effects'}
            </p>
          </div>
        </section>

        {/* Simulation Control Section */}
        <section className="control-section">
          <h3>Simulation Control</h3>

          {/* Play/Pause */}
          <div className="control-item">
            <button
              className={`play-pause-btn ${playing ? 'playing' : 'paused'}`}
              onClick={handlePlayPause}
              title={playing ? 'Pause simulation' : 'Play simulation'}
            >
              {playing ? '⏸ Pause' : '▶ Play'}
            </button>
          </div>

          {/* Speed Control */}
          <div className="control-item">
            <label>Simulation Speed</label>
            <div className="speed-control">
              <input
                type="range"
                min="0.1"
                max="5"
                step="0.1"
                value={speed}
                onChange={(e) => handleSpeedChange(parseFloat(e.target.value))}
                className="speed-slider"
                title="Adjust simulation speed multiplier"
              />
              <span className="speed-value">{speed.toFixed(1)}x</span>
            </div>
            <div className="speed-presets">
              {[0.5, 1, 2, 5].map(sp => (
                <button
                  key={sp}
                  className={`preset-btn ${speed === sp ? 'active' : ''}`}
                  onClick={() => handleSpeedChange(sp)}
                >
                  {sp}x
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* Visualization Options Section */}
        <section className="control-section">
          <h3>Visualization Options</h3>

          {/* Render Mode */}
          <div className="control-item">
            <label>Render Mode</label>
            <select
              value={renderMode}
              onChange={(e) => handleRenderModeChange(e.target.value)}
              className="form-select"
            >
              <option value="points">Points (Fastest)</option>
              <option value="spheres">Spheres (Balanced)</option>
              <option value="trails">Trails (Detailed)</option>
            </select>
          </div>

          {/* Color Scheme */}
          <div className="control-item">
            <label>Color Encoding</label>
            <select
              value={colorScheme}
              onChange={(e) => handleColorSchemeChange(e.target.value)}
              className="form-select"
            >
              <option value="energy">Energy Level</option>
              <option value="temporal">Temporal Evolution</option>
              <option value="velocity">Velocity Magnitude</option>
            </select>
            <div className="color-preview">
              <div className="color-gradient"></div>
            </div>
          </div>

          {/* Display Toggles */}
          <div className="control-item">
            <label>Display Elements</label>
            <div className="toggle-group">
              <button
                className={`toggle-btn ${showGrid ? 'active' : ''}`}
                onClick={() => setShowGrid(!showGrid)}
              >
                {showGrid ? '✓' : '○'} Grid
              </button>
              <button
                className={`toggle-btn ${showAxes ? 'active' : ''}`}
                onClick={() => setShowAxes(!showAxes)}
              >
                {showAxes ? '✓' : '○'} Axes
              </button>
            </div>
          </div>
        </section>

        {/* Preset Simulations Section */}
        <section className="control-section">
          <h3>Preset Simulations</h3>
          <div className="preset-selector">
            {Object.entries(presets).map(([key, preset]) => (
              <button
                key={key}
                className={`preset-card ${selectedPreset === key ? 'active' : ''}`}
                onClick={() => handlePresetSelect(key)}
              >
                <span className="preset-name">{key.replace('-', ' ')}</span>
                <span className="preset-desc">{preset.description}</span>
              </button>
            ))}
          </div>
        </section>

        {/* Advanced Options Section */}
        <section className="control-section">
          <h3>Advanced Options</h3>
          <details>
            <summary>Show advanced settings</summary>
            <div className="advanced-options">
              <div className="control-item">
                <label>Max Particles</label>
                <input type="number" min="100" max="50000" step="100" defaultValue="10000" />
              </div>
              <div className="control-item">
                <label>Time Step</label>
                <input type="number" min="0.001" max="0.1" step="0.001" defaultValue="0.016" />
              </div>
              <div className="control-item">
                <label>Gravity Scale</label>
                <input type="range" min="0" max="2" step="0.1" defaultValue="1" />
              </div>
            </div>
          </details>
        </section>
      </div>

      {/* Footer */}
      <div className="panel-footer">
        <small>Phase 10.9 Client Integration • GPU-Accelerated 4D Visualization</small>
      </div>
    </div>
  );
}

export default Phase10ControlPanel;
