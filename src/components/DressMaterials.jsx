import ProductCard from './ProductCard';
import { dressMaterials } from '../data/products';

function DressMaterials() {
  return (
    <section className="new-arrivals">
      <div className="section-header">
        <h2>Dress Materials</h2>
        <div className="divider"><span className="diamond"></span></div>
        <p>Unstitched elegance, ready for your tailor</p>
      </div>
      <div className="products-grid products-grid-3col">
        {dressMaterials.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </section>
  );
}

export default DressMaterials;