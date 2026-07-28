const FAQ_ITEMS = [
  {
    q: 'How long does delivery take?',
    a: 'Most orders are delivered within 7–10 business days, depending on your location. Every piece is made by professional tailors, so quality takes a little time. Remote or hilly areas may take up to 10–12 business days.',
  },
  {
    q: 'What is your exchange policy?',
    a: 'We offer exchanges only (no refunds) within 3 days of delivery for eligible items — wrong item, defective product, or size mismatch on stitched pieces. Message us on WhatsApp with your order number and a photo to start an exchange.',
  },
  {
    q: 'Do you offer free shipping?',
    a: 'Yes — shipping is free on all orders above ₹1,699. A flat fee of ₹79 applies below that.',
  },
  {
    q: 'How can I track my order?',
    a: 'Visit "My Orders" from your account or the Settings menu to see live status. You will also get a tracking link on WhatsApp and email once your order is dispatched.',
  },
  {
    q: 'What sizes are available?',
    a: 'Sizing varies by product — check the Size Guide on each product page for detailed measurements. Sarees, dress materials, and jewelry are generally one-size / made-to-fit.',
  },
  {
    q: 'How do I use a discount code?',
    a: 'Enter your code (e.g. DEZIRE10) at checkout to apply the discount automatically before you complete your order.',
  },
  {
    q: 'What payment methods do you accept?',
    a: 'We accept UPI, online banking, and QR-based payments. All transactions are processed securely.',
  },
  {
    q: 'Can I cancel my order after placing it?',
    a: 'Message us on WhatsApp as soon as possible — orders can usually be cancelled if they haven\'t been packed or dispatched yet.',
  },
];

function FAQ() {
  return (
    <div className="policy-page">
      <div className="policy-hero">
        <span className="policy-eyebrow">Quick Answers</span>
        <h1>Frequently Asked Questions</h1>
        <p>Everything you need to know before and after you shop with us.</p>
      </div>

      <div className="policy-content">
        <div className="faq-list">
          {FAQ_ITEMS.map((item) => (
            <details className="faq-item" key={item.q}>
              <summary className="faq-question">
                {item.q}
                <span className="faq-chevron">⌄</span>
              </summary>
              <p className="faq-answer">{item.a}</p>
            </details>
          ))}
        </div>

        <div className="size-cta">
          <p>Didn't find your answer?</p>
          <a href="https://wa.me/918171761948" target="_blank" rel="noreferrer" className="whatsapp-btn">
            Ask us on WhatsApp
          </a>
        </div>
      </div>
    </div>
  );
}

export default FAQ;
