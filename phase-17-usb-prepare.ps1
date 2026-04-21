# Phase 17 USB Iteration Harness - Windows Preparation
# Purpose: Prepare USB with latest code for Devuan testing
# Usage: .\phase-17-usb-prepare.ps1

param(
  [string]$USBDrive = "D:",
  [string]$IterationLabel = "",
  [switch]$ShowProgress = $true
)

$ErrorActionPreference = "Stop"

# Configuration
$USB_BASE = "$USBDrive\phase17-iter"
$CODE_SOURCE = "j:\Portfolio Site\Gdocsdev\MistTracker"
$TIMESTAMP = Get-Date -Format "yyyyMMdd-HHmmss"

if ($IterationLabel) {
  $USB_ITER = "$USB_BASE\$IterationLabel"
} else {
  $USB_ITER = "$USB_BASE\iter-$TIMESTAMP"
}

Write-Host ""
Write-Host "╔════════════════════════════════════════════════════════╗"
Write-Host "║  Phase 17 USB Iteration Preparation                   ║"
Write-Host "╚════════════════════════════════════════════════════════╝"
Write-Host ""

# Verify USB is available
if (-not (Test-Path $USBDrive)) {
  Write-Host "[ERROR] USB drive $USBDrive not found" -ForegroundColor Red
  exit 1
}

Write-Host "[1/4] Creating iteration directory: $USB_ITER" -ForegroundColor Cyan
if (-not (Test-Path $USB_ITER)) {
  New-Item -ItemType Directory -Path $USB_ITER -Force | Out-Null
}

# Copy core Phase 17 files
$CoreFiles = @(
  "phase-17-5-beta-network-predictor.js",
  "phase-17-5-beta-extended-aggregator.js",
  "hardware-fitness-validator.js",
  "SymbolicExpression.js",
  "predictionEngine.js"
)

Write-Host "[2/4] Copying core Phase 17 code files..." -ForegroundColor Cyan
$CopyCount = 0
foreach ($file in $CoreFiles) {
  $srcFile = Join-Path $CODE_SOURCE $file
  if (Test-Path $srcFile) {
    Copy-Item $srcFile "$USB_ITER\" -Force
    Write-Host "  ✓ $file" -ForegroundColor Green
    $CopyCount++
  } else {
    Write-Host "  ⊘ $file (not found)" -ForegroundColor Yellow
  }
}

# Copy Phase 17 data
Write-Host "[3/4] Copying Phase 17 data..." -ForegroundColor Cyan
$dataSource = Join-Path $CODE_SOURCE "phase-17-data"
if (Test-Path $dataSource) {
  Copy-Item $dataSource "$USB_ITER\data" -Recurse -Force
  Write-Host "  ✓ phase-17-data/" -ForegroundColor Green
}

# Create iteration manifest
Write-Host "[4/4] Creating iteration manifest..." -ForegroundColor Cyan

$manifest = @{
  iteration = if ($IterationLabel) { $IterationLabel } else { "iter-$TIMESTAMP" }
  timestamp = $TIMESTAMP
  prepared = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
  files_copied = $CopyCount
  ready_for_devuan = $true
  instructions = @(
    "1. Insert USB into Devuan system"
    "2. Mount USB: sudo mount /mnt/usb"
    "3. Run validator: bash /mnt/usb/phase17-iter/[iteration]/run-validator.sh"
    "4. Results written to: /mnt/usb/[iteration]/results/"
  )
}

$manifest | ConvertTo-Json | Set-Content "$USB_ITER\MANIFEST.json"
Write-Host "  ✓ MANIFEST.json" -ForegroundColor Green

Write-Host ""
Write-Host "✓ USB Preparation Complete" -ForegroundColor Green
Write-Host ""
Write-Host "  USB Location: $USB_ITER"
Write-Host "  Files ready: $CopyCount"
Write-Host "  Iteration ID: $(if ($IterationLabel) { $IterationLabel } else { "iter-$TIMESTAMP" })"
Write-Host ""
Write-Host "Next steps:"
Write-Host "  1. Insert USB into Devuan Excaliber"
Write-Host "  2. Run: bash /mnt/usb/phase17-iter/[iteration]/run-validator.sh"
Write-Host ""
