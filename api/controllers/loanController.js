const loanService = require('../services/LoanRegistryService');

class LoanController {

  /**
   * POST /api/loans
   * Crear un loan
   */
  async createLoan(req, res, next) {
    try {
      const { privateKey, loanData } = req.body;

      if (!privateKey) {
        return res.status(400).json({ error: 'Private key required' });
      }

      if (!loanData || !loanData.ID || !loanData.UserID) {
        return res.status(400).json({
          error: 'Invalid loan data. Required: ID, userID, borrower, financial, dates, metrics'
        });
      }

      const result = await loanService.createLoan(privateKey, loanData);

      res.status(201).json({
        success: true,
        message: 'Loan created successfully',
        data: result
      });

    } catch (error) {
      if (error.message.includes('UserID is required')) {
        return res.status(400).json({ error: 'UserID cannot be empty or "---"' });
      }
      next(error);
    }
  }



  /**
 * PUT /api/loans/:loanId
 * Actualizar un loan
 */
  async updateLoan(req, res, next) {
    try {
      const { loanId } = req.params;
      const { privateKey, loanData } = req.body;

      if (!privateKey) {
        return res.status(400).json({ error: 'Private key required' });
      }

      if (!loanData || !loanData.ID || loanData.ID !== loanId || !loanData.UserID) {
        return res.status(400).json({
          error: 'Invalid loan data. Required: ID (must match :loanId), UserID, and fields to update'
        });
      }

      // Llama al servicio
      const result = await loanService.updateLoan(privateKey, loanData);

      res.json({
        success: true,
        message: 'Loan updated successfully',
        data: result
      });

    } catch (error) {
      if (error.message.includes('does not exist')) {
        return res.status(404).json({ error: 'Loan not found' });
      }
      next(error);
    }
  }
  /**
   * GET /api/loans/:loanId
   * Obtener un loan
   */
  async getLoan(req, res, next) {
    try {
      const { loanId } = req.params;
      const loan = await loanService.readLoan(loanId);

      res.json({
        success: true,
        data: loan
      });

    } catch (error) {
      if (error.message.includes('does not exist')) {
        return res.status(404).json({ error: 'Loan not found' });
      }
      next(error);
    }
  }

  /**
   * GET /api/loans/user/:userId
   * Obtener loans de un usuario
   */
  async getLoansByUserId(req, res, next) {
    try {
      const { userId } = req.params;
      const loans = await loanService.findLoansByUserId(userId);

      res.json({
        success: true,
        count: loans.length,
        data: loans
      });

    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/loans/:loanId/history
   * Obtener historial de un loan
   */
  async getLoanHistory(req, res, next) {
    try {
      const { loanId } = req.params;
      const history = await loanService.getLoanHistory(loanId);

      res.json({
        success: true,
        count: history.length,
        data: history
      });

    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /api/loans/:loanId
   * Eliminar un loan (soft delete)
   */
  async deleteLoan(req, res, next) {
    try {
      const { loanId } = req.params;
      const { privateKey } = req.body;

      if (!privateKey) {
        return res.status(400).json({ error: 'Private key required' });
      }

      const result = await loanService.deleteLoan(privateKey, loanId);

      res.json({
        success: true,
        message: 'Loan deleted successfully',
        data: result
      });

    } catch (error) {
      if (error.message.includes('does not exist')) {
        return res.status(404).json({ error: 'Loan not found' });
      }
      next(error);
    }
  }

  /**
   * GET /api/loans
   * Obtener todos los loans
   */
  async getAllLoans(req, res, next) {
    try {
      const loans = await loanService.queryAllLoans();

      res.json({
        success: true,
        count: loans.length,
        data: loans
      });

    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/loans/luid/:loanUid
   * Buscar loan por LUid
   */
  async getLoanByLUid(req, res, next) {
    try {
      const { loanUid } = req.params;
      const loan = await loanService.findLoanByLoanUid(loanUid);

      res.json({
        success: true,
        data: loan
      });

    } catch (error) {
      if (error.message.includes('No loan found')) {
        return res.status(404).json({ error: 'Loan not found with this LUid' });
      }
      next(error);
    }
  }

  /**
   * GET /api/loans/:loanId/exists
   * Verificar si existe un loan
   */
  async checkLoanExists(req, res, next) {
    try {
      const { loanId } = req.params;
      const exists = await loanService.loanExists(loanId);

      res.json({
        success: true,
        exists: exists
      });

    } catch (error) {
      next(error);
    }
  }
}

module.exports = new LoanController();