# Quick deploy script for MistTracker on Devuan 10.144.113.100
# PowerShell Version - Run this directly in PowerShell

param(
  [string]$DevuanIP = "10.144.113.100",
  [string]$DevuanUser = "orion",
  [string]$DevuanPass = "Popsnap1"
)

# Colors
$green = "`e[0;32m"
$yellow = "`e[1;33m"
$blue = "`e[0;34m"
$reset = "`e[0m"

Write-Host ""
Write-Host "$blue╔════════════════════════════════════════════════════════════╗$reset" -NoNewline
Write-Host ""
Write-Host "$blue║   MistTracker Quick Deploy to Devuan $DevuanIP       ║$reset" -NoNewline
Write-Host ""
Write-Host "$blue╚════════════════════════════════════════════════════════════╝$reset" -NoNewline
Write-Host ""
Write-Host ""

$MistTrackerDir = "/home/orion/misttracker"

# Step 1: Test SSH connection
Write-Host "$yellow[1/5] Testing SSH connection to $DevuanIP...$reset"
try {
  ssh -o ConnectTimeout=5 "$DevuanUser@$DevuanIP" "echo 'SSH connection OK'" 2>&1 | Out-Null
  Write-Host "$green✓ SSH connection successful$reset"
} catch {
  Write-Host "$red✗ Cannot connect to $DevuanIP$reset"
  Write-Host "ERROR: SSH connection failed"
  Write-Host ""
  Write-Host "Verify:"
  Write-Host "  1. IP address is correct: $DevuanIP"
  Write-Host "  2. System is online and SSH is running"
  Write-Host "  3. Network connectivity from this machine"
  Write-Host "  4. SSH is installed (check: ssh -V)"
  exit 1
}

# Step 2: Create remote directory
Write-Host "$yellow[2/5] Creating remote directory at $MistTrackerDir...$reset"
ssh "$DevuanUser@$DevuanIP" "mkdir -p $MistTrackerDir/logs"
Write-Host "$green✓ Directory created$reset"

# Step 3: Transfer core files
Write-Host "$yellow[3/5] Transferring MistTracker core files...$reset"
scp -q phase-17-5-beta-network-predictor.js "$DevuanUser@$DevuanIP`:$MistTrackerDir/"
scp -q phase-17-5-beta-extended-aggregator.js "$DevuanUser@$DevuanIP`:$MistTrackerDir/"
Write-Host "$green✓ Core files transferred$reset"

# Step 4: Transfer validation tools
Write-Host "$yellow[4/5] Transferring validation tools...$reset"
scp -q hardware-fitness-validator.js "$DevuanUser@$DevuanIP`:$MistTrackerDir/"
scp -q validation-checklist.sh "$DevuanUser@$DevuanIP`:$MistTrackerDir/"
scp -q deploy-devuan.sh "$DevuanUser@$DevuanIP`:$MistTrackerDir/" 2>$null
scp -q DEPLOYMENT-DEGRADED-HARDWARE-GUIDE.md "$DevuanUser@$DevuanIP`:$MistTrackerDir/" 2>$null
scp -q PHASE-17-5-BETA-NETWORK-EXTENSION.md "$DevuanUser@$DevuanIP`:$MistTrackerDir/" 2>$null
Write-Host "$green✓ Validation tools transferred$reset"

# Step 5: Create start server script on remote
Write-Host "$yellow[5/5] Setting up server startup script...$reset"
$serverScript = @'
/**
 * MistTracker Server - Headless Entry Point
 */
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
  
  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }
  
  switch (pathname) {
    case '/health':
      healthCheck(req, res);
      break;
    case '/api/device-health':
      deviceHealth(req, res);
      break;
    case '/':
      res.writeHead(200, { 'Content-Type': 'text/plain' });
      res.end('MistTracker Server\nEndpoints: /health, /api/device-health\n');
      break;
    default:
      res.writeHead(404);
      res.end('Not found');
  }
}

const server = http.createServer(router);

server.listen(PORT, () => {
  console.log(`[${new Date().toISOString()}] MistTracker Server started`);
  console.log(`Port: ${PORT}`);
  console.log(`PID: ${process.pid}`);
});

process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down');
  server.close(() => process.exit(0));
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down');
  server.close(() => process.exit(0));
});
'@

# Save to temp file and transfer
$tempFile = [System.IO.Path]::GetTempFileName()
$serverScript | Out-File -FilePath $tempFile -Encoding UTF8 -NoNewline
scp -q $tempFile "$DevuanUser@$DevuanIP`:$MistTrackerDir/start-server.js"
Remove-Item $tempFile

Write-Host "$green✓ Server script created$reset"

Write-Host ""
Write-Host "$green╔════════════════════════════════════════════════════════════╗$reset" -NoNewline
Write-Host ""
Write-Host "$green║          TRANSFER COMPLETE - DEPLOYMENT READY             ║$reset" -NoNewline
Write-Host ""
Write-Host "$green╚════════════════════════════════════════════════════════════╝$reset" -NoNewline
Write-Host ""
Write-Host ""
Write-Host "Files transferred to: $MistTrackerDir"
Write-Host ""
Write-Host "Next steps:"
Write-Host "1. SSH into Devuan:"
Write-Host "$yellow   ssh $DevuanUser@$DevuanIP$reset"
Write-Host ""
Write-Host "2. Run validation checklist:"
Write-Host "$yellow   cd $MistTrackerDir && bash validation-checklist.sh$reset"
Write-Host ""
Write-Host "3. Start the server:"
Write-Host "$yellow   NODE_OPTIONS='--max-old-space-size=512' node start-server.js 3000 &$reset"
Write-Host ""
Write-Host "4. Verify it's running:"
Write-Host "$yellow   curl -s http://localhost:3000/health | jq .$reset"
Write-Host ""
Write-Host "5. Run hardware fitness validation:"
Write-Host "$yellow   node hardware-fitness-validator.js$reset"
Write-Host ""
