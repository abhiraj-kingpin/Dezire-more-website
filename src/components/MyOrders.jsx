import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';
import { BASE } from '../hooks/useProducts';
import { downloadInvoice } from '../utils/invoice';

const STATUS_STEPS = [
  'Order Placed', 'Payment Confirmed', 'Processing',
  'Packed', 'Shipped', 'Out for Delivery', 'Delivered',
];
const CANCELLABLE_STATUSES = ['Order Placed', 'Payment Confirmed', 'Processing'];
const WHATSAPP_NUMBER = '918171761948';
const EXCHANGE_WINDOW_DAYS = 3;
const EXCHANGE_REASONS = [
  { value: 'wrong-item', label: 'Wrong item delivered' },
  { value: 'defective', label: 'Defective or damaged product received' },
  { value: 'size-mismatch', label: 'Size mismatch (stitched items only)' },
  { value: 'other', label: 'Other' },
];

function ExchangeModal({ order, onClose, onSubmitted }) {
  const { authHeaders } = useAuth();
  const { showToast } = useToast();
  const [reason, setReason] = useState('wrong-item');
  const [productId, setProductId] = useState(order.items[0]?.productId || '');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    if (!description.trim()) { setError('Please describe the issue.'); return; }
    setSubmitting(true);
    setError('');
    try {
      const res = await fetch(`${BASE}/exchanges`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify({ orderId: order._id, productId, reason, description: description.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Could not submit your exchange request');
      onSubmitted(data.exchange);
      showToast('Exchange request submitted', 'success');
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="checkout-overlay" onClick={onClose}>
      <div className="checkout-modal checkout-modal-narrow" onClick={e => e.stopPropagation()}>
        <h3 className="order-success-title" style={{ marginBottom: '4px' }}>Request an Exchange</h3>
        <p className="order-success-sub" style={{ marginBottom: '18px' }}>Order {order.orderNumber}</p>

        {order.items.length > 1 && (
          <select className="payment-input payment-input-spaced" value={productId} onChange={e => setProductId(e.target.value)}>
            {order.items.map((item, i) => (
              <option key={i} value={item.productId}>{item.name}{item.size ? ` (${item.size})` : ''}</option>
            ))}
          </select>
        )}

        <select className="payment-input payment-input-spaced" value={reason} onChange={e => setReason(e.target.value)}>
          {EXCHANGE_REASONS.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
        </select>

        <textarea
          className="payment-input payment-input-spaced review-textarea"
          rows={4}
          placeholder="Describe the issue in a few words…"
          value={description}
          onChange={e => setDescription(e.target.value)}
        />

        {error && <p className="payment-error">{error}</p>}

        <button className="cart-checkout-btn" onClick={handleSubmit} disabled={submitting} style={{ marginTop: '14px' }}>
          {submitting ? 'Submitting…' : 'Submit Exchange Request'}
        </button>
      </div>
    </div>
  );
}

function OrderCard({ order, onCancelled, exchange, onExchangeSubmitted }) {
  const [expanded, setExpanded] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [exchangeModalOpen, setExchangeModalOpen] = useState(false);
  const { authHeaders } = useAuth();
  const { addToCart } = useCart();
  const { showToast } = useToast();

  const isCancelled = order.orderStatus === 'Cancelled';
  const stepIndex = STATUS_STEPS.indexOf(order.orderStatus);
  const canCancel = CANCELLABLE_STATUSES.includes(order.orderStatus);

  const daysSinceDelivery = order.deliveredAt ? (Date.now() - new Date(order.deliveredAt).getTime()) / (1000 * 60 * 60 * 24) : null;
  const canRequestExchange = order.orderStatus === 'Delivered' && daysSinceDelivery !== null && daysSinceDelivery <= EXCHANGE_WINDOW_DAYS;

  const handleCancel = async (e) => {
    e.stopPropagation();
    if (!window.confirm('Cancel this order? This cannot be undone.')) return;
    setCancelling(true);
    try {
      const res = await fetch(`${BASE}/orders/${order._id}/cancel`, {
        method: 'PATCH',
        headers: authHeaders(),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Could not cancel order');
      onCancelled(data.order);
      showToast('Order cancelled', 'success');
    } catch (err) {
      showToast(err.message, 'info');
    } finally {
      setCancelling(false);
    }
  };

  const handleReorder = (e) => {
    e.stopPropagation();
    order.items.forEach(item => {
      addToCart({
        id: item.productId,
        name: item.name,
        image: item.image,
        price: item.price,
        selectedSize: item.size || undefined,
      }, { quantity: item.quantity, silent: true });
    });
    showToast('Items added to your bag', 'cart');
  };

  const handleSupport = (e) => {
    e.stopPropagation();
    const text = encodeURIComponent(`Hi, I need help with my order ${order.orderNumber}.`);
    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${text}`, '_blank', 'noreferrer');
  };

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

          {!isCancelled && (
            order.orderStatus === 'Delivered' && order.deliveredAt ? (
              <p className="order-delivery-note">
                Delivered on {new Date(order.deliveredAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
              </p>
            ) : order.estimatedDelivery ? (
              <p className="order-delivery-note">
                Estimated delivery: {new Date(order.estimatedDelivery).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
              </p>
            ) : null
          )}

          <div className="order-success-summary">
            <h4>Items</h4>
            {order.items.map((item, i) => (
              <div key={i} className="order-item-row">
                {item.image && <img src={item.image} alt={item.name} className="order-item-thumb" loading="lazy" decoding="async" />}
                <div className="order-item-info">
                  <span className="order-item-name">{item.name}</span>
                  <span className="order-item-variant">
                    {[item.size && `Size: ${item.size}`, item.color && `Color: ${item.color}`].filter(Boolean).join(' · ')}
                    {(item.size || item.color) && ' · '}Qty: {item.quantity}
                  </span>
                </div>
                <span className="order-item-price">₹{(item.price * item.quantity).toLocaleString('en-IN')}</span>
              </div>
            ))}
          </div>

          {order.isGift && (
            <div className="order-success-summary">
              <h4>🎁 Gift Order</h4>
              {order.giftMessage && <p className="order-success-address">"{order.giftMessage}"</p>}
            </div>
          )}

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

          <div className="order-card-actions">
            <button onClick={(e) => { e.stopPropagation(); downloadInvoice(order); }}>Download Invoice</button>
            <button onClick={handleReorder}>Reorder</button>
            {exchange ? (
              <span className={`order-card-status ${exchange.status === 'Rejected' ? 'order-card-status-cancelled' : ''}`}>
                Exchange: {exchange.status}
              </span>
            ) : canRequestExchange ? (
              <button onClick={(e) => { e.stopPropagation(); setExchangeModalOpen(true); }}>Request Exchange</button>
            ) : null}
            <button onClick={handleSupport}>Customer Support</button>
            {canCancel && (
              <button className="order-cancel-btn" onClick={handleCancel} disabled={cancelling}>
                {cancelling ? 'Cancelling...' : 'Cancel Order'}
              </button>
            )}
          </div>
        </div>
      )}

      {exchangeModalOpen && (
        <ExchangeModal
          order={order}
          onClose={() => setExchangeModalOpen(false)}
          onSubmitted={(newExchange) => onExchangeSubmitted(order._id, newExchange)}
        />
      )}
    </div>
  );
}

function MyOrders() {
  const { user, authHeaders } = useAuth();
  const [orders, setOrders]   = useState([]);
  const [exchanges, setExchanges] = useState({}); // orderId -> exchange
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    fetch(`${BASE}/orders`, { headers: authHeaders() })
      .then(res => res.json())
      .then(data => setOrders(data.data || []))
      .catch(() => setError('Could not load your orders right now.'))
      .finally(() => setLoading(false));
    fetch(`${BASE}/exchanges`, { headers: authHeaders() })
      .then(res => res.json())
      .then(data => {
        const map = {};
        (data.data || []).forEach(ex => { map[ex.orderId] = ex; });
        setExchanges(map);
      })
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.email]);

  const handleCancelled = (updatedOrder) => {
    setOrders(prev => prev.map(o => o._id === updatedOrder._id ? updatedOrder : o));
  };

  const handleExchangeSubmitted = (orderId, newExchange) => {
    setExchanges(prev => ({ ...prev, [orderId]: newExchange }));
  };

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
            {orders.map(order => (
              <OrderCard
                key={order._id}
                order={order}
                onCancelled={handleCancelled}
                exchange={exchanges[order._id]}
                onExchangeSubmitted={handleExchangeSubmitted}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default MyOrders;
