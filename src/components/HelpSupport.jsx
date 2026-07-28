import { Link } from 'react-router-dom';

const LINKS = [
  { to: '/faq', icon: '❓', title: 'FAQ', desc: 'Quick answers to common questions' },
  { to: '/orders', icon: '📦', title: 'Track an Order', desc: 'Check your order status and delivery timeline' },
  { to: '/exchange-policy', icon: '↺', title: 'Return & Exchange', desc: 'How to raise an exchange request' },
  { to: '/shipping-policy', icon: '🚚', title: 'Shipping Info', desc: 'Delivery timelines and charges' },
  { to: '/size-guide', icon: '📏', title: 'Size Guide', desc: 'Find your perfect fit' },
  { to: '/contact', icon: '✉', title: 'Contact Us', desc: 'Reach our team directly' },
];

function HelpSupport() {
  return (
    <div className="policy-page">
      <div className="policy-hero">
        <span className="policy-eyebrow">We're Here to Help</span>
        <h1>Help &amp; Support</h1>
        <p>Find answers fast, or reach out and we'll take it from there.</p>
      </div>

      <div className="policy-content">
        <div className="help-grid">
          {LINKS.map(link => (
            <Link to={link.to} key={link.to} className="help-card">
              <span className="help-card-icon">{link.icon}</span>
              <span className="help-card-title">{link.title}</span>
              <span className="help-card-desc">{link.desc}</span>
            </Link>
          ))}
        </div>

        <div className="size-cta">
          <p>Still need a hand?</p>
          <a href="https://wa.me/918171761948" target="_blank" rel="noreferrer" className="whatsapp-btn">
            Chat with us on WhatsApp
          </a>
        </div>
      </div>
    </div>
  );
}

export default HelpSupport;
