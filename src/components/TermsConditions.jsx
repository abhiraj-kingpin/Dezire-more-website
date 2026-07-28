import { Link } from 'react-router-dom';

function TermsConditions() {
  return (
    <div className="policy-page">
      <div className="policy-hero">
        <span className="policy-eyebrow">Please Read Carefully</span>
        <h1>Terms &amp; Conditions</h1>
        <p>The terms that govern your use of the Dezire More website and app.</p>
      </div>

      <div className="policy-content">
        <div className="policy-note-block">
          <h2>Using Our Website</h2>
          <p>By browsing or shopping with Dezire More, you agree to these terms. We may update them from time to time, and continued use of the site means you accept the latest version.</p>
        </div>

        <div className="policy-note-block">
          <h2>Products &amp; Pricing</h2>
          <ul className="policy-list">
            <li>We try our best to display accurate colours, fabrics, and measurements — screen colours may vary slightly from the actual product.</li>
            <li>Prices are listed in Indian Rupees (₹) and may change without prior notice.</li>
            <li>In case of a pricing or listing error, we reserve the right to cancel the order and issue a full refund.</li>
          </ul>
        </div>

        <div className="policy-note-block">
          <h2>Orders &amp; Payment</h2>
          <ul className="policy-list">
            <li>An order is confirmed only once payment is successfully verified.</li>
            <li>We reserve the right to cancel any order suspected of fraud or error.</li>
            <li>Estimated delivery timelines are indicative and may vary due to courier or logistical delays.</li>
          </ul>
        </div>

        <div className="policy-note-block">
          <h2>Exchanges</h2>
          <p>All exchanges are governed by our <Link to="/exchange-policy">Exchange Policy</Link>. We currently offer exchanges only — refunds are not available except where an order is cancelled by us.</p>
        </div>

        <div className="policy-note-block">
          <h2>Intellectual Property</h2>
          <p>All content on this site — including photos, designs, and text — is the property of Dezire More and may not be reproduced without permission.</p>
        </div>

        <div className="policy-note-block">
          <h2>Limitation of Liability</h2>
          <p>Dezire More is not liable for indirect or incidental damages arising from the use of our products or website, beyond the value of the order placed.</p>
        </div>

        <div className="policy-note-block">
          <h2>Governing Law</h2>
          <p>These terms are governed by the laws of India, and any disputes are subject to the jurisdiction of the courts in India.</p>
        </div>

        <div className="size-cta">
          <p>Have a question about these terms?</p>
          <a href="https://wa.me/918171761948" target="_blank" rel="noreferrer" className="whatsapp-btn">
            Message us on WhatsApp
          </a>
        </div>
      </div>
    </div>
  );
}

export default TermsConditions;
