import { useEffect, useRef } from 'react';

// Makes the phone/Android-app hardware back button (or a browser back click)
// dismiss an open overlay instead of leaving the page or doing nothing —
// these drawers previously only closed on the Escape key, which mobile has no
// equivalent for. Pushes one history entry while open; popping it fires onClose.
// onClose is read from a ref (not the effect's own closure) so callers whose
// close logic depends on other state (e.g. cart's paymentStep sub-view) always
// see the latest version without the effect re-subscribing/re-pushing on
// every render of that other state.
export function useBackDismiss(isOpen, onClose) {
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (!isOpen) return;
    window.history.pushState({ dzOverlay: true }, '');
    const onPopState = () => onCloseRef.current();
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, [isOpen]);
}
