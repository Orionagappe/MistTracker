#!/bin/bash
#
# MistTracker Test 1: Coherence Frequency Prediction Validation
# Usage: ./run_test_1.sh [--date YYYY-MM-DD] [--duration HOURS]
#
# This script runs the Phase 0 validation test for MistTracker emergence signatures
# 

set -e

echo "=========================================="
echo "MistTracker Test 1: Coherence Validation"
echo "=========================================="
echo ""

# Check Python installation
if ! command -v python3 &> /dev/null; then
    echo "ERROR: python3 not found. Please install Python 3.8+"
    exit 1
fi

echo "Python version: $(python3 --version)"
echo ""

# Install dependencies if needed
echo "Checking dependencies..."
python3 -m pip list | grep -q matplotlib || (echo "Installing matplotlib..." && python3 -m pip install matplotlib -q)
python3 -m pip list | grep -q numpy || (echo "Installing numpy..." && python3 -m pip install numpy -q)
python3 -m pip list | grep -q scipy || (echo "Installing scipy..." && python3 -m pip install scipy -q)

echo "Dependencies OK"
echo ""

# Create output directory
mkdir -p test_1_output
mkdir -p test_1_output/plots

# Run test with arguments
echo "Running Test 1..."
python3 test_1_coherence_frequencies.py \
    --date "${1:-2021-01-15}" \
    --duration "${2:-24}" \
    --output test_1_output \
    --verbose

echo ""
echo "=========================================="
echo "Test 1 Complete"
echo "=========================================="
echo "Results saved to: test_1_output/test_1_results.json"
echo "Plots saved to: test_1_output/plots/"
echo ""
echo "To view results:"
echo "  cat test_1_output/test_1_results.json | python3 -m json.tool"
echo ""
