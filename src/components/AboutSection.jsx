import { useEffect, useRef, useState } from 'react';

function AboutSection() {
  const innerRef = useRef(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = innerRef.current;
    if (!el) return undefined;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setInView(true); observer.disconnect(); } },
      { threshold: 0.25 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <section className="about-section">
      <div className="about-bg" aria-hidden="true"></div>

      <div className="section-header">
        <h2>About Us</h2>
        <div className="divider"><span className="diamond"></span></div>
        <p>Our story, our passion</p>
      </div>

      <div className={`about-inner ${inView ? 'about-in-view' : ''}`} ref={innerRef}>
        <p className="about-since">Est. 2013</p>
        <p>
          Since 2013, Dezire More has stood for one simple belief — that
          ethnic fashion is not just clothing, but a celebration of
          identity, heritage, and the timeless spirit of Indian culture.
          What began as a small, passionate venture has grown into a name
          trusted by thousands of women across the country, built one
          handpicked collection at a time. Over the years, we have stayed
          true to our founding promise: quality that lasts, craftsmanship
          that honours tradition, and designs that blend heritage
          silhouettes with a contemporary sensibility. Every piece is
          thoughtfully sourced — from everyday kurtas and dress materials
          to statement sarees and festive ready-to-wear — and every
          collection is curated with the modern Indian woman in mind. Our
          team works closely with skilled artisans and weavers to bring
          you designs that honour their craft while keeping you
          effortlessly in style. More than a decade on, when you shop with
          us, you are not just buying an outfit — you are carrying forward
          a legacy of elegance that has grown with you since day one.
        </p>

        <div className="about-stats">
          <div className="about-stat">
            <div className="about-stat-num">13<span className="gold">+</span></div>
            <div className="about-stat-label">Years of Legacy</div>
          </div>
          <div className="about-stat">
            <div className="about-stat-num">500<span className="gold">+</span></div>
            <div className="about-stat-label">Curated Styles</div>
          </div>
          <div className="about-stat">
            <div className="about-stat-num">4.8<span className="gold">★</span></div>
            <div className="about-stat-label">Customer Rating</div>
          </div>
        </div>

        <span className="about-highlight">❖ Ethnic Elegance. Modern You. ❖</span>
      </div>
    </section>
  );
}

export default AboutSection;
