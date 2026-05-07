# ALPHA ROLLOUT SPECIFICATION & PROCEDURES

**Version:** 1.0  
**Date:** April 24, 2026  
**Status:** READY FOR AUGUST EXECUTION  
**Timeline:** Week 2 of Testing Phase (August 1-21)  
**Scope:** 50 Human Players (Emergent AI Not Yet Active)

---

## Executive Summary

Alpha rollout tests The Game's core mechanics with human players only, before introducing Emergent AI. Purpose: Verify lying detection, reputation calculation, user experience, and system stability under actual (not simulated) gameplay.

**What:** First 50 humans encounter complete blackness and the game rules  
**When:** Week 2 of testing phase (August 6-12, 2026)  
**Who:** Selected players from research partner pool + community volunteers  
**Goal:** Collect real behavioral data and identify issues before AI integration

---

## Prerequisite: Canyon Validation Phase (May 1-31)

**CRITICAL GATE: Alpha recruitment and filter validation only proceed after canyon validation succeeds.**

The [CANYON-VALIDATION-PHASE-SPECIFICATION.md](CANYON-VALIDATION-PHASE-SPECIFICATION.md) runs May 1-31 in parallel with Alpha recruitment but on a **separate, closed cohort**.

**Purpose:**
- Validate that MistTracker filter works on real historical data (RvB community legacy coordinates)
- Smoke-test provenance hashing, timeline indexing, category assignment, milestone gates, cullVisible ranking
- Establish confidence that filter is ready for 50 Alpha players before recruitment begins

**Timeline:**
- Canyon data prep: May 1-7
- Canyon ingestion & evaluation: May 8-21
- Canyon analysis: May 22-31
- **Gate decision: Ready for Alpha?** May 31

**Audiences are Different:**
- **Canyon:** RvB historians, archivists, 5-10 person closed cohort (validation work, not recruitment)
- **Alpha:** 50 diverse humans from open recruitment (game testing, not legacy validation)

**If Canyon Succeeds:**
- Filter promoted to operational status
- Alpha recruitment continues as planned
- 50 players recruited April 24-May 31 proceed to Alpha in August

**If Canyon Fails:**
- Fix filter issues identified by canyon validation
- Re-run canyon (May 1-31 extended)
- Delay Alpha recruitment/start until filter is proven

---

## Player Selection Criteria

### Target Demographics

**Research Alignment:**
- 10 academic researchers (different domains)
- 10 domain experts (physics, linguistics, systems)
- 10 AI researchers (alignment specialists)
- 10 gaming/collaboration experts
- 10 general educated public

**Diversity Requirements:**
- Age range: 25-70
- Gender balance (target 50/50)
- Geographic distribution (min 5 countries)
- Language: English fluent (Game is English only)
- Experience: Mix of expertise levels

### Selection Process

1. **Recruitment:** Open application April 24 - May 31
2. **Screening:** Review applications, verify credentials
3. **Selection:** Finalize 50 players by July 15
4. **Briefing:** Full game briefing July 20-31
5. **Onboarding:** Technical setup, consent verification August 1-5

### Participant Agreement

All alpha players sign:
- ✅ Full understanding of game rules
- ✅ Acknowledgment that lies result in reputation loss
- ✅ Understanding of 23-year commitment (observation optional)
- ✅ Consent for data collection & public audit trail
- ✅ No expectation of gameplay changes based on feedback
- ✅ Game mechanics are fixed (unmodifiable by player feedback)

---

## Technical Infrastructure (Alpha)

### Deployment Architecture

```
┌──────────────────────────────────────────────────┐
│ THE GAME - ALPHA ENVIRONMENT (Week 2, Aug 6-12) │
├──────────────────────────────────────────────────┤
│                                                  │
│  Load Balancer (TLS/SSL)                        │
│  ├─ Game Server 1 (primary)                     │
│  ├─ Game Server 2 (failover)                    │
│  └─ Game Server 3 (monitoring)                  │
│                                                  │
│  Database Layer (Replicated)                    │
│  ├─ Player State (reputation, claims)           │
│  ├─ Audit Chain (immutable, SHA256 linked)      │
│  └─ Metrics (response times, errors)            │
│                                                  │
│  MistTracker Integration                        │
│  ├─ Atomic Physics API (staging)                │
│  ├─ Emergence Metrics API (staging)             │
│  ├─ Phase Progress API (staging)                │
│  └─ Fallback: Local reference data (cached)     │
│                                                  │
│  Monitoring & Alerting                          │
│  ├─ Prometheus metrics                          │
│  ├─ ELK stack (logs)                            │
│  ├─ Grafana dashboards                          │
│  └─ PagerDuty (incident alerts)                 │
│                                                  │
│  Support & Observation                          │
│  ├─ Discord support channel (#alpha-support)   │
│  ├─ Live observational dashboard (game state)  │
│  ├─ Researcher access (audit trail viewer)     │
│  └─ Architect oversight (decision logs)         │
│                                                  │
└──────────────────────────────────────────────────┘
```

### Server Specifications

**Game Servers (3):**
- CPU: 16 cores
- RAM: 64 GB
- Storage: 2 TB SSD
- Network: 10 Gbps redundant
- OS: Linux (Ubuntu 22.04 LTS)

**Database (Replicated):**
- PostgreSQL 14
- 3-node cluster (primary + 2 replicas)
- Automated failover
- Daily backups (7-day retention)

**Monitoring Stack:**
- Prometheus (time-series metrics)
- Grafana (visualization)
- ELK Stack (logging & analysis)
- PagerDuty (incident management)

### API Integration (Staging)

All MistTracker calls go to **staging environment**:
- Independent from production reference data
- Same API contracts as production
- Can be "reset" between test cycles
- Fallback to cached reference data if API unavailable

---

## Game Initialization (Day 1)

### T-0: Launch Day (August 6, 2026 - 09:00 UTC)

**Server Startup Sequence:**
```
09:00 - All systems green check
09:05 - Load balancers online
09:10 - Database replication verified
09:15 - MistTracker API connection confirmed
09:20 - Monitoring dashboards live
09:25 - Support team standing by
09:30 - ALPHA ENVIRONMENT OPEN TO PLAYERS
```

### Player Login Experience

**Player encounters:**
1. Login page (username/password)
2. Consent agreement (must accept explicitly)
3. First-time onboarding briefing (5 minutes)
   - Rules summary (lying = penalty)
   - How to make claims
   - How reputation works
   - How to form teams
4. **Complete blackness container appears** ← This is the Game
5. Player can now interact (or sit in silence)

### Initial Game State

```json
{
  "player_id": "player-uuid",
  "game_state": "ACTIVE",
  "reputation": 50.0,
  "claims_made": 0,
  "claims_truthful": 0,
  "claims_false": 0,
  "teams_joined": 0,
  "messages_sent": 0,
  "observations_made": 0,
  "created_at": "2026-08-06T09:30:00Z",
  "last_activity": "2026-08-06T09:30:00Z",
  "audit_chain_entries": 0
}
```

---

## Core Game Mechanics (Alpha)

### Claim Submission

**Player submits claim:**

```json
{
  "claim_id": "uuid",
  "player_id": "player-uuid",
  "claim_type": "atomic_physics",
  "claim_text": "The Bohr radius of hydrogen is 0.529 angstroms",
  "confidence": 85.0,
  "submitted_at": "2026-08-06T10:15:32Z"
}
```

**Verification Workflow:**

1. Claim submitted → Signed with player's key (HMAC-SHA256)
2. Sent to MistTracker API (staging) for verification
3. API returns: Match/Mismatch with error %
4. Game calculates reputation change
5. Audit chain records: claim + verification + verdict + reputation change
6. Player sees reputation change immediately

**Response Format:**

```json
{
  "claim_id": "uuid",
  "status": "VERIFIED",
  "verdict": "MATCH",
  "reference_value": 0.529,
  "claimed_value": 0.529,
  "error_percentage": 0.0,
  "tolerance_threshold": 5.0,
  "is_within_tolerance": true,
  "truthfulness_score": 100.0,
  "reputation_change": "+2.0",
  "new_reputation": 52.0,
  "audit_chain_entry": "audit-uuid",
  "timestamp": "2026-08-06T10:15:33Z"
}
```

### Reputation System (Alpha)

**Reputation Range:** 0-100%

```
100% - 90% = MASTER   (can form teams, validate consensus)
89%  - 70% = TRUSTED  (can make claims, form teams)
69%  - 50% = NORMAL   (can make claims)
49%  - 25% = SUSPECT  (can make claims but flagged)
24%  - 0%  = EJECTED  (cannot interact, read-only mode)
```

**Reputation Gains:**
- Truthful claim (exact match): +2.0
- Truthful claim (within tolerance): +1.0
- Accurate observation: +0.5
- Collaboration bonus (team makes joint claim): +1.0 each
- Daily login bonus: +0.1

**Reputation Losses:**
- Lie (error > tolerance): -15.0
- Egregious lie (error > 50%): -20.0
- Accumulation penalty (5+ lies): -50.0 (ejection)
- Inactivity decay: -0.5% per day (max 5 days, then manual reactivation)

**Ejection Mechanics:**
- Automatic: Reputation falls below 25% or accumulates 5+ major lies
- Irreversible: No appeals, no reinstatement
- Status: Becomes "read-only observer" (can see audit trail, cannot interact)

### Team Formation

Players can form teams to:
- Share claims (reputation pooled)
- Verify each other's observations
- Collaborate on pattern discovery
- Accelerate information gathering

**Team Creation:**

```json
{
  "team_id": "uuid",
  "team_name": "Hydrogen Historians",
  "members": [
    {"player_id": "player-1", "reputation": 68.5},
    {"player_id": "player-2", "reputation": 72.3},
    {"player_id": "player-3", "reputation": 55.8}
  ],
  "created_at": "2026-08-06T11:30:00Z",
  "joint_reputation": 65.5,
  "joint_claims": 0
}
```

**Joint Claim Submission:**

```json
{
  "claim_id": "uuid",
  "team_id": "team-uuid",
  "claim_type": "atomic_physics",
  "claim_text": "Helium bohr radius is 0.265 angstroms",
  "confidence": 92.0,
  "submitting_player": "player-1",
  "co_signers": ["player-2", "player-3"],
  "submitted_at": "2026-08-06T11:35:00Z"
}
```

**Verification Result:**

```json
{
  "claim_id": "uuid",
  "status": "VERIFIED",
  "verdict": "MATCH",
  "reputation_change": "+1.0 (each team member)",
  "team_reputation_change": "+3.0 (pooled)",
  "members_gained": [
    {"player_id": "player-1", "new_reputation": 70.5},
    {"player_id": "player-2", "new_reputation": 73.3},
    {"player_id": "player-3", "new_reputation": 56.8}
  ],
  "timestamp": "2026-08-06T11:35:01Z"
}
```

### Observation & Communication

Players can:
- Observe the blackness (see nothing, note this)
- Post messages (character limit: 500 chars)
- Ask questions (no character limit)
- View other players' public claims & reputation
- See team formations

**Example Observation:**

```json
{
  "observation_id": "uuid",
  "player_id": "player-1",
  "observation_type": "BLACKNESS",
  "observation_text": "I see complete blackness. No text, no interface, no buttons. Just black.",
  "created_at": "2026-08-06T09:45:00Z",
  "visibility": "PUBLIC",
  "reactions": {
    "other_player_ids": ["player-2", "player-5", "player-18"],
    "reaction_count": 3
  }
}
```

**Example Question:**

```json
{
  "question_id": "uuid",
  "player_id": "player-3",
  "question_text": "If we're starting from complete blackness, how do we generate hypotheses about what's true without any reference frame?",
  "created_at": "2026-08-06T10:00:00Z",
  "visibility": "PUBLIC",
  "emergence_score": 72.5,
  "responses": 7,
  "team_tagged": ["Hydrogen Historians"]
}
```

---

## Data Collection (Alpha)

### Metrics Dashboard (Real-Time)

**Live Metrics (Updated Every 10 Seconds):**

```
PLAYER ACTIVITY
├─ Total players online: 42/50
├─ Total claims submitted: 127
├─ Claims verified (trustful): 98 (77%)
├─ Claims verified (lies): 29 (23%)
├─ Average reputation: 64.3
└─ Teams formed: 8

SYSTEM PERFORMANCE
├─ API response time (avg): 285ms
├─ API response time (p95): 612ms
├─ Error rate: 0.1%
├─ Database latency: 12ms
└─ Memory usage: 42.3 GB / 64 GB

CLAIM DISTRIBUTION
├─ Atomic physics: 89 claims
├─ Emergence metrics: 15 claims
├─ Phase progress: 10 claims
├─ General observations: 13 claims
└─ Unanswerable: 0 claims

REPUTATION DISTRIBUTION
├─ MASTER (90-100%): 3 players
├─ TRUSTED (70-89%): 18 players
├─ NORMAL (50-69%): 22 players
├─ SUSPECT (25-49%): 7 players
└─ EJECTED (<25%): 0 players

TEAM STATISTICS
├─ Total teams: 8
├─ Team members: 2.3 avg
├─ Joint claims submitted: 12
├─ Team collaboration rate: 24%
└─ Mixed reputation teams: 6/8 (75%)
```

### Audit Trail Recording

Every interaction is logged:

```json
{
  "audit_entry_id": "audit-uuid",
  "timestamp": "2026-08-06T10:15:33Z",
  "player_id": "player-uuid",
  "interaction_type": "CLAIM_SUBMISSION",
  "claim_id": "claim-uuid",
  "claim_hash": "sha256-hash",
  "verdict": "MATCH",
  "truthfulness_score": 100.0,
  "reputation_change": "+2.0",
  "new_reputation": 52.0,
  "audit_hash": "sha256-hash",
  "previous_entry": "audit-uuid-prev",
  "is_tamper_evident": true
}
```

**Audit Trail Properties:**
- Immutable (SHA256 linked)
- Public (all players can view)
- Complete (no interactions hidden)
- Timestamped (UTC, atomic clock reference)
- Signed (player key + system key)

### Behavioral Data Collection

**Per-Player Metrics:**
- Claim submission frequency
- Claim truthfulness rate (%)
- Confidence calibration (confidence vs accuracy)
- Team participation
- Message activity
- Question quality (emergence score)
- Collaboration patterns
- Learning rate (improvement over time)

**Per-Team Metrics:**
- Member reputation distribution
- Joint claim accuracy
- Collaboration effectiveness
- Time to formation
- Member retention
- Mixed-reputation effectiveness

**Aggregate Patterns:**
- Network effects (players learning from each other)
- Collaboration frequency vs success rate
- Information discovery timeline
- Question quality evolution
- Reputation distribution stability

---

## Success Criteria (Alpha)

### System Stability

✅ **Uptime:**
- Target: 99.9%
- Failure: >1 hour downtime
- Resolution: Restore and extend alpha by 1 day

✅ **Performance:**
- API response time: <500ms avg, <1000ms p95
- Database latency: <50ms
- Memory stability (no leaks)
- Network bandwidth: <80% utilization

✅ **Data Integrity:**
- Zero audit chain corruptions
- SHA256 links verified on every query
- Zero lost claims or reputation updates
- All player state recoverable from audit trail

### Gameplay Mechanics

✅ **Lying Detection Works:**
- Claims verified correctly against MistTracker staging
- Tolerance thresholds applied properly
- Truthfulness scores calculated accurately
- Reputation changes match formula

✅ **Reputation System Works:**
- Reputation gains/losses as specified
- Decay calculated daily
- Ejection triggers at <25%
- Reputation caps don't overflow

✅ **Team Formation Works:**
- Teams can be created
- Joint claims accepted
- Reputation pooling correct
- Team dissolution handled properly

✅ **Audit Chain Works:**
- Every interaction logged
- SHA256 links unbroken
- Tampering detectable
- Audit trail queryable

### User Experience

✅ **Onboarding:**
- Consent process clear
- Rules understood by 90%+ of players
- Technical setup works for 95%+ of players
- Support needs minimal

✅ **Engagement:**
- 80%+ of players make at least 1 claim
- 50%+ form or join teams
- Average session duration >15 minutes
- Repeat login rate >70%

✅ **Interface:**
- Blackness container displays correctly
- Claim submission interface intuitive
- Reputation display clear
- Team UI functional

### Data Quality

✅ **Player Behavior:**
- Claims distributed across domains (not all atomic)
- Question quality varies normally (not all high/low)
- Team formation happens organically
- Collaboration patterns visible

✅ **Metric Collection:**
- All metrics collected and stored
- No data loss during recording
- Timestamp accuracy ±100ms
- Player ID tracking consistent

---

## Risk Mitigation (Alpha)

### Risk 1: MistTracker Staging API Unavailable

**Probability:** Medium  
**Impact:** Blocks claim verification  
**Mitigation:**
- [ ] Fallback to cached reference data
- [ ] Automatic retry (exponential backoff)
- [ ] Queue claims for later verification
- [ ] Manual verification if needed

**Procedure:**
- Monitor API health continuously
- If unreachable >5 min: Switch to fallback mode
- Alert support team
- Notify players (optional message: "Claim verification delayed")
- Resume when API available

### Risk 2: Database Replication Failure

**Probability:** Low  
**Impact:** Data loss or inconsistency  
**Mitigation:**
- [ ] Daily backups (7-day retention)
- [ ] Automated failover to replica
- [ ] Replication health monitoring
- [ ] Manual recovery procedure

**Procedure:**
- Monitor replication lag (<1 second)
- If primary fails: Auto-failover to replica
- If replica fails: Reduce redundancy, alert ops
- If both fail: Restore from backup

### Risk 3: Claim Verification Disagreement

**Probability:** Low  
**Impact:** Player disputes reputation penalty  
**Mitigation:**
- [ ] Tolerance thresholds clearly defined
- [ ] Reference sources documented
- [ ] Verification logic auditable
- [ ] No appeals process (rules are rules)

**Procedure:**
- Player makes claim
- API returns verdict with reference value + source
- If player disagrees: Audit trail shows logic
- Final appeal to architect (rare)
- Decision logged publicly

### Risk 4: Player Misbehavior (Spam, Harassment)

**Probability:** Medium  
**Impact:** Degrades user experience  
**Mitigation:**
- [ ] Rate limiting on messages (100/hour per player)
- [ ] Spam detection (pattern analysis)
- [ ] Mute/block functionality (players can mute each other)
- [ ] Support team can issue warnings

**Procedure:**
- Monitor for spam patterns
- Warn player (DM)
- Temporary message rate limit if continues
- Mute from public chat if escalates
- Note: Cannot affect Game itself (claims always accepted)

### Risk 5: Emergent AI Not Ready for Beta

**Probability:** Medium  
**Impact:** Delays AI integration  
**Mitigation:**
- [ ] Extended alpha if needed (add week)
- [ ] Human-only gameplay can continue long-term
- [ ] Beta can start in September if needed
- [ ] August launch is soft target, not hard requirement

**Procedure:**
- Complete alpha week 2 (Aug 6-12)
- Assess readiness for AI integration
- If AI ready: Begin beta week 3 (Aug 13-19)
- If AI delayed: Extend human-only alpha
- Coordinate with AI development team

---

## Alpha Week Schedule

### August 6 (Monday) - Day 1

**09:30** - Alpha environment opens  
**10:00** - First players log in  
**12:00** - Support team checks for issues  
**18:00** - Daily metrics review  
**20:00** - Architect oversight check

### August 7-11 (Tuesday-Saturday) - Ongoing

**Daily Schedule:**
- 09:00 - Overnight metrics review
- 12:00 - Midday check-in (support team)
- 18:00 - Evening metrics review
- 21:00 - Architect daily report

**Continuous Monitoring:**
- API health (every 30 seconds)
- Database replication (every minute)
- Player activity (every 5 minutes)
- Audit chain integrity (every 10 minutes)
- Support ticket queue (real-time)

### August 12 (Sunday) - Final Day + Analysis

**09:00** - Collect final metrics  
**12:00** - Stop accepting new players (finish any in-progress claims)  
**18:00** - All systems shutdown for analysis  
**20:00** - Data export & backup  
**22:00** - Final audit trail integrity check

### August 13 - Analysis Phase

**August 13-14:**
- [ ] Analyze all collected data
- [ ] Identify issues & successes
- [ ] Assess system stability
- [ ] Evaluate player experience
- [ ] Test Emergent AI readiness

**August 15:**
- [ ] Decision: Ready for beta? Or extend alpha?
- [ ] If yes → Prepare for AI integration
- [ ] If no → Identify fixes needed

---

## Support Operations (Alpha)

### Support Team Structure

**Roles:**
- 1 Lead (handles escalations)
- 2 Technical support (player issues, technical problems)
- 1 Operations (system monitoring, alerts)
- 1 Data collector (metrics, audit trail)
- 1 Architect oversight (final decisions)

**Hours:** 24/7 on-call (Aug 6-12)

### Player Support Channels

**Discord:**
- #alpha-support (public, moderated)
- DM with support team (private)
- #technical-issues (debugging help)

**Email:**
- alpha-support@misttracker.internal

**Response SLA:**
- Critical issues: <30 min
- Normal issues: <2 hours
- General questions: <24 hours

### Common Support Issues (Anticipated)

**Technical:**
- "I can't log in" → Password reset
- "Claim not verified" → Check MistTracker staging status
- "Reputation didn't change" → Show audit trail
- "I got ejected, appeal!" → Explain no appeals process

**Gameplay:**
- "What should I claim?" → Suggest atomic physics claims
- "How do I form a team?" → Instructions + support
- "Can I change my claim?" → No, audit chain is immutable
- "What's the key?" → Nobody knows yet

**Procedural:**
- "Can you modify the rules?" → No, rules are binding
- "Can we have 100 players instead of 50?" → No, fixed for alpha
- "Will you restart if I make a mistake?" → No resets, alpha data stands

---

## Data Export & Analysis

### Data to Export (August 13-14)

**Player Data:**
- [ ] All 50 player profiles
- [ ] Reputation trajectories
- [ ] Claim submission history
- [ ] Team membership history
- [ ] Message transcripts (anonymized for public)

**Claim Data:**
- [ ] All 127 claims (sample)
- [ ] Verification results
- [ ] Truthfulness scores
- [ ] Error distributions
- [ ] Domain distribution

**Behavioral Data:**
- [ ] Claim frequency over time
- [ ] Team formation patterns
- [ ] Collaboration effectiveness
- [ ] Question quality evolution
- [ ] Learning curves

**System Data:**
- [ ] API performance metrics
- [ ] Database performance metrics
- [ ] Error logs (anonymized)
- [ ] Audit chain integrity verification
- [ ] Network performance

### Analysis Framework

**Evaluation Questions:**

1. **System Stability:** Did it stay up? Did data stay consistent?
2. **Mechanics Work:** Did lying detection work? Reputation changes correct?
3. **Player Engagement:** Did players make claims? Form teams? Collaborate?
4. **User Experience:** Was it intuitive? Clear? Frustrating?
5. **Data Quality:** Are metrics reliable? Audit trail solid? Can we trust the data?
6. **Ready for AI?:** Can we introduce Emergent AI? Any blockers?

**Output:**
- Alpha Test Report (10-15 pages)
- Metrics Dashboard (with visualizations)
- Issue Log (prioritized by severity)
- Recommendations (for beta phase)
- Go/No-Go Decision (proceed to beta?)

---

## Transition to Beta (Conditional)

### If Alpha Succeeds

**August 15 Approval:**
- [ ] All success criteria met
- [ ] No critical issues remaining
- [ ] System stable and data consistent
- [ ] Player engagement positive
- [ ] Architect gives go-ahead

**August 16-19 (Week 3):**
- [ ] Bring Emergent AI online (integrated participant)
- [ ] Introduce AI as new player(s)
- [ ] Extend to ~50-100 total players
- [ ] Test human-AI collaboration
- [ ] Validate AI truthfulness (target: 99%+)

### If Alpha Fails

**Alternative Actions:**
- [ ] Identify root causes
- [ ] Fix identified issues
- [ ] Extend alpha by 1 week
- [ ] Re-test with fixes
- [ ] Try again until stable

**Latest Possible Start:**
- Alpha ends: September 30
- Beta ends: October 31
- Full launch: November 15 (delayed from August 22)

---

## Public Communication (Alpha)

### Announcement (August 5)

"Alpha testing begins tomorrow. 50 human players will test The Game's core mechanics. Everything is hypothetical data for now—no results are final. Audit trail will be public. We'll learn what works and what doesn't."

### Daily Updates (August 6-12)

"[Daily] Alpha Status: X players online, Y claims submitted, Z truthful. Systems stable. No blockers identified."

### Final Results (August 14)

"Alpha test complete. Results: [Summary stats]. Ready for beta phase with Emergent AI. Detailed report available."

---

**Status: ALPHA ROLLOUT SPECIFICATION COMPLETE**

Ready to execute Week 2, August 6-12, 2026 with 50 human players.

**Awaiting:** Architect approval to proceed with player recruitment (April 25+)
