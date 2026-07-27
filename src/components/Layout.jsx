import { Outlet } from 'react-router-dom';
import AnnouncementBar from './AnnouncementBar';
import Navbar from './Navbar';
import Footer from './Footer';

function Layout() {
  return (
    <>
      <AnnouncementBar />
      <Navbar />
      <Outlet />
      <Footer />
    </>
  );
}

export default Layout;