const { ethers } = require('ethers');
const BaseContractService = require('./BaseContractService');

class MarketplaceBridgeService extends BaseContractService {
  constructor() {
    super('MarketplaceBridge', 'MarketplaceBridge');
  }

  /**
   * ✅ Normalizar valor USD - SIEMPRE asume 2 decimales
   */
  normalizeUSD(value) {
    if (!value && value !== 0) return 0;

    let strValue = String(value).trim();

    if (!strValue.includes('.')) {
      strValue = strValue + '.00';
    }

    return parseFloat(strValue);
  }

  /**
   * ✅ Convertir USD normalizado a centavos
   */
  usdToCents(usd) {
    const normalized = this.normalizeUSD(usd);
    return Math.round(normalized * 100);
  }

  /**
   * ✅ Convertir centavos a USD con 2 decimales
   */
  centsToUSD(cents) {
    if (!cents) return "0.00";
    const dollars = Number(cents) / 100;
    return dollars.toFixed(2);
  }

  /**
   * Aprobar un loan para tokenización/venta
   * ✅ Acepta USD y lo convierte a centavos
   */
  async approveLoanForSale(privateKey, loanId, askingPriceUSD, modifiedInterestRate) {
    const contract = this.getContract(privateKey);

    // ✅ Convertir USD a centavos
    const priceInCents = this.usdToCents(askingPriceUSD);

    const tx = await contract.approveLoanForSale(
      loanId,
      BigInt(priceInCents),
      modifiedInterestRate
    );

    const receipt = await tx.wait();

    return {
      success: true,
      loanId,
      askingPrice: this.centsToUSD(priceInCents),
      modifiedInterestRate,
      txHash: receipt.hash,
      blockNumber: receipt.blockNumber,
      gasUsed: receipt.gasUsed.toString()
    };
  }

  async registerApprovalTxHash(privateKey, loanId, txHash) {
    const contract = this.getContract(privateKey);

    const txHashBytes32 = txHash.startsWith('0x') ? txHash : `0x${txHash}`;

    const tx = await contract.registerApprovalTxHash(loanId, txHashBytes32);
    const receipt = await tx.wait();

    return {
      success: true,
      loanId,
      registeredTxHash: txHash,
      txHash: receipt.hash,
      blockNumber: receipt.blockNumber,
      gasUsed: receipt.gasUsed.toString()
    };
  }

  async getLoanIdByTxHash(txHash) {
    const contract = this.getContractReadOnly();

    // Asegurarse formato correcto
    const txHashBytes32 = txHash.startsWith('0x') ? txHash : '0x' + txHash;

    const loanId = await contract.getLoanIdByTxHash(txHashBytes32);

    if (!loanId || loanId.trim() === '') {
      throw new Error('TxHash not found in registry');
    }

    return loanId;
  }

  async getApprovalDataByTxHash(txHash) {
    const contract = this.getContractReadOnly();
    const txHashBytes32 = txHash.startsWith('0x') ? txHash : '0x' + txHash;

    const [approval, loanId] = await contract.getApprovalDataByTxHash(txHashBytes32);

    return {
      loanId,
      isApproved: approval.isApproved,
      askingPrice: this.centsToUSD(approval.askingPrice),
      modifiedInterestRate: Number(approval.modifiedInterestRate),
      lenderAddress: approval.lenderAddress,
      approvalTimestamp: Number(approval.approvalTimestamp),
      isMinted: approval.isMinted,
      isCancelled: approval.isCancelled,
      approvalTxHash: txHash
    };
  }

  async cancelSaleListing(privateKey, loanId) {
    const contract = this.getContract(privateKey);
    const tx = await contract.cancelSaleListing(loanId);
    const receipt = await tx.wait();

    return {
      success: true,
      loanId,
      txHash: receipt.hash,
      blockNumber: receipt.blockNumber
    };
  }

  async getApprovalData(loanId) {
    const contract = this.getContractReadOnly();
    const approval = await contract.getApprovalData(loanId);

    let approvalTxHash = null;
    try {
      const filter = contract.filters.LoanApprovedForSale(loanId);
      const events = await contract.queryFilter(filter);
      if (events.length > 0) {
        approvalTxHash = events[events.length - 1].transactionHash;
      }
    } catch (error) {
      console.error('Error fetching approval event:', error);
    }

    return {
      isApproved: approval.isApproved,
      askingPrice: this.centsToUSD(approval.askingPrice), // ✅ Convertir a USD
      modifiedInterestRate: Number(approval.modifiedInterestRate),
      lenderAddress: approval.lenderAddress,
      approvalTimestamp: Number(approval.approvalTimestamp),
      isMinted: approval.isMinted,
      isCancelled: approval.isCancelled,
      approvalTxHash: approvalTxHash
    };
  }

  async canBeMinted(loanId) {
    const contract = this.getContractReadOnly();
    return await contract.canBeMinted(loanId);
  }

  async isLoanApprovedForSale(loanId) {
    const contract = this.getContractReadOnly();
    return await contract.isLoanApprovedForSale(loanId);
  }

  async getAvalancheTokenId(loanId) {
    const contract = this.getContractReadOnly();
    const tokenId = await contract.getAvalancheTokenId(loanId);
    return tokenId.toString();
  }

  async setAvalancheTokenId(privateKey, loanId, tokenId) {
    const contract = this.getContract(privateKey);
    const tx = await contract.setAvalancheTokenId(loanId, tokenId);
    const receipt = await tx.wait();

    return {
      success: true,
      loanId,
      tokenId: tokenId.toString(),
      txHash: receipt.hash,
      blockNumber: receipt.blockNumber,
      gasUsed: receipt.gasUsed.toString()
    };
  }

  async recordOwnershipTransfer(privateKey, loanId, newOwnerAddress, salePriceUSD) {
    const contract = this.getContract(privateKey);

    // ✅ Convertir USD a centavos
    const priceInCents = this.usdToCents(salePriceUSD);

    const tx = await contract.recordOwnershipTransfer(
      loanId,
      newOwnerAddress,
      BigInt(priceInCents)
    );
    const receipt = await tx.wait();

    return {
      success: true,
      loanId,
      newOwnerAddress,
      salePriceUSD: this.centsToUSD(priceInCents),
      salePriceCents: priceInCents.toString(),
      txHash: receipt.hash,
      blockNumber: receipt.blockNumber,
      gasUsed: receipt.gasUsed.toString()
    };
  }

  async recordPayment(privateKey, loanId, amountUSD) {
    const contract = this.getContract(privateKey);

    // ✅ Convertir USD a centavos
    const amountInCents = this.usdToCents(amountUSD);

    const tx = await contract.recordPayment(loanId, BigInt(amountInCents));
    const receipt = await tx.wait();

    return {
      success: true,
      loanId,
      amountUSD: this.centsToUSD(amountInCents),
      amountCents: amountInCents.toString(),
      txHash: receipt.hash,
      blockNumber: receipt.blockNumber,
      gasUsed: receipt.gasUsed.toString()
    };
  }
}

module.exports = new MarketplaceBridgeService();