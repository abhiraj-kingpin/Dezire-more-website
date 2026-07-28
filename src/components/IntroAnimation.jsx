import { useState, useEffect } from 'react';

function IntroAnimation() {
  const [visible, setVisible] = useState(true);
  const [fadingOut, setFadingOut] = useState(false);

  useEffect(() => {
    const fadeTimer   = setTimeout(() => setFadingOut(true), 2000);
    const removeTimer = setTimeout(() => setVisible(false), 2600);
    return () => { clearTimeout(fadeTimer); clearTimeout(removeTimer); };
  }, []);

  if (!visible) return null;

  return (
    <div className={`intro-overlay ${fadingOut ? 'intro-fade-out' : ''}`}>
      <div className="intro-glow" aria-hidden="true"></div>
      <div className="intro-content">
        <div className="intro-logo-ring">
          <img src="/assets/logo/logo.png" alt="Dezire More" className="intro-logo" />
        </div>
        <div className="intro-wordmark">
          DEZIRE <span className="intro-gold">MORE</span>
        </div>
        <div className="intro-flourish" aria-hidden="true">
          <span></span><i>◆</i><span></span>
        </div>
        <p className="intro-tagline">Ethnic Elegance. Modern You.</p>
      </div>
    </div>
  );
}

export default IntroAnimation;
