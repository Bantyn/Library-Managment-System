const express = require('express');
const router = express.Router();
const {
  getMembers,
  getMemberById,
  updateMember,
  deleteMember,
  restoreMember,
  hardDeleteMember,
  getMemberIssues,
} = require('../controllers/memberController');
const { protect } = require('../middleware/authMiddleware');
const { adminOnly } = require('../middleware/adminMiddleware');

// Member management (Admin only)
router.get('/', protect, adminOnly, getMembers);
router.get('/:id', protect, adminOnly, getMemberById);
router.put('/:id', protect, adminOnly, updateMember);
router.delete('/:id', protect, adminOnly, deleteMember);

// Trash operations (Admin only)
router.put('/:id/restore', protect, adminOnly, restoreMember);
router.delete('/:id/permanent', protect, adminOnly, hardDeleteMember);

// Member borrowing history (Admin or Student self)
router.get('/:id/issues', protect, getMemberIssues);

module.exports = router;
