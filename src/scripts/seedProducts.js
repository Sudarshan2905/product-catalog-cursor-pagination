/**
 * Seed Script — inserts 200 000 products in batches of 2 000.
 *
 * WHY BATCHES?
 * insertMany with 200 000 docs in a single call would:
 *   • Build a massive 200 K-doc array in memory before any write happens
 *   • Potentially exceed MongoDB's 16 MB BSON document size limit per batch
 *   • Saturate the network in one giant round-trip
 * Batches of 2 000 keep memory low, stay under BSON limits, and let
 * MongoDB pipeline writes efficiently.
 *
 * Usage:
 *   node src/scripts/seedProducts.js
 *   node src/scripts/seedProducts.js --drop   (drop collection first)
 */

require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../config/db');
const { Product, CATEGORIES } = require('../models/Product');

const TOTAL = 200_000;
const BATCH_SIZE = 2_000;

const adjectives = [
  'Premium', 'Ultra', 'Pro', 'Lite', 'Smart', 'Eco', 'Turbo',
  'Compact', 'Deluxe', 'Advanced', 'Portable', 'Wireless', 'Digital',
  'Classic', 'Modern', 'Heavy-Duty', 'High-Performance', 'Budget',
  'Luxe', 'Essential',
];

const nouns = [
  'Widget', 'Gadget', 'Device', 'Tool', 'Kit', 'Set', 'Pack',
  'System', 'Module', 'Unit', 'Component', 'Accessory', 'Bundle',
  'Edition', 'Series', 'Collection', 'Solution', 'Platform',
];

const randomItem = (arr) => arr[Math.floor(Math.random() * arr.length)];

const generateProduct = (i) => ({
  name: `${randomItem(adjectives)} ${randomItem(nouns)} ${i + 1}`,
  category: randomItem(CATEGORIES),
  price: parseFloat((Math.random() * 999 + 1).toFixed(2)),
  // Spread updatedAt over the past 2 years to make pagination meaningful
  createdAt: new Date(Date.now() - Math.random() * 2 * 365 * 24 * 60 * 60 * 1000),
  updatedAt: new Date(Date.now() - Math.random() * 2 * 365 * 24 * 60 * 60 * 1000),
});

const seed = async () => {
  await connectDB();

  const shouldDrop = process.argv.includes('--drop');
  if (shouldDrop) {
    console.log('🗑  Dropping existing products...');
    await Product.deleteMany({});
    console.log('   Done.');
  }

  console.log(`🌱 Seeding ${TOTAL.toLocaleString()} products in batches of ${BATCH_SIZE.toLocaleString()}...`);

  const startTime = Date.now();
  let inserted = 0;

  for (let i = 0; i < TOTAL; i += BATCH_SIZE) {
    const batchDocs = [];
    const end = Math.min(i + BATCH_SIZE, TOTAL);

    for (let j = i; j < end; j++) {
      batchDocs.push(generateProduct(j));
    }

    // ordered: false — continue on error, parallel writes where possible
    await Product.insertMany(batchDocs, { ordered: false });
    inserted += batchDocs.length;

    const pct = ((inserted / TOTAL) * 100).toFixed(1);
    process.stdout.write(`\r   Progress: ${inserted.toLocaleString()} / ${TOTAL.toLocaleString()} (${pct}%)`);
  }

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log(`\n✅ Done! Inserted ${inserted.toLocaleString()} products in ${elapsed}s`);

  // Ensure indexes exist after seeding
  console.log('📑 Syncing indexes...');
  await Product.syncIndexes();
  console.log('   Indexes synced.');

  await mongoose.connection.close();
  console.log('🔌 Connection closed. Seeding complete.');
  process.exit(0);
};

seed().catch((err) => {
  console.error('❌ Seed failed:', err.message);
  process.exit(1);
});
