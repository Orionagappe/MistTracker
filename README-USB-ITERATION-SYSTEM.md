# Phase 17 USB Iteration System
## Complete Windows Infrastructure

This system enables iterative validation of Phase 17 on a Devuan test server without direct development environment access. Code and data are transported via USB, results returned for analysis.

---

## Quick Start (5 Minutes)

### First Time Setup
1. **Insert USB drive** (formatted FAT32/NTFS, at least 2GB free)
2. **Open PowerShell** in this folder
3. **Run the menu system:**
   ```powershell
   PowerShell -ExecutionPolicy Bypass -File phase-17-usb.ps1
   ```
4. Select option 1 to prepare your first iteration

### Regular Workflow
```powershell
# Every iteration:
.\phase-17-usb.ps1          # Menu system
→ 1. Prepare USB            # Copy code to USB
→ [Insert USB into Devuan, run validator]
→ 2. Analyze Results        # Review predictions
```

---

## What You Need

### Windows Machine (Local Development)
- PowerShell 5.0+
- USB drive (2GB minimum)
- Git (to edit code locally)
- This script infrastructure

### Devuan Machine (Test Server - 10.144.113.100)
- Node.js 16+ with npm
- USB port for iteration transport
- Copy of `run-validator.sh` on USB (auto-created)

---

## System Components

### Windows Scripts

| Script | Purpose |
|--------|---------|
| **phase-17-usb.ps1** | Main menu - start here |
| **phase-17-usb-prepare.ps1** | Create iteration package on USB |
| **phase-17-usb-analyze.ps1** | Analyze results from USB |
| **PHASE-17-USB-ITERATION-GUIDE.md** | Detailed workflow docs |

### USB Package Structure
```
D:\phase17-iter\
├── iter-atoms-v1/
│   ├── MANIFEST.json
│   ├── phase-17-5-beta-*.js     ← Your code
│   ├── data/                     ← Phase 17 data
│   ├── run-validator.sh          ← Run on Devuan
│   └── results/                  ← Created by validator
│       ├── RESULTS-MANIFEST.json
│       ├── execution.log
│       ├── predictions.json
│       └── hardware-fitness-report.json
└── iter-atoms-v2/               ← Next iteration
    └── [...]
```

---

## Iteration Workflow

### Step 1: Prepare USB (Windows)
```powershell
.\phase-17-usb.ps1
→ Option 1: Prepare USB
→ Enter USB drive: D
→ Enter label: iter-atoms-v1
✓ Creates D:\phase17-iter\iter-atoms-v1\
```

**Auto-generated files:**
- `MANIFEST.json` - Iteration metadata
- `run-validator.sh` - Run on Devuan
- `phase-17-5-beta-*.js` - Your current code
- `data/` - Phase 17 training data

---

### Step 2: Deploy & Run (Devuan)
```bash
# On Devuan Excaliber (SSH or direct console)

# Mount USB (if not auto-mounted)
sudo mount /mnt/usb

# Navigate to iteration
cd /mnt/usb/phase17-iter/iter-atoms-v1

# Run validator
bash run-validator.sh
```

**What it does:**
- Compiles Phase 17 network predictor
- Runs hardware fitness validator
- Generates predictions on test data
- Creates results on USB (no server storage)
- Takes ~5-15 minutes

---

### Step 3: Analyze Results (Windows)
```powershell
# After removing USB from Devuan, insert into Windows

.\phase-17-usb.ps1
→ Option 2: Analyze Results
→ Enter label: iter-atoms-v1
✓ Copies results to local analysis folder
✓ Generates report
✓ Opens in explorer
```

**Outputs:**
- `ANALYSIS-REPORT.md` - Iteration summary
- `execution.log` - Full validator output
- `predictions.json` - Network predictions
- `hardware-fitness-report.json` - Hardware metrics

---

## Making Changes Between Iterations

### Edit Code Locally
```
j:\Portfolio Site\Gdocsdev\MistTracker\
├── phase-17-5-beta-network-predictor.js
├── phase-17-5-beta-extended-aggregator.js
├── hardware-fitness-validator.js
├── predictionEngine.js
└── SymbolicExpression.js
```

After editing, just prepare a new USB iteration - your changes auto-include.

### Update Phase 17 Data
```
j:\Portfolio Site\Gdocsdev\MistTracker\phase-17-data\
├── atomic-structure-metadata.json
├── expansion-emergence-data.json
├── hardware-patterns.json
├── [more data files]
```

Data auto-includes in every USB iteration.

---

## Decision Points After Each Iteration

### If Predictions Are Strong
→ **Expand to next domain** (atoms → molecules)
- Update code with new domain logic
- Prepare new USB iteration

### If Patterns Unclear
→ **Refine current domain**
- Adjust parameters
- Re-run validation
- New USB iteration

### If Validator Fails
→ **Fix architecture**
- Check `execution.log` for errors
- Fix locally
- Prepare new USB iteration with fixes

---

## Common Workflows

### Debugging Validator Output
```powershell
# After analyzing results
.\phase-17-usb.ps1
→ Option 2: Analyze Results
→ View the opened ANALYSIS-REPORT.md
→ Detailed log in execution.log
```

### Comparing Iterations
```powershell
# Results auto-saved locally:
# %TEMP%\phase17-analysis\iter-atoms-v1\
# %TEMP%\phase17-analysis\iter-atoms-v2\

# Easy to compare predictions.json across iterations
Compare-Object (gc iter-atoms-v1/predictions.json | ConvertFrom-Json) `
              (gc iter-atoms-v2/predictions.json | ConvertFrom-Json)
```

### Creating Iteration Series
```powershell
# Iteration naming convention:
# iter-[domain]-v[number]
# Example series:

iter-atoms-v1      ← Initial atoms validation
iter-atoms-v2      ← Refined parameters
iter-atoms-v3      ← Fixed emergence detection

iter-molecules-v1  ← New domain
iter-molecules-v2  ← Refinement
```

---

## Troubleshooting

### "USB drive not found"
- Verify USB inserted
- Check correct drive letter
- Try: `Get-Volume | Select-Object DriveLetter, FileSystemLabel`

### "Validator exited with code X"
- Check `execution.log` in results
- Common: Node memory limits, missing dependencies
- Fix code locally, prepare new USB iteration

### "results/ directory not found"
- Validator may have crashed
- Check if USB was mounted on Devuan
- Review Devuan console output

### "Missing predictions.json"
- Hardware validator may have failed
- Network predictor may not have run
- Check `execution.log` for Node errors

### "Can't read USB on Windows after Devuan"
- Linux may have changed permissions
- Try: Safely eject USB on Devuan first
- Insert into Windows again
- If still issues, copy files to new USB

---

## Performance Tips

- **Iterations:** 1-2 per hour (Devuan runtime ~10-15 min)
- **USB Speed:** Use USB 3.0+ for faster transfers
- **Parallel Analysis:** Analyze one iteration while Devuan runs next
- **Storage:** USB results safe to delete after local analysis copied

---

## Next Steps

1. **Insert USB drive**
2. **Run:** `PowerShell -ExecutionPolicy Bypass -File phase-17-usb.ps1`
3. **Select:** Option 1 - Prepare USB
4. **Choose label:** `iter-atoms-v1`
5. **Take USB to Devuan** and run `bash run-validator.sh`
6. **Bring USB back**, run: Option 2 - Analyze Results
7. **Review predictions** and decide next iteration

---

## Contact/Documentation

- **Main Guide:** [PHASE-17-USB-ITERATION-GUIDE.md](PHASE-17-USB-ITERATION-GUIDE.md)
- **Code Repo:** Phase 17 files in current directory
- **Data Repo:** `phase-17-data/` subdirectory
- **Test Server:** 10.144.113.100 (Devuan Excaliber)

---

**Vision:** Enable rapid Phase 17 validation cycles through physical transport, maintaining clean architecture and enabling domain expansion driven by prediction patterns.
