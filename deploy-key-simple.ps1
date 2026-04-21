# Simple SSH key deployment script - Windows native approach

param(
  [string]$DevuanIP = "10.144.113.100",
  [string]$DevuanUser = "orion",
  [string]$DevuanPassword = "Popsnap1"
)

Write-Host ""
Write-Host "=========================================================="
Write-Host "  SSH Key Deployment (Windows Native)"
Write-Host "=========================================================="
Write-Host ""

# Step 1: Verify SSH key exists
$SSHKeyPath = "$HOME\.ssh\id_rsa"
$SSHPubKeyPath = "$HOME\.ssh\id_rsa.pub"

if (-not (Test-Path $SSHKeyPath)) {
  Write-Host "[ERROR] SSH private key not found: $SSHKeyPath"
  Write-Host ""
  Write-Host "Generate SSH keys with:"
  Write-Host "  ssh-keygen -t rsa -b 4096 -f `"$SSHKeyPath`" -N ''"
  Write-Host ""
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

# Step 2: Read the public key
$pubKey = Get-Content $SSHPubKeyPath
Write-Host "[*] Public key (first 40 chars): $($pubKey.Substring(0, 40))..."
Write-Host ""

# Step 3: Create a temporary batch file to deploy key via SSH
Write-Host "[*] Creating temporary deployment script..."

$tempScript = "$env:TEMP\deploy_key_temp_$([DateTime]::Now.Ticks).sh"
$deployCmd = @"
#!/bin/bash
mkdir -p ~/.ssh
echo '$pubKey' >> ~/.ssh/authorized_keys
chmod 700 ~/.ssh
chmod 600 ~/.ssh/authorized_keys
echo '[OK] SSH public key deployed successfully'
whoami
"@

Set-Content -Path $tempScript -Value $deployCmd -Encoding ASCII

Write-Host "[*] Deploying key via SSH..."
Write-Host ""

# Step 4: Execute deployment via SSH (requires user to enter password when prompted)
Write-Host "[PROMPT] You will be asked for password for $DevuanUser@$DevuanIP"
Write-Host "[PROMPT] Enter password: $DevuanPassword (will be used automatically via stdin)"
Write-Host ""

# Use PowerShell SSH with stdin to avoid interactive prompt
$process = @"
`$cred = New-Object System.Management.Automation.PSCredential('$DevuanUser', ('$DevuanPassword' | ConvertTo-SecureString -AsPlainText -Force))
`$session = New-PSSession -HostName $DevuanIP -Credential `$cred -UserAuthentication Password -ErrorAction Stop
Invoke-Command -Session `$session -ScriptBlock {
  mkdir -p ~/.ssh
  echo '$pubKey' | tee -a ~/.ssh/authorized_keys > /dev/null
  chmod 700 ~/.ssh
  chmod 600 ~/.ssh/authorized_keys
  echo '[OK] SSH public key deployed successfully'
  whoami
}
Remove-PSSession -Session `$session
"@

# Alternative: Use SSH directly with password passed via stdin (this is the simplest method)
# For now, show what to do manually or use another approach

Write-Host "[*] Note: Windows SSH doesn't support automatic password input"
Write-Host "[*] Two options available:"
Write-Host ""
Write-Host "OPTION 1 - Manual Copy (Easiest for one-time setup):"
Write-Host "  1. Read your public key:"
Write-Host "     cat $SSHPubKeyPath"
Write-Host ""
Write-Host "  2. SSH to $DevuanUser@$DevuanIP"
Write-Host "     ssh $DevuanUser@$DevuanIP"
Write-Host ""
Write-Host "  3. Append to authorized_keys:"
Write-Host "     mkdir -p ~/.ssh"
Write-Host "     echo '<paste-your-public-key-here>' >> ~/.ssh/authorized_keys"
Write-Host "     chmod 600 ~/.ssh/authorized_keys"
Write-Host ""
Write-Host "OPTION 2 - Automated (requires sshpass or expect):"
Write-Host "  Install sshpass: choco install sshpass"
Write-Host "  Then use: .\deploy-via-sshpass.ps1"
Write-Host ""
Write-Host "OPTION 3 - Current Status:"
Write-Host "  Your public key content:"
Write-Host "  =========================================="
Write-Host $pubKey
Write-Host "  =========================================="
Write-Host ""

# Clean up
Remove-Item $tempScript -Force -ErrorAction SilentlyContinue

Write-Host "[!] For automated deployment, please use one of the options above"
Write-Host ""
