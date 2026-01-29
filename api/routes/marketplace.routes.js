const express = require('express');
const router = express.Router();

const marketplaceController = require('../controllers/marketplaceController');
const marketplaceBridgeService = require('../services/MarketplaceBridgeService');

/**
 * @route   POST /api/marketplace/approve/:loanId
 * @desc    Aprobar un loan para tokenización/venta
 * @body    { privateKey, askingPrice, modifiedInterestRate }
 */
router.post(
  '/approve/:loanId',
  marketplaceController.approveLoanForSale.bind(marketplaceController)
);

/**
 * @route   POST /api/marketplace/cancel/:loanId
 * @desc    Cancelar aprobación de venta
 * @body    { privateKey }
 */
router.post(
  '/cancel/:loanId',
  marketplaceController.cancelSaleListing.bind(marketplaceController)
);

/**
 * @route   GET /api/marketplace/status/:loanId
 * @desc    Obtener estado completo de tokenización
 */
router.get(
  '/status/:loanId',
  marketplaceController.getTokenizationStatus.bind(marketplaceController)
);

/**
 * @route   GET /api/marketplace/approved
 * @desc    Listar loans aprobados pendientes de minteo
 */
router.get(
  '/approved',
  marketplaceController.getApprovedLoans.bind(marketplaceController)
);

/**
 * @route   POST /api/marketplace/set-token-id
 */
router.post(
  '/set-token-id',
  marketplaceController.setAvalancheTokenId.bind(marketplaceController)
);

/**
 * @route   POST /api/marketplace/record-transfer
 */
router.post(
  '/record-transfer',
  marketplaceController.recordOwnershipTransfer.bind(marketplaceController)
);

/**
 * @route   POST /api/marketplace/record-payment
 */
router.post(
  '/record-payment',
  marketplaceController.recordPayment.bind(marketplaceController)
);

/**
 * @route   GET /api/marketplace/approval/tx/:txHash
 * @desc    Obtener datos de aprobación por txHash
 */
router.get('/approval/tx/:txHash', async (req, res) => {
  try {
    const { txHash } = req.params;

    const approvalData =
      await marketplaceBridgeService.getApprovalDataByTxHash(txHash);

    res.json({
      success: true,
      approval: approvalData,
      txHash
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
 * @route   GET /api/marketplace/approval/:loanId
 * @desc    Obtener datos de aprobación por loanId
 */
router.get('/approval/:loanId', async (req, res) => {
  try {
    const { loanId } = req.params;

    const approvalData =
      await marketplaceBridgeService.getApprovalData(loanId);

    res.json({
      success: true,
      approval: approvalData,
      loanId
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
