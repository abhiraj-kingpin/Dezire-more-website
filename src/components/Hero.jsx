import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";

const heroSlides = [
  {
    image: "/assets/hero/hero1.png",
    eyebrow: "Summer Luxury Edit 2026",
    title: ["Wear Your", "Culture", "With Grace"],
    subtitle: "Elegant ethnic silhouettes designed for the modern Indian woman who loves timeless fashion.",
  },
  {
    image: "/assets/hero/hero2.png",
    eyebrow: "New Arrivals 2026",
    title: ["Drape Yourself", "In", "Tradition"],
    subtitle: "Handcrafted sarees and kurtas that celebrate the artistry of Indian weavers.",
  },
];

const FALLBACK_IMAGES = [
  "https://images.unsplash.com/photo-1610030181087-540c8ccc4d3b?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1583391733956-6c78276477e2?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1595341888016-a392ef81b7de?auto=format&fit=crop&w=800&q=80",
];

const WHATSAPP_NUMBER = '918171761948';

function Hero() {
  const [current, setCurrent] = useState(0);
  const [animating, setAnimating] = useState(false);
  const [textVisible, setTextVisible] = useState(true);
  const [chatModalOpen, setChatModalOpen] = useState(false);
  const timerRef = useRef(null);

  const CROSSFADE_MS = 1000;
  const goTo = (next) => {
    if (animating || next === current) return;
    setAnimating(true);
    setTextVisible(false);
    setCurrent(next);

    setTimeout(() => {
      setTextVisible(true);
      setAnimating(false);
    }, CROSSFADE_MS);
  };

  const advance = () => {
    const next = (current + 1) % heroSlides.length;
    goTo(next);
  };

  useEffect(() => {
    timerRef.current = setInterval(advance, 4500);
    return () => clearInterval(timerRef.current);
  }, [current, animating]);

  const getCardClass = (idx) => {
    const total = heroSlides.length;
    const pos = (idx - current + total) % total;
    if (pos === 0) return "deck-card deck-top";
    if (pos === 1) return "deck-card deck-mid";
    return "deck-card deck-back";
  };

  const slide = heroSlides[current];

  const scrollToSection = (e, id) => {
    e.preventDefault();
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <section className="hero">
      <div className="hero-royal-glow"></div>

      <div className={`hero-text ${textVisible ? "hero-text-in" : "hero-text-out"}`}>
        <button type="button" className="btn-chat-us" onClick={() => setChatModalOpen(true)}>Chat With Us</button>
        <p className="hero-eyebrow">{slide.eyebrow}</p>
        <h1 className="hero-title">
          {slide.title[0]} <span className="accent">{slide.title[1]}</span>
          <br />{slide.title[2]}
        </h1>
        <p className="hero-subtitle">{slide.subtitle}</p>
        <div className="hero-btns">
          <a href="#new-arrivals" className="btn-primary" onClick={(e) => scrollToSection(e, 'new-arrivals')}>Shop New Arrivals</a>
          <a href="#collections" className="btn-outline" onClick={(e) => scrollToSection(e, 'collections')}>View Collections</a>
          <Link to="/our-story" className="btn-founder">Our Story</Link>
        </div>
      </div>

      <div className="hero-deck-wrap">
        <div className="hero-deck">
          {heroSlides.map((s, i) => (
            <div key={i} className={getCardClass(i)}>
              <img
                src={s.image}
                alt={s.title.join(' ')}
                loading={i === 0 ? 'eager' : 'lazy'}
                fetchPriority={i === 0 ? 'high' : 'auto'}
                onError={(e) => {
                  console.error("Failed to load hero image:", s.image);
                  e.currentTarget.onerror = null;
                  e.currentTarget.src = FALLBACK_IMAGES[i % FALLBACK_IMAGES.length];
                }}
              />
            </div>
          ))}
        </div>

        <svg className="hero-frame" viewBox="0 0 420 525" preserveAspectRatio="none" aria-hidden="true">
          <rect x="5" y="5" width="410" height="515" />
          <path className="corner" d="M5,42 L42,42 L42,5" />
          <path className="corner" d="M378,5 L378,42 L415,42" />
          <path className="corner" d="M415,483 L378,483 L378,520" />
          <path className="corner" d="M42,520 L42,483 L5,483" />
          <circle cx="210" cy="14" r="7" />
          <circle cx="210" cy="511" r="7" />
        </svg>

        <span className="hero-sparkle s1"></span>
        <span className="hero-sparkle s2"></span>
        <span className="hero-sparkle s3"></span>

        <div className="hero-dots">
          {heroSlides.map((_, i) => (
            <div
              key={i}
              className={`hero-dot ${i === current ? "active" : ""}`}
              onClick={() => goTo(i)}
            />
          ))}
        </div>
      </div>

      <div className="hero-stats">
        <div className="stat-card">
          <div className="num"><span className="gold">500</span>+</div>
          <div className="label">Premium Styles</div>
        </div>
        <div className="stat-card">
          <div className="num"><span className="gold">10</span>%</div>
          <div className="label">Off Sale</div>
        </div>
        <div className="stat-card">
          <div className="num">4.8<span className="gold">★</span></div>
          <div className="label">Customer Rating</div>
        </div>
      </div>

      {chatModalOpen && (
        <div className="chatus-overlay" onClick={() => setChatModalOpen(false)}>
          <div className="chatus-card" onClick={(e) => e.stopPropagation()}>
            <button className="chatus-close" onClick={() => setChatModalOpen(false)} aria-label="Close">×</button>

            <p className="chatus-eyebrow">Let's Talk Business</p>
            <h2 className="chatus-title">Chat With Us</h2>

            <ul className="chatus-list">
              <li>
                <span className="chatus-icon">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M21 8 12 3 3 8l9 5 9-5Z"/><path d="M3 8v8l9 5 9-5V8"/><path d="M12 13v8"/></svg>
                </span>
                We deal in bulk orders — weddings, events, and retail, we scale with you.
              </li>
              <li>
                <span className="chatus-icon">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M12 3C7 3 3 6.6 3 11c0 3 2 4.5 4 4.5h1.2c.9 0 1.4 1.1.8 1.8-.5.6-.2 1.7.9 1.7 5 0 9.1-4 9.1-9C19 6.6 15 3 12 3Z"/><circle cx="8" cy="10" r="1"/><circle cx="12" cy="7.5" r="1"/><circle cx="16" cy="10" r="1"/></svg>
                </span>
                Fully customisable on request — your design, your fabric, your vision.
              </li>
              <li>
                <span className="chatus-icon">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c2.5 2.5 3.8 5.7 3.8 9s-1.3 6.5-3.8 9c-2.5-2.5-3.8-5.7-3.8-9S9.5 5.5 12 3Z"/></svg>
                </span>
                Successfully delivered to addresses across India and worldwide.
              </li>
              <li>
                <span className="chatus-icon">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M12 3.5 14.6 9l6 .9-4.3 4.2 1 6-5.3-2.8-5.3 2.8 1-6-4.3-4.2 6-.9L12 3.5Z"/></svg>
                </span>
                Worldwide satisfaction — customers who order once, order again.
              </li>
            </ul>

            <p className="chatus-quote">
              We don't believe in "good enough." We believe in quality —
              stitched into every thread, checked in every order, and
              promised in everything we send you.
            </p>

            <a
              href={`https://wa.me/${WHATSAPP_NUMBER}`}
              target="_blank"
              rel="noreferrer"
              className="chatus-btn"
            >
              Chat on WhatsApp — +91 81717 61948
            </a>
          </div>
        </div>
      )}
    </section>
  );
}

export default Hero;