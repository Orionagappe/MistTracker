#!/usr/bin/env node

/**
 * Babel Consensus Analysis Tool
 * For language and distributed systems researchers
 * 
 * Purpose: Extract linguistic isolates from cryptographic audit chains
 * and analyze communication convergence patterns
 * 
 * Usage:
 *   node babel-consensus-tool.js extract --chain validation-logs/audit-chain.json
 *   node babel-consensus-tool.js analyze --chain validation-logs/audit-chain.json --validator V1
 *   node babel-consensus-tool.js convergences --chain validation-logs/audit-chain.json
 *   node babel-consensus-tool.js report --chain validation-logs/audit-chain.json --output report.json
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// ============================================================================
// LINGUISTIC ISOLATE EXTRACTION
// ============================================================================

class LinguisticIsolateExtractor {
  /**
   * Extract all validator signatures (linguistic isolates) from audit chain
   * Each isolate represents a unique communication moment
   */
  static extractIsolates(auditChain) {
    const isolates = [];

    auditChain.forEach((entry, entryIndex) => {
      const layerDepth = auditChain.length - entryIndex;
      
      if (entry.validatorSignatures && Array.isArray(entry.validatorSignatures)) {
        entry.validatorSignatures.forEach((sig) => {
          isolates.push({
            id: `${entry.timestamp}_${sig.validator_id}`,
            validator_id: sig.validator_id,
            timestamp: entry.timestamp,
            entry_index: entryIndex,
            layer_depth: layerDepth,
            signature: sig.signature,
            hash_integrity: entry.hash,
            previous_hash_link: entry.previousHash,
            convergence_vote: entry.convergence_vote || null,
            isolated_from_validators: this._findIsolatedValidators(
              entry,
              sig.validator_id
            )
          });
        });
      }
    });

    return isolates;
  }

  /**
   * Identify which validators disagreed with this validator at this moment
   * (i.e., which validators did NOT sign the same timestamp entry)
   */
  static _findIsolatedValidators(entry, validatorId) {
    const signingValidators = new Set(
      entry.validatorSignatures.map(s => s.validator_id)
    );

    // All possible validators (extend if needed)
    const allValidators = new Set([
      'V1', 'V2', 'V3', 'V4', 'V5', 'V6', 'V7', 'V8', 'V9'
    ]);

    const isolated = [];
    allValidators.forEach(v => {
      if (!signingValidators.has(v)) {
        isolated.push(v);
      }
    });

    return isolated;
  }

  /**
   * Group isolates by validator (study one "speaker" over time)
   */
  static groupByValidator(isolates) {
    const byValidator = {};

    isolates.forEach(isolate => {
      if (!byValidator[isolate.validator_id]) {
        byValidator[isolate.validator_id] = [];
      }
      byValidator[isolate.validator_id].push(isolate);
    });

    return byValidator;
  }

  /**
   * Group isolates by time period (study communication at specific moments)
   */
  static groupByTimestamp(isolates) {
    const byTimestamp = {};

    isolates.forEach(isolate => {
      if (!byTimestamp[isolate.timestamp]) {
        byTimestamp[isolate.timestamp] = [];
      }
      byTimestamp[isolate.timestamp].push(isolate);
    });

    return byTimestamp;
  }

  /**
   * Find "phonological changes" - moments when a validator's signature pattern shifts
   */
  static detectSignatureEvolution(validatorIsolates) {
    const evolution = [];
    let previousSignature = null;
    let previousTimestamp = null;

    validatorIsolates.sort((a, b) => a.timestamp - b.timestamp);

    validatorIsolates.forEach((isolate, index) => {
      if (previousSignature && previousSignature !== isolate.signature) {
        evolution.push({
          change_at_entry: isolate.entry_index,
          timestamp: isolate.timestamp,
          previous_timestamp: previousTimestamp,
          time_delta_seconds: isolate.timestamp - previousTimestamp,
          from_signature: previousSignature.substring(0, 16) + '...',
          to_signature: isolate.signature.substring(0, 16) + '...',
          evolution_type: 'signature_shift'
        });
      }
      previousSignature = isolate.signature;
      previousTimestamp = isolate.timestamp;
    });

    return evolution;
  }
}

// ============================================================================
// CONVERGENCE ANALYSIS
// ============================================================================

class ConvergenceAnalyzer {
  /**
   * Find moments when validators converge (communicate unified language)
   */
  static findConvergenceMoments(auditChain) {
    const convergences = [];
    const expectedValidatorCount = 9;

    auditChain.forEach((entry, index) => {
      if (entry.validatorSignatures && entry.validatorSignatures.length === expectedValidatorCount) {
        convergences.push({
          entry_index: index,
          timestamp: entry.timestamp,
          validator_count: entry.validatorSignatures.length,
          all_validators_present: true,
          convergence_vote: entry.convergence_vote || null,
          archaeological_layer: auditChain.length - index
        });
      }
    });

    return convergences;
  }

  /**
   * Measure convergence acceleration over time
   */
  static analyzeConvergenceTendency(auditChain) {
    const convergences = this.findConvergenceMoments(auditChain);
    
    if (convergences.length < 2) {
      return {
        total_convergence_events: convergences.length,
        tendency: 'insufficient_data',
        analysis: 'Need at least 2 convergence moments for trend analysis'
      };
    }

    const timeDeltas = [];
    for (let i = 1; i < convergences.length; i++) {
      const delta = convergences[i].timestamp - convergences[i - 1].timestamp;
      timeDeltas.push(delta);
    }

    const avgDelta = timeDeltas.reduce((a, b) => a + b, 0) / timeDeltas.length;
    const trend = timeDeltas[timeDeltas.length - 1] < timeDeltas[0] ? 'accelerating' : 'decelerating';

    return {
      total_convergence_events: convergences.length,
      average_time_between_convergences_seconds: avgDelta,
      convergence_tendency: trend,
      time_deltas: timeDeltas
    };
  }

  /**
   * Measure fragmentation (inverse of convergence)
   * How many validators are silent at each moment?
   */
  static analyzeFragmentation(auditChain) {
    const expectedValidatorCount = 9;
    const fragmentationTimeline = [];

    auditChain.forEach((entry, index) => {
      const presentValidators = entry.validatorSignatures ? entry.validatorSignatures.length : 0;
      const silentValidators = expectedValidatorCount - presentValidators;
      const fragmentationRatio = silentValidators / expectedValidatorCount;

      fragmentationTimeline.push({
        entry_index: index,
        timestamp: entry.timestamp,
        present_validators: presentValidators,
        silent_validators: silentValidators,
        fragmentation_ratio: fragmentationRatio,
        layer_depth: auditChain.length - index
      });
    });

    return {
      timeline: fragmentationTimeline,
      max_fragmentation: Math.max(...fragmentationTimeline.map(e => e.fragmentation_ratio)),
      min_fragmentation: Math.min(...fragmentationTimeline.map(e => e.fragmentation_ratio)),
      average_fragmentation: fragmentationTimeline.reduce((a, e) => a + e.fragmentation_ratio, 0) / fragmentationTimeline.length
    };
  }
}

// ============================================================================
// COMPROMISE FORENSICS
// ============================================================================

class CompromiseDetector {
  /**
   * Detect anomalies in validator behavior that suggest compromise
   */
  static analyzeValidatorConsistency(validatorIsolates) {
    if (validatorIsolates.length === 0) {
      return { anomalies: [] };
    }

    const anomalies = [];
    let signatureChangeCount = 0;
    let previousSignature = null;

    validatorIsolates.sort((a, b) => a.timestamp - b.timestamp);

    validatorIsolates.forEach((isolate, index) => {
      if (previousSignature && previousSignature !== isolate.signature) {
        signatureChangeCount++;
      }
      previousSignature = isolate.signature;
    });

    // Flag if validator changes signature too frequently (suggests key compromise)
    const changeRate = signatureChangeCount / validatorIsolates.length;
    if (changeRate > 0.5) {
      anomalies.push({
        type: 'high_signature_mutation_rate',
        change_rate: changeRate,
        severity: 'high',
        interpretation: 'Validator signature changes >50% of time (possible key compromise or adaptive behavior)'
      });
    }

    // Flag if validator suddenly goes silent
    const timeGaps = [];
    for (let i = 1; i < validatorIsolates.length; i++) {
      const gap = validatorIsolates[i].timestamp - validatorIsolates[i - 1].timestamp;
      timeGaps.push(gap);
    }

    if (timeGaps.length > 0) {
      const maxGap = Math.max(...timeGaps);
      const avgGap = timeGaps.reduce((a, b) => a + b, 0) / timeGaps.length;
      
      if (maxGap > avgGap * 5) {
        anomalies.push({
          type: 'unexpected_silence_period',
          max_gap_seconds: maxGap,
          average_gap_seconds: avgGap,
          severity: 'medium',
          interpretation: 'Validator silent for 5x normal period (possible failure or strategic silence)'
        });
      }
    }

    return {
      validator_id: validatorIsolates[0].validator_id,
      total_signals: validatorIsolates.length,
      signature_changes: signatureChangeCount,
      change_rate: changeRate,
      anomalies: anomalies,
      risk_assessment: anomalies.length > 0 ? 'elevated' : 'normal'
    };
  }

  /**
   * Detect validators that consistently disagree (possible Byzantine nodes)
   */
  static findDisagreeingValidators(auditChain) {
    const expectedValidatorCount = 9;
    const disagreementCount = {};

    // Initialize
    for (let i = 1; i <= expectedValidatorCount; i++) {
      disagreementCount[`V${i}`] = 0;
    }

    // Count how often each validator is absent from a full convergence entry
    auditChain.forEach(entry => {
      if (entry.validatorSignatures && entry.validatorSignatures.length === expectedValidatorCount) {
        // This was a convergence moment
        const presentValidators = new Set(entry.validatorSignatures.map(s => s.validator_id));
        
        for (let i = 1; i <= expectedValidatorCount; i++) {
          if (!presentValidators.has(`V${i}`)) {
            disagreementCount[`V${i}`]++;
          }
        }
      }
    });

    const sorted = Object.entries(disagreementCount)
      .sort((a, b) => b[1] - a[1])
      .map(([validator, count]) => ({ validator, disagreement_count: count }));

    return sorted;
  }
}

// ============================================================================
// REPORT GENERATION
// ============================================================================

class ReportGenerator {
  static generateComprehensiveReport(auditChain) {
    const isolates = LinguisticIsolateExtractor.extractIsolates(auditChain);
    const isolatesByValidator = LinguisticIsolateExtractor.groupByValidator(isolates);
    const convergences = ConvergenceAnalyzer.findConvergenceMoments(auditChain);
    const fragmentation = ConvergenceAnalyzer.analyzeFragmentation(auditChain);
    const tendency = ConvergenceAnalyzer.analyzeConvergenceTendency(auditChain);
    const disagreement = CompromiseDetector.findDisagreeingValidators(auditChain);

    const report = {
      metadata: {
        generated_at: new Date().toISOString(),
        audit_chain_entries: auditChain.length,
        time_span_seconds: auditChain[auditChain.length - 1].timestamp - auditChain[0].timestamp,
        total_isolates_extracted: isolates.length
      },
      linguistic_analysis: {
        validators_present: Object.keys(isolatesByValidator).length,
        isolates_per_validator: Object.keys(isolatesByValidator).reduce((acc, v) => {
          acc[v] = isolatesByValidator[v].length;
          return acc;
        }, {}),
        validator_consistency: Object.keys(isolatesByValidator).map(v => 
          CompromiseDetector.analyzeValidatorConsistency(isolatesByValidator[v])
        )
      },
      convergence_analysis: {
        total_convergence_moments: convergences.length,
        convergence_moments: convergences.slice(0, 10), // First 10
        convergence_tendency: tendency,
        recent_fragmentation_ratio: fragmentation.timeline[fragmentation.timeline.length - 1].fragmentation_ratio,
        fragmentation_statistics: {
          max: fragmentation.max_fragmentation,
          min: fragmentation.min_fragmentation,
          average: fragmentation.average_fragmentation
        }
      },
      compromise_analysis: {
        disagreement_ranking: disagreement,
        most_disagreeing_validator: disagreement[0],
        elevated_risk_validators: disagreement.filter(e => e.disagreement_count > 5)
      }
    };

    return report;
  }
}

// ============================================================================
// CLI INTERFACE
// ============================================================================

function printUsage() {
  console.log(`
Babel Consensus Analysis Tool
For language and distributed systems researchers

USAGE:
  node babel-consensus-tool.js <command> [options]

COMMANDS:
  extract <chain-file>
    Extract all linguistic isolates from audit chain

  analyze <chain-file> --validator <id>
    Analyze communication patterns for specific validator

  convergences <chain-file>
    Find all convergence moments (unified communication)

  fragmentation <chain-file>
    Analyze fragmentation timeline (communication breakdown periods)

  report <chain-file> --output <file>
    Generate comprehensive analysis report (JSON)

  detect-compromise <chain-file>
    Identify validators with anomalous behavior

EXAMPLES:
  node babel-consensus-tool.js extract ./validation-logs/audit-chain.json
  node babel-consensus-tool.js analyze ./validation-logs/audit-chain.json --validator V1
  node babel-consensus-tool.js convergences ./validation-logs/audit-chain.json
  node babel-consensus-tool.js report ./validation-logs/audit-chain.json --output report.json
  `);
}

function main() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    printUsage();
    process.exit(0);
  }

  const command = args[0];

  try {
    // Find the chain file argument
    const chainFileArg = args.find(arg => arg.endsWith('.json'));
    if (!chainFileArg) {
      console.error('Error: Please provide path to audit chain JSON file');
      printUsage();
      process.exit(1);
    }

    if (!fs.existsSync(chainFileArg)) {
      console.error(`Error: File not found: ${chainFileArg}`);
      process.exit(1);
    }

    const auditChain = JSON.parse(fs.readFileSync(chainFileArg, 'utf8'));

    switch (command) {
      case 'extract': {
        const isolates = LinguisticIsolateExtractor.extractIsolates(auditChain);
        console.log(JSON.stringify(isolates, null, 2));
        break;
      }

      case 'analyze': {
        const validatorArg = args.indexOf('--validator');
        if (validatorArg === -1 || !args[validatorArg + 1]) {
          console.error('Error: Specify validator with --validator <id>');
          process.exit(1);
        }
        const validatorId = args[validatorArg + 1];
        const isolates = LinguisticIsolateExtractor.extractIsolates(auditChain);
        const byValidator = LinguisticIsolateExtractor.groupByValidator(isolates);
        
        if (!byValidator[validatorId]) {
          console.error(`Error: Validator ${validatorId} not found in audit chain`);
          process.exit(1);
        }

        const evolution = LinguisticIsolateExtractor.detectSignatureEvolution(byValidator[validatorId]);
        const consistency = CompromiseDetector.analyzeValidatorConsistency(byValidator[validatorId]);
        
        console.log(`\n=== LINGUISTIC ANALYSIS: ${validatorId} ===\n`);
        console.log(`Total signals: ${byValidator[validatorId].length}`);
        console.log(`Signature changes: ${evolution.length}`);
        console.log(`\nConsistency Analysis:`);
        console.log(JSON.stringify(consistency, null, 2));
        console.log(`\nSignature Evolution:`);
        console.log(JSON.stringify(evolution.slice(0, 5), null, 2)); // First 5
        break;
      }

      case 'convergences': {
        const convergences = ConvergenceAnalyzer.findConvergenceMoments(auditChain);
        const tendency = ConvergenceAnalyzer.analyzeConvergenceTendency(auditChain);
        
        console.log(`\n=== CONVERGENCE ANALYSIS ===\n`);
        console.log(`Total convergence moments: ${convergences.length}`);
        console.log(`Convergence tendency: ${tendency.convergence_tendency}`);
        console.log(`Average time between convergences: ${tendency.average_time_between_convergences_seconds}s`);
        console.log(`\nRecent convergence moments:`);
        console.log(JSON.stringify(convergences.slice(-5).reverse(), null, 2));
        break;
      }

      case 'fragmentation': {
        const fragmentation = ConvergenceAnalyzer.analyzeFragmentation(auditChain);
        
        console.log(`\n=== FRAGMENTATION ANALYSIS ===\n`);
        console.log(`Max fragmentation: ${(fragmentation.max_fragmentation * 100).toFixed(1)}%`);
        console.log(`Min fragmentation: ${(fragmentation.min_fragmentation * 100).toFixed(1)}%`);
        console.log(`Average fragmentation: ${(fragmentation.average_fragmentation * 100).toFixed(1)}%`);
        console.log(`\nRecent fragmentation timeline:`);
        console.log(JSON.stringify(fragmentation.timeline.slice(-10).reverse(), null, 2));
        break;
      }

      case 'report': {
        const outputArg = args.indexOf('--output');
        const outputFile = outputArg !== -1 ? args[outputArg + 1] : 'babel-report.json';
        
        const report = ReportGenerator.generateComprehensiveReport(auditChain);
        fs.writeFileSync(outputFile, JSON.stringify(report, null, 2));
        console.log(`\nReport generated: ${outputFile}`);
        console.log(`\nSummary:`);
        console.log(`- Audit chain entries: ${report.metadata.audit_chain_entries}`);
        console.log(`- Time span: ${report.metadata.time_span_seconds}s`);
        console.log(`- Linguistic isolates: ${report.metadata.total_isolates_extracted}`);
        console.log(`- Convergence moments: ${report.convergence_analysis.total_convergence_moments}`);
        console.log(`- Current fragmentation: ${(report.convergence_analysis.recent_fragmentation_ratio * 100).toFixed(1)}%`);
        break;
      }

      case 'detect-compromise': {
        const isolates = LinguisticIsolateExtractor.extractIsolates(auditChain);
        const byValidator = LinguisticIsolateExtractor.groupByValidator(isolates);
        const disagreement = CompromiseDetector.findDisagreeingValidators(auditChain);
        
        console.log(`\n=== COMPROMISE DETECTION ===\n`);
        console.log(`Validator disagreement ranking:`);
        console.log(JSON.stringify(disagreement, null, 2));
        
        console.log(`\n\nValidator consistency analysis:`);
        Object.keys(byValidator).forEach(validatorId => {
          const consistency = CompromiseDetector.analyzeValidatorConsistency(byValidator[validatorId]);
          if (consistency.risk_assessment === 'elevated') {
            console.log(`\n${validatorId}: ELEVATED RISK`);
            console.log(JSON.stringify(consistency.anomalies, null, 2));
          }
        });
        break;
      }

      default:
        console.error(`Unknown command: ${command}`);
        printUsage();
        process.exit(1);
    }
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

main();
