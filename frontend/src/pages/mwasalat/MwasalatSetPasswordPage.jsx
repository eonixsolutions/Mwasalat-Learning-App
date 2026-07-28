import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useMutation } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { ShieldCheck, Eye, EyeOff, Loader2, Lock, AlertTriangle } from 'lucide-react';
import { mwasalatAuthService } from '../../services/mwasalatAuth.service.js';
import { STRONG_PASSWORD_REGEX } from '../../utils/passwordPolicy.js';
import { MWASALAT_ROLE_DASHBOARD, MWASALAT_ROLE_LOGIN } from '../../constants/mwasalatRoles.js';
import MwasalatLanguageToggle from '../../components/mwasalat/MwasalatLanguageToggle.jsx';

const inputClass = 'w-full ps-10 pe-10 py-2.5 rounded-xl border border-[#E2E8F0] text-sm bg-white text-[#1E293B] placeholder:text-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-mwasalatInk-500/20 hover:border-mwasalatInk-300 transition-colors';

export default function MwasalatSetPasswordPage() {
  const { t } = useTranslation('mwasalatApp');
  const { token } = useParams();
  const navigate = useNavigate();
  const [invite, setInvite] = useState(null);
  const [invalid, setInvalid] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { register, handleSubmit, watch, formState: { errors } } = useForm();

  useEffect(() => {
    mwasalatAuthService.verifyInvitation(token)
      .then(setInvite)
      .catch(() => setInvalid(true));
  }, [token]);

  const { mutate, isPending } = useMutation({
    mutationFn: async (password) => {
      await mwasalatAuthService.setPassword(token, password);
      await mwasalatAuthService.login({ email: invite.email, password });
    },
    onSuccess: () => {
      toast.success(t('auth.setPassword.welcomeToast'));
      navigate(MWASALAT_ROLE_DASHBOARD[invite?.role] ?? '/instructor/dashboard');
    },
    onError: (err) => toast.error(err.response?.data?.message || t('auth.errors.setPasswordFailed')),
  });

  if (invalid) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-mwasalatInk-100 via-white to-mwasalatRed-100 flex items-center justify-center p-4 relative">
        <div className="absolute top-4 end-4 z-20">
          <MwasalatLanguageToggle className="!text-mwasalatInk-500 !border-mwasalatInk-200 hover:!border-mwasalatInk-400 bg-white/70 backdrop-blur" />
        </div>
        <div className="bg-white rounded-2xl p-8 max-w-sm w-full text-center">
          <AlertTriangle className="w-8 h-8 text-mwasalatRed-500 mx-auto mb-3" />
          <h2 className="text-lg font-semibold text-[#1E293B] mb-1">{t('auth.setPassword.expiredTitle')}</h2>
          <p className="text-sm text-[#475569] mb-4">{t('auth.setPassword.expiredBody')}</p>
          <Link to={MWASALAT_ROLE_LOGIN[invite?.role] ?? MWASALAT_ROLE_LOGIN.instructor} className="text-sm font-medium text-mwasalatInk-500 hover:underline">{t('auth.setPassword.backToLogin')}</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-mwasalatInk-100 via-white to-mwasalatRed-100 flex items-center justify-center p-4 relative">
      <div className="absolute top-4 end-4 z-20">
        <MwasalatLanguageToggle className="!text-mwasalatInk-500 !border-mwasalatInk-200 hover:!border-mwasalatInk-400 bg-white/70 backdrop-blur" />
      </div>
      <div className="bg-white rounded-2xl p-8 max-w-md w-full" style={{ boxShadow: '0 4px 32px rgba(0,0,0,0.09)' }}>
        <div className="flex items-center justify-center mb-6">
          <Link to="/">
            <img src="/mwasalat-logo.png" alt="Mwasalat" className="h-12 w-auto object-contain" />
          </Link>
        </div>

        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-[#1E293B] mb-1">{t('auth.setPassword.title')}</h2>
          {invite ? (
            <p className="text-sm text-[#475569]">{t('auth.setPassword.welcomeMessage', { name: invite.name })}</p>
          ) : (
            <p className="text-sm text-[#94A3B8]">{t('auth.setPassword.checkingInvite')}</p>
          )}
        </div>

        <form onSubmit={handleSubmit((data) => mutate(data.password))} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[#1E293B] mb-1.5">{t('auth.fields.newPassword')}</label>
            <div className="relative">
              <div className="absolute start-3.5 top-1/2 -translate-y-1/2 pointer-events-none">
                <Lock className={`w-4 h-4 ${errors.password ? 'text-[#C22033]' : 'text-[#94A3B8]'}`} />
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                dir="ltr"
                placeholder={t('auth.placeholders.passwordMin')}
                className={`${inputClass} text-start`}
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
            <label className="block text-sm font-medium text-[#1E293B] mb-1.5">{t('auth.fields.confirmPassword')}</label>
            <div className="relative">
              <div className="absolute start-3.5 top-1/2 -translate-y-1/2 pointer-events-none">
                <Lock className={`w-4 h-4 ${errors.confirmPassword ? 'text-[#C22033]' : 'text-[#94A3B8]'}`} />
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                dir="ltr"
                placeholder={t('auth.placeholders.reenterPassword')}
                className={`${inputClass} text-start`}
                {...register('confirmPassword', {
                  required: t('auth.errors.confirmPasswordRequired'),
                  validate: (v) => v === watch('password') || t('auth.errors.passwordMismatch'),
                })}
              />
            </div>
            {errors.confirmPassword && <p className="text-xs text-[#C22033] mt-1">{errors.confirmPassword.message}</p>}
          </div>

          <button
            type="submit"
            disabled={isPending || !invite}
            className="w-full flex items-center justify-center gap-2 bg-mwasalatInk-500 hover:bg-mwasalatInk-400 disabled:opacity-60 text-white font-semibold px-6 py-3 rounded-xl transition-colors text-sm"
          >
            {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
            {isPending ? t('auth.setPassword.submitPending') : t('auth.setPassword.submitIdle')}
          </button>
        </form>
      </div>
    </div>
  );
}
