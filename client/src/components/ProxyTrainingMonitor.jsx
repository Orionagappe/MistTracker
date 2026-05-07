import { useState, useEffect } from 'react';
import '../styles/ProxyTrainingMonitor.css';

/**
 * ProxyTrainingMonitor Component
 * Phase 17.1: Real-time neural proxy training progress
 */
function ProxyTrainingMonitor({ trainingStatus, onStartTraining }) {
  const [isTraining, setIsTraining] = useState(false);

  useEffect(() => {
    if (trainingStatus?.status === 'training') {
      setIsTraining(true);
    } else {
      setIsTraining(false);
    }
  }, [trainingStatus?.status]);

  const getProgressPercent = () => {
    if (!trainingStatus?.current_epoch || !trainingStatus?.total_epochs) {
      return 0;
    }
    return (trainingStatus.current_epoch / trainingStatus.total_epochs) * 100;
  };

  const handleStartClick = async () => {
    setIsTraining(true);
    await onStartTraining();
  };

  return (
    <div className="proxy-training-monitor">
      <div className="monitor-header">
        <h3>Training Progress</h3>
        <span className={`status-badge ${trainingStatus?.status || 'idle'}`}>
          {trainingStatus?.status?.toUpperCase() || 'IDLE'}
        </span>
      </div>

      <div className="training-stats">
        <div className="stat-item">
          <label>Epoch</label>
          <span>{trainingStatus?.current_epoch || 0} / {trainingStatus?.total_epochs || 100}</span>
        </div>
        <div className="stat-item">
          <label>Loss</label>
          <span>{trainingStatus?.current_loss?.toFixed(6) || 'N/A'}</span>
        </div>
        <div className="stat-item">
          <label>Learning Rate</label>
          <span>{trainingStatus?.learning_rate || 0.01}</span>
        </div>
        <div className="stat-item">
          <label>Batch Size</label>
          <span>{trainingStatus?.batch_size || 32}</span>
        </div>
      </div>

      <div className="progress-bar-container">
        <div className="progress-bar">
          <div 
            className="progress-fill" 
            style={{ width: `${getProgressPercent()}%` }}
          />
        </div>
        <span className="progress-text">{getProgressPercent().toFixed(1)}%</span>
      </div>

      <div className="training-info">
        <p><strong>Loss Trend:</strong> {trainingStatus?.loss_trend || 'Decreasing'}</p>
        <p><strong>Estimated Time:</strong> {trainingStatus?.estimated_time || '--'}</p>
        <p><strong>Data Points:</strong> {trainingStatus?.training_samples || 1000} samples</p>
      </div>

      <div className="action-buttons">
        <button 
          className="btn-primary"
          onClick={handleStartClick}
          disabled={isTraining}
        >
          {isTraining ? 'Training in Progress...' : 'Start Training'}
        </button>
        <button 
          className="btn-secondary"
          disabled={!isTraining}
        >
          Pause
        </button>
        <button 
          className="btn-secondary"
          disabled={!isTraining}
        >
          Stop
        </button>
      </div>

      {trainingStatus?.warnings && (
        <div className="warnings-section">
          <h4>⚠️ Warnings</h4>
          <ul>
            {trainingStatus.warnings.map((warning, idx) => (
              <li key={idx}>{warning}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export default ProxyTrainingMonitor;
