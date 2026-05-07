# MistTracker Native Client: Validator Character Customization

**Date:** May 5, 2026  
**Framework:** SLM with Type OMEGA  
**Platform:** MistTracker native clients (Windows, macOS, Linux, mobile)  
**Status:** Specification

---

## Feature Overview

MistTracker native clients provide full validator character customization with randomization capability. Character names are domain-unique (no duplicate names across all validators in the system).

---

## Customization System

### Available Customization Options

**Avatar Appearance:**
- Species/race (25+ options: human variants, alien designs, abstract forms)
- Skin tone/color (unlimited range)
- Hair style (50+ options)
- Facial features (eyes, nose, mouth modular components)
- Body type (5 categories: athletic, heavy, slender, tall, compact)
- Clothing/outfit (50+ pre-designed sets + individual piece mixing)
- Accessories (helmets, cybernetics, jewelry, etc.)
- Aura/effects (glow color, particle effects, no effect)

**NFT Skins:**
- Selectable cosmetic skins exclusive to NFT owner
- Each NFT = unique character appearance
- Only the owner can use the skin (verified via wallet)
- Cosmetics-only (no gameplay advantage)
- Can switch between NFT skins and standard customization
- Rare/legendary NFTs become status symbols

**Behavioral Display:**
- Idle animation style (calm, energetic, determined, etc.)
- Emote set (custom gestures for victory, defeat, celebration)
- Voice profile (tone modulation when system announces their actions)
- Signature color (accent color for their UI elements throughout system)

**Profile Information:**
- Display name (domain-unique, 3-32 characters)
- Title/subtitle (optional "Legend Validator" or custom title)
- Bio/description (optional, 0-500 characters)
- Social links (Twitch, YouTube, Discord, etc.)

---

## Random Generation

### Random Button Functionality

**One-click randomizer:**
- Generates completely random valid character
- Respects domain-unique naming (auto-generates unique name + random suffix if collision)
- Maintains coherent aesthetic (doesn't create visually jarring combinations)
- All random aspects are individually re-randomizable

**Individual Randomizers:**
- Randomize appearance only (keep name)
- Randomize name only (keep appearance)
- Randomize outfit only (keep character)
- Randomize emotes/voice only (keep visuals)

**Name-Based Character Seeding:**
- Enter a name → system generates deterministic character appearance from name seed
- Same name always produces same character (across all platforms, all time)
- Different names produce different characters (mathematically distributed)
- Name seed uses SHA256 hash of name string as entropy source
- Example: "Phoenix" always generates the same appearance (red/gold colors, fire effects, etc.)

**Name Randomization Options:**
- First name only (keep surname)
- Full name (random first + random last)
- Generate from seed (reproducible random based on user input)
- Name-locked randomizer (keep current name, regenerate appearance from same name)

---

## Domain-Unique Naming System

### Name Registration

**Unique Constraint:**
- No two validators can have identical display names
- Case-insensitive for uniqueness (both "Eagle" and "eagle" conflict)
- Special characters: hyphens, underscores, spaces allowed; emoji not allowed
- Reserved names: System names (Admin, System, Validator, etc.)

**Conflict Resolution:**
- User attempts to register name "Phoenix"
- System checks if "Phoenix" exists (case-insensitive)
- If available: name registered, user owns it
- If taken: System suggests alternatives
  - "Phoenix_7" (auto-increment)
  - "Phoenix#elite" (user-chosen suffix)
  - "PhoenixV2" (user-chosen variant)

**Name Changes:**
- Validators can change display name once per 30 days (free)
- Additional changes cost reputation points (50 points = 1 name change)
- Name change history visible in audit chain (transparency)
- Old names become available for new validators after 90 days

### Database Validation

**Real-time checks:**
- As user types, system validates availability
- Shows "✓ Available" or "✗ Taken" in real-time
- Suggests available alternatives if desired name taken
- No wait time (instant check against domain registry)

**At registration:**
- Final validation before account creation
- If name stolen in interim (race condition), retry with suggestion
- Atomic transaction (name reserved the instant it's verified + accepted)

---

## Native Client Implementation

### Customization UI

**Desktop (Windows/macOS/Linux):**
- Full 3D character preview (interactive rotation, zoom)
- Category tabs (appearance, outfit, effects, profile, **NFT skins**)
- Randomize buttons on each category
- Master randomize (all categories)
- Name field with real-time availability check
- Preview name as it will appear in-game
- NFT skin selector (shows owned NFTs, can switch instantly)

**Mobile (iOS/Android):**
- 2D character preview (swiped to rotate)
- Carousel-style category selection
- Large randomize buttons (mobile-friendly)
- Name field with dropdown suggestions
- Confirmation screen before saving
- NFT skins tab (owned NFTs displayed as cards)

**NFT Skin Selection:**
- Dedicated "NFT Skins" tab shows all owned skins
- Click to preview (3D render of NFT skin appearance)
- Click to activate (becomes active character appearance)
- Metadata display (rarity, collection, traits, creator)
- Switch back to custom appearance anytime (no lockout)

**VR Support:**
- Full 3D avatar preview in VR space
- Point-and-select customization
- Voice input for name entry (with spell-check)
- Full 360 preview before commitment

### Save & Sync

**Local Storage:**
- Character design saved to local device
- Cached offline (can edit without network)
- Syncs to cloud on next connection
- Conflict resolution: last-write-wins (or prompt user)

**Account Integration:**
- Linked to validator account
- Changes reflected across all platforms in <5 seconds
- If name changed on one device, all devices update
- If appearance changed offline, syncs when reconnected

---

## Aesthetic Coherence

### Name-Based Character Generation

**How Name Seeding Works:**

1. User enters name (e.g., "Phoenix")
2. System computes SHA256(name.lower()) → 256-bit hash
3. Hash is split into component seeds:
   - Bits 0-15: Species selector
   - Bits 16-31: Skin tone
   - Bits 32-47: Hair style
   - Bits 48-63: Outfit base
   - Bits 64-79: Effects/aura
   - Remaining bits: Fine-tuning (eye color, accessories, etc.)
4. Deterministic character generated and displayed
5. Same name always produces identical character (across all platforms, all time)

**Use Cases:**

- New validator generates name "Phoenix" and hits "Generate from Name" → gets consistent character
- Validator changes platform (desktop to mobile) → same character appears
- 40 years later, "Phoenix" character is still visually identical in old/new photos
- Different validators can see "Phoenix's" character is always Phoenix-like (red, fire-themed, etc.)

**Philosophy:** Your name determines your appearance. Consistent identity across time and platforms.

### Style Presets

**Randomization respects style groups:**
- Cyberpunk: neon colors, tech accessories, modern clothing
- Fantasy: natural colors, medieval clothing, magical effects
- Minimalist: simple forms, neutral colors, no effects
- Alien: non-human forms, exotic colors, sci-fi styling
- Retro: 80s/90s aesthetics, pixelated elements, old-school styling

**Mixed-style characters:**
- Randomizer can mix styles (Cyberpunk + Alien hybrid)
- User can lock style (randomize only within chosen style)
- Manual override always available (use any combination)
- Name seeding respects style-locking (same name in different style = different appearance)

---

## Integration with MistTracker Universe

### Full Domain Character Persistence

**Cross-domain consistency:**
- Same character appears in all domains validator accesses
- Stellaris universe → Byzantine consensus voting → sandbox testing → audit chain review
- Character portrait appears anywhere validator is identified
- Seamless travel: walk from universe to consensus to sandbox without re-appearance

**Domain Coverage:**
- Primary universe (main civilization gameplay)
- Sandbox environments (training rounds)
- Byzantine consensus (quorum voting interface)
- Leaderboards and ranking systems
- Audit chain viewer (character photo with logged actions)
- Community features (profiles, forums, etc.)
- Corporate analytics dashboards (character visible in validator stats)

**Name persistence across domains:**
- Domain-unique name ensures character is identifiable everywhere
- Same character name = same character appearance (via seed)
- Validator "Phoenix" is always Phoenix across all domains
- Audit trail shows all actions tied to single character identity

### Character Visibility

**In-game display:**
- Validator character visible in universe (stands next to their civilization)
- Character seen by other validators (ranked by reputation)
- Character cosmetics don't affect gameplay (pure visual)
- Character name is validator's in-game identifier
- Same character visible in sandbox (when testing strategies)

**Leaderboards:**
- Sorted by reputation
- Character portrait next to name
- Can click to view full character customization
- Links to all validator's appearances across domains

**Matches/Events:**
- Character appears in match intros
- Validated in Byzantine quorum (character avatar at voting interface)
- Featured in universe history (character photo in major events)
- Appears in corporate analytics dashboards

**Consensus & Authority:**
- Character visible when validator votes in Byzantine quorum
- Character shown when submitting influence proposals
- Character on display when making major universe decisions
- Physical presence reinforces validator accountability

---

## Specifications

### Technical Requirements

**Name Field:**
- 3-32 characters (alphanumeric + special chars: - _ space)
- UTF-8 encoding (supports international characters)
- SQL injection prevention (all names sanitized)
- Real-time availability check (<100ms latency)
- Audit logged (domain registry tracks all name operations)
- Seed-based: SHA256(name.lower()) → deterministic character generation

**Appearance Data:**
- Stored as JSON object (human-readable customization)
- Fields: species, skin_tone, hair_style, outfit, effects, color, etc.
- Versioned schema (future cosmetics added without breaking old characters)
- Compressed for transmission (<10KB per character)
- Seeded characters: appearance is derived from name hash (not stored separately)
- Manual characters: appearance stored as explicit values
- Hybrid option: name seed + manual overrides (seed generates base, user tweaks)

**Character Sync:**
- Cloud storage: AWS S3 encrypted
- Sync triggers: login, logout, any customization change
- Conflict resolution: timestamp-based (latest wins)
- Offline-first: works without network, syncs when available

### Domain Persistence Mechanism

**Full Validator Domain Access:**
- When validator logs in, character loads once (cached locally)
- Character available in all systems validator accesses
- Render system uses cached character data (minimal latency)
- Updates propagate to all domains in <5 seconds

**Technical Implementation:**
- Character appearance stored in central profile database
- All domains reference same character ID (via domain-unique name)
- Character portrait pre-rendered at login (used across all UIs)
- Appearance updates trigger re-render and redistribute to all domains

**Validator Movement Pattern:**
1. Validator in Stellaris universe (character visible on map)
2. Switch to Byzantine quorum voting (same character at voting interface)
3. Enter sandbox training round (character still visible as self identifier)
4. View audit chain (character portrait with historical actions)
5. Back to universe (same character, no reloading)

**Seamless Experience:**
- No character re-render between domains
- Single character identity across entire system
- Validator sees themselves consistently everywhere
- Other validators always recognize them by character

**Social Reinforcement:**
- Character becomes validator's identity in community
- Physical presence (character portrait) reinforces accountability
- Same face making decisions in quorum, playing in universe, training in sandbox
- Over 40 years, character becomes legend (recognizable across entire population)

---

## Launch Readiness

**May 24-26 deployment:**
- ✅ Customization UI complete (desktop priority, mobile/VR post-launch)
- ✅ Random button functional
- ✅ Domain-unique naming system active
- ✅ Character appearance validation working
- ✅ Cloud sync operational
- ✅ NFT skin system functional (wallet linking, ownership verification)
- ⏳ Mobile client (first update post-launch)
- ⏳ VR support (phase 2)
- ⏳ NFT marketplace integration (phase 2)

**Pre-launch testing:**
- Test 1000+ random character generations (check uniqueness, coherence)
- Test name collision handling (force 100 registrations of "TestValidator")
- Test cross-platform sync (edit on desktop, verify on mobile)
- Test offline creation (create character, go offline, sync on reconnect)
- Test NFT skin rendering (verify owned NFTs display correctly)
- Test NFT ownership verification (ensure non-owners cannot use skins)
- Test NFT transfer scenario (sell NFT, verify old owner loses access)

---

## NFT Skins System

### How NFT Skins Work

**Ownership Verification:**
- Validator links wallet to MistTracker account
- System scans for owned NFTs in specified collection(s)
- Each owned NFT automatically becomes selectable skin
- Ownership verified on each login (can't use NFT if transferred)

**Skin Activation:**
- From customization UI, click owned NFT
- Preview skin appearance
- Click "Activate Skin" to apply
- Character appearance changes to NFT design
- Change reflected across all domains in <5 seconds
- Can switch back to custom appearance anytime

**Technical Implementation:**
- NFT metadata fetched from blockchain
- Appearance traits parsed (species, outfit, effects, etc.)
- Skin rendering uses same 3D engine as standard cosmetics
- Name stays same (NFT only changes appearance)
- Domain persistence applies (NFT skin visible everywhere)

### NFT Skin Features

**Rarity & Status:**
- Legendary/Rare NFTs visible to all validators
- Character portrait shows NFT rarity indicator
- "Legendary skin" badge appears next to character name
- Status symbol (shows validator invested in character)

**Trading & Transfer:**
- Validator sells NFT → ownership transfers
- New owner can immediately use skin
- Old owner loses access (verified on next login)
- No reputation loss for NFT sale (cosmetics only)

**Collection Integration:**
- Each NFT collection supports up to 10,000 unique skins
- Creator can design new collection (custom artwork)
- Royalties paid to creator on secondary sales (optional)
- Collections become lore elements (e.g., "Cyber Legion" collection)

**Limited Edition Mechanics:**
- Creator can release limited-edition NFT skins (e.g., 100 total)
- Scarcity increases value (100 copies = more valuable than 10,000)
- Validators actively trade/collect (secondary market)
- Rarest skins become legendary (only 1-5 in existence)

### NFT Skin & Domain Persistence

**Character Consistency:**
- Same NFT skin appears across all domains
- Character portrait in voting quorum = same as in universe
- Leaderboard shows NFT rarity (status signal)
- Rare skin = recognizable validator (reputation + cosmetics)

**Example:**
- Validator owns "Phoenix Ascendant" legendary NFT (1 of 5 in existence)
- Activates skin in customization
- Appears in Stellaris universe (every other validator recognizes them)
- Appears in Byzantine voting (legendary skin at voting interface)
- Appears on leaderboards (NFT rarity badge visible)
- Reputation + unique cosmetics = legendary status

### NFT Integration Requirements

**For Launch (May 24-26):**
- ✅ Wallet linking system
- ✅ NFT ownership verification
- ✅ Basic skin selection UI
- ✅ Domain persistence for NFT skins
- ⏳ First NFT collection launch (partnership announcement)

**Phase 2 (June 2026+):**
- Community NFT collection (user-designed skins)
- Creator tools (design your own NFT skin)
- Marketplace integration (buy/sell NFT skins)
- Rarity ranking system (global NFT tracker)
- Legendary skin leaderboard (most valuable NFTs)

---

## Steam Card Integration as NFT Skins

**Mechanic:**
- Steam trading cards owned by a validator in Stellaris are treated as NFT-equivalent cosmetics for MistTracker character customization.
- Each Steam card unlocks a unique skin, outfit, or cosmetic effect in the customization UI.
- Ownership is verified via Steam account linking (OAuth or API integration).
- Steam card cosmetics are purely visual (no gameplay advantage).
- Steam card skins are domain-persistent and appear across all MistTracker domains (universe, voting, leaderboards, etc.).
- Legendary/rare Steam cards receive rarity indicators and status badges, just like blockchain NFTs.
- Steam card trading (via Steam) immediately updates available cosmetics in MistTracker.

**Purpose:**
- Expands NFT skin system to include mainstream digital collectibles.
- Allows all Stellaris players to express identity and status using their existing Steam collections.
- Bridges blockchain and traditional gaming assets for validator customization.

---

## Future Enhancements

**Phase 2 (June 2026):**
- Mobile native client
- NFT skin marketplace integration
- Additional cosmetic items (50+ new outfits)
- Emote customization builder
- Character portrait generation (AI-generated unique photos)

**Phase 3 (August 2026):**
- VR character builder
- Community cosmetics (user-created designs, revenue-shared)
- Character animation (dancing, victory poses, etc.)
- Pet companions (cosmetic only, no gameplay effect)

---

## Conclusion

MistTracker native clients provide full validator character customization with randomization, domain-unique naming, and NFT skin support. Characters are purely cosmetic (don't affect gameplay) but serve as validator identity in the Stellaris universe and community.

Low friction entry (hit "Random"), high customization ceiling (build dream character or collect legendary NFT skins), and unique identity (your name is yours across the system).

---

**Document Version:** 1.0  
**Framework:** SLM with Type OMEGA  
**Status:** Specification approved for May 24-26 implementation  
**Classification:** Public (validator-facing feature)
