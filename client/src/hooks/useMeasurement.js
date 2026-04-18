/**
 * useMeasurement.js
 * Phase 9.4: React hooks for measurement system
 * 
 * Provides:
 * - useMeasurement: Main hook for measurement management
 * - useSnap: Point snapping to geometry
 * - useMeasurementHistory: Undo/redo functionality
 * - useMeasurementKeyboard: Keyboard shortcuts
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { MeasurementEngine } from '../utils/MeasurementEngine';

/**
 * Main hook for managing measurements
 */
export function useMeasurement(options = {}) {
  const engineRef = useRef(new MeasurementEngine(options));
  const [points, setPoints] = useState([]);
  const [measurements, setMeasurements] = useState([]);
  const [mode, setMode] = useState('view'); // view, distance, angle
  const [selectedPoints, setSelectedPoints] = useState([]);
  const [units, setUnitsState] = useState(options.units || 'meters');

  const engine = engineRef.current;

  /**
   * Add a measurement point
   */
  const addPoint = useCallback(
    (point) => {
      try {
        const newPoint = engine.addPoint(point);
        setPoints([...engine.points]);
        return newPoint;
      } catch (error) {
        console.error('Failed to add point:', error);
        return null;
      }
    },
    [engine]
  );

  /**
   * Remove a measurement point
   */
  const removePoint = useCallback(
    (index) => {
      try {
        engine.removePoint(index);
        setPoints([...engine.points]);
        setMeasurements([...engine.measurements]);
      } catch (error) {
        console.error('Failed to remove point:', error);
      }
    },
    [engine]
  );

  /**
   * Add distance measurement
   */
  const addDistance = useCallback(
    (idx1, idx2, label) => {
      try {
        const measurement = engine.addDistanceMeasurement(idx1, idx2, label);
        setMeasurements([...engine.measurements]);
        return measurement;
      } catch (error) {
        console.error('Failed to add distance:', error);
        return null;
      }
    },
    [engine]
  );

  /**
   * Add angle measurement
   */
  const addAngle = useCallback(
    (idx1, idx2, idx3, label) => {
      try {
        const measurement = engine.addAngleMeasurement(idx1, idx2, idx3, label);
        setMeasurements([...engine.measurements]);
        return measurement;
      } catch (error) {
        console.error('Failed to add angle:', error);
        return null;
      }
    },
    [engine]
  );

  /**
   * Calculate surface area
   */
  const getSurfaceArea = useCallback(
    (pointIndices) => {
      try {
        return engine.calculateSurfaceArea(pointIndices);
      } catch (error) {
        console.error('Failed to calculate surface area:', error);
        return null;
      }
    },
    [engine]
  );

  /**
   * Calculate volume
   */
  const getVolume = useCallback(
    (pointIndices) => {
      try {
        return engine.calculateVolume(pointIndices);
      } catch (error) {
        console.error('Failed to calculate volume:', error);
        return null;
      }
    },
    [engine]
  );

  /**
   * Clear all measurements
   */
  const clear = useCallback(() => {
    engine.clear();
    setPoints([]);
    setMeasurements([]);
    setSelectedPoints([]);
  }, [engine]);

  /**
   * Get measurement report
   */
  const getReport = useCallback(() => {
    return engine.getMeasurementReport();
  }, [engine]);

  /**
   * Export measurements
   */
  const exportData = useCallback(() => {
    return engine.exportMeasurements();
  }, [engine]);

  /**
   * Import measurements
   */
  const importData = useCallback((data) => {
    try {
      engine.importMeasurements(data);
      setPoints([...engine.points]);
      setMeasurements([...engine.measurements]);
      setUnitsState(data.units || 'meters');
    } catch (error) {
      console.error('Failed to import measurements:', error);
    }
  }, [engine]);

  /**
   * Set active measurement mode
   */
  const setMeasureMode = useCallback((newMode) => {
    setMode(newMode);
    if (newMode === 'view') {
      setSelectedPoints([]);
    }
  }, []);

  /**
   * Toggle point selection
   */
  const togglePointSelection = useCallback((index) => {
    setSelectedPoints((prev) => {
      if (prev.includes(index)) {
        return prev.filter((i) => i !== index);
      }
      return [...prev, index];
    });
  }, []);

  /**
   * Undo last action
   */
  const undo = useCallback(() => {
    if (engine.canUndo()) {
      engine.undo();
      setPoints([...engine.points]);
      setMeasurements([...engine.measurements]);
    }
  }, [engine]);

  /**
   * Redo last undone action
   */
  const redo = useCallback(() => {
    if (engine.canRedo()) {
      engine.redo();
      setPoints([...engine.points]);
      setMeasurements([...engine.measurements]);
    }
  }, [engine]);

  return {
    points,
    measurements,
    mode,
    selectedPoints,
    units,
    addPoint,
    removePoint,
    addDistance,
    addAngle,
    getSurfaceArea,
    getVolume,
    clear,
    getReport,
    exportData,
    importData,
    setMeasureMode,
    togglePointSelection,
    undo,
    redo,
    canUndo: engine.canUndo(),
    canRedo: engine.canRedo(),
    engine
  };
}

/**
 * Hook for point snapping to geometry
 */
export function useSnap(geometry, enabled = true) {
  const snapRef = useRef({
    snapDistance: 10, // pixels
    snapTargets: []
  });

  /**
   * Find nearest geometry point
   */
  const snapToPoint = useCallback(
    (screenPoint) => {
      if (!enabled || !geometry) return screenPoint;

      const snap = snapRef.current;
      let nearestTarget = null;
      let minDistance = snap.snapDistance;

      for (const target of snap.snapTargets) {
        const distance = Math.sqrt(
          Math.pow(screenPoint.x - target.screenX, 2) +
            Math.pow(screenPoint.y - target.screenY, 2)
        );

        if (distance < minDistance) {
          minDistance = distance;
          nearestTarget = target;
        }
      }

      return nearestTarget ? nearestTarget.worldPoint : screenPoint;
    },
    [enabled, geometry]
  );

  /**
   * Update snap targets from geometry
   */
  const updateSnapTargets = useCallback((targets) => {
    snapRef.current.snapTargets = targets;
  }, []);

  /**
   * Set snap distance threshold
   */
  const setSnapDistance = useCallback((distance) => {
    snapRef.current.snapDistance = distance;
  }, []);

  return {
    snapToPoint,
    updateSnapTargets,
    setSnapDistance,
    snapDistance: snapRef.current.snapDistance
  };
}

/**
 * Hook for measurement undo/redo
 */
export function useMeasurementHistory(engine) {
  const [canUndo, setCanUndo] = useState(engine.canUndo());
  const [canRedo, setCanRedo] = useState(engine.canRedo());

  const updateHistory = useCallback(() => {
    setCanUndo(engine.canUndo());
    setCanRedo(engine.canRedo());
  }, [engine]);

  const undo = useCallback(() => {
    engine.undo();
    updateHistory();
  }, [engine, updateHistory]);

  const redo = useCallback(() => {
    engine.redo();
    updateHistory();
  }, [engine, updateHistory]);

  return {
    undo,
    redo,
    canUndo,
    canRedo
  };
}

/**
 * Hook for keyboard shortcuts in measurement mode
 */
export function useMeasurementKeyboard(callbacks = {}) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Ctrl/Cmd + M: Toggle measure mode
      if ((e.ctrlKey || e.metaKey) && e.key === 'm') {
        e.preventDefault();
        callbacks.onToggleMeasure?.();
      }

      // Ctrl/Cmd + Z: Undo
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        callbacks.onUndo?.();
      }

      // Ctrl/Cmd + Shift + Z: Redo
      if ((e.ctrlKey || e.metaKey) && (e.key === 'z' && e.shiftKey || e.key === 'y')) {
        e.preventDefault();
        callbacks.onRedo?.();
      }

      // Delete: Clear measurements
      if (e.key === 'Delete') {
        callbacks.onClear?.();
      }

      // G: Toggle grid overlay
      if (e.key === 'g' || e.key === 'G') {
        callbacks.onToggleGrid?.();
      }

      // E: Export measurements
      if (e.key === 'e' || e.key === 'E') {
        callbacks.onExport?.();
      }

      // I: Import measurements
      if (e.key === 'i' || e.key === 'I') {
        callbacks.onImport?.();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [callbacks]);
}

/**
 * Hook for batch measurements
 */
export function useBatchMeasurements(engine) {
  const [batch, setBatch] = useState([]);

  const startBatch = useCallback(() => {
    setBatch([]);
  }, []);

  const addToBatch = useCallback((measurement) => {
    setBatch((prev) => [...prev, measurement]);
  }, []);

  const clearBatch = useCallback(() => {
    setBatch([]);
  }, []);

  const applyBatch = useCallback(() => {
    return {
      count: batch.length,
      measurements: [...batch]
    };
  }, [batch]);

  return {
    batch,
    startBatch,
    addToBatch,
    clearBatch,
    applyBatch
  };
}

export default useMeasurement;
