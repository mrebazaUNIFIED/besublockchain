import express from 'express';
import stateManager from '../../services/StateManager.js';
import besuService from '../../services/BesuService.js';
import avalancheService from '../../services/AvalancheService.js';

const router = express.Router();

/**
 * GET /api/relayer/status
 * Get detailed relayer status
 */
router.get('/status', (req, res) => {
  const syncState = stateManager.getSyncState();
  const metrics = stateManager.getMetrics();
  
  res.json({
    status: 'running',
    uptime: process.uptime(),
    syncState,
    metrics,
    timestamp: new Date().toISOString()
  });
});

/**
 * GET /api/relayer/sync-state
 * Get blockchain sync state
 */
router.get('/sync-state', async (req, res) => {
  try {
    const besuBlock = await besuService.getBlockNumber();
    const avalancheBlock = await avalancheService.getBlockNumber();
    const syncState = stateManager.getSyncState();
    
    res.json({
      besu: {
        currentBlock: besuBlock,
        lastSyncedBlock: syncState.besu.lastBlock,
        lastSync: syncState.besu.lastSync,
        synced: besuBlock === syncState.besu.lastBlock
      },
      avalanche: {
        currentBlock: avalancheBlock,
        lastSyncedBlock: syncState.avalanche.lastBlock,
        lastSync: syncState.avalanche.lastSync,
        synced: avalancheBlock === syncState.avalanche.lastBlock
      }
    });
    
  } catch (error) {
    res.status(500).json({ error: 'Failed to get sync state' });
  }
});

/**
 * GET /api/relayer/metrics
 * Get relayer metrics (Prometheus format)
 */
router.get('/metrics', (req, res) => {
  const metrics = stateManager.getMetrics();
  
  let output = '';
  output += `# HELP relayer_events_processed_total Total events processed\n`;
  output += `# TYPE relayer_events_processed_total counter\n`;
  output += `relayer_events_processed_total ${metrics.eventsProcessed}\n\n`;

  output += `# HELP relayer_nfts_minted_total Total NFTs minted\n`;
  output += `# TYPE relayer_nfts_minted_total counter\n`;
  output += `relayer_nfts_minted_total ${metrics.nftsMinted}\n\n`;

  output += `# HELP relayer_sales_recorded_total Total sales recorded\n`;
  output += `# TYPE relayer_sales_recorded_total counter\n`;
  output += `relayer_sales_recorded_total ${metrics.salesRecorded}\n\n`;

  output += `# HELP relayer_payments_distributed_total Total payments distributed\n`;
  output += `# TYPE relayer_payments_distributed_total counter\n`;
  output += `relayer_payments_distributed_total ${metrics.paymentsDistributed}\n\n`;

  output += `# HELP relayer_errors_total Total errors\n`;
  output += `# TYPE relayer_errors_total counter\n`;
  output += `relayer_errors_total ${metrics.errors}\n\n`;

  res.type('text/plain').send(output);
});

export default router;