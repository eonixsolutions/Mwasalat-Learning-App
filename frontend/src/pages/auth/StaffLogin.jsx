import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate, Navigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Users, GraduationCap, MessageSquare, Eye, EyeOff, Loader2, LogIn, Mail, Lock } from 'lucide-react';
import { authService } from '../../services/auth.service.js';
import { useAuth } from '../../hooks/useAuth.js';
import { useAuthStore } from '../../store/authStore.js';
import { ROLE_DASHBOARD } from '../../constants/roles.js';

const VARIANT_TO_ROLE = {
  'branch-admin': 'branch_admin',
  coordinator: 'branch_coordinator',
  mentor: 'technical_mentor',
  'comm-mentor': 'communication_mentor',
};

const ROLE_CONFIG = {
  'branch-admin': {
    icon: Users,
    title: 'Branch Admin Login',
    subtitle: 'Branch Admin Portal',
    badge: 'Branch Admin',
    placeholder: 'branchadmin@eonixsolutions.in',
    desc: 'Sign in to manage your branch, students, and staff operations.',
  },
  coordinator: {
    icon: Users,
    title: 'Coordinator Login',
    subtitle: 'Branch Coordinator Portal',
    badge: 'Branch Coordinator',
    placeholder: 'coordinator@eonixsolutions.in',
    desc: 'Sign in to manage student onboarding, approvals, and progress.',
  },
  mentor: {
    icon: GraduationCap,
    title: 'Mentor Login',
    subtitle: 'Technical Mentor Portal',
    badge: 'Technical Mentor',
    placeholder: 'mentor@eonixsolutions.in',
    desc: 'Sign in to manage sessions, assignments, and student feedback.',
  },
  'comm-mentor': {
    icon: MessageSquare,
    title: 'Mentor Login',
    subtitle: 'Communication Mentor Portal',
    badge: 'Communication Mentor',
    placeholder: 'mentor@eonixsolutions.in',
    desc: 'Sign in to manage communication sessions and student development.',
  },
};

export default function StaffLogin({ variant }) {
  const config = ROLE_CONFIG[variant] ?? ROLE_CONFIG.coordinator;
  const Icon = config.icon;

  const navigate = useNavigate();
  const { isAuthenticated, role } = useAuth();
  const [showPassword, setShowPassword] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm();
  const activeRole = VARIANT_TO_ROLE[variant];

  const { mutate, isPending } = useMutation({
    mutationFn: (data) => authService.login({ ...data, activeRole }),
    onSuccess: () => {
      const user = useAuthStore.getState().user;
      navigate(ROLE_DASHBOARD[user?.role] || '/');
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Login failed'),
  });

  if (isAuthenticated && role) {
    return <Navigate to={ROLE_DASHBOARD[role]} replace />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-tealBrand-100 via-white to-coral-100 flex flex-col relative overflow-hidden">

      {/* Floating decorative elements */}
      <div className="absolute top-[12%] right-[13%] w-3 h-3 rounded-full bg-purple-400/70" />
      <div className="absolute top-[38%] right-[5%] w-4 h-4 rounded-full bg-purple-500/55" />
      <div className="absolute top-[14%] left-[9%] w-4 h-4 rotate-45 border-2 border-teal-500/40 rounded-sm" />
      <div className="absolute bottom-[22%] left-[7%] text-[#E879A0]/65 text-2xl font-light leading-none select-none">+</div>
      <div className="absolute bottom-[18%] right-[10%] w-4 h-4 rounded-full border-2 border-teal-400/50" />

      <div className="flex-1 flex flex-col items-center justify-center p-4">

        <div
          className="w-full max-w-3xl flex rounded-2xl overflow-hidden"
          style={{ boxShadow: '0 4px 32px rgba(0,0,0,0.09)' }}
        >

          {/* Left panel */}
          <div className="hidden md:flex md:w-[45%] bg-[#FEF0EE] flex-col justify-between p-8 relative overflow-hidden">

            {/* Floating shapes */}
            <div className="absolute top-[32%] right-7 w-3 h-3 rounded-full bg-purple-400" />
            <div className="absolute top-[39%] right-4 w-3 h-3 rotate-45 bg-[#F59E0B]" />
            <div className="absolute top-[52%] right-6 w-2 h-2 rounded-full bg-[#F59E0B]/70" />

            <div className="relative z-10">
              <img src="/eonix-logo.png" alt="Eonix" className="h-8" />
            </div>

            <div className="relative z-10 flex flex-col gap-6">
              <div>
                <p className="text-xs font-bold tracking-widest text-[#C76D64] uppercase mb-2">{config.badge}</p>
                <h2 className="text-2xl font-bold text-[#1E293B] leading-snug">
                  Welcome back to<br />your portal.
                </h2>
              </div>
              <div className="rounded-2xl p-4 bg-white shadow-sm">
                <p className="text-sm text-[#475569] leading-relaxed">{config.desc}</p>
              </div>
            </div>

            <div className="relative z-10 pt-5 border-t border-[#C76D64]/15">
              <p className="text-xs text-[#94A3B8]">Restricted to authorised staff only.</p>
            </div>
          </div>

          {/* Right form panel */}
          <div className="flex-1 bg-white p-8 flex flex-col justify-center">

            <div className="md:hidden mb-6 flex items-center gap-3">
              <img src="/eonix-logo.png" alt="Eonix" className="h-7" />
              <span className="inline-flex items-center gap-1.5 bg-[#E6F4F5] rounded-full px-3 py-1">
                <Icon className="w-3 h-3 text-[#1F5E63]" />
                <span className="text-[#1F5E63] text-xs font-semibold">{config.badge}</span>
              </span>
            </div>

            <div className="flex items-start justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-[#1E293B] mb-1">{config.title}</h2>
                <p className="text-sm text-[#475569]">Restricted to authorised staff only.</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-[#E6F4F5] flex items-center justify-center flex-shrink-0">
                <Icon className="w-5 h-5 text-[#1F5E63]" />
              </div>
            </div>

            <form onSubmit={handleSubmit((data) => mutate(data))} className="space-y-4">

              <div>
                <label className="block text-sm font-medium text-[#1E293B] mb-1.5">Email</label>
                <div className="relative">
                  <div className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none">
                    <Mail className={`w-4 h-4 ${errors.email ? 'text-[#D96C5F]' : 'text-[#94A3B8]'}`} />
                  </div>
                  <input
                    type="email"
                    placeholder={config.placeholder}
                    className={`w-full pl-10 pr-4 py-2.5 rounded-xl border text-sm bg-white text-[#1E293B] placeholder:text-[#94A3B8] focus:outline-none focus:ring-2 transition-colors ${
                      errors.email ? 'border-[#D96C5F] focus:ring-[#D96C5F]/20' : 'border-[#E2E8F0] hover:border-[#A7D1D4] focus:ring-[#1F5E63]/20'
                    }`}
                    {...register('email', { required: 'Email is required' })}
                  />
                </div>
                {errors.email && <p className="text-xs text-[#D96C5F] mt-1">{errors.email.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-[#1E293B] mb-1.5">Password</label>
                <div className="relative">
                  <div className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none">
                    <Lock className={`w-4 h-4 ${errors.password ? 'text-[#D96C5F]' : 'text-[#94A3B8]'}`} />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    className={`w-full pl-10 pr-10 py-2.5 rounded-xl border text-sm bg-white text-[#1E293B] placeholder:text-[#94A3B8] focus:outline-none focus:ring-2 transition-colors ${
                      errors.password ? 'border-[#D96C5F] focus:ring-[#D96C5F]/20' : 'border-[#E2E8F0] hover:border-[#A7D1D4] focus:ring-[#1F5E63]/20'
                    }`}
                    {...register('password', { required: 'Password is required' })}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#94A3B8] hover:text-[#475569] transition-colors"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {errors.password && <p className="text-xs text-[#D96C5F] mt-1">{errors.password.message}</p>}
              </div>

              <button
                type="submit"
                disabled={isPending}
                className="w-full flex items-center justify-center gap-2 bg-[#CA6357] hover:bg-[#b85548] disabled:opacity-60 text-white font-semibold px-6 py-3 rounded-xl transition-colors text-sm"
              >
                {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <LogIn className="w-4 h-4" />}
                {isPending ? 'Signing in…' : 'Sign In'}
              </button>
            </form>
          </div>
        </div>

        <p className="text-xs text-[#94A3B8] mt-5 mb-4">© 2026 Eonix Solutions. All rights reserved.</p>
      </div>
    </div>
  );
}
