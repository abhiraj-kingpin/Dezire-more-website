import { useState, useEffect } from 'react';

const ORBS = [
  [14, 26, 60], [86, 20, 44], [10, 72, 50], [90, 66, 66],
  [50, 12, 36], [50, 88, 54], [26, 50, 40], [74, 50, 46],
];

// The choreographed sequence (curtain, medallion, wordmark shine) finishes
// on its own around 4.05s -- held a couple seconds longer so it doesn't feel
// rushed, then fades out the same way the rest of the site's overlays do.
const ANIMATION_END_MS = 4100;
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
        <div className="intro-bokeh" aria-hidden="true">
          {ORBS.map(([left, top, size], i) => (
            <span
              key={i}
              className="intro-orb"
              style={{ left: `${left}%`, top: `${top}%`, width: size, height: size, animationDelay: `${i * 0.7}s` }}
            />
          ))}
        </div>

        <div className="intro-curtain" aria-hidden="true">
          <div className="intro-panel intro-panel-left"><span className="intro-sheen"></span></div>
          <div className="intro-panel intro-panel-right"><span className="intro-sheen"></span></div>
        </div>

        <div className="intro-medallion-glow" aria-hidden="true"></div>

        <div className="intro-emblem-wrap">
          <svg className="intro-medallion" viewBox="-100 -100 200 200">
            <circle className="intro-ring" cx="0" cy="0" r="86" />
            <circle className="intro-ring2" cx="0" cy="0" r="74" />
            <g className="intro-crown" transform="translate(0,-52)">
              <path d="M -12 5 L -9 -7 L -4 -1 L 0 -11 L 4 -1 L 9 -7 L 12 5 Z" />
            </g>
            <text className="intro-monogram" x="0" y="9" textAnchor="middle">
              <tspan className="intro-monogram-d" fontSize="32">D</tspan>
              <tspan className="intro-monogram-amp" dy="-2">&amp;</tspan>
              <tspan className="intro-monogram-m" fontSize="32">M</tspan>
            </text>
          </svg>
        </div>

        <div className="intro-wordmark-block">
          <div className="intro-wordmark">
            <span className="intro-wordmark-mask">DEZIRE <span className="intro-wordmark-acc">MORE</span></span>
          </div>
          <div className="intro-divider">
            <span className="intro-divider-line"></span>
            <span className="intro-divider-dot"></span>
            <span className="intro-divider-line"></span>
          </div>
          <p className="intro-tagline">Ethnic Elegance. Modern You.</p>
        </div>
      </div>
    </div>
  );
}

export default IntroAnimation;
