import { useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import {
  Users, Search, XCircle, Clock,
  ChevronDown, X, Loader2, UserCheck,
  BookOpen, Calendar, Wifi, MapPin, GraduationCap,
  ChevronLeft, ChevronRight, Layers, CheckCircle2, AlertCircle,
  FileText, Mail, RefreshCw, CreditCard, Eye, ImageOff, IndianRupee,
} from 'lucide-react';
import { studentService } from '../../../services/student.service.js';
import { paymentService } from '../../../services/payment.service.js';
import { staffService } from '../../../services/staff.service.js';
import { batchService } from '../../../services/batch.service.js';
import { tasksheetService } from '../../../services/tasksheet.service.js';
import { feesService } from '../../../services/fees.service.js';
import { useAuth } from '../../../hooks/useAuth.js';
import { ROLES } from '../../../constants/roles.js';

const STATUS_CONFIG = {
  active:    { label: 'Active',    color: '#22A66E', bg: '#E8F8F2' },
  dropped:   { label: 'Dropped',   color: '#C76D64', bg: '#FDEFEE' },
  graduated: { label: 'Graduated', color: '#7C6AF2', bg: '#F2EEFD' },
};

function Badge({ value, config }) {
  const cfg = config[String(value)] ?? { label: String(value), color: '#94A3B8', bg: '#F1F5F9' };
  return (
    <span
      className="inline-flex items-center text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full"
      style={{ backgroundColor: cfg.bg, color: cfg.color }}
    >
      {cfg.label}
    </span>
  );
}

function InitialsAvatar({ name, size = 'md' }) {
  const initials = (name || '?').split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase();
  const sizeClass = size === 'lg' ? 'w-12 h-12 text-base' : 'w-9 h-9 text-sm';
  return (
    <div className={`${sizeClass} rounded-full bg-[#FDEFEE] text-[#CA6357] font-bold flex items-center justify-center flex-shrink-0`}>
      {initials}
    </div>
  );
}

// ── Student detail drawer ─────────────────────────────────────────────────────
const TASK_SHEET_STATUS = {
  none:         { label: 'Not set up',   color: '#94A3B8', bg: '#F1F5F9' },
  provisioning: { label: 'Setting up…', color: '#F59E0B', bg: '#FFFBEB' },
  done:         { label: 'Ready',        color: '#22A66E', bg: '#E8F8F2' },
  error:        { label: 'Failed',       color: '#D96C5F', bg: '#FEE2E2' },
};

function StudentDrawer({ student, onClose, canApprove, canChangeStatus, canAssignBatch, canManageTaskSheet }) {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const isSuperAdmin = user?.role === ROLES.SUPER_ADMIN;
  const [assigningBatch, setAssigningBatch] = useState(false);
  const [selectedBatchId, setSelectedBatchId] = useState('');
  const [localBatch, setLocalBatch] = useState(student.batch ?? null);

  const { data: staffProfile } = useQuery({
    queryKey: ['staff', 'me'],
    queryFn: staffService.getMyProfile,
    enabled: canAssignBatch && !isSuperAdmin,
  });

  const { data: allBatches = [] } = useQuery({
    queryKey: ['batches'],
    queryFn: () => batchService.getAll({ active: 'true' }),
    enabled: canAssignBatch,
  });

  const { data: feeAccount } = useQuery({
    queryKey: ['fee-account', student._id],
    queryFn: () => feesService.getFeeAccountByStudent(student._id),
    enabled: canManageTaskSheet,
    retry: false,
  });

  const assignableBatches = canAssignBatch
    ? staffProfile
      ? allBatches.filter((b) =>
          (staffProfile.branches ?? []).some(
            (br) => (br._id ?? br) === (b.branch?._id ?? b.branch)
          )
        )
      : allBatches
    : [];

  const approveMutation = useMutation({
    mutationFn: () => studentService.approve(student._id),
    onSuccess: () => {
      toast.success('Student approved');
      queryClient.invalidateQueries({ queryKey: ['students'] });
      onClose();
    },
    onError: (err) => toast.error(err?.response?.data?.message ?? 'Failed to approve'),
  });

  const statusMutation = useMutation({
    mutationFn: (status) => studentService.updateStatus({ id: student._id, status }),
    onSuccess: () => {
      toast.success('Status updated');
      queryClient.invalidateQueries({ queryKey: ['students'] });
      onClose();
    },
    onError: (err) => toast.error(err?.response?.data?.message ?? 'Failed to update status'),
  });

  const batchMutation = useMutation({
    mutationFn: (batchId) => studentService.assignBatch(student._id, batchId),
    onSuccess: (_, batchId) => {
      toast.success('Batch assigned');
      const assigned = (assignableBatches.length ? assignableBatches : allBatches).find(b => b._id === batchId);
      if (assigned) setLocalBatch(assigned);
      queryClient.invalidateQueries({ queryKey: ['students'] });
      setAssigningBatch(false);
    },
    onError: (err) => toast.error(err?.response?.data?.message ?? 'Failed to assign batch'),
  });

  const provisionMutation = useMutation({
    mutationFn: () => tasksheetService.provisionTaskSheet(student._id),
    onSuccess: () => {
      toast.success('Task sheet provisioned! Student will receive a OneDrive invite.');
      queryClient.invalidateQueries({ queryKey: ['students'] });
    },
    onError: (err) => toast.error(err?.response?.data?.message ?? 'Provisioning failed'),
  });

  const resetMutation = useMutation({
    mutationFn: () => studentService.resetTaskSheet(student._id),
    onSuccess: () => {
      toast.success('Task sheet reset — you can now provision again');
      queryClient.invalidateQueries({ queryKey: ['students'] });
    },
    onError: (err) => toast.error(err?.response?.data?.message ?? 'Reset failed'),
  });

  const reshareMutation = useMutation({
    mutationFn: () => studentService.reshareTaskSheet(student._id),
    onSuccess: (res) => toast.success(res?.message ?? 'Task sheet reshared with mentors'),
    onError: (err) => toast.error(err?.response?.data?.message ?? 'Re-share failed'),
  });

  const info = student.user ?? {};
  const course = student.course ?? {};

  return (
    <>
      <div className="fixed inset-0 bg-black/30 z-40" onClick={onClose} />
      <div className="fixed right-0 top-0 h-screen w-full max-w-md bg-white z-50 shadow-2xl grid" style={{ gridTemplateRows: 'auto 1fr auto' }}>

        <div className="flex items-center gap-3 px-6 py-2.5 border-b border-[#F1F5F9]">
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-[#F8F9FB] transition-colors">
            <X className="w-5 h-5 text-[#94A3B8]" />
          </button>
          <p className="text-sm font-bold text-[#1E293B]">Student Details</p>
        </div>

        <div className="overflow-y-auto px-6 pt-4 pb-6 space-y-4">

          <div className="flex items-center gap-4">
            <InitialsAvatar name={info.name} size="lg" />
            <div>
              <div className="flex items-center gap-2">
                <p className="text-base font-bold text-[#1E293B]">{info.name}</p>
                {student.rollNumber && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#F2EEFD] text-[#7C6AF2]">
                    #{String(student.rollNumber).padStart(3, '0')}
                  </span>
                )}
              </div>
              <p className="text-sm text-[#94A3B8]">{info.email}</p>
              {info.phone && <p className="text-sm text-[#94A3B8]">{info.phone}</p>}
            </div>
          </div>

          <div className="flex gap-2 flex-wrap">
            <Badge value={student.studentStatus} config={STATUS_CONFIG} />
            {student.isReEnrollment && (
              <span className="inline-flex items-center text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#F2EEFD] text-[#7C6AF2]">
                Re-Enrollment
              </span>
            )}
            {student.registrationFeePaid && (
              <span className="inline-flex items-center text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#FDEFEE] text-[#CA6357]">
                Fee Paid
              </span>
            )}
          </div>

          <div className="bg-[#F8F9FB] rounded-2xl p-4 space-y-2">
            <p className="text-xs font-bold tracking-widest text-[#C76D64] uppercase mb-3">Course &amp; Batch</p>
            <div className="flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-[#CA6357]" />
              <span className="text-sm font-semibold text-[#1E293B]">{course.name ?? '—'}</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-[#94A3B8]" />
              <span className="text-sm text-[#475569]">{course.durationWeeks ?? '—'} weeks total</span>
            </div>
            <div className="flex items-center gap-2">
              {student.mentorshipMode === 'online'
                ? <Wifi className="w-4 h-4 text-[#94A3B8]" />
                : <MapPin className="w-4 h-4 text-[#94A3B8]" />}
              <span className="text-sm text-[#475569] capitalize">{student.mentorshipMode}</span>
            </div>
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-[#94A3B8]" />
              {student.batch
                ? <span className="text-sm text-[#475569]">
                    {student.batch.name}
                    {student.batch.branch && (
                      <span className="text-[#94A3B8]"> · {student.batch.branch.name}</span>
                    )}
                  </span>
                : <span className="text-sm text-[#CBD5E1]">No batch assigned</span>
              }
            </div>
            {student.educationQualification && (
              <div className="flex items-center gap-2">
                <GraduationCap className="w-4 h-4 text-[#94A3B8]" />
                <span className="text-sm text-[#475569]">{student.educationQualification}</span>
              </div>
            )}
          </div>

          <div className="bg-[#F8F9FB] rounded-2xl p-4">
            <p className="text-xs font-bold tracking-widest text-[#C76D64] uppercase mb-3">Progress</p>
            <div className="grid grid-cols-3 gap-3 text-center">
              {[
                { label: 'Current Week', value: `Week ${student.currentWeek}` },
                { label: 'Streak',       value: `${student.currentStreak}d`   },
                { label: 'Best Streak',  value: `${student.longestStreak}d`   },
              ].map(({ label, value }) => (
                <div key={label} className="bg-white rounded-xl p-3">
                  <p className="text-base font-bold text-[#1E293B]">{value}</p>
                  <p className="text-[10px] text-[#94A3B8] mt-0.5">{label}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2 text-sm text-[#475569]">
            <Calendar className="w-4 h-4 text-[#94A3B8]" />
            <span>Enrolled on {new Date(student.enrollmentDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
          </div>

          {student.notes && (
            <div className="bg-[#FFFBEB] rounded-2xl p-4">
              <p className="text-xs font-bold tracking-widest text-[#F59E0B] uppercase mb-2">Notes</p>
              <p className="text-sm text-[#475569] leading-relaxed">{student.notes}</p>
            </div>
          )}

          {/* Task Sheet section — coordinators and above only */}
          {canManageTaskSheet && (
            <div className="bg-[#F8F9FB] rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold tracking-widest text-[#C76D64] uppercase">Task Sheet</p>
                {(() => {
                  const status = student.taskSheetStatus ?? 'none';
                  const cfg = TASK_SHEET_STATUS[status] ?? TASK_SHEET_STATUS.none;
                  return (
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full"
                      style={{ backgroundColor: cfg.bg, color: cfg.color }}>
                      {cfg.label}
                    </span>
                  );
                })()}
              </div>

              {/* Fee status */}
              {(() => {
                const FEE_STATUS = {
                  paid:    { label: 'Paid',    color: '#22A66E', bg: '#E8F8F2' },
                  partial: { label: 'Partial', color: '#F59E0B', bg: '#FFFBEB' },
                  pending: { label: 'Pending', color: '#D96C5F', bg: '#FEE2E2' },
                  overdue: { label: 'Overdue', color: '#D96C5F', bg: '#FEE2E2' },
                };
                if (!feeAccount) return (
                  <div className="flex items-center gap-2">
                    <IndianRupee className="w-4 h-4 text-[#94A3B8] flex-shrink-0" />
                    <span className="text-xs text-[#CBD5E1] italic">No fee account yet — student hasn't paid registration</span>
                  </div>
                );
                const cfg = FEE_STATUS[feeAccount.feeStatus] ?? FEE_STATUS.pending;
                return (
                  <div className="flex items-center gap-2">
                    <IndianRupee className="w-4 h-4 text-[#94A3B8] flex-shrink-0" />
                    <span className="text-sm text-[#475569]">Fee:</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                      style={{ backgroundColor: cfg.bg, color: cfg.color }}>
                      {cfg.label}
                    </span>
                    {feeAccount.accessValidUntilWeek > 0
                      ? <span className="text-xs text-[#94A3B8]">· Access up to Week {feeAccount.accessValidUntilWeek}</span>
                      : <span className="text-xs text-[#D96C5F]">· No installment paid yet</span>
                    }
                  </div>
                );
              })()}

              {/* Microsoft email — read only; student sets this in their own profile */}
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-[#94A3B8] flex-shrink-0" />
                {student.microsoftEmail
                  ? <span className="text-sm text-[#475569]">{student.microsoftEmail}</span>
                  : <span className="text-xs text-[#CBD5E1] italic">Microsoft email not added — student sets this in their profile</span>
                }
              </div>

              {course.reviewType !== 'screening' ? (
                <p className="text-xs text-[#94A3B8] text-center bg-[#F8F9FB] rounded-xl px-4 py-3">
                  {course.name} students access shared task sheets directly — no individual provisioning required.
                </p>
              ) : (
                <>
                  {/* Provision button */}
                  <button
                    onClick={() => provisionMutation.mutate()}
                    disabled={
                      !localBatch ||
                      !student.microsoftEmail ||
                      !feeAccount || feeAccount.accessValidUntilWeek === 0 ||
                      student.taskSheetStatus === 'done' ||
                      student.taskSheetStatus === 'provisioning' ||
                      provisionMutation.isPending
                    }
                    className="w-full inline-flex items-center justify-center gap-2 bg-[#CA6357] hover:bg-[#b85548] disabled:bg-[#E2E8F0] disabled:text-[#94A3B8] text-white font-semibold px-4 py-2.5 rounded-xl transition-colors text-sm"
                  >
                    {provisionMutation.isPending
                      ? <><Loader2 className="w-4 h-4 animate-spin" /> Provisioning…</>
                      : student.taskSheetStatus === 'error'
                        ? <><RefreshCw className="w-4 h-4" /> Retry Provision</>
                        : <><FileText className="w-4 h-4" /> Provision Task Sheet</>}
                  </button>
                  {!localBatch && (
                    <p className="text-[10px] text-[#D96C5F] text-center">Assign a batch first</p>
                  )}
                  {localBatch && (!feeAccount || feeAccount.accessValidUntilWeek === 0) && (
                    <p className="text-[10px] text-[#D96C5F] text-center">Student hasn't paid any fee installment yet</p>
                  )}
                  {localBatch && feeAccount && feeAccount.accessValidUntilWeek > 0 && !student.microsoftEmail && (
                    <p className="text-[10px] text-[#D96C5F] text-center">Student hasn't added their Microsoft email yet</p>
                  )}
                  {student.taskSheetStatus === 'done' && student.taskSheetUrl && (
                    <a
                      href={student.taskSheetUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block text-center text-xs text-[#CA6357] font-semibold hover:underline"
                    >
                      View student's OneDrive folder ↗
                    </a>
                  )}
                  {/* Re-share with mentors */}
                  {student.taskSheetStatus === 'done' && (
                    <button
                      onClick={() => reshareMutation.mutate()}
                      disabled={reshareMutation.isPending}
                      className="w-full inline-flex items-center justify-center gap-2 border border-[#CA6357] text-[#CA6357] hover:bg-[#FDEFEE] disabled:opacity-50 font-semibold px-4 py-2 rounded-xl transition-colors text-sm"
                    >
                      {reshareMutation.isPending
                        ? <><Loader2 className="w-4 h-4 animate-spin" /> Re-sharing…</>
                        : <><RefreshCw className="w-4 h-4" /> Re-share with Mentors</>}
                    </button>
                  )}
                  {/* Admin-only reset */}
                  {isSuperAdmin && student.taskSheetStatus === 'done' && (
                    <button
                      onClick={() => resetMutation.mutate()}
                      disabled={resetMutation.isPending}
                      className="w-full text-xs text-[#D96C5F] hover:underline disabled:opacity-50 text-center"
                    >
                      {resetMutation.isPending ? 'Resetting…' : 'Reset task sheet (admin)'}
                    </button>
                  )}
                </>
              )}
            </div>
          )}
        </div>

        {(canApprove || canChangeStatus || canAssignBatch) && (
          <div className="px-6 pt-4 pb-6 border-t border-[#F1F5F9] space-y-2 h-36">

            {canApprove && !student.isApproved && (
              <button
                onClick={() => approveMutation.mutate()}
                disabled={approveMutation.isPending}
                className="w-full inline-flex items-center justify-center gap-2 bg-[#CA6357] hover:bg-[#b85548] text-white font-semibold px-5 py-2.5 rounded-xl transition-colors text-sm disabled:opacity-60"
              >
                {approveMutation.isPending
                  ? <Loader2 className="w-4 h-4 animate-spin" />
                  : <UserCheck className="w-4 h-4" />}
                Approve Student
              </button>
            )}

            {canAssignBatch && (
              assigningBatch ? (
                <div className="space-y-2">
                  <div className="relative">
                    <select
                      value={selectedBatchId}
                      onChange={(e) => setSelectedBatchId(e.target.value)}
                      className="w-full appearance-none pl-3 pr-8 py-2.5 border border-[#E2E8F0] rounded-xl text-sm text-[#1E293B] focus:outline-none focus:border-[#CA6357] bg-white"
                    >
                      <option value="">Select a batch...</option>
                      {assignableBatches.map((b) => (
                        <option key={b._id} value={b._id}>
                          {b.name}{b.branch ? ` — ${b.branch.name}` : ''}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#94A3B8] pointer-events-none" />
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setAssigningBatch(false)}
                      className="flex-1 border border-[#E2E8F0] text-[#475569] font-medium px-4 py-2 rounded-xl hover:bg-[#F8F9FB] text-sm"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => selectedBatchId && batchMutation.mutate(selectedBatchId)}
                      disabled={!selectedBatchId || batchMutation.isPending}
                      className="flex-1 inline-flex items-center justify-center gap-2 bg-[#CA6357] hover:bg-[#b85548] text-white font-semibold px-4 py-2 rounded-xl transition-colors text-sm disabled:opacity-60"
                    >
                      {batchMutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                      Assign
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => { setAssigningBatch(true); setSelectedBatchId(student.batch?._id ?? ''); }}
                  className="w-full inline-flex items-center justify-center gap-2 border border-[#E2E8F0] hover:border-[#CA6357] hover:bg-[#FDEFEE] text-[#475569] hover:text-[#CA6357] font-semibold px-5 py-2.5 rounded-xl transition-colors text-sm"
                >
                  <Layers className="w-4 h-4" />
                  {student.batch ? 'Change Batch' : 'Assign Batch'}
                </button>
              )
            )}

            {canChangeStatus && (
              <div className="flex gap-2">
                {Object.entries(STATUS_CONFIG)
                  .filter(([key]) => key !== student.studentStatus)
                  .map(([key, cfg]) => (
                    <button
                      key={key}
                      onClick={() => statusMutation.mutate(key)}
                      disabled={statusMutation.isPending}
                      className="flex-1 inline-flex items-center justify-center gap-1 border border-[#E2E8F0] text-[#475569] hover:border-[#CA6357] hover:text-[#CA6357] font-medium px-3 py-2 rounded-xl transition-colors text-xs disabled:opacity-60"
                    >
                      Mark {cfg.label}
                    </button>
                  ))}
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}

// ── Receipt preview modal ─────────────────────────────────────────────────────
function ReceiptPreviewModal({ payment, student, batches = [], onClose, onApprove, onReject, isProcessing, isReEnrollment = false }) {
  const [rejectNote, setRejectNote] = useState('');
  const [showReject, setShowReject] = useState(false);
  const [imgError, setImgError] = useState(false);
  const [selectedBatchId, setSelectedBatchId] = useState('');
  const info = student.user ?? {};

  const METHOD_LABELS = { upi: 'UPI', bank_transfer: 'Bank Transfer', cash: 'Cash', other: 'Other' };

  return (
    <>
      <div className="fixed inset-0 bg-black/40 z-40" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] flex flex-col" style={{ boxShadow: '0 4px 30px rgba(0,0,0,0.12)' }}>

          <div className="flex items-center justify-between px-6 py-4 border-b border-[#F1F5F9] flex-shrink-0">
            <div>
              <p className="text-base font-bold text-[#1E293B]">{isReEnrollment ? 'Re-Enrollment Review' : 'Registration Review'}</p>
              <p className="text-xs text-[#94A3B8]">{info.name} · {info.email}</p>
            </div>
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-[#F8F9FB]">
              <X className="w-4 h-4 text-[#94A3B8]" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
            {/* Receipt image */}
            <div className="rounded-2xl overflow-hidden border border-[#E2E8F0] bg-[#F8F9FB] min-h-[120px] flex items-center justify-center">
              {imgError || !payment?.receiptUrl ? (
                <div className="flex flex-col items-center gap-2 py-8">
                  <ImageOff className="w-8 h-8 text-[#CBD5E1]" strokeWidth={1.5} />
                  <p className="text-xs text-[#94A3B8]">Receipt image unavailable</p>
                </div>
              ) : (
                <img
                  src={payment.receiptUrl}
                  alt="Payment receipt"
                  className="w-full object-contain max-h-64"
                  onError={() => setImgError(true)}
                />
              )}
            </div>

            {/* Student + payment details */}
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Student',    value: info.name },
                { label: 'Course',     value: student.course?.name ?? '—' },
                ...(payment ? [
                  { label: isReEnrollment ? 'First Installment' : 'Amount', value: `₹${payment.amount?.toLocaleString('en-IN')}` },
                  { label: 'Method',   value: METHOD_LABELS[payment.paymentMethod] ?? payment.paymentMethod },
                  ...(payment.transactionId ? [{ label: 'Transaction ID', value: payment.transactionId }] : []),
                  ...(payment.studentNote   ? [{ label: 'Student Note',   value: payment.studentNote }]   : []),
                ] : [{ label: 'Payment', value: 'No proof submitted yet' }]),
              ].map(({ label, value }) => (
                <div key={label} className="bg-[#F8F9FB] rounded-xl p-3">
                  <p className="text-[10px] font-semibold text-[#94A3B8] uppercase tracking-wider mb-0.5">{label}</p>
                  <p className="text-sm font-medium text-[#1E293B]">{value}</p>
                </div>
              ))}
            </div>

            {/* Batch assignment (required to approve) */}
            {!showReject && batches.length > 0 && (
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

            {showReject && (
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-[#475569] uppercase tracking-wider">
                  Rejection Reason <span className="text-[#D96C5F]">*</span>
                </label>
                <textarea
                  value={rejectNote}
                  onChange={(e) => setRejectNote(e.target.value)}
                  rows={3}
                  placeholder="Explain why the proof is being rejected…"
                  className="w-full border border-[#E2E8F0] rounded-xl px-3 py-2.5 text-sm text-[#1E293B] placeholder-[#94A3B8] focus:outline-none focus:border-[#D96C5F] resize-none"
                />
              </div>
            )}
          </div>

          {payment && (
            <div className="px-6 py-4 border-t border-[#F1F5F9] flex gap-2 flex-shrink-0">
              {!showReject ? (
                <>
                  <button
                    onClick={() => setShowReject(true)}
                    className="flex-1 border border-[#E2E8F0] text-[#D96C5F] font-semibold px-4 py-2.5 rounded-xl hover:bg-[#FEE2E2] text-sm transition-colors"
                  >
                    Reject
                  </button>
                  <button
                    onClick={() => onApprove(selectedBatchId || null)}
                    disabled={isProcessing || (batches.length > 0 && !selectedBatchId)}
                    className="flex-1 inline-flex items-center justify-center gap-2 bg-[#CA6357] hover:bg-[#b85548] disabled:opacity-60 text-white font-semibold px-4 py-2.5 rounded-xl text-sm transition-colors"
                  >
                    {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserCheck className="w-4 h-4" />}
                    Approve &amp; Activate
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => setShowReject(false)}
                    className="flex-1 border border-[#E2E8F0] text-[#475569] font-medium px-4 py-2.5 rounded-xl hover:bg-[#F8F9FB] text-sm"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => onReject(rejectNote)}
                    disabled={isProcessing || !rejectNote.trim()}
                    className="flex-1 inline-flex items-center justify-center gap-2 bg-[#D96C5F] hover:bg-[#C45E52] disabled:opacity-60 text-white font-semibold px-4 py-2.5 rounded-xl text-sm transition-colors"
                  >
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

// ── Approvals tab ─────────────────────────────────────────────────────────────
function ApprovalsTab({ canApprove }) {
  const queryClient = useQueryClient();
  const [selected, setSelected] = useState(null);
  const [reviewing, setReviewing] = useState(null);
  const [page, setPage] = useState(1);

  const params = { isApproved: 'false', page, limit: 15 };
  const { data, isLoading, isError } = useQuery({
    queryKey: ['students', params],
    queryFn: () => studentService.getAll(params),
    refetchInterval: 30_000,
  });

  // Fetch all pending payments to map student → payment
  const { data: pendingPayments = [] } = useQuery({
    queryKey: ['payments', 'pending'],
    queryFn: paymentService.getPending,
  });

  // Fetch all active batches for the batch selector in the approval modal
  const { data: allBatches = [] } = useQuery({
    queryKey: ['batches'],
    queryFn: () => batchService.getAll({ active: 'true' }),
  });

  const paymentByStudentId = pendingPayments.reduce((acc, p) => {
    const sid = p.student?._id ?? p.student;
    if (sid) acc[String(sid)] = p;
    return acc;
  }, {});

  const students = data?.students ?? [];
  const pagination = data?.pagination ?? { total: 0, pages: 1 };

  // Filter batches by the reviewing student's branch
  const reviewingPayment = reviewing ? paymentByStudentId[String(reviewing._id)] : null;
  const reviewingBranchId = reviewingPayment?.student?.branch?._id ?? reviewingPayment?.student?.branch ?? null;
  const batchesForModal = reviewingBranchId
    ? allBatches.filter((b) => (b.branch?._id ?? b.branch) === String(reviewingBranchId))
    : allBatches;

  const approveMutation = useMutation({
    mutationFn: ({ paymentId, batchId }) => paymentService.approve(paymentId, batchId),
    onSuccess: () => {
      toast.success('Student approved and account activated');
      queryClient.invalidateQueries({ queryKey: ['students'] });
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      setReviewing(null);
    },
    onError: (err) => toast.error(err?.response?.data?.message ?? 'Failed to approve'),
  });

  const rejectMutation = useMutation({
    mutationFn: ({ id, reviewNote }) => paymentService.reject(id, reviewNote),
    onSuccess: () => {
      toast.success('Enrollment request rejected');
      queryClient.invalidateQueries({ queryKey: ['students'] });
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      setReviewing(null);
    },
    onError: (err) => toast.error(err?.response?.data?.message ?? 'Failed to reject'),
  });

  const isProcessing = approveMutation.isPending || rejectMutation.isPending;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 text-[#CA6357] animate-spin" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <XCircle className="w-10 h-10 text-[#FECACA]" strokeWidth={1.5} />
        <p className="text-sm text-[#94A3B8]">Failed to load approvals.</p>
      </div>
    );
  }

  if (students.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <CheckCircle2 className="w-12 h-12 text-[#BBF7D0]" strokeWidth={1.5} />
        <p className="text-base font-bold text-[#1E293B]">All caught up</p>
        <p className="text-sm text-[#94A3B8]">No students waiting for approval.</p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-3">
        {students.map((student) => {
          const info = student.user ?? {};
          const payment = paymentByStudentId[String(student._id)];
          const isRejected = student.studentStatus === 'dropped' && student.isReEnrollment && !student.isApproved;
          return (
            <div
              key={student._id}
              className={`rounded-2xl p-4 flex items-start gap-4 ${isRejected ? 'bg-[#FEF2F2] border border-[#FECACA]' : 'bg-white'}`}
              style={isRejected ? {} : { boxShadow: '0 2px 16px rgba(0,0,0,0.05)' }}
            >
              <InitialsAvatar name={info.name} size="lg" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-[#1E293B] truncate">{info.name ?? '—'}</p>
                <p className="text-xs text-[#94A3B8] truncate">{info.email ?? '—'}</p>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  {student.course && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#F2EEFD] text-[#7C6AF2]">
                      {student.course.name}
                    </span>
                  )}
                  {isRejected ? (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#FEE2E2] text-[#D96C5F]">
                      Rejected
                    </span>
                  ) : student.isReEnrollment ? (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#FDEFEE] text-[#CA6357]">
                      Re-Enrollment
                    </span>
                  ) : payment ? (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#FFFBEB] text-[#D97706]">
                      Receipt submitted
                    </span>
                  ) : (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#FEE2E2] text-[#D96C5F]">
                      No receipt yet
                    </span>
                  )}
                  <span className="text-[10px] text-[#94A3B8]">
                    {new Date(student.enrollmentDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </span>
                </div>
                {isRejected && student.notes && (
                  <p className="text-[11px] text-[#D96C5F] mt-1 truncate">
                    {student.notes.replace('Registration rejected: ', 'Reason: ')}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  onClick={() => setSelected(student)}
                  className="text-xs text-[#94A3B8] hover:text-[#475569] font-medium px-3 py-1.5 rounded-lg hover:bg-[#F8F9FB] transition-colors"
                >
                  Details
                </button>
                {canApprove && payment && !isRejected && (
                  <button
                    onClick={() => setReviewing(student)}
                    className="inline-flex items-center gap-1.5 bg-[#CA6357] hover:bg-[#b85548] text-white font-semibold px-3 py-1.5 rounded-xl text-xs transition-colors"
                  >
                    <Eye className="w-3.5 h-3.5" /> Review
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {pagination.pages > 1 && (
        <div className="flex items-center justify-between mt-4 bg-white rounded-2xl px-5 py-3" style={{ boxShadow: '0 2px 16px rgba(0,0,0,0.05)' }}>
          <p className="text-xs text-[#94A3B8]">
            Page {pagination.page} of {pagination.pages} · {pagination.total} total
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={pagination.page <= 1}
              className="p-1.5 rounded-lg border border-[#E2E8F0] hover:border-[#CA6357] disabled:opacity-40 transition-colors"
            >
              <ChevronLeft className="w-4 h-4 text-[#475569]" />
            </button>
            <button
              onClick={() => setPage((p) => Math.min(pagination.pages, p + 1))}
              disabled={pagination.page >= pagination.pages}
              className="p-1.5 rounded-lg border border-[#E2E8F0] hover:border-[#CA6357] disabled:opacity-40 transition-colors"
            >
              <ChevronRight className="w-4 h-4 text-[#475569]" />
            </button>
          </div>
        </div>
      )}

      {selected && (
        <StudentDrawer
          student={selected}
          onClose={() => setSelected(null)}
          canApprove={false}
          canChangeStatus={false}
          canAssignBatch={false}
        />
      )}

      {reviewing && reviewingPayment && (
        <ReceiptPreviewModal
          payment={reviewingPayment}
          student={reviewing}
          batches={batchesForModal}
          onClose={() => setReviewing(null)}
          onApprove={(batchId) => approveMutation.mutate({ paymentId: reviewingPayment._id, batchId })}
          onReject={(note) => rejectMutation.mutate({ id: reviewingPayment._id, reviewNote: note })}
          isProcessing={isProcessing}
          isReEnrollment={reviewing.isReEnrollment ?? false}
        />
      )}
    </>
  );
}

// ── Students tab ──────────────────────────────────────────────────────────────
function StudentsTab({ canChangeStatus, canAssignBatch, profileBasePath }) {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState(null);

  const params = { page, limit: 15, isApproved: 'true' };
  if (statusFilter) params.status = statusFilter;

  const { data, isLoading, isError } = useQuery({
    queryKey: ['students', params],
    queryFn: () => studentService.getAll(params),
  });

  const students = data?.students ?? [];
  const pagination = data?.pagination ?? { total: 0, pages: 1 };

  const filtered = search.trim()
    ? students.filter((s) => {
        const q = search.toLowerCase();
        return s.user?.name?.toLowerCase().includes(q) || s.user?.email?.toLowerCase().includes(q);
      })
    : students;

  return (
    <>
      {/* Filters */}
      <div className="bg-white rounded-2xl p-4" style={{ boxShadow: '0 2px 16px rgba(0,0,0,0.05)' }}>
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94A3B8]" />
            <input
              type="text"
              placeholder="Search by name or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 border border-[#E2E8F0] rounded-xl text-sm text-[#1E293B] placeholder-[#94A3B8] focus:outline-none focus:border-[#CA6357] focus:ring-1 focus:ring-[#CA6357]"
            />
          </div>
          <div className="relative">
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
              className="appearance-none pl-3 pr-8 py-2 border border-[#E2E8F0] rounded-xl text-sm text-[#1E293B] focus:outline-none focus:border-[#CA6357] bg-white"
            >
              <option value="">All Statuses</option>
              <option value="active">Active</option>
              <option value="dropped">Dropped</option>
              <option value="graduated">Graduated</option>
            </select>
            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#94A3B8] pointer-events-none" />
          </div>
          {(statusFilter || search) && (
            <button
              onClick={() => { setStatusFilter(''); setSearch(''); setPage(1); }}
              className="inline-flex items-center gap-1 text-xs text-[#94A3B8] hover:text-[#C76D64] transition-colors px-2"
            >
              <X className="w-3.5 h-3.5" /> Clear
            </button>
          )}
        </div>
      </div>

      {/* List */}
      <div className="bg-white rounded-2xl overflow-hidden" style={{ boxShadow: '0 2px 16px rgba(0,0,0,0.05)' }}>
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-6 h-6 text-[#CA6357] animate-spin" />
          </div>
        ) : isError ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <XCircle className="w-10 h-10 text-[#FECACA]" strokeWidth={1.5} />
            <p className="text-sm text-[#94A3B8]">Failed to load students.</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <GraduationCap className="w-10 h-10 text-[#CBD5E1]" strokeWidth={1.5} />
            <p className="text-base font-bold text-[#1E293B]">No students found</p>
            <p className="text-sm text-[#94A3B8]">Try adjusting your filters.</p>
          </div>
        ) : (
          <>
            {!profileBasePath && (
              <div className="hidden sm:grid grid-cols-[auto_1fr_auto_auto] gap-4 px-6 py-3 border-b border-[#F1F5F9] bg-[#FAFAFA]">
                <div />
                <p className="text-xs font-bold text-[#94A3B8] uppercase tracking-wider">Student</p>
                <p className="text-xs font-bold text-[#94A3B8] uppercase tracking-wider">Course</p>
                <p className="text-xs font-bold text-[#94A3B8] uppercase tracking-wider">Status</p>
              </div>
            )}
            {profileBasePath && (
              <div className="hidden sm:flex items-center gap-4 px-6 py-3 border-b border-[#F1F5F9] bg-[#FAFAFA]">
                <div className="w-9" />
                <p className="flex-1 text-xs font-bold text-[#94A3B8] uppercase tracking-wider">Student</p>
                <p className="text-xs font-bold text-[#94A3B8] uppercase tracking-wider w-36">Course</p>
                <p className="text-xs font-bold text-[#94A3B8] uppercase tracking-wider w-20">Status</p>
                <div className="w-16" />
              </div>
            )}
            <div className="divide-y divide-[#F8F9FB]">
              {filtered.map((student) => (
                profileBasePath ? (
                  <div
                    key={student._id}
                    className="flex items-center gap-3 sm:gap-4 px-6 py-4 hover:bg-[#FAFAFA] transition-colors"
                  >
                    <Link
                      to={`${profileBasePath}/students/${student._id}`}
                      className="flex flex-1 items-center gap-3 sm:gap-4 min-w-0"
                    >
                      <InitialsAvatar name={student.user?.name} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-[#1E293B] truncate">{student.user?.name ?? '—'}</p>
                        <p className="text-xs text-[#94A3B8] truncate">{student.user?.email ?? '—'}</p>
                        {student.batch?.name && (
                          <p className="text-[11px] text-[#94A3B8] truncate mt-0.5">{student.batch.name}</p>
                        )}
                      </div>
                      <p className="hidden sm:block text-xs text-[#475569] truncate max-w-[140px]">
                        {student.course?.name ?? '—'}
                      </p>
                      <Badge value={student.studentStatus} config={STATUS_CONFIG} />
                    </Link>
                    <button
                      onClick={() => setSelected(student)}
                      className="flex-shrink-0 text-xs font-semibold text-[#475569] hover:text-[#CA6357] hover:bg-[#FDEFEE] px-3 py-1.5 rounded-xl transition-colors border border-[#E2E8F0] hover:border-[#F2B3AC]"
                    >
                      Manage
                    </button>
                  </div>
                ) : (
                  <button
                    key={student._id}
                    onClick={() => setSelected(student)}
                    className="w-full flex sm:grid sm:grid-cols-[auto_1fr_auto_auto] items-center gap-3 sm:gap-4 px-6 py-4 hover:bg-[#FAFAFA] transition-colors text-left"
                  >
                    <InitialsAvatar name={student.user?.name} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-[#1E293B] truncate">{student.user?.name ?? '—'}</p>
                      <p className="text-xs text-[#94A3B8] truncate">{student.user?.email ?? '—'}</p>
                    </div>
                    <p className="hidden sm:block text-xs text-[#475569] truncate max-w-[140px]">
                      {student.course?.name ?? '—'}
                    </p>
                    <Badge value={student.studentStatus} config={STATUS_CONFIG} />
                  </button>
                )
              ))}
            </div>

            {pagination.pages > 1 && (
              <div className="flex items-center justify-between px-6 py-4 border-t border-[#F1F5F9]">
                <p className="text-xs text-[#94A3B8]">
                  Page {pagination.page} of {pagination.pages} · {pagination.total} total
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={pagination.page <= 1}
                    className="p-1.5 rounded-lg border border-[#E2E8F0] hover:border-[#CA6357] disabled:opacity-40 transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4 text-[#475569]" />
                  </button>
                  <button
                    onClick={() => setPage((p) => Math.min(pagination.pages, p + 1))}
                    disabled={pagination.page >= pagination.pages}
                    className="p-1.5 rounded-lg border border-[#E2E8F0] hover:border-[#CA6357] disabled:opacity-40 transition-colors"
                  >
                    <ChevronRight className="w-4 h-4 text-[#475569]" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {selected && (
        <StudentDrawer
          student={selected}
          onClose={() => setSelected(null)}
          canApprove={false}
          canChangeStatus={canChangeStatus}
          canAssignBatch={canAssignBatch}
          canManageTaskSheet={canChangeStatus}
        />
      )}
    </>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function StudentsPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === ROLES.SUPER_ADMIN || user?.role === ROLES.BRANCH_ADMIN;
  const isCoordinator = user?.role === ROLES.BRANCH_COORDINATOR;

  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') ?? 'students');

  // Fetch pending count for badge — exclude dropped (rejected) enrollments, polls every 30s
  const { data: pendingData } = useQuery({
    queryKey: ['students', { isApproved: 'false', status: 'active', page: 1, limit: 1 }],
    queryFn: () => studentService.getAll({ isApproved: 'false', status: 'active', page: 1, limit: 1 }),
    refetchInterval: 30_000,
  });
  const pendingCount = pendingData?.pagination?.total ?? 0;

  const tabs = [
    { key: 'students',  label: 'Students',  icon: GraduationCap },
    { key: 'approvals', label: 'Approvals', icon: AlertCircle,   count: pendingCount },
  ];

  return (
    <div className="space-y-6 pb-8">

      {/* Header */}
      <div
        className="relative rounded-2xl overflow-hidden p-6 sm:p-8"
        style={{ background: 'linear-gradient(135deg, #CA6357 0%, #A94E43 100%)' }}
      >
        <div className="relative z-10 flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-white/15 flex items-center justify-center flex-shrink-0">
            <Users className="w-7 h-7 text-white" strokeWidth={1.8} />
          </div>
          <div>
            <p className="text-xs font-bold tracking-widest text-[#F2B3AC] uppercase mb-1">Management</p>
            <h2 className="text-2xl font-bold text-white mb-1">Students</h2>
            {pendingCount > 0 && (
              <p className="text-white/60 text-sm">
                {pendingCount} student{pendingCount !== 1 ? 's' : ''} waiting for approval
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-white rounded-2xl p-1.5" style={{ boxShadow: '0 2px 16px rgba(0,0,0,0.05)' }}>
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`inline-flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-semibold transition-colors ${
              activeTab === tab.key ? 'bg-[#CA6357] text-white' : 'text-[#475569] hover:bg-[#F8F9FB]'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
            {tab.count > 0 && (
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                activeTab === tab.key ? 'bg-white/25 text-white' : 'bg-[#FDEFEE] text-[#C76D64]'
              }`}>
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === 'students' ? (
        <StudentsTab
          canChangeStatus={isAdmin || isCoordinator}
          canAssignBatch={isAdmin || isCoordinator}
          profileBasePath={
            user?.role === ROLES.SUPER_ADMIN        ? '/admin' :
            user?.role === ROLES.BRANCH_ADMIN       ? '/branch-admin' :
            user?.role === ROLES.BRANCH_COORDINATOR ? '/coordinator' : null
          }
        />
      ) : (
        <ApprovalsTab canApprove={isAdmin || isCoordinator} />
      )}
    </div>
  );
}
