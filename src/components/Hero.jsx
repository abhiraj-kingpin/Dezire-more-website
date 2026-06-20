import { useState, useEffect } from "react";

const heroImages = [
  "/assets/hero/hero1.jpeg",
  "/assets/hero/hero2.jpeg",
  "/assets/hero/hero3.jpeg",
];

function Hero() {
  const [current, setCurrent] = useState(0);
  const [fading, setFading] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setFading(true);
      setTimeout(() => {
        setCurrent((prev) => (prev + 1) % heroImages.length);
        setFading(false);
      }, 600);
    }, 4000);

    return () => clearInterval(interval);
  }, []);

  return (
    <section className="hero">
      <div className="hero-text">
        <p className="hero-eyebrow">❖ Summer Luxury Edit 2026</p>
        <h2 className="hero-title">
          Wear Your <span className="accent">Culture</span><br />
          With Grace
        </h2>
        <p className="hero-subtitle">
          Elegant ethnic silhouettes designed for the modern Indian woman who
          loves timeless fashion.
        </p>
        <div className="hero-btns">
          <a href="/new-arrivals" className="btn-primary">Shop New Arrivals</a>
          <a href="/collections" className="btn-outline">View Collections</a>
        </div>
      </div>

      <div className="hero-image" style={{ position: "relative" }}>
        <img
          src={heroImages[current]}
          alt="Wear Your Culture With Grace"
          className={fading ? "hero-img-fade" : "hero-img-visible"}
        />
        <div className="hero-dots">
          {heroImages.map((_, i) => (
            <div
              key={i}
              className={`hero-dot ${i === current ? "active" : ""}`}
              onClick={() => setCurrent(i)}
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