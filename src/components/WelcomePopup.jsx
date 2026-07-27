import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

function WelcomePopup() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const alreadySeen = sessionStorage.getItem('dm_welcome_seen');
    if (!alreadySeen) {
      setShow(true);
      sessionStorage.setItem('dm_welcome_seen', 'true');
    }
  }, []);

  if (!show) return null;

  const close = () => setShow(false);

  return (
    <div className="welcome-popup-overlay" onClick={close}>
      <div className="welcome-popup-card" onClick={(e) => e.stopPropagation()}>
        <button className="welcome-popup-close" onClick={close} aria-label="Close">×</button>

        <p className="welcome-popup-eyebrow">❖ Quintessential Queens</p>
        <h2 className="welcome-popup-title">Welcome to Dezire More</h2>
        <p className="welcome-popup-text">
          Ethnic elegance, modern you. Discover trending sarees, lehengas &amp; festive
          sets — with fresh deals waiting inside.
        </p>

        <div className="welcome-popup-frame">
          <span className="welcome-popup-code">USE CODE: DEZIRE10</span>
        </div>

        <Link to="/new-arrivals" className="welcome-popup-btn" onClick={close}>
          Shop Now for Trending Deals
        </Link>
      </div>
    </div>
  );
}

export default WelcomePopup;