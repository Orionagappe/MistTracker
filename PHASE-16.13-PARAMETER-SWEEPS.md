# PHASE 16.13: PARAMETER SWEEP EXPLORATION

**Timeline**: April 21, 2026 (8 hours)  
**Status**: Ready for implementation  
**Goal**: Map parameter space to discover emergence boundaries  
**Learning**: NOMAD recommendation #5 (parameter space mapping)

---

## Executive Summary

### Problem: Where Do Properties Emerge?

Phase 16.12 defines 8 indices proving properties emerge. But **where in parameter space** do they emerge?

```
Current result: "Atomic Stability Index = 0.98 ✓"
Missing: "Stability emerges when quantum_strength > 0.85 AND 
          electron_mass > 0.5 AND nuclear_charge >= 2..."
```

### Solution: Parameter Sweep Panel

Define a 2D grid exploring parameter space:

```
Parameter 1: nuclear_charge (Z)    [1, 2, 3, ..., 10]
Parameter 2: quantum_coupling      [0.1, 0.2, ..., 1.0]

For each (Z, coupling) pair:
  Compute all 8 emergence indices
  Record: emergence level (WEAK/MODERATE/STRONG)
  Visualize as heatmap

Result: Emergence boundary map
  Red zones (Z > 5, coupling < 0.3): WEAK emergence
  Green zones (Z > 2, coupling > 0.6): STRONG emergence
  Yellow zones (transition region): MODERATE emergence
```

### Impact

**Before Phase 16.13:**
- "Properties emerge at various points"
- No systematic understanding
- Cannot predict emergence thresholds

**After Phase 16.13:**
- "Here's the exact parameter space region where emergence happens"
- Quantified emergence boundaries
- Can predict emergence for new parameters
- Publication-ready phase diagrams

---

## 1. Parameter Sweep Architecture

### Overview

```
ParameterSweepPanel (React Component)
  ├─ Input Controls
  │  ├─ Parameter 1 selector (e.g., nuclear_charge)
  │  ├─ Parameter 2 selector (e.g., quantum_coupling)
  │  ├─ Range specification (min, max, steps)
  │  └─ Start button
  │
  ├─ Heatmap Visualization
  │  ├─ 2D grid (Parameter1 × Parameter2)
  │  ├─ Color scale (WEAK → MODERATE → STRONG)
  │  ├─ Interactive cells (hover → show values)
  │  └─ Legend (emergence level & index values)
  │
  ├─ Boundary Detection
  │  ├─ Auto-detect emergence threshold
  │  ├─ Draw contour lines
  │  ├─ Compute boundary equation
  │  └─ Export as JSON
  │
  └─ Export Controls
     ├─ CSV download
     ├─ JSON with raw data
     ├─ PNG snapshot of heatmap
     └─ Publication-ready figure
```

### Data Structure

```javascript
{
  sweep_id: "sweep-2026-04-21-001",
  timestamp: "2026-04-21T14:32:00Z",
  parameters: {
    param1: {
      name: "nuclear_charge",
      min: 1,
      max: 10,
      steps: 10
    },
    param2: {
      name: "quantum_coupling",
      min: 0.0,
      max: 1.0,
      steps: 10
    }
  },
  results: [
    {
      param1_value: 1,
      param2_value: 0.1,
      emergence_index: 0.32,
      emergence_level: "WEAK",
      indices: {
        atomic_stability: 0.50,
        orbital_localization: 0.45,
        quantum_coherence: 0.30,
        shell_structure: 0.10,
        magnetic_moment: 0.28,
        fine_structure: 0.35,
        hyperfine_coupling: 0.40,
        excited_states: 0.25
      },
      timestamp: "2026-04-21T14:32:15Z"
    },
    // ... 99 more cells
  ],
  summary: {
    total_cells: 100,
    weak_cells: 34,
    moderate_cells: 41,
    strong_cells: 25,
    boundary_detected: true,
    boundary_equation: "coupling > 0.55 AND Z > 3"
  }
}
```

---

## 2. ParameterSweepPanel Component

### React Implementation

```javascript
import React, { useState } from 'react';
import {
  Container,
  Grid,
  Paper,
  TextField,
  Select,
  MenuItem,
  Button,
  Card,
  CardContent,
  LinearProgress,
  Dialog,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  FormControl,
  InputLabel,
  Slider,
  Box,
  Typography,
  Chip
} from '@mui/material';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const AVAILABLE_PARAMETERS = {
  nuclear_charge: { label: 'Nuclear Charge (Z)', min: 1, max: 118 },
  quantum_coupling: { label: 'Quantum Coupling', min: 0, max: 1 },
  electron_mass: { label: 'Electron Mass (MeV)', min: 0.1, max: 10 },
  spin_orbit_coupling: { label: 'Spin-Orbit Coupling', min: 0, max: 1 },
  fine_structure: { label: 'Fine Structure Constant', min: 100, max: 200 },
  hyperfine_coupling: { label: 'Hyperfine Coupling', min: 0, max: 1 }
};

const EMERGENCE_COLORS = {
  WEAK: '#ff7f0e',      // Orange
  MODERATE: '#ffdd57',  // Yellow
  STRONG: '#2ecc71'     // Green
};

export function ParameterSweepPanel() {
  const [param1, setParam1] = useState('nuclear_charge');
  const [param2, setParam2] = useState('quantum_coupling');
  const [range1, setRange1] = useState([1, 10]);
  const [range2, setRange2] = useState([0, 1]);
  const [steps1, setSteps1] = useState(10);
  const [steps2, setSteps2] = useState(10);
  const [sweepData, setSweepData] = useState(null);
  const [isRunning, setIsRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [selectedCell, setSelectedCell] = useState(null);
  const [showBoundary, setShowBoundary] = useState(false);
  const [boundaryEquation, setBoundaryEquation] = useState('');

  // Start parameter sweep
  const startSweep = async () => {
    setIsRunning(true);
    setProgress(0);
    setSweepData(null);

    try {
      const response = await fetch('/api/parameter-sweep', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          param1,
          param2,
          range1,
          range2,
          steps1,
          steps2,
          emergence_indices: ['all']
        })
      });

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let result = '';

      // Stream progress updates
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        result += decoder.decode(value);
        const lines = result.split('\n');
        result = lines.pop(); // Keep incomplete line

        for (const line of lines) {
          if (line.startsWith('data:')) {
            const update = JSON.parse(line.slice(5));
            setProgress(update.progress);
          }
        }
      }

      const finalData = JSON.parse(result);
      setSweepData(finalData);

      // Auto-detect boundary
      detectBoundary(finalData);
    } catch (error) {
      console.error('Sweep failed:', error);
    } finally {
      setIsRunning(false);
    }
  };

  // Detect emergence boundary
  const detectBoundary = (data) => {
    const strongCells = data.results.filter(r => r.emergence_level === 'STRONG');
    const weakCells = data.results.filter(r => r.emergence_level === 'WEAK');

    if (strongCells.length === 0 || weakCells.length === 0) {
      setBoundaryEquation('Boundary detection: insufficient data');
      return;
    }

    // Find boundary between STRONG and non-STRONG
    const param1Vals = strongCells.map(c => c.param1_value);
    const param2Vals = strongCells.map(c => c.param2_value);

    const minParam1 = Math.min(...param1Vals);
    const minParam2 = Math.min(...param2Vals);

    const equation = `${param1} > ${minParam1.toFixed(2)} AND ${param2} > ${minParam2.toFixed(2)}`;
    setBoundaryEquation(equation);
    setShowBoundary(true);
  };

  // Export data
  const exportCSV = () => {
    if (!sweepData) return;

    const csv = [
      ['Parameter 1', 'Parameter 2', 'Emergence Index', 'Emergence Level', ...Object.keys(sweepData.results[0].indices || {})],
      ...sweepData.results.map(r => [
        r.param1_value,
        r.param2_value,
        r.emergence_index.toFixed(3),
        r.emergence_level,
        ...Object.values(r.indices || {}).map(v => v.toFixed(3))
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `parameter-sweep-${new Date().toISOString()}.csv`;
    a.click();
  };

  const exportJSON = () => {
    if (!sweepData) return;

    const json = JSON.stringify(sweepData, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `parameter-sweep-${new Date().toISOString()}.json`;
    a.click();
  };

  return (
    <Container maxWidth="lg" sx={{ py: 3 }}>
      <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
        <Typography variant="h4" gutterBottom>
          Parameter Sweep Exploration
        </Typography>
        <Typography variant="body2" color="textSecondary" paragraph>
          Explore 2D parameter space to discover emergence boundaries. Higher values = stronger emergence.
        </Typography>

        <Grid container spacing={2}>
          {/* Parameter Selection */}
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth>
              <InputLabel>Parameter 1</InputLabel>
              <Select
                value={param1}
                onChange={(e) => setParam1(e.target.value)}
                disabled={isRunning}
              >
                {Object.entries(AVAILABLE_PARAMETERS).map(([key, val]) => (
                  <MenuItem key={key} value={key}>{val.label}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} sm={6}>
            <FormControl fullWidth>
              <InputLabel>Parameter 2</InputLabel>
              <Select
                value={param2}
                onChange={(e) => setParam2(e.target.value)}
                disabled={isRunning}
              >
                {Object.entries(AVAILABLE_PARAMETERS).map(([key, val]) => (
                  <MenuItem key={key} value={key}>{val.label}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          {/* Range & Steps */}
          <Grid item xs={12} sm={3}>
            <TextField
              label={`${param1} Min`}
              type="number"
              value={range1[0]}
              onChange={(e) => setRange1([Number(e.target.value), range1[1]])}
              disabled={isRunning}
              fullWidth
            />
          </Grid>

          <Grid item xs={12} sm={3}>
            <TextField
              label={`${param1} Max`}
              type="number"
              value={range1[1]}
              onChange={(e) => setRange1([range1[0], Number(e.target.value)])}
              disabled={isRunning}
              fullWidth
            />
          </Grid>

          <Grid item xs={12} sm={3}>
            <TextField
              label={`${param2} Min`}
              type="number"
              value={range2[0]}
              onChange={(e) => setRange2([Number(e.target.value), range2[1]])}
              disabled={isRunning}
              fullWidth
            />
          </Grid>

          <Grid item xs={12} sm={3}>
            <TextField
              label={`${param2} Max`}
              type="number"
              value={range2[1]}
              onChange={(e) => setRange2([range2[0], Number(e.target.value)])}
              disabled={isRunning}
              fullWidth
            />
          </Grid>

          {/* Steps */}
          <Grid item xs={12} sm={6}>
            <Typography gutterBottom>
              {param1} steps: {steps1}
            </Typography>
            <Slider
              value={steps1}
              onChange={(e, v) => setSteps1(v)}
              min={2}
              max={20}
              marks
              disabled={isRunning}
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <Typography gutterBottom>
              {param2} steps: {steps2}
            </Typography>
            <Slider
              value={steps2}
              onChange={(e, v) => setSteps2(v)}
              min={2}
              max={20}
              marks
              disabled={isRunning}
            />
          </Grid>

          {/* Start Button */}
          <Grid item xs={12}>
            <Button
              variant="contained"
              color="primary"
              onClick={startSweep}
              disabled={isRunning}
              fullWidth
              size="large"
            >
              {isRunning ? `Running... ${(progress * 100).toFixed(0)}%` : 'Start Parameter Sweep'}
            </Button>
          </Grid>
        </Grid>

        {/* Progress Bar */}
        {isRunning && (
          <Box sx={{ mt: 2 }}>
            <LinearProgress variant="determinate" value={progress * 100} />
            <Typography variant="caption" sx={{ mt: 1 }}>
              {`${(progress * 100).toFixed(0)}% complete (${Math.round(steps1 * steps2 * progress)} / ${steps1 * steps2} cells)`}
            </Typography>
          </Box>
        )}
      </Paper>

      {/* Heatmap Visualization */}
      {sweepData && (
        <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
          <Typography variant="h5" gutterBottom>
            Emergence Heatmap
          </Typography>

          <ParameterHeatmap
            data={sweepData}
            param1={param1}
            param2={param2}
            onCellClick={setSelectedCell}
            showBoundary={showBoundary}
            boundaryEquation={boundaryEquation}
          />

          {/* Legend */}
          <Box sx={{ display: 'flex', gap: 2, mt: 2, justifyContent: 'center' }}>
            {Object.entries(EMERGENCE_COLORS).map(([level, color]) => (
              <Chip
                key={level}
                label={level}
                sx={{ backgroundColor: color }}
              />
            ))}
          </Box>

          {/* Boundary Equation */}
          {showBoundary && (
            <Card sx={{ mt: 2, backgroundColor: '#f0f0f0' }}>
              <CardContent>
                <Typography variant="subtitle2" gutterBottom>
                  Detected Emergence Boundary:
                </Typography>
                <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                  {boundaryEquation}
                </Typography>
              </CardContent>
            </Card>
          )}

          {/* Summary Statistics */}
          <Grid container spacing={2} sx={{ mt: 2 }}>
            <Grid item xs={6} sm={3}>
              <Card>
                <CardContent>
                  <Typography color="textSecondary" gutterBottom>
                    STRONG Cells
                  </Typography>
                  <Typography variant="h5">
                    {sweepData.summary.strong_cells}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={6} sm={3}>
              <Card>
                <CardContent>
                  <Typography color="textSecondary" gutterBottom>
                    MODERATE Cells
                  </Typography>
                  <Typography variant="h5">
                    {sweepData.summary.moderate_cells}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={6} sm={3}>
              <Card>
                <CardContent>
                  <Typography color="textSecondary" gutterBottom>
                    WEAK Cells
                  </Typography>
                  <Typography variant="h5">
                    {sweepData.summary.weak_cells}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={6} sm={3}>
              <Card>
                <CardContent>
                  <Typography color="textSecondary" gutterBottom>
                    Total Cells
                  </Typography>
                  <Typography variant="h5">
                    {sweepData.summary.total_cells}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* Export Controls */}
          <Box sx={{ display: 'flex', gap: 2, mt: 3 }}>
            <Button
              variant="outlined"
              onClick={exportCSV}
            >
              Download CSV
            </Button>
            <Button
              variant="outlined"
              onClick={exportJSON}
            >
              Download JSON
            </Button>
          </Box>
        </Paper>
      )}

      {/* Cell Details Dialog */}
      {selectedCell && (
        <CellDetailsDialog
          cell={selectedCell}
          open={Boolean(selectedCell)}
          onClose={() => setSelectedCell(null)}
        />
      )}
    </Container>
  );
}
```

---

## 3. ParameterHeatmap Component

```javascript
function ParameterHeatmap({ data, param1, param2, onCellClick, showBoundary, boundaryEquation }) {
  const getCellColor = (emergenceLevel) => {
    const colors = {
      WEAK: '#ff7f0e',
      MODERATE: '#ffdd57',
      STRONG: '#2ecc71'
    };
    return colors[emergenceLevel] || '#ccc';
  };

  // Build 2D grid from results
  const gridData = buildGrid(data.results, param1, param2);

  return (
    <Box sx={{ overflowX: 'auto' }}>
      <svg width={800} height={600} style={{ border: '1px solid #ccc' }}>
        {/* Grid cells */}
        {data.results.map((cell, idx) => {
          const x = ((cell.param1_value - data.parameters.param1.min) / 
                    (data.parameters.param1.max - data.parameters.param1.min)) * 750 + 25;
          const y = 550 - ((cell.param2_value - data.parameters.param2.min) / 
                          (data.parameters.param2.max - data.parameters.param2.min)) * 500;

          return (
            <g key={idx}>
              <rect
                x={x}
                y={y}
                width={750 / data.parameters.param1.steps}
                height={500 / data.parameters.param2.steps}
                fill={getCellColor(cell.emergence_level)}
                stroke="#333"
                strokeWidth="0.5"
                opacity="0.8"
                onClick={() => onCellClick(cell)}
                style={{ cursor: 'pointer' }}
              >
                <title>{`${param1}=${cell.param1_value}, ${param2}=${cell.param2_value}: ${cell.emergence_level} (${cell.emergence_index.toFixed(2)})`}</title>
              </rect>
            </g>
          );
        })}

        {/* Boundary line if detected */}
        {showBoundary && (
          <line x1="0" y1="250" x2="800" y2="250" stroke="red" strokeWidth="2" strokeDasharray="5,5" />
        )}

        {/* Axes */}
        <line x1="25" y1="25" x2="25" y2="550" stroke="#000" strokeWidth="2" />
        <line x1="25" y1="550" x2="775" y2="550" stroke="#000" strokeWidth="2" />

        {/* Labels */}
        <text x="400" y="580" textAnchor="middle" fontSize="12">
          {param1}
        </text>
        <text x="10" y="300" textAnchor="middle" fontSize="12" transform="rotate(-90 10 300)">
          {param2}
        </text>
      </svg>
    </Box>
  );
}
```

---

## 4. Server-Side Implementation

```javascript
// routes/parameter-sweep.js

router.post('/api/parameter-sweep', async (req, res) => {
  const {
    param1,
    param2,
    range1,
    range2,
    steps1,
    steps2,
    emergence_indices
  } = req.body;

  const results = [];
  const totalCells = steps1 * steps2;
  let processed = 0;

  // Generate grid points
  const step1Size = (range1[1] - range1[0]) / (steps1 - 1);
  const step2Size = (range2[1] - range2[0]) / (steps2 - 1);

  // Stream response
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  for (let i = 0; i < steps1; i++) {
    for (let j = 0; j < steps2; j++) {
      const param1_value = range1[0] + i * step1Size;
      const param2_value = range2[0] + j * step2Size;

      // Compute emergence indices for this point
      const indices = await computeEmergenceIndices({
        [param1]: param1_value,
        [param2]: param2_value
      });

      // Determine emergence level
      const mean = Object.values(indices).reduce((a, b) => a + b) / Object.keys(indices).length;
      const level = mean > 0.95 ? 'STRONG' : mean > 0.85 ? 'MODERATE' : 'WEAK';

      results.push({
        param1_value,
        param2_value,
        emergence_index: mean,
        emergence_level: level,
        indices,
        timestamp: new Date().toISOString()
      });

      // Send progress update
      processed++;
      if (processed % 10 === 0) {
        res.write(`data: ${JSON.stringify({ progress: processed / totalCells })}\n\n`);
      }
    }
  }

  // Detect boundary
  const boundaryEquation = detectBoundary(results, param1, param2);

  // Summary statistics
  const summary = {
    total_cells: results.length,
    weak_cells: results.filter(r => r.emergence_level === 'WEAK').length,
    moderate_cells: results.filter(r => r.emergence_level === 'MODERATE').length,
    strong_cells: results.filter(r => r.emergence_level === 'STRONG').length,
    boundary_detected: boundaryEquation !== null,
    boundary_equation: boundaryEquation
  };

  // Send final result
  const finalData = {
    sweep_id: `sweep-${new Date().toISOString()}`,
    timestamp: new Date().toISOString(),
    parameters: {
      param1: { name: param1, min: range1[0], max: range1[1], steps: steps1 },
      param2: { name: param2, min: range2[0], max: range2[1], steps: steps2 }
    },
    results,
    summary
  };

  res.write(`data: ${JSON.stringify(finalData)}\n\n`);
  res.end();
});

function detectBoundary(results, param1, param2) {
  const strongCells = results.filter(r => r.emergence_level === 'STRONG');
  if (strongCells.length === 0) return null;

  const minParam1 = Math.min(...strongCells.map(c => c.param1_value));
  const minParam2 = Math.min(...strongCells.map(c => c.param2_value));

  return `${param1} > ${minParam1.toFixed(2)} AND ${param2} > ${minParam2.toFixed(2)}`;
}
```

---

## 5. Integration with Phase 16.11 Research Track

### Why Phase 16.13 Depends on Phase 16.11

Parameter sweeps compute **hundreds** of points. Without the research track:

```
Manual approach (Phase 16.9 only):
  100 cells × 2 FP ops × 1s per op = 200 seconds (~3.3 minutes)
  
With research track (Phase 16.11):
  100 cells × 1 FP op × 0.03s per op = 3 seconds ✅
  
Speedup: 67× faster!
```

### Implementation

```javascript
class ParameterSweeper {
  async computeEmergenceIndices(parameters) {
    // Use research track for speed
    const trackSelection = await this.triTrackServer.recommendTrack(
      parameters,
      { mode: 'speed', minAccuracy: 0.90 }
    );

    if (trackSelection.track === 'research') {
      // Fast ML surrogate
      const prediction = await this.researchTrack.predict(parameters);
      return this.computeIndicesFromPrediction(prediction);
    } else if (trackSelection.track === 'simulation') {
      // Fallback to full simulation if confidence too low
      const simulation = await this.simulationTrack.run(parameters);
      return this.computeIndicesFromSimulation(simulation);
    }
  }
}
```

---

## 6. Success Criteria

```
✓ ParameterSweepPanel component renders correctly
✓ Can select 2 parameters from available list
✓ Can specify ranges and step counts
✓ Sweep completes in <10 minutes for 100 cells
✓ Heatmap displays with correct coloring
✓ Boundary detection works automatically
✓ Can export CSV and JSON
✓ Integration with research track (Phase 16.11)
✓ All 8 emergence indices computed per cell
✓ Handles streaming progress updates
```

---

## 7. Parameter Space Regions (Example Results)

### After Phase 16.13 Completes

**Expected Emergence Map** (nuclear_charge vs. quantum_coupling):

```
           coupling
1.0  │ STRONG  STRONG  STRONG
     │ ███████ ███████ ███████
0.8  │ MOD     STRONG  STRONG
     │ ▓▓▓▓▓▓▓ ███████ ███████
0.6  │ WEAK    MOD     STRONG  ← BOUNDARY LINE
     │ ░░░░░░░ ▓▓▓▓▓▓▓ ███████     (coupling > 0.6 AND Z > 3)
0.4  │ WEAK    WEAK    MOD
     │ ░░░░░░░ ░░░░░░░ ▓▓▓▓▓▓▓
0.2  │ WEAK    WEAK    WEAK
     │ ░░░░░░░ ░░░░░░░ ░░░░░░░
     └─────────────────────────
       1     5    10  (Z)
```

**Interpretation:**
- Bottom-left (Z < 3, coupling < 0.6): Weak emergence
- Top-right (Z > 8, coupling > 0.8): Strong emergence
- Diagonal band: Transition zone where emergence is moderate

---

## 8. Timeline & Completion

| Task | Hours | Status |
|------|-------|--------|
| ParameterSweepPanel UI | 3 | ⏳ Ready |
| ParameterHeatmap visualization | 2 | ⏳ Ready |
| Server-side sweep computation | 2 | ⏳ Ready |
| Boundary detection algorithm | 1 | ⏳ Ready |
| Integration with research track | 0.5 | ⏳ Ready (depends on Phase 16.11) |
| Testing & validation | 1.5 | ⏳ Ready |
| **TOTAL** | **8 hours** | **✅ Ready for April 21** |

---

## Conclusion

**Phase 16.13 enables:**

✅ **Parameter space mapping** (where do properties emerge?)  
✅ **Emergence boundary detection** (automatic threshold identification)  
✅ **Publication-ready phase diagrams** (publication figures ready to export)  
✅ **Research acceleration** (67× speedup via research track from Phase 16.11)

**Status**: ✅ Design complete, ready for implementation  
**Timeline**: April 21, 2026 (8 hours)  
**Completion**: Phase 17 foundation ready by end of April 21
          <label>X Range:</label>
          <input type="number" value={xRange.min} placeholder="min" />
          <input type="number" value={xRange.max} placeholder="max" />
          <input type="number" value={xRange.step} placeholder="step" />

          <label>Y Range:</label>
          <input type="number" value={yRange.min} placeholder="min" />
          <input type="number" value={yRange.max} placeholder="max" />
          <input type="number" value={yRange.step} placeholder="step" />
        </div>

        <button 
          onClick={handleRunSweep} 
          disabled={running}
        >
          {running ? 'Running sweep...' : 'Run Parameter Sweep'}
        </button>
        
        {running && (
          <div className="progress">
            Progress: {/* Calculate current progress */}
          </div>
        )}
      </div>

      {results && (
        <div className="sweep-results">
          <h4>Emergence Heatmap</h4>
          
          {/* Heatmap visualization */}
          <canvas 
            width={results.xValues.length * 20}
            height={results.yValues.length * 20}
            ref={canvasRef}
          />
          
          {/* Color legend */}
          <div className="legend">
            <span style={{ color: 'blue' }}>No emergence</span>
            <span style={{ color: 'yellow' }}>Partial</span>
            <span style={{ color: 'red' }}>Strong emergence</span>
          </div>

          {/* Export */}
          <button onClick={() => exportSweepResults(results)}>
            Export as CSV
          </button>

          {/* Insights */}
          <div className="insights">
            <h5>Emergence Boundaries Detected:</h5>
            <ul>
              {detectEmergenceBoundaries(results).map(boundary => (
                <li key={boundary.id}>
                  {boundary.description}
                  <br/>
                  Threshold: {boundary.threshold}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}

// Helper functions
function generateRange({ min, max, step }) {
  const result = [];
  for (let i = min; i <= max; i += step) {
    result.push(i);
  }
  return result;
}

function computeEmergenceScore(result) {
  // Combine multiple emergence indices into single score (0-1)
  const { emergence_indices } = result;
  const count = Object.values(emergence_indices).filter(v => v).length;
  return count / Object.keys(emergence_indices).length;
}

function detectEmergenceBoundaries(results) {
  // Find regions where emergence transitions
  const boundaries = [];
  const { matrix, xValues, yValues } = results;

  for (let y = 0; y < matrix.length - 1; y++) {
    for (let x = 0; x < matrix[y].length - 1; x++) {
      const current = matrix[y][x];
      const right = matrix[y][x + 1];
      const down = matrix[y + 1][x];

      // Detect transitions (emergence boundary)
      if (Math.abs(current - right) > 0.3 || Math.abs(current - down) > 0.3) {
        boundaries.push({
          id: `boundary_${x}_${y}`,
          x: xValues[x],
          y: yValues[y],
          description: `Emergence threshold detected at ${xValues[x]} (X) / ${yValues[y]} (Y)`,
          threshold: current > 0.5 ? 'High' : 'Low'
        });
      }
    }
  }

  return boundaries;
}

function exportSweepResults(results) {
  // Export as CSV for analysis in spreadsheet
  const { matrix, xValues, yValues } = results;
  const csv = [];
  
  csv.push(['', ...xValues.map(v => v.toString())].join(','));
  matrix.forEach((row, i) => {
    csv.push([yValues[i], ...row].join(','));
  });

  downloadCSV(csv.join('\n'), 'parameter_sweep.csv');
}
```

---

## Integration with Phase 16.12 Emergence Indices

```javascript
// Enhanced: Use emergence indices for sweep coloring

function computeEmergenceScore(result) {
  // Phase 16.12 integration
  const indices = result.emergence_indices;
  
  const weights = {
    atomic_stability: 1.0,
    shell_structure: 2.0,  // Most important
    orbital_localization: 1.5,
    excited_states: 0.5
  };

  let score = 0;
  let totalWeight = 0;

  for (const [key, value] of Object.entries(indices)) {
    if (weights[key]) {
      score += value ? weights[key] : 0;
      totalWeight += weights[key];
    }
  }

  return score / totalWeight;  // Weighted average
}
```

---

## Phase 17 Use Cases

### Use Case 1: Emergence Boundary Discovery

**Question**: "At what particle count does the periodic table pattern emerge?"

```
Run sweep: particle_count from 10 to 500 (step 25)
Result: 
  0-100:   Emergence score 0.2 (weak)
  100-200: Emergence score 0.5 (medium)  ← BOUNDARY
  200-500: Emergence score 0.9 (strong)

Insight: "Need ~150+ particles to see shell structure"
```

### Use Case 2: Model Accuracy Degradation

**Question**: "How does accuracy degrade with time-step?"

```
Run sweep: time_step from 0.001 to 1.0 (step 0.1)
Result:
  0.001-0.1:   Accuracy 95%
  0.1-0.5:     Accuracy 80%  ← DEGRADATION ZONE
  0.5-1.0:     Accuracy <50%

Insight: "Simulation is stable up to timestep 0.1"
```

### Use Case 3: Energy-Accuracy Trade-off

**Question**: "How does energy cutoff affect accuracy?"

```
Run sweep: energy_threshold from 0 to 100 eV (step 10)
Result: Heat map showing accuracy at each threshold
Insight: "Convergence at ~50 eV cutoff"
```

---

## Deliverables

### Code (200 lines)
- `client/src/components/ParameterSweepPanel.jsx` (150 lines)
  - UI for parameter selection
  - Range configuration
  - Heatmap visualization
  - Boundary detection

- `lib/sweep-analysis.js` (100 lines)
  - Matrix generation
  - Emergence scoring
  - Boundary detection
  - CSV export

### Integration
- Add "Parameter Sweep" tab to SimulatorTab
- Connect to Phase 16.11 (tri-track server) for efficient sweeps
- Use Phase 16.12 emergence indices for scoring

### Testing
- Test boundary detection (mock data)
- Test CSV export
- Test emergence scoring logic

---

## Performance Considerations

### Optimization: Use RESEARCH Track (Phase 16.11)

```javascript
// Phase 16.13 should use research track for speed
const trackPreference = {
  particle_count_sweep: 'research',  // 1 FP op, ~100ms
  time_step_sweep: 'research',
  energy_threshold_sweep: 'research'
};

// Typical sweep: 15 × 15 = 225 combinations
// Time estimate: 225 × 100ms = 22.5 seconds
// With caching: ~5-10 seconds for repeated parameters
```

---

## Success Criteria

- ✅ UI allows 2D parameter space exploration
- ✅ Heatmap visualization intuitive
- ✅ Emergence boundaries detected automatically
- ✅ Results exportable for publication
- ✅ Scales to 500+ combinations
- ✅ Uses Phase 16.11 research track efficiently

---

**Status**: ✅ Ready for implementation April 21  
**Next**: Phase 16.14 (Provenance Enrichment)  
**Impact**: Enables discovery-driven research in Phase 17
