const Inventory = require('../models/Inventory');
const InventoryTransaction = require('../models/InventoryTransaction');
const Book = require('../models/Book');
const User = require('../models/User');
const Issue = require('../models/Issue');
const Purchase = require('../models/Purchase');
const FinePayment = require('../models/FinePayment');

// Helper to convert array of objects into standard RFC-4180 CSV text
const toCSV = (headers, rows) => {
  const headerLine = headers.map((h) => `"${h.label}"`).join(',');
  const rowLines = rows.map((row) =>
    headers
      .map((h) => {
        let val = row[h.key];
        if (val === undefined || val === null) val = '';
        val = String(val).replace(/"/g, '""');
        return `"${val}"`;
      })
      .join(',')
  );
  // Prepend UTF-8 BOM (\uFEFF) so Microsoft Excel opens Unicode and INR currency characters cleanly
  return '\uFEFF' + [headerLine, ...rowLines].join('\r\n');
};

// =========================================================================
// 1. BOOK CATALOG REPORT
// =========================================================================
const getBooksReport = async (req, res, next) => {
  try {
    const { category, search } = req.query;
    const query = { isDeleted: { $ne: true } };

    if (category) query.category = category;
    if (search && search.trim()) {
      const regex = new RegExp(search.trim(), 'i');
      query.$or = [{ title: regex }, { author: regex }, { isbn: regex }];
    }

    const books = await Book.find(query).populate('category', 'name').sort({ title: 1 });

    const rows = books.map((b) => ({
      title: b.title,
      author: b.author,
      isbn: b.isbn,
      category: b.category?.name || 'Uncategorized',
      totalCopies: b.totalCopies,
      availableCopies: b.availableCopies,
      issuedCopies: Math.max(0, b.totalCopies - b.availableCopies),
      purchasePrice: `₹${b.purchasePrice || 0}`,
      status: b.availableCopies > 0 ? 'In Stock' : 'Out of Stock',
    }));

    if (req.query.format === 'csv') {
      const headers = [
        { label: 'Book Title', key: 'title' },
        { label: 'Author', key: 'author' },
        { label: 'ISBN', key: 'isbn' },
        { label: 'Category', key: 'category' },
        { label: 'Total Copies', key: 'totalCopies' },
        { label: 'Available Copies', key: 'availableCopies' },
        { label: 'Issued Copies', key: 'issuedCopies' },
        { label: 'Purchase Price', key: 'purchasePrice' },
        { label: 'Stock Status', key: 'status' },
      ];
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="book-catalog-report-${Date.now()}.csv"`);
      return res.status(200).send(toCSV(headers, rows));
    }

    res.status(200).json({ success: true, count: rows.length, data: rows });
  } catch (error) {
    next(error);
  }
};

// =========================================================================
// 2. ISSUE / CIRCULATION REPORT
// =========================================================================
const getIssuesReport = async (req, res, next) => {
  try {
    const { status, fromDate, toDate } = req.query;
    const query = {};

    if (status) query.status = status;
    if (fromDate || toDate) {
      query.issueDate = {};
      if (fromDate) query.issueDate.$gte = new Date(fromDate);
      if (toDate) query.issueDate.$lte = new Date(toDate);
    }

    const issues = await Issue.find(query)
      .populate('book', 'title isbn')
      .populate('student', 'name studentId libraryCardId email')
      .sort({ issueDate: -1 });

    const rows = issues.map((iss) => ({
      studentName: iss.student?.name || 'Unknown Student',
      studentId: iss.student?.studentId || 'N/A',
      libraryCardId: iss.student?.libraryCardId || 'N/A',
      bookTitle: iss.book?.title || 'Unknown Book',
      isbn: iss.book?.isbn || '—',
      issueDate: iss.issueDate ? new Date(iss.issueDate).toISOString().split('T')[0] : '',
      dueDate: iss.dueDate ? new Date(iss.dueDate).toISOString().split('T')[0] : '',
      returnDate: iss.returnDate ? new Date(iss.returnDate).toISOString().split('T')[0] : '—',
      status: iss.status.toUpperCase(),
      fine: `₹${iss.fine || 0}`,
    }));

    if (req.query.format === 'csv') {
      const headers = [
        { label: 'Student Name', key: 'studentName' },
        { label: 'Student ID', key: 'studentId' },
        { label: 'Library Card ID', key: 'libraryCardId' },
        { label: 'Book Title', key: 'bookTitle' },
        { label: 'ISBN', key: 'isbn' },
        { label: 'Issue Date', key: 'issueDate' },
        { label: 'Due Date', key: 'dueDate' },
        { label: 'Return Date', key: 'returnDate' },
        { label: 'Status', key: 'status' },
        { label: 'Fine', key: 'fine' },
      ];
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="circulation-issues-report-${Date.now()}.csv"`);
      return res.status(200).send(toCSV(headers, rows));
    }

    res.status(200).json({ success: true, count: rows.length, data: rows });
  } catch (error) {
    next(error);
  }
};

// =========================================================================
// 3. OVERDUE LOANS REPORT
// =========================================================================
const getOverdueReport = async (req, res, next) => {
  try {
    const today = new Date();
    const query = {
      status: { $in: ['issued', 'overdue'] },
      dueDate: { $lt: today },
      returnDate: null,
    };

    const overdueIssues = await Issue.find(query)
      .populate('book', 'title isbn')
      .populate('student', 'name studentId libraryCardId email phone')
      .sort({ dueDate: 1 });

    const rows = overdueIssues.map((iss) => {
      const due = new Date(iss.dueDate);
      const diffDays = Math.max(1, Math.ceil((today - due) / (1000 * 60 * 60 * 24)));
      const fineAmount = diffDays * 5; // Standard ₹5/day
      return {
        studentName: iss.student?.name || 'Unknown',
        studentId: iss.student?.studentId || 'N/A',
        libraryCardId: iss.student?.libraryCardId || 'N/A',
        phone: iss.student?.phone || '—',
        bookTitle: iss.book?.title || 'Unknown',
        dueDate: iss.dueDate ? new Date(iss.dueDate).toISOString().split('T')[0] : '',
        daysOverdue: diffDays,
        fineAccrued: `₹${fineAmount}`,
        paymentStatus: iss.finePaid ? 'Settled' : 'Unpaid Penalty',
      };
    });

    if (req.query.format === 'csv') {
      const headers = [
        { label: 'Student Name', key: 'studentName' },
        { label: 'Student ID', key: 'studentId' },
        { label: 'Library Card ID', key: 'libraryCardId' },
        { label: 'Phone', key: 'phone' },
        { label: 'Book Title', key: 'bookTitle' },
        { label: 'Due Date', key: 'dueDate' },
        { label: 'Days Overdue', key: 'daysOverdue' },
        { label: 'Accrued Fine', key: 'fineAccrued' },
        { label: 'Payment Status', key: 'paymentStatus' },
      ];
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="overdue-loans-report-${Date.now()}.csv"`);
      return res.status(200).send(toCSV(headers, rows));
    }

    res.status(200).json({ success: true, count: rows.length, data: rows });
  } catch (error) {
    next(error);
  }
};

// =========================================================================
// 4. MEMBER REGISTRY REPORT
// =========================================================================
const getMembersReport = async (req, res, next) => {
  try {
    const { status } = req.query;
    const query = { role: 'student' };
    if (status !== undefined) query.isActive = status === 'true';

    const students = await User.find(query).sort({ createdAt: -1 });

    const rows = students.map((s) => ({
      libraryCardId: s.libraryCardId || 'N/A',
      studentId: s.studentId || 'N/A',
      name: s.name,
      email: s.email,
      phone: s.phone || '—',
      status: s.isActive ? 'Active' : 'Deactivated',
      registrationDate: s.createdAt ? new Date(s.createdAt).toISOString().split('T')[0] : '',
    }));

    if (req.query.format === 'csv') {
      const headers = [
        { label: 'Library Card ID', key: 'libraryCardId' },
        { label: 'Student ID', key: 'studentId' },
        { label: 'Student Name', key: 'name' },
        { label: 'Email Address', key: 'email' },
        { label: 'Phone', key: 'phone' },
        { label: 'Account Status', key: 'status' },
        { label: 'Registration Date', key: 'registrationDate' },
      ];
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="member-registry-report-${Date.now()}.csv"`);
      return res.status(200).send(toCSV(headers, rows));
    }

    res.status(200).json({ success: true, count: rows.length, data: rows });
  } catch (error) {
    next(error);
  }
};

// =========================================================================
// 5. BOOK PURCHASES REPORT
// =========================================================================
const getPurchasesReport = async (req, res, next) => {
  try {
    const { status, fromDate, toDate } = req.query;
    const query = {};

    if (status) query.status = status;
    if (fromDate || toDate) {
      query.createdAt = {};
      if (fromDate) query.createdAt.$gte = new Date(fromDate);
      if (toDate) query.createdAt.$lte = new Date(toDate);
    }

    const purchases = await Purchase.find(query)
      .populate('book', 'title isbn')
      .populate('student', 'name studentId libraryCardId email')
      .sort({ createdAt: -1 });

    const rows = purchases.map((p) => ({
      studentName: p.student?.name || 'Unknown',
      studentId: p.student?.studentId || 'N/A',
      libraryCardId: p.student?.libraryCardId || 'N/A',
      bookTitle: p.book?.title || 'Unknown Book',
      amount: `₹${p.amount || 0}`,
      purchaseDate: p.createdAt ? new Date(p.createdAt).toISOString().split('T')[0] : '',
      status: p.status.toUpperCase(),
      razorpayOrderId: p.razorpayOrderId || '—',
      razorpayPaymentId: p.razorpayPaymentId || '—',
    }));

    if (req.query.format === 'csv') {
      const headers = [
        { label: 'Student Name', key: 'studentName' },
        { label: 'Student ID', key: 'studentId' },
        { label: 'Library Card ID', key: 'libraryCardId' },
        { label: 'Book Title', key: 'bookTitle' },
        { label: 'Amount', key: 'amount' },
        { label: 'Purchase Date', key: 'purchaseDate' },
        { label: 'Status', key: 'status' },
        { label: 'Razorpay Order ID', key: 'razorpayOrderId' },
        { label: 'Razorpay Payment ID', key: 'razorpayPaymentId' },
      ];
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="book-purchases-report-${Date.now()}.csv"`);
      return res.status(200).send(toCSV(headers, rows));
    }

    res.status(200).json({ success: true, count: rows.length, data: rows });
  } catch (error) {
    next(error);
  }
};

// =========================================================================
// 6. FINE SETTLEMENTS & PAYMENTS REPORT
// =========================================================================
const getFinePaymentsReport = async (req, res, next) => {
  try {
    const { paymentMethod, fromDate, toDate } = req.query;
    const query = {};

    if (paymentMethod) query.paymentMethod = paymentMethod;
    if (fromDate || toDate) {
      query.paymentDate = {};
      if (fromDate) query.paymentDate.$gte = new Date(fromDate);
      if (toDate) query.paymentDate.$lte = new Date(toDate);
    }

    const payments = await FinePayment.find(query)
      .populate('issue')
      .populate('student', 'name studentId libraryCardId email')
      .populate('collectedBy', 'name email')
      .sort({ paymentDate: -1 });

    const rows = payments.map((fp) => ({
      studentName: fp.student?.name || 'Unknown',
      libraryCardId: fp.student?.libraryCardId || 'N/A',
      amount: `₹${fp.amount || 0}`,
      paymentMethod: fp.paymentMethod.toUpperCase(),
      paymentStatus: fp.status.toUpperCase(),
      paymentDate: fp.paymentDate ? new Date(fp.paymentDate).toISOString().split('T')[0] : '',
      collectedBy: fp.collectedBy?.name || (fp.paymentMethod === 'razorpay' ? 'Razorpay Gateway' : 'Admin'),
      transactionRef: fp.razorpayPaymentId || fp.receiptNumber || '—',
    }));

    if (req.query.format === 'csv') {
      const headers = [
        { label: 'Student Name', key: 'studentName' },
        { label: 'Library Card ID', key: 'libraryCardId' },
        { label: 'Amount Paid', key: 'amount' },
        { label: 'Payment Method', key: 'paymentMethod' },
        { label: 'Status', key: 'paymentStatus' },
        { label: 'Payment Date', key: 'paymentDate' },
        { label: 'Collected By', key: 'collectedBy' },
        { label: 'Transaction Ref', key: 'transactionRef' },
      ];
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="fine-payments-report-${Date.now()}.csv"`);
      return res.status(200).send(toCSV(headers, rows));
    }

    res.status(200).json({ success: true, count: rows.length, data: rows });
  } catch (error) {
    next(error);
  }
};

// =========================================================================
// 7. SUMMARY REPORT DASHBOARD KPIS
// =========================================================================
const getReportKpis = async (req, res, next) => {
  try {
    const today = new Date();

    const [
      totalBooks,
      totalMembers,
      totalIssues,
      totalOverdue,
      totalPurchases,
      purchaseRevAgg,
      collectedFineAgg,
      outstandingFineAgg,
    ] = await Promise.all([
      Book.countDocuments({ isDeleted: { $ne: true } }),
      User.countDocuments({ role: 'student' }),
      Issue.countDocuments(),
      Issue.countDocuments({
        status: { $in: ['issued', 'overdue'] },
        dueDate: { $lt: today },
        returnDate: null,
      }),
      Purchase.countDocuments({ status: { $in: ['paid', 'processing', 'fulfilled'] } }),
      Purchase.aggregate([
        { $match: { status: { $in: ['paid', 'processing', 'fulfilled'] } } },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]),
      FinePayment.aggregate([
        { $match: { status: 'paid' } },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]),
      Issue.aggregate([
        { $match: { status: { $in: ['issued', 'overdue'] }, dueDate: { $lt: today }, returnDate: null } },
        { $group: { _id: null, total: { $sum: '$fine' } } },
      ]),
    ]);

    res.status(200).json({
      success: true,
      data: {
        totalBooks,
        totalMembers,
        totalIssues,
        totalOverdue,
        totalPurchases,
        purchaseRevenue: purchaseRevAgg[0]?.total || 0,
        collectedFine: collectedFineAgg[0]?.total || 0,
        outstandingFine: outstandingFineAgg[0]?.total || 0,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Backwards-compatible Inventory Reports
const getInventorySummaryReport = async (req, res, next) => {
  try {
    const items = await Inventory.find({ isDeleted: false })
      .populate({ path: 'book', populate: { path: 'category', select: 'name' } })
      .sort({ 'book.title': 1 });

    const rows = items.map((inv) => ({
      book: inv.book?.title || 'Unknown Title',
      isbn: inv.book?.isbn || '—',
      category: inv.book?.category?.name || 'General',
      total: inv.totalCopies,
      available: inv.availableCopies,
      issued: inv.issuedCopies,
      damaged: inv.damagedCopies,
      lost: inv.lostCopies,
      status: inv.status,
    }));

    if (req.query.format === 'csv') {
      const headers = [
        { label: 'Book Title', key: 'book' },
        { label: 'ISBN', key: 'isbn' },
        { label: 'Category', key: 'category' },
        { label: 'Total Copies', key: 'total' },
        { label: 'Available Copies', key: 'available' },
        { label: 'Issued Copies', key: 'issued' },
        { label: 'Damaged Copies', key: 'damaged' },
        { label: 'Lost Copies', key: 'lost' },
        { label: 'Stock Status', key: 'status' },
      ];
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="inventory-summary-report-${Date.now()}.csv"`);
      return res.status(200).send(toCSV(headers, rows));
    }

    res.status(200).json({ success: true, count: rows.length, data: rows });
  } catch (error) {
    next(error);
  }
};

const getInventoryMovementReport = async (req, res, next) => {
  try {
    const transactions = await InventoryTransaction.find({})
      .populate('book', 'title isbn')
      .populate('performedBy', 'name email')
      .sort({ createdAt: -1 })
      .limit(500);

    const rows = transactions.map((t) => ({
      date: t.createdAt ? new Date(t.createdAt).toISOString().split('T')[0] : '',
      book: t.book?.title || 'Unknown Title',
      isbn: t.book?.isbn || '—',
      transactionType: t.type,
      quantity: t.quantity,
      previousQuantity: t.previousAvailable,
      newQuantity: t.newAvailable,
      reason: t.reason || '',
      admin: t.performedBy?.name || 'System Admin',
    }));

    if (req.query.format === 'csv') {
      const headers = [
        { label: 'Date', key: 'date' },
        { label: 'Book Title', key: 'book' },
        { label: 'ISBN', key: 'isbn' },
        { label: 'Transaction Type', key: 'transactionType' },
        { label: 'Quantity', key: 'quantity' },
        { label: 'Previous Available', key: 'previousQuantity' },
        { label: 'New Available', key: 'newQuantity' },
        { label: 'Audit Reason', key: 'reason' },
        { label: 'Performed By', key: 'admin' },
      ];
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="inventory-movement-report-${Date.now()}.csv"`);
      return res.status(200).send(toCSV(headers, rows));
    }

    res.status(200).json({ success: true, count: rows.length, data: rows });
  } catch (error) {
    next(error);
  }
};

const getLowStockReport = async (req, res, next) => {
  try {
    const inventories = await Inventory.find({ isDeleted: false })
      .populate('book', 'title author isbn publisher shelfLocation')
      .sort({ availableCopies: 1 });

    const lowStockItems = inventories.filter((inv) => inv.availableCopies <= inv.lowStockThreshold);

    const rows = lowStockItems.map((inv) => ({
      book: inv.book?.title || 'Unknown Title',
      isbn: inv.book?.isbn || '—',
      shelfLocation: inv.book?.shelfLocation || 'Main',
      total: inv.totalCopies,
      available: inv.availableCopies,
      threshold: inv.lowStockThreshold,
      deficit: Math.max(0, inv.lowStockThreshold - inv.availableCopies),
    }));

    if (req.query.format === 'csv') {
      const headers = [
        { label: 'Book Title', key: 'book' },
        { label: 'ISBN', key: 'isbn' },
        { label: 'Shelf Location', key: 'shelfLocation' },
        { label: 'Total Copies', key: 'total' },
        { label: 'Available Copies', key: 'available' },
        { label: 'Reorder Threshold', key: 'threshold' },
        { label: 'Units Deficit', key: 'deficit' },
      ];
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="low-stock-report-${Date.now()}.csv"`);
      return res.status(200).send(toCSV(headers, rows));
    }

    res.status(200).json({ success: true, count: rows.length, data: rows });
  } catch (error) {
    next(error);
  }
};

const getLostDamagedReport = async (req, res, next) => {
  try {
    const transactions = await InventoryTransaction.find({ type: { $in: ['DAMAGE', 'LOST'] } })
      .populate('book', 'title isbn')
      .populate('performedBy', 'name email')
      .sort({ createdAt: -1 });

    const rows = transactions.map((t) => ({
      date: t.createdAt ? new Date(t.createdAt).toISOString().split('T')[0] : '',
      book: t.book?.title || 'Unknown Title',
      isbn: t.book?.isbn || '—',
      type: t.type,
      quantity: t.quantity,
      reason: t.reason || '',
      admin: t.performedBy?.name || 'Admin',
    }));

    if (req.query.format === 'csv') {
      const headers = [
        { label: 'Date', key: 'date' },
        { label: 'Book Title', key: 'book' },
        { label: 'ISBN', key: 'isbn' },
        { label: 'Type', key: 'type' },
        { label: 'Quantity', key: 'quantity' },
        { label: 'Reason', key: 'reason' },
        { label: 'Logged By', key: 'admin' },
      ];
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="lost-damaged-report-${Date.now()}.csv"`);
      return res.status(200).send(toCSV(headers, rows));
    }

    res.status(200).json({ success: true, count: rows.length, data: rows });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getBooksReport,
  getIssuesReport,
  getOverdueReport,
  getMembersReport,
  getPurchasesReport,
  getFinePaymentsReport,
  getReportKpis,
  getInventorySummaryReport,
  getInventoryMovementReport,
  getLowStockReport,
  getLostDamagedReport,
};
