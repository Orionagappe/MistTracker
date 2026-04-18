import { useState, useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { usePhysics } from '../hooks/usePhysics';
import { useWebSocket } from '../hooks/useWebSocket';
import { useBuilderConfigLoader } from '../hooks/useBuilderConfigLoader';
import { OrbitVisualizer } from '../utils/OrbitVisualizer';
import { ParticleVisualizer } from '../utils/ParticleVisualizer';
import '../styles/PhysicsVisualization.css';

/**
 * PhysicsVisualization Component
 * Renders 3D physics simulation with real-time updates
 * Integrates with physics engine for wave-based interactions
 * 
 * Props:
 * - timeline: Current timeline object
 * - isPlacingEmitter: Whether emitter placement mode is active
 * - emitterSettings: Settings for new emitters
 * - builderAtoms: Atoms from builder to import (Phase 7.4)
 * - builderEmitters: Emitters from builder to import (Phase 7.4)
 */
function PhysicsVisualization({ timeline, isPlacingEmitter = false, emitterSettings = {}, builderAtoms = [], builderEmitters = [] }) {
  const canvasRef = useRef(null);
  const sceneRef = useRef(null);
  const cameraRef = useRef(null);
  const rendererRef = useRef(null);
  const controlsRef = useRef(null);
  const meshesRef = useRef(new Map());
  const waveEmitterMeshesRef = useRef(new Map());
  const orbitVisualizerRef = useRef(null);
  const particleVisualizerRef = useRef(null);
  
  const [isInitialized, setIsInitialized] = useState(false);
  const [error, setError] = useState(null);
  const [simulationRunning, setSimulationRunning] = useState(true);
  const [stats, setStats] = useState(null);
  const [showStats, setShowStats] = useState(true);
  const [cameraMode, setCameraMode] = useState('orbit'); // 'orbit' or 'fixed'
  const [showOrbitals, setShowOrbitals] = useState(true);
  const [showParticles, setShowParticles] = useState(true);

  // Raycaster for emitter placement
  const raycasterRef = useRef(new THREE.Raycaster());
  const mouseRef = useRef(new THREE.Vector2());
  const builderGeometriesLoadedRef = useRef({ loaded: false, signature: '' });

  // WebSocket integration
  const wsConnection = useWebSocket();

  // Config loader for loading saved builder configs from DB
  const configLoader = useBuilderConfigLoader(timeline?.id);

  // Physics integration - pass scene, null for physicsState (fetched from server), wsConnection, and options
  const physics = usePhysics(sceneRef.current, null, wsConnection, { enableVisualization: true });

  /**
   * Initialize Three.js scene
   */
  useEffect(() => {
    if (!canvasRef.current) return;

    try {
      // Scene setup
      const scene = new THREE.Scene();
      scene.background = new THREE.Color(0x1a1a2e);
      scene.fog = new THREE.Fog(0x1a1a2e, 300, 1000);
      sceneRef.current = scene;

      // Camera
      const width = canvasRef.current.clientWidth;
      const height = canvasRef.current.clientHeight;
      const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 10000);
      camera.position.set(0, 50, 50);
      camera.lookAt(0, 0, 0);
      cameraRef.current = camera;

      // Renderer
      const renderer = new THREE.WebGLRenderer({
        canvas: canvasRef.current,
        antialias: true,
        powerPreference: 'high-performance'
      });
      renderer.setSize(width, height);
      renderer.setPixelRatio(window.devicePixelRatio);
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      rendererRef.current = renderer;

      // Orbit Controls
      const controls = new OrbitControls(camera, renderer.domElement);
      controls.enableDamping = true;
      controls.dampingFactor = 0.05;
      controls.autoRotate = false;
      controls.enablePan = true;
      controls.enableZoom = true;
      controlsRef.current = controls;

      // Lighting
      const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
      scene.add(ambientLight);

      const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
      directionalLight.position.set(100, 100, 50);
      directionalLight.castShadow = true;
      directionalLight.shadow.mapSize.width = 2048;
      directionalLight.shadow.mapSize.height = 2048;
      directionalLight.shadow.camera.left = -200;
      directionalLight.shadow.camera.right = 200;
      directionalLight.shadow.camera.top = 200;
      directionalLight.shadow.camera.bottom = -200;
      scene.add(directionalLight);

      // Grid
      const gridHelper = new THREE.GridHelper(200, 20, 0x444444, 0x222222);
      scene.add(gridHelper);

      // Axes
      const axesHelper = new THREE.AxesHelper(50);
      scene.add(axesHelper);

      // Origin sphere
      const originGeometry = new THREE.SphereGeometry(2, 16, 16);
      const originMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff });
      const originMesh = new THREE.Mesh(originGeometry, originMaterial);
      scene.add(originMesh);

      // Initialize orbit visualizer for Phase 5.5
      orbitVisualizerRef.current = new OrbitVisualizer(scene);

      // Initialize particle visualizer for Phase 5.6
      particleVisualizerRef.current = new ParticleVisualizer(scene);

      // Animation loop
      let animationId;
      const animate = () => {
        animationId = requestAnimationFrame(animate);

        // Update controls every frame
        if (controlsRef.current) {
          controlsRef.current.update();
        }

        // Update physics visualization
        if (physics && physics.activeGeometries) {
          updateGeometryMeshes();
          updateTensorFieldVisuals();
          updateWaveEmitterMeshes();
        }

        // Update particle visualization
        if (showParticles && particleVisualizerRef.current && physics && physics.particleInteractions) {
          particleVisualizerRef.current.addParticles(physics.particleInteractions);
          particleVisualizerRef.current.updateParticles(0.016);
        }

        renderer.render(scene, camera);
      };

      animate();

      setIsInitialized(true);

      // Handle resize - called on window resize AND fullscreen change
      const handleResize = () => {
        if (!canvasRef.current) return;
        const newWidth = canvasRef.current.clientWidth;
        const newHeight = canvasRef.current.clientHeight;
        if (newWidth > 0 && newHeight > 0) {
          camera.aspect = newWidth / newHeight;
          camera.updateProjectionMatrix();
          renderer.setSize(newWidth, newHeight);
        }
      };

      window.addEventListener('resize', handleResize);
      document.addEventListener('fullscreenchange', handleResize);
      document.addEventListener('webkitfullscreenchange', handleResize);

      return () => {
        window.removeEventListener('resize', handleResize);
        document.removeEventListener('fullscreenchange', handleResize);
        document.removeEventListener('webkitfullscreenchange', handleResize);
        cancelAnimationFrame(animationId);
        
        // Dispose orbit visualizer
        if (orbitVisualizerRef.current) {
          orbitVisualizerRef.current.dispose();
        }

        // Dispose particle visualizer
        if (particleVisualizerRef.current) {
          particleVisualizerRef.current.dispose();
        }
        
        renderer.dispose();
      };
    } catch (err) {
      setError(`Failed to initialize visualization: ${err.message}`);
      console.error(err);
    }
  }, []);

  /**
   * Effect: Load builder configuration into simulation
   * Creates geometry and emitter objects from builder atoms and emitters
   * Phase 7.4: Import builder config when switching to simulate mode
   */
  useEffect(() => {
    try {
      if (!wsConnection) {
        console.log('⏳ WebSocket connection not available yet');
        return;
      }

      // Check if WebSocket is actually connected
      if (!wsConnection.isConnected) {
        console.log(`⏳ WebSocket connecting... (status: ${wsConnection.connectionStatus})`);
        return;
      }

      if (!wsConnection.sendGeometryCreate) {
        console.warn('⚠ sendGeometryCreate method not available on wsConnection');
        return;
      }
      
      if (!isInitialized) {
        console.log('⏳ PhysicsVisualization not initialized yet');
        return;
      }

      // Only load once per scene initialization to avoid duplicates
      if (builderGeometriesLoadedRef.current?.loaded) {
        return;
      }

      // Skip if no atoms or emitters
      if (!builderAtoms?.length && !builderEmitters?.length) {
        console.log('📊 No atoms or emitters to load');
        return;
      }

      console.log(`📊 Attempting to load: ${builderAtoms?.length || 0} atoms, ${builderEmitters?.length || 0} emitters`);

      // Create geometries from builder atoms
      if (builderAtoms?.length > 0) {
        console.log(`📐 Loading ${builderAtoms.length} atoms from builder configuration...`);
        
        builderAtoms.forEach((atom, idx) => {
          try {
            if (!atom || !atom.position) {
              console.warn(`Skipping invalid atom at index ${idx}`);
              return;
            }

            const position = atom.position || [idx * 30 - (builderAtoms.length * 15), 0, 0];
            const color = atom.color || '#44dd88';
            const atomId = atom.id || `atom-sim-${idx}`;
            
            // Send geometry create message for this atom
            const success = wsConnection.sendGeometryCreate(
              atomId,
              'sphere',
              { x: position[0], y: position[1], z: position[2] },
              { x: 8, y: 8, z: 8 },
              { x: 0, y: 0, z: 0 },
              color,
              {
                orbital: atom.orbital_name || atom.orbital,
                type: 'atom'
              }
            );

            if (!success) {
              console.warn(`⚠ Failed to send geometry for atom ${idx}, WebSocket may not be connected`);
            }
          } catch (err) {
            console.error(`Failed to create geometry for atom ${idx}:`, err);
          }
        });
      }

      // Create emitters from builder emitters
      if (builderEmitters?.length > 0) {
        console.log(`📡 Loading ${builderEmitters.length} emitters from builder configuration...`);
        
        builderEmitters.forEach((emitter, idx) => {
          try {
            if (!emitter || !emitter.position) {
              console.warn(`Skipping invalid emitter at index ${idx}`);
              return;
            }

            const position = emitter.position;
            const emitterId = emitter.id || `emitter-sim-${idx}`;
            
            // Send wave emitter creation message
            if (wsConnection.sendWaveEmitter) {
              const success = wsConnection.sendWaveEmitter(
                emitterId,
                'light',
                position,
                emitter.frequency || 5000,
                emitter.amplitude || 1.0,
                1.0 // intensity
              );

              if (!success) {
                console.warn(`⚠ Failed to send emitter ${idx}, WebSocket may not be connected`);
              }
            }
          } catch (err) {
            console.error(`Failed to create emitter ${idx}:`, err);
          }
        });
      }

      if ((builderAtoms?.length || 0) > 0 || (builderEmitters?.length || 0) > 0) {
        // Mark as loaded with current signature
        const atomSignature = JSON.stringify((builderAtoms || []).map(a => [a.id, a.position, a.orbital_name]));
        const emitterSignature = JSON.stringify((builderEmitters || []).map(e => [e.id, e.position, e.frequency]));
        builderGeometriesLoadedRef.current = { 
          loaded: true,
          signature: atomSignature + emitterSignature
        };
        console.log('✓ Builder configuration loaded into simulation');
      }
    } catch (err) {
      console.error('Error loading builder configuration:', err);
      // Don't re-throw - let the component continue to work even if loading fails
    }
  }, [builderAtoms, builderEmitters, wsConnection, wsConnection?.isConnected, isInitialized]);

  /**
   * Reset builder geometries flag when atoms/emitters change content
   * This allows re-loading when user goes back to builder and makes changes
   * Creates a signature of current atoms/emitters to detect changes
   */
  useEffect(() => {
    if (!isInitialized) {
      builderGeometriesLoadedRef.current = { loaded: false, signature: '' };
      return;
    }

    // Create a signature of current atoms/emitters to detect changes
    const atomSignature = JSON.stringify(builderAtoms.map(a => [a.id, a.position, a.orbital_name]));
    const emitterSignature = JSON.stringify(builderEmitters.map(e => [e.id, e.position, e.frequency]));
    const currentSignature = atomSignature + emitterSignature;
    
    // Compare with last loaded signature
    const lastSignature = builderGeometriesLoadedRef.current?.signature || '';
    
    // If content changed, reset flag to trigger reload
    if (currentSignature !== lastSignature && currentSignature !== '') {
      console.log('📝 Builder config changed, marking for re-load');
      builderGeometriesLoadedRef.current = { loaded: false, signature: currentSignature };
    }
  }, [builderAtoms, builderEmitters, isInitialized]);

  /**
   * Phase 13: Load saved builder configuration from database
   * Triggered when timeline changes or WebSocket becomes ready
   * Falls back to localStorage cache if DB is unavailable
   * Only loads if no builder atoms/emitters were passed as props (in SIMULATE mode)
   */
  useEffect(() => {
    try {
      // Skip if we're loading config from props (BUILD mode)
      if ((builderAtoms?.length || 0) > 0 || (builderEmitters?.length || 0) > 0) {
        console.log('ℹ️ Builder config loaded from props, skipping DB load');
        return;
      }

      // Skip if required dependencies aren't ready
      if (!timeline?.id || !wsConnection || !wsConnection.isConnected || !isInitialized) {
        if (timeline?.id && wsConnection?.isConnected === false) {
          console.log('⏳ WebSocket connecting, will retry for timeline config');
        }
        return;
      }

      console.log(`📥 Loading saved configuration for timeline: ${timeline.id}`);

      // Load and send config to physics server
      configLoader.loadAndSendConfig(timeline.id, wsConnection).catch(err => {
        console.error('Error in config loader:', err);
      });

    } catch (err) {
      console.error('Error in timeline config loading effect:', err);
    }
  }, [timeline?.id, wsConnection?.isConnected, isInitialized, configLoader, builderAtoms, builderEmitters]);

  /**
  useEffect(() => {
    if (!canvasRef.current || !isInitialized) return;

    const handleCanvasClick = (event) => {
      const rect = canvasRef.current.getBoundingClientRect();
      mouseRef.current.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouseRef.current.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      raycasterRef.current.setFromCamera(mouseRef.current, cameraRef.current);

      // Create intersection point on a plane at z=0
      const plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
      const target = new THREE.Vector3();
      raycasterRef.current.ray.intersectPlane(plane, target);

      // Create emitter at clicked position
      if (physics && physics.createWaveEmitter) {
        const emitterId = `emitter-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        physics.createWaveEmitter(
          emitterId,
          emitterSettings.type,
          [target.x, target.y, target.z],
          emitterSettings.frequency,
          emitterSettings.amplitude,
          emitterSettings.intensity
        );
        console.log(`✓ Emitter placed at [${target.x.toFixed(1)}, ${target.y.toFixed(1)}, ${target.z.toFixed(1)}]`);
      }
    };

    if (isPlacingEmitter) {
      canvasRef.current.addEventListener('click', handleCanvasClick);
      canvasRef.current.style.cursor = 'crosshair';
    }

    return () => {
      if (canvasRef.current) {
        canvasRef.current.removeEventListener('click', handleCanvasClick);
        canvasRef.current.style.cursor = 'auto';
      }
    };
  }, [isPlacingEmitter, emitterSettings, physics]);

  /**
   * Update geometry meshes from physics state
   */
  const updateGeometryMeshes = () => {
    if (!physics.activeGeometries) return;

    const scene = sceneRef.current;

    physics.activeGeometries.forEach((geometry, itemId) => {
      let mesh = meshesRef.current.get(itemId);

      // Create mesh if doesn't exist
      if (!mesh) {
        const geometryType = geometry.geometryType || 'box';
        let meshGeometry;

        switch (geometryType) {
          case 'sphere':
            meshGeometry = new THREE.SphereGeometry(geometry.scale?.x || 2, 32, 32);
            break;
          case 'box':
            meshGeometry = new THREE.BoxGeometry(
              geometry.scale?.x || 2,
              geometry.scale?.y || 2,
              geometry.scale?.z || 2
            );
            break;
          case 'cylinder':
            meshGeometry = new THREE.CylinderGeometry(
              geometry.scale?.x || 2,
              geometry.scale?.x || 2,
              geometry.scale?.y || 4,
              32
            );
            break;
          default:
            meshGeometry = new THREE.BoxGeometry(2, 2, 2);
        }

        // Get energy-based color
        const energy = geometry.energy || 1;
        const normalizedEnergy = Math.min(energy / 10, 1);
        const hue = 0.6 * (1 - normalizedEnergy); // Blue to red based on energy
        const color = new THREE.Color().setHSL(hue, 1, 0.5);

        const material = new THREE.MeshPhongMaterial({
          color,
          emissive: color,
          emissiveIntensity: normalizedEnergy * 0.5,
          shininess: 100
        });

        mesh = new THREE.Mesh(meshGeometry, material);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        scene.add(mesh);
        meshesRef.current.set(itemId, mesh);
      }

      // Update position
      if (geometry.position) {
        mesh.position.set(
          geometry.position.x || 0,
          geometry.position.y || 0,
          geometry.position.z || 0
        );
      }

      // Update rotation
      if (geometry.rotation) {
        mesh.rotation.set(
          geometry.rotation.x || 0,
          geometry.rotation.y || 0,
          geometry.rotation.z || 0
        );
      }

      // Update scale
      if (geometry.scale) {
        mesh.scale.set(
          geometry.scale.x || 1,
          geometry.scale.y || 1,
          geometry.scale.z || 1
        );
      }

      // Update color based on energy
      const energy = geometry.energy || 1;
      const normalizedEnergy = Math.min(energy / 10, 1);
      const hue = 0.6 * (1 - normalizedEnergy);
      const color = new THREE.Color().setHSL(hue, 1, 0.5);

      if (mesh.material) {
        mesh.material.color.copy(color);
        mesh.material.emissive.copy(color);
        mesh.material.emissiveIntensity = normalizedEnergy * 0.5;
      }

      // Phase 5.5: Update orbital visualization for electron clouds
      if (showOrbitals && orbitVisualizerRef.current && geometry.electronClouds) {
        orbitVisualizerRef.current.updateGeometryOrbitals(
          itemId,
          geometry.electronClouds,
          geometry.atomicNumber || 1
        );
      }
    });

    // Remove meshes for deleted geometries
    for (const [itemId, mesh] of meshesRef.current.entries()) {
      if (!physics.activeGeometries.has(itemId)) {
        scene.remove(mesh);
        mesh.geometry.dispose();
        mesh.material.dispose();
        meshesRef.current.delete(itemId);
        
        // Remove orbitals for deleted geometries
        if (orbitVisualizerRef.current) {
          orbitVisualizerRef.current.removeGeometryOrbitals(itemId);
        }
      }
    }
  };

  /**
   * Update tensor field visualization
   */
  const updateTensorFieldVisuals = () => {
    if (!physics.activeTensorFields) return;

    // Tensor fields could be visualized as:
    // - Colored wireframe volumes
    // - Glyph vectors showing field direction
    // - Isosurfaces for energy levels
    // For now, we'll skip detailed rendering
  };

  /**
   * Update wave emitter visualization
   */
  const updateWaveEmitterMeshes = () => {
    if (!physics.waveEmitters) return;

    const scene = sceneRef.current;

    physics.waveEmitters.forEach((emitter, emitterId) => {
      let mesh = waveEmitterMeshesRef.current.get(emitterId);

      // Create mesh if doesn't exist
      if (!mesh) {
        const geometry = new THREE.SphereGeometry(3, 16, 16);

        // Color by type
        let color = 0xffff00; // default yellow
        if (emitter.type === 'gravity') color = 0xff0000; // red
        if (emitter.type === 'quantum') color = 0x0000ff; // blue
        if (emitter.type === 'light') color = 0xffff00; // yellow

        const material = new THREE.MeshBasicMaterial({
          color,
          wireframe: true,
          emissive: color,
          emissiveIntensity: 0.8
        });

        mesh = new THREE.Mesh(geometry, material);
        scene.add(mesh);
        waveEmitterMeshesRef.current.set(emitterId, mesh);
      }

      // Update position
      if (emitter.position) {
        mesh.position.set(
          emitter.position.x || 0,
          emitter.position.y || 0,
          emitter.position.z || 0
        );
      }

      // Pulsate based on intensity
      const scale = 1 + Math.sin(Date.now() * 0.005) * 0.3;
      mesh.scale.setScalar(scale);
    });

    // Remove meshes for deleted emitters
    for (const [emitterId, mesh] of waveEmitterMeshesRef.current.entries()) {
      if (!physics.waveEmitters.has(emitterId)) {
        scene.remove(mesh);
        mesh.geometry.dispose();
        mesh.material.dispose();
        waveEmitterMeshesRef.current.delete(emitterId);
      }
    }
  };

  /**
   * Toggle simulation pause
   */
  const handleToggleSimulation = () => {
    setSimulationRunning(!simulationRunning);
  };

  /**
   * Reset camera
   */
  const handleResetCamera = () => {
    if (cameraRef.current && controlsRef.current) {
      cameraRef.current.position.set(0, 50, 50);
      cameraRef.current.lookAt(0, 0, 0);
      controlsRef.current.target.set(0, 0, 0);
      controlsRef.current.update();
    }
  };

  /**
   * Toggle camera mode
   */
  const handleToggleCameraMode = () => {
    const newMode = cameraMode === 'orbit' ? 'fixed' : 'orbit';
    setCameraMode(newMode);
    if (controlsRef.current) {
      controlsRef.current.autoRotate = newMode === 'fixed';
    }
  };

  return (
    <div className="physics-visualization">
      <div className="visualization-container">
        <canvas ref={canvasRef} className="visualization-canvas" />

        <div className="visualization-overlay">
          <div className="controls-top">
            <h3>Physics Simulation: {timeline?.value || 'Timeline'}</h3>
            <div className="control-buttons">
              <button
                onClick={handleToggleSimulation}
                className={`btn-control ${!simulationRunning ? 'paused' : ''}`}
                title="Pause/Resume simulation"
              >
                {simulationRunning ? '⏸ Pause' : '▶ Resume'}
              </button>
              <button
                onClick={handleResetCamera}
                className="btn-control"
                title="Reset camera view"
              >
                🎥 Reset Camera
              </button>
              <button
                onClick={handleToggleCameraMode}
                className="btn-control"
                title="Toggle camera auto-rotate"
              >
                {cameraMode === 'orbit' ? '🔄 Auto-rotate' : '🎯 Manual'}
              </button>
              <button
                onClick={() => setShowOrbitals(!showOrbitals)}
                className={`btn-control ${showOrbitals ? '' : 'inactive'}`}
                title="Toggle orbital visualization"
              >
                🌌 Orbitals: {showOrbitals ? 'ON' : 'OFF'}
              </button>
              <button
                onClick={() => setShowParticles(!showParticles)}
                className={`btn-control ${showParticles ? '' : 'inactive'}`}
                title="Toggle particle visualization"
              >
                ✨ Particles: {showParticles ? 'ON' : 'OFF'}
              </button>
              <button
                onClick={() => setShowStats(!showStats)}
                className="btn-control"
                title="Toggle statistics display"
              >
                📊 {showStats ? 'Hide' : 'Show'} Stats
              </button>
            </div>
          </div>

          {showStats && physics && physics.stats && (
            <div className="stats-panel">
              <h4>Statistics</h4>
              <div className="stats-content">
                <div className="stat-item">
                  <span className="stat-label">Total Energy:</span>
                  <span className="stat-value">{physics.stats.totalEnergy?.toFixed(2) || '0.00'}</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Geometries:</span>
                  <span className="stat-value">{physics.activeGeometries?.size || 0}</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Avg Intensity:</span>
                  <span className="stat-value">{physics.stats.avgIntensity?.toFixed(2) || '0.00'}</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Interactions:</span>
                  <span className="stat-value">{physics.stats.interactions || 0}</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Emitters:</span>
                  <span className="stat-value">{physics.waveEmitters?.size || 0}</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Coupling:</span>
                  <span className="stat-value">{physics.couplingEnabled ? '✓ ON' : '✗ OFF'}</span>
                </div>
                {particleVisualizerRef.current && (
                  <>
                    <div className="stat-item">
                      <span className="stat-label">Particles:</span>
                      <span className="stat-value">
                        {particleVisualizerRef.current?.stats?.activeParticles || 0}
                      </span>
                    </div>
                    <div className="stat-item">
                      <span className="stat-label">Created:</span>
                      <span className="stat-value">
                        {particleVisualizerRef.current?.stats?.totalParticlesCreated || 0}
                      </span>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          {error && (
            <div className="error-panel">
              <strong>⚠ Error:</strong> {error}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default PhysicsVisualization;
