import { useState, useEffect } from 'react';

// The choreographed sequence (glow bloom, logo reveal, shine sweep, divider)
// finishes on its own around 3s -- held a couple seconds longer so it
// doesn't feel rushed, then fades out the same way the rest of the site's
// overlays do.
const ANIMATION_END_MS = 3000;
const HOLD_MS = 2000;
const FADE_MS = 600;

function IntroAnimation() {
  const [visible, setVisible] = useState(true);
  const [running, setRunning] = useState(false);
  const [fadingOut, setFadingOut] = useState(false);

  useEffect(() => {
    const raf = requestAnimationFrame(() => setRunning(true));
    const fadeTimer = setTimeout(() => setFadingOut(true), ANIMATION_END_MS + HOLD_MS);
    const removeTimer = setTimeout(() => setVisible(false), ANIMATION_END_MS + HOLD_MS + FADE_MS);
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
