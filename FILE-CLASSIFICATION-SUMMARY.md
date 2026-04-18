# File Classification Summary
## What Gets Uploaded to Git vs What Stays Offline

**Last Updated**: April 18, 2026  
**Purpose**: Quick reference for file upload decisions

---

## TL;DR - THE SIMPLE RULE

```
USER NEEDS IT FOR PRODUCTION? → Upload to Git ✅
DEVELOPMENT/DEBUG ONLY?       → Keep Offline ❌
UNSURE?                       → Keep Offline (safer)
```

---

## WHAT'S UPLOADED TO GIT

### ✅ Production Code (100% uploading)
- `Mist*.js` - Core physics engine
- `Physics*.js` - Physics calculations  
- `Phase10*.js` - Advanced implementations
- `server/` - Backend API (entire directory)
- `client/` - React frontend (entire directory)
- Utility files: `cli.js`, `conflict-handler.js`, `p2p-handler.js`, `websocket-protocol.js`, etc.

### ✅ Configuration & Infrastructure
- `package.json` - Dependencies
- `database-schema.sql` - Database structure
- `.gitignore` - Git configuration
- `.github/` - GitHub workflows
- `LICENSE` - Legal

### ✅ Strategic Documentation (Communication with team)
- `COMPLETE-STRATEGIC-VISION.md` - Overall vision
- `ARCHITECTURE-TIMELINE-VISUALIZATION.md` - Phase timeline
- `ATOMIC-PHYSICS-DOMAIN-ALIGNMENT.md` - Phase 17 strategy
- `DOMAIN-PROGRESSION-ROADMAP.md` - Phase 18-25+ roadmap
- `MULTI-DOMAIN-RESEARCH-ARCHITECTURE.md` - Architecture
- `INFRASTRUCTURE-QUICKSTART-ORCHESTRATION.md` - Deploy guide
- `PHASE-17-LAUNCH-ATOMIC-TO-COSMOS.md` - Phase 17 launch plan
- `PHASE-17-ATOMIC-PHYSICS-STRATEGY.md` - Phase 17 strategy

### ✅ User Manuals & API References (For adoption/integration)
- `SOLUTION-MANUAL.md` - How to use the solution
- `PHYSICS-USER-GUIDE.md` - How to use physics engine
- `PHYSICS-API-REFERENCE.md` - API documentation
- `PHYSICS-TROUBLESHOOTING.md` - Troubleshooting guide
- `USER-CREATION.md` - User setup instructions
- `INTEGRATION_GUIDE.md` - How to integrate
- `GEOMETRY-QUICK-START.md` - Geometry getting started
- `QUICKSTART-SPRINT5.md` - Quick start guide
- `README.md` - Main documentation
- `Citations.md` - References

### ✅ Scripts & Utilities
- `scripts/` - Build and utility scripts (in directory)
- `builder-config-validator.js` - Configuration validation
- `geometry-handler.js` - Geometry utilities

---

## WHAT STAYS OFFLINE

### ❌ Development Documentation (Progress Tracking)

**Phase Completion Reports** (internal progress):
- `PHASE-*-COMPLETION-SUMMARY.md`
- `PHASE-*-COMPLETION-STATUS.md`
- `PHASE-*-COMPLETION-FINAL.md`

**Phase Quick References** (development notes):
- `PHASE-*-QUICK-REFERENCE.md`
- `PHASE-*-QUICK-START.md`

**Phase Analysis & Reports** (internal debugging):
- `PHASE-*-DIAGNOSTIC.md`
- `PHASE-*-ANALYSIS.md`
- `PHASE-*-REPORT.md`
- `PHASE-*-VERIFICATION*.md`
- `PHASE-*-FIX*.md`
- `PHASE-*-ROOT-CAUSE*.md`
- `PHASE-*-MANUAL*.md`

**Phase Specific Development Docs**:
- `PHASE-*-CONNECTIVITY*.md`
- `PHASE-*-CONFLICT*.md`
- `PHASE-*-METADATA*.md`
- `PHASE-*-FEATURE*.md`
- `PHASE-*-CLEANUP*.md`
- `PHASE-*-AUDIT*.md`

**Sprint Tracking** (iteration notes):
- `SPRINT*-COMPLETION*.md`
- `SPRINT*-SUMMARY*.md`
- `SPRINT*-PHASE*.md`
- `SPRINT*-CORE*.md`
- `SPRINT*-TESTING*.md`

**Session & Progress Notes**:
- `SESSION-SUMMARY-*.md` - Work session summaries
- `PROGRESS.md` - Running progress notes
- `CONSOLIDATION-SUMMARY.md` - Consolidation notes
- `DELIVERABLES-*.md` - Deliverable tracking

**Deployment & Migration** (internal reference):
- `DEPLOYMENT-*.md`
- `MIGRATION-*.md`
- `*-HANDOFF.md`

**Other Development Docs**:
- `STATE-MANAGEMENT-ANALYSIS.md`
- `codeParseSecurity.md`
- `PHYSICS-VISUALIZATION-COMPLETE.md`
- `PHYSICS-UI-INTEGRATION.md`
- `PHASE4-4D-VISUALIZATION.md`
- `PHASE4-FILE-REFERENCE.md`
- `README-SPRINT*.md` - Old sprint readmes

### ❌ Test Files (Development Only)
- `test/` - Entire test directory
- `test-*.js` - Individual test files
- `verify-*.js` - Verification scripts
- `*-test.js` - Any test file
- `PHASE-*-BROWSER-TESTS.js`
- `run-physics-tests.js`
- `regression-test-runner.js`

### ❌ Runtime Logs & Outputs (Machine-Specific)
- `*.log` - All log files
- `err.txt` - Standard error
- `out.txt` - Standard output
- `server-err.txt` - Server errors
- `server-out.txt` - Server output
- `.pm2/` - Process manager logs
- `debug.log` - Debug logs

### ❌ Generated Dependencies
- `node_modules/` - NPM dependencies (regenerate from package.json)
- `.npm/` - NPM cache

### ❌ Database Exports & Data (Except Schema)
- `*.sql` except `database-schema.sql` - Database dumps
- `MySQL.session.sql` - Personal session
- `*.csv` except templates - Processed data
- `metadata-dump.json` - Generated metadata
- `MySQL Connection Backup/` - Backup directory

### ❌ Archives & Old Versions
- `Reference/` - Reference documents
- `Documentation Archive/` - Previous versions
- `Waterfall/` - Legacy project
- `Mist Event Tracker-*/` - Archive extracts
- `*.7z` - Compressed archives
- `*.zip` - Zip archives
- `Phase-14-Console-Logs/` - Console output

### ❌ Personal & Secret Files (CRITICAL)
- `.env` - Environment variables
- `*.pem` - Certificate files
- `*.key` - Private keys
- `*.pub` - Public keys
- `GPG/` - Personal cryptographic keys
- `.vscode/` - IDE personal settings
- `settings.json` - Personal settings
- `mistStartChecks.txt` - Personal config
- `How-to-play-notes*.csv` - Personal notes

### ❌ Development Variants & Utilities
- `pureMathPhysicsEngine.js` - Development variant
- `Planck_*.png` - Development images
- `theGame.md` - Development notes
- `story.rtf` - Development notes

### ❌ Build Artifacts
- `.devcontainer/` - Local container setup
- `dist/` - Built output
- `build/` - Build directory

---

## BREAKDOWN BY CATEGORY

### 📊 File Type Summary

| Category | Upload? | Files | Count |
|----------|---------|-------|-------|
| **Production Code** | ✅ | Mist*.js, server/, client/ | ~50+ files |
| **Configuration** | ✅ | package.json, database-schema.sql | 2 files |
| **Strategic Docs** | ✅ | COMPLETE-STRATEGIC-VISION.md, etc. | 8 files |
| **User Manuals** | ✅ | SOLUTION-MANUAL.md, PHYSICS-*.md, etc. | 9 files |
| **Phase Notes** | ❌ | PHASE-*-COMPLETION.md, etc. | 40+ files |
| **Session Notes** | ❌ | SESSION-SUMMARY-*.md | 10+ files |
| **Tests** | ❌ | test-*.js, verify-*.js | 30+ files |
| **Logs** | ❌ | *.log, err.txt, out.txt | 5+ files |
| **Dependencies** | ❌ | node_modules/ | 10,000+ |
| **Archives** | ❌ | Reference/, Waterfall/, *.7z | 5+ |
| **Secrets** | ❌ | .env, *.pem, GPG/ | 5+ |

---

## UPLOAD CANDIDATES (When you're unsure)

If a file is in your repo and you're unsure about uploading it:

### Ask These Questions

1. **Is this code?**
   - YES → Upload it ✅
   - NO → Continue...

2. **Is this user documentation?**
   - YES → Upload it ✅
   - NO → Continue...

3. **Is this strategic/architecture documentation?**
   - YES (vision, design, strategy) → Upload it ✅
   - NO → Continue...

4. **Is this generated or temporary?**
   - YES (logs, cache, build output) → Don't upload ❌
   - NO → Continue...

5. **Is this personal or sensitive?**
   - YES (secrets, keys, personal settings) → Don't upload ❌
   - NO → Continue...

6. **Is this development work tracking?**
   - YES (phase notes, session summaries, sprint tracking) → Don't upload ❌
   - NO → Continue...

7. **Would a collaborator need this to use the product?**
   - YES → Upload it ✅
   - NO → Keep offline ❌

---

## FILES BY DIRECTORY

```
.
├─ .git/                          Don't touch
├─ .github/                       ✅ Upload (workflows)
├─ .vscode/                       ❌ Offline (personal IDE)
├─ GPG/                           ❌ Offline (personal keys)
├─ Reference/                     ❌ Offline (old docs)
├─ Documentation Archive/         ❌ Offline (old versions)
├─ Waterfall/                     ❌ Offline (legacy)
├─ Phase-14-Console-Logs/         ❌ Offline (debug output)
├─ MySQL Connection Backup/       ❌ Offline (backups)
├─ Mist Event Tracker-*/          ❌ Offline (archives)
│
├─ client/                        ✅ Upload (all)
├─ server/                        ✅ Upload (all)
├─ test/                          ❌ Offline (tests)
├─ scripts/                       ✅ Upload (utilities)
├─ shaders/                       ✅ Upload (GPU code)
│
├─ node_modules/                  ❌ Offline (generated)
│
├─ *.js                           ✅ Upload (Mist*, Physics*, server*, etc.)
│                                 ❌ Offline (test-*, verify-*)
│
├─ PHASE-*.md                     ❌ Offline (dev notes)
├─ SESSION-SUMMARY-*.md           ❌ Offline (work notes)
├─ SPRINT*.md                     ❌ Offline (sprint tracking)
│
├─ COMPLETE-STRATEGIC-VISION.md   ✅ Upload (strategic)
├─ ARCHITECTURE-*.md              ✅ Upload (strategic)
├─ ATOMIC-PHYSICS-*.md            ✅ Upload (strategic)
├─ DOMAIN-PROGRESSION-*.md        ✅ Upload (strategic)
├─ INFRASTRUCTURE-*.md            ✅ Upload (strategic)
│
├─ SOLUTION-MANUAL.md             ✅ Upload (user doc)
├─ PHYSICS-*.md                   ✅ Upload (user doc)
├─ USER-CREATION.md               ✅ Upload (user doc)
│
├─ *.log                          ❌ Offline (logs)
├─ err.txt, out.txt               ❌ Offline (output)
├─ .env                           ❌ Offline (secrets)
├─ *.pem, *.key                   ❌ Offline (keys)
│
├─ *.7z, *.zip                    ❌ Offline (archives)
└─ package.json                   ✅ Upload (config)
```

---

## THE NUMBERS

```
Files to Upload to Git:
├─ Production Code:          ~60 files
├─ Configuration:            ~3 files
├─ Strategic Documentation:  ~8 files
├─ User Manuals:             ~9 files
└─ Total:                    ~80 files ✅

Files to Keep Offline:
├─ Phase/Sprint Notes:       ~50 files
├─ Test Files:               ~30 files
├─ Logs & Output:            ~5 files
├─ Dependencies:             ~10,000 files
├─ Archives & Old Docs:      ~5 files
├─ Secrets & Personal:       ~5 files
└─ Total:                    ~10,100 files ❌
```

---

## BEFORE YOUR FIRST PUSH

```
✅ Verify .gitignore is updated
   $ cat .gitignore | head -20

✅ Check what would be committed
   $ git status

✅ Review each file
   $ git diff --cached --name-only | sort

✅ Check for secrets
   $ git diff --cached | grep -i "password\|secret\|key"
   (Should return nothing)

✅ Check for logs
   $ git diff --cached --name-only | grep "\.log\|err\|out"
   (Should return nothing)

✅ Review commit message
   $ git log --oneline -1

✅ If all looks good
   $ git push
```

---

## COMMON QUESTIONS

**Q: Can I upload phase documents?**  
A: NO. Phase documents (PHASE-*-COMPLETION.md, etc.) are internal progress tracking. Keep them offline. Only upload strategic docs like COMPLETE-STRATEGIC-VISION.md.

**Q: What about my test files?**  
A: Keep locally. Tests can be regenerated from source code and don't need version history. Run tests before committing but don't commit them.

**Q: Should I upload logs?**  
A: NEVER. Logs are machine-specific, can contain secrets, and grow unbounded. Use log aggregation services instead.

**Q: What if I accidentally committed something bad?**  
A: Before pushing, undo with `git reset --soft HEAD~1`. After pushing, use `git revert` or force push (but only if no one else is pulling).

**Q: How do I handle secrets if I accidentally commit them?**  
A: IMMEDIATELY rotate the secrets, then rewrite git history. See GIT-REPOSITORY-POLICY.md for details.

**Q: Can I commit my .env file?**  
A: NEVER. It contains secrets. Use environment configuration or .gitignore.

---

**Reference Documents**:
- See [GIT-REPOSITORY-POLICY.md](GIT-REPOSITORY-POLICY.md) for detailed rationale
- See [PRE-PUSH-CHECKLIST.md](PRE-PUSH-CHECKLIST.md) for verification steps
- See [.gitignore](.gitignore) for complete ignore patterns
