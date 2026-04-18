/**
 * DemoConfigSelector.jsx - Demo Configuration Selection UI
 * Integrates demo configurations with AtomBuilder
 * Phase 11: User interface for testing different physics scenarios
 */

import React, { useState, useEffect } from 'react';
import useDemoConfigs from '../hooks/useDemoConfigs.js';
import '../styles/DemoConfigSelector.css';

/**
 * Component for selecting and loading demo configurations
 */
function DemoConfigSelector({ onConfigLoaded, className = '' }) {
  const [expanded, setExpanded] = useState(false);
  const [selectedConfigName, setSelectedConfigName] = useState(null);
  const [detailsView, setDetailsView] = useState(null);

  const demo = useDemoConfigs(onConfigLoaded);

  // Load config when selection changes
  const handleSelectConfig = (configName) => {
    demo.loadConfig(configName);
    setSelectedConfigName(configName);
    setDetailsView(null);
  };

  // Show details
  const handleShowDetails = (configName) => {
    setDetailsView(configName);
  };

  // Hide details
  const handleHideDetails = () => {
    setDetailsView(null);
  };

  // Export for physics engine
  const handleExportForPhysics = () => {
    const config = demo.exportForPhysicsEngine(selectedConfigName);
    // Typically this would be sent to backend
    console.log('Physics config:', config);
    return config;
  };

  if (demo.isLoading) {
    return (
      <div className={`demo-config-selector loading ${className}`}>
        <span>Loading configurations...</span>
      </div>
    );
  }

  if (demo.hasError) {
    return (
      <div className={`demo-config-selector error ${className}`}>
        <div className="error-message">
          <strong>Error:</strong> {demo.error}
        </div>
      </div>
    );
  }

  return (
    <div className={`demo-config-selector ${className}`}>
      {/* Header */}
      <div className="demo-header">
        <button
          className="demo-toggle"
          onClick={() => setExpanded(!expanded)}
          title="Toggle demo configurations"
        >
          <span className="demo-icon">🔬</span>
          <span className="demo-label">Physics Demos</span>
          <span className={`demo-count ${expanded ? 'expanded' : ''}`}>
            {demo.configCount}
          </span>
        </button>
      </div>

      {/* Config List */}
      {expanded && (
        <div className="demo-configs-panel">
          <div className="configs-header">
            <p className="configs-title">Available Scenarios ({demo.configCount})</p>
            <p className="configs-subtitle">Load pre-configured physics simulations</p>
          </div>

          <div className="configs-list">
            {demo.availableConfigs.map((cfg) => (
              <div
                key={cfg.name}
                className={`config-item ${selectedConfigName === cfg.name ? 'selected' : ''}`}
              >
                <div className="config-item-main">
                  <button
                    className="config-name-btn"
                    onClick={() => handleSelectConfig(cfg.name)}
                    title={`Load ${cfg.displayName} configuration`}
                  >
                    <span className="config-title">{cfg.displayName}</span>
                    <span className="config-atoms">⚛️ {cfg.atomCount}</span>
                    <span className="config-emitters">🌊 {cfg.emitterCount}</span>
                  </button>

                  <button
                    className="config-info-btn"
                    onClick={() => handleShowDetails(cfg.name)}
                    title="Show configuration details"
                  >
                    ℹ️
                  </button>
                </div>

                <p className="config-description">{cfg.description}</p>

                {/* Details View */}
                {detailsView === cfg.name && (
                  <ConfigDetails
                    configName={cfg.name}
                    demoHook={demo}
                    onClose={handleHideDetails}
                  />
                )}
              </div>
            ))}
          </div>

          {/* Selected Config Info */}
          {selectedConfigName && (
            <div className="selected-config-info">
              <div className="info-header">
                <span className="info-label">📍 Active Configuration:</span>
                <button
                  className="info-export"
                  onClick={handleExportForPhysics}
                  title="Export for physics engine"
                >
                  📤 Export
                </button>
              </div>
              <p className="info-name">{selectedConfigName}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * Configuration Details Sub-Component
 */
function ConfigDetails({ configName, demoHook, onClose }) {
  const details = demoHook.getConfigDetails(configName);
  const scenario = demoHook.getScenarioInfo(configName);

  if (!details || !scenario) {
    return null;
  }

  return (
    <div className="config-details">
      <div className="details-header">
        <button className="close-btn" onClick={onClose}>
          ✕
        </button>
        <h4>{scenario.title}</h4>
      </div>

      <div className="details-body">
        {/* Description */}
        <div className="details-section">
          <h5>Description</h5>
          <p>{scenario.description}</p>
        </div>

        {/* Atoms */}
        <div className="details-section">
          <h5>Atoms ({details.atoms.length})</h5>
          <div className="atoms-list">
            {details.atoms.map((atom) => (
              <div key={atom.id} className="atom-detail">
                <span className="atom-name">{atom.name}</span>
                <span className="atom-type">[{atom.type}]</span>
                <div className="atom-props">
                  <span className="atom-prop">
                    Pos: [{atom.position.map((p) => p.toFixed(0)).join(', ')}]
                  </span>
                  <span className="atom-prop">Orbital: {atom.orbitalFreq}</span>
                  <span className="atom-prop">Nucleus: {atom.nucleusFreq}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Emitters */}
        {details.emitters.length > 0 && (
          <div className="details-section">
            <h5>Wave Emitters ({details.emitters.length})</h5>
            <div className="emitters-list">
              {details.emitters.map((emitter) => (
                <div key={emitter.id} className="emitter-detail">
                  <span className="emitter-id">{emitter.id}</span>
                  <div className="emitter-props">
                    <span className="emitter-prop">
                      Freq: {emitter.frequency}
                    </span>
                    <span className="emitter-prop">
                      λ: {emitter.wavelength}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Simulation Parameters */}
        <div className="details-section">
          <h5>Simulation Parameters</h5>
          <div className="params-list">
            {Object.entries(details.params || {}).map(([key, value]) => (
              <div key={key} className="param-item">
                <span className="param-key">{key}:</span>
                <span className="param-value">{value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Recommended Tests */}
        {scenario.tests && scenario.tests.length > 0 && (
          <div className="details-section">
            <h5>Recommended Tests</h5>
            <ul className="tests-list">
              {scenario.tests.map((test, idx) => (
                <li key={idx}>{test}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}

export default DemoConfigSelector;
