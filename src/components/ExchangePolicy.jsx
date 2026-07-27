function ExchangePolicy() {
  const eligible = [
    'Wrong item delivered',
    'Defective or damaged product received',
    'Size mismatch (for stitched items only)',
  ];

  const notEligible = [
    'Items that have been worn, washed, or altered',
    'Products without original tags and packaging',
    'Customised or made-to-order items',
    'Sarees, lehengas, and unstitched dress materials (unless defective)',
    'Items purchased during clearance or final sale',
  ];

  return (
    <div className="policy-page">
      <div className="policy-hero">
        <span className="policy-eyebrow">Hassle-Free</span>
        <h1>Exchange Policy</h1>
        <p>We want you to love what you wear. If something isn't right, we'll make it right.</p>
      </div>

      <div className="policy-content">

        <div className="policy-highlight-row">
          <div className="highlight-stat">
            <span className="highlight-number">3</span>
            <span className="highlight-label">Days to raise an exchange</span>
          </div>
          <div className="highlight-divider">◆</div>
          <div className="highlight-stat">
            <span className="highlight-number">Free</span>
            <span className="highlight-label">Pickup for eligible exchanges</span>
          </div>
          <div className="highlight-divider">◆</div>
          <div className="highlight-stat">
            <span className="highlight-number">Fast</span>
            <span className="highlight-label">Resolution within 5–7 days</span>
          </div>
        </div>

        <div className="policy-two-col">
          <div className="policy-col-block eligible">
            <h2><span className="col-icon">✓</span> Eligible for Exchange</h2>
            <ul className="policy-list">
              {eligible.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
          <div className="policy-col-block not-eligible">
            <h2><span className="col-icon">✕</span> Not Eligible</h2>
            <ul className="policy-list">
              {notEligible.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        </div>

        <div className="policy-steps-block">
          <h2>How to Raise an Exchange</h2>
          <div className="exchange-steps">
            <div className="exchange-step">
              <div className="ex-step-num">1</div>
              <div>
                <h3>Contact Us Within 3 Days</h3>
                <p>Message us on WhatsApp with your order number and a photo of the issue within 3 days of delivery. For the fastest resolution, try to reach us within 24–48 hours of receiving your order.</p>
              </div>
            </div>
            <div className="exchange-step">
              <div className="ex-step-num">2</div>
              <div>
                <h3>We Review & Approve</h3>
                <p>Our team reviews your request within 24–48 hours and confirms if the exchange is eligible.</p>
              </div>
            </div>
            <div className="exchange-step">
              <div className="ex-step-num">3</div>
              <div>
                <h3>Pickup & Replacement</h3>
                <p>We arrange a pickup of the original item and dispatch the replacement as soon as it's received.</p>
              </div>
            </div>
          </div>
        </div>

        <div className="policy-note-block">
          <h2>Please Note</h2>
          <ul className="policy-list">
            <li>We currently offer exchanges only — refunds are not available at this time.</li>
            <li>Items must be in original condition with all tags intact when returned.</li>
            <li>In case the exact item is out of stock, we will offer store credit or an alternative.</li>
          </ul>
        </div>

        <div className="size-note">
          <div className="note-icon">⚠</div>
          <p>
            <strong>Please double-check the product details</strong> — size, colour, fabric, and
            measurements — carefully before placing your order. Screen colours can vary slightly
            from the actual product, so we recommend reviewing all photos and the description
            closely to avoid any disappointment.
          </p>
        </div>

        <div className="size-cta">
          <p>Need to raise an exchange?</p>
          <a
            href="https://wa.me/918171761948"
            target="_blank"
            rel="noreferrer"
            className="whatsapp-btn"
          >
            Message us on WhatsApp
          </a>
        </div>
      </div>
    </div>
  );
}

export default ExchangePolicy;