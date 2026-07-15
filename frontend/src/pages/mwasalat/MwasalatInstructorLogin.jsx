import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate, Navigate, Link } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { GraduationCap, Eye, EyeOff, Loader2, Mail, Lock } from 'lucide-react';
import { mwasalatAuthService } from '../../services/mwasalatAuth.service.js';
import { useMwasalatAuthStore } from '../../store/mwasalatAuthStore.js';
import { MWASALAT_ROLE_DASHBOARD } from '../../constants/mwasalatRoles.js';

export default function MwasalatInstructorLogin() {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useMwasalatAuthStore();
  const [showPassword, setShowPassword] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm();

  const { mutate, isPending } = useMutation({
    mutationFn: mwasalatAuthService.login,
    onSuccess: () => {
      const loggedInUser = useMwasalatAuthStore.getState().user;
      navigate(MWASALAT_ROLE_DASHBOARD[loggedInUser?.role] || '/mwasalat');
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Login failed'),
  });

  if (isAuthenticated && user?.role === 'instructor') {
    return <Navigate to={MWASALAT_ROLE_DASHBOARD.instructor} replace />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-mwasalatInk-100 via-white to-mwasalatRed-100 flex flex-col relative overflow-hidden">

      {/* Floating decorative elements */}
      <div className="absolute top-[12%] right-[13%] w-3 h-3 rounded-full bg-purple-400/70" />
      <div className="absolute top-[38%] right-[5%] w-4 h-4 rounded-full bg-purple-500/55" />
      <div className="absolute top-[14%] left-[9%] w-4 h-4 rotate-45 border-2 border-mwasalatInk-500/40 rounded-sm" />
      <div className="absolute bottom-[22%] left-[7%] text-mwasalatInk-400/65 text-2xl font-light leading-none select-none">+</div>
      <div className="absolute bottom-[18%] right-[10%] w-4 h-4 rounded-full border-2 border-mwasalatInk-400/50" />

      <div className="flex-1 flex flex-col items-center justify-center p-4">

        <div
          className="w-full max-w-3xl flex rounded-2xl overflow-hidden"
          style={{ boxShadow: '0 4px 32px rgba(0,0,0,0.09)' }}
        >

          {/* Left panel */}
          <div className="hidden md:flex md:w-[45%] bg-mwasalatInk-100 flex-col justify-between p-8 relative overflow-hidden">

            {/* Floating shapes */}
            <div className="absolute top-[32%] right-7 w-3 h-3 rounded-full bg-purple-400" />
            <div className="absolute top-[39%] right-4 w-3 h-3 rotate-45 bg-mwasalatRed-500" />
            <div className="absolute top-[52%] right-6 w-2 h-2 rounded-full bg-mwasalatRed-500/70" />

            <div className="relative z-10">
              <Link to="/mwasalat">
                <img src="/mwasalat-logo.png" alt="Mwasalat" className="h-10 w-auto object-contain" />
              </Link>
            </div>

            <div className="relative z-10 flex flex-col gap-6">
              <div>
                <p className="text-xs font-bold tracking-widest text-mwasalatInk-500 uppercase mb-2">Instructor Portal</p>
                <h2 className="text-2xl font-bold text-[#1E293B] leading-snug">
                  Teach.<br />Assess.<br />Certify.
                </h2>
              </div>
              <div className="rounded-2xl p-4 bg-white shadow-sm">
                <p className="text-sm text-[#475569] leading-relaxed">Deliver sessions, track learner progress, and issue certifications across your assigned programs.</p>
              </div>
            </div>

            <div className="relative z-10 pt-5 border-t border-mwasalatInk-400/20">
              <p className="text-xs text-[#94A3B8]">Restricted to authorised instructors only.</p>
            </div>
          </div>

          {/* Right form panel */}
          <div className="flex-1 bg-white p-8 flex flex-col justify-center">

            <div className="md:hidden mb-6 flex items-center gap-3">
              <Link to="/mwasalat">
                <img src="/mwasalat-logo.png" alt="Mwasalat" className="h-7 w-auto object-contain" />
              </Link>
              <span className="inline-flex items-center gap-1.5 bg-mwasalatInk-100 rounded-full px-3 py-1">
                <GraduationCap className="w-3 h-3 text-mwasalatInk-500" />
                <span className="text-mwasalatInk-500 text-xs font-semibold">Instructor Portal</span>
              </span>
            </div>

            <div className="flex items-start justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-[#1E293B] mb-1">Instructor Login</h2>
                <p className="text-sm text-[#475569]">Restricted to authorised instructors only.</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-mwasalatInk-100 flex items-center justify-center flex-shrink-0">
                <GraduationCap className="w-5 h-5 text-mwasalatInk-500" />
              </div>
            </div>

            <form onSubmit={handleSubmit((data) => mutate({ ...data, expectedRole: 'instructor' }))} className="space-y-4">

              <div>
                <label className="block text-sm font-medium text-[#1E293B] mb-1.5">Email</label>
                <div className="relative">
                  <div className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none">
                    <Mail className={`w-4 h-4 ${errors.email ? 'text-[#C22033]' : 'text-[#94A3B8]'}`} />
                  </div>
                  <input
                    type="email"
                    placeholder="instructor@mwasalat.om"
                    className={`w-full pl-10 pr-4 py-2.5 rounded-xl border text-sm bg-white text-[#1E293B] placeholder:text-[#94A3B8] focus:outline-none focus:ring-2 transition-colors ${
                      errors.email ? 'border-[#C22033] focus:ring-[#C22033]/20' : 'border-[#E2E8F0] hover:border-mwasalatInk-300 focus:ring-mwasalatInk-500/20'
                    }`}
                    {...register('email', { required: 'Email is required' })}
                  />
                </div>
                {errors.email && <p className="text-xs text-[#C22033] mt-1">{errors.email.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-[#1E293B] mb-1.5">Password</label>
                <div className="relative">
                  <div className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none">
                    <Lock className={`w-4 h-4 ${errors.password ? 'text-[#C22033]' : 'text-[#94A3B8]'}`} />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    className={`w-full pl-10 pr-10 py-2.5 rounded-xl border text-sm bg-white text-[#1E293B] placeholder:text-[#94A3B8] focus:outline-none focus:ring-2 transition-colors ${
                      errors.password ? 'border-[#C22033] focus:ring-[#C22033]/20' : 'border-[#E2E8F0] hover:border-mwasalatInk-300 focus:ring-mwasalatInk-500/20'
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
                {errors.password && <p className="text-xs text-[#C22033] mt-1">{errors.password.message}</p>}
                <div className="text-right mt-1.5">
                  <a href="/mwasalat/forgot-password" className="text-xs text-mwasalatInk-500 hover:underline font-medium">Forgot password?</a>
                </div>
              </div>

              <button
                type="submit"
                disabled={isPending}
                className="w-full flex items-center justify-center gap-2 bg-mwasalatInk-500 hover:bg-mwasalatInk-400 disabled:opacity-60 text-white font-semibold px-6 py-3 rounded-xl transition-colors text-sm"
              >
                {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <GraduationCap className="w-4 h-4" />}
                {isPending ? 'Signing in…' : 'Sign In to Instructor Portal'}
              </button>
            </form>

            <p className="text-center text-xs text-[#94A3B8] mt-6">
              Not an instructor?{' '}
              <a href="/mwasalat/login" className="text-mwasalatInk-500 hover:underline font-medium">Learner login</a>
            </p>
          </div>
        </div>

        <p className="text-xs text-[#94A3B8] mt-5 mb-4">© {new Date().getFullYear()} Mwasalat Learning Platform. All rights reserved.</p>
      </div>
    </div>
  );
}
