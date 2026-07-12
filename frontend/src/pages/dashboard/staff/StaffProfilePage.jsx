import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import {
  User, Mail, Phone, AtSign, Building2, Layers,
  Calendar, CheckCircle, AlertCircle, Edit3, Save, X,
  Loader2, ShieldCheck, AlertTriangle,
} from 'lucide-react';
import { staffService } from '../../../services/staff.service.js';
import { useAuth } from '../../../hooks/useAuth.js';
import { ROLES } from '../../../constants/roles.js';

const ROLE_LABELS = {
  [ROLES.SUPER_ADMIN]:          'Super Admin',
  [ROLES.BRANCH_ADMIN]:         'Branch Admin',
  [ROLES.BRANCH_COORDINATOR]:   'Branch Coordinator',
  [ROLES.TECHNICAL_MENTOR]:     'Technical Mentor',
  [ROLES.COMMUNICATION_MENTOR]: 'Communication Mentor',
};

const ROLE_COLORS = {
  [ROLES.SUPER_ADMIN]:          { bg: '#FEF3C7', color: '#B45309' },
  [ROLES.BRANCH_ADMIN]:         { bg: '#EDE9FE', color: '#6D28D9' },
  [ROLES.BRANCH_COORDINATOR]:   { bg: '#E0F2FE', color: '#0369A1' },
  [ROLES.TECHNICAL_MENTOR]:     { bg: '#FDEFEE', color: '#CA6357' },
  [ROLES.COMMUNICATION_MENTOR]: { bg: '#FCE7F3', color: '#9D174D' },
};

function InfoRow({ icon: Icon, label, value, muted = false }) {
  return (
    <div className="flex items-start gap-3 py-3 border-b border-[#F1F5F9] last:border-0">
      <div className="w-8 h-8 rounded-lg bg-[#F1F5F9] flex items-center justify-center flex-shrink-0 mt-0.5">
        <Icon className="w-4 h-4 text-[#475569]" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[11px] font-bold uppercase tracking-wider text-[#94A3B8] mb-0.5">{label}</p>
        <p className={`text-sm font-medium ${muted ? 'text-[#94A3B8] italic' : 'text-[#1E293B]'}`}>
          {value || <span className="text-[#CBD5E1] italic">Not set</span>}
        </p>
      </div>
    </div>
  );
}

export default function StaffProfilePage() {
  const { user: authUser } = useAuth();
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState(false);

  const { data: staff, isLoading } = useQuery({
    queryKey: ['staff', 'me'],
    queryFn: staffService.getMyProfile,
  });

  const { register, handleSubmit, reset, formState: { errors } } = useForm();

  const mutation = useMutation({
    mutationFn: staffService.updateMyProfile,
    onSuccess: (updated) => {
      toast.success('Profile updated');
      queryClient.setQueryData(['staff', 'me'], updated);
      setEditing(false);
    },
    onError: (err) => toast.error(err?.response?.data?.message ?? 'Update failed'),
  });

  const onEdit = () => {
    reset({
      phone:          staff?.user?.phone ?? '',
      microsoftEmail: staff?.microsoftEmail ?? '',
    });
    setEditing(true);
  };

  const onCancel = () => {
    setEditing(false);
    reset();
  };

  const onSubmit = (data) => mutation.mutate(data);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 text-[#CA6357] animate-spin" />
      </div>
    );
  }

  if (!staff) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3">
        <AlertCircle className="w-10 h-10 text-[#CBD5E1]" strokeWidth={1.5} />
        <p className="text-sm text-[#94A3B8]">Could not load profile</p>
      </div>
    );
  }

  const user    = staff.user ?? {};
  const roles   = user.roles ?? [staff.role];
  const initials = (user.name ?? '?').split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();
  const isTechnicalMentor = roles.includes(ROLES.TECHNICAL_MENTOR);
  const needsMicrosoftEmail = isTechnicalMentor && !staff.microsoftEmail;

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
            <h2 className="text-2xl font-bold text-white mb-1">{user.name ?? '—'}</h2>
            <p className="text-white/60 text-sm mb-3">{user.email ?? '—'}</p>
            <div className="flex flex-wrap gap-2">
              {roles.map((r) => {
                const cfg = ROLE_COLORS[r] ?? { bg: 'rgba(255,255,255,0.15)', color: 'white' };
                return (
                  <span key={r} className="inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full"
                    style={{ backgroundColor: cfg.bg, color: cfg.color }}>
                    <ShieldCheck className="w-3 h-3" />
                    {ROLE_LABELS[r] ?? r}
                  </span>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Microsoft email warning for technical mentors */}
      {needsMicrosoftEmail && (
        <div className="bg-[#FFFBEB] border border-[#FDE68A] rounded-2xl p-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-[#B45309] flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-[#B45309] mb-0.5">Microsoft email not set</p>
            <p className="text-xs text-[#92400E] leading-relaxed">
              As a Technical Mentor, your Microsoft account email is required to grant you read access to your students' task sheet folders on OneDrive. Please add it in Settings below.
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* Left column — profile info */}
        <div className="lg:col-span-2 space-y-5">

          {/* Account Details */}
          <div className="bg-white rounded-2xl p-5" style={{ boxShadow: '0 2px 16px rgba(0,0,0,0.05)' }}>
            <p className="text-xs font-bold uppercase tracking-wider text-[#94A3B8] mb-4">Account Details</p>
            <InfoRow icon={Mail}    label="Email Address" value={user.email} />
            <InfoRow icon={Phone}   label="Phone Number"  value={user.phone} />
            <InfoRow icon={Calendar} label="Member Since" value={
              user.createdAt
                ? new Date(user.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })
                : null
            } />
            <div className="flex items-start gap-3 py-3 border-b border-[#F1F5F9] last:border-0">
              <div className="w-8 h-8 rounded-lg bg-[#F1F5F9] flex items-center justify-center flex-shrink-0 mt-0.5">
                {user.isEmailVerified
                  ? <CheckCircle className="w-4 h-4 text-[#22A66E]" />
                  : <AlertCircle className="w-4 h-4 text-[#F59E0B]" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[11px] font-bold uppercase tracking-wider text-[#94A3B8] mb-0.5">Email Verification</p>
                <p className={`text-sm font-medium ${user.isEmailVerified ? 'text-[#22A66E]' : 'text-[#F59E0B]'}`}>
                  {user.isEmailVerified ? 'Verified' : 'Not Verified'}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3 py-3">
              <div className="w-8 h-8 rounded-lg bg-[#F1F5F9] flex items-center justify-center flex-shrink-0 mt-0.5">
                <User className={`w-4 h-4 ${staff.isApproved ? 'text-[#22A66E]' : 'text-[#F59E0B]'}`} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[11px] font-bold uppercase tracking-wider text-[#94A3B8] mb-0.5">Account Status</p>
                <span className="text-[11px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full"
                  style={staff.isApproved
                    ? { backgroundColor: '#E8F8F2', color: '#22A66E' }
                    : { backgroundColor: '#FFFBEB', color: '#B45309' }}>
                  {staff.isApproved ? 'Active' : 'Pending Approval'}
                </span>
              </div>
            </div>
          </div>

          {/* Assignments */}
          {((staff.branches?.length ?? 0) > 0 || (staff.batches?.length ?? 0) > 0) && (
            <div className="bg-white rounded-2xl p-5" style={{ boxShadow: '0 2px 16px rgba(0,0,0,0.05)' }}>
              <p className="text-xs font-bold uppercase tracking-wider text-[#94A3B8] mb-4">Assignments</p>

              {staff.branches?.length > 0 && (
                <div className="mb-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Building2 className="w-4 h-4 text-[#475569]" />
                    <p className="text-xs font-semibold text-[#475569] uppercase tracking-wider">Branches</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {staff.branches.map((b) => (
                      <span key={b._id} className="inline-flex items-center gap-1 text-xs font-semibold bg-[#FDEFEE] text-[#CA6357] px-2.5 py-1 rounded-lg">
                        {b.name}
                        {b.code && <span className="text-[#C45E52]">· {b.code}</span>}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {staff.batches?.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Layers className="w-4 h-4 text-[#475569]" />
                    <p className="text-xs font-semibold text-[#475569] uppercase tracking-wider">Batches</p>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    {staff.batches.map((b) => (
                      <div key={b._id} className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-[#CA6357] flex-shrink-0" />
                        <span className="text-sm text-[#1E293B] font-medium">{b.name}</span>
                        {b.branch?.name && (
                          <span className="text-xs text-[#94A3B8]">· {b.branch.name}</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right column — settings */}
        <div>
          <div className="bg-white rounded-2xl p-5" style={{ boxShadow: '0 2px 16px rgba(0,0,0,0.05)' }}>
            <div className="flex items-center justify-between mb-4">
              <p className="text-xs font-bold uppercase tracking-wider text-[#94A3B8]">Settings</p>
              {!editing && (
                <button onClick={onEdit}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#CA6357] hover:text-[#A94E43] bg-[#FDEFEE] hover:bg-[#f9dcd9] px-2.5 py-1.5 rounded-lg transition-colors">
                  <Edit3 className="w-3 h-3" /> Edit
                </button>
              )}
            </div>

            {!editing ? (
              <div>
                <div className="flex items-start gap-3 py-3 border-b border-[#F1F5F9]">
                  <div className="w-8 h-8 rounded-lg bg-[#F1F5F9] flex items-center justify-center flex-shrink-0">
                    <Phone className="w-4 h-4 text-[#475569]" />
                  </div>
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-wider text-[#94A3B8] mb-0.5">Phone Number</p>
                    <p className="text-sm text-[#1E293B]">{user.phone || <span className="text-[#CBD5E1] italic">Not set</span>}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 py-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${needsMicrosoftEmail ? 'bg-[#FEF3C7]' : 'bg-[#F1F5F9]'}`}>
                    <AtSign className={`w-4 h-4 ${needsMicrosoftEmail ? 'text-[#B45309]' : 'text-[#475569]'}`} />
                  </div>
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-wider text-[#94A3B8] mb-0.5">Microsoft Email</p>
                    {staff.microsoftEmail
                      ? <p className="text-sm text-[#1E293B] break-all">{staff.microsoftEmail}</p>
                      : <p className="text-sm text-[#CBD5E1] italic">Not set</p>}
                  </div>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-[#475569] mb-1.5">Phone Number</label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94A3B8]" />
                    <input
                      type="tel"
                      {...register('phone')}
                      placeholder="+91 98765 43210"
                      className="w-full pl-9 pr-3 py-2.5 border border-[#E2E8F0] rounded-xl text-sm text-[#1E293B] placeholder-[#CBD5E1] focus:outline-none focus:border-[#CA6357] focus:ring-1 focus:ring-[#CA6357]/20"
                    />
                  </div>
                  {errors.phone && <p className="text-xs text-[#D96C5F] mt-1">{errors.phone.message}</p>}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#475569] mb-1.5">
                    Microsoft Email
                    {isTechnicalMentor && (
                      <span className="ml-1.5 text-[#D96C5F] font-normal text-[10px]">required for task sheet access</span>
                    )}
                  </label>
                  <div className="relative">
                    <AtSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94A3B8]" />
                    <input
                      type="email"
                      {...register('microsoftEmail')}
                      placeholder="you@example.com"
                      className="w-full pl-9 pr-3 py-2.5 border border-[#E2E8F0] rounded-xl text-sm text-[#1E293B] placeholder-[#CBD5E1] focus:outline-none focus:border-[#CA6357] focus:ring-1 focus:ring-[#CA6357]/20"
                    />
                  </div>
                  {errors.microsoftEmail && <p className="text-xs text-[#D96C5F] mt-1">{errors.microsoftEmail.message}</p>}
                </div>

                <div className="flex gap-2 pt-1">
                  <button type="submit" disabled={mutation.isPending}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 bg-[#CA6357] hover:bg-[#b85548] disabled:opacity-60 text-white font-semibold py-2.5 rounded-xl text-sm transition-colors">
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
