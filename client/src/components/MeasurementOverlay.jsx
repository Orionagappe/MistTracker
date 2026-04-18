/**
 * MeasurementOverlay.jsx
 * Phase 9.4: 3D measurement visualization overlay
 * 
 * Renders:
 * - Measurement points with labels
 * - Distance lines between points
 * - Distance/angle annotations
 * - Grid overlay (when enabled)
 * - Measurement info panel
 */

import React, { useMemo } from 'react';
import '../styles/MeasurementOverlay.css';

function MeasurementOverlay({
  points = [],
  measurements = [],
  measureMode = false,
  showGrid = false,
  gridSize = 100,
  onPointRemove,
  onClearMeasurements,
  canvasWidth,
  canvasHeight
}) {
  /**
   * Convert 3D point to 2D canvas coordinate (simplified for overlay)
   * In real implementation, would use camera projection matrix
   */
  const projectPoint = (point) => {
    if (!point) return null;
    // Placeholder - actual implementation uses Three.js camera projection
    return {
      x: (point.x + 50) % canvasWidth,
      y: (point.y + 50) % canvasHeight
    };
  };

  /**
   * Draw lines between measurement points
   */
  const lines = useMemo(() => {
    return measurements
      .filter(m => m.type === 'distance' && points[m.points[0]] && points[m.points[1]])
      .map((m, i) => {
        const p1 = projectPoint(points[m.points[0]]);
        const p2 = projectPoint(points[m.points[1]]);
        if (!p1 || !p2) return null;

        const midX = (p1.x + p2.x) / 2;
        const midY = (p1.y + p2.y) / 2;

        return (
          <g key={`line-${i}`}>
            {/* Distance line */}
            <line
              x1={p1.x}
              y1={p1.y}
              x2={p2.x}
              y2={p2.y}
              className="measurement-line"
              strokeWidth="2"
            />

            {/* Distance label */}
            <text
              x={midX}
              y={midY - 5}
              className="measurement-label"
              textAnchor="middle"
            >
              {m.value.toFixed(2)}
            </text>

            {/* Distance unit label */}
            <text
              x={midX}
              y={midY + 12}
              className="measurement-unit"
              textAnchor="middle"
            >
              units
            </text>
          </g>
        );
      })
      .filter(Boolean);
  }, [measurements, points, projectPoint]);

  /**
   * Render grid overlay
   */
  const gridElements = useMemo(() => {
    if (!showGrid) return null;

    const gridLines = [];
    const cols = Math.ceil(canvasWidth / gridSize);
    const rows = Math.ceil(canvasHeight / gridSize);

    // Vertical lines
    for (let i = 0; i <= cols; i++) {
      gridLines.push(
        <line
          key={`vline-${i}`}
          x1={i * gridSize}
          y1="0"
          x2={i * gridSize}
          y2={canvasHeight}
          className="grid-line"
        />
      );
    }

    // Horizontal lines
    for (let i = 0; i <= rows; i++) {
      gridLines.push(
        <line
          key={`hline-${i}`}
          x1="0"
          y1={i * gridSize}
          x2={canvasWidth}
          y2={i * gridSize}
          className="grid-line"
        />
      );
    }

    return gridLines;
  }, [showGrid, gridSize, canvasWidth, canvasHeight]);

  /**
   * Render measurement points
   */
  const pointElements = useMemo(() => {
    return points.map((point, index) => {
      const projected = projectPoint(point);
      if (!projected) return null;

      return (
        <g
          key={`point-${index}`}
          className="measurement-point-group"
          onMouseEnter={() => {}}
          onMouseLeave={() => {}}
        >
          {/* Point circle */}
          <circle
            cx={projected.x}
            cy={projected.y}
            r="6"
            className="measurement-point"
          />

          {/* Point label */}
          <text
            x={projected.x}
            y={projected.y - 15}
            className="point-label"
            textAnchor="middle"
          >
            P{index + 1}
          </text>

          {/* Position coordinates */}
          <text
            x={projected.x}
            y={projected.y + 20}
            className="point-coordinates"
            textAnchor="middle"
            fontSize="10"
          >
            ({point.x.toFixed(1)}, {point.y.toFixed(1)}, {point.z.toFixed(1)})
          </text>

          {/* Remove button (on hover) */}
          <circle
            cx={projected.x + 12}
            cy={projected.y - 12}
            r="5"
            className="point-remove-btn"
            onClick={() => onPointRemove?.(index)}
          />
          <text
            x={projected.x + 12}
            y={projected.y - 8}
            className="point-remove-icon"
            textAnchor="middle"
            onClick={() => onPointRemove?.(index)}
            style={{ cursor: 'pointer' }}
          >
            ✕
          </text>
        </g>
      );
    });
  }, [points, projectPoint, onPointRemove]);

  /**
   * Render angle annotations
   */
  const angleElements = useMemo(() => {
    return measurements
      .filter(m => m.type === 'angle' && points[m.points[0]] && points[m.points[1]] && points[m.points[2]])
      .map((m, i) => {
        const p1 = projectPoint(points[m.points[0]]);
        const p2 = projectPoint(points[m.points[1]]);
        const p3 = projectPoint(points[m.points[2]]);

        if (!p1 || !p2 || !p3) return null;

        return (
          <g key={`angle-${i}`} className="angle-annotation">
            {/* Angle arc (simplified) */}
            <circle
              cx={p2.x}
              cy={p2.y}
              r="20"
              className="angle-arc"
              fill="none"
              strokeWidth="1"
            />

            {/* Angle label */}
            <text
              x={p2.x + 25}
              y={p2.y - 5}
              className="angle-label"
              fontSize="12"
            >
              {m.value.toFixed(1)}°
            </text>
          </g>
        );
      });
  }, [measurements, points, projectPoint]);

  if (!measureMode || points.length === 0) {
    return null;
  }

  return (
    <div className="measurement-overlay-container">
      {/* SVG Overlay for lines and points */}
      <svg
        className="measurement-overlay"
        width={canvasWidth}
        height={canvasHeight}
        viewBox={`0 0 ${canvasWidth} ${canvasHeight}`}
      >
        {/* Grid background */}
        {gridElements}

        {/* Distance lines */}
        {lines}

        {/* Measurement points */}
        {pointElements}

        {/* Angle annotations */}
        {angleElements}
      </svg>

      {/* Info Panel */}
      <div className="measurement-panel">
        <div className="measurement-header">
          <h3>📏 Measurements</h3>
          <button
            className="measurement-close-btn"
            onClick={onClearMeasurements}
            title="Clear all measurements"
          >
            ✕
          </button>
        </div>

        {/* Points List */}
        <div className="measurement-section">
          <strong>Points ({points.length})</strong>
          <div className="points-list">
            {points.map((p, i) => (
              <div key={`plist-${i}`} className="point-item">
                <span className="point-badge">P{i + 1}</span>
                <span className="point-info">
                  ({p.x.toFixed(1)}, {p.y.toFixed(1)}, {p.z.toFixed(1)})
                </span>
                <button
                  className="point-delete"
                  onClick={() => onPointRemove?.(i)}
                  title="Remove this point"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Distances */}
        {measurements.filter(m => m.type === 'distance').length > 0 && (
          <div className="measurement-section">
            <strong>Distances</strong>
            <div className="measurements-list">
              {measurements
                .filter(m => m.type === 'distance')
                .map((m, i) => (
                  <div key={`dist-${i}`} className="measurement-item">
                    <span className="measurement-icon">↔</span>
                    <span className="measurement-value">
                      {m.label}: {m.value.toFixed(2)} units
                    </span>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* Angles */}
        {measurements.filter(m => m.type === 'angle').length > 0 && (
          <div className="measurement-section">
            <strong>Angles</strong>
            <div className="measurements-list">
              {measurements
                .filter(m => m.type === 'angle')
                .map((m, i) => (
                  <div key={`angle-${i}`} className="measurement-item">
                    <span className="measurement-icon">∠</span>
                    <span className="measurement-value">
                      {m.label}: {m.value.toFixed(2)}°
                    </span>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* Summary Stats */}
        {measurements.length > 0 && (
          <div className="measurement-section stats">
            <strong>Summary</strong>
            <div className="stats-grid">
              <div>
                <span>Total Distance:</span>
                <span className="stat-value">
                  {measurements
                    .filter(m => m.type === 'distance')
                    .reduce((sum, m) => sum + m.value, 0)
                    .toFixed(2)}
                </span>
              </div>
              {measurements.filter(m => m.type === 'angle').length > 0 && (
                <div>
                  <span>Avg Angle:</span>
                  <span className="stat-value">
                    {(
                      measurements
                        .filter(m => m.type === 'angle')
                        .reduce((sum, m) => sum + m.value, 0) /
                      measurements.filter(m => m.type === 'angle').length
                    ).toFixed(2)}
                    °
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Instructions */}
        <div className="measurement-hints">
          <small>
            💡 <code>Click</code> to place points | <code>M</code> to toggle |{' '}
            <code>{showGrid ? 'Hide' : 'Show'} Grid</code>
          </small>
        </div>
      </div>
    </div>
  );
}

export default MeasurementOverlay;
