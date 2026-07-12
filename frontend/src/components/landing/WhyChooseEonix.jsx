import { MessageSquare, Route, Award, Target, Briefcase } from 'lucide-react';

const WHY_ITEMS = [
  { icon: MessageSquare, text: 'Not just learning — daily accountability system' },
  { icon: Route,         text: 'Structured progress instead of random tutorials' },
  { icon: Award,         text: 'Real mentor evaluation, not automated checks' },
  { icon: Target,        text: 'Focus on consistency and discipline' },
  { icon: Briefcase,     text: 'Designed for real career outcomes' },
];

export default function WhyChooseEonix() {
  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 bg-[#F8F9FB]">
      <div className="max-w-5xl mx-auto">

        <div className="text-center mb-12">
          <p className="text-xs font-bold tracking-widest text-[#C76D64] uppercase mb-3">Why Choose Eonix?</p>
          <h2 className="text-4xl sm:text-5xl font-extrabold text-[#1E293B] mb-4">What Makes Us Different?</h2>
          <p className="text-[#475569] text-base">Here's what sets Eonix apart from the rest.</p>
        </div>

        <div className="bg-white rounded-3xl overflow-hidden" style={{ boxShadow: '0 4px 40px rgba(215,100,90,0.15)', borderTop: '4px solid #C76D64' }}>
          {/* Mobile */}
          <div className="flex flex-col lg:hidden">
            {WHY_ITEMS.map(({ icon: Icon, text }, i) => (
              <>
                {i !== 0 && <div key={`div-${i}`} className="h-px bg-[#F4E0E4] mx-8" />}
                <div key={i} className="flex flex-col items-center gap-3 px-6 py-6 text-center">
                  <Icon className="w-7 h-7 text-[#D96C5F]" strokeWidth={1.5} />
                  <p className="text-sm text-[#475569] leading-relaxed">{text}</p>
                </div>
              </>
            ))}
          </div>

          {/* Desktop */}
          <div className="hidden lg:flex">
            {WHY_ITEMS.map(({ icon: Icon, text }, i) => (
              <>
                {i !== 0 && <div key={`div-${i}`} className="w-px self-stretch bg-[#F4E0E4] my-8" />}
                <div key={i} className="flex-1 flex flex-col items-center justify-start px-6 py-10 gap-5 text-center">
                  <Icon className="w-8 h-8 text-[#D96C5F]" strokeWidth={1.5} />
                  <p className="text-sm text-[#475569] leading-relaxed">{text}</p>
                </div>
              </>
            ))}
          </div>
        </div>

      </div>
    </section>
  );
}
