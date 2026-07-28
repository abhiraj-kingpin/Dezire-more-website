import { useState, useEffect, useRef } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const { verifyEmailToken, resendVerification, addAddress } = useAuth();
  const navigate = useNavigate();
  const ran = useRef(false);

  const [status, setStatus] = useState('verifying'); // verifying | success | expired | invalid | error
  const [message, setMessage] = useState('');
  const [expiredEmail, setExpiredEmail] = useState('');
  const [resent, setResent] = useState(false);

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;

    if (!token) {
      setStatus('invalid');
      setMessage('This verification link is missing its token.');
      return;
    }

    verifyEmailToken(token).then(result => {
      if (result.success) {
        // If a delivery address was collected at signup, it can only be
        // saved now that verification has actually produced a session.
        try {
          const pendingKey = Object.keys(localStorage).find(k => k.startsWith('dm-pending-address:'));
          if (pendingKey) {
            const address = JSON.parse(localStorage.getItem(pendingKey));
            if (address?.line1) addAddress({ label: 'Home', ...address, isDefault: true });
            localStorage.removeItem(pendingKey);
          }
        } catch { /* best-effort only */ }

        setStatus('success');
        setTimeout(() => navigate('/'), 2200);
        return;
      }
      if (result.expired) {
        setStatus('expired');
        setExpiredEmail(result.email || '');
      } else if (result.invalid) {
        setStatus('invalid');
      } else {
        setStatus('error');
      }
      setMessage(result.error || 'Something went wrong verifying your email.');
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const handleResend = async () => {
    if (!expiredEmail) return;
    const result = await resendVerification(expiredEmail);
    setResent(result.success);
    if (!result.success) setMessage(result.message || 'Could not resend the email.');
  };

  return (
    <div className="policy-page">
      <div className="policy-hero">
        <span className="policy-eyebrow">Account Verification</span>
        <h1>
          {status === 'verifying' && 'Verifying your email…'}
          {status === 'success' && 'Email Verified!'}
          {status === 'expired' && 'Link Expired'}
          {status === 'invalid' && 'Invalid Link'}
          {status === 'error' && 'Something Went Wrong'}
        </h1>
        <p>
          {status === 'verifying' && 'Please wait a moment.'}
          {status === 'success' && "You're all set — taking you to Dezire More now."}
          {(status === 'expired' || status === 'invalid' || status === 'error') && message}
        </p>
      </div>

      <div className="policy-content">
        {status === 'expired' && (
          <div className="size-cta">
            {resent ? (
              <p>A fresh verification link has been sent to {expiredEmail}.</p>
            ) : (
              <>
                <p>We can send a new link to {expiredEmail}.</p>
                <button className="whatsapp-btn" onClick={handleResend}>Resend Verification Email</button>
              </>
            )}
          </div>
        )}

        {(status === 'invalid' || status === 'error') && (
          <div className="size-cta">
            <Link to="/" className="whatsapp-btn">Back to Home</Link>
          </div>
        )}
      </div>
    </div>
  );
}

export default VerifyEmail;
