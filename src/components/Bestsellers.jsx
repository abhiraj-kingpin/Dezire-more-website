import ProductCard from './ProductCard';
import { bestsellers } from '../data/products';

function Bestsellers() {
  return (
    <section className="new-arrivals">
      <div className="section-header">
        <h2>Bestsellers</h2>
        <div className="divider"><span className="diamond"></span></div>
        <p>Loved by our customers</p>
      </div>
      <div className="products-grid products-grid-3col">
        {bestsellers.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </section>
  );
}

export default Bestsellers;