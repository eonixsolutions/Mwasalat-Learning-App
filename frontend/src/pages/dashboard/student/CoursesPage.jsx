import { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import {
  BookOpen, Clock, Calendar, Wifi, MapPin, Loader2,
  MonitorPlay, FileText, Trophy, ChevronRight, GraduationCap,
  CheckCircle2, Sparkles, Upload, X, XCircle,
  ChevronDown, BarChart2, Star, RotateCcw, CheckSquare, XSquare, Minus,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { courseService } from '../../../services/course.service.js';
import { studentService } from '../../../services/student.service.js';
import { reviewService } from '../../../services/review.service.js';
import { useAuth } from '../../../hooks/useAuth.js';
import { ROUTES } from '../../../constants/routes.js';
import { QK } from '../../../constants/queryKeys.js';


/* ── PastCourseCard ──────────────────────────────────────────────── */
function PastCourseCard({ enrollment }) {
  const [open, setOpen] = useState(false);

  const { data: reviews = [], isLoading } = useQuery({
    queryKey: ['enrollment-reviews', enrollment._id],
    queryFn: () => reviewService.getEnrollmentReviews(enrollment._id),
    enabled: open,
    staleTime: 5 * 60_000,
  });

  // Group completed reviews
  const screenings = reviews
    .filter(r => r.reviewType === 'screening' && r.status === 'completed')
    .reduce((acc, r) => {
      const p = r.part ?? 0;
      if (!acc[p]) acc[p] = [];
      acc[p].push(r);
      return acc;
    }, {});

  const weeklyReviews = reviews
    .filter(r => r.reviewType === 'weekly' && r.status === 'completed')
    .sort((a, b) => (a.weekNumber ?? 0) - (b.weekNumber ?? 0));

  const hasScreenings  = Object.keys(screenings).length > 0;
  const hasWeekly      = weeklyReviews.length > 0;
  const hasAnyReviews  = hasScreenings || hasWeekly;

  const avgMarks = (() => {
    const allCompleted = reviews.filter(r => r.status === 'completed' && r.marks !== null && r.marks !== undefined);
    if (!allCompleted.length) return null;
    return Math.round(allCompleted.reduce((s, r) => s + r.marks, 0) / allCompleted.length);
  })();

  const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : null;

  const durationDays = enrollment.enrollmentDate && enrollment.graduatedAt
    ? Math.round((new Date(enrollment.graduatedAt) - new Date(enrollment.enrollmentDate)) / (1000 * 60 * 60 * 24))
    : null;

  return (
    <div className="bg-white rounded-2xl overflow-hidden" style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.05)', border: '1.5px solid #F1F5F9' }}>
      {/* Header row */}
      <div className="p-5 flex items-center gap-4">
        <div className="w-11 h-11 rounded-xl bg-[#F2EEFD] flex items-center justify-center flex-shrink-0">
          <Trophy className="w-5 h-5 text-[#7C6AF2]" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-[#1E293B] truncate">{enrollment.course?.name ?? '—'}</p>
          <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-0.5">
            {enrollment.enrollmentDate && (
              <span className="text-xs text-[#94A3B8]">Enrolled {fmtDate(enrollment.enrollmentDate)}</span>
            )}
            {enrollment.graduatedAt && (
              <span className="text-xs text-[#94A3B8]">· Completed {fmtDate(enrollment.graduatedAt)}</span>
            )}
            {enrollment.rollNumber && (
              <span className="text-xs text-[#94A3B8]">· Roll #{enrollment.rollNumber}</span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className="hidden sm:inline-flex items-center gap-1 bg-[#22C55E]/10 text-[#16A34A] text-[10px] font-bold px-2.5 py-1 rounded-full">
            <CheckCircle2 className="w-3 h-3" /> Graduated
          </span>
          <button
            onClick={() => setOpen(v => !v)}
            className="flex items-center gap-1.5 text-xs font-semibold text-[#CA6357] hover:text-[#A94E43] transition-colors px-3 py-1.5 rounded-xl hover:bg-[#FDEFEE]"
          >
            <BarChart2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Performance</span>
            <ChevronDown className={`w-3.5 h-3.5 transition-transform ${open ? 'rotate-180' : ''}`} />
          </button>
        </div>
      </div>

      {/* Expandable performance panel */}
      {open && (
        <div className="border-t border-[#F1F5F9] bg-[#F8F9FB] px-5 py-4 space-y-5">
          {isLoading ? (
            <div className="flex justify-center py-6"><Loader2 className="w-5 h-5 text-[#CA6357] animate-spin" /></div>
          ) : !hasAnyReviews ? (
            <p className="text-xs text-[#94A3B8] text-center py-4">No review records found for this enrollment.</p>
          ) : (
            <>
              {/* Summary chips */}
              <div className="flex flex-wrap gap-2">
                {durationDays !== null && (
                  <span className="inline-flex items-center gap-1.5 bg-white border border-[#E2E8F0] text-xs font-semibold text-[#475569] px-3 py-1.5 rounded-full">
                    <Clock className="w-3.5 h-3.5 text-[#94A3B8]" />
                    {durationDays} day{durationDays !== 1 ? 's' : ''} to complete
                  </span>
                )}
                {enrollment.currentWeek && enrollment.course?.durationWeeks && (
                  <span className="inline-flex items-center gap-1.5 bg-white border border-[#E2E8F0] text-xs font-semibold text-[#475569] px-3 py-1.5 rounded-full">
                    <CheckSquare className="w-3.5 h-3.5 text-[#22C55E]" />
                    {enrollment.course.durationWeeks} weeks completed
                  </span>
                )}
                {avgMarks !== null && (
                  <span className="inline-flex items-center gap-1.5 bg-white border border-[#E2E8F0] text-xs font-semibold text-[#475569] px-3 py-1.5 rounded-full">
                    <Star className="w-3.5 h-3.5 text-[#F59E0B]" />
                    Avg. marks: {avgMarks}
                  </span>
                )}
              </div>

              {/* Screenings */}
              {hasScreenings && (
                <div>
                  <p className="text-xs font-bold text-[#475569] uppercase tracking-wider mb-2">Screenings</p>
                  <div className="space-y-2">
                    {Object.entries(screenings)
                      .sort(([a], [b]) => Number(a) - Number(b))
                      .map(([part, attempts]) => {
                        const passed   = attempts.find(a => a.result === 'pass');
                        const best     = passed ?? attempts[attempts.length - 1];
                        const attCount = attempts.length;
                        return (
                          <div key={part} className="bg-white rounded-xl border border-[#F1F5F9] p-3">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-xs font-bold text-[#1E293B]">Part {part} Screening</span>
                              <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                passed
                                  ? 'bg-[#22C55E]/10 text-[#16A34A]'
                                  : 'bg-[#FEF2F2] text-[#D96C5F]'
                              }`}>
                                {passed
                                  ? <><CheckCircle2 className="w-3 h-3" /> Passed</>
                                  : <><XSquare className="w-3 h-3" /> Not passed</>}
                              </span>
                            </div>
                            <div className="flex flex-wrap gap-x-4 gap-y-1">
                              {best?.marks !== null && best?.marks !== undefined && (
                                <span className="text-xs text-[#475569]">
                                  <span className="font-semibold text-[#1E293B]">{best.marks}</span> marks
                                  {passed && attCount > 1 ? ' (best)' : ''}
                                </span>
                              )}
                              <span className="text-xs text-[#475569]">
                                <span className="font-semibold text-[#1E293B]">{attCount}</span> attempt{attCount !== 1 ? 's' : ''}
                              </span>
                              {best?.remarks && (
                                <span className="text-xs text-[#94A3B8] italic">"{best.remarks}"</span>
                              )}
                            </div>
                            {/* Per-attempt marks if >1 attempt */}
                            {attCount > 1 && (
                              <div className="flex gap-2 mt-2 flex-wrap">
                                {attempts.map((a, i) => (
                                  <span key={a._id} className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                                    a.result === 'pass'
                                      ? 'bg-[#E8F8F2] border-[#22C55E]/20 text-[#16A34A]'
                                      : 'bg-[#FEF2F2] border-[#FECACA] text-[#D96C5F]'
                                  }`}>
                                    {a.result === 'pass' ? <CheckCircle2 className="w-2.5 h-2.5" /> : <RotateCcw className="w-2.5 h-2.5" />}
                                    Attempt {i + 1}{a.marks !== null && a.marks !== undefined ? ` — ${a.marks} marks` : ''}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      })}
                  </div>
                </div>
              )}

              {/* Weekly reviews */}
              {hasWeekly && (
                <div>
                  <p className="text-xs font-bold text-[#475569] uppercase tracking-wider mb-2">
                    Weekly Reviews ({weeklyReviews.length} week{weeklyReviews.length !== 1 ? 's' : ''})
                  </p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                    {weeklyReviews.map(r => (
                      <div key={r._id} className="bg-white rounded-xl border border-[#F1F5F9] p-3 text-center">
                        <p className="text-[10px] font-bold text-[#94A3B8] uppercase mb-1">Week {r.weekNumber}</p>
                        {r.marks !== null && r.marks !== undefined ? (
                          <p className="text-base font-bold text-[#1E293B]">{r.marks}</p>
                        ) : (
                          <Minus className="w-4 h-4 text-[#CBD5E1] mx-auto" />
                        )}
                        <span className={`inline-flex items-center gap-0.5 text-[10px] font-bold mt-1 ${
                          r.result === 'pass' ? 'text-[#22C55E]' : r.result === 'fail' ? 'text-[#D96C5F]' : 'text-[#94A3B8]'
                        }`}>
                          {r.result === 'pass' && <CheckCircle2 className="w-2.5 h-2.5" />}
                          {r.result === 'fail' && <XSquare className="w-2.5 h-2.5" />}
                          {r.result ? r.result.charAt(0).toUpperCase() + r.result.slice(1) : '—'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}

/* ── CurrentEnrollmentPerformance ───────────────────────────────── */
function CurrentEnrollmentPerformance({ course }) {
  const [open, setOpen] = useState(false);

  const { data: reviews = [], isLoading } = useQuery({
    queryKey: QK.MY_REVIEWS,
    queryFn: reviewService.getMyReviews,
    enabled: open,
    staleTime: 60_000,
  });

  const completedScreenings = reviews
    .filter(r => r.reviewType === 'screening' && r.status === 'completed')
    .reduce((acc, r) => {
      const p = r.part ?? 0;
      if (!acc[p]) acc[p] = [];
      acc[p].push(r);
      return acc;
    }, {});

  const completedWeekly = reviews
    .filter(r => r.reviewType === 'weekly' && r.status === 'completed')
    .sort((a, b) => (a.weekNumber ?? 0) - (b.weekNumber ?? 0));

  const hasScreenings = Object.keys(completedScreenings).length > 0;
  const hasWeekly     = completedWeekly.length > 0;
  const hasAny        = hasScreenings || hasWeekly;

  const avgMarks = (() => {
    const scored = reviews.filter(r => r.status === 'completed' && r.marks != null);
    if (!scored.length) return null;
    return Math.round(scored.reduce((s, r) => s + r.marks, 0) / scored.length);
  })();

  return (
    <div className="bg-white rounded-2xl overflow-hidden" style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.05)', border: '1.5px solid #F1F5F9' }}>
      {/* Header */}
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-[#F8F9FB] transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#FDEFEE] flex items-center justify-center">
            <BarChart2 className="w-4 h-4 text-[#CA6357]" />
          </div>
          <div className="text-left">
            <p className="text-sm font-bold text-[#1E293B]">My Performance</p>
            <p className="text-xs text-[#94A3B8]">{course.name} · tests &amp; reviews</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {!open && avgMarks !== null && (
            <span className="inline-flex items-center gap-1.5 bg-[#FFFBEB] text-[#F59E0B] text-xs font-bold px-2.5 py-1 rounded-full">
              <Star className="w-3 h-3" /> Avg. {avgMarks} marks
            </span>
          )}
          <ChevronDown className={`w-4 h-4 text-[#94A3B8] transition-transform ${open ? 'rotate-180' : ''}`} />
        </div>
      </button>

      {/* Panel */}
      {open && (
        <div className="border-t border-[#F1F5F9] bg-[#F8F9FB] px-5 py-4 space-y-5">
          {isLoading ? (
            <div className="flex justify-center py-6"><Loader2 className="w-5 h-5 text-[#CA6357] animate-spin" /></div>
          ) : !hasAny ? (
            <p className="text-xs text-[#94A3B8] text-center py-4">No completed tests or reviews yet.</p>
          ) : (
            <>
              {avgMarks !== null && (
                <div className="flex flex-wrap gap-2">
                  <span className="inline-flex items-center gap-1.5 bg-white border border-[#E2E8F0] text-xs font-semibold text-[#475569] px-3 py-1.5 rounded-full">
                    <Star className="w-3.5 h-3.5 text-[#F59E0B]" /> Overall avg. marks: {avgMarks}
                  </span>
                </div>
              )}

              {/* Screenings */}
              {hasScreenings && (
                <div>
                  <p className="text-xs font-bold text-[#475569] uppercase tracking-wider mb-2">Screenings</p>
                  <div className="space-y-2">
                    {Object.entries(completedScreenings)
                      .sort(([a], [b]) => Number(a) - Number(b))
                      .map(([part, attempts]) => {
                        const passed   = attempts.find(a => a.result === 'pass');
                        const best     = passed ?? attempts[attempts.length - 1];
                        const attCount = attempts.length;
                        return (
                          <div key={part} className="bg-white rounded-xl border border-[#F1F5F9] p-3">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-xs font-bold text-[#1E293B]">Part {part} Screening</span>
                              <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                passed ? 'bg-[#22C55E]/10 text-[#16A34A]' : 'bg-[#FEF2F2] text-[#D96C5F]'
                              }`}>
                                {passed
                                  ? <><CheckCircle2 className="w-3 h-3" /> Passed</>
                                  : <><XSquare className="w-3 h-3" /> Not passed</>}
                              </span>
                            </div>
                            <div className="flex flex-wrap gap-x-4 gap-y-1">
                              {best?.marks != null && (
                                <span className="text-xs text-[#475569]">
                                  <span className="font-semibold text-[#1E293B]">{best.marks}</span> marks
                                  {passed && attCount > 1 ? ' (best)' : ''}
                                </span>
                              )}
                              <span className="text-xs text-[#475569]">
                                <span className="font-semibold text-[#1E293B]">{attCount}</span> attempt{attCount !== 1 ? 's' : ''}
                              </span>
                              {best?.remarks && (
                                <span className="text-xs text-[#94A3B8] italic">"{best.remarks}"</span>
                              )}
                            </div>
                            {attCount > 1 && (
                              <div className="flex gap-2 mt-2 flex-wrap">
                                {attempts.map((a, i) => (
                                  <span key={a._id} className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                                    a.result === 'pass'
                                      ? 'bg-[#E8F8F2] border-[#22C55E]/20 text-[#16A34A]'
                                      : 'bg-[#FEF2F2] border-[#FECACA] text-[#D96C5F]'
                                  }`}>
                                    {a.result === 'pass' ? <CheckCircle2 className="w-2.5 h-2.5" /> : <RotateCcw className="w-2.5 h-2.5" />}
                                    Attempt {i + 1}{a.marks != null ? ` — ${a.marks} marks` : ''}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      })}
                  </div>
                </div>
              )}

              {/* Weekly reviews */}
              {hasWeekly && (
                <div>
                  <p className="text-xs font-bold text-[#475569] uppercase tracking-wider mb-2">
                    Weekly Reviews ({completedWeekly.length} completed)
                  </p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                    {completedWeekly.map(r => (
                      <div key={r._id} className="bg-white rounded-xl border border-[#F1F5F9] p-3 text-center">
                        <p className="text-[10px] font-bold text-[#94A3B8] uppercase mb-1">Week {r.weekNumber}</p>
                        {r.marks != null ? (
                          <p className="text-base font-bold text-[#1E293B]">{r.marks}</p>
                        ) : (
                          <Minus className="w-4 h-4 text-[#CBD5E1] mx-auto" />
                        )}
                        <span className={`inline-flex items-center gap-0.5 text-[10px] font-bold mt-1 ${
                          r.result === 'pass' ? 'text-[#22C55E]' : r.result === 'fail' ? 'text-[#D96C5F]' : 'text-[#94A3B8]'
                        }`}>
                          {r.result === 'pass' && <CheckCircle2 className="w-2.5 h-2.5" />}
                          {r.result === 'fail' && <XSquare className="w-2.5 h-2.5" />}
                          {r.result ? r.result.charAt(0).toUpperCase() + r.result.slice(1) : '—'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}

/* ── EnrollModal ─────────────────────────────────────────────────── */
function EnrollModal({ course, onClose, onSuccess }) {
  const fileRef = useRef(null);
  const [receiptFile, setReceiptFile] = useState(null);
  const [receiptPreview, setReceiptPreview] = useState(null);

  const { register, handleSubmit, formState: { errors } } = useForm({
    defaultValues: { mentorshipMode: 'online', paymentMethod: 'upi' },
  });

  const mutation = useMutation({
    mutationFn: studentService.requestReEnrollment,
    onSuccess: () => {
      toast.success('Enrollment request sent! You\'ll be notified once approved.');
      onSuccess();
    },
    onError: (err) => toast.error(err.response?.data?.message ?? 'Failed to submit. Try again.'),
  });

  const handleFile = (file) => {
    if (!file) return;
    setReceiptFile(file);
    const reader = new FileReader();
    reader.onload = (e) => setReceiptPreview(e.target.result);
    reader.readAsDataURL(file);
  };

  const onSubmit = (data) => {
    if (!receiptFile) { toast.error('Please upload your payment receipt'); return; }
    mutation.mutate({
      courseId:       course._id,
      mentorshipMode: data.mentorshipMode,
      paymentMethod:  data.paymentMethod,
      receipt:        receiptFile,
      ...(data.transactionId?.trim() ? { transactionId: data.transactionId.trim() } : {}),
      ...(data.studentNote?.trim()   ? { studentNote:   data.studentNote.trim() }   : {}),
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-xl overflow-hidden" style={{ boxShadow: '0 20px 60px rgba(0,0,0,0.15)', maxHeight: '90vh', overflowY: 'auto' }}>

        {/* Header */}
        <div className="px-6 pt-6 pb-4 border-b border-[#F1F5F9] flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-bold text-[#94A3B8] uppercase tracking-wider mb-1">Enroll in</p>
            <h2 className="text-lg font-bold text-[#1E293B]">{course.name}</h2>
            {course.durationWeeks && (
              <p className="text-xs text-[#94A3B8] mt-0.5 flex items-center gap-1"><Clock className="w-3 h-3" /> {course.durationWeeks} weeks</p>
            )}
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-[#94A3B8] hover:bg-[#F1F5F9] transition-colors flex-shrink-0">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="px-6 py-5 space-y-4">

          {/* Receipt upload */}
          <div>
            <label className="block text-xs font-semibold text-[#475569] uppercase tracking-wide mb-1.5">
              First Installment Receipt <span className="text-[#D96C5F]">*</span>
            </label>
            <p className="text-xs text-[#94A3B8] mb-2">Upload proof of your first installment payment for this course.</p>
            {receiptPreview ? (
              <div className="relative rounded-xl overflow-hidden border border-[#E2E8F0]">
                <img src={receiptPreview} alt="Receipt" className="w-full max-h-40 object-cover" />
                <button
                  type="button"
                  onClick={() => { setReceiptFile(null); setReceiptPreview(null); fileRef.current.value = ''; }}
                  className="absolute top-2 right-2 bg-white rounded-full p-1 shadow text-[#D96C5F] hover:bg-[#FBE9E7] transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="w-full border-2 border-dashed border-[#E2E8F0] hover:border-[#F2B3AC] rounded-xl py-6 flex flex-col items-center gap-2 transition-colors group"
              >
                <div className="w-10 h-10 rounded-xl bg-[#FDEFEE] flex items-center justify-center group-hover:bg-[#F2B3AC] transition-colors">
                  <Upload className="w-5 h-5 text-[#CA6357]" />
                </div>
                <p className="text-sm font-semibold text-[#1E293B]">Upload receipt</p>
                <p className="text-xs text-[#94A3B8]">JPG, PNG or WebP · Max 5MB</p>
              </button>
            )}
            <input
              ref={fileRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={(e) => handleFile(e.target.files?.[0])}
            />
          </div>

          {/* Payment method */}
          <div>
            <label className="block text-xs font-semibold text-[#475569] uppercase tracking-wide mb-1.5">Payment Method</label>
            <div className="grid grid-cols-2 gap-2">
              {[{ value: 'upi', label: 'UPI' }, { value: 'bank_transfer', label: 'Bank Transfer' }, { value: 'cash', label: 'Cash' }, { value: 'other', label: 'Other' }].map(m => (
                <label key={m.value} className="flex items-center gap-2 border border-[#E2E8F0] rounded-xl px-3 py-2 cursor-pointer hover:border-[#F2B3AC] transition-colors has-[:checked]:border-[#CA6357] has-[:checked]:bg-[#FDEFEE]">
                  <input type="radio" value={m.value} {...register('paymentMethod')} className="accent-[#CA6357]" />
                  <span className="text-sm text-[#1E293B]">{m.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Transaction ID */}
          <div>
            <label className="block text-xs font-semibold text-[#475569] uppercase tracking-wide mb-1.5">Transaction / UTR ID</label>
            <input
              type="text"
              placeholder="e.g. UPI123456789"
              {...register('transactionId')}
              className="w-full border border-[#E2E8F0] rounded-xl px-4 py-2.5 text-sm text-[#1E293B] bg-white focus:outline-none focus:ring-2 focus:ring-[#CA6357]/25 placeholder:text-[#94A3B8]"
            />
          </div>

          {/* Mentorship mode */}
          <div>
            <label className="block text-xs font-semibold text-[#475569] uppercase tracking-wide mb-1.5">Mentorship Mode</label>
            <div className="flex gap-4">
              {['online', 'offline'].map(mode => (
                <label key={mode} className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" value={mode} {...register('mentorshipMode')} className="accent-[#CA6357]" />
                  <span className="text-sm text-[#1E293B] capitalize">{mode}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Note */}
          <div>
            <label className="block text-xs font-semibold text-[#475569] uppercase tracking-wide mb-1.5">Note to Coordinator <span className="text-[#94A3B8] font-normal normal-case">(optional)</span></label>
            <textarea
              rows={2}
              placeholder="Any additional info…"
              {...register('studentNote')}
              className="w-full border border-[#E2E8F0] rounded-xl px-4 py-2.5 text-sm text-[#1E293B] bg-white focus:outline-none focus:ring-2 focus:ring-[#CA6357]/25 placeholder:text-[#94A3B8] resize-none"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 rounded-xl border border-[#E2E8F0] text-sm font-medium text-[#475569] hover:bg-[#F8F9FB] transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={mutation.isPending}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#CA6357] hover:bg-[#b85548] disabled:opacity-60 text-white text-sm font-semibold transition-colors"
            >
              {mutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <ChevronRight className="w-4 h-4" />}
              {mutation.isPending ? 'Submitting…' : 'Submit Request'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ── Main Page ───────────────────────────────────────────────────── */
export default function StudentCoursesPage() {
  const qc = useQueryClient();
  const [enrolling, setEnrolling] = useState(null); // course object being enrolled in
  const [requested, setRequested] = useState(null); // course._id after successful request

  const { data: enrollment, isLoading } = useQuery({
    queryKey: QK.ENROLLMENT,
    queryFn: courseService.getMyEnrollment,
  });

  // Derive graduated state from fresh DB data, not the potentially-stale JWT
  const isGraduated = enrollment?.studentStatus === 'graduated';

  // Always fetch — active re-enrolled students need history too
  const { data: allEnrollments = [] } = useQuery({
    queryKey: QK.MY_ENROLLMENTS,
    queryFn: studentService.getMyEnrollments,
    enabled: !!enrollment,
  });

  const { data: allCourses = [], isLoading: loadingCourses } = useQuery({
    queryKey: ['courses', 'active'],
    queryFn: courseService.getActive,
    enabled: isGraduated,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 text-[#CA6357] animate-spin" />
      </div>
    );
  }

  // Exclude dropped (rejected) enrollments from the "already enrolled" set so the course reappears as available
  const enrolledCourseIds = new Set(
    allEnrollments
      .filter(e => e.studentStatus !== 'dropped')
      .map(e => e.course?._id?.toString())
  );
  const availableCourses = allCourses.filter(c => !enrolledCourseIds.has(c._id?.toString()));

  // Pending re-enrollment requests (waiting for coordinator, not yet dropped/rejected)
  const pendingRequests = allEnrollments.filter(
    e => e.isReEnrollment && !e.isApproved && e.studentStatus !== 'graduated' && e.studentStatus !== 'dropped'
  );

  // Rejected re-enrollment requests — one per course (most recent).
  // Hidden when the same course already has any non-dropped enrollment (pending or approved).
  const activeCourseIds = new Set(
    allEnrollments
      .filter(e => e.studentStatus !== 'dropped')
      .map(e => e.course?._id?.toString())
  );
  const rejectedRequests = Object.values(
    allEnrollments
      .filter(e =>
        e.isReEnrollment && !e.isApproved && e.studentStatus === 'dropped' &&
        !activeCourseIds.has(e.course?._id?.toString())
      )
      .reduce((acc, e) => {
        const cid = e.course?._id?.toString();
        if (cid && !acc[cid]) acc[cid] = e;
        return acc;
      }, {})
  );

  // Past completed courses (graduated enrollments that are not the current one)
  const pastCourses = allEnrollments.filter(
    e => e.studentStatus === 'graduated' && e._id !== enrollment?._id
  );

  const { course, enrollmentDate, mentorshipMode } = enrollment ?? {};
  const isCompleted = isGraduated;

  return (
    <div className="space-y-6 pb-8">

      {/* ── Current / Completed Enrollment ──────────────────────── */}
      {enrollment && course ? (
        <div
          className="relative rounded-2xl overflow-hidden p-6 sm:p-8"
          style={{ background: 'linear-gradient(135deg, #CA6357 0%, #A94E43 100%)' }}
        >
          <div className="relative z-10 flex flex-col sm:flex-row sm:items-center gap-6">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(255,255,255,0.12)' }}>
              {isCompleted
                ? <Trophy className="w-7 h-7 text-[#FCD34D]" />
                : <BookOpen className="w-7 h-7 text-white" strokeWidth={1.8} />}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <p className="text-xs font-bold tracking-widest text-[#F2B3AC] uppercase">
                  {isCompleted ? 'Completed Program' : 'Enrolled Program'}
                </p>
                {isCompleted && (
                  <span className="inline-flex items-center gap-1 bg-[#22C55E]/20 text-[#86EFAC] text-xs font-bold px-2 py-0.5 rounded-full">
                    <CheckCircle2 className="w-3 h-3" /> Graduated
                  </span>
                )}
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">{course.name}</h2>
              {course.description && (
                <p className="text-white/60 text-sm leading-relaxed max-w-xl">{course.description}</p>
              )}
              <div className="flex flex-wrap gap-3 mt-3">
                {course.durationWeeks && (
                  <span className="inline-flex items-center gap-1.5 bg-white/10 text-white/80 text-xs font-semibold px-3 py-1 rounded-full">
                    <Clock className="w-3 h-3" /> {course.durationWeeks} weeks
                  </span>
                )}
                {enrollmentDate && (
                  <span className="inline-flex items-center gap-1.5 bg-white/10 text-white/80 text-xs font-semibold px-3 py-1 rounded-full">
                    <Calendar className="w-3 h-3" />
                    {isCompleted ? 'Completed' : 'Enrolled'} {new Date(enrollmentDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </span>
                )}
                {mentorshipMode && (
                  <span className="inline-flex items-center gap-1.5 bg-white/10 text-white/80 text-xs font-semibold px-3 py-1 rounded-full">
                    {mentorshipMode === 'online' ? <><Wifi className="w-3 h-3" /> Online</> : <><MapPin className="w-3 h-3" /> Offline</>}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-2xl p-10 text-center" style={{ boxShadow: '0 2px 16px rgba(0,0,0,0.05)' }}>
          <BookOpen className="w-10 h-10 text-[#CBD5E1] mx-auto mb-3" strokeWidth={1.5} />
          <p className="text-base font-bold text-[#1E293B]">No course enrolled</p>
          <p className="text-sm text-[#94A3B8] mt-1">Contact your coordinator to get enrolled in a program.</p>
        </div>
      )}

      {/* ── Performance (current enrollment, any status with reviews) ── */}
      {enrollment && course && course.reviewType !== 'none' && (
        <CurrentEnrollmentPerformance course={course} />
      )}

      {/* ── Quick links (active student only) ───────────────────── */}
      {!isCompleted && enrollment && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Link to={ROUTES.STUDENT.VIDEO_CLASSES}
            className="bg-white rounded-2xl p-5 flex items-center gap-4 hover:shadow-md transition-shadow group"
            style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.05)' }}>
            <div className="w-12 h-12 rounded-xl bg-[#FDEFEE] flex items-center justify-center flex-shrink-0 group-hover:bg-[#CA6357] transition-colors">
              <MonitorPlay className="w-5 h-5 text-[#CA6357] group-hover:text-white transition-colors" />
            </div>
            <div>
              <p className="text-sm font-bold text-[#1E293B]">Video Classes</p>
              <p className="text-xs text-[#94A3B8] mt-0.5">Watch recorded sessions</p>
            </div>
          </Link>
          <Link to={ROUTES.STUDENT.TASK_SHEETS}
            className="bg-white rounded-2xl p-5 flex items-center gap-4 hover:shadow-md transition-shadow group"
            style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.05)' }}>
            <div className="w-12 h-12 rounded-xl bg-[#F2EEFD] flex items-center justify-center flex-shrink-0 group-hover:bg-[#7C6AF2] transition-colors">
              <FileText className="w-5 h-5 text-[#7C6AF2] group-hover:text-white transition-colors" />
            </div>
            <div>
              <p className="text-sm font-bold text-[#1E293B]">Task Sheets</p>
              <p className="text-xs text-[#94A3B8] mt-0.5">View and submit daily tasks</p>
            </div>
          </Link>
        </div>
      )}

      {/* ── Pending re-enrollment requests ──────────────────────── */}
      {pendingRequests.map(req => (
        <div key={req._id} className="bg-[#FFFBEB] border border-[#FCD34D]/50 rounded-2xl p-4 flex items-start gap-3">
          <Clock className="w-5 h-5 text-[#F59E0B] flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-[#1E293B]">Enrollment Request Pending</p>
            <p className="text-xs text-[#475569] mt-0.5">
              Your request for <strong>{req.course?.name}</strong> is awaiting coordinator approval. You'll be notified once approved.
            </p>
          </div>
        </div>
      ))}

      {/* ── Rejected re-enrollment requests ─────────────────────── */}
      {rejectedRequests.map(req => (
        <div key={req._id} className="bg-[#FEF2F2] border border-[#FECACA] rounded-2xl p-4 flex items-start gap-3">
          <XCircle className="w-5 h-5 text-[#D96C5F] flex-shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-[#1E293B]">Enrollment Request Rejected</p>
            <p className="text-xs text-[#475569] mt-0.5">
              Your request for <strong>{req.course?.name}</strong> was not approved.
              {req.notes && <span className="block mt-0.5 text-[#D96C5F]">Reason: {req.notes.replace('Registration rejected: ', '')}</span>}
            </p>
          </div>
          <button
            onClick={() => setEnrolling(req.course)}
            className="flex-shrink-0 inline-flex items-center gap-1.5 bg-[#CA6357] hover:bg-[#b85548] text-white text-xs font-semibold px-3 py-2 rounded-xl transition-colors"
          >
            <ChevronRight className="w-3.5 h-3.5" /> Try Again
          </button>
        </div>
      ))}

      {/* ── Previous courses ────────────────────────────────────── */}
      {pastCourses.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-4">
            <GraduationCap className="w-4 h-4 text-[#7C6AF2]" />
            <h2 className="text-sm font-bold text-[#1E293B]">Previous Courses</h2>
            <div className="flex-1 h-px bg-[#F1F5F9]" />
          </div>
          <div className="space-y-3">
            {pastCourses.map(e => (
              <PastCourseCard key={e._id} enrollment={e} />
            ))}
          </div>
        </div>
      )}

      {/* ── Available courses (graduated students) ──────────────── */}
      {isGraduated && (
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="w-4 h-4 text-[#CA6357]" />
            <h2 className="text-sm font-bold text-[#1E293B]">Available Courses</h2>
            <div className="flex-1 h-px bg-[#F1F5F9]" />
          </div>

          {loadingCourses ? (
            <div className="flex justify-center py-10"><Loader2 className="w-5 h-5 text-[#CA6357] animate-spin" /></div>
          ) : availableCourses.length === 0 ? (
            <div className="bg-white rounded-2xl p-8 text-center" style={{ boxShadow: '0 1px 8px rgba(0,0,0,0.04)' }}>
              <GraduationCap className="w-8 h-8 text-[#CBD5E1] mx-auto mb-2" strokeWidth={1.5} />
              <p className="text-sm font-semibold text-[#1E293B]">No new courses available</p>
              <p className="text-xs text-[#94A3B8] mt-1">Check back later or contact your coordinator.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {availableCourses.map(c => {
                const isRequested = requested === c._id;
                const isPending = pendingRequests.some(r => r.course?._id?.toString() === c._id?.toString());

                return (
                  <div key={c._id} className="bg-white rounded-2xl p-5 flex flex-col gap-3" style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.05)', border: '1.5px solid #F1F5F9' }}>
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-xl bg-[#FDEFEE] flex items-center justify-center flex-shrink-0">
                        <BookOpen className="w-5 h-5 text-[#CA6357]" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-[#1E293B]">{c.name}</p>
                        {c.description && <p className="text-xs text-[#475569] mt-0.5 line-clamp-2">{c.description}</p>}
                      </div>
                    </div>
                    {c.durationWeeks && (
                      <div className="flex items-center gap-1.5 text-xs text-[#94A3B8]">
                        <Clock className="w-3.5 h-3.5" /> {c.durationWeeks} weeks
                      </div>
                    )}
                    {isRequested || isPending ? (
                      <div className="flex items-center gap-2 bg-[#E8F8F2] rounded-xl px-4 py-2.5 text-sm font-semibold text-[#22A66E]">
                        <CheckCircle2 className="w-4 h-4" /> Request sent — awaiting approval
                      </div>
                    ) : (
                      <button
                        onClick={() => setEnrolling(c)}
                        className="flex items-center justify-center gap-2 bg-[#CA6357] hover:bg-[#b85548] text-white text-sm font-semibold py-2.5 rounded-xl transition-colors"
                      >
                        <GraduationCap className="w-4 h-4" /> Enroll in This Course
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Enroll modal */}
      {enrolling && (
        <EnrollModal
          course={enrolling}
          onClose={() => setEnrolling(null)}
          onSuccess={() => {
            setRequested(enrolling._id);
            setEnrolling(null);
            qc.invalidateQueries({ queryKey: QK.MY_ENROLLMENTS });
          }}
        />
      )}
    </div>
  );
}
