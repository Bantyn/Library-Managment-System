const FinePayment = require('../models/FinePayment');
const Issue = require('../models/Issue');
const razorpayService = require('../services/razorpayService');

/**
 * Helper: Calculate outstanding fine for a given issue
 */
const getOutstandingFine = async (issue) => {
  const totalCalculatedFine = issue.fine || 0;

  // Sum all paid fine payments for this issue
  const paidPayments = await FinePayment.find({
    issue: issue._id,
    status: 'paid',
  });

  const totalPaid = paidPayments.reduce((sum, p) => sum + (p.amount || 0), 0);
  const outstanding = Math.max(0, totalCalculatedFine - totalPaid);

  return {
    totalCalculatedFine,
    totalPaid,
    outstanding,
    isPaid: outstanding === 0 && totalCalculatedFine > 0,
  };
};

// @desc    Create Razorpay Order for Student Fine Payment
// @route   POST /api/fines/create-order
// @access  Private (Student)
const createFineOrder = async (req, res, next) => {
  try {
    const { issueId } = req.body;

    if (!issueId) {
      return res.status(400).json({
        success: false,
        message: 'Issue record ID is required.',
      });
    }

    const issue = await Issue.findById(issueId).populate('book', 'title');
    if (!issue) {
      return res.status(404).json({
        success: false,
        message: 'Circulation issue record not found.',
      });
    }

    // Ensure student owns this issue
    if (
      req.user.role !== 'admin' &&
      issue.student.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to settle fines for another student.',
      });
    }

    // Verify outstanding fine
    const { totalCalculatedFine, totalPaid, outstanding } = await getOutstandingFine(issue);

    if (outstanding <= 0) {
      return res.status(400).json({
        success: false,
        message: 'No outstanding fine exists for this borrowed book.',
      });
    }

    // Create Razorpay Order
    const receipt = `fine_${Date.now()}`;
    const order = await razorpayService.createOrder({
      amount: outstanding,
      receipt,
      notes: {
        issueId: issue._id.toString(),
        studentId: req.user._id.toString(),
        bookTitle: issue.book?.title || 'Book Loan',
      },
    });

    // Create FinePayment record in pending state
    const finePayment = await FinePayment.create({
      student: req.user._id,
      issue: issue._id,
      amount: outstanding,
      paymentMethod: 'razorpay',
      razorpayOrderId: order.id,
      status: 'pending',
    });

    res.status(201).json({
      success: true,
      message: 'Fine payment order created successfully',
      data: {
        finePaymentId: finePayment._id,
        orderId: order.id,
        amount: order.amount,
        currency: order.currency,
        key_id: order.key_id,
        outstandingFine: outstanding,
        totalFine: totalCalculatedFine,
        bookTitle: issue.book?.title || 'Book Loan',
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Verify Razorpay Payment for Fine
// @route   POST /api/fines/verify
// @access  Private (Student)
const verifyFinePayment = async (req, res, next) => {
  try {
    const { finePaymentId, razorpayOrderId, razorpayPaymentId, razorpaySignature } = req.body;

    if (!razorpayOrderId || !razorpayPaymentId) {
      return res.status(400).json({
        success: false,
        message: 'Missing required Razorpay verification parameters.',
      });
    }

    let payment;
    if (finePaymentId) {
      payment = await FinePayment.findById(finePaymentId);
    } else {
      payment = await FinePayment.findOne({ razorpayOrderId });
    }

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Fine payment record not found.',
      });
    }

    if (payment.status === 'paid') {
      return res.status(200).json({
        success: true,
        message: 'Fine payment has already been verified and settled.',
        data: payment,
      });
    }

    // Verify HMAC-SHA256 signature
    const isValid = razorpayService.verifyPaymentSignature({
      orderId: razorpayOrderId,
      paymentId: razorpayPaymentId,
      signature: razorpaySignature,
    });

    if (!isValid) {
      payment.status = 'failed';
      await payment.save();
      return res.status(400).json({
        success: false,
        message: 'Fine payment signature verification failed.',
      });
    }

    payment.status = 'paid';
    payment.razorpayPaymentId = razorpayPaymentId;
    payment.razorpaySignature = razorpaySignature || '';
    payment.paidAt = new Date();
    await payment.save();

    res.status(200).json({
      success: true,
      message: 'Fine payment verified and settled successfully.',
      data: payment,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Admin On-the-Spot Cash Collection for Fine
// @route   POST /api/fines/:issueId/collect
// @access  Private (Admin only)
const collectCashFine = async (req, res, next) => {
  try {
    const { issueId } = req.params;

    const issue = await Issue.findById(issueId)
      .populate('student', 'name email studentId')
      .populate('book', 'title');

    if (!issue) {
      return res.status(404).json({
        success: false,
        message: 'Issue record not found.',
      });
    }

    // Compute actual outstanding fine
    const { totalCalculatedFine, totalPaid, outstanding } = await getOutstandingFine(issue);

    if (outstanding <= 0) {
      return res.status(400).json({
        success: false,
        message: 'No outstanding fine remaining for this issue.',
      });
    }

    // Create FinePayment record with method = 'cash', status = 'paid'
    const finePayment = await FinePayment.create({
      student: issue.student._id,
      issue: issue._id,
      amount: outstanding,
      paymentMethod: 'cash',
      status: 'paid',
      paidAt: new Date(),
      collectedBy: req.user._id,
    });

    const populatedPayment = await FinePayment.findById(finePayment._id)
      .populate('student', 'name email studentId')
      .populate('collectedBy', 'name email');

    res.status(200).json({
      success: true,
      message: `Cash payment of ₹${outstanding} collected and settled successfully.`,
      data: {
        payment: populatedPayment,
        outstandingFine: 0,
        totalPaid: totalPaid + outstanding,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get Logged-in Student Fine Summary and History
// @route   GET /api/fines/my-fines
// @access  Private (Student)
const getMyFines = async (req, res, next) => {
  try {
    // 1. Get all issues for student
    const issues = await Issue.find({ student: req.user._id })
      .populate('book', 'title author isbn image')
      .sort({ createdAt: -1 });

    // 2. Compute fine breakdown for each issue
    const issueFineSummaries = await Promise.all(
      issues.map(async (issue) => {
        const { totalCalculatedFine, totalPaid, outstanding } = await getOutstandingFine(issue);
        return {
          issueId: issue._id,
          book: issue.book,
          issueDate: issue.issueDate,
          dueDate: issue.dueDate,
          returnDate: issue.returnDate,
          status: issue.status,
          totalCalculatedFine,
          totalPaid,
          outstandingFine: outstanding,
        };
      })
    );

    // 3. Filter only issues with fine activity (fine > 0 or paid > 0)
    const activeFines = issueFineSummaries.filter(
      (item) => item.totalCalculatedFine > 0 || item.totalPaid > 0
    );

    const totalOutstandingAcrossAccount = activeFines.reduce(
      (sum, item) => sum + item.outstandingFine,
      0
    );

    // 4. Get payment ledger records
    const paymentHistory = await FinePayment.find({
      student: req.user._id,
      status: 'paid',
    })
      .populate({
        path: 'issue',
        populate: { path: 'book', select: 'title author isbn image' },
      })
      .populate('collectedBy', 'name')
      .sort({ paidAt: -1 });

    res.status(200).json({
      success: true,
      data: {
        totalOutstanding: totalOutstandingAcrossAccount,
        issuesWithFines: activeFines,
        paymentHistory,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get All Fine Payments (Admin only)
// @route   GET /api/fines
// @access  Private (Admin only)
const getAllFines = async (req, res, next) => {
  try {
    const { status, paymentMethod } = req.query;
    const query = {};

    if (status && status !== 'all') query.status = status;
    if (paymentMethod && paymentMethod !== 'all') query.paymentMethod = paymentMethod;

    const payments = await FinePayment.find(query)
      .populate('student', 'name email studentId phone')
      .populate({
        path: 'issue',
        populate: { path: 'book', select: 'title isbn author image' },
      })
      .populate('collectedBy', 'name email')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: payments.length,
      data: payments,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get Fine Breakdown for Single Issue
// @route   GET /api/fines/:issueId
// @access  Private
const getIssueFineDetails = async (req, res, next) => {
  try {
    const issue = await Issue.findById(req.params.issueId)
      .populate('student', 'name email studentId')
      .populate('book', 'title author isbn');

    if (!issue) {
      return res.status(404).json({
        success: false,
        message: 'Issue record not found.',
      });
    }

    const { totalCalculatedFine, totalPaid, outstanding } = await getOutstandingFine(issue);

    const payments = await FinePayment.find({ issue: issue._id })
      .populate('collectedBy', 'name')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: {
        issue,
        totalCalculatedFine,
        totalPaid,
        outstandingFine: outstanding,
        payments,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createFineOrder,
  verifyFinePayment,
  collectCashFine,
  getMyFines,
  getAllFines,
  getIssueFineDetails,
  getOutstandingFine,
};
