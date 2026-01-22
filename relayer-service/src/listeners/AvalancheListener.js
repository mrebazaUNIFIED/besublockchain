import { ethers } from 'ethers';
import logger from '../utils/logger.js';
import avalancheService from '../services/AvalancheService.js';
import stateManager from '../services/StateManager.js';

/**
 * Listen to events from Avalanche contracts
 */
class AvalancheListener {
  constructor(eventQueue) {
    this.eventQueue = eventQueue;
    this.nftContract = null;
    this.marketplaceContract = null;
    this.paymentDistributorContract = null;
    this.isListening = false;
  }

  /**
   * Start listening to events
   */
  async start() {
    try {
      logger.info('Starting Avalanche event listener...');

      // ✅ CRÍTICO: Usar SOLO contratos WebSocket
      this.nftContract = avalancheService.getWsContract('loanNFT');
      this.marketplaceContract = avalancheService.getWsContract('marketplace');
      this.paymentDistributorContract = avalancheService.getWsContract('paymentDistributor');

      if (!this.nftContract || !this.marketplaceContract) {
        throw new Error('Avalanche WebSocket contracts not initialized');
      }

      // Listen to LoanNFTMinted
      this.nftContract.on('LoanNFTMinted', async (
        tokenId,
        loanId,
        lender,
        timestamp,
        event
      ) => {
        logger.info('NFT minted event received', {
          tokenId: tokenId.toString(),
          loanId,
          lender,
          txHash: event.log.transactionHash
        });
        // This is just for logging, main flow is handled by handlers
      });

      // Listen to Transfer (NFT transfers)
      this.nftContract.on('Transfer', async (
        from,
        to,
        tokenId,
        event
      ) => {
        // Skip minting events (from = 0x0)
        if (from === ethers.ZeroAddress) {
          return;
        }

        logger.info('NFT transferred', {
          from,
          to,
          tokenId: tokenId.toString(),
          txHash: event.log.transactionHash
        });
      });

      // Listen to LoanSold
      this.marketplaceContract.on('LoanSold', async (
        tokenId,
        seller,
        buyer,
        price,
        fee,
        timestamp,
        event
      ) => {
        await this._handleEvent('LoanSold', {
          tokenId: tokenId.toString(),
          seller,
          buyer,
          price: price.toString(),
          fee: fee.toString(),
          timestamp: timestamp.toString(),
          transactionHash: event.log.transactionHash,
          blockNumber: event.log.blockNumber,
          logIndex: event.log.index
        });
      });

      // Listen to PaymentClaimed (corregido - en lugar de PaymentDistributed)
      if (this.paymentDistributorContract) {
        this.paymentDistributorContract.on('PaymentClaimed', async (
          tokenId,
          claimer,
          amount,
          timestamp,
          event
        ) => {
          logger.info('Payment claimed', {
            tokenId: tokenId.toString(),
            claimer,
            amount: amount.toString(),
            txHash: event.log.transactionHash
          });
        });
      }

      this.isListening = true;
      logger.info('Avalanche event listener started successfully');

      // Update sync state periodically
      this._startSyncStateUpdater();

    } catch (error) {
      logger.error('Failed to start Avalanche listener', { error: error.message });
      throw error;
    }
  }

  /**
   * Stop listening
   */
  stop() {
    if (this.nftContract) {
      this.nftContract.removeAllListeners();
    }
    if (this.marketplaceContract) {
      this.marketplaceContract.removeAllListeners();
    }
    if (this.paymentDistributorContract) {
      this.paymentDistributorContract.removeAllListeners();
    }
    this.isListening = false;
    logger.info('Avalanche event listener stopped');
  }

  /**
   * Handle incoming event
   */
  async _handleEvent(eventType, eventData) {
    try {
      logger.info(`Avalanche event received: ${eventType}`, {
        tokenId: eventData.tokenId,
        blockNumber: eventData.blockNumber,
        txHash: eventData.transactionHash
      });

      // Add to queue for processing
      this.eventQueue.add({
        type: eventType,
        chain: 'avalanche',
        ...eventData
      });

      // Update metrics
      stateManager.incrementMetric('eventsProcessed');

    } catch (error) {
      logger.error('Error handling Avalanche event', {
        eventType,
        error: error.message
      });
      stateManager.incrementMetric('errors');
    }
  }

  /**
   * Update sync state periodically
   */
  _startSyncStateUpdater() {
    setInterval(async () => {
      try {
        const blockNumber = await avalancheService.getBlockNumber();
        stateManager.updateSyncState('avalanche', blockNumber);
      } catch (error) {
        logger.error('Failed to update Avalanche sync state', { error: error.message });
      }
    }, 10000); // Every 10 seconds
  }
}

export default AvalancheListener;