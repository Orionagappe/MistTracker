# Phase 17.2.1: Cluster Deployment - IMPLEMENTATION GUIDE

## Phase 17.2.1 Overview
**Days 3-4: Cluster Deployment & Milestone Aggregation**

### Objectives
- Deploy 5-node cluster (H, He, Li, Be, B atoms)
- Implement cluster coordinator and worker nodes
- Establish inter-node communication
- Aggregate milestones from all nodes
- Test cluster-wide training

### Status
🟢 **Ready for Deployment** (100% - All components implemented)

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    COORDINATOR NODE                          │
│  - REST API (POST /api/cluster/train)                       │
│  - WebSocket Server (ws://)                                 │
│  - Cluster Health Monitoring                                │
│  - Milestone Aggregation                                    │
│  - Training Orchestration                                   │
└─────────────────────────────────────────────────────────────┘
                               ↑↓
        ┌──────────────────────┼──────────────────────┐
        ↓                      ↓                      ↓
    ┌────────┐            ┌────────┐            ┌────────┐
    │ Node-1 │            │ Node-2 │            │ Node-3 │
    │   H    │            │   He   │            │   Li   │
    │ Worker │            │ Worker │            │ Worker │
    └────────┘            └────────┘            └────────┘
        ↓                      ↓                      ↓
    (WebSocket Client)   (WebSocket Client)   (WebSocket Client)
        ↓                      ↓                      ↓
    Trains H atoms       Trains He atoms       Trains Li atoms
        ↓                      ↓                      ↓
    Sends milestones → Sends milestones → Sends milestones
        └──────────────────────┼──────────────────────┘
                               ↓
                      AGGREGATOR (Internal)
                      - Processes milestones
                      - Analyzes convergence
                      - Tracks sessions
                      - Generates reports
```

### Nodes
- **Coordinator**: Orchestrator, REST API, WebSocket server
- **Node-1**: H (Hydrogen) atom training worker
- **Node-2**: He (Helium) atom training worker
- **Node-3**: Li (Lithium) atom training worker
- **Node-4**: Be (Beryllium) atom training worker  [Added in docker-compose]
- **Node-5**: B (Boron) atom training worker       [Added in docker-compose]

---

## Quick Start: Deploy the Cluster

### Step 1: Verify Docker Compose Configuration

```bash
cd j:\Portfolio Site\Gdocsdev\MistTracker
docker-compose config
```

Expected output: Valid docker-compose configuration with:
- 1 coordinator service
- 5 worker node services (node-1 through node-5)
- Shared network (mist-cluster)
- Environment variables set

### Step 2: Start the Cluster

```bash
# Build and start all services
docker-compose up -d

# This will:
# 1. Pull node:18-alpine image
# 2. Start coordinator container
# 3. Wait for coordinator health check
# 4. Start 5 worker nodes
# 5. Workers register with coordinator
```

Verify startup:
```bash
docker-compose ps

# Expected output:
# STATUS: Up X seconds (healthy)
```

### Step 3: Check Coordinator Status

```bash
# Get cluster status
curl http://localhost:5000/api/cluster/status

# Expected response:
# {
#   "cluster_health": {
#     "healthy_nodes": 5,
#     "total_nodes": 5,
#     "avg_cpu_usage": 15.3,
#     "avg_memory_usage_mb": 128
#   },
#   "nodes": [
#     { "id": "node-1", "atom": "H", "status": "healthy", ... },
#     ...
#   ]
# }
```

### Step 4: List All Nodes

```bash
curl http://localhost:5000/api/cluster/nodes

# Shows all 5 nodes with status
```

### Step 5: View Logs

```bash
# Coordinator logs
docker logs mist-coordinator

# Worker logs
docker logs mist-node-1
docker logs mist-node-2
docker logs mist-node-3
docker logs mist-node-4
docker logs mist-node-5

# Follow logs (real-time)
docker logs -f mist-coordinator
```

---

## Testing Phase 17.2.1: Training Operations

### Test 1: Start Multi-Atom Training

```bash
# Start training on H, He, Li atoms (100 epochs each)
curl -X POST http://localhost:5000/api/cluster/train \
  -H "Content-Type: application/json" \
  -d '{
    "atoms": ["H", "He", "Li"],
    "config": {
      "epochs": 100,
      "batch_size": 32,
      "learning_rate": 0.001,
      "validation_split": 0.2
    }
  }'

# Response:
# {
#   "session_id": "uuid-here",
#   "status": "training_initiated",
#   "atoms": ["H", "He", "Li"],
#   "config": {...}
# }
```

### Test 2: Monitor Training Progress

```bash
# Get training status (repeat every 5 seconds)
curl http://localhost:5000/api/cluster/status

# Watch logs to see epoch progression
docker logs -f mist-coordinator | grep "Milestone"

# Expected output every 10 epochs:
# [Milestone] H:10 - Loss: 0.485234, Accuracy: 0.5432
# [Milestone] He:10 - Loss: 0.492156, Accuracy: 0.5201
# [Milestone] Li:10 - Loss: 0.498765, Accuracy: 0.5098
```

### Test 3: View Aggregated Milestones

```bash
# Get all milestones collected so far
curl http://localhost:5000/api/cluster/milestones

# Response shows all milestone events with:
# - Node ID and atom type
# - Epoch and metrics (loss, accuracy)
# - Timestamp
```

### Test 4: Stop Training

```bash
# Stop a specific training session
curl -X DELETE http://localhost:5000/api/cluster/train/{session_id}

# All nodes stop training for that session
```

### Test 5: Check Node Health

```bash
# Get individual node status
curl http://localhost:5001/api/worker/status  # Node-1
curl http://localhost:5002/api/worker/status  # Node-2
curl http://localhost:5003/api/worker/status  # Node-3
curl http://localhost:5004/api/worker/status  # Node-4
curl http://localhost:5005/api/worker/status  # Node-5

# Shows each node's training progress
```

---

## Milestone Aggregation & Analysis

### Using the MilestoneAggregator

```javascript
import { MilestoneAggregator } from './server/milestone-aggregator.js';

const aggregator = new MilestoneAggregator();

// Simulate adding milestones (in real use, coordinator populates these)
aggregator.addMilestone({
  node_id: 'node-1',
  atom: 'H',
  session_id: 'session-123',
  epoch: 10,
  loss: 0.485,
  accuracy: 0.543,
  metadata: { training_elapsed_ms: 10000 }
});

// Get session summary
const summary = aggregator.getSessionSummary('session-123');
console.log(summary);

// Analyze emergence chains (H → He → Li → Be → B)
const chains = aggregator.analyzeEmergenceChains('session-123');
console.log(chains);

// Export milestones to JSON
aggregator.exportToFile('milestones.json');

// Generate HTML report
aggregator.generateReport('report.html');
```

### Convergence Analysis

The aggregator automatically tracks when each atom converges:
- **Convergence Defined**: Loss improvement < 1% over 5 epochs
- **Metrics Collected**:
  - `convergence_epoch`: Epoch when convergence detected
  - `convergence_time_ms`: Milliseconds to convergence
  - `loss_history`: Complete loss trajectory
  - `accuracy_history`: Complete accuracy trajectory

### Emergence Chain Analysis

Analyzes patterns as atoms increase in atomic number:

```
H  (1 proton)  → Accuracy: 96%  → Pattern: Positive Emergence ✓
He (2 protons) → Accuracy: 94%  → Δ Accuracy: -2% ✓
Li (3 protons) → Accuracy: 92%  → Δ Accuracy: -2% ✓
Be (4 protons) → Accuracy: 90%  → Δ Accuracy: -2% ✓
B  (5 protons) → Accuracy: 88%  → Δ Accuracy: -2% ✓
```

Expected pattern: Decreasing accuracy with increasing complexity (more electrons = harder to train)

---

## Docker Compose Commands Reference

```bash
# Start cluster
docker-compose up -d

# Stop cluster
docker-compose down

# Restart specific service
docker-compose restart coordinator
docker-compose restart node-1

# View logs
docker-compose logs -f coordinator
docker-compose logs -f node-1

# Execute command in container
docker-compose exec coordinator bash
docker-compose exec node-1 sh

# Rebuild images (after code changes)
docker-compose build

# View running containers
docker ps

# Remove everything (containers + volumes)
docker-compose down -v

# Check resource usage
docker stats
```

---

## Performance Benchmarks (Phase 17.2.1)

### Expected Timings
- **Coordinator startup**: ~5 seconds
- **Worker registration**: ~10 seconds after coordinator
- **Training per epoch**: ~1 second (simulated)
- **100 epochs on one atom**: ~100 seconds
- **Parallel training (5 atoms)**: ~100 seconds (all nodes train simultaneously)
- **Milestone collection**: Real-time (<100ms latency)

### Resource Usage
- **Coordinator**: ~80MB RAM, 5-15% CPU
- **Per Worker**: ~60MB RAM, 10-20% CPU (during training)
- **Total Cluster**: ~380MB RAM, 55-115% CPU (during peak training)

### Expected Throughput
- **Milestones per second**: 5 (one per atom per 10 epochs)
- **Data volume**: ~1KB per milestone
- **Total session data (100 epochs)**: ~10 * 1KB * 10 = ~100KB

---

## Advanced: Custom Training Configuration

### Run Training with Custom Parameters

```bash
curl -X POST http://localhost:5000/api/cluster/train \
  -H "Content-Type: application/json" \
  -d '{
    "atoms": ["H", "He", "Li", "Be", "B"],
    "config": {
      "epochs": 200,
      "batch_size": 64,
      "learning_rate": 0.0005,
      "validation_split": 0.25
    }
  }'
```

### Incremental Deployment (Start fewer nodes first)

```bash
# Start only coordinator
docker-compose up -d coordinator

# Wait for health check
sleep 20

# Add nodes incrementally
docker-compose up -d node-1
sleep 5
docker-compose up -d node-2
sleep 5
docker-compose up -d node-3
# etc.
```

### Multi-Session Training

```bash
# Session 1: Train H + He
SESSION1=$(curl -X POST http://localhost:5000/api/cluster/train \
  -H "Content-Type: application/json" \
  -d '{"atoms": ["H", "He"], "config": {"epochs": 50}}' \
  | jq -r '.session_id')

# Session 2: Train Li + Be (runs in parallel)
SESSION2=$(curl -X POST http://localhost:5000/api/cluster/train \
  -H "Content-Type: application/json" \
  -d '{"atoms": ["Li", "Be"], "config": {"epochs": 100}}' \
  | jq -r '.session_id')

# Monitor both simultaneously
watch curl http://localhost:5000/api/cluster/status
```

---

## Monitoring Dashboard (Manual)

Create a simple monitoring script:

```bash
#!/bin/bash
# watch-cluster.sh

while true; do
  clear
  echo "╔════════════════════════════════════════════════╗"
  echo "║         CLUSTER STATUS - $(date +%H:%M:%S)               ║"
  echo "╚════════════════════════════════════════════════╝"
  
  curl -s http://localhost:5000/api/cluster/status | jq '.'
  
  sleep 5
done
```

Run with: `bash watch-cluster.sh`

---

## Troubleshooting

### Issue: Nodes not connecting to coordinator

**Check:**
```bash
docker logs mist-coordinator | grep "REGISTER"
docker logs mist-node-1 | grep "Connected"
```

**Solution:**
- Verify network: `docker network ls | grep mist-cluster`
- Check coordinator health: `curl http://localhost:5000/health`
- Restart coordinator: `docker-compose restart coordinator`

### Issue: Training not progressing

**Check:**
```bash
docker logs -f mist-coordinator | grep "Milestone"
curl http://localhost:5000/api/cluster/status | jq '.nodes[0].current_epoch'
```

**Solution:**
- Verify nodes are "healthy": `curl http://localhost:5000/api/cluster/status`
- Check WebSocket connections are established
- Restart all nodes: `docker-compose restart`

### Issue: Memory usage growing

**Check:**
```bash
docker stats --no-stream
```

**Solution:**
- Reduce epochs per training session
- Clear old milestones: Restart cluster
- Reduce batch size

### Issue: Cannot reach API on host

**Check:**
```bash
docker ps | grep mist-coordinator
```

**Solution:**
- Verify port mapping: `-p 5000:5000` in docker-compose.yml
- Check firewall: `netstat -an | grep 5000`
- Test from container: `docker exec mist-coordinator curl localhost:5000/health`

---

## Next Steps: Phase 17.2.2 (Days 5-6)

After Phase 17.2.1 completes, Phase 17.2.2 will add:
- Real-time visualization dashboard
- Training progress charts
- Accuracy/loss convergence plots
- Cluster health monitoring UI
- Milestone timeline

---

## Quick Reference: Key Files

| Component | File | Purpose |
|-----------|------|---------|
| Coordinator | `server/cluster-coordinator.js` | Main orchestrator |
| Worker | `server/cluster-worker.js` | Training node |
| Aggregator | `server/milestone-aggregator.js` | Milestone collection & analysis |
| Config | `docker-compose.yml` | Cluster infrastructure |
| API | `server/multiAtomAPI.js` | REST endpoints |

---

## Success Criteria

Phase 17.2.1 is complete when:

✓ All 5 nodes connect to coordinator  
✓ Training starts and progresses on all nodes  
✓ Milestones collected from all atoms  
✓ Convergence detected for all atoms  
✓ Session summary generated  
✓ Emergence chains analyzed  
✓ Report generated  
✓ No memory leaks after 1 hour of training  

---

**Status**: Phase 17.2.1 Ready for Deployment  
**Last Updated**: April 19, 2026  
**Next Phase**: 17.2.2 - Visualization Dashboard
