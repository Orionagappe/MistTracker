#!/bin/bash

# Phase 17 USB Iteration Validator Script
# Purpose: Run Phase 17 hardware validation and network prediction on Devuan
# Usage: bash run-validator.sh (from USB iteration directory)
# Output: All results saved to results/ directory on USB

set -e

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
RESULTS_DIR="$SCRIPT_DIR/results"
LOG_FILE="$RESULTS_DIR/execution.log"
MANIFEST_FILE="$RESULTS_DIR/RESULTS-MANIFEST.json"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Logging function
log() {
    echo -e "${CYAN}[$(date '+%Y-%m-%d %H:%M:%S')]${NC} $1" | tee -a "$LOG_FILE"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1" | tee -a "$LOG_FILE"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1" | tee -a "$LOG_FILE"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1" | tee -a "$LOG_FILE"
}

# Initialize
echo ""
echo "╔════════════════════════════════════════════════════════╗"
echo "║  Phase 17 USB Iteration Validator                     ║"
echo "║  Devuan Hardware Validation & Network Prediction      ║"
echo "╚════════════════════════════════════════════════════════╝"
echo ""

# Create results directory
if [ ! -d "$RESULTS_DIR" ]; then
    mkdir -p "$RESULTS_DIR"
    log "Created results directory: $RESULTS_DIR"
fi

# Initialize log file
echo "Phase 17 Validator Execution Log" > "$LOG_FILE"
echo "Started: $(date)" >> "$LOG_FILE"
echo "Iteration: $SCRIPT_DIR" >> "$LOG_FILE"
echo "Hostname: $(hostname)" >> "$LOG_FILE"
echo "" >> "$LOG_FILE"

log "Starting Phase 17 USB Iteration Validator"
log "Script directory: $SCRIPT_DIR"
log "Results directory: $RESULTS_DIR"

# Verify Node.js is available
log "Checking Node.js environment..."
if ! command -v node &> /dev/null; then
    log_error "Node.js not found. Please install Node.js 16 or higher."
    exit 1
fi

NODE_VERSION=$(node -v)
log "Node.js version: $NODE_VERSION"

# Verify required files exist
log "Verifying required files..."
REQUIRED_FILES=(
    "hardware-fitness-validator.js"
    "phase-17-5-beta-network-predictor.js"
    "SymbolicExpression.js"
    "predictionEngine.js"
)

MISSING_FILES=0
for file in "${REQUIRED_FILES[@]}"; do
    if [ -f "$SCRIPT_DIR/$file" ]; then
        log "  ✓ Found: $file"
    else
        log_error "  ✗ Missing: $file"
        MISSING_FILES=$((MISSING_FILES + 1))
    fi
done

if [ $MISSING_FILES -gt 0 ]; then
    log_error "Missing $MISSING_FILES required file(s). Aborting."
    exit 1
fi

# Run hardware fitness validator
log ""
log "════════════════════════════════════════════════════════"
log "Phase 1: Running Hardware Fitness Validator"
log "════════════════════════════════════════════════════════"

HARDWARE_EXIT_CODE=0
HARDWARE_OUTPUT_FILE="$RESULTS_DIR/hardware-fitness-report.json"

if node "$SCRIPT_DIR/hardware-fitness-validator.js" > "$HARDWARE_OUTPUT_FILE" 2>> "$LOG_FILE"; then
    log_success "Hardware fitness validator completed successfully"
    HARDWARE_EXIT_CODE=0
    
    # Show summary if JSON parsing succeeds
    if command -v jq &> /dev/null; then
        SUMMARY=$(jq '.summary // .status' "$HARDWARE_OUTPUT_FILE" 2>/dev/null || echo "")
        if [ -n "$SUMMARY" ]; then
            log "Hardware Results: $SUMMARY"
        fi
    fi
else
    HARDWARE_EXIT_CODE=$?
    log_warning "Hardware fitness validator exited with code: $HARDWARE_EXIT_CODE"
fi

# Run Phase 17 network predictor
log ""
log "════════════════════════════════════════════════════════"
log "Phase 2: Running Phase 17 Network Predictor"
log "════════════════════════════════════════════════════════"

PREDICTOR_EXIT_CODE=0
PREDICTOR_OUTPUT_FILE="$RESULTS_DIR/predictions.json"

if node "$SCRIPT_DIR/phase-17-5-beta-network-predictor.js" > "$PREDICTOR_OUTPUT_FILE" 2>> "$LOG_FILE"; then
    log_success "Network predictor completed successfully"
    PREDICTOR_EXIT_CODE=0
    
    # Show summary if JSON parsing succeeds
    if command -v jq &> /dev/null; then
        SUMMARY=$(jq '.summary // .status // "predictions generated"' "$PREDICTOR_OUTPUT_FILE" 2>/dev/null || echo "predictions generated")
        log "Predictor Results: $SUMMARY"
    fi
else
    PREDICTOR_EXIT_CODE=$?
    log_warning "Network predictor exited with code: $PREDICTOR_EXIT_CODE"
fi

# Generate results manifest
log ""
log "════════════════════════════════════════════════════════"
log "Phase 3: Creating Results Manifest"
log "════════════════════════════════════════════════════════"

cat > "$MANIFEST_FILE" << EOF
{
  "iteration_id": "$(basename $SCRIPT_DIR)",
  "hostname": "$(hostname)",
  "completed": true,
  "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "exit_codes": {
    "validator": $HARDWARE_EXIT_CODE,
    "predictor": $PREDICTOR_EXIT_CODE,
    "overall": $([ $HARDWARE_EXIT_CODE -eq 0 ] && [ $PREDICTOR_EXIT_CODE -eq 0 ] && echo 0 || echo 1)
  },
  "files": {
    "hardware_report": "hardware-fitness-report.json",
    "predictions": "predictions.json",
    "execution_log": "execution.log",
    "manifest": "RESULTS-MANIFEST.json"
  },
  "node_version": "$(node -v)",
  "timestamp_completed": "$(date)"
}
EOF

log_success "Manifest created: $MANIFEST_FILE"

# Copy execution log to results
cp "$LOG_FILE" "$RESULTS_DIR/execution.log.backup" 2>/dev/null || true

# Summary
log ""
log "════════════════════════════════════════════════════════"
log "Execution Summary"
log "════════════════════════════════════════════════════════"

log "Hardware Validator Exit Code: $HARDWARE_EXIT_CODE"
log "Network Predictor Exit Code: $PREDICTOR_EXIT_CODE"

RESULTS_COUNT=$(ls -1 "$RESULTS_DIR" | wc -l)
log "Results files created: $RESULTS_COUNT"

# List results
log ""
log "Results directory contents:"
ls -lh "$RESULTS_DIR" | tail -n +2 | while read -r line; do
    log "  $line"
done

# Final status
log ""
if [ $HARDWARE_EXIT_CODE -eq 0 ] && [ $PREDICTOR_EXIT_CODE -eq 0 ]; then
    log_success "All validators completed successfully ✓"
    FINAL_EXIT_CODE=0
else
    log_warning "One or more validators had issues (see exit codes above)"
    FINAL_EXIT_CODE=1
fi

log ""
log "════════════════════════════════════════════════════════"
log "Completed: $(date)"
log "════════════════════════════════════════════════════════"
log ""

echo -e "${GREEN}Validator execution complete. Results saved to: $RESULTS_DIR${NC}"
echo ""

exit $FINAL_EXIT_CODE
