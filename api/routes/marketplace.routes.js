// routes/marketplace.routes.js
const express = require('express');
const router = express.Router();
const marketplaceBridgeService = require('../services/MarketplaceBridgeService');

/**
 * ✅ NUEVO: GET /marketplace/approval/tx/:txHash
 * Obtener datos de aprobación por txHash
 */
router.get('/approval/tx/:txHash', async (req, res) => {
  try {
    const { txHash } = req.params;
    
    const approvalData = await marketplaceBridgeService.getApprovalDataByTxHash(txHash);
    
    res.json({
      success: true,
      approval: approvalData,
      txHash: txHash
    });
  } catch (error) {
    console.error('Error fetching approval by txHash:', error);
    res.status(404).json({
      success: false,
      error: error.message || 'Approval not found for this txHash'
    });
  }
});

/**
 * GET /marketplace/approval/:loanId
 * Obtener datos de aprobación por loanId
 */
router.get('/approval/:loanId', async (req, res) => {
  try {
    const { loanId } = req.params;
    const approvalData = await marketplaceBridgeService.getApprovalData(loanId);
    
    res.json({
      success: true,
      approval: approvalData,
      loanId: loanId
    });
  } catch (error) {
    console.error('Error fetching approval:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;