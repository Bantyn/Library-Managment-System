const express = require('express');
const router = express.Router();
const {
  getCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
  restoreCategory,
  hardDeleteCategory,
} = require('../controllers/categoryController');
const { protect } = require('../middleware/authMiddleware');
const { adminOnly } = require('../middleware/adminMiddleware');

router.get('/', getCategories);
router.get('/:id', getCategoryById);

// Admin-protected routes
router.post('/', protect, adminOnly, createCategory);
router.put('/:id', protect, adminOnly, updateCategory);
router.delete('/:id', protect, adminOnly, deleteCategory);

// Trash operations (Admin only)
router.put('/:id/restore', protect, adminOnly, restoreCategory);
router.delete('/:id/permanent', protect, adminOnly, hardDeleteCategory);

module.exports = router;
