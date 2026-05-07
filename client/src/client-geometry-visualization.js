// client-geometry-visualization.js
// Client-side 3D geometry visualization using Three.js
// Handles rendering, camera controls, and real-time geometry updates

/**
 * ClientGeometryVisualizer - Handles 3D visualization on the client side
 * Uses Three.js for rendering and WebSocket for real-time synchronization
 */
export class ClientGeometryVisualizer {
  constructor(canvasElementId, options = {}) {
    this.canvasElementId = canvasElementId;
    this.canvas = document.getElementById(canvasElementId);
    
    if (!this.canvas) {
      throw new Error(`Canvas element not found: ${canvasElementId}`);
    }

    // Three.js components
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.controls = null;

    // Geometry tracking
    this.geometryMeshes = new Map(); // geometryId -> THREE.Mesh
    this.geometryData = new Map(); // geometryId -> geometry data

    // Rendering state
    this.isRunning = false;
    this.animationFrameId = null;

    // Options
    this.options = {
      width: options.width || window.innerWidth,
      height: options.height || window.innerHeight,
      backgroundColor: options.backgroundColor || 0x1a1a1a,
      gridSize: options.gridSize || 100,
      showGrid: options.showGrid !== false,
      ...options
    };

    this._initScene();
    this._setupLighting();
    if (this.options.showGrid) {
      this._setupGrid();
    }
    this._setupEventHandlers();
  }

  /**
   * Initialize Three.js scene
   * @private
   */
  _initScene() {
    // Scene
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(this.options.backgroundColor);
    this.scene.fog = new THREE.Fog(this.options.backgroundColor, 2000, 3500);

    // Camera
    const width = this.options.width;
    const height = this.options.height;
    this.camera = new THREE.PerspectiveCamera(
      75,
      width / height,
      0.1,
      10000
    );
    this.camera.position.set(50, 50, 50);
    this.camera.lookAt(0, 0, 0);

    // Renderer
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: true,
      preserveDrawingBuffer: true
    });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFShadowShadowMap;
  }

  /**
   * Setup lighting
   * @private
   */
  _setupLighting() {
    // Ambient light
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    this.scene.add(ambientLight);

    // Directional light
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(100, 100, 100);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    directionalLight.shadow.camera.far = 500;
    this.scene.add(directionalLight);

    // Point light
    const pointLight = new THREE.PointLight(0xffffff, 0.5);
    pointLight.position.set(-50, 50, 50);
    this.scene.add(pointLight);
  }

  /**
   * Setup grid visualization
   * @private
   */
  _setupGrid() {
    const gridHelper = new THREE.GridHelper(
      this.options.gridSize,
      this.options.gridSize / 10,
      0x888888,
      0x444444
    );
    this.scene.add(gridHelper);

    // Axes helper
    const axesHelper = new THREE.AxesHelper(50);
    this.scene.add(axesHelper);
  }

  /**
   * Setup event handlers
   * @private
   */
  _setupEventHandlers() {
    // Handle window resize
    window.addEventListener('resize', () => this._onWindowResize());
  }

  /**
   * Handle window resize
   * @private
   */
  _onWindowResize() {
    const width = window.innerWidth;
    const height = window.innerHeight;

    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }

  /**
   * Start rendering loop
   */
  start() {
    if (this.isRunning) return;
    this.isRunning = true;
    this._animate();
  }

  /**
   * Stop rendering loop
   */
  stop() {
    this.isRunning = false;
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
    }
  }

  /**
   * Animation loop
   * @private
   */
  _animate() {
    this.animationFrameId = requestAnimationFrame(() => this._animate());

    if (this.controls) {
      this.controls.update();
    }

    this.renderer.render(this.scene, this.camera);
  }

  /**
   * AddGeometry to scene from geometry data
   * @param {object} geometry - Geometry data from server
   */
  addGeometry(geometry) {
    // Create mesh based on type
    let mesh = null;

    switch (geometry.type) {
      case 'sphere':
        mesh = this._createSphereMesh(geometry);
        break;
      case 'cube':
        mesh = this._createCubeMesh(geometry);
        break;
      case 'cylinder':
        mesh = this._createCylinderMesh(geometry);
        break;
      case 'mesh':
      case 'custom':
        mesh = this._createCustomMesh(geometry);
        break;
      default:
        console.warn(`Unknown geometry type: ${geometry.type}`);
        return;
    }

    if (mesh) {
      // Apply transform (handle both formats: transform object or direct position/rotation/scale)
      if (geometry.transform) {
        this._applyTransform(mesh, geometry.transform);
      } else if (geometry.position || geometry.rotation || geometry.scale) {
        this._applyTransform(mesh, geometry);
      }

      // Apply material (handle both formats: material object or direct color)
      if (geometry.material) {
        this._applyMaterial(mesh, geometry.material);
      } else if (geometry.color) {
        this._applyMaterial(mesh, { color: geometry.color });
      }

      // Add text label if provided
      if (geometry.label) {
        const label = this._createTextLabel(geometry.label);
        mesh.add(label);
      }

      // Add to scene
      this.scene.add(mesh);

      // Track geometry
      this.geometryMeshes.set(geometry.id || geometry.itemId, mesh);
      this.geometryData.set(geometry.id || geometry.itemId, geometry);
    }
  }

  /**
   * Create text label sprite
   * @private
   */
  _createTextLabel(text, options = {}) {
    const fontSize = options.fontSize || 64;
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    ctx.font = `${fontSize}px Arial, sans-serif`;
    ctx.fillStyle = '#000000';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, canvas.width / 2, canvas.height / 2);
    
    const texture = new THREE.CanvasTexture(canvas);
    const spriteMaterial = new THREE.SpriteMaterial({ map: texture });
    const sprite = new THREE.Sprite(spriteMaterial);
    
    sprite.scale.set(4, 4, 1);
    sprite.position.y = 3;
    
    return sprite;
  }

  /**
   * Create sphere mesh
   * @private
   */
  _createSphereMesh(geometry) {
    const scale = geometry.transform?.scale || [1, 1, 1];
    const geometry_geo = new THREE.SphereGeometry(
      1 * scale[0],
      32,
      32
    );
    const material = new THREE.MeshPhongMaterial();
    const mesh = new THREE.Mesh(geometry_geo, material);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    return mesh;
  }

  /**
   * Create cube mesh
   * @private
   */
  _createCubeMesh(geometry) {
    const scale = geometry.transform?.scale || [1, 1, 1];
    const geometry_geo = new THREE.BoxGeometry(
      1 * scale[0],
      1 * scale[1],
      1 * scale[2]
    );
    const material = new THREE.MeshPhongMaterial();
    const mesh = new THREE.Mesh(geometry_geo, material);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    return mesh;
  }

  /**
   * Create cylinder mesh
   * @private
   */
  _createCylinderMesh(geometry) {
    const scale = geometry.transform?.scale || [1, 1, 1];
    const geometry_geo = new THREE.CylinderGeometry(
      1 * scale[0],
      1 * scale[0],
      2 * scale[1],
      32
    );
    const material = new THREE.MeshPhongMaterial();
    const mesh = new THREE.Mesh(geometry_geo, material);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    return mesh;
  }

  /**
   * Create custom mesh from vertices and indices
   * @private
   */
  _createCustomMesh(geometry) {
    const geo = new THREE.BufferGeometry();

    if (geometry.data?.vertices) {
      geo.setAttribute(
        'position',
        new THREE.BufferAttribute(
          new Float32Array(geometry.data.vertices),
          3
        )
      );
    }

    if (geometry.data?.indices) {
      geo.setIndex(
        new THREE.BufferAttribute(
          new Uint32Array(geometry.data.indices),
          1
        )
      );
    }

    if (geometry.data?.normals) {
      geo.setAttribute(
        'normal',
        new THREE.BufferAttribute(
          new Float32Array(geometry.data.normals),
          3
        )
      );
    } else {
      geo.computeVertexNormals();
    }

    const material = new THREE.MeshPhongMaterial();
    const mesh = new THREE.Mesh(geo, material);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    return mesh;
  }

  /**
   * Update geometry in scene
   * @param {string} geometryId - ID of geometry to update
   * @param {object} updates - Updates to apply (transform, material, etc.)
   */
  updateGeometry(geometryId, updates) {
    const mesh = this.geometryMeshes.get(geometryId);
    if (!mesh) {
      console.warn(`Geometry not found: ${geometryId}`);
      return;
    }

    const geometry = this.geometryData.get(geometryId);
    if (!geometry) return;

    // Update transform
    if (updates.transform) {
      this._applyTransform(mesh, updates.transform);
    }
    
    // Also support direct position/rotation/scale updates
    if (updates.position || updates.rotation || updates.scale) {
      this._applyTransform(mesh, updates);
    }

    // Update material
    if (updates.material) {
      this._applyMaterial(mesh, updates.material);
    }
    
    // Also support direct color updates
    if (updates.color) {
      this._applyMaterial(mesh, { color: updates.color });
    }

    // Update visibility
    if (updates.visible !== undefined) {
      mesh.visible = updates.visible;
    }
    
    // Update label if provided
    if (updates.label !== undefined) {
      // Remove existing label sprite if any
      const labelSprites = mesh.children.filter(child => child instanceof THREE.Sprite);
      labelSprites.forEach(sprite => mesh.remove(sprite));
      
      // Add new label if not empty
      if (updates.label) {
        const label = this._createTextLabel(updates.label);
        mesh.add(label);
      }
    }

    // Update geometry data
    Object.assign(geometry, updates);
  }

  /**
   * Remove geometry from scene
   * @param {string} geometryId - ID of geometry to remove
   */
  removeGeometry(geometryId) {
    const mesh = this.geometryMeshes.get(geometryId);
    if (!mesh) {
      console.warn(`Geometry not found: ${geometryId}`);
      return;
    }

    this.scene.remove(mesh);
    this.geometryMeshes.delete(geometryId);
    this.geometryData.delete(geometryId);
  }

  /**
   * Apply transform to mesh
   * @private
   */
  _applyTransform(mesh, transform) {
    // Handle format: { position: { x, y, z }, rotation: { x, y, z }, scale: { x, y, z } }
    if (transform.position) {
      const pos = transform.position;
      if (Array.isArray(pos)) {
        mesh.position.set(...pos);
      } else if (typeof pos === 'object') {
        mesh.position.set(pos.x || 0, pos.y || 0, pos.z || 0);
      }
    }
    
    if (transform.rotation) {
      const rot = transform.rotation;
      if (Array.isArray(rot)) {
        mesh.rotation.set(...rot);
      } else if (typeof rot === 'object') {
        mesh.rotation.set(rot.x || 0, rot.y || 0, rot.z || 0);
      }
    }
    
    if (transform.scale) {
      const scl = transform.scale;
      if (Array.isArray(scl)) {
        mesh.scale.set(...scl);
      } else if (typeof scl === 'object') {
        mesh.scale.set(scl.x || 1, scl.y || 1, scl.z || 1);
      }
    }
  }

  /**
   * Apply material to mesh
   * @private
   */
  _applyMaterial(mesh, material) {
    if (!mesh.material) return;

    // Handle color: either hex string like '#FF6B6B' or RGB array
    if (material.color) {
      if (typeof material.color === 'string') {
        // Hex color string
        mesh.material.color.setStyle(material.color);
      } else if (Array.isArray(material.color)) {
        // RGB array
        mesh.material.color.setRGB(...material.color);
      }
    }
    
    if (material.metallic !== undefined) {
      mesh.material.metallic = material.metallic;
    }
    if (material.roughness !== undefined) {
      mesh.material.roughness = material.roughness;
    }
    
    // Handle emissive
    if (material.emissive) {
      if (typeof material.emissive === 'string') {
        mesh.material.emissive.setStyle(material.emissive);
      } else if (Array.isArray(material.emissive)) {
        mesh.material.emissive.setRGB(...material.emissive);
      }
    }

    mesh.material.needsUpdate = true;
  }

  /**
   * Clear all geometries from scene
   */
  clear() {
    this.geometryMeshes.forEach((mesh) => {
      this.scene.remove(mesh);
    });
    this.geometryMeshes.clear();
    this.geometryData.clear();
  }

  /**
   * Get all geometries in scene
   * @returns {array} Array of geometry data
   */
  getGeometries() {
    return Array.from(this.geometryData.values());
  }

  /**
   * Get geometry by ID
   * @param {string} geometryId - ID of geometry
   * @returns {object} Geometry data
   */
  getGeometry(geometryId) {
    return this.geometryData.get(geometryId);
  }

  /**
   * Screenshot of current scene
   * @returns {string} Data URL of screenshot
   */
  takeScreenshot() {
    return this.renderer.domElement.toDataURL('image/png');
  }

  /**
   * Dispose of resources
   */
  dispose() {
    this.stop();
    this.geometryMeshes.forEach((mesh) => {
      mesh.geometry.dispose();
      mesh.material.dispose();
    });
    this.renderer.dispose();
  }
}

export default ClientGeometryVisualizer;
