import { useState, useEffect } from 'react';
import { BASE } from '../hooks/useProducts';

function getInitials(name) {
  return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
}

function ReviewAvatar({ review }) {
  const [failed, setFailed] = useState(false);
  const showPhoto = review.photo && !failed;
  return (
    <div className="testimonial-avatar">
      {showPhoto
        ? <img src={review.photo} alt={review.name} loading="lazy" decoding="async" onError={() => setFailed(true)} />
        : <span>{getInitials(review.name)}</span>}
    </div>
  );
}

function ReviewCard({ review }) {
  return (
    <div className="testimonial-card">
      <span className="testimonial-quote-mark" aria-hidden="true">&rdquo;</span>
      <ReviewAvatar review={review} />
      <div className="testimonial-stars">{'★'.repeat(review.rating)}</div>
      <p className="testimonial-text">{review.text}</p>
      <span className="testimonial-divider"></span>
      <p className="testimonial-name">{review.name}</p>
      {review.location && <p className="testimonial-location">{review.location}</p>}
    </div>
  );
}

// Managed from the admin panel's "Client Love" page — previously nine
// testimonials hardcoded directly here, meaning updating one meant editing
// source code and redeploying.
function Testimonials() {
  const [reviews, setReviews] = useState([]);

  useEffect(() => {
    fetch(`${BASE}/testimonials`)
      .then(res => res.json())
      .then(data => setReviews(data.data || []))
      .catch(() => setReviews([]));
  }, []);

  if (reviews.length === 0) return null;

  const loopReviews = [...reviews, ...reviews];

  return (
    <section className="testimonials-section">
      <div className="testimonials-bg" aria-hidden="true"></div>

      <div className="section-header testimonials-header">
        <h2>Client Love</h2>
        <div className="divider"><span className="diamond"></span></div>
        <p>Real words from real Dezire More women</p>
      </div>

      <div className="testimonials-marquee">
        <div className="testimonials-track">
          {loopReviews.map((review, i) => (
            <ReviewCard key={`${review._id}-${i}`} review={review} />
          ))}
        </div>
      </div>
    </section>
  );
}

export default Testimonials;
