const Inventory = require('../models/Inventory');
const InventoryTransaction = require('../models/InventoryTransaction');
const Book = require('../models/Book');

// Helper to convert array of objects into standard CSV text
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
  return [headerLine, ...rowLines].join('\r\n');
};

// @desc    1. Inventory Summary Report
// @route   GET /api/reports/inventory-summary
// @access  Private (Admin only)
const getInventorySummaryReport = async (req, res, next) => {
  try {
    const items = await Inventory.find({ isDeleted: false })
      .populate({
        path: 'book',
        populate: { path: 'category', select: 'name' },
      })
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
      const csv = toCSV(headers, rows);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="inventory-summary-report-${Date.now()}.csv"`
      );
      return res.status(200).send(csv);
    }

    res.status(200).json({
      success: true,
      count: rows.length,
      data: rows,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    2. Inventory Movement Report
// @route   GET /api/reports/inventory-movement
// @access  Private (Admin only)
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
      const csv = toCSV(headers, rows);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="inventory-movement-report-${Date.now()}.csv"`
      );
      return res.status(200).send(csv);
    }

    res.status(200).json({
      success: true,
      count: rows.length,
      data: rows,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    3. Low Stock Report
// @route   GET /api/reports/low-stock
// @access  Private (Admin only)
const getLowStockReport = async (req, res, next) => {
  try {
    const items = await Inventory.find({
      isDeleted: false,
      $expr: { $lte: ['$availableCopies', '$lowStockThreshold'] },
    })
      .populate({
        path: 'book',
        populate: { path: 'category', select: 'name' },
      })
      .sort({ availableCopies: 1 });

    const rows = items.map((inv) => ({
      book: inv.book?.title || 'Unknown Title',
      isbn: inv.book?.isbn || '—',
      category: inv.book?.category?.name || 'General',
      available: inv.availableCopies,
      total: inv.totalCopies,
      threshold: inv.lowStockThreshold,
      status: inv.status,
    }));

    if (req.query.format === 'csv') {
      const headers = [
        { label: 'Book Title', key: 'book' },
        { label: 'ISBN', key: 'isbn' },
        { label: 'Category', key: 'category' },
        { label: 'Available Copies', key: 'available' },
        { label: 'Total Copies', key: 'total' },
        { label: 'Alert Threshold', key: 'threshold' },
        { label: 'Status', key: 'status' },
      ];
      const csv = toCSV(headers, rows);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="low-stock-report-${Date.now()}.csv"`
      );
      return res.status(200).send(csv);
    }

    res.status(200).json({
      success: true,
      count: rows.length,
      data: rows,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    4. Lost / Damaged Report
// @route   GET /api/reports/lost-damaged
// @access  Private (Admin only)
const getLostDamagedReport = async (req, res, next) => {
  try {
    const transactions = await InventoryTransaction.find({
      type: { $in: ['DAMAGE', 'LOST'] },
    })
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
      const csv = toCSV(headers, rows);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="lost-damaged-report-${Date.now()}.csv"`
      );
      return res.status(200).send(csv);
    }

    res.status(200).json({
      success: true,
      count: rows.length,
      data: rows,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getInventorySummaryReport,
  getInventoryMovementReport,
  getLowStockReport,
  getLostDamagedReport,
};
