/**
 * Phase 10.4 - 4D Collision Visualizer
 * 
 * Specialized collision visualization with impact analysis,
 * energy dissipation display, and momentum transfer visualization.
 */

class Phase10CollisionVisualizer {
  /**
   * Collision-specific visualization
   */
  constructor(visualizationEngine, options = {}) {
    this.engine = visualizationEngine;
    this.collisionHistory = [];
    this.maxHistoryFrames = options.maxHistoryFrames || 60;
    
    // Display options
    this.showImpactRadius = options.showImpactRadius ?? true;
    this.showMomentumVectors = options.showMomentumVectors ?? true;
    this.showEnergyBars = options.showEnergyBars ?? true;
    this.showCausalityFill = options.showCausalityFill ?? true;
    
    // Impact visualization
    this.impactPulseDuration = options.impactPulseDuration || 10;  // frames
    this.impactPulseRadius = options.impactPulseRadius || 10;
    
    // Color schemes
    this.colorScheme = options.colorScheme || 'energy';  // energy, time, momentum
    
    // Analysis data
    this.analysisData = {
      totalEnergy: 0,
      totalMomentum: [0, 0, 0],
      collisionCount: 0,
      averageDepth: 0
    };
  }

  /**
   * Add collision to history for trail effect
   */
  recordCollision(collision, energy, momentum) {
    this.collisionHistory.push({
      position: [
        (collision.p1.position[3] + collision.p2.position[3]) / 2,
        (collision.p1.position[4] + collision.p2.position[4]) / 2,
        (collision.p1.position[5] + collision.p2.position[5]) / 2
      ],
      energy: energy,
      momentum: momentum,
      normal: collision.normal,
      depth: collision.depth,
      frame: this.analysisData.collisionCount,
      age: 0
    };

    // Maintain max history size
    if (this.collisionHistory.length > this.maxHistoryFrames) {
      this.collisionHistory.shift();
    }

    this.analysisData.collisionCount++;
  }

  /**
   * Create impact pulse visualization
   * Expanding circle from collision point showing energy dissipation
   */
  createImpactPulse(collision, energy) {
    const proj = this.engine.project4DTo3D([
      collision.p1.position[0],
      collision.p1.position[1],
      collision.p1.position[2],
      (collision.p1.position[3] + collision.p2.position[3]) / 2,
      (collision.p1.position[4] + collision.p2.position[4]) / 2,
      (collision.p1.position[5] + collision.p2.position[5]) / 2,
      (collision.p1.position[6] + collision.p2.position[6]) / 2
    ]);

    // Energy determines color intensity
    const intensity = Math.min(1, energy * 1e60);  // Scale to visible
    const radius = this.impactPulseRadius * (1 - intensity);

    return {
      type: 'pulse',
      center: proj,
      radius: radius,
      intensity: intensity,
      color: this.getEnergyColor(energy),
      duration: this.impactPulseDuration
    };
  }

  /**
   * Create momentum transfer vectors
   * Shows how momentum is transferred between particles
   */
  createMomentumVectors(collision, p1_momentum_before, p1_momentum_after) {
    const p1_proj = this.engine.project4DTo3D(collision.p1.position);
    const p2_proj = this.engine.project4DTo3D(collision.p2.position);

    const momentum_change = [
      p1_momentum_after[0] - p1_momentum_before[0],
      p1_momentum_after[1] - p1_momentum_before[1],
      p1_momentum_after[2] - p1_momentum_before[2]
    ];

    const change_mag = Math.sqrt(momentum_change[0]**2 + momentum_change[1]**2 + momentum_change[2]**2);

    return {
      type: 'vector',
      start: p1_proj,
      direction: [
        momentum_change[0] / (change_mag + 1e-10),
        momentum_change[1] / (change_mag + 1e-10),
        momentum_change[2] / (change_mag + 1e-10)
      ],
      magnitude: change_mag,
      color: { r: 0, g: 255, b: 0, hex: '#00FF00' }  // Green for momentum
    };
  }

  /**
   * Create energy dissipation bar
   * Shows how much energy was lost in collision
   */
  createEnergyBar(collision, energyBefore, energyAfter, position3D) {
    const energyLoss = energyBefore - energyAfter;
    const dissipationFraction = energyLoss / (energyBefore + 1e-20);

    // Clamp to [0, 1]
    const fraction = Math.max(0, Math.min(1, dissipationFraction));

    return {
      type: 'bar',
      position: position3D,
      value: fraction,
      maxValue: 1.0,
      color: this.getEnergyColor(energyLoss),
      label: `Energy loss: ${(fraction*100).toFixed(1)}%`
    };
  }

  /**
   * Get color based on energy (red = high, blue = low)
   */
  getEnergyColor(energy) {
    // Normalize energy to [0, 1]
    const normalized = Math.min(1, Math.max(0, energy * 1e60));

    // Red-Yellow-Blue gradient
    if (normalized < 0.5) {
      // Blue to Yellow
      const t = normalized * 2;
      return {
        r: Math.floor(255 * t),
        g: Math.floor(255 * t),
        b: Math.floor(255 * (1 - t)),
        hex: `rgb(${Math.floor(255*t)}, ${Math.floor(255*t)}, ${Math.floor(255*(1-t))})`
      };
    } else {
      // Yellow to Red
      const t = (normalized - 0.5) * 2;
      return {
        r: 255,
        g: Math.floor(255 * (1 - t)),
        b: 0,
        hex: `rgb(255, ${Math.floor(255*(1-t))}, 0)`
      };
    }
  }

  /**
   * Get color based on causality
   */
  getCausalityColor(violation) {
    if (violation) {
      return { r: 255, g: 0, b: 0, hex: '#FF0000' };  // Red for violation
    } else {
      return { r: 0, g: 255, b: 0, hex: '#00FF00' };  // Green for valid
    }
  }

  /**
   * Render collision impact analysis
   */
  visualizeCollisionImpact(collision, energyLoss, momentumTransfer) {
    const visualElements = [];

    // Impact pulse
    if (this.showImpactRadius) {
      visualElements.push(this.createImpactPulse(collision, energyLoss));
    }

    // Momentum vectors
    if (this.showMomentumVectors) {
      visualElements.push(this.createMomentumVectors(
        collision,
        [0, 0, 0],  // Before (simplified)
        momentumTransfer
      ));
    }

    // Collision point
    const colPos = [
      (collision.p1.position[3] + collision.p2.position[3]) / 2,
      (collision.p1.position[4] + collision.p2.position[4]) / 2,
      (collision.p1.position[5] + collision.p2.position[5]) / 2,
      (collision.p1.position[0] + collision.p2.position[0]) / 2,
      (collision.p1.position[1] + collision.p2.position[1]) / 2,
      (collision.p1.position[2] + collision.p2.position[2]) / 2,
      (collision.p1.position[6] + collision.p2.position[6]) / 2
    ];

    const proj = this.engine.project4DTo3D(colPos);

    visualElements.push({
      type: 'point',
      position: proj,
      size: 4,
      color: { r: 255, g: 255, b: 0, hex: '#FFFF00' }  // Yellow for collision
    });

    // Energy dissipation bar
    if (this.showEnergyBars) {
      visualElements.push(this.createEnergyBar(
        collision,
        0,  // Energy before (simplified)
        energyLoss,
        proj
      ));
    }

    return visualElements;
  }

  /**
   * Render causality violation region (if any)
   */
  visualizeCausalityViolation(violationLocation, severity) {
    const visual = {
      type: 'warning',
      position: violationLocation,
      severity: severity,  // 0 to 1
      color: { r: 255, g: 0, b: 0, hex: '#FF0000' },
      glowIntensity: severity
    };

    return visual;
  }

  /**
   * Update collision history ages
   */
  updateHistory() {
    for (const record of this.collisionHistory) {
      record.age++;
    }
  }

  /**
   * Get collision trail visualization
   * Shows path of recent collisions
   */
  getCollisionTrail() {
    const trail = [];

    for (const record of this.collisionHistory) {
      const proj = this.engine.project4DTo3D([
        record.position[0],
        record.position[1],
        record.position[2],
        record.position[0],
        record.position[1],
        record.position[2],
        0
      ]);

      // Fade out older collisions
      const fade = 1 - (record.age / this.maxHistoryFrames);

      trail.push({
        type: 'point',
        position: proj,
        size: 2 * fade,
        color: this.getEnergyColor(record.energy),
        opacity: fade
      });
    }

    return trail;
  }

  /**
   * Analyze collision system state
   */
  analyzeCollisions(collisions, particles, responseData = null) {
    let totalEnergy = 0;
    let totalMomentum = [0, 0, 0];

    for (const collision of collisions) {
      const energyLoss = collision.depth * 1e-60;  // Rough approximation
      totalEnergy += energyLoss;

      for (let i = 0; i < 3; i++) {
        totalMomentum[i] += collision.normal[i] * collision.depth;
      }
    }

    this.analysisData = {
      totalEnergy: totalEnergy,
      totalMomentum: totalMomentum,
      collisionCount: collisions.length,
      averageDepth: collisions.length > 0 
        ? collisions.reduce((sum, c) => sum + c.depth, 0) / collisions.length
        : 0
    };

    return this.analysisData;
  }

  /**
   * Generate collision report
   */
  generateReport() {
    return {
      summary: {
        totalCollisions: this.analysisData.collisionCount,
        averageCollisionDepth: this.analysisData.averageDepth,
        totalEnergyDissipated: this.analysisData.totalEnergy,
        netMomentum: this.analysisData.totalMomentum
      },
      history: this.collisionHistory,
      visualization: {
        displayOptions: {
          impacts: this.showImpactRadius,
          momentum: this.showMomentumVectors,
          energyBars: this.showEnergyBars,
          causality: this.showCausalityFill
        },
        colorScheme: this.colorScheme,
        historyFrames: this.collisionHistory.length
      }
    };
  }

  /**
   * Export visualization data
   */
  export() {
    return {
      analysis: this.analysisData,
      history: this.collisionHistory,
      report: this.generateReport()
    };
  }
}

export { Phase10CollisionVisualizer };
