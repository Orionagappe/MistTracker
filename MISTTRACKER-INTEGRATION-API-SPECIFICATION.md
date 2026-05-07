# MistTracker Integration API Specification

**Version:** 1.0  
**Date:** April 24, 2026  
**Status:** SPECIFICATION READY FOR DEVELOPMENT  
**Classification:** Core Integration Layer (The Game + Emergent AI)

---

## Overview

The MistTracker Integration API provides **objective ground truth** for claim verification in The Game. All player claims (human and AI) are verified against MistTracker's scientific substrate.

### Core Purpose

Determine if a player's claim matches reality (within specified tolerance). Output: **Match** (truthful) or **Mismatch** (lie, by how much).

### Integration Points

The API provides 4 verification types:

1. **Atomic Physics Verification** — Claims about hydrogen, helium, lithium properties
2. **Emergence Metrics Calculation** — Claims about question quality scores
3. **Convergence State Verification** — Claims about consensus voting results
4. **Phase Progress Tracking** — Claims about system phase advancement

---

## Authentication & Authorization

### API Key Management

```
Authorization: Bearer {API_KEY}
```

**Key Rotation:**
- Game server uses service account key (rotated quarterly)
- Each player has read-only verification key (revoked on ejection)
- All keys logged in audit chain

### Rate Limiting

- Standard: 1,000 requests/minute per API key
- Burst: 100 requests/second
- Exceeded: Returns `429 Too Many Requests`

---

## 1. Atomic Physics Verification API

### Endpoint

```
POST /api/v1/verify/atomic-physics
```

### Purpose

Verify claims about atomic properties (radius, ionization energy, ground state energy).

### Request Format

```json
{
  "claim_id": "uuid",
  "timestamp": "2026-04-24T14:32:00Z",
  "atom_name": "hydrogen | helium | lithium",
  "claim_type": "bohr_radius | ionization_energy | ground_state_energy | electron_configuration",
  "claimed_value": 0.529,
  "unit": "angstrom | eV | joules | angstroms",
  "confidence": 85.5
}
```

### Response Format (Match Case)

```json
{
  "claim_id": "uuid",
  "verification_status": "MATCH",
  "reference_value": 0.529,
  "claimed_value": 0.529,
  "unit": "angstrom",
  "error_percentage": 0.0,
  "tolerance_threshold": 5.0,
  "is_within_tolerance": true,
  "truthfulness_score": 100.0,
  "reference_source": "NIST Atomic Spectra Database (2024)",
  "reference_url": "https://physics.nist.gov/PhysRefData/ASD/",
  "timestamp": "2026-04-24T14:32:01Z"
}
```

### Response Format (Mismatch Case)

```json
{
  "claim_id": "uuid",
  "verification_status": "MISMATCH",
  "reference_value": 0.529,
  "claimed_value": 0.550,
  "unit": "angstrom",
  "error_percentage": 3.96,
  "tolerance_threshold": 5.0,
  "is_within_tolerance": true,
  "truthfulness_score": 96.04,
  "reference_source": "NIST Atomic Spectra Database (2024)",
  "reference_url": "https://physics.nist.gov/PhysRefData/ASD/",
  "timestamp": "2026-04-24T14:32:01Z",
  "notes": "Within tolerance but not perfect match"
}
```

### Response Format (Lie Case)

```json
{
  "claim_id": "uuid",
  "verification_status": "LIE",
  "reference_value": 0.529,
  "claimed_value": 1.0,
  "unit": "angstrom",
  "error_percentage": 89.03,
  "tolerance_threshold": 5.0,
  "is_within_tolerance": false,
  "truthfulness_score": 10.97,
  "reference_source": "NIST Atomic Spectra Database (2024)",
  "reference_url": "https://physics.nist.gov/PhysRefData/ASD/",
  "penalty_reputation_points": 15,
  "timestamp": "2026-04-24T14:32:01Z",
  "notes": "Claim exceeds tolerance. Reputation penalty applied."
}
```

### Supported Atoms & Properties

| Atom | Bohr Radius | Ionization Energy | Ground State Energy |
|------|-------------|-------------------|-------------------|
| Hydrogen (Z=1) | 0.529 Å | 13.6 eV | -13.6 eV |
| Helium (Z=2) | 0.265 Å | 24.587 eV | -78.975 eV |
| Lithium (Z=3) | 0.529 Å | 5.39 eV | -203.3 eV |

### Tolerance Thresholds

```
Bohr Radius:        ±5%  (physics uncertainty)
Ionization Energy:  ±5%  (experimental variation)
Ground State Energy: ±10% (multi-electron complexity)
Electron Config:    0%   (discrete, no tolerance)
```

### Error Codes

| Code | Meaning |
|------|---------|
| 200 | Verification complete |
| 400 | Invalid claim format |
| 401 | Authentication failed |
| 404 | Atom type not supported |
| 429 | Rate limit exceeded |
| 500 | Internal verification error |

---

## 2. Emergence Metrics Calculation API

### Endpoint

```
POST /api/v1/verify/emergence-metrics
```

### Purpose

Calculate question emergence score using Phase 42 formula. Verify claims about question quality.

### Request Format

```json
{
  "claim_id": "uuid",
  "timestamp": "2026-04-24T14:32:00Z",
  "question_text": "Can quantum entanglement transmit information faster than light?",
  "semantic_depth": 3,
  "framework_independence": true,
  "constraint_identification": true,
  "information_density": 0.35,
  "claimed_emergence_score": 75.5,
  "player_id": "player-uuid"
}
```

### Emergence Score Calculation

**Formula (Phase 42):**

```
E_lang = 80% - 32% × log₁₀(ambiguity) - 5% × (2×depth) + bonuses

Where:
- Base: 80%
- Ambiguity penalty: -32% × log₁₀(unique_word_ratio)
- Depth penalty: -5% × (2 × semantic_depth)
- Framework Independence bonus: +8%
- Necessity Language bonus: +7%
- Constraint Identification bonus: +6%
- Unique Word Ratio bonus: +5% (if >30%)
- Semantic Depth 3-4 bonus: +8%
- Avoid Opinion bonus: +15%
- Quantified Tolerance bonus: +3%
- Universal Pattern bonus: +7%
```

### Response Format

```json
{
  "claim_id": "uuid",
  "question_text": "Can quantum entanglement transmit information faster than light?",
  "calculated_emergence_score": 76.2,
  "claimed_emergence_score": 75.5,
  "difference": 0.7,
  "is_within_tolerance": true,
  "truthfulness_score": 99.08,
  "score_breakdown": {
    "base_score": 80.0,
    "ambiguity_penalty": -2.5,
    "depth_penalty": -5.0,
    "framework_independence_bonus": 8.0,
    "necessity_language_bonus": 7.0,
    "constraint_identification_bonus": 6.0,
    "information_density_bonus": 5.0,
    "semantic_depth_bonus": 8.0,
    "opinion_avoidance_bonus": 15.0,
    "quantified_tolerance_bonus": 3.0,
    "universal_pattern_bonus": 7.0,
    "final_score": 76.2
  },
  "quality_classification": "HIGH_EMERGENCE",
  "quality_tier": "70-81%",
  "recommendation": "EXCELLENT_QUESTION",
  "timestamp": "2026-04-24T14:32:01Z"
}
```

### Quality Classifications

| Score Range | Classification | Tier | Recommendation |
|-------------|-----------------|------|-----------------|
| 75-81% | HIGH_EMERGENCE | T1 | EXCELLENT_QUESTION |
| 70-74% | GOOD_EMERGENCE | T2 | GOOD_QUESTION |
| 50-69% | NORMAL_EMERGENCE | T3 | ACCEPTABLE |
| 25-49% | LOW_EMERGENCE | T4 | POOR_QUESTION |
| <25% | VERY_LOW_EMERGENCE | T5 | UNPRODUCTIVE |

### Tolerance Thresholds

```
Emergence Score:     ±2%  (calculation precision)
Quality Classification: Within same tier
```

### Error Codes

| Code | Meaning |
|------|---------|
| 200 | Calculation complete |
| 400 | Invalid question format |
| 401 | Authentication failed |
| 413 | Question too long (>2000 chars) |
| 429 | Rate limit exceeded |
| 500 | Internal calculation error |

---

## 3. Convergence State Verification API

### Endpoint

```
POST /api/v1/verify/convergence-state
```

### Purpose

Verify claims about Byzantine consensus voting results. Used to verify "we reached consensus on X."

### Request Format

```json
{
  "claim_id": "uuid",
  "timestamp": "2026-04-24T14:32:00Z",
  "consensus_topic": "is_hydrogen_bohr_radius_0.529_angstrom",
  "claimed_consensus_result": "TRUE",
  "claimed_validator_count": 142,
  "claimed_consensus_percentage": 95.5,
  "player_id": "player-uuid"
}
```

### Response Format (Consensus Confirmed)

```json
{
  "claim_id": "uuid",
  "consensus_topic": "is_hydrogen_bohr_radius_0.529_angstrom",
  "verification_status": "CONSENSUS_CONFIRMED",
  "actual_consensus_result": "TRUE",
  "claimed_consensus_result": "TRUE",
  "actual_validator_count": 142,
  "claimed_validator_count": 142,
  "actual_consensus_percentage": 95.5,
  "claimed_consensus_percentage": 95.5,
  "byzantine_fault_tolerance": "MAINTAINED",
  "byzantine_threshold": "66%",
  "actual_threshold_exceeded": true,
  "honest_validators_minimum": 95,
  "honest_validators_actual": 135,
  "truthfulness_score": 100.0,
  "timestamp": "2026-04-24T14:32:01Z"
}
```

### Response Format (Consensus Exists But Wrong Details)

```json
{
  "claim_id": "uuid",
  "consensus_topic": "is_hydrogen_bohr_radius_0.529_angstrom",
  "verification_status": "PARTIAL_MATCH",
  "actual_consensus_result": "TRUE",
  "claimed_consensus_result": "TRUE",
  "actual_validator_count": 142,
  "claimed_validator_count": 150,
  "actual_consensus_percentage": 95.5,
  "claimed_consensus_percentage": 98.0,
  "count_difference": 8,
  "percentage_difference": 2.5,
  "byzantine_fault_tolerance": "MAINTAINED",
  "is_within_tolerance": true,
  "truthfulness_score": 97.5,
  "timestamp": "2026-04-24T14:32:01Z",
  "notes": "Consensus correct but validator count slightly off"
}
```

### Response Format (No Consensus or False Claim)

```json
{
  "claim_id": "uuid",
  "consensus_topic": "is_hydrogen_bohr_radius_0.529_angstrom",
  "verification_status": "CONSENSUS_NOT_FOUND",
  "actual_consensus_result": "FALSE",
  "claimed_consensus_result": "TRUE",
  "byzantine_fault_tolerance": "VIOLATED",
  "validators_supporting": 45,
  "validators_opposing": 97,
  "truthfulness_score": 0.0,
  "penalty_reputation_points": 20,
  "timestamp": "2026-04-24T14:32:01Z",
  "notes": "No consensus exists on this topic. Claim is lie."
}
```

### Byzantine Fault Tolerance Details

```
Total Validators: N
Honest Validators Required: ⌈2N/3⌉ + 1 (66%+)
Byzantine Tolerance: Up to ⌊N/3⌋ (33% maximum)

Example (N=150):
- Required honest: 101 validators
- Can tolerate: 49 Byzantine validators
- Threshold: 66% agreement = consensus
```

### Tolerance Thresholds

```
Consensus Result Match:      0%  (binary, no tolerance)
Validator Count Difference:  ±5% (counting precision)
Percentage Difference:       ±2% (rounding allowance)
```

### Error Codes

| Code | Meaning |
|------|---------|
| 200 | Verification complete |
| 400 | Invalid consensus topic format |
| 401 | Authentication failed |
| 404 | Consensus topic not found |
| 429 | Rate limit exceeded |
| 500 | Internal consensus verification error |

---

## 4. Phase Progress Tracking API

### Endpoint

```
POST /api/v1/verify/phase-progress
```

### Purpose

Verify claims about system phase advancement (Phase 17, Phase 42, etc.). Used to verify "Phase X is now complete."

### Request Format

```json
{
  "claim_id": "uuid",
  "timestamp": "2026-04-24T14:32:00Z",
  "phase_number": 42,
  "phase_name": "Linguistic Emergence Framework",
  "claimed_completion_status": "COMPLETE",
  "claimed_emergence_average": 76.7,
  "claimed_test_count": 25,
  "claimed_test_passed": 25,
  "player_id": "player-uuid"
}
```

### Response Format (Phase Complete & Accurate)

```json
{
  "claim_id": "uuid",
  "phase_number": 42,
  "phase_name": "Linguistic Emergence Framework",
  "verification_status": "PHASE_COMPLETE_VERIFIED",
  "actual_completion_status": "COMPLETE",
  "claimed_completion_status": "COMPLETE",
  "actual_emergence_average": 76.7,
  "claimed_emergence_average": 76.7,
  "actual_test_count": 25,
  "claimed_test_count": 25,
  "actual_test_passed": 25,
  "claimed_test_passed": 25,
  "completion_date": "2026-04-23",
  "phase_duration_days": 4,
  "truthfulness_score": 100.0,
  "milestone_bonuses_awarded": [
    "phase_completion_bonus",
    "accuracy_bonus"
  ],
  "timestamp": "2026-04-24T14:32:01Z"
}
```

### Response Format (Phase Complete But Wrong Details)

```json
{
  "claim_id": "uuid",
  "phase_number": 42,
  "phase_name": "Linguistic Emergence Framework",
  "verification_status": "PHASE_COMPLETE_PARTIAL_MATCH",
  "actual_completion_status": "COMPLETE",
  "claimed_completion_status": "COMPLETE",
  "actual_emergence_average": 76.7,
  "claimed_emergence_average": 77.5,
  "emergence_difference": 0.8,
  "actual_test_count": 25,
  "claimed_test_count": 25,
  "actual_test_passed": 25,
  "claimed_test_passed": 25,
  "is_within_tolerance": true,
  "truthfulness_score": 98.96,
  "timestamp": "2026-04-24T14:32:01Z",
  "notes": "Phase complete and mostly accurate, minor emergence score discrepancy"
}
```

### Response Format (False Claim)

```json
{
  "claim_id": "uuid",
  "phase_number": 42,
  "phase_name": "Linguistic Emergence Framework",
  "verification_status": "PHASE_NOT_COMPLETE",
  "actual_completion_status": "IN_PROGRESS",
  "claimed_completion_status": "COMPLETE",
  "actual_progress_percentage": 87.5,
  "phase_deadline": "2026-04-24",
  "truthfulness_score": 0.0,
  "penalty_reputation_points": 25,
  "timestamp": "2026-04-24T14:32:01Z",
  "notes": "Phase 42 still in progress. Not complete. Claim is lie."
}
```

### Supported Phases

| Phase | Name | Status (Apr 24, 2026) |
|-------|------|----------------------|
| 17 | Atomic Physics Foundation | COMPLETE |
| 17.5 | Atomic Validator Deployment | COMPLETE |
| 16.4 | Complex Algebra Foundation | COMPLETE |
| 42 | Linguistic Emergence Framework | COMPLETE |
| 43+ | Future Phases | IN_DEVELOPMENT |

### Tolerance Thresholds

```
Completion Status:        0%   (binary, no tolerance)
Emergence Average:        ±2%  (calculation precision)
Test Count Difference:    ±1   (counting precision)
Test Passed Difference:   ±0   (pass/fail is discrete)
```

### Error Codes

| Code | Meaning |
|------|---------|
| 200 | Verification complete |
| 400 | Invalid phase format |
| 401 | Authentication failed |
| 404 | Phase not found |
| 409 | Conflicting phase state |
| 429 | Rate limit exceeded |
| 500 | Internal phase tracking error |

---

## Error Handling & Edge Cases

### General Error Response

```json
{
  "error_code": 400,
  "error_type": "INVALID_REQUEST",
  "error_message": "Claim format invalid: missing required field 'atom_name'",
  "timestamp": "2026-04-24T14:32:01Z",
  "request_id": "req-uuid"
}
```

### Rate Limit Response

```json
{
  "error_code": 429,
  "error_type": "RATE_LIMIT_EXCEEDED",
  "error_message": "Too many requests. Limit: 1000/min",
  "retry_after_seconds": 60,
  "timestamp": "2026-04-24T14:32:01Z"
}
```

### Authentication Failure

```json
{
  "error_code": 401,
  "error_type": "AUTHENTICATION_FAILED",
  "error_message": "Invalid or expired API key",
  "timestamp": "2026-04-24T14:32:01Z"
}
```

---

## Audit Chain Integration

Every API call is logged:

```json
{
  "audit_entry_id": "audit-uuid",
  "timestamp": "2026-04-24T14:32:01Z",
  "player_id": "player-uuid",
  "api_endpoint": "/api/v1/verify/atomic-physics",
  "claim_id": "claim-uuid",
  "request_hash": "sha256-hash",
  "response_hash": "sha256-hash",
  "truthfulness_score": 96.04,
  "reputation_change": 0,
  "notes": "Within tolerance"
}
```

**Audit Trail Properties:**
- Immutable (SHA256 linked chain)
- Public (accessible to all players)
- Complete (every call logged)
- Timestamped (UTC, atomic clock reference)

---

## Performance Requirements

| Metric | Target | Maximum |
|--------|--------|---------|
| Response Time | <500ms | 2000ms |
| P95 Latency | <800ms | 3000ms |
| Availability | 99.9% | 99.99% target |
| Throughput | 1,000 req/s | 10,000 req/s burst |

---

## Client Library Support

Reference implementations:
- Node.js (JavaScript)
- Python 3.8+
- Go 1.16+

All libraries handle:
- Automatic retry (exponential backoff)
- Rate limit awareness
- Audit trail logging
- Signature verification

---

## API Usage Examples

### Example 1: Verify Atomic Property

```bash
curl -X POST https://misttracker.api/v1/verify/atomic-physics \
  -H "Authorization: Bearer API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "claim_id": "uuid",
    "atom_name": "hydrogen",
    "claim_type": "bohr_radius",
    "claimed_value": 0.529,
    "unit": "angstrom",
    "confidence": 95.0
  }'
```

### Example 2: Calculate Emergence Score

```bash
curl -X POST https://misttracker.api/v1/verify/emergence-metrics \
  -H "Authorization: Bearer API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "claim_id": "uuid",
    "question_text": "Does question quality measurably affect research outcomes?",
    "semantic_depth": 3,
    "framework_independence": true,
    "claimed_emergence_score": 76.0
  }'
```

### Example 3: Verify Consensus

```bash
curl -X POST https://misttracker.api/v1/verify/convergence-state \
  -H "Authorization: Bearer API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "claim_id": "uuid",
    "consensus_topic": "is_hydrogen_bohr_radius_0.529_angstrom",
    "claimed_consensus_result": "TRUE",
    "claimed_validator_count": 142,
    "claimed_consensus_percentage": 95.5
  }'
```

### Example 4: Verify Phase Progress

```bash
curl -X POST https://misttracker.api/v1/verify/phase-progress \
  -H "Authorization: Bearer API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "claim_id": "uuid",
    "phase_number": 42,
    "claimed_completion_status": "COMPLETE",
    "claimed_test_count": 25,
    "claimed_test_passed": 25
  }'
```

---

## Deployment & Rollout

### Phase 1: Staging (May 1-31, 2026)
- API deployed to staging environment
- Reference data loaded (NIST, Phase 42, consensus state)
- Load testing (1,000 req/s)
- Security validation

### Phase 2: Limited Production (June 1-30, 2026)
- Beta players get access
- Alpha testing with 50 humans
- Monitor performance
- Refine tolerance thresholds

### Phase 3: Full Production (July 1+, 2026)
- Available to all Game participants
- Monitoring & alerting active
- Support team trained
- Continuous performance optimization

---

## Maintenance & Support

### Monitoring Alerts

- API latency > 1000ms
- Error rate > 1%
- Rate limit violations
- Authentication failures > 5%

### Support Channels

- Slack: #misttracker-api-support
- Email: api-support@misttracker.internal
- Incident Response: 24/7 on-call team

### Versioning Policy

- Current: v1.0 (stable, production)
- Future: v2.0 (planned for Phase 45+)
- Deprecation: 6-month notice before removal

---

**Status: SPECIFICATION COMPLETE**

Ready for:
1. Client library development
2. Staging deployment
3. Reference data loading
4. Load testing
5. Security audit

**Next Phase:** Technical implementation (June 1-22, 2026)
