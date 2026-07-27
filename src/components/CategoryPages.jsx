import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import ProductCard from './ProductCard';
import { useCategory } from '../hooks/useProducts';

const FILTERS = [
  { label: 'All',          value: '' },
  { label: 'New Arrivals', value: 'new-arrival' },
  { label: 'Bestsellers',  value: 'bestseller' },
];

export const READY_TO_WEAR_SUBCATEGORIES = [
  { label: 'Suits',          value: 'suits' },
  { label: 'Co-ords',        value: 'coords' },
  { label: 'Blouses',        value: 'blouses' },
  { label: 'Dresses',        value: 'dresses' },
  { label: 'Ethnic Skirts',  value: 'ethnic-skirts' },
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

function CategoryPage({ title, category, subcategories }) {
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeFilter,      setActiveFilter]      = useState('');
  const [activeSubcategory, setActiveSubcategory]  = useState(searchParams.get('subcategory') || '');
  const [sort,              setSort]              = useState('');
  const [page,              setPage]              = useState(1);

  const filters = { limit: LIMIT, page };
  if (sort)              filters.sort        = sort;
  if (activeFilter)      filters.tag         = activeFilter;
  if (activeSubcategory) filters.subcategory = activeSubcategory;

  const { products, total, totalPages, loading, error } = useCategory(category, filters);

  const handleFilter = (val) => { setActiveFilter(val); setPage(1); };
  const handleSort   = (val) => { setSort(val);         setPage(1); };
  const handleSubcategory = (val) => {
    setActiveSubcategory(val);
    setPage(1);
    setSearchParams(val ? { subcategory: val } : {});
  };

  return (
    <section className="sarees-page">
      <div className="sarees-page-header">
        <h1>{title}</h1>
        <div className="divider"><span className="diamond"></span></div>
        <p>Showing {loading ? '…' : `${total} styles`}</p>
      </div>

      {subcategories && subcategories.length > 0 && (
        <div className="sarees-subtypes">
          <button
            className={`subtype-btn ${activeSubcategory === '' ? 'active' : ''}`}
            onClick={() => handleSubcategory('')}
          >
            All Types
          </button>
          {subcategories.map(s => (
            <button
              key={s.value}
              className={`subtype-btn ${activeSubcategory === s.value ? 'active' : ''}`}
              onClick={() => handleSubcategory(s.value)}
            >
              {s.label}
            </button>
          ))}
        </div>
      )}

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

export function DressMaterials()      { return <CategoryPage title="Dress Materials"       category="dress-materials"     />; }
export function ReadyToWear()         { return <CategoryPage title="Ready to Wear"         category="ready-to-wear"       subcategories={READY_TO_WEAR_SUBCATEGORIES} />; }
export function WesternApparels()     { return <CategoryPage title="Western Apparels"      category="western"             />; }
export function Jewelry()             { return <CategoryPage title="Jewelry"               category="jewelry"             />; }
export function Accessories()         { return <CategoryPage title="Accessories"           category="accessories"         />; }

export default CategoryPage;
