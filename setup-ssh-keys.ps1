# Deploy SSH public key to Devuan for password-less automation
# Uses sshpass for non-interactive password handling

param(
  [string]$DevuanIP = "10.144.113.100",
  [string]$DevuanUser = "orion",
  [string]$DevuanPassword = "Popsnap1"
)

Write-Host ""
Write-Host "=========================================================="
Write-Host "  SSH Key Deployment & Verification"
Write-Host "=========================================================="
Write-Host ""

# Step 1: Check for sshpass
Write-Host "[*] Checking for sshpass..."
$sshpassTest = which sshpass 2>$null
if (-not $sshpassTest) {
  Write-Host "[WARNING] sshpass not found. Will attempt manual installation..."
  Write-Host "[INFO] Installing sshpass via scoop..."
  scoop install sshpass 2>$null
  
  if (-not (which sshpass 2>$null)) {
    Write-Host "[ERROR] Could not install sshpass"
    Write-Host "[INFO] Manual installation alternatives:"
    Write-Host "  - Download from: https://sourceforge.net/projects/sshpass/files/"
    Write-Host "  - Or: choco install sshpass (if using Chocolatey)"
    exit 1
  }
}
Write-Host "[OK] sshpass available"
Write-Host ""

# Step 2: Verify SSH key exists
$SSHKeyPath = "$HOME\.ssh\id_rsa"
$SSHPubKeyPath = "$HOME\.ssh\id_rsa.pub"

if (-not (Test-Path $SSHKeyPath)) {
  Write-Host "[ERROR] SSH private key not found: $SSHKeyPath"
  Write-Host "[INFO] Generate with: ssh-keygen -t rsa -b 2048 -f `"$SSHKeyPath`" -N '`"`"'"
  exit 1
}

if (-not (Test-Path $SSHPubKeyPath)) {
  Write-Host "[ERROR] SSH public key not found: $SSHPubKeyPath"
  exit 1
}

Write-Host "[OK] SSH keys found"
Write-Host "  Private: $SSHKeyPath"
Write-Host "  Public: $SSHPubKeyPath"
Write-Host ""

# Step 3: Deploy public key to ~/.ssh/authorized_keys on Devuan
Write-Host "[*] Deploying public key to $DevuanUser@$DevuanIP..."
Write-Host ""

$pubKey = Get-Content $SSHPubKeyPath
$deployCmd = "mkdir -p ~/.ssh && echo '$pubKey' >> ~/.ssh/authorized_keys && chmod 700 ~/.ssh && chmod 600 ~/.ssh/authorized_keys && echo 'Key deployed successfully'"

# Use sshpass for non-interactive authentication
$env:SSHPASS = $DevuanPassword
$output = sshpass -e ssh -o StrictHostKeyChecking=accept-new -o UserKnownHostsFile=/dev/null "$DevuanUser@$DevuanIP" $deployCmd 2>&1
$deployExitCode = $LASTEXITCODE
$env:SSHPASS = ""

if ($deployExitCode -eq 0) {
  Write-Host "[OK] Public key deployed"
  Write-Host ""
} else {
  Write-Host "[ERROR] Deployment failed (exit code: $deployExitCode)"
  Write-Host "[OUTPUT]"
  Write-Host $output
  exit 1
}

# Step 4: Test key-based authentication (no password)
Write-Host "[*] Testing key-based authentication..."
Write-Host ""

$testCmd = ssh -o StrictHostKeyChecking=accept-new -o BatchMode=yes "$DevuanUser@$DevuanIP" "whoami" 2>&1

if ($testCmd -match "orion") {
  Write-Host "[OK] Key-based authentication successful"
  Write-Host "  Connected as: $testCmd"
  Write-Host ""
} else {
  Write-Host "[WARN] Key auth may not be working yet"
  Write-Host "  Output: $testCmd"
  Write-Host "  Note: SSH key from key agent may be needed"
  Write-Host ""
}

# Step 5: Test remote command execution
Write-Host "[*] Testing remote command execution..."
Write-Host ""

$cmdTest = ssh -o StrictHostKeyChecking=accept-new -o BatchMode=yes "$DevuanUser@$DevuanIP" "pwd && ls -la Desktop/misttracker/ 2>/dev/null | head -3" 2>&1

if ($LASTEXITCODE -eq 0) {
  Write-Host "[OK] Remote command execution successful"
  Write-Host ""
  Write-Host $cmdTest
  Write-Host ""
} else {
  Write-Host "[WARN] Remote command test (this is informational):"
  Write-Host $cmdTest
  Write-Host ""
}

# Step 6: Test SU escalation for root commands (using sshpass again)
Write-Host "[*] Testing root escalation via su..."
Write-Host ""

$env:SSHPASS = $DevuanPassword
$suTest = sshpass -e ssh -o StrictHostKeyChecking=accept-new -o UserKnownHostsFile=/dev/null "$DevuanUser@$DevuanIP" "echo 'popsnap2' | su -c 'whoami'" 2>&1
$suExitCode = $LASTEXITCODE
$env:SSHPASS = ""

if ($suExitCode -eq 0 -and $suTest -match "root") {
  Write-Host "[OK] Root escalation successful"
  Write-Host "  Escalated as: $suTest"
  Write-Host ""
} else {
  Write-Host "[WARN] Root escalation test result:"
  Write-Host "  Output: $suTest"
  Write-Host ""
}

Write-Host "=========================================================="
Write-Host "SSH KEY DEPLOYMENT COMPLETE"
Write-Host "=========================================================="
Write-Host ""

Write-Host "[OK] SSH infrastructure ready for automation:"
Write-Host ""
Write-Host "  Option 1 - Key-based (if SSH agent configured):"
Write-Host "    ssh -o BatchMode=yes orion@$DevuanIP 'command'"
Write-Host ""
Write-Host "  Option 2 - Password-less file deployment:"
Write-Host "    Use deploy-via-ssh-keys.ps1 script"
Write-Host ""
Write-Host "  Next step: Deploy MistTracker modules"
Write-Host "    .\deploy-via-ssh-keys.ps1"
Write-Host ""
Write-Host "=========================================================="
