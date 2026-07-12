import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ChevronDown, Menu, X, User } from 'lucide-react';

const NAV_LINKS = [
  { label: 'Home',     section: 'home'     },
  { label: 'Programs', section: 'programs', dropdown: true },
  { label: 'Features', section: 'features' },
  { label: 'Projects', section: 'projects' },
  { label: 'About Us', section: 'about'    },
  { label: 'Contact',  section: 'contact'  },
];

const DROPDOWN_PROGRAMS = [
  { label: 'Zero2Code'    },
  { label: 'Code2Career'  },
  { label: 'AI Launchpad' },
];

export default function Navbar() {
  const { pathname } = useLocation();
  const isLanding = pathname === '/';
  const isLogin   = pathname === '/login';

  const [open, setOpen]               = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('home');

  useEffect(() => {
    if (!isLanding) return;
    const sections = NAV_LINKS.map(l => document.getElementById(l.section)).filter(Boolean);
    const observer = new IntersectionObserver(
      (entries) => entries.forEach(e => { if (e.isIntersecting) setActiveSection(e.target.id); }),
      { threshold: 0.3 }
    );
    sections.forEach(s => observer.observe(s));
    return () => observer.disconnect();
  }, [isLanding]);

  const href = (section) => isLanding ? `#${section}` : `/#${section}`;

  const ctaLabel = isLogin ? 'Apply Now' : 'Login';
  const ctaTo    = isLogin ? '/register' : '/login';

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-gray-100 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-[72px]">

          <Link to="/" className="flex-shrink-0">
            <img src="/eonix-logo.png" alt="Eonix Solutions" className="h-12" />
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-7">
            {NAV_LINKS.map((link) => {
              const isActive = isLanding && activeSection === link.section;
              if (link.dropdown) return (
                <div
                  key={link.label}
                  className="relative"
                  onMouseEnter={() => setDropdownOpen(true)}
                  onMouseLeave={() => setDropdownOpen(false)}
                >
                  <a
                    href={href(link.section)}
                    className={`flex items-center gap-0.5 text-sm font-medium transition-colors duration-200 pb-0.5 ${
                      isActive ? 'text-[#D58283] border-b-2 border-[#D58283]' : 'text-[#475569] hover:text-[#D58283]'
                    }`}
                  >
                    {link.label}
                    <ChevronDown className={`w-3.5 h-3.5 mt-0.5 transition-transform duration-200 ${dropdownOpen ? 'rotate-180' : ''}`} />
                  </a>
                  {dropdownOpen && (
                    <div className="absolute top-full left-1/2 -translate-x-1/2 pt-3">
                      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 py-2 min-w-[160px]">
                        {DROPDOWN_PROGRAMS.map(p => (
                          <a
                            key={p.label}
                            href={href('programs')}
                            className="block px-4 py-2.5 text-sm text-[#475569] hover:text-[#D58283] hover:bg-[#FDEFEE] transition-colors"
                          >
                            {p.label}
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
              return (
                <a
                  key={link.label}
                  href={href(link.section)}
                  className={`text-sm font-medium transition-colors duration-200 pb-0.5 ${
                    isActive ? 'text-[#D58283] border-b-2 border-[#D58283]' : 'text-[#475569] hover:text-[#D58283]'
                  }`}
                >
                  {link.label}
                </a>
              );
            })}
          </nav>

          <div className="hidden md:block">
            <Link
              to={ctaTo}
              className="inline-flex items-center gap-2 bg-[#D36E61] hover:bg-[#c06256] text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors"
            >
              {ctaLabel} <User className="w-4 h-4" />
            </Link>
          </div>

          <button
            className="md:hidden p-2 rounded-xl hover:bg-gray-100 transition-colors"
            onClick={() => setOpen(v => !v)}
            aria-label="Toggle menu"
          >
            {open ? <X className="w-5 h-5 text-gray-700" /> : <Menu className="w-5 h-5 text-gray-700" />}
          </button>
        </div>

        {/* Mobile menu */}
        {open && (
          <div className="md:hidden border-t border-gray-100 py-4 space-y-1 pb-5">
            {NAV_LINKS.map((link) => (
              <a
                key={link.label}
                href={href(link.section)}
                onClick={() => setOpen(false)}
                className={`block px-3 py-2.5 text-sm font-medium rounded-xl transition-colors ${
                  isLanding && activeSection === link.section
                    ? 'text-[#D58283] bg-[#FDEFEE]'
                    : 'text-[#475569] hover:text-[#D58283] hover:bg-[#FDEFEE]'
                }`}
              >
                {link.label}
              </a>
            ))}
            <div className="pt-3 px-1">
              <Link
                to={ctaTo}
                onClick={() => setOpen(false)}
                className="block w-full text-center bg-[#D36E61] hover:bg-[#c06256] text-white text-sm font-semibold py-2.5 rounded-xl transition-colors"
              >
                {ctaLabel}
              </Link>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
