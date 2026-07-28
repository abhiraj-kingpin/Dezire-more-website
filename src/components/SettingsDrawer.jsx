import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useWishlist } from '../context/WishlistContext';

const FONT_KEY = 'dm-font-scale';

function MenuLink({ to, children, onClose }) {
  return (
    <Link className="settings-menu-link" to={to} onClick={onClose}>
      <span>{children}</span>
      <span className="settings-menu-arrow">›</span>
    </Link>
  );
}

function MenuButton({ children, onClick }) {
  return (
    <button type="button" className="settings-menu-link" onClick={onClick}>
      <span>{children}</span>
      <span className="settings-menu-arrow">›</span>
    </button>
  );
}

function SettingsDrawer({ open, onClose, onOpenAuth, onOpenWishlist }) {
  const { user, logout } = useAuth();
  const { wishlist } = useWishlist();

  const [fontScale, setFontScale] = useState(() => localStorage.getItem(FONT_KEY) || 'normal');
  const [reduceMotion, setReduceMotion] = useState(() => localStorage.getItem('dm-reduce-motion') === 'true');
  const [notifications, setNotifications] = useState(() => localStorage.getItem('dm-notifications') !== 'false');

  useEffect(() => {
    document.documentElement.setAttribute('data-font-scale', fontScale);
    localStorage.setItem(FONT_KEY, fontScale);
  }, [fontScale]);

  useEffect(() => {
    document.documentElement.setAttribute('data-reduce-motion', reduceMotion ? 'true' : 'false');
    localStorage.setItem('dm-reduce-motion', reduceMotion);
  }, [reduceMotion]);

  useEffect(() => {
    localStorage.setItem('dm-notifications', notifications);
  }, [notifications]);

  if (!open) return null;

  const initials = user
    ? (`${user.firstName?.[0] || ''}${user.lastName?.[0] || ''}`.toUpperCase() || user.email?.[0]?.toUpperCase() || 'U')
    : '';

  return (
    <div className="wl-overlay" onClick={onClose}>
      <div className="wl-drawer settings-drawer" onClick={e => e.stopPropagation()}>
        <div className="wl-header">
          <h3 className="wl-title">Settings</h3>
          <button className="wl-close" onClick={onClose} aria-label="Close settings">✕</button>
        </div>

        <div className="settings-body">

          {/* Account */}
          <div className="settings-account-card">
            {user ? (
              <>
                <div className="settings-avatar">{initials}</div>
                <div className="settings-account-info">
                  <p className="settings-account-name">{user.firstName} {user.lastName}</p>
                  <p className="settings-account-email">{user.email}</p>
                </div>
              </>
            ) : (
              <div className="settings-account-info">
                <p className="settings-account-name">Welcome to Dezire More</p>
                <p className="settings-account-email">Sign in for faster checkout &amp; order tracking</p>
              </div>
            )}
          </div>

          {user ? (
            <button className="settings-auth-btn settings-auth-logout" onClick={() => { logout(); onClose(); }}>
              Logout
            </button>
          ) : (
            <button className="settings-auth-btn" onClick={onOpenAuth}>
              Login / Register
            </button>
          )}

          <div className="settings-section">
            <p className="settings-section-title">My Account</p>
            <div className="settings-menu-list">
              <MenuLink to="/orders" onClose={onClose}>My Orders</MenuLink>
              <MenuButton onClick={onOpenWishlist}>
                Wishlist{wishlist?.length > 0 ? ` (${wishlist.length})` : ''}
              </MenuButton>
              <MenuLink to="/account" onClose={onClose}>Profile</MenuLink>
              <MenuLink to="/account" onClose={onClose}>Saved Addresses</MenuLink>
              <MenuLink to="/membership" onClose={onClose}>✦ Premium Membership</MenuLink>
            </div>
          </div>

          <div className="settings-section">
            <p className="settings-section-title">Text Size</p>
            <div className="settings-pill-row">
              {[
                { key: 'small', label: 'A', style: { fontSize: '12px' } },
                { key: 'normal', label: 'A', style: { fontSize: '15px' } },
                { key: 'large', label: 'A', style: { fontSize: '18px' } },
              ].map(opt => (
                <button
                  key={opt.key}
                  className={`settings-pill ${fontScale === opt.key ? 'active' : ''}`}
                  style={opt.style}
                  onClick={() => setFontScale(opt.key)}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div className="settings-section">
            <div className="settings-row">
              <div>
                <p className="settings-row-title">Notifications</p>
                <p className="settings-row-desc">Order updates, offers, and alerts</p>
              </div>
              <button
                className={`settings-toggle ${notifications ? 'on' : ''}`}
                onClick={() => setNotifications(v => !v)}
                aria-label="Toggle notifications"
                role="switch"
                aria-checked={notifications}
              >
                <span className="settings-toggle-knob" />
              </button>
            </div>

            <div className="settings-row">
              <div>
                <p className="settings-row-title">Reduce Motion</p>
                <p className="settings-row-desc">Minimize animations across the site</p>
              </div>
              <button
                className={`settings-toggle ${reduceMotion ? 'on' : ''}`}
                onClick={() => setReduceMotion(v => !v)}
                aria-label="Toggle reduce motion"
                role="switch"
                aria-checked={reduceMotion}
              >
                <span className="settings-toggle-knob" />
              </button>
            </div>

            <div className="settings-row">
              <div>
                <p className="settings-row-title">Dark Mode <span className="settings-soon-badge">Coming Soon</span></p>
                <p className="settings-row-desc">A dark theme is on its way</p>
              </div>
              <button className="settings-toggle" disabled aria-disabled="true" aria-label="Dark mode (coming soon)">
                <span className="settings-toggle-knob" />
              </button>
            </div>

            <div className="settings-row">
              <div>
                <p className="settings-row-title">Language <span className="settings-soon-badge">Coming Soon</span></p>
                <p className="settings-row-desc">More languages on the way</p>
              </div>
              <span className="settings-lang-value">English</span>
            </div>
          </div>

          <div className="settings-section">
            <p className="settings-section-title">Help &amp; Information</p>
            <div className="settings-menu-list">
              <MenuLink to="/our-story" onClose={onClose}>About Us</MenuLink>
              <MenuLink to="/help-support" onClose={onClose}>Help &amp; Support</MenuLink>
              <MenuLink to="/faq" onClose={onClose}>FAQ</MenuLink>
              <MenuLink to="/contact" onClose={onClose}>Contact Us</MenuLink>
              <MenuLink to="/exchange-policy" onClose={onClose}>Return &amp; Exchange Policy</MenuLink>
              <MenuLink to="/shipping-policy" onClose={onClose}>Shipping Policy</MenuLink>
              <MenuLink to="/size-guide" onClose={onClose}>Size Guide</MenuLink>
              <MenuLink to="/privacy-policy" onClose={onClose}>Privacy Policy</MenuLink>
              <MenuLink to="/terms-conditions" onClose={onClose}>Terms &amp; Conditions</MenuLink>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

export default SettingsDrawer;
