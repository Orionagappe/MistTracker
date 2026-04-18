/**
 * usePhysics - React Hook for Managing Physics Simulation State
 * 
 * Handles real-time physics updates from server including:
 * - 3D geometry updates with physics-based transforms
 * - 4D tensor field energy distribution
 * - Wave emitter management (light, gravity)
 * - Dimensional coupling between 3D and 4D
 * 
 * Features:
 * - Auto-syncs with WebSocket physics updates
 * - Tracks physics statistics in real-time
 * - Manages visualization integration with Three.js scene
 * - Provides control methods for physics configuration
 * 
 * Phase 6.5: Added comprehensive error handling
 */

import { useCallback, useRef, useEffect, useState } from 'react';
import { MessageTypes } from '../../../websocket-protocol.js';
import { errorHandler, safePhysicsOperation } from '../utils/errorHandling';

/**
 * Physics state hook
 * @param {Object} threeScene - Three.js scene for visual updates
 * @param {Object} physicsState - Current physics state from server
 * @param {Object} wsConnection - WebSocket connection hook
 * @param {Object} options - Configuration options
 * @returns {Object} Physics interface with state and control methods
 */
export function usePhysics(threeScene, physicsState, wsConnection, options = {}) {
  // State tracking
  const [isInitialized, setIsInitialized] = useState(false);
  const [activeGeometries, setActiveGeometries] = useState(new Map());
  const [activeTensorFields, setActiveTensorFields] = useState(new Map());
  const [waveEmitters, setWaveEmitters] = useState(new Map());
  const [stats, setStats] = useState(null);
  const [couplingEnabled, setCouplingEnabled] = useState(true);

  // Refs
  const geometryUpdatesRef = useRef(new Map());
  const tensorUpdatesRef = useRef(new Map());
  const emitterRefsRef = useRef(new Map()); // Three.js objects for emitters
  const animationFrameRef = useRef(null);

  // Configuration
  const {
    enableVisualization = true,
    physicsUpdateCallback = null,
    onCouplingChange = null,
    emitterVisualScale = 1.0
  } = options;

  /**
   * Handle incoming physics update from WebSocket
   * Phase 6.5: Added error handling for all operations
   */
  const handlePhysicsUpdate = useCallback((message) => {
    try {
      if (message.type !== MessageTypes.PHYSICS_UPDATE) return;

      // Phase 6.5: Wrap geometry updates with error handling
      if (message.geometryUpdates && Array.isArray(message.geometryUpdates)) {
        safePhysicsOperation(() => {
          setActiveGeometries(prev => {
            const updated = new Map(prev);
            for (const geom of message.geometryUpdates) {
              updated.set(geom.itemId, geom);
            }
            return updated;
          });

          // Store updates for visualization
          for (const geom of message.geometryUpdates) {
            geometryUpdatesRef.current.set(geom.itemId, geom);
          }

          // Apply to Three.js meshes if visualization enabled
          if (enableVisualization && threeScene) {
            for (const geom of message.geometryUpdates) {
              try {
                applyGeometryPhysics(geom, threeScene);
              } catch (err) {
                errorHandler.emit(err, {
                  name: 'Geometry Physics Application',
                  itemId: geom.itemId,
                  severity: 'warning'
                });
              }
            }
          }
        }, 'Geometry Update Processing');
      }

      // Phase 6.5: Wrap tensor field updates with error handling
      if (message.tensorUpdates && Array.isArray(message.tensorUpdates)) {
        safePhysicsOperation(() => {
          setActiveTensorFields(prev => {
            const updated = new Map(prev);
            for (const tensor of message.tensorUpdates) {
              updated.set(tensor.itemId, tensor);
            }
            return updated;
          });

          // Store updates
          for (const tensor of message.tensorUpdates) {
            tensorUpdatesRef.current.set(tensor.itemId, tensor);
          }
        }, 'Tensor Field Update Processing');
      }

      // Update statistics
      if (message.statistics) {
        setStats(message.statistics);
      }

      // Call user callback if provided
      if (physicsUpdateCallback) {
        try {
          physicsUpdateCallback(message);
        } catch (err) {
          errorHandler.emit(err, {
            name: 'Physics Update Callback',
            severity: 'warning'
          });
        }
      }
    } catch (err) {
      errorHandler.emit(err, {
        name: 'Physics Update Handler',
        severity: 'error'
      });
      console.error('[Physics] Error handling physics update:', err);
      
      if (window.showToastError) {
        window.showToastError('Physics update error - check console for details');
      }
    }
  }, [enableVisualization, threeScene, physicsUpdateCallback]);

  /**
   * Effect: Register WebSocket listener for physics updates
   * Phase 6.5: Added error handling for connection issues
   */
  useEffect(() => {
    try {
      if (!wsConnection || !wsConnection.setMessageHandler) {
        console.warn('[Physics] WebSocket not ready for physics updates');
        errorHandler.emit(
          new Error('WebSocket connection not available'),
          { name: 'Physics WebSocket Setup', severity: 'warning' }
        );
        return;
      }

      // Register handler for PHYSICS_UPDATE messages
      wsConnection.setMessageHandler(MessageTypes.PHYSICS_UPDATE, handlePhysicsUpdate);

      // Monitor connection errors
      if (wsConnection.onConnectionError) {
        const unsubscribeError = wsConnection.onConnectionError((err) => {
          errorHandler.emit(err, {
            name: 'Physics WebSocket Error',
            severity: 'error'
          });
          
          if (window.showToastError) {
            window.showToastError('Physics connection error - attempting to reconnect...');
          }
        });

        setIsInitialized(true);

        // Cleanup
        return () => {
          if (wsConnection && wsConnection.offMessage) {
            wsConnection.offMessage(MessageTypes.PHYSICS_UPDATE);
          }
          if (unsubscribeError) {
            unsubscribeError();
          }
        };
      }

      setIsInitialized(true);

      // Cleanup
      return () => {
        if (wsConnection && wsConnection.offMessage) {
          wsConnection.offMessage(MessageTypes.PHYSICS_UPDATE);
        }
      };
    } catch (err) {
      errorHandler.emit(err, {
        name: 'Physics WebSocket Setup',
        severity: 'error'
      });
      console.error('[Physics] Error setting up WebSocket listener:', err);
    }
  }, [wsConnection, handlePhysicsUpdate]);

  /**
   * Apply physics transformations to Three.js mesh
   * Phase 6.5: Enhanced error handling for transformation failures
   */
  const applyGeometryPhysics = useCallback((geometry, scene) => {
    if (!scene) return;

    try {
      // Find mesh by itemId (should match as object name or custom property)
      const mesh = scene.getObjectByName(`geometry-${geometry.itemId}`) ||
                   scene.getObjectByName(geometry.itemId);

      if (!mesh) {
        console.debug(`[Physics] Mesh not found for geometry ${geometry.itemId} - may not be visualized yet`);
        return;
      }

      try {
        // Apply position (from physics simulation)
        if (geometry.position && Array.isArray(geometry.position)) {
          mesh.position.x = geometry.position[0] ?? mesh.position.x;
          mesh.position.y = geometry.position[1] ?? mesh.position.y;
          mesh.position.z = geometry.position[2] ?? mesh.position.z;
        }
      } catch (err) {
        console.warn(`[Physics] Error applying position to ${geometry.itemId}:`, err);
      }

      try {
        // Apply velocity-based rotation
        if (geometry.velocity && Array.isArray(geometry.velocity)) {
          const speed = Math.sqrt(
            geometry.velocity[0] ** 2 +
            geometry.velocity[1] ** 2 +
            geometry.velocity[2] ** 2
          );

          if (speed > 0.01) {
            // Rotate based on velocity direction
            const dir = [
              geometry.velocity[0] / speed,
              geometry.velocity[1] / speed,
              geometry.velocity[2] / speed
            ];

            // Update rotation
            if (geometry.rotation && Array.isArray(geometry.rotation)) {
              mesh.rotation.x = geometry.rotation[0] ?? mesh.rotation.x;
              mesh.rotation.y = geometry.rotation[1] ?? mesh.rotation.y;
              mesh.rotation.z = geometry.rotation[2] ?? mesh.rotation.z;
            }
          }
        }
      } catch (err) {
        console.warn(`[Physics] Error applying rotation to ${geometry.itemId}:`, err);
      }

      try {
        // Apply scale (from relativity/curvature effects)
        if (geometry.scale && Array.isArray(geometry.scale)) {
          mesh.scale.x = Math.max(0.01, geometry.scale[0] ?? 1);
          mesh.scale.y = Math.max(0.01, geometry.scale[1] ?? 1);
          mesh.scale.z = Math.max(0.01, geometry.scale[2] ?? 1);
        }
      } catch (err) {
        console.warn(`[Physics] Error applying scale to ${geometry.itemId}:`, err);
      }

      try {
        // Apply color based on energy level
        if (geometry.energy && mesh.material) {
          const energyIntensity = Math.min(1.0, Math.abs(geometry.energy) / 10.0);
          if (mesh.material.emissive) {
            mesh.material.emissive.setHSL(0.6 - energyIntensity * 0.3, 1, 0.3 + energyIntensity * 0.2);
          }
          if (mesh.material.color) {
            const hue = Math.abs((geometry.waveFunction?.phase ?? 0) / (2 * Math.PI));
            mesh.material.color.setHSL(hue, 0.8, 0.5);
          }
        }
      } catch (err) {
        console.warn(`[Physics] Error applying color to ${geometry.itemId}:`, err);
      }

      try {
        // Apply wave function phase to material
        if (geometry.waveFunction && mesh.material && typeof geometry.waveFunction.phase === 'number') {
          const phaseNorm = geometry.waveFunction.phase % (2 * Math.PI);
          const waveInfluence = Math.sin(phaseNorm) * 0.3;

          if (mesh.material.opacity !== undefined) {
            mesh.material.opacity = Math.max(0.3, 1.0 - Math.abs(waveInfluence));
          }
        }
      } catch (err) {
        console.warn(`[Physics] Error applying wave function to ${geometry.itemId}:`, err);
      }

      try {
        // Update time dilation effect (relativistic visual)
        if (geometry.timeDilation && mesh.userData) {
          mesh.userData.timeDilation = geometry.timeDilation;
        }
      } catch (err) {
        console.warn(`[Physics] Error applying time dilation to ${geometry.itemId}:`, err);
      }
    } catch (err) {
      errorHandler.emit(err, {
        name: 'Geometry Physics Application',
        itemId: geometry.itemId,
        severity: 'warning'
      });
      console.error(`[Physics] Error applying physics to mesh ${geometry.itemId}:`, err);
    }
  }, []);

  /**
   * Create wave emitter visualization in Three.js
   */
  const createWaveEmitterViz = useCallback((emitter, scene) => {
    if (!scene || !enableVisualization) return null;

    try {
      const THREE = window.THREE;
      if (!THREE) return null;

      // Create emitter sphere
      const geometry = new THREE.SphereGeometry(0.5 * emitterVisualScale, 16, 16);
      
      let material;
      if (emitter.emitterType === 'light') {
        material = new THREE.MeshStandardMaterial({
          color: 0xFFFF00,
          emissive: 0xFFFF00,
          emissiveIntensity: emitter.intensity,
          metalness: 0.8,
          roughness: 0.2
        });
      } else if (emitter.emitterType === 'gravity') {
        material = new THREE.MeshStandardMaterial({
          color: 0xFF6B6B,
          emissive: 0xFF0000,
          emissiveIntensity: emitter.intensity * 0.5,
          metalness: 0.9,
          roughness: 0.1
        });
      } else {
        material = new THREE.MeshStandardMaterial({
          color: 0x6B6BFF,
          emissive: 0x0000FF,
          emissiveIntensity: emitter.intensity * 0.3
        });
      }

      const mesh = new THREE.Mesh(geometry, material);
      mesh.position.set(...emitter.position);
      mesh.name = `emitter-${emitter.emitterId}`;
      mesh.userData.emitterId = emitter.emitterId;
      mesh.userData.emitterType = emitter.emitterType;

      scene.add(mesh);
      return mesh;
    } catch (err) {
      console.error(`Error creating wave emitter visualization:`, err);
      return null;
    }
  }, [enableVisualization, emitterVisualScale]);

  /**
   * Update wave emitter visualization
   */
  const updateWaveEmitterViz = useCallback((emitter, scene) => {
    if (!scene) return;

    const mesh = scene.getObjectByName(`emitter-${emitter.emitterId}`);
    if (!mesh) return;

    mesh.position.set(...emitter.position);
    if (mesh.material) {
      mesh.material.emissiveIntensity = emitter.intensity;
    }
  }, []);

  /**
   * Handle physics configuration
   */
  const configurePhysics = useCallback((config) => {
    if (!wsConnection || !wsConnection.sendPhysicsConfig) {
      console.warn('WebSocket not ready for physics config');
      return false;
    }
    wsConnection.sendPhysicsConfig(config);
    return true;
  }, [wsConnection]);

  /**
   * Create new wave emitter
   */
  const createWaveEmitter = useCallback((emitterId, type = 'light', position = [0, 0, 0], frequency = 440, amplitude = 1.0, intensity = 1.0) => {
    if (!wsConnection) {
      console.warn('WebSocket not connected, cannot create emitter');
      return false;
    }
    
    if (!wsConnection.sendWaveEmitter) {
      console.warn('sendWaveEmitter method not available on WebSocket connection');
      return false;
    }
    
    wsConnection.sendWaveEmitter(emitterId, type, position, frequency, amplitude, intensity);

    // Add to local tracking
    setWaveEmitters(prev => {
      const updated = new Map(prev);
      updated.set(emitterId, { emitterId, emitterType: type, position, frequency, amplitude, intensity });
      return updated;
    });

    // Create visualization
    if (enableVisualization && threeScene) {
      const vizMesh = createWaveEmitterViz({ emitterId, emitterType: type, position, frequency, amplitude, intensity }, threeScene);
      if (vizMesh) {
        emitterRefsRef.current.set(emitterId, vizMesh);
      }
    }
    
    return true;
  }, [wsConnection, enableVisualization, threeScene, createWaveEmitterViz]);

  /**
   * Control dimensional coupling
   */
  const setDimensionalCoupling = useCallback((enabled, strength = 0.5) => {
    if (!wsConnection || !wsConnection.setDimensionalCoupling) {
      console.warn('WebSocket not ready for coupling control');
      return false;
    }
    wsConnection.setDimensionalCoupling(enabled, strength);
    setCouplingEnabled(enabled);

    if (onCouplingChange) {
      onCouplingChange(enabled);
    }
    return true;
  }, [wsConnection, onCouplingChange]);

  /**
   * Get current physics state for client-side queries
   */
  const getGeometryState = useCallback((itemId) => {
    return geometryUpdatesRef.current.get(itemId);
  }, []);

  /**
   * Get tensor field state
   */
  const getTensorFieldState = useCallback((itemId) => {
    return tensorUpdatesRef.current.get(itemId);
  }, []);

  /**
   * Get all current geometries
   */
  const getAllGeometries = useCallback(() => {
    return Array.from(activeGeometries.values());
  }, [activeGeometries]);

  /**
   * Get all tensor fields
   */
  const getAllTensorFields = useCallback(() => {
    return Array.from(activeTensorFields.values());
  }, [activeTensorFields]);

  /**
   * Request full physics state from server
   */
  const requestPhysicsState = useCallback(() => {
    if (!wsConnection || !wsConnection.requestPhysicsState) {
      console.warn('WebSocket not ready for state request');
      return false;
    }
    wsConnection.requestPhysicsState();
    return true;
  }, [wsConnection]);

  /**
   * Get physics statistics
   */
  const getStatistics = useCallback(() => {
    return stats;
  }, [stats]);

  /**
   * Export physics data for analysis/persistence
   */
  const exportPhysicsData = useCallback(() => {
    return {
      timestamp: Date.now(),
      geometries: Array.from(activeGeometries.values()),
      tensorFields: Array.from(activeTensorFields.values()),
      waveEmitters: Array.from(waveEmitters.values()),
      statistics: stats,
      couplingEnabled
    };
  }, [activeGeometries, activeTensorFields, waveEmitters, stats, couplingEnabled]);

  /**
   * Clear all physics visualizations
   */
  const clearAllVisualizations = useCallback(() => {
    if (!threeScene) return;

    // Remove emitter visualizations
    for (const [emitterId, mesh] of emitterRefsRef.current) {
      threeScene.remove(mesh);
      if (mesh.geometry) mesh.geometry.dispose();
      if (mesh.material) mesh.material.dispose();
    }
    emitterRefsRef.current.clear();

    setActiveGeometries(new Map());
    setActiveTensorFields(new Map());
    setWaveEmitters(new Map());
    geometryUpdatesRef.current.clear();
    tensorUpdatesRef.current.clear();
  }, [threeScene]);

  /**
   * Update wave emitter properties
   */
  const updateWaveEmitter = useCallback((emitterId, settings) => {
    if (!wsConnection || !wsConnection.sendWaveEmitter) {
      console.warn('WebSocket not ready for emitter update');
      return false;
    }

    // Get existing emitter to preserve other properties
    const emitter = waveEmitters.get(emitterId);
    if (!emitter) {
      console.warn(`Emitter ${emitterId} not found`);
      return false;
    }

    // Send updated emitter with merged settings
    wsConnection.sendWaveEmitter(
      emitterId,
      emitter.emitterType,
      emitter.position,
      settings.frequency ?? emitter.frequency,
      settings.amplitude ?? emitter.amplitude,
      settings.intensity ?? emitter.intensity
    );

    // Update local state
    setWaveEmitters(prev => {
      const updated = new Map(prev);
      updated.set(emitterId, {
        ...emitter,
        frequency: settings.frequency ?? emitter.frequency,
        amplitude: settings.amplitude ?? emitter.amplitude,
        intensity: settings.intensity ?? emitter.intensity
      });
      return updated;
    });

    return true;
  }, [wsConnection, waveEmitters]);

  /**
   * Delete wave emitter
   */
  const deleteWaveEmitter = useCallback((emitterId) => {
    if (!wsConnection || !wsConnection.sendWaveEmitter) {
      console.warn('WebSocket not ready for emitter deletion');
      return false;
    }

    // Send deletion message (could be a special null/empty emitter or separate delete message)
    // For now, we'll just remove from local state
    setWaveEmitters(prev => {
      const updated = new Map(prev);
      updated.delete(emitterId);
      return updated;
    });

    // Remove visualization
    if (threeScene) {
      const mesh = threeScene.getObjectByName(`emitter-${emitterId}`);
      if (mesh) {
        threeScene.remove(mesh);
        if (mesh.geometry) mesh.geometry.dispose();
        if (mesh.material) mesh.material.dispose();
      }
      emitterRefsRef.current.delete(emitterId);
    }

    console.log(`Emitter ${emitterId} deleted`);
    return true;
  }, [wsConnection, threeScene]);

  /**
   * Effect: Request initial physics state
   */
  useEffect(() => {
    if (isInitialized && wsConnection) {
      requestPhysicsState();
    }
  }, [isInitialized, wsConnection, requestPhysicsState]);

  return {
    // State
    isInitialized,
    activeGeometries,
    activeTensorFields,
    waveEmitters,
    stats,
    couplingEnabled,

    // Geometry methods
    getGeometryState,
    getAllGeometries,
    getTensorFieldState,
    getAllTensorFields,

    // Control methods
    configurePhysics,
    createWaveEmitter,
    updateWaveEmitter,
    deleteWaveEmitter,
    setDimensionalCoupling,
    requestPhysicsState,
    
    // Query methods
    getStatistics,
    exportPhysicsData,
    clearAllVisualizations
  };
}

export default usePhysics;
