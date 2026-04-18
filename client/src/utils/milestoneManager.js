/**
 * Client-side Milestone Manager
 * Phase 16: Milestone & Simulation Versioning System
 * 
 * Handles milestone CRUD on client with localStorage + server sync
 */

import { v4 as uuidv4 } from 'uuid';

export const MILESTONE_TYPES = {
  DATA_COLLECTED: 'data-collected',
  PROXY_GENERATED: 'proxy-generated',
  VALIDATION_PASSED: 'validation-passed',
  SIM_EVOLVED: 'sim-evolved'
};

/**
 * Client-side Milestone class
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

  addProxyVersion(proxyRef) {
    this.proxyVersionsAtMilestone.push({
      proxyId: proxyRef.proxyId,
      version: proxyRef.version,
      accuracy: proxyRef.accuracy || 0.0,
      addedAt: new Date()
    });
  }

  captureStatsSnapshot(stats) {
    this.statsSnapshot = { ...stats, capturedAt: new Date() };
  }

  addMetadata(meta) {
    this.metadata = { ...this.metadata, ...meta };
  }

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
 * Client-side Milestone Manager with localStorage
 */
export class ClientMilestoneManager {
  constructor(sessionId) {
    this.sessionId = sessionId;
    this.storageKey = `misttracker_milestones_${sessionId}`;
  }

  /**
   * Create new milestone
   */
  async createMilestone(type, options = {}) {
    const milestone = new Milestone({
      sessionId: this.sessionId,
      type,
      description: options.description || '',
      statsSnapshot: options.stats || {},
      metadata: options.metadata || {}
    });

    // Save to localStorage
    await this._saveMilestone(milestone);

    console.log(`✓ Milestone created (client): ${milestone.milestoneId}`);
    return milestone;
  }

  /**
   * Save milestone to localStorage
   */
  async _saveMilestone(milestone) {
    const milestones = this._loadAll();
    milestones[milestone.milestoneId] = milestone.toJSON();
    localStorage.setItem(this.storageKey, JSON.stringify(milestones));
  }

  /**
   * Load all milestones for this session
   */
  async loadMilestones() {
    const milestonesData = this._loadAll();
    return Object.values(milestonesData)
      .map(json => Milestone.fromJSON(json))
      .sort((a, b) => a.timestamp - b.timestamp);
  }

  /**
   * Load single milestone
   */
  async getMilestone(milestoneId) {
    const milestonesData = this._loadAll();
    if (milestonesData[milestoneId]) {
      return Milestone.fromJSON(milestonesData[milestoneId]);
    }
    return null;
  }

  /**
   * Update milestone
   */
  async updateMilestone(milestoneId, updates) {
    const milestone = await this.getMilestone(milestoneId);
    if (!milestone) throw new Error(`Milestone not found: ${milestoneId}`);

    Object.assign(milestone, updates);
    await this._saveMilestone(milestone);
    return milestone;
  }

  /**
   * Delete milestone
   */
  async deleteMilestone(milestoneId) {
    const milestones = this._loadAll();
    delete milestones[milestoneId];
    localStorage.setItem(this.storageKey, JSON.stringify(milestones));
  }

  /**
   * Get milestones by type
   */
  async getMilestonesByType(type) {
    const milestones = await this.loadMilestones();
    return milestones.filter(m => m.type === type);
  }

  /**
   * Internal: load all from localStorage
   */
  _loadAll() {
    const stored = localStorage.getItem(this.storageKey);
    return stored ? JSON.parse(stored) : {};
  }

  /**
   * Export as JSON array
   */
  async export() {
    const milestones = await this.loadMilestones();
    return milestones.map(m => m.toJSON());
  }

  /**
   * Clear all milestones for this session
   */
  async clear() {
    localStorage.removeItem(this.storageKey);
  }
}

export default {
  Milestone,
  ClientMilestoneManager,
  MILESTONE_TYPES
};
