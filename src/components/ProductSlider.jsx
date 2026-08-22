import { useRef, useEffect } from 'react';
import ProductCard from './ProductCard';

function ProductSlider({ products }) {
  const sliderRef = useRef(null);
  const intervalRef = useRef(null);
  const resumeTimeoutRef = useRef(null);
  const recenterTimeoutRef = useRef(null);

  const loopProducts = [...products, ...products, ...products];

  const getSetWidth = () => {
    const slider = sliderRef.current;
    return slider ? slider.scrollWidth / 3 : 0;
  };

  const recenterIfNeeded = () => {
    const slider = sliderRef.current;
    const setWidth = getSetWidth();
    if (!slider || !setWidth) return;
    if (slider.scrollLeft >= setWidth * 2) {
      slider.scrollLeft -= setWidth;
    } else if (slider.scrollLeft <= 0) {
      slider.scrollLeft += setWidth;
    }
  };

  const startAutoScroll = () => {
    const slider = sliderRef.current;
    if (!slider) return;

    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    const setWidth = getSetWidth();
    if (setWidth && slider.scrollLeft < setWidth * 0.5) {
      slider.scrollLeft = setWidth;
    }

    intervalRef.current = setInterval(() => {
      const width = getSetWidth();
      if (!width) return;

      slider.scrollLeft += 1;

      if (slider.scrollLeft >= width * 2) {
        slider.scrollLeft -= width;
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
      if (recenterTimeoutRef.current) clearTimeout(recenterTimeoutRef.current);
    };
  }, []);

  useEffect(() => {
    const slider = sliderRef.current;
    if (!slider) return;

    let userInteracting = false;
    let settleTimeout;

    const handleInteractionStart = () => {
      userInteracting = true;
      stopAutoScroll();
      if (resumeTimeoutRef.current) clearTimeout(resumeTimeoutRef.current);
      if (settleTimeout) clearTimeout(settleTimeout);
      settleTimeout = setTimeout(() => {
        userInteracting = false;
        resumeTimeoutRef.current = setTimeout(startAutoScroll, 1200);
      }, 500);
    };

    const handlePointerDown = (e) => {
      if (e.pointerType && e.pointerType !== 'touch' && e.pointerType !== 'pen') return;
      handleInteractionStart();
    };

    const handleScroll = () => {
      if (!userInteracting) return;
      if (settleTimeout) clearTimeout(settleTimeout);
      settleTimeout = setTimeout(() => {
        userInteracting = false;
        recenterIfNeeded();
        resumeTimeoutRef.current = setTimeout(startAutoScroll, 1200);
      }, 150);
    };

    slider.addEventListener('touchstart', handleInteractionStart, { passive: true });
    slider.addEventListener('pointerdown', handlePointerDown);
    slider.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      slider.removeEventListener('touchstart', handleInteractionStart);
      slider.removeEventListener('pointerdown', handlePointerDown);
      slider.removeEventListener('scroll', handleScroll);
      if (settleTimeout) clearTimeout(settleTimeout);
    };
  }, []);

  const scroll = (direction) => {
    const slider = sliderRef.current;
    if (!slider) return;

    stopAutoScroll();

    const card = slider.querySelector('.product-card');
    const cardWidth = card ? card.getBoundingClientRect().width + 16 : 296;
    slider.scrollBy({ left: direction * cardWidth, behavior: 'smooth' });

    if (recenterTimeoutRef.current) clearTimeout(recenterTimeoutRef.current);
    recenterTimeoutRef.current = setTimeout(recenterIfNeeded, 450);

    if (resumeTimeoutRef.current) clearTimeout(resumeTimeoutRef.current);
    resumeTimeoutRef.current = setTimeout(() => {
      startAutoScroll();
    }, 3000);
  };

  return (
    <div className="products-slider-wrapper">
      <button className="slider-btn" onClick={() => scroll(-1)} aria-label="Previous">‹</button>
      <div className="products-slider" ref={sliderRef}>
        {loopProducts.map((product, i) => (
          <ProductCard key={`${product.id}-${i}`} product={product} />
        ))}
      </div>
      <button className="slider-btn" onClick={() => scroll(1)} aria-label="Next">›</button>
    </div>
  );
}

export default ProductSlider;