# Physics Visualization - User Guide

## How to Access Physics Simulation

### From Timeline View
1. Navigate to any timeline
2. Click the **⚛️ Physics Simulation** button in the top-right corner of the timeline header
3. The physics visualization page will load

## Physics Visualization Interface

### Main Components

#### 1. **3D Canvas (Left Side, 70%)**
- **Real-time visualization** of physics simulation
- **Colored geometries** - Color indicates energy level:
  - Blue: Low energy
  - Green: Medium energy  
  - Red: High energy
- **Wireframe spheres** - Wave emitters (pulsating)
  - Yellow: Light emitters
  - Red: Gravity emitters
  - Blue: Quantum emitters
- **Grid & Axes** - Spatial reference
- **White sphere** - Origin point at (0,0,0)

#### 2. **Control Panel (Right Side, 30%)**
Tabbed interface for:
- **Wave Emitters** - Create light, gravity, or quantum sources
- **Configuration** - Adjust physics engine parameters
- **Dimensional Coupling** - Control 3D↔4D interaction
- **Export** - Save/download simulation state

#### 3. **Top Controls**
- **⏸ Pause/Resume** - Pause physics simulation
- **🎥 Reset Camera** - Return to default view
- **🔄 Auto-rotate/Manual** - Toggle camera auto-rotation
- **📊 Show/Hide Stats** - Toggle statistics panel

#### 4. **Statistics Panel (Top-Right)**
- **Total Energy** - System kinetic + internal energy
- **Geometries** - Number of active 3D objects
- **Avg Intensity** - Average wave intensity
- **Interactions** - Number of wave interference events
- **Emitters** - Number of active wave sources
- **Coupling** - ON/OFF status of dimensional coupling

---

## Interaction Workflows

### Workflow 1: Create a Light Wave Emitter

1. Go to **Wave Emitters** tab
2. Click type dropdown and select **Light (Yellow)**
3. Adjust parameters using sliders:
   - **Frequency**: 5000 Hz (typical light)
   - **Amplitude**: 2.0 (wave height)
   - **Intensity**: 1.0 (brightness/power)
   - **Range**: 50 m (propagation distance)
4. Click **Create Emitter**
5. Watch geometries nearby react to light pressure waves
6. Emitter appears as **yellow pulsating sphere** at origin

### Workflow 2: Adjust Physics Configuration

1. Go to **Configuration** tab
2. Modify parameters:
   - **Gravity Strength**: Increase to make objects fall faster
   - **Damping**: Lower value = more energy loss
   - **Time Step**: Lower = more simulation accuracy
3. Changes apply immediately
4. Watch objects respond to new physics

### Workflow 3: Enable Dimensional Coupling

1. Go to **Dimensional Coupling** tab
2. Check **✓ Coupling Enabled**
3. Adjust **Coupling Strength** slider (0.0 to 1.0)
   - 0.0 = No coupling (3D and 4D separate)
   - 0.5 = Moderate coupling
   - 1.0 = Full coupling (strong 3D↔4D interaction)
4. Click **Apply Coupling Settings**
5. Observe:
   - Objects move differently based on 4D tensor field
   - Energy transfers between dimensions
   - Color changes reflect dimensional effects

### Workflow 4: Explore Different Emitter Types

**Light Emitters (Yellow)**
- Effect: Radiation pressure
- Force: I·A/r² (intensity decreases with distance²)
- Typical use: Pushing light objects, creating pressure

**Gravity Emitters (Red)**
- Effect: Attractive force
- Force: G·M·m/r² (inverse-square law)
- Typical use: Attracting all objects, creating orbits

**Quantum Emitters (Blue)**
- Effect: Wave function interference
- Force: cos(Δφ)·A₁·A₂ (depends on phase difference)
- Typical use: Creating constructive/destructive interference patterns

---

## Camera Controls

### Mouse/Trackpad
- **Drag (Left)**: Rotate view
- **Scroll**: Zoom in/out
- **Drag (Right)** or **Ctrl+Drag**: Pan

### Buttons
- **Reset Camera**: Return to default position (looking down at origin)
- **Auto-rotate**: Automatically rotate view (useful for demonstrations)

### Third-person Perspective
- Drag to rotate around the origin
- Objects move in the center of the view
- Grid provides spatial reference

---

## Statistics & Monitoring

### Real-time Metrics

**Total Energy**
- Sum of all kinetic energy in system
- Increases with object velocity and wave intensity
- Real-time indicator of system activity

**Geometries**
- Number of 3D objects in simulation
- Each geometry has position, velocity, rotation, energy

**Avg Intensity**
- Average wave function intensity across all objects
- High intensity = strong wave effects
- Low intensity = weak/no wave interaction

**Interactions**
- Counter of wave interference events per frame
- Increases when emitters hit objects
- Decreases if objects spread apart

**Emitters**
- Number of active wave sources
- Each emitter broadcasts waves

**Coupling**
- Shows if 3D↔4D coupling is active
- ON = Energy transferring between dimensions
- OFF = Dimensions independent

---

## Export & Save

### Export Physics State
1. Go to **Export** tab
2. Click **💾 Export Physics State**
3. Browser downloads: `physics-state-[timestamp].json`
4. Contains:
   - All active geometries (position, velocity, energy)
   - All tensor fields (4D state)
   - All wave emitters
   - Simulation settings
   - Statistics

### Clear Visualization
1. Go to **Export** tab
2. Click **🗑 Clear All Visualizations**
3. Removes all geometries and emitters from scene
4. Resets to clean state

---

## Common Scenarios

### Scenario 1: Watch Interference Patterns
1. Create 2 light emitters at different frequencies
2. Position geometries between them
3. Watch color changes as waves interfere
4. Constructive interference = bright colors
5. Destructive interference = dim colors

### Scenario 2: Simulate Gravity Well
1. Increase gravity strength to 0.5
2. Create a gravity emitter
3. Create some geometries nearby
4. Watch them orbit around the emitter
5. Adjust coupling to see 4D effects on orbits

### Scenario 3: Quantum Superposition
1. Create a quantum emitter
2. Set frequency to 1000 Hz
3. Create geometries in range
4. Watch them oscillate based on phase
5. Create second emitter to see interference

### Scenario 4: Cross-dimensional Energy Exchange
1. Enable dimensional coupling (strength 0.8)
2. Create a light emitter
3. Watch geometries accelerate
4. Toggle coupling ON/OFF to see difference
5. Increase coupling strength for more dramatic effects

---

## Tips & Tricks

### Performance Optimization
- Hide stats if you have 100+ geometries (reduces UI updates)
- Reduce simulator update frequency if laggy
- Use Manual camera mode (not auto-rotate) if CPU slow
- Close control panel to gain screen space

### Best Visualization
- Start with 1-2 emitters
- Add geometries one at a time
- Use mid-range frequency (3000-7000 Hz)
- Set amplitude 1.0-3.0 for visible effects
- Adjust coupling strength to 0.5 for balance

### Troubleshooting
- Objects not moving? Check gravity strength > 0 and emitters created
- Everything moving crazy? Reduce damping value
- Color not changing? Check emitter intensity is high enough
- Coupling not working? Enable it and check strength > 0

---

## Technical Details

### Physics Engine Running At
- ~60 FPS simulation updates
- 16ms timestep per frame
- Real-time broadcast to all connected clients

### Memory Usage
- ~1 MB per 100 geometries
- ~500 KB per 10 wave emitters
- Scalar tensor fields (4D state)

### Network
- ~5-10 KBps per client
- Updates sent every frame (~60/sec)
- Compressed when possible

### Capabilities
- Supports 500-1000+ geometries simultaneously
- Multiple wave emitters (10-50 typical)
- Real-time wave interference
- Relativistic effects (at high velocities)
- Full 3D↔4D coupling

---

## Back to Timeline

Click **← Back to Physics** button in top-left to return to timeline view.

---

## Next Steps

- Create wave emitters to simulate different physics
- Experiment with coupling strength
- Try different emitter types
- Export state and analyze data
- Combine with timeline categories for domain tracking

Enjoy exploring the physics simulation! 🚀
