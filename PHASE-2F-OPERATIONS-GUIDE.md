# Phase 2f: Distributed Storage - Deployment & Operations Guide

## Quick Start

### Single-Node Setup (Development)

```python
from phase_2f_distributed_storage import initialize_storage
from phase_2f_consensus_engine import initialize_consensus
from phase_2f_node_manager import initialize_node_manager, ReplicationStrategy

# Initialize single node
storage = initialize_storage("node_1", "us-west", "misttracker.db")
consensus = initialize_consensus("node_1", ["node_1"])
node_mgr = initialize_node_manager("node_1", ReplicationStrategy.EVENTUAL_CONSISTENCY)

# Register the node
node_mgr.register_node("node_1", "us-west", "localhost:8000")

print("Phase 2f initialized!")
```

### Multi-Node Setup (Production)

#### Architecture: 3-Node Cluster (Recommended)

```
┌─────────────────┐
│   node_1        │
│   us-west       │
│   Primary       │
│   Active        │
└────────┬────────┘
         │ Replicate
         │
    ┌────┴──────┬──────────┐
    │            │          │
┌───▼─────┐  ┌──▼──────┐  ┌┴────────┐
│ node_2  │  │ node_3  │  │ Quorum  │
│ us-east │  │eu-west  │  │  (2/3)  │
│Primary  │  │ Backup  │  │         │
└─────────┘  └─────────┘  └─────────┘
```

#### Node Configuration

**node_1.py** (us-west primary):
```python
from phase_2f_distributed_storage import initialize_storage
from phase_2f_consensus_engine import initialize_consensus
from phase_2f_node_manager import initialize_node_manager, ReplicationStrategy

storage_1 = initialize_storage("node_1", "us-west", "./data/node_1.db")
consensus_1 = initialize_consensus("node_1", ["node_1", "node_2", "node_3"])
node_mgr_1 = initialize_node_manager("node_1", ReplicationStrategy.EVENTUAL_CONSISTENCY)

# Register all nodes
node_mgr_1.register_node("node_1", "us-west", "node-1.prod.internal:8000")
node_mgr_1.register_node("node_2", "us-east", "node-2.prod.internal:8001")
node_mgr_1.register_node("node_3", "eu-west", "node-3.prod.internal:8002", is_backup=True, primary_node="node_2")

# Start health monitoring
node_mgr_1.start_health_monitoring(check_interval_seconds=10)
```

**node_2.py** (us-east primary):
```python
storage_2 = initialize_storage("node_2", "us-east", "./data/node_2.db")
consensus_2 = initialize_consensus("node_2", ["node_1", "node_2", "node_3"])
node_mgr_2 = initialize_node_manager("node_2", ReplicationStrategy.EVENTUAL_CONSISTENCY)

node_mgr_2.register_node("node_1", "us-west", "node-1.prod.internal:8000")
node_mgr_2.register_node("node_2", "us-east", "node-2.prod.internal:8001")
node_mgr_2.register_node("node_3", "eu-west", "node-3.prod.internal:8002", is_backup=True, primary_node="node_2")

node_mgr_2.start_health_monitoring(check_interval_seconds=10)
```

**node_3.py** (eu-west backup for node_2):
```python
storage_3 = initialize_storage("node_3", "eu-west", "./data/node_3.db")
consensus_3 = initialize_consensus("node_3", ["node_1", "node_2", "node_3"])
node_mgr_3 = initialize_node_manager("node_3", ReplicationStrategy.EVENTUAL_CONSISTENCY)

node_mgr_3.register_node("node_1", "us-west", "node-1.prod.internal:8000")
node_mgr_3.register_node("node_2", "us-east", "node-2.prod.internal:8001")
node_mgr_3.register_node("node_3", "eu-west", "node-3.prod.internal:8002", is_backup=True, primary_node="node_2")

node_mgr_3.start_health_monitoring(check_interval_seconds=10)
```

---

## Deployment Scenarios

### Scenario 1: Local Development (1 Node)

**Setup:**
```bash
mkdir -p ./phase_2f_data
cd ./phase_2f_data

python << 'EOF'
from phase_2f_distributed_storage import initialize_storage
from phase_2f_consensus_engine import initialize_consensus
from phase_2f_node_manager import initialize_node_manager, ReplicationStrategy

storage = initialize_storage("dev_node", "local", "dev.db")
consensus = initialize_consensus("dev_node", ["dev_node"])
node_mgr = initialize_node_manager("dev_node", ReplicationStrategy.EVENTUAL_CONSISTENCY)

node_mgr.register_node("dev_node", "local", "localhost:8000")
node_mgr.start_health_monitoring()

print("✓ Development cluster initialized")
EOF
```

**Verification:**
```bash
python -c "
from phase_2f_distributed_storage import get_storage
storage = get_storage()
status = storage.get_system_status()
print(f'Nodes: {status[\"total_nodes\"]}')
print(f'Healthy: {status[\"healthy_nodes\"]}')
"
```

---

### Scenario 2: Regional Failover (3 Nodes, 2 Regions)

**Topology:**
```
US Region (Primary)        EU Region (Backup)
┌─────────────────┐        ┌──────────────────┐
│   node_1        │        │    node_2        │
│ (Primary)       │◄──────►│   (Backup)       │
└─────────────────┘        └──────────────────┘
       │                             │
       └─────────┬────────────┬──────┘
                 │            │
            ┌────▼────┐  ┌───▼─────┐
            │ Quorum  │  │Consensus│
            │ (2/3)   │  │ Engine  │
            └─────────┘  └─────────┘
```

**Configuration:**

Node 1 (US Primary):
```python
node_mgr_1.register_node("node_1", "us-east", "node_1.us.aws:8000")
node_mgr_1.register_node("node_2", "eu-west", "node_2.eu.aws:8000", is_backup=True, primary_node="node_1")
```

Node 2 (EU Backup):
```python
node_mgr_2.register_node("node_1", "us-east", "node_1.us.aws:8000")
node_mgr_2.register_node("node_2", "eu-west", "node_2.eu.aws:8000", is_backup=True, primary_node="node_1")
```

**Failover Handling:**
1. Node 1 fails → Health monitor detects (30s timeout)
2. Node 2 (backup) is promoted
3. New data goes to node_2
4. Existing data replicated to node_2
5. When node_1 recovers → Catch up replication

---

### Scenario 3: Multi-Region HA (5 Nodes)

**Topology:**
```
US-WEST         US-EAST         EU-WEST
┌───────┐       ┌───────┐       ┌───────┐
│node_1 │       │node_2 │       │node_3 │
│Primary│◄─────►│Primary│◄─────►│Primary│
└───────┘       └───────┘       └───────┘
    │               │               │
    │               │               │
    └───────────────┼───────────────┘
                    │
            ┌───────┴────────┐
            │                │
        ┌───▼──┐         ┌──▼────┐
        │node_4│         │node_5 │
        │Backup│         │Backup │
        └──────┘         └───────┘
        (for node_2)     (for node_3)
```

**Quorum Calculation:**
- Cluster size: 5 nodes
- Quorum size: (5 // 2) + 1 = 3 nodes
- Tolerance: Can lose 2 nodes and still have consensus

**Configuration:**
```python
all_nodes = ["node_1", "node_2", "node_3", "node_4", "node_5"]

# Node 1 (US-WEST Primary)
node_mgr_1.register_node("node_1", "us-west", "node_1:8000")
node_mgr_1.register_node("node_2", "us-east", "node_2:8001")
node_mgr_1.register_node("node_3", "eu-west", "node_3:8002")
node_mgr_1.register_node("node_4", "us-east", "node_4:8003", is_backup=True, primary_node="node_2")
node_mgr_1.register_node("node_5", "eu-west", "node_5:8004", is_backup=True, primary_node="node_3")
```

---

## Data Replication Strategies

### Strategy 1: Eventual Consistency (Default)

**Best For:** High availability, tolerating temporary data inconsistency

**Behavior:**
```
Client writes to node_1
  ↓
Data committed locally
  ↓
Client gets success
  ↓
Async replication to node_2, node_3 (seconds)
  ↓
All nodes eventually consistent
```

**Configuration:**
```python
node_mgr = initialize_node_manager("node_1", ReplicationStrategy.EVENTUAL_CONSISTENCY)
```

**Pros:**
- Low latency writes (local commit only)
- High throughput
- Tolerates node failures during replication

**Cons:**
- Temporary inconsistency
- Older data on some nodes

**Use Case:** Expert feedback, correlations, historical data

---

### Strategy 2: Strong Consistency

**Best For:** Critical data requiring immediate consistency

**Behavior:**
```
Client writes to node_1
  ↓
Data committed locally
  ↓
Wait for ack from node_2, node_3 (quorum)
  ↓
Client gets success
```

**Configuration:**
```python
node_mgr = initialize_node_manager("node_1", ReplicationStrategy.STRONG_CONSISTENCY)
```

**Pros:**
- All nodes consistent immediately
- No data loss guarantees (quorum-based)
- Best for critical decisions

**Cons:**
- Higher latency
- Lower throughput
- Blocks writes if quorum unavailable

**Use Case:** Consensus proposals, alert approvals

---

### Strategy 3: Read Repair

**Best For:** Lazy consistency during reads

**Behavior:**
```
Write to node_1 (eventual consistency)
  ↓
Read from any node
  ↓
If stale data detected → Fetch from primary
  ↓
Update stale node in background
```

**Configuration:**
```python
node_mgr = initialize_node_manager("node_1", ReplicationStrategy.READ_REPAIR)
```

**Pros:**
- Low write latency (eventual)
- Consistency on read access
- Hybrid approach

**Cons:**
- Read latency may increase
- Background updates needed

**Use Case:** Threshold data, cached results

---

## Monitoring & Maintenance

### Health Checks

**Check Cluster Health:**
```bash
curl http://localhost:8000/api/cluster/status
```

**Expected Response (Healthy):**
```json
{
  "status": "healthy",
  "total_nodes": 3,
  "healthy_nodes": 3,
  "regions": {
    "us-west": {"healthy": 1, "total": 1},
    "us-east": {"healthy": 1, "total": 1},
    "eu-west": {"healthy": 1, "total": 1}
  }
}
```

**Expected Response (Degraded):**
```json
{
  "status": "degraded",
  "total_nodes": 3,
  "healthy_nodes": 2,
  "regions": {
    "us-west": {"healthy": 1, "total": 1},
    "us-east": {"healthy": 0, "total": 1},  // Unhealthy!
    "eu-west": {"healthy": 1, "total": 1}
  }
}
```

---

### Monitoring Metrics

**Log Monitoring:**
```bash
# Watch for replication issues
tail -f *.log | grep "Conflict\|Failed\|Error"

# Monitor health checks
tail -f *.log | grep "Health Check\|Online\|Offline"

# Track failover events
tail -f *.log | grep "Failover\|Promote\|Backup"
```

**Key Metrics to Track:**
1. **Replication Latency**: Time to replicate data across nodes
2. **Node Availability**: % of time each node is online
3. **Consensus Vote Time**: Time to reach quorum decision
4. **Failover Time**: Time from detection to backup activation
5. **Data Consistency**: % of nodes with latest version

---

### Backup & Recovery

**Backup Database:**
```bash
# Stop health monitoring
node_mgr.stop_health_monitoring()

# Backup SQLite database
cp ./data/node_1.db ./backups/node_1_$(date +%Y%m%d_%H%M%S).db

# Start health monitoring again
node_mgr.start_health_monitoring()
```

**Restore from Backup:**
```bash
# Stop node
# Restore backup
cp ./backups/node_1_20250421_164000.db ./data/node_1.db

# Restart node
# Automatic catch-up replication happens
```

---

## Troubleshooting

### Issue: Nodes Can't See Each Other

**Symptoms:** 
- Node appears offline
- No replication happening
- Failover not triggering

**Diagnosis:**
```bash
# Check network connectivity
ping node_2.prod.internal

# Check logs for connection errors
grep "Connection refused\|Timeout\|Unreachable" *.log

# Verify addresses in cluster
curl http://localhost:8000/api/cluster/nodes
```

**Solution:**
1. Verify network connectivity between nodes
2. Check firewall rules (port 8000-8004)
3. Verify addresses in node_mgr.register_node() calls
4. Check DNS resolution

---

### Issue: Consensus Voting Stuck

**Symptoms:**
- Proposals never reach "approved" status
- Quorum votes not being counted
- Alerts not being approved

**Diagnosis:**
```bash
# Check proposal status
curl http://localhost:8000/api/consensus/proposals

# Check if nodes are voting
grep "vote_on_proposal\|Recorded votes" *.log
```

**Solution:**
1. Verify quorum size calculation: (cluster_size // 2) + 1
2. Ensure enough healthy nodes are available
3. Check consensus engine initialization with all node IDs
4. Verify votes are coming from valid node IDs

---

### Issue: Data Loss After Node Failure

**Symptoms:**
- Records disappear after node fails
- Replication factor too low
- Conflicts not being detected

**Diagnosis:**
```bash
# Check replication status
curl http://localhost:8000/api/replication/status

# Check conflicts
sqlite3 ./data/node_1.db "SELECT COUNT(*) FROM conflicts;"

# Check replication history
grep "Synced.*records" *.log
```

**Solution:**
1. Increase replication factor (replicate to all nodes)
2. Use strong consistency for critical data
3. Implement backup snapshots
4. Monitor and alert on low replication factor

---

## Performance Tuning

### Optimize Replication

**Current Settings:**
```python
# Health check every 10 seconds
node_mgr.start_health_monitoring(check_interval_seconds=10)

# Failure detection after 30 seconds
node_mgr.failure_threshold_seconds = 30

# Data categories replicated
categories = [
    DataCategory.EXPERT_FEEDBACK,
    DataCategory.ALERTS,
    DataCategory.CORRELATIONS,
    DataCategory.THRESHOLDS,
]
```

**Tuning Options:**

For **Fast Failover** (latency-sensitive):
```python
check_interval_seconds=5        # Check health every 5s
failure_threshold_seconds=15    # Fail after 15s
# Tradeoff: More CPU, faster detection
```

For **Low Overhead** (high-throughput):
```python
check_interval_seconds=30       # Check health every 30s
failure_threshold_seconds=60    # Fail after 60s
# Tradeoff: Slower detection, less CPU
```

---

### Database Optimization

**SQLite Tuning:**
```python
# In phase_2f_distributed_storage.py
conn = sqlite3.connect(db_path)
conn.execute("PRAGMA journal_mode=WAL")      # Write-Ahead Logging
conn.execute("PRAGMA synchronous=NORMAL")    # Balance speed/safety
conn.execute("PRAGMA cache_size=10000")      # Larger cache
conn.commit()
```

**Benefits:**
- WAL: Better concurrency
- NORMAL: Faster writes vs FULL
- Larger cache: Faster queries

---

## Disaster Recovery Plan

### Recovery Procedure

**Step 1: Detect Disaster** (Node Failure)
```
Monitor logs for extended downtime
Verify: Node offline for > failure_threshold_seconds
Alert: All operators via monitoring system
```

**Step 2: Activate Backup**
```
Automatic: Health monitor detects and promotes backup
Manual: Run POST /api/cluster/register-node for new primary
```

**Step 3: Assess Data Loss**
```bash
# Check replication factor before failure
curl http://localhost:8000/api/replication/status

# Query conflicts
sqlite3 ./data/node_1.db "SELECT * FROM conflicts LIMIT 10;"

# Review failover events
curl http://localhost:8000/api/failover/events
```

**Step 4: Restore Original Node**
```bash
# Fix underlying issue (hardware, network, software)
# Restore from backup if needed
cp ./backups/node_2_20250421_164000.db ./data/node_2.db

# Re-register node
curl -X POST http://localhost:8000/api/cluster/register-node \
  -H "Content-Type: application/json" \
  -d '{
    "node_id": "node_2",
    "region": "us-east",
    "address": "node_2.prod:8001"
  }'
```

**Step 5: Verify Consistency**
```bash
# Check replication to restored node
curl http://localhost:8000/api/replication/status

# Verify all records present
sqlite3 ./data/node_2.db "SELECT COUNT(*) FROM data_records;"

# Compare checksums across nodes
# (Custom script to verify consistency)
```

---

## Production Checklist

- [ ] All 3 nodes (or more) operational and healthy
- [ ] Health monitoring enabled on all nodes
- [ ] Backup strategy documented and tested
- [ ] Failover procedures documented
- [ ] Monitoring alerts configured
- [ ] Network connectivity verified between all nodes
- [ ] Firewall rules allow replication traffic
- [ ] Database backups scheduled
- [ ] Disaster recovery plan reviewed
- [ ] Team trained on operations procedures
- [ ] Phase 2e integration tested with Phase 2f
- [ ] Load testing completed
- [ ] Performance baselines established

---

## Contact & Support

For issues or questions:
1. Check logs: `*.log` files
2. Review this guide: PHASE-2F-OPERATIONS-GUIDE.md
3. Run test suite: `python test_phase_2f_distributed.py`
4. Check API docs: PHASE-2F-API-DOCUMENTATION.md
