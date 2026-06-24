import React, { useState, useEffect } from 'react';
import { useProducts } from './hooks/useProducts';
import ProductCard from './components/ProductCard';

const CATEGORIES = [
  'Electronics', 'Clothing', 'Books', 'Home & Garden',
  'Sports', 'Toys', 'Automotive', 'Health & Beauty',
  'Food & Grocery', 'Office Supplies',
];

export default function App() {
  const [category, setCategory] = useState('');
  const { products, loading, error, hasMore, loadInitial, loadMore } = useProducts();

  // Fetch on mount and on category change
  useEffect(() => {
    loadInitial(category);
  }, [category, loadInitial]);

  return (
    <div style={styles.root}>
      <header style={styles.header}>
        <div>
          <h1 style={styles.title}>Product Catalog</h1>
          <p style={styles.subtitle}>200,000+ products · Cursor-based pagination</p>
        </div>
        <select
          style={styles.select}
          value={category}
          onChange={(e) => setCategory(e.target.value)}
        >
          <option value="">All Categories</option>
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </header>

      {error && (
        <div style={styles.error}>
          ⚠️ {error}
        </div>
      )}

      <div style={styles.grid}>
        {products.map((p) => (
          <ProductCard key={p._id} product={p} />
        ))}
      </div>

      {loading && (
        <div style={styles.loader}>
          <div style={styles.spinner} />
          <span style={{ color: '#555', marginLeft: 10 }}>Loading...</span>
        </div>
      )}

      {!loading && products.length === 0 && !error && (
        <div style={styles.empty}>No products found.</div>
      )}

      {!loading && hasMore && (
        <div style={styles.loadMoreWrapper}>
          <button style={styles.loadMoreBtn} onClick={loadMore}>
            Load More
          </button>
          <p style={styles.hint}>
            Showing {products.length.toLocaleString()} products
          </p>
        </div>
      )}

      {!loading && !hasMore && products.length > 0 && (
        <p style={styles.endMsg}>
          ✓ All {products.length.toLocaleString()} products loaded
        </p>
      )}
    </div>
  );
}

const styles = {
  root: {
    minHeight: '100vh',
    background: '#0a0a0a',
    color: '#f0f0f0',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    padding: '0 0 60px',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '32px 40px 24px',
    borderBottom: '1px solid #1a1a1a',
    flexWrap: 'wrap',
    gap: 16,
  },
  title: {
    margin: 0,
    fontSize: 26,
    fontWeight: 700,
    letterSpacing: '-0.02em',
  },
  subtitle: {
    margin: '4px 0 0',
    fontSize: 13,
    color: '#555',
  },
  select: {
    background: '#111',
    border: '1px solid #2a2a2a',
    color: '#f0f0f0',
    padding: '10px 16px',
    borderRadius: 8,
    fontSize: 14,
    cursor: 'pointer',
    outline: 'none',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
    gap: 16,
    padding: '28px 40px',
  },
  loader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '32px 0',
  },
  spinner: {
    width: 20,
    height: 20,
    border: '2px solid #222',
    borderTop: '2px solid #4ade80',
    borderRadius: '50%',
    animation: 'spin 0.8s linear infinite',
  },
  error: {
    margin: '20px 40px',
    padding: '14px 20px',
    background: '#2a0a0a',
    border: '1px solid #5a1a1a',
    borderRadius: 8,
    color: '#f87171',
    fontSize: 14,
  },
  empty: {
    textAlign: 'center',
    padding: '60px 0',
    color: '#555',
    fontSize: 15,
  },
  loadMoreWrapper: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 10,
    padding: '8px 0 24px',
  },
  loadMoreBtn: {
    background: '#4ade80',
    color: '#000',
    border: 'none',
    padding: '12px 36px',
    borderRadius: 8,
    fontSize: 15,
    fontWeight: 700,
    cursor: 'pointer',
    letterSpacing: '0.02em',
  },
  hint: {
    margin: 0,
    fontSize: 12,
    color: '#555',
  },
  endMsg: {
    textAlign: 'center',
    color: '#4ade80',
    fontSize: 13,
    padding: '16px 0',
  },
};
