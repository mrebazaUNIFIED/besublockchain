import BaseHandler from './BaseHandler.js';
import besuService from '../services/BesuService.js';
import avalancheService from '../services/AvalancheService.js';
import stateManager from '../services/StateManager.js';
import logger from '../utils/logger.js';
import { ethers } from 'ethers';

/**
 * Handle LoanApprovedForSale event from Besu
 * Flow: Besu loan approved → Mint NFT in Avalanche via bridge → Record token ID in Besu
 */
class LoanApprovedHandler extends BaseHandler {
  constructor() {
    super('LoanApprovedHandler');
  }

  async process(event) {
    this.validate(event);
    this.logStart(event);

    try {
      // Extraer campos importantes (incluyendo el txHash del evento de aprobación)
      const {
        loanId,
        lenderAddress,
        askingPrice,
        modifiedInterestRate,
        transactionHash   // ← Este viene del BesuListener
      } = event;

      if (!transactionHash) {
        throw new Error('Missing transactionHash in event data');
      }

      logger.info(`Processing loan approval`, {
        loanId,
        lender: lenderAddress,
        price: askingPrice?.toString(),
        rate: modifiedInterestRate?.toString(),
        approvalTxHash: transactionHash
      });

      // ───────────────────────────────────────────────────────────────
      // NUEVO: Registrar el txHash de la transacción de aprobación original
      // Esto resuelve el error "TxHash not found" en las consultas por hash
      const marketplaceBridge = besuService.getContract('marketplaceBridge');

      try {
        // Verificar si ya está registrado (idempotencia)
        const existingLoanId = await marketplaceBridge.getLoanIdByTxHash(transactionHash);
        if (existingLoanId && existingLoanId.trim() !== '') {
          if (existingLoanId === loanId) {
            logger.info('Approval txHash already registered (skipping)', {
              loanId,
              transactionHash
            });
          } else {
            logger.warn('TxHash mapped to different loan (possible inconsistency)', {
              transactionHash,
              expected: loanId,
              found: existingLoanId
            });
          }
        } else {
          // Registrar
          logger.info('Registering approval txHash in MarketplaceBridge', {
            loanId,
            transactionHash
          });

          const registerTx = await marketplaceBridge.registerApprovalTxHash(
            loanId,
            transactionHash,
            { gasLimit: 150000 } // operación simple → gas bajo
          );

          const registerReceipt = await registerTx.wait();

          logger.info('Approval txHash registered successfully', {
            loanId,
            transactionHash,
            registerTxHash: registerReceipt.hash,
            blockNumber: registerReceipt.blockNumber
          });
        }
      } catch (registerError) {
        // No bloquear el mint si falla el registro (puede reintentarse después)
        logger.warn('Failed to register approval txHash (non-blocking)', {
          loanId,
          transactionHash,
          error: registerError.shortMessage || registerError.message
        });
        // Opcional: podrías meterlo en una cola de reintentos aquí
      }
      // ───────────────────────────────────────────────────────────────

      // Check if already minted
      const existingTokenId = stateManager.getNFTForLoan(loanId);
      if (existingTokenId) {
        logger.warn('NFT already minted for this loan', {
          loanId,
          tokenId: existingTokenId
        });
        return {
          success: false,
          reason: 'Already minted',
          tokenId: existingTokenId
        };
      }

      // Step 1: Fetch loan data from Besu
      logger.info(`Fetching loan data from Besu`, { loanId });
      const loanRegistry = besuService.getContract('loanRegistry');
      const loanData = await loanRegistry.readLoan(loanId);

      logger.info(`Loan data fetched`, {
        loanId,
        borrower: loanData.BorrowerFullName,
        balance: loanData.CurrentPrincipalBal?.toString()
      });

      // Step 2: Generar mensaje para multi-sig (APPROVED)
      const timestamp = Math.floor(Date.now() / 1000);
      const nonce = stateManager.getNonce(loanId);
      const location = `${loanData.BorrowerCity || 'N/A'}, ${loanData.BorrowerState || 'N/A'}`;
      const status = "ForSale";

      logger.info('Marking loan as approved in Avalanche', { loanId });

      const approvalMessageHash = ethers.keccak256(
        ethers.solidityPacked(
          ['string', 'string', 'uint256', 'uint256'],
          ['APPROVED', loanId, timestamp, nonce]
        )
      );

      const approvalSignatures = await this.collectSignatures(approvalMessageHash);

      const bridgeReceiver = avalancheService.getContract('bridgeReceiver');

      const approvalTx = await bridgeReceiver.markLoanApprovedInBesu(
        loanId,
        timestamp,
        nonce,
        approvalSignatures,
        { gasLimit: 300000 }
      );

      await approvalTx.wait();
      logger.info('Loan marked as approved in Avalanche', { loanId });

      // Step 3: Generar mensaje para el minting
      const mintNonce = stateManager.getNonce(loanId);
      const mintTimestamp = Math.floor(Date.now() / 1000);

      const messageHash = ethers.keccak256(
        ethers.solidityPacked(
          ['string', 'string', 'address', 'uint256', 'uint256', 'uint256', 'string', 'string', 'uint256', 'uint256', 'uint256'],
          [
            'MINT',
            loanId,
            lenderAddress,
            loanData.CurrentPrincipalBal,
            loanData.ScheduledPayment,
            modifiedInterestRate,
            status,
            location,
            askingPrice,
            mintTimestamp,
            mintNonce
          ]
        )
      );

      logger.info('Collecting signatures for mint message', { messageHash, loanId });
      const signatures = await this.collectSignatures(messageHash);

      logger.info('Signatures collected for mint', { count: signatures.length, loanId });

      // Step 4: Mint via bridge
      logger.info(`Calling processLoanApproval in Avalanche`, {
        loanId,
        askingPrice: askingPrice.toString(),
        signaturesCount: signatures.length
      });

      const tx = await bridgeReceiver.processLoanApproval(
        loanId,
        lenderAddress,
        loanData.CurrentPrincipalBal,
        loanData.ScheduledPayment,
        modifiedInterestRate,
        status,
        location,
        askingPrice,
        mintTimestamp,
        mintNonce,
        signatures,
        { gasLimit: 500000 }
      );

      logger.info('Mint transaction sent', { txHash: tx.hash, loanId });
      const receipt = await tx.wait();

      // Step 5: Extraer tokenId del evento LoanMinted
      const mintEvent = receipt.logs.find(log => {
        try {
          const parsed = bridgeReceiver.interface.parseLog(log);
          return parsed?.name === 'LoanMinted';
        } catch {
          return false;
        }
      });

      let tokenId;
      if (mintEvent) {
        const decoded = bridgeReceiver.interface.parseLog(mintEvent);
        tokenId = decoded.args.tokenId.toString();
      }

      if (!tokenId) {
        throw new Error('Failed to extract tokenId from mint transaction');
      }

      logger.info(`NFT minted successfully`, {
        loanId,
        tokenId,
        avalancheTxHash: receipt.hash
      });

      // Step 6: Registrar tokenId en Besu
      try {
        logger.info(`Recording token ID in Besu`, { loanId, tokenId });
        const besuTx = await marketplaceBridge.setAvalancheTokenId(
          loanId,
          tokenId,
          { gasLimit: 300000 }
        );
        await besuTx.wait();
        logger.info(`Token ID recorded in Besu`, { loanId, tokenId });
      } catch (error) {
        logger.warn(`Failed to record token ID in Besu (non-critical)`, {
          loanId,
          tokenId,
          error: error.message
        });
      }

      // Step 7: Actualizar estado local
      stateManager.mapLoanToNFT(loanId, tokenId);
      stateManager.incrementMetric('nftsMinted');

      this.logSuccess(event, {
        loanId,
        tokenId,
        avalancheTx: receipt.hash
      });

      return {
        success: true,
        loanId,
        tokenId,
        avalancheTxHash: receipt.hash
      };

    } catch (error) {
      this.logError(event, error);
      stateManager.incrementMetric('errors');
      throw error;
    }
  }

  async collectSignatures(messageHash) {
    try {
      // Obtener las private keys de los validadores desde el .env
      const validatorKeys = [
        process.env.VALIDATOR_PK1,
        process.env.VALIDATOR_PK2,
        process.env.VALIDATOR_PK3
      ].filter(Boolean); // Filtrar valores undefined/null

      if (validatorKeys.length === 0) {
        throw new Error('No validator private keys configured in .env');
      }

      logger.info('Collecting signatures', {
        validatorCount: validatorKeys.length,
        messageHash
      });

      const signatures = [];

      for (let i = 0; i < validatorKeys.length; i++) {
        const pk = validatorKeys[i];
        const wallet = new ethers.Wallet(pk);
        const sig = await wallet.signMessage(ethers.getBytes(messageHash));

        logger.debug('Signature collected', {
          validator: i + 1,
          address: wallet.address,
          signature: sig
        });

        signatures.push(sig);
      }

      logger.info('All signatures collected successfully', {
        count: signatures.length
      });

      return signatures;

    } catch (error) {
      logger.error('Failed to collect signatures', {
        error: error.message,
        stack: error.stack
      });
      throw error;
    }
  }

  validate(event) {
    super.validate(event);

    if (!event.loanId) {
      throw new Error('Missing loan ID');
    }
    if (!event.lenderAddress) {
      throw new Error('Missing lender address');
    }
    if (!event.askingPrice) {
      throw new Error('Missing asking price');
    }

    return true;
  }
}

export default LoanApprovedHandler;