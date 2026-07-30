function SizeGuide() {
  const sizes = [
    { label: 'Chest',        s: '36', m: '38', l: '40', xl: '42', xxl: '44', xxxl: '46' },
    { label: 'Waist Pants',  s: '36', m: '38', l: '40', xl: '42', xxl: '44', xxxl: '46' },
    { label: 'Hip',          s: '40', m: '42', l: '44', xl: '46', xxl: '48', xxxl: '50' },
    { label: 'Kurta Length', s: '47', m: '47', l: '47', xl: '48', xxl: '48', xxxl: '48' },
    { label: 'Pants Length', s: '38', m: '38', l: '39', xl: '39', xxl: '39', xxxl: '39' },
  ];

  return (
    <div className="policy-page">
      <div className="policy-hero">
        <span className="policy-eyebrow">Fit Perfectly</span>
        <h1>Size Guide</h1>
        <p>All measurements are in inches. When between sizes, we recommend sizing up for a comfortable fit.</p>
      </div>

      <div className="policy-content">
        <div className="size-guide-section">
          <h2>How to Measure</h2>
          <div className="measure-grid">
            <div className="measure-item">
              <div className="measure-icon">◉</div>
              <h3>Chest</h3>
              <p>Measure around the fullest part of your chest, keeping the tape parallel to the floor.</p>
            </div>
            <div className="measure-item">
              <div className="measure-icon">◉</div>
              <h3>Waist</h3>
              <p>Measure around your natural waistline, the narrowest part of your torso.</p>
            </div>
            <div className="measure-item">
              <div className="measure-icon">◉</div>
              <h3>Hip</h3>
              <p>Measure around the fullest part of your hips, about 8 inches below your waist.</p>
            </div>
            <div className="measure-item">
              <div className="measure-icon">◉</div>
              <h3>Length</h3>
              <p>Kurta length is measured from the shoulder to the hem; pants length from waist to ankle.</p>
            </div>
          </div>
        </div>

        <div className="size-table-section">
          <h2>Size Chart</h2>
          <div className="size-table-wrapper">
            <table className="size-table">
              <thead>
                <tr>
                  <th>Measurement</th>
                  <th>S</th>
                  <th>M</th>
                  <th>L</th>
                  <th>XL</th>
                  <th>XXL</th>
                  <th>XXXL</th>
                </tr>
              </thead>
              <tbody>
                {sizes.map((row) => (
                  <tr key={row.label}>
                    <td className="measure-label">{row.label}</td>
                    <td>{row.s}</td>
                    <td>{row.m}</td>
                    <td>{row.l}</td>
                    <td>{row.xl}</td>
                    <td>{row.xxl}</td>
                    <td>{row.xxxl}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="size-note">
          <p>
            Chest &amp; waist sizes are consistent as given; lengths can vary with styles. All our
            unstitched/semi-stitched products are available up to chest size 54 (7XL), and dupatta
            lengths run 2.35–2.5 mts. Sarees, jewelry &amp; accessories, and dress materials don't
            require sizing — this chart applies to stitched items like kurtas, co-ords, and suits.
          </p>
        </div>

        <div className="size-cta">
          <p>Still unsure about your size?</p>
          <a
            href="https://wa.me/918171761948"
            target="_blank"
            rel="noreferrer"
            className="whatsapp-btn"
          >
            Ask us on WhatsApp
          </a>
        </div>
      </div>
    </div>
  );
}

export default SizeGuide;