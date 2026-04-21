/**
 * PHASE 17.3 - NPM SCRIPTS
 * Add these scripts to your package.json for testing and deployment
 * 
 * @file PACKAGE-SCRIPTS.md
 * @version 1.0.0
 */

# Phase 17.3 NPM Scripts

Add these scripts to your `package.json` file for easy testing, deployment, and monitoring.

---

## Complete Package.json Configuration

```json
{
  "name": "misttacker-phase-17.3",
  "version": "17.3.0",
  "description": "MistTracker Platform - Phase 17.3 Advanced Analytics & Performance Optimization",
  "main": "index.js",
  "engines": {
    "node": ">=14.0.0",
    "npm": ">=6.0.0"
  },
  "scripts": {
    "start": "node index.js",
    "dev": "nodemon index.js",
    "build": "npm run lint && npm run test",
    "lint": "eslint src/ tests/",
    "lint:fix": "eslint src/ tests/ --fix",
    
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "test:debug": "node --inspect-brk node_modules/.bin/jest --runInBand",
    "test:unit": "jest phase17.3.test.js",
    "test:integration": "jest --testNamePattern='Integration Tests'",
    "test:performance": "jest --testNamePattern='Performance Benchmarks'",
    "test:ci": "jest --coverage --ci --reporters=jest-junit",
    
    "load-test": "node loadTesting.js --all",
    "load-test:query": "node loadTesting.js --test=query --users=1000",
    "load-test:cache": "node loadTesting.js --test=cache --users=1000",
    "load-test:dashboard": "node loadTesting.js --test=dashboard --users=1000",
    "load-test:anomaly": "node loadTesting.js --test=anomaly --users=1000",
    "load-test:prediction": "node loadTesting.js --test=prediction --users=1000",
    
    "db:migrate": "node scripts/migrate.js",
    "db:seed": "node scripts/seed.js",
    "db:backup": "node scripts/backup.js",
    "db:restore": "node scripts/restore.js",
    
    "redis:connect": "redis-cli",
    "redis:monitor": "redis-cli monitor",
    "redis:info": "redis-cli info",
    "redis:flushall": "redis-cli flushall",
    
    "deploy": "npm run build && npm run test:ci && npm run deploy:staging",
    "deploy:staging": "node scripts/deploy.js --env=staging",
    "deploy:production": "node scripts/deploy.js --env=production",
    "deploy:rollback": "node scripts/rollback.js",
    
    "monitor": "node scripts/monitor.js",
    "monitor:metrics": "node scripts/metrics.js --watch",
    "monitor:logs": "tail -f logs/app.log",
    "monitor:health": "curl http://localhost:3000/health",
    
    "clean": "rm -rf dist/ coverage/ node_modules/",
    "reinstall": "npm run clean && npm install"
  },
  "dependencies": {
    "express": "^4.18.0",
    "redis": "^4.6.0",
    "mysql2": "^3.0.0",
    "body-parser": "^1.20.0",
    "cors": "^2.8.5",
    "dotenv": "^16.0.0",
    "winston": "^3.8.0",
    "joi": "^17.9.0"
  },
  "devDependencies": {
    "jest": "^29.0.0",
    "jest-junit": "^15.0.0",
    "babel-jest": "^29.0.0",
    "@babel/preset-env": "^7.20.0",
    "eslint": "^8.30.0",
    "eslint-config-airbnb": "^19.0.0",
    "nodemon": "^2.0.20"
  }
}
```

---

## Script Categories

### Testing Scripts

```bash
# Run all tests
npm test

# Run tests in watch mode (re-run on file changes)
npm run test:watch

# Generate coverage report
npm run test:coverage

# Debug tests (opens Chrome DevTools)
npm run test:debug

# Run only unit tests
npm run test:unit

# Run only integration tests
npm run test:integration

# Run only performance benchmarks
npm run test:performance

# Run tests with CI configuration (JUnit XML output)
npm run test:ci
```

### Load Testing Scripts

```bash
# Run all load tests
npm run load-test

# Query execution load test (1000 concurrent users)
npm run load-test:query

# Cache operations load test (1000 concurrent users)
npm run load-test:cache

# Dashboard operations load test (1000 concurrent users)
npm run load-test:dashboard

# Anomaly detection load test (1000 concurrent users)
npm run load-test:anomaly

# Prediction generation load test (1000 concurrent users)
npm run load-test:prediction
```

### Database Management Scripts

```bash
# Run database migrations
npm run db:migrate

# Seed test data
npm run db:seed

# Create database backup
npm run db:backup

# Restore from backup
npm run db:restore
```

### Redis Management Scripts

```bash
# Connect to Redis CLI
npm run redis:connect

# Monitor Redis commands in real-time
npm run redis:monitor

# Get Redis server info
npm run redis:info

# Clear all Redis data
npm run redis:flushall
```

### Deployment Scripts

```bash
# Full build and deployment pipeline
npm run deploy

# Deploy to staging environment
npm run deploy:staging

# Deploy to production environment
npm run deploy:production

# Rollback to previous version
npm run deploy:rollback
```

### Monitoring Scripts

```bash
# Run monitoring dashboard
npm run monitor

# Watch real-time metrics
npm run monitor:metrics

# Tail application logs
npm run monitor:logs

# Check application health
npm run monitor:health
```

### Maintenance Scripts

```bash
# Clean up build artifacts and dependencies
npm run clean

# Full reinstall (clean + npm install)
npm run reinstall
```

---

## CI/CD Pipeline Integration

### GitHub Actions Example

```yaml
name: Phase 17.3 CI/CD Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  test:
    runs-on: ubuntu-latest
    services:
      redis:
        image: redis
        options: >-
          --health-cmd "redis-cli ping"
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 6379:6379
      mysql:
        image: mysql:8.0
        env:
          MYSQL_ROOT_PASSWORD: root
          MYSQL_DATABASE: misttacker_test
        options: >-
          --health-cmd "mysqladmin ping"
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 3306:3306

    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '16'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Lint code
        run: npm run lint
      
      - name: Run unit tests
        run: npm run test:unit
      
      - name: Run integration tests
        run: npm run test:integration
      
      - name: Run load tests
        run: npm run load-test
      
      - name: Generate coverage report
        run: npm run test:ci
      
      - name: Upload coverage
        uses: codecov/codecov-action@v2
        with:
          files: ./coverage/lcov.info
      
      - name: Upload test results
        if: always()
        uses: actions/upload-artifact@v2
        with:
          name: test-results
          path: test-results/

  deploy:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '16'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Build application
        run: npm run build
      
      - name: Deploy to production
        run: npm run deploy:production
        env:
          DEPLOY_KEY: ${{ secrets.DEPLOY_KEY }}
```

### GitLab CI Example

```yaml
stages:
  - lint
  - test
  - load-test
  - deploy

variables:
  NODE_ENV: test

before_script:
  - npm ci

lint:
  stage: lint
  script:
    - npm run lint

unit_tests:
  stage: test
  script:
    - npm run test:unit
  coverage: '/Coverage: \d+\.\d+/'
  artifacts:
    reports:
      junit: test-results/junit.xml

integration_tests:
  stage: test
  script:
    - npm run test:integration

load_tests:
  stage: load-test
  script:
    - npm run load-test
  only:
    - main

deploy_production:
  stage: deploy
  script:
    - npm run deploy:production
  environment:
    name: production
  only:
    - main
```

---

## Quick Commands Reference

### Development
```bash
npm start          # Start application
npm run dev        # Start with auto-reload
npm run lint       # Check code style
npm run lint:fix   # Fix code style issues
```

### Testing
```bash
npm test           # Run all tests
npm run test:coverage  # Generate coverage report
npm run load-test  # Run load tests
```

### Deployment
```bash
npm run deploy:staging      # Deploy to staging
npm run deploy:production   # Deploy to production
npm run deploy:rollback     # Rollback previous deploy
```

### Monitoring
```bash
npm run monitor:health     # Check app health
npm run monitor:metrics    # View real-time metrics
npm run monitor:logs       # Stream application logs
```

### Database
```bash
npm run db:migrate    # Run database migrations
npm run db:backup     # Create backup
npm run db:restore    # Restore from backup
```

---

## Environment Variables

Create `.env` file with:

```env
# Application
NODE_ENV=production
PORT=3000
LOG_LEVEL=info

# Database
DATABASE_URL=mysql://user:password@localhost:3306/misttacker
DB_POOL_SIZE=10

# Redis
REDIS_URL=redis://localhost:6379/0
REDIS_POOL_SIZE=10

# Cache
CACHE_TTL_QUERY=600
CACHE_TTL_HEALTH=120
CACHE_TTL_METRICS=1800

# Monitoring
ENABLE_MONITORING=true
MONITORING_INTERVAL=30000

# API
API_PORT=3000
API_CORS_ORIGIN=*

# Logging
LOG_FILE=logs/app.log
LOG_MAX_SIZE=10m
```

---

## Useful One-Liners

```bash
# Quick test and deploy
npm run test:ci && npm run deploy:production

# Run tests with detailed output
npm test -- --verbose --detectOpenHandles

# Generate and open coverage report
npm run test:coverage && open coverage/index.html

# Monitor application with logs and metrics
npm run monitor & npm run monitor:logs

# Deploy with rollback option
npm run deploy:production && read -p "Rollback? (y/n)" && npm run deploy:rollback

# Full rebuild and test
npm run clean && npm install && npm run build && npm test

# Load test with custom user count
NODE_PATH=. node loadTesting.js --users=5000 --duration=60000
```

---

## Troubleshooting

### Tests hanging or timing out
```bash
# Increase timeout in jest.config.js
jest.setTimeout(60000);

# Or run with longer timeout
npm test -- --testTimeout=60000
```

### Redis connection errors
```bash
# Check Redis is running
npm run redis:info

# Restart Redis
docker restart misttacker-redis
```

### Database migration errors
```bash
# Rollback migrations
npm run db:migrate -- --rollback

# Check migration status
npm run db:migrate -- --status
```

### Coverage below target
```bash
# Find uncovered files
npm run test:coverage

# Review coverage/index.html in browser
open coverage/index.html
```

---

## Performance Tips

1. **Run tests in parallel** (default)
   ```bash
   npm test -- --maxWorkers=50%
   ```

2. **Use watch mode for development**
   ```bash
   npm run test:watch
   ```

3. **Cache npm dependencies**
   ```bash
   npm ci  # Uses package-lock.json for exact versions
   ```

4. **Monitor memory during tests**
   ```bash
   npm test -- --detectMemoryLeaks
   ```

5. **Run subset of tests**
   ```bash
   npm test -- --testNamePattern="Cache Manager"
   ```

---

## Version Information

- **Phase**: 17.3
- **Node.js**: 14+
- **npm**: 6+
- **Jest**: 29+
- **Last Updated**: April 21, 2026

---

For more information, see:
- [TESTING-GUIDE.md](TESTING-GUIDE.md)
- [DEPLOYMENT-CHECKLIST.md](DEPLOYMENT-CHECKLIST.md)
- [PHASE-17.3-FINAL-COMPLETION.md](PHASE-17.3-FINAL-COMPLETION.md)
