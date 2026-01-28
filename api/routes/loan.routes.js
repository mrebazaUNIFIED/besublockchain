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
 * ✅ POST INTELIGENTE
 * @route   POST /api/loans
 * @desc    Crear O Actualizar loan (detecta automáticamente)
 * 
 * DETECCIÓN AUTOMÁTICA:
 * 1. Si el loan NO existe → CREAR (requiere todos los campos)
 * 2. Si el loan existe Y envías ≤10 campos → ACTUALIZACIÓN PARCIAL
 * 3. Si el loan existe Y envías >10 campos → ACTUALIZACIÓN COMPLETA
 * 
 * @body Para CREAR nuevo loan:
 * {
 *   "privateKey": "0x...",
 *   "loanData": {
 *     "ID": "LOAN001",
 *     "UserID": "USER001",
 *     "BorrowerFullName": "John Doe",
 *     // ... todos los campos requeridos
 *   }
 * }
 * 
 * @body Para ACTUALIZAR parcialmente (≤10 campos):
 * {
 *   "privateKey": "0x...",
 *   "loanData": {
 *     "ID": "LOAN001",
 *     "Status": "Current",
 *     "DaysSinceLastPymt": 0
 *   }
 * }
 * 
 * @body Para ACTUALIZAR completamente (>10 campos):
 * {
 *   "privateKey": "0x...",
 *   "loanData": {
 *     "ID": "LOAN001",
 *     "UserID": "USER001",
 *     // ... todos los campos
 *   }
 * }
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
 * OPCIONAL: Si alguien quiere usar PATCH explícitamente (mantiene compatibilidad)
 * @route   PATCH /api/loans/:loanId
 * @desc    Actualizar un loan parcialmente (forma explícita)
 * @body    { privateKey, fields: { Status: "Current", ... } }
 */
router.patch('/:loanId', loanController.updateLoanPartial.bind(loanController));

/**
 * OPCIONAL: Si alguien quiere usar PUT explícitamente (mantiene compatibilidad)
 * @route   PUT /api/loans/:loanId
 * @desc    Actualizar un loan completo (forma explícita)
 * @body    { privateKey, loanData: { ID, UserID, ... todos los campos } }
 */
router.put('/:loanId', loanController.updateLoan.bind(loanController));

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