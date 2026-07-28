import { useForm } from 'react-hook-form';
import { useMutation } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { Phone, Loader2, ShieldCheck } from 'lucide-react';
import { mwasalatAuthService } from '../../services/mwasalatAuth.service.js';
import { useMwasalatAuthStore } from '../../store/mwasalatAuthStore.js';
import { MWASALAT_ROLE_LOGIN } from '../../constants/mwasalatRoles.js';

const inputClass = 'w-full ps-10 pe-4 py-2.5 rounded-xl border text-sm bg-white text-[#1E293B] placeholder:text-[#94A3B8] focus:outline-none focus:ring-2 transition-colors';

// Gate for accounts that predate the mobile-number requirement (old
// self-registrations, old bulk imports) or that were created via Google
// one-click sign-in (no form step to collect a phone at all). Mounted once
// in MwasalatLearnerLayout, which every learner + external_learner page
// renders through, so it reliably catches the account until phone is set —
// no separate route/guard wiring needed per page.
export default function MwasalatCompleteProfileModal() {
  const { t } = useTranslation('mwasalatApp');
  const navigate = useNavigate();
  const { user } = useMwasalatAuthStore();
  const { register, handleSubmit, formState: { errors } } = useForm();

  const { mutate, isPending } = useMutation({
    mutationFn: ({ phone }) => mwasalatAuthService.updateProfile({ name: user?.name, phone }),
    onSuccess: () => toast.success(t('profile.updated')),
    onError: (err) => toast.error(err.response?.data?.message || t('auth.completeProfile.saveFailed')),
  });

  const handleLogout = () => {
    const loginPath = MWASALAT_ROLE_LOGIN[user?.role] || '/login';
    mwasalatAuthService.logout();
    navigate(loginPath);
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-[100]">
      <div className="bg-white rounded-2xl p-7 max-w-sm w-full" style={{ boxShadow: '0 4px 32px rgba(0,0,0,0.12)' }}>
        <div className="w-11 h-11 rounded-2xl bg-mwasalatInk-100 flex items-center justify-center mb-4">
          <ShieldCheck className="w-5 h-5 text-mwasalatInk-500" />
        </div>
        <h2 className="text-lg font-bold text-[#1E293B] mb-1.5">{t('auth.completeProfile.title')}</h2>
        <p className="text-sm text-[#475569] mb-5">{t('auth.completeProfile.body')}</p>

        <form onSubmit={handleSubmit((data) => mutate(data))} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[#1E293B] mb-1.5">{t('auth.fields.mobile')}</label>
            <div className="relative">
              <div className="absolute start-3.5 top-1/2 -translate-y-1/2 pointer-events-none">
                <Phone className={`w-4 h-4 ${errors.phone ? 'text-[#C22033]' : 'text-[#94A3B8]'}`} />
              </div>
              <input
                type="tel"
                dir="ltr"
                autoFocus
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

          <button
            type="submit"
            disabled={isPending}
            className="w-full flex items-center justify-center gap-2 bg-mwasalatInk-500 hover:bg-mwasalatInk-400 disabled:opacity-60 text-white font-semibold px-6 py-2.5 rounded-xl transition-colors text-sm"
          >
            {isPending && <Loader2 className="w-4 h-4 animate-spin" />}
            {isPending ? t('auth.completeProfile.saving') : t('auth.completeProfile.submit')}
          </button>
        </form>

        <button
          type="button"
          onClick={handleLogout}
          className="w-full text-center text-xs text-[#94A3B8] hover:text-[#475569] mt-4 transition-colors"
        >
          {t('auth.completeProfile.logoutInstead')}
        </button>
      </div>
    </div>
  );
}
