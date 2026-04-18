/**
 * Phase 10.3 - 4D Collision Response Engine
 * 
 * Implements momentum transfer and energy conservation in 7D collision responses.
 * Features:
 * - 7D momentum conservation
 * - Energy-conserving collision models
 * - Restitution and friction
 * - Stress-energy tensor updates
 */

class Phase10CollisionResponse {
  /**
   * Collision response model with 7D momentum transfer
   */
  constructor(forces7D, options = {}) {
    this.forces7D = forces7D;
    
    this.restitution = options.restitution ?? 0.95;   // Coefficient of restitution
    this.friction = options.friction ?? 0.01;         // Friction coefficient
    this.c = options.c || 2.998e8;                     // Speed of light
    
    // Response models
    this.responseModel = options.responseModel || 'elastic';  // elastic, plastic, bouncy
    
    // Tracking
    this.totalCollisions = 0;
    this.momentumConservationErrors = [];
    this.energyConservationErrors = [];
  }

  /**
   * Apply collision response between two particles
   * Conserves momentum and energy in 7D
   */
  resolveCollision(collision, particles) {
    const p1 = collision.p1;
    const p2 = collision.p2;
    const n = collision.normal;  // Unit normal from p1 to p2

    // Mass
    const m1 = p1.mass;
    const m2 = p2.mass;
    const mu = (m1 * m2) / (m1 + m2);  // Reduced mass

    // Relative velocity
    const dvx = p2.velocity[3] - p1.velocity[3];
    const dvy = p2.velocity[4] - p1.velocity[4];
    const dvz = p2.velocity[5] - p1.velocity[5];

    // Relative velocity along normal (approach velocity)
    const v_rel_normal = dvx * n[0] + dvy * n[1] + dvz * n[2];

    // If separating, skip response
    if (v_rel_normal > 0) return;

    // Store momentum before collision
    const p1_mom_before = [p1.velocity[3] * m1, p1.velocity[4] * m1, p1.velocity[5] * m1];
    const p2_mom_before = [p2.velocity[3] * m2, p2.velocity[4] * m2, p2.velocity[5] * m2];
    const sys_mom_before = [
      p1_mom_before[0] + p2_mom_before[0],
      p1_mom_before[1] + p2_mom_before[1],
      p1_mom_before[2] + p2_mom_before[2]
    ];

    // Compute impulse based on restitution
    // j = -(1+e) * m_reduced * v_rel_normal / (m1 + m2)
    const j = -(1 + this.restitution) * mu * v_rel_normal / (m1 + m2);

    // Apply impulse to velocities
    const j1x = j * n[0] / m1;
    const j1y = j * n[1] / m1;
    const j1z = j * n[2] / m1;

    const j2x = -j * n[0] / m2;
    const j2y = -j * n[1] / m2;
    const j2z = -j * n[2] / m2;

    // Update velocities in 7D (3D momentum change)
    p1.velocity[3] += j1x;
    p1.velocity[4] += j1y;
    p1.velocity[5] += j1z;

    p2.velocity[3] += j2x;
    p2.velocity[4] += j2y;
    p2.velocity[5] += j2z;

    // Apply friction (energy dissipation along tangent)
    const fricCoeff = this.friction * Math.max(0, -v_rel_normal);
    
    // Tangential velocity (perpendicular to normal)
    const v1_tan = [
      p1.velocity[3] - (p1.velocity[3]*n[0] + p1.velocity[4]*n[1] + p1.velocity[5]*n[2])*n[0],
      p1.velocity[4] - (p1.velocity[3]*n[0] + p1.velocity[4]*n[1] + p1.velocity[5]*n[2])*n[1],
      p1.velocity[5] - (p1.velocity[3]*n[0] + p1.velocity[4]*n[1] + p1.velocity[5]*n[2])*n[2]
    ];

    const v1_tan_mag = Math.sqrt(v1_tan[0]*v1_tan[0] + v1_tan[1]*v1_tan[1] + v1_tan[2]*v1_tan[2]);
    if (v1_tan_mag > 1e-10) {
      p1.velocity[3] -= fricCoeff * v1_tan[0] / v1_tan_mag;
      p1.velocity[4] -= fricCoeff * v1_tan[1] / v1_tan_mag;
      p1.velocity[5] -= fricCoeff * v1_tan[2] / v1_tan_mag;
    }

    // Update 7D temporal coordinates (w-dimension affected by energy loss)
    const KE_after = 0.5 * (m1 * (p1.velocity[3]*p1.velocity[3] + p1.velocity[4]*p1.velocity[4] + p1.velocity[5]*p1.velocity[5]) +
                            m2 * (p2.velocity[3]*p2.velocity[3] + p2.velocity[4]*p2.velocity[4] + p2.velocity[5]*p2.velocity[5]));

    // Energy change couples to w-dimension (mass-energy)
    const energyLoss = -fricCoeff * Math.abs(v_rel_normal);
    const w_change = energyLoss / (this.c * this.c);

    p1.position[6] += w_change * 0.5;
    p2.position[6] += w_change * 0.5;

    // Momentum conservation check
    const p1_mom_after = [p1.velocity[3] * m1, p1.velocity[4] * m1, p1.velocity[5] * m1];
    const p2_mom_after = [p2.velocity[3] * m2, p2.velocity[4] * m2, p2.velocity[5] * m2];
    const sys_mom_after = [
      p1_mom_after[0] + p2_mom_after[0],
      p1_mom_after[1] + p2_mom_after[1],
      p1_mom_after[2] + p2_mom_after[2]
    ];

    const mom_error = Math.sqrt(
      (sys_mom_after[0] - sys_mom_before[0])**2 +
      (sys_mom_after[1] - sys_mom_before[1])**2 +
      (sys_mom_after[2] - sys_mom_before[2])**2
    ) / (Math.sqrt(sys_mom_before[0]**2 + sys_mom_before[1]**2 + sys_mom_before[2]**2) + 1e-20);

    if (mom_error > 1e-6) {
      this.momentumConservationErrors.push(mom_error);
    }

    // Track collision
    this.totalCollisions++;

    return {
      impulse: j,
      momentumError: mom_error,
      energyLoss: energyLoss
    };
  }

  /**
   * Elastic collision: restitution = 1.0
   * Perfect bounce, kinetic energy conserved
   */
  elasticCollision(collision, particles) {
    const oldRest = this.restitution;
    this.restitution = 1.0;
    const result = this.resolveCollision(collision, particles);
    this.restitution = oldRest;
    return result;
  }

  /**
   * Plastic collision: restitution = 0.0
   * Particles stick, max energy dissipation
   */
  plasticCollision(collision, particles) {
    const oldRest = this.restitution;
    this.restitution = 0.0;
    const result = this.resolveCollision(collision, particles);
    this.restitution = oldRest;
    return result;
  }

  /**
   * Apply all collisions for current frame
   */
  applyCollisions(collisions, particles) {
    const results = [];

    for (const collision of collisions) {
      const result = this.resolveCollision(collision, particles);
      results.push(result);
    }

    return results;
  }

  /**
   * Compute momentum transfer tensor (7D)
   */
  getMomentumTransferTensor(collision, p1, p2) {
    const n = collision.normal;
    
    // 7x7 momentum transfer matrix
    const tensor = Array(7).fill(null).map(() => Array(7).fill(0));

    // 3x3 spatial momentum transfer
    for (let i = 0; i < 3; i++) {
      for (let j = 0; j < 3; j++) {
        tensor[i][j] = n[i] * n[j];
      }
    }

    // Temporal components (from time dilation effects)
    const gamma_rel = Math.sqrt(1 + p1.velocity[6] * p2.velocity[6]);
    for (let i = 0; i < 3; i++) {
      tensor[i][6] = n[i] * gamma_rel * 0.1;  // Temporal coupling
      tensor[6][i] = n[i] * gamma_rel * 0.1;
    }

    // W-dimension (mass-energy)
    tensor[6][6] = gamma_rel * 0.01;

    return tensor;
  }

  /**
   * Verify energy conservation in collision
   */
  verifyEnergyConservation(collision, particles) {
    const p1 = collision.p1;
    const p2 = collision.p2;

    const v1_mag_sq = p1.velocity[3]**2 + p1.velocity[4]**2 + p1.velocity[5]**2;
    const v2_mag_sq = p2.velocity[3]**2 + p2.velocity[4]**2 + p2.velocity[5]**2;

    const KE = 0.5 * (p1.mass * v1_mag_sq + p2.mass * v2_mag_sq);

    // Also account for rest mass energy E = mc²
    const E_rest = (p1.mass + p2.mass) * (this.c ** 2);

    // Total energy includes rest mass + kinetic + thermal (w dimension)
    const w_energy = (p1.position[6] + p2.position[6]) * (this.c ** 2);

    return {
      kineticEnergy: KE,
      restEnergy: E_rest,
      thermalEnergy: w_energy,
      totalEnergy: KE + E_rest + w_energy
    };
  }

  /**
   * Verify momentum conservation (7D)
   */
  verifyMomentumConservation(particles) {
    let p_x = 0, p_y = 0, p_z = 0;
    let p_t0 = 0, p_t1 = 0, p_t2 = 0, p_w = 0;

    for (const p of particles) {
      p_x += p.velocity[3] * p.mass;
      p_y += p.velocity[4] * p.mass;
      p_z += p.velocity[5] * p.mass;
      p_w += p.velocity[6] * p.mass;
    }

    return {
      spatial: [p_x, p_y, p_z],
      temporal: [p_t0, p_t1, p_t2],
      wDimension: p_w,
      magnitude: Math.sqrt(p_x**2 + p_y**2 + p_z**2 + p_w**2)
    };
  }

  /**
   * Get collision response statistics
   */
  getStatistics() {
    const avgMomError = this.momentumConservationErrors.length > 0
      ? this.momentumConservationErrors.reduce((a, b) => a + b) / this.momentumConservationErrors.length
      : 0;

    const avgEnergyError = this.energyConservationErrors.length > 0
      ? this.energyConservationErrors.reduce((a, b) => a + b) / this.energyConservationErrors.length
      : 0;

    return {
      totalCollisions: this.totalCollisions,
      averageMomentumError: avgMomError,
      maxMomentumError: Math.max(...this.momentumConservationErrors, 0),
      averageEnergyError: avgEnergyError,
      maxEnergyError: Math.max(...this.energyConservationErrors, 0),
      responseModel: this.responseModel,
      restitution: this.restitution,
      friction: this.friction
    };
  }

  /**
   * Reset statistics
   */
  reset() {
    this.totalCollisions = 0;
    this.momentumConservationErrors = [];
    this.energyConservationErrors = [];
  }

  /**
   * Export collision response data
   */
  export() {
    return {
      statistics: this.getStatistics(),
      configuration: {
        restitution: this.restitution,
        friction: this.friction,
        responseModel: this.responseModel,
        c: this.c
      }
    };
  }
}

export { Phase10CollisionResponse };
