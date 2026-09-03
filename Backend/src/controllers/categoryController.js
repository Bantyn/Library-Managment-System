const Category = require('../models/Category');
const Book = require('../models/Book');

// @desc    Get all categories
// @route   GET /api/categories
// @access  Public
const getCategories = async (req, res, next) => {
  try {
    const categories = await Category.find({ isDeleted: { $ne: true } }).sort({ name: 1 });
    res.status(200).json({
      success: true,
      count: categories.length,
      data: categories,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single category by ID
// @route   GET /api/categories/:id
// @access  Public
const getCategoryById = async (req, res, next) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found',
      });
    }
    res.status(200).json({
      success: true,
      data: category,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create new category
// @route   POST /api/categories
// @access  Private (Admin only)
const createCategory = async (req, res, next) => {
  try {
    const { name, description } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Category name is required',
      });
    }

    const existingCategory = await Category.findOne({
      name: { $regex: new RegExp(`^${name.trim()}$`, 'i') },
    });

    if (existingCategory) {
      return res.status(400).json({
        success: false,
        message: 'A category with this name already exists',
      });
    }

    const category = await Category.create({
      name: name.trim(),
      description: description ? description.trim() : '',
    });

    res.status(201).json({
      success: true,
      message: 'Category created successfully',
      data: category,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update category
// @route   PUT /api/categories/:id
// @access  Private (Admin only)
const updateCategory = async (req, res, next) => {
  try {
    const { name, description } = req.body;

    const category = await Category.findById(req.params.id);
    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found',
      });
    }

    if (name && name.trim() !== category.name) {
      // Check if new name already taken by another category
      const duplicate = await Category.findOne({
        _id: { $ne: req.params.id },
        name: { $regex: new RegExp(`^${name.trim()}$`, 'i') },
      });
      if (duplicate) {
        return res.status(400).json({
          success: false,
          message: 'Another category with this name already exists',
        });
      }
      category.name = name.trim();
    }

    if (description !== undefined) {
      category.description = description.trim();
    }

    await category.save();

    res.status(200).json({
      success: true,
      message: 'Category updated successfully',
      data: category,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Soft delete category (Move to Trash)
// @route   DELETE /api/categories/:id
// @access  Private (Admin only)
const deleteCategory = async (req, res, next) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found',
      });
    }

    if (category.isDeleted) {
      return res.status(400).json({
        success: false,
        message: 'Category is already in trash.',
      });
    }

    // Check if active (non-deleted) books are assigned to this category
    const bookCount = await Book.countDocuments({
      category: req.params.id,
      isDeleted: { $ne: true },
    });
    if (bookCount > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot move to trash. ${bookCount} active book(s) are assigned to this category. Reassign or remove books first.`,
      });
    }

    category.isDeleted = true;
    category.deletedAt = new Date();
    category.deletedBy = req.user ? req.user._id : null;
    await category.save();

    res.status(200).json({
      success: true,
      message: 'Category moved to trash successfully.',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Restore soft-deleted category from Trash
// @route   PUT /api/categories/:id/restore
// @access  Private (Admin only)
const restoreCategory = async (req, res, next) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) {
      return res.status(404).json({ success: false, message: 'Category not found' });
    }
    if (!category.isDeleted) {
      return res.status(400).json({ success: false, message: 'Category is not in trash.' });
    }

    category.isDeleted = false;
    category.deletedAt = null;
    category.deletedBy = null;
    await category.save();

    res.status(200).json({
      success: true,
      message: 'Category restored successfully.',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Permanently delete category from database
// @route   DELETE /api/categories/:id/permanent
// @access  Private (Admin only)
const hardDeleteCategory = async (req, res, next) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) {
      return res.status(404).json({ success: false, message: 'Category not found' });
    }

    // Block if any books (including deleted) reference this category
    const bookCount = await Book.countDocuments({ category: req.params.id });
    if (bookCount > 0) {
      return res.status(409).json({
        success: false,
        message: `Cannot permanently delete. ${bookCount} book(s) (including trashed) reference this category. Historical data integrity must be preserved.`,
      });
    }

    await Category.deleteOne({ _id: category._id });

    res.status(200).json({
      success: true,
      message: 'Category permanently deleted from database.',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
  restoreCategory,
  hardDeleteCategory,
};
