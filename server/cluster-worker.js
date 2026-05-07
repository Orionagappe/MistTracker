/**
 * Cluster Worker Node
 * Phase 17.2.1: Worker node for distributed atom proxy training
 * 
 * Responsibilities:
 * - Register with cluster coordinator
 * - Handle training for assigned atom
 * - Send heartbeats and milestones to coordinator
 * - Simulate or execute proxy training
 */

import express from 'express';
import cors from 'cors';
import WebSocket from 'ws';
import { v4 as uuidv4 } from 'uuid';
import http from 'http';

const NODE_ID = process.env.NODE_ID || 'worker-unknown';
const ATOM_TYPE = process.env.ATOM_TYPE || 'H';
const COORDINATOR_HOST = process.env.COORDINATOR_HOST || 'localhost';
const COORDINATOR_PORT = process.env.COORDINATOR_PORT || 5000;
const WORKER_PORT = process.env.WORKER_PORT || 5000;

const app = express();
const server = http.createServer(app);

// Middleware
app.use(cors());
app.use(express.json());

// ============================================================================
// WORKER STATE MANAGEMENT
// ============================================================================

const workerState = {
  worker_id: uuidv4(),
  node_id: NODE_ID,
  atom: ATOM_TYPE,
  status: 'initializing',
  coordinator_connected: false,
  current_session_id: null,
  training_active: false,
  current_epoch: 0,
  total_epochs: 0,
  loss: 0.5,
  accuracy: 0.5,
  milestones_sent: 0,
  training_start_time: null,
};

let coordinatorWs = null;

// ============================================================================
// HEALTH CHECK
// ============================================================================

app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    worker_id: workerState.worker_id,
    node_id: NODE_ID,
    atom: ATOM_TYPE,
    timestamp: new Date().toISOString(),
  });
});

app.get('/api/worker/status', (req, res) => {
  res.json({
    worker_id: workerState.worker_id,
    node_id: NODE_ID,
    atom: ATOM_TYPE,
    coordinator_connected: workerState.coordinator_connected,
    training_active: workerState.training_active,
    current_epoch: workerState.current_epoch,
    total_epochs: workerState.total_epochs,
    loss: workerState.loss,
    accuracy: workerState.accuracy,
    milestones_sent: workerState.milestones_sent,
    timestamp: new Date().toISOString(),
  });
});

// ============================================================================
// CONNECT TO COORDINATOR
// ============================================================================

function connectToCoordinator() {
  const coordinatorUrl = `ws://${COORDINATOR_HOST}:${COORDINATOR_PORT}`;

  coordinatorWs = new WebSocket(coordinatorUrl);

  coordinatorWs.on('open', () => {
    console.log(`[${NODE_ID}] Connected to coordinator at ${coordinatorUrl}`);
    workerState.coordinator_connected = true;
    workerState.status = 'connected';

    // Register this worker with the coordinator
    coordinatorWs.send(
      JSON.stringify({
        type: 'REGISTER',
        worker_id: workerState.worker_id,
        node_id: NODE_ID,
        atom: ATOM_TYPE,
      })
    );

    console.log(`[${NODE_ID}] Registered as ${ATOM_TYPE} atom worker`);
  });

  coordinatorWs.on('message', (data) => {
    try {
      const message = JSON.parse(data);

      if (message.type === 'REGISTER_ACK') {
        console.log(`[${NODE_ID}] Registration acknowledged`);
      } else if (message.type === 'HEARTBEAT_ACK') {
        // Normal heartbeat acknowledgment
      } else if (message.type === 'TRAIN_START') {
        startTraining(message);
      } else if (message.type === 'TRAIN_STOP') {
        stopTraining(message);
      }
    } catch (err) {
      console.error(`[${NODE_ID}] Error processing message:`, err);
    }
  });

  coordinatorWs.on('close', () => {
    console.log(`[${NODE_ID}] Disconnected from coordinator`);
    workerState.coordinator_connected = false;
    workerState.status = 'disconnected';

    // Attempt reconnection
    setTimeout(connectToCoordinator, 5000);
  });

  coordinatorWs.on('error', (err) => {
    console.error(`[${NODE_ID}] WebSocket error:`, err);
    workerState.coordinator_connected = false;
  });
}

// ============================================================================
// TRAINING SIMULATION
// ============================================================================

let trainingInterval = null;

function startTraining(message) {
  const { session_id, atom, config } = message;

  console.log(`[${NODE_ID}] Starting training session ${session_id}`);
  console.log(`[${NODE_ID}] Config: epochs=${config.epochs}, batch_size=${config.batch_size}`);

  workerState.current_session_id = session_id;
  workerState.training_active = true;
  workerState.current_epoch = 0;
  workerState.total_epochs = config.epochs;
  workerState.training_start_time = Date.now();
  workerState.loss = 0.5 + Math.random() * 0.2;
  workerState.accuracy = 0.5 + Math.random() * 0.1;

  // Simulate training progression
  trainingInterval = setInterval(() => {
    if (!workerState.training_active) {
      clearInterval(trainingInterval);
      return;
    }

    workerState.current_epoch += 1;

    // Simulate loss decay and accuracy improvement
    const progress = workerState.current_epoch / workerState.total_epochs;
    workerState.loss *= 1 - 0.015 * Math.random(); // Gradual decrease
    workerState.accuracy = 0.5 + progress * (0.4 + Math.random() * 0.05);

    // Ensure realistic bounds
    if (workerState.loss < 0.01) workerState.loss = 0.01;
    if (workerState.accuracy > 0.99) workerState.accuracy = 0.99;

    // Send heartbeat every 5 epochs
    if (workerState.current_epoch % 5 === 0) {
      sendHeartbeat();
    }

    // Send milestone every 10 epochs
    if (workerState.current_epoch % 10 === 0) {
      sendMilestone();
    }

    // Training complete
    if (workerState.current_epoch >= workerState.total_epochs) {
      console.log(`[${NODE_ID}] Training completed`);
      workerState.training_active = false;
      clearInterval(trainingInterval);
      sendMilestone();
    }
  }, 1000); // Update every second (1 epoch per second simulation)
}

function stopTraining(message) {
  const { session_id } = message;

  if (workerState.current_session_id === session_id) {
    console.log(`[${NODE_ID}] Stopping training session ${session_id}`);
    workerState.training_active = false;

    if (trainingInterval) {
      clearInterval(trainingInterval);
    }

    sendMilestone(); // Send final milestone
  }
}

function sendHeartbeat() {
  if (coordinatorWs && coordinatorWs.readyState === WebSocket.OPEN) {
    coordinatorWs.send(
      JSON.stringify({
        type: 'HEARTBEAT',
        worker_id: workerState.worker_id,
        node_id: NODE_ID,
        atom: ATOM_TYPE,
        training_status: {
          session_id: workerState.current_session_id,
          epoch: workerState.current_epoch,
          total_epochs: workerState.total_epochs,
          loss: workerState.loss,
          accuracy: workerState.accuracy,
        },
      })
    );
  }
}

function sendMilestone() {
  if (coordinatorWs && coordinatorWs.readyState === WebSocket.OPEN) {
    coordinatorWs.send(
      JSON.stringify({
        type: 'MILESTONE',
        worker_id: workerState.worker_id,
        node_id: NODE_ID,
        atom: ATOM_TYPE,
        session_id: workerState.current_session_id,
        epoch: workerState.current_epoch,
        loss: workerState.loss,
        accuracy: workerState.accuracy,
        metadata: {
          training_elapsed_ms: Date.now() - workerState.training_start_time,
          atoms_trained: [ATOM_TYPE],
        },
      })
    );

    workerState.milestones_sent += 1;
  }
}

// ============================================================================
// PERIODIC HEARTBEAT (even when not training)
// ============================================================================

setInterval(() => {
  sendHeartbeat();
}, 10000); // Send heartbeat every 10 seconds

// ============================================================================
// SERVER START
// ============================================================================

server.listen(WORKER_PORT, () => {
  console.log(`\n╔════════════════════════════════════════════════════╗`);
  console.log(`║  MIST CLUSTER WORKER - PHASE 17.2.1                ║`);
  console.log(`║  Node ID: ${NODE_ID.padEnd(40)}   ║`);
  console.log(`║  Atom Type: ${ATOM_TYPE.padEnd(38)}  ║`);
  console.log(`║  Worker ID: ${workerState.worker_id.substring(0, 40)}...   ║`);
  console.log(`║  REST API: http://0.0.0.0:${WORKER_PORT}              ║`);
  console.log(`╚════════════════════════════════════════════════════╝\n`);
  console.log(`Coordinator: ${COORDINATOR_HOST}:${COORDINATOR_PORT}`);
  console.log(`Connecting to coordinator...`);

  // Connect to coordinator
  connectToCoordinator();
});

export { workerState };
