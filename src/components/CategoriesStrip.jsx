import { Link } from 'react-router-dom';
import { useState, useRef } from 'react';

const categories = [
  {
    name: 'Sarees',
    link: '/sarees',
    images: [
      '/assets/sarees/sarees1.jpeg',
      '/assets/sarees/sarees2.jpeg',
      '/assets/sarees/sarees3.jpeg',
    ],
  },
  {
    name: 'Kurtas',
    link: '/kurtas',
    images: [
      '/assets/kurtas/kurtas1.jpeg',
      '/assets/kurtas/kurtas2.jpeg',
      '/assets/kurtas/kurtas3.jpeg',
    ],
  },
  {
    name: 'Lehengas',
    link: '/lehengas',
    images: [
      '/assets/lehengas/lehengas1.jpeg',
      '/assets/lehengas/lehengas2.jpeg',
      '/assets/lehengas/lehengas3.jpeg',
    ],
  },
  {
    name: 'Co-ords',
    link: '/co-ords',
    images: [
      '/assets/coords/coords1.jpeg',
      '/assets/coords/coords2.jpeg',
      '/assets/coords/coords3.jpeg',
    ],
  },
];

function CategoryCard({ cat }) {
  const [currentImg, setCurrentImg] = useState(0);
  const [opacity, setOpacity] = useState(1);
  const intervalRef = useRef(null);
  const indexRef = useRef(1);

  const handleMouseEnter = () => {
    intervalRef.current = setInterval(() => {
      setOpacity(0);
      setTimeout(() => {
        setCurrentImg(indexRef.current % cat.images.length);
        indexRef.current++;
        setOpacity(1);
      }, 600);
    }, 2000);
  };

  const handleMouseLeave = () => {
    clearInterval(intervalRef.current);
    indexRef.current = 1;
    setOpacity(0);
    setTimeout(() => {
      setCurrentImg(0);
      setOpacity(1);
    }, 600);
  };

  return (
    <Link
      to={cat.link}
      className="cat-card"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <img
        src={cat.images[currentImg]}
        alt={cat.name}
        style={{ opacity: opacity, transition: 'opacity 0.6s ease' }}
      />
      <div className="cat-overlay">
        <h3>{cat.name}</h3>
        <span className="explore-link">Explore →</span>
      </div>
    </Link>
  );
}

function CategoriesStrip() {
  return (
    <section className="categories">
      <div className="categories-grid">
        {categories.map((cat) => (
          <CategoryCard key={cat.name} cat={cat} />
        ))}
      </div>
    </section>
  );
}

export default CategoriesStrip;