import { Outlet, useLocation } from 'react-router-dom';
import AnnouncementBar from './AnnouncementBar';
import Navbar from './Navbar';
import Footer from './Footer';
import Chatbot from './Chatbot';

function Layout() {
  const { pathname } = useLocation();
  const isHome = pathname === '/';

  return (
    <>
      <AnnouncementBar />
      <Navbar />
      <Outlet />
      <Footer />
      {isHome && <Chatbot />}
    </>
  );
}

export default Layout;