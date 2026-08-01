import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronDown, User, Package, Heart, LogOut, Crown } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useWishlist } from '../context/WishlistContext';

function UserMenu() {
  const { user, logout } = useAuth();
  const { setWishlistOpen } = useWishlist();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const ref = useRef();

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const isPremium = user.membership?.status === 'active';

  return (
    <div className="user-menu-wrap" ref={ref}>
      <button className="auth-trigger-btn user-logged-in" onClick={() => setOpen(prev => !prev)}>
        <div className={`user-avatar ${isPremium ? 'user-avatar-premium' : ''}`}>
          {user.firstName?.[0]?.toUpperCase()}
        </div>
        {isPremium && <Crown size={14} strokeWidth={1.8} className="premium-crown" aria-label="Premium member" />}
        <span>{user.firstName}</span>
        <ChevronDown size={12} strokeWidth={2} />
      </button>
      {open && (
        <div className="user-dropdown">
          <div className="user-dropdown-header">
            <div className={`user-avatar-lg ${isPremium ? 'user-avatar-premium' : ''}`}>{user.firstName?.[0]?.toUpperCase()}</div>
            <div>
              <p className="user-dropdown-name">
                {user.firstName} {user.lastName}
                {isPremium && <Crown size={15} strokeWidth={1.8} className="premium-crown" aria-label="Premium member" />}
              </p>
              <p className="user-dropdown-email">{user.email}</p>
            </div>
          </div>
          <div className="user-dropdown-divider" />
          <button className="user-dropdown-item" onClick={() => { setOpen(false); navigate('/account'); }}>
            <User size={15} strokeWidth={1.8} />
            My Profile
          </button>
          <button className="user-dropdown-item" onClick={() => { setOpen(false); navigate('/orders'); }}>
            <Package size={15} strokeWidth={1.8} />
            My Orders
          </button>
          <button className="user-dropdown-item" onClick={() => { setOpen(false); setWishlistOpen(true); }}>
            <Heart size={15} strokeWidth={1.8} />
            My Wishlist
          </button>
          <div className="user-dropdown-divider" />
          <button className="user-dropdown-item user-logout" onClick={logout}>
            <LogOut size={15} strokeWidth={1.8} />
            Sign Out
          </button>
        </div>
      )}
    </div>
  );
}

export default UserMenu;