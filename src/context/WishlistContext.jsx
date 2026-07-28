import { createContext, useContext, useState, useEffect } from 'react';
import { useToast } from './ToastContext';
import { useAuth } from './AuthContext';

const WishlistContext = createContext();

export function WishlistProvider({ children }) {
  const { showToast } = useToast();
  const { user, promptLogin } = useAuth();
  const [wishlist, setWishlist] = useState([]);

  useEffect(() => {
    const onLogout = () => setWishlist([]);
    window.addEventListener('dm:logout', onLogout);
    return () => window.removeEventListener('dm:logout', onLogout);
  }, []);
  // Drawer state lives here (not in Navbar) so any component — e.g. a
  // product card's "Add to Wishlist" button — can open the wishlist drawer.
  const [wishlistOpen, setWishlistOpen] = useState(false);
  // Id of the item most recently added, used to briefly highlight it in the drawer.
  const [lastAddedId, setLastAddedId] = useState(null);

  // Toggle from the small heart icon on a product card / search result.
  // Adding surfaces the drawer + a toast; removing stays quiet so repeatedly
  // un-hearting items doesn't spam the UI.
  const toggleWishlist = (product) => {
    if (!user) { promptLogin('Log in to save items to your wishlist'); return false; }

    const exists = wishlist.some(p => p.id === product.id);
    setWishlist(prev =>
      exists
        ? prev.filter(p => p.id !== product.id)
        : [...prev, product]
    );
    if (!exists) {
      setLastAddedId(product.id);
      setWishlistOpen(true);
      showToast('Added to your Wishlist', 'wishlist');
    }
    return !exists; // true if the item was just added
  };

  // Explicit "Add to Wishlist" action (e.g. from the product detail modal) —
  // always surfaces the drawer with clear feedback, even if already saved.
  const addToWishlist = (product) => {
    if (!user) { promptLogin('Log in to save items to your wishlist'); return false; }

    const exists = wishlist.some(p => p.id === product.id);
    if (!exists) {
      setWishlist(prev => [...prev, product]);
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
