import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Crown } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useWishlist } from '../context/WishlistContext';
import { useTheme } from '../context/ThemeContext';
import { useLanguage, LANGUAGES } from '../context/LanguageContext';

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

function SettingsDrawer({ open, onClose, onOpenAuth, onOpenWishlist, onOpenCart, cartCount }) {
  const { user, logout } = useAuth();
  const { wishlist } = useWishlist();
  const { theme, toggleTheme } = useTheme();
  const { language, setLanguage, t } = useLanguage();
  const [langMenuOpen, setLangMenuOpen] = useState(false);

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
          <h3 className="wl-title">{t('settings_title')}</h3>
          <button className="wl-close" onClick={onClose} aria-label="Close settings">✕</button>
        </div>

        <div className="settings-body">

          <div className="settings-account-card">
            {user ? (
              <>
                <div className={`settings-avatar ${user.membership?.status === 'active' ? 'user-avatar-premium' : ''}`}>{initials}</div>
                <div className="settings-account-info">
                  <p className="settings-account-name">
                    {user.firstName} {user.lastName}
                    {user.membership?.status === 'active' && <Crown size={15} strokeWidth={1.8} className="premium-crown" aria-label="Premium member" />}
                  </p>
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
              {t('account_logout')}
            </button>
          ) : (
            <button className="settings-auth-btn" onClick={onOpenAuth}>
              {t('settings_loginRegister')}
            </button>
          )}

          <div className="settings-section">
            <p className="settings-section-title">{t('settings_myAccount')}</p>
            <div className="settings-menu-list">
              <MenuLink to="/orders" onClose={onClose}>{t('account_orders')}</MenuLink>
              <MenuButton onClick={onOpenCart}>
                {t('nav_cart')}{cartCount > 0 ? ` (${cartCount})` : ''}
              </MenuButton>
              <MenuButton onClick={onOpenWishlist}>
                {t('nav_wishlist')}{wishlist?.length > 0 ? ` (${wishlist.length})` : ''}
              </MenuButton>
              <MenuLink to="/account" onClose={onClose}>{t('settings_profile')}</MenuLink>
              <MenuLink to="/account" onClose={onClose}>{t('account_addresses')}</MenuLink>
              <MenuLink to="/membership" onClose={onClose}>{t('nav_membership')}</MenuLink>
            </div>
          </div>

          <div className="settings-section">
            <p className="settings-section-title">{t('settings_textSize')}</p>
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
                <p className="settings-row-title">{t('settings_notifications')}</p>
                <p className="settings-row-desc">{t('settings_notificationsDesc')}</p>
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
                <p className="settings-row-title">{t('settings_reduceMotion')}</p>
                <p className="settings-row-desc">{t('settings_reduceMotionDesc')}</p>
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
                <p className="settings-row-title">{t('settings_darkMode')}</p>
                <p className="settings-row-desc">{t('settings_darkModeDesc')}</p>
              </div>
              <button
                className={`settings-toggle ${theme === 'dark' ? 'on' : ''}`}
                onClick={toggleTheme}
                aria-label="Toggle dark mode"
                role="switch"
                aria-checked={theme === 'dark'}
              >
                <span className="settings-toggle-knob" />
              </button>
            </div>

            <div className="settings-row settings-row-lang">
              <div>
                <p className="settings-row-title">{t('settings_language')}</p>
                <p className="settings-row-desc">{t('settings_languageDesc')}</p>
              </div>
              <button
                type="button"
                className="settings-lang-btn"
                onClick={() => setLangMenuOpen(v => !v)}
                aria-haspopup="listbox"
                aria-expanded={langMenuOpen}
              >
                {LANGUAGES[language].nativeName}
                <span className="settings-lang-chevron">{langMenuOpen ? '▲' : '▼'}</span>
              </button>
            </div>
            {langMenuOpen && (
              <div className="settings-lang-list" role="listbox">
                {Object.entries(LANGUAGES).map(([code, meta]) => (
                  <button
                    key={code}
                    type="button"
                    role="option"
                    aria-selected={language === code}
                    className={`settings-lang-option ${language === code ? 'active' : ''}`}
                    onClick={() => { setLanguage(code); setLangMenuOpen(false); }}
                  >
                    <span className="settings-lang-native">{meta.nativeName}</span>
                    <span className="settings-lang-english">{meta.englishName}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="settings-section">
            <p className="settings-section-title">{t('settings_helpSupport')}</p>
            <div className="settings-menu-list">
              <MenuLink to="/our-story" onClose={onClose}>{t('settings_aboutUs')}</MenuLink>
              <MenuLink to="/help-support" onClose={onClose}>{t('settings_helpSupport')}</MenuLink>
              <MenuLink to="/faq" onClose={onClose}>{t('footer_faq')}</MenuLink>
              <MenuLink to="/contact" onClose={onClose}>{t('footer_contactUs')}</MenuLink>
              <MenuLink to="/shipping-policy" onClose={onClose}>{t('footer_shippingPolicy')}</MenuLink>
              <MenuLink to="/size-guide" onClose={onClose}>{t('footer_sizeGuide')}</MenuLink>
              <MenuLink to="/privacy-policy" onClose={onClose}>{t('footer_privacyPolicy')}</MenuLink>
              <MenuLink to="/terms-conditions" onClose={onClose}>{t('footer_termsConditions')}</MenuLink>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

export default SettingsDrawer;
