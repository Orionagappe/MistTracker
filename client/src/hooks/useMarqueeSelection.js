/**
 * useMarqueeSelection.js
 * Phase 9.3: Drag-to-select box (marquee) implementation
 * 
 * Enables selection of multiple objects by dragging a selection box
 * Shows visual feedback during drag, calculates intersecting objects
 */

import { useState, useCallback, useRef } from 'react';

/**
 * useMarqueeSelection Hook
 * 
 * @param {Object} cameraRef - Three.js camera reference
 * @param {Object} raycasterRef - Three.js raycaster reference
 * @param {Object} objectsRef - Reference to scene objects
 * @param {Function} onItemsSelected - Callback with selected item IDs
 * @returns {Object} Marquee state and handlers
 */
export function useMarqueeSelection(
  cameraRef,
  raycasterRef,
  objectsRef,
  onItemsSelected,
  enabled = true
) {
  const [marqueeStart, setMarqueeStart] = useState(null);
  const [marqueeEnd, setMarqueeEnd] = useState(null);
  const [isMarqueeActive, setIsMarqueeActive] = useState(false);

  /**
   * Start marquee selection
   */
  const startMarquee = useCallback((event) => {
    if (!enabled) return;

    // Check if clicking on empty canvas (not on object)
    const rect = event.target.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    const raycaster = raycasterRef.current;
    const camera = cameraRef.current;

    if (!raycaster || !camera) return;

    // Normalize coordinates
    const normalizedX = (x / rect.width) * 2 - 1;
    const normalizedY = -(y / rect.height) * 2 + 1;

    raycaster.setFromCamera({ x: normalizedX, y: normalizedY }, camera);

    // Check if raycaster hits any object
    const intersects = raycaster.intersectObjects(objectsRef.current || []);

    // Only start marquee if no object hit
    if (intersects.length === 0) {
      setMarqueeStart({ x, y });
      setMarqueeEnd({ x, y });
      setIsMarqueeActive(true);
    }
  }, [cameraRef, raycasterRef, objectsRef, enabled]);

  /**
   * Update marquee during drag
   */
  const updateMarquee = useCallback((event) => {
    if (!isMarqueeActive) return;

    const rect = event.target.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    setMarqueeEnd({ x, y });
  }, [isMarqueeActive]);

  /**
   * End marquee selection and get intersected objects
   */
  const endMarquee = useCallback(() => {
    if (!isMarqueeActive || !marqueeStart || !marqueeEnd) {
      setIsMarqueeActive(false);
      return;
    }

    const selectedIds = getItemsInMarqueeBox(
      marqueeStart,
      marqueeEnd,
      cameraRef.current,
      raycasterRef.current,
      objectsRef.current
    );

    onItemsSelected?.(selectedIds);

    // Clear marquee
    setMarqueeStart(null);
    setMarqueeEnd(null);
    setIsMarqueeActive(false);
  }, [isMarqueeActive, marqueeStart, marqueeEnd, cameraRef, raycasterRef, objectsRef, onItemsSelected]);

  /**
   * Get marquee box bounds
   */
  const getMarqueeBox = useCallback(() => {
    if (!marqueeStart || !marqueeEnd) return null;

    return {
      x1: Math.min(marqueeStart.x, marqueeEnd.x),
      y1: Math.min(marqueeStart.y, marqueeEnd.y),
      x2: Math.max(marqueeStart.x, marqueeEnd.x),
      y2: Math.max(marqueeStart.y, marqueeEnd.y),
      width: Math.abs(marqueeEnd.x - marqueeStart.x),
      height: Math.abs(marqueeEnd.y - marqueeStart.y)
    };
  }, [marqueeStart, marqueeEnd]);

  /**
   * Get box area (for minimum drag threshold)
   */
  const getMarqueeArea = useCallback(() => {
    const box = getMarqueeBox();
    if (!box) return 0;
    return box.width * box.height;
  }, [getMarqueeBox]);

  /**
   * Clear marquee selection
   */
  const clearMarquee = useCallback(() => {
    setMarqueeStart(null);
    setMarqueeEnd(null);
    setIsMarqueeActive(false);
  }, []);

  return {
    // State
    isMarqueeActive,
    marqueeStart,
    marqueeEnd,
    marqueeBox: getMarqueeBox(),
    marqueeArea: getMarqueeArea(),

    // Handlers
    startMarquee,
    updateMarquee,
    endMarquee,
    clearMarquee,

    // Utils
    hasMarquee: marqueeStart !== null && marqueeEnd !== null
  };
}

/**
 * Get items within marquee selection box
 * Uses camera projection to convert 3D positions to 2D screen coords
 * 
 * @param {Object} start - Start point { x, y }
 * @param {Object} end - End point { x, y }
 * @param {Object} camera - Three.js camera
 * @param {Object} raycaster - Three.js raycaster
 * @param {Array} objects - 3D objects to test
 * @returns {Array} IDs of objects within marquee
 */
export function getItemsInMarqueeBox(start, end, camera, raycaster, objects) {
  if (!camera || !objects) return [];

  const THREE = require('three');

  // Calculate screen-space box bounds
  const minX = Math.min(start.x, end.x);
  const maxX = Math.max(start.x, end.x);
  const minY = Math.min(start.y, end.y);
  const maxY = Math.max(start.y, end.y);

  // Minimum threshold (ignore accidental clicks)
  const minDimension = 5; // pixels
  if (Math.abs(end.x - start.x) < minDimension && Math.abs(end.y - start.y) < minDimension) {
    return [];
  }

  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;

  const selectedIds = [];

  // Test each object
  objects.forEach(obj => {
    // Project object position to screen space
    const projectedPos = new THREE.Vector3().copy(obj.position);
    projectedPos.project(camera);

    // Convert from normalized coords (-1 to 1) to screen coords (0 to width/height)
    const screenX = (projectedPos.x + 1) * viewportWidth / 2;
    const screenY = (1 - projectedPos.y) * viewportHeight / 2;

    // Check if within marquee box
    if (screenX >= minX && screenX <= maxX && screenY >= minY && screenY <= maxY) {
      if (obj.userData && obj.userData.id) {
        selectedIds.push(obj.userData.id);
      }
    }
  });

  return selectedIds;
}

export default useMarqueeSelection;
