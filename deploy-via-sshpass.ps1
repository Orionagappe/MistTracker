# MistTracker SSH Deployment using SU for privilege escalation
# Fixed: Proper PowerShell string escaping
# PowerShell 5.1 Compatible

param(
  [string]$DevuanIP = "10.144.113.100",
  [string]$DevuanUser = "orion",
  [string]$DevuanPassword = "Popsnap1",
  [string]$RootPassword = "popsnap2"
)

Write-Host ""
Write-Host "=========================================================="
Write-Host "  MistTracker SSH Deployment (via SU - Fixed)"
Write-Host "=========================================================="
Write-Host ""

Write-Host "[INFO] Using 'su' for privilege escalation (not sudo)"
Write-Host "[INFO] User: $DevuanUser"
Write-Host ""

# Step 1: Test SSH connection
Write-Host "[1/4] Testing SSH connection..."

$testCmd = sshpass -p 'Popsnap1' ssh -o StrictHostKeyChecking=accept-new "$DevuanUser@$DevuanIP" "whoami" 2>&1
if ($testCmd -match "orion") {
  Write-Host "[OK] Connected as: $testCmd"
} else {
  Write-Host "[ERROR] SSH connection failed"
  exit 1
}

Write-Host ""

# Step 2: Start server with su privilege escalation
Write-Host "[2/4] Starting MistTracker server..."

$suCmd = "echo '$RootPassword' | su -c `"mkdir -p ~/misttracker/logs && cd ~/misttracker && NODE_OPTIONS=--max-old-space-size=512 nohup node start-server.js 3000 > logs/server.log 2>&1 &`""

sshpass -p 'Popsnap1' ssh -o StrictHostKeyChecking=accept-new "$DevuanUser@$DevuanIP" $suCmd 2>&1 | Out-Null

Write-Host "[OK] Server startup command sent"
Write-Host ""

# Step 3: Wait and verify server is running
Write-Host "[3/4] Waiting 3 seconds for server to start..."
Start-Sleep -Seconds 3

$psCmd = "ps aux | grep -E 'node.*start-server' | grep -v grep"
$psOutput = sshpass -p 'Popsnap1' ssh -o StrictHostKeyChecking=accept-new "$DevuanUser@$DevuanIP" $psCmd 2>&1

if ($psOutput -match "node") {
  Write-Host "[OK] Server is running"
} else {
  Write-Host "[WARN] Server process not detected, but continuing..."
}

Write-Host ""

# Step 4: Run hardware fitness validator (5-10 minutes)
Write-Host "[4/4] Running Hardware Fitness Validator..."
Write-Host "=========================================================="
Write-Host ""

sshpass -p 'Popsnap1' ssh -o StrictHostKeyChecking=accept-new "$DevuanUser@$DevuanIP" "node ~/misttracker/hardware-fitness-validator.js" 2>&1

Write-Host ""
Write-Host "=========================================================="
Write-Host "          DEPLOYMENT AND TESTING COMPLETE"
Write-Host "=========================================================="
Write-Host ""
Write-Host "Results saved to Devuan system"
Write-Host ""
