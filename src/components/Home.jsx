import Hero from './Hero';
import CategoriesStrip from './CategoriesStrip';
import NewArrivalsMarquee from './NewArrivalsMarquee';
import HomeProductRow from './HomeProductRow';
import { Link } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';

function Home() {
  const { t } = useLanguage();
  return (
    <>
      <Hero />
      <CategoriesStrip />
      <NewArrivalsMarquee />
      <HomeProductRow title={t('home_staffPicks')} tag="staff-pick" viewAllLink="/new-arrivals" />

      <section className="home-story-teaser">
        <div className="home-story-teaser-inner">
          <span className="policy-eyebrow">{t('home_ourStory')}</span>
          <h2>{t('home_storyHeadline')}</h2>
          <p>{t('home_storyBody')}</p>
          <Link to="/our-story" className="btn-outline">{t('home_discoverStory')}</Link>
        </div>
      </section>
    </>
  );
}

export default Home;
