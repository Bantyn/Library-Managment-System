const Inventory = require('../models/Inventory');
const InventoryTransaction = require('../models/InventoryTransaction');
const Book = require('../models/Book');
const inventoryService = require('../services/inventoryService');

// @desc    Get paginated inventory items with search & filters
// @route   GET /api/inventory
// @access  Private (Admin only)
const getInventory = async (req, res, next) => {
  try {
    const {
      search,
      category,
      status,
      page = 1,
      limit = 10,
    } = req.query;

    const pageNumber = Math.max(1, parseInt(page, 10) || 1);
    const pageSize = Math.max(1, parseInt(limit, 10) || 10);

    // 1. Build book query for search and category
    const bookQuery = { isDeleted: false };
    if (category) {
      bookQuery.category = category;
    }
    if (search && search.trim()) {
      const searchRegex = new RegExp(search.trim(), 'i');
      bookQuery.$or = [
        { title: searchRegex },
        { author: searchRegex },
        { isbn: searchRegex },
      ];
    }

    const matchingBooks = await Book.find(bookQuery).select('_id');
    const matchingBookIds = matchingBooks.map((b) => b._id);

    // 2. Build Inventory query
    const inventoryQuery = {
      isDeleted: false,
      book: { $in: matchingBookIds },
    };

    if (status === 'out_of_stock') {
      inventoryQuery.availableCopies = 0;
    } else if (status === 'low_stock') {
      inventoryQuery.availableCopies = { $gt: 0 };
      inventoryQuery.$expr = {
        $lte: ['$availableCopies', '$lowStockThreshold'],
      };
    } else if (status === 'in_stock') {
      inventoryQuery.$expr = {
        $gt: ['$availableCopies', '$lowStockThreshold'],
      };
    } else if (status === 'damaged') {
      inventoryQuery.damagedCopies = { $gt: 0 };
    } else if (status === 'lost') {
      inventoryQuery.lostCopies = { $gt: 0 };
    }

    const total = await Inventory.countDocuments(inventoryQuery);
    const items = await Inventory.find(inventoryQuery)
      .populate({
        path: 'book',
        populate: { path: 'category', select: 'name' },
      })
      .sort({ updatedAt: -1 })
      .skip((pageNumber - 1) * pageSize)
      .limit(pageSize);

    res.status(200).json({
      success: true,
      count: items.length,
      total,
      page: pageNumber,
      totalPages: Math.ceil(total / pageSize) || 1,
      data: items,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get inventory summary metrics and KPI counters
// @route   GET /api/inventory/stats
// @access  Private (Admin only)
const getInventoryStats = async (req, res, next) => {
  try {
    const totalBooks = await Book.countDocuments({ isDeleted: { $ne: true } });

    const [aggregates] = await Inventory.aggregate([
      { $match: { isDeleted: false } },
      {
        $group: {
          _id: null,
          totalCopies: { $sum: '$totalCopies' },
          availableCopies: { $sum: '$availableCopies' },
          issuedCopies: { $sum: '$issuedCopies' },
          damagedCopies: { $sum: '$damagedCopies' },
          lostCopies: { $sum: '$lostCopies' },
        },
      },
    ]);

    const outOfStockCount = await Inventory.countDocuments({
      isDeleted: false,
      availableCopies: 0,
    });

    const lowStockCount = await Inventory.countDocuments({
      isDeleted: false,
      availableCopies: { $gt: 0 },
      $expr: { $lte: ['$availableCopies', '$lowStockThreshold'] },
    });

    res.status(200).json({
      success: true,
      data: {
        totalBooks,
        totalCopies: aggregates?.totalCopies || 0,
        availableCopies: aggregates?.availableCopies || 0,
        issuedCopies: aggregates?.issuedCopies || 0,
        damagedCopies: aggregates?.damagedCopies || 0,
        lostCopies: aggregates?.lostCopies || 0,
        lowStockCount,
        outOfStockCount,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single book inventory specification & status
// @route   GET /api/inventory/:bookId
// @access  Private (Admin only)
const getBookInventory = async (req, res, next) => {
  try {
    const { bookId } = req.params;
    const inventory = await inventoryService.getOrCreateInventory(bookId);
    const populated = await Inventory.findById(inventory._id).populate({
      path: 'book',
      populate: { path: 'category', select: 'name' },
    });

    res.status(200).json({
      success: true,
      data: populated,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get transaction movement history for a book
// @route   GET /api/inventory/:bookId/transactions
// @access  Private (Admin only)
const getBookTransactions = async (req, res, next) => {
  try {
    const { bookId } = req.params;
    const { page = 1, limit = 10 } = req.query;

    const pageNumber = Math.max(1, parseInt(page, 10) || 1);
    const pageSize = Math.max(1, parseInt(limit, 10) || 10);

    const total = await InventoryTransaction.countDocuments({ book: bookId });
    const transactions = await InventoryTransaction.find({ book: bookId })
      .populate('performedBy', 'name email')
      .sort({ createdAt: -1 })
      .skip((pageNumber - 1) * pageSize)
      .limit(pageSize);

    res.status(200).json({
      success: true,
      count: transactions.length,
      total,
      page: pageNumber,
      totalPages: Math.ceil(total / pageSize) || 1,
      data: transactions,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Add physical stock copies (STOCK_IN)
// @route   POST /api/inventory/:bookId/stock-in
// @access  Private (Admin only)
const stockIn = async (req, res, next) => {
  try {
    const { bookId } = req.params;
    const { quantity, reason } = req.body;

    const result = await inventoryService.stockIn(
      bookId,
      quantity,
      reason,
      req.user._id
    );

    res.status(200).json({
      success: true,
      message: `Successfully added ${quantity} copies to stock.`,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Mark copies damaged (DAMAGE)
// @route   POST /api/inventory/:bookId/damage
// @access  Private (Admin only)
const markDamage = async (req, res, next) => {
  try {
    const { bookId } = req.params;
    const { quantity, reason } = req.body;

    const result = await inventoryService.markDamage(
      bookId,
      quantity,
      reason,
      req.user._id
    );

    res.status(200).json({
      success: true,
      message: `Marked ${quantity} copy(ies) as damaged.`,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Mark copies lost (LOST)
// @route   POST /api/inventory/:bookId/lost
// @access  Private (Admin only)
const markLost = async (req, res, next) => {
  try {
    const { bookId } = req.params;
    const { quantity, reason } = req.body;

    const result = await inventoryService.markLost(
      bookId,
      quantity,
      reason,
      req.user._id
    );

    res.status(200).json({
      success: true,
      message: `Marked ${quantity} copy(ies) as lost.`,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Recover previously lost copies (RECOVERED)
// @route   POST /api/inventory/:bookId/recover
// @access  Private (Admin only)
const recoverLost = async (req, res, next) => {
  try {
    const { bookId } = req.params;
    const { quantity, reason } = req.body;

    const result = await inventoryService.recoverLost(
      bookId,
      quantity,
      reason,
      req.user._id
    );

    res.status(200).json({
      success: true,
      message: `Restored ${quantity} recovered copy(ies) to available stock.`,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Adjust inventory count (ADJUSTMENT)
// @route   POST /api/inventory/:bookId/adjust
// @access  Private (Admin only)
const adjustStock = async (req, res, next) => {
  try {
    const { bookId } = req.params;
    const { adjustmentType, quantity, reason } = req.body;

    const result = await inventoryService.adjustStock(
      bookId,
      adjustmentType,
      quantity,
      reason,
      req.user._id
    );

    res.status(200).json({
      success: true,
      message: `Inventory adjusted successfully (${adjustmentType} ${quantity}).`,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Physical stock verification audit
// @route   POST /api/inventory/:bookId/physical-check
// @access  Private (Admin only)
const physicalStockCheck = async (req, res, next) => {
  try {
    const { bookId } = req.params;
    const { physicalCount, reason } = req.body;

    const result = await inventoryService.physicalStockCheck(
      bookId,
      physicalCount,
      reason,
      req.user._id
    );

    res.status(200).json({
      success: true,
      message: result.message || 'Physical stock check recorded and reconciled.',
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all inventory transactions across all books
// @route   GET /api/inventory/transactions
// @access  Private (Admin only)
const getAllTransactions = async (req, res, next) => {
  try {
    const { type, page = 1, limit = 10 } = req.query;

    const pageNumber = Math.max(1, parseInt(page, 10) || 1);
    const pageSize = Math.max(1, parseInt(limit, 10) || 10);

    const query = {};
    if (type) {
      query.type = type;
    }

    const total = await InventoryTransaction.countDocuments(query);
    const transactions = await InventoryTransaction.find(query)
      .populate('book', 'title author isbn image')
      .populate('performedBy', 'name email')
      .sort({ createdAt: -1 })
      .skip((pageNumber - 1) * pageSize)
      .limit(pageSize);

    res.status(200).json({
      success: true,
      count: transactions.length,
      total,
      page: pageNumber,
      totalPages: Math.ceil(total / pageSize) || 1,
      data: transactions,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getInventory,
  getInventoryStats,
  getBookInventory,
  getBookTransactions,
  stockIn,
  markDamage,
  markLost,
  recoverLost,
  adjustStock,
  physicalStockCheck,
  getAllTransactions,
};
