#!/usr/bin/env node
/**
 * PHASE 44B: ETHICS PROOFREADING ENGINE
 * 
 * Applies clarity metrics to ethics questions:
 * - Ambiguity Reduction (remove 'or...or', clarify scope)
 * - Technical Precision (define terms explicitly)
 * - Scope Clarity (specify boundaries, list inclusions)
 * - Logical Structure (ensure if-then, necessary-sufficient clear)
 * 
 * Output: Original question with proofread version including inline comments
 * explaining each change and reasoning.
 */

const fs = require('fs');
const path = require('path');

// ============================================================================
// CLARITY METRICS AND PROOFREADING RULES
// ============================================================================

/**
 * Proofreading rules that enhance clarity WITHOUT using Phase 42 empirical bias
 * Focus: Making implicit assumptions explicit, disambiguating scope, clarifying logic
 */

const proofreaderRules = {
  ambiguityReduction: {
    name: 'Ambiguity Reduction',
    description: 'Remove ambiguous "or" constructs, clarify scope boundaries',
    transformations: [
      {
        pattern: /or (is it|does it|can it)/gi,
        replacement: 'versus',
        reason: 'Replaces "or is it" with "versus" to clearly signal exclusive contrast rather than inclusive disjunction'
      },
      {
        pattern: /independently (of|or from)/gi,
        replacement: 'independently of',
        reason: 'Standardizes phrasing to remove ambiguity between "of" and "or from"'
      },
      {
        pattern: /can (\w+) (only|necessarily)/gi,
        replacement: 'must $1 $2',
        reason: 'Clarifies scope: "can only" (possibility constraint) vs "must" (necessity)'
      }
    ]
  },

  technicalPrecision: {
    name: 'Technical Precision',
    description: 'Define key terms explicitly before use, clarify philosophical framework',
    transformations: [
      {
        term: 'moral property',
        explicit_definition: 'a characteristic that exists independently of human perception or judgment',
        reason: 'Defines what counts as "moral property" to avoid ambiguity between abstract and concrete properties'
      },
      {
        term: 'moral truth',
        explicit_definition: 'a proposition about morality that obtains regardless of human agreement',
        reason: 'Clarifies that moral truth is understood as mind-independent, paralleling scientific truth'
      },
      {
        term: 'free will',
        explicit_definition: 'the capacity to act without prior causal determination',
        reason: 'Specifies libertarian conception of free will to avoid compatibilist reinterpretation'
      }
    ]
  },

  scopeClarity: {
    name: 'Scope Clarity',
    description: 'Specify domain boundaries, indicate what is included/excluded',
    transformations: [
      {
        pattern: /in (all|any) (systems|contexts|cases)/gi,
        replacement: 'within the domain of',
        reason: 'Clarifies whether claim is universal or domain-specific by explicitly scoping'
      },
      {
        pattern: /necessarily/gi,
        replacement: '[necessarily - in all logically possible cases]',
        reason: 'Clarifies that necessity is logical necessity, not just practical constraint'
      }
    ]
  },

  logicalStructure: {
    name: 'Logical Structure',
    description: 'Make implicit if-then relationships explicit, clarify necessary vs sufficient conditions',
    transformations: [
      {
        pattern: /does (.+) require|must (.+) necessarily/gi,
        replacement: 'is it the case that $1 requires OR $2 necessarily',
        reason: 'Makes explicit the two-part logical structure: (a) is it required? (b) must it obtain?'
      }
    ]
  }
};

// ============================================================================
// PROOFREADING ENGINE
// ============================================================================

function analyzeForClarity(question) {
  const issues = [];

  // Check for common ambiguities
  const orCount = (question.match(/\s+or\s+/gi) || []).length;
  if (orCount > 1) {
    issues.push({
      type: 'ambiguity',
      severity: 'high',
      description: `Multiple disjunctions (${orCount} "or" instances) create ambiguity about scope`,
      suggestion: 'Use "versus" for exclusive contrast or restructure as separate questions'
    });
  }

  // Check for undefined technical terms
  const technicalTerms = [
    'moral property', 'moral truth', 'moral knowledge', 'moral realism',
    'consequentialism', 'deontology', 'virtue', 'free will', 'agency',
    'responsibility', 'autonomy', 'beneficence', 'justice'
  ];

  technicalTerms.forEach(term => {
    if (question.toLowerCase().includes(term)) {
      issues.push({
        type: 'precision',
        severity: 'medium',
        description: `Uses technical term "${term}" without explicit definition`,
        suggestion: `Define "${term}" at first use to prevent philosophical ambiguity`
      });
    }
  });

  // Check for scope ambiguity (universal vs particular claims)
  if (question.includes('can') && !question.includes('necessarily') && !question.includes('must')) {
    issues.push({
      type: 'scope',
      severity: 'medium',
      description: 'Uses "can" without clarifying scope—is this possibility or frequency claim?',
      suggestion: 'Clarify: "Is it logically possible that..." vs "Does it typically occur that..."'
    });
  }

  // Check for implicit logical structure
  if (question.includes('if') && !question.includes('then')) {
    issues.push({
      type: 'logic',
      severity: 'low',
      description: 'Conditional introduced but conclusion not explicit',
      suggestion: 'Complete if-then structure or restructure as separate claims'
    });
  }

  return issues;
}

function proofreadQuestion(original, domain, subdomain) {
  console.log(`\n${'─'.repeat(80)}`);
  console.log(`PROOFREADING: ${domain} → ${subdomain}`);
  console.log(`${'─'.repeat(80)}\n`);

  // Analyze for issues
  const issues = analyzeForClarity(original);

  console.log(`ORIGINAL QUESTION:\n"${original}"\n`);

  if (issues.length === 0) {
    console.log('Status: ✓ Clear and well-formed. No major ambiguities detected.\n');
    return {
      original,
      proofread: original,
      changes: [],
      reasoning: 'Question already exhibits good clarity across all metrics.'
    };
  }

  console.log('DETECTED ISSUES:\n');
  issues.forEach((issue, idx) => {
    console.log(`${idx + 1}. [${issue.type.toUpperCase()}] ${issue.description}`);
    console.log(`   Severity: ${issue.severity}`);
    console.log(`   Suggestion: ${issue.suggestion}\n`);
  });

  // Generate proofread version with inline comments
  let proofread = original;
  const changes = [];

  // Apply transformations based on issues
  issues.forEach(issue => {
    if (issue.type === 'ambiguity') {
      // Replace "or is it" patterns
      const originalLength = proofread.length;
      proofread = proofread.replace(
        /(\w+)\s+or\s+is\s+it\s+(\w+)/gi,
        '$1 versus $2 [CLARIFIED: exclusive contrast]'
      );
      if (proofread.length > originalLength) {
        changes.push({
          type: 'Ambiguity Reduction',
          original: original,
          change: 'Replaced "or is it" with "versus" to signal exclusive contrast',
          reason: 'The original disjunction ("or") could be inclusive; "versus" clarifies this is a choice between alternatives'
        });
      }
    }

    if (issue.type === 'precision') {
      // Mark technical terms for definition
      issues.filter(i => i.type === 'precision').forEach(precIssue => {
        const termMatch = precIssue.description.match(/"([^"]+)"/);
        if (termMatch) {
          const term = termMatch[1];
          proofread = proofread.replace(
            new RegExp(`\\b${term}\\b`, 'gi'),
            `[${term}]`
          );
          changes.push({
            type: 'Technical Precision',
            original: term,
            change: `Mark term for explicit definition: [${term}]`,
            reason: `Technical terms in philosophy require definition to prevent equivocation. The term "${term}" has multiple interpretations in philosophical discourse.`
          });
        }
      });
    }

    if (issue.type === 'scope') {
      // Clarify scope
      if (proofread.includes('can')) {
        proofread = proofread.replace(
          /can\s+(\w+)\s+be/gi,
          'is it logically possible for $1 to be'
        );
        changes.push({
          type: 'Scope Clarity',
          original: 'can X be',
          change: 'is it logically possible for X to be',
          reason: '"Can" is ambiguous between possibility (logically feasible) and frequency (commonly occurs). "Is it logically possible" clarifies this is about possibility, not frequency.'
        });
      }
    }

    if (issue.type === 'logic') {
      // Clarify logical structure
      if (proofread.includes(' if ') && !proofread.includes(' then ')) {
        proofread = proofread.replace(
          /if\s+([^?]+)\?/,
          'if $1, then what follows? [CLARIFY: consequent needed]'
        );
      }
    }
  });

  console.log('PROOFREADING CHANGES:\n');
  changes.forEach((change, idx) => {
    console.log(`Change ${idx + 1}: ${change.type}`);
    console.log(`  Original: ${change.original}`);
    console.log(`  Change: ${change.change}`);
    console.log(`  Reason: ${change.reason}\n`);
  });

  console.log(`PROOFREAD QUESTION:\n"${proofread}"\n`);

  return {
    original,
    proofread,
    changes,
    issues_detected: issues.length,
    clarity_metrics: {
      ambiguity_detected: issues.some(i => i.type === 'ambiguity'),
      precision_issues: issues.filter(i => i.type === 'precision').length,
      scope_clarity: !issues.some(i => i.type === 'scope'),
      logical_structure: !issues.some(i => i.type === 'logic')
    },
    reasoning: `Applied ${changes.length} clarity transformations targeting: ambiguity reduction, technical precision, scope clarity, logical structure`
  };
}

// ============================================================================
// BATCH PROOFREADING
// ============================================================================

function proofreadAllQuestions() {
  console.log('\n' + '='.repeat(80));
  console.log('PHASE 44B: ETHICS PROOFREADING ENGINE');
  console.log('Applying Clarity Metrics and Generating Proofread Questions');
  console.log('='.repeat(80));

  // Load generated questions
  const questionsPath = './phase-44-results/PHASE-44A-ETHICS-QUESTIONS.json';
  const questionsData = JSON.parse(fs.readFileSync(questionsPath, 'utf-8'));

  const allQuestions = questionsData.all_questions;
  const proofreaderResults = [];

  // Proofread each question
  allQuestions.forEach((question, idx) => {
    const result = proofreadQuestion(question.question, question.domain, question.subdomain);
    proofreaderResults.push({
      id: question.id,
      domain: question.domain,
      subdomain: question.subdomain,
      ...result,
      keywords: question.keywords,
      semantic_depth: question.semantic_depth
    });

    // Show progress
    if ((idx + 1) % 5 === 0) {
      console.log(`\n✓ Processed ${idx + 1}/${allQuestions.length} questions\n`);
    }
  });

  // Summary statistics
  console.log(`\n${'═'.repeat(80)}`);
  console.log('PROOFREADING SUMMARY\n');

  const ambiguityIssues = proofreaderResults.filter(r => r.issues_detected > 0).length;
  const avgChanges = proofreaderResults.reduce((sum, r) => sum + r.changes.length, 0) / proofreaderResults.length;

  console.log(`Questions Proofread: ${proofreaderResults.length}`);
  console.log(`Questions with Issues Detected: ${ambiguityIssues}/${proofreaderResults.length}`);
  console.log(`Average Changes per Question: ${avgChanges.toFixed(1)}`);
  console.log(`Total Clarity Improvements: ${proofreaderResults.reduce((sum, r) => sum + r.changes.length, 0)}`);

  // Breakdown by clarity metric
  const clarityMetricUsage = {
    ambiguity_reduction: proofreaderResults.filter(r => r.changes.some(c => c.type === 'Ambiguity Reduction')).length,
    technical_precision: proofreaderResults.filter(r => r.changes.some(c => c.type === 'Technical Precision')).length,
    scope_clarity: proofreaderResults.filter(r => r.changes.some(c => c.type === 'Scope Clarity')).length,
    logical_structure: proofreaderResults.filter(r => r.changes.some(c => c.type === 'Logical Structure')).length
  };

  console.log(`\nClarity Metrics Applied:`);
  console.log(`  Ambiguity Reduction: ${clarityMetricUsage.ambiguity_reduction} questions`);
  console.log(`  Technical Precision: ${clarityMetricUsage.technical_precision} questions`);
  console.log(`  Scope Clarity: ${clarityMetricUsage.scope_clarity} questions`);
  console.log(`  Logical Structure: ${clarityMetricUsage.logical_structure} questions`);

  console.log(`\n${'═'.repeat(80)}\n`);

  return {
    timestamp: new Date().toISOString(),
    phase: 44,
    subphase: 'B',
    total_questions_proofread: proofreaderResults.length,
    questions_with_issues: ambiguityIssues,
    average_changes_per_question: parseFloat(avgChanges.toFixed(1)),
    total_clarity_improvements: proofreaderResults.reduce((sum, r) => sum + r.changes.length, 0),
    clarity_metrics_applied: clarityMetricUsage,
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
    path.join('./phase-44-results', 'PHASE-44B-PROOFREAD-QUESTIONS.json'),
    JSON.stringify(result, null, 2)
  );

  console.log(`✅ Proofreading complete. Results saved to: phase-44-results/PHASE-44B-PROOFREAD-QUESTIONS.json`);

  process.exit(0);
}

module.exports = {
  proofreaderRules,
  analyzeForClarity,
  proofreadQuestion,
  proofreadAllQuestions
};
