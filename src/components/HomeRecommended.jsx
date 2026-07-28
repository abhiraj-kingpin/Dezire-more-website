import { Link } from 'react-router-dom';
import ProductCard from './ProductCard';
import { useCategory } from '../hooks/useProducts';
import { getRecentlyViewed, categoryToPath } from '../utils/recentlyViewed';

// A light, honest form of "personalization": whichever category the
// customer has actually been browsing (from Recently Viewed) gets more of
// its products surfaced here — no fabricated AI/ML claims, just a simple,
// transparent heuristic.
function mostViewedCategory() {
  const items = getRecentlyViewed();
  if (items.length === 0) return null;
  const counts = {};
  items.forEach(item => {
    if (!item.category) return;
    counts[item.category] = (counts[item.category] || 0) + 1;
  });
  const entries = Object.entries(counts);
  if (entries.length === 0) return null;
  return entries.sort((a, b) => b[1] - a[1])[0][0];
}

function HomeRecommended() {
  const category = mostViewedCategory();
  const { products, loading } = useCategory(category || '', { limit: 8 });

  if (!category || (!loading && products.length === 0)) return null;

  return (
    <section className="home-product-row">
      <div className="home-product-row-header">
        <h2>Recommended For You</h2>
        <Link to={categoryToPath(category)} className="home-product-row-viewall">View All →</Link>
      </div>
      <div className="home-product-row-track">
        {loading
          ? <p className="marquee-status">Loading…</p>
          : products.map(p => (
              <div className="home-product-row-item" key={p._id}>
                <ProductCard product={p} />
              </div>
            ))}
      </div>
    </section>
  );
}

export default HomeRecommended;
