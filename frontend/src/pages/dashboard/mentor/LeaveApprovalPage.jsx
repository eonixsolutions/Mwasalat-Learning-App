import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { CalendarOff, CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { leaveService } from '../../../services/leave.service.js';

function ReviewForm({ leave, onDone }) {
  const qc = useQueryClient();
  const { register, handleSubmit, watch } = useForm({ defaultValues: { status: 'approved' } });
  const status = watch('status');

  const mutation = useMutation({
    mutationFn: ({ status, reviewNote }) => leaveService.reviewLeave(leave._id, status, reviewNote),
    onSuccess: () => {
      toast.success(status === 'approved' ? 'Leave approved' : 'Leave rejected');
      qc.invalidateQueries({ queryKey: ['leaves', 'pending'] });
      onDone?.();
    },
    onError: (e) => toast.error(e.response?.data?.message ?? 'Action failed'),
  });

  return (
    <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="space-y-3 pt-3 border-t border-[#F1F5F9]">
      <div className="flex gap-3">
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="radio" value="approved" {...register('status')} className="accent-[#22A66E]" />
          <span className="text-sm font-semibold text-[#22A66E]">Approve</span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="radio" value="rejected" {...register('status')} className="accent-[#C76D64]" />
          <span className="text-sm font-semibold text-[#C76D64]">Reject</span>
        </label>
      </div>

      <textarea
        {...register('reviewNote')}
        placeholder="Optional note to student…"
        rows={2}
        className="w-full border border-[#E2E8F0] rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#CA6357] text-[#1E293B] resize-none"
      />

      <button
        type="submit"
        disabled={mutation.isPending}
        className={`inline-flex items-center gap-2 font-semibold px-4 py-2 rounded-xl transition-colors text-sm disabled:opacity-60 ${
          status === 'approved'
            ? 'bg-[#22A66E] hover:bg-[#1a8a5a] text-white'
            : 'bg-[#C76D64] hover:bg-[#b85548] text-white'
        }`}
      >
        {mutation.isPending ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : status === 'approved' ? (
          <CheckCircle2 className="w-4 h-4" />
        ) : (
          <XCircle className="w-4 h-4" />
        )}
        {status === 'approved' ? 'Approve Leave' : 'Reject Leave'}
      </button>
    </form>
  );
}

function LeaveCard({ leave }) {
  const studentName = leave.student?.user?.name ?? 'Unknown Student';
  const studentEmail = leave.student?.user?.email ?? '';
  const fmt = (d) => new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

  const dayCount = Math.ceil(
    (new Date(leave.endDate) - new Date(leave.startDate)) / (1000 * 60 * 60 * 24)
  ) + 1;

  return (
    <div className="bg-white rounded-2xl border border-[#E2E8F0] p-4 space-y-3" style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 rounded-full bg-[#FDEFEE] text-[#CA6357] font-bold text-sm flex items-center justify-center flex-shrink-0">
          {studentName.charAt(0).toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-[#1E293B]">{studentName}</p>
          <p className="text-xs text-[#94A3B8]">{studentEmail}</p>
        </div>
        <div className="text-right flex-shrink-0">
          <p className="text-sm font-semibold text-[#1E293B]">{fmt(leave.startDate)} → {fmt(leave.endDate)}</p>
          <p className="text-xs text-[#94A3B8] mt-0.5">{dayCount} day{dayCount !== 1 ? 's' : ''}</p>
        </div>
      </div>

      {leave.reason && (
        <p className="text-sm text-[#475569] bg-[#F8F9FB] rounded-xl px-3 py-2">{leave.reason}</p>
      )}

      <ReviewForm leave={leave} />
    </div>
  );
}

export default function LeaveApprovalPage() {
  const { data: leaves = [], isLoading } = useQuery({
    queryKey: ['leaves', 'pending'],
    queryFn: leaveService.getPendingLeaves,
    refetchInterval: 30_000,
  });

  return (
    <div className="space-y-6 pb-8">

      {/* Hero banner */}
      <div className="relative rounded-2xl overflow-hidden p-6 sm:p-8" style={{ background: 'linear-gradient(135deg, #CA6357 0%, #A94E43 100%)' }}>
        <div className="relative z-10">
          <h1 className="text-2xl sm:text-3xl font-bold text-white mb-1">Leave Requests</h1>
          <p className="text-white/70 text-sm">Review and approve student leave requests — approved leaves are excluded from LeetCode day counts</p>
        </div>
      </div>

      {leaves.length > 0 && (
        <div className="inline-flex items-center gap-2 bg-[#FFFBEB] border border-[#FCD34D] text-[#F59E0B] text-sm font-semibold px-4 py-2 rounded-xl">
          <CalendarOff className="w-4 h-4" />
          {leaves.length} pending request{leaves.length !== 1 ? 's' : ''}
        </div>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center h-40">
          <Loader2 className="w-5 h-5 text-[#CA6357] animate-spin" />
        </div>
      ) : leaves.length === 0 ? (
        <div className="bg-white rounded-2xl p-10 text-center" style={{ boxShadow: '0 2px 16px rgba(0,0,0,0.05)' }}>
          <CheckCircle2 className="w-10 h-10 text-[#CBD5E1] mx-auto mb-3" strokeWidth={1.5} />
          <p className="text-base font-bold text-[#1E293B]">All clear!</p>
          <p className="text-sm text-[#94A3B8] mt-1">No pending leave requests to review.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {leaves.map((l) => <LeaveCard key={l._id} leave={l} />)}
        </div>
      )}
    </div>
  );
}
