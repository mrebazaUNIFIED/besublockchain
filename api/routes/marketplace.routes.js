const express = require('express');
const router = express.Router();
const marketplaceController = require('../controllers/marketplaceController');

/**
 * @route   POST /api/marketplace/approve/:loanId
 * @desc    Aprobar un loan para tokenización/venta
 * @body    { privateKey, askingPrice, modifiedInterestRate }
 */
router.post('/approve/:loanId', marketplaceController.approveLoanForSale.bind(marketplaceController));

/**
 * @route   POST /api/marketplace/cancel/:loanId
 * @desc    Cancelar aprobación de venta
 * @body    { privateKey }
 */
router.post('/cancel/:loanId', marketplaceController.cancelSaleListing.bind(marketplaceController));

/**
 * @route   GET /api/marketplace/approval/:loanId
 * @desc    Obtener datos de aprobación de un loan
 */
router.get('/approval/:loanId', marketplaceController.getApprovalData.bind(marketplaceController));

/**
 * @route   GET /api/marketplace/status/:loanId
 * @desc    Obtener estado completo de tokenización
 */
router.get('/status/:loanId', marketplaceController.getTokenizationStatus.bind(marketplaceController));

/**
 * @route   GET /api/marketplace/approved
 * @desc    Listar loans aprobados pendientes de minteo
 */
router.get('/approved', marketplaceController.getApprovedLoans.bind(marketplaceController));


router.post('/set-token-id', marketplaceController.setAvalancheTokenId.bind(marketplaceController));
router.post('/record-transfer', marketplaceController.recordOwnershipTransfer.bind(marketplaceController));
router.post('/record-payment', marketplaceController.recordPayment.bind(marketplaceController));


module.exports = router;