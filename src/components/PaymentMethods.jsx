import { useState, useEffect } from 'react';
import { CreditCard, Trash2, Star, Plus } from 'lucide-react';
import { BASE } from '../hooks/useProducts';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useToast } from '../context/ToastContext';

const CARD_NETWORK_ICON = { visa: 'VISA', mastercard: 'Mastercard', amex: 'Amex', rupay: 'RuPay' };

function PaymentMethods() {
  const { authHeaders } = useAuth();
  const { t } = useLanguage();
  const { showToast } = useToast();

  const [mode, setMode] = useState(null);
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [addOpen, setAddOpen] = useState(false);
  const [newLabel, setNewLabel] = useState('');
  const [newLast4, setNewLast4] = useState('');
  const [saving, setSaving] = useState(false);
  const [removingId, setRemovingId] = useState(null);

  const load = () => {
    setLoading(true);
    fetch(`${BASE}/payment-methods`, { headers: authHeaders() })
      .then(res => res.json())
      .then(data => { setMode(data.mode); setCards(data.cards || []); })
      .catch(() => { setMode('reference'); setCards([]); })
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const handleRemove = async (id) => {
    setRemovingId(id);
    try {
      const res = await fetch(`${BASE}/payment-methods/${id}`, { method: 'DELETE', headers: authHeaders() });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      showToast(t('payment_remove') + ' ✓', 'success');
      load();
    } catch (err) {
      showToast(err.message || 'Could not remove this payment method', 'info');
    } finally {
      setRemovingId(null);
    }
  };

  const handleSetDefault = async (id) => {
    try {
      const res = await fetch(`${BASE}/payment-methods/${id}/default`, {
        method: 'PATCH', headers: authHeaders(),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setCards(data.cards.map(c => ({ id: c._id || c.id, label: c.label, last4: c.last4, isDefault: c.isDefault })));
    } catch (err) {
      showToast(err.message || 'Could not update default', 'info');
    }
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!newLabel.trim()) return;
    setSaving(true);
    try {
      const res = await fetch(`${BASE}/payment-methods`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify({ label: newLabel.trim(), last4: newLast4.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setNewLabel(''); setNewLast4(''); setAddOpen(false);
      load();
    } catch (err) {
      showToast(err.message || 'Could not save this payment method', 'info');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <p className="address-empty">Loading…</p>;

  return (
    <div>
      <p className="settings-section-title" style={{ marginBottom: '4px' }}>{t('payment_savedCards')}</p>
      {mode === 'razorpay' ? (
        <p className="pm-mode-note">Tick "Save this card" the next time you pay with Razorpay at checkout — it'll show up here automatically.</p>
      ) : (
        <p className="pm-mode-note">Online card saving isn't live yet — these are for your own reference at checkout, nothing is charged automatically.</p>
      )}

      {cards.length === 0 && !addOpen ? (
        <p className="address-empty">{t('payment_noCards')}</p>
      ) : (
        <div className="pm-card-list">
          {cards.map(c => (
            <div key={c.id} className="pm-card-row">
              <div className="pm-card-icon"><CreditCard size={20} strokeWidth={1.6} /></div>
              <div className="pm-card-info">
                <p className="pm-card-label">
                  {c.network ? (CARD_NETWORK_ICON[c.network?.toLowerCase()] || c.network) : c.label}
                  {c.isDefault && <span className="pm-card-default-badge">{t('payment_default')}</span>}
                </p>
                <p className="pm-card-sub">
                  •••• {c.last4}
                  {c.expiryMonth ? ` · Exp ${String(c.expiryMonth).padStart(2, '0')}/${String(c.expiryYear).slice(-2)}` : ''}
                </p>
              </div>
              <div className="pm-card-actions">
                {mode === 'reference' && !c.isDefault && (
                  <button type="button" className="pm-icon-btn" title={t('payment_setDefault')} onClick={() => handleSetDefault(c.id)}>
                    <Star size={15} strokeWidth={1.8} />
                  </button>
                )}
                <button
                  type="button"
                  className="pm-icon-btn pm-icon-btn-danger"
                  title={t('payment_remove')}
                  disabled={removingId === c.id}
                  onClick={() => handleRemove(c.id)}
                >
                  <Trash2 size={15} strokeWidth={1.8} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {mode === 'reference' && (
        addOpen ? (
          <form className="pm-add-form" onSubmit={handleAdd}>
            <input
              className="auth-input" type="text" placeholder="e.g. HDFC Debit Card"
              value={newLabel} onChange={e => setNewLabel(e.target.value)} maxLength={40} required
            />
            <input
              className="auth-input" type="text" placeholder="Last 4 digits (optional)"
              value={newLast4} onChange={e => setNewLast4(e.target.value.replace(/\D/g, '').slice(0, 4))} maxLength={4}
            />
            <div className="pm-add-form-actions">
              <button type="button" className="settings-auth-btn" style={{ background: 'transparent' }} onClick={() => setAddOpen(false)}>{t('action_cancel')}</button>
              <button type="submit" className="settings-auth-btn" disabled={saving}>{saving ? '...' : t('action_save')}</button>
            </div>
          </form>
        ) : (
          <button type="button" className="pm-add-btn" onClick={() => setAddOpen(true)}>
            <Plus size={16} strokeWidth={2} /> {t('payment_addCard')}
          </button>
        )
      )}
    </div>
  );
}

export default PaymentMethods;
