import { useState, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import {
  AlertCircle, Mail, Lock, Loader2,
  PhoneCall, MessageCircle, Quote, Eye, EyeOff, KeyRound, ShieldCheck,
} from 'lucide-react';
import { authService } from '../../services/auth.service.js';
import { useAuthStore } from '../../store/authStore.js';
import { ROLE_DASHBOARD } from '../../constants/roles.js';

const QUOTES = [
  {
    quote: "Every expert was once a beginner. You're in the right place.",
    author: 'Eonix Team',
  },
  {
    quote: "We don't just teach you to code — we walk with you until you land your dream job.",
    author: 'Eonix Mentors',
  },
  {
    quote: "Your growth is our mission. We're with you every step of the way.",
    author: 'Eonix Solutions',
  },
];

export default function Login() {
  const navigate = useNavigate();
  const [feePending, setFeePending] = useState(false);
  const [paymentReview, setPaymentReview] = useState(false);
  const [approvalPending, setApprovalPending] = useState(false);
  const [quoteIdx, setQuoteIdx] = useState(0);
  const [showPassword, setShowPassword] = useState(false);
  const [rolePicker, setRolePicker] = useState(null);
  const pendingCreds = useRef(null);

  useEffect(() => {
    const t = setInterval(() => setQuoteIdx((i) => (i + 1) % QUOTES.length), 5000);
    return () => clearInterval(t);
  }, []);

  const { register, handleSubmit, formState: { errors } } = useForm({ mode: 'onTouched' });

  const { mutate: login, isPending } = useMutation({
    mutationFn: authService.login,
    onSuccess: (data) => {
      if (data?.requiresRolePicker) {
        setRolePicker(data.roles);
        return;
      }
      toast.success('Welcome back!');
      const user = useAuthStore.getState().user;
      navigate(ROLE_DASHBOARD[user?.role] || '/login');
    },
    onError: (err) => {
      const code = err.response?.data?.code;
      if (code === 'REGISTRATION_FEE_PENDING') {
        setFeePending(true);
      } else if (code === 'PAYMENT_PENDING_REVIEW') {
        setPaymentReview(true);
      } else if (code === 'ACCOUNT_APPROVAL_PENDING') {
        setApprovalPending(true);
      } else {
        toast.error(err.response?.data?.message || 'Login failed');
      }
    },
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-tealBrand-100 via-white to-coral-100 flex flex-col relative overflow-hidden">

      {/* Floating decorative elements */}
      <div className="absolute top-[12%] right-[13%] w-3 h-3 rounded-full bg-purple-400/70" />
      <div className="absolute top-[38%] right-[5%] w-4 h-4 rounded-full bg-purple-500/55" />
      <div className="absolute top-[14%] left-[9%] w-4 h-4 rotate-45 border-2 border-teal-500/40 rounded-sm" />
      <div className="absolute bottom-[22%] left-[7%] text-[#E879A0]/65 text-2xl font-light leading-none select-none">+</div>
      <div className="absolute bottom-[18%] right-[10%] w-4 h-4 rounded-full border-2 border-teal-400/50" />

      <div className="flex-1 flex flex-col items-center justify-center p-4">

        {/* Split card */}
        <div
          className="w-full max-w-3xl flex rounded-2xl overflow-hidden"
          style={{ boxShadow: '0 4px 32px rgba(0,0,0,0.09)' }}
        >

          {/* ── Left decorative panel ──────────────────────────────── */}
          <div className="hidden md:flex md:w-[45%] bg-[#FEF0EE] flex-col justify-between p-8 relative overflow-hidden">

            {/* Floating shapes inside left panel */}
            <div className="absolute top-[32%] right-7 w-3 h-3 rounded-full bg-purple-400" />
            <div className="absolute top-[39%] right-4 w-3 h-3 rotate-45 bg-[#F59E0B]" />
            <div className="absolute top-[52%] right-6 w-2 h-2 rounded-full bg-[#F59E0B]/70" />

            {/* Logo */}
            <div className="relative z-10">
              <Link to="/">
                <img src="/eonix-logo.png" alt="Eonix" className="h-8" />
              </Link>
            </div>

            {/* Headline + quote card */}
            <div className="relative z-10 flex flex-col gap-6">
              <div>
                <p className="text-xs font-bold tracking-widest text-[#C76D64] uppercase mb-2">Student Portal</p>
                <h2 className="text-2xl font-bold text-[#1E293B] leading-snug">
                  Welcome back to<br />your learning hub.
                </h2>
              </div>

              <div className="rounded-2xl p-4 bg-white shadow-sm">
                <Quote className="w-6 h-6 text-[#C76D64] mb-3" strokeWidth={2.5} />
                <p className="text-sm text-[#475569] leading-relaxed italic">
                  &ldquo;{QUOTES[quoteIdx].quote}&rdquo;
                </p>
                <p className="text-xs text-[#94A3B8] mt-3 font-medium">— {QUOTES[quoteIdx].author}</p>
                <div className="flex gap-1.5 mt-3">
                  {QUOTES.map((_, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setQuoteIdx(i)}
                      className={`h-1.5 rounded-full transition-all duration-300 ${i === quoteIdx ? 'w-5 bg-[#C76D64]' : 'w-2 bg-[#C76D64]/30'}`}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Bottom register link */}
            <div className="relative z-10 pt-5 border-t border-[#C76D64]/15">
              <p className="text-xs text-[#94A3B8]">
                New here?{' '}
                <Link to="/register" className="text-[#C76D64] hover:text-[#A94E43] font-semibold transition-colors">
                  Apply for admission →
                </Link>
              </p>
            </div>
          </div>

          {/* ── Right form panel ───────────────────────────────────── */}
          <div className="flex-1 bg-white p-8 flex flex-col justify-center">

            {/* Header row */}
            <div className="flex items-start justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-[#1E293B] mb-1">Sign in</h2>
                <p className="text-sm text-[#475569]">Enter your credentials to continue.</p>
              </div>
              <KeyRound className="w-5 h-5 text-[#F59E0B] mt-1 flex-shrink-0" />
            </div>

            {paymentReview && (
              <div className="flex items-start gap-3 bg-[#FFFBEB] border border-[#FDE68A] rounded-xl p-3.5 mb-5">
                <AlertCircle className="w-4 h-4 text-[#F59E0B] flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-[#92400E]">Payment under review</p>
                  <p className="text-xs text-[#92400E] mt-0.5">
                    Your payment screenshot has been received. We'll activate your account shortly after verification.
                  </p>
                </div>
              </div>
            )}

            {approvalPending && (
              <div className="flex items-start gap-3 bg-[#E6F4F5] border border-[#A7D1D4] rounded-xl p-3.5 mb-5">
                <ShieldCheck className="w-4 h-4 text-[#1F5E63] flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-[#1F5E63]">Account pending approval</p>
                  <p className="text-xs text-[#1F5E63] mt-0.5">
                    Your account is awaiting coordinator approval. You'll receive an email once it's activated.
                  </p>
                </div>
              </div>
            )}

            {feePending && (
              <div className="flex items-start gap-3 bg-[#FBE9E7] border border-[#F2B3AC] rounded-xl p-3.5 mb-5">
                <AlertCircle className="w-4 h-4 text-[#D96C5F] flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-[#A94E43]">Registration fee pending</p>
                  <p className="text-xs text-[#A94E43] mt-0.5">
                    Please contact us to complete your registration payment.
                  </p>
                </div>
              </div>
            )}

            <form
              onSubmit={handleSubmit((data) => { pendingCreds.current = data; login({ ...data, activeRole: 'student' }); })}
              className="space-y-4"
              noValidate
            >
              <div>
                <label className="block text-sm font-medium text-[#1E293B] mb-1.5">
                  Email <span className="text-[#D96C5F]">*</span>
                </label>
                <div className="relative">
                  <div className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none">
                    <Mail className={`w-4 h-4 ${errors.email ? 'text-[#D96C5F]' : 'text-[#94A3B8]'}`} />
                  </div>
                  <input
                    type="email"
                    placeholder="you@example.com"
                    className={`w-full pl-10 pr-4 py-2.5 rounded-xl border text-sm bg-white text-[#1E293B] placeholder:text-[#94A3B8] focus:outline-none focus:ring-2 transition-colors ${
                      errors.email
                        ? 'border-[#D96C5F] focus:ring-[#D96C5F]/20'
                        : 'border-[#E2E8F0] hover:border-[#A7D1D4] focus:ring-[#1F5E63]/20'
                    }`}
                    {...register('email', {
                      required: 'Email is required',
                      pattern: {
                        value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                        message: 'Enter a valid email address',
                      },
                    })}
                  />
                </div>
                {errors.email && <p className="text-xs text-[#D96C5F] mt-1">{errors.email.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-[#1E293B] mb-1.5">
                  Password <span className="text-[#D96C5F]">*</span>
                </label>
                <div className="relative">
                  <div className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none">
                    <Lock className={`w-4 h-4 ${errors.password ? 'text-[#D96C5F]' : 'text-[#94A3B8]'}`} />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    className={`w-full pl-10 pr-10 py-2.5 rounded-xl border text-sm bg-white text-[#1E293B] placeholder:text-[#94A3B8] focus:outline-none focus:ring-2 transition-colors ${
                      errors.password
                        ? 'border-[#D96C5F] focus:ring-[#D96C5F]/20'
                        : 'border-[#E2E8F0] hover:border-[#A7D1D4] focus:ring-[#1F5E63]/20'
                    }`}
                    {...register('password', { required: 'Password is required' })}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(v => !v)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#94A3B8] hover:text-[#475569] transition-colors"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {errors.password && <p className="text-xs text-[#D96C5F] mt-1">{errors.password.message}</p>}
              </div>

              <div className="flex justify-end">
                <Link to="/forgot-password" className="text-xs text-[#1F5E63] hover:text-[#2F7A80] font-medium transition-colors">
                  Forgot password?
                </Link>
              </div>

              <button
                type="submit"
                disabled={isPending}
                className="w-full flex items-center justify-center gap-2 bg-[#CA6357] hover:bg-[#b85548] disabled:opacity-60 text-white font-semibold px-6 py-3 rounded-xl transition-colors text-sm"
              >
                {isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                {isPending ? 'Signing in…' : 'Sign In'}
              </button>
            </form>

            {/* Mobile-only register link */}
            <p className="md:hidden text-center text-xs text-[#94A3B8] mt-5">
              New here?{' '}
              <Link to="/register" className="text-[#1F5E63] font-medium hover:underline">Apply for admission</Link>
            </p>

            {/* Help bar */}
            <div className="flex items-center justify-center gap-4 mt-6 pt-5 border-t border-[#F1F5F9]">
              <span className="text-xs text-[#94A3B8]">Have questions?</span>
              <a href="tel:+918089272211" className="inline-flex items-center gap-1.5 text-xs font-medium text-[#1F5E63] hover:text-[#2F7A80] transition-colors">
                <PhoneCall className="w-3.5 h-3.5" /> Call us
              </a>
              <span className="text-[#E2E8F0]">|</span>
              <a href="https://wa.me/918089272211" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-xs font-medium text-[#22A66E] hover:text-[#1a8057] transition-colors">
                <MessageCircle className="w-3.5 h-3.5" /> WhatsApp
              </a>
            </div>

          </div>
        </div>

        {/* Role picker modal */}
        {rolePicker && (
          <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl p-6 w-full max-w-sm" style={{ boxShadow: '0 8px 40px rgba(0,0,0,0.15)' }}>
              <h3 className="text-base font-bold text-[#1E293B] mb-1">Select a role to continue</h3>
              <p className="text-sm text-[#94A3B8] mb-4">Your account has multiple roles. Which one would you like to use?</p>
              <div className="space-y-2">
                {rolePicker.map((r) => (
                  <button
                    key={r}
                    onClick={() => { setRolePicker(null); login({ ...pendingCreds.current, activeRole: r }); }}
                    className="w-full text-left px-4 py-3 rounded-xl border border-[#E2E8F0] hover:border-[#1F5E63] hover:bg-[#E6F4F5] transition-colors text-sm font-medium text-[#1E293B] capitalize"
                  >
                    {r.replace(/_/g, ' ')}
                  </button>
                ))}
              </div>
              <button onClick={() => setRolePicker(null)} className="mt-3 text-xs text-[#94A3B8] hover:text-[#475569] transition-colors">
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Footer */}
        <p className="text-xs text-[#94A3B8] mt-5 mb-4">© 2026 Eonix Solutions. All rights reserved.</p>

      </div>
    </div>
  );
}
