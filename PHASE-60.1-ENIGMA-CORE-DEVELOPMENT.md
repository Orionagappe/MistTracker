# PHASE 60.1: ENIGMA Core Development
## C Foundation Implementation

**Classification:** Development & Testing (X.X Notation)  
**Parent Phase:** Phase 60 (ENIGMA SSH Hardening - Research Only)  
**Purpose:** Build core C components for CRYSTAL SSH daemon  
**Focus:** Protocol parser, key derivation engine, hardware binding validator  
**Target:** June 2026 completion  

⚠️ **RESEARCH ONLY - NOT FOR GIT DISTRIBUTION**

---

## Development Overview

### Objective
Build the foundational C components that will replace sshd entirely and reroute all SSH dependencies through the CRYSTAL framework.

### Scope (Phase 60.1)

**Core Components to Implement:**

1. **CRYSTAL Protocol Parser (cryptprotocol-parser.c)**
   - Parse SSH-compatible protocol packets
   - Extract ED25519 certificates
   - Perform hardware MAC extraction
   - Phase 17-aware pre-scoring

2. **CRYSTAL Key Derivation Engine (crystal-kdf.c)**
   - Threat-based key material generation
   - Hardware MAC cryptographic binding
   - Timestamp entropy injection
   - Phase 17 state integration

3. **Hardware MAC Validator (hwbind-validator.c)**
   - MAC address binding verification
   - Device fingerprinting
   - Anti-replay protection
   - Session binding enforcement

### Success Criteria

✅ Protocol parser parses valid SSH packets <150ms  
✅ Key derivation produces consistent output with same inputs  
✅ Hardware binding prevents cross-device decryption  
✅ Code audit-ready (documented, no complex dependencies)  
✅ Integration-ready with Phase 17 API (May 2026)

---

## Development Environment Setup

### Build Tools Required

```
Build System: GNU Make + GCC/Clang
Testing: CUnit (C unit testing framework)
Code Analysis: cppcheck, splint
Version Control: git (local only, not distributed)
Documentation: Doxygen
Performance Profiling: perf, valgrind
```

### Directory Structure

```
PHASE-60.1-Core/
├── src/
│   ├── cryptprotocol-parser.c
│   ├── cryptprotocol-parser.h
│   ├── crystal-kdf.c
│   ├── crystal-kdf.h
│   ├── hwbind-validator.c
│   ├── hwbind-validator.h
│   └── common.h
├── tests/
│   ├── test-parser.c
│   ├── test-kdf.c
│   ├── test-hwbind.c
│   └── Makefile
├── include/
│   ├── crystal-types.h
│   └── phase17-api.h
├── build/
│   ├── Makefile
│   └── config.mk
├── docs/
│   ├── PROTOCOL-SPEC.md
│   ├── KDF-DESIGN.md
│   ├── HWBIND-SPEC.md
│   └── API-REFERENCE.md
└── README-PHASE-60.1.md
```

---

## Component 1: CRYSTAL Protocol Parser

### Specification

**Purpose:** Parse SSH protocol packets, extract authentication data, perform Phase 17 pre-assessment.

### Function Signatures

```c
// Initialize parser with Phase 17 threat scorer
parser_ctx_t* parser_init(phase17_scorer_t *scorer);

// Parse incoming SSH packet
int parser_process_packet(parser_ctx_t *ctx,
                         const uint8_t *packet,
                         size_t packet_len,
                         parse_result_t *result);

// Extract ED25519 certificate from packet
int parser_extract_certificate(parser_ctx_t *ctx,
                               certificate_t *cert);

// Get hardware MAC from client info
int parser_extract_hwmac(parser_ctx_t *ctx,
                        char *hwmac_out,
                        size_t hwmac_len);

// Perform real-time threat pre-scoring
int parser_threat_prescore(parser_ctx_t *ctx,
                          phase17_score_t *score);
```

### Data Structures

```c
typedef struct {
    uint32_t packet_type;
    uint32_t packet_length;
    uint8_t *payload;
    size_t payload_len;
    uint32_t mac_address;      // 48-bit MAC as uint32 (partial)
    uint32_t timestamp;         // Connection timestamp
    phase17_score_t threat_pre; // Pre-auth threat score
} parse_result_t;

typedef struct {
    uint8_t key_algorithm[32];       // ED25519
    uint8_t public_key[64];          // Public key material
    uint32_t validity_start;         // Unix timestamp
    uint32_t validity_end;           // Unix timestamp (24hrs from start)
    uint8_t signature[256];          // Signature over cert
    uint8_t hardware_binding[6];     // MAC address binding
} certificate_t;

typedef struct {
    const uint8_t *packet_data;
    size_t current_pos;
    size_t total_len;
    phase17_scorer_t *scorer;
    certificate_t current_cert;
    phase17_score_t threat_score;
} parser_ctx_t;
```

### Design Notes

- **Phase 17 Integration:** Every parsed packet gets pre-scored before authentication
- **Zero-Copy:** Parser works with packet buffer directly (no allocation)
- **Time-Sensitive:** Must complete parse + pre-score in <100ms
- **Hardware MAC:** Extracted early for binding validation

### Test Cases

```c
test_parse_valid_packet()         // Valid ED25519 cert packet
test_parse_malformed_packet()      // Invalid packet structure
test_extract_certificate()         // Certificate extraction
test_extract_hwmac()              // MAC address extraction
test_threat_prescore()            // Phase 17 pre-assessment
test_parse_performance()          // <150ms target
test_boundary_conditions()        // Edge cases
```

---

## Component 2: CRYSTAL Key Derivation Engine

### Specification

**Purpose:** Derive session key material from exact key + hardware binding + threat state + Phase 17 integration.

### Function Signatures

```c
// Initialize KDF context with Phase 17 connection
kdf_ctx_t* kdf_init(phase17_scorer_t *scorer,
                   const char *hwmac_binding,
                   uint32_t connection_timestamp);

// Derive session key from exact user key
int kdf_derive_session_key(kdf_ctx_t *ctx,
                          const uint8_t *exact_key,
                          size_t key_len,
                          uint8_t *session_key_out,
                          size_t session_key_len);

// Update key material based on current threat level
int kdf_update_threat_adaptive(kdf_ctx_t *ctx,
                              phase17_score_t current_threat);

// Generate rotation schedule based on threat
int kdf_get_rotation_schedule(kdf_ctx_t *ctx,
                             uint32_t *rotation_interval_sec);

// Bind key to hardware MAC permanently
int kdf_bind_hardware(kdf_ctx_t *ctx,
                     const uint8_t *hwmac);

// Cleanup sensitive material
void kdf_cleanup(kdf_ctx_t *ctx);
```

### Cryptographic Design

```
Key Derivation Flow:

Exact Key (provided by user)
    ↓
Hardware MAC Address (extracted from connection)
    ↓
Connection Timestamp (current time)
    ↓
Phase 17 Threat Score (0-5)
    ↓
CRYSTAL KDF (HMAC-SHA256 based)
    ↓
Session Key Material (256 or 512 bits based on threat)
    ↓
Per-Connection Cipher Initialization
```

### Threat-Adaptive Key Strength

```c
// Pseudocode for threat-based key derivation
if (threat_score < 2) {
    // Low threat: 256-bit key, fast KDF rounds
    session_key_bits = 256;
    kdf_rounds = 100000;
} else if (threat_score < 4) {
    // Moderate threat: 384-bit key, medium rounds
    session_key_bits = 384;
    kdf_rounds = 500000;
} else {
    // High threat: 512-bit key, maximum rounds + hardware binding
    session_key_bits = 512;
    kdf_rounds = 2000000;
    apply_hardware_binding = TRUE;
}

// KDF: HMAC-SHA256(key, salt || hwmac || timestamp || threat_state)
derived_key = HMAC_SHA256_iter(
    exact_key,
    salt_from_certificate,
    hwmac_binding + timestamp + threat_state,
    kdf_rounds
);
```

### Hardware Binding Integration

```c
// Hardware binding ensures:
// 1. Key material is unique per device (MAC address)
// 2. Cannot decrypt on different hardware
// 3. Attempts to change MAC invalidate the session
// 4. Cryptographically prevents key export

uint8_t hardware_salt[32];
crypto_hash_sha256(hardware_salt,
                   (const uint8_t *)hwmac, 6,
                   connection_entropy, 32);

// Final key includes hardware binding
session_key = HMAC_SHA256(exact_key,
                         hardware_salt || derived_key);
```

### Data Structures

```c
typedef struct {
    uint8_t master_key[64];           // User's exact key
    uint8_t hardware_mac[6];          // Device MAC address binding
    uint32_t connection_timestamp;    // Session start time
    phase17_scorer_t *scorer;         // Reference to Phase 17
    uint8_t session_key[64];          // Derived session key (up to 512 bits)
    size_t session_key_len;           // Actual key length (256/384/512)
    uint32_t rotation_interval;       // Seconds until re-key
    phase17_score_t current_threat;   // Current threat assessment
    uint8_t kdf_state[256];           // Internal KDF state (sensitive)
} kdf_ctx_t;
```

### Test Cases

```c
test_kdf_deterministic()           // Same inputs → same key
test_kdf_threat_adaptive()         // Threat level changes key length
test_kdf_hardware_binding()        // MAC binding enforced
test_kdf_key_not_derived_twice()   // Each call unique (entropy)
test_kdf_rotation_schedule()       // Threat determines rotation
test_kdf_performance()             // <50ms derivation
test_kdf_sensitive_cleanup()       // No key remnants in memory
test_kdf_exact_key_required()      // Wrong key → garbage output
```

---

## Component 3: Hardware MAC Validator

### Specification

**Purpose:** Verify hardware MAC binding, prevent session cross-device transfer, enforce device identity.

### Function Signatures

```c
// Initialize validator with expected MAC
hwbind_t* hwbind_init(const uint8_t *expected_mac);

// Verify current connection MAC matches binding
int hwbind_verify(hwbind_t *validator,
                 const uint8_t *current_mac);

// Get current device MAC address
int hwbind_get_local_mac(uint8_t *mac_out);

// Create hardware fingerprint
int hwbind_fingerprint_device(uint8_t *fingerprint_out,
                             size_t fingerprint_len);

// Detect MAC spoofing attempts
int hwbind_detect_spoof(hwbind_t *validator,
                       const uint8_t *claimed_mac,
                       spoof_result_t *result);

// Cryptographically bind session to hardware
int hwbind_session_bind(hwbind_t *validator,
                       session_key_t *session);

// Cleanup
void hwbind_cleanup(hwbind_t *validator);
```

### Verification Flow

```
SSH Connection Request
    ↓
Extract Client MAC Address
    ↓
Hardware Binding Validator
├── Compare with certificate binding
├── Verify MAC not spoofed (cross-reference)
├── Check for replay attacks
└── Verify session consistency
    ↓
Allow/Deny + Log MAC verification event
```

### Spoof Detection

```c
typedef struct {
    uint8_t claimed_mac[6];
    uint8_t expected_mac[6];
    int mac_mismatch;
    int repeated_change;           // MAC changed multiple times in session
    int unusual_timestamp;         // Out-of-sequence timing
    uint32_t last_verified_time;
    uint32_t current_time;
    int spoof_detected;
} spoof_result_t;
```

### Data Structures

```c
typedef struct {
    uint8_t expected_mac[6];           // MAC from certificate
    uint8_t session_mac[6];            // MAC at session start
    uint8_t current_mac[6];            // Current MAC verification
    uint32_t session_start_time;
    uint32_t last_verification_time;
    int verified;                      // Has MAC been verified in this session
    int spoofing_attempts;             // Count of MAC mismatches
} hwbind_t;
```

### Test Cases

```c
test_hwbind_valid_mac()             // Correct MAC passes
test_hwbind_mac_mismatch()          // Wrong MAC fails
test_hwbind_mac_change_detection()  // Changing MAC detected
test_hwbind_get_local_mac()         // Correctly retrieves system MAC
test_hwbind_spoof_detection()       // Spoofing attempts detected
test_hwbind_session_binding()       // Session cryptographically bound
test_hwbind_mac_spoofing_resistance()  // Replay/spoof resistant
test_hwbind_multiple_devices()      // Different MACs isolated
```

---

## Build & Testing Strategy

### Build Process

```makefile
# Phase 60.1 Makefile targets
clean:        # Remove all build artifacts
all:          # Build all components
parser:       # Build protocol parser only
kdf:          # Build key derivation engine only
hwbind:       # Build hardware validator only
tests:        # Build test suite
run-tests:    # Compile and run all tests
coverage:     # Generate code coverage report
analyze:      # Static code analysis (cppcheck)
perf:         # Performance benchmarks
```

### Test Harness (CUnit Framework)

```c
// Example test structure
int main() {
    CU_pSuite suite = CU_add_suite("CRYSTAL Components", NULL, NULL);
    
    // Parser tests
    CU_add_test(suite, "Parse Valid Packet", test_parse_valid_packet);
    CU_add_test(suite, "Extract Certificate", test_extract_certificate);
    
    // KDF tests
    CU_add_test(suite, "KDF Deterministic", test_kdf_deterministic);
    CU_add_test(suite, "KDF Threat-Adaptive", test_kdf_threat_adaptive);
    
    // HWBind tests
    CU_add_test(suite, "MAC Verification", test_hwbind_valid_mac);
    CU_add_test(suite, "Spoof Detection", test_hwbind_spoof_detection);
    
    CU_basic_run_tests();
    return CU_get_number_of_failures();
}
```

### Performance Targets

| Component | Target | Success Criteria |
|-----------|--------|-----------------|
| **Protocol Parser** | <150ms | Packet parsed + threat pre-scored |
| **KDF Derivation** | <50ms | Session key derived |
| **MAC Validation** | <10ms | Verification complete |
| **Full Auth Flow** | <300ms | All three components |

### Code Quality Gates

✅ Cppcheck: zero critical/high severity findings  
✅ Valgrind: zero memory leaks  
✅ Code Coverage: >85% line coverage  
✅ Splint: code analysis clean  
✅ Documentation: Doxygen complete  

---

## Integration Points

### Phase 17 API Connection

```c
// Phase 17 scorer interface for CRYSTAL components
typedef struct {
    phase17_score_t (*score_connection)(
        const uint8_t *packet,
        size_t packet_len,
        const uint8_t *hwmac
    );
    
    int (*get_cipher_params)(
        phase17_score_t threat,
        cipher_params_t *params_out
    );
    
    int (*log_auth_event)(
        auth_event_t *event
    );
} phase17_scorer_t;
```

### Audit Logging Integration

```c
// Each component logs events to immutable store
typedef struct {
    uint32_t timestamp;
    uint8_t event_type;        // PARSE, KDF, HWBIND
    phase17_score_t threat;
    uint8_t status;            // SUCCESS, FAILURE
    uint8_t hwmac[6];
    char description[256];
} audit_event_t;
```

---

## Milestones

### Week 1-2: Protocol Parser Development
- [ ] Parser header design and review
- [ ] Implement packet parsing logic
- [ ] Phase 17 pre-scoring integration
- [ ] Unit tests (80% coverage minimum)
- [ ] Performance optimization (<150ms)

### Week 3-4: Key Derivation Engine
- [ ] KDF algorithm specification review
- [ ] Implement threat-adaptive derivation
- [ ] Hardware binding integration
- [ ] Unit tests (85% coverage minimum)
- [ ] Performance optimization (<50ms)

### Week 5: Hardware Binding Validator
- [ ] MAC verification logic implementation
- [ ] Spoof detection algorithm
- [ ] Session binding mechanism
- [ ] Unit tests (80% coverage minimum)
- [ ] Performance optimization (<10ms)

### Week 6: Integration & Validation
- [ ] Integration test suite
- [ ] End-to-end auth flow testing
- [ ] Code quality analysis (Cppcheck, Splint)
- [ ] Memory safety (Valgrind)
- [ ] Documentation completion

### Week 7: Performance & Security Review
- [ ] Performance benchmarking
- [ ] Security code review
- [ ] Phase 17 integration verification
- [ ] Final audit preparation

### Week 8: Readiness for Phase 60.2
- [ ] Core components frozen
- [ ] API stable for integration
- [ ] Documentation complete
- [ ] Ready for Phase 60.2 (full integration)

---

## Documentation Requirements

### Per-Component Documentation

1. **PROTOCOL-SPEC.md**
   - SSH packet structure handled
   - Certificate extraction logic
   - Phase 17 pre-scoring algorithm
   - Examples and test cases

2. **KDF-DESIGN.md**
   - Key derivation algorithm specification
   - Threat-adaptive key strength logic
   - Hardware binding mechanism
   - Entropy sources

3. **HWBIND-SPEC.md**
   - MAC verification algorithm
   - Spoof detection logic
   - Session binding implementation
   - Cross-device isolation guarantee

4. **API-REFERENCE.md**
   - Complete function reference
   - Data structure definitions
   - Error codes and handling
   - Integration examples

---

## Risk Mitigation

### Security Risks

| Risk | Mitigation |
|------|-----------|
| Key material in memory | Secure cleanup (memset_s), sensitive allocation |
| Timing attacks | Constant-time comparison, no early exit paths |
| MAC spoofing | Cryptographic binding, replay detection |
| Phase 17 dependency | Graceful fallback (default threat scoring) |

### Development Risks

| Risk | Mitigation |
|------|-----------|
| Performance regression | Continuous benchmarking, target gates |
| Integration issues | Weekly Phase 17 API compatibility checks |
| Code quality drift | Automated analysis gates before commit |
| Schedule slippage | Daily standup, weekly milestone review |

---

## Success Criteria (Phase 60.1 Complete)

✅ **Functional**
- All three components implemented and tested
- >85% code coverage on all components
- <300ms end-to-end authentication flow
- Zero memory leaks or segfaults

✅ **Integration-Ready**
- Phase 17 API integrated and working
- Audit event logging operational
- Hardware binding enforced
- Threat-adaptive parameters applied

✅ **Security**
- Code audit complete (no critical findings)
- Splint analysis clean
- Valgrind verification passed
- Cryptographic binding verified

✅ **Documented**
- API reference complete
- Algorithm specifications documented
- Integration examples provided
- Test results documented

✅ **Ready for Phase 60.2**
- Core components frozen
- API stable for integration layer
- Performance targets met
- All blockers resolved

---

## Next Phase (60.2): Full Integration

Phase 60.2 will integrate these core components with:
- Phase 17 integration layer (complete)
- Immutable audit system (complete)
- Certificate management (complete)
- Session management (complete)
- Real-time threat adaptation (complete)

This builds toward August 2026 production deployment for Phase 59 competition readiness.

---

**Classification:** Development & Testing (Phase X.X)  
**Status:** Ready for implementation (May 2026)  
**Parent Phase:** Phase 60 (ENIGMA) - Research Only  
**Not for Git Distribution**
