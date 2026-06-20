import Hero from './Hero';
import CategoriesStrip from './CategoriesStrip';
import WeddingBanner from './WeddingBanner';
import NewArrivals from './NewArrivals';
import AboutSection from './AboutSection';

function Home() {
  return (
    <>
      <Hero />
      <CategoriesStrip />
      <WeddingBanner />
      <NewArrivals />
      <AboutSection />
    </>
  );
}

export default Home;