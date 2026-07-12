import { useState, useEffect } from 'react';
import { Link, Navigate } from 'react-router-dom';
import {
  ArrowRight, Phone, Headphones, Megaphone,
  BarChart2, Users, Code2, Briefcase, Flame, Zap,
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth.js';
import { ROLE_DASHBOARD } from '../../constants/roles.js';
import Navbar from '../../components/shared/Navbar.jsx';

import HowItWorks         from '../../components/landing/HowItWorks.jsx';
import WhatIsEonix        from '../../components/landing/WhatIsEonix.jsx';
import KeyFeatures        from '../../components/landing/KeyFeatures.jsx';
import ProgramsSection    from '../../components/landing/ProgramsSection.jsx';
import WhyChooseEonix     from '../../components/landing/WhyChooseEonix.jsx';
import TestimonialsSection from '../../components/landing/TestimonialsSection.jsx';
import StudentProjects    from '../../components/landing/StudentProjects.jsx';
import WhoCanJoin         from '../../components/landing/WhoCanJoin.jsx';
import FAQSection         from '../../components/landing/FAQSection.jsx';
import ContactSupport     from '../../components/landing/ContactSupport.jsx';
import Footer             from '../../components/shared/Footer.jsx';

export default function LandingPage() {
  const { isAuthenticated, role } = useAuth();

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('revealed');
          } else {
            entry.target.classList.remove('revealed');
          }
        });
      },
      { threshold: 0.08 }
    );
    document.querySelectorAll('[data-reveal], [data-stagger]').forEach(el => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  if (isAuthenticated && role) return <Navigate to={ROLE_DASHBOARD[role]} replace />;

  return (
    <div className="min-h-screen bg-white">
      <AnnouncementBar />
      <Navbar />
      <HeroSection />
      <div data-reveal><FeaturesStrip /></div>
      <div data-reveal><HowItWorks /></div>
      <div data-reveal><WhatIsEonix /></div>
      <div data-reveal><KeyFeatures /></div>
      <div data-reveal><ProgramsSection /></div>
      <div data-reveal><WhyChooseEonix /></div>
      <div data-reveal><TestimonialsSection /></div>
      <div data-reveal><StudentProjects /></div>
      <div data-reveal><WhoCanJoin /></div>
      <div data-reveal><FAQSection /></div>
      <div data-reveal><ContactSupport /></div>
      <Footer />
      <FloatingWhatsApp />
    </div>
  );
}

/* ─── Announcement Bar ───────────────────────────────────────── */

function AnnouncementBar() {
  return (
    <div className="bg-[#fef4f2] py-2.5 px-4">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <p className="text-xs text-[#475569]">
          <Megaphone className="inline w-3.5 h-3.5 mr-1.5 text-coral-500" />
          <span className="font-semibold text-[#1E293B]">New Batch Starting Soon!</span>
          {' '}Small batches · personalised mentor attention from day one.
        </p>
        <div className="hidden md:flex items-center gap-6 text-xs text-[#475569]">
          <span className="flex items-center gap-1.5"><Headphones className="w-3.5 h-3.5" /> Support</span>
          <span className="flex items-center gap-1.5"><Phone className="w-3.5 h-3.5" /> +91 8089272211</span>
        </div>
      </div>
    </div>
  );
}


/* ─── Hero Section ───────────────────────────────────────────── */

function HeroSection() {
  return (
    <section id="home" className="max-w-7xl mx-auto px-4 sm:px-6 lg:pl-8 lg:pr-0 pt-14 pb-6 lg:pt-16 lg:pb-6">
      <div className="grid lg:grid-cols-[1fr_2fr] gap-10 lg:gap-0 items-stretch">

        {/* Content — always first in DOM = first on mobile */}
        <div className="flex flex-col justify-center pr-0 lg:pr-8">
          <div className="hero-fade-up hero-d1 inline-flex items-center gap-2 bg-white border border-coral-300 rounded-full px-4 py-1.5 text-sm font-medium text-coral-500 mb-6 w-fit">
            <Zap className="w-3.5 h-3.5 text-[#C76D64]" /> Build. Learn. Grow.
          </div>

          <h1 className="hero-fade-up hero-d2 text-4xl sm:text-5xl font-bold text-[#1E293B] leading-[1.2] tracking-tight mb-5">
            Your Journey from<br />
            Learning to<br />
            <span className="text-[#0D656B]">Career </span>
            <span className="relative inline-block text-[#C76D64]">
              Success
              <svg className="absolute -bottom-1.5 left-0 w-full" viewBox="0 0 160 10" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M2 7 Q40 2 80 7 Q120 12 158 7" stroke="#C76D64" strokeWidth="2.5" strokeLinecap="round" fill="none" />
              </svg>
            </span>
          </h1>

          <p className="hero-fade-up hero-d3 text-[#475569] text-base leading-relaxed mb-7 max-w-sm">
            A structured learning and career development platform that tracks your progress daily,
            provides mentor guidance, and helps you build real-world skills and projects.
          </p>

          <div className="hero-fade-up hero-d4 flex flex-wrap gap-3 mb-8">
            <Link to="/register" className="btn-pulse inline-flex items-center gap-2 bg-[#CA6357] hover:bg-[#b85548] text-white font-semibold px-6 py-3 rounded-xl transition-colors text-sm">
              Get Started Now <ArrowRight className="w-4 h-4" />
            </Link>
            <a href="#contact" className="inline-flex items-center gap-2 border-2 border-[#EEC8C6] text-[#C76D64] font-semibold px-6 py-3 rounded-xl hover:bg-coral-100 transition-colors text-sm">
              Talk to Us <Phone className="w-4 h-4 text-[#C76D64]" />
            </a>
          </div>

          <div className="w-fit">
            <div className="flex items-center gap-2 mb-2">
              <span className="w-2 h-2 rounded-full bg-[#C76D64] animate-pulse" />
              <p className="text-sm font-semibold text-[#1E293B]">Enrolling Now</p>
              <span className="text-xs text-[#94A3B8]">• Small batches · personalised attention</span>
            </div>
            <div className="w-48 h-2 bg-[#FBEFEE] rounded-full overflow-hidden">
              <div className="enroll-fill h-full bg-[#C76D64] rounded-full" />
            </div>
          </div>
        </div>

        {/* Image — order-last keeps it below content on mobile */}
        <div className="order-last relative min-h-[340px] lg:min-h-[520px] flex items-center justify-center">
          <img
            src="/hero-image-4.png"
            alt="Learn to code at Eonix Academy"
            className="hero-fade-in hero-d2 relative w-[90%] h-full object-contain lg:rounded-l-3xl lg:rounded-r-none z-10 mx-auto"
            draggable="false"
          />
          <div className="absolute bottom-32 left-1/2 -translate-x-1/2 bg-white rounded-2xl px-4 py-3 z-20 shadow-xl" style={{ animation: 'float 3s ease-in-out infinite' }}>
            <p className="text-[10px] text-[#94A3B8] mb-1 font-medium">Consistency Streak</p>
            <p className="text-sm font-bold text-[#1E293B] flex items-center gap-1.5">
              <Flame className="w-4 h-4 text-orange-400" /> 12 Days
            </p>
          </div>
        </div>

      </div>
    </section>
  );
}

/* ─── Features Strip ─────────────────────────────────────────── */

const FEATURES = [
  { icon: BarChart2, label: 'Daily Progress', sub: 'Tracking', color: 'text-[#065E60]', bg: 'bg-[#EBF4F2]' },
  { icon: Users,     label: 'Mentor',         sub: 'Guidance', color: 'text-[#DE7573]', bg: 'bg-[#FDEFEE]' },
  { icon: Code2,     label: 'Real Projects',  sub: '',         color: 'text-[#855EE2]', bg: 'bg-[#F2EEFD]' },
  { icon: Briefcase, label: 'Career',         sub: 'Focused',  color: 'text-[#FE8B1A]', bg: 'bg-[#FEF1E8]' },
];

function FeaturesStrip() {
  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 pb-4">
      <div className="bg-white rounded-2xl flex flex-wrap md:flex-nowrap items-center" style={{ boxShadow: '0 4px 24px 0 rgba(0,0,0,0.10)' }}>
        {FEATURES.map(({ icon: Icon, label, sub, color, bg }, i) => (
          <>
            <div key={label} className="flex items-center justify-center gap-3 flex-1 px-6 py-5">
              <div className={`w-14 h-14 rounded-full ${bg} flex items-center justify-center flex-shrink-0`}>
                <Icon className={`w-7 h-7 ${color}`} />
              </div>
              <div>
                <p className="text-sm font-semibold text-[#1E293B]">{label}</p>
                {sub && <p className="text-xs text-[#94A3B8]">{sub}</p>}
              </div>
            </div>
            {i < FEATURES.length - 1 && (
              <div key={`divider-${i}`} className="hidden md:block w-0.5 h-8 bg-[#FBEFEE] flex-shrink-0" />
            )}
          </>
        ))}
      </div>
    </section>
  );
}

/* ─── Floating WhatsApp ──────────────────────────────────────── */

function FloatingWhatsApp() {
  return (
    <a
      href="https://wa.me/918089272211"
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat on WhatsApp"
      className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full flex items-center justify-center shadow-2xl transition-transform duration-300 hover:scale-110"
      style={{ backgroundColor: '#25D366' }}
    >
      <svg viewBox="0 0 24 24" className="w-7 h-7 fill-white">
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
      </svg>
    </a>
  );
}
