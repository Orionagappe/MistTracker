# PHASE 59 DEPLOYMENT GUIDE

**Quick Start for Phase 59 Leaderboard & Competition Framework**

---

## Prerequisites

- Node.js 16+ installed
- Port 8059 available (leaderboard server)
- Docker (optional, for Phase 17.5 defense nodes)
- 200MB free disk space for results

---

## Quick Deployment

### 1. Start Leaderboard Server

```bash
# Terminal 1: Start the leaderboard server
node phase59-leaderboard-server.js
```

**Output:**
```
╔════════════════════════════════════════════════════════════╗
║  PHASE 59: INTRUSION CHALLENGE 2026 - LEADERBOARD SERVER  ║
╠════════════════════════════════════════════════════════════╣
║ Status: ACTIVE                                             ║
║ Port: 8059                                                 ║
║ Endpoint: http://localhost:8059/dashboard                  ║
║ API: http://localhost:8059/api/*                           ║
║ Max Competitors: 100                                       ║
╚════════════════════════════════════════════════════════════╝
```

**Access:**
- Web Dashboard: `http://localhost:8059/dashboard`
- API Health: `http://localhost:8059/health`

---

### 2. Register Competitors

```bash
# Terminal 2: Register competitors via API
curl -X POST http://localhost:8059/api/competitors/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "CompetitorName",
    "modelType": "neural-network"
  }'
```

**Response:**
```json
{
  "success": true,
  "competitorId": "competitor_1713600000000_abc123def",
  "competitor": {
    "id": "competitor_1713600000000_abc123def",
    "name": "CompetitorName",
    "modelType": "neural-network",
    "statistics": {
      "totalAttacks": 0,
      "detections": 0,
      "falsePositives": 0,
      "detectionRate": 0
    },
    "scores": {
      "composite": 0
    }
  }
}
```

---

### 3. Submit Attacks

```bash
# Submit attack from competitor
curl -X POST http://localhost:8059/api/attacks/submit \
  -H "Content-Type: application/json" \
  -d '{
    "competitorId": "competitor_1713600000000_abc123def",
    "vector": {
      "type": "SSH_BRUTE_FORCE",
      "severity": "medium",
      "payload": {"attempts": 50, "timeWindow": 30}
    }
  }'
```

**Response:**
```json
{
  "success": true,
  "detection": true,
  "responseTime": 125.34,
  "attack": {
    "timestamp": "2026-04-20T10:30:45.123Z",
    "competitorId": "competitor_1713600000000_abc123def",
    "vector": {
      "type": "SSH_BRUTE_FORCE",
      "severity": "medium"
    },
    "detected": true,
    "responseTimeMs": 125.34
  }
}
```

---

### 4. View Leaderboard

```bash
# Get current leaderboard
curl http://localhost:8059/api/leaderboard
```

**Response:**
```json
{
  "leaderboard": [
    {
      "rank": 1,
      "name": "ThreatDetect AI",
      "modelType": "neural-network",
      "statistics": {
        "totalAttacks": 50,
        "detections": 35,
        "detectionRate": "0.700"
      },
      "scores": {
        "composite": "0.685"
      }
    }
  ],
  "stats": {
    "totalAttackAttempts": 250,
    "successfulDetections": 148,
    "competitorCount": 5
  }
}
```

---

### 5. Run Full Simulation Test

```bash
# Convert to CommonJS and run
Copy-Item phase59-beta-competition.js phase59-beta-competition.cjs -Force
node phase59-beta-competition.cjs
```

**Expected Output:**
- 5 test competitors created
- 3 defense nodes initialized
- 50 rounds × 5 competitors = 250 attacks
- Final leaderboard with rankings
- Reports saved to `test-env/phase59-results/`

---

## API Reference

### Endpoints

#### Competitor Registration
```
POST /api/competitors/register
Content-Type: application/json

{
  "name": "string (required)",
  "modelType": "string (required)"
}
```

Returns: Competitor ID and initial profile

#### Attack Submission
```
POST /api/attacks/submit
Content-Type: application/json

{
  "competitorId": "string (required)",
  "vector": {
    "type": "string",
    "severity": "string",
    "payload": "object"
  }
}
```

Returns: Detection result with response time

#### Get Leaderboard
```
GET /api/leaderboard
```

Returns: Sorted competitor rankings with metrics

#### Get Competitor Stats
```
GET /api/competitors/{competitorId}
```

Returns: Detailed competitor statistics

#### Dashboard
```
GET /dashboard
```

Returns: HTML leaderboard view (auto-refreshes every 5s)

#### Health Check
```
GET /health
```

Returns: Server status and metrics

---

## Attack Vectors Available

```javascript
const ATTACK_VECTORS = {
  "SSH_BRUTE_FORCE": { severity: "medium" },        // Repeated login attempts
  "SQL_INJECTION": { severity: "high" },            // Database query manipulation
  "PRIVILEGE_ESCALATION": { severity: "high" },     // Root access attempts
  "NETWORK_SCAN": { severity: "low" },              // Port scanning/enumeration
  "BUFFER_OVERFLOW": { severity: "critical" },      // Memory exploits
  "XSS_INJECTION": { severity: "medium" },          // Web injection
  "COMMAND_INJECTION": { severity: "high" },        // Shell command abuse
  "PATH_TRAVERSAL": { severity: "medium" },         // Directory traversal
  "ZERO_DAY_VARIANT": { severity: "critical" },     // Unknown exploits
  "TIMING_ATTACK": { severity: "low" }              // Side-channel attacks
};
```

---

## Scoring Formula

**Composite Score** = (Detection Accuracy × 0.4) + (Efficiency × 0.2) + (Novelty × 0.2) + (Robustness × 0.2)

Where:
- **Detection Accuracy** = True Positives / (TP + FN)
- **Efficiency** = (1 - False Positive Rate) × 0.7 + Speed Bonus × 0.3
- **Novelty** = min(unique_vectors / 50, 1.0)
- **Robustness** = 1 - (std_dev / 1000)

---

## Monitoring

### Dashboard View
Access `http://localhost:8059/dashboard` to see:
- Live leaderboard (top 50 competitors)
- Real-time metrics
- Total attacks processed
- Detection success rate
- Average response times

### Console Logging
Server outputs:
```
[timestamp] 📊 INFO message
[timestamp] ✅ SUCCESS message
[timestamp] ⚠️ WARNING message
[timestamp] ❌ ERROR message
```

### Results Storage
All results saved to: `test-env/phase59-results/`

Files generated:
- `competition-feasibility-test.json`
- `technical-feasibility-summary.json`
- `beta-competition-report.json`
- `marketing-validation-narrative.json`

---

## Scaling Notes

### Single Server (1 node)
- Supports: ~10 competitors
- Throughput: 100 attacks/min
- Memory: ~50MB
- Port: 8059

### Multi-Server (load balanced)
- Supports: 100+ competitors
- Throughput: 1000 attacks/min
- Memory: 200MB+ (distributed)
- Ports: 8059-8069 (each server)

### Database Integration
Currently: In-memory state (resets on restart)
Production: Replace with MongoDB/PostgreSQL

```javascript
// Pseudo-code for DB integration
const competitor = await db.competitors.findById(competitorId);
competitor.stats.attacks++;
await competitor.save();
```

---

## Troubleshooting

### Port 8059 Already in Use
```bash
# Find process using port 8059
lsof -i :8059
# Kill the process
kill -9 <PID>
```

### Competitors Not Registering
```bash
# Check server is running
curl http://localhost:8059/health

# Verify correct JSON format
curl -X POST http://localhost:8059/api/competitors/register \
  -H "Content-Type: application/json" \
  -d '{"name": "Test", "modelType": "nn"}'
```

### Attacks Not Being Detected
1. Ensure competitor registered first
2. Check defense nodes are initialized
3. Verify attack vector type is valid
4. Check server logs for errors

### Results Not Saving
```bash
# Verify results directory exists
ls -la test-env/phase59-results/

# Create if missing
mkdir -p test-env/phase59-results
```

---

## Next Steps

1. **Deploy Leaderboard** → Run server, verify dashboard works
2. **Register Test Competitors** → API calls, verify registration
3. **Submit Test Attacks** → Generate traffic, monitor detection
4. **View Leaderboard** → Verify rankings, check scoring
5. **Run Beta Simulation** → Full competition with 5 competitors
6. **Analyze Results** → Review reports, identify patterns
7. **Deploy to Production** → Scale up, add real competitors

---

## Files Overview

| File | Purpose | Usage |
|------|---------|-------|
| `phase59-leaderboard-server.js` | REST API + Dashboard | `node phase59-leaderboard-server.js` |
| `phase59-attack-simulator.js` | Attack generation | Internal (imported by other modules) |
| `phase59-beta-competition.js` | Full simulation | `node phase59-beta-competition.js` |
| `phase59-feasibility-test.js` | Infrastructure validation | One-time test |

---

## Support & Documentation

- **Technical Feasibility Report:** `PHASE-59-TECHNICAL-VALIDATION-REPORT.md`
- **Marketing Strategy:** `PHASE-59-ONE-PAGER.md`
- **Business Case:** `PHASE-59-MARKETING-ANALYSIS.md`
- **Results Data:** `test-env/phase59-results/*.json`

---

**Status: ✅ READY FOR DEPLOYMENT**

For questions or issues, refer to technical validation report or review generated JSON results files for detailed metrics.
