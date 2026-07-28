import Hero from './Hero';
import CategoriesStrip from './CategoriesStrip';
import NewArrivalsMarquee from './NewArrivalsMarquee';
import HomeProductRow from './HomeProductRow';
import { Link } from 'react-router-dom';

function Home() {
  return (
    <>
      <Hero />
      <CategoriesStrip />
      <NewArrivalsMarquee />
      <HomeProductRow title="Staff Picks" tag="staff-pick" viewAllLink="/new-arrivals" />

      <section className="home-story-teaser">
        <div className="home-story-teaser-inner">
          <span className="policy-eyebrow">✦ Our Story</span>
          <h2>Crafted With Purpose, Worn With Pride</h2>
          <p>Every Dezire More piece is designed for the modern Indian woman — timeless silhouettes, contemporary spirit.</p>
          <Link to="/our-story" className="btn-outline">Discover Our Story</Link>
        </div>
      </section>
    </>
  );
}

export default Home;
