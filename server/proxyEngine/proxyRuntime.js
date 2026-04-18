/**
 * Task A4: Runtime Proxy Engine
 * Phase 15: ML Proxy Framework
 * 
 * Fast evaluation of proxy chains with fallback to full simulation.
 * Tracks execution time, accuracy, and uncertainty metrics.
 */

import * as proxyEngine from './index.js';

/**
 * ProxyExecutionContext: tracks state during proxy chain execution
 */
export class ProxyExecutionContext {
  constructor({
    sessionId,
    proxyChainId,
    executionStartTime = Date.now()
  } = {}) {
    this.sessionId = sessionId;
    this.proxyChainId = proxyChainId;
    this.executionStartTime = executionStartTime;
    this.executionLog = []; // Array of {proxyId, input, output, duration, error}
    this.intermediateResults = new Map(); // proxyId -> output
    this.totalExecutionTime = 0;
    this.uncertaintyScore = 0.0; // 0-1, higher = more uncertain
    this.fallbackTriggered = false;
    this.finalOutput = null;
  }

  /**
   * Record proxy execution step
   */
  logStep(proxyId, input, output, duration, error = null) {
    this.executionLog.push({
      proxyId,
      input,
      output,
      duration,
      error,
      timestamp: Date.now()
    });

    if (output) {
      this.intermediateResults.set(proxyId, output);
    }
  }

  /**
   * Update uncertainty score based on execution
   */
  updateUncertainty(newScore) {
    this.uncertaintyScore = Math.max(this.uncertaintyScore, Math.min(newScore, 1.0));
  }

  /**
   * Finalize execution
   */
  finish(output) {
    this.totalExecutionTime = Date.now() - this.executionStartTime;
    this.finalOutput = output;
  }

  /**
   * Export execution report
   */
  toJSON() {
    return {
      sessionId: this.sessionId,
      proxyChainId: this.proxyChainId,
      executionLog: this.executionLog,
      totalExecutionTime: this.totalExecutionTime,
      uncertaintyScore: this.uncertaintyScore,
      fallbackTriggered: this.fallbackTriggered,
      stepCount: this.executionLog.length
    };
  }
}

/**
 * RuntimeProxyEngine: evaluates proxy chains with fast execution
 */
export class RuntimeProxyEngine {
  constructor({
    uncertaintyThreshold = 0.3, // Fallback if uncertainty > 30%
    timeoutMs = 5000, // Max execution time
    enableMatrixOptimization = true
  } = {}) {
    this.uncertaintyThreshold = uncertaintyThreshold;
    this.timeoutMs = timeoutMs;
    this.enableMatrixOptimization = enableMatrixOptimization;
    this.executionContexts = new Map(); // executionId -> ProxyExecutionContext
  }

  /**
   * Execute composite proxy chain
   * @param {CompositeProxy} composite - Composite proxy to execute
   * @param {Object} initialInputs - Initial input values {inputName: value, ...}
   * @param {Function} fallbackFn - Function to call if fallback needed
   * @returns {Promise<{output, context, fallbackUsed}>}
   */
  async execute(composite, initialInputs, fallbackFn = null) {
    const executionId = `exec-${Date.now()}`;
    const context = new ProxyExecutionContext({
      sessionId: composite.name,
      proxyChainId: composite.compositeId
    });

    this.executionContexts.set(executionId, context);

    try {
      // Get execution order
      const execOrder = composite.computeExecutionOrder();
      if (execOrder.length === 0) {
        throw new Error('No proxies to execute in composite');
      }

      // Build proxy ID map
      const proxyMap = new Map();
      for (const proxy of composite.proxies) {
        proxyMap.set(proxy.proxyId, proxy);
      }

      // Initialize proxy outputs
      const proxyOutputs = new Map();

      // Execute each proxy in order
      for (const proxyId of execOrder) {
        const proxy = proxyMap.get(proxyId);
        if (!proxy) continue;

        const stepStartTime = Date.now();

        try {
          // Gather inputs for this proxy from previous outputs or initial inputs
          const proxyInputs = this._gatherInputs(
            proxy,
            initialInputs,
            proxyOutputs,
            composite.connections
          );

          // Execute proxy
          let output;
          if (proxy.type === 'neural_network') {
            // Optimize NN execution with matrix ops
            const inputVector = this._objectToVector(proxyInputs, proxy.inputs);
            const outputVector = proxy.forward(inputVector);
            output = this._vectorToObject(outputVector, proxy.outputs);
          } else {
            // Standard evaluation
            output = proxy.evaluate(proxyInputs);
          }

          const duration = Date.now() - stepStartTime;
          context.logStep(proxyId, proxyInputs, output, duration);

          // Track uncertainty for this step
          const stepUncertainty = this._estimateUncertainty(proxy, output);
          context.updateUncertainty(stepUncertainty);

          proxyOutputs.set(proxyId, output);

          // Check timeout
          if (context.totalExecutionTime > this.timeoutMs) {
            throw new Error(`Proxy chain execution timeout (${this.timeoutMs}ms)`);
          }
        } catch (error) {
          const duration = Date.now() - stepStartTime;
          context.logStep(proxyId, {}, null, duration, error.message);

          // Trigger fallback on proxy error
          if (fallbackFn && context.uncertaintyScore < 0.5) {
            console.warn(`⚠️ Proxy ${proxyId} failed, attempting fallback`);
            context.fallbackTriggered = true;
            const fallbackOutput = await fallbackFn(initialInputs, composite);
            context.finish(fallbackOutput);
            return { output: fallbackOutput, context, fallbackUsed: true };
          }

          throw error;
        }
      }

      // Collect final output
      const finalOutput = this._collectFinalOutputs(
        composite,
        initialInputs,
        proxyOutputs
      );

      context.finish(finalOutput);

      // Check if fallback should be triggered due to high uncertainty
      if (context.uncertaintyScore > this.uncertaintyThreshold && fallbackFn) {
        console.warn(
          `⚠️ Uncertainty ${context.uncertaintyScore.toFixed(2)} > threshold ${this.uncertaintyThreshold}, falling back`
        );
        context.fallbackTriggered = true;
        const fallbackOutput = await fallbackFn(initialInputs, composite);
        context.finish(fallbackOutput);
        return { output: fallbackOutput, context, fallbackUsed: true };
      }

      return { output: finalOutput, context, fallbackUsed: false };
    } catch (error) {
      console.error('Error executing proxy chain:', error);
      context.finish(null);

      // Fallback on critical error
      if (fallbackFn) {
        context.fallbackTriggered = true;
        const fallbackOutput = await fallbackFn(initialInputs, composite);
        context.finish(fallbackOutput);
        return { output: fallbackOutput, context, fallbackUsed: true };
      }

      throw error;
    }
  }

  /**
   * Gather inputs for proxy from initial inputs and previous outputs
   * @private
   */
  _gatherInputs(proxy, initialInputs, proxyOutputs, connections) {
    const inputs = {};

    for (const inputDef of proxy.inputs) {
      // Check if this input is connected from another proxy
      const connection = connections.find(
        c => c.toProxyId === proxy.proxyId && c.toInputName === inputDef.name
      );

      if (connection) {
        const sourceOutput = proxyOutputs.get(connection.fromProxyId);
        if (sourceOutput && connection.fromOutputName in sourceOutput) {
          inputs[inputDef.name] = sourceOutput[connection.fromOutputName];
        }
      } else {
        // Use initial input if available
        if (inputDef.name in initialInputs) {
          inputs[inputDef.name] = initialInputs[inputDef.name];
        }
      }
    }

    return inputs;
  }

  /**
   * Convert object to vector based on input schema
   * @private
   */
  _objectToVector(obj, inputSchema) {
    return inputSchema.map(inputDef => obj[inputDef.name] || 0);
  }

  /**
   * Convert vector to object based on output schema
   * @private
   */
  _vectorToObject(vector, outputSchema) {
    const obj = {};
    outputSchema.forEach((outputDef, idx) => {
      obj[outputDef.name] = vector[idx] || 0;
    });
    return obj;
  }

  /**
   * Estimate uncertainty for proxy output
   * Simple heuristic: larger magnitudes = higher uncertainty
   * @private
   */
  _estimateUncertainty(proxy, output) {
    if (!output) return 1.0;

    // For ML proxies, typically lower uncertainty
    if (proxy.type === 'neural_network') {
      return 0.05;
    }

    // For lookup tables, check distance to nearest neighbor
    if (proxy.type === 'lookup_table' && output.distance !== undefined) {
      return Math.min(output.distance / 100, 1.0);
    }

    // Default: moderate uncertainty
    return 0.1;
  }

  /**
   * Collect final outputs from proxy chain
   * @private
   */
  _collectFinalOutputs(composite, initialInputs, proxyOutputs) {
    // Return outputs from leaf proxies (no outgoing connections)
    const leafProxyIds = new Set();

    for (const proxy of composite.proxies) {
      const hasOutgoingConnection = composite.connections.some(
        c => c.fromProxyId === proxy.proxyId
      );
      if (!hasOutgoingConnection) {
        leafProxyIds.add(proxy.proxyId);
      }
    }

    const output = {};

    for (const proxyId of leafProxyIds) {
      const proxyOutput = proxyOutputs.get(proxyId);
      if (proxyOutput) {
        Object.assign(output, proxyOutput);
      }
    }

    return output;
  }

  /**
   * Get execution context by ID
   */
  getContext(executionId) {
    return this.executionContexts.get(executionId);
  }

  /**
   * Clear old execution contexts (keep last N)
   */
  pruneContexts(keepCount = 100) {
    if (this.executionContexts.size > keepCount) {
      const ids = Array.from(this.executionContexts.keys());
      const toDelete = ids.slice(0, ids.length - keepCount);

      for (const id of toDelete) {
        this.executionContexts.delete(id);
      }

      console.log(`✓ Pruned ${toDelete.length} execution contexts`);
    }
  }

  /**
   * Get execution statistics
   */
  getStats() {
    let totalExecutions = 0;
    let avgExecutionTime = 0;
    let fallbackCount = 0;
    let avgUncertainty = 0;

    for (const context of this.executionContexts.values()) {
      totalExecutions++;
      avgExecutionTime += context.totalExecutionTime;
      if (context.fallbackTriggered) fallbackCount++;
      avgUncertainty += context.uncertaintyScore;
    }

    if (totalExecutions > 0) {
      avgExecutionTime /= totalExecutions;
      avgUncertainty /= totalExecutions;
    }

    return {
      totalExecutions,
      avgExecutionTime,
      avgUncertainty,
      fallbackCount,
      fallbackRate: totalExecutions > 0 ? (fallbackCount / totalExecutions * 100).toFixed(2) + '%' : 'N/A'
    };
  }
}

export default {
  ProxyExecutionContext,
  RuntimeProxyEngine
};
