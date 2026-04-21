# MistTracker Deployment via SSH + expect script
# Uses password auth with automated input

param(
  [string]$DevuanIP = "10.144.113.100",
  [string]$DevuanUser = "orion",
  [string]$DevuanPassword = "Popsnap1",
  [string]$DevuanPath = "/home/orion/Desktop/misttracker"
)

Write-Host ""
Write-Host "=========================================================="
Write-Host "  MistTracker - SSH Deployment (Native)"
Write-Host "=========================================================="
Write-Host ""

$files = @(
  "hardware-fitness-validator.js",
  "phase-17-5-beta-extended-aggregator.js",
  "phase-17-5-beta-aggregator.js",
  "phase-17-5-beta-cve-forecaster.js",
  "phase-17-5-beta-friction-predictor.js",
  "phase-17-5-beta-stability-modeler.js",
  "phase-17-5-beta-network-predictor.js"
)

Write-Host "[*] Checking files..."
foreach ($file in $files) {
  if (Test-Path $file) {
    $size = (Get-Item $file).Length
    Write-Host "  [OK] $file"
  } else {
    Write-Host "  [MISSING] $file"
    exit 1
  }
}

Write-Host ""
Write-Host "[*] Creating expect script for password-based SCP..."

# Create expect script
$expectScript = @"
#!/usr/bin/expect -f
set timeout 10
set user orion
set pass Popsnap1
set host 10.144.113.100
set remote_dir /home/orion/Desktop/misttracker

# Array of files to transfer
set files {
  hardware-fitness-validator.js
  phase-17-5-beta-extended-aggregator.js
  phase-17-5-beta-aggregator.js
  phase-17-5-beta-cve-forecaster.js
  phase-17-5-beta-friction-predictor.js
  phase-17-5-beta-stability-modeler.js
  phase-17-5-beta-network-predictor.js
}

set success_count 0
set fail_count 0

foreach file \$files {
  puts "Copying \$file..."
  
  spawn scp -p \$file \$user@\$host:\$remote_dir/
  
  expect {
    "password:" {
      send "\$pass\r"
      expect {
        "100%" {
          puts "  \[OK\] \$file"
          incr success_count
        }
        timeout {
          puts "  \[TIMEOUT\]"
          incr fail_count
        }
        eof {
          if {[catch {wait} result]} {
            if {[lindex \$result 3] == 0} {
              puts "  \[OK\] \$file"
              incr success_count
            } else {
              puts "  \[FAILED\]"
              incr fail_count
            }
          }
        }
      }
    }
    timeout {
      puts "  \[TIMEOUT - no password prompt\]"
      incr fail_count
    }
  }
}

puts ""
puts "\[SUMMARY\] \$success_count deployed, \$fail_count failed"

if {\$fail_count == 0} {
  exit 0
} else {
  exit 1
}
"@

# Check if expect is available
$expectAvailable = $false
try {
  $result = & expect -v 2>&1
  if ($result -like "*expect version*") {
    $expectAvailable = $true
    Write-Host "[OK] expect found"
  }
} catch {
  Write-Host "[WARN] expect not available, trying alternative method..."
}

if ($expectAvailable) {
  # Save and run expect script
  $tempExpect = "$env:TEMP\deploy_misttracker_$([DateTime]::Now.Ticks).exp"
  Set-Content -Path $tempExpect -Value $expectScript -Encoding ASCII
  
  Write-Host "[*] Running expect script..."
  Write-Host ""
  
  & expect $tempExpect
  $exitCode = $LASTEXITCODE
  
  Remove-Item $tempExpect -Force -ErrorAction SilentlyContinue
  exit $exitCode
} else {
  Write-Host "[!] expect not available on Windows"
  Write-Host ""
  Write-Host "Alternatives:"
  Write-Host "1. Use WSL: wsl bash -c 'for f in *.js; do scp \$f orion@10.144.113.100:/home/orion/Desktop/misttracker/; done'"
  Write-Host ""
  Write-Host "2. Use manual SCP (you'll be prompted for password each time):"
  foreach ($file in $files) {
    Write-Host "   scp $file orion@$DevuanIP`:`$DevuanPath/"
  }
  Write-Host ""
  exit 1
}
