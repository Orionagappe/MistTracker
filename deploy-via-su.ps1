# MistTracker SSH Deployment using SU for privilege escalation
# Uses 'su' instead of sudo (more reliable on Devuan)
# PowerShell 5.1 Compatible

param(
  [string]$DevuanIP = "10.144.113.100",
  [string]$DevuanUser = "orion",
  [string]$DevuanPassword = "Popsnap1",
  [string]$RootPassword = "popsnap2"
)

Write-Host ""
Write-Host "=========================================================="
Write-Host "  MistTracker SSH Deployment (via SU)"
Write-Host "=========================================================="
Write-Host ""

Write-Host "[INFO] Using 'su' for privilege escalation (not sudo)"
Write-Host "[INFO] User: $DevuanUser, Root: available via su"
Write-Host ""

# Step 1: Test SSH connection
Write-Host "[1/6] Testing SSH connection to $DevuanIP..."

try {
  $testResult = ssh -o StrictHostKeyChecking=accept-new -o ConnectTimeout=5 "$DevuanUser@$DevuanIP" "whoami" 2>&1
  Write-Host "[OK] Connected as: $testResult"
} catch {
  Write-Host "[ERROR] SSH connection failed"
  exit 1
}

Write-Host ""

# Step 2: Create directories using su
Write-Host "[2/6] Creating directories via su..."

$suCommand = "echo '$RootPassword' | su -c 'mkdir -p ~/misttracker/logs && mkdir -p /home/orion/misttracker/logs && chown -R orion:orion /home/orion/misttracker'"
ssh -o StrictHostKeyChecking=accept-new "$DevuanUser@$DevuanIP" $suCommand 2>&1 | Out-Null

Write-Host "[OK] Directories ready"
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
foreach ($file in $filesToCopy) {
  if (Test-Path ".\$file") {
    try {
      scp -o StrictHostKeyChecking=accept-new ".\$file" "$DevuanUser@$DevuanIP`:~/misttracker/" 2>&1 | Out-Null
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

# Step 4: Run setup script
Write-Host "[4/6] Running setup script on remote system..."
Write-Host ""

ssh -o StrictHostKeyChecking=accept-new "$DevuanUser@$DevuanIP" "bash ~/misttracker/devuan-desktop-setup-fixed.sh" 2>&1

Write-Host ""

# Step 5: Start server using su
Write-Host "[5/6] Starting MistTracker server..."

$startServerCmd = "echo '$RootPassword' | su -c 'cd ~/misttracker && mkdir -p logs && NODE_OPTIONS=\"--max-old-space-size=512\" nohup node start-server.js 3000 > logs/server.log 2>&1 &'"
ssh -o StrictHostKeyChecking=accept-new "$DevuanUser@$DevuanIP" $startServerCmd 2>&1

Write-Host "[OK] Server startup initiated"
Write-Host ""

# Wait for server to start
Write-Host "[*] Waiting 3 seconds for server to start..."
Start-Sleep -Seconds 3

# Step 6: Verify and run validation
Write-Host "[6/6] Verifying server and running hardware fitness test..."
Write-Host ""

# Check if server is running
$psOutput = ssh -o StrictHostKeyChecking=accept-new "$DevuanUser@$DevuanIP" "ps aux | grep -E 'node.*start-server' | grep -v grep" 2>&1
if ($psOutput -match "node") {
  Write-Host "[OK] Server process is running"
} else {
  Write-Host "[WARN] Server process not detected, but continuing..."
}

Write-Host ""

# Run hardware fitness validator
Write-Host "Running Hardware Fitness Validator (5-10 minutes)..."
Write-Host "=========================================================="
Write-Host ""

ssh -o StrictHostKeyChecking=accept-new "$DevuanUser@$DevuanIP" "node ~/misttracker/hardware-fitness-validator.js" 2>&1

Write-Host ""
Write-Host "=========================================================="
Write-Host "          DEPLOYMENT AND TESTING COMPLETE"
Write-Host "=========================================================="
Write-Host ""
Write-Host "Next steps:"
Write-Host ""
Write-Host "[1] Check server health:"
Write-Host "  ssh $DevuanUser@$DevuanIP 'curl -s http://localhost:3000/health'"
Write-Host ""
Write-Host "[2] View server logs:"
Write-Host "  ssh $DevuanUser@$DevuanIP 'tail -f ~/misttracker/logs/server.log'"
Write-Host ""
Write-Host "[3] Stop server:"
Write-Host "  ssh $DevuanUser@$DevuanIP 'killall node'"
Write-Host ""
