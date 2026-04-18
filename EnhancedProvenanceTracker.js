/**
 * Enhanced Provenance Tracker with Sequencing
 * Tracks action history with guaranteed ordering and builder config versioning
 */

import { hostname } from 'os';

export class EnhancedProvenanceTracker {
  constructor(db = null) {
    this.db = db;
    this.localLog = [];
    this.maxLocalEntries = 10000;
    this.sequenceNumber = 0; // Monotonically increasing counter for ordering
    this.configVersions = new Map(); // Map<timelineId, Array<version>>
  }

  /**
   * Record an action with guaranteed sequence ordering
   * Should be called BEFORE mutation processing to capture accurate timestamp
   */
  async recordAction(actionType, userId, sessionToken, context = {}, messageTimestamp = null) {
    this.sequenceNumber++;
    
    const provenance = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      actionType,
      userId,
      sessionToken,
      serverTimestamp: new Date().toISOString(),
      messageTimestamp: messageTimestamp || new Date().toISOString(),
      sequenceNumber: this.sequenceNumber,
      context,
      metadata: {
        userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'Node.js',
        hostname: hostname()
      }
    };

    // Store in local log (ordered by sequence number)
    this.localLog.push(provenance);
    if (this.localLog.length > this.maxLocalEntries) {
      this.localLog = this.localLog.slice(-this.maxLocalEntries);
    }

    // Store in database if available
    if (this.db) {
      try {
        await this.db.query(
          `INSERT INTO ProvenanceLog 
           (actionType, userId, sessionToken, serverTimestamp, messageTimestamp, sequenceNumber, context, metadata) 
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            provenance.actionType,
            provenance.userId,
            provenance.sessionToken,
            provenance.serverTimestamp,
            provenance.messageTimestamp,
            provenance.sequenceNumber,
            JSON.stringify(provenance.context),
            JSON.stringify(provenance.metadata)
          ]
        );
      } catch (err) {
        console.error('Database provenance recording failed:', err);
      }
    }

    return provenance;
  }

  /**
   * Record a builder config change with version history
   */
  async recordConfigChange(timelineId, userId, oldConfig, newConfig, changeReason = 'manual') {
    const version = {
      versionId: `v${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timelineId,
      userId,
      timestamp: new Date().toISOString(),
      sequenceNumber: ++this.sequenceNumber,
      oldConfig: JSON.parse(JSON.stringify(oldConfig || {})), // Deep copy
      newConfig: JSON.parse(JSON.stringify(newConfig)),
      changeReason,
      diff: this._computeConfigDiff(oldConfig, newConfig)
    };

    // Store in memory
    if (!this.configVersions.has(timelineId)) {
      this.configVersions.set(timelineId, []);
    }
    this.configVersions.get(timelineId).push(version);

    // Also record as provenance action
    await this.recordAction('CONFIG_CHANGE', userId, null, {
      timelineId,
      versionId: version.versionId,
      changeReason,
      changesSummary: Object.keys(version.diff).join(', ')
    }, version.timestamp);

    // Store in database if available
    if (this.db) {
      try {
        await this.db.query(
          `INSERT INTO ConfigVersions 
           (timelineId, userId, versionId, oldConfig, newConfig, changeReason, diff, timestamp, sequenceNumber) 
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            timelineId,
            userId,
            version.versionId,
            JSON.stringify(version.oldConfig),
            JSON.stringify(version.newConfig),
            changeReason,
            JSON.stringify(version.diff),
            version.timestamp,
            version.sequenceNumber
          ]
        );
      } catch (err) {
        console.error('Database config version recording failed:', err);
      }
    }

    return version;
  }

  /**
   * Compute diff between two configs
   * @private
   */
  _computeConfigDiff(oldConfig = {}, newConfig = {}) {
    const diff = {
      added: [],
      removed: [],
      modified: []
    };

    // Handle null/undefined configs
    if (!oldConfig) oldConfig = {};
    if (!newConfig) newConfig = {};

    // Find removed and modified atoms
    const oldAtomIds = new Set((oldConfig.atoms || []).map(a => a.id));
    const newAtomIds = new Set((newConfig.atoms || []).map(a => a.id));

    for (const atom of oldConfig.atoms || []) {
      if (!newAtomIds.has(atom.id)) {
        diff.removed.push({ type: 'atom', id: atom.id });
      } else {
        const newAtom = newConfig.atoms.find(a => a.id === atom.id);
        if (JSON.stringify(atom) !== JSON.stringify(newAtom)) {
          diff.modified.push({ type: 'atom', id: atom.id });
        }
      }
    }

    // Find added atoms
    for (const atom of newConfig.atoms || []) {
      if (!oldAtomIds.has(atom.id)) {
        diff.added.push({ type: 'atom', id: atom.id });
      }
    }

    // Same for emitters
    const oldEmitterIds = new Set((oldConfig.emitters || []).map(e => e.id));
    const newEmitterIds = new Set((newConfig.emitters || []).map(e => e.id));

    for (const emitter of oldConfig.emitters || []) {
      if (!newEmitterIds.has(emitter.id)) {
        diff.removed.push({ type: 'emitter', id: emitter.id });
      } else {
        const newEmitter = newConfig.emitters.find(e => e.id === emitter.id);
        if (JSON.stringify(emitter) !== JSON.stringify(newEmitter)) {
          diff.modified.push({ type: 'emitter', id: emitter.id });
        }
      }
    }

    for (const emitter of newConfig.emitters || []) {
      if (!oldEmitterIds.has(emitter.id)) {
        diff.added.push({ type: 'emitter', id: emitter.id });
      }
    }

    return diff;
  }

  /**
   * Get timeline action history ordered by sequence number
   */
  async getOrderedActionHistory(timelineId, options = {}) {
    const { startSeq, endSeq, limit = 100 } = options;

    let results = this.localLog.filter(log =>
      log.context.timelineId === timelineId || log.context.itemId
    );

    if (startSeq !== undefined) {
      results = results.filter(log => log.sequenceNumber >= startSeq);
    }
    if (endSeq !== undefined) {
      results = results.filter(log => log.sequenceNumber <= endSeq);
    }

    // Sort by sequence number (guaranteed order)
    results.sort((a, b) => a.sequenceNumber - b.sequenceNumber);

    results = results.slice(0, limit);

    return results;
  }

  /**
   * Get config version history for a timeline
   */
  async getConfigVersionHistory(timelineId, limit = 50) {
    let versions = this.configVersions.get(timelineId) || [];

    if (this.db) {
      try {
        const [dbVersions] = await this.db.query(
          `SELECT * FROM ConfigVersions 
           WHERE timelineId = ? 
           ORDER BY sequenceNumber DESC 
           LIMIT ?`,
          [timelineId, limit]
        );

        if (dbVersions && dbVersions.length > 0) {
          versions = versions.concat(dbVersions.map(v => ({
            versionId: v.versionId,
            timelineId: v.timelineId,
            userId: v.userId,
            timestamp: v.timestamp,
            sequenceNumber: v.sequenceNumber,
            oldConfig: JSON.parse(v.oldConfig),
            newConfig: JSON.parse(v.newConfig),
            changeReason: v.changeReason,
            diff: JSON.parse(v.diff)
          })));

          // Sort by sequence number and deduplicate
          const seen = new Set();
          versions = versions
            .filter(v => {
              if (seen.has(v.versionId)) return false;
              seen.add(v.versionId);
              return true;
            })
            .sort((a, b) => b.sequenceNumber - a.sequenceNumber)
            .slice(0, limit);
        }
      } catch (err) {
        console.error('Database config version query failed:', err);
      }
    }

    return versions;
  }

  /**
   * Restore config to a previous version
   */
  async restoreConfigVersion(timelineId, versionId, userId) {
    const versions = await this.getConfigVersionHistory(timelineId, 1000);
    const targetVersion = versions.find(v => v.versionId === versionId);

    if (!targetVersion) {
      throw new Error(`Version ${versionId} not found`);
    }

    // Record the restoration as a config change
    await this.recordConfigChange(
      timelineId,
      userId,
      versions[0]?.newConfig,
      targetVersion.newConfig,
      `restored_from_${versionId}`
    );

    return targetVersion.newConfig;
  }

  /**
   * Get action timeline for debugging
   */
  getDebugTimeline(timelineId, windowMs = 5000) {
    const results = this.localLog
      .filter(log => log.context.timelineId === timelineId)
      .sort((a, b) => a.sequenceNumber - b.sequenceNumber)
      .map(log => ({
        seq: log.sequenceNumber,
        action: log.actionType,
        user: log.userId,
        timestamp: log.serverTimestamp,
        msgTime: log.messageTimestamp
      }));

    return {
      timeline: results,
      sequencingValid: this._validateSequencing(results),
      timingValid: this._validateTiming(results, windowMs)
    };
  }

  /**
   * Validate sequence numbers are strictly increasing
   * @private
   */
  _validateSequencing(timeline) {
    if (timeline.length < 2) return true;

    for (let i = 1; i < timeline.length; i++) {
      if (timeline[i].seq <= timeline[i - 1].seq) {
        return false;
      }
    }
    return true;
  }

  /**
   * Validate timing is reasonable (no massive out-of-order delays)
   * @private
   */
  _validateTiming(timeline, windowMs) {
    if (timeline.length < 2) return true;

    for (let i = 1; i < timeline.length; i++) {
      const timeDiff = Math.abs(
        new Date(timeline[i].timestamp) - new Date(timeline[i - 1].timestamp)
      );

      // If sequence jumped but timestamp went way back, something odd happened
      if (timeline[i].seq > timeline[i - 1].seq + 100 && timeDiff > windowMs) {
        return false;
      }
    }
    return true;
  }
}

// Keep backward compatibility with original class name
export class ProvenanceTracker extends EnhancedProvenanceTracker {}
