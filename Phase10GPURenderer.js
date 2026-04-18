/**
 * Phase 10.6: GPU-Accelerated Real-Time Rendering
 * 
 * High-performance WebGL-based visualization for 4D physics:
 * - GPU-accelerated particle rendering
 * - Real-time collision visualization
 * - Interactive camera controls
 * - Hardware-accelerated projection
 * - Shader-based effects
 * - Performance optimization
 * 
 * @module Phase10GPURenderer
 */

/**
 * GPU-accelerated renderer for 4D physics visualization
 * Uses WebGL for hardware acceleration
 */
class Phase10GPURenderer {
  /**
   * Initialize GPU renderer
   * @param {HTMLCanvasElement} canvas - WebGL canvas element
   * @param {Object} config - Configuration
   */
  constructor(canvas, config = {}) {
    this.canvas = canvas;
    this.config = {
      antialiasing: config.antialiasing !== false,
      depthTest: config.depthTest !== false,
      cullFace: config.cullFace !== false,
      maxParticles: config.maxParticles || 10000,
      renderMode: config.renderMode || 'points', // 'points', 'spheres', 'trails'
      colorMode: config.colorMode || 'temporal', // 'temporal', 'energy', 'velocity'
      enableShadows: config.enableShadows || false,
      targetFPS: config.targetFPS || 60,
      ...config
    };
    
    // Get WebGL context
    this.gl = this.canvas.getContext('webgl2', {
      antialias: this.config.antialiasing,
      preserveDrawingBuffer: false,
      alpha: true
    });
    
    if (!this.gl) {
      throw new Error('WebGL2 not supported on this browser');
    }
    
    // State management
    this.programs = {};
    this.buffers = {};
    this.textures = {};
    this.framebuffers = {};
    
    this.renderStats = {
      framesRendered: 0,
      averageFPS: 0,
      lastFrameTime: 0,
      particlesRendered: 0,
      collidersRendered: 0,
      vertexCount: 0
    };
    
    // Camera state
    this.camera = {
      position: [0, 0, 50],
      target: [0, 0, 0],
      up: [0, 1, 0],
      fov: 45,
      aspect: this.canvas.width / this.canvas.height,
      near: 0.1,
      far: 10000,
      viewMatrix: null,
      projectionMatrix: null
    };
    
    // Animation state
    this.isAnimating = false;
    this.lastFrameTimestamp = 0;
    this.frameTimeHistory = [];
    
    this.initialize();
  }

  /**
   * Initialize WebGL context and compile shaders
   * @private
   */
  initialize() {
    const gl = this.gl;
    
    // Set up viewport
    gl.viewport(0, 0, this.canvas.width, this.canvas.height);
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    
    // Compile shader programs
    this.programs.particlePoint = this.createProgram(
      this.getVertexShader('particle-point'),
      this.getFragmentShader('particle-point')
    );
    
    this.programs.particleSphere = this.createProgram(
      this.getVertexShader('particle-sphere'),
      this.getFragmentShader('particle-sphere')
    );
    
    this.programs.collision = this.createProgram(
      this.getVertexShader('collision'),
      this.getFragmentShader('collision')
    );
    
    this.programs.trajectory = this.createProgram(
      this.getVertexShader('trajectory'),
      this.getFragmentShader('trajectory')
    );
    
    // Set up GPU buffers
    this.setupBuffers();
    
    // Enable GPU features
    if (this.config.depthTest) gl.enable(gl.DEPTH_TEST);
    if (this.config.cullFace) gl.enable(gl.CULL_FACE);
    
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
  }

  /**
   * Set up GPU buffers (VBO, VAO, etc.)
   * @private
   */
  setupBuffers() {
    const gl = this.gl;
    
    // Particle vertex buffer
    this.buffers.particlePosition = gl.createBuffer();
    this.buffers.particleColor = gl.createBuffer();
    this.buffers.particleSize = gl.createBuffer();
    
    // Collision data buffers
    this.buffers.collisionMesh = gl.createBuffer();
    this.buffers.collisionNormal = gl.createBuffer();
    
    // Trajectory buffers
    this.buffers.trajectoryVerts = gl.createBuffer();
    this.buffers.trajectoryColor = gl.createBuffer();
    
    // Index buffers
    this.buffers.indices = gl.createBuffer();
  }

  /**
   * Create WebGL program from vertex and fragment shaders
   * @private
   */
  createProgram(vertexSource, fragmentSource) {
    const gl = this.gl;
    
    const vertexShader = gl.createShader(gl.VERTEX_SHADER);
    gl.shaderSource(vertexShader, vertexSource);
    gl.compileShader(vertexShader);
    
    if (!gl.getShaderParameter(vertexShader, gl.COMPILE_STATUS)) {
      console.error('Vertex shader error:', gl.getShaderInfoLog(vertexShader));
      throw new Error('Vertex shader compilation failed');
    }
    
    const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
    gl.shaderSource(fragmentShader, fragmentSource);
    gl.compileShader(fragmentShader);
    
    if (!gl.getShaderParameter(fragmentShader, gl.COMPILE_STATUS)) {
      console.error('Fragment shader error:', gl.getShaderInfoLog(fragmentShader));
      throw new Error('Fragment shader compilation failed');
    }
    
    const program = gl.createProgram();
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);
    
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.error('Program linking error:', gl.getProgramInfoLog(program));
      throw new Error('Program linking failed');
    }
    
    gl.deleteShader(vertexShader);
    gl.deleteShader(fragmentShader);
    
    return program;
  }

  /**
   * Get vertex shader source code
   * @private
   */
  getVertexShader(name) {
    const shaders = {
      'particle-point': `
        #version 300 es
        in vec3 position;
        in vec3 color;
        in float size;
        
        uniform mat4 viewMatrix;
        uniform mat4 projectionMatrix;
        
        out vec3 vColor;
        
        void main() {
          gl_Position = projectionMatrix * viewMatrix * vec4(position, 1.0);
          gl_PointSize = size;
          vColor = color;
        }
      `,
      
      'particle-sphere': `
        #version 300 es
        in vec3 position;
        in vec3 normal;
        in vec3 color;
        
        uniform mat4 viewMatrix;
        uniform mat4 projectionMatrix;
        
        out vec3 vNormal;
        out vec3 vColor;
        out vec3 vPosition;
        
        void main() {
          gl_Position = projectionMatrix * viewMatrix * vec4(position, 1.0);
          vNormal = normalize(normal);
          vColor = color;
          vPosition = position;
        }
      `,
      
      'collision': `
        #version 300 es
        in vec3 position;
        in vec3 normal;
        
        uniform mat4 viewMatrix;
        uniform mat4 projectionMatrix;
        
        out vec3 vNormal;
        
        void main() {
          gl_Position = projectionMatrix * viewMatrix * vec4(position, 1.0);
          vNormal = normalize(normal);
        }
      `,
      
      'trajectory': `
        #version 300 es
        in vec3 position;
        in vec3 color;
        
        uniform mat4 viewMatrix;
        uniform mat4 projectionMatrix;
        
        out vec3 vColor;
        
        void main() {
          gl_Position = projectionMatrix * viewMatrix * vec4(position, 1.0);
          vColor = color;
        }
      `
    };
    
    if (!shaders[name]) throw new Error(`Unknown vertex shader: ${name}`);
    return shaders[name];
  }

  /**
   * Get fragment shader source code
   * @private
   */
  getFragmentShader(name) {
    const shaders = {
      'particle-point': `
        #version 300 es
        precision highp float;
        
        in vec3 vColor;
        out vec4 outColor;
        
        void main() {
          vec2 p = gl_PointCoord - 0.5;
          float dist = dot(p, p);
          if (dist > 0.25) discard;
          
          float alpha = 1.0 - sqrt(dist) * 2.0;
          outColor = vec4(vColor, alpha);
        }
      `,
      
      'particle-sphere': `
        #version 300 es
        precision highp float;
        
        in vec3 vNormal;
        in vec3 vColor;
        
        out vec4 outColor;
        
        void main() {
          vec3 normal = normalize(vNormal);
          vec3 light = normalize(vec3(1.0, 1.0, 1.0));
          float diffuse = dot(normal, light) * 0.5 + 0.5;
          
          outColor = vec4(vColor * diffuse, 1.0);
        }
      `,
      
      'collision': `
        #version 300 es
        precision highp float;
        
        in vec3 vNormal;
        out vec4 outColor;
        
        void main() {
          outColor = vec4(1.0, 0.5, 0.0, 0.8); // Orange for collisions
        }
      `,
      
      'trajectory': `
        #version 300 es
        precision highp float;
        
        in vec3 vColor;
        out vec4 outColor;
        
        void main() {
          outColor = vec4(vColor, 0.7);
        }
      `
    };
    
    if (!shaders[name]) throw new Error(`Unknown fragment shader: ${name}`);
    return shaders[name];
  }

  /**
   * Update camera matrix transformations
   */
  updateCameraMatrices() {
    // Simple orthogonal camera
    const eye = this.camera.position;
    const center = this.camera.target;
    const up = this.camera.up;
    
    // View matrix (lookAt)
    const f = this.subtract(center, eye);
    this.normalize(f);
    
    const s = this.cross(f, up);
    this.normalize(s);
    
    const u = this.cross(s, f);
    
    this.camera.viewMatrix = [
      s[0], u[0], -f[0], 0,
      s[1], u[1], -f[1], 0,
      s[2], u[2], -f[2], 0,
      -this.dot(s, eye), -this.dot(u, eye), this.dot(f, eye), 1
    ];
    
    // Projection matrix (perspective)
    const aspect = this.camera.aspect;
    const fovy = this.camera.fov * Math.PI / 180;
    const f_val = 1 / Math.tan(fovy / 2);
    const nf = 1 / (this.camera.near - this.camera.far);
    
    this.camera.projectionMatrix = [
      f_val / aspect, 0, 0, 0,
      0, f_val, 0, 0,
      0, 0, (this.camera.far + this.camera.near) * nf, -1,
      0, 0, 2 * this.camera.far * this.camera.near * nf, 0
    ];
  }

  /**
   * Render frame with particles and collisions
   * @param {Array} particles - Particle array with position/velocity/mass
   * @param {Array} collisions - Collision array
   */
  renderFrame(particles = [], collisions = []) {
    const gl = this.gl;
    const startTime = performance.now();
    
    // Clear
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    
    // Update matrices
    this.updateCameraMatrices();
    
    // Render particles
    if (particles.length > 0) {
      this.renderParticles(particles);
    }
    
    // Render collisions
    if (collisions.length > 0) {
      this.renderCollisions(collisions);
    }
    
    // Update stats
    const endTime = performance.now();
    this.renderStats.lastFrameTime = endTime - startTime;
    this.renderStats.framesRendered++;
    this.renderStats.particlesRendered = particles.length;
    this.renderStats.collidersRendered = collisions.length;
    
    this.frameTimeHistory.push(this.renderStats.lastFrameTime);
    if (this.frameTimeHistory.length > 60) this.frameTimeHistory.shift();
    
    this.renderStats.averageFPS = 1000 / (
      this.frameTimeHistory.reduce((a, b) => a + b, 0) / this.frameTimeHistory.length
    );
  }

  /**
   * Render particles
   * @private
   */
  renderParticles(particles) {
    const gl = this.gl;
    const program = this.programs[this.config.renderMode === 'spheres' ? 'particleSphere' : 'particlePoint'];
    
    gl.useProgram(program);
    
    // Prepare particle data
    const positions = new Float32Array(particles.length * 3);
    const colors = new Float32Array(particles.length * 3);
    const sizes = new Float32Array(particles.length);
    
    particles.forEach((p, idx) => {
      positions[idx * 3] = p.x || 0;
      positions[idx * 3 + 1] = p.y || 0;
      positions[idx * 3 + 2] = p.z || 0;
      
      // Color based on mode
      if (this.config.colorMode === 'velocity') {
        const v = Math.sqrt((p.vx||0)**2 + (p.vy||0)**2 + (p.vz||0)**2);
        colors[idx * 3] = Math.min(1, v / 100);
        colors[idx * 3 + 1] = 0.5;
        colors[idx * 3 + 2] = 1 - Math.min(1, v / 100);
      } else {
        colors[idx * 3] = 0.5 + 0.5 * Math.sin(idx);
        colors[idx * 3 + 1] = 0.5 + 0.5 * Math.cos(idx);
        colors[idx * 3 + 2] = 0.7;
      }
      
      sizes[idx] = 5 + Math.random() * 2;
    });
    
    // Set up buffers
    gl.bindBuffer(gl.ARRAY_BUFFER, this.buffers.particlePosition);
    gl.bufferData(gl.ARRAY_BUFFER, positions, gl.DYNAMIC_DRAW);
    
    gl.bindBuffer(gl.ARRAY_BUFFER, this.buffers.particleColor);
    gl.bufferData(gl.ARRAY_BUFFER, colors, gl.DYNAMIC_DRAW);
    
    gl.bindBuffer(gl.ARRAY_BUFFER, this.buffers.particleSize);
    gl.bufferData(gl.ARRAY_BUFFER, sizes, gl.DYNAMIC_DRAW);
    
    // Set uniforms
    const posLoc = gl.getAttribLocation(program, 'position');
    const colorLoc = gl.getAttribLocation(program, 'color');
    const sizeLoc = gl.getAttribLocation(program, 'size');
    
    gl.bindBuffer(gl.ARRAY_BUFFER, this.buffers.particlePosition);
    gl.enableVertexAttribArray(posLoc);
    gl.vertexAttribPointer(posLoc, 3, gl.FLOAT, false, 0, 0);
    
    gl.bindBuffer(gl.ARRAY_BUFFER, this.buffers.particleColor);
    gl.enableVertexAttribArray(colorLoc);
    gl.vertexAttribPointer(colorLoc, 3, gl.FLOAT, false, 0, 0);
    
    gl.bindBuffer(gl.ARRAY_BUFFER, this.buffers.particleSize);
    gl.enableVertexAttribArray(sizeLoc);
    gl.vertexAttribPointer(sizeLoc, 1, gl.FLOAT, false, 0, 0);
    
    // Set matrices
    const viewLoc = gl.getUniformLocation(program, 'viewMatrix');
    const projLoc = gl.getUniformLocation(program, 'projectionMatrix');
    
    gl.uniformMatrix4fv(viewLoc, false, this.camera.viewMatrix);
    gl.uniformMatrix4fv(projLoc, false, this.camera.projectionMatrix);
    
    // Draw
    gl.drawArrays(gl.POINTS, 0, particles.length);
    this.renderStats.vertexCount += particles.length;
  }

  /**
   * Render collisions
   * @private
   */
  renderCollisions(collisions) {
    const gl = this.gl;
    const program = this.programs.collision;
    
    gl.useProgram(program);
    
    collisions.forEach(collision => {
      const pos = collision.point || [0, 0, 0];
      
      // Draw collision as sphere
      const vertices = this.generateSphereMesh(pos, 2, 8);
      
      gl.bindBuffer(gl.ARRAY_BUFFER, this.buffers.collisionMesh);
      gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.DYNAMIC_DRAW);
      
      const posLoc = gl.getAttribLocation(program, 'position');
      gl.enableVertexAttribArray(posLoc);
      gl.vertexAttribPointer(posLoc, 3, gl.FLOAT, false, 0, 0);
      
      const viewLoc = gl.getUniformLocation(program, 'viewMatrix');
      const projLoc = gl.getUniformLocation(program, 'projectionMatrix');
      
      gl.uniformMatrix4fv(viewLoc, false, this.camera.viewMatrix);
      gl.uniformMatrix4fv(projLoc, false, this.camera.projectionMatrix);
      
      gl.drawArrays(gl.LINE_LOOP, 0, vertices.length / 3);
      this.renderStats.vertexCount += vertices.length / 3;
    });
  }

  /**
   * Generate sphere mesh vertices
   * @private
   */
  generateSphereMesh(center, radius, segments) {
    const vertices = [];
    const latSegs = segments;
    const lonSegs = segments * 2;
    
    for (let lat = 0; lat <= latSegs; lat++) {
      const theta = (lat * Math.PI) / latSegs;
      const sinTheta = Math.sin(theta);
      const cosTheta = Math.cos(theta);
      
      for (let lon = 0; lon <= lonSegs; lon++) {
        const phi = (lon * 2 * Math.PI) / lonSegs;
        const sinPhi = Math.sin(phi);
        const cosPhi = Math.cos(phi);
        
        vertices.push(
          center[0] + radius * sinTheta * cosPhi,
          center[1] + radius * cosTheta,
          center[2] + radius * sinTheta * sinPhi
        );
      }
    }
    
    return new Float32Array(vertices);
  }

  /**
   * Update camera position
   */
  setCameraPosition(x, y, z) {
    this.camera.position = [x, y, z];
  }

  /**
   * Update camera target (look-at point)
   */
  setCameraTarget(x, y, z) {
    this.camera.target = [x, y, z];
  }

  /**
   * Rotate camera around target
   */
  rotateCamera(angleX, angleY) {
    const pos = this.camera.position;
    const target = this.camera.target;
    const radius = Math.sqrt((pos[0]-target[0])**2 + (pos[1]-target[1])**2 + (pos[2]-target[2])**2);
    
    let theta = Math.atan2(pos[1] - target[1], pos[0] - target[0]) + angleX;
    let phi = Math.acos((pos[2] - target[2]) / radius) + angleY;
    
    phi = Math.max(0.1, Math.min(Math.PI - 0.1, phi));
    
    this.camera.position = [
      target[0] + radius * Math.sin(phi) * Math.cos(theta),
      target[1] + radius * Math.cos(phi),
      target[2] + radius * Math.sin(phi) * Math.sin(theta)
    ];
  }

  /**
   * Zoom camera (change distance to target)
   */
  zoomCamera(factor) {
    const pos = this.camera.position;
    const target = this.camera.target;
    const dir = this.subtract(pos, target);
    const scaled = this.scale(dir, factor);
    this.camera.position = this.add(target, scaled);
  }

  /**
   * Get rendering statistics
   */
  getStats() {
    return {
      ...this.renderStats,
      canvasWidth: this.canvas.width,
      canvasHeight: this.canvas.height,
      webglVersion: 2,
      antialiasing: this.config.antialiasing,
      renderMode: this.config.renderMode,
      colorMode: this.config.colorMode
    };
  }

  /**
   * Vector math utilities
   */
  add(a, b) {
    return [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
  }

  subtract(a, b) {
    return [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
  }

  scale(v, s) {
    return [v[0] * s, v[1] * s, v[2] * s];
  }

  dot(a, b) {
    return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
  }

  cross(a, b) {
    return [
      a[1] * b[2] - a[2] * b[1],
      a[2] * b[0] - a[0] * b[2],
      a[0] * b[1] - a[1] * b[0]
    ];
  }

  normalize(v) {
    const len = Math.sqrt(v[0]*v[0] + v[1]*v[1] + v[2]*v[2]);
    if (len > 0) {
      v[0] /= len; v[1] /= len; v[2] /= len;
    }
    return v;
  }

  /**
   * Clean up GPU resources
   */
  dispose() {
    const gl = this.gl;
    
    Object.values(this.programs).forEach(prog => gl.deleteProgram(prog));
    Object.values(this.buffers).forEach(buf => gl.deleteBuffer(buf));
    Object.values(this.textures).forEach(tex => gl.deleteTexture(tex));
    Object.values(this.framebuffers).forEach(fb => gl.deleteFramebuffer(fb));
  }
}

export default Phase10GPURenderer;
