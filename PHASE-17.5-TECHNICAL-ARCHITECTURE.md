# Phase 17.5 Container Test Infrastructure - Technical Architecture

## Executive Summary

**Path B Implementation:** Baseline infrastructure testing using standard OpenSSH on Devuan 6.1.1 containers for Phase 17.5 atomic domain validator execution.

**Key Decision Rationale:** Established SSH ecosystem provides immediate functionality without framework dependencies, enabling rapid validation and iterative development before Phase 60 Enigma framework integration.

---

## Architecture Overview

### Design Philosophy

```
Principle: Maximize validation velocity with minimal dependencies
├─ Use standard, proven technologies (OpenSSH, Docker)
├─ Implement Phase 17.5 without cryptographic framework overlay
├─ Enable rapid iteration and incremental improvements
└─ Maintain clear upgrade path to Phase 60 Enigma (Phase 17.6)
```

### Component Stack

```
┌─────────────────────────────────────────────┐
│ Test Orchestration Layer (Bash/PowerShell)  │
│   • Container lifecycle management          │
│   • SSH connection pooling                  │
│   • Result aggregation and reporting        │
└──────────┬──────────────────────────────────┘
           │
┌──────────▼──────────────────────────────────┐
│ SSH Transport Layer (OpenSSH)               │
│   • ED25519 key-based authentication        │
│   • Port forwarding (2201, 2202)            │
│   • SCP for result collection               │
└──────────┬──────────────────────────────────┘
           │
┌──────────▼──────────────────────────────────┐
│ Container Runtime Layer (Docker/Devuan)    │
│   • Devuan 6.1.1 base image                 │
│   • SSHD daemon (standard config)           │
│   • Phase 17.5 validator execution env      │
└──────────┬──────────────────────────────────┘
           │
┌──────────▼──────────────────────────────────┐
│ Phase 17.5 Validator Layer                  │
│   • Atomic domain parsing                   │
│   • Causality validation                    │
│   • Result generation                       │
└─────────────────────────────────────────────┘
```

## Implementation Details

### 1. Docker Image Construction

#### Base Selection: Devuan 6.1.1 Excalibur
**Rationale:**
- Linux-based, minimal footprint (~200MB)
- Systemd-free (systemd-less design for research environments)
- Stable, production-tested codebase
- Community support for Phase research

**Alternative Considered (Not Selected):** Ubuntu 24.04 LTS
- Rejected: Heavier image, systemd dependency
- Suitable for Phase 17.6+ when SystemD integration planned

#### Image Layers
```dockerfile
Layer 1: Base Image
  - Pull devuan:excalibur (~150MB)
  - Update package lists

Layer 2: System Dependencies
  - openssh-server, openssh-client
  - build-essential, python3, nodejs, npm
  - ca-certificates for TLS validation

Layer 3: SSH Configuration
  - Disable password authentication (security)
  - Enable public key authentication (security)
  - Disable UsePAM (prevents SSH hang on container startup)
  - Standard port 22 (remapped via Docker)

Layer 4: Phase 17.5 Environment
  - Create /opt/phase17.5 working directory
  - Mount points for validator scripts
  - Result collection volumes

Layer 5: Runtime Setup
  - Validator execution script (/opt/phase17.5/run-validator.sh)
  - Health check (sshd -t)
  - Foreground SSHD startup
```

**Final Image Size:** ~800MB-1GB (depends on base layer caching)

### 2. Orchestration Strategy

#### Docker Compose Configuration

**Node Configuration:**
```yaml
services:
  phase17-node-1/2:
    - Same base image (standardized environment)
    - Independent SSH port mapping (2201, 2202)
    - Separate result volumes (node1-results, node2-results)
    - Isolated network (phase17-test bridge)
    - Independent log streams (json-file driver, 10MB max)
```

**Rationale for 2-Node Setup:**
- Minimum for distributed validation testing
- Demonstrates network isolation
- Manageable resource footprint (~3-4GB RAM)
- Extensible to N nodes for Phase 17.6+

**Volume Strategy:**
```
Host Directory Structure:
├── mist/ (read-only mount)
│   └─ Phase 17.5 source code
│       • cli.js
│       • MistCausality.js
│       • MistTrackerVulkan.js
│
├── test-env/ssh/ (read-only mount)
│   ├─ node1/.ssh/authorized_keys
│   └─ node2/.ssh/authorized_keys
│
└─ Results Volumes (writable)
    ├─ phase17-node1-results/
    └─ phase17-node2-results/
```

**Volume Rationale:**
- Separation of concerns: code vs. configuration vs. results
- Read-only source prevents container mutation
- Writable results enable host-side result processing
- Docker volumes provide cross-platform compatibility

### 3. SSH Key Management

#### Key Generation Strategy

```
Architecture: ED25519 (recommended NIST curve)
├─ Size: 256 bits (equivalent to RSA 3072)
├─ Performance: ~100x faster than RSA 2048
├─ Security: Modern cryptography, quantum-resistant properties
└─ Compatibility: OpenSSH 6.5+, Docker SSH client
```

**Key Lifecycle:**
```
1. Generation (setup-test-environment.ps1)
   └─ Host: test-env/keys/id_test (private)
   └─ Host: test-env/keys/id_test.pub (public)

2. Distribution (Dockerfile build phase)
   └─ Container node1: /root/.ssh/authorized_keys (copy of public)
   └─ Container node2: /root/.ssh/authorized_keys (copy of public)

3. Authentication (SSH client connection)
   ├─ Client: ssh -i test-env/keys/id_test
   ├─ Server: /root/.ssh/authorized_keys verification
   └─ Session: Established on successful match
```

**Security Considerations:**
- Private key permissions: 600 (read-write owner only)
- Public key in authorized_keys: standard SSH format
- No password authentication enabled (attacks mitigated)
- StrictHostKeyChecking=no for automated testing (acceptable in isolated network)

#### Key File Formats

**Private Key (PEM format):**
```
-----BEGIN OPENSSH PRIVATE KEY-----
[Base64-encoded key material]
-----END OPENSSH PRIVATE KEY-----
```

**Public Key (OpenSSH format):**
```
ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAI... phase17-test
```

**authorized_keys (standard SSH):**
```
ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAI... phase17-test
```

### 4. Test Execution Flow

#### Distributed Validation Pipeline

```
run-distributed-validation.sh
│
├─ [Parse Arguments]
│   ├─ nodes: "1,2" (default: all)
│   ├─ timeout: 300s (validator execution limit)
│   └─ output-dir: "./test-env/results"
│
├─ [Pre-flight Checks]
│   ├─ SSH key exists: ./test-env/keys/id_test
│   ├─ SSH key permissions: 600
│   └─ Output directory writable
│
├─ [SSH Connectivity Tests]
│   ├─ Node 1: ssh -p 2201 "echo OK"
│   ├─ Node 2: ssh -p 2202 "echo OK"
│   └─ Timeout: 10s per node
│
├─ [Validator Execution (parallel possible)]
│   ├─ For each node:
│   │   ├─ ssh remote timeout 300 /opt/phase17.5/run-validator.sh
│   │   ├─ Capture stdout/stderr
│   │   ├─ Log to node-N-validator.log
│   │   └─ Parse success/failure indicators
│   │
│   └─ SCP Result Collection
│       ├─ scp -r node:/opt/phase17.5/results/* host:/results/
│       └─ Capture any collection errors
│
├─ [Result Aggregation]
│   ├─ Parse individual node logs
│   ├─ Compile success/failure summary
│   └─ Generate validation-TIMESTAMP.log
│
└─ [Exit Status]
    ├─ Success: 0 (all validators passed)
    └─ Failure: 1 (any validator failed)
```

**Performance Characteristics:**
- Node startup: ~2-3 seconds
- SSH connectivity: 100-500ms per node
- Validator execution: Depends on Phase 17.5 logic (est. 5-30s)
- Result collection: 500ms-2s per node
- **Total pipeline:** ~10-40 seconds (2 nodes, full cycle)

### 5. Error Handling and Recovery

#### Failure Modes and Recovery

| Failure Mode | Detection | Recovery | Status |
|---|---|---|---|
| SSH key missing | `test -f $SSH_KEYFILE` | Regenerate with setup script | Automated |
| Connection timeout | 10s socket timeout | Log error, continue other nodes | Partial success |
| SSH authentication failed | `ssh` exit code 255 | Check authorized_keys, retry setup | Manual retry |
| Validator timeout | 300s script timeout | Kill remote process, log timeout | Timeout error |
| Result collection failed | `scp` exit code non-zero | Log warning, continue | Partial results |
| Container not running | `docker ps` check | Start with `docker-compose up -d` | Manual recovery |
| Permission denied on results | Volume write fails | Check Docker volume permissions | Manual fix |

#### Logging Strategy

```
Structured Logging:
├─ Timestamp: [2026-04-20 14:32:15]
├─ Level: [INFO|SUCCESS|ERROR|WARN]
├─ Message: Descriptive status
└─ Source: Script or node identifier

Log Destinations:
├─ Console: Real-time output with colors
├─ File: validation-YYYYMMDD-HHMMSS.log (persistent)
└─ Per-node: node-N-validator.log (raw output)

Log Retention: No automatic cleanup (user responsibility)
```

## Security Architecture

### Threat Model

```
Trust Boundary Analysis:
├─ Host Machine (Trusted)
│   ├─ SSH keys (stored securely)
│   ├─ Test orchestration scripts
│   └─ Result collection/processing
│
├─ Network (Semi-Trusted, Docker bridge)
│   ├─ Container-to-container communication
│   └─ Host-to-container SSH tunneling
│
└─ Containers (Isolated)
    ├─ No outbound internet access
    ├─ Validator execution environment
    └─ Result staging area
```

### Security Controls

**SSH Authentication:**
- ED25519 key-based (no passwords)
- 256-bit key length
- Private key never transmitted
- Server identity verification available (optional)

**Network Isolation:**
- Docker bridge network (isolated from host network)
- No port exposure except SSH
- Container-to-container communication via internal DNS

**File Access:**
- Read-only source code mount (immutable validator)
- Separate result volumes (no code mutation)
- Container root user (acceptable for test environment)

**Execution Isolation:**
- Each container has isolated filesystem
- Independent SSH sessions
- No cross-container process communication

**Recommended Production Hardening (Phase 17.6+):**
- Non-root container user
- Network policies (Kubernetes NetworkPolicy)
- RBAC (Kubernetes RBAC)
- Audit logging (container runtime audit)
- Image signing and verification

## Performance Considerations

### Resource Allocation

```
Per-Container:
├─ CPU: 1 core (container default: unlimited)
├─ Memory: 512MB default, no hard limit set
│   └─ Recommendation: Set --memory 1G for stability
├─ Disk: ~200MB base image + 100MB per results volume
└─ Network: I/O limited by SSH throughput (~10Mbps theoretical)

Host System Minimum:
├─ CPU: 2 cores (ideally 4+)
├─ Memory: 4GB RAM total (2-3GB for containers)
├─ Disk: 5GB free (images + volumes + cache)
└─ Network: Localhost loopback only (no external bandwidth)
```

### Optimization Opportunities

**Current (Phase 17.5):**
- Sequential node validation (one at a time)
- Single-threaded result collection
- No result caching between runs

**Future (Phase 17.6+):**
- Parallel node validation (GNU parallel, xargs)
- Async result collection (background SCP)
- Result caching layer (Redis or filesystem)
- Incremental validation (only changed domains)

## Scalability Roadmap

### Phase 17.5 (Current)
```
Maximum Scale: 2-5 nodes
Coordinator: Single shell script
Communication: SSH + SCP
Bottleneck: Sequential execution
Typical Run Time: 10-40 seconds
```

### Phase 17.6 (Planned)
```
Maximum Scale: 10-50 nodes
Coordinator: Docker Compose with service discovery
Communication: SSH + custom protocol
Bottleneck: Network I/O for result collection
Typical Run Time: 30-60 seconds (parallel execution)
```

### Phase 18.0+ (Future)
```
Maximum Scale: 100+ nodes
Coordinator: Kubernetes cluster
Communication: gRPC + protobuf
Bottleneck: Central result aggregation
Typical Run Time: 1-5 minutes (highly parallelized)
```

## Integration Points

### Phase 17.5 Integration

**Expected Phase 17.5 Modules:**
```
├─ cli.js
│   └─ Entry point for validator execution
│       • --mode validator
│       • --atomic-domain <symbol>
│       • --output-format json
│
├─ MistCausality.js
│   └─ Atomic causality validation
│       • Temporal ordering verification
│       • State transition validation
│
├─ MistTrackerVulkan.js
│   └─ GPU acceleration support
│       • Optional for Phase 17.5 baseline
│       • Planned for Phase 17.6
│
└─ Auxiliary modules
    ├─ Database handlers
    ├─ Result formatters
    └─ Configuration parsers
```

**Expected CLI Interface:**
```bash
# Validator execution
node cli.js \
  --mode validator \
  --atomic-domain "H" \
  --output results.json \
  --timeout 300

# Causality check
node cli.js \
  --mode causality-validate \
  --chain states.json
```

### Result Format Specification

**Expected JSON Output:**
```json
{
  "execution_id": "phase17-node1-20260420-143215",
  "timestamp": "2026-04-20T14:32:15Z",
  "validator_version": "17.5.0",
  "domains": [
    {
      "symbol": "H",
      "status": "valid",
      "causality_score": 0.98,
      "execution_time_ms": 1250,
      "transitions_validated": 142,
      "anomalies": []
    },
    {
      "symbol": "He",
      "status": "valid",
      "causality_score": 0.97,
      "execution_time_ms": 1180,
      "transitions_validated": 148,
      "anomalies": []
    }
  ],
  "summary": {
    "total_domains": 2,
    "passed": 2,
    "failed": 0,
    "total_execution_time_ms": 2430,
    "total_transitions_validated": 290
  }
}
```

## Monitoring and Observability

### Built-in Observability

**Docker Logging:**
```bash
# Real-time container output
docker-compose logs -f

# Historical log retrieval
docker logs --since 10m phase17-simulator-node1

# Log filtering
docker logs phase17-simulator-node1 2>&1 | grep ERROR
```

**Health Checks:**
```yaml
HEALTHCHECK:
  Command: sshd -t (SSH daemon syntax check)
  Interval: 30 seconds
  Timeout: 10 seconds
  Retries: 3
  Status: Healthy/Unhealthy/Starting
```

**Resource Monitoring:**
```bash
# Real-time resource usage
docker stats

# Container inspection
docker inspect phase17-simulator-node1

# Network inspection
docker network inspect phase17-test
```

### Future Observability (Phase 17.6+)

- Prometheus metrics export
- Grafana dashboards
- OpenTelemetry tracing
- Structured logging (JSON format)
- Centralized log aggregation (ELK stack)

## Conclusion

**Phase 17.5 Container Test Infrastructure** provides a solid foundation for distributed atomic domain validation testing. The design emphasizes:

1. **Simplicity:** Standard technologies (Docker, SSH) with minimal overhead
2. **Reliability:** Well-tested components with clear failure modes
3. **Extensibility:** Clear upgrade path to Phase 60 Enigma framework
4. **Debuggability:** Comprehensive logging and manual access capabilities

This Path B approach enables rapid iteration on Phase 17.5 validation logic before framework-level integration planned for Phase 17.6.

---

**Document Version:** 1.0  
**Last Updated:** 2026-04-20  
**Status:** Ready for Deployment
