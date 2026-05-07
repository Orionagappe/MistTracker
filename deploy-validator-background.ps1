# Deploy and run hardware fitness validator in background
# Results will be saved to ~/misttracker/logs/validator-results-*.txt
# Retrieve results later using: scp orion@10.144.113.100:~/misttracker/logs/validator-results-*.txt .

param(
  [string]$DevuanIP = "10.144.113.100",
  [string]$DevuanUser = "orion",
  [string]$DevuanPassword = "Popsnap1",
  [string]$RootPassword = "popsnap2"
)

Write-Host ""
Write-Host "=========================================================="
Write-Host "  MistTracker - Background Validator Deployment"
Write-Host "=========================================================="
Write-Host ""

# Step 1: Transfer the background runner script
Write-Host "[1/3] Transferring runner script..."

$localScript = ".\run-validator-background.sh"
$remoteDir = "/home/orion/misttracker"

if (-not (Test-Path $localScript)) {
  Write-Host "[ERROR] Script not found: $localScript"
  exit 1
}

Write-Host "  Copying: $localScript -> $DevuanUser@$DevuanIP`:$remoteDir/"

scp -o StrictHostKeyChecking=accept-new "$localScript" "$DevuanUser@$DevuanIP`:$remoteDir/" 2>&1 | Out-Null

if ($LASTEXITCODE -eq 0) {
  Write-Host "  [OK] Script transferred"
} else {
  Write-Host "  [ERROR] SCP failed"
  exit 1
}

Write-Host ""

# Step 2: Launch validator in background via su
Write-Host "[2/3] Launching validator in background..."

$runCmd = "echo '$RootPassword' | su -c `"cd ~/misttracker && nohup bash run-validator-background.sh > ~/misttracker/logs/background-runner.log 2>&1 &`""

ssh -o StrictHostKeyChecking=accept-new "$DevuanUser@$DevuanIP" $runCmd 2>&1 | Out-Null

Write-Host "  [OK] Validator launch command sent"
Write-Host "  Process will run in background on Devuan"
Write-Host ""

# Step 3: Instructions for retrieving results
Write-Host "[3/3] Next Steps"
Write-Host "=========================================================="
Write-Host ""
Write-Host "The hardware fitness validator is now running in the"
Write-Host "background on the Devuan system. Results will be saved to:"
Write-Host ""
Write-Host "  ~/misttracker/logs/validator-results-YYYYMMDD_HHMMSS.txt"
Write-Host ""
Write-Host "To retrieve results when ready, run:"
Write-Host ""
Write-Host "  scp orion@$DevuanIP`:~/misttracker/logs/validator-results-*.txt ."
Write-Host ""
Write-Host "Or retrieve the background log:"
Write-Host ""
Write-Host "  scp orion@$DevuanIP`:~/misttracker/logs/background-runner.log ."
Write-Host ""
Write-Host "Expected runtime: 5-10 minutes"
Write-Host ""
Write-Host "=========================================================="
Write-Host ""
