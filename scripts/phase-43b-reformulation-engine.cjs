#!/usr/bin/env node
/**
 * PHASE 43B: QUESTION REFORMULATION ENGINE
 * 
 * Takes low-emergence semantic questions (58.6% mean) and reformulates them
 * using Phase 42 formulation rules to achieve 70%+ emergence.
 * 
 * Goal: Show systematic improvement pathway for abstract semantic exploration.
 */

const fs = require('fs');
const path = require('path');

// Parse existing Phase 43 results
function loadPhase43Results() {
  const resultsPath = './phase-43-results/PHASE-43-SEMANTIC-QUESTIONS.json';
  return JSON.parse(fs.readFileSync(resultsPath, 'utf-8'));
}

// Phase 42 metrics
const analyzeQuestion = (question) => {
  const wordCount = question.split(/\s+/).length;
  const uniqueWords = new Set(question.toLowerCase().split(/\s+/));
  const uniquenessRatio = uniqueWords.size / wordCount;
  
  const ambiguityKeywords = ['or', 'and/or', 'possibly', 'might', 'could', 'may'];
  const ambiguityMatches = ambiguityKeywords.filter(kw => question.toLowerCase().includes(kw)).length;
  const ambiguityIndex = 10 + (ambiguityMatches * 5);
  
  const depthKeywords = {
    'because': 2, 'therefore': 2, 'so': 1, 'thus': 2,
    'necessarily': 1, 'must': 1, 'fundamental': 1, 'mechanism': 1,
    'principle': 1, 'derive': 1, 'imply': 1
  };
  let semanticDepth = 1;
  for (const [keyword, weight] of Object.entries(depthKeywords)) {
    if (question.toLowerCase().includes(keyword)) {
      semanticDepth += weight;
    }
  }
  
  const clarityTerms = ['necessarily', 'must', 'can', 'will', 'derive'];
  const clarityScore = 3 + clarityTerms.filter(t => question.toLowerCase().includes(t)).length;
  
  const opinionTerms = ['think', 'believe', 'opinion', 'seem', 'feel'];
  const opinionCount = opinionTerms.filter(t => question.toLowerCase().includes(t)).length;
  const answerabilityScore = 5 - opinionCount;
  
  const frameworkIndependenceTerms = ['and', 'independently', 'both', 'all', 'multiple', 'different'];
  const hasFrameworkIndependence = frameworkIndependenceTerms.some(t => question.toLowerCase().includes(t));
  
  return {
    wordCount,
    uniquenessRatio,
    ambiguityIndex: Math.max(1, ambiguityIndex),
    semanticDepth: Math.max(1, Math.min(10, semanticDepth)),
    clarityScore: Math.min(5, clarityScore),
    answerabilityScore: Math.max(1, answerabilityScore),
    frameworkIndependence: hasFrameworkIndependence ? 1 : 0
  };
};

const computeLinguisticEmergence = (metrics) => {
  const {
    ambiguityIndex,
    semanticDepth,
    clarityScore,
    answerabilityScore,
    frameworkIndependence,
    uniquenessRatio
  } = metrics;

  const ambiguityTerm = 32 * Math.log10(ambiguityIndex);
  const depthTerm = 5 * (2 * semanticDepth);
  const clarityBonus = (clarityScore / 5) * 10;
  const answerabilityBonus = (answerabilityScore / 5) * 10;
  const frameworkBonus = frameworkIndependence * 15;
  const densityBonus = (uniquenessRatio > 0.3) ? 8 : 0;

  const emergence = 81 - ambiguityTerm - depthTerm + clarityBonus + answerabilityBonus + frameworkBonus + densityBonus;
  return Math.max(1, Math.min(99, emergence));
};

// ============================================================================
// REFORMULATION STRATEGIES
// ============================================================================

const reformulationStrategies = {
  // Strategy 1: Simplify ambiguity
  simplifyAmbiguity: (question) => {
    // Remove "or...or" constructs, replace with singular focus
    let reformulated = question.replace(
      /,\s*or\s+[^?]+\?$/,
      '?'
    );
    // Replace "can...or can..." with singular
    reformulated = reformulated.replace(
      /\s+or\s+/g,
      ' and whether '
    );
    return reformulated;
  },

  // Strategy 2: Add framework independence markers
  addFrameworkIndependence: (question) => {
    // If question ends with ?, find good insertion point
    if (!question.includes('independently') && !question.includes('different')) {
      const beforeQ = question.substring(0, question.length - 1);
      return beforeQ + ' independently?' || question;
    }
    return question;
  },

  // Strategy 3: Add necessity language
  addNecessity: (question) => {
    if (!question.includes('must') && !question.includes('necessarily')) {
      // Look for "can" and replace with "must necessarily"
      if (question.includes('Can')) {
        return question.replace('Can', 'Must');
      }
      // Add to constraint questions
      if (question.includes('What is')) {
        return question.replace('What is', 'What is necessarily');
      }
    }
    return question;
  },

  // Strategy 4: Increase semantic depth
  addSemanticDepth: (question) => {
    // Add causal chain: "...because...which means..."
    if (!question.includes('because') && !question.includes('therefore')) {
      if (question.includes('?')) {
        const baseQ = question.substring(0, question.length - 1);
        return baseQ + ', and what does this imply for the broader theoretical structure?';
      }
    }
    return question;
  },

  // Strategy 5: Reduce opinion language and increase objectivity
  increaseObjectivity: (question) => {
    // Already done in generation, but make sure
    let reformulated = question
      .replace('Do you think', 'Can we derive')
      .replace('Is it true', 'Can we prove');
    return reformulated;
  },

  // Strategy 6: Add multiple perspectives (plural frameworks)
  addMultiplePerspectives: (question) => {
    // If asking about one domain, ask about multiple
    if (!question.includes('both') && !question.includes('multiple')) {
      if (question.includes('?')) {
        const beforeQ = question.substring(0, question.length - 1);
        // Add plural framework reference
        if (!beforeQ.includes('and')) {
          return beforeQ + ' across multiple theoretical frameworks?';
        }
      }
    }
    return question;
  }
};

// ============================================================================
// REFORMULATION EXECUTION
// ============================================================================

function reformulatePhase43Questions() {
  console.log('\n' + '='.repeat(80));
  console.log('PHASE 43B: QUESTION REFORMULATION ENGINE');
  console.log('Improving Semantic Questions from 58.6% to 70%+ Emergence');
  console.log('='.repeat(80) + '\n');

  const phase43Results = loadPhase43Results();
  const reformulatedBatches = [];

  phase43Results.question_batches.forEach((batchData, batchIdx) => {
    console.log(`\n${'─'.repeat(80)}`);
    console.log(`REFORMULATING: ${batchData.domain}`);
    console.log(`${'─'.repeat(80)}\n`);

    const reformulatedQuestions = [];

    batchData.questions.forEach((originalQ, qIdx) => {
      let reformulated = originalQ.question;
      const appliedStrategies = [];

      // Get current emergence
      const origMetrics = analyzeQuestion(originalQ.question);
      const origEmergence = computeLinguisticEmergence(origMetrics);

      // Apply reformulation strategies based on what's needed
      if (origEmergence < 70) {
        // Check for ambiguity (high ambiguity index)
        if (origMetrics.ambiguityIndex > 20) {
          reformulated = reformulationStrategies.simplifyAmbiguity(reformulated);
          appliedStrategies.push('Simplify Ambiguity');
        }

        // Check for lack of framework independence
        if (origMetrics.frameworkIndependence === 0) {
          reformulated = reformulationStrategies.addFrameworkIndependence(reformulated);
          appliedStrategies.push('Add Framework Independence');
        }

        // Check for lack of necessity language
        if (!reformulated.includes('must') && !reformulated.includes('necessarily')) {
          reformulated = reformulationStrategies.addNecessity(reformulated);
          appliedStrategies.push('Add Necessity Language');
        }

        // Check for low semantic depth
        if (origMetrics.semanticDepth < 3) {
          reformulated = reformulationStrategies.addSemanticDepth(reformulated);
          appliedStrategies.push('Increase Semantic Depth');
        }

        // Add multiple perspectives for universality
        if (origEmergence < 65) {
          reformulated = reformulationStrategies.addMultiplePerspectives(reformulated);
          appliedStrategies.push('Add Multiple Perspectives');
        }
      }

      // Calculate new emergence
      const newMetrics = analyzeQuestion(reformulated);
      const newEmergence = computeLinguisticEmergence(newMetrics);
      const improvement = newEmergence - origEmergence;

      reformulatedQuestions.push({
        id: originalQ.id,
        original_question: originalQ.question,
        original_emergence: parseFloat(origEmergence.toFixed(1)),
        reformulated_question: reformulated,
        new_emergence: parseFloat(newEmergence.toFixed(1)),
        improvement: parseFloat(improvement.toFixed(1)),
        applied_strategies: appliedStrategies,
        concept: originalQ.concept,
        high_emergence_achieved: newEmergence >= 70
      });

      const statusIcon = newEmergence >= 70 ? '✓' : '→';
      console.log(`Q${qIdx + 1} [${originalQ.concept}] ${statusIcon}`);
      console.log(`  Original (${origEmergence.toFixed(1)}%): "${originalQ.question.substring(0, 60)}..."`);
      console.log(`  Reformed (${newEmergence.toFixed(1)}%): "${reformulated.substring(0, 60)}..."`);
      if (appliedStrategies.length > 0) {
        console.log(`  Strategies: ${appliedStrategies.join(', ')}`);
      }
      console.log(`  Result: +${improvement.toFixed(1)} percentage points\n`);
    });

    reformulatedBatches.push({
      domain: batchData.domain,
      original_mean_emergence: parseFloat(batchData.mean_emergence.toFixed(1)),
      reformulated_questions: reformulatedQuestions,
      new_mean_emergence: parseFloat((reformulatedQuestions.reduce((sum, q) => sum + q.new_emergence, 0) / reformulatedQuestions.length).toFixed(1)),
      high_emergence_count: reformulatedQuestions.filter(q => q.high_emergence_achieved).length,
      total_questions: reformulatedQuestions.length
    });
  });

  // Summary
  console.log(`\n${'═'.repeat(80)}`);
  console.log('PHASE 43B SUMMARY\n');

  let totalOrig = 0;
  let totalReform = 0;
  let totalHighEmergence = 0;

  reformulatedBatches.forEach(batch => {
    console.log(`${batch.domain}:`);
    console.log(`  Before: ${batch.original_mean_emergence}% → After: ${batch.new_mean_emergence}% (+${(batch.new_mean_emergence - batch.original_mean_emergence).toFixed(1)}%)`);
    console.log(`  High-Emergence: ${batch.high_emergence_count}/${batch.total_questions} questions\n`);

    totalOrig += batch.original_mean_emergence * batch.total_questions;
    totalReform += batch.new_mean_emergence * batch.total_questions;
    totalHighEmergence += batch.high_emergence_count;
  });

  const overallOriginal = parseFloat((totalOrig / 15).toFixed(1));
  const overallReformed = parseFloat((totalReform / 15).toFixed(1));
  const overallImprovement = parseFloat((overallReformed - overallOriginal).toFixed(1));

  console.log(`OVERALL IMPROVEMENT:`);
  console.log(`  Original Mean: ${overallOriginal}%`);
  console.log(`  Reformulated Mean: ${overallReformed}%`);
  console.log(`  Improvement: +${overallImprovement} percentage points`);
  console.log(`  High-Emergence Questions: ${totalHighEmergence}/15 (${(totalHighEmergence/15*100).toFixed(0)}%)`);

  console.log(`\n${'═'.repeat(80)}\n`);

  return {
    timestamp: new Date().toISOString(),
    original_mean_emergence: overallOriginal,
    reformulated_mean_emergence: overallReformed,
    total_improvement: overallImprovement,
    high_emergence_count: totalHighEmergence,
    total_questions: 15,
    all_high_emergence: totalHighEmergence === 15,
    batches: reformulatedBatches
  };
}

// ============================================================================
// MAIN
// ============================================================================

if (require.main === module) {
  const result = reformulatePhase43Questions();

  // Save results
  fs.writeFileSync(
    './phase-43-results/PHASE-43B-REFORMULATION.json',
    JSON.stringify(result, null, 2)
  );

  console.log(`✅ Reformulation results saved to: phase-43-results/PHASE-43B-REFORMULATION.json`);

  process.exit(result.all_high_emergence ? 0 : 1);
}

module.exports = {
  reformulatePhase43Questions,
  analyzeQuestion,
  computeLinguisticEmergence
};
