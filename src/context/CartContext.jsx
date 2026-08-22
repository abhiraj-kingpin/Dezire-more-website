import { createContext, useContext, useState, useEffect } from 'react';
import { useToast } from './ToastContext';
import { useAuth } from './AuthContext';

const CartContext = createContext();

function makeCartKey(product) {
  return product.selectedSize ? `${product.id}-${product.selectedSize}` : product.id;
}

export function CartProvider({ children }) {
  const { showToast } = useToast();
  const { user, promptLogin } = useAuth();
  const [cart, setCart] = useState([]);

  useEffect(() => {
    const onLogout = () => setCart([]);
    window.addEventListener('dm:logout', onLogout);
    return () => window.removeEventListener('dm:logout', onLogout);
  }, []);
  const [cartOpen, setCartOpen] = useState(false);
  const [paymentStep, setPaymentStep] = useState(false);
  const [lastAddedId, setLastAddedId] = useState(null);

  const addToCart = (product, opts = {}) => {
    if (!user) { promptLogin('Log in to add items to your cart'); return; }

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
      if (!fromBuy) {
        showToast('Product added to your Cart', 'cart', 3200, {
          image: product.image,
          name: product.name,
          size: product.selectedSize,
          price: product.price,
        });
      }
    }
  };

  const buyNow = (product, quantity = 1) => {
    if (!user) { promptLogin('Log in to continue with your purchase'); return; }

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
