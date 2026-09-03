const express = require('express');
const router = express.Router();
const { getTrash, getTrashSummary } = require('../controllers/trashController');
const { protect } = require('../middleware/authMiddleware');
const { adminOnly } = require('../middleware/adminMiddleware');

// GET /api/trash?type=books|categories|members&page=1
router.get('/', protect, adminOnly, getTrash);

// GET /api/trash/summary — counts per type for badge display
router.get('/summary', protect, adminOnly, getTrashSummary);

module.exports = router;
