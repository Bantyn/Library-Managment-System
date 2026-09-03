const express = require('express');
const router = express.Router();
const {
  getMembers,
  getMemberById,
  updateMember,
  deleteMember,
  getMemberIssues,
} = require('../controllers/memberController');
const { protect } = require('../middleware/authMiddleware');
const { adminOnly } = require('../middleware/adminMiddleware');

// Member management (Admin only)
router.get('/', protect, adminOnly, getMembers);
router.get('/:id', protect, adminOnly, getMemberById);
router.put('/:id', protect, adminOnly, updateMember);
router.delete('/:id', protect, adminOnly, deleteMember);

// Member borrowing history (Admin or Student self)
router.get('/:id/issues', protect, getMemberIssues);

module.exports = router;
