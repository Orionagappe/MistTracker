/**
 * Hyperbolic Rubik's Cube React Component
 * 
 * Visual rendering and interactive controls for the hyperbolic cube mini-game.
 * Uses Three.js for 3D rendering with Poincaré disk model representation.
 */

import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import HyperbolicRubiksCube from '../hyperbolic-cube.js';

const HyperbolicRubiksCubeGame = ({ onSolve, difficulty = 'medium' }) => {
  const containerRef = useRef(null);
  const sceneRef = useRef(null);
  const rendererRef = useRef(null);
  const cubeRef = useRef(null);
  const meshRef = useRef(null);
  
  const [gameState, setGameState] = useState({
    isSolved: false,
    complexity: 0,
    moves: 0,
    timeElapsed: 0,
    scrambled: false
  });

  /**
   * Initialize the hyperbolic cube and Three.js scene
   */
  useEffect(() => {
    if (!containerRef.current) return;

    // Initialize hyperbolic cube
    cubeRef.current = new HyperbolicRubiksCube(3, -1.0);
    
    // Determine difficulty
    const scrambleMoves = difficulty === 'easy' ? 5 : difficulty === 'hard' ? 30 : 15;
    cubeRef.current.scramble(scrambleMoves);
    
    // Create Three.js scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x111122);
    
    const camera = new THREE.PerspectiveCamera(
      75,
      containerRef.current.clientWidth / containerRef.current.clientHeight,
      0.1,
      1000
    );
    camera.position.z = 5;
    
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
    renderer.shadowMap.enabled = true;
    containerRef.current.appendChild(renderer.domElement);
    
    // Create cube mesh
    createCubeMesh(scene);
    
    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);
    
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(5, 5, 5);
    directionalLight.castShadow = true;
    scene.add(directionalLight);
    
    sceneRef.current = scene;
    rendererRef.current = renderer;
    
    // Update game state
    setGameState(prev => ({
      ...prev,
      complexity: cubeRef.current.getComplexityScore(),
      scrambled: true
    }));
    
    // Render loop
    const animate = () => {
      requestAnimationFrame(animate);
      
      // Rotate cube for visual effect
      if (meshRef.current) {
        meshRef.current.rotation.x += 0.001;
        meshRef.current.rotation.y += 0.002;
      }
      
      renderer.render(scene, camera);
    };
    animate();
    
    // Handle window resize
    const handleResize = () => {
      const width = containerRef.current.clientWidth;
      const height = containerRef.current.clientHeight;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    };
    
    window.addEventListener('resize', handleResize);
    
    return () => {
      window.removeEventListener('resize', handleResize);
      if (containerRef.current && renderer.domElement.parentNode === containerRef.current) {
        containerRef.current.removeChild(renderer.domElement);
      }
    };
  }, [difficulty]);

  /**
   * Create 3D mesh representation of hyperbolic cube
   */
  const createCubeMesh = (scene) => {
    const group = new THREE.Group();
    
    // Color map for cube faces
    const colors = [
      0xff0000, // Red (X+)
      0xff8800, // Orange (X-)
      0xffff00, // Yellow (Y-)
      0xffffff, // White (Y+)
      0x0000ff, // Blue (Z-)
      0x00ff00  // Green (Z+)
    ];
    
    // Create small cubes for each position
    for (let x = 0; x < 3; x++) {
      for (let y = 0; y < 3; y++) {
        for (let z = 0; z < 3; z++) {
          const key = `${x},${y},${z}`;
          const colorIndex = cubeRef.current.getInitialFaceColor(x, y, z);
          
          if (colorIndex >= 0) {
            // Create visible cube piece
            const geometry = new THREE.BoxGeometry(0.9, 0.9, 0.9);
            const material = new THREE.MeshStandardMaterial({
              color: colors[colorIndex],
              metalness: 0.3,
              roughness: 0.4
            });
            
            const mesh = new THREE.Mesh(geometry, material);
            
            // Position in hyperbolic space (Poincaré disk projection)
            const posX = (x - 1) * 1.2;
            const posY = (y - 1) * 1.2;
            const posZ = (z - 1) * 1.2;
            
            mesh.position.set(posX, posY, posZ);
            mesh.castShadow = true;
            mesh.receiveShadow = true;
            
            group.add(mesh);
          }
        }
      }
    }
    
    // Add outer frame to show hyperbolic boundary (Poincaré disk)
    const boundaryGeometry = new THREE.SphereGeometry(3.5, 32, 32);
    const boundaryMaterial = new THREE.MeshBasicMaterial({
      color: 0x333366,
      wireframe: true,
      opacity: 0.2,
      transparent: true
    });
    const boundary = new THREE.Mesh(boundaryGeometry, boundaryMaterial);
    group.add(boundary);
    
    meshRef.current = group;
    sceneRef.current.add(group);
  };

  /**
   * Handle rotation controls
   */
  const handleRotate = (axis, layer, clockwise) => {
    if (gameState.isSolved) return;
    
    const layerIndex = parseInt(layer);
    
    if (axis === 'x') {
      cubeRef.current.rotateX(layerIndex, Math.PI / 2, clockwise);
    } else if (axis === 'y') {
      cubeRef.current.rotateY(layerIndex, Math.PI / 2, clockwise);
    } else if (axis === 'z') {
      cubeRef.current.rotateZ(layerIndex, Math.PI / 2, clockwise);
    }
    
    const newState = {
      ...gameState,
      moves: gameState.moves + 1,
      complexity: cubeRef.current.getComplexityScore()
    };
    
    if (cubeRef.current.isCubeSolved()) {
      newState.isSolved = true;
      if (onSolve) {
        onSolve({
          moves: newState.moves,
          timeElapsed: newState.timeElapsed,
          difficulty,
          complexity: gameState.complexity
        });
      }
    }
    
    setGameState(newState);
  };

  const handleScramble = () => {
    cubeRef.current.scramble(difficulty === 'easy' ? 5 : difficulty === 'hard' ? 30 : 15);
    setGameState({
      isSolved: false,
      complexity: cubeRef.current.getComplexityScore(),
      moves: 0,
      timeElapsed: 0,
      scrambled: true
    });
  };

  const handleReset = () => {
    cubeRef.current = new HyperbolicRubiksCube(3, -1.0);
    setGameState({
      isSolved: false,
      complexity: 0,
      moves: 0,
      timeElapsed: 0,
      scrambled: false
    });
  };

  return (
    <div className="hyperbolic-cube-container">
      <style>{`
        .hyperbolic-cube-container {
          width: 100%;
          height: 100vh;
          display: flex;
          flex-direction: row;
          background: #0a0a14;
          color: #e0e0ff;
          font-family: 'Courier New', monospace;
        }
        
        .cube-viewport {
          flex: 3;
          position: relative;
          overflow: hidden;
        }
        
        .cube-controls {
          flex: 1;
          padding: 20px;
          background: #1a1a2e;
          border-left: 2px solid #4a4a7a;
          display: flex;
          flex-direction: column;
          gap: 20px;
          overflow-y: auto;
        }
        
        .control-section {
          border: 1px solid #4a4a7a;
          padding: 15px;
          border-radius: 4px;
          background: #0f0f1a;
        }
        
        .control-section h3 {
          margin: 0 0 10px 0;
          color: #88ffff;
          font-size: 14px;
          text-transform: uppercase;
          letter-spacing: 1px;
        }
        
        .stat-row {
          display: flex;
          justify-content: space-between;
          padding: 5px 0;
          font-size: 13px;
          border-bottom: 1px solid #2a2a4a;
        }
        
        .stat-row:last-child {
          border-bottom: none;
        }
        
        .stat-label {
          color: #aaaacc;
        }
        
        .stat-value {
          color: #ffff88;
          font-weight: bold;
        }
        
        .rotation-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 8px;
        }
        
        .axis-group {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 8px;
        }
        
        .rot-btn {
          padding: 10px;
          background: #2a4a6a;
          border: 1px solid #4a7aaa;
          color: #aaccff;
          border-radius: 3px;
          cursor: pointer;
          font-size: 11px;
          font-weight: bold;
          transition: all 0.2s;
          text-transform: uppercase;
        }
        
        .rot-btn:hover {
          background: #3a6aaa;
          border-color: #6aaaff;
          color: #ffffff;
        }
        
        .rot-btn:active {
          background: #2a5a9a;
          transform: scale(0.95);
        }
        
        .action-btn {
          padding: 12px;
          background: #3a5a7a;
          border: 1px solid #6a8aaa;
          color: #eeffff;
          border-radius: 3px;
          cursor: pointer;
          font-size: 12px;
          font-weight: bold;
          transition: all 0.2s;
          text-transform: uppercase;
        }
        
        .action-btn:hover {
          background: #4a7aaa;
          border-color: #8accff;
          color: #ffffff;
        }
        
        .solve-message {
          padding: 15px;
          background: #2a5a2a;
          border: 2px solid #4aff4a;
          border-radius: 4px;
          color: #88ff88;
          text-align: center;
          font-weight: bold;
        }
      `}</style>
      
      <div className="cube-viewport" ref={containerRef} />
      
      <div className="cube-controls">
        <div className="control-section">
          <h3>Game Status</h3>
          <div className="stat-row">
            <span className="stat-label">Moves:</span>
            <span className="stat-value">{gameState.moves}</span>
          </div>
          <div className="stat-row">
            <span className="stat-label">Complexity:</span>
            <span className="stat-value">{gameState.complexity.toFixed(2)}</span>
          </div>
          <div className="stat-row">
            <span className="stat-label">Difficulty:</span>
            <span className="stat-value">{difficulty.toUpperCase()}</span>
          </div>
          {gameState.isSolved && (
            <div className="solve-message" style={{ marginTop: '10px' }}>
              ✓ CUBE SOLVED!
            </div>
          )}
        </div>
        
        <div className="control-section">
          <h3>X-Axis Rotations</h3>
          <div className="axis-group">
            {[0, 1, 2].map(layer => (
              <button
                key={`x-${layer}-cw`}
                className="rot-btn"
                onClick={() => handleRotate('x', layer, true)}
                disabled={gameState.isSolved}
              >
                X{layer} ↻
              </button>
            ))}
            {[0, 1, 2].map(layer => (
              <button
                key={`x-${layer}-ccw`}
                className="rot-btn"
                onClick={() => handleRotate('x', layer, false)}
                disabled={gameState.isSolved}
              >
                X{layer} ↺
              </button>
            ))}
          </div>
        </div>
        
        <div className="control-section">
          <h3>Y-Axis Rotations</h3>
          <div className="axis-group">
            {[0, 1, 2].map(layer => (
              <button
                key={`y-${layer}-cw`}
                className="rot-btn"
                onClick={() => handleRotate('y', layer, true)}
                disabled={gameState.isSolved}
              >
                Y{layer} ↻
              </button>
            ))}
            {[0, 1, 2].map(layer => (
              <button
                key={`y-${layer}-ccw`}
                className="rot-btn"
                onClick={() => handleRotate('y', layer, false)}
                disabled={gameState.isSolved}
              >
                Y{layer} ↺
              </button>
            ))}
          </div>
        </div>
        
        <div className="control-section">
          <h3>Z-Axis Rotations</h3>
          <div className="axis-group">
            {[0, 1, 2].map(layer => (
              <button
                key={`z-${layer}-cw`}
                className="rot-btn"
                onClick={() => handleRotate('z', layer, true)}
                disabled={gameState.isSolved}
              >
                Z{layer} ↻
              </button>
            ))}
            {[0, 1, 2].map(layer => (
              <button
                key={`z-${layer}-ccw`}
                className="rot-btn"
                onClick={() => handleRotate('z', layer, false)}
                disabled={gameState.isSolved}
              >
                Z{layer} ↺
              </button>
            ))}
          </div>
        </div>
        
        <div className="control-section">
          <h3>Actions</h3>
          <button className="action-btn" onClick={handleScramble}>
            New Scramble
          </button>
          <button className="action-btn" onClick={handleReset}>
            Reset Cube
          </button>
        </div>
      </div>
    </div>
  );
};

export default HyperbolicRubiksCubeGame;
