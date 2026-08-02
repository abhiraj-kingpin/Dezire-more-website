import { useState, useEffect } from 'react';
import { BASE } from '../hooks/useProducts';

const FALLBACK = {
  name: 'Roop Kamal Taneja',
  title: 'Founder & CEO',
  quote:
    '“Fashion, for me, has never been just about fabric — it is about a woman’s story, stitched with heritage and worn with pride. Every collection we create carries that belief forward.”',
  bio: 'With a vision rooted in celebrating Indian craftsmanship, Roop Kamal Taneja founded Dezire More in 2013 to bring timeless ethnic elegance to the modern Indian woman. Under her leadership, the brand has grown from a small curated collection into a name trusted by thousands — built on an unwavering commitment to quality, artisanship, and customer trust.',
  photo: '',
};

function FounderSection() {
  const [founder, setFounder] = useState(FALLBACK);
  const [photoFailed, setPhotoFailed] = useState(false);

  useEffect(() => {
    fetch(`${BASE}/founder-settings`)
      .then(res => res.json())
      .then(data => {
        if (data && data.name) setFounder({ ...FALLBACK, ...data });
      })
      .catch(() => {});
  }, []);

  const initials = founder.name
    .split(' ')
    .map(w => w[0])
    .join('')
    .slice(0, 3)
    .toUpperCase();

  return (
    <section className="founder-section" id="founder-story">
      <div className="founder-glow" aria-hidden="true"></div>

      <div className="founder-inner">
        <div className="founder-photo-wrap">
          <div className={`founder-photo-frame ${!founder.photo || photoFailed ? 'no-photo' : ''}`}>
            {founder.photo && !photoFailed && (
              <img
                src={founder.photo}
                alt={`${founder.name} — ${founder.title}, Dezire More`}
                loading="lazy"
                decoding="async"
                onError={() => setPhotoFailed(true)}
              />
            )}
            {(!founder.photo || photoFailed) && <span className="founder-initials">{initials}</span>}
          </div>
          <span className="founder-corner tl"></span>
          <span className="founder-corner tr"></span>
          <span className="founder-corner bl"></span>
          <span className="founder-corner br"></span>
        </div>

        <div className="founder-content">
          <p className="founder-eyebrow">The Vision Behind Dezire More</p>
          <h2 className="founder-name">{founder.name}</h2>
          <p className="founder-title">{founder.title}</p>
          <p className="founder-quote">{founder.quote}</p>
          <p className="founder-bio">{founder.bio}</p>
        </div>
      </div>
    </section>
  );
}

export default FounderSection;
