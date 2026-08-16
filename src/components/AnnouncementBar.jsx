function AnnouncementBar() {
  const icons = {
    truck: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 3h13v13H1z"/><path d="M14 8h4l4 4v4h-8V8z"/><circle cx="6" cy="18.5" r="1.8"/><circle cx="17.5" cy="18.5" r="1.8"/></svg>,
    sparkle: <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l1.8 6.2L20 10l-6.2 1.8L12 18l-1.8-6.2L4 10l6.2-1.8z"/></svg>,
    tag: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20.5 12.5 12.9 20a1.5 1.5 0 0 1-2.1 0L3 12.2V4h8.2l9.3 9.3a1.5 1.5 0 0 1 0 2.1Z"/><circle cx="7.5" cy="8.5" r="1.5"/></svg>,
  };

  const items = [
    { icon: 'sparkle', text: 'ETHNIC ELEGANCE. MODERN YOU.' },
    { icon: 'sparkle', text: 'NEW ARRIVALS EVERY WEEK' },
    { icon: 'truck', text: 'FREE SHIPPING ABOVE ₹2500' },
    { icon: 'tag', text: 'USE CODE DEZIRE10' },
  ];

  const ticker = [...items, ...items];

  return (
    <div className="ann-bar">
      <div className="ann-track">
        {ticker.map((item, i) => (
          <span key={i} className="ann-item">
            <span className="ann-icon">{icons[item.icon]}</span>
            {item.text}
          </span>
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
          display: inline-flex;
          align-items: center;
          gap: 8px;
          font-size: 10px;
          font-family: 'Jost', sans-serif;
          font-weight: 500;
          letter-spacing: 1.8px;
          color: #e8c97a;
          padding: 0 32px;
          flex-shrink: 0;
          border-right: 1px solid rgba(232, 201, 122, 0.25);
        }
        .ann-item:last-child { border-right: none; }

        .ann-icon {
          display: inline-flex;
          color: #e8c97a;
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
            padding: 0 20px;
            gap: 6px;
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