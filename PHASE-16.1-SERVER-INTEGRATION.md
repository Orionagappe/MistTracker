# Phase 16.1: Server Integration Guide
## How to Integrate the Milestone System into server.js

**For**: Backend engineers, DevOps  
**Time**: 15 minutes  
**Files to Modify**: `server.js`, `package.json`

---

## Overview

Phase 16.1 provides three new server-side files:
1. `server/schema-milestones-phases17-25.sql` - Database schema
2. `server/phaseMilestones.js` - Milestone definitions
3. `server/enhancedMilestoneManager.js` - Manager class
4. `server/milestoneRoutes.js` - API endpoints

To activate, you need to:
1. ✅ Create database tables (run SQL)
2. ✅ Import and initialize in server.js
3. ✅ Mount the API routes
4. ✅ Verify endpoints are accessible

---

## Step 1: Database Initialization

### Option A: Direct SQL Execution

```bash
# Connect to MySQL and run the schema
mysql -u root -p mist_tracker < server/schema-milestones-phases17-25.sql
```

### Option B: From Node.js

In your database initialization code:

```javascript
import fs from 'fs';
import { query } from './database.js';

async function initializeMilestoneSchema() {
  const schemaSQL = fs.readFileSync(
    './server/schema-milestones-phases17-25.sql',
    'utf-8'
  );
  
  try {
    // Split by ';' and execute each statement
    const statements = schemaSQL.split(';').filter(s => s.trim());
    for (const stmt of statements) {
      await query(stmt);
    }
    console.log('✅ Milestone schema initialized');
  } catch (error) {
    console.error('❌ Schema initialization failed:', error);
    throw error;
  }
}
```

### Verify Installation

```bash
mysql -u root -p mist_tracker -e "SELECT COUNT(*) as table_count FROM information_schema.tables WHERE table_schema='mist_tracker' AND table_name LIKE 'milestone%';"

# Should show: 10 tables
```

---

## Step 2: Update server.js

### Add Imports (at top of file)

```javascript
// Near other imports
import { initMilestoneManager, router as milestoneRouter } from './milestoneRoutes.js';
```

### Initialize Milestone Manager

Add after your database connection is established:

```javascript
// After: const db = await createDatabaseConnection();
// And after: const dbPool = mysql.createPool({ ... });

// Initialize Milestone System
let milestoneManager;
try {
  milestoneManager = initMilestoneManager(dbPool);
  console.log('✅ Milestone Manager initialized');
} catch (error) {
  console.error('❌ Milestone Manager initialization failed:', error);
  // Don't crash - milestone system is optional
}
```

### Mount API Routes

Add after other route mounts:

```javascript
// After: app.use('/api/v1/users', userRoutes);
// Add milestone routes:

if (milestoneManager) {
  app.use('/api/v1/milestones', milestoneRouter);
  console.log('✅ Milestone API routes mounted at /api/v1/milestones');
}
```

---

## Step 3: Update package.json (if needed)

The milestone system has minimal dependencies. Ensure these are already installed:

```json
{
  "dependencies": {
    "express": "^4.18.0",
    "mysql2": "^2.3.0",
    "uuid": "^9.0.0"
  }
}
```

If `uuid` is missing:
```bash
npm install uuid
```

---

## Step 4: Complete server.js Example

Here's how the relevant section should look:

```javascript
// ============================================
// IMPORTS
// ============================================
import express from 'express';
import mysql from 'mysql2/promise';
import cors from 'cors';
import { fileURLToPath } from 'url';

// Milestone System
import { 
  initMilestoneManager, 
  router as milestoneRouter 
} from './milestoneRoutes.js';

// ============================================
// DATABASE CONNECTION
// ============================================
const dbPool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME || 'mist_tracker',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

console.log('✅ Database pool created');

// ============================================
// EXPRESS APP SETUP
// ============================================
const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// ============================================
// MILESTONE SYSTEM INITIALIZATION
// ============================================
let milestoneManager;

async function initializeMilestoneSystem() {
  try {
    // Initialize milestone manager
    milestoneManager = initMilestoneManager(dbPool);
    console.log('✅ Milestone Manager initialized');
    
    // Mount API routes
    app.use('/api/v1/milestones', milestoneRouter);
    console.log('✅ Milestone API routes mounted at /api/v1/milestones');
    
    return true;
  } catch (error) {
    console.error('⚠️  Milestone system initialization failed (non-critical):', error);
    return false;
  }
}

// ============================================
// API ROUTES
// ============================================
// Initialize milestone system (runs when server starts)
await initializeMilestoneSystem();

// Other API routes...
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/sessions', sessionRoutes);
// ... etc

// ============================================
// HEALTH CHECK ENDPOINT
// ============================================
app.get('/api/v1/health', (req, res) => {
  res.json({
    status: 'operational',
    timestamp: new Date().toISOString(),
    services: {
      database: 'connected',
      milestones: milestoneManager ? 'initialized' : 'not initialized'
    }
  });
});

// ============================================
// ERROR HANDLING
// ============================================
app.use((err, req, res, next) => {
  console.error('API Error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
    timestamp: new Date().toISOString()
  });
});

// ============================================
// SERVER STARTUP
// ============================================
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`
╔═══════════════════════════════════════╗
║  MistTracker Server Starting          ║
║  Version: Phase 16.1+                 ║
║  Port: ${PORT}                          ║
║  Milestone System: ✅ Active           ║
╚═══════════════════════════════════════╝
  `);
});
```

---

## Step 5: Verification Tests

### Test 1: Server Starts Without Errors

```bash
npm start
# Should see:
# ✅ Database pool created
# ✅ Milestone Manager initialized
# ✅ Milestone API routes mounted at /api/v1/milestones
```

### Test 2: Health Check Endpoint

```bash
curl http://localhost:3000/api/v1/health

# Expected response:
# {
#   "status": "operational",
#   "timestamp": "2026-04-18T14:32:15.123Z",
#   "services": {
#     "database": "connected",
#     "milestones": "initialized"
#   }
# }
```

### Test 3: Phase List Endpoint

```bash
curl http://localhost:3000/api/v1/milestones/phases

# Expected response:
# {
#   "phases": [
#     { "phase": 17, "domain": "Atomic", "status": "ready", "milestones": 12 },
#     { "phase": 18, "domain": "Subatomic", "status": "ready", "milestones": 8 },
#     ...
#   ]
# }
```

### Test 4: Create Research Session

```bash
curl -X POST http://localhost:3000/api/v1/milestones/research-sessions \
  -H "Content-Type: application/json" \
  -d '{
    "phase": 17,
    "targetObject": "Hydrogen",
    "theoryModel": "Bohr",
    "userId": 1
  }'

# Expected: 201 Created with session_id in response
```

### Test 5: Create Milestone

```bash
# Get session_id from previous test, then:

curl -X POST http://localhost:3000/api/v1/milestones/milestones \
  -H "Content-Type: application/json" \
  -d '{
    "phase": 17,
    "sessionId": "session-17-YOUR-SESSION-ID",
    "type": "THEORY_DEFINED",
    "metadata": {
      "atom_type": "H",
      "model_type": "Bohr",
      "parameters": { "orbital_radius": 0.53 }
    }
  }'

# Expected: 201 Created with milestone_id
```

---

## Step 6: Environment Configuration

Update your `.env` file (if using):

```env
# Database
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=mist_tracker

# Server
PORT=3000
NODE_ENV=development

# Milestone System
MILESTONE_SYSTEM=enabled
MILESTONE_DB_TIMEOUT=5000
```

Optional: Add configuration in `server.js`:

```javascript
const MILESTONE_CONFIG = {
  enabled: process.env.MILESTONE_SYSTEM !== 'disabled',
  dbTimeout: parseInt(process.env.MILESTONE_DB_TIMEOUT || '5000'),
  logLevel: process.env.LOG_LEVEL || 'info'
};
```

---

## Troubleshooting

### Problem: "Cannot find module './phaseMilestones.js'"

**Solution**: Ensure all 4 files are in `server/` directory:
- `server/phaseMilestones.js`
- `server/enhancedMilestoneManager.js`
- `server/milestoneRoutes.js`
- `server/schema-milestones-phases17-25.sql`

### Problem: "Database table doesn't exist: milestone_types"

**Solution**: Run the SQL schema:
```bash
mysql -u root -p mist_tracker < server/schema-milestones-phases17-25.sql
```

### Problem: "TypeError: initMilestoneManager is not a function"

**Solution**: Check the import statement:
```javascript
// WRONG:
import milestoneRoutes from './milestoneRoutes.js';
milestoneRoutes.initMilestoneManager(dbPool);

// CORRECT:
import { initMilestoneManager, router } from './milestoneRoutes.js';
const manager = initMilestoneManager(dbPool);
app.use('/api/v1/milestones', router);
```

### Problem: "Cannot create connection pool"

**Solution**: Verify database credentials:
```bash
# Test connection
mysql -h localhost -u root -p -e "SELECT 1;"
```

### Problem: 500 Error on Milestone Creation

**Solution**: Check server logs for validation errors:
```bash
# Run with debug logging
DEBUG=* npm start
```

---

## Optional: Docker Integration

If using Docker, add to `docker-compose.yml`:

```yaml
services:
  mist-db:
    image: mysql:8.0
    environment:
      MYSQL_ROOT_PASSWORD: root_password
      MYSQL_DATABASE: mist_tracker
    volumes:
      - ./server/schema-milestones-phases17-25.sql:/docker-entrypoint-initdb.d/milestone-schema.sql
    ports:
      - "3306:3306"

  mist-server:
    build: .
    depends_on:
      - mist-db
    environment:
      DB_HOST: mist-db
      DB_USER: root
      DB_PASSWORD: root_password
      DB_NAME: mist_tracker
      PORT: 3000
    ports:
      - "3000:3000"
```

---

## Optional: Monitoring & Logging

Add structured logging for milestone operations:

```javascript
// In server.js
import winston from 'winston';

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'logs/milestone-system.log' })
  ]
});

// When initializing
try {
  milestoneManager = initMilestoneManager(dbPool);
  logger.info('Milestone Manager initialized successfully');
} catch (error) {
  logger.error('Milestone Manager initialization failed', error);
}
```

---

## Verification Checklist

- [ ] SQL schema executed without errors
- [ ] All 4 milestone files present in `server/` directory
- [ ] `uuid` package installed
- [ ] `server.js` imports milestone modules
- [ ] `initMilestoneManager()` called after DB connection
- [ ] Milestone routes mounted at `/api/v1/milestones`
- [ ] Server starts without errors
- [ ] `/api/v1/health` returns operational status
- [ ] Can create research session
- [ ] Can create milestone
- [ ] Progress endpoint returns valid data

---

## Next Steps

Once integrated:

1. ✅ Create Phase 17 research session
2. ✅ Start defining hydrogen atom theory
3. ✅ Begin atomic physics validation
4. ✅ Track progress through milestone system
5. ✅ Generate proxies for physics acceleration
6. ✅ Document any new physics discovered

See [PHASE-16-1-QUICK-REFERENCE.md](PHASE-16-1-QUICK-REFERENCE.md) for usage examples.

---

**Integration Time**: ~15 minutes  
**Ready for Phase 17**: Once verified ✅
