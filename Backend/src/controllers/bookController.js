const Book = require('../models/Book');
const Category = require('../models/Category');
const Issue = require('../models/Issue');
const Inventory = require('../models/Inventory');
const InventoryTransaction = require('../models/InventoryTransaction');
const Purchase = require('../models/Purchase');
const FinePayment = require('../models/FinePayment');
const User = require('../models/User');
const inventoryService = require('../services/inventoryService');

// @desc    Get all books with search, filter, and pagination
// @route   GET /api/books
// @access  Public
const getBooks = async (req, res, next) => {
  try {
    const { search, category, page = 1, limit = 10 } = req.query;

    const query = { isDeleted: { $ne: true } };

    // Basic search across title, author, and ISBN
    if (search && search.trim()) {
      const searchRegex = new RegExp(search.trim(), 'i');
      query.$or = [
        { title: searchRegex },
        { author: searchRegex },
        { isbn: searchRegex },
      ];
    }

    // Filter by category ID
    if (category) {
      query.category = category;
    }

    const pageNumber = Math.max(1, parseInt(page, 10) || 1);
    const pageSize = Math.max(1, parseInt(limit, 10) || 10);
    const skip = (pageNumber - 1) * pageSize;

    const total = await Book.countDocuments(query);
    const books = await Book.find(query)
      .populate('category', 'name description')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(pageSize);

    res.status(200).json({
      success: true,
      count: books.length,
      total,
      page: pageNumber,
      totalPages: Math.ceil(total / pageSize) || 1,
      data: books,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single book by ID
// @route   GET /api/books/:id
// @access  Public
const getBookById = async (req, res, next) => {
  try {
    const book = await Book.findById(req.params.id).populate(
      'category',
      'name description'
    );

    if (!book) {
      return res.status(404).json({
        success: false,
        message: 'Book not found',
      });
    }

    res.status(200).json({
      success: true,
      data: book,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create new book
// @route   POST /api/books
// @access  Private (Admin only)
const createBook = async (req, res, next) => {
  try {
    const {
      title,
      author,
      isbn,
      publisher,
      publicationYear,
      category,
      totalCopies,
      availableCopies,
      shelfLocation,
      description,
    } = req.body;

    // Required field validation
    if (!title || !author || !isbn || !category || totalCopies === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Title, author, ISBN, category, and totalCopies are required.',
      });
    }

    // Verify category exists
    const categoryExists = await Category.findById(category);
    if (!categoryExists) {
      return res.status(400).json({
        success: false,
        message: 'Specified category does not exist.',
      });
    }

    // Check ISBN uniqueness
    const existingIsbn = await Book.findOne({ isbn: isbn.trim() });
    if (existingIsbn) {
      return res.status(400).json({
        success: false,
        message: 'A book with this ISBN already exists.',
      });
    }

    const totalNum = parseInt(totalCopies, 10);
    if (isNaN(totalNum) || totalNum < 0) {
      return res.status(400).json({
        success: false,
        message: 'Total copies must be a non-negative number.',
      });
    }

    // Default availableCopies to totalCopies if not specified
    let availableNum =
      availableCopies !== undefined ? parseInt(availableCopies, 10) : totalNum;

    if (isNaN(availableNum) || availableNum < 0) {
      return res.status(400).json({
        success: false,
        message: 'Available copies must be a non-negative number.',
      });
    }

    if (availableNum > totalNum) {
      return res.status(400).json({
        success: false,
        message: 'Available copies cannot exceed total copies.',
      });
    }

    let imagePath = '';
    if (req.file) {
      imagePath = `/uploads/books/${req.file.filename}`;
    } else if (req.body.image && typeof req.body.image === 'string') {
      imagePath = req.body.image.trim();
    }

    let parsedPurchasePrice = 0;
    if (req.body.purchasePrice !== undefined) {
      parsedPurchasePrice = parseFloat(req.body.purchasePrice);
      if (isNaN(parsedPurchasePrice) || parsedPurchasePrice < 0) {
        return res.status(400).json({
          success: false,
          message: 'Purchase price must be a non-negative number.',
        });
      }
    }

    const book = await Book.create({
      title: title.trim(),
      author: author.trim(),
      isbn: isbn.trim(),
      publisher: publisher ? publisher.trim() : '',
      publicationYear: publicationYear ? parseInt(publicationYear, 10) : undefined,
      category,
      totalCopies: totalNum,
      availableCopies: availableNum,
      shelfLocation: shelfLocation ? shelfLocation.trim() : '',
      description: description ? description.trim() : '',
      image: imagePath,
      purchasePrice: parsedPurchasePrice,
    });

    // Automatically initialize inventory record & initial audit log
    await inventoryService.getOrCreateInventory(book._id);

    const populatedBook = await Book.findById(book._id).populate(
      'category',
      'name description'
    );

    res.status(201).json({
      success: true,
      message: 'Book created successfully',
      data: populatedBook,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update book
// @route   PUT /api/books/:id
// @access  Private (Admin only)
const updateBook = async (req, res, next) => {
  try {
    const book = await Book.findById(req.params.id);
    if (!book) {
      return res.status(404).json({
        success: false,
        message: 'Book not found',
      });
    }

    const {
      title,
      author,
      isbn,
      publisher,
      publicationYear,
      category,
      totalCopies,
      availableCopies,
      shelfLocation,
      description,
      purchasePrice,
      image,
    } = req.body;

    // Check ISBN uniqueness if changed
    if (isbn && isbn.trim() !== book.isbn) {
      const duplicateIsbn = await Book.findOne({
        _id: { $ne: req.params.id },
        isbn: isbn.trim(),
      });
      if (duplicateIsbn) {
        return res.status(400).json({
          success: false,
          message: 'Another book with this ISBN already exists.',
        });
      }
      book.isbn = isbn.trim();
    }

    // Check category if changed
    if (category && category !== book.category.toString()) {
      const categoryExists = await Category.findById(category);
      if (!categoryExists) {
        return res.status(400).json({
          success: false,
          message: 'Specified category does not exist.',
        });
      }
      book.category = category;
    }

    if (title) book.title = title.trim();
    if (author) book.author = author.trim();
    if (publisher !== undefined) book.publisher = publisher.trim();
    if (publicationYear !== undefined)
      book.publicationYear = parseInt(publicationYear, 10);
    if (shelfLocation !== undefined) book.shelfLocation = shelfLocation.trim();
    if (description !== undefined) book.description = description.trim();

    // Image handling
    if (req.file) {
      book.image = `/uploads/books/${req.file.filename}`;
    } else if (image !== undefined) {
      book.image = image.trim();
    }

    // Purchase price handling
    if (purchasePrice !== undefined) {
      const parsedPrice = parseFloat(purchasePrice);
      if (isNaN(parsedPrice) || parsedPrice < 0) {
        return res.status(400).json({
          success: false,
          message: 'Purchase price must be a non-negative number.',
        });
      }
      book.purchasePrice = parsedPrice;
    }

    // Copy count validations
    let newTotal = totalCopies !== undefined ? parseInt(totalCopies, 10) : book.totalCopies;
    let newAvailable = availableCopies !== undefined ? parseInt(availableCopies, 10) : book.availableCopies;

    if (newTotal < 0 || newAvailable < 0) {
      return res.status(400).json({
        success: false,
        message: 'Copy counts cannot be negative.',
      });
    }

    if (newAvailable > newTotal) {
      return res.status(400).json({
        success: false,
        message: 'Available copies cannot exceed total copies.',
      });
    }

    // Ensure total copies is not reduced below currently issued copies
    const issuedCopies = book.totalCopies - book.availableCopies;
    if (newTotal < issuedCopies) {
      return res.status(400).json({
        success: false,
        message: `Cannot reduce total copies below currently issued copies (${issuedCopies} copies are currently on loan).`,
      });
    }

    book.totalCopies = newTotal;
    book.availableCopies = newAvailable;

    await book.save();

    const updatedBook = await Book.findById(book._id).populate(
      'category',
      'name description'
    );

    res.status(200).json({
      success: true,
      message: 'Book updated successfully',
      data: updatedBook,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Soft delete book (Move to Trash)
// @route   DELETE /api/books/:id
// @access  Private (Admin only)
const deleteBook = async (req, res, next) => {
  try {
    const book = await Book.findById(req.params.id);
    if (!book) {
      return res.status(404).json({
        success: false,
        message: 'Book not found',
      });
    }

    if (book.isDeleted) {
      return res.status(400).json({
        success: false,
        message: 'Book is already in trash.',
      });
    }

    // Block if active borrowings exist
    const activeIssues = await Issue.countDocuments({
      book: req.params.id,
      status: { $in: ['issued', 'overdue'] },
    });

    if (activeIssues > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot move to trash. ${activeIssues} copy/copies are currently issued. Return all issued copies first.`,
      });
    }

    book.isDeleted = true;
    book.deletedAt = new Date();
    book.deletedBy = req.user ? req.user._id : null;
    await book.save();

    // Soft-delete the inventory record too
    await Inventory.findOneAndUpdate(
      { book: book._id },
      { isDeleted: true, deletedAt: new Date() }
    );

    res.status(200).json({
      success: true,
      message: 'Book moved to trash successfully. Historical records preserved.',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Restore soft-deleted book from Trash
// @route   PUT /api/books/:id/restore
// @access  Private (Admin only)
const restoreBook = async (req, res, next) => {
  try {
    const book = await Book.findById(req.params.id);
    if (!book) {
      return res.status(404).json({ success: false, message: 'Book not found' });
    }
    if (!book.isDeleted) {
      return res.status(400).json({ success: false, message: 'Book is not in trash.' });
    }

    book.isDeleted = false;
    book.deletedAt = null;
    book.deletedBy = null;
    await book.save();

    // Restore the linked inventory record
    await Inventory.findOneAndUpdate(
      { book: book._id },
      { isDeleted: false, deletedAt: null }
    );

    res.status(200).json({
      success: true,
      message: 'Book restored successfully.',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Permanently delete book from database
// @route   DELETE /api/books/:id/permanent
// @access  Private (Admin only)
const hardDeleteBook = async (req, res, next) => {
  try {
    const book = await Book.findById(req.params.id);
    if (!book) {
      return res.status(404).json({ success: false, message: 'Book not found' });
    }

    // Dependency checks — block if historical references exist
    const [activeIssues, historyIssues, purchases, operationalTxns, fines] = await Promise.all([
      Issue.countDocuments({ book: book._id, status: { $in: ['issued', 'overdue'] } }),
      Issue.countDocuments({ book: book._id }),
      Purchase.countDocuments({ book: book._id }),
      InventoryTransaction.countDocuments({
        book: book._id,
        $or: [
          { type: { $in: ['ISSUE', 'RETURN', 'DAMAGE', 'LOST', 'RECOVERED', 'ADJUSTMENT'] } },
          { referenceId: { $ne: null } },
        ],
      }),
      FinePayment.countDocuments({ issue: { $in: await Issue.distinct('_id', { book: book._id }) } }),
    ]);

    if (activeIssues > 0) {
      return res.status(409).json({
        success: false,
        message: `Cannot permanently delete. ${activeIssues} active issue(s) reference this book. Return all copies first.`,
      });
    }

    if (historyIssues > 0 || purchases > 0 || operationalTxns > 0 || fines > 0) {
      return res.status(409).json({
        success: false,
        message: `Cannot permanently delete. This book has historical records (${historyIssues} issue(s), ${purchases} purchase(s), ${operationalTxns} inventory transaction(s), ${fines} fine payment(s)). Restore or keep in trash to preserve data integrity.`,
      });
    }

    // Safe to hard delete isolated record — clean up inventory & onboarding transactions
    await InventoryTransaction.deleteMany({ book: book._id });
    await Inventory.deleteOne({ book: book._id });
    await Book.deleteOne({ _id: book._id });

    res.status(200).json({
      success: true,
      message: 'Book permanently deleted from database.',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get public live library statistics for Homepage
// @route   GET /api/books/public-stats
// @access  Public
const getPublicStats = async (req, res, next) => {
  try {
    const [totalBooks, totalCategories, stockAgg, activeLoans, totalMembers] = await Promise.all([
      Book.countDocuments({ isDeleted: { $ne: true } }),
      Category.countDocuments({ isDeleted: { $ne: true } }),
      Book.aggregate([
        { $match: { isDeleted: { $ne: true } } },
        {
          $group: {
            _id: null,
            totalAvailable: { $sum: '$availableCopies' },
            totalCopies: { $sum: '$totalCopies' },
          },
        },
      ]),
      Issue.countDocuments({ status: { $in: ['issued', 'overdue'] } }),
      User.countDocuments({ role: 'student', isDeleted: { $ne: true } }),
    ]);

    res.status(200).json({
      success: true,
      data: {
        totalBooks,
        totalCategories,
        totalCopies: stockAgg[0]?.totalCopies || 0,
        availableCopies: stockAgg[0]?.totalAvailable || 0,
        activeLoans,
        totalStudents: totalMembers,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getBooks,
  getBookById,
  getPublicStats,
  createBook,
  updateBook,
  deleteBook,
  restoreBook,
  hardDeleteBook,
};
