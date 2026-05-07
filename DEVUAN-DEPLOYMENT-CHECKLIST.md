# Phase 17 USB Iteration - Devuan Deployment Checklist

**Purpose:** Verify Devuan Excaliber is ready to run Phase 17 USB iterations  
**Date:** April 20, 2026  
**Server:** 10.144.113.100 (Devuan Excaliber)

---

## Pre-Deployment Verification

### System Requirements
- [ ] **Operating System**: Devuan (Linux-based, Debian derivative)
- [ ] **Kernel**: Recent (2022+)
- [ ] **Architecture**: x86_64 or ARM64
- [ ] **RAM**: Minimum 2GB available (4GB+ recommended)
- [ ] **Disk**: Minimum 1GB free space on root filesystem

**Verification:**
```bash
uname -a
free -h
df -h /
```

### Node.js Installation
- [ ] **Node.js**: Version 16 or higher installed
- [ ] **npm**: Version 7 or higher
- [ ] **Global packages**: None required (validator is self-contained)

**Verification:**
```bash
node -v          # Should show v16.x.x or higher
npm -v           # Should show 7.x.x or higher
which node       # Should show /usr/bin/node or similar
```

**If Node.js Not Installed:**
```bash
# On Devuan:
sudo apt update
sudo apt install nodejs npm

# Verify installation
node -v
```

### USB Port & Mounting
- [ ] **USB Port**: At least one USB 2.0 or 3.0 port available
- [ ] **Mount Point**: /mnt/usb directory exists (or will auto-mount)
- [ ] **Permissions**: User can read/write USB files

**Verification:**
```bash
lsusb                      # List USB devices
ls -la /mnt/               # Check if /mnt/usb exists
mount | grep usb           # Check if USB auto-mounts

# If /mnt/usb doesn't exist, create it:
sudo mkdir -p /mnt/usb
```

### File System & Storage
- [ ] **USB File System**: FAT32, NTFS, or ext4 compatible
- [ ] **USB Capacity**: Minimum 2GB for iterations
- [ ] **USB Speed**: USB 2.0 minimum (USB 3.0 preferred)

**Verification:**
```bash
# After USB inserted:
lsblk
# Should show USB device (usually /dev/sdb or /dev/sdc)

# Check capacity
sudo fdisk -l | grep "/dev/sd"
```

---

## Permissions & Access

### User Permissions
- [ ] **Current User**: Has SSH access or console access
- [ ] **sudo Access**: User can run `sudo mount` if needed
- [ ] **USB Access**: User can read/write USB files

**Verification:**
```bash
id                         # Show current user groups
sudo -l                    # Show sudo privileges

# Test USB access after insertion:
touch /mnt/usb/test.txt
rm /mnt/usb/test.txt
```

### SSH Access (If Remote)
- [ ] **SSH Server**: Running on port 22 (or configured port)
- [ ] **SSH Key Auth**: Configured (or password auth available)
- [ ] **Network Access**: Windows can reach 10.144.113.100

**Verification:**
```bash
# On Windows PowerShell:
Test-NetConnection -ComputerName 10.144.113.100 -Port 22

# Via SSH:
ssh -V              # Test SSH client
ssh user@10.144.113.100 "echo 'SSH working'"
```

---

## Required Files & Scripts

### On USB (Auto-Included by Windows)
Each iteration USB package includes:
- [ ] `MANIFEST.json` - Iteration metadata
- [ ] `run-validator.sh` - Validator script (this file executes)
- [ ] `phase-17-5-beta-network-predictor.js` - Network prediction engine
- [ ] `hardware-fitness-validator.js` - Hardware validation
- [ ] `SymbolicExpression.js` - Symbolic expression evaluator
- [ ] `predictionEngine.js` - Core prediction logic
- [ ] `data/` - Phase 17 training data (multiple files)

**Verification After USB Insert:**
```bash
cd /mnt/usb/phase17-iter/iter-atoms-v1

# Check for required files:
test -f run-validator.sh && echo "✓ Validator script" || echo "✗ Missing validator"
test -f phase-17-5-beta-network-predictor.js && echo "✓ Predictor" || echo "✗ Missing predictor"
test -f hardware-fitness-validator.js && echo "✓ Validator" || echo "✗ Missing validator"
test -d data && echo "✓ Data directory" || echo "✗ Missing data"

# List all files:
ls -lah
```

### Script Permissions
- [ ] `run-validator.sh`: Executable by current user
- [ ] Readable by current user

**Verification:**
```bash
ls -la run-validator.sh
# Should show: -rwxr-xr-x (or similar with execute bit)

# If not executable, fix it:
chmod +x run-validator.sh
```

---

## Network & Connectivity

### Devuan ↔ Windows
- [ ] **Network Connectivity**: Devuan can communicate with Windows (for future improvements)
- [ ] **Firewall Rules**: No blocking of USB-transported data
- [ ] **DNS**: Resolvable (usually not needed for USB iterations)

**Verification:**
```bash
# Check network status:
ip addr                    # Show IP addresses
nmcli dev show            # Show network devices (NetworkManager)

# Ping Windows machine (optional):
ping 10.144.113.1         # Gateway or Windows host
```

---

## Environment Variables & Paths

### PATH Configuration
- [ ] **Node.js in PATH**: Accessible from any directory
- [ ] **bash/sh**: Available and in PATH

**Verification:**
```bash
echo $PATH
which node
which bash

# Should show:
# /usr/bin/node
# /bin/bash
```

### Temporary Files
- [ ] **/tmp**: Available for temp files during validation
- [ ] Sufficient space: At least 500MB free

**Verification:**
```bash
df -h /tmp
du -sh /tmp
```

---

## Pre-Run Checklist

### Before First USB Iteration
1. [ ] Node.js 16+ installed and verified
2. [ ] USB port accessible
3. [ ] USB can be mounted at /mnt/usb
4. [ ] /tmp has sufficient space
5. [ ] User has read/write permissions
6. [ ] SSH access working (if remote)

### Before Each Iteration Run
1. [ ] USB inserted and auto-mounted (or manually mounted)
2. [ ] Iteration directory present: `/mnt/usb/phase17-iter/[iteration-label]`
3. [ ] All required files present in iteration directory
4. [ ] run-validator.sh is executable
5. [ ] Network connectivity good (if monitoring remotely)

---

## Deployment Steps

### Step 1: Verify Node.js
```bash
node -v
npm -v

# Expected output:
# v16.13.0 (or higher)
# 8.1.0 (or higher)
```

**Result:** [ ] Pass / [ ] Fail - Take Action

### Step 2: Verify USB Mounting
```bash
# Insert USB drive

# Wait 3-5 seconds for auto-mount
sleep 5

# Check if mounted:
mount | grep /mnt/usb

# If not mounted:
sudo mount /dev/sdb1 /mnt/usb
```

**Result:** [ ] Pass / [ ] Fail - Troubleshoot

### Step 3: Verify Iteration Package
```bash
ls /mnt/usb/phase17-iter/

# Should show:
# iter-atoms-v1
# iter-atoms-v2
# [etc]

# Check contents of first iteration:
cd /mnt/usb/phase17-iter/iter-atoms-v1
ls -la

# Should show:
# MANIFEST.json
# run-validator.sh
# *.js files
# data/
```

**Result:** [ ] Pass / [ ] Fail - Check USB Preparation

### Step 4: Test Run (Dry Run)
```bash
cd /mnt/usb/phase17-iter/iter-atoms-v1

# Make validator executable:
chmod +x run-validator.sh

# Do a test run (will take 10-15 minutes):
bash run-validator.sh

# Monitor output for:
# - [SUCCESS] messages
# - [WARNING] or [ERROR] messages
# - Exit code at end
```

**Result:** [ ] Pass / [ ] Fail - Check execution.log

### Step 5: Verify Results
```bash
ls -la results/

# Should contain:
# RESULTS-MANIFEST.json
# hardware-fitness-report.json
# predictions.json
# execution.log

# Check manifest:
cat results/RESULTS-MANIFEST.json | jq .
```

**Result:** [ ] Pass / [ ] Fail - Review Manifest

---

## Post-Deployment Handoff

After successful verification:

1. [ ] **Document System State:**
   - Node.js version: _______________
   - Devuan version: _______________
   - USB mount point: _______________
   - Test successful: Yes / No

2. [ ] **Create Support Reference:**
   - Devuan access method: SSH / Console
   - SSH user account: _______________
   - Sudo capability: Yes / No
   - Contact for support: _______________

3. [ ] **Operator Training:**
   - [ ] Devuan operator understands iteration workflow
   - [ ] Operator can mount USB manually if needed
   - [ ] Operator knows how to read results/RESULTS-MANIFEST.json
   - [ ] Operator knows where to find logs for troubleshooting

4. [ ] **Documentation Provided:**
   - [ ] DEVUAN-OPERATOR-GUIDE.md copied to Devuan
   - [ ] PHASE-17-USB-ITERATION-GUIDE.md copied to Windows side
   - [ ] README-USB-ITERATION-SYSTEM.md available

---

## Troubleshooting Quick Reference

### Node Not Found
```bash
# Solution: Install Node.js
sudo apt update && sudo apt install nodejs npm
```

### USB Not Mounting
```bash
# Solution: Manual mount
sudo mkdir -p /mnt/usb
sudo mount /dev/sdb1 /mnt/usb   # (adjust sdb1 if needed)
```

### Permission Denied
```bash
# Solution: Fix permissions
chmod +x run-validator.sh
sudo chown -R $USER:$USER /mnt/usb
```

### Out of Memory
```bash
# Solution: Set Node memory limit
NODE_OPTIONS="--max-old-space-size=2048" bash run-validator.sh
```

### Results Not Created
```bash
# Solution: Check log file
cd /mnt/usb/phase17-iter/iter-atoms-v1
cat results/execution.log | tail -50
```

---

## Sign-Off

### Prepared By
**Name:** _______________________________  
**Date:** _______________________________  
**System:** Devuan Excaliber (10.144.113.100)

### Verified By
**Name:** _______________________________  
**Date:** _______________________________  
**Test Iteration:** _______________________________

### Deployment Status
- [ ] **Ready for Production:** All checks passed
- [ ] **Conditional Ready:** Requires following setup
- [ ] **Not Ready:** Requires major fixes

**Notes/Issues:**
```
_________________________________________________________________________

_________________________________________________________________________

_________________________________________________________________________
```

---

## Next Steps

1. **Windows Side:** Run first USB iteration preparation
   - `PowerShell -ExecutionPolicy Bypass -File phase-17-usb.ps1`
   - Select Option 1: Prepare USB

2. **Devuan Side:** Receive USB and run validator
   - Insert USB, wait for auto-mount
   - Navigate to iteration directory
   - `bash run-validator.sh`

3. **Windows Side:** Analyze results
   - Run `phase-17-usb.ps1`
   - Select Option 2: Analyze Results
   - Review predictions and decide next iteration

---

**Documentation Version:** 1.0  
**Phase 17:** 17.5 Beta  
**Created:** April 20, 2026  
**Last Updated:** April 20, 2026
