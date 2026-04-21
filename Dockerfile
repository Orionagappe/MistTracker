# Phase 17 Implementation & Testing Container
# MistTracker: Atomic Physics Domain Validation
# Base: Devuan Linux (minimal, no systemd)
# Includes: Node.js, Python 3, Phase 17 code, test harness

FROM debian:bookworm-slim

LABEL maintainer="MistTracker Phase 17"
LABEL description="Phase 17 Atomic Physics Implementation & Real-Data Validation"
LABEL version="1.0"

# Set container hostname
RUN echo "laughing-einstein-phase17" > /etc/hostname

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    curl \
    wget \
    git \
    python3 \
    python3-pip \
    python3-dev \
    python3-venv \
    nodejs \
    npm \
    ca-certificates \
    openssh-server \
    openssh-client \
    && rm -rf /var/lib/apt/lists/*

# Configure SSH for Devuan (not required for this container, but included for completeness)
RUN mkdir -p /run/sshd

# Create application directory
WORKDIR /app/phase-17

# Copy Phase 17 core implementation files from workspace
COPY ./MistCore.js ./
COPY ./MistCommon.js ./
COPY ./MistCausality.js ./
COPY ./MistImpulse.js ./
COPY ./MistIllum.js ./
COPY ./SymbolicExpression.js ./
COPY ./Physics4DEngine.js ./
COPY ./Physics7DIntegration.js ./
COPY ./Physics7DForces.js ./

# Copy atomic domain validators
COPY ./atomic-domain-validator.js ./
COPY ./atomic-domain-validator-enhanced.js ./
COPY ./atomic-domain-validation-suite.js ./

# Copy server infrastructure for Phase 17
COPY ./server/phaseMilestones.js ./server/
COPY ./server/enhancedMilestoneManager.js ./server/
COPY ./server/atomicPhysicsMilestones.js ./server/

# Copy Phase 17 test harness
COPY ./test_1_coherence_frequencies.py ./tests/
COPY ./run_phase_17_tests.py ./tests/
COPY ./phase_17_5_simulation.py ./tests/
COPY ./phase-17-5-integration-tests.py ./tests/

# Copy documentation for reference
COPY ./ATOMIC-PHYSICS-DOMAIN-ALIGNMENT.md ./docs/
COPY ./PHASE-17-ATOMIC-PHYSICS-STRATEGY.md ./docs/
COPY ./PHASE-17-IP-PROTECTION-AND-VALIDATION-SUMMARY.md ./docs/

# Create Node.js package.json for Phase 17
RUN cat > package.json << 'EOF'
{
  "name": "misttracker-phase17",
  "version": "1.0.0",
  "description": "Phase 17: Atomic Physics Implementation with Real-Data Validation",
  "main": "phase-17-entry.js",
  "scripts": {
    "test": "node test-runner.js",
    "validate": "node atomic-domain-validator.js",
    "server": "node server-startup.js",
    "extract": "node extract-phase17-files.js"
  },
  "dependencies": {
    "express": "^4.18.2",
    "cdfjs": "^0.4.0"
  },
  "devDependencies": {
    "jest": "^29.0.0"
  }
}
EOF

# Create Phase 17 entry point script
RUN cat > phase-17-entry.js << 'EOF'
/**
 * Phase 17 Entry Point
 * MistTracker Atomic Physics Implementation
 * 
 * This script:
 * 1. Loads all Phase 17 core modules
 * 2. Initializes atomic physics domain validation
 * 3. Provides API for test harness and GROK validation
 */

const fs = require('fs');
const path = require('path');

console.log('='.repeat(70));
console.log('PHASE 17: Atomic Physics Implementation');
console.log('Container: Laughing Einstein (Phase 17)');
console.log('Date:', new Date().toISOString());
console.log('='.repeat(70));

// Load core Phase 17 modules
try {
  const MistCore = require('./MistCore.js');
  const MistCommon = require('./MistCommon.js');
  const MistCausality = require('./MistCausality.js');
  const AtomicValidator = require('./atomic-domain-validator-enhanced.js');
  
  console.log('\n✓ Phase 17 core modules loaded successfully');
  console.log('✓ Atomic physics domain validator initialized');
  console.log('✓ Ready for real-data coherence analysis');
  
  // Export Phase 17 API
  module.exports = {
    MistCore,
    MistCommon,
    MistCausality,
    AtomicValidator,
    version: '17.0.0',
    date: new Date().toISOString(),
    status: 'READY'
  };
  
} catch (err) {
  console.error('Error loading Phase 17 modules:', err.message);
  process.exit(1);
}
EOF

# Install Python dependencies for NASA data access and Phase 17 analysis
RUN python3 -m pip install --break-system-packages --no-cache-dir \
    numpy \
    scipy \
    matplotlib \
    cdflib \
    requests \
    pandas

# Create test runner wrapper
RUN cat > tests/run-tests.sh << 'EOF'
#!/bin/bash
echo "Phase 17 Test Runner"
echo "===================="
echo ""
echo "Available tests:"
echo "  1. test_1_coherence_frequencies.py - Real PSP FIELDS data validation"
echo "  2. run_phase_17_tests.py - Phase 17 test harness"
echo "  3. phase_17_5_simulation.py - Phase 17 simulation"
echo ""
echo "Running Phase 17 test harness..."
cd /app/phase-17/tests
python3 run_phase_17_tests.py
EOF

RUN chmod +x tests/run-tests.sh

# Create extraction script (for pushing to GitHub)
RUN cat > extract-phase17-files.js << 'EOF'
/**
 * Phase 17 File Extraction Script
 * Exports all Phase 17 implementation files for GitHub publication
 */

const fs = require('fs');
const path = require('path');

const PHASE17_FILES = [
  'MistCore.js',
  'MistCommon.js',
  'MistCausality.js',
  'MistImpulse.js',
  'MistIllum.js',
  'SymbolicExpression.js',
  'Physics4DEngine.js',
  'Physics7DIntegration.js',
  'Physics7DForces.js',
  'atomic-domain-validator.js',
  'atomic-domain-validator-enhanced.js',
  'atomic-domain-validation-suite.js',
  'server/phaseMilestones.js',
  'server/enhancedMilestoneManager.js',
  'server/atomicPhysicsMilestones.js'
];

console.log('Phase 17 File Extraction for GitHub');
console.log('====================================\n');

const outputDir = '/tmp/phase-17-extraction';
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

PHASE17_FILES.forEach(file => {
  const srcPath = path.join('/app/phase-17', file);
  const destPath = path.join(outputDir, file);
  
  try {
    if (fs.existsSync(srcPath)) {
      // Create directory if needed
      const dir = path.dirname(destPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      
      fs.copyFileSync(srcPath, destPath);
      console.log(`✓ ${file}`);
    } else {
      console.log(`✗ ${file} (not found)`);
    }
  } catch (err) {
    console.error(`✗ ${file}: ${err.message}`);
  }
});

console.log(`\nExtraction complete: ${outputDir}`);
console.log('Files ready for GitHub push');
EOF

# Create output directory for test results
RUN mkdir -p /app/phase-17/results /app/phase-17/plots

# Create startup script
RUN cat > /entrypoint.sh << 'EOF'
#!/bin/bash
set -e

echo "================================"
echo "Phase 17 Container Startup"
echo "================================"
echo ""

# Show environment
echo "Container: $(hostname)"
echo "Timestamp: $(date)"
echo "Node version: $(node --version)"
echo "Python version: $(python3 --version)"
echo ""

# Run Phase 17 initialization
cd /app/phase-17

case "${1:-test}" in
  test)
    echo "Running Phase 17 Test Harness..."
    cd /app/phase-17/tests
    python3 run_phase_17_tests.py
    ;;
  coherence)
    echo "Running Coherence Analysis..."
    cd /app/phase-17/tests
    python3 test_1_coherence_frequencies.py "${@:2}"
    ;;
  extract)
    echo "Extracting Phase 17 files for GitHub..."
    node extract-phase17-files.js
    ;;
  bash)
    exec /bin/bash "${@:2}"
    ;;
  *)
    echo "Usage: docker run [--rm] phase17 [command] [args...]"
    echo ""
    echo "Commands:"
    echo "  test               - Run Phase 17 test harness"
    echo "  coherence [args]   - Run coherence analysis (pass args to Python)"
    echo "  extract            - Extract Phase 17 files for GitHub"
    echo "  bash [cmd]         - Start bash shell (or run command)"
    echo ""
    /bin/bash
    ;;
esac
EOF

RUN chmod +x /entrypoint.sh

# Create version file
RUN cat > VERSION << 'EOF'
Phase 17: Atomic Physics Implementation Container
Version: 1.0
Date: April 21, 2026
Codename: Laughing Einstein
Status: Production Ready

Core Modules:
- MistCore.js (4D Physics Engine Foundation)
- MistCommon.js (nD Physics Mathematics)
- MistCausality.js (Causality Chain - w-domain fix)
- Physics4DEngine.js (4D Particle Dynamics)
- Physics7DIntegration.js (7D Spacetime Integration)
- Physics7DForces.js (Tensor Force Calculations)
- SymbolicExpression.js (Hermitian Validator & Symbolic Math)

Test Harness:
- test_1_coherence_frequencies.py (Real PSP FIELDS data validation)
- run_phase_17_tests.py (Comprehensive Phase 17 test suite)
- phase_17_5_simulation.py (Phase 17 simulation engine)

Documentation:
- ATOMIC-PHYSICS-DOMAIN-ALIGNMENT.md
- PHASE-17-ATOMIC-PHYSICS-STRATEGY.md
- PHASE-17-IP-PROTECTION-AND-VALIDATION-SUMMARY.md

Ready for real-data validation against Parker Solar Probe FIELDS data.
EOF

# Set working directory
WORKDIR /app/phase-17

# Expose ports (for future SSH/API access)
EXPOSE 22 3000 8080

# Default command
ENTRYPOINT ["/entrypoint.sh"]
CMD ["test"]
