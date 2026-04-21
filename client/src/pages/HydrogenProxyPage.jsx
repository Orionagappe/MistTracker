import { useState, useEffect } from 'react';
import { analysisAPI } from '../api';
import HydrogenProxyVisualization from '../components/HydrogenProxyVisualization';
import ProxyTrainingMonitor from '../components/ProxyTrainingMonitor';
import ProxyValidationReport from '../components/ProxyValidationReport';
import AtomSelector from '../components/AtomSelector';
import PerAtomTrainingPanel from '../components/PerAtomTrainingPanel';
import ProxyComparisonMatrix from '../components/ProxyComparisonMatrix';
import '../styles/HydrogenProxyPage.css';

/**
 * HydrogenProxyPage Component
 * Phase 17.1: Hydrogen proxy training, validation, and testing
 * Phase 17.2.0: Extended to multi-atom support with atom selector and per-atom training
 * Focuses on neural proxy model training for fast predictions across atoms H-Ne
 */
function HydrogenProxyPage({ user, onLogout }) {
  const [activeTab, setActiveTab] = useState('training'); // 'training' | 'validation' | 'comparison' | 'multi-atom'
  const [selectedAtom, setSelectedAtom] = useState(null);
  const [trainedAtoms, setTrainedAtoms] = useState([]);
  const [trainingStatus, setTrainingStatus] = useState(null);
  const [proxyModel, setProxyModel] = useState(null);
  const [validationResults, setValidationResults] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadProxyStatus();
    // Poll for updates every 5 seconds
    const interval = setInterval(loadProxyStatus, 5000);
    return () => clearInterval(interval);
  }, []);

  const loadProxyStatus = async () => {
    try {
      // For Phase 17.1: Use mock data if API not available
      // Later phases will integrate with real endpoints
      setTrainingStatus({
        epoch: 150,
        loss: 0.0234,
        accuracy: 0.9654,
      });
      setProxyModel({
        speedup_factor: 25.3,
        accuracy_percent: 96.54,
        model_size_kb: 12.4,
        throughput: 22542,
        sample_predictions: generateSamplePredictions(),
      });
      setValidationResults({
        accuracy: 0.9654,
        mean_error: 0.0156,
        max_error: 0.0524,
        validation_score: 0.9521,
      });
      setLoading(false);
    } catch (err) {
      console.error('Failed to load proxy status:', err);
      // Use mock data for development
      setTrainingStatus({ epoch: 100, loss: 0.03, accuracy: 0.96 });
      setProxyModel({ speedup_factor: 25, accuracy_percent: 96, model_size_kb: 12, throughput: 22000 });
      setLoading(false);
    }
  };

  const generateSamplePredictions = () => {
    const predictions = [];
    for (let i = 0; i < 50; i++) {
      predictions.push({
        x: (i / 50) * 10,
        y: Math.sin((i / 50) * Math.PI) * (1 - Math.random() * 0.1),
      });
    }
    return predictions;
  };

  const handleStartTraining = async () => {
    try {
      setLoading(true);
      // Phase 17.1: Mock training simulation
      // Real endpoint will be added in Phase 17.2.1
      await new Promise(resolve => setTimeout(resolve, 500));
      loadProxyStatus();
    } catch (err) {
      setError('Failed to start training');
      console.error(err);
      setLoading(false);
    }
  };

  const handleValidateProxy = async () => {
    try {
      setLoading(true);
      // Phase 17.1: Mock validation
      // Real endpoint will be added in Phase 17.2.1
      await new Promise(resolve => setTimeout(resolve, 500));
      loadProxyStatus();
    } catch (err) {
      setError('Failed to validate proxy');
      console.error(err);
      setLoading(false);
    }
  };

  if (loading && !trainingStatus) {
    return <div className="page-loading">Loading Hydrogen Proxy Training...</div>;
  }

  return (
    <div className="hydrogen-proxy-page">
      <header className="page-header">
        <div className="header-content">
          <h1>⚛️ Phase 17.1: Hydrogen Proxy Training</h1>
          <p className="subtitle">Neural proxy model for fast hydrogen atom predictions</p>
          <div className="user-info">
            <span>{user.accountId}</span>
            <button onClick={onLogout} className="btn-logout">Logout</button>
          </div>
        </div>
      </header>

      {error && <div className="error-message">{error}</div>}

      <main className="page-main">
        <div className="tabs">
          <button 
            className={`tab ${activeTab === 'multi-atom' ? 'active' : ''}`}
            onClick={() => setActiveTab('multi-atom')}
          >
            Multi-Atom (17.2.0)
          </button>
          <button 
            className={`tab ${activeTab === 'training' ? 'active' : ''}`}
            onClick={() => setActiveTab('training')}
          >
            Training (17.1)
          </button>
          <button 
            className={`tab ${activeTab === 'validation' ? 'active' : ''}`}
            onClick={() => setActiveTab('validation')}
          >
            Validation
          </button>
          <button 
            className={`tab ${activeTab === 'comparison' ? 'active' : ''}`}
            onClick={() => setActiveTab('comparison')}
          >
            Comparison
          </button>
        </div>

        <div className="tabs-content">
          {activeTab === 'multi-atom' && (
            <section className="tab-pane multi-atom-section">
              <div className="multi-atom-container">
                <div className="atom-selector-panel">
                  <h3>Select Atom</h3>
                  <AtomSelector 
                    selectedAtom={selectedAtom}
                    onAtomChange={setSelectedAtom}
                    trainedAtoms={trainedAtoms}
                  />
                </div>

                <div className="atom-training-panel">
                  <h3>Training Controls</h3>
                  <PerAtomTrainingPanel 
                    atom={selectedAtom}
                    onTrainStart={(atom) => {
                      if (!trainedAtoms.includes(atom.symbol)) {
                        setTrainedAtoms([...trainedAtoms, atom.symbol]);
                      }
                    }}
                    onTrainStop={() => {
                      loadProxyStatus();
                    }}
                  />
                </div>
              </div>

              <div className="atom-comparison-panel">
                <h3>All Atoms Comparison</h3>
                <ProxyComparisonMatrix />
              </div>
            </section>
          )}

          {activeTab === 'training' && (
            <section className="tab-pane">
              <ProxyTrainingMonitor 
                trainingStatus={trainingStatus}
                onStartTraining={handleStartTraining}
              />
              <HydrogenProxyVisualization 
                proxyModel={proxyModel}
                trainingStatus={trainingStatus}
              />
            </section>
          )}

          {activeTab === 'validation' && (
            <section className="tab-pane">
              <ProxyValidationReport 
                validationResults={validationResults}
                onValidate={handleValidateProxy}
                isLoading={loading}
              />
            </section>
          )}

          {activeTab === 'comparison' && (
            <section className="tab-pane">
              <div className="comparison-panel">
                <h3>Proxy vs Full Simulation</h3>
                <div className="comparison-metrics">
                  {proxyModel && (
                    <>
                      <div className="metric">
                        <label>Speedup Factor</label>
                        <span className="value">{proxyModel.speedup_factor || 25}x</span>
                      </div>
                      <div className="metric">
                        <label>Accuracy</label>
                        <span className="value">{proxyModel.accuracy_percent || 96.5}%</span>
                      </div>
                      <div className="metric">
                        <label>Model Size</label>
                        <span className="value">{proxyModel.model_size_kb || 12} KB</span>
                      </div>
                      <div className="metric">
                        <label>Predictions/sec</label>
                        <span className="value">{proxyModel.throughput || 22222}</span>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </section>
          )}
        </div>
      </main>
    </div>
  );
}

export default HydrogenProxyPage;
