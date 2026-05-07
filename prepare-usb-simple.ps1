# Prepare USB Drive for MistTracker Deployment to Devuan
# PowerShell 5.1 Compatible Version
# No ANSI color codes - pure compatibility mode

Write-Host ""
Write-Host "========================================================"
Write-Host "  Prepare USB for MistTracker Devuan Deployment"
Write-Host "  Target: /home/orion/Desktop/misttracker/"
Write-Host "========================================================"
Write-Host ""

# Verify USB drive
$usbPath = "D:\"
if (-not (Test-Path $usbPath)) {
  Write-Host "[ERROR] USB drive D:\ not found"
  Write-Host "Please connect USB drive and run again"
  exit 1
}

Write-Host "[OK] USB drive D:\ detected"
Write-Host ""

# Create deployment directory on USB
$deployDir = "D:\misttracker-files"
Write-Host "[1/5] Creating deployment directory on USB..."

if (Test-Path $deployDir) {
  Remove-Item $deployDir -Recurse -Force
}

New-Item -ItemType Directory -Path $deployDir -ErrorAction Stop | Out-Null
Write-Host "[OK] Created: $deployDir"
Write-Host ""

# Copy core Node.js files
Write-Host "[2/5] Copying MistTracker core files..."

$coreFiles = @(
  "phase-17-5-beta-network-predictor.js",
  "phase-17-5-beta-extended-aggregator.js",
  "hardware-fitness-validator.js"
)

$copiedCount = 0
foreach ($file in $coreFiles) {
  $sourcePath = Join-Path (Get-Location) $file
  if (Test-Path $sourcePath) {
    Copy-Item $sourcePath "$deployDir\" -ErrorAction Stop
    Write-Host "[OK] Copied: $file"
    $copiedCount++
  } else {
    Write-Host "[SKIP] Missing: $file"
  }
}
Write-Host ""

# Copy scripts
Write-Host "[3/5] Copying deployment scripts..."

$scripts = @(
  "validation-checklist.sh",
  "deploy-devuan.sh"
)

foreach ($script in $scripts) {
  $sourcePath = Join-Path (Get-Location) $script
  if (Test-Path $sourcePath) {
    Copy-Item $sourcePath "$deployDir\" -ErrorAction Stop
    Write-Host "[OK] Copied: $script"
  }
}
Write-Host ""

# Copy documentation
Write-Host "[4/5] Copying documentation..."

$docs = @(
  "DEPLOYMENT-DEGRADED-HARDWARE-GUIDE.md",
  "PHASE-17-5-BETA-NETWORK-EXTENSION.md",
  "PHASE-17-5-BETA-NETWORK-QUICK-REFERENCE.md"
)

foreach ($doc in $docs) {
  $sourcePath = Join-Path (Get-Location) $doc
  if (Test-Path $sourcePath) {
    Copy-Item $sourcePath "$deployDir\" -ErrorAction Stop
    Write-Host "[OK] Copied: $doc"
  }
}
Write-Host ""

# Create start-server.js on USB
Write-Host "[5/5] Creating server startup script..."

$serverScript = @'
const http = require('http');
const { NetworkDevicePredictor } = require('./phase-17-5-beta-network-predictor');

const PORT = process.argv[2] || 3000;
const predictor = new NetworkDevicePredictor();
const startTime = Date.now();

function healthCheck(req, res) {
  const uptime = Math.floor((Date.now() - startTime) / 1000);
  const memUsage = process.memoryUsage();
  const health = {
    status: 'OK',
    uptime: uptime,
    timestamp: new Date().toISOString(),
    memory: {
      heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024),
      heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024),
      external: Math.round(memUsage.external / 1024 / 1024),
      rss: Math.round(memUsage.rss / 1024 / 1024)
    },
    node: process.version
  };
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(health, null, 2));
}

function deviceHealth(req, res) {
  const testDevice = {
    name: 'Test Device',
    model: 'Motorola MB8621',
    type: 'modem',
    location: 'Test',
    ageYears: 3,
    currentTemp: 48,
    bandwidth: 800,
    maxBandwidth: 1000,
    criticality: 'CRITICAL'
  };
  try {
    const health = predictor.predictDeviceHealth(testDevice);
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(health, null, 2));
  } catch (error) {
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: error.message }));
  }
}

function router(req, res) {
  const { pathname } = new URL(req.url, `http://${req.headers.host}`);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  if (req.method === 'OPTIONS') { res.writeHead(200); res.end(); return; }
  switch (pathname) {
    case '/health': healthCheck(req, res); break;
    case '/api/device-health': deviceHealth(req, res); break;
    case '/': res.writeHead(200, { 'Content-Type': 'text/plain' }); res.end('MistTracker Server\nEndpoints: /health, /api/device-health\n'); break;
    default: res.writeHead(404); res.end('Not found');
  }
}

const server = http.createServer(router);
server.listen(PORT, () => {
  console.log(`[${new Date().toISOString()}] MistTracker Server started`);
  console.log(`Port: ${PORT}`);
  console.log(`PID: ${process.pid}`);
});

process.on('SIGTERM', () => { console.log('SIGTERM received'); server.close(() => process.exit(0)); });
process.on('SIGINT', () => { console.log('SIGINT received'); server.close(() => process.exit(0)); });
'@

$serverPath = Join-Path $deployDir "start-server.js"
$serverScript | Out-File -FilePath $serverPath -Encoding UTF8 -NoNewline -ErrorAction Stop
Write-Host "[OK] Created: start-server.js"
Write-Host ""

# Create setup instruction file
Write-Host "Creating setup instructions..."

$instructionsPath = Join-Path $deployDir "SETUP-INSTRUCTIONS.txt"

$instructions = @"
MistTracker Deployment to Devuan - Setup Instructions

STEP 1: Copy files from USB to Desktop

1. On Devuan Excaliber, insert the USB drive
2. Open file manager (if not auto-mounted)
3. Navigate to the USB drive location
4. Find the folder: misttracker-files
5. Copy ALL files from misttracker-files to Desktop/misttracker/
   - Right-click misttracker-files, select Copy
   - Navigate to Desktop
   - Right-click, Create Folder, name it: misttracker
   - Paste files into misttracker folder

STEP 2: Run the setup script

1. Open Terminal on Devuan
2. Run this command:

   bash ~/Desktop/misttracker/devuan-desktop-setup.sh

   This will:
   - Verify all files are present
   - Create /home/orion/misttracker/ directory
   - Copy files to the proper location
   - Set file permissions

STEP 3: Validate the installation

Once setup.sh completes, run:

   bash ~/misttracker/validation-checklist.sh

This will check:
   [OK] System requirements
   [OK] Node.js installation
   [OK] Disk space and RAM
   [OK] Network configuration

STEP 4: Start the MistTracker server

In Terminal, run:

   cd ~/misttracker
   NODE_OPTIONS='--max-old-space-size=512' node start-server.js 3000 &

You should see:
   [TIMESTAMP] MistTracker Server started
   Port: 3000
   PID: XXXX

STEP 5: Test the server

In Terminal, run:

   curl -s http://localhost:3000/health | jq .

Expected output:
   {
     "status": "OK",
     "uptime": XXX,
     "memory": { ... }
   }

STEP 6: Run hardware fitness validation

In Terminal, run:

   node ~/misttracker/hardware-fitness-validator.js

This will take 5-10 minutes and test:
   [TEST] Device prediction performance (1000 iterations)
   [TEST] Mesh topology analysis (100 iterations)
   [TEST] Portfolio aggregation (50 iterations)
   [TEST] Memory stability (30 seconds)
   [RESULT] Overall hardware fitness assessment

FILES INCLUDED

Core Modules:
  * phase-17-5-beta-network-predictor.js (600+ lines of code)
  * phase-17-5-beta-extended-aggregator.js (400+ lines of code)
  * hardware-fitness-validator.js (comprehensive benchmarks)

Scripts:
  * start-server.js (headless HTTP server)
  * validation-checklist.sh (pre-flight checks)
  * deploy-devuan.sh (deployment automation)
  * devuan-desktop-setup.sh (installation script)

Documentation:
  * DEPLOYMENT-DEGRADED-HARDWARE-GUIDE.md
  * PHASE-17-5-BETA-NETWORK-EXTENSION.md
  * PHASE-17-5-BETA-NETWORK-QUICK-REFERENCE.md

TROUBLESHOOTING

If setup.sh fails:
  1. Verify all files are in ~/Desktop/misttracker/
  2. Check file permissions: ls -la ~/Desktop/misttracker/
  3. Ensure you have write access to home directory

If validation-checklist.sh shows failures:
  1. Check available RAM: free -h
  2. Check Node.js: node --version
  3. Check disk space: df -h ~

If server won't start:
  1. Check if port 3000 is available: lsof -i :3000
  2. Check error message for clues
  3. Try with different heap size: --max-old-space-size=256

If hardware validation fails:
  1. Make sure server is running
  2. Check system resources during test
  3. Review /proc/meminfo for available memory

MONITORING SERVER

Check health endpoint:
   curl http://localhost:3000/health

Monitor memory usage:
   watch -n 1 'free -h && ps aux | grep node'

Stop server:
   killall node

Restart server:
   NODE_OPTIONS='--max-old-space-size=512' node ~/misttracker/start-server.js 3000 &

View logs:
   tail -f ~/misttracker/logs/server.log

QUESTIONS?

Review the documentation files included:
  * DEPLOYMENT-DEGRADED-HARDWARE-GUIDE.md - Complete setup guide
  * PHASE-17-5-BETA-NETWORK-QUICK-REFERENCE.md - Quick reference
"@

$instructions | Out-File -FilePath $instructionsPath -Encoding UTF8 -ErrorAction Stop
Write-Host "[OK] Created: SETUP-INSTRUCTIONS.txt"
Write-Host ""

# Copy the devuan setup script
$setupScriptSource = Join-Path (Get-Location) "devuan-desktop-setup.sh"
if (Test-Path $setupScriptSource) {
  Copy-Item $setupScriptSource "$deployDir\" -ErrorAction Stop
  Write-Host "[OK] Copied: devuan-desktop-setup.sh"
}

# Copy the debug setup script
$setupDebugSource = Join-Path (Get-Location) "devuan-desktop-setup-debug.sh"
if (Test-Path $setupDebugSource) {
  Copy-Item $setupDebugSource "$deployDir\" -ErrorAction Stop
  Write-Host "[OK] Copied: devuan-desktop-setup-debug.sh"
}

# Copy the FIXED setup script (handles root vs. orion user)
$setupFixedSource = Join-Path (Get-Location) "devuan-desktop-setup-fixed.sh"
if (Test-Path $setupFixedSource) {
  Copy-Item $setupFixedSource "$deployDir\" -ErrorAction Stop
  Write-Host "[OK] Copied: devuan-desktop-setup-fixed.sh"
}

Write-Host ""
Write-Host "========================================================"
Write-Host "        USB PREPARATION COMPLETE"
Write-Host "========================================================"
Write-Host ""
Write-Host "Deployment directory: $deployDir"
Write-Host ""
Write-Host "Files ready on USB:"
Get-ChildItem $deployDir | ForEach-Object { Write-Host ("  {0}" -f $_.Name) }

Write-Host ""
Write-Host "========================================================"
Write-Host " NEXT STEPS ON DEVUAN EXCALIBER:"
Write-Host "========================================================"
Write-Host ""
Write-Host "1. Insert USB drive into Devuan system"
Write-Host ""
Write-Host "2. Open file manager and copy files:"
Write-Host "   USB\misttracker-files  -->  Desktop\misttracker"
Write-Host ""
Write-Host "3. Open Terminal and run setup script:"
Write-Host "   bash ~/Desktop/misttracker/devuan-desktop-setup.sh"
Write-Host ""
Write-Host "4. After setup completes, run validation:"
Write-Host "   bash ~/misttracker/validation-checklist.sh"
Write-Host ""
Write-Host "5. Start server:"
Write-Host "   NODE_OPTIONS='--max-old-space-size=512' node ~/misttracker/start-server.js 3000 &"
Write-Host ""
Write-Host "6. Run hardware fitness validation:"
Write-Host "   node ~/misttracker/hardware-fitness-validator.js"
Write-Host ""
Write-Host "Full instructions: SETUP-INSTRUCTIONS.txt on USB"
Write-Host ""
Write-Host "EXIT: 0 (SUCCESS)"
