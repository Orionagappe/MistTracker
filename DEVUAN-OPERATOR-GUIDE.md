# Phase 17 USB Iteration - Devuan Operator Guide
## Running Validator on Devuan Excaliber (10.144.113.100)

---

## Overview

This guide explains how to run Phase 17 validation iterations on the Devuan test server using USB transport. Each iteration is a self-contained package on USB with all code, data, and the validator script.

**Location:** Devuan Excaliber Test Server  
**Address:** 10.144.113.100  
**USB Port:** Available for iteration transport  

---

## Prerequisites

### On Devuan Server
- Node.js 16+ installed (`node -v`)
- USB port accessible
- USB mounting capability (usually automatic)
- ~500MB free space on USB for results

### From Windows
- Windows scripts prepare USB iterations (see [PHASE-17-USB-ITERATION-GUIDE.md](PHASE-17-USB-ITERATION-GUIDE.md))
- USB drive formatted FAT32/NTFS

---

## Quick Start (3 Steps)

### Step 1: Insert USB & Mount
```bash
# Usually auto-mounts, but if not:
sudo mount /dev/sdb1 /mnt/usb

# Verify USB is readable
ls /mnt/usb/phase17-iter/
```

### Step 2: Navigate to Iteration
```bash
# Find your iteration label (prepared by Windows)
cd /mnt/usb/phase17-iter/iter-atoms-v1

# Verify files are present
ls -la
```

### Step 3: Run Validator
```bash
# Execute the validator script
bash run-validator.sh

# That's it! Results saved to ./results/ on USB
```

---

## Detailed Process

### Finding Your Iteration

USB iterations are organized by label and date:

```bash
# List all iterations on USB
ls -la /mnt/usb/phase17-iter/

# Expected structure:
# iter-atoms-v1/
# iter-atoms-v2/
# iter-molecules-v1/
# [more iterations...]
```

### Verifying Iteration Contents

Before running, verify the package is complete:

```bash
cd /mnt/usb/phase17-iter/iter-atoms-v1

# Check manifest (metadata from Windows)
cat MANIFEST.json

# Check code files are present
ls -la *.js

# Check data is present
ls -la data/

# Verify validator script
test -f run-validator.sh && echo "✓ Validator script found" || echo "✗ Validator script missing"
```

### Running the Validator

The `run-validator.sh` script handles everything:

```bash
cd /mnt/usb/phase17-iter/iter-atoms-v1

# Run validator (takes ~10-15 minutes typically)
bash run-validator.sh
```

**What it does:**
1. Checks Node.js is available
2. Verifies all required files present
3. Runs `hardware-fitness-validator.js`
   - Tests hardware fitness metrics
   - Outputs `hardware-fitness-report.json`
4. Runs `phase-17-5-beta-network-predictor.js`
   - Generates predictions for test data
   - Outputs `predictions.json`
5. Creates `RESULTS-MANIFEST.json`
   - Exit codes for both validators
   - Timestamp and metadata
6. Saves all results to `./results/` on USB

### Monitoring Progress

Watch the live output as the validator runs:

```bash
# Output shows progress in real-time
# Each phase is clearly labeled:
# [2024-04-20 14:32:15] Starting Phase 17 USB Iteration Validator
# [2024-04-20 14:32:15] ════════════════════════════════════════════════════════
# [2024-04-20 14:32:15] Phase 1: Running Hardware Fitness Validator
# ...
```

### After Validation Completes

Results are automatically on USB:

```bash
# Check results directory
ls -la /mnt/usb/phase17-iter/iter-atoms-v1/results/

# Expected files:
# - RESULTS-MANIFEST.json     (exit codes, metadata)
# - hardware-fitness-report.json
# - predictions.json
# - execution.log
```

### Viewing Results (Before Removing USB)

You can preview results while USB is still mounted:

```bash
# View manifest
cat results/RESULTS-MANIFEST.json | jq .

# Check exit codes
cat results/RESULTS-MANIFEST.json | jq '.exit_codes'

# Preview predictions
head -50 results/predictions.json

# Check execution log
tail -50 results/execution.log
```

---

## USB Mounting Issues

### Auto-mount Not Working

```bash
# Manually mount (replace sdb1 with correct device)
sudo mount /dev/sdb1 /mnt/usb

# Find correct device if unsure
lsblk
sudo dmesg | tail -20
```

### Permissions Issues

```bash
# If you can't read USB files:
ls -la /mnt/usb/

# May need to remount as readable
sudo umount /mnt/usb
sudo mount -o uid=$(id -u),gid=$(id -g) /dev/sdb1 /mnt/usb
```

### USB Device Not Found

```bash
# List connected USB devices
lsblk
lsusb

# If nothing appears, USB may not be detected
# Try: Unplug USB, wait 5 seconds, replug
```

---

## Validator Script Behavior

### Successful Execution
```
✓ All validators complete
✓ Exit code 0
✓ Results saved to ./results/
✓ RESULTS-MANIFEST.json shows exit_codes: {validator: 0, predictor: 0}
```

### Partial Success
```
⊘ One validator had issues
⊘ Exit code 1
⊘ Results still generated
✓ Check execution.log for error details
✓ RESULTS-MANIFEST.json shows which validator failed
```

### Complete Failure
```
✗ Missing required files
✗ Node.js not available
✗ Results not generated
→ Check execution.log in results/
```

---

## Troubleshooting

### Script Not Found
```bash
# Error: "command not found: run-validator.sh"
# Solution: Use full path or cd to iteration directory

bash run-validator.sh              # ✓ Works
bash ./run-validator.sh            # ✓ Works
/mnt/usb/phase17-iter/iter-atoms-v1/run-validator.sh  # ✓ Works
```

### Permission Denied
```bash
# Error: "Permission denied"
# Solution: Make script executable

chmod +x run-validator.sh
bash run-validator.sh
```

### Node Module Errors
```bash
# Error: "Cannot find module 'X'"
# Solution: Check all files copied to USB correctly

cd /mnt/usb/phase17-iter/iter-atoms-v1
ls -la *.js                    # Verify all .js files present
ls -la data/                   # Verify data directory
```

### Out of Memory
```bash
# If validator crashes with memory error:
# Node.js may need more memory
# Solution: Set memory limit before running

NODE_OPTIONS="--max-old-space-size=2048" bash run-validator.sh
```

### Results Not Appearing
```bash
# If validator completes but no results/ directory:
# Check execution.log for errors
# Validator script may have failed at setup

# Check what happened:
ls -la                         # See if results/ created
tail -100 /tmp/validator.log   # Check temp logs
```

---

## Iteration Workflow

### Typical Session

```bash
# 1. USB inserted, auto-mounts
# 2. Navigate to iteration
cd /mnt/usb/phase17-iter/iter-atoms-v1

# 3. Optional: Review iteration metadata
cat MANIFEST.json

# 4. Run validator (takes 10-15 minutes)
bash run-validator.sh

# 5. Monitor output (watch progress)
# 6. Script completes, results saved
# 7. Remove USB from Devuan
# 8. Take USB back to Windows
# 9. Windows analyzes results

# To prepare for next iteration while USB was running:
# (Windows scripts auto-copy USB between iterations)
```

### Running Multiple Iterations in Sequence

```bash
# USB can hold multiple iterations
cd /mnt/usb/phase17-iter/

# List available iterations
ls -la

# Run first iteration
cd iter-atoms-v1
bash run-validator.sh

# Run second iteration (on same USB)
cd ../iter-atoms-v2
bash run-validator.sh

# Both save results to their respective directories
# No conflicts between iterations
```

---

## Performance Notes

### Expected Runtime
- Hardware validator: 3-7 minutes
- Network predictor: 5-10 minutes
- Total: ~10-15 minutes per iteration

### Hardware Requirements
- Node.js 16+: ~200-500MB memory
- CPU: Minimal processing needed
- Storage: ~100-300MB per results set
- USB Speed: USB 2.0+ sufficient (USB 3.0 faster)

### Optimization Tips
- Run iterations when Devuan is lightly loaded
- USB 3.0 reduces transfer time
- Results can be deleted after Windows copies them to free space

---

## Result Files Explained

### RESULTS-MANIFEST.json
```json
{
  "iteration_id": "iter-atoms-v1",
  "hostname": "excaliber",
  "completed": true,
  "exit_codes": {
    "validator": 0,        // 0 = success, non-zero = error
    "predictor": 0,
    "overall": 0
  },
  "files": {
    "hardware_report": "hardware-fitness-report.json",
    "predictions": "predictions.json",
    "execution_log": "execution.log"
  }
}
```

### hardware-fitness-report.json
```json
{
  "fitness_score": 0.87,
  "metrics": {
    "cpu_efficiency": 0.92,
    "memory_usage": 0.45,
    "disk_io": 0.78
  },
  "timestamp": "2024-04-20T14:45:22Z"
}
```

### predictions.json
```json
{
  "predictions": [
    {"domain": "atoms", "emergence_index": 0.73, "confidence": 0.89},
    {"domain": "molecules", "emergence_index": 0.51, "confidence": 0.76}
  ],
  "summary": "Phase 17 network predictions generated"
}
```

### execution.log
Full text log of entire validator execution - useful for debugging issues.

---

## After Validation

### Before Removing USB
```bash
# Optional: Verify results are complete
ls -la /mnt/usb/phase17-iter/iter-atoms-v1/results/

# Safe to remove USB now
sudo umount /mnt/usb
```

### Return USB to Windows
1. USB stays inserted until Windows is ready to receive it
2. Bring USB back to Windows machine
3. Run Windows analysis script (see [PHASE-17-USB-ITERATION-GUIDE.md](PHASE-17-USB-ITERATION-GUIDE.md))

---

## Contact/Support

**Issues?** Check:
1. [PHASE-17-USB-ITERATION-GUIDE.md](PHASE-17-USB-ITERATION-GUIDE.md) - Workflow overview
2. [README-USB-ITERATION-SYSTEM.md](README-USB-ITERATION-SYSTEM.md) - Full system documentation
3. Execution log in results/ - Most detailed error info

**Devuan SSH Access:**
```bash
ssh user@10.144.113.100
# Or direct console access
```

---

**Version:** Phase 17.5 Beta  
**Last Updated:** 2024-04-20  
**Host:** Devuan Excaliber  
**Test Server:** 10.144.113.100
