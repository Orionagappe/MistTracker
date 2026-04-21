/**
 * Milestone Timeline Component
 * Phase 17.2.2: Visual timeline of milestones from all atoms
 * 
 * Shows:
 * - Timeline of milestones ordered by time
 * - Milestone details on hover
 * - Per-atom tracks
 * - Quick metrics overview
 */

import React, { useState, useEffect } from 'react';
import '../styles/MilestoneTimeline.css';

export default function MilestoneTimeline({ 
  sessionId = null,
  coordinatorUrl = 'http://localhost:5000' 
}) {
  const [milestones, setMilestones] = useState([]);
  const [hoveredMilestone, setHoveredMilestone] = useState(null);
  const [atoms, setAtoms] = useState([]);

  const atomColors = {
    H: '#ff6b6b',
    He: '#4ecdc4',
    Li: '#ffe66d',
    Be: '#95e1d3',
    B: '#f38181',
  };

  useEffect(() => {
    const fetchMilestones = async () => {
      try {
        const response = await fetch(`${coordinatorUrl}/api/cluster/milestones`);
        if (!response.ok) throw new Error('Failed to fetch milestones');
        
        const data = await response.json();
        let filtered = data.milestones || [];
        
        if (sessionId) {
          filtered = filtered.filter(m => m.session_id === sessionId);
        }
        
        // Sort by timestamp
        filtered.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
        
        setMilestones(filtered);
        setAtoms([...new Set(filtered.map(m => m.atom))]);
      } catch (err) {
        console.error('Error fetching milestones:', err);
      }
    };

    fetchMilestones();
    const interval = setInterval(fetchMilestones, 3000);
    return () => clearInterval(interval);
  }, [sessionId, coordinatorUrl]);

  const getTimelinePosition = (index) => {
    return (index / Math.max(milestones.length - 1, 1)) * 100;
  };

  const getMilestonesByAtom = () => {
    const byAtom = {};
    for (const atom of atoms) {
      byAtom[atom] = milestones.filter(m => m.atom === atom);
    }
    return byAtom;
  };

  const getMilestoneMetrics = (atomMilestones) => {
    if (atomMilestones.length === 0) return null;
    
    const latest = atomMilestones[atomMilestones.length - 1];
    const accuracies = atomMilestones.map(m => m.accuracy);
    const losses = atomMilestones.map(m => m.loss);

    return {
      latest,
      bestAccuracy: Math.max(...accuracies),
      avgAccuracy: accuracies.reduce((a, b) => a + b) / accuracies.length,
      avgLoss: losses.reduce((a, b) => a + b) / losses.length,
      count: atomMilestones.length,
    };
  };

  const milestonesByAtom = getMilestonesByAtom();

  return (
    <div className="milestone-timeline">
      <h2>Milestone Timeline</h2>

      <div className="timeline-container">
        <div className="timeline-track main-timeline">
          <div className="timeline-label">All Events</div>
          <div className="timeline-events">
            {milestones.map((milestone, index) => (
              <div
                key={`${milestone.node_id}-${milestone.epoch}`}
                className="timeline-point"
                style={{
                  left: `${getTimelinePosition(index)}%`,
                  backgroundColor: atomColors[milestone.atom] || '#aaa',
                }}
                onMouseEnter={() => setHoveredMilestone(milestone)}
                onMouseLeave={() => setHoveredMilestone(null)}
                title={`${milestone.atom}:${milestone.epoch}`}
              >
                <div className="timeline-dot"></div>
              </div>
            ))}
          </div>
        </div>

        {/* Per-atom tracks */}
        {atoms.map(atom => (
          <div key={atom} className="timeline-track atom-track" style={{ borderColor: atomColors[atom] }}>
            <div className="timeline-label">{atom}</div>
            <div className="timeline-events">
              {milestonesByAtom[atom].map((milestone, index) => (
                <div
                  key={`${atom}-${milestone.epoch}`}
                  className="timeline-point"
                  style={{
                    left: `${getTimelinePosition(milestones.indexOf(milestone))}%`,
                    backgroundColor: atomColors[atom],
                  }}
                  onMouseEnter={() => setHoveredMilestone(milestone)}
                  onMouseLeave={() => setHoveredMilestone(null)}
                >
                  <div className="timeline-dot"></div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Milestone Details */}
      {hoveredMilestone && (
        <div className="milestone-detail">
          <div className="detail-header">
            <span
              className="detail-atom"
              style={{ backgroundColor: atomColors[hoveredMilestone.atom] }}
            >
              {hoveredMilestone.atom}
            </span>
            <strong>Epoch {hoveredMilestone.epoch}</strong>
          </div>
          <div className="detail-metrics">
            <div className="metric">
              <span className="metric-label">Accuracy:</span>
              <span className="metric-value">{(hoveredMilestone.accuracy * 100).toFixed(2)}%</span>
            </div>
            <div className="metric">
              <span className="metric-label">Loss:</span>
              <span className="metric-value">{hoveredMilestone.loss.toFixed(6)}</span>
            </div>
            <div className="metric">
              <span className="metric-label">Timestamp:</span>
              <span className="metric-value">
                {new Date(hoveredMilestone.timestamp).toLocaleTimeString()}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Per-atom Statistics */}
      <div className="atom-stats">
        <h3>Per-Atom Statistics</h3>
        <div className="stats-grid">
          {atoms.map(atom => {
            const metrics = getMilestoneMetrics(milestonesByAtom[atom]);
            return (
              <div key={atom} className="stat-card" style={{ borderColor: atomColors[atom] }}>
                <div className="stat-header" style={{ color: atomColors[atom] }}>
                  {atom}
                </div>
                {metrics && (
                  <>
                    <div className="stat-row">
                      <span>Milestones:</span>
                      <strong>{metrics.count}</strong>
                    </div>
                    <div className="stat-row">
                      <span>Latest Accuracy:</span>
                      <strong>{(metrics.latest.accuracy * 100).toFixed(2)}%</strong>
                    </div>
                    <div className="stat-row">
                      <span>Best Accuracy:</span>
                      <strong>{(metrics.bestAccuracy * 100).toFixed(2)}%</strong>
                    </div>
                    <div className="stat-row">
                      <span>Avg Accuracy:</span>
                      <strong>{(metrics.avgAccuracy * 100).toFixed(2)}%</strong>
                    </div>
                    <div className="stat-row">
                      <span>Avg Loss:</span>
                      <strong>{metrics.avgLoss.toFixed(6)}</strong>
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {milestones.length === 0 && (
        <div className="no-data">No milestones collected yet. Start training to see timeline.</div>
      )}
    </div>
  );
}
