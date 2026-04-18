# Physics Model Regression Testing Guide

## Overview

This guide covers the regression testing suite for MistTracker's unified physics model. The testing framework validates atom registration, electron evolution, wave propagation, particle generation, and multi-atom resonance effects.

**Phase 11 Update:** Tests now use the unified atom model where each atom contains both orbital (EM−) and nuclear (EM+) properties.

## Quick Start

### 1. Start the Server
```bash
npm run server
# Server runs on ws://localhost:3000
```

### 2. Run Full Regression Tests
```bash
node regression-test-runner.js
```

### 3. Run with Verbose Output
```bash
node regression-test-runner.js --verbose
```

### 4. Run Specific Config Tests
```bash
node regression-test-runner.js --config=HYDROGEN_SIMPLE
node regression-test-runner.js --config=RESONANCE_CASCADE
```

## Demo Configurations

### 1. HYDROGEN_SIMPLE
**Purpose:** Basic single-atom physics validation
- Single hydrogen atom at origin
- Simple wave emitter at resonant frequency (7000 Hz)
- Tests: Electron evolution, physics updates, particle generation

**Atoms:** 1 (H, 1s orbital)
**Emitters:** 1
**Recommended For:**
- Testing basic physics engine functionality
- Verifying PHYSICS_UPDATE message format
- Baseline particle generation benchmarking

### 2. MULTI_ATOM
**Purpose:** Independent multi-atom evolution
- Three different elements: H, He, C
- Spatially separated (-80, 0, +80)
- Each evolves independently with distinct nuclear frequencies
- Tests: Atom independence, no cross-interference, frequency differentiation

**Atoms:** 3 (H, He, C with different quantum numbers)
**Emitters:** 1 (at H position)
**Recommended For:**
- Verifying multi-body physics
- Testing element-specific frequency responses
- Checking computational stability with multiple objects

### 3. WAVE_COUPLING
**Purpose:** Wave-orbital coupling and resonance
- Two atoms separated by 120 units
- Wave emitter between atoms
- Tests coupling effects and particle generation at multiple sites
- Tests: Resonance detection, phase coherence, multi-site effects

**Atoms:** 2 (both 2p)
**Emitters:** 1 (central position)
**Simulation Params:** Increased fieldStrength (1.2)
**Recommended For:**
- Testing wave coupling mechanisms
- Validating particle generation at different locations
- Measuring resonance strength

### 4. FREQUENCY_SWEEP
**Purpose:** Frequency-dependent particle generation
- Single carbon atom (higher Z = higher resonant frequency)
- Two emitters at different frequencies (4000 Hz and 7000 Hz)
- Tests that higher frequencies generate more particles
- Tests: Frequency response, resonance maximization

**Atoms:** 1 (C, 2p orbital)
**Emitters:** 2 (low frequency and resonant frequency)
**Recommended For:**
- Characterizing frequency-dependent effects
- Finding resonant frequencies for elements
- Optimizing simulation parameters

### 5. LONG_RANGE
**Purpose:** 4D wave propagation through metric tensor
- Two atoms 300 units apart (-150 to +150)
- Wave emitter at source
- Tests wave propagation over macroscopic distances
- Tests: Metric tensor effects, long-range coupling, amplitude falloff

**Atoms:** 2 (H at ±150)
**Emitters:** 1 (at source)
**Simulation Params:** Reduced waveSpeedMultiplier (0.95)
**Recommended For:**
- Validating metric tensor propagation
- Testing amplitude attenuation models
- Verifying wave transport physics

### 6. AMPLITUDE_FALLOFF
**Purpose:** Distance-dependent amplitude attenuation
- Three atoms at 50, 100, 150 units from emitter
- Single emitter at origin
- Measures wave intensity at each distance
- Tests: Falloff law validation, metric consistency

**Atoms:** 3 (He at different distances)
**Emitters:** 1 (at origin)
**Recommended For:**
- Validating amplitude falloff law
- Measuring propagation constants
- Verifying metric tensor implementation

### 7. RESONANCE_CASCADE
**Purpose:** Multi-atom resonance cascade effects
- Three atoms in linear array (-80, 0, +80)
- Wave emitter at first atom
- Wave propagates through cascade with phase coherence
- Tests: Phase relationships, interference effects, cascade gain

**Atoms:** 3 (different orbitals: 3s, 2p, 2s)
**Emitters:** 1 (at first atom)
**Simulation Params:** Increased fieldStrength (1.2) and waveSpeedMultiplier (1.1)
**Recommended For:**
- Testing coherent multi-object effects
- Measuring cascade gain
- Studying phase relationships

### 8. MULTI_FREQUENCY
**Purpose:** Complex multi-frequency system stability
- Four atoms with varied nuclear frequencies (H, He, C, O)
- Three emitters at different frequencies (5000, 7000, 9000 Hz)
- Tests system stability with complex interactions
- Tests: Frequency coexistence, interference patterns

**Atoms:** 4 (H, He, C, O)
**Emitters:** 3 (low, mid, high frequencies)
**Recommended For:**
- Stress testing the physics engine
- Measuring computational stability
- Studying complex interference effects

## Test Scenarios

### Core Regression Tests

#### Single Atom Evolution
- **What:** Register one atom and verify PHYSICS_UPDATE messages
- **Expected:** Physics updates arrive with electron state data
- **Pass Criteria:** 5 consecutive PHYSICS_UPDATE messages received

#### Multi-Atom Independence
- **What:** Register 3 elements and verify independent evolution
- **Expected:** Each atom evolves separately without cross-interference
- **Pass Criteria:** All atoms show in updates, frequencies differentiate

#### Wave Propagation
- **What:** Emit wave from source atom to distant receiver
- **Expected:** Wave detected at receiver position
- **Pass Criteria:** Wave intensity at receiver > 5% of source

### Extended Physics Tests

#### Particle Generation
- **What:** Count particles generated at resonant frequency
- **Expected:** Increased particle count at resonant frequencies
- **Pass Criteria:** High-frequency emitter generates 2x particles vs low frequency

#### Amplitude Falloff
- **What:** Measure wave intensity at 50, 100, 150 units
- **Expected:** Intensity decreases monotonically with distance
- **Pass Criteria:** `intensity[50] > intensity[100] > intensity[150]`

#### Resonance Cascade
- **What:** Observe wave propagation through 3-atom cascade
- **Expected:** Wave reaches all atoms with observable phase relationships
- **Pass Criteria:** Wave intensity > 0.05 at final atom

## Running Tests via Client Interface

### DemoConfigSelector Component

The `DemoConfigSelector` component integrates into the AtomBuilder UI:

```jsx
import DemoConfigSelector from './components/DemoConfigSelector';

function MyComponent() {
  const handleConfigLoaded = (config) => {
    console.log('Config loaded:', config);
    // Pass to AtomBuilder or simulation
  };

  return (
    <DemoConfigSelector onConfigLoaded={handleConfigLoaded} />
  );
}
```

### Using Hook Directly

```jsx
import useDemoConfigs from './hooks/useDemoConfigs';

function MyComponent() {
  const demo = useDemoConfigs();

  const loadConfig = () => {
    demo.loadConfig('HYDROGEN_SIMPLE');
    const details = demo.getConfigDetails('HYDROGEN_SIMPLE');
    const physicsConfig = demo.exportForPhysicsEngine('HYDROGEN_SIMPLE');
  };

  return (
    <div>
      {demo.availableConfigs.map(cfg => (
        <button key={cfg.name} onClick={() => demo.loadConfig(cfg.name)}>
          {cfg.displayName}
        </button>
      ))}
    </div>
  );
}
```

## Test Results Interpretation

### Pass Criteria
- ✅ **PHYSICS_UPDATE:** Message arrives with expected structure
- ✅ **Atoms Persist:** Objects remain in state across updates
- ✅ **Wave Detected:** Distant atoms show wave intensity > threshold
- ✅ **Frequency Response:** Higher frequencies generate more particles
- ✅ **Amplitude Falloff:** Intensity decreases monotonically with distance

### Common Failures

| Failure | Cause | Solution |
|---------|-------|----------|
| No PHYSICS_UPDATE | Physics engine not running | Check `npm run server` |
| Invalid message format | Physics state mismatch | Verify atom registration |
| Atoms disappear | State management issue | Check setAtoms calls |
| Wave not propagating | Metric tensor disabled | Check simulation params |
| Particle count 0 | Emitter not triggering | Verify frequency tuning |
| Amplitude increasing with distance | Metric inversion bug | Check metric tensor sign |

## Debugging Tips

### Enable Verbose Logging
```bash
node regression-test-runner.js --verbose
```

### Check Server Logs
```bash
# In server terminal
npm run server
# Watch for error messages
```

### View Test Logs
```bash
# Logs saved to test-logs/ directory
ls -la test-logs/
cat test-logs/physics-integration-*.log
```

### Manual Testing via WebSocket
```javascript
// In browser console
const ws = new WebSocket('ws://localhost:3000?token=dev-token');
ws.onmessage = (e) => console.log(JSON.parse(e.data));
ws.send(JSON.stringify({
  type: 'registerAtom',
  data: {
    atomType: 'H',
    atomId: 'test-1',
    position: [0, 0, 0],
    amplitude: 1.0
  }
}));
```

## Physics Model Details

### Unified Atom Structure
```javascript
{
  id: "atom-[timestamp]-[random]",
  orbital_name: "2p",
  orbital: { n: 2, l: 1, m: 0 },
  position: [x, y, z],
  
  // Orbital properties (Electrons - EM−)
  orbitalAmplitude: 0.5,
  orbitalFrequency: 5.0e14,      // ~500 nm optical
  orbitalIntensity: 1.0,
  
  // Nuclear properties (Protons - EM+)
  nucleusAmplitude: 0.3,
  nucleusFrequency: 3.29e15,     // ~90 nm UV
  nucleusIntensity: 1.0
}
```

### Frequency Ranges

| Type | Frequency | Wavelength | Physics |
|------|-----------|-----------|---------|
| Orbital (EM−) | 4.84e14 - 6.5e14 Hz | 460-620 nm | Visible light |
| Nuclear (EM+) | 3.29e15 - 2.04e16 Hz | 15-90 nm | UV to soft X-ray |

### Simulation Parameters

| Parameter | Type | Effect |
|-----------|------|--------|
| timeDilation | float | Physics time step scale |
| fieldStrength | float | Wave coupling strength |
| gravityStrength | float | Gravitational effects |
| waveSpeedMultiplier | float | Propagation velocity |

## Performance Benchmarks

### Expected Metrics
- Single atom update rate: ~60 Hz
- Multi-atom (3) update rate: ~50 Hz
- Particle generation: 10-50 per update (configuration dependent)
- Wave propagation time (300 units): ~5-10 updates

### Regression Baselines
```
HYDROGEN_SIMPLE:
  - Particle count: 15-25 per update
  - Update latency: <16ms
  - Wave intensity: 0.3-0.5

RESONANCE_CASCADE:
  - Cascade gain: 2-4x
  - Phase shift: 0-π
  - Final atom intensity: >0.1
```

## Contributing New Tests

Add new demo configurations to `client/src/config/DEMO_PHYSICS_CONFIGS.js`:

```javascript
export const MY_CONFIG = {
  name: 'My Configuration',
  description: 'What this tests',
  timestamp: new Date().toISOString(),
  atoms: [
    {
      id: 'my-atom',
      orbital_name: '2p',
      orbital: { n: 2, l: 1, m: 0 },
      position: [0, 0, 0],
      orbitalAmplitude: 0.5,
      orbitalFrequency: 5.0e14,
      orbitalIntensity: 1.0,
      nucleusAmplitude: 0.3,
      nucleusFrequency: 3.29e15,
      nucleusIntensity: 1.0
    }
  ],
  waveEmitters: [
    {
      id: 'my-emitter',
      position: [0, 0, 0],
      frequency: 7000,
      amplitude: 0.8,
      wavelength: 50
    }
  ],
  simulationParams: {
    timeDilation: 1.0,
    fieldStrength: 1.0,
    gravityStrength: 1.0,
    waveSpeedMultiplier: 1.0
  }
};
```

Then add to export list and test map.

## Support

For issues or questions:
1. Check test logs in `test-logs/` directory
2. Review physics engine output
3. Verify server is running: `npm run server`
4. Check WebSocket connection: `echo 'ws://localhost:3000'`
5. Review demo config definitions
