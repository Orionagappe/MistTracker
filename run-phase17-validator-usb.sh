#!/bin/bash
# Phase 17 USB Iteration Runner - Devuan Side
# Purpose: Execute Phase 17 validator from USB, capture results back to USB
# Usage: bash /mnt/usb/phase17-iter/[iteration]/run-validator.sh

set -e

# Configuration
USB_MOUNT="/mnt/usb"
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
ITERATION_ID=$(basename "$SCRIPT_DIR")
RESULTS_DIR="$SCRIPT_DIR/results"
TIMESTAMP=$(date +%Y%m%d-%H%M%S)

# Output formatting
RED='\033[0;31m'
GREEN='\033[0;32m'
CYAN='\033[0;36m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo ""
echo -e "${CYAN}╔════════════════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║  Phase 17 USB Iteration Runner                        ║${NC}"
echo -e "${CYAN}║  Devuan Excaliber Test Server                         ║${NC}"
echo -e "${CYAN}╚════════════════════════════════════════════════════════╝${NC}"
echo ""

# Verify USB is mounted
echo -e "${CYAN}[1/6] Verifying USB mount...${NC}"
if ! mountpoint -q "$USB_MOUNT"; then
  echo -e "${RED}[ERROR] USB not mounted at $USB_MOUNT${NC}"
  echo "Mount manually with: sudo mount /mnt/usb"
  exit 1
fi
echo -e "${GREEN}✓ USB mounted${NC}"

# Create results directory
echo -e "${CYAN}[2/6] Creating results directory...${NC}"
mkdir -p "$RESULTS_DIR"
echo -e "${GREEN}✓ $RESULTS_DIR${NC}"

# Set up Node.js environment
echo -e "${CYAN}[3/6] Setting up Node.js environment...${NC}"
export NODE_OPTIONS="--max-old-space-size=512"
cd "$SCRIPT_DIR"
echo -e "${GREEN}✓ Environment ready${NC}"

# Log startup
cat > "$RESULTS_DIR/execution.log" << EOF
================================================================================
Phase 17 Iteration Execution
================================================================================
Iteration ID: $ITERATION_ID
Timestamp: $TIMESTAMP
Host: $(hostname)
Node Version: $(node --version)
NPM Version: $(npm --version)

Execution Start: $(date)
================================================================================

EOF

# Run validator on hardware fitness
echo -e "${CYAN}[4/6] Running hardware fitness validator...${NC}"
if node hardware-fitness-validator.js >> "$RESULTS_DIR/execution.log" 2>&1; then
  echo -e "${GREEN}✓ Validator completed${NC}"
else
  VALIDATOR_EXIT=$?
  echo -e "${YELLOW}⊘ Validator exited with code $VALIDATOR_EXIT${NC}"
  echo "Check $RESULTS_DIR/execution.log for details"
fi

# Run network predictor
echo -e "${CYAN}[5/6] Running Phase 17 network predictor...${NC}"
if node phase-17-5-beta-network-predictor.js >> "$RESULTS_DIR/execution.log" 2>&1; then
  echo -e "${GREEN}✓ Network predictor completed${NC}"
else
  PREDICTOR_EXIT=$?
  echo -e "${YELLOW}⊘ Predictor exited with code $PREDICTOR_EXIT${NC}"
fi

# Create completion manifest
echo -e "${CYAN}[6/6] Creating results manifest...${NC}"
cat > "$RESULTS_DIR/RESULTS-MANIFEST.json" << EOF
{
  "iteration_id": "$ITERATION_ID",
  "execution_timestamp": "$TIMESTAMP",
  "completed": "$(date -Iseconds)",
  "hostname": "$(hostname)",
  "exit_codes": {
    "validator": ${VALIDATOR_EXIT:-0},
    "predictor": ${PREDICTOR_EXIT:-0}
  },
  "output_files": [
    "execution.log",
    "predictions.json",
    "hardware-fitness-report.json"
  ]
}
EOF
echo -e "${GREEN}✓ Manifest created${NC}"

# Summary
echo ""
echo -e "${GREEN}✓ Phase 17 Iteration Complete${NC}"
echo ""
echo "  Iteration: $ITERATION_ID"
echo "  Results: $RESULTS_DIR"
echo "  Log: $RESULTS_DIR/execution.log"
echo ""
echo "Next steps:"
echo "  1. Remove USB from Devuan"
echo "  2. Bring USB back to Windows"
echo "  3. Run: PowerShell -File phase-17-usb-analyze.ps1 -IterationLabel $ITERATION_ID"
echo ""
