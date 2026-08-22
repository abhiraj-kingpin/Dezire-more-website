import { useEffect } from 'react';

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
