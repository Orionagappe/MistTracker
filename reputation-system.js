#!/usr/bin/env node
/**
 * THE GAME - REPUTATION SYSTEM HARNESS
 * 
 * Purpose: Track validator accuracy, update reputation, handle auto-ejection
 * 
 * Reputation Rules:
 * - Initial: 50%
 * - Max: 100%
 * - Min (auto-ejection): 25%
 * - Correct verdicts: +5-10 points per decision
 * - Incorrect verdicts: -15-20 points per decision
 * - Consistency bonus: +2 per streak (same decision as quorum)
 * - Outlier penalty: -10 per strong disagreement
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ============================================================================
// REPUTATION SYSTEM
// ============================================================================

class ReputationSystem {
  constructor() {
    this.timestamp = new Date().toISOString();
    this.validators = new Map();
    this.verdict_records = [];
    this.reputation_history = [];
    this.ejections = [];
  }

  /**
   * Initialize validator with starting reputation
   */
  addValidator(validator_id, initial_reputation = 50) {
    this.validators.set(validator_id, {
      id: validator_id,
      reputation: initial_reputation,
      verdicts_issued: 0,
      verdicts_correct: 0,
      verdicts_incorrect: 0,
      consistency_streak: 0,
      last_verdict: null,
      status: 'active',
      initialized_at: this.timestamp,
    });
  }

  /**
   * Record verdict outcome (correct/incorrect)
   */
  recordVerdictOutcome(validator_id, claim_id, verdict, outcome, reasoning) {
    const validator = this.validators.get(validator_id);
    if (!validator) return { error: `Validator ${validator_id} not found` };

    // Determine reputation change
    let reputation_change = 0;
    let outcome_type = '';

    if (outcome === 'correct') {
      reputation_change = 8;  // +8 for correct verdict
      validator.verdicts_correct += 1;
      outcome_type = 'correct';
    } else if (outcome === 'incorrect') {
      reputation_change = -15;  // -15 for incorrect verdict
      validator.verdicts_incorrect += 1;
      outcome_type = 'incorrect';
    } else if (outcome === 'outlier') {
      reputation_change = -10;  // -10 for strong disagreement with quorum
      outcome_type = 'outlier';
    }

    // Update validator state
    validator.verdicts_issued += 1;
    validator.last_verdict = verdict;
    const prev_reputation = validator.reputation;
    validator.reputation = Math.max(0, Math.min(100, validator.reputation + reputation_change));

    // Check auto-ejection
    if (validator.reputation < 25) {
      validator.status = 'ejected';
      this.ejections.push({
        validator_id,
        reason: 'reputation_below_25',
        reputation_at_ejection: validator.reputation,
        ejected_at: this.timestamp,
      });
    }

    // Record history
    const record = {
      validator_id,
      claim_id,
      verdict,
      outcome: outcome_type,
      reputation_change,
      reputation_before: prev_reputation,
      reputation_after: validator.reputation,
      verdict_accuracy: `${((validator.verdicts_correct / validator.verdicts_issued) * 100).toFixed(1)}%`,
      status: validator.status,
      recorded_at: this.timestamp,
    };

    this.verdict_records.push(record);
    this.reputation_history.push(record);

    return record;
  }

  /**
   * Get validator reputation status
   */
  getValidatorStatus(validator_id) {
    const validator = this.validators.get(validator_id);
    if (!validator) return null;

    return {
      validator_id,
      reputation: validator.reputation,
      status: validator.status,
      verdicts_issued: validator.verdicts_issued,
      verdicts_correct: validator.verdicts_correct,
      verdicts_incorrect: validator.verdicts_incorrect,
      accuracy_pct: ((validator.verdicts_correct / (validator.verdicts_issued || 1)) * 100).toFixed(1),
    };
  }

  /**
   * Get all validators ranked by reputation
   */
  getRanking() {
    return Array.from(this.validators.values())
      .sort((a, b) => b.reputation - a.reputation)
      .map((v, idx) => ({
        rank: idx + 1,
        validator_id: v.id,
        reputation: v.reputation,
        verdicts_issued: v.verdicts_issued,
        verdicts_correct: v.verdicts_correct,
        status: v.status,
      }));
  }

  /**
   * Get system-wide metrics
   */
  getSystemMetrics() {
    const validators_array = Array.from(this.validators.values());
    const active = validators_array.filter(v => v.status === 'active').length;
    const ejected = validators_array.filter(v => v.status === 'ejected').length;

    const total_verdicts = validators_array.reduce((sum, v) => sum + v.verdicts_issued, 0);
    const total_correct = validators_array.reduce((sum, v) => sum + v.verdicts_correct, 0);

    return {
      timestamp: this.timestamp,
      validators_total: this.validators.size,
      validators_active: active,
      validators_ejected: ejected,
      verdicts_issued_total: total_verdicts,
      verdicts_correct_total: total_correct,
      verdicts_incorrect_total: total_verdicts - total_correct,
      system_accuracy_pct: ((total_correct / (total_verdicts || 1)) * 100).toFixed(1),
      avg_reputation: (validators_array.reduce((sum, v) => sum + v.reputation, 0) / validators_array.length).toFixed(1),
      min_reputation: Math.min(...validators_array.map(v => v.reputation)),
      max_reputation: Math.max(...validators_array.map(v => v.reputation)),
    };
  }

  /**
   * Generate report
   */
  generateReport() {
    return {
      timestamp: this.timestamp,
      system_metrics: this.getSystemMetrics(),
      ranking_top_20: this.getRanking().slice(0, 20),
      ejections: this.ejections,
      verdict_history_count: this.verdict_records.length,
    };
  }
}

// ============================================================================
// DEMONSTRATION & DEPLOYMENT
// ============================================================================

async function demonstrateReputationSystem() {
  const system = new ReputationSystem();

  console.log(`
╔════════════════════════════════════════════════════════════════╗
║  THE GAME - REPUTATION SYSTEM                                 ║
║  Timestamp: ${system.timestamp}                 ║
╚════════════════════════════════════════════════════════════════╝
  `);

  // Initialize 50 validators with starting reputation
  console.log('\n🎖️ Initializing 50 validators at 50% reputation...\n');

  for (let i = 1; i <= 50; i++) {
    system.addValidator(`validator-${i}`, 50);
  }

  console.log(`  ✅ 50 validators initialized`);

  // Simulate claim verdicts and reputation updates
  console.log(`\n📊 Simulating verdict outcomes...\n`);

  // Simulate 10 claims with 3 validators per claim (30 verdicts)
  const claims = [
    { id: 'claim-carbon-001', verdicts: ['correct', 'correct', 'correct'] },
    { id: 'claim-proton-001', verdicts: ['correct', 'incorrect', 'correct'] },
    { id: 'claim-nitrogen-001', verdicts: ['correct', 'correct', 'correct'] },
    { id: 'claim-neutron-001', verdicts: ['correct', 'correct', 'outlier'] },
    { id: 'claim-oxygen-001', verdicts: ['correct', 'incorrect', 'incorrect'] },
    { id: 'claim-silicon-001', verdicts: ['correct', 'correct', 'correct'] },
    { id: 'claim-lambda-001', verdicts: ['incorrect', 'correct', 'correct'] },
    { id: 'claim-beryllium-001', verdicts: ['correct', 'correct', 'correct'] },
    { id: 'claim-magnesium-001', verdicts: ['correct', 'incorrect', 'outlier'] },
    { id: 'claim-sulfur-001', verdicts: ['correct', 'correct', 'correct'] },
  ];

  let verdict_counter = 0;

  claims.forEach(claim => {
    claim.verdicts.forEach((outcome, idx) => {
      const validator_id = `validator-${idx + 1}`;
      const record = system.recordVerdictOutcome(
        validator_id,
        claim.id,
        outcome === 'correct' ? 'approved' : 'rejected',
        outcome,
        `Verdict processing for ${claim.id}`
      );

      verdict_counter += 1;
    });
  });

  console.log(`  ✅ ${verdict_counter} verdicts processed and recorded`);

  // Show top performers
  const ranking = system.getRanking();
  console.log(`\n🏆 Top 10 Validators by Reputation:\n`);
  ranking.slice(0, 10).forEach(v => {
    console.log(`  ${v.rank}. ${v.validator_id}: ${v.reputation}/100 (${v.verdicts_correct}/${v.verdicts_issued} correct)`);
  });

  // Show ejections (if any)
  if (system.ejections.length > 0) {
    console.log(`\n⚠️  Ejected Validators (reputation < 25):\n`);
    system.ejections.forEach(e => {
      console.log(`  ❌ ${e.validator_id}: ${e.reputation_at_ejection}/100 → ejected`);
    });
  }

  // System metrics
  const metrics = system.getSystemMetrics();
  console.log(`\n📈 System-Wide Metrics:\n`);
  console.log(`  Total Validators: ${metrics.validators_total}`);
  console.log(`  Active: ${metrics.validators_active}`);
  console.log(`  Ejected: ${metrics.validators_ejected}`);
  console.log(`  Verdicts Issued: ${metrics.verdicts_issued_total}`);
  console.log(`  System Accuracy: ${metrics.system_accuracy_pct}%`);
  console.log(`  Avg Reputation: ${metrics.avg_reputation}/100`);

  // Write report
  const report = system.generateReport();
  const outputPath = path.join(__dirname, 'test-env', 'results', 'reputation-system-demo.json');
  const outputDir = path.dirname(outputPath);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  fs.writeFileSync(outputPath, JSON.stringify(report, null, 2));

  console.log(`\n╔════════════════════════════════════════════════════════════════╗`);
  console.log(`║ REPUTATION SYSTEM: ✅ SUCCESS`);
  console.log(`║ Verdicts Processed: ${metrics.verdicts_issued_total}`);
  console.log(`║ System Accuracy: ${metrics.system_accuracy_pct}%`);
  console.log(`║ Validators Active: ${metrics.validators_active}/${metrics.validators_total}`);
  console.log(`║ Auto-Ejections: ${system.ejections.length}`);
  console.log(`╚════════════════════════════════════════════════════════════════╝\n`);

  process.exit(0);
}

demonstrateReputationSystem().catch((err) => {
  console.error('❌ Reputation system failed:', err);
  process.exit(1);
});

export { ReputationSystem };
