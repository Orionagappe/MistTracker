#!/bin/bash
# MistTracker Setup Script for Devuan - Desktop Installation
# DIAGNOSTIC VERSION - Better error handling and debugging
# 
# Target: /home/orion/Desktop/misttracker/
# Usage: bash ~/Desktop/misttracker/devuan-desktop-setup-debug.sh

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
echo "=========================================================="
echo "       MistTracker Desktop Setup Script (DIAGNOSTIC)"
echo "       Installing from: $TARGET_DIR"
echo "=========================================================="
echo ""

# Stage 1: Verify target directory exists
echo "[STAGE 1] Checking source directory..."
if [ -d "$TARGET_DIR" ]; then
  echo "  [OK] Directory exists: $TARGET_DIR"
else
  echo "  [ERROR] Directory not found: $TARGET_DIR"
  echo "  Please copy files to Desktop/misttracker/ first"
  exit 1
fi

# Stage 2: List what files are actually present
echo ""
echo "[STAGE 2] Files found in source directory:"
if [ -d "$TARGET_DIR" ]; then
  ls -lh "$TARGET_DIR"/ 2>/dev/null || echo "  [ERROR] Cannot list directory"
else
  echo "  [ERROR] Directory not accessible"
  exit 1
fi

echo ""

# Stage 3: Check for required files with detailed diagnostics
echo "[STAGE 3] Verifying deployment files..."

FILES_NEEDED=(
  "phase-17-5-beta-network-predictor.js"
  "phase-17-5-beta-extended-aggregator.js"
  "hardware-fitness-validator.js"
  "validation-checklist.sh"
  "start-server.js"
  "devuan-desktop-setup.sh"
)

MISSING_FILES=0
FOUND_FILES=0

for file in "${FILES_NEEDED[@]}"; do
  FULL_PATH="$TARGET_DIR/$file"
  
  if [ -f "$FULL_PATH" ]; then
    FILE_SIZE=$(stat -c%s "$FULL_PATH" 2>/dev/null || echo "?")
    echo "  [OK] $file ($(stat -c%s "$FULL_PATH" 2>/dev/null || echo "unknown") bytes)"
    ((FOUND_FILES++))
  else
    echo "  [MISSING] $file"
    echo "    Expected at: $FULL_PATH"
    ((MISSING_FILES++))
  fi
done

echo ""
echo "  Summary: Found $FOUND_FILES/$((${#FILES_NEEDED[@]})) files"

if [ $MISSING_FILES -gt 0 ]; then
  echo ""
  echo "  [ERROR] $MISSING_FILES files are missing!"
  echo ""
  echo "  Troubleshooting:"
  echo "    1. Verify files are copied to: $TARGET_DIR"
  echo "    2. Run: ls -la $TARGET_DIR"
  echo "    3. Check Desktop folder: ls -la ~/Desktop/"
  echo "    4. Verify USB files: (Check USB drive mount point)"
  echo ""
  exit 1
fi

echo "  [OK] All required files present"
echo ""

# Stage 4: Create installation directory
echo "[STAGE 4] Creating installation directories..."

mkdir -p "$MISTTRACKER_HOME"
mkdir -p "$LOG_DIR"

echo "  [OK] Created: $MISTTRACKER_HOME"
echo "  [OK] Created: $LOG_DIR"
echo ""

# Stage 5: Copy files to installation location
echo "[STAGE 5] Copying files to installation location..."

COPY_ERRORS=0
for file in "${FILES_NEEDED[@]}"; do
  SOURCE="$TARGET_DIR/$file"
  DEST="$MISTTRACKER_HOME/$file"
  
  if [ -f "$SOURCE" ]; then
    if cp "$SOURCE" "$DEST" 2>/dev/null; then
      echo "  [OK] Copied: $file"
    else
      echo "  [ERROR] Failed to copy: $file"
      ((COPY_ERRORS++))
    fi
  fi
done

if [ $COPY_ERRORS -gt 0 ]; then
  echo ""
  echo "  [ERROR] Failed to copy $COPY_ERRORS file(s)"
  exit 1
fi

echo ""

# Stage 6: Copy optional documentation
echo "[STAGE 6] Copying documentation (if available)..."

DOC_FILES=(
  "DEPLOYMENT-DEGRADED-HARDWARE-GUIDE.md"
  "PHASE-17-5-BETA-NETWORK-EXTENSION.md"
  "PHASE-17-5-BETA-NETWORK-QUICK-REFERENCE.md"
  "SETUP-INSTRUCTIONS.txt"
)

for file in "${DOC_FILES[@]}"; do
  SOURCE="$TARGET_DIR/$file"
  if [ -f "$SOURCE" ]; then
    cp "$SOURCE" "$MISTTRACKER_HOME/" 2>/dev/null || true
    echo "  [OK] Copied: $file"
  else
    echo "  [SKIP] Not found: $file"
  fi
done

echo ""

# Stage 7: Set up permissions
echo "[STAGE 7] Setting up permissions..."

chmod +x "$MISTTRACKER_HOME/validation-checklist.sh" 2>/dev/null || true
chmod +x "$MISTTRACKER_HOME/start-server.js" 2>/dev/null || true
chmod +x "$MISTTRACKER_HOME/devuan-desktop-setup.sh" 2>/dev/null || true

echo "  [OK] Script permissions set"
echo ""

# Summary
echo "=========================================================="
echo "              INSTALLATION SUCCESSFUL"
echo "=========================================================="
echo ""
echo "Installation directory: $MISTTRACKER_HOME"
echo ""
echo "Files installed:"
ls -lh "$MISTTRACKER_HOME"/*.js "$MISTTRACKER_HOME"/*.sh 2>/dev/null | awk '{print "  " $9 " (" $5 ")"}'
echo ""
echo "Next steps:"
echo "  1. Run validation checklist:"
echo "     bash $MISTTRACKER_HOME/validation-checklist.sh"
echo ""
echo "  2. Start the server:"
echo "     cd $MISTTRACKER_HOME"
echo "     NODE_OPTIONS='--max-old-space-size=512' node start-server.js 3000 &"
echo ""
echo "  3. Verify server is running:"
echo "     curl -s http://localhost:3000/health | jq ."
echo ""
echo "  4. Run hardware fitness validation:"
echo "     node $MISTTRACKER_HOME/hardware-fitness-validator.js"
echo ""
