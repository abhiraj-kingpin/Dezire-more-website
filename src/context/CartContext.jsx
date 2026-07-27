import { createContext, useContext, useState } from 'react';
import { useToast } from './ToastContext';

const CartContext = createContext();

export function CartProvider({ children }) {
  const { showToast } = useToast();
  const [cart, setCart] = useState([]);
  // Drawer state lives here (not in Navbar) so any component — e.g. a
  // product card's "Buy Now" button — can open the cart / jump to checkout.
  const [cartOpen, setCartOpen] = useState(false);
  const [paymentStep, setPaymentStep] = useState(false);
  // Id of the item most recently added, used to briefly highlight it in the drawer.
  const [lastAddedId, setLastAddedId] = useState(null);

  // opts.silent   — skip the drawer/toast (used for background updates)
  // opts.fromBuy  — internal flag set by buyNow, skips the "added" toast
  // opts.quantity — initial quantity to add (defaults to 1)
  const addToCart = (product, opts = {}) => {
    const { silent = false, fromBuy = false, quantity = 1 } = opts;

    setCart(prev => {
      const existing = prev.find(p => p.id === product.id);
      if (existing) {
        return prev.map(p =>
          p.id === product.id ? { ...p, quantity: p.quantity + quantity } : p
        );
      }
      return [...prev, { ...product, quantity }];
    });

    setLastAddedId(product.id);

    if (!silent) {
      setPaymentStep(false);
      setCartOpen(true);
      if (!fromBuy) showToast('Product added to your Cart', 'cart');
    }
  };

  // Buy Now: add the item then jump straight to the payment step, skipping
  // the cart list entirely.
  const buyNow = (product, quantity = 1) => {
    addToCart(product, { fromBuy: true, quantity });
    showToast('Proceeding to Secure Checkout…', 'checkout');
    setCartOpen(true);
    setPaymentStep(true);
  };

  const removeFromCart = (id) => {
    setCart(prev => prev.filter(p => p.id !== id));
  };

  const updateQuantity = (id, quantity) => {
    if (quantity < 1) return;
    setCart(prev =>
      prev.map(p => p.id === id ? { ...p, quantity } : p)
    );
  };

  const clearCart = () => setCart([]);

  const cartTotal = cart.reduce((sum, p) => sum + p.price * p.quantity, 0);
  const cartCount = cart.reduce((sum, p) => sum + p.quantity, 0);

  return (
    <CartContext.Provider value={{
      cart, addToCart, removeFromCart, updateQuantity, clearCart, cartTotal, cartCount,
      cartOpen, setCartOpen, paymentStep, setPaymentStep, buyNow, lastAddedId,
    }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  return useContext(CartContext);
}
