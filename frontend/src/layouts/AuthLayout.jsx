import { Link, Outlet, Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.js';
import { ROLE_DASHBOARD } from '../constants/roles.js';
import { PhoneCall, MessageCircle } from 'lucide-react';

export default function AuthLayout() {
  const { isAuthenticated, role } = useAuth();

  if (isAuthenticated && role) {
    return <Navigate to={ROLE_DASHBOARD[role]} replace />;
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-tealBrand-100 via-white to-coral-100 relative overflow-hidden">

      {/* Floating decorative elements */}
      <div className="absolute top-[12%] right-[13%] w-3 h-3 rounded-full bg-purple-400/70 pointer-events-none" />
      <div className="absolute top-[38%] right-[5%] w-4 h-4 rounded-full bg-purple-500/55 pointer-events-none" />
      <div className="absolute top-[14%] left-[9%] w-4 h-4 rotate-45 border-2 border-teal-500/40 rounded-sm pointer-events-none" />
      <div className="absolute bottom-[22%] left-[7%] text-[#E879A0]/65 text-2xl font-light leading-none select-none pointer-events-none">+</div>
      <div className="absolute bottom-[18%] right-[10%] w-4 h-4 rounded-full border-2 border-teal-400/50 pointer-events-none" />

      {/* Minimal header — logo only, no nav links */}
      <header className="relative z-10 h-14 bg-white/70 backdrop-blur-sm border-b border-white/60 flex items-center px-6">
        <Link to="/">
          <img src="/eonix-logo.png" alt="Eonix Solutions" className="h-8 w-auto" />
        </Link>
      </header>

      <div className="relative z-10 flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-2xl p-8" style={{ boxShadow: '0 4px 32px rgba(0,0,0,0.09)' }}>
            <Outlet />
          </div>

          <div className="flex items-center justify-center gap-4 mt-5">
            <span className="text-sm text-[#94A3B8]">Have questions?</span>
            <a
              href="tel:+918089272211"
              className="inline-flex items-center gap-1.5 text-sm font-medium text-[#1F5E63] hover:text-[#2F7A80] transition-colors"
            >
              <PhoneCall className="w-3.5 h-3.5" />
              Call us
            </a>
            <span className="text-[#E2E8F0]">|</span>
            <a
              href="https://wa.me/918089272211"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-sm font-medium text-[#22A66E] hover:text-[#1a8057] transition-colors"
            >
              <MessageCircle className="w-3.5 h-3.5" />
              WhatsApp
            </a>
          </div>
        </div>
      </div>

      <footer className="relative z-10 py-5 text-center text-xs text-[#94A3B8]">
        © {new Date().getFullYear()} Eonix Solutions · academy@eonixsolutions.in
      </footer>
    </div>
  );
}
