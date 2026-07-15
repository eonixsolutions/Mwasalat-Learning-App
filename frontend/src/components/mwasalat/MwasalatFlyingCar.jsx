import { useEffect, useState } from 'react';
import { Car } from 'lucide-react';

// Animates a little car icon flying from a source point (the course card that
// just earned points) to a destination point (the points badge in the header).
// Pure CSS-transition driven — no animation library needed for a one-off flight.
export default function MwasalatFlyingCar({ from, to, onDone }) {
  const [style, setStyle] = useState({
    left: from.x,
    top: from.y,
    transform: 'translate(-50%, -50%) scale(1) rotate(0deg)',
    opacity: 1,
  });

  useEffect(() => {
    const raf = requestAnimationFrame(() => {
      setStyle({
        left: to.x,
        top: to.y,
        transform: 'translate(-50%, -50%) scale(0.35) rotate(8deg)',
        opacity: 0.4,
      });
    });
    const timeout = setTimeout(() => onDone?.(), 2200);
    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(timeout);
    };
  }, [to, onDone]);

  return (
    <div
      className="fixed z-[200] pointer-events-none"
      style={{
        left: style.left,
        top: style.top,
        transform: style.transform,
        opacity: style.opacity,
        transition: 'left 2.1s linear, top 2.1s linear, transform 2.1s ease-in, opacity 2.1s ease-in',
      }}
    >
      <div className="w-10 h-10 rounded-full bg-mwasalatRed-500 flex items-center justify-center shadow-lg shadow-mwasalatRed-500/40">
        <Car className="w-5 h-5 text-white" />
      </div>
    </div>
  );
}
