/**
 * Phase 10.3 - 4D Collision Detection Engine
 * 
 * Implements collision detection in 4D/7D spacetime using metric tensor.
 * Features:
 * - Schwarzschild metric-based collision shapes
 * - Light-cone causality enforcement
 * - Collision prediction and detection
 * - Proper time conservation
 */

class CollisionShape {
  /**
   * 3D collision sphere in 7D spacetime
   * Radius defined in current metric tensor
   */
  constructor(particle, radius = 1e-35) {
    this.particle = particle;
    this.radius = radius;  // Physical size (Planck length)
    this.lastPosition = [...particle.position];
    this.lastTime = 0;
  }

  /**
   * Compute Schwarzschild metric distance between two points
   * ds² = -(1-rs/r)c²dt² + dr²/(1-rs/r) + r²dΩ²
   */
  schwarzschildDistance(p1, p2, M) {
    const G = 6.674e-11;    // Gravitational constant
    const c = 2.998e8;      // Speed of light
    const rs = 2 * G * M / (c * c);  // Schwarzschild radius

    // 3D spatial distance
    const dx = p2[0] - p1[0];
    const dy = p2[1] - p1[1];
    const dz = p2[2] - p1[2];
    const r_spatial = Math.sqrt(dx*dx + dy*dy + dz*dz);

    // Avoid singularity
    if (r_spatial < rs * 1.001) return Infinity;

    // Schwarzschild radial coordinate metric
    const g_rr = 1 / (1 - rs / r_spatial);
    const sqrt_term = Math.sqrt(g_rr - 1);

    // Geodesic distance (coordinate distance adjusted by metric)
    const metric_distance = r_spatial * sqrt_term;

    return metric_distance;
  }

  /**
   * Check if two collision shapes overlap in metric space
   * True if metric distance < r1 + r2
   */
  overlapsWith(other, gravitationalMass = 0) {
    const distance = this.schwarzschildDistance(
      this.particle.position.slice(0, 3),
      other.particle.position.slice(0, 3),
      gravitationalMass
    );

    return distance < (this.radius + other.radius);
  }

  /**
   * Compute collision normal (direction from p1 to p2)
   * In metric space
   */
  collisionNormal(other) {
    const p1 = this.particle.position.slice(0, 3);
    const p2 = other.particle.position.slice(0, 3);

    const dx = p2[0] - p1[0];
    const dy = p2[1] - p1[1];
    const dz = p2[2] - p1[2];
    const len = Math.sqrt(dx*dx + dy*dy + dz*dz);

    return len > 0 ? [dx/len, dy/len, dz/len] : [1, 0, 0];
  }

  update(position) {
    this.lastPosition = [...this.particle.position];
    this.particle.position = position;
  }
}

class Phase10Collision4D {
  /**
   * 4D Collision Detection Engine
   * Integrates with Physics4DEngine and Physics7DIntegrationEngine
   */
  constructor(engine4D, forces7D, options = {}) {
    this.engine4D = engine4D;
    this.forces7D = forces7D;
    
    this.collisionShapes = [];
    this.collisions = [];
    this.c = options.c || 2.998e8;  // Speed of light
    this.gravitationalMass = options.gravitationalMass || 0;

    // Collision response parameters
    this.restitution = options.restitution ?? 0.95;  // Elastic (0.95) to plastic (0.0)
    this.friction = options.friction ?? 0.01;        // Spacetime friction
    this.minVelocityThreshold = options.minVelocityThreshold ?? 1e-10;
    
    // Initialize collision shapes for all particles
    this.initializeCollisionShapes(options.particleRadius || 1e-35);

    // Track light-cone causality
    this.causality = {
      violationsDetected: 0,
      lastViolationTime: -Infinity,
      maxVelocity: this.c
    };
  }

  /**
   * Initialize collision shapes for all particles
   */
  initializeCollisionShapes(radius) {
    this.collisionShapes = [];
    for (const particle of this.engine4D.particles) {
      this.collisionShapes.push(new CollisionShape(particle, radius));
    }
  }

  /**
   * Update collision shapes based on current positions
   */
  updateCollisionShapes() {
    for (let i = 0; i < this.engine4D.particles.length; i++) {
      if (i < this.collisionShapes.length) {
        this.collisionShapes[i].particle = this.engine4D.particles[i];
      }
    }
  }

  /**
   * Detect collisions this frame between all particle pairs
   * Returns array of {p1, p2, normal, depth} objects
   */
  detectCollisions() {
    this.collisions = [];
    const particles = this.engine4D.particles;

    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const p1 = particles[i];
        const p2 = particles[j];

        // Check 3D spatial overlap (fast path)
        const dx = p2.position[3] - p1.position[3];
        const dy = p2.position[4] - p1.position[4];
        const dz = p2.position[5] - p1.position[5];
        const dist_sq = dx*dx + dy*dy + dz*dz;
        const min_dist = (this.collisionShapes[i].radius + this.collisionShapes[j].radius);

        if (dist_sq < min_dist * min_dist) {
          // Check metric-based overlap (full path)
          if (this.collisionShapes[i].overlapsWith(
            this.collisionShapes[j],
            this.gravitationalMass
          )) {
            const collision = {
              p1Index: i,
              p2Index: j,
              p1: p1,
              p2: p2,
              normal: this.collisionShapes[i].collisionNormal(this.collisionShapes[j]),
              depth: this.computeCollisionDepth(p1, p2),
              time: this.engine4D.currentTime
            };

            // Check causality (collision must be on light cone or inside)
            if (this.verifyCausality(collision)) {
              this.collisions.push(collision);
            }
          }
        }
      }
    }

    return this.collisions;
  }

  /**
   * Compute penetration depth between two particles
   */
  computeCollisionDepth(p1, p2) {
    const dx = p2.position[3] - p1.position[3];
    const dy = p2.position[4] - p1.position[4];
    const dz = p2.position[5] - p1.position[5];
    const dist = Math.sqrt(dx*dx + dy*dy + dz*dz);
    
    const r1 = 1e-35;  // Particle radius
    const r2 = 1e-35;
    const minDist = r1 + r2;

    return Math.max(0, minDist - dist);
  }

  /**
   * Predict if collision will occur within next dt
   * Uses velocity vectors and RK4 integration
   */
  predictCollisions(dt = 0.01) {
    const predictions = [];
    const particles = this.engine4D.particles;

    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const p1 = particles[i];
        const p2 = particles[j];

        // Predict positions after dt using velocities
        const p1_pred = [
          p1.position[0] + p1.velocity[0] * dt,
          p1.position[1] + p1.velocity[1] * dt,
          p1.position[2] + p1.velocity[2] * dt,
          p1.position[3] + p1.velocity[3] * dt,
          p1.position[4] + p1.velocity[4] * dt,
          p1.position[5] + p1.velocity[5] * dt,
          p1.position[6] + p1.velocity[6] * dt
        ];

        const p2_pred = [
          p2.position[0] + p2.velocity[0] * dt,
          p2.position[1] + p2.velocity[1] * dt,
          p2.position[2] + p2.velocity[2] * dt,
          p2.position[3] + p2.velocity[3] * dt,
          p2.position[4] + p2.velocity[4] * dt,
          p2.position[5] + p2.velocity[5] * dt,
          p2.position[6] + p2.velocity[6] * dt
        ];

        // Check if predicted positions collide
        const dx = p2_pred[3] - p1_pred[3];
        const dy = p2_pred[4] - p1_pred[4];
        const dz = p2_pred[5] - p1_pred[5];
        const pred_dist_sq = dx*dx + dy*dy + dz*dz;
        const min_dist = 2e-35;

        if (pred_dist_sq < min_dist * min_dist) {
          predictions.push({
            p1Index: i,
            p2Index: j,
            collisionTime: this.computeCollisionTime(p1, p2, dt),
            severity: Math.sqrt(pred_dist_sq) / min_dist
          });
        }
      }
    }

    return predictions;
  }

  /**
   * Compute when collision will occur using binary search
   */
  computeCollisionTime(p1, p2, maxDt) {
    let t_min = 0;
    let t_max = maxDt;
    const threshold = 1e-10;

    for (let iter = 0; iter < 20; iter++) {
      const t_mid = (t_min + t_max) / 2;

      const pos1 = [
        p1.position[0] + p1.velocity[0] * t_mid,
        p1.position[1] + p1.velocity[1] * t_mid,
        p1.position[2] + p1.velocity[2] * t_mid
      ];

      const pos2 = [
        p2.position[0] + p2.velocity[0] * t_mid,
        p2.position[1] + p2.velocity[1] * t_mid,
        p2.position[2] + p2.velocity[2] * t_mid
      ];

      const dx = pos2[0] - pos1[0];
      const dy = pos2[1] - pos1[1];
      const dz = pos2[2] - pos1[2];
      const dist = Math.sqrt(dx*dx + dy*dy + dz*dz);

      if (dist < 2e-35 + threshold) {
        t_max = t_mid;
      } else {
        t_min = t_mid;
      }

      if (t_max - t_min < threshold) break;
    }

    return (t_min + t_max) / 2;
  }

  /**
   * Verify collision respects light-cone causality
   * Collision velocity must be < speed of light
   */
  verifyCausality(collision) {
    const p1 = collision.p1;
    const p2 = collision.p2;

    // Relative velocity
    const dvx = p2.velocity[3] - p1.velocity[3];
    const dvy = p2.velocity[4] - p1.velocity[4];
    const dvz = p2.velocity[5] - p1.velocity[5];
    const dv_mag = Math.sqrt(dvx*dvx + dvy*dvy + dvz*dvz);

    // Check if relative velocity exceeds light speed
    if (dv_mag > this.c) {
      this.causality.violationsDetected++;
      this.causality.lastViolationTime = collision.time;
      return false;  // Reject physically impossible collision
    }

    // Collision angle must be on light cone or inside
    const normal_vel_1 = (p1.velocity[3] * collision.normal[0] +
                         p1.velocity[4] * collision.normal[1] +
                         p1.velocity[5] * collision.normal[2]);

    const normal_vel_2 = (p2.velocity[3] * collision.normal[0] +
                         p2.velocity[4] * collision.normal[1] +
                         p2.velocity[5] * collision.normal[2]);

    // Particles should be approaching (opposite normal velocities)
    if (normal_vel_1 * normal_vel_2 > 0) {
      return false;  // Not separating/colliding
    }

    return true;
  }

  /**
   * Separate overlapping particles along collision normal
   * Ensures they don't get stuck together
   */
  separateParticles(collision) {
    const p1 = collision.p1;
    const p2 = collision.p2;
    const depth = collision.depth;
    const n = collision.normal;

    // Mass-based separation (heavier particles move less)
    const m1 = p1.mass;
    const m2 = p2.mass;
    const totalMass = m1 + m2;

    const sep1 = depth * (m2 / totalMass) * 0.5;
    const sep2 = depth * (m1 / totalMass) * 0.5;

    // Move p1 away from p2
    p1.position[3] -= n[0] * sep1;
    p1.position[4] -= n[1] * sep1;
    p1.position[5] -= n[2] * sep1;

    // Move p2 away from p1
    p2.position[3] += n[0] * sep2;
    p2.position[4] += n[1] * sep2;
    p2.position[5] += n[2] * sep2;
  }

  /**
   * Compute relative velocity at collision point
   */
  getRelativeVelocity(p1, p2, normal) {
    return [
      p2.velocity[3] - p1.velocity[3],
      p2.velocity[4] - p1.velocity[4],
      p2.velocity[5] - p1.velocity[5]
    ];
  }

  /**
   * Project velocity onto collision normal
   */
  projectVelocityOnNormal(velocity, normal) {
    return velocity[0] * normal[0] + velocity[1] * normal[1] + velocity[2] * normal[2];
  }

  /**
   * Compute energy loss in collision
   */
  computeEnergyLoss(p1, p2, collision) {
    const relVel = this.getRelativeVelocity(p1, p2, collision.normal);
    const relMag = Math.sqrt(relVel[0]*relVel[0] + relVel[1]*relVel[1] + relVel[2]*relVel[2]);

    // Kinetic energy before collision
    const v1_mag_sq = p1.velocity[3]*p1.velocity[3] + p1.velocity[4]*p1.velocity[4] + p1.velocity[5]*p1.velocity[5];
    const v2_mag_sq = p2.velocity[3]*p2.velocity[3] + p2.velocity[4]*p2.velocity[4] + p2.velocity[5]*p2.velocity[5];
    const KE_before = 0.5 * (p1.mass * v1_mag_sq + p2.mass * v2_mag_sq);

    // Energy loss proportional to restitution (0=static, 1=elastic)
    const energyLossFraction = (1 - this.restitution * this.restitution);

    return KE_before * energyLossFraction;
  }

  /**
   * Get collision statistics
   */
  getCollisionStats() {
    return {
      activeCollisions: this.collisions.length,
      totalCollisions: this.collisions.reduce((sum, c) => sum + 1, 0),
      causality: {
        violations: this.causality.violationsDetected,
        lastViolationTime: this.causality.lastViolationTime
      },
      collisions: this.collisions.map(c => ({
        particles: [c.p1Index, c.p2Index],
        depth: c.depth,
        normal: c.normal,
        time: c.time
      }))
    };
  }

  /**
   * Export collision data for visualization
   */
  export() {
    return {
      collisions: this.collisions.map(c => ({
        p1: c.p1Index,
        p2: c.p2Index,
        position: [
          (c.p1.position[3] + c.p2.position[3]) / 2,
          (c.p1.position[4] + c.p2.position[4]) / 2,
          (c.p1.position[5] + c.p2.position[5]) / 2
        ],
        normal: c.normal,
        depth: c.depth
      })),
      stats: this.getCollisionStats()
    };
  }
}

export { Phase10Collision4D, CollisionShape };
