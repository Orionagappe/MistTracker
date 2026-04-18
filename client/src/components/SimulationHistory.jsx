/**
 * Task B5: Simulation History Component
 * Phase 16: Milestone & Versioning System
 * 
 * Main UI component for viewing simulation history, DAG, and milestones.
 * Allows comparing versions, viewing metadata, and restoring from checkpoints.
 */

import React, { useState, useEffect } from 'react';
import SimulationHistoryGraph from './SimulationHistoryGraph';
import './SimulationHistory.css';

/**
 * SimulationHistory: main component for simulation version history
 */
export default function SimulationHistory({ sessionId, onVersionSelect }) {
  const [versions, setVersions] = useState([]);
  const [milestones, setMilestones] = useState([]);
  const [selectedVersionId, setSelectedVersionId] = useState(null);
  const [compareVersionId, setCompareVersionId] = useState(null);
  const [graphData, setGraphData] = useState({ nodes: [], edges: [] });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [viewMode, setViewMode] = useState('graph'); // 'graph', 'timeline', 'compare'
  const [filterTag, setFilterTag] = useState('');
  const [allTags, setAllTags] = useState([]);

  // Fetch version graph and milestones on mount
  useEffect(() => {
    if (sessionId) {
      loadHistoryData();
    }
  }, [sessionId]);

  /**
   * Load version graph and milestone data
   */
  const loadHistoryData = async () => {
    setLoading(true);
    setError(null);

    try {
      // Fetch version graph
      const versionRes = await fetch(`/api/versions/graph/${sessionId}`);
      if (!versionRes.ok) throw new Error('Failed to load version graph');
      const versionData = await versionRes.json();
      setVersions(versionData.versions || []);
      setGraphData(versionData.graphData || { nodes: [], edges: [] });

      // Fetch milestones
      const milestoneRes = await fetch(`/api/milestones/session/${sessionId}`);
      if (milestoneRes.ok) {
        const milestoneData = await milestoneRes.json();
        setMilestones(milestoneData.milestones || []);

        // Extract tags
        const tags = new Set();
        milestoneData.milestones.forEach(m => {
          if (m.metadata?.tags) {
            m.metadata.tags.forEach(tag => tags.add(tag));
          }
        });
        setAllTags(Array.from(tags));
      }
    } catch (err) {
      setError(err.message);
      console.error('Error loading history:', err);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handle version node selection in graph
   */
  const handleVersionSelect = (versionId) => {
    setSelectedVersionId(versionId);
    if (onVersionSelect) {
      onVersionSelect(versionId);
    }
  };

  /**
   * Get milestone for version
   */
  const getMilestoneForVersion = (versionId) => {
    return milestones.find(m => m.versionId === versionId);
  };

  /**
   * Get version details
   */
  const getVersionDetails = (versionId) => {
    return versions.find(v => v.versionId === versionId);
  };

  /**
   * Render version card
   */
  const renderVersionCard = (version) => {
    const milestone = getMilestoneForVersion(version.versionId);

    return (
      <div
        key={version.versionId}
        className={`version-card ${selectedVersionId === version.versionId ? 'selected' : ''}`}
        onClick={() => handleVersionSelect(version.versionId)}
      >
        <div className="version-header">
          <h4>{version.branchName || 'Main'}</h4>
          <span className="version-id">{version.versionId.substring(0, 8)}</span>
        </div>

        {version.description && (
          <p className="version-description">{version.description}</p>
        )}

        {milestone && (
          <div className="milestone-info">
            <div className="milestone-type">
              <span className={`badge badge-${milestone.type}`}>
                {milestone.type.replace('-', ' ')}
              </span>
            </div>
            {milestone.metadata?.tags && (
              <div className="tags">
                {milestone.metadata.tags.map(tag => (
                  <span key={tag} className="tag">{tag}</span>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="version-stats">
          <div className="stat">
            <span className="label">Children:</span>
            <span className="value">{version.children?.length || 0}</span>
          </div>
          {milestone?.metadata?.runtimeMetrics && (
            <div className="stat">
              <span className="label">Accuracy:</span>
              <span className="value">
                {(milestone.metadata.runtimeMetrics.accuracyScore * 100).toFixed(1)}%
              </span>
            </div>
          )}
        </div>

        <div className="version-actions">
          <button
            className="btn btn-small"
            onClick={e => {
              e.stopPropagation();
              setCompareVersionId(version.versionId);
              setViewMode('compare');
            }}
          >
            Compare
          </button>
          <button
            className="btn btn-small btn-restore"
            onClick={e => {
              e.stopPropagation();
              restoreVersion(version.versionId);
            }}
          >
            Restore
          </button>
        </div>
      </div>
    );
  };

  /**
   * Restore version from checkpoint
   */
  const restoreVersion = async (versionId) => {
    try {
      const res = await fetch(`/api/checkpoints/version/${versionId}`);
      if (!res.ok) throw new Error('Failed to load checkpoint');
      const checkpoint = await res.json();

      // Dispatch to parent or trigger restore
      if (onVersionSelect) {
        onVersionSelect(versionId, checkpoint);
      }

      alert(`✓ Loaded version ${versionId.substring(0, 8)}`);
    } catch (err) {
      alert(`Error restoring version: ${err.message}`);
    }
  };

  /**
   * Render timeline view
   */
  const renderTimelineView = () => {
    const sortedMilestones = [...milestones].sort(
      (a, b) => new Date(a.timestamp) - new Date(b.timestamp)
    );

    return (
      <div className="timeline-view">
        <div className="timeline">
          {sortedMilestones.map((milestone, idx) => (
            <div key={milestone.milestoneId} className="timeline-item">
              <div className="timeline-marker">
                <span className={`dot dot-${milestone.type}`} />
              </div>
              <div className="timeline-content">
                <div className="timeline-header">
                  <h4>{milestone.type.replace('-', ' ')}</h4>
                  <span className="time">
                    {new Date(milestone.timestamp).toLocaleString()}
                  </span>
                </div>

                {milestone.metadata?.description && (
                  <p>{milestone.metadata.description}</p>
                )}

                {milestone.metadata?.runtimeMetrics && (
                  <div className="metrics">
                    <div className="metric">
                      <span>Accuracy:</span>
                      <span className="value">
                        {(milestone.metadata.runtimeMetrics.accuracyScore * 100).toFixed(1)}%
                      </span>
                    </div>
                    <div className="metric">
                      <span>Memory:</span>
                      <span className="value">
                        {milestone.metadata.runtimeMetrics.peakMemoryMb}MB
                      </span>
                    </div>
                    <div className="metric">
                      <span>Duration:</span>
                      <span className="value">
                        {(milestone.metadata.runtimeMetrics.duration / 1000).toFixed(2)}s
                      </span>
                    </div>
                  </div>
                )}

                {milestone.metadata?.tags && (
                  <div className="tags">
                    {milestone.metadata.tags.map(tag => (
                      <span key={tag} className="tag">{tag}</span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  /**
   * Render comparison view
   */
  const renderCompareView = () => {
    const v1 = getVersionDetails(selectedVersionId);
    const v2 = getVersionDetails(compareVersionId);

    if (!v1 || !v2) {
      return <div className="compare-view error">Select two versions to compare</div>;
    }

    const m1 = getMilestoneForVersion(selectedVersionId);
    const m2 = getMilestoneForVersion(compareVersionId);

    return (
      <div className="compare-view">
        <div className="compare-column">
          <h3>{v1.branchName || 'Version 1'}</h3>
          <div className="compare-content">
            {v1.description && <p><strong>Description:</strong> {v1.description}</p>}
            {m1?.metadata?.runtimeMetrics && (
              <div className="metrics">
                <h4>Metrics</h4>
                <div className="metric-item">
                  <span>Accuracy:</span>
                  <span>{(m1.metadata.runtimeMetrics.accuracyScore * 100).toFixed(1)}%</span>
                </div>
                <div className="metric-item">
                  <span>Memory:</span>
                  <span>{m1.metadata.runtimeMetrics.peakMemoryMb}MB</span>
                </div>
                <div className="metric-item">
                  <span>Duration:</span>
                  <span>{(m1.metadata.runtimeMetrics.duration / 1000).toFixed(2)}s</span>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="compare-column">
          <h3>{v2.branchName || 'Version 2'}</h3>
          <div className="compare-content">
            {v2.description && <p><strong>Description:</strong> {v2.description}</p>}
            {m2?.metadata?.runtimeMetrics && (
              <div className="metrics">
                <h4>Metrics</h4>
                <div className="metric-item">
                  <span>Accuracy:</span>
                  <span>{(m2.metadata.runtimeMetrics.accuracyScore * 100).toFixed(1)}%</span>
                </div>
                <div className="metric-item">
                  <span>Memory:</span>
                  <span>{m2.metadata.runtimeMetrics.peakMemoryMb}MB</span>
                </div>
                <div className="metric-item">
                  <span>Duration:</span>
                  <span>{(m2.metadata.runtimeMetrics.duration / 1000).toFixed(2)}s</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return <div className="simulation-history loading">Loading history...</div>;
  }

  if (error) {
    return <div className="simulation-history error">Error: {error}</div>;
  }

  return (
    <div className="simulation-history">
      <div className="history-header">
        <h2>Simulation History</h2>
        <div className="view-controls">
          <button
            className={`btn ${viewMode === 'graph' ? 'active' : ''}`}
            onClick={() => setViewMode('graph')}
          >
            DAG View
          </button>
          <button
            className={`btn ${viewMode === 'timeline' ? 'active' : ''}`}
            onClick={() => setViewMode('timeline')}
          >
            Timeline
          </button>
          <button
            className={`btn ${viewMode === 'compare' ? 'active' : ''}`}
            onClick={() => setViewMode('compare')}
          >
            Compare
          </button>
          <button className="btn btn-refresh" onClick={loadHistoryData}>
            ↻ Refresh
          </button>
        </div>
      </div>

      {allTags.length > 0 && (
        <div className="tag-filter">
          <label>Filter by tag:</label>
          <select value={filterTag} onChange={e => setFilterTag(e.target.value)}>
            <option value="">All</option>
            {allTags.map(tag => (
              <option key={tag} value={tag}>{tag}</option>
            ))}
          </select>
        </div>
      )}

      <div className="history-content">
        {viewMode === 'graph' && (
          <SimulationHistoryGraph
            graphData={graphData}
            onNodeSelect={handleVersionSelect}
            selectedNodeId={selectedVersionId}
          />
        )}

        {viewMode === 'timeline' && renderTimelineView()}

        {viewMode === 'compare' && renderCompareView()}

        {viewMode === 'graph' && (
          <div className="versions-list">
            <h3>Versions ({versions.length})</h3>
            <div className="cards-container">
              {versions.map(version => renderVersionCard(version))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
