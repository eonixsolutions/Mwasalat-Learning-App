import { Laptop, Briefcase, Brain, Rocket } from 'lucide-react';

const WHO_ITEMS = [
  { icon: Laptop,   iconBg: '#EAF4F0', pill: 'linear-gradient(180deg, #2ECC71, #1AAB8A)', title: 'Beginners Starting from Scratch', desc: 'Students who want to learn programming from the ground up.'                 },
  { icon: Briefcase, iconBg: '#E6F4F5', pill: 'linear-gradient(180deg, #1FB5C5, #0D9488)', title: 'Career Switchers',               desc: 'Individuals transitioning into tech from non-technical backgrounds.'       },
  { icon: Brain,    iconBg: '#FDEFEE', pill: 'linear-gradient(180deg, #F87171, #D96C5F)', title: 'Struggling Learners',             desc: 'Those who find it hard to stay consistent with self-learning.'            },
  { icon: Rocket,   iconBg: '#F0EEFF', pill: 'linear-gradient(180deg, #A78BFA, #7C6AF2)', title: 'Serious Skill Builders',          desc: 'Anyone committed to building real, job-ready skills.'                    },
];

export default function WhoCanJoin() {
  return (
    <section className="relative pt-12 pb-20 px-4 sm:px-6 lg:px-8 bg-white overflow-hidden">

      <svg className="absolute top-0 left-0 w-64 h-64 opacity-40" viewBox="0 0 200 200" fill="none">
        <circle cx="20"  cy="20"  r="3" fill="#F2B3AC" />
        <circle cx="60"  cy="10"  r="2" fill="#F2B3AC" />
        <circle cx="10"  cy="60"  r="2" fill="#A7D1D4" />
        <circle cx="40"  cy="80"  r="3" fill="#F2B3AC" />
        <circle cx="80"  cy="40"  r="2" fill="#A7D1D4" />
        <circle cx="100" cy="15"  r="4" fill="#F2B3AC" opacity="0.5" />
        <circle cx="15"  cy="110" r="3" fill="#A7D1D4" opacity="0.6" />
        <path d="M0 120 Q60 80 120 120" stroke="#F2B3AC" strokeWidth="1" strokeDasharray="4 6" />
      </svg>

      <svg className="absolute bottom-0 right-0 w-64 h-64 opacity-40" viewBox="0 0 200 200" fill="none">
        <circle cx="180" cy="180" r="3" fill="#F2B3AC" />
        <circle cx="140" cy="190" r="2" fill="#A7D1D4" />
        <circle cx="190" cy="140" r="2" fill="#F2B3AC" />
        <circle cx="160" cy="120" r="3" fill="#A7D1D4" />
        <circle cx="120" cy="160" r="2" fill="#F2B3AC" />
        <circle cx="100" cy="185" r="4" fill="#A7D1D4" opacity="0.5" />
        <circle cx="185" cy="100" r="3" fill="#F2B3AC" opacity="0.6" />
        <path d="M200 80 Q140 120 80 80" stroke="#A7D1D4" strokeWidth="1" strokeDasharray="4 6" />
      </svg>

      <svg className="absolute top-1/2 -translate-y-1/2 right-8 w-20 h-48 opacity-20" viewBox="0 0 60 160" fill="none">
        <circle cx="10" cy="20"  r="6" stroke="#D96C5F" strokeWidth="1.5" />
        <circle cx="40" cy="60"  r="4" stroke="#0D9488" strokeWidth="1.5" />
        <circle cx="15" cy="100" r="5" stroke="#7C6AF2" strokeWidth="1.5" />
        <circle cx="45" cy="140" r="3" stroke="#D96C5F" strokeWidth="1.5" />
      </svg>

      <div className="max-w-3xl mx-auto relative z-10">

        <div className="text-center mb-12">
          <p className="text-xs font-bold tracking-widest text-[#C76D64] uppercase mb-3">Who Can Join?</p>
          <h2 className="text-4xl sm:text-5xl font-extrabold text-[#1E293B] mb-4">Built for Serious Learners</h2>
          <p className="text-[#475569] text-base">Designed for people who are ready to stay consistent and grow.</p>
        </div>

        <div data-stagger className="flex flex-col gap-4">
          {WHO_ITEMS.map(({ icon: Icon, iconBg, pill, title, desc }, i) => (
            <div key={i} className="card-hover flex items-center gap-5 bg-white rounded-2xl px-6 py-5" style={{ boxShadow: '0 4px 24px rgba(217, 108, 95, 0.12)' }}>
              <div className="flex-shrink-0 w-16 h-16 rounded-full flex items-center justify-center" style={{ backgroundColor: iconBg }}>
                <Icon className="w-7 h-7 text-[#475569]" strokeWidth={1.5} />
              </div>
              <div className="w-px h-12 bg-[#E2E8F0] flex-shrink-0" />
              <div className="w-2.5 h-12 rounded-full flex-shrink-0" style={{ background: pill }} />
              <div>
                <p className="text-base font-bold text-[#1E293B] mb-1">{title}</p>
                <p className="text-sm text-[#475569] leading-relaxed">{desc}</p>
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}
