import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { CartProvider } from './context/CartContext';
import { WishlistProvider } from './context/WishlistContext';
import { SearchProvider } from './context/SearchContext';
import { AuthProvider } from './context/AuthContext';
import Layout from './components/Layout';
import Home from './components/Home';
import Sarees from './components/Sarees';
import CoOrds from './components/CoOrds';
import DressMaterials from './components/DressMaterials';
import ReadyToWear from './components/ReadyToWear';
import WesternApparels from './components/WesternApparels';
import JewelryAccessories from './components/JewelryAccessories';
import Bestsellers from './components/Bestsellers';
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
    <>
      <WelcomePopup />
      <AuthProvider>
        <CartProvider>
          <WishlistProvider>
            <SearchProvider>
              <BrowserRouter>
                <ScrollToTop />
                <Routes>
                  <Route path="/" element={<Layout />}>
                    <Route index element={<Home />} />
                    <Route path="sarees" element={<Sarees />} />
                    <Route path="co-ords" element={<CoOrds />} />
                    <Route path="dress-materials" element={<DressMaterials />} />
                    <Route path="ready-to-wear" element={<ReadyToWear />} />
                    <Route path="western-apparels" element={<WesternApparels />} />
                    <Route path="jewelry-accessories" element={<JewelryAccessories />} />
                    <Route path="bestsellers" element={<Bestsellers />} />
                    {/* Help Pages */}
                    <Route path="size-guide" element={<SizeGuide />} />
                    <Route path="shipping-policy" element={<ShippingPolicy />} />
                    <Route path="exchange-policy" element={<ExchangePolicy />} />
                    <Route path="contact" element={<ContactUs />} />
                  </Route>
                </Routes>
              </BrowserRouter>
            </SearchProvider>
          </WishlistProvider>
        </CartProvider>
      </AuthProvider>
      <Chatbot />
      <HelplineWidget />
    </>
  );
}

export default App;