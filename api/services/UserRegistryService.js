const { ethers } = require('ethers');
const { provider, CONTRACTS, ABIs } = require('../config/blockchain');
const fs = require('fs');
const path = require('path');

class UserRegistryService {
  constructor() {
    this.contractAddress = CONTRACTS.UserRegistry;
    this.abi = ABIs.UserRegistry;
  }

  getContract(privateKey) {
    const wallet = new ethers.Wallet(privateKey, provider);
    return new ethers.Contract(this.contractAddress, this.abi, wallet);
  }

  getContractReadOnly() {
    return new ethers.Contract(this.contractAddress, this.abi, provider);
  }

  /**
   * Registrar un usuario, generando wallet si no se proporciona
   * @param {string} funderPrivateKey - Private key del funder para financiar (opcional)
   * @param {object} userData - Datos: userId, name, organization, role, walletAddress (opcional), initialBalance (opcional)
   */
  async registerUser(funderPrivateKey, userData) {
    let wallet;
    let generated = false;

    if (!userData.walletAddress) {
      // Generar nueva wallet si no se proporciona
      wallet = ethers.Wallet.createRandom();
      generated = true;
      userData.walletAddress = wallet.address;
      console.log(`Wallet generada: ${wallet.address}`);
    } else {
      wallet = new ethers.Wallet(userData.privateKey || ''); // Si se proporciona, pero mejor no manejar private keys aquí
    }

    // Financiar si se pide initialBalance y hay funder
    if (userData.initialBalance && funderPrivateKey) {
      const funderWallet = new ethers.Wallet(funderPrivateKey, provider);
      const fundTx = await funderWallet.sendTransaction({
        to: userData.walletAddress,
        value: ethers.parseEther(userData.initialBalance.toString())
      });
      await fundTx.wait();
      console.log(`Financiado con ${userData.initialBalance} ETH`);
    }

    // Registrar en contrato (usa owner private key, asume que el caller es owner)
    const contract = this.getContract(funderPrivateKey || process.env.OWNER_PRIVATE_KEY); // Usa funder u owner key
    const tx = await contract.registerUser(
      userData.walletAddress,
      userData.userId,
      userData.name,
      userData.organization,
      userData.role
    );
    const receipt = await tx.wait();

    // Parsear evento
    const event = receipt.logs.find(log => {
      try {
        const parsed = contract.interface.parseLog(log);
        return parsed && parsed.name === 'UserRegistered';
      } catch (e) {
        return false;
      }
    });

    // Guardar private key temporalmente (SOLO DEV, no en prod)
    if (generated) {
      const userDataDir = path.join(__dirname, '..', '..', 'user-data');
      if (!fs.existsSync(userDataDir)) {
        fs.mkdirSync(userDataDir, { recursive: true });
      }
      const usersFile = path.join(userDataDir, 'users.json');
      let existingUsers = {};
      if (fs.existsSync(usersFile)) {
        existingUsers = JSON.parse(fs.readFileSync(usersFile));
      }
      existingUsers[userData.userId] = {
        ...userData,
        privateKey: wallet.privateKey,
        mnemonic: wallet.mnemonic.phrase
      };
      fs.writeFileSync(usersFile, JSON.stringify(existingUsers, null, 2));
    }

    return {
      success: true,
      walletAddress: userData.walletAddress,
      userId: userData.userId,
      txHash: receipt.hash,
      blockNumber: receipt.blockNumber,
      gasUsed: receipt.gasUsed.toString(),
      event: event ? contract.interface.parseLog(event).args : null,
      generatedWallet: generated,
      privateKey: generated ? wallet.privateKey : undefined // ⚠️ Solo devuelve para test, elimina en prod
    };
  }

  /**
   * Actualizar un usuario - Usa los nombres EXACTOS del contrato
   */
  async updateUser(privateKey, walletAddress, updateData) {
    const contract = this.getContract(privateKey);

    const tx = await contract.updateUser(
      walletAddress,
      updateData.name,
      updateData.role
    );

    const receipt = await tx.wait();

    // Parsear evento
    const event = receipt.logs.find(log => {
      try {
        const parsed = contract.interface.parseLog(log);
        return parsed && parsed.name === 'UserUpdated';
      } catch (e) {
        return false;
      }
    });

    return {
      success: true,
      walletAddress,
      txHash: receipt.hash,
      blockNumber: receipt.blockNumber,
      gasUsed: receipt.gasUsed.toString(),
      event: event ? contract.interface.parseLog(event).args : null
    };
  }

  /**
   * Desactivar un usuario
   */
  async deactivateUser(privateKey, walletAddress) {
    const contract = this.getContract(privateKey);
    const tx = await contract.deactivateUser(walletAddress);
    const receipt = await tx.wait();

    return {
      success: true,
      walletAddress,
      txHash: receipt.hash,
      blockNumber: receipt.blockNumber,
      gasUsed: receipt.gasUsed.toString()
    };
  }

  /**
   * Reactivar un usuario
   */
  async reactivateUser(privateKey, walletAddress) {
    const contract = this.getContract(privateKey);
    const tx = await contract.reactivateUser(walletAddress);
    const receipt = await tx.wait();

    return {
      success: true,
      walletAddress,
      txHash: receipt.hash,
      blockNumber: receipt.blockNumber,
      gasUsed: receipt.gasUsed.toString()
    };
  }

  /**
   * Leer un usuario por walletAddress - Devuelve con nombres del contrato
   */
  async getUser(walletAddress) {
    const contract = this.getContractReadOnly();
    const user = await contract.getUser(walletAddress);

    return {
      userId: user.userId,
      name: user.name,
      organization: user.organization,
      role: user.role,
      walletAddress: user.walletAddress,
      registeredAt: new Date(Number(user.registeredAt) * 1000),
      isActive: user.isActive
    };
  }

  /**
   * Leer un usuario por userId
   */
  async getUserByUserId(userId) {
    const contract = this.getContractReadOnly();
    const user = await contract.getUserByUserId(userId);

    return {
      userId: user.userId,
      name: user.name,
      organization: user.organization,
      role: user.role,
      walletAddress: user.walletAddress,
      registeredAt: new Date(Number(user.registeredAt) * 1000),
      isActive: user.isActive
    };
  }

  /**
   * Obtener usuarios por organización con paginación
   */
  async getUsersByOrganization(organization, start = 0, limit = 10) {
    const contract = this.getContractReadOnly();
    const users = await contract.getUsersByOrganization(organization, start, limit);

    return users.map(user => ({
      userId: user.userId,
      name: user.name,
      organization: user.organization,
      role: user.role,
      walletAddress: user.walletAddress,
      registeredAt: new Date(Number(user.registeredAt) * 1000),
      isActive: user.isActive
    }));
  }

  /**
   * Verificar si usuario está activo
   */
  async isUserActive(walletAddress) {
    const contract = this.getContractReadOnly();
    return await contract.isUserActive(walletAddress);
  }

  /**
   * Verificar si usuario está registrado
   */
  async userRegistered(walletAddress) {
    const contract = this.getContractReadOnly();
    return await contract.userRegistered(walletAddress);
  }

  /**
   * Obtener total de usuarios
   */
  async getTotalUsers() {
    const contract = this.getContractReadOnly();
    return Number(await contract.getTotalUsers());
  }

  /**
   * Obtener conteo de usuarios activos
   */
  async getActiveUsersCount() {
    const contract = this.getContractReadOnly();
    return Number(await contract.getActiveUsersCount());
  }
}

module.exports = new UserRegistryService();