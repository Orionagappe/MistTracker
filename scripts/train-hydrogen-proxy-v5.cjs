/**
 * Phase 16.5: Enhanced Hydrogen Proxy Trainer (v5.0)
 * Simplified implementation with single hidden layer
 * 
 * Architecture: 20 exponential features → 64 hidden nodes (ReLU) → 3 outputs
 */

const fs = require('fs');

// ============================================================================
// CONFIGURATION
// ============================================================================

const CONFIG = {
    samples: 2000,
    epochs: 300,
    learningRate: 0.0001,
    batchSize: 64,
    momentum: 0.9,
    l2Reg: 0.001,
    hiddenSize: 64,
    outputDir: './proxy-data',
    verbose: false
};

// Parse command line arguments
for (let i = 2; i < process.argv.length; i++) {
    if (process.argv[i] === '--samples' && i + 1 < process.argv.length) {
        CONFIG.samples = parseInt(process.argv[++i]);
    } else if (process.argv[i] === '--epochs' && i + 1 < process.argv.length) {
        CONFIG.epochs = parseInt(process.argv[++i]);
    } else if (process.argv[i] === '--output-json' && i + 1 < process.argv.length) {
        CONFIG.outputJson = process.argv[++i];
    } else if (process.argv[i] === '--verbose') {
        CONFIG.verbose = true;
    }
}

// ============================================================================
// UTILITIES
// ============================================================================

function gaussianRandom() {
    let u1 = 0; while(u1 === 0) u1 = Math.random();
    let u2 = Math.random();
    return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
}

function initMatrix(rows, cols, scale = 0.01) {
    const matrix = [];
    for (let i = 0; i < rows; i++) {
        const row = [];
        for (let j = 0; j < cols; j++) {
            row.push(gaussianRandom() * scale);
        }
        matrix.push(row);
    }
    return matrix;
}

function matmul(a, b) {
    const result = Array(a.length).fill(null).map(() => Array(b[0].length).fill(0));
    for (let i = 0; i < a.length; i++) {
        for (let k = 0; k < b.length; k++) {
            if (a[i][k] !== 0) {
                for (let j = 0; j < b[0].length; j++) {
                    result[i][j] += a[i][k] * b[k][j];
                }
            }
        }
    }
    return result;
}

function transpose(matrix) {
    const result = Array(matrix[0].length).fill(null).map(() => Array(matrix.length).fill(0));
    for (let i = 0; i < matrix.length; i++) {
        for (let j = 0; j < matrix[0].length; j++) {
            result[j][i] = matrix[i][j];
        }
    }
    return result;
}

function relu(x) {
    return Math.max(0, x);
}

function reluDeriv(x) {
    return x > 0 ? 1 : 0;
}

// ============================================================================
// HYDROGEN PROXY V5.0
// ============================================================================

class HydrogenProxyV5 {
    constructor(inputSize = 20, outputSize = 3, hiddenSize = 64) {
        this.inputSize = inputSize;
        this.outputSize = outputSize;
        this.hiddenSize = hiddenSize;
        
        const heScale = Math.sqrt(2.0 / inputSize);
        const outScale = Math.sqrt(1.0 / hiddenSize);
        
        // Layer 1: Input → Hidden
        this.w1 = initMatrix(inputSize, hiddenSize, heScale);
        this.b1 = Array(hiddenSize).fill(0);
        this.v1w = initMatrix(inputSize, hiddenSize, 0);  // Momentum
        this.v1b = Array(hiddenSize).fill(0);
        
        // Layer 2: Hidden → Output
        this.w2 = initMatrix(hiddenSize, outputSize, outScale);
        this.b2 = Array(outputSize).fill(0);
        this.v2w = initMatrix(hiddenSize, outputSize, 0);  // Momentum
        this.v2b = Array(outputSize).fill(0);
        
        this.lossHistory = [];
        this.bestLoss = Infinity;
        this.patience = 0;
    }
    
    extractFeatures(r, theta) {
        const a0 = 1.0;
        const features = [];
        
        features.push(Math.exp(-r / a0));
        features.push(Math.exp(-r / (2 * a0)));
        features.push(Math.exp(-r / (3 * a0)));
        features.push(Math.exp(-r / (4 * a0)));
        features.push(r * Math.exp(-r / (2 * a0)));
        features.push(r * Math.exp(-r / (3 * a0)));
        features.push(r * Math.exp(-r / (4 * a0)));
        features.push(r * r * Math.exp(-r / (3 * a0)));
        
        features.push(Math.cos(theta));
        features.push(Math.sin(theta));
        features.push(Math.cos(2 * theta));
        features.push(Math.sin(2 * theta));
        features.push(Math.cos(3 * theta));
        features.push(Math.sin(3 * theta));
        
        features.push(r);
        features.push(r * r);
        features.push(Math.sqrt(r));
        features.push(1.0 / (r + 0.1));
        
        features.push(r * Math.cos(theta));
        features.push(r * Math.sin(theta));
        
        return features;
    }
    
    forward(x) {
        // x: [batchSize, 20]
        // hidden: [batchSize, 64]
        // output: [batchSize, 3]
        
        const batchSize = x.length;
        
        // Layer 1
        const hidden = [];
        for (let i = 0; i < batchSize; i++) {
            const h = Array(this.hiddenSize).fill(0);
            for (let j = 0; j < this.hiddenSize; j++) {
                let sum = this.b1[j];
                for (let k = 0; k < this.inputSize; k++) {
                    sum += x[i][k] * this.w1[k][j];
                }
                h[j] = relu(sum);
            }
            hidden.push(h);
        }
        
        // Layer 2
        const output = [];
        for (let i = 0; i < batchSize; i++) {
            const o = Array(this.outputSize).fill(0);
            for (let j = 0; j < this.outputSize; j++) {
                let sum = this.b2[j];
                for (let k = 0; k < this.hiddenSize; k++) {
                    sum += hidden[i][k] * this.w2[k][j];
                }
                o[j] = sum;
            }
            output.push(o);
        }
        
        return { hidden, output };
    }
    
    backward(x, y, hidden, output, lr, momentum) {
        const batchSize = x.length;
        
        // Output layer gradients
        const dw2 = Array(this.hiddenSize).fill(null).map(() => Array(this.outputSize).fill(0));
        const db2 = Array(this.outputSize).fill(0);
        
        let loss = 0;
        for (let i = 0; i < batchSize; i++) {
            const error = output[i][0] - y[i];
            loss += error * error;
            
            for (let j = 0; j < this.outputSize; j++) {
                const delta = (output[i][j] - (j === 0 ? y[i] : 0)) / batchSize;
                db2[j] += delta;
                for (let k = 0; k < this.hiddenSize; k++) {
                    dw2[k][j] += hidden[i][k] * delta;
                }
            }
        }
        
        loss = loss / batchSize;
        
        // Update layer 2 with momentum
        for (let k = 0; k < this.hiddenSize; k++) {
            for (let j = 0; j < this.outputSize; j++) {
                this.v2w[k][j] = momentum * this.v2w[k][j] + lr * (dw2[k][j] + CONFIG.l2Reg * this.w2[k][j]);
                this.w2[k][j] -= this.v2w[k][j];
            }
        }
        
        for (let j = 0; j < this.outputSize; j++) {
            this.v2b[j] = momentum * this.v2b[j] + lr * db2[j];
            this.b2[j] -= this.v2b[j];
        }
        
        // Hidden layer gradients (simplified: no backprop through ReLU)
        const dw1 = Array(this.inputSize).fill(null).map(() => Array(this.hiddenSize).fill(0));
        const db1 = Array(this.hiddenSize).fill(0);
        
        for (let i = 0; i < batchSize; i++) {
            for (let j = 0; j < this.hiddenSize; j++) {
                let delta = 0;
                for (let k = 0; k < this.outputSize; k++) {
                    delta += (output[i][k] - (k === 0 ? y[i] : 0)) * this.w2[j][k];
                }
                delta *= reluDeriv(hidden[i][j]) / batchSize;
                db1[j] += delta;
                
                for (let k = 0; k < this.inputSize; k++) {
                    dw1[k][j] += x[i][k] * delta;
                }
            }
        }
        
        // Update layer 1 with momentum
        for (let k = 0; k < this.inputSize; k++) {
            for (let j = 0; j < this.hiddenSize; j++) {
                this.v1w[k][j] = momentum * this.v1w[k][j] + lr * (dw1[k][j] + CONFIG.l2Reg * this.w1[k][j]);
                this.w1[k][j] -= this.v1w[k][j];
            }
        }
        
        for (let j = 0; j < this.hiddenSize; j++) {
            this.v1b[j] = momentum * this.v1b[j] + lr * db1[j];
            this.b1[j] -= this.v1b[j];
        }
        
        return loss;
    }
    
    train(data, epochs, lr, batchSize, verbose) {
        const startTime = Date.now();
        
        for (let epoch = 0; epoch < epochs; epoch++) {
            // Shuffle
            for (let i = data.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [data[i], data[j]] = [data[j], data[i]];
            }
            
            let epochLoss = 0;
            const numBatches = Math.ceil(data.length / batchSize);
            
            for (let batch = 0; batch < numBatches; batch++) {
                const start = batch * batchSize;
                const end = Math.min(start + batchSize, data.length);
                const batchData = data.slice(start, end);
                
                const x = batchData.map(d => d.features);
                const y = batchData.map(d => d.target);
                
                const { hidden, output } = this.forward(x);
                const loss = this.backward(x, y, hidden, output, lr, CONFIG.momentum);
                
                epochLoss += loss;
            }
            
            epochLoss /= numBatches;
            this.lossHistory.push(epochLoss);
            
            // Early stopping
            if (epochLoss < this.bestLoss) {
                this.bestLoss = epochLoss;
                this.patience = 0;
            } else {
                this.patience++;
                if (this.patience >= 20) {
                    if (verbose) console.log(`  Early stopping at epoch ${epoch}`);
                    break;
                }
            }
            
            // Learning rate decay
            if ((epoch + 1) % 50 === 0) {
                lr *= 0.95;
            }
            
            if (verbose && (epoch % 20 === 0 || epoch === epochs - 1)) {
                console.log(`    Epoch ${epoch}: Loss = ${epochLoss.toFixed(6)}`);
            }
        }
        
        const elapsed = (Date.now() - startTime) / 1000;
        return elapsed;
    }
    
    predictEnergy(r, theta) {
        const features = [this.extractFeatures(r, theta)];
        const { output } = this.forward(features);
        
        const mag = Math.sqrt(
            output[0][0] * output[0][0] +
            output[0][1] * output[0][1] +
            output[0][2] * output[0][2]
        );
        
        return -13.6 * Math.exp(-mag);
    }
    
    toJSON() {
        return {
            type: 'HydrogenProxyV5',
            version: '5.0',
            inputSize: this.inputSize,
            hiddenSize: this.hiddenSize,
            outputSize: this.outputSize,
            w1: this.w1,
            b1: this.b1,
            w2: this.w2,
            b2: this.b2,
            lossHistory: this.lossHistory
        };
    }
}

// ============================================================================
// MAIN
// ============================================================================

async function main() {
    console.log('');
    console.log('╔════════════════════════════════════════════════════════════════════════════╗');
    console.log('║       PHASE 16.5: ENHANCED HYDROGEN PROXY (v5.0) - HIDDEN LAYER           ║');
    console.log('║                  Architecture: 20 → 64 (ReLU) → 3                          ║');
    console.log('╚════════════════════════════════════════════════════════════════════════════╝');
    console.log('');
    
    // Generate data
    console.log('[1] Generating quantum state data...');
    const proxy = new HydrogenProxyV5(20, 3, CONFIG.hiddenSize);
    
    const quantumStates = [
        { energy: -13.6 },
        { energy: -3.4 },
        { energy: -3.4 },
        { energy: -1.51 },
        { energy: -1.51 },
        { energy: -1.51 }
    ];
    
    const data = [];
    for (let i = 0; i < CONFIG.samples; i++) {
        const state = quantumStates[i % quantumStates.length];
        const r = Math.random() * 10;
        const theta = Math.random() * 2 * Math.PI;
        const pert = (Math.random() - 0.5) * 0.2;
        
        data.push({
            features: proxy.extractFeatures(r, theta),
            target: state.energy + pert,
            r, theta, state: i % 6 + 1
        });
    }
    console.log(`    ✓ Generated ${data.length} samples`);
    console.log('');
    
    // Train
    console.log('[2] Training enhanced proxy (v5.0)...');
    console.log(`    Epochs: ${CONFIG.epochs}, Batch: ${CONFIG.batchSize}, Hidden: ${CONFIG.hiddenSize}`);
    const elapsed = proxy.train(data, CONFIG.epochs, CONFIG.learningRate, CONFIG.batchSize, CONFIG.verbose);
    
    const initialLoss = proxy.lossHistory[0];
    const finalLoss = proxy.lossHistory[proxy.lossHistory.length - 1];
    const improvement = ((initialLoss - finalLoss) / initialLoss * 100).toFixed(1);
    
    console.log(`    ✓ Completed in ${elapsed.toFixed(2)}s`);
    console.log(`    Initial loss: ${initialLoss.toFixed(6)}`);
    console.log(`    Final loss: ${finalLoss.toFixed(6)}`);
    console.log(`    Improvement: ${improvement}%`);
    console.log('');
    
    // Test
    console.log('[3] Testing on quantum states...');
    const testStates = [
        { name: '1s', energy: -13.6, r: 1.0, theta: 0.0 },
        { name: '2s', energy: -3.4, r: 2.0, theta: 0.0 },
        { name: '2p', energy: -3.4, r: 2.0, theta: Math.PI / 4 },
        { name: '3s', energy: -1.51, r: 3.0, theta: 0.0 },
        { name: '3p', energy: -1.51, r: 3.0, theta: Math.PI / 3 },
        { name: '3d', energy: -1.51, r: 3.0, theta: Math.PI / 2 }
    ];
    
    let totalError = 0;
    let maxError = 0;
    
    console.log('');
    console.log('    Quantum State Predictions:');
    for (const state of testStates) {
        const pred = proxy.predictEnergy(state.r, state.theta);
        const err = Math.abs(pred - state.energy);
        const relErr = (err / Math.abs(state.energy)) * 100;
        totalError += relErr;
        maxError = Math.max(maxError, relErr);
        
        console.log(`      ${state.name}: Expected ${state.energy.toFixed(2)} eV, Got ${pred.toFixed(4)} eV (${relErr.toFixed(2)}% error)`);
    }
    
    const avgError = totalError / testStates.length;
    console.log('');
    console.log(`    Average Relative Error: ${avgError.toFixed(2)}%`);
    console.log(`    Maximum Relative Error: ${maxError.toFixed(2)}%`);
    console.log('');
    
    // Compare to v2.1
    console.log('[4] Comparison to v2.1 baseline...');
    console.log(`    v2.1 (linear):       114.62% average error`);
    console.log(`    v5.0 (hidden layer): ${avgError.toFixed(2)}% average error`);
    
    if (avgError < 114.62) {
        const improvement = ((114.62 - avgError) / 114.62 * 100).toFixed(1);
        console.log(`    ✓ IMPROVEMENT: ${improvement}% better than v2.1`);
    } else {
        const diff = ((avgError - 114.62) / 114.62 * 100).toFixed(1);
        console.log(`    ⚠ DEGRADATION: ${diff}% worse than v2.1`);
    }
    console.log('');
    
    // Save
    console.log('[5] Saving model...');
    const outputFile = CONFIG.outputJson || `${CONFIG.outputDir}/hydrogen-proxy-v5-${Date.now()}.json`;
    
    try {
        if (!fs.existsSync(CONFIG.outputDir)) {
            fs.mkdirSync(CONFIG.outputDir, { recursive: true });
        }
        
        const modelData = {
            type: 'HydrogenProxyV5',
            version: '5.0',
            metadata: {
                date: new Date().toISOString(),
                samples: CONFIG.samples,
                epochs: CONFIG.epochs,
                finalLoss: finalLoss,
                avgError: avgError,
                maxError: maxError
            },
            model: proxy.toJSON()
        };
        
        fs.writeFileSync(outputFile, JSON.stringify(modelData, null, 2));
        const size = fs.statSync(outputFile).size / 1024;
        console.log(`    ✓ Saved to: ${outputFile} (${size.toFixed(1)} KB)`);
    } catch (err) {
        console.error(`    ✗ Error: ${err.message}`);
        process.exit(1);
    }
    
    console.log('');
    console.log('╔════════════════════════════════════════════════════════════════════════════╗');
    console.log('║                        PHASE 16.5 COMPLETE                                 ║');
    console.log('╚════════════════════════════════════════════════════════════════════════════╝');
    console.log('');
}

main().catch(err => {
    console.error('Error:', err);
    process.exit(1);
});
