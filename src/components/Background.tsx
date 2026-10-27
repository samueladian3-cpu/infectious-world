import { memo } from 'react';

/** Partikel mikroskopis berbasis CSS: ringan, tanpa loop JavaScript. */
const PARTICLES = Array.from({ length: 18 }, (_, i) => {
  const r = (n: number) => ((i * 9301 + n * 49297) % 233280) / 233280;
  return {
    left: `${Math.round(r(1) * 100)}%`,
    top: `${Math.round(r(2) * 100)}%`,
    size: 18 + Math.round(r(3) * 70),
    delay: `${-(r(4) * 20).toFixed(1)}s`,
    duration: `${(16 + r(5) * 18).toFixed(1)}s`,
    hue: ['cyan', 'green', 'amber', 'red'][i % 4],
  };
});

export const Background = memo(function Background() {
  return (
    <div className="bg-field" aria-hidden="true">
      <div className="bg-grid" />
      {PARTICLES.map((p, i) => (
        <span
          key={i}
          className={`cell cell-${p.hue}`}
          style={{
            left: p.left,
            top: p.top,
            width: p.size,
            height: p.size,
            animationDelay: p.delay,
            animationDuration: p.duration,
          }}
        />
      ))}
    </div>
  );
});
