const express = require('express');
const router = express.Router();
const {
  listProducts,
  createProduct,
  updateProduct,
  listCategories,
} = require('../controllers/productController');

// GET /api/products/categories — must be before /:id to avoid param collision
router.get('/categories', listCategories);

// GET /api/products?limit=20&category=Electronics&cursor=<token>
router.get('/', listProducts);

// POST /api/products
router.post('/', createProduct);

// PUT /api/products/:id
router.put('/:id', updateProduct);

module.exports = router;
