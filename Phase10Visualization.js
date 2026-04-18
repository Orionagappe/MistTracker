/**
 * Phase 10.4 - 4D Collision Visualization Engine
 * 
 * Renders 4D/7D spacetime collisions in 3D space using orthographic projections
 * and Web GL-compatible data structures.
 * 
 * Features:
 * - 4D → 3D projection (multiple methods)
 * - Collision heat maps (energy dissipation)
 * - Trajectory trails (predicted vs actual)
 * - Light-cone causality surfaces
 * - Real-time mesh generation
 * - WebGL/Three.js compatibility
 */

class Phase10Visualization {
  /**
   * 4D Visualization Engine
   * Converts physics data to renderable geometry
   */
  constructor(options = {}) {
    this.projectionMode = options.projectionMode || 'orthographic';  // orthographic, perspective, stereographic
    this.width = options.width || 1024;
    this.height = options.height || 1024;
    this.depthRange = options.depthRange || 100;
    
    // Camera parameters
    this.cameraPosition = options.cameraPosition || [50, 50, 50];
    this.cameraDirection = options.cameraDirection || [0, 0, 0];
    this.rotationX = options.rotationX || 0;
    this.rotationY = options.rotationY || 0;
    this.rotationZ = options.rotationZ || 0;
    
    // Rendering options
    this.renderCollisions = options.renderCollisions ?? true;
    this.renderTrajectories = options.renderTrajectories ?? true;
    this.renderLightCone = options.renderLightCone ?? true;
    this.renderHeatMap = options.renderHeatMap ?? true;
    
    // Mesh data
    this.meshes = [];
    this.vertices = [];
    this.faces = [];
    this.colors = [];
    
    // 4D time parameter
    this.timeSlice = options.timeSlice || 0;  // Which T0/T1/T2 slice to visualize
    this.blendMode = options.blendMode || 'sum';  // How to blend multiple times: sum, max, avg
    
    // Transparency for 4D visualization
    this.opacityByDistance = options.opacityByDistance ?? true;
  }

  /**
   * Project 4D point to 3D using orthographic projection
   * Ignores one dimension based on viewpoint
   * 
   * 7D: [T0, T1, T2, x, y, z, w]
   * Project to [x, y, z] space, with T0/T1/T2/w encoded in other channels
   */
  project4DTo3D(point7D) {
    const [T0, T1, T2, x, y, z, w] = point7D;

    // Orthographic projection: simply drop or blend extra dimensions
    let projected;

    if (this.projectionMode === 'orthographic') {
      // Simple orthographic: use [x, y, z] and ignore temporal dimensions
      projected = [x, y, z];
    } else if (this.projectionMode === 'perspective') {
      // Perspective projection: temporal dimensions affect depth
      const depth_factor = 1 + (T0 + T1 + T2) * 0.01;
      projected = [
        x * depth_factor,
        y * depth_factor,
        z * depth_factor
      ];
    } else if (this.projectionMode === 'stereographic') {
      // Stereographic projection: map from sphere
      const r_spatial = Math.sqrt(x*x + y*y + z*z);
      const r_temporal = Math.sqrt(T0*T0 + T1*T1 + T2*T2);
      const totalR = r_spatial + r_temporal * 0.1;

      if (totalR > 0) {
        projected = [
          (x * this.depthRange) / (1 + totalR),
          (y * this.depthRange) / (1 + totalR),
          (z * this.depthRange) / (1 + totalR)
        ];
      } else {
        projected = [0, 0, 0];
      }
    }

    // Apply camera rotation
    return this.rotatePoint(projected);
  }

  /**
   * Rotate point by camera angles (Euler angles)
   */
  rotatePoint(point) {
    let [x, y, z] = point;

    // Rotate around X axis
    let y_rot = y * Math.cos(this.rotationX) - z * Math.sin(this.rotationX);
    let z_rot = y * Math.sin(this.rotationX) + z * Math.cos(this.rotationX);

    // Rotate around Y axis
    let x_rot = x * Math.cos(this.rotationY) + z_rot * Math.sin(this.rotationY);
    z_rot = -x * Math.sin(this.rotationY) + z_rot * Math.cos(this.rotationY);

    // Rotate around Z axis
    x = x_rot * Math.cos(this.rotationZ) - y_rot * Math.sin(this.rotationZ);
    y = x_rot * Math.sin(this.rotationZ) + y_rot * Math.cos(this.rotationZ);

    return [x, y, z];
  }

  /**
   * View Frustum Culling - don't render points outside view
   */
  isInViewport(point3D) {
    const [x, y, z] = point3D;
    return (x >= -this.depthRange && x <= this.depthRange &&
            y >= -this.depthRange && y <= this.depthRange &&
            z >= -this.depthRange && z <= this.depthRange);
  }

  /**
   * Map temporal dimensions to color (heat map)
   * 
   * T0 (quantum): Red channel
   * T1 (interaction): Green channel
   * T2 (cosmological): Blue channel
   */
  getColorFrom7D(point7D) {
    const [T0, T1, T2, x, y, z, w] = point7D;

    // Normalize temporal coordinates to [0, 1]
    const r_T0 = Math.min(1, Math.abs(T0) / 1e-44);  // Planck time scale
    const r_T1 = Math.min(1, Math.abs(T1) / 1e-12);  // QED scale
    const r_T2 = Math.min(1, Math.abs(T2) / 1e17);   // Cosmological scale

    // RGB color encoding: T0→R, T1→G, T2→B
    const r = Math.floor(r_T0 * 255);
    const g = Math.floor(r_T1 * 255);
    const b = Math.floor(r_T2 * 255);

    return {
      r: r,
      g: g,
      b: b,
      hex: `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`
    };
  }

  /**
   * Generate vertex array from particle positions
   * One vertex per particle, projected to 3D
   */
  generateParticleVertices(particles) {
    this.vertices = [];
    this.colors = [];

    for (const particle of particles) {
      const proj = this.project4DTo3D(particle.position);

      if (this.isInViewport(proj)) {
        this.vertices.push({
          position: proj,
          size: 2,  // Point size
          particleIndex: this.vertices.length
        });

        const color = this.getColorFrom7D(particle.position);
        this.colors.push(color);
      }
    }

    return this.vertices;
  }

  /**
   * Generate mesh for collision points
   * Combines collision normal and energy information
   */
  generateCollisionMesh(collisions, particles) {
    const meshes = [];

    for (const collision of collisions) {
      const p1 = particles[collision.p1Index];
      const p2 = particles[collision.p2Index];

      // Midpoint of collision
      const midpoint = [
        (p1.position[3] + p2.position[3]) / 2,
        (p1.position[4] + p2.position[4]) / 2,
        (p1.position[5] + p2.position[5]) / 2,
        (p1.position[0] + p2.position[0]) / 2,
        (p1.position[1] + p2.position[1]) / 2,
        (p1.position[2] + p2.position[2]) / 2,
        (p1.position[6] + p2.position[6]) / 2
      ];

      const proj = this.project4DTo3D(midpoint);

      if (this.isInViewport(proj)) {
        // Create arrow mesh showing collision normal
        const normal = collision.normal;
        const arrowEnd = [
          proj[0] + normal[0] * 5,
          proj[1] + normal[1] * 5,
          proj[2] + normal[2] * 5
        ];

        const color = this.getColorFrom7D(midpoint);
        const intensity = collision.depth * 1e35;  // Scale Planck length to visible

        meshes.push({
          type: 'arrow',
          start: proj,
          end: arrowEnd,
          normal: normal,
          depth: collision.depth,
          color: color,
          intensity: Math.min(1, intensity)
        });
      }
    }

    return meshes;
  }

  /**
   * Generate trajectory mesh - predicted vs actual paths
   */
  generateTrajectoryMesh(particles, predicted = null) {
    const trajectories = [];

    for (let i = 0; i < particles.length; i++) {
      const particle = particles[i];
      const proj_current = this.project4DTo3D(particle.position);

      if (!this.isInViewport(proj_current)) continue;

      // Predicted next position
      if (predicted && predicted[i]) {
        const proj_predicted = this.project4DTo3D(predicted[i].position);

        trajectories.push({
          type: 'line',
          start: proj_current,
          end: proj_predicted,
          color: this.getColorFrom7D(particle.position),
          style: 'dashed',
          particleIndex: i
        });
      } else {
        // Extrapolate from velocity
        const next_pos = [
          particle.position[0] + particle.velocity[0] * 0.01,
          particle.position[1] + particle.velocity[1] * 0.01,
          particle.position[2] + particle.velocity[2] * 0.01,
          particle.position[3] + particle.velocity[3] * 0.01,
          particle.position[4] + particle.velocity[4] * 0.01,
          particle.position[5] + particle.velocity[5] * 0.01,
          particle.position[6] + particle.velocity[6] * 0.01
        ];

        const proj_next = this.project4DTo3D(next_pos);

        trajectories.push({
          type: 'line',
          start: proj_current,
          end: proj_next,
          color: this.getColorFrom7D(particle.position),
          style: 'solid',
          particleIndex: i
        });
      }
    }

    return trajectories;
  }

  /**
   * Generate light-cone causality surface
   * Shows forbidden region (faster than light)
   */
  generateLightConeSurface(center = [0, 0, 0], speedOfLight = 2.998e8) {
    const lightCone = {
      type: 'cone',
      center: center,
      apex: [center[0], center[1], center[2] + 50],
      radius: 50,
      color: { r: 255, g: 100, b: 100, hex: '#FF6464' },
      opacity: 0.1,
      segments: 32
    };

    return lightCone;
  }

  /**
   * Generate heat map mesh for energy dissipation
   * Creates a colored surface showing energy loss
   */
  generateEnergyHeatMap(collisions, gridSize = 10) {
    // Create grid of temperature points
    const grid = [];

    for (let x = -this.depthRange; x <= this.depthRange; x += gridSize) {
      for (let y = -this.depthRange; y <= this.depthRange; y += gridSize) {
        let energy = 0;
        let weight = 0;

        // Accumulate energy from nearby collisions
        for (const collision of collisions) {
          const dx = x - collision.normal[0] * 5;
          const dy = y - collision.normal[1] * 5;
          const dist_sq = dx*dx + dy*dy;
          const influence = Math.exp(-dist_sq / (gridSize*gridSize));

          energy += collision.depth * influence;
          weight += influence;
        }

        if (weight > 0) {
          grid.push({
            x: x,
            y: y,
            z: 0,
            energy: energy / weight
          });
        }
      }
    }

    return {
      type: 'heatmap',
      grid: grid,
      colorScale: 'viridis'  // Red (low) to Yellow (high)
    };
  }

  /**
   * Complete visualization pipeline - render all data
   */
  renderFrame(particles, collisions, predictedPositions = null) {
    // Clear previous meshes
    this.meshes = [];
    this.vertices = [];
    this.colors = [];

    // Generate all geometry
    if (particles.length > 0) {
      this.generateParticleVertices(particles);
    }

    if (this.renderCollisions && collisions.length > 0) {
      this.meshes.push(...this.generateCollisionMesh(collisions, particles));
    }

    if (this.renderTrajectories && particles.length > 0) {
      this.meshes.push(...this.generateTrajectoryMesh(particles, predictedPositions));
    }

    if (this.renderLightCone) {
      this.meshes.push(this.generateLightConeSurface());
    }

    if (this.renderHeatMap && collisions.length > 0) {
      this.meshes.push(this.generateEnergyHeatMap(collisions));
    }

    return this.getFrameData();
  }

  /**
   * Get complete frame data for rendering
   * In WebGL format (vertices, indices, colors)
   */
  getFrameData() {
    return {
      vertices: this.vertices,
      colors: this.colors,
      meshes: this.meshes,
      metadata: {
        vertexCount: this.vertices.length,
        meshCount: this.meshes.length,
        projectionMode: this.projectionMode,
        cameraPosition: this.cameraPosition,
        rotations: [this.rotationX, this.rotationY, this.rotationZ]
      }
    };
  }

  /**
   * Export to Three.js compatible JSON
   */
  exportToThreeJS() {
    const geometry = {
      vertices: [],
      faces: [],
      colors: []
    };

    // Add particle vertices
    for (let i = 0; i < this.vertices.length; i++) {
      const v = this.vertices[i];
      geometry.vertices.push(v.position[0], v.position[1], v.position[2]);
      const c = this.colors[i];
      geometry.colors.push((c.r / 255), (c.g / 255), (c.b / 255));
    }

    // Add faces for meshes
    for (const mesh of this.meshes) {
      if (mesh.type === 'arrow') {
        // Add arrow as line geometry
        // This would be expanded in actual Three.js integration
      }
    }

    return {
      type: 'BufferGeometry',
      data: geometry
    };
  }

  /**
   * Export to WebGL compatible arrays
   */
  exportToWebGL() {
    const vertexArray = new Float32Array(this.vertices.length * 3);
    const colorArray = new Float32Array(this.colors.length * 3);

    for (let i = 0; i < this.vertices.length; i++) {
      const v = this.vertices[i];
      vertexArray[i*3 + 0] = v.position[0];
      vertexArray[i*3 + 1] = v.position[1];
      vertexArray[i*3 + 2] = v.position[2];

      const c = this.colors[i];
      colorArray[i*3 + 0] = c.r / 255;
      colorArray[i*3 + 1] = c.g / 255;
      colorArray[i*3 + 2] = c.b / 255;
    }

    return {
      vertices: vertexArray,
      colors: colorArray,
      vertexCount: this.vertices.length
    };
  }

  /**
   * Update camera
   */
  setCamera(position, rotations) {
    this.cameraPosition = position;
    [this.rotationX, this.rotationY, this.rotationZ] = rotations;
  }

  /**
   * Rotate view
   */
  rotateView(dX, dY, dZ) {
    this.rotationX += dX;
    this.rotationY += dY;
    this.rotationZ += dZ;
  }

  /**
   * Zoom in/out
   */
  zoom(factor) {
    this.depthRange *= factor;
  }

  /**
   * Get statistics
   */
  getStatistics() {
    return {
      vertexCount: this.vertices.length,
      meshCount: this.meshes.length,
      projectionMode: this.projectionMode,
      renderOptions: {
        collisions: this.renderCollisions,
        trajectories: this.renderTrajectories,
        lightCone: this.renderLightCone,
        heatMap: this.renderHeatMap
      },
      cameraState: {
        position: this.cameraPosition,
        rotations: [this.rotationX, this.rotationY, this.rotationZ],
        depthRange: this.depthRange
      }
    };
  }

  /**
   * Export visualization state
   */
  export() {
    return {
      vertices: this.vertices,
      colors: this.colors,
      meshes: this.meshes,
      webgl: this.exportToWebGL(),
      threejs: this.exportToThreeJS(),
      statistics: this.getStatistics()
    };
  }
}

export { Phase10Visualization };
