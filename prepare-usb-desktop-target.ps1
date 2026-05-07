# Prepare USB Drive for MistTracker Deployment to Devuan
# PowerShell Version - Run this to prepare the USB drive
# Then manually copy files from USB to Desktop on Devuan

$green = "`e[0;32m"
$yellow = "`e[1;33m"
$blue = "`e[0;34m"
$red = "`e[0;31m"
$reset = "`e[0m"

Write-Host ""
Write-Host "$blue=====================================================$reset"
Write-Host "$blue  Prepare USB for MistTracker Devuan Deployment   $reset"
Write-Host "$blue  Target: /home/orion/Desktop/misttracker/        $reset"
Write-Host "$blue=====================================================$reset"
Write-Host ""

# Verify USB drive
$usbPath = "D:\"
if (-not (Test-Path $usbPath)) {
  Write-Host "$red[ERROR] USB drive D:\ not found$reset"
  Write-Host "Please connect USB drive and run again"
  exit 1
}

Write-Host "$green[OK] USB drive D:\ detected$reset"
Write-Host ""

# Create deployment directory on USB
$deployDir = "D:\misttracker-files"
Write-Host "$yellow[1/5] Creating deployment directory on USB...$reset"

if (Test-Path $deployDir) {
  Remove-Item $deployDir -Recurse -Force
}

New-Item -ItemType Directory -Path $deployDir | Out-Null
Write-Host "$green[OK] Created: $deployDir$reset"
Write-Host ""

# Copy core Node.js files
Write-Host "$yellow[2/5] Copying MistTracker core files...$reset"

$coreFiles = @(
  "phase-17-5-beta-network-predictor.js",
  "phase-17-5-beta-extended-aggregator.js",
  "hardware-fitness-validator.js"
)

foreach ($file in $coreFiles) {
  if (Test-Path ".\$file") {
    Copy-Item ".\$file" "$deployDir\"
    Write-Host "$green[OK] Copied: $file$reset"
  } else {
    Write-Host "$red[SKIP] Missing: $file$reset"
  }
}
Write-Host ""

# Copy scripts
Write-Host "$yellow[3/5] Copying deployment scripts...$reset"

$scripts = @(
  "validation-checklist.sh",
  "deploy-devuan.sh"
)

foreach ($script in $scripts) {
  if (Test-Path ".\$script") {
    Copy-Item ".\$script" "$deployDir\"
    Write-Host "$green[OK] Copied: $script$reset"
  }
}
Write-Host ""

# Copy documentation
Write-Host "$yellow[4/5] Copying documentation...$reset"

$docs = @(
  "DEPLOYMENT-DEGRADED-HARDWARE-GUIDE.md",
  "PHASE-17-5-BETA-NETWORK-EXTENSION.md",
  "PHASE-17-5-BETA-NETWORK-QUICK-REFERENCE.md"
)

foreach ($doc in $docs) {
  if (Test-Path ".\$doc") {
    Copy-Item ".\$doc" "$deployDir\"
    Write-Host "$green[OK] Copied: $doc$reset"
  }
}
Write-Host ""

# Create start-server.js on USB
Write-Host "$yellow[5/5] Creating server startup script...$reset"

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

$serverScript | Out-File -FilePath "$deployDir\start-server.js" -Encoding UTF8 -NoNewline
Write-Host "$green[OK] Created: start-server.js$reset"
Write-Host ""

# Create setup instruction file
Write-Host "$yellow Creating setup instructions...$reset"

$instructionsPath = "$deployDir\SETUP-INSTRUCTIONS.txt"

# Write instructions using Add-Content to avoid encoding issues
@"
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
"@ | Out-File -FilePath $instructionsPath -Encoding UTF8 -Force

Write-Host "$green[OK] Created: SETUP-INSTRUCTIONS.txt$reset"
Write-Host ""

# Also copy the devuan setup script
if (Test-Path ".\devuan-desktop-setup.sh") {
  Copy-Item ".\devuan-desktop-setup.sh" "$deployDir\"
  Write-Host "$green[OK] Copied: devuan-desktop-setup.sh$reset"
}

Write-Host ""
Write-Host "$green=====================================================$reset"
Write-Host "$green        USB PREPARATION COMPLETE                    $reset"
Write-Host "$green=====================================================$reset"
Write-Host ""
Write-Host "Deployment directory: $deployDir"
Write-Host ""
Write-Host "Files ready on USB:"
Get-ChildItem $deployDir | Select-Object Name, @{Name="Size";Expression={if($_.PSIsContainer){"<DIR>"} else {"{0:N0} bytes" -f $_.Length}}} | ForEach-Object {Write-Host ("  {0} ({1})" -f $_.Name, $_.Size)}

Write-Host ""
Write-Host "$yellow====================================================$reset"
Write-Host "$yellow NEXT STEPS ON DEVUAN EXCALIBER:$reset"
Write-Host "$yellow====================================================$reset"
Write-Host ""
Write-Host "1. Insert USB drive into Devuan system"
Write-Host ""
Write-Host "2. Open file manager and copy files:"
Write-Host "   USB\misttracker-files → Desktop\misttracker"
Write-Host ""
Write-Host "3. Open Terminal and run setup script:"
Write-Host "   $yellow   bash ~/Desktop/misttracker/devuan-desktop-setup.sh$reset"
Write-Host ""
Write-Host "4. After setup completes, run validation:"
Write-Host "   $yellow   bash ~/misttracker/validation-checklist.sh$reset"
Write-Host ""
Write-Host "5. Start server:"
Write-Host "   $yellow   NODE_OPTIONS='--max-old-space-size=512' node ~/misttracker/start-server.js 3000 &$reset"
Write-Host ""
Write-Host "6. Run hardware fitness validation:"
Write-Host "   $yellow   node ~/misttracker/hardware-fitness-validator.js$reset"
Write-Host ""
Write-Host "Full instructions: SETUP-INSTRUCTIONS.txt on USB"
Write-Host ""
