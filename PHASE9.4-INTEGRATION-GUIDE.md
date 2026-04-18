# Phase 9.4: 3D Measurement System Integration Guide

## Quick Start Integration

This guide provides step-by-step instructions for integrating the 3D measurement system into an existing Three.js scene.

## Prerequisites

- Three.js scene with camera and raycaster
- React components for UI
- Canvas element for click events

## Step 1: Import Required Modules

```javascript
import { useMeasurement } from './hooks/useMeasurement';
import MeasurementOverlay from './components/MeasurementOverlay';
import { useRef, useCallback } from 'react';
```

## Step 2: Create Scene Component with Measurement Support

```javascript
function ThreeDvisualization() {
  const canvasRef = useRef();
  const cameraRef = useRef();
  const raycasterRef = useRef();
  const sceneRef = useRef();

  // Initialize measurement system
  const measurement = useMeasurement({ 
    units: 'meters',
    precision: 2 
  });

  // Feature flags
  const [showMeasurements, setShowMeasurements] = useState(false);
  const [showGrid, setShowGrid] = useState(false);

  /**
   * Convert screen coordinates to 3D world coordinates
   * This is critical for proper point placement
   */
  const screenToWorld = useCallback((screenX, screenY) => {
    if (!cameraRef.current || !raycasterRef.current || !sceneRef.current) {
      return null;
    }

    const camera = cameraRef.current;
    const raycaster = raycasterRef.current;
    const canvas = canvasRef.current;

    // Normalize screen coordinates to [-1, 1]
    const rect = canvas.getBoundingClientRect();
    const normalizedX = ((screenX - rect.left) / rect.width) * 2 - 1;
    const normalizedY = -((screenY - rect.top) / rect.height) * 2 + 1;

    // Update raycaster
    raycaster.setFromCamera({ x: normalizedX, y: normalizedY }, camera);

    // Test intersection with scene objects
    const intersects = raycaster.intersectObjects(sceneRef.current.children, true);

    let worldPoint = null;

    if (intersects.length > 0) {
      // Use first intersection point
      worldPoint = intersects[0].point;
    } else {
      // Fallback: place point on ground plane (y = 0)
      const groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
      worldPoint = new THREE.Vector3();
      raycaster.ray.intersectPlane(groundPlane, worldPoint);
    }

    return worldPoint ? { x: worldPoint.x, y: worldPoint.y, z: worldPoint.z } : null;
  }, []);

  /**
   * Handle canvas click for measurement point placement
   */
  const handleCanvasClick = useCallback((event) => {
    if (!showMeasurements) return;

    const screenX = event.clientX;
    const screenY = event.clientY;

    const worldPoint = screenToWorld(screenX, screenY);
    if (!worldPoint) return;

    // Add point to measurement system
    const newPoint = measurement.addPoint(worldPoint);

    // Auto-create distance measurement if we have 2+ points
    if (measurement.points.length >= 2) {
      const lastIdx = measurement.points.length - 1;
      measurement.addDistance(lastIdx - 1, lastIdx);
    }
  }, [showMeasurements, screenToWorld, measurement]);

  /**
   * Handle canvas mouse move for preview
   */
  const handleCanvasMouseMove = useCallback((event) => {
    if (!showMeasurements || measurement.points.length === 0) return;

    // Could optionally show line preview to cursor
    const screenX = event.clientX;
    const screenY = event.clientY;
    const worldPoint = screenToWorld(screenX, screenY);

    // Store for overlay preview rendering
    // measurement.setPreviewPoint(worldPoint);
  }, [showMeasurements, screenToWorld, measurement]);

  /**
   * Toggle measurement mode
   */
  const toggleMeasureMode = useCallback(() => {
    setShowMeasurements(prev => !prev);
    if (!showMeasurements) {
      measurement.clear();
    }
  }, [showMeasurements, measurement]);

  /**
   * Export current measurements
   */
  const handleExportMeasurements = useCallback(() => {
    const data = measurement.exportData();
    
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: 'application/json'
    });
    
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `measurements-${new Date().getTime()}.json`;
    link.click();
    URL.revokeObjectURL(url);
  }, [measurement]);

  /**
   * Import measurements
   */
  const handleImportMeasurements = useCallback(async (file) => {
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      measurement.importData(data);
    } catch (error) {
      console.error('Failed to import measurements:', error);
      alert('Failed to import measurements file');
    }
  }, [measurement]);

  /**
   * Get measurement summary for display
   */
  const getMeasurementStats = useCallback(() => {
    const report = measurement.getReport();
    return {
      points: measurement.points.length,
      measurements: measurement.measurements.length,
      distances: report.breakdown.distances.length,
      angles: report.breakdown.angles.length,
      totalDistance: report.summary.totalDistance,
      units: measurement.units
    };
  }, [measurement]);

  // Attach event listeners
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.addEventListener('click', handleCanvasClick);
    canvas.addEventListener('mousemove', handleCanvasMouseMove);

    return () => {
      canvas.removeEventListener('click', handleCanvasClick);
      canvas.removeEventListener('mousemove', handleCanvasMouseMove);
    };
  }, [handleCanvasClick, handleCanvasMouseMove]);

  // Component dimensions for overlay
  const [canvasDimensions, setCanvasDimensions] = useState({
    width: window.innerWidth,
    height: window.innerHeight
  });

  useEffect(() => {
    const handleResize = () => {
      setCanvasDimensions({
        width: window.innerWidth,
        height: window.innerHeight
      });
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Get dimensions when canvas mounts
  useEffect(() => {
    if (canvasRef.current) {
      setCanvasDimensions({
        width: canvasRef.current.clientWidth,
        height: canvasRef.current.clientHeight
      });
    }
  }, []);

  return (
    <div className="visualization-container">
      {/* Three.js Canvas */}
      <canvas
        ref={canvasRef}
        className="scene-canvas"
        style={{ width: '100%', height: '100%' }}
      />

      {/* Measurement Overlay */}
      {showMeasurements && measurement.points.length > 0 && (
        <MeasurementOverlay
          points={measurement.points}
          measurements={measurement.measurements}
          measureMode={showMeasurements}
          showGrid={showGrid}
          gridSize={100}
          onPointRemove={(idx) => measurement.removePoint(idx)}
          onClearMeasurements={() => measurement.clear()}
          canvasWidth={canvasDimensions.width}
          canvasHeight={canvasDimensions.height}
        />
      )}

      {/* Top Toolbar */}
      <div className="toolbar-top">
        <button 
          className={`btn btn-measure ${showMeasurements ? 'active' : ''}`}
          onClick={toggleMeasureMode}
          title="Toggle Measurement Mode (Ctrl+M)"
        >
          📏 Measure {showMeasurements ? 'ON' : 'OFF'}
        </button>

        {showMeasurements && (
          <>
            <button 
              className="btn btn-secondary"
              onClick={() => setShowGrid(!showGrid)}
              title="Toggle Grid (G)"
            >
              {showGrid ? '▦ Grid' : '◇ Grid'}
            </button>

            <button 
              className="btn btn-secondary"
              onClick={() => measurement.undo()}
              disabled={!measurement.canUndo}
              title="Undo (Ctrl+Z)"
            >
              ↶ Undo
            </button>

            <button 
              className="btn btn-secondary"
              onClick={() => measurement.redo()}
              disabled={!measurement.canRedo}
              title="Redo (Ctrl+Shift+Z)"
            >
              ↷ Redo
            </button>

            <span className="separator" />

            <button 
              className="btn btn-secondary"
              onClick={handleExportMeasurements}
              title="Export Measurements (E)"
            >
              ⬇ Export
            </button>

            <label className="btn btn-secondary">
              ⬆ Import
              <input 
                type="file" 
                accept=".json"
                onChange={(e) => e.target.files?.[0] && handleImportMeasurements(e.target.files[0])}
                style={{ display: 'none' }}
              />
            </label>

            <button 
              className="btn btn-danger"
              onClick={() => measurement.clear()}
              title="Clear All"
            >
              × Clear
            </button>
          </>
        )}
      </div>

      {/* Measurement Statistics Panel */}
      {showMeasurements && measurement.points.length > 0 && (
        <div className="stats-panel">
          <h4>📊 Statistics</h4>
          <div className="stat-row">
            <span>Points:</span>
            <strong>{measurement.points.length}</strong>
          </div>
          <div className="stat-row">
            <span>Measurements:</span>
            <strong>{measurement.measurements.length}</strong>
          </div>
          {measurement.measurements.filter(m => m.type === 'distance').length > 0 && (
            <div className="stat-row">
              <span>Total Distance:</span>
              <strong>
                {measurement.measurements
                  .filter(m => m.type === 'distance')
                  .reduce((sum, m) => sum + m.value, 0)
                  .toFixed(2)} {measurement.units}
              </strong>
            </div>
          )}
          {measurement.measurements.filter(m => m.type === 'angle').length > 0 && (
            <div className="stat-row">
              <span>Avg Angle:</span>
              <strong>
                {(measurement.measurements
                  .filter(m => m.type === 'angle')
                  .reduce((sum, m) => sum + m.value, 0) /
                  measurement.measurements.filter(m => m.type === 'angle').length
                ).toFixed(1)}°
              </strong>
            </div>
          )}
        </div>
      )}

      {/* Help Text */}
      {showMeasurements && (
        <div className="help-text">
          💡 Click canvas to place measurement points • Use keyboard shortcuts for quick actions
        </div>
      )}
    </div>
  );
}

export default ThreeDvisualization;
```

## Step 3: Add Supporting Styles

```css
/* Visualization Container */
.visualization-container {
  position: relative;
  width: 100%;
  height: 100vh;
  overflow: hidden;
}

.scene-canvas {
  display: block;
  width: 100%;
  height: 100%;
}

/* Toolbar Styling */
.toolbar-top {
  position: absolute;
  top: 20px;
  left: 20px;
  display: flex;
  gap: 10px;
  align-items: center;
  z-index: 100;
  background: rgba(0, 0, 0, 0.5);
  padding: 10px 15px;
  border-radius: 8px;
  backdrop-filter: blur(10px);
}

.btn {
  padding: 8px 16px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  background: rgba(0, 150, 200, 0.2);
  color: #00d4ff;
  border-radius: 4px;
  cursor: pointer;
  font-family: 'Monaco', monospace;
  font-size: 12px;
  font-weight: bold;
  transition: all 0.2s;
  white-space: nowrap;
}

.btn:hover {
  background: rgba(0, 150, 200, 0.4);
  border-color: #00d4ff;
}

.btn.active {
  background: rgba(0, 255, 0, 0.3);
  border-color: #00ff00;
  color: #00ff00;
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn.btn-danger {
  border-color: rgba(255, 50, 50, 0.3);
  color: #ff3333;
}

.btn.btn-danger:hover {
  background: rgba(255, 50, 50, 0.2);
  border-color: #ff3333;
}

.separator {
  width: 1px;
  height: 24px;
  background: rgba(255, 255, 255, 0.2);
  margin: 0 5px;
}

/* Statistics Panel */
.stats-panel {
  position: absolute;
  top: 80px;
  left: 20px;
  background: rgba(15, 23, 42, 0.95);
  border: 1px solid #00d4ff;
  border-radius: 6px;
  padding: 12px;
  font-family: 'Monaco', monospace;
  color: #e0e0e0;
  font-size: 12px;
  z-index: 100;
  min-width: 200px;
}

.stats-panel h4 {
  margin: 0 0 10px 0;
  color: #00d4ff;
  font-size: 13px;
  font-weight: bold;
  text-transform: uppercase;
}

.stat-row {
  display: flex;
  justify-content: space-between;
  padding: 4px 0;
  border-bottom: 1px solid rgba(0, 212, 255, 0.1);
}

.stat-row:last-child {
  border-bottom: none;
}

.stat-row strong {
  color: #00ff00;
  font-weight: bold;
}

/* Help Text */
.help-text {
  position: absolute;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(0, 0, 0, 0.7);
  color: #00d4ff;
  padding: 8px 16px;
  border-radius: 4px;
  font-family: 'Monaco', monospace;
  font-size: 11px;
  z-index: 100;
  pointer-events: none;
}
```

## Step 4: Connect Keyboard Shortcuts

```javascript
import { useMeasurementKeyboard } from './hooks/useMeasurement';

// Inside your component
useMeasurementKeyboard({
  onToggleMeasure: toggleMeasureMode,
  onUndo: () => measurement.undo(),
  onRedo: () => measurement.redo(),
  onClear: () => measurement.clear(),
  onToggleGrid: () => setShowGrid(!showGrid),
  onExport: handleExportMeasurements,
  onImport: () => document.querySelector('input[type="file"]')?.click()
});
```

## Step 5: Advanced: Snapping to Geometry

```javascript
import { useSnap } from './hooks/useMeasurement';

function SceneWithSnapping() {
  const measurement = useMeasurement();
  const snap = useSnap(sceneRef.current, true);

  const handleCanvasClick = useCallback((event) => {
    let worldPoint = screenToWorld(event.clientX, event.clientY);
    
    // Apply snapping if enabled
    if (worldPoint) {
      const screenPoint = worldToScreen(worldPoint);
      const snappedPoint = snap.snapToPoint(screenPoint);
      worldPoint = screenToWorld(snappedPoint.x, snappedPoint.y);
    }

    measurement.addPoint(worldPoint);
  }, [screenToWorld, worldToScreen, snap, measurement]);

  // Update snap targets when scene changes
  useEffect(() => {
    const targets = sceneRef.current.children.map(obj => ({
      worldPoint: obj.position,
      screenX: worldToScreen(obj.position).x,
      screenY: worldToScreen(obj.position).y
    }));
    snap.updateSnapTargets(targets);
  }, [sceneRef, snap, worldToScreen]);

  return /* ... */;
}
```

## Testing the Integration

1. Click "Measure" button to enter measurement mode
2. Click canvas to place measurement points
3. Verify measurements appear in overlay panel
4. Test keyboard shortcuts (Ctrl+Z for undo, G for grid, etc.)
5. Export and re-import measurements to verify data preservation
6. Test snapping if implemented

## Troubleshooting

### Points Appear at Wrong Location
- Check `screenToWorld` coordinate transformation
- Verify raycaster initialization
- Ensure camera reference is correctly set

### Overlay Not Visible
- Check canvas dimensions are set correctly
- Verify `showMeasurements` state is true
- Ensure points array is not empty

### Performance Issues
- Reduce measurement history limit
- Use batch measurements for multiple points
- Check for excessive re-renders in React DevTools

## Best Practices

1. **Initialize raycaster once** during scene setup, not on every click
2. **Cache canvas dimensions** and update only on window resize
3. **Use useCallback** for all event handlers to prevent re-renders
4. **Separate concerns**: Keep measurement logic in hooks, UI in components
5. **Provide visual feedback**: Show preview lines while hovering before clicking

## Next Steps

- Implement calibration with reference objects
- Add preset measurement templates
- Create measurement history/timeline UI
- Export to various formats (PDF, CSV, etc.)

---

For complete API documentation, see [PHASE9.4-MEASUREMENT-SYSTEM.md](PHASE9.4-MEASUREMENT-SYSTEM.md)
