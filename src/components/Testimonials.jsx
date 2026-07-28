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
  {
    name: 'Priya Mal',
    location: 'Jalandhar',
    rating: 5,
    text: "Love your all collection, I'm buying beautiful suits and sarees from last 6 years. Every month I buy — na na karke bhi, I order. Seriously, I desire more, can't resist after seeing such elegant, beautiful pieces. Looking forward to shop more and more.",
    photo: '/assets/testimonials/customer6.png',
  },
  {
    name: 'Priya S.',
    location: 'Customer Since 2016',
    rating: 5,
    text: "I am absolutely in love with the hand-embroidered chiffon sarees from Dezire More! The craftsmanship is breathtaking, and the fabric drapes like an absolute dream. Every single piece I've bought feels so luxurious and special. Dezire More has truly become my go-to destination for timeless ethnic wear.",
    photo: '/assets/testimonials/customer7.jpg',
  },
  {
    name: 'Natasha K.',
    location: '',
    rating: 5,
    text: "The Parsi Gara saree I purchased from Dezire More is an absolute masterpiece. The intricate hand embroidery and heritage detailing are breathtaking, and you can truly feel the love and artistry poured into every stitch. It's a treasured piece in my wardrobe that always draws endless compliments!",
    photo: '/assets/testimonials/customer8.jpg',
  },
  {
    name: 'Sakshi',
    location: '',
    rating: 5,
    text: "I was honestly a bit hesitant to order ethnic wear online, but Dezire More completely changed my mind! From the exquisite craftsmanship of my first piece to the flawless quality, I am now a completely hooked regular client. Finding a brand that delivers such authentic elegance and reliability is rare.",
    photo: '/assets/testimonials/customer9.jpg',
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
