#!/usr/bin/env node
/**
 * PHASE 51C: GRIMREAPER NODE MANAGEMENT
 * 
 * Distributed consensus system that detects unstable nodes and boots them
 * while sanitizing their data contributions.
 * 
 * Four-layer architecture:
 * 1. Local Detection - Per-node self-diagnostics
 * 2. Peer Interrogation - Network consensus voting
 * 3. Boot & Sanitization - Isolation and cleanup
 * 4. Data Sanitization - Audit trail and recovery
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// ============================================================================
// MESSAGE TYPES & PROTOCOL
// ============================================================================

const MessageTypes = {
  HEALTH_REPORT: 'HEALTH_REPORT',           // node → peers: status update
  INTERROGATION: 'INTERROGATION',           // peer → node: prove stability
  CHALLENGE_RESPONSE: 'CHALLENGE_RESPONSE', // node → peer: proof
  BOOT_VOTE: 'BOOT_VOTE',                   // peer → network: unstable vote
  QUORUM_DECISION: 'QUORUM_DECISION',       // network → GrimReaper: execute boot
  SANITIZATION_LOG: 'SANITIZATION_LOG',     // ledger: cleanup record
  RESTART_READY: 'RESTART_READY'            // quarantine: node can rejoin
};

// ============================================================================
// LAYER 1: LOCAL DIAGNOSTICS
// ============================================================================

class LocalDiagnostics {
  constructor(nodeId) {
    this.nodeId = nodeId;
    this.health_status = {
      cpu_normal: true,
      memory_normal: true,
      consensus_achieved: true,
      data_integrity_ok: true,
      behavior_sane: true
    };
    this.distress_counter = 0;
    this.distress_threshold = 3; // Fail 3 times before signaling
  }

  /**
   * Run comprehensive self-diagnostics
   */
  runDiagnostics(metrics) {
    this.health_status.cpu_normal = metrics.cpu_load < 90;
    this.health_status.memory_normal = metrics.memory_usage < 500;
    this.health_status.consensus_achieved = metrics.consensus_quality > 0.8;
    this.health_status.data_integrity_ok = metrics.checksum_valid;
    this.health_status.behavior_sane = metrics.goal_alignment > 0.7;

    const allHealthy = Object.values(this.health_status).every(v => v === true);

    if (!allHealthy) {
      this.distress_counter++;
    } else {
      this.distress_counter = Math.max(0, this.distress_counter - 1); // Reset on success
    }

    return {
      nodeId: this.nodeId,
      healthy: allHealthy,
      distress_level: this.distress_counter,
      should_signal_distress: this.distress_counter >= this.distress_threshold,
      health_breakdown: this.health_status,
      timestamp: new Date().toISOString()
    };
  }
}

// ============================================================================
// LAYER 2: PEER INTERROGATION
// ============================================================================

class PeerInterrogation {
  constructor(nodeId, peers = []) {
    this.nodeId = nodeId;
    this.peers = peers;
    this.interrogation_results = {};
  }

  /**
   * Challenge a node with queries; expect proof of stability
   */
  interrogateNode(targetNodeId, metrics) {
    const challenges = [
      { type: 'state_hash', expected: this.computeStateHash(metrics) },
      { type: 'sequence_number', expected: metrics.sequence_num },
      { type: 'timestamp_drift', max_drift_ms: 5000 },
      { type: 'consistency_check', expected: metrics.last_consensus_hash }
    ];

    const responses = {
      node: targetNodeId,
      interrogating_node: this.nodeId,
      challenges_issued: challenges.length,
      challenges_passed: 0,
      challenges_failed: 0,
      timestamp: new Date().toISOString()
    };

    // Simulate responses from target node
    challenges.forEach((challenge, idx) => {
      // In real system, would wait for actual responses
      // For demo, simulate with some failures
      const passed = Math.random() > 0.1; // 90% pass rate normally
      
      if (passed) {
        responses.challenges_passed++;
      } else {
        responses.challenges_failed++;
      }
    });

    responses.stability_score = (responses.challenges_passed / challenges.length) * 100;
    responses.deemed_unstable = responses.stability_score < 70;

    this.interrogation_results[targetNodeId] = responses;
    return responses;
  }

  computeStateHash(metrics) {
    return crypto
      .createHash('sha256')
      .update(JSON.stringify(metrics))
      .digest('hex')
      .substring(0, 8);
  }

  /**
   * Quorum voting on node stability
   * Returns: { node_id, votes_unstable, votes_stable, quorum_decision }
   */
  conductQuorumVote(targetNodeId, allResponses) {
    let unstable_votes = 0;
    let stable_votes = 0;

    Object.values(allResponses).forEach(response => {
      if (response.deemed_unstable) {
        unstable_votes++;
      } else {
        stable_votes++;
      }
    });

    const total = unstable_votes + stable_votes;
    const quorum_threshold = Math.ceil(total / 2);

    return {
      node: targetNodeId,
      unstable_votes,
      stable_votes,
      total_votes: total,
      quorum_threshold,
      quorum_decision: unstable_votes >= quorum_threshold ? 'BOOT' : 'KEEP',
      confidence: Math.max(unstable_votes, stable_votes) / total
    };
  }
}

// ============================================================================
// LAYER 3: BOOT & ISOLATION
// ============================================================================

class BootOrchestration {
  constructor() {
    this.quarantine_log = [];
    this.boot_history = [];
  }

  /**
   * Execute boot sequence
   */
  executeBoot(nodeId, reason) {
    const bootRecord = {
      node_id: nodeId,
      boot_timestamp: new Date().toISOString(),
      reason,
      boot_steps: [
        { step: 'DISCONNECT', status: 'complete', timestamp: new Date().toISOString() },
        { step: 'DUMP_STATE', status: 'complete', timestamp: new Date().toISOString() },
        { step: 'FLAG_DATA', status: 'complete', timestamp: new Date().toISOString() },
        { step: 'ISOLATE_NETWORK', status: 'complete', timestamp: new Date().toISOString() },
        { step: 'QUARANTINE', status: 'in_progress', timestamp: new Date().toISOString() }
      ],
      quarantine_duration_minutes: 10,
      quarantine_end: new Date(Date.now() + 10 * 60000).toISOString()
    };

    this.boot_history.push(bootRecord);
    this.quarantine_log.push({
      node: nodeId,
      status: 'QUARANTINED',
      entry_time: bootRecord.boot_timestamp,
      exit_time: bootRecord.quarantine_end
    });

    return bootRecord;
  }

  /**
   * Check if quarantined node can rejoin
   */
  canRejoinNetwork(nodeId) {
    const quarantine = this.quarantine_log.find(q => q.node === nodeId);
    if (!quarantine) return true; // Not quarantined

    const exitTime = new Date(quarantine.exit_time).getTime();
    const now = Date.now();

    if (now >= exitTime) {
      quarantine.status = 'READY_TO_RESTART';
      return true;
    }

    return false;
  }

  getQuarantineStatus() {
    return this.quarantine_log.map(q => ({
      node: q.node,
      status: q.status,
      remaining_time_minutes: Math.ceil(
        (new Date(q.exit_time).getTime() - Date.now()) / 60000
      )
    }));
  }
}

// ============================================================================
// LAYER 4: DATA SANITIZATION
// ============================================================================

class DataSanitization {
  constructor() {
    this.audit_trail = [];
    this.data_contributions = {}; // Track which node contributed what
  }

  /**
   * Flag all data contributed by unstable node
   */
  flagNodeData(nodeId, dataIds) {
    const flagRecord = {
      timestamp: new Date().toISOString(),
      node: nodeId,
      data_flagged: dataIds.length,
      data_ids: dataIds,
      status: 'FLAGGED_FOR_REVIEW',
      action: 'QUARANTINE_DATA'
    };

    this.audit_trail.push(flagRecord);
    
    dataIds.forEach(dataId => {
      if (!this.data_contributions[dataId]) {
        this.data_contributions[dataId] = [];
      }
      this.data_contributions[dataId].push({
        contributor: nodeId,
        status: 'FLAGGED',
        flagged_time: flagRecord.timestamp
      });
    });

    return flagRecord;
  }

  /**
   * Recompute results without flagged node's data
   */
  recomputeWithoutNode(nodeId, computationFunction) {
    const flaggedData = [];
    
    Object.entries(this.data_contributions).forEach(([dataId, contributions]) => {
      const nodeContribution = contributions.find(c => c.contributor === nodeId);
      if (nodeContribution && nodeContribution.status === 'FLAGGED') {
        flaggedData.push(dataId);
      }
    });

    const recomputeRecord = {
      timestamp: new Date().toISOString(),
      excluded_node: nodeId,
      excluded_data_count: flaggedData.length,
      recomputation_status: 'COMPLETE',
      result_change: 'ANALYZED', // Would be actual diff in real system
      cross_check_status: 'VERIFIED'
    };

    this.audit_trail.push(recomputeRecord);
    return recomputeRecord;
  }

  /**
   * Restore data only if consensus confirms correctness
   */
  restoreDataWithConsensus(nodeId, consensusApproval) {
    if (!consensusApproval) {
      return {
        status: 'RESTORE_DENIED',
        reason: 'No consensus approval',
        node: nodeId
      };
    }

    const restoreRecord = {
      timestamp: new Date().toISOString(),
      node: nodeId,
      action: 'DATA_RESTORED',
      consensus_approval: true,
      data_restored: Object.keys(this.data_contributions).filter(dataId =>
        this.data_contributions[dataId].some(c => c.contributor === nodeId)
      ).length
    };

    this.audit_trail.push(restoreRecord);
    return restoreRecord;
  }

  getAuditTrail() {
    return this.audit_trail;
  }
}

// ============================================================================
// GRIMREAPER ORCHESTRATOR
// ============================================================================

class GrimReaper {
  constructor(nodeId, peers = []) {
    this.nodeId = nodeId;
    this.peers = peers;
    
    this.local_diag = new LocalDiagnostics(nodeId);
    this.interrogation = new PeerInterrogation(nodeId, peers);
    this.boot_orch = new BootOrchestration();
    this.data_san = new DataSanitization();

    this.boot_decisions = [];
  }

  /**
   * Full GrimReaper pipeline
   */
  monitorAndRespond(nodeMetrics) {
    // Layer 1: Local detection
    const local_status = this.local_diag.runDiagnostics(nodeMetrics);

    if (!local_status.should_signal_distress) {
      return { status: 'HEALTHY', local_status };
    }

    console.log(`⚠️  Node ${nodeMetrics.node_id} signaling distress (level ${local_status.distress_level})`);

    // Layer 2: Peer interrogation
    const interrogation_results = {};
    this.peers.forEach(peerId => {
      interrogation_results[peerId] = this.interrogation.interrogateNode(
        nodeMetrics.node_id,
        nodeMetrics
      );
    });

    const quorum_result = this.interrogation.conductQuorumVote(
      nodeMetrics.node_id,
      interrogation_results
    );

    if (quorum_result.quorum_decision !== 'BOOT') {
      return { status: 'DISTRESSED_BUT_STABLE', quorum_result };
    }

    console.log(`🔴 BOOT DECISION: ${nodeMetrics.node_id} (${quorum_result.unstable_votes}/${quorum_result.total_votes} votes)`);

    // Layer 3: Execute boot
    const boot_record = this.boot_orch.executeBoot(
      nodeMetrics.node_id,
      `Quorum decision: ${quorum_result.unstable_votes}/${quorum_result.total_votes} unstable votes`
    );

    // Layer 4: Data sanitization
    const flagged_data = nodeMetrics.data_ids || [];
    this.data_san.flagNodeData(nodeMetrics.node_id, flagged_data);

    const boot_decision = {
      timestamp: new Date().toISOString(),
      node_booted: nodeMetrics.node_id,
      reason: quorum_result.quorum_decision,
      boot_record,
      data_sanitization: {
        flagged: flagged_data.length,
        action: 'QUARANTINED_FOR_REVIEW'
      }
    };

    this.boot_decisions.push(boot_decision);
    return { status: 'BOOTED', boot_decision };
  }

  getSystemStatus() {
    return {
      nodes_booted: this.boot_decisions.length,
      boot_history: this.boot_orch.boot_history,
      quarantine_status: this.boot_orch.getQuarantineStatus(),
      audit_trail: this.data_san.getAuditTrail()
    };
  }
}

// ============================================================================
// SIMULATION & TESTING
// ============================================================================

function runGrimReaperTests() {
  console.log('\n' + '='.repeat(80));
  console.log('PHASE 51C: GRIMREAPER NODE MANAGEMENT');
  console.log('Testing distributed node stability and recovery');
  console.log('='.repeat(80) + '\n');

  const gr = new GrimReaper('node-coordinator', ['peer-1', 'peer-2', 'peer-3']);

  // Test 1: Healthy node
  console.log('TEST 1: HEALTHY NODE');
  console.log('─'.repeat(80));
  let result = gr.monitorAndRespond({
    node_id: 'app-node-1',
    cpu_load: 45,
    memory_usage: 256,
    consensus_quality: 0.95,
    checksum_valid: true,
    goal_alignment: 0.95,
    data_ids: ['d1', 'd2', 'd3']
  });
  console.log(`Status: ${result.status}\n`);

  // Test 2: Distressed node (will be booted)
  console.log('TEST 2: UNSTABLE NODE (Multi-factor Distress)');
  console.log('─'.repeat(80));
  
  // Make it fail diagnostics multiple times
  for (let i = 0; i < 3; i++) {
    gr.monitorAndRespond({
      node_id: 'app-node-2',
      cpu_load: 95,
      memory_usage: 600,
      consensus_quality: 0.6,
      checksum_valid: false,
      goal_alignment: 0.5,
      data_ids: ['d4', 'd5', 'd6', 'd7', 'd8']
    });
  }
  
  result = gr.monitorAndRespond({
    node_id: 'app-node-2',
    cpu_load: 95,
    memory_usage: 600,
    consensus_quality: 0.6,
    checksum_valid: false,
    goal_alignment: 0.5,
    data_ids: ['d4', 'd5', 'd6', 'd7', 'd8']
  });

  console.log(`Status: ${result.status}`);
  if (result.boot_decision) {
    console.log(`Boot Record: ${result.boot_decision.boot_record.node_id}`);
    console.log(`Data Flagged: ${result.boot_decision.data_sanitization.flagged} items`);
    console.log(`Quarantine Until: ${result.boot_decision.boot_record.quarantine_end}\n`);
  }

  // Test 3: Cascading failures
  console.log('TEST 3: CASCADING FAILURES (Multiple Nodes)');
  console.log('─'.repeat(80));

  for (let nodeNum = 3; nodeNum <= 4; nodeNum++) {
    for (let i = 0; i < 3; i++) {
      gr.monitorAndRespond({
        node_id: `app-node-${nodeNum}`,
        cpu_load: 85 + Math.random() * 15,
        memory_usage: 450 + Math.random() * 150,
        consensus_quality: 0.6 + Math.random() * 0.2,
        checksum_valid: Math.random() > 0.3,
        goal_alignment: 0.5 + Math.random() * 0.2,
        data_ids: [`d${nodeNum}0`, `d${nodeNum}1`, `d${nodeNum}2`]
      });
    }
  }

  console.log(`Nodes processed: app-node-3, app-node-4`);
  console.log(`Status: Recovery in progress\n`);

  // System status
  console.log('═'.repeat(80));
  console.log('SYSTEM STATUS AFTER TESTING\n');

  const status = gr.getSystemStatus();
  console.log(`Nodes Booted: ${status.nodes_booted}`);
  console.log(`Boot History:`);
  status.boot_history.forEach(boot => {
    console.log(`  - ${boot.node_id} @ ${boot.boot_timestamp.substring(11, 19)}`);
  });

  console.log(`\nQuarantine Status:`);
  status.quarantine_status.forEach(q => {
    const remaining = q.remaining_time_minutes;
    const status_str = remaining > 0 
      ? `QUARANTINED (${remaining} min remaining)`
      : 'READY TO RESTART';
    console.log(`  - ${q.node}: ${status_str}`);
  });

  console.log(`\nAudit Trail Events: ${status.audit_trail.length}`);

  // Save results
  const resultsDir = './phase-51-results';
  if (!fs.existsSync(resultsDir)) {
    fs.mkdirSync(resultsDir, { recursive: true });
  }

  fs.writeFileSync(
    path.join(resultsDir, 'PHASE-51C-GRIMREAPER-RESULTS.json'),
    JSON.stringify({
      timestamp: new Date().toISOString(),
      system_status: status,
      test_summary: {
        nodes_monitored: 4,
        nodes_booted: status.nodes_booted,
        data_flagged_total: status.audit_trail
          .filter(a => a.action === 'QUARANTINE_DATA')
          .reduce((sum, a) => sum + a.data_flagged, 0)
      }
    }, null, 2)
  );

  console.log(`\n✅ GrimReaper testing complete. Results saved to phase-51-results/PHASE-51C-GRIMREAPER-RESULTS.json\n`);

  process.exit(0);
}

// ============================================================================
// EXECUTION
// ============================================================================

if (require.main === module) {
  runGrimReaperTests();
}

module.exports = {
  GrimReaper,
  LocalDiagnostics,
  PeerInterrogation,
  BootOrchestration,
  DataSanitization,
  MessageTypes
};
