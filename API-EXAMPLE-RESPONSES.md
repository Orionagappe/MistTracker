# API Example Responses
## Phase 17.2.3: Complete Response Examples

This file provides realistic example responses for all MistTracker API endpoints.

---

## 1. Health Check Endpoint

### GET /health

**Response (200 OK):**
```json
{
  "status": "healthy",
  "coordinator_id": "a3f8e2d1-4b6c-4e7f-9a1d-2c3e4f5a6b7c",
  "timestamp": "2024-04-19T14:30:45.123Z"
}
```

---

## 2. System Metrics Endpoint

### GET /api/cluster/metrics

**Response (200 OK) - Idle State:**
```json
{
  "status": "idle",
  "online_nodes": 0,
  "offline_nodes": 5,
  "training_nodes": 0,
  "total_nodes": 5,
  "avg_accuracy": 0,
  "avg_loss": 0,
  "cpu_usage": 0,
  "memory_usage": 0,
  "total_epochs": 0,
  "atoms_trained": 0,
  "timestamp": "2024-04-19T14:30:45.123Z"
}
```

**Response (200 OK) - Operational State (All Nodes Healthy):**
```json
{
  "status": "operational",
  "online_nodes": 5,
  "offline_nodes": 0,
  "training_nodes": 0,
  "total_nodes": 5,
  "avg_accuracy": 0.8234,
  "avg_loss": 0.2156,
  "cpu_usage": 35.2,
  "memory_usage": 1024.5,
  "total_epochs": 500,
  "atoms_trained": 5,
  "timestamp": "2024-04-19T14:30:45.123Z"
}
```

**Response (200 OK) - Training State:**
```json
{
  "status": "training",
  "online_nodes": 5,
  "offline_nodes": 0,
  "training_nodes": 5,
  "total_nodes": 5,
  "avg_accuracy": 0.7892,
  "avg_loss": 0.3142,
  "cpu_usage": 78.5,
  "memory_usage": 1536.2,
  "total_epochs": 1250,
  "atoms_trained": 5,
  "timestamp": "2024-04-19T14:30:45.123Z"
}
```

**Response (200 OK) - Degraded State (Partial Node Failure):**
```json
{
  "status": "degraded",
  "online_nodes": 2,
  "offline_nodes": 3,
  "training_nodes": 1,
  "total_nodes": 5,
  "avg_accuracy": 0.6234,
  "avg_loss": 0.4567,
  "cpu_usage": 42.1,
  "memory_usage": 768.3,
  "total_epochs": 450,
  "atoms_trained": 2,
  "timestamp": "2024-04-19T14:30:45.123Z"
}
```

---

## 3. Node Management Endpoints

### GET /api/cluster/nodes

**Response (200 OK):**
```json
{
  "nodes": [
    {
      "id": "node-1",
      "atom_symbol": "H",
      "status": "healthy",
      "last_heartbeat": "2024-04-19T14:30:40.000Z",
      "training_active": true
    },
    {
      "id": "node-2",
      "atom_symbol": "He",
      "status": "healthy",
      "last_heartbeat": "2024-04-19T14:30:42.000Z",
      "training_active": true
    },
    {
      "id": "node-3",
      "atom_symbol": "Li",
      "status": "healthy",
      "last_heartbeat": "2024-04-19T14:30:39.000Z",
      "training_active": true
    },
    {
      "id": "node-4",
      "atom_symbol": "Be",
      "status": "disconnected",
      "last_heartbeat": "2024-04-19T14:20:15.000Z",
      "training_active": false
    },
    {
      "id": "node-5",
      "atom_symbol": "B",
      "status": "pending",
      "last_heartbeat": null,
      "training_active": false
    }
  ]
}
```

### GET /api/cluster/status

**Response (200 OK):**
```json
{
  "coordinator_id": "a3f8e2d1-4b6c-4e7f-9a1d-2c3e4f5a6b7c",
  "cluster_health": {
    "healthy_nodes": 3,
    "total_nodes": 5,
    "avg_cpu_usage": 45.2,
    "avg_memory_usage_mb": 1280.5
  },
  "nodes": [
    {
      "id": "node-1",
      "atom": "H",
      "status": "healthy",
      "training_active": true,
      "current_epoch": 45,
      "total_epochs": 100,
      "loss": 0.123456,
      "accuracy": 0.8765,
      "last_heartbeat": "2024-04-19T14:30:40.000Z"
    },
    {
      "id": "node-2",
      "atom": "He",
      "status": "healthy",
      "training_active": true,
      "current_epoch": 42,
      "total_epochs": 100,
      "loss": 0.145678,
      "accuracy": 0.8542,
      "last_heartbeat": "2024-04-19T14:30:42.000Z"
    },
    {
      "id": "node-3",
      "atom": "Li",
      "status": "healthy",
      "training_active": true,
      "current_epoch": 48,
      "total_epochs": 100,
      "loss": 0.098765,
      "accuracy": 0.8923,
      "last_heartbeat": "2024-04-19T14:30:39.000Z"
    },
    {
      "id": "node-4",
      "atom": "Be",
      "status": "disconnected",
      "training_active": false,
      "current_epoch": 0,
      "total_epochs": 0,
      "loss": null,
      "accuracy": null,
      "last_heartbeat": "2024-04-19T14:20:15.000Z"
    },
    {
      "id": "node-5",
      "atom": "B",
      "status": "pending",
      "training_active": false,
      "current_epoch": 0,
      "total_epochs": 0,
      "loss": null,
      "accuracy": null,
      "last_heartbeat": null
    }
  ],
  "timestamp": "2024-04-19T14:30:45.123Z"
}
```

---

## 4. Session Management Endpoints

### POST /api/cluster/train

**Request:**
```json
{
  "atoms": ["H", "He", "Li", "Be", "B"],
  "config": {
    "epochs": 100,
    "batch_size": 32,
    "learning_rate": 0.001,
    "validation_split": 0.2
  }
}
```

**Response (200 OK):**
```json
{
  "session_id": "d7e9f1a3-2b5c-4d6e-8f7a-9b0c1d2e3f4a",
  "status": "training_initiated",
  "atoms": ["H", "He", "Li", "Be", "B"],
  "config": {
    "epochs": 100,
    "batch_size": 32,
    "learning_rate": 0.001,
    "validation_split": 0.2
  }
}
```

**Response (400 Bad Request):**
```json
{
  "error": "Invalid request",
  "details": "Missing required field: atoms",
  "timestamp": "2024-04-19T14:30:45.123Z"
}
```

**Response (503 Service Unavailable):**
```json
{
  "error": "Cluster not ready",
  "reason": "Not enough healthy nodes",
  "healthy_nodes": 1,
  "required_nodes": 3,
  "timestamp": "2024-04-19T14:30:45.123Z"
}
```

### DELETE /api/cluster/train/{session_id}

**Response (200 OK):**
```json
{
  "message": "Training stopped",
  "session_id": "d7e9f1a3-2b5c-4d6e-8f7a-9b0c1d2e3f4a"
}
```

**Response (404 Not Found):**
```json
{
  "error": "Session not found",
  "session_id": "d7e9f1a3-2b5c-4d6e-8f7a-9b0c1d2e3f4a",
  "timestamp": "2024-04-19T14:30:45.123Z"
}
```

### GET /api/cluster/session

**Response (200 OK) - Active Session:**
```json
{
  "session_id": "d7e9f1a3-2b5c-4d6e-8f7a-9b0c1d2e3f4a",
  "start_time": "2024-04-19T14:00:00.000Z",
  "status": "active",
  "atom_count": 5,
  "total_milestones": 450,
  "atoms": ["H", "He", "Li", "Be", "B"]
}
```

**Response (200 OK) - No Active Session:**
```json
{
  "session_id": null,
  "status": "idle",
  "atom_count": 0,
  "start_time": null
}
```

---

## 5. Milestone Endpoints

### GET /api/cluster/milestones

**Response (200 OK) - All Milestones:**
```json
{
  "milestones": [
    {
      "id": "m-001-001",
      "node_id": "node-1",
      "atom": "H",
      "session_id": "d7e9f1a3-2b5c-4d6e-8f7a-9b0c1d2e3f4a",
      "epoch": 10,
      "loss": 0.453234,
      "accuracy": 0.7845,
      "timestamp": "2024-04-19T14:05:00.000Z",
      "metadata": {
        "training_elapsed_ms": 5000,
        "batch_count": 32
      }
    },
    {
      "id": "m-001-002",
      "node_id": "node-1",
      "atom": "H",
      "session_id": "d7e9f1a3-2b5c-4d6e-8f7a-9b0c1d2e3f4a",
      "epoch": 20,
      "loss": 0.342156,
      "accuracy": 0.8234,
      "timestamp": "2024-04-19T14:10:00.000Z",
      "metadata": {
        "training_elapsed_ms": 10000,
        "batch_count": 32
      }
    },
    {
      "id": "m-001-003",
      "node_id": "node-1",
      "atom": "H",
      "session_id": "d7e9f1a3-2b5c-4d6e-8f7a-9b0c1d2e3f4a",
      "epoch": 30,
      "loss": 0.256789,
      "accuracy": 0.8567,
      "timestamp": "2024-04-19T14:15:00.000Z",
      "metadata": {
        "training_elapsed_ms": 15000,
        "batch_count": 32
      }
    },
    {
      "id": "m-002-001",
      "node_id": "node-2",
      "atom": "He",
      "session_id": "d7e9f1a3-2b5c-4d6e-8f7a-9b0c1d2e3f4a",
      "epoch": 10,
      "loss": 0.512345,
      "accuracy": 0.7234,
      "timestamp": "2024-04-19T14:05:00.000Z",
      "metadata": {
        "training_elapsed_ms": 5000,
        "batch_count": 32
      }
    },
    {
      "id": "m-002-002",
      "node_id": "node-2",
      "atom": "He",
      "session_id": "d7e9f1a3-2b5c-4d6e-8f7a-9b0c1d2e3f4a",
      "epoch": 20,
      "loss": 0.398765,
      "accuracy": 0.7892,
      "timestamp": "2024-04-19T14:10:00.000Z",
      "metadata": {
        "training_elapsed_ms": 10000,
        "batch_count": 32
      }
    }
  ],
  "total": 450,
  "timestamp": "2024-04-19T14:30:45.123Z"
}
```

**Response (200 OK) - Filtered by Session:**
```
GET /api/cluster/milestones?session_id=d7e9f1a3-2b5c-4d6e-8f7a-9b0c1d2e3f4a

{
  "milestones": [
    // Same structure as above, but only milestones from this session
  ],
  "total": 450,
  "timestamp": "2024-04-19T14:30:45.123Z"
}
```

---

## 6. Performance Analysis Endpoints

### GET /api/cluster/performance

**Response (200 OK):**
```json
{
  "sessions": [
    {
      "session_id": "d7e9f1a3-2b5c-4d6e-8f7a-9b0c1d2e3f4a",
      "start_time": "2024-04-19T14:00:00.000Z",
      "status": "active",
      "atoms": ["H", "He", "Li", "Be", "B"]
    },
    {
      "session_id": "c6d8e0a2-1a4b-3c5d-7e8f-0a1b2c3d4e5f",
      "start_time": "2024-04-19T13:00:00.000Z",
      "status": "complete",
      "atoms": ["H", "He", "Li"]
    }
  ],
  "performance": {
    "d7e9f1a3-2b5c-4d6e-8f7a-9b0c1d2e3f4a": {
      "H": {
        "avg_accuracy": 0.8756,
        "avg_loss": 0.1834,
        "sample_count": 100,
        "best_accuracy": 0.9567,
        "worst_accuracy": 0.7234
      },
      "He": {
        "avg_accuracy": 0.8423,
        "avg_loss": 0.2134,
        "sample_count": 100,
        "best_accuracy": 0.9234,
        "worst_accuracy": 0.6789
      },
      "Li": {
        "avg_accuracy": 0.8945,
        "avg_loss": 0.1567,
        "sample_count": 100,
        "best_accuracy": 0.9678,
        "worst_accuracy": 0.7456
      },
      "Be": {
        "avg_accuracy": 0.8234,
        "avg_loss": 0.2456,
        "sample_count": 100,
        "best_accuracy": 0.9123,
        "worst_accuracy": 0.6234
      },
      "B": {
        "avg_accuracy": 0.8567,
        "avg_loss": 0.1956,
        "sample_count": 100,
        "best_accuracy": 0.9345,
        "worst_accuracy": 0.6789
      }
    },
    "c6d8e0a2-1a4b-3c5d-7e8f-0a1b2c3d4e5f": {
      "H": {
        "avg_accuracy": 0.8234,
        "avg_loss": 0.2345,
        "sample_count": 50,
        "best_accuracy": 0.8945,
        "worst_accuracy": 0.6234
      },
      "He": {
        "avg_accuracy": 0.7956,
        "avg_loss": 0.2567,
        "sample_count": 50,
        "best_accuracy": 0.8723,
        "worst_accuracy": 0.5678
      },
      "Li": {
        "avg_accuracy": 0.8456,
        "avg_loss": 0.1876,
        "sample_count": 50,
        "best_accuracy": 0.9123,
        "worst_accuracy": 0.6789
      }
    }
  },
  "timestamp": "2024-04-19T14:30:45.123Z"
}
```

---

## 7. Error Response Examples

### 400 Bad Request
```json
{
  "error": "Invalid request",
  "details": "Missing required field: atoms",
  "timestamp": "2024-04-19T14:30:45.123Z"
}
```

### 404 Not Found
```json
{
  "error": "Session not found",
  "session_id": "invalid-session-id",
  "timestamp": "2024-04-19T14:30:45.123Z"
}
```

### 503 Service Unavailable
```json
{
  "error": "Cluster not ready",
  "reason": "Only 1 of 5 nodes connected",
  "healthy_nodes": 1,
  "required_nodes": 3,
  "timestamp": "2024-04-19T14:30:45.123Z"
}
```

### 500 Internal Server Error
```json
{
  "error": "Internal server error",
  "message": "Failed to process request",
  "timestamp": "2024-04-19T14:30:45.123Z"
}
```

---

## Testing Sequence

### 1. Initial Setup Test
```bash
# Check health
curl http://localhost:5000/health
# Expected: 200 OK with healthy status

# Check metrics (should show offline)
curl http://localhost:5000/api/cluster/metrics
# Expected: status=idle, online_nodes=0
```

### 2. Cluster Ready Test (After 60-90s)
```bash
# Check metrics (should show operational)
curl http://localhost:5000/api/cluster/metrics
# Expected: status=operational, online_nodes=5

# Check nodes
curl http://localhost:5000/api/cluster/nodes
# Expected: All 5 nodes with status=healthy
```

### 3. Training Start Test
```bash
# Start training
curl -X POST http://localhost:5000/api/cluster/train \
  -H "Content-Type: application/json" \
  -d '{"atoms":["H","He","Li","Be","B"],"config":{"epochs":100}}'
# Expected: 200 OK with session_id

# Save the session_id from response
SESSION_ID="d7e9f1a3-2b5c-4d6e-8f7a-9b0c1d2e3f4a"

# Check metrics (should show training)
curl http://localhost:5000/api/cluster/metrics
# Expected: status=training, training_nodes=5
```

### 4. Monitoring Test (During Training)
```bash
# Check session
curl http://localhost:5000/api/cluster/session
# Expected: status=active with milestone count increasing

# Check milestones
curl http://localhost:5000/api/cluster/milestones
# Expected: Growing list of milestones

# Check performance
curl http://localhost:5000/api/cluster/performance
# Expected: Performance metrics for current session
```

### 5. Stop Training Test
```bash
# Stop training
curl -X DELETE http://localhost:5000/api/cluster/train/$SESSION_ID
# Expected: 200 OK with message "Training stopped"

# Check metrics
curl http://localhost:5000/api/cluster/metrics
# Expected: training_nodes=0
```

---

## Integration with Dashboard

These examples show how responses map to dashboard components:

### Dashboard Component
- Uses: `/api/cluster/metrics`
- Displays: online_nodes, avg_accuracy, avg_loss, total_epochs, atoms_trained
- Uses: `/api/cluster/session`
- Displays: session_id, start_time, atom_count

### ConvergenceAnalysis Component
- Uses: `/api/cluster/milestones?session_id=...`
- Builds: Per-atom accuracy/loss curves
- Detects: Convergence epochs

### MilestoneTimeline Component
- Uses: `/api/cluster/milestones?session_id=...`
- Displays: Timeline of all milestones
- Groups: By atom

### ClusterPerformanceComparison Component
- Uses: `/api/cluster/performance`
- Displays: Heatmap of accuracy by session × atom
- Ranks: Best/worst sessions

---

## Notes

- All timestamps are ISO 8601 format with millisecond precision
- Accuracy values are normalized to 0-1 range
- Loss values are floating point (no normalization)
- Session IDs are UUIDs (36 characters)
- Milestone IDs follow pattern: `m-{node_number}-{sequence}`

---

## Document Version
- **Version**: 1.0
- **Phase**: 17.2.3
- **Date**: April 19, 2024
- **Status**: Active
