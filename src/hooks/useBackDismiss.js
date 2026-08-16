import { useEffect, useRef } from 'react';

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
