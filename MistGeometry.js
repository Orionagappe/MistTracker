// MistGeometry.js
// 3D Geometry Visualization Handler for MistTracker (Phase 4)
// Manages creation, updating, querying, and deletion of 3D geometric objects
// Supports multiple geometry types: mesh, sphere, cube, cylinder, custom

import crypto from 'crypto';

/**
 * GeometryHandler - Manages 3D geometry objects and their transformations
 * 
 * Supports:
 * - Multiple geometry types (mesh, sphere, cube, cylinder, custom)
 * - Geometric transformations (position, rotation, scale)
 * - Bounding box queries for spatial partitioning
 * - Collision detection
 * - Metadata tagging and filtering
 */
export class GeometryHandler {
  constructor() {
    this.geometries = new Map(); // geometryId -> geometry object
    this.spatialIndex = new Map(); // zone -> [geometryIds]
    this.typeIndex = new Map(); // geometryType -> [geometryIds]
    this.userIndex = new Map(); // userId -> [geometryIds]
    this.zoneSize = 100; // Size of spatial grid zones (units)
  }

  /**
   * Create a new 3D geometry
   * @param {string} name - Name of the geometry
   * @param {string} geometryType - Type: mesh, sphere, cube, cylinder, custom
   * @param {object} data - Geometry data (vertices, indices, etc.)
   * @param {object} properties - Metadata and properties
   * @returns {object} Created geometry object
   */
  createGeometry(name, geometryType, data, properties = {}) {
    // Validate geometry type
    const validTypes = ['mesh', 'sphere', 'cube', 'cylinder', 'custom'];
    if (!validTypes.includes(geometryType)) {
      throw new Error(`Invalid geometry type: ${geometryType}`);
    }

    // Generate unique ID
    const geometryId = crypto.randomBytes(16).toString('hex');

    // Create geometry object
    const geometry = {
      id: geometryId,
      name: name || `Geometry-${geometryId.slice(0, 8)}`,
      type: geometryType,
      data: {
        vertices: data?.vertices || [],
        indices: data?.indices || [],
        normals: data?.normals || [],
        colors: data?.colors || [],
        texCoords: data?.texCoords || []
      },
      transform: {
        position: properties?.position || [0, 0, 0],
        rotation: properties?.rotation || [0, 0, 0],
        scale: properties?.scale || [1, 1, 1]
      },
      material: {
        color: properties?.color || [0.8, 0.8, 0.8],
        metallic: properties?.metallic || 0.5,
        roughness: properties?.roughness || 0.5,
        emissive: properties?.emissive || [0, 0, 0]
      },
      bounds: this._calculateBounds(data?.vertices || []),
      metadata: {
        createdAt: Date.now(),
        updatedAt: Date.now(),
        userId: properties?.userId || 'system',
        tags: properties?.tags || [],
        visible: properties?.visible !== false,
        locked: properties?.locked || false
      }
    };

    // Store geometry
    this.geometries.set(geometryId, geometry);

    // Update indices
    const zoneKey = this._getZoneKey(geometry.bounds.center);
    if (!this.spatialIndex.has(zoneKey)) {
      this.spatialIndex.set(zoneKey, []);
    }
    this.spatialIndex.get(zoneKey).push(geometryId);

    if (!this.typeIndex.has(geometryType)) {
      this.typeIndex.set(geometryType, []);
    }
    this.typeIndex.get(geometryType).push(geometryId);

    if (properties?.userId) {
      if (!this.userIndex.has(properties.userId)) {
        this.userIndex.set(properties.userId, []);
      }
      this.userIndex.get(properties.userId).push(geometryId);
    }

    return geometry;
  }

  /**
   * Update existing geometry
   * @param {string} geometryId - ID of geometry to update
   * @param {object} data - Updated data (vertices, indices, etc.)
   * @param {object} properties - Updated properties and metadata
   * @returns {object} Updated geometry
   */
  updateGeometry(geometryId, data, properties = {}) {
    const geometry = this.geometries.get(geometryId);
    if (!geometry) {
      throw new Error(`Geometry not found: ${geometryId}`);
    }

    // Update data if provided
    if (data) {
      if (data.vertices) geometry.data.vertices = data.vertices;
      if (data.indices) geometry.data.indices = data.indices;
      if (data.normals) geometry.data.normals = data.normals;
      if (data.colors) geometry.data.colors = data.colors;
      if (data.texCoords) geometry.data.texCoords = data.texCoords;

      // Recalculate bounds
      geometry.bounds = this._calculateBounds(geometry.data.vertices);
    }

    // Update transform
    if (properties?.position) geometry.transform.position = properties.position;
    if (properties?.rotation) geometry.transform.rotation = properties.rotation;
    if (properties?.scale) geometry.transform.scale = properties.scale;

    // Update material
    if (properties?.color) geometry.material.color = properties.color;
    if (properties?.metallic !== undefined) geometry.material.metallic = properties.metallic;
    if (properties?.roughness !== undefined) geometry.material.roughness = properties.roughness;
    if (properties?.emissive) geometry.material.emissive = properties.emissive;

    // Update metadata
    if (properties?.tags) geometry.metadata.tags = properties.tags;
    if (properties?.visible !== undefined) geometry.metadata.visible = properties.visible;
    if (properties?.locked !== undefined) geometry.metadata.locked = properties.locked;

    geometry.metadata.updatedAt = Date.now();

    return geometry;
  }

  /**
   * Query geometries by filters
   * @param {object} query - Query filters
   * @returns {array} Matching geometries
   */
  queryGeometries(query = {}) {
    let results = [];

    // Filter by type
    if (query.geometryType) {
      const typeIds = this.typeIndex.get(query.geometryType) || [];
      results = typeIds.map(id => this.geometries.get(id)).filter(Boolean);
    } else {
      // Get all geometries
      results = Array.from(this.geometries.values());
    }

    // Filter by bounds (spatial query)
    if (query.bounds) {
      results = results.filter(geom => 
        this._boundsIntersect(geom.bounds, query.bounds)
      );
    }

    // Filter by properties/tags
    if (query.properties?.tags) {
      results = results.filter(geom =>
        query.properties.tags.some(tag => geom.metadata.tags.includes(tag))
      );
    }

    // Filter by visibility
    if (query.visibleOnly) {
      results = results.filter(geom => geom.metadata.visible);
    }

    // Apply limit
    if (query.limit) {
      results = results.slice(0, query.limit);
    }

    return results;
  }

  /**
   * Delete geometry
   * @param {string} geometryId - ID of geometry to delete
   * @returns {boolean} Success
   */
  deleteGeometry(geometryId) {
    const geometry = this.geometries.get(geometryId);
    if (!geometry) {
      throw new Error(`Geometry not found: ${geometryId}`);
    }

    // Remove from spatial index
    const zoneKey = this._getZoneKey(geometry.bounds.center);
    if (this.spatialIndex.has(zoneKey)) {
      const ids = this.spatialIndex.get(zoneKey);
      const idx = ids.indexOf(geometryId);
      if (idx > -1) ids.splice(idx, 1);
    }

    // Remove from type index
    if (this.typeIndex.has(geometry.type)) {
      const ids = this.typeIndex.get(geometry.type);
      const idx = ids.indexOf(geometryId);
      if (idx > -1) ids.splice(idx, 1);
    }

    // Remove from user index
    if (this.userIndex.has(geometry.metadata.userId)) {
      const ids = this.userIndex.get(geometry.metadata.userId);
      const idx = ids.indexOf(geometryId);
      if (idx > -1) ids.splice(idx, 1);
    }

    // Delete from main store
    this.geometries.delete(geometryId);

    return true;
  }

  /**
   * Get geometry by ID
   * @param {string} geometryId - ID of geometry
   * @returns {object} Geometry object
   */
  getGeometry(geometryId) {
    return this.geometries.get(geometryId);
  }

  /**
   * Get all geometries created by user
   * @param {string} userId - User ID
   * @returns {array} User's geometries
   */
  getUserGeometries(userId) {
    const ids = this.userIndex.get(userId) || [];
    return ids.map(id => this.geometries.get(id)).filter(Boolean);
  }

  /**
   * Perform spatial query by zone
   * @param {number} x, y, z - Zone coordinates
   * @returns {array} Geometries in zone
   */
  queryByZone(x, y, z) {
    const zoneKey = `${Math.floor(x / this.zoneSize)},${Math.floor(y / this.zoneSize)},${Math.floor(z / this.zoneSize)}`;
    const ids = this.spatialIndex.get(zoneKey) || [];
    return ids.map(id => this.geometries.get(id)).filter(Boolean);
  }

  /**
   * Check collision between two geometries
   * @param {string} geomId1, geomId2 - Geometry IDs
   * @returns {boolean} Whether they collide
   */
  checkCollision(geomId1, geomId2) {
    const geom1 = this.geometries.get(geomId1);
    const geom2 = this.geometries.get(geomId2);

    if (!geom1 || !geom2) return false;

    return this._boundsIntersect(geom1.bounds, geom2.bounds);
  }

  /**
   * Calculate bounding box from vertices
   * @private
   */
  _calculateBounds(vertices) {
    if (!vertices || vertices.length === 0) {
      return {
        min: [0, 0, 0],
        max: [0, 0, 0],
        center: [0, 0, 0],
        radius: 0
      };
    }

    let minX = Infinity, minY = Infinity, minZ = Infinity;
    let maxX = -Infinity, maxY = -Infinity, maxZ = -Infinity;

    for (let i = 0; i < vertices.length; i += 3) {
      minX = Math.min(minX, vertices[i]);
      minY = Math.min(minY, vertices[i + 1]);
      minZ = Math.min(minZ, vertices[i + 2]);

      maxX = Math.max(maxX, vertices[i]);
      maxY = Math.max(maxY, vertices[i + 1]);
      maxZ = Math.max(maxZ, vertices[i + 2]);
    }

    const center = [
      (minX + maxX) / 2,
      (minY + maxY) / 2,
      (minZ + maxZ) / 2
    ];

    const radius = Math.sqrt(
      Math.pow((maxX - minX) / 2, 2) +
      Math.pow((maxY - minY) / 2, 2) +
      Math.pow((maxZ - minZ) / 2, 2)
    );

    return {
      min: [minX, minY, minZ],
      max: [maxX, maxY, maxZ],
      center: center,
      radius: radius
    };
  }

  /**
   * Get spatial zone key for coordinates
   * @private
   */
  _getZoneKey(coords) {
    return `${Math.floor(coords[0] / this.zoneSize)},${Math.floor(coords[1] / this.zoneSize)},${Math.floor(coords[2] / this.zoneSize)}`;
  }

  /**
   * Check if two bounding boxes intersect
   * @private
   */
  _boundsIntersect(bounds1, bounds2) {
    // Handle min/max format
    const b1Center = bounds1.center || [
      (bounds1.min[0] + bounds1.max[0]) / 2,
      (bounds1.min[1] + bounds1.max[1]) / 2,
      (bounds1.min[2] + bounds1.max[2]) / 2
    ];
    
    const b1Radius = bounds1.radius || Math.sqrt(
      Math.pow((bounds1.max[0] - bounds1.min[0]) / 2, 2) +
      Math.pow((bounds1.max[1] - bounds1.min[1]) / 2, 2) +
      Math.pow((bounds1.max[2] - bounds1.min[2]) / 2, 2)
    );

    const b2Center = bounds2.center || [
      (bounds2.min[0] + bounds2.max[0]) / 2,
      (bounds2.min[1] + bounds2.max[1]) / 2,
      (bounds2.min[2] + bounds2.max[2]) / 2
    ];
    
    const b2Radius = bounds2.radius || Math.sqrt(
      Math.pow((bounds2.max[0] - bounds2.min[0]) / 2, 2) +
      Math.pow((bounds2.max[1] - bounds2.min[1]) / 2, 2) +
      Math.pow((bounds2.max[2] - bounds2.min[2]) / 2, 2)
    );

    const distance = Math.sqrt(
      Math.pow(b1Center[0] - b2Center[0], 2) +
      Math.pow(b1Center[1] - b2Center[1], 2) +
      Math.pow(b1Center[2] - b2Center[2], 2)
    );

    return distance < (b1Radius + b2Radius);
  }

  /**
   * Get statistics about geometry collection
   * @returns {object} Statistics
   */
  getStatistics() {
    return {
      totalGeometries: this.geometries.size,
      geometriesByType: Object.fromEntries(this.typeIndex),
      geometriesByUser: Object.fromEntries(this.userIndex),
      spatialZones: this.spatialIndex.size
    };
  }

  /**
   * Clear all geometries
   */
  clear() {
    this.geometries.clear();
    this.spatialIndex.clear();
    this.typeIndex.clear();
    this.userIndex.clear();
  }
}

export default GeometryHandler;
