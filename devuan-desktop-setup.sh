#!/bin/bash
# MistTracker Setup Script for Devuan - Desktop Installation
# Target: /home/orion/Desktop/misttracker/
# 
# Run this script AFTER manually copying files to Desktop via GUI
# Usage: bash ~/Desktop/misttracker/setup.sh

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

# Configuration
TARGET_DIR="$HOME/Desktop/misttracker"
MISTTRACKER_HOME="$HOME/misttracker"
LOG_DIR="$MISTTRACKER_HOME/logs"

echo ""
echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║       MistTracker Desktop Setup Script                     ║${NC}"
echo -e "${BLUE}║       Installing from: $TARGET_DIR${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Step 4: Verify source files
echo -e "${YELLOW}[4/7] Verifying deployment files...${NC}"

# Debug: Show what's actually in the directory
echo "Debug: Listing $TARGET_DIR"
if [ -d "$TARGET_DIR" ]; then
  ls -lh "$TARGET_DIR" 2>/dev/null | tail -20 || echo "Warning: Could not list directory"
fi
echo ""

FILES_NEEDED=(
  "phase-17-5-beta-network-predictor.js"
  "phase-17-5-beta-extended-aggregator.js"
  "hardware-fitness-validator.js"
  "validation-checklist.sh"
  "start-server.js"
)

MISSING_FILES=0
for file in "${FILES_NEEDED[@]}"; do
  FULL_PATH="$TARGET_DIR/$file"
  
  # Try multiple path variations
  if [ -f "$FULL_PATH" ]; then
    echo "  [OK] $file"
  elif [ -f "$TARGET_DIR/$file" ]; then
    echo "  [OK] $file (via alternate path)"
  else
    echo -e "  ${RED}[MISSING] $file${NC}"
    echo "    Expected: $FULL_PATH"
    ls -la "$TARGET_DIR/$file" 2>&1 | head -5
    ((MISSING_FILES++))
  fi
done

if [ $MISSING_FILES -gt 0 ]; then
  echo ""
  echo -e "${RED}ERROR: $MISSING_FILES files missing from $TARGET_DIR${NC}"
  echo "Expected files:"
  for file in "${FILES_NEEDED[@]}"; do
    echo "  - $file"
  done
  echo ""
  echo "Files actually present:"
  ls -1 "$TARGET_DIR" 2>/dev/null | sed 's/^/  /'
  exit 1
fi

echo -e "${GREEN}[OK] All deployment files verified${NC}"
echo ""

# Step 5: Create installation directory
echo -e "${YELLOW}[5/7] Creating installation directory...${NC}"

mkdir -p "$MISTTRACKER_HOME"
mkdir -p "$LOG_DIR"

echo "  ✓ Created: $MISTTRACKER_HOME"
echo "  ✓ Created: $LOG_DIR"

echo -e "${GREEN}✓ Installation directory ready${NC}"
echo ""

# Step 6: Copy files to installation location
echo -e "${YELLOW}[6/7] Copying files to installation location...${NC}"

for file in "${FILES_NEEDED[@]}"; do
  if cp "$TARGET_DIR/$file" "$MISTTRACKER_HOME/"; then
    echo "  ✓ Copied: $file"
  else
    echo -e "  ${RED}✗ Failed to copy: $file${NC}"
    exit 1
  fi
done

# Copy documentation if available
DOC_FILES=(
  "DEPLOYMENT-DEGRADED-HARDWARE-GUIDE.md"
  "PHASE-17-5-BETA-NETWORK-EXTENSION.md"
  "PHASE-17-5-BETA-NETWORK-QUICK-REFERENCE.md"
)

for file in "${DOC_FILES[@]}"; do
  if [ -f "$TARGET_DIR/$file" ]; then
    cp "$TARGET_DIR/$file" "$MISTTRACKER_HOME/" 2>/dev/null || true
    echo "  ✓ Copied: $file"
  fi
done

echo -e "${GREEN}✓ All files copied successfully${NC}"
echo ""

# Step 7: Make scripts executable
echo -e "${YELLOW}[7/7] Setting up permissions...${NC}"

chmod +x "$MISTTRACKER_HOME/validation-checklist.sh" 2>/dev/null || true
chmod +x "$MISTTRACKER_HOME/start-server.js" 2>/dev/null || true

echo "  ✓ Script permissions set"
echo -e "${GREEN}✓ Installation complete${NC}"
echo ""

# Summary
echo -e "${GREEN}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║              INSTALLATION SUCCESSFUL                      ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo "Installation directory: $MISTTRACKER_HOME"
echo ""
echo "Files installed:"
ls -lh "$MISTTRACKER_HOME"/*.js "$MISTTRACKER_HOME"/*.sh 2>/dev/null | awk '{print "  " $9 " (" $5 ")"}'
echo ""
echo "Next steps:"
echo -e "${YELLOW}1. Run validation checklist:${NC}"
echo "   bash $MISTTRACKER_HOME/validation-checklist.sh"
echo ""
echo -e "${YELLOW}2. Start the server:${NC}"
echo "   cd $MISTTRACKER_HOME"
echo "   NODE_OPTIONS='--max-old-space-size=512' node start-server.js 3000 &"
echo ""
echo -e "${YELLOW}3. Verify server is running:${NC}"
echo "   curl -s http://localhost:3000/health | jq ."
echo ""
echo -e "${YELLOW}4. Run hardware fitness validation:${NC}"
echo "   node $MISTTRACKER_HOME/hardware-fitness-validator.js"
echo ""
