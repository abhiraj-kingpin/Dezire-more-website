import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function MyOrders() {
  const { user } = useAuth();

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
        <div className="wl-empty" style={{ maxWidth: 480, margin: '0 auto' }}>
          <span className="wl-empty-icon">🛍</span>
          <p>You haven't placed any orders yet</p>
          <span>Once you place an order, it will show up here for easy tracking.</span>
        </div>
        <div className="size-cta">
          <Link to="/new-arrivals" className="whatsapp-btn">Start Shopping</Link>
        </div>
      </div>
    </div>
  );
}

export default MyOrders;
