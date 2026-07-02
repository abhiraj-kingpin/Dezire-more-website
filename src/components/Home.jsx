import Hero from './Hero';
import CategoriesStrip from './CategoriesStrip';
import NewArrivalsMarquee from './NewArrivalsMarquee';
import AboutSection from './AboutSection';

function Home() {
  return (
    <>
      <Hero />
      <CategoriesStrip />
      <NewArrivalsMarquee />
      <AboutSection />
    </>
  );
}

export default Home;