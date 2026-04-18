/**
 * ComparativeAnalysis.jsx
 * Phase 9.5: Multi-dataset comparison component
 * 
 * Compares multiple measurement datasets side-by-side with:
 * - Statistical comparison (correlation, alignment)
 * - Visual comparison charts
 * - Differential analysis
 * - Dataset management
 */

import React, { useState, useCallback, useMemo } from 'react';
import '../styles/Analytics.css';

/**
 * ComparativeAnalysis Component
 * 
 * Props:
 * - datasets: Array of {id, name, data[], type, color?}
 * - onDatasetSelect: (id) => void
 * - onComparisonChange: (comparison) => void
 * - maxDatasets: number (default: 4)
 */
export const ComparativeAnalysis = ({
  datasets = [],
  onDatasetSelect = () => {},
  onComparisonChange = () => {},
  maxDatasets = 4
}) => {
  const [selectedDatasets, setSelectedDatasets] = useState([]);
  const [comparisonMode, setComparisonMode] = useState('correlation'); // 'correlation', 'overlay', 'differential'
  const [expandedSection, setExpandedSection] = useState('comparison');

  // Handle dataset selection
  const toggleDataset = useCallback((datasetId) => {
    setSelectedDatasets(prev => {
      const isSelected = prev.includes(datasetId);
      if (isSelected) {
        return prev.filter(id => id !== datasetId);
      } else if (prev.length < maxDatasets) {
        return [...prev, datasetId];
      }
      return prev;
    });
  }, [maxDatasets]);

  // Calculate correlation between two datasets
  const calculateCorrelation = useCallback((data1, data2) => {
    if (data1.length === 0 || data2.length === 0) return 0;

    const minLen = Math.min(data1.length, data2.length);
    const d1 = data1.slice(0, minLen);
    const d2 = data2.slice(0, minLen);

    const mean1 = d1.reduce((a, b) => a + b, 0) / d1.length;
    const mean2 = d2.reduce((a, b) => a + b, 0) / d2.length;

    let covariance = 0;
    let variance1 = 0;
    let variance2 = 0;

    for (let i = 0; i < minLen; i++) {
      const diff1 = d1[i] - mean1;
      const diff2 = d2[i] - mean2;
      covariance += diff1 * diff2;
      variance1 += diff1 * diff1;
      variance2 += diff2 * diff2;
    }

    const denominator = Math.sqrt(variance1 * variance2);
    return denominator === 0 ? 0 : covariance / denominator;
  }, []);

  // Calculate alignment (how well datasets track together)
  const calculateAlignment = useCallback((data1, data2) => {
    if (data1.length === 0 || data2.length === 0) return 0;

    const minLen = Math.min(data1.length, data2.length);
    const d1 = data1.slice(0, minLen);
    const d2 = data2.slice(0, minLen);

    // Calculate percentage of matching directions
    let matchingDirections = 0;
    for (let i = 1; i < minLen; i++) {
      const dir1 = d1[i] - d1[i - 1];
      const dir2 = d2[i] - d2[i - 1];
      if ((dir1 > 0 && dir2 > 0) || (dir1 < 0 && dir2 < 0)) {
        matchingDirections++;
      }
    }

    return (matchingDirections / (minLen - 1)) * 100;
  }, []);

  // Calculate mean absolute difference
  const calculateMeanDifference = useCallback((data1, data2) => {
    if (data1.length === 0 || data2.length === 0) return 0;

    const minLen = Math.min(data1.length, data2.length);
    const d1 = data1.slice(0, minLen);
    const d2 = data2.slice(0, minLen);

    const sumDiff = d1.reduce((sum, val, idx) => sum + Math.abs(val - d2[idx]), 0);
    return sumDiff / minLen;
  }, []);

  // Perform pairwise comparisons
  const comparisons = useMemo(() => {
    const pairs = [];
    const selected = selectedDatasets
      .map(id => datasets.find(ds => ds.id === id))
      .filter(Boolean);

    for (let i = 0; i < selected.length; i++) {
      for (let j = i + 1; j < selected.length; j++) {
        const ds1 = selected[i];
        const ds2 = selected[j];
        pairs.push({
          id: `${ds1.id}-${ds2.id}`,
          dataset1: ds1,
          dataset2: ds2,
          correlation: calculateCorrelation(ds1.data, ds2.data),
          alignment: calculateAlignment(ds1.data, ds2.data),
          meanDiff: calculateMeanDifference(ds1.data, ds2.data)
        });
      }
    }
    return pairs;
  }, [selectedDatasets, datasets, calculateCorrelation, calculateAlignment, calculateMeanDifference]);

  // Get visualization data based on mode
  const getVisualizationData = useCallback(() => {
    const selected = selectedDatasets
      .map(id => datasets.find(ds => ds.id === id))
      .filter(Boolean);

    if (selected.length < 2) return null;

    switch (comparisonMode) {
      case 'overlay':
        return {
          type: 'overlay',
          datasets: selected
        };
      case 'differential':
        return {
          type: 'differential',
          pairs: comparisons
        };
      default:
        return {
          type: 'correlation',
          pairs: comparisons
        };
    }
  }, [selectedDatasets, datasets, comparisonMode, comparisons]);

  const visualData = getVisualizationData();

  if (datasets.length === 0) {
    return (
      <div className="statistical-report-container empty">
        <p>No datasets available for comparison</p>
        <small>Load datasets from your analytics engine to begin comparison</small>
      </div>
    );
  }

  // Get color for dataset
  const getDatasetColor = (dataset) => {
    const colors = ['#00d4ff', '#00ff00', '#ff6666', '#ffaa00'];
    return dataset.color || colors[selectedDatasets.indexOf(dataset.id) % colors.length];
  };

  return (
    <div className="statistical-report-container">
      {/* Header */}
      <div className="report-header">
        <h2>Comparative Analysis</h2>
        <div className="report-actions">
          <button className="btn-export" onClick={() => setExpandedSection('comparison')}>
            Compare
          </button>
          <button className="btn-export" onClick={() => setExpandedSection('summary')}>
            Summary
          </button>
        </div>
      </div>

      {/* Dataset Selection */}
      <div className="type-selector">
        <label>Select Datasets ({selectedDatasets.length}/{maxDatasets})</label>
        <div className="type-buttons">
          {datasets.map(dataset => (
            <button
              key={dataset.id}
              className={`type-btn ${selectedDatasets.includes(dataset.id) ? 'active' : ''}`}
              onClick={() => toggleDataset(dataset.id)}
              title={`${dataset.data.length} measurements`}
            >
              <span style={{ 
                display: 'inline-block',
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                backgroundColor: getDatasetColor(dataset)
              }}></span>
              {dataset.name}
              <span className="count">{dataset.data.length}</span>
            </button>
          ))}
        </div>
      </div>

      {selectedDatasets.length < 2 ? (
        <div style={{ padding: '20px', textAlign: 'center', color: '#00d4ff' }}>
          <p>Select at least 2 datasets to compare</p>
        </div>
      ) : (
        <>
          {/* Comparison Mode */}
          <div style={{ marginBottom: '20px', display: 'flex', gap: '10px', padding: '10px', 
                        background: 'rgba(0, 212, 255, 0.05)', borderRadius: '4px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#00d4ff', fontSize: '11px' }}>
              <input
                type="radio"
                value="correlation"
                checked={comparisonMode === 'correlation'}
                onChange={(e) => setComparisonMode(e.target.value)}
              />
              Correlation
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#00d4ff', fontSize: '11px' }}>
              <input
                type="radio"
                value="overlay"
                checked={comparisonMode === 'overlay'}
                onChange={(e) => setComparisonMode(e.target.value)}
              />
              Overlay
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#00d4ff', fontSize: '11px' }}>
              <input
                type="radio"
                value="differential"
                checked={comparisonMode === 'differential'}
                onChange={(e) => setComparisonMode(e.target.value)}
              />
              Differential
            </label>
          </div>

          {/* Comparison Results */}
          <div className="report-section">
            <div className="section-header" onClick={() => setExpandedSection(expandedSection === 'comparison' ? 'closed' : 'comparison')}>
              <h3>Pairwise Comparisons</h3>
              <span className="toggle-icon">{expandedSection === 'comparison' ? '▼' : '▶'}</span>
            </div>
            {expandedSection === 'comparison' && (
              <div className="section-content">
                {comparisons.length === 0 ? (
                  <p style={{ color: '#00d4ff' }}>No comparisons available</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                    {comparisons.map(comp => (
                      <div key={comp.id} style={{
                        padding: '12px',
                        background: 'rgba(0, 212, 255, 0.05)',
                        border: '1px solid rgba(0, 212, 255, 0.2)',
                        borderRadius: '4px'
                      }}>
                        <div style={{ marginBottom: '10px', color: '#00ffff', fontWeight: 'bold', fontSize: '11px' }}>
                          <span style={{ color: getDatasetColor(comp.dataset1), marginRight: '8px' }}>●</span>
                          {comp.dataset1.name}
                          <span style={{ color: '#00d4ff', margin: '0 8px' }}>vs</span>
                          <span style={{ color: getDatasetColor(comp.dataset2), marginRight: '8px' }}>●</span>
                          {comp.dataset2.name}
                        </div>

                        {/* Correlation matrix */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginBottom: '10px' }}>
                          <div style={{
                            padding: '8px',
                            background: 'rgba(0, 0, 0, 0.2)',
                            borderRadius: '3px'
                          }}>
                            <div style={{ fontSize: '9px', color: '#00d4ff', marginBottom: '4px' }}>Correlation</div>
                            <div style={{ fontSize: '14px', color: '#00ff00', fontWeight: 'bold' }}>
                              {comp.correlation.toFixed(3)}
                            </div>
                            <div style={{ fontSize: '9px', color: '#00d4ff', opacity: '0.6' }}>
                              {comp.correlation > 0.7 ? 'Strong' : comp.correlation > 0.3 ? 'Moderate' : 'Weak'}
                            </div>
                          </div>

                          <div style={{
                            padding: '8px',
                            background: 'rgba(0, 0, 0, 0.2)',
                            borderRadius: '3px'
                          }}>
                            <div style={{ fontSize: '9px', color: '#00d4ff', marginBottom: '4px' }}>Alignment</div>
                            <div style={{ fontSize: '14px', color: '#00ff00', fontWeight: 'bold' }}>
                              {comp.alignment.toFixed(1)}%
                            </div>
                            <div style={{ fontSize: '9px', color: '#00d4ff', opacity: '0.6' }}>
                              Direction match
                            </div>
                          </div>

                          <div style={{
                            padding: '8px',
                            background: 'rgba(0, 0, 0, 0.2)',
                            borderRadius: '3px'
                          }}>
                            <div style={{ fontSize: '9px', color: '#00d4ff', marginBottom: '4px' }}>Mean Diff</div>
                            <div style={{ fontSize: '14px', color: '#00ff00', fontWeight: 'bold' }}>
                              {comp.meanDiff.toFixed(2)}
                            </div>
                            <div style={{ fontSize: '9px', color: '#00d4ff', opacity: '0.6' }}>
                              Absolute difference
                            </div>
                          </div>
                        </div>

                        {/* Correlation gradient bar */}
                        <div style={{ marginTop: '10px' }}>
                          <div style={{ fontSize: '9px', color: '#00d4ff', marginBottom: '4px' }}>Correlation Strength</div>
                          <div style={{
                            width: '100%',
                            height: '8px',
                            background: 'rgba(0, 0, 0, 0.3)',
                            borderRadius: '4px',
                            overflow: 'hidden'
                          }}>
                            <div style={{
                              width: `${(Math.abs(comp.correlation) * 100).toFixed(1)}%`,
                              height: '100%',
                              background: comp.correlation > 0 
                                ? `linear-gradient(90deg, transparent, #00ff00)` 
                                : `linear-gradient(90deg, transparent, #ff6666)`,
                              transition: 'width 0.3s'
                            }}></div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Overlay Visualization */}
          {comparisonMode === 'overlay' && visualData && (
            <div className="report-section">
              <div className="section-header">
                <h3>Data Overlay</h3>
                <span className="toggle-icon">▼</span>
              </div>
              <div className="section-content">
                <div style={{
                  height: '200px',
                  display: 'flex',
                  alignItems: 'flex-end',
                  gap: '2px',
                  padding: '10px',
                  background: 'rgba(0, 212, 255, 0.02)',
                  border: '1px solid rgba(0, 212, 255, 0.1)',
                  borderRadius: '4px',
                  overflow: 'auto'
                }}>
                  {/* Simple overlay visualization */}
                  {visualData.datasets.length > 0 && (
                    <svg style={{ width: '100%', height: '100%', minWidth: '300px' }}>
                      {visualData.datasets.map((dataset, idx) => {
                        const maxVal = Math.max(...dataset.data, 1);
                        const points = dataset.data
                          .map((val, i) => {
                            const x = (i / (dataset.data.length - 1 || 1)) * 95 + 2.5;
                            const y = 95 - (val / maxVal) * 90 + 5;
                            return `${x},${y}`;
                          })
                          .join(' ');

                        return (
                          <polyline
                            key={dataset.id}
                            points={points}
                            fill="none"
                            stroke={getDatasetColor(dataset)}
                            strokeWidth="2"
                            opacity={0.7}
                            vectorEffect="non-scaling-stroke"
                          />
                        );
                      })}
                    </svg>
                  )}
                </div>
                <div style={{ marginTop: '10px', fontSize: '10px', color: '#00d4ff' }}>
                  Overlay shows all selected datasets normalized to their value range
                </div>
              </div>
            </div>
          )}

          {/* Summary Statistics */}
          <div className="report-section">
            <div className="section-header" onClick={() => setExpandedSection(expandedSection === 'summary' ? 'closed' : 'summary')}>
              <h3>Dataset Summary</h3>
              <span className="toggle-icon">{expandedSection === 'summary' ? '▼' : '▶'}</span>
            </div>
            {expandedSection === 'summary' && (
              <div className="section-content">
                <div style={{ display: 'grid', gridTemplateColumns: `repeat(${Math.min(selectedDatasets.length, 2)}, 1fr)`, gap: '15px' }}>
                  {selectedDatasets
                    .map(id => datasets.find(ds => ds.id === id))
                    .filter(Boolean)
                    .map(dataset => {
                      const data = dataset.data;
                      const mean = data.reduce((a, b) => a + b, 0) / data.length;
                      const min = Math.min(...data);
                      const max = Math.max(...data);
                      const range = max - min;

                      return (
                        <div key={dataset.id} style={{
                          padding: '12px',
                          background: 'rgba(0, 212, 255, 0.05)',
                          border: `2px solid ${getDatasetColor(dataset)}`,
                          borderRadius: '4px'
                        }}>
                          <div style={{ marginBottom: '10px', color: '#00ffff', fontWeight: 'bold', fontSize: '11px' }}>
                            <span style={{ color: getDatasetColor(dataset), marginRight: '6px' }}>●</span>
                            {dataset.name}
                          </div>

                          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '10px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                              <span style={{ color: '#00d4ff' }}>Count:</span>
                              <span style={{ color: '#00ff00', fontWeight: 'bold' }}>{data.length}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                              <span style={{ color: '#00d4ff' }}>Mean:</span>
                              <span style={{ color: '#00ff00', fontWeight: 'bold' }}>{mean.toFixed(2)}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                              <span style={{ color: '#00d4ff' }}>Min:</span>
                              <span style={{ color: '#00ff00', fontWeight: 'bold' }}>{min.toFixed(2)}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                              <span style={{ color: '#00d4ff' }}>Max:</span>
                              <span style={{ color: '#00ff00', fontWeight: 'bold' }}>{max.toFixed(2)}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                              <span style={{ color: '#00d4ff' }}>Range:</span>
                              <span style={{ color: '#00ff00', fontWeight: 'bold' }}>{range.toFixed(2)}</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>
            )}
          </div>

          {/* Recommendations */}
          <div className="report-section interpretation">
            <div className="section-header">
              <h3>Analysis Notes</h3>
              <span className="toggle-icon">▼</span>
            </div>
            <div className="section-content interpretation-content">
              {comparisons.length > 0 && (
                <>
                  <p>
                    <strong>Correlation Analysis:</strong> Examines linear relationships between datasets.
                    Values closer to 1.0 indicate strong positive correlation, while values closer to -1.0
                    indicate strong negative correlation. A value near 0 suggests no linear relationship.
                  </p>
                  <p>
                    <strong>Alignment Metric:</strong> Measures how often datasets trend in the same direction.
                    Higher percentages indicate datasets follow similar patterns, useful for validating
                    consistency across measurement sets.
                  </p>
                  <p>
                    <strong>Mean Difference:</strong> Shows average absolute difference between aligned values.
                    Compare this to the datasets' ranges to assess relative variability between measurements.
                  </p>
                </>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default ComparativeAnalysis;
