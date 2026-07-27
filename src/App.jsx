import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { CartProvider } from './context/CartContext';
import { WishlistProvider } from './context/WishlistContext';
import { SearchProvider } from './context/SearchContext';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { ToastProvider } from './context/ToastContext';
import Layout from './components/Layout';
import Home from './components/Home';
import Sarees from './components/Sarees';
import DressMaterials from './components/DressMaterials';
import ReadyToWear from './components/ReadyToWear';
import WesternApparels from './components/WesternApparels';
import Jewelry from './components/Jewelry';
import Accessories from './components/Accessories';
import Bestsellers from './components/Bestsellers';
import NewArrivals from './components/NewArrivals';
import Sale from './components/Sale';
import OurStory from './components/OurStory';
import Account from './components/Account';
import MyOrders from './components/MyOrders';
import NotFound from './components/NotFound';
import SizeGuide from './components/SizeGuide';
import ShippingPolicy from './components/ShippingPolicy';
import ExchangePolicy from './components/ExchangePolicy';
import ContactUs from './components/ContactUs';
import WelcomePopup from './components/WelcomePopup';
import ScrollToTop from './components/ScrollToTop';
import Chatbot from './components/Chatbot';
import HelplineWidget from './components/HelplineWidget';

function App() {
  return (
    <ThemeProvider>
      <ToastProvider>
      <AuthProvider>
        <CartProvider>
          <WishlistProvider>
            <SearchProvider>
              <BrowserRouter>
                <ScrollToTop />
                <WelcomePopup />
                <Routes>
                  <Route path="/" element={<Layout />}>
                    <Route index element={<Home />} />
                    <Route path="sarees" element={<Sarees />} />
                    <Route path="dress-materials" element={<DressMaterials />} />
                    <Route path="ready-to-wear" element={<ReadyToWear />} />
                    <Route path="western-apparels" element={<WesternApparels />} />
                    <Route path="jewelry" element={<Jewelry />} />
                    <Route path="accessories" element={<Accessories />} />
                    <Route path="bestsellers" element={<Bestsellers />} />
                    <Route path="new-arrivals" element={<NewArrivals />} />
                    <Route path="sale" element={<Sale />} />
                    <Route path="our-story" element={<OurStory />} />
                    <Route path="account" element={<Account />} />
                    <Route path="orders" element={<MyOrders />} />
                    {/* Help Pages */}
                    <Route path="size-guide" element={<SizeGuide />} />
                    <Route path="shipping-policy" element={<ShippingPolicy />} />
                    <Route path="exchange-policy" element={<ExchangePolicy />} />
                    <Route path="contact" element={<ContactUs />} />
                    <Route path="*" element={<NotFound />} />
                  </Route>
                </Routes>
              </BrowserRouter>
            </SearchProvider>
          </WishlistProvider>
        </CartProvider>
      </AuthProvider>
      <Chatbot />
      <HelplineWidget />
      </ToastProvider>
    </ThemeProvider>
  );
}

export default App;