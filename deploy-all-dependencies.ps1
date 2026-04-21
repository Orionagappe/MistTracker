# Deploy all MistTracker dependencies to Devuan system
# Includes all Phase 17.5-Beta modules needed by hardware-fitness-validator

param(
  [string]$DevuanIP = "10.144.113.100",
  [string]$DevuanUser = "orion",
  [string]$DevuanPath = "/home/orion/Desktop/misttracker",
  [string]$SourceDir = "."
)

Write-Host ""
Write-Host "=========================================================="
Write-Host "  MistTracker - Deploy All Dependencies"
Write-Host "=========================================================="
Write-Host ""

# All required files for hardware-fitness-validator
$requiredFiles = @(
  # Core validator
  "hardware-fitness-validator.js",
  
  # Extended aggregator and dependencies
  "phase-17-5-beta-extended-aggregator.js",
  "phase-17-5-beta-aggregator.js",
  "phase-17-5-beta-cve-forecaster.js",
  "phase-17-5-beta-friction-predictor.js",
  "phase-17-5-beta-stability-modeler.js",
  
  # Network predictor
  "phase-17-5-beta-network-predictor.js"
)

Write-Host "[*] Checking local files..."
$missingFiles = @()

foreach ($file in $requiredFiles) {
  $filePath = Join-Path $SourceDir $file
  if (-not (Test-Path $filePath)) {
    Write-Host "  [MISSING] $file"
    $missingFiles += $file
  } else {
    Write-Host "  [OK] $file"
  }
}

Write-Host ""

if ($missingFiles.Count -gt 0) {
  Write-Host "[ERROR] $($missingFiles.Count) file(s) missing. Cannot proceed."
  exit 1
}

Write-Host "[*] Deploying to $DevuanUser@$DevuanIP`:$DevuanPath"
Write-Host ""

# Copy each file via SCP
$successCount = 0
$failureCount = 0

foreach ($file in $requiredFiles) {
  $localPath = Join-Path $SourceDir $file
  $remotePath = "$DevuanUser@$DevuanIP`:$DevuanPath/"
  
  Write-Host "  Copying: $file"
  
  $output = scp -o StrictHostKeyChecking=accept-new "$localPath" "$remotePath" 2>&1
  
  if ($LASTEXITCODE -eq 0) {
    Write-Host "    [OK]"
    $successCount++
  } else {
    Write-Host "    [FAILED] $output"
    $failureCount++
  }
}

Write-Host ""
Write-Host "[SUMMARY] $successCount deployed, $failureCount failed"
Write-Host ""

if ($failureCount -eq 0) {
  Write-Host "[OK] All files deployed successfully!"
  Write-Host ""
  Write-Host "Next: Run hardware-fitness-validator from Devuan:"
  Write-Host "  cd $DevuanPath"
  Write-Host "  node hardware-fitness-validator.js"
  Write-Host ""
} else {
  Write-Host "[ERROR] Some files failed to deploy"
  exit 1
}

Write-Host "=========================================================="
