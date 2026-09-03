const mongoose = require('mongoose');

const inventorySchema = new mongoose.Schema(
  {
    book: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Book',
      required: [true, 'Book reference is required'],
      unique: true,
      index: true,
    },
    totalCopies: {
      type: Number,
      default: 0,
      min: [0, 'Total copies cannot be negative'],
    },
    availableCopies: {
      type: Number,
      default: 0,
      min: [0, 'Available copies cannot be negative'],
    },
    issuedCopies: {
      type: Number,
      default: 0,
      min: [0, 'Issued copies cannot be negative'],
    },
    reservedCopies: {
      type: Number,
      default: 0,
      min: [0, 'Reserved copies cannot be negative'],
    },
    damagedCopies: {
      type: Number,
      default: 0,
      min: [0, 'Damaged copies cannot be negative'],
    },
    lostCopies: {
      type: Number,
      default: 0,
      min: [0, 'Lost copies cannot be negative'],
    },
    purchasePrice: {
      type: Number,
      default: 0,
      min: [0, 'Purchase price cannot be negative'],
    },
    lowStockThreshold: {
      type: Number,
      default: 2,
      min: [1, 'Low stock threshold must be at least 1'],
    },
    isDeleted: {
      type: Boolean,
      default: false,
      index: true,
    },
    deletedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Derived virtual for stock status
inventorySchema.virtual('status').get(function () {
  if (this.availableCopies === 0) return 'OUT_OF_STOCK';
  if (this.availableCopies <= this.lowStockThreshold) return 'LOW_STOCK';
  return 'IN_STOCK';
});

// Enforce mathematical invariant rule before save
inventorySchema.pre('save', function (next) {
  const calculatedTotal =
    (this.availableCopies || 0) +
    (this.issuedCopies || 0) +
    (this.reservedCopies || 0) +
    (this.damagedCopies || 0) +
    (this.lostCopies || 0);

  if (this.totalCopies !== calculatedTotal) {
    return next(
      new Error(
        `Inventory consistency error: Total copies (${this.totalCopies}) must equal sum of Available (${this.availableCopies}) + Issued (${this.issuedCopies}) + Reserved (${this.reservedCopies}) + Damaged (${this.damagedCopies}) + Lost (${this.lostCopies}) = ${calculatedTotal}`
      )
    );
  }
  next();
});

inventorySchema.set('toJSON', {
  virtuals: true,
  transform: function (doc, ret) {
    delete ret.__v;
    return ret;
  },
});

inventorySchema.set('toObject', {
  virtuals: true,
});

module.exports = mongoose.model('Inventory', inventorySchema);
