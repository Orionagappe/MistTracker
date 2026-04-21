# Simple SSH Deployment for MistTracker
# Uses password authentication (prompts once per command)
# PowerShell 5.1 Compatible

param(
  [string]$DevuanIP = "10.144.113.100",
  [string]$DevuanUser = "orion",
  [string]$DevuanPassword = "Popsnap1"
)

Write-Host ""
Write-Host "=========================================================="
Write-Host "  MistTracker SSH Deployment (Password Auth)"
Write-Host "=========================================================="
Write-Host ""

$RemoteDir = "/home/orion/Desktop/misttracker"

# Test SSH connection first
Write-Host "[1/5] Testing SSH connection to $DevuanIP..."
Write-Host "[NOTE] First connection may prompt to accept host key"
Write-Host ""

$testCmd = "ssh -o StrictHostKeyChecking=accept-new -o ConnectTimeout=5 $DevuanUser@$DevuanIP 'whoami'"
Write-Host "Testing: $testCmd"
Write-Host ""

# Step 1: Create remote directory
Write-Host "[2/5] Creating remote directory..."
ssh -o StrictHostKeyChecking=accept-new $DevuanUser@$DevuanIP "mkdir -p $RemoteDir" 2>&1 | Out-Null
Write-Host "[OK] Directory ready: $RemoteDir"
Write-Host ""

# Step 2: Copy files via SCP
Write-Host "[3/5] Copying MistTracker files via SCP..."

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
foreach ($file in $filesToCopy) {
  if (Test-Path ".\$file") {
    try {
      scp -o StrictHostKeyChecking=accept-new ".\$file" "$DevuanUser@$DevuanIP`:$RemoteDir/" 2>&1 | Out-Null
      Write-Host "[OK] $file"
      $copiedCount++
    } catch {
      Write-Host "[SKIP] $file (error)"
    }
  }
}

Write-Host ""
Write-Host "Copied: $copiedCount files"
Write-Host ""

# Step 3: Run setup script
Write-Host "[4/5] Running setup script on remote system..."
Write-Host ""

$setupOutput = ssh -o StrictHostKeyChecking=accept-new $DevuanUser@$DevuanIP "bash $RemoteDir/devuan-desktop-setup-fixed.sh" 2>&1
Write-Host $setupOutput

Write-Host ""

# Step 4: Verify installation
Write-Host "[5/5] Verifying installation..."

$verifyOutput = ssh -o StrictHostKeyChecking=accept-new $DevuanUser@$DevuanIP "ls -lh ~/misttracker/" 2>&1
Write-Host $verifyOutput

Write-Host ""
Write-Host "=========================================================="
Write-Host "          DEPLOYMENT COMPLETE"
Write-Host "=========================================================="
Write-Host ""
Write-Host "Installation directory: /home/orion/misttracker"
Write-Host ""
Write-Host "Next operations (choose one):"
Write-Host ""
Write-Host "[A] Start server on Devuan:"
Write-Host "    ssh $DevuanUser@$DevuanIP 'cd ~/misttracker && NODE_OPTIONS=\"--max-old-space-size=512\" nohup node start-server.js 3000 > logs/server.log 2>&1 &'"
Write-Host ""
Write-Host "[B] Run hardware fitness validation:"
Write-Host "    ssh $DevuanUser@$DevuanIP 'node ~/misttracker/hardware-fitness-validator.js'"
Write-Host ""
Write-Host "[C] Check server health:"
Write-Host "    ssh $DevuanUser@$DevuanIP 'curl -s http://localhost:3000/health'"
Write-Host ""
Write-Host "Or use: .\remote-operations.ps1"
Write-Host ""
