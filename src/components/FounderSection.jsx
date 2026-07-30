import { useState } from 'react';

function FounderSection() {
  const [photoFailed, setPhotoFailed] = useState(false);

  return (
    <section className="founder-section" id="founder-story">
      <div className="founder-glow" aria-hidden="true"></div>

      <div className="founder-inner">
        <div className="founder-photo-wrap">
          <div className={`founder-photo-frame ${photoFailed ? 'no-photo' : ''}`}>
            {!photoFailed && (
              <img
                src="/assets/founder/roop-kamal-taneja.jpg"
                alt="Roop Kamal Taneja — Founder & CEO, Dezire More"
                loading="lazy"
                decoding="async"
                onError={() => setPhotoFailed(true)}
              />
            )}
            {photoFailed && <span className="founder-initials">RKT</span>}
          </div>
          <span className="founder-corner tl"></span>
          <span className="founder-corner tr"></span>
          <span className="founder-corner bl"></span>
          <span className="founder-corner br"></span>
        </div>

        <div className="founder-content">
          <p className="founder-eyebrow">The Vision Behind Dezire More</p>
          <h2 className="founder-name">Roop Kamal Taneja</h2>
          <p className="founder-title">Founder &amp; CEO</p>
          <p className="founder-quote">
            &ldquo;Fashion, for me, has never been just about fabric — it is
            about a woman&apos;s story, stitched with heritage and worn with
            pride. Every collection we create carries that belief
            forward.&rdquo;
          </p>
          <p className="founder-bio">
            With a vision rooted in celebrating Indian craftsmanship, Roop
            Kamal Taneja founded Dezire More in 2013 to bring timeless
            ethnic elegance to the modern Indian woman. Under her
            leadership, the brand has grown from a small curated collection
            into a name trusted by thousands — built on an unwavering
            commitment to quality, artisanship, and customer trust.
          </p>
        </div>
      </div>
    </section>
  );
}

export default FounderSection;
