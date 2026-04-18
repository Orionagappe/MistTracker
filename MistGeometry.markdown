# MistTracker Phase 4: 3D Geometry Visualization

## Overview

Phase 4 introduces comprehensive 3D geometry visualization capabilities to MistTracker, enabling real-time collaborative visualization of geometric objects in a WebGL-powered 3D environment. This system integrates with the existing conflict resolution, P2P collaboration, and provenance tracking systems.

## Architecture

### Components

1. **MistGeometry.js** (Server-side)
   - Geometry creation, update, deletion, and querying
   - Spatial indexing for efficient queries
   - Collision detection
   - Type-based and user-based indexing
   - Bounding box calculations

2. **client-geometry-visualization.js** (Client-side)
   - Three.js-based renderer
   - Real-time scene updates
   - Material and transform handling
   - Lighting and grid visualization

3. **server.js Integration**
   - WebSocket message handlers for geometry operations
   - Broadcast to all connected clients
   - Provenance tracking for all geometry changes
   - Rate limiting and conflict detection

4. **websocket-protocol.js**
   - Message type definitions (GEOMETRY_CREATE, GEOMETRY_UPDATE, GEOMETRY_DELETE, GEOMETRY_QUERY)
   - Protocol validation

## Message Types

### GEOMETRY_CREATE
Creates a new 3D geometry object.

**Request:**
```json
{
  "type": "geometry-create",
  "name": "My Geometry",
  "geometryType": "sphere|cube|cylinder|mesh|custom",
  "data": {
    "vertices": [number],
    "indices": [number],
    "normals": [number],
    "colors": [number],
    "texCoords": [number]
  },
  "properties": {
    "position": [x, y, z],
    "rotation": [x, y, z],
    "scale": [sx, sy, sz],
    "color": [r, g, b],
    "metallic": 0.5,
    "roughness": 0.5,
    "emissive": [r, g, b],
    "userId": "user-id",
    "tags": ["tag1", "tag2"],
    "visible": true,
    "locked": false
  }
}
```

**Response:**
```json
{
  "type": "geometry-create",
  "geometryId": "unique-id",
  "name": "My Geometry",
  "geometryType": "sphere",
  "timestamp": 1234567890
}
```

### GEOMETRY_UPDATE
Updates an existing geometry.

**Request:**
```json
{
  "type": "geometry-update",
  "geometryId": "existing-id",
  "data": {
    "vertices": [number],
    "indices": [number]
  },
  "properties": {
    "position": [x, y, z],
    "rotation": [x, y, z],
    "color": [r, g, b],
    "metallic": 0.5,
    "tags": ["tag1", "tag2"],
    "visible": true
  }
}
```

**Response:**
```json
{
  "type": "ack",
  "messageType": "geometry-update",
  "geometryId": "existing-id",
  "timestamp": 1234567890
}
```

### GEOMETRY_QUERY
Query geometries with filters.

**Request:**
```json
{
  "type": "geometry-query",
  "queryId": "query-123",
  "geometryType": "sphere",
  "bounds": {
    "min": [x1, y1, z1],
    "max": [x2, y2, z2]
  },
  "properties": {
    "tags": ["physics", "origin"]
  },
  "visibleOnly": true,
  "limit": 100
}
```

**Response:**
```json
{
  "type": "geometry-query",
  "queryId": "query-123",
  "results": [
    {
      "id": "geom-id",
      "name": "Geometry Name",
      "type": "sphere",
      "transform": {
        "position": [x, y, z],
        "rotation": [x, y, z],
        "scale": [sx, sy, sz]
      },
      "material": {
        "color": [r, g, b],
        "metallic": 0.5,
        "roughness": 0.5
      },
      "metadata": {
        "createdAt": 1234567890,
        "userId": "user-id",
        "tags": ["tag1"]
      }
    }
  ],
  "count": 42,
  "timestamp": 1234567890
}
```

### GEOMETRY_DELETE
Delete a geometry.

**Request:**
```json
{
  "type": "geometry-delete",
  "geometryId": "id-to-delete"
}
```

**Response:**
```json
{
  "type": "ack",
  "messageType": "geometry-delete",
  "geometryId": "id-to-delete",
  "timestamp": 1234567890
}
```

## GeometryHandler API

### Constructor
```javascript
const handler = new GeometryHandler();
```

### Methods

#### createGeometry(name, geometryType, data, properties)
Creates a new geometry and returns the geometry object with unique ID.

```javascript
const geom = handler.createGeometry(
  'My Sphere',
  'sphere',
  { vertices: [0, 0, 0], indices: [0] },
  {
    position: [1, 2, 3],
    color: [1, 0, 0],
    userId: 'user-123',
    tags: ['physics']
  }
);
```

#### updateGeometry(geometryId, data, properties)
Updates an existing geometry's data and properties.

```javascript
handler.updateGeometry(geometryId, 
  { vertices: [...] },
  { position: [1, 2, 3], color: [0, 1, 0] }
);
```

#### queryGeometries(query)
Query geometries with filters.

```javascript
const results = handler.queryGeometries({
  geometryType: 'sphere',
  bounds: { min: [0, 0, 0], max: [100, 100, 100] },
  properties: { tags: ['physics'] },
  visibleOnly: true,
  limit: 100
});
```

#### deleteGeometry(geometryId)
Delete a geometry.

```javascript
handler.deleteGeometry(geometryId);
```

#### getGeometry(geometryId)
Get geometry by ID.

```javascript
const geom = handler.getGeometry(geometryId);
```

#### getUserGeometries(userId)
Get all geometries created by a user.

```javascript
const userGeoms = handler.getUserGeometries('user-123');
```

#### queryByZone(x, y, z)
Spatial query by zone.

```javascript
const zoneGeoms = handler.queryByZone(50, 50, 50);
```

#### checkCollision(geomId1, geomId2)
Check collision between two geometries.

```javascript
const collides = handler.checkCollision(geomId1, geomId2);
```

## ClientGeometryVisualizer API

### Constructor
```javascript
import ClientGeometryVisualizer from './client-geometry-visualization.js';

const visualizer = new ClientGeometryVisualizer('geometry-canvas', {
  width: 1920,
  height: 1080,
  backgroundColor: 0x1a1a1a,
  gridSize: 100,
  showGrid: true
});
```

### Methods

#### start()
Start the rendering loop.

```javascript
visualizer.start();
```

#### stop()
Stop the rendering loop.

```javascript
visualizer.stop();
```

#### addGeometry(geometry)
Add a geometry to the scene.

```javascript
visualizer.addGeometry({
  id: 'geom-123',
  name: 'My Sphere',
  type: 'sphere',
  transform: {
    position: [0, 0, 0],
    rotation: [0, 0, 0],
    scale: [1, 1, 1]
  },
  material: {
    color: [1, 0, 0],
    metallic: 0.5,
    roughness: 0.5
  }
});
```

#### updateGeometry(geometryId, updates)
Update a geometry in the scene.

```javascript
visualizer.updateGeometry(geometryId, {
  transform: { position: [1, 2, 3] },
  material: { color: [0, 1, 0] },
  visible: true
});
```

#### removeGeometry(geometryId)
Remove a geometry from the scene.

```javascript
visualizer.removeGeometry(geometryId);
```

#### clear()
Clear all geometries.

```javascript
visualizer.clear();
```

#### getGeometries()
Get all geometries in the scene.

```javascript
const geoms = visualizer.getGeometries();
```

#### takeScreenshot()
Take a screenshot of the current scene.

```javascript
const dataUrl = visualizer.takeScreenshot();
```

## Usage Examples

### Example 1: Create and Visualize a Geometry

```javascript
// On server
const handler = new GeometryHandler();
const geometry = handler.createGeometry(
  'Origin Sphere',
  'sphere',
  { vertices: [0, 0, 0] },
  {
    position: [0, 0, 0],
    color: [1, 0, 0],
    tags: ['physics', 'origin']
  }
);

// Broadcast to clients via WebSocket
// On client
visualizer.addGeometry(geometry);
```

### Example 2: Real-time Collaboration

```javascript
// User 1 creates a geometry
websocket.send(JSON.stringify({
  type: 'geometry-create',
  name: 'Shared Object',
  geometryType: 'cube',
  data: { vertices: [-1, -1, -1, 1, 1, 1] },
  properties: { position: [0, 0, 0] }
}));

// AutoServer broadcasts to User 2
// User 2's client receives and renders instantly
visualizer.addGeometry(incomingGeometry);
```

### Example 3: Spatial Query

```javascript
// Query all geometries in a region
const results = handler.queryGeometries({
  bounds: {
    min: [0, 0, 0],
    max: [100, 100, 100]
  },
  visibleOnly: true
});

// Display results on client
results.forEach(geom => visualizer.addGeometry(geom));
```

## Integration with Conflict Resolution

All geometry operations are automatically tracked by the provenance system and integrated with conflict resolution:

```javascript
// Record geometry creation
provenanceTracker.recordAction(
  'GEOMETRY_CREATE',
  userId,
  sessionToken,
  { geometryId: geom.id, geometryType: geom.type }
);

// Conflicts detected if multiple users modify same geometry
const conflictResult = conflictHandler.handleMutation({
  itemId: geometryId,
  userId: userId,
  action: 'update',
  timestamp: Date.now()
});
```

## Performance Considerations

- **Spatial Indexing**: Geometries are automatically indexed by spatial zone (100-unit zones) for O(1) zone queries
- **Type Indexing**: Fast filtering by geometry type
- **User Indexing**: Quick retrieval of user-created geometries
- **Collision Detection**: Uses bounding sphere approximation for fast broad-phase detection
- **WebSocket Broadcasting**: Efficient message serialization and transmission

## Testing

Run the test suite:

```bash
node test-geometry-visualization.js
```

Expected output:
- ✓ Geometry creation for all types
- ✓ Geometry updates and property changes
- ✓ Query filtering by type, bounds, tags
- ✓ Collision detection
- ✓ Spatial indexing
- ✓ Deletion and cleanup

## Future Enhancements

1. **Physics Engine Integration**
   - Rigid body dynamics
   - Gravity and forces
   - Joint constraints

2. **Advanced Materials**
   - PBR (Physically-Based Rendering)
   - Texture mapping
   - Normal maps

3. **Geometric Operations**
   - Boolean operations (union, intersection, difference)
   - Mesh simplification
   - UV unwrapping

4. **Collaborative Features**
   - Shared transform gizmos
   - Real-time animation playback
   - Measurement tools

5. **Data Persistence**
   - Scene snapshots
   - Geometry serialization
   - Undo/redo stack

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                         MistTracker                          │
│                     Phase 4: Geometry                        │
└─────────────────────────────────────────────────────────────┘

     ┌─────────────────────────────────────────────────────┐
     │              WebSocket Protocol                      │
     │  GEOMETRY_CREATE | UPDATE | QUERY | DELETE          │
     └─────────────────────────────────────────────────────┘
                 ↑                    ↑
       ┌─────────┴─────────┐ ┌──────┴──────────┐
       │                   │ │                  │
  ┌────▼────────┐   ┌─────▼──────┐    ┌──────▼─────┐
  │ MistGeometry│   │   Server    │    │  Conflict  │
  │ (Server)    │   │ Integration │    │ Resolution │
  └────┬────────┘   └─────┬──────┘    └──────┬─────┘
       │                  │                    │
       └──────────┬───────┴────────────────────┘
                  │
      ┌───────────▼────────────┐
      │   WebSocket Broadcast   │
      └───────────┬────────────┘
                  │
      ┌───────────▼─────────────────┐
      │ ClientGeometryVisualizer    │
      │ (Three.js Renderer)          │
      └───────────┬─────────────────┘
                  │
      ┌───────────▼──────┐
      │  3D Scene Render  │
      │  (WebGL Canvas)   │
      └───────────────────┘
```

## Security Considerations

- **Rate Limiting**: All geometry operations subject to rate limiting (50 KB/s per user)
- **Authentication**: Requires valid JWT token
- **Provenance Tracking**: All modifications tracked with user ID and timestamp
- **Spatial Validation**: Bounds checks prevent extreme values
- **Material Validation**: Color and metallic values clamped to valid ranges

## Troubleshooting

### Geometries Not Rendering
- Check that Three.js is loaded: `window.THREE` should exist
- Verify canvas element exists: `document.getElementById('geometry-canvas')`
- Ensure visualizer.start() has been called
- Check browser console for Three.js errors

### WebSocket Messages Not Received
- Verify WebSocket connection is established
- Check server console for message processing logs
- Verify message types match MessageTypes constants
- Check JWT token validity

### Poor Performance
- Reduce number of vertices in custom geometries
- Use spatial queries instead of getAllGeometries()
- Enable browser hardware acceleration
- Consider reducing shadow map resolution

## References

- Three.js Documentation: https://threejs.org/docs/
- WebGL Specifications: https://www.khronos.org/webgl/
- MistTracker Architecture: see MistCore.markdown
- WebSocket Protocol: see websocket-protocol.js
