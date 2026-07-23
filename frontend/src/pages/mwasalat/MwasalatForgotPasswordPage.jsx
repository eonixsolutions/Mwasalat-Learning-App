import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useMutation } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Mail, Loader2, MailCheck } from 'lucide-react';
import { mwasalatAuthService } from '../../services/mwasalatAuth.service.js';
import MwasalatLanguageToggle from '../../components/mwasalat/MwasalatLanguageToggle.jsx';

const inputClass = 'w-full ps-10 pe-4 py-2.5 rounded-xl border border-[#E2E8F0] text-sm bg-white text-[#1E293B] placeholder:text-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-mwasalatInk-500/20 hover:border-mwasalatInk-300 transition-colors';

export default function MwasalatForgotPasswordPage() {
  const { t } = useTranslation('mwasalatApp');
  const [sent, setSent] = useState(false);
  const { register, handleSubmit, formState: { errors } } = useForm();

  const { mutate, isPending } = useMutation({
    mutationFn: mwasalatAuthService.forgotPassword,
    onSuccess: () => setSent(true),
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-mwasalatInk-100 via-white to-mwasalatRed-100 flex items-center justify-center p-4 relative">
      <div className="absolute top-4 end-4 z-20">
        <MwasalatLanguageToggle className="!text-mwasalatInk-500 !border-mwasalatInk-200 hover:!border-mwasalatInk-400 bg-white/70 backdrop-blur" />
      </div>
      <div className="bg-white rounded-2xl p-8 max-w-md w-full" style={{ boxShadow: '0 4px 32px rgba(0,0,0,0.09)' }}>
        <div className="flex items-center justify-center mb-6">
          <a href="/mwasalat">
            <img src="/mwasalat-logo.png" alt="Mwasalat" className="h-12 w-auto object-contain" />
          </a>
        </div>

        {sent ? (
          <div className="text-center">
            <MailCheck className="w-10 h-10 text-mwasalatInk-500 mx-auto mb-3" />
            <h2 className="text-lg font-semibold text-[#1E293B] mb-1">{t('auth.forgotPassword.sentTitle')}</h2>
            <p className="text-sm text-[#475569]">{t('auth.forgotPassword.sentBody')}</p>
          </div>
        ) : (
          <>
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-[#1E293B] mb-1">{t('auth.forgotPassword.title')}</h2>
              <p className="text-sm text-[#475569]">{t('auth.forgotPassword.subtitle')}</p>
            </div>

            <form onSubmit={handleSubmit((data) => mutate(data.email))} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#1E293B] mb-1.5">{t('auth.fields.email')}</label>
                <div className="relative">
                  <div className="absolute start-3.5 top-1/2 -translate-y-1/2 pointer-events-none">
                    <Mail className={`w-4 h-4 ${errors.email ? 'text-[#C22033]' : 'text-[#94A3B8]'}`} />
                  </div>
                  <input type="email" dir="ltr" className={`${inputClass} text-start`} {...register('email', { required: t('auth.errors.emailRequired') })} />
                </div>
                {errors.email && <p className="text-xs text-[#C22033] mt-1">{errors.email.message}</p>}
              </div>

              <button
                type="submit"
                disabled={isPending}
                className="w-full flex items-center justify-center gap-2 bg-mwasalatInk-500 hover:bg-mwasalatInk-400 disabled:opacity-60 text-white font-semibold px-6 py-3 rounded-xl transition-colors text-sm"
              >
                {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />}
                {isPending ? t('auth.forgotPassword.submitPending') : t('auth.forgotPassword.submitIdle')}
              </button>
            </form>
          </>
        )}

        <p className="text-center text-xs text-[#94A3B8] mt-6">
          <a href="/mwasalat/login" className="text-mwasalatInk-500 hover:underline font-medium">{t('auth.forgotPassword.backToLogin')}</a>
        </p>
      </div>
    </div>
  );
}
