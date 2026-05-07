#!/usr/bin/env node

/**
 * PHASE 16.3 - PHYSICS-AWARE REFINEMENT TRAINER
 * For Hydrogen Atom - Two-Stage Approach
 * 
 * Version: 3.1 (Physics-Aware Refinement)
 * 
 * Strategy: 
 * 1. Stage 1: Train with v2.1 exponential features (supervised learning)
 * 2. Stage 2: Refine with physics constraints (gentle guidance)
 * 
 * This hybrid approach balances data-fitting with physics knowledge
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Parse command line arguments
const args = process.argv.slice(2);
const config = {
  samples: 500,
  epochs: 100,
  refinementEpochs: 50,
  learningRate: 0.001,
  verbose: false,
  outputJson: null,
  seed: 42
};

args.forEach((arg, i) => {
  if (arg === '--samples' && i + 1 < args.length) config.samples = parseInt(args[i + 1]);
  if (arg === '--epochs' && i + 1 < args.length) config.epochs = parseInt(args[i + 1]);
  if (arg === '--refinement-epochs' && i + 1 < args.length) config.refinementEpochs = parseInt(args[i + 1]);
  if (arg === '--learning-rate' && i + 1 < args.length) config.learningRate = parseFloat(args[i + 1]);
  if (arg === '--verbose') config.verbose = true;
  if (arg === '--output-json' && i + 1 < args.length) config.outputJson = args[i + 1];
  if (arg === '--seed' && i + 1 < args.length) config.seed = parseInt(args[i + 1]);
});

// ============================================================================
// HYDROGEN PHYSICS ENGINE
// ============================================================================

class HydrogenPhysics {
  static energyLevel(n) {
    return -13.6 / (n * n);
  }

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

  static probabilityDensity(r, n = 1, l = 0) {
    const psi = this.waveFunction(r, n, l);
    return psi * psi;
  }
}

// ============================================================================
// PHYSICS-AWARE HYDROGEN PROXY
// ============================================================================

class PhysicsAwareHydrogenProxy {
  constructor() {
    this.weights = {
      energy: [],
      psi: [],
      density: []
    };
    this.outputStats = null;
    this.metadata = {
      version: '3.1',
      type: 'PHYSICS_AWARE_NEURAL_SURROGATE',
      architecture: 'Exponential Features + Physics Refinement (Two-Stage)',
      featureCount: 20,
      trainingDate: new Date().toISOString(),
      seed: config.seed
    };
  }

  /**
   * Compute output statistics for normalization
   */
  static computeStats(data) {
    const stats = {
      energy: { mean: 0, std: 1, min: Infinity, max: -Infinity },
      psi: { mean: 0, std: 1, min: Infinity, max: -Infinity },
      density: { mean: 0, std: 1, min: Infinity, max: -Infinity }
    };

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

    stats.energy.mean = energies.reduce((a, b) => a + b, 0) / energies.length;
    stats.psi.mean = psis.reduce((a, b) => a + b, 0) / psis.length;
    stats.density.mean = densities.reduce((a, b) => a + b, 0) / densities.length;

    const energyVar = energies.reduce((sum, e) => sum + (e - stats.energy.mean) ** 2, 0) / energies.length;
    const psiVar = psis.reduce((sum, p) => sum + (p - stats.psi.mean) ** 2, 0) / psis.length;
    const densityVar = densities.reduce((sum, d) => sum + (d - stats.density.mean) ** 2, 0) / densities.length;

    stats.energy.std = Math.max(Math.sqrt(energyVar), 0.001);
    stats.psi.std = Math.max(Math.sqrt(psiVar), 0.001);
    stats.density.std = Math.max(Math.sqrt(densityVar), 0.001);

    return stats;
  }

  /**
   * Advanced feature engineering: Exponential + Polynomial basis
   */
  featureEngineer(input) {
    const { n, l, r } = input;
    
    const n_norm = n / 4;
    const l_norm = l / 3;
    const r_clamped = Math.min(r, 2);
    const r_norm = r_clamped / 2;
    
    const exp_r = Math.exp(-r_clamped);
    const exp_r_half = Math.exp(-r_clamped / 2);
    const exp_r_n = Math.exp(-r_clamped / n);
    const r_exp_r = r_clamped * Math.exp(-r_clamped);
    
    const n_sq = n_norm * n_norm;
    const l_sq = l_norm * l_norm;
    const r_sq = r_norm * r_norm;
    
    return [
      1,
      exp_r, exp_r_half, exp_r_n, r_exp_r,
      n_norm * exp_r, l_norm * exp_r,
      n_norm, l_norm, r_norm,
      n_norm * l_norm, n_norm * r_norm, l_norm * r_norm,
      n_sq, l_sq, r_sq,
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
   * Physics-aware loss: Guide predictions toward physical reality
   * but don't override supervised learning too much
   */
  physicsGuidance(sample, predicted) {
    const { n, l, r } = sample.inputs;
    const expectedEnergy = -13.6 / (n * n);
    
    let guidance = 0;

    // Soft constraint 1: Energy should decrease with n
    // If two different n values are close in energy, that's bad
    const energySpacing = Math.abs(predicted.energy - expectedEnergy);
    if (energySpacing > 0.5) {
      guidance += (energySpacing - 0.5) ** 2 * 0.01;
    }

    // Soft constraint 2: Wave function should be positive (approximately)
    if (predicted.psi < -0.1) {
      guidance += (-0.1 - predicted.psi) ** 2 * 0.01;
    }

    // Soft constraint 3: Density should be positive
    if (predicted.density < -0.05) {
      guidance += (-0.05 - predicted.density) ** 2 * 0.01;
    }

    return guidance;
  }

  /**
   * STAGE 1: Standard supervised training (like v2.1)
   */
  trainStage1(trainingData, epochs, learningRate) {
    const normalizedData = trainingData.map(sample => ({
      inputs: sample.inputs,
      outputs: this.normalizeOutput(sample.outputs, this.outputStats)
    }));

    let prevError = Infinity;
    let currentLearningRate = learningRate;

    for (let epoch = 0; epoch < epochs; epoch++) {
      let totalError = 0;

      for (const sample of normalizedData) {
        const predicted = this.predictNormalized(sample.inputs);
        const errors = {
          energy: predicted.energy - sample.outputs.energy,
          psi: predicted.psi - sample.outputs.psi,
          density: predicted.density - sample.outputs.density
        };

        let sampleError = 0;
        const features = this.featureEngineer(sample.inputs);

        features.forEach((f, i) => {
          // Energy
          let grad = errors.energy * f;
          grad = Math.max(-0.1, Math.min(0.1, grad));
          this.weights.energy[i] -= currentLearningRate * grad;
          this.weights.energy[i] = Math.max(-10, Math.min(10, this.weights.energy[i]));

          // Psi
          grad = errors.psi * f;
          grad = Math.max(-0.1, Math.min(0.1, grad));
          this.weights.psi[i] -= currentLearningRate * grad;
          this.weights.psi[i] = Math.max(-10, Math.min(10, this.weights.psi[i]));

          // Density
          grad = errors.density * f;
          grad = Math.max(-0.1, Math.min(0.1, grad));
          this.weights.density[i] -= currentLearningRate * grad;
          this.weights.density[i] = Math.max(-10, Math.min(10, this.weights.density[i]));
        });

        sampleError = Math.sqrt(errors.energy ** 2 + errors.psi ** 2 + errors.density ** 2);
        totalError += sampleError;
      }

      const avgError = totalError / normalizedData.length;

      if (avgError > prevError * 1.1) {
        currentLearningRate *= 0.9;
      }

      if (config.verbose && (epoch % 10 === 0 || epoch === epochs - 1)) {
        console.log(`[Stage 1 Epoch ${epoch + 1}/${epochs}] Error: ${avgError.toFixed(6)}`);
      }

      prevError = avgError;
    }
  }

  /**
   * STAGE 2: Physics-aware refinement (gentle guidance)
   */
  trainStage2(trainingData, epochs, learningRate) {
    const normalizedData = trainingData.map(sample => ({
      inputs: sample.inputs,
      outputs: this.normalizeOutput(sample.outputs, this.outputStats)
    }));

    let prevError = Infinity;
    let currentLearningRate = learningRate * 0.5;  // Slower in refinement

    for (let epoch = 0; epoch < epochs; epoch++) {
      let totalError = 0;

      for (const sample of normalizedData) {
        const predicted = this.predictNormalized(sample.inputs);
        const errors = {
          energy: predicted.energy - sample.outputs.energy,
          psi: predicted.psi - sample.outputs.psi,
          density: predicted.density - sample.outputs.density
        };

        // Compute physics guidance (gentle)
        const physics = this.physicsGuidance(sample, predicted);

        let sampleError = 0;
        const features = this.featureEngineer(sample.inputs);

        features.forEach((f, i) => {
          // Energy: 95% supervised, 5% physics-guided
          let grad = errors.energy * f * 0.95;
          grad += physics * 0.05 * (f > 0 ? 1 : -1);
          grad = Math.max(-0.08, Math.min(0.08, grad));  // Smaller updates in refinement
          this.weights.energy[i] -= currentLearningRate * grad;
          this.weights.energy[i] = Math.max(-10, Math.min(10, this.weights.energy[i]));

          // Psi: 95% supervised, 5% physics-guided
          grad = errors.psi * f * 0.95;
          grad += physics * 0.05 * (f > 0 ? 1 : -1);
          grad = Math.max(-0.08, Math.min(0.08, grad));
          this.weights.psi[i] -= currentLearningRate * grad;
          this.weights.psi[i] = Math.max(-10, Math.min(10, this.weights.psi[i]));

          // Density: supervised only
          grad = errors.density * f;
          grad = Math.max(-0.08, Math.min(0.08, grad));
          this.weights.density[i] -= currentLearningRate * grad;
          this.weights.density[i] = Math.max(-10, Math.min(10, this.weights.density[i]));
        });

        sampleError = Math.sqrt(errors.energy ** 2 + errors.psi ** 2 + errors.density ** 2);
        totalError += sampleError;
      }

      const avgError = totalError / normalizedData.length;

      if (avgError > prevError * 1.1) {
        currentLearningRate *= 0.9;
      }

      if (config.verbose && (epoch % 10 === 0 || epoch === epochs - 1)) {
        console.log(`[Stage 2 Epoch ${epoch + 1}/${epochs}] Error: ${avgError.toFixed(6)}`);
      }

      prevError = avgError;
    }
  }

  /**
   * Full two-stage training
   */
  train(trainingData, epochs1, epochs2, learningRate) {
    // Compute output statistics
    this.outputStats = PhysicsAwareHydrogenProxy.computeStats(trainingData);

    // Initialize weights
    this.initializeWeights(this.featureEngineer({ n: 1, l: 0, r: 1 }).length);

    // Stage 1: Supervised learning
    console.log('[*] Stage 1: Supervised learning...');
    this.trainStage1(trainingData, epochs1, learningRate);

    // Stage 2: Physics refinement
    console.log('[*] Stage 2: Physics-aware refinement...');
    this.trainStage2(trainingData, epochs2, learningRate);
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
    let random = (() => {
      const x = Math.sin(seed++) * 10000;
      return x - Math.floor(x);
    });

    const data = [];

    for (let i = 0; i < sampleCount; i++) {
      const n = Math.floor(random() * 3) + 1;
      const l = Math.floor(random() * Math.min(n, 3));
      const r = random() * 2.5 + 0.1;

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
  console.log('[*] Phase 16.3 - Physics-Aware Hydrogen Proxy (Two-Stage Training)');
  console.log('[*] Configuration:');
  console.log(`    Samples: ${config.samples}`);
  console.log(`    Stage 1 (Supervised): ${config.epochs} epochs`);
  console.log(`    Stage 2 (Refinement): ${config.refinementEpochs} epochs`);
  console.log(`    Learning Rate: ${config.learningRate}`);
  console.log('');

  // Generate training data
  console.log('[*] Generating training data...');
  const trainingData = TrainingDataGenerator.generate(config.samples, config.seed);
  console.log(`[+] Generated ${trainingData.length} training samples`);

  // Initialize model
  console.log('[*] Initializing physics-aware proxy model...');
  const proxy = new PhysicsAwareHydrogenProxy();
  console.log('[+] Model ready (exponential features + physics refinement)');

  // Train
  console.log('[*] Starting two-stage training...');
  const startTime = Date.now();
  proxy.train(trainingData, config.epochs, config.refinementEpochs, config.learningRate);
  const trainingTime = (Date.now() - startTime) / 1000;
  console.log(`[+] Training complete in ${trainingTime.toFixed(2)}s`);

  // Save
  if (config.outputJson) {
    const outDir = path.dirname(config.outputJson);
    if (!fs.existsSync(outDir)) {
      fs.mkdirSync(outDir, { recursive: true });
    }
    fs.writeFileSync(config.outputJson, JSON.stringify(proxy.toJSON(), null, 2));
    console.log(`[+] Model saved to ${config.outputJson}`);
  } else {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '').slice(0, 15);
    const outDir = './proxy-data';
    if (!fs.existsSync(outDir)) {
      fs.mkdirSync(outDir, { recursive: true });
    }
    const filename = `${outDir}/hydrogen-physics-aware-${timestamp}.json`;
    fs.writeFileSync(filename, JSON.stringify(proxy.toJSON(), null, 2));
    console.log(`[+] Model saved to ${filename}`);
  }

  console.log('[+] Ready for validation testing');
}

main().catch(err => {
  console.error('[!] Error:', err.message);
  process.exit(1);
});
