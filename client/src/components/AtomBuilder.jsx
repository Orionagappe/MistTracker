import React, { useState, useRef, useEffect, useCallback } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import OrbitSelector from './OrbitSelector';
import DemoConfigSelector from './DemoConfigSelector';
import { useDragToMove, updateAtomPosition, updateEmitterPosition } from '../hooks/useDragToMove';
import '../styles/AtomBuilder.css';

/**
 * AtomBuilder Component
 * Visual drag-drop atom and wave emitter builder
 * Phase 7.1: Core user model creation tool
 * 
 * Features:
 * - Click canvas to place atoms/emitters
 * - Drag to reposition (via useDragToMove hook)
 * - Real-time 3D preview
 * - Orbital selector modal
 * - Live configuration management
 * - Undo/Redo support
 * 
 * Drag-to-Move Integration:
 * - Enabled automatically after Three.js scene initializes
 * - Safe handling of null refs during initialization
 * - Event listeners only attached once scene is ready
 * - Supports position updates and visual feedback during drag
 */
function AtomBuilder({ onSaveConfiguration, initialConfig = null }) {
  // Canvas and scene refs
  const canvasRef = useRef(null);
  const sceneRef = useRef(null);
  const cameraRef = useRef(null);
  const rendererRef = useRef(null);
  const objectsRef = useRef([]);
  const raycasterRef = useRef(new THREE.Raycaster()); // For drag-to-move

  // UI state
  const [mode, setMode] = useState('select'); // 'select', 'atom'
  const [showOrbitalSelector, setShowOrbitalSelector] = useState(false);
  const [selectedAtom, setSelectedAtom] = useState(null);
  const [editingPosition, setEditingPosition] = useState(null);
  const [presetMode, setPresetMode] = useState(null);
  const [selectedObject, setSelectedObject] = useState(null); // { id, mesh }
  const [selectedObjectProps, setSelectedObjectProps] = useState({});

  // Configuration state - unified atoms with both orbital and nuclear properties
  const [atoms, setAtoms] = useState([]);
  const [selectedOrbital, setSelectedOrbital] = useState(null);
  const [sceneReady, setSceneReady] = useState(false);

  // Refs for maintaining stable closures in event listeners
  const modeRef = useRef('select');
  const selectedObjectRef = useRef(null);

  /**
   * Sync selectedObjectRef with selectedObject state
   */
  useEffect(() => {
    selectedObjectRef.current = selectedObject;
  }, [selectedObject]);

  /**
   * Update selectedObjectProps when selectedObject changes
   * Physics Model: Unified atom with both orbital (EM-) and nuclear (EM+) properties
   */
  useEffect(() => {
    if (!selectedObject) {
      setSelectedObjectProps({});
      return;
    }

    const atom = atoms.find(a => a.id === selectedObject.id);
    if (atom) {
      setSelectedObjectProps({
        id: atom.id,
        name: atom.orbital_name,
        position: [...atom.position],
        // Orbital properties (EM-)
        orbitalAmplitude: atom.orbitalAmplitude || 0.5,
        orbitalFrequency: atom.orbitalFrequency || 0,
        orbitalIntensity: atom.orbitalIntensity || 1.0,
        // Nuclear properties (EM+)
        nucleusAmplitude: atom.nucleusAmplitude || 0.3,
        nucleusFrequency: atom.nucleusFrequency || 3.29e15,
        nucleusIntensity: atom.nucleusIntensity || 1.0
      });
    }
  }, [selectedObject, atoms]);

  /**
   * Initialize drag-to-move hook
   * Enabled only after scene is ready to avoid null ref issues
   */
  const dragState = useDragToMove(
    sceneRef.current,
    cameraRef.current,
    raycasterRef.current,
    objectsRef,
    (atomId, newPosition) => {
      // Update atom position in state
      setAtoms(prev => updateAtomPosition(prev, atomId, newPosition));
    },
    (atomId, oldPosition) => {
      // Drag start callback
      console.log(`✋ Drag started for ${atomId}`);
    },
    (atomId, oldPosition, newPosition) => {
      // Drag end callback
      console.log(`✋ Drag ended for ${atomId}`);
    },
    sceneReady // Enable after scene is ready
  );

  // Undo/Redo history (basic implementation for Phase 9.1)
  const historyRef = useRef({ past: [], present: { atoms: [] }, future: [] });
  const [historyState, setHistoryState] = useState(0); // Trigger for UI updates
  const initialConfigLoadedRef = useRef(false); // Prevent re-loading initialConfig after user interaction

  /**
   * Keep mode and tempEmitterConfig refs in sync with state
   */
  useEffect(() => {
    modeRef.current = mode;
  }, [mode]);

  /**
   * CRITICAL: Auto-save atoms to parent component whenever atoms state changes
   * Phase 14: This ensures atoms flow from AtomBuilder → PhysicsPage → storage
   * Uses proper React effect pattern instead of setTimeout for reliability
   */
  useEffect(() => {
    if (atoms.length > 0 && typeof onSaveConfiguration === 'function') {
      console.log('💾 AtomBuilder: Saving configuration', { atoms: atoms.length });
      onSaveConfiguration({
        atoms: atoms,
        simulationParams: {
          timestamp: new Date().toISOString()
        }
      });
    }
  }, [atoms, onSaveConfiguration]);

  /**
   * Update history for undo/redo
   */
  const updateHistory = useCallback((newAtoms) => {
    historyRef.current.past.push(historyRef.current.present);
    historyRef.current.present = { atoms: newAtoms };
    historyRef.current.future = []; // Clear future when new action taken
    setHistoryState(prev => prev + 1); // Trigger re-render for undo/redo buttons
  }, []);

  /**
   * Handle undo action
   */
  const handleUndo = useCallback(() => {
    if (historyRef.current.past.length === 0) return;

    historyRef.current.future.unshift(historyRef.current.present);
    historyRef.current.present = historyRef.current.past.pop();

    const { atoms: pastAtoms } = historyRef.current.present;
    setAtoms(pastAtoms);
    setHistoryState(prev => prev + 1);

    // Rebuild scene visuals
    rebuildScene(pastAtoms);
  }, []);

  /**
   * Handle redo action
   */
  const handleRedo = useCallback(() => {
    if (historyRef.current.future.length === 0) return;

    historyRef.current.past.push(historyRef.current.present);
    historyRef.current.present = historyRef.current.future.shift();

    const { atoms: futureAtoms } = historyRef.current.present;
    setAtoms(futureAtoms);
    setHistoryState(prev => prev + 1);

    // Rebuild scene visuals
    rebuildScene(futureAtoms);
  }, []);

  /**
   * Rebuild scene visuals from atoms state
   */
  const rebuildScene = useCallback((atomsList) => {
    if (!sceneRef.current) return;

    // Remove all objects and properly dispose of geometries and materials
    objectsRef.current.forEach(obj => {
      sceneRef.current.remove(obj);
      if (obj.geometry) obj.geometry.dispose();
      if (obj.material) {
        if (Array.isArray(obj.material)) {
          obj.material.forEach(mat => mat.dispose());
        } else {
          obj.material.dispose();
        }
      }
    });
    objectsRef.current = [];

    // Rebuild atoms
    atomsList.forEach(atom => {
      try {
        const geometry = new THREE.SphereGeometry(15, 16, 16);
        const material = new THREE.MeshPhongMaterial({
          color: 0x44dd88,
          opacity: 0.7,
          transparent: true
        });
        const mesh = new THREE.Mesh(geometry, material);
        mesh.position.set(atom.position[0], atom.position[1], atom.position[2]);
        mesh.userData = { type: 'atom', id: atom.id };
        sceneRef.current.add(mesh);
        objectsRef.current.push(mesh);
      } catch (err) {
        console.warn(`Failed to rebuild atom ${atom.id}:`, err.message);
      }
    });
  }, []);

  /**
   * Handle drag-to-move callbacks
   */
  const handleDragStart = useCallback((atomId, oldPosition) => {
    console.log(`Drag started for ${atomId} at`, oldPosition);
  }, []);

  const handleAtomMove = useCallback((atomId, newPosition) => {
    // Update atoms in real-time during drag (no history yet)
    setAtoms(prev => updateAtomPosition(prev, atomId, newPosition));
  }, []);

  const handleDragEnd = useCallback((atomId, oldPosition, newPosition) => {
    console.log(`Drag ended for ${atomId}: [${oldPosition}] -> [${newPosition}]`);

    // Update history only when drag ends (not during drag)
    updateHistory(atoms);
  }, [atoms, updateHistory]);

  /**
   * Setup drag-to-move (will be disabled when in placement mode)
   */
  useDragToMove(
    sceneRef.current,
    cameraRef.current,
    raycasterRef.current,
    objectsRef,
    handleAtomMove,
    handleDragStart,
    handleDragEnd,
    mode === 'select' // Only enable when in select mode
  );

  useEffect(() => {
    if (!sceneReady) return; // Wait for Three.js scene to initialize first
    if (initialConfigLoadedRef.current) return; // Only load once
    if (!initialConfig?.atoms?.length && !initialConfig?.emitters?.length) return;

    initialConfigLoadedRef.current = true;
    console.log('🔄 AtomBuilder: Loading initial config', { atoms: initialConfig.atoms?.length });
    if (initialConfig?.atoms) {
      setAtoms(initialConfig.atoms);
      rebuildScene(initialConfig.atoms);
    }
  }, [initialConfig, sceneReady, rebuildScene]);

  /**
   * Initialize Three.js scene
   */
  useEffect(() => {
    if (!canvasRef.current) return;

    // Scene setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a0e27);
    sceneRef.current = scene;

    // Camera
    const camera = new THREE.PerspectiveCamera(
      75,
      canvasRef.current.clientWidth / canvasRef.current.clientHeight,
      0.1,
      1000
    );
    camera.position.set(0, 50, 150);
    camera.lookAt(0, 0, 0);
    cameraRef.current = camera;

    // Renderer
    const renderer = new THREE.WebGLRenderer({ canvas: canvasRef.current, antialias: true });
    renderer.setSize(canvasRef.current.clientWidth, canvasRef.current.clientHeight);
    renderer.shadowMap.enabled = true;
    renderer.setPixelRatio(window.devicePixelRatio);
    rendererRef.current = renderer;

    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(100, 150, 100);
    directionalLight.castShadow = true;
    scene.add(directionalLight);

    // Grid
    const gridHelper = new THREE.GridHelper(400, 40, 0x444466, 0x222244);
    gridHelper.position.y = -5;
    scene.add(gridHelper);

    // Initialize OrbitControls for zoom, pan, and rotate
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.enableZoom = true;
    controls.mouseButtons = {
      LEFT: THREE.MOUSE.ROTATE,
      MIDDLE: THREE.MOUSE.DOLLY,
      RIGHT: THREE.MOUSE.PAN
    };
    controls.touches = {
      ONE: THREE.TOUCH.ROTATE,
      TWO: THREE.TOUCH.DOLLY_PAN
    };
    controls.autoRotate = false;

    // Use raycaster ref (shared with drag-to-move hook)
    const mouse = new THREE.Vector2();

    /**
     * Right-click handler to select objects
     */
    const handleCanvasRightClick = (event) => {
      event.preventDefault();

      if (modeRef.current !== 'select') return;

      const rect = canvasRef.current.getBoundingClientRect();
      mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      raycasterRef.current.setFromCamera(mouse, camera);

      // Check for object intersection
      const intersects = raycasterRef.current.intersectObjects(objectsRef.current);

      if (intersects.length > 0) {
        // Right-clicked an object - select it
        const hitMesh = intersects[0].object;
        const objectId = hitMesh.userData.id;
        const objectType = hitMesh.userData.type;

        selectObject(objectId, objectType, hitMesh);

        // Disable OrbitControls right-click pan if object is selected
        controls.mouseButtons.RIGHT = undefined;
      } else {
        // Right-clicked empty space - deselect and allow pan
        deselectObject();
        controls.mouseButtons.RIGHT = THREE.MOUSE.PAN;
      }

      return false;
    };

    /**
     * Mouse move handler for panning feedback
     */
    const handleCanvasMouseMove = (event) => {
      // Restore RIGHT pan when mouse leaves canvas if object is selected and we're not dragging
      if (!event.buttons) {
        const rect = canvasRef.current.getBoundingClientRect();
        mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

        raycasterRef.current.setFromCamera(mouse, camera);
        const intersects = raycasterRef.current.intersectObjects(objectsRef.current);

        if (intersects.length === 0 && selectedObjectRef.current) {
          // Over empty space - allow pan
          controls.mouseButtons.RIGHT = THREE.MOUSE.PAN;
        }
      }
    };

    canvasRef.current.addEventListener('contextmenu', handleCanvasRightClick);
    canvasRef.current.addEventListener('mousemove', handleCanvasMouseMove);

    /**
     * Handle canvas clicks for placing atoms/emitters
     * Uses refs to always have the latest mode and config values
     */
    const handleCanvasClick = (event) => {
      // Check current mode using ref (not stale closure value)
      if (modeRef.current === 'select') return;

      const rect = canvasRef.current.getBoundingClientRect();
      mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      console.log(`🖱️ Canvas click in mode: ${modeRef.current}`);

      raycasterRef.current.setFromCamera(mouse, camera);

      // Get plane at y=0 for placement
      const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
      const target = new THREE.Vector3();
      raycasterRef.current.ray.intersectPlane(plane, target);

      if (modeRef.current === 'atom') {
        console.log(`✨ Opening orbital selector for atom at [${target.x.toFixed(1)}, ${target.y.toFixed(1)}, ${target.z.toFixed(1)}]`);
        setShowOrbitalSelector(true);
        setEditingPosition([target.x, target.y, target.z]);
      }
    };

    canvasRef.current.addEventListener('click', handleCanvasClick);

    /**
     * Animation loop
     */
    const animate = () => {
      requestAnimationFrame(animate);
      try {
        // Update controls for smooth damping
        controls.update();
        renderer.render(scene, camera);
      } catch (err) {
        console.warn('Render error:', err.message);
      }
    };
    animate();

    /**
     * Handle window and container resize
     */
    const handleResize = () => {
      if (!canvasRef.current) return;
      const width = canvasRef.current.clientWidth;
      const height = canvasRef.current.clientHeight;
      if (width > 0 && height > 0) {
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
        renderer.setSize(width, height);
        renderer.setPixelRatio(window.devicePixelRatio);
      }
    };

    // Handle window resize
    window.addEventListener('resize', handleResize);

    // Handle container resize with ResizeObserver
    const resizeObserver = new ResizeObserver(() => {
      handleResize();
    });
    resizeObserver.observe(canvasRef.current);

    // Mark scene as ready for drag-to-move and other features
    setSceneReady(true);

    return () => {
      canvasRef.current?.removeEventListener('click', handleCanvasClick);
      canvasRef.current?.removeEventListener('contextmenu', handleCanvasRightClick);
      canvasRef.current?.removeEventListener('mousemove', handleCanvasMouseMove);
      resizeObserver.disconnect();
      window.removeEventListener('resize', handleResize);
      
      // Cleanup Three.js resources and controls
      try {
        // Dispose controls
        controls.dispose();
        
        // Dispose all geometries and materials
        objectsRef.current.forEach(obj => {
          if (obj.geometry) obj.geometry.dispose();
          if (obj.material) {
            if (Array.isArray(obj.material)) {
              obj.material.forEach(mat => mat.dispose());
            } else {
              obj.material.dispose();
            }
          }
        });
        objectsRef.current = [];
        
        // Dispose renderer
        if (rendererRef.current) {
          rendererRef.current.dispose();
        }
      } catch (err) {
        console.warn('Error during cleanup:', err.message);
      }
    };
  }, []);

  /**
   * Add atom to scene and state
   * Updates setAtoms - auto-save effect will handle callback
   */
  const addAtom = (orbital, position) => {
    // Use timestamp + random suffix to ensure unique IDs
    const uniqueSuffix = Math.random().toString(36).substr(2, 9);
    const atomId = `atom-${Date.now()}-${uniqueSuffix}`;
    
    // Unified atom with both orbital and nuclear properties
    const atom = {
      id: atomId,
      orbital: orbital.quantum,
      position: position,
      orbital_name: orbital.name,
      // Orbital properties (Electrons - EM-)
      orbitalAmplitude: 0.5,
      orbitalFrequency: orbital.frequency || 5.0e14,  // Default optical frequency derived from orbital
      orbitalIntensity: 1.0,
      // Nuclear properties (Protons/Neutrons - EM+)
      nucleusAmplitude: 0.3,
      nucleusFrequency: 3.29e15,  // Nuclear emission frequency
      nucleusIntensity: 1.0
    };

    // Update state - useEffect will handle parent callback
    setAtoms(prev => [...prev, atom]);

    // Add visual to scene (single geometry representing the compound atom)
    if (sceneRef.current) {
      try {
        const geometry = new THREE.SphereGeometry(15, 16, 16);
        const material = new THREE.MeshPhongMaterial({
          color: orbital.color || 0x44dd88,
          opacity: 0.7,
          transparent: true
        });
        const mesh = new THREE.Mesh(geometry, material);
        mesh.position.set(position[0], position[1], position[2]);
        mesh.userData = { type: 'atom', id: atomId };
        sceneRef.current.add(mesh);
        objectsRef.current.push(mesh);
      } catch (err) {
        console.warn(`Failed to add atom to scene: ${err.message}`);
      }
    }

    return atom;
  };

  /**
   * Handle orbital selection
   */
  const handleOrbitalSelected = (orbital) => {
    if (editingPosition) {
      const newAtom = addAtom(orbital, editingPosition);
      setShowOrbitalSelector(false);
      setEditingPosition(null);
      setMode('select');
      // IMPORTANT: Must notify parent immediately so atoms flow to storage
      // This is called later in the auto-save effect, but we trigger here too
      // to ensure PhysicsPage gets updated immediately
    }
  };

  /**
   * Delete selected atom or emitter
   * Also triggers auto-save callback
   */
  const handleDelete = (id) => {
    // Remove from scene first
    if (sceneRef.current) {
      const mesh = objectsRef.current.find(m => m.userData.id === id);
      if (mesh) {
        sceneRef.current.remove(mesh);
        objectsRef.current = objectsRef.current.filter(m => m.userData.id !== id);
      }
    }

    // Remove from state - useEffect will handle parent callback
    setAtoms(prev => prev.filter(a => a.id !== id));

    // Deselect if we were selecting this object
    if (selectedObject?.id === id) {
      setSelectedObject(null);
    }
  };

  /**
   * Select or deselect an object
   */
  const selectObject = (objectId, objectType, mesh) => {
    if (selectedObject?.id === objectId) {
      // Clicking again deselects
      deselectObject();
      return;
    }

    // Deselect previous object
    if (selectedObject?.mesh) {
      restoreObjectMaterial(selectedObject.mesh);
    }

    // Select new object with visual feedback
    highlightObject(mesh);
    setSelectedObject({ id: objectId, type: objectType, mesh });
  };

  /**
   * Deselect current object
   */
  const deselectObject = () => {
    if (selectedObject?.mesh) {
      restoreObjectMaterial(selectedObject.mesh);
    }
    setSelectedObject(null);
  };

  /**
   * Highlight selected object with glow effect
   */
  const highlightObject = (mesh) => {
    if (!mesh) return;
    
    // Store original material
    if (!mesh.userData.originalMaterial) {
      mesh.userData.originalMaterial = mesh.material.clone();
    }

    // Create highlight material
    const highlightMaterial = new THREE.MeshPhongMaterial({
      color: mesh.material.color,
      emissive: 0xffff00,
      emissiveIntensity: 0.4,
      opacity: mesh.material.opacity,
      transparent: mesh.material.transparent
    });

    mesh.material = highlightMaterial;
  };

  /**
   * Restore original material
   */
  const restoreObjectMaterial = (mesh) => {
    if (!mesh) return;
    
    if (mesh.userData.originalMaterial) {
      mesh.material = mesh.userData.originalMaterial;
      mesh.userData.originalMaterial = null;
    }
  };

  /**
   * Update unified atom with property changes (orbital or nuclear)
   * useEffect will handle parent callback
   */
  const updateSelectedObjectProperty = (property, value) => {
    if (!selectedObject) return;

    const updatedProps = { ...selectedObjectProps, [property]: value };
    setSelectedObjectProps(updatedProps);

    // Update unified atom with either orbital or nuclear properties
    setAtoms(prev => prev.map(atom => {
      if (atom.id === selectedObject.id) {
        const atomUpdate = { ...atom };
        
        // Handle orbital properties
        if (property === 'orbitalAmplitude') atomUpdate.orbitalAmplitude = value;
        else if (property === 'orbitalFrequency') atomUpdate.orbitalFrequency = value;
        else if (property === 'orbitalIntensity') atomUpdate.orbitalIntensity = value;
        // Handle nuclear properties
        else if (property === 'nucleusAmplitude') atomUpdate.nucleusAmplitude = value;
        else if (property === 'nucleusFrequency') atomUpdate.nucleusFrequency = value;
        else if (property === 'nucleusIntensity') atomUpdate.nucleusIntensity = value;
        // Handle position
        else if (property === 'position') {
          atomUpdate.position = value;
          // Update mesh position
          const mesh = objectsRef.current.find(m => m.userData.id === atom.id);
          if (mesh) {
            mesh.position.set(value[0], value[1], value[2]);
          }
        }
        
        return atomUpdate;
      }
      return atom;
    }));
  };

  /**
   * Handle saving configuration
   * Validates config before saving and provides user feedback
   */
  const handleSaveConfiguration = useCallback(() => {
    // Validate configuration
    if (atoms.length === 0) {
      console.warn('Cannot save empty configuration');
      if (window.showToastWarning) {
        window.showToastWarning('Add atoms before saving', 2000);
      }
      return;
    }

    const config = {
      atoms,
      simulationParams: {
        timeDilation: 1.0,
        fieldStrength: 1.0,
        timestamp: new Date().toISOString()
      }
    };
    
    console.log('💾 AtomBuilder: Saving configuration', config);
    
    // Call parent component callback
    if (typeof onSaveConfiguration === 'function') {
      try {
        onSaveConfiguration(config);
      } catch (err) {
        console.error('Error saving configuration:', err);
        if (window.showToastError) {
          window.showToastError('Error saving configuration: ' + err.message);
        }
      }
    } else {
      console.warn('onSaveConfiguration callback not provided');
    }
  }, [atoms, onSaveConfiguration]);

  /**
   * Load preset configuration
   */
  const handleLoadPreset = (presetName) => {
    let config = {};
    
    if (presetName === 'simple') {
      config = {
        atoms: [
          {
            id: 'preset-h-1',
            orbital_name: '2p',
            orbital: { n: 2, l: 1, m: 0 },
            position: [0, 0, 0],
            orbitalAmplitude: 0.5,
            orbitalFrequency: 5.0e14,
            orbitalIntensity: 1.0,
            nucleusAmplitude: 0.3,
            nucleusFrequency: 3.29e15,
            nucleusIntensity: 1.0
          }
        ]
      };
    } else if (presetName === 'multi') {
      config = {
        atoms: [
          {
            id: 'preset-h-1',
            orbital_name: '2p',
            orbital: { n: 2, l: 1, m: 0 },
            position: [-80, 0, 0],
            orbitalAmplitude: 0.5,
            orbitalFrequency: 5.0e14,
            orbitalIntensity: 1.0,
            nucleusAmplitude: 0.3,
            nucleusFrequency: 7.2e15,
            nucleusIntensity: 1.2
          },
          {
            id: 'preset-he-1',
            orbital_name: '2p',
            orbital: { n: 2, l: 1, m: 0 },
            position: [0, 0, 0],
            orbitalAmplitude: 0.5,
            orbitalFrequency: 5.0e14,
            orbitalIntensity: 1.0,
            nucleusAmplitude: 0.3,
            nucleusFrequency: 3.29e15,
            nucleusIntensity: 1.0
          },
          {
            id: 'preset-c-1',
            orbital_name: '2p',
            orbital: { n: 2, l: 1, m: 0 },
            position: [80, 0, 0],
            orbitalAmplitude: 0.5,
            orbitalFrequency: 5.0e14,
            orbitalIntensity: 1.0,
            nucleusAmplitude: 0.3,
            nucleusFrequency: 3.29e15,
            nucleusIntensity: 1.0
          }
        ]
      };
    } else if (presetName === 'cascade') {
      config = {
        atoms: [
          {
            id: 'preset-h-1',
            orbital_name: '3s',
            orbital: { n: 3, l: 0, m: 0 },
            position: [-100, 0, 0],
            orbitalAmplitude: 0.6,
            orbitalFrequency: 5.0e14,
            orbitalIntensity: 1.0,
            nucleusAmplitude: 0.3,
            nucleusFrequency: 3.09e15,
            nucleusIntensity: 0.8
          },
          {
            id: 'preset-h-2',
            orbital_name: '2p',
            orbital: { n: 2, l: 1, m: 0 },
            position: [0, 0, 0],
            orbitalAmplitude: 0.5,
            orbitalFrequency: 5.0e14,
            orbitalIntensity: 1.0,
            nucleusAmplitude: 0.3,
            nucleusFrequency: 3.09e15,
            nucleusIntensity: 0.8
          },
          {
            id: 'preset-h-3',
            orbital_name: '2s',
            orbital: { n: 2, l: 0, m: 0 },
            position: [100, 0, 0],
            orbitalAmplitude: 0.5,
            orbitalFrequency: 5.0e14,
            orbitalIntensity: 1.0,
            nucleusAmplitude: 0.3,
            nucleusFrequency: 3.09e15,
            nucleusIntensity: 0.8
          }
        ]
      };
    }

    // Clear scene
    if (sceneRef.current) {
      objectsRef.current.forEach(obj => sceneRef.current.remove(obj));
      objectsRef.current = [];
    }

    // Load preset config
    if (config.atoms) {
      setAtoms(config.atoms);
      // Rebuild scene visuals
      config.atoms.forEach(atom => {
        if (sceneRef.current) {
          const geometry = new THREE.SphereGeometry(15, 16, 16);
          const material = new THREE.MeshPhongMaterial({
            color: 0x44dd88,
            opacity: 0.7,
            transparent: true
          });
          const mesh = new THREE.Mesh(geometry, material);
          mesh.position.set(atom.position[0], atom.position[1], atom.position[2]);
          mesh.userData = { type: 'atom', id: atom.id };
          sceneRef.current.add(mesh);
          objectsRef.current.push(mesh);
        }
      });
      // useEffect will handle callback to parent
    }
  };

  /**
   * Handle demo configuration loaded from DemoConfigSelector
   * Loads atoms from demo config and updates visualization
   */
  const handleDemoConfigLoaded = (config) => {
    try {
      // Validate config structure
      if (!config || !config.atoms || !Array.isArray(config.atoms)) {
        console.error('Invalid demo config format:', config);
        if (window.showToastError) {
          window.showToastError('Invalid configuration format');
        }
        return;
      }

      // Clear existing scene
      if (sceneRef.current) {
        objectsRef.current.forEach(obj => {
          sceneRef.current.remove(obj);
          if (obj.geometry) obj.geometry.dispose();
          if (obj.material) {
            if (Array.isArray(obj.material)) {
              obj.material.forEach(mat => mat.dispose());
            } else {
              obj.material.dispose();
            }
          }
        });
        objectsRef.current = [];
      }

      // Convert demo config atoms to AtomBuilder format and load them
      const atomsForBuilder = config.atoms.map((atom, index) => ({
        id: atom.id || `demo-atom-${index}`,
        orbital_name: atom.orbital_name,
        orbital: atom.orbital,
        position: atom.position,
        orbitalAmplitude: atom.orbitalAmplitude || 0.5,
        orbitalFrequency: atom.orbitalFrequency || 5.0e14,
        orbitalIntensity: atom.orbitalIntensity || 1.0,
        nucleusAmplitude: atom.nucleusAmplitude || 0.3,
        nucleusFrequency: atom.nucleusFrequency || 3.29e15,
        nucleusIntensity: atom.nucleusIntensity || 1.0,
        selected: false
      }));

      // Update atoms state
      setAtoms(atomsForBuilder);

      // Rebuild scene with new atoms
      rebuildScene(atomsForBuilder);

      // useEffect will handle callback to parent

      // Switch to select mode
      setMode('select');

      // Provide user feedback
      console.log('🧪 Demo config loaded:', {
        configName: config.name,
        atomCount: atomsForBuilder.length,
        emitterCount: config.waveEmitters?.length || 0
      });

      if (window.showToastSuccess) {
        window.showToastSuccess(`Loaded ${config.name || 'demo config'} - ${atomsForBuilder.length} atoms`);
      }

    } catch (error) {
      console.error('Error loading demo config:', error);
      if (window.showToastError) {
        window.showToastError(`Error loading configuration: ${error.message}`);
      }
    }
  };

  return (
    <div className="atom-builder">
      {/* Canvas Area */}
      <div className="builder-canvas-container">
        <canvas ref={canvasRef} className="builder-canvas"></canvas>
        <div className="builder-mode-indicator">
          {mode === 'atom' && '⚛️ Click canvas to place atom'}
          {mode === 'select' && '✓ Ready - Select/Edit atoms'}
        </div>
      </div>

      {/* Control Panel */}
      <div className="builder-control-panel">
        <div className="builder-section">
          <h3>Tools</h3>
          <div className="builder-button-group">
            <button
              className={`builder-btn ${mode === 'atom' ? 'active' : ''}`}
              onClick={() => setMode('atom')}
              title="Click canvas to place atom"
            >
              ⚛️ + Add Atom
            </button>
            <button
              className="builder-btn secondary"
              onClick={() => setMode('select')}
              title="Select and edit objects"
            >
              Select/Edit
            </button>
          </div>
        </div>

        {/* Undo/Redo Controls */}
        <div className="builder-section">
          <h3>History</h3>
          <div className="builder-button-group">
            <button
              className="builder-btn history-btn"
              onClick={handleUndo}
              disabled={historyRef.current.past.length === 0}
              title="Undo last action (Ctrl+Z)"
            >
              ↶ Undo
            </button>
            <button
              className="builder-btn history-btn"
              onClick={handleRedo}
              disabled={historyRef.current.future.length === 0}
              title="Redo last undone action (Ctrl+Y)"
            >
              ↷ Redo
            </button>
          </div>
        </div>

        {/* Presets */}
        <div className="builder-section">
          <h3>Presets</h3>
          <div className="builder-button-group">
            <button
              className="builder-btn preset"
              onClick={() => handleLoadPreset('simple')}
              title="Simple H atom with resonant wave"
            >
              Simple H
            </button>
            <button
              className="builder-btn preset"
              onClick={() => handleLoadPreset('multi')}
              title="H, He, C cascade"
            >
              Multi-Atom
            </button>
            <button
              className="builder-btn preset"
              onClick={() => handleLoadPreset('cascade')}
              title="Complex resonance cascade"
            >
              Cascade
            </button>
          </div>
        </div>

        {/* Physics Test Scenarios - Demo Configuration Selector */}
        <DemoConfigSelector 
          onConfigLoaded={handleDemoConfigLoaded}
          className="builder-demo-selector"
        />

        {/* Selected Object Properties Panel */}
        {selectedObject && (
          <div className="builder-section properties-panel">
            <h3>
              ⚛️ Atom Properties
              <button 
                className="close-properties"
                onClick={deselectObject}
                title="Deselect object"
              >
                ✕
              </button>
            </h3>
            
            {/* Nuclear/Orbital Information Display */}
            <div className="nuclear-info">
              <p className="nuclear-label">⚛️ Orbital Electrons (EM⁻)</p>
              <div className="polarity-indicator negative">−</div>
              <div className="wave-types">
                <span className="wave-type-tag">EM−</span>
                <span className="wave-type-tag">Gravitational</span>
              </div>
            </div>
            
            <div className="nuclear-info">
              <p className="nuclear-label">☢️ Nucleus/Protons (EM⁺)</p>
              <div className="polarity-indicator positive">+</div>
              <div className="wave-types">
                <span className="wave-type-tag">EM+</span>
                <span className="wave-type-tag">Gravitational</span>
              </div>
            </div>
            
            {/* Position Controls */}
            <div className="builder-input-group">
              <p className="section-label">Position</p>
              <label>
                X:
                <input
                  type="number"
                  step="1"
                  value={selectedObjectProps.position?.[0] || 0}
                  onChange={(e) => updateSelectedObjectProperty('position', [
                    parseFloat(e.target.value),
                    selectedObjectProps.position?.[1] || 0,
                    selectedObjectProps.position?.[2] || 0
                  ])}
                />
              </label>
              <label>
                Y:
                <input
                  type="number"
                  step="1"
                  value={selectedObjectProps.position?.[1] || 0}
                  onChange={(e) => updateSelectedObjectProperty('position', [
                    selectedObjectProps.position?.[0] || 0,
                    parseFloat(e.target.value),
                    selectedObjectProps.position?.[2] || 0
                  ])}
                />
              </label>
              <label>
                Z:
                <input
                  type="number"
                  step="1"
                  value={selectedObjectProps.position?.[2] || 0}
                  onChange={(e) => updateSelectedObjectProperty('position', [
                    selectedObjectProps.position?.[0] || 0,
                    selectedObjectProps.position?.[1] || 0,
                    parseFloat(e.target.value)
                  ])}
                />
              </label>
            </div>
            
            {/* Orbital Properties */}
            <div className="builder-input-group">
              <p className="section-label">Orbital (EM−)</p>
              <label>
                Frequency (Hz):
                <input
                  type="number"
                  value={selectedObjectProps.orbitalFrequency || 0}
                  onChange={(e) => updateSelectedObjectProperty('orbitalFrequency', parseFloat(e.target.value))}
                />
              </label>
              <label>
                Amplitude:
                <input
                  type="number"
                  min="0"
                  max="2"
                  step="0.1"
                  value={selectedObjectProps.orbitalAmplitude || 0}
                  onChange={(e) => updateSelectedObjectProperty('orbitalAmplitude', parseFloat(e.target.value))}
                />
              </label>
              <label>
                Intensity:
                <input
                  type="number"
                  min="0"
                  max="10"
                  step="0.1"
                  value={selectedObjectProps.orbitalIntensity || 1}
                  onChange={(e) => updateSelectedObjectProperty('orbitalIntensity', parseFloat(e.target.value))}
                />
              </label>
            </div>
            
            {/* Nuclear Properties */}
            <div className="builder-input-group">
              <p className="section-label">Nucleus (EM⁺)</p>
              <label>
                Frequency (Hz):
                <input
                  type="number"
                  value={selectedObjectProps.nucleusFrequency || 0}
                  onChange={(e) => updateSelectedObjectProperty('nucleusFrequency', parseFloat(e.target.value))}
                />
              </label>
              <label>
                Amplitude:
                <input
                  type="number"
                  min="0"
                  max="2"
                  step="0.1"
                  value={selectedObjectProps.nucleusAmplitude || 0}
                  onChange={(e) => updateSelectedObjectProperty('nucleusAmplitude', parseFloat(e.target.value))}
                />
              </label>
              <label>
                Intensity:
                <input
                  type="number"
                  min="0"
                  max="10"
                  step="0.1"
                  value={selectedObjectProps.nucleusIntensity || 1}
                  onChange={(e) => updateSelectedObjectProperty('nucleusIntensity', parseFloat(e.target.value))}
                />
              </label>
            </div>
            <div className="builder-button-group">
              <button
                className="builder-btn danger"
                onClick={() => handleDelete(selectedObject.id)}
              >
                🗑️ Delete
              </button>
            </div>
          </div>
        )}

        {/* Configuration Summary */}
        <div className="builder-section summary">
          <h3>Configuration</h3>
          <p><strong>Atoms:</strong> {atoms.length}</p>
          
          {atoms.length > 0 && (
            <div className="summary-items">
              <p className="summary-title">Atoms:</p>
              {atoms.map(atom => (
                <div key={atom.id} className="summary-item">
                  <span>{atom.orbital_name} @ [{atom.position.map(p => p.toFixed(0)).join(', ')}]</span>
                  <button 
                    className="summary-delete"
                    onClick={() => handleDelete(atom.id)}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Save Button */}
        <div className="builder-section">
          <button
            className="builder-btn save"
            onClick={handleSaveConfiguration}
          >
            💾 Save Configuration
          </button>
        </div>
      </div>

      {/* Orbital Selector Modal */}
      {showOrbitalSelector && (
        <OrbitSelector
          onSelect={handleOrbitalSelected}
          onCancel={() => {
            setShowOrbitalSelector(false);
            setEditingPosition(null);
            setMode('select');
          }}
        />
      )}
    </div>
  );
}

export default AtomBuilder;
