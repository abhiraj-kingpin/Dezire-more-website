import { useState } from 'react';

const faqs = [
  { q: "How long does delivery take?", a: "Standard delivery takes 4–7 business days across India. Metro cities usually receive orders within 3–5 days." },
  { q: "Do you offer express delivery?", a: "Yes, express delivery is available in select cities and takes 1–2 business days for an additional charge at checkout." },
  { q: "Can I track my order?", a: "Yes — once your order ships, you'll receive a tracking link via SMS/email to follow its status in real time." },
  { q: "What if my order is delayed?", a: "If your order is delayed beyond the estimated window, contact us via the helpline or WhatsApp below and we'll check the status immediately." },
  { q: "Do you deliver internationally?", a: "Currently we ship only within India. International shipping will be announced on our site when available." },
  { q: "What if I receive a damaged product?", a: "Contact us within 48 hours of delivery with photos of the damaged item, and we'll arrange a replacement or refund." },
  { q: "Can I change my delivery address after ordering?", a: "Address changes are possible only before the order is shipped. Reach out to the helpline as soon as possible to request a change." },
];

export default function HelplineWidget() {
  const [open, setOpen] = useState(false);
  const [openFaq, setOpenFaq] = useState(null);

  const toggleFaq = (i) => setOpenFaq(openFaq === i ? null : i);

  return (
    <>
      <style>{`
        .dm-help-fab {
          position: fixed; bottom: 24px; left: 24px;
          width: 60px; height: 60px; border-radius: 50%;
          background: #1a3c34; border: 2px solid #b8963e;
          display: flex; align-items: center; justify-content: center;
          cursor: pointer; box-shadow: 0 4px 16px rgba(0,0,0,0.25);
          z-index: 9998; transition: transform .2s;
        }
        .dm-help-fab:hover { transform: scale(1.07); }
        .dm-help-fab svg { width: 32px; height: 32px; }

        .dm-help-panel {
          position: fixed; bottom: 96px; left: 24px;
          width: 340px; max-height: 70vh;
          background: #fff; border: 1px solid #e0dcd4; border-radius: 14px;
          box-shadow: 0 10px 40px rgba(0,0,0,0.2);
          display: flex; flex-direction: column; overflow: hidden;
          z-index: 9999; font-family: system-ui, sans-serif;
        }

        .dm-help-header {
          background: #1a3c34; color: #fff; padding: 16px 18px;
          display: flex; align-items: center; gap: 10px;
        }
        .dm-help-header svg { width: 26px; height: 26px; }
        .dm-help-header .titles { flex: 1; }
        .dm-help-header .titles strong { display: block; font-size: 14px; }
        .dm-help-header .titles span { font-size: 11px; color: #b8963e; }
        .dm-help-close {
          background: none; border: none; color: #fff; font-size: 20px;
          cursor: pointer; line-height: 1;
        }

        .dm-help-body { padding: 16px; overflow-y: auto; flex: 1; }
        .dm-help-section { margin-bottom: 18px; }
        .dm-help-section h4 {
          font-size: 12px; text-transform: uppercase; letter-spacing: .05em;
          color: #6b6b6b; margin-bottom: 8px;
        }

        .dm-faq-item {
          border: 1px solid #e0dcd4; border-radius: 8px; margin-bottom: 8px;
          overflow: hidden; background: #f7f5f0;
        }
        .dm-faq-q {
          padding: 10px 12px; font-size: 13px; font-weight: 600;
          cursor: pointer; display: flex; justify-content: space-between;
          align-items: center; color: #1a1a1a;
        }
        .dm-faq-a {
          padding: 0 12px; font-size: 13px; color: #4a4a4a; line-height: 1.5;
          max-height: 0; overflow: hidden; transition: all .2s; background: #fff;
        }
        .dm-faq-item.open .dm-faq-a { padding: 10px 12px; max-height: 200px; }
        .dm-faq-item.open .dm-faq-arrow { transform: rotate(180deg); }
        .dm-faq-arrow { transition: transform .2s; font-size: 11px; color: #b8963e; display: inline-block; }

        .dm-emergency-box {
          background: #fdf3f0; border: 1px solid #f0d9d0; border-radius: 10px; padding: 14px;
        }
        .dm-emergency-box p { font-size: 12px; color: #6b6b6b; margin-bottom: 10px; }
        .dm-contact-row { display: flex; align-items: center; gap: 10px; margin-bottom: 8px; }
        .dm-contact-row a { color: #1a3c34; font-weight: 600; font-size: 14px; text-decoration: none; }
        .dm-contact-row .dm-icon {
          width: 34px; height: 34px; border-radius: 50%; background: #1a3c34;
          display: flex; align-items: center; justify-content: center; flex-shrink: 0;
        }
        .dm-contact-row .dm-icon svg { width: 16px; height: 16px; }

        .dm-help-footer {
          padding: 12px 16px; border-top: 1px solid #e0dcd4;
          text-align: center; font-size: 11px; color: #6b6b6b;
        }
      `}</style>

      <div className="dm-help-fab" onClick={() => setOpen(!open)} aria-label="Help & Support">
        <svg viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="9" r="3.2" fill="#b8963e"/>
          <path d="M5 19c0-3.6 3.1-6 7-6s7 2.4 7 6" stroke="#b8963e" strokeWidth="1.6" fill="none" strokeLinecap="round"/>
          <path d="M4.5 9a7.5 7.5 0 0 1 15 0" stroke="#fff" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
          <rect x="3.3" y="8.6" width="2.4" height="4" rx="1.2" fill="#fff"/>
          <rect x="18.3" y="8.6" width="2.4" height="4" rx="1.2" fill="#fff"/>
          <path d="M18.5 12.4v1.4a2 2 0 0 1-2 2h-1.3" stroke="#fff" strokeWidth="1.4" fill="none" strokeLinecap="round"/>
          <circle cx="14.6" cy="15.8" r="1" fill="#fff"/>
        </svg>
      </div>

      {open && (
        <div className="dm-help-panel">
          <div className="dm-help-header">
            <svg viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="9" r="3.2" fill="#b8963e"/>
              <path d="M5 19c0-3.6 3.1-6 7-6s7 2.4 7 6" stroke="#b8963e" strokeWidth="1.6" fill="none" strokeLinecap="round"/>
              <path d="M4.5 9a7.5 7.5 0 0 1 15 0" stroke="#fff" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
              <rect x="3.3" y="8.6" width="2.4" height="4" rx="1.2" fill="#fff"/>
              <rect x="18.3" y="8.6" width="2.4" height="4" rx="1.2" fill="#fff"/>
            </svg>
            <div className="titles">
              <strong>Dezire More Helpline</strong>
              <span>We're here to help</span>
            </div>
            <button className="dm-help-close" onClick={() => setOpen(false)}>&times;</button>
          </div>

          <div className="dm-help-body">
            <div className="dm-help-section">
              <h4>Delivery FAQs</h4>
              {faqs.map((item, i) => (
                <div key={i} className={`dm-faq-item ${openFaq === i ? 'open' : ''}`}>
                  <div className="dm-faq-q" onClick={() => toggleFaq(i)}>
                    {item.q}
                    <span className="dm-faq-arrow">▼</span>
                  </div>
                  <div className="dm-faq-a">{item.a}</div>
                </div>
              ))}
            </div>

            <div className="dm-help-section">
              <h4>Emergency / Order Helpline</h4>
              <div className="dm-emergency-box">
                <p>Facing an urgent order issue? Reach us directly:</p>
                <div className="dm-contact-row">
                  <div className="dm-icon">
                    <svg viewBox="0 0 24 24" fill="none"><path d="M4 5c0-1 1-2 2-2h2l2 5-2 2c1 3 3 5 6 6l2-2 5 2v2c0 1-1 2-2 2C10 20 4 14 4 5z" fill="#fff"/></svg>
                  </div>
                  <a href="tel:+911234567890">+91 12345 67890</a>
                </div>
                <div className="dm-contact-row">
                  <div className="dm-icon">
                    <svg viewBox="0 0 24 24" fill="none"><path d="M17.5 14.4c-.3-.1-1.7-.8-2-.9-.3-.1-.5-.1-.6.1-.2.3-.7.9-.9 1.1-.2.2-.3.2-.6.1-.3-.1-1.3-.5-2.5-1.5-.9-.8-1.5-1.8-1.7-2.1-.2-.3 0-.5.1-.6l.4-.5c.1-.2.2-.3.2-.5.1-.2 0-.4 0-.5-.1-.1-.6-1.5-.8-2-.2-.5-.4-.4-.6-.4h-.5c-.2 0-.5.1-.7.3-.2.3-.9.9-.9 2.1 0 1.2.9 2.4 1 2.6.1.2 1.8 2.8 4.5 3.9.6.3 1.1.4 1.5.5.6.2 1.2.2 1.6.1.5-.1 1.6-.6 1.8-1.3.2-.6.2-1.1.1-1.3 0-.1-.2-.2-.5-.3z" fill="#fff"/></svg>
                  </div>
                  <a href="https://wa.me/911234567890" target="_blank" rel="noreferrer">WhatsApp Support</a>
                </div>
                <div className="dm-contact-row">
                  <div className="dm-icon">
                    <svg viewBox="0 0 24 24" fill="none"><path d="M4 5h16v14H4z" stroke="#fff" strokeWidth="1.6" fill="none"/><path d="M4 6l8 6 8-6" stroke="#fff" strokeWidth="1.6" fill="none" strokeLinecap="round"/></svg>
                  </div>
                  <a href="mailto:support@deziremore.com">support@deziremore.com</a>
                </div>
              </div>
            </div>
          </div>

          <div className="dm-help-footer">Available 10 AM – 8 PM, all days</div>
        </div>
      )}
    </>
  );
}