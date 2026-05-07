# Psionics Domain Specification — Game Update
## The First Unknown-Domain Breach

**Date**: April 26, 2026  
**Status**: Phase 1 — Framework Definition  
**Objective**: Establish rigorous validation framework for psionic phenomena claims

---

## I. Domain Definition

### What Is Psionics (For Game Purposes)?

**Not**: Magic, supernatural, unfalsifiable mysticism.  
**Is**: Alleged measurable effects of human intention on physical systems under controlled conditions.

**Scope**: Claims about:
- Telekinetic influence on object state/motion
- Remote perception of information (spatial or temporal)
- Cognitive effects on random systems
- Influence on biological targets (measurable markers)
- Information transfer without known mechanisms

---

## II. Language Discipline — The Measurement Requirement

### Mandatory Format for Valid Claims

Every psionic claim MUST specify:

1. **Effect** (precise description)
   - Bad: "Mental ability to move things"
   - Good: "Intention-correlated deviation from statistical randomness in RNG output (p < 0.05)"

2. **System Under Test** (what is being influenced)
   - Example: "True RNG hardware seeded from quantum noise"
   - Example: "Human biological marker: cortisol levels in sealed test subject"

3. **Measurement Method** (how effect is detected)
   - Example: "Chi-square analysis of 100,000 RNG trials"
   - Example: "Salivary cortisol assay before/after intervention"

4. **Null Hypothesis** (what we'd expect by chance)
   - Example: "RNG deviation ~ N(0, σ²) from theoretical distribution"
   - Example: "Cortisol change ~ normal variation in control group"

5. **Effect Size** (magnitude claimed)
   - Example: "2.3σ deviation from mean across 1000 trials"
   - NOT "significant effect" (too vague)

6. **Replication Protocol** (how others test the same claim)
   - Example: "Same RNG hardware, same protocol, independent operator"
   - Example: "Blind measurement with independent biochemist"

### Claims Failing Language Discipline Are Auto-Rejected
- "I moved a pencil with my mind" → REJECTED (unmeasured)
- "Intention influenced RNG output (p < 0.01)" → ACCEPTED FOR VALIDATION

---

## III. Validator Protocol — Psionics Specialist

### Validator Qualifications
- **Required**: Statistical analysis expertise (hypothesis testing, p-values, effect sizes)
- **Required**: Measurement design background (where false positives hide)
- **Preferred**: Physics/engineering background (understands noise floors)
- **Training**: Project Halo Level 2 (handles genuine uncertainty)

### Validation Procedure

#### Stage 1: Language Audit (Day 1)
- [ ] Claim meets measurement format (Effect, System, Method, Null, Size, Replication)
- [ ] All variables operationalized (could someone else replicate from claim alone?)
- [ ] Effect size specified numerically (not "significant")
- [ ] Null hypothesis stated explicitly

**Verdict Options**:
- **PASS** → Advance to Stage 2
- **REQUEST CLARIFICATION** → Claim author has 3 days to reformat
- **REJECT** → Insufficient language discipline; resubmit when precise

#### Stage 2: Measurement Critique (Days 2-5)
- [ ] Could measurement method produce claimed effect by chance? (False positive risk)
- [ ] What would falsify this claim? (Can we design test that breaks it?)
- [ ] Is sample size adequate for effect size claimed?
- [ ] Are confounding variables controlled?

**Deep Questions**:
- "If your effect doesn't exist, what measurement artifact could produce your result?"
- "What's your confidence you'd see this again with new operator/equipment?"
- "What's the most likely way your measurement is wrong?"

**Verdict Options**:
- **MEASUREMENT SOUND** → Advance to Stage 3
- **MEASUREMENT GAPS** → Request author revision (specific weaknesses listed)
- **CRITICAL FLAW** → Reject; explain why effect claim can't be distinguished from error

#### Stage 3: Replication Review (Days 6-30)
- [ ] Attempt independent replication under claimed protocol
- [ ] Document failures and successes
- [ ] Compare results to author's claims

**Verdict Options**:
- **VERIFIED** → Reputation gain for claim author; entry to Psionics Registry
- **PARTIAL REPLICATION** → Effect real but weaker or narrower than claimed
- **FAILED REPLICATION** → Effect not confirmed; investigation into why

#### Stage 4: Consequence Mapping
- **IF** psionic effect is real, what changes?
  - Physics models? (No—local violation of randomness ≠ new physics)
  - Technology? (Yes—implies usable information channel)
  - Implications? (New research areas, new falsifiability targets)

---

## IV. Anti-Corruption Measures

### The Skeptic Temptation
**Risk**: Validator dismisses legitimate weak-signal claims to appear "rational"
**Defense**: 
- Claims passing language stage deserve replication attempt
- Dismissal requires specific critique, not reflexive rejection
- Reputation penalty for validators who reject without measurement analysis

### The Believer Temptation
**Risk**: Validator accepts weak evidence to appear "open-minded"
**Defense**:
- Replication is mandatory; author intent doesn't matter
- Only statistically significant, replicable effects count
- Reputation penalty for validators who approve obviously flawed measurement

### The Fraud Risk
**Risk**: Author fabricates data knowing measurement looks "real"
**Defense**:
- Blind replication by independent operator
- Request raw data; audit for statistical impossibilities
- Claim becomes permanent public record; repeated failure destroys reputation

---

## V. Psionics Registry Structure

### Verified Psionic Effect Entry
```
EFFECT_ID: PSI-2026-001
EFFECT: RNG deviation under intention focus
CLAIM_AUTHOR: [validator who discovered it]
VERIFICATION_DATE: [when replicated confirmed]
EFFECT_SIZE: 2.1σ deviation per 1000 trials (p=0.017)
REPLICATION_SUCCESS_RATE: 6/8 independent attempts (75%)
MEASUREMENT_METHOD: Chi-square analysis of quantum RNG output
FALSIFICATION_METHOD: [specific test that would break the claim]
RESEARCH_IMPLICATIONS: Suggests information bandwidth ~0.5 bits/second under optimal conditions
```

### Registry Status Levels
- **PRELIMINARY**: Language audit passed, awaiting replication
- **REPLICATED**: Independent verification confirmed
- **PARTIAL**: Effect real but differs from claim in size/scope
- **INVALIDATED**: Replication failed; likely measurement artifact
- **ARCHIVED**: No new evidence for 2+ years; removed from active registry

---

## VI. Integration with The Game

### Psionics as Game Domain
- **Players**: Can submit psionic ability claims
- **Validators**: Specialists trained in measurement/statistics
- **Reputation System**: Normal mechanics apply
  - True psionic claim → +50 reputation + Registry entry
  - False claim from honest measurement → +10 (good effort)
  - Fabricated data → -100 + auto-ejection
  - Dismissive validator → -20 (blocks legitimate research)

### MistTracker Integration
**New claim type**: `psionic-effect`
- Uses same audit chain
- Requires psionics validator pool approval
- Cross-references to Psionics Registry
- Links to replication methodology

### Timeline (Deployment with August 6 Game Launch)
- **Aug 1**: Psionics domain open to claims
- **Aug 1-Sept 1**: Stage 1-2 validation (language + measurement critique)
- **Sept 1-Oct 31**: Stage 3 replication (independent operator tests)
- **Nov 1+**: Registry entry for replicated effects

---

## VII. Why Psionics Tests The Game's Rigor

### Framework Validation
Psionics is the domain where:
- Generic skepticism fails (it prevents legitimate research)
- Generic belief fails (it accepts fraud)
- **Only framework discipline survives**: Language precision + replication + measurement rigor

### The Grey Ooze Strategy
The ooze will tempt validators:
- **"Why waste resources on unproven claims?"** (omits: dismissal prevents discovery)
- **"Be open-minded; accept more claims"** (omits: fraud and false positives)
- **"Statistics are subjective anyway"** (omits: p-values are designed to be objective)

### Victory Condition
**The Game proves its framework works when**:
- Psionics validators accept/reject claims based on measurement rigor, not belief
- Validators can articulate why they chose replication/rejection
- Registry accumulates genuine (replicable) findings alongside invalidations
- Team reputation grows through disciplined investigation, not tribal belief

---

## VIII. Success Metrics (First 6 Months)

- [ ] 50+ psionic claims submitted through Game platform
- [ ] 80%+ fail Stage 1 language audit (expected—vague is easy)
- [ ] 3-5 claims reach Stage 3 replication
- [ ] 1-2 effects confirmed as reproducible
- [ ] Zero validator reputation penalties for "wrongly rejecting" failed claims
- [ ] Zero false positives in Registry

---

## IX. Known Risks

**Risk**: Validators lack expertise in statistics/measurement design
**Mitigation**: Require certification in hypothesis testing before psionics validator approval

**Risk**: Replication is expensive; small effects hard to confirm
**Mitigation**: Tier claims by effect size; smaller effects get proportionally longer replication windows

**Risk**: Author fabricates data; independent operator can't detect it
**Mitigation**: Periodic audit of validator's replication methodology; spot-check raw data

**Risk**: Domain attracts fraud/entertainment seekers
**Mitigation**: Reputation cost is severe; Game players self-select toward legitimacy

---

## X. Long-Term Vision (Year 2-3)

If psionics effects are verified:
- Establish measurement standard (how to test correctly)
- Create public database of replicable effects
- Build interfaces for military/medical/commercial interest
- Spawn specialized research teams within Game

If psionics effects are invalidated:
- Document why (measurement artifacts, statistical illusions, etc.)
- Publish "how fraud hides in psionic research"
- Use insights to strengthen validation in other domains
- Build reputation for rigorous negative results

**Either way**: Game proves its framework produces reliable answers where other systems produce only belief/dismissal.

---

## References
- XSERVER-DEVELOPER-WIKI.md (Language discipline requirement)
- THE-GREY-OOZE-ADVERSARY-SPECIFICATION.md (Corruption temptations)
- ALPHA-ROLLOUT-SPECIFICATION.md (Game mechanics)
- PROJECT-HALO.md (Validator certification path)
