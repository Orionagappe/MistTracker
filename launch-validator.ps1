# Deploy and launch validator with output to file (non-interactive)
# Uses su escalation method that was previously successful

param(
  [string]$DevuanIP = "10.144.113.100",
  [string]$DevuanUser = "orion",
  [string]$RootPassword = "popsnap2"
)

Write-Host ""
Write-Host "=========================================================="
Write-Host "  MistTracker - Background Validator Launch"
Write-Host "=========================================================="
Write-Host ""

# Single-line command that runs validator in background with output saved
$cmd = "echo '$RootPassword' | su -c 'cd ~/misttracker && nohup node hardware-fitness-validator.js > logs/validator-results-`$(date +%s).txt 2>&1 &'"

Write-Host "[*] Launching validator in background on $DevuanIP..."
Write-Host ""

$output = ssh -o StrictHostKeyChecking=accept-new "$DevuanUser@$DevuanIP" $cmd 2>&1

Write-Host $output
Write-Host ""

if ($LASTEXITCODE -eq 0) {
  Write-Host "[OK] Validator launch command executed"
  Write-Host ""
  Write-Host "Results will be saved to:"
  Write-Host "  ~/misttracker/logs/validator-results-*.txt"
  Write-Host ""
  Write-Host "Retrieve when ready with:"
  Write-Host "  scp orion@$DevuanIP`:~/misttracker/logs/validator-results-*.txt ."
  Write-Host ""
} else {
  Write-Host "[ERROR] Launch failed with exit code: $LASTEXITCODE"
}

Write-Host "=========================================================="
Write-Host ""
