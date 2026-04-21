#!/usr/bin/env node
/**
 * PHASE 45A: RATIONAL DOMAINS QUESTION GENERATOR
 * 
 * Generates 54 philosophical questions across 9 domains (6 per domain)
 * using Phase 43 semantic framework adapted for each specific domain.
 * 
 * Domains:
 * 1. Epistemology (knowledge, justification, belief) - 6 questions
 * 2. Logic (validity, reasoning, proof) - 6 questions
 * 3. Metaphysics (existence, reality, substance) - 6 questions
 * 4. Philosophy of Mind (consciousness, mental states, qualia) - 6 questions
 * 5. Aesthetics (beauty, art, taste) - 6 questions
 * 6. Political Philosophy (justice, power, governance) - 6 questions
 * 7. Philosophy of Science (scientific method, laws, explanation) - 6 questions
 * 8. Philosophy of Mathematics (numbers, abstraction, infinity) - 6 questions
 * 9. Philosophy of Language (meaning, reference, truth) - 6 questions
 */

const fs = require('fs');
const path = require('path');

// ============================================================================
// RATIONAL DOMAINS QUESTIONS
// ============================================================================

const rationalDomainsQuestions = {
  epistemology: [
    {
      id: '1.1',
      domain: 'Epistemology',
      subdomain: 'Knowledge',
      question: 'Is knowledge fundamentally propositional (knowledge that X) or can practical skills (knowledge how to do X) count as knowledge without propositional content?',
      keywords: ['propositional knowledge', 'practical knowledge', 'reduction', 'skills'],
      semantic_depth: 'Tests whether knowledge concept is unified or domain-dependent'
    },
    {
      id: '1.2',
      domain: 'Epistemology',
      subdomain: 'Justification',
      question: 'Does justification for a belief require infinite backwards chain of supporting reasons or can foundational beliefs be self-justifying?',
      keywords: ['infinite regress', 'foundationalism', 'justification', 'reasons'],
      semantic_depth: 'Addresses whether justification must be linear or can be self-supporting'
    },
    {
      id: '1.3',
      domain: 'Epistemology',
      subdomain: 'Belief Formation',
      question: 'Must justified beliefs be formed through rational deliberation or can beliefs be justified if they result from reliable non-rational processes?',
      keywords: ['rationalism', 'reliability', 'belief formation', 'process'],
      semantic_depth: 'Tests relationship between method of belief formation and justification status'
    },
    {
      id: '1.4',
      domain: 'Epistemology',
      subdomain: 'Skepticism',
      question: 'Can skeptical hypotheses (brain in vat, evil demon) ever be rationally refuted or must we accept that certainty is forever beyond reach?',
      keywords: ['skepticism', 'certainty', 'refutation', 'possibilities'],
      semantic_depth: 'Explores whether skeptical challenges can be definitively answered'
    },
    {
      id: '1.5',
      domain: 'Epistemology',
      subdomain: 'Testimony',
      question: 'Is testimony from others sufficient justification for belief or must beliefs acquired through testimony be independently verified?',
      keywords: ['testimony', 'justification', 'authority', 'independence'],
      semantic_depth: 'Tests epistemic status of second-hand knowledge'
    },
    {
      id: '1.6',
      domain: 'Epistemology',
      subdomain: 'Social Epistemology',
      question: 'Can groups have collective knowledge that cannot be reduced to individual members\' knowledge or is group belief always derivative?',
      keywords: ['collective knowledge', 'reduction', 'groups', 'emergence'],
      semantic_depth: 'Asks whether epistemic agency scales from individual to collective'
    }
  ],

  logic: [
    {
      id: '2.1',
      domain: 'Logic',
      subdomain: 'Validity',
      question: 'Does logical validity depend on the meanings of words or is validity purely formal structure independent of semantic content?',
      keywords: ['validity', 'formal', 'semantic', 'structure'],
      semantic_depth: 'Tests relationship between logical form and meaning'
    },
    {
      id: '2.2',
      domain: 'Logic',
      subdomain: 'Laws of Logic',
      question: 'Are laws of logic like non-contradiction universal necessities or are they conventional rules adopted for pragmatic purposes?',
      keywords: ['laws of logic', 'necessity', 'convention', 'non-contradiction'],
      semantic_depth: 'Explores whether logic is discovered or invented'
    },
    {
      id: '2.3',
      domain: 'Logic',
      subdomain: 'Logical Pluralism',
      question: 'Can multiple incompatible logics be simultaneously true in different domains or must logic be monistic with exactly one correct system?',
      keywords: ['logical pluralism', 'monism', 'domains', 'inconsistency'],
      semantic_depth: 'Tests whether logic is domain-dependent'
    },
    {
      id: '2.4',
      domain: 'Logic',
      subdomain: 'Paradox and Inconsistency',
      question: 'When logical systems derive contradictions, should we reject the principle causing contradiction or accept contradictions as true?',
      keywords: ['paradox', 'inconsistency', 'paraconsistency', 'rejection'],
      semantic_depth: 'Addresses how to respond when logic breaks down'
    },
    {
      id: '2.5',
      domain: 'Logic',
      subdomain: 'Logical Consequence',
      question: 'Is logical consequence determined by formal structure alone or does it depend on whether premises actually guarantee conclusion in reality?',
      keywords: ['consequence', 'formal', 'guarantees', 'reality'],
      semantic_depth: 'Tests whether logic concerns possibility or actuality'
    },
    {
      id: '2.6',
      domain: 'Logic',
      subdomain: 'Intuitionistic Logic',
      question: 'Must every true proposition be provable in principle or can there be true but unprovable truths?',
      keywords: ['intuitionistic', 'provability', 'truth', 'constructivism'],
      semantic_depth: 'Explores relationship between truth and proof'
    }
  ],

  metaphysics: [
    {
      id: '3.1',
      domain: 'Metaphysics',
      subdomain: 'Ontology',
      question: 'Do abstract objects like numbers and properties exist mind-independently or are they human constructs with no independent reality?',
      keywords: ['abstract objects', 'existence', 'mind-independence', 'construction'],
      semantic_depth: 'Tests scope of what can exist'
    },
    {
      id: '3.2',
      domain: 'Metaphysics',
      subdomain: 'Causation',
      question: 'Is causation a feature of the world itself or merely a pattern we impose on events for explanatory convenience?',
      keywords: ['causation', 'real', 'pattern', 'objective'],
      semantic_depth: 'Explores objective status of causal relations'
    },
    {
      id: '3.3',
      domain: 'Metaphysics',
      subdomain: 'Identity',
      question: 'Can an object persist through change of all its properties or must identity require some unchanging substance or core?',
      keywords: ['identity', 'change', 'substance', 'properties'],
      semantic_depth: 'Tests continuity conditions for objects through time'
    },
    {
      id: '3.4',
      domain: 'Metaphysics',
      subdomain: 'Possible Worlds',
      question: 'Are possible worlds real entities with same ontological status as actual world or are they useful fictions for modal discourse?',
      keywords: ['possible worlds', 'modality', 'reality', 'fiction'],
      semantic_depth: 'Addresses metaphysical commitment of modal language'
    },
    {
      id: '3.5',
      domain: 'Metaphysics',
      subdomain: 'Time',
      question: 'Does temporal flow and the passage of time exist objectively or is time just a static structure we experience subjectively?',
      keywords: ['time', 'flow', 'objectivity', 'A-theory', 'B-theory'],
      semantic_depth: 'Tests whether time is dynamic or static reality'
    },
    {
      id: '3.6',
      domain: 'Metaphysics',
      subdomain: 'Composition',
      question: 'Do composite objects like tables truly exist or are only fundamental particles real with mereological composition being a linguistic convenience?',
      keywords: ['composition', 'parts', 'mereology', 'fundamental', 'composite'],
      semantic_depth: 'Explores ontological status of composed objects'
    }
  ],

  philosophyOfMind: [
    {
      id: '4.1',
      domain: 'Philosophy of Mind',
      subdomain: 'Consciousness',
      question: 'Is consciousness reducible to physical processes in the brain or does subjective experience exhibit properties irreducible to physical description?',
      keywords: ['consciousness', 'physical', 'reducibility', 'qualia'],
      semantic_depth: 'Tests whether mind/body divide is fundamental'
    },
    {
      id: '4.2',
      domain: 'Philosophy of Mind',
      subdomain: 'Intentionality',
      question: 'Can mental states refer to objects in the world independently or does intentionality depend on causal history and interpretation?',
      keywords: ['intentionality', 'reference', 'causation', 'interpretation'],
      semantic_depth: 'Explores how mental states get meaning'
    },
    {
      id: '4.3',
      domain: 'Philosophy of Mind',
      subdomain: 'Free Will',
      question: 'If every mental event has a prior physical cause, can we maintain that our decisions are genuinely free or is free will incompatible with causation?',
      keywords: ['free will', 'causation', 'determinism', 'libertarianism'],
      semantic_depth: 'Tests whether agency survives causal order'
    },
    {
      id: '4.4',
      domain: 'Philosophy of Mind',
      subdomain: 'Personal Identity',
      question: 'Is personal identity constituted by psychological continuity (memory, personality) or biological continuity (same brain/body)?',
      keywords: ['personal identity', 'continuity', 'psychological', 'biological'],
      semantic_depth: 'Addresses what makes me the same person over time'
    },
    {
      id: '4.5',
      domain: 'Philosophy of Mind',
      subdomain: 'Other Minds',
      question: 'Can we ever have justified belief in other minds or must we always remain agnostic about whether others are conscious?',
      keywords: ['other minds', 'justified belief', 'consciousness', 'behavior'],
      semantic_depth: 'Tests epistemology of mental states in others'
    },
    {
      id: '4.6',
      domain: 'Philosophy of Mind',
      subdomain: 'Artificial Intelligence',
      question: 'Can artificial systems be genuinely conscious if they exhibit appropriate functional organization or is consciousness necessarily biological?',
      keywords: ['consciousness', 'artificial', 'functional', 'substrate', 'qualia'],
      semantic_depth: 'Explores whether consciousness depends on implementation'
    }
  ],

  aesthetics: [
    {
      id: '5.1',
      domain: 'Aesthetics',
      subdomain: 'Beauty',
      question: 'Is aesthetic beauty an objective property of objects or is it fundamentally subjective existing only in the eye of the beholder?',
      keywords: ['beauty', 'objective', 'subjective', 'properties'],
      semantic_depth: 'Tests ontological status of aesthetic properties'
    },
    {
      id: '5.2',
      domain: 'Aesthetics',
      subdomain: 'Art Definition',
      question: 'Can art be defined by necessary and sufficient conditions or is "art" an open-ended family resemblance concept?',
      keywords: ['art', 'definition', 'necessary', 'sufficient', 'family resemblance'],
      semantic_depth: 'Explores whether art has essential properties'
    },
    {
      id: '5.3',
      domain: 'Aesthetics',
      subdomain: 'Aesthetic Judgment',
      question: 'Are aesthetic judgments "merely subjective" that cannot be contested or can aesthetic taste be educated and refined?',
      keywords: ['judgment', 'subjectivity', 'taste', 'education', 'dispute'],
      semantic_depth: 'Tests whether aesthetic disagreement can be resolved'
    },
    {
      id: '5.4',
      domain: 'Aesthetics',
      subdomain: 'Art and Emotion',
      question: 'Must aesthetic experience involve emotional response or can objects be aesthetically appreciated through purely cognitive analysis?',
      keywords: ['aesthetic experience', 'emotion', 'cognitive', 'appreciation'],
      semantic_depth: 'Explores role of feeling in aesthetic judgment'
    },
    {
      id: '5.5',
      domain: 'Aesthetics',
      subdomain: 'Representation',
      question: 'Can art represent reality accurately and if so how does artistic representation differ from scientific description or photography?',
      keywords: ['representation', 'reality', 'accuracy', 'description', 'photograph'],
      semantic_depth: 'Tests relationship between artwork and world'
    },
    {
      id: '5.6',
      domain: 'Aesthetics',
      subdomain: 'Aesthetic Value',
      question: 'Is aesthetic value intrinsic to artworks or is value assigned by communities and historical contexts?',
      keywords: ['aesthetic value', 'intrinsic', 'community', 'history'],
      semantic_depth: 'Explores source of artistic worth'
    }
  ],

  politicalPhilosophy: [
    {
      id: '6.1',
      domain: 'Political Philosophy',
      subdomain: 'Authority',
      question: 'Do governments have legitimate authority to command obedience or is political authority always a power that must be morally justified?',
      keywords: ['authority', 'legitimacy', 'power', 'obedience'],
      semantic_depth: 'Tests foundation of political obligation'
    },
    {
      id: '6.2',
      domain: 'Political Philosophy',
      subdomain: 'Justice',
      question: 'Is distributive justice primarily concerned with equality of outcome or equality of opportunity or something else entirely?',
      keywords: ['justice', 'equality', 'outcome', 'opportunity', 'distribution'],
      semantic_depth: 'Explores different conceptions of fairness'
    },
    {
      id: '6.3',
      domain: 'Political Philosophy',
      subdomain: 'Rights',
      question: 'Are rights natural properties humans possess independently or are they conventional social constructs defined by legal systems?',
      keywords: ['rights', 'natural', 'conventional', 'legal', 'human'],
      semantic_depth: 'Tests ontological status of rights'
    },
    {
      id: '6.4',
      domain: 'Political Philosophy',
      subdomain: 'Social Contract',
      question: 'Can an actual social contract ground political authority or only a hypothetical contract that rational beings would agree to?',
      keywords: ['social contract', 'actual', 'hypothetical', 'rational', 'authority'],
      semantic_depth: 'Explores whether contract must be real or ideal'
    },
    {
      id: '6.5',
      domain: 'Political Philosophy',
      subdomain: 'Freedom',
      question: 'Is freedom negative (absence of interference) or positive (presence of capacity to do what one wants)?',
      keywords: ['freedom', 'liberty', 'negative', 'positive', 'interference', 'capacity'],
      semantic_depth: 'Tests conception of political freedom'
    },
    {
      id: '6.6',
      domain: 'Political Philosophy',
      subdomain: 'Democracy',
      question: 'Does democratic legitimacy require direct participation of all citizens or can representative structures preserve democratic authority?',
      keywords: ['democracy', 'participation', 'representation', 'legitimacy'],
      semantic_depth: 'Explores forms of democratic governance'
    }
  ],

  philosophyOfScience: [
    {
      id: '7.1',
      domain: 'Philosophy of Science',
      subdomain: 'Scientific Method',
      question: 'Is there a single scientific method or do different sciences employ fundamentally different approaches to knowledge?',
      keywords: ['scientific method', 'unified', 'diverse', 'approaches'],
      semantic_depth: 'Tests universality of scientific methodology'
    },
    {
      id: '7.2',
      domain: 'Philosophy of Science',
      subdomain: 'Laws of Nature',
      question: 'Are laws of nature regularities in what actually happens or do they govern what must happen as constraints on possibility?',
      keywords: ['laws', 'nature', 'regularities', 'necessity', 'possibility'],
      semantic_depth: 'Explores modal status of scientific laws'
    },
    {
      id: '7.3',
      domain: 'Philosophy of Science',
      subdomain: 'Explanation',
      question: 'Do scientific explanations require causal mechanisms or is predictive power sufficient for explanatory adequacy?',
      keywords: ['explanation', 'causation', 'mechanism', 'prediction'],
      semantic_depth: 'Tests requirements for scientific understanding'
    },
    {
      id: '7.4',
      domain: 'Philosophy of Science',
      subdomain: 'Realism',
      question: 'Do scientific theories describe reality as it actually is or do they merely provide useful instruments for prediction?',
      keywords: ['realism', 'theory', 'reality', 'instrumentalism', 'prediction'],
      semantic_depth: 'Explores what science tells us about world'
    },
    {
      id: '7.5',
      domain: 'Philosophy of Science',
      subdomain: 'Reduction',
      question: 'Can higher-level sciences like biology be reduced to physics or do they describe genuinely novel properties irreducible to fundamental level?',
      keywords: ['reduction', 'emergence', 'levels', 'properties', 'physics'],
      semantic_depth: 'Tests hierarchical structure of sciences'
    },
    {
      id: '7.6',
      domain: 'Philosophy of Science',
      subdomain: 'Observation',
      question: 'Can scientific observation be theory-neutral or does what scientists observe depend on the theoretical framework they bring to observation?',
      keywords: ['observation', 'theory-laden', 'neutral', 'framework'],
      semantic_depth: 'Addresses independence of data from theory'
    }
  ],

  philosophyOfMathematics: [
    {
      id: '8.1',
      domain: 'Philosophy of Mathematics',
      subdomain: 'Platonism',
      question: 'Do mathematical objects like numbers exist independently in an abstract realm or are they human constructions?',
      keywords: ['Platonism', 'abstract objects', 'existence', 'construction'],
      semantic_depth: 'Tests ontology of mathematical entities'
    },
    {
      id: '8.2',
      domain: 'Philosophy of Mathematics',
      subdomain: 'Mathematical Truth',
      question: 'Are mathematical truths discovered or invented by mathematicians?',
      keywords: ['truth', 'discovery', 'invention', 'mathematical'],
      semantic_depth: 'Explores epistemology of mathematics'
    },
    {
      id: '8.3',
      domain: 'Philosophy of Mathematics',
      subdomain: 'Infinity',
      question: 'Can infinity be treated as completed totality in mathematics or only as a potential limit never fully actualized?',
      keywords: ['infinity', 'actual', 'potential', 'completed', 'totality'],
      semantic_depth: 'Tests mathematical status of infinite quantities'
    },
    {
      id: '8.4',
      domain: 'Philosophy of Mathematics',
      subdomain: 'Mathematical Necessity',
      question: 'Are mathematical truths necessary in all possible worlds or only in worlds with mathematics?',
      keywords: ['necessity', 'possible worlds', 'modality', 'contingency'],
      semantic_depth: 'Explores modal properties of mathematics'
    },
    {
      id: '8.5',
      domain: 'Philosophy of Mathematics',
      subdomain: 'Applicability',
      question: 'Why is mathematics so unreasonably effective at describing physical reality if it is merely abstract human construction?',
      keywords: ['applicability', 'effectiveness', 'reality', 'construction'],
      semantic_depth: 'Tests relationship between mathematics and world'
    },
    {
      id: '8.6',
      domain: 'Philosophy of Mathematics',
      subdomain: 'Axiom Systems',
      question: 'If multiple incompatible axiom systems are all logically consistent, can they all be equally valid or is there a unique true mathematics?',
      keywords: ['axioms', 'consistency', 'incompatibility', 'uniqueness', 'truth'],
      semantic_depth: 'Tests pluralism in mathematical foundations'
    }
  ],

  philosophyOfLanguage: [
    {
      id: '9.1',
      domain: 'Philosophy of Language',
      subdomain: 'Meaning',
      question: 'Does the meaning of a word depend on its use in language or on what the word refers to in the world?',
      keywords: ['meaning', 'use', 'reference', 'intentionality'],
      semantic_depth: 'Tests theory of semantic content'
    },
    {
      id: '9.2',
      domain: 'Philosophy of Language',
      subdomain: 'Reference',
      question: 'Can empty names like "Sherlock Holmes" have meaning and truth-conditions even though they fail to refer to anything?',
      keywords: ['reference', 'empty names', 'meaning', 'truth-conditions'],
      semantic_depth: 'Explores non-referring expressions'
    },
    {
      id: '9.3',
      domain: 'Philosophy of Language',
      subdomain: 'Truth',
      question: 'Does a sentence become true or false by corresponding to reality or does truth depend on coherence within a system?',
      keywords: ['truth', 'correspondence', 'reality', 'coherence'],
      semantic_depth: 'Tests theories of truth'
    },
    {
      id: '9.4',
      domain: 'Philosophy of Language',
      subdomain: 'Context',
      question: 'Can sentences have truth-conditions independent of context or do utterances always depend on speaker, time, and place?',
      keywords: ['context', 'truth-conditions', 'utterance', 'indexical'],
      semantic_depth: 'Explores role of context in language'
    },
    {
      id: '9.5',
      domain: 'Philosophy of Language',
      subdomain: 'Private Language',
      question: 'Could a language be private to a single speaker referring only to their private experiences or is language necessarily shared?',
      keywords: ['private language', 'experience', 'sharing', 'community'],
      semantic_depth: 'Tests social nature of language'
    },
    {
      id: '9.6',
      domain: 'Philosophy of Language',
      subdomain: 'Translation',
      question: 'Is perfect translation between languages possible or is meaning partially relative to each language\'s conceptual scheme?',
      keywords: ['translation', 'meaning', 'language', 'conceptual scheme', 'relativity'],
      semantic_depth: 'Explores universality of meaning'
    }
  ]
};

// ============================================================================
// ANALYSIS
// ============================================================================

function generateRationalDomainsQuestions() {
  console.log('\n' + '='.repeat(80));
  console.log('PHASE 45A: RATIONAL DOMAINS QUESTION GENERATOR');
  console.log('Generating 54 Philosophy Questions Across 9 Domains (6 per domain)');
  console.log('='.repeat(80) + '\n');

  const allQuestions = [];
  const domains = [];

  // Collect all questions
  for (const [key, questions] of Object.entries(rationalDomainsQuestions)) {
    allQuestions.push(...questions);
    domains.push({ key, name: questions[0].domain, count: questions.length });
  }

  // Print by domain
  domains.forEach(domain => {
    const domainQuestions = rationalDomainsQuestions[domain.key];
    console.log(`\n${'─'.repeat(80)}`);
    console.log(`${domain.name.toUpperCase()} (${domain.count} questions)`);
    console.log(`${'─'.repeat(80)}\n`);

    domainQuestions.forEach(q => {
      console.log(`Q${q.id} [${q.subdomain}]`);
      console.log(`Question: ${q.question}`);
      console.log(`Keywords: ${q.keywords.join(', ')}`);
      console.log(`Depth: ${q.semantic_depth}\n`);
    });
  });

  console.log(`${'═'.repeat(80)}`);
  console.log('GENERATION SUMMARY\n');
  console.log(`Total Questions: ${allQuestions.length}`);
  console.log(`Domains: ${domains.length}`);
  console.log(`Questions per Domain: 6`);
  console.log(`Domains Covered:`);
  domains.forEach(d => console.log(`  • ${d.name}: ${d.count} questions`));
  console.log(`\nStatus: Ready for Hybrid Proofreading Phase\n`);
  console.log(`${'═'.repeat(80)}\n`);

  return {
    timestamp: new Date().toISOString(),
    phase: 45,
    subphase: 'A',
    total_questions: allQuestions.length,
    domains: domains.length,
    questions_per_domain: 6,
    domain_list: domains.map(d => d.name),
    questions: rationalDomainsQuestions,
    all_questions: allQuestions
  };
}

// ============================================================================
// MAIN
// ============================================================================

if (require.main === module) {
  const result = generateRationalDomainsQuestions();

  // Create results directory
  const resultsDir = './phase-45-results';
  if (!fs.existsSync(resultsDir)) {
    fs.mkdirSync(resultsDir, { recursive: true });
  }

  // Save generated questions
  fs.writeFileSync(
    path.join(resultsDir, 'PHASE-45A-RATIONAL-DOMAINS-QUESTIONS.json'),
    JSON.stringify(result, null, 2)
  );

  console.log(`✅ Rational domains questions generated. Results saved to: phase-45-results/PHASE-45A-RATIONAL-DOMAINS-QUESTIONS.json`);

  process.exit(0);
}

module.exports = {
  rationalDomainsQuestions,
  generateRationalDomainsQuestions
};
