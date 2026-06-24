# Product Catalog API

Production-ready Node.js/Express/MongoDB backend serving 200,000 products with **cursor-based pagination**.

---
Deployment Status

✅ Frontend deployed successfully on Vercel

https://product-catalog-cursor-pagination.vercel.app

✅ Backend deployed on Render

https://product-catalog-api-gepc.onrender.com
--------------------------------------------------------------------------------------------------------------------------------------
## Table of Contents

1. [Tech Stack](#tech-stack)
2. [Folder Structure](#folder-structure)
3. [Setup](#setup)
4. [Seeding](#seeding)
5. [API Reference](#api-reference)
6. [Cursor Pagination — Deep Dive](#cursor-pagination)
7. [MongoDB Indexes](#mongodb-indexes)
8. [Design Choices — Interview Notes](#design-choices)
9. [Deployment on Render](#deployment)
10. [Postman Examples](#postman-examples)

---

## Tech Stack

| Layer        | Technology              |
|-------------|-------------------------|
| Runtime     | Node.js 18+             |
| Framework   | Express.js 4            |
| Database    | MongoDB Atlas           |
| ODM         | Mongoose 8              |
| Frontend    | React 18 (CRA)          |

---

## Folder Structure

```
project-root/
├── src/
│   ├── config/
│   │   └── db.js                  # MongoDB connection with graceful shutdown
│   ├── controllers/
│   │   └── productController.js   # HTTP layer — parse req, call service, send res
│   ├── services/
│   │   └── productService.js      # Business logic — queries, validation, cursor logic
│   ├── models/
│   │   └── Product.js             # Mongoose schema + compound indexes
│   ├── routes/
│   │   └── productRoutes.js       # Express router
│   ├── middleware/
│   │   └── errorHandler.js        # Global error handler
│   ├── utils/
│   │   └── cursor.js              # encode/decode/build cursor queries
│   ├── scripts/
│   │   └── seedProducts.js        # Batch insert 200k products
│   ├── app.js                     # Express app (middleware stack)
│   └── server.js                  # Entry point — connects DB, starts HTTP server
│
├── frontend/                      # React app (bonus)
│   └── src/
│       ├── hooks/useProducts.js
│       ├── components/ProductCard.js
│       └── App.js
│
├── .env.example
├── package.json
└── README.md
```

---

## Setup

```bash
# 1. Clone and install
git clone <repo>
cd project-root
npm install

# 2. Configure environment
cp .env.example .env
# Edit .env — set your MONGODB_URI from MongoDB Atlas

# 3. Seed the database
npm run seed
# Add --drop to wipe first: node src/scripts/seedProducts.js --drop

# 4. Start the server
npm run dev        # development (nodemon)
npm start          # production
```

### Environment Variables

| Variable       | Description                        | Default |
|---------------|------------------------------------|---------|
| `PORT`        | HTTP port                          | 5000    |
| `MONGODB_URI` | MongoDB Atlas connection string    | —       |
| `NODE_ENV`    | `development` / `production`       | development |

---

## Seeding

```bash
npm run seed                                          # insert 200,000 products
node src/scripts/seedProducts.js --drop               # drop collection first, then seed
```

**How it works:**
- Generates 200,000 documents in-memory in chunks of 2,000
- Uses `insertMany({ ordered: false })` per batch — parallel writes, continues on partial error
- Spreads `updatedAt` over the past 2 years so pagination is meaningful
- After insert, calls `syncIndexes()` to ensure compound indexes exist

---

## API Reference

### `GET /api/products`

Returns a paginated list of products sorted by `updatedAt DESC, _id DESC`.

**Query parameters:**

| Param    | Type   | Description                             | Default |
|---------|--------|-----------------------------------------|---------|
| limit   | number | Products per page (max 100)             | 20      |
| category| string | Filter by category name                 | —       |
| cursor  | string | Opaque pagination token from `nextCursor`| —     |

**Response:**
```json
{
  "success": true,
  "count": 20,
  "nextCursor": "eyJ1cGRhdGVkQXQiOiIyMDI0...",
  "products": [
    {
      "_id": "665a1b2c3d4e5f6789012345",
      "name": "Premium Widget 12345",
      "category": "Electronics",
      "price": 149.99,
      "createdAt": "2024-01-15T10:30:00.000Z",
      "updatedAt": "2024-06-01T08:00:00.000Z"
    }
  ]
}
```

When `nextCursor` is `null`, you are on the last page.

---

### `GET /api/products/categories`

```json
{
  "success": true,
  "categories": ["Electronics", "Clothing", "Books", ...]
}
```

---

### `POST /api/products`

Create a product.

**Body:**
```json
{
  "name": "Smart Gadget Pro",
  "category": "Electronics",
  "price": 299.00
}
```

**Response:** `201 Created`
```json
{ "success": true, "product": { ... } }
```

---

### `PUT /api/products/:id`

Update a product. Send only the fields you want to change.

**Body:**
```json
{ "price": 249.00 }
```

**Response:** `200 OK`
```json
{ "success": true, "product": { ... } }
```

---

### `GET /health`

```json
{ "success": true, "status": "ok", "timestamp": "..." }
```

---

## Cursor Pagination

### Why NOT skip/limit?

```
skip(40000) → MongoDB scans 40,000 documents and throws them away.
```

Problems:
1. **Performance degrades linearly** — page 2000 is 2000× slower than page 1
2. **Duplicate records** — if a product is updated between page 1 and page 2, it shifts in the sort order and can appear on both pages
3. **Missing records** — a newly-inserted product can push documents across page boundaries, causing one to be skipped

### How cursor pagination works

We remember our exact position using the sort key values of the last document seen:

```
cursor = base64({ updatedAt: "2024-06-01T08:00:00Z", _id: "665a..." })
```

Next page query:
```js
{
  $or: [
    { updatedAt: { $lt: cursorUpdatedAt } },          // strictly earlier
    { updatedAt: cursorUpdatedAt, _id: { $lt: cursorId } }  // same date, smaller id
  ]
}
```

This is an **index seek** — O(log N) — regardless of which page you're on. No data is scanned or discarded. Insertions/updates to earlier pages are invisible to the cursor.

### Cursor encoding

The cursor payload is `JSON` serialised then `base64url` encoded:
- URL-safe (no `+`, `/`, `=`)
- Opaque to the client (they cannot manipulate it)
- Easily decoded server-side for validation

---

## MongoDB Indexes

```js
// 1. Global pagination (no category filter)
{ updatedAt: -1, _id: -1 }

// 2. Category-filtered pagination
{ category: 1, updatedAt: -1, _id: -1 }
```

**Why compound?**
- Index 1 covers `sort({ updatedAt: -1, _id: -1 })` with no filter — MongoDB can traverse the B-tree in sort order without a blocking sort step
- Index 2 covers `{ category: "Electronics" }` + same sort — the `category` prefix narrows the index subtree, then the suffix maintains sort order
- Without these, MongoDB would do a **collection scan + in-memory sort** on 200,000 documents per query — unacceptably slow

**Check query plan (dev only):**
```js
db.products.find({ category: "Electronics" })
  .sort({ updatedAt: -1, _id: -1 })
  .explain("executionStats")
// Look for: stage: "IXSCAN", not "COLLSCAN"
```

---

## Design Choices — Interview Notes

| Decision | Rationale |
|---------|-----------|
| **MVC + Service layer** | Controller handles HTTP only. Service owns business logic. Easier to unit-test service without spinning up Express. |
| **Cursor pagination** | Stable, O(log N), no duplicates/gaps regardless of concurrent writes. Essential for live data. |
| **Composite cursor (updatedAt + _id)** | `updatedAt` alone has low cardinality (many ties possible). `_id` is globally unique and monotonically increasing, making the composite key a total order. |
| **base64url cursor** | Opaque to clients, URL-safe, cheap to encode/decode. |
| **Batch seed (2,000 docs/batch)** | Stays under MongoDB 16MB BSON limit, keeps memory flat, allows parallel writes within a batch. |
| **`ordered: false` in insertMany** | Continues inserting remaining docs even if one fails (e.g. duplicate key). |
| **Helmet + rate-limit** | Baseline production hardening — sets security headers, prevents brute-force/DoS. |
| **Global error middleware** | All async errors funnel to one place. Consistent error shape for all clients. |

---

## Deployment on Render

1. Push to GitHub
2. Create a new **Web Service** on [render.com](https://render.com)
3. Build command: `npm install`
4. Start command: `npm start`
5. Add environment variables: `MONGODB_URI`, `NODE_ENV=production`
6. MongoDB Atlas: whitelist `0.0.0.0/0` (or Render's static IPs)

---

## Postman Examples

```
# First page
GET http://localhost:5000/api/products?limit=20

# Filtered first page
GET http://localhost:5000/api/products?category=Electronics&limit=20

# Next page using cursor from previous response
GET http://localhost:5000/api/products?category=Electronics&cursor=eyJ1cGRhdGVkQXQiOiIyMDI0...&limit=20

# Create product
POST http://localhost:5000/api/products
Content-Type: application/json
{ "name": "Smart Widget", "category": "Electronics", "price": 199.99 }

# Update product
PUT http://localhost:5000/api/products/665a1b2c3d4e5f6789012345
Content-Type: application/json
{ "price": 149.99 }

# Health check
GET http://localhost:5000/health
```
