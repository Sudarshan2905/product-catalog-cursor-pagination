const mongoose = require('mongoose');

const CATEGORIES = [
  'Electronics',
  'Clothing',
  'Books',
  'Home & Garden',
  'Sports',
  'Toys',
  'Automotive',
  'Health & Beauty',
  'Food & Grocery',
  'Office Supplies',
];

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Product name is required'],
      trim: true,
      minlength: [2, 'Name must be at least 2 characters'],
      maxlength: [200, 'Name cannot exceed 200 characters'],
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      enum: {
        values: CATEGORIES,
        message: `Category must be one of: ${CATEGORIES.join(', ')}`,
      },
      index: true,
    },
    price: {
      type: Number,
      required: [true, 'Price is required'],
      min: [0, 'Price cannot be negative'],
    },
  },
  {
    timestamps: true, // auto-manages createdAt + updatedAt
    versionKey: false,
  }
);

// ─── Indexes ───────────────────────────────────────────────────────────────────
// Primary pagination index (no category filter)
productSchema.index({ updatedAt: -1, _id: -1 });

// Compound index for category-filtered pagination
productSchema.index({ category: 1, updatedAt: -1, _id: -1 });

const Product = mongoose.model('Product', productSchema);

module.exports = { Product, CATEGORIES };
