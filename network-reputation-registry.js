/**
 * PHASE 6: Network Reputation Registry
 * 
 * Persistent storage for network assessments and reputation scores
 * Maintains immutable audit trail of all network evaluations
 */

export class NetworkReputationRegistry {
  constructor() {
    this.networks = new Map(); // network_id → network data
    this.assessments = new Map(); // claim_id → assessment data
    this.validators = new Map(); // validator_id → validator data
    this.reputation_history = []; // Immutable audit trail
    this.last_updated = null;
  }
  
  // =========================================================================
  // Network Registration
  // =========================================================================
  
  /**
   * Register a new network in the registry
   */
  registerNetwork(network_id, network_info) {
    if (this.networks.has(network_id)) {
      return { registered: false, reason: 'Network already registered' };
    }
    
    const network = {
      network_id: network_id,
      name: network_info.name || network_id,
      chain_id: network_info.chain_id || null,
      rpc_url: network_info.rpc_url || null,
      
      reputation: {
        current_score: 75, // Start at 75/100
        assessment_count: 0,
        last_updated: new Date().toISOString()
      },
      
      properties_assessed: {}, // property → assessment data
      
      registered_date: new Date().toISOString(),
      last_assessment_date: null,
      assessment_history: []
    };
    
    this.networks.set(network_id, network);
    this._recordAuditEvent('network:registered', { network_id });
    
    return { registered: true, network_id };
  }
  
  /**
   * Get network by ID
   */
  getNetwork(network_id) {
    return this.networks.get(network_id);
  }
  
  /**
   * Get all networks
   */
  getAllNetworks() {
    return Array.from(this.networks.values());
  }
  
  /**
   * Get network reputation score
   */
  getNetworkReputation(network_id) {
    const network = this.networks.get(network_id);
    if (!network) {
      return null;
    }
    return network.reputation.current_score;
  }
  
  // =========================================================================
  // Assessment Recording
  // =========================================================================
  
  /**
   * Register a network assessment claim
   */
  registerAssessment(claim_id, network_id, property, claim_data) {
    const assessment = {
      claim_id: claim_id,
      network_id: network_id,
      property: property,
      
      status: 'pending', // pending, approved, rejected
      
      claim_details: {
        assertion: claim_data.assertion,
        confidence: claim_data.confidence,
        measurement_period: claim_data.measurement_period,
        validator_group: claim_data.validator_group
      },
      
      validators_assigned: [],
      replications: [],
      
      registered_date: new Date().toISOString(),
      completion_date: null
    };
    
    this.assessments.set(claim_id, assessment);
    this._recordAuditEvent('assessment:registered', { claim_id, network_id, property });
    
    return { registered: true, claim_id };
  }
  
  /**
   * Assign validator to assessment
   */
  assignValidator(claim_id, validator_id) {
    const assessment = this.assessments.get(claim_id);
    if (!assessment) {
      return { assigned: false, reason: 'Assessment not found' };
    }
    
    if (!assessment.validators_assigned.includes(validator_id)) {
      assessment.validators_assigned.push(validator_id);
      this._recordAuditEvent('validator:assigned', { claim_id, validator_id });
    }
    
    return { assigned: true, validators_count: assessment.validators_assigned.length };
  }
  
  /**
   * Record validator assessment result
   */
  recordValidatorAssessment(claim_id, validator_id, verdict, reasoning = '') {
    const assessment = this.assessments.get(claim_id);
    if (!assessment) {
      return { recorded: false, reason: 'Assessment not found' };
    }
    
    assessment.validator_verdicts = assessment.validator_verdicts || [];
    
    const verdict_record = {
      validator_id: validator_id,
      verdict: verdict, // 'approved', 'rejected', 'pending'
      reasoning: reasoning,
      timestamp: new Date().toISOString()
    };
    
    assessment.validator_verdicts.push(verdict_record);
    this._recordAuditEvent('validator:verdict', { claim_id, validator_id, verdict });
    
    return { recorded: true, verdicts_count: assessment.validator_verdicts.length };
  }
  
  /**
   * Record replication result
   */
  recordReplication(claim_id, validator_id, replication_result) {
    const assessment = this.assessments.get(claim_id);
    if (!assessment) {
      return { recorded: false, reason: 'Assessment not found' };
    }
    
    const replication = {
      replication_id: `rep-${claim_id}-${validator_id}`,
      validator_id: validator_id,
      replicated: replication_result.replicated,
      confidence: replication_result.confidence,
      deviation: replication_result.deviation || null,
      timestamp: new Date().toISOString()
    };
    
    assessment.replications.push(replication);
    this._recordAuditEvent('replication:recorded', { claim_id, validator_id, replicated: replication_result.replicated });
    
    return { recorded: true, replication_id: replication.replication_id };
  }
  
  /**
   * Finalize assessment (approve or reject)
   */
  finalizeAssessment(claim_id, final_status, network_impact) {
    const assessment = this.assessments.get(claim_id);
    if (!assessment) {
      return { finalized: false, reason: 'Assessment not found' };
    }
    
    assessment.status = final_status; // 'approved' or 'rejected'
    assessment.completion_date = new Date().toISOString();
    assessment.network_impact = network_impact; // How this affects network reputation
    
    // Update network reputation
    const network = this.networks.get(assessment.network_id);
    if (network) {
      if (final_status === 'approved') {
        network.reputation.current_score = Math.min(100, 
          network.reputation.current_score + network_impact);
      } else if (final_status === 'rejected') {
        network.reputation.current_score = Math.max(0, 
          network.reputation.current_score - Math.abs(network_impact));
      }
      
      network.reputation.assessment_count++;
      network.reputation.last_updated = new Date().toISOString();
      network.last_assessment_date = new Date().toISOString();
      network.assessment_history.push({
        claim_id: claim_id,
        status: final_status,
        impact: network_impact,
        timestamp: assessment.completion_date
      });
    }
    
    this._recordAuditEvent('assessment:finalized', {
      claim_id,
      status: final_status,
      network_id: assessment.network_id
    });
    
    return { finalized: true, new_network_reputation: network?.reputation.current_score };
  }
  
  /**
   * Get assessment by claim ID
   */
  getAssessment(claim_id) {
    return this.assessments.get(claim_id);
  }
  
  /**
   * Get all assessments for a network
   */
  getNetworkAssessments(network_id) {
    return Array.from(this.assessments.values())
      .filter(a => a.network_id === network_id);
  }
  
  // =========================================================================
  // Validator Registry
  // =========================================================================
  
  /**
   * Register validator in network assessment domain
   */
  registerValidator(validator_id, validator_info) {
    if (this.validators.has(validator_id)) {
      return { registered: false, reason: 'Validator already registered' };
    }
    
    const validator = {
      validator_id: validator_id,
      name: validator_info.name || validator_id,
      specialization: 'network-assessment',
      
      certification: {
        status: 'uncertified',
        issued_date: null,
        revoked: false
      },
      
      reputation: {
        current_score: 50,
        assessment_count: 0,
        correct_assessments: 0,
        incorrect_assessments: 0,
        accuracy: 'N/A'
      },
      
      registered_date: new Date().toISOString(),
      assessments: []
    };
    
    this.validators.set(validator_id, validator);
    this._recordAuditEvent('validator:registered', { validator_id });
    
    return { registered: true, validator_id };
  }
  
  /**
   * Record validator certification
   */
  certifyValidator(validator_id) {
    const validator = this.validators.get(validator_id);
    if (!validator) {
      return { certified: false, reason: 'Validator not found' };
    }
    
    validator.certification.status = 'certified';
    validator.certification.issued_date = new Date().toISOString();
    validator.reputation.current_score = 60; // Reset to 60 on certification
    
    this._recordAuditEvent('validator:certified', { validator_id });
    
    return { certified: true, issued_date: validator.certification.issued_date };
  }
  
  /**
   * Record validator assessment outcome
   */
  recordValidatorOutcome(validator_id, claim_id, outcome) {
    const validator = this.validators.get(validator_id);
    if (!validator) {
      return { recorded: false, reason: 'Validator not found' };
    }
    
    let reputation_delta = 0;
    
    if (outcome === 'correct') {
      reputation_delta = 20;
      validator.reputation.correct_assessments++;
    } else if (outcome === 'incorrect') {
      reputation_delta = -50;
      validator.reputation.incorrect_assessments++;
    } else if (outcome === 'honest_failure') {
      reputation_delta = 10;
    }
    
    validator.reputation.assessment_count++;
    validator.reputation.current_score = Math.max(0, Math.min(100, 
      validator.reputation.current_score + reputation_delta
    ));
    
    if (validator.reputation.assessment_count > 0) {
      validator.reputation.accuracy = (
        (validator.reputation.correct_assessments / validator.reputation.assessment_count) * 100
      ).toFixed(1) + '%';
    }
    
    validator.assessments.push({
      claim_id: claim_id,
      outcome: outcome,
      delta: reputation_delta,
      new_score: validator.reputation.current_score,
      timestamp: new Date().toISOString()
    });
    
    this._recordAuditEvent('validator:outcome', {
      validator_id,
      claim_id,
      outcome,
      delta: reputation_delta
    });
    
    return { recorded: true, new_score: validator.reputation.current_score };
  }
  
  /**
   * Get validator
   */
  getValidator(validator_id) {
    return this.validators.get(validator_id);
  }
  
  /**
   * Get all validators
   */
  getAllValidators() {
    return Array.from(this.validators.values());
  }
  
  // =========================================================================
  // Audit Trail
  // =========================================================================
  
  /**
   * Record immutable audit event
   */
  _recordAuditEvent(event_type, event_data) {
    const audit_entry = {
      timestamp: new Date().toISOString(),
      event_type: event_type,
      event_data: event_data
    };
    
    this.reputation_history.push(audit_entry);
    this.last_updated = audit_entry.timestamp;
  }
  
  /**
   * Get audit trail
   */
  getAuditTrail(limit = 100) {
    return this.reputation_history.slice(-limit).reverse();
  }
  
  /**
   * Get audit trail for specific network
   */
  getNetworkAuditTrail(network_id, limit = 50) {
    return this.reputation_history
      .filter(entry => entry.event_data.network_id === network_id)
      .slice(-limit)
      .reverse();
  }
  
  // =========================================================================
  // Reporting
  // =========================================================================
  
  /**
   * Generate registry report
   */
  generateRegistryReport() {
    const networks = Array.from(this.networks.values());
    const validators = Array.from(this.validators.values());
    
    return {
      generated_at: new Date().toISOString(),
      last_updated: this.last_updated,
      
      networks: {
        total: networks.length,
        by_reputation: networks.sort((a, b) => 
          b.reputation.current_score - a.reputation.current_score
        ).map(n => ({
          network_id: n.network_id,
          reputation: n.reputation.current_score,
          assessment_count: n.reputation.assessment_count,
          last_assessment: n.last_assessment_date
        }))
      },
      
      validators: {
        total: validators.length,
        certified: validators.filter(v => v.certification.status === 'certified').length,
        by_reputation: validators.sort((a, b) =>
          b.reputation.current_score - a.reputation.current_score
        ).map(v => ({
          validator_id: v.validator_id,
          reputation: v.reputation.current_score,
          accuracy: v.reputation.accuracy,
          assessment_count: v.reputation.assessment_count
        }))
      },
      
      assessments: {
        total: this.assessments.size,
        by_status: {
          approved: Array.from(this.assessments.values()).filter(a => a.status === 'approved').length,
          rejected: Array.from(this.assessments.values()).filter(a => a.status === 'rejected').length,
          pending: Array.from(this.assessments.values()).filter(a => a.status === 'pending').length
        }
      }
    };
  }
  
  /**
   * Export registry for backup/verification
   */
  exportRegistry() {
    return {
      networks: Array.from(this.networks.values()),
      assessments: Array.from(this.assessments.values()),
      validators: Array.from(this.validators.values()),
      audit_trail: this.reputation_history,
      exported_at: new Date().toISOString()
    };
  }
}

export default NetworkReputationRegistry;
