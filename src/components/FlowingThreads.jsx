import { useEffect, useRef } from 'react';

function FlowingThreads() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    let animId;
    let t = 0;

    const resize = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    const threads = Array.from({ length: 16 }, (_, i) => ({
      y: i * (canvas.height / 15),
      phase: i * 0.6,
      amp: 6 + Math.random() * 10,
      freq: 0.012 + Math.random() * 0.008,
      color: i % 3 === 0 ? 'rgba(184,144,45,' : 'rgba(28,58,18,',
      width: i % 4 === 0 ? 1.0 : 0.4,
    }));

    const dots = Array.from({ length: 8 }, (_, i) => ({
      x: 40 + i * (canvas.width / 7),
      y: canvas.height / 2,
      phase: i * 0.9,
    }));

    function frame() {
      const W = canvas.width;
      const H = canvas.height;
      ctx.clearRect(0, 0, W, H);
      t += 0.018;

      threads.forEach((th, i) => {
        const baseY = (i * H) / 15;
        ctx.strokeStyle = th.color + (0.07 + Math.sin(t * 0.8 + th.phase) * 0.03) + ')';
        ctx.lineWidth = th.width;
        ctx.beginPath();
        for (let x = 0; x <= W; x += 2) {
          const y = baseY
            + Math.sin(x * th.freq + t + th.phase) * th.amp
            + Math.sin(x * th.freq * 2.1 + t * 0.7) * th.amp * 0.3;
          x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
        }
        ctx.stroke();
      });

      dots.forEach((d, i) => {
        const y = H / 2 + Math.sin(t * 0.6 + d.phase) * 12;
        const glow = 0.25 + Math.sin(t * 1.2 + d.phase) * 0.15;
        ctx.beginPath();
        ctx.arc(d.x, y, 1.5, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(184,144,45,${glow})`;
        ctx.fill();
      });

      animId = requestAnimationFrame(frame);
    }

    frame();
    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 0,
      }}
    />
  );
}

export default FlowingThreads;