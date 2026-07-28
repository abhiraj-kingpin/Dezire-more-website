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

function OrderCard({ order, onCancelled }) {
  const [expanded, setExpanded] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const { authHeaders } = useAuth();
  const { addToCart } = useCart();
  const { showToast } = useToast();

  const isCancelled = order.orderStatus === 'Cancelled';
  const stepIndex = STATUS_STEPS.indexOf(order.orderStatus);
  const canCancel = CANCELLABLE_STATUSES.includes(order.orderStatus);

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

  const handleExchangeRequest = (e) => {
    e.stopPropagation();
    const text = encodeURIComponent(`Hi, I'd like to request an exchange for order ${order.orderNumber}.`);
    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${text}`, '_blank', 'noreferrer');
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
            {!isCancelled && <button onClick={handleExchangeRequest}>Request Exchange</button>}
            <button onClick={handleSupport}>Customer Support</button>
            {canCancel && (
              <button className="order-cancel-btn" onClick={handleCancel} disabled={cancelling}>
                {cancelling ? 'Cancelling...' : 'Cancel Order'}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function MyOrders() {
  const { user, authHeaders } = useAuth();
  const [orders, setOrders]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    fetch(`${BASE}/orders`, { headers: authHeaders() })
      .then(res => res.json())
      .then(data => setOrders(data.data || []))
      .catch(() => setError('Could not load your orders right now.'))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.email]);

  const handleCancelled = (updatedOrder) => {
    setOrders(prev => prev.map(o => o._id === updatedOrder._id ? updatedOrder : o));
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
            {orders.map(order => <OrderCard key={order._id} order={order} onCancelled={handleCancelled} />)}
          </div>
        )}
      </div>
    </div>
  );
}

export default MyOrders;
