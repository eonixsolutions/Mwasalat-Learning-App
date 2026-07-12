import { ExternalLink } from 'lucide-react';

const TECH_COLORS = {
  'React':        { bg: '#EBF5FF', text: '#2563EB' },
  'Node.js':      { bg: '#F0FDF4', text: '#16A34A' },
  'MongoDB':      { bg: '#F0FDF4', text: '#15803D' },
  'Next.js':      { bg: '#F1F5F9', text: '#475569' },
  'Tailwind CSS': { bg: '#ECFEFF', text: '#0891B2' },
  'Stripe':       { bg: '#F5F3FF', text: '#7C3AED' },
  'Chart.js':     { bg: '#FFF7ED', text: '#EA580C' },
  'LocalStorage': { bg: '#F1F5F9', text: '#64748B' },
  'Vue.js':       { bg: '#F0FDF4', text: '#16A34A' },
  'Firebase':     { bg: '#FFFBEB', text: '#D97706' },
  'OpenAI API':   { bg: '#F5F3FF', text: '#7C3AED' },
  'HTML':         { bg: '#FFF7ED', text: '#EA580C' },
  'CSS':          { bg: '#EFF6FF', text: '#3B82F6' },
  'JavaScript':   { bg: '#FEFCE8', text: '#B45309' },
};

const DEFAULT_TECH = { bg: '#F1F5F9', text: '#475569' };

function BrowserFrame({ title }) {
  const initials = title.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase();
  return (
    <div className="w-full h-full flex flex-col">
      {/* Browser chrome */}
      <div className="flex items-center gap-1.5 px-3 py-2 bg-[#E8ECEF] flex-shrink-0">
        <div className="w-2.5 h-2.5 rounded-full bg-[#FC5C65]" />
        <div className="w-2.5 h-2.5 rounded-full bg-[#FED330]" />
        <div className="w-2.5 h-2.5 rounded-full bg-[#26DE81]" />
        <div className="flex-1 mx-2 bg-white/80 rounded px-2 py-0.5">
          <p className="text-[9px] text-[#94A3B8] font-mono truncate">localhost:3000</p>
        </div>
      </div>
      {/* Content area */}
      <div className="flex-1 flex flex-col items-center justify-center gap-3 bg-gradient-to-br from-[#F8F9FB] to-[#EEF2F7] transition-all duration-500 group-hover:from-[#EEF8F7] group-hover:to-[#E6F4F5]">
        <div className="w-12 h-12 rounded-xl bg-white shadow-sm flex items-center justify-center border border-[#E2E8F0]">
          <span className="text-sm font-bold text-[#94A3B8] font-mono">{initials}</span>
        </div>
        <span className="text-[11px] font-medium text-[#94A3B8] text-center px-6 leading-relaxed transition-colors duration-500 group-hover:text-[#1F5E63]">{title}</span>
      </div>
    </div>
  );
}

export default function ProjectCard({ title, description, image, techStack = [], link }) {
  return (
    <div className="group bg-white rounded-2xl overflow-hidden flex flex-col card-hover" style={{ boxShadow: '0 2px 20px rgba(0,0,0,0.07)' }}>

      {/* Preview image */}
      <div className="relative w-full h-48 bg-[#F1F5F9] overflow-hidden">
        {image ? (
          <img
            src={image}
            alt={title}
            className="w-full h-full object-cover object-top transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <BrowserFrame title={title} />
        )}

        {/* Overlay on hover (only when real image) */}
        {image && (
          <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-400" />
        )}
      </div>

      {/* Content */}
      <div className="flex flex-col flex-1 p-5 gap-3">
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-base font-bold text-[#1E293B] leading-snug transition-colors duration-300 group-hover:text-[#1F5E63]">{title}</h3>
          {link && (
            <a
              href={link}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-lg border border-[#E2E8F0] text-[#94A3B8] opacity-0 translate-y-1 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300 hover:text-[#475569] hover:border-[#CBD5E1]"
            >
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          )}
        </div>

        <p className="text-sm text-[#475569] leading-relaxed flex-1">{description}</p>

        {/* Tech stack */}
        <div className="flex flex-wrap gap-1.5 pt-1">
          {techStack.map((tech) => {
            const color = TECH_COLORS[tech] ?? DEFAULT_TECH;
            return (
              <span
                key={tech}
                className="text-xs font-medium px-2.5 py-1 rounded-full transition-transform duration-200 hover:scale-105"
                style={{ backgroundColor: color.bg, color: color.text }}
              >
                {tech}
              </span>
            );
          })}
        </div>
      </div>

    </div>
  );
}
