/**
 * Cluster Coordinator
 * Phase 17.2.1: Main orchestrator for multi-atom proxy training cluster
 * 
 * Responsibilities:
 * - Orchestrate training across 5 cluster nodes (H, He, Li, Be, B)
 * - Aggregate milestones from all workers
 * - Track cluster health and node status
 * - Manage inter-node communication
 * - Provide unified REST API for clients
 */

import express from 'express';
import cors from 'cors';
import { v4 as uuidv4 } from 'uuid';
import { WebSocketServer } from 'ws';
import http from 'http';
import { mountMultiAtomAPI } from './multiAtomAPI.js';

const PORT = process.env.COORDINATOR_PORT || 5000;
const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server });

// Middleware
app.use(cors());
app.use(express.json());

// ============================================================================
// CLUSTER STATE MANAGEMENT
// ============================================================================

const clusterState = {
  coordinator_id: uuidv4(),
  started_at: new Date(),
  nodes: new Map(),
  training_sessions: new Map(),
  aggregated_milestones: [],
  cluster_health: {
    healthy_nodes: 0,
    total_nodes: 5,
    avg_cpu_usage: 0,
    avg_memory_usage_mb: 0,
  },
};

const EXPECTED_NODES = ['node-1', 'node-2', 'node-3', 'node-4', 'node-5'];
const ATOM_MAP = {
  'node-1': 'H',
  'node-2': 'He',
  'node-3': 'Li',
  'node-4': 'Be',
  'node-5': 'B',
};

// Initialize node tracking
for (const nodeId of EXPECTED_NODES) {
  clusterState.nodes.set(nodeId, {
    id: nodeId,
    atom: ATOM_MAP[nodeId],
    status: 'pending',
    last_heartbeat: null,
    training_active: false,
    current_epoch: 0,
    total_epochs: 0,
    loss: null,
    accuracy: null,
    milestones: [],
    websocket: null,
  });
}

// ============================================================================
// HEALTH CHECK ENDPOINTS
// ============================================================================

app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    coordinator_id: clusterState.coordinator_id,
    timestamp: new Date().toISOString(),
  });
});

app.get('/api/cluster/status', (req, res) => {
  const nodeStatuses = Array.from(clusterState.nodes.values()).map((node) => ({
    id: node.id,
    atom: node.atom,
    status: node.status,
    training_active: node.training_active,
    current_epoch: node.current_epoch,
    total_epochs: node.total_epochs,
    loss: node.loss,
    accuracy: node.accuracy,
    last_heartbeat: node.last_heartbeat,
  }));

  res.json({
    coordinator_id: clusterState.coordinator_id,
    cluster_health: clusterState.cluster_health,
    nodes: nodeStatuses,
    timestamp: new Date().toISOString(),
  });
});

app.get('/api/cluster/nodes', (req, res) => {
  const nodes = Array.from(clusterState.nodes.values()).map((node) => ({
    id: node.id,
    atom_symbol: node.atom,
    status: node.status,
    last_heartbeat: node.last_heartbeat,
    training_active: node.training_active,
  }));

  res.json({ nodes });
});

app.get('/api/cluster/milestones', (req, res) => {
  const { session_id } = req.query;
  
  let milestones = clusterState.aggregated_milestones;
  if (session_id) {
    milestones = milestones.filter(m => m.session_id === session_id);
  }
  
  res.json({
    milestones,
    total: milestones.length,
    timestamp: new Date().toISOString(),
  });
});

app.get('/api/cluster/metrics', (req, res) => {
  const nodes = Array.from(clusterState.nodes.values());
  const healthy = nodes.filter(n => n.status === 'healthy').length;
  const training = nodes.filter(n => n.training_active).length;
  
  // Calculate average metrics
  const accuracies = nodes
    .filter(n => n.accuracy !== null)
    .map(n => n.accuracy);
  const losses = nodes
    .filter(n => n.loss !== null)
    .map(n => n.loss);
  
  const avg_accuracy = accuracies.length > 0 
    ? accuracies.reduce((a, b) => a + b) / accuracies.length 
    : 0;
  const avg_loss = losses.length > 0 
    ? losses.reduce((a, b) => a + b) / losses.length 
    : 0;
  
  // Determine cluster status
  let status = 'idle';
  if (training > 0) status = 'training';
  if (healthy < nodes.length * 0.5) status = 'degraded';
  
  res.json({
    status,
    online_nodes: healthy,
    offline_nodes: nodes.length - healthy,
    training_nodes: training,
    total_nodes: nodes.length,
    avg_accuracy,
    avg_loss,
    cpu_usage: clusterState.cluster_health.avg_cpu_usage,
    memory_usage: clusterState.cluster_health.avg_memory_usage_mb,
    total_epochs: nodes.reduce((sum, n) => sum + n.current_epoch, 0),
    atoms_trained: nodes.filter(n => n.current_epoch > 0).length,
    timestamp: new Date().toISOString(),
  });
});

app.get('/api/cluster/performance', (req, res) => {
  const sessions = Array.from(clusterState.training_sessions.values());
  const performance = {};
  
  for (const session of sessions) {
    performance[session.session_id] = {};
    
    // For each atom in the session, calculate performance
    for (const atom of session.atoms) {
      const atomMilestones = clusterState.aggregated_milestones.filter(
        m => m.session_id === session.session_id && m.atom === atom
      );
      
      if (atomMilestones.length === 0) {
        performance[session.session_id][atom] = {
          avg_accuracy: 0,
          avg_loss: 0,
          sample_count: 0,
          best_accuracy: 0,
          worst_accuracy: 0,
        };
      } else {
        const accuracies = atomMilestones.map(m => m.accuracy);
        const losses = atomMilestones.map(m => m.loss);
        
        performance[session.session_id][atom] = {
          avg_accuracy: accuracies.reduce((a, b) => a + b) / accuracies.length,
          avg_loss: losses.reduce((a, b) => a + b) / losses.length,
          sample_count: atomMilestones.length,
          best_accuracy: Math.max(...accuracies),
          worst_accuracy: Math.min(...accuracies),
        };
      }
    }
  }
  
  res.json({
    sessions: sessions.map(s => ({
      session_id: s.session_id,
      start_time: s.started_at.toISOString(),
      status: s.status,
      atoms: s.atoms,
    })),
    performance,
    timestamp: new Date().toISOString(),
  });
});

app.get('/api/cluster/session', (req, res) => {
  // Return the most recent active session or last session
  const sessions = Array.from(clusterState.training_sessions.values());
  const activeSessions = sessions.filter(s => s.status === 'training');
  const latestSession = activeSessions.length > 0 
    ? activeSessions[activeSessions.length - 1]
    : sessions[sessions.length - 1];
  
  if (!latestSession) {
    return res.json({
      session_id: null,
      status: 'idle',
      atom_count: 0,
      start_time: null,
    });
  }
  
  const sessionMilestones = clusterState.aggregated_milestones.filter(
    m => m.session_id === latestSession.session_id
  );
  
  res.json({
    session_id: latestSession.session_id,
    start_time: latestSession.started_at.toISOString(),
    status: latestSession.status,
    atom_count: latestSession.atoms.length,
    total_milestones: sessionMilestones.length,
    atoms: latestSession.atoms,
  });
});

// ============================================================================
// TRAINING ORCHESTRATION
// ============================================================================

app.post('/api/cluster/train', (req, res) => {
  const { atoms = ['H', 'He', 'Li', 'Be', 'B'], config = {} } = req.body;
  const session_id = uuidv4();

  const training_session = {
    session_id,
    atoms,
    config: {
      epochs: config.epochs || 100,
      batch_size: config.batch_size || 32,
      learning_rate: config.learning_rate || 0.001,
      validation_split: config.validation_split || 0.2,
    },
    started_at: new Date(),
    status: 'training',
    node_statuses: {},
  };

  clusterState.training_sessions.set(session_id, training_session);

  // Send training commands to appropriate nodes
  for (const nodeId of EXPECTED_NODES) {
    const node = clusterState.nodes.get(nodeId);
    if (atoms.includes(node.atom) && node.websocket) {
      node.websocket.send(
        JSON.stringify({
          type: 'TRAIN_START',
          session_id,
          atom: node.atom,
          config: training_session.config,
        })
      );
      node.training_active = true;
    }
  }

  res.json({
    session_id,
    status: 'training_initiated',
    atoms,
    config: training_session.config,
  });
});

app.delete('/api/cluster/train/:session_id', (req, res) => {
  const session_id = req.params.session_id;
  const session = clusterState.training_sessions.get(session_id);

  if (!session) {
    return res.status(404).json({ error: 'Session not found' });
  }

  // Stop training on all nodes
  for (const node of clusterState.nodes.values()) {
    if (node.websocket && node.training_active) {
      node.websocket.send(
        JSON.stringify({
          type: 'TRAIN_STOP',
          session_id,
        })
      );
      node.training_active = false;
    }
  }

  session.status = 'stopped';
  res.json({ message: 'Training stopped', session_id });
});

// ============================================================================
// WEBSOCKET COMMUNICATION (Node → Coordinator)
// ============================================================================

wss.on('connection', (ws, req) => {
  const clientIp = req.socket.remoteAddress;
  console.log(`[WS] New connection from ${clientIp}`);

  let nodeId = null;

  ws.on('message', (data) => {
    try {
      const message = JSON.parse(data);

      if (message.type === 'REGISTER') {
        nodeId = message.node_id;
        const node = clusterState.nodes.get(nodeId);

        if (node) {
          node.websocket = ws;
          node.status = 'connected';
          node.last_heartbeat = new Date();
          console.log(`[Node ${nodeId}] Registered as ${node.atom} atom worker`);

          // Send confirmation
          ws.send(
            JSON.stringify({
              type: 'REGISTER_ACK',
              coordinator_id: clusterState.coordinator_id,
              node_id: nodeId,
            })
          );

          // Update cluster health
          updateClusterHealth();
        }
      } else if (message.type === 'HEARTBEAT') {
        if (nodeId && clusterState.nodes.has(nodeId)) {
          const node = clusterState.nodes.get(nodeId);
          node.last_heartbeat = new Date();
          node.status = 'healthy';

          if (message.training_status) {
            node.current_epoch = message.training_status.epoch || 0;
            node.total_epochs = message.training_status.total_epochs || 0;
            node.loss = message.training_status.loss;
            node.accuracy = message.training_status.accuracy;
          }

          // Send acknowledgment
          ws.send(JSON.stringify({ type: 'HEARTBEAT_ACK' }));
        }
      } else if (message.type === 'MILESTONE') {
        if (nodeId && clusterState.nodes.has(nodeId)) {
          const node = clusterState.nodes.get(nodeId);

          const milestone = {
            id: uuidv4(),
            node_id: nodeId,
            atom: node.atom,
            session_id: message.session_id,
            epoch: message.epoch,
            loss: message.loss,
            accuracy: message.accuracy,
            timestamp: new Date(),
            metadata: message.metadata || {},
          };

          clusterState.aggregated_milestones.push(milestone);
          node.milestones.push(milestone);

          console.log(
            `[Milestone] ${node.atom}:${milestone.epoch} - Loss: ${milestone.loss.toFixed(6)}, Accuracy: ${milestone.accuracy.toFixed(4)}`
          );
        }
      }
    } catch (err) {
      console.error('[WS] Error processing message:', err);
    }
  });

  ws.on('close', () => {
    if (nodeId && clusterState.nodes.has(nodeId)) {
      const node = clusterState.nodes.get(nodeId);
      node.status = 'disconnected';
      node.websocket = null;
      console.log(`[Node ${nodeId}] Disconnected`);
      updateClusterHealth();
    }
  });

  ws.on('error', (err) => {
    console.error('[WS] Error:', err);
  });
});

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

function updateClusterHealth() {
  const nodes = Array.from(clusterState.nodes.values());
  const healthy = nodes.filter((n) => n.status === 'healthy').length;
  const cpuUsages = nodes
    .filter((n) => n.status === 'healthy')
    .map((n) => n.cpu_usage || 0);
  const memoryUsages = nodes
    .filter((n) => n.status === 'healthy')
    .map((n) => n.memory_usage_mb || 0);

  clusterState.cluster_health = {
    healthy_nodes: healthy,
    total_nodes: nodes.length,
    avg_cpu_usage: cpuUsages.length > 0 ? cpuUsages.reduce((a, b) => a + b) / cpuUsages.length : 0,
    avg_memory_usage_mb: memoryUsages.length > 0 ? memoryUsages.reduce((a, b) => a + b) / memoryUsages.length : 0,
  };
}

// ============================================================================
// MOUNT MULTI-ATOM API
// ============================================================================

mountMultiAtomAPI(app);

// ============================================================================
// SERVER START
// ============================================================================

server.listen(PORT, () => {
  console.log(`\n╔════════════════════════════════════════════════════╗`);
  console.log(`║  MIST CLUSTER COORDINATOR - PHASE 17.2.1           ║`);
  console.log(`║  Coordinator ID: ${clusterState.coordinator_id.substring(0, 20)}...    ║`);
  console.log(`║  REST API: http://0.0.0.0:${PORT}                 ║`);
  console.log(`║  WebSocket: ws://0.0.0.0:${PORT}                 ║`);
  console.log(`╚════════════════════════════════════════════════════╝\n`);
  console.log(`Expected Cluster Nodes: H, He, Li, Be, B`);
  console.log(`Status: WAITING FOR NODES...`);

  // Periodic cluster health check
  setInterval(() => {
    const healthy = Array.from(clusterState.nodes.values()).filter(
      (n) => n.status === 'healthy'
    ).length;
    if (healthy > 0 && healthy !== clusterState.cluster_health.healthy_nodes) {
      updateClusterHealth();
    }
  }, 5000);
});

export { clusterState };
