import { useState } from 'react';
import ProductCard from './ProductCard';
import { useCategory } from '../hooks/useProducts';

const FILTERS = [
  { label: 'All',          value: '' },
  { label: 'New Arrivals', value: 'new-arrival' },
  { label: 'Bestsellers',  value: 'bestseller' },
];

const SORT_OPTIONS = [
  { label: 'Featured',           value: '' },
  { label: 'Price: Low to High', value: 'price-asc' },
  { label: 'Price: High to Low', value: 'price-desc' },
  { label: 'Newest First',       value: 'newest' },
  { label: 'Top Rated',          value: 'rating' },
];

const LIMIT = 12;

function Pagination({ page, totalPages, onPage }) {
  if (totalPages <= 1) return null;
  const pages = [];
  for (let i = 1; i <= totalPages; i++) pages.push(i);
  return (
    <div className="pagination">
      <button className="page-btn" disabled={page === 1} onClick={() => onPage(page - 1)}>← Prev</button>
      {pages.map(p => (
        <button key={p} className={`page-btn ${p === page ? 'active' : ''}`} onClick={() => onPage(p)}>{p}</button>
      ))}
      <button className="page-btn" disabled={page === totalPages} onClick={() => onPage(page + 1)}>Next →</button>
    </div>
  );
}

function CategoryPage({ title, category }) {
  const [activeFilter, setActiveFilter] = useState('');
  const [sort,         setSort]         = useState('');
  const [page,         setPage]         = useState(1);

  const filters = { limit: LIMIT, page };
  if (sort)         filters.sort = sort;
  if (activeFilter) filters.tag  = activeFilter;

  const { products, total, totalPages, loading, error } = useCategory(category, filters);

  const handleFilter = (val) => { setActiveFilter(val); setPage(1); };
  const handleSort   = (val) => { setSort(val);         setPage(1); };

  return (
    <section className="sarees-page">
      <div className="sarees-page-header">
        <h1>{title}</h1>
        <div className="divider"><span className="diamond"></span></div>
        <p>Showing {loading ? '…' : `${total} styles`}</p>
      </div>

      <div className="sarees-filter-bar">
        <div className="sarees-filters">
          <span className="filter-label">Filter:</span>
          {FILTERS.map(f => (
            <button key={f.value} className={`filter-btn ${activeFilter === f.value ? 'active' : ''}`} onClick={() => handleFilter(f.value)}>{f.label}</button>
          ))}
        </div>
        <div className="sarees-sort">
          <span className="filter-label">Sort By</span>
          <select className="sort-select" value={sort} onChange={e => handleSort(e.target.value)}>
            {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>
      </div>

      {loading && <p className="page-loading">Loading {title.toLowerCase()}…</p>}
      {error   && <p className="page-error">Could not load products. Is the backend running?</p>}

      {!loading && !error && (
        products.length === 0
          ? <p className="page-empty">No {title.toLowerCase()} found. Add some from the admin panel!</p>
          : (
            <>
              <div className="products-grid products-grid-3col">
                {products.map(product => (
                  <ProductCard key={product._id || product.id} product={product} />
                ))}
              </div>
              <Pagination page={page} totalPages={totalPages} onPage={setPage} />
            </>
          )
      )}
    </section>
  );
}

export function CoOrds()             { return <CategoryPage title="Co-ords"               category="coords"              />; }
export function DressMaterials()      { return <CategoryPage title="Dress Materials"       category="dress-materials"     />; }
export function ReadyToWear()         { return <CategoryPage title="Ready to Wear"         category="ready-to-wear"       />; }
export function WesternApparels()     { return <CategoryPage title="Western Apparels"      category="western"             />; }
export function JewelryAccessories()  { return <CategoryPage title="Jewelry & Accessories" category="jewelry-accessories" />; }

export default CategoryPage;