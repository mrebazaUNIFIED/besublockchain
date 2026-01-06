// services/ShareLoansService.js
const { ethers } = require('ethers');
const { provider, CONTRACTS, ABIs } = require('../config/blockchain');

class ShareLoansService {
  constructor() {
    this.contractAddress = CONTRACTS.ShareLoans;
    this.abi = ABIs.ShareLoans;
  }

  getContract(privateKey) {
    const wallet = new ethers.Wallet(privateKey, provider);
    return new ethers.Contract(this.contractAddress, this.abi, wallet);
  }

  getContractReadOnly() {
    return new ethers.Contract(this.contractAddress, this.abi, provider);
  }

  /**
   * Crear un share asset
   */
  async createShareAsset(privateKey, key, ownerUserId, loanId, description, sharedWithAddresses, sharedWithUserIds) {
    const contract = this.getContract(privateKey);
    const tx = await contract.createShareAsset(
      key,
      ownerUserId,
      loanId,
      description,
      sharedWithAddresses,
      sharedWithUserIds
    );
    const receipt = await tx.wait();

    // Parsear eventos
    const events = receipt.logs
      .map(log => {
        try {
          return contract.interface.parseLog(log);
        } catch (e) {
          return null;
        }
      })
      .filter(event => event !== null);

    return {
      success: true,
      txHash: receipt.hash,
      blockNumber: receipt.blockNumber,
      gasUsed: receipt.gasUsed.toString(),
      events: events.map(e => ({ name: e.name, args: e.args }))
    };
  }

  /**
   * Actualizar cuentas con acceso a un share
   */
  async updateShareAssetAccounts(privateKey, key, newSharedWithAddresses, newSharedWithUserIds) {
    const contract = this.getContract(privateKey);
    const tx = await contract.updateShareAssetAccounts(
      key,
      newSharedWithAddresses,
      newSharedWithUserIds
    );
    const receipt = await tx.wait();

    // Parsear eventos
    const events = receipt.logs
      .map(log => {
        try {
          return contract.interface.parseLog(log);
        } catch (e) {
          return null;
        }
      })
      .filter(event => event !== null);

    return {
      success: true,
      txHash: receipt.hash,
      blockNumber: receipt.blockNumber,
      gasUsed: receipt.gasUsed.toString(),
      events: events.map(e => ({ name: e.name, args: e.args }))
    };
  }

  /**
   * Deshabilitar un share
   */
  async disableShareAsset(privateKey, key) {
    const contract = this.getContract(privateKey);
    const tx = await contract.disableShareAsset(key);
    const receipt = await tx.wait();

    // Parsear evento
    const event = receipt.logs.find(log => {
      try {
        const parsed = contract.interface.parseLog(log);
        return parsed && parsed.name === 'ShareDisabled';
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
   * Habilitar un share
   */
  async enableShareAsset(privateKey, key) {
    const contract = this.getContract(privateKey);
    const tx = await contract.enableShareAsset(key);
    const receipt = await tx.wait();

    // Parsear evento
    const event = receipt.logs.find(log => {
      try {
        const parsed = contract.interface.parseLog(log);
        return parsed && parsed.name === 'ShareEnabled';
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
   * Leer un share asset
   */
  async readShareAsset(key) {
    const contract = this.getContractReadOnly();
    const share = await contract.readShareAsset(key);

    return {
      key: share.key,
      ownerAddress: share.ownerAddress,
      ownerUserId: share.ownerUserId,
      loanId: share.loanId,
      description: share.description,
      sharedWith: share.sharedWith,
      sharedWithUserIds: share.sharedWithUserIds,
      isActive: share.isActive,
      createdAt: new Date(Number(share.createdAt) * 1000),
      updatedAt: new Date(Number(share.updatedAt) * 1000)
    };
  }

  /**
   * Verificar acceso de usuario
   */
  async checkUserAccess(key, userAddress) {
    const contract = this.getContractReadOnly();
    const [hasAccess, reason] = await contract.checkUserAccess(key, userAddress);

    return {
      hasAccess,
      reason
    };
  }

  /**
   * Obtener shares creados por un usuario
   */
  async querySharedByUser(userAddress) {
    const contract = this.getContractReadOnly();
    const shares = await contract.querySharedByUser(userAddress);

    return shares.map(share => ({
      key: share.key,
      ownerAddress: share.ownerAddress,
      ownerUserId: share.ownerUserId,
      loanId: share.loanId,
      description: share.description,
      sharedWith: share.sharedWith,
      sharedWithUserIds: share.sharedWithUserIds,
      isActive: share.isActive,
      createdAt: new Date(Number(share.createdAt) * 1000),
      updatedAt: new Date(Number(share.updatedAt) * 1000)
    }));
  }

  /**
   * Obtener shares compartidos con un usuario
   */
  async querySharedWithMe(userAddress) {
    const contract = this.getContractReadOnly();
    const shares = await contract.querySharedWithMe(userAddress);

    return shares.map(share => ({
      key: share.key,
      ownerAddress: share.ownerAddress,
      ownerUserId: share.ownerUserId,
      loanId: share.loanId,
      description: share.description,
      sharedWith: share.sharedWith,
      sharedWithUserIds: share.sharedWithUserIds,
      isActive: share.isActive,
      createdAt: new Date(Number(share.createdAt) * 1000),
      updatedAt: new Date(Number(share.updatedAt) * 1000)
    }));
  }

  /**
   * Obtener todos los shares (admin)
   */
  async queryAllShareAssets() {
    const contract = this.getContractReadOnly();
    const shares = await contract.queryAllShareAssets();

    return shares.map(share => ({
      key: share.key,
      ownerAddress: share.ownerAddress,
      ownerUserId: share.ownerUserId,
      loanId: share.loanId,
      description: share.description,
      sharedWith: share.sharedWith,
      sharedWithUserIds: share.sharedWithUserIds,
      isActive: share.isActive,
      createdAt: new Date(Number(share.createdAt) * 1000),
      updatedAt: new Date(Number(share.updatedAt) * 1000)
    }));
  }

  /**
   * Verificar si un share existe
   */
  async shareAssetExists(key) {
    const contract = this.getContractReadOnly();
    return await contract.shareAssetExists(key);
  }
}

module.exports = new ShareLoansService();