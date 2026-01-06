// routes/usfci.routes.js
const express = require('express');
const {
  initLedger,
  pause,
  unpause,
  getSystemConfig,
  registerWallet,
  getAccountDetails,
  getBalance,
  mintTokens,
  transfer,
  updateComplianceStatus
} = require('../controllers/usfciController');

const router = express.Router();

// ==========================================
// RUTAS ESPECÍFICAS PRIMERO
// ==========================================

// Admin
router.post('/admin/init', initLedger);
router.post('/admin/pause', pause);
router.post('/admin/unpause', unpause);
router.get('/admin/config', getSystemConfig);

// Tokens
router.post('/tokens/mint', mintTokens);
router.post('/tokens/transfer', transfer);

// ==========================================
// RUTAS CON PARÁMETROS DINÁMICOS
// ==========================================

// Wallet
router.post('/wallet/register', registerWallet);
router.get('/wallet/:walletAddress', getAccountDetails);
router.get('/wallet/:walletAddress/balance', getBalance);

// Compliance
router.put('/wallet/:walletAddress/compliance', updateComplianceStatus);

module.exports = router;