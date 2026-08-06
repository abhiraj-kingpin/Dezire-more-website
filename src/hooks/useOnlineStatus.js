import { useState, useEffect } from 'react';

// Tracks real connectivity, not just "is there a network interface" — the
// Capacitor-wrapped app has no server fallback page to show like a normal
// browser tab would, so the app itself has to know and react when the
// connection drops (Google Play's Minimum Functionality policy specifically
// calls out "offline handling or graceful error states" for WebView-based
// apps — this is what satisfies that, not just navigator.onLine existing
// on paper).
export default function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(typeof navigator === 'undefined' ? true : navigator.onLine);

  useEffect(() => {
    const goOnline = () => setIsOnline(true);
    const goOffline = () => setIsOnline(false);
    window.addEventListener('online', goOnline);
    window.addEventListener('offline', goOffline);
    return () => {
      window.removeEventListener('online', goOnline);
      window.removeEventListener('offline', goOffline);
    };
  }, []);

  return isOnline;
}
