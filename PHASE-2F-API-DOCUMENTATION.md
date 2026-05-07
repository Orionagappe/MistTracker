# Phase 2f: Distributed Storage System - API Documentation

## Overview

Phase 2f introduces **Distributed Storage, Consensus, and Multi-Node Clustering** to MistTracker. This enables long-term viability through:

- **Distributed Data Persistence**: Multi-node replication with conflict detection
- **Distributed Consensus**: Raft-inspired quorum voting for critical decisions
- **Automatic Failover**: Health monitoring and backup activation
- **Geographic Distribution**: Region-aware clustering and replication

## Architecture Summary

```
┌─────────────────────────────────────────────────────────────┐
│            Phase 2f Distributed System                      │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ Node 1       │  │ Node 2       │  │ Node 3       │      │
│  │ us-west      │  │ us-east      │  │ eu-west      │      │
│  │ (Primary)    │  │ (Primary)    │  │ (Backup)     │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│       │                  │                  │               │
│       └──────────────────┼──────────────────┘               │
│                          │                                  │
│  ┌─────────────────────────────────────────┐               │
│  │ Distributed Storage Layer                │               │
│  │ - SQLite persistence                    │               │
│  │ - Checksum verification                 │               │
│  │ - Conflict detection/resolution         │               │
│  └─────────────────────────────────────────┘               │
│                          │                                  │
│  ┌─────────────────────────────────────────┐               │
│  │ Consensus Engine                         │               │
│  │ - Raft-inspired protocol                │               │
│  │ - Quorum voting                         │               │
│  │ - Leader election                       │               │
│  └─────────────────────────────────────────┘               │
│                          │                                  │
│  ┌─────────────────────────────────────────┐               │
│  │ Multi-Node Manager                       │               │
│  │ - Health monitoring                     │               │
│  │ - Failure detection                     │               │
│  │ - Automatic failover                    │               │
│  │ - Replication scheduling                │               │
│  └─────────────────────────────────────────┘               │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

## API Endpoints

### Cluster Management Endpoints

#### GET /api/cluster/status
Get overall cluster status and health.

**Response:**
```json
{
  "component": "Distributed Cluster",
  "status": "healthy",
  "cluster_status": {
    "total_nodes": 3,
    "healthy_nodes": 3,
    "regions": {
      "us-west": {"healthy": 1, "total": 1},
      "us-east": {"healthy": 1, "total": 1},
      "eu-west": {"healthy": 1, "total": 1}
    }
  },
  "timestamp": "2025-04-21T16:40:00.000000"
}
```

**Use Case**: Monitor overall cluster health. Returns `healthy` if all nodes are online, `degraded` if some nodes are down.

---

#### GET /api/cluster/nodes
Get list of all nodes in cluster, optionally filtered by region.

**Query Parameters:**
- `region` (optional): Filter nodes by region (e.g., `us-west`, `us-east`, `eu-west`)

**Response:**
```json
{
  "total_nodes": 3,
  "region_filter": null,
  "nodes": [
    {
      "node_id": "node_1",
      "region": "us-west",
      "address": "node_1:8000",
      "is_backup": false,
      "primary_node": null,
      "online": true,
      "last_heartbeat": "2025-04-21T16:40:00.000000"
    },
    {
      "node_id": "node_2",
      "region": "us-east",
      "address": "node_2:8001",
      "is_backup": false,
      "primary_node": null,
      "online": true,
      "last_heartbeat": "2025-04-21T16:40:00.000000"
    },
    {
      "node_id": "node_3",
      "region": "eu-west",
      "address": "node_3:8002",
      "is_backup": true,
      "primary_node": "node_2",
      "online": true,
      "last_heartbeat": "2025-04-21T16:40:00.000000"
    }
  ],
  "timestamp": "2025-04-21T16:40:00.000000"
}
```

**Use Case**: View cluster composition and node health. Backup nodes are marked with their primary node reference.

---

#### POST /api/cluster/register-node
Register a new node in the cluster.

**Request Body:**
```json
{
  "node_id": "node_4",
  "region": "ap-south",
  "address": "node_4:8003",
  "is_backup": false,
  "primary_node": null
}
```

**Response:**
```json
{
  "status": "node_registered",
  "node_id": "node_4",
  "region": "ap-south",
  "address": "node_4:8003",
  "is_backup": false,
  "timestamp": "2025-04-21T16:40:00.000000"
}
```

**Use Case**: Add a new node to the cluster (e.g., scaling to a new region or increasing redundancy).

---

### Distributed Storage Endpoints

#### GET /api/storage/record/{record_id}
Retrieve a stored data record.

**Path Parameters:**
- `record_id`: ID of the record to retrieve
- `category` (optional): Data category filter

**Response:**
```json
{
  "record_id": "feedback_001",
  "category": "EXPERT_FEEDBACK",
  "data": {
    "expert_id": "dr_smith",
    "feedback": "correct",
    "confidence": 0.95
  },
  "version": 1,
  "source_node": "node_1",
  "timestamp": "2025-04-21T16:40:00.000000",
  "checksum": "abc123def456"
}
```

**Use Case**: Retrieve expert feedback, alerts, correlations, thresholds, or node state from distributed storage.

---

#### POST /api/storage/record
Store a new data record in distributed storage.

**Request Body:**
```json
{
  "record_id": "alert_critical_001",
  "category": "ALERTS",
  "data": {
    "domain": "solar_wind",
    "severity": "critical",
    "message": "Extreme solar wind conditions detected"
  },
  "source_node": "node_1"
}
```

**Response:**
```json
{
  "status": "record_stored",
  "record_id": "alert_critical_001",
  "category": "ALERTS",
  "version": 1,
  "timestamp": "2025-04-21T16:40:00.000000"
}
```

**Valid Categories:**
- `EXPERT_FEEDBACK`: Expert feedback records
- `ALERTS`: Alert records
- `CORRELATIONS`: Multi-domain correlations
- `THRESHOLDS`: Optimized thresholds
- `NODE_STATE`: Node state snapshots

**Use Case**: Store Phase 2e data (feedback, alerts, correlations) in distributed storage for durability and multi-node access.

---

#### GET /api/storage/status
Get storage system status and statistics.

**Response:**
```json
{
  "component": "Distributed Storage",
  "status": {
    "total_nodes": 3,
    "healthy_nodes": 3,
    "total_records": 42,
    "conflicts_detected": 0,
    "replication_factor": 0.87
  },
  "timestamp": "2025-04-21T16:40:00.000000"
}
```

**Use Case**: Monitor storage system health, record count, and replication factor.

---

### Distributed Consensus Endpoints

#### GET /api/consensus/proposals
List all consensus proposals, optionally filtered by status.

**Query Parameters:**
- `status` (optional): Filter by status (`pending`, `approved`, `rejected`)

**Response:**
```json
{
  "total_proposals": 3,
  "status_filter": null,
  "proposals": [
    {
      "proposal_id": "prop_alert_001",
      "category": "alert",
      "command": "trigger_critical",
      "status": "approved",
      "approved_votes": 2,
      "rejected_votes": 1,
      "required_votes": 2,
      "timestamp": "2025-04-21T16:40:00.000000"
    }
  ],
  "timestamp": "2025-04-21T16:40:00.000000"
}
```

**Use Case**: View consensus proposals for quorum-based alert approval and threshold changes.

---

#### POST /api/consensus/vote
Vote on a consensus proposal.

**Request Body:**
```json
{
  "proposal_id": "prop_alert_001",
  "voter_id": "node_2",
  "vote": true
}
```

**Response:**
```json
{
  "status": "vote_recorded",
  "proposal_id": "prop_alert_001",
  "voter": "node_2",
  "vote": "approved",
  "proposal_status": "approved",
  "approved_votes": 2,
  "rejected_votes": 1,
  "timestamp": "2025-04-21T16:40:00.000000"
}
```

**Use Case**: Participate in quorum voting for critical decisions (alert approval, threshold changes). Quorum size = (cluster_size // 2) + 1.

---

### Failover Management Endpoints

#### GET /api/failover/events
Get failover event history.

**Query Parameters:**
- `node_id` (optional): Filter by failed node
- `hours` (optional, default=24): Time window in hours

**Response:**
```json
{
  "failover_events": 1,
  "node_filter": null,
  "period_hours": 24,
  "events": [
    {
      "failed_node_id": "node_2",
      "backup_node_id": "node_3",
      "reason": "heartbeat_timeout",
      "timestamp": "2025-04-21T15:30:00.000000",
      "status": "completed"
    }
  ],
  "timestamp": "2025-04-21T16:40:00.000000"
}
```

**Use Case**: Audit failover events for operations monitoring and troubleshooting.

---

#### GET /api/replication/status
Get data replication status across nodes.

**Response:**
```json
{
  "replication_strategy": "EVENTUAL_CONSISTENCY",
  "replication_status": {
    "pending_replications": 2,
    "completed_replications": 42,
    "failed_replications": 0,
    "avg_replication_time_ms": 45.3
  },
  "timestamp": "2025-04-21T16:40:00.000000"
}
```

**Replication Strategies:**
- `EVENTUAL_CONSISTENCY` (default): Data eventually consistent across all nodes
- `STRONG_CONSISTENCY`: All nodes must acknowledge before completion
- `READ_REPAIR`: Consistency verified during read operations

**Use Case**: Monitor data replication progress and performance.

---

## Integration with Phase 2e

Phase 2f endpoints work seamlessly with Phase 2e components:

### Expert Feedback Storage
```bash
# Phase 2e: Submit expert feedback
POST /api/feedback/submit
  expert_id=dr_smith
  domain=solar_wind
  rating=correct
  ...

# Phase 2f: Store in distributed storage
POST /api/storage/record
  record_id=feedback_001
  category=EXPERT_FEEDBACK
  data={expert_id, domain, rating, ...}
```

### Alert Distribution
```bash
# Phase 2e: Create alert
GET /api/alerts/active

# Phase 2f: Require quorum approval for critical alerts
POST /api/consensus/vote
  proposal_id=prop_alert_001
  voter_id=node_1
  vote=true
```

### Correlation Storage
```bash
# Phase 2e: Detect correlations
GET /api/correlations/high-confidence

# Phase 2f: Persist correlations
POST /api/storage/record
  record_id=correlation_001
  category=CORRELATIONS
  data={domains, strength, ...}
```

---

## Example Workflows

### Workflow 1: Multi-Region Expert Feedback

**Step 1**: Submit expert feedback in region 1
```bash
curl -X POST http://node-1.us-west:8000/api/feedback/submit \
  -d "expert_id=dr_smith&domain=solar_wind&rating=correct"
```

**Step 2**: Automatically store in distributed storage
```bash
curl -X POST http://node-1.us-west:8000/api/storage/record \
  -H "Content-Type: application/json" \
  -d '{
    "record_id": "feedback_001",
    "category": "EXPERT_FEEDBACK",
    "data": {...},
    "source_node": "node_1"
  }'
```

**Step 3**: Replicate to other regions
```bash
# Automatic: Multi-node manager replicates to node_2 and node_3
GET /api/replication/status
```

**Step 4**: Access feedback from any region
```bash
curl http://node-2.us-east:8000/api/storage/record/feedback_001
curl http://node-3.eu-west:8000/api/storage/record/feedback_001
```

---

### Workflow 2: Quorum-Based Alert Approval

**Step 1**: Detect critical alert in Phase 2e
```bash
GET /api/alerts/active
# Returns: severity=critical alert
```

**Step 2**: Create consensus proposal
```bash
POST /api/consensus/vote
  proposal_id=prop_alert_critical_001
  voter_id=node_1
  vote=true
```

**Step 3**: Nodes vote on approval
```bash
# Node 2 approves
POST /api/consensus/vote
  proposal_id=prop_alert_critical_001
  voter_id=node_2
  vote=true
```

**Step 4**: Check proposal status (quorum size = 2 for 3-node cluster)
```bash
GET /api/consensus/proposals?status=approved
# Result: "approved" status after 2 votes
```

---

### Workflow 3: Automatic Failover

**Step 1**: Node 2 (us-east primary) fails
```
Health monitor detects: no heartbeat for 30 seconds
```

**Step 2**: Automatic failover triggered
```bash
GET /api/failover/events
# Shows: node_2 failed, node_3 (backup) activated
```

**Step 3**: Verify cluster health
```bash
GET /api/cluster/status
# Returns: "degraded" status (2/3 nodes healthy)
```

**Step 4**: Restore node or promote backup
```bash
POST /api/cluster/register-node
  node_id=node_2-new
  region=us-east
  address=node_2-new:8001
```

---

## Performance Metrics

### Quorum Voting
- **Quorum Size**: (cluster_size // 2) + 1
- **3-node cluster**: 2 votes required
- **5-node cluster**: 3 votes required
- **Vote Decision Time**: < 100ms

### Data Replication
- **Replication Strategy**: Eventual consistency (default)
- **Replication Time**: ~50ms per node
- **Checksum Verification**: Automatic on write
- **Conflict Detection**: Version-based

### Health Monitoring
- **Check Interval**: 10 seconds (configurable)
- **Failure Detection Threshold**: 30 seconds
- **Automatic Failover**: < 1 second after detection

### Storage
- **Backend**: SQLite with PostgreSQL readiness
- **Conflict Resolution**: Newer version wins
- **Data Categories**: 5 types (feedback, alerts, correlations, thresholds, node_state)

---

## Error Handling

### Common HTTP Status Codes

| Code | Meaning | Solution |
|------|---------|----------|
| 200 | Success | Operation completed successfully |
| 400 | Bad Request | Invalid parameters; check request format |
| 404 | Not Found | Record/node/proposal not found |
| 500 | Server Error | Internal error; check server logs |
| 501 | Not Implemented | Phase 2f not available; verify imports |

### Example Error Response
```json
{
  "detail": "Record feedback_001 not found"
}
```

---

## Security Considerations

1. **Thread Safety**: All operations use RLock for concurrent access
2. **Checksum Verification**: All records have checksums for integrity
3. **Version Tracking**: Conflict detection via version numbers
4. **Audit Trail**: All sync and failover operations logged

---

## Configuration

### Environment Variables
```bash
# Database location
PHASE_2F_DB_PATH=./misttracker.db

# Health check interval (seconds)
PHASE_2F_HEALTH_CHECK_INTERVAL=10

# Failure detection threshold (seconds)
PHASE_2F_FAILURE_THRESHOLD=30

# Replication strategy
PHASE_2F_REPLICATION_STRATEGY=eventual_consistency  # or strong_consistency, read_repair
```

---

## Testing

Run the comprehensive test suite:
```bash
python test_phase_2f_distributed.py
```

**Tests Covered:**
1. Storage initialization and database setup
2. Multi-node replication and sync
3. Distributed consensus voting
4. Quorum-based alert decisions
5. Health monitoring and node status
6. Data replication scheduling
7. Conflict detection and resolution

**Expected Result:** 7/7 tests passing (100% success rate)

---

## Next Steps

1. **Web UI Updates**: Add "Cluster Management" tab to dashboard
2. **Real-World Testing**: Deploy on multiple physical machines
3. **Performance Tuning**: Optimize replication and voting latency
4. **Backup/Recovery**: Implement snapshot and restore features
5. **Monitoring**: Add Prometheus metrics for cluster health

---

## References

- **Raft Consensus Protocol**: https://raft.github.io/
- **Distributed Systems**: Design & Analysis
- **SQLite Replication**: https://www.sqlite.org/
- **Phase 2e Integration**: See PHASE-2E-FINAL-DELIVERY.md
