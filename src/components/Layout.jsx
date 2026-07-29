import { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import AnnouncementBar from './AnnouncementBar';
import Navbar from './Navbar';
import Footer from './Footer';
import Chatbot from './Chatbot';
import { updateMetaTags } from '../utils/pageTitles';

function Layout() {
  const { pathname } = useLocation();
  const isHome = pathname === '/';

  useEffect(() => {
    updateMetaTags(pathname);
  }, [pathname]);

  return (
    <>
      <a href="#main-content" className="skip-to-content">Skip to content</a>
      <AnnouncementBar />
      <Navbar />
      <main id="main-content" key={pathname} className="page-fade-in">
        <Outlet />
      </main>
      <Footer />
      {isHome && <Chatbot />}
    </>
  );
}

export default Layout;