# Infrastructure Quickstart: Compute Cluster Orchestration
## Phase 17 Atomic Physics Validation - 20 Node Deployment

**Context**: Phase 17 requires coordinated validation of 20 atoms (H through Ar) on parallel compute nodes, with central aggregation and milestone tracking.

**Deployment Options**:
- Option A: Rented compute infrastructure (AWS, GCP, Azure, etc.)
- Option B: Distributed peer infrastructure (friends' machines or local cluster)
- Option C: Hybrid (some rented, some peer)

---

## QUICK SPECIFICATIONS

### Hardware Requirements Per Node

```
Minimum Configuration (1-2 atoms per node):
├─ CPU:        2-4 cores @ 2.5+ GHz
├─ RAM:        8-16 GB
├─ Storage:    50 GB SSD
├─ Network:    100 Mbps minimum, 1 Gbps ideal
└─ Runtime:    Node.js 18+ or Docker container

Recommended Configuration (1 atom per node):
├─ CPU:        4-8 cores @ 3.0+ GHz
├─ RAM:        16-32 GB
├─ Storage:    100 GB SSD
├─ Network:    1 Gbps
└─ Runtime:    Node.js 18+ with clustering enabled

Phase 17 Full Cluster (20 atoms):
├─ Total CPUs:      80-160 cores
├─ Total RAM:       320-640 GB
├─ Total Storage:   1-2 TB SSD
├─ Network:         Dedicated 10 Gbps backbone ideal
├─ Nodes:           20 compute nodes
├─ Central:         1 orchestrator node
└─ Monitoring:      1 (can collocate on orchestrator)
```

### Software Stack

```
Compute Nodes:
├─ Operating System:    Linux (Ubuntu 22.04+) or Windows Server
├─ Runtime:             Node.js 18.x LTS
├─ Container (optional):Docker 20.10+
├─ Simulation Core:     MistCore.js, MistSolution.js
├─ Proxy Generator:     Fast proxy code (compiled)
└─ Monitoring Agent:    Node telemetry reporter

Central Orchestrator:
├─ Coordination:        Node.js cluster manager
├─ Milestone DB:        MySQL 8.0+ or PostgreSQL 14+
├─ Dashboard:           React web UI (client)
├─ Message Queue:       Redis 6.0+ (for job coordination)
└─ Metrics Collection:  Prometheus + Grafana (optional)

CI/CD (for updates):
├─ Version Control:     Git
├─ Deployment:          GitHub Actions or custom scripts
└─ Rollback:            Containerized deployment
```

---

## DEPLOYMENT OPTION A: RENTED COMPUTE

### Estimated Monthly Cost (Phase 17, 8 weeks)

```
AWS EC2 (as example):
├─ 20 × c5.2xlarge (8vCPU, 16GB RAM)        ~$3,000/month
├─ 1 × c5.4xlarge (16vCPU, 32GB RAM)        ~$800/month (orchestrator)
├─ 1 TB SSD storage                         ~$100/month
├─ Data transfer (simulation outputs)       ~$200/month (estimated)
├─ Load balancer + monitoring               ~$300/month
└─ SUBTOTAL for 8 weeks (2 months)          ~$4,800

Google Cloud Platform:
├─ 20 × n2-standard-8 (8vCPU, 32GB RAM)    ~$2,800/month
├─ 1 × n2-standard-16 (16vCPU, 64GB RAM)   ~$750/month
├─ Storage and networking                  ~$400/month
└─ SUBTOTAL for 8 weeks                    ~$4,100

Microsoft Azure:
├─ 20 × Standard_D4s_v3 (4vCPU, 16GB RAM)  ~$2,400/month
├─ 1 × Standard_D8s_v3 (8vCPU, 32GB RAM)   ~$600/month
├─ Storage and networking                  ~$400/month
└─ SUBTOTAL for 8 weeks                    ~$3,800

⚠️ COST OPTIMIZATION:
├─ Use spot/preemptible instances: -40% to -70% cost
├─ Consolidate during setup/testing phases
├─ Scale down non-execution periods
└─ OPTIMIZED COST: ~$1,500-2,000 for 8 weeks
```

### Deployment Steps (AWS Example)

```
STEP 1: Infrastructure Setup (2 hours)
├─ Create VPC with 10.0.0.0/16 network
├─ Deploy 20 compute nodes (t3.xlarge or c5.2xlarge)
├─ Deploy 1 orchestrator node (c5.4xlarge)
├─ Configure security groups:
│  ├─ Nodes can communicate bidirectional on port 5000
│  ├─ Orchestrator accessible on port 8080
│  ├─ Database port 3306 (internal only)
│  └─ Redis port 6379 (internal only)
└─ Allocate 2 GB EBS volumes per compute node

STEP 2: Database Setup (30 minutes)
├─ Deploy RDS MySQL 8.0 instance
├─ Create databases:
│  ├─ mist_tracker (milestones, proxies)
│  ├─ mist_atomic (atomic physics results)
│  └─ mist_infrastructure (node status, telemetry)
├─ Initialize schema from database-schema.sql
└─ Create backups every 4 hours

STEP 3: Deploy Redis Cache (15 minutes)
├─ ElastiCache Redis 6.0+ cluster
├─ Configure for job queue
├─ Enable automatic failover
└─ Set retention: 7 days

STEP 4: Deploy Orchestrator (1 hour)
├─ SSH into orchestrator node
├─ Install Node.js 18, npm, git
├─ Clone repository:
│  $ git clone <repo> /opt/misttracker
│  $ cd /opt/misttracker
├─ Install dependencies:
│  $ npm install
├─ Create .env file:
│  DB_HOST=mist-tracker-db.xxx.rds.amazonaws.com
│  DB_USER=admin
│  DB_PASSWORD=<generated>
│  REDIS_URL=redis://mist-redis.xxx.ng.0001.use1.cache.amazonaws.com:6379
│  NODE_ENV=production
│  CLUSTER_SIZE=20
├─ Start orchestrator:
│  $ npm run orchestrator
└─ Verify dashboard at http://<orchestrator-ip>:8080

STEP 5: Deploy Compute Nodes (2 hours)
├─ Create AMI from template node with:
│  ├─ Node.js 18 preinstalled
│  ├─ Repository cloned
│  ├─ Dependencies cached
│  └─ Agent startup script
├─ Deploy 20 instances from AMI
├─ Each node startup runs:
│  ├─ Fetch latest code from repo
│  ├─ Register with orchestrator (send node ID)
│  ├─ Connect to Redis job queue
│  └─ Wait for assignments
├─ Orchestrator detects all 20 nodes joining
└─ Verify all nodes READY in dashboard

STEP 6: Start Phase 17 Execution (30 minutes)
├─ Orchestrator assigns 20 atoms:
│  ├─ Node 1: H (hydrogen)
│  ├─ Node 2: He (helium)
│  ├─ Node 3: Li (lithium)
│  └─ ... through Node 20: Ar (argon)
├─ Each node:
│  ├─ Starts simulation for assigned atom
│  ├─ Reports progress every 60 seconds
│  ├─ Generates proxies when converged
│  └─ Reports completion with metrics
├─ Orchestrator aggregates:
│  ├─ Milestone updates
│  ├─ Progress visualization
│  ├─ Error detection
│  └─ Real-time dashboard
└─ Execution continues 24/7 until completion (4-6 weeks)

STEP 7: Monitoring (Ongoing)
├─ Dashboard shows:
│  ├─ Per-node progress (%)
│  ├─ Convergence curves
│  ├─ Error rates
│  ├─ Resource utilization
│  └─ Milestone completion timeline
├─ Alerts:
│  ├─ Node failure detection
│  ├─ Database connection loss
│  ├─ Convergence timeout (>24h)
│  └─ Low disk space
├─ Manual interventions (if needed):
│  ├─ Stop simulation and restart node
│  ├─ Adjust parameters
│  ├─ Force re-compute of failed atom
│  └─ Extract intermediate results
└─ Daily summary reports emailed

STEP 8: Phase 17 Completion (Week 8)
├─ All 20 atoms reach VALIDATION_PASSED
├─ Extract final data:
│  ├─ Convergence trajectories
│  ├─ Final model parameters
│  ├─ Proxy accuracy metrics
│  └─ Milestone history (full audit trail)
├─ Generate Phase 17 completion report
├─ Export database for archival
├─ Keep infrastructure running (if planning Phase 18)
│  ├─ All data in database
│  ├─ All proxies generated and cached
│  └─ Ready for Phase 18 to inherit
└─ Deallocate (if not continuing):
   ├─ Backup final database to S3
   ├─ Terminate all nodes
   ├─ Clean up VPC, security groups
   └─ Final cost: ~$2,000-4,000 for 8 weeks
```

---

## DEPLOYMENT OPTION B: DISTRIBUTED PEER INFRASTRUCTURE

### For Friends/Local Cluster Approach

```
SCENARIO: You have 20 friends/colleagues with suitable machines
├─ Each brings own machine (desktop/laptop with specs above)
├─ Connect to shared network (or VPN for remote)
├─ Central coordinator runs Phase 17
└─ All peer nodes join dynamically

REQUIREMENTS:
├─ Central Coordinator Machine:
│  ├─ Dedicated IP on network (or static DNS)
│  ├─ Publicly accessible (if remote friends, use VPN/tunnel)
│  ├─ 16+ GB RAM (for database + orchestrator)
│  ├─ 100 GB SSD for database and results
│  └─ Running 24/7 for 4-8 weeks
│
└─ Per Peer Machine (×20):
   ├─ Windows 10+, macOS 10.15+, or Linux
   ├─ Node.js 18+ installed
   ├─ 8+ GB RAM available
   ├─ 50+ GB disk space
   ├─ Stable internet connection
   └─ Can run for hours at a time

NETWORK:
├─ Option 1: Local Network
│  ├─ All machines on same LAN or VPN
│  ├─ Orchestrator has IP on network
│  └─ Peers connect via orchestrator IP + port 5000
│
├─ Option 2: Remote (Friends Worldwide)
│  ├─ Use Tailscale, Wireguard, or commercial VPN
│  ├─ Orchestrator tunnels through VPN
│  ├─ All peers connect through VPN tunnel
│  └─ Adds ~50-100ms latency (acceptable for this workload)
│
└─ Option 3: Hybrid
   ├─ Local LAN for fast communication
   ├─ VPN for remote peers
   └─ Orchestrator bridges both networks
```

### Peer Infrastructure Setup

```
STEP 1: Prepare Central Coordinator (Your Machine)
├─ Hardware: Desktop/laptop with specs:
│  ├─ CPU: 8+ cores
│  ├─ RAM: 32+ GB
│  ├─ Storage: 100 GB SSD
│  └─ Network: Stable internet (can be home or office)
│
├─ Software:
│  ├─ Node.js 18 LTS
│  ├─ MySQL 8.0 (or PostgreSQL)
│  ├─ Redis 6.0+
│  ├─ Git
│  └─ Docker (optional, for isolation)
│
├─ Setup MySQL:
│  $ npm install -g mysql@latest
│  $ mysql -u root -p
│  mysql> CREATE DATABASE mist_tracker;
│  mysql> SOURCE database-schema.sql;
│  mysql> CREATE USER 'misttracker'@'%' IDENTIFIED BY '<password>';
│  mysql> GRANT ALL ON mist_tracker.* TO 'misttracker'@'%';
│
├─ Setup Redis:
│  $ redis-server --bind 0.0.0.0 --port 6379 --daemonize yes
│
├─ Clone repository:
│  $ git clone <repo> ~/misttracker-coordinator
│  $ cd ~/misttracker-coordinator
│  $ npm install
│
├─ Create .env file:
│  DB_HOST=localhost
│  DB_USER=misttracker
│  DB_PASSWORD=<password>
│  REDIS_URL=redis://localhost:6379
│  NODE_ENV=production
│  CLUSTER_SIZE=20
│  COORDINATOR_IP=<your-public-ip>
│  COORDINATOR_PORT=5000
│
├─ Firewall Configuration:
│  $ sudo ufw allow 5000/tcp    # Peer connections
│  $ sudo ufw allow 8080/tcp    # Dashboard
│  $ sudo ufw allow 3306/tcp    # DB (optional if peers need direct access)
│
└─ Start Coordinator:
   $ npm run orchestrator:peer
   [Orchestrator listening on 0.0.0.0:5000]
   [Dashboard at http://<ip>:8080]
```

```
STEP 2: Prepare Peer Setup Script (Send to Friends)
├─ Create PEER_SETUP.sh (Linux/macOS) or PEER_SETUP.ps1 (Windows)
│
├─ Linux/macOS Script:
│  #!/bin/bash
│  set -e
│  
│  echo "=== MistTracker Phase 17 Peer Setup ==="
│  echo ""
│  read -p "Coordinator IP (e.g., 192.168.1.10): " COORD_IP
│  read -p "Coordinator port (default 5000): " COORD_PORT
│  COORD_PORT=${COORD_PORT:-5000}
│  
│  echo "Installing Node.js..."
│  curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
│  sudo apt-get install -y nodejs
│  
│  echo "Cloning repository..."
│  cd ~
│  git clone <repo> misttracker-peer
│  cd misttracker-peer
│  npm install
│  
│  echo "Creating peer configuration..."
│  cat > .env.peer << EOF
│  COORDINATOR_IP=$COORD_IP
│  COORDINATOR_PORT=$COORD_PORT
│  NODE_ENV=peer
│  PEER_ID=$(hostname)-$(uuidgen | cut -c1-8)
│  EOF
│  
│  echo "Starting peer node..."
│  npm run peer:start
│  
│  # Outputs:
│  # [Peer] Registering with coordinator at 192.168.1.10:5000
│  # [Peer] Connected! Waiting for assignments...
│
├─ Windows PowerShell Script:
│  # Equivalent steps for Windows
│  # Installs Node.js via chocolatey or direct download
│  # Creates batch file for auto-startup
│
└─ Send script + coordinator IP/port to all 20 peers
```

```
STEP 3: Peers Join Cluster
├─ Each peer runs setup script:
│  $ bash PEER_SETUP.sh
│  > Coordinator IP? 203.0.113.45
│  > Starting peer...
│
├─ Peer automatically:
│  ├─ Generates unique ID
│  ├─ Connects to coordinator
│  ├─ Registers itself
│  ├─ Reports hardware specs
│  └─ Waits for job assignments
│
├─ Coordinator logs:
│  [Peer-001] Connected from peer-macbook-air
│  [Peer-002] Connected from peer-desktop-ubuntu
│  [Peer-003] Connected from peer-laptop-windows
│  ... (up to 20 peers)
│
└─ Dashboard shows:
   ┌─ PEER STATUS ─────────────┐
   │ ✓ 20 peers READY          │
   │ ✓ Total: 160 CPU cores    │
   │ ✓ Total: 320 GB RAM       │
   │ ✓ Network: 1 Gbps avg     │
   └───────────────────────────┘
```

```
STEP 4: Start Phase 17 Execution
├─ Coordinator assigns atoms:
│  Peer-001: Hydrogen (H)
│  Peer-002: Helium (He)
│  ... (1 atom per peer)
│
├─ Each peer:
│  ├─ Receives atom assignment
│  ├─ Starts simulation
│  ├─ Reports progress every 60s
│  └─ Generates proxy when converged
│
├─ Coordinator aggregates and dashboards
│
└─ Monitor at http://coordinator-ip:8080
```

### Peer Infrastructure Advantages/Challenges

```
ADVANTAGES:
✓ Cost: $0 (or cost of coordinating infrastructure only)
✓ Distributed: Fault tolerance (1 peer down ≠ total failure)
✓ Community: Collaborative science experience
✓ Learning: Direct involvement in phase execution
└─ Result credibility: "Peer-reviewed by 20 people"

CHALLENGES:
✗ Network: Peers may have inconsistent connectivity
✗ Heterogeneity: Different hardware → different performance
✗ Availability: Peers may turn off machines or leave
✗ Troubleshooting: Harder to debug remote peer issues
└─ Coordination: Requires active management of peer status

MITIGATION:
├─ Redundancy: Always have 24-28 peers (20% extra)
├─ Checkpointing: Save intermediate results frequently
├─ Rollback: Can restart failed atom on another peer
├─ Communication: Regular updates from coordinator
│  ├─ Daily status emails
│  ├─ Progress dashboards
│  └─ Issue notifications
└─ Incentives: Recognition in paper authorship
```

---

## DEPLOYMENT OPTION C: HYBRID (RENTED + PEER)

### For Risk Mitigation

```
CONFIGURATION:
├─ 10 rented compute nodes (AWS/GCP/Azure)
├─ 10 peer-contributed nodes (friends' machines)
├─ 1 central orchestrator (rented or dedicated)
└─ Shared database (rented RDS or on-premise)

ALLOCATION:
├─ Rented nodes: Fast atoms (H, He, Li)
│  └─ Convergence priority: guarantee completion
│
└─ Peer nodes: Slower atoms (C, N, O, Ne...)
   └─ May benefit from extra time, acceptable

COST:
├─ 10 rented nodes: ~$1,500 for 8 weeks
├─ Orchestrator + DB: ~$500 for 8 weeks
├─ Peer nodes: $0
└─ TOTAL: ~$2,000

ADVANTAGES:
✓ Lower cost than full rented
✓ Faster than full peer (rented nodes are reliable)
✓ Community engagement (peers contribute)
└─ Fallback: Can migrate peer jobs to rented if needed

RISK MITIGATION:
├─ If peer disconnects:
│  ├─ Coordinator reassigns job to rented node
│  ├─ No loss of progress (checkpoints saved)
│  └─ Execution continues seamlessly
│
└─ If rented capacity insufficient:
   ├─ Leverage additional peer nodes
   ├─ Scale horizontally without cost spike
   └─ Extends timeline but reduces cost
```

---

## SERVER-ONLY DEPLOYMENT

For minimal infrastructure (no web dashboard during execution):

```
CONFIGURATION:
├─ 1 orchestrator/server node
├─ 20 compute nodes (headless, no UI)
├─ MySQL database
└─ Redis cache
└─ CLI-based monitoring (no web dashboard)

HARDWARE:
├─ Orchestrator: 8 cores, 16 GB RAM
├─ Each compute node: 4-8 cores, 8-16 GB RAM
└─ Total: Same as standard

SOFTWARE DIFFERENCES:
├─ No React client UI
├─ Server responds to HTTP queries only
├─ CLI tool for status checks:
│  $ mistcli status --all
│  $ mistcli milestone --atom H --phase 17
│  $ mistcli dashboard --json > status.json
│
├─ Logs saved to files:
│  /var/log/misttracker/orchestrator.log
│  /var/log/misttracker/node-001.log
│  /var/log/misttracker/node-002.log
│  ...
│
└─ Monitoring via log aggregation:
   $ tail -f /var/log/misttracker/orchestrator.log | grep "milestone"

DEPLOYMENT:
├─ All same steps as above
├─ But skip React client build:
│  $ npm install --only=production (no dev dependencies)
│  $ npm run server:headless
│
└─ Server runs on port 3000 (HTTP API only)

ADVANTAGES:
✓ Lower resource requirements (no UI rendering)
✓ Faster startup
✓ Ideal for pure compute deployment
└─ Smaller Docker images

DISADVANTAGES:
✗ Harder to visualize progress
✗ Requires terminal access to check status
└─ Less intuitive for non-technical stakeholders

WHEN TO USE:
├─ You have remote access to servers
├─ You're comfortable with CLI/logs
└─ You want minimal resource overhead
```

---

## FULL DEPLOYMENT

With web dashboard, monitoring, alerting:

```
CONFIGURATION:
├─ 1 orchestrator node (runs server + dashboard)
├─ 20 compute nodes (simulation workers)
├─ 1 database server (MySQL)
├─ 1 cache server (Redis)
├─ 1 monitoring server (Prometheus + Grafana)
├─ Web dashboard (React client)
└─ CLI tools for management

HARDWARE:
├─ Orchestrator: 16 cores, 32 GB RAM, 100 GB SSD
├─ Each compute node: 4-8 cores, 8-16 GB RAM
├─ Database: 8 cores, 32 GB RAM, 200 GB SSD
├─ Monitoring: 4 cores, 8 GB RAM, 50 GB SSD
└─ Total: More than server-only (but still manageable)

SOFTWARE STACK:
├─ Server:
│  ├─ Express.js (orchestration API)
│  ├─ MySQL (milestones + results)
│  ├─ Redis (job queue)
│  └─ WebSocket (real-time updates)
│
├─ Client:
│  ├─ React 18
│  ├─ Plotly/Chart.js (progress visualizations)
│  ├─ Real-time milestone updates
│  └─ Cluster status dashboard
│
├─ Monitoring:
│  ├─ Prometheus (metrics collection)
│  ├─ Grafana (visualization)
│  ├─ Alertmanager (notifications)
│  └─ Custom dashboards
│
└─ Observability:
   ├─ Structured JSON logging
   ├─ Distributed tracing (optional)
   └─ Performance metrics per node

DEPLOYMENT:
├─ All infrastructure setup steps
├─ Build React client:
│  $ cd client && npm run build
│  $ npm run server (which serves both API + UI)
│
├─ Navigate to http://orchestrator:8080
├─ Real-time dashboard shows:
│  ├─ 20 atom progress bars
│  ├─ Convergence curves
│  ├─ Error rate trends
│  ├─ Resource utilization (CPU, RAM, Network)
│  ├─ Node status (up/down)
│  ├─ Milestone timeline
│  └─ Projected completion time
│
└─ Alerts:
   ├─ Email notifications on failures
   ├─ Slack integration for teams
   └─ PagerDuty for incident response

ADVANTAGES:
✓ Full visibility into execution
✓ Easy troubleshooting with visualizations
✓ Accessible to non-technical stakeholders
✓ Impressive demo/presentation capability
└─ Historical data for analysis

DISADVANTAGES:
✗ More resource overhead
✗ More complex to deploy/maintain
└─ More moving parts (more failure points)

WHEN TO USE:
├─ You have sufficient resources
├─ You want executive visibility
├─ You're sharing progress with team/community
└─ You plan future phases (18+)
```

---

## ORCHESTRATION WORKFLOW

### How Compute Cluster Operates

```
PHASE: SETUP (Week 1)
├─ Deploy infrastructure
├─ Verify all 20 nodes READY
├─ Test job submission
└─ Confirm database connectivity

PHASE: EXECUTION (Weeks 2-6)
├─ Orchestrator assigns 20 atoms (1 per node)
├─ Each node independently:
│  ├─ Runs simulation for assigned atom
│  ├─ Converges model iteratively
│  ├─ Reports progress every 60 seconds:
│  │  {
│  │    "atom": "H",
│  │    "iteration": 450,
│  │    "residualError": 0.0234,
│  │    "convergence": "IN_PROGRESS",
│  │    "estimatedTimeRemaining": "2h 15m"
│  │  }
│  ├─ Optimizes parameters adaptively
│  ├─ Tests convergence criteria every iteration
│  └─ When converged:
│     ├─ Generates proxy model
│     ├─ Reports CONVERGED milestone
│     ├─ Saves results to database
│     └─ Waits for next assignment (idle)
│
├─ Orchestrator aggregates:
│  ├─ Per-node progress
│  ├─ Cluster utilization
│  ├─ Detected anomalies
│  ├─ Database consistency checks
│  └─ Dashboard updates (real-time)
│
├─ Database logs all milestones:
│  ├─ Every 60s: PROGRESS_UPDATED
│  ├─ Every convergence test: CONVERGENCE_TEST
│  ├─ When converged: VALIDATION_PASSED
│  └─ Audit trail: immutable ledger
│
└─ Monitoring detects issues:
   ├─ Convergence timeout (>24h) → alert
   ├─ Node offline (>5min) → investigate
   ├─ Database connection lost → restart
   └─ High error rate (>5%) → escalate

PHASE: REFINEMENT (Week 7)
├─ Any failed atoms (didn't converge):
│  ├─ Analyze convergence curves
│  ├─ Identify issue (model? parameters? scale?)
│  ├─ Adjust model/parameters
│  ├─ Re-run on new node (or spare capacity)
│  └─ Log refinement attempts
│
├─ Completed atoms:
│  ├─ Validate proxy accuracy
│  ├─ Cross-check with literature
│  ├─ Verify uncertainty estimates
│  └─ Document results
│
└─ Expected: All 20 atoms → VALIDATION_PASSED

PHASE: HANDOFF (Week 8)
├─ Data extraction:
│  ├─ Final model parameters (all 20 atoms)
│  ├─ Convergence trajectories
│  ├─ Proxy models + accuracy metrics
│  ├─ Full milestone audit trail
│  └─ Error analysis report
│
├─ Database export:
│  $ mysqldump --all-databases > phase17_complete.sql
│  $ tar -cz phase17_data/ > phase17_archive.tar.gz
│
├─ Phase 18 preparation:
│  ├─ Load Phase 17 results
│  ├─ Validate proxy fidelity
│  ├─ Initialize subatomic milestone types
│  ├─ Design quark model tests
│  └─ Prepare Phase 18 execution plan
│
├─ Archive and document:
│  ├─ Phase 17 completion report
│  ├─ Lessons learned
│  ├─ Resource utilization analysis
│  ├─ Cost breakdown (if rented)
│  └─ Recommendations for Phase 18
│
└─ Cluster options:
   ├─ Keep running (for Phase 18)
   ├─ Pause (snapshot state, reduce costs)
   └─ Terminate (archive data, full shutdown)
```

---

## RECOMMENDED CONFIGURATION BY SCENARIO

### Scenario 1: Budget-Conscious (Peer Infrastructure)

```
Setup Time: 1-2 weeks (recruiting, testing)
Execution: 6-8 weeks (flexible, no time pressure)
Cost: $0-500 (coordinator hardware only)
Risk: Medium (peer availability uncertainty)

Infrastructure:
├─ Your machine: Coordinator + Database
├─ Friends' machines: 20 compute nodes
└─ VPN: Tailscale or WireGuard

Pros:
✓ Minimal cost
✓ Community engagement
✓ Learning opportunity

Cons:
✗ Longer setup time
✗ Peer dependency
└─ Requires active management
```

### Scenario 2: Fast Track (Full Rented)

```
Setup Time: 2-4 hours (infrastructure as code)
Execution: 4-6 weeks (guaranteed resources)
Cost: $2,000-4,000
Risk: Low (SLA backed)

Infrastructure:
├─ AWS/GCP/Azure (20 nodes + orchestrator)
└─ RDS/CloudSQL (managed database)

Pros:
✓ Fast deployment
✓ Guaranteed resources
✓ Professional monitoring
✓ Built-in redundancy

Cons:
✗ Significant cost
└─ Less community engagement
```

### Scenario 3: Balanced (Hybrid)

```
Setup Time: 1 week
Execution: 5-7 weeks
Cost: $1,000-2,000
Risk: Low-Medium (hybrid redundancy)

Infrastructure:
├─ 10 rented nodes (critical atoms)
├─ 10 peer nodes (flexible atoms)
└─ Shared orchestrator (could be rented or on-premise)

Pros:
✓ Lower cost than full rented
✓ Community participation
✓ Professional backup (rented nodes)
└─ Flexibility

Cons:
✗ More complex setup
└─ Requires managing two systems
```

### Scenario 4: Maximum Visibility (Full Deployment + Monitoring)

```
Setup Time: 3-5 days
Execution: 4-8 weeks
Cost: $2,500-5,000 (if rented)
Risk: Low (full observability)

Infrastructure:
├─ 20 compute nodes
├─ Orchestrator
├─ Database
├─ Redis cache
├─ Prometheus + Grafana monitoring
├─ React dashboard
└─ Alerting/notification system

Pros:
✓ Complete visibility
✓ Impressive dashboards
✓ Easy troubleshooting
✓ Stakeholder-friendly

Cons:
✗ Highest cost
✗ More infrastructure to maintain
└─ Complexity overhead
```

---

## QUICK DECISION MATRIX

```
┌─────────────────────────────────────────────────────────────┐
│ Choose Your Configuration:                                  │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Cost Most Important?                                       │
│  ├─ YES → Peer Infrastructure (Option B)                   │
│  └─ NO → Continue...                                       │
│                                                             │
│  Speed Most Important?                                      │
│  ├─ YES → Full Rented (Option A)                           │
│  └─ NO → Continue...                                       │
│                                                             │
│  Community Involvement Important?                           │
│  ├─ YES → Hybrid (Option C) or Peer (Option B)            │
│  └─ NO → Rented (Option A)                                │
│                                                             │
│  Executive Visibility Important?                            │
│  ├─ YES → Full Deployment (with dashboard)                │
│  └─ NO → Server-Only Deployment                           │
│                                                             │
│  Planning Future Phases (18+)?                              │
│  ├─ YES → Rented infrastructure (more stable)             │
│  └─ NO → Any option works                                 │
│                                                             │
└─────────────────────────────────────────────────────────────┘

RECOMMENDED FOR PHASE 17:
  • Budget: $1,500-2,000 (hybrid or peer with rented backup)
  • Timeline: 4-8 weeks
  • Setup: 1-2 weeks
  • Deployment: Full (with dashboard for stakeholder engagement)
  • Risk tolerance: Medium (pair peer with rented redundancy)
```

---

## MONITORING & ALERTING

### Key Metrics to Track

```
Per-Node Metrics:
├─ CPU Utilization: Target 60-80%
├─ Memory Usage: Target 50-70%
├─ Disk Space: Alert if <10% free
├─ Network Latency: Alert if >500ms
├─ Convergence Rate: Track per atom
├─ Residual Error: Should decrease monotonically
├─ Proxy Generation Time: Track (should be <1h)
└─ Uptime: Target 99.5%+ during execution

Cluster-Level Metrics:
├─ Total Throughput: Atoms/day
├─ Successful Validations: Count + %
├─ Failed Atoms: Count + troubleshooting
├─ Database Query Performance: p95 latency
├─ Message Queue Depth: Alert if growing
├─ Milestone Aggregation Latency: <5s target
└─ Overall Progress: % complete

Alerts (Automatic):
├─ Node Down: Alert after 5 min offline
├─ Convergence Stalled: Alert after 12h no progress
├─ High Error Rate: Alert if >5% of atoms failing
├─ Database Disconnect: Immediate alert
├─ Low Disk Space: Alert when <20% free
├─ High CPU/Memory: Alert if >90% for >30 min
└─ Network Timeout: Alert after 3 failed pings

Escalation:
├─ Minor (log): High CPU, slow query
├─ Medium (notify): Node down, convergence stalled
├─ Critical (page): Database down, 5+ nodes down
└─ Severe (escalate): >50% of cluster down
```

### Example Grafana Dashboards

```
DASHBOARD 1: Cluster Overview
├─ Stat: Nodes Online (20/20)
├─ Stat: Atoms Converged (15/20)
├─ Gauge: Average Convergence Progress (73%)
├─ Line Chart: Convergence Rate Over Time
├─ Line Chart: CPU Utilization (All Nodes)
└─ Heatmap: Per-Node Resource Utilization

DASHBOARD 2: Per-Atom Progress
├─ 20 progress bars (one per atom)
├─ Status: Color-coded (Running, Converged, Failed)
├─ Time Elapsed: For each atom
├─ Estimated Time Remaining: For each atom
├─ Residual Error Curve: For each atom
└─ Proxy Accuracy: For each converged atom

DASHBOARD 3: Milestone Timeline
├─ Gantt chart: 12 milestone types
├─ Timeline: All 20 atoms
├─ Status indicator: Completed vs pending
├─ Historical: Previous atoms (reference)
└─ Projected: Expected completion

DASHBOARD 4: Error Analysis
├─ Failed atoms: List + reason
├─ Convergence issues: Trends
├─ Parameter sensitivity: Which changed?
├─ Proxy accuracy distribution: Histogram
└─ Outliers: Atoms with unusual patterns
```

---

## TROUBLESHOOTING GUIDE

### Common Issues

```
ISSUE: Node Offline
├─ Check: Ping node, SSH connectivity
├─ Restart: npm run peer:start
├─ If persistent: Check logs for errors
│  $ tail -n 100 ~/.pm2/logs/misttracker.log
└─ Resolution: Restart node or migrate job

ISSUE: Convergence Stalled (>24h)
├─ Analyze: Convergence curve (should trend down)
├─ Check: Residual error (should be decreasing)
├─ If stuck: Try parameter adjustment
│  $ mistcli param-adjust --atom X --param Y --factor 1.5
├─ If repeated: May need new theory/model
└─ Resolution: Document and move to Phase 18

ISSUE: Proxy Accuracy Low (<90%)
├─ Verify: Convergence complete?
├─ Check: Model validation passed?
├─ Evaluate: Proxy configuration
│  $ mistcli proxy-info --atom X
├─ Consider: Different proxy type
└─ Resolution: Regenerate or use alternate

ISSUE: Database Connection Lost
├─ Check: MySQL service running
│  $ systemctl status mysql
├─ Verify: Network connectivity
│  $ ping db-host
├─ Restart: MySQL and retry
├─ If persistent: Database corruption?
└─ Resolution: Restore from backup (hourly)

ISSUE: Out of Disk Space
├─ Check: Disk usage
│  $ df -h
├─ Identify: Large directories
│  $ du -sh /* | sort -h
├─ Clean: Old simulation outputs
│  $ rm -rf /var/misttracker/old_runs/*
├─ Expand: Add more SSD if needed
└─ Resolution: Monitor and auto-cleanup

ISSUE: High Network Latency
├─ Check: Network stats
│  $ iftop -n
├─ Identify: Bottleneck node
├─ Optimize: Network settings
│  $ sysctl -w net.core.rmem_max=134217728
├─ Consider: Network redesign (if endemic)
└─ Resolution: May affect timeline but acceptable

ISSUE: Milestone Not Recorded
├─ Check: Database connectivity
├─ Verify: Milestone schema correct
│  $ mistcli schema-check
├─ Resync: Force milestone re-record
│  $ mistcli resync --atom X
├─ Inspect: Database logs for errors
└─ Resolution: Manual entry (rare) or investigate
```

---

## COST ESTIMATION SUMMARY

```
OPTION A: Full Rented Compute
├─ Infrastructure: $3,000-4,000 for 8 weeks
└─ Total: ~$4,000

OPTION B: Peer Infrastructure
├─ Your coordinator hardware: ~$500-1,000 one-time
├─ Operational cost: ~$200 (VPN, internet)
└─ Total: ~$200-300 for Phase 17

OPTION C: Hybrid (10 rented + 10 peer)
├─ Infrastructure: $1,500 for 8 weeks
├─ Coordinator: Included in rented
└─ Total: ~$1,500-2,000

OPTION D: Full Deployment (Dashboard + Monitoring)
├─ Add $200-500 for monitoring infrastructure
└─ Total: +$200-500 to any option above

RECOMMENDATION FOR PHASE 17:
├─ Budget: $2,000 for hybrid (rented + peer)
├─ Or: $300 for peer-only (if community-focused)
├─ Or: $4,000 for full rented (if timeline critical)
└─ Expected ROI: Phase 25+ unlocked → unified physics
```

---

## NEXT STEPS

### To Get Started

```
IMMEDIATE ACTIONS:

1. Decide Configuration (5 min)
   $ Review decision matrix above
   $ Choose: Rented vs Peer vs Hybrid
   $ Document: Cost vs speed vs risk trade-off

2. Prepare Infrastructure (1-2 weeks)
   ├─ If rented:
   │  ├─ Set up AWS/GCP/Azure account
   │  ├─ Configure VPC, security groups
   │  ├─ Pre-approve budget ($2,000-4,000)
   │  └─ Test deployment scripts
   │
   └─ If peer/hybrid:
      ├─ Recruit 10-20 peers (email + personal outreach)
      ├─ Send setup instructions
      ├─ Test VPN connectivity (if remote)
      └─ Do dry run (small simulation on 5 peers)

3. Build Infrastructure (2-4 hours setup day)
   ├─ Deploy orchestrator
   ├─ Deploy/connect compute nodes
   ├─ Verify all nodes READY
   └─ Run smoke test (single atom on each node)

4. Start Phase 17 (Week 1)
   ├─ Assign 20 atoms (1 per node)
   ├─ Start simulations
   ├─ Monitor dashboard
   └─ Let it run (4-8 weeks)

5. Monitor & Support (Ongoing)
   ├─ Daily status checks
   ├─ Handle issues as they arise
   ├─ Communicate progress to stakeholders
   └─ Prepare Phase 18 while Phase 17 executes

6. Analyze & Handoff (Week 8)
   ├─ Extract data
   ├─ Generate completion report
   ├─ Document lessons learned
   └─ Prepare Phase 18 briefing
```

---

## REFERENCE DOCUMENTS

**For Configuration Details**: See [PHASE-17-LAUNCH-ATOMIC-TO-COSMOS.md](PHASE-17-LAUNCH-ATOMIC-TO-COSMOS.md)

**For Milestone Specifications**: See [ATOMIC-PHYSICS-DOMAIN-ALIGNMENT.md](ATOMIC-PHYSICS-DOMAIN-ALIGNMENT.md)

**For Database Schema**: See [DOMAIN-PROGRESSION-ROADMAP.md](DOMAIN-PROGRESSION-ROADMAP.md)

**For Strategic Context**: See [COMPLETE-STRATEGIC-VISION.md](COMPLETE-STRATEGIC-VISION.md)

---

**Ready to orchestrate compute cluster for Phase 17?**  
Choose your configuration above and proceed with infrastructure setup.  
Questions? Review PHASE-17-LAUNCH-ATOMIC-TO-COSMOS.md for detailed context.
