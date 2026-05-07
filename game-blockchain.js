#!/usr/bin/env node
/**
 * THE GAME - BLOCKCHAIN INTEGRATION LAYER
 * 
 * Purpose: Bridge between game mechanics and blockchain ledger
 * Responsibility: 
 * - Record claims on-chain
 * - Record verdicts on-chain
 * - Maintain claim lifecycle history
 * - Provide immutability guarantee
 * - Enable on-chain auditing
 */

import { Blockchain } from './blockchain.js';

class GameBlockchain {
  constructor(difficulty = 2) {
    this.blockchain = new Blockchain(difficulty, 'THEGAME');
    this.claimRegistry = new Map(); // Map claimId → on-chain block info
    this.verdictRegistry = new Map(); // Map (claimId + validatorId) → on-chain block info
  }

  /**
   * Record a submitted claim on-chain
   * Called when claim is validated and assigned to quorum
   */
  recordClaim(claim) {
    const transaction = {
      claimId: claim.id,
      type: 'claim',
      domain: claim.domain,
      element_or_particle: claim.element_or_particle,
      measurement_type: claim.measurement_type,
      reference_value: claim.reference_value,
      measured_value: claim.measured_value,
      error_pct: claim.error_pct,
      causality: claim.causality,
      validation: claim.validation,
      status: claim.status,
      quorum: claim.quorum,
      submittedBy: claim.player_id || 'ANONYMOUS',
      submittedAt: claim.submitted_at,
    };

    const result = this.blockchain.addTransaction(transaction);

    if (result.success) {
      this.claimRegistry.set(claim.id, {
        tx_hash: result.transaction_hash,
        pending: true,
        onChainAt: null,
        blockIndex: null,
      });
    }

    return result;
  }

  /**
   * Record a verdict on-chain
   * Called when validator issues a verdict
   */
  recordVerdict(claimId, validatorId, verdict) {
    const transaction = {
      claimId: claimId,
      type: 'verdict',
      validatorId: validatorId,
      verdict: verdict.verdict,
      verdict_correct: verdict.verdict_correct,
      reputation_change: verdict.reputation_change,
      reputation_before: verdict.reputation_before,
      reputation_after: verdict.reputation_after,
      reasoning: verdict.reasoning || '',
      recordedAt: verdict.recorded_at,
    };

    const result = this.blockchain.addTransaction(transaction);

    if (result.success) {
      const key = `${claimId}:${validatorId}`;
      this.verdictRegistry.set(key, {
        tx_hash: result.transaction_hash,
        pending: true,
        onChainAt: null,
        blockIndex: null,
      });
    }

    return result;
  }

  /**
   * Record claim finalization on-chain
   * Called when claim reaches consensus
   */
  recordClaimFinalization(claimId, consensus, approvedVotes, rejectedVotes) {
    const transaction = {
      claimId: claimId,
      type: 'claim-finalized',
      consensus: consensus,
      approved_votes: approvedVotes,
      rejected_votes: rejectedVotes,
      finalizedAt: new Date().toISOString(),
    };

    return this.blockchain.addTransaction(transaction);
  }

  /**
   * Mine pending transactions into a block
   * Should be called periodically (e.g., every 10 claims or 30 seconds)
   */
  minePendingTransactions(minerAddress = 'THEGAME') {
    const pending = this.blockchain.pendingTransactions.length;

    if (pending === 0) {
      return {
        success: false,
        message: 'No pending transactions to mine',
        pending_count: 0,
      };
    }

    const mineResult = this.blockchain.minePendingTransactions(minerAddress);

    // Update registries with block info
    const block = this.blockchain.getLatestBlock();
    block.transactions.forEach(tx => {
      if (tx.type === 'claim') {
        const entry = this.claimRegistry.get(tx.claimId);
        if (entry) {
          entry.pending = false;
          entry.onChainAt = new Date().toISOString();
          entry.blockIndex = block.index;
        }
      } else if (tx.type === 'verdict') {
        const key = `${tx.claimId}:${tx.validatorId}`;
        const entry = this.verdictRegistry.get(key);
        if (entry) {
          entry.pending = false;
          entry.onChainAt = new Date().toISOString();
          entry.blockIndex = block.index;
        }
      }
    });

    return {
      success: true,
      ...mineResult,
      message: `Successfully mined block ${mineResult.block_index}`,
    };
  }

  /**
   * Get claim blockchain history
   */
  getClaimHistory(claimId) {
    return this.blockchain.getClaimHistory(claimId);
  }

  /**
   * Get claim on-chain status
   */
  getClaimOnChainStatus(claimId) {
    const entry = this.claimRegistry.get(claimId);

    if (!entry) {
      return {
        found: false,
        on_chain: false,
        claim_id: claimId,
      };
    }

    const history = this.blockchain.getClaimHistory(claimId);

    return {
      found: true,
      claim_id: claimId,
      on_chain: !entry.pending,
      pending: entry.pending,
      block_index: entry.blockIndex,
      tx_hash: entry.tx_hash,
      on_chain_at: entry.onChainAt,
      transactions: history.total_transactions,
      history: history.history,
    };
  }

  /**
   * Verify blockchain integrity
   */
  verifyIntegrity() {
    return this.blockchain.isChainValid();
  }

  /**
   * Get blockchain statistics
   */
  getStats() {
    return {
      ...this.blockchain.getStats(),
      claims_recorded: this.claimRegistry.size,
      verdicts_recorded: this.verdictRegistry.size,
      claims_on_chain: Array.from(this.claimRegistry.values()).filter(e => !e.pending).length,
      verdicts_on_chain: Array.from(this.verdictRegistry.values()).filter(e => !e.pending).length,
    };
  }

  /**
   * Get full blockchain state
   */
  exportState() {
    return {
      blockchain: this.blockchain.exportChain(),
      registries: {
        claims_total: this.claimRegistry.size,
        claims_on_chain: Array.from(this.claimRegistry.values()).filter(e => !e.pending).length,
        verdicts_total: this.verdictRegistry.size,
        verdicts_on_chain: Array.from(this.verdictRegistry.values()).filter(e => !e.pending).length,
      },
    };
  }

  /**
   * Verify a claim is properly recorded on-chain
   */
  verifyClaim(claimId) {
    const history = this.blockchain.getClaimHistory(claimId);

    if (history.total_transactions === 0) {
      return {
        verified: false,
        claim_id: claimId,
        message: 'Claim not found on blockchain',
      };
    }

    // Check claim submission record exists
    const claimSubmission = history.history.find(tx => tx.type === 'claim');
    if (!claimSubmission) {
      return {
        verified: false,
        claim_id: claimId,
        message: 'Claim submission record missing',
      };
    }

    // Verify chain
    const chainValid = this.blockchain.isChainValid();
    if (!chainValid.valid) {
      return {
        verified: false,
        claim_id: claimId,
        message: 'Blockchain integrity violation',
      };
    }

    return {
      verified: true,
      claim_id: claimId,
      transactions: history.total_transactions,
      first_recorded: claimSubmission.timestamp,
      block_index: claimSubmission.block_index,
      block_hash: claimSubmission.block_hash,
    };
  }
}

export { GameBlockchain };
