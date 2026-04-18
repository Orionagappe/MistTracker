/**
 * PHASE 10.9: CAMERA CONTROLS COMPONENT
 * 
 * Advanced camera animation and control interface
 * Keyframes, Bezier paths, tracking, auto-focus
 */

import React, { useState, useCallback } from 'react';
import { usePhase10Camera } from '../hooks/usePhase10Integration';
import '../styles/Phase10.css';

/**
 * Phase10CameraControls Component
 * Professional camera animation interface
 */
export function Phase10CameraControls({
  module = null,
  particles = []
}) {
  // Use camera hook
  const camera = usePhase10Camera(module);

  // State
  const [activeTab, setActiveTab] = useState('keyframes');
  const [keyframeForm, setKeyframeForm] = useState({
    time: 0,
    posX: 0,
    posY: 50,
    posZ: 50,
    targetX: 0,
    targetY: 0,
    targetZ: 0,
    fov: 45
  });
  const [bezierForm, setBezierForm] = useState({
    controlPoints: [],
    duration: 5000,
    loop: false
  });
  const [trackingTarget, setTrackingTarget] = useState([0, 0, 0]);
  const [trackingSmoothing, setTrackingSmoothing] = useState(0.1);

  // Preset camera positions
  const presetPositions = {
    'front': {
      position: [0, 0, 100],
      target: [0, 0, 0],
      label: 'Front View'
    },
    'top': {
      position: [0, 100, 0],
      target: [0, 0, 0],
      label: 'Top View'
    },
    'side': {
      position: [100, 0, 0],
      target: [0, 0, 0],
      label: 'Side View'
    },
    'isometric': {
      position: [70, 70, 70],
      target: [0, 0, 0],
      label: 'Isometric'
    },
    'orbit': {
      position: [100, 50, 100],
      target: [0, 0, 0],
      label: 'Orbit'
    }
  };

  // Add keyframe
  const handleAddKeyframe = useCallback(() => {
    const position = [keyframeForm.posX, keyframeForm.posY, keyframeForm.posZ];
    const target = [keyframeForm.targetX, keyframeForm.targetY, keyframeForm.targetZ];

    camera.addKeyframe(
      keyframeForm.time * 1000, // Convert to ms
      position,
      target,
      keyframeForm.fov
    );

    // Reset form
    setKeyframeForm(prev => ({
      ...prev,
      time: prev.time + 1
    }));
  }, [keyframeForm, camera]);

  // Remove keyframe
  const handleRemoveKeyframe = useCallback((index) => {
    camera.removeKeyframe(index);
  }, [camera]);

  // Play keyframes
  const handlePlayKeyframes = useCallback(() => {
    camera.playKeyframes(keyframeForm.loop ?? false);
  }, [camera, keyframeForm]);

  // Apply preset camera position
  const handlePresetPosition = useCallback((presetKey) => {
    const preset = presetPositions[presetKey];
    if (preset) {
      setKeyframeForm(prev => ({
        ...prev,
        posX: preset.position[0],
        posY: preset.position[1],
        posZ: preset.position[2],
        targetX: preset.target[0],
        targetY: preset.target[1],
        targetZ: preset.target[2]
      }));
    }
  }, [presetPositions]);

  // Auto-focus on particles
  const handleAutoFocus = useCallback(() => {
    if (particles.length > 0) {
      camera.autoFocus(particles);
    }
  }, [camera, particles]);

  // Start tracking
  const handleStartTracking = useCallback(() => {
    camera.startTracking(trackingTarget, trackingSmoothing);
  }, [camera, trackingTarget, trackingSmoothing]);

  // Create Bezier path
  const handleCreateBezierPath = useCallback(() => {
    if (bezierForm.controlPoints.length >= 2) {
      camera.createBezierPath(bezierForm.controlPoints);
    }
  }, [camera, bezierForm]);

  // Play Bezier path
  const handlePlayBezierPath = useCallback(() => {
    camera.playBezierPath(bezierForm.duration, bezierForm.loop);
  }, [camera, bezierForm]);

  return (
    <div className="phase10-camera-controls">
      <div className="panel-header">
        <h2>Camera Controls</h2>
      </div>

      <div className="camera-tabs">
        <button
          className={`tab-btn ${activeTab === 'keyframes' ? 'active' : ''}`}
          onClick={() => setActiveTab('keyframes')}
        >
          Keyframes
        </button>
        <button
          className={`tab-btn ${activeTab === 'paths' ? 'active' : ''}`}
          onClick={() => setActiveTab('paths')}
        >
          Bezier Paths
        </button>
        <button
          className={`tab-btn ${activeTab === 'tracking' ? 'active' : ''}`}
          onClick={() => setActiveTab('tracking')}
        >
          Tracking
        </button>
        <button
          className={`tab-btn ${activeTab === 'presets' ? 'active' : ''}`}
          onClick={() => setActiveTab('presets')}
        >
          Presets
        </button>
      </div>

      <div className="camera-content">
        {/* Keyframes Tab */}
        {activeTab === 'keyframes' && (
          <div className="tab-content">
            <section className="camera-section">
              <h3>Keyframe Animation</h3>

              {/* Keyframe Form */}
              <div className="keyframe-form">
                <div className="form-group">
                  <label>Time (s)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.1"
                    value={keyframeForm.time}
                    onChange={(e) => setKeyframeForm({ ...keyframeForm, time: parseFloat(e.target.value) })}
                  />
                </div>

                <div className="form-group">
                  <label>Position (X, Y, Z)</label>
                  <div className="coord-inputs">
                    <input
                      type="number"
                      placeholder="X"
                      value={keyframeForm.posX}
                      onChange={(e) => setKeyframeForm({ ...keyframeForm, posX: parseFloat(e.target.value) })}
                    />
                    <input
                      type="number"
                      placeholder="Y"
                      value={keyframeForm.posY}
                      onChange={(e) => setKeyframeForm({ ...keyframeForm, posY: parseFloat(e.target.value) })}
                    />
                    <input
                      type="number"
                      placeholder="Z"
                      value={keyframeForm.posZ}
                      onChange={(e) => setKeyframeForm({ ...keyframeForm, posZ: parseFloat(e.target.value) })}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>Target (X, Y, Z)</label>
                  <div className="coord-inputs">
                    <input
                      type="number"
                      placeholder="X"
                      value={keyframeForm.targetX}
                      onChange={(e) => setKeyframeForm({ ...keyframeForm, targetX: parseFloat(e.target.value) })}
                    />
                    <input
                      type="number"
                      placeholder="Y"
                      value={keyframeForm.targetY}
                      onChange={(e) => setKeyframeForm({ ...keyframeForm, targetY: parseFloat(e.target.value) })}
                    />
                    <input
                      type="number"
                      placeholder="Z"
                      value={keyframeForm.targetZ}
                      onChange={(e) => setKeyframeForm({ ...keyframeForm, targetZ: parseFloat(e.target.value) })}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>FOV (degrees)</label>
                  <input
                    type="number"
                    min="5"
                    max="120"
                    value={keyframeForm.fov}
                    onChange={(e) => setKeyframeForm({ ...keyframeForm, fov: parseFloat(e.target.value) })}
                  />
                </div>

                <button className="btn-add" onClick={handleAddKeyframe}>
                  + Add Keyframe
                </button>
              </div>

              {/* Keyframes List */}
              <div className="keyframes-list">
                <h4>Keyframes ({camera.keyframes.length})</h4>
                {camera.keyframes.length === 0 ? (
                  <p className="empty-message">No keyframes added yet</p>
                ) : (
                  <div className="keyframe-items">
                    {camera.keyframes.map((kf, idx) => (
                      <div key={idx} className="keyframe-item">
                        <div className="kf-info">
                          <span className="kf-time">{(kf.time / 1000).toFixed(1)}s</span>
                          <span className="kf-fov">FOV: {kf.fov}°</span>
                        </div>
                        <button
                          className="btn-remove"
                          onClick={() => handleRemoveKeyframe(idx)}
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Playback Controls */}
              <div className="playback-controls">
                <button
                  className={`btn-play ${camera.isPlayingKeyframes ? 'playing' : ''}`}
                  onClick={handlePlayKeyframes}
                >
                  {camera.isPlayingKeyframes ? '⏸ Stop' : '▶ Play'}
                </button>
                <button className="btn-stop" onClick={() => camera.stopKeyframes()}>
                  Stop
                </button>
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={keyframeForm.loop || false}
                    onChange={(e) => setKeyframeForm({ ...keyframeForm, loop: e.target.checked })}
                  />
                  Loop
                </label>
              </div>
            </section>
          </div>
        )}

        {/* Bezier Paths Tab */}
        {activeTab === 'paths' && (
          <div className="tab-content">
            <section className="camera-section">
              <h3>Bezier Path Animation</h3>
              <p className="section-hint">Create smooth camera paths with control points</p>

              <div className="bezier-form">
                <div className="form-group">
                  <label>Duration (ms)</label>
                  <input
                    type="number"
                    min="100"
                    step="100"
                    value={bezierForm.duration}
                    onChange={(e) => setBezierForm({ ...bezierForm, duration: parseFloat(e.target.value) })}
                  />
                </div>

                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={bezierForm.loop}
                    onChange={(e) => setBezierForm({ ...bezierForm, loop: e.target.checked })}
                  />
                  Loop Path
                </label>

                <button className="btn-add" onClick={handleCreateBezierPath}>
                  Create Bezier Path
                </button>
              </div>

              {camera.cameraPathPoints.length > 0 && (
                <div className="path-info">
                  <p>Path generated with {camera.cameraPathPoints.length} points</p>
                  <button className="btn-play" onClick={handlePlayBezierPath}>
                    ▶ Play Path
                  </button>
                  <button className="btn-stop" onClick={() => camera.stopBezierPath()}>
                    Stop
                  </button>
                </div>
              )}
            </section>
          </div>
        )}

        {/* Tracking Tab */}
        {activeTab === 'tracking' && (
          <div className="tab-content">
            <section className="camera-section">
              <h3>Target Tracking</h3>
              <p className="section-hint">Keep camera focused on a moving target</p>

              <div className="tracking-form">
                <div className="form-group">
                  <label>Target Position (X, Y, Z)</label>
                  <div className="coord-inputs">
                    <input
                      type="number"
                      placeholder="X"
                      value={trackingTarget[0]}
                      onChange={(e) => setTrackingTarget([parseFloat(e.target.value), trackingTarget[1], trackingTarget[2]])}
                    />
                    <input
                      type="number"
                      placeholder="Y"
                      value={trackingTarget[1]}
                      onChange={(e) => setTrackingTarget([trackingTarget[0], parseFloat(e.target.value), trackingTarget[2]])}
                    />
                    <input
                      type="number"
                      placeholder="Z"
                      value={trackingTarget[2]}
                      onChange={(e) => setTrackingTarget([trackingTarget[0], trackingTarget[1], parseFloat(e.target.value)])}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>Smoothing Factor ({trackingSmoothing.toFixed(2)})</label>
                  <input
                    type="range"
                    min="0.01"
                    max="0.5"
                    step="0.01"
                    value={trackingSmoothing}
                    onChange={(e) => setTrackingSmoothing(parseFloat(e.target.value))}
                  />
                </div>

                <button className="btn-play" onClick={handleStartTracking}>
                  Start Tracking
                </button>
                <button className="btn-stop" onClick={() => camera.stopTracking()}>
                  Stop Tracking
                </button>
              </div>

              {camera.isTracking && (
                <div className="tracking-status">
                  <span className="status-indicator">🎯 Tracking Active</span>
                </div>
              )}
            </section>
          </div>
        )}

        {/* Presets Tab */}
        {activeTab === 'presets' && (
          <div className="tab-content">
            <section className="camera-section">
              <h3>Camera Presets</h3>

              <div className="preset-buttons">
                {Object.entries(presetPositions).map(([key, preset]) => (
                  <button
                    key={key}
                    className="preset-btn"
                    onClick={() => handlePresetPosition(key)}
                    title={preset.label}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>

              <section className="camera-section">
                <h3>Quick Actions</h3>
                <button className="btn-full" onClick={handleAutoFocus}>
                  🎯 Auto-Focus on Particles
                </button>
              </section>
            </section>
          </div>
        )}
      </div>
    </div>
  );
}

export default Phase10CameraControls;
