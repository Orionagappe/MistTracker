# GEOMETRY-QUICK-START.md

## 3D Geometry Visualization - Quick Start Guide

### 1. Basic Setup (Server)

```javascript
import { GeometryHandler } from './MistGeometry.js';

// Initialize
const geometryHandler = new GeometryHandler();

// Create a geometry
const sphere = geometryHandler.createGeometry(
  'My Sphere',
  'sphere',
  {
    vertices: [0, 0, 0],
    indices: [0]
  },
  {
    position: [0, 0, 0],
    color: [1, 0, 0],
    userId: 'user-123'
  }
);

console.log(sphere.id); // Unique geometry ID
```

### 2. WebSocket Integration (Client → Server)

```javascript
const ws = new WebSocket('ws://localhost:3000?token=' + token);

// Create geometry
ws.send(JSON.stringify({
  type: 'geometry-create',
  name: 'Test Cube',
  geometryType: 'cube',
  data: {
    vertices: [-1, -1, -1, 1, 1, 1],
    indices: [0, 1]
  },
  properties: {
    position: [5, 0, 0],
    color: [0, 1, 0]
  }
}));

// Update geometry
ws.send(JSON.stringify({
  type: 'geometry-update',
  geometryId: 'existing-id',
  properties: {
    position: [10, 5, 3],
    color: [0, 0, 1]
  }
}));

// Query geometries
ws.send(JSON.stringify({
  type: 'geometry-query',
  geometryType: 'sphere',
  limit: 50
}));

// Delete geometry
ws.send(JSON.stringify({
  type: 'geometry-delete',
  geometryId: 'existing-id'
}));
```

### 3. Client Visualization

```javascript
import ClientGeometryVisualizer from './client-geometry-visualization.js';

// Initialize visualizer
const visualizer = new ClientGeometryVisualizer('geometry-canvas');

// Start rendering
visualizer.start();

// Handle incoming geometry
ws.onmessage = (event) => {
  const message = JSON.parse(event.data);
  
  switch (message.type) {
    case 'geometry-create':
      // Received broadcast of new geometry
      visualizer.addGeometry(message);
      break;
      
    case 'geometry-update':
      // Received broadcast of updated geometry
      visualizer.updateGeometry(message.geometryId, {
        transform: message.properties,
        material: message.properties
      });
      break;
      
    case 'geometry-delete':
      // Received broadcast of deletion
      visualizer.removeGeometry(message.geometryId);
      break;
      
    case 'geometry-query':
      // Query results
      message.results.forEach(geom => 
        visualizer.addGeometry(geom)
      );
      break;
  }
};

// Stop rendering when done
visualizer.stop();
```

### 4. Geometry Types

**Sphere**
```javascript
geometryHandler.createGeometry(
  'Sphere',
  'sphere',
  { vertices: [0, 0, 0] },
  { position: [0, 0, 0], scale: [1, 1, 1] }
);
```

**Cube**
```javascript
geometryHandler.createGeometry(
  'Cube',
  'cube',
  { vertices: [-1, -1, -1, 1, 1, 1] },
  { position: [0, 0, 0], scale: [1, 1, 1] }
);
```

**Cylinder**
```javascript
geometryHandler.createGeometry(
  'Cylinder',
  'cylinder',
  { vertices: [0, 0, -1, 0, 1, 1] },
  { position: [0, 0, 0], scale: [1, 2, 1] }
);
```

**Custom Mesh**
```javascript
geometryHandler.createGeometry(
  'Custom Mesh',
  'mesh',
  {
    vertices: [
      0, 0, 0,      // v1
      1, 0, 0,      // v2
      0, 1, 0       // v3
    ],
    indices: [0, 1, 2],
    normals: [0, 0, 1, 0, 0, 1, 0, 0, 1]
  },
  { position: [0, 0, 0] }
);
```

### 5. Common Queries

**Query all spheres**
```javascript
const spheres = geometryHandler.queryGeometries({
  geometryType: 'sphere'
});
```

**Query in region**
```javascript
const regionGeometries = geometryHandler.queryGeometries({
  bounds: {
    min: [0, 0, 0],
    max: [100, 100, 100]
  }
});
```

**Query by tags**
```javascript
const physics = geometryHandler.queryGeometries({
  properties: { tags: ['physics', 'origin'] }
});
```

**Query user's geometries**
```javascript
const userGeoms = geometryHandler.getUserGeometries('user-123');
```

### 6. Material Properties

```javascript
{
  color: [1, 0, 0],           // RGB: [0-1, 0-1, 0-1]
  metallic: 0.5,              // [0-1] 0=matte, 1=metallic
  roughness: 0.5,             // [0-1] 0=smooth, 1=rough
  emissive: [0.1, 0, 0]       // RGB emission color
}
```

### 7. Transform Properties

```javascript
{
  position: [0, 0, 0],        // [x, y, z] world position
  rotation: [0, 0, 0],        // [x, y, z] Euler angles (radians)
  scale: [1, 1, 1]            // [sx, sy, sz] scale factors
}
```

### 8. Collision Detection

```javascript
const collides = geometryHandler.checkCollision(geomId1, geomId2);
if (collides) {
  console.log('Objects colliding!');
}
```

### 9. Performance Tips

- **Use Spatial Queries**: Instead of `queryGeometries({})`, use bounds
- **Limit Results**: Add `limit: 100` to queries
- **Tag Organization**: Use tags for efficient filtering
- **Batch Updates**: Group updates into single messages
- **Visible Only**: Use `visibleOnly: true` to skip hidden geometries

### 10. Debugging

```javascript
// Get all statistics
const stats = geometryHandler.getStatistics();
console.log(`Total: ${stats.totalGeometries}`);
console.log(`Zones: ${stats.spatialZones}`);

// Get single geometry
const geom = geometryHandler.getGeometry(geometryId);
console.log(geom.transform.position);

// Take screenshot (client-side)
const screenshot = visualizer.takeScreenshot();
// Download or send screenshot...
```

### 11. Error Handling

```javascript
try {
  geometryHandler.createGeometry('Test', 'sphere', {});
} catch (err) {
  console.error('Creation failed:', err.message);
  // Handle error appropriately
}

// WebSocket errors
ws.onerror = (event) => {
  console.error('WebSocket error:', event);
};

// Server sends error message
if (message.type === 'error') {
  console.error('Server error:', message.error);
}
```

### 12. Real-time Example: Collaborative Drawing

```javascript
// User 1: Create and update
const geom = geometryHandler.createGeometry(
  'Shared Object',
  'cube',
  { vertices: [-1, -1, -1, 1, 1, 1] },
  { position: [0, 0, 0] }
);

// Broadcast via WebSocket
ws.send(JSON.stringify({
  type: 'geometry-create',
  name: geom.name,
  geometryType: geom.type,
  data: geom.data,
  properties: Object.assign({}, geom.transform, geom.material)
}));

// User 2: Receives and renders instantly
// (handled by WebSocket onmessage handler)

// User 1: Updates position
geometryHandler.updateGeometry(geom.id, null, {
  position: [5, 5, 5]
});

// Broadcast update
ws.send(JSON.stringify({
  type: 'geometry-update',
  geometryId: geom.id,
  properties: { position: [5, 5, 5] }
}));

// User 2: Updates rendered object instantly
```

### 13. Testing Your Integration

```bash
# Run comprehensive test suite
node test-geometry-visualization.js

# Expected output:
# ✓ All geometry visualization tests completed!
```

---

## Architecture

```
┌─────────────┐
│  Client UI  │  User creates/edits geometries
└──────┬──────┘
       │
       ▼
┌──────────────────────────┐
│ ClientGeometryVisualizer │  Three.js rendering
└──────┬───────────────────┘
       │
       ▼
┌─────────────────┐
│  WebSocket      │  Broadcast messages
└──────┬──────────┘
       │
       ▼
┌──────────────────────┐
│  server.js handlers  │  Process messages
└──────┬───────────────┘
       │
       ▼
┌──────────────────┐
│ MistGeometry.js  │  Store, query, delete
└──────────────────┘
```

---

## Message Flow Example

```
Create Cube:
Client → GEOMETRY_CREATE → Server → [Create in handler]
                                  → [Broadcast to all clients]
                                  → All Clients → Render

Update Position:
Client → GEOMETRY_UPDATE → Server → [Update in handler]
                                  → [Broadcast to all clients]
                                  → All Clients → Update render

Delete:
Client → GEOMETRY_DELETE → Server → [Delete from handler]
                                  → [Broadcast to all clients]
                                  → All Clients → Remove render
```

---

## Troubleshooting

**Geometry not rendering?**
- Check Three.js loaded: `console.log(window.THREE)`
- Verify canvas: `document.getElementById('geometry-canvas')`
- Call `visualizer.start()`
- Check browser WebGL support

**WebSocket not working?**
- Verify JWT token valid
- Check server console for errors
- Ensure message type is correct
- Check network tab in DevTools

**Performance issues?**
- Reduce geometry vertex count
- Use spatial queries with bounds
- Check GPU utilization
- Monitor network bandwidth

---

## Next Steps

1. Integrate into existing UI
2. Add transform gizmos for user interaction
3. Connect to database for persistence
4. Add physics simulation
5. Implement mesh editing tools

---

For detailed API documentation, see: MistGeometry.markdown
