# Extract and Push Phase 17 (PowerShell version)

param(
    [switch]$Push = $false
)

$ErrorActionPreference = "Stop"

Write-Host "================================" -ForegroundColor Cyan
Write-Host "Phase 17 Extraction & Git Push" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""

# Configuration
$CONTAINER_IMAGE = "misttracker-phase17:latest"
$GIT_BRANCH = "phase-17-implementation"
$EXTRACTION_DIR = "./phase-17-extraction"

Write-Host "Step 1: Check if container image exists" -ForegroundColor Blue
$imageExists = docker images | Select-String $CONTAINER_IMAGE
if ($imageExists) {
    Write-Host "✓ Container image found" -ForegroundColor Green
} else {
    Write-Host "Building container..." -ForegroundColor Yellow
    & ".\build-phase17-container.ps1"
}
Write-Host ""

Write-Host "Step 2: Create extraction directory" -ForegroundColor Blue
if (Test-Path $EXTRACTION_DIR) {
    Remove-Item -Recurse -Force $EXTRACTION_DIR
}
New-Item -ItemType Directory -Path $EXTRACTION_DIR | Out-Null
Write-Host "✓ Directory created: $EXTRACTION_DIR" -ForegroundColor Green
Write-Host ""

Write-Host "Step 3: Extract Phase 17 files from container" -ForegroundColor Blue
$absPath = (Resolve-Path $EXTRACTION_DIR).Path
docker run --rm -v "${absPath}:/extraction" `
    $CONTAINER_IMAGE bash -c @'
        echo "Extracting Phase 17 implementation files..."
        
        # Core physics modules
        cp /app/phase-17/MistCore.js /extraction/ 2>/dev/null || true
        cp /app/phase-17/MistCommon.js /extraction/ 2>/dev/null || true
        cp /app/phase-17/MistCausality.js /extraction/ 2>/dev/null || true
        cp /app/phase-17/Physics4DEngine.js /extraction/ 2>/dev/null || true
        cp /app/phase-17/atomic-domain-validator.js /extraction/ 2>/dev/null || true
        
        mkdir -p /extraction/server /extraction/tests /extraction/docs
        cp /app/phase-17/server/*.js /extraction/server/ 2>/dev/null || true
        cp /app/phase-17/tests/*.py /extraction/tests/ 2>/dev/null || true
        cp /app/phase-17/docs/*.md /extraction/docs/ 2>/dev/null || true
        
        echo "✓ Extraction complete"
'@

Write-Host "✓ Files extracted" -ForegroundColor Green
Write-Host ""

Write-Host "Step 4: List extracted files" -ForegroundColor Blue
Get-ChildItem -Path $EXTRACTION_DIR -Recurse -File | Select-Object FullName | Head -20
Write-Host ""

Write-Host "Step 5: Git setup" -ForegroundColor Blue
git fetch origin $GIT_BRANCH 2>$null
if ($LASTEXITCODE -ne 0) {
    Write-Host "Creating new branch: $GIT_BRANCH" -ForegroundColor Yellow
    git checkout -b $GIT_BRANCH
}

git checkout $GIT_BRANCH
Write-Host ""

Write-Host "Step 6: Copy files to repository" -ForegroundColor Blue
Copy-Item -Path "$EXTRACTION_DIR/*" -Destination "." -Recurse -Force
Write-Host "✓ Files copied" -ForegroundColor Green
Write-Host ""

Write-Host "Step 7: Stage and commit" -ForegroundColor Blue
git add .
git status
Write-Host ""

$commitMsg = @"
Phase 17 Implementation: Complete atomic physics + real-data validation

- Core modules: MistCore, MistCausality (w-domain fix), Physics engines
- Atomic validators: Phase 17 + Phase 18+ improvements
- Real-data tests: Parker Solar Probe coherence analysis
- Server infrastructure: Milestone management, swarm coordination

Codename: Laughing Einstein
Date: April 21, 2026
"@

git commit -m $commitMsg
Write-Host ""

Write-Host "Step 8: Push to GitHub" -ForegroundColor Blue
if ($Push) {
    git push origin $GIT_BRANCH
    Write-Host "✓ Pushed to $GIT_BRANCH" -ForegroundColor Green
} else {
    Write-Host "Ready to push. Run:" -ForegroundColor Yellow
    Write-Host "  git push origin $GIT_BRANCH"
    Write-Host ""
    Write-Host "Or re-run with -Push flag:" -ForegroundColor Yellow
    Write-Host "  .\extract-and-push-phase17.ps1 -Push"
}

Write-Host ""
Write-Host "✓ Complete!" -ForegroundColor Green
