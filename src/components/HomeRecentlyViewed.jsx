import { Link } from 'react-router-dom';
import { getRecentlyViewed, categoryToPath } from '../utils/recentlyViewed';

function HomeRecentlyViewed() {
  const items = getRecentlyViewed();
  if (items.length === 0) return null;

  return (
    <section className="home-product-row">
      <div className="home-product-row-header">
        <h2>Recently Viewed</h2>
      </div>
      <div className="recently-viewed-grid recently-viewed-grid-home">
        {items.slice(0, 6).map(item => (
          <Link to={categoryToPath(item.category)} key={item.id} className="recently-viewed-card">
            <div className="recently-viewed-img-wrap">
              {item.image ? <img src={item.image} alt={item.name} loading="lazy" decoding="async" /> : <div className="product-img-placeholder" />}
            </div>
            <p className="recently-viewed-name">{item.name}</p>
            <p className="recently-viewed-price">₹{Number(item.price).toLocaleString('en-IN')}</p>
          </Link>
        ))}
      </div>
    </section>
  );
}

export default HomeRecentlyViewed;
