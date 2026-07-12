import { ClipboardList, Target, ClipboardCheck, Crown, TrendingUp, GraduationCap } from 'lucide-react';

const STEPS = [
  { icon: ClipboardList,  number: 1, title: 'Register & Get Approved',          desc: 'Join the platform and get onboarded into your batch.',                      numBg: '#065E60', iconColor: '#065E60', iconBg: '#EBF4F2' },
  { icon: Target,         number: 2, title: 'Start Learning Daily',             desc: 'Access classes, task sheets, and daily coding challenges.',                  numBg: '#C76D64', iconColor: '#C76D64', iconBg: '#FDEFEE' },
  { icon: ClipboardCheck, number: 3, title: 'Submit Daily Progress',            desc: 'Unlock content by updating your daily learning status.',                     numBg: '#FE8B1A', iconColor: '#FE8B1A', iconBg: '#FEF1E8' },
  { icon: Crown,          number: 4, title: 'Get Mentor Feedback',              desc: 'Request reviews, attend sessions, and improve continuously.',                numBg: '#855EE2', iconColor: '#855EE2', iconBg: '#F2EEFD' },
  { icon: TrendingUp,     number: 5, title: 'Track Your Growth',                desc: 'Monitor your progress through dashboards and analytics.',                    numBg: '#22A66E', iconColor: '#22A66E', iconBg: '#E8F8F2' },
  { icon: GraduationCap,  number: 6, title: 'Build Projects & Get Career Ready', desc: 'Work on real projects and prepare for opportunities.',                      numBg: '#065E60', iconColor: '#065E60', iconBg: '#EBF4F2' },
];

export default function HowItWorks() {
  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="bg-[#F4FBFB] rounded-3xl px-8 py-12 lg:px-16 lg:py-14">

          <div className="text-center mb-12">
            <p className="text-xs font-semibold tracking-widest text-[#065E60] uppercase mb-3">How It Works</p>
            <h2 className="text-3xl sm:text-4xl font-bold text-[#1E293B]">
              Your Path to{' '}
              <span className="text-[#C76D64]">Success</span>
              {' '}in 6 Simple Steps
            </h2>
          </div>

          <div data-stagger className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-8 lg:gap-4">
            {STEPS.map((step, i) => (
              <div key={step.number} className="relative flex flex-col items-center text-center">
                {i < STEPS.length - 1 && (
                  <div className="hidden lg:block absolute top-9 left-[calc(50%+28px)] w-[calc(100%-56px)] border-t-2 border-dashed border-[#C9E8E8] z-0" />
                )}
                <div className="relative w-[72px] h-[72px] rounded-full flex items-center justify-center mb-3 z-10" style={{ backgroundColor: step.iconBg }}>
                  <step.icon className="w-7 h-7" style={{ color: step.iconColor }} />
                  <div className="absolute -bottom-2 w-5 h-5 rounded-full flex items-center justify-center text-white text-[10px] font-bold" style={{ backgroundColor: step.numBg }}>
                    {step.number}
                  </div>
                </div>
                <p className="text-sm font-bold text-[#1E293B] mt-2 mb-1.5 leading-snug">{step.title}</p>
                <p className="text-xs text-[#94A3B8] leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>

        </div>
      </div>
    </section>
  );
}
