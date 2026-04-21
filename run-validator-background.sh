#!/bin/bash
# MistTracker Hardware Fitness Validator - Background Runner
# Runs validator and saves all output to a timestamped log file

TIMESTAMP=$(date +%Y%m%d_%H%M%S)
LOG_DIR="$HOME/misttracker/logs"
RESULTS_FILE="$LOG_DIR/validator-results-$TIMESTAMP.txt"

mkdir -p "$LOG_DIR"

{
  echo "=========================================================="
  echo "  MistTracker Hardware Fitness Validator"
  echo "  Started: $(date)"
  echo "=========================================================="
  echo ""
  
  # System info
  echo "System Information:"
  echo "  Hostname: $(hostname)"
  echo "  OS: $(cat /etc/os-release 2>/dev/null | grep PRETTY_NAME | cut -d= -f2)"
  echo "  Kernel: $(uname -r)"
  echo "  Memory: $(free -h | grep Mem | awk '{print $2 " total, " $7 " available"}')"
  echo "  CPU Cores: $(nproc)"
  echo ""
  
  # Server status
  echo "Server Status:"
  ps aux | grep "node.*start-server" | grep -v grep && echo "  [OK] Server is running" || echo "  [WARN] Server not detected"
  echo ""
  
  # Run validator
  echo "Running Hardware Fitness Validator..."
  echo "=========================================================="
  echo ""
  
  cd "$HOME/misttracker" && node hardware-fitness-validator.js
  
  VALIDATOR_EXIT=$?
  
  echo ""
  echo "=========================================================="
  echo "Test Completed"
  echo "  Exit Code: $VALIDATOR_EXIT"
  echo "  Finished: $(date)"
  echo "=========================================================="
  
} | tee "$RESULTS_FILE"

echo ""
echo "Results saved to: $RESULTS_FILE"
