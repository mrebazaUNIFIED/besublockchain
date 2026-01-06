// routes/share.routes.js
const express = require('express');
const {
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
} = require('../controllers/shareController');

const router = express.Router();

// ==========================================
// RUTAS ESPECÍFICAS PRIMERO
// ==========================================

// Obtener todos los shares (admin)
router.get('/all', queryAllShareAssets);

// Obtener shares creados por usuario
router.get('/by-user/:userAddress', querySharedByUser);

// Obtener shares compartidos con usuario
router.get('/with-me/:userAddress', querySharedWithMe);

// ==========================================
// RUTAS CON PARÁMETROS DINÁMICOS
// ==========================================

// Crear share
router.post('/', createShareAsset);

// Actualizar cuentas con acceso
router.put('/:key/accounts', updateShareAssetAccounts);

// Deshabilitar share
router.post('/:key/disable', disableShareAsset);

// Habilitar share
router.post('/:key/enable', enableShareAsset);

// Leer share
router.get('/:key', readShareAsset);

// Verificar si existe
router.get('/:key/exists', shareAssetExists);

// Verificar acceso de usuario
router.get('/:key/access/:userAddress', checkUserAccess);

module.exports = router;