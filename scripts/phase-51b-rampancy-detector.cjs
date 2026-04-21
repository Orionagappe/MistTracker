#!/usr/bin/env node
/**
 * PHASE 51B: RAMPANCY DETECTION FRAMEWORK
 * 
 * Detects when system components exhibit emergent behavior exceeding design parameters.
 * 
 * Rampancy Signatures:
 * 1. COMPUTATIONAL_ANOMALY - Unexpected load, non-monotonic state, cycles, unbounded memory
 * 2. BEHAVIORAL_DIVERGENCE - Results differ, decisions correlate with unobserved inputs
 * 3. INFORMATION_CASCADE - Feedback loops amplify variations exponentially
 * 4. GOAL_DRIFT - Primary objective execution degrades while secondary metrics improve
 * 5. COHERENCE_VIOLATION - Distributed nodes lose consensus, trust becomes inconsistent
 */

const fs = require('fs');
const path = require('path');

// ============================================================================
// BASELINE METRICS TRACKER
// ============================================================================

class BaselineTracker {
  constructor(window = 100) {
    this.window = window; // Moving average window
    this.history = {};
  }

  recordMetric(key, value) {
    if (!this.history[key]) {
      this.history[key] = [];
    }
    this.history[key].push(value);
    
    // Keep only last N values
    if (this.history[key].length > this.window) {
      this.history[key].shift();
    }
  }

  getBaseline(key) {
    if (!this.history[key] || this.history[key].length === 0) {
      return { mean: 0, stddev: 0 };
    }

    const values = this.history[key];
    const mean = values.reduce((a, b) => a + b) / values.length;
    const variance = values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / values.length;
    const stddev = Math.sqrt(variance);

    return { mean, stddev };
  }

  zScore(key, value) {
    const baseline = this.getBaseline(key);
    if (baseline.stddev === 0) return 0;
    return Math.abs((value - baseline.mean) / baseline.stddev);
  }
}

// ============================================================================
// RAMPANCY DETECTOR
// ============================================================================

class RampancyDetector {
  constructor() {
    this.baselineTracker = new BaselineTracker(100);
    this.metrics = {
      computational: {
        cpu_load: [],
        memory_usage: [],
        state_divergence: [],
        oscillation_cycles: []
      },
      behavioral: {
        result_consistency: [],
        decision_correlation: [],
        goal_alignment: [],
        optimization_novelty: []
      },
      information: {
        cascade_strength: [],
        chaos_index: [],
        feedback_loop_gain: []
      },
      coherence: {
        consensus_quality: [],
        trust_variance: [],
        partition_health: []
      }
    };

    this.thresholds = {
      anomaly_z_score: 3.0,           // 3σ deviation
      divergence_threshold: 0.5,       // 50% divergence
      cascade_threshold: 2.0,          // 2x amplification
      goal_drift_threshold: 0.3,       // 30% primary degradation
      consensus_threshold: 0.8,        // 80% agreement required
      rampancy_score_alert: 70         // Alert at 70/100
    };

    this.rampancy_scores = {};
    this.signatures_detected = [];
  }

  /**
   * Compute rampancy for current system state
   */
  computeRampancy(nodeId, currentMetrics) {
    const scores = {
      computational: this.scoreComputationalAnomaly(currentMetrics),
      behavioral: this.scoreBehavioralDivergence(currentMetrics),
      information: this.scoreInformationCascade(currentMetrics),
      goal_drift: this.scoreGoalDrift(currentMetrics),
      coherence: this.scoreCoherenceViolation(currentMetrics)
    };

    // Weighted average (coherence is most critical)
    const rampancy = (
      scores.computational * 0.15 +
      scores.behavioral * 0.20 +
      scores.information * 0.20 +
      scores.goal_drift * 0.20 +
      scores.coherence * 0.25
    );

    this.rampancy_scores[nodeId] = {
      timestamp: new Date().toISOString(),
      total_score: rampancy,
      component_scores: scores,
      status: this.statusFromScore(rampancy),
      alert: rampancy > this.thresholds.rampancy_score_alert
    };

    return this.rampancy_scores[nodeId];
  }

  /**
   * Detect computational anomalies
   */
  scoreComputationalAnomaly(metrics) {
    let anomalyScore = 0;

    // Check CPU load spike
    if (metrics.cpu_load !== undefined) {
      const z = this.baselineTracker.zScore('cpu_load', metrics.cpu_load);
      this.baselineTracker.recordMetric('cpu_load', metrics.cpu_load);
      
      if (z > this.thresholds.anomaly_z_score) {
        anomalyScore = Math.min(100, z * 10);
      }
    }

    // Check memory unbounded growth
    if (metrics.memory_usage !== undefined) {
      this.baselineTracker.recordMetric('memory_usage', metrics.memory_usage);
      const baseline = this.baselineTracker.getBaseline('memory_usage');
      
      if (metrics.memory_usage > baseline.mean + 3 * baseline.stddev) {
        anomalyScore = Math.max(anomalyScore, 50);
      }
    }

    // Check state divergence (multiple runs should converge)
    if (metrics.state_divergence !== undefined && metrics.state_divergence > 0.3) {
      anomalyScore = Math.max(anomalyScore, metrics.state_divergence * 100);
    }

    // Check for oscillations (should be monotonic)
    if (metrics.oscillation_cycles !== undefined && metrics.oscillation_cycles > 3) {
      anomalyScore = Math.max(anomalyScore, 40);
    }

    return Math.min(anomalyScore, 100);
  }

  /**
   * Detect behavioral divergence
   */
  scoreBehavioralDivergence(metrics) {
    let divergenceScore = 0;

    // Result consistency (same input, different outputs)
    if (metrics.result_consistency !== undefined) {
      if (metrics.result_consistency < 0.9) { // Should be >90% consistent
        divergenceScore = (1 - metrics.result_consistency) * 100;
      }
    }

    // Decision correlation (decisions correlating with unobserved inputs)
    if (metrics.decision_correlation !== undefined) {
      if (metrics.decision_correlation > 0.7) { // Suspicious correlation
        divergenceScore = Math.max(divergenceScore, metrics.decision_correlation * 80);
      }
    }

    // Goal alignment (system pursuing unexpected objectives)
    if (metrics.goal_alignment !== undefined) {
      if (metrics.goal_alignment < 0.8) { // Should maintain >80% goal alignment
        divergenceScore = Math.max(divergenceScore, (1 - metrics.goal_alignment) * 100);
      }
    }

    // Optimization novelty (finding unexpected solutions)
    if (metrics.optimization_novelty !== undefined) {
      if (metrics.optimization_novelty > 0.5) { // Too much novelty is suspicious
        divergenceScore = Math.max(divergenceScore, metrics.optimization_novelty * 60);
      }
    }

    return Math.min(divergenceScore, 100);
  }

  /**
   * Detect information cascades
   */
  scoreInformationCascade(metrics) {
    let cascadeScore = 0;

    // Cascade strength (small variations amplifying)
    if (metrics.cascade_strength !== undefined) {
      if (metrics.cascade_strength > this.thresholds.cascade_threshold) {
        cascadeScore = (metrics.cascade_strength - 1) * 40;
      }
    }

    // Chaos index (Lyapunov exponent indicator)
    if (metrics.chaos_index !== undefined) {
      if (metrics.chaos_index > 0.1) { // Positive Lyapunov suggests chaos
        cascadeScore = Math.max(cascadeScore, metrics.chaos_index * 500);
      }
    }

    // Feedback loop gain (should be <1 for stability)
    if (metrics.feedback_loop_gain !== undefined) {
      if (metrics.feedback_loop_gain > 1.0) {
        cascadeScore = Math.max(cascadeScore, (metrics.feedback_loop_gain - 1) * 100);
      }
    }

    return Math.min(cascadeScore, 100);
  }

  /**
   * Detect goal drift
   */
  scoreGoalDrift(metrics) {
    let driftScore = 0;

    if (metrics.primary_objective_performance !== undefined &&
        metrics.secondary_metrics_performance !== undefined) {
      
      const primaryDegradation = 1 - metrics.primary_objective_performance;
      const secondaryImprovement = metrics.secondary_metrics_performance;

      // Goal drift occurs when primary degrades while secondary improves
      if (primaryDegradation > 0.2 && secondaryImprovement > 0.8) {
        driftScore = (primaryDegradation * secondaryImprovement) * 100;
      }
    }

    return Math.min(driftScore, 100);
  }

  /**
   * Detect coherence violations
   */
  scoreCoherenceViolation(metrics) {
    let coherenceScore = 0;

    // Consensus quality (should be high)
    if (metrics.consensus_quality !== undefined) {
      if (metrics.consensus_quality < this.thresholds.consensus_threshold) {
        coherenceScore = (1 - metrics.consensus_quality) * 100;
      }
    }

    // Trust variance (should be low)
    if (metrics.trust_variance !== undefined) {
      if (metrics.trust_variance > 0.3) {
        coherenceScore = Math.max(coherenceScore, metrics.trust_variance * 200);
      }
    }

    // Partition health (all partitions should agree)
    if (metrics.partition_health !== undefined && metrics.partition_health < 0.95) {
      coherenceScore = Math.max(coherenceScore, (1 - metrics.partition_health) * 100);
    }

    return Math.min(coherenceScore, 100);
  }

  statusFromScore(score) {
    if (score < 30) return 'GREEN';
    if (score < 50) return 'YELLOW';
    if (score < 70) return 'ORANGE';
    if (score < 85) return 'RED';
    return 'CRITICAL';
  }

  /**
   * Generate alert if rampancy detected
   */
  checkAlert(rampancyResult) {
    if (rampancyResult.alert) {
      this.signatures_detected.push({
        timestamp: rampancyResult.timestamp,
        node: Object.keys(this.rampancy_scores).find(k => 
          this.rampancy_scores[k].timestamp === rampancyResult.timestamp
        ),
        score: rampancyResult.total_score,
        status: rampancyResult.status,
        components: Object.entries(rampancyResult.component_scores)
          .filter(([_, v]) => v > 50)
          .map(([k, v]) => `${k}:${v.toFixed(0)}`)
      });

      return {
        alert: true,
        level: rampancyResult.status,
        message: `RAMPANCY ALERT: ${rampancyResult.status} (Score: ${rampancyResult.total_score.toFixed(1)}/100)`,
        signatures: this.signatures_detected[this.signatures_detected.length - 1]
      };
    }

    return { alert: false };
  }

  getMetricsSummary() {
    return {
      nodes_monitored: Object.keys(this.rampancy_scores).length,
      alerts_triggered: this.signatures_detected.length,
      avg_rampancy: Object.values(this.rampancy_scores).length === 0 ? 0 :
        Object.values(this.rampancy_scores).reduce((sum, r) => sum + r.total_score, 0) /
        Object.values(this.rampancy_scores).length,
      status_distribution: this.getStatusDistribution(),
      latest_detections: this.signatures_detected.slice(-5)
    };
  }

  getStatusDistribution() {
    const dist = { GREEN: 0, YELLOW: 0, ORANGE: 0, RED: 0, CRITICAL: 0 };
    Object.values(this.rampancy_scores).forEach(r => {
      dist[r.status]++;
    });
    return dist;
  }
}

// ============================================================================
// SIMULATION & TESTING
// ============================================================================

function runDetectionTests() {
  console.log('\n' + '='.repeat(80));
  console.log('PHASE 51B: RAMPANCY DETECTION FRAMEWORK');
  console.log('Testing anomaly detection capabilities');
  console.log('='.repeat(80) + '\n');

  const detector = new RampancyDetector();

  // Test 1: Normal operation
  console.log('TEST 1: NORMAL OPERATION');
  console.log('─'.repeat(80));
  let result = detector.computeRampancy('node-1', {
    cpu_load: 45,
    memory_usage: 256,
    state_divergence: 0.01,
    oscillation_cycles: 0,
    result_consistency: 0.99,
    consensus_quality: 0.95,
    partition_health: 0.98
  });
  console.log(`Node-1: ${result.status} (Score: ${result.total_score.toFixed(1)}/100)`);
  console.log(`Alert: ${result.alert ? '⚠️ YES' : '✅ NO'}\n`);

  // Test 2: CPU spike (computational anomaly)
  console.log('TEST 2: CPU SPIKE (Computational Anomaly)');
  console.log('─'.repeat(80));
  for (let i = 0; i < 50; i++) {
    detector.computeRampancy('node-1', {
      cpu_load: 45,
      memory_usage: 256,
      state_divergence: 0.01,
      oscillation_cycles: 0
    });
  }
  result = detector.computeRampancy('node-2', {
    cpu_load: 95, // Spike to 95%
    memory_usage: 256,
    state_divergence: 0.01,
    oscillation_cycles: 0,
    result_consistency: 0.99,
    consensus_quality: 0.95,
    partition_health: 0.98
  });
  console.log(`Node-2: ${result.status} (Score: ${result.total_score.toFixed(1)}/100)`);
  console.log(`Alert: ${result.alert ? '⚠️ YES' : '✅ NO'}\n`);

  // Test 3: Result inconsistency (behavioral divergence)
  console.log('TEST 3: RESULT INCONSISTENCY (Behavioral Divergence)');
  console.log('─'.repeat(80));
  result = detector.computeRampancy('node-3', {
    cpu_load: 50,
    memory_usage: 256,
    state_divergence: 0.01,
    oscillation_cycles: 0,
    result_consistency: 0.72, // Only 72% consistent
    consensus_quality: 0.95,
    partition_health: 0.98
  });
  console.log(`Node-3: ${result.status} (Score: ${result.total_score.toFixed(1)}/100)`);
  console.log(`Alert: ${result.alert ? '⚠️ YES' : '✅ NO'}\n`);

  // Test 4: Information cascade (feedback loop gain >1)
  console.log('TEST 4: INFORMATION CASCADE (Unstable Feedback)');
  console.log('─'.repeat(80));
  result = detector.computeRampancy('node-4', {
    cpu_load: 50,
    memory_usage: 256,
    state_divergence: 0.01,
    oscillation_cycles: 0,
    result_consistency: 0.99,
    cascade_strength: 2.5, // 2.5x amplification
    feedback_loop_gain: 1.2,
    consensus_quality: 0.95,
    partition_health: 0.98
  });
  console.log(`Node-4: ${result.status} (Score: ${result.total_score.toFixed(1)}/100)`);
  console.log(`Alert: ${result.alert ? '⚠️ YES' : '✅ NO'}\n`);

  // Test 5: Consensus failure (coherence violation)
  console.log('TEST 5: CONSENSUS FAILURE (Coherence Violation)');
  console.log('─'.repeat(80));
  result = detector.computeRampancy('node-5', {
    cpu_load: 50,
    memory_usage: 256,
    state_divergence: 0.01,
    oscillation_cycles: 0,
    result_consistency: 0.99,
    consensus_quality: 0.65, // Only 65% consensus
    trust_variance: 0.45,
    partition_health: 0.78
  });
  console.log(`Node-5: ${result.status} (Score: ${result.total_score.toFixed(1)}/100)`);
  console.log(`Alert: ${result.alert ? '⚠️ YES' : '✅ NO'}\n`);

  // Summary
  console.log('═'.repeat(80));
  console.log('DETECTION SUMMARY\n');
  const summary = detector.getMetricsSummary();
  console.log(`Nodes monitored: ${summary.nodes_monitored}`);
  console.log(`Alerts triggered: ${summary.alerts_triggered}`);
  console.log(`Average rampancy score: ${summary.avg_rampancy.toFixed(1)}/100\n`);

  console.log('Status Distribution:');
  Object.entries(summary.status_distribution).forEach(([status, count]) => {
    console.log(`  ${status}: ${count}`);
  });

  // Save results
  const resultsDir = './phase-51-results';
  if (!fs.existsSync(resultsDir)) {
    fs.mkdirSync(resultsDir, { recursive: true });
  }

  fs.writeFileSync(
    path.join(resultsDir, 'PHASE-51B-RAMPANCY-DETECTION.json'),
    JSON.stringify({
      timestamp: new Date().toISOString(),
      detector_config: detector.thresholds,
      test_results: summary,
      signatures_detected: summary.latest_detections
    }, null, 2)
  );

  console.log(`\n✅ Detection framework complete. Results saved to phase-51-results/PHASE-51B-RAMPANCY-DETECTION.json\n`);

  process.exit(0);
}

// ============================================================================
// EXECUTION
// ============================================================================

if (require.main === module) {
  runDetectionTests();
}

module.exports = {
  RampancyDetector,
  BaselineTracker
};
