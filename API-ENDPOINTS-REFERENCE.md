# MistTracker Cluster API Reference
## Phase 17.2.3: API Endpoints Implementation

### Base URL
```
http://coordinator:5000
```

### Authentication
None (add JWT/API key in future phases)

---

## 1. Health Check Endpoints

### GET /health
Basic health check for the coordinator

**Response:**
```json
{
  "status": "healthy",
  "coordinator_id": "550e8400-e29b-41d4-a716-446655440000",
  "timestamp": "2024-01-01T12:00:00.000Z"
}
```

---

## 2. System Metrics Endpoints

### GET /api/cluster/metrics
Get real-time system metrics and cluster status

**Query Parameters:**
- None

**Response:**
```json
{
  "status": "operational|training|degraded|idle",
  "online_nodes": 5,
  "offline_nodes": 0,
  "training_nodes": 3,
  "total_nodes": 5,
  "avg_accuracy": 0.8756,
  "avg_loss": 0.2341,
  "cpu_usage": 42.5,
  "memory_usage": 1280.5,
  "total_epochs": 1250,
  "atoms_trained": 5,
  "timestamp": "2024-01-01T12:00:00.000Z"
}
```

**Status Values:**
- `operational` - Cluster running at full capacity (all nodes healthy)
- `training` - One or more nodes actively training
- `degraded` - Less than 50% of nodes healthy
- `idle` - No active training

**Use Case:** Dashboard quick stats, system overview

---

## 3. Node Management Endpoints

### GET /api/cluster/nodes
Get list of all cluster nodes with their status

**Query Parameters:**
- None

**Response:**
```json
{
  "nodes": [
    {
      "id": "node-1",
      "atom_symbol": "H",
      "status": "healthy|connected|pending|disconnected",
      "last_heartbeat": "2024-01-01T12:00:00.000Z",
      "training_active": true
    },
    {
      "id": "node-2",
      "atom_symbol": "He",
      "status": "healthy",
      "last_heartbeat": "2024-01-01T12:00:00.000Z",
      "training_active": false
    }
  ]
}
```

**Node Status Values:**
- `healthy` - Node connected and operational
- `connected` - Node connected but not yet fully initialized
- `pending` - Node not yet connected
- `disconnected` - Node was connected but disconnected

**Use Case:** Cluster topology visualization, node health monitoring

### GET /api/cluster/status
Get comprehensive cluster status with detailed node information

**Query Parameters:**
- None

**Response:**
```json
{
  "coordinator_id": "550e8400-e29b-41d4-a716-446655440000",
  "cluster_health": {
    "healthy_nodes": 5,
    "total_nodes": 5,
    "avg_cpu_usage": 42.5,
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
      "loss": 0.1234,
      "accuracy": 0.9156,
      "last_heartbeat": "2024-01-01T12:00:00.000Z"
    }
  ],
  "timestamp": "2024-01-01T12:00:00.000Z"
}
```

**Use Case:** Detailed cluster monitoring, training progress tracking

---

## 4. Session Management Endpoints

### POST /api/cluster/train
Start a new training session across specified atoms

**Request Body:**
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

**Response:**
```json
{
  "session_id": "550e8400-e29b-41d4-a716-446655440000",
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

**HTTP Status:**
- `200` - Training successfully initiated
- `400` - Invalid request (missing atoms, invalid config)
- `503` - Cluster not ready

**Use Case:** Start multi-atom training

### DELETE /api/cluster/train/:session_id
Stop an ongoing training session

**Path Parameters:**
- `session_id` (string, required): UUID of the training session

**Response:**
```json
{
  "message": "Training stopped",
  "session_id": "550e8400-e29b-41d4-a716-446655440000"
}
```

**HTTP Status:**
- `200` - Training successfully stopped
- `404` - Session not found

**Use Case:** Stop training, emergency halt

### GET /api/cluster/session
Get current/latest training session information

**Query Parameters:**
- None

**Response:**
```json
{
  "session_id": "550e8400-e29b-41d4-a716-446655440000",
  "start_time": "2024-01-01T12:00:00.000Z",
  "status": "active|complete|stopped",
  "atom_count": 5,
  "total_milestones": 450,
  "atoms": ["H", "He", "Li", "Be", "B"]
}
```

**Status Values:**
- `active` - Training session in progress
- `complete` - Training session completed
- `stopped` - Training session was stopped

**Use Case:** Dashboard session overview, current session details

---

## 5. Milestone Endpoints

### GET /api/cluster/milestones
Get all milestones with optional filtering by session

**Query Parameters:**
- `session_id` (string, optional): Filter by session UUID

**Response:**
```json
{
  "milestones": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "node_id": "node-1",
      "atom": "H",
      "session_id": "550e8400-e29b-41d4-a716-446655440001",
      "epoch": 10,
      "loss": 0.4532,
      "accuracy": 0.7845,
      "timestamp": "2024-01-01T12:00:00.000Z",
      "metadata": {
        "training_elapsed_ms": 5000,
        "batch_count": 32
      }
    }
  ],
  "total": 450,
  "timestamp": "2024-01-01T12:00:00.000Z"
}
```

**Milestone Fields:**
- `id` - Unique milestone identifier
- `node_id` - Worker node that generated the milestone
- `atom` - Atom symbol (H, He, Li, Be, B)
- `session_id` - Associated training session
- `epoch` - Training epoch number
- `loss` - Loss value at this epoch
- `accuracy` - Accuracy at this epoch (0-1)
- `timestamp` - When milestone was recorded
- `metadata` - Additional training metadata

**Use Cases:**
- Convergence analysis
- Timeline visualization
- Performance comparison

---

## 6. Performance Analysis Endpoints

### GET /api/cluster/performance
Get aggregated performance metrics across all sessions

**Query Parameters:**
- None

**Response:**
```json
{
  "sessions": [
    {
      "session_id": "550e8400-e29b-41d4-a716-446655440000",
      "start_time": "2024-01-01T12:00:00.000Z",
      "status": "active|complete|stopped",
      "atoms": ["H", "He", "Li", "Be", "B"]
    }
  ],
  "performance": {
    "550e8400-e29b-41d4-a716-446655440000": {
      "H": {
        "avg_accuracy": 0.9234,
        "avg_loss": 0.1234,
        "sample_count": 100,
        "best_accuracy": 0.9876,
        "worst_accuracy": 0.8234
      },
      "He": {
        "avg_accuracy": 0.8945,
        "avg_loss": 0.1567,
        "sample_count": 100,
        "best_accuracy": 0.9567,
        "worst_accuracy": 0.7834
      }
    }
  },
  "timestamp": "2024-01-01T12:00:00.000Z"
}
```

**Performance Metrics:**
- `avg_accuracy` - Average accuracy across all epochs (0-1)
- `avg_loss` - Average loss across all epochs
- `sample_count` - Number of milestones recorded
- `best_accuracy` - Best accuracy achieved
- `worst_accuracy` - Worst accuracy achieved

**Use Cases:**
- Performance heatmap generation
- Cross-session comparison
- Statistical analysis

---

## API Usage Patterns

### 1. Dashboard Initialization
```bash
# Get current metrics
curl http://localhost:5000/api/cluster/metrics

# Get current session
curl http://localhost:5000/api/cluster/session

# Get node status
curl http://localhost:5000/api/cluster/nodes
```

### 2. Real-time Monitoring
```bash
# Poll metrics every 2 seconds
# Poll milestones every 3-5 seconds
# Poll session every 5 seconds
```

### 3. Training Session
```bash
# 1. Start training
curl -X POST http://localhost:5000/api/cluster/train \
  -H "Content-Type: application/json" \
  -d '{
    "atoms": ["H", "He", "Li", "Be", "B"],
    "config": {"epochs": 100}
  }'

# 2. Monitor with metrics endpoint
curl http://localhost:5000/api/cluster/metrics

# 3. Analyze with performance endpoint
curl http://localhost:5000/api/cluster/performance

# 4. Stop if needed
curl -X DELETE http://localhost:5000/api/cluster/train/{session_id}
```

### 4. Historical Analysis
```bash
# Get all milestones for specific session
curl "http://localhost:5000/api/cluster/milestones?session_id={session_id}"

# Get performance metrics
curl http://localhost:5000/api/cluster/performance
```

---

## Error Responses

### 400 Bad Request
```json
{
  "error": "Invalid request",
  "details": "Missing required field: atoms",
  "timestamp": "2024-01-01T12:00:00.000Z"
}
```

### 404 Not Found
```json
{
  "error": "Session not found",
  "session_id": "550e8400-e29b-41d4-a716-446655440000",
  "timestamp": "2024-01-01T12:00:00.000Z"
}
```

### 503 Service Unavailable
```json
{
  "error": "Cluster not ready",
  "reason": "Not enough healthy nodes",
  "healthy_nodes": 2,
  "required_nodes": 3,
  "timestamp": "2024-01-01T12:00:00.000Z"
}
```

---

## Rate Limiting

No rate limiting currently implemented. Future phases will add:
- Per-IP rate limits
- Per-session throttling
- API key quotas

---

## WebSocket API

### Connection
```
ws://coordinator:5000
```

### Message Types

#### REGISTER (Node → Coordinator)
```json
{
  "type": "REGISTER",
  "node_id": "node-1"
}
```

#### HEARTBEAT (Node → Coordinator)
```json
{
  "type": "HEARTBEAT",
  "training_status": {
    "epoch": 45,
    "total_epochs": 100,
    "loss": 0.1234,
    "accuracy": 0.9156
  }
}
```

#### MILESTONE (Node → Coordinator)
```json
{
  "type": "MILESTONE",
  "session_id": "550e8400-e29b-41d4-a716-446655440000",
  "epoch": 10,
  "loss": 0.4532,
  "accuracy": 0.7845,
  "metadata": {
    "training_elapsed_ms": 5000
  }
}
```

#### TRAIN_START (Coordinator → Node)
```json
{
  "type": "TRAIN_START",
  "session_id": "550e8400-e29b-41d4-a716-446655440000",
  "atom": "H",
  "config": {
    "epochs": 100,
    "batch_size": 32,
    "learning_rate": 0.001
  }
}
```

#### TRAIN_STOP (Coordinator → Node)
```json
{
  "type": "TRAIN_STOP",
  "session_id": "550e8400-e29b-41d4-a716-446655440000"
}
```

---

## Data Types

### Atom Symbol
```typescript
type AtomSymbol = "H" | "He" | "Li" | "Be" | "B";
```

### Session Status
```typescript
type SessionStatus = "training" | "complete" | "stopped" | "idle";
```

### Node Status
```typescript
type NodeStatus = "healthy" | "connected" | "pending" | "disconnected";
```

### Cluster Status
```typescript
type ClusterStatus = "operational" | "training" | "degraded" | "idle";
```

---

## Integration with Phase 17.2.2 UI

### Dashboard Component
- **Uses**: `/api/cluster/metrics`, `/api/cluster/session`
- **Refresh**: 2-5 seconds

### ConvergenceAnalysis Component
- **Uses**: `/api/cluster/milestones?session_id=...`
- **Refresh**: 3-5 seconds

### MilestoneTimeline Component
- **Uses**: `/api/cluster/milestones?session_id=...`
- **Refresh**: 3-5 seconds

### ClusterPerformanceComparison Component
- **Uses**: `/api/cluster/performance`
- **Refresh**: 5 seconds

---

## Performance Considerations

### Endpoint Latency (Typical)
- `GET /api/cluster/metrics` - ~10ms
- `GET /api/cluster/status` - ~20ms
- `GET /api/cluster/nodes` - ~5ms
- `GET /api/cluster/milestones` - 20-100ms (depends on milestone count)
- `GET /api/cluster/performance` - 50-200ms (depends on session/milestone count)
- `GET /api/cluster/session` - ~10ms

### Scalability Notes
- Milestones endpoint may need pagination for > 10,000 milestones
- Consider aggregating old milestones into summary data
- Performance endpoint computation grows with session count

### Optimization Opportunities
- Add caching layer for performance data
- Implement pagination for milestones
- Add server-side filtering/aggregation
- Consider message compression for large responses

---

## Future Enhancements (Phase 17.2.4+)

1. **Authentication & Authorization**
   - JWT token validation
   - Role-based access control
   - API key management

2. **Advanced Filtering**
   - Date range queries
   - Metric thresholds
   - Atom-specific filtering

3. **Data Export**
   - CSV export for milestones
   - PDF reports for sessions
   - JSON dumps for analysis

4. **Webhooks**
   - Milestone webhooks
   - Convergence notifications
   - Anomaly alerts

5. **Metrics Aggregation**
   - Time-series data storage
   - Statistical summaries
   - Trend analysis

---

## Deployment Checklist

- [x] Coordinator service implemented with all endpoints
- [x] API responses match UI requirements
- [x] Error handling implemented
- [x] CORS enabled for cross-origin requests
- [ ] Rate limiting configured
- [ ] Authentication implemented
- [ ] API documentation complete
- [ ] Example usage documented
- [ ] Performance tested
- [ ] Deployed to production

---

## Support & Troubleshooting

### Common Issues

**Q: Getting 503 "Cluster not ready"**
A: Wait for cluster nodes to connect (60-90 seconds after startup)

**Q: Milestones endpoint returns empty**
A: Start a training session first using `POST /api/cluster/train`

**Q: Metrics show all zeros**
A: Cluster nodes not yet connected or training not started

**Q: Performance data empty**
A: Need at least one completed training session

### Debug Commands
```bash
# Check coordinator health
curl http://localhost:5000/health

# Get current status
curl http://localhost:5000/api/cluster/status

# Check cluster readiness
curl http://localhost:5000/api/cluster/metrics

# View all nodes
curl http://localhost:5000/api/cluster/nodes
```

---

## Document Version
- **Version**: 1.0
- **Phase**: 17.2.3
- **Date**: April 19, 2024
- **Status**: Active
