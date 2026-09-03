const Issue = require('../models/Issue');
const Book = require('../models/Book');

// @desc    Process return of an issued book
// @route   PUT /api/issues/:id/return
// @access  Private (Admin only)
const returnBook = async (req, res, next) => {
  try {
    const issue = await Issue.findById(req.params.id);

    // 1. Find issue record
    if (!issue) {
      return res.status(404).json({
        success: false,
        message: 'Issue record not found.',
      });
    }

    // 2. Check whether the book was already returned
    if (issue.returnDate !== null || issue.status === 'returned') {
      return res.status(400).json({
        success: false,
        message: `This book was already returned on ${new Date(
          issue.returnDate
        ).toLocaleDateString()}.`,
      });
    }

    const returnDate = new Date();
    issue.returnDate = returnDate;
    issue.status = 'returned';

    // 3. Calculate fine if returned after due date
    const dueDate = new Date(issue.dueDate);
    let fine = 0;
    let daysOverdue = 0;

    if (returnDate > dueDate) {
      const diffTime = returnDate.getTime() - dueDate.getTime();
      daysOverdue = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      const finePerDay = parseFloat(process.env.FINE_PER_DAY || 5);
      fine = daysOverdue * finePerDay;
    }

    issue.fine = fine;
    await issue.save();

    // 4. Increase availableCopies by 1 on Book model
    const book = await Book.findById(issue.book);
    if (book) {
      if (book.availableCopies < book.totalCopies) {
        book.availableCopies += 1;
        await book.save();
      }
    }

    const populatedIssue = await Issue.findById(issue._id)
      .populate('book', 'title author isbn shelfLocation')
      .populate('student', 'name email studentId phone');

    res.status(200).json({
      success: true,
      message:
        fine > 0
          ? `Book returned successfully. Late by ${daysOverdue} day(s). Fine incurred: ₹${fine}.`
          : 'Book returned successfully with zero fine.',
      data: {
        ...populatedIssue.toObject(),
        daysOverdue,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  returnBook,
};
