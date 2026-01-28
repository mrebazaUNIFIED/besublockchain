const loanService = require('../services/LoanRegistryService');

class LoanController {

  /**
   * POST /api/loans
   * POST INTELIGENTE: Crear O Actualizar (parcial o completo)
   * 
   * El controlador detecta automáticamente:
   * 1. Si el loan NO existe → Crear (requiere todos los campos)
   * 2. Si el loan existe Y enviaste todos los campos → Actualizar completo
   * 3. Si el loan existe Y enviaste solo algunos campos → Actualizar PARCIAL
   */
  async createLoan(req, res, next) {
    try {
      const { privateKey, loanData } = req.body;

      if (!privateKey) {
        return res.status(400).json({ error: 'Private key required' });
      }

      if (!loanData || !loanData.ID) {
        return res.status(400).json({
          error: 'Invalid loan data. Required: ID and other fields'
        });
      }

      // ✅ PASO 1: Verificar si el loan existe
      const loanExists = await loanService.loanExists(loanData.ID);

      // ✅ CASO 1: Loan NO existe → Crear loan nuevo (requiere todos los campos)
      if (!loanExists) {
        // Validar que tenga UserID para crear
        if (!loanData.UserID) {
          return res.status(400).json({
            error: 'UserID is required to create a new loan'
          });
        }

        // Validar que tenga los campos mínimos para crear
        const requiredFields = [
          'ID', 'UserID', 'BorrowerFullName', 'CurrentPrincipalBal',
          'OriginalLoanAmount', 'Status', 'LUid'
        ];
        
        const missingFields = requiredFields.filter(field => !loanData[field]);
        
        if (missingFields.length > 0) {
          return res.status(400).json({
            error: `Missing required fields for new loan: ${missingFields.join(', ')}`
          });
        }

        // Crear loan completo
        const result = await loanService.createLoan(privateKey, loanData);

        return res.status(201).json({
          success: true,
          message: 'Loan created successfully',
          operation: 'CREATE',
          data: result
        });
      }

      // ✅ CASO 2 y 3: Loan SÍ existe → Determinar si es actualización parcial o completa
      
      // Leer el loan actual para saber qué campos tiene
      const currentLoan = await loanService.readLoan(loanData.ID);

      // Lista de todos los campos posibles en un loan
      const allLoanFields = [
        'ID', 'UserID', 'BorrowerFullName', 'BorrowerHomePhone',
        'BorrowerPropertyAddress', 'BorrowerState', 'BorrowerZip',
        'BorrowerCity', 'BorrowerEmail', 'BorrowerOccupancyStatus',
        'CurrentPrincipalBal', 'RestrictedFunds', 'SuspenseBalance',
        'EscrowBalance', 'TotalInTrust', 'NoteRate', 'SoldRate',
        'DefaultRate', 'UnpaidInterest', 'UnpaidFees', 'LateFeesAmount',
        'UnpaidLateFees', 'AccruedLateFees', 'UnpaidLoanCharges',
        'DeferredPrincBalance', 'DeferredUnpCharges', 'OriginalLoanAmount',
        'OriginationDate', 'NextPaymentDue', 'LoanMaturityDate',
        'LastPaymentRec', 'InterestPaidTo', 'DeferredUnpaidInt',
        'FCIRestrictedPrincipal', 'FCIRestrictedInterest', 'PymtGraceDays',
        'DaysSinceLastPymt', 'NumOfPymtsDue', 'ScheduledPayment',
        'PromisesToPay', 'NFSInLast12Months', 'DeferredLateFees',
        'InvestorRestrictedPrincipal', 'InvestorRestrictedInterest',
        'Status', 'LUid'
      ];

      // Contar cuántos campos enviaron
      const providedFields = Object.keys(loanData);
      const providedFieldCount = providedFields.length;

      // Si enviaron 10 o menos campos (sin contar ID que es obligatorio) → Actualización PARCIAL
      if (providedFieldCount <= 10) {
        console.log(`📝 Detected PARTIAL update: ${providedFieldCount} fields provided`);

        // Extraer solo los campos que se pueden actualizar parcialmente
        const partialUpdateFields = {};
        const supportedPartialFields = [
          'CurrentPrincipalBal', 'UnpaidInterest', 'Status', 'LastPaymentRec',
          'DaysSinceLastPymt', 'NumOfPymtsDue', 'NextPaymentDue', 'UnpaidFees',
          'LateFeesAmount', 'NoteRate', 'BorrowerFullName', 'BorrowerPropertyAddress',
          'BorrowerEmail', 'BorrowerHomePhone', 'BorrowerCity', 'BorrowerState',
          'BorrowerZip'
        ];

        supportedPartialFields.forEach(field => {
          if (loanData[field] !== undefined) {
            partialUpdateFields[field] = loanData[field];
          }
        });

        if (Object.keys(partialUpdateFields).length === 0) {
          return res.status(400).json({
            error: 'No valid fields to update',
            hint: 'Provide at least one of: ' + supportedPartialFields.join(', ')
          });
        }

        // Usar actualización parcial
        const result = await loanService.updateLoanPartial(
          privateKey,
          loanData.ID,
          partialUpdateFields
        );

        return res.json({
          success: true,
          message: 'Loan updated partially',
          operation: 'PARTIAL_UPDATE',
          updatedFields: Object.keys(partialUpdateFields),
          data: result
        });
      }

      // Si enviaron más de 10 campos → Actualización COMPLETA
      console.log(`📝 Detected FULL update: ${providedFieldCount} fields provided`);

      // Validar que tenga UserID
      if (!loanData.UserID) {
        return res.status(400).json({
          error: 'UserID is required for full update'
        });
      }

      const result = await loanService.updateLoan(privateKey, loanData);

      return res.json({
        success: true,
        message: 'Loan updated completely',
        operation: 'FULL_UPDATE',
        data: result
      });

    } catch (error) {
      if (error.message.includes('UserID is required')) {
        return res.status(400).json({ error: 'UserID cannot be empty or "---"' });
      }
      if (error.message.includes('Cannot update locked loan')) {
        return res.status(400).json({ error: 'Cannot update locked/tokenized loan' });
      }
      next(error);
    }
  }

  /**
   * PUT /api/loans/:loanId
   * Actualizar un loan (requiere todos los campos)
   * MANTIENE COMPATIBILIDAD con código que usa PUT explícitamente
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
          error: 'Invalid loan data. Required: ID (must match :loanId), UserID, and all fields'
        });
      }

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
   * PATCH /api/loans/:loanId
   * Actualizar un loan parcialmente (solo envías los campos que quieres cambiar)
   * MANTIENE COMPATIBILIDAD con código que usa PATCH explícitamente
   */
  async updateLoanPartial(req, res, next) {
    try {
      const { loanId } = req.params;
      const { privateKey, fields } = req.body;

      if (!privateKey) {
        return res.status(400).json({ error: 'Private key required' });
      }

      if (!fields || Object.keys(fields).length === 0) {
        return res.status(400).json({
          error: 'No fields to update. Provide at least one field in "fields" object'
        });
      }

      const validFields = [
        'CurrentPrincipalBal', 'UnpaidInterest', 'Status', 'LastPaymentRec',
        'DaysSinceLastPymt', 'NumOfPymtsDue', 'NextPaymentDue', 'UnpaidFees',
        'LateFeesAmount', 'NoteRate', 'BorrowerFullName', 'BorrowerPropertyAddress',
        'BorrowerEmail', 'BorrowerHomePhone', 'BorrowerCity', 'BorrowerState',
        'BorrowerZip'
      ];

      const invalidFields = Object.keys(fields).filter(
        field => !validFields.includes(field)
      );

      if (invalidFields.length > 0) {
        return res.status(400).json({
          error: `Invalid fields: ${invalidFields.join(', ')}`,
          validFields: validFields
        });
      }

      const result = await loanService.updateLoanPartial(privateKey, loanId, fields);

      res.json({
        success: true,
        message: 'Loan updated partially',
        data: result,
        updatedFields: Object.keys(fields)
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
   * GET /api/loans/tx/:txId
   * Obtener loan por TxId con sus cambios
   */
  async getLoanByTxId(req, res, next) {
    try {
      const { txId } = req.params;
      
      console.log(`Getting loan by TxId: ${txId}`);
      const result = await loanService.getLoanByTxId(txId);

      res.json({
        success: true,
        loan: result.loan,
        changes: result.changes,
        txId: txId
      });

    } catch (error) {
      if (error.message.includes('Transaction not found')) {
        return res.status(404).json({ 
          success: false,
          error: 'Transaction not found' 
        });
      }
      if (error.message.includes('Loan state not found')) {
        return res.status(404).json({ 
          success: false,
          error: 'Loan state not found for this TxId' 
        });
      }
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
      const offset = parseInt(req.query.offset) || 0;
      const limit = parseInt(req.query.limit) || 50;
      const fetchAll = req.query.fetchAll === 'true';

      let result;

      if (fetchAll) {
        const loans = await loanService.queryAllLoansComplete();
        result = {
          success: true,
          count: loans.length,
          total: loans.length,
          data: loans
        };
      } else {
        const paginatedResult = await loanService.queryAllLoans(offset, limit);
        result = {
          success: true,
          count: paginatedResult.returned,
          total: paginatedResult.total,
          offset: paginatedResult.offset,
          limit: paginatedResult.limit,
          data: paginatedResult.loans
        };
      }

      res.json(result);

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