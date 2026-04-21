import React, { useState, useEffect } from 'react';
import '../styles/PerAtomTrainingPanel.css';

/**
 * PerAtomTrainingPanel Component
 * Individual training controls for a specific atom
 * Phase 17.2.0 Foundation Component
 */

export default function PerAtomTrainingPanel({ atom, onTrainStart, onTrainStop }) {
  const [trainingState, setTrainingState] = useState({
    isTraining: false,
    epoch: 0,
    totalEpochs: 100,
    loss: null,
    learningRate: 0.001,
    batchSize: 32,
    estimatedTimeRemaining: null,
    startTime: null,
  });

  const [config, setConfig] = useState({
    epochs: 100,
    batchSize: 32,
    learningRate: 0.001,
    validationSplit: 0.2,
  });

  // Poll training status
  useEffect(() => {
    if (!trainingState.isTraining || !atom) return;

    const pollStatus = async () => {
      try {
        const response = await fetch(`/api/analysis/${atom.symbol}/status`);
        if (response.ok) {
          const data = await response.json();
          if (data.training_status) {
            const status = data.training_status;
            const elapsed = Date.now() - trainingState.startTime;
            const epochsCompleted = status.epoch || 0;
            const timePerEpoch = elapsed / (epochsCompleted || 1);
            const remaining = (config.epochs - epochsCompleted) * timePerEpoch;

            setTrainingState((prev) => ({
              ...prev,
              epoch: status.epoch || 0,
              loss: status.loss || null,
              estimatedTimeRemaining: remaining,
            }));
          }
        }
      } catch (err) {
        console.error('Error polling training status:', err);
      }
    };

    const interval = setInterval(pollStatus, 2000); // Poll every 2 seconds
    return () => clearInterval(interval);
  }, [trainingState.isTraining, atom, config.epochs, trainingState.startTime]);

  const handleStartTraining = async () => {
    if (!atom) return;

    try {
      setTrainingState((prev) => ({
        ...prev,
        isTraining: true,
        epoch: 0,
        startTime: Date.now(),
      }));

      const response = await fetch(`/api/analysis/${atom.symbol}/train`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      });

      if (!response.ok) {
        throw new Error('Failed to start training');
      }

      if (onTrainStart) onTrainStart(atom);
    } catch (err) {
      console.error('Error starting training:', err);
      setTrainingState((prev) => ({ ...prev, isTraining: false }));
    }
  };

  const handleStopTraining = async () => {
    if (!atom) return;

    try {
      const response = await fetch(`/api/analysis/${atom.symbol}/train`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to stop training');
      }

      setTrainingState((prev) => ({ ...prev, isTraining: false }));
      if (onTrainStop) onTrainStop(atom);
    } catch (err) {
      console.error('Error stopping training:', err);
    }
  };

  const getProgressPercent = () => {
    return Math.round((trainingState.epoch / config.epochs) * 100);
  };

  const formatTime = (ms) => {
    if (!ms) return '--:--';
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);

    if (hours > 0) {
      return `${hours}h ${minutes % 60}m`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    }
    return `${seconds}s`;
  };

  if (!atom) {
    return (
      <div className="per-atom-panel placeholder">
        <p>Select an atom to view training controls</p>
      </div>
    );
  }

  return (
    <div className="per-atom-training-panel">
      <div className="panel-header">
        <h2>{atom.symbol} - {atom.name} Training</h2>
        <span className={`status-indicator ${trainingState.isTraining ? 'training' : 'idle'}`}>
          {trainingState.isTraining ? '● Training' : '○ Idle'}
        </span>
      </div>

      {!trainingState.isTraining ? (
        <div className="configuration-section">
          <h3>Training Configuration</h3>
          <div className="config-grid">
            <div className="config-item">
              <label>Epochs:</label>
              <input
                type="number"
                value={config.epochs}
                onChange={(e) => setConfig({ ...config, epochs: parseInt(e.target.value) })}
                min="10"
                max="1000"
              />
            </div>

            <div className="config-item">
              <label>Batch Size:</label>
              <input
                type="number"
                value={config.batchSize}
                onChange={(e) => setConfig({ ...config, batchSize: parseInt(e.target.value) })}
                min="8"
                max="256"
              />
            </div>

            <div className="config-item">
              <label>Learning Rate:</label>
              <input
                type="number"
                value={config.learningRate}
                onChange={(e) => setConfig({ ...config, learningRate: parseFloat(e.target.value) })}
                min="0.00001"
                max="0.1"
                step="0.00001"
              />
            </div>

            <div className="config-item">
              <label>Validation Split:</label>
              <input
                type="number"
                value={config.validationSplit}
                onChange={(e) => setConfig({ ...config, validationSplit: parseFloat(e.target.value) })}
                min="0.1"
                max="0.5"
                step="0.05"
              />
            </div>
          </div>

          <button className="btn btn-primary btn-start" onClick={handleStartTraining}>
            Start Training
          </button>
        </div>
      ) : (
        <div className="training-progress-section">
          <h3>Training Progress</h3>

          <div className="progress-grid">
            <div className="progress-item">
              <span className="label">Epoch:</span>
              <span className="value">{trainingState.epoch} / {config.epochs}</span>
            </div>

            <div className="progress-item">
              <span className="label">Loss:</span>
              <span className="value">
                {trainingState.loss !== null
                  ? trainingState.loss.toFixed(6)
                  : 'Computing...'}
              </span>
            </div>

            <div className="progress-item">
              <span className="label">Learning Rate:</span>
              <span className="value">{config.learningRate.toFixed(6)}</span>
            </div>

            <div className="progress-item">
              <span className="label">Time Remaining:</span>
              <span className="value">
                {formatTime(trainingState.estimatedTimeRemaining)}
              </span>
            </div>
          </div>

          <div className="progress-bar-container">
            <div className="progress-bar">
              <div
                className="progress-fill"
                style={{ width: `${getProgressPercent()}%` }}
              />
            </div>
            <span className="progress-percent">{getProgressPercent()}%</span>
          </div>

          <button className="btn btn-danger btn-stop" onClick={handleStopTraining}>
            Stop Training
          </button>
        </div>
      )}

      <div className="panel-footer">
        <small>
          {atom.electronConfig && `Electron Configuration: ${atom.electronConfig}`}
        </small>
      </div>
    </div>
  );
}
