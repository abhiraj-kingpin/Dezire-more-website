import { useState, useRef, useEffect } from 'react';

function SortDropdown({ options, value, onChange, label = 'Sort By' }) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);
  const current = options.find(o => o.value === value) || options[0];

  useEffect(() => {
    if (!open) return;
    const onClickOutside = (e) => {
      if (rootRef.current && !rootRef.current.contains(e.target)) setOpen(false);
    };
    const onKeyDown = (e) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', onClickOutside);
    window.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onClickOutside);
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  return (
    <div className="sort-dd" ref={rootRef}>
      <span className="filter-label">{label}</span>
      <button
        type="button"
        className={`sort-dd-trigger ${open ? 'open' : ''}`}
        onClick={() => setOpen(o => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span>{current?.label}</span>
        <svg className="sort-dd-chevron" width="10" height="7" viewBox="0 0 10 7" fill="none">
          <path d="M1 1l4 4 4-4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {open && (
        <ul className="sort-dd-menu" role="listbox">
          {options.map(o => (
            <li key={o.value} role="option" aria-selected={o.value === value}>
              <button
                type="button"
                className={`sort-dd-option ${o.value === value ? 'active' : ''}`}
                onClick={() => { onChange(o.value); setOpen(false); }}
              >
                <span className="sort-dd-check">{o.value === value ? '✓' : ''}</span>
                {o.label}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default SortDropdown;
