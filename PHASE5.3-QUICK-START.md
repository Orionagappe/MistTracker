# Phase 5.3 Quick Start: Timeline Integration

**Objective:** Connect timeline item selection to automatic atom creation in physics engine

**Time Estimate:** 2-3 hours

---

## Overview

When user selects a timeline item, we need to:
1. Determine its atom type (H, C, N, O, etc.)
2. Get its electron configuration 
3. Register it in physics engine with electron clouds
4. Physics engine evolves its electrons at 60fps

---

## Step 1: Identify TimelineDetail.jsx Location

Find where timeline items are selected. Currently likely in something like:
- `client/src/components/TimelineDetail.jsx`
- `client/src/pages/TimelineDetail.jsx`
- `client/src/views/TimelineDetail.jsx`

Look for:
```javascript
onClick={() => selectItem(item)}
onSelect={(item) => ...}
const handleItemClick = (item) => ...
```

---

## Step 2: Add Import at Top of TimelineDetail.jsx

```javascript
import { getObjectPhysicsConfiguration } from '../utils/AtomTypeSystem.js';
```

---

## Step 3: Create Handler Function

```javascript
const handleItemSelectForPhysics = (item, categoryName) => {
  // Get physics configuration (atom type, electron clouds, etc.)
  const physicsConfig = getObjectPhysicsConfiguration({
    category: categoryName,
    item: item,
    metadata: item.metadata
  });

  // Only register if it's a recognized atom type
  if (physicsConfig && physicsConfig.atomType) {
    console.log(`Creating physics object: ${physicsConfig.atomType}`);
    
    // Send command to physics engine via WebSocket
    if (window.physicsSocket && window.physicsSocket.readyState === WebSocket.OPEN) {
      window.physicsSocket.send(JSON.stringify({
        type: 'registerAtom',
        data: physicsConfig
      }));
    }
  }
};
```

---

## Step 4: Wire Handlers to UI

In the item selection/click handler, add the physics registration:

```javascript
const handleItemClick = (item, categoryName) => {
  // Existing logic
  selectItem(item);
  showItemDetails(item);
  
  // NEW: Register in physics engine
  handleItemSelectForPhysics(item, categoryName);
};
```

---

## Step 5: Server-Side WebSocket Handler

In **server.js** or **websocket-protocol.js**, add handler for 'registerAtom':

```javascript
case 'registerAtom': {
  const atomConfig = message.data;
  const itemId = atomConfig.name + '-' + Date.now();
  
  physicsEngine.registerGeometry(
    itemId,
    {
      position: [0, 0, 0],        // Center of visualization
      mass: 1.0,                   // Normalized mass
      amplitude: 1.0,
      frequency: 440
    },
    atomConfig                     // Electron cloud config
  );
  
  console.log(`Physics: Registered ${atomConfig.name} as item ${itemId}`);
  break;
}
```

---

## Step 6: Verify Category Mapping Works

Check that your timeline category names match AtomTypeSystem expectations.

**Current Supported Categories:**
- 'Hydrogen' → 'H'
- 'Carbon' → 'C'
- 'Nitrogen' → 'N'
- 'Oxygen' → 'O'
- 'Fluorine' → 'F'
- 'Neon' → 'Ne'
- 'Lithium' → 'Li'
- 'Beryllium' → 'Be'
- 'Boron' → 'B'

If your timeline uses different names (e.g., "Hydrogen Atom", "C-12"), you can extend the mapping:

```javascript
// In AtomTypeSystem.js, add to CATEGORY_MAPPING:
register Category('Hydrogen Atom', 'H');
registerCategory('H-1', 'H');
registerCategory('Carbon Atom', 'C');
```

---

## Step 7: Connect to Physics Visualization

Modify **PhysicsPage.jsx** or **PhysicsVisualization.jsx** to display registered atoms:

```javascript
// In physics animation loop:
const updateVisualization = (simulationResult) => {
  // simulationResult.geometryUpdates includes all registered atoms
  // simulationResult.particleInteractions includes detected photons
  
  for (const geometry of simulationResult.geometryUpdates) {
    if (geometry.atomType) {
      // Render electron clouds at geometry.electronClouds[].position
      drawOrbitalCloud(geometry);
    }
  }
  
  // Draw emergent particles
  for (const interaction of simulationResult.particleInteractions) {
    drawPhoton(interaction);
  }
};
```

---

## Step 8: Testing Checklist

- [ ] Select hydrogen atom from timeline
- [ ] Physics engine receives 'registerAtom' message
- [ ] Geometry registered with electron clouds
- [ ] simulateStep() runs without errors
- [ ] particleInteractions returned (empty array if no waves yet)
- [ ] Select different atom type, verify correct electron config loads
- [ ] Multiple atoms from timeline can be registered simultaneously
- [ ] Electron clouds persist through multiple simulation frames

---

## Expected Behavior After Phase 5.3

1. **Timeline shows atoms:** Items labeled with element names (Hydrogen, Carbon, etc.)
2. **Click item:** Physics visualization updates to show that atom's electron clouds
3. **Automatic:** No manual wave emitters needed - physics engine handles quantum evolution
4. **Real-time:** Electron clouds visible updating at 60fps
5. **Isolated simulation:** Each timeline item is its own physics object

---

## Known Limitations Before Phase 5.4

- Electrons won't move yet (no wave-orbital interaction)
- No waves visible (need to create emitters from UI or hardcode)
- Particle interactions array will be empty
- Timeline objects won't affect each other

These are implemented in Phases 5.4-5.6.

---

## File Changes Summary

| File | Changes | Purpose |
|------|---------|---------|
| TimelineDetail.jsx | Add import, add handler | Trigger physics registration |
| server.js / websocket-protocol.js | Add case handler | Receive and register atoms |
| PhysicsPage.jsx | Optional: add visualization | Display electron clouds |

---

## Quick Reference

**AtomTypeSystem Functions:**
```javascript
getObjectPhysicsConfiguration(obj)     // Main function
getAtomType(symbol)                    // 'H' → config
getElectronConfiguration(Z)            // 1-10 → electron list
getOrbitalEnergy(n, Z)                 // Energy in eV
```

**Physics Engine:**
```javascript
registerGeometry(id, state, atomConfig)    // Register atom
simulateStep(dt)                            // Returns with particleInteractions
```

---

## Roll-Out Plan

**Phase 5.3 Recommended Flow:**

1. **Day 1:** Timeline integration + server-side handler (2-3 hours)
   - Get atoms showing in physics from timeline  
   - Verify electron clouds created correctly

2. **Verify:** Run full system + multiple timeline items (1 hour)
   - Check no performance degradation
   - Electron clouds stable at 60fps

3. **Polish:** UI refinements for visualization (optional, Phase 5.5)
   - Color code orbitals by type
   - Show atom names in 3D view

---

**Status:** Ready for Phase 5.3  
**Next Task:** Wire timeline → physics engine connection  
**Difficulty:** Moderate (mostly JavaScript event handling)  
**Testing:** Use browser console to verify WebSocket messages

