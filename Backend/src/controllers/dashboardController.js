const Book = require('../models/Book');
const User = require('../models/User');
const Category = require('../models/Category');
const Issue = require('../models/Issue');
const Purchase = require('../models/Purchase');
const FinePayment = require('../models/FinePayment');
const Inventory = require('../models/Inventory');
const InventoryTransaction = require('../models/InventoryTransaction');

// @desc    Get system dashboard statistics & summary lists
// @route   GET /api/dashboard
// @access  Private (Admin only)
const getDashboardStats = async (req, res, next) => {
  try {
    const now = new Date();

    // Aggregated book inventory counts (active books only)
    const bookAggregate = await Book.aggregate([
      { $match: { isDeleted: { $ne: true } } },
      {
        $group: {
          _id: null,
          totalCopies: { $sum: '$totalCopies' },
          availableCopies: { $sum: '$availableCopies' },
          totalTitles: { $sum: 1 },
        },
      },
    ]);

    const totalBooks = bookAggregate.length > 0 ? bookAggregate[0].totalCopies : 0;
    const availableBooks =
      bookAggregate.length > 0 ? bookAggregate[0].availableCopies : 0;
    const totalTitles = bookAggregate.length > 0 ? bookAggregate[0].totalTitles : 0;

    // Parallel queries for speed & efficiency
    const [
      issuedBooks,
      totalStudents,
      totalCategories,
      overdueBooks,
      recentIssues,
      recentBooks,
      overdueIssues,
      purchaseAgg,
      fineCollectedAgg,
      totalFinesAgg,
      invAgg,
      lowStockBooks,
      outOfStockBooksCount,
      recentInventoryActivity,
    ] = await Promise.all([
      // Count currently issued copies
      Issue.countDocuments({
        status: { $in: ['issued', 'overdue'] },
        returnDate: null,
      }),
      // Count registered students (active only)
      User.countDocuments({ role: 'student', isDeleted: { $ne: true } }),
      // Count categories (active only)
      Category.countDocuments({ isDeleted: { $ne: true } }),
      // Count overdue issues
      Issue.countDocuments({
        dueDate: { $lt: now },
        returnDate: null,
      }),
      // 5 most recent issues
      Issue.find()
        .sort({ issueDate: -1 })
        .limit(5)
        .populate('book', 'title isbn author image')
        .populate('student', 'name studentId email'),
      // 5 most recently added active books
      Book.find({ isDeleted: { $ne: true } })
        .sort({ createdAt: -1 })
        .limit(5)
        .populate('category', 'name'),
      // 5 top overdue issues
      Issue.find({
        dueDate: { $lt: now },
        returnDate: null,
      })
        .sort({ dueDate: 1 })
        .limit(5)
        .populate('book', 'title isbn author image')
        .populate('student', 'name studentId phone'),
      // Purchases aggregate
      Purchase.aggregate([
        { $match: { status: { $in: ['paid', 'processing', 'fulfilled'] } } },
        {
          $group: {
            _id: null,
            count: { $sum: 1 },
            revenue: { $sum: '$amount' },
          },
        },
      ]),
      // Collected fine payments aggregate
      FinePayment.aggregate([
        { $match: { status: 'paid' } },
        {
          $group: {
            _id: null,
            totalCollected: { $sum: '$amount' },
          },
        },
      ]),
      // Total fines generated on issues
      Issue.aggregate([
        {
          $group: {
            _id: null,
            totalFineGenerated: { $sum: '$fine' },
          },
        },
      ]),
      // Physical Inventory breakdown aggregate
      Inventory.aggregate([
        { $match: { isDeleted: false } },
        {
          $group: {
            _id: null,
            totalPhysicalCopies: { $sum: '$totalCopies' },
            availableCopies: { $sum: '$availableCopies' },
            issuedCopies: { $sum: '$issuedCopies' },
            damagedCopies: { $sum: '$damagedCopies' },
            lostCopies: { $sum: '$lostCopies' },
          },
        },
      ]),
      // Low stock books (< lowStockThreshold and > 0)
      Inventory.find({
        isDeleted: false,
        availableCopies: { $gt: 0 },
        $expr: { $lte: ['$availableCopies', '$lowStockThreshold'] },
      })
        .populate('book', 'title isbn author shelfLocation image')
        .limit(6),
      // Out of stock books count
      Inventory.countDocuments({ isDeleted: false, availableCopies: 0 }),
      // 5 most recent inventory activity transactions
      InventoryTransaction.find()
        .sort({ createdAt: -1 })
        .limit(5)
        .populate('book', 'title isbn author image')
        .populate('performedBy', 'name email'),
    ]);

    const totalPurchases = purchaseAgg.length > 0 ? purchaseAgg[0].count : 0;
    const purchaseRevenue = purchaseAgg.length > 0 ? purchaseAgg[0].revenue : 0;
    const fineCollected = fineCollectedAgg.length > 0 ? fineCollectedAgg[0].totalCollected : 0;
    const totalFinesGenerated = totalFinesAgg.length > 0 ? totalFinesAgg[0].totalFineGenerated : 0;
    const outstandingFines = Math.max(0, totalFinesGenerated - fineCollected);

    const inv = invAgg.length > 0 ? invAgg[0] : {};
    const totalPhysicalCopies = inv.totalPhysicalCopies || totalBooks;
    const totalAvailableCopies = inv.availableCopies !== undefined ? inv.availableCopies : availableBooks;
    const totalIssuedCopies = inv.issuedCopies || issuedBooks;
    const totalDamagedCopies = inv.damagedCopies || 0;
    const totalLostCopies = inv.lostCopies || 0;

    res.status(200).json({
      success: true,
      data: {
        totalBooks,
        availableBooks,
        issuedBooks,
        totalTitles,
        totalStudents,
        totalCategories,
        overdueBooks,
        recentIssues,
        recentBooks,
        overdueIssues,
        totalPurchases,
        purchaseRevenue,
        outstandingFines,
        fineCollected,
        // Inventory Phase 7 Metrics
        totalPhysicalCopies,
        totalAvailableCopies,
        totalIssuedCopies,
        totalDamagedCopies,
        totalLostCopies,
        lowStockCount: lowStockBooks.length,
        outOfStockCount: outOfStockBooksCount,
        lowStockBooks,
        recentInventoryActivity,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getDashboardStats,
};
