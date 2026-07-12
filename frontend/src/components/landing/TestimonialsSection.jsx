const TESTIMONIALS = [
  {
    name: 'Rahul M.',
    initials: 'RM',
    program: 'Zero2Code',
    accentColor: '#E8557A',
    quote: 'I had zero coding knowledge before joining. The daily tasks and mentor check-ins kept me on track every single day. The structure here is unlike anything I found on YouTube.',
    rating: 5,
  },
  {
    name: 'Priya K.',
    initials: 'PK',
    program: 'Zero2Code',
    accentColor: '#E8557A',
    quote: "What I love most is that someone actually reviews my work every week. It's not just watching videos — I'm building real things and getting real feedback from a mentor.",
    rating: 5,
  },
  {
    name: 'Aditya S.',
    initials: 'AS',
    program: 'Code2Career',
    accentColor: '#7C5CE8',
    quote: "The accountability system is what made the difference. I'd tried learning online before and always gave up. Here, the daily progress tracking and mentor support kept me going.",
    rating: 5,
  },
];

export default function TestimonialsSection() {
  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 bg-[#F8F9FB]">
      <div className="max-w-5xl mx-auto">

        <div className="text-center mb-12">
          <p className="text-xs font-bold tracking-widest text-[#C76D64] uppercase mb-3">Student Voices</p>
          <h2 className="text-4xl sm:text-5xl font-extrabold text-[#1E293B] mb-4">What Our Students Say</h2>
          <p className="text-[#475569] text-base max-w-sm mx-auto">Real words from students currently in their learning journey.</p>
        </div>

        <div data-stagger className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {TESTIMONIALS.map((t, i) => (
            <div key={i} className="card-hover bg-white rounded-2xl p-6 flex flex-col" style={{ boxShadow: '0 4px 24px rgba(0,0,0,0.06)' }}>
              <div className="text-5xl font-serif leading-none mb-2 select-none" style={{ color: '#F2B3AC' }}>"</div>
              <div className="flex gap-0.5 mb-3">
                {Array(t.rating).fill(0).map((_, j) => (
                  <span key={j} className="text-[#F59E0B] text-sm">★</span>
                ))}
              </div>
              <p className="text-sm text-[#475569] leading-relaxed flex-1 mb-5">{t.quote}</p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0" style={{ backgroundColor: t.accentColor }}>
                  {t.initials}
                </div>
                <div>
                  <p className="text-sm font-bold text-[#1E293B]">{t.name}</p>
                  <p className="text-xs text-[#94A3B8]">{t.program}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}
