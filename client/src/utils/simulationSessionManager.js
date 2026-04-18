/**
 * Simulation Session Manager
 * Phase 14: Decouples persistence from organizational timeline context
 * 
 * SimulationSession is independent entity keyed by sessionId (UUID)
 * Separate from Timeline (organizational unit)
 * 
 * Enables:
 * - Multiple independent simulations per timeline
 * - Session branching and experimentation
 * - Clean history and versioning
 */

/**
 * Generate a unique session ID
 * @returns {string} UUID v4
 */
export function generateSessionId() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * SimulationSession Data Model
 */
export class SimulationSession {
  constructor(sessionId, timelineId) {
    this.sessionId = sessionId || generateSessionId();
    this.timelineId = timelineId; // Reference to organizational timeline (not the key!)
    this.createdAt = new Date().toISOString();
    this.config = {
      atoms: [],
      emitters: [],
      simulationParams: {}
    };
    this.milestones = [];
    this.version = 1;
    this.metadata = {
      tags: [],
      description: '',
      lastModified: this.createdAt
    };
  }

  /**
   * Serialize session to localStorage format
   */
  serialize() {
    return JSON.stringify({
      sessionId: this.sessionId,
      timelineId: this.timelineId,
      createdAt: this.createdAt,
      config: this.config,
      milestones: this.milestones,
      version: this.version,
      metadata: this.metadata
    });
  }

  /**
   * Deserialize from localStorage
   */
  static deserialize(json) {
    const data = JSON.parse(json);
    const session = new SimulationSession(data.sessionId, data.timelineId);
    session.createdAt = data.createdAt;
    session.config = data.config || { atoms: [], emitters: [], simulationParams: {} };
    session.milestones = data.milestones || [];
    session.version = data.version || 1;
    session.metadata = data.metadata || { tags: [], description: '', lastModified: data.createdAt };
    return session;
  }
}

/**
 * Session storage paths in localStorage
 */
export const SESSION_STORAGE_KEYS = {
  sessionPrefix: 'sim_session_',          // sim_session_{sessionId}
  sessionsIndexPrefix: 'sim_sessions_',   // sim_sessions_{timelineId} - list of sessionIds
  currentSessionPrefix: 'current_session_' // current_session_{timelineId} - resume support
};

/**
 * Get all sessions for a timeline
 * @param {string} timelineId - Timeline ID
 * @returns {array<string>} Array of sessionIds
 */
export function getSessionsForTimeline(timelineId) {
  const key = `${SESSION_STORAGE_KEYS.sessionsIndexPrefix}${timelineId}`;
  const data = localStorage.getItem(key);
  return data ? JSON.parse(data) : [];
}

/**
 * Save session to localStorage
 * @param {SimulationSession} session - Session to save
 */
export function saveSession(session) {
  const storageKey = `${SESSION_STORAGE_KEYS.sessionPrefix}${session.sessionId}`;
  localStorage.setItem(storageKey, session.serialize());

  // Update sessions index for this timeline
  const sessionsKey = `${SESSION_STORAGE_KEYS.sessionsIndexPrefix}${session.timelineId}`;
  const sessions = getSessionsForTimeline(session.timelineId);
  if (!sessions.includes(session.sessionId)) {
    sessions.push(session.sessionId);
    localStorage.setItem(sessionsKey, JSON.stringify(sessions));
  }

  console.log(`✓ Session saved [${session.sessionId.substring(0, 8)}...]`);
}

/**
 * Load session from localStorage
 * @param {string} sessionId - Session ID to load
 * @returns {SimulationSession|null} Session or null if not found
 */
export function loadSession(sessionId) {
  const storageKey = `${SESSION_STORAGE_KEYS.sessionPrefix}${sessionId}`;
  const data = localStorage.getItem(storageKey);
  return data ? SimulationSession.deserialize(data) : null;
}

/**
 * Get the current (last) session for a timeline
 * @param {string} timelineId - Timeline ID
 * @returns {SimulationSession|null} Last session or null
 */
export function getCurrentSession(timelineId) {
  const key = `${SESSION_STORAGE_KEYS.currentSessionPrefix}${timelineId}`;
  const sessionId = localStorage.getItem(key);
  return sessionId ? loadSession(sessionId) : null;
}

/**
 * Set current session for a timeline
 * @param {string} timelineId - Timeline ID
 * @param {string} sessionId - Session ID to set as current
 */
export function setCurrentSession(timelineId, sessionId) {
  const key = `${SESSION_STORAGE_KEYS.currentSessionPrefix}${timelineId}`;
  localStorage.setItem(key, sessionId);
}

/**
 * Delete session and remove from index
 * @param {string} sessionId - Session ID to delete
 * @param {string} timelineId - Timeline ID (to update index)
 */
export function deleteSession(sessionId, timelineId) {
  const storageKey = `${SESSION_STORAGE_KEYS.sessionPrefix}${sessionId}`;
  localStorage.removeItem(storageKey);

  // Remove from index
  const sessionsKey = `${SESSION_STORAGE_KEYS.sessionsIndexPrefix}${timelineId}`;
  const sessions = getSessionsForTimeline(timelineId);
  const filtered = sessions.filter(id => id !== sessionId);
  if (filtered.length > 0) {
    localStorage.setItem(sessionsKey, JSON.stringify(filtered));
  } else {
    localStorage.removeItem(sessionsKey);
  }

  console.log(`✓ Session deleted [${sessionId.substring(0, 8)}...]`);
}
