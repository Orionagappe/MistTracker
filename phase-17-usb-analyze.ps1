# Phase 17 USB Iteration Results Analyzer
# Purpose: Read and analyze results from USB iteration
# Usage: .\phase-17-usb-analyze.ps1 -IterationLabel iter-20260420-120000

param(
  [string]$USBDrive = "D:",
  [string]$IterationLabel = "",
  [switch]$OpenResults = $true
)

$ErrorActionPreference = "Stop"

# Configuration
$USB_BASE = "$USBDrive\phase17-iter"
$LOCAL_ANALYSIS = "$env:TEMP\phase17-analysis"

if (-not $IterationLabel) {
  Write-Host "[ERROR] Must specify -IterationLabel" -ForegroundColor Red
  Write-Host "Usage: .\phase-17-usb-analyze.ps1 -IterationLabel <iter-id>"
  exit 1
}

$USB_ITER = "$USB_BASE\$IterationLabel"
$RESULTS_DIR = "$USB_ITER\results"

Write-Host ""
Write-Host "╔════════════════════════════════════════════════════════╗"
Write-Host "║  Phase 17 USB Results Analyzer                        ║"
Write-Host "╚════════════════════════════════════════════════════════╝"
Write-Host ""

# Verify results exist
if (-not (Test-Path $RESULTS_DIR)) {
  Write-Host "[ERROR] Results directory not found: $RESULTS_DIR" -ForegroundColor Red
  Write-Host "Is USB inserted and readable?"
  exit 1
}

Write-Host "[1/4] Reading iteration results from USB..." -ForegroundColor Cyan

# Copy results to local temp for analysis
if (-not (Test-Path $LOCAL_ANALYSIS)) {
  New-Item -ItemType Directory -Path $LOCAL_ANALYSIS -Force | Out-Null
}

$LOCAL_ITER = "$LOCAL_ANALYSIS\$IterationLabel"
if (Test-Path $LOCAL_ITER) {
  Remove-Item $LOCAL_ITER -Recurse -Force
}
Copy-Item $RESULTS_DIR $LOCAL_ITER -Recurse -Force
Write-Host "  ✓ Copied to: $LOCAL_ITER" -ForegroundColor Green

# Parse manifest
Write-Host "[2/4] Parsing execution manifest..." -ForegroundColor Cyan
$manifestPath = "$LOCAL_ITER\RESULTS-MANIFEST.json"
if (Test-Path $manifestPath) {
  $manifest = Get-Content $manifestPath | ConvertFrom-Json
  Write-Host "  ✓ Iteration: $($manifest.iteration_id)" -ForegroundColor Green
  Write-Host "  ✓ Completed: $($manifest.completed)" -ForegroundColor Green
  Write-Host "  ✓ Host: $($manifest.hostname)" -ForegroundColor Green
} else {
  Write-Host "  ⊘ Manifest not found" -ForegroundColor Yellow
}

# Parse execution log
Write-Host "[3/4] Analyzing execution log..." -ForegroundColor Cyan
$logPath = "$LOCAL_ITER\execution.log"
if (Test-Path $logPath) {
  $logContent = Get-Content $logPath
  $logLines = $logContent | Measure-Object -Line
  Write-Host "  ✓ Log lines: $($logLines.Lines)" -ForegroundColor Green
  
  # Extract key metrics if available
  $predictions = $logContent | Select-String "prediction|emergenc|domain|accuracy" -All
  if ($predictions) {
    Write-Host "  ✓ Found emergence indicators: $($predictions.Count) lines" -ForegroundColor Green
  }
}

# Generate analysis report
Write-Host "[4/4] Generating analysis report..." -ForegroundColor Cyan

$reportPath = "$LOCAL_ITER\ANALYSIS-REPORT.md"
$report = @"
# Phase 17 Iteration Analysis Report

**Iteration:** $IterationLabel  
**Analysis Date:** $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")

## Execution Status

| Property | Value |
|----------|-------|
| Completed | $(if ($manifest) { $manifest.completed } else { "Unknown" }) |
| Host | $(if ($manifest) { $manifest.hostname } else { "Unknown" }) |
| Validator Exit | $(if ($manifest) { $manifest.exit_codes.validator } else { "Unknown" }) |
| Predictor Exit | $(if ($manifest) { $manifest.exit_codes.predictor } else { "Unknown" }) |

## Available Output Files

"@

Get-ChildItem $LOCAL_ITER -File | ForEach-Object {
  $report += "- **$($_.Name)** ($($_.Length) bytes)`n"
}

$report | Set-Content $reportPath
Write-Host "  ✓ Report: $reportPath" -ForegroundColor Green

# Summary
Write-Host ""
Write-Host "✓ Analysis Complete" -ForegroundColor Green
Write-Host ""
Write-Host "  Iteration: $IterationLabel"
Write-Host "  Local Path: $LOCAL_ITER"
Write-Host "  Analysis Report: $reportPath"
Write-Host ""
Write-Host "Available files:"
Get-ChildItem $LOCAL_ITER -File | ForEach-Object {
  Write-Host "  - $($_.Name)"
}
Write-Host ""

if ($OpenResults) {
  Write-Host "Opening analysis report..."
  Invoke-Item $reportPath
  
  Write-Host "Opening local iteration folder..."
  Invoke-Item $LOCAL_ITER
}

Write-Host ""
Write-Host "Next iteration:"
Write-Host "  1. Edit code locally in j:\Portfolio Site\Gdocsdev\MistTracker"
Write-Host "  2. Run: PowerShell -File phase-17-usb-prepare.ps1 -IterationLabel <new-label>"
Write-Host "  3. Insert USB into Devuan, run validator"
Write-Host "  4. Analyze results with: PowerShell -File phase-17-usb-analyze.ps1 -IterationLabel <label>"
Write-Host ""
