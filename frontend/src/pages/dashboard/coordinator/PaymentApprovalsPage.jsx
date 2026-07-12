import { useState } from 'react';
import useBodyScrollLock from '../../../hooks/useBodyScrollLock.js';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { CreditCard, Loader2, CheckCircle, XCircle, Eye, X, Clock, Filter, ChevronDown } from 'lucide-react';
import { paymentService } from '../../../services/payment.service.js';
import { batchService } from '../../../services/batch.service.js';

const METHOD_LABELS = {
  upi:           'UPI',
  bank_transfer: 'Bank Transfer',
  cash:          'Cash',
  other:         'Other',
};

const STATUS_STYLES = {
  pending_review: { label: 'Pending Review', bg: 'bg-[#FFFBEB]', text: 'text-[#D97706]' },
  approved:       { label: 'Approved',       bg: 'bg-[#E8F8F2]', text: 'text-[#22A66E]' },
  rejected:       { label: 'Rejected',       bg: 'bg-[#FEE2E2]', text: 'text-[#D96C5F]' },
};

function ReceiptModal({ payment, batches = [], onClose, onApprove, onReject, isProcessing }) {
  useBodyScrollLock();
  const [rejectNote, setRejectNote] = useState('');
  const [showReject, setShowReject] = useState(false);
  const [selectedBatchId, setSelectedBatchId] = useState('');

  const s = STATUS_STYLES[payment.status] ?? STATUS_STYLES.pending_review;

  return (
    <>
      <div className="fixed inset-0 bg-black/40 z-40" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] flex flex-col" style={{ boxShadow: '0 4px 30px rgba(0,0,0,0.12)' }}>

          <div className="flex items-center justify-between px-6 py-4 border-b border-[#F1F5F9] flex-shrink-0">
            <div>
              <p className="text-base font-bold text-[#1E293B]">Payment Proof</p>
              <p className="text-xs text-[#94A3B8]">{payment.user?.name} · {payment.user?.email}</p>
            </div>
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-[#F8F9FB]">
              <X className="w-4 h-4 text-[#94A3B8]" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto scrollbar-hide px-6 py-5 space-y-4">
            {/* Receipt image */}
            <div className="rounded-2xl overflow-hidden border border-[#E2E8F0] bg-[#F8F9FB]">
              <img src={payment.receiptUrl} alt="Payment receipt" className="w-full object-contain max-h-64" />
            </div>

            {/* Details */}
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Amount',         value: `₹${payment.amount.toLocaleString('en-IN')}` },
                { label: 'Method',         value: METHOD_LABELS[payment.paymentMethod] ?? payment.paymentMethod },
                { label: 'Status',         value: <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${s.bg} ${s.text}`}>{s.label}</span> },
                { label: 'Submitted',      value: new Date(payment.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) },
                ...(payment.transactionId ? [{ label: 'Transaction ID', value: payment.transactionId }] : []),
                ...(payment.studentNote   ? [{ label: 'Student Note',   value: payment.studentNote }]   : []),
              ].map(({ label, value }) => (
                <div key={label} className="bg-[#F8F9FB] rounded-xl p-3">
                  <p className="text-[10px] font-semibold text-[#94A3B8] uppercase tracking-wider mb-0.5">{label}</p>
                  <p className="text-sm font-medium text-[#1E293B]">{value}</p>
                </div>
              ))}
            </div>

            {payment.status === 'rejected' && payment.reviewNote && (
              <div className="bg-[#FEE2E2] rounded-xl p-3">
                <p className="text-xs font-semibold text-[#D96C5F] mb-0.5">Rejection Reason</p>
                <p className="text-sm text-[#1E293B]">{payment.reviewNote}</p>
              </div>
            )}

            {payment.status === 'pending_review' && !showReject && batches.length > 0 && (
              <div>
                <label className="block text-xs font-semibold text-[#475569] uppercase tracking-wider mb-1.5">
                  Assign to Batch <span className="text-[#D96C5F]">*</span>
                </label>
                <div className="relative">
                  <select
                    value={selectedBatchId}
                    onChange={(e) => setSelectedBatchId(e.target.value)}
                    className="w-full appearance-none pl-3 pr-8 py-2.5 border border-[#E2E8F0] rounded-xl text-sm text-[#1E293B] focus:outline-none focus:border-[#CA6357] bg-white"
                  >
                    <option value="">Select a batch…</option>
                    {batches.map((b) => (
                      <option key={b._id} value={b._id}>{b.name}{b.branch?.name ? ` — ${b.branch.name}` : ''}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#94A3B8] pointer-events-none" />
                </div>
              </div>
            )}

            {payment.status === 'pending_review' && showReject && (
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-[#475569] uppercase tracking-wider">Rejection Reason <span className="text-[#D96C5F]">*</span></label>
                <textarea value={rejectNote} onChange={e => setRejectNote(e.target.value)}
                  rows={3} placeholder="Explain why the proof is being rejected…"
                  className="w-full border border-[#E2E8F0] rounded-xl px-3 py-2.5 text-sm text-[#1E293B] placeholder-[#94A3B8] focus:outline-none focus:border-[#D96C5F] resize-none" />
              </div>
            )}
          </div>

          {payment.status === 'pending_review' && (
            <div className="px-6 py-4 border-t border-[#F1F5F9] flex gap-2 flex-shrink-0">
              {!showReject ? (
                <>
                  <button onClick={() => setShowReject(true)}
                    className="flex-1 border border-[#E2E8F0] text-[#D96C5F] font-semibold px-4 py-2.5 rounded-xl hover:bg-[#FEE2E2] text-sm transition-colors">
                    Reject
                  </button>
                  <button onClick={() => onApprove(selectedBatchId || null)} disabled={isProcessing || (batches.length > 0 && !selectedBatchId)}
                    className="flex-1 inline-flex items-center justify-center gap-2 bg-[#CA6357] hover:bg-[#b85548] disabled:opacity-60 text-white font-semibold px-4 py-2.5 rounded-xl text-sm transition-colors">
                    {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                    Approve &amp; Activate
                  </button>
                </>
              ) : (
                <>
                  <button onClick={() => setShowReject(false)}
                    className="flex-1 border border-[#E2E8F0] text-[#475569] font-medium px-4 py-2.5 rounded-xl hover:bg-[#F8F9FB] text-sm">
                    Cancel
                  </button>
                  <button onClick={() => onReject(rejectNote)} disabled={isProcessing || !rejectNote.trim()}
                    className="flex-1 inline-flex items-center justify-center gap-2 bg-[#D96C5F] hover:bg-[#C45E52] disabled:opacity-60 text-white font-semibold px-4 py-2.5 rounded-xl text-sm transition-colors">
                    {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
                    Confirm Reject
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

export default function PaymentApprovalsPage() {
  const queryClient  = useQueryClient();
  const [viewing, setViewing]     = useState(null);
  const [filter,  setFilter]      = useState('pending_review');

  const { data: payments = [], isLoading } = useQuery({
    queryKey: ['payments', 'all'],
    queryFn:  paymentService.getPending,
    refetchInterval: 30_000,
  });

  const { data: allBatches = [] } = useQuery({
    queryKey: ['batches'],
    queryFn: () => batchService.getAll({ active: 'true' }),
  });

  const filtered = filter === 'all' ? payments : payments.filter(p => p.status === filter);

  // Filter batches by the viewed payment's student branch
  const viewingBranchId = viewing?.student?.branch?._id ?? viewing?.student?.branch ?? null;
  const batchesForViewing = viewingBranchId
    ? allBatches.filter((b) => (b.branch?._id ?? b.branch) === String(viewingBranchId))
    : allBatches;

  const approveMutation = useMutation({
    mutationFn: ({ id, batchId }) => paymentService.approve(id, batchId),
    onSuccess: () => {
      toast.success('Approved — student account is now active');
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      queryClient.invalidateQueries({ queryKey: ['students'] });
      setViewing(null);
    },
    onError: (err) => toast.error(err?.response?.data?.message ?? 'Failed to approve'),
  });

  const rejectMutation = useMutation({
    mutationFn: ({ id, reviewNote }) => paymentService.reject(id, reviewNote),
    onSuccess: () => {
      toast.success('Payment rejected');
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      setViewing(null);
    },
    onError: (err) => toast.error(err?.response?.data?.message ?? 'Failed to reject'),
  });

  const isProcessing = approveMutation.isPending || rejectMutation.isPending;
  const pendingCount = payments.filter(p => p.status === 'pending_review').length;

  return (
    <div className="space-y-6 pb-8">

      {/* Header */}
      <div className="relative rounded-2xl overflow-hidden p-6 sm:p-8"
        style={{ background: 'linear-gradient(135deg, #CA6357 0%, #A94E43 100%)' }}>
        <div className="relative z-10 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-white/15 flex items-center justify-center flex-shrink-0">
              <CreditCard className="w-7 h-7 text-white" strokeWidth={1.8} />
            </div>
            <div>
              <p className="text-xs font-bold tracking-widest text-[#F2B3AC] uppercase mb-1">Coordinator</p>
              <h2 className="text-2xl font-bold text-white mb-1">Payment Approvals</h2>
              {pendingCount > 0 && (
                <p className="text-white/60 text-sm">{pendingCount} proof{pendingCount !== 1 ? 's' : ''} awaiting review</p>
              )}
            </div>
          </div>
          {pendingCount > 0 && (
            <div className="bg-[#D96C5F] text-white text-sm font-bold px-4 py-2 rounded-xl flex-shrink-0">
              {pendingCount} Pending
            </div>
          )}
        </div>
      </div>

      {/* List */}
      <div className="bg-white rounded-2xl overflow-hidden" style={{ boxShadow: '0 2px 16px rgba(0,0,0,0.05)' }}>
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-6 h-6 text-[#CA6357] animate-spin" />
          </div>
        ) : payments.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <CheckCircle className="w-10 h-10 text-[#22C55E]" strokeWidth={1.5} />
            <p className="text-base font-bold text-[#1E293B]">All caught up!</p>
            <p className="text-sm text-[#94A3B8]">No payment proofs are pending review.</p>
          </div>
        ) : (
          <div className="divide-y divide-[#F8F9FB]">
            {payments.map((payment) => {
              const s = STATUS_STYLES[payment.status] ?? STATUS_STYLES.pending_review;
              return (
                <div key={payment._id} className="flex items-center gap-4 px-6 py-4 hover:bg-[#FAFAFA] transition-colors">
                  <div className="w-10 h-10 rounded-xl bg-[#FDEFEE] flex items-center justify-center flex-shrink-0">
                    <CreditCard className="w-5 h-5 text-[#CA6357]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-semibold text-[#1E293B]">{payment.user?.name}</p>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${s.bg} ${s.text}`}>{s.label}</span>
                    </div>
                    <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                      <span className="text-xs text-[#94A3B8]">{payment.user?.email}</span>
                      {payment.user?.phone && <>
                        <span className="text-xs text-[#94A3B8]">·</span>
                        <span className="text-xs text-[#94A3B8]">{payment.user.phone}</span>
                      </>}
                      {payment.student?.course?.name && <>
                        <span className="text-xs text-[#94A3B8]">·</span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#F2EEFD] text-[#7C6AF2]">{payment.student.course.name}</span>
                      </>}
                      {payment.student?.branch?.name && <>
                        <span className="text-xs text-[#94A3B8]">·</span>
                        <span className="text-xs text-[#94A3B8]">{payment.student.branch.name}{payment.student.branch.location ? ` (${payment.student.branch.location})` : ''}</span>
                      </>}
                    </div>
                    <div className="flex items-center gap-3 mt-0.5">
                      <span className="text-xs text-[#94A3B8]">{METHOD_LABELS[payment.paymentMethod]} · ₹{payment.amount.toLocaleString('en-IN')}</span>
                      <span className="text-xs text-[#94A3B8]">·</span>
                      <span className="text-xs text-[#94A3B8]">
                        {new Date(payment.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                      </span>
                    </div>
                  </div>
                  <button onClick={() => setViewing(payment)}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#CA6357] bg-[#FDEFEE] hover:bg-[#F6D9D6] px-3 py-1.5 rounded-lg transition-colors flex-shrink-0">
                    <Eye className="w-3.5 h-3.5" /> Review
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {viewing && (
        <ReceiptModal
          payment={viewing}
          batches={batchesForViewing}
          onClose={() => setViewing(null)}
          onApprove={(batchId) => approveMutation.mutate({ id: viewing._id, batchId })}
          onReject={(note) => rejectMutation.mutate({ id: viewing._id, reviewNote: note })}
          isProcessing={isProcessing}
        />
      )}
    </div>
  );
}
