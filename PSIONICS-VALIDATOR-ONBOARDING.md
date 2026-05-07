# Psionics Validator Onboarding — Training Curriculum
## The Game Domain: Unknown-Domain Validation

**Document**: Validator Certification Program  
**Date**: April 26, 2026  
**Audience**: Certified Game players qualifying for psionics specialist training  
**Duration**: 2-week online program (15-20 hours) + 5-claim review project

---

## Module 1: Statistical Foundations (3 hours)

### Learning Objectives
- Understand p-values, effect sizes, and statistical significance
- Recognize false positives and how they hide in measurements
- Know the difference between "interesting" and "proven"
- Identify when sample size is inadequate

### Core Concepts

#### 1.1: The Null Hypothesis
**What it is**: The claim that nothing happened (chance alone)

**Example**:
- Claim: "Intention influences RNG output"
- Null: "RNG behaves randomly (follows normal distribution)"
- Test: Does data deviate from null significantly?

**Why it matters**: If you don't define null, you can't tell signal from noise.

#### 1.2: P-Values & Significance
**What it is**: Probability that observed data would occur by chance if null hypothesis is true

**Interpretation**:
- p = 0.05: 5% chance results occurred by pure randomness
- p = 0.01: 1% chance results occurred by pure randomness
- p = 0.5: 50% chance—basically noise

**Critical rule**: p-value is NOT "probability claim is true"
- It's "probability of data IF null is true"
- Small p-value suggests null is wrong, but doesn't prove claim is right

**Example**:
- Researcher tests 100 random hypotheses
- One will hit p < 0.05 by pure chance
- That's not a discovery; that's the garden path fallacy

#### 1.3: Effect Size
**What it is**: Magnitude of the effect (how big is the difference?)

**Why it matters**: 
- p-value can be small with tiny effect (big sample, small difference)
- Effect size tells you if result is practically meaningful

**Example**:
- Claim: "Intention affects RNG" (p = 0.02)
- Effect size: "2% deviation from theoretical mean"
- Verdict: Statistically significant but maybe noise-level effect
- Claim: "Intention affects RNG" (p = 0.02)
- Effect size: "50% deviation from theoretical mean"
- Verdict: Statistically significant AND practically large

#### 1.4: Multiple Comparisons Problem
**The trap**: If you test enough hypotheses, one will appear significant by chance

**Example**:
- Test: Does intention affect RNG outcomes?
- Honest approach: Test once with pre-planned hypothesis
- Dishonest approach: Test 100 variations of RNG, report the one with p < 0.05

**For psionics validators**: Watch for authors running many tests and reporting only winners

**How to detect it**:
- Ask: "Did you pre-plan this test, or did you discover it?"
- Ask: "How many other tests did you try?"
- Look for: Claim that looks "just barely significant" (p = 0.049) is suspicious

#### 1.5: Replication & Reproducibility
**Why it matters**: 
- One experiment can be lucky
- Replication shows if result is real

**Gold standard**: Same apparatus, same protocol, different operator, same result

**For psionics**: High replication failure rate (> 50%) suggests measurement artifact

### Quiz
1. What does p = 0.03 mean? (Answer: 3% probability data occurred by chance if null is true)
2. A claim has p < 0.001 but effect size = 0.1%. Is it significant? (Answer: Statistically yes, but effect is tiny—likely artifact)
3. A researcher tests 50 hypotheses and finds one with p < 0.05. Is this a discovery? (Answer: No—expected by chance)

---

## Module 2: Measurement Design & False Positives (4 hours)

### Learning Objectives
- Identify common measurement flaws
- Spot where false positives hide
- Ask critical questions about experimental setup
- Recognize honest mistakes vs. intentional fraud

### Common Measurement Failures

#### 2.1: Confounding Variables
**What it is**: Unmeasured factor that creates illusion of effect

**Example** (Not Psionics):
- Claim: "Vitamin X improves memory"
- Study: Give vitamin X to Group A, nothing to Group B
- Result: Group A scores higher
- False positive if: Group A was also sleeping better, or less stressed, or younger
- Confound: Age or sleep or stress (not vitamin) caused difference

**For Psionics**:
- Claim: "Intention influences RNG"
- Apparatus: RNG hardware + human operator
- False positive if: Operator unconsciously touches hardware, introduces vibration, or correlates with operator skill
- Confound: Physical interaction (not intention) caused deviation

**How to detect**:
- Ask: "What else could produce this result?"
- Ask: "Are you measuring the right thing?"
- Request: Control test (RNG alone, no operator → should be normal)

#### 2.2: Measurement Bias (Observer Effect)
**What it is**: Measurer unconsciously influences measurement

**Example** (Not Psionics):
- Claim: "Subject can read minds"
- Test: Experimenter thinks of number, subject guesses
- False positive if: Experimenter's tone/expression leaks the answer
- Bias: Subject reacts to observer cues, not mind-reading

**For Psionics**:
- Claim: "Remote viewer can describe sealed envelope"
- Test: Viewer describes, then envelope opened
- False positive if: Viewer had prior access, or envelope was transparent, or observer confirms "close enough"
- Bias: Experimenter interprets vague descriptions as "hits"

**How to detect**:
- Ask: "Is test single-blind (subject doesn't know expected answer)?"
- Ask: "Is test double-blind (observer also doesn't know expected answer)?"
- Request: Pre-registered results (no cherry-picking after seeing data)

#### 2.3: Selection Bias
**What it is**: Only showing the successes, hiding the failures

**Example**:
- Experimenter runs 10 RNG tests
- 9 show random behavior, 1 shows 2σ deviation
- Reports: "RNG showed significant deviation!" (omits 9 failures)
- Selection bias: Hiding failure rate

**For Psionics**:
- Claim: "10 out of 10 tests showed intention effect"
- Watch for: Did author cherry-pick the good runs?
- Request: Full dataset (all runs, including apparent failures)

**How to detect**:
- Ask: "How many total tests did you run?"
- Ask: "What percentage showed the effect?"
- Request: Raw data (all runs, including failures)

#### 2.4: P-Hacking (Data Fishing)
**What it is**: Analyzing data many ways until one looks significant

**Example**:
- Test: Intention influences RNG
- Honest approach: Pre-plan analysis (e.g., "Chi-square on first 1000 samples")
- P-hacking approach: 
  - Try chi-square? No (p = 0.08)
  - Try Kolmogorov-Smirnov? No (p = 0.12)
  - Try entropy analysis? No (p = 0.06)
  - Try analyzing only runs where subject focused? Yes (p = 0.03)
  - Report: "Intention affects RNG when subject concentrates!"

**How to detect**:
- Ask: "Did you pre-plan this analysis?"
- Look for: Multiple statistical tests (red flag)
- Request: Analysis plan (pre-registered before data collection)

#### 2.5: Sample Size & Statistical Power
**What it is**: Number of measurements needed to reliably detect effect

**Rule of thumb**: 
- Tiny effect? Need huge sample (thousands)
- Large effect? Need smaller sample (dozens)
- Vague claim ("intention affects RNG")? Assume tiny effect, need large sample

**For Psionics**:
- Claim: "Intention influences RNG with 2% effect size"
- Question: "How many trials?"
- If < 10,000: Likely insufficient power (can't detect 2% reliably)
- If > 100,000: Good (assuming independent trials)

**How to detect**:
- Ask: "How many measurements did you take?"
- Ask: "What's your expected effect size?"
- Calculate: Is sample size adequate for that effect size? (Use online calculators)

### Checklist for Measurement Critique

When reviewing a psionics claim, use this checklist:

- [ ] **Null hypothesis stated**: Can you write it down?
- [ ] **Control group/condition**: Is there a baseline (RNG alone, person alone, etc.)?
- [ ] **Blinding**: Can observer/subject unconsciously influence result?
- [ ] **Confounds addressed**: What else could produce this result?
- [ ] **Sample size justified**: Is N adequate for claimed effect size?
- [ ] **Analysis pre-planned**: Was analysis decided before data collection?
- [ ] **Raw data available**: Can we verify reported statistics?
- [ ] **Replication attempted**: Has someone else tested the same claim?

**Red flags** (any of these = request clarification or revision):
- No control group
- Single-operator (not blinded)
- p-value alone (no effect size)
- Sample size unspecified
- Multiple analyses (reports one winner)
- Effect size suspiciously small (< 1%)
- Effect size suspiciously large (> 50%, claiming mind-body separation)

### Quiz
1. A claim has tight controls, large sample, p < 0.001, but effect size = 0.5%. What's your verdict? (Answer: Request more information; effect is real but tiny, investigate if practically meaningful)
2. Researcher tested 100 people, only 5 showed effect. How should this be reported? (Answer: As 5% success rate, not "5 people showed effect")
3. What's the difference between measurement bias and selection bias? (Answer: Bias = measurer influences result; Selection = measurer hides failures)

---

## Module 3: Psionics-Specific Validation (4 hours)

### Learning Objectives
- Understand why psionics claims are prone to false positives
- Know the specific measurement designs for common psionic claims
- Learn how to evaluate "remote viewing," "telekinesis," "cognition influence"
- Recognize fraud indicators in psionic research

### Why Psionics Is High-Noise Domain

**Signal-to-Noise Problem**:
- If effects exist, they're subtle (we'd know if they were obvious)
- Measurement precision must be extremely high
- False positives outnumber real positives
- **Consequence**: Rigorous rejection of 95% of claims is appropriate

**Not "skepticism," not "dismissal"—just statistics**: In high-noise domains, most claims fail screening. That's not bias; that's how noisy domains work.

### Common Psionic Claim Types

#### 3.1: Telekinesis Claims
**Claim**: Intention influences physical objects (RNG, pendulums, scales, etc.)

**Standard Measurement**:
- Apparatus: Quantum RNG hardware (oscillates ~10^9 Hz)
- Baseline: 100,000 runs with operator absent = confirmed random
- Test: Operator focuses intention, 100,000 runs = measure deviation from baseline
- Metric: Chi-square test (does distribution deviate significantly?)

**How to Evaluate**:
- Ask: "Is RNG hardware known-good?" (Have others tested it?)
- Ask: "Are runs independent?" (RNG not biased by timing)
- Ask: "Is baseline documented?" (Can we verify statistical properties?)
- Watch for: Effect that appears/disappears with operator focus (suggests operator artifact)
- Watch for: Effect size that shrinks over repeated tests (learning curve? or fading?)

**Red Flags**:
- No baseline RNG test
- Single trial (one run of RNG, not replicated)
- Effect visible with naked eye ("I can see the scale move") — if true, measurement easier; if false, suggests observation bias
- Different operators get different results (suggests operator artifact, not intention effect)

#### 3.2: Remote Viewing / Remote Perception
**Claim**: Subject can perceive information without sensory access

**Standard Measurement**:
- Baseline: Random guessing on described targets (should be ~20% correct for 5 options)
- Test: Subject describes target image they can't see, then match description to options
- Metric: % correct (vs. 20% chance), chi-square on hit rate

**How to Evaluate**:
- Ask: "Who scored the match (subject or independent judge)?" (Experimenter scoring = bias)
- Ask: "Were targets pre-selected or chosen after viewing?" (Post hoc = bias)
- Ask: "Can descriptions match multiple targets?" ("Saw red, warm" could match many targets)
- Request: Blind judging (judge doesn't know which description goes with which target)

**Red Flags**:
- Experimenter scores matches ("That's close enough!")
- Vague descriptions ("I sense something blue-ish") matched to target ("There's a blue pen in the image")
- No independent judge
- Subject given feedback between trials (learns which descriptions work)

#### 3.3: Cognition Influence / Bio-PK
**Claim**: Intention influences biological markers (heart rate, cortisol, brain activity)

**Standard Measurement**:
- Baseline: Subject's biological marker at rest/control
- Test: Subject attempts influence while marker monitored
- Metric: Change in marker (vs. expected variation)

**How to Evaluate**:
- Ask: "Is baseline documented?" (What's normal variation?)
- Ask: "Is measurement blind?" (Measurer doesn't know when "influence" is attempted)
- Ask: "Are confounds controlled?" (Subject isn't doing breathing exercises, stress, etc.)
- Request: Time series (is change sudden or gradual? Gradual = likely behavior change, not PK)

**Red Flags**:
- No baseline (can't judge if change is unusual)
- Single measurement point (can't distinguish signal from noise)
- Behavioral changes possible (subject relaxes = heart rate drops)
- Expectancy effects (subject knows when to influence = mind-body feedback)

### The Fraud Indicators

**Signs that claim may be fabricated** (not just flawed):
1. **Cherry-picked results**: Report good trials, omit bad ones
2. **Convenient failures**: "Effect only works when experimenter steps back" (convenient excuse)
3. **Vague methodology**: "I just feel the RNG" (no measurement)
4. **Responsive to incentives**: Effect appears when money/prestige at stake
5. **Resistance to scrutiny**: Author refuses replication or independent testing
6. **Post-hoc explanations**: "The effect was there but we didn't measure right" (after failure)
7. **Selective memory**: Subject recalls successes, forgets failures

**How to respond**:
- Request blind replication
- Request raw data (all runs, including failures)
- Document refusal (immutable record)
- Rate reputation accordingly (willingness to be tested = credibility signal)

### Exercise: Evaluating a Psionics Claim

**Sample Claim**:
"Subject successfully influenced RNG output. Operator ran 100 trials with subject focusing intention. RNG produced 6 more 1's than expected (55 vs. 49 expected). This is a 2σ deviation, p < 0.05."

**Your evaluation**:

1. **Red flags?** 
   - Single run (not replicated)
   - Small sample (100 trials; effect size tiny)
   - No control (what's baseline RNG behavior?)
   - p-value alone (no effect size context)
   
2. **Questions?**
   - "What's RNG hardware baseline (tested without subject)?"
   - "Did you run this test multiple times?"
   - "What's the full distribution (were there other 1-shifts in other runs)?"
   
3. **Verdict?**
   - REJECT Stage 1 (insufficient language discipline)
   - Rework: "Subject participated in 10 blocks of 1000 RNG trials each (10,000 total). Baseline RNG (tested without subject, 100,000 trials) showed mean=5000±70 for digit 1. Subject blocks showed mean=5200±90. Two-tailed t-test: t=2.1, p=0.04, effect size = 200 occurrences (4% deviation)."
   
4. **Stage 2 questions?**
   - Why is effect so small (4%)?
   - Is it reproducible across multiple subjects?
   - What confounds (subject stress, hardware bias, etc.)?

---

## Module 4: Decision-Making & Anti-Corruption (2 hours)

### Learning Objectives
- Make clear verdicts (accept/reject/request revision)
- Articulate reasoning (not just outcomes)
- Recognize and resist temptations (skeptic, believer, fraud)
- Understand role in The Game's mission

### The Three Temptations

#### 4.1: Skeptic Temptation
**What it is**: "All psionic claims are obviously fake, so rejection is safe"

**Why it's seductive**:
- Aligns with cultural skepticism
- Makes validator feel protective of science
- Quick decisions (don't need to deeply evaluate)

**The cost**:
- Blocks legitimate weak-signal research
- Validators who reflexively reject damage their reputation
- Game's mission requires fair evaluation, not tribal protection

**How to resist**:
- Engage with claims that pass language stage
- Reject specific measurement flaws, not the domain
- Accept that "subtle effect" is possible
- Remember: Dismissal without analysis = bias

#### 4.2: Believer Temptation
**What it is**: "Be open-minded, accept weaker evidence to encourage research"

**Why it's seductive**:
- Appears generous/inclusive
- Makes researchers feel supported
- Looks "open-minded"

**The cost**:
- Validators who accept weak claims destroy their reputation
- Fraud becomes viable
- Registry fills with false positives
- Game loses credibility

**How to resist**:
- Measurement rigor is how we support research
- Accepting fraud = setting researchers up to fail (others won't replicate)
- Real open-mindedness = rigorous evaluation
- Remember: Fraud detection is protecting researchers, not blocking them

#### 4.3: Conflict of Interest
**What it is**: Personal stake in outcome (money, prestige, tribal allegiance)

**Situations**:
- Validator personally believes in psionics (bias toward acceptance)
- Validator has funding from skeptic organization (bias toward rejection)
- Validator is friends with claim author (bias toward acceptance)
- Validator has published skepticism about psionics (bias toward rejection)

**How to manage**:
- Disclose conflicts explicitly
- Recuse when conflict is severe
- Let audit chain record your bias (transparent > hidden)
- Reputation accounts for conflicts (validators with fewer conflicts rank higher)

### Verdict Framework

**When evaluating a claim, ask in order**:

1. **Language audit (Stage 1)**
   - Does claim meet measurement format?
   - Can replication researcher understand it?
   - Verdict: REJECT (too vague) / REQUEST CLARIFICATION / PASS

2. **Measurement critique (Stage 2)**
   - Are confounds addressed?
   - Is sample size adequate?
   - Can this measurement produce claimed effect by artifact?
   - Verdict: SOUND / GAPS (specify) / CRITICAL FLAW

3. **Replication review (Stage 3)**
   - Does independent test confirm effect?
   - Verdict: VERIFIED / PARTIAL / FAILED

### Writing Verdicts

**Every verdict must explain the reasoning**, not just the conclusion.

**Bad verdict**:
"REJECT — Not real science"

**Good verdict**:
"REQUEST CLARIFICATION — Measurement passes language audit but has critical gap: no control condition. You report 'intention increased RNG 1's from 4900 to 5200 in 10,000 trials' but don't specify baseline RNG behavior (untested). Need: (1) Baseline RNG test (10,000+ runs, no subject), (2) Statistical test name and p-value, (3) Effect size as percentage. Resubmit with these details."

**Another good verdict**:
"MEASUREMENT SOUND — Adequate sample (100,000 trials), clear control, appropriate test (chi-square). Effect size small (2%) but detectable at this sample size. However, concerns: (1) Single-operator test (vulnerability to unconscious bias), (2) No explanation for why effect is small (suggests measurement artifact rather than genuine psionic effect). Advance to Stage 3 replication. Recommend: different operator, same equipment, same protocol."

**Another good verdict**:
"FAILED REPLICATION — Original claim: 5% deviation, p < 0.001. Independent test (same equipment, protocol, different operator): 1.2% deviation, p = 0.18 (not significant). Conclusion: Original effect likely measurement artifact or operator bias. Not confirmed as genuine psionic effect. Recommend: archive claim, investigate measurement artifact."

### Reputation Mechanics

**Your reputation as validator**:
- Correct rejections: +1 (fair assessment of flawed claim)
- Correct acceptances: +5 (identified legitimate effect)
- Dismissive rejections: -20 (rejected without measurement analysis)
- Fraudulent acceptances: -50 (approved obvious fraud)
- Honest replication failures: +2 (ran good test, got no result)

**Why these weights**:
- False rejections are common (expected in high-noise domain)
- False acceptances are rare and catastrophic (breed fraud)
- Replication attempts are valued (even if negative)
- The goal is rigor, not agreement

---

## Module 5: Case Studies (2 hours)

### Case Study 1: The Favorable RNG Effect

**Background**: 1980s parapsychology research claimed intention influenced RNG outcomes

**The Claim**:
"Princeton Engineering Anomalies Research Lab found statistically significant RNG deviations under intention focus (p < 0.001, 100M+ trials)."

**What went right**:
- Huge sample size (power to detect tiny effects)
- Statistical rigor (proper tests)
- Open methodology (published details)

**What went wrong**:
- Effect size extremely small (1 in 1000 trials deviated)
- No independent replication by skeptic labs
- Confounds not addressed (operator bias?)
- Indistinguishable from measurement artifact

**Validator lesson**:
- Big sample ≠ big effect
- Tiny effect + huge sample = statistically significant but question if real
- Replication critical (does skeptic lab replicate?)

---

### Case Study 2: The Failed Replication

**The Claim**:
"We successfully replicated the telekinesis effect from Study X under controlled conditions."

**What seemed right**:
- Claimed to use same equipment
- Same protocol
- Blinded conditions

**What was wrong**:
- Different operator (original effect was operator-specific)
- Different laboratory (environmental factors matter)
- Different subject population (college students vs. trained meditators)
- Effect size 10x smaller than original

**Validator lesson**:
- "Replication" requires identical conditions (hard to achieve)
- Small differences can eliminate effect (suggests artifact)
- Effect size decrease over replication = warning sign
- Partial replication is not confirmation

---

### Case Study 3: The Obvious Fraud

**The Claim**:
"Subject demonstrated perfect (100%) remote viewing accuracy on 20 trials."

**Red flags**:
- Impossibly high success rate (any effect would be much weaker)
- Small sample (20 trials insufficient to test effect)
- No binding/blinding mentioned
- Author financially incentivized (contest prize)

**How fraud appeared**:
- Independent replication: 3/20 correct (guessing rate: 5/100 = 5%)
- Investigation found: Subject's descriptions matched multiple targets (post-hoc judging bias)
- Author claimed independent judge was "too strict"

**Validator lesson**:
- Impossibly high success rates = fraud red flag
- Independent replication is fraud detection
- Dispute over scoring = measurement bias signal
- Document refusal to replicate (immutable record of credibility)

---

### Case Study 4: The Legitimate Negative Result

**The Claim**:
"We attempted to replicate published telekinesis effect and failed."

**Setup**:
- Same RNG hardware (verified to work)
- Same protocol (published details)
- Different operator (blind to hypothesis)
- 100,000 trials

**Result**:
- Baseline: 5000±71 for digit 1
- Test: 5020±75 for digit 1
- Difference: Not statistically significant (p = 0.32)

**Why this is valuable**:
- Negative result is data
- Null replication = falsification of original claim
- Transparency allows field to accumulate evidence
- Honest failure builds reputation

**Validator lesson**:
- Negative results are publishable (Game gives +2 reputation)
- Null replication ≠ fraud (it's how science works)
- Document carefully (why the failure?)
- Look for measurement improvements (did replication teach anything?)

---

## Module 6: Hands-On Review Project (5-10 hours)

### Your Task
Review 5 real (or realistic) psionic claims and provide written verdicts for each.

### Claims to Review

**Claim 1: Remote Viewing Study**
*[Full claim text provided separately]*
- Language audit assessment
- Measurement critique
- Replication protocol recommendations
- Written verdict with reasoning

**Claim 2: RNG Telekinesis**
*[Full claim text provided separately]*
- (Same assessment structure)

**Claim 3: Biological Influence**
*[Full claim text provided separately]*
- (Same assessment structure)

**Claim 4: Vague Ability Claim**
*[Full claim text provided separately]*
- (Language audit focused)

**Claim 5: High-Quality Negative Result**
*[Full claim text provided separately]*
- (Validation of proper replication)

### Evaluation Criteria
- All verdicts include specific reasoning
- Language audits identify precision issues
- Measurement critiques address confounds/sample size
- Verdicts are fair (neither dismissive nor uncritically accepting)
- Recommendations are actionable (claim author could revise)

---

## Certification Exam

### Format
- 30 minutes, open-book allowed
- 10 questions covering Modules 1-6
- Focus on practical decision-making (not memorization)

### Sample Questions

1. A claim has p < 0.001 but effect size = 0.5%. What's your verdict? Why?

2. An author reports "successful replication" but doesn't specify if new operator was blind to hypothesis. What's your concern?

3. You're tempted to reject a claim because psionics seems unlikely. How do you resist this temptation?

4. A claim reports "90% success rate on 10 trials." Should you advance to Stage 2? Why/why not?

5. Two independent replications of the same claim produce opposite results. What does this tell you?

6. An author resists your request for raw data, saying "the methodology is published, that should be enough." How do you respond?

7. You detect measurement bias in an otherwise elegant study. Do you REJECT or REQUEST CLARIFICATION? Justify.

8. A replicated effect has p = 0.02, effect size = 0.3%, confidence interval = [0.1%, 0.5%]. Is this publishable? Is it "real"?

9. You notice the claim author has a conflict of interest (financially invested in result). Do you recuse yourself? How do you document this?

10. Your verdicts have been consistently "REJECT" or "REQUEST CLARIFICATION." Only 1 in 20 claims advances. Is something wrong with you or with the claims?

---

## Continuing Education

**After certification**, psionics validators receive:
- Monthly case study analysis (new published psionic research)
- Quarterly anti-fraud training (emerging deception tactics)
- Annual competency review (verdicts audited for rigor)

**Reputation feedback**:
- Authors can appeal your verdict (triggers independent review)
- Aggregate validator statistics (how many claims do you accept/reject vs. peers?)
- Fraud detection accuracy (did claims you approved actually replicate?)

---

## Appendix: Key Resources

- **Statistical Testing**: Online calculators for sample size, power analysis
- **Measurement Design**: "How to Design Experiments" checklist
- **Fraud Detection**: "Red Flags in Research" guide
- **Case Study Database**: Archive of validated/invalidated psionic claims
- **Forum**: Validator discussion (Q&A on difficult verdicts)

---

## Contact & Questions

**Training Coordinator**: [TBD]  
**Technical Support**: [TBD]  
**Ethics/Conflict Questions**: [TBD]

---

**Final Note**

You're not here to believe or disbelieve in psionics. You're here to rigorously evaluate claims so the field can accumulate reliable knowledge. The framework doesn't depend on faith—it depends on measurement, replication, and transparency.

Your role: Keep signal and noise separate. That's all.

---

*Certification valid for 1 year. Renewal requires: 2 case study completions, zero reputation penalties, ≥ 8 verdicts reviewed by peers with agreement.*
