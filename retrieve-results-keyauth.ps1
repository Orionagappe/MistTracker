# Setup SSH key authentication and retrieve results
# This avoids password prompts entirely

param(
  [string]$DevuanIP = "10.144.113.100",
  [string]$DevuanUser = "orion",
  [string]$DevuanPassword = "Popsnap1",
  [int]$MaxWaitMinutes = 15,
  [int]$PollIntervalSeconds = 30
)

Write-Host ""
Write-Host "=========================================================="
Write-Host "  MistTracker - Results Retrieval (SSH Key Auth)"
Write-Host "=========================================================="
Write-Host ""

$LocalResultsDir = ".\validator-results"
$SSHKeyPath = "$HOME\.ssh\id_rsa"
$SSHPubKeyPath = "$HOME\.ssh\id_rsa.pub"

if (-not (Test-Path $LocalResultsDir)) {
  New-Item -ItemType Directory -Path $LocalResultsDir | Out-Null
}

# Check if SSH keys exist
if (-not (Test-Path $SSHKeyPath)) {
  Write-Host "[ERROR] SSH key not found at $SSHKeyPath"
  Write-Host "[INFO] Generate with: ssh-keygen -t rsa -b 2048 -f `"$SSHKeyPath`" -N '`"`"'"
  exit 1
}

Write-Host "[INFO] Using SSH key: $SSHKeyPath"
Write-Host ""

# Step 1: Deploy public key to Devuan authorized_keys
Write-Host "[1/4] Setting up SSH key authentication on Devuan..."

if (Test-Path $SSHPubKeyPath) {
  $pubKey = Get-Content $SSHPubKeyPath
  
  # Use su escalation to add key to authorized_keys
  $keySetupCmd = "mkdir -p ~/.ssh && echo '$pubKey' >> ~/.ssh/authorized_keys && chmod 700 ~/.ssh && chmod 600 ~/.ssh/authorized_keys"
  
  Write-Host "  Deploying public key to authorized_keys..."
  
  # Note: This will still prompt for password once during setup
  $setupOutput = ssh -o StrictHostKeyChecking=accept-new "$DevuanUser@$DevuanIP" $keySetupCmd 2>&1
  
  if ($LASTEXITCODE -eq 0) {
    Write-Host "  [OK] Public key deployed"
  } else {
    Write-Host "  [WARN] Key deployment exit code: $LASTEXITCODE"
  }
} else {
  Write-Host "[WARN] Public key not found, continuing with password auth..."
}

Write-Host ""

# Step 2: Poll for validator completion (using key auth, no passwords)
Write-Host "[2/4] Checking validator status (no password auth)..."
Write-Host ""

$validatorRunning = ssh -o StrictHostKeyChecking=accept-new -o BatchMode=yes "$DevuanUser@$DevuanIP" "ps aux | grep 'hardware-fitness-validator' | grep -v grep" 2>&1

if ($validatorRunning -match "hardware-fitness-validator") {
  Write-Host "  [INFO] Validator process detected as running"
  Write-Host "  Waiting for completion (up to $MaxWaitMinutes minutes)..."
  Write-Host ""
  
  $startTime = Get-Date
  $maxWaitTime = New-TimeSpan -Minutes $MaxWaitMinutes
  
  while ((Get-Date) - $startTime -lt $maxWaitTime) {
    $elapsedMinutes = [Math]::Round(((Get-Date) - $startTime).TotalMinutes, 1)
    
    $validatorRunning = ssh -o StrictHostKeyChecking=accept-new -o BatchMode=yes "$DevuanUser@$DevuanIP" "ps aux | grep 'hardware-fitness-validator' | grep -v grep" 2>&1
    
    if ($validatorRunning -and $validatorRunning -match "hardware-fitness-validator") {
      Write-Host "  [$elapsedMinutes min] Still running..."
      Start-Sleep -Seconds $PollIntervalSeconds
    } else {
      Write-Host "  [$elapsedMinutes min] Validator completed!"
      break
    }
  }
} else {
  Write-Host "  [INFO] Validator process not currently detected"
  Write-Host "  Results may already be available, proceeding to retrieval..."
}

Write-Host ""

# Step 3: Retrieve results
Write-Host "[3/4] Retrieving results from Devuan..."
Write-Host ""

$sourceFiles = @(
  ("~/misttracker/logs/server.log", "server.log"),
  ("~/misttracker/logs/validator-results.txt", "validator-results.txt"),
  ("~/misttracker/logs/validator-metrics.json", "validator-metrics.json")
)

$successCount = 0

foreach ($fileInfo in $sourceFiles) {
  $remotePath = $fileInfo[0]
  $localName = $fileInfo[1]
  
  Write-Host "  Retrieving: $localName"
  
  $output = scp -o StrictHostKeyChecking=accept-new -o BatchMode=yes "$DevuanUser@$DevuanIP`:$remotePath" "$LocalResultsDir\$localName" 2>&1
  
  if ((Test-Path "$LocalResultsDir\$localName") -and ((Get-Item "$LocalResultsDir\$localName").Length -gt 0)) {
    Write-Host "    [OK] Retrieved ($((Get-Item "$LocalResultsDir\$localName").Length) bytes)"
    $successCount++
  } else {
    Write-Host "    [SKIP] Not yet available or empty"
  }
}

Write-Host ""
Write-Host "[OK] Retrieved $successCount result file(s)"
Write-Host ""

# Step 4: Display results
Write-Host "[4/4] Analysis Results"
Write-Host "=========================================================="
Write-Host ""

$validatorResults = Join-Path $LocalResultsDir "validator-results.txt"

if (Test-Path $validatorResults) {
  Write-Host "--- Hardware Fitness Validator Output ---"
  Write-Host ""
  $content = Get-Content $validatorResults
  Write-Host $content
  Write-Host ""
  
  # Extract key metrics from output
  if ($content -match "Device Prediction.*?(\d+\.\d+)ms") {
    Write-Host "[METRIC] Device Prediction: $($matches[1])ms"
  }
  if ($content -match "Mesh Topology.*?(\d+\.\d+)ms") {
    Write-Host "[METRIC] Mesh Topology: $($matches[1])ms"
  }
  if ($content -match "Memory Stability.*?(PASS|FAIL)") {
    Write-Host "[METRIC] Memory Stability: $($matches[1])"
  }
  if ($content -match "Overall Assessment.*?([A-Z]+)") {
    Write-Host "[METRIC] Fitness Assessment: $($matches[1])"
  }
} else {
  Write-Host "[INFO] validator-results.txt not available yet"
  Write-Host "       Validator may still be running on Devuan"
}

Write-Host ""

$serverLog = Join-Path $LocalResultsDir "server.log"
if (Test-Path $serverLog) {
  Write-Host "--- Server Log (Last 20 lines) ---"
  Write-Host ""
  Get-Content $serverLog -Tail 20
  Write-Host ""
}

Write-Host "=========================================================="
Write-Host "Results directory: $LocalResultsDir"
Write-Host "=========================================================="
Write-Host ""
