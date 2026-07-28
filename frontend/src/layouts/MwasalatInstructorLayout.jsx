import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { LayoutGrid, Table2, Plus, LogOut, Menu, X, Users, AlertTriangle, CalendarDays, MessageCircle } from 'lucide-react';
import { useMwasalatAuthStore } from '../store/mwasalatAuthStore.js';
import { mwasalatAuthService } from '../services/mwasalatAuth.service.js';
import { MWASALAT_ROLE_LOGIN } from '../constants/mwasalatRoles.js';
import MwasalatNotificationBell from '../components/mwasalat/MwasalatNotificationBell.jsx';
import MwasalatChatBell from '../components/mwasalat/MwasalatChatBell.jsx';
import MwasalatLanguageToggle from '../components/mwasalat/MwasalatLanguageToggle.jsx';
import MwasalatAiTrigger from '../components/mwasalat/MwasalatAiTrigger.jsx';
import MwasalatAiPanel from '../components/mwasalat/MwasalatAiPanel.jsx';

const NAV_ITEMS = [
  { to: '/instructor/dashboard', id: 'dashboard', icon: LayoutGrid },
  { to: '/instructor/chat', id: 'adminChat', icon: MessageCircle },
  { to: '/instructor/programs', id: 'myPrograms', icon: Table2 },
  { to: '/instructor/calendar', id: 'calendar', icon: CalendarDays },
  { to: '/instructor/programs/new', id: 'addCourse', icon: Plus },
  { to: '/instructor/students', id: 'myStudents', icon: Users },
  { to: '/instructor/at-risk', id: 'atRisk', icon: AlertTriangle },
];

export default function MwasalatInstructorLayout({ title, subtitle, actions, children }) {
  const { t } = useTranslation('mwasalatApp');
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { user } = useMwasalatAuthStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  const handleLogout = () => {
    mwasalatAuthService.logout();
    navigate(MWASALAT_ROLE_LOGIN[user?.role] ?? MWASALAT_ROLE_LOGIN.instructor);
  };

  const sidebarContent = (
    <>
      {/* Branded red header band (real Mwasalat identity color), same full
          logo mark and size as the public landing page header — the PNG has
          its own white plate baked in, so it reads fine directly on the red. */}
      <div
        className="flex items-center justify-between px-4 py-4 border-b border-black/10 flex-shrink-0"
        style={{ background: 'linear-gradient(135deg, #7A1420 0%, #9C1B29 55%, #C22033 100%)' }}
      >
        <Link to="/" className="flex flex-col gap-1.5 min-w-0">
          <img src="/mwasalat-logo.png" alt="Mwasalat" className="h-16 w-auto object-contain" />
          <span className="text-white/80 text-[11px] font-medium tracking-wide truncate">{t('common.brandTagline')}</span>
        </Link>
        <button
          type="button"
          onClick={() => setSidebarOpen(false)}
          aria-label={t('common.closeMenu')}
          className="lg:hidden w-8 h-8 rounded-lg flex items-center justify-center text-white/80 hover:bg-white/10 hover:text-white transition-colors flex-shrink-0"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
        <p className="px-2.5 mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-[#94A3B8]">{t('instructor.nav.section')}</p>
        {NAV_ITEMS.map(({ to, id, icon: Icon }) => {
          const active = pathname === to;
          return (
            <Link
              key={to}
              to={to}
              className={`group relative flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-[13px] font-medium transition-colors ${
                active ? 'bg-mwasalatInk-100 text-mwasalatInk-500' : 'text-[#475569] hover:bg-[#F1F5F9]'
              }`}
            >
              {active && <span className="absolute start-0 top-1/2 -translate-y-1/2 h-4 w-1 rounded-e-full rtl:rounded-e-none rtl:rounded-s-full bg-mwasalatInk-500" />}
              <span className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors flex-shrink-0 ${
                active ? 'bg-white text-mwasalatInk-500 shadow-sm' : 'bg-[#F1F5F9] text-[#94A3B8] group-hover:text-mwasalatInk-400'
              }`}>
                <Icon className="w-3.5 h-3.5" />
              </span>
              {t(`instructor.nav.${id}`)}
            </Link>
          );
        })}
      </nav>

      <div className="p-3 border-t border-[#E2E8F0] flex-shrink-0">
        <Link
          to="/instructor/profile"
          className="flex items-center gap-2 px-2 py-1.5 mb-1.5 rounded-lg bg-[#F8F9FB] hover:bg-mwasalatInk-100 transition-colors"
        >
          <div className="w-8 h-8 rounded-full bg-mwasalatInk-500 flex items-center justify-center text-white text-xs font-semibold flex-shrink-0">
            {user?.name?.[0]?.toUpperCase() ?? 'I'}
          </div>
          <div className="min-w-0">
            <p className="text-xs font-semibold text-[#1E293B] truncate">{user?.name ?? t('instructor.defaultName')}</p>
            <p className="text-[11px] text-[#94A3B8] truncate" dir="ltr">{user?.email}</p>
          </div>
        </Link>
        <button
          onClick={handleLogout}
          className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-[13px] font-medium text-[#475569] hover:bg-[#F1F5F9] hover:text-mwasalatRed-600 transition-colors w-full"
        >
          <LogOut className="w-3.5 h-3.5 rtl:scale-x-[-1]" />
          {t('common.logOut')}
        </button>
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-[#F8F9FB] flex">

      {/* Desktop sidebar — sticky + h-screen so it stays pinned to the viewport
          instead of stretching to match main content that's taller than the screen */}
      <aside className="hidden lg:flex w-56 h-screen sticky top-0 bg-white border-e border-[#E2E8F0] flex-col flex-shrink-0">
        {sidebarContent}
      </aside>

      {/* Mobile sidebar drawer */}
      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-40">
          <div className="fixed inset-0 bg-black/40" onClick={() => setSidebarOpen(false)} />
          <aside className="fixed inset-y-0 start-0 w-64 max-w-[85vw] bg-white flex flex-col z-50">
            {sidebarContent}
          </aside>
        </div>
      )}

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-14 flex items-center justify-between gap-3 px-4 sm:px-6 sticky top-0 z-10 bg-white border-b border-[#E2E8F0]">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              aria-label={t('common.openMenu')}
              className="lg:hidden w-8 h-8 rounded-lg flex items-center justify-center text-[#475569] hover:bg-[#F1F5F9] hover:text-mwasalatInk-500 transition-colors flex-shrink-0"
            >
              <Menu className="w-4 h-4" />
            </button>
            <div className="min-w-0">
              <p className="text-base font-semibold text-[#1E293B] truncate">{title}</p>
              {subtitle && <p className="text-xs text-[#94A3B8] truncate hidden sm:block">{subtitle}</p>}
            </div>
          </div>
          <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
            {actions}
            <MwasalatLanguageToggle theme="light" />
            <MwasalatChatBell theme="light" />
            <MwasalatNotificationBell theme="light" />
            <Link
              to="/instructor/profile"
              aria-label={t('common.viewProfile')}
              className="w-8 h-8 rounded-full bg-mwasalatRed-500 flex items-center justify-center text-white text-xs font-semibold flex-shrink-0 ring-2 ring-mwasalatRed-100 hover:ring-mwasalatRed-300 transition-all"
            >
              {user?.name?.[0]?.toUpperCase() ?? 'I'}
            </Link>
          </div>
        </header>

        <main className="flex-1 p-3.5 sm:p-5 min-w-0">
          {children}
        </main>
      </div>

      <MwasalatAiTrigger />
      <MwasalatAiPanel />
    </div>
  );
}
