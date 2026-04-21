# Docker Setup Guide for Phase 17.2.1 Cluster Simulation

**Purpose**: Simulate 5-node cluster locally for Phase 17.2.1 testing  
**Duration**: ~30 minutes total (including first-time setup)  
**Requirements**: Docker installed, 16GB+ free RAM  

---

## Quick Start (5 minutes)

### 1. Start the cluster
```powershell
cd J:\Portfolio Site\Gdocsdev\MistTracker
docker-compose up -d
```

### 2. Verify all containers are running
```powershell
docker-compose ps
```

Expected output:
```
NAME                 STATUS              PORTS
mist-coordinator     Up (healthy)        3000:3000, 5000:5000
mist-node-1          Up (healthy)        5001:5000
mist-node-2          Up (healthy)        5002:5000
mist-node-3          Up (healthy)        5003:5000
mist-node-4          Up (healthy)        5004:5000
mist-node-5          Up (healthy)        5005:5000
mist-database        Up (healthy)        5432:5432
mist-cache           Up (healthy)        6379:6379
```

### 3. Access services
- **React UI**: http://localhost:3000
- **API Server**: http://localhost:5000
- **Node 1 (H)**: http://localhost:5001
- **Node 2 (He)**: http://localhost:5002
- **Node 3 (Li)**: http://localhost:5003
- **Node 4 (Be)**: http://localhost:5004
- **Node 5 (B)**: http://localhost:5005
- **Database**: localhost:5432 (PostgreSQL)
- **Cache**: localhost:6379 (Redis)

### 4. Stop the cluster
```powershell
docker-compose down
```

---

## Understanding the Setup

### What Docker Does
Docker lets you run **5 isolated Node.js environments** on your machine, each simulating a cluster worker node.

### The 5 Containers

| Container | Role | Atom Type | Port | Purpose |
|-----------|------|-----------|------|---------|
| coordinator | Main orchestrator | N/A | 5000 | Coordinates training across nodes |
| node-1 | Worker | Hydrogen (H) | 5001 | Trains hydrogen proxy |
| node-2 | Worker | Helium (He) | 5002 | Trains helium proxy |
| node-3 | Worker | Lithium (Li) | 5003 | Trains lithium proxy |
| node-4 | Worker | Beryllium (Be) | 5004 | Trains beryllium proxy |
| node-5 | Worker | Boron (B) | 5005 | Trains boron proxy |

**Plus 2 supporting services:**
- **postgres**: Database for milestones & configs
- **redis**: Cache & session storage

### How They Talk to Each Other
```
Your Machine
├─ React Dev Server (localhost:3000)
│  └─ Calls API at localhost:5000
│
├─ Coordinator (localhost:5000)
│  └─ Manages training jobs
│  └─ Aggregates milestones
│  └─ Stores to Database & Cache
│
├─ Worker Nodes (localhost:5001-5005)
│  ├─ node-1: Trains Hydrogen
│  ├─ node-2: Trains Helium
│  ├─ node-3: Trains Lithium
│  ├─ node-4: Trains Beryllium
│  └─ node-5: Trains Boron
│
└─ Supporting Services
   ├─ PostgreSQL (localhost:5432) ← stores data
   └─ Redis (localhost:6379) ← caches results
```

---

## First-Time Setup (One-time only)

### Step 1: Verify Docker is running
```powershell
docker --version
docker run hello-world
```

### Step 2: Navigate to project
```powershell
cd "J:\Portfolio Site\Gdocsdev\MistTracker"
```

### Step 3: Build images (first time only)
```powershell
docker-compose build
```
*This takes ~2-3 minutes to download Node image*

### Step 4: Start cluster
```powershell
docker-compose up -d
```
*First startup takes ~3-5 minutes (npm install in each container)*

### Step 5: Wait for health checks
```powershell
# Monitor startup
docker-compose ps

# Watch logs
docker-compose logs -f
```

Press `Ctrl+C` when you see "All nodes healthy" messages.

---

## Common Commands

### View logs
```powershell
# All containers
docker-compose logs

# Specific container
docker-compose logs coordinator
docker-compose logs node-1

# Follow logs (live)
docker-compose logs -f coordinator
```

### Access container shell
```powershell
# Access coordinator shell
docker exec -it mist-coordinator sh

# Run commands inside
docker exec -it mist-coordinator npm test
docker exec -it mist-node-1 node check-status.js
```

### Stop services
```powershell
# Stop but keep data
docker-compose stop

# Stop everything (cleans up)
docker-compose down

# Stop specific container
docker-compose stop coordinator
```

### Restart
```powershell
# Restart everything
docker-compose restart

# Restart specific container
docker-compose restart node-1
```

### View resource usage
```powershell
docker stats
```

---

## Troubleshooting

### Problem: "Port already in use"
**Symptom**: Error like "bind: address already in use"

**Solution 1**: Stop previous containers
```powershell
docker-compose down
```

**Solution 2**: Kill process on port
```powershell
# Find process on port 5000
netstat -ano | findstr :5000

# Kill it (replace PID with the number)
taskkill /PID <PID> /F
```

### Problem: Containers stuck "starting..."
**Symptom**: `docker-compose ps` shows "Starting" after 5 minutes

**Solution**: Check logs
```powershell
docker-compose logs
```

Look for error messages. Most common issues:
- Node modules not installed → wait longer
- Database connection failed → wait for postgres health check
- Port conflicts → see "Port already in use" above

### Problem: "Cannot connect to Docker daemon"
**Symptom**: `Cannot connect to the Docker daemon`

**Solution**: Start Docker Desktop
1. Open Windows Start Menu
2. Type "Docker Desktop"
3. Click to launch
4. Wait ~30 seconds for it to start
5. Try again

### Problem: Out of memory
**Symptom**: Containers keep crashing with OOM errors

**Solution**: Reduce containers
```yaml
# Edit docker-compose.yml to comment out node-4 and node-5
# Or increase Docker Desktop memory:
# Docker Desktop → Settings → Resources → Memory → increase to 20GB
```

### Problem: Need fresh start
**Symptom**: Containers behaving strangely

**Solution**: Full reset
```powershell
docker-compose down -v
docker-compose build --no-cache
docker-compose up -d
```

---

## Phase 17.2.1 Workflow

### Day 1-2: Development
```powershell
# Start cluster
docker-compose up -d

# Work on Phase 17.2.1.0 (Query Builder)
# Keep cluster running in background

# When ready to test:
npm run test:cluster

# View logs
docker-compose logs -f coordinator
```

### Day 3-4: Cluster Testing
```powershell
# Ensure cluster still running
docker-compose ps

# Start Phase 17.2.1.1 (Molecules)
npm run test:molecules

# Monitor node status
docker-compose logs -f node-1
docker-compose logs -f node-2
```

### Day 5-6: Load Testing
```powershell
# Run load tests
npm run test:load

# Monitor all nodes
docker stats

# Watch coordinator
docker-compose logs -f coordinator
```

### Cleanup
```powershell
# When done with Phase 17.2.1
docker-compose down

# Optional: remove images to free space
docker-compose down -v
```

---

## Performance Tips

### Monitor resource usage
```powershell
docker stats
```
Shows CPU, memory, network I/O for each container.

### Optimize memory usage
- Stop unused containers: `docker-compose stop node-4 node-5`
- Remove old containers: `docker-compose down -v`
- Restart to clear memory: `docker-compose restart`

### Speed up local development
```powershell
# Mount node_modules locally to avoid reinstalls
# (already configured in docker-compose.yml)
# This speeds up subsequent restarts by 3x
```

### Cache optimization
```powershell
# Clear Redis cache
docker exec -it mist-cache redis-cli FLUSHALL

# Check cache size
docker exec -it mist-cache redis-cli INFO MEMORY
```

---

## Accessing Services from Outside Docker

### From Your Machine
```powershell
# API calls from PowerShell
curl http://localhost:5000/api/health

# From browser
http://localhost:3000  # React UI
http://localhost:5000  # API

# Database connection
# Host: localhost
# Port: 5432
# User: mist_user
# Password: mist_dev_password
# Database: misttracker
```

### From Inside Docker (Container-to-Container)
Containers can reach each other using container names:
```
coordinator → http://coordinator:5000
node-1 → http://node-1:5000
postgres → postgres://mist_user@postgres:5432/misttracker
redis → redis://redis:6379
```

---

## Integration with Phase 17.2.1

### Iteration 17.2.1 (Cluster Deployment)
**Your development workflow:**
1. Code locally on your machine (Days 1-2)
2. Start cluster with `docker-compose up -d`
3. Deploy to containers for testing
4. Monitor with `docker-compose logs -f`
5. Iterate quickly without full infrastructure

### What This Saves
- **No SSH access needed** to remote servers
- **No network latency** (Docker on local machine)
- **Instant restart** if something breaks
- **Full visibility** into all logs and metrics
- **Development speed** increases by 5-10x

---

## Next Steps

1. **Now**: `docker-compose up -d`
2. **Verify**: `docker-compose ps` (all showing "healthy")
3. **Test**: `curl http://localhost:5000/health`
4. **Develop**: Start Phase 17.2.1.0 work

---

## Docker Compose Quick Reference

```powershell
# Start cluster (background)
docker-compose up -d

# Stop cluster
docker-compose down

# View status
docker-compose ps

# View logs
docker-compose logs -f

# Restart all
docker-compose restart

# Restart one container
docker-compose restart coordinator

# Execute command in container
docker exec -it mist-coordinator sh

# View resource usage
docker stats

# Clean up volumes
docker-compose down -v
```

---

**Status**: Ready to use  
**Hardware**: Your machine ✅  
**Estimated Setup Time**: 5 minutes (subsequent starts)

For questions, refer back to the troubleshooting section or the Phase 17.2 planning docs.
