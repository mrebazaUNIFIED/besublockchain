const express = require('express');
const router = express.Router();
const loanController = require('../controllers/loanController');

/**
 * @route   GET /api/loans
 * @desc    Obtener todos los loans activos
 */
router.get('/', loanController.getAllLoans.bind(loanController));

/**
 * @route   POST /api/loans
 * @desc    Crear un nuevo loan
 * @body    { privateKey, loanData }
 */
router.post('/', loanController.createLoan.bind(loanController));

/**
 * @route   PUT /api/loans/:loanId
 * @desc    Actualizar un loan existente
 * @body    { privateKey, loanData }
 */
router.put('/:loanId', loanController.updateLoan.bind(loanController));


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
 * @route   GET /api/loans/:loanId
 * @desc    Obtener un loan por ID
 */
router.get('/:loanId', loanController.getLoan.bind(loanController));

/**
 * @route   GET /api/loans/:loanId/exists
 * @desc    Verificar si un loan existe
 */
router.get('/:loanId/exists', loanController.checkLoanExists.bind(loanController));

/**
 * @route   GET /api/loans/:loanId/history
 * @desc    Obtener historial de un loan
 */
router.get('/:loanId/history', loanController.getLoanHistory.bind(loanController));

/**
 * @route   DELETE /api/loans/:loanId
 * @desc    Eliminar un loan (soft delete)
 * @body    { privateKey }
 */
router.delete('/:loanId', loanController.deleteLoan.bind(loanController));

module.exports = router;