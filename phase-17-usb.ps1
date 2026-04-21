# Phase 17 USB Iteration Runner
# Purpose: User-friendly menu for USB iteration workflow
# Usage: .\phase-17-usb.ps1

$ErrorActionPreference = "Stop"

function Show-Menu {
  Clear-Host
  Write-Host ""
  Write-Host "╔════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
  Write-Host "║     Phase 17 USB Iteration System                     ║" -ForegroundColor Cyan
  Write-Host "╚════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
  Write-Host ""
  Write-Host "  1. Prepare USB for next iteration (create iteration package)" -ForegroundColor White
  Write-Host "  2. Analyze results from USB (after running on Devuan)" -ForegroundColor White
  Write-Host "  3. View iteration guide (workflow documentation)" -ForegroundColor White
  Write-Host "  4. Open local project folder" -ForegroundColor White
  Write-Host "  5. Exit" -ForegroundColor White
  Write-Host ""
}

function Prepare-Iteration {
  $USBDrive = Read-Host "USB drive letter (default: D)"
  if ($USBDrive -eq "") { $USBDrive = "D" } else { $USBDrive = $USBDrive.TrimEnd(":") }
  
  Write-Host ""
  Write-Host "Use auto-generated label? (Y/n)" -ForegroundColor Yellow
  $autoLabel = Read-Host
  
  if ($autoLabel -eq "n" -or $autoLabel -eq "N") {
    $label = Read-Host "Enter iteration label (e.g., iter-atoms-v2)"
    if ($label) {
      & ".\phase-17-usb-prepare.ps1" -USBDrive "$($USBDrive):" -IterationLabel $label
    }
  } else {
    & ".\phase-17-usb-prepare.ps1" -USBDrive "$($USBDrive):"
  }
}

function Analyze-Results {
  $USBDrive = Read-Host "USB drive letter (default: D)"
  if ($USBDrive -eq "") { $USBDrive = "D" } else { $USBDrive = $USBDrive.TrimEnd(":") }
  
  $label = Read-Host "Iteration label to analyze (e.g., iter-atoms-v1)"
  
  if ($label) {
    & ".\phase-17-usb-analyze.ps1" -USBDrive "$($USBDrive):" -IterationLabel $label -OpenResults $true
  }
}

function Show-Guide {
  if (Test-Path ".\PHASE-17-USB-ITERATION-GUIDE.md") {
    Write-Host "Opening iteration guide..."
    Invoke-Item ".\PHASE-17-USB-ITERATION-GUIDE.md"
  } else {
    Write-Host "Guide not found!"
  }
}

# Main loop
$running = $true
while ($running) {
  Show-Menu
  
  $choice = Read-Host "Select option (1-5)"
  
  switch ($choice) {
    "1" {
      Prepare-Iteration
      Read-Host "`nPress Enter to continue"
    }
    "2" {
      Analyze-Results
      Read-Host "`nPress Enter to continue"
    }
    "3" {
      Show-Guide
      Read-Host "`nPress Enter to continue"
    }
    "4" {
      Invoke-Item "."
      Read-Host "`nPress Enter to continue"
    }
    "5" {
      $running = $false
    }
    default {
      Write-Host "Invalid option" -ForegroundColor Red
      Start-Sleep -Seconds 1
    }
  }
}

Write-Host ""
Write-Host "Phase 17 USB Iteration System - Goodbye!" -ForegroundColor Cyan
Write-Host ""
