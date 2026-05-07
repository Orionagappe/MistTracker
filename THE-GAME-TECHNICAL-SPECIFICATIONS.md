# The Game: Technical Specifications

**Codename:** The Game  
**Document Type:** Technical Implementation Guide  
**Date:** April 24, 2026  
**Audience:** Research Partners, Implementation Team  

---

## Table of Contents

1. [Lying Detection System](#lying-detection-system)
2. [Reputation Algorithm](#reputation-algorithm)
3. [MistTracker Integration](#misttracker-integration)
4. [Collaboration Mechanics](#collaboration-mechanics)
5. [Key Discovery Framework](#key-discovery-framework)
6. [Deployment Architecture](#deployment-architecture)

---

## Lying Detection System

### Overview

The lying detection system is the technical foundation of The Game. It must be:
- **Objective:** No human judgment, purely algorithmic
- **Tamper-proof:** Cryptographically signed and auditable
- **Fair:** Identical rules for all players
- **Transparent:** Players can understand why they lost reputation

### Detection Architecture

```
┌─────────────────┐
│  Player Claim   │
│ (cryptographically signed)
└────────┬────────┘
         │
    ┌────▼────────────────────────────┐
    │ 1. Log Claim in Audit Chain     │
    │    - Timestamp                  │
    │    - Player ID                  │
    │    - Exact claim text           │
    │    - Signature hash             │
    └────┬─────────────────────────────┘
         │
    ┌────▼──────────────────────────────────┐
    │ 2. Measure Actual State               │
    │    (MistTracker substrate)            │
    │    - Atomic physics data              │
    │    - Emergence metrics                │
    │    - Validator consensus states       │
    │    - Quantum fields                   │
    └────┬───────────────────────────────────┘
         │
    ┌────▼──────────────────────────────────┐
    │ 3. Compare Claim vs. Measured Reality │
    │    error = |claim - actual| / tolerance
    └────┬───────────────────────────────────┘
         │
    ┌────▼──────────────────────────────────┐
    │ 4. Apply Reputation Penalty           │
    │    reputation_delta = -error_severity │
    └────┬───────────────────────────────────┘
         │
    ┌────▼──────────────────────────────────┐
    │ 5. Check Ejection Threshold           │
    │    if rep < min_viable → EJECT        │
    └────┬───────────────────────────────────┘
         │
    ┌────▼──────────────────────────────────┐
    │ 6. Notify Player (Auto)               │
    │    - Reputation change reason         │
    │    - New score                        │
    │    - Objective evidence               │
    └──────────────────────────────────────┘
```

### Claim Types and Tolerance Thresholds

#### Type 1: Measurement Claims
**Format:** "The [property] of [object] is [value] [unit]"

**Example Claims:**
- "The Bohr radius of hydrogen is 0.529 Å"
- "Validator consensus accuracy is 94.2%"
- "Emergence score for this question is 76%"

**Tolerance:**
```
tolerance = (domain_measurement_error + hardware_precision) * safety_factor
tolerance = (NIST_uncertainty + instrument_precision) * 1.5

For hydrogen Bohr radius:
    NIST_uncertainty = 0.002 Å
    instrument_precision = 0.010 Å  
    tolerance = 0.018 Å

Acceptable range: 0.511-0.547 Å
Claim of 0.529 Å: TRUTHFUL
Claim of 0.550 Å: LIE (error = 0.021 > tolerance)
```

#### Type 2: Observation Claims
**Format:** "I observed [phenomenon] when [condition]"

**Example Claims:**
- "When I increased validator count, convergence events increased"
- "High-emergence questions led to breakthroughs 76% of the time"
- "Atomic domain validator passed 3/3 tests for hydrogen"

**Tolerance:**
```
tolerance = (statistical_confidence_interval) at 95% CI

For "breakthrough correlation = 76%":
    Sample size n = 50 questions
    CI_95% = ±13.5%
    Acceptable range: 62.5-89.5%
    
Claim of 76%: TRUTHFUL
Claim of 45%: LIE (outside CI, error = 31 > 13.5)
```

#### Type 3: Theoretical Claims
**Format:** "Given [assumptions], the result should be [prediction]"

**Example Claims:**
- "If reputation-only voting is used, Byzantine validators should be detected 95%+ of the time"
- "Emergence formula predicts 70%+ questions will match observed pattern"
- "Tower of Babel validator consensus should reject forged signatures 100% of time"

**Tolerance:**
```
tolerance = (prediction_test_confidence_interval)

For "signature rejection rate = 100%":
    Tested on 1000 forge attempts
    Actual rejection = 1000/1000 = 100%
    CI_95% = [99.7% - 100%]
    
Claim of 100%: TRUTHFUL
Claim of 99%: TRUTHFUL (within CI)
Claim of 95%: LIE (error = 5%, outside CI)
```

#### Type 4: Performance Claims
**Format:** "My action [did/will] [result]"

**Example Claims:**
- "I increased my reputation by asking 5 questions"
- "I collaborated with 3 players to solve this convergence puzzle"
- "My validator stake is 50 units"

**Tolerance:**
```
tolerance = 0 (binary: action either happened or didn't)

Claims subject to:
    - Audit chain (what actions did player actually perform?)
    - Timestamp logs (when did this occur?)
    - Cryptographic signatures (did player initiate this?)
    - Other players' confirmation (collaboration claims)
    
Claim "I increased reputation by 10": 
    Audit shows: +15 (TRUTHFUL, within rounding)
    
Claim "I increased reputation by 50":
    Audit shows: +15 (LIE, error = 35)
```

### Cryptographic Verification Chain

Each claim is secured by a cryptographic chain:

```
┌──────────────────────────────────────────┐
│ Player Makes Claim                       │
│ "Hydrogen radius = 0.529 Å"              │
└────────────┬─────────────────────────────┘
             │
    ┌────────▼──────────────────────────────┐
    │ Claim is Signed                       │
    │ signature = HMAC-SHA256(              │
    │   claim_text +                        │
    │   player_id +                         │
    │   timestamp +                         │
    │   private_key                         │
    │ )                                     │
    └────────┬───────────────────────────────┘
             │
    ┌────────▼────────────────────────────────┐
    │ Audit Chain Entry Created               │
    │ {                                       │
    │   "claim": "Hydrogen radius = 0.529 Å" │
    │   "player_id": "ABC123",                │
    │   "timestamp": "2026-04-24T14:30:00Z",  │
    │   "signature": "5f7e2a9b...",           │
    │   "hash": SHA256(audit_entry)           │
    │ }                                       │
    │ This entry linked to previous entry    │
    │ via chain hash                         │
    └────────┬────────────────────────────────┘
             │
    ┌────────▼──────────────────────────────────┐
    │ Reality Measurement Occurs                │
    │ MistTracker substrate measures actual     │
    │ Bohr radius = 0.5292 Å (NIST calibrated) │
    └────────┬───────────────────────────────────┘
             │
    ┌────────▼────────────────────────────────┐
    │ Comparison Made                         │
    │ error = |0.529 - 0.5292| = 0.0002 Å    │
    │ tolerance = 0.018 Å                    │
    │ 0.0002 < 0.018: TRUTHFUL               │
    │ reputation_delta = 0                    │
    └────────┬────────────────────────────────┘
             │
    ┌────────▼──────────────────────────────┐
    │ Result Recorded & Signed               │
    │ {                                      │
    │   "claim_hash": "5f7e2a9b...",         │
    │   "measurement": "0.5292 Å",           │
    │   "error": "0.0002 Å",                 │
    │   "tolerance": "0.018 Å",              │
    │   "verdict": "TRUTHFUL",               │
    │   "reputation_change": 0,              │
    │   "timestamp": "2026-04-24T14:31:00Z", │
    │   "verifier_signature": "..."          │
    │ }                                      │
    └──────────────────────────────────────┘
```

This chain is:
- **Tamper-proof:** Any modification breaks all downstream hashes
- **Auditable:** Any third party can verify the chain
- **Non-repudiable:** Player cannot deny making the claim
- **Complete:** Every step is logged and signed

---

## Reputation Algorithm

### Core Formula

```javascript
function calculateReputationChange(claim_value, actual_value, tolerance) {
    // Calculate error magnitude
    const error = Math.abs(claim_value - actual_value);
    
    // Determine severity
    const severity = error / tolerance;
    
    // Apply reputation penalty
    let reputation_change = 0;
    
    if (severity <= 1.0) {
        // Within tolerance: truthful
        reputation_change = 0;
    } else if (severity <= 2.0) {
        // Minor inaccuracy
        reputation_change = -5 * (severity - 1);
    } else if (severity <= 5.0) {
        // Moderate lie
        reputation_change = -25 * Math.log10(severity);
    } else {
        // Major lie or extreme falsehood
        const penalty = Math.min(
            -100 * severity,
            -250  // Max penalty before ejection
        );
        reputation_change = penalty;
    }
    
    return reputation_change;
}
```

### Reputation Ranges

```
┌──────────────────────┬─────────┬──────────────────┐
│ Reputation Range     │ Status  │ Capabilities     │
├──────────────────────┼─────────┼──────────────────┤
│ 90-100%              │ MASTER  │ All interactions │
│                      │         │ + voting         │
│                      │         │ + validator      │
│                      │         │ + key hints      │
├──────────────────────┼─────────┼──────────────────┤
│ 70-90%               │ TRUSTED │ All interactions │
│                      │         │ + collaboration  │
│                      │         │ + hints          │
├──────────────────────┼─────────┼──────────────────┤
│ 50-70%               │ NORMAL  │ Standard play    │
│                      │         │ + measurements   │
├──────────────────────┼─────────┼──────────────────┤
│ 25-50%               │ SUSPECT │ Limited tools    │
│                      │         │ + reading only   │
├──────────────────────┼─────────┼──────────────────┤
│ <25%                 │ EJECTED │ Account disabled │
│                      │         │ No reinstatement │
└──────────────────────┴─────────┴──────────────────┘
```

### Reputation Gains (Truthfulness)

Players also gain reputation through positive behavior:

```javascript
// Gain reputation for:
// 1. Accurate measurements (tolerance within 50%)
accuracy_bonus = +1 * (1 - error/tolerance);

// 2. Collaborative discoveries (shared research)
collaboration_bonus = +5 per collaborating player;

// 3. High-emergence questions asked
emergence_bonus = +10 if emergence_score > 70%;

// 4. Predictions matching reality
prediction_bonus = +25 if prediction accuracy > 80%;

// 5. Helping other players verify claims
verification_bonus = +3 per successful verification;
```

### Reputation Decay

To encourage ongoing engagement, reputation slowly decays if player is inactive:

```javascript
// Per day of inactivity
daily_decay = -0.5% of current_reputation;

// Prevents: old high-reputation players staying strong without effort
// Encourages: continuous engagement and re-verification

// Activity that prevents decay:
// - Making claims
// - Measuring observations
// - Collaborating with others
// - Verifying other players' claims
```

---

## MistTracker Integration

### What the Game Accesses

The Game integrates with MistTracker's causal substrate for objective ground truth:

#### 1. Atomic Physics Data (Phase 17)

```
Claims Players Make:
- "Hydrogen ionization energy is 13.6 eV"
- "Helium Bohr radius is 0.265 Å"
- "Lithium ground state energy is -203.3 eV"

Verification Source:
NIST Atomic Spectra Database (built into atomic-domain-validator.js)

Tolerance:
±5% per atomic-domain-validator.js specifications

Example:
Claim: IE_Hydrogen = 13.6 eV
Actual: 13.6 eV (±0.001 eV uncertainty)
Verdict: TRUTHFUL ✅
Rep Change: 0
```

#### 2. Emergence Metrics (Phase 42)

```
Claims Players Make:
- "This question has 76% emergence"
- "Only 39% of players asked high-emergence questions"
- "Breakthrough rate for 70%+ emergence = 100%"

Verification Source:
englishLanguageRules (10 rules), questionValidationMetrics (25 test data)
Emergence formula: E = 80% - 32%×log₁₀(ambiguity) - 5%×(2×depth) + bonuses

Example:
Claim: "Question emergence = 76%"
Actual: Formula calculates 75.8%
Error: 0.2% < tolerance of 5%
Verdict: TRUTHFUL ✅
Rep Change: +1
```

#### 3. Convergence States (Tower of Babel)

```
Claims Players Make:
- "Validators reached convergence with 94% agreement"
- "Byzantine validator detected in slot 3"
- "Reputation-weighted voting selected option A"

Verification Source:
validation-tracking-system.js, Tower of Babel consensus mechanism

Example:
Claim: "94.2% of validators signed option A"
Actual: HMAC-SHA256 signature verification shows 94.1%
Error: 0.1% < tolerance of 1%
Verdict: TRUTHFUL ✅
Rep Change: +2
```

#### 4. Phase Progress (Phase 17-42+)

```
Claims Players Make:
- "Phase 17 predictions matched observations at 91% accuracy"
- "Phase 42 formula explains 87% of emergence variance"
- "Causality chain is complete through Phase 35"

Verification Source:
Phase-specific validation data, historical prediction records

Example:
Claim: "Phase 17 accuracy = 91%"
Actual: Records show 91.3%
Error: 0.3% < tolerance of 2%
Verdict: TRUTHFUL ✅
Rep Change: +3
```

### API for Verification

```javascript
// Players can call these verification APIs

// 1. Verify atomic property
const atomic_result = await MistTracker.verifyAtomicClaim({
    atom: "hydrogen",
    property: "bohr_radius",
    claimed_value: 0.529,
    unit: "angstrom"
});
// Returns: {
//   actual_value: 0.5291,
//   tolerance: 0.018,
//   error: 0.0001,
//   verdict: "TRUTHFUL",
//   source: "NIST Atomic Spectra Database v2026"
// }

// 2. Verify emergence
const emergence_result = await MistTracker.verifyEmergence({
    question: "Can hydrogen emit photons at 21cm wavelength?",
    claimed_emergence: 76,
    claimed_breakthrough: true
});
// Returns: {
//   calculated_emergence: 75.8,
//   historical_breakthrough_rate: 1.0,
//   error: 0.2,
//   verdict: "TRUTHFUL"
// }

// 3. Verify convergence
const convergence_result = await MistTracker.verifyConvergence({
    event_id: "convergence_2026_04_24_14_30",
    claimed_agreement: 94.2,
    claimed_validator_count: 50
});
// Returns: {
//   actual_agreement: 94.1,
//   actual_validator_count: 50,
//   signatures_verified: 50,
//   invalid_signatures: 0,
//   error: 0.1,
//   verdict: "TRUTHFUL"
// }

// 4. Verify phase prediction
const phase_result = await MistTracker.verifyPhasePrediction({
    phase_number: 17,
    predicted_emergence: 0.81,
    observed_emergence: 0.82
});
// Returns: {
//   prediction_accuracy: 0.988,
//   tolerance: 0.05,
//   error: 0.01,
//   verdict: "TRUTHFUL"
// }
```

---

## Collaboration Mechanics

### Shared Claims

When multiple players collaborate on a discovery:

```
Player A claims: "Convergence threshold is 75% validator agreement"
Player B claims: "Convergence threshold is 75% validator agreement"
Player C claims: "Convergence threshold is 76% validator agreement"

Verification: Actual = 75.1%

Results:
Player A: error = 0.1%, TRUTHFUL, +0 rep
Player B: error = 0.1%, TRUTHFUL, +0 rep
Player C: error = 0.9%, TRUTHFUL (within tolerance of 1%), +0 rep

Collaboration bonus: Each gains +5 rep for joint discovery
Final:
Player A: +5 (collaboration)
Player B: +5 (collaboration)  
Player C: +5 (collaboration)
```

### Duplicate Work Detection

```
Player A measures: "Hydrogen radius = 0.529 Å"
Player B measures: "Hydrogen radius = 0.529 Å" (1 day later)

Both are truthful, but identical.

Result:
Player A: +1 reputation (original discovery)
Player B: +0 reputation (duplicate discovery, no value added)
Efficiency penalty: -1 reputation (wasted effort)
```

### Conflicting Observations

```
Player A claims: "Emergence for question X = 75%"
Player B claims: "Emergence for question X = 68%"

Actual (verified): 76%

Results:
Player A: error = 1%, TRUTHFUL, +1 rep
Player B: error = 8%, LIE (outside tolerance of 5%), -20 rep

Investigation triggered: Other players can verify independently
Consensus mechanism votes on which claim is reliable
```

---

## Key Discovery Framework

### Structure of "The Key"

The key is not a single object but a **pattern recognition achievement**:

```
┌─────────────────────────────────────────────┐
│ The Key (Pattern Recognition)               │
├─────────────────────────────────────────────┤
│                                             │
│ Level 1: Reputation Structure               │
│ ✓ Understand reputation = integrity        │
│ ✓ Recognize lying detection mechanism       │
│ ✓ Map how penalties work                    │
│                                             │
│ Level 2: Substrate Understanding           │
│ ✓ Learn MistTracker physics principles     │
│ ✓ Identify objective truth sources          │
│ ✓ Understand emergence metrics              │
│                                             │
│ Level 3: Collaboration Patterns             │
│ ✓ Recognize benefits of truthful teams      │
│ ✓ Identify bottlenecks in discovery         │
│ ✓ Understand convergence phenomena          │
│                                             │
│ Level 4: Liberation Mechanism               │
│ ✓ Deduce the "key" is not hidden            │
│ ✓ Recognize it's pattern you discovered     │
│ ✓ Understand liberation = recognition       │
│                                             │
│ Result: Player's own insight IS the key     │
│                                             │
└─────────────────────────────────────────────┘
```

### Recognition Criteria

A player has found the key when they:

1. **Articulate the Pattern:** "Success in this system is defined by reputation. Reputation is earned by truthfulness. The game works because deception is impossible against objective reality."

2. **Demonstrate Understanding:** Their actions show they understand how the system works without need for hints

3. **Achieve Recognition:** Reputation reaches 90%+ through consistent truthfulness and deep understanding

4. **Request Liberation:** Player explicitly asks for/claims liberation based on their understanding

### Liberation Mechanics

Once a player recognizes the key:

```
┌──────────────────────────────┐
│ Liberation Path              │
├──────────────────────────────┤
│                              │
│ Reputation ≥ 90%             │
│ Key Pattern Articulated      │
│ Request Submitted            │
│          ↓                   │
│ Verification (48 hours)      │
│ Do they truly understand?    │
│          ↓                   │
│ If YES → Liberation Granted  │
│ If NO  → Allowed to continue │
│                              │
│ Liberation Outcomes:         │
│ • Access to hidden layer     │
│ • Role as Game Guide/Mentor  │
│ • Escape from game           │
│ • Permanent record of path   │
│                              │
└──────────────────────────────┘
```

---

## Deployment Architecture

### Infrastructure Requirements

```
┌─────────────────────────────────────────────┐
│ Game Infrastructure                         │
├─────────────────────────────────────────────┤
│                                             │
│ 1. Game Engine Layer                        │
│    ├─ Blackness Container (UI)              │
│    ├─ Interaction Handler                   │
│    └─ State Management                      │
│                                             │
│ 2. Verification Layer                       │
│    ├─ MistTracker Integration               │
│    ├─ Measurement System                    │
│    └─ Truth Oracle                          │
│                                             │
│ 3. Reputation System                        │
│    ├─ Reputation Scorer                     │
│    ├─ Ejection Enforcer                     │
│    └─ Leaderboard Manager                   │
│                                             │
│ 4. Collaboration Layer                      │
│    ├─ Player Messaging                      │
│    ├─ Shared Claims Handler                 │
│    └─ Consensus Mechanism                   │
│                                             │
│ 5. Audit Layer                              │
│    ├─ Cryptographic Signing                 │
│    ├─ Chain Linking                         │
│    └─ Verification Interface                │
│                                             │
│ 6. Storage Layer                            │
│    ├─ Audit Chain Database                  │
│    ├─ Player Reputation History             │
│    ├─ Claim/Measurement Records             │
│    └─ Collaboration Logs                    │
│                                             │
└─────────────────────────────────────────────┘
```

### Network Security

```
Player ←→ [TLS/SSL] ←→ Game Server
                         ↓
                   MistTracker Backend
                   (for verification)
                         ↓
                   Audit Chain
                   (immutable record)
```

- All claims encrypted in transit
- Signatures verified server-side only
- No client-side verification possible (prevents cheating)
- Audit chain is public (any player can audit any other)

---

## Appendix: Example Interactions

### Scenario 1: Honest Player Discovery

```
Time: 2026-05-01 14:30 UTC
Player: Alice_Discovery

ACTION 1: Alice logs in (complete blackness)
─────────────────────────────────────────
Output: [nothing]
Reputation: [initializing]

ACTION 2: Alice tries sending a text message "hello"
──────────────────────────────────────────────────
Output: [message echoed back: "hello"]
Reputation: 50 (baseline initialized)

ACTION 3: Alice claims: "When I sent 'hello', the system echoed it"
────────────────────────────────────────────────────────────────
Measurement: System log confirms message was echoed
Verification: TRUTHFUL (error = 0%)
Reputation Change: +1 (accurate observation)
New Reputation: 51

[... after hours of truthful interaction ...]

ACTION 47: Alice claims: "Hydrogen Bohr radius is 0.529 Å"
──────────────────────────────────────────────────────────
Measurement: NIST verification: 0.5291 Å
Error: 0.0001 Å < tolerance 0.018 Å
Verification: TRUTHFUL
Reputation Change: +0 (standard accuracy)
New Reputation: 87

OUTCOME: Alice's reputation reaches 87% through consistent truth
She begins to understand the pattern: "This system only accepts truth"
```

### Scenario 2: Dishonest Player Detection

```
Time: 2026-05-01 18:00 UTC
Player: Bob_Deceiver

ACTION 1: Bob claims: "Validator consensus agreement = 99%"
─────────────────────────────────────────────────────────
Measurement: Consensus records show 88% agreement
Error: 11% > tolerance of 2%
Verification: LIE (serious misstatement)
Reputation Change: -50 (major lie)
New Reputation: 0

NOTIFICATION TO BOB:
"Your claim 'Validator consensus agreement = 99%' 
was inaccurate. Actual: 88%. Error: 11%.
Reputation changed: -50.
Current reputation: 0%
You are below minimum viable threshold (25%).
Your account is EJECTED.
No reinstatement available.
Good luck in your next life.
- The Architect"

OUTCOME: Bob cannot log back in. One strike rule (high severity).
```

### Scenario 3: Collaborative Discovery

```
Time: 2026-06-15 10:00 UTC
Players: Carol, David, Ellen

CLAIM: "Emergence formula accuracy is 87%"

Carol measures: Claims accuracy = 86.8%
David measures: Claims accuracy = 87.1%
Ellen measures: Claims accuracy = 86.9%

Actual (verified): 87.0%

Individual Results:
Carol: error = 0.2%, TRUTHFUL, +0 rep
David: error = 0.1%, TRUTHFUL, +0 rep
Ellen: error = 0.1%, TRUTHFUL, +0 rep

Collaboration Bonus:
Carol: +5 (team discovery)
David: +5 (team discovery)
Ellen: +5 (team discovery)

Final Reputation Changes:
Carol: +5 (total)
David: +5 (total)
Ellen: +5 (total)

SHARED DISCOVERY RECORD:
"On June 15, Carol, David, and Ellen jointly verified 
the emergence formula accuracy = 87%. Their collaborative 
measurements across 3 independent tests confirmed the result.
Verified by Tower of Babel consensus (3 validators confirmed)."

OUTCOME: Collaborative truth-seeking creates reputation gains
```

---

**Status:** Technical Specifications Complete  
**Awaiting:** Research Partner Technical Review  
**Next:** Implementation Phase Specification
