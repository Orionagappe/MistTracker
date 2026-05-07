/**
 * Cluster Performance Comparison Component
 * Phase 17.2.2: Compare performance across different cluster runs
 * 
 * Shows:
 * - Performance metrics across sessions
 * - Heatmap of atom performance
 * - Best/worst performing configurations
 * - Performance trends
 */

import React, { useState, useEffect } from 'react';
import '../styles/ClusterPerformanceComparison.css';

export default function ClusterPerformanceComparison({ 
  coordinatorUrl = 'http://localhost:5000' 
}) {
  const [sessions, setSessions] = useState([]);
  const [performanceData, setPerformanceData] = useState({});
  const [selectedAtom, setSelectedAtom] = useState(null);
  const [sortBy, setSortBy] = useState('avg_accuracy');

  const atomColors = {
    H: '#ff6b6b',
    He: '#4ecdc4',
    Li: '#ffe66d',
    Be: '#95e1d3',
    B: '#f38181',
  };

  useEffect(() => {
    const fetchPerformanceData = async () => {
      try {
        const response = await fetch(`${coordinatorUrl}/api/cluster/performance`);
        if (!response.ok) throw new Error('Failed to fetch performance data');
        
        const data = await response.json();
        setSessions(data.sessions || []);
        setPerformanceData(data.performance || {});
      } catch (err) {
        console.error('Error fetching performance data:', err);
      }
    };

    fetchPerformanceData();
    const interval = setInterval(fetchPerformanceData, 5000);
    return () => clearInterval(interval);
  }, [coordinatorUrl]);

  const getHeatmapColor = (value, min, max) => {
    if (value === null) return '#333';
    
    const normalized = (value - min) / (max - min);
    
    // Red -> Yellow -> Green
    if (normalized < 0.5) {
      const r = 255;
      const g = Math.floor(255 * (normalized * 2));
      return `rgb(${r}, ${g}, 0)`;
    } else {
      const r = Math.floor(255 * (2 - normalized * 2));
      const g = 255;
      return `rgb(${r}, ${g}, 0)`;
    }
  };

  const getAtomStats = () => {
    const stats = {};
    
    for (const sessionId in performanceData) {
      const sessionData = performanceData[sessionId];
      
      for (const atom in sessionData) {
        if (!stats[atom]) {
          stats[atom] = {
            accuracies: [],
            losses: [],
            counts: 0,
          };
        }
        
        stats[atom].accuracies.push(sessionData[atom].avg_accuracy);
        stats[atom].losses.push(sessionData[atom].avg_loss);
        stats[atom].counts++;
      }
    }
    
    // Calculate final metrics
    for (const atom in stats) {
      const accs = stats[atom].accuracies;
      const losses = stats[atom].losses;
      
      stats[atom].avg_accuracy = accs.reduce((a, b) => a + b) / accs.length;
      stats[atom].best_accuracy = Math.max(...accs);
      stats[atom].worst_accuracy = Math.min(...accs);
      stats[atom].avg_loss = losses.reduce((a, b) => a + b) / losses.length;
    }
    
    return stats;
  };

  const getSessionSummary = (sessionData) => {
    const atoms = Object.keys(sessionData);
    const accuracies = atoms
      .map(a => sessionData[a].avg_accuracy)
      .filter(a => a !== null);
    const losses = atoms
      .map(a => sessionData[a].avg_loss)
      .filter(l => l !== null);

    return {
      avg_accuracy: accuracies.length > 0 
        ? accuracies.reduce((a, b) => a + b) / accuracies.length 
        : 0,
      avg_loss: losses.length > 0 
        ? losses.reduce((a, b) => a + b) / losses.length 
        : 0,
      atom_count: atoms.length,
    };
  };

  const getHeatmapMetric = (sessionData, atom, metric) => {
    if (!sessionData[atom]) return null;
    return sessionData[atom][metric];
  };

  // Prepare data for sorting
  const sortedSessions = [...sessions].sort((a, b) => {
    const aSummary = getSessionSummary(performanceData[a.session_id] || {});
    const bSummary = getSessionSummary(performanceData[b.session_id] || {});

    if (sortBy === 'avg_accuracy') {
      return bSummary.avg_accuracy - aSummary.avg_accuracy;
    } else if (sortBy === 'avg_loss') {
      return aSummary.avg_loss - bSummary.avg_loss;
    } else if (sortBy === 'time') {
      return new Date(b.start_time) - new Date(a.start_time);
    }
    return 0;
  });

  const atomStats = getAtomStats();
  const allAccuracies = Object.values(atomStats)
    .flatMap(a => a.accuracies)
    .filter(a => a !== null);
  const minAccuracy = Math.min(...allAccuracies);
  const maxAccuracy = Math.max(...allAccuracies);

  return (
    <div className="cluster-performance">
      <h2>Cluster Performance Comparison</h2>

      {/* Sort Controls */}
      <div className="sort-controls">
        <label>Sort by:</label>
        <select value={sortBy} onChange={e => setSortBy(e.target.value)}>
          <option value="avg_accuracy">Average Accuracy (High to Low)</option>
          <option value="avg_loss">Average Loss (Low to High)</option>
          <option value="time">Time (Newest First)</option>
        </select>
      </div>

      {/* Heatmap */}
      <div className="heatmap-section">
        <h3>Performance Heatmap (Accuracy)</h3>
        <div className="heatmap-container">
          <table className="heatmap-table">
            <thead>
              <tr>
                <th>Session</th>
                {Object.keys(atomStats).map(atom => (
                  <th
                    key={atom}
                    className="atom-header"
                    style={{ 
                      color: atomColors[atom],
                      cursor: 'pointer',
                    }}
                    onClick={() => setSelectedAtom(selectedAtom === atom ? null : atom)}
                  >
                    {atom}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sortedSessions.map(session => (
                <tr key={session.session_id}>
                  <td className="session-label">
                    <strong>{session.session_id.substring(0, 8)}</strong>
                    <div className="session-time">
                      {new Date(session.start_time).toLocaleString()}
                    </div>
                  </td>
                  {Object.keys(atomStats).map(atom => {
                    const value = getHeatmapMetric(
                      performanceData[session.session_id] || {},
                      atom,
                      'avg_accuracy'
                    );
                    const color = getHeatmapColor(value, minAccuracy, maxAccuracy);
                    
                    return (
                      <td
                        key={`${session.session_id}-${atom}`}
                        className={`heatmap-cell ${selectedAtom === atom ? 'selected' : ''}`}
                        style={{ backgroundColor: value !== null ? color : '#333' }}
                        title={`${atom}: ${value !== null ? (value * 100).toFixed(2) + '%' : 'N/A'}`}
                      >
                        {value !== null ? (value * 100).toFixed(0) : '-'}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Summary Statistics */}
      <div className="summary-section">
        <h3>Per-Atom Statistics</h3>
        <div className="stats-grid">
          {Object.entries(atomStats).map(([atom, stats]) => (
            <div
              key={atom}
              className={`stat-box ${selectedAtom === atom ? 'selected' : ''}`}
              style={{ borderColor: atomColors[atom] }}
              onClick={() => setSelectedAtom(selectedAtom === atom ? null : atom)}
            >
              <div className="stat-header" style={{ color: atomColors[atom] }}>
                {atom}
              </div>
              <div className="stat-metrics">
                <div className="metric">
                  <span className="label">Average Accuracy:</span>
                  <span className="value">{(stats.avg_accuracy * 100).toFixed(2)}%</span>
                </div>
                <div className="metric">
                  <span className="label">Best Accuracy:</span>
                  <span className="value">{(stats.best_accuracy * 100).toFixed(2)}%</span>
                </div>
                <div className="metric">
                  <span className="label">Worst Accuracy:</span>
                  <span className="value">{(stats.worst_accuracy * 100).toFixed(2)}%</span>
                </div>
                <div className="metric">
                  <span className="label">Average Loss:</span>
                  <span className="value">{stats.avg_loss.toFixed(6)}</span>
                </div>
                <div className="metric">
                  <span className="label">Samples:</span>
                  <span className="value">{stats.counts}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Best/Worst Session Summary */}
      {sortedSessions.length > 0 && (
        <div className="rankings-section">
          <div className="ranking-pair">
            <div className="ranking best">
              <h4>🏆 Best Performing Session</h4>
              <div className="session-info">
                <div className="session-id">{sortedSessions[0].session_id.substring(0, 8)}</div>
                <div className="session-metrics">
                  <div>
                    Avg Accuracy: <strong>
                      {(getSessionSummary(performanceData[sortedSessions[0].session_id] || {}).avg_accuracy * 100).toFixed(2)}%
                    </strong>
                  </div>
                  <div>
                    Atoms: <strong>
                      {getSessionSummary(performanceData[sortedSessions[0].session_id] || {}).atom_count}
                    </strong>
                  </div>
                </div>
              </div>
            </div>

            {sortedSessions.length > 1 && (
              <div className="ranking worst">
                <h4>📉 Worst Performing Session</h4>
                <div className="session-info">
                  <div className="session-id">
                    {sortedSessions[sortedSessions.length - 1].session_id.substring(0, 8)}
                  </div>
                  <div className="session-metrics">
                    <div>
                      Avg Accuracy: <strong>
                        {(getSessionSummary(performanceData[sortedSessions[sortedSessions.length - 1].session_id] || {}).avg_accuracy * 100).toFixed(2)}%
                      </strong>
                    </div>
                    <div>
                      Atoms: <strong>
                        {getSessionSummary(performanceData[sortedSessions[sortedSessions.length - 1].session_id] || {}).atom_count}
                      </strong>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {sessions.length === 0 && (
        <div className="no-data">No performance data available yet. Start training to see comparisons.</div>
      )}
    </div>
  );
}
