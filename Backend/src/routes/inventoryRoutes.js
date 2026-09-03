const express = require('express');
const router = express.Router();
const {
  getInventory,
  getInventoryStats,
  getBookInventory,
  getBookTransactions,
  stockIn,
  markDamage,
  markLost,
  recoverLost,
  adjustStock,
  physicalStockCheck,
  getAllTransactions,
} = require('../controllers/inventoryController');

const { protect } = require('../middleware/authMiddleware');
const { adminOnly } = require('../middleware/adminMiddleware');

// All inventory operations require Admin role
router.use(protect);
router.use(adminOnly);

router.get('/', getInventory);
router.get('/stats', getInventoryStats);
router.get('/transactions', getAllTransactions);

router.get('/:bookId', getBookInventory);
router.get('/:bookId/transactions', getBookTransactions);

router.post('/:bookId/stock-in', stockIn);
router.post('/:bookId/damage', markDamage);
router.post('/:bookId/lost', markLost);
router.post('/:bookId/recover', recoverLost);
router.post('/:bookId/adjust', adjustStock);
router.post('/:bookId/physical-check', physicalStockCheck);

module.exports = router;
