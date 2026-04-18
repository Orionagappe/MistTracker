/**
 * OrbitalVisualization.jsx - Phase 5.5: React Component
 * 
 * Integrates orbital visualization with physics updates
 * Displays electron cloud deformations from wave-orbital interactions
 */

import React, { useEffect, useRef, useState } from 'react';
import { OrbitVisualizer } from '../utils/OrbitVisualizer';

/**
 * OrbitalVisualization Component
 * Manages visualization of electron orbitals with real-time updates
 * 
 * @param {Object} scene - Three.js scene
 * @param {Object} geometry - Active geometry data
 * @param {boolean} enabled - Whether to show orbital visualizations
 * @param {Object} options - Display options {showLabels, colorMode, opacity}
 */
function OrbitalVisualization({ scene, geometry, enabled = true, options = {} }) {
  const visualizerRef = useRef(null);
  const [orbitalCount, setOrbitalCount] = useState(0);
  const [maxResponseFactor, setMaxResponseFactor] = useState(0);

  const {
    showLabels = false,
    colorMode = 'coupling', // 'coupling', 'energy', 'phase'
    opacity = 0.7,
    showGrid = false
  } = options;

  // Initialize visualizer
  useEffect(() => {
    if (!scene) return;
    
    visualizerRef.current = new OrbitVisualizer(scene);
    
    return () => {
      if (visualizerRef.current) {
        visualizerRef.current.dispose();
      }
    };
  }, [scene]);

  // Update orbitals when geometry changes
  useEffect(() => {
    if (!enabled || !visualizerRef.current || !geometry) return;

    if (geometry.electronClouds && Array.isArray(geometry.electronClouds)) {
      visualizerRef.current.updateGeometryOrbitals(
        geometry.itemId,
        geometry.electronClouds,
        geometry.atomicNumber || 1
      );

      setOrbitalCount(geometry.electronClouds.length);
      
      // Calculate max response factor
      const max = Math.max(
        ...geometry.electronClouds.map(o => o.response?.responseFactor || 0)
      );
      setMaxResponseFactor(max);
    } else if (visualizerRef.current) {
      visualizerRef.current.removeGeometryOrbitals(geometry.itemId);
      setOrbitalCount(0);
    }
  }, [geometry, enabled]);

  // Debug info
  const orbitalInfo = visualizerRef.current?.getOrbitalInfo() || [];

  return null; // This component doesn't render directly - updates Three.js scene
}

export { OrbitalVisualization };
