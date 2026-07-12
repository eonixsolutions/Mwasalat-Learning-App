import { useState, useRef } from 'react';
import useBodyScrollLock from '../../../hooks/useBodyScrollLock.js';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import {
  CreditCard, CheckCircle2, Clock, AlertTriangle, Upload, X,
  ImageIcon, Loader2, ChevronDown, ChevronUp, Lock, IndianRupee,
} from 'lucide-react';
import { feesService } from '../../../services/fees.service.js';

// ── config ───────────────────────────────────────────────────────────────────

const PAYMENT_METHODS = [
  { value: 'upi',           label: 'UPI (GPay, PhonePe, Paytm)' },
  { value: 'bank_transfer', label: 'Bank Transfer / NEFT / IMPS' },
  { value: 'cash',          label: 'Cash Payment' },
  { value: 'other',         label: 'Other' },
];

const STATUS_CFG = {
  upcoming:  { label: 'Upcoming',        color: '#94A3B8',  bg: '#F1F5F9',  icon: Lock },
  due:       { label: 'Due',             color: '#F59E0B',  bg: '#FFFBEB',  icon: Clock },
  submitted: { label: 'Under Review',    color: '#3B82F6',  bg: '#EFF6FF',  icon: Clock },
  paid:      { label: 'Paid',            color: '#22A66E',  bg: '#E8F8F2',  icon: CheckCircle2 },
  overdue:   { label: 'Overdue',         color: '#D96C5F',  bg: '#FEE2E2',  icon: AlertTriangle },
  waived:    { label: 'Waived',          color: '#7C6AF2',  bg: '#F0EDFE',  icon: CheckCircle2 },
};

const OVERALL_CFG = {
  pending: { label: 'Pending',     color: '#F59E0B',  bg: '#FFFBEB' },
  partial: { label: 'Partial',     color: '#3B82F6',  bg: '#EFF6FF' },
  paid:    { label: 'Fully Paid',  color: '#22A66E',  bg: '#E8F8F2' },
  overdue: { label: 'Overdue',     color: '#D96C5F',  bg: '#FEE2E2' },
};

// ── PaymentModal ──────────────────────────────────────────────────────────────

function PaymentModal({ installment, onClose }) {
  const qc = useQueryClient();
  const fileRef = useRef(null);

  useBodyScrollLock();

  const [file,          setFile]          = useState(null);
  const [preview,       setPreview]       = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('');
  const [transactionId, setTransactionId] = useState('');
  const [note,          setNote]          = useState('');

  const handleFile = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    setPreview(URL.createObjectURL(f));
  };

  const clearFile = () => {
    setFile(null);
    setPreview(null);
    if (fileRef.current) fileRef.current.value = '';
  };

  const mutation = useMutation({
    mutationFn: () => {
      const fd = new FormData();
      fd.append('receipt', file);
      fd.append('paymentMethod', paymentMethod);
      if (transactionId.trim()) fd.append('transactionId', transactionId.trim());
      if (note.trim())          fd.append('studentNote', note.trim());
      return feesService.submitInstallmentPayment(installment.installmentNumber, fd);
    },
    onSuccess: () => {
      toast.success('Receipt submitted! Awaiting coordinator review.');
      qc.invalidateQueries({ queryKey: ['my-fee-account'] });
      onClose();
    },
    onError: (e) => toast.error(e.response?.data?.message ?? 'Submission failed'),
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!file)          return toast.error('Please upload your payment receipt');
    if (!paymentMethod) return toast.error('Please select a payment method');
    mutation.mutate();
  };

  return (
    <div className="fixed inset-0 bg-black/40 z-40 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-md flex flex-col max-h-[90vh]" style={{ boxShadow: '0 8px 40px rgba(0,0,0,0.15)' }}>
        <div className="flex items-center justify-between px-6 py-5 border-b border-[#F1F5F9] flex-shrink-0">
          <div>
            <p className="text-base font-bold text-[#1E293B]">Submit Payment Receipt</p>
            <p className="text-sm text-[#94A3B8] mt-0.5">{installment.label} — ₹{installment.amount?.toLocaleString('en-IN')}</p>
          </div>
          <button type="button" onClick={onClose} className="text-xs text-[#94A3B8] hover:text-[#1E293B]">Cancel</button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto scrollbar-hide px-6 py-5 space-y-5">
          {/* Receipt upload */}
          <div>
            <p className="text-xs font-bold text-[#475569] uppercase tracking-wide mb-2">Payment Receipt *</p>
            {!preview ? (
              <label
                className="flex flex-col items-center justify-center gap-2 border-2 border-dashed border-[#CBD5E1] rounded-2xl p-8 cursor-pointer hover:border-[#CA6357] hover:bg-[#FDEFEE] transition-colors"
              >
                <Upload className="w-7 h-7 text-[#94A3B8]" strokeWidth={1.5} />
                <div className="text-center">
                  <p className="text-sm font-semibold text-[#475569]">Click to upload screenshot</p>
                  <p className="text-xs text-[#94A3B8] mt-0.5">JPG, PNG or WebP · Max 5 MB</p>
                </div>
                <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
              </label>
            ) : (
              <div className="relative rounded-2xl overflow-hidden border border-[#E2E8F0]">
                <img src={preview} alt="Receipt preview" className="w-full max-h-48 object-cover" />
                <button
                  type="button"
                  onClick={clearFile}
                  className="absolute top-2 right-2 bg-white rounded-full p-1.5 shadow hover:bg-[#FEE2E2] transition-colors"
                >
                  <X className="w-3.5 h-3.5 text-[#D96C5F]" />
                </button>
              </div>
            )}
          </div>

          {/* Payment method */}
          <div>
            <p className="text-xs font-bold text-[#475569] uppercase tracking-wide mb-2">Payment Method *</p>
            <div className="grid grid-cols-2 gap-2">
              {PAYMENT_METHODS.map(m => (
                <button
                  key={m.value}
                  type="button"
                  onClick={() => setPaymentMethod(m.value)}
                  className={`text-left px-3 py-2.5 rounded-xl border text-xs font-semibold transition-colors ${
                    paymentMethod === m.value
                      ? 'border-[#CA6357] bg-[#FDEFEE] text-[#CA6357]'
                      : 'border-[#E2E8F0] text-[#475569] hover:border-[#CA6357]'
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>

          {/* Transaction ID */}
          <div>
            <p className="text-xs font-bold text-[#475569] uppercase tracking-wide mb-1.5">Transaction ID (optional)</p>
            <input
              type="text"
              value={transactionId}
              onChange={e => setTransactionId(e.target.value)}
              placeholder="UPI Ref, UTR number, etc."
              className="w-full border border-[#E2E8F0] rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#CA6357]"
            />
          </div>

          {/* Note */}
          <div>
            <p className="text-xs font-bold text-[#475569] uppercase tracking-wide mb-1.5">Note (optional)</p>
            <textarea
              value={note}
              onChange={e => setNote(e.target.value)}
              rows={2}
              placeholder="Any message for the coordinator…"
              className="w-full border border-[#E2E8F0] rounded-xl px-3 py-2.5 text-sm resize-none focus:outline-none focus:border-[#CA6357]"
            />
          </div>

          <button
            type="submit"
            disabled={mutation.isPending}
            className="w-full inline-flex items-center justify-center gap-2 bg-[#CA6357] hover:bg-[#b85548] disabled:opacity-60 text-white font-semibold py-3 rounded-xl transition-colors"
          >
            {mutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
            Submit Receipt
          </button>
        </form>
      </div>
    </div>
  );
}

// ── main page ─────────────────────────────────────────────────────────────────

export default function FeesPage() {
  const [openModal, setOpenModal] = useState(null); // installment object
  const [historyOpen, setHistoryOpen] = useState(false);

  const { data: account, isLoading, isError, error } = useQuery({
    queryKey: ['my-fee-account'],
    queryFn:  feesService.getMyFeeAccount,
    retry: false,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="w-6 h-6 text-[#CA6357] animate-spin" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <CreditCard className="w-12 h-12 text-[#CBD5E1] mb-4" strokeWidth={1.5} />
        <p className="text-base font-semibold text-[#475569]">No Fee Account Found</p>
        <p className="text-sm text-[#94A3B8] mt-1">{error?.response?.data?.message ?? 'Contact your coordinator to set up your fee account.'}</p>
      </div>
    );
  }

  const overallCfg = OVERALL_CFG[account.feeStatus] ?? OVERALL_CFG.pending;
  const paidPercent = account.totalFee > 0 ? Math.min(100, Math.round((account.totalPaid / account.totalFee) * 100)) : 0;

  const actionableInstallments = account.installments?.filter(i =>
    i.status === 'due' || i.status === 'overdue'
  ) ?? [];

  return (
    <div className="space-y-6 pb-8">

      {/* Header */}
      <div
        className="relative rounded-2xl overflow-hidden p-6 sm:p-8"
        style={{ background: 'linear-gradient(135deg, #CA6357 0%, #A94E43 100%)' }}
      >
        <div className="relative z-10 flex items-start justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-white/15 flex items-center justify-center flex-shrink-0">
              <CreditCard className="w-7 h-7 text-white" strokeWidth={1.8} />
            </div>
            <div>
              <p className="text-xs font-bold tracking-widest text-[#F2B3AC] uppercase mb-1">My Fees</p>
              <h2 className="text-2xl font-bold text-white">{account.course?.name ?? 'Fee Account'}</h2>
              <p className="text-white/60 text-sm mt-0.5">Up to Week {account.accessValidUntilWeek} unlocked</p>
            </div>
          </div>
          <span
            className="text-sm font-bold px-3 py-1.5 rounded-xl self-start"
            style={{ background: 'rgba(255,255,255,0.15)', color: 'white' }}
          >
            {overallCfg.label}
          </span>
        </div>

        {/* Progress bar */}
        <div className="mt-6">
          <div className="flex justify-between text-xs text-white/70 mb-1.5">
            <span>₹{account.totalPaid?.toLocaleString('en-IN')} paid</span>
            <span>₹{account.totalFee?.toLocaleString('en-IN')} total</span>
          </div>
          <div className="h-2.5 bg-white/20 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{ width: `${paidPercent}%`, background: paidPercent === 100 ? '#22C55E' : '#F2B3AC' }}
            />
          </div>
          <p className="text-xs text-white/60 mt-1">{paidPercent}% paid</p>
        </div>
      </div>

      {/* Overdue / due alert */}
      {actionableInstallments.length > 0 && (
        <div className="bg-[#FEF9EC] border border-[#FDE68A] rounded-2xl p-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-[#F59E0B] flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-bold text-[#92400E]">
              {actionableInstallments.some(i => i.status === 'overdue') ? 'Payment Overdue' : 'Payment Due'}
            </p>
            <p className="text-xs text-[#92400E]/80 mt-0.5">
              {actionableInstallments.map(i => i.label).join(', ')} — please submit your receipt to avoid access suspension.
            </p>
          </div>
        </div>
      )}

      {/* Installment timeline */}
      <div>
        <h3 className="text-base font-bold text-[#1E293B] mb-3">Installment Schedule</h3>
        <div className="space-y-3">
          {account.installments?.map((inst, idx) => {
            const cfg  = STATUS_CFG[inst.status] ?? STATUS_CFG.upcoming;
            const Icon = cfg.icon;
            const canPay = inst.status === 'due' || inst.status === 'overdue';

            return (
              <div
                key={inst.installmentNumber}
                className={`bg-white rounded-2xl border p-5 flex items-center gap-4 ${
                  inst.status === 'overdue' ? 'border-[#FECACA]' : 'border-[#E2E8F0]'
                }`}
                style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}
              >
                {/* Step dot */}
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: cfg.bg }}
                >
                  <Icon className="w-4.5 h-4.5" style={{ color: cfg.color }} />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-bold text-[#1E293B]">{inst.label || `Installment ${inst.installmentNumber}`}</p>
                    <span
                      className="text-[11px] font-semibold px-2 py-0.5 rounded-full"
                      style={{ background: cfg.bg, color: cfg.color }}
                    >
                      {cfg.label}
                    </span>
                  </div>
                  <p className="text-xs text-[#94A3B8] mt-0.5">
                    Due {new Date(inst.dueDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    {' · '}{inst.weeksAccess} weeks access
                  </p>
                  {inst.reviewNote && (
                    <p className="text-xs text-[#D96C5F] mt-0.5">Note: {inst.reviewNote}</p>
                  )}
                  {inst.paidAt && (
                    <p className="text-xs text-[#22A66E] mt-0.5">
                      Paid on {new Date(inst.paidAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </p>
                  )}
                </div>

                <div className="text-right flex-shrink-0 flex flex-col items-end gap-2">
                  <p className="text-base font-bold text-[#1E293B]">₹{inst.amount?.toLocaleString('en-IN')}</p>
                  {canPay && (
                    <button
                      onClick={() => setOpenModal(inst)}
                      className="text-xs font-semibold bg-[#CA6357] hover:bg-[#b85548] text-white px-3 py-1.5 rounded-xl transition-colors"
                    >
                      Submit Receipt
                    </button>
                  )}
                  {inst.status === 'submitted' && (
                    <span className="text-[11px] font-semibold text-[#3B82F6]">Receipt submitted</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Help section */}
      <div className="bg-[#F8F9FB] rounded-2xl p-5 border border-[#E2E8F0]">
        <p className="text-sm font-bold text-[#1E293B] mb-2">How to pay</p>
        <ol className="space-y-1.5 text-xs text-[#475569]">
          <li className="flex gap-2"><span className="font-bold text-[#CA6357]">1.</span> Transfer the installment amount using UPI or bank transfer to the account details shared by your coordinator.</li>
          <li className="flex gap-2"><span className="font-bold text-[#CA6357]">2.</span> Take a screenshot of the payment confirmation.</li>
          <li className="flex gap-2"><span className="font-bold text-[#CA6357]">3.</span> Click "Submit Receipt" on the due installment and upload the screenshot.</li>
          <li className="flex gap-2"><span className="font-bold text-[#CA6357]">4.</span> The coordinator will verify and approve within 24 hours.</li>
        </ol>
      </div>

      {openModal && (
        <PaymentModal installment={openModal} onClose={() => setOpenModal(null)} />
      )}
    </div>
  );
}
