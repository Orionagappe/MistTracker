// client/src/hooks/use4DVisualization.js
// React hook for managing 4D tensor field visualizations
// Integrates with useWebSocket and ClientGeometryVisualizer

import { useState, useEffect, useRef, useCallback } from 'react';
import { TensorFieldVisualizer } from '../utils/tensor-field-visualizer.js';

/**
 * use4DVisualization - Manages 4D tensor field visualization in 3D space
 * 
 * @param {THREE.Scene} threeScene - Three.js scene to render into
 * @param {object} sceneState - Scene geometry state from useVisualization
 * @param {object} wsConnection - WebSocket connection from useWebSocket
 * @param {object} options - Visualization options
 * @returns {object} 4D visualization interface
 */
export function use4DVisualization(threeScene, sceneState, wsConnection, options = {}) {
  const {
    enableAnimation = true,
    particleCount = 1000,
    particleSize = 0.5,
    autoUpdate = true,
    debug = false
  } = options;

  // Visualization state
  const visualizerRef = useRef(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [activeTensors, setActiveTensors] = useState(new Map());
  const [animationFrame, setAnimationFrame] = useState(null);
  const [stats, setStats] = useState({
    activeTensorFields: 0,
    totalParticles: 0,
    animationTime: 0
  });

  /**
   * Initialize tensor field visualizer
   */
  useEffect(() => {
    if (!threeScene) {
      console.warn('No Three.js scene provided to use4DVisualization');
      return;
    }

    try {
      visualizerRef.current = new TensorFieldVisualizer(threeScene, {
        particleCount,
        particleSize,
        animationEnabled: enableAnimation,
        ...options
      });
      setIsInitialized(true);
      if (debug) console.log('4D Visualization initialized');
    } catch (err) {
      console.error('Failed to initialize 4D visualizer:', err);
    }

    return () => {
      if (visualizerRef.current) {
        visualizerRef.current.clear();
        visualizerRef.current = null;
      }
      setIsInitialized(false);
    };
  }, [threeScene, particleCount, particleSize, enableAnimation, debug, options]);

  /**
   * Create visualization for new tensor field
   */
  const createTensorVisualization = useCallback((itemId, tensorData, geometryPosition = { x: 0, y: 0, z: 0 }) => {
    if (!visualizerRef.current) return;

    try {
      const particles = visualizerRef.current.createTensorFieldVisualization(
        itemId,
        tensorData,
        geometryPosition
      );

      setActiveTensors(prev => new Map(prev).set(itemId, {
        tensorData,
        geometryPosition,
        particles,
        createdAt: Date.now()
      }));

      if (debug) console.log(`✨ Tensor visualization created for ${itemId}`);
    } catch (err) {
      console.error(`Failed to create tensor visualization for ${itemId}:`, err);
    }
  }, [debug]);

  /**
   * Update existing tensor visualization
   */
  const updateTensorVisualization = useCallback((itemId, updates) => {
    if (!visualizerRef.current) return;

    try {
      visualizerRef.current.updateTensorField(itemId, updates);

      setActiveTensors(prev => {
        const updated = new Map(prev);
        if (updated.has(itemId)) {
          updated.set(itemId, {
            ...updated.get(itemId),
            tensorData: { ...updated.get(itemId).tensorData, ...updates },
            updatedAt: Date.now()
          });
        }
        return updated;
      });

      if (debug) console.log(`✨ Tensor visualization updated for ${itemId}`);
    } catch (err) {
      console.error(`Failed to update tensor visualization for ${itemId}:`, err);
    }
  }, [debug]);

  /**
   * Remove tensor visualization
   */
  const removeTensorVisualization = useCallback((itemId) => {
    if (!visualizerRef.current) return;

    try {
      visualizerRef.current.removeTensorField(itemId);

      setActiveTensors(prev => {
        const updated = new Map(prev);
        updated.delete(itemId);
        return updated;
      });

      if (debug) console.log(`🗑️  Tensor visualization removed for ${itemId}`);
    } catch (err) {
      console.error(`Failed to remove tensor visualization for ${itemId}:`, err);
    }
  }, [debug]);

  /**
   * Sync tensor fields from scene state
   */
  useEffect(() => {
    if (!isInitialized || !sceneState?.tensorFields) return;

    if (autoUpdate) {
      // Create/update tensors from scene state
      sceneState.tensorFields.forEach(tensorField => {
        const { itemId, d0, d1, intensity, frequency, phase } = tensorField;
        const geometry = sceneState.geometries?.find(g => g.itemId === itemId);
        const position = geometry?.position || { x: 0, y: 0, z: 0 };

        if (!activeTensors.has(itemId)) {
          createTensorVisualization(itemId, { d0, d1, intensity, frequency, phase }, position);
        } else {
          // Update position if geometry moved
          const existing = activeTensors.get(itemId);
          if (geometry && (
            existing.geometryPosition.x !== position.x ||
            existing.geometryPosition.y !== position.y ||
            existing.geometryPosition.z !== position.z
          )) {
            // Update position in userData (will be used in next animation frame)
            existing.particles.userData.geometryPosition = position;
          }
        }
      });

      // Remove tensors that are no longer in scene state
      activeTensors.forEach((_, itemId) => {
        if (!sceneState.tensorFields.some(t => t.itemId === itemId)) {
          removeTensorVisualization(itemId);
        }
      });
    }
  }, [isInitialized, sceneState?.tensorFields, autoUpdate, activeTensors, createTensorVisualization, removeTensorVisualization]);

  /**
   * Animation loop
   */
  useEffect(() => {
    if (!isInitialized || !enableAnimation) return;

    let lastTime = performance.now();

    const animate = (currentTime) => {
      const deltaTime = (currentTime - lastTime) / 1000;
      lastTime = currentTime;

      if (visualizerRef.current) {
        visualizerRef.current.updateTensorFields(deltaTime);
        
        // Update stats periodically
        setStats(visualizerRef.current.getStatistics());
      }

      setAnimationFrame(requestAnimationFrame(animate));
    };

    setAnimationFrame(requestAnimationFrame(animate));

    return () => {
      if (animationFrame) {
        cancelAnimationFrame(animationFrame);
      }
    };
  }, [isInitialized, enableAnimation, animationFrame]);

  /**
   * Get tensor field by ID
   */
  const getTensorField = useCallback((itemId) => {
    const tensor = activeTensors.get(itemId);
    return tensor ? tensor.tensorData : null;
  }, [activeTensors]);

  /**
   * Get all tensor fields
   */
  const getAllTensorFields = useCallback(() => {
    return Array.from(activeTensors.values()).map(t => t.tensorData);
  }, [activeTensors]);

  /**
   * Toggle tensor field visibility
   */
  const setTensorVisible = useCallback((itemId, visible) => {
    if (!visualizerRef.current) return;
    visualizerRef.current.setTensorFieldVisible(itemId, visible);
  }, []);

  /**
   * Send tensor create request to server
   */
  const createTensorOnServer = useCallback((itemId, d0, d1, intensity, frequency, phase) => {
    if (!wsConnection || !wsConnection.sendTensorCreate) {
      console.error('WebSocket not ready for tensor creation');
      return;
    }

    wsConnection.sendTensorCreate(itemId, d0, d1, intensity, frequency, phase);
  }, [wsConnection]);

  /**
   * Get visualization stats
   */
  const getStatistics = useCallback(() => {
    return {
      ...stats,
      activeTensorsMap: Array.from(activeTensors.keys())
    };
  }, [stats, activeTensors]);

  /**
   * Clear all tensor visualizations
   */
  const clearAllTensors = useCallback(() => {
    if (visualizerRef.current) {
      visualizerRef.current.clear();
      setActiveTensors(new Map());
    }
  }, []);

  /**
   * Export tensor field data
   */
  const exportTensorData = useCallback(() => {
    const data = {
      timestamp: Date.now(),
      animationTime: visualizerRef.current?.getAnimationTime() || 0,
      tensorFields: Array.from(activeTensors.entries()).map(([itemId, t]) => ({
        itemId,
        ...t.tensorData,
        position: t.geometryPosition
      }))
    };
    return data;
  }, [activeTensors]);

  return {
    // Status
    isInitialized,
    stats,
    
    // Tensor management
    createTensorVisualization,
    updateTensorVisualization,
    removeTensorVisualization,
    getTensorField,
    getAllTensorFields,
    
    // Visibility control
    setTensorVisible,
    
    // Server communication
    createTensorOnServer,
    
    // Utilities
    getStatistics,
    clearAllTensors,
    exportTensorData,

    // Direct access to visualizer (for advanced usage)
    visualizer: visualizerRef.current
  };
}

export default use4DVisualization;
