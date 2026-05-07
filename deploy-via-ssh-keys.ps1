# Deploy MistTracker dependencies via secure SSH key authentication
# Non-interactive deployment for automation

param(
  [string]$DevuanIP = "10.144.113.100",
  [string]$DevuanUser = "orion",
  [string]$DevuanPath = "/home/orion/Desktop/misttracker",
  [string]$SourceDir = "."
)

Write-Host ""
Write-Host "=========================================================="
Write-Host "  MistTracker - Automated SSH Key Deployment"
Write-Host "=========================================================="
Write-Host ""

$requiredFiles = @(
  "hardware-fitness-validator.js",
  "phase-17-5-beta-extended-aggregator.js",
  "phase-17-5-beta-aggregator.js",
  "phase-17-5-beta-cve-forecaster.js",
  "phase-17-5-beta-friction-predictor.js",
  "phase-17-5-beta-stability-modeler.js",
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
  Write-Host "[ERROR] $($missingFiles.Count) file(s) missing"
  exit 1
}

Write-Host "[*] Deploying to $DevuanUser@$DevuanIP`:$DevuanPath"
Write-Host ""

$successCount = 0
$failureCount = 0

foreach ($file in $requiredFiles) {
  $localPath = Join-Path $SourceDir $file
  $remotePath = "$DevuanUser@$DevuanIP`:$DevuanPath/"
  
  Write-Host "  Copying: $file"
  
  # Use BatchMode=yes for non-interactive deployment (uses SSH keys, no passwords)
  $output = scp -o StrictHostKeyChecking=accept-new -o BatchMode=yes "$localPath" "$remotePath" 2>&1
  
  if ($LASTEXITCODE -eq 0) {
    Write-Host "    [OK]"
    $successCount++
  } else {
    Write-Host "    [FAILED]"
    $failureCount++
  }
}

Write-Host ""
Write-Host "[SUMMARY] $successCount deployed, $failureCount failed"
Write-Host ""

if ($failureCount -eq 0) {
  Write-Host "[OK] All files deployed via SSH key authentication!"
  Write-Host ""
  Write-Host "Next: Run validator from Devuan:"
  Write-Host "  ssh orion@$DevuanIP `"cd $DevuanPath ; node hardware-fitness-validator.js`""
  Write-Host ""
} else {
  Write-Host "[ERROR] Some files failed to deploy"
  exit 1
}

Write-Host "=========================================================="
