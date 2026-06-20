import ProductSlider from './ProductSlider';
import { newArrivals } from '../data/products';

function NewArrivals() {
  return (
   <section className="new-arrivals" id="new-arrivals">
      <div className="section-header">
        <h2>New Arrivals</h2>
        <div className="divider"><span className="diamond"></span></div>
        <p>Fresh styles you'll love</p>
      </div>
      <ProductSlider products={newArrivals} />
    </section>
  );
}

export default NewArrivals;
