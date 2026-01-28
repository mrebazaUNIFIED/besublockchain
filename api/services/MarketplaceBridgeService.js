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

    // ✅ CAMBIO: BigInt en lugar de parseEther
    const priceValue = typeof askingPrice === 'string'
      ? BigInt(askingPrice)
      : BigInt(askingPrice);

    const tx = await contract.approveLoanForSale(
      loanId,
      priceValue,
      modifiedInterestRate
    );

    const receipt = await tx.wait();

    return {
      success: true,
      loanId,
      // ✅ CAMBIO: .toString() en lugar de formatEther
      askingPrice: priceValue.toString(),
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

    const txHashBytes32 = txHash.startsWith('0x') ? txHash : `0x${txHash}`;
    const loanId = await contract.getLoanIdByTxHash(txHashBytes32);

    if (!loanId || loanId === '') {
      throw new Error('TxHash not found');
    }

    return loanId;
  }

  async getApprovalDataByTxHash(txHash) {
    const contract = this.getContractReadOnly();

    const txHashBytes32 = txHash.startsWith('0x') ? txHash : `0x${txHash}`;
    const [approval, loanId] = await contract.getApprovalDataByTxHash(txHashBytes32);

    const centsToUSD = (cents) => {
      if (!cents) return "0.00";
      return (Number(cents) / 100).toFixed(2);
    };

    return {
      loanId,
      isApproved: approval.isApproved,
      askingPrice: centsToUSD(approval.askingPrice),
      modifiedInterestRate: Number(approval.modifiedInterestRate),
      lenderAddress: approval.lenderAddress,
      approvalTimestamp: Number(approval.approvalTimestamp),
      isMinted: approval.isMinted,
      isCancelled: approval.isCancelled,
      txHash: txHash
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

    return {
      isApproved: approval.isApproved,
      // ✅ CAMBIO: .toString() en lugar de formatEther
      askingPrice: approval.askingPrice.toString(),
      modifiedInterestRate: Number(approval.modifiedInterestRate),
      lenderAddress: approval.lenderAddress,
      approvalTimestamp: Number(approval.approvalTimestamp),
      isMinted: approval.isMinted,
      isCancelled: approval.isCancelled
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

  async recordOwnershipTransfer(privateKey, loanId, newOwnerAddress, salePrice) {
    const contract = this.getContract(privateKey);

    // ✅ CAMBIO: BigInt en lugar de parseEther
    const priceValue = typeof salePrice === 'string'
      ? BigInt(salePrice)
      : BigInt(salePrice);

    const tx = await contract.recordOwnershipTransfer(loanId, newOwnerAddress, priceValue);
    const receipt = await tx.wait();

    return {
      success: true,
      loanId,
      newOwnerAddress,
      // ✅ CAMBIO: .toString() en lugar de formatEther
      salePrice: priceValue.toString(),
      txHash: receipt.hash,
      blockNumber: receipt.blockNumber,
      gasUsed: receipt.gasUsed.toString()
    };
  }

  async recordPayment(privateKey, loanId, amount) {
    const contract = this.getContract(privateKey);

    // ✅ CAMBIO: BigInt en lugar de parseEther
    const amountValue = typeof amount === 'string'
      ? BigInt(amount)
      : BigInt(amount);

    const tx = await contract.recordPayment(loanId, amountValue);
    const receipt = await tx.wait();

    return {
      success: true,
      loanId,
      // ✅ CAMBIO: .toString() en lugar de formatEther
      amount: amountValue.toString(),
      txHash: receipt.hash,
      blockNumber: receipt.blockNumber,
      gasUsed: receipt.gasUsed.toString()
    };
  }
}

module.exports = new MarketplaceBridgeService();