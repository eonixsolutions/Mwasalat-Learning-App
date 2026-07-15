import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowRight, Route as RouteIcon, ClipboardCheck, GraduationCap, ShieldCheck,
  Clock, Users, Video, PlayCircle, Facebook, Twitter, Instagram, MapPin,
} from 'lucide-react';
import Button from '../../components/ui/Button.jsx';
import Badge from '../../components/ui/Badge.jsx';
import { cn } from '../../utils/cn.js';
import { useMwasalatAuthStore } from '../../store/mwasalatAuthStore.js';
import { MWASALAT_ROLE_DASHBOARD } from '../../constants/mwasalatRoles.js';
import { mwasalatProgramService } from '../../services/mwasalatProgram.service.js';

const JOURNEY_STOPS = [
  { label: 'Enroll', icon: RouteIcon },
  { label: 'Learn', icon: PlayCircle },
  { label: 'Assess', icon: ClipboardCheck },
  { label: 'Certify', icon: GraduationCap },
];

const DELIVERY_META = {
  self_paced: { label: 'Self-paced', icon: PlayCircle },
  classroom: { label: 'Classroom', icon: Users },
  virtual: { label: 'Virtual', icon: Video },
};

// Fallback filler — shown only to pad out the section when there aren't
// enough real published courses yet, so the landing page doesn't look bare.
const DUMMY_PROGRAMS = [
  {
    title: 'Defensive Driving Fundamentals',
    delivery: 'classroom',
    duration: '3 Days',
    price: 'OMR 45',
    blurb: 'Practical, instructor-led techniques for safe driving in real road conditions.',
  },
  {
    title: 'Passenger Safety & Emergency Response',
    delivery: 'virtual',
    duration: '6 Hours',
    price: 'OMR 25',
    blurb: 'Live sessions covering evacuation procedures, first aid basics, and incident reporting.',
  },
  {
    title: 'Fleet Vehicle Maintenance Basics',
    delivery: 'self_paced',
    duration: '4 Hours',
    price: 'OMR 15',
    blurb: 'Learn routine inspection and upkeep procedures at your own pace.',
  },
  {
    title: 'Customer Service Excellence',
    delivery: 'self_paced',
    duration: '2 Hours',
    price: 'OMR 10',
    blurb: "Deliver consistent, professional service at every passenger touchpoint.",
  },
  {
    title: 'Route Planning & Logistics',
    delivery: 'classroom',
    duration: '2 Days',
    price: 'OMR 35',
    blurb: "Plan efficient, compliant routes across Oman's transport network.",
  },
  {
    title: 'Workplace Health & Safety Compliance',
    delivery: 'virtual',
    duration: '3 Hours',
    price: 'OMR 20',
    blurb: "Stay current with Oman's occupational safety standards.",
  },
];

function useScrollReveal() {
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) entry.target.classList.add('revealed');
        });
      },
      { threshold: 0.1 }
    );
    document.querySelectorAll('[data-reveal], [data-stagger]').forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);
}

function Header() {
  const { isAuthenticated, user } = useMwasalatAuthStore();

  const scrollToTop = (e) => {
    if (window.location.pathname === '/mwasalat') {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <header className="sticky top-0 z-30 bg-white/90 backdrop-blur border-b border-[#E2E8F0]">
      <div className="max-w-7xl mx-auto px-6 lg:px-8 h-16 flex items-center justify-between">
        <Link to="/mwasalat" onClick={scrollToTop} className="flex items-center">
          <img src="/mwasalat-logo.png" alt="Mwasalat" className="h-10 w-auto object-contain" />
        </Link>

        <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-[#475569]">
          <a href="#home" onClick={scrollToTop} className="hover:text-tealBrand-500 transition-colors">Home</a>
          <a href="#about" className="hover:text-tealBrand-500 transition-colors">About</a>
          <a href="#programs" className="hover:text-tealBrand-500 transition-colors">Programs</a>
          {/* <a href="#journey" className="hover:text-tealBrand-500 transition-colors">How it works</a> */}
        </nav>

        <div className="flex items-center gap-3">
          {isAuthenticated && user ? (
            <Link
              to={MWASALAT_ROLE_DASHBOARD[user.role] || '/mwasalat'}
              className="flex items-center gap-2.5 pl-1.5 pr-3.5 py-1.5 rounded-full border border-[#E2E8F0] hover:border-tealBrand-300 transition-colors"
            >
              <div className="w-7 h-7 rounded-full bg-tealBrand-500 flex items-center justify-center text-white text-xs font-semibold flex-shrink-0">
                {user.name?.[0] ?? 'U'}
              </div>
              <span className="text-sm font-medium text-[#1E293B]">{user.name}</span>
            </Link>
          ) : (
            <Link to="/mwasalat/login">
              <Button variant="secondary" size="sm">Sign in</Button>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}

function HeroSection() {
  const { isAuthenticated, user } = useMwasalatAuthStore();

  return (
    <section id="home" className="relative overflow-hidden bg-white ">
      <div className="max-w-7xl mx-auto px-6 lg:px-8 pt-16 pb-10 lg:pt-16 lg:pb-16 grid lg:grid-cols-2 gap-14 items-center flex-1 content-center">
        <div>
          <span className="hero-fade-up hero-d1 inline-block text-xs font-semibold tracking-[0.14em] text-coral-600 uppercase mb-5">
            Mwasalat Training platform
          </span>
          <h1 className="hero-fade-up hero-d2 font-display text-4xl sm:text-5xl lg:text-[3.25rem] font-semibold text-[#1E293B] leading-[1.08] tracking-tight">
            One standard.<br />
            Every department.<br />
            <span className="text-tealBrand-500">Safer roads, better transport.</span>
          </h1>
          {/* <p className="hero-fade-up hero-d3 mt-6 text-base sm:text-lg text-[#475569] max-w-lg leading-relaxed">
            Standardised training for every role across Mwasalat — self-paced lessons,
            classroom sessions, and live virtual classes, all on one platform.
          </p> */}
          <div className="hero-fade-up hero-d4 mt-8 flex flex-wrap items-center gap-4">
            <a href="#programs">
              <Button variant="primary" size="lg" className="btn-pulse gap-2">
                Browse Programs <ArrowRight className="w-4 h-4" />
              </Button>
            </a>
            {isAuthenticated && user ? (
              <Link to={MWASALAT_ROLE_DASHBOARD[user.role] || '/mwasalat'}>
                <Button variant="outline" size="lg">Go to Dashboard</Button>
              </Link>
            ) : (
              <Link to="/mwasalat/login">
                <Button variant="outline" size="lg">Sign in</Button>
              </Link>
            )}
          </div>
        </div>

        <div className="hero-fade-in hero-d3">
          <JourneyLine />
        </div>
      </div>

      <MissionBand />
    </section>
  );
}

function JourneyLine() {
  return (
    <div id="journey" className="relative bg-tealBrand-100/60 rounded-2xl p-8 lg:p-10">
      <p className="text-xs font-semibold tracking-[0.14em] text-tealBrand-500 uppercase mb-8">
        The learning route
      </p>
      <div className="relative">
        <svg
          viewBox="0 0 320 40"
          className="absolute top-[18px] left-0 w-full h-auto"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <path
            d="M 10 20 Q 110 -10, 160 20 T 310 20"
            fill="none"
            stroke="#5FA3A8"
            strokeWidth="2.5"
            strokeDasharray="1 10"
            strokeLinecap="round"
          />
        </svg>
        <div className="relative grid grid-cols-4 gap-2">
          {JOURNEY_STOPS.map(({ label, icon: Icon }, i) => (
            <div key={label} className="flex flex-col items-center text-center">
              <span
                className={cn(
                  'w-9 h-9 rounded-full flex items-center justify-center border-2 border-tealBrand-100 shadow-sm',
                  i === 0 ? 'bg-coral-500' : 'bg-tealBrand-500'
                )}
              >
                <Icon className="w-4 h-4 text-white" strokeWidth={2.25} />
              </span>
              <span className="mt-3 text-xs font-medium text-[#1E293B]">{label}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="mt-10 grid grid-cols-3 gap-4">
        {[
          { icon: Users, label: 'Roles covered', value: 'All departments' },
          { icon: ShieldCheck, label: 'Compliance', value: 'Oman standard' },
          { icon: GraduationCap, label: 'Certification', value: 'On completion' },
        ].map(({ icon: Icon, label, value }) => (
          <div key={label} className="flex flex-col gap-1.5">
            <Icon className="w-4 h-4 text-tealBrand-400" strokeWidth={2} />
            <span className="text-[11px] text-[#94A3B8] leading-tight">{label}</span>
            <span className="text-xs font-semibold text-[#1E293B] leading-tight">{value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function MissionBand() {
  return (
    <div className="bg-tealBrand-500">
      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-5">
        <p className="text-center text-sm sm:text-base text-tealBrand-100 font-medium">
          "Delivering standardised training across every department — one goal, one standard,
          safer roads and better transport."
        </p>
      </div>
    </div>
  );
}

function ProgramCard({ program }) {
  const meta = DELIVERY_META[program.delivery];
  const Icon = meta.icon;
  const navigate = useNavigate();

  const handleEnroll = () => {
    navigate('/mwasalat/login');
  };

  return (
    <div data-reveal className="card card-hover p-5 flex flex-col">
      <Badge variant="primary" className="self-start gap-1.5 !bg-tealBrand-100 !text-tealBrand-500">
        <Icon className="w-3.5 h-3.5" strokeWidth={2.25} />
        {meta.label}
      </Badge>
      <h3 className="mt-3.5 font-display text-base font-semibold text-[#1E293B] leading-snug">
        {program.title}
      </h3>
      <p className="mt-2 text-sm text-[#475569] leading-relaxed flex-1">{program.blurb}</p>
      <div className="mt-5 flex items-center justify-between">
        <span className="inline-flex items-center gap-1.5 text-xs text-[#94A3B8]">
          <Clock className="w-3.5 h-3.5" />
          {program.duration}
        </span>
        <span className="font-display font-semibold text-coral-600">{program.price}</span>
      </div>
      <Button variant="primary" size="sm" className="mt-4 w-full" onClick={handleEnroll}>
        Enroll Now
      </Button>
    </div>
  );
}

const MIN_PROGRAMS_SHOWN = 6;

function deliveryFromContentTypes(contentTypes = []) {
  if (contentTypes.includes('ilt')) return 'classroom';
  if (contentTypes.includes('live')) return 'virtual';
  return 'self_paced';
}

function ProgramsSection() {
  // Starts with the dummy set so the section isn't empty while the real
  // courses are still loading, then swaps in real ones (padded with dummy
  // filler only if there aren't enough real courses yet) once fetched.
  const [programs, setPrograms] = useState(DUMMY_PROGRAMS);

  useEffect(() => {
    mwasalatProgramService.listPublic()
      .then((realPrograms) => {
        const mapped = realPrograms.map((p) => ({
          key: p._id,
          title: p.title,
          delivery: deliveryFromContentTypes(p.contentTypes),
          duration: p.duration || '—',
          price: p.price > 0 ? `OMR ${p.price}` : 'Free',
          blurb: p.description || 'Standardised training delivered by Mwasalat instructors.',
        }));
        const filler = mapped.length < MIN_PROGRAMS_SHOWN
          ? DUMMY_PROGRAMS.slice(0, MIN_PROGRAMS_SHOWN - mapped.length)
          : [];
        setPrograms([...mapped, ...filler]);
      })
      .catch(() => {});
  }, []);

  return (
    <section id="programs" className="bg-[#F8F9FB]">
      <div className="max-w-7xl mx-auto px-8 lg:px-16 py-20">
        <div data-reveal className="max-w-xl mb-12">
          <span className="text-xs font-semibold tracking-[0.14em] text-coral-600 uppercase">
            Training Programs
          </span>
          <h2 className="mt-3 font-display text-3xl sm:text-4xl font-semibold text-[#1E293B] tracking-tight">
            Build the skills that keep Oman moving
          </h2>
        </div>
        <div data-stagger className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {programs.map((program) => (
            <ProgramCard key={program.key ?? program.title} program={program} />
          ))}
        </div>
      </div>
    </section>
  );
}

function AboutSection() {
  return (
    <section id="about" className="bg-white min-h-screen flex flex-col justify-center">
      <div className="max-w-7xl mx-auto px-8 lg:px-16 py-20 grid lg:grid-cols-2 gap-14 items-center">
        <div>
          <span className="text-xs font-semibold tracking-[0.14em] text-coral-600 uppercase">
            About
          </span>
          <h2 className="mt-3 font-display text-3xl sm:text-4xl font-semibold text-[#1E293B] tracking-tight">
            Mwasalat Learning Platform
          </h2>
          <p className="mt-5 text-base text-[#475569] leading-relaxed max-w-lg">
            Mwasalat Learning Platform delivers standardised, role-based training across every
            department of Mwasalat — from defensive driving and passenger safety to fleet
            maintenance and customer service. Every program follows a single quality standard,
            combining self-paced lessons, classroom sessions, and live virtual classes so
            anyone, staff or public, can build the skills that keep Oman moving safely.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-5">
          {[
            { icon: Users, label: 'Roles covered', value: 'All departments' },
            { icon: ShieldCheck, label: 'Compliance', value: 'Oman standard' },
            { icon: GraduationCap, label: 'Certification', value: 'On completion' },
            { icon: RouteIcon, label: 'Access', value: 'Open to anyone' },
          ].map(({ icon: Icon, label, value }) => (
            <div key={label} className="card p-5">
              <Icon className="w-5 h-5 text-tealBrand-400" strokeWidth={2} />
              <p className="mt-3 text-xs text-[#94A3B8] leading-tight">{label}</p>
              <p className="mt-1 text-sm font-semibold text-[#1E293B] leading-tight">{value}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="bg-[#F1F5F9] border-t border-[#E2E8F0]">
      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-14 grid sm:grid-cols-2 lg:grid-cols-4 gap-10">
        <div>
          <Link to="/mwasalat" className="inline-block">
            <img src="/mwasalat-logo.png" alt="Mwasalat" className="h-9 w-auto object-contain" />
          </Link>
          <p className="mt-4 text-sm text-[#475569] leading-relaxed max-w-xs">
            One goal, one standard, safer roads and better transport — training for every
            department of Mwasalat.
          </p>
        </div>

        <div>
          <p className="text-xs font-semibold tracking-[0.1em] text-[#94A3B8] uppercase mb-4">Programs</p>
          <ul className="space-y-2.5 text-sm text-[#475569]">
            <li><a href="#programs" className="hover:text-tealBrand-500">Classroom training</a></li>
            <li><a href="#programs" className="hover:text-tealBrand-500">Virtual sessions</a></li>
            <li><a href="#programs" className="hover:text-tealBrand-500">Self-paced courses</a></li>
          </ul>
        </div>

        <div>
          <p className="text-xs font-semibold tracking-[0.1em] text-[#94A3B8] uppercase mb-4">Platform</p>
          <ul className="space-y-2.5 text-sm text-[#475569]">
            <li><a href="#journey" className="hover:text-tealBrand-500">How it works</a></li>
            <li><Link to="/mwasalat/login" className="hover:text-tealBrand-500">Sign in</Link></li>
          </ul>
        </div>

        <div>
          <p className="text-xs font-semibold tracking-[0.1em] text-[#94A3B8] uppercase mb-4">Contact</p>
          <p className="flex items-center gap-2 text-sm text-[#475569] mb-4">
            <MapPin className="w-4 h-4 text-tealBrand-400" />
            Muscat, Sultanate of Oman
          </p>
          <div className="flex items-center gap-3">
            {[Facebook, Twitter, Instagram].map((Icon, i) => (
              <a
                key={i}
                href="#"
                className="w-8 h-8 rounded-full bg-white border border-[#E2E8F0] flex items-center justify-center text-[#475569] hover:text-tealBrand-500 hover:border-tealBrand-200 transition-colors"
              >
                <Icon className="w-4 h-4" />
              </a>
            ))}
          </div>
        </div>
      </div>
      <div className="border-t border-[#E2E8F0]">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-5 text-xs text-[#94A3B8] text-center">
          © {new Date().getFullYear()} Mwasalat Learning Platform. Built by Eonix Solutions.
        </div>
      </div>
    </footer>
  );
}

export default function MwasalatLandingPage() {
  useScrollReveal();

  return (
    <div className="min-h-screen bg-white">
      <Header />
      <HeroSection />
      <AboutSection />
      <ProgramsSection />
      <Footer />
    </div>
  );
}
