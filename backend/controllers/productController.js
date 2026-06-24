const productService = require('../services/productService');

/**
 * GET /api/products
 * Query: limit, category, cursor
 */
const listProducts = async (req, res, next) => {
  try {
    const { limit, category, cursor } = req.query;
    const data = await productService.getProducts({ limit, category, cursor });

    res.json({
      success: true,
      count: data.products.length,
      nextCursor: data.nextCursor,
      products: data.products,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/products
 * Body: { name, category, price }
 */
const createProduct = async (req, res, next) => {
  try {
    const product = await productService.createProduct(req.body);
    res.status(201).json({ success: true, product });
  } catch (err) {
    next(err);
  }
};

/**
 * PUT /api/products/:id
 * Body: { name?, category?, price? }
 */
const updateProduct = async (req, res, next) => {
  try {
    const product = await productService.updateProduct(req.params.id, req.body);
    res.json({ success: true, product });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/products/categories
 */
const listCategories = (req, res) => {
  res.json({ success: true, categories: productService.getCategories() });
};

module.exports = { listProducts, createProduct, updateProduct, listCategories };
