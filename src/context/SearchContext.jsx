import { createContext, useContext, useState, useEffect, useRef } from 'react';

const SearchContext = createContext();
const BASE = import.meta.env.VITE_API_URL || 'https://dezire-more-website-1.onrender.com/api';

export function SearchProvider({ children }) {
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [allProducts, setAllProducts] = useState([]);
  const [productsLoading, setProductsLoading] = useState(false);
  const fetchedRef = useRef(false);

  useEffect(() => {
    if (fetchedRef.current) return;
    fetchedRef.current = true;
    setProductsLoading(true);
    fetch(`${BASE}/products?limit=500`)
      .then(res => res.json())
      .then(data => setAllProducts(data?.data || []))
      .catch(() => { fetchedRef.current = false; })
      .finally(() => setProductsLoading(false));
  }, []);

  return (
    <SearchContext.Provider value={{
      searchOpen, setSearchOpen, searchQuery, setSearchQuery,
      allProducts, productsLoading,
    }}>
      {children}
    </SearchContext.Provider>
  );
}

export function useSearch() {
  return useContext(SearchContext);
}
