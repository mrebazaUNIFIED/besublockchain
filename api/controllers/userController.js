// controllers/userController.js
const userService = require('../services/UserRegistryService');

// Función helper para convertir BigInt a string
const serializeBigInt = (obj) => {
  return JSON.parse(JSON.stringify(obj, (key, value) =>
    typeof value === 'bigint' ? value.toString() : value
  ));
};

const registerUser = async (req, res, next) => {
  try {
    const { funderPrivateKey, initialBalance, ...userData } = req.body;
    
    if (!funderPrivateKey) {
      return res.status(400).json({ 
        success: false, 
        error: 'Funder/Owner private key is required for registration' 
      });
    }
    
    const result = await userService.registerUser(funderPrivateKey, { 
      ...userData, 
      initialBalance 
    });
    
    // Serializar BigInt antes de enviar
    const serializedResult = serializeBigInt(result);
    
    res.status(201).json({ success: true, data: serializedResult });
  } catch (error) {
    next(error);
  }
};

const updateUser = async (req, res, next) => {
  try {
    const { walletAddress } = req.params;
    const { privateKey, ...updateData } = req.body;
    
    if (!privateKey) {
      return res.status(400).json({ 
        success: false, 
        error: 'Private key is required' 
      });
    }
    
    const result = await userService.updateUser(privateKey, walletAddress, updateData);
    const serializedResult = serializeBigInt(result);
    
    res.json({ success: true, data: serializedResult });
  } catch (error) {
    next(error);
  }
};

const deactivateUser = async (req, res, next) => {
  try {
    const { walletAddress } = req.params;
    const { privateKey } = req.body;
    
    if (!privateKey) {
      return res.status(400).json({ 
        success: false, 
        error: 'Private key is required' 
      });
    }
    
    const result = await userService.deactivateUser(privateKey, walletAddress);
    const serializedResult = serializeBigInt(result);
    
    res.json({ success: true, data: serializedResult });
  } catch (error) {
    next(error);
  }
};

const reactivateUser = async (req, res, next) => {
  try {
    const { walletAddress } = req.params;
    const { privateKey } = req.body;
    
    if (!privateKey) {
      return res.status(400).json({ 
        success: false, 
        error: 'Private key is required' 
      });
    }
    
    const result = await userService.reactivateUser(privateKey, walletAddress);
    const serializedResult = serializeBigInt(result);
    
    res.json({ success: true, data: serializedResult });
  } catch (error) {
    next(error);
  }
};

const getUser = async (req, res, next) => {
  try {
    const { walletAddress } = req.params;
    const user = await userService.getUser(walletAddress);
    const serializedUser = serializeBigInt(user);
    
    res.json({ success: true, data: serializedUser });
  } catch (error) {
    next(error);
  }
};

const getUserByUserId = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const user = await userService.getUserByUserId(userId);
    const serializedUser = serializeBigInt(user);
    
    res.json({ success: true, data: serializedUser });
  } catch (error) {
    next(error);
  }
};

const getUsersByOrganization = async (req, res, next) => {
  try {
    const { organization } = req.params;
    const start = parseInt(req.query.start) || 0;
    const limit = parseInt(req.query.limit) || 10;
    
    const users = await userService.getUsersByOrganization(organization, start, limit);
    const serializedUsers = serializeBigInt(users);
    
    res.json({ success: true, data: serializedUsers });
  } catch (error) {
    next(error);
  }
};

const isUserActive = async (req, res, next) => {
  try {
    const { walletAddress } = req.params;
    const isActive = await userService.isUserActive(walletAddress);
    
    res.json({ success: true, data: { isActive } });
  } catch (error) {
    next(error);
  }
};

const userRegistered = async (req, res, next) => {
  try {
    const { walletAddress } = req.params;
    const registered = await userService.userRegistered(walletAddress);
    
    res.json({ success: true, data: { registered } });
  } catch (error) {
    next(error);
  }
};

const getTotalUsers = async (req, res, next) => {
  try {
    const total = await userService.getTotalUsers();
    
    res.json({ success: true, data: { total } });
  } catch (error) {
    next(error);
  }
};

const getActiveUsersCount = async (req, res, next) => {
  try {
    const count = await userService.getActiveUsersCount();
    
    res.json({ success: true, data: { count } });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  registerUser,
  updateUser,
  deactivateUser,
  reactivateUser,
  getUser,
  getUserByUserId,
  getUsersByOrganization,
  isUserActive,
  userRegistered,
  getTotalUsers,
  getActiveUsersCount
};