import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Package } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';
import { useLanguage } from '../context/LanguageContext';
import { translateOrderStatus } from '../i18n/translations';
import { BASE } from '../hooks/useProducts';
import { downloadInvoice } from '../utils/invoice';

const STATUS_STEPS = [
  'Order Placed', 'Payment Confirmed', 'Processing',
  'Packed', 'Shipped', 'Out for Delivery', 'Delivered',
];
const CANCELLABLE_STATUSES = ['Order Placed', 'Payment Confirmed', 'Processing'];
const WHATSAPP_NUMBER = '918171761948';
const CANCEL_REASONS = [
  { value: '', label: 'Prefer not to say' },
  { value: 'ordered-by-mistake', label: 'Ordered by mistake' },
  { value: 'found-better-price', label: 'Found a better price elsewhere' },
  { value: 'taking-too-long', label: 'Delivery is taking too long' },
  { value: 'other', label: 'Other' },
];

function groupOrdersByMonth(orders) {
  const groups = [];
  let current = null;
  for (const order of orders) {
    const label = new Date(order.createdAt).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
    if (!current || current.label !== label) {
      current = { label, orders: [] };
      groups.push(current);
    }
    current.orders.push(order);
  }
  return groups;
}

function CancelModal({ order, onClose, onCancelled }) {
  const { authHeaders } = useAuth();
  const { showToast } = useToast();
  const [reason, setReason] = useState('');
  const [cancelling, setCancelling] = useState(false);

  const handleConfirm = async () => {
    setCancelling(true);
    try {
      const res = await fetch(`${BASE}/orders/${order._id}/cancel`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify({ reason: reason || undefined }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Could not cancel order');
      onCancelled(data.order);
      showToast('Order cancelled', 'success');
      onClose();
    } catch (err) {
      showToast(err.message, 'info');
    } finally {
      setCancelling(false);
    }
  };

  return (
    <div className="checkout-overlay" onClick={onClose}>
      <div className="checkout-modal checkout-modal-narrow" onClick={e => e.stopPropagation()}>
        <h3 className="order-success-title" style={{ marginBottom: '4px' }}>Cancel this order?</h3>
        <p className="order-success-sub">Order {order.orderNumber} — this cannot be undone.</p>

        <label className="auth-label">Reason (optional)</label>
        <select className="payment-input payment-input-spaced" value={reason} onChange={e => setReason(e.target.value)}>
          {CANCEL_REASONS.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
        </select>

        <button className="cart-checkout-btn order-cancel-btn" onClick={handleConfirm} disabled={cancelling} style={{ marginTop: '14px' }}>
          {cancelling ? 'Cancelling…' : 'Yes, Cancel Order'}
        </button>
        <div className="auth-switch">
          <span onClick={onClose}>Keep Order</span>
        </div>
      </div>
    </div>
  );
}

function DeleteOrderModal({ order, onClose, onDeleted }) {
  const { authHeaders } = useAuth();
  const { showToast } = useToast();
  const [deleting, setDeleting] = useState(false);

  const handleConfirm = async () => {
    setDeleting(true);
    try {
      const res = await fetch(`${BASE}/orders/${order._id}/hide`, {
        method: 'PATCH',
        headers: authHeaders(),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Could not remove this order');
      onDeleted(order._id);
      showToast('Order removed from your history', 'success');
      onClose();
    } catch (err) {
      showToast(err.message, 'info');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="checkout-overlay" onClick={onClose}>
      <div className="checkout-modal checkout-modal-narrow" onClick={e => e.stopPropagation()}>
        <h3 className="order-success-title" style={{ marginBottom: '4px' }}>Remove this order from your history?</h3>
        <p className="order-success-sub">
          Order {order.orderNumber} — this only removes it from your own order history view. It cannot be undone from here, but it doesn't affect the order itself or any warranty/support tied to it.
        </p>

        <button className="cart-checkout-btn order-cancel-btn" onClick={handleConfirm} disabled={deleting} style={{ marginTop: '14px' }}>
          {deleting ? 'Removing…' : 'Yes, Remove It'}
        </button>
        <div className="auth-switch">
          <span onClick={onClose}>Keep Order</span>
        </div>
      </div>
    </div>
  );
}

function OrderCard({ order, onCancelled, onDeleted }) {
  const [expanded, setExpanded] = useState(false);
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const { addToCart } = useCart();
  const { showToast } = useToast();
  const { language } = useLanguage();

  const isCancelled = order.orderStatus === 'Cancelled';
  const stepIndex = STATUS_STEPS.indexOf(order.orderStatus);
  const canCancel = CANCELLABLE_STATUSES.includes(order.orderStatus);

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
        <div className="order-card-header-top">
          <div className="order-card-thumbs">
            {order.items.slice(0, 3).map((item, i) => (
              item.image
                ? <img key={i} src={item.image} alt="" className="order-card-thumb" loading="lazy" decoding="async" />
                : <div key={i} className="order-card-thumb order-card-thumb-placeholder" />
            ))}
            {order.items.length > 3 && <span className="order-card-thumb-more">+{order.items.length - 3}</span>}
          </div>
          <div className="order-card-id-block">
            <p className="order-card-id">Order {order.orderNumber}</p>
            <p className="order-card-date">
              {new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
          </div>
          <div className="order-card-header-right">
            <span className="order-card-total-mini">₹{order.total.toLocaleString('en-IN')}</span>
            <div className="order-card-status-row">
              <span className={`order-card-status ${isCancelled ? 'order-card-status-cancelled' : ''}`}>
                {translateOrderStatus(language, order.orderStatus)}
              </span>
              <span className="order-card-chevron">{expanded ? '▲' : '▼'}</span>
            </div>
          </div>
        </div>

        {!isCancelled && (
          <div className="order-mini-stepper">
            {STATUS_STEPS.map((step, i) => (
              <span key={step} className={`order-mini-dot ${i <= stepIndex ? 'done' : ''}`} title={translateOrderStatus(language, step)} />
            ))}
          </div>
        )}
      </button>

      {expanded && (
        <div className="order-card-body">
          {!isCancelled && (
            <div className="order-progress">
              {STATUS_STEPS.map((step, i) => (
                <div key={step} className={`order-progress-step ${i <= stepIndex ? 'done' : ''}`}>
                  <span className="order-progress-dot" />
                  <span className="order-progress-label">{translateOrderStatus(language, step)}</span>
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

          {!isCancelled && order.shipment?.awbCode && (
            <p className="order-delivery-note">
              {order.shipment.courierName || 'Courier'} — AWB {order.shipment.awbCode}
              {' · '}
              <a href={order.shipment.trackingUrl} target="_blank" rel="noreferrer">Track shipment →</a>
            </p>
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
            <button onClick={handleSupport}>Customer Support</button>
            {canCancel && (
              <button className="order-cancel-btn" onClick={(e) => { e.stopPropagation(); setCancelModalOpen(true); }}>
                Cancel Order
              </button>
            )}
            <button className="order-cancel-btn" onClick={(e) => { e.stopPropagation(); setDeleteModalOpen(true); }}>
              Delete
            </button>
          </div>
        </div>
      )}

      {cancelModalOpen && (
        <CancelModal
          order={order}
          onClose={() => setCancelModalOpen(false)}
          onCancelled={onCancelled}
        />
      )}

      {deleteModalOpen && (
        <DeleteOrderModal
          order={order}
          onClose={() => setDeleteModalOpen(false)}
          onDeleted={onDeleted}
        />
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
  }, [user?.email]);

  const handleCancelled = (updatedOrder) => {
    setOrders(prev => prev.map(o => o._id === updatedOrder._id ? updatedOrder : o));
  };

  const handleDeleted = (orderId) => {
    setOrders(prev => prev.filter(o => o._id !== orderId));
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
              <span className="wl-empty-icon"><Package size={40} strokeWidth={1.5} /></span>
              <p>You haven't placed any orders yet</p>
              <span>Once you place an order, it will show up here for easy tracking.</span>
            </div>
            <div className="size-cta">
              <Link to="/new-arrivals" className="whatsapp-btn">Start Shopping</Link>
            </div>
          </>
        )}

        {!loading && orders.length > 0 && groupOrdersByMonth(orders).map(group => (
          <div key={group.label} className="orders-month-group">
            <h3 className="orders-month-heading">{group.label}</h3>
            <div className="orders-list">
              {group.orders.map(order => (
                <OrderCard
                  key={order._id}
                  order={order}
                  onCancelled={handleCancelled}
                  onDeleted={handleDeleted}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default MyOrders;
