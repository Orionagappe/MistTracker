/**
 * PHASE 6: Network Assessment Validators
 * 
 * Manages validator certification for blockchain network assessment
 * Reputation system identical to other domains
 */

import { EventEmitter } from 'events';

export class NetworkAssessmentValidator extends EventEmitter {
  constructor(validator_id, name, options = {}) {
    super();
    
    this.validator_id = validator_id;
    this.name = name;
    this.specialization = 'network-assessment';
    
    // Credentials
    this.certification = {
      status: 'uncertified', // uncertified, certified, expert
      issued_date: null,
      modules_completed: [],
      hands_on_project_status: 'not_started',
      competency_exam_passed: false
    };
    
    // Reputation
    this.reputation = {
      current_score: 50, // Starts at 50/100
      history: [],
      correct_assessments: 0,
      incorrect_assessments: 0,
      assessment_count: 0
    };
    
    // Emotional Maturity (same as other validators)
    this.emotional_metrics = {
      clarity: options.clarity || 0,         // Understanding deep enough to teach
      integrity: options.integrity || 0,     // Actions aligned with values
      courage: options.courage || 0,         // Hold rigorous decisions under pressure
      humility: options.humility || 0       // Acknowledge fallibility
    };
    
    // Assessment History
    this.assessments = [];
    this.replications = [];
  }
  
  // =========================================================================
  // Certification Path
  // =========================================================================
  
  /**
   * Complete training module
   */
  completeModule(module_name, passed = true) {
    if (passed) {
      this.certification.modules_completed.push({
        module: module_name,
        completed_date: new Date().toISOString()
      });
      
      this.emit('module:completed', { validator: this.validator_id, module: module_name });
      return { success: true, modules_done: this.certification.modules_completed.length };
    }
    
    return { success: false, reason: 'Module assessment failed' };
  }
  
  /**
   * Check if prerequisites met for certification
   */
  isReadyForCertification() {
    const required_modules = [
      'Cryptographic Basics',
      'Network Measurement Design',
      'Blockchain-Specific Validation',
      'Long-term Monitoring',
      'Case Studies',
      'Hands-on Project'
    ];
    
    const completed_module_names = this.certification.modules_completed
      .map(m => m.module);
    
    const all_modules_complete = required_modules.every(m => 
      completed_module_names.includes(m)
    );
    
    const project_complete = this.certification.hands_on_project_status === 'approved';
    const exam_passed = this.certification.competency_exam_passed;
    
    return {
      ready: all_modules_complete && project_complete && exam_passed,
      modules_complete: all_modules_complete,
      project_complete: project_complete,
      exam_passed: exam_passed,
      missing: required_modules.filter(m => !completed_module_names.includes(m))
    };
  }
  
  /**
   * Issue certification (by authority)
   */
  issueCertification() {
    const readiness = this.isReadyForCertification();
    
    if (!readiness.ready) {
      return { certified: false, reason: 'Requirements not met', readiness };
    }
    
    this.certification.status = 'certified';
    this.certification.issued_date = new Date().toISOString();
    this.reputation.current_score = 60; // Start reputation at 60 when certified
    
    this.emit('certification:issued', {
      validator: this.validator_id,
      issued_date: this.certification.issued_date
    });
    
    return { certified: true, status: 'certified', issued_date: this.certification.issued_date };
  }
  
  /**
   * Promote to expert (after successful assessments)
   */
  promoteToExpert(approved_by_authority) {
    if (this.certification.status !== 'certified') {
      return { promoted: false, reason: 'Must be certified first' };
    }
    
    if (this.reputation.correct_assessments < 5) {
      return { promoted: false, reason: 'Need at least 5 correct assessments' };
    }
    
    if (this.reputation.current_score < 80) {
      return { promoted: false, reason: 'Reputation must be ≥80/100' };
    }
    
    this.certification.status = 'expert';
    this.emit('status:expert', { validator: this.validator_id });
    
    return { promoted: true, new_status: 'expert' };
  }
  
  // =========================================================================
  // Assessment Recording
  // =========================================================================
  
  /**
   * Record assessment of a network claim
   */
  recordAssessment(claim_id, network_id, verdict, reasoning = '') {
    if (this.certification.status === 'uncertified') {
      return { recorded: false, reason: 'Not certified for network assessment' };
    }
    
    const assessment = {
      assessment_id: `assess-${this.validator_id}-${claim_id}`,
      timestamp: new Date().toISOString(),
      claim_id: claim_id,
      network_id: network_id,
      validator_id: this.validator_id,
      verdict: verdict, // 'approved', 'rejected', 'pending_replication'
      reasoning: reasoning,
      emotional_state: { ...this.emotional_metrics }
    };
    
    this.assessments.push(assessment);
    this.reputation.assessment_count++;
    
    this.emit('assessment:recorded', assessment);
    return { recorded: true, assessment_id: assessment.assessment_id };
  }
  
  /**
   * Record replication attempt
   */
  recordReplication(original_claim_id, replication_result, notes = '') {
    const replication = {
      replication_id: `rep-${this.validator_id}-${original_claim_id}`,
      timestamp: new Date().toISOString(),
      original_claim_id: original_claim_id,
      validator_id: this.validator_id,
      replicated: replication_result.replicated,
      confidence: replication_result.confidence,
      deviation: replication_result.deviation || null,
      notes: notes
    };
    
    this.replications.push(replication);
    
    this.emit('replication:recorded', replication);
    return { recorded: true, replication_id: replication.replication_id };
  }
  
  // =========================================================================
  // Reputation System
  // =========================================================================
  
  /**
   * Update reputation based on assessment outcome
   * Identical system to atomic/psionics/emotion validators
   */
  updateReputation(assessment_outcome, emotional_multiplier = 1.0) {
    let reputation_delta = 0;
    
    if (assessment_outcome === 'correct') {
      // +20 for correct assessment
      reputation_delta = 20;
      this.reputation.correct_assessments++;
    } else if (assessment_outcome === 'incorrect') {
      // -50 for incorrect assessment
      reputation_delta = -50;
      this.reputation.incorrect_assessments++;
    } else if (assessment_outcome === 'honest_failure') {
      // +10 for honest attempt that didn't replicate
      reputation_delta = 10;
    } else if (assessment_outcome === 'fraud') {
      // -100 for deliberate fraud (instant ejection)
      reputation_delta = -100;
    }
    
    // Apply emotional multiplier
    reputation_delta = Math.round(reputation_delta * emotional_multiplier);
    
    // Update score
    const old_score = this.reputation.current_score;
    this.reputation.current_score = Math.max(0, Math.min(100, 
      this.reputation.current_score + reputation_delta
    ));
    
    // Record change
    this.reputation.history.push({
      timestamp: new Date().toISOString(),
      change: reputation_delta,
      reason: assessment_outcome,
      old_score: old_score,
      new_score: this.reputation.current_score
    });
    
    // Emit event
    this.emit('reputation:updated', {
      validator: this.validator_id,
      change: reputation_delta,
      new_score: this.reputation.current_score
    });
    
    // Check ejection threshold
    if (this.reputation.current_score < 25) {
      this.ejectValidator('Reputation fell below 25%');
      return {
        updated: true,
        new_score: this.reputation.current_score,
        ejected: true
      };
    }
    
    return {
      updated: true,
      old_score: old_score,
      new_score: this.reputation.current_score,
      delta: reputation_delta
    };
  }
  
  /**
   * Calculate emotional multiplier from emotional metrics
   * Formula: Clarity × Integrity × (Courage + Humility) / 100
   */
  getEmotionalMultiplier() {
    const c = (this.emotional_metrics.clarity || 0) / 100;
    const i = (this.emotional_metrics.integrity || 0) / 100;
    const co = (this.emotional_metrics.courage || 0) / 100;
    const h = (this.emotional_metrics.humility || 0) / 100;
    
    const multiplier = c * i * ((co + h) / 2);
    return Math.max(0.1, Math.min(1.5, multiplier)); // Clamp 0.1-1.5
  }
  
  /**
   * Eject validator (irreversible)
   */
  ejectValidator(reason = 'Unknown') {
    this.certification.status = 'ejected';
    this.certification.ejection_date = new Date().toISOString();
    this.certification.ejection_reason = reason;
    
    this.emit('validator:ejected', {
      validator: this.validator_id,
      reason: reason
    });
    
    return { ejected: true, reason: reason };
  }
  
  // =========================================================================
  // Emotional Metrics Development
  // =========================================================================
  
  /**
   * Record emotional growth event
   */
  recordEmotionalGrowth(emotion, event_description, delta = 5) {
    if (!this.emotional_metrics.hasOwnProperty(emotion)) {
      return { recorded: false, reason: 'Invalid emotion' };
    }
    
    const old_value = this.emotional_metrics[emotion];
    this.emotional_metrics[emotion] = Math.min(100, old_value + delta);
    
    this.emit('emotional:growth', {
      validator: this.validator_id,
      emotion: emotion,
      old_value: old_value,
      new_value: this.emotional_metrics[emotion],
      event: event_description
    });
    
    return {
      recorded: true,
      emotion: emotion,
      new_value: this.emotional_metrics[emotion]
    };
  }
  
  // =========================================================================
  // Reporting
  // =========================================================================
  
  /**
   * Generate validator assessment report
   */
  getValidatorReport() {
    return {
      validator_id: this.validator_id,
      name: this.name,
      specialization: this.specialization,
      
      certification: this.certification,
      
      reputation: {
        current_score: this.reputation.current_score,
        assessment_count: this.reputation.assessment_count,
        correct_assessments: this.reputation.correct_assessments,
        incorrect_assessments: this.reputation.incorrect_assessments,
        accuracy: this.reputation.assessment_count > 0 
          ? (this.reputation.correct_assessments / this.reputation.assessment_count * 100).toFixed(1) + '%'
          : 'N/A'
      },
      
      emotional_metrics: this.emotional_metrics,
      emotional_multiplier: this.getEmotionalMultiplier().toFixed(2),
      
      assessments_count: this.assessments.length,
      replications_count: this.replications.length
    };
  }
  
  /**
   * Get assessment history
   */
  getAssessmentHistory(limit = 10) {
    return this.assessments.slice(-limit).reverse();
  }
  
  /**
   * Get replication history
   */
  getReplicationHistory(limit = 10) {
    return this.replications.slice(-limit).reverse();
  }
}

// ============================================================================
// Network Assessment Validator Council
// ============================================================================

export class NetworkAssessmentCouncil extends EventEmitter {
  constructor(laughing_einstein_authority) {
    super();
    
    this.laughing_einstein = laughing_einstein_authority;
    this.validators = new Map();
    this.certifications_pending = [];
    this.network_reputations = new Map(); // Network ID → reputation score
  }
  
  /**
   * Register new validator candidate
   */
  registerValidator(validator_id, name, options = {}) {
    if (this.validators.has(validator_id)) {
      return { registered: false, reason: 'Validator already exists' };
    }
    
    const validator = new NetworkAssessmentValidator(validator_id, name, options);
    this.validators.set(validator_id, validator);
    
    this.emit('validator:registered', { validator_id, name });
    return { registered: true, validator_id };
  }
  
  /**
   * Process certification request
   */
  certifyValidator(validator_id) {
    const validator = this.validators.get(validator_id);
    if (!validator) {
      return { certified: false, reason: 'Validator not found' };
    }
    
    const readiness = validator.isReadyForCertification();
    if (!readiness.ready) {
      return { certified: false, readiness };
    }
    
    const result = validator.issueCertification();
    this.emit('validator:certified', { validator_id, date: result.issued_date });
    
    return result;
  }
  
  /**
   * Record network assessment outcome
   */
  recordAssessmentOutcome(validator_id, claim_id, network_id, assessment_outcome) {
    const validator = this.validators.get(validator_id);
    if (!validator) {
      return { recorded: false, reason: 'Validator not found' };
    }
    
    // Update validator reputation
    const emotional_multiplier = validator.getEmotionalMultiplier();
    const reputation_update = validator.updateReputation(assessment_outcome, emotional_multiplier);
    
    // Update network reputation if assessment was correct
    if (assessment_outcome === 'correct') {
      this._updateNetworkReputation(network_id, +5);
    } else if (assessment_outcome === 'incorrect') {
      this._updateNetworkReputation(network_id, -3);
    }
    
    this.emit('assessment:outcome', {
      validator_id,
      claim_id,
      network_id,
      outcome: assessment_outcome,
      new_validator_reputation: reputation_update.new_score
    });
    
    return { recorded: true, ...reputation_update };
  }
  
  /**
   * Update network reputation score
   */
  _updateNetworkReputation(network_id, delta) {
    const current = this.network_reputations.get(network_id) || 75; // Start at 75
    const new_score = Math.max(0, Math.min(100, current + delta));
    this.network_reputations.set(network_id, new_score);
    return new_score;
  }
  
  /**
   * Get network reputation score
   */
  getNetworkReputation(network_id) {
    return this.network_reputations.get(network_id) || 75;
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
  
  /**
   * Get council report
   */
  getCouncilReport() {
    return {
      total_validators: this.validators.size,
      certified_validators: Array.from(this.validators.values())
        .filter(v => v.certification.status !== 'uncertified').length,
      network_reputations: Object.fromEntries(this.network_reputations),
      validators: Array.from(this.validators.values()).map(v => v.getValidatorReport())
    };
  }
}

export default { NetworkAssessmentValidator, NetworkAssessmentCouncil };
