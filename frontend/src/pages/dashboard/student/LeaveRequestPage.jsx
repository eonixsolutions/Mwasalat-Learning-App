import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { CalendarOff, Plus, Loader2, X, Clock, CheckCircle2, XCircle } from 'lucide-react';
import { leaveService } from '../../../services/leave.service.js';

const STATUS_STYLE = {
  pending:  { label: 'Pending',  color: '#F59E0B', bg: '#FFFBEB', Icon: Clock },
  approved: { label: 'Approved', color: '#22A66E', bg: '#E8F8F2', Icon: CheckCircle2 },
  rejected: { label: 'Rejected', color: '#C76D64', bg: '#FDEFEE', Icon: XCircle },
};

function RequestModal({ onClose }) {
  const qc = useQueryClient();
  const { register, handleSubmit, formState: { errors } } = useForm();

  const mutation = useMutation({
    mutationFn: leaveService.submitLeave,
    onSuccess: () => {
      toast.success('Leave request submitted');
      qc.invalidateQueries({ queryKey: ['leaves', 'my'] });
      onClose();
    },
    onError: (e) => toast.error(e.response?.data?.message ?? 'Submission failed'),
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(15,23,42,0.45)' }}>
      <div className="bg-white rounded-2xl p-6 w-full max-w-md" style={{ boxShadow: '0 8px 40px rgba(0,0,0,0.18)' }}>
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-base font-bold text-[#1E293B]">Request Leave</h3>
          <button onClick={onClose} className="text-[#94A3B8] hover:text-[#475569] transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[#475569] mb-1">From *</label>
              <input
                type="date"
                {...register('startDate', { required: 'Required' })}
                className="w-full border border-[#E2E8F0] rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#CA6357] text-[#1E293B]"
              />
              {errors.startDate && <p className="text-xs text-red-500 mt-1">{errors.startDate.message}</p>}
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#475569] mb-1">To *</label>
              <input
                type="date"
                {...register('endDate', { required: 'Required' })}
                className="w-full border border-[#E2E8F0] rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#CA6357] text-[#1E293B]"
              />
              {errors.endDate && <p className="text-xs text-red-500 mt-1">{errors.endDate.message}</p>}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#475569] mb-1">Reason</label>
            <textarea
              {...register('reason')}
              rows={3}
              placeholder="Briefly explain the reason for your leave…"
              className="w-full border border-[#E2E8F0] rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#CA6357] text-[#1E293B] resize-none"
            />
          </div>

          <div className="flex gap-2 pt-1">
            <button
              type="submit"
              disabled={mutation.isPending}
              className="flex-1 inline-flex items-center justify-center gap-2 bg-[#CA6357] hover:bg-[#b85548] text-white font-semibold px-4 py-2.5 rounded-xl transition-colors text-sm disabled:opacity-60"
            >
              {mutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              Submit Request
            </button>
            <button type="button" onClick={onClose} className="px-4 py-2.5 rounded-xl border border-[#E2E8F0] text-[#475569] text-sm font-semibold hover:bg-[#F8F9FB]">
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function LeaveRequestPage() {
  const [showModal, setShowModal] = useState(false);

  const { data: leaves = [], isLoading } = useQuery({
    queryKey: ['leaves', 'my'],
    queryFn: leaveService.getMyLeaves,
  });

  const fmt = (d) => new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

  return (
    <div className="space-y-6 pb-8">
      <div className="relative rounded-2xl overflow-hidden p-6 sm:p-8" style={{ background: 'linear-gradient(135deg, #CA6357 0%, #A94E43 100%)' }}>
        <div className="relative z-10">
          <h1 className="text-2xl sm:text-3xl font-bold text-white mb-1">Leave Requests</h1>
          <p className="text-white/70 text-sm">Approved leaves are excluded from your LeetCode day count</p>
        </div>
      </div>

      <div className="flex justify-end">
        <button
          onClick={() => setShowModal(true)}
          className="inline-flex items-center gap-2 bg-[#CA6357] hover:bg-[#b85548] text-white font-semibold px-4 py-2.5 rounded-xl transition-colors text-sm"
        >
          <Plus className="w-4 h-4" /> Request Leave
        </button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-40">
          <Loader2 className="w-5 h-5 text-[#CA6357] animate-spin" />
        </div>
      ) : leaves.length === 0 ? (
        <div className="bg-white rounded-2xl p-10 text-center" style={{ boxShadow: '0 2px 16px rgba(0,0,0,0.05)' }}>
          <CalendarOff className="w-10 h-10 text-[#CBD5E1] mx-auto mb-3" strokeWidth={1.5} />
          <p className="text-base font-bold text-[#1E293B]">No leave requests yet</p>
          <p className="text-sm text-[#94A3B8] mt-1">Submit a request if you need days off from the LeetCode schedule.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {leaves.map((l) => {
            const s = STATUS_STYLE[l.status] ?? STATUS_STYLE.pending;
            return (
              <div key={l._id} className="bg-white rounded-2xl p-4 flex items-start gap-4" style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>
                <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: s.bg }}>
                  <s.Icon className="w-4 h-4" style={{ color: s.color }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-[#1E293B]">{fmt(l.startDate)} — {fmt(l.endDate)}</p>
                  {l.reason && <p className="text-xs text-[#475569] mt-0.5">{l.reason}</p>}
                  {l.reviewNote && (
                    <p className="text-xs mt-1" style={{ color: s.color }}>
                      <span className="font-semibold">Note:</span> {l.reviewNote}
                    </p>
                  )}
                  <p className="text-xs text-[#94A3B8] mt-1">
                    Submitted {new Date(l.createdAt).toLocaleDateString('en-IN', { dateStyle: 'medium' })}
                  </p>
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full flex-shrink-0"
                  style={{ backgroundColor: s.bg, color: s.color }}>
                  {s.label}
                </span>
              </div>
            );
          })}
        </div>
      )}

      {showModal && <RequestModal onClose={() => setShowModal(false)} />}
    </div>
  );
}
