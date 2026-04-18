/**
 * Task B3: Checkpoint Serialization
 * Phase 16: Milestone & Simulation Versioning System
 * 
 * Saves and restores complete simulation state: geometry, physics, config, metadata.
 * Enables resuming from any milestone checkpoint.
 */

import { v4 as uuidv4 } from 'uuid';
import zlib from 'zlib';
import { promisify } from 'util';

const gzip = promisify(zlib.gzip);
const gunzip = promisify(zlib.gunzip);

/**
 * Checkpoint: complete snapshot of simulation state at a moment in time
 */
export class Checkpoint {
  constructor({
    checkpointId = uuidv4(),
    sessionId,
    milestoneId,
    timestamp = new Date(),
    simulationState = {},
    builderConfig = {},
    geometryState = {},
    physicsState = {},
    metadata = {},
    compressed = false,
    compressedSize = 0
  } = {}) {
    this.checkpointId = checkpointId;
    this.sessionId = sessionId;
    this.milestoneId = milestoneId;
    this.timestamp = timestamp;
    this.simulationState = simulationState; // atomStates, emitterStates, timeline
    this.builderConfig = builderConfig; // atoms, emitters, parameters
    this.geometryState = geometryState; // 3D geometry, meshes, transforms
    this.physicsState = physicsState; // Physics engine state, forces, velocities
    this.metadata = metadata; // User-defined metadata
    this.compressed = compressed;
    this.compressedSize = compressedSize;
    this.createdAt = new Date();
  }

  /**
   * Get total size estimate (uncompressed, in bytes)
   * @returns {Number}
   */
  getUncompressedSize() {
    const json = JSON.stringify(this.toJSON());
    return json.length;
  }

  /**
   * Serialize checkpoint to JSON
   */
  toJSON() {
    return {
      checkpointId: this.checkpointId,
      sessionId: this.sessionId,
      milestoneId: this.milestoneId,
      timestamp: this.timestamp.toISOString(),
      simulationState: this.simulationState,
      builderConfig: this.builderConfig,
      geometryState: this.geometryState,
      physicsState: this.physicsState,
      metadata: this.metadata,
      compressed: this.compressed,
      compressedSize: this.compressedSize,
      createdAt: this.createdAt.toISOString()
    };
  }

  static fromJSON(json) {
    const checkpoint = new Checkpoint({
      checkpointId: json.checkpointId,
      sessionId: json.sessionId,
      milestoneId: json.milestoneId,
      timestamp: new Date(json.timestamp),
      simulationState: json.simulationState,
      builderConfig: json.builderConfig,
      geometryState: json.geometryState,
      physicsState: json.physicsState,
      metadata: json.metadata,
      compressed: json.compressed,
      compressedSize: json.compressedSize
    });
    checkpoint.createdAt = new Date(json.createdAt);
    return checkpoint;
  }

  /**
   * Create a copy of this checkpoint
   * @returns {Checkpoint}
   */
  clone() {
    return new Checkpoint({
      sessionId: this.sessionId,
      milestoneId: this.milestoneId,
      timestamp: new Date(this.timestamp),
      simulationState: JSON.parse(JSON.stringify(this.simulationState)),
      builderConfig: JSON.parse(JSON.stringify(this.builderConfig)),
      geometryState: JSON.parse(JSON.stringify(this.geometryState)),
      physicsState: JSON.parse(JSON.stringify(this.physicsState)),
      metadata: JSON.parse(JSON.stringify(this.metadata))
    });
  }
}

/**
 * CheckpointManager: handles checkpoint CRUD and compression
 */
export class CheckpointManager {
  constructor(dbConnection = null) {
    this.db = dbConnection;
    this.localCheckpoints = new Map(); // checkpointId -> Checkpoint
  }

  /**
   * Create new checkpoint from simulation state
   * @param {String} sessionId - Session ID
   * @param {String} milestoneId - Associated milestone ID
   * @param {Object} simulationState - Complete sim state
   * @param {Object} builderConfig - Builder configuration
   * @param {Object} geometryState - 3D geometry state
   * @param {Object} physicsState - Physics state
   * @param {Object} metadata - Optional metadata
   * @returns {Promise<Checkpoint>}
   */
  async createCheckpoint(
    sessionId,
    milestoneId,
    simulationState,
    builderConfig,
    geometryState,
    physicsState,
    metadata = {}
  ) {
    const checkpoint = new Checkpoint({
      sessionId,
      milestoneId,
      simulationState,
      builderConfig,
      geometryState,
      physicsState,
      metadata
    });

    // Store locally
    this.localCheckpoints.set(checkpoint.checkpointId, checkpoint);

    // Store in database
    if (this.db) {
      await this._saveToDatabase(checkpoint);
    }

    console.log(`✓ Checkpoint created: ${checkpoint.checkpointId}`);
    return checkpoint;
  }

  /**
   * Save checkpoint to database with compression
   * @private
   */
  async _saveToDatabase(checkpoint) {
    try {
      // Serialize checkpoint
      const json = JSON.stringify(checkpoint.toJSON());
      const buffer = Buffer.from(json, 'utf-8');

      // Compress if beneficial (> 1KB)
      let dataToStore = buffer;
      let compressed = false;

      if (buffer.length > 1024) {
        const compressed_buffer = await gzip(buffer);
        if (compressed_buffer.length < buffer.length) {
          dataToStore = compressed_buffer;
          compressed = true;
          checkpoint.compressed = true;
          checkpoint.compressedSize = compressed_buffer.length;
        }
      }

      // Store in database
      await this.db.query(
        `INSERT INTO simulation_checkpoints 
        (checkpointId, sessionId, milestoneId, checkpoint_data, compressed, size_bytes)
        VALUES (?, ?, ?, ?, ?, ?)`,
        [
          checkpoint.checkpointId,
          checkpoint.sessionId,
          checkpoint.milestoneId,
          dataToStore,
          compressed ? 1 : 0,
          checkpoint.getUncompressedSize()
        ]
      );
    } catch (err) {
      console.error('Error saving checkpoint to database:', err);
      throw err;
    }
  }

  /**
   * Retrieve checkpoint by ID
   * @param {String} checkpointId - Checkpoint ID
   * @returns {Promise<Checkpoint|null>}
   */
  async getCheckpoint(checkpointId) {
    // Try local storage first
    if (this.localCheckpoints.has(checkpointId)) {
      return this.localCheckpoints.get(checkpointId);
    }

    // Try database
    if (this.db) {
      try {
        const [rows] = await this.db.query(
          'SELECT * FROM simulation_checkpoints WHERE checkpointId = ?',
          [checkpointId]
        );

        if (rows.length > 0) {
          const row = rows[0];
          let data = row.checkpoint_data;

          // Decompress if needed
          if (row.compressed === 1) {
            data = await gunzip(data);
          }

          const json = JSON.parse(data.toString('utf-8'));
          const checkpoint = Checkpoint.fromJSON(json);
          this.localCheckpoints.set(checkpointId, checkpoint);
          return checkpoint;
        }
      } catch (err) {
        console.error('Error retrieving checkpoint from database:', err);
      }
    }

    return null;
  }

  /**
   * Get all checkpoints for a session
   * @param {String} sessionId - Session ID
   * @returns {Promise<Array<Checkpoint>>}
   */
  async getCheckpointsForSession(sessionId) {
    const checkpoints = [];

    // From local storage
    for (const [, checkpoint] of this.localCheckpoints) {
      if (checkpoint.sessionId === sessionId) {
        checkpoints.push(checkpoint);
      }
    }

    // From database
    if (this.db) {
      try {
        const [rows] = await this.db.query(
          'SELECT * FROM simulation_checkpoints WHERE sessionId = ? ORDER BY created_at DESC',
          [sessionId]
        );

        for (const row of rows) {
          // Skip if already in local storage
          if (this.localCheckpoints.has(row.checkpointId)) continue;

          let data = row.checkpoint_data;
          if (row.compressed === 1) {
            data = await gunzip(data);
          }

          const json = JSON.parse(data.toString('utf-8'));
          const checkpoint = Checkpoint.fromJSON(json);
          checkpoints.push(checkpoint);
          this.localCheckpoints.set(row.checkpointId, checkpoint);
        }
      } catch (err) {
        console.error('Error retrieving checkpoints from database:', err);
      }
    }

    return checkpoints.sort((a, b) => b.timestamp - a.timestamp);
  }

  /**
   * Get checkpoint for a specific milestone
   * @param {String} milestoneId - Milestone ID
   * @returns {Promise<Checkpoint|null>}
   */
  async getCheckpointForMilestone(milestoneId) {
    // Check local storage
    for (const [, checkpoint] of this.localCheckpoints) {
      if (checkpoint.milestoneId === milestoneId) {
        return checkpoint;
      }
    }

    // Check database
    if (this.db) {
      try {
        const [rows] = await this.db.query(
          'SELECT * FROM simulation_checkpoints WHERE milestoneId = ?',
          [milestoneId]
        );

        if (rows.length > 0) {
          const row = rows[0];
          let data = row.checkpoint_data;

          if (row.compressed === 1) {
            data = await gunzip(data);
          }

          const json = JSON.parse(data.toString('utf-8'));
          const checkpoint = Checkpoint.fromJSON(json);
          this.localCheckpoints.set(checkpoint.checkpointId, checkpoint);
          return checkpoint;
        }
      } catch (err) {
        console.error('Error retrieving checkpoint by milestone:', err);
      }
    }

    return null;
  }

  /**
   * Delete checkpoint
   * @param {String} checkpointId - Checkpoint ID
   * @returns {Promise<Boolean>}
   */
  async deleteCheckpoint(checkpointId) {
    this.localCheckpoints.delete(checkpointId);

    if (this.db) {
      try {
        const [result] = await this.db.query(
          'DELETE FROM simulation_checkpoints WHERE checkpointId = ?',
          [checkpointId]
        );
        return result.affectedRows > 0;
      } catch (err) {
        console.error('Error deleting checkpoint from database:', err);
        return false;
      }
    }

    return true;
  }

  /**
   * Clone checkpoint to new milestone
   * @param {String} checkpointId - Source checkpoint ID
   * @param {String} newMilestoneId - Target milestone ID
   * @returns {Promise<Checkpoint>}
   */
  async cloneCheckpoint(checkpointId, newMilestoneId) {
    const source = await this.getCheckpoint(checkpointId);
    if (!source) throw new Error(`Checkpoint not found: ${checkpointId}`);

    const clone = source.clone();
    clone.milestoneId = newMilestoneId;

    // Save clone
    if (this.db) {
      await this._saveToDatabase(clone);
    }

    this.localCheckpoints.set(clone.checkpointId, clone);
    return clone;
  }

  /**
   * Get storage stats
   * @returns {Promise<Object>}
   */
  async getStorageStats() {
    let totalCheckpoints = this.localCheckpoints.size;
    let totalUncompressedSize = 0;
    let totalCompressedSize = 0;

    for (const [, checkpoint] of this.localCheckpoints) {
      totalUncompressedSize += checkpoint.getUncompressedSize();
      if (checkpoint.compressed) {
        totalCompressedSize += checkpoint.compressedSize;
      }
    }

    // Add database stats
    if (this.db) {
      try {
        const [rows] = await this.db.query(
          'SELECT COUNT(*) as count, SUM(size_bytes) as total_size, SUM(IF(compressed=1, size_bytes, 0)) as compressed_size FROM simulation_checkpoints'
        );

        if (rows[0]) {
          totalCheckpoints = rows[0].count || 0;
          totalUncompressedSize = rows[0].total_size || 0;
          totalCompressedSize = rows[0].compressed_size || 0;
        }
      } catch (err) {
        console.warn('Error getting storage stats from database:', err);
      }
    }

    return {
      checkpointCount: totalCheckpoints,
      uncompressedSize: totalUncompressedSize,
      compressedSize: totalCompressedSize,
      compressionRatio: totalUncompressedSize > 0 
        ? ((1 - totalCompressedSize / totalUncompressedSize) * 100).toFixed(2) + '%'
        : 'N/A'
    };
  }

  /**
   * Prune old checkpoints, keeping only recent ones
   * @param {Number} keepCount - Number of checkpoints to keep per session
   * @returns {Promise<Number>} Number of deleted checkpoints
   */
  async pruneOldCheckpoints(keepCount = 10) {
    const sessionMap = new Map();

    // Group by session
    for (const [id, checkpoint] of this.localCheckpoints) {
      if (!sessionMap.has(checkpoint.sessionId)) {
        sessionMap.set(checkpoint.sessionId, []);
      }
      sessionMap.get(checkpoint.sessionId).push(id);
    }

    let deletedCount = 0;

    // Delete oldest from each session
    for (const [sessionId, checkpointIds] of sessionMap) {
      if (checkpointIds.length > keepCount) {
        const toDelete = checkpointIds.slice(keepCount);
        for (const id of toDelete) {
          await this.deleteCheckpoint(id);
          deletedCount++;
        }
      }
    }

    console.log(`✓ Pruned ${deletedCount} old checkpoints`);
    return deletedCount;
  }
}

export default {
  Checkpoint,
  CheckpointManager
};
