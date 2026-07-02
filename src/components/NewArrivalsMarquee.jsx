import { useRef, useEffect, useMemo, useCallback } from 'react';
import ProductCard from './ProductCard';
import { useTag } from '../hooks/useProducts';
import './NewArrivalsMarquee.css';

const TEASER_LIMIT = 50;

function MarqueeRow({ products, reverse }) {
  const trackRef      = useRef(null);
  const posRef        = useRef(null);
  const rafRef        = useRef(null);
  const pausedRef     = useRef(false);
  const resumeTimeout = useRef(null);
  const recenterTimeout = useRef(null);

  const loopProducts = useMemo(() => [...products, ...products, ...products], [products]);

  const SPEED = 0.6;

  const tick = useCallback(() => {
    const track = trackRef.current;
    if (!track || pausedRef.current) {
      rafRef.current = requestAnimationFrame(tick);
      return;
    }

    const width = track.scrollWidth / 3;

    if (posRef.current === null) {
      posRef.current = width;
      track.scrollLeft = width;
    }

    posRef.current += reverse ? -SPEED : SPEED;

    if (posRef.current >= width * 2) posRef.current -= width;
    if (posRef.current <= 0)         posRef.current += width;

    track.scrollLeft = posRef.current;
    rafRef.current = requestAnimationFrame(tick);
  }, [reverse]);

  useEffect(() => {
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(rafRef.current);
      clearTimeout(resumeTimeout.current);
      clearTimeout(recenterTimeout.current);
    };
  }, [tick]);

  const pause = () => { pausedRef.current = true; };
  const resume = () => { pausedRef.current = false; };

  const recenterIfNeeded = () => {
    const track = trackRef.current;
    if (!track || posRef.current === null) return;
    const width = track.scrollWidth / 3;
    if (posRef.current >= width * 2) {
      posRef.current -= width;
      track.scrollLeft = posRef.current;
    } else if (posRef.current <= 0) {
      posRef.current += width;
      track.scrollLeft = posRef.current;
    }
  };

  const nudge = (dir) => {
    const track = trackRef.current;
    if (!track) return;
    pause();

    const card      = track.querySelector('.marquee-card');
    const cardWidth = card ? card.getBoundingClientRect().width + 16 : 212;

    posRef.current = (posRef.current ?? track.scrollLeft) + dir * cardWidth;
    track.scrollTo({ left: posRef.current, behavior: 'smooth' });

    clearTimeout(recenterTimeout.current);
    recenterTimeout.current = setTimeout(recenterIfNeeded, 450);

    clearTimeout(resumeTimeout.current);
    resumeTimeout.current = setTimeout(resume, 3000);
  };

  return (
    <div className="marquee-row">
      <div
        className="marquee-track"
        ref={trackRef}
        onMouseEnter={pause}
        onMouseLeave={resume}
      >
        {loopProducts.map((product, i) => (
          <div className="marquee-card" key={`${product._id || product.id}-${i}`}>
            <ProductCard product={product} />
          </div>
        ))}
      </div>
      <div className="marquee-arrows">
        <button className="marquee-arrow" onClick={() => nudge(-1)} aria-label="Scroll left">
          <span aria-hidden="true">&#8249;</span>
        </button>
        <button className="marquee-arrow marquee-arrow-filled" onClick={() => nudge(1)} aria-label="Scroll right">
          <span aria-hidden="true">&#8250;</span>
        </button>
      </div>
    </div>
  );
}

function NewArrivalsMarquee() {
  const { products, loading, error } = useTag('new-arrival', { limit: TEASER_LIMIT, sort: 'newest' });

  const rowA = products.filter((_, i) => i % 2 === 0);
  const rowB = products.filter((_, i) => i % 2 === 1);

  const header = (
    <div className="marquee-header">
      <div className="marquee-ornament">
        <span className="marquee-orn-line" />
        <span className="marquee-orn-diamond">◆</span>
        <span className="marquee-orn-line" />
      </div>
      <p className="marquee-eyebrow">Quintessential Queens</p>
      <h2 className="marquee-title">
        <span className="marquee-title-new">New</span>
        <span className="marquee-title-arrivals"> Arrivals</span>
      </h2>
      <div className="marquee-ornament marquee-ornament-bottom">
        <span className="marquee-orn-line" />
        <span className="marquee-orn-lotus">✿</span>
        <span className="marquee-orn-line" />
      </div>
    </div>
  );

  if (loading) return (
    <section className="new-arrivals-marquee">
      {header}
      <p className="marquee-status">Loading new arrivals…</p>
    </section>
  );

  if (error) return (
    <section className="new-arrivals-marquee">
      {header}
      <p className="marquee-status">Could not load new arrivals. Is the backend running?</p>
    </section>
  );

  if (products.length === 0) return null;

  return (
    <section className="new-arrivals-marquee">
      <div className="marquee-bg" aria-hidden="true">
        <svg className="marquee-bg-svg" viewBox="0 0 1440 400" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <radialGradient id="glow1" cx="30%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#C9973A" stopOpacity="0.13" />
              <stop offset="100%" stopColor="#C9973A" stopOpacity="0" />
            </radialGradient>
            <radialGradient id="glow2" cx="75%" cy="40%" r="45%">
              <stop offset="0%" stopColor="#C9973A" stopOpacity="0.09" />
              <stop offset="100%" stopColor="#C9973A" stopOpacity="0" />
            </radialGradient>
          </defs>
          <rect width="1440" height="400" fill="url(#glow1)" />
          <rect width="1440" height="400" fill="url(#glow2)" />
          <g className="bg-arcs" stroke="#C9973A" strokeWidth="0.6" fill="none" opacity="0.18">
            <path d="M-60,200 Q180,40 440,200 Q700,360 960,200 Q1220,40 1500,200" />
            <path d="M-60,240 Q180,80 440,240 Q700,400 960,240 Q1220,80 1500,240" />
            <path d="M-60,160 Q180,0 440,160 Q700,320 960,160 Q1220,0 1500,160" />
            <path d="M-60,290 Q200,130 460,290 Q720,450 980,290 Q1240,130 1500,290" />
            <path d="M-60,110 Q200,-50 460,110 Q720,270 980,110 Q1240,-50 1500,110" />
          </g>
          <g className="bg-dots" fill="#C9973A" opacity="0.22">
            <circle cx="120"  cy="60"  r="1.5"/>
            <circle cx="360"  cy="340" r="1.5"/>
            <circle cx="600"  cy="80"  r="2"/>
            <circle cx="820"  cy="320" r="1.5"/>
            <circle cx="1040" cy="70"  r="1.5"/>
            <circle cx="1260" cy="310" r="2"/>
            <circle cx="240"  cy="200" r="1"/>
            <circle cx="720"  cy="180" r="1"/>
            <circle cx="1100" cy="200" r="1"/>
          </g>
          <g className="bg-corners" stroke="#C9973A" strokeWidth="0.8" fill="none" opacity="0.25">
            <path d="M20,20 Q60,20 60,60 M20,20 Q20,60 60,60" />
            <path d="M1420,20 Q1380,20 1380,60 M1420,20 Q1420,60 1380,60" />
            <path d="M20,380 Q60,380 60,340 M20,380 Q20,340 60,340" />
            <path d="M1420,380 Q1380,380 1380,340 M1420,380 Q1420,340 1380,340" />
          </g>
        </svg>
      </div>

      {header}

      <MarqueeRow products={rowA} reverse={false} />
      {rowB.length > 0 && <MarqueeRow products={rowB} reverse />}

      <div className="marquee-cta-wrap">
        <a className="marquee-cta" href="/new-arrivals">
          <span className="marquee-cta-text">View All New Arrivals</span>
          <span className="marquee-cta-arrow">→</span>
        </a>
      </div>
    </section>
  );
}

export default NewArrivalsMarquee;