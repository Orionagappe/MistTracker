// geometry-handler.js
// Converts items and mutations into 3D geometry with 4D tensor space visualization

export class GeometryHandler {
  constructor() {
    this.geometries = new Map(); // itemId -> 3D geometry
    this.tensorSpace = new Map(); // itemId -> 4D tensor properties
    this.collisionSpaces = new Map(); // itemId -> collision bounds
    this.geometryHistory = []; // Audit trail of changes
    this.sceneState = {
      items: [],
      mutations: [],
      tensorFields: []
    };
  }

  /**
   * Create 3D geometry for an item
   * Handles different item types with appropriate primitives
   */
  createGeometry(itemId, itemData = {}) {
    const {
      type = 'box',
      position = { x: 0, y: 0, z: 0 },
      scale = { x: 1, y: 1, z: 1 },
      rotation = { x: 0, y: 0, z: 0 },
      color = '#FF6B6B',
      label = null, // NEW: Optional text label for the geometry
      properties = {}
    } = itemData;

    // Create base geometry
    let geometry = null;
    let bounds = null;

    switch (type) {
      case 'box':
        geometry = this.createBoxGeometry(scale);
        bounds = this.createBoxBounds(position, scale);
        break;
      case 'sphere':
        geometry = this.createSphereGeometry(scale);
        bounds = this.createSphereBounds(position, scale);
        break;
      case 'cylinder':
        geometry = this.createCylinderGeometry(scale);
        bounds = this.createCylinderBounds(position, scale);
        break;
      case 'cone':
        geometry = this.createConeGeometry(scale);
        bounds = this.createConeBounds(position, scale);
        break;
      default:
        geometry = this.createBoxGeometry(scale);
        bounds = this.createBoxBounds(position, scale);
    }

    const geometryData = {
      itemId,
      type,
      position,
      rotation,
      scale,
      color,
      label, // NEW: Include text label in geometry data
      geometry,
      bounds,
      properties,
      createdAt: Date.now(),
      updatedAt: Date.now()
    };

    this.geometries.set(itemId, geometryData);
    this.collisionSpaces.set(itemId, bounds);

    // Log change
    this.geometryHistory.push({
      itemId,
      action: 'CREATE_GEOMETRY',
      type,
      timestamp: Date.now()
    });

    return geometryData;
  }

  /**
   * Create 4D tensor space for item
   * Maps extra dimensions as tensor properties
   */
  createTensorSpace(itemId, tensorData = {}) {
    const {
      dimension0 = 0,    // First additional dimension
      dimension1 = 0,    // Second additional dimension
      intensity = 1.0,   // Field intensity
      frequency = 1.0,   // Oscillation frequency
      phase = 0.0        // Phase offset
    } = tensorData;

    const tensorSpace = {
      itemId,
      d0: dimension0,
      d1: dimension1,
      intensity,
      frequency,
      phase,
      createdAt: Date.now(),
      color: this.getTensorColor(dimension0, dimension1)
    };

    this.tensorSpace.set(itemId, tensorSpace);

    this.geometryHistory.push({
      itemId,
      action: 'CREATE_TENSOR',
      dimensions: [dimension0, dimension1],
      timestamp: Date.now()
    });

    return tensorSpace;
  }

  /**
   * Get color based on 4D tensor values
   * Uses color mapping to visualize higher dimensions
   */
  getTensorColor(d0, d1) {
    // Map 4D values to RGB color space
    const r = Math.max(0, Math.min(255, (d0 + 1) * 127));
    const g = Math.max(0, Math.min(255, (d1 + 1) * 127));
    const b = Math.max(0, Math.min(255, ((d0 + d1) / 2 + 1) * 127));

    return {
      r: Math.round(r),
      g: Math.round(g),
      b: Math.round(b),
      hex: `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`
    };
  }

  /**
   * Update geometry based on mutation
   */
  updateGeometryFromMutation(itemId, mutation) {
    const geometry = this.geometries.get(itemId);
    if (!geometry) {
      throw new Error(`Geometry not found for item ${itemId}`);
    }

    const { action, value } = mutation;

    switch (action) {
      case 'update':
      case 'modify':
        // Update position
        if (value.x !== undefined) geometry.position.x = value.x;
        if (value.y !== undefined) geometry.position.y = value.y;
        if (value.z !== undefined) geometry.position.z = value.z;
        break;

      case 'scale':
      case 'resize':
        // Update scale
        if (value.scaleX !== undefined) geometry.scale.x = value.scaleX;
        if (value.scaleY !== undefined) geometry.scale.y = value.scaleY;
        if (value.scaleZ !== undefined) geometry.scale.z = value.scaleZ;
        // Recalculate bounds
        this.collisionSpaces.set(itemId, this.createBoundingBox(geometry.position, geometry.scale));
        break;

      case 'rotate':
      case 'rotation':
        // Update rotation
        if (value.x !== undefined) geometry.rotation.x = value.x;
        if (value.y !== undefined) geometry.rotation.y = value.y;
        if (value.z !== undefined) geometry.rotation.z = value.z;
        break;

      case 'color':
      case 'colorize':
        // Update color
        if (value.color) geometry.color = value.color;
        break;

      case 'label':
      case 'set-label':
        // NEW: Update or set text label on geometry
        if (value && value.label !== undefined) {
          geometry.label = value.label;
        } else if (typeof value === 'string') {
          // Allow passing label directly as string
          geometry.label = value;
        }
        break;

      case 'delete':
      case 'remove':
        // Remove geometry
        this.geometries.delete(itemId);
        this.collisionSpaces.delete(itemId);
        this.tensorSpace.delete(itemId);
        break;

      default:
        // Generic property update
        if (value) {
          Object.assign(geometry.properties, value);
        }
    }

    geometry.updatedAt = Date.now();

    this.geometryHistory.push({
      itemId,
      action: `UPDATE_${action.toUpperCase()}`,
      value,
      timestamp: Date.now()
    });

    return geometry;
  }

  /**
   * Get all geometries for scene rendering
   */
  getSceneGeometries() {
    const geometries = [];

    for (const [itemId, geom] of this.geometries) {
      const tensor = this.tensorSpace.get(itemId);
      geometries.push({
        itemId,
        ...geom,
        tensor: tensor || null
      });
    }

    return geometries;
  }

  /**
   * Check collision between two items
   */
  checkCollision(itemId1, itemId2) {
    const bounds1 = this.collisionSpaces.get(itemId1);
    const bounds2 = this.collisionSpaces.get(itemId2);

    if (!bounds1 || !bounds2) return false;

    // AABB collision detection
    return (
      bounds1.min.x <= bounds2.max.x &&
      bounds1.max.x >= bounds2.min.x &&
      bounds1.min.y <= bounds2.max.y &&
      bounds1.max.y >= bounds2.min.y &&
      bounds1.min.z <= bounds2.max.z &&
      bounds1.max.z >= bounds2.min.z
    );
  }

  /**
   * Get all collisions in scene
   */
  getAllCollisions() {
    const collisions = [];
    const items = Array.from(this.geometries.keys());

    for (let i = 0; i < items.length; i++) {
      for (let j = i + 1; j < items.length; j++) {
        if (this.checkCollision(items[i], items[j])) {
          collisions.push({
            item1: items[i],
            item2: items[j],
            timestamp: Date.now()
          });
        }
      }
    }

    return collisions;
  }

  /**
   * Get scene state for transmission to client
   */
  getSceneState() {
    return {
      geometries: this.getSceneGeometries(),
      collisions: this.getAllCollisions(),
      tensorFields: Array.from(this.tensorSpace.values()),
      totalItems: this.geometries.size,
      timestamp: Date.now()
    };
  }

  /**
   * Get geometry change delta for real-time updates
   */
  getGeometryDelta(itemId) {
    const geometry = this.geometries.get(itemId);
    if (!geometry) return null;

    return {
      itemId,
      position: geometry.position,
      rotation: geometry.rotation,
      scale: geometry.scale,
      color: geometry.color,
      updatedAt: geometry.updatedAt
    };
  }

  /**
   * Helper: Create box geometry data
   */
  createBoxGeometry(scale) {
    return {
      type: 'box',
      vertices: 8,
      faces: 6,
      dimensions: scale
    };
  }

  /**
   * Helper: Create sphere geometry data
   */
  createSphereGeometry(scale) {
    return {
      type: 'sphere',
      radius: Math.max(scale.x, scale.y, scale.z) / 2,
      segments: 32
    };
  }

  /**
   * Helper: Create cylinder geometry data
   */
  createCylinderGeometry(scale) {
    return {
      type: 'cylinder',
      radiusTop: scale.x / 2,
      radiusBottom: scale.x / 2,
      height: scale.z,
      segments: 32
    };
  }

  /**
   * Helper: Create cone geometry data
   */
  createConeGeometry(scale) {
    return {
      type: 'cone',
      radius: scale.x / 2,
      height: scale.z,
      segments: 32
    };
  }

  /**
   * Helper: Create bounding box for box geometry
   */
  createBoxBounds(position, scale) {
    return {
      min: {
        x: position.x - scale.x / 2,
        y: position.y - scale.y / 2,
        z: position.z - scale.z / 2
      },
      max: {
        x: position.x + scale.x / 2,
        y: position.y + scale.y / 2,
        z: position.z + scale.z / 2
      }
    };
  }

  /**
   * Helper: Create bounding sphere for sphere geometry
   */
  createSphereBounds(position, scale) {
    const radius = Math.max(scale.x, scale.y, scale.z) / 2;
    return {
      min: {
        x: position.x - radius,
        y: position.y - radius,
        z: position.z - radius
      },
      max: {
        x: position.x + radius,
        y: position.y + radius,
        z: position.z + radius
      }
    };
  }

  /**
   * Helper: Create bounding box for cylinder
   */
  createCylinderBounds(position, scale) {
    return {
      min: {
        x: position.x - scale.x / 2,
        y: position.y - scale.y / 2,
        z: position.z - scale.z / 2
      },
      max: {
        x: position.x + scale.x / 2,
        y: position.y + scale.y / 2,
        z: position.z + scale.z / 2
      }
    };
  }

  /**
   * Helper: Create bounding box for cone
   */
  createConeBounds(position, scale) {
    return {
      min: {
        x: position.x - scale.x / 2,
        y: position.y - scale.y / 2,
        z: position.z - scale.z / 2
      },
      max: {
        x: position.x + scale.x / 2,
        y: position.y + scale.y / 2,
        z: position.z + scale.z / 2
      }
    };
  }

  /**
   * Helper: Generic bounding box
   */
  createBoundingBox(position, scale) {
    return this.createBoxBounds(position, scale);
  }

  /**
   * Get geometry statistics
   */
  getStatistics() {
    return {
      totalGeometries: this.geometries.size,
      tensorSpaces: this.tensorSpace.size,
      collisionPairs: this.getAllCollisions().length,
      geometryTypes: this.getGeometryTypeDistribution(),
      historySize: this.geometryHistory.length
    };
  }

  /**
   * Get distribution of geometry types
   */
  getGeometryTypeDistribution() {
    const distribution = {};

    for (const geom of this.geometries.values()) {
      distribution[geom.type] = (distribution[geom.type] || 0) + 1;
    }

    return distribution;
  }

  /**
   * Get geometry audit trail
   */
  getGeometryAuditTrail(itemId = null) {
    if (!itemId) {
      return this.geometryHistory;
    }

    return this.geometryHistory.filter(entry => entry.itemId === itemId);
  }

  /**
   * Clear old history (maintenance)
   */
  pruneHistory(maxAge = 3600000) { // 1 hour default
    const now = Date.now();
    const oldLength = this.geometryHistory.length;

    this.geometryHistory = this.geometryHistory.filter(
      entry => (now - entry.timestamp) <= maxAge
    );

    return {
      removed: oldLength - this.geometryHistory.length,
      remaining: this.geometryHistory.length
    };
  }
}
