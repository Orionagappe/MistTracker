/**
 * PHASE 10.9: CUSTOM HOOKS
 * 
 * React hooks for Phase 10 integration
 * Provides clean API for components to use Phase 10 features
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import Phase10IntegrationModule from '../utils/Phase10IntegrationModule';

/**
 * Hook to manage Phase 10 integration
 * @param {HTMLCanvasElement} canvasRef - Reference to canvas element
 * @param {Object} config - Configuration options
 * @returns {Object} Phase 10 API methods and state
 */
export function usePhase10Integration(canvasRef, config = {}) {
  const moduleRef = useRef(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({
    fps: 0,
    particleCount: 0,
    mode: '3D',
    simulationSpeed: 1.0
  });

  // Initialize module
  useEffect(() => {
    const initialize = async () => {
      try {
        if (!canvasRef.current) {
          setError('Canvas not available');
          return;
        }

        const module = new Phase10IntegrationModule(config);

        // Setup callbacks
        module.onStatsUpdate = (newStats) => {
          setStats(newStats);
        };

        module.onError = (err, context) => {
          console.error(`Phase 10 Error [${context}]:`, err);
          setError(`${context}: ${err.message}`);
        };

        await module.initialize(canvasRef.current);
        moduleRef.current = module;
        setIsInitialized(true);
      } catch (err) {
        console.error('Failed to initialize Phase 10:', err);
        setError(err.message);
      }
    };

    initialize();

    return () => {
      if (moduleRef.current) {
        moduleRef.current.dispose();
      }
    };
  }, [canvasRef, config]);

  // API methods
  const updateParticles = useCallback((particles) => {
    if (moduleRef.current) {
      moduleRef.current.updateParticles(particles);
    }
  }, []);

  const switchMode = useCallback((mode, duration) => {
    if (moduleRef.current) {
      moduleRef.current.switchMode(mode, duration);
    }
  }, []);

  const setRenderMode = useCallback((mode) => {
    if (moduleRef.current) {
      moduleRef.current.setRenderMode(mode);
    }
  }, []);

  const setColorScheme = useCallback((scheme) => {
    if (moduleRef.current) {
      moduleRef.current.setColorScheme(scheme);
    }
  }, []);

  const setSimulationSpeed = useCallback((speed) => {
    if (moduleRef.current) {
      moduleRef.current.setSimulationSpeed(speed);
    }
  }, []);

  const setSimulationRunning = useCallback((running) => {
    if (moduleRef.current) {
      moduleRef.current.setSimulationRunning(running);
    }
  }, []);

  const getStatistics = useCallback(() => {
    if (moduleRef.current) {
      return moduleRef.current.getStatistics();
    }
    return null;
  }, []);

  const getDiagnostics = useCallback(() => {
    if (moduleRef.current) {
      return moduleRef.current.getDiagnostics();
    }
    return null;
  }, []);

  const getMeasurements = useCallback(() => {
    if (moduleRef.current) {
      return moduleRef.current.getMeasurements();
    }
    return null;
  }, []);

  return {
    isInitialized,
    error,
    stats,
    updateParticles,
    switchMode,
    setRenderMode,
    setColorScheme,
    setSimulationSpeed,
    setSimulationRunning,
    getStatistics,
    getDiagnostics,
    getMeasurements,
    module: moduleRef.current
  };
}

/**
 * Hook to manage Phase 10 camera controls
 * @param {Phase10IntegrationModule} module - The integration module reference
 * @returns {Object} Camera control methods
 */
export function usePhase10Camera(module) {
  const [keyframes, setKeyframes] = useState([]);
  const [isPlayingKeyframes, setIsPlayingKeyframes] = useState(false);
  const [isTracking, setIsTracking] = useState(false);
  const [cameraPathPoints, setCameraPathPoints] = useState([]);

  // Keyframe management
  const addKeyframe = useCallback((time, position, target, fov = 45) => {
    if (!module) return;

    const keyframe = { time, position, target, fov };
    setKeyframes(prev => {
      const updated = [...prev, keyframe];
      updated.sort((a, b) => a.time - b.time);
      return updated;
    });

    module.addCameraKeyframe(time, position, target, fov);
  }, [module]);

  const removeKeyframe = useCallback((index) => {
    setKeyframes(prev => prev.filter((_, i) => i !== index));
  }, []);

  const clearKeyframes = useCallback(() => {
    setKeyframes([]);
  }, []);

  const playKeyframes = useCallback((loop = false) => {
    if (!module) return;
    module.playCameraKeyframes(loop);
    setIsPlayingKeyframes(true);
  }, [module]);

  const stopKeyframes = useCallback(() => {
    if (!module) return;
    module.stopCameraKeyframes();
    setIsPlayingKeyframes(false);
  }, [module]);

  // Bezier path management
  const createBezierPath = useCallback((controlPoints) => {
    if (!module) return [];
    const path = module.createCameraPath(controlPoints);
    setCameraPathPoints(path);
    return path;
  }, [module]);

  const playBezierPath = useCallback((duration, loop = false) => {
    if (!module) return;
    module.playCameraPath(duration, loop);
  }, [module]);

  const stopBezierPath = useCallback(() => {
    if (!module) return;
    module.stopCameraPath();
  }, [module]);

  // Camera tracking
  const startTracking = useCallback((targetPosition, smoothingFactor = 0.1) => {
    if (!module) return;
    module.startCameraTracking(targetPosition, smoothingFactor);
    setIsTracking(true);
  }, [module]);

  const stopTracking = useCallback(() => {
    if (!module) return;
    module.stopCameraTracking();
    setIsTracking(false);
  }, [module]);

  // Auto-focus
  const autoFocus = useCallback((particles) => {
    if (!module) return;
    module.autoFocusCamera(particles);
  }, [module]);

  return {
    keyframes,
    isPlayingKeyframes,
    isTracking,
    cameraPathPoints,
    addKeyframe,
    removeKeyframe,
    clearKeyframes,
    playKeyframes,
    stopKeyframes,
    createBezierPath,
    playBezierPath,
    stopBezierPath,
    startTracking,
    stopTracking,
    autoFocus
  };
}

/**
 * Hook to manage Phase 10 simulation state
 * @param {Object} initialState - Initial state values
 * @returns {Object} Simulation state and update methods
 */
export function usePhase10SimulationState(initialState = {}) {
  const defaultState = {
    isPlaying: true,
    speed: 1.0,
    mode: '3D',
    renderMode: 'spheres',
    colorScheme: 'energy',
    showDiagnostics: true,
    showMeasurements: true,
    showGrid: true,
    showStats: true,
    ...initialState
  };

  const [state, setState] = useState(defaultState);

  const updateState = useCallback((updates) => {
    setState(prev => ({ ...prev, ...updates }));
  }, []);

  const togglePlayPause = useCallback(() => {
    setState(prev => ({ ...prev, isPlaying: !prev.isPlaying }));
  }, []);

  const setSpeed = useCallback((speed) => {
    setState(prev => ({ ...prev, speed: Math.max(0.1, Math.min(5, speed)) }));
  }, []);

  const switchMode = useCallback((mode) => {
    if (mode === '3D' || mode === '4D') {
      setState(prev => ({ ...prev, mode }));
    }
  }, []);

  const setRenderMode = useCallback((renderMode) => {
    setState(prev => ({ ...prev, renderMode }));
  }, []);

  const setColorScheme = useCallback((colorScheme) => {
    setState(prev => ({ ...prev, colorScheme }));
  }, []);

  const toggleDiagnostics = useCallback(() => {
    setState(prev => ({ ...prev, showDiagnostics: !prev.showDiagnostics }));
  }, []);

  const toggleMeasurements = useCallback(() => {
    setState(prev => ({ ...prev, showMeasurements: !prev.showMeasurements }));
  }, []);

  const resetState = useCallback(() => {
    setState(defaultState);
  }, [defaultState]);

  return {
    ...state,
    updateState,
    togglePlayPause,
    setSpeed,
    switchMode,
    setRenderMode,
    setColorScheme,
    toggleDiagnostics,
    toggleMeasurements,
    resetState
  };
}

export default usePhase10Integration;
