const Book = require('../models/Book');
const Category = require('../models/Category');
const User = require('../models/User');

// @desc    Get all soft-deleted (trashed) records across entities
// @route   GET /api/trash?type=books|categories|members&page=1&limit=20
// @access  Private (Admin only)
const getTrash = async (req, res, next) => {
  try {
    const { type = 'books', page = 1, limit = 20 } = req.query;
    const pageNumber = Math.max(1, parseInt(page, 10) || 1);
    const pageSize = Math.max(1, parseInt(limit, 10) || 20);
    const skip = (pageNumber - 1) * pageSize;

    const trashFilter = { isDeleted: true };

    if (type === 'books') {
      const total = await Book.countDocuments(trashFilter);
      const items = await Book.find(trashFilter)
        .populate('category', 'name')
        .populate('deletedBy', 'name email')
        .sort({ deletedAt: -1 })
        .skip(skip)
        .limit(pageSize);

      return res.status(200).json({
        success: true,
        type: 'books',
        total,
        page: pageNumber,
        totalPages: Math.ceil(total / pageSize) || 1,
        data: items,
      });
    }

    if (type === 'categories') {
      const total = await Category.countDocuments(trashFilter);
      const items = await Category.find(trashFilter)
        .populate('deletedBy', 'name email')
        .sort({ deletedAt: -1 })
        .skip(skip)
        .limit(pageSize);

      return res.status(200).json({
        success: true,
        type: 'categories',
        total,
        page: pageNumber,
        totalPages: Math.ceil(total / pageSize) || 1,
        data: items,
      });
    }

    if (type === 'members') {
      const total = await User.countDocuments({ ...trashFilter, role: 'student' });
      const items = await User.find({ ...trashFilter, role: 'student' })
        .select('-password')
        .populate('deletedBy', 'name email')
        .sort({ deletedAt: -1 })
        .skip(skip)
        .limit(pageSize);

      return res.status(200).json({
        success: true,
        type: 'members',
        total,
        page: pageNumber,
        totalPages: Math.ceil(total / pageSize) || 1,
        data: items,
      });
    }

    return res.status(400).json({
      success: false,
      message: 'Invalid type. Use: books, categories, or members.',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get trash summary counts for all types
// @route   GET /api/trash/summary
// @access  Private (Admin only)
const getTrashSummary = async (req, res, next) => {
  try {
    const [books, categories, members] = await Promise.all([
      Book.countDocuments({ isDeleted: true }),
      Category.countDocuments({ isDeleted: true }),
      User.countDocuments({ isDeleted: true, role: 'student' }),
    ]);

    res.status(200).json({
      success: true,
      data: { books, categories, members, total: books + categories + members },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { getTrash, getTrashSummary };
