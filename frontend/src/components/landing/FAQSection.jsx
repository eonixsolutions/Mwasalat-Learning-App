import { useState } from 'react';
import { ChevronDown } from 'lucide-react';

const FAQS = [
  { q: 'I have no IT background. Can I still join?',              a: "Absolutely! Our program is designed for complete beginners. Whether you're new to technology or transitioning from a different field, we provide the foundational training and mentorship you need to succeed." },
  { q: 'Do I need a degree to join?',                             a: "No, you don't need a degree to enrol. We believe anyone with a willingness to learn can succeed with the right guidance and resources." },
  { q: "I'm a housewife with no job experience. Can this help?",  a: "Yes! Our program is perfect for housewives or anyone without prior job experience. We start with a basics program to build your skills and guide you step-by-step toward becoming a tech professional." },
  { q: 'What if I get stuck during the course?',                  a: "You'll never be stuck alone! Our mentors are available daily to guide you, answer your questions, and help you overcome any challenges you face." },
  { q: 'Will I get a job after completing the course?',           a: "Definitely! We equip you with the skills and confidence to secure a job, along with placement support to guide your journey." },
  { q: 'Are the classes online or offline?',                      a: 'We offer both online and offline options. Our programs are flexible to suit your learning preference and location.' },
  { q: 'How can I find out the fee details?',                     a: 'Fee details are available on each course\'s detail page. Simply click "Choose" on the program you\'re interested in to view the full details including pricing.' },
];

export default function FAQSection() {
  const [openIdx, setOpenIdx] = useState(null);

  return (
    <section className="relative pt-10 pb-20 px-4 sm:px-6 lg:px-8 bg-[#F8F9FB] overflow-hidden">

      <svg className="absolute inset-0 w-full h-full pointer-events-none" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid slice">
        <text x="-1%" y="45%" fontSize="160" fontFamily="Georgia, serif" fontWeight="700" fill="#1F5E63" fillOpacity="0.10" transform="rotate(-10, 80, 200)">?</text>
        <text x="88%" y="75%" fontSize="120" fontFamily="Georgia, serif" fontWeight="700" fill="#C76D64" fillOpacity="0.12" transform="rotate(12, 1280, 400)">?</text>
        <text x="82%" y="30%" fontSize="60"  fontFamily="Georgia, serif" fontWeight="700" fill="#1F5E63" fillOpacity="0.10" transform="rotate(8, 1200, 120)">?</text>
        <circle cx="4%"  cy="25%" r="36" fill="none" stroke="#1F5E63" strokeWidth="1.5" strokeOpacity="0.20" />
        <circle cx="7%"  cy="70%" r="22" fill="none" stroke="#1F5E63" strokeWidth="1.2" strokeOpacity="0.16" />
        <circle cx="2%"  cy="55%" r="12" fill="none" stroke="#C76D64" strokeWidth="1.2" strokeOpacity="0.18" />
        <circle cx="96%" cy="40%" r="28" fill="none" stroke="#1F5E63" strokeWidth="1.5" strokeOpacity="0.20" />
        <circle cx="93%" cy="80%" r="16" fill="none" stroke="#C76D64" strokeWidth="1.2" strokeOpacity="0.18" />
        <circle cx="5%"  cy="40%" r="3.5" fill="#1F5E63" fillOpacity="0.22" />
        <circle cx="9%"  cy="85%" r="2.5" fill="#C76D64" fillOpacity="0.24" />
        <circle cx="3%"  cy="15%" r="3"   fill="#1F5E63" fillOpacity="0.18" />
        <circle cx="95%" cy="20%" r="3.5" fill="#1F5E63" fillOpacity="0.22" />
        <circle cx="91%" cy="60%" r="2.5" fill="#C76D64" fillOpacity="0.20" />
        <circle cx="97%" cy="90%" r="3"   fill="#1F5E63" fillOpacity="0.18" />
        <path d="M 20,80 Q 60,40 30,160"    fill="none" stroke="#1F5E63" strokeWidth="1.5" strokeOpacity="0.20" strokeDasharray="5 7" />
        <path d="M 1420,100 Q 1380,200 1410,320" fill="none" stroke="#1F5E63" strokeWidth="1.5" strokeOpacity="0.18" strokeDasharray="4 8" />
      </svg>

      <div className="max-w-3xl mx-auto relative z-10">

        <div className="text-center mb-12">
          <p className="text-xs font-bold tracking-widest text-[#C76D64] uppercase mb-3">FAQ</p>
          <h2 className="text-4xl sm:text-5xl font-extrabold text-[#1E293B] mb-4">Common Questions</h2>
          <p className="text-[#475569] text-base">Everything you need to know before joining.</p>
        </div>

        <div className="space-y-3">
          {FAQS.map((faq, i) => (
            <div
              key={i}
              className="bg-white rounded-2xl overflow-hidden transition-shadow duration-200"
              style={{ boxShadow: openIdx === i ? '0 4px 24px rgba(0,0,0,0.08)' : '0 2px 12px rgba(0,0,0,0.05)' }}
            >
              <button
                onClick={() => setOpenIdx(openIdx === i ? null : i)}
                className="w-full flex items-center justify-between px-6 py-5 text-left gap-4"
              >
                <span className="text-sm font-semibold text-[#1E293B]">{faq.q}</span>
                <ChevronDown className={`w-5 h-5 text-[#94A3B8] flex-shrink-0 transition-transform duration-200 ${openIdx === i ? 'rotate-180 text-[#C76D64]' : ''}`} />
              </button>
              {openIdx === i && (
                <div className="px-6 pb-5">
                  <div className="h-px bg-[#F1F5F9] mb-4" />
                  <p className="text-sm text-[#475569] leading-relaxed">{faq.a}</p>
                </div>
              )}
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}
