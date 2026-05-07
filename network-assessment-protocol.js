/**
 * PHASE 6: Network Assessment Protocol
 * 
 * Monitors blockchain network reliability and generates measurable claims
 * Works with network-assessment-validators.js for reputation scoring
 */

import { EventEmitter } from 'events';

export class NetworkAssessmentProtocol extends EventEmitter {
  constructor(network_config = {}) {
    super();
    
    // Network Configuration
    this.network_id = network_config.network_id || 'ethereum-sepolia';
    this.network_name = network_config.network_name || 'Ethereum Sepolia Testnet';
    this.rpc_url = network_config.rpc_url || 'https://eth-sepolia.g.alchemy.com/v2/demo';
    this.chain_id = network_config.chain_id || 11155111;
    
    // Assessment Configuration
    this.measurement_window = network_config.measurement_window || 86400000; // 24 hours default
    this.check_interval = network_config.check_interval || 30000; // 30 seconds
    this.replication_required = network_config.replication_required || 2; // min validators
    
    // Measurement Data
    this.measurements = [];
    this.current_session = {
      start_time: null,
      end_time: null,
      status: 'inactive',
      measurements_collected: 0,
      properties_tested: []
    };
    
    // Network Properties to Measure
    this.properties = {
      availability: { description: 'Network responds to requests', weight: 0.25 },
      integrity: { description: 'Blocks cannot be modified after finalization', weight: 0.25 },
      consistency: { description: 'All nodes agree on chain state', weight: 0.20 },
      finality: { description: 'Transactions become permanent at predictable point', weight: 0.20 },
      crypto_soundness: { description: 'Hashes and signatures are valid', weight: 0.10 }
    };
  }
  
  // =========================================================================
  // STAGE 1: Language Audit - Format validation
  // =========================================================================
  
  /**
   * Validate claim format for network assessment
   * Returns: { valid: boolean, errors: [], claim_data: object }
   */
  auditClaimLanguage(claim) {
    const errors = [];
    
    // Required fields
    if (!claim.network_id) errors.push('Missing: network_id');
    if (!claim.property) errors.push('Missing: property (e.g., "availability")');
    if (!claim.assertion) errors.push('Missing: assertion (e.g., ">99% uptime")');
    if (typeof claim.confidence !== 'number' || claim.confidence < 0 || claim.confidence > 100) {
      errors.push('Invalid: confidence must be 0-100');
    }
    if (!claim.measurement_period) errors.push('Missing: measurement_period (e.g., "Q2 2026")');
    if (!claim.validator_group) errors.push('Missing: validator_group');
    
    // Property validation
    if (claim.property && !this.properties[claim.property]) {
      errors.push(`Invalid property: "${claim.property}". Must be one of: ${Object.keys(this.properties).join(', ')}`);
    }
    
    // Assertion validation (must be quantifiable)
    const quantifiable = claim.assertion && (
      claim.assertion.includes('%') ||
      claim.assertion.includes('seconds') ||
      claim.assertion.includes('ms') ||
      claim.assertion.includes('blocks') ||
      claim.assertion.includes('transaction')
    );
    
    if (claim.assertion && !quantifiable) {
      errors.push('Assertion must be quantifiable (include %, seconds, blocks, etc.)');
    }
    
    return {
      valid: errors.length === 0,
      errors: errors,
      claim_data: errors.length === 0 ? {
        claim_id: `net-${claim.network_id.substring(0, 4)}-${Date.now()}`,
        network_id: claim.network_id,
        property: claim.property,
        assertion: claim.assertion,
        confidence: claim.confidence,
        measurement_period: claim.measurement_period,
        validator_group: claim.validator_group,
        timestamp: new Date().toISOString(),
        stage: 1
      } : null
    };
  }
  
  // =========================================================================
  // STAGE 2: Measurement Design - Protocol specification
  // =========================================================================
  
  /**
   * Design measurement protocol for a network property
   * Returns measurement methodology (reproducible steps)
   */
  designMeasurementProtocol(property, options = {}) {
    const protocol = {
      property: property,
      network_id: this.network_id,
      methodology: this._getPropertyMeasurementMethod(property),
      sample_size: options.sample_size || 2880, // 24 hours at 30s intervals
      measurement_interval: this.check_interval,
      duration_hours: options.duration_hours || 24,
      success_criteria: this._getSuccessCriteria(property),
      reproducibility_notes: 'Protocol must be identical across replications',
      timestamp: new Date().toISOString()
    };
    
    return {
      valid: true,
      protocol: protocol,
      instructions: this._generateInstructions(protocol)
    };
  }
  
  _getPropertyMeasurementMethod(property) {
    const methods = {
      availability: {
        description: 'Poll RPC endpoint and measure response time',
        metric: 'successful_responses / total_requests',
        target: '> 99%'
      },
      integrity: {
        description: 'Get block at height N, then N+100, verify hashes unchanged',
        metric: 'blocks_with_correct_hash / total_blocks_checked',
        target: '100%'
      },
      consistency: {
        description: 'Query latest block from multiple nodes, compare state',
        metric: 'nodes_with_identical_state / total_nodes',
        target: '100%'
      },
      finality: {
        description: 'Track transaction from submission to finalization, measure blocks needed',
        metric: 'average_blocks_to_finalization',
        target: '< 15 blocks (180 seconds)'
      },
      crypto_soundness: {
        description: 'Verify signatures and hashes on random sample of blocks',
        metric: 'valid_signatures / total_signatures_checked',
        target: '100%'
      }
    };
    
    return methods[property] || null;
  }
  
  _getSuccessCriteria(property) {
    const criteria = {
      availability: { threshold: 99, metric: 'success_rate' },
      integrity: { threshold: 100, metric: 'hash_consistency' },
      consistency: { threshold: 100, metric: 'node_agreement' },
      finality: { threshold: 15, metric: 'max_blocks_to_finalize' },
      crypto_soundness: { threshold: 100, metric: 'signature_validity' }
    };
    
    return criteria[property] || {};
  }
  
  _generateInstructions(protocol) {
    return [
      `1. Set up monitoring from distinct location (different ISP/region if possible)`,
      `2. Execute ${protocol.sample_size} checks at ${protocol.measurement_interval}ms intervals`,
      `3. Record each measurement with timestamp, result, response time, error (if any)`,
      `4. After collection, analyze results against success criteria`,
      `5. Document any anomalies or network events during measurement window`,
      `6. Submit measurement data with claim for replication`
    ];
  }
  
  // =========================================================================
  // STAGE 3: Replication - Independent validation
  // =========================================================================
  
  /**
   * Verify claim through independent measurement
   * Returns: { replicated: boolean, deviation: number, confidence: number }
   */
  async replicateMeasurement(original_claim, measurement_data) {
    // Validate measurement data matches original claim
    if (measurement_data.network_id !== original_claim.network_id) {
      return { replicated: false, reason: 'Network mismatch' };
    }
    
    if (measurement_data.property !== original_claim.property) {
      return { replicated: false, reason: 'Property mismatch' };
    }
    
    // Calculate deviation from original assertion
    const original_value = this._extractMetricFromAssertion(original_claim.assertion);
    const measured_value = this._calculateMetricFromData(measurement_data);
    
    const deviation = Math.abs(original_value - measured_value);
    const tolerance = 2; // 2% tolerance for network variance
    
    const replicated = deviation <= tolerance;
    
    return {
      replicated: replicated,
      original_value: original_value,
      measured_value: measured_value,
      deviation: deviation,
      tolerance: tolerance,
      confidence: Math.max(0, 100 - (deviation * 10)), // Confidence decreases with deviation
      timestamp: new Date().toISOString()
    };
  }
  
  _extractMetricFromAssertion(assertion) {
    // Extract numeric value from assertion like ">99% uptime"
    const match = assertion.match(/(\d+(?:\.\d+)?)/);
    return match ? parseFloat(match[1]) : null;
  }
  
  _calculateMetricFromData(measurement_data) {
    // Calculate metric from raw measurement data
    if (measurement_data.successful_requests !== undefined && measurement_data.total_requests !== undefined) {
      return (measurement_data.successful_requests / measurement_data.total_requests) * 100;
    }
    
    if (measurement_data.successful_measurements !== undefined && measurement_data.total_measurements !== undefined) {
      return (measurement_data.successful_measurements / measurement_data.total_measurements) * 100;
    }
    
    return null;
  }
  
  // =========================================================================
  // STAGE 4: Consequence Mapping - Impact assessment
  // =========================================================================
  
  /**
   * Map consequences if network property claim is false
   * Returns: { property, consequence, impact_level, mitigations }
   */
  mapConsequences(property, network_id) {
    const consequences = {
      availability: {
        consequence: 'Game cannot anchor claims/verdicts to blockchain',
        impact_level: 'high',
        duration: 'Until network recovers',
        mitigations: ['Fallback to local blockchain', 'Queue anchors for replay when network recovers', 'Alert validators']
      },
      integrity: {
        consequence: 'Historic anchors could be forged retroactively',
        impact_level: 'critical',
        duration: 'Permanent (affects all claims anchored during outage)',
        mitigations: ['Quarantine affected claims', 'Require re-verification', 'Investigate cause of integrity failure']
      },
      consistency: {
        consequence: 'Validators see different blockchain state',
        impact_level: 'high',
        duration: 'Until consensus restored',
        mitigations: ['Wait for consensus', 'Use canonical node', 'Alert validators of divergence']
      },
      finality: {
        consequence: 'Cannot trust transaction finality timing',
        impact_level: 'medium',
        duration: 'Ongoing if property fails',
        mitigations: ['Increase confirmation requirements', 'Use longer finality window', 'Manual verification needed']
      },
      crypto_soundness: {
        consequence: 'Cryptographic proofs are invalid',
        impact_level: 'critical',
        duration: 'Permanent',
        mitigations: ['Stop using network immediately', 'Invalidate all historic anchors', 'Investigate core protocol failure']
      }
    };
    
    return {
      property: property,
      network_id: network_id,
      ...consequences[property],
      mapped_at: new Date().toISOString()
    };
  }
  
  // =========================================================================
  // Assessment Collection
  // =========================================================================
  
  /**
   * Start active measurement session
   */
  startMeasurementSession(property, duration_ms = this.measurement_window) {
    this.current_session = {
      start_time: Date.now(),
      end_time: Date.now() + duration_ms,
      status: 'active',
      measurements_collected: 0,
      properties_tested: [property],
      property: property
    };
    
    this.emit('session:start', this.current_session);
    return this.current_session;
  }
  
  /**
   * Record a measurement during active session
   */
  recordMeasurement(measurement) {
    if (this.current_session.status !== 'active') {
      return { recorded: false, reason: 'No active session' };
    }
    
    const record = {
      timestamp: Date.now(),
      property: this.current_session.property,
      ...measurement
    };
    
    this.measurements.push(record);
    this.current_session.measurements_collected++;
    
    this.emit('measurement:recorded', record);
    
    return { recorded: true, count: this.measurements.length };
  }
  
  /**
   * Finish active session and prepare claim data
   */
  finalizeMeasurementSession() {
    if (this.current_session.status !== 'active') {
      return { finalized: false, reason: 'No active session' };
    }
    
    this.current_session.end_time = Date.now();
    this.current_session.status = 'finalized';
    
    const session_data = {
      ...this.current_session,
      measurements: this.measurements,
      summary: this._generateMeasurementSummary()
    };
    
    this.emit('session:finalized', session_data);
    
    return { finalized: true, session_data: session_data };
  }
  
  _generateMeasurementSummary() {
    if (this.measurements.length === 0) {
      return { no_data: true };
    }
    
    const successful = this.measurements.filter(m => m.success === true).length;
    const success_rate = (successful / this.measurements.length) * 100;
    
    const response_times = this.measurements
      .filter(m => m.response_time !== undefined)
      .map(m => m.response_time);
    
    return {
      total_measurements: this.measurements.length,
      successful_measurements: successful,
      success_rate: success_rate.toFixed(2) + '%',
      avg_response_time: response_times.length > 0 
        ? (response_times.reduce((a, b) => a + b, 0) / response_times.length).toFixed(0) + 'ms'
        : 'N/A',
      min_response_time: response_times.length > 0 
        ? Math.min(...response_times) + 'ms'
        : 'N/A',
      max_response_time: response_times.length > 0 
        ? Math.max(...response_times) + 'ms'
        : 'N/A'
    };
  }
  
  // =========================================================================
  // Assessment Report Generation
  // =========================================================================
  
  /**
   * Generate formal assessment report
   */
  generateAssessmentReport(claim_id, session_data, replication_results = []) {
    return {
      report_id: `report-${claim_id}-${Date.now()}`,
      claim_id: claim_id,
      network_id: this.network_id,
      generated_at: new Date().toISOString(),
      
      measurement_session: {
        duration_hours: ((session_data.end_time - session_data.start_time) / 3600000).toFixed(2),
        measurements_collected: session_data.measurements_collected,
        ...session_data.summary
      },
      
      replications: {
        count: replication_results.length,
        required: this.replication_required,
        results: replication_results,
        all_passed: replication_results.every(r => r.replicated === true),
        average_confidence: replication_results.length > 0
          ? (replication_results.reduce((sum, r) => sum + r.confidence, 0) / replication_results.length).toFixed(0) + '%'
          : 'N/A'
      },
      
      status: replication_results.length >= this.replication_required && replication_results.every(r => r.replicated === true)
        ? 'APPROVED'
        : replication_results.length >= this.replication_required
          ? 'REJECTED'
          : 'PENDING_REPLICATION'
    };
  }
  
  // =========================================================================
  // Getter Methods
  // =========================================================================
  
  getMeasurementCount() {
    return this.measurements.length;
  }
  
  getSessionStatus() {
    return this.current_session.status;
  }
  
  getNetworkConfig() {
    return {
      network_id: this.network_id,
      network_name: this.network_name,
      chain_id: this.chain_id,
      rpc_url: this.rpc_url
    };
  }
}

// Export for testing
export default NetworkAssessmentProtocol;
