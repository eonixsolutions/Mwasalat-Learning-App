import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import {
  Mail, Calendar, ShieldCheck, KeyRound, Eye, EyeOff,
  Loader2, Save, X, CheckCircle,
} from 'lucide-react';
import { authService } from '../../../services/auth.service.js';
import { useAuth } from '../../../hooks/useAuth.js';

function InfoRow({ icon: Icon, label, value }) {
  return (
    <div className="flex items-start gap-3 py-3 border-b border-[#F1F5F9] last:border-0">
      <div className="w-8 h-8 rounded-lg bg-[#F1F5F9] flex items-center justify-center flex-shrink-0 mt-0.5">
        <Icon className="w-4 h-4 text-[#475569]" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[11px] font-bold uppercase tracking-wider text-[#94A3B8] mb-0.5">{label}</p>
        <p className="text-sm font-medium text-[#1E293B]">{value || <span className="text-[#CBD5E1] italic">Not set</span>}</p>
      </div>
    </div>
  );
}

function PasswordInput({ id, placeholder, registration, error }) {
  const [show, setShow] = useState(false);
  return (
    <div>
      <div className="relative">
        <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94A3B8]" />
        <input
          id={id}
          type={show ? 'text' : 'password'}
          placeholder={placeholder}
          {...registration}
          className="w-full pl-9 pr-10 py-2.5 border border-[#E2E8F0] rounded-xl text-sm text-[#1E293B] placeholder-[#CBD5E1] focus:outline-none focus:border-[#CA6357] focus:ring-1 focus:ring-[#CA6357]/20"
        />
        <button type="button" onClick={() => setShow(v => !v)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-[#94A3B8] hover:text-[#475569]">
          {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
      </div>
      {error && <p className="text-xs text-[#D96C5F] mt-1">{error.message}</p>}
    </div>
  );
}

export default function AdminProfilePage() {
  const { user } = useAuth();
  const [showPasswordForm, setShowPasswordForm] = useState(false);

  const { register, handleSubmit, reset, formState: { errors }, watch } = useForm();

  const mutation = useMutation({
    mutationFn: authService.changePassword,
    onSuccess: () => {
      toast.success('Password changed successfully');
      setShowPasswordForm(false);
      reset();
    },
    onError: (err) => toast.error(err?.response?.data?.message ?? 'Failed to change password'),
  });

  const onCancel = () => { setShowPasswordForm(false); reset(); };
  const onSubmit = ({ currentPassword, newPassword }) => mutation.mutate({ currentPassword, newPassword });

  const initials = (user?.name ?? '?').split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();
  const memberSince = user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })
    : null;

  return (
    <div className="space-y-6 pb-8">

      {/* Hero */}
      <div className="relative rounded-2xl overflow-hidden p-6 sm:p-8"
        style={{ background: 'linear-gradient(135deg, #CA6357 0%, #A94E43 100%)' }}>
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center gap-5">
          <div className="w-20 h-20 rounded-2xl bg-white/20 flex items-center justify-center flex-shrink-0 text-2xl font-bold text-white">
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold tracking-widest text-[#F2B3AC] uppercase mb-1">My Profile</p>
            <h2 className="text-2xl font-bold text-white mb-1">{user?.name ?? '—'}</h2>
            <p className="text-white/60 text-sm mb-3">{user?.email ?? '—'}</p>
            <span className="inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full"
              style={{ backgroundColor: '#FEF3C7', color: '#B45309' }}>
              <ShieldCheck className="w-3 h-3" />
              Super Admin
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* Account Details */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-2xl p-5" style={{ boxShadow: '0 2px 16px rgba(0,0,0,0.05)' }}>
            <p className="text-xs font-bold uppercase tracking-wider text-[#94A3B8] mb-4">Account Details</p>
            <InfoRow icon={Mail}     label="Email Address" value={user?.email} />
            <InfoRow icon={Calendar} label="Member Since"  value={memberSince} />
            <div className="flex items-start gap-3 py-3">
              <div className="w-8 h-8 rounded-lg bg-[#F1F5F9] flex items-center justify-center flex-shrink-0 mt-0.5">
                <CheckCircle className="w-4 h-4 text-[#22C55E]" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[11px] font-bold uppercase tracking-wider text-[#94A3B8] mb-0.5">Account Status</p>
                <span className="text-[11px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full"
                  style={{ backgroundColor: '#E8F8F2', color: '#22A66E' }}>
                  Active
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Security / Password */}
        <div>
          <div className="bg-white rounded-2xl p-5" style={{ boxShadow: '0 2px 16px rgba(0,0,0,0.05)' }}>
            <div className="flex items-center justify-between mb-4">
              <p className="text-xs font-bold uppercase tracking-wider text-[#94A3B8]">Security</p>
              {!showPasswordForm && (
                <button onClick={() => setShowPasswordForm(true)}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#CA6357] hover:text-[#A94E43] bg-[#FDEFEE] hover:bg-[#F2B3AC] px-2.5 py-1.5 rounded-lg transition-colors">
                  <KeyRound className="w-3 h-3" /> Change Password
                </button>
              )}
            </div>

            {!showPasswordForm ? (
              <div className="flex items-start gap-3 py-3">
                <div className="w-8 h-8 rounded-lg bg-[#F1F5F9] flex items-center justify-center flex-shrink-0">
                  <KeyRound className="w-4 h-4 text-[#475569]" />
                </div>
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-wider text-[#94A3B8] mb-0.5">Password</p>
                  <p className="text-sm text-[#94A3B8] italic">••••••••</p>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-[#475569] mb-1.5">Current Password</label>
                  <PasswordInput
                    id="currentPassword"
                    placeholder="Enter current password"
                    registration={register('currentPassword', { required: 'Current password is required' })}
                    error={errors.currentPassword}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#475569] mb-1.5">New Password</label>
                  <PasswordInput
                    id="newPassword"
                    placeholder="Min. 8 characters"
                    registration={register('newPassword', {
                      required: 'New password is required',
                      minLength: { value: 8, message: 'At least 8 characters required' },
                    })}
                    error={errors.newPassword}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#475569] mb-1.5">Confirm New Password</label>
                  <PasswordInput
                    id="confirmPassword"
                    placeholder="Repeat new password"
                    registration={register('confirmPassword', {
                      required: 'Please confirm your new password',
                      validate: (v) => v === watch('newPassword') || 'Passwords do not match',
                    })}
                    error={errors.confirmPassword}
                  />
                </div>
                <div className="flex gap-2 pt-1">
                  <button type="submit" disabled={mutation.isPending}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 bg-[#D96C5F] hover:bg-[#C45E52] disabled:opacity-60 text-white font-semibold py-2.5 rounded-xl text-sm transition-colors">
                    {mutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    Save
                  </button>
                  <button type="button" onClick={onCancel}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 border border-[#E2E8F0] text-[#475569] font-semibold py-2.5 rounded-xl text-sm hover:bg-[#F8F9FB] transition-colors">
                    <X className="w-4 h-4" /> Cancel
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
