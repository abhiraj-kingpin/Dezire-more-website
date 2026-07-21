import { useState, useEffect, useRef } from "react";

const heroSlides = [
  {
    image: "/assets/hero/hero1.jpeg",
    eyebrow: "✦ Summer Luxury Edit 2026",
    title: ["Wear Your", "Culture", "With Grace"],
    subtitle: "Elegant ethnic silhouettes designed for the modern Indian woman who loves timeless fashion.",
  },
  {
    image: "/assets/hero/hero2.jpeg",
    eyebrow: "✦ New Arrivals 2026",
    title: ["Drape Yourself", "In", "Tradition"],
    subtitle: "Handcrafted sarees and kurtas that celebrate the artistry of Indian weavers.",
  },
  {
    image: "/assets/hero/hero3.jpeg",
    eyebrow: "✦ Bridal Collection",
    title: ["Begin Your", "Story", "In Style"],
    subtitle: "Luxurious bridal and festive wear for the most important moments of your life.",
  },
];

function Hero() {
  const [current, setCurrent] = useState(0);
  const [animating, setAnimating] = useState(false);
  const [exitIdx, setExitIdx] = useState(null);
  const [textVisible, setTextVisible] = useState(true);
  const timerRef = useRef(null);

  const goTo = (next) => {
    if (animating || next === current) return;
    setAnimating(true);

    // Step 1 — fade text out + card exits together
    setTextVisible(false);
    setExitIdx(current);

    // Step 2 — halfway through, swap the slide
    setTimeout(() => {
      setCurrent(next);
      setExitIdx(null);
    }, 220);

    // Step 3 — fade text back in
    setTimeout(() => {
      setTextVisible(true);
      setAnimating(false);
    }, 320);
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
    if (idx === exitIdx) return "deck-card deck-exit";
    if (pos === 0) return "deck-card deck-top";
    if (pos === 1) return "deck-card deck-mid";
    return "deck-card deck-back";
  };

  const slide = heroSlides[current];

  return (
    <section className="hero">
      <div className={`hero-text ${textVisible ? "hero-text-in" : "hero-text-out"}`}>
        <p className="hero-eyebrow">{slide.eyebrow}</p>
        <h2 className="hero-title">
          {slide.title[0]} <span className="accent">{slide.title[1]}</span>
          <br />{slide.title[2]}
        </h2>
        <p className="hero-subtitle">{slide.subtitle}</p>
        <div className="hero-btns">
          <a href="/new-arrivals" className="btn-primary">Shop New Arrivals</a>
          <a href="/collections" className="btn-outline">View Collections</a>
        </div>
      </div>

      <div className="hero-deck-wrap">
        <div className="hero-deck">
          {heroSlides.map((s, i) => (
            <div key={i} className={getCardClass(i)}>
              <img src={s.image} alt={s.title.join(' ')} />
            </div>
          ))}
        </div>

        {/* signature gold jaali frame — decorative only, stays fixed while cards swap beneath it */}
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
          <div className="num"><span className="gold">40</span>%</div>
          <div className="label">Off Sale</div>
        </div>
        <div className="stat-card">
          <div className="num">4.8<span className="gold">★</span></div>
          <div className="label">Customer Rating</div>
        </div>
      </div>
    </section>
  );
}

export default Hero;