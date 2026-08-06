import { useState, useEffect } from 'react';
import QRCode from 'react-qr-code';
import { Crown } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { BASE } from '../hooks/useProducts';

const MEMBERSHIP_PLANS = [
  {
    tier: 'gold',
    name: 'Gold Membership',
    price: 5000,
    benefits: [
      'Exclusive member pricing',
      'Early access to new collections',
      'Priority customer support',
      'Exclusive coupon codes',
      'Premium Member badge on your account',
      'Birthday offers',
      'Special festival discounts',
    ],
  },
  {
    tier: 'platinum',
    name: 'Platinum Membership',
    price: 10000,
    benefits: [
      'Everything in Gold',
      'Higher discounts on selected collections',
      'Free priority shipping',
      'First access to limited-edition launches',
      'Dedicated customer support',
      'Exclusive premium collections',
      'Premium Platinum badge on your account',
      'VIP shopping experience',
    ],
  },
];

function Membership() {
  const { user, subscribeMembership, submitMembershipReference, promptLogin, refreshUser } = useAuth();
  const { showToast } = useToast();
  const [subscribing, setSubscribing] = useState('');
  const [upiId, setUpiId] = useState('');
  const [referenceInput, setReferenceInput] = useState('');
  const [submittingReference, setSubmittingReference] = useState(false);
  const membership = user?.membership || { tier: 'none', status: 'inactive' };
  const lastPayment = membership.payments?.[membership.payments.length - 1];
  const awaitingReference = membership.status === 'pending' && lastPayment && !lastPayment.paymentReference;
  const awaitingConfirmation = membership.status === 'pending' && lastPayment?.paymentReference;

  useEffect(() => {
    fetch(`${BASE}/payment-settings`)
      .then(res => res.json())
      .then(data => setUpiId(data.upiId || ''))
      .catch(() => {});
  }, []);

  // The admin confirms membership payments from a totally separate admin
  // panel session — this tab has no other way of finding out it happened.
  // Without this, "Payment Pending" can sit there indefinitely even after
  // the admin has already confirmed it, until the customer happens to
  // refresh the page or log out/in again.
  useEffect(() => {
    if (!awaitingConfirmation) return;
    const interval = setInterval(() => { refreshUser(); }, 15000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [awaitingConfirmation]);

  const handleSubscribe = async (tier) => {
    if (!user) {
      promptLogin('Log in to subscribe to Premium Membership');
      return;
    }
    setSubscribing(tier);
    const result = await subscribeMembership(tier);
    setSubscribing('');
    if (result.success) {
      showToast(`${tier === 'gold' ? 'Gold' : 'Platinum'} membership request received — scan the QR below to pay.`, 'success');
    } else {
      showToast(result.error || 'Could not start membership', 'info');
    }
  };

  const handleSubmitReference = async () => {
    if (!referenceInput.trim()) {
      showToast('Please enter the UPI transaction reference / UTR number', 'info');
      return;
    }
    setSubmittingReference(true);
    const result = await submitMembershipReference(referenceInput.trim());
    setSubmittingReference(false);
    if (result.success) {
      setReferenceInput('');
      showToast('Reference submitted — we\'ll confirm your payment shortly', 'success');
    } else {
      showToast(result.error || 'Could not submit your reference', 'info');
    }
  };

  return (
    <div className="policy-page">
      <div className="policy-hero">
        <span className="policy-eyebrow">Exclusively Yours</span>
        <h1>Premium Membership</h1>
        <p>Unlock member pricing, early access, and a more personal shopping experience with Dezire More.</p>
      </div>

      <div className="policy-content">
        <div className="membership-section">
          {user && membership.tier !== 'none' && (
            <div className={`membership-status-card tier-${membership.tier}`}>
              <span className="membership-badge">
                <Crown size={16} strokeWidth={1.8} />
                {membership.tier === 'gold' ? 'Gold Member' : 'Platinum Member'}
              </span>
              <p className="membership-status-line">
                Status: <b>{membership.status === 'active' ? 'Active' : membership.status === 'pending' ? 'Payment Pending' : membership.status}</b>
              </p>
              {membership.renewalDate && (
                <p className="membership-status-line">Renews on {new Date(membership.renewalDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
              )}
              {membership.payments?.length > 0 && (
                <div className="membership-payment-history">
                  <p className="settings-section-title">Payment History</p>
                  {membership.payments.slice().reverse().map((p, i) => (
                    <div key={i} className="membership-payment-row">
                      <span>{p.tier === 'gold' ? 'Gold' : 'Platinum'} — ₹{p.amount.toLocaleString('en-IN')}</span>
                      <span className={`membership-payment-status status-${p.status}`}>{p.status}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {awaitingReference && upiId && (
            <div className="payment-upi-card">
              <p className="payment-upi-amount">₹{lastPayment.amount.toLocaleString('en-IN')}</p>
              <div className="payment-upi-qr-box">
                <QRCode
                  value={`upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent('Dezire More')}&am=${lastPayment.amount.toFixed(2)}&cu=INR&tn=${encodeURIComponent(`Membership ${lastPayment.tier}`)}`}
                  size={176}
                  fgColor="#1E3A2D"
                />
              </div>
              <p className="payment-upi-id">UPI ID: <strong>{upiId}</strong></p>
              <p className="payment-verify-hint">
                Scan with any UPI app — the amount is pre-filled, but please don't change it. After paying, enter the transaction reference / UTR number below; we'll confirm your payment manually, which can take a few hours.
              </p>
              <input
                type="text"
                className="payment-input"
                placeholder="UPI transaction reference / UTR number"
                value={referenceInput}
                onChange={e => setReferenceInput(e.target.value)}
              />
              <button
                className="membership-subscribe-btn"
                style={{ marginTop: '10px' }}
                onClick={handleSubmitReference}
                disabled={submittingReference}
              >
                {submittingReference ? 'Submitting...' : 'Submit Reference'}
              </button>
            </div>
          )}

          {awaitingConfirmation && (
            <p className="membership-note">
              Reference <strong>{lastPayment.paymentReference}</strong> submitted — we're confirming your payment and will activate your membership shortly.
            </p>
          )}

          <div className="membership-plans">
            {MEMBERSHIP_PLANS.map(plan => {
              const isCurrent = user && membership.tier === plan.tier && membership.status !== 'expired';
              return (
                <div key={plan.tier} className={`membership-plan-card tier-${plan.tier} ${isCurrent ? 'current' : ''}`}>
                  <h3>{plan.name}</h3>
                  <p className="membership-plan-price">₹{plan.price.toLocaleString('en-IN')}<span>/year</span></p>
                  <ul className="membership-benefits">
                    {plan.benefits.map(b => <li key={b}>{b}</li>)}
                  </ul>
                  <button
                    className="membership-subscribe-btn"
                    disabled={isCurrent || subscribing === plan.tier}
                    onClick={() => handleSubscribe(plan.tier)}
                  >
                    {isCurrent
                      ? (membership.status === 'pending' ? 'Payment Pending' : 'Current Plan')
                      : subscribing === plan.tier ? 'Processing...' : `Get ${plan.tier === 'gold' ? 'Gold' : 'Platinum'}`}
                  </button>
                </div>
              );
            })}
          </div>
          <p className="membership-note">
            {user
              ? "After subscribing, our team confirms your payment manually (the same trust-based process used at checkout) — your badge activates as soon as that's done."
              : 'Log in or create a free account first — membership is tied to your Dezire More account.'}
          </p>
        </div>
      </div>
    </div>
  );
}

export default Membership;
