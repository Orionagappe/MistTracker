/**
 * Task A3: Proxy Composer
 * Phase 15: ML Proxy Framework
 * 
 * Connects multiple proxies into chains with type checking and optimization.
 * Builds composite proxy trees suitable for chained evaluation.
 */

import { v4 as uuidv4 } from 'uuid';

/**
 * ProxyConnection: represents input/output connection between two proxies
 */
export class ProxyConnection {
  constructor({
    fromProxyId,
    toProxyId,
    fromOutputName,
    toInputName,
    typeMatch = true
  } = {}) {
    this.fromProxyId = fromProxyId;
    this.toProxyId = toProxyId;
    this.fromOutputName = fromOutputName;
    this.toInputName = toInputName;
    this.typeMatch = typeMatch;
  }

  toJSON() {
    return {
      fromProxyId: this.fromProxyId,
      toProxyId: this.toProxyId,
      fromOutputName: this.fromOutputName,
      toInputName: this.toInputName,
      typeMatch: this.typeMatch
    };
  }
}

/**
 * CompositeProxy: chain of connected proxies
 */
export class CompositeProxy {
  constructor({
    compositeId = uuidv4(),
    name = '',
    description = '',
    proxies = [],
    connections = []
  } = {}) {
    this.compositeId = compositeId;
    this.name = name;
    this.description = description;
    this.proxies = proxies; // Array of proxy objects
    this.connections = connections; // Array of ProxyConnection objects
    this.createdAt = new Date();
    this.executionOrder = []; // Topological sort of proxy execution
  }

  /**
   * Validate all connections are valid
   * @returns {Array} Array of validation errors (empty if valid)
   */
  validate() {
    const errors = [];
    const proxyIdMap = new Map();

    // Build proxy ID map
    for (const proxy of this.proxies) {
      proxyIdMap.set(proxy.proxyId, proxy);
    }

    // Check each connection
    for (const conn of this.connections) {
      const fromProxy = proxyIdMap.get(conn.fromProxyId);
      const toProxy = proxyIdMap.get(conn.toProxyId);

      if (!fromProxy) {
        errors.push(`Source proxy not found: ${conn.fromProxyId}`);
        continue;
      }
      if (!toProxy) {
        errors.push(`Target proxy not found: ${conn.toProxyId}`);
        continue;
      }

      // Check output exists on source
      const outputExists = fromProxy.outputs.some(out => out.name === conn.fromOutputName);
      if (!outputExists) {
        errors.push(
          `Output "${conn.fromOutputName}" not found on proxy ${conn.fromProxyId}`
        );
      }

      // Check input exists on target
      const inputExists = toProxy.inputs.some(inp => inp.name === conn.toInputName);
      if (!inputExists) {
        errors.push(
          `Input "${conn.toInputName}" not found on proxy ${conn.toProxyId}`
        );
      }

      // Check type compatibility
      const outputType = fromProxy.outputs.find(out => out.name === conn.fromOutputName)?.type;
      const inputType = toProxy.inputs.find(inp => inp.name === conn.toInputName)?.type;

      if (outputType && inputType && outputType !== inputType) {
        errors.push(
          `Type mismatch: ${conn.fromProxyId}.${conn.fromOutputName}(${outputType}) → ${conn.toProxyId}.${conn.toInputName}(${inputType})`
        );
      }
    }

    return errors;
  }

  /**
   * Compute topological sort for execution order
   * @returns {Array<String>} Proxy IDs in execution order
   */
  computeExecutionOrder() {
    const visited = new Set();
    const stack = [];
    const adjList = new Map();

    // Build adjacency list
    for (const proxy of this.proxies) {
      if (!adjList.has(proxy.proxyId)) {
        adjList.set(proxy.proxyId, []);
      }
    }

    for (const conn of this.connections) {
      adjList.get(conn.fromProxyId).push(conn.toProxyId);
    }

    // DFS for topological sort
    const dfs = (nodeId) => {
      visited.add(nodeId);
      for (const neighbor of adjList.get(nodeId) || []) {
        if (!visited.has(neighbor)) {
          dfs(neighbor);
        }
      }
      stack.push(nodeId);
    };

    for (const proxy of this.proxies) {
      if (!visited.has(proxy.proxyId)) {
        dfs(proxy.proxyId);
      }
    }

    this.executionOrder = stack.reverse();
    return this.executionOrder;
  }

  /**
   * Detect and report redundant proxies/conversions
   * @returns {Array} Optimization suggestions
   */
  findOptimizations() {
    const optimizations = [];

    // Check for chains of same-type proxies
    for (let i = 0; i < this.proxies.length - 1; i++) {
      for (let j = i + 1; j < this.proxies.length; j++) {
        if (this.proxies[i].type === this.proxies[j].type) {
          optimizations.push({
            type: 'merge_same_type',
            description: `Proxies ${this.proxies[i].proxyId} and ${this.proxies[j].proxyId} are same type`,
            suggestion: 'Consider combining into single proxy'
          });
        }
      }
    }

    // Check for unused proxies
    const usedProxyIds = new Set();
    for (const conn of this.connections) {
      usedProxyIds.add(conn.fromProxyId);
      usedProxyIds.add(conn.toProxyId);
    }

    for (const proxy of this.proxies) {
      if (!usedProxyIds.has(proxy.proxyId)) {
        optimizations.push({
          type: 'unused_proxy',
          description: `Proxy ${proxy.proxyId} is not connected`,
          suggestion: 'Remove or connect to chain'
        });
      }
    }

    return optimizations;
  }

  /**
   * Serialize composite proxy
   */
  toJSON() {
    return {
      compositeId: this.compositeId,
      name: this.name,
      description: this.description,
      proxies: this.proxies.map(p => p.toJSON ? p.toJSON() : p),
      connections: this.connections.map(c => c.toJSON ? c.toJSON() : c),
      executionOrder: this.executionOrder,
      createdAt: this.createdAt.toISOString()
    };
  }

  static fromJSON(json) {
    const composite = new CompositeProxy({
      compositeId: json.compositeId,
      name: json.name,
      description: json.description,
      proxies: json.proxies,
      connections: json.connections.map(c => new ProxyConnection(c))
    });
    composite.executionOrder = json.executionOrder;
    composite.createdAt = new Date(json.createdAt);
    return composite;
  }
}

/**
 * ProxyComposer: builds and manages composite proxy chains
 */
export class ProxyComposer {
  constructor() {
    this.composites = new Map(); // compositeId -> CompositeProxy
  }

  /**
   * Create new composite proxy
   * @param {String} name - Composite name
   * @param {String} description - Description
   * @returns {CompositeProxy}
   */
  createComposite(name = '', description = '') {
    const composite = new CompositeProxy({
      name,
      description
    });

    this.composites.set(composite.compositeId, composite);
    return composite;
  }

  /**
   * Add proxy to composite
   * @param {String} compositeId - Composite ID
   * @param {Object} proxy - Proxy object to add
   * @returns {void}
   */
  addProxyToComposite(compositeId, proxy) {
    const composite = this.composites.get(compositeId);
    if (!composite) throw new Error(`Composite not found: ${compositeId}`);

    // Check for duplicate
    if (composite.proxies.some(p => p.proxyId === proxy.proxyId)) {
      throw new Error(`Proxy already in composite: ${proxy.proxyId}`);
    }

    composite.proxies.push(proxy);
  }

  /**
   * Connect two proxies in composite
   * @param {String} compositeId - Composite ID
   * @param {String} fromProxyId - Source proxy ID
   * @param {String} fromOutputName - Output name
   * @param {String} toProxyId - Target proxy ID
   * @param {String} toInputName - Input name
   * @returns {ProxyConnection}
   */
  connectProxies(compositeId, fromProxyId, fromOutputName, toProxyId, toInputName) {
    const composite = this.composites.get(compositeId);
    if (!composite) throw new Error(`Composite not found: ${compositeId}`);

    const connection = new ProxyConnection({
      fromProxyId,
      toProxyId,
      fromOutputName,
      toInputName
    });

    composite.connections.push(connection);
    return connection;
  }

  /**
   * Validate composite and return errors
   * @param {String} compositeId - Composite ID
   * @returns {Array} Error messages
   */
  validateComposite(compositeId) {
    const composite = this.composites.get(compositeId);
    if (!composite) return [`Composite not found: ${compositeId}`];

    return composite.validate();
  }

  /**
   * Compute execution order for composite
   * @param {String} compositeId - Composite ID
   * @returns {Array<String>} Proxy IDs in execution order
   */
  getExecutionOrder(compositeId) {
    const composite = this.composites.get(compositeId);
    if (!composite) throw new Error(`Composite not found: ${compositeId}`);

    return composite.computeExecutionOrder();
  }

  /**
   * Get optimization suggestions
   * @param {String} compositeId - Composite ID
   * @returns {Array} Optimization suggestions
   */
  getOptimizations(compositeId) {
    const composite = this.composites.get(compositeId);
    if (!composite) throw new Error(`Composite not found: ${compositeId}`);

    return composite.findOptimizations();
  }

  /**
   * Export composite for storage
   * @param {String} compositeId - Composite ID
   * @returns {Object} JSON-serializable composite
   */
  export(compositeId) {
    const composite = this.composites.get(compositeId);
    if (!composite) throw new Error(`Composite not found: ${compositeId}`);

    return composite.toJSON();
  }

  /**
   * Import composite from JSON
   * @param {Object} json - JSON composite data
   * @returns {CompositeProxy}
   */
  import(json) {
    const composite = CompositeProxy.fromJSON(json);
    this.composites.set(composite.compositeId, composite);
    return composite;
  }

  /**
   * Get all composites
   * @returns {Array<CompositeProxy>}
   */
  getAllComposites() {
    return Array.from(this.composites.values());
  }

  /**
   * Delete composite
   * @param {String} compositeId - Composite ID
   * @returns {Boolean}
   */
  deleteComposite(compositeId) {
    return this.composites.delete(compositeId);
  }
}

export default {
  ProxyConnection,
  CompositeProxy,
  ProxyComposer
};
