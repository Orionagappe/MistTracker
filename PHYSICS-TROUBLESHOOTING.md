# Physics System Troubleshooting Guide

## Phase 6.5: Comprehensive Error Resolution

This guide provides solutions for common issues encountered when using the MistTracker physics system.

---

## Table of Contents

1. [Connection Issues](#connection-issues)
2. [Atom Registration Issues](#atom-registration-issues)
3. [Visualization Issues](#visualization-issues)
4. [Performance Issues](#performance-issues)
5. [Physics Accuracy Issues](#physics-accuracy-issues)
6. [Error Messages](#error-messages)
7. [Debugging Tips](#debugging-tips)

---

## Connection Issues

### Problem: WebSocket Connection Fails

**Symptoms:**
- "WebSocket not ready for physics updates"
- Physics simulation doesn't start
- Connection timeouts after 30 seconds

**Solutions:**

1. **Check server is running:**
   ```bash
   npm run server
   # Should see: "✓ Physics engine initialized"
   ```

2. **Verify WebSocket URL:**
   ```javascript
   // Check in browser console
   console.log('WS_URL:', document.location.host);
   // Should be localhost:3000 in development
   ```

3. **Check firewall/proxy:**
   - WebSocket may be blocked by corporate firewall
   - Try: `ws://` (not `wss://`) for local development
   - Check browser console Network tab

4. **Verify JWT token valid:**
   ```javascript
   // In browser console
   const token = localStorage.getItem('authToken');
   console.log('Token:', token);
   // Should be non-empty JWT
   ```

5. **Enable retry with exponential backoff:**
   ```javascript
   // Already enabled automatically - check your network
   // Retries: 1000ms, 1500ms, 2250ms, etc.
   ```

**Error Message:** 
```
❌ Physics connection error - attempting to reconnect...
```

---

### Problem: Connection Drops After Loading Atoms

**Symptoms:**
- Connected initially
- Physics stops after ~10-30 seconds
- No clear error message

**Solutions:**

1. **Check for silent errors:**
   ```javascript
   // Open DevTools Console tab
   // Look for red error messages
   // Check for [Physics] warnings
   ```

2. **Verify atom data format:**
   ```javascript
   // Valid registration
   {
     atomType: 'H',        // H, He, C, N, O, F, Ne only
     atomId: 'atom-1',     // Must be unique
     position: [0, 0, 0]   // Must be array of 3 numbers
   }
   ```

3. **Check server logs:**
   ```bash
   # Terminal where server running
   # Look for: [ERROR] or [WARN] messages
   # Note any stack traces
   ```

4. **Try manual reconnect:**
   ```javascript
   // In console
   window.location.reload();
   // Closes old connection and reconnects
   ```

---

## Atom Registration Issues

### Problem: Atoms Don't Appear in Simulation

**Symptoms:**
- Atom registered (no error)
- PHYSICS_UPDATE arrives
- But atoms list is empty or atom not in list

**Solutions:**

1. **Check atom registration succeeded:**
   ```javascript
   // In browser console
   // After sending registerAtom message, wait for UPDATE
   // In PHYSICS_UPDATE message, check atoms array
   let foundAtom = message.data.atoms.find(a => a.atomId === 'atom-1');
   console.log('Atom found:', foundAtom);
   ```

2. **Verify atomId format:**
   ```javascript
   // atomId rules:
   // - No special characters (except -, _)
   // - Unique per simulation
   // - Not too long (< 100 chars)
   // ✓ Correct: 'atom-1', 'H_alpha', 'test-atom-123'
   // ✗ Wrong:   'atom@1', 'atom:1', 'atom 1'
   ```

3. **Check atom type valid:**
   ```javascript
   const validTypes = ['H', 'He', 'C', 'N', 'O', 'F', 'Ne'];
   console.log('H is valid:', validTypes.includes('H')); // true
   console.log('X is valid:', validTypes.includes('X')); // false
   ```

4. **Verify position coordinates:**
   ```javascript
   // Position must be [x, y, z] with valid numbers
   const pos = [0, 0, 0]; // ✓ Valid
   const bad = [0, 0];     // ✗ Missing z
   const bad2 = [0, 0, 'z']; // ✗ Not a number
   ```

---

### Problem: Atom Registration Fails After Retry

**Symptoms:**
- Toast shows: "Failed to register atom: WebSocket timeout"
- Retries happened (⏳ icon showed)
- Still failed

**Solutions:**

1. **Check WebSocket state:**
   ```javascript
   // In browser console during registration
   console.log('WS Ready?', ws.readyState === WebSocket.OPEN);
   // 0=CONNECTING, 1=OPEN, 2=CLOSING, 3=CLOSED
   ```

2. **Increase retry attempts:**
   ```javascript
   // In TimelineDetail.jsx handleRegisterAtomForPhysics()
   // Change: attemptRegistration(0, 3)  // 3 attempts
   // To: attemptRegistration(0, 5)      // 5 attempts
   ```

3. **Check server capacity:**
   ```bash
   # In server terminal
   # Look for: "Atom limit reached" or "Memory warning"
   # May need to unregister old atoms first
   ```

4. **Try manual registration:**
   ```javascript
   // In browser console
   ws.send(JSON.stringify({
     type: 'registerAtom',
     data: {
       atomType: 'H',
       atomId: `test-${Date.now()}`,
       position: [0, 0, 0],
       amplitude: 1.0
     }
   }));
   ```

---

## Visualization Issues

### Problem: 3D Scene Doesn't Render

**Symptoms:**
- Physics page opens but visualization area blank/black
- No error messages
- Controls work (fullscreen, panels toggle)

**Solutions:**

1. **Check Three.js loaded:**
   ```javascript
   // In browser console
   console.log('THREE:', window.THREE);
   // Should show THREE object with Mesh, Scene, etc.
   ```

2. **Verify WebGL support:**
   ```javascript
   const canvas = document.createElement('canvas');
   const glContext = canvas.getContext('webgl') || canvas.getContext('webgl2');
   console.log('WebGL supported:', !!glContext);
   ```

3. **Check scene initialization:**
   ```javascript
   // In browser console (if visible)
   console.log('Scene meshes:', window.threejsScene?.children.length);
   // Should be > 0 if atoms registered
   ```

4. **Try scene reset:**
   ```javascript
   // PhysicsVisualization component has reset button
   // Or refresh page: window.location.reload()
   ```

---

### Problem: Atoms Visible But Not Moving/Updating

**Symptoms:**
- Atoms visible in 3D scene
- Physics running (can see PHYSICS_UPDATE messages)
- But atoms don't animate/transform

**Solutions:**

1. **Check update callback:**
   ```javascript
   // usePhysics hook should apply transforms
   // If not, check applyGeometryPhysics() function
   // Verify mesh names match geometry.itemId
   ```

2. **Verify mesh references:**
   ```javascript
   // Mesh must be named correctly
   // Scene.getObjectByName(`geometry-${itemId}`)
   // Check console for "No mesh found for geometry..."
   ```

3. **Check position/rotation data:**
   ```javascript
   // In PHYSICS_UPDATE message
   message.geometryUpdates[0].position  // Should be [x, y, z]
   message.geometryUpdates[0].rotation  // Should be [rx, ry, rz]
   ```

---

## Performance Issues

### Problem: Low Frame Rate / Stuttering

**Symptoms:**
- Simulation runs but animation choppy (<30 FPS)
- High CPU usage
- Fans spinning loudly

**Solutions:**

1. **Reduce particle count:**
   ```javascript
   // Physics settings → Reduce emitter amplitude
   // Lower amplitude = fewer particles generated
   // Check: "Particles: XXX" in control panel
   ```

2. **Disable visualizations:**
   ```javascript
   // In PhysicsPage options
   options={{ enableVisualization: false }}
   // Physics simulation still runs, just not rendered
   ```

3. **Reduce simulation resolution:**
   ```javascript
   // In usePhysics hook options
   options={{ tensorFieldResolution: 16 }} // Default 32
   ```

4. **Enable mesh pooling:**
   ```javascript
   // Already enabled automatically
   // Check performance: Console → Performance tab
   // Record 10 seconds, check for GC pauses
   ```

5. **Update graphics driver:**
   - Go to GPU manufacturer website
   - Download latest driver
   - Restart computer
   - Test again

---

### Problem: Memory Leak / Growing Memory Usage

**Symptoms:**
- Memory usage increases continuously
- Eventually crashes with "out of memory"
- Browser gets slower over time

**Solutions:**

1. **Check mesh cleanup:**
   ```javascript
   // Meshes should be disposed when atoms unregistered
   // Verify: ParticleVisualizer.dispose() called on unmount
   ```

2. **Monitor object count:**
   ```javascript
   // In browser DevTools
   // Ctrl+Shift+J → Performance → Allocations
   // Record 30 seconds
   // Should see stable memory usage
   ```

3. **Manual cleanup:**
   ```javascript
   // Force garbage collection (not recommended)
   if (window.gc) window.gc(); // Only works in Chrome dev mode
   ```

4. **Check for event listener leaks:**
   ```javascript
   // All effects should cleanup
   // useEffect(() => { ... return () => cleanup(); }, [deps])
   // Missing cleanup = memory leak
   ```

---

## Physics Accuracy Issues

### Problem: Particles Not Generated

**Symptoms:**
- Atoms registered and visible
- Wave emitter active
- But particles.length === 0 in PHYSICS_UPDATE

**Solutions:**

1. **Check resonance frequency:**
   ```javascript
   // H atom resonates at 6-8 kHz
   // H atom doesn't resonate at 100 Hz
   // Try: frequency = 7000 for H atoms
   ```

2. **Increase emitter amplitude:**
   ```javascript
   // Particles only generated above threshold
   // Try: amplitude: 1.0 (max is 1.2)
   // More amplitude = more particles
   ```

3. **Check atom proximity:**
   ```javascript
   // Particles generated near emitter
   // Atom must be within ~100 units of emitter
   // Check physics_update distances
   ```

4. **Verify coupling enabled:**
   ```javascript
   // 4D coupling affects particle generation rate
   // Try: enabled: true in setDimensionalCoupling
   ```

---

### Problem: Wave Doesn't Propagate to Distant Atoms

**Symptoms:**
- Wave at source (0, 0, 0) works fine
- Atom at distance gets no wave intensity
- Particles only generate at one location

**Solutions:**

1. **Check 4D coupling:**
   ```javascript
   // Disable coupling for 3D-only propagation
   { enabled: false, coupling4D: false }
   // Then enable for 4D metric tensor propagation
   { enabled: true, coupling4D: true }
   ```

2. **Verify spacetime metric:**
   ```javascript
   // 4D propagation uses metric tensor
   // Should see amplitude falloff with distance
   // Check: physics_update.data.spacetimeMetric
   ```

3. **Check distance too large:**
   ```javascript
   // Default propagation range ~200 units
   // Try atoms closer: |distance| < 150 units
   // Can increase with coupling4D enabled
   ```

---

## Error Messages

### "Failed to register atom: WebSocket not available after 3 attempts"

**Cause:** WebSocket disconnected during retry  
**Solution:** Reload page, check server running

### "Invalid atomType: X"

**Cause:** Unknown atom element  
**Solution:** Use H, He, C, N, O, F, or Ne only

### "Duplicate atom registration: atom-1"

**Cause:** Tried to register same atomId twice  
**Solution:** Unregister old atom first or use new atomId

### "Physics update handler error"

**Cause:** Error while processing PHYSICS_UPDATE message  
**Solution:** Check browser console for full error, may be corrupted data

### "Geometry physics application error"

**Cause:** Error applying 3D transform to mesh  
**Solution:** Usually non-fatal, animation may skip frames

---

## Debugging Tips

### Enable Verbose Logging

```javascript
// In browser console
window.DEBUG_PHYSICS = true;

// In files:
if (window.DEBUG_PHYSICS) {
  console.log('[Physics Debug]', message);
}
```

### Monitor Performance

```javascript
// In browser console
const perf = window.performanceMonitor;
console.log(perf.getSummary());
// Shows: count, totalMs, avgMs, minMs, maxMs for each operation
```

### Inspect Error History

```javascript
// In browser console
const errors = window.errorHandler.getHistory();
console.table(errors);
// Shows last 100 errors with timestamps and context
```

### Test WebSocket Connection

```javascript
// In browser console
const ws = new WebSocket('ws://localhost:3000?token=test-token');
ws.onopen = () => console.log('Connected!');
ws.onerror = (e) => console.error('Error:', e);
ws.onmessage = (e) => console.log('Message:', e.data);
```

### Profile Physics Updates

```javascript
// In usePhysics.js add before handlePhysicsUpdate
const start = performance.now();
// ... handle update ...
const duration = performance.now() - start;
console.log(`Update took ${duration.toFixed(2)}ms`);
```

### Check Memory Usage

```javascript
// In browser console (performance tab)
const memory = performance.memory;
console.log(`
  Heap used: ${(memory.usedJSHeapSize / 1e6).toFixed(1)} MB
  Heap limit: ${(memory.jsHeapSizeLimit / 1e6).toFixed(1)} MB
  Usage: ${((memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100).toFixed(1)}%
`);
```

---

## Support & Reporting Issues

If you encounter an issue not covered here:

1. **Collect information:**
   - Browser type and version
   - Error messages from console
   - Steps to reproduce
   - Screenshot/video if applicable

2. **Check error history:**
   ```javascript
   const errors = window.errorHandler.getHistory();
   console.log(JSON.stringify(errors, null, 2));
   // Copy and include in bug report
   ```

3. **Report to development team:**
   - Create issue in GitHub/Jira
   - Include: browser, OS, error history, steps to reproduce
   - Attach console logs and screenshots

---

## Performance Benchmarks

Target metrics for physics system:

| Metric | Target | Acceptable | Poor |
|--------|--------|-----------|------|
| Frame Rate | 60 FPS | 45+ FPS | <30 FPS |
| Physics Update | <17ms | <20ms | >30ms |
| WebSocket Latency | <50ms | <100ms | >200ms |
| Memory Usage | <100 MB | <200 MB | >300 MB |
| Atom Capacity | 50+ | 20+ | <10 |
| Particle Capacity | 10,000+ | 5,000+ | <1,000 |

---

## Frequently Asked Questions

**Q: Can I run physics without visualization?**  
A: Yes, set `enableVisualization: false` in options. Physics runs server-side regardless.

**Q: What's the maximum atoms I can simulate?**  
A: Depends on hardware - typically 50-200 atoms before performance degrades.

**Q: Can I save/load atom configurations?**  
A: Yes, use `defaultTimelineGenerator.exportAsJSON()` to save, then reload.

**Q: Why does my simulation crash on mobile?**  
A: Mobile devices have less GPU memory. Use low particle count and disable visualization.

**Q: How do I increase simulation speed?**  
A: Physics run at fixed 60 FPS - can't speed up without changing engine code.
