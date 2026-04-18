/**
 * PHASE 10.9: CLIENT-SIDE INTEGRATION MODULE
 * 
 * Bridges Phase 10 physics modules with React client
 * Provides unified API for 4D visualization, mode switching, camera control, and diagnostics
 * 
 * @module Phase10IntegrationModule
 */

// ES6 Module compatibility - Import Phase 10 modules
// These are expected to be accessible from parent directory via HTTP fetch
let Phase10GPURenderer = null;
let Phase10ModeSwitching = null;
let Phase10AdvancedCamera = null;
let Phase10Visualization = null;
let Phase10Diagnostics = null;
let Phase10Measurements = null;
let Phase10CollisionVisualizer = null;

/**
 * Phase10IntegrationModule - Main integration class
 * Orchestrates all Phase 10 components for client-side use
 */
export class Phase10IntegrationModule {
  constructor(config = {}) {
    // State
    this.canvasElement = null;
    this.renderer = null;
    this.modeSwitcher = null;
    this.camera = null;
    this.diagnostics = null;
    this.measurements = null;
    this.collisionVisualizer = null;
    
    // Configuration
    this.config = {
      enableGPU: config.enableGPU !== false,
      enableDiagnostics: config.enableDiagnostics !== false,
      enableCollisionVisualizer: config.enableCollisionVisualizer !== false,
      renderMode: config.renderMode || 'spheres', // spheres, points, trails
      colorScheme: config.colorScheme || 'energy', // energy, temporal, velocity
      maxParticles: config.maxParticles || 10000,
      ...config
    };
    
    // Performance metrics
    this.metrics = {
      fps: 60,
      frameTime: 16.67,
      drawCalls: 0,
      particleCount: 0,
      triangleCount: 0,
      memoryUsage: 0
    };
    
    // Animation state
    this.animationRunning = true;
    this.simulationSpeed = 1.0;
    this.deltaTime = 0;
    this.lastFrameTime = 0;
    this.frameCount = 0;
    
    // Mode state
    this.currentMode = '3D';
    this.isTransitioning = false;
    this.transitionProgress = 0;
    
    // Particle data
    this.particleData = [];
    this.particleBuffer = null;
    
    // Callback handlers
    this.onModeChange = null;
    this.onStatsUpdate = null;
    this.onError = null;
    
    // Initialization flag
    this.initialized = false;
  }

  /**
   * Initialize the integration module
   * @param {HTMLCanvasElement} canvasElement - Target canvas for rendering
   * @returns {Promise<void>}
   */
  async initialize(canvasElement) {
    try {
      if (this.initialized) {
        console.warn('Phase10IntegrationModule already initialized');
        return;
      }

      this.canvasElement = canvasElement;

      // Load Phase 10 modules dynamically
      await this.loadPhase10Modules();

      // Initialize GPU renderer
      if (this.config.enableGPU) {
        this.renderer = new Phase10GPURenderer(canvasElement, {
          renderMode: this.config.renderMode,
          colorScheme: this.config.colorScheme,
          maxParticles: this.config.maxParticles
        });
      }

      // Initialize mode switcher
      this.modeSwitcher = new Phase10ModeSwitching({
        renderMode: this.config.renderMode,
        colorScheme: this.config.colorScheme
      });

      // Initialize camera
      this.camera = new Phase10AdvancedCamera({
        fov: 45,
        aspect: canvasElement.clientWidth / canvasElement.clientHeight,
        near: 0.1,
        far: 10000
      });

      // Initialize diagnostics
      if (this.config.enableDiagnostics) {
        this.diagnostics = new Phase10Diagnostics();
      }

      // Initialize measurements
      this.measurements = new Phase10Measurements();

      // Initialize collision visualizer
      if (this.config.enableCollisionVisualizer) {
        this.collisionVisualizer = new Phase10CollisionVisualizer();
      }

      this.initialized = true;
      console.log('✓ Phase10IntegrationModule initialized successfully');

      // Start render loop
      this.startRenderLoop();
    } catch (error) {
      console.error('Failed to initialize Phase10IntegrationModule:', error);
      this.handleError(error, 'Initialization');
      throw error;
    }
  }

  /**
   * Load Phase 10 modules from parent directory
   * @private
   */
  async loadPhase10Modules() {
    try {
      // Attempt to load modules - depends on how they're bundled/served
      // This is a fallback that assumes modules are available globally
      // In production, these would be bundled with the app or loaded via CDN

      // For now, we'll create stub implementations if modules aren't available
      if (typeof window !== 'undefined') {
        // Try to load from global scope (if bundled)
        Phase10GPURenderer = window.Phase10GPURenderer || this.createStubRenderer();
        Phase10ModeSwitching = window.Phase10ModeSwitching || this.createStubModeSwitcher();
        Phase10AdvancedCamera = window.Phase10AdvancedCamera || this.createStubCamera();
        Phase10Visualization = window.Phase10Visualization || this.createStubVisualization();
        Phase10Diagnostics = window.Phase10Diagnostics || this.createStubDiagnostics();
        Phase10Measurements = window.Phase10Measurements || this.createStubMeasurements();
        Phase10CollisionVisualizer = window.Phase10CollisionVisualizer || this.createStubCollisionVisualizer();
      }

      console.log('✓ Phase 10 modules loaded');
    } catch (error) {
      console.warn('Could not load all Phase 10 modules:', error);
      // Continue with stubs
    }
  }

  /**
   * Update particles from server/physics engine
   * @param {Array} particles - Particle data array
   */
  updateParticles(particles) {
    if (!this.initialized) return;

    this.particleData = particles;
    this.metrics.particleCount = particles.length;

    // Update all subsystems with new particle data
    if (this.renderer) {
      this.renderer.updateParticles(particles);
    }

    if (this.modeSwitcher) {
      this.modeSwitcher.updateParticles(particles);
    }

    if (this.diagnostics) {
      this.diagnostics.updateParticles(particles);
    }

    if (this.measurements) {
      this.measurements.updateParticles(particles);
    }

    if (this.collisionVisualizer) {
      this.collisionVisualizer.updateCollisions(particles);
    }
  }

  /**
   * Switch between 3D and 4D modes
   * @param {string} mode - '3D' or '4D'
   * @param {number} transitionDuration - Transition time in milliseconds
   */
  switchMode(mode, transitionDuration = 1000) {
    if (!this.initialized) return;

    if (mode !== '3D' && mode !== '4D') {
      console.error('Invalid mode:', mode);
      return;
    }

    if (this.currentMode === mode) {
      return; // Already in this mode
    }

    this.isTransitioning = true;
    this.transitionProgress = 0;

    if (this.modeSwitcher) {
      this.modeSwitcher.switchTo(mode === '4D' ? '4D' : '3D');
    }

    this.currentMode = mode;

    if (this.onModeChange) {
      this.onModeChange(mode);
    }

    console.log(`Switching to ${mode} mode...`);
  }

  /**
   * Get current visualization mode
   * @returns {string} Current mode ('3D' or '4D')
   */
  getCurrentMode() {
    return this.currentMode;
  }

  /**
   * Update camera state
   * @param {number} deltaTime - Time since last frame
   */
  updateCamera(deltaTime) {
    if (!this.initialized || !this.camera) return;

    this.camera.updateCameraState(deltaTime);

    // Update renderer camera
    if (this.renderer) {
      const cameraState = this.camera.getCamera();
      this.renderer.setCamera(cameraState);
    }
  }

  /**
   * Add keyframe to camera animation
   * @param {number} time - Time in milliseconds
   * @param {Array} position - Camera position [x, y, z]
   * @param {Array} target - Look-at target [x, y, z]
   * @param {number} fov - Field of view in degrees
   */
  addCameraKeyframe(time, position, target, fov = 45) {
    if (!this.initialized || !this.camera) return;
    this.camera.addKeyframe(time, position, target, fov);
  }

  /**
   * Play camera keyframe animation
   * @param {boolean} loop - Whether to loop the animation
   */
  playCameraKeyframes(loop = false) {
    if (!this.initialized || !this.camera) return;
    this.camera.playKeyframeAnimation(0, loop);
  }

  /**
   * Stop camera keyframe animation
   */
  stopCameraKeyframes() {
    if (!this.initialized || !this.camera) return;
    this.camera.stopKeyframeAnimation();
  }

  /**
   * Create Bezier curve camera path
   * @param {Array<Array>} controlPoints - Control points [[x,y,z], ...]
   * @param {number} segmentCount - Number of segments (default 100)
   * @returns {Array} Path points
   */
  createCameraPath(controlPoints, segmentCount = 100) {
    if (!this.initialized || !this.camera) return [];
    return this.camera.createBezierPath(controlPoints, segmentCount);
  }

  /**
   * Play camera along Bezier path
   * @param {number} duration - Duration in milliseconds
   * @param {boolean} loop - Whether to loop
   */
  playCameraPath(duration, loop = false) {
    if (!this.initialized || !this.camera) return;
    this.camera.playBezierPath(duration, loop, 'cubic');
  }

  /**
   * Stop camera path animation
   */
  stopCameraPath() {
    if (!this.initialized || !this.camera) return;
    this.camera.stopBezierPath();
  }

  /**
   * Set camera to track a target
   * @param {Array} targetPosition - Target position [x, y, z]
   * @param {number} smoothingFactor - Smoothing factor (0-1)
   */
  startCameraTracking(targetPosition, smoothingFactor = 0.1) {
    if (!this.initialized || !this.camera) return;
    this.camera.startTracking(targetPosition, smoothingFactor);
  }

  /**
   * Stop camera tracking
   */
  stopCameraTracking() {
    if (!this.initialized || !this.camera) return;
    this.camera.stopTracking();
  }

  /**
   * Auto-focus camera on particle system bounds
   * @param {Array} particles - Particle array
   */
  autoFocusCamera(particles) {
    if (!this.initialized || !this.camera) return;

    if (!particles || particles.length === 0) return;

    // Calculate AABB
    let minX = particles[0].x, maxX = particles[0].x;
    let minY = particles[0].y, maxY = particles[0].y;
    let minZ = particles[0].z, maxZ = particles[0].z;

    for (const p of particles) {
      minX = Math.min(minX, p.x);
      maxX = Math.max(maxX, p.x);
      minY = Math.min(minY, p.y);
      maxY = Math.max(maxY, p.y);
      minZ = Math.min(minZ, p.z);
      maxZ = Math.max(maxZ, p.z);
    }

    this.camera.focusOnAABB(
      [minX, minY, minZ],
      [maxX, maxY, maxZ]
    );
  }

  /**
   * Set render mode
   * @param {string} mode - 'points', 'spheres', or 'trails'
   */
  setRenderMode(mode) {
    if (!this.initialized || !this.renderer) return;
    this.renderer.setRenderMode(mode);
    this.config.renderMode = mode;
  }

  /**
   * Set color scheme
   * @param {string} scheme - 'energy', 'temporal', or 'velocity'
   */
  setColorScheme(scheme) {
    if (!this.initialized || !this.renderer) return;
    this.renderer.setColorScheme(scheme);
    this.config.colorScheme = scheme;
  }

  /**
   * Set simulation speed
   * @param {number} speed - Speed multiplier (0.1 - 5.0)
   */
  setSimulationSpeed(speed) {
    this.simulationSpeed = Math.max(0.1, Math.min(5.0, speed));
  }

  /**
   * Play/pause simulation
   * @param {boolean} running - Whether simulation is running
   */
  setSimulationRunning(running) {
    this.animationRunning = running;
  }

  /**
   * Get diagnostics data
   * @returns {Object} Diagnostics data or null
   */
  getDiagnostics() {
    if (!this.initialized || !this.diagnostics) return null;
    return this.diagnostics.getDiagnostics();
  }

  /**
   * Get measurements data
   * @returns {Object} Measurements or null
   */
  getMeasurements() {
    if (!this.initialized || !this.measurements) return null;
    return this.measurements.getMeasurements();
  }

  /**
   * Get current metrics/statistics
   * @returns {Object} Performance and state metrics
   */
  getStatistics() {
    return {
      ...this.metrics,
      mode: this.currentMode,
      isTransitioning: this.isTransitioning,
      transitionProgress: this.transitionProgress,
      isAnimating: this.animationRunning,
      simulationSpeed: this.simulationSpeed,
      diagnostics: this.getDiagnostics(),
      measurements: this.getMeasurements()
    };
  }

  /**
   * Main render loop
   * @private
   */
  startRenderLoop() {
    let lastTime = performance.now();

    const animate = (currentTime) => {
      if (!this.initialized) return;

      // Calculate delta time
      const deltaMs = currentTime - lastTime;
      lastTime = currentTime;
      
      this.deltaTime = (deltaMs / 1000) * this.simulationSpeed;
      this.metrics.frameTime = deltaMs;

      // Update camera
      this.updateCamera(this.deltaTime);

      // Update transition progress
      if (this.isTransitioning) {
        this.transitionProgress = Math.min(1, this.transitionProgress + deltaMs / 500); // 500ms transition
        if (this.transitionProgress >= 1) {
          this.isTransitioning = false;
        }
      }

      // Render frame
      if (this.renderer && this.animationRunning) {
        this.renderer.render(this.deltaTime, this.particleData);
      }

      // Update metrics
      this.frameCount++;
      if (this.frameCount % 60 === 0) {
        this.metrics.fps = Math.round(1000 / this.metrics.frameTime);

        // Emit stats callback
        if (this.onStatsUpdate) {
          this.onStatsUpdate(this.getStatistics());
        }
      }

      requestAnimationFrame(animate);
    };

    requestAnimationFrame(animate);
  }

  /**
   * Handle errors
   * @private
   */
  handleError(error, context) {
    console.error(`[Phase 10.9] ${context}:`, error);
    if (this.onError) {
      this.onError(error, context);
    }
  }

  /**
   * Create stub implementations for Phase 10 modules
   * These are fallbacks if the actual modules can't be loaded
   * @private
   */

  createStubRenderer() {
    return class {
      constructor() {}
      updateParticles() {}
      render() {}
      setRenderMode() {}
      setColorScheme() {}
      setCamera() {}
      dispose() {}
    };
  }

  createStubModeSwitcher() {
    return class {
      constructor() {}
      switchTo() {}
      updateParticles() {}
      getStatistics() {}
    };
  }

  createStubCamera() {
    return class {
      constructor() {}
      addKeyframe() {}
      playKeyframeAnimation() {}
      stopKeyframeAnimation() {}
      createBezierPath() { return []; }
      playBezierPath() {}
      stopBezierPath() {}
      startTracking() {}
      stopTracking() {}
      focusOnAABB() {}
      updateCameraState() {}
      getCamera() { return { position: [0,0,100], target: [0,0,0], fov: 45 }; }
    };
  }

  createStubVisualization() {
    return class {
      constructor() {}
      generateMesh() { return null; }
    };
  }

  createStubDiagnostics() {
    return class {
      constructor() {}
      updateParticles() {}
      getDiagnostics() { return {}; }
    };
  }

  createStubMeasurements() {
    return class {
      constructor() {}
      updateParticles() {}
      getMeasurements() { return {}; }
    };
  }

  createStubCollisionVisualizer() {
    return class {
      constructor() {}
      updateCollisions() {}
    };
  }

  /**
   * Cleanup and dispose resources
   */
  dispose() {
    if (this.renderer) {
      this.renderer.dispose();
    }

    if (this.camera) {
      // Camera cleanup if needed
    }

    this.initialized = false;
    console.log('✓ Phase10IntegrationModule disposed');
  }
}

export default Phase10IntegrationModule;
