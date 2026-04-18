/**
 * Phase 10.8: Advanced Camera Systems
 * 
 * High-performance camera control for 4D visualization:
 * - Bezier curve camera paths
 * - Spherical coordinate interpolation (Slerp)
 * - Target tracking and smooth following
 * - Keyframe animation system
 * - Camera constraints and limits
 * - Auto-focus on particle systems
 * - Real-time camera diagnostics
 * - Multiple interpolation methods
 * 
 * @module Phase10AdvancedCamera
 */

/**
 * Interpolation method enumeration
 */
const InterpolationMethod = {
  LINEAR: 'linear',           // Simple linear interpolation (Lerp)
  SPHERICAL: 'spherical',     // Spherical interpolation (Slerp)
  CUBIC: 'cubic',             // Cubic Bezier interpolation
  CATMULL_ROM: 'catmull_rom'  // Catmull-Rom spline
};

/**
 * Camera constraint types
 */
const CameraConstraint = {
  NONE: 'none',
  DISTANCE: 'distance',       // Min/max distance from target
  ANGLE: 'angle',             // Min/max rotation angles
  FOV: 'fov'                  // Min/max field of view
};

/**
 * Advanced Camera System for 4D visualization
 * Manages complex camera animations and smooth following
 */
class Phase10AdvancedCamera {
  /**
   * Initialize advanced camera
   * @param {Phase10GPURenderer} renderer - GPU renderer with camera
   * @param {Object} config - Configuration options
   */
  constructor(renderer, config = {}) {
    this.renderer = renderer;
    
    this.config = {
      // Interpolation
      interpolationMethod: config.interpolationMethod || InterpolationMethod.SPHERICAL,
      
      // Keyframe animation
      enableKeyframes: config.enableKeyframes !== false,
      autoLoopKeyframes: config.autoLoopKeyframes || false,
      
      // Smooth following
      enableSmoothing: config.enableSmoothing !== false,
      smoothingFactor: config.smoothingFactor || 0.15, // 0.1-0.3
      
      // Constraints
      minDistance: config.minDistance || 1.0,
      maxDistance: config.maxDistance || 500.0,
      minFOV: config.minFOV || 15,
      maxFOV: config.maxFOV || 120,
      minRotation: config.minRotation || -Math.PI,
      maxRotation: config.maxRotation || Math.PI,
      
      // Auto-focus
      enableAutoFocus: config.enableAutoFocus || false,
      autoFocusPadding: config.autoFocusPadding || 1.2,
      autoFocusSpeed: config.autoFocusSpeed || 0.1,
      
      ...config
    };
    
    // Current camera state
    this.camera = {
      position: [0, 0, 50],
      target: [0, 0, 0],
      up: [0, 1, 0],
      fov: 45
    };
    
    // Desired camera state (for smoothing)
    this.desiredCamera = {
      position: [0, 0, 50],
      target: [0, 0, 0],
      fov: 45
    };
    
    // Spherical coordinates for camera
    this.sphericalCoords = {
      radius: 50,       // Distance from target
      theta: Math.PI / 4,   // Azimuth angle
      phi: Math.PI / 3      // Polar angle
    };
    
    // Keyframe animation
    this.keyframes = [];
    this.currentKeyframeIndex = 0;
    this.keyframeProgress = 0;
    this.isPlayingKeyframes = false;
    this.keyframePlayTime = 0;
    this.keyframeTotalTime = 0;
    
    // Bezier curve data
    this.bezierCurves = [];
    this.currentBezierCurve = null;
    this.isBezierAnimating = false;
    this.bezierProgress = 0;
    
    // Target tracking
    this.trackingTarget = null;
    this.isTracking = false;
    this.trackingOffset = [0, 0, 0];
    
    // Auto-focus state
    this.focused = false;
    this.focusAABB = null;
    
    // Statistics
    this.stats = {
      keyframesCount: 0,
      bezierCurvesCount: 0,
      cameraMovements: 0,
      smoothingApplied: 0,
      autoFocusActivations: 0,
      interpolationMethod: this.config.interpolationMethod,
      lastFrameTime: 0
    };
  }

  /**
   * Update camera (call every frame)
   * @param {number} deltaTime - Time since last frame in ms
   * @param {Array<Object>} particles - Particles for tracking/focus
   */
  update(deltaTime, particles = null) {
    const startTime = performance.now();
    
    // Update keyframe animation
    if (this.isPlayingKeyframes) {
      this._updateKeyframeAnimation(deltaTime);
    }
    
    // Update Bezier curve animation
    if (this.isBezierAnimating) {
      this._updateBezierAnimation(deltaTime);
    }
    
    // Update target tracking
    if (this.isTracking && this.trackingTarget) {
      this._updateTargetTracking();
    }
    
    // Update auto-focus
    if (this.config.enableAutoFocus && particles && particles.length > 0) {
      this._updateAutoFocus(particles);
    }
    
    // Apply smoothing
    if (this.config.enableSmoothing) {
      this._applyCameraSmoothing();
    }
    
    // Enforce constraints
    this._enforceConstraints();
    
    // Update renderer camera
    this._syncRendererCamera();
    
    this.stats.lastFrameTime = performance.now() - startTime;
    this.stats.cameraMovements++;
  }

  /**
   * Add keyframe to animation sequence
   * @param {Object} keyframe - Keyframe data
   * @param {Array} keyframe.position - Camera position
   * @param {Array} keyframe.target - Look-at target
   * @param {number} keyframe.fov - Field of view
   * @param {number} keyframe.duration - Duration to next keyframe
   */
  addKeyframe(keyframe) {
    const normalized = {
      position: keyframe.position || this.camera.position,
      target: keyframe.target || this.camera.target,
      fov: keyframe.fov || this.camera.fov,
      duration: keyframe.duration || 1000 // ms
    };
    
    this.keyframes.push(normalized);
    this.stats.keyframesCount = this.keyframes.length;
  }

  /**
   * Play keyframe animation
   * @param {number} startIndex - Starting keyframe index (default 0)
   * @param {boolean} loop - Whether to loop animation
   */
  playKeyframes(startIndex = 0, loop = false) {
    if (this.keyframes.length === 0) return;
    
    this.currentKeyframeIndex = Math.min(startIndex, this.keyframes.length - 1);
    this.keyframeProgress = 0;
    this.isPlayingKeyframes = true;
    this.keyframePlayTime = 0;
    this.config.autoLoopKeyframes = loop;
  }

  /**
   * Stop keyframe animation
   */
  stopKeyframes() {
    this.isPlayingKeyframes = false;
    this.keyframeProgress = 0;
  }

  /**
   * Clear all keyframes
   */
  clearKeyframes() {
    this.keyframes = [];
    this.currentKeyframeIndex = 0;
    this.keyframeProgress = 0;
    this.isPlayingKeyframes = false;
    this.stats.keyframesCount = 0;
  }

  /**
   * Create Bezier path from points
   * @param {Array<Array>} points - Control points
   * @param {number} duration - Animation duration in ms
   * @returns {Object} Bezier curve data
   */
  createBezierPath(points, duration = 3000) {
    if (points.length < 2) {
      throw new Error('Bezier path requires at least 2 points');
    }
    
    const curve = {
      id: `bezier_${this.bezierCurves.length}`,
      points: points,
      duration: duration,
      pathLength: this._calculateBezierPathLength(points)
    };
    
    this.bezierCurves.push(curve);
    this.stats.bezierCurvesCount = this.bezierCurves.length;
    
    return curve;
  }

  /**
   * Play Bezier animation
   * @param {number} curveIndex - Index of Bezier curve
   */
  playBezierPath(curveIndex) {
    if (curveIndex < 0 || curveIndex >= this.bezierCurves.length) return;
    
    this.currentBezierCurve = this.bezierCurves[curveIndex];
    this.isBezierAnimating = true;
    this.bezierProgress = 0;
  }

  /**
   * Stop Bezier animation
   */
  stopBezierPath() {
    this.isBezierAnimating = false;
    this.bezierProgress = 0;
    this.currentBezierCurve = null;
  }

  /**
   * Start tracking target object with camera
   * @param {Array} targetPosition - Position to track
   * @param {Array} offset - Camera offset from target
   */
  trackTarget(targetPosition, offset = [0, 0, 20]) {
    this.trackingTarget = targetPosition;
    this.trackingOffset = offset;
    this.isTracking = true;
  }

  /**
   * Stop target tracking
   */
  stopTracking() {
    this.isTracking = false;
    this.trackingTarget = null;
  }

  /**
   * Enable auto-focus on particles
   * @param {boolean} enabled - Turn on/off
   */
  setAutoFocus(enabled) {
    this.config.enableAutoFocus = enabled;
  }

  /**
   * Focus camera on particle AABB
   * @param {Array} minBounds - Minimum bounds
   * @param {Array} maxBounds - Maximum bounds
   */
  focusOnBounds(minBounds, maxBounds) {
    this.focusAABB = { min: minBounds, max: maxBounds };
    this.focused = true;
    
    // Calculate center
    const center = [
      (minBounds[0] + maxBounds[0]) / 2,
      (minBounds[1] + maxBounds[1]) / 2,
      (minBounds[2] + maxBounds[2]) / 2
    ];
    
    // Calculate distance needed to see entire AABB
    const halfWidth = (maxBounds[0] - minBounds[0]) / 2;
    const halfHeight = (maxBounds[1] - minBounds[1]) / 2;
    const halfDepth = (maxBounds[2] - minBounds[2]) / 2;
    const maxHalf = Math.max(halfWidth, halfHeight, halfDepth);
    
    // FOV in radians
    const fovRad = this.camera.fov * Math.PI / 180;
    const distance = maxHalf / Math.tan(fovRad / 2);
    
    this.desiredCamera.target = center;
    this.desiredCamera.position = this._add(center, [0, 0, distance * this.config.autoFocusPadding]);
  }

  /**
   * Zoom camera in/out
   * @param {number} factor - Zoom factor (>1 = zoom in)
   * @param {number} duration - Animation duration in ms
   */
  zoom(factor, duration = 500) {
    const pos = this.camera.position;
    const target = this.camera.target;
    const dir = this._subtract(pos, target);
    const newDir = this._scale(dir, 1 / factor);
    const newPos = this._add(target, newDir);
    
    // Create single-keyframe animation
    this.addKeyframe({
      position: newPos,
      target: target,
      fov: this.camera.fov,
      duration: duration
    });
    
    this.playKeyframes(this.keyframes.length - 1);
  }

  /**
   * Rotate camera around target
   * @param {number} angleX - X rotation in radians
   * @param {number} angleY - Y rotation in radians
   * @param {number} duration - Animation duration in ms
   */
  orbitTarget(angleX, angleY, duration = 500) {
    // Convert to spherical
    const newTheta = this.sphericalCoords.theta + angleY;
    const newPhi = this.sphericalCoords.phi + angleX;
    
    // Calculate new position
    const newPos = this._sphericalToCartesian(
      this.sphericalCoords.radius,
      newTheta,
      newPhi,
      this.camera.target
    );
    
    this.addKeyframe({
      position: newPos,
      target: this.camera.target,
      fov: this.camera.fov,
      duration: duration
    });
    
    this.playKeyframes(this.keyframes.length - 1);
  }

  /**
   * Pan camera (move target)
   * @param {Array} direction - Pan direction [dx, dy, dz]
   * @param {number} distance - Pan distance
   * @param {number} duration - Animation duration in ms
   */
  pan(direction, distance = 10, duration = 500) {
    const normalized = this._normalize(direction);
    const offset = this._scale(normalized, distance);
    
    const newTarget = this._add(this.camera.target, offset);
    const newPosition = this._add(this.camera.position, offset);
    
    this.addKeyframe({
      position: newPosition,
      target: newTarget,
      fov: this.camera.fov,
      duration: duration
    });
    
    this.playKeyframes(this.keyframes.length - 1);
  }

  /**
   * Get current camera state
   * @returns {Object} Camera object
   */
  getCamera() {
    return {
      position: [...this.camera.position],
      target: [...this.camera.target],
      up: [...this.camera.up],
      fov: this.camera.fov
    };
  }

  /**
   * Set camera position
   * @param {Array} position - [x, y, z]
   */
  setPosition(position) {
    this.desiredCamera.position = position;
  }

  /**
   * Set camera target
   * @param {Array} target - [x, y, z]
   */
  setTarget(target) {
    this.desiredCamera.target = target;
  }

  /**
   * Set field of view
   * @param {number} fov - Field of view in degrees
   */
  setFOV(fov) {
    this.desiredCamera.fov = Math.max(this.config.minFOV, Math.min(fov, this.config.maxFOV));
  }

  /**
   * Get spherical coordinates
   * @returns {Object} Spherical coordinates
   */
  getSphericalCoordinates() {
    return {
      radius: this.sphericalCoords.radius,
      theta: this.sphericalCoords.theta,
      phi: this.sphericalCoords.phi
    };
  }

  /**
   * Set spherical coordinates
   * @param {number} radius - Distance from target
   * @param {number} theta - Azimuth angle
   * @param {number} phi - Polar angle
   */
  setSphericalCoordinates(radius, theta, phi) {
    this.sphericalCoords.radius = Math.max(this.config.minDistance, Math.min(radius, this.config.maxDistance));
    this.sphericalCoords.theta = theta;
    this.sphericalCoords.phi = phi;
    
    const newPos = this._sphericalToCartesian(
      this.sphericalCoords.radius,
      this.sphericalCoords.theta,
      this.sphericalCoords.phi,
      this.camera.target
    );
    
    this.camera.position = newPos;
  }

  /**
   * Get animation statistics
   * @returns {Object} Statistics
   */
  getStats() {
    return {
      ...this.stats,
      isPlayingKeyframes: this.isPlayingKeyframes,
      isBezierAnimating: this.isBezierAnimating,
      isTracking: this.isTracking,
      keyframeProgress: this.keyframeProgress,
      bezierProgress: this.bezierProgress,
      currentCamera: this.getCamera()
    };
  }

  /**
   * Update keyframe animation
   * @private
   */
  _updateKeyframeAnimation(deltaTime) {
    if (this.keyframes.length === 0) {
      this.isPlayingKeyframes = false;
      return;
    }
    
    this.keyframePlayTime += deltaTime;
    const currentKeyframe = this.keyframes[this.currentKeyframeIndex];
    
    if (this.keyframePlayTime >= currentKeyframe.duration) {
      // Move to next keyframe
      this.keyframePlayTime = 0;
      this.currentKeyframeIndex++;
      
      if (this.currentKeyframeIndex >= this.keyframes.length) {
        if (this.config.autoLoopKeyframes) {
          this.currentKeyframeIndex = 0;
        } else {
          this.isPlayingKeyframes = false;
          return;
        }
      }
    }
    
    // Interpolate between keyframes
    this.keyframeProgress = this.keyframePlayTime / currentKeyframe.duration;
    
    const nextIndex = this.currentKeyframeIndex + 1;
    if (nextIndex >= this.keyframes.length) return;
    
    const nextKeyframe = this.keyframes[nextIndex];
    
    // Interpolate camera state
    const t = this._ease(this.keyframeProgress, 'easeInOutCubic');
    
    this.desiredCamera.position = this._interpolateVector(
      currentKeyframe.position,
      nextKeyframe.position,
      t,
      this.config.interpolationMethod
    );
    
    this.desiredCamera.target = this._interpolateVector(
      currentKeyframe.target,
      nextKeyframe.target,
      t,
      this.config.interpolationMethod
    );
    
    this.desiredCamera.fov = currentKeyframe.fov + (nextKeyframe.fov - currentKeyframe.fov) * t;
  }

  /**
   * Update Bezier animation
   * @private
   */
  _updateBezierAnimation(deltaTime) {
    if (!this.currentBezierCurve) {
      this.isBezierAnimating = false;
      return;
    }
    
    this.bezierProgress += deltaTime / this.currentBezierCurve.duration;
    
    if (this.bezierProgress >= 1.0) {
      this.bezierProgress = 1.0;
      this.isBezierAnimating = false;
    }
    
    // Calculate position on Bezier curve
    const t = this._ease(this.bezierProgress, 'easeInOutCubic');
    const position = this._evaluateBezier(this.currentBezierCurve.points, t);
    
    this.desiredCamera.position = position;
  }

  /**
   * Update target tracking
   * @private
   */
  _updateTargetTracking() {
    if (!this.trackingTarget) return;
    
    const offsetPos = this._add(this.trackingTarget, this.trackingOffset);
    
    this.desiredCamera.position = offsetPos;
    this.desiredCamera.target = this.trackingTarget;
  }

  /**
   * Update auto-focus
   * @private
   */
  _updateAutoFocus(particles) {
    if (particles.length === 0) return;
    
    // Calculate AABB
    let minX = Infinity, minY = Infinity, minZ = Infinity;
    let maxX = -Infinity, maxY = -Infinity, maxZ = -Infinity;
    
    for (const particle of particles) {
      const pos = particle.position || particle;
      const p = Array.isArray(pos) ? pos : [pos.x, pos.y, pos.z];
      
      minX = Math.min(minX, p[0]);
      minY = Math.min(minY, p[1]);
      minZ = Math.min(minZ, p[2]);
      maxX = Math.max(maxX, p[0]);
      maxY = Math.max(maxY, p[1]);
      maxZ = Math.max(maxZ, p[2]);
    }
    
    const minBounds = [minX, minY, minZ];
    const maxBounds = [maxX, maxY, maxZ];
    
    this.focusOnBounds(minBounds, maxBounds);
    this.stats.autoFocusActivations++;
  }

  /**
   * Apply camera smoothing
   * @private
   */
  _applyCameraSmoothing() {
    const s = this.config.smoothingFactor;
    
    // Interpolate position
    this.camera.position = [
      this.camera.position[0] + (this.desiredCamera.position[0] - this.camera.position[0]) * s,
      this.camera.position[1] + (this.desiredCamera.position[1] - this.camera.position[1]) * s,
      this.camera.position[2] + (this.desiredCamera.position[2] - this.camera.position[2]) * s
    ];
    
    // Interpolate target
    this.camera.target = [
      this.camera.target[0] + (this.desiredCamera.target[0] - this.camera.target[0]) * s,
      this.camera.target[1] + (this.desiredCamera.target[1] - this.camera.target[1]) * s,
      this.camera.target[2] + (this.desiredCamera.target[2] - this.camera.target[2]) * s
    ];
    
    // Interpolate FOV
    this.camera.fov += (this.desiredCamera.fov - this.camera.fov) * s;
    
    this.stats.smoothingApplied++;
  }

  /**
   * Enforce camera constraints
   * @private
   */
  _enforceConstraints() {
    // Distance constraint
    const dist = this._distance(this.camera.position, this.camera.target);
    if (dist < this.config.minDistance || dist > this.config.maxDistance) {
      const dir = this._normalize(this._subtract(this.camera.position, this.camera.target));
      const newDist = Math.max(this.config.minDistance, Math.min(dist, this.config.maxDistance));
      this.camera.position = this._add(this.camera.target, this._scale(dir, newDist));
    }
    
    // FOV constraint
    this.camera.fov = Math.max(this.config.minFOV, Math.min(this.camera.fov, this.config.maxFOV));
  }

  /**
   * Sync camera to renderer
   * @private
   */
  _syncRendererCamera() {
    if (this.renderer && this.renderer.setCameraPosition) {
      this.renderer.setCameraPosition(this.camera.position);
      this.renderer.setCameraTarget(this.camera.target);
    }
  }

  /**
   * Calculate Bezier path length
   * @private
   */
  _calculateBezierPathLength(points, steps = 100) {
    let length = 0;
    let prev = this._evaluateBezier(points, 0);
    
    for (let i = 1; i <= steps; i++) {
      const next = this._evaluateBezier(points, i / steps);
      length += this._distance(prev, next);
      prev = next;
    }
    
    return length;
  }

  /**
   * Evaluate Bezier curve at parameter t
   * @private
   */
  _evaluateBezier(points, t) {
    if (points.length === 1) return points[0];
    if (points.length === 2) return this._lerp(points[0], points[1], t);
    
    // De Casteljau's algorithm
    const intermediate = [];
    for (let i = 0; i < points.length - 1; i++) {
      intermediate.push(this._lerp(points[i], points[i + 1], t));
    }
    
    return this._evaluateBezier(intermediate, t);
  }

  /**
   * Interpolate between vectors
   * @private
   */
  _interpolateVector(v1, v2, t, method) {
    if (method === InterpolationMethod.SPHERICAL) {
      return this._slerp(v1, v2, t);
    } else if (method === InterpolationMethod.LINEAR) {
      return this._lerp(v1, v2, t);
    } else {
      return this._lerp(v1, v2, t); // Default to linear
    }
  }

  /**
   * Linear interpolation
   * @private
   */
  _lerp(a, b, t) {
    return [
      a[0] + (b[0] - a[0]) * t,
      a[1] + (b[1] - a[1]) * t,
      a[2] + (b[2] - a[2]) * t
    ];
  }

  /**
   * Spherical interpolation (Slerp)
   * @private
   */
  _slerp(v1, v2, t) {
    const len1 = this._length(v1);
    const len2 = this._length(v2);
    
    const normalized1 = this._scale(v1, 1 / len1);
    const normalized2 = this._scale(v2, 1 / len2);
    
    const dot = this._dot(normalized1, normalized2);
    const clampedDot = Math.max(-1, Math.min(1, dot));
    const angle = Math.acos(clampedDot);
    
    if (Math.abs(angle) < 0.01) {
      // Vectors are nearly parallel, use linear interpolation
      return this._lerp(v1, v2, t);
    }
    
    const sinAngle = Math.sin(angle);
    const t1 = Math.sin((1 - t) * angle) / sinAngle;
    const t2 = Math.sin(t * angle) / sinAngle;
    
    const result = [
      t1 * v1[0] + t2 * v2[0],
      t1 * v1[1] + t2 * v2[1],
      t1 * v1[2] + t2 * v2[2]
    ];
    
    // Interpolate length
    const lerpLen = len1 + (len2 - len1) * t;
    const resultLen = this._length(result);
    
    if (resultLen > 0) {
      return this._scale(result, lerpLen / resultLen);
    }
    
    return result;
  }

  /**
   * Convert spherical to Cartesian coordinates
   * @private
   */
  _sphericalToCartesian(radius, theta, phi, center = [0, 0, 0]) {
    return [
      center[0] + radius * Math.sin(phi) * Math.cos(theta),
      center[1] + radius * Math.cos(phi),
      center[2] + radius * Math.sin(phi) * Math.sin(theta)
    ];
  }

  /**
   * Convert Cartesian to spherical coordinates
   * @private
   */
  _cartesianToSpherical(point, center = [0, 0, 0]) {
    const dx = point[0] - center[0];
    const dy = point[1] - center[1];
    const dz = point[2] - center[2];
    
    const radius = Math.sqrt(dx*dx + dy*dy + dz*dz);
    const theta = Math.atan2(dz, dx);
    const phi = Math.acos(dy / radius);
    
    return { radius, theta, phi };
  }

  /**
   * Easing function
   * @private
   */
  _ease(t, method) {
    if (method === 'easeInOutCubic') {
      return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
    }
    return t; // Linear
  }

  // Vector math utilities
  _add(a, b) { return [a[0]+b[0], a[1]+b[1], a[2]+b[2]]; }
  _subtract(a, b) { return [a[0]-b[0], a[1]-b[1], a[2]-b[2]]; }
  _scale(v, s) { return [v[0]*s, v[1]*s, v[2]*s]; }
  _dot(a, b) { return a[0]*b[0] + a[1]*b[1] + a[2]*b[2]; }
  _cross(a, b) { return [a[1]*b[2]-a[2]*b[1], a[2]*b[0]-a[0]*b[2], a[0]*b[1]-a[1]*b[0]]; }
  _length(v) { return Math.sqrt(v[0]*v[0] + v[1]*v[1] + v[2]*v[2]); }
  _distance(a, b) { return this._length(this._subtract(b, a)); }
  _normalize(v) { const len = this._length(v); return len > 0 ? this._scale(v, 1/len) : v; }

  /**
   * Dispose resources
   */
  dispose() {
    this.keyframes = [];
    this.bezierCurves = [];
    this.clearKeyframes();
  }
}

// Export for Node.js
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    Phase10AdvancedCamera,
    InterpolationMethod,
    CameraConstraint
  };
}
