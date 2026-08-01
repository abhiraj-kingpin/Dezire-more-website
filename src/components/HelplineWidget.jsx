import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageCircle, X, Send, Phone, Mail, MessageSquareText } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { BASE } from '../hooks/useProducts';
import { matchIntent } from '../utils/intentMatcher';
import { QUICK_REPLIES, CONTACT } from '../utils/faqData';

// Escape first, format second — every substitution below only ever emits
// from a fixed template applied to already-escaped text, so raw HTML in
// model output (or a prompt-injected reply) can never become live markup
// through the dangerouslySetInnerHTML render below.
const escapeHtml = (s) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const formatMessage = (text) =>
  escapeHtml(text)
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\n/g, '<br/>');

const STATUS_STEPS = [
  'Order Placed', 'Payment Confirmed', 'Processing',
  'Packed', 'Shipped', 'Out for Delivery', 'Delivered',
];

function HelpProductCard({ product, onNavigate }) {
  return (
    <button type="button" className="dz-pcard" onClick={() => onNavigate(product.url)}>
      {product.image
        ? <img src={product.image} alt="" className="dz-pcard-thumb" loading="lazy" />
        : <span className="dz-pcard-thumb" />}
      <span className="dz-pcard-info">
        <span className="dz-pcard-name">{product.name}</span>
        <span className="dz-pcard-price">₹{product.price?.toLocaleString('en-IN')}</span>
      </span>
    </button>
  );
}

function HelpOrderStatus({ order }) {
  const isCancelled = order.status === 'Cancelled';
  const stepIndex = STATUS_STEPS.indexOf(order.status);
  return (
    <div className="dz-ostep-card">
      <div className="dz-ostep-head">
        <span className="dz-ostep-num">{order.orderNumber}</span>
        <span className="dz-ostep-status">{order.status}</span>
      </div>
      {!isCancelled && (
        <div className="dz-ostep-dots">
          {STATUS_STEPS.map((step, i) => (
            <span key={step} className={`dz-ostep-dot ${i <= stepIndex ? 'done' : ''}`} title={step} />
          ))}
        </div>
      )}
      {order.status === 'Delivered' && order.deliveredAt ? (
        <p className="dz-ostep-eta">Delivered {new Date(order.deliveredAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</p>
      ) : !isCancelled && order.estimatedDelivery ? (
        <p className="dz-ostep-eta">Est. delivery: {new Date(order.estimatedDelivery).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</p>
      ) : null}
    </div>
  );
}

function HelpLoginPrompt({ onLogin }) {
  return (
    <button type="button" className="dz-login-prompt" onClick={onLogin}>
      Log in to check your order →
    </button>
  );
}

function HelpEscalation() {
  const message = encodeURIComponent("Hi, I'd like some help with my Dezire More order.");
  return (
    <div className="dz-escalate">
      <a className="dz-escalate-btn" href={`https://wa.me/${CONTACT.whatsappNumber}?text=${message}`} target="_blank" rel="noreferrer">
        <MessageSquareText size={15} strokeWidth={1.8} /> WhatsApp Us
      </a>
      <a className="dz-escalate-btn" href={CONTACT.phoneHref}>
        <Phone size={15} strokeWidth={1.8} /> {CONTACT.phoneDisplay}
      </a>
      <a className="dz-escalate-btn" href={`mailto:${CONTACT.email}`}>
        <Mail size={15} strokeWidth={1.8} /> {CONTACT.email}
      </a>
    </div>
  );
}

function HelpAttachment({ attachment, onNavigate, onLogin }) {
  if (!attachment) return null;
  if (attachment.type === 'products' && attachment.data?.length > 0) {
    return (
      <div className="dz-pcard-row">
        {attachment.data.map((p, i) => <HelpProductCard key={i} product={p} onNavigate={onNavigate} />)}
      </div>
    );
  }
  if (attachment.type === 'order_requires_auth') {
    return <HelpLoginPrompt onLogin={onLogin} />;
  }
  if (attachment.type === 'orders' && attachment.data?.length > 0) {
    return (
      <div className="dz-ostep-list">
        {attachment.data.map((o, i) => <HelpOrderStatus key={i} order={o} />)}
      </div>
    );
  }
  if (attachment.type === 'link') {
    return (
      <button type="button" className="dz-link-chip" onClick={() => onNavigate(attachment.url)}>
        {attachment.label} →
      </button>
    );
  }
  if (attachment.type === 'human') {
    return <HelpEscalation />;
  }
  return null;
}

function makeMsg(from, text, extra = {}) {
  return { from, text, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), ...extra };
}

export default function HelplineWidget() {
  const [isOpen, setIsOpen] = useState(false);
  // Shown once ever per browser, not on every page load/visit — same
  // "seen" pattern as IntroAnimation.jsx's own localStorage flag. The
  // initializer only reads (must stay pure — React.StrictMode calls it
  // twice in dev, so writing here made the 2nd call see the 1st call's
  // own write and always resolve to "already seen"); the write happens
  // once, as a mount effect, below.
  const [showGreeting, setShowGreeting] = useState(() => {
    try { return localStorage.getItem('dm_greeting_seen') !== 'true'; }
    catch { return true; }
  });
  useEffect(() => {
    if (!showGreeting) return;
    try { localStorage.setItem('dm_greeting_seen', 'true'); } catch { /* private browsing, etc. */ }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only the initial mount value matters
  }, []);
  const [messages, setMessages] = useState([
    makeMsg('bot', "Hi! 👋 Welcome to Dezire More. Ask me about your order, sizing, our collections, or styling advice — I'm here to help!"),
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [unread, setUnread] = useState(1);
  const [hiddenForOverlay, setHiddenForOverlay] = useState(false);
  const messagesEndRef = useRef(null);
  const conversationHistory = useRef([]);
  const inputRef = useRef(null);
  const navigate = useNavigate();
  const { authHeaders, promptLogin } = useAuth();

  const handleProductNav = (url) => { setIsOpen(false); navigate(url); };
  const handleLoginPrompt = () => promptLogin('Log in to check your order');

  // Settings/Cart/Wishlist/Search/Auth are drawers over the Home page, not
  // route changes, so they don't affect the Home-only mount check in
  // Layout.jsx — this hides the bubble/panel while one is open instead,
  // without unmounting (and losing) the conversation underneath.
  useEffect(() => {
    const onOverlayChange = (e) => setHiddenForOverlay(!!e.detail?.open);
    window.addEventListener('dm:overlay-visibility', onOverlayChange);
    return () => window.removeEventListener('dm:overlay-visibility', onOverlayChange);
  }, []);

  // The greeting bubble's own screen position is fixed (bottom-right corner),
  // but the homepage hero's "Chat With Us" button sits in normal document
  // flow, so its position varies with hero content/viewport height — a fixed
  // pixel offset can't reliably avoid colliding with it (verified live: it
  // does, on common mobile viewport sizes). Checking actual rects at render
  // time instead of guessing an offset works regardless of hero content.
  useEffect(() => {
    if (!showGreeting) return;
    const heroBtn = document.querySelector('.btn-chat-us');
    if (!heroBtn) return;
    const heroRect = heroBtn.getBoundingClientRect();
    // Mirrors .dz-greet's own fixed geometry: 30px wrap offset + up to 230px
    // width, sitting 76px above the 62px toggle button.
    const greetRect = { top: window.innerHeight - 30 - 62 - 76 - 90, bottom: window.innerHeight - 30 - 62 - 76, left: window.innerWidth - 30 - 230, right: window.innerWidth - 30 };
    const overlaps = heroRect.bottom > greetRect.top && heroRect.top < greetRect.bottom && heroRect.right > greetRect.left && heroRect.left < greetRect.right;
    if (overlaps) setShowGreeting(false);
  }, [showGreeting]);

  useEffect(() => {
    if (isOpen) {
      setUnread(0);
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        inputRef.current?.focus();
      }, 150);
    }
  }, [isOpen, messages]);

  const pushBot = (text, extra) => setMessages(prev => [...prev, makeMsg('bot', text, extra)]);

  const handleFaqTier = (entry) => {
    pushBot(entry.answer, entry.link ? { attachment: { type: 'link', label: entry.link.label, url: entry.link.url } } : undefined);
  };

  const handleHumanTier = () => {
    pushBot("Of course — here's how to reach our team directly:", { attachment: { type: 'human' } });
  };

  const handleOrderTier = async () => {
    try {
      const res = await fetch(`${BASE}/chat/order-status`, { headers: authHeaders() });
      const data = await res.json();
      if (data.requiresAuth) {
        pushBot("I'd love to check that — could you log in first?", { attachment: { type: 'order_requires_auth' } });
      } else if (data.found) {
        pushBot(data.orders.length > 1 ? "Here's what I found on your recent orders:" : "Here's your order status:", { attachment: { type: 'orders', data: data.orders } });
      } else {
        pushBot("I couldn't find any orders on your account yet.");
      }
    } catch {
      pushBot("I couldn't check that right now — please try again in a moment.");
    }
  };

  const handleProductTier = async (query) => {
    try {
      const res = await fetch(`${BASE}/chat/product-search?q=${encodeURIComponent(query)}`);
      const data = await res.json();
      if (data.products?.length > 0) {
        pushBot("Here's what I found!", { attachment: { type: 'products', data: data.products } });
      } else {
        pushBot("I couldn't find a match for that — try a different keyword, or browse our collections from the menu.");
      }
    } catch {
      pushBot("I couldn't search right now — please try again in a moment.");
    }
  };

  const handleAiTier = async (trimmed) => {
    const historyForRequest = [...conversationHistory.current];
    conversationHistory.current.push({ role: 'user', content: trimmed });
    try {
      const response = await fetch(`${BASE}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify({ message: trimmed, history: historyForRequest }),
      });
      const data = await response.json();
      const reply = data.reply || "I'm sorry, please try again! 😊";
      conversationHistory.current.push({ role: 'assistant', content: reply });
      if (conversationHistory.current.length > 10) {
        conversationHistory.current = conversationHistory.current.slice(-10);
      }
      const toolResult = data.toolResults?.[0];
      const attachment = toolResult?.type === 'products'
        ? { type: 'products', data: toolResult.data?.products || [] }
        : toolResult?.type === 'order_status' && toolResult.data?.requiresAuth
        ? { type: 'order_requires_auth' }
        : toolResult?.type === 'order_status' && toolResult.data?.found
        ? { type: 'orders', data: toolResult.data.orders }
        : undefined;
      pushBot(reply, { aiTier: true, attachment });
    } catch {
      pushBot('Oops! Something went wrong. Please try again in a moment! 😊', { aiTier: true });
    }
  };

  const sendMessage = async (text) => {
    const trimmed = (text ?? input).trim();
    if (!trimmed || isTyping) return;

    setMessages(prev => [...prev, makeMsg('user', trimmed)]);
    setInput('');
    setIsTyping(true);

    const intent = matchIntent(trimmed);
    try {
      if (intent.type === 'faq') {
        await new Promise(r => setTimeout(r, 350)); // brief pause reads more natural than an instant reply
        handleFaqTier(intent.entry);
      } else if (intent.type === 'human') {
        await new Promise(r => setTimeout(r, 350));
        handleHumanTier();
      } else if (intent.type === 'order') {
        await handleOrderTier();
      } else if (intent.type === 'product') {
        await handleProductTier(intent.query);
      } else {
        await handleAiTier(trimmed);
      }
    } finally {
      setIsTyping(false);
    }
  };

  if (hiddenForOverlay) return null;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;0,700;1,400;1,600&family=Jost:wght@300;400;500;600&display=swap');

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
        .dz-toggle svg { color: #e8c97a; }

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
        .dz-greet-label { font-size: 9px; letter-spacing: 2px; text-transform: uppercase; color: #1f3d2e; font-weight: 600; margin: 0 0 5px; }
        .dz-greet-name { font-family: 'Cormorant Garamond', serif; font-size: 15px; font-weight: 600; color: #1a2e22; margin: 0 0 4px; }
        .dz-greet-text { font-size: 12px; color: #7a6a50; margin: 0; line-height: 1.55; }

        @keyframes dz-pop {
          from { opacity: 0; transform: scale(0.8) translateY(10px); }
          to   { opacity: 1; transform: scale(1) translateY(0); }
        }

        .dz-window {
          width: 380px;
          height: 570px;
          background: #f7f3ea;
          border-radius: 22px;
          display: flex;
          flex-direction: column;
          overflow: hidden;
          animation: dz-rise 0.32s cubic-bezier(0.34,1.15,0.64,1);
          box-shadow: 0 24px 64px rgba(0,0,0,0.2), 0 0 0 1px rgba(201,168,76,0.25), inset 0 1px 0 rgba(255,255,255,0.8);
        }

        @keyframes dz-rise {
          from { opacity: 0; transform: translateY(24px) scale(0.94); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }

        /* Mobile: full-height bottom sheet instead of a floating panel */
        @media (max-width: 480px) {
          .dz-wrap { bottom: 16px; right: 16px; }
          .dz-window {
            position: fixed;
            inset: 0;
            width: 100vw;
            height: 100dvh;
            border-radius: 0;
          }
          .dz-greet { width: calc(100vw - 32px); right: -16px; }
        }

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
        .dz-av-inner svg { color: #c9a84c; }

        .dz-hinfo { flex: 1; }
        .dz-hname { font-family: 'Cormorant Garamond', serif; font-size: 17px; font-weight: 600; color: #fff; margin: 0 0 3px; letter-spacing: 0.3px; }
        .dz-hsub { font-size: 10px; color: rgba(201,168,76,0.8); margin: 0; letter-spacing: 1.2px; text-transform: uppercase; display: flex; align-items: center; gap: 5px; }
        .dz-live { display: flex; align-items: center; gap: 4px; }
        .dz-live-dot { width: 6px; height: 6px; background: #5cd98a; border-radius: 50%; animation: dz-glow 2s infinite; }

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

        .dz-divider { background: #fdf9f0; border-bottom: 1px solid #e8dfc8; padding: 7px 20px; display: flex; align-items: center; gap: 10px; flex-shrink: 0; }
        .dz-div-line { flex: 1; height: 0.5px; background: linear-gradient(90deg, transparent, #c9a84c, transparent); }
        .dz-div-text { font-family: 'Cormorant Garamond', serif; font-size: 10px; font-style: italic; color: #b8922e; letter-spacing: 1.8px; white-space: nowrap; }

        .dz-msgs { flex: 1 1 auto; min-height: 0; overflow-y: auto; padding: 18px 16px 12px; display: flex; flex-direction: column; gap: 13px; }
        .dz-msgs::-webkit-scrollbar { width: 3px; }
        .dz-msgs::-webkit-scrollbar-track { background: transparent; }
        .dz-msgs::-webkit-scrollbar-thumb { background: linear-gradient(#c9a84c, #8a6520); border-radius: 3px; }

        .dz-msg { display: flex; gap: 9px; max-width: 85%; min-width: 0; }
        .dz-msg.bot { align-self: flex-start; }
        .dz-msg.user { align-self: flex-end; flex-direction: row-reverse; }

        .dz-mav {
          width: 32px; height: 32px; border-radius: 50%;
          background: #1f3d2e; border: 1.5px solid rgba(201,168,76,0.5);
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0; align-self: flex-end;
        }
        .dz-mav svg { width: 17px; height: 17px; color: #c9a84c; }

        .dz-mcol { display: flex; flex-direction: column; gap: 4px; min-width: 0; }

        .dz-bubble {
          padding: 11px 15px;
          font-size: 13.5px;
          line-height: 1.65;
          max-width: 100%;
          word-wrap: break-word;
          overflow-wrap: break-word;
          word-break: break-word;
          white-space: normal;
        }
        .dz-msg.bot .dz-bubble {
          background: #fff;
          color: #2a3528;
          border-radius: 18px 18px 18px 4px;
          border: 1px solid #ede4cc;
          box-shadow: 0 2px 12px rgba(0,0,0,0.06);
        }
        /* AI-fallback replies (genuinely open-ended styling/conversation,
           not a FAQ/order/product lookup) get a royal-purple accent so
           they're visually distinguishable from deterministic answers at a
           glance, per the redesign spec. */
        .dz-msg.bot .dz-bubble.ai-tier {
          border-left: 3px solid #6b4c8a;
          background: linear-gradient(135deg, #fdfaff 0%, #fff 60%);
        }
        .dz-msg.user .dz-bubble {
          background: linear-gradient(135deg, #1f3d2e 0%, #2d5242 100%);
          color: #f0e8d5;
          border-radius: 18px 18px 4px 18px;
          border: 1px solid rgba(201,168,76,0.25);
          box-shadow: 0 2px 12px rgba(31,61,46,0.35);
        }

        .dz-mtime { font-size: 10px; color: #b0a480; padding: 0 5px; letter-spacing: 0.3px; }
        .dz-msg.user .dz-mtime { text-align: right; }

        .dz-typing { display: flex; gap: 9px; align-self: flex-start; align-items: flex-end; }
        .dz-tybub { background: #fff; border: 1px solid #ede4cc; border-radius: 18px 18px 18px 4px; padding: 13px 18px; display: flex; gap: 5px; align-items: center; box-shadow: 0 2px 12px rgba(0,0,0,0.06); }
        .dz-td { width: 7px; height: 7px; border-radius: 50%; animation: dz-bounce 1.3s infinite ease-in-out; }
        .dz-td:nth-child(1) { background: #c9a84c; animation-delay: 0s; }
        .dz-td:nth-child(2) { background: #a07830; animation-delay: 0.2s; }
        .dz-td:nth-child(3) { background: #7a5a20; animation-delay: 0.4s; }
        @keyframes dz-bounce { 0%, 60%, 100% { transform: translateY(0); } 30% { transform: translateY(-7px); } }

        .dz-quick { padding: 11px 16px 13px; display: flex; flex-wrap: wrap; gap: 7px 7px; flex-shrink: 0; border-top: 1px solid #e8dfc8; background: #fdf9f0; }
        .dz-qbtn {
          white-space: nowrap; padding: 6px 13px; border-radius: 20px;
          border: 1px solid #c9a84c; background: transparent; color: #7a5a20;
          font-family: 'Jost', sans-serif; font-size: 11.5px; font-weight: 500;
          cursor: pointer; transition: all 0.22s ease; letter-spacing: 0.3px;
        }
        .dz-qbtn:hover { background: #1f3d2e; color: #e8c97a; border-color: #1f3d2e; transform: translateY(-1px); box-shadow: 0 4px 12px rgba(31,61,46,0.3); }
        .dz-qbtn:disabled { opacity: 0.4; cursor: not-allowed; transform: none; box-shadow: none; }

        .dz-inp-wrap { padding: 10px 16px 12px; display: flex; gap: 9px; border-top: 1px solid #e8dfc8; background: #fff; flex-shrink: 0; align-items: center; }
        .dz-inp {
          flex: 1; border: 1.5px solid #ddd4b8; border-radius: 24px; padding: 10px 18px;
          font-family: 'Jost', sans-serif; font-size: 13px; color: #2a3528;
          background: #faf8f3; outline: none; transition: all 0.22s ease;
        }
        .dz-inp:focus { border-color: #c9a84c; background: #fff; box-shadow: 0 0 0 3px rgba(201,168,76,0.12); }
        .dz-inp::placeholder { color: #b5a880; }
        .dz-inp:disabled { opacity: 0.5; }

        .dz-send {
          width: 42px; height: 42px; border-radius: 50%; background: #1f3d2e;
          border: 2px solid #c9a84c; cursor: pointer; display: flex; align-items: center;
          justify-content: center; flex-shrink: 0; transition: all 0.22s ease;
          box-shadow: 0 3px 12px rgba(31,61,46,0.3);
        }
        .dz-send:hover:not(:disabled) { background: #c9a84c; border-color: #a07830; transform: scale(1.06) translateY(-1px); box-shadow: 0 6px 18px rgba(201,168,76,0.4); }
        .dz-send:disabled { opacity: 0.35; cursor: not-allowed; transform: none; box-shadow: none; }
        .dz-send svg { color: #c9a84c; }
        .dz-send:hover:not(:disabled) svg { color: #fff; }

        .dz-foot { background: #fff; padding: 5px 0 8px; text-align: center; font-size: 10px; color: #c9a84c; letter-spacing: 1.5px; font-family: 'Cormorant Garamond', serif; font-style: italic; flex-shrink: 0; border-top: 1px solid #f0e8d5; }

        .dz-pcard-row { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 8px; }
        .dz-pcard { display: flex; align-items: center; gap: 8px; width: 100%; padding: 6px; background: #fdf9f0; border: 1px solid #ede4cc; border-radius: 10px; cursor: pointer; text-align: left; font-family: 'Jost', sans-serif; transition: all 0.2s ease; }
        .dz-pcard:hover { border-color: #c9a84c; background: #fff; }
        .dz-pcard-thumb { width: 40px; height: 40px; border-radius: 6px; object-fit: cover; background: #ede4cc; flex-shrink: 0; }
        .dz-pcard-info { display: flex; flex-direction: column; gap: 2px; min-width: 0; }
        .dz-pcard-name { font-size: 12px; color: #2a3528; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .dz-pcard-price { font-size: 12px; font-weight: 700; color: #1f3d2e; }

        .dz-ostep-list { margin-top: 8px; display: flex; flex-direction: column; gap: 8px; }
        .dz-ostep-card { background: #fdf9f0; border: 1px solid #ede4cc; border-radius: 10px; padding: 10px 12px; }
        .dz-ostep-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px; }
        .dz-ostep-num { font-size: 12px; font-weight: 700; color: #1f3d2e; }
        .dz-ostep-status { font-size: 11px; font-weight: 600; color: #7a5a20; text-transform: uppercase; letter-spacing: 0.4px; }
        .dz-ostep-dots { display: flex; align-items: center; gap: 3px; margin-bottom: 6px; }
        .dz-ostep-dot { width: 6px; height: 6px; border-radius: 50%; background: #ddd4b8; flex: 1; }
        .dz-ostep-dot.done { background: #c9a84c; }
        .dz-ostep-eta { font-size: 11px; color: #7a6a50; margin: 0; }

        .dz-login-prompt {
          margin-top: 8px; padding: 9px 14px; border-radius: 20px; border: 1px solid #c9a84c;
          background: transparent; color: #7a5a20; font-size: 12px; font-weight: 600;
          cursor: pointer; font-family: 'Jost', sans-serif;
        }
        .dz-login-prompt:hover { background: #1f3d2e; color: #e8c97a; border-color: #1f3d2e; }

        .dz-link-chip {
          margin-top: 8px; padding: 9px 14px; border-radius: 20px; border: 1px solid #6b4c8a;
          background: transparent; color: #6b4c8a; font-size: 12px; font-weight: 600;
          cursor: pointer; font-family: 'Jost', sans-serif;
        }
        .dz-link-chip:hover { background: #6b4c8a; color: #fff; }

        .dz-escalate { display: flex; flex-direction: column; gap: 6px; margin-top: 8px; }
        .dz-escalate-btn {
          display: flex; align-items: center; gap: 8px; padding: 9px 13px;
          background: #fdf9f0; border: 1px solid #ede4cc; border-radius: 10px;
          color: #2a3528; font-size: 12px; font-weight: 600; text-decoration: none;
          transition: all 0.2s ease;
        }
        .dz-escalate-btn:hover { border-color: #c9a84c; background: #fff; }
        .dz-escalate-btn svg { color: #1f3d2e; flex-shrink: 0; }
      `}</style>

      <div className="dz-wrap">
        {isOpen && (
          <div className="dz-window">
            <div className="dz-header">
              <div className="dz-av-ring">
                <div className="dz-av-inner">
                  <MessageCircle size={22} strokeWidth={1.8} />
                </div>
              </div>
              <div className="dz-hinfo">
                <p className="dz-hname">Dezire More Help</p>
                <p className="dz-hsub">
                  <span className="dz-live"><span className="dz-live-dot" />Online</span>
                  &nbsp;·&nbsp; We're here to help
                </p>
              </div>
              <button className="dz-hclose" onClick={() => setIsOpen(false)} aria-label="Close">
                <X size={15} strokeWidth={2.5} />
              </button>
            </div>

            <div className="dz-divider">
              <div className="dz-div-line" />
              <span className="dz-div-text">Ethnic Elegance. Modern You.</span>
              <div className="dz-div-line" />
            </div>

            <div className="dz-msgs">
              {messages.map((msg, i) => (
                <div key={i} className={`dz-msg ${msg.from}`}>
                  {msg.from === 'bot' && (
                    <div className="dz-mav"><MessageCircle size={17} strokeWidth={1.8} /></div>
                  )}
                  <div className="dz-mcol">
                    <div
                      className={`dz-bubble ${msg.aiTier ? 'ai-tier' : ''}`}
                      dangerouslySetInnerHTML={{ __html: formatMessage(msg.text) }}
                    />
                    <HelpAttachment attachment={msg.attachment} onNavigate={handleProductNav} onLogin={handleLoginPrompt} />
                    <span className="dz-mtime">{msg.time}</span>
                  </div>
                </div>
              ))}

              {isTyping && (
                <div className="dz-typing">
                  <div className="dz-mav"><MessageCircle size={17} strokeWidth={1.8} /></div>
                  <div className="dz-tybub">
                    <div className="dz-td" /><div className="dz-td" /><div className="dz-td" />
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            <div className="dz-quick">
              {QUICK_REPLIES.map((qr, i) => (
                <button key={i} className="dz-qbtn" disabled={isTyping} onClick={() => sendMessage(qr)}>
                  {qr}
                </button>
              ))}
            </div>

            <div className="dz-inp-wrap">
              <input
                ref={inputRef}
                className="dz-inp"
                placeholder="Ask me anything..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
                disabled={isTyping}
              />
              <button className="dz-send" onClick={() => sendMessage()} disabled={isTyping || !input.trim()}>
                <Send size={17} strokeWidth={2} />
              </button>
            </div>

            <div className="dz-foot">Dezire More — Quintessential Queens</div>
          </div>
        )}

        {!isOpen && showGreeting && (
          <div className="dz-greet">
            <button className="dz-greet-close" onClick={(e) => { e.stopPropagation(); setShowGreeting(false); }} aria-label="Dismiss greeting">
              <X size={11} strokeWidth={2.5} />
            </button>
            <p className="dz-greet-label">Dezire More Help</p>
            <p className="dz-greet-name">👋 Need a hand?</p>
            <p className="dz-greet-text">Orders, sizing, styling, or anything else — ask away.</p>
          </div>
        )}

        {/* Closing is handled solely by the header's .dz-hclose once open —
            this used to also render as an X here, but .dz-wrap's fixed
            bottom-right position sits right over the panel's own input/send
            bar (especially the full-height mobile sheet), blocking it. One
            close button, always in the header, never duplicated here. */}
        {!isOpen && (
          <button className="dz-toggle" onClick={() => { setIsOpen(true); setShowGreeting(false); }} aria-label="Open help">
            <MessageCircle size={26} strokeWidth={1.8} />
            {unread > 0 && <span className="dz-badge">{unread}</span>}
          </button>
        )}
      </div>
    </>
  );
}
