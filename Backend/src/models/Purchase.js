const mongoose = require('mongoose');

const purchaseSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Student reference is required'],
    },
    book: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Book',
      required: [true, 'Book reference is required'],
    },
    amount: {
      type: Number,
      required: [true, 'Purchase amount is required'],
      min: [0, 'Amount cannot be negative'],
    },
    razorpayOrderId: {
      type: String,
      trim: true,
    },
    razorpayPaymentId: {
      type: String,
      trim: true,
    },
    razorpaySignature: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      enum: ['created', 'paid', 'processing', 'fulfilled', 'failed', 'cancelled'],
      default: 'created',
    },
    purchaseDate: {
      type: Date,
      default: Date.now,
    },
    fulfilledAt: {
      type: Date,
      default: null,
    },
    fulfilledBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

purchaseSchema.set('toJSON', {
  transform: function (doc, ret) {
    delete ret.__v;
    return ret;
  },
});

module.exports = mongoose.model('Purchase', purchaseSchema);
