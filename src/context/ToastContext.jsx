import { createContext, useContext, useState, useCallback, useRef } from 'react';

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

  // type: 'cart' | 'wishlist' | 'checkout' | 'success' | 'info'
  const showToast = useCallback((message, type = 'info', duration = 2600) => {
    const id = ++idSeq;
    setToasts(prev => [...prev, { id, message, type }]);
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
          <div key={t.id} className={`toast-item toast-${t.type}`} onClick={() => dismissToast(t.id)}>
            <span className="toast-icon">
              {t.type === 'cart' && '🛒'}
              {t.type === 'wishlist' && '❤️'}
              {t.type === 'checkout' && '✦'}
              {t.type === 'success' && '✓'}
              {t.type === 'info' && 'ℹ'}
            </span>
            <span className="toast-msg">{t.message}</span>
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
