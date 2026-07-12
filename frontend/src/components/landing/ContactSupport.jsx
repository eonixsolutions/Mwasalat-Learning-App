import { useState, useEffect, useRef } from 'react';
import { PhoneCall, MessageCircle, Mail, Bot, Check, Loader2 } from 'lucide-react';
import { contactService } from '../../services/contact.service.js';

const CONTACT_ITEMS = [
  { icon: PhoneCall,     gradient: 'linear-gradient(135deg, #00C8B8, #00A8E8)', color: '#00C0B0', label: 'Call',             value: '+91 8089272211',            topPx: 0  },
  { icon: MessageCircle, gradient: 'linear-gradient(135deg, #2563EB, #1E40AF)', color: '#2563EB', label: 'WhatsApp',         value: '+91 8089272211',            topPx: 80 },
  { icon: Mail,          gradient: 'linear-gradient(135deg, #6366F1, #7C3AED)', color: '#6366F1', label: 'Email',            value: 'academy@eonixsolutions.in', topPx: 0  },
  { icon: Bot,           gradient: 'linear-gradient(135deg, #8B5CF6, #C026D3)', color: '#A855F7', label: 'AI Chat Assistant', value: 'Get instant help anytime',  topPx: 72 },
];

function ContactForm() {
  const [form, setForm] = useState({ name: '', contact: '', message: '' });
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => setForm(f => ({ ...f, [e.target.name]: e.target.value }));
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await contactService.submit(form);
      setSubmitted(true);
    } catch (err) {
      setError(err.response?.data?.message ?? 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (submitted) return (
    <div className="text-center py-8">
      <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
        <Check className="w-8 h-8 text-green-500" />
      </div>
      <h3 className="text-lg font-bold text-[#1E293B] mb-2">Message Sent!</h3>
      <p className="text-sm text-[#475569]">We'll get back to you within 24 hours.</p>
    </div>
  );

  return (
    <form onSubmit={handleSubmit}>
      <div className="grid sm:grid-cols-2 gap-4 mb-4">
        <input name="name"    value={form.name}    onChange={handleChange} placeholder="Your Name"         required className="input-base" />
        <input name="contact" value={form.contact} onChange={handleChange} placeholder="Phone or Email"    required className="input-base" />
      </div>
      <textarea
        name="message" value={form.message} onChange={handleChange}
        placeholder="Tell us what you'd like to know…"
        rows={4} className="input-base mb-4 resize-none"
      />
      {error && (
        <p className="text-sm text-red-500 mb-3">{error}</p>
      )}
      <button
        type="submit"
        disabled={loading}
        className="w-full bg-[#CA6357] hover:bg-[#b85548] text-white font-semibold py-3 rounded-xl transition-colors text-sm flex items-center justify-center gap-2 disabled:opacity-60"
      >
        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
        {loading ? 'Sending…' : 'Send Message'}
      </button>
    </form>
  );
}

export default function ContactSupport() {
  const [jumped, setJumped] = useState(false);
  const circlesRef = useRef(null);
  const timerRef = useRef(null);

  useEffect(() => {
    const el = circlesRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          clearTimeout(timerRef.current);
          setJumped(true);
          timerRef.current = setTimeout(() => setJumped(false), 1500);
        }
      },
      { threshold: 0.4 }
    );
    observer.observe(el);
    return () => { observer.disconnect(); clearTimeout(timerRef.current); };
  }, []);

  return (
    <section id="contact" className="pt-10 pb-0 px-4 sm:px-6 lg:px-8 bg-white overflow-hidden">
      <div className="max-w-5xl mx-auto">

        <div className="text-center mb-16">
          <p className="text-xs font-bold tracking-widest text-[#C76D64] uppercase mb-3">Contact &amp; Support</p>
          <h2 className="text-5xl sm:text-6xl font-extrabold text-[#1E293B] mb-6">Get in Touch</h2>
          <p className="text-[#475569] text-base max-w-md mx-auto leading-relaxed">
            We're here to help! Reach out to us through any of the options below and our team will get back to you as soon as possible.
          </p>
        </div>

        {/* Desktop circles on wave */}
        <div ref={circlesRef} className="hidden md:block relative" style={{ height: '200px' }}>

          <img src="/wave-vector-2.png" alt="" className="absolute w-full z-10 pointer-events-none" style={{ top: '-300px' }} loading="lazy" draggable="false" />

          {CONTACT_ITEMS.map(({ icon: Icon, gradient, color, label, value, topPx }, i) => {
            const lefts = ['16%', '39%', '60%', '87%'];
            return (
              <div
                key={i}
                className="absolute flex flex-col items-center group cursor-pointer z-20"
                style={{ left: lefts[i], transform: 'translateX(-50%)', top: `${topPx}px` }}
              >
                <div
                  className={`w-20 h-20 rounded-full flex items-center justify-center transition-transform duration-300 ease-out group-hover:-translate-y-3 ${jumped ? 'contact-jump' : ''}`}
                  style={{ background: gradient, boxShadow: '0 8px 32px rgba(0,0,0,0.15)', animationDelay: `${i * 0.12}s` }}
                >
                  <Icon className="w-8 h-8 text-white" strokeWidth={1.8} />
                </div>
                <div className="flex flex-col items-center mt-3 gap-1">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
                  <div className="w-px h-5 border-l-2 border-dashed" style={{ borderColor: color }} />
                </div>
                <p className="text-sm font-bold mt-1" style={{ color }}>{label}</p>
                <div className="w-8 h-0.5 rounded-full mt-1 mb-1.5" style={{ backgroundColor: color }} />
                <p className="text-xs text-[#475569] text-center leading-snug max-w-[120px]">{value}</p>
              </div>
            );
          })}
        </div>

        {/* Mobile circles */}
        <div className="md:hidden grid grid-cols-2 gap-8">
          {CONTACT_ITEMS.map(({ icon: Icon, gradient, color, label, value }, i) => (
            <div key={i} className="flex flex-col items-center text-center group cursor-pointer">
              <div
                className={`w-16 h-16 rounded-full flex items-center justify-center transition-transform duration-300 ease-out group-hover:-translate-y-3 ${jumped ? 'contact-jump' : ''}`}
                style={{ background: gradient, boxShadow: '0 8px 24px rgba(0,0,0,0.15)', animationDelay: `${i * 0.12}s` }}
              >
                <Icon className="w-6 h-6 text-white" strokeWidth={1.8} />
              </div>
              <div className="flex flex-col items-center mt-3 gap-1">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
                <div className="w-px h-4 border-l-2 border-dashed" style={{ borderColor: color }} />
              </div>
              <p className="text-sm font-bold mt-1" style={{ color }}>{label}</p>
              <div className="w-8 h-0.5 rounded-full mt-1 mb-1.5" style={{ backgroundColor: color }} />
              <p className="text-xs text-[#475569] leading-snug">{value}</p>
            </div>
          ))}
        </div>

        {/* Contact form — wave into teal */}
        <div className="mt-16 -mx-4 sm:-mx-6 lg:-mx-8">
          <div className="relative bg-[#E6F4F5] overflow-hidden">
            <svg viewBox="0 0 1440 72" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full block -mb-px">
              <path d="M0,0 L0,28 C180,68 360,8 540,40 C720,72 900,12 1080,44 C1260,72 1380,24 1440,36 L1440,0 Z" fill="white" />
            </svg>

            {/* Decorative vectors */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid slice">
              <circle cx="6%"  cy="30%" r="3"   fill="#1F5E63" fillOpacity="0.18" />
              <circle cx="12%" cy="65%" r="2"   fill="#1F5E63" fillOpacity="0.13" />
              <circle cx="20%" cy="45%" r="4"   fill="#1F5E63" fillOpacity="0.10" />
              <circle cx="8%"  cy="80%" r="2.5" fill="#C76D64" fillOpacity="0.15" />
              <circle cx="25%" cy="20%" r="2"   fill="#1F5E63" fillOpacity="0.14" />
              <circle cx="78%" cy="25%" r="3"   fill="#1F5E63" fillOpacity="0.18" />
              <circle cx="88%" cy="55%" r="2"   fill="#1F5E63" fillOpacity="0.13" />
              <circle cx="94%" cy="35%" r="4"   fill="#1F5E63" fillOpacity="0.10" />
              <circle cx="82%" cy="75%" r="2.5" fill="#C76D64" fillOpacity="0.15" />
              <circle cx="72%" cy="85%" r="2"   fill="#1F5E63" fillOpacity="0.12" />
              <circle cx="15%" cy="55%" r="18" fill="none" stroke="#1F5E63" strokeWidth="1.2" strokeOpacity="0.14" />
              <circle cx="85%" cy="45%" r="24" fill="none" stroke="#1F5E63" strokeWidth="1"   strokeOpacity="0.12" />
              <circle cx="50%" cy="15%" r="12" fill="none" stroke="#C76D64" strokeWidth="1"   strokeOpacity="0.12" />
              <path d="M 60,280 Q 120,200 200,260"    fill="none" stroke="#1F5E63" strokeWidth="1.5" strokeOpacity="0.15" strokeDasharray="5 6" />
              <path d="M 1300,80 Q 1360,160 1280,220" fill="none" stroke="#1F5E63" strokeWidth="1.5" strokeOpacity="0.13" strokeDasharray="4 7" />
              <path d="M 700,20 Q 760,60 720,110"     fill="none" stroke="#C76D64" strokeWidth="1"   strokeOpacity="0.12" strokeDasharray="3 6" />
              <rect x="3%"  y="50%" width="7" height="7" rx="1" transform="rotate(45, 43, 200)"   fill="none" stroke="#1F5E63" strokeWidth="1.2" strokeOpacity="0.18" />
              <rect x="90%" y="70%" width="6" height="6" rx="1" transform="rotate(45, 1310, 280)" fill="none" stroke="#C76D64" strokeWidth="1"   strokeOpacity="0.16" />
              <g transform="translate(68, 120)" opacity="0.18">
                <circle cx="0" cy="-6" r="5" fill="none" stroke="#1F5E63" strokeWidth="1.4" />
                <path d="M 0,-1 L 0,8" stroke="#1F5E63" strokeWidth="1.4" strokeLinecap="round" />
              </g>
              <g transform="translate(1380, 240)" opacity="0.15">
                <circle cx="0" cy="-6" r="5" fill="none" stroke="#C76D64" strokeWidth="1.4" />
                <path d="M 0,-1 L 0,8" stroke="#C76D64" strokeWidth="1.4" strokeLinecap="round" />
              </g>
              <g stroke="#1F5E63" strokeWidth="1" strokeOpacity="0.10" strokeLinecap="round">
                <line x1="35%" y1="38%" x2="35%" y2="42%" /><line x1="33%" y1="40%" x2="37%" y2="40%" />
                <line x1="65%" y1="72%" x2="65%" y2="76%" /><line x1="63%" y1="74%" x2="67%" y2="74%" />
              </g>
            </svg>

            <div className="max-w-xl mx-auto px-4 pb-16 pt-4">
              <div className="bg-white rounded-3xl p-8 sm:p-10" style={{ boxShadow: '0 8px 48px rgba(31,94,99,0.12)' }}>
                <h3 className="text-xl font-bold text-[#1E293B] mb-1">Drop Us a Message</h3>
                <p className="text-sm text-[#475569] mb-6">We'll get back to you within 24 hours.</p>
                <ContactForm />
              </div>
            </div>
          </div>

          <svg viewBox="0 0 1440 72" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full block -mt-px">
            <path d="M0,0 L1440,0 L1440,44 C1380,24 1260,68 1080,40 C900,8 720,72 540,44 C360,12 180,72 0,36 Z" fill="#E6F4F5" />
          </svg>
        </div>

      </div>
    </section>
  );
}
