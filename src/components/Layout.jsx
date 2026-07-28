import { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import AnnouncementBar from './AnnouncementBar';
import Navbar from './Navbar';
import Footer from './Footer';
import Chatbot from './Chatbot';
import { titleForPath } from '../utils/pageTitles';

function Layout() {
  const { pathname } = useLocation();
  const isHome = pathname === '/';

  useEffect(() => {
    document.title = titleForPath(pathname);
  }, [pathname]);

  return (
    <>
      <AnnouncementBar />
      <Navbar />
      <div key={pathname} className="page-fade-in">
        <Outlet />
      </div>
      <Footer />
      {isHome && <Chatbot />}
    </>
  );
}

export default Layout;