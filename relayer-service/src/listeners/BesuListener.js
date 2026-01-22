import logger from '../utils/logger.js';
import besuService from '../services/BesuService.js';
import stateManager from '../services/StateManager.js';

/**
 * Listen to events from Besu MarketplaceBridge
 */
class BesuListener {
  constructor(eventQueue) {
    this.eventQueue = eventQueue;
    this.contract = null;
    this.isListening = false;
  }

  /**
   * Start listening to events
   */
  async start() {
    try {
      logger.info('Starting Besu event listener...');

      this.contract = besuService.getWsContract('marketplaceBridge');

      if (!this.contract) {
        throw new Error('MarketplaceBridge WebSocket contract not initialized');
      }

      // Listen to LoanApprovedForSale
      this.contract.on('LoanApprovedForSale', async (
        loanIdHash,  // Este es el hash del loanId
        lenderAddress,
        askingPrice,
        modifiedInterestRate,
        timestamp,
        event
      ) => {
        // ✅ SOLUCIÓN: Decodificar la transacción para obtener el loanId original
        const loanId = await this._getLoanIdFromTransaction(event.log.transactionHash);
        
        await this._handleEvent('LoanApprovedForSale', {
          loanId,  // Ahora es el string real: "GM912D0006"
          loanIdHash,  // Guardamos el hash también por si acaso
          lenderAddress,
          askingPrice: askingPrice.toString(),
          modifiedInterestRate: modifiedInterestRate.toString(),
          timestamp: timestamp.toString(),
          transactionHash: event.log.transactionHash,
          blockNumber: event.log.blockNumber,
          logIndex: event.log.index
        });
      });

      // Listen to PaymentRecorded
      this.contract.on('PaymentRecorded', async (
        loanIdHash,
        amount,
        timestamp,
        event
      ) => {
        // ✅ También obtener el loanId real para PaymentRecorded
        const loanId = await this._getLoanIdFromTransaction(event.log.transactionHash);
        
        await this._handleEvent('PaymentRecorded', {
          loanId,
          loanIdHash,
          amount: amount.toString(),
          timestamp: timestamp.toString(),
          transactionHash: event.log.transactionHash,
          blockNumber: event.log.blockNumber,
          logIndex: event.log.index
        });
      });

      this.isListening = true;
      logger.info('Besu event listener started successfully');

      this._startSyncStateUpdater();

    } catch (error) {
      logger.error('Failed to start Besu listener', { error: error.message });
      throw error;
    }
  }

  /**
   * Decodificar la transacción para obtener el loanId original
   */
  async _getLoanIdFromTransaction(txHash) {
    try {
      const provider = besuService.getProvider();
      const tx = await provider.getTransaction(txHash);
      
      if (!tx) {
        throw new Error(`Transaction not found: ${txHash}`);
      }

      // Decodificar los datos de la transacción
      const iface = this.contract.interface;
      const decodedData = iface.parseTransaction({
        data: tx.data,
        value: tx.value
      });

      // El primer parámetro de approveLoanForSale es el loanId
      const loanId = decodedData.args[0];
      
      logger.debug('Decoded loanId from transaction', {
        txHash,
        loanId,
        function: decodedData.name
      });

      return loanId;

    } catch (error) {
      logger.error('Failed to decode loanId from transaction', {
        txHash,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Stop listening
   */
  stop() {
    if (this.contract) {
      this.contract.removeAllListeners();
      this.isListening = false;
      logger.info('Besu event listener stopped');
    }
  }

  /**
   * Handle incoming event
   */
  async _handleEvent(eventType, eventData) {
    try {
      logger.info(`Besu event received: ${eventType}`, {
        loanId: eventData.loanId,
        blockNumber: eventData.blockNumber,
        txHash: eventData.transactionHash
      });

      // Add to queue for processing
      this.eventQueue.add({
        type: eventType,
        chain: 'besu',
        ...eventData
      });

      // Update metrics
      stateManager.incrementMetric('eventsProcessed');

    } catch (error) {
      logger.error('Error handling Besu event', {
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
        const blockNumber = await besuService.getBlockNumber();
        stateManager.updateSyncState('besu', blockNumber);
      } catch (error) {
        logger.error('Failed to update Besu sync state', { error: error.message });
      }
    }, 10000); // Every 10 seconds
  }
}

export default BesuListener;