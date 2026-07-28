import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate, Navigate, Link } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { UserPlus, Eye, EyeOff, Loader2, Mail, Lock, User, Phone } from 'lucide-react';
import { mwasalatAuthService } from '../../services/mwasalatAuth.service.js';
import { useMwasalatAuthStore } from '../../store/mwasalatAuthStore.js';
import { STRONG_PASSWORD_REGEX } from '../../utils/passwordPolicy.js';
import MwasalatLanguageToggle from '../../components/mwasalat/MwasalatLanguageToggle.jsx';
import MwasalatGoogleButton from '../../components/mwasalat/MwasalatGoogleButton.jsx';
import MwasalatCaptcha from '../../components/mwasalat/MwasalatCaptcha.jsx';
import MwasalatLegalModal from '../../components/mwasalat/MwasalatLegalModal.jsx';

const inputClass = 'w-full ps-10 pe-4 py-2.5 rounded-xl border text-sm bg-white text-[#1E293B] placeholder:text-[#94A3B8] focus:outline-none focus:ring-2 transition-colors';

export default function MwasalatRegister() {
  const { t } = useTranslation('mwasalatApp');
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { isAuthenticated, user } = useMwasalatAuthStore();
  const [showPassword, setShowPassword] = useState(false);
  const [legalTab, setLegalTab] = useState(null);
  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm();
  const consentAccepted = watch('consentAccepted');

  const { mutate, isPending } = useMutation({
    mutationFn: (data) => mwasalatAuthService.register(data),
    onSuccess: () => {
      toast.success(t('auth.register.welcomeToast'));
      navigate('/learner/dashboard');
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || t('auth.errors.registrationFailed'));
      queryClient.invalidateQueries({ queryKey: ['mwasalat-captcha'] });
    },
  });

  const { mutate: googleMutate } = useMutation({
    mutationFn: mwasalatAuthService.googleLogin,
    onSuccess: () => {
      toast.success(t('auth.register.welcomeToast'));
      navigate('/learner/dashboard');
    },
    onError: (err) => toast.error(err.response?.data?.message || t('auth.errors.registrationFailed')),
  });

  if (isAuthenticated && user) {
    return <Navigate to="/learner/dashboard" replace />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-mwasalatInk-100 via-white to-mwasalatRed-100 flex items-center justify-center p-4 relative">
      <div className="absolute top-4 end-4 z-20">
        <MwasalatLanguageToggle className="!text-mwasalatInk-500 !border-mwasalatInk-200 hover:!border-mwasalatInk-400 bg-white/70 backdrop-blur" />
      </div>
      <div className="bg-white rounded-2xl p-8 max-w-md w-full" style={{ boxShadow: '0 4px 32px rgba(0,0,0,0.09)' }}>
        <div className="flex items-center justify-center mb-6">
          <Link to="/">
            <img src="/mwasalat-logo.png" alt="Mwasalat" className="h-14 w-auto object-contain" />
          </Link>
        </div>

        <div className="text-center mb-6">
          <span className="inline-block mb-2 px-2.5 py-1 rounded-full text-xs font-semibold bg-mwasalatRed-100 text-mwasalatRed-600">
            {t('auth.register.badge')}
          </span>
          <h2 className="text-2xl font-bold text-[#1E293B] mb-1">{t('auth.register.title')}</h2>
          <p className="text-sm text-[#475569]">{t('auth.register.subtitle')}</p>
        </div>

        <form onSubmit={handleSubmit((data) => mutate(data))} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[#1E293B] mb-1.5">{t('auth.fields.fullName')}</label>
            <div className="relative">
              <div className="absolute start-3.5 top-1/2 -translate-y-1/2 pointer-events-none">
                <User className={`w-4 h-4 ${errors.name ? 'text-[#C22033]' : 'text-[#94A3B8]'}`} />
              </div>
              <input
                className={`${inputClass} ${errors.name ? 'border-[#C22033] focus:ring-[#C22033]/20' : 'border-[#E2E8F0] hover:border-mwasalatInk-300 focus:ring-mwasalatInk-500/20'}`}
                {...register('name', { required: t('auth.errors.nameRequired') })}
              />
            </div>
            {errors.name && <p className="text-xs text-[#C22033] mt-1">{errors.name.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-[#1E293B] mb-1.5">{t('auth.fields.email')}</label>
            <div className="relative">
              <div className="absolute start-3.5 top-1/2 -translate-y-1/2 pointer-events-none">
                <Mail className={`w-4 h-4 ${errors.email ? 'text-[#C22033]' : 'text-[#94A3B8]'}`} />
              </div>
              <input
                type="email"
                dir="ltr"
                className={`${inputClass} text-start ${errors.email ? 'border-[#C22033] focus:ring-[#C22033]/20' : 'border-[#E2E8F0] hover:border-mwasalatInk-300 focus:ring-mwasalatInk-500/20'}`}
                {...register('email', { required: t('auth.errors.emailRequired') })}
              />
            </div>
            {errors.email && <p className="text-xs text-[#C22033] mt-1">{errors.email.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-[#1E293B] mb-1.5">{t('auth.fields.mobile')}</label>
            <div className="relative">
              <div className="absolute start-3.5 top-1/2 -translate-y-1/2 pointer-events-none">
                <Phone className={`w-4 h-4 ${errors.phone ? 'text-[#C22033]' : 'text-[#94A3B8]'}`} />
              </div>
              <input
                type="tel"
                dir="ltr"
                placeholder={t('auth.placeholders.mobile')}
                className={`${inputClass} text-start ${errors.phone ? 'border-[#C22033] focus:ring-[#C22033]/20' : 'border-[#E2E8F0] hover:border-mwasalatInk-300 focus:ring-mwasalatInk-500/20'}`}
                {...register('phone', {
                  required: t('auth.errors.mobileRequired'),
                  minLength: { value: 7, message: t('auth.errors.mobileInvalid') },
                })}
              />
            </div>
            {errors.phone && <p className="text-xs text-[#C22033] mt-1">{errors.phone.message}</p>}
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
                placeholder={t('auth.placeholders.passwordMin')}
                className={`${inputClass} pe-10 text-start ${errors.password ? 'border-[#C22033] focus:ring-[#C22033]/20' : 'border-[#E2E8F0] hover:border-mwasalatInk-300 focus:ring-mwasalatInk-500/20'}`}
                {...register('password', {
                  required: t('auth.errors.passwordRequired'),
                  minLength: { value: 8, message: t('auth.errors.passwordMinLength') },
                  pattern: { value: STRONG_PASSWORD_REGEX, message: t('auth.errors.passwordComplexity') },
                })}
              />
              <button type="button" onClick={() => setShowPassword((v) => !v)} className="absolute end-3.5 top-1/2 -translate-y-1/2 text-[#94A3B8] hover:text-[#475569] transition-colors" tabIndex={-1}>
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {errors.password && <p className="text-xs text-[#C22033] mt-1">{errors.password.message}</p>}
          </div>

          <div>
            <label className="flex items-start gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                className="mt-0.5 w-4 h-4 rounded border-[#E2E8F0] text-mwasalatInk-500 focus:ring-mwasalatInk-500/30"
                {...register('consentAccepted', { required: t('auth.errors.consentRequired') })}
              />
              <span className="text-sm text-[#475569]">
                {t('auth.register.consentPrefix')}{' '}
                <button
                  type="button"
                  onClick={(e) => { e.preventDefault(); setLegalTab('terms'); }}
                  className="text-mwasalatInk-500 font-medium hover:underline"
                >
                  {t('legal.termsTab')}
                </button>{' '}
                {t('auth.register.consentAnd')}{' '}
                <button
                  type="button"
                  onClick={(e) => { e.preventDefault(); setLegalTab('privacy'); }}
                  className="text-mwasalatInk-500 font-medium hover:underline"
                >
                  {t('legal.privacyTab')}
                </button>
              </span>
            </label>
            {errors.consentAccepted && <p className="text-xs text-[#C22033] mt-1">{errors.consentAccepted.message}</p>}
          </div>

          <MwasalatCaptcha register={register} setValue={setValue} error={errors.captchaAnswer} />

          <button
            type="submit"
            disabled={isPending}
            className="w-full flex items-center justify-center gap-2 bg-mwasalatInk-500 hover:bg-mwasalatInk-400 disabled:opacity-60 text-white font-semibold px-6 py-3 rounded-xl transition-colors text-sm"
          >
            {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
            {isPending ? t('auth.register.submitPending') : t('auth.register.submitIdle')}
          </button>
        </form>

        <div className="flex items-center gap-3 my-5">
          <div className="flex-1 h-px bg-[#E2E8F0]" />
          <span className="text-xs text-[#94A3B8] font-medium">{t('auth.orDivider')}</span>
          <div className="flex-1 h-px bg-[#E2E8F0]" />
        </div>

        <MwasalatGoogleButton
          onCredential={(idToken) => {
            if (!consentAccepted) {
              toast.error(t('auth.register.consentRequiredForGoogle'));
              return;
            }
            googleMutate({ idToken, expectedRole: 'external_learner' });
          }}
          onError={() => toast.error(t('auth.errors.registrationFailed'))}
        />

        <p className="text-center text-xs text-[#94A3B8] mt-6">
          {t('auth.register.alreadyHaveAccount')}{' '}
          <a href="/login" className="text-mwasalatInk-500 hover:underline font-medium">{t('auth.register.signIn')}</a>
        </p>
      </div>

      <MwasalatLegalModal isOpen={!!legalTab} initialTab={legalTab || 'terms'} onClose={() => setLegalTab(null)} />
    </div>
  );
}
