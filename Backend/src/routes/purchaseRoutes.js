const express = require('express');
const router = express.Router();
const {
  createPurchaseOrder,
  verifyPurchase,
  getMyPurchases,
  getAllPurchases,
  getPurchaseById,
  updatePurchaseStatus,
} = require('../controllers/purchaseController');
const { protect } = require('../middleware/authMiddleware');
const { adminOnly } = require('../middleware/adminMiddleware');

// Student purchase routes
router.post('/create-order', protect, createPurchaseOrder);
router.post('/verify', protect, verifyPurchase);
router.get('/my-purchases', protect, getMyPurchases);

// Admin view all purchases & fulfillment
router.get('/', protect, adminOnly, getAllPurchases);
router.put('/:id/status', protect, adminOnly, updatePurchaseStatus);

// Single purchase
router.get('/:id', protect, getPurchaseById);

module.exports = router;
