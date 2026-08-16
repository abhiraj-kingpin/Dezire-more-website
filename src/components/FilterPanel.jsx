import { useState, useEffect } from 'react';

const DISCOUNT_PRESETS = [10, 20, 30, 50];
const RATING_PRESETS = [4, 3];

function FilterPanel({ facets, filters, onChange, onClear }) {
  const [priceMin, setPriceMin] = useState(filters.minPrice ?? facets.minPrice);
  const [priceMax, setPriceMax] = useState(filters.maxPrice ?? facets.maxPrice);

  useEffect(() => {
    setPriceMin(filters.minPrice ?? facets.minPrice);
    setPriceMax(filters.maxPrice ?? facets.maxPrice);
  }, [facets.minPrice, facets.maxPrice, filters.minPrice, filters.maxPrice]);

  const commitPrice = (min, max) => {
    onChange({ ...filters, minPrice: min, maxPrice: max });
  };

  const toggleMulti = (key, value) => {
    const current = filters[key] ? filters[key].split(',') : [];
    const next = current.includes(value) ? current.filter(v => v !== value) : [...current, value];
    onChange({ ...filters, [key]: next.length ? next.join(',') : undefined });
  };

  const isSelected = (key, value) => (filters[key] || '').split(',').includes(value);

  const activeCount = Object.values(filters).filter(Boolean).length;

  return (
    <div className="filter-panel">
      <div className="filter-panel-header">
        <h4>Filters</h4>
        {activeCount > 0 && <button type="button" className="filter-clear-btn" onClick={onClear}>Clear all</button>}
      </div>

      <div className="filter-group">
        <p className="filter-group-title">Price</p>
        <div className="price-slider">
          <input
            type="range"
            min={facets.minPrice} max={facets.maxPrice}
            value={priceMin}
            onChange={e => {
              const v = Math.min(Number(e.target.value), priceMax - 1);
              setPriceMin(v);
            }}
            onMouseUp={() => commitPrice(priceMin, priceMax)}
            onTouchEnd={() => commitPrice(priceMin, priceMax)}
          />
          <input
            type="range"
            min={facets.minPrice} max={facets.maxPrice}
            value={priceMax}
            onChange={e => {
              const v = Math.max(Number(e.target.value), priceMin + 1);
              setPriceMax(v);
            }}
            onMouseUp={() => commitPrice(priceMin, priceMax)}
            onTouchEnd={() => commitPrice(priceMin, priceMax)}
          />
        </div>
        <div className="price-slider-values">
          <span>₹{priceMin.toLocaleString('en-IN')}</span>
          <span>₹{priceMax.toLocaleString('en-IN')}</span>
        </div>
      </div>

      {facets.sizes.length > 0 && (
        <div className="filter-group">
          <p className="filter-group-title">Size</p>
          <div className="filter-chip-row">
            {facets.sizes.map(size => (
              <button key={size} type="button" className={`filter-chip ${isSelected('size', size) ? 'active' : ''}`} onClick={() => toggleMulti('size', size)}>
                {size}
              </button>
            ))}
          </div>
        </div>
      )}

      {facets.colors.length > 0 && (
        <div className="filter-group">
          <p className="filter-group-title">Color</p>
          <div className="filter-chip-row">
            {facets.colors.map(color => (
              <button key={color} type="button" className={`filter-chip ${isSelected('color', color) ? 'active' : ''}`} onClick={() => toggleMulti('color', color)}>
                {color}
              </button>
            ))}
          </div>
        </div>
      )}

      {facets.fabrics.length > 0 && (
        <div className="filter-group">
          <p className="filter-group-title">Fabric</p>
          <div className="filter-chip-row">
            {facets.fabrics.map(fabric => (
              <button key={fabric} type="button" className={`filter-chip ${isSelected('fabric', fabric) ? 'active' : ''}`} onClick={() => toggleMulti('fabric', fabric)}>
                {fabric}
              </button>
            ))}
          </div>
        </div>
      )}

      {facets.occasions.length > 0 && (
        <div className="filter-group">
          <p className="filter-group-title">Occasion</p>
          <div className="filter-chip-row">
            {facets.occasions.map(occasion => (
              <button key={occasion} type="button" className={`filter-chip ${isSelected('occasion', occasion) ? 'active' : ''}`} onClick={() => toggleMulti('occasion', occasion)}>
                {occasion}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="filter-group">
        <p className="filter-group-title">Discount</p>
        <div className="filter-chip-row">
          {DISCOUNT_PRESETS.map(pct => (
            <button
              key={pct}
              type="button"
              className={`filter-chip ${filters.minDiscount === String(pct) ? 'active' : ''}`}
              onClick={() => onChange({ ...filters, minDiscount: filters.minDiscount === String(pct) ? undefined : String(pct) })}
            >
              {pct}% off+
            </button>
          ))}
        </div>
      </div>

      <div className="filter-group">
        <p className="filter-group-title">Rating</p>
        <div className="filter-chip-row">
          {RATING_PRESETS.map(r => (
            <button
              key={r}
              type="button"
              className={`filter-chip ${filters.minRating === String(r) ? 'active' : ''}`}
              onClick={() => onChange({ ...filters, minRating: filters.minRating === String(r) ? undefined : String(r) })}
            >
              {r}★ &amp; up
            </button>
          ))}
        </div>
      </div>

      <div className="filter-group">
        <label className="filter-availability-check">
          <input
            type="checkbox"
            checked={filters.inStock === 'true'}
            onChange={e => onChange({ ...filters, inStock: e.target.checked ? 'true' : undefined })}
          />
          In Stock Only
        </label>
      </div>
    </div>
  );
}

export default FilterPanel;
