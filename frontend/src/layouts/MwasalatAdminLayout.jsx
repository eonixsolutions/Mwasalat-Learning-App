import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  LayoutGrid, Users, GraduationCap, BookOpen, Award, Wallet, ClipboardCheck, History,
  Settings as SettingsIcon, LogOut, Menu, X, FileBarChart, Calendar, Clock, Search, ChevronDown, Megaphone,
} from 'lucide-react';
import { useMwasalatAuthStore } from '../store/mwasalatAuthStore.js';
import { mwasalatAuthService } from '../services/mwasalatAuth.service.js';
import { mwasalatActivityLogService } from '../services/mwasalatActivityLog.service.js';
import { localizeNumber } from '../utils/mwasalatLocalize.js';
import MwasalatNotificationBell from '../components/mwasalat/MwasalatNotificationBell.jsx';
import MwasalatLanguageToggle from '../components/mwasalat/MwasalatLanguageToggle.jsx';
import MwasalatAiTrigger from '../components/mwasalat/MwasalatAiTrigger.jsx';
import MwasalatAiPanel from '../components/mwasalat/MwasalatAiPanel.jsx';
import MwasalatHeaderChip from '../components/mwasalat/MwasalatHeaderChip.jsx';

// How often the "Users Online" chip re-polls — a real distinct-socket count
// from the backend (see getOnlineUserCount in backend/src/sockets/socket.js),
// not decorative. 45s keeps it fresh without hammering the endpoint.
const ONLINE_POLL_MS = 45 * 1000;
// How often the "Updated Xm ago" chip's relative-time label re-renders.
const UPDATED_TICK_MS = 30 * 1000;

// Grouped like a real ops console (main / people / learning / finance / system)
// rather than one flat list — mirrors how the reference admin tools organize
// a dozen-plus nav items so the sidebar reads at a glance instead of scanning.
const NAV_GROUPS = [
  {
    id: 'main',
    items: [
      { to: '/mwasalat/admin/dashboard', id: 'overview', icon: LayoutGrid },
    ],
  },
  {
    id: 'people',
    items: [
      { to: '/mwasalat/admin/learners', id: 'learners', icon: Users },
      { to: '/mwasalat/admin/instructors', id: 'instructors', icon: GraduationCap },
    ],
  },
  {
    id: 'learning',
    items: [
      { to: '/mwasalat/admin/programs', id: 'programs', icon: BookOpen },
      { to: '/mwasalat/admin/certificates', id: 'certificates', icon: Award },
      { to: '/mwasalat/admin/quiz-results', id: 'quizResults', icon: ClipboardCheck },
    ],
  },
  {
    id: 'finance',
    items: [
      { to: '/mwasalat/admin/payments', id: 'payments', icon: Wallet },
      { to: '/mwasalat/admin/sales-report', id: 'salesReport', icon: FileBarChart },
    ],
  },
  {
    id: 'system',
    items: [
      { to: '/mwasalat/admin/announcements', id: 'announcements', icon: Megaphone },
      { to: '/mwasalat/admin/activity-log', id: 'activityLog', icon: History },
      { to: '/mwasalat/admin/settings', id: 'settings', icon: SettingsIcon },
    ],
  },
];

export default function MwasalatAdminLayout({ title, subtitle, actions, children }) {
  const { t, i18n } = useTranslation('mwasalatApp');
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { user } = useMwasalatAuthStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState(null);
  // Resets on every page navigation (this layout element remounts per-page,
  // since each admin page wraps itself in <MwasalatAdminLayout>) — a real,
  // if approximate, proxy for "when this page's data was last loaded".
  const [mountedAt] = useState(() => Date.now());
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  useEffect(() => {
    let cancelled = false;
    const poll = () => {
      mwasalatActivityLogService.getOnlineCount()
        .then(({ onlineUsers: count }) => { if (!cancelled) setOnlineUsers(count); })
        .catch(() => {});
    };
    poll();
    const interval = setInterval(poll, ONLINE_POLL_MS);
    return () => { cancelled = true; clearInterval(interval); };
  }, []);

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), UPDATED_TICK_MS);
    return () => clearInterval(interval);
  }, []);

  const handleLogout = () => {
    mwasalatAuthService.logout();
    navigate('/mwasalat/admin/login');
  };

  const dateLocale = i18n.language.startsWith('ar') ? 'ar-OM' : 'en-GB';
  const today = new Date();
  const dateValue = today.toLocaleDateString(dateLocale, { month: 'long', day: 'numeric', year: 'numeric' });
  const dateLabel = today.toLocaleDateString(dateLocale, { weekday: 'long' });

  const updatedSeconds = Math.floor((now - mountedAt) / 1000);
  const updatedLabel = updatedSeconds < 60
    ? t('common.justNow')
    : localizeNumber(t('common.minutesAgo', { count: Math.floor(updatedSeconds / 60) }), i18n.language);

  const sidebarContent = (
    <>
      {/* Branded red header band (real Mwasalat identity color) instead of a
          plain white strip — the logo itself has a white plate baked into the
          PNG, so it sits in its own white chip rather than floating directly
          on the red, which would otherwise look like a stray white cutout. */}
      <div
        className="h-20 flex items-center justify-between px-4 border-b border-black/10 flex-shrink-0"
        style={{ background: 'linear-gradient(135deg, #7A1420 0%, #9C1B29 55%, #C22033 100%)' }}
      >
        <Link to="/mwasalat" className="flex items-center gap-2.5 min-w-0">
          <span className="w-11 h-11 rounded-2xl bg-white shadow-sm flex items-center justify-center flex-shrink-0 p-1.5">
            <img src="/mwasalat-mark.png" alt="Mwasalat" className="w-full h-full object-contain" />
          </span>
          <span className="min-w-0 leading-tight">
            <span className="block text-white font-bold text-sm tracking-wide truncate">{t('common.brandName')}</span>
            <span className="block text-white/75 text-[11px] truncate">{t('common.brandTagline')}</span>
          </span>
        </Link>
        <button
          type="button"
          onClick={() => setSidebarOpen(false)}
          aria-label={t('common.closeMenu')}
          className="lg:hidden w-8 h-8 rounded-lg flex items-center justify-center text-white/80 hover:bg-white/10 hover:text-white transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <nav className="flex-1 p-3 space-y-4 overflow-y-auto scrollbar-hide">
        {NAV_GROUPS.map((group) => (
          <div key={group.id}>
            {group.id !== 'main' && (
              <p className="px-3 mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-[#94A3B8]">{t(`admin.nav.groups.${group.id}`)}</p>
            )}
            <div className="space-y-0.5">
              {group.items.map(({ to, id, icon: Icon }) => {
                const active = pathname === to || pathname.startsWith(`${to}/`);
                return (
                  <Link
                    key={to}
                    to={to}
                    className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-[13px] font-medium transition-colors ${
                      active
                        ? 'bg-mwasalatRed-500 text-white shadow-sm shadow-mwasalatRed-500/30'
                        : 'text-[#475569] hover:bg-[#F1F5F9]'
                    }`}
                  >
                    <Icon className={`w-4 h-4 flex-shrink-0 ${active ? 'text-white' : 'text-[#94A3B8]'}`} />
                    {t(`admin.nav.${id}`)}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="p-3 border-t border-[#E2E8F0] flex-shrink-0">
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
        <header className="min-h-[4.5rem] flex items-center justify-between gap-3 px-4 sm:px-6 py-3 sticky top-0 z-10 bg-white border-b border-[#E2E8F0] flex-wrap">
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
              <p className="text-lg font-bold text-[#1E293B] truncate">{title}</p>
              {subtitle && <p className="text-xs text-[#94A3B8] truncate hidden sm:block">{subtitle}</p>}
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <MwasalatHeaderChip icon={Calendar} value={dateValue} label={dateLabel} tone="red" />
            <MwasalatHeaderChip icon={Clock} value={t('common.updated')} label={updatedLabel} tone="slate" />
            <MwasalatHeaderChip
              dotColor="bg-green-500"
              value={onlineUsers === null ? '—' : localizeNumber(onlineUsers, i18n.language)}
              label={t('common.usersOnline')}
              tone="green"
            />
            {actions}
            <button
              type="button"
              aria-label={t('common.search')}
              className="hidden sm:flex w-9 h-9 rounded-full items-center justify-center text-[#475569] hover:bg-[#F1F5F9] hover:text-mwasalatInk-500 transition-colors flex-shrink-0"
            >
              <Search className="w-4 h-4" />
            </button>
            <MwasalatAiTrigger theme="light" />
            <MwasalatLanguageToggle theme="light" />
            <MwasalatNotificationBell theme="light" />
            <Link
              to="/mwasalat/admin/profile"
              aria-label={t('common.viewProfile')}
              className="flex items-center gap-1 flex-shrink-0"
            >
              <span className="w-8 h-8 rounded-full bg-mwasalatRed-500 flex items-center justify-center text-white text-xs font-semibold ring-2 ring-mwasalatRed-100 hover:ring-mwasalatRed-300 transition-all">
                {user?.name?.[0]?.toUpperCase() ?? 'A'}
              </span>
              <ChevronDown className="hidden sm:block w-3.5 h-3.5 text-[#94A3B8]" />
            </Link>
          </div>
        </header>

        <main className="flex-1 p-3.5 sm:p-5 min-w-0">
          {children}
        </main>
      </div>

      <MwasalatAiPanel />
    </div>
  );
}
