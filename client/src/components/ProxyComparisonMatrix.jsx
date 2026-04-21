import React, { useState, useEffect } from 'react';
import '../styles/ProxyComparisonMatrix.css';

/**
 * ProxyComparisonMatrix Component
 * Compare proxy models across all atoms
 * Phase 17.2.0 Foundation Component
 */

const ATOM_SYMBOLS = ['H', 'He', 'Li', 'Be', 'B', 'C', 'N', 'O', 'F', 'Ne'];

export default function ProxyComparisonMatrix() {
  const [comparisonData, setComparisonData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sortBy, setSortBy] = useState('accuracy'); // 'accuracy', 'convergence', 'speedup'

  useEffect(() => {
    const fetchComparison = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/analysis/atoms/compare');

        if (!response.ok) {
          throw new Error('Failed to fetch comparison data');
        }

        const data = await response.json();
        setComparisonData(data.atoms || []);
        setError(null);
      } catch (err) {
        console.error('Error fetching comparison:', err);
        setError(err.message);
        // Set mock data for development
        setComparisonData(
          ATOM_SYMBOLS.map((symbol, idx) => ({
            symbol,
            name: ['Hydrogen', 'Helium', 'Lithium', 'Beryllium', 'Boron', 'Carbon', 'Nitrogen', 'Oxygen', 'Fluorine', 'Neon'][idx],
            accuracy: 0.9 + Math.random() * 0.1,
            convergenceTime: 1000 + Math.random() * 2000,
            speedup: 20 + Math.random() * 10,
            proxySize: Math.floor(8 + Math.random() * 4),
            trained: Math.random() > 0.3,
          }))
        );
      } finally {
        setLoading(false);
      }
    };

    fetchComparison();
    const interval = setInterval(fetchComparison, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const getSortedData = () => {
    const sorted = [...comparisonData];
    if (sortBy === 'accuracy') {
      sorted.sort((a, b) => (b.accuracy || 0) - (a.accuracy || 0));
    } else if (sortBy === 'convergence') {
      sorted.sort((a, b) => (a.convergenceTime || 999999) - (b.convergenceTime || 999999));
    } else if (sortBy === 'speedup') {
      sorted.sort((a, b) => (b.speedup || 0) - (a.speedup || 0));
    }
    return sorted;
  };

  const getAccuracyColor = (accuracy) => {
    if (accuracy >= 0.95) return '#00ff88'; // Phase 17 green - excellent
    if (accuracy >= 0.90) return '#00cc66'; // good
    if (accuracy >= 0.85) return '#ffaa00'; // fair
    return '#ff5555'; // poor
  };

  const getSpeedupColor = (speedup) => {
    if (speedup >= 25) return '#00ff88'; // excellent
    if (speedup >= 20) return '#00cc66'; // good
    if (speedup >= 15) return '#ffaa00'; // fair
    return '#ff5555'; // poor
  };

  if (loading) {
    return (
      <div className="proxy-comparison-matrix">
        <div className="loading-state">Loading comparison data...</div>
      </div>
    );
  }

  const sortedData = getSortedData();

  return (
    <div className="proxy-comparison-matrix">
      <div className="matrix-header">
        <h2>Multi-Atom Proxy Comparison</h2>
        <div className="sort-controls">
          <label>Sort by:</label>
          <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
            <option value="accuracy">Accuracy</option>
            <option value="convergence">Convergence Time</option>
            <option value="speedup">Speedup Factor</option>
          </select>
        </div>
      </div>

      {error && <div className="error-message">Note: Using mock data for development</div>}

      <div className="comparison-table-wrapper">
        <table className="comparison-table">
          <thead>
            <tr>
              <th>Atom</th>
              <th>Accuracy</th>
              <th>Conv. Time (ms)</th>
              <th>Speedup (x)</th>
              <th>Model Size (KB)</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {sortedData.map((atom) => (
              <tr key={atom.symbol} className={`atom-row ${atom.trained ? 'trained' : 'untrained'}`}>
                <td className="atom-name">
                  <div className="atom-badge">{atom.symbol}</div>
                  <span>{atom.name}</span>
                </td>

                <td className="accuracy-cell">
                  <div className="metric-value">
                    <span
                      className="accuracy-bar"
                      style={{
                        backgroundColor: getAccuracyColor(atom.accuracy),
                        width: `${(atom.accuracy || 0) * 100}%`,
                      }}
                    />
                    {((atom.accuracy || 0) * 100).toFixed(1)}%
                  </div>
                </td>

                <td className="convergence-cell">
                  <span className="metric-value">
                    {atom.convergenceTime?.toLocaleString() || 'N/A'} ms
                  </span>
                </td>

                <td className="speedup-cell">
                  <div className="metric-value">
                    <span
                      className="speedup-badge"
                      style={{ backgroundColor: getSpeedupColor(atom.speedup) }}
                    >
                      {atom.speedup?.toFixed(1) || 'N/A'}x
                    </span>
                  </div>
                </td>

                <td className="size-cell">
                  <span className="metric-value">{atom.proxySize || 'N/A'} KB</span>
                </td>

                <td className="status-cell">
                  <span className={`status-badge ${atom.trained ? 'trained' : 'untrained'}`}>
                    {atom.trained ? '✓ Trained' : '○ Pending'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="comparison-stats">
        <div className="stat-box">
          <h4>Average Accuracy</h4>
          <p className="stat-value">
            {(
              (sortedData.reduce((sum, a) => sum + (a.accuracy || 0), 0) /
                sortedData.length) *
              100
            ).toFixed(1)}
            %
          </p>
        </div>

        <div className="stat-box">
          <h4>Trained Atoms</h4>
          <p className="stat-value">
            {sortedData.filter((a) => a.trained).length} / {sortedData.length}
          </p>
        </div>

        <div className="stat-box">
          <h4>Avg Speedup</h4>
          <p className="stat-value">
            {(sortedData.reduce((sum, a) => sum + (a.speedup || 0), 0) / sortedData.length).toFixed(
              1
            )}
            x
          </p>
        </div>

        <div className="stat-box">
          <h4>Total Model Size</h4>
          <p className="stat-value">
            {sortedData.reduce((sum, a) => sum + (a.proxySize || 0), 0)} KB
          </p>
        </div>
      </div>

      <div className="comparison-legend">
        <h4>Legend</h4>
        <div className="legend-items">
          <div className="legend-item">
            <div className="legend-color excellent" /> Excellent (≥95%)
          </div>
          <div className="legend-item">
            <div className="legend-color good" /> Good (90-95%)
          </div>
          <div className="legend-item">
            <div className="legend-color fair" /> Fair (85-90%)
          </div>
          <div className="legend-item">
            <div className="legend-color poor" /> Poor (&lt;85%)
          </div>
        </div>
      </div>
    </div>
  );
}
