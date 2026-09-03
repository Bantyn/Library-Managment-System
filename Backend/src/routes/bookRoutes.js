const express = require('express');
const router = express.Router();
const {
  getBooks,
  getBookById,
  getPublicStats,
  createBook,
  updateBook,
  deleteBook,
  restoreBook,
  hardDeleteBook,
} = require('../controllers/bookController');
const { protect } = require('../middleware/authMiddleware');
const { adminOnly } = require('../middleware/adminMiddleware');
const upload = require('../middleware/uploadMiddleware');

router.get('/', getBooks);
router.get('/public-stats', getPublicStats);
router.get('/:id', getBookById);

// Admin-protected routes (supports optional image upload via multipart/form-data)
router.post('/', protect, adminOnly, upload.single('image'), createBook);
router.put('/:id', protect, adminOnly, upload.single('image'), updateBook);
router.delete('/:id', protect, adminOnly, deleteBook);

// Trash operations (Admin only)
router.put('/:id/restore', protect, adminOnly, restoreBook);
router.delete('/:id/permanent', protect, adminOnly, hardDeleteBook);

module.exports = router;
