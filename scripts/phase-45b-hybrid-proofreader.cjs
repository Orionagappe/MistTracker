#!/usr/bin/env node
/**
 * PHASE 45B: HYBRID DOMAIN-CUSTOMIZED PROOFREADER
 * 
 * Applies clarity metrics with domain-specific customization:
 * - Generic base: 4 metrics from Phase 44 (Ambiguity, Precision, Scope, Logic)
 * - Domain-specific: Prioritizes and adds domain-relevant metrics
 * 
 * Output includes:
 * - Original | Proofread | Reasoning (side-by-side)
 * - Clarity score (0-100%)
 * - Domain-specific metric breakdown
 */

const fs = require('fs');
const path = require('path');

// ============================================================================
// GENERIC BASE METRICS
// ============================================================================

const baseMetrics = {
  ambiguityReduction: {
    name: 'Ambiguity Reduction',
    weight: 1,
    description: 'Remove ambiguous disjunctions, clarify scope'
  },
  technicalPrecision: {
    name: 'Technical Precision',
    weight: 1,
    description: 'Define key terms explicitly'
  },
  scopeClarity: {
    name: 'Scope Clarity',
    weight: 1,
    description: 'Specify domain boundaries'
  },
  logicalStructure: {
    name: 'Logical Structure',
    weight: 1,
    description: 'Ensure if-then and necessary-sufficient clear'
  }
};

// ============================================================================
// DOMAIN-SPECIFIC CUSTOMIZATIONS
// ============================================================================

const domainCustomizations = {
  Epistemology: {
    priorityMetrics: ['technicalPrecision', 'scopeClarity'],
    domainSpecific: {
      justificationClarity: {
        name: 'Justification Clarity',
        description: 'Distinguish reasons from evidence from grounds',
        weight: 1.5,
        keywords: ['justified', 'justification', 'reason', 'evidence']
      }
    },
    termDefinitions: {
      'knowledge': 'justified true belief (or equivalent)',
      'justification': 'sufficient rational support for belief',
      'belief': 'mental state directed at a proposition',
      'skepticism': 'position that knowledge is impossible or severely limited'
    }
  },

  Logic: {
    priorityMetrics: ['logicalStructure', 'technicalPrecision'],
    domainSpecific: {
      formalVsSemanticClarity: {
        name: 'Formal vs Semantic Clarity',
        description: 'Distinguish formal properties from semantic content',
        weight: 1.5,
        keywords: ['valid', 'formal', 'semantic', 'structure', 'meaning']
      }
    },
    termDefinitions: {
      'validity': 'if premises are true then conclusion must be true',
      'logical consequence': 'conclusion follows necessarily from premises',
      'law of logic': 'principle that all valid inferences must respect'
    }
  },

  Metaphysics: {
    priorityMetrics: ['scopeClarity', 'technicalPrecision'],
    domainSpecific: {
      ontologicalClarity: {
        name: 'Ontological Clarity',
        description: 'Specify what counts as existing, as real',
        weight: 1.5,
        keywords: ['exist', 'reality', 'real', 'object', 'property']
      }
    },
    termDefinitions: {
      'existence': 'having a determinate place in reality',
      'abstract': 'not located in space-time',
      'concrete': 'located in space and time',
      'substance': 'thing that can exist independently'
    }
  },

  'Philosophy of Mind': {
    priorityMetrics: ['technicalPrecision', 'logicalStructure'],
    domainSpecific: {
      qualiaPhenomenonClarity: {
        name: 'Qualia/Phenomenology Clarity',
        description: 'Distinguish objective properties from subjective feel',
        weight: 1.5,
        keywords: ['consciousness', 'qualia', 'subjective', 'experience', 'feel']
      }
    },
    termDefinitions: {
      'consciousness': 'property of having subjective experience',
      'qualia': 'qualitative, felt properties of experience',
      'mental state': 'internal condition with intentional content',
      'intentionality': 'property of being about or directed at something'
    }
  },

  Aesthetics: {
    priorityMetrics: ['scopeClarity', 'ambiguityReduction'],
    domainSpecific: {
      objectiveVsSubjectiveClarity: {
        name: 'Objective vs Subjective Clarity',
        description: 'Distinguish aesthetic properties from aesthetic judgments',
        weight: 1.5,
        keywords: ['beautiful', 'ugly', 'aesthetic', 'subjective', 'objective']
      }
    },
    termDefinitions: {
      'beauty': 'aesthetic property of object (or response to it)',
      'aesthetic': 'pertaining to perception and appreciation',
      'taste': 'capacity for aesthetic discrimination',
      'art': 'intentionally created object for aesthetic appreciation'
    }
  },

  'Political Philosophy': {
    priorityMetrics: ['scopeClarity', 'technicalPrecision'],
    domainSpecific: {
      normativeScopeClarity: {
        name: 'Normative Scope Clarity',
        description: 'Specify who is bound by principle, when, why',
        weight: 1.5,
        keywords: ['should', 'ought', 'duty', 'right', 'authority', 'justice']
      }
    },
    termDefinitions: {
      'authority': 'legitimate right to command obedience',
      'justice': 'fair distribution of benefits and burdens',
      'right': 'entitlement to something, protected by law/morality',
      'freedom': 'absence of interference (negative) or capacity (positive)'
    }
  },

  'Philosophy of Science': {
    priorityMetrics: ['technicalPrecision', 'logicalStructure'],
    domainSpecific: {
      operationalizationClarity: {
        name: 'Operationalization Clarity',
        description: 'Specify how claims connect to observations',
        weight: 1.5,
        keywords: ['observe', 'measure', 'experiment', 'test', 'evidence']
      }
    },
    termDefinitions: {
      'scientific law': 'universal principle governing natural processes',
      'explanation': 'account of why something is the case',
      'theory': 'comprehensive framework explaining phenomena',
      'realism': 'view that theories describe reality as it is'
    }
  },

  'Philosophy of Mathematics': {
    priorityMetrics: ['technicalPrecision', 'logicalStructure'],
    domainSpecific: {
      abstractVsConcreteClarity: {
        name: 'Abstract vs Concrete Clarity',
        description: 'Distinguish mathematical objects from physical instances',
        weight: 1.5,
        keywords: ['number', 'abstract', 'infinity', 'mathematical', 'concrete']
      }
    },
    termDefinitions: {
      'number': 'abstract object in mathematical domain',
      'infinity': 'unbounded quantity (potential or actual)',
      'truth': 'theorems derivable from axioms',
      'Platonism': 'view that mathematical objects exist independently'
    }
  },

  'Philosophy of Language': {
    priorityMetrics: ['technicalPrecision', 'scopeClarity'],
    domainSpecific: {
      semanticVsPragmaticClarity: {
        name: 'Semantic vs Pragmatic Clarity',
        description: 'Distinguish linguistic meaning from use',
        weight: 1.5,
        keywords: ['meaning', 'reference', 'truth', 'context', 'use']
      }
    },
    termDefinitions: {
      'meaning': 'semantic content of words/sentences',
      'reference': 'relation between sign and object',
      'truth-condition': 'condition under which sentence is true',
      'pragmatics': 'study of meaning in context'
    }
  }
};

// ============================================================================
// PROOFREADING ENGINE
// ============================================================================

function calculateClarityScore(question, issues, appliedMetrics) {
  // Base score: 100
  let score = 100;

  // Deductions for issues
  const issueDeduction = Math.min(issues.length * 8, 40); // Max 40 point deduction
  score -= issueDeduction;

  // Bonuses for applied metrics
  const metricBonus = Math.min(appliedMetrics.length * 3, 15); // Max 15 point bonus
  score += metricBonus;

  return Math.max(0, Math.min(100, score));
}

function analyzeForClarity(question, domainName) {
  const issues = [];
  const appliedMetrics = [];

  // Generic issue detection
  const orCount = (question.match(/\s+or\s+/gi) || []).length;
  if (orCount > 1) {
    issues.push({
      type: 'ambiguity',
      severity: 'high',
      description: `Multiple disjunctions (${orCount}) create ambiguity`
    });
  }

  // Scope ambiguity checks
  if ((question.includes('can') || question.includes('must')) && !question.includes('logically')) {
    issues.push({
      type: 'scope',
      severity: 'medium',
      description: 'Scope unclear: logically possible vs practically feasible?'
    });
  }

  // Domain-specific term checking
  const customization = domainCustomizations[domainName];
  if (customization) {
    Object.entries(customization.termDefinitions).forEach(([term, def]) => {
      if (question.toLowerCase().includes(term) && !question.includes(`[${term}`)) {
        issues.push({
          type: 'precision',
          severity: 'medium',
          description: `Term "${term}" used without explicit definition`
        });
      }
    });
  }

  return { issues, appliedMetrics };
}

function proofreadQuestion(original, domain, subdomain, domainName) {
  const analysis = analyzeForClarity(original, domainName);
  const issues = analysis.issues;
  const appliedMetrics = [];

  let proofread = original;
  const changes = [];

  // Get domain customization
  const customization = domainCustomizations[domainName] || {};
  const priorityMetrics = customization.priorityMetrics || [];

  // Apply priority metrics first
  if (priorityMetrics.includes('technicalPrecision')) {
    if (customization.termDefinitions) {
      Object.entries(customization.termDefinitions).forEach(([term, def]) => {
        if (proofread.toLowerCase().includes(term) && !proofread.includes(`[${term}:`)) {
          const oldProofread = proofread;
          proofread = proofread.replace(
            new RegExp(`\\b${term}\\b`, 'i'),
            `[${term}: ${def}]`
          );
          if (proofread !== oldProofread) {
            appliedMetrics.push('Technical Precision');
            changes.push({
              type: 'Technical Precision',
              original: term,
              change: `Add definition: [${term}: ${def}]`,
              reason: `Domain requires explicit definition of "${term}" to prevent equivocation`
            });
          }
        }
      });
    }
  }

  if (priorityMetrics.includes('scopeClarity')) {
    if (proofread.includes('can') && !proofread.includes('logically possible')) {
      const oldProofread = proofread;
      proofread = proofread.replace(
        /can\s+(\w+)\s+be/gi,
        'is it logically possible for $1 to be'
      );
      if (proofread !== oldProofread) {
        appliedMetrics.push('Scope Clarity');
        changes.push({
          type: 'Scope Clarity',
          original: 'can X be',
          change: 'is it logically possible for X to be',
          reason: 'Disambiguates between logical possibility and practical feasibility'
        });
      }
    }
  }

  if (priorityMetrics.includes('ambiguityReduction')) {
    if (proofread.includes(' or is it ')) {
      const oldProofread = proofread;
      proofread = proofread.replace(/ or is it /gi, ' versus ');
      if (proofread !== oldProofread) {
        appliedMetrics.push('Ambiguity Reduction');
        changes.push({
          type: 'Ambiguity Reduction',
          original: 'X or is it Y',
          change: 'X versus Y',
          reason: 'Clarifies exclusive contrast, removing ambiguity about mutual exclusivity'
        });
      }
    }
  }

  if (priorityMetrics.includes('logicalStructure')) {
    if (proofread.includes(' if ') && !proofread.includes(' then ')) {
      const oldProofread = proofread;
      proofread = proofread.replace(
        /if\s+([^?]+)\?/,
        'if $1, [then what follows?]'
      );
      if (proofread !== oldProofread) {
        appliedMetrics.push('Logical Structure');
        changes.push({
          type: 'Logical Structure',
          original: 'if X?',
          change: 'if X, [then what follows?]',
          reason: 'Makes explicit that conditional requires consequent to be fully formed'
        });
      }
    }
  }

  const clarityScore = calculateClarityScore(original, issues, [...new Set(appliedMetrics)]);

  return {
    original,
    proofread,
    changes,
    issues_detected: issues.length,
    clarity_score: clarityScore,
    metrics_applied: [...new Set(appliedMetrics)],
    domain_customization: customization.priorityMetrics || [],
    reasoning: `Applied ${changes.length} clarity improvements using ${customization.priorityMetrics?.length || 0} priority metrics for ${domainName}`
  };
}

// ============================================================================
// BATCH PROOFREADING
// ============================================================================

function proofreadAllQuestions() {
  console.log('\n' + '='.repeat(80));
  console.log('PHASE 45B: HYBRID DOMAIN-CUSTOMIZED PROOFREADER');
  console.log('Applying Clarity Metrics with Domain-Specific Customizations');
  console.log('='.repeat(80));

  // Load generated questions
  const questionsPath = './phase-45-results/PHASE-45A-RATIONAL-DOMAINS-QUESTIONS.json';
  const questionsData = JSON.parse(fs.readFileSync(questionsPath, 'utf-8'));

  const allQuestions = questionsData.all_questions;
  const proofreaderResults = [];
  const metricUsage = {};

  // Proofread each question
  allQuestions.forEach((question, idx) => {
    const result = proofreadQuestion(question.question, question.domain, question.subdomain, question.domain);
    
    // Track metric usage
    result.metrics_applied.forEach(metric => {
      metricUsage[metric] = (metricUsage[metric] || 0) + 1;
    });

    proofreaderResults.push({
      id: question.id,
      domain: question.domain,
      subdomain: question.subdomain,
      ...result,
      keywords: question.keywords,
      semantic_depth: question.semantic_depth
    });

    // Show progress
    if ((idx + 1) % 10 === 0) {
      console.log(`\n✓ Processed ${idx + 1}/${allQuestions.length} questions\n`);
    }
  });

  // Summary statistics
  console.log(`\n${'═'.repeat(80)}`);
  console.log('PROOFREADING SUMMARY\n');

  const avgClarityScore = proofreaderResults.reduce((sum, r) => sum + r.clarity_score, 0) / proofreaderResults.length;
  const avgChanges = proofreaderResults.reduce((sum, r) => sum + r.changes.length, 0) / proofreaderResults.length;

  console.log(`Questions Proofread: ${proofreaderResults.length}`);
  console.log(`Average Clarity Score: ${avgClarityScore.toFixed(1)}/100`);
  console.log(`Average Changes per Question: ${avgChanges.toFixed(1)}`);
  console.log(`Total Clarity Improvements: ${proofreaderResults.reduce((sum, r) => sum + r.changes.length, 0)}`);

  console.log(`\nMetric Application Frequency:`);
  Object.entries(metricUsage).forEach(([metric, count]) => {
    console.log(`  ${metric}: ${count}/${proofreaderResults.length} questions (${(count/proofreaderResults.length*100).toFixed(0)}%)`);
  });

  // Domain-specific statistics
  console.log(`\nClarity Scores by Domain:`);
  const domainStats = {};
  proofreaderResults.forEach(result => {
    if (!domainStats[result.domain]) {
      domainStats[result.domain] = { scores: [], count: 0 };
    }
    domainStats[result.domain].scores.push(result.clarity_score);
    domainStats[result.domain].count++;
  });

  Object.entries(domainStats).forEach(([domain, stats]) => {
    const avgScore = stats.scores.reduce((a, b) => a + b) / stats.scores.length;
    const minScore = Math.min(...stats.scores);
    const maxScore = Math.max(...stats.scores);
    console.log(`  ${domain}: avg ${avgScore.toFixed(1)}, range [${minScore}-${maxScore}]`);
  });

  console.log(`\n${'═'.repeat(80)}\n`);

  return {
    timestamp: new Date().toISOString(),
    phase: 45,
    subphase: 'B',
    total_questions_proofread: proofreaderResults.length,
    average_clarity_score: parseFloat(avgClarityScore.toFixed(1)),
    average_changes_per_question: parseFloat(avgChanges.toFixed(1)),
    total_clarity_improvements: proofreaderResults.reduce((sum, r) => sum + r.changes.length, 0),
    metric_usage: metricUsage,
    domain_statistics: domainStats,
    proofread_questions: proofreaderResults
  };
}

// ============================================================================
// MAIN
// ============================================================================

if (require.main === module) {
  const result = proofreadAllQuestions();

  // Save results
  fs.writeFileSync(
    path.join('./phase-45-results', 'PHASE-45B-PROOFREAD-RATIONAL-QUESTIONS.json'),
    JSON.stringify(result, null, 2)
  );

  console.log(`✅ Proofreading complete. Results saved to: phase-45-results/PHASE-45B-PROOFREAD-RATIONAL-QUESTIONS.json`);

  process.exit(0);
}

module.exports = {
  domainCustomizations,
  proofreadQuestion,
  proofreadAllQuestions
};
