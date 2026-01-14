const express = require('express');
const router = express.Router();
const loanController = require('../controllers/loanController');

/**
 * IMPORTANTE: El orden de las rutas importa.
 * Las rutas específicas deben ir ANTES de las rutas con parámetros dinámicos.
 */

/**
 * @route   GET /api/loans
 * @desc    Obtener todos los loans activos
 * @query   ?offset=0&limit=50&fetchAll=false
 */
router.get('/', loanController.getAllLoans.bind(loanController));

/**
 * @route   POST /api/loans
 * @desc    Crear un nuevo loan
 * @body    { privateKey, loanData }
 */
router.post('/', loanController.createLoan.bind(loanController));

// ============================================
// RUTAS ESPECÍFICAS (deben ir primero)
// ============================================

/**
 * @route   GET /api/loans/luid/:loanUid
 * @desc    Buscar loan por LUid
 */
router.get('/luid/:loanUid', loanController.getLoanByLUid.bind(loanController));

/**
 * @route   GET /api/loans/user/:userId
 * @desc    Obtener loans de un usuario
 */
router.get('/user/:userId', loanController.getLoansByUserId.bind(loanController));

/**
 * @route   GET /api/loans/tx/:txId
 * @desc    Obtener loan por Transaction ID (TxId) con sus cambios
 * @returns { loan, changes, txId }
 */
router.get('/tx/:txId', loanController.getLoanByTxId.bind(loanController));

// ============================================
// RUTAS CON PARÁMETROS DINÁMICOS (van después)
// ============================================

/**
 * @route   PUT /api/loans/:loanId
 * @desc    Actualizar un loan existente
 * @body    { privateKey, loanData }
 */
router.put('/:loanId', loanController.updateLoan.bind(loanController));

/**
 * @route   GET /api/loans/:loanId/exists
 * @desc    Verificar si un loan existe
 */
router.get('/:loanId/exists', loanController.checkLoanExists.bind(loanController));

/**
 * @route   GET /api/loans/:loanId/history
 * @desc    Obtener historial completo de un loan
 */
router.get('/:loanId/history', loanController.getLoanHistory.bind(loanController));

/**
 * @route   DELETE /api/loans/:loanId
 * @desc    Eliminar un loan (soft delete)
 * @body    { privateKey }
 */
router.delete('/:loanId', loanController.deleteLoan.bind(loanController));

/**
 * @route   GET /api/loans/:loanId
 * @desc    Obtener un loan por ID (debe ir al final)
 */
router.get('/:loanId', loanController.getLoan.bind(loanController));

module.exports = router;