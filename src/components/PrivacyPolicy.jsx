function PrivacyPolicy() {
  return (
    <div className="policy-page">
      <div className="policy-hero">
        <span className="policy-eyebrow">Your Trust Matters</span>
        <h1>Privacy Policy</h1>
        <p>How Dezire More collects, uses, and protects your information.</p>
      </div>

      <div className="policy-content">
        <div className="policy-note-block">
          <h2>Information We Collect</h2>
          <ul className="policy-list">
            <li>Contact details you provide — name, email, phone number, and delivery address.</li>
            <li>Order details — items purchased, order history, and payment status.</li>
            <li>Basic usage data — pages visited and interactions, used only to improve the shopping experience.</li>
          </ul>
        </div>

        <div className="policy-note-block">
          <h2>How We Use Your Information</h2>
          <ul className="policy-list">
            <li>To process and deliver your orders, and to send order and delivery updates.</li>
            <li>To respond to your queries via WhatsApp, email, or our chat assistant.</li>
            <li>To occasionally share offers or new arrivals — you can opt out anytime from Settings.</li>
            <li>We never sell your personal information to third parties.</li>
          </ul>
        </div>

        <div className="policy-note-block">
          <h2>How We Protect Your Data</h2>
          <ul className="policy-list">
            <li>All data is transmitted over secure, encrypted (SSL) connections.</li>
            <li>Payment details are handled directly by our payment partners — Dezire More never stores card or bank information.</li>
            <li>Access to customer data is limited to authorised team members only.</li>
          </ul>
        </div>

        <div className="policy-note-block">
          <h2>Cookies</h2>
          <p>We use minimal cookies and local storage to remember your cart, preferences (like text size), and login session. Disabling cookies may affect some site features.</p>
        </div>

        <div className="policy-note-block">
          <h2>Your Rights</h2>
          <p>You can request access to, correction of, or deletion of your personal data at any time by reaching out to us.</p>
        </div>

        <div className="size-cta">
          <p>Questions about your privacy?</p>
          <a href="https://wa.me/918171761948" target="_blank" rel="noreferrer" className="whatsapp-btn">
            Message us on WhatsApp
          </a>
        </div>
      </div>
    </div>
  );
}

export default PrivacyPolicy;
