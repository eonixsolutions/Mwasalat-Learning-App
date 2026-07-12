import { Link } from 'react-router-dom';
import { Code2, Briefcase, Rocket, PhoneCall, MessageCircle, Mail, Bot, ChevronRight, Linkedin, Instagram, Youtube } from 'lucide-react';

const FOOTER_PROGRAMS = [
  { icon: Code2,     iconBg: '#E6F4F5', iconColor: '#0D9488', label: 'Zero2Code',    to: '/register' },
  { icon: Briefcase, iconBg: '#F0EEFF', iconColor: '#7C6AF2', label: 'Code2Career',  to: '/register' },
  { icon: Rocket,    iconBg: '#FFF0EE', iconColor: '#D96C5F', label: 'AI Launchpad', to: '/register' },
];

const FOOTER_CONTACT = [
  { icon: PhoneCall,     iconBg: '#E6F9F7', iconColor: '#00C0B0', label: 'Call',     value: '+91 8089272211'            },
  { icon: MessageCircle, iconBg: '#EAF4FF', iconColor: '#2563EB', label: 'WhatsApp', value: '+91 8089272211'            },
  { icon: Mail,          iconBg: '#F0EEFF', iconColor: '#6366F1', label: 'Email',    value: 'academy@eonixsolutions.in' },
  { icon: Bot,           iconBg: '#FAF0FF', iconColor: '#A855F7', label: 'AI Chat',  value: 'Get instant help anytime'  },
];

export default function Footer() {
  return (
    <footer className="mt-20">

      <div className="relative -mt-12 z-10">
        <img src="/footer-line-3.png" alt="" className="w-full pointer-events-none" draggable="false" />
      </div>

      <div className="bg-[#F8F9FB]">

        <div className="max-w-6xl mx-auto px-6 pt-6 pb-12">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">

            {/* Brand */}
            <div className="flex flex-col gap-4">
              <Link to="/"><img src="/eonix-logo.png" alt="Eonix Solutions" className="h-10 w-auto object-contain object-left" loading="lazy" /></Link>
              <p className="text-sm text-[#475569] leading-relaxed">
                Eonix Solutions is a structured learning platform focused on consistency, mentorship, and real-world skill development.
              </p>
              <div className="w-8 h-0.5 rounded-full bg-tealBrand-500" />
            </div>

            {/* Programs */}
            <div>
              <h4 className="text-base font-bold text-[#1E293B] mb-2">Programs</h4>
              <div className="w-8 h-0.5 rounded-full bg-tealBrand-500 mb-5" />
              <div className="flex flex-col gap-3">
                {FOOTER_PROGRAMS.map(({ icon: Icon, iconBg, iconColor, label, to }) => (
                  <Link key={label} to={to} className="flex items-center justify-between group">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: iconBg }}>
                        <Icon className="w-4 h-4" style={{ color: iconColor }} strokeWidth={1.8} />
                      </div>
                      <span className="text-sm text-[#475569] group-hover:text-[#1E293B] transition-colors">{label}</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-[#94A3B8] group-hover:text-[#475569] transition-colors" />
                  </Link>
                ))}
              </div>
            </div>

            {/* Contact */}
            <div>
              <h4 className="text-base font-bold text-[#1E293B] mb-2">Contact</h4>
              <div className="w-8 h-0.5 rounded-full bg-[#6366F1] mb-5" />
              <div className="flex flex-col gap-3.5">
                {FOOTER_CONTACT.map(({ icon: Icon, iconBg, iconColor, label, value }) => (
                  <div key={label} className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: iconBg }}>
                      <Icon className="w-4 h-4" style={{ color: iconColor }} strokeWidth={1.8} />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-[#1E293B]">{label}</p>
                      <p className="text-xs text-[#475569]">{value}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Legal + Social */}
            <div className="flex flex-col gap-8">
              <div>
                <h4 className="text-base font-bold text-[#1E293B] mb-2">Legal</h4>
                <div className="w-8 h-0.5 rounded-full bg-[#7C3AED] mb-5" />
                <div className="flex flex-col divide-y divide-[#E2E8F0]">
                  {['Privacy Policy', 'Terms & Conditions'].map((item) => (
                    <Link key={item} to="/" className="flex items-center justify-between py-3 text-sm text-[#475569] hover:text-[#1E293B] transition-colors group">
                      {item}
                      <ChevronRight className="w-4 h-4 text-[#94A3B8] group-hover:text-[#475569] transition-colors" />
                    </Link>
                  ))}
                </div>
              </div>
              <div>
                <h4 className="text-base font-bold text-[#1E293B] mb-2">Follow Us</h4>
                <div className="w-8 h-0.5 rounded-full bg-[#7C3AED] mb-4" />
                <div className="flex gap-3">
                  {[Linkedin, Instagram, Youtube].map((Icon, i) => (
                    <a key={i} href="#" className="w-10 h-10 rounded-xl bg-[#1E293B] flex items-center justify-center hover:bg-[#334155] transition-colors">
                      <Icon className="w-4 h-4 text-white" />
                    </a>
                  ))}
                </div>
              </div>
            </div>

          </div>
        </div>

        <div className="border-t border-[#E2E8F0] py-5 text-center">
          <p className="text-sm text-[#94A3B8]">© 2026 Eonix Solutions. All rights reserved.</p>
        </div>

      </div>
    </footer>
  );
}
