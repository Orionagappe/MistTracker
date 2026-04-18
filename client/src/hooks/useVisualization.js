// client/src/hooks/useVisualization.js
// React hook for managing 3D/4D visualization with real-time updates

import { useState, useEffect, useRef, useCallback } from 'react';

export function useVisualization(wsConnection, options = {}) {
  const {
    enableCollisionDetection = true,
    enableTensorVisualization = true,
    maxGeometries = 1000,
    updateThrottle = 16 // ms, ~60fps
  } = options;

  // Scene state
  const [sceneState, setSceneState] = useState({
    geometries: [],
    collisions: [],
    tensorFields: [],
    totalItems: 0,
    timestamp: Date.now()
  });

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Refs for throttling and tracking
  const throttleRef = useRef(null);
  const geometriesCacheRef = useRef(new Map());
  const collisionCacheRef = useRef(new Set());

  /**
   * Handle incoming SCENE_STATE message
   */
  const handleSceneState = useCallback((message) => {
    try {
      if (message.geometries.length > maxGeometries) {
        console.warn(`Scene has ${message.geometries.length} geometries, max is ${maxGeometries}`);
      }

      // Cache geometries
      for (const geom of message.geometries) {
        geometriesCacheRef.current.set(geom.itemId, geom);
      }

      // Throttle state updates
      if (throttleRef.current) {
        clearTimeout(throttleRef.current);
      }

      throttleRef.current = setTimeout(() => {
        setSceneState({
          geometries: message.geometries,
          collisions: message.collisions || [],
          tensorFields: message.tensorFields || [],
          totalItems: message.totalItems,
          timestamp: message.timestamp || Date.now()
        });
        setIsLoading(false);
      }, updateThrottle);
    } catch (err) {
      setError(`Failed to handle scene state: ${err.message}`);
    }
  }, [maxGeometries, updateThrottle]);

  /**
   * Handle GEOMETRY_CREATE message
   */
  const handleGeometryCreate = useCallback((message) => {
    try {
      const { itemId, type, position, scale, color, properties } = message;

      const newGeometry = {
        itemId,
        type,
        position: position || { x: 0, y: 0, z: 0 },
        rotation: { x: 0, y: 0, z: 0 },
        scale: scale || { x: 1, y: 1, z: 1 },
        color: color || '#FF6B6B',
        properties: properties || {},
        timestamp: Date.now()
      };

      geometriesCacheRef.current.set(itemId, newGeometry);

      setSceneState(prev => ({
        ...prev,
        geometries: [...prev.geometries, newGeometry],
        totalItems: prev.totalItems + 1,
        timestamp: Date.now()
      }));
    } catch (err) {
      setError(`Failed to create geometry: ${err.message}`);
    }
  }, []);

  /**
   * Handle GEOMETRY_UPDATE message
   */
  const handleGeometryUpdate = useCallback((message) => {
    try {
      const { itemId, position, rotation, scale, color } = message;

      const geometry = geometriesCacheRef.current.get(itemId);
      if (!geometry) {
        console.warn(`Geometry not found for update: ${itemId}`);
        return;
      }

      // Update cached geometry
      if (position) geometry.position = position;
      if (rotation) geometry.rotation = rotation;
      if (scale) geometry.scale = scale;
      if (color) geometry.color = color;
      geometry.updatedAt = Date.now();

      // Update scene state
      setSceneState(prev => ({
        ...prev,
        geometries: prev.geometries.map(g => 
          g.itemId === itemId ? geometry : g
        ),
        timestamp: Date.now()
      }));
    } catch (err) {
      setError(`Failed to update geometry: ${err.message}`);
    }
  }, []);

  /**
   * Handle GEOMETRY_DELETE message
   */
  const handleGeometryDelete = useCallback((message) => {
    try {
      const { itemId } = message;

      geometriesCacheRef.current.delete(itemId);

      setSceneState(prev => ({
        ...prev,
        geometries: prev.geometries.filter(g => g.itemId !== itemId),
        totalItems: prev.totalItems - 1,
        timestamp: Date.now()
      }));
    } catch (err) {
      setError(`Failed to delete geometry: ${err.message}`);
    }
  }, []);

  /**
   * Handle COLLISION_EVENT message
   */
  const handleCollisionEvent = useCallback((message) => {
    if (!enableCollisionDetection) return;

    try {
      const { item1, item2, timestamp } = message;
      const collisionId = `${item1}-${item2}`;

      // Avoid duplicate collision events
      if (collisionCacheRef.current.has(collisionId)) {
        return;
      }

      collisionCacheRef.current.add(collisionId);

      // Clear after 100ms (collision duration estimate)
      setTimeout(() => {
        collisionCacheRef.current.delete(collisionId);
      }, 100);

      setSceneState(prev => ({
        ...prev,
        collisions: [
          ...prev.collisions,
          { item1, item2, timestamp }
        ],
        timestamp: Date.now()
      }));
    } catch (err) {
      setError(`Failed to handle collision: ${err.message}`);
    }
  }, [enableCollisionDetection]);

  /**
   * Handle TENSOR_CREATE message
   */
  const handleTensorCreate = useCallback((message) => {
    if (!enableTensorVisualization) return;

    try {
      const { itemId, d0, d1, intensity, color } = message;

      const tensorField = {
        itemId,
        d0,
        d1,
        intensity: intensity || 1.0,
        color: color || '#FF00FF'
      };

      setSceneState(prev => ({
        ...prev,
        tensorFields: [...prev.tensorFields, tensorField],
        timestamp: Date.now()
      }));
    } catch (err) {
      setError(`Failed to create tensor: ${err.message}`);
    }
  }, [enableTensorVisualization]);

  /**
   * Request scene state from server
   */
  const requestSceneState = useCallback(() => {
    if (wsConnection && wsConnection.isConnected) {
      wsConnection.send({
        type: 'scene-state',
        timestamp: Date.now()
      });
    }
  }, [wsConnection]);

  /**
   * Get geometries for rendering
   */
  const getGeometries = useCallback(() => {
    return sceneState.geometries;
  }, [sceneState.geometries]);

  /**
   * Get collisions for visualization
   */
  const getCollisions = useCallback(() => {
    return sceneState.collisions;
  }, [sceneState.collisions]);

  /**
   * Get tensor fields for 4D visualization
   */
  const getTensorFields = useCallback(() => {
    return sceneState.tensorFields;
  }, [sceneState.tensorFields]);

  /**
   * Get specific geometry by ID
   */
  const getGeometry = useCallback((itemId) => {
    return geometriesCacheRef.current.get(itemId);
  }, []);

  /**
   * Check if two geometries are colliding
   */
  const isColliding = useCallback((item1, item2) => {
    return sceneState.collisions.some(c => 
      (c.item1 === item1 && c.item2 === item2) ||
      (c.item1 === item2 && c.item2 === item1)
    );
  }, [sceneState.collisions]);

  /**
   * Get scene statistics
   */
  const getSceneStats = useCallback(() => {
    return {
      totalGeometries: sceneState.totalItems,
      tensorFields: sceneState.tensorFields.length,
      activeCollisions: sceneState.collisions.length,
      timestamp: sceneState.timestamp
    };
  }, [sceneState]);

  /**
   * Setup message handlers
   */
  useEffect(() => {
    if (!wsConnection) return;

    // Register message handlers
    const messageHandlers = {
      'scene-state': handleSceneState,
      'geometry-create': handleGeometryCreate,
      'geometry-update': handleGeometryUpdate,
      'geometry-delete': handleGeometryDelete,
      'collision-event': handleCollisionEvent,
      'tensor-create': handleTensorCreate
    };

    // If wsConnection has an onMessage handler registration
    if (wsConnection.onMessage) {
      for (const [type, handler] of Object.entries(messageHandlers)) {
        wsConnection.onMessage(type, handler);
      }
    }

    return () => {
      // Cleanup handlers
      if (wsConnection.offMessage) {
        for (const type of Object.keys(messageHandlers)) {
          wsConnection.offMessage(type);
        }
      }
    };
  }, [
    wsConnection,
    handleSceneState,
    handleGeometryCreate,
    handleGeometryUpdate,
    handleGeometryDelete,
    handleCollisionEvent,
    handleTensorCreate
  ]);

  /**
   * Request initial scene state on mount
   */
  useEffect(() => {
    requestSceneState();
  }, [requestSceneState]);

  return {
    // State
    sceneState,
    isLoading,
    error,

    // Methods
    requestSceneState,
    getGeometries,
    getCollisions,
    getTensorFields,
    getGeometry,
    isColliding,
    getSceneStats,

    // Stats
    stats: {
      totalGeometries: sceneState.totalItems,
      totalTensorFields: sceneState.tensorFields.length,
      totalCollisions: sceneState.collisions.length
    }
  };
}
