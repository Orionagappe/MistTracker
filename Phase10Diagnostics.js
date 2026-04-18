/**
 * Phase 10.5: Real-Time Physics Diagnostics
 * 
 * Provides real-time monitoring and validation of physical laws:
 * - Continuous conservation law checking
 * - System stability monitoring
 * - Anomaly detection
 * - Physics health dashboard
 * - Real-time warnings and alerts
 * 
 * @module Phase10Diagnostics
 */

/**
 * Real-time physics diagnostics and monitoring
 */
class Phase10Diagnostics {
  /**
   * Initialize diagnostics system
   * @param {Phase10Measurements} measurementEngine - Measurement system instance
   * @param {Object} config - Configuration options
   */
  constructor(measurementEngine, config = {}) {
    this.measurements = measurementEngine || null;
    this.config = {
      maxEnergyErrorPercent: config.maxEnergyErrorPercent || 1.0,
      maxMomentumErrorPercent: config.maxMomentumErrorPercent || 1.0,
      warningThreshold: config.warningThreshold || 0.5,
      criticalThreshold: config.criticalThreshold || 0.9,
      historySize: config.historySize || 1000,
      enabledChecks: config.enabledChecks || [
        'energyConservation',
        'momentumConservation',
        'causality',
        'stability',
        'anomalies'
      ]
    };
    
    this.diagnosticHistory = [];
    this.warnings = [];
    this.alerts = [];
    this.frameCount = 0;
    
    this.statistics = {
      totalFramesAnalyzed: 0,
      conservationViolations: 0,
      causalityViolations: 0,
      anomaliesDetected: 0,
      systemStable: true,
      averageEnergyError: 0,
      averageMomentumError: 0
    };
  }

  /**
   * Run complete diagnostic check for frame
   * 
   * @param {Array<Object>} particles - System particles
   * @param {Array<Object>} collisions - Collisions this frame
   * @returns {Object} Diagnostic report
   */
  runDiagnostics(particles = [], collisions = []) {
    const report = {
      frameNumber: this.frameCount++,
      timestamp: Date.now(),
      checks: {},
      warnings: [],
      alerts: [],
      systemHealth: null,
      recommendations: []
    };
    
    // Energy conservation check
    if (this.config.enabledChecks.includes('energyConservation')) {
      report.checks.energy = this.checkEnergyConservation(collisions);
      if (report.checks.energy.violations > 0) {
        report.warnings.push(`Energy conservation violated in ${report.checks.energy.violations} collisions`);
      }
    }
    
    // Momentum conservation check
    if (this.config.enabledChecks.includes('momentumConservation')) {
      report.checks.momentum = this.checkMomentumConservation(collisions);
      if (report.checks.momentum.violations > 0) {
        report.warnings.push(`Momentum conservation violated in ${report.checks.momentum.violations} collisions`);
      }
    }
    
    // Causality check
    if (this.config.enabledChecks.includes('causality')) {
      report.checks.causality = this.checkCausality(collisions);
      if (report.checks.causality.violations > 0) {
        report.alerts.push(`Causality violation detected in ${report.checks.causality.violations} collisions`);
      }
    }
    
    // System stability check
    if (this.config.enabledChecks.includes('stability')) {
      report.checks.stability = this.checkSystemStability(particles);
      if (!report.checks.stability.isStable) {
        report.alerts.push('System unstable');
      }
    }
    
    // Anomaly detection
    if (this.config.enabledChecks.includes('anomalies')) {
      report.checks.anomalies = this.detectAnomalies(particles, collisions);
      if (report.checks.anomalies.count > 0) {
        report.warnings.push(`${report.checks.anomalies.count} anomalies detected`);
      }
    }
    
    // Calculate system health
    report.systemHealth = this.calculateSystemHealth(report.checks);
    
    // Generate recommendations
    report.recommendations = this.generateRecommendations(report);
    
    // Store in history
    this.diagnosticHistory.push(report);
    if (this.diagnosticHistory.length > this.config.historySize) {
      this.diagnosticHistory.shift();
    }
    
    // Update statistics
    this.statistics.totalFramesAnalyzed++;
    if (report.checks.energy?.violations > 0) this.statistics.conservationViolations++;
    if (report.checks.causality?.violations > 0) this.statistics.causalityViolations++;
    if (report.checks.anomalies?.count > 0) this.statistics.anomaliesDetected++;
    
    return report;
  }

  /**
   * Check energy conservation across collisions
   * 
   * @param {Array<Object>} collisions - Collision events
   * @returns {Object} Energy check results
   */
  checkEnergyConservation(collisions = []) {
    if (!this.measurements || collisions.length === 0) {
      return {
        violations: 0,
        totalErrors: 0,
        avgError: 0,
        maxError: 0,
        status: 'OK'
      };
    }
    
    let violations = 0;
    let totalErrors = 0;
    let maxError = 0;
    
    collisions.forEach(col => {
      const check = this.measurements.analyzeEnergyConservation(col);
      const errorPercent = check.percentError;
      
      totalErrors += errorPercent;
      maxError = Math.max(maxError, errorPercent);
      
      if (errorPercent > this.config.maxEnergyErrorPercent) {
        violations++;
      }
    });
    
    const avgError = collisions.length > 0 ? totalErrors / collisions.length : 0;
    
    let status = 'OK';
    if (avgError > this.config.criticalThreshold) status = 'CRITICAL';
    else if (avgError > this.config.warningThreshold) status = 'WARNING';
    
    return {
      violations: violations,
      totalErrors: totalErrors,
      avgError: avgError,
      maxError: maxError,
      status: status,
      threshold: this.config.maxEnergyErrorPercent
    };
  }

  /**
   * Check momentum conservation across collisions
   * 
   * @param {Array<Object>} collisions - Collision events
   * @returns {Object} Momentum check results
   */
  checkMomentumConservation(collisions = []) {
    if (!this.measurements || collisions.length === 0) {
      return {
        violations: 0,
        totalErrors: 0,
        avgError: 0,
        maxError: 0,
        status: 'OK'
      };
    }
    
    let violations = 0;
    let totalErrors = 0;
    let maxError = 0;
    
    collisions.forEach(col => {
      const check = this.measurements.analyzeMomentumConservation(col);
      const errorPercent = check.percentError;
      
      totalErrors += errorPercent;
      maxError = Math.max(maxError, errorPercent);
      
      if (errorPercent > this.config.maxMomentumErrorPercent) {
        violations++;
      }
    });
    
    const avgError = collisions.length > 0 ? totalErrors / collisions.length : 0;
    
    let status = 'OK';
    if (avgError > this.config.criticalThreshold) status = 'CRITICAL';
    else if (avgError > this.config.warningThreshold) status = 'WARNING';
    
    return {
      violations: violations,
      totalErrors: totalErrors,
      avgError: avgError,
      maxError: maxError,
      status: status,
      threshold: this.config.maxMomentumErrorPercent
    };
  }

  /**
   * Check causality constraints
   * Detects faster-than-light collisions (FTL)
   * 
   * @param {Array<Object>} collisions - Collision events
   * @returns {Object} Causality check results
   */
  checkCausality(collisions = []) {
    if (!this.measurements) {
      return {
        violations: 0,
        ftlCollisions: [],
        status: 'OK'
      };
    }
    
    let violations = 0;
    const ftlCollisions = [];
    
    collisions.forEach((col, idx) => {
      // Check if collision violates light-cone
      const p1 = col.particle1 || {};
      const p2 = col.particle2 || {};
      
      const dt = Math.abs((p1.t || 0) - (p2.t || 0));
      const dx = Math.abs((p1.x || 0) - (p2.x || 0));
      const dy = Math.abs((p1.y || 0) - (p2.y || 0));
      const dz = Math.abs((p1.z || 0) - (p2.z || 0));
      
      const dr = Math.sqrt(dx**2 + dy**2 + dz**2);
      const c = this.measurements.c || 299792458;
      
      // If dr > c*dt, collision is FTL
      if (dr > c * dt + 1e-6) {
        violations++;
        ftlCollisions.push({
          index: idx,
          spatialDistance: dr,
          timeDistance: dt,
          velocity: dr / (dt + 1e-10),
          speedOfLight: c,
          factor: (dr / (dt + 1e-10)) / c
        });
      }
    });
    
    return {
      violations: violations,
      ftlCollisions: ftlCollisions,
      totalCollisions: collisions.length,
      status: violations > 0 ? 'VIOLATION' : 'OK'
    };
  }

  /**
   * Check system stability
   * Detects runaway energies, NaN values, divergences
   * 
   * @param {Array<Object>} particles - Particle array
   * @returns {Object} Stability check results
   */
  checkSystemStability(particles = []) {
    const issues = [];
    let energyExceedance = 0;
    let maxEnergy = 0;
    let hasNaN = false;
    let hasInfinity = false;
    
    particles.forEach((p, idx) => {
      // Check for NaN/Infinity
      if (!Number.isFinite(p.x) || !Number.isFinite(p.y) || !Number.isFinite(p.z)) {
        hasNaN = true;
        issues.push(`Particle ${idx}: NaN/Infinity in position`);
      }
      
      if (!Number.isFinite(p.vx) || !Number.isFinite(p.vy) || !Number.isFinite(p.vz)) {
        hasInfinity = true;
        issues.push(`Particle ${idx}: NaN/Infinity in velocity`);
      }
      
      // Check energy
      if (this.measurements) {
        const energy = this.measurements.extractParticleEnergy(p);
        maxEnergy = Math.max(maxEnergy, energy.totalEnergy);
        
        if (energy.totalEnergy > 1e20) {
          energyExceedance++;
          issues.push(`Particle ${idx}: Extreme energy (${energy.totalEnergy.toExponential(2)} J)`);
        }
      }
    });
    
    const isStable = !hasNaN && !hasInfinity && energyExceedance === 0;
    
    return {
      isStable: isStable,
      hasNaN: hasNaN,
      hasInfinity: hasInfinity,
      energyExceedance: energyExceedance,
      maxEnergy: maxEnergy,
      issues: issues,
      particleCount: particles.length
    };
  }

  /**
   * Detect anomalies in particle behavior
   * 
   * @param {Array<Object>} particles - Particles
   * @param {Array<Object>} collisions - Collisions
   * @returns {Object} Anomaly detection results
   */
  detectAnomalies(particles = [], collisions = []) {
    const anomalies = [];
    
    // Check 1: Particles with extreme velocities (>0.99c)
    particles.forEach((p, idx) => {
      const c = this.measurements?.c || 299792458;
      const v = Math.sqrt((p.vx||0)**2 + (p.vy||0)**2 + (p.vz||0)**2);
      
      if (v > 0.99 * c) {
        anomalies.push({
          type: 'extreme-velocity',
          particleIndex: idx,
          velocity: v,
          speedOfLight: c,
          factor: v / c
        });
      }
    });
    
    // Check 2: Collisions with extreme energy release
    collisions.forEach((col, idx) => {
      if (col.energyReleased && col.energyReleased > 1e18) {
        anomalies.push({
          type: 'extreme-energy-release',
          collisionIndex: idx,
          energy: col.energyReleased
        });
      }
    });
    
    // Check 3: Particles too close (possible overlap)
    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const dx = particles[i].x - particles[j].x;
        const dy = particles[i].y - particles[j].y;
        const dz = particles[i].z - particles[j].z;
        const dist = Math.sqrt(dx**2 + dy**2 + dz**2);
        
        if (dist < 1e-6) {
          anomalies.push({
            type: 'particle-overlap',
            particle1: i,
            particle2: j,
            distance: dist
          });
        }
      }
    }
    
    return {
      count: anomalies.length,
      anomalies: anomalies,
      hasAnomalies: anomalies.length > 0
    };
  }

  /**
   * Calculate overall system health score
   * 
   * @param {Object} checks - Results from all checks
   * @returns {Object} Health assessment
   */
  calculateSystemHealth(checks = {}) {
    let healthScore = 100;
    
    // Energy conservation impact
    if (checks.energy) {
      const energyPenalty = Math.min(50, checks.energy.avgError * 50);
      healthScore -= energyPenalty;
    }
    
    // Momentum conservation impact
    if (checks.momentum) {
      const momentumPenalty = Math.min(25, checks.momentum.avgError * 25);
      healthScore -= momentumPenalty;
    }
    
    // Causality violations impact
    if (checks.causality && checks.causality.violations > 0) {
      healthScore -= Math.min(20, checks.causality.violations * 5);
    }
    
    // System stability impact
    if (checks.stability && !checks.stability.isStable) {
      healthScore -= 30;
    }
    
    // Anomalies impact
    if (checks.anomalies && checks.anomalies.count > 0) {
      healthScore -= Math.min(10, checks.anomalies.count * 2);
    }
    
    healthScore = Math.max(0, Math.min(100, healthScore));
    
    let status = 'HEALTHY';
    if (healthScore < 30) status = 'CRITICAL';
    else if (healthScore < 70) status = 'WARNING';
    else if (healthScore < 90) status = 'DEGRADED';
    
    return {
      score: healthScore,
      status: status,
      percentage: `${healthScore.toFixed(1)}%`
    };
  }

  /**
   * Generate recommendations based on diagnostics
   * 
   * @param {Object} report - Diagnostic report
   * @returns {Array<string>} Recommendations
   */
  generateRecommendations(report = {}) {
    const recommendations = [];
    
    // Energy-related
    if (report.checks.energy?.violations > 0) {
      if (report.checks.energy.avgError > 10) {
        recommendations.push('URGENT: Reduce time step delta-t to improve energy conservation');
      } else if (report.checks.energy.avgError > 1) {
        recommendations.push('Consider reducing time step for better energy conservation');
      }
    }
    
    // Momentum-related
    if (report.checks.momentum?.violations > 0) {
      recommendations.push('Check collision response calculations for momentum conservation');
    }
    
    // Causality
    if (report.checks.causality?.violations > 0) {
      recommendations.push('FTL collisions detected - verify collision detection algorithm');
      recommendations.push('Consider reducing spatial range or improving causality checks');
    }
    
    // Stability
    if (report.checks.stability && !report.checks.stability.isStable) {
      recommendations.push('System instability detected - check for numerical issues');
      if (report.checks.stability.hasNaN) {
        recommendations.push('CRITICAL: NaN values detected - check for division by zero');
      }
      if (report.checks.stability.hasInfinity) {
        recommendations.push('CRITICAL: Infinite values detected - check for overflow');
      }
    }
    
    // Anomalies
    if (report.checks.anomalies?.hasAnomalies) {
      recommendations.push('Investigate detected anomalies in particle behavior');
    }
    
    // Health score
    if (report.systemHealth.score < 50) {
      recommendations.push('CRITICAL: System health degraded - review all conservation laws');
    }
    
    return recommendations;
  }

  /**
   * Get diagnostic history (recent N frames)
   * 
   * @param {number} frames - Number of recent frames to retrieve
   * @returns {Array<Object>} History
   */
  getHistory(frames = 10) {
    return this.diagnosticHistory.slice(Math.max(0, this.diagnosticHistory.length - frames));
  }

  /**
   * Get current system status summary
   * 
   * @returns {Object} Status summary
   */
  getStatusSummary() {
    const recent = this.diagnosticHistory.slice(-1)[0];
    
    return {
      frameNumber: this.frameCount,
      currentHealth: recent?.systemHealth || { score: 100, status: 'HEALTHY' },
      totalViolations: this.statistics.conservationViolations,
      totalAnomalies: this.statistics.anomaliesDetected,
      causalityViolations: this.statistics.causalityViolations,
      averageEnergyError: this.statistics.averageEnergyError,
      averageMomentumError: this.statistics.averageMomentumError,
      lastReport: recent || null
    };
  }

  /**
   * Reset diagnostics
   */
  reset() {
    this.diagnosticHistory = [];
    this.warnings = [];
    this.alerts = [];
    this.frameCount = 0;
    this.statistics = {
      totalFramesAnalyzed: 0,
      conservationViolations: 0,
      causalityViolations: 0,
      anomaliesDetected: 0,
      systemStable: true,
      averageEnergyError: 0,
      averageMomentumError: 0
    };
  }
}

export default Phase10Diagnostics;
