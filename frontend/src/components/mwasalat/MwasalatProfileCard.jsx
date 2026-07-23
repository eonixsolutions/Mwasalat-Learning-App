import { useState, useRef, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useMutation } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { User, KeyRound, Loader2, Save, Eye, EyeOff, Mail, Phone, ShieldCheck, Camera } from 'lucide-react';
import { mwasalatAuthService } from '../../services/mwasalatAuth.service.js';
import { useMwasalatAuthStore } from '../../store/mwasalatAuthStore.js';
import { STRONG_PASSWORD_REGEX } from '../../utils/passwordPolicy.js';

const ALLOWED_AVATAR_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_AVATAR_BYTES = 5 * 1024 * 1024;

const inputClass = 'w-full px-3.5 py-2.5 rounded-xl border border-[#E2E8F0] text-sm bg-white text-[#1E293B] placeholder:text-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-mwasalatInk-500/20 hover:border-mwasalatInk-300 transition-colors';

function PasswordField({ show, setShow, error, ...props }) {
  return (
    <div className="relative">
      <input type={show ? 'text' : 'password'} dir="ltr" className={`${inputClass} text-start`} {...props} />
      <button
        type="button"
        onClick={() => setShow((v) => !v)}
        className="absolute end-3.5 top-1/2 -translate-y-1/2 text-[#94A3B8] hover:text-[#475569] transition-colors"
        tabIndex={-1}
      >
        {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
      </button>
    </div>
  );
}

export default function MwasalatProfileCard() {
  const { t } = useTranslation('mwasalatApp');
  const { user } = useMwasalatAuthStore();
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const fileInputRef = useRef(null);

  useEffect(() => () => { if (avatarPreview) URL.revokeObjectURL(avatarPreview); }, [avatarPreview]);

  const profileForm = useForm({ defaultValues: { name: user?.name ?? '', phone: user?.phone ?? '' } });
  const passwordForm = useForm();

  const { mutate: saveProfile, isPending: isSavingProfile } = useMutation({
    mutationFn: mwasalatAuthService.updateProfile,
    onSuccess: () => {
      toast.success(t('profile.updated'));
      setAvatarFile(null);
      setAvatarPreview(null);
    },
    onError: (err) => toast.error(err.response?.data?.message || t('profile.updateFailed')),
  });

  const handleAvatarPick = (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (!ALLOWED_AVATAR_TYPES.includes(file.type)) {
      toast.error(t('profile.photoInvalidType'));
      return;
    }
    if (file.size > MAX_AVATAR_BYTES) {
      toast.error(t('profile.photoTooLarge'));
      return;
    }
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

  const { mutate: savePassword, isPending: isSavingPassword } = useMutation({
    mutationFn: mwasalatAuthService.changePassword,
    onSuccess: () => {
      toast.success(t('profile.passwordChanged'));
      passwordForm.reset();
    },
    onError: (err) => toast.error(err.response?.data?.message || t('profile.passwordChangeFailed')),
  });

  const newPassword = passwordForm.watch('newPassword');

  return (
    <div className="max-w-2xl">
      {/* Hero */}
      <div
        className="relative overflow-hidden rounded-2xl p-6 sm:p-7 mb-6"
        style={{ background: 'linear-gradient(120deg, #23181A 0%, #4A3336 55%, #8C6B6E 100%)' }}
      >
        <div className="absolute -end-10 -top-10 w-48 h-48 rounded-full bg-white/10" />
        <div className="absolute end-16 -bottom-16 w-40 h-40 rounded-full bg-white/5" />
        <div className="relative flex items-center gap-4">
          <div className="relative w-16 h-16 flex-shrink-0">
            {(avatarPreview || user?.avatarUrl) ? (
              <img
                src={avatarPreview || user.avatarUrl}
                alt=""
                className="w-16 h-16 rounded-2xl object-cover bg-white/20"
              />
            ) : (
              <div className="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center text-white text-2xl font-bold">
                {user?.name?.[0]?.toUpperCase() ?? 'U'}
              </div>
            )}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              title={t('profile.changePhoto')}
              className="absolute -end-1.5 -bottom-1.5 w-6 h-6 rounded-full bg-white text-mwasalatInk-500 flex items-center justify-center shadow-sm hover:bg-mwasalatInk-100 transition-colors"
            >
              <Camera className="w-3.5 h-3.5" />
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleAvatarPick}
              className="hidden"
            />
          </div>
          <div className="min-w-0">
            <h1 className="text-xl sm:text-2xl font-bold text-white truncate">{user?.name}</h1>
            <p className="text-white/80 text-sm truncate" dir="ltr">{user?.email}</p>
            <span className="inline-flex items-center gap-1.5 mt-2 text-xs font-semibold text-white bg-white/15 px-2.5 py-1 rounded-full">
              <ShieldCheck className="w-3 h-3" /> {t(`profile.roles.${user?.role}`, { defaultValue: user?.role })}
            </span>
          </div>
        </div>
      </div>

      {/* Profile info */}
      <div className="card p-5 mb-5">
        <div className="flex items-center gap-2.5 mb-4">
          <div className="w-9 h-9 rounded-xl bg-mwasalatInk-100 flex items-center justify-center flex-shrink-0">
            <User className="w-4 h-4 text-mwasalatInk-500" />
          </div>
          <div>
            <p className="text-sm font-semibold text-[#1E293B]">{t('profile.infoTitle')}</p>
            <p className="text-xs text-[#94A3B8]">{t('profile.infoSubtitle')}</p>
          </div>
        </div>

        <form onSubmit={profileForm.handleSubmit((data) => saveProfile({ ...data, avatarFile }))} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[#1E293B] mb-1.5">{t('common.name')}</label>
            <input
              className={inputClass}
              {...profileForm.register('name', { required: t('profile.nameRequired') })}
            />
            {profileForm.formState.errors.name && (
              <p className="text-xs text-mwasalatRed-500 mt-1">{profileForm.formState.errors.name.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-[#1E293B] mb-1.5">{t('common.phone')}</label>
            <div className="relative">
              <div className="absolute start-3.5 top-1/2 -translate-y-1/2 pointer-events-none">
                <Phone className="w-4 h-4 text-[#94A3B8]" />
              </div>
              <input
                dir="ltr"
                placeholder={t('profile.phonePlaceholder')}
                className={`${inputClass} ps-10 text-start`}
                {...profileForm.register('phone')}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-[#1E293B] mb-1.5">{t('common.email')}</label>
            <div className="relative">
              <div className="absolute start-3.5 top-1/2 -translate-y-1/2 pointer-events-none">
                <Mail className="w-4 h-4 text-[#94A3B8]" />
              </div>
              <input value={user?.email ?? ''} dir="ltr" disabled className={`${inputClass} ps-10 text-start bg-[#F8F9FB] text-[#94A3B8] cursor-not-allowed`} />
            </div>
            <p className="text-xs text-[#94A3B8] mt-1">{t('profile.emailImmutableNote')}</p>
          </div>

          <button
            type="submit"
            disabled={isSavingProfile}
            className="inline-flex items-center justify-center gap-2 bg-mwasalatInk-500 hover:bg-mwasalatInk-400 disabled:opacity-60 text-white font-semibold px-5 py-2.5 rounded-xl transition-colors text-sm"
          >
            {isSavingProfile ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {isSavingProfile ? t('profile.saving') : t('profile.saveChanges')}
          </button>
        </form>
      </div>

      {/* Change password */}
      <div className="card p-5">
        <div className="flex items-center gap-2.5 mb-4">
          <div className="w-9 h-9 rounded-xl bg-mwasalatRed-100 flex items-center justify-center flex-shrink-0">
            <KeyRound className="w-4 h-4 text-mwasalatRed-600" />
          </div>
          <div>
            <p className="text-sm font-semibold text-[#1E293B]">{t('profile.changePasswordTitle')}</p>
            <p className="text-xs text-[#94A3B8]">{t('profile.changePasswordSubtitle')}</p>
          </div>
        </div>

        <form onSubmit={passwordForm.handleSubmit((data) => savePassword(data))} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[#1E293B] mb-1.5">{t('profile.currentPassword')}</label>
            <PasswordField
              show={showCurrent}
              setShow={setShowCurrent}
              placeholder="••••••••"
              {...passwordForm.register('currentPassword', { required: t('profile.currentPasswordRequired') })}
            />
            {passwordForm.formState.errors.currentPassword && (
              <p className="text-xs text-mwasalatRed-500 mt-1">{passwordForm.formState.errors.currentPassword.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-[#1E293B] mb-1.5">{t('auth.fields.newPassword')}</label>
            <PasswordField
              show={showNew}
              setShow={setShowNew}
              placeholder={t('auth.placeholders.passwordMin')}
              {...passwordForm.register('newPassword', {
                required: t('profile.newPasswordRequired'),
                minLength: { value: 8, message: t('profile.newPasswordMinLength') },
                pattern: { value: STRONG_PASSWORD_REGEX, message: t('auth.errors.passwordComplexity') },
              })}
            />
            {passwordForm.formState.errors.newPassword && (
              <p className="text-xs text-mwasalatRed-500 mt-1">{passwordForm.formState.errors.newPassword.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-[#1E293B] mb-1.5">{t('profile.confirmNewPassword')}</label>
            <input
              type="password"
              dir="ltr"
              placeholder="••••••••"
              className={`${inputClass} text-start`}
              {...passwordForm.register('confirmPassword', {
                required: t('profile.confirmPasswordRequired'),
                validate: (v) => v === newPassword || t('profile.passwordMismatch'),
              })}
            />
            {passwordForm.formState.errors.confirmPassword && (
              <p className="text-xs text-mwasalatRed-500 mt-1">{passwordForm.formState.errors.confirmPassword.message}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={isSavingPassword}
            className="inline-flex items-center justify-center gap-2 bg-mwasalatRed-500 hover:bg-mwasalatRed-600 disabled:opacity-60 text-white font-semibold px-5 py-2.5 rounded-xl transition-colors text-sm"
          >
            {isSavingPassword ? <Loader2 className="w-4 h-4 animate-spin" /> : <KeyRound className="w-4 h-4" />}
            {isSavingPassword ? t('profile.updating') : t('profile.changePasswordBtn')}
          </button>
        </form>
      </div>
    </div>
  );
}
