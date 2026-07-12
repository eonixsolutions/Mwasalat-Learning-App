import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { AlertTriangle, CreditCard } from 'lucide-react';
import { feesService } from '../../services/fees.service.js';
import { useAuth } from '../../hooks/useAuth.js';
import { ROLES } from '../../constants/roles.js';
import useBodyScrollLock from '../../hooks/useBodyScrollLock.js';

const STORAGE_KEY = 'eonix_fee_reminder_dismissed';

function isDismissedToday() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return false;
    const today = new Date().toISOString().split('T')[0];
    return stored === today;
  } catch {
    return false;
  }
}

function markDismissedToday() {
  try {
    const today = new Date().toISOString().split('T')[0];
    localStorage.setItem(STORAGE_KEY, today);
  } catch {}
}

export function FeeReminderModal() {
  const { user } = useAuth();
  const navigate  = useNavigate();
  const [dismissed, setDismissed] = useState(isDismissedToday);

  const isStudent = user?.role === ROLES.STUDENT;

  const { data: account } = useQuery({
    queryKey: ['my-fee-account'],
    queryFn:  feesService.getMyFeeAccount,
    enabled:  isStudent && !dismissed,
    retry: false,
    staleTime: 5 * 60 * 1000,
  });

  // For 'partial', only show the reminder if there's an actual overdue or due installment —
  // not if the student has paid some installments and the next one isn't due yet.
  const hasUrgentInstallment = account?.installments?.some(
    (i) => i.status === 'overdue' || i.status === 'due'
  );

  const shouldShow = isStudent
    && !dismissed
    && account
    && (
      account.feeStatus === 'pending'
      || account.feeStatus === 'overdue'
      || (account.feeStatus === 'partial' && hasUrgentInstallment)
    );

  useBodyScrollLock(shouldShow);

  if (!shouldShow) return null;

  const handleDismiss = () => {
    markDismissedToday();
    setDismissed(true);
  };

  const handlePayNow = () => {
    markDismissedToday();
    setDismissed(true);
    navigate('/student/fees');
  };

  const isOverdue = account.feeStatus === 'overdue';

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-sm" style={{ boxShadow: '0 8px 40px rgba(0,0,0,0.2)' }}>
        {/* Top stripe */}
        <div
          className="h-1.5 rounded-t-2xl"
          style={{ background: isOverdue ? '#D96C5F' : '#F59E0B' }}
        />

        <div className="px-6 py-5 space-y-4">
          <div className="flex items-start gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: isOverdue ? '#FEE2E2' : '#FFFBEB' }}
            >
              <AlertTriangle className="w-5 h-5" style={{ color: isOverdue ? '#D96C5F' : '#F59E0B' }} />
            </div>
            <div>
              <p className="text-base font-bold text-[#1E293B]">
                {isOverdue ? 'Fee Payment Overdue' : 'Fee Payment Reminder'}
              </p>
              <p className="text-sm text-[#475569] mt-1">
                {isOverdue
                  ? 'Your fee payment is overdue. Please submit your receipt to avoid access suspension.'
                  : 'You have a pending fee installment. Please pay to ensure uninterrupted access.'}
              </p>
            </div>
          </div>

          {/* Summary */}
          <div className="bg-[#F8F9FB] rounded-xl p-3.5 space-y-1.5 text-sm">
            <div className="flex justify-between">
              <span className="text-[#94A3B8]">Total paid</span>
              <span className="font-bold text-[#22A66E]">₹{account.totalPaid?.toLocaleString('en-IN')}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#94A3B8]">Total fee</span>
              <span className="font-bold text-[#1E293B]">₹{account.totalFee?.toLocaleString('en-IN')}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#94A3B8]">Access valid until</span>
              <span className="font-bold text-[#1E293B]">Week {account.accessValidUntilWeek}</span>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleDismiss}
              className="flex-1 py-2.5 rounded-xl border border-[#E2E8F0] text-sm font-semibold text-[#475569] hover:bg-[#F8F9FB] transition-colors"
            >
              Remind Later
            </button>
            <button
              onClick={handlePayNow}
              className="flex-1 inline-flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-semibold text-white transition-colors"
              style={{ background: isOverdue ? '#D96C5F' : '#CA6357' }}
            >
              <CreditCard className="w-3.5 h-3.5" />
              View Fees
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
