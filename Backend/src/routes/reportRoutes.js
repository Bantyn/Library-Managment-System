const express = require('express');
const router = express.Router();
const {
  getBooksReport,
  getIssuesReport,
  getOverdueReport,
  getMembersReport,
  getPurchasesReport,
  getFinePaymentsReport,
  getReportKpis,
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

// AWD Core Institutional Reports
router.get('/summary-kpis', getReportKpis);
router.get('/books', getBooksReport);
router.get('/issues', getIssuesReport);
router.get('/overdue', getOverdueReport);
router.get('/members', getMembersReport);
router.get('/purchases', getPurchasesReport);
router.get('/fines', getFinePaymentsReport);

// Physical Inventory Reports
router.get('/inventory-summary', getInventorySummaryReport);
router.get('/inventory-movement', getInventoryMovementReport);
router.get('/low-stock', getLowStockReport);
router.get('/lost-damaged', getLostDamagedReport);

module.exports = router;
