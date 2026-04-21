#!/bin/bash

# EMERGENCE FRAMEWORK 2.0 - VALIDATOR SETUP AND RUN
# Unix/Linux/macOS shell script - requires Node.js to be installed

echo "============================================================================"
echo "EMERGENCE VALIDATION FRAMEWORK 2.0 - INDEPENDENT VALIDATOR"
echo "============================================================================"
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "ERROR: Node.js is not installed or not in PATH"
    echo ""
    echo "Please install Node.js from https://nodejs.org/"
    echo "Then run this script again."
    exit 1
fi

# Check Node version
NODE_VERSION=$(node --version)
echo "Node.js version: $NODE_VERSION"
echo ""

# Run validator
echo "Running validator.cjs..."
echo ""

node validator.cjs "$@"
VALIDATOR_EXIT=$?

echo ""
if [ $VALIDATOR_EXIT -eq 0 ]; then
    echo "============================================================================"
    echo "SUCCESS: Framework validated. Results saved to validation-results.json"
    echo "============================================================================"
else
    echo "============================================================================"
    echo "FAILURE: One or more tests failed. See details above."
    echo "============================================================================"
fi

exit $VALIDATOR_EXIT
