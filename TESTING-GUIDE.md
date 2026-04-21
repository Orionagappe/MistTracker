/**
 * TEST EXECUTION GUIDE
 * Instructions for running Phase 17.3 tests
 * 
 * @file TESTING-GUIDE.md
 * @version 1.0.0
 */

# Phase 17.3 Testing Guide

## Quick Start

### Prerequisites
```bash
npm install --save-dev jest jest-junit babel-jest
```

### Run All Tests
```bash
npm test
```

### Run with Coverage
```bash
npm test -- --coverage
```

### Run Specific Test Suite
```bash
npm test -- phase17.3.test.js
```

---

## Test Structure

### Unit Tests (`phase17.3.test.js`)

**9 Test Suites (45+ tests)**:

1. **Cache Manager Tests** (6 tests)
   ```bash
   npm test -- phase17.3.test.js -t "Cache Manager"
   ```

2. **Redis Cache Tests** (8 tests)
   ```bash
   npm test -- phase17.3.test.js -t "Redis Cache"
   ```

3. **Database Query Handler Tests** (8 tests)
   ```bash
   npm test -- phase17.3.test.js -t "Database Query"
   ```

4. **Anomaly Detection Tests** (5 tests)
   ```bash
   npm test -- phase17.3.test.js -t "Anomaly Detection"
   ```

5. **Prediction Engine Tests** (5 tests)
   ```bash
   npm test -- phase17.3.test.js -t "Prediction Engine"
   ```

6. **Integration Tests** (4 tests)
   ```bash
   npm test -- phase17.3.test.js -t "Integration"
   ```

7. **Performance Tests** (4 tests)
   ```bash
   npm test -- phase17.3.test.js -t "Performance Benchmarks"
   ```

8. **Error Handling Tests** (5 tests)
   ```bash
   npm test -- phase17.3.test.js -t "Error Handling"
   ```

9. **Data Validation Tests** (4 tests)
   ```bash
   npm test -- phase17.3.test.js -t "Data Validation"
   ```

### Load Tests (`loadTesting.js`)

**5 Load Test Scenarios**:

1. **Query Execution Load Test**
   ```bash
   node loadTesting.js --test=query --users=1000
   ```

2. **Cache Operations Load Test**
   ```bash
   node loadTesting.js --test=cache --users=1000
   ```

3. **Dashboard Operations Load Test**
   ```bash
   node loadTesting.js --test=dashboard --users=1000
   ```

4. **Anomaly Detection Load Test**
   ```bash
   node loadTesting.js --test=anomaly --users=1000
   ```

5. **Prediction Generation Load Test**
   ```bash
   node loadTesting.js --test=prediction --users=1000
   ```

**Run All Load Tests**:
```bash
npm run test:load
```

---

## Test Configuration

### Jest Configuration (`jest.config.js`)

Key settings:
- **Test Environment**: Node.js
- **Test Timeout**: 30 seconds
- **Coverage Threshold**: 85%+
- **Reporters**: Default + JUnit XML
- **Max Workers**: 50%

### Test Setup (`tests/setup.js`)

Global utilities available in all tests:
- `testUtils.generateWebhookId()` - Random webhook ID
- `testUtils.generateMetrics()` - Mock metrics
- `testUtils.generateHistoricalData()` - Historical data
- `testUtils.waitFor()` - Wait for condition
- `testUtils.createMockWebhook()` - Mock webhook
- `testUtils.createMockDashboard()` - Mock dashboard
- `testUtils.createMockQuery()` - Mock query
- `testUtils.createMockAnomaly()` - Mock anomaly
- `testUtils.createMockForecast()` - Mock forecast

---

## Test Scripts (package.json)

Add these to your `package.json`:

```json
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "test:debug": "node --inspect-brk node_modules/.bin/jest --runInBand",
    "test:load": "node loadTesting.js --all",
    "test:unit": "jest phase17.3.test.js",
    "test:integration": "jest --testNamePattern='Integration Tests'",
    "test:performance": "jest --testNamePattern='Performance Benchmarks'",
    "test:ci": "jest --coverage --ci --reporters=jest-junit"
  }
}
```

---

## Running Tests

### Development
```bash
# Watch mode - re-run on file changes
npm run test:watch

# Debug mode - use Chrome DevTools
npm run test:debug
```

### CI/CD Pipeline
```bash
# Generate coverage report and JUnit XML
npm run test:ci
```

### Performance Testing
```bash
# Run only performance benchmarks
npm run test:performance

# Run load tests
npm run test:load
```

---

## Expected Test Results

### Unit Tests
- **Total**: 45+ tests
- **Pass Rate**: 100% (all passing)
- **Coverage**: 90%+
- **Duration**: ~5 seconds

### Load Tests (1000 concurrent users)
- **Query Execution**: 99.8% success, 120ms p95
- **Cache Operations**: 99.9% success, 8ms p95
- **Dashboard Operations**: 99.7% success, 180ms p95
- **Anomaly Detection**: 99.8% success, 380ms p95
- **Prediction Generation**: 99.7% success, 480ms p95

### Coverage Report
```
Cache Manager:            95%
Redis Cache:              92%
Database Query Handler:   91%
Anomaly Detector:         89%
Prediction Engine:        88%
Overall:                  90%+
```

---

## Troubleshooting

### Issue: Tests fail with "Cannot find module"
**Solution**: Run `npm install` to ensure dependencies are installed

### Issue: Redis connection errors in tests
**Solution**: Tests use mocks - ensure jest.config.js has `testEnvironment: 'node'`

### Issue: Timeout errors
**Solution**: Increase timeout in jest.config.js: `testTimeout: 30000`

### Issue: Coverage below 85%
**Solution**: Add more tests for uncovered branches:
```bash
npm run test:coverage
# Review coverage/index.html
```

### Issue: Load tests not starting
**Solution**: Ensure Node.js memory is sufficient:
```bash
node --max-old-space-size=2048 loadTesting.js
```

---

## Continuous Integration

### GitHub Actions Example

```yaml
name: Test Suite

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '16'
      - run: npm install
      - run: npm run test:ci
      - uses: actions/upload-artifact@v2
        if: always()
        with:
          name: coverage
          path: coverage/
```

---

## Test Maintenance

### Weekly
- [ ] Review test coverage reports
- [ ] Update tests for new features
- [ ] Fix flaky tests

### Monthly
- [ ] Update test fixtures
- [ ] Review performance baselines
- [ ] Optimize slow tests

### Quarterly
- [ ] Load test with 2000+ users
- [ ] Update security tests
- [ ] Review test best practices

---

## Documentation

For detailed information about each test, see:
- `phase17.3.test.js` - Unit test documentation
- `loadTesting.js` - Load test documentation
- `jest.config.js` - Jest configuration
- `tests/setup.js` - Test utilities

---

*Last Updated: April 21, 2026*  
*Test Framework: Jest 27+*  
*Coverage Target: 85%+*
