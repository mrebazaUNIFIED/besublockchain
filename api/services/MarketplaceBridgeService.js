const { ethers } = require('ethers');
const BaseContractService = require('./BaseContractService');

class MarketplaceBridgeService extends BaseContractService {
  constructor() {
    super('MarketplaceBridge', 'MarketplaceBridge');
  }

  /**
   * Aprobar un loan para tokenización/venta
   */
  async approveLoanForSale(privateKey, loanId, askingPrice, modifiedInterestRate) {
    const contract = this.getContract(privateKey);

    // Convertir askingPrice a wei si es necesario
    const priceInWei = typeof askingPrice === 'string'
      ? ethers.parseEther(askingPrice)
      : askingPrice;

    const tx = await contract.approveLoanForSale(
      loanId,
      priceInWei,
      modifiedInterestRate
    );

    const receipt = await tx.wait();

    // Buscar el evento LoanApprovedForSale
    const event = receipt.logs.find(log => {
      try {
        const parsed = contract.interface.parseLog(log);
        return parsed && parsed.name === 'LoanApprovedForSale';
      } catch (e) {
        return false;
      }
    });

    return {
      success: true,
      loanId,
      askingPrice: ethers.formatEther(priceInWei),
      modifiedInterestRate,
      txHash: receipt.hash,
      blockNumber: receipt.blockNumber,
      gasUsed: receipt.gasUsed.toString()
    };
  }

  /**
   * Cancelar una aprobación de venta
   */
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

  /**
   * Obtener datos de aprobación de un loan
   */
  async getApprovalData(loanId) {
    const contract = this.getContractReadOnly();
    const approval = await contract.getApprovalData(loanId);

    return {
      isApproved: approval.isApproved,
      askingPrice: ethers.formatEther(approval.askingPrice),
      modifiedInterestRate: Number(approval.modifiedInterestRate),
      lenderAddress: approval.lenderAddress,
      approvalTimestamp: Number(approval.approvalTimestamp),
      isMinted: approval.isMinted,
      isCancelled: approval.isCancelled
    };
  }

  /**
   * Verificar si un loan puede ser minteado
   */
  async canBeMinted(loanId) {
    const contract = this.getContractReadOnly();
    return await contract.canBeMinted(loanId);
  }

  /**
   * Verificar si un loan está aprobado para venta
   */
  async isLoanApprovedForSale(loanId) {
    const contract = this.getContractReadOnly();
    return await contract.isLoanApprovedForSale(loanId);
  }

  /**
   * Obtener el tokenId de Avalanche para un loan
   */
  async getAvalancheTokenId(loanId) {
    const contract = this.getContractReadOnly();
    const tokenId = await contract.getAvalancheTokenId(loanId);
    return tokenId.toString();
  }

  async setAvalancheTokenId(privateKey, loanId, tokenId) {
    const contract = this.getContract(privateKey);

    // tokenId ya es uint256, no necesita conversión
    const tx = await contract.setAvalancheTokenId(loanId, tokenId);

    const receipt = await tx.wait();

    // Buscar evento AvalancheTokenIdSet (opcional, para logging)
    const event = receipt.logs.find(log => {
      try {
        const parsed = contract.interface.parseLog(log);
        return parsed && parsed.name === 'AvalancheTokenIdSet';
      } catch (e) {
        return false;
      }
    });

    return {
      success: true,
      loanId,
      tokenId: tokenId.toString(),
      txHash: receipt.hash,
      blockNumber: receipt.blockNumber,
      gasUsed: receipt.gasUsed.toString()
    };
  }

  async recordOwnershipTransfer(privateKey, loanId, newOwnerAddress, salePrice) {
    const contract = this.getContract(privateKey);

    const priceInWei = typeof salePrice === 'string'
      ? ethers.parseEther(salePrice)
      : salePrice;

    const tx = await contract.recordOwnershipTransfer(loanId, newOwnerAddress, priceInWei);

    const receipt = await tx.wait();

    return {
      success: true,
      loanId,
      newOwnerAddress,
      salePrice: ethers.formatEther(priceInWei),
      txHash: receipt.hash,
      blockNumber: receipt.blockNumber,
      gasUsed: receipt.gasUsed.toString()
    };
  }

  async recordPayment(privateKey, loanId, amount) {
    const contract = this.getContract(privateKey);

    const amountInWei = typeof amount === 'string'
      ? ethers.parseEther(amount)
      : amount;

    const tx = await contract.recordPayment(loanId, amountInWei);

    const receipt = await tx.wait();

    return {
      success: true,
      loanId,
      amount: ethers.formatEther(amountInWei),
      txHash: receipt.hash,
      blockNumber: receipt.blockNumber,
      gasUsed: receipt.gasUsed.toString()
    };
  }
}

module.exports = new MarketplaceBridgeService();