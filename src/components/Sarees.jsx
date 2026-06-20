import { useState } from 'react';
import ProductCard from './ProductCard';
import { sarees } from '../data/products';

const FILTERS = ['All', 'New Arrivals', 'Bestsellers', 'On Sale', 'Silk', 'Cotton', 'Georgette'];
const SORT_OPTIONS = ['Featured', 'Price: Low to High', 'Price: High to Low', 'Newest First'];

function Sarees() {
  const [activeFilter, setActiveFilter] = useState('All');
  const [sortBy, setSortBy] = useState('Featured');

  const filtered = sarees.filter(p => {
    if (activeFilter === 'All') return true;
    if (activeFilter === 'New Arrivals') return p.isNew;
    if (activeFilter === 'Bestsellers') return p.isBestseller;
    if (activeFilter === 'On Sale') return p.originalPrice > p.price;
    return p.category === activeFilter;
  });

  const sorted = [...filtered].sort((a, b) => {
    if (sortBy === 'Price: Low to High') return a.price - b.price;
    if (sortBy === 'Price: High to Low') return b.price - a.price;
    return 0;
  });

  return (
    <section className="sarees-page">

      {/* Header */}
      <div className="sarees-page-header">
        <h1>Sarees</h1>
        <div className="divider"><span className="diamond"></span></div>
        <p>Showing {sorted.length} styles</p>
      </div>

      {/* Filter + Sort Bar */}
      <div className="sarees-filter-bar">
        <div className="sarees-filters">
          <span className="filter-label">Filter:</span>
          {FILTERS.map(f => (
            <button
              key={f}
              className={`filter-btn ${activeFilter === f ? 'active' : ''}`}
              onClick={() => setActiveFilter(f)}
            >
              {f}
            </button>
          ))}
        </div>
        <div className="sarees-sort">
          <span className="filter-label">Sort By</span>
          <select
            className="sort-select"
            value={sortBy}
            onChange={e => setSortBy(e.target.value)}
          >
            {SORT_OPTIONS.map(o => <option key={o}>{o}</option>)}
          </select>
        </div>
      </div>

      {/* Grid */}
      <div className="products-grid products-grid-3col">
        {sorted.map(product => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>

    </section>
  );
}

export default Sarees;