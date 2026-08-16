import { useState, useEffect } from 'react';

const ANIMATION_END_MS = 3000;
const HOLD_MS = 2000;
const FADE_MS = 600;
const INTRO_SEEN_KEY = 'introSeen';

function IntroAnimation() {
  const alreadySeen = (() => {
    try { return localStorage.getItem(INTRO_SEEN_KEY) === 'true'; }
    catch { return false; }
  })();

  const [visible, setVisible] = useState(!alreadySeen);
  const [running, setRunning] = useState(false);
  const [fadingOut, setFadingOut] = useState(false);

  useEffect(() => {
    if (alreadySeen) return;
    const raf = requestAnimationFrame(() => setRunning(true));
    const fadeTimer = setTimeout(() => setFadingOut(true), ANIMATION_END_MS + HOLD_MS);
    const removeTimer = setTimeout(() => {
      setVisible(false);
      try { localStorage.setItem(INTRO_SEEN_KEY, 'true'); } catch { }
    }, ANIMATION_END_MS + HOLD_MS + FADE_MS);
    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(fadeTimer);
      clearTimeout(removeTimer);
    };
  }, []);

  if (!visible) return null;

  return (
    <div className={`intro-overlay ${fadingOut ? 'intro-fade-out' : ''}`}>
      <div className={`intro-stage ${running ? 'intro-run' : ''}`}>
        <div className="intro-medallion-glow" aria-hidden="true"></div>

        <div className="intro-logo-wrap">
          <img src="/assets/logo/logo.png" alt="Dezire More" />
          <span className="intro-shine" aria-hidden="true"></span>
        </div>

        <div className="intro-divider">
          <span className="intro-divider-line"></span>
          <span className="intro-divider-dot"></span>
          <span className="intro-divider-line"></span>
        </div>
      </div>
    </div>
  );
}

export default IntroAnimation;
