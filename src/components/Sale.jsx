import ProductCard from './ProductCard';
import { sale } from '../data/products';

function Sale() {
  return (
    <>
      <section className="sale-banner">
        <img src="/assets/sarees/sale-banner.jpg" alt="Festive Sale" className="sale-banner-img" />
        <div className="sale-content">
          <p className="eyebrow">❖ Limited Time</p>
          <h2>The Sale</h2>
          <span className="sale-percent">Up to 50% Off</span>
          <p>On select sarees, lehengas &amp; festive sets — while stocks last.</p>
          <a href="#sale-products" className="btn-gold">Shop the Sale</a>
        </div>
      </section>

      <section className="new-arrivals" id="sale-products">
        <div className="section-header">
          <h2>Sale</h2>
          <div className="divider"><span className="diamond"></span></div>
          <p>Premium styles, special prices</p>
        </div>
        <div className="products-grid products-grid-3col">
          {sale.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>
    </>
  );
}

export default Sale;