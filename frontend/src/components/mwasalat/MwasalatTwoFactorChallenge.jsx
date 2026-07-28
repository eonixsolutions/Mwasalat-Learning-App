import { useForm } from 'react-hook-form';
import { useMutation } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { Loader2, KeyRound, ArrowLeft } from 'lucide-react';
import { mwasalatAuthService } from '../../services/mwasalatAuth.service.js';

// Shown in place of the login form once the backend responds with
// requires2FA — accepts either a live TOTP code or a one-time backup code.
export default function MwasalatTwoFactorChallenge({ challengeToken, onSuccess, onBack }) {
  const { t } = useTranslation('mwasalatApp');
  const { register, handleSubmit, formState: { errors } } = useForm();

  const { mutate, isPending } = useMutation({
    mutationFn: (data) => mwasalatAuthService.verifyTwoFactorLogin({ challengeToken, token: data.token }),
    onSuccess,
    onError: (err) => toast.error(err.response?.data?.message || t('auth.twoFactor.verifyFailed')),
  });

  return (
    <div>
      <div className="flex items-start justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-[#1E293B] mb-1">{t('auth.twoFactor.challengeTitle')}</h2>
          <p className="text-sm text-[#475569]">{t('auth.twoFactor.challengeSubtitle')}</p>
        </div>
        <div className="w-10 h-10 rounded-xl bg-mwasalatInk-100 flex items-center justify-center flex-shrink-0">
          <KeyRound className="w-5 h-5 text-mwasalatInk-500" />
        </div>
      </div>

      <form onSubmit={handleSubmit((data) => mutate(data))} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-[#1E293B] mb-1.5">{t('auth.twoFactor.codeLabel')}</label>
          <input
            type="text"
            inputMode="numeric"
            dir="ltr"
            autoFocus
            placeholder={t('auth.twoFactor.codePlaceholder')}
            className={`w-full px-4 py-2.5 rounded-xl border text-sm bg-white text-[#1E293B] text-center tracking-[0.3em] font-mono placeholder:text-[#94A3B8] placeholder:tracking-normal placeholder:font-sans focus:outline-none focus:ring-2 transition-colors ${errors.token ? 'border-[#C22033] focus:ring-[#C22033]/20' : 'border-[#E2E8F0] hover:border-mwasalatInk-300 focus:ring-mwasalatInk-500/20'}`}
            {...register('token', { required: t('auth.twoFactor.codeRequired') })}
          />
          {errors.token && <p className="text-xs text-[#C22033] mt-1">{errors.token.message}</p>}
          <p className="text-xs text-[#94A3B8] mt-1.5">{t('auth.twoFactor.backupCodeHint')}</p>
        </div>

        <button
          type="submit"
          disabled={isPending}
          className="w-full flex items-center justify-center gap-2 bg-mwasalatInk-500 hover:bg-mwasalatInk-400 disabled:opacity-60 text-white font-semibold px-6 py-3 rounded-xl transition-colors text-sm"
        >
          {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <KeyRound className="w-4 h-4" />}
          {isPending ? t('auth.twoFactor.verifying') : t('auth.twoFactor.verifyCta')}
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
