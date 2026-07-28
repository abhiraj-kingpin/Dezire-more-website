import Hero from './Hero';
import CategoriesStrip from './CategoriesStrip';
import NewArrivalsMarquee from './NewArrivalsMarquee';
import HomeProductRow from './HomeProductRow';
import HomeRecommended from './HomeRecommended';
import HomeRecentlyViewed from './HomeRecentlyViewed';
import { getRecentlyViewed } from '../utils/recentlyViewed';
import { Link } from 'react-router-dom';

function Home() {
  const hasHistory = getRecentlyViewed().length > 0;

  return (
    <>
      <Hero />
      <CategoriesStrip />
      <NewArrivalsMarquee />
      <HomeProductRow title="Bestsellers" tag="bestseller" viewAllLink="/bestsellers" />
      <HomeProductRow title="Staff Picks" tag="staff-pick" viewAllLink="/new-arrivals" />
      {hasHistory && <HomeRecommended />}
      {hasHistory && <HomeRecentlyViewed />}

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
