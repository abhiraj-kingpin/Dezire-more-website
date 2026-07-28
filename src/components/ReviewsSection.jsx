import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { BASE } from '../hooks/useProducts';

const SORT_OPTIONS = [
  { value: 'helpful', label: 'Most Helpful' },
  { value: 'newest',  label: 'Newest' },
  { value: 'oldest',  label: 'Oldest' },
  { value: 'highest', label: 'Highest Rated' },
  { value: 'lowest',  label: 'Lowest Rated' },
];

function StarPicker({ value, onChange }) {
  return (
    <div className="review-star-picker">
      {[1, 2, 3, 4, 5].map(n => (
        <button key={n} type="button" className={n <= value ? 'active' : ''} onClick={() => onChange(n)} aria-label={`${n} star`}>★</button>
      ))}
    </div>
  );
}

function WriteReviewForm({ productId, onSubmitted, onCancel }) {
  const { user, authHeaders } = useAuth();
  const { showToast } = useToast();
  const [rating, setRating] = useState(5);
  const [title, setTitle] = useState('');
  const [text, setText] = useState('');
  const [images, setImages] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!text.trim()) { showToast('Please write a few words about the product', 'info'); return; }
    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('productId', productId);
      formData.append('rating', rating);
      formData.append('title', title);
      formData.append('text', text);
      images.forEach(img => formData.append('images', img));

      const res = await fetch(`${BASE}/reviews`, { method: 'POST', headers: authHeaders(), body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Could not submit review');
      showToast('Review posted — thank you!', 'success');
      onSubmitted();
    } catch (err) {
      showToast(err.message, 'info');
    } finally {
      setSubmitting(false);
    }
  };

  if (!user) {
    return <p className="review-login-note">Log in to write a review for this product.</p>;
  }

  return (
    <form className="review-form" onSubmit={handleSubmit}>
      <label className="auth-label">Your Rating</label>
      <StarPicker value={rating} onChange={setRating} />
      <label className="auth-label">Review Title (optional)</label>
      <input className="auth-input" type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder="Sum it up in a few words" />
      <label className="auth-label">Your Review</label>
      <textarea className="auth-input review-textarea" value={text} onChange={e => setText(e.target.value)} placeholder="What did you like or dislike?" rows={4} />
      <label className="auth-label">Add Photos (optional, up to 4)</label>
      <input
        type="file"
        accept="image/*"
        multiple
        onChange={e => setImages(Array.from(e.target.files).slice(0, 4))}
      />
      <div className="address-form-actions">
        <button type="button" className="btn-outline" onClick={onCancel}>Cancel</button>
        <button type="submit" className="auth-submit" disabled={submitting}>{submitting ? 'Posting...' : 'Post Review'}</button>
      </div>
    </form>
  );
}

function ReviewCard({ review, onVote }) {
  const initials = review.userName?.[0]?.toUpperCase() || '?';
  return (
    <div className="review-card">
      <div className="review-card-header">
        <div className="review-avatar">{initials}</div>
        <div>
          <p className="review-author">
            {review.userName}
            {review.verifiedPurchase && <span className="review-verified-badge">✓ Verified Purchase</span>}
          </p>
          <p className="review-date">{new Date(review.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
        </div>
      </div>
      <div className="review-stars">{'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}</div>
      {review.title && <p className="review-title">{review.title}</p>}
      <p className="review-text">{review.text}</p>
      {review.images?.length > 0 && (
        <div className="review-photos">
          {review.images.map((img, i) => (
            <img key={i} src={img.url} alt={`Review photo ${i + 1}`} loading="lazy" decoding="async" />
          ))}
        </div>
      )}
      <button type="button" className={`review-helpful-btn ${review.helpfulByMe ? 'active' : ''}`} onClick={() => onVote(review.id)}>
        👍 Helpful {review.helpfulCount > 0 ? `(${review.helpfulCount})` : ''}
      </button>
    </div>
  );
}

function ReviewsSection({ productId }) {
  const { authHeaders } = useAuth();
  const [reviews, setReviews] = useState([]);
  const [breakdown, setBreakdown] = useState([]);
  const [total, setTotal] = useState(0);
  const [average, setAverage] = useState(0);
  const [sort, setSort] = useState('helpful');
  const [minRating, setMinRating] = useState('');
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams({ sort, ...(minRating ? { minRating } : {}) });
    fetch(`${BASE}/reviews/product/${productId}?${params}`, { headers: authHeaders() })
      .then(res => res.json())
      .then(data => {
        setReviews(data.data || []);
        setBreakdown(data.breakdown || []);
        setTotal(data.total || 0);
        setAverage(data.average || 0);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productId, sort, minRating]);

  useEffect(() => { load(); }, [load]);

  const handleVote = async (reviewId) => {
    const res = await fetch(`${BASE}/reviews/${reviewId}/helpful`, { method: 'POST', headers: authHeaders() });
    if (res.ok) load();
  };

  return (
    <div className="reviews-section">
      <div className="reviews-summary">
        <div className="reviews-average">
          <span className="reviews-average-num">{average || '—'}</span>
          <span className="reviews-average-stars">{'★'.repeat(Math.round(average))}{'☆'.repeat(5 - Math.round(average))}</span>
          <span className="reviews-average-count">{total} review{total !== 1 ? 's' : ''}</span>
        </div>
        <div className="reviews-breakdown">
          {breakdown.map(({ star, count }) => (
            <button
              key={star}
              type="button"
              className={`reviews-breakdown-row ${minRating === String(star) ? 'active' : ''}`}
              onClick={() => setMinRating(minRating === String(star) ? '' : String(star))}
            >
              <span>{star}★</span>
              <span className="reviews-breakdown-bar"><span style={{ width: total ? `${(count / total) * 100}%` : '0%' }} /></span>
              <span className="reviews-breakdown-count">{count}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="reviews-controls">
        <select className="reviews-sort-select" value={sort} onChange={e => setSort(e.target.value)}>
          {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        {!showForm && <button type="button" className="review-write-btn" onClick={() => setShowForm(true)}>Write a Review</button>}
      </div>

      {showForm && (
        <WriteReviewForm
          productId={productId}
          onCancel={() => setShowForm(false)}
          onSubmitted={() => { setShowForm(false); load(); }}
        />
      )}

      {loading && <p className="marquee-status">Loading reviews…</p>}
      {!loading && reviews.length === 0 && <p className="review-login-note">No reviews yet — be the first to share your experience.</p>}
      {!loading && reviews.map(review => (
        <ReviewCard key={review.id} review={review} onVote={handleVote} />
      ))}
    </div>
  );
}

export default ReviewsSection;
