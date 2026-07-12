import { Link } from 'react-router-dom';
import { Check, ChevronRight } from 'lucide-react';

function Wave({ color }) {
  return (
    <svg viewBox="0 0 400 120" xmlns="http://www.w3.org/2000/svg" className="w-full">
      <path d="M0,60 C60,20 120,90 200,50 C280,10 340,80 400,40 L400,120 L0,120 Z" fill={color} fillOpacity="0.4" />
      <path d="M0,75 C80,35 140,95 220,60 C300,25 360,85 400,55 L400,120 L0,120 Z" fill={color} fillOpacity="0.6" />
      <path d="M0,90 C70,55 150,100 240,75 C310,55 370,95 400,70 L400,120 L0,120 Z" fill={color} fillOpacity="0.9" />
    </svg>
  );
}

export default function ProgramCard({ name, image, icon: Icon, accentColor, features, detailsTo = '/register', imageClass = 'w-44 h-44', titleClass = 'mb-6' }) {
  return (
    <div
      className="relative bg-white rounded-3xl overflow-hidden flex flex-col h-full card-hover"
      style={{ boxShadow: '0 4px 30px rgba(0,0,0,0.08)' }}
    >
      {/* Header: image + title */}
      <div className="flex flex-col items-center sm:flex-row sm:items-end gap-0 px-6 pt-0 mb-2">
        {image ? (
          <img src={image} alt={name} className={`${imageClass} object-contain object-bottom flex-shrink-0`} loading="lazy" />
        ) : (
          <div className="w-16 h-16 rounded-2xl border-2 border-gray-200 flex items-center justify-center bg-white flex-shrink-0">
            <Icon className="w-7 h-7 text-[#475569]" />
          </div>
        )}
        <div className={`${titleClass} text-center sm:text-left`}>
          <p className="text-lg font-bold tracking-widest text-[#1E293B] uppercase">{name}</p>
          <div className="w-8 h-0.5 mt-1.5 rounded-full mx-auto sm:mx-0" style={{ backgroundColor: accentColor }} />
        </div>
      </div>

      {/* Features */}
      <div className="flex flex-col px-10 pt-0 pb-1 flex-1 w-full overflow-hidden">
        <ul className="space-y-2 w-full mt-2">
          {features.map((f) => (
            <li key={f} className="flex items-center gap-2.5 text-sm text-[#475569]">
              <Check className="w-4 h-4 text-[#22C55E] flex-shrink-0" />
              {f}
            </li>
          ))}
        </ul>

      </div>

      {/* Wave + CTA */}
      <div className="relative mt-2 flex-shrink-0">
        <Wave color={accentColor} />
        <div className="absolute inset-x-0 bottom-4 flex justify-center">
          <Link
            to={detailsTo}
            className="inline-flex items-center gap-1.5 bg-white font-bold text-sm px-7 py-2.5 rounded-full shadow-md transition-transform hover:scale-105"
            style={{ color: accentColor }}
          >
            CHOOSE <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
