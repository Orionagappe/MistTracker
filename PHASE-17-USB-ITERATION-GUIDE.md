# Phase 17 USB Iteration Workflow
## Quick Reference

### Overview
- **Local Development**: Edit code on Windows
- **USB Transport**: Copy code to USB
- **Remote Execution**: Run validator on Devuan test server (10.144.113.100)
- **Result Collection**: USB brings results back to Windows
- **Analysis**: Review and decide next domain expansion

---

## Iteration Cycle

### Step 1: Prepare USB (Windows)
```powershell
cd "j:\Portfolio Site\Gdocsdev\MistTracker"

# First iteration (auto-generates timestamp)
.\phase-17-usb-prepare.ps1 -USBDrive D:

# Subsequent iterations (custom label)
.\phase-17-usb-prepare.ps1 -USBDrive D: -IterationLabel iter-atoms-v1
```

**What it does:**
- Creates iteration directory on USB: `D:\phase17-iter\iter-[label]`
- Copies Phase 17 core files
- Copies phase-17-data directory
- Creates MANIFEST.json

---

### Step 2: Deploy & Run (Devuan)
```bash
# On Devuan Excaliber (after inserting USB)

# Mount USB if not auto-mounted
sudo mount /mnt/usb

# Find your iteration
ls /mnt/usb/phase17-iter/

# Run validator (replace with your iteration label)
bash /mnt/usb/phase17-iter/iter-atoms-v1/run-validator.sh
```

**What it does:**
- Runs hardware fitness validator
- Runs Phase 17 network predictor
- Captures all output to execution.log
- Writes predictions.json and hardware-fitness-report.json
- Creates RESULTS-MANIFEST.json
- **Results stay on USB** (not Devuan storage)

---

### Step 3: Analyze Results (Windows)
```powershell
# After removing USB from Devuan and reinserting into Windows

.\phase-17-usb-analyze.ps1 -USBDrive D: -IterationLabel iter-atoms-v1
```

**What it does:**
- Copies results from USB to local temp: `%TEMP%\phase17-analysis\iter-atoms-v1`
- Parses execution manifest
- Analyzes execution log
- Generates ANALYSIS-REPORT.md
- Opens results in explorer/notepad

---

## Key Directory Structure

```
D:\phase17-iter\
├── iter-atoms-v1/
│   ├── MANIFEST.json
│   ├── phase-17-5-beta-network-predictor.js
│   ├── phase-17-5-beta-extended-aggregator.js
│   ├── hardware-fitness-validator.js
│   ├── SymbolicExpression.js
│   ├── predictionEngine.js
│   ├── data/
│   │   └── [phase-17 data files]
│   └── results/              ← Created by Devuan validator
│       ├── RESULTS-MANIFEST.json
│       ├── execution.log
│       ├── predictions.json
│       └── hardware-fitness-report.json
│
└── iter-atoms-v2/
    └── [next iteration...]
```

---

## Decision Points

After each iteration, analyze results and decide:

1. **Same Domain Expansion**
   - If atom validation shows clear emergence patterns
   - Refine parameters and re-run

2. **Next Domain**
   - If predictions indicate readiness
   - Update code → prepare new USB iteration for molecules

3. **Architecture Fix**
   - If predictions break down or diverge
   - Fix locally, new iteration

---

## Tips

- **Label iterations clearly**: Use domain name + version
  - Good: `iter-atoms-v1`, `iter-atoms-v2`, `iter-molecules-v1`
  - Bad: `iter-1`, `test`, `new`

- **Keep USB results**: Don't delete results from USB
  - Useful for comparing iterations
  - Reference for pattern analysis

- **Local analysis copies**: Results auto-copied to `%TEMP%\phase17-analysis`
  - Accessible between USB sessions
  - Safe to remove (re-copies on next analysis)

- **Devuan-side execution log**: Shows everything
  - Check `results/execution.log` for Node errors
  - Predictions written to `results/predictions.json`
  - Hardware metrics in `results/hardware-fitness-report.json`

---

## Troubleshooting

**"USB drive not found"**
- Verify USB is inserted
- Check drive letter (default D:)
- Pass correct `-USBDrive` parameter

**"Results directory not found"**
- Confirm validator completed on Devuan
- Check `results/` directory was created
- Verify USB was mounted on Devuan

**"Validator exited with code X"**
- Check `%TEMP%\phase17-analysis\[iteration]\execution.log`
- Common issues: Node memory, missing files, permission errors

**Missing predictions.json**
- Hardware validator may have failed
- Network predictor may have timing issue
- Check execution.log for specific errors

---

## Next Iteration Template

1. Analyze previous iteration results
2. Identify next domain or refinement
3. Edit code: `phase-17-5-beta-*.js` files
4. Prepare USB: `phase-17-usb-prepare.ps1 -IterationLabel iter-[domain]-v[N]`
5. Run on Devuan
6. Analyze results
7. Loop →

---

**Vision**: Let predictions guide domain expansion. Architecture handles unknown domains. Iterate fast, analyze patterns.
