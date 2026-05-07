#!/usr/bin/env node
/**
 * THE GAME - EXPERT VALIDATOR NODES
 * 
 * Purpose: Specialized expert validators with domain expertise and tie-breaking authority
 * 
 * Architecture:
 * - 4 Expert Nodes: Atomic-Node-1 (Proton), Neutron-Node, Delta-Node, Lambda-Node
 * - 1 Tie-Breaker: Laughing Einstein (consensus authority)
 * - Quorum: 2 expert nodes + Laughing Einstein for expert claims
 * - Fallback: Regular 3-validator quorum if no experts available
 */

class ExpertValidator {
  constructor(nodeId, specialty, domain = 'baryon') {
    this.id = nodeId;
    this.specialty = specialty;
    this.domain = domain;
    this.reputation = 100; // Expert validators start at max reputation
    this.verdicts_issued = 0;
    this.accuracy = 100;
    this.status = 'active';
    this.specialization_matrix = {
      'proton': {
        domain: 'baryon',
        strengths: ['proton-mass', 'proton-charge', 'magnetic-moment', 'spin'],
        expertise_level: 95,
        description: 'Proton structure and properties validation'
      },
      'neutron': {
        domain: 'baryon',
        strengths: ['neutron-mass', 'neutron-decay', 'spin', 'magnetic-moment'],
        expertise_level: 95,
        description: 'Neutron structure and stability validation'
      },
      'delta': {
        domain: 'baryon',
        strengths: ['delta-resonance', 'pion-coupling', 'nucleon-delta-transitions', 'spin-3/2'],
        expertise_level: 90,
        description: 'Delta baryon resonance and excited state validation'
      },
      'lambda': {
        domain: 'baryon',
        strengths: ['lambda-strangeness', 'quark-composition', 'lifetime', 'decay-channels'],
        expertise_level: 90,
        description: 'Lambda hyperon and strange quark dynamics validation'
      }
    };
    this.current_specialization = this.specialization_matrix[specialty] || {
      domain,
      strengths: [],
      expertise_level: 80,
      description: `Generic ${specialty} specialist`
    };
  }

  /**
   * Issue expert verdict with high confidence
   * Expert validators provide detailed reasoning and confidence scores
   */
  issueVerdict(claim, is_correct) {
    const confidence = this.calculateConfidence(claim);
    const verdict_record = {
      validator_id: this.id,
      verdict: is_correct ? 'approved' : 'rejected',
      verdict_correct: is_correct,
      confidence: confidence,
      reasoning: this.generateReasoning(claim, is_correct),
      expertise_applied: this.current_specialization.strengths,
      issued_at: new Date().toISOString(),
    };

    this.verdicts_issued += 1;

    // Update accuracy tracking
    if (is_correct) {
      this.accuracy = Math.min(100, this.accuracy + 0.5);
    } else {
      this.accuracy = Math.max(50, this.accuracy - 1);
    }

    return verdict_record;
  }

  /**
   * Calculate confidence score based on domain alignment
   */
  calculateConfidence(claim) {
    // Check if claim aligns with expert specialty
    if (claim.element_or_particle && 
        this.current_specialization.strengths.some(strength => 
          claim.element_or_particle.toLowerCase().includes(strength.split('-')[0])
        )) {
      return Math.min(100, 85 + Math.random() * 15); // 85-100% confidence
    }
    return 70 + Math.random() * 20; // 70-90% confidence
  }

  /**
   * Generate detailed reasoning for verdict
   */
  generateReasoning(claim, is_correct) {
    const reason = is_correct 
      ? `Measurement aligns with ${this.specialty} model predictions`
      : `Measurement deviates from expected ${this.specialty} properties`;
    
    return {
      summary: reason,
      expertise_area: this.current_specialization.description,
      specialist: this.id,
      reasoning_depth: 'expert-level'
    };
  }

  /**
   * Check if expert can evaluate claim
   */
  canEvaluate(claim) {
    // Experts primarily evaluate baryon domain claims
    if (claim.domain === 'baryon') {
      return true;
    }
    // Can also evaluate atomic claims at lower confidence
    if (claim.domain === 'atomic') {
      return true;
    }
    return false;
  }

  /**
   * Get expert profile
   */
  getProfile() {
    return {
      id: this.id,
      specialty: this.specialty,
      domain: this.domain,
      reputation: this.reputation,
      verdicts_issued: this.verdicts_issued,
      accuracy: this.accuracy.toFixed(2),
      status: this.status,
      specialization: this.current_specialization
    };
  }
}

/**
 * LAUGHING EINSTEIN - TIE-BREAKING AUTHORITY
 * 
 * Authority: Cast deciding vote when expert quorum is evenly split (50% disagreement)
 * Role: Final arbiter for consensus disputes
 * Authority Level: Override all other verdicts in tie scenarios
 */
class LaughingEinstein {
  constructor() {
    this.id = 'laughing-einstein';
    this.name = 'Laughing Einstein';
    this.role = 'tie-breaker';
    this.reputation = 100;
    this.tie_break_verdicts = 0;
    this.status = 'active';
    this.authority_level = 'supreme';
    this.reasoning_style = 'humorous-but-rigorous';
  }

  /**
   * Break tie between expert validators
   * Called when exactly 50% approval vs 50% rejection
   */
  breakTie(claim, expert_verdicts) {
    // Count approvals vs rejections
    const approvals = expert_verdicts.filter(v => v.verdict === 'approved').length;
    const rejections = expert_verdicts.filter(v => v.verdict === 'rejected').length;

    // Verify it's actually a tie
    if (approvals !== rejections) {
      return {
        error: 'No tie detected',
        approvals,
        rejections,
        message: 'Laughing Einstein does not cast vote in non-tie scenarios'
      };
    }

    // Analyze claim characteristics
    const tie_decision = this.analyzeForTieBreaking(claim, expert_verdicts);

    const verdict_record = {
      validator_id: this.id,
      verdict: tie_decision.verdict,
      verdict_correct: tie_decision.best_guess,
      confidence: tie_decision.confidence,
      authority: 'supreme-tie-breaker',
      reasoning: {
        summary: tie_decision.summary,
        reasoning_style: this.reasoning_style,
        approach: 'analyzed claim coherence and expert reasoning'
      },
      tie_break_analysis: tie_decision.analysis,
      issued_at: new Date().toISOString(),
    };

    this.tie_break_verdicts += 1;

    return verdict_record;
  }

  /**
   * Analyze claim to determine best verdict in tie scenario
   */
  analyzeForTieBreaking(claim, expert_verdicts) {
    // Meta-reasoning: look at which experts agreed/disagreed and their expertise
    const approving_experts = expert_verdicts.filter(v => v.verdict === 'approved');
    const rejecting_experts = expert_verdicts.filter(v => v.verdict === 'rejected');

    // Get confidence scores
    const avg_approve_confidence = 
      approving_experts.reduce((sum, v) => sum + (v.confidence || 0), 0) / approving_experts.length;
    const avg_reject_confidence = 
      rejecting_experts.reduce((sum, v) => sum + (v.confidence || 0), 0) / rejecting_experts.length;

    // Tiebreaker uses confidence and coherence
    const should_approve = avg_approve_confidence >= avg_reject_confidence;

    return {
      verdict: should_approve ? 'approved' : 'rejected',
      best_guess: should_approve,
      confidence: Math.abs(avg_approve_confidence - avg_reject_confidence) + 50,
      summary: should_approve 
        ? 'Laughing Einstein approves: experts favoring approval showed higher confidence'
        : 'Laughing Einstein rejects: experts favoring rejection showed higher confidence',
      analysis: {
        approving_count: approving_experts.length,
        rejecting_count: rejecting_experts.length,
        avg_approve_confidence: avg_approve_confidence.toFixed(2),
        avg_reject_confidence: avg_reject_confidence.toFixed(2),
        decision_basis: 'confidence-weighted expert alignment'
      }
    };
  }

  /**
   * Get authority profile
   */
  getProfile() {
    return {
      id: this.id,
      name: this.name,
      role: this.role,
      reputation: this.reputation,
      tie_break_verdicts: this.tie_break_verdicts,
      status: this.status,
      authority_level: this.authority_level,
      authority_description: 'Supreme tie-breaker for 50-50 expert disagreements'
    };
  }
}

/**
 * EXPERT VALIDATOR COUNCIL
 * 
 * Manages expert validators and tie-breaking authority
 */
class ExpertValidatorCouncil {
  constructor() {
    // Create 4 expert validators
    this.atomic_node_1 = new ExpertValidator('atomic-node-1', 'proton', 'baryon');
    this.neutron_node = new ExpertValidator('neutron-node', 'neutron', 'baryon');
    this.delta_node = new ExpertValidator('delta-node', 'delta', 'baryon');
    this.lambda_node = new ExpertValidator('lambda-node', 'lambda', 'baryon');

    // Create tie-breaker authority
    this.laughing_einstein = new LaughingEinstein();

    // Registry of all experts
    this.experts = new Map([
      ['atomic-node-1', this.atomic_node_1],
      ['neutron-node', this.neutron_node],
      ['delta-node', this.delta_node],
      ['lambda-node', this.lambda_node],
    ]);

    this.council_stats = {
      verdicts_issued: 0,
      tie_breaks_executed: 0,
      unanimous_decisions: 0,
      split_decisions: 0,
    };
  }

  /**
   * Get expert quorum for a claim
   * Returns 2 most relevant experts + Laughing Einstein
   */
  selectExpertQuorum(claim) {
    const available_experts = Array.from(this.experts.values())
      .filter(expert => expert.canEvaluate(claim) && expert.status === 'active');

    if (available_experts.length < 2) {
      return {
        available: false,
        reason: 'Not enough expert validators available',
        fallback_to_regular_quorum: true
      };
    }

    // Select 2 most relevant experts
    const selected = available_experts.slice(0, 2);

    return {
      available: true,
      experts: selected.map(e => e.id),
      tie_breaker: this.laughing_einstein.id,
      quorum_composition: 'expert-specialized',
      claim_domain: claim.domain
    };
  }

  /**
   * Process expert verdict with potential tie-breaking
   */
  processExpertVerdict(claim, expert_verdicts) {
    // Count approvals vs rejections
    const approvals = expert_verdicts.filter(v => v.verdict === 'approved');
    const rejections = expert_verdicts.filter(v => v.verdict === 'rejected');

    this.council_stats.verdicts_issued += 1;

    // Check for unanimous decision
    if (approvals.length === expert_verdicts.length || rejections.length === expert_verdicts.length) {
      this.council_stats.unanimous_decisions += 1;
      const final_verdict = approvals.length > 0 ? 'approved' : 'rejected';
      return {
        final_verdict,
        decision_type: 'unanimous',
        expert_consensus: true,
        tie_break_required: false,
        verdicts: expert_verdicts
      };
    }

    // Check for tie (50% split)
    if (approvals.length === rejections.length) {
      this.council_stats.split_decisions += 1;
      this.council_stats.tie_breaks_executed += 1;

      // Invoke Laughing Einstein
      const tie_break_verdict = this.laughing_einstein.breakTie(claim, expert_verdicts);

      return {
        final_verdict: tie_break_verdict.verdict,
        decision_type: 'tie-break',
        expert_consensus: false,
        tie_break_required: true,
        tie_break_verdict,
        verdicts: expert_verdicts,
        authority: this.laughing_einstein.name
      };
    }

    // Not a tie, majority wins
    const final_verdict = approvals.length > rejections.length ? 'approved' : 'rejected';
    return {
      final_verdict,
      decision_type: 'majority',
      expert_consensus: false,
      tie_break_required: false,
      verdicts: expert_verdicts,
      approval_percentage: ((approvals.length / expert_verdicts.length) * 100).toFixed(1)
    };
  }

  /**
   * Get council status
   */
  getCouncilStatus() {
    return {
      experts: Array.from(this.experts.values()).map(e => e.getProfile()),
      tie_breaker: this.laughing_einstein.getProfile(),
      stats: this.council_stats,
      status: 'operational'
    };
  }

  /**
   * Get expert by ID
   */
  getExpert(expert_id) {
    return this.experts.get(expert_id);
  }

  /**
   * Check if validator is an expert
   */
  isExpert(validator_id) {
    return this.experts.has(validator_id);
  }

  /**
   * Check if validator is Laughing Einstein
   */
  isTieBreaker(validator_id) {
    return validator_id === this.laughing_einstein.id;
  }
}

// Export for integration with game-mechanics.js
export { ExpertValidator, LaughingEinstein, ExpertValidatorCouncil };

// ============================================================================
// DEMONSTRATION
// ============================================================================

async function demonstrateExpertValidators() {
  console.log(`
╔════════════════════════════════════════════════════════════════╗
║  THE GAME - EXPERT VALIDATOR COUNCIL                           ║
║  4 Specialist Nodes + Laughing Einstein Tie-Breaker            ║
╚════════════════════════════════════════════════════════════════╝
  `);

  const council = new ExpertValidatorCouncil();

  console.log('\n📋 EXPERT COUNCIL COMPOSITION:\n');
  const status = council.getCouncilStatus();
  status.experts.forEach(expert => {
    console.log(`  ✓ ${expert.id.toUpperCase()}`);
    console.log(`    Specialty: ${expert.specialty}`);
    console.log(`    Expertise: ${expert.specialization.description}`);
    console.log(`    Reputation: ${expert.reputation}/100`);
  });

  console.log(`\n  ⚡ TIE-BREAKER: ${status.tie_breaker.name}`);
  console.log(`    Role: ${status.tie_breaker.authority_description}`);
  console.log(`    Authority: ${status.tie_breaker.authority_level}`);

  // Simulate expert evaluation
  console.log('\n\n🧪 SIMULATED EXPERT EVALUATION:\n');

  const sample_claim = {
    id: 'proton-test-001',
    domain: 'baryon',
    element_or_particle: 'proton',
    measurement_type: 'proton-mass',
    reference_value: 938.272,
    measured_value: 938.265,
    causality: 99.5
  };

  console.log(`  Claim: ${sample_claim.element_or_particle} - ${sample_claim.measurement_type}`);
  console.log(`  Reference: ${sample_claim.reference_value} MeV/c²`);
  console.log(`  Measured: ${sample_claim.measured_value} MeV/c²`);
  console.log(`  Causality: ${sample_claim.causality}/100`);

  // Get expert quorum
  const quorum = council.selectExpertQuorum(sample_claim);
  console.log(`\n  Quorum Selection: ${quorum.available ? '✅ EXPERTS ASSIGNED' : '❌ FALLBACK TO REGULAR'}`);
  if (quorum.available) {
    console.log(`    Experts: ${quorum.experts.join(', ')}`);
    console.log(`    Tie-Breaker: ${quorum.tie_breaker}`);
  }

  // Simulate unanimous decision
  console.log('\n  📊 SCENARIO 1: Unanimous Expert Decision');
  const expert1 = council.atomic_node_1.issueVerdict(sample_claim, true);
  const expert2 = council.neutron_node.issueVerdict(sample_claim, true);
  
  const unanimous_result = council.processExpertVerdict(sample_claim, [expert1, expert2]);
  console.log(`    Result: ${unanimous_result.final_verdict.toUpperCase()} (${unanimous_result.decision_type})`);
  console.log(`    Verdicts: ${unanimous_result.verdicts.length} experts agree`);

  // Simulate tie-break scenario
  console.log('\n  📊 SCENARIO 2: Expert Tie-Break');
  const claim_for_tie = {
    ...sample_claim,
    id: 'proton-test-002',
    measured_value: 937.5  // Slightly off - will cause disagreement
  };

  const expert3 = council.delta_node.issueVerdict(claim_for_tie, true);
  const expert4 = council.lambda_node.issueVerdict(claim_for_tie, false);  // Disagree!

  const tie_result = council.processExpertVerdict(claim_for_tie, [expert3, expert4]);
  console.log(`    Result: ${tie_result.final_verdict.toUpperCase()} (${tie_result.decision_type})`);
  console.log(`    Experts: ${tie_result.verdicts.length} split decision`);
  if (tie_result.tie_break_required) {
    console.log(`    Tie-Breaker: ${tie_result.authority} cast deciding vote`);
    console.log(`    Reasoning: ${tie_result.tie_break_verdict.reasoning.summary}`);
  }

  console.log('\n\n📈 COUNCIL STATISTICS:\n');
  console.log(`  Verdicts Issued: ${council.council_stats.verdicts_issued}`);
  console.log(`  Unanimous Decisions: ${council.council_stats.unanimous_decisions}`);
  console.log(`  Split Decisions: ${council.council_stats.split_decisions}`);
  console.log(`  Tie-Breaks Executed: ${council.council_stats.tie_breaks_executed}`);

  console.log(`\n${'═'.repeat(64)}`);
  console.log('✅ EXPERT VALIDATOR COUNCIL: OPERATIONAL');
  console.log('✅ Atomic-Node-1 (Proton): Ready');
  console.log('✅ Neutron-Node: Ready');
  console.log('✅ Delta-Node: Ready');
  console.log('✅ Lambda-Node: Ready');
  console.log('✅ Laughing Einstein: Tie-Breaking Authority Active');
  console.log(`${'═'.repeat(64)}\n`);

  process.exit(0);
}

// Only run demo if executed directly
const scriptName = (process.argv[1] || '').split(/[\\/]/).pop() || '';
if (scriptName === 'expert-validators.js') {
  demonstrateExpertValidators().catch(err => {
    console.error('❌ Expert validators demo failed:', err);
    process.exit(1);
  });
}
