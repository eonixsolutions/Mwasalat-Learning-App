import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate, useLocation, Navigate, Link } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { ShieldCheck, Eye, EyeOff, Loader2, Mail, Lock, Bus, Quote } from 'lucide-react';
import { mwasalatAuthService } from '../../services/mwasalatAuth.service.js';
import { useMwasalatAuthStore } from '../../store/mwasalatAuthStore.js';
import { MWASALAT_ROLE_DASHBOARD } from '../../constants/mwasalatRoles.js';
import MwasalatLanguageToggle from '../../components/mwasalat/MwasalatLanguageToggle.jsx';
import MwasalatGoogleButton from '../../components/mwasalat/MwasalatGoogleButton.jsx';
import MwasalatTwoFactorChallenge from '../../components/mwasalat/MwasalatTwoFactorChallenge.jsx';
import MwasalatPasswordExpiredChallenge from '../../components/mwasalat/MwasalatPasswordExpiredChallenge.jsx';

const QUOTE_IDS = ['safeTrip', 'skilledPeople', 'learnToday'];

export default function MwasalatLogin() {
  const { t } = useTranslation('mwasalatApp');
  const navigate = useNavigate();
  const location = useLocation();
  // Set by the landing page ("Enroll Now" / "Explore All Courses") so login
  // lands the learner back on the course/catalog they came for instead of
  // dropping them on the generic dashboard.
  const redirectTo = location.state?.redirectTo;
  const { isAuthenticated, user } = useMwasalatAuthStore();
  const [showPassword, setShowPassword] = useState(false);
  const [quoteIdx, setQuoteIdx] = useState(0);
  const [twoFactorChallenge, setTwoFactorChallenge] = useState(null);
  const [passwordExpiredChallenge, setPasswordExpiredChallenge] = useState(null);

  useEffect(() => {
    const timer = setInterval(() => setQuoteIdx((i) => (i + 1) % QUOTE_IDS.length), 5000);
    return () => clearInterval(timer);
  }, []);

  const { register, handleSubmit, formState: { errors } } = useForm();

  const goToDashboard = () => {
    const loggedInUser = useMwasalatAuthStore.getState().user;
    navigate(redirectTo || MWASALAT_ROLE_DASHBOARD[loggedInUser?.role] || '/');
  };

  const { mutate, isPending } = useMutation({
    mutationFn: mwasalatAuthService.login,
    onSuccess: (data) => {
      if (data?.requiresPasswordChange) { setPasswordExpiredChallenge(data.challengeToken); return; }
      if (data?.requires2FA) { setTwoFactorChallenge(data.challengeToken); return; }
      goToDashboard();
    },
    onError: (err) => toast.error(err.response?.data?.message || t('auth.errors.loginFailed')),
  });

  const { mutate: googleMutate } = useMutation({
    mutationFn: mwasalatAuthService.googleLogin,
    onSuccess: (data) => {
      if (data?.requires2FA) { setTwoFactorChallenge(data.challengeToken); return; }
      goToDashboard();
    },
    onError: (err) => toast.error(err.response?.data?.message || t('auth.errors.loginFailed')),
  });

  if (isAuthenticated && ['learner', 'external_learner'].includes(user?.role)) {
    return <Navigate to={redirectTo || MWASALAT_ROLE_DASHBOARD[user.role]} replace />;
  }

  const quoteId = QUOTE_IDS[quoteIdx];

  return (
    <div className="min-h-screen bg-gradient-to-br from-mwasalatInk-100 via-white to-mwasalatRed-100 flex flex-col relative overflow-hidden">

      {/* Floating decorative elements */}
      <div className="absolute top-[12%] end-[13%] w-3 h-3 rounded-full bg-purple-400/70" />
      <div className="absolute top-[38%] end-[5%] w-4 h-4 rounded-full bg-purple-500/55" />
      <div className="absolute top-[14%] start-[9%] w-4 h-4 rotate-45 border-2 border-mwasalatInk-500/40 rounded-sm" />
      <div className="absolute bottom-[22%] start-[7%] text-mwasalatInk-400/65 text-2xl font-light leading-none select-none">+</div>
      <div className="absolute bottom-[18%] end-[10%] w-4 h-4 rounded-full border-2 border-mwasalatInk-400/50" />

      <div className="absolute top-4 end-4 z-20">
        <MwasalatLanguageToggle className="!text-mwasalatInk-500 !border-mwasalatInk-200 hover:!border-mwasalatInk-400 bg-white/70 backdrop-blur" />
      </div>

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
            <div className="absolute -end-10 -top-12 w-44 h-44 rounded-full bg-white/10" />
            <div className="absolute end-10 top-[38%] w-3 h-3 rounded-full bg-mwasalatRed-300" />
            <div className="absolute end-16 bottom-24 w-24 h-24 rounded-full bg-white/5" />
            <div className="absolute end-6 bottom-10 w-3 h-3 rotate-45 bg-mwasalatRed-300/80" />

            <div className="relative z-10">
              <Link to="/" className="inline-flex">
                <img src="/mwasalat-logo.png" alt="Mwasalat" className="h-16 w-auto object-contain" />
              </Link>
            </div>

            <div className="relative z-10 flex flex-col gap-6">
              <div>
                <p className="text-xs font-bold tracking-widest text-mwasalatInk-200 uppercase mb-2">{t('auth.login.badge')}</p>
                <h2 className="text-2xl font-bold text-white leading-snug">
                  {t('auth.login.heroTitleLine1')}<br />{t('auth.login.heroTitleLine2')}
                </h2>
              </div>

              <div className="rounded-2xl p-4 bg-white/10">
                <Quote className="w-5 h-5 text-mwasalatInk-200 mb-2.5" strokeWidth={2.5} />
                <p className="text-sm text-white/90 leading-relaxed italic">
                  &ldquo;{t(`auth.login.quotes.${quoteId}.quote`)}&rdquo;
                </p>
                <p className="text-xs text-white/60 mt-2.5 font-medium">— {t(`auth.login.quotes.${quoteId}.author`)}</p>
                <div className="flex gap-1.5 mt-3">
                  {QUOTE_IDS.map((id, i) => (
                    <button
                      key={id}
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
              <p className="text-xs text-white/70">{t('auth.login.tagline')}</p>
            </div>
          </div>

          {/* Right form panel */}
          <div className="flex-1 bg-white p-8 flex flex-col justify-center">

            <div className="md:hidden mb-6 flex items-center gap-3">
              <Link to="/">
                <img src="/mwasalat-logo.png" alt="Mwasalat" className="h-12 w-auto object-contain" />
              </Link>
              <span className="inline-flex items-center gap-1.5 bg-mwasalatInk-100 rounded-full px-3 py-1">
                <ShieldCheck className="w-3 h-3 text-mwasalatInk-500" />
                <span className="text-mwasalatInk-500 text-xs font-semibold">{t('auth.login.badge')}</span>
              </span>
            </div>

            {passwordExpiredChallenge ? (
              <MwasalatPasswordExpiredChallenge
                challengeToken={passwordExpiredChallenge}
                onSuccess={goToDashboard}
                onBack={() => setPasswordExpiredChallenge(null)}
              />
            ) : twoFactorChallenge ? (
              <MwasalatTwoFactorChallenge
                challengeToken={twoFactorChallenge}
                onSuccess={goToDashboard}
                onBack={() => setTwoFactorChallenge(null)}
              />
            ) : (
              <>
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <h2 className="text-2xl font-bold text-[#1E293B] mb-1">{t('auth.login.title')}</h2>
                    <p className="text-sm text-[#475569]">{t('auth.login.subtitle')}</p>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-mwasalatInk-100 flex items-center justify-center flex-shrink-0">
                    <ShieldCheck className="w-5 h-5 text-mwasalatInk-500" />
                  </div>
                </div>

                <form onSubmit={handleSubmit((data) => mutate({ ...data, expectedRole: ['external_learner'] }))} className="space-y-4">

                  <div>
                    <label className="block text-sm font-medium text-[#1E293B] mb-1.5">{t('auth.fields.email')}</label>
                    <div className="relative">
                      <div className="absolute start-3.5 top-1/2 -translate-y-1/2 pointer-events-none">
                        <Mail className={`w-4 h-4 ${errors.email ? 'text-[#C22033]' : 'text-[#94A3B8]'}`} />
                      </div>
                      <input
                        type="email"
                        dir="ltr"
                        placeholder={t('auth.login.emailPlaceholder')}
                        className={`w-full ps-10 pe-4 py-2.5 rounded-xl border text-sm bg-white text-[#1E293B] placeholder:text-[#94A3B8] focus:outline-none focus:ring-2 transition-colors text-start ${
                          errors.email ? 'border-[#C22033] focus:ring-[#C22033]/20' : 'border-[#E2E8F0] hover:border-mwasalatInk-300 focus:ring-mwasalatInk-500/20'
                        }`}
                        {...register('email', { required: t('auth.errors.emailRequired') })}
                      />
                    </div>
                    {errors.email && <p className="text-xs text-[#C22033] mt-1">{errors.email.message}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[#1E293B] mb-1.5">{t('auth.fields.password')}</label>
                    <div className="relative">
                      <div className="absolute start-3.5 top-1/2 -translate-y-1/2 pointer-events-none">
                        <Lock className={`w-4 h-4 ${errors.password ? 'text-[#C22033]' : 'text-[#94A3B8]'}`} />
                      </div>
                      <input
                        type={showPassword ? 'text' : 'password'}
                        dir="ltr"
                        placeholder="••••••••"
                        className={`w-full ps-10 pe-10 py-2.5 rounded-xl border text-sm bg-white text-[#1E293B] placeholder:text-[#94A3B8] focus:outline-none focus:ring-2 transition-colors text-start ${
                          errors.password ? 'border-[#C22033] focus:ring-[#C22033]/20' : 'border-[#E2E8F0] hover:border-mwasalatInk-300 focus:ring-mwasalatInk-500/20'
                        }`}
                        {...register('password', { required: t('auth.errors.passwordRequired') })}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((v) => !v)}
                        className="absolute end-3.5 top-1/2 -translate-y-1/2 text-[#94A3B8] hover:text-[#475569] transition-colors"
                        tabIndex={-1}
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    {errors.password && <p className="text-xs text-[#C22033] mt-1">{errors.password.message}</p>}
                    <div className="text-end mt-1.5">
                      <a href="/forgot-password" className="text-xs text-mwasalatInk-500 hover:underline font-medium">{t('auth.forgotPasswordLink')}</a>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isPending}
                    className="w-full flex items-center justify-center gap-2 bg-mwasalatInk-500 hover:bg-mwasalatInk-400 disabled:opacity-60 text-white font-semibold px-6 py-3 rounded-xl transition-colors text-sm"
                  >
                    {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
                    {isPending ? t('auth.login.submitPending') : t('auth.login.submitIdle')}
                  </button>
                </form>

                <div className="flex items-center gap-3 my-5">
                  <div className="flex-1 h-px bg-[#E2E8F0]" />
                  <span className="text-xs text-[#94A3B8] font-medium">{t('auth.orDivider')}</span>
                  <div className="flex-1 h-px bg-[#E2E8F0]" />
                </div>

                <MwasalatGoogleButton
                  onCredential={(idToken) => googleMutate({ idToken, expectedRole: ['external_learner'] })}
                  onError={() => toast.error(t('auth.errors.loginFailed'))}
                />

                <p className="text-center text-xs text-[#94A3B8] mt-4">
                  {t('auth.login.newHere')}{' '}
                  <a href="/register/external" className="text-mwasalatInk-500 hover:underline font-medium">{t('auth.login.createAccount')}</a>
                </p>
                <p className="text-center text-xs text-[#94A3B8] mt-3">
                  {t('auth.login.backTo')}{' '}
                  <a href="/" className="text-mwasalatInk-500 hover:underline font-medium">{t('auth.login.mwasalatHome')}</a>
                </p>
              </>
            )}
          </div>
        </div>

        <p className="text-xs text-[#94A3B8] mt-5 mb-4">© <span dir="ltr">{new Date().getFullYear()}</span> {t('auth.copyright')}</p>
      </div>
    </div>
  );
}
