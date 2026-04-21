#!/bin/bash
# Build Phase 17 Docker Container
# Usage: ./build-phase17-container.sh [--push]

set -e

echo "================================"
echo "Phase 17 Container Build Script"
echo "================================"
echo ""

# Color codes
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Container details
CONTAINER_NAME="misttracker-phase17"
CONTAINER_TAG="latest"
CONTAINER_IMAGE="${CONTAINER_NAME}:${CONTAINER_TAG}"

echo -e "${BLUE}Phase 17 Docker Build Configuration${NC}"
echo "Image: $CONTAINER_IMAGE"
echo "Dockerfile: ./Dockerfile"
echo ""

# Step 1: Check if Docker is installed
echo -e "${BLUE}[1/5] Checking Docker installation...${NC}"
if ! command -v docker &> /dev/null; then
    echo "❌ Docker not found. Please install Docker first."
    exit 1
fi
echo -e "${GREEN}✓ Docker found: $(docker --version)${NC}"
echo ""

# Step 2: Check required files
echo -e "${BLUE}[2/5] Verifying required Phase 17 files...${NC}"
REQUIRED_FILES=(
    "MistCore.js"
    "MistCommon.js"
    "MistCausality.js"
    "atomic-domain-validator.js"
    "test_1_coherence_frequencies.py"
    "run_phase_17_tests.py"
)

MISSING_FILES=()
for file in "${REQUIRED_FILES[@]}"; do
    if [ -f "$file" ]; then
        echo -e "${GREEN}✓ $file${NC}"
    else
        echo -e "${YELLOW}⚠ $file (missing, will be skipped)${NC}"
        MISSING_FILES+=("$file")
    fi
done
echo ""

# Step 3: Build Docker image
echo -e "${BLUE}[3/5] Building Docker image...${NC}"
echo "Command: docker build -t $CONTAINER_IMAGE -f Dockerfile ."
echo ""

docker build -t $CONTAINER_IMAGE -f Dockerfile . || {
    echo -e "${RED}❌ Docker build failed${NC}"
    exit 1
}
echo -e "${GREEN}✓ Docker image built successfully${NC}"
echo ""

# Step 4: Display image info
echo -e "${BLUE}[4/5] Image Information${NC}"
docker images | grep $CONTAINER_NAME
echo ""

# Step 5: Quick test (optional)
echo -e "${BLUE}[5/5] Container Ready${NC}"
echo ""
echo "Next steps:"
echo ""
echo "  1. Run tests:"
echo "     docker run --rm $CONTAINER_IMAGE test"
echo ""
echo "  2. Run coherence analysis (real PSP data):"
echo "     docker run --rm $CONTAINER_IMAGE coherence --date 2021-06-15 --duration 48"
echo ""
echo "  3. Extract Phase 17 files:"
echo "     docker run --rm $CONTAINER_IMAGE extract"
echo ""
echo "  4. Interactive shell:"
echo "     docker run --rm -it $CONTAINER_IMAGE bash"
echo ""
echo "  5. Run with docker-compose (to mount volumes):"
echo "     docker-compose up"
echo ""

# Optional: Push to registry
if [ "$1" = "--push" ]; then
    echo -e "${YELLOW}Note: Add --push flag to push to Docker registry after build${NC}"
fi

echo -e "${GREEN}✓ Build complete!${NC}"
