import { useState, useEffect } from 'react';
import { Gift, Copy, Check } from 'lucide-react';
import { BASE } from '../hooks/useProducts';
import { useLanguage } from '../context/LanguageContext';
import { useToast } from '../context/ToastContext';

function CouponCard({ coupon, t }) {
  const [copied, setCopied] = useState(false);
  const { showToast } = useToast();

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(coupon.code);
    } catch {
      // Clipboard can be unavailable (older WebView, permissions) — the
      // code is still shown on the card either way, so this is a
      // non-fatal nicety, not something the shopper needs an error for.
    }
    setCopied(true);
    showToast(`${coupon.code} ${t('coupons_copied')}`, 'success');
    setTimeout(() => setCopied(false), 2000);
  };

  const valueLabel = coupon.type === 'percent'
    ? `${coupon.value}% ${t('coupons_offPercent')}`
    : `₹${coupon.value.toLocaleString('en-IN')} ${t('coupons_flatOff')}`;

  return (
    <div className="coupon-card">
      <div className="coupon-card-value">
        <Gift size={22} strokeWidth={1.6} />
        <span>{valueLabel}</span>
      </div>
      <div className="coupon-card-body">
        <div className="coupon-card-code-row">
          <span className="coupon-card-code">{coupon.code}</span>
          <button type="button" className="coupon-card-copy" onClick={handleCopy}>
            {copied ? <Check size={14} strokeWidth={2} /> : <Copy size={14} strokeWidth={1.8} />}
            {copied ? t('coupons_copied') : t('coupons_copyCode')}
          </button>
        </div>
        <div className="coupon-card-meta">
          {coupon.minOrderValue > 0 && (
            <span>{t('coupons_minOrder')}: ₹{coupon.minOrderValue.toLocaleString('en-IN')}</span>
          )}
          {coupon.maxDiscount && coupon.type === 'percent' && (
            <span>Up to ₹{coupon.maxDiscount.toLocaleString('en-IN')}</span>
          )}
          {coupon.expiresAt && (
            <span>{t('coupons_expires')}: {new Date(coupon.expiresAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
          )}
        </div>
      </div>
    </div>
  );
}

function CouponsRewards() {
  const { t } = useLanguage();
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetch(`${BASE}/coupons/active`)
      .then(res => res.json())
      .then(data => { if (!cancelled) setCoupons(data.data || []); })
      .catch(() => { if (!cancelled) setCoupons([]); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  return (
    <div>
      <p className="settings-section-title" style={{ marginBottom: '16px' }}>{t('coupons_available')}</p>
      {loading ? (
        <p className="address-empty">Loading…</p>
      ) : coupons.length === 0 ? (
        <p className="address-empty">{t('coupons_empty')}</p>
      ) : (
        <div className="coupon-grid">
          {coupons.map(c => <CouponCard key={c.code} coupon={c} t={t} />)}
        </div>
      )}
    </div>
  );
}

export default CouponsRewards;
