import ProductCard from './ProductCard';
import { readyToWear } from '../data/products';

function ReadyToWear() {
  return (
    <section className="new-arrivals">
      <div className="section-header">
        <h2>Ready to Wear</h2>
        <div className="divider"><span className="diamond"></span></div>
        <p>Stitched &amp; ready, straight to you</p>
      </div>
      <div className="products-grid products-grid-3col">
        {readyToWear.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </section>
  );
}

export default ReadyToWear;