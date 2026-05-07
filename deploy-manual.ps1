# MistTracker SSH Deployment using SU for privilege escalation
# PowerShell 5.1 Compatible

param(
  [string]$DevuanIP = "10.144.113.100",
  [string]$DevuanUser = "orion",
  [string]$DevuanPassword = "Popsnap1",
  [string]$RootPassword = "popsnap2"
)

Write-Host "=========================================================="
Write-Host "  MistTracker SSH Deployment - Manual Interaction Mode"
Write-Host "=========================================================="
Write-Host ""
Write-Host "This script will prompt you for passwords when needed."
Write-Host "1. orion's password: $DevuanPassword"
Write-Host "2. root's password: $RootPassword"
Write-Host ""

# Step 1: Connect and run server
Write-Host "[1/2] Connecting to $DevuanIP as $DevuanUser..."
# Using su with manual password entry
ssh -o StrictHostKeyChecking=accept-new "$DevuanUser@$DevuanIP" "su -c 'mkdir -p ~/misttracker/logs && cd ~/misttracker && NODE_OPTIONS=--max-old-space-size=512 nohup node start-server.js 3000 > logs/server.log 2>&1 &'"

Write-Host ""
Write-Host "[2/2] Running Hardware Fitness Validator..."
ssh -o StrictHostKeyChecking=accept-new "$DevuanUser@$DevuanIP" "node ~/misttracker/hardware-fitness-validator.js"
