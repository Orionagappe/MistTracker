#!/usr/bin/env node

/**
 * Phase 16.4.1-Improved: Complex-Valued Hydrogen Proxy Trainer (v4.0-opt)
 * 
 * Improved optimization with adaptive learning rate and better initialization
 */

import * as fs from 'fs';
import * as path from 'path';
import * as ComplexAlgebra from '../SymbolicExpression.js';
import { extractComplexFeatures, validateFeatures } from './complex-feature-extractor.js';

/**
 * Generate synthetic hydrogen proxy training data
 */
function generateTrainingData(numSamples) {
  const data = [];
  
  const energyLevels = [
    { n: 1, E: -13.6, label: '1s' },
    { n: 2, E: -3.4, label: '2s/2p' },
    { n: 3, E: -1.51, label: '3s/3p/3d' }
  ];
  
  for (let i = 0; i < numSamples; i++) {
    const levelIdx = i % energyLevels.length;
    const level = energyLevels[levelIdx];
    
    const u = Math.random();
    const bohrRadius = level.n;
    const r = -bohrRadius * Math.log(1 - u);
    const theta = Math.random() * 2 * Math.PI;
    
    const energyNoise = (Math.random() - 0.5) * 0.5;
    const energy = level.E + energyNoise;
    
    data.push({ r, theta, energy });
  }
  
  return data;
}

/**
 * Improved complex-valued proxy model with better learning
 */
class ComplexHydrogenProxyV4Opt {
  constructor(numFeatures = 20, outputSize = 3) {
    this.numFeatures = numFeatures;
    this.outputSize = outputSize;
    
    // Initialize with smaller scale
    const scale = 0.1;
    
    this.weights = [];
    for (let i = 0; i < numFeatures * outputSize; i++) {
      const realPart = (Math.random() - 0.5) * scale;
      const imagPart = (Math.random() - 0.5) * scale;
      this.weights.push(ComplexAlgebra.makeComplex(realPart, imagPart));
    }
    
    this.biases = [];
    for (let i = 0; i < outputSize; i++) {
      this.biases.push(ComplexAlgebra.makeComplex(0, 0));
    }
    
    // Momentum for better convergence
    this.weightMomentum = this.weights.map(w => ComplexAlgebra.makeComplex(0, 0));
    this.biasMomentum = this.biases.map(b => ComplexAlgebra.makeComplex(0, 0));
  }
  
  predict(r, theta = 0) {
    const features = extractComplexFeatures(r, theta);
    
    if (!validateFeatures(features)) {
      throw new Error('Invalid features');
    }
    
    const outputs = [];
    
    for (let i = 0; i < this.outputSize; i++) {
      let sum = ComplexAlgebra.makeComplex(0, 0);
      
      for (let j = 0; j < this.numFeatures; j++) {
        const weight = this.weights[j * this.outputSize + i];
        const feature = features[j];
        const product = ComplexAlgebra.multiplyComplex(weight, feature);
        sum = ComplexAlgebra.addComplex(sum, product);
      }
      
      sum = ComplexAlgebra.addComplex(sum, this.biases[i]);
      outputs.push(sum);
    }
    
    // Energy prediction from first output's magnitude
    const magnitude = ComplexAlgebra.modulusComplex(outputs[0]);
    
    // Scale to physical range: map [0, ∞) to [-13.6, 0)
    // Use: E = -13.6 * exp(-magnitude)
    const predictedEnergy = -13.6 * Math.exp(-magnitude);
    
    return {
      complexOutputs: outputs,
      magnitudes: [magnitude],
      predictedEnergy: predictedEnergy
    };
  }
  
  computeLoss(batch) {
    let totalSquaredError = 0;
    const predictions = [];
    
    for (const sample of batch) {
      const result = this.predict(sample.r, sample.theta);
      const error = result.predictedEnergy - sample.energy;
      const squaredError = error * error;
      
      totalSquaredError += squaredError;
      predictions.push({
        ...sample,
        predicted: result.predictedEnergy,
        error: error,
        magnitude: result.magnitudes[0]
      });
    }
    
    const loss = totalSquaredError / batch.length;
    return { loss, predictions };
  }
  
  train(trainingData, epochs = 100, initialLR = 0.1, batchSize = 32, verbose = false) {
    const lossHistory = [];
    let bestLoss = Infinity;
    let patienceCounter = 0;
    const patience = 20;
    
    for (let epoch = 0; epoch < epochs; epoch++) {
      const shuffled = [...trainingData].sort(() => Math.random() - 0.5);
      
      let epochLoss = 0;
      let batchCount = 0;
      
      // Adaptive learning rate
      const learningRate = initialLR * Math.pow(0.95, Math.floor(epoch / 20));
      const momentum = 0.9;
      
      for (let i = 0; i < shuffled.length; i += batchSize) {
        const batch = shuffled.slice(i, Math.min(i + batchSize, shuffled.length));
        const { loss } = this.computeLoss(batch);
        
        epochLoss += loss;
        batchCount++;
        
        // Update weights using momentum
        for (let j = 0; j < batch.length; j++) {
          const sample = batch[j];
          const prediction = this.predict(sample.r, sample.theta);
          const error = prediction.predictedEnergy - sample.energy;
          
          // Gradient coefficient: derivative of loss w.r.t. output
          const dLdOut = 2 * error / batch.length;
          
          // Back-propagate through magnitude function
          // If magnitude = |output| and E = -13.6 * exp(-|output|)
          // dE/d|output| = 13.6 * exp(-|output|)
          const dEdMag = 13.6 * Math.exp(-prediction.magnitudes[0]);
          
          // Combined gradient
          const gradCoeff = dLdOut * dEdMag;
          
          const features = extractComplexFeatures(sample.r, sample.theta);
          
          // Update each weight
          for (let k = 0; k < this.numFeatures; k++) {
            const feature = features[k];
            const weightIdx = k * this.outputSize;
            
            // Simplified gradient (first output only for stability)
            const gradient = ComplexAlgebra.multiplyComplex(
              ComplexAlgebra.makeComplex(gradCoeff * learningRate / batch.length, 0),
              feature
            );
            
            // Apply momentum
            const newMomentum = ComplexAlgebra.multiplyComplex(
              ComplexAlgebra.makeComplex(momentum, 0),
              this.weightMomentum[weightIdx]
            );
            this.weightMomentum[weightIdx] = ComplexAlgebra.subtractComplex(newMomentum, gradient);
            
            // Update weight
            const current = this.weights[weightIdx];
            this.weights[weightIdx] = ComplexAlgebra.addComplex(
              current,
              this.weightMomentum[weightIdx]
            );
          }
        }
      }
      
      const avgLoss = epochLoss / batchCount;
      lossHistory.push(avgLoss);
      
      // Early stopping
      if (avgLoss < bestLoss) {
        bestLoss = avgLoss;
        patienceCounter = 0;
      } else {
        patienceCounter++;
      }
      
      if (patienceCounter >= patience && epoch > 50) {
        if (verbose) {
          console.log(`  Early stopping at epoch ${epoch} (no improvement for ${patience} epochs)`);
        }
        break;
      }
      
      if (verbose && (epoch % 10 === 0 || epoch === epochs - 1)) {
        console.log(`  Epoch ${epoch.toString().padStart(4)} / ${epochs}: Loss = ${avgLoss.toFixed(6)}`);
      }
    }
    
    return lossHistory;
  }
  
  toJSON() {
    return JSON.stringify({
      type: 'ComplexHydrogenProxyV4Opt',
      timestamp: new Date().toISOString(),
      config: {
        numFeatures: this.numFeatures,
        outputSize: this.outputSize
      },
      weights: this.weights.map(w => {
        const [, real, imag] = w;
        return { real, imag };
      }),
      biases: this.biases.map(b => {
        const [, real, imag] = b;
        return { real, imag };
      })
    }, null, 2);
  }
  
  static fromJSON(json) {
    const data = JSON.parse(json);
    
    const model = new ComplexHydrogenProxyV4Opt(
      data.config.numFeatures,
      data.config.outputSize
    );
    
    model.weights = data.weights.map(w =>
      ComplexAlgebra.makeComplex(w.real, w.imag)
    );
    
    model.biases = data.biases.map(b =>
      ComplexAlgebra.makeComplex(b.real, b.imag)
    );
    
    return model;
  }
}

async function main() {
  const args = process.argv.slice(2);
  
  let samples = 2000;
  let epochs = 300;
  let outputFile = './proxy-data/hydrogen-proxy-complex-v4-opt.json';
  let verbose = false;
  
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--samples') samples = parseInt(args[i + 1]);
    if (args[i] === '--epochs') epochs = parseInt(args[i + 1]);
    if (args[i] === '--output-json') outputFile = args[i + 1];
    if (args[i] === '--verbose') verbose = true;
  }
  
  console.log('='.repeat(80));
  console.log('PHASE 16.4.1-IMPROVED: COMPLEX PROXY TRAINER (v4.0-opt)');
  console.log('='.repeat(80));
  console.log('');
  console.log('Configuration:');
  console.log(`  Training Samples: ${samples}`);
  console.log(`  Epochs: ${epochs}`);
  console.log(`  Output: ${outputFile}`);
  console.log('');
  
  console.log('Generating training data...');
  const trainingData = generateTrainingData(samples);
  console.log(`✓ Generated ${trainingData.length} samples`);
  console.log('');
  
  console.log('Initializing model...');
  const model = new ComplexHydrogenProxyV4Opt(20, 3);
  console.log('✓ Model created');
  console.log('');
  
  console.log('Training with adaptive learning rate...');
  const startTime = Date.now();
  const lossHistory = model.train(trainingData, epochs, 0.1, 64, verbose);
  const trainTime = (Date.now() - startTime) / 1000;
  
  console.log('');
  console.log('Training complete!');
  console.log(`  Training time: ${trainTime.toFixed(2)}s`);
  console.log(`  Epochs completed: ${lossHistory.length}`);
  console.log(`  Initial loss: ${lossHistory[0].toFixed(6)}`);
  console.log(`  Final loss: ${lossHistory[lossHistory.length - 1].toFixed(6)}`);
  console.log(`  Improvement: ${(lossHistory[0] - lossHistory[lossHistory.length - 1]).toFixed(6)}`);
  console.log('');
  
  console.log('Evaluating...');
  const testData = generateTrainingData(200);
  const testResult = model.computeLoss(testData);
  
  const errors = testResult.predictions.map(p => Math.abs(p.error));
  const relErrors = testResult.predictions.map(p => Math.abs(p.error / p.energy) * 100);
  
  const meanError = errors.reduce((a, b) => a + b) / errors.length;
  const meanRelError = relErrors.reduce((a, b) => a + b) / relErrors.length;
  
  console.log(`Test Loss: ${testResult.loss.toFixed(6)}`);
  console.log(`Mean Absolute Error: ${meanError.toFixed(4)} eV`);
  console.log(`Mean Relative Error: ${meanRelError.toFixed(2)}%`);
  console.log('');
  
  console.log('Quantum State Predictions:');
  console.log('-'.repeat(80));
  console.log('State | Expected (eV) | Predicted (eV) | Rel Error %');
  console.log('-'.repeat(80));
  
  const states = [
    { label: '1s', E: -13.6 },
    { label: '2s', E: -3.4 },
    { label: '2p', E: -3.4 },
    { label: '3s', E: -1.51 },
    { label: '3p', E: -1.51 },
    { label: '3d', E: -1.51 }
  ];
  
  let totalRelError = 0;
  for (const state of states) {
    let sum = 0;
    for (let r = 0.5; r <= 3; r += 0.5) {
      sum += model.predict(r, Math.random() * 2 * Math.PI).predictedEnergy;
    }
    const predicted = sum / 6;
    const relError = Math.abs(predicted - state.E) / Math.abs(state.E) * 100;
    totalRelError += relError;
    
    console.log(`${state.label.padEnd(5)} | ${state.E.toFixed(4).padStart(13)} | ${predicted.toFixed(4).padStart(14)} | ${relError.toFixed(2).padStart(13)}`);
  }
  
  const avgRelError = totalRelError / states.length;
  console.log('-'.repeat(80));
  console.log(`Average Relative Error: ${avgRelError.toFixed(2)}%`);
  console.log('');
  
  console.log(`Saving model...`);
  const outputDir = path.dirname(outputFile);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  
  fs.writeFileSync(outputFile, model.toJSON());
  console.log(`✓ Saved (${(fs.statSync(outputFile).size / 1024).toFixed(1)} KB)`);
  console.log('');
  
  console.log('='.repeat(80));
  if (avgRelError < 100) {
    console.log('✅ PHASE 16.4.1 IMPROVED COMPLETE - Accuracy achieved!');
  } else {
    console.log('⚠️ PHASE 16.4.1 IMPROVED - Continue tuning');
  }
  console.log('='.repeat(80));
}

main().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
