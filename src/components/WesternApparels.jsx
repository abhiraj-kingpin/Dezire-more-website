import ProductCard from './ProductCard';
import { westernApparels } from '../data/products';

function WesternApparels() {
  return (
    <section className="new-arrivals">
      <div className="section-header">
        <h2>Western Apparels</h2>
        <div className="divider"><span className="diamond"></span></div>
        <p>Modern silhouettes, effortless style</p>
      </div>
      <div className="products-grid products-grid-3col">
        {westernApparels.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </section>
  );
}

export default WesternApparels;