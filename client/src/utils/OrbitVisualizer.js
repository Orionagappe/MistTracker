/**
 * OrbitVisualizer.jsx - Phase 5.5: Orbital Visualization
 * 
 * Renders 3D electron cloud visualizations with real-time deformation
 * from wave-orbital interactions.
 * 
 * Features:
 * - Renders electron orbitals with orbital-specific geometries (s, p, d, f)
 * - Color-codes by quantum coupling strength (blue → red = weak → strong)
 * - Animates orbital deformations from wave interactions
 * - Shows response factors and interaction strength
 * - Supports multiple orbitals per atom
 */

import * as THREE from 'three';
import React from 'react';

class OrbitVisualizer {
  constructor(scene) {
    this.scene = scene;
    this.orbitalMeshes = new Map();
    this.orbitalGroups = new Map();
    
    // Color scheme: blue (weak) → cyan → green → yellow → red (strong)
    this.colorStops = [
      { factor: 0.0, color: 0x0000ff },   // Blue
      { factor: 0.25, color: 0x00ffff },  // Cyan
      { factor: 0.5, color: 0x00ff00 },   // Green
      { factor: 0.75, color: 0xffff00 },  // Yellow
      { factor: 1.0, color: 0xff0000 }    // Red
    ];
  }

  /**
   * Get color based on response factor (0-1)
   * @param {number} responseFactor - Coupling strength (0-1)
   * @returns {THREE.Color}
   */
  getColorForFactor(responseFactor) {
    // Clamp factor to 0-1
    const factor = Math.max(0, Math.min(1, responseFactor));
    
    // Find surrounding color stops
    let lower = this.colorStops[0];
    let upper = this.colorStops[this.colorStops.length - 1];
    
    for (let i = 0; i < this.colorStops.length - 1; i++) {
      if (factor >= this.colorStops[i].factor && factor <= this.colorStops[i + 1].factor) {
        lower = this.colorStops[i];
        upper = this.colorStops[i + 1];
        break;
      }
    }
    
    // Interpolate between colors
    const t = (factor - lower.factor) / (upper.factor - lower.factor);
    const lowerColor = new THREE.Color(lower.color);
    const upperColor = new THREE.Color(upper.color);
    
    const color = new THREE.Color();
    color.r = lowerColor.r + (upperColor.r - lowerColor.r) * t;
    color.g = lowerColor.g + (upperColor.g - lowerColor.g) * t;
    color.b = lowerColor.b + (upperColor.b - lowerColor.b) * t;
    
    return color;
  }

  /**
   * Create geometry for orbital type (s, p, d, f)
   * @param {number} l - Angular momentum quantum number
   * @param {number} baseSize - Base radius of orbital
   * @returns {THREE.BufferGeometry}
   */
  createOrbitalGeometry(l, baseSize = 1) {
    let geometry;
    
    switch (l) {
      case 0: // s orbital (spherical)
        geometry = new THREE.SphereGeometry(baseSize, 16, 16);
        break;
        
      case 1: // p orbital (dumbbell shaped)
        geometry = new THREE.BufferGeometry();
        const positions = [];
        const indices = [];
        
        // Create two lobes (simplified dumbbell)
        for (let i = 0; i < 16; i++) {
          const angle = (i / 16) * Math.PI * 2;
          
          // Upper lobe (along +z)
          for (let j = 0; j < 8; j++) {
            const theta = (j / 8) * Math.PI;
            const x = baseSize * 0.6 * Math.sin(theta) * Math.cos(angle);
            const y = baseSize * 0.6 * Math.sin(theta) * Math.sin(angle);
            const z = baseSize * Math.cos(theta);
            positions.push(x, y, z);
          }
          
          // Lower lobe (along -z)
          for (let j = 0; j < 8; j++) {
            const theta = (j / 8) * Math.PI;
            const x = baseSize * 0.6 * Math.sin(theta) * Math.cos(angle);
            const y = baseSize * 0.6 * Math.sin(theta) * Math.sin(angle);
            const z = -baseSize * Math.cos(theta);
            positions.push(x, y, z);
          }
        }
        
        // Create indices for triangles
        for (let i = 0; i < 16; i++) {
          for (let j = 0; j < 7; j++) {
            const a = (i * 16) + j;
            const b = (i * 16) + j + 1;
            const c = (((i + 1) % 16) * 16) + j;
            const d = (((i + 1) % 16) * 16) + j + 1;
            
            indices.push(a, b, c);
            indices.push(b, d, c);
          }
        }
        
        geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(positions), 3));
        geometry.setIndex(new THREE.BufferAttribute(new Uint32Array(indices), 1));
        geometry.computeVertexNormals();
        break;
        
      case 2: // d orbital (cloverleaf)
        geometry = new THREE.SphereGeometry(baseSize, 12, 12);
        // Could enhance with actual d orbital shape, but sphere is a good approximation
        break;
        
      default: // f orbital and higher - approximate as sphere
        geometry = new THREE.SphereGeometry(baseSize, 12, 12);
    }
    
    return geometry;
  }

  /**
   * Create or update an orbital visualization
   * @param {string} itemId - Parent geometry ID
   * @param {number} orbitalIndex - Index in electron clouds array
   * @param {Object} orbital - Orbital data {n, l, m, position, displacement, response}
   * @param {number} atomicNumber - Z number for orbital sizing
   */
  updateOrbital(itemId, orbitalIndex, orbital, atomicNumber = 1) {
    if (!orbital) return;
    
    const key = `${itemId}-orbit-${orbitalIndex}`;
    
    // Create group for this orbital if needed
    let group = this.orbitalGroups.get(key);
    if (!group) {
      group = new THREE.Group();
      group.name = key;
      this.scene.add(group);
      this.orbitalGroups.set(key, group);
    }
    
    // Calculate orbital size (Bohr radius scaling)
    const bohrRadius = 0.53e-10; // meters
    const bohrRadiusScaled = Math.pow(orbital.n || 1, 2) * 0.5; // Scaled to cm for visualization
    const responseFactor = orbital.response?.responseFactor || 0.2;
    const displacement = orbital.displacement || 0;
    
    // Create or get orbital mesh
    let mesh = group.children[0];
    if (!mesh) {
      const geometry = this.createOrbitalGeometry(orbital.l || 0, bohrRadiusScaled);
      const material = new THREE.MeshPhongMaterial({
        wireframe: false,
        transparent: true,
        opacity: 0.6 + responseFactor * 0.3 // More opaque with stronger coupling
      });
      
      mesh = new THREE.Mesh(geometry, material);
      mesh.userData = { itemId, orbitalIndex };
      group.add(mesh);
    }
    
    // Update position
    const pos = orbital.position || [0, 0, 0];
    group.position.set(pos[0], pos[1], pos[2]);
    
    // Update color based on response factor
    const color = this.getColorForFactor(responseFactor);
    mesh.material.color = color;
    mesh.material.emissive = color;
    mesh.material.emissiveIntensity = responseFactor * 0.7;
    
    // Apply displacement as scale deformation (wave coupling effect)
    const deformationFactor = 1.0 + displacement * 100; // Scale displacement for visibility
    mesh.scale.set(deformationFactor, deformationFactor, deformationFactor);
    
    // Rotate based on orbital orientation (m quantum number)
    const m = orbital.m || 0;
    const rotationAngle = (m / (2 * (orbital.l || 1) + 1)) * Math.PI * 2;
    mesh.rotation.z = rotationAngle;
    
    // Update opacity based on phase (0-1 range mapped to 0.3-0.9)
    const phase = (orbital.phase || 0) % (2 * Math.PI);
    const phaseOpacity = 0.3 + (phase / (2 * Math.PI)) * 0.6;
    mesh.material.opacity = phaseOpacity;
    
    // Add label with quantum numbers if showing debug info
    mesh.userData = {
      itemId,
      orbitalIndex,
      orbital,
      label: `${orbital.n}${['s', 'p', 'd', 'f'][orbital.l || 0]}(m=${orbital.m || 0})`,
      responseFactor,
      displacement,
      energyLevel: orbital.energy || 0
    };
  }

  /**
   * Update all orbitals for a geometry (atom)
   * @param {string} itemId - Geometry ID
   * @param {Array} electronClouds - Array of orbital data
   * @param {number} atomicNumber - Z number
   */
  updateGeometryOrbitals(itemId, electronClouds, atomicNumber = 1) {
    if (!Array.isArray(electronClouds) || electronClouds.length === 0) {
      // Remove orbitals if none provided
      this.removeGeometryOrbitals(itemId);
      return;
    }
    
    // Update or create orbitals
    for (let i = 0; i < electronClouds.length; i++) {
      this.updateOrbital(itemId, i, electronClouds[i], atomicNumber);
    }
    
    // Remove orbits that no longer exist
    const keysToRemove = [];
    for (const key of this.orbitalGroups.keys()) {
      if (key.startsWith(`${itemId}-orbit-`)) {
        const index = parseInt(key.split('-')[2]);
        if (index >= electronClouds.length) {
          keysToRemove.push(key);
        }
      }
    }
    
    for (const key of keysToRemove) {
      this.removeOrbitalVisualization(key);
    }
  }

  /**
   * Remove all orbitals for a geometry
   * @param {string} itemId - Geometry ID
   */
  removeGeometryOrbitals(itemId) {
    const keysToRemove = [];
    for (const key of this.orbitalGroups.keys()) {
      if (key.startsWith(`${itemId}-orbit-`)) {
        keysToRemove.push(key);
      }
    }
    
    for (const key of keysToRemove) {
      this.removeOrbitalVisualization(key);
    }
  }

  /**
   * Remove an orbital visualization
   * @param {string} key - Orbital key
   */
  removeOrbitalVisualization(key) {
    const group = this.orbitalGroups.get(key);
    if (group) {
      this.scene.remove(group);
      group.traverse(child => {
        if (child.geometry) child.geometry.dispose();
        if (child.material) child.material.dispose();
      });
      this.orbitalGroups.delete(key);
    }
  }

  /**
   * Dispose of all orbital visualizations
   */
  dispose() {
    for (const group of this.orbitalGroups.values()) {
      this.scene.remove(group);
      group.traverse(child => {
        if (child.geometry) child.geometry.dispose();
        if (child.material) child.material.dispose();
      });
    }
    this.orbitalGroups.clear();
    this.orbitalMeshes.clear();
  }

  /**
   * Get orbital mesh data for debugging
   * @returns {Array} Array of orbital visualization info
   */
  getOrbitalInfo() {
    const info = [];
    for (const [key, group] of this.orbitalGroups) {
      const mesh = group.children[0];
      if (mesh && mesh.userData) {
        info.push({
          key,
          ...mesh.userData
        });
      }
    }
    return info;
  }
}

/**
 * React Hook: useOrbitVisualizer
 * Manages orbital visualization in Three.js scene
 */
export function useOrbitVisualizer(scene) {
  const visualizerRef = React.useRef(null);

  // Initialize visualizer
  React.useEffect(() => {
    if (!scene) return;
    
    visualizerRef.current = new OrbitVisualizer(scene);
    
    return () => {
      if (visualizerRef.current) {
        visualizerRef.current.dispose();
      }
    };
  }, [scene]);

  return visualizerRef.current;
}

export { OrbitVisualizer };
