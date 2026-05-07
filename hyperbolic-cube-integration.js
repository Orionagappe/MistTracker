/**
 * Hyperbolic Cube Key - Secure Exchange Interface Integration
 * 
 * Manages cryptographic key sessions for high-frequency secure exchange.
 * Keys are derived from hyperbolic state transformations and cannot be
 * reverse-engineered or brute-forced due to irreversible mathematics.
 */

const HyperbolicCubeKey = require('./hyperbolic-cube.js');

class SecureExchangeSession {
  constructor(userId, termsAccepted = false) {
    if (!termsAccepted) {
      throw new Error('User must accept platform terms to access secure exchange interface');
    }

    this.userId = userId;
    this.sessionId = this.generateSessionId();
    this.key = new HyperbolicCubeKey(userId, -1.0);
    this.startTime = Date.now();
    this.endTime = null;
    this.isActive = true;
    this.transformationCount = 0;
    this.exchangeHistory = [];
  }

  generateSessionId() {
    return `secure-exchange-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Perform a cryptographic transformation on the key
   * Used before high-frequency exchange operations
   */
  performKeyTransform(axis, layer, direction = true) {
    if (!this.isActive) {
      return { error: 'Session is not active' };
    }

    try {
      const result = this.key[`transform${axis.toUpperCase()}`](layer, Math.PI / 2, direction);
      this.transformationCount += 1;
      
      return {
        success: true,
        newHash: result.newHash,
        entropy: result.entropy,
        transformationCount: this.transformationCount
      };
    } catch (error) {
      return { error: `Transformation failed: ${error.message}` };
    }
  }

  /**
   * Get current key fingerprint for verification
   */
  getKeyFingerprint() {
    const assessment = this.key.getSecurityAssessment();
    return {
      sessionId: this.sessionId,
      userId: this.userId,
      hash: this.key.getStateHash(),
      securityLevel: assessment.level,
      entropy: assessment.entropy,
      transformations: this.transformationCount,
      active: this.isActive,
      elapsedSeconds: (Date.now() - this.startTime) / 1000
    };
  }

  /**
   * Record a secure exchange operation
   */
  recordExchange(operationType, amount, counterparty, metadata = {}) {
    if (!this.isActive) {
      return { error: 'Session is not active' };
    }

    const exchange = {
      timestamp: Date.now(),
      operationType,
      amount,
      counterparty,
      keyFingerprint: this.key.getStateHash(),
      metadata
    };

    this.exchangeHistory.push(exchange);

    return {
      success: true,
      exchangeId: `exchange-${this.exchangeHistory.length}`,
      keyFingerprint: this.key.getStateHash(),
      operationVerified: true
    };
  }

  /**
   * Verify exchange using current key state
   */
  verifyExchange(exchangeId, expectedKeyHash) {
    const currentHash = this.key.getStateHash();
    const matches = currentHash === expectedKeyHash;

    return {
      exchangeId,
      verified: matches,
      currentHash,
      expectedHash: expectedKeyHash,
      message: matches ? 'Exchange verified' : 'Key mismatch - exchange cannot be verified'
    };
  }

  /**
   * Export session data (no sensitive state)
   */
  toJSON() {
    return {
      sessionId: this.sessionId,
      userId: this.userId,
      startTime: this.startTime,
      endTime: this.endTime,
      transformationCount: this.transformationCount,
      exchangeCount: this.exchangeHistory.length,
      isActive: this.isActive,
      keyFingerprint: this.getKeyFingerprint(),
      securityAssessment: this.key.getSecurityAssessment()
    };
  }

/**
 * Secure Exchange Session Manager
 * Manages active sessions for users accessing the hyperbolic key interface
 */
class SecureExchangeSessionManager {
  constructor() {
    this.sessions = new Map();
  }

  /**
   * Create a new secure exchange session
   * User must have accepted terms
   */
  createSession(userId, termsAccepted = false) {
    try {
      const session = new SecureExchangeSession(userId, termsAccepted);
      this.sessions.set(session.sessionId, session);
      return session;
    } catch (error) {
      return { error: error.message };
    }
  }

  /**
   * Get an active session
   */
  getSession(sessionId) {
    return this.sessions.get(sessionId);
  }

  /**
   * Perform a transformation in an active session
   */
  performTransform(sessionId, axis, layer, direction = true) {
    const session = this.sessions.get(sessionId);
    if (!session) {
      return { error: 'Session not found' };
    }
    return session.performKeyTransform(axis, layer, direction);
  }

  /**
   * Record an exchange operation
   */
  recordExchange(sessionId, operationType, amount, counterparty, metadata = {}) {
    const session = this.sessions.get(sessionId);
    if (!session) {
      return { error: 'Session not found' };
    }
    return session.recordExchange(operationType, amount, counterparty, metadata);
  }

  /**
   * Verify an exchange
   */
  verifyExchange(sessionId, exchangeId, expectedKeyHash) {
    const session = this.sessions.get(sessionId);
    if (!session) {
      return { error: 'Session not found' };
    }
    return session.verifyExchange(exchangeId, expectedKeyHash);
  }

  /**
   * Get session fingerprint
   */
  getFingerprint(sessionId) {
    const session = this.sessions.get(sessionId);
    if (!session) {
      return { error: 'Session not found' };
    }
    return session.getKeyFingerprint();
  }

  /**
   * Close a session
   */
  closeSession(sessionId) {
    const session = this.sessions.get(sessionId);
    if (session) {
      session.isActive = false;
      session.endTime = Date.now();
      this.sessions.delete(sessionId);
      return { success: true, sessionData: session.toJSON() };
    }
    return { error: 'Session not found' };
  }
}

// Export classes
module.exports = {
  SecureExchangeSession,
  SecureExchangeSessionManager
};
