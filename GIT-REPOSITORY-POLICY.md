# Git Repository Policy & File Classification
## MistTracker - April 18, 2026

This document defines what files are uploaded to Git and what remains offline only.

---

## QUICK DECISION: WHAT GOES WHERE?

### ✅ UPLOAD TO GIT (Production/User-Facing)

```
IMPLEMENTATION CODE:
├─ Mist*.js          Core physics engine modules
├─ Physics*.js       Physics calculation engines
├─ Phase10*.js       Advanced phase implementations
├─ server/           Express server code
├─ client/           React client code
└─ utilities/*.js    Shared utilities, handlers, etc.

CONFIGURATION & SCHEMA:
├─ package.json      Dependency manifest
├─ database-schema.sql   Database structure definition
└─ .gitignore        Git configuration (this file!)

STRATEGIC DOCUMENTATION:
├─ COMPLETE-STRATEGIC-VISION.md
├─ ARCHITECTURE-TIMELINE-VISUALIZATION.md
├─ ATOMIC-PHYSICS-DOMAIN-ALIGNMENT.md
├─ DOMAIN-PROGRESSION-ROADMAP.md
├─ MULTI-DOMAIN-RESEARCH-ARCHITECTURE.md
├─ INFRASTRUCTURE-QUICKSTART-ORCHESTRATION.md
└─ PHASE-17-*.md     (Phase 17 strategy only)

USER MANUALS & GUIDES:
├─ SOLUTION-MANUAL.md
├─ PHYSICS-USER-GUIDE.md
├─ PHYSICS-API-REFERENCE.md
├─ PHYSICS-TROUBLESHOOTING.md
├─ USER-CREATION.md
├─ INTEGRATION_GUIDE.md
└─ GEOMETRY-QUICK-START.md

PROJECT METADATA:
├─ README.md
├─ LICENSE
├─ Citations.md
└─ .github/          GitHub workflows & config
```

### ❌ KEEP OFFLINE (Development/Personal)

```
DEVELOPMENT DOCUMENTATION:
├─ PHASE-*-COMPLETION*.md     (Phase progress tracking)
├─ PHASE-*-QUICK-*.md         (Development references)
├─ SESSION-SUMMARY-*.md       (Work session notes)
├─ SPRINT*.md                 (Sprint tracking)
├─ README-SPRINT*.md          (Old sprint docs)
└─ Various analysis docs      (DIAGNOSTIC, ANALYSIS, REPORT, etc.)

TEST FILES:
├─ test/                      (Test directory)
├─ test-*.js                  (Individual test files)
├─ verify-*.js                (Verification scripts)
├─ PHASE-*-BROWSER-TESTS.js
└─ run-physics-tests.js

LOGS & OUTPUT:
├─ *.log                      (All log files)
├─ err.txt, out.txt, etc.
├─ server-err.txt             (Server output)
├─ .pm2/                      (Process manager logs)
└─ .vscode/                   (IDE configuration)

DATA & BACKUPS:
├─ node_modules/              (Dependencies)
├─ *.sql (except schema)       (Database dumps)
├─ *.csv (except template)     (Processed data)
├─ MySQL.session.sql          (Personal session)
├─ MySQL Connection Backup/   (Local backups)
└─ Mist Event Tracker-*/      (Archive extracts)

ARCHIVES & REFERENCES:
├─ Reference/                 (Old reference docs)
├─ Documentation Archive/     (Previous versions)
├─ Waterfall/                 (Legacy project)
├─ *.7z, *.zip                (Compressed archives)
└─ Phase-14-Console-Logs/     (Debug artifacts)

PERSONAL/SECRETS:
├─ GPG/                       (Personal keys)
├─ .env                       (Environment variables)
├─ *.pem, *.key               (Certificates & keys)
└─ settings.json              (Personal IDE settings)
```

---

## FILE CLASSIFICATION BY TYPE

### 1. IMPLEMENTATION CODE (✅ UPLOAD)

**Rule**: All working code that's part of the product goes in Git.

```
INCLUDED:
├─ Mist*.js          All core implementations
├─ server/           Backend API server
├─ client/           React user interface
├─ scripts/          Build & utility scripts (kept in repo)
└─ *.js files        (General production code)

EXCLUDED:
├─ test-*.js         Development testing only
├─ verify-*.js       Verification utilities (development)
└─ pureMathPhysicsEngine.js  (Development variant)

RATIONALE:
- Production code is needed for deployments
- Development variants clutter git history
- Tests can be regenerated from source
```

### 2. DOCUMENTATION (✅ UPLOAD for Strategic/Manual, ❌ for Development)

**Rule**: User-facing and strategic docs → Git. Development notes → Offline.

```
UPLOAD (Strategic/Manual):
├─ COMPLETE-STRATEGIC-VISION.md
├─ ARCHITECTURE-TIMELINE-VISUALIZATION.md
├─ ATOMIC-PHYSICS-DOMAIN-ALIGNMENT.md
├─ DOMAIN-PROGRESSION-ROADMAP.md
├─ MULTI-DOMAIN-RESEARCH-ARCHITECTURE.md
├─ INFRASTRUCTURE-QUICKSTART-ORCHESTRATION.md
├─ PHASE-17-LAUNCH-ATOMIC-TO-COSMOS.md (Phase 17 strategy)
├─ PHASE-17-ATOMIC-PHYSICS-STRATEGY.md  (Phase 17 strategy)
├─ SOLUTION-MANUAL.md
├─ PHYSICS-USER-GUIDE.md
├─ PHYSICS-API-REFERENCE.md
├─ USER-CREATION.md
├─ INTEGRATION_GUIDE.md
└─ GEOMETRY-QUICK-START.md

KEEP OFFLINE (Development/Progress):
├─ PHASE-*-COMPLETION-SUMMARY.md       (Progress tracking)
├─ PHASE-*-QUICK-REFERENCE.md          (Dev notes)
├─ PHASE-*-DIAGNOSTIC.md               (Debug docs)
├─ PHASE-*-ANALYSIS.md                 (Internal analysis)
├─ SESSION-SUMMARY-*.md                (Work notes)
├─ SPRINT*.md                          (Sprint tracking)
└─ Various REPORT, VERIFICATION files  (Internal docs)

RATIONALE:
- Strategic docs communicate long-term vision → needed by team
- User manuals help adoption → needed in repo
- Phase completion notes track development progress → local only
- Session summaries are internal work notes → clutters history
- Progress docs change frequently → don't need version control
```

### 3. DATABASE & SCHEMA (✅ SCHEMA ONLY, ❌ DUMPS/EXPORTS)

**Rule**: Schema definition yes, data exports no.

```
UPLOAD:
└─ database-schema.sql    Source-of-truth for database structure

KEEP OFFLINE:
├─ *.sql (all others)      Database exports & dumps
├─ MySQL.session.sql       Personal database session
└─ MySQL Connection Backup/   Local snapshots
```

### 4. CONFIGURATION & BUILD (✅ UPLOAD)

**Rule**: Configuration files that define behavior → Git. Personal settings → Offline.

```
UPLOAD:
├─ package.json
├─ .gitignore
└─ .github/

KEEP OFFLINE:
├─ .env                 (Secrets & environment)
├─ .env.local           (Local overrides)
├─ .vscode/             (Personal IDE settings)
├─ settings.json        (User preferences)
└─ *.pem, *.key         (Certificates)

RATIONALE:
- package.json defines what to install → essential
- .env contains secrets → never in version control
- IDE settings are personal → not shared
```

### 5. LOGS & TEMPORARY FILES (❌ KEEP OFFLINE)

**Rule**: Never version control logs. They're machine-specific and contain transient info.

```
EXCLUDE ALL:
├─ *.log                All log files
├─ err.txt, out.txt     Standard output redirects
├─ server-err.txt       Server errors
├─ *.tmp, *.bak         Temporary files
├─ .pm2/                Process manager logs
└─ /node_modules        Dependencies (generated)

RATIONALE:
- Logs contain machine-specific paths & timestamps
- Logs grow unbounded over time
- Logs can accidentally contain secrets
- Logs should be managed by log aggregation services
- node_modules is generated from package.json
```

### 6. TEST FILES (❌ KEEP OFFLINE)

**Rule**: Development tests stay local. Can always regenerate from source.

```
EXCLUDE ALL:
├─ test/
├─ test-*.js
├─ verify-*.js
├─ *-test.js
├─ PHASE-*-BROWSER-TESTS.js
└─ run-physics-tests.js

KEEP LOCALLY FOR:
- Debugging during development
- Regression testing before commits
- Performance profiling

CAN REGENERATE FROM:
- Source code patterns
- Documentation specs
- Reference implementations

RATIONALE:
- Tests are development artifacts
- Tests don't need version history
- Tests can make git history messy
- Single test failure shouldn't block commits
- Run tests locally before pushing
```

### 7. DATA EXPORTS & ARCHIVES (❌ KEEP OFFLINE)

**Rule**: Processed data, exports, and archives stay local. Source code only in Git.

```
EXCLUDE:
├─ *.csv (except templates)    Processed/exported data
├─ *.json (metadata dumps)     Generated outputs
├─ *.7z, *.zip                 Compressed archives
├─ Mist Event Tracker-*/       Archive extracts
├─ MySQL Connection Backup/    Database snapshots
├─ Reference/                  Old reference docs
├─ Documentation Archive/      Previous versions
└─ Waterfall/                  Legacy project

KEEP LOCALLY:
- For personal archival
- For local backup & recovery
- For offline reference

UPLOAD IF NEEDED:
- As release artifacts (add to releases, not main branch)
- For specific versioning (e.g., v1.8.0 archive)
- Through separate archive process

RATIONALE:
- Archives bloat git history (they're already compressed)
- Processed data changes don't need version tracking
- Old versions available through git history
- Can always regenerate from source
```

### 8. PERSONAL/SECRET FILES (❌ ALWAYS KEEP OFFLINE)

**Rule**: Never upload personal data, keys, or secrets.

```
ALWAYS EXCLUDE:
├─ GPG/                    Personal cryptographic keys
├─ .env                    Environment variables (secrets)
├─ *.pem                   Certificates
├─ *.key                   Private keys
├─ settings.json           Personal settings
└─ mysqlStartChecks.txt    Personal configuration

PROTECT WITH:
- .gitignore              (Primary defense)
- git hooks               (Pre-commit checks)
- .gitattributes          (Diff settings)
- Code review             (Before push)

IF ACCIDENTALLY COMMITTED:
1. STOP pushing immediately
2. $ git filter-branch --tree-filter 'rm -f <file>' HEAD
3. Force push to rewrite history
4. Rotate any exposed secrets immediately
5. Notify team of compromise
```

---

## WORKFLOW: HOW TO STAY SAFE

### Before Each Commit

```bash
# 1. See exactly what you're committing
$ git status              # Shows staged vs untracked
$ git diff --cached       # Shows changes to be committed

# 2. Verify no unintended files
$ git diff --cached | grep -i "password\|secret\|key\|env"
$ git status | grep -E "\.log|\.pem|\.env"

# 3. If you added a file by mistake
$ git reset <file>       # Unstage it
$ git checkout -- <file> # Restore to last commit

# 4. Before pushing
$ git log --oneline origin/main..HEAD    # See what you're pushing
$ git diff origin/main                   # Final check
$ git push
```

### If Something Slips Through

```bash
# Undo last commit (before push)
$ git reset --soft HEAD~1    # Uncommit but keep changes
$ git reset HEAD <file>      # Unstage the file
$ git checkout -- <file>     # Discard changes

# Undo after push (requires force push)
$ git reset --hard HEAD~1
$ git push -f                # DANGEROUS: rewrites history
                             # Only do if not others are pulling
```

### Set Pre-Commit Hooks (Optional)

```bash
# Create .git/hooks/pre-commit
#!/bin/bash
git diff --cached | grep -E "(password|secret|\.pem|\.key|\.env)"
if [ $? -eq 0 ]; then
  echo "ERROR: Attempting to commit secrets!"
  exit 1
fi
```

---

## CLASSIFICATION DECISION MATRIX

| File Type | Include? | Reason |
|-----------|----------|--------|
| **Production code** | ✅ YES | Needed for deployments |
| **Strategic docs** | ✅ YES | Communicate vision to team |
| **User manuals** | ✅ YES | Enable adoption |
| **Schema/Config** | ✅ YES | Define system behavior |
| **Phase docs** | ❌ NO | Internal progress tracking |
| **Session notes** | ❌ NO | Development work artifacts |
| **Tests** | ❌ NO | Can regenerate from source |
| **Logs** | ❌ NO | Machine-specific, temporary |
| **Data exports** | ❌ NO | Generated, not source |
| **Archives** | ❌ NO | Use git history instead |
| **Secrets** | ❌ NO | Security risk |
| **IDE settings** | ❌ NO | Personal preference |
| **node_modules** | ❌ NO | Generated from package.json |

---

## EXAMPLE: GOOD COMMITS vs BAD COMMITS

### ✅ GOOD: Strategic feature with tests

```
Files changed:
  MistCore.js              (+50 lines)   Feature implementation
  PHYSICS-API-REFERENCE.md (+20 lines)   API documentation
  test-mist-core.js        (+30 lines)   Tests (local only, not committed)

Commands:
  $ git add MistCore.js PHYSICS-API-REFERENCE.md
  $ git commit -m "Feature: Add X to MistCore with API docs"
  $ git push
```

### ❌ BAD: Phase notes accidentally included

```
Files changed:
  PHASE-14-COMPLETION-SUMMARY.md    (+200 lines)   ❌ Dev notes
  PHASE-14-QUICK-REFERENCE.md       (+100 lines)   ❌ Dev notes
  SESSION-SUMMARY-PHASE4-4D.md      (+150 lines)   ❌ Work notes
  err.txt                           (+1000 lines)  ❌ Logs
  MySQL.session.sql                 (+500 lines)   ❌ DB session

Issue: Commits 950 lines of clutter, doesn't add product value
```

### ✅ GOOD: Bugfix with documentation

```
Files changed:
  conflict-handler.js       (+30 lines)   Fix implementation
  INTEGRATION_GUIDE.md      (+10 lines)   Document workaround
  database-schema.sql       (+5 lines)    Schema update

Commands:
  $ git add conflict-handler.js INTEGRATION_GUIDE.md database-schema.sql
  $ git commit -m "Fix: Conflict resolution in multi-domain scenarios"
  $ git push
```

---

## MAINTENANCE: CLEAN UP LOCAL REPOS

### Occasionally clean up ignored files

```bash
# See what would be deleted
$ git clean -fdx -n

# Actually delete (permanent!)
$ git clean -fdx

# This removes:
# - node_modules/
# - .env files
# - *.log files
# - test outputs
# - anything in .gitignore
```

### Keep git history clean

```bash
# Before pushing, squash small commits
$ git rebase -i HEAD~3    # Combine last 3 commits

# Avoid committing and immediately undoing
- Think before committing
- Test locally before pushing
- Use branches for experimentation
```

---

## REFERENCE: WHAT EACH DIRECTORY CONTAINS

```
.
├─ .git/                          Git internals (never edit)
├─ .github/                       GitHub workflows (✅ upload)
├─ .vscode/                       IDE settings (❌ offline)
├─ client/                        React app (✅ upload)
├─ server/                        Express backend (✅ upload)
├─ test/                          Tests (❌ offline)
├─ scripts/                       Build scripts (✅ upload)
├─ shaders/                       GPU shaders (✅ upload)
├─ Documentation Archive/         Old docs (❌ offline)
├─ Reference/                     Reference materials (❌ offline)
├─ Waterfall/                     Legacy project (❌ offline)
├─ GPG/                           Personal keys (❌ offline)
├─ MySQL Connection Backup/       DB backups (❌ offline)
│
├─ Mist*.js                       Core code (✅ upload)
├─ Physics*.js                    Physics code (✅ upload)
├─ Phase10*.js                    Advanced features (✅ upload)
│
├─ *.md                           Documentation (✅ if strategic)
├─ *.log                          Logs (❌ offline)
├─ *.sql                          Schemas (✅ schema only)
├─ *.env                          Secrets (❌ offline)
├─ package.json                   Dependencies (✅ upload)
└─ README.md                      Main docs (✅ upload)
```

---

## SUMMARY

### The Philosophy

```
Git = "What does the user need to run this project?"
├─ Source code ✅
├─ Configuration & schema ✅
├─ Strategic documentation ✅
├─ API references ✅
└─ User manuals ✅

Offline = "What's helpful for development but not needed for deployment?"
├─ Phase progress notes ❌
├─ Development tests ❌
├─ Debug output ❌
├─ Database dumps ❌
├─ Old archives ❌
└─ Personal settings ❌
```

### The Rules

1. **Source code always → Git** (needed for deployment)
2. **Strategic docs → Git** (communication & user adoption)
3. **Development notes → Offline** (clutter history, internal only)
4. **Logs → Never Git** (machine-specific, sensitive)
5. **Secrets → Never Git** (security risk)
6. **Tests → Offline** (regenerate from source)
7. **Data exports → Offline** (use source instead)

### When in Doubt

```
Ask: "Would a colleague downloading this repository
      need this file to understand/use/deploy the project?"

YES  → Upload to Git ✅
NO   → Keep offline ❌
```

---

**Last Updated**: April 18, 2026  
**Maintained By**: Single developer (you)  
**Review Frequency**: As needed when structure changes
