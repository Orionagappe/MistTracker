# CRYSTAL Framework — Quick Reference Guide

**Purpose**: Fast lookup for operators and developers  
**Date**: April 22, 2026  
**Version**: 1.0  

---

## 60-Second Overview

CRYSTAL is the distribution interface for validated SSHD replacements. It:
1. **Validates** changes through emergence chain (Phase 17-20)
2. **Propagates** securely via peer-to-peer mesh
3. **Deploys** atomically (all nodes or none)
4. **Audits** completely (immutable logs)

---

## Key Concepts

**Manifest**: Cryptographically signed package of changes  
**Crystallization**: Phase 17-20 validation process  
**Atomic Deployment**: All nodes update simultaneously or rollback  
**Consensus**: >50% node agreement required  
**Reputation**: Phase 2g scoring determines voting weight  

---

## Common Workflows

### Deploy a New SSHD Version

```bash
# 1. Prepare manifest
crystal manifest create --sshd-binary /path/to/sshd --version 8.5

# 2. Submit for validation
crystal propose --manifest sshd-manifest.json --urgency ROUTINE

# 3. Check validation status
crystal status SSHD-REPLACE-20260422-001

# 4. Wait for approval (~5-30 minutes)

# 5. Initiate consensus
crystal consensus SSHD-REPLACE-20260422-001

# 6. Deploy when ready
crystal deploy SSHD-REPLACE-20260422-001

# 7. Monitor deployment
crystal watch DEPLOY-20260422-001

# Done! Check audit trail
crystal audit SSHD-REPLACE-20260422-001
```

### Rollback Failed Deployment

```bash
# Immediate rollback
crystal rollback DEPLOY-20260422-001 --reason "Performance degradation"

# Monitor rollback
crystal watch ROLLBACK-20260422-001

# Review what went wrong
crystal audit DEPLOY-20260422-001 | grep ERROR
```

### Check System Status

```bash
# Distribution progress
crystal dist-status SSHD-REPLACE-20260422-001

# Consensus voting
crystal votes CONSENSUS-20260422-001

# Node health
crystal health

# Recent deployments
crystal history --limit 5
```

---

## Timeframes

| Operation | Typical Time |
|-----------|--------------|
| Manifest creation | 5-15 min |
| Crystallization | 10-30 min |
| Distribution (100 nodes) | 30-60 min |
| Consensus window | 5-10 min |
| Deployment | 30-60 sec per node |
| **Total** | **90-180 min** |

Emergency path (expedited): 30-60 min total

---

## Common Commands

```bash
# Information
crystal --version
crystal --help
crystal info {manifest_id}

# Management
crystal propose --manifest FILE
crystal withdraw {manifest_id}
crystal approve {manifest_id}  # Manual admin override
crystal reject {manifest_id} --reason "..."

# Monitoring
crystal status {manifest_id}
crystal log {manifest_id}
crystal watch {deployment_id}

# Troubleshooting
crystal validate {manifest_id}
crystal test-manifest {manifest_id}
crystal health-check
```

---

## Alerts You Might See

| Alert | Meaning | Action |
|-------|---------|--------|
| **Crystallization Failed** | Validation error | Review logs, fix issue, resubmit |
| **Consensus Not Reached** | Nodes rejecting manifest | Investigate concerns, retry or escalate |
| **Distribution Stalled** | Propagation not completing | Check network, manually push to problem nodes |
| **Health Check Failed** | Post-deployment issue | Automatic rollback initiated |
| **Degraded Performance** | Metrics outside baseline | Monitor closely, may auto-rollback |

---

## Emergency Procedures

### Critical Security Patch (0-day)

```bash
# 1. Prepare expedited manifest (security team)
crystal manifest create --sshd-binary /tmp/sshd-hotfix --urgency CRITICAL

# 2. Fast-track crystallization
crystal propose --manifest hotfix.json --urgency CRITICAL --skip-staging

# 3. Immediate consensus
crystal consensus --manifest hotfix.json --timeout 3m

# 4. Priority deployment (highest-reputation nodes first)
crystal deploy --manifest hotfix.json --priority-first

# Total time: 30-45 minutes
```

### Complete Deployment Failure

```bash
# 1. Immediate universal rollback
crystal rollback-all --manifest {failed_manifest_id}

# 2. Notify operators
crystal incident-report --severity CRITICAL

# 3. Investigation
crystal audit {failed_manifest_id} | grep FAILURE
crystal debug {failed_deployment_id}

# 4. Root cause analysis
# (Typically 2-4 hours)

# 5. Remediation and re-test
# (Varies by issue)
```

---

## API Quick Reference

```bash
# Propose new manifest
POST /api/crystal/propose
{
  "change_manifest": {...},
  "author_signature": "...",
  "urgency": "ROUTINE|RECOMMENDED|CRITICAL"
}

# Get status
GET /api/crystal/status/{manifest_id}

# Check distribution
GET /api/crystal/distribution/{manifest_id}

# Initiate consensus
POST /api/crystal/consensus/{manifest_id}

# Deploy
POST /api/crystal/deploy/{manifest_id}

# Rollback
POST /api/crystal/rollback/{deployment_id}
{
  "reason": "...",
  "authorization_code": "..."
}

# Get history
GET /api/crystal/history?limit=10
```

---

## Decision Tree

```
New SSHD version available?
  ├─ Security critical?
  │  ├─ YES → Use emergency procedure (30-60 min)
  │  └─ NO  → Continue...
  │
  └─ Breaking changes?
     ├─ YES → Schedule maintenance window
     │        Run staging test first
     │        Use gradual rollout (if available)
     └─ NO  → Can deploy immediately
            Standard procedure (90-180 min)
```

---

## Reputation Impact

Your system's reputation (Phase 2g):

| Outcome | Reputation Change |
|---------|------------------|
| Successful deployment | +1-2 points |
| Failed deployment | -5-10 points |
| Quick rollback | -2-3 points (minor) |
| Delayed rollback | -10-20 points (significant) |

Maintain **>80 reputation** for maximum voting weight on cluster decisions.

---

## Checklist: Before Deployment

- [ ] Manifest validated through crystallization
- [ ] Staging deployment successful
- [ ] Security review approved
- [ ] Rollback procedure tested
- [ ] Monitoring alerts configured
- [ ] On-call support notified
- [ ] Maintenance window scheduled (if breaking changes)
- [ ] Backup channels available (out-of-band access)

---

## Metrics to Watch During Deployment

```
Real-time dashboard shows:
- Nodes updated: 0/100 → ... → 100/100
- Success rate: 0% → ... → 100%
- Errors: 0
- Average update time: XXs
- Network throughput: XXX Mbps
- Consensus agreement: XX%
```

**Green zone**: 
- Success rate >95%
- Errors = 0
- Update time <45s per node

**Yellow zone**:
- Success rate 80-95% (watch closely)
- Errors <5

**Red zone**:
- Success rate <80% → Consider rollback
- Errors >10 → Automatic rollback triggered

---

## Support Contacts

- **On-call**: page-crystal-oncall
- **Security team**: security@misttracker.org
- **Platform team**: platform-team@misttracker.org
- **Emergency hotline**: +1-555-CRYSTAL-911

---

## See Also

- Full documentation: [CRYSTAL-FRAMEWORK-COMPLETE.md](CRYSTAL-FRAMEWORK-COMPLETE.md)
- API specification: [CRYSTAL-API-REFERENCE.md](CRYSTAL-API-REFERENCE.md)
- SSHD integration guide: [CRYSTAL-SSHD-INTEGRATION.md](CRYSTAL-SSHD-INTEGRATION.md)
- Phase 17-20 validation: [COMPLETE-EMERGENCE-CHAIN-PHASES-17-24.md](COMPLETE-EMERGENCE-CHAIN-PHASES-17-24.md)
- Phase 2g reputation: [PHASE-2G-EXPERT-REPUTATION-COMPLETE.md](PHASE-2G-EXPERT-REPUTATION-COMPLETE.md)

---

**Last Updated**: April 22, 2026  
**Quick ref version**: 1.0
