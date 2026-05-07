# MistTracker Volunteer Candidate Filter Specification

**Version:** 1.0  
**Date:** April 25, 2026  
**Status:** ARCHITECTURAL PRINCIPLE LOCKED  
**Classification:** Recruitment Infrastructure (Competence-Gated)

---

## Core Principle: Self-Evidence Without Hand-Holding

**LOCKED ARCHITECTURAL REQUIREMENT:**

The MistTracker Volunteer Candidate Filter must be **instantly parseable at face value**. No tutorials. No onboarding. No explanatory text. No guided walkthroughs.

**Competence Gate:**

If a user cannot immediately understand the following core structures on sight, they have **no right to touch this system**:

1. **Primary Timeline → Category → Item Selection Pipeline**
2. **Provenance Hash Trail** (immutable evidence chain)
3. **Milestone Gate Architecture** (visibility + advancement control)
4. **cullVisible Ranking Logic** (competence-based filtering)
5. **Reputation Scoring Mechanics** (multi-dimensional, auditable)

---

## Why This Principle Exists

### Competence Alignment

The filter selects validators and volunteers. Those who will use it must demonstrate:
- Understanding of temporal progression (timeline dimension)
- Ability to parse categorical structure (skill/domain dimension)
- Recognition of item-level evidence (artifact dimension)
- Literacy in cryptographic provenance (hash verification)
- Comprehension of gating logic (milestone advancement rules)

### Security Through Clarity

A system this important cannot afford:
- Cargo cult usage (using it without understanding it)
- Intuitive-but-wrong interpretations
- Misrepresentation of candidates
- Byzantine attacks via interface confusion

Clarity is the security boundary. If you can't read it clearly, you can't trust your decisions.

### Validator Selection Integrity

Only competent operators should be able to:
- Evaluate volunteers
- Rank candidates
- Make recruitment decisions
- Certify milestone advancement

Hiding complexity behind UI hand-holding **guarantees incompetent operation**.

---

## Interface Design Constraints

### What IS Required

1. **Clear Visual Hierarchy**
   - Timeline as primary X-axis (progression)
   - Categories as Y-axis (skill domains)
   - Items as Z-axis (evidence artifacts)
   - All three visible simultaneously

2. **Provenance Display**
   - SHA256 hash visible for every decision
   - Timestamp linked to hash (immutable link)
   - Hash chain showing previous state → current state
   - Verification: `hash(prev + change) = current`

3. **Milestone Gate Indicators**
   - Clear visual gate markers (locked/unlocked states)
   - Gate thresholds visible (e.g., "Milestone 3 required for shortlist")
   - Candidate position relative to gate (passes/fails at a glance)

4. **Ranking Visualization**
   - Multi-dimensional scoring display (e.g., heatmap or radial plot)
   - Metric labels (reliability, diversity, alignment, breakthrough correlation)
   - Score justification (which factors matter most)

5. **Selection State Machine**
   - Current mode visible (time selection → category drill-down → item review)
   - Back/forward navigation explicit
   - No hidden navigation paths

### What IS NOT Allowed

- ❌ **Tutorials or walkthroughs**
- ❌ **Context-sensitive help overlays**
- ❌ **Tooltips explaining the UI**
- ❌ **"Getting started" guides**
- ❌ **Default selections** (user must actively select)
- ❌ **Hidden state** (everything visible or clearly locked)
- ❌ **Abbreviations without full names displayed** (first use must show full form)
- ❌ **Assumptions about user knowledge**

---

## Core Components

### 1. Timeline (Progression Dimension)

**Representation:**
- Horizontal axis showing project duration (e.g., Phase 1 → Phase 50)
- Each volunteer has a position marker on timeline
- Marker includes: name, join date, current phase, status

**Interactions:**
- Click timeline position → zoom to category level for that volunteer
- Drag to select time range → shows all candidates in range
- Color coding: (optional) Green (active), Yellow (milestone pending), Red (gated)

**Requirement:**
User must immediately recognize: "This volunteer advanced from Phase 10 to Phase 25 in 8 weeks"

---

### 2. Categories (Skill/Domain Dimension)

**Representation:**
- Vertical axis showing skill domains
- Examples: Vulkan, Physics/Wave, P2P/Multi, UI Components, Story Integration, Moderation
- Each category shows proficiency level (1-5 stars or similar)
- Width of category bar ∝ depth of contribution

**Interactions:**
- Select category → shows all items in that category for the timeline selection
- Category color ∝ reputation in that domain
- Bar width shows artifact count (more contributions = wider bar)

**Requirement:**
User must immediately recognize: "This volunteer excels in Physics/Wave (4.5 stars) with 23 contributions, weak in P2P/Multi (2 stars) with 3 contributions"

---

### 3. Items (Evidence/Artifact Dimension)

**Representation:**
- Listed below category (or in expandable section)
- Each item shows:
  - Artifact type (PR, commit, message, test result, milestone)
  - Artifact ID (link to source)
  - Timestamp
  - Provenance hash
  - Validator signature (who verified it)
  - Reputation impact (±points, reason)

**Interactions:**
- Click item → show full artifact (with cryptographic proof)
- Click hash → verify chain to previous hash
- Sort by: date, reputation impact, or validator confidence

**Requirement:**
User must immediately recognize: "PR #427 was verified by 3 validators on Apr 24, correct with 87% confidence, earned volunteer +8 reputation, hash links to commit abc123def..."

---

### 4. Provenance Hash Trail

**Representation:**
- Every decision includes cryptographic commitment
- Hash format: `SHA256(previous_hash + timestamp + decision + validator_signature)`
- Chain displayed as linked list: [hash1] → [hash2] → [hash3] → [current]
- Each hash is clickable to verify integrity

**Interactions:**
- Click hash → shows detailed verification:
  - Input data that produced this hash
  - Previous hash (proving continuity)
  - Timestamp locked to nanosecond precision
  - Validator signature (who made the decision)
  - Audit chain position

**Requirement:**
User must immediately recognize: "This decision chain is unbroken from volunteer recruitment (Apr 24) through today; every change is cryptographically locked"

---

### 5. Milestone Gate Architecture

**Representation:**
- Gate markers on timeline showing milestone thresholds
- Visual indicator: locked/unlocked/in-progress
- Gate criteria displayed:
  - Example: "Milestone 3 Gate: Requires ≥50 reputation in 2+ categories"
  - Example: "Shortlist Gate: Requires Milestone 3 + passing Byzantine vote"

**Interactions:**
- Candidate positioned relative to gate: before/at/past
- Gate details (click) → shows evaluation criteria and current standing
- Gate violation highlights what's required to pass

**Requirement:**
User must immediately recognize: "This volunteer has reached Milestone 2 (unlocked), working toward Milestone 3 (locked, needs 12 more reputation points), not yet shortlist eligible"

---

### 6. cullVisible Ranking Logic

**Representation:**
- Ranking display showing which candidates are currently visible
- Visibility score: 0-100% (based on milestone gates + reputation)
- Ranking position: 1-N (among visible candidates in current selection)

**Interactions:**
- Change gate threshold → ranking updates live
- Filter by visibility (show: all, visible, top-10, etc.)
- Explain ranking: click → shows scoring formula for each candidate
  - `Score = 20×(reputation) + 15×(milestone_progress) + 10×(diversity_factor) + 5×(stability_factor)`

**Requirement:**
User must immediately recognize: "Candidate ranking before/after adjusting milestone gates; changes are transparent and formula-driven"

---

## Data Model Visibility

### Required Always-Visible Fields

For each volunteer/candidate:

```
Timeline Position:
  - Phase joined
  - Current phase
  - Days in system

Categories:
  - Category name
  - Proficiency level (1-5)
  - Artifact count
  - Latest update timestamp

Items (Evidence):
  - Type (PR/commit/message/test/milestone)
  - ID (link to source)
  - Date
  - Provenance hash
  - Validator signature count
  - Consensus accuracy (%)
  - Reputation delta (±points)

Milestone Status:
  - Gate name
  - Requirement description
  - Current standing (passes/fails)
  - Progress toward next gate

Ranking:
  - Current position
  - Visibility percentage
  - Score components (breakdown)
```

### Forbidden Hidden Fields

- ❌ Internal database IDs (unless for debugging)
- ❌ Backend algorithm parameters not affecting visibility
- ❌ Deprecated data fields
- ❌ Provisional/experimental scores
- ❌ Anything not directly affecting recruitment decision

---

## Interaction Model

### Primary Workflow

```
1. User loads volunteer filter page
   → Sees full timeline of all projects/phases
   → Sees 3-5 sample volunteers positioned on timeline

2. User clicks specific timeline region
   → Zooms to category view for that time range
   → Shows all volunteers active in that phase
   → Shows categories where they contributed

3. User clicks specific category
   → Shows all items (artifacts) in that category
   → Shows provenance chain for each item
   → Shows reputation impact of each item

4. User clicks milestone gate section
   → Shows gate requirements
   → Shows each candidate's standing against gate
   → Shows what's needed to pass

5. User views cullVisible results
   → Shows ranked candidates visible at current gate
   → Shows how ranking changes if gate adjusted
   → All changes explained via formula
```

### Expressivity Requirement

At each step, the user should be able to answer without clicking or hovering:

- **Timeline level:** Which phases is this volunteer active in? What's their current progress?
- **Category level:** What are their strengths and weaknesses across domains?
- **Item level:** What evidence backs up their reputation score? Who verified it?
- **Gate level:** Will they pass the next milestone? What do they need?
- **Ranking level:** Are they visible at current gates? How does that change if gates move?

If the answer is not immediately visible, the interface has failed.

---

## Design Philosophy

### Non-Negotiable Principles

1. **Radical Transparency:** Every number, every decision, every hash is visible or actively locked (no "soft" hiding)
2. **No Hand-Holding:** No tutorials, tips, or explanatory overlays; clarity of design replaces guidance
3. **Competence Gating:** Users who can't read the structure shouldn't be able to use it (make gate visible, not hidden)
4. **Cryptographic Auditability:** Every decision is provably linked to previous decisions via hash chain
5. **Formula-Driven Ranking:** No subjective scores; all ranking explained by visible formula

### Consequences of Principle

- **Barrier to entry is high:** Some users will struggle initially. That's intentional.
- **No "beginner mode":** You either can read this or you shouldn't be recruiting
- **Complexity is visible:** Don't hide it; don't explain it away; make it clear
- **Tradeoff: Slower adoption, better decision-making:** We accept slower adoption for competent operators

---

## Accessibility Without Tutorialization

How to accommodate different skill levels **without tutorials**:

1. **Progressive Disclosure:** Show only mandatory fields at first level; deeper levels reveal more detail
2. **Clear Labeling:** Use full names first mention, then abbreviations consistently
3. **Icon Consistency:** Hash icon always means cryptographic proof; gate icon always means milestone requirement
4. **Color Coding:** Consistent use of color for state (green=unlocked, red=locked, yellow=near threshold)
5. **Structural Obviousness:** Layout makes hierarchy obvious (x=time, y=category, z=items) without labels

**Example:** New user might not understand "cullVisible" at first, but should understand:
- The gate visualization shows what's currently visible
- The ranking list shows who's visible vs. hidden
- The formula shows why some candidates are hidden
- Understanding accumulates through use, not through tutorial

---

## Testing Criteria for Compliance

Before deployment, the interface must pass these tests **without documentation**:

1. **Blind User Test:** 5 competent developers (unfamiliar with system) can:
   - [ ] Identify a specific volunteer on the timeline
   - [ ] Navigate to that volunteer's category breakdown
   - [ ] Understand their reputation score and provenance chain
   - [ ] Determine if they pass/fail the next milestone gate
   - [ ] Explain what would need to change for them to pass

2. **Hash Verification:** Any user can:
   - [ ] Click a provenance hash
   - [ ] See what data produced it
   - [ ] Understand how it links to the previous hash
   - [ ] Verify the chain is unbroken

3. **Ranking Explanation:** Any user can:
   - [ ] Explain why a candidate is ranked #1 vs #5
   - [ ] Show the formula that produces that ranking
   - [ ] Predict what happens if gates are adjusted

4. **Gate Interpretation:** Any user can:
   - [ ] State the exact requirements for the next milestone
   - [ ] Show where a volunteer stands relative to that requirement
   - [ ] List what evidence would push them past the gate

If any test fails, the interface is not compliant with this specification.

---

## Deployment Readiness Checklist

- [ ] Interface passes all 4 blind user tests
- [ ] All visible numbers have provenance hashes
- [ ] All gates explicitly show thresholds and candidate standings
- [ ] All rankings show underlying formula
- [ ] No tooltips, help text, or tutorial elements present
- [ ] Timeline → Category → Item navigation is obvious without labels
- [ ] Provenance chain is clickable and verifiable at every level
- [ ] culVisible logic is formula-driven and fully transparent
- [ ] No deprecated data fields visible
- [ ] Database queries match visible data (no hidden filtering)

---

## Governance

**This specification locks the following:**

1. **No tutorials or hand-holding** — ever added in future versions
2. **Competence gate is interface property** — not a separate system
3. **Self-evidence is non-negotiable** — changes must maintain clarity
4. **Provenance hashing is mandatory** — every decision committed
5. **Ranking formulas are always visible** — never hidden algorithm
6. **Milestone gates are explicit** — never soft/fuzzy thresholds

**Any future modification** to this system must justify why it maintains or strengthens this principle. Weakening it requires explicit architectural decision with documented reasoning.

---

## Connection to Pogs Framework

The Volunteer Candidate Filter is:

- **A gumball machine** for selecting which validators get to turn the crank
- **A pog stack** where each volunteer's evidence is a cap waiting to be struck
- **A game mechanism** where milestone gates determine who plays next
- **An audit trail** with provenance hashes as non-repudiable commitment

The filter's self-evidence principle means: **Only those who can read the game can play it.**

This is not gatekeeping for its own sake. It's structural integrity.

