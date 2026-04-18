/**
 * Task B1: Milestone Model
 * Phase 16: Milestone & Simulation Versioning System
 * 
 * Defines milestone types and metadata tracking for simulation progression.
 * Tracks: data-collected, proxy-generated, validation-passed, sim-evolved
 */

import { v4 as uuidv4 } from 'uuid';

export const MILESTONE_TYPES = {
  DATA_COLLECTED: 'data-collected',
  PROXY_GENERATED: 'proxy-generated',
  VALIDATION_PASSED: 'validation-passed',
  SIM_EVOLVED: 'sim-evolved'
};

/**
 * Milestone class: represents checkpoint in simulation progression
 */
export class Milestone {
  constructor({
    milestoneId = uuidv4(),
    sessionId,
    type = MILESTONE_TYPES.DATA_COLLECTED,
    timestamp = new Date(),
    statsSnapshot = {},
    proxyVersionsAtMilestone = [],
    metadata = {},
    description = ''
  } = {}) {
    this.milestoneId = milestoneId;
    this.sessionId = sessionId;
    this.type = type;
    this.timestamp = timestamp;
    this.statsSnapshot = statsSnapshot;
    this.proxyVersionsAtMilestone = proxyVersionsAtMilestone;
    this.metadata = metadata;
    this.description = description;
    this.createdAt = new Date();
  }

  /**
   * Add a proxy version reference to this milestone
   * @param {Object} proxyRef - {proxyId, version, accuracy}
   */
  addProxyVersion(proxyRef) {
    this.proxyVersionsAtMilestone.push({
      proxyId: proxyRef.proxyId,
      version: proxyRef.version,
      accuracy: proxyRef.accuracy || 0.0,
      addedAt: new Date()
    });
  }

  /**
   * Capture snapshot of simulation stats at milestone time
   * @param {Object} stats - {atomCount, emitterCount, simulationTime, energyLevel, ...}
   */
  captureStatsSnapshot(stats) {
    this.statsSnapshot = {
      ...stats,
      capturedAt: new Date()
    };
  }

  /**
   * Add metadata key-value pairs
   * @param {Object} meta - User-defined metadata
   */
  addMetadata(meta) {
    this.metadata = { ...this.metadata, ...meta };
  }

  /**
   * Serialize milestone to JSON
   * @returns {Object} JSON-safe milestone object
   */
  toJSON() {
    return {
      milestoneId: this.milestoneId,
      sessionId: this.sessionId,
      type: this.type,
      timestamp: this.timestamp.toISOString(),
      description: this.description,
      statsSnapshot: this.statsSnapshot,
      proxyVersionsAtMilestone: this.proxyVersionsAtMilestone,
      metadata: this.metadata,
      createdAt: this.createdAt.toISOString()
    };
  }

  /**
   * Deserialize milestone from JSON
   * @param {Object} json - JSON object from toJSON()
   * @returns {Milestone} Reconstructed milestone
   */
  static fromJSON(json) {
    const milestone = new Milestone({
      milestoneId: json.milestoneId,
      sessionId: json.sessionId,
      type: json.type,
      timestamp: new Date(json.timestamp),
      statsSnapshot: json.statsSnapshot,
      proxyVersionsAtMilestone: json.proxyVersionsAtMilestone,
      metadata: json.metadata,
      description: json.description
    });
    return milestone;
  }
}

/**
 * MilestoneManager: handles milestone CRUD operations
 */
export class MilestoneManager {
  constructor(dbConnection = null) {
    this.db = dbConnection;
    this.localMilestones = new Map(); // For client-side storage
  }

  /**
   * Create and store a new milestone
   * @param {String} sessionId - Session ID
   * @param {String} type - Milestone type (MILESTONE_TYPES enum)
   * @param {Object} options - Additional options {description, stats, metadata}
   * @returns {Promise<Milestone>}
   */
  async createMilestone(sessionId, type, options = {}) {
    const milestone = new Milestone({
      sessionId,
      type,
      description: options.description || '',
      statsSnapshot: options.stats || {},
      metadata: options.metadata || {}
    });

    // Store locally
    this.localMilestones.set(milestone.milestoneId, milestone);

    // Store in database if connected
    if (this.db) {
      await this.db.query(
        `INSERT INTO simulation_milestones 
        (milestoneId, sessionId, type, timestamp, stats_snapshot, metadata, description)
        VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          milestone.milestoneId,
          sessionId,
          type,
          milestone.timestamp,
          JSON.stringify(milestone.statsSnapshot),
          JSON.stringify(milestone.metadata),
          milestone.description
        ]
      );
    }

    console.log(`✓ Milestone created: ${milestone.milestoneId} (${type})`);
    return milestone;
  }

  /**
   * Retrieve milestone by ID
   * @param {String} milestoneId - Milestone ID
   * @returns {Promise<Milestone|null>}
   */
  async getMilestone(milestoneId) {
    // Try local storage first
    if (this.localMilestones.has(milestoneId)) {
      return this.localMilestones.get(milestoneId);
    }

    // Try database
    if (this.db) {
      const [rows] = await this.db.query(
        'SELECT * FROM simulation_milestones WHERE milestoneId = ?',
        [milestoneId]
      );

      if (rows.length > 0) {
        const row = rows[0];
        const milestone = new Milestone({
          milestoneId: row.milestoneId,
          sessionId: row.sessionId,
          type: row.type,
          timestamp: new Date(row.timestamp),
          statsSnapshot: row.stats_snapshot || {},
          proxyVersionsAtMilestone: row.proxyVersionsAtMilestone || [],
          metadata: row.metadata || {},
          description: row.description || ''
        });

        this.localMilestones.set(milestoneId, milestone);
        return milestone;
      }
    }

    return null;
  }

  /**
   * Get all milestones for a session
   * @param {String} sessionId - Session ID
   * @returns {Promise<Array<Milestone>>}
   */
  async getMilestonesForSession(sessionId) {
    const milestones = [];

    // From local storage
    for (const [, milestone] of this.localMilestones) {
      if (milestone.sessionId === sessionId) {
        milestones.push(milestone);
      }
    }

    // From database
    if (this.db) {
      const [rows] = await this.db.query(
        'SELECT * FROM simulation_milestones WHERE sessionId = ? ORDER BY timestamp ASC',
        [sessionId]
      );

      for (const row of rows) {
        // Skip if already in local storage
        if (this.localMilestones.has(row.milestoneId)) continue;

        const milestone = new Milestone({
          milestoneId: row.milestoneId,
          sessionId: row.sessionId,
          type: row.type,
          timestamp: new Date(row.timestamp),
          statsSnapshot: row.stats_snapshot || {},
          proxyVersionsAtMilestone: row.proxyVersionsAtMilestone || [],
          metadata: row.metadata || {},
          description: row.description || ''
        });

        milestones.push(milestone);
        this.localMilestones.set(row.milestoneId, milestone);
      }
    }

    return milestones.sort((a, b) => a.timestamp - b.timestamp);
  }

  /**
   * Update milestone with proxy version reference
   * @param {String} milestoneId - Milestone ID
   * @param {Object} proxyRef - {proxyId, version, accuracy}
   * @returns {Promise<Milestone>}
   */
  async addProxyToMilestone(milestoneId, proxyRef) {
    const milestone = await this.getMilestone(milestoneId);
    if (!milestone) throw new Error(`Milestone not found: ${milestoneId}`);

    milestone.addProxyVersion(proxyRef);

    // Update database
    if (this.db) {
      await this.db.query(
        `UPDATE simulation_milestones 
        SET proxyVersionsAtMilestone = ? 
        WHERE milestoneId = ?`,
        [JSON.stringify(milestone.proxyVersionsAtMilestone), milestoneId]
      );
    }

    return milestone;
  }

  /**
   * Delete milestone
   * @param {String} milestoneId - Milestone ID
   * @returns {Promise<Boolean>}
   */
  async deleteMilestone(milestoneId) {
    this.localMilestones.delete(milestoneId);

    if (this.db) {
      const [result] = await this.db.query(
        'DELETE FROM simulation_milestones WHERE milestoneId = ?',
        [milestoneId]
      );
      return result.affectedRows > 0;
    }

    return true;
  }

  /**
   * Get milestones of a specific type
   * @param {String} sessionId - Session ID
   * @param {String} type - Milestone type
   * @returns {Promise<Array<Milestone>>}
   */
  async getMilestonesByType(sessionId, type) {
    const allMilestones = await this.getMilestonesForSession(sessionId);
    return allMilestones.filter(m => m.type === type);
  }

  /**
   * Export milestones for a session as JSON
   * @param {String} sessionId - Session ID
   * @returns {Promise<Array>}
   */
  async exportMilestones(sessionId) {
    const milestones = await this.getMilestonesForSession(sessionId);
    return milestones.map(m => m.toJSON());
  }
}

export default {
  Milestone,
  MilestoneManager,
  MILESTONE_TYPES
};
