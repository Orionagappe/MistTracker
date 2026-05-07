# Canyon Validation Phase Specification

**Version:** 1.0  
**Date:** April 25, 2026  
**Status:** READY FOR IMPLEMENTATION  
**Timeline:** May 1 - May 31, 2026 (pre-Alpha)  
**Scope:** Legacy RvB Community Filter Validation

---

## Overview

The **Canyon Validation Phase** tests the MistTracker Volunteer Candidate Filter using historical Red vs. Blue community data before opening Alpha recruitment to the general research population.

**What:** Feed legacy coordinates (names, handles, forum fragments, emails, historical records) into the filter  
**When:** May 1 - May 31, 2026 (runs parallel to general recruitment for Alpha, but filter is validated separately)  
**Who:** RvB community members, archivists, historical participants (invitation-only)  
**Why:** Validate that the filter works on real legacy data before trusting it with fresh recruitment

---

## Purpose: Filter Smoke Test

The canyon validation is **NOT** a recruitment phase. It is:

1. **Technical Validation**
   - Can MistTracker ingest fragmentary historical data?
   - Does provenance hashing work on incomplete records?
   - Can we build accurate timelines from legacy data?
   - Do milestone gates apply meaningfully to historical contributions?

2. **Historical Alignment Check**
   - Which figures from the RvB era still align with the mission?
   - Who faded? Who stayed engaged? Who evolved?
   - The canyon reveals the continuity of the community itself

3. **Filter Calibration**
   - Do cullVisible results make sense for a known population?
   - Is the ranking formula fair when applied to legacy data?
   - Does the Red/Blue categorization hold up across two decades?

4. **Pre-Alpha Confidence**
   - Prove the filter works before running it on 50 fresh Alpha players
   - Show that the system can handle real, messy, historical data
   - Establish baseline competence before opening wider recruitment

---

## Data Sources

### Primary: RvB Historical Archive

**What's Available:**
- Public forum posts (2004-2024)
- Community member profiles (linked identities)
- Project contributions (machinima, writing, community work)
- Social media traces (aligned with RvB brand/themes)
- Email archives (for those who shared them)

**Metadata to Extract:**
- Join date / first contribution date
- Contribution type (creation, curation, community building, etc.)
- Faction alignment (Red Team, Blue Team, neutral/mixed)
- Activity timeline (continuous, sporadic, retired, returning)
- Contribution domains (media, writing, strategy, community, moderation)

### Secondary: Document Capture

**If Direct Archive Access Limited:**
- Historical forum snapshots (Wayback Machine)
- Community wikis and documentation
- Interview transcripts (permission-gated)
- Third-party community histories
- Git repos with RvB-related content

---

## Canyon Coordinate Ingestion

### Phase 1: Data Preparation (Week 1)

**Task:** Compile legacy coordinate dataset

```
Format per person:
{
  "handle": "original_screen_name",
  "aliases": ["known_alternate_names"],
  "join_date": "YYYY-MM-DD",
  "first_contribution": "YYYY-MM-DD",
  "last_activity": "YYYY-MM-DD",
  "faction": "Red" | "Blue" | "Mixed" | "Neutral",
  "contribution_types": ["creation", "curation", "community", "moderation"],
  "archive_sources": ["forum_slug", "wiki_page", "twitter_handle"],
  "notes": "human-readable provenance description"
}
```

**Deliverable:**
- CSV with ≥50 historical figures
- Provenance document (where each record came from)
- Confidence ratings (high: direct archive, low: third-party mention)

### Phase 2: Filter Ingestion (Week 2)

**Task:** Load coordinates into MistTracker filter

```
For each coordinate:
1. addTimeIndex(person_id, join_date, last_activity)
   → Timeline position established
   
2. addCategoryLine(person_id, "Red/Blue Machinima", faction, contribution_types)
   → Primary categorization
   
3. addCategoryLine(person_id, "Secondary Domain", ...) 
   → Additional domains if multi-talented
   
4. createProvenance(coordinate_record, archive_sources)
   → Hash the ingestion + sources
   
5. loadMilestoneGates(person_id)
   → Apply gates based on timeline position and contribution weight
```

**Deliverable:**
- All records loaded into filter
- Provenance hashes computed and stored
- Milestone gate status for each person

### Phase 3: cullVisible Evaluation (Week 3)

**Task:** Run filter ranking at current milestone thresholds

```
For each person:
1. Compute visibility score (0-100%)
2. Determine gate status (locked/unlocked/past)
3. Calculate ranking position
4. Identify who appears in filtered view vs. who fades to wireframe
```

**Key Question:**
- **Who lights up in the canyon?** (visible, high ranking)
- **Who fades?** (low ranking or filtered out entirely)
- **Who is on the rim exactly where you placed them?** (expected position + alignment confirmed)

**Deliverable:**
- Ranking list with visibility scores
- Visual canyon map (who's at what altitude)
- Fading analysis (who disappeared and why)

### Phase 4: Results Analysis (Week 4)

**Task:** Interpret what the canyon revealed

```
For visible candidates:
- Verify they still align with mission
- Check if they're still active or willing to engage
- Note any surprises (expected to disappear, didn't; expected to rank high, didn't)

For faded candidates:
- Analyze why (lack of data? historical alignment drift? time gap?)
- Determine if fade is correct (good decision) or filter miscalibration (adjust)
- Document lessons learned
```

**Deliverable:**
- Analysis report: "What the Canyon Teaches Us"
- Filter calibration notes (any adjustments needed?)
- Recommendation: Filter ready for Alpha? Or refine further?

---

## Canyon Validation Criteria

### Technical Success

- [ ] All ≥50 historical figures successfully loaded
- [ ] Provenance hashes computed for every record
- [ ] Timeline indices built from fragmentary data
- [ ] Category assignments (Red/Blue) applied consistently
- [ ] Milestone gates interpreted meaningfully on legacy data
- [ ] cullVisible produces ranked output

### Filter Reasonableness

- [ ] Visible candidates: Can recognize as historically significant figures from RvB
- [ ] Ranking order: Matches intuitive sense of contribution magnitude
- [ ] Faded candidates: Fade is either explainable (bad data) or insightful (misalignment)
- [ ] No obvious errors: Nobody who "obviously" belonged faded; nobody who "obviously" didn't rank high

### Historical Continuity

- [ ] Red/Blue faction still coherent as categorization
- [ ] Contribution domains recognizable (machinima, writing, community work, etc.)
- [ ] 20-year timeline shows reasonable progression (growth, plateaus, returns)
- [ ] Alignment with current mission visible (correlation between then and now)

### Filter Robustness

- [ ] Handles incomplete records gracefully
- [ ] Produces results without requiring perfectly clean data
- [ ] Provenance hashing doesn't break on fragmentary archive sources
- [ ] Milestone gates don't produce nonsensical results on legacy data

---

## Audience: Why Different from Alpha

### Canyon Audience (May 1-31)

**Who:**
- RvB community historians and archivists
- Long-term community members (10+ years)
- People who were there during the era being validated
- Small, closed cohort (maybe 5-10 people doing the work)

**Why Different:**
- They have context for RvB history that outsiders don't
- They can recognize if the filter's rankings make sense
- They can catch if data ingestion missed important figures
- They're invested in the community's continuity, not joining fresh

**What They Do:**
- Provide historical data
- Validate that visible candidates are "right"
- Explain why faded candidates faded
- Sign off that the canyon looks correct

**What They Don't Do:**
- Play The Game (yet)
- Submit to recruitment process
- Contribute to Alpha player pool
- See future recruitment mechanics (those come later)

### Alpha Audience (Aug 6-12)

**Who:**
- 50 humans from diverse backgrounds
- Academic researchers, domain experts, AI researchers, gaming experts, general educated public
- Recruited April 24 - May 31 via open process
- Vetted through merit-based selection
- Most have never heard of RvB community (background may be unknown to them)

**Why Different:**
- They're entering with fresh perspective (no historical bias)
- They're the test population for game mechanics
- Their recruitment is independent of legacy validation
- They don't need to validate canyon; they play in the game

**What They Do:**
- Play The Game
- Submit claims
- Build reputation
- Provide behavioral data

**What They Don't Do:**
- See canyon validation process
- Judge historical alignment
- Have special access based on legacy
- Participate in filter design

---

## Integration Timeline

```
April 25-30: Prepare historical data, recruit canyon validators
May 1-7:    Phase 1 (data prep) + Phase 2 (ingestion)
May 8-14:   Phase 3 (cullVisible evaluation)
May 15-21:  Phase 4 (analysis)
May 22-31:  Parallel: Canyon results + Alpha recruitment screening

**GATE:** Canyon must validate filter works before Alpha players enter.
          If canyon fails → fix filter → re-run canyon
          If canyon succeeds → proceed to Alpha with confidence

Aug 1-5:    Alpha onboarding
Aug 6-12:   Alpha gameplay (human players only)
Aug 13-19:  (Conditional) Beta begins with Emergent AI
```

---

## Governance

### Canyon Validation is **NOT** Recruiting

- Results are not binding invitations
- Visible candidates don't automatically join Alpha
- No one is promised anything based on canyon results
- It's purely a filter smoke test

### Communication Strategy

**To Canyon Participants:**
- "We're testing the filter on historical data"
- "Help us validate it works"
- "We'll show you who the canyon reveals"
- "No promises; just validation work"

**To Alpha Recruiters (May 1 onwards):**
- "Canyon validation shows the filter works"
- "Proceed with open recruitment for Alpha"
- "Filter is ready for 50 new players"
- "Historical validation is separate from fresh recruitment"

**To Alpha Players (Aug onwards):**
- "You weren't selected based on legacy"
- "You're in because you passed fresh merit screening"
- "Canyon was pre-game validation; you're the real test"

---

## Success Criteria

### Filter Works
- All technical gates pass (data loaded, hashed, ranked)
- cullVisible produces intelligible results
- No obvious errors in ranking/visibility

### Canyon is Accurate
- Visible candidates are historically recognizable
- Faded candidates have explainable reasons
- Red/Blue categorization holds up
- Timeline progression makes sense

### Confidence is High
- Ready to run filter on 50 Alpha players
- No major calibration issues identified
- Provenance hashing proven on messy data
- Milestone gates apply sensibly to both legacy and fresh data

### Next Gate Opens
- Alpha recruitment can proceed June 1
- Filter is promoted from experimental to operational status
- Any lessons learned from canyon are documented for future use

---

## Connection to Pogs Framework

The Canyon Validation Phase:

- **Tests the pog stack mechanics** without real gameplay
- **Validates the slammer works** (filter successfully evaluates)
- **Proves the canyon exists** before inviting players to cross it
- **Establishes that the barrier is real** (some people belong, some don't—it's not arbitrary)

The canyon is a **sunk-cost gatekeeper**. It tells you: "This infrastructure was built over 20 years. The filter knows who belonged then. Trust it to recognize who belongs now."

