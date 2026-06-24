import React from 'react';

const CATEGORY_COLORS = {
  Electronics: '#3b82f6',
  Clothing: '#8b5cf6',
  Books: '#f59e0b',
  'Home & Garden': '#10b981',
  Sports: '#ef4444',
  Toys: '#f97316',
  Automotive: '#6b7280',
  'Health & Beauty': '#ec4899',
  'Food & Grocery': '#84cc16',
  'Office Supplies': '#06b6d4',
};

const ProductCard = ({ product }) => {
  const color = CATEGORY_COLORS[product.category] || '#6b7280';

  return (
    <div style={styles.card}>
      <div style={{ ...styles.categoryBadge, background: color }}>
        {product.category}
      </div>
      <h3 style={styles.name}>{product.name}</h3>
      <div style={styles.footer}>
        <span style={styles.price}>₹{product.price.toFixed(2)}</span>
        <span style={styles.date}>
          {new Date(product.updatedAt).toLocaleDateString()}
        </span>
      </div>
    </div>
  );
};

const styles = {
  card: {
    background: '#111',
    border: '1px solid #222',
    borderRadius: 12,
    padding: '18px 20px',
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
    transition: 'border-color 0.2s',
  },
  categoryBadge: {
    alignSelf: 'flex-start',
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
    padding: '3px 10px',
    borderRadius: 20,
    color: '#fff',
  },
  name: {
    margin: 0,
    fontSize: 15,
    fontWeight: 600,
    color: '#f0f0f0',
    lineHeight: 1.4,
  },
  footer: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  price: {
    fontSize: 17,
    fontWeight: 700,
    color: '#4ade80',
  },
  date: {
    fontSize: 11,
    color: '#555',
  },
};

export default ProductCard;
