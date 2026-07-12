import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import {
  Video, Lock, Calendar, CheckCircle2, XCircle,
  Clock, ExternalLink, Loader2, ChevronDown, ChevronUp,
  AlertTriangle, History, BookOpen,
} from 'lucide-react';
import { reviewService } from '../../../services/review.service.js';
import { courseService } from '../../../services/course.service.js';
import { QK } from '../../../constants/queryKeys.js';

const STATUS_CFG = {
  pending_slot: { label: 'Book a Slot',  color: '#F59E0B', bg: '#FFFBEB', icon: Clock },
  slot_booked:  { label: 'Slot Booked',  color: '#7C6AF2', bg: '#F2EEFD', icon: Calendar },
  completed:    { label: 'Completed',    color: '#22C55E', bg: '#E8F8F2', icon: CheckCircle2 },
};

// ── Slot picker ───────────────────────────────────────────────────────────────
function SlotPicker({ reviewId, onBooked }) {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);

  const { data: slots = [], isLoading } = useQuery({
    queryKey: ['review-slots', reviewId],
    queryFn: () => reviewService.getAvailableSlots(reviewId),
    enabled: open,
  });

  const bookMutation = useMutation({
    mutationFn: (slotId) => reviewService.bookSlot(reviewId, slotId),
    onSuccess: () => {
      toast.success('Slot booked! Check your meeting link.');
      qc.invalidateQueries({ queryKey: QK.MY_REVIEWS, refetchType: 'all' });
      onBooked?.();
    },
    onError: (err) => toast.error(err?.response?.data?.message ?? 'Failed to book slot'),
  });

  return (
    <div className="mt-4">
      <button
        onClick={() => setOpen(v => !v)}
        className="inline-flex items-center gap-2 text-sm font-semibold text-white bg-[#CA6357] hover:bg-[#b85548] px-4 py-2.5 rounded-xl transition-colors"
      >
        View Available Slots
        {open ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
      </button>

      {open && (
        <div className="mt-3 space-y-2">
          {isLoading && (
            <div className="flex items-center gap-2 text-sm text-[#94A3B8] py-3">
              <Loader2 className="w-4 h-4 animate-spin" /> Loading slots…
            </div>
          )}
          {!isLoading && slots.length === 0 && (
            <p className="text-sm text-[#94A3B8] bg-[#F8F9FB] rounded-xl px-4 py-3">
              No slots available yet. Your mentor will add slots soon — you'll get a notification.
            </p>
          )}
          {slots.map(slot => (
            <div
              key={slot._id}
              className="flex items-center justify-between bg-[#F8F9FB] rounded-xl px-4 py-3 gap-3"
            >
              <p className="text-sm font-semibold text-[#1E293B]">
                {new Date(slot.scheduledAt).toLocaleString('en-IN', {
                  weekday: 'short', day: 'numeric', month: 'short',
                  hour: '2-digit', minute: '2-digit',
                })}
              </p>
              <button
                onClick={() => bookMutation.mutate(slot._id)}
                disabled={bookMutation.isPending}
                className="inline-flex items-center gap-1.5 text-xs font-semibold bg-[#CA6357] hover:bg-[#b85548] text-white px-3 py-1.5 rounded-lg transition-colors disabled:opacity-60"
              >
                {bookMutation.isPending && bookMutation.variables === slot._id
                  ? <Loader2 className="w-3 h-3 animate-spin" /> : null}
                Book
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Past failed attempt ───────────────────────────────────────────────────────
function PastAttempt({ review, index }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border border-[#FEE2E2] rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between px-4 py-3 bg-[#FEF2F2] hover:bg-[#FEE2E2] transition-colors text-left"
      >
        <div className="flex items-center gap-2">
          <History className="w-3.5 h-3.5 text-[#D96C5F]" />
          <span className="text-xs font-semibold text-[#D96C5F]">Attempt {index} — Not Passed</span>
          {review.marks != null && (
            <span className="text-xs text-[#94A3B8]">· {review.marks}/10</span>
          )}
        </div>
        {open ? <ChevronUp className="w-3.5 h-3.5 text-[#94A3B8]" /> : <ChevronDown className="w-3.5 h-3.5 text-[#94A3B8]" />}
      </button>
      {open && (
        <div className="px-4 py-3 bg-white space-y-2.5">
          {review.marks != null && (
            <div className="flex items-center gap-2">
              <XCircle className="w-4 h-4 text-[#D96C5F]" />
              <span className="text-sm font-semibold text-[#D96C5F]">Score: {review.marks} / 10</span>
            </div>
          )}
          {review.remarks && (
            <div>
              <p className="text-xs font-bold text-[#94A3B8] uppercase tracking-wide mb-1">Mentor Remarks</p>
              <p className="text-sm text-[#475569] leading-relaxed">{review.remarks}</p>
            </div>
          )}
          {review.pendingTopics?.length > 0 && (
            <div>
              <p className="text-xs font-bold text-[#94A3B8] uppercase tracking-wide mb-1.5">Topics to Revise</p>
              <ul className="space-y-1">
                {review.pendingTopics.map((t, i) => (
                  <li key={i} className="text-xs text-[#475569] flex items-start gap-1.5">
                    <span className="text-[#D96C5F] mt-0.5">•</span>{t}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {review.reviewedAt && (
            <p className="text-xs text-[#CBD5E1]">
              Reviewed {new Date(review.reviewedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

// ── Per-week review card ───────────────────────────────────────────────────────
function WeekReviewCard({ weekNum, reviews }) {
  // Reviews sorted newest-first — first is the active/latest attempt
  const review     = reviews[0] ?? null;
  const pastFailed = reviews.slice(1).filter(r => r.status === 'completed' && r.result === 'fail');

  const cfg        = review ? STATUS_CFG[review.status] : null;
  const StatusIcon = cfg?.icon ?? Lock;

  return (
    <div className="bg-white rounded-2xl overflow-hidden" style={{ boxShadow: '0 2px 16px rgba(0,0,0,0.05)' }}>
      {/* Card header */}
      <div
        className="px-6 py-4 flex items-center justify-between"
        style={{ background: 'linear-gradient(135deg, #CA6357 0%, #A94E43 100%)' }}
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center shrink-0">
            <Video className="w-5 h-5 text-white" strokeWidth={1.8} />
          </div>
          <div>
            <p className="text-xs font-bold tracking-widest text-[#F2B3AC] uppercase mb-0.5">Weekly Review</p>
            <p className="text-lg font-bold text-white">Week {weekNum}</p>
          </div>
        </div>
        {cfg && (
          <span
            className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full"
            style={{ backgroundColor: cfg.bg, color: cfg.color }}
          >
            <StatusIcon className="w-3.5 h-3.5" />
            {cfg.label}
          </span>
        )}
      </div>

      {/* Card body */}
      <div className="px-6 py-5">
        <p className="text-sm text-[#475569]">
          Video review for Week {weekNum} — your mentor will evaluate your understanding of the week's topics.
        </p>

        {/* Pending slot */}
        {review?.status === 'pending_slot' && (
          <SlotPicker reviewId={review._id} />
        )}

        {/* Slot booked */}
        {review?.status === 'slot_booked' && review.slot && (
          <div className={`mt-4 rounded-xl px-4 py-4 space-y-2 ${review.slot.holidayConflict ? 'bg-[#FEF9EC] border border-[#FCD34D]' : 'bg-[#F2EEFD]'}`}>
            {review.slot.holidayConflict ? (
              <div className="flex items-center gap-2 mb-1">
                <AlertTriangle className="w-4 h-4 text-[#F59E0B]" />
                <p className="text-xs font-bold text-[#B45309] uppercase tracking-wide">Slot under review — holiday declared</p>
              </div>
            ) : (
              <p className="text-xs font-bold text-[#7C6AF2] uppercase tracking-wide">Your Slot</p>
            )}
            <p className="text-sm font-semibold text-[#1E293B]">
              {new Date(review.slot.scheduledAt).toLocaleString('en-IN', {
                weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
                hour: '2-digit', minute: '2-digit',
              })}
            </p>
            {review.slot.holidayConflict && (
              <p className="text-xs text-[#92400E]">Your mentor is reviewing whether to keep or reschedule this slot. You'll be notified.</p>
            )}
            {!review.slot.holidayConflict && review.slot.meetingLink && (
              <a
                href={review.slot.meetingLink}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#7C6AF2] hover:underline mt-1"
              >
                <ExternalLink className="w-3.5 h-3.5" /> Join Meeting
              </a>
            )}
          </div>
        )}

        {/* Completed */}
        {review?.status === 'completed' && (
          <div
            className="mt-4 rounded-xl px-4 py-4 space-y-3"
            style={{ backgroundColor: review.result === 'pass' ? '#E8F8F2' : '#FEE2E2' }}
          >
            <div className="flex items-center gap-2">
              {review.result === 'pass'
                ? <CheckCircle2 className="w-5 h-5 text-[#22C55E]" />
                : <XCircle className="w-5 h-5 text-[#D96C5F]" />}
              <p className={`text-sm font-bold ${review.result === 'pass' ? 'text-[#22A66E]' : 'text-[#D96C5F]'}`}>
                {review.result === 'pass' ? 'Passed' : 'Not Passed'}
              </p>
              {review.marks != null && (
                <span className="ml-auto text-sm font-semibold text-[#475569]">
                  {review.marks} / 10
                </span>
              )}
            </div>
            {review.remarks && (
              <p className="text-sm text-[#475569] leading-relaxed">{review.remarks}</p>
            )}
            {review.pendingTopics?.length > 0 && (
              <div>
                <p className="text-xs font-bold text-[#94A3B8] uppercase tracking-wide mb-1.5">Topics to revisit</p>
                <ul className="space-y-1">
                  {review.pendingTopics.map((t, i) => (
                    <li key={i} className="text-xs text-[#475569] flex items-start gap-1.5">
                      <span className="text-[#D96C5F] mt-0.5">•</span>{t}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Past failed attempts */}
        {pastFailed.length > 0 && (
          <div className="mt-4 space-y-2">
            <p className="text-xs font-bold text-[#94A3B8] uppercase tracking-wide">Previous Attempts</p>
            {pastFailed.map((r, i) => (
              <PastAttempt key={r._id} review={r} index={pastFailed.length - i} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function WeeklyReviewPage() {
  const { data: enrollment, isLoading: enrollmentLoading } = useQuery({
    queryKey: QK.ENROLLMENT,
    queryFn: courseService.getMyEnrollment,
    staleTime: 60_000,
  });

  const { data: reviews = [], isLoading: reviewsLoading } = useQuery({
    queryKey: QK.MY_REVIEWS,
    queryFn: reviewService.getMyReviews,
    select: (data) => data.filter(r => r.reviewType === 'weekly'),
  });

  const isLoading  = enrollmentLoading || reviewsLoading;
  const courseName = enrollment?.course?.name ?? 'Code2Career';
  const totalWeeks = enrollment?.course?.durationWeeks ?? 0;

  // Group all attempts by weekNumber — sorted newest-first already from the API
  const reviewsByWeek = reviews.reduce((acc, r) => {
    const wk = r.weekNumber;
    if (!acc[wk]) acc[wk] = [];
    acc[wk].push(r);
    return acc;
  }, {});

  const weekNumbers  = Object.keys(reviewsByWeek).map(Number).sort((a, b) => a - b);
  const passedCount  = weekNumbers.filter(wk => reviewsByWeek[wk][0]?.result === 'pass').length;

  return (
    <div className="space-y-6 pb-8">

      {/* Header */}
      <div
        className="relative rounded-2xl overflow-hidden p-6 sm:p-8"
        style={{ background: 'linear-gradient(135deg, #CA6357 0%, #A94E43 100%)' }}
      >
        <div className="relative z-10 flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-white/15 flex items-center justify-center shrink-0">
            <Video className="w-7 h-7 text-white" strokeWidth={1.8} />
          </div>
          <div>
            <p className="text-xs font-bold tracking-widest text-[#F2B3AC] uppercase mb-1">{courseName}</p>
            <h2 className="text-2xl font-bold text-white">Weekly Reviews</h2>
            <p className="text-white/60 text-sm mt-0.5">
              {passedCount} of {totalWeeks} weeks reviewed
            </p>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-6 h-6 text-[#CA6357] animate-spin" />
        </div>
      ) : weekNumbers.length === 0 ? (
        <div className="bg-white rounded-2xl p-10 flex flex-col items-center text-center" style={{ boxShadow: '0 2px 16px rgba(0,0,0,0.05)' }}>
          <div className="w-14 h-14 rounded-2xl bg-[#FDEFEE] flex items-center justify-center mb-4">
            <BookOpen className="w-7 h-7 text-[#CA6357]" strokeWidth={1.5} />
          </div>
          <p className="text-base font-bold text-[#1E293B] mb-1">No reviews scheduled yet</p>
          <p className="text-sm text-[#94A3B8] max-w-xs leading-relaxed">
            Complete all days of a week and have them approved by your mentor — a review will be scheduled automatically after each week.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {weekNumbers.map(wk => (
            <WeekReviewCard key={wk} weekNum={wk} reviews={reviewsByWeek[wk]} />
          ))}
        </div>
      )}
    </div>
  );
}
