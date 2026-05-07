# Remote Operations for MistTracker on Devuan
# Execute server and validation tasks via SSH
# PowerShell 5.1 Compatible

$DevuanIP = "10.144.113.100"
$DevuanUser = "orion"

function Invoke-RemoteCommand {
  param(
    [string]$Command,
    [string]$Description = ""
  )
  
  if ($Description) {
    Write-Host ""
    Write-Host "[*] $Description"
  }
  
  Write-Host "Running: $Command"
  Write-Host ""
  
  try {
    $output = ssh -o StrictHostKeyChecking=no $DevuanUser@$DevuanIP $Command 2>&1
    Write-Host $output
    return $true
  } catch {
    Write-Host "[ERROR] Command failed: $_"
    return $false
  }
}

Write-Host ""
Write-Host "=========================================================="
Write-Host "  MistTracker Remote Operations"
Write-Host "  Target: $DevuanUser@$DevuanIP"
Write-Host "=========================================================="
Write-Host ""

# Menu
Write-Host "Available operations:"
Write-Host "  1. Start server on port 3000"
Write-Host "  2. Check server health"
Write-Host "  3. Run hardware fitness validation"
Write-Host "  4. Stop server"
Write-Host "  5. View server logs"
Write-Host "  6. List installed files"
Write-Host "  7. Check system resources"
Write-Host "  8. Run all validations (full test)"
Write-Host ""
Write-Host "Enter selection (1-8) or press Ctrl+C to exit:"
$selection = Read-Host "Selection"

switch ($selection) {
  "1" {
    Invoke-RemoteCommand `
      "cd ~/misttracker && NODE_OPTIONS='--max-old-space-size=512' nohup node start-server.js 3000 > logs/server.log 2>&1 &" `
      "Starting MistTracker server on port 3000..."
    Write-Host ""
    Write-Host "Waiting 2 seconds for server to start..."
    Start-Sleep -Seconds 2
    Invoke-RemoteCommand "ps aux | grep 'node start-server' | grep -v grep" "Checking server process..."
  }
  
  "2" {
    Invoke-RemoteCommand `
      "curl -s http://localhost:3000/health | head -20" `
      "Checking server health endpoint..."
  }
  
  "3" {
    Invoke-RemoteCommand `
      "cd ~/misttracker && node hardware-fitness-validator.js" `
      "Running hardware fitness validation (5-10 minutes)..."
  }
  
  "4" {
    Invoke-RemoteCommand `
      "killall node" `
      "Stopping MistTracker server..."
  }
  
  "5" {
    Invoke-RemoteCommand `
      "tail -50 ~/misttracker/logs/server.log" `
      "Recent server logs (last 50 lines)..."
  }
  
  "6" {
    Invoke-RemoteCommand `
      "ls -lh ~/misttracker/" `
      "Files in MistTracker directory..."
  }
  
  "7" {
    Invoke-RemoteCommand `
      "free -h && echo '---' && ps aux | head -1 && ps aux | grep -E '(node|misttracker)' | head -10" `
      "System resources..."
  }
  
  "8" {
    Write-Host "[SEQUENCE] Running full validation sequence..."
    Write-Host ""
    
    Write-Host "Step 1: Verify installation"
    Invoke-RemoteCommand "ls -1 ~/misttracker/*.js | wc -l" "Counting JS files..."
    
    Write-Host ""
    Write-Host "Step 2: Check system health"
    Invoke-RemoteCommand "free -h" "Memory status..."
    
    Write-Host ""
    Write-Host "Step 3: Run validation checklist"
    Invoke-RemoteCommand "bash ~/misttracker/validation-checklist.sh" "Running pre-flight checks..."
    
    Write-Host ""
    Write-Host "Step 4: Start server"
    Invoke-RemoteCommand "cd ~/misttracker && NODE_OPTIONS='--max-old-space-size=512' nohup node start-server.js 3000 > logs/server.log 2>&1 &" "Starting server..."
    
    Write-Host ""
    Write-Host "Waiting 3 seconds for server startup..."
    Start-Sleep -Seconds 3
    
    Write-Host ""
    Write-Host "Step 5: Check server health"
    Invoke-RemoteCommand "curl -s http://localhost:3000/health" "Server health check..."
    
    Write-Host ""
    Write-Host "Step 6: Run hardware fitness validation"
    Write-Host "[WARNING] This will take 5-10 minutes. Continue? (y/n)"
    $continue = Read-Host "Continue"
    if ($continue -eq "y") {
      Invoke-RemoteCommand "cd ~/misttracker && timeout 600 node hardware-fitness-validator.js" "Hardware fitness validation..."
    } else {
      Write-Host "Skipped hardware validation"
    }
    
    Write-Host ""
    Write-Host "Full validation sequence complete"
  }
  
  default {
    Write-Host "Invalid selection"
  }
}

Write-Host ""
Write-Host "=========================================================="
Write-Host "          SESSION COMPLETE"
Write-Host "=========================================================="
Write-Host ""
