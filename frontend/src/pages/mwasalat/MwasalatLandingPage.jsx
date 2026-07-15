import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowRight, ArrowUpRight, ClipboardCheck, GraduationCap, ShieldCheck,
  Clock, Users, Video, PlayCircle, Facebook, Twitter, Instagram, MapPin,
  Route as RouteIcon, Sparkles, BadgeCheck, Quote, BookOpen,
} from 'lucide-react';
import { cn } from '../../utils/cn.js';
import { useMwasalatAuthStore } from '../../store/mwasalatAuthStore.js';
import { MWASALAT_ROLE_DASHBOARD } from '../../constants/mwasalatRoles.js';
import { mwasalatProgramService } from '../../services/mwasalatProgram.service.js';

// Departments the real Mwasalat organization trains across — used for the
// marquee strip and the "who it's for" grid. Content describes THIS
// learning platform, not the operating company's live services.
const DEPARTMENTS = [
  'Bus Operations', 'Passenger Safety', 'Fleet Maintenance', 'Customer Service',
  'Route Planning', 'Compliance & HSE', 'Ferry Operations', 'Driver Training',
];

const JOURNEY_STEPS = [
  { n: '01', label: 'Enroll', desc: 'Pick a program built for your role and get instant access.', icon: RouteIcon },
  { n: '02', label: 'Learn', desc: 'Self-paced reading, on-demand video, classroom sessions, or live virtual classes.', icon: PlayCircle },
  { n: '03', label: 'Assess', desc: 'Prove what you know with role-specific assessments.', icon: ClipboardCheck },
  { n: '04', label: 'Certify', desc: 'Earn a certificate recognized across every department.', icon: GraduationCap },
];

const STATS = [
  { value: '4', label: 'Ways to learn' },
  { value: '100%', label: 'Standardised curriculum' },
  { value: '24/7', label: 'Open to everyone' },
];

// Matches the platform's 4 actual content types (backend CONTENT_TYPES:
// pdf, recording, live, ilt) — kept distinct rather than collapsed, so the
// landing page count matches what's really offered.
const DELIVERY_META = {
  pdf: { label: 'Self-paced', icon: BookOpen },
  recording: { label: 'On-demand video', icon: PlayCircle },
  live: { label: 'Live virtual', icon: Video },
  ilt: { label: 'Classroom', icon: Users },
};

// Fallback filler — shown only to pad out the section when there aren't
// enough real published courses yet, so the landing page doesn't look bare.
const DUMMY_PROGRAMS = [
  {
    title: 'Defensive Driving Fundamentals',
    delivery: 'ilt',
    duration: '3 Days',
    price: 'OMR 45',
    blurb: 'Practical, instructor-led techniques for safe driving in real road conditions.',
  },
  {
    title: 'Passenger Safety & Emergency Response',
    delivery: 'live',
    duration: '6 Hours',
    price: 'OMR 25',
    blurb: 'Live sessions covering evacuation procedures, first aid basics, and incident reporting.',
  },
  {
    title: 'Fleet Vehicle Maintenance Basics',
    delivery: 'pdf',
    duration: '4 Hours',
    price: 'OMR 15',
    blurb: 'Learn routine inspection and upkeep procedures at your own pace.',
  },
  {
    title: 'Customer Service Excellence',
    delivery: 'recording',
    duration: '2 Hours',
    price: 'OMR 10',
    blurb: "Deliver consistent, professional service at every passenger touchpoint.",
  },
  {
    title: 'Route Planning & Logistics',
    delivery: 'ilt',
    duration: '2 Days',
    price: 'OMR 35',
    blurb: "Plan efficient, compliant routes across Oman's transport network.",
  },
  {
    title: 'Workplace Health & Safety Compliance',
    delivery: 'live',
    duration: '3 Hours',
    price: 'OMR 20',
    blurb: "Stay current with Oman's occupational safety standards.",
  },
];

const MIN_PROGRAMS_SHOWN = 6;

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

function deliveryFromContentTypes(contentTypes = []) {
  if (contentTypes.includes('ilt')) return 'ilt';
  if (contentTypes.includes('live')) return 'live';
  if (contentTypes.includes('recording')) return 'recording';
  return 'pdf';
}

// Abstract "road network" mark echoing Mwasalat's real logo — converging
// lines radiating from a single point, animated in on first paint.
function RoadNetworkMark({ className }) {
  return (
    <svg viewBox="0 0 200 200" className={className} fill="none" aria-hidden="true">
      {[
        'M100 100 L100 10', 'M100 100 L165 35', 'M100 100 L190 100',
        'M100 100 L165 165', 'M100 100 L100 190', 'M100 100 L35 165',
        'M100 100 L10 100', 'M100 100 L35 35',
      ].map((d, i) => (
        <path
          key={d}
          d={d}
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          className="mwasalat-road-draw"
          style={{ animationDelay: `${i * 90}ms` }}
        />
      ))}
      <circle cx="100" cy="100" r="7" fill="currentColor" />
    </svg>
  );
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
    <header
      className="sticky top-0 z-30"
      style={{ background: '#B31E2E' }}
    >
      <div className="max-w-7xl mx-auto px-6 lg:px-8 h-16 flex items-center justify-between">
        <Link to="/mwasalat" onClick={scrollToTop} className="flex items-center">
          <img src="/mwasalat-logo.png" alt="Mwasalat" className="h-12 w-auto object-contain" />
        </Link>

        <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-white/85">
          <a href="#home" onClick={scrollToTop} className="hover:text-white transition-colors">Home</a>
          <a href="#programs" className="hover:text-white transition-colors">Programs</a>
          <a href="#how-it-works" className="hover:text-white transition-colors">How it works</a>
          <a href="#about" className="hover:text-white transition-colors">About</a>
        </nav>

        <div className="flex items-center gap-3">
          {isAuthenticated && user ? (
            <Link
              to={MWASALAT_ROLE_DASHBOARD[user.role] || '/mwasalat'}
              className="flex items-center gap-2.5 pl-1.5 pr-3.5 py-1.5 rounded-full border border-white/25 hover:border-white/50 transition-colors"
            >
              <div className="w-7 h-7 rounded-full bg-white flex items-center justify-center text-mwasalatRed-600 text-xs font-semibold flex-shrink-0">
                {user.name?.[0] ?? 'U'}
              </div>
              <span className="text-sm font-medium text-white">{user.name}</span>
            </Link>
          ) : (
            <Link
              to="/mwasalat/login"
              className="inline-flex items-center justify-center px-4 py-2 rounded-xl text-sm font-semibold text-mwasalatRed-600 bg-white hover:bg-mwasalatRed-100 transition-colors"
            >
              Sign in
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}

function DepartmentMarquee() {
  const loop = [...DEPARTMENTS, ...DEPARTMENTS];
  return (
    <div className="border-y border-mwasalatInk-100 bg-mwasalatInk-100/40 overflow-hidden">
      <div className="mwasalat-marquee-track flex items-center gap-10 py-3.5 w-max">
        {loop.map((d, i) => (
          <span key={`${d}-${i}`} className="flex items-center gap-2.5 text-xs font-semibold tracking-wide text-mwasalatInk-400 whitespace-nowrap">
            <span className="w-1.5 h-1.5 rounded-full bg-mwasalatRed-500" />
            {d.toUpperCase()}
          </span>
        ))}
      </div>
    </div>
  );
}

function HeroSection() {
  const { isAuthenticated, user } = useMwasalatAuthStore();

  return (
    <section id="home" className="relative overflow-hidden bg-white">
      {/* Header blends downward into the hero instead of cutting off sharply */}
      <div
        className="pointer-events-none absolute top-0 inset-x-0 h-40"
        style={{ background: 'linear-gradient(180deg, #B31E2E 0%, rgba(179,30,46,0.25) 55%, rgba(179,30,46,0) 100%)' }}
      />
      {/* Faint radiating road-network watermark, top-right */}
      <RoadNetworkMark className="mwasalat-drift pointer-events-none absolute -top-16 -right-16 w-[420px] h-[420px] text-mwasalatInk-100 hidden lg:block" />

      <div className="relative max-w-7xl mx-auto px-6 lg:px-8 pt-16 pb-16 lg:pt-20 lg:pb-20 grid lg:grid-cols-2 gap-14 items-center">
        <div>
          <span className="hero-fade-up hero-d1 inline-flex items-center gap-1.5 text-xs font-semibold tracking-[0.14em] text-mwasalatRed-600 uppercase mb-5 bg-mwasalatRed-100 px-3 py-1.5 rounded-full">
            <Sparkles className="w-3.5 h-3.5" /> Open to everyone
          </span>
          <h1 className="hero-fade-up hero-d2 font-display text-4xl sm:text-5xl lg:text-[3.4rem] font-semibold text-mwasalatInk-500 leading-[1.06] tracking-tight">
            One standard.<br />
            <span className="text-mwasalatRed-600">Every learner.</span><br />
            Safer roads, better transport.
          </h1>
          <p className="hero-fade-up hero-d3 mt-6 text-base sm:text-lg text-mwasalatInk-400 max-w-lg leading-relaxed">
            The Mwasalat Learning Platform brings standardised training to every department
            — and to anyone who wants to build these skills. Self-paced lessons, classroom
            sessions, and live virtual classes, all in one place.
          </p>
          <div className="hero-fade-up hero-d4 mt-8 flex flex-wrap items-center gap-4">
            <a href="#programs">
              <button className="mwasalat-cta-pulse inline-flex items-center gap-2 bg-mwasalatRed-500 hover:bg-mwasalatRed-600 active:bg-mwasalatRed-700 text-white font-semibold px-7 py-3 rounded-xl text-sm transition-colors">
                Browse Programs <ArrowRight className="w-4 h-4" />
              </button>
            </a>
            {isAuthenticated && user ? (
              <Link to={MWASALAT_ROLE_DASHBOARD[user.role] || '/mwasalat'}>
                <button className="inline-flex items-center gap-2 border border-mwasalatInk-200 hover:border-mwasalatInk-500 text-mwasalatInk-500 font-semibold px-7 py-3 rounded-xl text-sm transition-colors">
                  Go to Dashboard
                </button>
              </Link>
            ) : (
              <Link to="/mwasalat/login">
                <button className="inline-flex items-center gap-2 border border-mwasalatInk-200 hover:border-mwasalatInk-500 text-mwasalatInk-500 font-semibold px-7 py-3 rounded-xl text-sm transition-colors">
                  Sign in
                </button>
              </Link>
            )}
          </div>

          <div className="hero-fade-up hero-d5 mt-10 flex items-center gap-6">
            {STATS.slice(0, 3).map((s) => (
              <div key={s.label}>
                <p className="font-display text-2xl font-bold text-mwasalatInk-500">{s.value}</p>
                <p className="text-xs text-mwasalatInk-300 mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="hero-fade-in hero-d3">
          <JourneyCard />
        </div>
      </div>

      <DepartmentMarquee />
    </section>
  );
}

function JourneyCard() {
  return (
    <div className="relative bg-mwasalatInk-500 rounded-3xl p-8 lg:p-10 shadow-xl overflow-hidden">
      <RoadNetworkMark className="mwasalat-drift pointer-events-none absolute -bottom-10 -left-10 w-56 h-56 text-white/5" />
      <p className="text-xs font-semibold tracking-[0.14em] text-mwasalatRed-300 uppercase mb-8">
        The learning route
      </p>
      <div className="relative">
        <svg viewBox="0 0 320 40" className="absolute top-[18px] left-0 w-full h-auto" preserveAspectRatio="none" aria-hidden="true">
          <path
            d="M 10 20 Q 110 -10, 160 20 T 310 20"
            fill="none"
            stroke="rgba(255,255,255,0.25)"
            strokeWidth="2.5"
            strokeDasharray="1 10"
            strokeLinecap="round"
          />
        </svg>
        <div className="relative grid grid-cols-4 gap-2">
          {JOURNEY_STEPS.map(({ label, icon: Icon }, i) => (
            <div key={label} className="flex flex-col items-center text-center">
              <span className={cn(
                'w-9 h-9 rounded-full flex items-center justify-center shadow-sm ring-4 ring-mwasalatInk-500',
                i === 0 ? 'bg-mwasalatRed-500' : 'bg-white/15'
              )}>
                <Icon className="w-4 h-4 text-white" strokeWidth={2.25} />
              </span>
              <span className="mt-3 text-xs font-medium text-white">{label}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="mt-10 grid grid-cols-3 gap-4">
        {[
          { icon: Users, label: 'Open to', value: 'Everyone' },
          { icon: ShieldCheck, label: 'Compliance', value: 'Oman standard' },
          { icon: GraduationCap, label: 'Certification', value: 'On completion' },
        ].map(({ icon: Icon, label, value }) => (
          <div key={label} className="flex flex-col gap-1.5">
            <Icon className="w-4 h-4 text-mwasalatRed-300" strokeWidth={2} />
            <span className="text-[11px] text-white/50 leading-tight">{label}</span>
            <span className="text-xs font-semibold text-white leading-tight">{value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function MissionBand() {
  return (
    <div className="relative bg-mwasalatRed-500 overflow-hidden">
      <div className="max-w-4xl mx-auto px-6 lg:px-8 py-10 text-center">
        <Quote className="w-6 h-6 text-white/60 mx-auto mb-3" />
        <p className="text-lg sm:text-xl text-white font-medium leading-snug">
          "Delivering standardised training across every department — one goal, one standard,
          safer roads and better transport."
        </p>
      </div>
    </div>
  );
}

function StatsBand() {
  return (
    <section className="bg-white border-y border-mwasalatInk-100 relative overflow-hidden">
      <div data-stagger className="relative max-w-7xl mx-auto px-6 lg:px-8 py-12 grid grid-cols-1 sm:grid-cols-3">
        {STATS.map((s, i) => (
          <div
            key={s.label}
            className={cn(
              'text-center sm:text-left px-4 py-2',
              i > 0 && 'sm:border-l border-mwasalatInk-100'
            )}
          >
            <p className="font-display text-3xl sm:text-4xl font-bold text-mwasalatRed-600">{s.value}</p>
            <p className="text-xs sm:text-sm text-mwasalatInk-400 mt-1.5">{s.label}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function HowItWorksSection() {
  return (
    <section id="how-it-works" className="bg-white">
      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-20">
        <div data-reveal className="max-w-xl mb-14">
          <span className="text-xs font-semibold tracking-[0.14em] text-mwasalatRed-600 uppercase">
            How it works
          </span>
          <h2 className="mt-3 font-display text-3xl sm:text-4xl font-semibold text-mwasalatInk-500 tracking-tight">
            Four stops on the learning route
          </h2>
        </div>

        <div data-stagger className="relative grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="hidden lg:block absolute top-9 left-[12%] right-[12%] h-px" style={{
            backgroundImage: 'repeating-linear-gradient(90deg, #D9C9CA 0, #D9C9CA 6px, transparent 6px, transparent 14px)',
          }} />
          {JOURNEY_STEPS.map(({ n, label, desc, icon: Icon }) => (
            <div key={n} className="relative">
              <div className="w-[72px] h-[72px] rounded-2xl bg-mwasalatInk-100 flex items-center justify-center mb-5 relative z-10">
                <Icon className="w-7 h-7 text-mwasalatRed-600" strokeWidth={2} />
              </div>
              <span className="text-xs font-bold text-mwasalatInk-200">{n}</span>
              <h3 className="mt-1 font-display text-lg font-semibold text-mwasalatInk-500">{label}</h3>
              <p className="mt-2 text-sm text-mwasalatInk-400 leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function ProgramCard({ program }) {
  const meta = DELIVERY_META[program.delivery];
  const Icon = meta.icon;
  const navigate = useNavigate();

  return (
    <div data-reveal className="card card-hover p-5 flex flex-col">
      <span className="self-start inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-mwasalatInk-100 text-mwasalatInk-500">
        <Icon className="w-3.5 h-3.5" strokeWidth={2.25} />
        {meta.label}
      </span>
      <h3 className="mt-3.5 font-display text-base font-semibold text-mwasalatInk-500 leading-snug">
        {program.title}
      </h3>
      <p className="mt-2 text-sm text-mwasalatInk-400 leading-relaxed flex-1">{program.blurb}</p>
      <div className="mt-5 flex items-center justify-between">
        <span className="inline-flex items-center gap-1.5 text-xs text-mwasalatInk-300">
          <Clock className="w-3.5 h-3.5" />
          {program.duration}
        </span>
        <span className="font-display font-semibold text-mwasalatRed-600">{program.price}</span>
      </div>
      <button
        onClick={() => navigate('/mwasalat/login')}
        className="mt-4 w-full inline-flex items-center justify-center gap-1.5 bg-mwasalatRed-500 hover:bg-mwasalatRed-600 text-white font-semibold px-4 py-2.5 rounded-xl text-sm transition-colors"
      >
        Enroll Now
      </button>
    </div>
  );
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
    <section id="programs" className="bg-mwasalatInk-100/30">
      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-20">
        <div data-reveal className="flex flex-wrap items-end justify-between gap-4 mb-12">
          <div className="max-w-xl">
            <span className="text-xs font-semibold tracking-[0.14em] text-mwasalatRed-600 uppercase">
              Training Programs
            </span>
            <h2 className="mt-3 font-display text-3xl sm:text-4xl font-semibold text-mwasalatInk-500 tracking-tight">
              Build the skills that keep Oman moving
            </h2>
          </div>
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
    <section id="about" className="bg-white">
      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-20 grid lg:grid-cols-2 gap-14 items-center">
        <div data-reveal>
          <span className="text-xs font-semibold tracking-[0.14em] text-mwasalatRed-600 uppercase">
            About
          </span>
          <h2 className="mt-3 font-display text-3xl sm:text-4xl font-semibold text-mwasalatInk-500 tracking-tight">
            Mwasalat Learning Platform
          </h2>
          <p className="mt-5 text-base text-mwasalatInk-400 leading-relaxed max-w-lg">
            Mwasalat Learning Platform delivers standardised, role-based training across every
            department of Mwasalat — from defensive driving and passenger safety to fleet
            maintenance and customer service. Every program follows a single quality standard,
            combining self-paced lessons, classroom sessions, and live virtual classes so
            anyone, staff or public, can build the skills that keep Oman moving safely.
          </p>
          <div className="mt-7 flex items-center gap-2 text-sm font-semibold text-mwasalatRed-600">
            <BadgeCheck className="w-4.5 h-4.5" /> Certified on completion, recognized platform-wide
          </div>
        </div>
        <div data-stagger className="grid grid-cols-2 gap-5">
          {[
            { icon: Users, label: 'Roles covered', value: 'All departments' },
            { icon: ShieldCheck, label: 'Compliance', value: 'Oman standard' },
            { icon: GraduationCap, label: 'Certification', value: 'On completion' },
            { icon: RouteIcon, label: 'Access', value: 'Open to anyone' },
          ].map(({ icon: Icon, label, value }) => (
            <div key={label} className="card p-5">
              <Icon className="w-5 h-5 text-mwasalatRed-600" strokeWidth={2} />
              <p className="mt-3 text-xs text-mwasalatInk-300 leading-tight">{label}</p>
              <p className="mt-1 text-sm font-semibold text-mwasalatInk-500 leading-tight">{value}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function ClosingCta() {
  const { isAuthenticated, user } = useMwasalatAuthStore();

  return (
    <section className="bg-white">
      <div className="max-w-7xl mx-auto px-6 lg:px-8 pb-20">
        <div
          data-reveal
          className="relative overflow-hidden rounded-3xl px-8 py-14 sm:px-14 sm:py-16 text-center"
          style={{ background: 'linear-gradient(135deg, #D6293C 0%, #8C1622 100%)' }}
        >
          <RoadNetworkMark className="pointer-events-none absolute -top-14 -right-14 w-64 h-64 text-white/10" />
          <RoadNetworkMark className="pointer-events-none absolute -bottom-16 -left-16 w-64 h-64 text-white/10" />
          <h2 className="relative font-display text-2xl sm:text-3xl font-semibold text-white tracking-tight">
            Ready to get moving?
          </h2>
          <p className="relative mt-3 text-sm sm:text-base text-white/75 max-w-md mx-auto">
            Join the standard for training across Mwasalat — open to every department, and to you.
          </p>
          <div className="relative mt-8 flex items-center justify-center gap-4 flex-wrap">
            <a href="#programs">
              <button className="inline-flex items-center gap-2 bg-white hover:bg-mwasalatRed-100 text-mwasalatRed-600 font-semibold px-7 py-3 rounded-xl text-sm transition-colors">
                Browse Programs <ArrowUpRight className="w-4 h-4" />
              </button>
            </a>
            {!(isAuthenticated && user) && (
              <Link to="/mwasalat/login">
                <button className="inline-flex items-center gap-2 border border-white/40 hover:border-white text-white font-semibold px-7 py-3 rounded-xl text-sm transition-colors">
                  Sign in
                </button>
              </Link>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="bg-mwasalatInk-500 relative">
      <div className="h-1" style={{ background: 'linear-gradient(90deg, #8C1622, #D6293C, #EFA0AA)' }} />

      <div className="max-w-7xl mx-auto px-6 lg:px-8 pt-14 pb-10">
        <div className="grid lg:grid-cols-[1.3fr_1fr_1fr_1.2fr] gap-10 pb-12 border-b border-white/10">
          <div>
            <Link to="/mwasalat" className="inline-block">
              <img src="/mwasalat-logo.png" alt="Mwasalat" className="h-11 w-auto object-contain" />
            </Link>
            <p className="mt-5 text-sm text-white/55 leading-relaxed max-w-xs">
              One goal, one standard, safer roads and better transport — training open to
              every department of Mwasalat, and to everyone who wants to learn.
            </p>
            <div className="mt-5 flex items-center gap-3">
              {[Facebook, Twitter, Instagram].map((Icon, i) => (
                <a
                  key={i}
                  href="#"
                  className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center text-white/60 hover:text-white hover:bg-mwasalatRed-500 transition-colors"
                >
                  <Icon className="w-4 h-4" />
                </a>
              ))}
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold tracking-[0.1em] text-white/35 uppercase mb-4">Programs</p>
            <ul className="space-y-2.5 text-sm text-white/60">
              <li><a href="#programs" className="hover:text-mwasalatRed-300 transition-colors">Classroom training</a></li>
              <li><a href="#programs" className="hover:text-mwasalatRed-300 transition-colors">Virtual sessions</a></li>
              <li><a href="#programs" className="hover:text-mwasalatRed-300 transition-colors">Self-paced courses</a></li>
            </ul>
          </div>

          <div>
            <p className="text-xs font-semibold tracking-[0.1em] text-white/35 uppercase mb-4">Platform</p>
            <ul className="space-y-2.5 text-sm text-white/60">
              <li><a href="#how-it-works" className="hover:text-mwasalatRed-300 transition-colors">How it works</a></li>
              <li><a href="#about" className="hover:text-mwasalatRed-300 transition-colors">About</a></li>
              <li><Link to="/mwasalat/login" className="hover:text-mwasalatRed-300 transition-colors">Sign in</Link></li>
            </ul>
          </div>

          <div className="bg-white/5 rounded-2xl p-5">
            <p className="text-xs font-semibold tracking-[0.1em] text-white/35 uppercase mb-3">Get in touch</p>
            <p className="flex items-start gap-2.5 text-sm text-white/70 leading-relaxed">
              <MapPin className="w-4 h-4 text-mwasalatRed-400 mt-0.5 flex-shrink-0" />
              Muscat, Sultanate of Oman
            </p>
            <a href="#programs" className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-mwasalatRed-300 hover:text-mwasalatRed-200 transition-colors">
              Explore programs <ArrowUpRight className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>

        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-white/35">
          <span>© {new Date().getFullYear()} Mwasalat Learning Platform. Built by Eonix Solutions.</span>
          <span>Training platform — not affiliated with live Mwasalat transport operations.</span>
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
      <MissionBand />
      <StatsBand />
      <HowItWorksSection />
      <ProgramsSection />
      <AboutSection />
      <ClosingCta />
      <Footer />
    </div>
  );
}
