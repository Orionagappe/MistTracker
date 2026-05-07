# MistTracker Production Deployment Runbook

**Version**: 1.0  
**Date**: April 21, 2026  
**Status**: Production Ready  
**Last Updated**: Real-world integration testing in progress  

---

## Table of Contents

1. [Overview](#overview)
2. [Pre-Deployment Checklist](#pre-deployment-checklist)
3. [Deployment Scenarios](#deployment-scenarios)
4. [Step-by-Step Deployment](#step-by-step-deployment)
5. [Health Verification](#health-verification)
6. [Monitoring & Observability](#monitoring--observability)
7. [Rollback Procedures](#rollback-procedures)
8. [Common Operational Tasks](#common-operational-tasks)
9. [Troubleshooting Guide](#troubleshooting-guide)
10. [Disaster Recovery](#disaster-recovery)
11. [Scaling & Maintenance](#scaling--maintenance)

---

## Overview

### System Architecture

MistTracker is a distributed multi-domain correlation and alerting system composed of:

**Phase 2e (Single-Node Core)**:
- Expert Feedback Engine (feedback collection, expert profiles, accuracy tracking)
- Alert System (5-tier severity, 6 channels: LOG, EMAIL, WEBHOOK, SLACK, SMS, PAGERDUTY)
- Correlation Detector (multi-domain event correlation, 60-minute windows)
- Threshold Optimizer (ROC analysis, performance metrics)

**Phase 2f (Distributed Layer)**:
- Distributed Storage Engine (multi-node persistence, replication, checksum verification)
- Consensus Engine (Raft-inspired voting, quorum-based decisions)
- Node Manager (health monitoring, automatic failover, replication scheduling)

**API Server**:
- FastAPI-based REST interface (14 Phase 2e endpoints + 8 Phase 2f endpoints)
- CORS enabled for web UI integration
- SQLite backend with PostgreSQL readiness
- Timezone-aware datetime handling (UTC)

### Key Capabilities

| Feature | Capability | Notes |
|---------|-----------|-------|
| **Data Persistence** | SQLite (dev/test), PostgreSQL ready | 4 core tables: records, nodes, sync_ops, consensus_logs |
| **Replication** | Multi-node, configurable strategy | Eventual, Strong, or Read-Repair |
| **Consensus** | Quorum-based voting | Minimum 2 votes for 3-node cluster |
| **Health Monitoring** | 10-second intervals | 30-second failure timeout before failover |
| **Failover** | Automatic | Healthy nodes continue operation |
| **API Endpoints** | 22 total | 14 Phase 2e + 8 Phase 2f |
| **Thread Safety** | RLock-based | All multi-threaded operations protected |

---

## Pre-Deployment Checklist

### Infrastructure Requirements

- [ ] **Minimum 3 nodes** for production cluster (1-node dev, 3-node HA)
- [ ] **Operating System**: Linux (CentOS/RHEL 8+, Ubuntu 20.04+) or Windows Server 2019+
- [ ] **Python**: 3.8 or higher (3.10+ recommended)
- [ ] **Memory**: 2GB per node (4GB+ recommended for production)
- [ ] **Disk**: 10GB minimum (SSD recommended for better I/O performance)
- [ ] **Network**: Low-latency, stable inter-node communication (< 100ms RTT)
- [ ] **Firewall**: Ports 5000 (API), 5001-5100 (inter-node communication) open between nodes

### Software Prerequisites

- [ ] Python 3.8+ installed globally or via venv
- [ ] Required packages installable: `pip install -r requirements.txt`
- [ ] Git for version control (optional but recommended)
- [ ] Systemd or supervisor for process management (Linux)
- [ ] Docker (optional, for containerized deployment)

### Pre-Deployment Steps

```bash
# 1. Clone/copy codebase to deployment directory
mkdir -p /opt/misttracker
cp -r . /opt/misttracker/

# 2. Create Python virtual environment
cd /opt/misttracker
python3.10 -m venv .venv
source .venv/bin/activate  # Linux/Mac
# OR: .venv\Scripts\Activate.ps1  # Windows PowerShell

# 3. Install dependencies
pip install --upgrade pip
pip install -r requirements.txt
# Core packages: fastapi==0.104.1, pydantic==2.5.0, numpy, scipy

# 4. Create required directories
mkdir -p data logs backups
chmod 755 data logs backups

# 5. Verify core imports
python3 -c "import phase_2e_expert_feedback; import phase_2f_distributed_storage; print('✓ All modules load successfully')"
```

### Configuration Validation

```bash
# Verify Phase 2f is available
python3 -c "import phase_2_api_server; print(f'Phase2f Available: {phase_2_api_server.PHASE2F_AVAILABLE}')"
# Expected output: Phase2f Available: True

# Check timezone awareness
python3 -c "from datetime import datetime, timezone; print(f'Timezone support: {datetime.now(timezone.utc)}')"
```

---

## Deployment Scenarios

### Scenario 1: Single-Node Development (1 Server)

**Use Case**: Development, testing, local validation  
**Node Count**: 1  
**Quorum Size**: 1  
**Failover**: None  
**Time**: 15 minutes

```
┌─────────────────────────┐
│   Dev Server (Port 5000)│
│  ├─ Phase 2e (all 4)    │
│  ├─ Phase 2f (all 3)    │
│  ├─ API Server          │
│  └─ SQLite DB           │
└─────────────────────────┘
```

### Scenario 2: 3-Node Regional Failover (3 Servers)

**Use Case**: Production with automatic failover  
**Node Count**: 3  
**Quorum Size**: 2 votes required  
**Failover**: Automatic if any node fails  
**Time**: 45 minutes  

```
┌─────────────────────────────────────────────────────────┐
│                    3-Node Cluster                        │
├──────────────────┬──────────────────┬──────────────────┤
│   Primary Node   │  Secondary Node  │  Tertiary Node   │
│   (Port 5000)    │   (Port 5000)    │   (Port 5000)    │
│ ├─ Phase 2e      │ ├─ Phase 2e      │ ├─ Phase 2e      │
│ ├─ Phase 2f      │ ├─ Phase 2f      │ ├─ Phase 2f      │
│ ├─ API Server    │ ├─ API Server    │ ├─ API Server    │
│ └─ SQLite DB     │ └─ SQLite DB     │ └─ SQLite DB     │
│                  │                  │                  │
│ ← Replication → ← Replication → ← Replication →       │
└──────────────────┴──────────────────┴──────────────────┘
                         ↓
              Load Balancer (HAProxy/Nginx)
                    (Optional but recommended)
```

### Scenario 3: 5-Node Multi-Region HA (5 Servers)

**Use Case**: High availability with cross-region redundancy  
**Node Count**: 5  
**Quorum Size**: 3 votes required  
**Failover**: Automatic, can tolerate 2 node failures  
**Time**: 90 minutes  

```
Region-A (East)              Region-B (West)              Region-C (Central)
┌─────────────────────┐   ┌─────────────────────┐   ┌─────────────────────┐
│  Primary Node       │   │  Secondary Node     │   │  Tertiary Node      │
│  (Port 5000)        │   │  (Port 5000)        │   │  (Port 5000)        │
├─────────────────────┤   ├─────────────────────┤   ├─────────────────────┤
│ Phase 2e/2f + API   │ ← Replication (300ms) → │ ← Replication (200ms) → │
└─────────────────────┘   └─────────────────────┘   └─────────────────────┘
         ↓                          ↓                         ↓
    Local SQLite              Local SQLite              Local SQLite
         ↓                          ↓                         ↓
    ┌────────────────────────────────────────────────────────┐
    │         Global Load Balancer (DNS-based)               │
    │              (Route53/Cloudflare/etc)                  │
    └────────────────────────────────────────────────────────┘
```

---

## Step-by-Step Deployment

### Phase 1: Single-Node Dev (Baseline)

#### 1.1 Environment Setup

```bash
#!/bin/bash
# deploy-dev.sh

set -e  # Exit on error

INSTALL_DIR="/opt/misttracker"
VENV_PATH="$INSTALL_DIR/.venv"

echo "=== MistTracker Dev Deployment ==="

# Create directory
mkdir -p "$INSTALL_DIR"
cd "$INSTALL_DIR"

# Setup Python environment
python3.10 -m venv "$VENV_PATH"
source "$VENV_PATH/bin/activate"

# Install dependencies
pip install --upgrade pip setuptools wheel
pip install fastapi==0.104.1 uvicorn pydantic==2.5.0 numpy scipy \
            python-multipart slowapi

# Create data directories
mkdir -p {data,logs,backups}

# Verify installation
python3 -c "import phase_2e_expert_feedback; print('✓ Phase 2e loaded')"
python3 -c "import phase_2f_distributed_storage; print('✓ Phase 2f loaded')"

echo "✓ Dev environment ready"
echo "  Location: $INSTALL_DIR"
echo "  VENV: $VENV_PATH"
```

#### 1.2 Start API Server

```bash
#!/bin/bash
# start-dev.sh

INSTALL_DIR="/opt/misttracker"
cd "$INSTALL_DIR"
source .venv/bin/activate

# Start API server (foreground, for testing)
python3 phase_2_api_server.py

# Or use uvicorn directly:
# uvicorn phase_2_api_server:app --host 0.0.0.0 --port 5000 --reload
```

#### 1.3 Verify Dev Deployment

```bash
#!/bin/bash
# verify-dev.sh

echo "=== Verifying Dev Deployment ==="

# Test 1: API Server Health
echo "Test 1: API Server health..."
curl -s http://localhost:5000/api/info | python3 -m json.tool | head -20

# Test 2: Phase 2e Endpoints
echo -e "\nTest 2: Phase 2e endpoints..."
curl -s http://localhost:5000/api/expert-feedback/stats | python3 -m json.tool

# Test 3: Phase 2f Endpoints
echo -e "\nTest 3: Phase 2f endpoints..."
curl -s http://localhost:5000/api/cluster/status | python3 -m json.tool

# Test 4: Database
echo -e "\nTest 4: Database file..."
ls -lh data/misttracker.db

echo -e "\n✓ Dev deployment verified"
```

---

### Phase 2: 3-Node Production Cluster

#### 2.1 Node Configuration

Create `node_config.json` for each node:

```json
{
  "node_id": "prod-node-1",
  "node_address": "prod1.example.com:5000",
  "cluster_name": "production-regional-3",
  "cluster_nodes": [
    {"node_id": "prod-node-1", "address": "prod1.example.com:5000"},
    {"node_id": "prod-node-2", "address": "prod2.example.com:5000"},
    {"node_id": "prod-node-3", "address": "prod3.example.com:5000"}
  ],
  "replication_strategy": "strong_consistency",
  "health_check_interval": 10,
  "failure_timeout": 30,
  "database_path": "/data/misttracker.db",
  "log_level": "INFO"
}
```

#### 2.2 Deploy to Each Node

```bash
#!/bin/bash
# deploy-prod-node.sh NODE_NUMBER CLUSTER_SIZE

NODE_NUM=$1
CLUSTER_SIZE=${2:-3}
INSTALL_DIR="/opt/misttracker"
NODE_ID="prod-node-${NODE_NUM}"

echo "=== Deploying to $NODE_ID ==="

# Create isolated directories per node
mkdir -p "/data/$NODE_ID/db"
mkdir -p "/logs/$NODE_ID"
mkdir -p "/backups/$NODE_ID"

cd "$INSTALL_DIR"
source .venv/bin/activate

# Setup node-specific environment
export MISTTRACKER_NODE_ID="$NODE_ID"
export MISTTRACKER_CLUSTER_SIZE="$CLUSTER_SIZE"
export MISTTRACKER_DB_PATH="/data/$NODE_ID/db/misttracker.db"
export MISTTRACKER_LOG_PATH="/logs/$NODE_ID/misttracker.log"

# Test connectivity to other nodes
echo "Verifying cluster connectivity..."
for i in $(seq 1 $CLUSTER_SIZE); do
  if [ $i -ne $NODE_NUM ]; then
    other_node="prod-node-${i}"
    echo "  Checking $other_node..."
    nc -zv $other_node 5000 2>&1 | grep -q "succeeded" && echo "    ✓ Connected" || echo "    ✗ Failed"
  fi
done

echo "✓ Node configuration ready"
```

#### 2.3 Start 3-Node Cluster

```bash
#!/bin/bash
# start-prod-cluster.sh

INSTALL_DIR="/opt/misttracker"

# On Node 1
ssh prod1.example.com "cd $INSTALL_DIR && source .venv/bin/activate && \
  export MISTTRACKER_NODE_ID=prod-node-1 && \
  python3 phase_2_api_server.py > /logs/prod-node-1/api.log 2>&1 &"

# On Node 2
ssh prod2.example.com "cd $INSTALL_DIR && source .venv/bin/activate && \
  export MISTTRACKER_NODE_ID=prod-node-2 && \
  python3 phase_2_api_server.py > /logs/prod-node-2/api.log 2>&1 &"

# On Node 3
ssh prod3.example.com "cd $INSTALL_DIR && source .venv/bin/activate && \
  export MISTTRACKER_NODE_ID=prod-node-3 && \
  python3 phase_2_api_server.py > /logs/prod-node-3/api.log 2>&1 &"

# Give servers 10 seconds to start
sleep 10

# Verify all nodes running
for i in 1 2 3; do
  echo "Node $i status:"
  curl -s http://prod${i}.example.com:5000/api/info | jq '.node_id'
done
```

#### 2.4 Setup Load Balancer (Optional but Recommended)

**HAProxy Configuration** (`/etc/haproxy/haproxy.cfg`):

```
global
    maxconn 2000
    log 127.0.0.1 local0

defaults
    mode http
    timeout connect 5s
    timeout client 50s
    timeout server 50s

frontend misttracker_public
    bind 0.0.0.0:80
    default_backend misttracker_nodes

backend misttracker_nodes
    balance roundrobin
    option httpchk GET /api/info
    
    server node1 prod1.example.com:5000 check inter 10s fall 3 rise 2
    server node2 prod2.example.com:5000 check inter 10s fall 3 rise 2
    server node3 prod3.example.com:5000 check inter 10s fall 3 rise 2
```

**Start HAProxy**:
```bash
sudo systemctl restart haproxy
# Verify: curl http://localhost/api/info
```

---

## Health Verification

### Immediate Verification (Post-Deployment)

```bash
#!/bin/bash
# verify-prod-deployment.sh

LOAD_BALANCER="lb.example.com"
TIMEOUT=5

echo "=== Production Deployment Verification ==="

# 1. Health Check
echo -e "\n1. Cluster Health Check..."
curl -s --max-time $TIMEOUT "http://$LOAD_BALANCER/api/cluster/status" | python3 -m json.tool

# 2. Node Status
echo -e "\n2. Individual Node Status..."
for i in 1 2 3; do
  echo "Node $i:"
  curl -s --max-time $TIMEOUT "http://prod${i}.example.com:5000/api/cluster/nodes" | python3 -m json.tool | head -10
done

# 3. Storage Status
echo -e "\n3. Storage System Status..."
curl -s --max-time $TIMEOUT "http://$LOAD_BALANCER/api/storage/status" | python3 -m json.tool

# 4. Consensus Status
echo -e "\n4. Consensus Status..."
curl -s --max-time $TIMEOUT "http://$LOAD_BALANCER/api/consensus/proposals" | python3 -m json.tool

# 5. Test Data Write
echo -e "\n5. Test Data Persistence..."
TEST_DATA='{"data": "test_value", "timestamp": "'$(date -u +%Y-%m-%dT%H:%M:%SZ)'"}'
curl -s --max-time $TIMEOUT -X POST "http://$LOAD_BALANCER/api/storage/record" \
  -H "Content-Type: application/json" \
  -d "{\"category\": \"ALERTS\", \"payload\": $TEST_DATA}" | python3 -m json.tool

# 6. Verify Replication
echo -e "\n6. Replication Status..."
curl -s --max-time $TIMEOUT "http://$LOAD_BALANCER/api/replication/status" | python3 -m json.tool

echo -e "\n✓ Verification Complete"
```

### Ongoing Monitoring

Create monitoring script that runs every 5 minutes:

```bash
#!/bin/bash
# monitor-prod.sh

LOG_FILE="/logs/misttracker-monitor.log"
ALERT_EMAIL="ops@example.com"

while true; do
  TIMESTAMP=$(date -u +%Y-%m-%dT%H:%M:%SZ)
  
  # Check cluster status
  CLUSTER_STATUS=$(curl -s --max-time 5 "http://lb.example.com/api/cluster/status")
  
  # Extract key metrics
  HEALTHY_NODES=$(echo "$CLUSTER_STATUS" | jq '.healthy_nodes // 0')
  TOTAL_NODES=$(echo "$CLUSTER_STATUS" | jq '.total_nodes // 0')
  QUORUM=$(echo "$CLUSTER_STATUS" | jq '.quorum_size // 0')
  
  echo "[$TIMESTAMP] Nodes: $HEALTHY_NODES/$TOTAL_NODES, Quorum: $QUORUM" >> "$LOG_FILE"
  
  # Alert if quorum lost
  if [ "$HEALTHY_NODES" -lt "$QUORUM" ]; then
    echo "CRITICAL: Quorum lost! ($HEALTHY_NODES/$QUORUM)" >> "$LOG_FILE"
    echo "Subject: CRITICAL: MistTracker Quorum Lost
Body: Only $HEALTHY_NODES nodes healthy, $QUORUM required.
Cluster Status: $(date)" | ssmtp "$ALERT_EMAIL"
  fi
  
  # Alert if node down
  if [ "$HEALTHY_NODES" -lt "$TOTAL_NODES" ]; then
    FAILED_NODES=$((TOTAL_NODES - HEALTHY_NODES))
    echo "WARNING: $FAILED_NODES nodes down" >> "$LOG_FILE"
  fi
  
  sleep 300  # Run every 5 minutes
done
```

---

## Monitoring & Observability

### Key Metrics to Track

| Metric | Target | Alert Threshold | Check Interval |
|--------|--------|-----------------|-----------------|
| Cluster Health | All nodes online | < 2/3 nodes | 10s |
| Quorum Status | Healthy | Quorum lost | 10s |
| Replication Lag | < 1s | > 5s | 30s |
| API Response Time | < 100ms | > 500ms | 60s |
| Database Size | < 5GB | > 7GB | 300s |
| Failover Events | 0/month | Any event | Real-time |

### Log Levels & Locations

```
/logs/prod-node-1/
├── api.log          (API server requests/responses)
├── replication.log  (Replication events)
├── consensus.log    (Voting, proposals)
├── health.log       (Health checks, failures)
└── error.log        (Errors, warnings)

Key log patterns to monitor:
- ERROR in any log
- CRITICAL in any log
- "replication failed" 
- "quorum lost"
- "node offline"
- "failover triggered"
```

### Basic Monitoring Commands

```bash
# Watch cluster health in real-time
watch -n 5 'curl -s http://lb.example.com/api/cluster/status | jq .'

# Monitor replication lag
watch -n 10 'curl -s http://lb.example.com/api/replication/status | jq ".[] | {node: .node_id, lag_ms: .replication_lag_ms}"'

# Track API response times
for i in {1..100}; do
  time curl -s http://lb.example.com/api/info > /dev/null
  sleep 1
done

# Monitor disk usage
watch -n 60 'du -sh /data/prod-node-*/db/'

# Check process status
watch -n 10 'ps aux | grep phase_2_api_server'
```

---

## Rollback Procedures

### Quick Rollback (Last 5 Minutes)

**Scenario**: Recent deployment introduced a bug, need to revert immediately.

```bash
#!/bin/bash
# rollback-quick.sh

echo "=== Quick Rollback (Previous Build) ==="

INSTALL_DIR="/opt/misttracker"
BACKUP_DIR="/backups/misttracker-previous"

# Stop all nodes
for i in 1 2 3; do
  ssh prod${i}.example.com "pkill -f phase_2_api_server"
done

wait 3  # Give processes time to shut down

# Restore previous build
cd "$INSTALL_DIR"
git checkout HEAD~1  # Go back one commit
rm -rf .venv
python3.10 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt

# Restart nodes
bash start-prod-cluster.sh

# Verify
sleep 10
bash verify-prod-deployment.sh

echo "✓ Rollback complete"
```

### Database Rollback (Data Recovery)

**Scenario**: Data corruption detected, need to restore from snapshot.

```bash
#!/bin/bash
# rollback-database.sh TIMESTAMP

TIMESTAMP=$1  # e.g., "2026-04-21-14-30-00"
BACKUP_FILE="/backups/misttracker-db-$TIMESTAMP.tar.gz"

if [ ! -f "$BACKUP_FILE" ]; then
  echo "ERROR: Backup file not found: $BACKUP_FILE"
  exit 1
fi

echo "=== Database Rollback ==="

# Stop cluster
for i in 1 2 3; do
  ssh prod${i}.example.com "pkill -f phase_2_api_server"
done

wait 10

# Restore databases
for i in 1 2 3; do
  echo "Restoring prod-node-$i database..."
  mkdir -p "/data/prod-node-$i/db"
  tar -xzf "$BACKUP_FILE" -C "/data/prod-node-$i/db"
done

# Restart cluster
bash start-prod-cluster.sh

# Monitor replication sync
echo "Waiting for replication to sync..."
for i in {1..60}; do
  REPLICATION_STATUS=$(curl -s http://lb.example.com/api/replication/status)
  if echo "$REPLICATION_STATUS" | jq -e '.[] | select(.replication_lag_ms > 100)' > /dev/null; then
    echo "  Still syncing... ($i/60)"
    sleep 2
  else
    echo "✓ Replication synced"
    break
  fi
done

echo "✓ Database rollback complete"
```

### Full Infrastructure Rollback

**Scenario**: Multiple nodes corrupted, need to rebuild cluster from scratch.

```bash
#!/bin/bash
# rollback-infrastructure.sh

echo "=== Full Infrastructure Rollback ==="
echo "WARNING: This will rebuild the entire cluster from backup"
read -p "Continue? (yes/no): " CONFIRM

if [ "$CONFIRM" != "yes" ]; then
  exit 1
fi

INSTALL_DIR="/opt/misttracker"
BACKUP_TIMESTAMP="2026-04-21-14-00-00"  # Most recent known-good backup

# Shutdown everything
for i in 1 2 3; do
  ssh prod${i}.example.com "
    pkill -f phase_2_api_server
    pkill -f uvicorn
    systemctl stop misttracker || true
  "
done

wait 5

# Clear all node data
for i in 1 2 3; do
  ssh prod${i}.example.com "rm -rf /data/prod-node-$i/db/*"
done

# Restore from backup
for i in 1 2 3; do
  ssh prod${i}.example.com "
    mkdir -p /data/prod-node-$i/db
    tar -xzf /backups/misttracker-full-$BACKUP_TIMESTAMP.tar.gz \
      -C /data/prod-node-$i/db
  "
done

# Restart cluster
bash start-prod-cluster.sh

# Full verification
sleep 15
bash verify-prod-deployment.sh

echo "✓ Infrastructure rollback complete"
```

---

## Common Operational Tasks

### Task 1: Add a New Node to Cluster

```bash
#!/bin/bash
# add-node-to-cluster.sh NEW_NODE_ID NEW_NODE_ADDRESS

NEW_NODE_ID=$1  # e.g., "prod-node-4"
NEW_NODE_ADDR=$2  # e.g., "prod4.example.com:5000"

echo "=== Adding $NEW_NODE_ID to cluster ==="

# 1. Deploy to new node
ssh $NEW_NODE_ADDR "
  mkdir -p /opt/misttracker /data/$NEW_NODE_ID/db /logs/$NEW_NODE_ID
  cd /opt/misttracker
  python3.10 -m venv .venv
  source .venv/bin/activate
  pip install -r requirements.txt
"

# 2. Register node with cluster
CLUSTER_STATUS=$(curl -s http://lb.example.com/api/cluster/status)
CLUSTER_SIZE=$(echo "$CLUSTER_STATUS" | jq '.total_nodes')

curl -X POST http://lb.example.com/api/cluster/register-node \
  -H "Content-Type: application/json" \
  -d "{
    \"node_id\": \"$NEW_NODE_ID\",
    \"address\": \"$NEW_NODE_ADDR\",
    \"cluster_size\": $((CLUSTER_SIZE + 1))
  }"

# 3. Start node
ssh $NEW_NODE_ADDR "
  cd /opt/misttracker
  source .venv/bin/activate
  export MISTTRACKER_NODE_ID=$NEW_NODE_ID
  export MISTTRACKER_CLUSTER_SIZE=$((CLUSTER_SIZE + 1))
  python3 phase_2_api_server.py > /logs/$NEW_NODE_ID/api.log 2>&1 &
"

# 4. Monitor replication sync
echo "Waiting for data replication to new node..."
for i in {1..120}; do
  REPLICATION=$(curl -s http://lb.example.com/api/replication/status | jq ".[] | select(.node_id == \"$NEW_NODE_ID\")")
  if echo "$REPLICATION" | jq -e '.replication_lag_ms < 100' > /dev/null 2>&1; then
    echo "✓ Replication synced"
    break
  fi
  echo "  Syncing... ($i/120)"
  sleep 1
done

echo "✓ Node $NEW_NODE_ID added successfully"
```

### Task 2: Graceful Node Removal

```bash
#!/bin/bash
# remove-node-from-cluster.sh NODE_ID

NODE_ID=$1  # e.g., "prod-node-3"

echo "=== Removing $NODE_ID from cluster ==="

# 1. Drain in-flight requests (graceful shutdown)
echo "Draining requests..."
DRAIN_TIMEOUT=300
START_TIME=$(date +%s)

while true; do
  PENDING=$(curl -s http://$NODE_ID:5000/api/info | jq '.pending_operations // 0')
  if [ "$PENDING" -eq 0 ]; then
    echo "✓ All requests drained"
    break
  fi
  
  ELAPSED=$(($(date +%s) - START_TIME))
  if [ $ELAPSED -gt $DRAIN_TIMEOUT ]; then
    echo "⚠ Drain timeout reached, forcing shutdown"
    break
  fi
  
  echo "  Pending operations: $PENDING (${ELAPSED}s elapsed)"
  sleep 5
done

# 2. Stop the node
ssh $NODE_ID:22 "pkill -f phase_2_api_server"

# 3. Unregister from cluster
curl -X POST http://lb.example.com/api/cluster/deregister-node \
  -H "Content-Type: application/json" \
  -d "{\"node_id\": \"$NODE_ID\"}"

# 4. Backup node data before removal
ssh $NODE_ID:22 "tar -czf /tmp/$NODE_ID-backup.tar.gz /data/$NODE_ID/db/"
scp $NODE_ID:/tmp/$NODE_ID-backup.tar.gz /backups/$NODE_ID-$(date +%s).tar.gz

echo "✓ Node $NODE_ID removed successfully"
echo "  Data backed up to /backups/"
```

### Task 3: Database Maintenance & Compaction

```bash
#!/bin/bash
# maintain-database.sh

echo "=== Database Maintenance ==="

# 1. Backup current database
for i in 1 2 3; do
  TIMESTAMP=$(date +%Y%m%d-%H%M%S)
  ssh prod${i}.example.com "
    cp /data/prod-node-$i/db/misttracker.db \
       /backups/misttracker-pre-maintenance-$TIMESTAMP.db
  "
done

# 2. Compact databases (SQLite VACUUM)
for i in 1 2 3; do
  ssh prod${i}.example.com "
    sqlite3 /data/prod-node-$i/db/misttracker.db 'VACUUM;'
  "
done

# 3. Verify integrity
for i in 1 2 3; do
  echo "Checking prod-node-$i database integrity..."
  INTEGRITY=$(ssh prod${i}.example.com "sqlite3 /data/prod-node-$i/db/misttracker.db 'PRAGMA integrity_check;'")
  if [ "$INTEGRITY" = "ok" ]; then
    echo "  ✓ Integrity OK"
  else
    echo "  ✗ CORRUPTION DETECTED: $INTEGRITY"
  fi
done

# 4. Report sizes
echo -e "\nDatabase sizes after maintenance:"
for i in 1 2 3; do
  SIZE=$(ssh prod${i}.example.com "du -sh /data/prod-node-$i/db/misttracker.db")
  echo "  prod-node-$i: $SIZE"
done

echo "✓ Database maintenance complete"
```

### Task 4: Backup & Restore

```bash
#!/bin/bash
# backup-cluster.sh

BACKUP_DIR="/backups"
TIMESTAMP=$(date +%Y%m%d-%H%M%S)
BACKUP_NAME="misttracker-full-$TIMESTAMP"

echo "=== Cluster Backup ==="

# Create backup directory
mkdir -p "$BACKUP_DIR/$BACKUP_NAME"

# Backup from all nodes
for i in 1 2 3; do
  echo "Backing up prod-node-$i..."
  ssh prod${i}.example.com "
    tar -czf /tmp/prod-node-$i-backup.tar.gz \
      /data/prod-node-$i/db/ \
      /logs/prod-node-$i/
  "
  
  scp prod${i}.example.com:/tmp/prod-node-$i-backup.tar.gz \
      "$BACKUP_DIR/$BACKUP_NAME/prod-node-$i-backup.tar.gz"
done

# Backup configuration
cp node_config.json "$BACKUP_DIR/$BACKUP_NAME/"
cp start-prod-cluster.sh "$BACKUP_DIR/$BACKUP_NAME/"

# Create manifest
cat > "$BACKUP_DIR/$BACKUP_NAME/MANIFEST.txt" <<EOF
Backup: $BACKUP_NAME
Date: $(date -u)
Cluster: production-regional-3
Node Count: 3
Backup Size: $(du -sh "$BACKUP_DIR/$BACKUP_NAME" | cut -f1)
EOF

# Compress entire backup
cd "$BACKUP_DIR"
tar -czf "$BACKUP_NAME.tar.gz" "$BACKUP_NAME"
rm -rf "$BACKUP_NAME"

echo "✓ Backup complete: $BACKUP_DIR/$BACKUP_NAME.tar.gz"
```

---

## Troubleshooting Guide

### Problem: Cluster Health Check Fails

**Symptom**: `GET /api/cluster/status` returns unhealthy nodes

**Diagnosis**:
```bash
# 1. Check individual node health
for i in 1 2 3; do
  echo "Node $i:"
  curl -s http://prod${i}.example.com:5000/api/info
done

# 2. Check process status
for i in 1 2 3; do
  ssh prod${i}.example.com "ps aux | grep phase_2_api_server"
done

# 3. Check network connectivity
for i in 1 2 3; do
  for j in 1 2 3; do
    if [ $i -ne $j ]; then
      echo "prod-node-$i → prod-node-$j:"
      nc -zv prod${j}.example.com 5000
    fi
  done
done
```

**Resolution**:
```bash
# If process crashed, restart node
ssh prod1.example.com "
  cd /opt/misttracker
  source .venv/bin/activate
  export MISTTRACKER_NODE_ID=prod-node-1
  nohup python3 phase_2_api_server.py > /logs/prod-node-1/api.log 2>&1 &
"

# If network issues, check firewall
sudo iptables -L -n | grep 5000

# If port conflict, find and kill process on that port
lsof -i :5000
```

### Problem: Quorum Lost

**Symptom**: Consensus decisions failing, alerts not being approved

**Diagnosis**:
```bash
# Check how many nodes are healthy
curl -s http://lb.example.com/api/cluster/status | jq '{total_nodes, healthy_nodes, quorum_size}'

# Check which nodes are down
curl -s http://lb.example.com/api/cluster/nodes | jq '.[] | {node_id, is_online}'
```

**Resolution**:
```bash
# Minimum: Get 2/3 nodes online for 3-node cluster
# Try restarting offline nodes first
ssh prod2.example.com "
  pkill -f phase_2_api_server
  sleep 5
  cd /opt/misttracker
  source .venv/bin/activate
  export MISTTRACKER_NODE_ID=prod-node-2
  nohup python3 phase_2_api_server.py > /logs/prod-node-2/api.log 2>&1 &
"

# If still failing, check storage corruption
ssh prod1.example.com "
  sqlite3 /data/prod-node-1/db/misttracker.db 'PRAGMA integrity_check;'
"

# If corrupted, restore from backup
bash rollback-database.sh 2026-04-21-14-30-00
```

### Problem: Replication Lag High

**Symptom**: `GET /api/replication/status` shows lag > 5 seconds

**Diagnosis**:
```bash
# Check replication status detail
curl -s http://lb.example.com/api/replication/status | jq '.[] | {node_id, replication_lag_ms, pending_syncs}'

# Check network latency to lagging node
ping -c 5 prod2.example.com

# Check CPU/disk usage on lagging node
ssh prod2.example.com "top -bn1 | head -20"
ssh prod2.example.com "iostat -x 1 3"
```

**Resolution**:
```bash
# Network issue: Check firewall rules
sudo iptables -A INPUT -p tcp --dport 5001:5100 -j ACCEPT

# CPU bottleneck: Check load
ssh prod2.example.com "uptime"
# If high load, restart node after maintenance window

# Disk I/O: Check available space
ssh prod2.example.com "df -h /data/"
# If low, run maintenance: bash maintain-database.sh
```

### Problem: API Response Times Degrading

**Symptom**: `curl http://lb.example.com/api/info` taking > 500ms

**Diagnosis**:
```bash
# Measure response time per node
for i in 1 2 3; do
  echo "Node $i response time:"
  time curl -s http://prod${i}.example.com:5000/api/info > /dev/null
done

# Check database query time
ssh prod1.example.com "
  sqlite3 /data/prod-node-1/db/misttracker.db 'EXPLAIN QUERY PLAN SELECT * FROM data_records LIMIT 10;'
"

# Check system resources
ssh prod1.example.com "
  echo 'CPU:'; top -bn1 | head -5
  echo 'Memory:'; free -h
  echo 'Disk I/O:'; iostat -x 1 3
"
```

**Resolution**:
```bash
# Missing database index: Add index
ssh prod1.example.com "
  sqlite3 /data/prod-node-1/db/misttracker.db '
    CREATE INDEX IF NOT EXISTS idx_records_timestamp ON data_records(created_at);
    CREATE INDEX IF NOT EXISTS idx_records_category ON data_records(category);
  '
"

# Query optimization: Use explain analyze
ssh prod1.example.com "
  sqlite3 /data/prod-node-1/db/misttracker.db 'ANALYZE;'
"

# Rebalance load: Check HAProxy distribution
echo "Connections per backend:"
echo "show stat" | socat stdio /var/run/haproxy/admin.sock | grep misttracker_nodes
```

### Problem: Data Inconsistency Between Nodes

**Symptom**: Different nodes returning different values for same record

**Diagnosis**:
```bash
# Query same record from all nodes
RECORD_ID="test-record-123"

for i in 1 2 3; do
  echo "Node $i:"
  curl -s http://prod${i}.example.com:5000/api/storage/record/$RECORD_ID | jq '.data'
done

# Check replication events
curl -s http://lb.example.com/api/replication/status | jq '.[] | {node_id, last_sync_time, replication_lag_ms}'
```

**Resolution**:
```bash
# Trigger manual sync
curl -X POST http://lb.example.com/api/replication/sync-all \
  -H "Content-Type: application/json" \
  -d '{"force": true}'

# Monitor sync progress
watch -n 1 'curl -s http://lb.example.com/api/replication/status | jq'

# If manual sync fails, may need full database resync:
bash rollback-database.sh $(date +%Y-%m-%d)-14-00-00
```

---

## Disaster Recovery

### Recovery Time Objectives (RTO) & Recovery Point Objectives (RPO)

| Scenario | RTO | RPO | Recovery Procedure |
|----------|-----|-----|-------------------|
| Single node failure | 5 min | 30 sec | Auto-failover, node restart |
| Two nodes failure | 10 min | 2 min | Manual node recovery from backup |
| Total cluster failure | 30 min | 5 min | Full cluster restore from backup |
| Data corruption | 15 min | 1 hour | Database rollback from backup |

### Recovery Plan: Total Cluster Failure

**Scenario**: All 3 nodes down due to data center outage

**Recovery Steps**:

```bash
#!/bin/bash
# disaster-recovery-full.sh

echo "=== DISASTER RECOVERY: Total Cluster Failure ==="
echo "Estimated Recovery Time: 30 minutes"

# 1. Verify backup availability (should be on separate system)
BACKUP_FILE="/backups/misttracker-full-2026-04-21-12-00-00.tar.gz"
if [ ! -f "$BACKUP_FILE" ]; then
  echo "ERROR: No backup available!"
  exit 1
fi
echo "✓ Found backup: $BACKUP_FILE"

# 2. Provision new infrastructure
# (Assuming this is manual or via automation)
echo "Provisioning new nodes..."
# This would typically involve:
# - Creating new VMs or containers
# - Assigning IPs
# - Installing base OS and dependencies

# 3. Deploy MistTracker to new nodes
for i in 1 2 3; do
  NODE="prod${i}.example.com"
  echo "Deploying to $NODE..."
  
  ssh $NODE "
    mkdir -p /opt/misttracker /data/prod-node-$i/db /logs/prod-node-$i
    cd /opt/misttracker
    git clone https://github.com/yourorg/misttracker.git .
    python3.10 -m venv .venv
    source .venv/bin/activate
    pip install -r requirements.txt
  "
done

# 4. Extract backup
echo "Extracting backup..."
mkdir -p /tmp/misttracker-restore
tar -xzf "$BACKUP_FILE" -C /tmp/misttracker-restore

# 5. Restore data to new nodes
for i in 1 2 3; do
  NODE="prod${i}.example.com"
  echo "Restoring data to $NODE..."
  
  scp /tmp/misttracker-restore/prod-node-$i-backup.tar.gz $NODE:/tmp/
  ssh $NODE "
    tar -xzf /tmp/prod-node-$i-backup.tar.gz -C /
    rm /tmp/prod-node-$i-backup.tar.gz
  "
done

# 6. Start cluster
echo "Starting cluster..."
bash start-prod-cluster.sh

# 7. Verify recovery
echo "Verifying recovery..."
sleep 10
bash verify-prod-deployment.sh

# 8. Check replication sync
echo "Waiting for replication sync..."
for i in {1..120}; do
  REPLICATION=$(curl -s http://lb.example.com/api/replication/status)
  MAX_LAG=$(echo "$REPLICATION" | jq '[.[].replication_lag_ms] | max')
  
  if [ "$MAX_LAG" -lt 100 ]; then
    echo "✓ Replication synced (lag: ${MAX_LAG}ms)"
    break
  fi
  
  echo "  Syncing... Max lag: ${MAX_LAG}ms ($i/120)"
  sleep 2
done

echo "✓ DISASTER RECOVERY COMPLETE"
echo "  Cluster is operational"
echo "  All data restored from backup"
echo "  Replication synchronized"
```

### Recovery Plan: Data Corruption

**Scenario**: Corruption detected in one node's database

```bash
#!/bin/bash
# disaster-recovery-corruption.sh NODE_ID

NODE_ID=$1

echo "=== DISASTER RECOVERY: Data Corruption in $NODE_ID ==="

# 1. Verify corruption
echo "Verifying corruption..."
INTEGRITY=$(ssh $NODE_ID:22 "sqlite3 /data/$NODE_ID/db/misttracker.db 'PRAGMA integrity_check;'")

if [ "$INTEGRITY" = "ok" ]; then
  echo "ERROR: Database integrity OK, no corruption detected"
  exit 1
fi

echo "⚠ Corruption confirmed: $INTEGRITY"

# 2. Stop the affected node
echo "Stopping affected node..."
ssh $NODE_ID:22 "pkill -f phase_2_api_server"
sleep 5

# 3. Restore from latest backup
echo "Restoring from backup..."
BACKUP_FILE=$(ls -t /backups/misttracker-pre-maintenance-*.db 2>/dev/null | head -1)

if [ -z "$BACKUP_FILE" ]; then
  echo "ERROR: No backup available"
  exit 1
fi

ssh $NODE_ID:22 "cp $BACKUP_FILE /data/$NODE_ID/db/misttracker.db"

# 4. Restart node
echo "Restarting node..."
ssh $NODE_ID:22 "
  cd /opt/misttracker
  source .venv/bin/activate
  export MISTTRACKER_NODE_ID=$NODE_ID
  nohup python3 phase_2_api_server.py > /logs/$NODE_ID/api.log 2>&1 &
"

# 5. Monitor recovery
echo "Monitoring recovery..."
for i in {1..60}; do
  STATUS=$(curl -s http://$NODE_ID:5000/api/info | jq '.status')
  if [ "$STATUS" = '"online"' ]; then
    echo "✓ Node recovered"
    break
  fi
  echo "  Recovering... ($i/60)"
  sleep 2
done

# 6. Wait for replication sync
echo "Waiting for replication sync..."
for i in {1..120}; do
  LAG=$(curl -s http://lb.example.com/api/replication/status | jq ".[] | select(.node_id == \"$NODE_ID\") | .replication_lag_ms")
  
  if [ "$LAG" -lt 100 ]; then
    echo "✓ Replication synced"
    break
  fi
  
  echo "  Syncing... ($i/120)"
  sleep 2
done

echo "✓ DATA CORRUPTION RECOVERY COMPLETE"
```

---

## Scaling & Maintenance

### Vertical Scaling (Single Node)

Add resources to existing node:

```bash
# Increase VM resources
# 1. Allocate more CPU to VM
# 2. Allocate more memory
# 3. Add more disk space

# Restart service after resource changes
ssh prod1.example.com "
  pkill -f phase_2_api_server
  sleep 5
  cd /opt/misttracker
  source .venv/bin/activate
  nohup python3 phase_2_api_server.py > /logs/prod-node-1/api.log 2>&1 &
"
```

### Horizontal Scaling (Add More Nodes)

```bash
# To scale from 3 to 5 nodes:
bash add-node-to-cluster.sh prod-node-4 prod4.example.com:5000
bash add-node-to-cluster.sh prod-node-5 prod5.example.com:5000

# Verify new cluster size
curl -s http://lb.example.com/api/cluster/status | jq '{total_nodes, quorum_size}'
# Expected: total_nodes: 5, quorum_size: 3
```

### Regular Maintenance Window

Schedule monthly maintenance:

```bash
#!/bin/bash
# maintenance-window.sh

echo "=== MAINTENANCE WINDOW (Saturday 2am UTC) ==="

# 1. Backup cluster
bash backup-cluster.sh

# 2. Compact databases
bash maintain-database.sh

# 3. Run integrity checks
for i in 1 2 3; do
  ssh prod${i}.example.com "
    sqlite3 /data/prod-node-$i/db/misttracker.db 'PRAGMA integrity_check; VACUUM;'
  "
done

# 4. Update monitoring configuration
# (if applicable)

# 5. Verify all systems operational
bash verify-prod-deployment.sh

echo "✓ Maintenance window complete"
```

### Performance Tuning

```bash
# Add database indexes for common queries
ssh prod1.example.com "
  sqlite3 /data/prod-node-1/db/misttracker.db <<EOF
    -- Optimize common queries
    CREATE INDEX IF NOT EXISTS idx_records_timestamp ON data_records(created_at);
    CREATE INDEX IF NOT EXISTS idx_records_category ON data_records(category);
    CREATE INDEX IF NOT EXISTS idx_sync_ops_status ON sync_operations(status);
    CREATE INDEX IF NOT EXISTS idx_consensus_logs_term ON consensus_logs(term);
    
    -- Analyze for query optimizer
    ANALYZE;
    
    -- Increase page size for better I/O
    PRAGMA page_size = 4096;
    PRAGMA cache_size = 10000;
    PRAGMA synchronous = NORMAL;
    PRAGMA temp_store = MEMORY;
EOF
"
```

---

## Production Deployment Checklist

### Pre-Deployment (48 hours before)

- [ ] All tests passing (7/7 Phase 2f tests)
- [ ] All Phase 2e components loaded and verified
- [ ] API server tested with Phase 2f endpoints
- [ ] Network connectivity verified between all nodes
- [ ] Backup system operational and verified
- [ ] Monitoring and alerting configured
- [ ] Runbook reviewed with ops team
- [ ] Communication plan for deployment
- [ ] Rollback procedures tested
- [ ] Load balancer configuration reviewed

### Deployment Day (0 hours)

- [ ] Standby: Full monitoring team online
- [ ] Standby: Lead engineer available for issues
- [ ] Database backup taken and verified
- [ ] Single-node dev deployment successful
- [ ] 3-node cluster deployment successful
- [ ] All health checks passing
- [ ] Full verification suite run successfully
- [ ] Load balancer configured and tested
- [ ] Performance baseline established
- [ ] Alerting verified (send test alert)

### Post-Deployment (24 hours)

- [ ] Monitor all metrics for 24 hours
- [ ] Verify replication is functioning
- [ ] Confirm no unexpected errors in logs
- [ ] Test failover scenario manually (optional)
- [ ] Document any issues encountered
- [ ] Update runbook with lessons learned
- [ ] Get sign-off from operations team

---

## Contact & Escalation

### On-Call Support

| Issue | Level | Contact | Response Time |
|-------|-------|---------|-----------------|
| Cluster down | P1 | ops-critical@example.com | 5 min |
| Quorum lost | P1 | ops-critical@example.com | 5 min |
| High latency | P2 | ops-team@example.com | 15 min |
| Low disk space | P2 | ops-team@example.com | 30 min |
| Non-critical issue | P3 | ops-team@example.com | 4 hours |

### Emergency Contacts

```
Lead Engineer: john.doe@example.com, +1-555-0100
Operations Manager: jane.smith@example.com, +1-555-0101
Database Admin: bob.jones@example.com, +1-555-0102
Network Team: network@example.com, +1-555-0103
```

---

## Document History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2026-04-21 | DevOps | Initial production runbook |
| | | | - 3 deployment scenarios |
| | | | - Health verification procedures |
| | | | - Comprehensive troubleshooting |
| | | | - Disaster recovery plans |
| | | | - Maintenance procedures |
