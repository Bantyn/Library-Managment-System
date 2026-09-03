const mongoose = require('mongoose');

const issueSchema = new mongoose.Schema({
  book: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Book',
    required: [true, 'Book reference is required'],
  },
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Student reference is required'],
  },
  issueDate: {
    type: Date,
    default: Date.now,
  },
  dueDate: {
    type: Date,
    required: [true, 'Due date is required'],
  },
  returnDate: {
    type: Date,
    default: null,
  },
  status: {
    type: String,
    enum: ['issued', 'returned', 'overdue'],
    default: 'issued',
  },
  fine: {
    type: Number,
    default: 0,
    min: [0, 'Fine cannot be negative'],
  },
});

issueSchema.set('toJSON', {
  transform: function (doc, ret) {
    delete ret.__v;
    return ret;
  },
});

module.exports = mongoose.model('Issue', issueSchema);
