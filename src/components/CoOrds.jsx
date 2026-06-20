import ProductCard from './ProductCard';
import { coords } from '../data/products';

function CoOrds() {
  return (
    <section className="new-arrivals">
      <div className="section-header">
        <h2>Co-ords</h2>
        <div className="divider"><span className="diamond"></span></div>
        <p>Modern sets for effortless style</p>
      </div>
      <div className="products-grid products-grid-3col">
        {coords.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </section>
  );
}

export default CoOrds;