#!/usr/bin/env node
/**
 * THE GAME - EXPRESS BACKEND SERVER
 * 
 * Purpose: REST API server for game operations
 * Endpoints: Claims, verdicts, validators, audit chain, system status
 * Integration: game-mechanics.js, game-initialization.js, reputation-system.js
 * 
 * Launch: node game-server.js
 * Default Port: 3000
 * 
 * Serves:
 * - dashboard.html (player interface)
 * - validator-dashboard.html (validator interface)
 */

import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { GameMechanics } from './game-mechanics.js';
import { GameBlockchain } from './game-blockchain.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ============================================================================
// INITIALIZATION
// ============================================================================

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors({
  origin: '*',
  credentials: true,
}));
app.use(express.json());
app.use(express.static(path.join(__dirname)));

// Initialize game mechanics
const gameEngine = new GameMechanics({
  causality_threshold: 75,
  residual_tolerance: 0.02,
  min_reputation: 25,
  initial_reputation: 50,
  quorum_size: 3,
});

// Initialize 50 validators
gameEngine.initializeValidators(50);

// Initialize blockchain (difficulty=2 for fast mining during development)
const gameBlockchain = new GameBlockchain(2);

// Mining schedule: Auto-mine every 30 seconds or when 10 transactions pending
let mining_counter = 0;
const MINING_THRESHOLD = 10;
const MINING_INTERVAL = 30000; // 30 seconds

const mining_schedule = setInterval(() => {
  if (gameBlockchain.blockchain.pendingTransactions.length > 0) {
    const block_index = gameBlockchain.minePendingTransactions();
    console.log(`⛏️  Auto-mined block ${block_index} (${gameBlockchain.blockchain.pendingTransactions.length} pending)`);
  }
}, MINING_INTERVAL);

// Mining trigger: Mine when threshold reached
function checkMiningThreshold() {
  if (gameBlockchain.blockchain.pendingTransactions.length >= MINING_THRESHOLD) {
    const block_index = gameBlockchain.minePendingTransactions();
    console.log(`⛏️  Threshold-mined block ${block_index} (${gameBlockchain.blockchain.pendingTransactions.length} pending)`);
  }
}

console.log('🎮 THE GAME - Express Backend Server');
console.log(`📍 Server starting on port ${PORT}`);
console.log(`✅ GameEngine initialized with 50 validators`);
console.log(`🔗 API endpoints ready for dashboard.html and validator-dashboard.html`);

// ============================================================================
// API ENDPOINTS
// ============================================================================

/**
 * ENDPOINT 1: POST /api/claims/submit
 * Submit a new claim to the game
 * 
 * Request body:
 * {
 *   "domain": "atomic|baryon",
 *   "element_or_particle": "Carbon",
 *   "measurement_type": "Bohr Radius",
 *   "reference_value": 0.0442,
 *   "measured_value": 0.0440,
 *   "notes": "Optional notes",
 *   "player_id": "player-xxxxx"
 * }
 */
app.post('/api/claims/submit', (req, res) => {
  try {
    const {
      domain = 'atomic',
      element_or_particle,
      measurement_type,
      reference_value,
      measured_value,
      notes = '',
      player_id,
    } = req.body;

    // Validation
    if (!element_or_particle || !measurement_type || reference_value === undefined || measured_value === undefined) {
      return res.status(400).json({
        error: 'Missing required fields',
        required: ['element_or_particle', 'measurement_type', 'reference_value', 'measured_value'],
      });
    }

    // Process claim through GameMechanics
    const claim = gameEngine.submitClaim(
      element_or_particle,
      measurement_type,
      parseFloat(reference_value),
      parseFloat(measured_value),
      domain
    );

    // Record claim on blockchain
    gameBlockchain.recordClaim(claim);
    checkMiningThreshold();

    res.status(201).json({
      success: true,
      claim_id: claim.id,
      element_or_particle: claim.element_or_particle,
      measurement_type: claim.measurement_type,
      domain: claim.domain,
      causality: claim.causality,
      error_pct: claim.error_pct,
      status: claim.status,
      quorum: claim.quorum,
      validation: claim.validation,
      message: 'Claim submitted successfully, awaiting validator verdicts',
    });

    console.log(`✅ Claim submitted: ${claim.id} (${claim.element_or_particle})`);
  } catch (error) {
    console.error('❌ Error submitting claim:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * ENDPOINT 2: GET /api/claims/recent?limit=20
 * Get recent claims (for player dashboard)
 */
app.get('/api/claims/recent', (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 20, 100);
    const recent = gameEngine.claims.slice(-limit).reverse();

    res.json({
      success: true,
      claims: recent.map(c => ({
        id: c.id,
        element_or_particle: c.element_or_particle,
        measurement_type: c.measurement_type,
        domain: c.domain,
        reference_value: c.reference_value,
        measured_value: c.measured_value,
        causality: c.causality,
        error_pct: c.error_pct,
        status: c.status,
        validation: c.validation,
        submitted_at: c.submitted_at,
        verdict_summary: c.verdict_summary,
      })),
      total: gameEngine.claims.length,
      returned: recent.length,
    });
  } catch (error) {
    console.error('❌ Error fetching recent claims:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * ENDPOINT 3: GET /api/verdicts/{claimId}
 * Get verdict and quorum info for a specific claim
 */
app.get('/api/verdicts/:claimId', (req, res) => {
  try {
    const { claimId } = req.params;
    const claim = gameEngine.claims.find(c => c.id === claimId);

    if (!claim) {
      return res.status(404).json({
        error: 'Claim not found',
        claim_id: claimId,
      });
    }

    res.json({
      success: true,
      claim_id: claim.id,
      element_or_particle: claim.element_or_particle,
      measurement_type: claim.measurement_type,
      domain: claim.domain,
      causality: claim.causality,
      status: claim.status,
      quorum: claim.quorum,
      verdicts: (claim.verdicts || []).map(v => ({
        validator_id: v.validator_id,
        verdict: v.verdict,
        verdict_correct: v.verdict_correct,
        reputation_change: v.reputation_change,
        reasoning: v.reasoning,
        recorded_at: v.recorded_at,
      })),
      verdict_summary: claim.verdict_summary,
      validation: claim.validation,
    });
  } catch (error) {
    console.error('❌ Error fetching verdict:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * ENDPOINT 4: GET /api/validators/leaderboard?limit=50
 * Get validator leaderboard by reputation
 */
app.get('/api/validators/leaderboard', (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 50, 100);
    
    const validators = Array.from(gameEngine.validators.values())
      .sort((a, b) => b.reputation - a.reputation)
      .slice(0, limit);

    const avg_reputation = gameEngine.validators.size > 0
      ? Array.from(gameEngine.validators.values()).reduce((sum, v) => sum + v.reputation, 0) / gameEngine.validators.size
      : 0;

    res.json({
      success: true,
      validators: validators.map((v, idx) => ({
        rank: idx + 1,
        id: v.id,
        reputation: v.reputation,
        verdicts_issued: v.verdicts_issued,
        status: v.status,
      })),
      total_active: gameEngine.game_state.validators_active,
      avg_reputation: avg_reputation.toFixed(2),
      returned: validators.length,
    });
  } catch (error) {
    console.error('❌ Error fetching leaderboard:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * ENDPOINT 5: GET /api/audit-chain?limit=50&start_sequence=0
 * Get immutable audit chain entries
 */
app.get('/api/audit-chain', (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 50, 100);
    const start = parseInt(req.query.start_sequence) || 0;

    const entries = gameEngine.audit_chain
      .slice(start, start + limit)
      .reverse() // Newest first
      .map(e => ({
        sequence: e.sequence,
        event_type: e.event_type,
        claim_id: e.claim_id,
        hash: e.hash,
        previous_hash: e.previous_hash,
        timestamp: e.timestamp,
        data: e.data,
      }));

    res.json({
      success: true,
      entries,
      total: gameEngine.audit_chain.length,
      returned: entries.length,
      start_sequence: start,
    });
  } catch (error) {
    console.error('❌ Error fetching audit chain:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * ENDPOINT 6: POST /api/audit-chain/verify
 * Verify audit chain integrity
 */
app.post('/api/audit-chain/verify', (req, res) => {
  try {
    const verification = gameEngine.verifyAuditChain();

    res.json({
      success: verification.valid,
      valid: verification.valid,
      entries_verified: verification.entries_verified || 0,
      error: verification.error || null,
      message: verification.valid ? 'Audit chain integrity verified ✅' : 'Audit chain integrity violation detected ❌',
    });

    console.log(`🔐 Audit chain verification: ${verification.valid ? '✅ PASSED' : '❌ FAILED'}`);
  } catch (error) {
    console.error('❌ Error verifying audit chain:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * ENDPOINT 7: GET /api/system/status
 * Get real-time game system status
 */
app.get('/api/system/status', (req, res) => {
  try {
    const report = gameEngine.generateReport();

    res.json({
      success: true,
      status: 'online',
      timestamp: new Date().toISOString(),
      game_state: {
        claims_processed: gameEngine.game_state.claims_processed,
        claims_approved: gameEngine.game_state.claims_approved,
        claims_rejected: gameEngine.game_state.claims_rejected,
        claims_pending: gameEngine.claims.filter(c => c.status === 'pending' || c.status === 'assigned').length,
        verdicts_recorded: gameEngine.game_state.verdicts_recorded,
        validators_active: gameEngine.game_state.validators_active,
        validators_ejected: gameEngine.game_state.validators_ejected,
        audit_entries: gameEngine.audit_chain.length,
      },
      system: {
        uptime_ms: process.uptime() * 1000,
        memory_mb: (process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2),
        node_version: process.version,
        api_version: '1.0.0',
      },
      config: gameEngine.config,
    });
  } catch (error) {
    console.error('❌ Error fetching system status:', error);
    res.status(500).json({ error: error.message });
  }
});

// ============================================================================
// VERDICTS ENDPOINT - Not in original spec but essential for gameplay
// ============================================================================

/**
 * POST /api/verdicts/submit
 * Submit a validator's verdict on a claim
 */
app.post('/api/verdicts/submit', (req, res) => {
  try {
    const {
      claim_id,
      validator_id,
      verdict,
      reasoning = '',
    } = req.body;

    // Validation
    if (!claim_id || !validator_id || !verdict) {
      return res.status(400).json({
        error: 'Missing required fields',
        required: ['claim_id', 'validator_id', 'verdict'],
      });
    }

    if (!['approved', 'rejected'].includes(verdict)) {
      return res.status(400).json({
        error: 'Invalid verdict value',
        allowed: ['approved', 'rejected'],
      });
    }

    // Record verdict
    const verdict_record = gameEngine.recordVerdict(
      claim_id,
      validator_id,
      verdict,
      reasoning
    );

    // Record verdict on blockchain if verdict is valid
    if (!verdict_record.error) {
      const is_correct = verdict_record.verdict_correct;
      gameBlockchain.recordVerdict(claim_id, validator_id, is_correct);
      checkMiningThreshold();
    }

    if (verdict_record.error) {
      return res.status(404).json({ error: verdict_record.error });
    }

    // Get updated validator info
    const validator = gameEngine.validators.get(validator_id);

    res.status(201).json({
      success: true,
      claim_id,
      validator_id,
      verdict,
      verdict_correct: verdict_record.verdict_correct,
      reputation_before: verdict_record.reputation_before,
      reputation_after: verdict_record.reputation_after,
      reputation_change: verdict_record.reputation_change,
      validator_status: validator.status,
      message: verdict_record.verdict_correct
        ? `Verdict correct! Reputation: ${verdict_record.reputation_before} → ${verdict_record.reputation_after}`
        : `Verdict incorrect. Reputation: ${verdict_record.reputation_before} → ${verdict_record.reputation_after}`,
    });

    console.log(`⚖️ Verdict recorded: ${validator_id} on ${claim_id} (${verdict})`);
  } catch (error) {
    console.error('❌ Error recording verdict:', error);
    res.status(500).json({ error: error.message });
  }
});

// ============================================================================
// INITIALIZATION ENDPOINTS
// ============================================================================

/**
 * POST /api/player/initialize
 * Initialize new player session
 */
app.post('/api/player/initialize', (req, res) => {
  try {
    const { player_id } = req.body;

    res.json({
      success: true,
      player_id: player_id || `player-${Date.now()}-${Math.random().toString(36).substring(7)}`,
      session_started: new Date().toISOString(),
      message: 'Player session initialized',
    });
  } catch (error) {
    console.error('❌ Error initializing player:', error);
    res.status(500).json({ error: error.message });
  }
});

// ============================================================================
// BLOCKCHAIN API ENDPOINTS
// ============================================================================

/**
 * ENDPOINT: GET /api/blockchain/status
 * Get real-time blockchain metrics
 */
app.get('/api/blockchain/status', (req, res) => {
  try {
    const chain = gameBlockchain.blockchain;
    const status = {
      success: true,
      blockchain: {
        chain_length: chain.chain.length,
        total_blocks: chain.chain.length,
        genesis_hash: chain.chain[0].hash,
        latest_block: {
          index: chain.getLatestBlock().index,
          hash: chain.getLatestBlock().hash,
          timestamp: chain.getLatestBlock().timestamp,
          transactions: chain.getLatestBlock().transactions.length,
          difficulty: chain.difficulty,
        },
        pending_transactions: chain.pendingTransactions.length,
        mining_difficulty: chain.difficulty,
        is_valid: gameBlockchain.verifyIntegrity(),
      },
      game_state: {
        total_claims: gameEngine.claims.length,
        finalized_claims: gameEngine.claims.filter(c => c.status === 'finalized').length,
        pending_claims: gameEngine.claims.filter(c => c.status === 'pending').length,
        total_verdicts: gameEngine.claims.reduce((sum, c) => sum + (c.verdicts ? c.verdicts.length : 0), 0),
        total_validators: gameEngine.validators.size,
      },
    };
    res.json(status);
  } catch (error) {
    console.error('❌ Error getting blockchain status:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * ENDPOINT: POST /api/blockchain/mine
 * Manually trigger mining of pending transactions
 */
app.post('/api/blockchain/mine', (req, res) => {
  try {
    const pending = gameBlockchain.blockchain.pendingTransactions.length;
    if (pending === 0) {
      return res.status(400).json({
        error: 'No pending transactions to mine',
        pending_count: 0,
      });
    }

    const mine_result = gameBlockchain.minePendingTransactions();
    console.log(`⛏️ Manual mining triggered: Block #${mine_result.block_index}`);

    res.status(201).json({
      success: true,
      ...mine_result,
      message: `Successfully mined block #${mine_result.block_index}`,
    });
  } catch (error) {
    console.error('❌ Error mining blockchain:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * ENDPOINT: GET /api/blockchain/claim/:claimId
 * Get claim's on-chain history
 */
app.get('/api/blockchain/claim/:claimId', (req, res) => {
  try {
    const { claimId } = req.params;
    const history = gameBlockchain.getClaimHistory(claimId);

    if (!history || history.total_transactions === 0) {
      return res.status(404).json({
        error: 'Claim not found on blockchain',
        claim_id: claimId,
      });
    }

    res.json({
      success: true,
      claim_id: history.claim_id,
      total_transactions: history.total_transactions,
      transactions: history.history.map(tx => ({
        type: tx.type,
        block_index: tx.block_index,
        block_hash: tx.block_hash.substring(0, 16) + '...',
        timestamp: tx.block_timestamp,
        details: tx,
      })),
    });
  } catch (error) {
    console.error('❌ Error retrieving claim history:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * ENDPOINT: POST /api/blockchain/verify
 * Verify blockchain integrity
 */
app.post('/api/blockchain/verify', (req, res) => {
  try {
    const integrity_result = gameBlockchain.verifyIntegrity();
    const audit_result = gameEngine.verifyAuditChain();

    res.json({
      success: true,
      blockchain_integrity: {
        valid: integrity_result && integrity_result.valid !== false,
        total_blocks: gameBlockchain.blockchain.chain.length,
        total_transactions: gameBlockchain.blockchain.chain.reduce((sum, block) => sum + block.transactions.length, 0),
        check_timestamp: new Date().toISOString(),
      },
      audit_chain_integrity: {
        valid: audit_result && audit_result.valid !== false,
        total_entries: gameEngine.audit_chain.length,
      },
      overall_system_integrity: (integrity_result && integrity_result.valid !== false) && (audit_result && audit_result.valid !== false),
    });
  } catch (error) {
    console.error('❌ Error verifying blockchain:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * ENDPOINT: GET /api/blockchain/chain
 * Get full blockchain (debug endpoint)
 */
app.get('/api/blockchain/chain', (req, res) => {
  try {
    const full_chain = gameBlockchain.blockchain.chain.map((block, idx) => ({
      index: block.index,
      hash: block.hash,
      previous_hash: block.previousHash,
      timestamp: block.timestamp,
      difficulty: block.difficulty,
      nonce: block.nonce,
      transaction_count: block.transactions.length,
      transactions: block.transactions.map(tx => ({
        type: tx.type,
        claim_id: tx.claim_id || tx.claimId,
        validator_id: tx.validator_id || tx.validatorId,
        verdict: tx.verdict,
        timestamp: tx.timestamp,
      })),
    }));

    res.json({
      success: true,
      chain_length: full_chain.length,
      pending_transactions: gameBlockchain.blockchain.pendingTransactions.length,
      chain: full_chain,
    });
  } catch (error) {
    console.error('❌ Error retrieving blockchain:', error);
    res.status(500).json({ error: error.message });
  }
});

// ============================================================================
// STATIC CONTENT SERVING
// ============================================================================

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'dashboard.html'));
});

app.get('/dashboard', (req, res) => {
  res.sendFile(path.join(__dirname, 'dashboard.html'));
});

app.get('/validator', (req, res) => {
  res.sendFile(path.join(__dirname, 'validator-dashboard.html'));
});

// ============================================================================
// ERROR HANDLING
// ============================================================================

// ============================================================================
// ERROR HANDLING
// ============================================================================

// Catch uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('❌ Uncaught Exception:', err);
  process.exit(1);
});

// Catch unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

app.use((req, res) => {
  res.status(404).json({
    error: 'Endpoint not found',
    path: req.path,
    method: req.method,
    available_endpoints: [
      'POST /api/claims/submit',
      'GET /api/claims/recent',
      'GET /api/verdicts/{claimId}',
      'GET /api/validators/leaderboard',
      'GET /api/audit-chain',
      'POST /api/audit-chain/verify',
      'GET /api/system/status',
      'POST /api/verdicts/submit',
      'POST /api/player/initialize',
    ],
  });
});

// ============================================================================
// START SERVER
// ============================================================================

const server = app.listen(PORT, () => {
  console.log(`\n🚀 THE GAME Backend Server is running!`);
  console.log(`📊 Player Dashboard:    http://localhost:${PORT}/dashboard`);
  console.log(`👥 Validator Console:   http://localhost:${PORT}/validator`);
  console.log(`📡 API Base URL:        http://localhost:${PORT}/api`);
  console.log(`\n✅ Ready to accept claims and verdicts`);
  console.log(`✅ Audit chain operational`);
  console.log(`✅ 50 validators standing by\n`);
});

// Handle server errors
server.on('error', (err) => {
  console.error('❌ Server Error:', err);
  process.exit(1);
});

export { app, gameEngine };
