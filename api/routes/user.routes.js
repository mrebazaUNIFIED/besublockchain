// routes/userRoutes.js
const express = require('express');
const {
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
} = require('../controllers/userController');

const router = express.Router();

// ==========================================
// RUTAS ESPECÍFICAS PRIMERO (sin parámetros dinámicos)
// ==========================================

// Obtener total de usuarios
router.get('/total', getTotalUsers);

// Obtener conteo de activos
router.get('/active/count', getActiveUsersCount);

// Obtener usuarios por organización
router.get('/organization/:organization', getUsersByOrganization);

// Obtener usuario por userId
router.get('/id/:userId', getUserByUserId);

// ==========================================
// RUTAS CON PARÁMETROS DINÁMICOS AL FINAL
// ==========================================

// Registrar usuario
router.post('/', registerUser);

// Actualizar usuario
router.put('/wallet/:walletAddress', updateUser);

// Desactivar usuario
router.post('/wallet/:walletAddress/deactivate', deactivateUser);

// Reactivar usuario
router.post('/wallet/:walletAddress/reactivate', reactivateUser);

// Verificar si activo
router.get('/wallet/:walletAddress/active', isUserActive);

// Verificar si registrado
router.get('/wallet/:walletAddress/registered', userRegistered);

// Obtener usuario por walletAddress (ESTA VA AL FINAL)
router.get('/wallet/:walletAddress', getUser);

module.exports = router;