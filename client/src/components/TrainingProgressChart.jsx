/**
 * Training Progress Chart Component
 * Phase 17.2.2: Real-time training metrics visualization
 * 
 * Shows loss and accuracy curves over epochs
 * Supports multiple atoms in parallel
 */

import React, { useState, useEffect, useRef } from 'react';
import '../styles/TrainingProgressChart.css';

export default function TrainingProgressChart({ 
  sessionId = null, 
  coordinatorUrl = 'http://localhost:5000',
  autoRefresh = true 
}) {
  const [milestones, setMilestones] = useState([]);
  const [selectedAtoms, setSelectedAtoms] = useState(['H', 'He', 'Li', 'Be', 'B']);
  const [loading, setLoading] = useState(true);
  const canvasRef = useRef(null);

  // Color mapping for atoms
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
        
        // Filter by session if specified
        let filtered = data.milestones || [];
        if (sessionId) {
          filtered = filtered.filter(m => m.session_id === sessionId);
        }
        
        // Sort by atom and epoch
        filtered.sort((a, b) => {
          if (a.atom !== b.atom) return a.atom.localeCompare(b.atom);
          return a.epoch - b.epoch;
        });
        
        setMilestones(filtered);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching milestones:', err);
        setLoading(false);
      }
    };

    fetchMilestones();
    
    if (autoRefresh) {
      const interval = setInterval(fetchMilestones, 3000); // Update every 3 seconds
      return () => clearInterval(interval);
    }
  }, [sessionId, coordinatorUrl, autoRefresh]);

  // Draw charts on canvas
  useEffect(() => {
    if (!canvasRef.current || milestones.length === 0) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const padding = 60;
    const width = canvas.width - 2 * padding;
    const height = canvas.height - 2 * padding;

    // Clear canvas
    ctx.fillStyle = '#0f0f0f';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw axes
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(padding, padding);
    ctx.lineTo(padding, canvas.height - padding);
    ctx.lineTo(canvas.width - padding, canvas.height - padding);
    ctx.stroke();

    // Draw grid
    ctx.strokeStyle = '#1a1a1a';
    ctx.lineWidth = 1;

    // Get data ranges
    const epochs = [...new Set(milestones.map(m => m.epoch))];
    const maxEpoch = Math.max(...epochs);
    const minLoss = Math.min(...milestones.map(m => m.loss));
    const maxLoss = Math.max(...milestones.map(m => m.loss));
    const lossRange = maxLoss - minLoss || 1;

    // Draw loss curves for each atom
    for (const atom of selectedAtoms) {
      const atomMilestones = milestones.filter(m => m.atom === atom);
      
      if (atomMilestones.length === 0) continue;

      ctx.strokeStyle = atomColors[atom];
      ctx.lineWidth = 2;
      ctx.beginPath();

      let first = true;
      for (const milestone of atomMilestones) {
        const x = padding + (milestone.epoch / maxEpoch) * width;
        const y = canvas.height - padding - ((milestone.loss - minLoss) / lossRange) * height;

        if (first) {
          ctx.moveTo(x, y);
          first = false;
        } else {
          ctx.lineTo(x, y);
        }
      }

      ctx.stroke();

      // Draw points
      ctx.fillStyle = atomColors[atom];
      for (const milestone of atomMilestones.slice(-1)) {
        const x = padding + (milestone.epoch / maxEpoch) * width;
        const y = canvas.height - padding - ((milestone.loss - minLoss) / lossRange) * height;
        ctx.beginPath();
        ctx.arc(x, y, 4, 0, 2 * Math.PI);
        ctx.fill();
      }
    }

    // Draw labels
    ctx.fillStyle = '#aaa';
    ctx.font = '12px monospace';
    ctx.textAlign = 'right';
    ctx.fillText(`Loss (${minLoss.toFixed(3)} - ${maxLoss.toFixed(3)})`, padding - 10, 20);
    ctx.textAlign = 'center';
    ctx.fillText(`Epochs (0 - ${maxEpoch})`, canvas.width / 2, canvas.height - 10);

  }, [milestones, selectedAtoms]);

  const toggleAtom = (atom) => {
    setSelectedAtoms(prev =>
      prev.includes(atom)
        ? prev.filter(a => a !== atom)
        : [...prev, atom]
    );
  };

  if (loading) {
    return <div className="chart-loading">Loading training data...</div>;
  }

  return (
    <div className="training-progress-chart">
      <h2>Training Progress</h2>

      <div className="chart-controls">
        <div className="atom-toggles">
          {['H', 'He', 'Li', 'Be', 'B'].map(atom => (
            <button
              key={atom}
              className={`atom-toggle ${selectedAtoms.includes(atom) ? 'active' : ''}`}
              style={{ 
                backgroundColor: selectedAtoms.includes(atom) ? atomColors[atom] : '#1a1a1a',
                color: selectedAtoms.includes(atom) ? '#0f0f0f' : atomColors[atom],
              }}
              onClick={() => toggleAtom(atom)}
            >
              {atom}
            </button>
          ))}
        </div>
      </div>

      <div className="chart-container">
        <canvas
          ref={canvasRef}
          width={800}
          height={400}
          className="training-canvas"
        ></canvas>
      </div>

      <div className="chart-legend">
        {['H', 'He', 'Li', 'Be', 'B'].map(atom => (
          <div key={atom} className="legend-item">
            <span
              className="legend-color"
              style={{ backgroundColor: atomColors[atom] }}
            ></span>
            <span>{atom}</span>
          </div>
        ))}
      </div>

      {milestones.length > 0 && (
        <div className="chart-stats">
          <div className="stat">
            <strong>Milestones Collected:</strong> {milestones.length}
          </div>
          <div className="stat">
            <strong>Atoms Tracked:</strong> {[...new Set(milestones.map(m => m.atom))].join(', ')}
          </div>
          <div className="stat">
            <strong>Epoch Range:</strong> 0-{Math.max(...milestones.map(m => m.epoch))}
          </div>
        </div>
      )}
    </div>
  );
}
