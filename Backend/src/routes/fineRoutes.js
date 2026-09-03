const express = require('express');
const router = express.Router();
const {
  createFineOrder,
  verifyFinePayment,
  collectCashFine,
  getMyFines,
  getAllFines,
  getIssueFineDetails,
} = require('../controllers/fineController');
const { protect } = require('../middleware/authMiddleware');
const { adminOnly } = require('../middleware/adminMiddleware');

// Student endpoints
router.post('/create-order', protect, createFineOrder);
router.post('/verify', protect, verifyFinePayment);
router.get('/my-fines', protect, getMyFines);

// Admin endpoints
router.get('/', protect, adminOnly, getAllFines);
router.post('/:issueId/collect', protect, adminOnly, collectCashFine);

// Single issue fine details
router.get('/:issueId', protect, getIssueFineDetails);

module.exports = router;
