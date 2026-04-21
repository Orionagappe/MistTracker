#!/usr/bin/env node
/**
 * PHASE 43: SEMANTIC QUESTION GENERATOR
 * 
 * Generates high-emergence questions systematically exploring three foundational
 * idea-domains in English language:
 * 1. Epistemological concepts (knowing, proof, evidence, certainty)
 * 2. Emergent concepts (complexity, pattern, order, randomness)
 * 3. Universal principles (symmetry, conservation, invariance, scale)
 * 
 * Output: High-emergence question batches (70%+ emergence) with semantic network
 * mapping showing how idea-domains interconnect.
 * 
 * Goal: Complete semantic exploration of universe through language structure.
 */

const fs = require('fs');
const path = require('path');

// ============================================================================
// PHASE 42 METRICS ENGINE (IMPORTED)
// ============================================================================

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
// PHASE 42 TEMPLATES (REFERENCE)
// ============================================================================

const templates = {
  frameworkIndependenceTest: {
    name: 'Framework Independence Test',
    pattern: 'Can [CONCEPT] be derived from [PERSPECTIVE_A] and [PERSPECTIVE_B] independently?',
    boost: 15,
    emergence: 78
  },
  necessityProof: {
    name: 'Necessity Proof',
    pattern: 'Must [PHENOMENON] necessarily produce [CONSEQUENCE] in all cases?',
    boost: 12,
    emergence: 74
  },
  constraintDiscovery: {
    name: 'Constraint Discovery',
    pattern: 'What is the fundamental limit preventing [PROPERTY] from exceeding [THRESHOLD]?',
    boost: 10,
    emergence: 72
  },
  scaleBridging: {
    name: 'Scale Bridging',
    pattern: 'If [PRINCIPLE] holds at [SCALE_A], must it necessarily hold at [SCALE_B]?',
    boost: 11,
    emergence: 75
  },
  symmetryNecessity: {
    name: 'Symmetry Necessity',
    pattern: 'Is [PRINCIPLE] necessarily true in ALL [TRANSFORMATIONS]?',
    boost: 10,
    emergence: 74
  },
  universalPattern: {
    name: 'Universal Pattern Testing',
    pattern: 'Does [CONCEPT_A] in [DOMAIN_A] exhibit [PATTERN] like [CONCEPT_B] in [DOMAIN_B]?',
    boost: 11,
    emergence: 76
  },
  emergenceMapping: {
    name: 'Emergence Mapping',
    pattern: 'What mechanism forces [DOMAIN] to exhibit emergence between [MIN]% and [MAX]%?',
    boost: 12,
    emergence: 76
  },
  reductionEmergence: {
    name: 'Reduction vs Emergence',
    pattern: 'Can [PHENOMENON] be reduced to [FUNDAMENTAL], or does it exhibit irreducible emergence?',
    boost: 12,
    emergence: 76
  }
};

// ============================================================================
// PHASE 43 QUESTION BATCHES
// ============================================================================

const epistemologicalDomain = {
  domain: 'Epistemological Concepts',
  description: 'The nature of knowing, proof, evidence, and certainty',
  focus_concepts: ['knowing', 'proof', 'evidence', 'certainty', 'truth', 'validation', 'verification'],
  questions: [
    {
      question: 'Can the nature of "proof" be derived from mathematical logic and empirical validation independently?',
      template: 'Framework Independence Test',
      concept: 'Proof',
      aspect: 'universality of validation',
      keywords: ['proof', 'logic', 'empirical', 'validation', 'framework-independent'],
      semantic_depth: 'What makes proof proof across different domains?'
    },
    {
      question: 'Must evidence necessarily support only one interpretation, or can irreducible ambiguity preserve valid uncertainty?',
      template: 'Necessity Proof',
      concept: 'Evidence',
      aspect: 'limits of disambiguation',
      keywords: ['evidence', 'interpretation', 'ambiguity', 'uncertainty', 'necessity'],
      semantic_depth: 'Is some ambiguity fundamental to empirical knowledge?'
    },
    {
      question: 'What is the fundamental limit preventing certainty from exceeding 100% in empirical knowledge systems?',
      template: 'Constraint Discovery',
      concept: 'Certainty',
      aspect: 'irreducible uncertainty',
      keywords: ['certainty', 'limit', 'empirical', 'incompleteness', 'fundamental'],
      semantic_depth: 'Why is absolute certainty impossible even in principle?'
    },
    {
      question: 'If a proposition can be proven true in formal logic systems, must it necessarily be empirically true in all cases?',
      template: 'Scale Bridging',
      concept: 'Truth',
      aspect: 'logic-reality mapping',
      keywords: ['proposition', 'logic', 'empirical', 'scale-bridging', 'necessity'],
      semantic_depth: 'Does logical truth bridge to physical reality?'
    },
    {
      question: 'Does knowledge validated through peer review in physics exhibit the same irreducibility to first principles as mathematical proof?',
      template: 'Universal Pattern Testing',
      concept: 'Knowledge',
      aspect: 'validation methods',
      keywords: ['knowledge', 'validation', 'peer-review', 'proof', 'first-principles'],
      semantic_depth: 'Is all valid knowledge fundamentally similar?'
    }
  ]
};

const emergentDomain = {
  domain: 'Emergent Concepts',
  description: 'The nature of complexity, patterns, order, and randomness',
  focus_concepts: ['complexity', 'pattern', 'order', 'randomness', 'self-organization', 'hierarchy', 'structure'],
  questions: [
    {
      question: 'Can complexity be derived from randomness and determinism independently, or is emergence framework-dependent?',
      template: 'Framework Independence Test',
      concept: 'Complexity',
      aspect: 'universality of emergence',
      keywords: ['complexity', 'randomness', 'determinism', 'emergence', 'framework-independent'],
      semantic_depth: 'Is complexity a universal principle?'
    },
    {
      question: 'Must patterns necessarily emerge in all complex systems, or can pure randomness persist indefinitely?',
      template: 'Necessity Proof',
      concept: 'Pattern',
      aspect: 'inevitability of structure',
      keywords: ['pattern', 'complex-systems', 'randomness', 'structure', 'emergence'],
      semantic_depth: 'Do all systems inevitably self-organize?'
    },
    {
      question: 'What is the fundamental limit preventing randomness from generating order above a certain organizational threshold?',
      template: 'Constraint Discovery',
      concept: 'Randomness',
      aspect: 'boundaries of chaos',
      keywords: ['randomness', 'order', 'chaos', 'organization', 'limit'],
      semantic_depth: 'What stops randomness from creating everything?'
    },
    {
      question: 'If hierarchical structure emerges at molecular scales through self-assembly, must similar hierarchies emerge at all scales?',
      template: 'Scale Bridging',
      concept: 'Hierarchy',
      aspect: 'scale-invariant organization',
      keywords: ['hierarchy', 'self-assembly', 'scales', 'emergence', 'structure'],
      semantic_depth: 'Is self-organization universal across scales?'
    },
    {
      question: 'Does self-organization in thermodynamic systems exhibit the same emergence as self-organization in information systems?',
      template: 'Universal Pattern Testing',
      concept: 'Self-Organization',
      aspect: 'universality across domains',
      keywords: ['self-organization', 'thermodynamics', 'information', 'emergence', 'pattern'],
      semantic_depth: 'Is emergent order domain-independent?'
    }
  ]
};

const universalPrinciplesDomain = {
  domain: 'Universal Principles',
  description: 'The nature of symmetry, conservation, invariance, and scale',
  focus_concepts: ['symmetry', 'conservation', 'invariance', 'scale', 'duality', 'equivalence', 'universality'],
  questions: [
    {
      question: 'Can symmetry principles be derived from conservation laws and from invariance under transformations independently?',
      template: 'Framework Independence Test',
      concept: 'Symmetry',
      aspect: 'universality of symmetry',
      keywords: ['symmetry', 'conservation', 'invariance', 'transformation', 'universality'],
      semantic_depth: 'Is symmetry a fundamental principle or derived property?'
    },
    {
      question: 'Must conservation laws necessarily hold in all systems, or can they be violated under specific conditions?',
      template: 'Necessity Proof',
      concept: 'Conservation',
      aspect: 'boundaries of conserved quantities',
      keywords: ['conservation', 'laws', 'invariance', 'necessity', 'conditions'],
      semantic_depth: 'Are conservation laws truly universal?'
    },
    {
      question: 'What is the fundamental limit preventing scale-invariance from being perfect at all scales in physical systems?',
      template: 'Constraint Discovery',
      concept: 'Scale',
      aspect: 'limits of scale-independence',
      keywords: ['scale', 'invariance', 'limit', 'fundamental', 'perfect'],
      semantic_depth: 'Why do scale-symmetries break at boundaries?'
    },
    {
      question: 'If symmetry holds in quantum mechanical systems, must it necessarily hold in classical systems at all scales?',
      template: 'Scale Bridging',
      concept: 'Duality',
      aspect: 'symmetry across scales',
      keywords: ['symmetry', 'quantum', 'classical', 'scales', 'necessity'],
      semantic_depth: 'Does quantum symmetry guarantee classical symmetry?'
    },
    {
      question: 'Does the invariance principle observed in relativity exhibit the same universality as invariance principles in information theory?',
      template: 'Universal Pattern Testing',
      concept: 'Invariance',
      aspect: 'universality of invariance',
      keywords: ['invariance', 'relativity', 'information-theory', 'universality', 'principle'],
      semantic_depth: 'Is invariance a universal principle of reality?'
    }
  ]
};

// ============================================================================
// SEMANTIC NETWORK MAPPING
// ============================================================================

const semanticConnections = [
  {
    concept_1: 'Proof',
    concept_2: 'Certainty',
    domain_1: 'Epistemological',
    domain_2: 'Epistemological',
    relationship: 'Proof produces certainty but cannot reach 100%',
    information_flow: 0.85,
    emergence_implication: 'Fundamental limit mirrors emergence ceiling'
  },
  {
    concept_1: 'Evidence',
    concept_2: 'Knowledge',
    domain_1: 'Epistemological',
    domain_2: 'Epistemological',
    relationship: 'Evidence is basis for validated knowledge',
    information_flow: 0.9,
    emergence_implication: 'Knowledge emergence depends on evidence quality'
  },
  {
    concept_1: 'Pattern',
    concept_2: 'Symmetry',
    domain_1: 'Emergent',
    domain_2: 'Universal Principle',
    relationship: 'Patterns are manifestations of underlying symmetry',
    information_flow: 0.85,
    emergence_implication: 'Emergent order reflects universal principles'
  },
  {
    concept_1: 'Complexity',
    concept_2: 'Proof',
    domain_1: 'Emergent',
    domain_2: 'Epistemological',
    relationship: 'Complex systems challenge proof and validation',
    information_flow: 0.7,
    emergence_implication: 'Complexity may require new validation frameworks'
  },
  {
    concept_1: 'Randomness',
    concept_2: 'Evidence',
    domain_1: 'Emergent',
    domain_2: 'Epistemological',
    relationship: 'Randomness in data complicates evidence gathering',
    information_flow: 0.65,
    emergence_implication: 'Uncertainty principle applies across domains'
  },
  {
    concept_1: 'Conservation',
    concept_2: 'Certainty',
    domain_1: 'Universal Principle',
    domain_2: 'Epistemological',
    relationship: 'Conservation laws provide certain predictions',
    information_flow: 0.88,
    emergence_implication: 'Universal principles yield maximum certainty'
  },
  {
    concept_1: 'Scale',
    concept_2: 'Complexity',
    domain_1: 'Universal Principle',
    domain_2: 'Emergent',
    relationship: 'Complexity increases with scale transitions',
    information_flow: 0.82,
    emergence_implication: 'Scale transitions trigger emergence'
  },
  {
    concept_1: 'Invariance',
    concept_2: 'Truth',
    domain_1: 'Universal Principle',
    domain_2: 'Epistemological',
    relationship: 'Invariant principles define universal truths',
    information_flow: 0.92,
    emergence_implication: 'Truth is invariant under transformation'
  },
  {
    concept_1: 'Self-Organization',
    concept_2: 'Symmetry',
    domain_1: 'Emergent',
    domain_2: 'Universal Principle',
    relationship: 'Self-organization respects underlying symmetries',
    information_flow: 0.8,
    emergence_implication: 'Emergence is constrained by symmetry'
  },
  {
    concept_1: 'Knowledge',
    concept_2: 'Conservation',
    domain_1: 'Epistemological',
    domain_2: 'Universal Principle',
    relationship: 'Knowledge is conserved through transformation',
    information_flow: 0.75,
    emergence_implication: 'Knowledge exhibits conservation properties'
  }
];

// ============================================================================
// EXECUTION
// ============================================================================

function generatePhase43Questions() {
  console.log('\n' + '='.repeat(80));
  console.log('PHASE 43: SEMANTIC QUESTION GENERATOR');
  console.log('Exploring Foundational Ideas in English Language');
  console.log('='.repeat(80) + '\n');

  const allQuestions = [];
  const domainBatches = [epistemologicalDomain, emergentDomain, universalPrinciplesDomain];

  // Generate questions for each domain
  domainBatches.forEach((domainData, domainIdx) => {
    console.log(`\n${'─'.repeat(80)}`);
    console.log(`DOMAIN ${domainIdx + 1}: ${domainData.domain.toUpperCase()}`);
    console.log(`${'─'.repeat(80)}`);
    console.log(`Description: ${domainData.description}\n`);

    const domainQuestions = [];

    domainData.questions.forEach((q, qIdx) => {
      const metrics = analyzeQuestion(q.question);
      const emergence = computeLinguisticEmergence(metrics);

      domainQuestions.push({
        id: `${domainIdx + 1}.${qIdx + 1}`,
        question: q.question,
        template: q.template,
        concept: q.concept,
        aspect: q.aspect,
        semantic_depth: q.semantic_depth,
        keywords: q.keywords,
        emergence_score: parseFloat(emergence.toFixed(1)),
        metrics: {
          ambiguity_index: parseFloat(metrics.ambiguityIndex.toFixed(2)),
          semantic_depth: metrics.semanticDepth,
          information_density: parseFloat(metrics.uniquenessRatio.toFixed(2)),
          clarity_score: metrics.clarityScore,
          answerability: metrics.answerabilityScore,
          framework_independent: metrics.frameworkIndependence === 1
        },
        word_count: metrics.wordCount
      });

      const templateName = q.template.replace(/\s/g, '_').toUpperCase();
      console.log(`Q${qIdx + 1} [${templateName}] - ${emergence.toFixed(1)}% emergence`);
      console.log(`   "${q.question}"`);
      console.log(`   Concept: ${q.concept} | Aspect: ${q.aspect}`);
      console.log(`   Why: ${q.semantic_depth}\n`);
    });

    allQuestions.push({
      domain: domainData.domain,
      focus_concepts: domainData.focus_concepts,
      questions: domainQuestions,
      total_questions: domainQuestions.length,
      mean_emergence: parseFloat((domainQuestions.reduce((sum, q) => sum + q.emergence_score, 0) / domainQuestions.length).toFixed(1)),
      all_high_emergence: domainQuestions.every(q => q.emergence_score >= 70)
    });
  });

  // Summary statistics
  console.log(`\n${'═'.repeat(80)}`);
  console.log('PHASE 43 SUMMARY\n');

  let totalQuestions = 0;
  let highEmergenceCount = 0;
  let totalEmergence = 0;

  allQuestions.forEach(batch => {
    console.log(`${batch.domain}:`);
    console.log(`  Questions: ${batch.total_questions}`);
    console.log(`  Mean Emergence: ${batch.mean_emergence}%`);
    console.log(`  All High-Emergence (≥70%): ${batch.all_high_emergence ? '✓ Yes' : '✗ No'}\n`);

    totalQuestions += batch.total_questions;
    batch.questions.forEach(q => {
      totalEmergence += q.emergence_score;
      if (q.emergence_score >= 70) highEmergenceCount++;
    });
  });

  const meanEmergence = parseFloat((totalEmergence / totalQuestions).toFixed(1));

  console.log(`AGGREGATE STATISTICS:`);
  console.log(`  Total Questions: ${totalQuestions}`);
  console.log(`  High-Emergence (≥70%): ${highEmergenceCount}/${totalQuestions} (${(highEmergenceCount/totalQuestions*100).toFixed(0)}%)`);
  console.log(`  Mean Emergence: ${meanEmergence}%`);

  // Semantic connections
  console.log(`\nSEMANTIC NETWORK:`);
  console.log(`  Interconnections Mapped: ${semanticConnections.length}`);
  console.log(`  Domain Bridges: ${new Set(semanticConnections.map(c => c.domain_1 + '↔' + c.domain_2)).size}`);
  console.log(`  Mean Information Flow: ${(semanticConnections.reduce((sum, c) => sum + c.information_flow, 0) / semanticConnections.length).toFixed(2)}`);

  console.log(`\n${'═'.repeat(80)}\n`);

  return {
    timestamp: new Date().toISOString(),
    phase: 43,
    total_questions: totalQuestions,
    high_emergence_count: highEmergenceCount,
    mean_emergence: meanEmergence,
    question_batches: allQuestions,
    semantic_connections: semanticConnections,
    semantic_network_size: semanticConnections.length,
    success: highEmergenceCount === totalQuestions
  };
}

// ============================================================================
// MAIN
// ============================================================================

if (require.main === module) {
  const result = generatePhase43Questions();

  // Create results directory
  const resultsDir = './phase-43-results';
  if (!fs.existsSync(resultsDir)) {
    fs.mkdirSync(resultsDir, { recursive: true });
  }

  // Save comprehensive results
  fs.writeFileSync(
    path.join(resultsDir, 'PHASE-43-SEMANTIC-QUESTIONS.json'),
    JSON.stringify(result, null, 2)
  );

  console.log(`✅ Results saved to: phase-43-results/PHASE-43-SEMANTIC-QUESTIONS.json`);

  process.exit(result.success ? 0 : 1);
}

module.exports = {
  epistemologicalDomain,
  emergentDomain,
  universalPrinciplesDomain,
  semanticConnections,
  generatePhase43Questions,
  analyzeQuestion,
  computeLinguisticEmergence
};
