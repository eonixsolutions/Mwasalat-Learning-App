import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import {
  ClipboardCheck, Loader2, CheckCircle, XCircle, FolderOpen,
  Calendar, MessageSquare, X, FileText,
} from 'lucide-react';
import { weekReviewService } from '../../../services/weekreview.service.js';


const WEEK_STATUS_CFG = {
  in_progress:           { label: 'In Progress',       color: '#F59E0B', bg: '#FFFBEB' },
  approved:              { label: 'All Approved',       color: '#22A66E', bg: '#E8F8F2' },
  corrections_requested: { label: 'Corrections Needed', color: '#D96C5F', bg: '#FEE2E2' },
};

const DAY_STATUS_CFG = {
  submitted:             { label: 'Pending Review',     color: '#F59E0B', bg: '#FFFBEB' },
  approved:              { label: 'Approved',            color: '#22A66E', bg: '#E8F8F2' },
  corrections_requested: { label: 'Corrections',         color: '#D96C5F', bg: '#FEE2E2' },
};

function DayReviewRow({ reviewId, dayEntry, dayNum, fileUrl }) {
  const [note, setNote]   = useState('');
  const queryClient       = useQueryClient();

  const mutation = useMutation({
    mutationFn: ({ status, mentorNote }) =>
      weekReviewService.reviewDay(reviewId, dayEntry._id, { status, mentorNote }),
    onSuccess: () => {
      toast.success(
        mutation.variables?.status === 'approved' ? `Day ${dayNum} approved` : `Corrections sent for Day ${dayNum}`
      );
      setNote('');
      queryClient.invalidateQueries({ queryKey: ['week-reviews'] });
    },
    onError: (err) => toast.error(err?.response?.data?.message ?? 'Failed to submit review'),
  });

  const handleApprove = () => {
    mutation.mutate({ status: 'approved', mentorNote: note.trim() || null });
  };

  const handleCorrections = () => {
    if (!note.trim()) {
      toast.error('Add a note describing what needs to be corrected');
      return;
    }
    mutation.mutate({ status: 'corrections_requested', mentorNote: note.trim() });
  };

  return (
    <div className="flex flex-col gap-2 px-5 py-3">
      {/* Day header row */}
      <div className="flex items-center gap-3">
        <div className="w-7 h-7 rounded-lg bg-[#FFFBEB] text-[#B45309] font-bold text-[11px] flex items-center justify-center flex-shrink-0">
          D{dayNum}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-[#1E293B]">Day {dayNum}</p>
          <p className="text-[11px] text-[#94A3B8]">
            Submitted {new Date(dayEntry.submittedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
          </p>
        </div>
        {fileUrl && (
          <a href={fileUrl} target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#CA6357] bg-[#FDEFEE] hover:bg-[#F6D5D0] px-2 py-1.5 rounded-lg transition-colors flex-shrink-0">
            <FileText className="w-3 h-3" /> Open
          </a>
        )}
      </div>

      {/* Note + action row */}
      <div className="ml-10 flex flex-col gap-2">
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={2}
          placeholder="Add a note (optional for approval, required for corrections)…"
          className="w-full px-3 py-2 border border-[#E2E8F0] rounded-lg text-sm text-[#1E293B] placeholder-[#94A3B8] focus:outline-none focus:border-[#CA6357] resize-none"
        />
        <div className="flex gap-2">
          <button
            onClick={handleApprove}
            disabled={mutation.isPending}
            className="flex-1 inline-flex items-center justify-center gap-1.5 text-xs font-semibold bg-[#E8F8F2] hover:bg-[#d0f0e0] text-[#22A66E] px-3 py-2 rounded-lg transition-colors disabled:opacity-60">
            {mutation.isPending && mutation.variables?.status === 'approved'
              ? <Loader2 className="w-3 h-3 animate-spin" />
              : <CheckCircle className="w-3 h-3" />}
            Approve
          </button>
          <button
            onClick={handleCorrections}
            disabled={mutation.isPending}
            className="flex-1 inline-flex items-center justify-center gap-1.5 text-xs font-semibold bg-[#FEE2E2] hover:bg-[#fcd0d0] text-[#D96C5F] px-3 py-2 rounded-lg transition-colors disabled:opacity-60">
            {mutation.isPending && mutation.variables?.status === 'corrections_requested'
              ? <Loader2 className="w-3 h-3 animate-spin" />
              : <XCircle className="w-3 h-3" />}
            Corrections
          </button>
        </div>
      </div>
    </div>
  );
}

function ReviewedDayRow({ dayEntry, dayNum, fileUrl }) {
  const cfg = DAY_STATUS_CFG[dayEntry.status];
  return (
    <div className="flex flex-col gap-1 px-5 py-3">
      <div className="flex items-center gap-3">
        <div className={`w-7 h-7 rounded-lg text-[11px] font-bold flex items-center justify-center flex-shrink-0`}
          style={{ backgroundColor: cfg.bg, color: cfg.color }}>
          D{dayNum}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-[#1E293B]">Day {dayNum}</p>
          {dayEntry.reviewedAt && (
            <p className="text-[11px] text-[#94A3B8]">
              Reviewed {new Date(dayEntry.reviewedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {fileUrl && (
            <a href={fileUrl} target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#CA6357] bg-[#FDEFEE] hover:bg-[#F6D5D0] px-2 py-1.5 rounded-lg transition-colors">
              <FileText className="w-3 h-3" /> Open
            </a>
          )}
          <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full"
            style={{ backgroundColor: cfg.bg, color: cfg.color }}>
            {cfg.label}
          </span>
        </div>
      </div>
      {dayEntry.mentorNote && (
        <div className={`ml-10 rounded-lg p-2 flex items-start gap-2 ${dayEntry.status === 'approved' ? 'bg-[#E8F8F2]' : 'bg-[#FEF3C7]'}`}>
          <MessageSquare className={`w-3 h-3 flex-shrink-0 mt-0.5 ${dayEntry.status === 'approved' ? 'text-[#22A66E]' : 'text-[#F59E0B]'}`} />
          <p className={`text-xs leading-relaxed ${dayEntry.status === 'approved' ? 'text-[#166534]' : 'text-[#92400E]'}`}>
            {dayEntry.mentorNote}
          </p>
        </div>
      )}
    </div>
  );
}

function ReviewModal({ review, onClose }) {
  const student     = review.student?.user ?? {};
  const folderUrl   = review.student?.taskSheetUrl ?? null;
  const fileEntries = review.student?.taskSheetFiles ?? [];

  const getFileUrl = (dayNum) =>
    fileEntries.find(f => f.week === review.week && f.day === dayNum)?.url ?? null;

  const dayMap = (review.days ?? []).reduce((acc, d) => { acc[d.day] = d; return acc; }, {});
  const pendingCount = (review.days ?? []).filter(d => d.status === 'submitted').length;

  // Only show days that have a task-sheet file or have been submitted/reviewed
  const daysToShow = (() => {
    const withFiles   = fileEntries.filter(f => f.week === review.week).map(f => f.day);
    const withEntries = (review.days ?? []).map(d => d.day);
    const unique      = [...new Set([...withFiles, ...withEntries])].sort((a, b) => a - b);
    return unique.length > 0 ? unique : [1, 2, 3, 4, 5, 6];
  })();

  return (
    <>
      <div className="fixed inset-0 bg-black/30 z-40" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] flex flex-col" style={{ boxShadow: '0 4px 30px rgba(0,0,0,0.12)' }}>

          {/* Modal header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-[#F1F5F9] flex-shrink-0">
            <div>
              <p className="text-base font-bold text-[#1E293B]">Week {review.week} Review</p>
              {pendingCount > 0 && (
                <p className="text-xs text-[#F59E0B] font-medium">{pendingCount} day{pendingCount !== 1 ? 's' : ''} awaiting review</p>
              )}
            </div>
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-[#F8F9FB]">
              <X className="w-4 h-4 text-[#94A3B8]" />
            </button>
          </div>

          {/* Student info */}
          <div className="px-6 py-3 border-b border-[#F1F5F9] flex-shrink-0">
            <div className="bg-[#F8F9FB] rounded-xl p-3 flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-[#FDEFEE] text-[#CA6357] font-bold text-sm flex items-center justify-center flex-shrink-0">
                {(student.name ?? '?').split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-[#1E293B]">{student.name ?? '—'}</p>
                <p className="text-xs text-[#94A3B8]">{student.email ?? '—'}</p>
              </div>
              {folderUrl && (
                <a href={folderUrl} target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#CA6357] bg-[#FDEFEE] hover:bg-[#F6D5D0] px-3 py-1.5 rounded-lg transition-colors flex-shrink-0">
                  <FolderOpen className="w-3.5 h-3.5" /> View Sheets
                </a>
              )}
            </div>
          </div>

          {/* Day list */}
          <div className="flex-1 overflow-y-auto divide-y divide-[#F8F9FB]">
            {daysToShow.map((dayNum) => {
              const dayEntry = dayMap[dayNum];
              if (!dayEntry) {
                return (
                  <div key={dayNum} className="flex items-center gap-3 px-5 py-3 opacity-40">
                    <div className="w-7 h-7 rounded-lg bg-[#F1F5F9] text-[#94A3B8] font-bold text-[11px] flex items-center justify-center flex-shrink-0">
                      D{dayNum}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-[#1E293B]">Day {dayNum}</p>
                      <p className="text-[11px] text-[#94A3B8]">Not submitted yet</p>
                    </div>
                  </div>
                );
              }
              if (dayEntry.status === 'submitted') {
                return (
                  <DayReviewRow
                    key={dayNum}
                    reviewId={review._id}
                    dayEntry={dayEntry}
                    dayNum={dayNum}
                    fileUrl={getFileUrl(dayNum)}
                  />
                );
              }
              return (
                <ReviewedDayRow key={dayNum} dayEntry={dayEntry} dayNum={dayNum} fileUrl={getFileUrl(dayNum)} />
              );
            })}
          </div>

          <div className="px-6 py-4 border-t border-[#F1F5F9] flex-shrink-0">
            <button onClick={onClose}
              className="w-full border border-[#E2E8F0] text-[#475569] font-medium px-4 py-2.5 rounded-xl hover:bg-[#F8F9FB] text-sm">
              Close
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

const COURSE_TABS = [
  { key: 'zero2code',   label: 'Zero2Code',   reviewType: 'screening' },
  { key: 'code2career', label: 'Code2Career',  reviewType: 'weekly' },
];

export default function WeekReviewPage() {
  const [selectedId,  setSelectedId]  = useState(null);
  const [statusTab,   setStatusTab]   = useState('pending');
  const [courseTab,   setCourseTab]   = useState('zero2code');

  const { data: pending = [], isLoading: pendingLoading } = useQuery({
    queryKey: ['week-reviews', 'pending'],
    queryFn: weekReviewService.listPending,
    enabled: statusTab === 'pending',
    refetchInterval: 10_000,
  });

  const { data: all = [], isLoading: allLoading } = useQuery({
    queryKey: ['week-reviews', 'all'],
    queryFn: weekReviewService.listAll,
    enabled: statusTab === 'all',
    refetchInterval: 10_000,
  });

  const activeReviewType = COURSE_TABS.find(t => t.key === courseTab)?.reviewType ?? 'screening';

  const rawList   = statusTab === 'pending' ? pending : all;
  const isLoading = statusTab === 'pending' ? pendingLoading : allLoading;

  const list = useMemo(
    () => rawList.filter(r => (r.student?.course?.reviewType ?? 'screening') === activeReviewType),
    [rawList, activeReviewType]
  );

  const pendingByType = useMemo(() => {
    const counts = {};
    COURSE_TABS.forEach(t => {
      counts[t.key] = pending.filter(r => (r.student?.course?.reviewType ?? 'screening') === t.reviewType).length;
    });
    return counts;
  }, [pending]);

  const totalPending = pending.length;

  const selectedReview = useMemo(() => rawList.find(r => r._id === selectedId) ?? null, [rawList, selectedId]);

  return (
    <div className="space-y-6 pb-8">

      {/* Header */}
      <div className="relative rounded-2xl overflow-hidden p-6 sm:p-8"
        style={{ background: 'linear-gradient(135deg, #CA6357 0%, #A94E43 100%)' }}>
        <div className="relative z-10 flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-white/15 flex items-center justify-center flex-shrink-0">
            <ClipboardCheck className="w-7 h-7 text-white" strokeWidth={1.8} />
          </div>
          <div>
            <p className="text-xs font-bold tracking-widest text-[#F2B3AC] uppercase mb-1">Task Reviews</p>
            <h2 className="text-2xl font-bold text-white mb-1">Week Task Sheet Reviews</h2>
            <p className="text-white/60 text-sm">
              {totalPending > 0
                ? `${totalPending} week${totalPending !== 1 ? 's' : ''} with pending day submissions`
                : 'All caught up'}
            </p>
          </div>
        </div>
      </div>

      {/* Course tabs */}
      <div className="flex gap-1 bg-white rounded-2xl p-1.5" style={{ boxShadow: '0 2px 16px rgba(0,0,0,0.05)' }}>
        {COURSE_TABS.map(({ key, label }) => {
          const count  = pendingByType[key] ?? 0;
          const active = courseTab === key;
          return (
            <button key={key} onClick={() => { setCourseTab(key); setSelectedId(null); }}
              className={`inline-flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-semibold transition-colors ${active ? 'bg-[#CA6357] text-white' : 'text-[#475569] hover:bg-[#F8F9FB]'}`}>
              {label}
              {count > 0 && (
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${active ? 'bg-white/25 text-white' : 'bg-[#FDEFEE] text-[#C76D64]'}`}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Status tabs */}
      <div className="flex gap-1 bg-white rounded-2xl p-1.5" style={{ boxShadow: '0 2px 16px rgba(0,0,0,0.05)' }}>
        <button onClick={() => setStatusTab('pending')}
          className={`inline-flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-semibold transition-colors ${statusTab === 'pending' ? 'bg-[#F1F5F9] text-[#1E293B]' : 'text-[#475569] hover:bg-[#F8F9FB]'}`}>
          Pending
          {(pendingByType[courseTab] ?? 0) > 0 && (
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-[#FDEFEE] text-[#C76D64]">
              {pendingByType[courseTab]}
            </span>
          )}
        </button>
        <button onClick={() => setStatusTab('all')}
          className={`px-5 py-2 rounded-xl text-sm font-semibold transition-colors ${statusTab === 'all' ? 'bg-[#F1F5F9] text-[#1E293B]' : 'text-[#475569] hover:bg-[#F8F9FB]'}`}>
          All Reviews
        </button>
      </div>

      {/* List */}
      <div className="bg-white rounded-2xl overflow-hidden" style={{ boxShadow: '0 2px 16px rgba(0,0,0,0.05)' }}>
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-6 h-6 text-[#CA6357] animate-spin" />
          </div>
        ) : list.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <ClipboardCheck className="w-10 h-10 text-[#BBF7D0]" strokeWidth={1.5} />
            <p className="text-base font-bold text-[#1E293B]">
              {statusTab === 'pending' ? 'All caught up!' : 'No reviews yet'}
            </p>
            <p className="text-sm text-[#94A3B8]">
              {statusTab === 'pending' ? 'No pending submissions for this course.' : 'Reviews will appear here once students submit.'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-[#F8F9FB]">
            {list.map((review) => {
              const student      = review.student?.user ?? {};
              const days         = review.days ?? [];
              const pendingDays  = days.filter(d => d.status === 'submitted').length;
              const approvedDays = days.filter(d => d.status === 'approved').length;
              const cfg          = WEEK_STATUS_CFG[review.status] ?? WEEK_STATUS_CFG.in_progress;
              const folderUrl    = review.student?.taskSheetUrl ?? null;

              return (
                <div key={review._id} className="flex items-center gap-4 px-6 py-4 hover:bg-[#FAFAFA] transition-colors">
                  <div className="w-10 h-10 rounded-full bg-[#FDEFEE] text-[#CA6357] font-bold text-sm flex items-center justify-center flex-shrink-0">
                    {(student.name ?? '?').split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-semibold text-[#1E293B]">{student.name ?? '—'}</p>
                      <span className="text-xs font-bold text-[#7C6AF2] bg-[#F2EEFD] px-2 py-0.5 rounded-full">
                        Week {review.week}
                      </span>
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full"
                        style={{ backgroundColor: cfg.bg, color: cfg.color }}>
                        {cfg.label}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                      <span className="text-xs text-[#94A3B8]">{approvedDays} days approved</span>
                      {pendingDays > 0 && (
                        <span className="text-xs text-[#F59E0B] font-medium">{pendingDays} pending</span>
                      )}
                      <span className="inline-flex items-center gap-1 text-xs text-[#94A3B8]">
                        <Calendar className="w-3 h-3" />
                        {new Date(review.updatedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {folderUrl && (
                      <a href={folderUrl} target="_blank" rel="noopener noreferrer"
                        className="p-1.5 rounded-lg bg-[#F8F9FB] hover:bg-[#FDEFEE] text-[#94A3B8] hover:text-[#CA6357] transition-colors">
                        <FolderOpen className="w-4 h-4" />
                      </a>
                    )}
                    <button onClick={() => setSelectedId(review._id)}
                      className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-xl transition-colors ${
                        pendingDays > 0
                          ? 'bg-[#CA6357] hover:bg-[#b85548] text-white'
                          : 'text-[#94A3B8] hover:text-[#475569] hover:bg-[#F8F9FB]'
                      }`}>
                      <ClipboardCheck className="w-3.5 h-3.5" />
                      {pendingDays > 0 ? 'Review' : 'View'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {selectedReview && <ReviewModal review={selectedReview} onClose={() => setSelectedId(null)} />}
    </div>
  );
}
