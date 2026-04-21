# Deploy MistTracker to Devuan via SSH
# PowerShell 5.1 Compatible Version
# Uses SCP for file transfer and SSH for remote execution

$DevuanIP = "10.144.113.100"
$DevuanUser = "orion"
$DevuanPassword = "Popsnap1"
$RemoteDir = "/home/orion/Desktop/misttracker"

Write-Host ""
Write-Host "=========================================================="
Write-Host "  MistTracker SSH Deployment Script"
Write-Host "=========================================================="
Write-Host ""

# Step 1: Verify SSH connectivity
Write-Host "[1/6] Checking SSH connectivity to $DevuanIP..."

try {
  $result = ssh -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null -o ConnectTimeout=5 $DevuanUser@$DevuanIP "echo SSH_OK" 2>&1
  if ($result -match "SSH_OK") {
    Write-Host "[OK] SSH connection successful"
  } else {
    Write-Host "[ERROR] SSH connection failed"
    Write-Host "Response: $result"
    exit 1
  }
} catch {
  Write-Host "[ERROR] SSH command failed: $_"
  Write-Host ""
  Write-Host "Troubleshooting:"
  Write-Host "  1. Verify SSH is running on Devuan"
  Write-Host "  2. Check IP address: $DevuanIP"
  Write-Host "  3. Check credentials: $DevuanUser"
  Write-Host "  4. Verify firewall allows port 22"
  exit 1
}

Write-Host ""

# Step 2: Create remote directory
Write-Host "[2/6] Creating remote directory..."

ssh -o StrictHostKeyChecking=no $DevuanUser@$DevuanIP "mkdir -p $RemoteDir" 2>&1 | Out-Null
Write-Host "[OK] Directory created: $RemoteDir"

Write-Host ""

# Step 3: Copy files via SCP
Write-Host "[3/6] Copying MistTracker files via SCP..."

$filesToCopy = @(
  "phase-17-5-beta-network-predictor.js",
  "phase-17-5-beta-extended-aggregator.js",
  "hardware-fitness-validator.js",
  "validation-checklist.sh",
  "devuan-desktop-setup-fixed.sh",
  "start-server.js",
  "deploy-devuan.sh",
  "DEPLOYMENT-DEGRADED-HARDWARE-GUIDE.md",
  "PHASE-17-5-BETA-NETWORK-EXTENSION.md",
  "PHASE-17-5-BETA-NETWORK-QUICK-REFERENCE.md"
)

$copiedCount = 0
$skippedCount = 0

foreach ($file in $filesToCopy) {
  if (Test-Path ".\$file") {
    try {
      scp -o StrictHostKeyChecking=no ".\$file" "${DevuanUser}@${DevuanIP}:${RemoteDir}/" 2>&1 | Out-Null
      Write-Host "[OK] Copied: $file"
      $copiedCount++
    } catch {
      Write-Host "[ERROR] Failed to copy: $file"
    }
  } else {
    Write-Host "[SKIP] Not found: $file"
    $skippedCount++
  }
}

Write-Host ""
Write-Host "Summary: Copied $copiedCount files"
if ($skippedCount -gt 0) {
  Write-Host "Warning: Skipped $skippedCount files (not found locally)"
}

Write-Host ""

# Step 4: Run remote setup script
Write-Host "[4/6] Running remote setup script..."

$setupCommand = "bash $RemoteDir/devuan-desktop-setup-fixed.sh"

$setupOutput = ssh -o StrictHostKeyChecking=no $DevuanUser@$DevuanIP $setupCommand 2>&1

Write-Host "$setupOutput"

if ($setupOutput -match "INSTALLATION SUCCESSFUL") {
  Write-Host "[OK] Setup completed successfully"
} else {
  Write-Host "[WARNING] Setup completed, but check output above"
}

Write-Host ""

# Step 5: Run validation checklist
Write-Host "[5/6] Running validation checklist..."

$validationOutput = ssh -o StrictHostKeyChecking=no $DevuanUser@$DevuanIP "bash ~/misttracker/validation-checklist.sh" 2>&1

Write-Host "$validationOutput"

Write-Host ""

# Step 6: Summary and next steps
Write-Host "=========================================================="
Write-Host "          DEPLOYMENT COMPLETE"
Write-Host "=========================================================="
Write-Host ""
Write-Host "Installation directory: /home/orion/misttracker"
Write-Host ""
Write-Host "Next steps on Devuan:"
Write-Host ""
Write-Host "[SSH] Start the server:"
Write-Host "  ssh orion@$DevuanIP"
Write-Host "  NODE_OPTIONS='--max-old-space-size=512' node ~/misttracker/start-server.js 3000 &"
Write-Host ""
Write-Host "[SSH] Test server health:"
Write-Host "  ssh orion@$DevuanIP 'curl -s http://localhost:3000/health'"
Write-Host ""
Write-Host "[SSH] Run hardware fitness validation:"
Write-Host "  ssh orion@$DevuanIP 'node ~/misttracker/hardware-fitness-validator.js'"
Write-Host ""
Write-Host "Or use PowerShell remoting below:"
Write-Host ""
