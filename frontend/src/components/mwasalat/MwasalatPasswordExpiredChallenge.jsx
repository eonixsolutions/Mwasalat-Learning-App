import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useMutation } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { Loader2, ShieldAlert, ArrowLeft, Eye, EyeOff } from 'lucide-react';
import { mwasalatAuthService } from '../../services/mwasalatAuth.service.js';
import MwasalatTwoFactorChallenge from './MwasalatTwoFactorChallenge.jsx';

// Shown in place of the login form once the backend responds with
// requiresPasswordChange — the account's password has aged past the
// admin-configured expiry policy (Settings > Security). Forces a new
// password before the session is issued, then falls through to the normal
// 2FA challenge if the account has that enabled too.
export default function MwasalatPasswordExpiredChallenge({ challengeToken, onSuccess, onBack }) {
  const { t } = useTranslation('mwasalatApp');
  const [showPassword, setShowPassword] = useState(false);
  const [twoFactorChallenge, setTwoFactorChallenge] = useState(null);
  const { register, handleSubmit, watch, formState: { errors } } = useForm();

  const { mutate, isPending } = useMutation({
    mutationFn: (data) => mwasalatAuthService.resetExpiredPassword({ challengeToken, newPassword: data.newPassword }),
    onSuccess: (data) => {
      if (data?.requires2FA) { setTwoFactorChallenge(data.challengeToken); return; }
      onSuccess();
    },
    onError: (err) => toast.error(err.response?.data?.message || t('auth.passwordExpired.resetFailed')),
  });

  if (twoFactorChallenge) {
    return (
      <MwasalatTwoFactorChallenge
        challengeToken={twoFactorChallenge}
        onSuccess={onSuccess}
        onBack={() => setTwoFactorChallenge(null)}
      />
    );
  }

  return (
    <div>
      <div className="flex items-start justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-[#1E293B] mb-1">{t('auth.passwordExpired.title')}</h2>
          <p className="text-sm text-[#475569]">{t('auth.passwordExpired.subtitle')}</p>
        </div>
        <div className="w-10 h-10 rounded-xl bg-mwasalatInk-100 flex items-center justify-center flex-shrink-0">
          <ShieldAlert className="w-5 h-5 text-mwasalatInk-500" />
        </div>
      </div>

      <form onSubmit={handleSubmit((data) => mutate(data))} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-[#1E293B] mb-1.5">{t('auth.passwordExpired.newPasswordLabel')}</label>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              dir="ltr"
              autoFocus
              placeholder="••••••••"
              className={`w-full px-4 pe-10 py-2.5 rounded-xl border text-sm bg-white text-[#1E293B] placeholder:text-[#94A3B8] focus:outline-none focus:ring-2 transition-colors text-start ${errors.newPassword ? 'border-[#C22033] focus:ring-[#C22033]/20' : 'border-[#E2E8F0] hover:border-mwasalatInk-300 focus:ring-mwasalatInk-500/20'}`}
              {...register('newPassword', { required: t('auth.passwordExpired.newPasswordRequired') })}
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
          {errors.newPassword && <p className="text-xs text-[#C22033] mt-1">{errors.newPassword.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-[#1E293B] mb-1.5">{t('auth.passwordExpired.confirmPasswordLabel')}</label>
          <input
            type={showPassword ? 'text' : 'password'}
            dir="ltr"
            placeholder="••••••••"
            className={`w-full px-4 py-2.5 rounded-xl border text-sm bg-white text-[#1E293B] placeholder:text-[#94A3B8] focus:outline-none focus:ring-2 transition-colors text-start ${errors.confirmPassword ? 'border-[#C22033] focus:ring-[#C22033]/20' : 'border-[#E2E8F0] hover:border-mwasalatInk-300 focus:ring-mwasalatInk-500/20'}`}
            {...register('confirmPassword', {
              required: t('auth.passwordExpired.confirmPasswordRequired'),
              validate: (value) => value === watch('newPassword') || t('auth.passwordExpired.passwordMismatch'),
            })}
          />
          {errors.confirmPassword && <p className="text-xs text-[#C22033] mt-1">{errors.confirmPassword.message}</p>}
        </div>

        <button
          type="submit"
          disabled={isPending}
          className="w-full flex items-center justify-center gap-2 bg-mwasalatInk-500 hover:bg-mwasalatInk-400 disabled:opacity-60 text-white font-semibold px-6 py-3 rounded-xl transition-colors text-sm"
        >
          {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldAlert className="w-4 h-4" />}
          {isPending ? t('auth.passwordExpired.submitPending') : t('auth.passwordExpired.submitCta')}
        </button>

        <button
          type="button"
          onClick={onBack}
          className="w-full flex items-center justify-center gap-1.5 text-xs text-[#475569] hover:text-mwasalatInk-500 transition-colors py-1"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          {t('auth.twoFactor.backToLogin')}
        </button>
      </form>
    </div>
  );
}
