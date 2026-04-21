# Build Phase 17 Docker Container (PowerShell)
# Usage: .\build-phase17-container.ps1 [-Push]

param(
    [switch]$Push = $false
)

$ErrorActionPreference = "Stop"

Write-Host "================================" -ForegroundColor Cyan
Write-Host "Phase 17 Container Build Script" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""

# Container details
$CONTAINER_NAME = "misttracker-phase17"
$CONTAINER_TAG = "latest"
$CONTAINER_IMAGE = "${CONTAINER_NAME}:${CONTAINER_TAG}"

Write-Host "Phase 17 Docker Build Configuration" -ForegroundColor Blue
Write-Host "Image: $CONTAINER_IMAGE"
Write-Host "Dockerfile: ./Dockerfile"
Write-Host ""

# Step 1: Check if Docker is installed
Write-Host "[1/5] Checking Docker installation..." -ForegroundColor Blue
try {
    $dockerVersion = docker --version
    Write-Host "✓ Docker found: $dockerVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Docker not found. Please install Docker first." -ForegroundColor Red
    exit 1
}
Write-Host ""

# Step 2: Check required files
Write-Host "[2/5] Verifying required Phase 17 files..." -ForegroundColor Blue
$requiredFiles = @(
    "MistCore.js",
    "MistCommon.js",
    "MistCausality.js",
    "atomic-domain-validator.js",
    "test_1_coherence_frequencies.py",
    "run_phase_17_tests.py"
)

$missingFiles = @()
foreach ($file in $requiredFiles) {
    if (Test-Path $file) {
        Write-Host "✓ $file" -ForegroundColor Green
    } else {
        Write-Host "⚠ $file (missing)" -ForegroundColor Yellow
        $missingFiles += $file
    }
}
Write-Host ""

# Step 3: Build Docker image
Write-Host "[3/5] Building Docker image..." -ForegroundColor Blue
Write-Host "Command: docker build -t $CONTAINER_IMAGE -f Dockerfile ."
Write-Host ""

try {
    docker build -t $CONTAINER_IMAGE -f Dockerfile .
} catch {
    Write-Host "❌ Docker build failed" -ForegroundColor Red
    exit 1
}
Write-Host "✓ Docker image built successfully" -ForegroundColor Green
Write-Host ""

# Step 4: Display image info
Write-Host "[4/5] Image Information" -ForegroundColor Blue
docker images | Select-String $CONTAINER_NAME
Write-Host ""

# Step 5: Ready
Write-Host "[5/5] Container Ready" -ForegroundColor Blue
Write-Host ""
Write-Host "Next steps:"
Write-Host ""
Write-Host "  1. Run tests:"
Write-Host "     docker run --rm $CONTAINER_IMAGE test"
Write-Host ""
Write-Host "  2. Run coherence analysis (real PSP data):"
Write-Host "     docker run --rm $CONTAINER_IMAGE coherence --date 2021-06-15"
Write-Host ""
Write-Host "  3. Extract Phase 17 files:"
Write-Host "     docker run --rm $CONTAINER_IMAGE extract"
Write-Host ""
Write-Host "  4. Interactive shell:"
Write-Host "     docker run --rm -it $CONTAINER_IMAGE bash"
Write-Host ""
Write-Host "  5. Run with docker-compose (to mount volumes):"
Write-Host "     docker-compose up"
Write-Host ""

if ($Push) {
    Write-Host "Push to registry: docker push $CONTAINER_IMAGE" -ForegroundColor Yellow
}

Write-Host "✓ Build complete!" -ForegroundColor Green
