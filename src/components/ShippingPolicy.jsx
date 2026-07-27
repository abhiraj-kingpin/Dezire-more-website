function ShippingPolicy() {
  const steps = [
    {
      number: '01',
      title: 'Order Confirmed',
      desc: 'You receive a confirmation on WhatsApp and email within minutes of placing your order.',
    },
    {
      number: '02',
      title: 'Processing',
      desc: 'Your order is carefully packed and quality-checked. This takes 1–2 business days.',
    },
    {
      number: '03',
      title: 'Dispatched',
      desc: 'Your parcel is handed to our courier partner. You receive a tracking link via WhatsApp.',
    },
    {
      number: '04',
      title: 'Delivered',
      desc: 'Your order arrives at your doorstep within the estimated delivery window.',
    },
  ];

  return (
    <div className="policy-page">
      <div className="policy-hero">
        <span className="policy-eyebrow">Delivered with Care</span>
        <h1>Shipping Policy</h1>
        <p>We ship across India. Every order is packed with love and dispatched promptly.</p>
      </div>

      <div className="policy-content">

        <div className="policy-journey">
          <h2>Your Order Journey</h2>
          <div className="journey-steps">
            {steps.map((step, i) => (
              <div className="journey-step" key={step.number}>
                <div className="step-number">{step.number}</div>
                <div className="step-body">
                  <h3>{step.title}</h3>
                  <p>{step.desc}</p>
                </div>
                {i < steps.length - 1 && <div className="step-connector" />}
              </div>
            ))}
          </div>
        </div>

        <div className="policy-cards">
          <div className="policy-card">
            <div className="policy-card-icon">◈</div>
            <h3>Delivery Time</h3>
            <p>Standard delivery takes <strong>7–10 business days</strong>, depending on your area. Metro cities may receive orders sooner.</p>
          </div>
          <div className="policy-card">
            <div className="policy-card-icon">◈</div>
            <h3>Shipping Charges</h3>
            <p>Free shipping on all orders above <strong>₹1699</strong>. A flat fee of ₹79 applies on orders below that.</p>
          </div>
          <div className="policy-card">
            <div className="policy-card-icon">◈</div>
            <h3>Order Tracking</h3>
            <p>Once dispatched, track your order via the link sent to your WhatsApp or email.</p>
          </div>
          <div className="policy-card">
            <div className="policy-card-icon">◈</div>
            <h3>Remote Areas</h3>
            <p>Delivery to remote or hilly areas may take up to <strong>10–12 business days</strong> depending on the courier network.</p>
          </div>
          <div className="policy-card">
            <div className="policy-card-icon">◈</div>
            <h3>Crafted With Care</h3>
            <p>Every piece is made by <strong>professional tailors</strong> by hand. That level of quality takes a little extra time — thank you for your patience while we get it right.</p>
          </div>
        </div>

        <div className="policy-note-block">
          <h2>Important Notes</h2>
          <ul className="policy-list">
            <li>Orders are not processed on Sundays and national holidays.</li>
            <li>Please ensure your delivery address and contact number are correct at checkout.</li>
            <li>Dezire More is not responsible for delays caused by courier partners or natural events.</li>
            <li>If your order hasn't arrived within the estimated window, contact us on WhatsApp.</li>
          </ul>
        </div>

        <div className="size-cta">
          <p>Questions about your shipment?</p>
          <a
            href="https://wa.me/918171761948"
            target="_blank"
            rel="noreferrer"
            className="whatsapp-btn"
          >
            Track on WhatsApp
          </a>
        </div>
      </div>
    </div>
  );
}

export default ShippingPolicy;