import { useState } from 'react';
import ProductCard from './ProductCard';
import { useTag } from '../hooks/useProducts';

const SORT_OPTIONS = [
  { label: 'Newest First',       value: 'newest' },
  { label: 'Price: Low to High', value: 'price-asc' },
  { label: 'Price: High to Low', value: 'price-desc' },
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

function TagPage({ title, tag, defaultSort }) {
  const [sort, setSort] = useState(defaultSort || 'newest');
  const [page, setPage] = useState(1);

  const { products, total, totalPages, loading, error } = useTag(tag, { sort, limit: LIMIT, page });

  return (
    <section className="sarees-page">
      <div className="sarees-page-header">
        <h1>{title}</h1>
        <div className="divider"><span className="diamond"></span></div>
        <p>Showing {loading ? '…' : `${total} styles`}</p>
      </div>

      <div className="sarees-filter-bar">
        <div className="sarees-sort" style={{ marginLeft: 'auto' }}>
          <span className="filter-label">Sort By</span>
          <select className="sort-select" value={sort} onChange={e => { setSort(e.target.value); setPage(1); }}>
            {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>
      </div>

      {loading && <p className="page-loading">Loading {title.toLowerCase()}…</p>}
      {error   && <p className="page-error">Could not load products. Is the backend running?</p>}

      {!loading && !error && (
        products.length === 0
          ? <p className="page-empty">No {title.toLowerCase()} yet. Add some from the admin panel!</p>
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

export function NewArrivals() { return <TagPage title="New Arrivals" tag="new-arrival" defaultSort="newest" />; }
export function Bestsellers() { return <TagPage title="Bestsellers"  tag="bestseller"  defaultSort="rating" />; }
export function Sale()        { return <TagPage title="Sale"         tag="sale"         defaultSort="newest" />; }