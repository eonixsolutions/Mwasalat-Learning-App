import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import {
  CreditCard, IndianRupee, Loader2, CheckCircle, CheckCircle2,
  XCircle, Eye, X, ChevronDown,
} from 'lucide-react';
import useBodyScrollLock from '../../../hooks/useBodyScrollLock.js';
import { paymentService } from '../../../services/payment.service.js';
import { feesService } from '../../../services/fees.service.js';
import { batchService } from '../../../services/batch.service.js';

// ── shared config ─────────────────────────────────────────────────────────────

const METHOD_LABELS = {
  upi:           'UPI',
  bank_transfer: 'Bank Transfer',
  cash:          'Cash',
  other:         'Other',
};

// ── Registration tab ──────────────────────────────────────────────────────────

const REG_STATUS_STYLES = {
  pending_review: { label: 'Pending Review', bg: 'bg-[#FFFBEB]', text: 'text-[#D97706]' },
  approved:       { label: 'Approved',       bg: 'bg-[#E8F8F2]', text: 'text-[#22A66E]' },
  rejected:       { label: 'Rejected',       bg: 'bg-[#FEE2E2]', text: 'text-[#D96C5F]' },
};

function RegReceiptModal({ payment, batches = [], onClose, onApprove, onReject, isProcessing }) {
  useBodyScrollLock();
  const [rejectNote,      setRejectNote]      = useState('');
  const [showReject,      setShowReject]      = useState(false);
  const [selectedBatchId, setSelectedBatchId] = useState('');

  const s = REG_STATUS_STYLES[payment.status] ?? REG_STATUS_STYLES.pending_review;

  return (
    <>
      <div className="fixed inset-0 bg-black/40 z-40" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] flex flex-col" style={{ boxShadow: '0 4px 30px rgba(0,0,0,0.12)' }}>

          <div className="flex items-center justify-between px-6 py-4 border-b border-[#F1F5F9] flex-shrink-0">
            <div>
              <p className="text-base font-bold text-[#1E293B]">Registration Receipt</p>
              <p className="text-xs text-[#94A3B8]">{payment.user?.name} · {payment.user?.email}</p>
            </div>
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-[#F8F9FB]">
              <X className="w-4 h-4 text-[#94A3B8]" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto scrollbar-hide px-6 py-5 space-y-4">
            <div className="rounded-2xl overflow-hidden border border-[#E2E8F0] bg-[#F8F9FB]">
              <img src={payment.receiptUrl} alt="Receipt" className="w-full object-contain max-h-64" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Amount',    value: `₹${payment.amount?.toLocaleString('en-IN')}` },
                { label: 'Method',    value: METHOD_LABELS[payment.paymentMethod] ?? payment.paymentMethod },
                { label: 'Status',    value: <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${s.bg} ${s.text}`}>{s.label}</span> },
                { label: 'Submitted', value: new Date(payment.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) },
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
                  <select value={selectedBatchId} onChange={(e) => setSelectedBatchId(e.target.value)}
                    className="w-full appearance-none pl-3 pr-8 py-2.5 border border-[#E2E8F0] rounded-xl text-sm text-[#1E293B] focus:outline-none focus:border-[#CA6357] bg-white">
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
                <label className="block text-xs font-semibold text-[#475569] uppercase tracking-wider">
                  Rejection Reason <span className="text-[#D96C5F]">*</span>
                </label>
                <textarea value={rejectNote} onChange={e => setRejectNote(e.target.value)}
                  rows={3} placeholder="Explain why the receipt is being rejected…"
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
                  <button onClick={() => onApprove(selectedBatchId || null)}
                    disabled={isProcessing || (batches.length > 0 && !selectedBatchId)}
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
                  <button onClick={() => onReject(rejectNote)}
                    disabled={isProcessing || !rejectNote.trim()}
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

function RegistrationTab() {
  const queryClient = useQueryClient();
  const [viewing, setViewing] = useState(null);

  const { data: payments = [], isLoading } = useQuery({
    queryKey: ['payments', 'all'],
    queryFn:  paymentService.getPending,
    refetchInterval: 30_000,
  });

  const { data: allBatches = [] } = useQuery({
    queryKey: ['batches'],
    queryFn: () => batchService.getAll({ active: 'true' }),
  });

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

  if (isLoading) return (
    <div className="flex items-center justify-center py-16">
      <Loader2 className="w-6 h-6 text-[#CA6357] animate-spin" />
    </div>
  );

  if (payments.length === 0) return (
    <div className="flex flex-col items-center justify-center py-16 gap-3">
      <CheckCircle className="w-10 h-10 text-[#22C55E]" strokeWidth={1.5} />
      <p className="text-base font-bold text-[#1E293B]">All caught up!</p>
      <p className="text-sm text-[#94A3B8]">No registration receipts pending review.</p>
    </div>
  );

  return (
    <>
      {pendingCount > 0 && (
        <p className="text-sm text-[#94A3B8] mb-3">{pendingCount} pending review</p>
      )}
      <div className="divide-y divide-[#F8F9FB]">
        {payments.map((payment) => {
          const s = REG_STATUS_STYLES[payment.status] ?? REG_STATUS_STYLES.pending_review;
          return (
            <div key={payment._id} className="flex items-center gap-4 py-4 hover:bg-[#FAFAFA] transition-colors px-1">
              <div className="w-10 h-10 rounded-xl bg-[#FDEFEE] flex items-center justify-center flex-shrink-0">
                <CreditCard className="w-5 h-5 text-[#CA6357]" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-sm font-semibold text-[#1E293B]">{payment.user?.name}</p>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${s.bg} ${s.text}`}>{s.label}</span>
                </div>
                <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                  <span className="text-xs text-[#94A3B8]">{payment.user?.email}</span>
                  {payment.student?.course?.name && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#F2EEFD] text-[#7C6AF2]">{payment.student.course.name}</span>
                  )}
                </div>
                <span className="text-xs text-[#94A3B8]">
                  {METHOD_LABELS[payment.paymentMethod]} · ₹{payment.amount?.toLocaleString('en-IN')} ·{' '}
                  {new Date(payment.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                </span>
              </div>
              <button onClick={() => setViewing(payment)}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#CA6357] bg-[#FDEFEE] hover:bg-[#F6D9D6] px-3 py-1.5 rounded-lg transition-colors flex-shrink-0">
                <Eye className="w-3.5 h-3.5" /> Review
              </button>
            </div>
          );
        })}
      </div>

      {viewing && (
        <RegReceiptModal
          payment={viewing}
          batches={batchesForViewing}
          onClose={() => setViewing(null)}
          onApprove={(batchId) => approveMutation.mutate({ id: viewing._id, batchId })}
          onReject={(note) => rejectMutation.mutate({ id: viewing._id, reviewNote: note })}
          isProcessing={isProcessing}
        />
      )}
    </>
  );
}

// ── Installments tab ──────────────────────────────────────────────────────────

function InstReceiptModal({ url, onClose }) {
  useBodyScrollLock();
  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl overflow-hidden max-w-lg w-full" onClick={e => e.stopPropagation()}
        style={{ boxShadow: '0 8px 40px rgba(0,0,0,0.3)' }}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#F1F5F9]">
          <p className="text-sm font-bold text-[#1E293B]">Payment Receipt</p>
          <button onClick={onClose} className="text-xs text-[#94A3B8] hover:text-[#1E293B]">Close</button>
        </div>
        <div className="p-4">
          <img src={url} alt="Receipt" className="w-full rounded-xl" />
        </div>
      </div>
    </div>
  );
}

function InstRejectModal({ payment, onClose }) {
  useBodyScrollLock();
  const qc = useQueryClient();
  const [note, setNote] = useState('');

  const mutation = useMutation({
    mutationFn: () => feesService.rejectInstallmentPayment(payment._id, note),
    onSuccess: () => {
      toast.success('Payment rejected');
      qc.invalidateQueries({ queryKey: ['pending-installment-payments'] });
      onClose();
    },
    onError: (e) => toast.error(e.response?.data?.message ?? 'Failed to reject'),
  });

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-sm" style={{ boxShadow: '0 8px 40px rgba(0,0,0,0.15)' }}>
        <div className="px-6 py-5 border-b border-[#F1F5F9]">
          <p className="text-base font-bold text-[#1E293B]">Reject Payment</p>
          <p className="text-sm text-[#94A3B8] mt-0.5">{payment.user?.name} — Installment #{payment.installmentNumber}</p>
        </div>
        <div className="px-6 py-5 space-y-4">
          <div>
            <label className="block text-xs font-bold text-[#475569] uppercase tracking-wide mb-1.5">
              Reason for rejection *
            </label>
            <textarea value={note} onChange={e => setNote(e.target.value)} rows={3}
              placeholder="Explain why the receipt is being rejected…"
              className="w-full border border-[#E2E8F0] rounded-xl px-3 py-2.5 text-sm resize-none focus:outline-none focus:border-[#D96C5F]" />
          </div>
          <div className="flex gap-3">
            <button onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-[#E2E8F0] text-sm font-semibold text-[#475569] hover:bg-[#F8F9FB]">
              Cancel
            </button>
            <button onClick={() => mutation.mutate()} disabled={!note.trim() || mutation.isPending}
              className="flex-1 inline-flex items-center justify-center gap-2 py-2.5 rounded-xl bg-[#D96C5F] hover:bg-[#C45E52] disabled:opacity-60 text-white font-semibold text-sm transition-colors">
              {mutation.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <XCircle className="w-3.5 h-3.5" />}
              Reject
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function InstallmentsTab() {
  const qc = useQueryClient();
  const [previewUrl,      setPreviewUrl]      = useState(null);
  const [rejectingPayment, setRejectingPayment] = useState(null);

  const { data: payments = [], isLoading } = useQuery({
    queryKey: ['pending-installment-payments'],
    queryFn:  feesService.getPendingInstallmentPayments,
    refetchInterval: 30_000,
  });

  const approveMutation = useMutation({
    mutationFn: (paymentId) => feesService.approveInstallmentPayment(paymentId),
    onSuccess: () => {
      toast.success('Payment approved — installment unlocked');
      qc.invalidateQueries({ queryKey: ['pending-installment-payments'] });
    },
    onError: (e) => toast.error(e.response?.data?.message ?? 'Failed to approve'),
  });

  if (isLoading) return (
    <div className="flex items-center justify-center py-16">
      <Loader2 className="w-5 h-5 text-[#CA6357] animate-spin" />
    </div>
  );

  if (payments.length === 0) return (
    <div className="flex flex-col items-center justify-center py-16 gap-3">
      <CheckCircle2 className="w-10 h-10 text-[#22A66E]" strokeWidth={1.5} />
      <p className="text-base font-bold text-[#1E293B]">All caught up!</p>
      <p className="text-sm text-[#94A3B8]">No installment receipts pending review.</p>
    </div>
  );

  return (
    <>
      <p className="text-sm text-[#94A3B8] mb-3">{payments.length} pending review</p>
      <div className="space-y-4">
        {payments.map((payment) => (
          <div key={payment._id} className="bg-[#F8F9FB] rounded-2xl border border-[#E2E8F0] overflow-hidden">
            <div className="flex items-center gap-4 px-5 py-4 border-b border-white">
              <div className="w-10 h-10 rounded-xl bg-[#FDEFEE] flex items-center justify-center flex-shrink-0 text-sm font-bold text-[#CA6357]">
                {payment.user?.name?.charAt(0)?.toUpperCase() ?? '?'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-[#1E293B]">{payment.user?.name ?? '—'}</p>
                <p className="text-xs text-[#94A3B8]">{payment.user?.email}</p>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="text-base font-bold text-[#1E293B]">₹{payment.amount?.toLocaleString('en-IN')}</p>
                <p className="text-xs text-[#94A3B8]">Installment #{payment.installmentNumber}</p>
              </div>
            </div>

            <div className="px-5 py-3 grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div>
                <p className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-wide">Method</p>
                <p className="text-sm font-semibold text-[#1E293B] mt-0.5">{METHOD_LABELS[payment.paymentMethod] ?? payment.paymentMethod}</p>
              </div>
              {payment.transactionId && (
                <div>
                  <p className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-wide">Txn ID</p>
                  <p className="text-sm font-semibold text-[#1E293B] mt-0.5 font-mono">{payment.transactionId}</p>
                </div>
              )}
              <div>
                <p className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-wide">Submitted</p>
                <p className="text-sm font-semibold text-[#1E293B] mt-0.5">
                  {new Date(payment.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                </p>
              </div>
            </div>

            {payment.studentNote && (
              <div className="mx-5 mb-3 bg-white rounded-xl px-3 py-2.5 text-xs text-[#475569] border border-[#F1F5F9]">
                <span className="font-bold text-[#94A3B8]">Student note: </span>{payment.studentNote}
              </div>
            )}

            <div className="flex items-center gap-3 px-5 py-3 border-t border-white">
              <button onClick={() => setPreviewUrl(payment.receiptUrl)}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#CA6357] hover:bg-[#FDEFEE] px-3 py-2 rounded-xl transition-colors">
                <Eye className="w-3.5 h-3.5" /> View Receipt
              </button>
              <div className="flex-1" />
              <button onClick={() => setRejectingPayment(payment)}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#D96C5F] hover:bg-[#FEE2E2] px-3 py-2 rounded-xl transition-colors">
                <XCircle className="w-3.5 h-3.5" /> Reject
              </button>
              <button onClick={() => approveMutation.mutate(payment._id)} disabled={approveMutation.isPending}
                className="inline-flex items-center gap-1.5 text-xs font-semibold bg-[#22A66E] hover:bg-[#1A8B5C] disabled:opacity-60 text-white px-4 py-2 rounded-xl transition-colors">
                {approveMutation.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                Approve
              </button>
            </div>
          </div>
        ))}
      </div>

      {previewUrl      && <InstReceiptModal url={previewUrl} onClose={() => setPreviewUrl(null)} />}
      {rejectingPayment && <InstRejectModal payment={rejectingPayment} onClose={() => setRejectingPayment(null)} />}
    </>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

const TABS = [
  { key: 'registration',  label: 'Registration',  icon: CreditCard,   queryKey: ['payments', 'all'],               countFn: (d) => d.filter(p => p.status === 'pending_review').length },
  { key: 'installments',  label: 'Installments',  icon: IndianRupee,  queryKey: ['pending-installment-payments'],  countFn: (d) => d.length },
];

export default function PaymentsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') ?? 'registration';

  const setTab = (key) => setSearchParams({ tab: key }, { replace: true });

  const { data: regPayments    = [] } = useQuery({ queryKey: ['payments', 'all'],              queryFn: paymentService.getPending,                    refetchInterval: 30_000 });
  const { data: instPayments   = [] } = useQuery({ queryKey: ['pending-installment-payments'], queryFn: feesService.getPendingInstallmentPayments,    refetchInterval: 30_000 });

  const counts = {
    registration: regPayments.filter(p => p.status === 'pending_review').length,
    installments: instPayments.length,
  };

  const totalPending = counts.registration + counts.installments;

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
              <h2 className="text-2xl font-bold text-white">Payment Approvals</h2>
              {totalPending > 0 && (
                <p className="text-white/60 text-sm mt-0.5">{totalPending} receipt{totalPending !== 1 ? 's' : ''} awaiting review</p>
              )}
            </div>
          </div>
          {totalPending > 0 && (
            <div className="bg-[#D96C5F] text-white text-sm font-bold px-4 py-2 rounded-xl flex-shrink-0">
              {totalPending} Pending
            </div>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-2xl overflow-hidden" style={{ boxShadow: '0 2px 16px rgba(0,0,0,0.05)' }}>
        <div className="flex border-b border-[#F1F5F9]">
          {TABS.map(({ key, label, icon: Icon }) => {
            const count   = counts[key];
            const isActive = activeTab === key;
            return (
              <button key={key} onClick={() => setTab(key)}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-3.5 text-sm font-semibold transition-colors border-b-2 ${
                  isActive
                    ? 'border-[#CA6357] text-[#CA6357] bg-[#FDEFEE]'
                    : 'border-transparent text-[#94A3B8] hover:text-[#475569] hover:bg-[#F8F9FB]'
                }`}>
                <Icon className="w-4 h-4" />
                {label}
                {count > 0 && (
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                    isActive ? 'bg-[#CA6357] text-white' : 'bg-[#FEE2E2] text-[#D96C5F]'
                  }`}>
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <div className="p-6">
          {activeTab === 'registration'  && <RegistrationTab />}
          {activeTab === 'installments'  && <InstallmentsTab />}
        </div>
      </div>
    </div>
  );
}
