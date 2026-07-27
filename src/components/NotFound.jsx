import { Link } from 'react-router-dom';

function NotFound() {
  return (
    <div className="policy-page">
      <div className="policy-hero">
        <span className="policy-eyebrow">Lost Your Way?</span>
        <h1>404 — Page Not Found</h1>
        <p>The page you're looking for doesn't exist or may have moved.</p>
      </div>
      <div className="policy-content">
        <div className="size-cta">
          <p>Let's get you back to shopping.</p>
          <Link to="/" className="whatsapp-btn">Back to Home</Link>
        </div>
      </div>
    </div>
  );
}

export default NotFound;
