import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useWishlist } from '../context/WishlistContext';
import { useCart } from '../context/CartContext';
import { useSearch } from '../context/SearchContext';
import { useAuth } from '../context/AuthContext';
import UserMenu from './UserMenu';
import FlowingThreads from './FlowingThreads';
import { useSearch as useSearchAPI } from '../hooks/useProducts';

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

  if (loading) return <div className="search-suggestions"><p style={{padding:'20px',color:'#6b6b6b'}}>Searching…</p></div>;

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
                <button className="add-to-bag" onClick={() => { addToCart({ ...product, id, image: img }); onClose(); }}>
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
  const navigate = useNavigate();
  const location = useLocation();

  const [authOpen, setAuthOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('login');
  const [wishlistOpen, setWishlistOpen] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const [paymentStep, setPaymentStep] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('');
  const [categoriesOpen, setCategoriesOpen] = useState(false);

  const { user, login, signup, loading, error, setError } = useAuth();

  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [signupFirstName, setSignupFirstName] = useState('');
  const [signupLastName, setSignupLastName] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPhone, setSignupPhone] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  const { wishlist, toggleWishlist } = useWishlist();
  const { cart, removeFromCart, updateQuantity, clearCart, cartTotal, cartCount } = useCart();
  const { searchOpen, setSearchOpen, searchQuery, setSearchQuery } = useSearch();

  const DELIVERY_CHARGE = cartTotal >= 1899 ? 0 : 99;
  const finalTotal = cartTotal + DELIVERY_CHARGE;

  const goToNewArrivals = (e) => {
    e.preventDefault();
    if (location.pathname === '/') {
      document.getElementById('new-arrivals')?.scrollIntoView({ behavior: 'smooth' });
    } else {
      navigate('/');
      setTimeout(() => {
        document.getElementById('new-arrivals')?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }
  };

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
    const result = await signup(signupFirstName, signupLastName, signupEmail, signupPhone, signupPassword);
    if (result.success) setAuthOpen(false);
  };

  return (
    <nav style={{ position: 'relative' }}>
      <FlowingThreads />
      <Link to="/" className="nav-logo" style={{ flexShrink: 0 }}>
        <div className="logo-img-stack">
          <img src="/assets/logo/logo.jpeg" alt="Dezire More" className="logo-emblem" />
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

        <button aria-label="Cart" onClick={() => { setCartOpen(true); setPaymentStep(false); }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
            <line x1="3" y1="6" x2="21" y2="6" />
            <path d="M16 10a4 4 0 01-8 0" />
          </svg>
          {cartCount > 0 && <span className="badge">{cartCount}</span>}
        </button>

        {user ? (
          <UserMenu />
        ) : (
          <button className="auth-trigger-btn" onClick={() => { setAuthOpen(true); setActiveTab('login'); setError(''); }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
            Login
          </button>
        )}
      </div>

      <ul className="nav-links">
        <li><a href="/" onClick={goToNewArrivals}>New Arrivals</a></li>
        <li className={`dropdown ${categoriesOpen ? 'open' : ''}`}>
          <a href="/" onClick={(e) => { e.preventDefault(); setCategoriesOpen(prev => !prev); }}>
            Categories
          </a>
          <ul className="dropdown-menu">
            <li><Link to="/sarees" onClick={() => setCategoriesOpen(false)}>Sarees</Link></li>
            <li><Link to="/dress-materials" onClick={() => setCategoriesOpen(false)}>Dress Materials</Link></li>
            <li><Link to="/ready-to-wear" onClick={() => setCategoriesOpen(false)}>Ready to Wear</Link></li>
            <li><Link to="/western-apparels" onClick={() => setCategoriesOpen(false)}>Casual Western</Link></li>
            <li><Link to="/jewelry-accessories" onClick={() => setCategoriesOpen(false)}>Jewelry / Accessories</Link></li>
          </ul>
        </li>
        <li><Link to="/dress-materials">Dress Materials</Link></li>
        <li><Link to="/ready-to-wear">Ready to Wear</Link></li>
        <li><Link to="/western-apparels">Casual Western</Link></li>
        <li><Link to="/jewelry-accessories">Jewelry / Accessories</Link></li>
        <li><Link to="/bestsellers">Bestsellers</Link></li>
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
                    <div key={product.id} className="wl-item">
                      <img src={product.image} alt={product.name} className="wl-item-img" />
                      <div className="wl-item-info">
                        <p className="wl-item-material">{product.fabric || product.material || 'Dezire More'}</p>
                        <p className="wl-item-name">{product.name}</p>
                        <div className="wl-item-price">
                          <span className="wl-price-now">₹{product.price.toLocaleString('en-IN')}</span>
                          <span className="wl-price-was">₹{product.originalPrice.toLocaleString('en-IN')}</span>
                          {discount > 0 && <span className="wl-discount">{discount}% off</span>}
                        </div>
                        <button className="wl-add-cart" onClick={() => addToCart(product)}>Add to Bag</button>
                      </div>
                      <button className="wl-remove" onClick={() => toggleWishlist(product)}>✕</button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Cart Drawer */}
      {cartOpen && (
        <div className="wl-overlay" onClick={() => setCartOpen(false)}>
          <div className="wl-drawer" onClick={e => e.stopPropagation()}>
            {!paymentStep ? (
              <>
                <div className="wl-header">
                  <h3 className="wl-title">My Cart ({cartCount})</h3>
                  <button className="wl-close" onClick={() => setCartOpen(false)}>✕</button>
                </div>
                {cart.length === 0 ? (
                  <div className="wl-empty">
                    <span className="wl-empty-icon">🛍</span>
                    <p>Your cart is empty</p>
                    <span>Add items to get started</span>
                  </div>
                ) : (
                  <>
                    <div className="wl-items">
                      {cart.map(product => (
                        <div key={product.id} className="wl-item">
                          <img src={product.image} alt={product.name} className="wl-item-img" />
                          <div className="wl-item-info">
                            <p className="wl-item-material">{product.fabric || product.material || 'Dezire More'}</p>
                            <p className="wl-item-name">{product.name}</p>
                            <p className="wl-price-now">₹{product.price.toLocaleString('en-IN')}</p>
                            <div className="cart-qty-row">
                              <button className="cart-qty-btn" onClick={() => updateQuantity(product.id, product.quantity - 1)}>−</button>
                              <span className="cart-qty-num">{product.quantity}</span>
                              <button className="cart-qty-btn" onClick={() => updateQuantity(product.id, product.quantity + 1)}>+</button>
                            </div>
                          </div>
                          <button className="wl-remove" onClick={() => removeFromCart(product.id)}>✕</button>
                        </div>
                      ))}
                    </div>
                    <div className="cart-summary">
                      <div className="cart-summary-row">
                        <span>Subtotal</span>
                        <span>₹{cartTotal.toLocaleString('en-IN')}</span>
                      </div>
                      <div className="cart-summary-row">
                        <span>Delivery</span>
                        <span className={DELIVERY_CHARGE === 0 ? 'cart-free' : ''}>
                          {DELIVERY_CHARGE === 0 ? 'FREE' : `₹${DELIVERY_CHARGE}`}
                        </span>
                      </div>
                      {DELIVERY_CHARGE > 0 && (
                        <p className="cart-free-msg">Add ₹{(1899 - cartTotal).toLocaleString('en-IN')} more for free delivery!</p>
                      )}
                      <div className="cart-summary-row cart-total-row">
                        <span>Total</span>
                        <span>₹{finalTotal.toLocaleString('en-IN')}</span>
                      </div>
                      <button className="cart-checkout-btn" onClick={() => setPaymentStep(true)}>
                        Proceed to Checkout →
                      </button>
                      <button className="cart-clear-btn" onClick={clearCart}>Clear Cart</button>
                    </div>
                  </>
                )}
              </>
            ) : (
              <>
                <div className="wl-header">
                  <button className="cart-back-btn" onClick={() => setPaymentStep(false)}>← Back</button>
                  <h3 className="wl-title">Payment</h3>
                  <button className="wl-close" onClick={() => setCartOpen(false)}>✕</button>
                </div>
                <div className="payment-body">
                  <div className="payment-section">
                    <h4 className="payment-section-title">Order Summary</h4>
                    {cart.map(p => (
                      <div key={p.id} className="payment-item">
                        <span>{p.name} × {p.quantity}</span>
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
                    <input className="payment-input" type="text" placeholder="Full Name" />
                    <input className="payment-input" type="tel" placeholder="Phone Number" />
                    <input className="payment-input" type="text" placeholder="Address Line 1" />
                    <input className="payment-input" type="text" placeholder="City" />
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <input className="payment-input" type="text" placeholder="State" />
                      <input className="payment-input" type="text" placeholder="PIN Code" />
                    </div>
                  </div>
                  <div className="payment-section">
                    <h4 className="payment-section-title">Payment Method</h4>
                    <div className="payment-methods">
                      {['COD', 'UPI', 'Online Banking', 'Credit / Debit Card'].map(method => (
                        <label key={method} className={`payment-method-card ${paymentMethod === method ? 'selected' : ''}`}>
                          <input type="radio" name="payment" value={method} checked={paymentMethod === method} onChange={() => setPaymentMethod(method)} style={{ display: 'none' }} />
                          <span className="payment-method-icon">
                            {method === 'COD' && '💵'}
                            {method === 'UPI' && '📱'}
                            {method === 'Online Banking' && '🏦'}
                            {method === 'Credit / Debit Card' && '💳'}
                          </span>
                          <span>{method}</span>
                          {paymentMethod === method && <span className="payment-check">✓</span>}
                        </label>
                      ))}
                    </div>
                    {paymentMethod === 'UPI' && (
                      <input className="payment-input" type="text" placeholder="Enter UPI ID (e.g. name@upi)" style={{ marginTop: '10px' }} />
                    )}
                    {paymentMethod === 'Credit / Debit Card' && (
                      <div style={{ marginTop: '10px' }}>
                        <input className="payment-input" type="text" placeholder="Card Number" />
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <input className="payment-input" type="text" placeholder="MM/YY" />
                          <input className="payment-input" type="text" placeholder="CVV" />
                        </div>
                      </div>
                    )}
                  </div>
                  <button
                    className="cart-checkout-btn"
                    disabled={!paymentMethod}
                    onClick={() => {
                      alert(`✅ Order placed successfully!\nPayment: ${paymentMethod}\nTotal: ₹${finalTotal.toLocaleString('en-IN')}`);
                      clearCart();
                      setCartOpen(false);
                      setPaymentStep(false);
                      setPaymentMethod('');
                    }}
                  >
                    Place Order — ₹{finalTotal.toLocaleString('en-IN')}
                  </button>
                </div>
              </>
            )}
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
    </nav>
  );
}

export default Navbar;