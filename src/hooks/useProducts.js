
import { useState, useEffect, useCallback } from 'react';

export const BASE = import.meta.env.VITE_API_URL || 'https://dezire-more-website-1.onrender.com/api';

async function fetcher(endpoint, signal) {
  const res = await fetch(`${BASE}${endpoint}`, { signal });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `HTTP ${res.status}`);
  }
  return res.json();
}

export function useProducts(endpoint, deps = []) {
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);

  const run = useCallback(async (signal) => {
    setLoading(true);
    setError(null);
    try {
      setData(await fetcher(endpoint, signal));
    } catch (e) {
      if (e.name !== 'AbortError') setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [endpoint, ...deps]);

  useEffect(() => {
    const ctrl = new AbortController();
    run(ctrl.signal);
    return () => ctrl.abort();
  }, [run]);

  return { data, loading, error, refetch: () => run() };
}

export function useCategory(category, filters = {}) {
  const params = new URLSearchParams(
    Object.entries(filters).filter(([, v]) => v !== undefined && v !== '')
  ).toString();

  const endpoint = `/products/category/${category}${params ? `?${params}` : ''}`;
  const { data, loading, error, refetch } = useProducts(endpoint, [category, JSON.stringify(filters)]);

  return {
    products:   data?.data       || [],
    total:      data?.total      || 0,
    page:       data?.page       || 1,
    totalPages: data?.totalPages || 1,
    loading,
    error,
    refetch,
  };
}

export function useFacets(category) {
  const endpoint = `/products/facets${category ? `?category=${category}` : ''}`;
  const { data, loading } = useProducts(endpoint, [category]);
  return {
    colors:    data?.colors    || [],
    sizes:     data?.sizes     || [],
    fabrics:   data?.fabrics   || [],
    occasions: data?.occasions || [],
    minPrice:  data?.minPrice  ?? 0,
    maxPrice:  data?.maxPrice  ?? 10000,
    loading,
  };
}

export function useTag(tag, filters = {}) {
  const params = new URLSearchParams(
    Object.entries(filters).filter(([, v]) => v !== undefined && v !== '')
  ).toString();

  const endpoint = `/products/tag/${tag}${params ? `?${params}` : ''}`;
  const { data, loading, error, refetch } = useProducts(endpoint, [tag, JSON.stringify(filters)]);

  return {
    products:   data?.data       || [],
    total:      data?.total      || 0,
    page:       data?.page       || 1,
    totalPages: data?.totalPages || 1,
    loading,
    error,
    refetch,
  };
}

export function useProduct(id) {
  const { data, loading, error } = useProducts(`/products/${id}`, [id]);
  return {
    product: data?.product || null,
    related: data?.related || [],
    loading,
    error,
  };
}

export function useHomeData() {
  const { data, loading, error } = useProducts('/products/home');
  return {
    newArrivals: data?.sections?.newArrivals || [],
    bestsellers: data?.sections?.bestsellers || [],
    sale:        data?.sections?.sale        || [],
    stats:       data?.stats                 || {},
    loading,
    error,
  };
}

