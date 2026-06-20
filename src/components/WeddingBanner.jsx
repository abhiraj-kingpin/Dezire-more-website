function WeddingBanner() {
  return (
    <section className="wedding-banner">
      <div style={{
        position: 'absolute',
        right: 0,
        top: 0,
        width: '65%',
        height: '100%',
        zIndex: 0,
      }}>
        <img
  src="/assets/wedding/wedding1.jpeg"
  alt="Wedding Collection 2026"
  style={{
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    objectPosition: 'center top',
  }}
/>
        
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '40%',
          height: '100%',
          background: 'linear-gradient(to right, #f5f0e8, transparent)',
          zIndex: 1,
        }} />
      </div>

      <div className="wedding-content" style={{ position: 'relative', zIndex: 2 }}>
        <p className="eyebrow">❖ Bridal &amp; Festive</p>
        <h2>Wedding Collection 2026</h2>
        <p>Timeless outfits for your most precious moments.</p>
        <a href="/wedding-collection" className="btn-primary">Explore Now</a>
      </div>
    </section>
  );
}

export default WeddingBanner;