const Book = require('../models/Book');
const User = require('../models/User');
const Category = require('../models/Category');
const Issue = require('../models/Issue');
const Purchase = require('../models/Purchase');
const FinePayment = require('../models/FinePayment');

// @desc    Get system dashboard statistics & summary lists
// @route   GET /api/dashboard
// @access  Private (Admin only)
const getDashboardStats = async (req, res, next) => {
  try {
    const now = new Date();

    // Aggregated book inventory counts
    const bookAggregate = await Book.aggregate([
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
    ] = await Promise.all([
      // Count currently issued copies
      Issue.countDocuments({
        status: { $in: ['issued', 'overdue'] },
        returnDate: null,
      }),
      // Count registered students
      User.countDocuments({ role: 'student' }),
      // Count categories
      Category.countDocuments(),
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
      // 5 most recently added books
      Book.find()
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
        { $match: { status: 'paid' } },
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
    ]);

    const totalPurchases = purchaseAgg.length > 0 ? purchaseAgg[0].count : 0;
    const purchaseRevenue = purchaseAgg.length > 0 ? purchaseAgg[0].revenue : 0;
    const fineCollected = fineCollectedAgg.length > 0 ? fineCollectedAgg[0].totalCollected : 0;
    const totalFinesGenerated = totalFinesAgg.length > 0 ? totalFinesAgg[0].totalFineGenerated : 0;
    const outstandingFines = Math.max(0, totalFinesGenerated - fineCollected);

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
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getDashboardStats,
};
