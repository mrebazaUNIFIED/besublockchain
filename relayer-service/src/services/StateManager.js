import logger from '../utils/logger.js';

/**
 * Manage relayer state in memory
 */
class StateManager {
  constructor() {
    this.syncState = {
      besu: {
        lastBlock: 0,
        lastSync: null
      },
      avalanche: {
        lastBlock: 0,
        lastSync: null
      }
    };

    this.loanMappings = new Map(); // loanId -> avalancheTokenId
    this.pendingTransactions = new Map(); // txHash -> data
    this.nonces = new Map(); // loanId -> nonce counter
    this.metrics = {
      eventsProcessed: 0,
      errors: 0,
      nftsMinted: 0,
      salesRecorded: 0,
      paymentsDistributed: 0
    };
  }

  /**
   * Update sync state for a chain
   */
  updateSyncState(chain, blockNumber) {
    if (this.syncState[chain]) {
      this.syncState[chain].lastBlock = blockNumber;
      this.syncState[chain].lastSync = new Date();
      logger.debug(`Sync state updated`, { chain, blockNumber });
    }
  }

  /**
   * Get sync state
   */
  getSyncState() {
    return this.syncState;
  }

  /**
   * Map loan to NFT
   */
  mapLoanToNFT(loanId, tokenId) {
    this.loanMappings.set(loanId, tokenId);
    logger.info(`Loan mapped to NFT`, { loanId, tokenId });
  }

  /**
   * Get NFT token ID for loan
   */
  getNFTForLoan(loanId) {
    return this.loanMappings.get(loanId);
  }

  /**
   * Get and increment nonce for a loan
   * Used for replay protection in multi-sig messages
   */
  getNonce(loanId) {
    const currentNonce = this.nonces.get(loanId) || 0;
    const nextNonce = currentNonce + 1;
    this.nonces.set(loanId, nextNonce);
    
    logger.debug(`Nonce generated for loan`, { loanId, nonce: nextNonce });
    return nextNonce;
  }

  /**
   * Get current nonce without incrementing (for queries)
   */
  getCurrentNonce(loanId) {
    return this.nonces.get(loanId) || 0;
  }

  /**
   * Reset nonce for a loan (use with caution)
   */
  resetNonce(loanId) {
    this.nonces.set(loanId, 0);
    logger.warn(`Nonce reset for loan`, { loanId });
  }

  /**
   * Add pending transaction
   */
  addPendingTx(txHash, data) {
    this.pendingTransactions.set(txHash, {
      ...data,
      addedAt: Date.now()
    });
  }

  /**
   * Remove pending transaction
   */
  removePendingTx(txHash) {
    this.pendingTransactions.delete(txHash);
  }

  /**
   * Get pending transaction
   */
  getPendingTx(txHash) {
    return this.pendingTransactions.get(txHash);
  }

  /**
   * Increment metric
   */
  incrementMetric(metric) {
    if (this.metrics[metric] !== undefined) {
      this.metrics[metric]++;
    }
  }

  /**
   * Get all metrics
   */
  getMetrics() {
    return {
      ...this.metrics,
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      loanMappings: this.loanMappings.size,
      pendingTxs: this.pendingTransactions.size,
      nonces: this.nonces.size
    };
  }

  /**
   * Clean old pending transactions
   */
  cleanupPendingTxs(maxAge = 3600000) { // 1 hour default
    const now = Date.now();
    let cleaned = 0;

    for (const [txHash, data] of this.pendingTransactions.entries()) {
      if (now - data.addedAt > maxAge) {
        this.pendingTransactions.delete(txHash);
        cleaned++;
      }
    }

    if (cleaned > 0) {
      logger.info(`Cleaned up old pending transactions`, { count: cleaned });
    }
  }

  /**
   * Get full state for debugging
   */
  getFullState() {
    return {
      syncState: this.syncState,
      loanMappings: Array.from(this.loanMappings.entries()),
      pendingTxs: Array.from(this.pendingTransactions.entries()),
      nonces: Array.from(this.nonces.entries()),
      metrics: this.getMetrics()
    };
  }
}

// Singleton instance
export default new StateManager();