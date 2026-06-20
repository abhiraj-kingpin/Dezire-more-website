import { useRef, useEffect } from 'react';
import ProductCard from './ProductCard';

function ProductSlider({ products }) {
  const sliderRef = useRef(null);
  const intervalRef = useRef(null);
  const resumeTimeoutRef = useRef(null);
  const resetTimeoutRef = useRef(null);
  const isResettingRef = useRef(false);

  const startAutoScroll = () => {
    const slider = sliderRef.current;
    if (!slider) return;

    // Always clear any existing interval before creating a new one.
    // This makes startAutoScroll safe to call multiple times in a row.
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    intervalRef.current = setInterval(() => {
      if (isResettingRef.current) return; // wait for reset to finish, ignore ticks

      if (slider.scrollLeft + slider.clientWidth >= slider.scrollWidth - 10) {
        isResettingRef.current = true;
        slider.scrollTo({ left: 0, behavior: 'smooth' });

        // Clear any previous pending reset-unlock before scheduling a new one
        if (resetTimeoutRef.current) clearTimeout(resetTimeoutRef.current);
        resetTimeoutRef.current = setTimeout(() => {
          isResettingRef.current = false;
        }, 600);
      } else {
        slider.scrollBy({ left: 1, behavior: 'instant' });
      }
    }, 20);
  };

  const stopAutoScroll = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  useEffect(() => {
    startAutoScroll();
    return () => {
      stopAutoScroll();
      if (resumeTimeoutRef.current) clearTimeout(resumeTimeoutRef.current);
      if (resetTimeoutRef.current) clearTimeout(resetTimeoutRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const scroll = (direction) => {
    const slider = sliderRef.current;
    if (!slider) return;

    stopAutoScroll();
    isResettingRef.current = false; // cancel any in-progress reset lock from auto-scroll

    const card = slider.querySelector('.product-card');
    const cardWidth = card ? card.getBoundingClientRect().width + 16 : 296;
    slider.scrollBy({ left: direction * cardWidth, behavior: 'smooth' });

    // Cancel any previously queued resume before queueing a new one.
    // This prevents multiple rapid clicks from stacking multiple intervals.
    if (resumeTimeoutRef.current) clearTimeout(resumeTimeoutRef.current);
    resumeTimeoutRef.current = setTimeout(() => {
      startAutoScroll();
    }, 3000);
  };

  return (
    <div className="products-slider-wrapper">
      <button className="slider-btn" onClick={() => scroll(-1)} aria-label="Previous">‹</button>
      <div className="products-slider" ref={sliderRef}>
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
      <button className="slider-btn" onClick={() => scroll(1)} aria-label="Next">›</button>
    </div>
  );
}

export default ProductSlider;