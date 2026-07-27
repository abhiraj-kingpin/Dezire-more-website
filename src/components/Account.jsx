import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

function Account() {
  const { user, updateUser } = useAuth();
  const { showToast } = useToast();

  const [firstName, setFirstName] = useState('');
  const [lastName,  setLastName]  = useState('');
  const [phone,     setPhone]     = useState('');
  const [line1,     setLine1]     = useState('');
  const [city,      setCity]      = useState('');
  const [state,     setState]     = useState('');
  const [pin,       setPin]       = useState('');

  useEffect(() => {
    if (!user) return;
    setFirstName(user.firstName || '');
    setLastName(user.lastName || '');
    setPhone(user.phone || '');
    setLine1(user.address?.line1 || '');
    setCity(user.address?.city || '');
    setState(user.address?.state || '');
    setPin(user.address?.pin || '');
  }, [user]);

  if (!user) {
    return (
      <div className="policy-page">
        <div className="policy-hero">
          <span className="policy-eyebrow">My Account</span>
          <h1>You're Not Signed In</h1>
          <p>Sign in from the account icon in the navigation bar to view your profile.</p>
        </div>
        <div className="policy-content">
          <div className="size-cta">
            <Link to="/" className="whatsapp-btn">Back to Home</Link>
          </div>
        </div>
      </div>
    );
  }

  const handleSave = (e) => {
    e.preventDefault();
    updateUser({
      firstName,
      lastName,
      phone,
      address: { line1, city, state, pin },
    });
    showToast('Profile updated', 'success');
  };

  return (
    <div className="policy-page">
      <div className="policy-hero">
        <span className="policy-eyebrow">My Account</span>
        <h1>Your Profile</h1>
        <p>Keep your details up to date for faster checkout.</p>
      </div>

      <div className="policy-content">
        <form className="account-form" onSubmit={handleSave}>
          <div className="account-form-row">
            <div>
              <label className="auth-label">First name</label>
              <input className="auth-input" type="text" value={firstName} onChange={e => setFirstName(e.target.value)} />
            </div>
            <div>
              <label className="auth-label">Last name</label>
              <input className="auth-input" type="text" value={lastName} onChange={e => setLastName(e.target.value)} />
            </div>
          </div>

          <label className="auth-label">Email address</label>
          <input className="auth-input" type="email" value={user.email || ''} disabled />

          <label className="auth-label">Phone</label>
          <input className="auth-input" type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="+91 98765 43210" />

          <div className="auth-divider"><span>Delivery Address</span></div>
          <label className="auth-label">Address line 1</label>
          <input className="auth-input" type="text" value={line1} onChange={e => setLine1(e.target.value)} placeholder="House no., street, locality" />

          <div className="account-form-row">
            <div>
              <label className="auth-label">City</label>
              <input className="auth-input" type="text" value={city} onChange={e => setCity(e.target.value)} />
            </div>
            <div>
              <label className="auth-label">State</label>
              <input className="auth-input" type="text" value={state} onChange={e => setState(e.target.value)} />
            </div>
          </div>
          <label className="auth-label">PIN code</label>
          <input className="auth-input" type="text" value={pin} onChange={e => setPin(e.target.value)} />

          <button className="auth-submit" style={{ marginTop: '18px' }} type="submit">Save Changes</button>
        </form>
      </div>
    </div>
  );
}

export default Account;
