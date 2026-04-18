/**
 * Task A5: ML Training Integration
 * Phase 15: ML Proxy Framework
 * 
 * Collect proxy execution traces and retrain with new simulation data.
 * Incrementally version proxies as accuracy improves.
 */

import { v4 as uuidv4 } from 'uuid';

/**
 * ProxyExecutionTrace: records input/output pairs for training
 */
export class ProxyExecutionTrace {
  constructor({
    traceId = uuidv4(),
    proxyId,
    input,
    expectedOutput,
    actualOutput,
    error = 0,
    timestamp = Date.now()
  } = {}) {
    this.traceId = traceId;
    this.proxyId = proxyId;
    this.input = input;
    this.expectedOutput = expectedOutput;
    this.actualOutput = actualOutput;
    this.error = error; // L2 norm or similar
    this.timestamp = timestamp;
  }

  /**
   * Calculate error rate
   */
  getErrorRate() {
    return this.error;
  }

  toJSON() {
    return {
      traceId: this.traceId,
      proxyId: this.proxyId,
      input: this.input,
      expectedOutput: this.expectedOutput,
      actualOutput: this.actualOutput,
      error: this.error,
      timestamp: this.timestamp
    };
  }
}

/**
 * TrainingDataset: collection of traces for a proxy
 */
export class TrainingDataset {
  constructor({
    datasetId = uuidv4(),
    proxyId,
    traces = [],
    trainingParams = {}
  } = {}) {
    this.datasetId = datasetId;
    this.proxyId = proxyId;
    this.traces = traces;
    this.trainingParams = {
      learningRate: trainingParams.learningRate || 0.01,
      epochs: trainingParams.epochs || 100,
      batchSize: trainingParams.batchSize || 32,
      regularization: trainingParams.regularization || 0.001
    };
    this.createdAt = new Date();
  }

  /**
   * Add execution trace to dataset
   */
  addTrace(trace) {
    this.traces.push(trace);
  }

  /**
   * Add multiple traces
   */
  addTraces(traces) {
    this.traces.push(...traces);
  }

  /**
   * Get traces within error threshold
   */
  getHighErrorTraces(threshold = 0.1) {
    return this.traces.filter(t => t.error > threshold);
  }

  /**
   * Get statistics
   */
  getStats() {
    if (this.traces.length === 0) {
      return {
        count: 0,
        avgError: 0,
        maxError: 0,
        minError: 0
      };
    }

    const errors = this.traces.map(t => t.error);
    const avgError = errors.reduce((a, b) => a + b, 0) / errors.length;
    const maxError = Math.max(...errors);
    const minError = Math.min(...errors);

    return {
      count: this.traces.length,
      avgError,
      maxError,
      minError
    };
  }

  /**
   * Sample from dataset (for training)
   */
  sample(count = 32) {
    const sampled = [];
    for (let i = 0; i < count; i++) {
      const idx = Math.floor(Math.random() * this.traces.length);
      sampled.push(this.traces[idx]);
    }
    return sampled;
  }

  toJSON() {
    return {
      datasetId: this.datasetId,
      proxyId: this.proxyId,
      traceCount: this.traces.length,
      traces: this.traces.map(t => t.toJSON()),
      stats: this.getStats(),
      createdAt: this.createdAt.toISOString()
    };
  }
}

/**
 * ProxyVersionHistory: tracks versions and accuracy improvements
 */
export class ProxyVersionHistory {
  constructor({
    proxyId,
    versions = []
  } = {}) {
    this.proxyId = proxyId;
    this.versions = versions; // Array of {versionId, accuracy, trainedAt, dataset}
  }

  /**
   * Add new version
   */
  addVersion(versionId, accuracy, dataset) {
    this.versions.push({
      versionId,
      accuracy,
      trainedAt: new Date(),
      datasetSize: dataset.traces.length,
      stats: dataset.getStats()
    });

    // Keep sorted by version (newest first)
    this.versions.sort((a, b) => new Date(b.trainedAt) - new Date(a.trainedAt));
  }

  /**
   * Get latest version
   */
  getLatestVersion() {
    return this.versions.length > 0 ? this.versions[0] : null;
  }

  /**
   * Get version by ID
   */
  getVersion(versionId) {
    return this.versions.find(v => v.versionId === versionId);
  }

  /**
   * Get improvement trajectory
   */
  getAccuracyTrajectory() {
    return this.versions.map(v => ({
      versionId: v.versionId,
      accuracy: v.accuracy,
      trainedAt: v.trainedAt
    }));
  }

  /**
   * Check if accuracy improved
   */
  hasImproved(newAccuracy) {
    const latest = this.getLatestVersion();
    return latest ? newAccuracy > latest.accuracy : true;
  }

  toJSON() {
    return {
      proxyId: this.proxyId,
      versionCount: this.versions.length,
      versions: this.versions,
      trajectory: this.getAccuracyTrajectory()
    };
  }
}

/**
 * ProxyTrainer: manages training loop and versioning
 */
export class ProxyTrainer {
  constructor({
    dbConnection = null,
    autoRetrainThreshold = 0.05 // Retrain if accuracy drops 5%
  } = {}) {
    this.db = dbConnection;
    this.autoRetrainThreshold = autoRetrainThreshold;
    this.trainingDatasets = new Map(); // proxyId -> TrainingDataset
    this.versionHistories = new Map(); // proxyId -> ProxyVersionHistory
    this.activeTrainings = new Map(); // proxyId -> Promise
  }

  /**
   * Create new training dataset for proxy
   */
  createDataset(proxyId, trainingParams = {}) {
    const dataset = new TrainingDataset({
      proxyId,
      trainingParams
    });

    this.trainingDatasets.set(proxyId, dataset);
    console.log(`✓ Training dataset created for proxy ${proxyId}`);
    return dataset;
  }

  /**
   * Record proxy execution trace for training
   */
  recordTrace(proxyId, input, expectedOutput, actualOutput) {
    let dataset = this.trainingDatasets.get(proxyId);
    if (!dataset) {
      dataset = this.createDataset(proxyId);
    }

    // Calculate error
    const error = this._calculateError(expectedOutput, actualOutput);

    const trace = new ProxyExecutionTrace({
      proxyId,
      input,
      expectedOutput,
      actualOutput,
      error
    });

    dataset.addTrace(trace);

    // Check if retraining needed
    if (this._shouldRetrain(proxyId, dataset)) {
      this._scheduleRetraining(proxyId, dataset);
    }

    return trace;
  }

  /**
   * Batch record traces
   */
  recordTraces(proxyId, traces) {
    let dataset = this.trainingDatasets.get(proxyId);
    if (!dataset) {
      dataset = this.createDataset(proxyId);
    }

    const processedTraces = traces.map(t => {
      const error = this._calculateError(t.expectedOutput, t.actualOutput);
      return new ProxyExecutionTrace({
        proxyId,
        input: t.input,
        expectedOutput: t.expectedOutput,
        actualOutput: t.actualOutput,
        error
      });
    });

    dataset.addTraces(processedTraces);

    if (this._shouldRetrain(proxyId, dataset)) {
      this._scheduleRetraining(proxyId, dataset);
    }

    return processedTraces;
  }

  /**
   * Train proxy with current dataset
   * Simulated training loop - in production would use actual ML framework
   */
  async trainProxy(proxyId, options = {}) {
    const dataset = this.trainingDatasets.get(proxyId);
    if (!dataset) {
      throw new Error(`No training dataset for proxy ${proxyId}`);
    }

    const maxEpochs = options.epochs || dataset.trainingParams.epochs;
    const batchSize = dataset.trainingParams.batchSize;

    console.log(`🔄 Training proxy ${proxyId} with ${dataset.traces.length} traces...`);

    const startTime = Date.now();
    let bestAccuracy = 0;
    const losses = [];

    for (let epoch = 0; epoch < maxEpochs; epoch++) {
      const batch = dataset.sample(batchSize);
      const batchErrors = batch.map(t => t.error);
      const avgLoss = batchErrors.reduce((a, b) => a + b, 0) / batchErrors.length;

      losses.push(avgLoss);

      // Simulated improvement
      const accuracy = Math.max(0, 1.0 - (avgLoss * (1 - epoch / maxEpochs)));
      bestAccuracy = Math.max(bestAccuracy, accuracy);

      if ((epoch + 1) % Math.floor(maxEpochs / 5) === 0) {
        console.log(`  Epoch ${epoch + 1}/${maxEpochs} - Loss: ${avgLoss.toFixed(4)}, Accuracy: ${accuracy.toFixed(4)}`);
      }
    }

    const trainingTime = Date.now() - startTime;

    // Version the trained proxy
    const versionId = `proxy-${proxyId}-v${uuidv4().substring(0, 8)}`;
    const history = this.versionHistories.get(proxyId) || new ProxyVersionHistory({ proxyId });
    history.addVersion(versionId, bestAccuracy, dataset);
    this.versionHistories.set(proxyId, history);

    const result = {
      versionId,
      accuracy: bestAccuracy,
      losses,
      trainingTime,
      tracesUsed: dataset.traces.length,
      startTime
    };

    console.log(`✅ Training complete: ${versionId} with ${bestAccuracy.toFixed(4)} accuracy (${trainingTime}ms)`);

    // Persist to database
    if (this.db) {
      await this._saveTrainedVersion(proxyId, result);
    }

    return result;
  }

  /**
   * Calculate error between expected and actual output
   * @private
   */
  _calculateError(expected, actual) {
    if (typeof expected === 'number' && typeof actual === 'number') {
      return Math.abs(expected - actual);
    }

    if (Array.isArray(expected) && Array.isArray(actual)) {
      let sumSq = 0;
      for (let i = 0; i < Math.min(expected.length, actual.length); i++) {
        const diff = expected[i] - actual[i];
        sumSq += diff * diff;
      }
      return Math.sqrt(sumSq);
    }

    if (typeof expected === 'object' && typeof actual === 'object') {
      let sumSq = 0;
      for (const key in expected) {
        const diff = expected[key] - (actual[key] || 0);
        sumSq += diff * diff;
      }
      return Math.sqrt(sumSq);
    }

    return 0;
  }

  /**
   * Check if proxy should be retrained
   * @private
   */
  _shouldRetrain(proxyId, dataset) {
    const stats = dataset.getStats();
    if (stats.count < 100) return false; // Need minimum traces

    const history = this.versionHistories.get(proxyId);
    if (!history) return true; // First training

    const latest = history.getLatestVersion();
    if (!latest) return true;

    // Retrain if error increased significantly
    return stats.avgError > (latest.accuracy * this.autoRetrainThreshold);
  }

  /**
   * Schedule retraining (debounced)
   * @private
   */
  _scheduleRetraining(proxyId, dataset) {
    // Prevent overlapping trainings
    if (this.activeTrainings.has(proxyId)) {
      return;
    }

    const promise = new Promise(resolve => {
      setTimeout(async () => {
        try {
          await this.trainProxy(proxyId);
        } catch (error) {
          console.error(`Error retraining proxy ${proxyId}:`, error);
        } finally {
          this.activeTrainings.delete(proxyId);
          resolve();
        }
      }, 5000); // Delay by 5s to batch traces
    });

    this.activeTrainings.set(proxyId, promise);
  }

  /**
   * Save trained version to database
   * @private
   */
  async _saveTrainedVersion(proxyId, result) {
    try {
      await this.db.query(
        `INSERT INTO proxy_versions 
        (versionId, proxyId, version, trainingData, modelWeights)
        VALUES (?, ?, ?, ?, ?)`,
        [
          result.versionId,
          proxyId,
          1,
          JSON.stringify({
            tracesUsed: result.tracesUsed,
            accuracy: result.accuracy,
            trainingTime: result.trainingTime
          }),
          Buffer.from(JSON.stringify(result.losses))
        ]
      );

      console.log(`✓ Version ${result.versionId} saved to database`);
    } catch (error) {
      console.error('Error saving trained version:', error);
    }
  }

  /**
   * Get version history for proxy
   */
  getVersionHistory(proxyId) {
    return this.versionHistories.get(proxyId);
  }

  /**
   * Get dataset statistics
   */
  getDatasetStats(proxyId) {
    const dataset = this.trainingDatasets.get(proxyId);
    if (!dataset) return null;

    const stats = dataset.getStats();
    const history = this.versionHistories.get(proxyId);

    return {
      proxyId,
      datasetSize: stats.count,
      avgError: stats.avgError,
      maxError: stats.maxError,
      minError: stats.minError,
      versions: history?.versions.length || 0,
      bestAccuracy: history?.getLatestVersion()?.accuracy || 0
    };
  }

  /**
   * Get all training progress
   */
  getAllProgress() {
    const progress = [];

    for (const [proxyId] of this.trainingDatasets) {
      progress.push(this.getDatasetStats(proxyId));
    }

    return progress;
  }

  /**
   * Export training data for analysis
   */
  exportTrainingData(proxyId) {
    const dataset = this.trainingDatasets.get(proxyId);
    const history = this.versionHistories.get(proxyId);

    return {
      proxyId,
      dataset: dataset?.toJSON(),
      history: history?.toJSON(),
      exportedAt: new Date().toISOString()
    };
  }

  /**
   * Clear old traces (keep recent)
   */
  pruneTraces(proxyId, keepCount = 1000) {
    const dataset = this.trainingDatasets.get(proxyId);
    if (!dataset) return 0;

    if (dataset.traces.length > keepCount) {
      const removed = dataset.traces.length - keepCount;
      dataset.traces = dataset.traces.slice(-keepCount);
      console.log(`✓ Pruned ${removed} old traces for proxy ${proxyId}`);
      return removed;
    }

    return 0;
  }
}

export default {
  ProxyExecutionTrace,
  TrainingDataset,
  ProxyVersionHistory,
  ProxyTrainer
};
