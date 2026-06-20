import ProductCard from './ProductCard';
import { kurtas } from '../data/products';

function Kurtas() {
  return (
    <section className="new-arrivals">
      <div className="section-header">
        <h2>Kurtas</h2>
        <div className="divider"><span className="diamond"></span></div>
        <p>Everyday elegance, effortlessly styled</p>
      </div>
      <div className="products-grid products-grid-3col">
        {kurtas.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </section>
  );
}

export default Kurtas;