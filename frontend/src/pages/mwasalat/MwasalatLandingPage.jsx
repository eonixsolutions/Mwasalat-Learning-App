import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  ArrowRight, ArrowUpRight, ClipboardCheck, GraduationCap, ShieldCheck,
  Clock, Users, Video, PlayCircle, Facebook, Twitter, Instagram, MapPin,
  Route as RouteIcon, Sparkles, BadgeCheck, Quote, BookOpen, Star,
} from 'lucide-react';
import { cn } from '../../utils/cn.js';
import { useMwasalatAuthStore } from '../../store/mwasalatAuthStore.js';
import { MWASALAT_ROLE_DASHBOARD } from '../../constants/mwasalatRoles.js';
import { mwasalatProgramService } from '../../services/mwasalatProgram.service.js';
import MwasalatLanguageToggle from '../../components/mwasalat/MwasalatLanguageToggle.jsx';
import { getLocalizedProgramField, localizeNumber } from '../../utils/mwasalatLocalize.js';

// Departments the real Mwasalat organization trains across — used for the
// marquee strip and the "who it's for" grid. Content describes THIS
// learning platform, not the operating company's live services.
// Ids resolve through the `departments.*` translation keys.
const DEPARTMENT_IDS = [
  'busOperations', 'passengerSafety', 'fleetMaintenance', 'customerService',
  'routePlanning', 'complianceHse', 'ferryOperations', 'driverTraining',
];

const JOURNEY_STEPS = [
  { id: 'enroll', n: '01', icon: RouteIcon },
  { id: 'learn', n: '02', icon: PlayCircle },
  { id: 'assess', n: '03', icon: ClipboardCheck },
  { id: 'certify', n: '04', icon: GraduationCap },
];

const STATS = [
  { id: 'waysToLearn', value: '4' },
  { id: 'standardisedCurriculum', value: '100%' },
  { id: 'openToEveryone', value: '24/7' },
];

// Matches the platform's 4 actual content types (backend CONTENT_TYPES:
// pdf, recording, live, ilt) — kept distinct rather than collapsed, so the
// landing page count matches what's really offered.
const DELIVERY_META = {
  pdf: { icon: BookOpen },
  recording: { icon: PlayCircle },
  live: { icon: Video },
  ilt: { icon: Users },
};

// Fallback filler — shown only to pad out the section when there aren't
// enough real published courses yet, so the landing page doesn't look bare.
// title/duration/blurb resolve through `programs.dummy.<id>` translation keys.
const DUMMY_PROGRAMS = [
  { id: 'defensiveDriving', delivery: 'ilt', price: 'OMR 45' },
  { id: 'passengerSafety', delivery: 'live', price: 'OMR 25' },
  { id: 'fleetMaintenance', delivery: 'pdf', price: 'OMR 15' },
  { id: 'customerService', delivery: 'recording', price: 'OMR 10' },
  { id: 'routePlanning', delivery: 'ilt', price: 'OMR 35' },
  { id: 'workplaceSafety', delivery: 'live', price: 'OMR 20' },
];

// The Programs section is a teaser, not the full catalog — it's both the
// floor (pad with dummy filler below this) and the ceiling (never render
// more real courses than this, however many are published) so the grid
// stays a clean 2-row layout regardless of catalog size. The full list
// lives behind the "Explore All Courses" CTA -> the real catalog page.
const PROGRAMS_DISPLAY_COUNT = 6;

// Only learner-facing roles have an access flow for /learner/* — any other
// already-authenticated role (staff who opened the public marketing page)
// falls back to their own dashboard instead of a course URL they can't use.
const LEARNER_ROLES = ['learner', 'external_learner'];

// Routes an "Enroll"/"Explore" click through auth: signed-in learners go
// straight to the target, other signed-in roles fall back to their own
// dashboard, and signed-out visitors go through /login with the intended
// destination preserved in state so it isn't lost after sign-in.
function goToLearnerDestination(navigate, { isAuthenticated, user }, targetPath) {
  if (isAuthenticated && user) {
    navigate(LEARNER_ROLES.includes(user.role) ? targetPath : (MWASALAT_ROLE_DASHBOARD[user.role] || '/'));
    return;
  }
  navigate('/login', { state: { redirectTo: targetPath } });
}

// Sample learner voices, one per department — resolve through
// `testimonials.items.<id>.*` translation keys. Auto-rotates on a timer with
// dot navigation for manual control, matching the DUMMY_PROGRAMS pattern:
// representative content, not claims about specific real individuals.
const TESTIMONIAL_IDS = [
  'busOperations', 'passengerSafety', 'fleetMaintenance', 'customerService', 'routePlanning',
];
const TESTIMONIAL_ROTATE_MS = 6000;

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
    const observeAll = () => {
      document.querySelectorAll('[data-reveal], [data-stagger]').forEach((el) => observer.observe(el));
    };
    observeAll();

    // Real programs replace the dummy placeholder cards once they've loaded —
    // that swap mounts brand-new DOM nodes after the scan above already ran,
    // so without this they'd never get observed and would stay invisible
    // (opacity: 0 forever), showing up as a blank gap where Programs should be.
    const mutationObserver = new MutationObserver(observeAll);
    mutationObserver.observe(document.body, { childList: true, subtree: true });

    return () => {
      observer.disconnect();
      mutationObserver.disconnect();
    };
  }, []);
}

function deliveryFromContentTypes(contentTypes = []) {
  if (contentTypes.includes('ilt')) return 'ilt';
  if (contentTypes.includes('live')) return 'live';
  if (contentTypes.includes('recording')) return 'recording';
  return 'pdf';
}

// Abstract "road network" mark echoing Mwasalat's real logo — converging
// lines radiating from a single point, animated in on first paint. The
// 8-way radiating pattern is rotationally symmetric, so it needs no RTL
// mirroring of its own — only its corner position (via start/end) does.
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
  const { t } = useTranslation('mwasalatLanding');
  const { isAuthenticated, user } = useMwasalatAuthStore();

  const scrollToTop = (e) => {
    if (window.location.pathname === '/') {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <header
      className="sticky top-0 z-30"
      style={{ background: '#B31E2E' }}
    >
      <div className="max-w-7xl mx-auto px-6 lg:px-8 h-24 flex items-center justify-between">
        <Link to="/" onClick={scrollToTop} className="flex items-center">
          <img src="/mwasalat-logo.png" alt="Mwasalat" className="h-20 w-auto object-contain" />
        </Link>

        <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-white/85">
          <a href="#home" onClick={scrollToTop} className="hover:text-white transition-colors">{t('nav.home')}</a>
          <a href="#programs" className="hover:text-white transition-colors">{t('nav.programs')}</a>
          <a href="#how-it-works" className="hover:text-white transition-colors">{t('nav.howItWorks')}</a>
          <a href="#about" className="hover:text-white transition-colors">{t('nav.about')}</a>
        </nav>

        <div className="flex items-center gap-3">
          <MwasalatLanguageToggle />
          {isAuthenticated && user ? (
            <Link
              to={MWASALAT_ROLE_DASHBOARD[user.role] || '/'}
              className="flex items-center gap-2.5 ps-1.5 pe-3.5 py-1.5 rounded-full border border-white/25 hover:border-white/50 transition-colors"
            >
              <div className="w-7 h-7 rounded-full bg-white flex items-center justify-center text-mwasalatRed-600 text-xs font-semibold flex-shrink-0">
                {user.name?.[0] ?? 'U'}
              </div>
              <span className="text-sm font-medium text-white">{user.name}</span>
            </Link>
          ) : (
            <Link
              to="/login"
              className="inline-flex items-center justify-center px-4 py-2 rounded-xl text-sm font-semibold text-mwasalatRed-600 bg-white hover:bg-mwasalatRed-100 transition-colors"
            >
              {t('nav.signIn')}
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}

function DepartmentMarquee() {
  const { t } = useTranslation('mwasalatLanding');
  const loop = [...DEPARTMENT_IDS, ...DEPARTMENT_IDS];
  return (
    <div className="border-y border-mwasalatInk-100 bg-mwasalatInk-100/40 overflow-hidden">
      <div className="mwasalat-marquee-track flex items-center gap-10 py-3.5 w-max">
        {loop.map((id, i) => (
          <span key={`${id}-${i}`} className="flex items-center gap-2.5 text-xs font-semibold tracking-wide text-mwasalatInk-400 whitespace-nowrap">
            <span className="w-1.5 h-1.5 rounded-full bg-mwasalatRed-500" />
            {t(`departments.${id}`).toUpperCase()}
          </span>
        ))}
      </div>
    </div>
  );
}

function HeroSection() {
  const { t, i18n } = useTranslation('mwasalatLanding');
  const { isAuthenticated, user } = useMwasalatAuthStore();

  return (
    <section id="home" className="relative overflow-hidden bg-white">
      {/* Header blends downward into the hero instead of cutting off sharply */}
      <div
        className="pointer-events-none absolute top-0 inset-x-0 h-40"
        style={{ background: 'linear-gradient(180deg, #B31E2E 0%, rgba(179,30,46,0.25) 55%, rgba(179,30,46,0) 100%)' }}
      />
      {/* Faint radiating road-network watermark — anchored to the inline-end
          corner (right in LTR, left in RTL) via logical positioning */}
      <RoadNetworkMark className="mwasalat-drift pointer-events-none absolute -top-16 -end-16 w-[420px] h-[420px] text-mwasalatInk-100 hidden lg:block" />

      <div className="relative max-w-7xl mx-auto px-6 lg:px-8 pt-16 pb-16 lg:pt-20 lg:pb-20 grid lg:grid-cols-2 gap-14 items-center min-h-[calc(100dvh-6rem)]">
        <div>
          <span className="hero-fade-up hero-d1 inline-flex items-center gap-1.5 text-xs font-semibold tracking-[0.14em] text-mwasalatRed-600 uppercase mb-5 bg-mwasalatRed-100 px-3 py-1.5 rounded-full">
            <Sparkles className="w-3.5 h-3.5" /> {t('hero.badge')}
          </span>
          <h1 className="hero-fade-up hero-d2 font-display text-4xl sm:text-5xl lg:text-[3.4rem] font-semibold text-mwasalatInk-500 leading-[1.06] tracking-tight">
            {t('hero.titleLine1')}<br />
            <span className="text-mwasalatRed-600">{t('hero.titleLine2')}</span><br />
            {t('hero.titleLine3')}
          </h1>
          <p className="hero-fade-up hero-d3 mt-6 text-base sm:text-lg text-mwasalatInk-400 max-w-lg leading-relaxed">
            {t('hero.subtitle')}
          </p>
          <div className="hero-fade-up hero-d4 mt-8 flex flex-wrap items-center gap-4">
            <a href="#programs">
              <button className="mwasalat-cta-pulse inline-flex items-center gap-2 bg-mwasalatRed-500 hover:bg-mwasalatRed-600 active:bg-mwasalatRed-700 text-white font-semibold px-7 py-3 rounded-xl text-sm transition-colors">
                {t('hero.browsePrograms')} <ArrowRight className="w-4 h-4 rtl:rotate-180" />
              </button>
            </a>
            {isAuthenticated && user ? (
              <Link to={MWASALAT_ROLE_DASHBOARD[user.role] || '/'}>
                <button className="inline-flex items-center gap-2 border border-mwasalatInk-200 hover:border-mwasalatInk-500 text-mwasalatInk-500 font-semibold px-7 py-3 rounded-xl text-sm transition-colors">
                  {t('hero.goToDashboard')}
                </button>
              </Link>
            ) : (
              <Link to="/login">
                <button className="inline-flex items-center gap-2 border border-mwasalatInk-200 hover:border-mwasalatInk-500 text-mwasalatInk-500 font-semibold px-7 py-3 rounded-xl text-sm transition-colors">
                  {t('hero.signIn')}
                </button>
              </Link>
            )}
          </div>

          <div className="hero-fade-up hero-d5 mt-10 flex items-center gap-6">
            {STATS.slice(0, 3).map((s) => (
              <div key={s.id}>
                <p className="font-display text-2xl font-bold text-mwasalatInk-500">{localizeNumber(s.value, i18n.language)}</p>
                <p className="text-xs text-mwasalatInk-300 mt-0.5">{t(`stats.${s.id}`)}</p>
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
  const { t } = useTranslation('mwasalatLanding');
  return (
    <div className="relative bg-mwasalatInk-500 rounded-3xl p-8 lg:p-10 shadow-xl overflow-hidden">
      <RoadNetworkMark className="mwasalat-drift pointer-events-none absolute -bottom-10 -start-10 w-56 h-56 text-white/5" />
      <p className="text-xs font-semibold tracking-[0.14em] text-mwasalatRed-300 uppercase mb-8">
        {t('journey.route')}
      </p>
      <div className="relative">
        <svg viewBox="0 0 320 40" className="absolute top-[18px] start-0 w-full h-auto rtl:scale-x-[-1]" preserveAspectRatio="none" aria-hidden="true">
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
          {JOURNEY_STEPS.map(({ id, icon: Icon }, i) => (
            <div key={id} className="flex flex-col items-center text-center">
              <span className={cn(
                'w-9 h-9 rounded-full flex items-center justify-center shadow-sm ring-4 ring-mwasalatInk-500',
                i === 0 ? 'bg-mwasalatRed-500' : 'bg-white/15'
              )}>
                <Icon className="w-4 h-4 text-white" strokeWidth={2.25} />
              </span>
              <span className="mt-3 text-xs font-medium text-white">{t(`journey.steps.${id}.label`)}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="mt-10 grid grid-cols-3 gap-4">
        {[
          { icon: Users, label: t('journey.openTo'), value: t('journey.everyone') },
          { icon: ShieldCheck, label: t('journey.compliance'), value: t('journey.omanStandard') },
          { icon: GraduationCap, label: t('journey.certification'), value: t('journey.onCompletion') },
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
  const { t } = useTranslation('mwasalatLanding');
  return (
    <div className="relative bg-mwasalatRed-500 overflow-hidden">
      <div className="max-w-4xl mx-auto px-6 lg:px-8 py-10 text-center">
        <Quote className="w-6 h-6 text-white/60 mx-auto mb-3" />
        <p className="text-lg sm:text-xl text-white font-medium leading-snug">
          {t('mission.quote')}
        </p>
      </div>
    </div>
  );
}

function StatsBand() {
  const { t, i18n } = useTranslation('mwasalatLanding');
  return (
    <section className="bg-white border-y border-mwasalatInk-100 relative overflow-hidden">
      <div data-stagger className="relative max-w-7xl mx-auto px-6 lg:px-8 py-12 grid grid-cols-1 sm:grid-cols-3">
        {STATS.map((s, i) => (
          <div
            key={s.id}
            className={cn(
              'text-center sm:text-start px-4 py-2',
              i > 0 && 'sm:border-s border-mwasalatInk-100'
            )}
          >
            <p className="font-display text-3xl sm:text-4xl font-bold text-mwasalatRed-600">{localizeNumber(s.value, i18n.language)}</p>
            <p className="text-xs sm:text-sm text-mwasalatInk-400 mt-1.5">{t(`stats.${s.id}`)}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function HowItWorksSection() {
  const { t, i18n } = useTranslation('mwasalatLanding');
  return (
    <section id="how-it-works" className="bg-white">
      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-20">
        <div data-reveal className="max-w-xl mb-14">
          <span className="text-xs font-semibold tracking-[0.14em] text-mwasalatRed-600 uppercase">
            {t('howItWorks.eyebrow')}
          </span>
          <h2 className="mt-3 font-display text-3xl sm:text-4xl font-semibold text-mwasalatInk-500 tracking-tight">
            {t('howItWorks.title')}
          </h2>
        </div>

        <div data-stagger className="relative grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="hidden lg:block absolute top-9 left-[12%] right-[12%] h-px" style={{
            backgroundImage: 'repeating-linear-gradient(90deg, #D9C9CA 0, #D9C9CA 6px, transparent 6px, transparent 14px)',
          }} />
          {JOURNEY_STEPS.map(({ id, n, icon: Icon }) => (
            <div key={id} className="relative">
              <div className="w-[72px] h-[72px] rounded-2xl bg-mwasalatInk-100 flex items-center justify-center mb-5 relative z-10">
                <Icon className="w-7 h-7 text-mwasalatRed-600" strokeWidth={2} />
              </div>
              <span className="text-xs font-bold text-mwasalatInk-200">{localizeNumber(n, i18n.language)}</span>
              <h3 className="mt-1 font-display text-lg font-semibold text-mwasalatInk-500">{t(`journey.steps.${id}.label`)}</h3>
              <p className="mt-2 text-sm text-mwasalatInk-400 leading-relaxed">{t(`journey.steps.${id}.desc`)}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function ProgramCard({ program }) {
  const { t, i18n } = useTranslation('mwasalatLanding');
  const meta = DELIVERY_META[program.delivery];
  const Icon = meta.icon;
  const navigate = useNavigate();
  const { isAuthenticated, user } = useMwasalatAuthStore();
  // Dummy filler cards carry no real programId — they route to the catalog
  // instead of a course URL that doesn't exist.
  const targetPath = program.programId ? `/learner/programs/${program.programId}` : '/learner/courses';

  return (
    <div data-reveal className="card card-hover p-5 flex flex-col">
      <span className="self-start inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-mwasalatInk-100 text-mwasalatInk-500">
        <Icon className="w-3.5 h-3.5" strokeWidth={2.25} />
        {t(`programs.delivery.${program.delivery}`)}
      </span>
      <h3 className="mt-3.5 font-display text-base font-semibold text-mwasalatInk-500 leading-snug">
        {program.title}
      </h3>
      <p className="mt-2 text-sm text-mwasalatInk-400 leading-relaxed flex-1">{program.blurb}</p>
      <div className="mt-5 flex items-center justify-between">
        <span className="inline-flex items-center gap-1.5 text-xs text-mwasalatInk-300">
          <Clock className="w-3.5 h-3.5" />
          {localizeNumber(program.duration, i18n.language)}
        </span>
        {/* Currency codes stay left-to-right even inside an RTL page */}
        <span dir="ltr" className="font-display font-semibold text-mwasalatRed-600">{localizeNumber(program.price, i18n.language)}</span>
      </div>
      <button
        onClick={() => goToLearnerDestination(navigate, { isAuthenticated, user }, targetPath)}
        className="mt-4 w-full inline-flex items-center justify-center gap-1.5 bg-mwasalatRed-500 hover:bg-mwasalatRed-600 text-white font-semibold px-4 py-2.5 rounded-xl text-sm transition-colors"
      >
        {t('programs.enrollNow')}
      </button>
    </div>
  );
}

function ProgramsSection() {
  const { t, i18n } = useTranslation('mwasalatLanding');
  const navigate = useNavigate();
  const { isAuthenticated, user } = useMwasalatAuthStore();
  // Starts with the dummy set so the section isn't empty while the real
  // courses are still loading, then swaps in real ones (padded with dummy
  // filler only if there aren't enough real courses yet) once fetched.
  const [programs, setPrograms] = useState(DUMMY_PROGRAMS);

  useEffect(() => {
    mwasalatProgramService.listPublic()
      .then((realPrograms) => {
        const mapped = realPrograms.slice(0, PROGRAMS_DISPLAY_COUNT).map((p) => ({
          key: p._id,
          programId: p._id,
          title: getLocalizedProgramField(p, 'title', i18n.language),
          delivery: deliveryFromContentTypes(p.contentTypes),
          duration: getLocalizedProgramField(p, 'duration', i18n.language) || '—',
          price: p.price > 0 ? `OMR ${p.price}` : t('programs.free'),
          blurb: getLocalizedProgramField(p, 'description', i18n.language) || t('programs.fallbackBlurb'),
        }));
        const filler = mapped.length < PROGRAMS_DISPLAY_COUNT
          ? DUMMY_PROGRAMS.slice(0, PROGRAMS_DISPLAY_COUNT - mapped.length)
          : [];
        setPrograms([...mapped, ...filler]);
      })
      .catch(() => {});
    // Re-fetch/re-map on language toggle so real (non-dummy) course text picks up
    // the Arabic variant immediately instead of staying frozen in whatever
    // language was active when this effect first ran.
  }, [i18n.language]);

  // Dummy entries only carry a stable `id` — resolve their display text
  // through the current language on every render (real fetched entries
  // already carry plain display strings from the API).
  const displayPrograms = programs.map((p) => (
    p.id
      ? {
          key: p.id,
          title: t(`programs.dummy.${p.id}.title`),
          duration: t(`programs.dummy.${p.id}.duration`),
          blurb: t(`programs.dummy.${p.id}.blurb`),
          delivery: p.delivery,
          price: p.price,
        }
      : p
  ));

  return (
    <section id="programs" className="bg-mwasalatInk-100/30">
      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-20">
        <div data-reveal className="flex flex-wrap items-end justify-between gap-4 mb-12">
          <div className="max-w-xl">
            <span className="text-xs font-semibold tracking-[0.14em] text-mwasalatRed-600 uppercase">
              {t('programs.eyebrow')}
            </span>
            <h2 className="mt-3 font-display text-3xl sm:text-4xl font-semibold text-mwasalatInk-500 tracking-tight">
              {t('programs.title')}
            </h2>
          </div>
        </div>
        <div data-stagger className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {displayPrograms.map((program) => (
            <ProgramCard key={program.key} program={program} />
          ))}
        </div>
        <div data-reveal className="mt-10 flex justify-center">
          <button
            onClick={() => goToLearnerDestination(navigate, { isAuthenticated, user }, '/learner/courses')}
            className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-sm font-semibold border border-mwasalatInk-200 text-mwasalatInk-500 hover:border-mwasalatRed-500 hover:text-mwasalatRed-600 transition-colors"
          >
            {t('programs.exploreAll')}
            <ArrowRight className="w-4 h-4 rtl:rotate-180" />
          </button>
        </div>
      </div>
    </section>
  );
}

function TestimonialsSection() {
  const { t } = useTranslation('mwasalatLanding');
  const [activeIndex, setActiveIndex] = useState(0);
  const [displayIndex, setDisplayIndex] = useState(0);
  const [phase, setPhase] = useState('in');

  // Auto-advance always targets a fresh cycle from the current selection —
  // a manual dot click re-arms it too, so a click never gets stomped by a
  // stale timer firing right after.
  useEffect(() => {
    const timer = setTimeout(() => {
      setActiveIndex((i) => (i + 1) % TESTIMONIAL_IDS.length);
    }, TESTIMONIAL_ROTATE_MS);
    return () => clearTimeout(timer);
  }, [activeIndex]);

  // Two-phase crossfade: the outgoing quote fades/slides up and out first,
  // then the content swaps and the incoming quote fades/slides up into
  // place — an instant cut where the old text vanishes the moment the new
  // one appears reads as a glitch, not a transition.
  useEffect(() => {
    if (activeIndex === displayIndex) return;
    setPhase('out');
    const timer = setTimeout(() => {
      setDisplayIndex(activeIndex);
      setPhase('in');
    }, 320);
    return () => clearTimeout(timer);
  }, [activeIndex, displayIndex]);

  const id = TESTIMONIAL_IDS[displayIndex];
  const name = t(`testimonials.items.${id}.name`);
  const role = t(`testimonials.items.${id}.role`);
  const quote = t(`testimonials.items.${id}.quote`);
  const initials = name.split(' ').map((word) => word[0]).slice(0, 2).join('');
  const exitClasses = 'opacity-0 -translate-y-2';

  return (
    <section className="bg-white">
      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-20">
        <div data-reveal className="max-w-xl mb-12">
          <span className="text-xs font-semibold tracking-[0.14em] text-mwasalatRed-600 uppercase">
            {t('testimonials.eyebrow')}
          </span>
          <h2 className="mt-3 font-display text-3xl sm:text-4xl font-semibold text-mwasalatInk-500 tracking-tight">
            {t('testimonials.title')}
          </h2>
        </div>

        <div data-reveal className="relative bg-mwasalatInk-500 rounded-3xl px-8 py-12 sm:px-14 sm:py-14 overflow-hidden">
          <RoadNetworkMark className="pointer-events-none absolute -top-14 -end-14 w-64 h-64 text-white/5" />

          <div className="relative flex items-center justify-between">
            <Quote className="w-9 h-9 text-mwasalatRed-400" strokeWidth={1.5} />
            <div className="flex items-center gap-1" aria-label={t('testimonials.ratingLabel')}>
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} className="w-3.5 h-3.5 text-amber-400" fill="currentColor" strokeWidth={0} />
              ))}
            </div>
          </div>

          <p
            key={id}
            className={cn(
              'relative mt-5 text-lg sm:text-2xl text-white font-medium leading-snug max-w-3xl min-h-[4.5em] sm:min-h-[3.5em] transition-all duration-300 ease-out',
              phase === 'out' ? exitClasses : 'mwasalat-quote-fade'
            )}
          >
            “{quote}”
          </p>
          <div
            key={`${id}-meta`}
            className={cn(
              'relative mt-8 flex items-center gap-3 transition-all duration-300 ease-out',
              phase === 'out' ? exitClasses : 'mwasalat-quote-fade'
            )}
          >
            <div className="w-11 h-11 rounded-full bg-mwasalatRed-500 flex items-center justify-center text-white text-sm font-semibold flex-shrink-0">
              {initials}
            </div>
            <div>
              <p className="text-sm font-semibold text-white">{name}</p>
              <p className="text-xs text-white/55">{role}</p>
            </div>
          </div>

          <div className="relative mt-9 flex items-center gap-2">
            {TESTIMONIAL_IDS.map((tid, i) => (
              <button
                key={tid}
                type="button"
                onClick={() => setActiveIndex(i)}
                aria-label={t('testimonials.dotLabel', { n: i + 1 })}
                className={cn(
                  'h-1.5 rounded-full transition-all',
                  i === activeIndex ? 'w-7 bg-mwasalatRed-500' : 'w-1.5 bg-white/25 hover:bg-white/40'
                )}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function AboutSection() {
  const { t } = useTranslation('mwasalatLanding');
  const cards = [
    { icon: Users, id: 'rolesCovered' },
    { icon: ShieldCheck, id: 'compliance' },
    { icon: GraduationCap, id: 'certification' },
    { icon: RouteIcon, id: 'access' },
  ];

  return (
    <section id="about" className="bg-white">
      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-20 grid lg:grid-cols-2 gap-14 items-center">
        <div data-reveal>
          <span className="text-xs font-semibold tracking-[0.14em] text-mwasalatRed-600 uppercase">
            {t('about.eyebrow')}
          </span>
          <h2 className="mt-3 font-display text-3xl sm:text-4xl font-semibold text-mwasalatInk-500 tracking-tight">
            {t('about.title')}
          </h2>
          <p className="mt-5 text-base text-mwasalatInk-400 leading-relaxed max-w-lg">
            {t('about.body')}
          </p>
          <div className="mt-7 flex items-center gap-2 text-sm font-semibold text-mwasalatRed-600">
            <BadgeCheck className="w-4.5 h-4.5" /> {t('about.certifiedBadge')}
          </div>
        </div>
        <div data-stagger className="grid grid-cols-2 gap-5">
          {cards.map(({ icon: Icon, id }) => (
            <div key={id} className="card p-5">
              <Icon className="w-5 h-5 text-mwasalatRed-600" strokeWidth={2} />
              <p className="mt-3 text-xs text-mwasalatInk-300 leading-tight">{t(`about.cards.${id}.label`)}</p>
              <p className="mt-1 text-sm font-semibold text-mwasalatInk-500 leading-tight">{t(`about.cards.${id}.value`)}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function ClosingCta() {
  const { t } = useTranslation('mwasalatLanding');
  const { isAuthenticated, user } = useMwasalatAuthStore();

  return (
    <section className="bg-white">
      <div className="max-w-7xl mx-auto px-6 lg:px-8 pb-20">
        <div
          data-reveal
          className="relative overflow-hidden rounded-3xl px-8 py-14 sm:px-14 sm:py-16 text-center"
          style={{ background: 'linear-gradient(135deg, #D6293C 0%, #8C1622 100%)' }}
        >
          <RoadNetworkMark className="pointer-events-none absolute -top-14 -end-14 w-64 h-64 text-white/10" />
          <RoadNetworkMark className="pointer-events-none absolute -bottom-16 -start-16 w-64 h-64 text-white/10" />
          <h2 className="relative font-display text-2xl sm:text-3xl font-semibold text-white tracking-tight">
            {t('closingCta.title')}
          </h2>
          <p className="relative mt-3 text-sm sm:text-base text-white/75 max-w-md mx-auto">
            {t('closingCta.subtitle')}
          </p>
          <div className="relative mt-8 flex items-center justify-center gap-4 flex-wrap">
            <a href="#programs">
              <button className="inline-flex items-center gap-2 bg-white hover:bg-mwasalatRed-100 text-mwasalatRed-600 font-semibold px-7 py-3 rounded-xl text-sm transition-colors">
                {t('closingCta.browsePrograms')} <ArrowUpRight className="w-4 h-4 rtl:scale-x-[-1]" />
              </button>
            </a>
            {!(isAuthenticated && user) && (
              <Link to="/login">
                <button className="inline-flex items-center gap-2 border border-white/40 hover:border-white text-white font-semibold px-7 py-3 rounded-xl text-sm transition-colors">
                  {t('closingCta.signIn')}
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
  const { t } = useTranslation('mwasalatLanding');
  return (
    <footer className="bg-mwasalatInk-500 relative">
      <div className="h-1" style={{ background: 'linear-gradient(90deg, #8C1622, #D6293C, #EFA0AA)' }} />

      <div className="max-w-7xl mx-auto px-6 lg:px-8 pt-14 pb-10">
        <div className="grid lg:grid-cols-[1.3fr_1fr_1fr_1.2fr] gap-10 pb-12 border-b border-white/10">
          <div>
            <Link to="/" className="inline-block">
              <img src="/mwasalat-logo.png" alt="Mwasalat" className="h-16 w-auto object-contain" />
            </Link>
            <p className="mt-5 text-sm text-white/55 leading-relaxed max-w-xs">
              {t('footer.tagline')}
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
            <p className="text-xs font-semibold tracking-[0.1em] text-white/35 uppercase mb-4">{t('footer.programsHeading')}</p>
            <ul className="space-y-2.5 text-sm text-white/60">
              <li><a href="#programs" className="hover:text-mwasalatRed-300 transition-colors">{t('footer.classroomTraining')}</a></li>
              <li><a href="#programs" className="hover:text-mwasalatRed-300 transition-colors">{t('footer.virtualSessions')}</a></li>
              <li><a href="#programs" className="hover:text-mwasalatRed-300 transition-colors">{t('footer.selfPacedCourses')}</a></li>
            </ul>
          </div>

          <div>
            <p className="text-xs font-semibold tracking-[0.1em] text-white/35 uppercase mb-4">{t('footer.platformHeading')}</p>
            <ul className="space-y-2.5 text-sm text-white/60">
              <li><a href="#how-it-works" className="hover:text-mwasalatRed-300 transition-colors">{t('footer.howItWorks')}</a></li>
              <li><a href="#about" className="hover:text-mwasalatRed-300 transition-colors">{t('footer.about')}</a></li>
              <li><Link to="/login" className="hover:text-mwasalatRed-300 transition-colors">{t('footer.signIn')}</Link></li>
            </ul>
          </div>

          <div className="bg-white/5 rounded-2xl p-5">
            <p className="text-xs font-semibold tracking-[0.1em] text-white/35 uppercase mb-3">{t('footer.getInTouch')}</p>
            <p className="flex items-start gap-2.5 text-sm text-white/70 leading-relaxed">
              <MapPin className="w-4 h-4 text-mwasalatRed-400 mt-0.5 flex-shrink-0" />
              {t('footer.location')}
            </p>
            <a href="#programs" className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-mwasalatRed-300 hover:text-mwasalatRed-200 transition-colors">
              {t('footer.explorePrograms')} <ArrowUpRight className="w-3.5 h-3.5 rtl:scale-x-[-1]" />
            </a>
          </div>
        </div>

        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-white/35">
          <span>© <span dir="ltr">{new Date().getFullYear()}</span> {t('footer.copyright')}</span>
          <span>{t('footer.disclaimer')}</span>
        </div>
      </div>
    </footer>
  );
}

export default function MwasalatLandingPage() {
  useScrollReveal();

  // dir/lang are now synced app-wide by <LanguageDirSync> in App.jsx —
  // every page participates in translation, not just this one.
  return (
    <div className="min-h-screen bg-white">
      <Header />
      <HeroSection />
      <MissionBand />
      <StatsBand />
      <ProgramsSection />
      <HowItWorksSection />
      <TestimonialsSection />
      <AboutSection />
      <ClosingCta />
      <Footer />
    </div>
  );
}
