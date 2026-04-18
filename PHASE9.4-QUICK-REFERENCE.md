# Phase 9.4: Quick Reference Guide

## 🚀 Quick Start - 5 Minute Setup

### Step 1: Initialize Hook
```javascript
import { useMeasurement } from './hooks/useMeasurement';

const measurement = useMeasurement({ units: 'meters' });
```

### Step 2: Add Points
```javascript
measurement.addPoint({ x: 0, y: 0, z: 0 });
measurement.addPoint({ x: 10, y: 5, z: 2 });
```

### Step 3: Get Measurements
```javascript
measurement.addDistance(0, 1);  // Distance between points
measurement.addAngle(0, 1, 2);  // Angle at point 1
```

### Step 4: Render Overlay
```javascript
<MeasurementOverlay
  points={measurement.points}
  measurements={measurement.measurements}
  onPointRemove={(idx) => measurement.removePoint(idx)}
/>
```

---

## 📋 Common Tasks

### Add Distance Measurement
```javascript
const distance = measurement.addDistance(pointIdx1, pointIdx2, 'Label');
console.log(distance.value); // Distance in current units
```

### Add Angle Measurement
```javascript
const angle = measurement.addAngle(idx1, idx2, idx3, 'Angle Label');
console.log(angle.value); // Angle in degrees
```

### Calculate Area
```javascript
const area = measurement.getSurfaceArea([0, 1, 2, 3]);
console.log(area); // Area in square units
```

### Calculate Volume
```javascript
const volume = measurement.getVolume([0, 1, 2, 3, 4]);
console.log(volume); // Volume in cubic units
```

### Export Measurements
```javascript
const data = measurement.exportData();
// data = { units, points, measurements, timestamp }
```

### Import Measurements
```javascript
measurement.importData(data);
```

### Get Report
```javascript
const report = measurement.getReport();
// report = { timestamp, units, breakdown, summary }
```

### Undo/Redo
```javascript
measurement.undo();
measurement.redo();
if (measurement.canUndo) { /* enable undo button */ }
if (measurement.canRedo) { /* enable redo button */ }
```

### Clear Everything
```javascript
measurement.clear();
```

---

## ⌨️ Keyboard Shortcuts

| Key | Action |
|-----|--------|
| Ctrl+M | Toggle measure mode |
| Ctrl+Z | Undo |
| Ctrl+Shift+Z | Redo |
| Delete | Clear all |
| G | Toggle grid |
| E | Export |
| I | Import |

---

## 🎨 CSS Classes Reference

```
.measurement-overlay-container    - Main container
.measurement-overlay              - SVG overlay
.measurement-line                 - Distance line
.measurement-label                - Distance label
.measurement-point                - Point marker
.point-label                       - Point identifier
.grid-line                         - Grid background
.angle-arc                         - Angle visualization
.measurement-panel                 - Info panel
.measurement-section               - Panel section
.points-list                       - Points list
.measurements-list                 - Measurements list
.stats-grid                        - Statistics grid
```

---

## 🔧 Customization Options

### Engine Options
```javascript
useMeasurement({
  units: 'meters',        // Unit system
  precision: 2            // Decimal places
})
```

### Unit Types
- `'millimeters'` (mm)
- `'centimeters'` (cm)
- `'meters'` (m) ← Default
- `'kilometers'` (km)
- `'inches'` (in)
- `'feet'` (ft)
- `'yards'` (yd)
- `'miles'` (mi)

### Hook Options
```javascript
useMeasurementKeyboard({
  onToggleMeasure: fn,
  onUndo: fn,
  onRedo: fn,
  onClear: fn,
  onToggleGrid: fn,
  onExport: fn,
  onImport: fn
})
```

---

## 📊 Data Structures

### Point
```javascript
{
  x: number,
  y: number,
  z: number,
  id: string,
  timestamp: number
}
```

### Measurement
```javascript
{
  id: string,
  type: 'distance' | 'angle',
  points: number[],     // Point indices
  value: number,        // Calculated value
  label: string,
  timestamp: number
}
```

### Report
```javascript
{
  timestamp: string,
  units: string,
  points: number,
  measurements: number,
  breakdown: {
    distances: Array,
    angles: Array,
    areas: Array,
    volumes: Array
  },
  summary: {
    totalDistance: number,
    averageAngle: number,
    totalArea: number
  }
}
```

---

## 🎯 API Cheat Sheet

### Engine Methods
```javascript
// Points
addPoint(p)
removePoint(idx)
clear()

// Calculations
calculateDistance(p1, p2)
calculateAngle(p1, p2, p3)
calculateSurfaceArea(indices[])
calculateVolume(indices[])
calculatePointToLineDistance(p, p1, p2)

// Measurements
addDistanceMeasurement(idx1, idx2, label?)
addAngleMeasurement(idx1, idx2, idx3, label?)

// Data
exportMeasurements()
importMeasurements(data)
getMeasurementReport()
getStateSize()

// History
undo()
redo()
canUndo()
canRedo()
```

### Hook Methods
```javascript
// Hook API
{
  points,
  measurements,
  mode,
  selectedPoints,
  units,
  addPoint,
  removePoint,
  addDistance,
  addAngle,
  getSurfaceArea,
  getVolume,
  clear,
  getReport,
  exportData,
  importData,
  setMeasureMode,
  togglePointSelection,
  undo,
  redo,
  canUndo,
  canRedo,
  engine
}
```

---

## 🐛 Debugging Tips

### Check Point Valid
```javascript
const isValid = p && typeof p.x === 'number' && 
                typeof p.y === 'number' && 
                typeof p.z === 'number';
```

### Log Measurements
```javascript
console.log(JSON.stringify(measurement.exportData(), null, 2));
```

### View Report
```javascript
console.table(measurement.getReport());
```

### Find Issue
```javascript
// Verify engine state
console.log({
  points: measurement.points.length,
  measurements: measurement.measurements.length,
  history: measurement.engine.history.length,
  canUndo: measurement.engine.canUndo(),
  canRedo: measurement.engine.canRedo()
});
```

---

## ✨ Tips & Tricks

1. **Smart Point Placement**: Use raycaster to snap to objects
2. **Batch Operations**: Add multiple measurements, export once
3. **Keyboard Shortcuts**: Ctrl+Z is faster than clicking undo
4. **Export Before Major Changes**: Save state before complex edits
5. **Use Precision Setting**: Set to 3+ for small measurements
6. **Reference Objects**: Create calibration measurements
7. **Combine Types**: Use distances + angles for precise geometry

---

## 📱 Mobile Considerations

- Touch events: Implement similar to click handlers
- Small screen: Overlay panels may need repositioning
- Grid: Adjust gridSize for device pixel ratio
- Font sizes: Already responsive (px-based scaling)

---

## 🔗 Integration Points

### With Three.js Scene
```javascript
// Raycaster intersection
const intersects = raycaster.intersectObjects(sceneObjects);
const worldPoint = intersects[0].point;
measurement.addPoint({ x: p.x, y: p.y, z: p.z });
```

### With React State
```javascript
// Redux dispatch
dispatch(updateMeasurements(measurement.exportData()));

// Context API
<MeasurementContext.Provider value={measurement}>
  <App />
</MeasurementContext.Provider>
```

---

## 📚 Documentation Files

- `PHASE9.4-MEASUREMENT-SYSTEM.md` - Full API documentation
- `PHASE9.4-INTEGRATION-GUIDE.md` - Step-by-step setup
- `PHASE9.4-COMPLETION-SUMMARY.md` - Project summary
- This file - Quick reference

---

## 🆘 Common Issues & Fixes

| Issue | Fix |
|-------|-----|
| Points not visible | Check `measureMode` is true |
| Wrong coordinates | Verify `screenToWorld` function |
| Calculations off | Check `units` setting |
| Slow performance | Clear old measurements |
| Export fails | Check JSON serialization |
| Undo not working | Verify `canUndo()` returns true |
| Keyboard shortcuts don't work | Check event listener attached |

---

## 🎓 Learning Path

1. Start with basic distance measurements
2. Add angle measurements
3. Implement area calculations
4. Try undo/redo operations
5. Test export/import workflow
6. Add keyboard shortcuts
7. Implement snapping

---

## 📞 Support

For detailed documentation, see main documentation files.
For integration help, follow PHASE9.4-INTEGRATION-GUIDE.md
For API details, reference PHASE9.4-MEASUREMENT-SYSTEM.md

---

**Phase 9.4: Advanced 3D Measurement System**
Version: 1.0.0
Status: ✅ Production Ready
