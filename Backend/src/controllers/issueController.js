const Issue = require('../models/Issue');
const Book = require('../models/Book');
const User = require('../models/User');
const inventoryService = require('../services/inventoryService');

// Helper to check and mark overdue status on the fly
const formatIssueWithOverdue = (issue) => {
  const issueObj = issue.toObject ? issue.toObject() : issue;
  if (!issueObj.returnDate && new Date() > new Date(issueObj.dueDate)) {
    issueObj.isOverdue = true;
    const fineRate = parseFloat(process.env.FINE_PER_DAY || 5);
    const diffTime = Math.abs(new Date() - new Date(issueObj.dueDate));
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    issueObj.estimatedFine = diffDays * fineRate;
  } else {
    issueObj.isOverdue = false;
    issueObj.estimatedFine = 0;
  }
  return issueObj;
};

// @desc    Issue a book to a student
// @route   POST /api/issues
// @access  Private (Admin only)
const issueBook = async (req, res, next) => {
  try {
    const { bookId, studentId, libraryCardId, dueDate } = req.body;

    if (!bookId || (!studentId && !libraryCardId)) {
      return res.status(400).json({
        success: false,
        message: 'Book ID and Student identifier (Student ID or Library Card ID) are required.',
      });
    }

    // 1. Check whether book exists
    const book = await Book.findById(bookId);
    if (!book) {
      return res.status(404).json({
        success: false,
        message: 'Book not found.',
      });
    }

    // 2. Resolve student via Library Card ID or MongoDB Student ID
    let student;
    if (libraryCardId && String(libraryCardId).trim()) {
      student = await User.findOne({
        libraryCardId: String(libraryCardId).trim(),
        role: 'student',
      });
      if (!student) {
        return res.status(404).json({
          success: false,
          message: `No student member found with Library Card ID "${libraryCardId}".`,
        });
      }
    } else {
      student = await User.findById(studentId);
      if (!student || student.role !== 'student') {
        return res.status(404).json({
          success: false,
          message: 'Student member not found.',
        });
      }
    }

    // 3. Check whether student is active
    if (!student.isActive) {
      return res.status(400).json({
        success: false,
        message: 'Cannot issue book. Student account is inactive/deactivated.',
      });
    }

    // 4. Check whether book has available copies
    if (book.availableCopies <= 0) {
      return res.status(400).json({
        success: false,
        message: 'No copies of this book are currently available for issue.',
      });
    }

    // 5. Check whether student already has the SAME book issued
    const alreadyIssued = await Issue.findOne({
      book: bookId,
      student: student._id,
      status: { $in: ['issued', 'overdue'] },
      returnDate: null,
    });

    if (alreadyIssued) {
      return res.status(400).json({
        success: false,
        message: 'This student already has an active copy of this book issued.',
      });
    }

    // Determine due date (default to 14 days from now if not specified)
    let calculatedDueDate;
    if (dueDate) {
      calculatedDueDate = new Date(dueDate);
      if (isNaN(calculatedDueDate.getTime())) {
        return res.status(400).json({
          success: false,
          message: 'Invalid due date format.',
        });
      }
    } else {
      calculatedDueDate = new Date();
      calculatedDueDate.setDate(calculatedDueDate.getDate() + 14);
    }

    // 6. Create issue record
    const issue = await Issue.create({
      book: book._id,
      student: student._id,
      issueDate: new Date(),
      dueDate: calculatedDueDate,
      status: 'issued',
      fine: 0,
    });

    // 7. Update inventory & record ISSUE transaction
    await inventoryService.recordIssue(book._id, issue._id, req.user._id);

    // 8. Return populated success response
    const populatedIssue = await Issue.findById(issue._id)
      .populate('book', 'title author isbn shelfLocation')
      .populate('student', 'name email studentId phone');

    res.status(201).json({
      success: true,
      message: 'Book issued successfully.',
      data: formatIssueWithOverdue(populatedIssue),
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all issues with optional filters
// @route   GET /api/issues
// @access  Private (Admin only)
const getAllIssues = async (req, res, next) => {
  try {
    const { status, student, book, page = 1, limit = 10 } = req.query;

    const query = {};
    if (status) query.status = status;
    if (student) query.student = student;
    if (book) query.book = book;

    const pageNumber = Math.max(1, parseInt(page, 10) || 1);
    const pageSize = Math.max(1, parseInt(limit, 10) || 10);
    const skip = (pageNumber - 1) * pageSize;

    const total = await Issue.countDocuments(query);
    const issues = await Issue.find(query)
      .populate('book', 'title author isbn shelfLocation')
      .populate('student', 'name email studentId phone')
      .sort({ issueDate: -1 })
      .skip(skip)
      .limit(pageSize);

    const formattedIssues = issues.map(formatIssueWithOverdue);

    res.status(200).json({
      success: true,
      count: formattedIssues.length,
      total,
      page: pageNumber,
      totalPages: Math.ceil(total / pageSize) || 1,
      data: formattedIssues,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single issue by ID
// @route   GET /api/issues/:id
// @access  Private (Admin or Student who owns it)
const getIssueById = async (req, res, next) => {
  try {
    const issue = await Issue.findById(req.params.id)
      .populate('book', 'title author isbn shelfLocation')
      .populate('student', 'name email studentId phone');

    if (!issue) {
      return res.status(404).json({
        success: false,
        message: 'Issue record not found.',
      });
    }

    // Access guard: student can only view their own issue
    if (
      req.user.role === 'student' &&
      issue.student._id.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You cannot view other members issue records.',
      });
    }

    res.status(200).json({
      success: true,
      data: formatIssueWithOverdue(issue),
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get active issues
// @route   GET /api/issues/active
// @access  Private (Admin only)
const getActiveIssues = async (req, res, next) => {
  try {
    const issues = await Issue.find({
      status: { $in: ['issued', 'overdue'] },
      returnDate: null,
    })
      .populate('book', 'title author isbn shelfLocation')
      .populate('student', 'name email studentId phone')
      .sort({ issueDate: -1 });

    const formattedIssues = issues.map(formatIssueWithOverdue);

    res.status(200).json({
      success: true,
      count: formattedIssues.length,
      data: formattedIssues,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get overdue issues (dueDate < now AND returnDate is null)
// @route   GET /api/issues/overdue
// @access  Private (Admin only)
const getOverdueIssues = async (req, res, next) => {
  try {
    const now = new Date();
    const issues = await Issue.find({
      dueDate: { $lt: now },
      returnDate: null,
    })
      .populate('book', 'title author isbn shelfLocation')
      .populate('student', 'name email studentId phone')
      .sort({ dueDate: 1 });

    const formattedIssues = issues.map(formatIssueWithOverdue);

    res.status(200).json({
      success: true,
      count: formattedIssues.length,
      data: formattedIssues,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  issueBook,
  getAllIssues,
  getIssueById,
  getActiveIssues,
  getOverdueIssues,
};
