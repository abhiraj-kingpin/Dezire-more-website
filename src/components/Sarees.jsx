import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import ProductCard from './ProductCard';
import SortDropdown from './SortDropdown';
import FilterPanel from './FilterPanel';
import { useCategory, useFacets } from '../hooks/useProducts';

const FILTERS = [
  { label: 'All',          value: '' },
  { label: 'New Arrivals', value: 'new-arrival' },
  { label: 'Bestsellers',  value: 'bestseller' },
  { label: 'On Sale',      value: 'sale' },
];

export const SAREE_SUBCATEGORIES = [
  { label: 'Printed Chiffons',                    value: 'printed-chiffon' },
  { label: 'Hand Embroidered Chiffon/Georgette',  value: 'hand-embroidered-chiffon-georgette' },
  { label: 'Hand Embroidered Crepe Sarees',       value: 'hand-embroidered-crepe' },
  { label: 'Mul Cotton Sarees',                   value: 'mul-cotton' },
  { label: 'Handloom Sarees',                     value: 'handloom' },
  { label: 'Persian Sarees',                      value: 'persian' },
  { label: 'Kashmiri Sarees',                     value: 'kashmiri' },
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

function Sarees() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeFilter,      setActiveFilter]      = useState('');
  const [activeSubcategory, setActiveSubcategory]  = useState(searchParams.get('subcategory') || '');
  const [sort,              setSort]              = useState('');
  const [page,              setPage]              = useState(1);
  const [advancedFilters,   setAdvancedFilters]   = useState({});
  const [filtersOpen,       setFiltersOpen]       = useState(false);

  const facets = useFacets('sarees');

  const filters = { limit: LIMIT, page, ...advancedFilters };
  if (sort)              filters.sort        = sort;
  if (activeFilter)      filters.tag         = activeFilter;
  if (activeSubcategory) filters.subcategory = activeSubcategory;

  const { products, total, totalPages, loading, error } = useCategory('sarees', filters);

  const handleFilter = (val) => { setActiveFilter(val); setPage(1); };
  const handleSort   = (val) => { setSort(val);         setPage(1); };
  const handleSubcategory = (val) => {
    setActiveSubcategory(val);
    setPage(1);
    setSearchParams(val ? { subcategory: val } : {});
  };
  const handleAdvancedFilters = (next) => { setAdvancedFilters(next); setPage(1); };
  const handleClearFilters = () => { setAdvancedFilters({}); setPage(1); };

  return (
    <section className="sarees-page">
      <div className="sarees-page-header">
        <h1>Sarees</h1>
        <div className="divider"><span className="diamond"></span></div>
        <p>Showing {loading ? '…' : `${total} styles`}</p>
      </div>

      <div className="sarees-subtypes">
        <button
          className={`subtype-btn ${activeSubcategory === '' ? 'active' : ''}`}
          onClick={() => handleSubcategory('')}
        >
          All Types
        </button>
        {SAREE_SUBCATEGORIES.map(s => (
          <button
            key={s.value}
            className={`subtype-btn ${activeSubcategory === s.value ? 'active' : ''}`}
            onClick={() => handleSubcategory(s.value)}
          >
            {s.label}
          </button>
        ))}
      </div>

      <div className="sarees-filter-bar">
        <div className="sarees-filters">
          <button type="button" className="filter-toggle-btn" onClick={() => setFiltersOpen(v => !v)}>
            ⚙ Filters {Object.values(advancedFilters).filter(Boolean).length > 0 ? `(${Object.values(advancedFilters).filter(Boolean).length})` : ''}
          </button>
          <span className="filter-label">Filter:</span>
          {FILTERS.map(f => (
            <button key={f.value} className={`filter-btn ${activeFilter === f.value ? 'active' : ''}`} onClick={() => handleFilter(f.value)}>{f.label}</button>
          ))}
        </div>
        <div className="sarees-sort">
          <SortDropdown options={SORT_OPTIONS} value={sort} onChange={handleSort} />
        </div>
      </div>

      <div className="category-layout">
        {filtersOpen && (
          <FilterPanel facets={facets} filters={advancedFilters} onChange={handleAdvancedFilters} onClear={handleClearFilters} />
        )}

        <div className="category-results">
          {loading && <p className="page-loading">Loading sarees…</p>}
          {error   && <p className="page-error">Could not load products. Is the backend running?</p>}

          {!loading && !error && (
            products.length === 0
              ? <p className="page-empty">No sarees found matching these filters.</p>
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
        </div>
      </div>
    </section>
  );
}

export default Sarees;
