# MistTracker SSH Deployment 
# Handles both root and user authentication
# PowerShell 5.1 Compatible

param(
  [string]$DevuanIP = "10.144.113.100",
  [string]$ConnectUser = "orion",  # User to connect as
  [string]$ConnectPassword = "Popsnap1",  # orion password
  [string]$RootPassword = "",  # Root password if needed (leave empty to prompt)
  [switch]$UseRootAuth
)

Write-Host ""
Write-Host "=========================================================="
Write-Host "  MistTracker SSH Deployment"
Write-Host "=========================================================="
Write-Host ""

if ($UseRootAuth) {
  Write-Host "[INFO] Using root authentication"
  if ([string]::IsNullOrEmpty($RootPassword)) {
    Write-Host "Enter root password for $DevuanIP"
    $RootPassword = Read-Host -AsSecureString "Root password"
    $RootPassword = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto([System.Runtime.InteropServices.Marshal]::SecureStringToCoTaskMemUni($RootPassword))
  }
  $AuthUser = "root"
  $AuthPassword = $RootPassword
} else {
  Write-Host "[INFO] Using user authentication as: $ConnectUser"
  $AuthUser = $ConnectUser
  $AuthPassword = $ConnectPassword
}

$RemoteDir = "/home/orion/Desktop/misttracker"

Write-Host ""
Write-Host "[1/5] Testing SSH connection..."

try {
  $testResult = ssh -o StrictHostKeyChecking=accept-new -o ConnectTimeout=5 "$AuthUser@$DevuanIP" "whoami" 2>&1
  Write-Host "[OK] Connected as: $testResult"
} catch {
  Write-Host "[ERROR] SSH connection failed"
  Write-Host "Make sure:"
  Write-Host "  1. Devuan SSH service is running"
  Write-Host "  2. IP address is correct: $DevuanIP"
  Write-Host "  3. Username is correct: $AuthUser"
  Write-Host ""
  exit 1
}

Write-Host ""
Write-Host "[2/5] Creating remote directory..."

ssh -o StrictHostKeyChecking=accept-new "$AuthUser@$DevuanIP" "mkdir -p $RemoteDir" 2>&1 | Out-Null
ssh -o StrictHostKeyChecking=accept-new "$AuthUser@$DevuanIP" "mkdir -p ~/misttracker/logs" 2>&1 | Out-Null

Write-Host "[OK] Directories ready"
Write-Host ""

# Step 3: Copy files
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
      scp -o StrictHostKeyChecking=accept-new ".\$file" "$AuthUser@$DevuanIP`:$RemoteDir/" 2>&1 | Out-Null
      Write-Host "[OK] $file"
      $copiedCount++
    } catch {
      Write-Host "[SKIP] $file"
    }
  }
}

Write-Host ""
Write-Host "Copied: $copiedCount files"
Write-Host ""

# Step 4: Run setup
Write-Host "[4/5] Running remote setup script..."
Write-Host ""

$setupCmd = "bash $RemoteDir/devuan-desktop-setup-fixed.sh"
$setupOutput = ssh -o StrictHostKeyChecking=accept-new "$AuthUser@$DevuanIP" $setupCmd 2>&1

Write-Host $setupOutput

Write-Host ""

# Step 5: Verify
Write-Host "[5/5] Verifying installation..."

$verifyOutput = ssh -o StrictHostKeyChecking=accept-new "$AuthUser@$DevuanIP" "ls -1 ~/misttracker/*.js | wc -l" 2>&1
$fileCount = [int]$verifyOutput.Trim()

Write-Host "[OK] Found $fileCount JavaScript files in ~/misttracker"
Write-Host ""

Write-Host "=========================================================="
Write-Host "          DEPLOYMENT COMPLETE"
Write-Host "=========================================================="
Write-Host ""
Write-Host "Installation: /home/orion/misttracker"
Write-Host "Connected as: $AuthUser@$DevuanIP"
Write-Host ""
Write-Host "Next steps:"
Write-Host ""
Write-Host "[1] Run validation checklist:"
Write-Host "  ssh $AuthUser@$DevuanIP 'bash ~/misttracker/validation-checklist.sh'"
Write-Host ""
Write-Host "[2] Start server:"
Write-Host "  ssh $AuthUser@$DevuanIP 'cd ~/misttracker && NODE_OPTIONS=\"--max-old-space-size=512\" nohup node start-server.js 3000 > logs/server.log 2>&1 &'"
Write-Host ""
Write-Host "[3] Check server health:"
Write-Host "  ssh $AuthUser@$DevuanIP 'curl -s http://localhost:3000/health'"
Write-Host ""
Write-Host "[4] Run hardware fitness validation:"
Write-Host "  ssh $AuthUser@$DevuanIP 'node ~/misttracker/hardware-fitness-validator.js'"
Write-Host ""
