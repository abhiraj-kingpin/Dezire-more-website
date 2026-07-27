import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useWishlist } from '../context/WishlistContext';
import { useCart } from '../context/CartContext';
import { useSearch } from '../context/SearchContext';
import { useAuth } from '../context/AuthContext';
import UserMenu from './UserMenu';
import FlowingThreads from './FlowingThreads';
import SettingsDrawer from './SettingsDrawer';
import { READY_TO_WEAR_SUBCATEGORIES } from './CategoryPages';
import { useSearch as useSearchAPI } from '../hooks/useProducts';
import useLockBodyScroll from '../hooks/useLockBodyScroll';
import { flyToCart, ripple } from './ProductCard';

function SearchResults({ query, onClose }) {
  const { addToCart } = useCart();
  const { toggleWishlist, isWishlisted } = useWishlist();
  const { results, loading } = useSearchAPI(query);

  if (!query.trim()) {
    return (
      <div className="search-suggestions">
        <p className="search-suggestions-title">Popular Searches</p>
        <div className="search-tags">
          {['Banarasi Silk', 'Bridal Saree', 'Embroidered', 'Organza', 'Chiffon'].map(tag => (
            <span key={tag} className="search-tag">{tag}</span>
          ))}
        </div>
      </div>
    );
  }

  if (loading) return <div className="search-suggestions"><p style={{padding:'20px',color:'var(--text-light)'}}>Searching…</p></div>;

  if (results.length === 0) {
    return (
      <div className="search-no-results">
        <p>No results for "<strong>{query}</strong>"</p>
        <span>Try searching for saree, silk, embroidered, etc.</span>
      </div>
    );
  }

  return (
    <div className="search-results">
      <p className="search-results-count">{results.length} result{results.length !== 1 ? 's' : ''} for "{query}"</p>
      <div className="search-results-grid">
        {results.map(product => {
          const img = product.images?.[0]?.url || product.image || '';
          const discount = product.originalPrice > product.price
            ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
            : 0;
          const id = product._id || product.id;
          const wishlisted = isWishlisted(id);
          return (
            <div key={id} className="search-result-card">
              <div className="search-result-img-wrap">
                <img src={img} alt={product.name} className="search-result-img" />
                <button
                  className={`wishlist-btn ${wishlisted ? 'wishlisted' : ''}`}
                  onClick={() => toggleWishlist({ ...product, id, image: img })}
                >
                  <svg viewBox="0 0 24 24">
                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                  </svg>
                </button>
              </div>
              <div className="search-result-info">
                <p className="search-result-material">{product.fabric || 'Dezire More'}</p>
                <p className="search-result-name">{product.name}</p>
                <div className="search-result-price">
                  <span className="price-now">₹{product.price.toLocaleString('en-IN')}</span>
                  {product.originalPrice > 0 && <span className="price-was">₹{product.originalPrice.toLocaleString('en-IN')}</span>}
                  {discount > 0 && <span className="price-discount">{discount}% off</span>}
                </div>
                <button
                  className="add-to-bag"
                  onClick={(e) => {
                    ripple(e.currentTarget);
                    const imgEl = e.currentTarget.closest('.search-result-card')?.querySelector('.search-result-img');
                    flyToCart(imgEl);
                    addToCart({ ...product, id, image: img });
                    onClose();
                  }}
                >
                  Add to Bag
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Navbar() {
  const [authOpen, setAuthOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('login');
  const [paymentMethod, setPaymentMethod] = useState('');
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [lastOrderId, setLastOrderId] = useState('');
  const [categoriesOpen, setCategoriesOpen] = useState(false);
  const [readyToWearOpen, setReadyToWearOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
    setCategoriesOpen(false);
    setReadyToWearOpen(false);
  };

  useEffect(() => {
    document.body.style.overflow = mobileMenuOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [mobileMenuOpen]);

  const { user, login, signup, loading, error, setError } = useAuth();

  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [signupFirstName, setSignupFirstName] = useState('');
  const [signupLastName, setSignupLastName] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPhone, setSignupPhone] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  // Signup delivery address (new)
  const [signupAddress, setSignupAddress] = useState('');
  const [signupCity, setSignupCity] = useState('');
  const [signupState, setSignupState] = useState('');
  const [signupPin, setSignupPin] = useState('');

  const { wishlist, toggleWishlist, wishlistOpen, setWishlistOpen, lastAddedId } = useWishlist();
  const {
    cart, addToCart, removeFromCart, updateQuantity, clearCart, cartTotal, cartCount,
    cartOpen, setCartOpen, paymentStep, setPaymentStep,
  } = useCart();
  const { searchOpen, setSearchOpen, searchQuery, setSearchQuery } = useSearch();

  useLockBodyScroll(cartOpen || wishlistOpen || authOpen || settingsOpen || searchOpen);

  // Esc closes whichever overlay is currently open, most-specific first.
  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key !== 'Escape') return;
      if (searchOpen) { setSearchOpen(false); setSearchQuery(''); return; }
      if (authOpen) { setAuthOpen(false); setError(''); return; }
      if (settingsOpen) { setSettingsOpen(false); return; }
      if (cartOpen) {
        if (paymentStep) setPaymentStep(false);
        else setCartOpen(false);
        return;
      }
      if (wishlistOpen) { setWishlistOpen(false); return; }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  });

  // Listens for the "fly to cart" signal dispatched by product cards/modals
  // on Add to Cart, and animates a clone of the product image flying into
  // the cart icon, followed by a cart bounce.
  useEffect(() => {
    const handler = (e) => {
      const cartBtn = document.getElementById('nav-cart-icon');
      if (!cartBtn) return;
      const { src, rect } = e.detail || {};

      const bounce = () => {
        cartBtn.classList.remove('cart-bounce');
        // Force reflow so the animation can re-trigger on rapid clicks.
        void cartBtn.offsetWidth;
        cartBtn.classList.add('cart-bounce');
        setTimeout(() => cartBtn.classList.remove('cart-bounce'), 550);
      };

      if (src && rect) {
        const targetRect = cartBtn.getBoundingClientRect();
        const flyer = document.createElement('img');
        flyer.src = src;
        flyer.alt = '';
        flyer.className = 'flying-cart-image';
        flyer.style.left = `${rect.left}px`;
        flyer.style.top = `${rect.top}px`;
        flyer.style.width = `${rect.width}px`;
        flyer.style.height = `${rect.height}px`;
        flyer.style.opacity = '1';
        document.body.appendChild(flyer);

        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            const dx = (targetRect.left + targetRect.width / 2) - (rect.left + rect.width / 2);
            const dy = (targetRect.top + targetRect.height / 2) - (rect.top + rect.height / 2);
            flyer.style.width = '18px';
            flyer.style.height = '18px';
            flyer.style.borderRadius = '50%';
            flyer.style.opacity = '0.15';
            flyer.style.transform = `translate(${dx}px, ${dy}px)`;
          });
        });

        setTimeout(() => {
          flyer.remove();
          bounce();
        }, 560);
      } else {
        bounce();
      }
    };
    window.addEventListener('dm:fly-to-cart', handler);
    return () => window.removeEventListener('dm:fly-to-cart', handler);
  }, []);

  // Checkout delivery address (controlled, pre-filled from account if available)
  const [checkoutName, setCheckoutName] = useState('');
  const [checkoutPhone, setCheckoutPhone] = useState('');
  const [checkoutAddress, setCheckoutAddress] = useState('');
  const [checkoutCity, setCheckoutCity] = useState('');
  const [checkoutState, setCheckoutState] = useState('');
  const [checkoutPin, setCheckoutPin] = useState('');
  const [upiIdInput, setUpiIdInput] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');

  useEffect(() => {
    if (user) {
      setCheckoutName(`${user.firstName || ''} ${user.lastName || ''}`.trim());
      setCheckoutPhone(user.phone || '');
      setCheckoutAddress(user.address?.line1 || '');
      setCheckoutCity(user.address?.city || '');
      setCheckoutState(user.address?.state || '');
      setCheckoutPin(user.address?.pin || '');
    }
  }, [user]);

  const DELIVERY_CHARGE = cartTotal >= 1899 ? 0 : 99;
  const finalTotal = cartTotal + DELIVERY_CHARGE;
  const cartSavings = cart.reduce((sum, p) => sum + Math.max(0, (p.originalPrice || p.price) - p.price) * p.quantity, 0);

  // GST breakup shown on the Pay Online (QR) summary — prices are treated
  // as GST-inclusive, so this is an informational split, not an add-on.
  const GST_RATE = 0.05;
  const gstAmount = Math.round(cartTotal - cartTotal / (1 + GST_RATE));
  const taxableValue = cartTotal - gstAmount;

  // Placeholder UPI ID — replace with the real business UPI ID when ready.
  const OWNER_UPI_ID = 'deziremore@ybl';
  const upiPayString = `upi://pay?pa=${OWNER_UPI_ID}&pn=${encodeURIComponent('Dezire More')}&am=${finalTotal}&cu=INR&tn=${encodeURIComponent('Dezire More Order')}`;
  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(upiPayString)}`;

  const handleLogin = async (e) => {
    e.preventDefault();
    const result = await login(loginEmail, loginPassword);
    if (result.success) {
      setAuthOpen(false);
      setLoginEmail('');
      setLoginPassword('');
    }
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    if (!agreedToTerms) {
      setError('Please agree to the Terms & Privacy Policy');
      return;
    }
    const result = await signup(signupFirstName, signupLastName, signupEmail, signupPhone, signupPassword, {
      line1: signupAddress, city: signupCity, state: signupState, pin: signupPin,
    });
    if (result.success) setAuthOpen(false);
  };

  return (
    <nav style={{ position: 'relative' }}>
      <FlowingThreads />

      <button
        className="nav-hamburger"
        aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
        onClick={() => setMobileMenuOpen(prev => !prev)}
      >
        {mobileMenuOpen ? (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        ) : (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="3" y1="6" x2="21" y2="6" />
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        )}
      </button>

      <Link to="/" className="nav-logo" style={{ flexShrink: 0 }}>
        <div className="logo-img-stack">
          <img src="/assets/logo/logo.jpg" alt="Dezire More" className="logo-emblem" />
          <span className="logo-royal-tag">Quintessential Queens</span>
        </div>
        <div className="logo-text">
          <h1>Dezire More</h1>
          <p>Ethnic Elegance. Modern You.</p>
        </div>
      </Link>

      <div className="nav-search-bar" onClick={() => setSearchOpen(true)}>
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
        <span>Search for sarees, dress materials, co-ords...</span>
      </div>

      <div className="nav-icons" style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
        <button aria-label="Search" className="mobile-search-btn" onClick={() => setSearchOpen(true)}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
        </button>

        <button aria-label="Wishlist" onClick={() => setWishlistOpen(true)}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
          </svg>
          {wishlist.length > 0 && <span className="badge">{wishlist.length}</span>}
        </button>

        <button aria-label="Cart" id="nav-cart-icon" onClick={() => { setCartOpen(true); setPaymentStep(false); }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
            <line x1="3" y1="6" x2="21" y2="6" />
            <path d="M16 10a4 4 0 01-8 0" />
          </svg>
          {cartCount > 0 && <span className="badge">{cartCount}</span>}
        </button>

        <button aria-label="Settings" onClick={() => setSettingsOpen(true)}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
          </svg>
        </button>

        {user ? (
          <UserMenu />
        ) : (
          <button className="auth-trigger-btn" onClick={() => { setAuthOpen(true); setActiveTab('login'); setError(''); }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
            <span className="auth-btn-label">Login</span>
          </button>
        )}
      </div>

      {mobileMenuOpen && <div className="nav-mobile-backdrop" onClick={closeMobileMenu} />}

      <ul className={`nav-links ${mobileMenuOpen ? 'mobile-open' : ''}`}>
        <li className={`dropdown ${categoriesOpen ? 'open' : ''}`}>
          <a href="/" onClick={(e) => { e.preventDefault(); setCategoriesOpen(prev => !prev); }}>
            Categories
            <svg className="dropdown-caret" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </a>
          <ul className="dropdown-menu">
            <li><Link to="/sarees" onClick={closeMobileMenu}>Sarees</Link></li>
            <li><Link to="/dress-materials" onClick={closeMobileMenu}>Dress Materials</Link></li>
            <li><Link to="/ready-to-wear" onClick={closeMobileMenu}>Ready to Wear</Link></li>
            <li><Link to="/western-apparels" onClick={closeMobileMenu}>Casual Western</Link></li>
            <li><Link to="/jewelry" onClick={closeMobileMenu}>Jewelry</Link></li>
            <li><Link to="/accessories" onClick={closeMobileMenu}>Accessories</Link></li>
          </ul>
        </li>
        <li><Link to="/dress-materials" onClick={closeMobileMenu}>Dress Materials</Link></li>
        <li className={`dropdown ${readyToWearOpen ? 'open' : ''}`}>
          <a href="/ready-to-wear" onClick={(e) => { e.preventDefault(); setReadyToWearOpen(prev => !prev); }}>
            Ready to Wear
            <svg className="dropdown-caret" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </a>
          <ul className="dropdown-menu dropdown-menu-wide">
            <li><Link to="/ready-to-wear" onClick={closeMobileMenu}>All Ready to Wear</Link></li>
            {READY_TO_WEAR_SUBCATEGORIES.map(s => (
              <li key={s.value}>
                <Link to={`/ready-to-wear?subcategory=${s.value}`} onClick={closeMobileMenu}>{s.label}</Link>
              </li>
            ))}
          </ul>
        </li>
        <li><Link to="/western-apparels" onClick={closeMobileMenu}>Casual Western</Link></li>
        <li><Link to="/jewelry" onClick={closeMobileMenu}>Jewelry</Link></li>
        <li><Link to="/accessories" onClick={closeMobileMenu}>Accessories</Link></li>
        <li className="nav-links-settings">
          <a href="#" onClick={(e) => { e.preventDefault(); closeMobileMenu(); setSettingsOpen(true); }}>Settings</a>
        </li>
      </ul>

      {/* Search Overlay */}
      {searchOpen && (
        <div className="search-overlay" onClick={() => { setSearchOpen(false); setSearchQuery(''); }}>
          <div className="search-box" onClick={e => e.stopPropagation()}>
            <div className="search-header">
              <div className="search-input-wrap">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
                <input
                  className="search-input"
                  type="text"
                  placeholder="Search for sarees, dress materials, co-ords..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  autoFocus
                />
                {searchQuery && (
                  <button className="search-clear" onClick={() => setSearchQuery('')}>✕</button>
                )}
              </div>
              <button className="search-close" onClick={() => { setSearchOpen(false); setSearchQuery(''); }}>Cancel</button>
            </div>
            <SearchResults query={searchQuery} onClose={() => { setSearchOpen(false); setSearchQuery(''); }} />
          </div>
        </div>
      )}

      {/* Wishlist Drawer */}
      {wishlistOpen && (
        <div className="wl-overlay" onClick={() => setWishlistOpen(false)}>
          <div className="wl-drawer" onClick={e => e.stopPropagation()}>
            <div className="wl-header">
              <h3 className="wl-title">My Wishlist ({wishlist.length})</h3>
              <button className="wl-close" onClick={() => setWishlistOpen(false)}>✕</button>
            </div>
            {wishlist.length === 0 ? (
              <div className="wl-empty">
                <span className="wl-empty-icon">♡</span>
                <p>Your wishlist is empty</p>
                <span>Click the heart on any product to save it here</span>
              </div>
            ) : (
              <div className="wl-items">
                {wishlist.map(product => {
                  const discount = product.originalPrice > product.price
                    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
                    : 0;
                  return (
                    <div key={product.id} className={`wl-item ${product.id === lastAddedId ? 'wl-item-highlight' : ''}`}>
                      <img src={product.image} alt={product.name} className="wl-item-img" />
                      <div className="wl-item-info">
                        <p className="wl-item-material">{product.fabric || product.material || 'Dezire More'}</p>
                        <p className="wl-item-name">{product.name}</p>
                        <div className="wl-item-price">
                          <span className="wl-price-now">₹{product.price.toLocaleString('en-IN')}</span>
                          <span className="wl-price-was">₹{product.originalPrice.toLocaleString('en-IN')}</span>
                          {discount > 0 && <span className="wl-discount">{discount}% off</span>}
                        </div>
                        <button
                          className="wl-add-cart"
                          onClick={(e) => {
                            ripple(e.currentTarget);
                            const imgEl = e.currentTarget.closest('.wl-item')?.querySelector('.wl-item-img');
                            flyToCart(imgEl);
                            addToCart(product);
                            setWishlistOpen(false);
                          }}
                        >
                          Add to Bag
                        </button>
                      </div>
                      <button className="wl-remove" onClick={() => toggleWishlist(product)} aria-label="Remove from wishlist">✕</button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Cart Modal — centered, always-dark "premium boutique" cart */}
      {cartOpen && !paymentStep && !orderPlaced && (
        <div className="cart-modal-overlay" onClick={() => setCartOpen(false)}>
          <div className="cart-modal-v2" onClick={e => e.stopPropagation()}>
            <div className="cm-header">
              <div className="cm-header-left">
                <span className="cm-bag-icon" aria-hidden="true">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
                    <path d="M6 7h12l-1 13H7L6 7Z" />
                    <path d="M9 7V5a3 3 0 0 1 6 0v2" />
                  </svg>
                </span>
                <div>
                  <h3 className="cm-title">My Cart <span className="cm-count">{cartCount}</span></h3>
                  <p className="cm-subtitle">Review your items before checkout</p>
                </div>
              </div>
              <button className="cm-close" onClick={() => setCartOpen(false)} aria-label="Close cart">✕</button>
            </div>

            {cart.length === 0 ? (
              <div className="wl-empty">
                <span className="wl-empty-icon">🛍</span>
                <p>Your cart is empty</p>
                <span>Add items to get started</span>
              </div>
            ) : (
              <div className="cm-body">
                <div className="cm-items">
                  {cart.map(product => {
                    const discount = product.originalPrice > product.price
                      ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
                      : 0;
                    return (
                      <div key={product.id} className={`cm-item ${product.id === lastAddedId ? 'wl-item-highlight' : ''}`}>
                        <img src={product.image} alt={product.name} className="cm-item-img" />
                        <div className="cm-item-info">
                          <div className="cm-item-top">
                            <p className="cm-item-name">{product.name}</p>
                            <div className="cm-item-actions">
                              <button className="cm-icon-btn" onClick={() => toggleWishlist(product)} aria-label="Save for later" title="Save for later">
                                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                                  <path d="M12 21s-7.5-4.9-10-9.3C.6 8.2 2.3 4.7 5.8 4.1 8 3.7 10 4.7 12 7c2-2.3 4-3.3 6.2-2.9 3.5.6 5.2 4.1 3.8 7.6C19.5 16.1 12 21 12 21Z" />
                                </svg>
                              </button>
                              <button className="cm-icon-btn" onClick={() => removeFromCart(product.id)} aria-label="Remove item" title="Remove">
                                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                                  <path d="M4 7h16M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2m-8 0 1 13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1l1-13" />
                                </svg>
                              </button>
                            </div>
                          </div>
                          <p className="cm-item-material">{product.fabric || product.material || 'Alloy base, handcrafted finish'}</p>
                          {product.selectedSize && <p className="cm-item-size">Size: {product.selectedSize}</p>}
                          <span className="cm-badge">
                            <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2 2 9l10 13L22 9 12 2Z"/></svg>
                            Premium Collection
                          </span>
                          <div className="cm-item-bottom">
                            <div className="cm-item-price">
                              <span className="cm-price-now">₹{product.price.toLocaleString('en-IN')}</span>
                              {discount > 0 && (
                                <>
                                  <span className="cm-price-was">₹{product.originalPrice.toLocaleString('en-IN')}</span>
                                  <span className="cm-discount">{discount}% OFF</span>
                                </>
                              )}
                            </div>
                            <div className="cart-qty-row cm-qty-row">
                              <button className="cm-qty-btn" onClick={() => updateQuantity(product.id, product.quantity - 1)} aria-label="Decrease quantity">−</button>
                              <span className="cm-qty-num">{product.quantity}</span>
                              <button className="cm-qty-btn" onClick={() => updateQuantity(product.id, product.quantity + 1)} aria-label="Increase quantity">+</button>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="cm-summary">
                  <h4 className="cm-summary-title">Order Summary</h4>
                  <div className="cm-summary-row">
                    <span>Subtotal ({cartCount} {cartCount === 1 ? 'item' : 'items'})</span>
                    <span>₹{cartTotal.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="cm-summary-row">
                    <span>Shipping</span>
                    <span className={DELIVERY_CHARGE === 0 ? 'cm-free' : ''}>
                      {DELIVERY_CHARGE === 0 ? 'FREE' : `₹${DELIVERY_CHARGE}`}
                    </span>
                  </div>
                  <div className="cm-summary-row">
                    <span>Tax</span>
                    <span>Included</span>
                  </div>
                  {DELIVERY_CHARGE > 0 && (
                    <p className="cart-free-msg cm-free-msg">Add ₹{(1899 - cartTotal).toLocaleString('en-IN')} more for free delivery!</p>
                  )}
                  <div className="cm-summary-divider" />
                  <div className="cm-total-row">
                    <span>TOTAL</span>
                    <span>₹{finalTotal.toLocaleString('en-IN')}</span>
                  </div>
                  {cartSavings > 0 && (
                    <p className="cm-savings">You save ₹{cartSavings.toLocaleString('en-IN')} on this order</p>
                  )}

                  <button className="cm-checkout-btn" onClick={() => setPaymentStep(true)}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="5" y="11" width="14" height="9" rx="1.5"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/></svg>
                    Proceed to Checkout →
                  </button>
                  <button className="cm-continue-btn" onClick={() => setCartOpen(false)}>Continue Shopping</button>
                  <button className="cm-clear-btn" onClick={clearCart}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M4 7h16M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2m-8 0 1 13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1l1-13"/></svg>
                    Clear Cart
                  </button>
                </div>
              </div>
            )}

            {cart.length > 0 && (
              <div className="cm-trust">
                <div className="cm-trust-item">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M12 3 4 6v6c0 5 3.4 8.7 8 9 4.6-.3 8-4 8-9V6l-8-3Z"/></svg>
                  <div><b>Secure Checkout</b><small>100% Protected Payments</small></div>
                </div>
                <div className="cm-trust-item">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M3 12a9 9 0 1 1 3 6.7M3 12v6M3 12h6"/></svg>
                  <div><b>Easy Returns</b><small>3 Day Return Policy</small></div>
                </div>
                <div className="cm-trust-item">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M3 7h11v9H3z"/><path d="M14 10h4l3 3v3h-7z"/><circle cx="7.5" cy="18" r="1.5"/><circle cx="17.5" cy="18" r="1.5"/></svg>
                  <div><b>Free Shipping</b><small>On orders above ₹1899</small></div>
                </div>
              </div>
            )}

            {cart.length > 0 && (
              <div className="cm-payments">
                <span className="cm-ssl">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="5" y="11" width="14" height="9" rx="1.5"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/></svg>
                  256-bit SSL Secured
                </span>
                <span className="cm-pay-icon">VISA</span>
                <span className="cm-pay-icon cm-pay-mc"><i></i><i></i></span>
                <span className="cm-pay-icon">AMEX</span>
                <span className="cm-pay-icon">Razorpay</span>
                <span className="cm-pay-icon">UPI</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Checkout / Payment — premium centered modal, decoupled from the side drawer */}
      {cartOpen && paymentStep && !orderPlaced && (
        <div className="checkout-overlay" onClick={() => setCartOpen(false)}>
          <div className="checkout-modal" onClick={e => e.stopPropagation()}>
            <div className="wl-header checkout-header">
              <button className="cart-back-btn" onClick={() => setPaymentStep(false)}>← Back to Cart</button>
              <h3 className="wl-title">Secure Checkout</h3>
              <button className="wl-close" onClick={() => setCartOpen(false)} aria-label="Close checkout">✕</button>
            </div>
            <div className="payment-body">
              <div className="payment-section">
                <h4 className="payment-section-title">Order Summary</h4>
                {cart.map(p => (
                  <div key={p.id} className="payment-item">
                    <span>{p.name}{p.selectedSize ? ` (${p.selectedSize})` : ''} × {p.quantity}</span>
                    <span>₹{(p.price * p.quantity).toLocaleString('en-IN')}</span>
                  </div>
                ))}
                <div className="payment-item">
                  <span>Delivery</span>
                  <span className={DELIVERY_CHARGE === 0 ? 'cart-free' : ''}>{DELIVERY_CHARGE === 0 ? 'FREE' : `₹${DELIVERY_CHARGE}`}</span>
                </div>
                <div className="payment-item payment-total">
                  <span>Total</span>
                  <span>₹{finalTotal.toLocaleString('en-IN')}</span>
                </div>
              </div>
              <div className="payment-section">
                <h4 className="payment-section-title">Delivery Address</h4>
                <input className="payment-input" type="text" placeholder="Full Name" value={checkoutName} onChange={e => setCheckoutName(e.target.value)} />
                <input className="payment-input" type="tel" placeholder="Phone Number" value={checkoutPhone} onChange={e => setCheckoutPhone(e.target.value)} />
                <input className="payment-input" type="text" placeholder="Address Line 1" value={checkoutAddress} onChange={e => setCheckoutAddress(e.target.value)} />
                <input className="payment-input" type="text" placeholder="City" value={checkoutCity} onChange={e => setCheckoutCity(e.target.value)} />
                <div className="payment-input-row">
                  <input className="payment-input" type="text" placeholder="State" value={checkoutState} onChange={e => setCheckoutState(e.target.value)} />
                  <input className="payment-input" type="text" placeholder="PIN Code" value={checkoutPin} onChange={e => setCheckoutPin(e.target.value)} />
                </div>
              </div>
              <div className="payment-section">
                <h4 className="payment-section-title">Payment Method</h4>
                <div className="payment-methods">
                  {[
                    { key: 'Pay Online (QR)', label: 'Pay Online (QR)', icon: 'qr' },
                    { key: 'UPI', label: 'UPI', icon: 'upi' },
                    { key: 'Credit / Debit Card', label: 'Credit / Debit Card', icon: 'card' },
                    { key: 'Online Banking', label: 'Online Banking', icon: 'bank' },
                    { key: 'COD', label: 'Cash on Delivery', icon: 'cod' },
                  ].map(({ key, label, icon }) => (
                    <label key={key} className={`payment-method-card ${paymentMethod === key ? 'selected' : ''}`}>
                      <input type="radio" name="payment" value={key} checked={paymentMethod === key} onChange={() => setPaymentMethod(key)} style={{ display: 'none' }} />
                      <span className="payment-method-icon">
                        {icon === 'qr' && (
                          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><path d="M14 14h3v3h-3zM20 14v3M14 20h3M20 20v.01"/></svg>
                        )}
                        {icon === 'upi' && (
                          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="5" y="2" width="14" height="20" rx="2"/><line x1="5" y1="18" x2="19" y2="18"/></svg>
                        )}
                        {icon === 'card' && (
                          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg>
                        )}
                        {icon === 'bank' && (
                          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M3 21h18M4 21V10M20 21V10M2 10l10-6 10 6M6 10v6M12 10v6M18 10v6"/></svg>
                        )}
                        {icon === 'cod' && (
                          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="2" y="6" width="20" height="12" rx="2"/><circle cx="12" cy="12" r="3"/></svg>
                        )}
                      </span>
                      <span>{label}</span>
                      {paymentMethod === key && <span className="payment-check">✓</span>}
                    </label>
                  ))}
                </div>

                {paymentMethod === 'Pay Online (QR)' && (
                  <div className="payment-qr-card">
                    <img src={qrImageUrl} alt="Scan to pay" className="payment-qr-img" />
                    <p className="payment-qr-hint">Scan with any UPI app to pay the exact amount</p>
                    <div className="payment-qr-breakup">
                      <div className="payment-item"><span>Taxable Value</span><span>₹{taxableValue.toLocaleString('en-IN')}</span></div>
                      <div className="payment-item"><span>GST (5%)</span><span>₹{gstAmount.toLocaleString('en-IN')}</span></div>
                      <div className="payment-item"><span>Delivery</span><span>{DELIVERY_CHARGE === 0 ? 'FREE' : `₹${DELIVERY_CHARGE}`}</span></div>
                      <div className="payment-item payment-total"><span>Total to Pay</span><span>₹{finalTotal.toLocaleString('en-IN')}</span></div>
                    </div>
                  </div>
                )}
                {paymentMethod === 'UPI' && (
                  <input className="payment-input payment-input-spaced" type="text" placeholder="Enter UPI ID (e.g. name@upi)" value={upiIdInput} onChange={e => setUpiIdInput(e.target.value)} />
                )}
                {paymentMethod === 'Credit / Debit Card' && (
                  <div className="payment-input-spaced">
                    <input className="payment-input" type="text" placeholder="Card Number" value={cardNumber} onChange={e => setCardNumber(e.target.value)} />
                    <div className="payment-input-row">
                      <input className="payment-input" type="text" placeholder="MM/YY" value={cardExpiry} onChange={e => setCardExpiry(e.target.value)} />
                      <input className="payment-input" type="text" placeholder="CVV" value={cardCvv} onChange={e => setCardCvv(e.target.value)} />
                    </div>
                  </div>
                )}
              </div>
              <button
                className="cart-checkout-btn"
                disabled={!paymentMethod}
                onClick={() => {
                  const orderId = 'DZM' + Math.floor(100000 + Math.random() * 900000);
                  setLastOrderId(orderId);
                  setOrderPlaced(true);
                  clearCart();
                }}
              >
                {paymentMethod === 'Pay Online (QR)'
                  ? "I've Completed the Payment →"
                  : `Place Order — ₹${finalTotal.toLocaleString('en-IN')}`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Order Confirmation — centered modal */}
      {cartOpen && orderPlaced && (
        <div className="checkout-overlay" onClick={() => {
          setOrderPlaced(false);
          setCartOpen(false);
          setPaymentStep(false);
          setPaymentMethod('');
        }}>
          <div className="checkout-modal checkout-modal-narrow" onClick={e => e.stopPropagation()}>
            <div className="order-success">
              <div className="order-success-icon">✓</div>
              <h3 className="order-success-title">Order Placed!</h3>
              <p className="order-success-sub">We're preparing your order for dispatch.</p>
              <div className="order-success-card">
                <div className="order-success-row"><span>Order ID</span><span>{lastOrderId}</span></div>
                <div className="order-success-row"><span>Payment</span><span>{paymentMethod}</span></div>
                <div className="order-success-row"><span>Amount Paid</span><span>₹{finalTotal.toLocaleString('en-IN')}</span></div>
                <div className="order-success-status">📦 Status: Dispatching Soon</div>
              </div>
              <p className="order-success-note">A confirmation will be sent to your phone/email shortly.</p>
              <button
                className="cart-checkout-btn"
                onClick={() => {
                  setOrderPlaced(false);
                  setCartOpen(false);
                  setPaymentStep(false);
                  setPaymentMethod('');
                }}
              >
                Continue Shopping
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Auth Modal */}
      {authOpen && (
        <div className="auth-overlay" onClick={() => { setAuthOpen(false); setError(''); }}>
          <div className="auth-modal" onClick={(e) => e.stopPropagation()}>
            <button className="auth-close" onClick={() => { setAuthOpen(false); setError(''); }}>✕</button>
            <div className="auth-tabs">
              <button className={`auth-tab ${activeTab === 'login' ? 'active' : ''}`} onClick={() => { setActiveTab('login'); setError(''); }}>Sign In</button>
              <button className={`auth-tab ${activeTab === 'signup' ? 'active' : ''}`} onClick={() => { setActiveTab('signup'); setError(''); }}>Create Account</button>
            </div>
            {error && <div className="auth-error">⚠ {error}</div>}
            {activeTab === 'login' ? (
              <div className="auth-panel">
                <div className="auth-eyebrow">✦ Welcome back</div>
                <div className="auth-heading">Sign into <em>your account</em></div>
                <label className="auth-label">Email address</label>
                <input className="auth-input" type="email" placeholder="you@example.com" value={loginEmail} onChange={e => setLoginEmail(e.target.value)} />
                <label className="auth-label">Password</label>
                <input className="auth-input" type="password" placeholder="••••••••" value={loginPassword} onChange={e => setLoginPassword(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleLogin(e)} />
                <div className="auth-row">
                  <label className="auth-check"><input type="checkbox" /> Remember me</label>
                  <span className="auth-forgot">Forgot password?</span>
                </div>
                <button className="auth-submit" onClick={handleLogin} disabled={loading}>{loading ? 'Signing in...' : 'Sign In →'}</button>
                <div className="auth-switch">New here? <span onClick={() => { setActiveTab('signup'); setError(''); }}>Create a free account</span></div>
              </div>
            ) : (
              <div className="auth-panel">
                <div className="auth-eyebrow">✦ Join us</div>
                <div className="auth-heading">Create your <em>Dezire More account</em></div>
                <div className="auth-name-row">
                  <div>
                    <label className="auth-label">First name</label>
                    <input className="auth-input" type="text" placeholder="Priya" value={signupFirstName} onChange={e => setSignupFirstName(e.target.value)} />
                  </div>
                  <div>
                    <label className="auth-label">Last name</label>
                    <input className="auth-input" type="text" placeholder="Sharma" value={signupLastName} onChange={e => setSignupLastName(e.target.value)} />
                  </div>
                </div>
                <label className="auth-label">Email address</label>
                <input className="auth-input" type="email" placeholder="you@example.com" value={signupEmail} onChange={e => setSignupEmail(e.target.value)} />
                <label className="auth-label">Phone (optional)</label>
                <input className="auth-input" type="tel" placeholder="+91 98765 43210" value={signupPhone} onChange={e => setSignupPhone(e.target.value)} />
                <label className="auth-label">Password</label>
                <input className="auth-input" type="password" placeholder="Min. 8 characters" value={signupPassword} onChange={e => setSignupPassword(e.target.value)} />

                <div className="auth-divider"><span>Delivery Address</span></div>
                <label className="auth-label">Address line 1</label>
                <input className="auth-input" type="text" placeholder="House no., street, locality" value={signupAddress} onChange={e => setSignupAddress(e.target.value)} />
                <div className="auth-name-row">
                  <div>
                    <label className="auth-label">City</label>
                    <input className="auth-input" type="text" placeholder="City" value={signupCity} onChange={e => setSignupCity(e.target.value)} />
                  </div>
                  <div>
                    <label className="auth-label">State</label>
                    <input className="auth-input" type="text" placeholder="State" value={signupState} onChange={e => setSignupState(e.target.value)} />
                  </div>
                </div>
                <label className="auth-label">PIN code</label>
                <input className="auth-input" type="text" placeholder="110001" value={signupPin} onChange={e => setSignupPin(e.target.value)} />

                <label className="auth-check" style={{ marginTop: '10px' }}>
                  <input type="checkbox" checked={agreedToTerms} onChange={e => setAgreedToTerms(e.target.checked)} />
                  I agree to the <span style={{ color: '#b8902d' }}>Terms & Privacy Policy</span>
                </label>
                <button className="auth-submit" style={{ marginTop: '14px' }} onClick={handleSignup} disabled={loading}>{loading ? 'Creating account...' : 'Create Account →'}</button>
                <div className="auth-switch">Already have an account? <span onClick={() => { setActiveTab('login'); setError(''); }}>Sign in</span></div>
              </div>
            )}
          </div>
        </div>
      )}

      <SettingsDrawer open={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </nav>
  );
}

export default Navbar;