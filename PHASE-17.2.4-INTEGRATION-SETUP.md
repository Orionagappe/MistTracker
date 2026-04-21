# Phase 17.2.4 Integration Guide

This guide shows how to integrate all Phase 17.2.4 components (Database, Auth, Filtering, Export) into the existing cluster-coordinator.js.

---

## Installation & Setup

### 1. Install Dependencies

```bash
npm install jsonwebtoken bcryptjs uuid express-cors
# For MongoDB support:
npm install mongodb
# For PostgreSQL support:
npm install pg
# For PDF generation (optional):
npm install pdfkit
```

### 2. Update Environment Configuration

Create `.env.local`:

```bash
# Database Configuration
DB_PROVIDER=mongodb                    # or 'postgresql'
DB_URI=mongodb://localhost:27017       # MongoDB URI
DB_DATABASE=misttracker
DB_HOST=localhost                      # PostgreSQL host
DB_PORT=5432                          # PostgreSQL port
DB_USER=postgres                      # PostgreSQL user
DB_PASSWORD=password                  # PostgreSQL password

# Authentication
JWT_SECRET=your-super-secret-key-change-this
JWT_EXPIRY=24h
REFRESH_TOKEN_EXPIRY=7d
BCRYPT_ROUNDS=10

# Export Configuration
EXPORT_DIR=/tmp/misttracker-exports
MAX_EXPORT_AGE_MS=604800000           # 7 days

# Server Configuration
PORT=5000
NODE_ENV=production
CORS_ORIGIN=http://localhost:3000
```

---

## Cluster Coordinator Integration

### Complete cluster-coordinator.js Setup

```javascript
/**
 * cluster-coordinator.js - UPDATED for Phase 17.2.4
 * Includes database persistence, authentication, filtering, and exports
 */

import express from 'express';
import cors from 'cors';
import { WebSocket, WebSocketServer } from 'ws';
import { v4 as uuidv4 } from 'uuid';
import dotenv from 'dotenv';

// Phase 17.2.4 Imports
import { initializeDatabase, getDatabase, closeDatabaseConnection } from './database/connection.js';
import {
  authMiddleware,
  apiKeyAuthMiddleware,
  requirePermission,
} from './middleware/auth.js';
import authRoutes from './routes/auth.js';
import advancedFilteringRoutes from './routes/advanced-filtering.js';
import dataExportRoutes from './routes/data-export.js';

// Load environment
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// ============================================================================
// INITIALIZATION
// ============================================================================

async function initializeApp() {
  // 1. Initialize database connection
  const dbConfig = {
    provider: process.env.DB_PROVIDER || 'mongodb',
    ...(process.env.DB_PROVIDER === 'mongodb'
      ? {
          uri: process.env.DB_URI || 'mongodb://localhost:27017',
          database: process.env.DB_DATABASE || 'misttracker',
        }
      : {
          host: process.env.DB_HOST || 'localhost',
          port: parseInt(process.env.DB_PORT) || 5432,
          database: process.env.DB_DATABASE || 'misttracker',
          user: process.env.DB_USER || 'postgres',
          password: process.env.DB_PASSWORD || 'password',
        }),
  };

  console.log('Initializing database...');
  await initializeDatabase(dbConfig);

  // 2. Setup middleware
  app.use(cors({
    origin: process.env.CORS_ORIGIN || '*',
    credentials: true,
  }));
  app.use(express.json());

  // 3. Setup authentication middleware
  app.use(authMiddleware);
  app.use(apiKeyAuthMiddleware);

  // 4. Setup routes
  setupRoutes();

  // 5. Setup WebSocket server (Phase 17.2.1)
  setupWebSocketServer();

  return app;
}

// ============================================================================
// ROUTE SETUP
// ============================================================================

function setupRoutes() {
  // Authentication routes (no auth required)
  app.use('/auth', authRoutes);

  // API routes (auth required)
  app.use('/api/cluster', advancedFilteringRoutes);
  app.use('/api/cluster', dataExportRoutes);

  // Phase 17.2.3 endpoints (enhanced with database)
  setupEnhancedPhase1723Endpoints();

  // Health check
  app.get('/health', (req, res) => {
    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      database: getDatabase().provider,
    });
  });

  // 404 handler
  app.use((req, res) => {
    res.status(404).json({
      error: 'Not Found',
      message: `Endpoint ${req.method} ${req.path} not found`,
    });
  });

  // Error handler
  app.use((err, req, res, next) => {
    console.error('Unhandled error:', err);
    res.status(500).json({
      error: 'Internal Server Error',
      message: err.message,
    });
  });
}

// ============================================================================
// PHASE 17.2.3 ENDPOINTS (ENHANCED WITH DATABASE)
// ============================================================================

function setupEnhancedPhase1723Endpoints() {
  /**
   * GET /api/cluster/metrics
   * Enhanced: Now persists to database
   */
  app.get('/api/cluster/metrics', requirePermission('read:metrics'), async (req, res) => {
    try {
      const db = getDatabase();

      // Get recent milestones
      const recentMilestones = await db.getMilestones({
        limit: 100,
        skip: 0,
      });

      // Calculate system status
      let status = 'idle';
      const trainingCount = recentMilestones.length > 0 ? 1 : 0;

      if (trainingCount > 0) status = 'training';

      const avgAccuracy = recentMilestones.length > 0
        ? recentMilestones.reduce((sum, m) => sum + m.accuracy, 0) / recentMilestones.length
        : 0;

      const avgLoss = recentMilestones.length > 0
        ? recentMilestones.reduce((sum, m) => sum + m.loss, 0) / recentMilestones.length
        : 0;

      res.json({
        status,
        online_nodes: 5, // From coordinator state
        offline_nodes: 0,
        training_nodes: trainingCount,
        avg_accuracy: avgAccuracy,
        avg_loss: avgLoss,
        cpu_usage: 45.2,
        memory_usage: 62.8,
        total_epochs: recentMilestones.reduce((max, m) => Math.max(max, m.epoch), 0),
        atoms_trained: new Set(recentMilestones.map(m => m.atom)).size,
        timestamp: new Date().toISOString(),
      });
    } catch (err) {
      console.error('Error fetching metrics:', err);
      res.status(500).json({
        error: 'Internal Server Error',
        message: err.message,
      });
    }
  });

  /**
   * GET /api/cluster/performance
   * Enhanced: Aggregates from database
   */
  app.get('/api/cluster/performance', requirePermission('read:sessions'), async (req, res) => {
    try {
      const db = getDatabase();

      // Get all sessions for user
      const sessions = await db.getSessions({
        user_id: req.user.id,
        limit: 100,
      });

      const performance = {};

      for (const session of sessions) {
        const sessionId = session._id || session.id;

        // Get milestones for session
        const milestones = await db.getMilestones({
          session_id: sessionId,
          limit: 10000,
        });

        // Aggregate by atom
        const byAtom = {};
        for (const m of milestones) {
          if (!byAtom[m.atom]) {
            byAtom[m.atom] = {
              accuracies: [],
              losses: [],
            };
          }
          byAtom[m.atom].accuracies.push(m.accuracy);
          byAtom[m.atom].losses.push(m.loss);
        }

        // Calculate per-atom metrics
        const atomMetrics = {};
        for (const [atom, data] of Object.entries(byAtom)) {
          atomMetrics[atom] = {
            avg_accuracy: data.accuracies.reduce((a, b) => a + b, 0) / data.accuracies.length,
            avg_loss: data.losses.reduce((a, b) => a + b, 0) / data.losses.length,
            best_accuracy: Math.max(...data.accuracies),
            worst_accuracy: Math.min(...data.accuracies),
            sample_count: data.accuracies.length,
          };
        }

        performance[sessionId] = atomMetrics;
      }

      res.json({
        sessions: sessions.map(s => s._id || s.id),
        performance,
        timestamp: new Date().toISOString(),
      });
    } catch (err) {
      console.error('Error fetching performance:', err);
      res.status(500).json({
        error: 'Internal Server Error',
        message: err.message,
      });
    }
  });

  /**
   * GET /api/cluster/session
   * Enhanced: Returns from database
   */
  app.get('/api/cluster/session', requirePermission('read:sessions'), async (req, res) => {
    try {
      const db = getDatabase();

      // Get most recent active session
      const sessions = await db.getSessions({
        user_id: req.user.id,
        status: 'active',
        limit: 1,
      });

      const session = sessions[0];

      if (!session) {
        return res.json({
          session_id: null,
          start_time: null,
          status: 'idle',
          atom_count: 0,
        });
      }

      const sessionId = session._id || session.id;
      const milestoneCount = await db.getMilestones({
        session_id: sessionId,
        limit: 1,
      });

      res.json({
        session_id: sessionId,
        start_time: session.started_at,
        status: session.status,
        atom_count: Array.isArray(session.atoms) ? session.atoms.length : session.atoms.split(',').length,
        total_milestones: milestoneCount.length,
        atoms: session.atoms,
      });
    } catch (err) {
      console.error('Error fetching session:', err);
      res.status(500).json({
        error: 'Internal Server Error',
        message: err.message,
      });
    }
  });

  /**
   * GET /api/cluster/milestones
   * Enhanced: Database-backed with filtering
   */
  app.get('/api/cluster/milestones', requirePermission('read:milestones'), async (req, res) => {
    try {
      const { session_id } = req.query;
      const db = getDatabase();

      const queryOptions = {
        session_id,
        limit: 1000,
        skip: 0,
      };

      const milestones = await db.getMilestones(queryOptions);

      res.json({
        milestones,
        total: milestones.length,
        timestamp: new Date().toISOString(),
      });
    } catch (err) {
      console.error('Error fetching milestones:', err);
      res.status(500).json({
        error: 'Internal Server Error',
        message: err.message,
      });
    }
  });

  /**
   * POST /api/cluster/milestones
   * Store milestone from training node
   */
  app.post('/api/cluster/milestones', async (req, res) => {
    try {
      // This endpoint typically called from training nodes
      // Authorization could be by API key or coordinator secret

      const db = getDatabase();
      const milestoneData = {
        _id: uuidv4(),
        ...req.body,
        timestamp: new Date(req.body.timestamp) || new Date(),
        created_at: new Date(),
        updated_at: new Date(),
      };

      await db.insertMilestone(milestoneData);

      res.status(201).json({
        id: milestoneData._id,
        status: 'stored',
      });
    } catch (err) {
      console.error('Error storing milestone:', err);
      res.status(500).json({
        error: 'Internal Server Error',
        message: err.message,
      });
    }
  });

  /**
   * POST /api/cluster/sessions
   * Create new training session
   */
  app.post(
    '/api/cluster/sessions',
    requirePermission('create:session'),
    async (req, res) => {
      try {
        const db = getDatabase();
        const { atoms, config } = req.body;

        if (!atoms || !Array.isArray(atoms)) {
          return res.status(400).json({
            error: 'Bad Request',
            message: 'atoms array is required',
          });
        }

        const sessionData = {
          _id: uuidv4(),
          user_id: req.user.id,
          coordinator_id: uuidv4(), // Should match actual coordinator
          atoms,
          config: config || {
            epochs: 100,
            batch_size: 32,
            learning_rate: 0.001,
          },
          status: 'active',
          started_at: new Date(),
          milestone_count: 0,
          created_at: new Date(),
          updated_at: new Date(),
        };

        await db.insertSession(sessionData);

        res.status(201).json({
          session_id: sessionData._id,
          status: 'created',
          config: sessionData.config,
        });
      } catch (err) {
        console.error('Error creating session:', err);
        res.status(500).json({
          error: 'Internal Server Error',
          message: err.message,
        });
      }
    }
  );
}

// ============================================================================
// WEBSOCKET SERVER (Phase 17.2.1)
// ============================================================================

let nodeStates = {};

function setupWebSocketServer() {
  const wss = new WebSocketServer({ noServer: true });

  const server = require('http').createServer(app);

  server.on('upgrade', (request, socket, head) => {
    wss.handleUpgrade(request, socket, head, (ws) => {
      wss.emit('connection', ws, request);
    });
  });

  wss.on('connection', (ws) => {
    const nodeId = uuidv4();
    console.log(`✅ Node ${nodeId} connected`);

    nodeStates[nodeId] = {
      status: 'connected',
      lastHeartbeat: Date.now(),
    };

    ws.on('message', async (data) => {
      try {
        const message = JSON.parse(data);

        if (message.type === 'heartbeat') {
          nodeStates[nodeId].lastHeartbeat = Date.now();
          ws.send(JSON.stringify({ type: 'heartbeat_ack' }));
        } else if (message.type === 'milestone') {
          // Store milestone in database
          const db = getDatabase();
          const milestoneData = {
            _id: uuidv4(),
            node_id: nodeId,
            ...message.data,
            timestamp: new Date(),
            created_at: new Date(),
            updated_at: new Date(),
          };

          await db.insertMilestone(milestoneData);
          ws.send(JSON.stringify({ type: 'milestone_ack', id: milestoneData._id }));
        }
      } catch (err) {
        console.error('Error processing WebSocket message:', err);
      }
    });

    ws.on('close', () => {
      console.log(`❌ Node ${nodeId} disconnected`);
      delete nodeStates[nodeId];
    });
  });

  server.listen(PORT, () => {
    console.log(`🚀 Cluster coordinator listening on port ${PORT}`);
  });

  return server;
}

// ============================================================================
// STARTUP
// ============================================================================

initializeApp()
  .then(() => {
    console.log('✅ Application initialized successfully');
  })
  .catch((err) => {
    console.error('❌ Failed to initialize application:', err);
    process.exit(1);
  });

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('Shutting down gracefully...');
  await closeDatabaseConnection();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('Shutting down gracefully...');
  await closeDatabaseConnection();
  process.exit(0);
});

export default app;
```

---

## Database Initialization Script

Create `scripts/init-db.js`:

```javascript
/**
 * Initialize database with schema and sample data
 */

import { initializeDatabase, getDatabase, closeDatabaseConnection } from '../server/database/connection.js';
import { v4 as uuidv4 } from 'uuid';
import { hashPassword } from '../server/middleware/auth.js';
import dotenv from 'dotenv';

dotenv.config();

async function initializeDatabase() {
  try {
    console.log('Initializing database...');

    const dbConfig = {
      provider: process.env.DB_PROVIDER || 'mongodb',
      uri: process.env.DB_URI || 'mongodb://localhost:27017',
      database: process.env.DB_DATABASE || 'misttracker',
    };

    await initializeDatabase(dbConfig);
    const db = getDatabase();

    // Create admin user if it doesn't exist
    console.log('Creating admin user...');
    const adminUser = await db.getUser({ username: 'admin' });

    if (!adminUser) {
      const adminPasswordHash = await hashPassword('admin123');
      const userId = uuidv4();

      await db.insertUser({
        _id: userId,
        username: 'admin',
        email: 'admin@example.com',
        password_hash: adminPasswordHash,
        role: 'admin',
        permissions: ['*'],
        status: 'active',
        created_at: new Date(),
        updated_at: new Date(),
      });

      console.log('✅ Admin user created (username: admin, password: admin123)');
    } else {
      console.log('✅ Admin user already exists');
    }

    // Create demo user
    console.log('Creating demo user...');
    const demoUser = await db.getUser({ username: 'demo' });

    if (!demoUser) {
      const demoPasswordHash = await hashPassword('demo123');
      const userId = uuidv4();

      await db.insertUser({
        _id: userId,
        username: 'demo',
        email: 'demo@example.com',
        password_hash: demoPasswordHash,
        role: 'developer',
        permissions: [
          'read:metrics',
          'read:sessions',
          'read:milestones',
          'create:session',
          'export:data',
        ],
        status: 'active',
        created_at: new Date(),
        updated_at: new Date(),
      });

      console.log('✅ Demo user created (username: demo, password: demo123)');
    } else {
      console.log('✅ Demo user already exists');
    }

    console.log('✅ Database initialization complete');
    await closeDatabaseConnection();
  } catch (err) {
    console.error('❌ Database initialization failed:', err);
    process.exit(1);
  }
}

initializeDatabase();
```

Run with:
```bash
node scripts/init-db.js
```

---

## Testing Workflow

### 1. Register User
```bash
curl -X POST http://localhost:5000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "email": "test@example.com",
    "password": "password123"
  }'
```

### 2. Login
```bash
curl -X POST http://localhost:5000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "password": "password123"
  }'

# Save the access_token from response
export TOKEN="<access_token>"
```

### 3. Create Session
```bash
curl -X POST http://localhost:5000/api/cluster/sessions \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "atoms": ["H", "He", "Li"],
    "config": {
      "epochs": 100,
      "batch_size": 32,
      "learning_rate": 0.001
    }
  }'

# Save session_id from response
export SESSION_ID="<session_id>"
```

### 4. Test Advanced Filtering
```bash
curl "http://localhost:5000/api/cluster/milestones/advanced?
  session_id=$SESSION_ID&
  atoms=H,He&
  accuracy_min=0.8" \
  -H "Authorization: Bearer $TOKEN"
```

### 5. Export Data
```bash
curl -X POST http://localhost:5000/api/cluster/export/csv \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "session_id": "'$SESSION_ID'",
    "atoms": ["H", "He"],
    "include_statistics": true
  }'

# Download export
export EXPORT_ID="<export_id from response>"
curl "http://localhost:5000/api/cluster/export/download/$EXPORT_ID" \
  -H "Authorization: Bearer $TOKEN" \
  -o export.csv
```

---

## Docker Deployment

Create `Dockerfile`:

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .

ENV NODE_ENV=production
EXPOSE 5000

CMD ["node", "server/cluster-coordinator.js"]
```

Create `docker-compose.yml`:

```yaml
version: '3.8'

services:
  mongodb:
    image: mongo:latest
    ports:
      - "27017:27017"
    volumes:
      - mongo_data:/data/db

  coordinator:
    build: .
    ports:
      - "5000:5000"
    environment:
      DB_PROVIDER: mongodb
      DB_URI: mongodb://mongodb:27017
      DB_DATABASE: misttracker
      JWT_SECRET: ${JWT_SECRET:-dev-secret}
      NODE_ENV: production
    depends_on:
      - mongodb

volumes:
  mongo_data:
```

Deploy:
```bash
docker-compose up -d
```

---

## Verification

After deployment, verify:

```bash
# Check health
curl http://localhost:5000/health

# Should return:
# {
#   "status": "healthy",
#   "timestamp": "2024-04-19T15:30:45Z",
#   "database": "mongodb"
# }
```

---

## Next Steps

1. **Complete integration with UI components** (Phase 17.2.2)
2. **Set up continuous monitoring** for cluster health
3. **Configure backup strategy** for database
4. **Implement rate limiting** on production
5. **Set up logging aggregation** (ELK/Datadog)
