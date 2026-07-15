import { Car } from 'lucide-react';

// A little car travels along the progress "road" instead of a plain bar fill —
// matches the mwasalatRed-car visual language already used by MwasalatFlyingCar
// elsewhere in the app, on-brand for a platform literally named "transport."
export default function MwasalatProgressRoad({ progress, color = '#23181A', size = 'md' }) {
  const clamped = Math.max(0, Math.min(100, progress ?? 0));
  const isSmall = size === 'sm';

  return (
    <div className={`relative mx-2.5 ${isSmall ? 'my-2' : 'my-2.5'}`}>
      <div className={`relative w-full ${isSmall ? 'h-1.5' : 'h-2'} bg-[#F1F5F9] rounded-full overflow-hidden`}>
        {/* Dashed road-line texture */}
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: 'repeating-linear-gradient(90deg, #CBD5E1 0, #CBD5E1 5px, transparent 5px, transparent 10px)',
            backgroundSize: '10px 2px',
            backgroundPosition: 'center',
            backgroundRepeat: 'repeat-x',
          }}
        />
        {/* Distance traveled */}
        <div
          className="relative z-10 h-full rounded-full transition-all duration-700 ease-out"
          style={{ width: `${clamped}%`, backgroundColor: color }}
        />
      </div>

      {/* Car marker */}
      <div
        className={`absolute z-20 top-1/2 -translate-y-1/2 -translate-x-1/2 ${isSmall ? 'w-5 h-5' : 'w-6 h-6'} rounded-full flex items-center justify-center shadow-md ring-2 ring-white transition-all duration-700 ease-out`}
        style={{ left: `${clamped}%`, backgroundColor: color }}
      >
        <Car className={isSmall ? 'w-2.5 h-2.5 text-white' : 'w-3 h-3 text-white'} />
      </div>
    </div>
  );
}
