const express = require('express');
const router = express.Router();
const {
  getInventorySummaryReport,
  getInventoryMovementReport,
  getLowStockReport,
  getLostDamagedReport,
} = require('../controllers/reportController');

const { protect } = require('../middleware/authMiddleware');
const { adminOnly } = require('../middleware/adminMiddleware');

// All reports are accessible to Admin only
router.use(protect);
router.use(adminOnly);

router.get('/inventory-summary', getInventorySummaryReport);
router.get('/inventory-movement', getInventoryMovementReport);
router.get('/low-stock', getLowStockReport);
router.get('/lost-damaged', getLostDamagedReport);

module.exports = router;
