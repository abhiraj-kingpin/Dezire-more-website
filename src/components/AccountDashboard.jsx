import { useState, useEffect } from 'react';
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  User, MapPin, Package, Heart, Crown, Bell, Clock, Gift, CreditCard,
  ShoppingBag, HelpCircle, LogOut,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { useToast } from '../context/ToastContext';
import { useLanguage } from '../context/LanguageContext';
import AddressBook from './AddressBook';
import { getRecentlyViewed, categoryToPath } from '../utils/recentlyViewed';

export function ProfileSection() {
  const { user, updateUser } = useAuth();
  const { showToast } = useToast();
  const { t } = useLanguage();
  const [firstName, setFirstName] = useState(user.firstName || '');
  const [lastName, setLastName] = useState(user.lastName || '');
  const [phone, setPhone] = useState(user.phone || '');
  const [saving, setSaving] = useState(false);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    const result = await updateUser({ firstName, lastName, phone });
    setSaving(false);
    showToast(result.success ? 'Profile updated' : (result.error || 'Could not update profile'), result.success ? 'success' : 'info');
  };

  return (
    <form className="account-form account-form-embedded" onSubmit={handleSave}>
      <div className="account-form-row">
        <div>
          <label className="auth-label">First name</label>
          <input className="auth-input" type="text" value={firstName} onChange={e => setFirstName(e.target.value)} />
        </div>
        <div>
          <label className="auth-label">Last name</label>
          <input className="auth-input" type="text" value={lastName} onChange={e => setLastName(e.target.value)} />
        </div>
      </div>
      <label className="auth-label">Email address</label>
      <input className="auth-input" type="email" value={user.email} disabled />
      <label className="auth-label">Phone</label>
      <input className="auth-input" type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="+91 98765 43210" />
      <button className="auth-submit" style={{ marginTop: '14px' }} type="submit" disabled={saving}>
        {saving ? 'Saving...' : t('action_saveChanges')}
      </button>
    </form>
  );
}

export function NotificationsSection() {
  const { user, updateUser } = useAuth();
  const toggle = () => updateUser({ notificationsEnabled: !user.notificationsEnabled });

  return (
    <div className="settings-section">
      <div className="settings-row">
        <div>
          <p className="settings-row-title">Order &amp; Offer Notifications</p>
          <p className="settings-row-desc">Order updates, delivery alerts, and occasional offers by email</p>
        </div>
        <button
          className={`settings-toggle ${user.notificationsEnabled ? 'on' : ''}`}
          onClick={toggle}
          role="switch"
          aria-checked={user.notificationsEnabled}
        >
          <span className="settings-toggle-knob" />
        </button>
      </div>
    </div>
  );
}

export function RecentlyViewedSection() {
  const items = getRecentlyViewed();
  if (items.length === 0) {
    return <p className="address-empty">Products you view will show up here.</p>;
  }
  return (
    <div className="recently-viewed-grid">
      {items.map(item => (
        <Link to={categoryToPath(item.category)} key={item.id} className="recently-viewed-card">
          <div className="recently-viewed-img-wrap">
            {item.image ? <img src={item.image} alt={item.name} loading="lazy" decoding="async" /> : <div className="product-img-placeholder" />}
          </div>
          <p className="recently-viewed-name">{item.name}</p>
          <p className="recently-viewed-price">₹{Number(item.price).toLocaleString('en-IN')}</p>
        </Link>
      ))}
    </div>
  );
}

export function ComingSoonSection({ label }) {
  return (
    <div className="account-coming-soon">
      <p>{label} is on its way — check back soon.</p>
    </div>
  );
}

export function AccountWishlist() {
  const { wishlist, toggleWishlist } = useWishlist();
  const { addToCart } = useCart();
  const { showToast } = useToast();
  const { t } = useLanguage();

  if (wishlist.length === 0) {
    return <p className="address-empty">Items you save with the heart icon will show up here.</p>;
  }

  return (
    <div className="recently-viewed-grid">
      {wishlist.map(product => {
        const outOfStock = product.inStock === false;
        return (
        <div key={product.id} className="recently-viewed-card">
          <div className="recently-viewed-img-wrap">
            {product.image ? <img src={product.image} alt={product.name} loading="lazy" decoding="async" /> : <div className="product-img-placeholder" />}
            {outOfStock && <span className="product-badge badge-outofstock">Out of Stock</span>}
          </div>
          <p className="recently-viewed-name">{product.name}</p>
          <p className="recently-viewed-price">₹{Number(product.price).toLocaleString('en-IN')}</p>
          <div className="account-wishlist-actions">
            <button
              className="account-wishlist-move"
              disabled={outOfStock}
              onClick={() => {
                if (outOfStock) return;
                addToCart(product);
                toggleWishlist(product);
                showToast('Moved to cart', 'cart');
              }}
            >
              {outOfStock ? t('action_outOfStock') : t('action_moveToCart')}
            </button>
            <button className="account-wishlist-remove" onClick={() => toggleWishlist(product)} aria-label="Remove from wishlist">✕</button>
          </div>
        </div>
        );
      })}
    </div>
  );
}

const NAV_ITEMS = [
  { key: 'profile', labelKey: 'account_profile', icon: User },
  { key: 'addresses', labelKey: 'account_addresses', icon: MapPin },
  { key: 'orders', labelKey: 'account_orders', icon: Package },
  { key: 'wishlist', labelKey: 'account_wishlist', icon: Heart },
  { key: 'membership', labelKey: 'account_membership', icon: Crown },
  { key: 'notifications', labelKey: 'account_notifications', icon: Bell },
  { key: 'recently-viewed', labelKey: 'account_recentlyViewed', icon: Clock },
  { key: 'coupons', labelKey: 'account_coupons', icon: Gift },
  { key: 'payment-methods', labelKey: 'account_paymentMethods', icon: CreditCard },
];

function AccountDashboard() {
  const { user, logout } = useAuth();
  const { cart, setCartOpen } = useCart();
  const { wishlist } = useWishlist();
  const { t } = useLanguage();
  const navigate = useNavigate();

  if (!user) {
    return (
      <div className="policy-page">
        <div className="policy-hero">
          <span className="policy-eyebrow">{t('account_myAccount')}</span>
          <h1>{t('account_notSignedIn')}</h1>
          <p>{t('account_signInPrompt')}</p>
        </div>
        <div className="policy-content">
          <div className="size-cta">
            <Link to="/" className="whatsapp-btn">{t('action_backToHome')}</Link>
          </div>
        </div>
      </div>
    );
  }

  const initials = `${user.firstName?.[0] || ''}${user.lastName?.[0] || ''}`.toUpperCase() || user.email[0].toUpperCase();

  return (
    <div className="policy-page">
      <div className="policy-hero">
        <span className="policy-eyebrow">{t('account_myAccount')}</span>
        <h1>{t('account_welcome')}, {user.firstName}</h1>
        <p>{t('account_manage')}</p>
      </div>

      <div className="account-dashboard">
        <aside className="account-sidebar">
          <div className="account-sidebar-user">
            <div className="settings-avatar">{initials}</div>
            <div>
              <p className="settings-account-name">{user.firstName} {user.lastName}</p>
              <p className="settings-account-email">{user.email}</p>
            </div>
          </div>

          <nav className="account-nav">
            {NAV_ITEMS.map(item => (
              <NavLink
                key={item.key}
                to={`/account/${item.key}`}
                className={({ isActive }) => `account-nav-item ${isActive ? 'active' : ''}`}
              >
                <item.icon className="account-nav-icon" size={20} strokeWidth={1.8} />
                {t(item.labelKey)}
                {item.key === 'wishlist' && wishlist.length > 0 ? ` (${wishlist.length})` : ''}
              </NavLink>
            ))}
            <button className="account-nav-item" onClick={() => setCartOpen(true)}>
              <ShoppingBag className="account-nav-icon" size={20} strokeWidth={1.8} />
              {t('nav_cart')} {cart.length > 0 ? `(${cart.length})` : ''}
            </button>
            <button className="account-nav-item" onClick={() => navigate('/help-support')}>
              <HelpCircle className="account-nav-icon" size={20} strokeWidth={1.8} />
              {t('account_support')}
            </button>
            <button className="account-nav-item account-nav-logout" onClick={logout}>
              <LogOut className="account-nav-icon" size={20} strokeWidth={1.8} />
              {t('account_logout')}
            </button>
          </nav>
        </aside>

        <div className="account-main">
          <Outlet />
        </div>
      </div>
    </div>
  );
}

export default AccountDashboard;
