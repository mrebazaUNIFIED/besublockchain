// services/USFCIService.js
const { ethers } = require('ethers');
const { provider, CONTRACTS, ABIs } = require('../config/blockchain');

class USFCIService {
  constructor() {
    this.contractAddress = CONTRACTS.USFCI;
    this.abi = ABIs.USFCI;
  }

  getContract(privateKey) {
    const wallet = new ethers.Wallet(privateKey, provider);
    return new ethers.Contract(this.contractAddress, this.abi, wallet);
  }

  getContractReadOnly() {
    return new ethers.Contract(this.contractAddress, this.abi, provider);
  }

  /**
   * Inicializar ledger (solo admin)
   */
  async initLedger(privateKey) {
    const contract = this.getContract(privateKey);
    const tx = await contract.initLedger();
    const receipt = await tx.wait();

    return {
      success: true,
      txHash: receipt.hash,
      blockNumber: receipt.blockNumber,
      gasUsed: receipt.gasUsed.toString()
    };
  }

  /**
   * Registrar wallet
   */
  async registerWallet(privateKey, mspId, userId, accountType) {
    const contract = this.getContract(privateKey);
    const tx = await contract.registerWallet(mspId, userId, accountType);
    const receipt = await tx.wait();

    // Parsear evento
    const event = receipt.logs.find(log => {
      try {
        const parsed = contract.interface.parseLog(log);
        return parsed && parsed.name === 'WalletRegistered';
      } catch (e) {
        return false;
      }
    });

    return {
      success: true,
      walletAddress: receipt.from,
      txHash: receipt.hash,
      blockNumber: receipt.blockNumber,
      gasUsed: receipt.gasUsed.toString(),
      event: event ? contract.interface.parseLog(event).args : null
    };
  }

  /**
   * Mintear tokens (requiere MINTER_ROLE)
   */
  async mintTokens(privateKey, walletAddress, amount, reserveProof) {
    const contract = this.getContract(privateKey);
    const tx = await contract.mintTokens(walletAddress, amount, reserveProof);
    const receipt = await tx.wait();

    // Parsear evento
    const event = receipt.logs.find(log => {
      try {
        const parsed = contract.interface.parseLog(log);
        return parsed && parsed.name === 'TokensMinted';
      } catch (e) {
        return false;
      }
    });

    return {
      success: true,
      txHash: receipt.hash,
      blockNumber: receipt.blockNumber,
      gasUsed: receipt.gasUsed.toString(),
      event: event ? contract.interface.parseLog(event).args : null
    };
  }

  /**
   * Transferir tokens
   */
  async transfer(privateKey, recipient, amount) {
    const contract = this.getContract(privateKey);
    const tx = await contract.transfer(recipient, amount);
    const receipt = await tx.wait();

    // Parsear evento
    const event = receipt.logs.find(log => {
      try {
        const parsed = contract.interface.parseLog(log);
        return parsed && parsed.name === 'TokensTransferred';
      } catch (e) {
        return false;
      }
    });

    return {
      success: true,
      txHash: receipt.hash,
      blockNumber: receipt.blockNumber,
      gasUsed: receipt.gasUsed.toString(),
      event: event ? contract.interface.parseLog(event).args : null
    };
  }

  /**
   * Actualizar estado de compliance (requiere COMPLIANCE_ROLE)
   */
  async updateComplianceStatus(privateKey, walletAddress, kycStatus, riskScore) {
    const contract = this.getContract(privateKey);
    const tx = await contract.updateComplianceStatus(walletAddress, kycStatus, riskScore);
    const receipt = await tx.wait();

    // Parsear evento
    const event = receipt.logs.find(log => {
      try {
        const parsed = contract.interface.parseLog(log);
        return parsed && parsed.name === 'ComplianceUpdated';
      } catch (e) {
        return false;
      }
    });

    return {
      success: true,
      txHash: receipt.hash,
      blockNumber: receipt.blockNumber,
      gasUsed: receipt.gasUsed.toString(),
      event: event ? contract.interface.parseLog(event).args : null
    };
  }

  /**
   * Obtener detalles de cuenta
   */
  async getAccountDetails(walletAddress) {
    const contract = this.getContractReadOnly();
    const account = await contract.getAccountDetails(walletAddress);

    return {
      mspId: account.mspId,
      userId: account.userId,
      frozenBalance: account.frozenBalance.toString(),
      lastActivity: new Date(Number(account.lastActivity) * 1000),
      kycStatus: account.kycStatus,
      riskScore: account.riskScore,
      accountType: account.accountType,
      createdAt: new Date(Number(account.createdAt) * 1000),
      exists: account.exists
    };
  }

  /**
   * Obtener balance
   */
  async getBalance(walletAddress) {
    const contract = this.getContractReadOnly();
    const balance = await contract.getBalance(walletAddress);
    return balance.toString();
  }

  /**
   * Obtener configuración del sistema
   */
  async getSystemConfig() {
    const contract = this.getContractReadOnly();
    const config = await contract.systemConfig();

    return {
      tokenName: config.tokenName,
      tokenSymbol: config.tokenSymbol,
      maxTransactionAmount: config.maxTransactionAmount.toString(),
      maxDailyTransactionAmount: config.maxDailyTransactionAmount.toString(),
      dailyReserveReportRequired: config.dailyReserveReportRequired,
      reserveBank: config.reserveBank,
      complianceEnabled: config.complianceEnabled
    };
  }

  /**
   * Pausar contrato (solo admin)
   */
  async pause(privateKey) {
    const contract = this.getContract(privateKey);
    const tx = await contract.pause();
    const receipt = await tx.wait();

    return {
      success: true,
      txHash: receipt.hash,
      blockNumber: receipt.blockNumber,
      gasUsed: receipt.gasUsed.toString()
    };
  }

  /**
   * Despausar contrato (solo admin)
   */
  async unpause(privateKey) {
    const contract = this.getContract(privateKey);
    const tx = await contract.unpause();
    const receipt = await tx.wait();

    return {
      success: true,
      txHash: receipt.hash,
      blockNumber: receipt.blockNumber,
      gasUsed: receipt.gasUsed.toString()
    };
  }
}

module.exports = new USFCIService();