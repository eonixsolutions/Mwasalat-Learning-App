import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { Mail, Loader2, ShieldCheck, Eye, EyeOff, Lock, KeyRound, ArrowLeft } from 'lucide-react';
import { mwasalatAuthService } from '../../services/mwasalatAuth.service.js';
import { STRONG_PASSWORD_REGEX } from '../../utils/passwordPolicy.js';
import MwasalatLanguageToggle from '../../components/mwasalat/MwasalatLanguageToggle.jsx';
import MwasalatCaptcha from '../../components/mwasalat/MwasalatCaptcha.jsx';

const inputClass = 'w-full ps-10 pe-4 py-2.5 rounded-xl border border-[#E2E8F0] text-sm bg-white text-[#1E293B] placeholder:text-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-mwasalatInk-500/20 hover:border-mwasalatInk-300 transition-colors';

export default function MwasalatForgotPasswordPage() {
  const { t } = useTranslation('mwasalatApp');
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [step, setStep] = useState('email'); // 'email' | 'reset'
  const [email, setEmail] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const emailForm = useForm();
  const resetForm = useForm();

  const { mutate: sendOtp, isPending: isSending } = useMutation({
    mutationFn: mwasalatAuthService.forgotPassword,
    onSuccess: (_, variables) => {
      setEmail(variables.email);
      setStep('reset');
      toast.success(t('auth.forgotPassword.otpSentToast'));
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || t('auth.errors.resetFailed'));
      queryClient.invalidateQueries({ queryKey: ['mwasalat-captcha'] });
    },
  });

  const { mutate: resetPassword, isPending: isResetting } = useMutation({
    mutationFn: (data) => mwasalatAuthService.resetPassword({ email, otp: data.otp, password: data.password }),
    onSuccess: () => {
      toast.success(t('auth.resetPassword.successToast'));
      navigate('/login');
    },
    onError: (err) => toast.error(err.response?.data?.message || t('auth.errors.resetFailed')),
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-mwasalatInk-100 via-white to-mwasalatRed-100 flex items-center justify-center p-4 relative">
      <div className="absolute top-4 end-4 z-20">
        <MwasalatLanguageToggle className="!text-mwasalatInk-500 !border-mwasalatInk-200 hover:!border-mwasalatInk-400 bg-white/70 backdrop-blur" />
      </div>
      <div className="bg-white rounded-2xl p-8 max-w-md w-full" style={{ boxShadow: '0 4px 32px rgba(0,0,0,0.09)' }}>
        <div className="flex items-center justify-center mb-6">
          <a href="/">
            <img src="/mwasalat-logo.png" alt="Mwasalat" className="h-12 w-auto object-contain" />
          </a>
        </div>

        {step === 'email' ? (
          <>
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-[#1E293B] mb-1">{t('auth.forgotPassword.title')}</h2>
              <p className="text-sm text-[#475569]">{t('auth.forgotPassword.subtitle')}</p>
            </div>

            <form onSubmit={emailForm.handleSubmit((data) => sendOtp(data))} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#1E293B] mb-1.5">{t('auth.fields.email')}</label>
                <div className="relative">
                  <div className="absolute start-3.5 top-1/2 -translate-y-1/2 pointer-events-none">
                    <Mail className={`w-4 h-4 ${emailForm.formState.errors.email ? 'text-[#C22033]' : 'text-[#94A3B8]'}`} />
                  </div>
                  <input
                    type="email"
                    dir="ltr"
                    className={`${inputClass} text-start`}
                    {...emailForm.register('email', { required: t('auth.errors.emailRequired') })}
                  />
                </div>
                {emailForm.formState.errors.email && <p className="text-xs text-[#C22033] mt-1">{emailForm.formState.errors.email.message}</p>}
              </div>

              <MwasalatCaptcha register={emailForm.register} setValue={emailForm.setValue} error={emailForm.formState.errors.captchaAnswer} />

              <button
                type="submit"
                disabled={isSending}
                className="w-full flex items-center justify-center gap-2 bg-mwasalatInk-500 hover:bg-mwasalatInk-400 disabled:opacity-60 text-white font-semibold px-6 py-3 rounded-xl transition-colors text-sm"
              >
                {isSending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />}
                {isSending ? t('auth.forgotPassword.submitPending') : t('auth.forgotPassword.submitIdle')}
              </button>
            </form>
          </>
        ) : (
          <>
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-[#1E293B] mb-1">{t('auth.resetPassword.title')}</h2>
              <p className="text-sm text-[#475569]">{t('auth.resetPassword.otpSubtitle', { email })}</p>
            </div>

            <form onSubmit={resetForm.handleSubmit((data) => resetPassword(data))} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#1E293B] mb-1.5">{t('auth.resetPassword.otpLabel')}</label>
                <div className="relative">
                  <div className="absolute start-3.5 top-1/2 -translate-y-1/2 pointer-events-none">
                    <KeyRound className={`w-4 h-4 ${resetForm.formState.errors.otp ? 'text-[#C22033]' : 'text-[#94A3B8]'}`} />
                  </div>
                  <input
                    type="text"
                    inputMode="numeric"
                    dir="ltr"
                    maxLength={6}
                    placeholder={t('auth.resetPassword.otpPlaceholder')}
                    className={`${inputClass} text-start tracking-[0.3em] font-mono`}
                    {...resetForm.register('otp', {
                      required: t('auth.resetPassword.otpRequired'),
                      pattern: { value: /^\d{6}$/, message: t('auth.resetPassword.otpInvalid') },
                    })}
                  />
                </div>
                {resetForm.formState.errors.otp && <p className="text-xs text-[#C22033] mt-1">{resetForm.formState.errors.otp.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-[#1E293B] mb-1.5">{t('auth.fields.newPassword')}</label>
                <div className="relative">
                  <div className="absolute start-3.5 top-1/2 -translate-y-1/2 pointer-events-none">
                    <Lock className={`w-4 h-4 ${resetForm.formState.errors.password ? 'text-[#C22033]' : 'text-[#94A3B8]'}`} />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    dir="ltr"
                    placeholder={t('auth.placeholders.passwordMin')}
                    className={`${inputClass} pe-10 text-start`}
                    {...resetForm.register('password', {
                      required: t('auth.errors.passwordRequired'),
                      minLength: { value: 8, message: t('auth.errors.passwordMinLength') },
                      pattern: { value: STRONG_PASSWORD_REGEX, message: t('auth.errors.passwordComplexity') },
                    })}
                  />
                  <button type="button" onClick={() => setShowPassword((v) => !v)} className="absolute end-3.5 top-1/2 -translate-y-1/2 text-[#94A3B8] hover:text-[#475569] transition-colors" tabIndex={-1}>
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {resetForm.formState.errors.password && <p className="text-xs text-[#C22033] mt-1">{resetForm.formState.errors.password.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-[#1E293B] mb-1.5">{t('auth.fields.confirmPassword')}</label>
                <div className="relative">
                  <div className="absolute start-3.5 top-1/2 -translate-y-1/2 pointer-events-none">
                    <Lock className={`w-4 h-4 ${resetForm.formState.errors.confirmPassword ? 'text-[#C22033]' : 'text-[#94A3B8]'}`} />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    dir="ltr"
                    placeholder={t('auth.placeholders.reenterPassword')}
                    className={`${inputClass} text-start`}
                    {...resetForm.register('confirmPassword', {
                      required: t('auth.errors.confirmPasswordRequired'),
                      validate: (v) => v === resetForm.watch('password') || t('auth.errors.passwordMismatch'),
                    })}
                  />
                </div>
                {resetForm.formState.errors.confirmPassword && <p className="text-xs text-[#C22033] mt-1">{resetForm.formState.errors.confirmPassword.message}</p>}
              </div>

              <button
                type="submit"
                disabled={isResetting}
                className="w-full flex items-center justify-center gap-2 bg-mwasalatInk-500 hover:bg-mwasalatInk-400 disabled:opacity-60 text-white font-semibold px-6 py-3 rounded-xl transition-colors text-sm"
              >
                {isResetting ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
                {isResetting ? t('auth.resetPassword.submitPending') : t('auth.resetPassword.submitIdle')}
              </button>

              <button
                type="button"
                onClick={() => { setStep('email'); resetForm.reset(); }}
                className="w-full flex items-center justify-center gap-1.5 text-xs text-[#475569] hover:text-mwasalatInk-500 transition-colors py-1"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                {t('auth.resetPassword.startOver')}
              </button>
            </form>
          </>
        )}

        <p className="text-center text-xs text-[#94A3B8] mt-6">
          <a href="/login" className="text-mwasalatInk-500 hover:underline font-medium">{t('auth.forgotPassword.backToLogin')}</a>
        </p>
      </div>
    </div>
  );
}
