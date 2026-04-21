#!/usr/bin/env node

/**
 * Phase 16.4.1-Hybrid: Use v2.1 training strategy with complex features
 * 
 * v2.1 achieved 115% error with proven training approach.
 * Apply same strategy but with complex-valued feature space.
 */

import * as fs from 'fs';
import * as path from 'path';
import * as ComplexAlgebra from '../SymbolicExpression.js';
import { extractComplexFeatures } from './complex-feature-extractor.js';

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
 * Simple linear regression model (like v2.1 but with complex features)
 * Using analytical gradient descent (direct least squares)
 */
class HybridComplexHydrogenProxy {
  constructor() {
    this.weights = null;  // Will be computed via least squares
  }
  
  predict(r, theta = 0) {
    if (!this.weights) {
      return { energy: 0, magnitude: 0 };
    }
    
    const features = extractComplexFeatures(r, theta);
    
    // For simplicity: Use first weight coefficient and features' magnitudes
    // This makes it more like traditional regression
    let prediction = 0;
    
    for (let i = 0; i < features.length; i++) {
      const featureMag = ComplexAlgebra.modulusComplex(features[i]);
      const weight = this.weights[i];
      prediction += weight * featureMag;
    }
    
    return { energy: prediction, magnitude: prediction };
  }
  
  computeLoss(batch) {
    let totalSquaredError = 0;
    const predictions = [];
    
    for (const sample of batch) {
      const result = this.predict(sample.r, sample.theta);
      const error = result.energy - sample.energy;
      const squaredError = error * error;
      
      totalSquaredError += squaredError;
      predictions.push({
        ...sample,
        predicted: result.energy,
        error: error
      });
    }
    
    return {
      loss: totalSquaredError / batch.length,
      predictions: predictions
    };
  }
  
  /**
   * Train using simple gradient descent on feature magnitudes
   * This approach mirrors v2.1's success
   */
  train(trainingData, epochs = 100, learningRate = 0.01, verbose = false) {
    const numFeatures = 20;
    const lossHistory = [];
    
    // Initialize weights
    this.weights = new Array(numFeatures).fill(0).map(() => (Math.random() - 0.5) * 0.1);
    
    for (let epoch = 0; epoch < epochs; epoch++) {
      const shuffled = [...trainingData].sort(() => Math.random() - 0.5);
      
      let epochLoss = 0;
      const gradients = new Array(numFeatures).fill(0);
      
      for (const sample of shuffled) {
        const result = this.predict(sample.r, sample.theta);
        const error = result.energy - sample.energy;
        
        const features = extractComplexFeatures(sample.r, sample.theta);
        
        // Compute gradients
        for (let i = 0; i < numFeatures; i++) {
          const featureMag = ComplexAlgebra.modulusComplex(features[i]);
          gradients[i] += 2 * error * featureMag;
        }
        
        epochLoss += error * error;
      }
      
      // Update weights
      const avgGradient = 1.0 / trainingData.length;
      for (let i = 0; i < numFeatures; i++) {
        this.weights[i] -= learningRate * gradients[i] * avgGradient;
      }
      
      const loss = epochLoss / trainingData.length;
      lossHistory.push(loss);
      
      if (verbose && (epoch % 10 === 0 || epoch === epochs - 1)) {
        console.log(`  Epoch ${epoch.toString().padStart(4)} / ${epochs}: Loss = ${loss.toFixed(6)}`);
      }
    }
    
    return lossHistory;
  }
  
  toJSON() {
    return JSON.stringify({
      type: 'HybridComplexHydrogenProxy',
      timestamp: new Date().toISOString(),
      config: {
        numFeatures: 20
      },
      weights: this.weights
    }, null, 2);
  }
  
  static fromJSON(json) {
    const data = JSON.parse(json);
    const model = new HybridComplexHydrogenProxy();
    model.weights = data.weights;
    return model;
  }
}

async function main() {
  const args = process.argv.slice(2);
  
  let samples = 2000;
  let epochs = 150;
  let outputFile = './proxy-data/hydrogen-proxy-complex-hybrid.json';
  let verbose = false;
  
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--samples') samples = parseInt(args[i + 1]);
    if (args[i] === '--epochs') epochs = parseInt(args[i + 1]);
    if (args[i] === '--output-json') outputFile = args[i + 1];
    if (args[i] === '--verbose') verbose = true;
  }
  
  console.log('='.repeat(80));
  console.log('PHASE 16.4.1-HYBRID: COMPLEX FEATURES + V2.1 TRAINING');
  console.log('='.repeat(80));
  console.log('');
  console.log('Strategy: Complex feature magnitudes + gradient descent (like v2.1)');
  console.log('');
  
  console.log('Generating training data...');
  const trainingData = generateTrainingData(samples);
  console.log(`✓ Generated ${trainingData.length} samples`);
  console.log('');
  
  console.log('Initializing model...');
  const model = new HybridComplexHydrogenProxy();
  console.log('✓ Model created');
  console.log('');
  
  console.log('Training...');
  const startTime = Date.now();
  const lossHistory = model.train(trainingData, epochs, 0.01, verbose);
  const trainTime = (Date.now() - startTime) / 1000;
  
  console.log('');
  console.log('Training complete!');
  console.log(`  Training time: ${trainTime.toFixed(2)}s`);
  console.log(`  Initial loss: ${lossHistory[0].toFixed(6)}`);
  console.log(`  Final loss: ${lossHistory[lossHistory.length - 1].toFixed(6)}`);
  console.log(`  Improvement: ${(lossHistory[0] - lossHistory[lossHistory.length - 1]).toFixed(6)}`);
  console.log('');
  
  console.log('Evaluating...');
  const testData = generateTrainingData(300);
  const testResult = model.computeLoss(testData);
  
  const errors = testResult.predictions.map(p => Math.abs(p.error));
  const relErrors = testResult.predictions.map(p => Math.abs(p.error / p.energy) * 100);
  
  const meanError = errors.reduce((a, b) => a + b) / errors.length;
  const maxError = Math.max(...errors);
  const meanRelError = relErrors.reduce((a, b) => a + b) / relErrors.length;
  const maxRelError = Math.max(...relErrors);
  
  console.log(`Test Loss: ${testResult.loss.toFixed(6)}`);
  console.log(`Mean Absolute Error: ${meanError.toFixed(4)} eV`);
  console.log(`Max Absolute Error: ${maxError.toFixed(4)} eV`);
  console.log(`Mean Relative Error: ${meanRelError.toFixed(2)}%`);
  console.log(`Max Relative Error: ${maxRelError.toFixed(2)}%`);
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
      sum += model.predict(r, Math.random() * 2 * Math.PI).energy;
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
  
  // Comparison to v2.1
  const v21Error = 114.62;
  const improvement = ((v21Error - avgRelError) / v21Error * 100);
  
  console.log('Comparison to v2.1:');
  console.log(`  v2.1 Error: ${v21Error.toFixed(2)}%`);
  console.log(`  v4.0-hybrid Error: ${avgRelError.toFixed(2)}%`);
  if (improvement > 0) {
    console.log(`  ✅ Improvement: ${improvement.toFixed(1)}% BETTER`);
  } else {
    console.log(`  ⚠️ Regression: ${Math.abs(improvement).toFixed(1)}% WORSE`);
  }
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
  if (avgRelError <= 100) {
    console.log('✅ PHASE 16.4.1-HYBRID SUCCESSFUL - Better than v2.1!');
  } else if (avgRelError < v21Error) {
    console.log(`✅ PHASE 16.4.1-HYBRID IMPROVED - ${improvement.toFixed(1)}% better than v2.1`);
  } else {
    console.log(`⚠️ PHASE 16.4.1-HYBRID - Continue optimization`);
  }
  console.log('='.repeat(80));
}

main().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
