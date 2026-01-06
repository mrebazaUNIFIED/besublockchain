// controllers/shareController.js
const shareLoansService = require('../services/ShareLoansService');

// Función helper para convertir BigInt a string
const serializeBigInt = (obj) => {
  return JSON.parse(JSON.stringify(obj, (key, value) =>
    typeof value === 'bigint' ? value.toString() : value
  ));
};

const createShareAsset = async (req, res, next) => {
  try {
    const { privateKey, key, ownerUserId, loanId, description, sharedWithAddresses, sharedWithUserIds } = req.body;
    
    if (!privateKey || !key || !ownerUserId || !loanId || !sharedWithAddresses || !sharedWithUserIds) {
      return res.status(400).json({ 
        success: false, 
        error: 'Private key, key, ownerUserId, loanId, sharedWithAddresses and sharedWithUserIds are required' 
      });
    }
    
    if (!Array.isArray(sharedWithAddresses) || !Array.isArray(sharedWithUserIds)) {
      return res.status(400).json({ 
        success: false, 
        error: 'sharedWithAddresses and sharedWithUserIds must be arrays' 
      });
    }
    
    if (sharedWithAddresses.length !== sharedWithUserIds.length) {
      return res.status(400).json({ 
        success: false, 
        error: 'sharedWithAddresses and sharedWithUserIds must have the same length' 
      });
    }
    
    const result = await shareLoansService.createShareAsset(
      privateKey,
      key,
      ownerUserId,
      loanId,
      description || '',
      sharedWithAddresses,
      sharedWithUserIds
    );
    const serializedResult = serializeBigInt(result);
    
    res.status(201).json({ success: true, data: serializedResult });
  } catch (error) {
    next(error);
  }
};

const updateShareAssetAccounts = async (req, res, next) => {
  try {
    const { key } = req.params;
    const { privateKey, sharedWithAddresses, sharedWithUserIds } = req.body;
    
    if (!privateKey || !sharedWithAddresses || !sharedWithUserIds) {
      return res.status(400).json({ 
        success: false, 
        error: 'Private key, sharedWithAddresses and sharedWithUserIds are required' 
      });
    }
    
    if (!Array.isArray(sharedWithAddresses) || !Array.isArray(sharedWithUserIds)) {
      return res.status(400).json({ 
        success: false, 
        error: 'sharedWithAddresses and sharedWithUserIds must be arrays' 
      });
    }
    
    if (sharedWithAddresses.length !== sharedWithUserIds.length) {
      return res.status(400).json({ 
        success: false, 
        error: 'sharedWithAddresses and sharedWithUserIds must have the same length' 
      });
    }
    
    const result = await shareLoansService.updateShareAssetAccounts(
      privateKey,
      key,
      sharedWithAddresses,
      sharedWithUserIds
    );
    const serializedResult = serializeBigInt(result);
    
    res.json({ success: true, data: serializedResult });
  } catch (error) {
    next(error);
  }
};

const disableShareAsset = async (req, res, next) => {
  try {
    const { key } = req.params;
    const { privateKey } = req.body;
    
    if (!privateKey) {
      return res.status(400).json({ 
        success: false, 
        error: 'Private key is required' 
      });
    }
    
    const result = await shareLoansService.disableShareAsset(privateKey, key);
    const serializedResult = serializeBigInt(result);
    
    res.json({ success: true, data: serializedResult });
  } catch (error) {
    next(error);
  }
};

const enableShareAsset = async (req, res, next) => {
  try {
    const { key } = req.params;
    const { privateKey } = req.body;
    
    if (!privateKey) {
      return res.status(400).json({ 
        success: false, 
        error: 'Private key is required' 
      });
    }
    
    const result = await shareLoansService.enableShareAsset(privateKey, key);
    const serializedResult = serializeBigInt(result);
    
    res.json({ success: true, data: serializedResult });
  } catch (error) {
    next(error);
  }
};

const readShareAsset = async (req, res, next) => {
  try {
    const { key } = req.params;
    
    const share = await shareLoansService.readShareAsset(key);
    const serializedShare = serializeBigInt(share);
    
    res.json({ success: true, data: serializedShare });
  } catch (error) {
    next(error);
  }
};

const checkUserAccess = async (req, res, next) => {
  try {
    const { key, userAddress } = req.params;
    
    const access = await shareLoansService.checkUserAccess(key, userAddress);
    
    res.json({ success: true, data: access });
  } catch (error) {
    next(error);
  }
};

const querySharedByUser = async (req, res, next) => {
  try {
    const { userAddress } = req.params;
    
    const shares = await shareLoansService.querySharedByUser(userAddress);
    const serializedShares = serializeBigInt(shares);
    
    res.json({ success: true, data: serializedShares });
  } catch (error) {
    next(error);
  }
};

const querySharedWithMe = async (req, res, next) => {
  try {
    const { userAddress } = req.params;
    
    const shares = await shareLoansService.querySharedWithMe(userAddress);
    const serializedShares = serializeBigInt(shares);
    
    res.json({ success: true, data: serializedShares });
  } catch (error) {
    next(error);
  }
};

const queryAllShareAssets = async (req, res, next) => {
  try {
    const shares = await shareLoansService.queryAllShareAssets();
    const serializedShares = serializeBigInt(shares);
    
    res.json({ success: true, data: serializedShares });
  } catch (error) {
    next(error);
  }
};

const shareAssetExists = async (req, res, next) => {
  try {
    const { key } = req.params;
    
    const exists = await shareLoansService.shareAssetExists(key);
    
    res.json({ success: true, data: { exists } });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createShareAsset,
  updateShareAssetAccounts,
  disableShareAsset,
  enableShareAsset,
  readShareAsset,
  checkUserAccess,
  querySharedByUser,
  querySharedWithMe,
  queryAllShareAssets,
  shareAssetExists
};