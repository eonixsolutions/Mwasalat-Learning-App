import { BookOpen, ClipboardList, Users, BarChart2, Heart, ClipboardCheck } from 'lucide-react';

const PLATFORM_FEATURES = [
  { icon: BookOpen,      label: 'Step-by-step learning roadmap' },
  { icon: ClipboardList, label: 'Daily task-based progress' },
  { icon: Users,         label: 'Continuous mentor evaluation' },
  { icon: BarChart2,     label: 'Performance tracking & analytics' },
];

export default function WhatIsEonix() {
  return (
    <section id="about" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-20">
      <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">

        {/* Image side */}
        <div className="relative flex items-end justify-center">
          <div className="absolute inset-0 m-auto w-[85%] h-[85%]" style={{ background: '#FDEFEE', borderRadius: '60% 40% 55% 45% / 50% 60% 40% 50%' }} />

          <div className="absolute top-12 left-0 w-12 h-12 rounded-full bg-[#C76D64] flex items-center justify-center shadow-lg z-10">
            <Heart className="w-5 h-5 text-white fill-white" />
          </div>

          <div className="absolute top-1/4 right-4 w-0 h-0 z-10" style={{ borderLeft: '12px solid transparent', borderRight: '12px solid transparent', borderBottom: '20px solid #C76D64' }} />

          <img
            src="/what's-eonix-image-new.png"
            alt="Student using Eonix platform"
            className="relative w-[85%] object-contain z-10 mix-blend-multiply"
            loading="lazy"
            draggable="false"
          />

          {/* Weekly Status card */}
          <div className="absolute bottom-4 right-0 bg-[#1E2A3B] rounded-2xl px-5 py-4 z-20 shadow-xl w-64" style={{ animation: 'float 3.5s ease-in-out infinite' }}>
            <p className="text-white text-sm font-semibold mb-4">Weekly Status</p>

            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-[#F59E0B] flex items-center justify-center flex-shrink-0" style={{ boxShadow: '0 0 0 0 rgba(245,158,11,0.5)', animation: 'ctaPulse 2.5s ease-out infinite' }}>
                  <ClipboardCheck className="w-4 h-4 text-white" />
                </div>
                <div>
                  <p className="stat-pop text-white text-sm font-bold leading-none">12/15</p>
                  <p className="text-[#94A3B8] text-[10px] mt-0.5">Tasks Completed</p>
                </div>
              </div>
              <svg width="40" height="24" viewBox="0 0 40 24" fill="none">
                <defs>
                  <clipPath id="sparkClip1">
                    <rect className="sparkline-clip-rect" x="0" y="0" width="0" height="24" />
                  </clipPath>
                </defs>
                <polygon points="0,20 10,14 20,16 30,8 40,4 40,24 0,24" fill="#F59E0B" fillOpacity="0.15" clipPath="url(#sparkClip1)" />
                <polyline className="sparkline-line" points="0,20 10,14 20,16 30,8 40,4" stroke="#F59E0B" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>

            <div className="border-t border-white/10 mb-3" />

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-[#22A66E] flex items-center justify-center flex-shrink-0" style={{ boxShadow: '0 0 0 0 rgba(34,166,110,0.5)', animation: 'ctaPulse 2.5s ease-out 1.2s infinite' }}>
                  <ClipboardList className="w-4 h-4 text-white" />
                </div>
                <div>
                  <p className="stat-pop stat-pop-delay text-white text-sm font-bold leading-none">85%</p>
                  <p className="text-[#94A3B8] text-[10px] mt-0.5">Progress This Week</p>
                </div>
              </div>
              <svg width="40" height="24" viewBox="0 0 40 24" fill="none">
                <defs>
                  <clipPath id="sparkClip2">
                    <rect className="sparkline-clip-rect sparkline-clip-delay" x="0" y="0" width="0" height="24" />
                  </clipPath>
                </defs>
                <polygon points="0,22 10,18 20,14 30,8 40,2 40,24 0,24" fill="#22A66E" fillOpacity="0.15" clipPath="url(#sparkClip2)" />
                <polyline className="sparkline-line sparkline-delay" points="0,22 10,18 20,14 30,8 40,2" stroke="#22A66E" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
          </div>
        </div>

        {/* Content side */}
        <div>
          <p className="text-sm font-semibold text-[#C76D64] mb-3">What is Eonix?</p>
          <h2 className="text-3xl sm:text-4xl font-bold text-[#1E293B] leading-[1.2] mb-5">
            A Complete Learning &amp; Career Development Platform
          </h2>
          <p className="text-[#475569] text-base leading-relaxed mb-4">
            Eonix Solutions is not just a course platform — it is a guided system built around
            daily consistency, real mentor support, and structured progress that you can actually see.
          </p>
          <p className="text-[#475569] text-base leading-relaxed mb-8">
            Our students consistently highlight the structured daily system and close mentor
            attention as what sets Eonix apart from everything else they've tried.
          </p>
          <ul className="space-y-4">
            {PLATFORM_FEATURES.map(({ icon: Icon, label }) => (
              <li key={label} className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full border-2 border-[#C76D64] flex items-center justify-center flex-shrink-0">
                  <Icon className="w-4 h-4 text-[#C76D64]" />
                </div>
                <span className="text-[#1E293B] text-sm font-medium">{label}</span>
              </li>
            ))}
          </ul>
        </div>

      </div>
    </section>
  );
}
