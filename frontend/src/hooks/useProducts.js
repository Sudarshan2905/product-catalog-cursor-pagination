import { useState, useCallback, useRef } from 'react';

const API_BASE = process.env.REACT_APP_API_URL || '/api';

export const useProducts = () => {
  const [products, setProducts] = useState([]);
  const [nextCursor, setNextCursor] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [hasMore, setHasMore] = useState(true);

  // Track current category so we can reset on change
  const categoryRef = useRef(null);

  const fetchProducts = useCallback(async ({ category = '', cursor = null, reset = false } = {}) => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({ limit: 20 });
      if (category) params.set('category', category);
      if (cursor) params.set('cursor', cursor);

      const res = await fetch(`${API_BASE}/products?${params}`);
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.message || `HTTP ${res.status}`);
      }

      const data = await res.json();

      setProducts((prev) => (reset ? data.products : [...prev, ...data.products]));
      setNextCursor(data.nextCursor);
      setHasMore(!!data.nextCursor);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadInitial = useCallback(
    (category) => {
      categoryRef.current = category;
      setProducts([]);
      setNextCursor(null);
      setHasMore(true);
      fetchProducts({ category, cursor: null, reset: true });
    },
    [fetchProducts]
  );

  const loadMore = useCallback(() => {
    if (!nextCursor || loading) return;
    fetchProducts({ category: categoryRef.current, cursor: nextCursor });
  }, [nextCursor, loading, fetchProducts]);

  return { products, loading, error, hasMore, loadInitial, loadMore };
};
