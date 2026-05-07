/**
 * Unified Dashboard Component
 * Phase 17.2.2: Main dashboard bringing together all visualizations
 * 
 * Shows:
 * - Real-time system metrics
 * - Milestone timeline overview
 * - Convergence analysis
 * - Cluster performance comparison
 * - Alert system for anomalies
 */

import React, { useState, useEffect } from 'react';
import ConvergenceAnalysis from './ConvergenceAnalysis';
import MilestoneTimeline from './MilestoneTimeline';
import ClusterPerformanceComparison from './ClusterPerformanceComparison';
import '../styles/Dashboard.css';

export default function Dashboard({ 
  coordinatorUrl = 'http://localhost:5000' 
}) {
  const [systemMetrics, setSystemMetrics] = useState({});
  const [activeTab, setActiveTab] = useState('overview');
  const [alerts, setAlerts] = useState([]);
  const [sessionInfo, setSessionInfo] = useState(null);

  useEffect(() => {
    const fetchSystemMetrics = async () => {
      try {
        const response = await fetch(`${coordinatorUrl}/api/cluster/metrics`);
        if (!response.ok) throw new Error('Failed to fetch metrics');
        
        const data = await response.json();
        setSystemMetrics(data);

        // Check for anomalies
        checkAnomalies(data);
      } catch (err) {
        console.error('Error fetching metrics:', err);
      }
    };

    // Fetch session info
    const fetchSessionInfo = async () => {
      try {
        const response = await fetch(`${coordinatorUrl}/api/cluster/session`);
        if (!response.ok) throw new Error('Failed to fetch session info');
        
        const data = await response.json();
        setSessionInfo(data);
      } catch (err) {
        console.error('Error fetching session info:', err);
      }
    };

    fetchSystemMetrics();
    fetchSessionInfo();

    const interval = setInterval(() => {
      fetchSystemMetrics();
      fetchSessionInfo();
    }, 2000);

    return () => clearInterval(interval);
  }, [coordinatorUrl]);

  const checkAnomalies = (metrics) => {
    const newAlerts = [];

    // Check for high loss
    if (metrics.avg_loss > 0.5) {
      newAlerts.push({
        id: 'high_loss',
        severity: 'warning',
        message: `High average loss detected: ${metrics.avg_loss.toFixed(4)}`,
        timestamp: new Date(),
      });
    }

    // Check for low accuracy
    if (metrics.avg_accuracy < 0.6) {
      newAlerts.push({
        id: 'low_accuracy',
        severity: 'warning',
        message: `Low average accuracy: ${(metrics.avg_accuracy * 100).toFixed(1)}%`,
        timestamp: new Date(),
      });
    }

    // Check for offline nodes
    if (metrics.offline_nodes > 0) {
      newAlerts.push({
        id: 'offline_nodes',
        severity: 'error',
        message: `${metrics.offline_nodes} nodes offline`,
        timestamp: new Date(),
      });
    }

    // Keep only last 5 alerts
    const recentAlerts = newAlerts
      .concat(alerts)
      .slice(0, 5)
      .reduce((unique, alert) => {
        if (!unique.some(a => a.id === alert.id)) {
          unique.push(alert);
        }
        return unique;
      }, []);

    setAlerts(recentAlerts);
  };

  const dismissAlert = (alertId) => {
    setAlerts(alerts.filter(a => a.id !== alertId));
  };

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <h1>🧬 MistTracker Dashboard</h1>
        <div className="header-status">
          {systemMetrics.status === 'operational' && (
            <span className="status-badge operational">● Operational</span>
          )}
          {systemMetrics.status === 'training' && (
            <span className="status-badge training">● Training</span>
          )}
          {systemMetrics.status === 'idle' && (
            <span className="status-badge idle">● Idle</span>
          )}
        </div>
      </header>

      {/* Alerts */}
      {alerts.length > 0 && (
        <div className="alerts-container">
          {alerts.map(alert => (
            <div
              key={alert.id}
              className={`alert alert-${alert.severity}`}
            >
              <div className="alert-content">
                <span className="alert-message">{alert.message}</span>
              </div>
              <button
                className="alert-dismiss"
                onClick={() => dismissAlert(alert.id)}
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Quick Stats */}
      <div className="quick-stats">
        <div className="stat-card">
          <div className="stat-value">{systemMetrics.online_nodes || 0}</div>
          <div className="stat-label">Online Nodes</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{(systemMetrics.avg_accuracy * 100 || 0).toFixed(1)}%</div>
          <div className="stat-label">Avg Accuracy</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{(systemMetrics.avg_loss || 0).toFixed(4)}</div>
          <div className="stat-label">Avg Loss</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{systemMetrics.total_epochs || 0}</div>
          <div className="stat-label">Total Epochs</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{systemMetrics.atoms_trained || 0}</div>
          <div className="stat-label">Atoms Trained</div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="tab-navigation">
        <button
          className={`tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          Overview
        </button>
        <button
          className={`tab-btn ${activeTab === 'timeline' ? 'active' : ''}`}
          onClick={() => setActiveTab('timeline')}
        >
          Timeline
        </button>
        <button
          className={`tab-btn ${activeTab === 'convergence' ? 'active' : ''}`}
          onClick={() => setActiveTab('convergence')}
        >
          Convergence
        </button>
        <button
          className={`tab-btn ${activeTab === 'comparison' ? 'active' : ''}`}
          onClick={() => setActiveTab('comparison')}
        >
          Performance
        </button>
      </div>

      {/* Tab Content */}
      <div className="tab-content">
        {activeTab === 'overview' && (
          <div className="overview-tab">
            <div className="overview-grid">
              <div className="overview-section">
                <h3>Session Information</h3>
                {sessionInfo ? (
                  <div className="session-details">
                    <div className="detail-row">
                      <span className="label">Session ID:</span>
                      <code>{sessionInfo.session_id?.substring(0, 16)}...</code>
                    </div>
                    <div className="detail-row">
                      <span className="label">Start Time:</span>
                      <span>{new Date(sessionInfo.start_time).toLocaleString()}</span>
                    </div>
                    <div className="detail-row">
                      <span className="label">Status:</span>
                      <span className="status">{sessionInfo.status}</span>
                    </div>
                    <div className="detail-row">
                      <span className="label">Atom Count:</span>
                      <span>{sessionInfo.atom_count}</span>
                    </div>
                  </div>
                ) : (
                  <div className="loading">Loading session info...</div>
                )}
              </div>

              <div className="overview-section">
                <h3>System Resources</h3>
                <div className="resource-info">
                  <div className="resource-bar">
                    <div className="resource-label">CPU Usage</div>
                    <div className="resource-meter">
                      <div
                        className="resource-fill"
                        style={{
                          width: `${systemMetrics.cpu_usage || 0}%`,
                        }}
                      ></div>
                    </div>
                    <div className="resource-value">{(systemMetrics.cpu_usage || 0).toFixed(1)}%</div>
                  </div>
                  <div className="resource-bar">
                    <div className="resource-label">Memory Usage</div>
                    <div className="resource-meter">
                      <div
                        className="resource-fill"
                        style={{
                          width: `${systemMetrics.memory_usage || 0}%`,
                        }}
                      ></div>
                    </div>
                    <div className="resource-value">{(systemMetrics.memory_usage || 0).toFixed(1)}%</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'timeline' && (
          <MilestoneTimeline
            sessionId={sessionInfo?.session_id}
            coordinatorUrl={coordinatorUrl}
          />
        )}

        {activeTab === 'convergence' && (
          <ConvergenceAnalysis
            sessionId={sessionInfo?.session_id}
            coordinatorUrl={coordinatorUrl}
          />
        )}

        {activeTab === 'comparison' && (
          <ClusterPerformanceComparison
            coordinatorUrl={coordinatorUrl}
          />
        )}
      </div>

      {/* Footer */}
      <footer className="dashboard-footer">
        <div className="footer-text">
          Last updated: {new Date().toLocaleTimeString()}
        </div>
      </footer>
    </div>
  );
}
