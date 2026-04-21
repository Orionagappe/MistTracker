#!/bin/bash
# MistTracker Deployment Validation Checklist
# Run this on Devuan to verify deployment readiness
# Usage: bash validation-checklist.sh

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

CHECKS_PASSED=0
CHECKS_FAILED=0
CHECKS_WARNINGS=0

# Helper functions
pass() {
  echo -e "${GREEN}✓${NC} $1"
  ((CHECKS_PASSED++))
}

fail() {
  echo -e "${RED}✗${NC} $1"
  ((CHECKS_FAILED++))
}

warn() {
  echo -e "${YELLOW}⚠${NC} $1"
  ((CHECKS_WARNINGS++))
}

info() {
  echo -e "${BLUE}ℹ${NC} $1"
}

# Header
echo ""
echo "╔════════════════════════════════════════════════════════════╗"
echo "║    MistTracker Deployment Validation Checklist (Devuan)    ║"
echo "║          Testing Degraded Hardware Configuration           ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

# Section 1: System Requirements
echo -e "${BLUE}[1/6] SYSTEM REQUIREMENTS${NC}"
echo "========================================"

# Check OS
if grep -q "Devuan" /etc/os-release 2>/dev/null; then
  OS=$(grep "^NAME" /etc/os-release | cut -d'"' -f2)
  pass "Operating System: $OS"
else
  warn "Operating System: Not confirmed as Devuan"
fi

# Check kernel
KERNEL=$(uname -r)
pass "Kernel: $KERNEL"

# Check RAM
TOTAL_RAM=$(grep MemTotal /proc/meminfo | awk '{print int($2/1024/1024)}')
AVAILABLE_RAM=$(grep MemAvailable /proc/meminfo | awk '{print int($2/1024/1024)}')

if [ "$TOTAL_RAM" -ge 7 ] && [ "$TOTAL_RAM" -le 9 ]; then
  pass "Total RAM: ${TOTAL_RAM}GB"
else
  warn "Total RAM: ${TOTAL_RAM}GB (expected ~8GB)"
fi

if [ "$AVAILABLE_RAM" -ge 6 ]; then
  pass "Available RAM: ${AVAILABLE_RAM}GB"
else
  fail "Available RAM: ${AVAILABLE_RAM}GB (too low, min 4GB)"
fi

# Check CPUs
CPU_COUNT=$(nproc)
CPU_MODEL=$(grep "model name" /proc/cpuinfo | head -1 | cut -d: -f2 | xargs)

if [ "$CPU_COUNT" -ge 1 ]; then
  pass "CPU Cores: $CPU_COUNT"
else
  fail "CPU Cores: $CPU_COUNT (need at least 1)"
fi

info "CPU Model: $CPU_MODEL"

# Check for RAM issues
if dmesg | grep -i "memory error\|uncorrectable\|bad page" &>/dev/null; then
  warn "Hardware: Potential RAM errors detected in dmesg"
else
  pass "Hardware: No obvious RAM errors in dmesg"
fi

echo ""

# Section 2: Node.js & Dependencies
echo -e "${BLUE}[2/6] NODE.JS & DEPENDENCIES${NC}"
echo "========================================"

# Check Node.js
if command -v node &> /dev/null; then
  NODE_VERSION=$(node --version)
  pass "Node.js installed: $NODE_VERSION"
else
  fail "Node.js: NOT FOUND"
fi

# Check NPM
if command -v npm &> /dev/null; then
  NPM_VERSION=$(npm --version)
  pass "npm installed: $NPM_VERSION"
else
  warn "npm: NOT FOUND (may not be needed)"
fi

# Check git (for version control)
if command -v git &> /dev/null; then
  GIT_VERSION=$(git --version)
  pass "git installed: $GIT_VERSION"
else
  warn "git: NOT FOUND"
fi

echo ""

# Section 3: Project Files
echo -e "${BLUE}[3/6] PROJECT FILES${NC}"
echo "========================================"

MISTTRACKER_HOME="${HOME}/misttracker"

if [ -d "$MISTTRACKER_HOME" ]; then
  pass "MistTracker directory exists: $MISTTRACKER_HOME"
else
  fail "MistTracker directory: NOT FOUND at $MISTTRACKER_HOME"
fi

FILES=(
  "phase-17-5-beta-network-predictor.js"
  "phase-17-5-beta-extended-aggregator.js"
  "hardware-fitness-validator.js"
  "start-server.js"
)

for file in "${FILES[@]}"; do
  if [ -f "$MISTTRACKER_HOME/$file" ]; then
    pass "Found: $file"
  else
    fail "Missing: $file"
  fi
done

# Check logs directory
if [ -d "$MISTTRACKER_HOME/logs" ]; then
  pass "Logs directory exists"
else
  warn "Logs directory not found, will be created on first run"
fi

echo ""

# Section 4: Network & Ports
echo -e "${BLUE}[4/6] NETWORK & PORTS${NC}"
echo "========================================"

# Check localhost resolution
if ping -c 1 localhost &>/dev/null; then
  pass "Localhost resolution working"
else
  fail "Localhost resolution: FAILED"
fi

# Check port 3000 availability
if lsof -Pi :3000 -sTCP:LISTEN -t >/dev/null 2>&1; then
  warn "Port 3000: Already in use"
else
  pass "Port 3000: Available"
fi

# Check network interfaces
IFACES=$(ip link | grep "^[0-9]" | grep -v "lo:" | wc -l)
if [ "$IFACES" -gt 0 ]; then
  pass "Network interfaces: $IFACES active"
else
  warn "Network interfaces: None found"
fi

echo ""

# Section 5: Disk Space & I/O
echo -e "${BLUE}[5/6] DISK SPACE & I/O${NC}"
echo "========================================"

# Check disk space in home
DISK_AVAILABLE=$(df "$HOME" | tail -1 | awk '{print $4}')
DISK_AVAILABLE_GB=$((DISK_AVAILABLE / 1024 / 1024))

if [ "$DISK_AVAILABLE_GB" -ge 1 ]; then
  pass "Disk space available: ${DISK_AVAILABLE_GB}GB"
else
  fail "Disk space: Only ${DISK_AVAILABLE_GB}GB (need at least 1GB)"
fi

# Check if home is writable
if touch "$HOME/.test-write" 2>/dev/null; then
  rm "$HOME/.test-write"
  pass "Home directory: Writable"
else
  fail "Home directory: NOT WRITABLE"
fi

# Check temp space
if [ -w "/tmp" ]; then
  pass "Temp directory: Writable (/tmp)"
else
  warn "Temp directory: NOT WRITABLE"
fi

echo ""

# Section 6: System Configuration
echo -e "${BLUE}[6/6] SYSTEM CONFIGURATION${NC}"
echo "========================================"

# Check ulimit
FILE_LIMIT=$(ulimit -n)
if [ "$FILE_LIMIT" -ge 1024 ]; then
  pass "File descriptors limit: $FILE_LIMIT"
else
  warn "File descriptors limit: $FILE_LIMIT (may limit connections)"
fi

# Check swap
SWAP_AVAILABLE=$(grep SwapTotal /proc/meminfo | awk '{print int($2/1024/1024)}')
if [ "$SWAP_AVAILABLE" -gt 0 ]; then
  info "Swap available: ${SWAP_AVAILABLE}GB"
else
  warn "Swap: Not available (system may be unstable under memory pressure)"
fi

# Check system load
LOAD=$(cat /proc/loadavg | awk '{print $1}')
pass "Current system load: $LOAD"

# Check thermal
if [ -f /sys/class/thermal/thermal_zone0/temp ]; then
  TEMP_CENTI=$(cat /sys/class/thermal/thermal_zone0/temp 2>/dev/null || echo "0")
  TEMP_CELSIUS=$((TEMP_CENTI / 1000))
  
  if [ "$TEMP_CELSIUS" -lt 60 ]; then
    pass "CPU Temperature: ${TEMP_CELSIUS}°C"
  else
    warn "CPU Temperature: ${TEMP_CELSIUS}°C (elevated, check cooling)"
  fi
else
  info "Thermal monitoring: Not available"
fi

echo ""

# Section 7: Validation Tests (if files exist)
echo -e "${BLUE}[BONUS] QUICK VALIDATION TESTS${NC}"
echo "========================================"

if [ -f "$MISTTRACKER_HOME/hardware-fitness-validator.js" ]; then
  read -p "Run full hardware fitness validation? (y/N): " -n 1 -r
  echo
  if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "Starting validation (this may take 2-3 minutes)..."
    cd "$MISTTRACKER_HOME"
    timeout 180 node hardware-fitness-validator.js || warn "Validation timed out or failed"
  fi
fi

echo ""

# Summary
echo "╔════════════════════════════════════════════════════════════╗"
echo "║                    VALIDATION SUMMARY                      ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""
echo -e "${GREEN}Checks Passed: $CHECKS_PASSED${NC}"
echo -e "${YELLOW}Warnings: $CHECKS_WARNINGS${NC}"
echo -e "${RED}Checks Failed: $CHECKS_FAILED${NC}"
echo ""

# Final verdict
if [ "$CHECKS_FAILED" -eq 0 ]; then
  if [ "$CHECKS_WARNINGS" -eq 0 ]; then
    echo -e "${GREEN}✓ SYSTEM READY FOR DEPLOYMENT${NC}"
    OVERALL_RESULT=0
  else
    echo -e "${YELLOW}⚠ SYSTEM READY WITH CAUTION${NC}"
    echo "   Review warnings above before deploying to production"
    OVERALL_RESULT=1
  fi
else
  echo -e "${RED}✗ SYSTEM NOT READY FOR DEPLOYMENT${NC}"
  echo "   Please fix failures above before proceeding"
  OVERALL_RESULT=2
fi

echo ""
echo "Checklist Date: $(date)"
echo "System: $(hostname)"
echo ""

# Next steps
if [ "$OVERALL_RESULT" -le 1 ]; then
  echo "Next Steps:"
  echo "1. Start MistTracker server:"
  echo "   cd $MISTTRACKER_HOME"
  echo "   NODE_OPTIONS='--max-old-space-size=512' node start-server.js 3000 &"
  echo ""
  echo "2. Verify server is running:"
  echo "   curl -s http://localhost:3000/health | jq ."
  echo ""
  echo "3. Monitor performance:"
  echo "   bash $MISTTRACKER_HOME/monitor.sh 120"
  echo ""
fi

exit $OVERALL_RESULT
