# Phase 5 Physics Engine - Technical Reference & API Documentation

## File Structure

```
MistTracker/
├── physics-engine.js                           # Core physics engine (800+ lines)
│   └── MistPhysicsEngine class
├── websocket-protocol.js                       # Enhanced with physics messages
│   ├── MessageTypes (PHYSICS_*, WAVE_EMITTER, DIMENSIONAL_COUPLING)
│   ├── PhysicsUpdateMessage
│   ├── PhysicsConfigMessage
│   ├── WaveEmitterMessage
│   ├── DimensionalCouplingMessage
│   └── PhysicsStateMessage
├── server.js                                    # Server integration
│   ├── Physics engine instantiation
│   ├── Physics simulation loop
│   ├── Physics message handlers (5 cases)
│   └── Geometry/Physics sync in MUTATION handler
├── client/src/hooks/usePhysics.js              # React integration
├── test-physics-engine.js                      # Test suite (62 tests)
├── PHASE5-PHYSICS-GUIDE.md                     # User guide (this file)
└── PHASE5-PHYSICS-TECHNICAL.md                 # Technical reference
```

## API Reference

### MistPhysicsEngine Class

#### Constructor

```javascript
new MistPhysicsEngine(config = {})
```

**Parameters:**
```javascript
{
  timeStep: number                    // Default: 0.016 (60fps)
  gravityStrength: number             // Default: 9.81
  lightSpeed: number                  // Default: 299792458
  waveSpeedMultiplier: number         // Default: 1.0
  dimensionalCouplingStrength: number // Default: 0.5
}
```

#### Geometry Management

**registerGeometry(itemId, initialState)**
- **Purpose:** Register a geometry for physics simulation
- **Returns:** Geometry object with physics properties
- **Parameters:**
  ```javascript
  {
    position: [x, y, z],              // Initial position
    velocity: [vx, vy, vz],           // Initial velocity (optional)
    mass: number,                     // Mass (default: 1.0)
    scale: [sx, sy, sz],              // Scale factors
    rotation: [rx, ry, rz],           // Rotation angles
    waveFunction: {
      amplitude: number,
      frequency: number,
      phase: number
    },
    energy: number,                   // Initial energy
    isWaveEmitter: boolean,           // Can emit waves
    isWaveAbsorber: boolean           // Absorbs energy
  }
  ```

**getGeometry(itemId)**
- **Returns:** Geometry object or null
- **Properties:**
  ```javascript
  {
    itemId: string,
    position: [x, y, z],
    velocity: [vx, vy, vz],
    acceleration: [ax, ay, az],
    mass: number,
    scale: [sx, sy, sz],
    rotation: [rx, ry, rz],
    angularVelocity: [avx, avy, avz],
    waveFunction: {
      amplitude: number,
      frequency: number,
      phase: number,
      wavelength: number
    },
    energy: number,
    internalEnergy: number,
    forces: [[fx,fy,fz], ...],
    couplingEnergy: number,
    timeDilation: number,
    isWaveEmitter: boolean,
    isWaveAbsorber: boolean,
    lastUpdateTime: number
  }
  ```

**updateGeometry(itemId, updates)**
- **Purpose:** Update specific geometry properties
- **Returns:** Updated geometry object
- **Parameters:** Partial geometry object with fields to update

**getAllGeometries()**
- **Returns:** Array of all registered geometries

**removeGeometry(itemId)**
- **Purpose:** Remove geometry from simulation
- **Returns:** void

#### Tensor Field Management

**registerTensorField(itemId, initialState)**
- **Purpose:** Register a 4D tensor field coupled to geometry
- **Returns:** Tensor field object
- **Parameters:**
  ```javascript
  {
    d0: number,                       // Dimension 0 component (0-1)
    d1: number,                       // Dimension 1 component (0-1)
    intensity: number,                // Intensity (default: 1.0)
    frequency: number,                // Frequency (Hz, default: 440)
    phase: number,                    // Phase offset (0-2π)
    geometryItemId: string,           // Coupled geometry
    energy: number                    // Initial energy
  }
  ```

**getTensorField(itemId)**
- **Returns:** Tensor field object or null
- **Properties:**
  ```javascript
  {
    itemId: string,
    d0: number,
    d1: number,
    intensity: number,
    frequency: number,
    phase: number,
    wavelength: number,
    energy: number,
    energyDistribution: { x, y, z, w },
    geometryItemId: string,
    couplingStrength: number,
    lastUpdateTime: number
  }
  ```

**updateTensorField(itemId, updates)**
- **Purpose:** Update tensor field properties
- **Parameters:** Partial tensor field object

**getAllTensorFields()**
- **Returns:** Array of all tensor fields

**removeTensorField(itemId)**
- **Purpose:** Remove tensor field from simulation

#### Wave Emitter Management

**createWaveEmitter(emitterId, config)**
- **Purpose:** Create a wave emitter (light, gravity, quantum)
- **Returns:** Emitter object
- **Parameters:**
  ```javascript
  {
    type: 'light'|'gravity'|'quantum',
    position: [x, y, z],
    frequency: number,
    amplitude: number,
    intensity: number,
    range: number,                    // Optional (default: 100)
    isActive: boolean                 // Optional (default: true)
  }
  ```

**setWaveEmitterActive(emitterId, isActive)**
- **Purpose:** Enable/disable emitter
- **Parameters:**
  - `emitterId`: string
  - `isActive`: boolean

#### Simulation Control

**simulateStep(deltaTime)**
- **Purpose:** Execute one physics simulation step
- **Parameters:** Timestep in seconds (default: config.timeStep)
- **Returns:**
  ```javascript
  {
    geometryUpdates: [ /* updated geometries */ ],
    tensorUpdates: [ /* updated tensor fields */ ],
    waveState: { /* wave function state */ }
  }
  ```

#### Dimensional Coupling

**setCouplingEnabled(enabled)**
- **Purpose:** Enable/disable 3D↔4D energy exchange
- **Parameters:** boolean

#### Configuration

**setConfig(updates)**
- **Purpose:** Update engine configuration
- **Parameters:** Partial config object

**getConfig()**
- **Returns:** Current configuration object

**getStatistics()**
- **Returns:**
  ```javascript
  {
    totalEnergy: number,
    averageWaveIntensity: number,
    activeWaveEmitters: number,
    geometryUpdates: number,
    tensorUpdates: number,
    interactionCount: number
  }
  ```

**getCoupledState()**
- **Purpose:** Get full physics state for serialization/export
- **Returns:**
  ```javascript
  {
    geometries: [ /* all geometries */ ],
    tensorFields: [ /* all tensors */ ],
    waveEmitters: [ /* all emitters */ ],
    stats: { /* statistics */ },
    couplingEnabled: boolean,
    simulationTime: number
  }
  ```

**getSimulationTime()**
- **Returns:** Current simulation time in seconds

### Physics Formulas & Constants

#### Wave Function Evolution
```
ψ(x,t) = A * e^(i(kx - ωt))

where:
k = 2π/λ = 2πf/c     (wave number)
ω = 2πf               (angular frequency)
λ = c/f               (wavelength)
A = amplitude
φ = kx - ωt           (phase)
```

#### Gravity Force (Simplified)
```
F_g = (G * M * m) / r²  * (1 + relativistic_correction)

where:
G = gravitational constant times scale factor
M = central mass
m = object mass
r = distance to center
```

#### Light Pressure Force
```
F_light = (I * A / distance²) * direction_vector

where:
I = intensity
A = amplitude
distance = distance from emitter
```

#### Interference Force
```
F_interference = cos(Δφ) * A₁ * A₂ * influence_coefficient

where:
Δφ = phase₁ - phase₂
A₁, A₂ = amplitudes
cos(Δφ) > 0  : constructive (attractive)
cos(Δφ) < 0  : destructive (repulsive)
```

#### Time Dilation (Lorentz)
```
γ = 1 / sqrt(1 - v²/c²)
t_dilated = t / γ

where:
v = object velocity
c = speed of light
```

#### Energy Distribution
```
E_x = E_total * (d0 / (d0+d1)) * 0.3
E_y = E_total * (d0 / (d0+d1)) * 0.3
E_z = E_total * (d0 / (d0+d1)) * 0.4
E_w = E_total * (d1 / (d0+d1))
```

### WebSocket Message Formats

#### Physics Update (Broadcast)

```json
{
  "type": "physics-update",
  "geometryUpdates": [
    {
      "itemId": "string",
      "position": [x, y, z],
      "velocity": [vx, vy, vz],
      "acceleration": [ax, ay, az],
      "rotation": [rx, ry, rz],
      "scale": [sx, sy, sz],
      "energy": number,
      "waveFunction": {
        "phase": number,
        "amplitude": number,
        "frequency": number
      },
      "timeDilation": number
    }
  ],
  "tensorUpdates": [
    {
      "itemId": "string",
      "intensity": number,
      "phase": number,
      "frequency": number,
      "energy": number,
      "energyDistribution": { "x": number, "y": number, "z": number, "w": number }
    }
  ],
  "statistics": {
    "totalEnergy": number,
    "averageWaveIntensity": number,
    "activeWaveEmitters": number,
    "geometryUpdates": number,
    "tensorUpdates": number,
    "interactionCount": number
  },
  "timestamp": number
}
```

#### Physics Configuration

```json
{
  "type": "physics-config",
  "timeStep": 0.016,
  "gravityStrength": 0.1,
  "lightSpeed": 299792458,
  "waveSpeedMultiplier": 1.0,
  "dimensionalCouplingStrength": 0.5,
  "timestamp": number
}
```

#### Wave Emitter Creation

```json
{
  "type": "wave-emitter",
  "emitterId": "string",
  "emitterType": "light|gravity|quantum",
  "position": [x, y, z],
  "frequency": number,
  "amplitude": number,
  "intensity": number,
  "isActive": boolean,
  "timestamp": number
}
```

#### Dimensional Coupling Control

```json
{
  "type": "dimensional-coupling",
  "enabled": boolean,
  "couplingStrength": 0.5,
  "timestamp": number
}
```

#### Physics State Request/Response

```json
{
  "type": "physics-state",
  "geometries": [ /* array of geometries */ ],
  "tensorFields": [ /* array of tensor fields */ ],
  "waveEmitters": [ /* array of emitters */ ],
  "statistics": { /* stats object */ },
  "simulationTime": number,
  "timestamp": number
}
```

### React Hook: usePhysics

**Signature:**
```javascript
const physics = usePhysics(threeScene, physicsState, wsConnection, options)
```

**Parameters:**
- `threeScene`: Three.js scene object (for visualization)
- `physicsState`: Current scene state (from context)
- `wsConnection`: useWebSocket hook instance
- `options`: Configuration object

**Options:**
```javascript
{
  enableVisualization: boolean,     // Default: true
  physicsUpdateCallback: function,  // Called on physics updates
  onCouplingChange: function,       // Called when coupling changes
  emitterVisualScale: number        // Default: 1.0
}
```

**Return Object:**

```javascript
{
  // State
  isInitialized: boolean,
  activeGeometries: Map<itemId, geometry>,
  activeTensorFields: Map<itemId, tensorField>,
  waveEmitters: Map<emitterId, emitter>,
  stats: statistics object,
  couplingEnabled: boolean,

  // Geometry methods
  getGeometryState: (itemId) => geometry,
  getAllGeometries: () => geometry[],
  getTensorFieldState: (itemId) => tensorField,
  getAllTensorFields: () => tensorField[],

  // Control methods
  configurePhysics: (config) => void,
  createWaveEmitter: (id, type, pos, freq, amp, intensity) => void,
  setDimensionalCoupling: (enabled) => void,
  requestPhysicsState: () => void,

  // Query methods
  getStatistics: () => stats,
  exportPhysicsData: () => exportedData,
  clearAllVisualizations: () => void
}
```

### Server Integration Points

#### Initialization (server.js)

```javascript
import { MistPhysicsEngine } from './physics-engine.js';

const physicsEngine = new MistPhysicsEngine({
  timeStep: 0.016,
  gravityStrength: 0.1,
  dimensionalCouplingStrength: 0.5
});
```

#### Message Handlers (handleWebSocketMessage)

**5 Physics Cases:**

1. **MessageTypes.PHYSICS_CONFIG** - Configure engine
2. **MessageTypes.WAVE_EMITTER** - Create emitters
3. **MessageTypes.DIMENSIONAL_COUPLING** - Toggle coupling
4. **MessageTypes.PHYSICS_STATE** - Send full state snapshot
5. **Physics Update Loop** - Broadcast every frame

#### Geometry Sync (MUTATION handler)

```javascript
case MessageTypes.MUTATION:
  // Create/Delete synchronizes with physics engine
  if (action === 'delete') {
    physicsEngine.removeGeometry(itemId);
    physicsEngine.removeTensorField(itemId);
  } else if (geometryCreated) {
    physicsEngine.registerGeometry(itemId, {...});
    physicsEngine.registerTensorField(itemId, {...});
  }
```

#### Simulation Loop

```javascript
const physicsLoopInterval = setInterval(() => {
  const result = physicsEngine.simulateStep(0.016);
  
  // Broadcast to all connected clients
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify({
        type: MessageTypes.PHYSICS_UPDATE,
        ...result,
        statistics: physicsEngine.getStatistics()
      }));
    }
  });
}, 16);
```

## Performance Optimization Tips

### Server-Side
1. **Limit Geometry Count:** 500-1000 max recommended
2. **Use Appropriate Timestep:** 0.016 for 60fps
3. **Batch Updates:** Use single broadcast per frame
4. **Profile Regularly:** Monitor CPU usage per step

### Client-Side
1. **Enable Visualization Selectively:** Only for active objects
2. **LOD Emitters:** Visualize only nearby wave emitters
3. **Throttle Updates:** Cache updates between frames
4. **Use Three.js Efficiently:** Batch geometry updates

### Network
1. **Compress Updates:** Could implement delta compression
2. **Adaptive Broadcast:** Reduce frequency for distant clients
3. **WebSocket Optimization:** Enable compression

## Debugging & Troubleshooting

### Check Physics State
```javascript
// Get full state
const state = physicsEngine.getCoupledState();
console.log('Geometries:', state.geometries.length);
console.log('Tensors:', state.tensorFields.length);
console.log('Emitters:', state.waveEmitters.length);
console.log('Energy:', state.stats.totalEnergy);
```

### Monitor Phase Evolution
```javascript
const geom = physicsEngine.getGeometry('itemId');
console.log('Phase:', geom.waveFunction.phase);
console.log('Frequency:', geom.waveFunction.frequency);
console.log('Wavelength:', geom.waveFunction.wavelength);
```

### Check Coupling Status
```javascript
const isCoupled = physicsEngine.couplingEnabled;
const strength = physicsEngine.config.dimensionalCouplingStrength;
```

### Verify Wave Effects
```javascript
const emitter = physicsEngine.waveEmitters.get('emitterId');
console.log('Emitter Active:', emitter.isActive);
console.log('Intensity:', emitter.intensity);
console.log('Frequency:', emitter.frequency);
```

## Testing Commands

```bash
# Run full test suite
node test-physics-engine.js

# Individual test sections (modify test file)
# Edit test file to run specific sections only

# Test server integration
npm test  # if configured

# Performance test
# Monitor CPU with extended simulation loop
```

## Common Issues & Solutions

| Issue | Cause | Solution |
|-------|-------|----------|
| Objects not moving | Gravity strength too low | Increase `gravityStrength` |
| Wave effects missing | Emitters not created | Use `createWaveEmitter()` |
| No coupling effects | Coupling disabled | Enable with `setDimensionalCoupling(true)` |
| High CPU usage | Too many geometries | Reduce geometry count or increase timestep |
| Phase not evolving | Frequency zero | Set valid frequency > 0 |
| Energy not transferring | Coupling strength zero | Increase `dimensionalCouplingStrength` |

## Version History

**v1.0** (2026-04-10)
- Initial wave-based physics engine
- 3D geometry simulation
- 4D tensor field coupling
- Wave emitter system
- Relativistic corrections
- Dimensional coupling
- WebSocket integration
- React hooks
- 62 comprehensive tests

## Future Development

**Planned Features:**
- N-body gravitational simulation
- Rigid body dynamics
- Collision detection
- Soft body physics
- GPU acceleration
- Advanced interference patterns
- Quantum potential wells
- Particle effects integration

---

**Technical Reference Version:** 1.0  
**Phase:** Phase 5  
**Last Updated:** 2026-04-10  
**Status:** Production Ready
