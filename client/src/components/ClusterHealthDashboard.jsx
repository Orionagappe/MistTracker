/**
 * Cluster Health Dashboard Component
 * Phase 17.2.2: Real-time cluster health and status monitoring
 * 
 * Shows:
 * - Overall cluster health
 * - Per-node status
 * - CPU/Memory usage
 * - Connection status
 */

import React, { useState, useEffect } from 'react';
import '../styles/ClusterHealthDashboard.css';

export default function ClusterHealthDashboard({ coordinatorUrl = 'http://localhost:5000' }) {
  const [clusterHealth, setClusterHealth] = useState(null);
  const [nodes, setNodes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const response = await fetch(`${coordinatorUrl}/api/cluster/status`);
        if (!response.ok) throw new Error('Failed to fetch cluster status');
        
        const data = await response.json();
        setClusterHealth(data.cluster_health);
        setNodes(data.nodes || []);
        setError(null);
      } catch (err) {
        console.error('Error fetching cluster status:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchStatus();
    const interval = setInterval(fetchStatus, 5000); // Update every 5 seconds
    return () => clearInterval(interval);
  }, [coordinatorUrl]);

  const getHealthColor = (healthy, total) => {
    const ratio = healthy / total;
    if (ratio === 1) return '#00ff88'; // Green - all healthy
    if (ratio >= 0.8) return '#ffaa00'; // Orange - degraded
    return '#ff5555'; // Red - many unhealthy
  };

  const getNodeStatusIcon = (status) => {
    switch (status) {
      case 'healthy':
        return '🟢';
      case 'degraded':
        return '🟡';
      case 'disconnected':
      case 'offline':
        return '🔴';
      default:
        return '⚪';
    }
  };

  if (loading) {
    return <div className="cluster-health-loading">Loading cluster status...</div>;
  }

  return (
    <div className="cluster-health-dashboard">
      <h2>Cluster Health</h2>

      {error && <div className="error-message">{error}</div>}

      {clusterHealth && (
        <div className="health-cards">
          <div className="health-card">
            <div className="card-label">Healthy Nodes</div>
            <div className="card-value" style={{ color: getHealthColor(clusterHealth.healthy_nodes, clusterHealth.total_nodes) }}>
              {clusterHealth.healthy_nodes} / {clusterHealth.total_nodes}
            </div>
            <div className="health-bar">
              <div
                className="health-bar-fill"
                style={{
                  width: `${(clusterHealth.healthy_nodes / clusterHealth.total_nodes) * 100}%`,
                  backgroundColor: getHealthColor(clusterHealth.healthy_nodes, clusterHealth.total_nodes),
                }}
              ></div>
            </div>
          </div>

          <div className="health-card">
            <div className="card-label">Avg CPU Usage</div>
            <div className="card-value">{clusterHealth.avg_cpu_usage.toFixed(1)}%</div>
            <div className="health-bar">
              <div
                className="health-bar-fill cpu"
                style={{ width: `${Math.min(clusterHealth.avg_cpu_usage, 100)}%` }}
              ></div>
            </div>
          </div>

          <div className="health-card">
            <div className="card-label">Avg Memory Usage</div>
            <div className="card-value">{clusterHealth.avg_memory_usage_mb.toFixed(0)} MB</div>
            <div className="health-bar">
              <div
                className="health-bar-fill memory"
                style={{ width: `${Math.min((clusterHealth.avg_memory_usage_mb / 256) * 100, 100)}%` }}
              ></div>
            </div>
          </div>
        </div>
      )}

      <h3>Node Status</h3>
      <div className="nodes-grid">
        {nodes.length > 0 ? (
          nodes.map((node) => (
            <div key={node.id} className={`node-card status-${node.status}`}>
              <div className="node-header">
                <span className="node-icon">{getNodeStatusIcon(node.status)}</span>
                <span className="node-id">{node.id}</span>
                <span className="node-atom">{node.atom}</span>
              </div>
              <div className="node-status-text">{node.status}</div>
              {node.training_active && (
                <div className="node-training">
                  Training: Epoch {node.current_epoch}/{node.total_epochs}
                </div>
              )}
              <div className="node-lastbeat">
                {node.last_heartbeat
                  ? new Date(node.last_heartbeat).toLocaleTimeString()
                  : 'Never'}
              </div>
            </div>
          ))
        ) : (
          <p>No nodes connected</p>
        )}
      </div>
    </div>
  );
}
