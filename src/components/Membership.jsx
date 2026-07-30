import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

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
  const { user, subscribeMembership, promptLogin } = useAuth();
  const { showToast } = useToast();
  const [subscribing, setSubscribing] = useState('');
  const membership = user?.membership || { tier: 'none', status: 'inactive' };

  const handleSubscribe = async (tier) => {
    if (!user) {
      promptLogin('Log in to subscribe to Premium Membership');
      return;
    }
    setSubscribing(tier);
    const result = await subscribeMembership(tier);
    setSubscribing('');
    if (result.success) {
      showToast(`${tier === 'gold' ? 'Gold' : 'Platinum'} membership request received — we'll confirm once payment is verified.`, 'success');
    } else {
      showToast(result.error || 'Could not start membership', 'info');
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
              <span className="membership-badge">{membership.tier === 'gold' ? '★ Gold Member' : '♛ Platinum Member'}</span>
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
