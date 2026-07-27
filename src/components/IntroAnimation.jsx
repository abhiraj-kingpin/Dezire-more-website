import { useState, useEffect } from 'react';

function IntroAnimation() {
  const [visible, setVisible] = useState(true);
  const [fadingOut, setFadingOut] = useState(false);

  useEffect(() => {
    const fadeTimer   = setTimeout(() => setFadingOut(true), 1800);
    const removeTimer = setTimeout(() => setVisible(false), 2400);
    return () => { clearTimeout(fadeTimer); clearTimeout(removeTimer); };
  }, []);

  if (!visible) return null;

  return (
    <div className={`intro-overlay ${fadingOut ? 'intro-fade-out' : ''}`}>
      <div className="intro-content">
        <img src="/assets/logo/logo.jpg" alt="Dezire More" className="intro-logo" />
        <div className="intro-wordmark">
          DEZIRE <span className="intro-gold">MORE</span>
        </div>
        <p className="intro-tagline">Ethnic Elegance. Modern You.</p>
        <div className="intro-shimmer-line"></div>
      </div>
    </div>
  );
}

export default IntroAnimation;
