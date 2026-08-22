import { useEffect, useRef } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { WifiOff } from 'lucide-react';
import AnnouncementBar from './AnnouncementBar';
import Navbar from './Navbar';
import Footer from './Footer';
import { titleForPath, descriptionForPath, robotsForPath, urlForPath } from '../utils/pageTitles';
import useOnlineStatus from '../hooks/useOnlineStatus';
import { useToast } from '../context/ToastContext';

function removeStaticSeoTags() {
  const selectors = [
    'meta[name="description"]',
    'meta[property^="og:"]',
    'meta[name^="twitter:"]',
    'meta[name="robots"]',
    'link[rel="canonical"]',
  ];
  selectors.forEach(sel => {
    document.querySelectorAll(sel).forEach(el => {
      if (!el.hasAttribute('data-rh')) el.remove();
    });
  });
}

function blockContextMenu(e) {
  if (e.target.closest('input, textarea, [contenteditable="true"]')) return;
  e.preventDefault();
}
function blockDragStart(e) {
  if (e.target.tagName === 'IMG') e.preventDefault();
}

function Layout() {
  const { pathname } = useLocation();
  const isOnline = useOnlineStatus();
  const { showToast } = useToast();
  const wasOffline = useRef(false);

  useEffect(() => {
    removeStaticSeoTags();
  }, []);

  useEffect(() => {
    document.addEventListener('contextmenu', blockContextMenu);
    document.addEventListener('dragstart', blockDragStart);
    return () => {
      document.removeEventListener('contextmenu', blockContextMenu);
      document.removeEventListener('dragstart', blockDragStart);
    };
  }, []);

  useEffect(() => {
    if (!isOnline) { wasOffline.current = true; return; }
    if (wasOffline.current) {
      wasOffline.current = false;
      showToast("You're back online", 'success');
    }
  }, [isOnline]);

  const title = titleForPath(pathname);
  const description = descriptionForPath(pathname);
  const url = urlForPath(pathname);

  return (
    <>
      <Helmet>
        <title>{title}</title>
        <meta name="description" content={description} />
        <link rel="canonical" href={url} />
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="Dezire More" />
        <meta property="og:title" content={title} />
        <meta property="og:description" content={description} />
        <meta property="og:url" content={url} />
        <meta property="og:image" content="https://www.deziremore.com/assets/logo/logo.png" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={title} />
        <meta name="twitter:description" content={description} />
        <meta name="twitter:image" content="https://www.deziremore.com/assets/logo/logo.png" />
        <meta name="robots" content={robotsForPath(pathname)} />
      </Helmet>

      <a href="#main-content" className="skip-to-content">Skip to content</a>
      {!isOnline && (
        <div className="offline-banner" role="status">
          <WifiOff size={14} strokeWidth={2} />
          You're offline — some pages and actions won't work until your connection's back.
        </div>
      )}
      <AnnouncementBar />
      <Navbar />
      <main id="main-content" key={pathname} className="page-fade-in">
        <Outlet />
      </main>
      <Footer />
    </>
  );
}

export default Layout;
