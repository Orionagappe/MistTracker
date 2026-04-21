#!/bin/bash
# Quick deploy script for MistTracker on Devuan 10.144.113.100
# Usage: bash quick-deploy.sh

DEVUAN_IP="10.144.113.100"
DEVUAN_USER="orion"
DEVUAN_PASS="Popsnap1"
DEVUAN_HOME="/home/orion"
MISTTRACKER_DIR="$DEVUAN_HOME/misttracker"

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║   MistTracker Quick Deploy to Devuan 10.144.113.100       ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Step 1: Create remote directory
echo -e "${YELLOW}[1/5] Creating remote directory...${NC}"
ssh -o ConnectTimeout=5 orion@$DEVUAN_IP "mkdir -p $MISTTRACKER_DIR/logs" 2>/dev/null || {
  echo "ERROR: Cannot connect to $DEVUAN_IP. Verify:"
  echo "  1. IP address is correct: $DEVUAN_IP"
  echo "  2. System is online and SSH is running"
  echo "  3. Network connectivity from this machine"
  exit 1
}
echo -e "${GREEN}✓ Directory created${NC}"

# Step 2: Transfer core files
echo -e "${YELLOW}[2/5] Transferring MistTracker core files...${NC}"
scp -q phase-17-5-beta-network-predictor.js orion@$DEVUAN_IP:$MISTTRACKER_DIR/ || echo "WARNING: Could not transfer network-predictor"
scp -q phase-17-5-beta-extended-aggregator.js orion@$DEVUAN_IP:$MISTTRACKER_DIR/ || echo "WARNING: Could not transfer extended-aggregator"
echo -e "${GREEN}✓ Core files transferred${NC}"

# Step 3: Transfer validation tools
echo -e "${YELLOW}[3/5] Transferring validation tools...${NC}"
scp -q hardware-fitness-validator.js orion@$DEVUAN_IP:$MISTTRACKER_DIR/ || echo "WARNING: Could not transfer validator"
scp -q validation-checklist.sh orion@$DEVUAN_IP:$MISTTRACKER_DIR/ || echo "WARNING: Could not transfer checklist"
scp -q deploy-devuan.sh orion@$DEVUAN_IP:$MISTTRACKER_DIR/ || echo "WARNING: Could not transfer deploy script"
echo -e "${GREEN}✓ Validation tools transferred${NC}"

# Step 4: Transfer documentation
echo -e "${YELLOW}[4/5] Transferring documentation...${NC}"
scp -q DEPLOYMENT-DEGRADED-HARDWARE-GUIDE.md orion@$DEVUAN_IP:$MISTTRACKER_DIR/ 2>/dev/null
scp -q PHASE-17-5-BETA-NETWORK-EXTENSION.md orion@$DEVUAN_IP:$MISTTRACKER_DIR/ 2>/dev/null
echo -e "${GREEN}✓ Documentation transferred${NC}"

# Step 5: Create start server script on remote
echo -e "${YELLOW}[5/5] Setting up server startup script...${NC}"
ssh orion@$DEVUAN_IP "cat > $MISTTRACKER_DIR/start-server.js << 'REMOTEEOF'
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
  const { pathname } = new URL(req.url, \`http://\${req.headers.host}\`);
  
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
      res.end('MistTracker Server\\nEndpoints: /health, /api/device-health\\n');
      break;
    default:
      res.writeHead(404);
      res.end('Not found');
  }
}

const server = http.createServer(router);

server.listen(PORT, () => {
  console.log(\`[\${new Date().toISOString()}] MistTracker Server started\`);
  console.log(\`Port: \${PORT}\`);
  console.log(\`PID: \${process.pid}\`);
});

process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down');
  server.close(() => process.exit(0));
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down');
  server.close(() => process.exit(0));
});
REMOTEEOF
" || echo "WARNING: Could not create start-server.js on remote"

echo -e "${GREEN}✓ Server script created${NC}"

echo ""
echo -e "${GREEN}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║          TRANSFER COMPLETE - DEPLOYMENT READY             ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo "Files transferred to: $MISTTRACKER_DIR"
echo ""
echo "Next steps:"
echo "1. SSH into Devuan:"
echo -e "   ${YELLOW}ssh orion@$DEVUAN_IP${NC}"
echo ""
echo "2. Run validation checklist:"
echo -e "   ${YELLOW}cd $MISTTRACKER_DIR && bash validation-checklist.sh${NC}"
echo ""
echo "3. Start the server:"
echo -e "   ${YELLOW}NODE_OPTIONS='--max-old-space-size=512' node start-server.js 3000 &${NC}"
echo ""
echo "4. Verify it's running:"
echo -e "   ${YELLOW}curl -s http://localhost:3000/health | jq .${NC}"
echo ""
echo "5. Run hardware fitness validation:"
echo -e "   ${YELLOW}node hardware-fitness-validator.js${NC}"
echo ""
