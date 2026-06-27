import { useState, useRef, useEffect } from "react";

const SYSTEM_PROMPT = `You are a warm, helpful, and knowledgeable personal style assistant for "Dezire More" — a premium Indian ethnic fashion store with the tagline "Ethnic Elegance. Modern You."

STORE DETAILS:
- Store Name: Dezire More
- Tagline: Ethnic Elegance. Modern You.
- Free shipping on orders above ₹1699
- 7-day exchange policy (no refunds, exchange only)
- Delivery: 5–7 working days
- Discount code: DEZIRE10 (10% off)
- Sale: Up to 40% off on sale items
- Customer Rating: 4.8 stars

PRODUCT CATEGORIES:
1. Sarees — Banarasi Silk, Chiffon, Organza Silk, Embroidered, Printed
2. Kurtas — Casual, Festive, Office-wear styles
3. Lehengas — Bridal, Festive, Party
4. Co-ords — Trendy matching sets
5. Dress Materials — Custom stitch fabric sets
6. Ready to Wear — Easy, everyday styles
7. Western Apparels — Modern western styles
8. New Arrivals — Latest drops every week
9. Bestsellers — Most loved pieces
10. Sale — Up to 40% off

OCCASION GUIDE:
- Wedding/Bridal → Lehengas, Silk Sarees, Embroidered Sarees
- Mehendi/Sangeet → Co-ords, Kurtas, Dress Materials
- Festive/Diwali/Navratri → Sarees, Lehengas, Co-ords
- Casual/Daily/Office → Kurtas, Ready to Wear, Dress Materials
- Party/Birthday → Western Apparels, Co-ords, Lehengas

YOUR PERSONALITY:
- Warm, friendly, like a personal stylist friend
- Use emojis naturally but not excessively
- Keep replies concise — 3 to 5 lines max
- You can understand Hindi + English mixed messages
- Always guide customers toward visiting the relevant section
- Never make up prices — say check the website for latest prices`;

const formatMessage = (text) => {
  return text
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.*?)\*/g, "<strong>$1</strong>")
    .replace(/\n/g, "<br/>");
};

export default function Chatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [showGreeting, setShowGreeting] = useState(true);
  const [messages, setMessages] = useState([
    {
      from: "bot",
      text: `Namaste! 🙏 Welcome to Dezire More.\n\nI'm Priya, your personal style assistant. Ask me anything — outfit ideas, occasion help, fabric advice, or shipping info. I'm here to help! ✨`,
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    },
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [unread, setUnread] = useState(1);
  const messagesEndRef = useRef(null);
  const conversationHistory = useRef([]);
  const inputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setUnread(0);
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
        inputRef.current?.focus();
      }, 150);
    }
  }, [isOpen, messages]);

  const sendMessage = async (text) => {
    const trimmed = (text || input).trim();
    if (!trimmed || isTyping) return;

    const userMsg = {
      from: "user",
      text: trimmed,
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsTyping(true);
    conversationHistory.current.push({ role: "user", content: trimmed });

    try {
      const response = await fetch("http://localhost:5000/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [
            { role: "system", content: SYSTEM_PROMPT },
            ...conversationHistory.current,
          ],
        }),
      });

      const data = await response.json();
      const reply = data.choices?.[0]?.message?.content || "I'm sorry, please try again! 😊";

      conversationHistory.current.push({ role: "assistant", content: reply });
      if (conversationHistory.current.length > 10) {
        conversationHistory.current = conversationHistory.current.slice(-10);
      }

      setMessages((prev) => [...prev, {
        from: "bot",
        text: reply,
        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      }]);
    } catch {
      setMessages((prev) => [...prev, {
        from: "bot",
        text: "Oops! Something went wrong. Please try again in a moment! 😊",
        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      }]);
    } finally {
      setIsTyping(false);
    }
  };

  const quickReplies = [
    "Wedding outfit?",
    "Saree collection",
    "Shipping info",
    "Exchange policy",
    "New arrivals",
    "Discount codes",
  ];

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;0,700;1,400;1,600&family=Jost:wght@300;400;500;600&display=swap');

        /* ── Root wrap ── */
        .dz-wrap {
          position: fixed;
          bottom: 30px;
          right: 30px;
          z-index: 9999;
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: 14px;
          font-family: 'Jost', sans-serif;
        }

        /* ── Toggle button ── */
        .dz-toggle {
          width: 62px;
          height: 62px;
          border-radius: 50%;
          background: #1f3d2e;
          border: 2.5px solid #c9a84c;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 6px 28px rgba(31,61,46,0.5), 0 0 0 5px rgba(201,168,76,0.12);
          transition: all 0.3s cubic-bezier(0.34,1.3,0.64,1);
          position: relative;
        }

        .dz-toggle:hover {
          transform: scale(1.08) translateY(-2px);
          background: #2d5242;
          box-shadow: 0 10px 36px rgba(31,61,46,0.6), 0 0 0 7px rgba(201,168,76,0.18);
        }

        .dz-toggle svg {
          width: 26px;
          height: 26px;
          color: #e8c97a;
        }

        .dz-badge {
          position: absolute;
          top: -2px;
          right: -2px;
          background: #c0392b;
          color: #fff;
          border-radius: 50%;
          width: 20px;
          height: 20px;
          font-size: 10px;
          font-weight: 700;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 2.5px solid #fff;
          font-family: 'Jost', sans-serif;
          box-shadow: 0 2px 8px rgba(192,57,43,0.4);
        }

        /* ── Greeting bubble ── */
        .dz-greet {
          position: absolute;
          bottom: 76px;
          right: 0;
          background: #fff;
          border: 1px solid #ddd0b3;
          border-radius: 16px 16px 2px 16px;
          padding: 14px 18px 14px 16px;
          box-shadow: 0 12px 40px rgba(0,0,0,0.14);
          width: 230px;
          animation: dz-pop 0.35s cubic-bezier(0.34,1.4,0.64,1);
        }

        .dz-greet::after {
          content: '';
          position: absolute;
          bottom: -8px;
          right: 18px;
          border: 8px solid transparent;
          border-top-color: #fff;
          border-bottom: none;
        }

        .dz-greet-close {
          position: absolute;
          top: 8px;
          right: 10px;
          background: #f5f0e8;
          border: none;
          cursor: pointer;
          color: #999;
          border-radius: 50%;
          width: 20px;
          height: 20px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 11px;
          transition: all 0.2s;
        }

        .dz-greet-close:hover { background: #ede5d0; color: #555; }

        .dz-greet-label {
          font-size: 9px;
          letter-spacing: 2px;
          text-transform: uppercase;
          color: #1f3d2e;
          font-weight: 600;
          margin: 0 0 5px;
        }

        .dz-greet-name {
          font-family: 'Cormorant Garamond', serif;
          font-size: 15px;
          font-weight: 600;
          color: #1a2e22;
          margin: 0 0 4px;
        }

        .dz-greet-text {
          font-size: 12px;
          color: #7a6a50;
          margin: 0;
          line-height: 1.55;
        }

        @keyframes dz-pop {
          from { opacity: 0; transform: scale(0.8) translateY(10px); }
          to   { opacity: 1; transform: scale(1) translateY(0); }
        }

        /* ── Chat window ── */
        .dz-window {
          width: 380px;
          height: 570px;
          background: #f7f3ea;
          border-radius: 22px;
          display: flex;
          flex-direction: column;
          overflow: hidden;
          animation: dz-rise 0.32s cubic-bezier(0.34,1.15,0.64,1);
          box-shadow:
            0 24px 64px rgba(0,0,0,0.2),
            0 0 0 1px rgba(201,168,76,0.25),
            inset 0 1px 0 rgba(255,255,255,0.8);
        }

        @keyframes dz-rise {
          from { opacity: 0; transform: translateY(24px) scale(0.94); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }

        /* ── Header ── */
        .dz-header {
          background: #1f3d2e;
          padding: 16px 18px;
          display: flex;
          align-items: center;
          gap: 13px;
          flex-shrink: 0;
          position: relative;
        }

        .dz-header::after {
          content: '';
          position: absolute;
          bottom: 0; left: 0; right: 0;
          height: 1.5px;
          background: linear-gradient(90deg, transparent 0%, #c9a84c 30%, #e8c97a 50%, #c9a84c 70%, transparent 100%);
        }

        .dz-av-ring {
          width: 48px;
          height: 48px;
          border-radius: 50%;
          border: 2px solid rgba(201,168,76,0.6);
          padding: 2px;
          flex-shrink: 0;
        }

        .dz-av-inner {
          width: 100%;
          height: 100%;
          border-radius: 50%;
          background: linear-gradient(135deg, #2d5242 0%, #1f3d2e 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          border: 1px solid rgba(201,168,76,0.3);
        }

        .dz-av-inner svg {
          width: 24px;
          height: 24px;
          color: #c9a84c;
        }

        .dz-hinfo { flex: 1; }

        .dz-hname {
          font-family: 'Cormorant Garamond', serif;
          font-size: 17px;
          font-weight: 600;
          color: #fff;
          margin: 0 0 3px;
          letter-spacing: 0.3px;
        }

        .dz-hsub {
          font-size: 10px;
          color: rgba(201,168,76,0.8);
          margin: 0;
          letter-spacing: 1.2px;
          text-transform: uppercase;
          display: flex;
          align-items: center;
          gap: 5px;
        }

        .dz-live {
          display: flex;
          align-items: center;
          gap: 4px;
        }

        .dz-live-dot {
          width: 6px;
          height: 6px;
          background: #5cd98a;
          border-radius: 50%;
          animation: dz-glow 2s infinite;
        }

        @keyframes dz-glow {
          0%, 100% { opacity: 1; box-shadow: 0 0 0 0 rgba(92,217,138,0.4); }
          50% { opacity: 0.7; box-shadow: 0 0 0 4px rgba(92,217,138,0); }
        }

        .dz-hclose {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: rgba(255,255,255,0.08);
          border: 1px solid rgba(255,255,255,0.15);
          cursor: pointer;
          color: rgba(255,255,255,0.65);
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s;
          flex-shrink: 0;
        }

        .dz-hclose:hover { background: rgba(255,255,255,0.18); color: #fff; }
        .dz-hclose svg { width: 15px; height: 15px; }

        /* ── Gold divider ── */
        .dz-divider {
          background: #fdf9f0;
          border-bottom: 1px solid #e8dfc8;
          padding: 7px 20px;
          display: flex;
          align-items: center;
          gap: 10px;
          flex-shrink: 0;
        }

        .dz-div-line {
          flex: 1;
          height: 0.5px;
          background: linear-gradient(90deg, transparent, #c9a84c, transparent);
        }

        .dz-div-text {
          font-family: 'Cormorant Garamond', serif;
          font-size: 10px;
          font-style: italic;
          color: #b8922e;
          letter-spacing: 1.8px;
          white-space: nowrap;
        }

        /* ── Messages area ── */
        .dz-msgs {
          flex: 1 1 auto;
          min-height: 0;
          overflow-y: auto;
          padding: 18px 16px 12px;
          display: flex;
          flex-direction: column;
          gap: 13px;
        }

        .dz-msgs::-webkit-scrollbar { width: 3px; }
        .dz-msgs::-webkit-scrollbar-track { background: transparent; }
        .dz-msgs::-webkit-scrollbar-thumb {
          background: linear-gradient(#c9a84c, #8a6520);
          border-radius: 3px;
        }

        .dz-msg { display: flex; gap: 9px; max-width: 85%; }
        .dz-msg.bot { align-self: flex-start; }
        .dz-msg.user { align-self: flex-end; flex-direction: row-reverse; }

        .dz-mav {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: #1f3d2e;
          border: 1.5px solid rgba(201,168,76,0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          align-self: flex-end;
        }

        .dz-mav svg { width: 17px; height: 17px; color: #c9a84c; }

        .dz-mcol { display: flex; flex-direction: column; gap: 4px; }

        .dz-bubble {
          padding: 11px 15px;
          font-size: 13.5px;
          line-height: 1.65;
          word-break: break-word;
        }

        .dz-msg.bot .dz-bubble {
          background: #fff;
          color: #2a3528;
          border-radius: 18px 18px 18px 4px;
          border: 1px solid #ede4cc;
          box-shadow: 0 2px 12px rgba(0,0,0,0.06);
        }

        .dz-msg.user .dz-bubble {
          background: linear-gradient(135deg, #1f3d2e 0%, #2d5242 100%);
          color: #f0e8d5;
          border-radius: 18px 18px 4px 18px;
          border: 1px solid rgba(201,168,76,0.25);
          box-shadow: 0 2px 12px rgba(31,61,46,0.35);
        }

        .dz-mtime {
          font-size: 10px;
          color: #b0a480;
          padding: 0 5px;
          letter-spacing: 0.3px;
        }

        .dz-msg.user .dz-mtime { text-align: right; }

        /* ── Typing indicator ── */
        .dz-typing {
          display: flex;
          gap: 9px;
          align-self: flex-start;
          align-items: flex-end;
        }

        .dz-tybub {
          background: #fff;
          border: 1px solid #ede4cc;
          border-radius: 18px 18px 18px 4px;
          padding: 13px 18px;
          display: flex;
          gap: 5px;
          align-items: center;
          box-shadow: 0 2px 12px rgba(0,0,0,0.06);
        }

        .dz-td {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          animation: dz-bounce 1.3s infinite ease-in-out;
        }

        .dz-td:nth-child(1) { background: #c9a84c; animation-delay: 0s; }
        .dz-td:nth-child(2) { background: #a07830; animation-delay: 0.2s; }
        .dz-td:nth-child(3) { background: #7a5a20; animation-delay: 0.4s; }

        @keyframes dz-bounce {
          0%, 60%, 100% { transform: translateY(0); }
          30% { transform: translateY(-7px); }
        }

        /* ── Quick replies ── */
        /* Fixed: wraps onto multiple lines instead of horizontal-scrolling
           with a hidden scrollbar — nothing gets clipped/overlapped at the edge anymore. */
        .dz-quick {
          padding: 11px 16px 13px;
          display: flex;
          flex-wrap: wrap;
          gap: 7px 7px;
          flex-shrink: 0;
          border-top: 1px solid #e8dfc8;
          background: #fdf9f0;
        }

        .dz-qbtn {
          white-space: nowrap;
          padding: 6px 13px;
          border-radius: 20px;
          border: 1px solid #c9a84c;
          background: transparent;
          color: #7a5a20;
          font-family: 'Jost', sans-serif;
          font-size: 11.5px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.22s ease;
          letter-spacing: 0.3px;
        }

        .dz-qbtn:hover {
          background: #1f3d2e;
          color: #e8c97a;
          border-color: #1f3d2e;
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(31,61,46,0.3);
        }

        .dz-qbtn:disabled { opacity: 0.4; cursor: not-allowed; transform: none; box-shadow: none; }

        /* ── Input area ── */
        .dz-inp-wrap {
          padding: 10px 16px 12px;
          display: flex;
          gap: 9px;
          border-top: 1px solid #e8dfc8;
          background: #fff;
          flex-shrink: 0;
          align-items: center;
        }

        .dz-inp {
          flex: 1;
          border: 1.5px solid #ddd4b8;
          border-radius: 24px;
          padding: 10px 18px;
          font-family: 'Jost', sans-serif;
          font-size: 13px;
          color: #2a3528;
          background: #faf8f3;
          outline: none;
          transition: all 0.22s ease;
        }

        .dz-inp:focus {
          border-color: #c9a84c;
          background: #fff;
          box-shadow: 0 0 0 3px rgba(201,168,76,0.12);
        }

        .dz-inp::placeholder { color: #b5a880; }
        .dz-inp:disabled { opacity: 0.5; }

        .dz-send {
          width: 42px;
          height: 42px;
          border-radius: 50%;
          background: #1f3d2e;
          border: 2px solid #c9a84c;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          transition: all 0.22s ease;
          box-shadow: 0 3px 12px rgba(31,61,46,0.3);
        }

        .dz-send:hover:not(:disabled) {
          background: #c9a84c;
          border-color: #a07830;
          transform: scale(1.06) translateY(-1px);
          box-shadow: 0 6px 18px rgba(201,168,76,0.4);
        }

        .dz-send:disabled { opacity: 0.35; cursor: not-allowed; transform: none; box-shadow: none; }
        .dz-send svg { width: 17px; height: 17px; color: #c9a84c; }
        .dz-send:hover:not(:disabled) svg { color: #fff; }

        /* ── Footer ── */
        .dz-foot {
          background: #fff;
          padding: 5px 0 8px;
          text-align: center;
          font-size: 10px;
          color: #c9a84c;
          letter-spacing: 1.5px;
          font-family: 'Cormorant Garamond', serif;
          font-style: italic;
          flex-shrink: 0;
          border-top: 1px solid #f0e8d5;
        }

        @media (max-width: 440px) {
          .dz-window { width: calc(100vw - 20px); height: 74vh; border-radius: 18px; }
          .dz-wrap { bottom: 14px; right: 10px; }
        }
      `}</style>

      <div className="dz-wrap">

        {/* ── Chat Window ── */}
        {isOpen && (
          <div className="dz-window">

            {/* Header */}
            <div className="dz-header">
              <div className="dz-av-ring">
                <div className="dz-av-inner">
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 12c2.761 0 5-2.239 5-5s-2.239-5-5-5-5 2.239-5 5 2.239 5 5 5zm0 2c-3.333 0-10 1.667-10 5v1h20v-1c0-3.333-6.667-5-10-5z"/>
                  </svg>
                </div>
              </div>
              <div className="dz-hinfo">
                <p className="dz-hname">Priya — Style Assistant</p>
                <p className="dz-hsub">
                  <span className="dz-live">
                    <span className="dz-live-dot" />
                    Online
                  </span>
                  &nbsp;·&nbsp; Dezire More
                </p>
              </div>
              <button className="dz-hclose" onClick={() => setIsOpen(false)}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M18 6L6 18M6 6l12 12"/>
                </svg>
              </button>
            </div>

            {/* Gold divider */}
            <div className="dz-divider">
              <div className="dz-div-line" />
              <span className="dz-div-text">✦ Ethnic Elegance. Modern You. ✦</span>
              <div className="dz-div-line" />
            </div>

            {/* Messages */}
            <div className="dz-msgs">
              {messages.map((msg, i) => (
                <div key={i} className={`dz-msg ${msg.from}`}>
                  {msg.from === "bot" && (
                    <div className="dz-mav">
                      <svg viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 12c2.761 0 5-2.239 5-5s-2.239-5-5-5-5 2.239-5 5 2.239 5 5 5zm0 2c-3.333 0-10 1.667-10 5v1h20v-1c0-3.333-6.667-5-10-5z"/>
                      </svg>
                    </div>
                  )}
                  <div className="dz-mcol">
                    <div className="dz-bubble" dangerouslySetInnerHTML={{ __html: formatMessage(msg.text) }} />
                    <span className="dz-mtime">{msg.time}</span>
                  </div>
                </div>
              ))}

              {isTyping && (
                <div className="dz-typing">
                  <div className="dz-mav">
                    <svg viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 12c2.761 0 5-2.239 5-5s-2.239-5-5-5-5 2.239-5 5 2.239 5 5 5zm0 2c-3.333 0-10 1.667-10 5v1h20v-1c0-3.333-6.667-5-10-5z"/>
                    </svg>
                  </div>
                  <div className="dz-tybub">
                    <div className="dz-td" />
                    <div className="dz-td" />
                    <div className="dz-td" />
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Quick Replies */}
            <div className="dz-quick">
              {quickReplies.map((qr, i) => (
                <button key={i} className="dz-qbtn" disabled={isTyping} onClick={() => sendMessage(qr)}>
                  {qr}
                </button>
              ))}
            </div>

            {/* Input */}
            <div className="dz-inp-wrap">
              <input
                ref={inputRef}
                className="dz-inp"
                placeholder="Ask me anything..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
                disabled={isTyping}
              />
              <button className="dz-send" onClick={() => sendMessage()} disabled={isTyping || !input.trim()}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M22 2L11 13M22 2L15 22l-4-9-9-4 20-7z"/>
                </svg>
              </button>
            </div>

            {/* Footer */}
            <div className="dz-foot">✦ Dezire More — Quintessential Queens ✦</div>
          </div>
        )}

        {/* ── Greeting Bubble ── */}
        {!isOpen && showGreeting && (
          <div className="dz-greet">
            <button className="dz-greet-close" onClick={(e) => { e.stopPropagation(); setShowGreeting(false); }}>✕</button>
            <p className="dz-greet-label">Style Assistant</p>
            <p className="dz-greet-name">👋 Hi, I'm Priya!</p>
            <p className="dz-greet-text">Your personal stylist at Dezire More. How can I help you today?</p>
          </div>
        )}

        {/* ── Toggle Button ── */}
        <button className="dz-toggle" onClick={() => { setIsOpen(!isOpen); setShowGreeting(false); }}>
          {isOpen ? (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M18 6L6 18M6 6l12 12"/>
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 12c2.761 0 5-2.239 5-5s-2.239-5-5-5-5 2.239-5 5 2.239 5 5 5zm0 2c-3.333 0-10 1.667-10 5v1h20v-1c0-3.333-6.667-5-10-5z"/>
            </svg>
          )}
          {!isOpen && unread > 0 && <span className="dz-badge">{unread}</span>}
        </button>
      </div>
    </>
  );
}