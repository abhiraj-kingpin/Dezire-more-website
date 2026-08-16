import { Link } from 'react-router-dom';
import ProductCard from './ProductCard';
import { useTag } from '../hooks/useProducts';

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
