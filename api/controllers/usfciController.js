// controllers/usfciController.js
const usfciService = require('../services/USFCIService');

// Función helper para convertir BigInt a string
const serializeBigInt = (obj) => {
  return JSON.parse(JSON.stringify(obj, (key, value) =>
    typeof value === 'bigint' ? value.toString() : value
  ));
};

// ==================== ADMIN ====================

const initLedger = async (req, res, next) => {
  try {
    const { privateKey } = req.body;
    
    if (!privateKey) {
      return res.status(400).json({ 
        success: false, 
        error: 'Private key is required' 
      });
    }
    
    const result = await usfciService.initLedger(privateKey);
    const serializedResult = serializeBigInt(result);
    
    res.json({ success: true, data: serializedResult });
  } catch (error) {
    next(error);
  }
};

const pause = async (req, res, next) => {
  try {
    const { privateKey } = req.body;
    
    if (!privateKey) {
      return res.status(400).json({ 
        success: false, 
        error: 'Private key is required' 
      });
    }
    
    const result = await usfciService.pause(privateKey);
    const serializedResult = serializeBigInt(result);
    
    res.json({ success: true, data: serializedResult });
  } catch (error) {
    next(error);
  }
};

const unpause = async (req, res, next) => {
  try {
    const { privateKey } = req.body;
    
    if (!privateKey) {
      return res.status(400).json({ 
        success: false, 
        error: 'Private key is required' 
      });
    }
    
    const result = await usfciService.unpause(privateKey);
    const serializedResult = serializeBigInt(result);
    
    res.json({ success: true, data: serializedResult });
  } catch (error) {
    next(error);
  }
};

const getSystemConfig = async (req, res, next) => {
  try {
    const config = await usfciService.getSystemConfig();
    const serializedConfig = serializeBigInt(config);
    
    res.json({ success: true, data: serializedConfig });
  } catch (error) {
    next(error);
  }
};

// ==================== WALLET ====================

const registerWallet = async (req, res, next) => {
  try {
    const { privateKey, mspId, userId, accountType } = req.body;
    
    if (!privateKey || !mspId || !userId || !accountType) {
      return res.status(400).json({ 
        success: false, 
        error: 'Private key, mspId, userId and accountType are required' 
      });
    }
    
    const result = await usfciService.registerWallet(privateKey, mspId, userId, accountType);
    const serializedResult = serializeBigInt(result);
    
    res.status(201).json({ success: true, data: serializedResult });
  } catch (error) {
    next(error);
  }
};

const getAccountDetails = async (req, res, next) => {
  try {
    const { walletAddress } = req.params;
    
    const account = await usfciService.getAccountDetails(walletAddress);
    const serializedAccount = serializeBigInt(account);
    
    res.json({ success: true, data: serializedAccount });
  } catch (error) {
    next(error);
  }
};

const getBalance = async (req, res, next) => {
  try {
    const { walletAddress } = req.params;
    
    const balance = await usfciService.getBalance(walletAddress);
    
    res.json({ success: true, data: { balance } });
  } catch (error) {
    next(error);
  }
};

// ==================== TOKENS ====================

const mintTokens = async (req, res, next) => {
  try {
    const { privateKey, walletAddress, amount, reserveProof } = req.body;
    
    if (!privateKey || !walletAddress || !amount || !reserveProof) {
      return res.status(400).json({ 
        success: false, 
        error: 'Private key, walletAddress, amount and reserveProof are required' 
      });
    }
    
    const result = await usfciService.mintTokens(privateKey, walletAddress, amount, reserveProof);
    const serializedResult = serializeBigInt(result);
    
    res.json({ success: true, data: serializedResult });
  } catch (error) {
    next(error);
  }
};

const transfer = async (req, res, next) => {
  try {
    const { privateKey, recipient, amount } = req.body;
    
    if (!privateKey || !recipient || !amount) {
      return res.status(400).json({ 
        success: false, 
        error: 'Private key, recipient and amount are required' 
      });
    }
    
    const result = await usfciService.transfer(privateKey, recipient, amount);
    const serializedResult = serializeBigInt(result);
    
    res.json({ success: true, data: serializedResult });
  } catch (error) {
    next(error);
  }
};

// ==================== COMPLIANCE ====================

const updateComplianceStatus = async (req, res, next) => {
  try {
    const { walletAddress } = req.params;
    const { privateKey, kycStatus, riskScore } = req.body;
    
    if (!privateKey || !kycStatus || !riskScore) {
      return res.status(400).json({ 
        success: false, 
        error: 'Private key, kycStatus and riskScore are required' 
      });
    }
    
    const result = await usfciService.updateComplianceStatus(privateKey, walletAddress, kycStatus, riskScore);
    const serializedResult = serializeBigInt(result);
    
    res.json({ success: true, data: serializedResult });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  initLedger,
  pause,
  unpause,
  getSystemConfig,
  registerWallet,
  getAccountDetails,
  getBalance,
  mintTokens,
  transfer,
  updateComplianceStatus
};