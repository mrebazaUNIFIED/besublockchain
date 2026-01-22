import dotenv from 'dotenv';
import logger from './utils/logger.js';
import { EventQueue } from './utils/queue.js';
import besuService from './services/BesuService.js';
import avalancheService from './services/AvalancheService.js';
import stateManager from './services/StateManager.js';
import BesuListener from './listeners/BesuListener.js';
import AvalancheListener from './listeners/AvalancheListener.js';
import LoanApprovedHandler from './handlers/LoanApprovedHandler.js';
import LoanSoldHandler from './handlers/LoanSoldHandler.js';
import PaymentReceivedHandler from './handlers/PaymentReceivedHandler.js';
import { startAPIServer } from './api/server.js';

dotenv.config();

// Global state
let besuListener = null;
let avalancheListener = null;
let eventQueue = null;
let apiServer = null;

/**
 * Event processor function
 */
async function processEvent(event) {
    logger.info(`Processing event`, {
        type: event.type,
        chain: event.chain,
        txHash: event.transactionHash
    });

    try {
        let handler;

        switch (event.type) {
            case 'LoanApprovedForSale':
                handler = new LoanApprovedHandler();
                break;
            case 'LoanSold':
                handler = new LoanSoldHandler();
                break;
            case 'PaymentRecorded':
                handler = new PaymentReceivedHandler();
                break;
            default:
                logger.warn(`Unknown event type: ${event.type}`);
                return;
        }

        await handler.process(event);

    } catch (error) {
        logger.error(`Event processing failed`, {
            type: event.type,
            error: error.message,
            stack: error.stack
        });
        throw error;
    }
}

/**
 * Initialize relayer
 */
async function initialize() {
    try {
        logger.info('🚀 Starting Loan Relayer Service...');

        // Initialize blockchain services
        logger.info('Initializing blockchain services...');
        await besuService.initialize();
        await avalancheService.initialize();
        logger.info('✅ Blockchain services initialized');

        // Create event queue
        logger.info('Creating event queue...');
        eventQueue = new EventQueue('main', processEvent, {
            processInterval: 5000,
            maxConcurrent: 3
        });
        logger.info('✅ Event queue created');

        // Start event listeners
        logger.info('Starting event listeners...');
        besuListener = new BesuListener(eventQueue);
        await besuListener.start();

        avalancheListener = new AvalancheListener(eventQueue);
        await avalancheListener.start();
        logger.info('✅ Event listeners started');

        // Start event queue processing
        logger.info('Starting queue processing...');
        eventQueue.start();
        logger.info('✅ Queue processing started');

        // Start API server
        logger.info('Starting API server...');
        apiServer = await startAPIServer(eventQueue);
        logger.info('✅ API server started');

        // Setup periodic cleanup
        setInterval(() => {
            stateManager.cleanupPendingTxs();
        }, 3600000); // Every hour

        logger.info('✅ Relayer service started successfully');
        logger.info('📊 Relayer is now processing events...');

    } catch (error) {
        logger.error('Failed to initialize relayer', { error: error.message });
        throw error;
    }
}

/**
 * Graceful shutdown
 */
async function shutdown() {
    logger.info('Shutting down relayer service...');

    try {
        // Stop listeners
        if (besuListener) {
            besuListener.stop();
        }
        if (avalancheListener) {
            avalancheListener.stop();
        }

        // Stop queue
        if (eventQueue) {
            eventQueue.stop();
        }

        // Close API server
        if (apiServer) {
            apiServer.close();
        }

        // Cleanup services
        await besuService.cleanup();
        await avalancheService.cleanup();

        logger.info('✅ Relayer service shut down successfully');
        process.exit(0);

    } catch (error) {
        logger.error('Error during shutdown', { error: error.message });
        process.exit(1);
    }
}

// Handle process signals
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

// Handle uncaught errors
process.on('uncaughtException', (error) => {
    logger.error('Uncaught exception', { error: error.message, stack: error.stack });
    shutdown();
});

process.on('unhandledRejection', (reason, promise) => {
    logger.error('Unhandled rejection', { reason, promise });
    shutdown();
});

// Start the relayer
initialize().catch((error) => {
    logger.error('Fatal error during initialization', { error: error.message });
    process.exit(1);
});