/**
 * Phase 10.7: 3D/4D Mode Switching Engine
 * 
 * Dynamic visualization mode switching between 3D Euclidean space and 4D spacetime:
 * - Real-time mode transitions with smooth interpolation
 * - Dual physics system management (3D classical, 4D relativistic)
 * - Automatic particle state transformation
 * - Render pipeline switching
 * - Camera auto-adjustment for each mode
 * - Projection method optimization per mode
 * - Performance-adaptive rendering
 * 
 * @module Phase10ModeSwitching
 */

/**
 * Visualization modes enumeration
 */
const VisualizationMode = {
  MODE_3D: '3D',           // Classical 3D Euclidean space
  MODE_4D: '4D',           // 4D spacetime with temporal encoding
  MODE_HYBRID: 'HYBRID'    // Blended 3D/4D rendering
};

/**
 * Physics system enumeration
 */
const PhysicsSystem = {
  CLASSICAL_3D: 'classical_3d',   // Newtonian mechanics
  RELATIVISTIC_4D: 'relativistic_4d', // 4D spacetime physics
  HYBRID: 'hybrid'                // Interpolated between both
};

/**
 * Projection methods for each mode
 */
const ProjectionMethod = {
  // 3D modes
  ORTHOGRAPHIC_3D: 'orthographic_3d',
  PERSPECTIVE_3D: 'perspective_3d',
  
  // 4D modes
  ORTHOGRAPHIC_4D: 'orthographic_4d',
  PERSPECTIVE_4D: 'perspective_4d',
  STEREOGRAPHIC_4D: 'stereographic_4d',
  
  // Hybrid modes
  TEMPORAL_ENCODED: 'temporal_encoded'
};

/**
 * 3D/4D Mode Switching Engine
 * Manages transitions between visualization modes
 */
class Phase10ModeSwitching {
  /**
   * Initialize mode switching engine
   * @param {Phase10GPURenderer} gpuRenderer - GPU renderer instance
   * @param {Phase10Visualization} visualization - 4D visualization instance
   * @param {Object} config - Configuration options
   */
  constructor(gpuRenderer, visualization, config = {}) {
    this.gpuRenderer = gpuRenderer;
    this.visualization = visualization;
    
    this.config = {
      transitionDuration: config.transitionDuration || 1000, // ms
      autoOptimizeProjection: config.autoOptimizeProjection !== false,
      enablePhysicsSwitch: config.enablePhysicsSwitch !== false,
      particleColorEncoding: config.particleColorEncoding || 'temporal', // temporal, energy, velocity
      enableShadowMapping: config.enableShadowMapping || false,
      enableTemporalBlending: config.enableTemporalBlending !== false,
      maxParticles3D: config.maxParticles3D || 5000,
      maxParticles4D: config.maxParticles4D || 2000,
      ...config
    };
    
    // Current state
    this.currentMode = config.initialMode || VisualizationMode.MODE_3D;
    this.targetMode = this.currentMode;
    this.physicsSystem = config.initialPhysics || PhysicsSystem.CLASSICAL_3D;
    this.transitionProgress = 0; // 0 to 1
    this.isTransitioning = false;
    
    // Transition timing
    this.transitionStartTime = 0;
    this.transitionStarted = false;
    
    // Particle collections
    this.particles3D = [];      // Native 3D particles
    this.particles4D = [];      // 7D spacetime particles
    this.transformedParticles = []; // Temporary transformed particles for rendering
    
    // Cache for mode-specific data
    this.modeCache = {
      projection3D: ProjectionMethod.PERSPECTIVE_3D,
      projection4D: ProjectionMethod.STEREOGRAPHIC_4D,
      camera3D: {
        position: [50, 50, 50],
        target: [0, 0, 0],
        fov: 45
      },
      camera4D: {
        position: [0, 0, 50],
        target: [0, 0, 0],
        rotX: 0,
        rotY: 0,
        rotZ: 0
      }
    };
    
    // Statistics
    this.stats = {
      modeChanges: 0,
      transitionsCompleted: 0,
      particlesTransformed: 0,
      averageTransitionTime: 0,
      lastTransitionTime: 0,
      renderModeSwitches: 0
    };
    
    // Initialize state
    this._initializeMode(this.currentMode);
  }

  /**
   * Switch visualization mode
   * @param {string} targetMode - Target visualization mode
   * @param {Object} options - Transition options
   * @returns {Promise} Resolves when transition completes
   */
  switchMode(targetMode, options = {}) {
    if (targetMode === this.currentMode && !options.force) {
      return Promise.resolve();
    }
    
    const duration = options.duration || this.config.transitionDuration;
    const easing = options.easing || 'easeInOutCubic';
    
    return new Promise((resolve) => {
      this.targetMode = targetMode;
      this.transitionProgress = 0;
      this.isTransitioning = true;
      this.transitionStartTime = Date.now();
      this.transitionStarted = true;
      
      // Set up completion callback
      const checkCompletion = () => {
        if (this.transitionProgress >= 1.0) {
          this.currentMode = this.targetMode;
          this.isTransitioning = false;
          this.stats.transitionsCompleted++;
          
          // Cache the actual transition time
          this.stats.lastTransitionTime = Date.now() - this.transitionStartTime;
          
          // Update average
          const total = this.stats.transitionsCompleted;
          this.stats.averageTransitionTime = 
            (this.stats.averageTransitionTime * (total - 1) + this.stats.lastTransitionTime) / total;
          
          resolve();
        } else {
          requestAnimationFrame(checkCompletion);
        }
      };
      
      checkCompletion();
    });
  }

  /**
   * Update mode transition
   * Call this every frame during transition
   */
  updateTransition() {
    if (!this.isTransitioning) return;
    
    const elapsed = Date.now() - this.transitionStartTime;
    const duration = this.config.transitionDuration;
    
    // Calculate eased progress
    this.transitionProgress = Math.min(1.0, elapsed / duration);
    this.transitionProgress = this._easeInOutCubic(this.transitionProgress);
    
    // Update particle transformations
    this._transformParticles();
    
    // Update rendering pipeline
    this._updateRenderPipeline();
    
    // Update camera
    this._updateCamera();
  }

  /**
   * Set particles for 3D mode
   * @param {Array<Particle3D>} particles - 3D particles
   */
  setParticles3D(particles) {
    this.particles3D = particles || [];
    
    if (this.currentMode === VisualizationMode.MODE_3D) {
      this.transformedParticles = this._prepare3DParticles(particles);
    }
  }

  /**
   * Set particles for 4D mode
   * @param {Array<Particle4D>} particles - 7D spacetime particles
   */
  setParticles4D(particles) {
    this.particles4D = particles || [];
    
    if (this.currentMode === VisualizationMode.MODE_4D) {
      this.transformedParticles = this._prepare4DParticles(particles);
    }
  }

  /**
   * Get current render particles
   * @returns {Array} Particles ready for rendering
   */
  getRenderParticles() {
    return this.transformedParticles;
  }

  /**
   * Get current visualization mode
   * @returns {string} Current mode
   */
  getMode() {
    return this.currentMode;
  }

  /**
   * Get transition progress (0 to 1)
   * @returns {number} Progress value
   */
  getTransitionProgress() {
    return this.transitionProgress;
  }

  /**
   * Check if currently transitioning
   * @returns {boolean} True if in transition
   */
  isInTransition() {
    return this.isTransitioning;
  }

  /**
   * Get rendering statistics
   * @returns {Object} Statistics object
   */
  getStats() {
    return {
      ...this.stats,
      currentMode: this.currentMode,
      isTransitioning: this.isTransitioning,
      transitionProgress: this.transitionProgress,
      particlesLoaded: {
        mode3D: this.particles3D.length,
        mode4D: this.particles4D.length,
        rendered: this.transformedParticles.length
      }
    };
  }

  /**
   * Get camera position for current mode
   * @returns {Array} [x, y, z] camera position
   */
  getCameraPosition() {
    if (this.currentMode === VisualizationMode.MODE_3D) {
      return this.modeCache.camera3D.position;
    } else if (this.currentMode === VisualizationMode.MODE_4D) {
      return this.modeCache.camera4D.position;
    } else {
      // Hybrid: interpolate between both
      const pos3D = this.modeCache.camera3D.position;
      const pos4D = this.modeCache.camera4D.position;
      const t = this.transitionProgress;
      return [
        pos3D[0] + (pos4D[0] - pos3D[0]) * t,
        pos3D[1] + (pos4D[1] - pos3D[1]) * t,
        pos3D[2] + (pos4D[2] - pos3D[2]) * t
      ];
    }
  }

  /**
   * Set camera position for mode
   * @param {Array} position - [x, y, z]
   * @param {string} mode - Mode to set camera for (defaults to current)
   */
  setCameraPosition(position, mode = null) {
    const targetMode = mode || this.currentMode;
    
    if (targetMode === VisualizationMode.MODE_3D) {
      this.modeCache.camera3D.position = position;
    } else if (targetMode === VisualizationMode.MODE_4D) {
      this.modeCache.camera4D.position = position;
    }
  }

  /**
   * Get camera target for current mode
   * @returns {Array} [x, y, z] target position
   */
  getCameraTarget() {
    if (this.currentMode === VisualizationMode.MODE_3D) {
      return this.modeCache.camera3D.target;
    } else if (this.currentMode === VisualizationMode.MODE_4D) {
      return this.modeCache.camera4D.target;
    } else {
      // Hybrid: interpolate
      const tgt3D = this.modeCache.camera3D.target;
      const tgt4D = this.modeCache.camera4D.target;
      const t = this.transitionProgress;
      return [
        tgt3D[0] + (tgt4D[0] - tgt3D[0]) * t,
        tgt3D[1] + (tgt4D[1] - tgt3D[1]) * t,
        tgt3D[2] + (tgt4D[2] - tgt3D[2]) * t
      ];
    }
  }

  /**
   * Get projection method for current mode
   * @returns {string} Projection method
   */
  getProjectionMethod() {
    if (this.isTransitioning) {
      // Blend projection methods during transition
      const method3D = this.modeCache.projection3D;
      const method4D = this.modeCache.projection4D;
      return this.transitionProgress < 0.5 ? method3D : method4D;
    }
    
    if (this.currentMode === VisualizationMode.MODE_3D) {
      return this.modeCache.projection3D;
    } else if (this.currentMode === VisualizationMode.MODE_4D) {
      return this.modeCache.projection4D;
    } else {
      return ProjectionMethod.TEMPORAL_ENCODED;
    }
  }

  /**
   * Set rendering configuration for target mode
   * @param {string} mode - Mode to configure
   * @param {Object} config - Configuration object
   */
  configureMode(mode, config) {
    if (mode === VisualizationMode.MODE_3D) {
      this.modeCache.camera3D = { ...this.modeCache.camera3D, ...config.camera };
      if (config.projection) {
        this.modeCache.projection3D = config.projection;
      }
    } else if (mode === VisualizationMode.MODE_4D) {
      this.modeCache.camera4D = { ...this.modeCache.camera4D, ...config.camera };
      if (config.projection) {
        this.modeCache.projection4D = config.projection;
      }
    }
  }

  /**
   * Enable/disable temporal blending
   * @param {boolean} enabled - Whether to enable temporal blending
   */
  setTemporalBlending(enabled) {
    this.config.enableTemporalBlending = enabled;
  }

  /**
   * Set color encoding for particles
   * @param {string} encoding - 'temporal', 'energy', or 'velocity'
   */
  setParticleColorEncoding(encoding) {
    if (['temporal', 'energy', 'velocity'].includes(encoding)) {
      this.config.particleColorEncoding = encoding;
    }
  }

  /**
   * Get physics system for current mode
   * @returns {string} Physics system type
   */
  getPhysicsSystem() {
    if (this.currentMode === VisualizationMode.MODE_3D) {
      return PhysicsSystem.CLASSICAL_3D;
    } else if (this.currentMode === VisualizationMode.MODE_4D) {
      return PhysicsSystem.RELATIVISTIC_4D;
    } else {
      return PhysicsSystem.HYBRID;
    }
  }

  /**
   * Convert Particle4D to rendering format for 3D mode
   * @param {Array<Particle4D>} particles - Input particles
   * @returns {Array<Object>} Render particles
   * @private
   */
  _prepare3DParticles(particles) {
    return particles.map(p => ({
      position: p.spatialPosition || [0, 0, 0],
      color: this._encodeParticleColor3D(p),
      size: this._calculateParticleSize3D(p),
      energy: p.energy || 0
    }));
  }

  /**
   * Prepare 4D particles for rendering
   * @param {Array<Particle4D>} particles - Input particles
   * @returns {Array<Object>} Render particles
   * @private
   */
  _prepare4DParticles(particles) {
    // Project 7D to 3D and encode temporal info
    return particles.map(p => ({
      position: this.visualization.project4DTo3D(p.position),
      color: this._encodeParticleColor4D(p),
      size: this._calculateParticleSize4D(p),
      temporal: p.temporalPosition,
      energy: p.energy
    }));
  }

  /**
   * Transform particles during mode transition
   * @private
   */
  _transformParticles() {
    const t = this.transitionProgress;
    
    if (this.targetMode === VisualizationMode.MODE_3D) {
      // Transitioning to 3D
      const particles3D = this._prepare3DParticles(this.particles4D);
      this.transformedParticles = particles3D;
    } else if (this.targetMode === VisualizationMode.MODE_4D) {
      // Transitioning to 4D
      const particles4D = this._prepare4DParticles(this.particles4D);
      this.transformedParticles = particles4D;
    } else {
      // Hybrid mode
      const particles3D = this._prepare3DParticles(this.particles4D);
      const particles4D = this._prepare4DParticles(this.particles4D);
      
      // Blend positions
      this.transformedParticles = particles3D.map((p3d, i) => {
        const p4d = particles4D[i];
        return {
          position: [
            p3d.position[0] + (p4d.position[0] - p3d.position[0]) * t,
            p3d.position[1] + (p4d.position[1] - p3d.position[1]) * t,
            p3d.position[2] + (p4d.position[2] - p3d.position[2]) * t
          ],
          color: this._blendColors(p3d.color, p4d.color, t),
          size: p3d.size + (p4d.size - p3d.size) * t,
          energy: p3d.energy
        };
      });
    }
    
    this.stats.particlesTransformed = this.transformedParticles.length;
  }

  /**
   * Update rendering pipeline for current mode
   * @private
   */
  _updateRenderPipeline() {
    // Adjust GPU renderer settings based on target mode
    if (this.targetMode === VisualizationMode.MODE_3D) {
      this.gpuRenderer.config.renderMode = 'points';
      this.gpuRenderer.config.colorMode = 'energy';
      this.gpuRenderer.config.maxParticles = this.config.maxParticles3D;
    } else if (this.targetMode === VisualizationMode.MODE_4D) {
      this.gpuRenderer.config.renderMode = 'spheres';
      this.gpuRenderer.config.colorMode = this.config.particleColorEncoding;
      this.gpuRenderer.config.maxParticles = this.config.maxParticles4D;
    } else {
      // Hybrid
      this.gpuRenderer.config.renderMode = 'points';
      this.gpuRenderer.config.colorMode = 'temporal';
    }
    
    this.stats.renderModeSwitches++;
  }

  /**
   * Update camera during transition
   * @private
   */
  _updateCamera() {
    const pos = this.getCameraPosition();
    const target = this.getCameraTarget();
    
    if (this.gpuRenderer && this.gpuRenderer.setCameraPosition) {
      this.gpuRenderer.setCameraPosition(pos);
      this.gpuRenderer.setCameraTarget(target);
    }
  }

  /**
   * Encode particle color for 3D mode
   * @param {Particle4D} particle - Input particle
   * @returns {Array<number>} [r, g, b, a] color
   * @private
   */
  _encodeParticleColor3D(particle) {
    const encoding = this.config.particleColorEncoding;
    
    if (encoding === 'energy') {
      const energy = Math.min(particle.energy / 1e10, 1.0);
      return [energy, 1 - energy * 0.5, 0.2, 1.0];
    } else if (encoding === 'velocity') {
      const vel = particle.spatialVelocity;
      const speed = Math.sqrt(vel[0]*vel[0] + vel[1]*vel[1] + vel[2]*vel[2]);
      const normalized = Math.min(speed / 100000, 1.0);
      return [normalized, 0.4, 1 - normalized, 1.0];
    }
    
    return [0.5, 0.5, 1.0, 1.0]; // Default cyan
  }

  /**
   * Encode particle color for 4D mode
   * @param {Particle4D} particle - Input particle
   * @returns {Array<number>} [r, g, b, a] color
   * @private
   */
  _encodeParticleColor4D(particle) {
    const encoding = this.config.particleColorEncoding;
    
    if (encoding === 'temporal') {
      // Temporal: encode T₀, T₁, T₂ into RGB
      const [t0, t1, t2] = particle.temporalPosition;
      return [
        Math.abs(t0) % 1.0,
        Math.abs(t1) % 1.0,
        Math.abs(t2) % 1.0,
        1.0
      ];
    } else if (encoding === 'energy') {
      const energy = Math.min(particle.energy / 1e10, 1.0);
      return [energy, 1 - energy * 0.5, 0.2, 1.0];
    } else if (encoding === 'velocity') {
      const vel = particle.spatialVelocity;
      const speed = Math.sqrt(vel[0]*vel[0] + vel[1]*vel[1] + vel[2]*vel[2]);
      const normalized = Math.min(speed / 100000, 1.0);
      return [normalized, 0.4, 1 - normalized, 1.0];
    }
    
    return [0.5, 0.5, 1.0, 1.0];
  }

  /**
   * Calculate particle size for 3D mode
   * @param {Particle4D} particle - Input particle
   * @returns {number} Size in pixels
   * @private
   */
  _calculateParticleSize3D(particle) {
    const energy = particle.energy || 1;
    const mass = particle.mass || 1;
    return 2 + Math.log(Math.abs(energy) + 1) * 0.5;
  }

  /**
   * Calculate particle size for 4D mode
   * @param {Particle4D} particle - Input particle
   * @returns {number} Size in pixels
   * @private
   */
  _calculateParticleSize4D(particle) {
    const energy = particle.energy || 1;
    const temporal = particle.temporalPosition;
    const temporalMag = Math.sqrt(temporal[0]*temporal[0] + temporal[1]*temporal[1] + temporal[2]*temporal[2]);
    return 3 + Math.log(Math.abs(energy) + temporalMag + 1) * 0.3;
  }

  /**
   * Blend two colors
   * @param {Array<number>} color1 - [r, g, b, a]
   * @param {Array<number>} color2 - [r, g, b, a]
   * @param {number} t - Blend factor (0 to 1)
   * @returns {Array<number>} Blended color
   * @private
   */
  _blendColors(color1, color2, t) {
    return [
      color1[0] + (color2[0] - color1[0]) * t,
      color1[1] + (color2[1] - color1[1]) * t,
      color1[2] + (color2[2] - color1[2]) * t,
      color1[3] + (color2[3] - color1[3]) * t
    ];
  }

  /**
   * Easing function: easeInOutCubic
   * @param {number} t - Time value (0 to 1)
   * @returns {number} Eased value
   * @private
   */
  _easeInOutCubic(t) {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  }

  /**
   * Initialize mode-specific settings
   * @param {string} mode - Mode to initialize
   * @private
   */
  _initializeMode(mode) {
    if (mode === VisualizationMode.MODE_3D) {
      this.physicsSystem = PhysicsSystem.CLASSICAL_3D;
      this.transformedParticles = this._prepare3DParticles(this.particles4D);
    } else if (mode === VisualizationMode.MODE_4D) {
      this.physicsSystem = PhysicsSystem.RELATIVISTIC_4D;
      this.transformedParticles = this._prepare4DParticles(this.particles4D);
    } else {
      this.physicsSystem = PhysicsSystem.HYBRID;
    }
    
    this.stats.modeChanges++;
  }

  /**
   * Dispose resources
   */
  dispose() {
    this.particles3D = [];
    this.particles4D = [];
    this.transformedParticles = [];
  }
}

// Export for use in Node.js
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    Phase10ModeSwitching,
    VisualizationMode,
    PhysicsSystem,
    ProjectionMethod
  };
}
