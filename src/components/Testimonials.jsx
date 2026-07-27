import { useState } from 'react';

const REVIEWS = [
  {
    name: 'Priya Malhotra',
    location: 'Delhi',
    rating: 5,
    text: "The saree I ordered for my sister's wedding was even more beautiful in person. The fabric, the finishing — everything felt premium. Dezire More has a customer for life.",
    photo: '/assets/testimonials/customer1.jpg',
  },
  {
    name: 'Ananya Reddy',
    location: 'Hyderabad',
    rating: 5,
    text: 'I love how every piece feels handpicked, not mass-produced. The dress material set I bought fit like it was tailored just for me. Truly modern yet rooted in tradition.',
    photo: '/assets/testimonials/customer2.jpg',
  },
  {
    name: 'Kavita Sharma',
    location: 'Jaipur',
    rating: 5,
    text: 'Fast delivery, easy exchange, and the kind of quality I usually only find in boutique stores. Their team even helped me pick colours over WhatsApp. Highly recommend!',
    photo: '/assets/testimonials/customer3.jpg',
  },
  {
    name: 'Neha Kapoor',
    location: 'Mumbai',
    rating: 5,
    text: 'Been shopping with Dezire More for over two years now. Their new arrivals never disappoint, and the ready-to-wear range is perfect for my busy work weeks.',
    photo: '/assets/testimonials/customer4.jpg',
  },
  {
    name: 'Simran Bedi',
    location: 'Chandigarh',
    rating: 5,
    text: "A brand that actually understands Indian body types and Indian occasions. My co-ord set got so many compliments at the Sangeet — will definitely be shopping again.",
    photo: '/assets/testimonials/customer5.jpg',
  },
];

function getInitials(name) {
  return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
}

function ReviewAvatar({ review }) {
  const [failed, setFailed] = useState(false);
  return (
    <div className="testimonial-avatar">
      {!failed && (
        <img src={review.photo} alt={review.name} onError={() => setFailed(true)} />
      )}
      {failed && <span>{getInitials(review.name)}</span>}
    </div>
  );
}

function ReviewCard({ review }) {
  return (
    <div className="testimonial-card">
      <span className="testimonial-quote-icon" aria-hidden="true">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
          <path d="M9.5 7C6.5 7 4 9.5 4 12.7c0 2.6 1.7 4.6 4 5.1l.6-1.6c-1.4-.4-2.3-1.5-2.3-3 .1 0 .3.1.5.1 1.5 0 2.7-1.2 2.7-2.8S11 7 9.5 7zm9 0c-3 0-5.5 2.5-5.5 5.7 0 2.6 1.7 4.6 4 5.1l.6-1.6c-1.4-.4-2.3-1.5-2.3-3 .1 0 .3.1.5.1 1.5 0 2.7-1.2 2.7-2.8S20 7 18.5 7z"/>
        </svg>
      </span>
      <ReviewAvatar review={review} />
      <div className="testimonial-stars">{'★'.repeat(review.rating)}</div>
      <p className="testimonial-text">{review.text}</p>
      <span className="testimonial-divider"></span>
      <p className="testimonial-name">{review.name}</p>
      <p className="testimonial-location">{review.location}</p>
    </div>
  );
}

function Testimonials() {
  const loopReviews = [...REVIEWS, ...REVIEWS];

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
            <ReviewCard key={`${review.name}-${i}`} review={review} />
          ))}
        </div>
      </div>
    </section>
  );
}

export default Testimonials;
