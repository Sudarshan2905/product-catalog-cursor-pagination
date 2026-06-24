const mongoose = require('mongoose');
const { Product, CATEGORIES } = require('../models/Product');
const { encodeCursor, decodeCursor, buildCursorQuery } = require('../utils/cursor');

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

// ─── Helpers ──────────────────────────────────────────────────────────────────

const parseLimit = (raw) => {
  const n = parseInt(raw, 10);
  if (isNaN(n) || n < 1) return DEFAULT_LIMIT;
  return Math.min(n, MAX_LIMIT);
};

// ─── Service methods ──────────────────────────────────────────────────────────

/**
 * Fetch a paginated list of products.
 * Sorted by updatedAt DESC, _id DESC.
 * Supports optional category filter and cursor-based pagination.
 */
const getProducts = async ({ limit: rawLimit, category, cursor: cursorStr } = {}) => {
  const limit = parseLimit(rawLimit);

  // Base filter
  const filter = {};

  if (category) {
    if (!CATEGORIES.includes(category)) {
      const err = new Error(`Invalid category. Must be one of: ${CATEGORIES.join(', ')}`);
      err.statusCode = 400;
      throw err;
    }
    filter.category = category;
  }

  // Apply cursor if provided
  if (cursorStr) {
    const cursor = decodeCursor(cursorStr);
    const cursorQuery = buildCursorQuery(cursor);
    Object.assign(filter, cursorQuery);
  }

  const products = await Product.find(filter)
    .sort({ updatedAt: -1, _id: -1 })
    .limit(limit)
    .lean();

  const nextCursor = products.length === limit
    ? encodeCursor(products[products.length - 1])
    : null;

  return { products, nextCursor };
};

/**
 * Create a single product.
 */
const createProduct = async ({ name, category, price }) => {
  if (!name || !category || price === undefined) {
    const err = new Error('name, category, and price are required');
    err.statusCode = 400;
    throw err;
  }

  const product = await Product.create({ name, category, price });
  return product;
};

/**
 * Update a product by ID.
 */
const updateProduct = async (id, updates) => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    const err = new Error('Invalid product ID');
    err.statusCode = 400;
    throw err;
  }

  const allowed = ['name', 'category', 'price'];
  const sanitized = Object.fromEntries(
    Object.entries(updates).filter(([k]) => allowed.includes(k))
  );

  if (Object.keys(sanitized).length === 0) {
    const err = new Error('No valid fields to update');
    err.statusCode = 400;
    throw err;
  }

  const product = await Product.findByIdAndUpdate(
    id,
    sanitized,
    { new: true, runValidators: true }
  );

  if (!product) {
    const err = new Error('Product not found');
    err.statusCode = 404;
    throw err;
  }

  return product;
};

/**
 * Get available categories.
 */
const getCategories = () => CATEGORIES;

module.exports = { getProducts, createProduct, updateProduct, getCategories };
