import { Suspense, useEffect, useState } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  LayoutGrid, Users, GraduationCap, BookOpen, Award, Wallet, ClipboardCheck, History,
  Settings as SettingsIcon, LogOut, Menu, X, FileBarChart, Calendar, Clock, Search, ChevronDown, Megaphone, BellRing, Tags, ShieldCheck, MessageCircle,
  Building2, UsersRound, Headphones,
} from 'lucide-react';
import { useMwasalatAuthStore } from '../store/mwasalatAuthStore.js';
import { useMwasalatLayoutHeaderStore } from '../store/mwasalatLayoutHeaderStore.js';
import { mwasalatAuthService } from '../services/mwasalatAuth.service.js';
import { mwasalatActivityLogService } from '../services/mwasalatActivityLog.service.js';
import { localizeNumber } from '../utils/mwasalatLocalize.js';
import MwasalatNotificationBell from '../components/mwasalat/MwasalatNotificationBell.jsx';
import MwasalatLanguageToggle from '../components/mwasalat/MwasalatLanguageToggle.jsx';
import MwasalatAiTrigger from '../components/mwasalat/MwasalatAiTrigger.jsx';
import MwasalatAiPanel from '../components/mwasalat/MwasalatAiPanel.jsx';
import MwasalatHeaderChip from '../components/mwasalat/MwasalatHeaderChip.jsx';
import MwasalatPageAreaSpinner from '../components/mwasalat/MwasalatPageAreaSpinner.jsx';
import { getGreetingKey } from '../utils/mwasalatGreeting.js';
import { MWASALAT_ROLE_LOGIN } from '../constants/mwasalatRoles.js';

// How often the "Users Online" chip re-polls — a real distinct-socket count
// from the backend (see getOnlineUserCount in backend/src/sockets/socket.js),
// not decorative. 45s keeps it fresh without hammering the endpoint.
const ONLINE_POLL_MS = 45 * 1000;
// How often the "Updated Xm ago" chip's relative-time label re-renders.
const UPDATED_TICK_MS = 30 * 1000;

// Grouped like a real ops console (main / people / learning / finance / system)
// rather than one flat list. `main` stays flat and always visible (top-level
// actions); the rest are collapsible accordions — only the group header shows
// until clicked, which is what keeps a dozen-plus nav items from overflowing
// the sidebar. Items without a `roles` array are shared by both admin tiers;
// `roles` restricts an item to specific roles — revenue and platform-admin
// governance stay with super_admin, everything else is Platform Admin's
// operational surface.
const NAV_GROUPS = [
  {
    id: 'main',
    items: [
      { to: '/admin/dashboard', id: 'overview', icon: LayoutGrid },
      { to: '/admin/chat', id: 'adminChat', icon: MessageCircle },
    ],
  },
  {
    id: 'people',
    collapsible: true,
    icon: Users,
    items: [
      { to: '/admin/learners', id: 'learners', icon: Users },
      { to: '/admin/instructors', id: 'instructors', icon: GraduationCap },
      { to: '/admin/staff', id: 'staff', icon: Headphones },
      { to: '/admin/departments', id: 'departments', icon: Building2 },
      { to: '/admin/cohorts', id: 'cohorts', icon: UsersRound },
      { to: '/admin/platform-admins', id: 'platformAdmins', icon: ShieldCheck, roles: ['super_admin'] },
    ],
  },
  {
    id: 'learning',
    collapsible: true,
    icon: BookOpen,
    items: [
      { to: '/admin/programs', id: 'programs', icon: BookOpen },
      { to: '/admin/categories', id: 'categories', icon: Tags },
      { to: '/admin/certificates', id: 'certificates', icon: Award },
      { to: '/admin/quiz-results', id: 'quizResults', icon: ClipboardCheck },
    ],
  },
  {
    id: 'finance',
    collapsible: true,
    icon: Wallet,
    items: [
      { to: '/admin/payments', id: 'payments', icon: Wallet, roles: ['super_admin'] },
      { to: '/admin/sales-report', id: 'salesReport', icon: FileBarChart, roles: ['super_admin'] },
    ],
  },
  {
    id: 'system',
    collapsible: true,
    icon: SettingsIcon,
    items: [
      { to: '/admin/announcements', id: 'announcements', icon: Megaphone },
      { to: '/admin/reminders', id: 'reminders', icon: BellRing },
      { to: '/admin/activity-log', id: 'activityLog', icon: History, roles: ['super_admin'] },
      { to: '/admin/settings', id: 'settings', icon: SettingsIcon },
    ],
  },
];

const findActiveGroup = (pathname) => NAV_GROUPS.find(
  (group) => group.collapsible && group.items.some((item) => pathname === item.to || pathname.startsWith(`${item.to}/`))
);

// Persistent chrome for every /admin/* (and /it-support/dashboard-adjacent
// /admin/activity-log) route — mounted once per session at the route level
// (see AppRoutes.jsx) instead of remounting on every page navigation the way
// the old per-page MwasalatAdminLayout did. That used to mean the online-count
// poll restarted, and the "Updated Xm ago" / collapsible-group state reset,
// on literally every click.
export default function MwasalatAdminLayoutShell() {
  const { t, i18n } = useTranslation('mwasalatApp');
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { user } = useMwasalatAuthStore();
  const { title, subtitle, actions } = useMwasalatLayoutHeaderStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState(null);
  // Re-keyed to the current page on every navigation (see effect below) so
  // this stays "when this page's data was last loaded" instead of silently
  // becoming "time since login" now that the Shell persists across nav.
  const [mountedAt, setMountedAt] = useState(() => Date.now());
  const [now, setNow] = useState(() => Date.now());
  // Whichever collapsible group holds the current page starts open; the rest
  // start collapsed. Persists across navigation now (manually expanded groups
  // no longer collapse on nav) — the effect below still auto-opens whichever
  // group holds the newly-active page if it isn't already open.
  const [expandedGroups, setExpandedGroups] = useState(() => {
    const activeGroup = findActiveGroup(pathname);
    return new Set(activeGroup ? [activeGroup.id] : []);
  });

  const toggleGroup = (id) => {
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  useEffect(() => {
    setMountedAt(Date.now());
  }, [pathname]);

  useEffect(() => {
    const activeGroup = findActiveGroup(pathname);
    if (!activeGroup) return;
    setExpandedGroups((prev) => (prev.has(activeGroup.id) ? prev : new Set(prev).add(activeGroup.id)));
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
    navigate(MWASALAT_ROLE_LOGIN[user?.role] ?? MWASALAT_ROLE_LOGIN.super_admin);
  };

  const dateLocale = i18n.language.startsWith('ar') ? 'ar-OM' : 'en-GB';
  const today = new Date();
  const dateValue = today.toLocaleDateString(dateLocale, { month: 'long', day: 'numeric', year: 'numeric' });
  const dateLabel = today.toLocaleDateString(dateLocale, { weekday: 'long' });

  const updatedSeconds = Math.floor((now - mountedAt) / 1000);
  const updatedLabel = updatedSeconds < 60
    ? t('common.justNow')
    : localizeNumber(t('common.minutesAgo', { count: Math.floor(updatedSeconds / 60) }), i18n.language);

  // Fixed identity greeting — shown in the header on every admin page, regardless
  // of which sidebar item is active. Page-specific title/subtitle/actions render
  // in a slimmer bar underneath instead, so this top row never changes on nav.
  const greetingTitle = t(`adminDashboard.greetings.${getGreetingKey()}`, { name: user?.name ?? t('adminDashboard.defaultAdminName') });
  const greetingSubtitle = t('adminDashboard.subtitle');

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

      <nav className="flex-1 min-h-0 p-3 space-y-1 overflow-y-auto">
        {NAV_GROUPS.map((group) => {
          const visibleItems = group.items.filter((item) => !item.roles || item.roles.includes(user?.role));
          if (!visibleItems.length) return null;

          // `light: true` is used for items nested under a collapsible group —
          // the group header itself carries the strong red when one of its
          // children is active, so the child link underneath uses a lighter
          // red tint instead of repeating the same solid red twice in a row.
          const renderLink = ({ to, id, icon: Icon }, light = false) => {
            const active = pathname === to || pathname.startsWith(`${to}/`);
            return (
              <Link
                key={to}
                to={to}
                className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-[13px] font-medium transition-colors ${
                  active
                    ? light
                      ? 'bg-mwasalatRed-100 text-mwasalatRed-600'
                      : 'bg-mwasalatRed-500 text-white shadow-sm shadow-mwasalatRed-500/30'
                    : 'text-[#475569] hover:bg-[#F1F5F9]'
                }`}
              >
                <Icon className={`w-4 h-4 flex-shrink-0 ${active ? (light ? 'text-mwasalatRed-500' : 'text-white') : 'text-[#94A3B8]'}`} />
                {t(`admin.nav.${id}`)}
              </Link>
            );
          };

          if (!group.collapsible) {
            return (
              <div key={group.id} className="space-y-0.5 mb-2">
                {visibleItems.map((item) => renderLink(item))}
              </div>
            );
          }

          const isOpen = expandedGroups.has(group.id);
          const GroupIcon = group.icon;
          // A child route being active should still color the parent group
          // header red, even while collapsed — otherwise the red highlight
          // only ever shows up on the flat top-level items (Overview, Admin
          // Chat) and grouped pages look permanently "unselected".
          const groupActive = visibleItems.some((item) => pathname === item.to || pathname.startsWith(`${item.to}/`));
          // Three states: solid red when a child page is actually active,
          // light red while just expanded/browsing (no active child yet),
          // gray when collapsed and inactive.
          const headerTone = groupActive ? 'solid' : isOpen ? 'light' : 'plain';

          return (
            <div key={group.id}>
              <button
                type="button"
                onClick={() => toggleGroup(group.id)}
                aria-expanded={isOpen}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-[13px] font-medium transition-colors ${
                  headerTone === 'solid'
                    ? 'bg-mwasalatRed-500 text-white shadow-sm shadow-mwasalatRed-500/30'
                    : headerTone === 'light'
                      ? 'bg-mwasalatRed-100 text-mwasalatRed-600'
                      : 'text-[#475569] hover:bg-[#F1F5F9]'
                }`}
              >
                <GroupIcon className={`w-4 h-4 flex-shrink-0 ${headerTone === 'solid' ? 'text-white' : headerTone === 'light' ? 'text-mwasalatRed-500' : 'text-[#94A3B8]'}`} />
                <span className="flex-1 text-start">{t(`admin.nav.groups.${group.id}`)}</span>
                <ChevronDown className={`w-3.5 h-3.5 transition-transform ${headerTone === 'solid' ? 'text-white' : headerTone === 'light' ? 'text-mwasalatRed-500' : 'text-[#94A3B8]'} ${isOpen ? 'rotate-180' : ''}`} />
              </button>
              {isOpen && (
                <div className="mt-0.5 ps-3 space-y-0.5">
                  {visibleItems.map((item) => renderLink(item, true))}
                </div>
              )}
            </div>
          );
        })}
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
        <header className="sticky top-0 z-10 bg-white border-b border-[#E2E8F0] flex flex-col">
          {/* Persistent row — identical on every admin page, never reacts to
              sidebar navigation. */}
          <div className="min-h-[4.5rem] flex items-center justify-between gap-3 px-4 sm:px-6 py-3 flex-wrap">
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
                <p className="text-lg font-bold text-[#1E293B] truncate">{greetingTitle}</p>
                <p className="text-xs text-[#94A3B8] truncate hidden sm:block">{greetingSubtitle}</p>
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
              <button
                type="button"
                aria-label={t('common.search')}
                className="hidden sm:flex w-9 h-9 rounded-full items-center justify-center text-[#475569] hover:bg-[#F1F5F9] hover:text-mwasalatInk-500 transition-colors flex-shrink-0"
              >
                <Search className="w-4 h-4" />
              </button>
              <MwasalatLanguageToggle theme="light" />
              <MwasalatNotificationBell theme="light" />
              <Link
                to="/admin/profile"
                aria-label={t('common.viewProfile')}
                className="flex items-center gap-1 flex-shrink-0"
              >
                <span className="w-8 h-8 rounded-full bg-mwasalatRed-500 flex items-center justify-center text-white text-xs font-semibold ring-2 ring-mwasalatRed-100 hover:ring-mwasalatRed-300 transition-all">
                  {user?.name?.[0]?.toUpperCase() ?? 'A'}
                </span>
                <ChevronDown className="hidden sm:block w-3.5 h-3.5 text-[#94A3B8]" />
              </Link>
            </div>
          </div>

          {/* Contextual row — this is the part that changes per sidebar page. */}
          {(title || actions) && (
            <div className="flex items-center justify-between gap-3 px-4 sm:px-6 py-2.5 border-t border-[#F1F5F9] flex-wrap">
              <div className="min-w-0">
                {title && <p className="text-sm font-semibold text-[#1E293B] truncate">{title}</p>}
                {subtitle && <p className="text-xs text-[#94A3B8] truncate">{subtitle}</p>}
              </div>
              {actions && <div className="flex items-center gap-2 flex-shrink-0">{actions}</div>}
            </div>
          )}
        </header>

        <main className="flex-1 p-3.5 sm:p-5 min-w-0">
          <Suspense fallback={<MwasalatPageAreaSpinner />}>
            <Outlet />
          </Suspense>
        </main>
      </div>

      {(user?.role === 'super_admin' || user?.role === 'platform_admin') && (
        <>
          <MwasalatAiTrigger />
          <MwasalatAiPanel />
        </>
      )}
    </div>
  );
}
