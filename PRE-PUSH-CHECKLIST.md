# Pre-Push Checklist
## Quick Reference for Safe Git Commits

**Use this before every `git push`**

---

## 5-MINUTE VERIFICATION

### ✅ Step 1: See Your Changes (30 seconds)

```bash
$ git status
```

**Check**:
- Any `.env` files? ❌ **STOP - remove before commit**
- Any `*.log` files? ❌ **STOP - remove before commit**  
- Any `*.pem` or `*.key` files? ❌ **STOP - remove before commit**
- Any `node_modules/` changes? ❌ **STOP - shouldn't have modified**

### ✅ Step 2: Review Staged Changes (1 minute)

```bash
$ git diff --cached | head -100
```

**Check**:
- Does it look like code changes?
- Any suspicious file paths?
- Any accidental large files (>5 MB)?

### ✅ Step 3: Verify What Files Are Included (30 seconds)

```bash
$ git diff --cached --name-only
```

**For each file, ask**:
- Is this a `.md` file? Should it be uploaded?
  - Strategic docs → YES (COMPLETE-STRATEGIC-VISION.md, PHYSICS-USER-GUIDE.md)
  - Phase notes → NO (PHASE-14-*.md, SESSION-SUMMARY-*.md)
- Is this code? → YES, should be uploaded
- Is this a test? → NO, should NOT be uploaded
- Is this a log or output? → NO, should NOT be uploaded

### ✅ Step 4: Quick Secrets Check (30 seconds)

```bash
$ git diff --cached | grep -i "password\|secret\|api.key\|token\|aws_\|db_password"
```

**If ANY matches**: ❌ **STOP**
```bash
$ git reset                    # Unstage everything
# Fix the file or .gitignore
# Then recommit without secrets
```

### ✅ Step 5: Double-Check Log Files (30 seconds)

```bash
$ git diff --cached --name-only | grep -E "\.log|\.txt|err|out"
```

**If ANY matches**: ❌ **STOP - remove these files**

---

## ONE-LINER VERIFICATION

```bash
# All-in-one check
$ git diff --cached | (grep -i "password\|secret\|key\|\.pem\|\.env" && echo "❌ BLOCKED: Secrets detected" && exit 1) || echo "✅ No secrets found" && git diff --cached --name-only | grep -E "\.log|err\.txt" && echo "❌ BLOCKED: Logs detected" && exit 1 || echo "✅ OK to push"
```

---

## FILE TYPE QUICK REFERENCE

| Extension | Should Upload? | Example | Action |
|-----------|----------------|---------|--------|
| `.js` | YES | MistCore.js | Commit |
| `.md` | MAYBE | SOLUTION-MANUAL.md (YES) vs PHASE-14-*.md (NO) | Check type |
| `.json` | YES | package.json | Commit |
| `.sql` | MAYBE | database-schema.sql (YES) vs backup.sql (NO) | Check if schema |
| `.log` | NO | *.log | ❌ Remove |
| `.env` | NO | .env | ❌ Never |
| `.pem` | NO | *.pem | ❌ Never |
| `.txt` | MAYBE | err.txt (NO) vs docs.txt (YES) | Check content |
| `.csv` | MAYBE | data.csv (NO) vs template.csv (YES) | Check if data |

---

## COMMON MISTAKES TO AVOID

### ❌ Mistake 1: Committing Phase Progress Notes

```bash
# BAD: These files
$ git add PHASE-14-COMPLETION-SUMMARY.md
$ git add SESSION-SUMMARY-*.md
$ git add SPRINT*-*.md

# GOOD: Only strategic docs
$ git add COMPLETE-STRATEGIC-VISION.md
$ git add ATOMIC-PHYSICS-DOMAIN-ALIGNMENT.md
$ git add INFRASTRUCTURE-QUICKSTART-ORCHESTRATION.md
```

### ❌ Mistake 2: Committing Logs

```bash
# BAD
$ git add *.log
$ git add err.txt out.txt
$ git add server-err.txt

# GOOD
$ git add -A        # Then verify with git status
$ git reset *.log err.txt out.txt
```

### ❌ Mistake 3: Committing Test Files

```bash
# BAD
$ git add test-*.js
$ git add verify-*.js

# GOOD
# These stay local
```

### ❌ Mistake 4: Committing .env or Secrets

```bash
# BAD
$ git add .env
$ git add *.pem *.key
$ git add MySQL.session.sql

# These should NEVER be added
# They're already in .gitignore
```

---

## IF YOU MAKE A MISTAKE

### Undo Before Pushing (Easy)

```bash
# You committed something you shouldn't have
$ git log --oneline -3    # See recent commits

$ git reset --soft HEAD~1 # Undo last commit, keep changes
$ git reset HEAD <file>   # Unstage the file
$ git checkout -- <file>  # Throw away the file

$ git status              # Verify clean
$ git commit -m "..."     # Recommit without the file
```

### Undo After Pushing (Harder, Requires Force Push)

```bash
# You already pushed the bad commit

# Option 1: Revert it
$ git revert HEAD         # Creates new commit undoing changes
$ git push

# Option 2: Rewrite history (ONLY if no one else is pulling)
$ git reset --hard HEAD~1
$ git push -f origin main # Force push

# Option 3: If secrets were exposed
1. ROTATE SECRETS IMMEDIATELY
2. Run: git filter-branch --tree-filter 'rm -f <file>' HEAD
3. Force push
4. Notify team
```

---

## CLEAN SLATE

### If Everything Is Messy

```bash
# See what would be deleted
$ git clean -fdx -n

# Remove everything not in git
$ git clean -fdx

# This removes:
# - node_modules/
# - *.log
# - .env files
# - test outputs
# - anything in .gitignore
```

---

## BEFORE PUSHING: THE CHECKLIST

```
□ Run: git status
  □ No .env, *.log, *.pem, *.key files listed
  
□ Run: git diff --cached --name-only
  □ Review each file
  □ Strategic docs only (not PHASE-*, SESSION-*)
  □ Core code files (Mist*.js, server/*, client/*)
  □ No test files (test*.js)
  □ No logs (*.log, err.txt)
  
□ Run: git diff --cached | head -100
  □ Code looks reasonable
  □ No accidental deletions
  □ No massive line changes
  
□ Run: git diff --cached | grep -i "password\|secret\|key"
  □ No results (if any results: ❌ STOP)
  
□ Ask yourself:
  □ Would a teammate need these files to run the project?
  □ Is this production code or documentation?
  □ Am I accidentally including debug artifacts?
  
□ Final check before push:
  $ git log --oneline origin/main..HEAD
  □ Does the commit message make sense?
  □ Is the scope reasonable (not 500 files)?
  
□ If all checks pass:
  $ git push
  ✅ Done!
```

---

## REFERENCE: WHICH FILES TO ALWAYS UPLOAD

```
Mist*.js                          ✅ UPLOAD
Physics*.js                       ✅ UPLOAD
Phase10*.js                       ✅ UPLOAD
server/                           ✅ UPLOAD
client/                           ✅ UPLOAD
package.json                      ✅ UPLOAD
database-schema.sql               ✅ UPLOAD
.gitignore                        ✅ UPLOAD
README.md                         ✅ UPLOAD
LICENSE                           ✅ UPLOAD

SOLUTION-MANUAL.md                ✅ UPLOAD
PHYSICS-USER-GUIDE.md             ✅ UPLOAD
PHYSICS-API-REFERENCE.md          ✅ UPLOAD
USER-CREATION.md                  ✅ UPLOAD
INTEGRATION_GUIDE.md              ✅ UPLOAD
COMPLETE-STRATEGIC-VISION.md      ✅ UPLOAD
ARCHITECTURE-TIMELINE-VISUALIZATION.md     ✅ UPLOAD
ATOMIC-PHYSICS-DOMAIN-ALIGNMENT.md         ✅ UPLOAD
DOMAIN-PROGRESSION-ROADMAP.md              ✅ UPLOAD
MULTI-DOMAIN-RESEARCH-ARCHITECTURE.md      ✅ UPLOAD
INFRASTRUCTURE-QUICKSTART-ORCHESTRATION.md ✅ UPLOAD
PHASE-17-*.md                     ✅ UPLOAD (Phase 17 strategy docs)
```

---

## REFERENCE: WHICH FILES TO ALWAYS EXCLUDE

```
PHASE-*-COMPLETION*.md            ❌ EXCLUDE (Dev notes)
PHASE-*-QUICK*.md                 ❌ EXCLUDE (Dev reference)
SESSION-SUMMARY-*.md              ❌ EXCLUDE (Work notes)
SPRINT*.md                        ❌ EXCLUDE (Sprint tracking)
test-*.js                         ❌ EXCLUDE (Tests)
verify-*.js                       ❌ EXCLUDE (Verification)
*.log                             ❌ EXCLUDE (Logs)
err.txt, out.txt                  ❌ EXCLUDE (Output)
.env                              ❌ EXCLUDE (Secrets)
*.pem, *.key                      ❌ EXCLUDE (Keys)
GPG/                              ❌ EXCLUDE (Personal keys)
node_modules/                     ❌ EXCLUDE (Generated)
*.7z, *.zip                       ❌ EXCLUDE (Archives)
Reference/                        ❌ EXCLUDE (Old docs)
Documentation Archive/            ❌ EXCLUDE (Archives)
```

---

## QUICK COMMAND REFERENCE

```bash
# See what you're about to commit
git diff --cached --name-only

# See changes to each file
git diff --cached

# See changes to one file
git diff --cached -- <filename>

# Unstage a file
git reset HEAD <filename>

# Unstage everything
git reset HEAD

# Throw away changes to a file
git checkout -- <filename>

# Undo the last commit (keep changes)
git reset --soft HEAD~1

# Undo and see what went wrong
git show HEAD

# Push to remote
git push

# Push after fixing (force only if needed & safe)
git push -f origin main
```

---

**Remember**: It takes 5 minutes to verify before pushing. It takes 30 minutes to fix a bad push.

✅ **Verify before every push!**
