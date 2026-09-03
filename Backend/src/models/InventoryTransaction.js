const mongoose = require('mongoose');

const inventoryTransactionSchema = new mongoose.Schema(
  {
    book: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Book',
      required: [true, 'Book reference is required'],
      index: true,
    },
    inventory: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Inventory',
      required: [true, 'Inventory reference is required'],
      index: true,
    },
    type: {
      type: String,
      enum: [
        'STOCK_IN',
        'STOCK_OUT',
        'ISSUE',
        'RETURN',
        'DAMAGE',
        'LOST',
        'RECOVERED',
        'ADJUSTMENT',
      ],
      required: [true, 'Transaction type is required'],
      index: true,
    },
    quantity: {
      type: Number,
      required: [true, 'Transaction quantity is required'],
      min: [1, 'Quantity must be at least 1'],
    },
    previousAvailable: {
      type: Number,
      required: true,
    },
    newAvailable: {
      type: Number,
      required: true,
    },
    reason: {
      type: String,
      required: [true, 'Reason for inventory movement is required'],
      trim: true,
    },
    referenceId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
    },
    performedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User performing action is required'],
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

inventoryTransactionSchema.set('toJSON', {
  transform: function (doc, ret) {
    delete ret.__v;
    return ret;
  },
});

module.exports = mongoose.model(
  'InventoryTransaction',
  inventoryTransactionSchema
);
