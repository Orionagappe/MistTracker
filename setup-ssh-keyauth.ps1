# Setup SSH Key-Based Authentication for MistTracker Deployment
# Run this ONCE to set up passwordless SSH, then deployment will be non-interactive

Write-Host ""
Write-Host "=========================================================="
Write-Host "  SSH Key Setup for MistTracker Deployment"
Write-Host "=========================================================="
Write-Host ""

$SSHDir = "$env:USERPROFILE\.ssh"
$PrivateKey = "$SSHDir\id_rsa"
$PublicKey = "$SSHDir\id_rsa.pub"
$DevuanIP = "10.144.113.100"
$DevuanUser = "orion"

Write-Host "[1/3] Checking SSH setup..."

# Check if .ssh directory exists
if (-not (Test-Path $SSHDir)) {
  Write-Host "[CREATE] Creating .ssh directory..."
  New-Item -ItemType Directory -Path $SSHDir -Force | Out-Null
}

# Check if key pair exists
if (Test-Path $PrivateKey) {
  Write-Host "[OK] SSH key pair already exists"
  Write-Host "    Private key: $PrivateKey"
  Write-Host "    Public key:  $PublicKey"
} else {
  Write-Host "[CREATE] Generating new SSH key pair (4096-bit RSA)..."
  Write-Host "[NOTE] Press Enter for default options (no passphrase recommended for automation)"
  
  # Generate key without passphrase
  ssh-keygen -t rsa -b 4096 -f $PrivateKey -N ""
  
  if ($?) {
    Write-Host "[OK] SSH key pair generated successfully"
  } else {
    Write-Host "[ERROR] Failed to generate SSH keys"
    exit 1
  }
}

Write-Host ""
Write-Host "[2/3] Uploading public key to Devuan..."
Write-Host "[NOTE] You will be prompted for password once"
Write-Host ""

if (Get-Command ssh-copy-id -ErrorAction SilentlyContinue) {
  Write-Host "Using ssh-copy-id..."
  ssh-copy-id -i $PublicKey "$DevuanUser@$DevuanIP"
} else {
  Write-Host "ssh-copy-id not available, using manual method..."
  Write-Host ""
  Write-Host "Run this command on your Windows machine:"
  Write-Host ""
  Write-Host "cat `"$PublicKey`" | ssh $DevuanUser@$DevuanIP 'cat >> ~/.ssh/authorized_keys'"
  Write-Host ""
  Write-Host "Or manually:"
  Write-Host "  1. View your public key:"
  Get-Content $PublicKey | Write-Host
  Write-Host ""
  Write-Host "  2. Copy it and add to ~/.ssh/authorized_keys on Devuan"
}

Write-Host ""
Write-Host "[3/3] Verifying key-based authentication..."

$result = ssh -i $PrivateKey -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null $DevuanUser@$DevuanIP "whoami" 2>&1

if ($result -eq $DevuanUser) {
  Write-Host "[OK] Key-based authentication successful!"
  Write-Host ""
  Write-Host "=========================================================="
  Write-Host "        SSH SETUP COMPLETE"
  Write-Host "=========================================================="
  Write-Host ""
  Write-Host "You can now use non-interactive SSH deployment:"
  Write-Host ""
  Write-Host "  .\deploy-via-ssh-keyauth.ps1"
  Write-Host ""
} else {
  Write-Host "[ERROR] Key-based authentication failed"
  Write-Host "Response: $result"
  Write-Host ""
  Write-Host "Troubleshooting:"
  Write-Host "  1. Verify public key was added to ~/.ssh/authorized_keys on Devuan"
  Write-Host "  2. Check SSH service is running on Devuan"
  Write-Host "  3. Verify IP address: $DevuanIP"
  Write-Host ""
  exit 1
}
