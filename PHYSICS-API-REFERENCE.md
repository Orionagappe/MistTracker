# Physics System API Reference

## Phase 6.5: System Stabilization

This document provides a comprehensive reference for the MistTracker physics system API, including WebSocket protocol, error handling, and optimization utilities.

---

## Table of Contents

1. [WebSocket Protocol](#websocket-protocol)
2. [Physics Operations](#physics-operations)
3. [Error Handling](#error-handling)
4. [Performance Optimization](#performance-optimization)
5. [Configuration](#configuration)
6. [Examples](#examples)

---

## WebSocket Protocol

### Message Format

All WebSocket messages follow this structure:

```javascript
{
  type: 'MESSAGE_TYPE',
  data: { /* operation-specific data */ },
  timestamp: Date.now(), // optional
  id: 'unique-id'        // optional
}
```

### Core Message Types

#### HELLO (Server → Client)
Connection established, physics engine ready.

```javascript
{
  type: 'hello',
  userId: 1,
  connectionId: 'conn-12345',
  physicsVersion: '6.5',
  stats: { // initial status
    activeAtoms: 0,
    activeEmitters: 0,
    fps: 60
  }
}
```

#### PHYSICS_UPDATE (Server → Client)
Simulation state update, typically 60 times per second.

```javascript
{
  type: 'PHYSICS_UPDATE',
  data: {
    atoms: [
      {
        atomId: 'atom-1',
        atomType: 'H',
        position: [0, 0, 0],
        electronCount: 1,
        waveIntensity: 0.95,
        quantumState: { /* orbital data */ }
      }
    ],
    particles: [
      {
        particleId: 'p-1',
        parentAtomId: 'atom-1',
        position: [1.5, 0.2, -0.8],
        velocity: [0.1, 0, 0],
        energy: 2.3,
        momentum: 0.8,
        wavelength: 532e-9
      }
    ],
    emitters: [
      {
        emitterId: 'emitter-1',
        position: [0, 0, 0],
        frequency: 7000,
        amplitude: 0.9,
        wavesGenerated: 145
      }
    ],
    statistics: {
      totalParticles: 234,
      totalEnergy: 123.5,
      averageWaveIntensity: 0.87
    }
  },
  step: 5432,
  timestamp: 1712859840123
}
```

---

## Physics Operations

### Register Atom (Client → Server)

Add an atom to the physics simulation.

```javascript
ws.send(JSON.stringify({
  type: 'registerAtom',
  data: {
    atomType: 'H',           // 'H', 'He', 'C', 'N', 'O', 'F', 'Ne'
    atomId: 'atom-1',        // unique identifier
    position: [0, 0, 0],     // [x, y, z] coordinates
    amplitude: 1.0,          // electron cloud size (0.5-2.0)
    itemReference: {         // optional, for timeline integration
      timeline: 'timeline-1',
      category: 'Elements',
      item: 'Hydrogen'
    }
  }
}));
```

**Expected Response:** PHYSICS_UPDATE with atom added to atoms array

**Error Conditions:**
- Invalid atomType → Error: "Unknown atom type"
- Missing atomId → Error: "atomId required"
- Invalid position → Error: "position must be [x, y, z]"

---

### Create Wave Emitter (Client → Server)

Create an electromagnetic wave source.

```javascript
ws.send(JSON.stringify({
  type: 'createWaveEmitter',
  data: {
    emitterId: 'emitter-1',      // unique identifier
    position: [0, 0, 0],         // [x, y, z] source location
    frequency: 7000,             // Hz (recommended: 1000-15000)
    amplitude: 0.8,              // wave height (0-1.0)
    wavelength: 45               // optional, calculates from freq
  }
}));
```

**Resonant Frequencies for Atoms:**
- H atom: 6-8 kHz (Lyman-alpha range)
- He atom: 4-6 kHz
- C atom: 8-10 kHz
- Multi-electron atoms: 5-9 kHz range

**Expected Response:** PHYSICS_UPDATE with emitter active

---

### Unregister Atom (Client → Server)

Remove atom from simulation.

```javascript
ws.send(JSON.stringify({
  type: 'unregisterAtom',
  data: {
    atomId: 'atom-1'
  }
}));
```

**Expected Response:** PHYSICS_UPDATE with atom removed

---

### Set Dimensional Coupling (Client → Server)

Enable/disable 4D spacetime coupling.

```javascript
ws.send(JSON.stringify({
  type: 'setDimensionalCoupling',
  data: {
    enabled: true,           // enable/disable
    coupling4D: true,        // use 4D metric tensor
    couplingStrength: 1.0    // 0-2.0 scale
  }
}));
```

**Effects:**
- When enabled: Waves propagate through metric tensor, longer range
- When disabled: Classical 3D propagation only

---

## Error Handling

### Error Handler API

```javascript
import { errorHandler } from './utils/errorHandling';

// Subscribe to errors
const unsubscribe = errorHandler.subscribe((errorEvent) => {
  console.log(errorEvent.message);
  console.log(errorEvent.context);
  console.log(errorEvent.severity); // 'error', 'warning', 'critical'
});

// Get error history
const history = errorHandler.getHistory(); // Last 100 errors

// Emit custom error
errorHandler.emit(error, {
  name: 'Custom Operation',
  context: 'additional data',
  severity: 'warning'
});

// Cleanup
unsubscribe();
```

### Toast Notifications

```javascript
// Globally available after app startup
window.showToast(message, 'info', 4000);
window.showToastError(message, 6000);
window.showToastSuccess(message, 4000);
window.showToastWarning(message, 4000);
```

### Retry with Backoff

```javascript
import { withRetry } from './utils/errorHandling';

const result = await withRetry(
  async () => {
    // Your operation here
    return await someAsyncOperation();
  },
  {
    maxAttempts: 3,
    delayMs: 100,
    backoffMultiplier: 2,
    timeoutMs: 5000,
    operationName: 'Custom Operation'
  }
);
```

### WebSocket Error Handler

```javascript
import { wsErrorHandler } from './utils/errorHandling';

wsErrorHandler.subscribe(({ event, data }) => {
  if (event === 'error') {
    console.error('WebSocket error:', data.type);
  }
  if (event === 'reconnect-scheduled') {
    console.log(`Reconnecting in ${data.delayMs}ms`);
  }
});
```

---

## Performance Optimization

### Mesh Pool (GPU Memory Optimization)

```javascript
import { MeshPool } from './utils/performanceOptimization';

const geometry = new THREE.SphereGeometry(1, 32, 32);
const material = new THREE.MeshStandardMaterial({ color: 0xFF0000 });
const pool = new MeshPool(1000, geometry, material);

// Acquire mesh
const mesh = pool.acquire();
scene.add(mesh);

// Restore mesh
pool.release(mesh);

// Get stats
const stats = pool.getStats();
console.log(stats.utilizationRatio);

// Cleanup
pool.dispose();
```

### WebSocket Batching

```javascript
import { WebSocketBatcher } from './utils/performanceOptimization';

const batcher = new WebSocketBatcher(ws, {
  batchSize: 10,
  batchTimeoutMs: 50
});

// Queue multiple operations
batcher.queue('registerAtom', { /* ... */ });
batcher.queue('registerAtom', { /* ... */ });
batcher.queue('registerAtom', { /* ... */ });

// Automatically batches and sends when full or timeout
// Gets stats
const stats = batcher.getStats();
```

### Frame Rate Limiter

```javascript
import { FrameRateLimiter } from './utils/performanceOptimization';

const limiter = new FrameRateLimiter(60); // max 60fps

function update() {
  if (!limiter.shouldProcess()) return;
  
  // Perform expensive operation
  updatePhysics();
}
```

---

## Configuration

### Physics Page Options

```javascript
<PhysicsPage 
  timeline={timeline}
  onBack={handleBack}
  options={{
    enableVisualization: true,
    emitterVisualScale: 1.0,
    particlePoolSize: 5000,
    updateFrequency: 60, // fps
    tensorFieldResolution: 32
  }}
/>
```

### usePhysics Hook Options

```javascript
const physics = usePhysics(sceneRef.current, null, wsConnection, {
  enableVisualization: true,
  physicsUpdateCallback: (msg) => console.log(msg),
  onCouplingChange: (enabled) => console.log('Coupling:', enabled),
  emitterVisualScale: 1.0
});
```

---

## Examples

### Example 1: Register and Visualize Atoms

```javascript
async function setupPhysicsDemo() {
  const ws = new WebSocket('ws://localhost:3000?token=...');
  
  ws.onopen = () => {
    // Register atoms
    ws.send(JSON.stringify({
      type: 'registerAtom',
      data: {
        atomType: 'H',
        atomId: 'h-1',
        position: [-50, 0, 0],
        amplitude: 1.0
      }
    }));

    ws.send(JSON.stringify({
      type: 'registerAtom',
      data: {
        atomType: 'He',
        atomId: 'he-1',
        position: [50, 0, 0],
        amplitude: 1.0
      }
    }));

    // Create emitter between atoms
    setTimeout(() => {
      ws.send(JSON.stringify({
        type: 'createWaveEmitter',
        data: {
          emitterId: 'emitter-1',
          position: [0, 0, 0],
          frequency: 7000,
          amplitude: 0.8
        }
      }));
    }, 500);
  };

  ws.onmessage = (event) => {
    const message = JSON.parse(event.data);
    
    if (message.type === 'PHYSICS_UPDATE') {
      updateVisualization(message.data);
    }
  };
}
```

### Example 2: Error Handling

```javascript
import { errorHandler, withRetry } from './utils/errorHandling';

// Setup error handler
errorHandler.subscribe((event) => {
  if (event.severity === 'error') {
    console.error(`ERROR: ${event.message}`);
    window.showToastError(event.message, 6000);
  } else if (event.severity === 'warning') {
    console.warn(`WARNING: ${event.message}`);
  }
});

// Retry physics operation
try {
  await withRetry(
    () => registerAtomWithValidation(atomData),
    { maxAttempts: 3, operationName: 'Atom Registration' }
  );
} catch (err) {
  window.showToastError('Failed to register atom after 3 attempts');
}
```

### Example 3: Performance Optimization

```javascript
import { MeshPool, WebSocketBatcher } from './utils/performanceOptimization';

// Setup batching
const batcher = new WebSocketBatcher(ws, 10, 50);

// Batch register many atoms
for (let i = 0; i < 50; i++) {
  batcher.queue('registerAtom', {
    atomType: 'H',
    atomId: `atom-${i}`,
    position: [Math.random() * 100 - 50, 0, 0],
    amplitude: 1.0
  });
}

// Batches automatically optimized
setInterval(() => {
  const stats = batcher.getStats();
  console.log(`Messages: ${stats.messagesSent}, Batches: ${stats.batchesSent}`);
}, 1000);
```

---

## Troubleshooting

See [PHYSICS-TROUBLESHOOTING.md](PHYSICS-TROUBLESHOOTING.md) for common issues and solutions.

---

## Performance Guidelines

| Operation | Typical Time | Notes |
|-----------|-------------|-------|
| Atom Registration | 10-50ms | Should be fast, may retry |
| Physics Update | 16-17ms | 60fps target |
| Particle Visualization | 8-12ms | Depends on count |
| Wave Propagation | 5-8ms | Per physics frame |
| Message Round Trip | 20-50ms | Network dependent |

---

## Browser Compatibility

| Feature | Chrome | Firefox | Safari | Notes |
|---------|--------|---------|--------|-------|
| WebSocket | ✓ | ✓ | ✓ | Full support |
| WebGL | ✓ | ✓ | ✓ | Required for visualization |
| Web Workers | ✓ | ✓ | ⚠️  | Better performance |
| OffscreenCanvas | ✓ | ✓ | ✗ | Not required |

---

## Version History

**6.5** - System stabilization with error handling, performance optimization, comprehensive APIs  
**6.4** - Physics integration tests  
**6.3** - TimelineDetail robustness  
**6.2** - Default timeline generator  
**6.1** - Bug fixes and utility completion  
**5.x** - Complete quantum physics implementation
