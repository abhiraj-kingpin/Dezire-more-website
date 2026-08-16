import { createContext, useContext, useState, useCallback, useRef } from 'react';
import { ShoppingCart, Heart, ShieldCheck, CheckCircle2, Info } from 'lucide-react';

const ToastContext = createContext();

let idSeq = 0;

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const timers = useRef({});

  const dismissToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
    clearTimeout(timers.current[id]);
    delete timers.current[id];
  }, []);

  const showToast = useCallback((message, type = 'info', duration = 3200, data = null) => {
    const id = ++idSeq;
    setToasts(prev => [...prev, { id, message, type, data }]);
    timers.current[id] = setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
      delete timers.current[id];
    }, duration);
    return id;
  }, []);

  return (
    <ToastContext.Provider value={{ showToast, dismissToast }}>
      {children}
      <div className="toast-stack" aria-live="polite" aria-atomic="true">
        {toasts.map(t => (
          <div key={t.id} className={`toast-item toast-${t.type} ${t.data ? 'toast-item-rich' : ''}`} onClick={() => dismissToast(t.id)}>
            <div className="toast-item-top">
              <span className="toast-icon">
                {t.type === 'cart' && <ShoppingCart size={16} strokeWidth={2} />}
                {t.type === 'wishlist' && <Heart size={16} strokeWidth={2} fill="currentColor" />}
                {t.type === 'checkout' && <ShieldCheck size={16} strokeWidth={2} className="toast-icon-pulse" />}
                {t.type === 'success' && <CheckCircle2 size={16} strokeWidth={2} />}
                {t.type === 'info' && <Info size={16} strokeWidth={2} />}
              </span>
              <span className="toast-msg">{t.message}</span>
            </div>
            {t.data && (
              <div className="toast-product-preview">
                {t.data.image
                  ? <img src={t.data.image} alt="" className="toast-product-img" />
                  : <div className="toast-product-img toast-product-img-placeholder" />}
                <div className="toast-product-info">
                  <span className="toast-product-name">{t.data.name}</span>
                  <span className="toast-product-meta">
                    {[t.data.size && `Size: ${t.data.size}`, t.data.price != null && `₹${Number(t.data.price).toLocaleString('en-IN')}`].filter(Boolean).join(' · ')}
                  </span>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within a ToastProvider');
  return ctx;
}
