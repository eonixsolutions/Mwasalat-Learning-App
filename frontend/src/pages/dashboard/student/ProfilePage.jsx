import { useForm } from 'react-hook-form';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import {
  User, Mail, Phone, BookOpen, Building2, Users,
  Calendar, GraduationCap, Monitor, Code2, Loader2,
  CheckCircle, Clock, XCircle, Edit3, Save, X, AtSign,
} from 'lucide-react';
import { useState } from 'react';
import { studentService } from '../../../services/student.service.js';

/* ── helpers ──────────────────────────────────────────────── */

function StatusBadge({ isApproved, studentStatus }) {
  if (studentStatus === 'dropped') {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full bg-[#FBE9E7] text-[#A94E43]">
        <XCircle className="w-3.5 h-3.5" /> Dropped
      </span>
    );
  }
  if (studentStatus === 'graduated') {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full bg-[#E8F8F2] text-[#22A66E]">
        <CheckCircle className="w-3.5 h-3.5" /> Graduated
      </span>
    );
  }
  if (!isApproved) {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full bg-[#FFFBEB] text-[#92400E]">
        <Clock className="w-3.5 h-3.5" /> Pending Approval
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full bg-[#FDEFEE] text-[#CA6357]">
      <CheckCircle className="w-3.5 h-3.5" /> Active
    </span>
  );
}

function InfoRow({ icon: Icon, label, value, muted = false }) {
  return (
    <div className="flex items-start gap-3">
      <div className="w-8 h-8 rounded-lg bg-[#F1F5F9] flex items-center justify-center flex-shrink-0 mt-0.5">
        <Icon className="w-4 h-4 text-[#94A3B8]" />
      </div>
      <div>
        <p className="text-xs text-[#94A3B8] font-medium">{label}</p>
        <p className={`text-sm font-semibold mt-0.5 ${muted ? 'text-[#94A3B8]' : 'text-[#1E293B]'}`}>
          {value || <span className="text-[#CBD5E1] font-normal">—</span>}
        </p>
      </div>
    </div>
  );
}

/* ── Main page ────────────────────────────────────────────── */
export default function ProfilePage() {
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState(false);

  const { data: student, isLoading } = useQuery({
    queryKey: ['student', 'me'],
    queryFn: studentService.getMyProfile,
  });

  const { register, handleSubmit, reset, formState: { errors } } = useForm();

  const { mutate: save, isPending: saving } = useMutation({
    mutationFn: studentService.updateMyProfile,
    onSuccess: () => {
      toast.success('Profile updated');
      queryClient.invalidateQueries({ queryKey: ['student', 'me'] });
      setEditing(false);
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Update failed'),
  });

  const startEdit = () => {
    reset({
      phone:            student?.user?.phone          || '',
      microsoftEmail:   student?.microsoftEmail       || '',
      mentorshipMode:   student?.mentorshipMode       || 'online',
      leetcodeUsername: student?.leetcodeUsername     || '',
    });
    setEditing(true);
  };

  const cancelEdit = () => { reset(); setEditing(false); };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-5 h-5 text-[#CA6357] animate-spin" />
      </div>
    );
  }

  if (!student) {
    return (
      <div className="bg-white rounded-2xl p-10 text-center" style={{ boxShadow: '0 2px 16px rgba(0,0,0,0.05)' }}>
        <User className="w-10 h-10 text-[#CBD5E1] mx-auto mb-3" strokeWidth={1.5} />
        <p className="text-base font-bold text-[#1E293B]">Profile not found</p>
        <p className="text-sm text-[#94A3B8] mt-1">Contact your coordinator for assistance.</p>
      </div>
    );
  }

  const { user, course, branch, batch, rollNumber, enrollmentDate, isApproved, studentStatus, mentorshipMode, educationQualification, leetcodeUsername, microsoftEmail } = student;
  const hasLeetCode = course?.name?.toLowerCase().includes('code2career');

  const initials = user?.name?.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) || '?';
  const enrolledOn = enrollmentDate ? new Date(enrollmentDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }) : null;

  return (
    <div className="space-y-6 pb-8">

      {/* ── Header card ────────────────────────────────────── */}
      <div
        className="relative rounded-2xl overflow-hidden p-6"
        style={{ background: 'linear-gradient(135deg, #CA6357 0%, #A94E43 100%)' }}
      >

        <div className="relative z-10 flex items-center gap-5">
          <div className="w-16 h-16 rounded-2xl bg-white/15 flex items-center justify-center flex-shrink-0">
            <span className="text-2xl font-bold text-white">{initials}</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white/60 text-xs font-semibold uppercase tracking-widest mb-1">Student Profile</p>
            <h1 className="text-xl font-bold text-white truncate">{user?.name}</h1>
            <div className="flex items-center gap-3 mt-2 flex-wrap">
              <StatusBadge isApproved={isApproved} studentStatus={studentStatus} />
              {rollNumber && (
                <span className="text-xs font-semibold text-white/70 bg-white/10 px-2.5 py-1 rounded-full">
                  Roll #{rollNumber}
                </span>
              )}
              {course && (
                <span className="text-xs font-semibold text-white/70 bg-white/10 px-2.5 py-1 rounded-full">
                  {course.name}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Account info (read-only) ────────────────────────── */}
      <div className="bg-white rounded-2xl p-6" style={{ boxShadow: '0 2px 16px rgba(0,0,0,0.05)' }}>
        <p className="text-xs font-bold tracking-widest text-[#C76D64] uppercase mb-4">Account Details</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          <InfoRow icon={User}  label="Full Name" value={user?.name} />
          <InfoRow icon={Mail}  label="Email"     value={user?.email} />
          <InfoRow icon={Phone} label="Phone"     value={user?.phone} />
        </div>
      </div>

      {/* ── Enrollment info (read-only) ─────────────────────── */}
      <div className="bg-white rounded-2xl p-6" style={{ boxShadow: '0 2px 16px rgba(0,0,0,0.05)' }}>
        <p className="text-xs font-bold tracking-widest text-[#C76D64] uppercase mb-4">Enrollment Details</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <InfoRow icon={BookOpen}      label="Program"              value={course?.name} />
          <InfoRow icon={Building2}     label="Branch"               value={branch ? `${branch.name}${branch.location ? ` — ${branch.location}` : ''}` : null} />
          <InfoRow icon={Users}         label="Batch"                value={batch?.name} />
          <InfoRow icon={Calendar}      label="Enrolled On"          value={enrolledOn} />
          <InfoRow icon={GraduationCap} label="Education"            value={educationQualification} />
          <InfoRow icon={Monitor}       label="Mentorship Mode"      value={mentorshipMode ? (mentorshipMode === 'online' ? 'Online' : 'Offline (In-person)') : null} />
        </div>
      </div>

      {/* ── Editable settings ──────────────────────────────── */}
      <div className="bg-white rounded-2xl p-6" style={{ boxShadow: '0 2px 16px rgba(0,0,0,0.05)' }}>
        <div className="flex items-center justify-between mb-5">
          <p className="text-xs font-bold tracking-widest text-[#C76D64] uppercase">Settings</p>
          {!editing ? (
            <button
              onClick={startEdit}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#CA6357] hover:text-[#A94E43] transition-colors"
            >
              <Edit3 className="w-3.5 h-3.5" /> Edit
            </button>
          ) : (
            <button
              onClick={cancelEdit}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#94A3B8] hover:text-[#475569] transition-colors"
            >
              <X className="w-3.5 h-3.5" /> Cancel
            </button>
          )}
        </div>

        {!editing ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <InfoRow icon={Phone}   label="Phone Number"    value={user?.phone}     muted={!user?.phone} />
            <InfoRow icon={AtSign}  label="Microsoft Email" value={microsoftEmail}  muted={!microsoftEmail} />
            <InfoRow icon={Monitor} label="Preferred Mode"  value={mentorshipMode === 'online' ? 'Online' : 'Offline (In-person)'} />
            {hasLeetCode && <InfoRow icon={Code2} label="LeetCode Username" value={leetcodeUsername} muted={!leetcodeUsername} />}
          </div>
        ) : (
          <form
            onSubmit={handleSubmit((data) => save(data))}
            className="space-y-4"
            noValidate
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Phone number */}
              <div>
                <label className="block text-sm font-medium text-[#1E293B] mb-1.5">Phone Number</label>
                <div className="relative">
                  <div className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none">
                    <Phone className="w-4 h-4 text-[#94A3B8]" />
                  </div>
                  <input
                    type="tel"
                    placeholder="+91 9876543210"
                    className={`w-full pl-10 pr-4 py-2.5 rounded-xl border text-sm bg-white text-[#1E293B] placeholder:text-[#94A3B8] focus:outline-none focus:ring-2 transition-colors ${
                      errors.phone ? 'border-[#D96C5F] focus:ring-[#D96C5F]/20' : 'border-[#E2E8F0] hover:border-[#F2B3AC] focus:ring-[#CA6357]/20'
                    }`}
                    {...register('phone', {
                      pattern: { value: /^[0-9+\s\-()]{7,15}$/, message: 'Enter a valid phone number' },
                    })}
                  />
                </div>
                {errors.phone && <p className="text-xs text-[#D96C5F] mt-1">{errors.phone.message}</p>}
              </div>

              {/* Microsoft email */}
              <div>
                <label className="block text-sm font-medium text-[#1E293B] mb-1.5">Microsoft Email</label>
                <div className="relative">
                  <div className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none">
                    <AtSign className="w-4 h-4 text-[#94A3B8]" />
                  </div>
                  <input
                    type="email"
                    placeholder="you@students.example.com"
                    className={`w-full pl-10 pr-4 py-2.5 rounded-xl border text-sm bg-white text-[#1E293B] placeholder:text-[#94A3B8] focus:outline-none focus:ring-2 transition-colors ${
                      errors.microsoftEmail ? 'border-[#D96C5F] focus:ring-[#D96C5F]/20' : 'border-[#E2E8F0] hover:border-[#F2B3AC] focus:ring-[#CA6357]/20'
                    }`}
                    {...register('microsoftEmail', {
                      pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'Enter a valid email' },
                    })}
                  />
                </div>
                {errors.microsoftEmail && <p className="text-xs text-[#D96C5F] mt-1">{errors.microsoftEmail.message}</p>}
                <p className="text-[11px] text-[#94A3B8] mt-1">Used for OneDrive task sheet access.</p>
              </div>

              {/* Mentorship mode */}
              <div>
                <label className="block text-sm font-medium text-[#1E293B] mb-1.5">
                  Preferred Mode
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { value: 'online',  label: 'Online' },
                    { value: 'offline', label: 'Offline' },
                  ].map(({ value, label }) => (
                    <label
                      key={value}
                      className={`flex items-center justify-center gap-2 p-2.5 rounded-xl border-2 cursor-pointer transition-all ${
                        errors.mentorshipMode ? 'border-[#D96C5F]' : 'border-[#E2E8F0] hover:border-[#F2B3AC]'
                      } has-[:checked]:border-[#CA6357] has-[:checked]:bg-[#FDEFEE]`}
                    >
                      <input type="radio" value={value} className="sr-only" {...register('mentorshipMode')} />
                      <Monitor className="w-4 h-4 text-[#94A3B8]" />
                      <span className="text-sm font-semibold text-[#475569]">{label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* LeetCode username — Code2Career only */}
              {hasLeetCode && (
                <div>
                  <label className="block text-sm font-medium text-[#1E293B] mb-1.5">LeetCode Username</label>
                  <div className="relative">
                    <div className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none">
                      <Code2 className="w-4 h-4 text-[#94A3B8]" />
                    </div>
                    <input
                      type="text"
                      placeholder="your-leetcode-handle"
                      className={`w-full pl-10 pr-4 py-2.5 rounded-xl border text-sm bg-white text-[#1E293B] placeholder:text-[#94A3B8] focus:outline-none focus:ring-2 transition-colors ${
                        errors.leetcodeUsername ? 'border-[#D96C5F] focus:ring-[#D96C5F]/20' : 'border-[#E2E8F0] hover:border-[#F2B3AC] focus:ring-[#CA6357]/20'
                      }`}
                      {...register('leetcodeUsername', {
                        maxLength: { value: 50, message: 'Under 50 characters' },
                      })}
                    />
                  </div>
                  {errors.leetcodeUsername && <p className="text-xs text-[#D96C5F] mt-1">{errors.leetcodeUsername.message}</p>}
                </div>
              )}
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center gap-2 bg-[#CA6357] hover:bg-[#b85548] disabled:opacity-60 text-white font-semibold px-5 py-2.5 rounded-xl transition-colors text-sm"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                {saving ? 'Saving…' : 'Save Changes'}
              </button>
            </div>
          </form>
        )}
      </div>

    </div>
  );
}
