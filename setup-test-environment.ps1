# Setup SSH Test Environment for Phase 17.5 Container Nodes
# Run this BEFORE docker-compose up

param(
    [string]$TestEnvPath = ".\test-env",
    [string]$KeyType = "ed25519",
    [int]$KeySize = 4096
)

Write-Host "================================================" -ForegroundColor Cyan
Write-Host "Phase 17.5 Container Test Environment Setup" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""

# Create directory structure
Write-Host "[*] Creating test environment directory structure..." -ForegroundColor Yellow
$dirs = @(
    "$TestEnvPath",
    "$TestEnvPath/ssh",
    "$TestEnvPath/ssh/node1/.ssh",
    "$TestEnvPath/ssh/node2/.ssh",
    "$TestEnvPath/keys",
    "$TestEnvPath/logs",
    "$TestEnvPath/results"
)

foreach ($dir in $dirs) {
    if (-not (Test-Path $dir)) {
        New-Item -ItemType Directory -Path $dir -Force | Out-Null
        Write-Host "    [✓] Created: $dir" -ForegroundColor Green
    }
}

# Generate SSH keys for control machine
Write-Host ""
Write-Host "[*] Generating SSH keys for container access..." -ForegroundColor Yellow

$controlKeyPath = "$TestEnvPath/keys/id_test"
$pubKeyPath = "$controlKeyPath.pub"

# Check if keys already exist
if ((Test-Path $controlKeyPath) -and (Test-Path $pubKeyPath)) {
    Write-Host "    [!] SSH keys already exist, skipping generation" -ForegroundColor Cyan
} else {
    # Use ssh-keygen if available (requires OpenSSH client on Windows)
    $sshKeygenPath = "C:\Windows\System32\OpenSSH\ssh-keygen.exe"
    
    if (Test-Path $sshKeygenPath) {
        Write-Host "    [*] Using ssh-keygen to generate keys..." -ForegroundColor Yellow
        & $sshKeygenPath -t ed25519 -f $controlKeyPath -N "" -C "phase17-test" 2>&1 | Out-Null
        Write-Host "    [✓] Generated ED25519 key pair" -ForegroundColor Green
    } else {
        Write-Host "    [!] ssh-keygen not found. Using PuTTYgen or manual setup required." -ForegroundColor Red
        Write-Host "    [*] Please generate an Ed25519 SSH key pair manually:" -ForegroundColor Yellow
        Write-Host "        ssh-keygen -t ed25519 -f $controlKeyPath -N """" -C ""phase17-test"""
        exit 1
    }
}

# Copy public key to container nodes
Write-Host ""
Write-Host "[*] Setting up authorized_keys for container nodes..." -ForegroundColor Yellow

if (Test-Path $pubKeyPath) {
    $pubKeyContent = Get-Content $pubKeyPath
    
    # Node 1
    Set-Content -Path "$TestEnvPath/ssh/node1/.ssh/authorized_keys" -Value $pubKeyContent
    Write-Host "    [✓] Configured node1 authorized_keys" -ForegroundColor Green
    
    # Node 2
    Set-Content -Path "$TestEnvPath/ssh/node2/.ssh/authorized_keys" -Value $pubKeyContent
    Write-Host "    [✓] Configured node2 authorized_keys" -ForegroundColor Green
} else {
    Write-Host "    [ERROR] Public key not found" -ForegroundColor Red
    exit 1
}

# Create SSH config for easy access
Write-Host ""
Write-Host "[*] Creating SSH client configuration..." -ForegroundColor Yellow

$sshConfig = @"
# Phase 17.5 Container Test Nodes

Host phase17-node1
    HostName localhost
    Port 2201
    User root
    IdentityFile $controlKeyPath
    StrictHostKeyChecking no
    UserKnownHostsFile /dev/null

Host phase17-node2
    HostName localhost
    Port 2202
    User root
    IdentityFile $controlKeyPath
    StrictHostKeyChecking no
    UserKnownHostsFile /dev/null
"@

Set-Content -Path "$TestEnvPath/ssh/config" -Value $sshConfig
Write-Host "    [✓] SSH config created at: $TestEnvPath/ssh/config" -ForegroundColor Green

# Create connection test script
Write-Host ""
Write-Host "[*] Creating connection test script..." -ForegroundColor Yellow

# Bash test script is provided separately (run-distributed-validation.sh)

# Create environment summary
Write-Host ""
Write-Host "================================================" -ForegroundColor Cyan
Write-Host "Setup Complete" -ForegroundColor Green
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "SSH Key Information:" -ForegroundColor Yellow
Write-Host "  Private Key: $controlKeyPath" -ForegroundColor Cyan
Write-Host "  Public Key:  $pubKeyPath" -ForegroundColor Cyan
Write-Host ""
Write-Host "Container Access:" -ForegroundColor Yellow
Write-Host "  Node 1: ssh -i $controlKeyPath root@localhost -p 2201" -ForegroundColor Cyan
Write-Host "  Node 2: ssh -i $controlKeyPath root@localhost -p 2202" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next Steps:" -ForegroundColor Yellow
Write-Host "  1. Run: docker-compose -f docker-compose.phase60-test.yml build" -ForegroundColor Cyan
Write-Host "  2. Run: docker-compose -f docker-compose.phase60-test.yml up -d" -ForegroundColor Cyan
Write-Host "  3. Run: bash ./run-distributed-validation.sh" -ForegroundColor Cyan
Write-Host ""
