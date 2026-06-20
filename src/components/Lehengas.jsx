import ProductCard from './ProductCard';
import { lehengas } from '../data/products';

function Lehengas() {
  return (
    <section className="new-arrivals">
      <div className="section-header">
        <h2>Lehengas</h2>
        <div className="divider"><span className="diamond"></span></div>
        <p>Bridal &amp; festive grandeur</p>
      </div>
      <div className="products-grid products-grid-3col">
        {lehengas.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </section>
  );
}

export default Lehengas;