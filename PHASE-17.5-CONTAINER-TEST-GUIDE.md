# Phase 17.5 Container Test Infrastructure - Complete Setup Guide

## Overview

This document describes the **Path B baseline infrastructure testing** approach for Phase 17.5 MistTracker integration. The setup creates a containerized test environment with two Devuan 6.1.1 nodes running OpenSSH for distributed atomic domain validation.

**Scope:** Standard OpenSSH + Phase 17.5 validator execution via SSH, Phase 17.5 integration baseline testing.
**Excluded:** Phase 60 Enigma framework (scheduled for Phase 17.6)

## Architecture

```
┌─────────────────────────────────────────────┐
│     Host Machine (Windows/Linux/macOS)      │
│                                             │
│  SSH Client + Test Orchestration Scripts    │
└────────┬─────────────────────┬──────────────┘
         │                     │
    [SSH Port 2201]       [SSH Port 2202]
         │                     │
┌────────▼─────────┐  ┌────────▼─────────┐
│ phase17-node-1   │  │ phase17-node-2   │
│ (Devuan 6.1.1)   │  │ (Devuan 6.1.1)   │
│                  │  │                  │
│ - SSHD Daemon    │  │ - SSHD Daemon    │
│ - Phase 17.5     │  │ - Phase 17.5     │
│ - Validator.sh   │  │ - Validator.sh   │
└──────────────────┘  └──────────────────┘
         │                     │
         └─────────────────────┘
         Results → host-mounted volume
```

## Prerequisites

### System Requirements
- **Docker Desktop** (Windows/macOS) or Docker Engine (Linux)
- **Docker Compose** v1.29+
- **OpenSSH Client** (for SSH connectivity testing)
- **Bash** (for test scripts; WSL on Windows)
- **Minimum 4GB free RAM** for two containers
- **Minimum 2GB disk space** for images and volumes

### Software Installation

#### On Windows (WSL2 + Docker Desktop)
```powershell
# 1. Install Docker Desktop for Windows
# https://www.docker.com/products/docker-desktop

# 2. Enable WSL2 backend in Docker Desktop settings

# 3. Install OpenSSH Client (if not present)
# Settings > Apps > Optional features > Add OpenSSH Client

# 4. Verify in PowerShell
docker --version
docker-compose --version
ssh -V
```

#### On macOS
```bash
# 1. Install Docker Desktop
# https://www.docker.com/products/docker-desktop

# 2. Verify installation
docker --version
docker-compose --version
```

#### On Linux (Ubuntu/Debian)
```bash
# 1. Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# 2. Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/download/v2.20.0/docker-compose-$(uname -s)-$(uname -m)" \
    -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# 3. Verify
docker --version
docker-compose --version
```

## Setup Steps

### Step 1: Run SSH Configuration Setup

This creates SSH keys and container access configuration:

```powershell
# Windows PowerShell
.\setup-test-environment.ps1

# Or with custom paths
.\setup-test-environment.ps1 -TestEnvPath "./test-env" -KeyType "ed25519"
```

**What this does:**
- Creates directory structure: `test-env/ssh/{node1,node2}/.ssh`
- Generates ED25519 SSH key pair: `test-env/keys/id_test`
- Sets up `authorized_keys` for both container nodes
- Creates SSH config file for convenient access
- Generates helper scripts for testing

**Expected output:**
```
================================================
Phase 17.5 Container Test Environment Setup
================================================

[*] Creating test environment directory structure...
    [✓] Created: test-env
    [✓] Created: test-env/ssh
    ...
[*] Generating SSH keys for container access...
    [*] Using ssh-keygen to generate keys...
    [✓] Generated ED25519 key pair

[*] Setting up authorized_keys for container nodes...
    [✓] Configured node1 authorized_keys
    [✓] Configured node2 authorized_keys

================================================
Setup Complete
================================================
```

### Step 2: Build Docker Image

```bash
# Build the container image (runs from project root)
docker-compose -f docker-compose.phase60-test.yml build

# Track build progress
docker-compose -f docker-compose.phase60-test.yml build --progress=plain
```

**Build stages:**
1. Pull Devuan 6.1.1 base image
2. Install SSH server and dependencies
3. Configure SSHD settings
4. Create Phase 17.5 working directories
5. Copy validator scripts
6. Finalize image (~800MB-1GB)

**Expected time:** 3-5 minutes on first build (depends on internet speed)

### Step 3: Launch Container Nodes

```bash
# Start both containers in background
docker-compose -f docker-compose.phase60-test.yml up -d

# Verify containers are running
docker-compose -f docker-compose.phase60-test.yml ps

# View logs
docker-compose -f docker-compose.phase60-test.yml logs -f

# View specific container logs
docker logs phase17-simulator-node1
docker logs phase17-simulator-node2
```

**Expected status:**
```
NAME                        STATUS           PORTS
phase17-simulator-node1     Up (healthy)     0.0.0.0:2201->22/tcp
phase17-simulator-node2     Up (healthy)     0.0.0.0:2202->22/tcp
```

### Step 4: Verify SSH Connectivity

```bash
# Test connection to Node 1
ssh -i ./test-env/keys/id_test -o StrictHostKeyChecking=no root@localhost -p 2201 "hostname"

# Test connection to Node 2
ssh -i ./test-env/keys/id_test -o StrictHostKeyChecking=no root@localhost -p 2202 "hostname"

# Or run the automated test script
bash ./test-env/test-ssh-connectivity.sh
```

**Expected output:**
```
[*] Testing connection to phase17-node1 (port 2201)...
[✓] Node 1 SSH connection successful
phase17-node1

[*] Testing connection to phase17-node2 (port 2202)...
[✓] Node 2 SSH connection successful
phase17-node2
```

### Step 5: Execute Distributed Validation

```bash
# Run validators on all nodes with automatic result collection
bash ./run-distributed-validation.sh

# With custom options
bash ./run-distributed-validation.sh --nodes "1,2" --timeout 300 --output-dir ./results

# Run only on Node 1
bash ./run-distributed-validation.sh --nodes "1"
```

**Script flow:**
1. Verifies SSH connectivity to each node
2. Executes validator script remotely
3. Collects results via SCP
4. Generates per-node logs and summary report

**Expected output:**
```
=========================================
Phase 17.5 Distributed Validator
=========================================

Configuration:
  SSH Key: ./test-env/keys/id_test
  Nodes: 1,2
  Timeout: 300s
  Output: ./test-env/results

[2026-04-20 14:32:15] Connecting to phase17-node-1 (localhost:2201)...
[2026-04-20 14:32:15] ✓ SSH connection established to phase17-node-1
...
[2026-04-20 14:32:45] ✓ All validators completed successfully
```

## File Structure

```
MistTracker/
├── Dockerfile.phase60-test               # Container image definition
├── docker-compose.phase60-test.yml       # 2-node orchestration config
├── setup-test-environment.ps1            # SSH key setup (Windows)
├── run-distributed-validation.sh         # Test orchestration script
├── test-env/                             # Test environment (created by setup)
│   ├── keys/
│   │   ├── id_test                       # Private SSH key
│   │   └── id_test.pub                   # Public SSH key
│   ├── ssh/
│   │   ├── config                        # SSH client config
│   │   ├── node1/.ssh/authorized_keys    # Node 1 auth keys
│   │   └── node2/.ssh/authorized_keys    # Node 2 auth keys
│   ├── results/                          # Validation results
│   │   ├── validation-YYYYMMDD-HHMMSS.log
│   │   ├── node-1-validator.log
│   │   ├── node-2-validator.log
│   │   ├── node-1-results/               # Node 1 artifacts
│   │   └── node-2-results/               # Node 2 artifacts
│   └── logs/                             # Test execution logs
└── mist/                                 # Phase 17.5 source (not included)
    ├── cli.js
    ├── MistCausality.js
    ├── MistTrackerVulkan.js
    └── ...
```

## Usage Examples

### Interactive SSH Access
```bash
# SSH into Node 1 for manual testing
ssh -i ./test-env/keys/id_test root@localhost -p 2201

# Inside container
$ cd /opt/phase17.5
$ ls -la mist/
$ node mist/cli.js --help

# Exit with Ctrl+D or 'exit'
```

### Remote Command Execution
```bash
# Run arbitrary command on node
ssh -i ./test-env/keys/id_test root@localhost -p 2201 "uname -a; node -v; npm -v"

# Execute multiple commands
ssh -i ./test-env/keys/id_test root@localhost -p 2201 << 'EOF'
cd /opt/phase17.5
echo "=== Environment ===" 
env | grep NODE
echo "=== Available Files ==="
ls -la mist/
EOF
```

### File Transfer (SCP)
```bash
# Copy file to node
scp -i ./test-env/keys/id_test -P 2201 ./local-file.txt root@localhost:/opt/phase17.5/data/

# Copy from node
scp -i ./test-env/keys/id_test -P 2201 root@localhost:/opt/phase17.5/results/validator.log ./

# Copy entire directory
scp -i ./test-env/keys/id_test -r -P 2201 root@localhost:/opt/phase17.5/results ./node1-results-backup/
```

## Troubleshooting

### "SSH connection refused"
```bash
# Issue: Connection to localhost:2201 rejected
# Solution: Verify container is running

docker ps | grep phase17-simulator
# If not running, check logs:
docker logs phase17-simulator-node1

# Restart containers
docker-compose -f docker-compose.phase60-test.yml restart
```

### "Permission denied (publickey)"
```bash
# Issue: SSH key authentication fails
# Solution: Verify key permissions and setup

# Check key file permissions (should be 600)
ls -la ./test-env/keys/id_test

# Verify authorized_keys in container
docker exec phase17-simulator-node1 cat /root/.ssh/authorized_keys

# Regenerate keys if corrupted
rm -rf ./test-env/keys/
.\setup-test-environment.ps1 -TestEnvPath "./test-env" -KeyType "ed25519"
```

### "Connection timeout"
```bash
# Issue: Cannot reach container on specified port
# Solution: Verify port forwarding

# Check Docker port mapping
docker ps | grep phase17-simulator

# Verify ports are listening on host
netstat -tuln | grep 220[12]  # Linux/macOS
netstat -ano | findstr 220[12]  # Windows

# Test with docker exec instead
docker exec -it phase17-simulator-node1 bash
```

### Container exits immediately
```bash
# Issue: Containers won't stay running
# Solution: Check Docker build and SSH configuration

# View container logs
docker logs phase17-simulator-node1

# Check Dockerfile SSH config
cat Dockerfile.phase60-test | grep -A 5 "sshd_config"

# Rebuild image
docker-compose -f docker-compose.phase60-test.yml down
docker-compose -f docker-compose.phase60-test.yml build --no-cache
docker-compose -f docker-compose.phase60-test.yml up -d
```

### Insufficient disk space
```bash
# Clean up Docker images and containers
docker system prune -a
docker volume prune

# Check disk usage
docker system df
```

## Monitoring and Debugging

### Real-time Container Logs
```bash
# Follow logs from all containers
docker-compose -f docker-compose.phase60-test.yml logs -f

# Follow logs from specific container
docker-compose -f docker-compose.phase60-test.yml logs -f phase17-simulator-node1

# Show last 100 lines and follow
docker-compose -f docker-compose.phase60-test.yml logs --tail=100 -f
```

### Inspect Container State
```bash
# Check container environment
docker exec phase17-simulator-node1 env | grep PHASE

# Verify Phase 17.5 files are mounted
docker exec phase17-simulator-node1 ls -la /opt/phase17.5/

# Check SSH server status
docker exec phase17-simulator-node1 ps aux | grep sshd
```

### Collect Diagnostic Information
```bash
# Export logs for analysis
docker-compose -f docker-compose.phase60-test.yml logs > diagnostics.log

# Capture network inspection
docker network inspect phase17-test > network-inspect.json

# System resource usage
docker stats --no-stream
```

## Cleanup

### Stop Containers
```bash
# Stop without removing
docker-compose -f docker-compose.phase60-test.yml stop

# Resume stopped containers
docker-compose -f docker-compose.phase60-test.yml start
```

### Remove Containers and Volumes
```bash
# Remove containers but keep image and volumes
docker-compose -f docker-compose.phase60-test.yml down

# Remove containers, volumes, and networks
docker-compose -f docker-compose.phase60-test.yml down -v

# Remove images as well
docker-compose -f docker-compose.phase60-test.yml down -v --rmi all
```

### Remove Test Environment
```bash
# Remove SSH keys and test artifacts (PERMANENT)
rm -rf ./test-env/

# Note: Do this only after backing up any important results
```

## Integration with CI/CD

### GitHub Actions Example
```yaml
name: Phase 17.5 Integration Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: docker/setup-buildx-action@v2
      
      - name: Build containers
        run: docker-compose -f docker-compose.phase60-test.yml build
      
      - name: Start containers
        run: docker-compose -f docker-compose.phase60-test.yml up -d
      
      - name: Run validation
        run: bash ./run-distributed-validation.sh
      
      - name: Upload results
        uses: actions/upload-artifact@v3
        if: always()
        with:
          name: validation-results
          path: ./test-env/results/
```

## Next Steps (Phase 17.6+)

- **Phase 17.6 Integration:** Devuan SystemD support
- **Phase 60 Enigma:** Advanced cryptographic validation framework
- **Kubernetes Orchestration:** Multi-node distributed validation
- **Real-time Metrics:** Prometheus + Grafana integration
- **Automated CI/CD Pipeline:** Full pipeline integration

## Support and Documentation

- **Phase 17.5 Specification:** [COMPLETE-EMERGENCE-CHAIN-PHASES-17-41-FINAL.md](./COMPLETE-EMERGENCE-CHAIN-PHASES-17-41-FINAL.md)
- **Docker Documentation:** https://docs.docker.com/
- **SSH Key Management:** https://man.openbsd.org/ssh-keygen
- **Devuan Documentation:** https://www.devuan.org/get-devuan

---

**Last Updated:** 2026-04-20  
**Path:** Path B - Baseline Infrastructure Testing  
**Status:** Ready for Deployment
