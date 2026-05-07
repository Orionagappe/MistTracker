/**
 * Hyperbolic Cube Key - Secure Exchange API Routes
 * 
 * RESTful API endpoints for accessing the hyperbolic key interface.
 * Available only to users who have accepted platform terms.
 * Used for high-frequency secure exchange operations.
 */

const express = require('express');
const { SecureExchangeSessionManager } = require('./hyperbolic-cube-integration.js');

const router = express.Router();
const sessionManager = new SecureExchangeSessionManager();

/**
 * POST /api/secure-exchange/key/start
 * Initialize a secure exchange session
 * 
 * Requires:
 * - userId: Unique user identifier
 * - termsAccepted: Boolean confirming terms acceptance
 */
router.post('/key/start', (req, res) => {
  try {
    const { userId, termsAccepted = false } = req.body;
    
    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }
    
    if (!termsAccepted) {
      return res.status(403).json({
        error: 'Must accept platform terms to access secure exchange interface'
      });
    }
    
    const result = sessionManager.createSession(userId, termsAccepted);
    
    if (result.error) {
      return res.status(403).json({ error: result.error });
    }
    
    res.json({
      sessionId: result.sessionId,
      userId: result.userId,
      keyFingerprint: result.getKeyFingerprint(),
      message: 'Secure exchange session initialized'
    });
  } catch (error) {
    console.error('Error starting secure exchange session:', error);
    res.status(500).json({ error: 'Failed to initialize session' });
  }
});

/**
 * POST /api/secure-exchange/key/transform
 * Perform a cryptographic transformation on the key
 * 
 * Used before high-frequency exchange operations to derive new key state
 */
router.post('/key/transform', (req, res) => {
  try {
    const { sessionId, axis, layer, direction = true } = req.body;
    
    if (!sessionId || !axis || layer === undefined) {
      return res.status(400).json({
        error: 'Missing required fields: sessionId, axis, layer'
      });
    }
    
    const validAxes = ['x', 'y', 'z'];
    if (!validAxes.includes(axis.toLowerCase())) {
      return res.status(400).json({ error: 'Invalid axis. Must be x, y, or z.' });
    }
    
    if (layer < 0 || layer > 2) {
      return res.status(400).json({ error: 'Invalid layer. Must be 0, 1, or 2.' });
    }
    
    const result = sessionManager.performTransform(sessionId, axis.toLowerCase(), layer, direction);
    
    if (result.error) {
      return res.status(404).json({ error: result.error });
    }
    
    res.json({
      sessionId,
      transform: { axis, layer, direction },
      newHash: result.newHash,
      entropy: result.entropy,
      transformationCount: result.transformationCount
    });
  } catch (error) {
    console.error('Error performing transformation:', error);
    res.status(500).json({ error: 'Transformation failed' });
  }
});

/**
 * POST /api/secure-exchange/key/fingerprint
 * Get current key fingerprint for verification
 */
router.post('/key/fingerprint', (req, res) => {
  try {
    const { sessionId } = req.body;
    
    if (!sessionId) {
      return res.status(400).json({ error: 'sessionId is required' });
    }
    
    const fingerprint = sessionManager.getFingerprint(sessionId);
    
    if (fingerprint.error) {
      return res.status(404).json({ error: fingerprint.error });
    }
    
    res.json(fingerprint);
  } catch (error) {
    console.error('Error fetching fingerprint:', error);
    res.status(500).json({ error: 'Failed to fetch fingerprint' });
  }
});

/**
 * POST /api/secure-exchange/record
 * Record a secure exchange operation
 * 
 * Parameters:
 * - sessionId: Active session ID
 * - operationType: Type of operation (transfer, swap, etc.)
 * - amount: Transaction amount
 * - counterparty: Other party in exchange
 * - metadata: Additional operation data
 */
router.post('/record', (req, res) => {
  try {
    const { sessionId, operationType, amount, counterparty, metadata = {} } = req.body;
    
    if (!sessionId || !operationType || !amount || !counterparty) {
      return res.status(400).json({
        error: 'Missing required fields: sessionId, operationType, amount, counterparty'
      });
    }
    
    const result = sessionManager.recordExchange(
      sessionId,
      operationType,
      amount,
      counterparty,
      metadata
    );
    
    if (result.error) {
      return res.status(404).json({ error: result.error });
    }
    
    res.json({
      success: true,
      exchangeId: result.exchangeId,
      keyFingerprint: result.keyFingerprint,
      operationVerified: result.operationVerified
    });
  } catch (error) {
    console.error('Error recording exchange:', error);
    res.status(500).json({ error: 'Failed to record exchange' });
  }
});

/**
 * POST /api/secure-exchange/verify
 * Verify an exchange operation using key fingerprint
 */
router.post('/verify', (req, res) => {
  try {
    const { sessionId, exchangeId, expectedKeyHash } = req.body;
    
    if (!sessionId || !exchangeId || !expectedKeyHash) {
      return res.status(400).json({
        error: 'Missing required fields: sessionId, exchangeId, expectedKeyHash'
      });
    }
    
    const result = sessionManager.verifyExchange(sessionId, exchangeId, expectedKeyHash);
    
    if (result.error) {
      return res.status(404).json({ error: result.error });
    }
    
    res.json(result);
  } catch (error) {
    console.error('Error verifying exchange:', error);
    res.status(500).json({ error: 'Verification failed' });
  }
});

/**
 * POST /api/secure-exchange/key/end
 * Close a secure exchange session
 */
router.post('/key/end', (req, res) => {
  try {
    const { sessionId } = req.body;
    
    if (!sessionId) {
      return res.status(400).json({ error: 'sessionId is required' });
    }
    
    const result = sessionManager.closeSession(sessionId);
    
    if (result.error) {
      return res.status(404).json({ error: result.error });
    }
    
    res.json({
      success: true,
      message: 'Session closed',
      sessionData: result.sessionData
    });
  } catch (error) {
    console.error('Error closing session:', error);
    res.status(500).json({ error: 'Failed to close session' });
  }
});

module.exports = router;
