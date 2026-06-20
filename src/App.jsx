import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { CartProvider } from './context/CartContext';
import { WishlistProvider } from './context/WishlistContext';
import { SearchProvider } from './context/SearchContext';
import Layout from './components/Layout';
import Home from './components/Home';
import Sarees from './components/Sarees';
import Kurtas from './components/Kurtas';
import Lehengas from './components/Lehengas';
import CoOrds from './components/CoOrds';
import DressMaterials from './components/DressMaterials';
import ReadyToWear from './components/ReadyToWear';
import WesternApparels from './components/WesternApparels';
import Bestsellers from './components/Bestsellers';
import Sale from './components/Sale';

function App() {
  return (
    <CartProvider>
      <WishlistProvider>
        <SearchProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Layout />}>
                <Route index element={<Home />} />
                <Route path="sarees" element={<Sarees />} />
                <Route path="kurtas" element={<Kurtas />} />
                <Route path="lehengas" element={<Lehengas />} />
                <Route path="co-ords" element={<CoOrds />} />
                <Route path="dress-materials" element={<DressMaterials />} />
                <Route path="ready-to-wear" element={<ReadyToWear />} />
                <Route path="western-apparels" element={<WesternApparels />} />
                <Route path="bestsellers" element={<Bestsellers />} />
                <Route path="sale" element={<Sale />} />
              </Route>
            </Routes>
          </BrowserRouter>
        </SearchProvider>
      </WishlistProvider>
    </CartProvider>
  );
}

export default App;