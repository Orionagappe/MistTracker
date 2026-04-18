/**
 * Task B2: Versioning Graph (DAG)
 * Phase 16: Milestone & Simulation Versioning System
 * 
 * Tracks simulation progression as a DAG: parent sim → mutations → child sim
 * Supports branching, querying, and visualization data export
 */

import { v4 as uuidv4 } from 'uuid';

/**
 * VersionNode: represents a single simulation in the version DAG
 */
export class VersionNode {
  constructor({
    versionId = uuidv4(),
    sessionId,
    parentVersionId = null,
    mutations = {},
    branchName = '',
    description = '',
    metadata = {}
  } = {}) {
    this.versionId = versionId;
    this.sessionId = sessionId;
    this.parentVersionId = parentVersionId;
    this.mutations = mutations; // {paramName: {from, to}, ...}
    this.branchName = branchName;
    this.description = description;
    this.metadata = metadata;
    this.createdAt = new Date();
    this.children = []; // Array of child versionIds
  }

  /**
   * Add child version
   * @param {String} childVersionId - ID of child version
   */
  addChild(childVersionId) {
    if (!this.children.includes(childVersionId)) {
      this.children.push(childVersionId);
    }
  }

  /**
   * Check if this is a root node (no parent)
   * @returns {Boolean}
   */
  isRoot() {
    return this.parentVersionId === null;
  }

  /**
   * Check if this is a leaf node (no children)
   * @returns {Boolean}
   */
  isLeaf() {
    return this.children.length === 0;
  }

  /**
   * Get mutation summary
   * @returns {String} Human-readable mutation description
   */
  getMutationSummary() {
    const mutationKeys = Object.keys(this.mutations);
    if (mutationKeys.length === 0) return 'no mutations';
    return mutationKeys.map(key => {
      const mut = this.mutations[key];
      return `${key}: ${mut.from} → ${mut.to}`;
    }).join(', ');
  }

  toJSON() {
    return {
      versionId: this.versionId,
      sessionId: this.sessionId,
      parentVersionId: this.parentVersionId,
      mutations: this.mutations,
      branchName: this.branchName,
      description: this.description,
      metadata: this.metadata,
      children: this.children,
      createdAt: this.createdAt.toISOString()
    };
  }

  static fromJSON(json) {
    const node = new VersionNode(json);
    node.createdAt = new Date(json.createdAt);
    node.children = json.children || [];
    return node;
  }
}

/**
 * VersioningGraph: DAG structure for simulation versions
 */
export class VersioningGraph {
  constructor(sessionId, dbConnection = null) {
    this.sessionId = sessionId;
    this.db = dbConnection;
    this.nodes = new Map(); // versionId -> VersionNode
    this.rootIds = []; // Array of root version IDs
  }

  /**
   * Create new version node
   * @param {Object} options - {parentVersionId, mutations, branchName, description, metadata}
   * @returns {VersionNode}
   */
  createVersion(options = {}) {
    const node = new VersionNode({
      sessionId: this.sessionId,
      ...options
    });

    this.nodes.set(node.versionId, node);

    // Link to parent
    if (node.parentVersionId) {
      const parent = this.nodes.get(node.parentVersionId);
      if (parent) {
        parent.addChild(node.versionId);
      }
    } else {
      // Root node
      this.rootIds.push(node.versionId);
    }

    console.log(`✓ Version created: ${node.versionId} (parent: ${node.parentVersionId || 'root'})`);
    return node;
  }

  /**
   * Get version node by ID
   * @param {String} versionId - Version ID
   * @returns {VersionNode|null}
   */
  getVersion(versionId) {
    return this.nodes.get(versionId) || null;
  }

  /**
   * Get all ancestors (parent chain)
   * @param {String} versionId - Starting version ID
   * @returns {Array<VersionNode>} Nodes from this version to root (inclusive)
   */
  getAncestors(versionId) {
    const ancestors = [];
    let current = this.nodes.get(versionId);

    while (current) {
      ancestors.push(current);
      current = current.parentVersionId ? this.nodes.get(current.parentVersionId) : null;
    }

    return ancestors;
  }

  /**
   * Get all descendants
   * @param {String} versionId - Starting version ID
   * @returns {Array<VersionNode>} All child versions recursively
   */
  getDescendants(versionId) {
    const descendants = [];
    const queue = [versionId];

    while (queue.length > 0) {
      const currentId = queue.shift();
      const current = this.nodes.get(currentId);

      if (current) {
        descendants.push(current);
        queue.push(...current.children);
      }
    }

    return descendants;
  }

  /**
   * Get sibling versions (share same parent)
   * @param {String} versionId - Version ID
   * @returns {Array<VersionNode>}
   */
  getSiblings(versionId) {
    const version = this.nodes.get(versionId);
    if (!version || !version.parentVersionId) return [];

    const parent = this.nodes.get(version.parentVersionId);
    if (!parent) return [];

    return parent.children
      .map(childId => this.nodes.get(childId))
      .filter(child => child && child.versionId !== versionId);
  }

  /**
   * Get all branches from root
   * @returns {Array<Array<VersionNode>>} Each element is a path from root to leaf
   */
  getAllBranches() {
    const branches = [];

    const traverseBranch = (nodeId, path = []) => {
      const node = this.nodes.get(nodeId);
      if (!node) return;

      path = [...path, node];

      if (node.children.length === 0) {
        // Leaf node - complete branch
        branches.push(path);
      } else {
        // Continue traversing
        for (const childId of node.children) {
          traverseBranch(childId, path);
        }
      }
    };

    for (const rootId of this.rootIds) {
      traverseBranch(rootId);
    }

    return branches;
  }

  /**
   * Find most recent leaf version (tip of main branch)
   * @returns {VersionNode|null}
   */
  getLatestVersion() {
    const leaves = [];

    for (const [, node] of this.nodes) {
      if (node.isLeaf()) {
        leaves.push(node);
      }
    }

    if (leaves.length === 0) return null;

    return leaves.reduce((latest, current) =>
      current.createdAt > latest.createdAt ? current : latest
    );
  }

  /**
   * Clone version with mutations
   * @param {String} sourceVersionId - Version to clone from
   * @param {Object} mutations - Changes to make
   * @param {String} branchName - Name for new branch
   * @returns {VersionNode} New version node
   */
  cloneVersion(sourceVersionId, mutations = {}, branchName = '') {
    const source = this.nodes.get(sourceVersionId);
    if (!source) throw new Error(`Source version not found: ${sourceVersionId}`);

    return this.createVersion({
      parentVersionId: sourceVersionId,
      mutations,
      branchName: branchName || `branch-${Date.now()}`
    });
  }

  /**
   * Export graph as visualization data (for UI)
   * @returns {Object} {nodes, edges} for graph visualization
   */
  exportForVisualization() {
    const nodes = [];
    const edges = [];

    for (const [, node] of this.nodes) {
      nodes.push({
        id: node.versionId,
        label: node.branchName || node.versionId.slice(0, 8),
        parent: node.parentVersionId,
        isRoot: node.isRoot(),
        isLeaf: node.isLeaf(),
        createdAt: node.createdAt.toISOString(),
        mutationSummary: node.getMutationSummary(),
        metadata: node.metadata
      });

      if (node.parentVersionId) {
        edges.push({
          from: node.parentVersionId,
          to: node.versionId,
          label: node.getMutationSummary()
        });
      }
    }

    return { nodes, edges };
  }

  /**
   * Export graph structure as JSON
   * @returns {Array} Array of node JSONs
   */
  async exportAsJSON() {
    const exported = [];
    for (const [, node] of this.nodes) {
      exported.push(node.toJSON());
    }
    return exported;
  }

  /**
   * Import graph from JSON
   * @param {Array} nodes - Array of node JSONs
   */
  async importFromJSON(nodes) {
    for (const nodeJson of nodes) {
      const node = VersionNode.fromJSON(nodeJson);
      this.nodes.set(node.versionId, node);

      if (node.isRoot()) {
        this.rootIds.push(node.versionId);
      } else {
        const parent = this.nodes.get(node.parentVersionId);
        if (parent) {
          parent.addChild(node.versionId);
        }
      }
    }
  }

  /**
   * Save graph to database
   * @returns {Promise<void>}
   */
  async saveToDatabase() {
    if (!this.db) {
      console.warn('No database connection available');
      return;
    }

    for (const [, node] of this.nodes) {
      await this.db.query(
        `INSERT INTO version_graph 
        (versionId, sessionId, parentVersionId, mutations, branchName)
        VALUES (?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
        mutations = VALUES(mutations), branchName = VALUES(branchName)`,
        [
          node.versionId,
          node.sessionId,
          node.parentVersionId,
          JSON.stringify(node.mutations),
          node.branchName
        ]
      );
    }

    console.log(`✓ Saved ${this.nodes.size} versions to database`);
  }

  /**
   * Load graph from database
   * @returns {Promise<void>}
   */
  async loadFromDatabase() {
    if (!this.db) {
      console.warn('No database connection available');
      return;
    }

    const [rows] = await this.db.query(
      'SELECT * FROM version_graph WHERE sessionId = ? ORDER BY created_at ASC',
      [this.sessionId]
    );

    for (const row of rows) {
      const node = new VersionNode({
        versionId: row.versionId,
        sessionId: row.sessionId,
        parentVersionId: row.parentVersionId,
        mutations: typeof row.mutations === 'string' ? JSON.parse(row.mutations) : row.mutations,
        branchName: row.branchName
      });

      this.nodes.set(node.versionId, node);

      if (node.isRoot()) {
        this.rootIds.push(node.versionId);
      } else {
        const parent = this.nodes.get(node.parentVersionId);
        if (parent) {
          parent.addChild(node.versionId);
        }
      }
    }

    console.log(`✓ Loaded ${this.nodes.size} versions from database`);
  }

  /**
   * Get path from root to specified version
   * @param {String} versionId - Target version ID
   * @returns {Array<VersionNode>} Path from root to target
   */
  getPathFromRoot(versionId) {
    const path = this.getAncestors(versionId);
    return path.reverse();
  }

  /**
   * Get stats on graph
   * @returns {Object} {totalVersions, rootCount, leaves, depth, branches}
   */
  getStats() {
    const leaves = Array.from(this.nodes.values()).filter(n => n.isLeaf());
    let maxDepth = 0;

    for (const [, node] of this.nodes) {
      const depth = this.getAncestors(node.versionId).length - 1;
      maxDepth = Math.max(maxDepth, depth);
    }

    return {
      totalVersions: this.nodes.size,
      rootCount: this.rootIds.length,
      leafCount: leaves.length,
      maxDepth,
      branchCount: this.getAllBranches().length
    };
  }
}

export default {
  VersionNode,
  VersioningGraph
};
