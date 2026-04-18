import { useState, useEffect } from 'react';
import { usePhysics } from '../hooks/usePhysics';
import '../styles/PhysicsControlPanel.css';

/**
 * PhysicsControlPanel Component
 * Controls for physics simulation configuration, emitters, and coupling
 */
function PhysicsControlPanel({ physics, onClose, isPlacingEmitter, setIsPlacingEmitter, emitterSettings, setEmitterSettings }) {
  const [activeTab, setActiveTab] = useState('emitters');
  const [editingEmitterId, setEditingEmitterId] = useState(null);
  const [editingEmitterSettings, setEditingEmitterSettings] = useState({
    frequency: 5000,
    amplitude: 2.0,
    intensity: 1.0
  });
  const [config, setConfig] = useState({
    gravityStrength: 0.1,
    damping: 0.95,
    timeStep: 0.016
  });
  const [couplingConfig, setCouplingConfig] = useState({
    enabled: true,
    strength: 0.5
  });

  /**
   * Start editing an emitter's properties
   */
  const handleEditEmitter = (emitterId, emitter) => {
    setEditingEmitterId(emitterId);
    setEditingEmitterSettings({
      frequency: emitter.frequency,
      amplitude: emitter.amplitude,
      intensity: emitter.intensity
    });
  };

  /**
   * Save emitter property updates
   */
  const handleSaveEmitterEdit = (emitterId) => {
    if (!physics?.updateWaveEmitter) {
      console.warn('updateWaveEmitter not available on physics hook');
      return;
    }

    physics.updateWaveEmitter(emitterId, editingEmitterSettings);
    setEditingEmitterId(null);
    console.log(`✓ Emitter ${emitterId} updated`);
  };

  /**
   * Delete a wave emitter
   */
  const handleDeleteEmitter = (emitterId) => {
    if (!physics?.deleteWaveEmitter) {
      console.warn('deleteWaveEmitter not available on physics hook');
      return;
    }

    physics.deleteWaveEmitter(emitterId);
    setEditingEmitterId(null);
    console.log(`✓ Emitter ${emitterId} deleted`);
  };

  /**
   * Update physics configuration
   */
  const handleUpdateConfig = (key, value) => {
    const newConfig = { ...config, [key]: value };
    setConfig(newConfig);

    if (physics?.configurePhysics) {
      physics.configurePhysics(newConfig);
    }
  };

  /**
   * Update coupling configuration
   */
  const handleUpdateCoupling = () => {
    if (!physics || !physics.setDimensionalCoupling) {
      console.error('setDimensionalCoupling method not available');
      return;
    }

    try {
      const result = physics.setDimensionalCoupling(couplingConfig.enabled, couplingConfig.strength);
      if (result === false) {
        console.error('Failed to apply coupling settings');
      } else {
        console.log('✓ Coupling settings applied');
      }
    } catch (err) {
      console.error('Error updating coupling:', err);
    }
  };

  /**
   * Export physics state
   */
  const handleExportState = () => {
    if (physics?.exportPhysicsData) {
      const data = physics.exportPhysicsData();
      const json = JSON.stringify(data, null, 2);
      const link = document.createElement('a');
      link.href = URL.createObjectURL(new Blob([json], { type: 'application/json' }));
      link.download = `physics-state-${Date.now()}.json`;
      link.click();
    }
  };

  /**
   * Clear all visualizations
   */
  const handleClearVisualization = () => {
    if (physics?.clearAllVisualizations) {
      physics.clearAllVisualizations();
    }
  };

  return (
    <div className="physics-control-panel">
      <div className="panel-header">
        <h3>Physics Controls</h3>
        <button onClick={onClose} className="btn-close">✕</button>
      </div>

      <div className="panel-tabs">
        <button
          className={`tab-button ${activeTab === 'emitters' ? 'active' : ''}`}
          onClick={() => setActiveTab('emitters')}
        >
          Wave Emitters
        </button>
        <button
          className={`tab-button ${activeTab === 'config' ? 'active' : ''}`}
          onClick={() => setActiveTab('config')}
        >
          Configuration
        </button>
        <button
          className={`tab-button ${activeTab === 'coupling' ? 'active' : ''}`}
          onClick={() => setActiveTab('coupling')}
        >
          Dimensional Coupling
        </button>
        <button
          className={`tab-button ${activeTab === 'export' ? 'active' : ''}`}
          onClick={() => setActiveTab('export')}
        >
          Export
        </button>
      </div>

      <div className="panel-content">
        {/* Wave Emitters Tab */}
        {activeTab === 'emitters' && (
          <div className="tab-content">
            <h4>Create Wave Emitter</h4>
            
            <div className="placement-mode">
              <div className="form-group">
                <label>
                  <input
                    type="checkbox"
                    checked={isPlacingEmitter}
                    onChange={(e) => setIsPlacingEmitter(e.target.checked)}
                  />
                  {' '}Enable Placement Mode (Click in scene to place)
                </label>
              </div>

              {isPlacingEmitter && (
                <div className="placement-settings">
                  <div className="form-group">
                    <label>Emitter Type</label>
                    <select
                      value={emitterSettings.type}
                      onChange={(e) => setEmitterSettings({ ...emitterSettings, type: e.target.value })}
                      className="form-input"
                    >
                      <option value="light">Light (Yellow)</option>
                      <option value="gravity">Gravity (Red)</option>
                      <option value="quantum">Quantum (Blue)</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Frequency (Hz): {emitterSettings.frequency}</label>
                    <input
                      type="range"
                      min="100"
                      max="10000"
                      step="100"
                      value={emitterSettings.frequency}
                      onChange={(e) => setEmitterSettings({ ...emitterSettings, frequency: parseInt(e.target.value) })}
                      className="form-input range"
                    />
                  </div>

                  <div className="form-group">
                    <label>Amplitude: {emitterSettings.amplitude.toFixed(2)}</label>
                    <input
                      type="range"
                      min="0.1"
                      max="10"
                      step="0.1"
                      value={emitterSettings.amplitude}
                      onChange={(e) => setEmitterSettings({ ...emitterSettings, amplitude: parseFloat(e.target.value) })}
                      className="form-input range"
                    />
                  </div>

                  <div className="form-group">
                    <label>Intensity: {emitterSettings.intensity.toFixed(2)}</label>
                    <input
                      type="range"
                      min="0.1"
                      max="5"
                      step="0.1"
                      value={emitterSettings.intensity}
                      onChange={(e) => setEmitterSettings({ ...emitterSettings, intensity: parseFloat(e.target.value) })}
                      className="form-input range"
                    />
                  </div>

                  <p className="placement-hint">💡 Crosshair cursor active. Click anywhere in the 3D scene to place an emitter.</p>
                </div>
              )}
            </div>

            <hr style={{ margin: '1rem 0', opacity: 0.3 }} />

            <h4>Active Emitters ({physics?.waveEmitters?.size || 0})</h4>
            {physics?.waveEmitters && physics.waveEmitters.size > 0 ? (
              <div className="emitters-list">
                {Array.from(physics.waveEmitters.entries()).map(([id, emitter]) => (
                  <div key={id} className={`emitter-card emitter-${emitter.type}`}>
                    {editingEmitterId === id ? (
                      // Edit mode
                      <div className="emitter-edit">
                        <div className="emitter-header">
                          <span className="emitter-id">{id}</span>
                          <span className="emitter-type">{emitter.type}</span>
                        </div>

                        <div className="emitter-props">
                          <div className="prop-group">
                            <label>Frequency: {editingEmitterSettings.frequency}</label>
                            <input
                              type="range"
                              min="100"
                              max="10000"
                              step="100"
                              value={editingEmitterSettings.frequency}
                              onChange={(e) => setEditingEmitterSettings({ ...editingEmitterSettings, frequency: parseInt(e.target.value) })}
                              className="form-input range"
                            />
                          </div>

                          <div className="prop-group">
                            <label>Amplitude: {editingEmitterSettings.amplitude.toFixed(2)}</label>
                            <input
                              type="range"
                              min="0.1"
                              max="10"
                              step="0.1"
                              value={editingEmitterSettings.amplitude}
                              onChange={(e) => setEditingEmitterSettings({ ...editingEmitterSettings, amplitude: parseFloat(e.target.value) })}
                              className="form-input range"
                            />
                          </div>

                          <div className="prop-group">
                            <label>Intensity: {editingEmitterSettings.intensity.toFixed(2)}</label>
                            <input
                              type="range"
                              min="0.1"
                              max="5"
                              step="0.1"
                              value={editingEmitterSettings.intensity}
                              onChange={(e) => setEditingEmitterSettings({ ...editingEmitterSettings, intensity: parseFloat(e.target.value) })}
                              className="form-input range"
                            />
                          </div>
                        </div>

                        <div className="emitter-actions">
                          <button
                            onClick={() => handleSaveEmitterEdit(id)}
                            className="btn-small btn-save"
                            title="Save changes"
                          >
                            ✓ Save
                          </button>
                          <button
                            onClick={() => setEditingEmitterId(null)}
                            className="btn-small btn-cancel"
                            title="Cancel"
                          >
                            ✕ Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      // View mode
                      <div className="emitter-view">
                        <div className="emitter-header">
                          <span className="emitter-id">{id}</span>
                          <span className="emitter-type">{emitter.type}</span>
                        </div>

                        <div className="emitter-info">
                          <div className="info-row">
                            <span className="label">Frequency:</span>
                            <span className="value">{emitter.frequency} Hz</span>
                          </div>
                          <div className="info-row">
                            <span className="label">Amplitude:</span>
                            <span className="value">{emitter.amplitude.toFixed(2)}</span>
                          </div>
                          <div className="info-row">
                            <span className="label">Intensity:</span>
                            <span className="value">{emitter.intensity.toFixed(2)}</span>
                          </div>
                        </div>

                        <div className="emitter-actions">
                          <button
                            onClick={() => handleEditEmitter(id, emitter)}
                            className="btn-small btn-edit"
                            title="Edit properties"
                          >
                            ✏️ Edit
                          </button>
                          <button
                            onClick={() => handleDeleteEmitter(id)}
                            className="btn-small btn-delete"
                            title="Delete emitter"
                          >
                            🗑️ Delete
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="empty-message">No active emitters. Enable placement mode to create one.</p>
            )}
          </div>
        )}

        {/* Configuration Tab */}
        {activeTab === 'config' && (
          <div className="tab-content">
            <h4>Engine Configuration</h4>

            <div className="form-group">
              <label>Gravity Strength: {config.gravityStrength.toFixed(3)}</label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={config.gravityStrength}
                onChange={(e) => handleUpdateConfig('gravityStrength', parseFloat(e.target.value))}
                className="form-input range"
              />
              <small>Controls strength of gravitational forces between objects</small>
            </div>

            <div className="form-group">
              <label>Damping: {config.damping.toFixed(3)}</label>
              <input
                type="range"
                min="0.8"
                max="1"
                step="0.01"
                value={config.damping}
                onChange={(e) => handleUpdateConfig('damping', parseFloat(e.target.value))}
                className="form-input range"
              />
              <small>Energy dissipation (1.0 = no damping, 0.8 = 20% loss per frame)</small>
            </div>

            <div className="form-group">
              <label>Time Step: {config.timeStep.toFixed(4)} seconds</label>
              <input
                type="range"
                min="0.008"
                max="0.032"
                step="0.001"
                value={config.timeStep}
                onChange={(e) => handleUpdateConfig('timeStep', parseFloat(e.target.value))}
                className="form-input range"
              />
              <small>Physics simulation timestep (smaller = more accurate, slower)</small>
            </div>

            <div className="config-info">
              <h5>Current Settings:</h5>
              <ul>
                <li>Gravity: {config.gravityStrength}</li>
                <li>Damping: {config.damping}</li>
                <li>Time Step: {config.timeStep}s (~{(1 / config.timeStep).toFixed(0)} Hz)</li>
              </ul>
            </div>
          </div>
        )}

        {/* Dimensional Coupling Tab */}
        {activeTab === 'coupling' && (
          <div className="tab-content">
            <h4>3D ↔ 4D Dimensional Coupling</h4>

            <div className="form-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={couplingConfig.enabled}
                  onChange={(e) => {
                    setCouplingConfig({ ...couplingConfig, enabled: e.target.checked });
                  }}
                />
                <span>{couplingConfig.enabled ? '✓ Coupling Enabled' : '✗ Coupling Disabled'}</span>
              </label>
              <small>Enable/disable 3D ↔ 4D energy exchange</small>
            </div>

            <div className="form-group">
              <label>Coupling Strength: {couplingConfig.strength.toFixed(2)}</label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={couplingConfig.strength}
                onChange={(e) => setCouplingConfig({ ...couplingConfig, strength: parseFloat(e.target.value) })}
                disabled={!couplingConfig.enabled}
                className="form-input range"
              />
              <small>How strongly 3D and 4D spaces affect each other</small>
            </div>

            <div className="coupling-info">
              <h5>How It Works:</h5>
              <ul>
                <li><strong>3D → 4D:</strong> Geometry motion modulates 4D tensor fields</li>
                <li><strong>4D → 3D:</strong> Tensor field intensity influences geometry acceleration</li>
                <li><strong>Energy:</strong> Bidirectional transfer preserves total system energy</li>
                <li><strong>Waves:</strong> Light and gravity propagate across dimensional boundary</li>
              </ul>
            </div>

            <button
              onClick={handleUpdateCoupling}
              className="btn-primary"
            >
              Apply Coupling Settings
            </button>
          </div>
        )}

        {/* Export Tab */}
        {activeTab === 'export' && (
          <div className="tab-content">
            <h4>Export & Utilities</h4>

            <div className="export-actions">
              <button onClick={handleExportState} className="btn-secondary">
                💾 Export Physics State
              </button>
              <small>Download current simulation state as JSON</small>
            </div>

            <div className="export-actions">
              <button onClick={handleClearVisualization} className="btn-secondary btn-danger">
                🗑 Clear All Visualizations
              </button>
              <small>Remove all geometries and emitters from scene</small>
            </div>

            <div className="export-info">
              <h5>Export Contents:</h5>
              <ul>
                <li>Active geometries and their states</li>
                <li>Tensor field configurations</li>
                <li>Wave emitter parameters</li>
                <li>Simulation statistics</li>
                <li>Coupling configuration</li>
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default PhysicsControlPanel;
