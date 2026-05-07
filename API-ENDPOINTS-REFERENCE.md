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

## 7. Sandbox & Validator Reputation Endpoints

### POST /api/sandbox/create
Create a new isolated sandbox simulation for validator testing

**Request Body:**
```json
{
  "validator_id": "user-123",
  "initial_civs": 12,
  "scenario_preset": "balanced|aggressive|diplomatic",
  "duration_turns": 500
}
```

**Response:**
```json
{
  "sandbox_id": "sandbox-550e8400-e29b-41d4-a716-446655440000",
  "validator_id": "user-123",
  "status": "initialized",
  "initial_civs": 12,
  "created_at": "2026-05-05T12:00:00.000Z",
  "turn": 0,
  "reputation_modifier": 1.0
}
```

**HTTP Status:**
- `200` - Sandbox successfully created
- `400` - Invalid validator or configuration
- `503` - Cluster not ready for sandbox

**Use Case:** Validator sets up isolated testing environment

### GET /api/sandbox/:sandbox_id/status
Get current state of a sandbox simulation

**Path Parameters:**
- `sandbox_id` (string, required): UUID of sandbox

**Response:**
```json
{
  "sandbox_id": "sandbox-550e8400-e29b-41d4-a716-446655440000",
  "validator_id": "user-123",
  "status": "running|paused|completed",
  "current_turn": 237,
  "total_turns": 500,
  "civs_active": 11,
  "civs_eliminated": 1,
  "performance_score": 0.7823,
  "validator_reputation": 2450,
  "world_stability": 0.68,
  "trade_volume": 15420,
  "avg_tech_level": 4.2,
  "last_updated": "2026-05-05T12:15:00.000Z"
}
```

**Use Case:** Monitor sandbox progress and metrics

### GET /api/sandbox/:sandbox_id/metrics
Get detailed performance metrics for sandbox evaluation

**Query Parameters:**
- `metric_type` (string, optional): Filter by `diplomatic|military|economic|scientific|stability`

**Response:**
```json
{
  "sandbox_id": "sandbox-550e8400-e29b-41d4-a716-446655440000",
  "metrics": {
    "diplomatic": {
      "score": 0.82,
      "alliances_formed": 4,
      "treaties_signed": 12,
      "betrayals": 1,
      "stability_maintained_turns": 145
    },
    "military": {
      "score": 0.65,
      "successful_wars": 2,
      "defensive_victories": 3,
      "territory_gained": 2400,
      "losses_minimized": 0.92
    },
    "economic": {
      "score": 0.78,
      "trade_routes_active": 8,
      "wealth_accumulated": 45000,
      "market_efficiency": 0.76,
      "resource_diversity": 5
    },
    "scientific": {
      "score": 0.71,
      "techs_researched": 34,
      "avg_research_speed": 1.2,
      "breakthrough_discoveries": 3,
      "tech_advantage_years": 12
    },
    "stability": {
      "score": 0.68,
      "unrest_incidents": 4,
      "rebellions_prevented": 2,
      "peace_treaty_success_rate": 0.83,
      "overall_cohesion": 0.72
    }
  },
  "composite_score": 0.7286,
  "timestamp": "2026-05-05T12:15:00.000Z"
}
```

**Use Case:** Deep performance analysis for reputation calculation

### POST /api/sandbox/:sandbox_id/advance
Advance sandbox simulation by N turns

**Path Parameters:**
- `sandbox_id` (string, required): UUID of sandbox

**Request Body:**
```json
{
  "turns": 10,
  "speed": "normal|fast"
}
```

**Response:**
```json
{
  "sandbox_id": "sandbox-550e8400-e29b-41d4-a716-446655440000",
  "turns_executed": 10,
  "current_turn": 247,
  "events_occurred": [
    {"turn": 241, "type": "diplomatic", "description": "Trade agreement signed"},
    {"turn": 244, "type": "military", "description": "Border skirmish resolved"},
    {"turn": 246, "type": "scientific", "description": "New technology discovered"}
  ],
  "performance_delta": 0.0234
}
```

**HTTP Status:**
- `200` - Turns successfully executed
- `400` - Invalid turn count
- `409` - Sandbox already completed

**Use Case:** Step through sandbox simulation

### GET /api/validator/:validator_id/reputation
Get current reputation score and history

**Path Parameters:**
- `validator_id` (string, required): Validator user ID

**Response:**
```json
{
  "validator_id": "user-123",
  "current_reputation": 2450,
  "reputation_tier": "apprentice|journeyman|master|architect",
  "lifetime_sandboxes_completed": 23,
  "avg_sandbox_score": 0.7156,
  "influence_multiplier": 0.85,
  "primary_universe_influence": {
    "diplomatic_weight": 0.0085,
    "military_weight": 0.0078,
    "economic_weight": 0.0082,
    "scientific_weight": 0.0089,
    "stability_weight": 0.0074
  },
  "reputation_history": [
    {"timestamp": "2026-05-04T10:00:00.000Z", "change": 150, "reason": "Sandbox 15 completed"},
    {"timestamp": "2026-05-03T14:30:00.000Z", "change": -25, "reason": "Reputation decay (30 days)"}
  ],
  "next_tier_progress": 0.62
}
```

**Use Case:** Track validator progress and influence potential

### POST /api/universe/apply-influence
Submit validated sandbox results to influence primary universe

**Request Body:**
```json
{
  "validator_id": "user-123",
  "sandbox_id": "sandbox-550e8400-e29b-41d4-a716-446655440000",
  "influence_type": "diplomatic|military|economic|scientific",
  "proposal": {
    "description": "Promote peaceful resolution mechanic",
    "affected_civs": ["civ-1", "civ-5", "civ-12"],
    "probability_modifier": 0.12,
    "duration_turns": 200
  }
}
```

**Response:**
```json
{
  "influence_id": "influence-550e8400-e29b-41d4-a716-446655440000",
  "status": "submitted|approved|rejected",
  "validator_reputation": 2450,
  "applied_weight": 0.0085,
  "estimated_impact": {
    "affected_civs": 3,
    "probability_boost": 0.12,
    "duration_turns": 200,
    "rollback_cost": 50
  },
  "approval_status": "awaiting_Byzantine_quorum",
  "timestamp": "2026-05-05T12:20:00.000Z"
}
```

**HTTP Status:**
- `200` - Influence proposal submitted
- `400` - Invalid proposal format
- `403` - Insufficient reputation
- `409` - Conflicting active influence

**Use Case:** Validators apply learned strategies to primary universe

### GET /api/universe/influence-log
View all active influences affecting primary universe

**Query Parameters:**
- `validator_id` (string, optional): Filter by validator
- `influence_type` (string, optional): Filter by type
- `active_only` (boolean, optional): Show only currently active

**Response:**
```json
{
  "total_active_influences": 127,
  "influences": [
    {
      "influence_id": "influence-550e8400-e29b-41d4-a716-446655440000",
      "validator_id": "user-123",
      "validator_reputation": 2450,
      "type": "diplomatic",
      "description": "Promote peaceful resolution mechanic",
      "applied_weight": 0.0085,
      "duration_turns": 200,
      "turns_remaining": 87,
      "estimated_civs_affected": 3,
      "approval_quorum": "7/11 validators approved"
    }
  ],
  "total_universe_influence_weight": 3.42,
  "timestamp": "2026-05-05T12:25:00.000Z"
}
```

**Use Case:** Observe how validator competence shapes universe evolution

### POST /api/sandbox/:sandbox_id/complete
Finalize sandbox and calculate reputation adjustment

**Path Parameters:**
- `sandbox_id` (string, required): UUID of sandbox

**Request Body:**
```json
{
  "final_assessment": "successful|partial|abandoned"
}
```

**Response:**
```json
{
  "sandbox_id": "sandbox-550e8400-e29b-41d4-a716-446655440000",
  "validator_id": "user-123",
  "final_score": 0.7286,
  "turns_completed": 500,
  "reputation_earned": 285,
  "new_total_reputation": 2735,
  "feedback": {
    "strengths": ["Exceptional diplomatic strategy", "Stable economy throughout"],
    "improvement_areas": ["Military tactics", "Handling late-game crises"]
  },
  "influence_available": true,
  "eligible_influence_types": ["diplomatic", "economic"],
  "completed_at": "2026-05-05T14:00:00.000Z"
}
```

**HTTP Status:**
- `200` - Sandbox completed and scored
- `400` - Sandbox not in completable state
- `404` - Sandbox not found

**Use Case:** Finalize validator learning cycle and award reputation

---

## Document Version
- **Version**: 1.1
- **Phase**: 17.2.3 (Extended with Sandbox & Reputation)
- **Date**: May 5, 2026
- **Status**: Active
