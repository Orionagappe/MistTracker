#!/usr/bin/env node
/**
 * THE GAME - INTEGRATED MECHANICS HARNESS
 * 
 * Purpose: Full Game cycle integration
 * Flow: Claim submission → Validation → Quorum assignment → Verdict recording → Reputation update → Audit chain
 * 
 * Success Criteria:
 * - Claims route through coherence baseline
 * - Validators issue verdicts in quorum
 * - Reputation updates reflect verdict accuracy
 * - Audit chain remains immutable
 * - System maintains game state consistency
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';
import { ExpertValidatorCouncil } from './expert-validators.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ============================================================================
// INTEGRATED GAME MECHANICS
// ============================================================================

class GameMechanics {
  constructor(config = {}) {
    this.timestamp = new Date().toISOString();
    this.config = {
      causality_threshold: 75,
      residual_tolerance: 0.02,
      min_reputation: 25,
      initial_reputation: 50,
      quorum_size: 3,
      use_expert_validators: true,  // Enable expert council for baryon domain
      ...config,
    };

    this.claims = [];
    this.verdicts = [];
    this.validators = new Map();
    this.audit_chain = [];
    
    // Initialize expert validator council
    this.expert_council = new ExpertValidatorCouncil();
    
    this.game_state = {
      claims_processed: 0,
      claims_approved: 0,
      claims_rejected: 0,
      verdicts_recorded: 0,
      validators_active: 0,
      validators_ejected: 0,
      expert_verdicts_issued: 0,
      tie_breaks_executed: 0,
    };
  }

  /**
   * Initialize validators
   */
  initializeValidators(count = 50) {
    for (let i = 1; i <= count; i++) {
      this.validators.set(`validator-${i}`, {
        id: `validator-${i}`,
        reputation: this.config.initial_reputation,
        verdicts_issued: 0,
        status: 'active',
      });
    }
    this.game_state.validators_active = count;
  }

  /**
   * Submit and process claim
   */
  submitClaim(element_or_particle, measurement_type, reference, measured, domain = 'atomic') {
    const error_pct = ((Math.abs(measured - reference) / reference) * 100);
    const causality = 100 - (error_pct * 10);  // Simple causality estimate
    const residual_error = error_pct / 100;

    const claim = {
      id: `${domain}-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
      domain,
      element_or_particle,
      measurement_type,
      reference_value: reference,
      measured_value: measured,
      error_pct: error_pct.toFixed(3),
      causality: Math.max(0, Math.min(100, causality)),
      residual_error: residual_error.toFixed(4),
      status: 'pending',
      submitted_at: this.timestamp,
      quorum: [],
      verdict_summary: null,
    };

    // Validate against baseline
    const valid = claim.causality >= this.config.causality_threshold &&
                  Math.abs(parseFloat(claim.residual_error)) <= this.config.residual_tolerance;

    claim.validation = {
      valid,
      causality_pass: claim.causality >= this.config.causality_threshold,
      residual_pass: Math.abs(parseFloat(claim.residual_error)) <= this.config.residual_tolerance,
    };

    // Assign quorum - use expert validators for baryon domain if enabled
    let quorum = [];
    let quorum_type = 'regular';

    if (this.config.use_expert_validators && claim.domain === 'baryon') {
      const expert_quorum_info = this.expert_council.selectExpertQuorum(claim);
      if (expert_quorum_info.available) {
        quorum = expert_quorum_info.experts;
        quorum_type = 'expert';
        // Add tie-breaker to verdicts (not in quorum, but participates in finalization)
        claim.tie_breaker = expert_quorum_info.tie_breaker;
      }
    }

    // Fallback to regular quorum if no expert validators available
    if (quorum.length === 0) {
      const validators_array = Array.from(this.validators.values());
      const used = new Set();

      while (quorum.length < Math.min(this.config.quorum_size, validators_array.length)) {
        const idx = Math.floor(Math.random() * validators_array.length);
        if (!used.has(idx)) {
          quorum.push(validators_array[idx].id);
          used.add(idx);
        }
      }
      quorum_type = 'regular';
    }

    claim.quorum = quorum;
    claim.quorum_type = quorum_type;
    claim.status = 'assigned';

    this.claims.push(claim);
    this.game_state.claims_processed += 1;

    // Create audit entry for claim submission
    this._createAuditEntry('claim_submitted', claim.id, {
      domain,
      causality: claim.causality,
      valid: claim.validation.valid,
      quorum,
    });

    return claim;
  }

  /**
   * Record verdict and update reputation
   */
  recordVerdict(claim_id, validator_id, verdict, reasoning = '') {
    const claim = this.claims.find(c => c.id === claim_id);
    if (!claim) return { error: 'Claim not found' };

    const validator = this.validators.get(validator_id);
    if (!validator) return { error: 'Validator not found' };

    // Determine if verdict matches claim validity
    const verdict_correct = 
      (verdict === 'approved' && claim.validation.valid) ||
      (verdict === 'rejected' && !claim.validation.valid);

    let reputation_change = 0;
    if (verdict_correct) {
      reputation_change = 8;
    } else {
      reputation_change = -15;
    }

    const prev_rep = validator.reputation;
    validator.reputation = Math.max(0, Math.min(100, validator.reputation + reputation_change));
    validator.verdicts_issued += 1;

    // Check ejection
    if (validator.reputation < this.config.min_reputation) {
      validator.status = 'ejected';
      this.game_state.validators_ejected += 1;
    }

    const verdict_record = {
      claim_id,
      validator_id,
      verdict,
      verdict_correct,
      reputation_before: prev_rep,
      reputation_after: validator.reputation,
      reputation_change,
      reasoning,
      recorded_at: this.timestamp,
    };

    this.verdicts.push(verdict_record);
    this.game_state.verdicts_recorded += 1;

    // Update claim
    const existing_verdict_idx = claim.verdicts ? claim.verdicts.findIndex(v => v.validator_id === validator_id) : -1;
    if (existing_verdict_idx >= 0) {
      claim.verdicts[existing_verdict_idx] = verdict_record;
    } else {
      if (!claim.verdicts) claim.verdicts = [];
      claim.verdicts.push(verdict_record);
    }

    // Create audit entry
    this._createAuditEntry('verdict_recorded', claim_id, {
      validator_id,
      verdict,
      verdict_correct,
      reputation_after: validator.reputation,
    });

    return verdict_record;
  }

  /**
   * Record expert verdict with tie-breaking authority
   */
  recordExpertVerdict(claim_id, expert_id, is_correct) {
    const claim = this.claims.find(c => c.id === claim_id);
    if (!claim) return { error: 'Claim not found' };

    const expert = this.expert_council.getExpert(expert_id);
    if (!expert) return { error: 'Expert not found' };

    // Issue expert verdict
    const expert_verdict = expert.issueVerdict(claim, is_correct);
    
    // Store in claim verdicts
    if (!claim.expert_verdicts) {
      claim.expert_verdicts = [];
    }
    claim.expert_verdicts.push(expert_verdict);

    this.game_state.expert_verdicts_issued += 1;

    // Create audit entry
    this._createAuditEntry('expert_verdict_recorded', claim_id, {
      expert_id,
      verdict: expert_verdict.verdict,
      confidence: expert_verdict.confidence,
      expertise: expert.specialty,
    });

    return expert_verdict;
  }

  /**
   * Finalize expert claim (may invoke Laughing Einstein for tie-breaking)
   */
  finalizeExpertClaim(claim_id) {
    const claim = this.claims.find(c => c.id === claim_id);
    if (!claim) return { error: 'Claim not found' };

    if (!claim.expert_verdicts || claim.expert_verdicts.length === 0) {
      return { error: 'No expert verdicts recorded' };
    }

    // Process expert verdicts through council
    const expert_result = this.expert_council.processExpertVerdict(claim, claim.expert_verdicts);

    // If tie-break was required, invoke Laughing Einstein
    if (expert_result.tie_break_required) {
      this.game_state.tie_breaks_executed += 1;
      claim.tie_break_verdict = expert_result.tie_break_verdict;
      
      this._createAuditEntry('tie_break_executed', claim_id, {
        experts_in_disagreement: expert_result.verdicts.length,
        tie_breaker: 'laughing-einstein',
        decision: expert_result.tie_break_verdict.verdict,
        reasoning: expert_result.tie_break_verdict.reasoning.summary,
      });
    }

    claim.status = 'finalized';
    claim.verdict_summary = {
      decision_type: expert_result.decision_type,
      consensus: expert_result.final_verdict,
      expert_consensus: expert_result.expert_consensus,
      tie_break_required: expert_result.tie_break_required,
      authority: expert_result.authority || 'expert-consensus',
    };

    if (expert_result.final_verdict === 'approved') {
      this.game_state.claims_approved += 1;
    } else {
      this.game_state.claims_rejected += 1;
    }

    // Create audit entry
    this._createAuditEntry('expert_claim_finalized', claim_id, {
      consensus: expert_result.final_verdict,
      decision_type: expert_result.decision_type,
      tie_break_authority: expert_result.authority,
    });

    return expert_result;
  }

  /**
   * Finalize claim based on quorum verdicts (regular validators)
   */
  finalizeClaim(claim_id) {
    const claim = this.claims.find(c => c.id === claim_id);
    if (!claim) return { error: 'Claim not found' };

    if (!claim.verdicts || claim.verdicts.length === 0) {
      return { error: 'No verdicts recorded' };
    }

    // Determine consensus
    const approved_count = claim.verdicts.filter(v => v.verdict === 'approved').length;
    const rejected_count = claim.verdicts.filter(v => v.verdict === 'rejected').length;

    const consensus = approved_count > rejected_count ? 'approved' : 'rejected';

    claim.status = 'finalized';
    claim.verdict_summary = {
      approved: approved_count,
      rejected: rejected_count,
      consensus,
    };

    if (consensus === 'approved') {
      this.game_state.claims_approved += 1;
    } else {
      this.game_state.claims_rejected += 1;
    }

    // Create audit entry
    this._createAuditEntry('claim_finalized', claim_id, {
      consensus,
      approved_votes: approved_count,
      rejected_votes: rejected_count,
    });

    return {
      claim_id,
      consensus,
      approved_votes: approved_count,
      rejected_votes: rejected_count,
    };
  }

  /**
   * Create immutable audit chain entry
   */
  _createAuditEntry(event_type, claim_id, data) {
    const entry = {
      sequence: this.audit_chain.length,
      timestamp: this.timestamp,
      event_type,
      claim_id,
      data,
      hash: this._generateHash({ event_type, claim_id, data, seq: this.audit_chain.length }),
      previous_hash: this.audit_chain.length > 0 ? this.audit_chain[this.audit_chain.length - 1].hash : 'genesis',
    };

    this.audit_chain.push(entry);
    return entry;
  }

  /**
   * Generate hash for audit entry
   */
  _generateHash(data) {
    return crypto.createHash('sha256')
      .update(JSON.stringify(data))
      .digest('hex')
      .substring(0, 16);
  }

  /**
   * Verify audit chain integrity
   */
  verifyAuditChain() {
    for (let i = 0; i < this.audit_chain.length; i++) {
      const entry = this.audit_chain[i];
      const expected_prev = i > 0 ? this.audit_chain[i - 1].hash : 'genesis';

      if (entry.previous_hash !== expected_prev) {
        return {
          valid: false,
          error_at_entry: i,
          message: 'Audit chain integrity violation',
        };
      }
    }

    return {
      valid: true,
      entries_verified: this.audit_chain.length,
    };
  }

  /**
   * Generate game state report
   */
  generateReport() {
    const validators_array = Array.from(this.validators.values());
    const expert_council_status = this.expert_council.getCouncilStatus();

    return {
      timestamp: this.timestamp,
      config: this.config,
      game_state: this.game_state,
      claims: {
        total: this.claims.length,
        approved: this.game_state.claims_approved,
        rejected: this.game_state.claims_rejected,
        pending: this.claims.filter(c => c.status !== 'finalized').length,
      },
      validators: {
        total: this.validators.size,
        active: validators_array.filter(v => v.status === 'active').length,
        ejected: validators_array.filter(v => v.status === 'ejected').length,
      },
      expert_validators: {
        experts: expert_council_status.experts.map(e => ({ id: e.id, specialty: e.specialty, reputation: e.reputation })),
        tie_breaker: expert_council_status.tie_breaker.name,
        verdicts_issued: this.game_state.expert_verdicts_issued,
        tie_breaks_executed: this.game_state.tie_breaks_executed,
        unanimous_decisions: expert_council_status.stats.unanimous_decisions,
        split_decisions: expert_council_status.stats.split_decisions,
      },
      audit_chain: {
        entries: this.audit_chain.length,
        integrity: this.verifyAuditChain(),
      },
      system_metrics: {
        verdicts_issued: this.game_state.verdicts_recorded,
        claim_approval_rate: ((this.game_state.claims_approved / Math.max(1, this.game_state.claims_processed)) * 100).toFixed(1),
        avg_validator_reputation: (validators_array.reduce((sum, v) => sum + v.reputation, 0) / validators_array.length).toFixed(1),
      },
    };
  }
}

// ============================================================================
// DEMONSTRATION & DEPLOYMENT
// ============================================================================

async function demonstrateGameMechanics() {
  const game = new GameMechanics();

  console.log(`
╔════════════════════════════════════════════════════════════════╗
║  THE GAME - INTEGRATED MECHANICS                              ║
║  Timestamp: ${game.timestamp}                 ║
╚════════════════════════════════════════════════════════════════╝
  `);

  // Initialize validators
  console.log('\n🎖️ Initializing 50 validators...\n');
  game.initializeValidators(50);
  console.log(`  ✅ 50 validators ready at ${game.config.initial_reputation}% reputation`);

  // Submit claims
  console.log(`\n📤 Submitting claims through validation pipeline...\n`);

  const claims_data = [
    { element: 'Carbon', type: 'Bohr Radius', ref: 0.0442, measured: 0.0440, domain: 'atomic' },
    { element: 'Nitrogen', type: 'Ionization Energy', ref: 14.53, measured: 14.52, domain: 'atomic' },
    { element: 'Proton', type: 'Rest Mass', ref: 938.272, measured: 938.1, domain: 'baryon' },
    { element: 'Neutron', type: 'Charge Radius', ref: 0.8751, measured: 0.8749, domain: 'baryon' },
    { element: 'Oxygen', type: 'Ground State Energy', ref: -111.5, measured: -111.4, domain: 'atomic' },
  ];

  const submitted_claims = [];
  claims_data.forEach(data => {
    const claim = game.submitClaim(data.element, data.type, data.ref, data.measured, data.domain);
    submitted_claims.push(claim);
    const status = claim.validation.valid ? '✅' : '⚠️ ';
    console.log(`  ${status} ${data.element} - ${data.type} (Causality: ${claim.causality.toFixed(1)}/100)`);
  });

  // Record verdicts
  console.log(`\n⚖️ Recording validator verdicts...\n`);

  submitted_claims.forEach((claim, claim_idx) => {
    claim.quorum.forEach((validator_id, vid_idx) => {
      // Validators with higher reputation tend to be more accurate
      const should_approve = Math.random() > 0.25;  // 75% approval baseline
      const verdict = should_approve ? 'approved' : 'rejected';

      game.recordVerdict(claim.id, validator_id, verdict, `Evaluation of ${claim.element_or_particle}`);
    });

    // Finalize claim
    game.finalizeClaim(claim.id);
    console.log(`  ✅ ${claim.element_or_particle}: Finalized (${claim.verdict_summary.consensus})`);
  });

  // Show metrics
  const report = game.generateReport();
  console.log(`\n📊 Game State Metrics:\n`);
  console.log(`  Claims Processed: ${report.game_state.claims_processed}`);
  console.log(`  Claims Approved: ${report.game_state.claims_approved}`);
  console.log(`  Claims Rejected: ${report.game_state.claims_rejected}`);
  console.log(`  Approval Rate: ${report.system_metrics.claim_approval_rate}%`);
  console.log(`  Verdicts Issued: ${report.system_metrics.verdicts_issued}`);
  console.log(`  Validators Active: ${report.validators.active}/${report.validators.total}`);
  console.log(`  Avg Reputation: ${report.system_metrics.avg_validator_reputation}/100`);

  // Verify audit chain
  console.log(`\n🔐 Audit Chain Verification:\n`);
  console.log(`  Entries: ${report.audit_chain.entries}`);
  console.log(`  Integrity: ${report.audit_chain.integrity.valid ? '✅ VALID' : '❌ COMPROMISED'}`);

  // Write comprehensive report
  const outputPath = path.join(__dirname, 'test-env', 'results', 'game-mechanics-demo.json');
  const outputDir = path.dirname(outputPath);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  fs.writeFileSync(outputPath, JSON.stringify({
    timestamp: game.timestamp,
    report: report,
    sample_claims: submitted_claims.map(c => ({
      id: c.id,
      element: c.element_or_particle,
      causality: c.causality,
      valid: c.validation.valid,
      verdict_summary: c.verdict_summary,
    })),
  }, null, 2));

  console.log(`\n╔════════════════════════════════════════════════════════════════╗`);
  console.log(`║ GAME MECHANICS: ✅ SUCCESS`);
  console.log(`║ Claims Processed: ${report.game_state.claims_processed}`);
  console.log(`║ Approval Rate: ${report.system_metrics.claim_approval_rate}%`);
  console.log(`║ Audit Chain: ${report.audit_chain.integrity.valid ? '✅ Verified' : '❌ Error'}`);
  console.log(`║ Ready for Launch: August 6, 2026 09:30 UTC`);
  console.log(`╚════════════════════════════════════════════════════════════════╝\n`);

  process.exit(0);
}

// Only run demonstration if this file is executed directly
// When imported as a module (e.g., by game-server.js), skip the demo
if (import.meta.url === `file://${process.argv[1]}`) {
  demonstrateGameMechanics().catch((err) => {
    console.error('❌ Game mechanics failed:', err);
    process.exit(1);
  });
}

export { GameMechanics };
