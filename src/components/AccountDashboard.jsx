import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { useToast } from '../context/ToastContext';
import AddressBook from './AddressBook';
import { getRecentlyViewed, categoryToPath } from '../utils/recentlyViewed';

function ProfileSection() {
  const { user, updateUser } = useAuth();
  const { showToast } = useToast();
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
        {saving ? 'Saving...' : 'Save Changes'}
      </button>
    </form>
  );
}

function NotificationsSection() {
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

function RecentlyViewedSection() {
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

function ComingSoonSection({ label }) {
  return (
    <div className="account-coming-soon">
      <p>{label} is on its way — check back soon.</p>
    </div>
  );
}

const NAV_ITEMS = [
  { key: 'profile', label: 'My Profile', icon: '👤' },
  { key: 'addresses', label: 'Saved Addresses', icon: '📍' },
  { key: 'notifications', label: 'Notifications', icon: '🔔' },
  { key: 'recent', label: 'Recently Viewed', icon: '🕐' },
  { key: 'coupons', label: 'Coupons & Rewards', icon: '🎁' },
  { key: 'payments', label: 'Payment Methods', icon: '💳' },
];

function AccountDashboard() {
  const { user, logout } = useAuth();
  const { cart, setCartOpen } = useCart();
  const { wishlist, setWishlistOpen } = useWishlist();
  const navigate = useNavigate();
  const [section, setSection] = useState('profile');

  useEffect(() => { window.scrollTo(0, 0); }, [section]);

  if (!user) {
    return (
      <div className="policy-page">
        <div className="policy-hero">
          <span className="policy-eyebrow">My Account</span>
          <h1>You're Not Signed In</h1>
          <p>Sign in from the account icon in the navigation bar to view your dashboard.</p>
        </div>
        <div className="policy-content">
          <div className="size-cta">
            <Link to="/" className="whatsapp-btn">Back to Home</Link>
          </div>
        </div>
      </div>
    );
  }

  const initials = `${user.firstName?.[0] || ''}${user.lastName?.[0] || ''}`.toUpperCase() || user.email[0].toUpperCase();

  return (
    <div className="policy-page">
      <div className="policy-hero">
        <span className="policy-eyebrow">My Account</span>
        <h1>Welcome, {user.firstName}</h1>
        <p>Manage your profile, orders, addresses, and membership all in one place.</p>
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
              <button
                key={item.key}
                className={`account-nav-item ${section === item.key ? 'active' : ''}`}
                onClick={() => setSection(item.key)}
              >
                <span className="account-nav-icon">{item.icon}</span>{item.label}
              </button>
            ))}
            <button className="account-nav-item" onClick={() => navigate('/orders')}>
              <span className="account-nav-icon">📦</span>My Orders
            </button>
            <button className="account-nav-item" onClick={() => setWishlistOpen(true)}>
              <span className="account-nav-icon">♡</span>Wishlist {wishlist.length > 0 ? `(${wishlist.length})` : ''}
            </button>
            <button className="account-nav-item" onClick={() => setCartOpen(true)}>
              <span className="account-nav-icon">🛍</span>Cart {cart.length > 0 ? `(${cart.length})` : ''}
            </button>
            <button className="account-nav-item" onClick={() => navigate('/membership')}>
              <span className="account-nav-icon">👑</span>Premium Membership
            </button>
            <button className="account-nav-item" onClick={() => navigate('/help-support')}>
              <span className="account-nav-icon">❓</span>Support
            </button>
            <button className="account-nav-item account-nav-logout" onClick={logout}>
              <span className="account-nav-icon">↪</span>Logout
            </button>
          </nav>
        </aside>

        <div className="account-main">
          {section === 'profile' && <ProfileSection />}
          {section === 'addresses' && <AddressBook />}
          {section === 'notifications' && <NotificationsSection />}
          {section === 'recent' && <RecentlyViewedSection />}
          {section === 'coupons' && <ComingSoonSection label="Coupons & Rewards" />}
          {section === 'payments' && <ComingSoonSection label="Saved payment methods" />}
        </div>
      </div>
    </div>
  );
}

export default AccountDashboard;
