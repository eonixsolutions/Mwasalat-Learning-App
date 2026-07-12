import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Upload, X, ImageIcon, Loader2, CheckCircle } from 'lucide-react';
import { paymentService } from '../../services/payment.service.js';

const PAYMENT_METHODS = [
  { value: 'upi',           label: 'UPI (GPay, PhonePe, Paytm, etc.)' },
  { value: 'bank_transfer', label: 'Bank Transfer / NEFT / IMPS' },
  { value: 'cash',          label: 'Cash Payment' },
  { value: 'other',         label: 'Other' },
];

export default function RegistrationPayment() {
  const navigate   = useNavigate();
  const courseName = localStorage.getItem('eonix_reg_course') || 'Your Program';
  const fileRef    = useRef(null);

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

  const { mutate, isPending } = useMutation({
    mutationFn: () => {
      const fd = new FormData();
      fd.append('receipt', file);
      fd.append('paymentMethod', paymentMethod);
      if (transactionId.trim()) fd.append('transactionId', transactionId.trim());
      if (note.trim())          fd.append('studentNote', note.trim());
      return paymentService.submitProof(fd);
    },
    onSuccess: () => {
      localStorage.removeItem('eonix_reg_email');
      localStorage.removeItem('eonix_reg_course');
      navigate('/register/payment-pending');
    },
    onError: (err) => toast.error(err?.response?.data?.message ?? 'Failed to submit proof'),
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!file)          return toast.error('Please upload your payment receipt');
    if (!paymentMethod) return toast.error('Please select a payment method');
    mutate();
  };

  return (
    <div>
      <h2 className="text-2xl font-bold text-[#1E293B] mb-1">Registration Fee Payment</h2>
      <p className="text-[#475569] text-sm mb-6">
        Pay the registration fee and upload your payment receipt for coordinator verification.
      </p>

      {/* Amount card */}
      <div className="bg-[#F8F9FB] rounded-2xl p-4 mb-5 space-y-2">
        <div className="flex justify-between items-center">
          <span className="text-sm text-[#475569]">Program</span>
          <span className="text-sm font-semibold text-[#1E293B]">{courseName}</span>
        </div>
        <div className="border-t border-[#E2E8F0] pt-2 flex justify-between items-center">
          <span className="text-sm font-bold text-[#1E293B]">Registration Fee</span>
          <span className="text-lg font-extrabold text-[#1F5E63]">₹1,000</span>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">

        {/* Payment method */}
        <div>
          <label className="block text-xs font-semibold text-[#475569] uppercase tracking-wider mb-1.5">
            Payment Method <span className="text-[#D96C5F]">*</span>
          </label>
          <select value={paymentMethod} onChange={e => setPaymentMethod(e.target.value)}
            className="w-full border border-[#E2E8F0] rounded-xl px-3 py-2.5 text-sm text-[#1E293B] focus:outline-none focus:border-[#1F5E63] bg-white">
            <option value="">Select method…</option>
            {PAYMENT_METHODS.map(m => (
              <option key={m.value} value={m.value}>{m.label}</option>
            ))}
          </select>
        </div>

        {/* Transaction ID */}
        <div>
          <label className="block text-xs font-semibold text-[#475569] uppercase tracking-wider mb-1.5">
            Transaction ID / UTR <span className="text-[#94A3B8] font-normal normal-case">(optional)</span>
          </label>
          <input value={transactionId} onChange={e => setTransactionId(e.target.value)}
            placeholder="e.g. 123456789012"
            className="w-full border border-[#E2E8F0] rounded-xl px-3 py-2.5 text-sm text-[#1E293B] placeholder-[#94A3B8] focus:outline-none focus:border-[#1F5E63]" />
        </div>

        {/* Receipt upload */}
        <div>
          <label className="block text-xs font-semibold text-[#475569] uppercase tracking-wider mb-1.5">
            Payment Receipt Screenshot <span className="text-[#D96C5F]">*</span>
          </label>
          {preview ? (
            <div className="relative rounded-2xl overflow-hidden border border-[#E2E8F0]">
              <img src={preview} alt="Receipt" className="w-full max-h-56 object-contain bg-[#F8F9FB]" />
              <button type="button" onClick={clearFile}
                className="absolute top-2 right-2 bg-white rounded-full p-1 shadow hover:bg-red-50 transition-colors">
                <X className="w-4 h-4 text-[#D96C5F]" />
              </button>
            </div>
          ) : (
            <label className="flex flex-col items-center justify-center gap-2 border-2 border-dashed border-[#E2E8F0] rounded-2xl p-8 cursor-pointer hover:border-[#1F5E63] hover:bg-[#F8F9FB] transition-colors">
              <div className="w-12 h-12 rounded-xl bg-[#E6F4F5] flex items-center justify-center">
                <ImageIcon className="w-5 h-5 text-[#1F5E63]" />
              </div>
              <div className="text-center">
                <p className="text-sm font-semibold text-[#1E293B]">Click to upload receipt</p>
                <p className="text-xs text-[#94A3B8] mt-0.5">JPG, PNG or WebP — max 5 MB</p>
              </div>
              <input ref={fileRef} type="file" accept="image/*" onChange={handleFile} className="hidden" />
            </label>
          )}
        </div>

        {/* Note */}
        <div>
          <label className="block text-xs font-semibold text-[#475569] uppercase tracking-wider mb-1.5">
            Note <span className="text-[#94A3B8] font-normal normal-case">(optional)</span>
          </label>
          <textarea value={note} onChange={e => setNote(e.target.value)} rows={2}
            placeholder="Any additional info for the coordinator…"
            className="w-full border border-[#E2E8F0] rounded-xl px-3 py-2.5 text-sm text-[#1E293B] placeholder-[#94A3B8] focus:outline-none focus:border-[#1F5E63] resize-none" />
        </div>

        <button type="submit" disabled={isPending}
          className="w-full bg-[#D96C5F] hover:bg-[#C45E52] disabled:opacity-60 text-white font-semibold py-3.5 rounded-xl transition-colors text-sm flex items-center justify-center gap-2">
          {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
          {isPending ? 'Submitting…' : 'Submit Payment Proof'}
        </button>
      </form>
    </div>
  );
}
