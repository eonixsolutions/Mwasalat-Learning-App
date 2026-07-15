import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useMutation } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { User, KeyRound, Loader2, Save, Eye, EyeOff, Mail, ShieldCheck } from 'lucide-react';
import { mwasalatAuthService } from '../../services/mwasalatAuth.service.js';
import { useMwasalatAuthStore } from '../../store/mwasalatAuthStore.js';

const inputClass = 'w-full px-3.5 py-2.5 rounded-xl border border-[#E2E8F0] text-sm bg-white text-[#1E293B] placeholder:text-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-mwasalatInk-500/20 hover:border-mwasalatInk-300 transition-colors';

function PasswordField({ show, setShow, error, ...props }) {
  return (
    <div className="relative">
      <input type={show ? 'text' : 'password'} className={inputClass} {...props} />
      <button
        type="button"
        onClick={() => setShow((v) => !v)}
        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#94A3B8] hover:text-[#475569] transition-colors"
        tabIndex={-1}
      >
        {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
      </button>
    </div>
  );
}

export default function MwasalatProfileCard() {
  const { user } = useMwasalatAuthStore();
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);

  const profileForm = useForm({ defaultValues: { name: user?.name ?? '' } });
  const passwordForm = useForm();

  const { mutate: saveProfile, isPending: isSavingProfile } = useMutation({
    mutationFn: mwasalatAuthService.updateProfile,
    onSuccess: () => toast.success('Profile updated'),
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to update profile'),
  });

  const { mutate: savePassword, isPending: isSavingPassword } = useMutation({
    mutationFn: mwasalatAuthService.changePassword,
    onSuccess: () => {
      toast.success('Password changed');
      passwordForm.reset();
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to change password'),
  });

  const newPassword = passwordForm.watch('newPassword');

  return (
    <div className="max-w-2xl">
      {/* Hero */}
      <div
        className="relative overflow-hidden rounded-2xl p-6 sm:p-7 mb-6"
        style={{ background: 'linear-gradient(120deg, #23181A 0%, #4A3336 55%, #8C6B6E 100%)' }}
      >
        <div className="absolute -right-10 -top-10 w-48 h-48 rounded-full bg-white/10" />
        <div className="absolute right-16 -bottom-16 w-40 h-40 rounded-full bg-white/5" />
        <div className="relative flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center text-white text-2xl font-bold flex-shrink-0">
            {user?.name?.[0]?.toUpperCase() ?? 'U'}
          </div>
          <div className="min-w-0">
            <h1 className="text-xl sm:text-2xl font-bold text-white truncate">{user?.name}</h1>
            <p className="text-white/80 text-sm truncate">{user?.email}</p>
            <span className="inline-flex items-center gap-1.5 mt-2 text-xs font-semibold text-white bg-white/15 px-2.5 py-1 rounded-full capitalize">
              <ShieldCheck className="w-3 h-3" /> {user?.role?.replace('_', ' ')}
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
            <p className="text-sm font-semibold text-[#1E293B]">Profile Info</p>
            <p className="text-xs text-[#94A3B8]">Update your display name</p>
          </div>
        </div>

        <form onSubmit={profileForm.handleSubmit((data) => saveProfile(data))} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[#1E293B] mb-1.5">Name</label>
            <input
              className={inputClass}
              {...profileForm.register('name', { required: 'Name is required' })}
            />
            {profileForm.formState.errors.name && (
              <p className="text-xs text-mwasalatRed-500 mt-1">{profileForm.formState.errors.name.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-[#1E293B] mb-1.5">Email</label>
            <div className="relative">
              <div className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none">
                <Mail className="w-4 h-4 text-[#94A3B8]" />
              </div>
              <input value={user?.email ?? ''} disabled className={`${inputClass} pl-10 bg-[#F8F9FB] text-[#94A3B8] cursor-not-allowed`} />
            </div>
            <p className="text-xs text-[#94A3B8] mt-1">Email can't be changed. Contact support if needed.</p>
          </div>

          <button
            type="submit"
            disabled={isSavingProfile}
            className="inline-flex items-center justify-center gap-2 bg-mwasalatInk-500 hover:bg-mwasalatInk-400 disabled:opacity-60 text-white font-semibold px-5 py-2.5 rounded-xl transition-colors text-sm"
          >
            {isSavingProfile ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {isSavingProfile ? 'Saving…' : 'Save Changes'}
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
            <p className="text-sm font-semibold text-[#1E293B]">Change Password</p>
            <p className="text-xs text-[#94A3B8]">Use a strong password you don't use elsewhere</p>
          </div>
        </div>

        <form onSubmit={passwordForm.handleSubmit((data) => savePassword(data))} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[#1E293B] mb-1.5">Current Password</label>
            <PasswordField
              show={showCurrent}
              setShow={setShowCurrent}
              placeholder="••••••••"
              {...passwordForm.register('currentPassword', { required: 'Current password is required' })}
            />
            {passwordForm.formState.errors.currentPassword && (
              <p className="text-xs text-mwasalatRed-500 mt-1">{passwordForm.formState.errors.currentPassword.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-[#1E293B] mb-1.5">New Password</label>
            <PasswordField
              show={showNew}
              setShow={setShowNew}
              placeholder="At least 8 characters"
              {...passwordForm.register('newPassword', {
                required: 'New password is required',
                minLength: { value: 8, message: 'Must be at least 8 characters' },
              })}
            />
            {passwordForm.formState.errors.newPassword && (
              <p className="text-xs text-mwasalatRed-500 mt-1">{passwordForm.formState.errors.newPassword.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-[#1E293B] mb-1.5">Confirm New Password</label>
            <input
              type="password"
              placeholder="••••••••"
              className={inputClass}
              {...passwordForm.register('confirmPassword', {
                required: 'Please confirm your new password',
                validate: (v) => v === newPassword || 'Passwords do not match',
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
            {isSavingPassword ? 'Updating…' : 'Change Password'}
          </button>
        </form>
      </div>
    </div>
  );
}
