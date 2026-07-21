function AnnouncementBar() {
  const items = [
    "✦ ETHNIC ELEGANCE. MODERN YOU.",
    "✦ NEW ARRIVALS EVERY WEEK",
    "✦ FREE SHIPPING ON ORDERS ABOVE ₹1899",
    "✦ USE CODE DEZIRE10 FOR 10% OFF",
    "✦ 7-DAY EASY EXCHANGE POLICY",
  ];

  // Duplicate so the scroll loops seamlessly
  const ticker = [...items, ...items];

  return (
    <div className="ann-bar">
      <div className="ann-track">
        {ticker.map((item, i) => (
          <span key={i} className="ann-item">{item}</span>
        ))}
      </div>

      <style>{`
        .ann-bar {
          background: #1f3d2e;
          overflow: hidden;
          width: 100%;
          padding: 9px 0;
          border-bottom: 1px solid rgba(201, 168, 76, 0.25);
        }

        .ann-track {
          display: flex;
          width: max-content;
          animation: ann-scroll 28s linear infinite;
          white-space: nowrap;
        }

        .ann-bar:hover .ann-track {
          animation-play-state: paused;
        }

        .ann-item {
          font-size: 10px;
          font-family: 'Jost', sans-serif;
          font-weight: 500;
          letter-spacing: 1.8px;
          color: #e8c97a;
          padding: 0 32px;
          flex-shrink: 0;
        }

        @keyframes ann-scroll {
          0%   { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }

        @media (max-width: 440px) {
          .ann-item {
            font-size: 9px;
            letter-spacing: 1.4px;
            padding: 0 24px;
          }
          .ann-bar {
            padding: 8px 0;
          }
        }
      `}</style>
    </div>
  );
}

export default AnnouncementBar;