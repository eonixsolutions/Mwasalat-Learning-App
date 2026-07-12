import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  FileText, Loader2, Clock, CheckCircle,
  AlertCircle, FolderOpen, BookOpen, Send,
  RefreshCw, MessageSquare, Lock, ShieldCheck,
  IndianRupee, ExternalLink, ChevronRight, Layers,
} from 'lucide-react';
import { taskSheetContentService } from '../../../services/taskSheetContent.service.js';
import { studentService } from '../../../services/student.service.js';
import { weekReviewService } from '../../../services/weekreview.service.js';
import { courseService } from '../../../services/course.service.js';
import { QK } from '../../../constants/queryKeys.js';


const WEEK_STATUS = {
  in_progress:           { label: 'In Progress',       color: '#F59E0B', bg: '#FFFBEB' },
  approved:              { label: 'Completed',          color: '#22A66E', bg: '#E8F8F2' },
  corrections_requested: { label: 'Corrections Needed', color: '#D96C5F', bg: '#FEE2E2' },
};

const DAY_STATUS = {
  submitted:             { label: 'Awaiting Review',    color: '#F59E0B', bg: '#FFFBEB' },
  approved:              { label: 'Approved',            color: '#22A66E', bg: '#E8F8F2' },
  corrections_requested: { label: 'Corrections',         color: '#D96C5F', bg: '#FEE2E2' },
};

function DayRow({ weekNum, dayNum, dayEntry, fileUrl, folderUrl, onSubmit, submitting }) {
  const status  = dayEntry?.status ?? null;
  const openUrl = fileUrl ?? folderUrl;

  return (
    <div className="flex flex-col gap-1 px-5 py-3 border-b border-[#F8F9FB] last:border-0">
      <div className="flex items-center gap-3">
        {/* Day number badge */}
        <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 text-[11px] font-bold
          ${status === 'approved' ? 'bg-[#E8F8F2] text-[#22A66E]'
          : status === 'corrections_requested' ? 'bg-[#FEE2E2] text-[#D96C5F]'
          : status === 'submitted' ? 'bg-[#FFFBEB] text-[#B45309]'
          : 'bg-[#FDEFEE] text-[#CA6357]'}`}>
          D{dayNum}
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-[#1E293B]">Day {dayNum}</p>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          {/* Status badge */}
          {status && (
            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full"
              style={{ backgroundColor: DAY_STATUS[status]?.bg, color: DAY_STATUS[status]?.color }}>
              {DAY_STATUS[status]?.label}
            </span>
          )}

          {/* Open link */}
          {openUrl && (
            <a href={openUrl} target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#CA6357] hover:text-[#A94E43] bg-[#FDEFEE] hover:bg-[#F2B3AC] px-2.5 py-1.5 rounded-lg transition-colors">
              <FileText className="w-3 h-3" /> Open
            </a>
          )}

          {/* Submit / Resubmit */}
          {status === null && (
            <button onClick={() => onSubmit(weekNum, dayNum)} disabled={submitting}
              className="inline-flex items-center gap-1 bg-[#CA6357] hover:bg-[#b85548] disabled:opacity-60 text-white font-semibold px-2.5 py-1.5 rounded-lg text-[11px] transition-colors">
              {submitting ? <Loader2 className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />}
              Submit
            </button>
          )}
          {status === 'submitted' && (
            <div className="inline-flex items-center gap-1 text-[#B45309] text-[11px] font-medium">
              <Clock className="w-3 h-3" /> Pending
            </div>
          )}
          {status === 'corrections_requested' && (
            <button onClick={() => onSubmit(weekNum, dayNum)} disabled={submitting}
              className="inline-flex items-center gap-1 bg-[#CA6357] hover:bg-[#b85548] disabled:opacity-60 text-white font-semibold px-2.5 py-1.5 rounded-lg text-[11px] transition-colors">
              {submitting ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
              Resubmit
            </button>
          )}
          {status === 'approved' && (
            <div className="inline-flex items-center gap-1 text-[#22A66E] text-[11px] font-semibold">
              <CheckCircle className="w-3 h-3" /> Done
            </div>
          )}
        </div>
      </div>

      {/* Mentor correction note */}
      {dayEntry?.mentorNote && (
        <div className={`ml-10 rounded-lg p-2.5 flex items-start gap-2 ${status === 'approved' ? 'bg-[#E8F8F2]' : 'bg-[#FEF3C7]'}`}>
          <MessageSquare className={`w-3 h-3 flex-shrink-0 mt-0.5 ${status === 'approved' ? 'text-[#22A66E]' : 'text-[#F59E0B]'}`} />
          <div>
            <p className={`text-[10px] font-bold uppercase tracking-wider mb-0.5 ${status === 'approved' ? 'text-[#22A66E]' : 'text-[#B45309]'}`}>
              {status === 'approved' ? 'Mentor Note' : 'Corrections Required'}
            </p>
            <p className={`text-xs leading-relaxed ${status === 'approved' ? 'text-[#166534]' : 'text-[#92400E]'}`}>
              {dayEntry.mentorNote}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

function WeekCard({ weekNum, isLocked, isFeeLocked, review, folderUrl, fileUrls, onSubmit, submittingKey }) {
  const status     = review?.status ?? null;
  const days       = review?.days ?? [];
  const approvedN  = days.filter(d => d.status === 'approved').length;
  const submittedN = days.filter(d => d.status === 'submitted').length;

  const daysToShow = (() => {
    const withFiles   = (fileUrls ?? []).filter(f => f.week === weekNum).map(f => f.day);
    const withEntries = days.map(d => d.day);
    const unique      = [...new Set([...withFiles, ...withEntries])].sort((a, b) => a - b);
    return unique.length > 0 ? unique : [1, 2, 3, 4, 5, 6];
  })();

  const effectiveLocked = isLocked || isFeeLocked;
  const isCurrent       = !effectiveLocked && status !== 'approved';
  const borderColor     = isFeeLocked ? '#F2B3AC'
    : status === 'approved' ? '#22A66E'
    : isCurrent ? '#CA6357' : '#E2E8F0';
  const headerBg        = isFeeLocked
    ? 'linear-gradient(135deg,#D96C5F 0%,#C45E52 100%)'
    : status === 'approved'
      ? 'linear-gradient(135deg,#1a8f5c 0%,#16784e 100%)'
      : isCurrent
        ? 'linear-gradient(135deg,#CA6357 0%,#A94E43 100%)'
        : '#F8F9FB';
  const headerText   = (isFeeLocked || status === 'approved' || isCurrent) ? 'text-white' : 'text-[#475569]';

  return (
    <div className="rounded-2xl overflow-hidden"
      style={{ border: `1.5px solid ${borderColor}`, boxShadow: isCurrent ? '0 4px 24px rgba(202,99,87,0.12)' : '0 2px 12px rgba(0,0,0,0.04)' }}>

      {/* Header */}
      <div className="px-5 py-4 flex items-center justify-between" style={{ background: headerBg }}>
        <div className="flex items-center gap-3">
          <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${(isFeeLocked || status === 'approved' || isCurrent) ? 'bg-white/20' : 'bg-white'}`}>
            {isFeeLocked
              ? <IndianRupee className="w-4 h-4 text-white" />
              : isLocked
                ? <Lock className="w-4 h-4 text-[#CBD5E1]" />
                : <BookOpen className={`w-4 h-4 ${(status === 'approved' || isCurrent) ? 'text-white' : 'text-[#CA6357]'}`} />}
          </div>
          <div>
            <p className={`text-sm font-bold ${headerText}`}>Week {weekNum}</p>
            {isFeeLocked && <p className="text-[10px] text-white/80">Pay installment to unlock</p>}
            {!isFeeLocked && isLocked && <p className="text-[10px] text-[#94A3B8]">Complete previous week first</p>}
            {!effectiveLocked && !status && <p className={`text-[10px] ${isCurrent ? 'text-white/70' : 'text-[#94A3B8]'}`}>Not started</p>}
            {status === 'in_progress' && (
              <p className="text-[10px] text-white/70">{approvedN} of {daysToShow.length} days approved · {submittedN} pending</p>
            )}
            {status === 'corrections_requested' && (
              <p className="text-[10px] text-white/70">{approvedN} of {daysToShow.length} days approved</p>
            )}
            {status === 'approved' && <p className="text-[10px] text-white/80">All {daysToShow.length} days completed</p>}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {status && !isFeeLocked && (
            <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full"
              style={{ backgroundColor: 'rgba(255,255,255,0.2)', color: (status === 'approved' || isCurrent) ? 'white' : WEEK_STATUS[status]?.color }}>
              {WEEK_STATUS[status]?.label}
            </span>
          )}
          {!effectiveLocked && (
            <Link
              to={`/student/task-sheets/week/${weekNum}`}
              className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-1 rounded-lg bg-white/20 hover:bg-white/30 text-white transition-colors"
              title="View task sheet content"
            >
              <ExternalLink className="w-3 h-3" /> Content
            </Link>
          )}
          {(isLocked || isFeeLocked) && <Lock className="w-4 h-4 text-white/70" />}
        </div>
      </div>

      {/* Fee lock CTA */}
      {isFeeLocked && (
        <div className="bg-[#FBE9E7] px-5 py-4 flex items-center justify-between gap-3">
          <p className="text-sm text-[#92400E] leading-snug">
            This week is locked. Pay your next installment to unlock Week {weekNum} and beyond.
          </p>
          <Link to="/student/fees"
            className="flex-shrink-0 inline-flex items-center gap-1.5 bg-[#CA6357] hover:bg-[#b85548] text-white text-xs font-bold px-3 py-2 rounded-xl transition-colors">
            <IndianRupee className="w-3.5 h-3.5" /> Submit Receipt
          </Link>
        </div>
      )}

      {/* Day rows */}
      {!effectiveLocked && (
        <div className="bg-white">
          {daysToShow.map((dayNum) => {
            const dayEntry = days.find(d => d.day === dayNum) ?? null;
            const fileUrl  = fileUrls?.find(f => f.week === weekNum && f.day === dayNum)?.url ?? null;
            return (
              <DayRow
                key={dayNum}
                weekNum={weekNum}
                dayNum={dayNum}
                dayEntry={dayEntry}
                fileUrl={fileUrl}
                folderUrl={folderUrl}
                onSubmit={onSubmit}
                submitting={submittingKey === `${weekNum}-${dayNum}`}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function TaskSheetPage() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const { data: student, isLoading: studentLoading } = useQuery({
    queryKey: QK.STUDENT_ME,
    queryFn: studentService.getMyProfile,
    refetchInterval: 10_000,
  });

  const { data: enrollment, isLoading: enrollmentLoading } = useQuery({
    queryKey: QK.ENROLLMENT,
    queryFn: courseService.getMyEnrollment,
    refetchInterval: 30_000,
  });

  const courseId = enrollment?.course?._id;

  // Published week content for this course (shown always, regardless of submission status)
  const { data: publishedSheets = [] } = useQuery({
    queryKey: ['task-sheet-published', courseId],
    queryFn: () => taskSheetContentService.listPublishedByCourse(courseId),
    enabled: !!courseId,
    staleTime: 5 * 60 * 1000,
  });

  const { data: reviews = [], isLoading: reviewsLoading } = useQuery({
    queryKey: QK.WEEK_REVIEWS,
    queryFn: weekReviewService.getMyReviews,
    enabled: student?.taskSheetStatus === 'done',
    refetchInterval: 10_000,
  });

  const submitMutation = useMutation({
    mutationFn: ({ week, day }) => weekReviewService.submitDay({ week, day }),
    onSuccess: (_, { week, day }) => {
      toast.success(`Week ${week} · Day ${day} submitted for review`);
      queryClient.invalidateQueries({ queryKey: QK.WEEK_REVIEWS });
    },
    onError: (err) => toast.error(err?.response?.data?.message ?? 'Failed to submit'),
  });

  if (studentLoading || enrollmentLoading || reviewsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 text-[#CA6357] animate-spin" />
      </div>
    );
  }

  const taskSheetStatus = student?.taskSheetStatus ?? 'none';
  const taskSheetUrl    = student?.taskSheetUrl ?? null;
  const taskSheetFiles  = student?.taskSheetFiles ?? [];
  const courseName      = student?.course?.name ?? '';
  const totalWeeks      = student?.course?.durationWeeks ?? 4;
  const needsProvisioning = student?.course?.reviewType === 'screening';

  // null feeAccount → no fee structure → unrestricted access
  const feeAccount         = enrollment?.feeAccount ?? null;
  const accessValidUntilWeek = feeAccount ? (feeAccount.accessValidUntilWeek ?? 0) : Infinity;
  const feeIsLimited       = feeAccount && accessValidUntilWeek < totalWeeks;

  const reviewMap   = reviews.reduce((acc, r) => { acc[r.week] = r; return acc; }, {});
  const currentWeek = student?.currentWeek ?? 1;

  const isWeekProgressLocked = (weekNum) => {
    if (weekNum === 1) return false;
    return !(reviewMap[weekNum - 1]?.status === 'approved' && currentWeek >= weekNum);
  };

  const isWeekFeeLocked = (weekNum) => weekNum > accessValidUntilWeek;

  // Show revision/screening banner when Week 3 is done but Week 4 is still gated
  const showScreeningBanner = reviewMap[3]?.status === 'approved' && currentWeek === 3;

  const submittingKey = submitMutation.isPending
    ? `${submitMutation.variables?.week}-${submitMutation.variables?.day}`
    : null;

  return (
    <div className="space-y-6 pb-8">

      {/* Header */}
      <div className="relative rounded-2xl overflow-hidden p-6 sm:p-8"
        style={{ background: 'linear-gradient(135deg, #CA6357 0%, #A94E43 100%)' }}>
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-white/15 flex items-center justify-center flex-shrink-0">
            <FileText className="w-7 h-7 text-white" strokeWidth={1.8} />
          </div>
          <div className="flex-1">
            <p className="text-xs font-bold tracking-widest text-[#F2B3AC] uppercase mb-1">{courseName}</p>
            <h2 className="text-2xl font-bold text-white mb-1">Task Sheets</h2>
            <p className="text-white/60 text-sm">
              {reviews.filter(r => r.status === 'approved').length} of {totalWeeks} weeks completed
            </p>
          </div>
        </div>
      </div>

      {/* Not provisioned — show the most relevant blocking reason */}
      {taskSheetStatus === 'none' && (() => {
        // 1. Fee not paid
        if (feeAccount && accessValidUntilWeek === 0) return (
          <div className="bg-white rounded-2xl p-10 flex flex-col items-center text-center"
            style={{ boxShadow: '0 2px 16px rgba(0,0,0,0.05)', border: '1.5px solid #F2B3AC' }}>
            <div className="w-16 h-16 rounded-2xl bg-[#FBE9E7] flex items-center justify-center mb-5">
              <Lock className="w-8 h-8 text-[#D96C5F]" strokeWidth={1.5} />
            </div>
            <p className="text-base font-bold text-[#1E293B] mb-2">Submit your fee receipt first</p>
            <p className="text-sm text-[#94A3B8] max-w-xs leading-relaxed mb-5">
              Your task sheets will be set up once your first fee installment receipt is submitted and approved by the coordinator.
            </p>
            <Link to="/student/fees"
              className="inline-flex items-center gap-2 bg-[#CA6357] hover:bg-[#b85548] text-white font-semibold px-5 py-2.5 rounded-xl transition-colors text-sm">
              <IndianRupee className="w-4 h-4" /> Submit Receipt
            </Link>
          </div>
        );

        // 2. Microsoft email missing (required for OneDrive folder provisioning)
        if (needsProvisioning && !student?.microsoftEmail) return (
          <div className="bg-white rounded-2xl p-10 flex flex-col items-center text-center"
            style={{ boxShadow: '0 2px 16px rgba(0,0,0,0.05)', border: '1.5px solid #E0F2FE' }}>
            <div className="w-16 h-16 rounded-2xl bg-[#E0F2FE] flex items-center justify-center mb-5">
              <ShieldCheck className="w-8 h-8 text-[#0369A1]" strokeWidth={1.5} />
            </div>
            <p className="text-base font-bold text-[#1E293B] mb-2">Add your Microsoft email</p>
            <p className="text-sm text-[#94A3B8] max-w-xs leading-relaxed mb-5">
              Your coordinator needs your Microsoft (Outlook / Office 365) email to set up your personal task sheet folder on OneDrive. Add it in your profile settings.
            </p>
            <Link to="/student/profile"
              className="inline-flex items-center gap-2 bg-[#0369A1] hover:bg-[#025587] text-white font-semibold px-5 py-2.5 rounded-xl transition-colors text-sm">
              <ShieldCheck className="w-4 h-4" /> Go to Profile
            </Link>
          </div>
        );

        // 3. Submission folder not ready — show weekly content if available
        return (
          <div className="space-y-4">
            {publishedSheets.length > 0 ? (
              <div className="space-y-3">
                <p className="text-xs font-semibold text-[#94A3B8] uppercase tracking-wider px-1">Weekly Content</p>
                {publishedSheets.map(sheet => (
                  <button
                    key={sheet._id}
                    onClick={() => navigate(`/student/task-sheets/week/${sheet.week}`)}
                    className="w-full bg-white rounded-2xl border border-[#E2E8F0] p-4 flex items-center gap-4 hover:border-[#C45E52] hover:shadow-sm transition-all text-left group"
                    style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}
                  >
                    <div className="w-12 h-12 rounded-xl bg-[#FDEFEE] border border-[#F2B3AC] flex flex-col items-center justify-center shrink-0">
                      <span className="text-[10px] font-semibold text-[#C45E52] uppercase leading-none">Wk</span>
                      <span className="text-lg font-bold text-[#CA6357] leading-none">{sheet.week}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-[#1E293B] text-sm">
                        Week {sheet.week}{sheet.topicsOverview ? ` — ${sheet.topicsOverview}` : ''}
                      </p>
                      <p className="text-xs text-[#94A3B8] mt-0.5">{sheet.days?.length ?? 0} days</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-[#CBD5E1] group-hover:text-[#CA6357] shrink-0 transition-colors" />
                  </button>
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-2xl p-10 flex flex-col items-center text-center" style={{ boxShadow: '0 2px 16px rgba(0,0,0,0.05)' }}>
                <div className="w-16 h-16 rounded-2xl bg-[#FDEFEE] flex items-center justify-center mb-5">
                  <Layers className="w-8 h-8 text-[#CA6357]" strokeWidth={1.5} />
                </div>
                {needsProvisioning ? (
                  <>
                    <p className="text-base font-bold text-[#1E293B] mb-2">Task sheets not set up yet</p>
                    <p className="text-sm text-[#94A3B8] max-w-xs leading-relaxed">Your coordinator will set up your personal task sheet folder. You'll see your weekly content here once it's ready.</p>
                  </>
                ) : (
                  <>
                    <p className="text-base font-bold text-[#1E293B] mb-2">No content published yet</p>
                    <p className="text-sm text-[#94A3B8] max-w-xs leading-relaxed">This week's task sheet content hasn't been published yet. Check back soon.</p>
                  </>
                )}
              </div>
            )}
          </div>
        );
      })()}

      {taskSheetStatus === 'provisioning' && (
        <div className="bg-white rounded-2xl p-10 flex flex-col items-center text-center" style={{ boxShadow: '0 2px 16px rgba(0,0,0,0.05)' }}>
          <div className="w-16 h-16 rounded-2xl bg-[#FFFBEB] flex items-center justify-center mb-5">
            <Loader2 className="w-8 h-8 text-[#F59E0B] animate-spin" />
          </div>
          <p className="text-base font-bold text-[#1E293B] mb-2">Setting up your folder…</p>
          <p className="text-sm text-[#94A3B8] max-w-xs">Your personal OneDrive folder is being created. Refresh the page in a minute.</p>
        </div>
      )}

      {taskSheetStatus === 'error' && (
        <div className="bg-white rounded-2xl p-10 flex flex-col items-center text-center" style={{ boxShadow: '0 2px 16px rgba(0,0,0,0.05)' }}>
          <div className="w-16 h-16 rounded-2xl bg-[#FEE2E2] flex items-center justify-center mb-5">
            <AlertCircle className="w-8 h-8 text-[#D96C5F]" strokeWidth={1.5} />
          </div>
          <p className="text-base font-bold text-[#1E293B] mb-2">Setup failed</p>
          <p className="text-sm text-[#94A3B8] max-w-xs">Something went wrong. Please contact your coordinator.</p>
        </div>
      )}

      {/* Fee access barrier banner */}
      {taskSheetStatus === 'done' && feeIsLimited && (
        <div className="bg-white rounded-2xl p-5 flex items-start gap-4"
          style={{ boxShadow: '0 2px 16px rgba(0,0,0,0.05)', border: '1.5px solid #F2B3AC' }}>
          <div className="w-10 h-10 rounded-xl bg-[#FBE9E7] flex items-center justify-center flex-shrink-0">
            <IndianRupee className="w-5 h-5 text-[#D96C5F]" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-bold text-[#D96C5F] mb-0.5">
              {accessValidUntilWeek === 0 ? 'All weeks locked' : `Week ${accessValidUntilWeek + 1}+ is locked`}
            </p>
            <p className="text-sm text-[#475569] leading-relaxed">
              {accessValidUntilWeek === 0
                ? 'No fee installment paid yet. Pay your first installment to unlock your task sheets.'
                : <>Your current fee payment covers up to <strong>Week {accessValidUntilWeek}</strong>. Pay your next installment to unlock further weeks.</>}
            </p>
          </div>
          <Link to="/student/fees"
            className="flex-shrink-0 self-center inline-flex items-center gap-1.5 bg-[#CA6357] hover:bg-[#b85548] text-white text-xs font-bold px-3 py-2 rounded-xl transition-colors">
            <IndianRupee className="w-3.5 h-3.5" /> Submit Receipt
          </Link>
        </div>
      )}

      {/* Revision / screening gate banner */}
      {taskSheetStatus === 'done' && showScreeningBanner && (
        <div className="bg-white rounded-2xl p-5 flex items-start gap-4" style={{ boxShadow: '0 2px 16px rgba(0,0,0,0.05)', border: '1.5px solid #E0F2FE' }}>
          <div className="w-10 h-10 rounded-xl bg-[#E0F2FE] flex items-center justify-center flex-shrink-0">
            <ShieldCheck className="w-5 h-5 text-[#0369A1]" />
          </div>
          <div>
            <p className="text-sm font-bold text-[#0369A1] mb-0.5">Week 3 complete — Revision period</p>
            <p className="text-sm text-[#475569] leading-relaxed">
              You have 4 days to revise Week 3 topics. After that, your <strong>Part 1 Screening</strong> will be scheduled. Week 4 unlocks once you pass the screening.
            </p>
            <p className="text-xs text-[#94A3B8] mt-1.5">Check your notifications or contact your mentor for the screening slot.</p>
          </div>
        </div>
      )}

      {/* Published weekly content (always shown when available) */}
      {taskSheetStatus === 'done' && publishedSheets.length > 0 && (
        <div className="space-y-3">
          <p className="text-xs font-semibold text-[#94A3B8] uppercase tracking-wider px-1">Weekly Content</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {publishedSheets.map(sheet => (
              <button
                key={sheet._id}
                onClick={() => navigate(`/student/task-sheets/week/${sheet.week}`)}
                className="bg-white rounded-2xl border border-[#E2E8F0] p-4 flex items-center gap-3 hover:border-[#C45E52] hover:shadow-sm transition-all text-left group"
                style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}
              >
                <div className="w-10 h-10 rounded-xl bg-[#FDEFEE] border border-[#F2B3AC] flex flex-col items-center justify-center shrink-0">
                  <span className="text-[9px] font-semibold text-[#C45E52] uppercase leading-none">Wk</span>
                  <span className="text-base font-bold text-[#CA6357] leading-none">{sheet.week}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-[#1E293B] text-xs leading-snug truncate">
                    {sheet.topicsOverview || `Week ${sheet.week}`}
                  </p>
                  <p className="text-[10px] text-[#94A3B8] mt-0.5">{sheet.days?.length ?? 0} days</p>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-[#CBD5E1] group-hover:text-[#CA6357] shrink-0" />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Week cards */}
      {taskSheetStatus === 'done' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {Array.from({ length: totalWeeks }, (_, i) => i + 1).map((week) => (
            <WeekCard
              key={week}
              weekNum={week}
              isLocked={isWeekProgressLocked(week)}
              isFeeLocked={isWeekFeeLocked(week)}
              review={reviewMap[week] ?? null}
              folderUrl={taskSheetUrl}
              fileUrls={taskSheetFiles}
              onSubmit={(w, d) => submitMutation.mutate({ week: w, day: d })}
              submittingKey={submittingKey}
            />
          ))}
        </div>
      )}

      {/* How-to hint */}
      {taskSheetStatus === 'done' && (
        <div className="bg-[#FDEFEE] rounded-2xl p-4 flex items-start gap-3">
          <div className="w-8 h-8 rounded-lg bg-[#CA6357]/10 flex items-center justify-center flex-shrink-0 mt-0.5">
            <FileText className="w-4 h-4 text-[#CA6357]" />
          </div>
          <div>
            <p className="text-sm font-semibold text-[#CA6357] mb-0.5">How it works</p>
            <p className="text-xs text-[#A94E43] leading-relaxed">
              Click <strong>Open</strong> next to any day to edit your task sheet in Word Online. Click <strong>Submit</strong> on each day once you're done — your mentor will review each day individually and may leave correction notes. The next week unlocks once all 6 days in this week are approved.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
