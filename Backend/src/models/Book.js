const mongoose = require('mongoose');

const bookSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Book title is required'],
      trim: true,
    },
    author: {
      type: String,
      required: [true, 'Author name is required'],
      trim: true,
    },
    isbn: {
      type: String,
      required: [true, 'ISBN is required'],
      unique: true,
      trim: true,
    },
    publisher: {
      type: String,
      trim: true,
    },
    publicationYear: {
      type: Number,
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      required: [true, 'Category reference is required'],
    },
    totalCopies: {
      type: Number,
      required: [true, 'Total copies is required'],
      min: [0, 'Total copies cannot be negative'],
    },
    availableCopies: {
      type: Number,
      required: [true, 'Available copies is required'],
      min: [0, 'Available copies cannot be negative'],
      validate: {
        validator: function (value) {
          // If totalCopies is defined, availableCopies cannot exceed totalCopies
          if (this.totalCopies !== undefined && value > this.totalCopies) {
            return false;
          }
          return true;
        },
        message: 'Available copies cannot exceed total copies',
      },
    },
    shelfLocation: {
      type: String,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    image: {
      type: String,
      default: '',
    },
    purchasePrice: {
      type: Number,
      default: 0,
      min: [0, 'Purchase price cannot be negative'],
    },
  },
  {
    timestamps: true,
  }
);

bookSchema.set('toJSON', {
  transform: function (doc, ret) {
    delete ret.__v;
    return ret;
  },
});

module.exports = mongoose.model('Book', bookSchema);
