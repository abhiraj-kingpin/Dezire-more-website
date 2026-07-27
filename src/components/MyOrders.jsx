import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { BASE } from '../hooks/useProducts';

const STATUS_STEPS = [
  'Order Placed', 'Payment Confirmed', 'Processing',
  'Packed', 'Shipped', 'Out for Delivery', 'Delivered',
];

function OrderCard({ order }) {
  const [expanded, setExpanded] = useState(false);
  const isCancelled = order.orderStatus === 'Cancelled';
  const stepIndex = STATUS_STEPS.indexOf(order.orderStatus);

  return (
    <div className="order-card">
      <button className="order-card-header" onClick={() => setExpanded(v => !v)}>
        <div>
          <p className="order-card-id">Order {order.orderNumber}</p>
          <p className="order-card-date">
            {new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>
        <div className="order-card-header-right">
          <span className={`order-card-status ${isCancelled ? 'order-card-status-cancelled' : ''}`}>
            {order.orderStatus}
          </span>
          <span className="order-card-chevron">{expanded ? '▲' : '▼'}</span>
        </div>
      </button>

      {expanded && (
        <div className="order-card-body">
          {!isCancelled && (
            <div className="order-progress">
              {STATUS_STEPS.map((step, i) => (
                <div key={step} className={`order-progress-step ${i <= stepIndex ? 'done' : ''}`}>
                  <span className="order-progress-dot" />
                  <span className="order-progress-label">{step}</span>
                </div>
              ))}
            </div>
          )}

          <div className="order-success-summary">
            <h4>Items</h4>
            {order.items.map((item, i) => (
              <div key={i} className="order-success-row">
                <span>{item.name}{item.size ? ` (${item.size})` : ''} × {item.quantity}</span>
                <span>₹{(item.price * item.quantity).toLocaleString('en-IN')}</span>
              </div>
            ))}
          </div>

          <div className="order-success-summary">
            <h4>Delivery Address</h4>
            <p className="order-success-address">
              {order.address.line1}, {order.address.city}, {order.address.state} - {order.address.pin}
            </p>
          </div>

          <div className="order-card-footer">
            <span>Payment: <b>{order.paymentMethod}</b> ({order.paymentStatus === 'paid' ? 'Paid' : 'Pending'})</span>
            <span className="order-card-total">Total: ₹{order.total.toLocaleString('en-IN')}</span>
          </div>
        </div>
      )}
    </div>
  );
}

function MyOrders() {
  const { user } = useAuth();
  const [orders, setOrders]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');

  useEffect(() => {
    if (!user?.email) { setLoading(false); return; }
    fetch(`${BASE}/orders?email=${encodeURIComponent(user.email)}`)
      .then(res => res.json())
      .then(data => setOrders(data.data || []))
      .catch(() => setError('Could not load your orders right now.'))
      .finally(() => setLoading(false));
  }, [user?.email]);

  if (!user) {
    return (
      <div className="policy-page">
        <div className="policy-hero">
          <span className="policy-eyebrow">My Orders</span>
          <h1>You're Not Signed In</h1>
          <p>Sign in from the account icon in the navigation bar to view your orders.</p>
        </div>
        <div className="policy-content">
          <div className="size-cta">
            <Link to="/" className="whatsapp-btn">Back to Home</Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="policy-page">
      <div className="policy-hero">
        <span className="policy-eyebrow">My Orders</span>
        <h1>Order History</h1>
        <p>Track and review everything you've ordered from Dezire More.</p>
      </div>

      <div className="policy-content">
        {loading && <p className="marquee-status">Loading your orders…</p>}
        {error && <p className="marquee-status">{error}</p>}

        {!loading && !error && orders.length === 0 && (
          <>
            <div className="wl-empty" style={{ maxWidth: 480, margin: '0 auto' }}>
              <span className="wl-empty-icon">🛍</span>
              <p>You haven't placed any orders yet</p>
              <span>Once you place an order, it will show up here for easy tracking.</span>
            </div>
            <div className="size-cta">
              <Link to="/new-arrivals" className="whatsapp-btn">Start Shopping</Link>
            </div>
          </>
        )}

        {!loading && orders.length > 0 && (
          <div className="orders-list">
            {orders.map(order => <OrderCard key={order._id} order={order} />)}
          </div>
        )}
      </div>
    </div>
  );
}

export default MyOrders;
