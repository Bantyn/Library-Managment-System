const express = require('express');
const router = express.Router();
const { returnBook } = require('../controllers/returnController');
const { protect } = require('../middleware/authMiddleware');
const { adminOnly } = require('../middleware/adminMiddleware');

// Return endpoint: PUT /api/returns/:id
router.put('/:id', protect, adminOnly, returnBook);

module.exports = router;
