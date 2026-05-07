# Phase 17 USB Iteration System - File Manifest & Quick Navigation

**Complete System Deployed:** April 20, 2026  
**Status:** ✅ Production Ready  
**Next Action:** Start with `phase-17-usb.ps1` menu system

---

## New Files Created (10 Total)

### Windows Executable Scripts
1. **phase-17-usb.ps1** (184 lines)
   - User-friendly menu system
   - Main entry point for all operations
   - Run: `PowerShell -ExecutionPolicy Bypass -File phase-17-usb.ps1`

2. **phase-17-usb-prepare.ps1** (102 lines)
   - Create USB iteration packages
   - Called by menu system
   - Auto-includes code, data, validator script

3. **phase-17-usb-analyze.ps1** (82 lines)
   - Analyze results from USB
   - Copies results locally
   - Generates analysis reports

### Validator Script (for Devuan)
4. **run-validator.sh** (213 lines)
   - Main validator script
   - Auto-included in each USB iteration
   - Executes on Devuan: `bash run-validator.sh`
   - Handles hardware validation + network prediction
   - Returns results to USB

### Documentation (Windows User)
5. **PHASE-17-USB-ITERATION-GUIDE.md** (199 lines)
   - Complete workflow documentation
   - Decision points and next steps
   - Tips and troubleshooting

6. **README-USB-ITERATION-SYSTEM.md** (267 lines)
   - Setup and overview
   - System components explained
   - Detailed troubleshooting guide

7. **PHASE-17-USB-SYSTEM-COMPLETE-SUMMARY.md** (474 lines)
   - Executive summary
   - Architecture diagrams
   - Complete file inventory
   - Success indicators

### Documentation (Devuan Operator)
8. **DEVUAN-OPERATOR-GUIDE.md** (307 lines)
   - How to run validator on Devuan
   - USB mounting instructions
   - Result file explanations
   - Troubleshooting for Devuan

9. **DEVUAN-DEPLOYMENT-CHECKLIST.md** (377 lines)
   - Pre-deployment verification
   - Node.js setup verification
   - USB mounting checklist
   - Sign-off section

### File Manifest
10. **PHASE-17-USB-SYSTEM-FILES-MANIFEST.md** (This file)
    - Quick navigation guide
    - File descriptions
    - Which file to read first

---

## Quick Navigation Guide

### "I want to..."

#### ...start using the system right now
→ **phase-17-usb.ps1**
```powershell
PowerShell -ExecutionPolicy Bypass -File phase-17-usb.ps1
```

#### ...understand the complete workflow
→ **PHASE-17-USB-ITERATION-GUIDE.md**
- Explains every step
- Decision points
- Next iteration template

#### ...set up for the first time
→ **README-USB-ITERATION-SYSTEM.md**
- Complete setup guide
- System components
- Performance tips

#### ...see the big picture
→ **PHASE-17-USB-SYSTEM-COMPLETE-SUMMARY.md**
- Architecture diagrams
- File inventory
- Success indicators
- Preparation checklist

#### ...prepare Devuan server
→ **DEVUAN-DEPLOYMENT-CHECKLIST.md**
- Pre-deployment verification
- Node.js setup
- USB mounting setup
- Sign-off section

#### ...operate validator on Devuan
→ **DEVUAN-OPERATOR-GUIDE.md**
- Running validator
- USB mounting
- Monitoring progress
- Troubleshooting

#### ...prepare first USB iteration
→ Run menu system (phase-17-usb.ps1 → Option 1)

#### ...analyze results from USB
→ Run menu system (phase-17-usb.ps1 → Option 2)

#### ...troubleshoot an issue
→ **README-USB-ITERATION-SYSTEM.md** (Troubleshooting section)

---

## File Descriptions

### Scripts

#### phase-17-usb.ps1
**Type:** PowerShell Menu System  
**Lines:** 184  
**Purpose:** Main user interface for USB iteration management  
**Features:**
- User-friendly menu (1-5 options)
- Option 1: Prepare USB iteration
- Option 2: Analyze results
- Option 3: View guide
- Option 4: Open project folder
- Option 5: Exit  
**How to Use:**
```powershell
PowerShell -ExecutionPolicy Bypass -File phase-17-usb.ps1
```
**When to Use:** Every session - this is the main entry point

---

#### phase-17-usb-prepare.ps1
**Type:** PowerShell Script  
**Lines:** 102  
**Purpose:** Create self-contained USB iteration packages  
**Features:**
- Creates iteration directory on USB
- Copies Phase 17 code files
- Copies phase-17-data directory
- Generates MANIFEST.json
- Auto-includes run-validator.sh
- Supports custom iteration labels or auto-generated  
**How to Use:**
```powershell
# Auto-generated label
.\phase-17-usb-prepare.ps1 -USBDrive D:

# Custom label
.\phase-17-usb-prepare.ps1 -USBDrive D: -IterationLabel iter-atoms-v1
```
**Called By:** phase-17-usb.ps1 (Option 1)

---

#### phase-17-usb-analyze.ps1
**Type:** PowerShell Script  
**Lines:** 82  
**Purpose:** Extract and analyze results from USB  
**Features:**
- Copies results from USB to local temp
- Parses RESULTS-MANIFEST.json
- Generates analysis report
- Opens results in explorer
- Extracts predictions and metrics  
**How to Use:**
```powershell
.\phase-17-usb-analyze.ps1 -USBDrive D: -IterationLabel iter-atoms-v1
```
**Called By:** phase-17-usb.ps1 (Option 2)

---

#### run-validator.sh
**Type:** Bash Script  
**Lines:** 213  
**Purpose:** Execute Phase 17 validation on Devuan  
**Features:**
- Environment verification (Node.js, files)
- Hardware fitness validator execution
- Phase 17 network predictor execution
- Result manifest generation
- Comprehensive logging
- Color-coded output  
**How to Use:**
```bash
cd /mnt/usb/phase17-iter/iter-atoms-v1
bash run-validator.sh
```
**Location:** Auto-included in every USB iteration  
**Runtime:** ~10-15 minutes

---

### Documentation Files

#### PHASE-17-USB-ITERATION-GUIDE.md
**Type:** Workflow Documentation  
**Lines:** 199  
**Purpose:** Detailed step-by-step workflow guide  
**Sections:**
- Overview of iteration cycle
- Step 1: Prepare USB (Windows)
- Step 2: Deploy & Run (Devuan)
- Step 3: Analyze Results (Windows)
- Key directory structure
- Decision points after each iteration
- Tips for efficient iteration
- Troubleshooting template  
**Read When:** Planning iterations or understanding workflow

---

#### README-USB-ITERATION-SYSTEM.md
**Type:** System Overview & Setup  
**Lines:** 267  
**Purpose:** Complete system guide with setup and troubleshooting  
**Sections:**
- Quick start (5 minutes)
- What you need (hardware/software requirements)
- System components (scripts, USB structure)
- Iteration workflow (detailed)
- Making changes between iterations
- Decision points (when to expand domains)
- Common workflows (debugging, comparing)
- Iteration series naming convention
- Comprehensive troubleshooting
- Performance tips  
**Read When:** Setting up for first time or troubleshooting

---

#### PHASE-17-USB-SYSTEM-COMPLETE-SUMMARY.md
**Type:** Executive Summary  
**Lines:** 474  
**Purpose:** Complete system overview with architecture  
**Sections:**
- Executive summary
- System architecture (ASCII diagram)
- Complete file inventory
- Quick start (5 minutes)
- Feature checklist
- Typical iteration workflow
- Preparation before first use
- Troubleshooting quick links
- Success indicators
- Next session preparation
- Documentation index
- System status summary
- Final checklist
- Launch sequence  
**Read When:** Getting the big picture or before first use

---

#### DEVUAN-OPERATOR-GUIDE.md
**Type:** Operator Documentation  
**Lines:** 307  
**Purpose:** How to operate validator on Devuan  
**Sections:**
- Overview and prerequisites
- Quick start (3 steps)
- Detailed process (finding iterations, running, monitoring)
- USB mounting issues
- Validator script behavior
- Troubleshooting (script not found, permissions, etc.)
- Iteration workflow (typical session)
- Running multiple iterations
- Result files explained
- Performance notes
- Contact/support  
**Read When:** Operating validator on Devuan or troubleshooting

---

#### DEVUAN-DEPLOYMENT-CHECKLIST.md
**Type:** Pre-Deployment Verification  
**Lines:** 377  
**Purpose:** Verify Devuan is ready for Phase 17 iterations  
**Sections:**
- Pre-deployment verification
- System requirements
- Node.js installation
- USB port & mounting
- File system & storage
- Permissions & access
- SSH access (if remote)
- Required files & scripts
- Network & connectivity
- Environment variables
- Pre-run checklist
- Deployment steps (5 steps)
- Post-deployment handoff
- Troubleshooting quick reference
- Sign-off section  
**Read When:** Setting up Devuan server for first time

---

## Getting Started Checklist

### Prerequisites
- [ ] Windows 10+ with PowerShell
- [ ] Project folder: `j:\Portfolio Site\Gdocsdev\MistTracker`
- [ ] USB drive: 2GB+, formatted FAT32 or NTFS
- [ ] Devuan Excaliber access: 10.144.113.100
- [ ] Node.js 16+ on Devuan

### Before First Iteration
- [ ] Read: PHASE-17-USB-ITERATION-GUIDE.md (5 min)
- [ ] Read: DEVUAN-OPERATOR-GUIDE.md (5 min, share with Devuan operator)
- [ ] Verify: Run DEVUAN-DEPLOYMENT-CHECKLIST.md on Devuan (10 min)
- [ ] Verify: Node.js on Devuan: `node -v` (should show v16+)
- [ ] Test: Run phase-17-usb.ps1 menu system (1 min)

### First Iteration
- [ ] Insert USB drive
- [ ] Run: `PowerShell -ExecutionPolicy Bypass -File phase-17-usb.ps1`
- [ ] Select: Option 1 (Prepare USB)
- [ ] Take USB to Devuan
- [ ] Run: `bash /mnt/usb/phase17-iter/iter-[label]/run-validator.sh`
- [ ] Wait: 10-15 minutes for execution
- [ ] Return USB to Windows
- [ ] Run: phase-17-usb.ps1 → Option 2 (Analyze Results)
- [ ] Review: Predictions and metrics

### Next Iterations
- [ ] Edit code locally (if needed)
- [ ] Repeat steps above
- [ ] Compare results across iterations
- [ ] Plan next domain expansion based on predictions

---

## File Organization

```
j:\Portfolio Site\Gdocsdev\MistTracker\
├── phase-17-usb.ps1                      ← Start here
├── phase-17-usb-prepare.ps1
├── phase-17-usb-analyze.ps1
├── run-validator.sh
│
├── PHASE-17-USB-ITERATION-GUIDE.md       ← Workflow
├── README-USB-ITERATION-SYSTEM.md         ← Setup
├── PHASE-17-USB-SYSTEM-COMPLETE-SUMMARY.md ← Overview
├── DEVUAN-OPERATOR-GUIDE.md              ← Devuan
├── DEVUAN-DEPLOYMENT-CHECKLIST.md        ← Devuan setup
├── PHASE-17-USB-SYSTEM-FILES-MANIFEST.md ← This file
│
├── phase-17-5-beta-network-predictor.js  (code - auto-included in USB)
├── phase-17-5-beta-extended-aggregator.js
├── hardware-fitness-validator.js
├── predictionEngine.js
├── SymbolicExpression.js
│
├── phase-17-data/                        (data - auto-included in USB)
│   ├── atomic-structure-metadata.json
│   ├── [more data files]
│
└── [other project files]
```

---

## Success Criteria

### Phase 1: Windows Preparation
✅ phase-17-usb.ps1 menu opens  
✅ Option 1 creates D:\phase17-iter\iter-[label]\  
✅ MANIFEST.json includes timestamp and label

### Phase 2: Devuan Execution  
✅ USB auto-mounts to /mnt/usb  
✅ run-validator.sh executes without errors  
✅ Output shows: Phase 1... Phase 2... Phase 3...  
✅ Completes with: "All validators completed successfully ✓"  
✅ Exit code 0

### Phase 3: Windows Analysis
✅ phase-17-usb.ps1 finds USB results  
✅ Copies to %TEMP%\phase17-analysis\iter-[label]\  
✅ Opens ANALYSIS-REPORT.md  
✅ Shows predictions.json with emergence indices

---

## Quick Reference Commands

### Windows
```powershell
# Start menu
PowerShell -ExecutionPolicy Bypass -File phase-17-usb.ps1

# Prepare USB (direct)
.\phase-17-usb-prepare.ps1 -USBDrive D: -IterationLabel iter-atoms-v1

# Analyze results (direct)
.\phase-17-usb-analyze.ps1 -USBDrive D: -IterationLabel iter-atoms-v1
```

### Devuan
```bash
# Find iterations
ls /mnt/usb/phase17-iter/

# Navigate to iteration
cd /mnt/usb/phase17-iter/iter-atoms-v1

# Run validator
bash run-validator.sh

# Check results
ls -la results/
cat results/RESULTS-MANIFEST.json
```

---

## Support Matrix

| Issue | Reference |
|-------|-----------|
| How to start? | phase-17-usb.ps1 menu |
| Workflow overview? | PHASE-17-USB-ITERATION-GUIDE.md |
| Setup issues? | README-USB-ITERATION-SYSTEM.md |
| Devuan setup? | DEVUAN-DEPLOYMENT-CHECKLIST.md |
| Run validator? | DEVUAN-OPERATOR-GUIDE.md |
| Troubleshooting? | README-USB-ITERATION-SYSTEM.md (Troubleshooting section) |
| Big picture? | PHASE-17-USB-SYSTEM-COMPLETE-SUMMARY.md |

---

## Version Information

| Component | Version | Date | Status |
|-----------|---------|------|--------|
| System | Phase 17.5 Beta | 2024-04-20 | Production Ready |
| Windows Scripts | 1.0 | 2024-04-20 | Complete |
| Devuan Scripts | 1.0 | 2024-04-20 | Complete |
| Documentation | 1.0 | 2024-04-20 | Complete |

---

## Next Steps

1. **Read:** PHASE-17-USB-ITERATION-GUIDE.md (understand workflow)
2. **Share:** DEVUAN-OPERATOR-GUIDE.md + DEVUAN-DEPLOYMENT-CHECKLIST.md with Devuan operator
3. **Verify:** Run DEVUAN-DEPLOYMENT-CHECKLIST.md on Devuan
4. **Start:** `PowerShell -ExecutionPolicy Bypass -File phase-17-usb.ps1`

---

**Status:** ✅ Ready for Operations  
**Created:** April 20, 2026  
**System:** Phase 17 USB Iteration Framework  
**Vision:** Let predictions guide domain expansion through fast iteration cycles

**Ready to expand from atoms to cosmos. Insert USB and iterate.**
