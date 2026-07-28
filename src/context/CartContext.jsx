import { createContext, useContext, useState } from 'react';
import { useToast } from './ToastContext';

const CartContext = createContext();

// A cart line is identified by product id + selected size (so the same
// product in two different sizes is two separate rows), never by the raw
// product id alone. `cartKey` is purely a client-side line identifier for
// React keys / quantity / removal — `id` always stays the real MongoDB
// product id so it can be sent straight through as `productId` on checkout.
function makeCartKey(product) {
  return product.selectedSize ? `${product.id}-${product.selectedSize}` : product.id;
}

export function CartProvider({ children }) {
  const { showToast } = useToast();
  const [cart, setCart] = useState([]);
  // Drawer state lives here (not in Navbar) so any component — e.g. a
  // product card's "Buy Now" button — can open the cart / jump to checkout.
  const [cartOpen, setCartOpen] = useState(false);
  const [paymentStep, setPaymentStep] = useState(false);
  // cartKey of the item most recently added, used to briefly highlight it in the drawer.
  const [lastAddedId, setLastAddedId] = useState(null);

  // opts.silent   — skip the drawer/toast (used for background updates)
  // opts.fromBuy  — internal flag set by buyNow, skips the "added" toast
  // opts.quantity — initial quantity to add (defaults to 1)
  const addToCart = (product, opts = {}) => {
    const { silent = false, fromBuy = false, quantity = 1 } = opts;
    const cartKey = makeCartKey(product);

    setCart(prev => {
      const existing = prev.find(p => p.cartKey === cartKey);
      if (existing) {
        return prev.map(p =>
          p.cartKey === cartKey ? { ...p, quantity: p.quantity + quantity } : p
        );
      }
      return [...prev, { ...product, cartKey, quantity }];
    });

    setLastAddedId(cartKey);

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

  const removeFromCart = (cartKey) => {
    setCart(prev => prev.filter(p => p.cartKey !== cartKey));
  };

  const updateQuantity = (cartKey, quantity) => {
    if (quantity < 1) return;
    setCart(prev =>
      prev.map(p => p.cartKey === cartKey ? { ...p, quantity } : p)
    );
  };

  const updateSize = (cartKey, selectedSize) => {
    setCart(prev =>
      prev.map(p => p.cartKey === cartKey ? { ...p, selectedSize, cartKey: makeCartKey({ ...p, selectedSize }) } : p)
    );
  };

  const clearCart = () => setCart([]);

  const cartTotal = cart.reduce((sum, p) => sum + p.price * p.quantity, 0);
  const cartCount = cart.reduce((sum, p) => sum + p.quantity, 0);

  return (
    <CartContext.Provider value={{
      cart, addToCart, removeFromCart, updateQuantity, updateSize, clearCart, cartTotal, cartCount,
      cartOpen, setCartOpen, paymentStep, setPaymentStep, buyNow, lastAddedId,
    }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  return useContext(CartContext);
}
