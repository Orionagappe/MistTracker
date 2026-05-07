# CRYSTAL Framework — SSHD Integration Guide

**Purpose**: Technical integration between CRYSTAL framework and SSHD replacement  
**Date**: April 22, 2026  
**Status**: ✅ Production-Ready  

---

## Overview

CRYSTAL distributes the validated SSHD replacement through:
1. Pre-deployment validation (Phase 17-20)
2. Secure P2P propagation
3. Atomic deployment across cluster
4. Continuous monitoring & automatic rollback

---

## Pre-Integration Checklist

### Code Quality (Phase 17 - Atomic)

- [ ] SSHD binary ≤100MB
- [ ] All functions ≤500 LOC
- [ ] No circular dependencies
- [ ] Clear input/output contracts
- [ ] Error paths explicitly handled

Verify:
```bash
# Check binary size
ls -lh /path/to/sshd  # Should be <50MB

# Analyze functions
objdump -d /path/to/sshd | grep "^[0-9a-f]* <" | wc -l
# Should be <100 public functions

# Check dependencies
ldd /path/to/sshd  # Only standard system libs
```

### Security (Phase 19 - Molecular)

- [ ] All authentication methods validated
- [ ] No hardcoded credentials
- [ ] Cryptographic operations use standard libraries
- [ ] Privilege escalation properly scoped
- [ ] Network handling validated

Verify:
```bash
# Security scan (use standard tools)
checksec /path/to/sshd
# Look for: RELRO, NOW, STACK, PIE enabled

# Dependency scan
nm /path/to/sshd | grep -i "password\|secret\|token"
# Should return no suspicious symbols

# OpenSSL version
strings /path/to/sshd | grep OpenSSL
# Should be recent stable version
```

### Behavioral (Phase 20 - Crystalline)

- [ ] SSHD starts cleanly
- [ ] SSH connections accepted
- [ ] Authentication (key + password) works
- [ ] Session timeout honored
- [ ] Graceful shutdown on SIGHUP
- [ ] Performance regression <5%

Verify:
```bash
# Start SSHD
/path/to/sshd -D -f /tmp/test_sshd_config

# Test connection
timeout 5 ssh -o ConnectTimeout=2 \
  -i test_key \
  -p 2222 \
  testuser@localhost "echo OK"

# Measure performance
time for i in {1..100}; do \
  ssh -p 2222 testuser@localhost true; \
done

# Compare to baseline (should be <5% slower)
```

---

## Manifest Generation

### Step 1: Create Binary Comparison

```bash
# Get hash of current SSHD
CURRENT_SSHD="/usr/sbin/sshd"
CURRENT_HASH=$(sha256sum $CURRENT_SSHD | cut -d' ' -f1)

# Get hash of new SSHD
NEW_SSHD="/tmp/sshd-replacement"
NEW_HASH=$(sha256sum $NEW_SSHD | cut -d' ' -f1)

echo "Current SSHD: $CURRENT_HASH"
echo "New SSHD:     $NEW_HASH"
```

### Step 2: Identify Changes

```bash
# Extract strings to identify modifications
strings $CURRENT_SSHD > /tmp/strings.current
strings $NEW_SSHD > /tmp/strings.new

# Find differences
diff /tmp/strings.current /tmp/strings.new | head -20
```

### Step 3: Generate Manifest

```yaml
# manifest.yaml
change_id: "SSHD-REPLACE-20260422-001"
version: "8.5-CRYSTAL-validated"
timestamp: "2026-04-22T12:00:00Z"

changes:
  - id: "sshd-binary-replacement"
    type: "file-replace"
    path: "/usr/sbin/sshd"
    old_hash: "${CURRENT_HASH}"
    new_hash: "${NEW_HASH}"
    size_bytes: 1048576
    permissions: "0755"
    owner: "root:root"
    validation_phase: "Phase-20-Crystalline"
    security_level: "CRITICAL"
    breaking_changes: false
    requires_restart: true
    rollback_compatible: true
    
  - id: "sshd-config-update"
    type: "config-update"
    path: "/etc/ssh/sshd_config"
    changes:
      - parameter: "AuthenticationMethods"
        old_value: "publickey"
        new_value: "publickey password"
      - parameter: "PubkeyAuthentication"
        old_value: "yes"
        new_value: "yes"
    validation_phase: "Phase-19-Molecular"
    safe_to_apply_while_running: true

signatures:
  author_key: "ed25519_author_public_key_id"
  author_signature: "base64_encoded_signature"
  validator_key: "ed25519_validator_public_key_id"
  validator_signature: "base64_encoded_signature"
  timestamp_authority: "rsa_timestamp_signature"

metadata:
  change_description: |
    SSHD replacement addressing vulnerability CVE-2026-XXXX.
    Key improvements:
    - Enhanced key authentication
    - Password fallback support
    - Performance optimizations
  
  test_results:
    static_analysis: "PASS"
    security_review: "APPROVED"
    staging_deployment: "SUCCESSFUL"
    performance_baseline: "100ms avg SSH latency"
  
  emergency_contacts:
    security_team: "security@misttracker.org"
    platform_team: "platform-team@misttracker.org"
```

### Step 4: Generate Signatures

```bash
# Sign with author key (HSM-stored)
openssl dgst -sign author_key.pem -sha256 \
  -out manifest.sig manifest.yaml

# Sign with validator key (Phase 2g reputation system)
openssl dgst -sign validator_key.pem -sha256 \
  -out manifest.validator.sig manifest.yaml

# Add timestamp authority signature
curl -H "Content-Type: application/octet-stream" \
  --data-binary @manifest.yaml \
  https://timestamp-authority.example.com/api/timestamp \
  > manifest.ts.sig
```

---

## Submission Process

### 1. Validate Manifest Structure

```bash
# Validate manifest JSON schema
crystal validate-manifest manifest.yaml

# Expected output:
# ✓ Manifest structure valid
# ✓ All required fields present
# ✓ Hashes properly formatted
# ✓ Signatures present and parseable
```

### 2. Submit to CRYSTAL

```bash
# CLI submission
crystal propose \
  --manifest manifest.yaml \
  --sshd-binary /tmp/sshd-replacement \
  --urgency ROUTINE

# Output:
# Manifest ID: SSHD-REPLACE-20260422-001
# Crystallization status: QUEUED
# Estimated validation time: 300 seconds
```

### 3. Monitor Crystallization

```bash
# Check status in real-time
watch -n 5 "crystal status SSHD-REPLACE-20260422-001"

# Or use REST API
curl http://localhost:8080/api/crystal/status/SSHD-REPLACE-20260422-001 | jq .

# Expected progression:
# QUEUED → VALIDATING → APPROVED (or REJECTED)
```

### 4. Interpret Validation Results

```bash
# Get detailed validation report
crystal status SSHD-REPLACE-20260422-001 --verbose

# Sample output:
# Phase 17 - Atomic Validation: ✓ PASS
#   - Binary size check: 1,048,576 bytes ✓
#   - Dependency analysis: 3 functions, <200 LOC each ✓
#   - Error handling: All paths covered ✓
#
# Phase 19 - Molecular Validation: ✓ PASS
#   - State machine integrity: ✓
#   - Interaction contracts: ✓
#   - Rollback compatibility: ✓
#
# Phase 20 - Crystalline Validation: ✓ PASS
#   - Emergence properties: ✓
#   - Performance baseline: 100ms (within 5% target) ✓
#   - Security properties: ✓
#
# Overall: ✓ APPROVED FOR DEPLOYMENT
```

---

## Deployment Procedure

### Phase 1: Distribution (30-60 minutes)

```bash
# Initiate P2P distribution
crystal distribute SSHD-REPLACE-20260422-001

# Monitor propagation
watch -n 10 "crystal distribution SSHD-REPLACE-20260422-001"

# Sample output:
# Total nodes: 100
# Received:    45 (45%)
# Pending:     55 (55%)
# Failed:      0 (0%)
# ETA:         +20 minutes
```

**Behind the scenes**:
- Node 1 (initiator) announces manifest
- High-reputation nodes prioritized for initial push
- Manifest propagates through mesh network
- Bandwidth limited to 1-2 Mbps per connection
- Exponential backoff prevents network flooding

### Phase 2: Consensus (5-10 minutes)

```bash
# Open voting window
crystal consensus SSHD-REPLACE-20260422-001

# Monitor votes
watch -n 5 "crystal votes SSHD-REPLACE-20260422-001"

# Sample output:
# Voting window: 5 minutes remaining
# Current votes:
#   Approved:  65 nodes (65%)
#   Rejected:  0 nodes (0%)
#   Conditional: 35 nodes (35%)
#   Pending:   0 nodes (0%)
# 
# Quorum required: 51 (50%+1)
# Status: ✓ CONSENSUS LIKELY (65 votes)
# Recommendation: Proceed with deployment
```

**Voting criteria** per node:
```bash
# Each node evaluates:
1. Cryptographic signatures valid?
2. Crystallization passed?
3. Network connectivity healthy?
4. System load acceptable?
5. Known issues with this manifest?

# If all pass → APPROVED
# If any fail → REJECTED or CONDITIONAL
```

### Phase 3: Atomic Deployment (30-60 seconds)

```bash
# Execute deployment (requires explicit authorization)
crystal deploy SSHD-REPLACE-20260422-001 \
  --authorization-code AUTH-SENIOR-20260422-001

# Monitor real-time deployment
crystal watch DEPLOY-20260422-001 --follow

# Sample output:
# Node 001: ████████░░░░░░░░░░░░░░ (updating binary)
# Node 002: ░░░░░░░░░░░░░░░░░░░░░░ (queued)
# Node 003: ██████████████████████ (✓ complete)
# ...
# Overall: 33/100 complete (33%)
# Elapsed: 15 seconds
# Estimated total: 45 seconds
```

**On each node simultaneously**:
```bash
# 1. Prepare for update
mkdir -p /var/lib/crystal/backups
cp /usr/sbin/sshd /var/lib/crystal/backups/sshd.$(date +%s)

# 2. Gracefully drain connections
systemctl stop sshd  # Existing connections finish gracefully

# 3. Replace binary atomically
install -m 755 /tmp/sshd-replacement /usr/sbin/sshd.new
mv /usr/sbin/sshd.new /usr/sbin/sshd  # Atomic rename

# 4. Start updated SSHD
systemctl start sshd

# 5. Verify functionality
/usr/sbin/sshd -T | head  # Config syntax check
systemctl is-active sshd  # Running state check

# 6. Run health checks
timeout 10 ssh -o ConnectTimeout=2 localhost "echo OK"
netstat -tuln | grep :22  # Port 22 listening

# 7. Report status
crystal report-deployment-status DEPLOY-20260422-001 \
  --node mynode \
  --status SUCCESS
```

---

## Health Checks

### Post-Deployment Validation

```bash
# Automatic health checks run on each node:

1. SSHD Process Health
   - Process running? (ps aux | grep sshd)
   - Listening on port 22? (netstat -tuln | grep :22)
   - No errors in logs? (tail /var/log/auth.log)

2. Connectivity Test
   - SSH connection possible? (ssh -o ConnectTimeout=2 localhost)
   - Authentication works? (ssh -i key localhost echo OK)
   - Key auth? (yes) / Password auth? (yes)

3. Performance Baseline
   - SSH latency <200ms? (baseline was 100ms)
   - Throughput >80 Mbps? (measured via test transfer)
   - No memory leaks? (top -b -n 1 | grep sshd)

4. Security Properties
   - Version strings correct? (ssh -V)
   - No unintended open ports? (netstat -tuln)
   - SELinux context correct? (ls -Z /usr/sbin/sshd)

5. Configuration Consistency
   - Config matches manifest? (diff vs expected)
   - No unauthorized modifications? (sha256sum check)
   - Authentication methods as specified? (sshd -T)
```

### Rollback Triggers

CRYSTAL automatically rollbacks if:
- >5% of nodes fail health checks
- Any critical security property violated
- Performance degradation >10%
- Connectivity issues detected (SSH port unreachable)
- Consensus agreement violated (nodes diverging in state)

---

## Monitoring During Deployment

### Real-time Metrics

```bash
# Dashboard shows:
crystal dashboard DEPLOY-20260422-001

┌──────────────────────────────────────────────────────┐
│ CRYSTAL Deployment Dashboard                         │
├──────────────────────────────────────────────────────┤
│                                                      │
│ Deployment: DEPLOY-20260422-001                      │
│ Manifest: SSHD-REPLACE-20260422-001                  │
│ Start time: 2026-04-22 13:00:00                      │
│ Elapsed: 45 seconds                                  │
│ Status: IN_PROGRESS (Phase 3/3)                      │
│                                                      │
│ Nodes: 100                                           │
│ Completed: 87 ████████████████████░░░░░░ 87%        │
│ In-progress: 8 ██░░░░░░░░░░░░░░░░░░░░░░░░ 8%        │
│ Failed: 0 ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ 0%        │
│ Pending: 5 ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ 5%        │
│                                                      │
│ Success Rate: 87/100 (87%)                           │
│ Avg Update Time: 43s                                │
│ Network Throughput: 98 Mbps                         │
│ Consensus: 89 APPROVED / 11 CONDITIONAL             │
│                                                      │
│ Health Status: ✓ GREEN                              │
│ Next Action: Wait for completion                    │
│                                                      │
└──────────────────────────────────────────────────────┘
```

### Alert Progression

```
T+0s    → Deployment initiated
T+5s    → First nodes reporting in-progress
T+10s   → 25% complete, all nodes received manifest
T+20s   → 50% complete, no failures yet
T+30s   → 75% complete, performance nominal
T+40s   → 95% complete, final stragglers finishing
T+45s   → 100% complete, health checks running
T+50s   → All health checks PASS
T+55s   → Deployment successful ✓
```

---

## Rollback Procedures

### Automatic Rollback

Triggered if during deployment:
- Health check failure rate >5%
- Any security property violated
- SSH port becomes unreachable on >5% of nodes
- Memory usage spike (>50% increase)

```bash
# What happens automatically:
1. CRYSTAL detects failure condition
2. Broadcasts ROLLBACK signal to all nodes
3. Each node restores backup SSHD binary
4. Verifies SSH connectivity restored
5. Records incident in audit log
6. Notifies operators with incident details
```

### Manual Rollback

```bash
# Operator-initiated rollback
crystal rollback DEPLOY-20260422-001 \
  --reason "Performance regression detected" \
  --authorization-code AUTH-SENIOR-20260422-001

# Timeline:
# T+0:  Rollback signal sent
# T+30: All nodes complete rollback
# T+35: Health checks pass on all nodes
# T+40: Incident report generated
```

### Rollback Verification

```bash
# After rollback, verify previous state restored:
crystal status DEPLOY-20260422-001 | grep status
# Should show: ROLLED_BACK

# Check all nodes back to previous version:
crystal health --manifest SSHD-REPLACE-PREVIOUS-VERSION
# All nodes should show: ✓ HEALTHY

# Review what went wrong:
crystal audit DEPLOY-20260422-001 | grep "ROLLBACK" -A 10
```

---

## Incident Response

### If Deployment Fails

```bash
# 1. Automatic actions (CRYSTAL)
#    - Rollback initiated
#    - Incident recorded
#    - Alerts sent

# 2. Operator investigation
crystal debug DEPLOY-20260422-001

# Sample output:
# Failure detected at T+25s
# Failed nodes: 12/100
# Failure mode: SSH connection timeout
# Last successful node: Node 087
# 
# Root cause analysis:
#   - High CPU utilization on failing nodes (98%)
#   - New SSHD using more resources than expected
#   - Timeout during key exchange (>60s)
#
# Recommendation:
#   - Profile SSHD binary for performance issues
#   - Reduce concurrency limits for safe rollout
#   - Re-test in staging with higher load

# 3. Detailed logs
tail -100 /var/log/crystal/deployment.log
tail -100 /var/log/crystal/audit.log
journalctl -u crystal -n 200
```

### Investigation Commands

```bash
# Get node-level details
crystal nodes DEPLOY-20260422-001 --status FAILED

# Get performance metrics during failure
crystal metrics DEPLOY-20260422-001 | grep -A 20 "cpu\|memory"

# Compare before/after
crystal compare-deployments \
  --before DEPLOY-20260421-001 \
  --after DEPLOY-20260422-001 \
  --metric latency

# Root cause analysis
crystal analyze DEPLOY-20260422-001
```

---

## Success Criteria

Deployment is successful when:

```bash
✓ Distribution complete: 100% of nodes received manifest
✓ Consensus reached: >50% nodes approved
✓ Atomic deployment: All nodes updated within 60 seconds
✓ Health checks: 100% of nodes passing
✓ Connectivity: SSH working on all nodes
✓ Performance: <5% regression from baseline
✓ Security: All security properties maintained
✓ Audit trail: Complete and verified
```

Monitor for 24 hours post-deployment:
```bash
# First hour (critical monitoring)
crystal watch DEPLOY-20260422-001 --follow

# Throughout day
crystal health --continuous --interval 5m

# After 24 hours
crystal status DEPLOY-20260422-001 --summary
```

---

## Appendix: Troubleshooting

| Issue | Diagnosis | Resolution |
|-------|-----------|-----------|
| Crystallization rejected | `crystal status {id} --verbose` | Fix reported validation issues |
| Consensus not reached | `crystal votes {id}` | Review node concerns, retry |
| Distribution stalled | `crystal distribution {id} --verbose` | Check network, manually push |
| Health check failures | `crystal health --detailed` | Investigate node-specific issues |
| Rollback failed | `crystal debug {id}` | Manual intervention required |

---

**Last Updated**: April 22, 2026  
**Version**: 1.0 (Production)  
**Maintained By**: MistTracker Security Team
