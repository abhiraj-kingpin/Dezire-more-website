import { useState, useEffect } from 'react';

const FONT_KEY = 'dm-font-scale';

function SettingsDrawer({ open, onClose }) {
  const [fontScale, setFontScale] = useState(() => localStorage.getItem(FONT_KEY) || 'normal');
  const [reduceMotion, setReduceMotion] = useState(() => localStorage.getItem('dm-reduce-motion') === 'true');

  useEffect(() => {
    document.documentElement.setAttribute('data-font-scale', fontScale);
    localStorage.setItem(FONT_KEY, fontScale);
  }, [fontScale]);

  useEffect(() => {
    document.documentElement.setAttribute('data-reduce-motion', reduceMotion ? 'true' : 'false');
    localStorage.setItem('dm-reduce-motion', reduceMotion);
  }, [reduceMotion]);

  if (!open) return null;

  return (
    <div className="wl-overlay" onClick={onClose}>
      <div className="wl-drawer settings-drawer" onClick={e => e.stopPropagation()}>
        <div className="wl-header">
          <h3 className="wl-title">Settings</h3>
          <button className="wl-close" onClick={onClose}>✕</button>
        </div>

        <div className="settings-body">
          <div className="settings-section">
            <p className="settings-section-title">Text Size</p>
            <div className="settings-pill-row">
              {[
                { key: 'small', label: 'A' , style: { fontSize: '12px' } },
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
          </div>

          <div className="settings-section settings-links">
            <a href="/size-guide">Size Guide</a>
            <a href="/shipping-policy">Shipping Policy</a>
            <a href="/exchange-policy">Exchange Policy</a>
            <a href="/contact">Contact Us</a>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SettingsDrawer;
