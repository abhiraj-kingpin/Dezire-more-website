import { createContext, useContext, useState, useEffect } from 'react';
import { useToast } from './ToastContext';
import { useAuth } from './AuthContext';
import { BASE } from '../hooks/useProducts';

const WishlistContext = createContext();

export function WishlistProvider({ children }) {
  const { showToast } = useToast();
  const { user, promptLogin, authHeaders } = useAuth();
  const [wishlist, setWishlist] = useState([]);

  useEffect(() => {
    if (!user) return;
    fetch(`${BASE}/auth/wishlist`, { headers: authHeaders() })
      .then(res => res.json())
      .then(data => setWishlist(data?.data || []))
      .catch(() => {});
  }, [user]);

  useEffect(() => {
    const onLogout = () => setWishlist([]);
    window.addEventListener('dm:logout', onLogout);
    return () => window.removeEventListener('dm:logout', onLogout);
  }, []);
  const [wishlistOpen, setWishlistOpen] = useState(false);
  const [lastAddedId, setLastAddedId] = useState(null);

  const persistAdd = (product) => {
    fetch(`${BASE}/auth/wishlist`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify({ productId: product.id }),
    }).catch(() => {});
  };

  const persistRemove = (id) => {
    fetch(`${BASE}/auth/wishlist/${id}`, { method: 'DELETE', headers: authHeaders() }).catch(() => {});
  };

  const toggleWishlist = (product) => {
    if (!user) { promptLogin('Log in to save items to your wishlist'); return false; }

    const exists = wishlist.some(p => p.id === product.id);
    setWishlist(prev =>
      exists
        ? prev.filter(p => p.id !== product.id)
        : [...prev, product]
    );
    if (exists) {
      persistRemove(product.id);
    } else {
      persistAdd(product);
      setLastAddedId(product.id);
      setWishlistOpen(true);
      showToast('Added to your Wishlist', 'wishlist');
    }
    return !exists;
  };

  const addToWishlist = (product) => {
    if (!user) { promptLogin('Log in to save items to your wishlist'); return false; }

    const exists = wishlist.some(p => p.id === product.id);
    if (!exists) {
      setWishlist(prev => [...prev, product]);
      persistAdd(product);
      showToast('Added to your Wishlist', 'wishlist');
    }
    setLastAddedId(product.id);
    setWishlistOpen(true);
    return !exists;
  };

  const isWishlisted = (id) => wishlist.some(p => p.id === id);

  return (
    <WishlistContext.Provider value={{
      wishlist, toggleWishlist, isWishlisted, addToWishlist,
      wishlistOpen, setWishlistOpen, lastAddedId, setLastAddedId,
    }}>
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist() {
  return useContext(WishlistContext);
}
