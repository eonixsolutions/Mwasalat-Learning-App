import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate, Navigate, Link } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { ShieldCheck, Eye, EyeOff, Loader2, Mail, Lock, Bus, Quote } from 'lucide-react';
import { mwasalatAuthService } from '../../services/mwasalatAuth.service.js';
import { useMwasalatAuthStore } from '../../store/mwasalatAuthStore.js';
import { MWASALAT_ROLE_DASHBOARD } from '../../constants/mwasalatRoles.js';

const QUOTES = [
  { quote: 'Every safe trip starts with the right training.', author: 'Mwasalat Academy' },
  { quote: 'Skilled people keep Mwasalat moving.', author: 'Mwasalat Team' },
  { quote: 'Learn today, apply it on the road tomorrow.', author: 'Mwasalat Learning' },
];

export default function MwasalatLogin() {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useMwasalatAuthStore();
  const [showPassword, setShowPassword] = useState(false);
  const [quoteIdx, setQuoteIdx] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setQuoteIdx((i) => (i + 1) % QUOTES.length), 5000);
    return () => clearInterval(t);
  }, []);

  const { register, handleSubmit, formState: { errors } } = useForm();

  const { mutate, isPending } = useMutation({
    mutationFn: mwasalatAuthService.login,
    onSuccess: () => {
      const loggedInUser = useMwasalatAuthStore.getState().user;
      navigate(MWASALAT_ROLE_DASHBOARD[loggedInUser?.role] || '/mwasalat');
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Login failed'),
  });

  if (isAuthenticated && user?.role === 'learner') {
    return <Navigate to={MWASALAT_ROLE_DASHBOARD.learner} replace />;
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
          <div
            className="hidden md:flex md:w-[45%] flex-col justify-between p-8 relative overflow-hidden"
            style={{ background: 'linear-gradient(160deg, #23181A 0%, #4A3336 55%, #8C6B6E 100%)' }}
          >
            {/* Decorative shapes */}
            <div className="absolute -right-10 -top-12 w-44 h-44 rounded-full bg-white/10" />
            <div className="absolute right-10 top-[38%] w-3 h-3 rounded-full bg-mwasalatRed-300" />
            <div className="absolute right-16 bottom-24 w-24 h-24 rounded-full bg-white/5" />
            <div className="absolute right-6 bottom-10 w-3 h-3 rotate-45 bg-mwasalatRed-300/80" />

            <div className="relative z-10">
              <Link to="/mwasalat" className="inline-flex bg-white rounded-xl p-2.5 shadow-sm">
                <img src="/mwasalat-logo.png" alt="Mwasalat" className="h-7 w-auto object-contain" />
              </Link>
            </div>

            <div className="relative z-10 flex flex-col gap-6">
              <div>
                <p className="text-xs font-bold tracking-widest text-mwasalatInk-200 uppercase mb-2">Learning Platform</p>
                <h2 className="text-2xl font-bold text-white leading-snug">
                  Keep Mwasalat<br />Moving, Safely.
                </h2>
              </div>

              <div className="rounded-2xl p-4 bg-white/10">
                <Quote className="w-5 h-5 text-mwasalatInk-200 mb-2.5" strokeWidth={2.5} />
                <p className="text-sm text-white/90 leading-relaxed italic">
                  &ldquo;{QUOTES[quoteIdx].quote}&rdquo;
                </p>
                <p className="text-xs text-white/60 mt-2.5 font-medium">— {QUOTES[quoteIdx].author}</p>
                <div className="flex gap-1.5 mt-3">
                  {QUOTES.map((_, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setQuoteIdx(i)}
                      className={`h-1.5 rounded-full transition-all duration-300 ${i === quoteIdx ? 'w-5 bg-white' : 'w-2 bg-white/30'}`}
                    />
                  ))}
                </div>
              </div>
            </div>

            <div className="relative z-10 pt-5 border-t border-white/15 flex items-center gap-2">
              <Bus className="w-3.5 h-3.5 text-mwasalatInk-200" />
              <p className="text-xs text-white/70">Safer roads, better transport.</p>
            </div>
          </div>

          {/* Right form panel */}
          <div className="flex-1 bg-white p-8 flex flex-col justify-center">

            <div className="md:hidden mb-6 flex items-center gap-3">
              <Link to="/mwasalat">
                <img src="/mwasalat-logo.png" alt="Mwasalat" className="h-8 w-auto object-contain" />
              </Link>
              <span className="inline-flex items-center gap-1.5 bg-mwasalatInk-100 rounded-full px-3 py-1">
                <ShieldCheck className="w-3 h-3 text-mwasalatInk-500" />
                <span className="text-mwasalatInk-500 text-xs font-semibold">Learning Platform</span>
              </span>
            </div>

            <div className="flex items-start justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-[#1E293B] mb-1">Sign In</h2>
                <p className="text-sm text-[#475569]">Access your Mwasalat training account.</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-mwasalatInk-100 flex items-center justify-center flex-shrink-0">
                <ShieldCheck className="w-5 h-5 text-mwasalatInk-500" />
              </div>
            </div>

            <form onSubmit={handleSubmit((data) => mutate({ ...data, expectedRole: 'learner' }))} className="space-y-4">

              <div>
                <label className="block text-sm font-medium text-[#1E293B] mb-1.5">Email</label>
                <div className="relative">
                  <div className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none">
                    <Mail className={`w-4 h-4 ${errors.email ? 'text-[#C22033]' : 'text-[#94A3B8]'}`} />
                  </div>
                  <input
                    type="email"
                    placeholder="you@mwasalat.om"
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
                {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
                {isPending ? 'Signing in…' : 'Sign In'}
              </button>
            </form>

            <p className="text-center text-xs text-[#94A3B8] mt-4">
              New here?{' '}
              <a href="/mwasalat/register" className="text-mwasalatInk-500 hover:underline font-medium">Create an account</a>
            </p>
            <p className="text-center text-xs text-[#94A3B8] mt-3">
              Back to{' '}
              <a href="/mwasalat" className="text-mwasalatInk-500 hover:underline font-medium">Mwasalat home</a>
            </p>
          </div>
        </div>

        <p className="text-xs text-[#94A3B8] mt-5 mb-4">© {new Date().getFullYear()} Mwasalat Learning Platform. All rights reserved.</p>
      </div>
    </div>
  );
}
