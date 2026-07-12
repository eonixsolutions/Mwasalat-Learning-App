import { useState } from 'react';
import useBodyScrollLock from '../../../hooks/useBodyScrollLock.js';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import {
  CreditCard, CheckCircle2, XCircle, Loader2, Eye, IndianRupee,
  AlertTriangle, Clock,
} from 'lucide-react';
import { feesService } from '../../../services/fees.service.js';

const METHOD_LABELS = {
  upi:           'UPI',
  bank_transfer: 'Bank Transfer',
  cash:          'Cash',
  other:         'Other',
};

function ReceiptModal({ url, onClose }) {
  useBodyScrollLock();
  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl overflow-hidden max-w-lg w-full" onClick={e => e.stopPropagation()} style={{ boxShadow: '0 8px 40px rgba(0,0,0,0.3)' }}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#F1F5F9]">
          <p className="text-sm font-bold text-[#1E293B]">Payment Receipt</p>
          <button onClick={onClose} className="text-xs text-[#94A3B8] hover:text-[#1E293B]">Close</button>
        </div>
        <div className="p-4">
          <img src={url} alt="Payment receipt" className="w-full rounded-xl" />
        </div>
      </div>
    </div>
  );
}

function RejectModal({ payment, onClose }) {
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
            <label className="block text-xs font-bold text-[#475569] uppercase tracking-wide mb-1.5">Reason for rejection *</label>
            <textarea
              value={note}
              onChange={e => setNote(e.target.value)}
              rows={3}
              placeholder="Explain why the receipt is being rejected…"
              className="w-full border border-[#E2E8F0] rounded-xl px-3 py-2.5 text-sm resize-none focus:outline-none focus:border-[#D96C5F]"
            />
          </div>
          <div className="flex gap-3">
            <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-[#E2E8F0] text-sm font-semibold text-[#475569] hover:bg-[#F8F9FB]">
              Cancel
            </button>
            <button
              onClick={() => mutation.mutate()}
              disabled={!note.trim() || mutation.isPending}
              className="flex-1 inline-flex items-center justify-center gap-2 py-2.5 rounded-xl bg-[#D96C5F] hover:bg-[#C45E52] disabled:opacity-60 text-white font-semibold text-sm transition-colors"
            >
              {mutation.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <XCircle className="w-3.5 h-3.5" />}
              Reject
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function InstallmentApprovalsPage() {
  const qc = useQueryClient();
  const [previewUrl, setPreviewUrl] = useState(null);
  const [rejectingPayment, setRejectingPayment] = useState(null);

  const { data: payments = [], isLoading } = useQuery({
    queryKey: ['pending-installment-payments'],
    queryFn:  feesService.getPendingInstallmentPayments,
  });

  const approveMutation = useMutation({
    mutationFn: (paymentId) => feesService.approveInstallmentPayment(paymentId),
    onSuccess: () => {
      toast.success('Payment approved — installment unlocked');
      qc.invalidateQueries({ queryKey: ['pending-installment-payments'] });
    },
    onError: (e) => toast.error(e.response?.data?.message ?? 'Failed to approve'),
  });

  return (
    <div className="space-y-6 pb-8">

      {/* Header */}
      <div
        className="relative rounded-2xl overflow-hidden p-6 sm:p-8"
        style={{ background: 'linear-gradient(135deg, #CA6357 0%, #A94E43 100%)' }}
      >
        <div className="relative z-10 flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-white/15 flex items-center justify-center flex-shrink-0">
            <IndianRupee className="w-7 h-7 text-white" strokeWidth={1.8} />
          </div>
          <div>
            <p className="text-xs font-bold tracking-widest text-[#F2B3AC] uppercase mb-1">Coordinator</p>
            <h2 className="text-2xl font-bold text-white">Installment Approvals</h2>
            <p className="text-white/60 text-sm mt-0.5">Review fee receipt submissions from students</p>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-5 h-5 text-[#CA6357] animate-spin" />
        </div>
      ) : payments.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-[#E2E8F0]">
          <CheckCircle2 className="w-12 h-12 text-[#22A66E] mx-auto mb-3" strokeWidth={1.5} />
          <p className="text-sm font-semibold text-[#475569]">All caught up!</p>
          <p className="text-xs text-[#94A3B8] mt-1">No pending installment payments to review.</p>
        </div>
      ) : (
        <div className="space-y-4">
          <p className="text-sm text-[#94A3B8]">{payments.length} pending review</p>
          {payments.map((payment) => (
            <div
              key={payment._id}
              className="bg-white rounded-2xl border border-[#E2E8F0] overflow-hidden"
              style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}
            >
              {/* Student info */}
              <div className="flex items-center gap-4 px-5 py-4 border-b border-[#F8F9FB]">
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

              {/* Payment details */}
              <div className="px-5 py-4 grid grid-cols-2 sm:grid-cols-3 gap-3">
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
                <div className="mx-5 mb-4 bg-[#F8F9FB] rounded-xl px-3 py-2.5 text-xs text-[#475569] border border-[#F1F5F9]">
                  <span className="font-bold text-[#94A3B8]">Student note: </span>{payment.studentNote}
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center gap-3 px-5 py-4 border-t border-[#F8F9FB]">
                <button
                  onClick={() => setPreviewUrl(payment.receiptUrl)}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#CA6357] hover:bg-[#FDEFEE] px-3 py-2 rounded-xl transition-colors"
                >
                  <Eye className="w-3.5 h-3.5" /> View Receipt
                </button>
                <div className="flex-1" />
                <button
                  onClick={() => setRejectingPayment(payment)}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#D96C5F] hover:bg-[#FEE2E2] px-3 py-2 rounded-xl transition-colors"
                >
                  <XCircle className="w-3.5 h-3.5" /> Reject
                </button>
                <button
                  onClick={() => approveMutation.mutate(payment._id)}
                  disabled={approveMutation.isPending}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold bg-[#22A66E] hover:bg-[#1A8B5C] disabled:opacity-60 text-white px-4 py-2 rounded-xl transition-colors"
                >
                  {approveMutation.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                  Approve
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {previewUrl && <ReceiptModal url={previewUrl} onClose={() => setPreviewUrl(null)} />}
      {rejectingPayment && <RejectModal payment={rejectingPayment} onClose={() => setRejectingPayment(null)} />}
    </div>
  );
}
