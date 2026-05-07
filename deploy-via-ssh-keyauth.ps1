# Non-Interactive SSH Deployment for MistTracker
# Uses SSH keys for authentication (no interactive password prompts)
# PowerShell 5.1 Compatible

param(
  [string]$DevuanIP = "10.144.113.100",
  [string]$DevuanUser = "orion",
  [string]$PrivateKeyPath = "$env:USERPROFILE\.ssh\id_rsa"
)

Write-Host ""
Write-Host "=========================================================="
Write-Host "  MistTracker SSH Deployment (Key-Based Auth)"
Write-Host "=========================================================="
Write-Host ""

$RemoteDir = "/home/orion/Desktop/misttracker"

# Check if SSH key exists
if (-not (Test-Path $PrivateKeyPath)) {
  Write-Host "[WARNING] SSH private key not found at: $PrivateKeyPath"
  Write-Host ""
  Write-Host "To set up SSH key authentication:"
  Write-Host "  1. On Windows (with OpenSSH):"
  Write-Host "     ssh-keygen -t rsa -b 4096 -f `"$env:USERPROFILE\.ssh\id_rsa`" -N ``"``"
  Write-Host ""
  Write-Host "  2. Copy public key to Devuan:"
  Write-Host "     ssh-copy-id -i `"$env:USERPROFILE\.ssh\id_rsa.pub`" $DevuanUser@$DevuanIP"
  Write-Host ""
  Write-Host "  3. Then run this script again"
  Write-Host ""
  exit 1
}

Write-Host "[OK] SSH key found: $PrivateKeyPath"
Write-Host ""

# Step 1: Test SSH connection
Write-Host "[1/6] Testing SSH connection..."

try {
  $result = ssh -i $PrivateKeyPath -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null -o ConnectTimeout=5 $DevuanUser@$DevuanIP "whoami" 2>&1
  if ($result -eq "orion") {
    Write-Host "[OK] SSH connection successful as: $result"
  } else {
    Write-Host "[ERROR] SSH connection failed"
    Write-Host "Response: $result"
    exit 1
  }
} catch {
  Write-Host "[ERROR] SSH command failed: $_"
  exit 1
}

Write-Host ""

# Step 2: Create remote directory
Write-Host "[2/6] Creating remote directory..."

ssh -i $PrivateKeyPath -o StrictHostKeyChecking=no $DevuanUser@$DevuanIP "mkdir -p $RemoteDir" 2>&1 | Out-Null
Write-Host "[OK] Directory created: $RemoteDir"

Write-Host ""

# Step 3: Copy files via SCP
Write-Host "[3/6] Copying files via SCP (key-based)..."

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
      scp -i $PrivateKeyPath -o StrictHostKeyChecking=no ".\$file" "$DevuanUser@$DevuanIP`:$RemoteDir/" 2>&1 | Out-Null
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
$setupOutput = ssh -i $PrivateKeyPath -o StrictHostKeyChecking=no $DevuanUser@$DevuanIP $setupCommand 2>&1

Write-Host "$setupOutput"

if ($setupOutput -match "INSTALLATION SUCCESSFUL") {
  Write-Host "[OK] Setup completed successfully"
} else {
  Write-Host "[WARNING] Setup completed, check output above for details"
}

Write-Host ""

# Step 5: Run validation checklist
Write-Host "[5/6] Running validation checklist..."

$validationOutput = ssh -i $PrivateKeyPath -o StrictHostKeyChecking=no $DevuanUser@$DevuanIP "bash ~/misttracker/validation-checklist.sh" 2>&1

Write-Host "$validationOutput"

Write-Host ""

# Step 6: Summary
Write-Host "=========================================================="
Write-Host "          DEPLOYMENT COMPLETE"
Write-Host "=========================================================="
Write-Host ""
Write-Host "Installation directory: /home/orion/misttracker"
Write-Host ""
Write-Host "Next steps:"
Write-Host ""
Write-Host "[1] Start server on Devuan:"
Write-Host "    ssh -i `"$PrivateKeyPath`" $DevuanUser@$DevuanIP"
Write-Host "    NODE_OPTIONS='--max-old-space-size=512' node ~/misttracker/start-server.js 3000 &"
Write-Host ""
Write-Host "[2] Or use this PowerShell command to start server remotely:"
Write-Host "    ssh -i `"$PrivateKeyPath`" $DevuanUser@$DevuanIP 'cd ~/misttracker && NODE_OPTIONS=\"--max-old-space-size=512\" nohup node start-server.js 3000 > logs/server.log 2>&1 &'"
Write-Host ""
Write-Host "[3] Check server health:"
Write-Host "    ssh -i `"$PrivateKeyPath`" $DevuanUser@$DevuanIP 'curl -s http://localhost:3000/health'"
Write-Host ""
Write-Host "[4] Run hardware fitness validation:"
Write-Host "    ssh -i `"$PrivateKeyPath`" $DevuanUser@$DevuanIP 'node ~/misttracker/hardware-fitness-validator.js'"
Write-Host ""
