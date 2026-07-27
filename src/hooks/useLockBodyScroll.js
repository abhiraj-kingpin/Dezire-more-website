import { useEffect } from 'react';

// Locks background scroll while `active` is true. Multiple callers can use
// this simultaneously (e.g. a drawer and a modal both open) — a simple
// reference count on the body element keeps track so the scroll is only
// restored once every lock has been released.
export default function useLockBodyScroll(active) {
  useEffect(() => {
    if (!active) return;

    const body = document.body;
    const current = Number(body.dataset.scrollLockCount || '0');
    body.dataset.scrollLockCount = String(current + 1);

    if (current === 0) {
      body.dataset.scrollLockPrevOverflow = body.style.overflow || '';
      body.style.overflow = 'hidden';
    }

    return () => {
      const count = Number(body.dataset.scrollLockCount || '1') - 1;
      body.dataset.scrollLockCount = String(Math.max(count, 0));
      if (count <= 0) {
        body.style.overflow = body.dataset.scrollLockPrevOverflow || '';
        delete body.dataset.scrollLockCount;
        delete body.dataset.scrollLockPrevOverflow;
      }
    };
  }, [active]);
}
