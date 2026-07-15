import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutGrid, Users, GraduationCap, BookOpen, Award, Wallet, ClipboardCheck, History,
  Settings as SettingsIcon, LogOut, Menu, X, FileBarChart,
} from 'lucide-react';
import { useMwasalatAuthStore } from '../store/mwasalatAuthStore.js';
import { mwasalatAuthService } from '../services/mwasalatAuth.service.js';
import MwasalatNotificationBell from '../components/mwasalat/MwasalatNotificationBell.jsx';

const NAV_ITEMS = [
  { to: '/mwasalat/admin/dashboard', label: 'Overview', icon: LayoutGrid },
  { to: '/mwasalat/admin/learners', label: 'Learners', icon: Users },
  { to: '/mwasalat/admin/instructors', label: 'Instructors', icon: GraduationCap },
  { to: '/mwasalat/admin/programs', label: 'Programs', icon: BookOpen },
  { to: '/mwasalat/admin/certificates', label: 'Certificates', icon: Award },
  { to: '/mwasalat/admin/payments', label: 'Payments', icon: Wallet },
  { to: '/mwasalat/admin/sales-report', label: 'Sales Report', icon: FileBarChart },
  { to: '/mwasalat/admin/quiz-results', label: 'Quiz Results', icon: ClipboardCheck },
  { to: '/mwasalat/admin/activity-log', label: 'Activity Log', icon: History },
  { to: '/mwasalat/admin/settings', label: 'Settings', icon: SettingsIcon },
];

export default function MwasalatAdminLayout({ title, subtitle, actions, children }) {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { user } = useMwasalatAuthStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  const handleLogout = () => {
    mwasalatAuthService.logout();
    navigate('/mwasalat/admin/login');
  };

  const sidebarContent = (
    <>
      <div className="h-16 flex items-center justify-between px-6 border-b border-[#E2E8F0] flex-shrink-0">
        <Link to="/mwasalat">
          <img src="/mwasalat-logo.png" alt="Mwasalat" className="h-8 w-auto object-contain" />
        </Link>
        <button
          onClick={() => setSidebarOpen(false)}
          className="lg:hidden w-8 h-8 rounded-lg flex items-center justify-center text-[#475569] hover:bg-[#F1F5F9] transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <nav className="flex-1 p-4 space-y-1 overflow-y-auto scrollbar-hide">
        <p className="px-3 mb-2 text-[11px] font-semibold uppercase tracking-wider text-[#94A3B8]">Manage</p>
        {NAV_ITEMS.map(({ to, label, icon: Icon }) => {
          const active = pathname === to || pathname.startsWith(`${to}/`);
          return (
            <Link
              key={to}
              to={to}
              className={`group relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                active ? 'bg-mwasalatInk-100 text-mwasalatInk-500' : 'text-[#475569] hover:bg-[#F1F5F9]'
              }`}
            >
              {active && <span className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-1 rounded-r-full bg-mwasalatInk-500" />}
              <span className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
                active ? 'bg-white text-mwasalatInk-500 shadow-sm' : 'bg-[#F1F5F9] text-[#94A3B8] group-hover:text-mwasalatInk-400'
              }`}>
                <Icon className="w-4 h-4" />
              </span>
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-[#E2E8F0] flex-shrink-0">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-[#475569] hover:bg-[#F1F5F9] hover:text-mwasalatRed-600 transition-colors w-full"
        >
          <LogOut className="w-4 h-4" />
          Log out
        </button>
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-[#F8F9FB] flex">

      {/* Desktop sidebar — sticky + h-screen so it stays pinned to the viewport
          instead of stretching to match main content that's taller than the screen */}
      <aside className="hidden lg:flex w-64 h-screen sticky top-0 bg-white border-r border-[#E2E8F0] flex-col flex-shrink-0">
        {sidebarContent}
      </aside>

      {/* Mobile sidebar drawer */}
      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-40">
          <div className="fixed inset-0 bg-black/40" onClick={() => setSidebarOpen(false)} />
          <aside className="fixed inset-y-0 left-0 w-72 max-w-[85vw] bg-white flex flex-col z-50">
            {sidebarContent}
          </aside>
        </div>
      )}

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 bg-gradient-to-r from-mwasalatRed-100/70 via-white to-white backdrop-blur border-b border-mwasalatRed-100 flex items-center justify-between gap-3 px-4 sm:px-8 sticky top-0 z-10">
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden w-9 h-9 rounded-lg flex items-center justify-center text-[#475569] hover:bg-[#F1F5F9] transition-colors flex-shrink-0"
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
            <MwasalatNotificationBell />
            <Link
              to="/mwasalat/admin/profile"
              className="w-9 h-9 rounded-full bg-mwasalatInk-500 flex items-center justify-center text-white text-sm font-semibold flex-shrink-0 hover:ring-2 hover:ring-mwasalatInk-300 transition-all"
            >
              {user?.name?.[0]?.toUpperCase() ?? 'A'}
            </Link>
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-8 min-w-0">
          {children}
        </main>
      </div>
    </div>
  );
}
