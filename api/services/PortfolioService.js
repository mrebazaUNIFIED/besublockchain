// services/PortfolioService.js
const { ethers } = require('ethers');
const { provider, CONTRACTS, ABIs } = require('../config/blockchain');

class PortfolioService {
  constructor() {
    this.contractAddress = CONTRACTS.Portfolio;
    this.abi = ABIs.Portfolio;
  }

  getContract(privateKey) {
    const wallet = new ethers.Wallet(privateKey, provider);
    return new ethers.Contract(this.contractAddress, this.abi, wallet);
  }

  getContractReadOnly() {
    return new ethers.Contract(this.contractAddress, this.abi, provider);
  }

  /**
   * Crear certificado de portafolio
   */
  async createPortfolioCertificate(privateKey, userId, userAddress, loanIds, totalPrincipal) {
    const contract = this.getContract(privateKey);
    const tx = await contract.createPortfolioCertificate(
      userId,
      userAddress,
      loanIds,
      totalPrincipal
    );
    const receipt = await tx.wait();

    // Parsear evento
    const event = receipt.logs.find(log => {
      try {
        const parsed = contract.interface.parseLog(log);
        return parsed && parsed.name === 'CertificateCreated';
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
   * Actualizar certificado de portafolio
   */
  async updatePortfolioCertificate(privateKey, userId, loanIds, totalPrincipal) {
    const contract = this.getContract(privateKey);
    const tx = await contract.updatePortfolioCertificate(
      userId,
      loanIds,
      totalPrincipal
    );
    const receipt = await tx.wait();

    // Parsear evento
    const event = receipt.logs.find(log => {
      try {
        const parsed = contract.interface.parseLog(log);
        return parsed && parsed.name === 'CertificateUpdated';
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
   * Obtener certificado por userId
   */
  async getPortfolioCertificate(userId) {
    const contract = this.getContractReadOnly();
    const cert = await contract.getPortfolioCertificate(userId);

    return {
      id: cert.id,
      userId: cert.userId,
      userAddress: cert.userAddress,
      txId: cert.txId,
      loanIds: cert.loanIds,
      loansCount: Number(cert.loansCount),
      totalPrincipal: cert.totalPrincipal.toString(),
      createdAt: new Date(Number(cert.createdAt) * 1000),
      lastUpdatedAt: new Date(Number(cert.lastUpdatedAt) * 1000),
      version: Number(cert.version),
      exists: cert.exists
    };
  }

  /**
   * Obtener certificado por address
   */
  async getPortfolioCertificateByAddress(userAddress) {
    const contract = this.getContractReadOnly();
    const cert = await contract.getPortfolioCertificateByAddress(userAddress);

    return {
      id: cert.id,
      userId: cert.userId,
      userAddress: cert.userAddress,
      txId: cert.txId,
      loanIds: cert.loanIds,
      loansCount: Number(cert.loansCount),
      totalPrincipal: cert.totalPrincipal.toString(),
      createdAt: new Date(Number(cert.createdAt) * 1000),
      lastUpdatedAt: new Date(Number(cert.lastUpdatedAt) * 1000),
      version: Number(cert.version),
      exists: cert.exists
    };
  }

  /**
   * Obtener solo el TxId de un certificado
   */
  async getPortfolioCertificateTxId(userId) {
    const contract = this.getContractReadOnly();
    return await contract.getPortfolioCertificateTxId(userId);
  }

  /**
   * Obtener todos los certificados
   */
  async getAllCertificates() {
    const contract = this.getContractReadOnly();
    const certs = await contract.getAllCertificates();

    return certs.map(cert => ({
      id: cert.id,
      userId: cert.userId,
      userAddress: cert.userAddress,
      txId: cert.txId,
      loanIds: cert.loanIds,
      loansCount: Number(cert.loansCount),
      totalPrincipal: cert.totalPrincipal.toString(),
      createdAt: new Date(Number(cert.createdAt) * 1000),
      lastUpdatedAt: new Date(Number(cert.lastUpdatedAt) * 1000),
      version: Number(cert.version),
      exists: cert.exists
    }));
  }

  /**
   * Verificar si existe certificado
   */
  async portfolioCertificateExists(userId) {
    const contract = this.getContractReadOnly();
    return await contract.portfolioCertificateExists(userId);
  }

  /**
   * Obtener estadísticas de certificado
   */
  async getCertificateStats(userId) {
    const contract = this.getContractReadOnly();
    const stats = await contract.getCertificateStats(userId);

    return {
      loansCount: Number(stats.loansCount),
      totalPrincipal: stats.totalPrincipal.toString(),
      version: Number(stats.version),
      lastUpdated: new Date(Number(stats.lastUpdated) * 1000)
    };
  }
}

module.exports = new PortfolioService();