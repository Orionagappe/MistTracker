# MistTracker Hardware Fitness Validator - Results Retrieval & Analysis
# Waits for test completion, retrieves output, and analyzes performance metrics

param(
  [string]$DevuanIP = "10.144.113.100",
  [string]$DevuanUser = "orion",
  [string]$DevuanPassword = "Popsnap1",
  [int]$MaxWaitMinutes = 15,
  [int]$PollIntervalSeconds = 30
)

Write-Host ""
Write-Host "=========================================================="
Write-Host "  MistTracker Hardware Fitness - Results Analyzer"
Write-Host "=========================================================="
Write-Host ""

$LocalResultsDir = ".\validator-results"
if (-not (Test-Path $LocalResultsDir)) {
  New-Item -ItemType Directory -Path $LocalResultsDir | Out-Null
}

Write-Host "[INFO] Results directory: $LocalResultsDir"
Write-Host ""

# Function to check if validator is still running
function Test-ValidatorRunning {
  param([string]$IP, [string]$User)
  
  $cmd = "ps aux | grep 'hardware-fitness-validator' | grep -v grep"
  $output = ssh -o StrictHostKeyChecking=accept-new -o ConnectTimeout=5 "$User@$IP" $cmd 2>&1
  
  return ($output -match "hardware-fitness-validator")
}

# Function to retrieve results
function Get-ValidatorResults {
  param(
    [string]$IP,
    [string]$User,
    [string]$LocalDir
  )
  
  Write-Host "[*] Retrieving results files from $User@$IP..."
  
  # Define source files to retrieve
  $sourceFiles = @(
    "~/misttracker/logs/server.log",
    "~/misttracker/logs/validator-results.txt",
    "~/misttracker/logs/validator-metrics.json"
  )
  
  $retrieved = $false
  
  foreach ($file in $sourceFiles) {
    $filename = Split-Path -Leaf $file
    Write-Host "  Attempting to retrieve: $filename"
    
    try {
      scp -o StrictHostKeyChecking=accept-new "$User@$IP`:$file" "$LocalDir\$filename" 2>&1 | Out-Null
      if (Test-Path "$LocalDir\$filename") {
        Write-Host "  [OK] Retrieved: $filename"
        $retrieved = $true
      }
    } catch {
      # File may not exist yet, continue
    }
  }
  
  return $retrieved
}

# Main polling loop
Write-Host "[1/3] Waiting for Hardware Fitness Validator to complete..."
Write-Host "      (polling every $PollIntervalSeconds seconds, max $MaxWaitMinutes minutes)"
Write-Host ""

$startTime = Get-Date
$maxWaitTime = New-TimeSpan -Minutes $MaxWaitMinutes
$testComplete = $false

while ((Get-Date) - $startTime -lt $maxWaitTime) {
  $elapsedMinutes = [Math]::Round(((Get-Date) - $startTime).TotalMinutes, 1)
  
  if (Test-ValidatorRunning -IP $DevuanIP -User $DevuanUser) {
    Write-Host "  [$elapsedMinutes min] Validator still running..."
    Start-Sleep -Seconds $PollIntervalSeconds
  } else {
    Write-Host "  [$elapsedMinutes min] Validator completed!"
    $testComplete = $true
    break
  }
}

Write-Host ""

if (-not $testComplete) {
  Write-Host "[WARN] Validator may still be running or timed out. Attempting to retrieve partial results..."
}

# Retrieve results
Write-Host "[2/3] Retrieving results from Devuan system..."
Write-Host ""

if (Get-ValidatorResults -IP $DevuanIP -User $DevuanUser -LocalDir $LocalResultsDir) {
  Write-Host "[OK] Results retrieved successfully"
} else {
  Write-Host "[WARN] Some results files not yet available"
}

Write-Host ""

# Parse and display results
Write-Host "[3/3] Analyzing Performance Metrics..."
Write-Host "=========================================================="
Write-Host ""

$serverLog = Join-Path $LocalResultsDir "server.log"
$validatorResults = Join-Path $LocalResultsDir "validator-results.txt"
$validatorMetrics = Join-Path $LocalResultsDir "validator-metrics.json"

if (Test-Path $validatorResults) {
  Write-Host "--- Hardware Fitness Validator Output ---"
  Write-Host ""
  Get-Content $validatorResults
  Write-Host ""
} else {
  Write-Host "[INFO] validator-results.txt not yet available"
  Write-Host ""
}

if (Test-Path $validatorMetrics) {
  Write-Host "--- Performance Metrics (JSON) ---"
  Write-Host ""
  Get-Content $validatorMetrics | ConvertFrom-Json | Format-Table -AutoSize
  Write-Host ""
} else {
  Write-Host "[INFO] validator-metrics.json not yet available"
  Write-Host ""
}

if (Test-Path $serverLog) {
  Write-Host "--- Server Log (Last 30 lines) ---"
  Write-Host ""
  Get-Content $serverLog -Tail 30
  Write-Host ""
}

Write-Host "=========================================================="
Write-Host "Analysis Complete"
Write-Host "Full results saved to: $LocalResultsDir"
Write-Host "=========================================================="
Write-Host ""
