const Purchase = require('../models/Purchase');
const Book = require('../models/Book');
const razorpayService = require('../services/razorpayService');

// @desc    Create Razorpay Order for Book Purchase
// @route   POST /api/purchases/create-order
// @access  Private (Student)
const createPurchaseOrder = async (req, res, next) => {
  try {
    const { bookId } = req.body;

    if (!bookId) {
      return res.status(400).json({
        success: false,
        message: 'Book ID is required to initiate purchase.',
      });
    }

    const book = await Book.findById(bookId);
    if (!book) {
      return res.status(404).json({
        success: false,
        message: 'Book not found in library catalog.',
      });
    }

    if (!book.purchasePrice || book.purchasePrice <= 0) {
      return res.status(400).json({
        success: false,
        message: 'This book is not available for purchase (loan only).',
      });
    }

    // Create Razorpay Order via server-side service
    const receipt = `bk_pur_${Date.now()}`;
    const order = await razorpayService.createOrder({
      amount: book.purchasePrice,
      receipt,
      notes: {
        bookId: book._id.toString(),
        studentId: req.user._id.toString(),
        bookTitle: book.title,
      },
    });

    // Create Purchase record in "created" state
    const purchase = await Purchase.create({
      student: req.user._id,
      book: book._id,
      amount: book.purchasePrice,
      razorpayOrderId: order.id,
      status: 'created',
    });

    res.status(201).json({
      success: true,
      message: 'Purchase order created successfully',
      data: {
        purchaseId: purchase._id,
        orderId: order.id,
        amount: order.amount,
        currency: order.currency,
        key_id: order.key_id,
        book: {
          id: book._id,
          title: book.title,
          author: book.author,
          image: book.image,
          purchasePrice: book.purchasePrice,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Verify Razorpay Payment and Mark Purchase as Paid
// @route   POST /api/purchases/verify
// @access  Private (Student)
const verifyPurchase = async (req, res, next) => {
  try {
    const { purchaseId, razorpayOrderId, razorpayPaymentId, razorpaySignature } = req.body;

    if (!razorpayOrderId || !razorpayPaymentId) {
      return res.status(400).json({
        success: false,
        message: 'Missing required payment verification details.',
      });
    }

    let purchase;
    if (purchaseId) {
      purchase = await Purchase.findById(purchaseId);
    } else {
      purchase = await Purchase.findOne({ razorpayOrderId });
    }

    if (!purchase) {
      return res.status(404).json({
        success: false,
        message: 'Purchase record not found for this order.',
      });
    }

    if (purchase.status === 'paid') {
      return res.status(200).json({
        success: true,
        message: 'Payment has already been verified and recorded.',
        data: purchase,
      });
    }

    // Verify HMAC-SHA256 signature
    const isValid = razorpayService.verifyPaymentSignature({
      orderId: razorpayOrderId,
      paymentId: razorpayPaymentId,
      signature: razorpaySignature,
    });

    if (!isValid) {
      purchase.status = 'failed';
      await purchase.save();
      return res.status(400).json({
        success: false,
        message: 'Payment verification failed: invalid signature.',
      });
    }

    purchase.status = 'paid';
    purchase.razorpayPaymentId = razorpayPaymentId;
    purchase.razorpaySignature = razorpaySignature || '';
    purchase.purchaseDate = new Date();
    await purchase.save();

    const populatedPurchase = await Purchase.findById(purchase._id)
      .populate('book', 'title author isbn image purchasePrice')
      .populate('student', 'name email studentId');

    res.status(200).json({
      success: true,
      message: 'Book purchase completed successfully!',
      data: populatedPurchase,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get Logged-in Student Purchases
// @route   GET /api/purchases/my-purchases
// @access  Private (Student)
const getMyPurchases = async (req, res, next) => {
  try {
    const purchases = await Purchase.find({ student: req.user._id })
      .populate('book', 'title author isbn publisher publicationYear image purchasePrice')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: purchases.length,
      data: purchases,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get All Purchases (Admin only)
// @route   GET /api/purchases
// @access  Private (Admin)
const getAllPurchases = async (req, res, next) => {
  try {
    const { status } = req.query;
    const query = {};

    if (status && status !== 'all') {
      query.status = status;
    }

    const purchases = await Purchase.find(query)
      .populate('student', 'name email studentId phone')
      .populate('book', 'title author isbn image purchasePrice')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: purchases.length,
      data: purchases,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get Single Purchase Details
// @route   GET /api/purchases/:id
// @access  Private
const getPurchaseById = async (req, res, next) => {
  try {
    const purchase = await Purchase.findById(req.params.id)
      .populate('student', 'name email studentId phone')
      .populate('book', 'title author isbn image purchasePrice description shelfLocation');

    if (!purchase) {
      return res.status(404).json({
        success: false,
        message: 'Purchase record not found',
      });
    }

    // Only admin or the student owner can view this purchase
    if (
      req.user.role !== 'admin' &&
      purchase.student._id.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this purchase receipt',
      });
    }

    res.status(200).json({
      success: true,
      data: purchase,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createPurchaseOrder,
  verifyPurchase,
  getMyPurchases,
  getAllPurchases,
  getPurchaseById,
};
