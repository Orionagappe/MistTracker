#!/usr/bin/env node
/**
 * THE GAME - CUSTOM BLOCKCHAIN IMPLEMENTATION
 * 
 * Purpose: Immutable distributed ledger for claims and verdicts
 * Design: Proof-of-Work blockchain with adjustable difficulty
 * Integration: Serves as permanent record layer for game mechanics
 * 
 * Blockchain is independent of network—designed for single instance
 * with potential for distributed consensus later
 */

import crypto from 'crypto';

// ============================================================================
// BLOCKCHAIN BLOCK STRUCTURE
// ============================================================================

class Block {
  constructor(index, timestamp, transactions, previousHash, difficulty = 2) {
    this.index = index;
    this.timestamp = timestamp;
    this.transactions = transactions;
    this.previousHash = previousHash;
    this.difficulty = difficulty;
    this.nonce = 0;
    this.hash = this.calculateHash();
  }

  /**
   * Calculate block hash (including nonce for proof-of-work)
   */
  calculateHash() {
    const blockData = {
      index: this.index,
      timestamp: this.timestamp,
      transactions: this.transactions,
      previousHash: this.previousHash,
      difficulty: this.difficulty,
      nonce: this.nonce,
    };

    return crypto
      .createHash('sha256')
      .update(JSON.stringify(blockData))
      .digest('hex');
  }

  /**
   * Mine block: find nonce where hash meets difficulty requirement
   */
  mineBlock() {
    const start = Date.now();
    const targetPrefix = '0'.repeat(this.difficulty);

    while (!this.hash.startsWith(targetPrefix)) {
      this.nonce += 1;
      this.hash = this.calculateHash();
    }

    const duration = Date.now() - start;
    return {
      nonce: this.nonce,
      hash: this.hash,
      duration_ms: duration,
    };
  }

  /**
   * Verify this block is properly mined
   */
  isValid() {
    return this.hash === this.calculateHash() &&
           this.hash.startsWith('0'.repeat(this.difficulty));
  }
}

// ============================================================================
// BLOCKCHAIN LEDGER
// ============================================================================

class Blockchain {
  constructor(difficulty = 2, mineRewardAddress = 'SYSTEM') {
    this.chain = [];
    this.pendingTransactions = [];
    this.difficulty = difficulty;
    this.mineRewardAddress = mineRewardAddress;
    this.minerReward = 1; // Reward for mining a block
    this.blockTime = 5000; // Target block time in milliseconds

    // Create genesis block
    this.createGenesisBlock();
  }

  /**
   * Create the first block (genesis block)
   */
  createGenesisBlock() {
    const genesisBlock = new Block(
      0,
      new Date().toISOString(),
      [],
      '0',
      this.difficulty
    );

    genesisBlock.mineBlock();
    this.chain.push(genesisBlock);
  }

  /**
   * Get the latest block
   */
  getLatestBlock() {
    return this.chain[this.chain.length - 1];
  }

  /**
   * Add a transaction to pending transactions
   */
  addTransaction(transaction) {
    if (!transaction.claimId || !transaction.type) {
      return {
        success: false,
        error: 'Transaction must include claimId and type',
      };
    }

    // Add timestamp if not present
    if (!transaction.timestamp) {
      transaction.timestamp = new Date().toISOString();
    }

    // Add transaction hash
    transaction.hash = this.hashTransaction(transaction);

    this.pendingTransactions.push(transaction);

    return {
      success: true,
      transaction_hash: transaction.hash,
      pending_count: this.pendingTransactions.length,
    };
  }

  /**
   * Hash a transaction
   */
  hashTransaction(transaction) {
    return crypto
      .createHash('sha256')
      .update(JSON.stringify(transaction))
      .digest('hex')
      .substring(0, 16);
  }

  /**
   * Mine pending transactions into a new block
   */
  minePendingTransactions(minerAddress = this.mineRewardAddress) {
    // Add miner reward transaction
    const rewardTx = {
      claimId: `mining-reward-block-${this.chain.length}`,
      type: 'mining-reward',
      minerAddress,
      reward: this.minerReward,
      timestamp: new Date().toISOString(),
    };
    rewardTx.hash = this.hashTransaction(rewardTx);

    const transactionsToMine = [...this.pendingTransactions, rewardTx];

    // Create new block
    const newBlock = new Block(
      this.chain.length,
      new Date().toISOString(),
      transactionsToMine,
      this.getLatestBlock().hash,
      this.difficulty
    );

    // Mine the block
    const mineResult = newBlock.mineBlock();

    // Add to chain
    this.chain.push(newBlock);

    // Clear pending transactions
    const clearedCount = this.pendingTransactions.length;
    this.pendingTransactions = [];

    return {
      block_index: newBlock.index,
      block_hash: newBlock.hash,
      transactions_mined: clearedCount,
      miner_reward: this.minerReward,
      nonce: mineResult.nonce,
      duration_ms: mineResult.duration_ms,
      difficulty: this.difficulty,
    };
  }

  /**
   * Validate the entire blockchain
   */
  isChainValid() {
    for (let i = 1; i < this.chain.length; i++) {
      const currentBlock = this.chain[i];
      const previousBlock = this.chain[i - 1];

      // Check current block hash is correct
      if (currentBlock.hash !== currentBlock.calculateHash()) {
        return {
          valid: false,
          error: `Block ${i} hash mismatch`,
          block_index: i,
        };
      }

      // Check current block is properly mined
      if (!currentBlock.isValid()) {
        return {
          valid: false,
          error: `Block ${i} does not meet difficulty requirement`,
          block_index: i,
        };
      }

      // Check previous hash is correct
      if (currentBlock.previousHash !== previousBlock.hash) {
        return {
          valid: false,
          error: `Block ${i} previous hash mismatch`,
          block_index: i,
        };
      }
    }

    return {
      valid: true,
      blocks_verified: this.chain.length,
    };
  }

  /**
   * Get transaction by hash
   */
  getTransaction(txHash) {
    for (const block of this.chain) {
      const tx = block.transactions.find(t => t.hash === txHash);
      if (tx) {
        return {
          found: true,
          transaction: tx,
          block_index: block.index,
          block_hash: block.hash,
        };
      }
    }

    return {
      found: false,
      error: 'Transaction not found on chain',
    };
  }

  /**
   * Get all transactions for a claim
   */
  getClaimHistory(claimId) {
    const transactions = [];

    for (let blockIdx = 0; blockIdx < this.chain.length; blockIdx++) {
      const block = this.chain[blockIdx];
      const blockTxs = block.transactions.filter(t => t.claimId === claimId);
      
      blockTxs.forEach(tx => {
        transactions.push({
          ...tx,
          block_index: blockIdx,
          block_hash: block.hash,
          block_timestamp: block.timestamp,
        });
      });
    }

    return {
      claim_id: claimId,
      history: transactions,
      total_transactions: transactions.length,
    };
  }

  /**
   * Get block by index
   */
  getBlockByIndex(index) {
    if (index < 0 || index >= this.chain.length) {
      return {
        found: false,
        error: 'Block index out of range',
      };
    }

    const block = this.chain[index];
    return {
      found: true,
      block: {
        index: block.index,
        hash: block.hash,
        previousHash: block.previousHash,
        timestamp: block.timestamp,
        difficulty: block.difficulty,
        nonce: block.nonce,
        transactionCount: block.transactions.length,
      },
    };
  }

  /**
   * Get blockchain stats
   */
  getStats() {
    let totalTransactions = 0;
    let totalMiningRewards = 0;
    let gameTransactions = 0;

    for (const block of this.chain) {
      totalTransactions += block.transactions.length;
      
      block.transactions.forEach(tx => {
        if (tx.type === 'mining-reward') {
          totalMiningRewards += tx.reward;
        } else if (tx.type === 'claim' || tx.type === 'verdict') {
          gameTransactions += 1;
        }
      });
    }

    return {
      chain_length: this.chain.length,
      total_blocks: this.chain.length,
      total_transactions: totalTransactions,
      game_transactions: gameTransactions,
      pending_transactions: this.pendingTransactions.length,
      total_mining_rewards: totalMiningRewards,
      current_difficulty: this.difficulty,
      chain_valid: this.isChainValid().valid,
    };
  }

  /**
   * Generate merkle root for block transactions
   */
  calculateMerkleRoot(transactions) {
    if (transactions.length === 0) {
      return crypto
        .createHash('sha256')
        .update('')
        .digest('hex');
    }

    let hashes = transactions.map(tx => this.hashTransaction(tx));

    while (hashes.length > 1) {
      const newHashes = [];
      for (let i = 0; i < hashes.length; i += 2) {
        const hash1 = hashes[i];
        const hash2 = hashes[i + 1] || hashes[i];
        const combined = hash1 + hash2;
        const newHash = crypto
          .createHash('sha256')
          .update(combined)
          .digest('hex');
        newHashes.push(newHash);
      }
      hashes = newHashes;
    }

    return hashes[0];
  }

  /**
   * Export blockchain state
   */
  exportChain() {
    return {
      chain: this.chain.map(block => ({
        index: block.index,
        hash: block.hash,
        previousHash: block.previousHash,
        timestamp: block.timestamp,
        difficulty: block.difficulty,
        nonce: block.nonce,
        transactionCount: block.transactions.length,
      })),
      stats: this.getStats(),
      valid: this.isChainValid(),
    };
  }
}

// ============================================================================
// DEMONSTRATION & TESTING
// ============================================================================

async function demonstrateBlockchain() {
  console.log(`
╔════════════════════════════════════════════════════════════════╗
║  THE GAME - CUSTOM BLOCKCHAIN                                 ║
║  Immutable Ledger for Claims and Verdicts                     ║
╚════════════════════════════════════════════════════════════════╝
  `);

  // Create blockchain with difficulty 2
  const blockchain = new Blockchain(2, 'SYSTEM');

  console.log('\n📝 Adding transactions...\n');

  // Add claim transaction
  blockchain.addTransaction({
    claimId: 'claim-carbon-001',
    type: 'claim',
    element: 'Carbon',
    measurement: 'Bohr Radius',
    causality: 95.5,
    submittedBy: 'player-123456789',
  });

  // Add verdict transaction
  blockchain.addTransaction({
    claimId: 'claim-carbon-001',
    type: 'verdict',
    validator: 'validator-1',
    verdict: 'approved',
    reputationChange: 8,
  });

  // Add another claim
  blockchain.addTransaction({
    claimId: 'claim-nitrogen-001',
    type: 'claim',
    element: 'Nitrogen',
    measurement: 'Ionization Energy',
    causality: 99.3,
    submittedBy: 'player-987654321',
  });

  console.log(`  ✅ 3 transactions added to pending queue`);
  console.log(`  ⏳ Mining block 1...\n`);

  // Mine first block
  const mineResult1 = blockchain.minePendingTransactions('MINER-1');
  console.log(`  ✅ Block mined in ${mineResult1.duration_ms}ms`);
  console.log(`  🔨 Nonce: ${mineResult1.nonce}`);
  console.log(`  🔗 Hash: ${mineResult1.block_hash}`);
  console.log(`  💰 Miner reward: ${mineResult1.miner_reward}`);

  // Add more transactions
  console.log(`\n  Adding more transactions...\n`);

  blockchain.addTransaction({
    claimId: 'claim-nitrogen-001',
    type: 'verdict',
    validator: 'validator-2',
    verdict: 'approved',
    reputationChange: 8,
  });

  blockchain.addTransaction({
    claimId: 'claim-proton-001',
    type: 'claim',
    particle: 'Proton',
    measurement: 'Rest Mass',
    causality: 99.8,
    submittedBy: 'player-555555555',
  });

  console.log(`  ✅ 2 more transactions added`);
  console.log(`  ⏳ Mining block 2...\n`);

  const mineResult2 = blockchain.minePendingTransactions('MINER-2');
  console.log(`  ✅ Block mined in ${mineResult2.duration_ms}ms`);
  console.log(`  🔨 Nonce: ${mineResult2.nonce}`);

  // Verify blockchain
  console.log(`\n🔐 Verifying blockchain integrity...\n`);
  const verification = blockchain.isChainValid();
  console.log(`  ${verification.valid ? '✅' : '❌'} Chain valid: ${verification.valid}`);
  console.log(`  📊 Blocks verified: ${verification.blocks_verified}`);

  // Get claim history
  console.log(`\n📜 Claim history for claim-carbon-001:\n`);
  const history = blockchain.getClaimHistory('claim-carbon-001');
  history.history.forEach((tx, idx) => {
    console.log(`  ${idx + 1}. ${tx.type.toUpperCase()} in block ${tx.block_index}`);
    console.log(`     Timestamp: ${tx.timestamp}`);
  });

  // Display stats
  const stats = blockchain.getStats();
  console.log(`\n📈 Blockchain Statistics:\n`);
  console.log(`  Total blocks: ${stats.total_blocks}`);
  console.log(`  Total transactions: ${stats.total_transactions}`);
  console.log(`  Game transactions: ${stats.game_transactions}`);
  console.log(`  Pending transactions: ${stats.pending_transactions}`);
  console.log(`  Mining rewards issued: ${stats.total_mining_rewards}`);
  console.log(`  Current difficulty: ${stats.current_difficulty}`);

  // Export state
  const exported = blockchain.exportChain();
  console.log(`\n✅ Blockchain ready for integration`);
  console.log(`   Blocks: ${exported.chain.length}`);
  console.log(`   Valid: ${exported.valid.valid ? '✅' : '❌'}`);

  console.log(`\n╔════════════════════════════════════════════════════════════════╗`);
  console.log(`║ BLOCKCHAIN: ✅ SUCCESS`);
  console.log(`║ Blocks created: ${blockchain.chain.length}`);
  console.log(`║ Transactions: ${stats.total_transactions}`);
  console.log(`║ Chain integrity: ✅ VERIFIED`);
  console.log(`║ Ready for game integration`);
  console.log(`╚════════════════════════════════════════════════════════════════╝\n`);

  process.exit(0);
}

// Only run demo if executed directly (not imported)
// Check if the actual script name is 'blockchain.js', not 'test-blockchain.js' or other variants
const scriptName = (process.argv[1] || '').split(/[\\/]/).pop() || '';
if (scriptName === 'blockchain.js') {
  demonstrateBlockchain().catch(err => {
    console.error('❌ Blockchain demo failed:', err);
    process.exit(1);
  });
}

export { Blockchain, Block };
