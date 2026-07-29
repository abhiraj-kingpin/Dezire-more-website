import { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useWishlist } from '../context/WishlistContext';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';
import useLockBodyScroll from '../hooks/useLockBodyScroll';
import { recordRecentlyViewed } from '../utils/recentlyViewed';
import { BASE } from '../hooks/useProducts';
import ReviewsSection from './ReviewsSection';
import { highlightMatch } from '../utils/fuzzySearch';

const SIZE_CHART = [
  { size: 'S',    chest: 36, waist: 36, hip: 40, kurtaLength: 47, pantsLength: 38 },
  { size: 'M',    chest: 38, waist: 38, hip: 42, kurtaLength: 47, pantsLength: 38 },
  { size: 'L',    chest: 40, waist: 40, hip: 44, kurtaLength: 47, pantsLength: 39 },
  { size: 'XL',   chest: 42, waist: 42, hip: 46, kurtaLength: 48, pantsLength: 39 },
  { size: 'XXL',  chest: 44, waist: 44, hip: 48, kurtaLength: 48, pantsLength: 39 },
  { size: 'XXXL', chest: 46, waist: 46, hip: 50, kurtaLength: 48, pantsLength: 39 },
];

const STANDARD_SIZES = SIZE_CHART.map(row => row.size);

// Keeps the modal's main image box close to the photo's own aspect ratio
// (measured on load) so `object-fit: contain` never has to letterbox large
// empty margins — bounded so an extreme panorama/strip photo can't distort
// the modal's layout.
function clampImageRatio(ratio) {
  return Math.min(1.6, Math.max(0.55, ratio));
}

// Sarees, jewelry/accessories, and dress materials are unstitched/one-size —
// no size selector or size chart needed. 'jewelry' and 'accessories' are kept
// here too since older products are still saved under those pre-merge values.
const NO_SIZE_CATEGORIES = ['sarees', 'jewelry-accessories', 'jewelry', 'accessories', 'dress-materials'];

function StarRating({ rating }) {
  return (
    <div className="star-rating">
      {[1, 2, 3, 4, 5].map(star => {
        const filled = rating >= star;
        const half   = !filled && rating >= star - 0.5;
        return (
          <span key={star} className={`star ${filled ? 'filled' : half ? 'half' : 'empty'}`}>★</span>
        );
      })}
    </div>
  );
}

// ─── Normalise a product from MongoDB into the shape the UI expects ───────────
function normalise(p) {
  // Images: MongoDB stores [{ url, publicId }], old data had a plain string
  const imageUrls =
    p.images && p.images.length > 0
      ? p.images.map(img => (typeof img === 'string' ? img : img.url))
      : p.image
      ? [p.image]
      : [];

  return {
    ...p,
    // Stable id regardless of source
    id:           p._id  || p.id,
    // Always a plain-string URL for the primary image
    image:        imageUrls[0] || '',
    // Always an array of plain-string URLs
    images:       imageUrls,
    // Booleans from tags (MongoDB) or legacy booleans (local data)
    isNew:        p.tags?.includes('new-arrival') ?? p.isNew        ?? false,
    isBestseller: p.tags?.includes('bestseller')  ?? p.isBestseller ?? false,
    // Fabric field maps to material display
    material:     p.fabric || p.material || '',
    // MongoDB stores colors as array; old data had a single 'colour' string
    colour:       p.colors?.[0] || p.colour || '',
    // Reviews count
    reviews:      p.reviewCount ?? p.reviews ?? 0,
  };
}

// Dispatches the "fly to cart" signal the Navbar listens for, so the product
// image animates into the cart icon and the icon gives a little bounce.
export function flyToCart(imgEl) {
  if (!imgEl) {
    window.dispatchEvent(new CustomEvent('dm:fly-to-cart', { detail: {} }));
    return;
  }
  const rect = imgEl.getBoundingClientRect();
  window.dispatchEvent(new CustomEvent('dm:fly-to-cart', {
    detail: { src: imgEl.currentSrc || imgEl.src, rect },
  }));
}

// Briefly ripples a button to give "processing" feedback before a transition.
export function ripple(btnEl) {
  if (!btnEl) return;
  btnEl.classList.remove('rippling');
  void btnEl.offsetWidth;
  btnEl.classList.add('rippling');
  setTimeout(() => btnEl.classList.remove('rippling'), 500);
}

// Spawns a tiny burst of floating hearts/sparkles from the wishlist button.
function spawnHeartBurst(btnEl) {
  if (!btnEl) return;
  const particles = ['♥', '✦', '♥', '✧', '♥'];
  particles.forEach((glyph, i) => {
    const span = document.createElement('span');
    span.className = 'heart-burst-particle';
    span.textContent = glyph;
    const angle = (Math.PI * 2 * i) / particles.length + (Math.random() * 0.6 - 0.3);
    const distance = 26 + Math.random() * 14;
    const dx = Math.cos(angle) * distance;
    const dy = Math.sin(angle) * distance - 10;
    span.style.setProperty('--burst-end', `translate(${dx}px, ${dy}px)`);
    span.style.left = '50%';
    span.style.top = '50%';
    span.style.color = i % 2 === 0 ? '#c0392b' : 'var(--gold)';
    btnEl.appendChild(span);
    setTimeout(() => span.remove(), 750);
  });
}

function ProductCard({ product: rawProduct, highlightQuery, onOpenModal, onAfterAddToCart }) {
  const product = normalise(rawProduct);

  const [hovered,       setHovered]       = useState(false);
  const [modalOpen,     setModalOpen]     = useState(false);
  const [activeImg,     setActiveImg]     = useState(0);
  const [sizeChartOpen, setSizeChartOpen] = useState(false);
  const [selectedSize,  setSelectedSize]  = useState(null);
  const [quantity,      setQuantity]      = useState(1);
  const [lightboxOpen,  setLightboxOpen]  = useState(false);
  const [zoom,          setZoom]          = useState(1);
  const [pan,           setPan]           = useState({ x: 0, y: 0 });
  const [mainImgRatio,  setMainImgRatio]  = useState(null);
  const [related,       setRelated]       = useState([]);

  const cardImgRef   = useRef(null);
  const modalImgRef  = useRef(null);
  const wishlistBtnRef      = useRef(null);
  const modalWishlistBtnRef = useRef(null);
  const dragState = useRef(null);
  const gallerySwipeRef = useRef(null);
  const lightboxSwipeRef = useRef(null);

  const { toggleWishlist, addToWishlist, isWishlisted } = useWishlist();
  const { addToCart, buyNow }            = useCart();
  const { showToast }                    = useToast();
  const wishlisted = isWishlisted(product.id);

  const needsSize      = !NO_SIZE_CATEGORIES.includes(product.category);
  const availableSizes = product.sizes?.length > 0 ? product.sizes : STANDARD_SIZES;

  const discount =
    product.originalPrice && product.originalPrice > product.price
      ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
      : 0;

  const galleryImages = product.images.length > 0 ? product.images : (product.image ? [product.image] : []);
  const hasVideo   = !!product.video?.url;
  const mediaCount = galleryImages.length + (hasVideo ? 1 : 0);
  const isVideoActive = hasVideo && activeImg === galleryImages.length;

  const openModal = () => {
    setActiveImg(0); setQuantity(1); setSelectedSize(null); setMainImgRatio(null); setModalOpen(true);
    recordRecentlyViewed(product);
    onOpenModal?.();
  };
  const closeModal = () => { setModalOpen(false); setLightboxOpen(false); };

  // Drop the previous image's measured ratio the moment we switch images so
  // the box doesn't briefly keep the old shape before the new one loads.
  useEffect(() => { setMainImgRatio(null); }, [activeImg]);

  const handleMainImgLoad = (e) => {
    const { naturalWidth, naturalHeight } = e.target;
    if (naturalWidth && naturalHeight) setMainImgRatio(clampImageRatio(naturalWidth / naturalHeight));
  };

  // "Similar Products" — fetched once per modal open, not kept in sync with
  // every re-render, since it's a lightweight browsing aid, not live data.
  useEffect(() => {
    if (!modalOpen) return;
    fetch(`${BASE}/products/${product.id}`)
      .then(res => res.json())
      .then(data => setRelated((data.related || []).filter(p => p._id !== product.id)))
      .catch(() => setRelated([]));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [modalOpen, product.id]);

  useLockBodyScroll(modalOpen || sizeChartOpen);

  // Esc closes the topmost open surface (lightbox first, then modal/size chart)
  useEffect(() => {
    if (!modalOpen && !sizeChartOpen) return;
    const onKeyDown = (e) => {
      if (e.key !== 'Escape') return;
      if (lightboxOpen) { setLightboxOpen(false); return; }
      if (sizeChartOpen) { setSizeChartOpen(false); return; }
      if (modalOpen) { closeModal(); return; }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [modalOpen, sizeChartOpen, lightboxOpen]);

  const showPrev = useCallback((e) => {
    e?.stopPropagation();
    setActiveImg(i => (i - 1 + mediaCount) % mediaCount);
    setZoom(1); setPan({ x: 0, y: 0 });
  }, [mediaCount]);

  const showNext = useCallback((e) => {
    e?.stopPropagation();
    setActiveImg(i => (i + 1) % mediaCount);
    setZoom(1); setPan({ x: 0, y: 0 });
  }, [mediaCount]);

  // The lightbox only ever shows images (video plays inline in the main
  // gallery instead), so it navigates within image bounds only.
  const showPrevImage = useCallback((e) => {
    e?.stopPropagation();
    if (galleryImages.length < 2) return;
    setActiveImg(i => (i - 1 + galleryImages.length) % galleryImages.length);
    setZoom(1); setPan({ x: 0, y: 0 });
  }, [galleryImages.length]);

  const showNextImage = useCallback((e) => {
    e?.stopPropagation();
    if (galleryImages.length < 2) return;
    setActiveImg(i => (i + 1) % galleryImages.length);
    setZoom(1); setPan({ x: 0, y: 0 });
  }, [galleryImages.length]);

  // Swipe-to-navigate on the main gallery image (mobile). A genuine swipe
  // preventDefaults the trailing synthetic click so it doesn't also open
  // the lightbox — a plain tap (no meaningful movement) still opens it.
  const handleGalleryTouchStart = (e) => {
    const t = e.touches[0];
    gallerySwipeRef.current = { x: t.clientX, y: t.clientY };
  };
  const handleGalleryTouchEnd = (e) => {
    const start = gallerySwipeRef.current;
    gallerySwipeRef.current = null;
    if (!start || mediaCount < 2) return;
    const t = e.changedTouches[0];
    const dx = t.clientX - start.x;
    const dy = t.clientY - start.y;
    if (Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy) * 1.5) {
      e.preventDefault();
      dx < 0 ? showNext() : showPrev();
    }
  };

  // Same idea inside the full-screen lightbox, but only while not zoomed in
  // (when zoomed, touch-drag pans the image instead — handled separately).
  const handleLightboxTouchStart = (e) => {
    const t = e.touches[0];
    if (zoom === 1) { lightboxSwipeRef.current = { x: t.clientX, y: t.clientY }; return; }
    onDragStart(t.clientX, t.clientY);
  };
  const handleLightboxTouchMove = (e) => {
    if (zoom === 1) return;
    const t = e.touches[0];
    onDragMove(t.clientX, t.clientY);
  };
  const handleLightboxTouchEnd = (e) => {
    if (zoom !== 1) { onDragEnd(); return; }
    const start = lightboxSwipeRef.current;
    lightboxSwipeRef.current = null;
    if (!start) return;
    const t = e.changedTouches[0];
    const dx = t.clientX - start.x;
    const dy = t.clientY - start.y;
    if (Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy) * 1.5) {
      dx < 0 ? showNextImage() : showPrevImage();
    }
  };

  // Arrow keys navigate the gallery while the modal or lightbox is open
  useEffect(() => {
    if (!modalOpen) return;
    const onKeyDown = (e) => {
      if (lightboxOpen) {
        if (e.key === 'ArrowLeft') showPrevImage();
        if (e.key === 'ArrowRight') showNextImage();
        return;
      }
      if (mediaCount < 2) return;
      if (e.key === 'ArrowLeft') showPrev();
      if (e.key === 'ArrowRight') showNext();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [modalOpen, lightboxOpen, mediaCount, showPrev, showNext, showPrevImage, showNextImage]);

  const handleCardWishlist = (e) => {
    e.stopPropagation();
    const added = toggleWishlist(product);
    if (added) {
      const btn = e.currentTarget;
      btn.classList.remove('pop');
      void btn.offsetWidth;
      btn.classList.add('pop');
      setTimeout(() => btn.classList.remove('pop'), 400);
      spawnHeartBurst(btn);
    }
  };

  const handleModalWishlist = () => {
    const btn = modalWishlistBtnRef.current;
    const wasAdded = !wishlisted;
    addToWishlist(product);
    if (wasAdded && btn) {
      btn.classList.remove('pop');
      void btn.offsetWidth;
      btn.classList.add('pop');
      setTimeout(() => btn.classList.remove('pop'), 400);
      spawnHeartBurst(btn);
    }
  };

  const handleCardAddToCart = (e) => {
    e.stopPropagation();
    if (needsSize) {
      showToast('Please select a size', 'info');
      openModal();
      return;
    }
    ripple(e.currentTarget);
    flyToCart(cardImgRef.current);
    addToCart(product);
    onAfterAddToCart?.();
  };

  // NOTE: `id` must always stay the real MongoDB product id — it's sent
  // straight through as `productId` on checkout. CartContext derives its own
  // cart-line key from id + selectedSize, so distinct sizes of the same
  // product still get separate cart rows without corrupting the real id.
  const cartProduct = () => (
    selectedSize ? { ...product, selectedSize } : product
  );

  const handleModalAddToCart = (e) => {
    if (needsSize && !selectedSize) { showToast('Please select a size', 'info'); return; }
    const btn = e.currentTarget;
    ripple(btn);
    flyToCart(modalImgRef.current || cardImgRef.current);
    addToCart(cartProduct(), { quantity });
    // Let the ripple be visible for a beat before the modal unmounts.
    setTimeout(closeModal, 200);
  };

  const handleModalBuyNow = (e) => {
    if (needsSize && !selectedSize) { showToast('Please select a size', 'info'); return; }
    const btn = e.currentTarget;
    ripple(btn);
    btn.disabled = true;
    // Show the ripple/loading feedback first, then transition into the
    // centered checkout modal — matching the requested "ripple, then
    // transition" flow instead of an instant jump.
    setTimeout(() => {
      buyNow(cartProduct(), quantity);
      closeModal();
    }, 380);
  };

  // ── Lightbox pan/zoom (mouse drag + wheel, touch drag + pinch-free double-tap) ──
  const toggleZoom = () => {
    setZoom(z => {
      const next = z > 1 ? 1 : 2.4;
      if (next === 1) setPan({ x: 0, y: 0 });
      return next;
    });
  };

  const onWheelZoom = (e) => {
    e.preventDefault();
    setZoom(z => {
      const next = Math.min(4, Math.max(1, z - e.deltaY * 0.0018));
      if (next === 1) setPan({ x: 0, y: 0 });
      return next;
    });
  };

  const onDragStart = (clientX, clientY) => {
    if (zoom === 1) return;
    dragState.current = { startX: clientX, startY: clientY, panX: pan.x, panY: pan.y };
  };
  const onDragMove = (clientX, clientY) => {
    if (!dragState.current) return;
    const dx = clientX - dragState.current.startX;
    const dy = clientY - dragState.current.startY;
    setPan({ x: dragState.current.panX + dx, y: dragState.current.panY + dy });
  };
  const onDragEnd = () => { dragState.current = null; };

  const openLightbox = () => { setZoom(1); setPan({ x: 0, y: 0 }); setLightboxOpen(true); };

  return (
    <>
      <div
        className="product-card"
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        <div className="product-img-wrap" onClick={openModal}>
          {product.image
            ? <img ref={cardImgRef} src={product.image} alt={product.name} loading="lazy" decoding="async" />
            : <div className="product-img-placeholder" />}

          {product.isNew        && <span className="product-badge badge-new">New</span>}
          {product.isBestseller && <span className="product-badge badge-best">Bestseller</span>}

          <button
            ref={wishlistBtnRef}
            className={`wishlist-btn ${wishlisted ? 'wishlisted' : ''}`}
            aria-label="Add to wishlist"
            onClick={handleCardWishlist}
          >
            <svg viewBox="0 0 24 24">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
            </svg>
          </button>

          {hovered && (
            <div className="view-details-overlay">
              <span>View Details</span>
            </div>
          )}
        </div>

        <div className="product-info" onClick={openModal} style={{ cursor: 'pointer' }}>
          <p className="brand-tag">{product.material || (product.category ? product.category.replace(/-/g, ' ') : 'Dezire More')}</p>
          <p className="product-name">
            {highlightQuery ? highlightMatch(product.name, highlightQuery) : product.name}
          </p>
          {product.rating > 0 && (
            <div className="card-rating">
              <StarRating rating={product.rating} />
              <span className="card-rating-num">{product.rating}{product.reviews > 0 ? ` (${product.reviews})` : ''}</span>
            </div>
          )}
          <div className="price-row">
            <span className="price-now">₹{product.price.toLocaleString('en-IN')}</span>
            {product.originalPrice > 0 && (
              <span className="price-was">₹{product.originalPrice.toLocaleString('en-IN')}</span>
            )}
            {discount > 0 && <span className="price-discount">{discount}% off</span>}
          </div>
          <button className="add-to-bag" onClick={handleCardAddToCart}>Add to Bag</button>
        </div>
      </div>

      {/* ── Product Detail Modal ── */}
      {/* Portalled to document.body: this card can sit inside a marquee/
          carousel wrapper whose :hover transform (which can get "stuck" on
          touch) would otherwise become the containing block for this
          position:fixed overlay, crushing it down to the card's own width. */}
      {modalOpen && createPortal(
        <div className="pd-overlay" onClick={closeModal}>
          <div className="pd-modal" onClick={e => e.stopPropagation()}>
            <button className="pd-close" onClick={closeModal} aria-label="Close">✕</button>

            {/* Left — Images: vertical thumbnail rail + large main image */}
            <div className="pd-left">
              <div className="pd-gallery">
                {mediaCount > 1 && (
                  <div className="pd-thumbs-vertical">
                    {galleryImages.map((img, i) => (
                      <button
                        key={i}
                        className={`pd-thumb ${i === activeImg ? 'active' : ''}`}
                        onClick={() => { setActiveImg(i); setZoom(1); setPan({ x: 0, y: 0 }); }}
                      >
                        <img src={img} alt={`${product.name} view ${i + 1}`} />
                      </button>
                    ))}
                    {hasVideo && (
                      <button
                        className={`pd-thumb pd-thumb-video ${isVideoActive ? 'active' : ''}`}
                        onClick={() => { setActiveImg(galleryImages.length); setZoom(1); setPan({ x: 0, y: 0 }); }}
                      >
                        <video src={product.video.url} muted />
                        <span className="pd-thumb-play">▶</span>
                      </button>
                    )}
                  </div>
                )}

                <div
                  className="pd-main-img-wrap"
                  style={!isVideoActive && mainImgRatio ? { aspectRatio: mainImgRatio } : undefined}
                  onClick={isVideoActive ? undefined : openLightbox}
                  onTouchStart={isVideoActive ? undefined : handleGalleryTouchStart}
                  onTouchEnd={isVideoActive ? undefined : handleGalleryTouchEnd}
                >
                  {isVideoActive ? (
                    <video
                      src={product.video.url}
                      className="pd-main-img"
                      controls
                      autoPlay
                      muted
                      loop
                      playsInline
                    />
                  ) : (
                    <>
                      <img
                        key={activeImg}
                        ref={modalImgRef}
                        src={galleryImages[activeImg] || product.image}
                        alt={product.name}
                        className="pd-main-img"
                        onLoad={handleMainImgLoad}
                      />
                      <div className="pd-zoom-hint">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/><line x1="11" y1="8" x2="11" y2="14"/><line x1="8" y1="11" x2="14" y2="11"/></svg>
                        Click to Zoom
                      </div>
                    </>
                  )}

                  {mediaCount > 1 && (
                    <>
                      <button className="pd-nav-arrow pd-nav-prev" onClick={showPrev} aria-label="Previous">‹</button>
                      <button className="pd-nav-arrow pd-nav-next" onClick={showNext} aria-label="Next">›</button>
                    </>
                  )}
                </div>
              </div>

              {mediaCount > 1 && (
                <div className="pd-thumbs-mobile">
                  {galleryImages.map((img, i) => (
                    <button
                      key={i}
                      className={`pd-thumb ${i === activeImg ? 'active' : ''}`}
                      onClick={() => { setActiveImg(i); setZoom(1); setPan({ x: 0, y: 0 }); }}
                    >
                      <img src={img} alt={`${product.name} view ${i + 1}`} />
                    </button>
                  ))}
                  {hasVideo && (
                    <button
                      className={`pd-thumb pd-thumb-video ${isVideoActive ? 'active' : ''}`}
                      onClick={() => { setActiveImg(galleryImages.length); setZoom(1); setPan({ x: 0, y: 0 }); }}
                    >
                      <video src={product.video.url} muted />
                      <span className="pd-thumb-play">▶</span>
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Right — Info */}
            <div className="pd-right">
              {product.isNew        && <div className="pd-badge">New Arrival</div>}
              {product.isBestseller && <div className="pd-badge pd-badge-gold">Bestseller</div>}

              <h2 className="pd-title">{product.name}</h2>
              <p className="pd-material">{product.material || 'Dezire More'}</p>

              {product.rating > 0 && (
                <div className="pd-rating-row">
                  <StarRating rating={product.rating} />
                  <span className="pd-rating-num">{product.rating}</span>
                  <span className="pd-reviews">({product.reviews} reviews)</span>
                </div>
              )}

              <div className="pd-price-row">
                <span className="pd-price-now">₹{product.price.toLocaleString('en-IN')}</span>
                {product.originalPrice > 0 && (
                  <span className="pd-price-was">₹{product.originalPrice.toLocaleString('en-IN')}</span>
                )}
                {discount > 0 && <span className="pd-discount">{discount}% off</span>}
              </div>

              <p className="pd-delivery-estimate">
                🚚 Estimated delivery in 7–10 business days · Free shipping above ₹1,699
              </p>

              {needsSize && (
                <div className="pd-size-select">
                  <div className="pd-size-select-header">
                    <span className="pd-detail-label">Select Size</span>
                    <button className="size-chart-link" onClick={() => setSizeChartOpen(true)}>
                      📏 Size Chart
                    </button>
                  </div>
                  <div className="pd-size-options">
                    {availableSizes.map(size => (
                      <button
                        key={size}
                        className={`pd-size-btn ${selectedSize === size ? 'active' : ''}`}
                        onClick={() => setSelectedSize(size)}
                      >
                        {size}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <hr className="pd-divider" />

              {product.description && (
                <p className="pd-description">{product.description}</p>
              )}

              <div className="pd-details">
                {product.colour && (
                  <div className="pd-detail-row">
                    <span className="pd-detail-label">Colour</span>
                    <span className="pd-detail-value">{product.colour}</span>
                  </div>
                )}
                {/* MongoDB: colors array — show all */}
                {!product.colour && product.colors?.length > 0 && (
                  <div className="pd-detail-row">
                    <span className="pd-detail-label">Colours</span>
                    <span className="pd-detail-value">{product.colors.join(', ')}</span>
                  </div>
                )}
                {product.length && (
                  <div className="pd-detail-row">
                    <span className="pd-detail-label">Length</span>
                    <span className="pd-detail-value">{product.length}</span>
                  </div>
                )}
                {product.occasion?.length > 0 && (
                  <div className="pd-detail-row">
                    <span className="pd-detail-label">Occasion</span>
                    <span className="pd-detail-value">
                      {Array.isArray(product.occasion)
                        ? product.occasion.join(', ')
                        : product.occasion}
                    </span>
                  </div>
                )}
                {product.care && (
                  <div className="pd-detail-row">
                    <span className="pd-detail-label">Care</span>
                    <span className="pd-detail-value">{product.care}</span>
                  </div>
                )}
                {product.sku && (
                  <div className="pd-detail-row">
                    <span className="pd-detail-label">SKU</span>
                    <span className="pd-detail-value">{product.sku}</span>
                  </div>
                )}
              </div>

              <div className="pd-qty-row">
                <span className="pd-detail-label">Quantity</span>
                <div className="cart-qty-row">
                  <button className="cart-qty-btn" onClick={() => setQuantity(q => Math.max(1, q - 1))} aria-label="Decrease quantity">−</button>
                  <span className="cart-qty-num">{quantity}</span>
                  <button className="cart-qty-btn" onClick={() => setQuantity(q => q + 1)} aria-label="Increase quantity">+</button>
                </div>
              </div>

              <div className="pd-action-row">
                <button className="pd-add-cart" onClick={handleModalAddToCart}>
                  Add to Cart
                </button>
                <button className="pd-buy-now" onClick={handleModalBuyNow}>
                  Buy Now
                </button>
              </div>
              <button
                ref={modalWishlistBtnRef}
                className={`pd-add-wishlist ${wishlisted ? 'active' : ''}`}
                onClick={handleModalWishlist}
              >
                {wishlisted ? '♥ Added to Wishlist' : '♡ Add to Wishlist'}
              </button>

              <p className="pd-footer-note">
                ✦ Free shipping above ₹1699 &nbsp;|&nbsp; Easy 3-day returns
              </p>
            </div>

            {related.length > 0 && (
              <div className="pd-related-wrap">
                <p className="pd-detail-label">You May Also Like</p>
                <div className="pd-related-grid">
                  {related.map(p => (
                    <ProductCard key={p._id} product={p} onOpenModal={closeModal} />
                  ))}
                </div>
              </div>
            )}

            <div className="pd-reviews-wrap">
              <p className="pd-detail-label">Ratings &amp; Reviews</p>
              <ReviewsSection productId={product.id} />
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* ── Full-screen Lightbox: zoom / pan / navigate ── */}
      {modalOpen && lightboxOpen && createPortal(
        <div className="lightbox-overlay" onClick={() => setLightboxOpen(false)}>
          <button className="lightbox-close" onClick={() => setLightboxOpen(false)} aria-label="Close zoom view">✕</button>

          {galleryImages.length > 1 && (
            <>
              <button className="lightbox-nav lightbox-nav-prev" onClick={showPrevImage} aria-label="Previous image">‹</button>
              <button className="lightbox-nav lightbox-nav-next" onClick={showNextImage} aria-label="Next image">›</button>
            </>
          )}

          <div className="lightbox-toolbar" onClick={e => e.stopPropagation()}>
            <button onClick={() => setZoom(z => Math.max(1, z - 0.5))} aria-label="Zoom out">−</button>
            <span>{Math.round(zoom * 100)}%</span>
            <button onClick={() => setZoom(z => Math.min(4, z + 0.5))} aria-label="Zoom in">+</button>
            <button onClick={() => { setZoom(1); setPan({ x: 0, y: 0 }); }} aria-label="Reset zoom">Reset</button>
          </div>

          <div
            className="lightbox-stage"
            onClick={e => e.stopPropagation()}
            onWheel={onWheelZoom}
            onDoubleClick={toggleZoom}
            onMouseDown={(e) => onDragStart(e.clientX, e.clientY)}
            onMouseMove={(e) => onDragMove(e.clientX, e.clientY)}
            onMouseUp={onDragEnd}
            onMouseLeave={onDragEnd}
            onTouchStart={handleLightboxTouchStart}
            onTouchMove={handleLightboxTouchMove}
            onTouchEnd={handleLightboxTouchEnd}
          >
            <img
              key={activeImg}
              src={galleryImages[activeImg] || product.image}
              alt={product.name}
              className="lightbox-img"
              draggable={false}
              style={{
                transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
                cursor: zoom > 1 ? 'grab' : 'zoom-in',
              }}
            />
          </div>
        </div>,
        document.body
      )}

      {/* ── Size Chart Modal ── */}
      {sizeChartOpen && createPortal(
        <div className="size-chart-overlay" onClick={() => setSizeChartOpen(false)}>
          <div className="size-chart-modal" onClick={e => e.stopPropagation()}>
            <div className="size-chart-header">
              <h3>Size Chart</h3>
              <button className="size-chart-close" onClick={() => setSizeChartOpen(false)} aria-label="Close size chart">✕</button>
            </div>
            <p className="size-chart-note">All sizes are in inches. Lengths can vary with styles.</p>
            <div className="size-chart-table-wrap">
              <table className="size-chart-table">
                <thead>
                  <tr>
                    <th>Size</th><th>Chest</th><th>Waist</th>
                    <th>Hip</th><th>Kurta Length</th><th>Pants Length</th>
                  </tr>
                </thead>
                <tbody>
                  {SIZE_CHART.map(row => (
                    <tr key={row.size}>
                      <td>{row.size}</td><td>{row.chest}</td><td>{row.waist}</td>
                      <td>{row.hip}</td><td>{row.kurtaLength}</td><td>{row.pantsLength}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="size-chart-footnote">
              All our unstitched/semi-stitched products are available up to chest size 54 (7XL).
              Dupatta lengths: 2.35–2.5 mts.
            </p>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}

export default ProductCard;
