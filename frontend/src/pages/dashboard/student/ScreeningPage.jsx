import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import {
  ClipboardList, Lock, Calendar, CheckCircle2, XCircle,
  Clock, ExternalLink, Loader2, ChevronDown, ChevronUp, AlertTriangle, History,
} from 'lucide-react';
import { reviewService } from '../../../services/review.service.js';
import { courseService } from '../../../services/course.service.js';
import { useAuthStore } from '../../../store/authStore.js';
import { QK } from '../../../constants/queryKeys.js';

const STATUS_CFG = {
  pending_slot: { label: 'Book a Slot',   color: '#F59E0B', bg: '#FFFBEB', icon: Clock },
  slot_booked:  { label: 'Slot Booked',   color: '#7C6AF2', bg: '#F2EEFD', icon: Calendar },
  completed:    { label: 'Completed',      color: '#22C55E', bg: '#E8F8F2', icon: CheckCircle2 },
};

// ── Slot picker ───────────────────────────────────────────────────────────────
function SlotPicker({ reviewId, earliestDate, isRetry, onBooked }) {
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
      qc.invalidateQueries({ queryKey: ['my-screenings'] });
      onBooked?.();
    },
    onError: (err) => toast.error(err?.response?.data?.message ?? 'Failed to book slot'),
  });

  return (
    <div className="mt-4">
      {earliestDate && new Date(earliestDate) > new Date() && (
        <div className="mb-3 bg-[#FFFBEB] border border-[#FCD34D] rounded-xl px-4 py-3 text-sm text-[#92400E]">
          {isRetry ? (
            <>
              Retry available from{' '}
              <span className="font-semibold">
                {new Date(earliestDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
              </span>. Use this time to revise the topics flagged by your mentor.
            </>
          ) : (
            <>
              Your revision period runs until{' '}
              <span className="font-semibold">
                {new Date(earliestDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
              </span>. Mentor slots will appear from that date onwards.
            </>
          )}
        </div>
      )}
      <button
        onClick={() => setOpen((v) => !v)}
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
              No slots available yet. Check back soon or contact your coordinator.
            </p>
          )}
          {slots.map((slot) => (
            <div
              key={slot._id}
              className="flex items-center justify-between bg-[#F8F9FB] rounded-xl px-4 py-3 gap-3"
            >
              <div>
                <p className="text-sm font-semibold text-[#1E293B]">
                  {new Date(slot.scheduledAt).toLocaleString('en-IN', {
                    weekday: 'short', day: 'numeric', month: 'short',
                    hour: '2-digit', minute: '2-digit',
                  })}
                </p>
              </div>
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

// ── Screening card ─────────────────────────────────────────────────────────────
function ScreeningCard({ part, afterWeek, reviews, currentWeek }) {
  // reviews sorted newest-first; first = current attempt, rest = past failed
  const review     = reviews[0] ?? null;
  const pastFailed = reviews.slice(1).filter(r => r.status === 'completed' && r.result === 'fail');
  const isUnlocked = currentWeek > afterWeek || !!review;
  const cfg = review ? STATUS_CFG[review.status] : null;
  const StatusIcon = cfg?.icon ?? Lock;

  return (
    <div
      className="bg-white rounded-2xl overflow-hidden"
      style={{ boxShadow: '0 2px 16px rgba(0,0,0,0.05)' }}
    >
      {/* Header bar */}
      <div
        className="px-6 py-4 flex items-center justify-between"
        style={{ background: isUnlocked ? 'linear-gradient(135deg, #CA6357 0%, #A94E43 100%)' : '#F1F5F9' }}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: isUnlocked ? 'rgba(255,255,255,0.15)' : '#E2E8F0' }}
          >
            {isUnlocked
              ? <ClipboardList className="w-5 h-5 text-white" strokeWidth={1.8} />
              : <Lock className="w-5 h-5 text-[#94A3B8]" strokeWidth={1.8} />}
          </div>
          <div>
            <p className={`text-xs font-bold tracking-widest uppercase mb-0.5 ${isUnlocked ? 'text-[#F2B3AC]' : 'text-[#94A3B8]'}`}>
              Screening
            </p>
            <p className={`text-lg font-bold ${isUnlocked ? 'text-white' : 'text-[#475569]'}`}>
              Part {part}
            </p>
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
        {!isUnlocked && (
          <span className="text-xs font-semibold text-[#94A3B8]">
            Unlocks after Week {afterWeek}
          </span>
        )}
      </div>

      {/* Body */}
      <div className="px-6 py-5">
        <p className="text-sm text-[#475569]">
          {isUnlocked
            ? `Triggered after completing Week ${afterWeek}.`
            : `Complete all ${afterWeek} weeks to unlock this screening.`}
        </p>

        {/* Locked progress hint */}
        {!isUnlocked && (
          <div className="mt-4 bg-[#F8F9FB] rounded-xl px-4 py-3 flex items-center gap-2">
            <div className="w-full bg-[#E2E8F0] rounded-full h-1.5">
              <div
                className="bg-[#CA6357] h-1.5 rounded-full transition-all"
                style={{ width: `${Math.min(100, (currentWeek / afterWeek) * 100)}%` }}
              />
            </div>
            <span className="text-xs font-semibold text-[#94A3B8] flex-shrink-0">
              Week {Math.min(currentWeek, afterWeek)}/{afterWeek}
            </span>
          </div>
        )}

        {/* Pending slot — show slot picker */}
        {review?.status === 'pending_slot' && (
          <SlotPicker reviewId={review._id} earliestDate={review.earliestDate} isRetry={pastFailed.length > 0} />
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
              <p className="text-xs text-[#92400E]">Your mentor is reviewing whether to keep or reschedule this slot. You'll be notified once a decision is made.</p>
            )}
            {!review.slot.holidayConflict && review.slot.meetingLink && (
              <a
                href={review.slot.meetingLink}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#7C6AF2] hover:underline mt-1"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                Join Meeting
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
export default function ScreeningPage() {
  const { user } = useAuthStore();
  const screenings = user?.courseScreenings ?? [];

  const { data: enrollment } = useQuery({
    queryKey: QK.ENROLLMENT,
    queryFn: courseService.getMyEnrollment,
    staleTime: 60_000,
  });
  const currentWeek = enrollment?.currentWeek ?? 1;

  const { data: reviews = [], isLoading } = useQuery({
    queryKey: ['my-screenings'],
    queryFn: () => reviewService.getMyReviews(),
    select: (data) => data.filter((r) => r.reviewType === 'screening'),
  });

  // reviews sorted newest-first — group ALL by part so past failed attempts are preserved
  const reviewsByPart = reviews.reduce((acc, r) => {
    if (!acc[r.part]) acc[r.part] = [];
    acc[r.part].push(r);
    return acc;
  }, {});

  return (
    <div className="space-y-6 pb-8">

      {/* Header */}
      <div
        className="relative rounded-2xl overflow-hidden p-6 sm:p-8"
        style={{ background: 'linear-gradient(135deg, #CA6357 0%, #A94E43 100%)' }}
      >
        <div className="relative z-10 flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-white/15 flex items-center justify-center flex-shrink-0">
            <ClipboardList className="w-7 h-7 text-white" strokeWidth={1.8} />
          </div>
          <div>
            <p className="text-xs font-bold tracking-widest text-[#F2B3AC] uppercase mb-1">Zero2Code</p>
            <h2 className="text-2xl font-bold text-white">Screenings</h2>
            <p className="text-white/60 text-sm mt-0.5">
              {screenings.length} screenings · complete week milestones to unlock each one
            </p>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-6 h-6 text-[#CA6357] animate-spin" />
        </div>
      ) : (
        <div className="space-y-4">
          {screenings
            .slice()
            .sort((a, b) => a.part - b.part)
            .map((s) => (
              <ScreeningCard
                key={s.part}
                part={s.part}
                afterWeek={s.afterWeek}
                reviews={reviewsByPart[s.part] ?? []}
                currentWeek={currentWeek}
              />
            ))}
        </div>
      )}
    </div>
  );
}
