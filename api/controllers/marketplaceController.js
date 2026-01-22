const marketplaceBridgeService = require('../services/MarketplaceBridgeService');
const loanService = require('../services/LoanRegistryService');

class MarketplaceController {

  /**
   * POST /api/marketplace/approve/:loanId
   * Aprobar un loan para tokenización
   */
  async approveLoanForSale(req, res, next) {
    try {
      const { loanId } = req.params;
      const { privateKey, askingPrice, modifiedInterestRate } = req.body;

      if (!privateKey) {
        return res.status(400).json({ error: 'Private key required' });
      }

      if (!askingPrice || askingPrice <= 0) {
        return res.status(400).json({ error: 'Valid asking price required' });
      }

      if (modifiedInterestRate === undefined) {
        return res.status(400).json({ error: 'Modified interest rate required' });
      }

      // Verificar que el loan existe
      const exists = await loanService.loanExists(loanId);
      if (!exists) {
        return res.status(404).json({ error: 'Loan not found' });
      }

      const result = await marketplaceBridgeService.approveLoanForSale(
        privateKey,
        loanId,
        askingPrice,
        modifiedInterestRate
      );

      res.status(200).json({
        success: true,
        message: 'Loan approved for tokenization. The relayer will process it shortly.',
        data: result
      });

    } catch (error) {
      if (error.message.includes('Loan already tokenized')) {
        return res.status(400).json({ error: 'Loan is already tokenized' });
      }
      if (error.message.includes('Already approved')) {
        return res.status(400).json({ error: 'Loan is already approved for sale' });
      }
      if (error.message.includes('Not the loan owner')) {
        return res.status(403).json({ error: 'Only the loan owner can approve it for sale' });
      }
      next(error);
    }
  }

  /**
   * POST /api/marketplace/cancel/:loanId
   * Cancelar aprobación de venta
   */
  async cancelSaleListing(req, res, next) {
    try {
      const { loanId } = req.params;
      const { privateKey } = req.body;

      if (!privateKey) {
        return res.status(400).json({ error: 'Private key required' });
      }

      const result = await marketplaceBridgeService.cancelSaleListing(privateKey, loanId);

      res.json({
        success: true,
        message: 'Sale listing cancelled successfully',
        data: result
      });

    } catch (error) {
      if (error.message.includes('Not approved for sale')) {
        return res.status(400).json({ error: 'Loan is not approved for sale' });
      }
      if (error.message.includes('NFT already minted')) {
        return res.status(400).json({ error: 'Cannot cancel - NFT already minted' });
      }
      next(error);
    }
  }

  /**
   * GET /api/marketplace/approval/:loanId
   * Obtener datos de aprobación
   */
  async getApprovalData(req, res, next) {
    try {
      const { loanId } = req.params;
      const approval = await marketplaceBridgeService.getApprovalData(loanId);

      res.json({
        success: true,
        data: approval
      });

    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/marketplace/status/:loanId
   * Obtener estado completo de tokenización
   */
  async getTokenizationStatus(req, res, next) {
    try {
      const { loanId } = req.params;

      // Obtener loan de LoanRegistry
      const loan = await loanService.readLoan(loanId);

      // Obtener datos de aprobación
      const approval = await marketplaceBridgeService.getApprovalData(loanId);

      const status = {
        loanId,
        isLocked: loan.isLocked || false,
        isTokenized: loan.avalancheTokenId && loan.avalancheTokenId !== '0',
        avalancheTokenId: loan.avalancheTokenId || '0',
        approval: approval.isApproved ? approval : null
      };

      res.json({
        success: true,
        data: status
      });

    } catch (error) {
      if (error.message.includes('does not exist')) {
        return res.status(404).json({ error: 'Loan not found' });
      }
      next(error);
    }
  }

  /**
   * GET /api/marketplace/approved
   * Listar todos los loans aprobados (pendientes de minteo)
   */
  async getApprovedLoans(req, res, next) {
    try {
      // Esto requeriría iterar sobre loans o usar eventos
      // Por ahora, retornamos un mensaje
      res.json({
        success: true,
        message: 'Use the relayer API at port 3001 for this endpoint',
        endpoint: 'GET http://localhost:3001/api/loans/approved'
      });

    } catch (error) {
      next(error);
    }
  }

  /**
 * POST /api/marketplace/set-token-id
 * Relayer establece el tokenId de Avalanche después de mintear el NFT
 * @body { privateKey, loanId, tokenId }
 */
  async setAvalancheTokenId(req, res, next) {
    try {
      const { privateKey, loanId, tokenId } = req.body;

      if (!privateKey || !loanId || !tokenId) {
        return res.status(400).json({ error: 'Private key, loanId and tokenId required' });
      }

      const result = await marketplaceBridgeService.setAvalancheTokenId(privateKey, loanId, tokenId);

      res.json({
        success: true,
        message: 'Avalanche token ID set successfully',
        data: result
      });
    } catch (error) {
      if (error.message.includes('Already minted')) {
        return res.status(400).json({ error: 'NFT already minted' });
      }
      if (error.message.includes('Loan not approved')) {
        return res.status(400).json({ error: 'Loan not approved or cancelled' });
      }
      next(error);
    }
  }

  /**
   * POST /api/marketplace/record-transfer
   * Relayer registra transferencia de ownership (compra/venta)
   * @body { privateKey, loanId, newOwnerAddress, salePrice }
   */
  async recordOwnershipTransfer(req, res, next) {
    try {
      const { privateKey, loanId, newOwnerAddress, salePrice } = req.body;

      if (!privateKey || !loanId || !newOwnerAddress || !salePrice) {
        return res.status(400).json({ error: 'All fields required' });
      }

      const result = await marketplaceBridgeService.recordOwnershipTransfer(privateKey, loanId, newOwnerAddress, salePrice);

      res.json({
        success: true,
        message: 'Ownership transfer recorded',
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/marketplace/record-payment
   * Relayer registra pago del borrower
   * @body { privateKey, loanId, amount }
   */
  async recordPayment(req, res, next) {
    try {
      const { privateKey, loanId, amount } = req.body;

      if (!privateKey || !loanId || !amount) {
        return res.status(400).json({ error: 'All fields required' });
      }

      const result = await marketplaceBridgeService.recordPayment(privateKey, loanId, amount);

      res.json({
        success: true,
        message: 'Payment recorded',
        data: result
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new MarketplaceController();