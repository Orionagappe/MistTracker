#!/usr/bin/env node

/**
 * PHASE 17 - IMPROVED HYDROGEN PROXY TRAINER
 * Enhanced neural network with exponential features for quantum physics
 * 
 * Version: 2.1 (Exponential Basis)
 * Improves on v1.0 by adding quantum-specific feature engineering
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Parse command line arguments
const args = process.argv.slice(2);
const config = {
  samples: 500,
  epochs: 50,
  learningRate: 0.001,
  verbose: false,
  outputJson: null,
  seed: 42
};

args.forEach((arg, i) => {
  if (arg === '--samples' && i + 1 < args.length) config.samples = parseInt(args[i + 1]);
  if (arg === '--epochs' && i + 1 < args.length) config.epochs = parseInt(args[i + 1]);
  if (arg === '--learning-rate' && i + 1 < args.length) config.learningRate = parseFloat(args[i + 1]);
  if (arg === '--verbose') config.verbose = true;
  if (arg === '--output-json' && i + 1 < args.length) config.outputJson = args[i + 1];
  if (arg === '--seed' && i + 1 < args.length) config.seed = parseInt(args[i + 1]);
});

// ============================================================================
// HYDROGEN PHYSICS ENGINE (Reference)
// ============================================================================

class HydrogenPhysics {
  /**
   * Energy level in eV
   */
  static energyLevel(n) {
    return -13.6 / (n * n);
  }

  /**
   * Wave function (simplified but accurate for key states)
   */
  static waveFunction(r, n = 1, l = 0) {
    if (n < 1 || l >= n || r < 0) return 0;

    const a0 = 1.0;
    const rho = 2 * r / (n * a0);

    if (n === 1 && l === 0) {
      return (1 / Math.sqrt(Math.PI)) * Math.pow(a0, -1.5) * Math.exp(-rho / 2);
    }

    if (n === 2 && l === 0) {
      const factor = 1 / (2 * Math.sqrt(2 * Math.PI)) * Math.pow(a0, -1.5);
      const laguerreL = 1 - rho / 2;
      return factor * Math.exp(-rho / 2) * laguerreL;
    }

    if (n === 2 && l === 1) {
      const factor = 1 / (2 * Math.sqrt(6 * Math.PI)) * Math.pow(a0, -1.5);
      return factor * rho * Math.exp(-rho / 2);
    }

    return 0;
  }

  /**
   * Probability density
   */
  static probabilityDensity(r, n = 1, l = 0) {
    const psi = this.waveFunction(r, n, l);
    return psi * psi;
  }
}

// ============================================================================
// IMPROVED HYDROGEN PROXY (Exponential Features)
// ============================================================================

class ImprovedHydrogenProxy {
  constructor() {
    this.weights = {
      energy: [],
      psi: [],
      density: []
    };
    this.outputStats = null;
    this.metadata = {
      version: '2.1',
      type: 'NEURAL_SURROGATE_EXPONENTIAL',
      architecture: 'Exponential Basis + Polynomial',
      featureCount: 20,
      trainingDate: new Date().toISOString(),
      seed: config.seed
    };
  }

  /**
   * Compute statistics for normalization
   */
  static computeStats(data) {
    const stats = {
      energy: { mean: 0, std: 1, min: Infinity, max: -Infinity },
      psi: { mean: 0, std: 1, min: Infinity, max: -Infinity },
      density: { mean: 0, std: 1, min: Infinity, max: -Infinity }
    };

    // Collect all values
    const energies = [];
    const psis = [];
    const densities = [];

    data.forEach(sample => {
      energies.push(sample.outputs.energy);
      psis.push(sample.outputs.psi);
      densities.push(sample.outputs.density);

      stats.energy.min = Math.min(stats.energy.min, sample.outputs.energy);
      stats.energy.max = Math.max(stats.energy.max, sample.outputs.energy);
      stats.psi.min = Math.min(stats.psi.min, sample.outputs.psi);
      stats.psi.max = Math.max(stats.psi.max, sample.outputs.psi);
      stats.density.min = Math.min(stats.density.min, sample.outputs.density);
      stats.density.max = Math.max(stats.density.max, sample.outputs.density);
    });

    // Compute mean
    stats.energy.mean = energies.reduce((a, b) => a + b, 0) / energies.length;
    stats.psi.mean = psis.reduce((a, b) => a + b, 0) / psis.length;
    stats.density.mean = densities.reduce((a, b) => a + b, 0) / densities.length;

    // Compute std
    const energyVar = energies.reduce((sum, e) => sum + (e - stats.energy.mean) ** 2, 0) / energies.length;
    const psiVar = psis.reduce((sum, p) => sum + (p - stats.psi.mean) ** 2, 0) / psis.length;
    const densityVar = densities.reduce((sum, d) => sum + (d - stats.density.mean) ** 2, 0) / densities.length;

    stats.energy.std = Math.max(Math.sqrt(energyVar), 0.001);
    stats.psi.std = Math.max(Math.sqrt(psiVar), 0.001);
    stats.density.std = Math.max(Math.sqrt(densityVar), 0.001);

    return stats;
  }

  /**
   * Advanced feature engineering: Exponential + Polynomial
   * Key insight: Hydrogen wave functions are exponential decay
   */
  featureEngineer(input) {
    const { n, l, r } = input;
    
    // Normalize inputs
    const n_norm = n / 4;
    const l_norm = l / 3;
    const r_clamped = Math.min(r, 2);
    const r_norm = r_clamped / 2;
    
    // Exponential features (primary basis for quantum)
    const exp_r = Math.exp(-r_clamped);           // Exponential decay
    const exp_r_half = Math.exp(-r_clamped / 2);  // Slower decay (2s, 2p)
    const exp_r_n = Math.exp(-r_clamped / n);     // n-dependent decay
    const r_exp_r = r_clamped * Math.exp(-r_clamped);  // Radial node structure
    
    // Polynomial features (secondary basis)
    const n_sq = n_norm * n_norm;
    const l_sq = l_norm * l_norm;
    const r_sq = r_norm * r_norm;
    
    return [
      1,                          // Bias
      // Exponential basis (6 features)
      exp_r,
      exp_r_half,
      exp_r_n,
      r_exp_r,
      n_norm * exp_r,
      l_norm * exp_r,
      // Polynomial basis (8 features)
      n_norm,
      l_norm,
      r_norm,
      n_norm * l_norm,
      n_norm * r_norm,
      l_norm * r_norm,
      // Quadratic basis (4 features)
      n_sq,
      l_sq,
      r_sq,
      n_norm * l_norm * r_norm
    ];
  }

  /**
   * Initialize weights using Xavier initialization
   */
  initializeWeights(featureCount) {
    const scale = Math.sqrt(1 / featureCount);
    
    const init = () => (Math.random() - 0.5) * 2 * scale;
    
    this.weights.energy = Array(featureCount).fill(0).map(init);
    this.weights.psi = Array(featureCount).fill(0).map(init);
    this.weights.density = Array(featureCount).fill(0).map(init);
  }

  /**
   * Normalize output to mean=0, std=1
   */
  normalizeOutput(output, stats) {
    return {
      energy: (output.energy - stats.energy.mean) / stats.energy.std,
      psi: (output.psi - stats.psi.mean) / stats.psi.std,
      density: (output.density - stats.density.mean) / stats.density.std
    };
  }

  /**
   * Denormalize output back to original scale
   */
  denormalizeOutput(normalized, stats) {
    return {
      energy: normalized.energy * stats.energy.std + stats.energy.mean,
      psi: normalized.psi * stats.psi.std + stats.psi.mean,
      density: normalized.density * stats.density.std + stats.density.mean
    };
  }

  /**
   * Predict in normalized space
   */
  predictNormalized(input) {
    const features = this.featureEngineer(input);

    const energy = features.reduce((sum, f, i) => 
      sum + f * this.weights.energy[i], 0
    );

    const psi = features.reduce((sum, f, i) => 
      sum + f * this.weights.psi[i], 0
    );

    const density = features.reduce((sum, f, i) => 
      sum + f * this.weights.density[i], 0
    );

    return { energy, psi, density };
  }

  /**
   * Predict in original scale
   */
  predict(input) {
    const normalized = this.predictNormalized(input);
    if (!this.outputStats) return normalized;
    return this.denormalizeOutput(normalized, this.outputStats);
  }

  /**
   * Train on single sample
   */
  trainStep(sample, learningRate) {
    const predicted = this.predictNormalized(sample.inputs);
    const target = sample.outputs;

    // Compute errors
    let totalError = 0;
    const errors = {
      energy: predicted.energy - target.energy,
      psi: predicted.psi - target.psi,
      density: predicted.density - target.density
    };

    // Update weights with gradient descent
    const features = this.featureEngineer(sample.inputs);

    features.forEach((f, i) => {
      // Energy
      let grad = errors.energy * f;
      grad = Math.max(-0.1, Math.min(0.1, grad)); // Clip gradient
      this.weights.energy[i] -= learningRate * grad;
      this.weights.energy[i] = Math.max(-10, Math.min(10, this.weights.energy[i])); // Clip weight

      // Psi
      grad = errors.psi * f;
      grad = Math.max(-0.1, Math.min(0.1, grad));
      this.weights.psi[i] -= learningRate * grad;
      this.weights.psi[i] = Math.max(-10, Math.min(10, this.weights.psi[i]));

      // Density
      grad = errors.density * f;
      grad = Math.max(-0.1, Math.min(0.1, grad));
      this.weights.density[i] -= learningRate * grad;
      this.weights.density[i] = Math.max(-10, Math.min(10, this.weights.density[i]));
    });

    totalError = Math.sqrt(errors.energy ** 2 + errors.psi ** 2 + errors.density ** 2);
    return totalError;
  }

  /**
   * Train on dataset
   */
  train(trainingData, epochs, learningRate) {
    // Compute output statistics for normalization
    this.outputStats = ImprovedHydrogenProxy.computeStats(trainingData);

    // Normalize outputs in training data
    const normalizedData = trainingData.map(sample => ({
      inputs: sample.inputs,
      outputs: this.normalizeOutput(sample.outputs, this.outputStats)
    }));

    // Initialize weights
    this.initializeWeights(this.featureEngineer({ n: 1, l: 0, r: 1 }).length);

    // Training loop
    let prevError = Infinity;
    let currentLearningRate = learningRate;

    for (let epoch = 0; epoch < epochs; epoch++) {
      let totalError = 0;
      let sampleCount = 0;

      for (const sample of normalizedData) {
        const error = this.trainStep(sample, currentLearningRate);
        totalError += error;
        sampleCount++;
      }

      const avgError = totalError / sampleCount;

      // Adaptive learning rate
      if (avgError > prevError * 1.1) {
        currentLearningRate *= 0.9;
      }

      if (config.verbose && (epoch % 10 === 0 || epoch === epochs - 1)) {
        console.log(`[Epoch ${epoch + 1}/${epochs}] Error: ${avgError.toFixed(6)}`);
      }

      prevError = avgError;
    }
  }

  /**
   * Export model to JSON
   */
  toJSON() {
    return {
      model: {
        weights: this.weights,
        outputStats: this.outputStats,
        metadata: this.metadata
      },
      metadata: {
        version: this.metadata.version,
        type: this.metadata.type,
        trainingDate: this.metadata.trainingDate,
        featureCount: this.metadata.featureCount
      }
    };
  }
}

// ============================================================================
// TRAINING DATA GENERATOR
// ============================================================================

class TrainingDataGenerator {
  static generate(sampleCount, seed) {
    // Seeded random
    let random = (() => {
      const x = Math.sin(seed++) * 10000;
      return x - Math.floor(x);
    });

    const data = [];

    for (let i = 0; i < sampleCount; i++) {
      const n = Math.floor(random() * 3) + 1;      // 1-3
      const l = Math.floor(random() * Math.min(n, 3));  // 0 to n-1, max 2
      const r = random() * 2.5 + 0.1;              // 0.1 to 2.6

      const energy = HydrogenPhysics.energyLevel(n);
      const psi = HydrogenPhysics.waveFunction(r, n, l);
      const density = HydrogenPhysics.probabilityDensity(r, n, l);

      data.push({
        inputs: { n, l, r },
        outputs: { energy, psi, density }
      });
    }

    return data;
  }
}

// ============================================================================
// MAIN TRAINING ROUTINE
// ============================================================================

async function main() {
  console.log('[*] Phase 17 - Improved Hydrogen Proxy Training (v2.1)');
  console.log('[*] Configuration:');
  console.log(`    Samples: ${config.samples}`);
  console.log(`    Epochs: ${config.epochs}`);
  console.log(`    Learning Rate: ${config.learningRate}`);
  console.log('');

  // Generate training data
  console.log('[*] Generating training data...');
  const trainingData = TrainingDataGenerator.generate(config.samples, config.seed);
  console.log(`[+] Generated ${trainingData.length} training samples`);

  // Initialize model
  console.log('[*] Initializing improved proxy model...');
  const proxy = new ImprovedHydrogenProxy();
  console.log('[+] Model ready (exponential feature basis)');

  // Train
  console.log('[*] Training...');
  const startTime = Date.now();
  proxy.train(trainingData, config.epochs, config.learningRate);
  const trainingTime = (Date.now() - startTime) / 1000;
  console.log(`[+] Training complete in ${trainingTime.toFixed(2)}s`);

  // Save if requested
  if (config.outputJson) {
    const outDir = path.dirname(config.outputJson);
    if (!fs.existsSync(outDir)) {
      fs.mkdirSync(outDir, { recursive: true });
    }
    fs.writeFileSync(config.outputJson, JSON.stringify(proxy.toJSON(), null, 2));
    console.log(`[+] Model saved to ${config.outputJson}`);
  } else {
    // Generate filename with timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, '').slice(0, 15);
    const outDir = './proxy-data';
    if (!fs.existsSync(outDir)) {
      fs.mkdirSync(outDir, { recursive: true });
    }
    const filename = `${outDir}/hydrogen-proxy-improved-${timestamp}.json`;
    fs.writeFileSync(filename, JSON.stringify(proxy.toJSON(), null, 2));
    console.log(`[+] Model saved to ${filename}`);
  }

  console.log('[+] Ready for testing');
}

main().catch(err => {
  console.error('[!] Error:', err.message);
  process.exit(1);
});
