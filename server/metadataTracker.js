/**
 * Task B4: Metadata Tracker
 * Phase 16: Milestone & Simulation Versioning System
 * 
 * Collects automatic runtime metrics and user-defined metadata.
 * Provides search, filter, and indexing for efficient queries.
 */

import { v4 as uuidv4 } from 'uuid';

/**
 * RuntimeMetrics: automatically collected metrics from simulation
 */
export class RuntimeMetrics {
  constructor({
    sessionId,
    startTime = Date.now(),
    initialMemory = 0,
    initialCpuTime = 0
  } = {}) {
    this.sessionId = sessionId;
    this.startTime = startTime;
    this.endTime = null;
    this.duration = 0;

    // CPU metrics
    this.cpuTimeMs = 0;
    this.cpuUsagePercent = 0;

    // Memory metrics
    this.peakMemoryMb = initialMemory;
    this.avgMemoryMb = initialMemory;
    this.memorySnapshots = [];

    // Accuracy metrics
    this.accuracyScore = 0.0; // 0-1
    this.errorRate = 0.0; // 0-1
    this.validationsPassed = 0;
    this.validationsFailed = 0;

    // Simulation metrics
    this.iterationCount = 0;
    this.convergenceAchieved = false;
    this.stepsToConvergence = 0;

    // Proxy metrics
    this.proxyExecutionCount = 0;
    this.proxyFallbackCount = 0;
    this.proxyAvgUncertainty = 0.0;

    this.collectedAt = new Date();
  }

  /**
   * Record CPU time snapshot
   */
  recordCpuTime(cpuTimeMs, usage = 0) {
    this.cpuTimeMs = cpuTimeMs;
    this.cpuUsagePercent = usage;
  }

  /**
   * Record memory snapshot
   */
  recordMemory(memoryMb) {
    this.memorySnapshots.push({
      timestamp: Date.now(),
      memoryMb
    });

    this.peakMemoryMb = Math.max(this.peakMemoryMb, memoryMb);
    
    // Calculate average
    const sum = this.memorySnapshots.reduce((acc, s) => acc + s.memoryMb, 0);
    this.avgMemoryMb = sum / this.memorySnapshots.length;
  }

  /**
   * Record validation result
   */
  recordValidation(passed, errorRate = 0) {
    if (passed) {
      this.validationsPassed++;
    } else {
      this.validationsFailed++;
      this.errorRate = Math.max(this.errorRate, errorRate);
    }

    // Update accuracy
    const total = this.validationsPassed + this.validationsFailed;
    this.accuracyScore = this.validationsPassed / total;
  }

  /**
   * Record convergence
   */
  recordConvergence(achieved, steps = 0) {
    this.convergenceAchieved = achieved;
    this.stepsToConvergence = steps;
  }

  /**
   * Record iteration
   */
  recordIteration() {
    this.iterationCount++;
  }

  /**
   * Record proxy execution
   */
  recordProxyExecution(fallbackUsed, uncertainty = 0) {
    this.proxyExecutionCount++;
    if (fallbackUsed) {
      this.proxyFallbackCount++;
    }

    // Update average uncertainty
    const totalUncertainty = this.proxyAvgUncertainty * (this.proxyExecutionCount - 1);
    this.proxyAvgUncertainty = (totalUncertainty + uncertainty) / this.proxyExecutionCount;
  }

  /**
   * Finalize metrics collection
   */
  finish() {
    this.endTime = Date.now();
    this.duration = this.endTime - this.startTime;
  }

  /**
   * Get summary statistics
   */
  getSummary() {
    return {
      duration: this.duration,
      cpuTimeMs: this.cpuTimeMs,
      cpuUsagePercent: this.cpuUsagePercent,
      peakMemoryMb: this.peakMemoryMb.toFixed(2),
      avgMemoryMb: this.avgMemoryMb.toFixed(2),
      accuracyScore: this.accuracyScore.toFixed(4),
      errorRate: this.errorRate.toFixed(4),
      validationsPassed: this.validationsPassed,
      validationsFailed: this.validationsFailed,
      iterationCount: this.iterationCount,
      convergenceAchieved: this.convergenceAchieved,
      stepsToConvergence: this.stepsToConvergence,
      proxyExecutionCount: this.proxyExecutionCount,
      proxyFallbackCount: this.proxyFallbackCount,
      proxyFallbackRate: this.proxyExecutionCount > 0 
        ? (this.proxyFallbackCount / this.proxyExecutionCount * 100).toFixed(2) + '%'
        : 'N/A',
      proxyAvgUncertainty: this.proxyAvgUncertainty.toFixed(4)
    };
  }

  toJSON() {
    return {
      sessionId: this.sessionId,
      duration: this.duration,
      cpuTimeMs: this.cpuTimeMs,
      cpuUsagePercent: this.cpuUsagePercent,
      peakMemoryMb: this.peakMemoryMb,
      avgMemoryMb: this.avgMemoryMb,
      accuracyScore: this.accuracyScore,
      errorRate: this.errorRate,
      validationsPassed: this.validationsPassed,
      validationsFailed: this.validationsFailed,
      iterationCount: this.iterationCount,
      convergenceAchieved: this.convergenceAchieved,
      stepsToConvergence: this.stepsToConvergence,
      proxyExecutionCount: this.proxyExecutionCount,
      proxyFallbackCount: this.proxyFallbackCount,
      proxyAvgUncertainty: this.proxyAvgUncertainty,
      collectedAt: this.collectedAt.toISOString()
    };
  }
}

/**
 * SimulationMetadata: user-defined and automatic metadata
 */
export class SimulationMetadata {
  constructor({
    metadataId = uuidv4(),
    sessionId,
    milestoneId,
    tags = [],
    description = '',
    hypothesis = '',
    author = '',
    runtimeMetrics = null,
    customFields = {}
  } = {}) {
    this.metadataId = metadataId;
    this.sessionId = sessionId;
    this.milestoneId = milestoneId;
    this.tags = tags;
    this.description = description;
    this.hypothesis = hypothesis;
    this.author = author;
    this.runtimeMetrics = runtimeMetrics;
    this.customFields = customFields;
    this.createdAt = new Date();
    this.updatedAt = new Date();
  }

  /**
   * Add tag
   */
  addTag(tag) {
    if (!this.tags.includes(tag)) {
      this.tags.push(tag);
    }
  }

  /**
   * Remove tag
   */
  removeTag(tag) {
    this.tags = this.tags.filter(t => t !== tag);
  }

  /**
   * Add custom field
   */
  setCustomField(key, value) {
    this.customFields[key] = value;
  }

  /**
   * Match against query
   */
  matches(query) {
    if (query.tags && query.tags.length > 0) {
      const hasAllTags = query.tags.every(tag => this.tags.includes(tag));
      if (!hasAllTags) return false;
    }

    if (query.author && this.author !== query.author) {
      return false;
    }

    if (query.minAccuracy && this.runtimeMetrics) {
      if (this.runtimeMetrics.accuracyScore < query.minAccuracy) {
        return false;
      }
    }

    if (query.convergenceOnly && !this.runtimeMetrics?.convergenceAchieved) {
      return false;
    }

    if (query.searchText) {
      const text = query.searchText.toLowerCase();
      const searchable = [
        this.description,
        this.hypothesis,
        this.author,
        this.tags.join(' '),
        Object.values(this.customFields).join(' ')
      ].join(' ').toLowerCase();

      if (!searchable.includes(text)) {
        return false;
      }
    }

    return true;
  }

  toJSON() {
    return {
      metadataId: this.metadataId,
      sessionId: this.sessionId,
      milestoneId: this.milestoneId,
      tags: this.tags,
      description: this.description,
      hypothesis: this.hypothesis,
      author: this.author,
      runtimeMetrics: this.runtimeMetrics?.toJSON(),
      customFields: this.customFields,
      createdAt: this.createdAt.toISOString(),
      updatedAt: this.updatedAt.toISOString()
    };
  }

  static fromJSON(json) {
    const metadata = new SimulationMetadata({
      metadataId: json.metadataId,
      sessionId: json.sessionId,
      milestoneId: json.milestoneId,
      tags: json.tags,
      description: json.description,
      hypothesis: json.hypothesis,
      author: json.author,
      runtimeMetrics: json.runtimeMetrics,
      customFields: json.customFields
    });
    metadata.createdAt = new Date(json.createdAt);
    metadata.updatedAt = new Date(json.updatedAt);
    return metadata;
  }
}

/**
 * MetadataTracker: manages metadata collection, storage, and queries
 */
export class MetadataTracker {
  constructor(dbConnection = null) {
    this.db = dbConnection;
    this.metadata = new Map(); // metadataId -> SimulationMetadata
    this.tagIndex = new Map(); // tag -> Set of metadataIds
    this.sessionIndex = new Map(); // sessionId -> Set of metadataIds
  }

  /**
   * Create new metadata entry
   */
  async createMetadata(sessionId, milestoneId, runtimeMetrics = null, userInfo = {}) {
    const metadata = new SimulationMetadata({
      sessionId,
      milestoneId,
      runtimeMetrics,
      author: userInfo.author || 'unknown',
      tags: userInfo.tags || [],
      description: userInfo.description || '',
      hypothesis: userInfo.hypothesis || ''
    });

    // Store locally
    this.metadata.set(metadata.metadataId, metadata);

    // Update indices
    this._updateIndices(metadata);

    // Store in database
    if (this.db) {
      await this.db.query(
        `INSERT INTO simulation_metadata 
        (metadataId, sessionId, milestoneId, tags, description, hypothesis, author, runtimeMetrics)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          metadata.metadataId,
          sessionId,
          milestoneId,
          JSON.stringify(metadata.tags),
          metadata.description,
          metadata.hypothesis,
          metadata.author,
          JSON.stringify(runtimeMetrics?.toJSON())
        ]
      );
    }

    console.log(`✓ Metadata created: ${metadata.metadataId}`);
    return metadata;
  }

  /**
   * Get metadata by ID
   */
  async getMetadata(metadataId) {
    if (this.metadata.has(metadataId)) {
      return this.metadata.get(metadataId);
    }

    if (this.db) {
      const [rows] = await this.db.query(
        'SELECT * FROM simulation_metadata WHERE metadataId = ?',
        [metadataId]
      );

      if (rows.length > 0) {
        const row = rows[0];
        const metadata = new SimulationMetadata({
          metadataId: row.metadataId,
          sessionId: row.sessionId,
          milestoneId: row.milestoneId,
          tags: typeof row.tags === 'string' ? JSON.parse(row.tags) : row.tags,
          description: row.description,
          hypothesis: row.hypothesis,
          author: row.author,
          runtimeMetrics: row.runtimeMetrics ? JSON.parse(row.runtimeMetrics) : null
        });

        this.metadata.set(metadataId, metadata);
        this._updateIndices(metadata);
        return metadata;
      }
    }

    return null;
  }

  /**
   * Search metadata by query
   */
  async search(query = {}) {
    const results = [];

    for (const [, metadata] of this.metadata) {
      if (metadata.matches(query)) {
        results.push(metadata);
      }
    }

    // Also check database if connected
    if (this.db && query.author) {
      const [rows] = await this.db.query(
        'SELECT * FROM simulation_metadata WHERE author = ? LIMIT 100',
        [query.author]
      );

      for (const row of rows) {
        if (this.metadata.has(row.metadataId)) continue;

        const metadata = new SimulationMetadata({
          metadataId: row.metadataId,
          sessionId: row.sessionId,
          milestoneId: row.milestoneId,
          tags: typeof row.tags === 'string' ? JSON.parse(row.tags) : row.tags,
          description: row.description,
          hypothesis: row.hypothesis,
          author: row.author
        });

        if (metadata.matches(query)) {
          results.push(metadata);
          this.metadata.set(row.metadataId, metadata);
        }
      }
    }

    return results;
  }

  /**
   * Get all metadata for session
   */
  async getMetadataForSession(sessionId) {
    const sessionMetadata = this.sessionIndex.get(sessionId) || new Set();
    return Array.from(sessionMetadata).map(id => this.metadata.get(id));
  }

  /**
   * Get metadata with tag
   */
  async getMetadataWithTag(tag) {
    const tagMetadata = this.tagIndex.get(tag) || new Set();
    return Array.from(tagMetadata).map(id => this.metadata.get(id));
  }

  /**
   * Update metadata
   */
  async updateMetadata(metadataId, updates) {
    const metadata = await this.getMetadata(metadataId);
    if (!metadata) throw new Error(`Metadata not found: ${metadataId}`);

    // Remove old indices
    for (const tag of metadata.tags) {
      const set = this.tagIndex.get(tag);
      if (set) set.delete(metadataId);
    }

    // Apply updates
    Object.assign(metadata, updates);
    metadata.updatedAt = new Date();

    // Re-index
    this._updateIndices(metadata);

    if (this.db) {
      await this.db.query(
        `UPDATE simulation_metadata 
        SET tags = ?, description = ?, hypothesis = ?, author = ?, updated_at = NOW()
        WHERE metadataId = ?`,
        [
          JSON.stringify(metadata.tags),
          metadata.description,
          metadata.hypothesis,
          metadata.author,
          metadataId
        ]
      );
    }

    return metadata;
  }

  /**
   * Delete metadata
   */
  async deleteMetadata(metadataId) {
    const metadata = this.metadata.get(metadataId);
    if (metadata) {
      // Remove from indices
      for (const tag of metadata.tags) {
        const set = this.tagIndex.get(tag);
        if (set) set.delete(metadataId);
      }

      const sessionSet = this.sessionIndex.get(metadata.sessionId);
      if (sessionSet) sessionSet.delete(metadataId);
    }

    this.metadata.delete(metadataId);

    if (this.db) {
      await this.db.query('DELETE FROM simulation_metadata WHERE metadataId = ?', [metadataId]);
    }

    return true;
  }

  /**
   * Update indices for metadata
   * @private
   */
  _updateIndices(metadata) {
    // Tag index
    for (const tag of metadata.tags) {
      if (!this.tagIndex.has(tag)) {
        this.tagIndex.set(tag, new Set());
      }
      this.tagIndex.get(tag).add(metadata.metadataId);
    }

    // Session index
    if (!this.sessionIndex.has(metadata.sessionId)) {
      this.sessionIndex.set(metadata.sessionId, new Set());
    }
    this.sessionIndex.get(metadata.sessionId).add(metadata.metadataId);
  }

  /**
   * Get all tags in use
   */
  getAllTags() {
    return Array.from(this.tagIndex.keys());
  }

  /**
   * Get statistics
   */
  getStats() {
    const stats = {
      totalMetadata: this.metadata.size,
      totalTags: this.tagIndex.size,
      totalSessions: this.sessionIndex.size,
      avgAccuracy: 0,
      avgMemoryMb: 0,
      convergenceRate: 0
    };

    let accuracySum = 0;
    let memorySum = 0;
    let convergenceCount = 0;

    for (const metadata of this.metadata.values()) {
      if (metadata.runtimeMetrics) {
        accuracySum += metadata.runtimeMetrics.accuracyScore;
        memorySum += metadata.runtimeMetrics.avgMemoryMb;
        if (metadata.runtimeMetrics.convergenceAchieved) {
          convergenceCount++;
        }
      }
    }

    if (this.metadata.size > 0) {
      stats.avgAccuracy = (accuracySum / this.metadata.size).toFixed(4);
      stats.avgMemoryMb = (memorySum / this.metadata.size).toFixed(2);
      stats.convergenceRate = (convergenceCount / this.metadata.size * 100).toFixed(2) + '%';
    }

    return stats;
  }
}

export default {
  RuntimeMetrics,
  SimulationMetadata,
  MetadataTracker
};
