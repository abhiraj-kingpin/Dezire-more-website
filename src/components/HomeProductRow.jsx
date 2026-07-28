import { Link } from 'react-router-dom';
import ProductCard from './ProductCard';
import { useTag } from '../hooks/useProducts';

// A simple horizontal-scroll product row for homepage sections (Bestsellers,
// Staff Picks) — deliberately not a re-implementation of the New Arrivals
// marquee's auto-scroll carousel, just a straightforward "browse and view all".
function HomeProductRow({ title, tag, viewAllLink, limit = 8 }) {
  const { products, loading } = useTag(tag, { limit });

  if (!loading && products.length === 0) return null;

  return (
    <section className="home-product-row">
      <div className="home-product-row-header">
        <h2>{title}</h2>
        {viewAllLink && <Link to={viewAllLink} className="home-product-row-viewall">View All →</Link>}
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

export default HomeProductRow;
