import { TrendingUp, Lightbulb, MessageSquare, CalendarCheck, Laptop, Activity } from 'lucide-react';

const KEY_FEATURES = [
  { icon: TrendingUp,    title: 'Progress Tracking',          desc: 'Daily, weekly, and monthly tracking to ensure consistency.',                 iconColor: '#065E60', iconBg: '#EBF4F2' },
  { icon: Lightbulb,     title: 'Smart Learning Access',      desc: 'Content unlocks based on your progress, status, and performance.',           iconColor: '#855EE2', iconBg: '#F2EEFD' },
  { icon: MessageSquare, title: 'Mentor Support',             desc: 'Dedicated mentors for technical and communication guidance.',                 iconColor: '#C76D64', iconBg: '#FDEFEE' },
  { icon: CalendarCheck, title: 'Review & Evaluation System', desc: 'Book review slots and get structured feedback.',                              iconColor: '#F59E0B', iconBg: '#FFFBEB' },
  { icon: Laptop,        title: 'Real Project Building',      desc: 'Hands-on projects to build practical skills.',                               iconColor: '#22A66E', iconBg: '#E8F8F2' },
  { icon: Activity,      title: 'Performance Analytics',      desc: 'Track improvements and identify weak areas.',                                iconColor: '#0D9488', iconBg: '#E6F4F5' },
];

export default function KeyFeatures() {
  return (
    <section id="features" className="bg-[#F8F9FB] py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">

        <div className="flex items-center justify-center gap-3 mb-5">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#C76D64]" />
            <div className="w-10 h-px bg-[#065E60]" />
          </div>
          <p className="text-xs font-bold tracking-[0.2em] text-[#065E60] uppercase">Key Features</p>
          <div className="flex items-center gap-1.5">
            <div className="w-10 h-px bg-[#065E60]" />
            <span className="w-2 h-2 rounded-full bg-[#C76D64]" />
          </div>
        </div>

        <div className="text-center mb-4">
          <h2 className="text-4xl sm:text-5xl font-extrabold text-[#1E293B] leading-[1.2]">
            Designed for Discipline,<br />
            Not Just <span className="text-[#C76D64]">Learning</span>
          </h2>
        </div>

        <div className="flex justify-center gap-0 mb-14">
          <div className="w-10 h-1 rounded-l-full bg-[#065E60]" />
          <div className="w-10 h-1 rounded-r-full bg-[#C76D64]" />
        </div>

        <div data-stagger className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10">
          {KEY_FEATURES.map(({ icon: Icon, title, desc, iconColor, iconBg }) => (
            <div key={title} className="card-hover flex flex-col items-center text-center bg-white rounded-2xl p-6" style={{ boxShadow: '0 2px 16px rgba(0,0,0,0.05)' }}>
              <div className="w-20 h-20 rounded-full flex items-center justify-center mb-5" style={{ backgroundColor: iconBg }}>
                <Icon className="w-8 h-8" style={{ color: iconColor }} />
              </div>
              <p className="text-base font-bold text-[#1E293B] mb-2">{title}</p>
              <div className="w-8 h-0.5 rounded-full bg-[#C76D64] mb-3" />
              <p className="text-sm text-[#94A3B8] leading-relaxed max-w-[220px]">{desc}</p>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}
