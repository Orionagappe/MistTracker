# Docker Quick Reference - Phase 17.2 Cluster Simulation

**Print this page or keep in your terminal for quick reference during Phase 17.2.1**

---

## 🚀 Quick Start (Copy-Paste)

```powershell
# Start the 5-node cluster
cd "J:\Portfolio Site\Gdocsdev\MistTracker"
docker-compose up -d

# Check all containers are healthy
docker-compose ps

# Watch startup logs
docker-compose logs -f
```

Press `Ctrl+C` to exit logs.

---

## 📊 Check Status

```powershell
# See all containers
docker-compose ps

# See real-time resource usage
docker stats

# See all logs
docker-compose logs

# See coordinator logs only
docker-compose logs coordinator

# See node-1 logs
docker-compose logs node-1
```

---

## 🛑 Stop Services

```powershell
# Stop all (keep data)
docker-compose stop

# Stop all (delete everything)
docker-compose down

# Stop one container
docker-compose stop node-1
```

---

## 🔧 Common Tasks

```powershell
# Restart everything
docker-compose restart

# Restart just coordinator
docker-compose restart coordinator

# Execute command in coordinator
docker exec -it mist-coordinator npm test

# Get shell access in coordinator
docker exec -it mist-coordinator sh

# View database
docker exec -it mist-database psql -U mist_user -d misttracker
```

---

## 🔌 Access URLs

| Service | URL |
|---------|-----|
| React UI | http://localhost:3000 |
| API Server | http://localhost:5000 |
| Node 1 (H) | http://localhost:5001 |
| Node 2 (He) | http://localhost:5002 |
| Node 3 (Li) | http://localhost:5003 |
| Node 4 (Be) | http://localhost:5004 |
| Node 5 (B) | http://localhost:5005 |
| Database | localhost:5432 |
| Cache | localhost:6379 |

---

## 📋 Daily Workflow

### Morning (Day 1 of Iteration)
```powershell
# Start cluster
docker-compose up -d

# Verify healthy
docker-compose ps

# Watch logs
docker-compose logs -f coordinator
```

### During Work
```powershell
# Monitor resource usage
docker stats

# Check node status
docker-compose logs node-1

# Run tests
npm run test:cluster
```

### Evening (End of Day)
```powershell
# If pausing work:
docker-compose stop

# Or if done for good:
docker-compose down
```

---

## 🚨 Troubleshooting

### Port Already in Use
```powershell
# Find what's using port 5000
netstat -ano | findstr :5000

# Kill it (replace NNNN with PID)
taskkill /PID NNNN /F

# Then try again
docker-compose down
docker-compose up -d
```

### Containers Won't Start
```powershell
# Check logs for errors
docker-compose logs

# Common fix: restart Docker
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```

### Out of Memory
```powershell
# See what's using memory
docker stats

# Option 1: Stop unneeded nodes
docker-compose stop node-4 node-5

# Option 2: Full clean
docker-compose down -v
docker-compose up -d
```

### Can't Connect to Docker
```powershell
# Verify Docker is running
docker --version

# If not, start Docker Desktop
# (Windows Start Menu → Docker Desktop)

# Wait 30 seconds, then try again
docker-compose ps
```

---

## 📈 Performance Monitoring

```powershell
# Real-time stats
docker stats

# See container resource limits
docker inspect mist-coordinator | findstr Memory

# Check disk usage
docker system df

# Clean up unused images
docker image prune -a
```

---

## 💾 Data Management

```powershell
# Backup database
docker exec mist-database pg_dump -U mist_user misttracker > backup.sql

# Restore database
docker exec -i mist-database psql -U mist_user misttracker < backup.sql

# Clear cache
docker exec mist-cache redis-cli FLUSHALL

# Clear all containers + volumes (warning: deletes data!)
docker-compose down -v
```

---

## 🔍 Debugging in Container

```powershell
# Get shell in coordinator
docker exec -it mist-coordinator sh

# Inside container, you can:
cd /app
ls -la
cat server/coordinator.js
npm run test
exit
```

---

## 📝 Logs Help

```powershell
# Follow logs (updates live)
docker-compose logs -f

# Last 100 lines only
docker-compose logs --tail=100

# Stop following (Ctrl+C)

# Logs for specific time window
docker-compose logs --since 2m
```

---

## ✅ Health Check Commands

```powershell
# Check all services
curl http://localhost:5000/health
curl http://localhost:5001/health
curl http://localhost:5002/health
curl http://localhost:5003/health
curl http://localhost:5004/health
curl http://localhost:5005/health

# Check database
docker exec mist-database pg_isready -U mist_user

# Check cache
docker exec mist-cache redis-cli ping
```

---

## 🎯 Phase 17.2.1 Checklist

### Days 1-2 (Preparation)
- [ ] `docker-compose up -d` (start cluster)
- [ ] `docker-compose ps` (verify all healthy)
- [ ] `curl http://localhost:5000/health` (test API)

### Days 3-4 (Cluster Testing)
- [ ] `docker-compose logs -f node-1` (monitor atom training)
- [ ] `docker stats` (check CPU/memory)
- [ ] Test node failure: `docker-compose stop node-1`
- [ ] Verify recovery: `docker-compose start node-1`

### Days 5-6 (Load Testing)
- [ ] `docker stats` (continuous monitoring)
- [ ] Run load tests: `npm run test:load`
- [ ] Check aggregation: `curl http://localhost:5000/api/cluster/milestones`

### Day 7 (Cleanup)
- [ ] `docker-compose down` (stop all)
- [ ] Archive logs if needed
- [ ] Document results

---

## 🆘 Emergency Commands

```powershell
# Kill everything and start fresh
docker-compose down -v
docker system prune -a
docker-compose up -d

# Free up space
docker image prune -a
docker volume prune

# See what's taking space
docker system df

# Full reset (WARNING: deletes everything)
docker system prune -a --volumes
```

---

**Status**: Ready to use  
**Last Updated**: April 19, 2026  
**For detailed info**: See [DOCKER-SETUP-GUIDE.md](DOCKER-SETUP-GUIDE.md)
