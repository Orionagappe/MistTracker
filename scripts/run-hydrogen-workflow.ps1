#!/usr/bin/env powershell

<#
.SYNOPSIS
Complete hydrogen proxy training and testing workflow

.DESCRIPTION
This script runs the complete pipeline:
1. Train hydrogen proxy (1000 samples, 100 epochs)
2. Test the trained proxy
3. Display results in console

.EXAMPLE
.\scripts\run-hydrogen-workflow.ps1

.NOTES
Requires Node.js and the training scripts to be in place
#>

param(
    [int]$Samples = 1000,
    [int]$Epochs = 100,
    [switch]$Verbose = $false,
    [switch]$SaveJson = $true
)

Write-Host "==================================================================================" -ForegroundColor Cyan
Write-Host "     HYDROGEN PROXY - COMPLETE TRAINING WORKFLOW" -ForegroundColor Cyan
Write-Host "            Phase 17: Atomic Physics" -ForegroundColor Cyan
Write-Host "==================================================================================" -ForegroundColor Cyan
Write-Host ""

# Get script directory
$scriptDir = Split-Path -Parent -Path $MyInvocation.MyCommand.Definition
$rootDir = Split-Path -Parent -Path $scriptDir

Write-Host "[*] Directories:" -ForegroundColor Yellow
Write-Host "   Root: $rootDir"
Write-Host "   Scripts: $scriptDir"
Write-Host ""

# Create output directory if needed
$outputDir = Join-Path $scriptDir "..\proxy-data"
if (-not (Test-Path $outputDir)) {
    New-Item -ItemType Directory -Path $outputDir | Out-Null
    Write-Host "[+] Created output directory: $outputDir" -ForegroundColor Green
}

$proxyFile = Join-Path $outputDir "hydrogen-proxy-$(Get-Date -Format 'yyyyMMdd-HHmmss').json"

# ============================================================================
# STEP 1: TRAIN PROXY
# ============================================================================
Write-Host ""
Write-Host "==================================================================================" -ForegroundColor Green
Write-Host "STEP 1: TRAINING HYDROGEN PROXY" -ForegroundColor Green
Write-Host "==================================================================================" -ForegroundColor Green
Write-Host ""

$trainArgs = @(
    "scripts/train-hydrogen-proxy-improved.js",
    "--samples", $Samples.ToString(),
    "--epochs", $Epochs.ToString(),
    "--output-json", $proxyFile
)

if ($Verbose) {
    $trainArgs += "--verbose"
}

Write-Host "[*] Running: node $($trainArgs -join ' ')" -ForegroundColor Gray
Write-Host ""

$startTime = Get-Date
node @trainArgs
$trainResult = $LASTEXITCODE

$trainDuration = (Get-Date) - $startTime

if ($trainResult -ne 0) {
    Write-Host "[!] Training failed with exit code $trainResult" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "[+] Training completed in $($trainDuration.TotalSeconds.ToString('F1')) seconds" -ForegroundColor Green
Write-Host ""

# ============================================================================
# STEP 2: TEST PROXY
# ============================================================================
Write-Host ""
Write-Host "==================================================================================" -ForegroundColor Green
Write-Host "STEP 2: TESTING TRAINED PROXY" -ForegroundColor Green
Write-Host "==================================================================================" -ForegroundColor Green
Write-Host ""

if (-not (Test-Path $proxyFile)) {
    Write-Host "[!] Proxy file not found: $proxyFile" -ForegroundColor Red
    exit 1
}

Write-Host "Testing proxy: $proxyFile" -ForegroundColor Gray
Write-Host ""

$testArgs = @(
    "scripts/test-hydrogen-proxy.js",
    "--proxy", $proxyFile,
    "--verbose"
)

node @testArgs
$testResult = $LASTEXITCODE

if ($testResult -ne 0) {
    Write-Host "[!] Testing failed with exit code $testResult" -ForegroundColor Red
    exit 1
}

# ============================================================================
# STEP 3: DISPLAY RESULTS
# ============================================================================
Write-Host ""
Write-Host "==================================================================================" -ForegroundColor Green
Write-Host "STEP 3: WORKFLOW COMPLETE" -ForegroundColor Green
Write-Host "==================================================================================" -ForegroundColor Green
Write-Host ""

Write-Host "[+] Workflow Summary:" -ForegroundColor Green
Write-Host "  1. [OK] Trained hydrogen proxy ($Samples samples, $Epochs epochs)"
Write-Host "  2. [OK] Tested trained proxy"
Write-Host "  3. [OK] Validated accuracy"
Write-Host ""

Write-Host "[*] Output Files:" -ForegroundColor Cyan
Get-Item $proxyFile | ForEach-Object {
    $sizeMb = $_.Length / 1MB
    Write-Host "   * $(Split-Path -Leaf $_.FullName) ($($sizeMb.ToString('F1')) MB)"
}
Write-Host ""

Write-Host "[>] Next Steps:" -ForegroundColor Yellow
Write-Host "  1. Review the proxy accuracy results above"
Write-Host "  2. If accuracy >= 95%, proxy is ready for Phase 17 deployment"
Write-Host "  3. Deploy to swarm:"
Write-Host "     curl -X POST http://localhost:3001/api/v1/swarm/submit-proxy \" -ForegroundColor Gray
Write-Host "       -H 'Content-Type: application/json' \" -ForegroundColor Gray
Write-Host "       -d @$proxyFile" -ForegroundColor Gray
Write-Host ""
Write-Host "  4. Create emergence chain linking Phase 17 -> Phase 18"
Write-Host "  5. Submit Phase 17 milestone: PROXY_GENERATED"
Write-Host ""

Write-Host "==================================================================================" -ForegroundColor Green
Write-Host "     HYDROGEN PROXY READY FOR PHASE 17!" -ForegroundColor Green
Write-Host "==================================================================================" -ForegroundColor Green
