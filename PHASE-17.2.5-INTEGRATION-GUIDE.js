/**
 * PHASE 17.2.5 INTEGRATION GUIDE
 * 
 * Complete integration instructions for webhook and real-time notification system
 * This file shows exactly how to integrate Phase 17.2.5 components into your application
 */

// ============================================================================
// STEP 1: SERVER INITIALIZATION (main server file, e.g., server.js)
// ============================================================================

import express from 'express';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import cors from 'cors';

// Import Phase 17.2.5 modules
import { initializeEventTriggers } from './server/webhooks/event-triggers.js';
import { setupEventBroadcasting, initializeWebSocketEvents } from './server/websockets/websocket-events.js';
import { getDeliveryEngine } from './server/webhooks/webhook-delivery.js';

// Import routes
import webhookRoutes from './server/routes/webhooks.js';
import authMiddleware from './server/middleware/auth.js';

const app = express();
const httpServer = createServer(app);
const io = new SocketIOServer(httpServer, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    methods: ['GET', 'POST'],
  },
});

// ============================================================================
// STEP 1A: MIDDLEWARE SETUP
// ============================================================================

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Auth middleware
app.use('/api', authMiddleware);

// ============================================================================
// STEP 1B: INITIALIZE WEBHOOK SYSTEM
// ============================================================================

async function initializeWebhookSystem() {
  console.log('🚀 Initializing Phase 17.2.5 Webhook System...');

  // Initialize event triggers (must be called once at startup)
  await initializeEventTriggers();

  // Setup event broadcasting to WebSocket clients
  const broadcaster = setupEventBroadcasting(io);

  // Start auto-flush for webhook delivery queue
  const engine = getDeliveryEngine();
  engine.startAutoFlush();

  console.log('✅ Webhook system initialized');

  return { broadcaster, engine };
}

// ============================================================================
// STEP 2: WEBSOCKET SETUP
// ============================================================================

io.on('connection', (socket) => {
  console.log(`📱 WebSocket connected: ${socket.id}`);

  // Initialize socket event handlers for Phase 17.2.5
  initializeWebSocketEvents(socket, io);
});

// ============================================================================
// STEP 3: REGISTER ROUTES
// ============================================================================

// Register Phase 17.2.5 webhook API routes
app.use('/api', webhookRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    webhook_engine: getDeliveryEngine().queue.length + ' queued',
    timestamp: new Date().toISOString(),
  });
});

// ============================================================================
// STEP 4: SERVER STARTUP
// ============================================================================

async function startServer() {
  const PORT = process.env.PORT || 3000;

  try {
    // Initialize webhook system
    const { broadcaster, engine } = await initializeWebhookSystem();

    // Start listening
    httpServer.listen(PORT, () => {
      console.log(`\n✅ Server running on http://localhost:${PORT}`);
      console.log(`📡 WebSocket server ready for connections`);
      console.log(`🪝 Webhook API available at /api/webhooks`);
    });

    // Graceful shutdown
    process.on('SIGTERM', async () => {
      console.log('\n⏹️  Shutting down gracefully...');
      io.close();
      httpServer.close();
      await engine.flushQueue();
      process.exit(0);
    });
  } catch (err) {
    console.error('❌ Server startup failed:', err);
    process.exit(1);
  }
}

startServer();

// ============================================================================
// STEP 5: INTEGRATE EVENT TRIGGERS INTO CORE MODULES
// ============================================================================

// In your session manager (session-manager.js):
import { eventTriggers } from './server/webhooks/event-triggers.js';

class SessionManager {
  async startSession(sessionData) {
    // ... your session start logic ...

    // EMIT EVENT
    await eventTriggers.session.started(sessionData);
  }

  async completeSession(sessionData) {
    // ... your completion logic ...

    // EMIT EVENT
    await eventTriggers.session.completed(sessionData);
  }

  async pauseSession(session) {
    // ... pause logic ...
    await eventTriggers.session.paused(session);
  }

  async resumeSession(session) {
    // ... resume logic ...
    await eventTriggers.session.resumed(session);
  }

  async handleSessionError(session, error) {
    // ... error handling ...
    await eventTriggers.session.failed(session, error);
  }
}

// ============================================================================
// STEP 6: INTEGRATE CONVERGENCE DETECTION
// ============================================================================

// In your convergence detector (convergence-detector.js):
import { eventTriggers } from './server/webhooks/event-triggers.js';

class ConvergenceDetector {
  async detectConvergence(session, atom, convergenceData) {
    // ... your convergence logic ...

    // EMIT EVENT
    await eventTriggers.convergence.detected(session, atom, {
      convergence_epoch: convergenceData.epoch,
      final_accuracy: convergenceData.accuracy,
      final_loss: convergenceData.loss,
      convergence_time_ms: convergenceData.time_ms,
    });

    // Check if convergence threshold reached
    const convergedAtoms = session.milestones.filter(m => m.converged).length;
    if (convergedAtoms >= Math.ceil(session.atoms.length * 0.8)) {
      await eventTriggers.convergence.thresholdReached(session, 0.8);
    }
  }
}

// ============================================================================
// STEP 7: INTEGRATE PERFORMANCE MONITORING
// ============================================================================

// In your performance monitor (performance-monitor.js):
import { eventTriggers } from './server/webhooks/event-triggers.js';

class PerformanceMonitor {
  async checkAccuracy(session, atom, epoch, accuracy, previousAccuracy) {
    // High accuracy event
    if (accuracy > 0.9) {
      await eventTriggers.performance.accuracyHigh(session, atom, epoch, accuracy);
    }

    // Degraded accuracy event
    if (previousAccuracy && accuracy < previousAccuracy * 0.9) {
      await eventTriggers.performance.accuracyDegraded(
        session,
        atom,
        epoch,
        accuracy,
        previousAccuracy
      );
    }
  }

  async checkLoss(session, atom, epoch, loss, previousLoss) {
    // Low loss event
    if (loss < 0.1) {
      await eventTriggers.performance.lossLow(session, atom, epoch, loss);
    }

    // Loss spike event
    if (previousLoss && loss > previousLoss * 1.2) {
      await eventTriggers.performance.lossSpiked(
        session,
        atom,
        epoch,
        loss,
        previousLoss
      );
    }
  }

  async reportEpochComplete(session, epochData) {
    await eventTriggers.training.epochComplete(session, {
      epoch: epochData.epoch,
      accuracy: epochData.accuracy,
      loss: epochData.loss,
    });
  }
}

// ============================================================================
// STEP 8: INTEGRATE MILESTONE CREATION
// ============================================================================

// In your milestone manager (milestone-manager.js):
import { eventTriggers } from './server/webhooks/event-triggers.js';

class MilestoneManager {
  async recordMilestone(milestone) {
    // ... save milestone ...

    // EMIT EVENT
    await eventTriggers.milestone.created({
      _id: milestone.id,
      session_id: milestone.session_id,
      node_id: milestone.node_id,
      atom: milestone.atom,
      epoch: milestone.epoch,
      accuracy: milestone.accuracy,
      loss: milestone.loss,
    });
  }

  async recordBatch(batch) {
    // ... save batch ...

    const avgAccuracy = batch.milestones.reduce((a, b) => a + b.accuracy, 0) / batch.milestones.length;
    const avgLoss = batch.milestones.reduce((a, b) => a + b.loss, 0) / batch.milestones.length;

    // EMIT EVENT
    await eventTriggers.milestone.batchComplete({
      batch_id: batch.id,
      session_id: batch.session_id,
      milestones: batch.milestones,
      avg_accuracy: avgAccuracy,
      avg_loss: avgLoss,
    });
  }
}

// ============================================================================
// STEP 9: INTEGRATE SYSTEM MONITORING
// ============================================================================

// In your system monitor (system-monitor.js):
import { eventTriggers } from './server/webhooks/event-triggers.js';

class SystemMonitor {
  async monitorNodeHealth(nodeId) {
    // ... check node health ...

    // Node came online
    if (wasOffline && isNowOnline) {
      await eventTriggers.system.nodeOnline(nodeId, {
        capacity: node.capacity,
      });
    }

    // Node went offline
    if (wasOnline && isNowOffline) {
      await eventTriggers.system.nodeOffline(nodeId, downtimeMs, activeSessions);
    }
  }

  async sendHealthCheck(health) {
    await eventTriggers.system.healthCheck({
      status: health.status,
      uptime_ms: health.uptime_ms,
      active_sessions: health.active_sessions,
      memory_usage_mb: health.memory_usage_mb,
    });
  }
}

// ============================================================================
// STEP 10: INTEGRATE USER EVENTS
// ============================================================================

// In your authentication (auth.js):
import { eventTriggers } from './server/webhooks/event-triggers.js';

router.post('/login', async (req, res) => {
  // ... login logic ...

  // EMIT LOGIN EVENT
  await eventTriggers.user.login(user.id, {
    ip_address: req.ip,
    user_agent: req.get('user-agent'),
  });

  res.json({ token: accessToken });
});

router.post('/logout', requireAuth, async (req, res) => {
  // EMIT LOGOUT EVENT
  await eventTriggers.user.logout(req.user.id);

  res.json({ message: 'Logged out' });
});

router.post('/api-keys', requireAuth, async (req, res) => {
  // ... create API key ...

  // EMIT EVENT
  await eventTriggers.user.apiKeyCreated(req.user.id, req.body.name);

  res.json({ api_key: 'sk_...' });
});

// ============================================================================
// STEP 11: EXAMPLE CLIENT-SIDE WEBSOCKET INTEGRATION
// ============================================================================

// In your client app (e.g., React component):
import { useEffect, useState } from 'react';
import io from 'socket.io-client';

function Dashboard() {
  const [sessions, setSessions] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    // Connect to WebSocket server
    const newSocket = io('http://localhost:3000', {
      auth: {
        userId: localStorage.getItem('userId'),
        token: localStorage.getItem('access_token'),
      },
    });

    newSocket.on('connect', () => {
      console.log('Connected to server');

      // Subscribe to session topic
      newSocket.emit('subscribe:topic', { topic: 'sessions' });

      // Subscribe to convergence topic
      newSocket.emit('subscribe:topic', { topic: 'convergence' });
    });

    // Listen for session events
    newSocket.on('session:started', (data) => {
      console.log('Session started:', data);
      setSessions(prev => [...prev, data]);
      setNotifications(prev => [...prev, {
        type: 'session_started',
        message: 'Training session started',
        timestamp: new Date(),
      }]);
    });

    newSocket.on('session:progress', (data) => {
      console.log('Progress:', data);
      setSessions(prev => prev.map(s =>
        s.session_id === data.session_id ? { ...s, ...data } : s
      ));
    });

    newSocket.on('convergence:detected', (data) => {
      console.log('Convergence detected:', data);
      setNotifications(prev => [...prev, {
        type: 'convergence',
        message: `Atom ${data.atom} converged in ${data.convergence_time_ms}ms`,
        timestamp: new Date(),
      }]);
    });

    newSocket.on('session:completed', (data) => {
      console.log('Session completed:', data);
      setNotifications(prev => [...prev, {
        type: 'session_completed',
        message: `Session completed with ${(data.final_accuracy * 100).toFixed(2)}% accuracy`,
        timestamp: new Date(),
      }]);
    });

    setSocket(newSocket);

    return () => newSocket.close();
  }, []);

  return (
    <div>
      <h1>Dashboard</h1>
      <div className="notifications">
        {notifications.map((n, i) => (
          <div key={i} className={`notification ${n.type}`}>
            {n.message}
          </div>
        ))}
      </div>
      <div className="sessions">
        {sessions.map(s => (
          <div key={s.session_id} className="session">
            <h3>Session {s.session_id}</h3>
            <p>Accuracy: {(s.accuracy * 100).toFixed(2)}%</p>
            <p>Loss: {s.loss.toFixed(4)}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Dashboard;

// ============================================================================
// STEP 12: VERIFY INTEGRATION
// ============================================================================

/**
 * Verification Checklist:
 * 
 * [ ] Event triggers initialized in server startup
 * [ ] WebSocket event broadcasting setup
 * [ ] API routes registered
 * [ ] Session manager calls eventTriggers.session.* methods
 * [ ] Convergence detector calls eventTriggers.convergence.* methods
 * [ ] Performance monitor calls eventTriggers.performance.* methods
 * [ ] Milestone manager calls eventTriggers.milestone.* methods
 * [ ] System monitor calls eventTriggers.system.* methods
 * [ ] Auth routes call eventTriggers.user.* methods
 * [ ] Client WebSocket subscriptions working
 * [ ] Webhook registration API tested
 * [ ] Webhook delivery tested
 * [ ] WebSocket events received by clients
 * [ ] Delivery history populates
 * [ ] Health check endpoint returns webhook status
 */

// ============================================================================
// ENVIRONMENT VARIABLES (.env)
// ============================================================================

/**
WEBHOOK_MAX_ATTEMPTS=5
WEBHOOK_TIMEOUT_MS=30000
WEBHOOK_BATCH_SIZE=100
WEBHOOK_FLUSH_INTERVAL=5000
WEBHOOK_BACKOFF_MULTIPLIER=2

MONGODB_URI=mongodb://localhost/misttracker  (or)
DATABASE_URL=postgresql://user:pass@localhost/misttracker

JWT_SECRET=your-secret-key
JWT_EXPIRY=24h

FRONTEND_URL=http://localhost:3000
 */

// ============================================================================
// VERIFY WITH CURL EXAMPLES
// ============================================================================

/**
# 1. Register a webhook
curl -X POST http://localhost:3000/api/webhooks \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://example.com/webhook",
    "events": ["session.completed"],
    "name": "Test Webhook"
  }'

# 2. Test webhook delivery
curl -X POST http://localhost:3000/api/webhooks/WH_ID/test \
  -H "Authorization: Bearer YOUR_TOKEN"

# 3. List webhooks
curl http://localhost:3000/api/webhooks \
  -H "Authorization: Bearer YOUR_TOKEN"

# 4. View delivery history
curl http://localhost:3000/api/webhooks/WH_ID/deliveries \
  -H "Authorization: Bearer YOUR_TOKEN"

# 5. Check server health
curl http://localhost:3000/health
 */

export default {};
