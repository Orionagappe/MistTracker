/**
 * Multi-Atom API Simulator
 * Phase 17.2.0: Simulates atom training and comparison API
 * Later phases will integrate with real server endpoints
 */

// In-memory storage for training state
const trainingState = {
  H: { epoch: 0, loss: 0.5, accuracy: 0.96, trained: true, convergenceTime: 120000 },
  He: { epoch: 0, loss: 0.55, accuracy: 0.94, trained: false, convergenceTime: null },
  Li: { epoch: 0, loss: 0.60, accuracy: 0.92, trained: false, convergenceTime: null },
  Be: { epoch: 0, loss: 0.62, accuracy: 0.90, trained: false, convergenceTime: null },
  B: { epoch: 0, loss: 0.65, accuracy: 0.88, trained: false, convergenceTime: null },
  C: { epoch: 0, loss: 0.67, accuracy: 0.87, trained: false, convergenceTime: null },
  N: { epoch: 0, loss: 0.68, accuracy: 0.86, trained: false, convergenceTime: null },
  O: { epoch: 0, loss: 0.70, accuracy: 0.85, trained: false, convergenceTime: null },
  F: { epoch: 0, loss: 0.72, accuracy: 0.84, trained: false, convergenceTime: null },
  Ne: { epoch: 0, loss: 0.75, accuracy: 0.82, trained: false, convergenceTime: null },
};

const activeTraining = {};

/**
 * GET /api/analysis/{atom}/status
 * Get training status for a specific atom
 */
export function getAtomStatus(req, res) {
  const { atom } = req.params;
  const status = trainingState[atom];

  if (!status) {
    return res.status(404).json({ error: 'Atom not found' });
  }

  res.json({
    trained: status.trained,
    training_status: {
      epoch: status.epoch,
      loss: status.loss,
      accuracy: status.accuracy,
    },
    proxy_model: {
      accuracy: status.accuracy,
      speedup_factor: 20 + Math.random() * 10,
      model_size_kb: 8 + Math.random() * 4,
      sample_predictions: generateSamplePredictions(),
    },
    lastUpdate: new Date().toISOString(),
  });
}

/**
 * POST /api/analysis/{atom}/train
 * Start training for a specific atom
 */
export function startAtomTraining(req, res) {
  const { atom } = req.params;
  const { epochs = 100, batchSize = 32, learningRate = 0.001 } = req.body;

  if (!trainingState[atom]) {
    return res.status(404).json({ error: 'Atom not found' });
  }

  // Simulate training
  activeTraining[atom] = {
    startTime: Date.now(),
    epochs,
    batchSize,
    learningRate,
    progress: 0,
  };

  // Simulate epoch progress
  const trainingInterval = setInterval(() => {
    const training = activeTraining[atom];
    if (!training) {
      clearInterval(trainingInterval);
      return;
    }

    training.progress += 1;
    const state = trainingState[atom];
    state.epoch = training.progress;
    state.loss = state.loss * (1 - 0.01 * Math.random()); // Gradually decrease loss

    if (training.progress >= epochs) {
      state.trained = true;
      state.accuracy = 0.85 + Math.random() * 0.15; // Random accuracy between 0.85-1.0
      state.convergenceTime = Date.now() - training.startTime;
      delete activeTraining[atom];
      clearInterval(trainingInterval);
    }
  }, 1000); // Update every second

  res.json({
    message: `Training started for atom ${atom}`,
    config: { epochs, batchSize, learningRate },
  });
}

/**
 * DELETE /api/analysis/{atom}/train
 * Stop training for a specific atom
 */
export function stopAtomTraining(req, res) {
  const { atom } = req.params;

  if (activeTraining[atom]) {
    delete activeTraining[atom];
  }

  res.json({ message: `Training stopped for atom ${atom}` });
}

/**
 * GET /api/analysis/atoms/compare
 * Get comparison data for all atoms
 */
export function compareAtoms(req, res) {
  const atoms = [
    {
      symbol: 'H',
      name: 'Hydrogen',
      accuracy: trainingState.H.accuracy,
      convergenceTime: trainingState.H.convergenceTime,
      speedup: 25 + Math.random() * 5,
      proxySize: 12,
      trained: trainingState.H.trained,
    },
    {
      symbol: 'He',
      name: 'Helium',
      accuracy: trainingState.He.accuracy,
      convergenceTime: trainingState.He.convergenceTime,
      speedup: 22 + Math.random() * 5,
      proxySize: 11,
      trained: trainingState.He.trained,
    },
    {
      symbol: 'Li',
      name: 'Lithium',
      accuracy: trainingState.Li.accuracy,
      convergenceTime: trainingState.Li.convergenceTime,
      speedup: 20 + Math.random() * 5,
      proxySize: 13,
      trained: trainingState.Li.trained,
    },
    {
      symbol: 'Be',
      name: 'Beryllium',
      accuracy: trainingState.Be.accuracy,
      convergenceTime: trainingState.Be.convergenceTime,
      speedup: 19 + Math.random() * 5,
      proxySize: 14,
      trained: trainingState.Be.trained,
    },
    {
      symbol: 'B',
      name: 'Boron',
      accuracy: trainingState.B.accuracy,
      convergenceTime: trainingState.B.convergenceTime,
      speedup: 18 + Math.random() * 5,
      proxySize: 15,
      trained: trainingState.B.trained,
    },
    {
      symbol: 'C',
      name: 'Carbon',
      accuracy: trainingState.C.accuracy,
      convergenceTime: trainingState.C.convergenceTime,
      speedup: 17 + Math.random() * 5,
      proxySize: 16,
      trained: trainingState.C.trained,
    },
    {
      symbol: 'N',
      name: 'Nitrogen',
      accuracy: trainingState.N.accuracy,
      convergenceTime: trainingState.N.convergenceTime,
      speedup: 16 + Math.random() * 5,
      proxySize: 17,
      trained: trainingState.N.trained,
    },
    {
      symbol: 'O',
      name: 'Oxygen',
      accuracy: trainingState.O.accuracy,
      convergenceTime: trainingState.O.convergenceTime,
      speedup: 15 + Math.random() * 5,
      proxySize: 18,
      trained: trainingState.O.trained,
    },
    {
      symbol: 'F',
      name: 'Fluorine',
      accuracy: trainingState.F.accuracy,
      convergenceTime: trainingState.F.convergenceTime,
      speedup: 14 + Math.random() * 5,
      proxySize: 19,
      trained: trainingState.F.trained,
    },
    {
      symbol: 'Ne',
      name: 'Neon',
      accuracy: trainingState.Ne.accuracy,
      convergenceTime: trainingState.Ne.convergenceTime,
      speedup: 13 + Math.random() * 5,
      proxySize: 20,
      trained: trainingState.Ne.trained,
    },
  ];

  res.json({ atoms });
}

/**
 * GET /api/cluster/nodes
 * Get status of all cluster nodes (for 17.2.1)
 */
export function getClusterNodes(req, res) {
  const nodes = [
    { id: 'node-1', atom: 'H', status: 'healthy', lastHeartbeat: new Date().toISOString() },
    { id: 'node-2', atom: 'He', status: 'healthy', lastHeartbeat: new Date().toISOString() },
    { id: 'node-3', atom: 'Li', status: 'healthy', lastHeartbeat: new Date().toISOString() },
    { id: 'node-4', atom: 'Be', status: 'healthy', lastHeartbeat: new Date().toISOString() },
    { id: 'node-5', atom: 'B', status: 'healthy', lastHeartbeat: new Date().toISOString() },
  ];

  res.json({ nodes });
}

/**
 * GET /api/cluster/milestones
 * Get aggregated milestones from all nodes
 */
export function getClusterMilestones(req, res) {
  const milestones = [];
  for (const [atom, state] of Object.entries(trainingState)) {
    if (state.trained) {
      milestones.push({
        atom,
        epoch: state.epoch,
        loss: state.loss,
        accuracy: state.accuracy,
        timestamp: new Date().toISOString(),
      });
    }
  }

  res.json({ milestones });
}

/**
 * Helper: Generate sample predictions for visualization
 */
function generateSamplePredictions() {
  const predictions = [];
  for (let i = 0; i < 50; i++) {
    predictions.push({
      x: (i / 50) * 10,
      y: Math.sin((i / 50) * Math.PI) * (1 - Math.random() * 0.1),
    });
  }
  return predictions;
}

/**
 * Mount API routes
 * Call this from your Express server setup
 */
export function mountMultiAtomAPI(app) {
  // Analysis endpoints
  app.get('/api/analysis/:atom/status', getAtomStatus);
  app.post('/api/analysis/:atom/train', startAtomTraining);
  app.delete('/api/analysis/:atom/train', stopAtomTraining);
  app.get('/api/analysis/atoms/compare', compareAtoms);

  // Cluster endpoints (for Phase 17.2.1)
  app.get('/api/cluster/nodes', getClusterNodes);
  app.get('/api/cluster/milestones', getClusterMilestones);
}

/**
 * Standalone server for development
 * Usage: node multiAtomApi.js
 */
if (import.meta.url === `file://${process.argv[1]}`) {
  import('express').then((express) => {
    const app = express.default();
    app.use(express.json());

    mountMultiAtomAPI(app);

    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => {
      console.log(`Multi-Atom API running on http://localhost:${PORT}`);
      console.log(`Try: curl http://localhost:${PORT}/api/analysis/H/status`);
    });
  });
}
