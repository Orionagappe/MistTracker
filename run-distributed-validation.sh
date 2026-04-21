#!/bin/bash
# Phase 17.5 Container Test Validator
# Executes distributed atomic domain validation across Phase 17.5 simulator nodes
# Usage: ./run-distributed-validation.sh [--nodes 1,2] [--timeout 300] [--output-dir results]

set -e

# Configuration
SSH_KEYFILE="${SSH_KEYFILE:-./test-env/keys/id_test}"
NODE_PORT_BASE=2200
VALIDATOR_TIMEOUT=${VALIDATOR_TIMEOUT:-300}
OUTPUT_DIR="./test-env/results"
LOG_FILE="$OUTPUT_DIR/validation-$(date +%Y%m%d-%H%M%S).log"

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Logging function
log() {
    local level=$1
    shift
    local msg="$@"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    
    case $level in
        INFO)
            echo -e "${BLUE}[${timestamp}]${NC} ${msg}" | tee -a "$LOG_FILE"
            ;;
        SUCCESS)
            echo -e "${GREEN}[${timestamp}] ✓${NC} ${msg}" | tee -a "$LOG_FILE"
            ;;
        ERROR)
            echo -e "${RED}[${timestamp}] ✗${NC} ${msg}" | tee -a "$LOG_FILE"
            ;;
        WARN)
            echo -e "${YELLOW}[${timestamp}] !${NC} ${msg}" | tee -a "$LOG_FILE"
            ;;
    esac
}

# Parse command line arguments
NODES="1,2"
while [[ $# -gt 0 ]]; do
    case $1 in
        --nodes)
            NODES="$2"
            shift 2
            ;;
        --timeout)
            VALIDATOR_TIMEOUT="$2"
            shift 2
            ;;
        --output-dir)
            OUTPUT_DIR="$2"
            shift 2
            ;;
        *)
            log ERROR "Unknown option: $1"
            exit 1
            ;;
    esac
done

# Create output directory
mkdir -p "$OUTPUT_DIR"

# Print header
echo ""
log INFO "========================================="
log INFO "Phase 17.5 Distributed Validator"
log INFO "========================================="
echo ""
log INFO "Configuration:"
log INFO "  SSH Key: $SSH_KEYFILE"
log INFO "  Nodes: $NODES"
log INFO "  Timeout: ${VALIDATOR_TIMEOUT}s"
log INFO "  Output: $OUTPUT_DIR"
echo ""

# Verify SSH key exists
if [[ ! -f "$SSH_KEYFILE" ]]; then
    log ERROR "SSH key not found: $SSH_KEYFILE"
    exit 1
fi

# Set SSH key permissions
chmod 600 "$SSH_KEYFILE"

# Function to run validator on a node
run_node_validator() {
    local node_id=$1
    local port=$((NODE_PORT_BASE + node_id))
    local node_name="phase17-node-$node_id"
    
    log INFO "Connecting to $node_name (localhost:$port)..."
    
    # Test SSH connectivity
    if ! timeout 10 ssh -i "$SSH_KEYFILE" \
            -o StrictHostKeyChecking=no \
            -o UserKnownHostsFile=/dev/null \
            -o ConnectTimeout=5 \
            root@localhost -p $port "echo 'SSH OK'" &>/dev/null; then
        log ERROR "SSH connection failed to $node_name"
        return 1
    fi
    
    log SUCCESS "SSH connection established to $node_name"
    
    # Execute validator script remotely
    log INFO "Executing validator on $node_name..."
    
    validator_output=$(ssh -i "$SSH_KEYFILE" \
            -o StrictHostKeyChecking=no \
            -o UserKnownHostsFile=/dev/null \
            root@localhost -p $port \
            "timeout $VALIDATOR_TIMEOUT /opt/phase17.5/run-validator.sh 2>&1" 2>&1 || true)
    
    # Log results
    echo "$validator_output" | tee -a "$LOG_FILE" > "$OUTPUT_DIR/node-$node_id-validator.log"
    
    # Check if validator completed successfully
    if echo "$validator_output" | grep -q "Validator complete"; then
        log SUCCESS "Validator completed on $node_name"
        
        # Collect results
        log INFO "Collecting results from $node_name..."
        mkdir -p "$OUTPUT_DIR/node-$node_id-results"
        
        scp -i "$SSH_KEYFILE" \
            -o StrictHostKeyChecking=no \
            -o UserKnownHostsFile=/dev/null \
            -P $port \
            root@localhost:/opt/phase17.5/results/* \
            "$OUTPUT_DIR/node-$node_id-results/" 2>&1 || log WARN "No results to copy from node $node_id"
        
        log SUCCESS "Results collected from $node_name"
        return 0
    else
        log ERROR "Validator failed on $node_name"
        return 1
    fi
}

# Run validators on specified nodes
node_results=()
failed_nodes=()

log INFO "Starting distributed validation across nodes..."
echo ""

IFS=',' read -ra node_list <<< "$NODES"
for node in "${node_list[@]}"; do
    node=$(echo "$node" | tr -d ' ')
    
    if run_node_validator "$node"; then
        node_results+=("$node:SUCCESS")
    else
        node_results+=("$node:FAILED")
        failed_nodes+=("$node")
    fi
    echo ""
done

# Print summary
log INFO "========================================="
log INFO "Validation Summary"
log INFO "========================================="
echo ""

for result in "${node_results[@]}"; do
    IFS=':' read -ra parts <<< "$result"
    node="${parts[0]}"
    status="${parts[1]}"
    
    if [[ "$status" == "SUCCESS" ]]; then
        log SUCCESS "Node $node: $status"
    else
        log ERROR "Node $node: $status"
    fi
done

echo ""
log INFO "Results saved to: $OUTPUT_DIR"
log INFO "Log file: $LOG_FILE"
echo ""

# Exit code
if [[ ${#failed_nodes[@]} -eq 0 ]]; then
    log SUCCESS "All validators completed successfully"
    exit 0
else
    log ERROR "Validation failed on nodes: ${failed_nodes[@]}"
    exit 1
fi
