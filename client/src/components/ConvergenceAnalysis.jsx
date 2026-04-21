/**
 * Convergence Analysis Component
 * Phase 17.2.2: Accuracy/loss convergence visualization and analysis
 * 
 * Shows:
 * - Accuracy curves over epochs
 * - Loss convergence patterns
 * - Convergence detection markers
 * - Per-atom performance comparison
 */

import React, { useState, useEffect, useRef } from 'react';
import '../styles/ConvergenceAnalysis.css';

export default function ConvergenceAnalysis({ 
  sessionId = null,
  coordinatorUrl = 'http://localhost:5000' 
}) {
  const [milestones, setMilestones] = useState([]);
  const [convergenceData, setConvergenceData] = useState({});
  const [selectedMetric, setSelectedMetric] = useState('accuracy');
  const canvasRef = useRef(null);

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
        
        filtered.sort((a, b) => {
          if (a.atom !== b.atom) return a.atom.localeCompare(b.atom);
          return a.epoch - b.epoch;
        });
        
        setMilestones(filtered);
        analyzeConvergence(filtered);
      } catch (err) {
        console.error('Error fetching milestones:', err);
      }
    };

    fetchMilestones();
    const interval = setInterval(fetchMilestones, 5000);
    return () => clearInterval(interval);
  }, [sessionId, coordinatorUrl]);

  const analyzeConvergence = (mileList) => {
    const convergence = {};
    const atoms = [...new Set(mileList.map(m => m.atom))];

    for (const atom of atoms) {
      const atomMiles = mileList.filter(m => m.atom === atom);
      
      if (atomMiles.length < 2) continue;

      let convergenceEpoch = null;
      let convergenceTime = null;
      let convergenceLoss = null;

      // Check for convergence: loss improvement < 1% over 5 epochs
      for (let i = 5; i < atomMiles.length; i++) {
        const recent = atomMiles.slice(i - 5, i).map(m => m.loss);
        const minLoss = Math.min(...recent);
        const improvement = (recent[0] - minLoss) / recent[0];

        if (improvement < 0.01 && !convergenceEpoch) {
          convergenceEpoch = atomMiles[i].epoch;
          convergenceLoss = atomMiles[i].loss;
          if (atomMiles[i].metadata?.training_elapsed_ms) {
            convergenceTime = atomMiles[i].metadata.training_elapsed_ms;
          }
          break;
        }
      }

      convergence[atom] = {
        convergenceEpoch,
        convergenceTime,
        convergenceLoss,
        finalAccuracy: atomMiles[atomMiles.length - 1].accuracy,
        finalLoss: atomMiles[atomMiles.length - 1].loss,
        bestAccuracy: Math.max(...atomMiles.map(m => m.accuracy)),
        minLoss: Math.min(...atomMiles.map(m => m.loss)),
        totalEpochs: atomMiles[atomMiles.length - 1].epoch,
      };
    }

    setConvergenceData(convergence);
  };

  // Draw convergence chart
  useEffect(() => {
    if (!canvasRef.current || milestones.length === 0) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const padding = 60;
    const width = canvas.width - 2 * padding;
    const height = canvas.height - 2 * padding;

    // Clear
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

    // Get ranges
    const maxEpoch = Math.max(...milestones.map(m => m.epoch));
    const atoms = [...new Set(milestones.map(m => m.atom))];

    let minVal, maxVal;
    if (selectedMetric === 'accuracy') {
      minVal = 0.4;
      maxVal = 1.0;
    } else {
      const losses = milestones.map(m => m.loss);
      minVal = Math.min(...losses);
      maxVal = Math.max(...losses);
    }

    // Draw curves
    for (const atom of atoms) {
      const atomMiles = milestones.filter(m => m.atom === atom);
      
      ctx.strokeStyle = atomColors[atom];
      ctx.lineWidth = 2;
      ctx.beginPath();

      let first = true;
      for (const milestone of atomMiles) {
        const x = padding + (milestone.epoch / maxEpoch) * width;
        const value = selectedMetric === 'accuracy' ? milestone.accuracy : milestone.loss;
        const y = canvas.height - padding - ((value - minVal) / (maxVal - minVal)) * height;

        if (first) {
          ctx.moveTo(x, y);
          first = false;
        } else {
          ctx.lineTo(x, y);
        }
      }

      ctx.stroke();

      // Draw convergence marker if detected
      if (convergenceData[atom]?.convergenceEpoch) {
        const convEpoch = convergenceData[atom].convergenceEpoch;
        const x = padding + (convEpoch / maxEpoch) * width;
        
        // Draw vertical line
        ctx.strokeStyle = atomColors[atom];
        ctx.setLineDash([5, 5]);
        ctx.beginPath();
        ctx.moveTo(x, padding);
        ctx.lineTo(x, canvas.height - padding);
        ctx.stroke();
        ctx.setLineDash([]);
      }
    }

    // Draw labels
    ctx.fillStyle = '#aaa';
    ctx.font = '12px monospace';
    ctx.textAlign = 'right';
    if (selectedMetric === 'accuracy') {
      ctx.fillText('Accuracy (0.4 - 1.0)', padding - 10, 20);
    } else {
      ctx.fillText(`Loss (${minVal.toFixed(3)} - ${maxVal.toFixed(3)})`, padding - 10, 20);
    }

  }, [milestones, selectedMetric, convergenceData]);

  return (
    <div className="convergence-analysis">
      <h2>Convergence Analysis</h2>

      <div className="metric-selector">
        <button
          className={`metric-btn ${selectedMetric === 'accuracy' ? 'active' : ''}`}
          onClick={() => setSelectedMetric('accuracy')}
        >
          Accuracy
        </button>
        <button
          className={`metric-btn ${selectedMetric === 'loss' ? 'active' : ''}`}
          onClick={() => setSelectedMetric('loss')}
        >
          Loss
        </button>
      </div>

      <div className="chart-container">
        <canvas
          ref={canvasRef}
          width={800}
          height={400}
          className="convergence-canvas"
        ></canvas>
      </div>

      <div className="convergence-table">
        <table>
          <thead>
            <tr>
              <th>Atom</th>
              <th>Convergence Epoch</th>
              <th>Convergence Loss</th>
              <th>Final Accuracy</th>
              <th>Best Accuracy</th>
              <th>Min Loss</th>
            </tr>
          </thead>
          <tbody>
            {Object.entries(convergenceData).map(([atom, data]) => (
              <tr key={atom} style={{ borderLeft: `3px solid ${atomColors[atom]}` }}>
                <td className="atom-cell" style={{ color: atomColors[atom] }}>
                  <strong>{atom}</strong>
                </td>
                <td>{data.convergenceEpoch ? data.convergenceEpoch : 'Not converged'}</td>
                <td>{data.convergenceLoss ? data.convergenceLoss.toFixed(6) : '-'}</td>
                <td>{(data.finalAccuracy * 100).toFixed(2)}%</td>
                <td>{(data.bestAccuracy * 100).toFixed(2)}%</td>
                <td>{data.minLoss.toFixed(6)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {Object.values(convergenceData).some(d => d.convergenceEpoch) && (
        <div className="convergence-insights">
          <h3>Insights</h3>
          <ul>
            {Object.entries(convergenceData)
              .filter(([, data]) => data.convergenceEpoch)
              .map(([atom, data]) => (
                <li key={atom}>
                  <strong>{atom}</strong> converged at epoch {data.convergenceEpoch}
                  ({(data.finalAccuracy * 100).toFixed(1)}% accuracy)
                </li>
              ))}
          </ul>
        </div>
      )}
    </div>
  );
}
