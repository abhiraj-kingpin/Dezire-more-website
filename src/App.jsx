import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
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
import JewelryAccessories from './components/JewelryAccessories';
import Bestsellers from './components/Bestsellers';
import NewArrivals from './components/NewArrivals';
import OurStory from './components/OurStory';
import AccountDashboard, {
  ProfileSection, NotificationsSection, RecentlyViewedSection,
  ComingSoonSection, AccountWishlist,
} from './components/AccountDashboard';
import AddressBook from './components/AddressBook';
import Membership from './components/Membership';
import MyOrders from './components/MyOrders';
import VerifyEmail from './components/VerifyEmail';
import NotFound from './components/NotFound';
import SizeGuide from './components/SizeGuide';
import ShippingPolicy from './components/ShippingPolicy';
import ExchangePolicy from './components/ExchangePolicy';
import ContactUs from './components/ContactUs';
import FAQ from './components/FAQ';
import HelpSupport from './components/HelpSupport';
import PrivacyPolicy from './components/PrivacyPolicy';
import TermsConditions from './components/TermsConditions';
import ScrollToTop from './components/ScrollToTop';
import HelplineWidget from './components/HelplineWidget';
import IntroAnimation from './components/IntroAnimation';

function App() {
  return (
    <ThemeProvider>
      <IntroAnimation />
      <ToastProvider>
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
                    <Route path="dress-materials" element={<DressMaterials />} />
                    <Route path="ready-to-wear" element={<ReadyToWear />} />
                    <Route path="western-apparels" element={<WesternApparels />} />
                    <Route path="jewelry-accessories" element={<JewelryAccessories />} />
                    {/* Old separate category URLs now redirect to the merged page */}
                    <Route path="jewelry" element={<Navigate to="/jewelry-accessories" replace />} />
                    <Route path="accessories" element={<Navigate to="/jewelry-accessories" replace />} />
                    <Route path="bestsellers" element={<Bestsellers />} />
                    <Route path="new-arrivals" element={<NewArrivals />} />
                    <Route path="our-story" element={<OurStory />} />
                    <Route path="account" element={<AccountDashboard />}>
                      <Route index element={<Navigate to="profile" replace />} />
                      <Route path="profile" element={<ProfileSection />} />
                      <Route path="addresses" element={<AddressBook />} />
                      <Route path="orders" element={<MyOrders />} />
                      <Route path="wishlist" element={<AccountWishlist />} />
                      <Route path="membership" element={<Membership />} />
                      <Route path="notifications" element={<NotificationsSection />} />
                      <Route path="recently-viewed" element={<RecentlyViewedSection />} />
                      <Route path="coupons" element={<ComingSoonSection label="Coupons & Rewards" />} />
                      <Route path="payment-methods" element={<ComingSoonSection label="Saved payment methods" />} />
                    </Route>
                    <Route path="membership" element={<Membership />} />
                    <Route path="orders" element={<MyOrders />} />
                    <Route path="verify-email" element={<VerifyEmail />} />
                    {/* Help Pages */}
                    <Route path="size-guide" element={<SizeGuide />} />
                    <Route path="shipping-policy" element={<ShippingPolicy />} />
                    <Route path="exchange-policy" element={<ExchangePolicy />} />
                    <Route path="contact" element={<ContactUs />} />
                    <Route path="faq" element={<FAQ />} />
                    <Route path="help-support" element={<HelpSupport />} />
                    <Route path="privacy-policy" element={<PrivacyPolicy />} />
                    <Route path="terms-conditions" element={<TermsConditions />} />
                    <Route path="*" element={<NotFound />} />
                  </Route>
                </Routes>
              </BrowserRouter>
            </SearchProvider>
          </WishlistProvider>
        </CartProvider>
      </AuthProvider>
      <HelplineWidget />
      </ToastProvider>
    </ThemeProvider>
  );
}

export default App;