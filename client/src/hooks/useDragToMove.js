/**
 * useDragToMove.js - Hook for drag-to-move atoms in builder
 * Phase 9.1: Drag-to-Move Enhancement
 *
 * Handles:
 * - Detecting atom selection/dragging
 * - Updating atom position during drag
 * - Visual feedback (highlight/glow)
 * - Integration with undo/redo system
 */

import { useRef, useCallback, useEffect } from 'react';
import * as THREE from 'three';

/**
 * Custom hook for managing drag-to-move interactions
 *
 * @param {THREE.Scene} scene - Three.js scene reference
 * @param {THREE.Camera} camera - Three.js camera reference
 * @param {THREE.Raycaster} raycaster - Three.js raycaster for ray casting
 * @param {Array} objectsRef - Reference to all scene objects
 * @param {Function} onAtomMove - Callback when atom is moved: (atomId, newPosition)
 * @param {Function} onDragStart - Callback when drag starts: (atomId, oldPosition)
 * @param {Function} onDragEnd - Callback when drag ends: (atomId, oldPosition, newPosition)
 * @param {boolean} enabled - Whether drag-to-move is enabled
 *
 * @returns {Object} - { isDragging, draggedAtom, dragFeedback }
 */
export const useDragToMove = (
  scene,
  camera,
  raycaster,
  objectsRef,
  onAtomMove,
  onDragStart,
  onDragEnd,
  enabled = true
) => {
  const dragStateRef = useRef({
    isDragging: false,
    draggedObject: null,
    startPosition: null,
    originalMaterial: null,
    plane: null
  });

  const canvasRef = useRef(null);
  const draggingAtomRef = useRef(null);

  /**
   * Create visual feedback for dragging (glow/highlight effect)
   */
  const applyDragFeedback = useCallback((mesh) => {
    if (!mesh) return;

    // Save original material
    dragStateRef.current.originalMaterial = mesh.material.clone();

    // Create glowing material
    const glowMaterial = new THREE.MeshPhongMaterial({
      color: mesh.material.color,
      emissive: 0xffff00,
      emissiveIntensity: 0.5,
      transparent: true,
      opacity: 0.9
    });

    mesh.material = glowMaterial;

    // Add scale animation
    const originalScale = mesh.scale.clone();
    mesh.scale.multiplyScalar(1.1);
    mesh.userData.originalScale = originalScale;
  }, []);

  /**
   * Remove visual feedback from dragging
   */
  const removeDragFeedback = useCallback((mesh) => {
    if (!mesh) return;

    // Restore original material
    if (dragStateRef.current.originalMaterial) {
      mesh.material = dragStateRef.current.originalMaterial;
    }

    // Restore scale
    if (mesh.userData.originalScale) {
      mesh.scale.copy(mesh.userData.originalScale);
      delete mesh.userData.originalScale;
    }
  }, []);

  /**
   * Handle mouse down - start dragging
   */
  const handleMouseDown = useCallback(
    (event) => {
      // Only trigger on left mouse button
      if (event.button !== 0) return;

      if (!enabled || !canvasRef.current || !scene || !camera || !raycaster) {
        if (!camera || !raycaster) {
          console.warn('Camera or raycaster not available for drag start');
        }
        return;
      }

      const rect = canvasRef.current.getBoundingClientRect();
      const mouse = new THREE.Vector2(
        ((event.clientX - rect.left) / rect.width) * 2 - 1,
        -((event.clientY - rect.top) / rect.height) * 2 + 1
      );

      try {
        // Cast ray to find intersected objects
        raycaster.setFromCamera(mouse, camera);
        const intersects = raycaster.intersectObjects(scene.children, true);

        // Find first atom/emitter
        for (let intersection of intersects) {
          const obj = intersection.object;
          if (obj.userData.type === 'atom' || obj.userData.type === 'emitter') {
            dragStateRef.current.isDragging = true;
            dragStateRef.current.draggedObject = obj;
            dragStateRef.current.startPosition = obj.position.clone();

            // Create drag plane at object's y position
            dragStateRef.current.plane = new THREE.Plane(
              new THREE.Vector3(0, 1, 0),
              -obj.position.y
            );

            // Apply visual feedback
            applyDragFeedback(obj);
            draggingAtomRef.current = obj.userData.id;

            console.log(`✋ Drag started for ${obj.userData.id}`);

            // Call drag start callback
            if (onDragStart) {
              onDragStart(obj.userData.id, [
                obj.position.x,
                obj.position.y,
                obj.position.z
              ]);
            }

            break;
          }
        }
      } catch (err) {
        console.warn('Error during drag start:', err.message);
      }
    },
    [enabled, scene, camera, raycaster, applyDragFeedback, onDragStart]
  );

  /**
   * Handle mouse move - update position during drag
   */
  const handleMouseMove = useCallback(
    (event) => {
      if (!dragStateRef.current.isDragging || !canvasRef.current) return;
      
      // Safety checks for camera and raycaster
      if (!camera || !raycaster) {
        console.warn('Camera or raycaster not available for drag move');
        return;
      }

      const rect = canvasRef.current.getBoundingClientRect();
      const mouse = new THREE.Vector2(
        ((event.clientX - rect.left) / rect.width) * 2 - 1,
        -((event.clientY - rect.top) / rect.height) * 2 + 1
      );

      try {
        // Cast ray and intersect with drag plane
        raycaster.setFromCamera(mouse, camera);
        const intersection = new THREE.Vector3();
        raycaster.ray.intersectPlane(dragStateRef.current.plane, intersection);

        // Update object position
        if (dragStateRef.current.draggedObject) {
          dragStateRef.current.draggedObject.position.x = intersection.x;
          dragStateRef.current.draggedObject.position.z = intersection.z;

          // Call on move callback
          if (onAtomMove) {
            onAtomMove(dragStateRef.current.draggedObject.userData.id, [
              intersection.x,
              intersection.y,
              intersection.z
            ]);
          }
        }
      } catch (err) {
        console.warn('Error during drag move:', err.message);
      }
    },
    [onAtomMove, camera, raycaster]
  );

  /**
   * Handle mouse up - end dragging
   */
  const handleMouseUp = useCallback(() => {
    if (!dragStateRef.current.isDragging) return;

    const draggedObject = dragStateRef.current.draggedObject;
    const startPosition = dragStateRef.current.startPosition;

    // Remove visual feedback
    removeDragFeedback(draggedObject);

    const endPosition = [
      draggedObject.position.x,
      draggedObject.position.y,
      draggedObject.position.z
    ];

    // Call drag end callback
    if (onDragEnd && startPosition) {
      onDragEnd(draggedObject.userData.id, [
        startPosition.x,
        startPosition.y,
        startPosition.z
      ], endPosition);
    }

    // Reset drag state
    dragStateRef.current = {
      isDragging: false,
      draggedObject: null,
      startPosition: null,
      originalMaterial: null,
      plane: null
    };

    draggingAtomRef.current = null;
  }, [removeDragFeedback, onDragEnd]);

  /**
   * Setup event listeners
   */
  useEffect(() => {
    if (!enabled || !scene || !camera || !raycaster) {
      console.log('⏳ Waiting for scene to be initialized before attaching drag listeners');
      return;
    }

    const canvas = document.querySelector('canvas');
    if (!canvas) return;

    canvasRef.current = canvas;

    canvas.addEventListener('mousedown', handleMouseDown);
    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('mouseup', handleMouseUp);
    canvas.addEventListener('mouseleave', handleMouseUp); // Stop dragging if mouse leaves

    return () => {
      canvas.removeEventListener('mousedown', handleMouseDown);
      canvas.removeEventListener('mousemove', handleMouseMove);
      canvas.removeEventListener('mouseup', handleMouseUp);
      canvas.removeEventListener('mouseleave', handleMouseUp);
    };
  }, [enabled, scene, camera, raycaster, handleMouseDown, handleMouseMove, handleMouseUp]);

  return {
    isDragging: dragStateRef.current.isDragging,
    draggedAtom: draggingAtomRef.current,
    dragFeedback: {
      isDragging: dragStateRef.current.isDragging,
      objectId: dragStateRef.current.draggedObject?.userData.id
    }
  };
};

export default useDragToMove;

/**
 * Helper: Update atom position in state array
 * Used by components that integrate drag-to-move
 */
export const updateAtomPosition = (atoms, atomId, newPosition) => {
  return atoms.map(atom =>
    atom.id === atomId
      ? { ...atom, position: newPosition }
      : atom
  );
};

/**
 * Helper: Update emitter position in state array
 */
export const updateEmitterPosition = (emitters, emitterId, newPosition) => {
  return emitters.map(emitter =>
    emitter.id === emitterId
      ? { ...emitter, position: newPosition }
      : emitter
  );
};
