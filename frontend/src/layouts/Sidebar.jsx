import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { LogOut, X, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../hooks/useAuth.js';
import { authService } from '../services/auth.service.js';
import { cn } from '../utils/cn.js';
import { getSidebarLinks } from '../utils/sidebarLinks.js';
import { ROLES, ROLE_DASHBOARD, ROLE_LABELS, ROLE_LOGIN } from '../constants/roles.js';

export default function Sidebar({ isOpen, onClose }) {
  const { user, roles } = useAuth();
  const navigate = useNavigate();
  const links = getSidebarLinks(user);
  const [switching, setSwitching] = useState(false);

  const handleLogout = async () => {
    const role = user?.role;
    await authService.logout();
    navigate(ROLE_LOGIN[role] ?? '/login');
  };

  const handleSwitchRole = async (newRole) => {
    setSwitching(true);
    try {
      await authService.switchRole(newRole);
      navigate(ROLE_DASHBOARD[newRole] || '/');
    } catch (err) {
      toast.error(err?.response?.data?.message ?? 'Failed to switch role');
    } finally {
      setSwitching(false);
    }
  };

  const otherRoles = roles.filter((r) => r !== user?.role);

  return (
    <>
      {isOpen && (
        <div className="fixed inset-0 bg-black/40 z-20 lg:hidden" onClick={onClose} />
      )}
      <aside
        className={cn(
          'fixed top-0 left-0 h-full w-64 bg-white border-r border-gray-100 z-30 overflow-hidden',
          'transition-transform duration-300 flex flex-col',
          isOpen ? 'translate-x-0' : '-translate-x-full',
          'lg:translate-x-0 lg:static lg:z-auto'
        )}
      >
        <div className="p-5 flex items-center justify-between flex-shrink-0">
          <img
            src="/eonix-logo.png"
            alt="Eonix Solutions"
            className="h-7"
          />
          <button
            className="lg:hidden p-1 rounded-lg hover:bg-gray-100 transition-colors"
            onClick={onClose}
          >
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>

        <div className="px-4 pb-2 flex-shrink-0">
          <div className="flex items-center gap-3 rounded-2xl p-3 border" style={{ background: '#FDEFEE', borderColor: '#F9DDDA' }}>
            <div className="w-9 h-9 rounded-full bg-[#CA6357] flex items-center justify-center flex-shrink-0">
              <span className="text-white font-semibold text-sm">
                {user?.name?.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="min-w-0">
              <p className="font-semibold text-sm text-[#1E293B] truncate">{user?.name}</p>
              <p className="text-xs text-[#94A3B8] capitalize">{user?.role?.replace(/_/g, ' ')}</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 px-3 py-2 overflow-y-auto">
          <ul className="space-y-1">
            {links.map((link) => (
              <li key={link.to}>
                <NavLink
                  to={link.to}
                  onClick={() => onClose?.()}
                  className={({ isActive }) =>
                    cn(
                      'flex items-center gap-3 px-4 py-2.5 rounded-full text-sm font-medium transition-colors',
                      isActive
                        ? 'bg-[#FDEFEE] text-[#C45E52] font-semibold'
                        : 'text-[#475569] hover:bg-[#F8F9FB] hover:text-[#1E293B]'
                    )
                  }
                >
                  <link.icon className="w-4 h-4 flex-shrink-0" />
                  {link.label}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        {otherRoles.length > 0 && (
          <div className="px-3 pb-2 pt-2 flex-shrink-0">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-[#94A3B8] px-4 mb-1.5">Switch Role</p>
            {otherRoles.map((r) => (
              <button
                key={r}
                onClick={() => handleSwitchRole(r)}
                disabled={switching}
                className="w-full flex items-center gap-3 px-4 py-2 rounded-full text-sm font-medium text-[#475569] hover:bg-[#F8F9FB] hover:text-[#1E293B] transition-colors disabled:opacity-60"
              >
                <RefreshCw className="w-4 h-4 flex-shrink-0" />
                {ROLE_LABELS[r] ?? r.replace(/_/g, ' ')}
              </button>
            ))}
          </div>
        )}

        <div className="p-3 pt-2 flex-shrink-0">
          <div
            className="relative rounded-2xl border overflow-hidden"
            style={{ background: '#FEF6F5', borderColor: '#F9DDDA' }}
          >
            <svg
              className="absolute inset-x-0 bottom-0 w-full h-10 pointer-events-none"
              viewBox="0 0 256 40"
              preserveAspectRatio="none"
            >
              <path
                d="M0,15 C50,2 90,28 140,20 C190,12 220,30 256,18 L256,40 L0,40 Z"
                fill="#FBE0DC"
                fillOpacity="0.6"
              />
            </svg>
            <button
              onClick={handleLogout}
              className="relative w-full flex items-center gap-3 px-4 py-3 text-sm font-semibold text-[#C45E52] hover:bg-[#FDEFEE] transition-colors rounded-2xl"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
