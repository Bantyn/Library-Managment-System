const express = require('express');
const router = express.Router();
const {
  issueBook,
  getAllIssues,
  getIssueById,
  getActiveIssues,
  getOverdueIssues,
} = require('../controllers/issueController');
const { returnBook } = require('../controllers/returnController');
const { protect } = require('../middleware/authMiddleware');
const { adminOnly } = require('../middleware/adminMiddleware');

// Specific routes before parameterized :id route
router.get('/active', protect, adminOnly, getActiveIssues);
router.get('/overdue', protect, adminOnly, getOverdueIssues);

// General issue operations
router.post('/', protect, adminOnly, issueBook);
router.get('/', protect, adminOnly, getAllIssues);
router.get('/:id', protect, getIssueById);

// Return book endpoint (PUT /api/issues/:id/return)
router.put('/:id/return', protect, adminOnly, returnBook);

module.exports = router;
