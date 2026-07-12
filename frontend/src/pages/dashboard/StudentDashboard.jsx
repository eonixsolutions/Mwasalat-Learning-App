import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  BookOpen, Calendar, CheckCircle2, ChevronRight,
  Send, RotateCcw, Star, Circle,
  BookMarked, Loader2, Trophy, AlertCircle, PartyPopper,
  IndianRupee, Flame, Lock, Zap, Target, ArrowRight, GraduationCap,
  TrendingUp, PieChart,
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth.js';
import { courseService } from '../../services/course.service.js';
import { weekReviewService } from '../../services/weekreview.service.js';
import { reviewService } from '../../services/review.service.js';
import { attendanceService } from '../../services/attendance.service.js';
import { QK } from '../../constants/queryKeys.js';

/* ─── helpers ──────────────────────────────────────────────────── */

const DAY_STYLE = {
  approved:              { label: 'Approved',        color: '#22A66E', bg: '#E8F8F2', icon: CheckCircle2 },
  submitted:             { label: 'In Review',       color: '#F59E0B', bg: '#FFFBEB', icon: RotateCcw },
  corrections_requested: { label: 'Needs Fix',       color: '#D96C5F', bg: '#FEE2E2', icon: AlertCircle },
  not_submitted:         { label: 'Not Submitted',   color: '#94A3B8', bg: '#F1F5F9', icon: Circle },
  revision:              { label: 'Revision Day',    color: '#CA6357', bg: '#FDEFEE', icon: BookMarked },
};

function buildDaySlots(weekReview) {
  if (!weekReview) return [{ day: 1, status: 'not_submitted' }];
  const sorted = [...weekReview.days].sort((a, b) => a.day - b.day);
  if (weekReview.status === 'approved') {
    return sorted.map(d => ({ day: d.day, status: d.status, mentorNote: d.mentorNote }));
  }
  const maxSubmitted = sorted.length > 0 ? Math.max(...sorted.map(d => d.day)) : 0;
  const slots = sorted.map(d => ({ day: d.day, status: d.status, mentorNote: d.mentorNote }));
  if (maxSubmitted < 6) slots.push({ day: maxSubmitted + 1, status: 'not_submitted' });
  return slots;
}

/* ─── ScreeningJourneyBar ──────────────────────────────────────── */
// Shows the Zero2Code two-part journey: Weeks 1-3 → Screening 1 → Week 4 → Screening 2 → Done
function ScreeningJourneyBar({ screenings, weekReviews, allReviews, currentWeek, durationWeeks, isCompleted }) {
  // Sort screenings by afterWeek
  const sorted = [...(screenings ?? [])].sort((a, b) => a.afterWeek - b.afterWeek);

  // Build segments: [weeks before screening1, screening1, weeks before screening2, screening2, remaining]
  const segments = [];
  let weekCursor = 1;

  for (const sc of sorted) {
    // Weeks up to this screening
    const weeksInSegment = Array.from({ length: sc.afterWeek - weekCursor + 1 }, (_, i) => weekCursor + i);
    segments.push({ type: 'weeks', weeks: weeksInSegment });
    weekCursor = sc.afterWeek + 1;

    // The screening itself
    const matchedReview = allReviews.find(r => r.reviewType === 'screening' && r.part === sc.part);
    segments.push({ type: 'screening', part: sc.part, afterWeek: sc.afterWeek, review: matchedReview ?? null });
  }
  // Any remaining weeks after last screening
  if (weekCursor <= durationWeeks) {
    segments.push({ type: 'weeks', weeks: Array.from({ length: durationWeeks - weekCursor + 1 }, (_, i) => weekCursor + i) });
  }

  const getWeekState = (w) => {
    const wr = weekReviews.find(r => r.week === w);
    if (!wr) return w < currentWeek ? 'unlocked' : w === currentWeek ? 'current' : 'locked';
    if (wr.status === 'approved') return 'done';
    if (wr.status === 'corrections_requested') return 'needs_fix';
    return 'in_progress';
  };

  const getScreeningState = (sc) => {
    if (!sc.review) return 'pending';
    if (sc.review.status === 'completed') return sc.review.result === 'pass' ? 'passed' : 'failed';
    if (sc.review.status === 'slot_booked') return 'booked';
    return 'awaiting';
  };

  return (
    <div className="bg-white rounded-2xl p-5" style={{ boxShadow: '0 2px 16px rgba(0,0,0,0.05)' }}>
      <p className="text-xs font-bold text-[#94A3B8] uppercase tracking-wider mb-4">Your Journey</p>
      <div className="flex items-center gap-1.5 flex-wrap">
        {segments.map((seg, si) => {
          if (seg.type === 'weeks') {
            return seg.weeks.map((w) => {
              const state = getWeekState(w);
              const colors = {
                done:        { bg: '#22A66E', text: 'white' },
                current:     { bg: '#CA6357', text: 'white' },
                in_progress: { bg: '#A94E43', text: 'white' },
                needs_fix:   { bg: '#D96C5F', text: 'white' },
                unlocked:    { bg: '#FDEFEE', text: '#CA6357' },
                locked:      { bg: '#F1F5F9', text: '#94A3B8' },
              }[state] ?? { bg: '#F1F5F9', text: '#94A3B8' };
              return (
                <div key={`w${w}`} className="flex flex-col items-center gap-1">
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center text-xs font-bold transition-all"
                    style={{ background: colors.bg, color: colors.text }}
                    title={`Week ${w}`}
                  >
                    {state === 'done' ? <CheckCircle2 className="w-4 h-4" /> : state === 'locked' ? <Lock className="w-3.5 h-3.5" /> : `W${w}`}
                  </div>
                  <span className="text-[9px] font-semibold" style={{ color: colors.text === 'white' ? colors.bg : colors.text }}>
                    {state === 'done' ? '✓' : state === 'current' ? 'Now' : ''}
                  </span>
                </div>
              );
            });
          }
          // screening node
          const state = getScreeningState(seg);
          const sc = seg;
          const nodeColors = {
            passed:   { bg: '#22A66E', text: 'white', label: 'Passed' },
            failed:   { bg: '#D96C5F', text: 'white', label: 'Failed' },
            booked:   { bg: '#CA6357', text: 'white', label: 'Booked' },
            awaiting: { bg: '#F59E0B', text: 'white', label: 'Book Now' },
            pending:  { bg: '#F1F5F9', text: '#94A3B8', label: 'Test' },
          }[state];
          return (
            <div key={`sc${sc.part}`} className="flex flex-col items-center gap-1">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center transition-all"
                style={{ background: nodeColors.bg, color: nodeColors.text, border: state === 'awaiting' ? '2px solid #D97706' : 'none' }}
                title={`Part ${sc.part} Screening`}
              >
                <Star className="w-4 h-4" />
              </div>
              <span className="text-[9px] font-bold" style={{ color: nodeColors.bg === '#F1F5F9' ? '#94A3B8' : nodeColors.bg }}>
                P{sc.part} Test
              </span>
            </div>
          );
        })}

        {/* Completion node */}
        <div className="flex flex-col items-center gap-1">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background: isCompleted ? '#22A66E' : '#F1F5F9', color: isCompleted ? 'white' : '#94A3B8' }}
            title="Course Complete"
          >
            {isCompleted ? <Trophy className="w-4 h-4" /> : <Trophy className="w-3.5 h-3.5" />}
          </div>
          <span className="text-[9px] font-bold" style={{ color: isCompleted ? '#22A66E' : '#94A3B8' }}>Done</span>
        </div>
      </div>
    </div>
  );
}

/* ─── WeekCard ─────────────────────────────────────────────────── */
function WeekCard({ weekNum, weekReview, isCurrent, isLocked, isCompleted }) {
  const isApproved = weekReview?.status === 'approved';
  const hasCorrections = weekReview?.days?.some(d => d.status === 'corrections_requested');
  const inProgress = weekReview && !isApproved;

  const daySlots = useMemo(() => buildDaySlots(weekReview), [weekReview]);
  const approvedDays = weekReview?.days?.filter(d => d.status === 'approved').length ?? 0;
  const totalDays = weekReview?.days?.length ?? 0;
  const weekPct = totalDays > 0 ? Math.round((approvedDays / totalDays) * 100) : (isApproved ? 100 : 0);

  let borderColor = '#E2E8F0';
  let headerBg = '#F8F9FB';
  let badgeText = 'Locked';
  let badgeBg = '#F1F5F9';
  let badgeColor = '#94A3B8';

  if (isApproved)       { borderColor = '#F2B3AC'; headerBg = '#FDEFEE'; badgeText = 'Complete'; badgeBg = '#E8F8F2'; badgeColor = '#22A66E'; }
  else if (hasCorrections) { borderColor = '#F2B3AC'; headerBg = '#FBE9E7'; badgeText = 'Needs Fix'; badgeBg = '#FEE2E2'; badgeColor = '#D96C5F'; }
  else if (isCurrent)   { borderColor = '#F2B3AC'; headerBg = '#FDEFEE'; badgeText = inProgress ? 'In Progress' : 'Current'; badgeBg = '#FDEFEE'; badgeColor = '#CA6357'; }
  else if (!isLocked)   { borderColor = '#E2E8F0'; headerBg = '#F8F9FB'; badgeText = 'Unlocked'; badgeBg = '#F8F9FB'; badgeColor = '#475569'; }

  return (
    <div className="bg-white rounded-2xl overflow-hidden" style={{ border: `1.5px solid ${borderColor}`, boxShadow: '0 1px 8px rgba(0,0,0,0.04)' }}>
      <div className="flex items-center justify-between px-4 py-3" style={{ background: headerBg }}>
        <div className="flex items-center gap-2">
          {isLocked
            ? <Lock className="w-3.5 h-3.5 text-[#94A3B8]" />
            : isApproved
              ? <CheckCircle2 className="w-3.5 h-3.5" style={{ color: '#22A66E' }} />
              : <BookOpen className="w-3.5 h-3.5" style={{ color: '#CA6357' }} />}
          <span className="text-sm font-bold text-[#1E293B]">Week {weekNum}</span>
        </div>
        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: badgeBg, color: badgeColor }}>
          {badgeText}
        </span>
      </div>

      {isLocked ? (
        <div className="px-4 py-5 flex flex-col items-center justify-center gap-1.5 text-center">
          <Lock className="w-5 h-5 text-[#CBD5E1]" />
          <p className="text-xs text-[#94A3B8]">Complete previous weeks to unlock</p>
        </div>
      ) : (
        <div className="px-4 py-3 space-y-1.5">
          {daySlots.map(({ day, status, mentorNote }) => {
            const ss = DAY_STYLE[status] ?? DAY_STYLE.not_submitted;
            return (
              <div key={day} className="flex items-center gap-2.5">
                <div className="w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: ss.bg }}>
                  <ss.icon className="w-3 h-3" style={{ color: ss.color }} />
                </div>
                <span className="text-xs text-[#475569] flex-1">Day {day}</span>
                {mentorNote && (
                  <span className="text-[10px] text-[#D96C5F] truncate max-w-[80px]" title={mentorNote}>{mentorNote}</span>
                )}
                <span className="text-[10px] font-semibold flex-shrink-0" style={{ color: ss.color }}>{ss.label}</span>
              </div>
            );
          })}
          {isApproved && (
            <div className="mt-2 pt-2 border-t border-[#F1F5F9] flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-[#22A66E]" />
              <span className="text-xs font-semibold text-[#22A66E]">{totalDays} days approved</span>
            </div>
          )}

          <div className="mt-3 pt-3 border-t border-[#F1F5F9]">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] font-semibold text-[#94A3B8]">{weekPct}% Complete</span>
            </div>
            <div className="h-1.5 bg-[#F1F5F9] rounded-full overflow-hidden mb-3">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{ width: `${weekPct}%`, background: isApproved ? '#22A66E' : '#CA6357' }}
              />
            </div>
            <Link
              to={`/student/task-sheets/week/${weekNum}`}
              className="flex items-center justify-center gap-1.5 w-full bg-[#CA6357] hover:bg-[#b85548] text-white text-xs font-bold py-2 rounded-xl transition-colors"
            >
              {isApproved ? 'Review' : 'Continue'} <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── ScreeningCard ────────────────────────────────────────────── */
function ScreeningCard({ part, afterWeek, review, isPending }) {
  const state = !review ? 'locked'
    : review.status === 'completed' ? (review.result === 'pass' ? 'passed' : 'failed')
    : review.status === 'slot_booked' ? 'booked'
    : 'awaiting';

  const configs = {
    locked:   { bg: '#F8F9FB', border: '#E2E8F0', icon: Lock,        iconColor: '#94A3B8', iconBg: '#F1F5F9', title: `Part ${part} Screening`, sub: `Triggered after Week ${afterWeek}`, badge: 'Upcoming', badgeBg: '#F1F5F9', badgeColor: '#94A3B8' },
    awaiting: { bg: '#FFFEF0', border: '#FCD34D', icon: Star,         iconColor: '#D97706', iconBg: '#FFFBEB', title: `Part ${part} Screening`, sub: 'Book a slot with your mentor', badge: 'Book Now', badgeBg: '#FFFBEB', badgeColor: '#D97706' },
    booked:   { bg: '#F0FAF7', border: '#F2B3AC', icon: Calendar,     iconColor: '#CA6357', iconBg: '#FDEFEE', title: `Part ${part} Screening`, sub: review?.slot ? `Scheduled` : 'Slot confirmed', badge: 'Booked', badgeBg: '#FDEFEE', badgeColor: '#CA6357' },
    passed:   { bg: '#F0FAF5', border: '#86EFAC', icon: Trophy,       iconColor: '#22A66E', iconBg: '#E8F8F2', title: `Part ${part} Passed`, sub: review?.marks != null ? `Score: ${review.marks}` : 'Cleared', badge: 'Passed', badgeBg: '#E8F8F2', badgeColor: '#22A66E' },
    failed:   { bg: '#FFF5F5', border: '#F2B3AC', icon: AlertCircle,  iconColor: '#D96C5F', iconBg: '#FBE9E7', title: `Part ${part} Not Cleared`, sub: 'Retry when available', badge: 'Retry', badgeBg: '#FBE9E7', badgeColor: '#D96C5F' },
  };
  const c = configs[state];
  const Ico = c.icon;

  return (
    <div className="rounded-2xl p-4" style={{ background: c.bg, border: `1.5px solid ${c.border}` }}>
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: c.iconBg }}>
          <Ico className="w-4 h-4" style={{ color: c.iconColor }} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 mb-0.5">
            <p className="text-sm font-bold text-[#1E293B]">{c.title}</p>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0" style={{ background: c.badgeBg, color: c.badgeColor }}>{c.badge}</span>
          </div>
          <p className="text-xs text-[#475569]">{c.sub}</p>
          {review?.pendingTopics?.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1">
              {review.pendingTopics.map(t => (
                <span key={t} className="text-[10px] bg-[#FEE2E2] text-[#D96C5F] px-2 py-0.5 rounded-full font-medium">{t}</span>
              ))}
            </div>
          )}
        </div>
      </div>
      {state === 'awaiting' && (
        <Link to="/student/screening" className="mt-3 flex items-center justify-center gap-1.5 w-full bg-[#CA6357] hover:bg-[#b85548] text-white text-xs font-bold py-2 rounded-xl transition-colors">
          Book Slot <ChevronRight className="w-3.5 h-3.5" />
        </Link>
      )}
      {state === 'booked' && review?.slot && (
        <div className="mt-2 text-xs text-[#CA6357] font-semibold text-center">
          {new Date(review.slot.scheduledAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
        </div>
      )}
    </div>
  );
}

/* ─── WeeklyProgressChart ──────────────────────────────────────── */
function WeeklyProgressChart({ weekReviews, resolvedDuration }) {
  const weeksCount = resolvedDuration > 0 ? resolvedDuration : weekReviews.length;

  const points = useMemo(() => Array.from({ length: weeksCount }, (_, i) => {
    const week = i + 1;
    const wr = weekReviews.find(r => r.week === week);
    const total = wr?.days?.length ?? 0;
    const approved = wr?.days?.filter(d => d.status === 'approved').length ?? 0;
    return { week, pct: total > 0 ? Math.round((approved / total) * 100) : 0 };
  }), [weekReviews, weeksCount]);

  const CW = 300, CH = 110;
  const maxIdx = Math.max(points.length - 1, 1);
  const coords = points.map((p, i) => ({
    ...p,
    x: (i / maxIdx) * CW,
    y: CH - (p.pct / 100) * CH,
  }));
  const linePath = coords.map((c, i) => `${i === 0 ? 'M' : 'L'} ${c.x.toFixed(1)},${c.y.toFixed(1)}`).join(' ');
  const areaPath = coords.length ? `${linePath} L ${coords[coords.length - 1].x.toFixed(1)},${CH} L 0,${CH} Z` : '';
  const peak = coords.length ? coords.reduce((a, b) => (b.pct >= a.pct ? b : a), coords[0]) : null;
  const dotR = points.length > 12 ? 2 : 3;

  // Cap visible x-axis labels so long courses (e.g. 29 weeks) don't collide
  const maxLabels = 8;
  const labelStep = Math.max(1, Math.ceil(points.length / maxLabels));
  const labelWeeks = points.filter((p, i) => i % labelStep === 0 || i === points.length - 1);

  return (
    <div className="bg-white rounded-2xl p-5 h-full" style={{ boxShadow: '0 2px 16px rgba(0,0,0,0.05)' }}>
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-xs font-bold text-[#94A3B8] uppercase tracking-wider mb-0.5">Overview</p>
          <h3 className="text-base font-bold text-[#1E293B]">Learning Progress</h3>
        </div>
        <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: '#F2EEFD' }}>
          <TrendingUp className="w-4 h-4" style={{ color: '#7C6AF2' }} />
        </div>
      </div>

      {weeksCount === 0 ? (
        <div className="flex flex-col items-center justify-center text-center py-10">
          <TrendingUp className="w-8 h-8 text-[#CBD5E1] mb-2" strokeWidth={1.5} />
          <p className="text-sm text-[#94A3B8]">No weekly data yet</p>
        </div>
      ) : (
        <div className="flex gap-2">
          <div className="flex flex-col justify-between h-36 pb-3 flex-shrink-0">
            {[100, 75, 50, 25, 0].map((v) => (
              <span key={v} className="text-[10px] font-semibold text-[#94A3B8] leading-none">{v}%</span>
            ))}
          </div>
          <div className="relative flex-1 min-w-0">
            <svg viewBox={`-18 -20 ${CW + 36} ${CH + 24}`} className="w-full h-36" preserveAspectRatio="none">
              <defs>
                <linearGradient id="progressFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#7C6AF2" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="#7C6AF2" stopOpacity="0" />
                </linearGradient>
              </defs>
              {[0, 25, 50, 75, 100].map((v) => (
                <line
                  key={v}
                  x1="-18" x2={CW + 18} y1={CH - (v / 100) * CH} y2={CH - (v / 100) * CH}
                  stroke="#F1F5F9" strokeWidth="1" strokeDasharray="3 3"
                />
              ))}
              {areaPath && <path d={areaPath} fill="url(#progressFill)" stroke="none" />}
              <path d={linePath} fill="none" stroke="#7C6AF2" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              {coords.map((c) => (
                <circle key={c.week} cx={c.x} cy={c.y} r={dotR} fill="white" stroke="#7C6AF2" strokeWidth="2" />
              ))}
              {peak && peak.pct > 0 && (
                <g transform={`translate(${peak.x}, ${peak.y})`}>
                  <rect x="-15" y="-24" width="30" height="16" rx="6" fill="#7C6AF2" />
                  <text x="0" y="-12" textAnchor="middle" fontSize="9" fontWeight="700" fill="white">{peak.pct}%</text>
                </g>
              )}
            </svg>
            <div className="relative h-3 px-1">
              {labelWeeks.map((p) => (
                <span
                  key={p.week}
                  className="absolute top-0 text-[10px] font-semibold text-[#94A3B8] -translate-x-1/2 whitespace-nowrap"
                  style={{ left: `${maxIdx > 0 ? ((p.week - 1) / maxIdx) * 100 : 0}%` }}
                >
                  W{p.week}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── CourseProgressDonut ──────────────────────────────────────── */
function CourseProgressDonut({ weekReviews, resolvedDuration, isCompleted }) {
  const total = resolvedDuration > 0 ? resolvedDuration : weekReviews.length;
  const completed = isCompleted ? total : weekReviews.filter(wr => wr.status === 'approved').length;
  const inProgress = isCompleted ? 0 : weekReviews.filter(wr => wr.status !== 'approved' && (wr.days?.length ?? 0) > 0).length;
  const notStarted = Math.max(0, total - completed - inProgress);

  const pctOf = (n) => (total > 0 ? Math.round((n / total) * 100) : 0);
  const segments = [
    { label: 'Completed', pct: pctOf(completed), color: '#22A66E' },
    { label: 'In Progress', pct: pctOf(inProgress), color: '#F59E0B' },
    { label: 'Not Started', pct: pctOf(notStarted), color: '#E2E8F0' },
  ];

  const R = 46, C = 2 * Math.PI * R;
  let cumulative = 0;
  const arcs = segments.map(seg => {
    const dash = (seg.pct / 100) * C;
    const arc = { ...seg, dasharray: `${dash} ${C - dash}`, dashoffset: -((cumulative / 100) * C) };
    cumulative += seg.pct;
    return arc;
  });

  const overallPct = total > 0 ? Math.round((completed / total) * 100) : 0;

  return (
    <div className="bg-white rounded-2xl p-5 h-full flex flex-col" style={{ boxShadow: '0 2px 16px rgba(0,0,0,0.05)' }}>
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-xs font-bold text-[#94A3B8] uppercase tracking-wider mb-0.5">Overview</p>
          <h3 className="text-base font-bold text-[#1E293B]">Course Progress</h3>
        </div>
        <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: '#FDEFEE' }}>
          <PieChart className="w-4 h-4" style={{ color: '#CA6357' }} />
        </div>
      </div>

      {total === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center py-10">
          <PieChart className="w-8 h-8 text-[#CBD5E1] mb-2" strokeWidth={1.5} />
          <p className="text-sm text-[#94A3B8]">No course data yet</p>
        </div>
      ) : (
        <>
          <div className="flex items-center gap-6">
            <div className="relative w-28 h-28 flex-shrink-0">
              <svg className="w-28 h-28 -rotate-90" viewBox="0 0 120 120">
                <circle cx="60" cy="60" r={R} fill="none" stroke="#F1F5F9" strokeWidth="12" />
                {arcs.map(a => a.pct > 0 && (
                  <circle
                    key={a.label}
                    cx="60" cy="60" r={R} fill="none"
                    stroke={a.color} strokeWidth="12" strokeLinecap="round"
                    strokeDasharray={a.dasharray}
                    strokeDashoffset={a.dashoffset}
                  />
                ))}
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-xl font-bold text-[#1E293B]">{overallPct}%</span>
                <span className="text-[10px] text-[#94A3B8]">Completed</span>
              </div>
            </div>

            <div className="flex-1 space-y-2.5">
              {segments.map(seg => (
                <div key={seg.label} className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: seg.color }} />
                    <span className="text-xs text-[#475569] truncate">{seg.label}</span>
                  </div>
                  <span className="text-xs font-bold text-[#1E293B] flex-shrink-0">{seg.pct}%</span>
                </div>
              ))}
            </div>
          </div>

          <Link
            to="/student/task-sheets"
            className="mt-4 flex items-center justify-center gap-1.5 w-full text-xs font-semibold text-[#CA6357] hover:text-[#A94E43] py-2 rounded-xl border border-[#FDEFEE] hover:bg-[#F4FBFB] transition-colors"
          >
            View All Weeks <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </>
      )}
    </div>
  );
}

/* ─── TodaysAction ─────────────────────────────────────────────── */
function TodaysAction({ currentWeek, currentWeekReview, pendingScreening, isCompleted, isWeekFeeLocked }) {
  if (isWeekFeeLocked) {
    return (
      <div className="bg-white rounded-2xl p-6" style={{ boxShadow: '0 2px 16px rgba(0,0,0,0.05)', border: '1.5px solid #F2B3AC' }}>
        <p className="text-xs font-bold tracking-widest text-[#D96C5F] uppercase mb-1">Fee Required</p>
        <h3 className="text-base font-bold text-[#1E293B] mb-3">Access Locked</h3>
        <p className="text-sm text-[#475569] mb-4">Pay your fee installment to unlock Week {currentWeek} and continue your tasks.</p>
        <Link to="/student/fees" className="inline-flex items-center gap-2 bg-[#CA6357] hover:bg-[#b85548] text-white font-semibold px-5 py-2.5 rounded-xl transition-colors text-sm">
          <IndianRupee className="w-4 h-4" /> Go to Fees
        </Link>
      </div>
    );
  }

  if (pendingScreening) {
    const isBooked = pendingScreening.status === 'slot_booked';
    return (
      <div className="bg-white rounded-2xl p-6" style={{ boxShadow: '0 2px 16px rgba(0,0,0,0.05)', border: '1.5px solid #FCD34D' }}>
        <p className="text-xs font-bold tracking-widest text-[#D97706] uppercase mb-1">Action Required</p>
        <h3 className="text-base font-bold text-[#1E293B] mb-3">
          {isBooked ? `Part ${pendingScreening.part} Test Booked` : `Book Your Part ${pendingScreening.part} Test`}
        </h3>
        {isBooked ? (
          <div className="bg-[#FDEFEE] rounded-xl p-4 flex items-start gap-3">
            <Calendar className="w-4 h-4 text-[#CA6357] flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-[#1E293B]">Slot confirmed</p>
              {pendingScreening.slot && (
                <p className="text-xs text-[#475569] mt-0.5">
                  {new Date(pendingScreening.slot.scheduledAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
                </p>
              )}
            </div>
          </div>
        ) : (
          <>
            <div className="bg-[#FFFBEB] rounded-xl p-4 mb-4 flex items-start gap-3">
              <Zap className="w-4 h-4 text-[#D97706] flex-shrink-0 mt-0.5" />
              <p className="text-sm text-[#475569]">All tasks for this part are approved. Pick a slot to take your screening test.</p>
            </div>
            <Link to="/student/screening" className="inline-flex items-center gap-2 bg-[#CA6357] hover:bg-[#b85548] text-white font-semibold px-5 py-2.5 rounded-xl transition-colors text-sm">
              Book a Slot <ChevronRight className="w-4 h-4" />
            </Link>
          </>
        )}
      </div>
    );
  }

  if (isCompleted) {
    return (
      <div className="bg-white rounded-2xl p-6 text-center" style={{ boxShadow: '0 2px 16px rgba(0,0,0,0.05)', border: '1.5px solid #86EFAC' }}>
        <PartyPopper className="w-10 h-10 text-[#F59E0B] mx-auto mb-3" />
        <p className="text-base font-bold text-[#1E293B]">Course Completed!</p>
        <p className="text-sm text-[#94A3B8] mt-1 mb-4">You've finished the program. Go to My Courses to enroll in a new one.</p>
        <Link
          to="/student/courses"
          className="inline-flex items-center gap-2 bg-[#CA6357] hover:bg-[#b85548] text-white font-semibold px-5 py-2.5 rounded-xl transition-colors text-sm"
        >
          <GraduationCap className="w-4 h-4" /> View My Courses
        </Link>
      </div>
    );
  }

  if (!currentWeekReview) {
    return (
      <div className="bg-white rounded-2xl p-6" style={{ boxShadow: '0 2px 16px rgba(0,0,0,0.05)' }}>
        <p className="text-xs font-bold tracking-widest text-[#CA6357] uppercase mb-1">Week {currentWeek}</p>
        <h3 className="text-base font-bold text-[#1E293B] mb-3">Start Day 1</h3>
        <div className="bg-[#FDEFEE] rounded-xl p-4 mb-4">
          <p className="text-sm text-[#475569]">Open your task sheet and complete Day 1, then come back to submit it.</p>
        </div>
        <Link to="/student/task-sheets" className="inline-flex items-center gap-2 bg-[#CA6357] hover:bg-[#b85548] text-white font-semibold px-5 py-2.5 rounded-xl transition-colors text-sm">
          <BookOpen className="w-4 h-4" /> Open Task Sheet
        </Link>
      </div>
    );
  }

  const needsCorrection = currentWeekReview.days.find(d => d.status === 'corrections_requested');
  const pendingApproval = currentWeekReview.days.find(d => d.status === 'submitted');
  const isWeekDone = currentWeekReview.status === 'approved';

  if (needsCorrection) {
    return (
      <div className="bg-white rounded-2xl p-6" style={{ boxShadow: '0 2px 16px rgba(0,0,0,0.05)', border: '1.5px solid #F2B3AC' }}>
        <p className="text-xs font-bold tracking-widest text-[#D96C5F] uppercase mb-1">Correction Needed</p>
        <h3 className="text-base font-bold text-[#1E293B] mb-3">Week {currentWeek} · Day {needsCorrection.day}</h3>
        <div className="bg-[#FEE2E2] rounded-xl p-4 mb-4">
          <p className="text-sm font-semibold text-[#1E293B]">Mentor requested corrections</p>
          {needsCorrection.mentorNote && <p className="text-sm text-[#475569] mt-1">{needsCorrection.mentorNote}</p>}
        </div>
        <Link to="/student/task-sheets" className="inline-flex items-center gap-2 bg-[#CA6357] hover:bg-[#b85548] text-white font-semibold px-5 py-2.5 rounded-xl transition-colors text-sm">
          <Send className="w-4 h-4" /> Fix & Resubmit
        </Link>
      </div>
    );
  }

  if (pendingApproval) {
    return (
      <div className="bg-white rounded-2xl p-6" style={{ boxShadow: '0 2px 16px rgba(0,0,0,0.05)' }}>
        <p className="text-xs font-bold tracking-widest text-[#F59E0B] uppercase mb-1">Awaiting Review</p>
        <h3 className="text-base font-bold text-[#1E293B] mb-3">Week {currentWeek} · Day {pendingApproval.day}</h3>
        <div className="bg-[#FFFBEB] rounded-xl p-4 flex items-center gap-2">
          <RotateCcw className="w-4 h-4 text-[#F59E0B] flex-shrink-0" />
          <p className="text-sm text-[#475569]">Day {pendingApproval.day} is under mentor review.</p>
        </div>
      </div>
    );
  }

  if (isWeekDone) {
    return (
      <div className="bg-white rounded-2xl p-6 text-center" style={{ boxShadow: '0 2px 16px rgba(0,0,0,0.05)', border: '1.5px solid #F2B3AC' }}>
        <Trophy className="w-10 h-10 text-[#F59E0B] mx-auto mb-3" />
        <p className="text-base font-bold text-[#1E293B]">Week {currentWeek} Complete!</p>
        <p className="text-sm text-[#94A3B8] mt-1">All days approved. Next week unlocking soon.</p>
      </div>
    );
  }

  const maxDay = currentWeekReview.days.length ? Math.max(...currentWeekReview.days.map(d => d.day)) : 0;
  const nextDay = maxDay + 1;

  return (
    <div className="bg-white rounded-2xl p-6" style={{ boxShadow: '0 2px 16px rgba(0,0,0,0.05)' }}>
      <p className="text-xs font-bold tracking-widest text-[#CA6357] uppercase mb-1">Week {currentWeek} · Day {nextDay}</p>
      <h3 className="text-base font-bold text-[#1E293B] mb-3">Complete today's task</h3>
      <div className="bg-[#FDEFEE] rounded-xl p-4 mb-4">
        <p className="text-sm text-[#475569]">Open your task sheet, complete Day {nextDay}, then submit from the Task Sheets page.</p>
      </div>
      <Link to="/student/task-sheets" className="inline-flex items-center gap-2 bg-[#CA6357] hover:bg-[#b85548] text-white font-semibold px-5 py-2.5 rounded-xl transition-colors text-sm">
        <BookOpen className="w-4 h-4" /> Open Task Sheet
      </Link>
    </div>
  );
}

/* ─── Main Dashboard ───────────────────────────────────────────── */
export default function StudentDashboard() {
  const { user } = useAuth();
  const firstName = user?.name?.split(' ')[0] ?? 'Student';

  const { data: enrollment, isLoading: loadingEnroll } = useQuery({
    queryKey: QK.ENROLLMENT,
    queryFn: courseService.getMyEnrollment,
  });

  const courseId = enrollment?.course?._id;
  const isZero2Code = enrollment?.course?.reviewType === 'screening';

  const { data: weekReviews = [], isLoading: loadingWeekReviews } = useQuery({
    queryKey: ['week-reviews', 'me'],
    queryFn: weekReviewService.getMyReviews,
    enabled: !!courseId,
  });

  const { data: allReviews = [] } = useQuery({
    queryKey: ['reviews', 'me'],
    queryFn: reviewService.getMyReviews,
    enabled: !!courseId,
  });

  const { data: attendanceData } = useQuery({
    queryKey: ['attendance', 'me'],
    queryFn: () => attendanceService.getMyAttendance(),
  });

  /* ── derived ─────────────────────────────────────────────────── */

  const currentWeek      = enrollment?.currentWeek ?? 1;
  const durationWeeks    = enrollment?.course?.durationWeeks ?? 0;
  const screenings       = enrollment?.course?.screenings ?? [];

  const allWeeksDone  = weekReviews.length > 0 && weekReviews.every(wr => wr.status === 'approved');
  // completed = all weeks approved AND server bumped past last week
  const resolvedDuration = durationWeeks > 0 ? durationWeeks : weekReviews.length;
  const isCompleted   = allWeeksDone && currentWeek > resolvedDuration;
  const displayWeek   = isCompleted ? resolvedDuration : currentWeek;

  const currentWeekReview = weekReviews.find(wr => wr.week === displayWeek) ?? null;

  // Count approved days
  const approvedCount = useMemo(
    () => weekReviews.reduce((s, wr) => s + wr.days.filter(d => d.status === 'approved').length, 0),
    [weekReviews]
  );
  const totalActualDays = weekReviews.reduce((s, wr) => s + wr.days.length, 0);

  const progressPct = totalActualDays > 0
    ? Math.min(100, Math.round((approvedCount / totalActualDays) * 100))
    : isCompleted ? 100 : 0;

  // Fee
  const feeAccount           = enrollment?.feeAccount ?? null;
  const accessValidUntilWeek = feeAccount ? (feeAccount.accessValidUntilWeek ?? 0) : Infinity;
  const isWeekFeeLocked      = !isCompleted && feeAccount && currentWeek > accessValidUntilWeek && currentWeek <= resolvedDuration;

  // Pending screening (for TodaysAction and banner) — include slot data
  const pendingScreening = allReviews.find(r => r.reviewType === 'screening' && r.status !== 'completed') ?? null;

  // Attendance
  const attStats = attendanceData?.stats;

  // Streak
  const currentStreak = enrollment?.currentStreak ?? 0;

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const programName = enrollment?.course?.name ?? '—';
  const startDate = enrollment?.enrollmentDate
    ? new Date(enrollment.enrollmentDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
    : '—';

  const isLoading = loadingEnroll || loadingWeekReviews;

  /* ── render ──────────────────────────────────────────────────── */
  return (
    <div className="space-y-5 pb-10">

      {/* ── Hero banner ─────────────────────────────────────────── */}
      <div className="relative rounded-2xl overflow-hidden p-6 sm:p-8" style={{ background: 'linear-gradient(135deg, #CA6357 0%, #A94E43 100%)' }}>
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <span className="inline-flex items-center gap-1.5 bg-white/15 text-white text-xs font-semibold px-3 py-1 rounded-full">
                <BookOpen className="w-3 h-3" /> {programName}
              </span>
              {isCompleted && (
                <span className="inline-flex items-center gap-1.5 bg-white/15 text-[#86EFAC] text-xs font-bold px-3 py-1 rounded-full">
                  <Trophy className="w-3 h-3" /> Completed
                </span>
              )}
              {pendingScreening && !isCompleted && (
                <span className="inline-flex items-center gap-1.5 bg-white/15 text-[#FCD34D] text-xs font-bold px-3 py-1 rounded-full">
                  <Star className="w-3 h-3" /> Part {pendingScreening.part} Test
                </span>
              )}
              {currentStreak > 0 && (
                <span className="inline-flex items-center gap-1.5 bg-white/15 text-[#FCD34D] text-xs font-bold px-3 py-1 rounded-full">
                  <Flame className="w-3 h-3" /> {currentStreak} day streak
                </span>
              )}
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white mb-1">{greeting}, {firstName}! <span className="inline-block">👋</span></h1>
            <p className="text-white/70 text-sm">
              {isCompleted ? 'You\'ve completed the program' : `Week ${displayWeek} of ${resolvedDuration || '—'}`}
              {' · '}Started {startDate}
            </p>
          </div>

          {/* Progress ring */}
          <div className="flex items-center gap-4 bg-white rounded-2xl px-5 py-4 flex-shrink-0 shadow-sm">
            <div className="relative w-14 h-14">
              <svg className="w-14 h-14 -rotate-90" viewBox="0 0 56 56">
                <circle cx="28" cy="28" r="22" fill="none" stroke="#F1F5F9" strokeWidth="4" />
                <circle
                  cx="28" cy="28" r="22" fill="none"
                  stroke={isCompleted ? '#22C55E' : '#CA6357'} strokeWidth="4" strokeLinecap="round"
                  strokeDasharray={`${2 * Math.PI * 22}`}
                  strokeDashoffset={`${2 * Math.PI * 22 * (1 - progressPct / 100)}`}
                />
              </svg>
              <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-[#1E293B]">{progressPct}%</span>
            </div>
            <div>
              <p className="text-[#94A3B8] text-xs mb-0.5">Days Approved</p>
              <p className="text-[#1E293B] font-bold text-sm">{approvedCount} of {totalActualDays || '—'}</p>
              <p className="text-[#CA6357] text-xs mt-0.5">{isCompleted ? 'All done!' : 'Keep going!'}</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Stats strip ─────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            label: 'Days Approved', value: isLoading ? '—' : String(approvedCount),
            sub: 'By mentor', icon: CheckCircle2, iconColor: '#22A66E', iconBg: '#E8F8F2', valueColor: '#22A66E',
          },
          {
            label: 'Current Week', value: isLoading ? '—' : isCompleted ? 'Done' : `Week ${displayWeek}`,
            sub: isCompleted ? 'Course complete' : `of ${resolvedDuration || '—'} weeks`,
            icon: BookOpen, iconColor: '#CA6357', iconBg: '#FDEFEE', valueColor: '#CA6357',
          },
          {
            label: 'Attendance', value: attStats ? `${attStats.percentage}%` : '—',
            sub: attStats?.total ? `${attStats.present + (attStats.late ?? 0)} of ${attStats.total}` : 'No records',
            icon: Calendar, iconColor: '#7C6AF2', iconBg: '#F2EEFD', valueColor: '#7C6AF2',
          },
          {
            label: currentStreak > 0 ? 'Day Streak' : 'Screening',
            value: currentStreak > 0 ? `${currentStreak}🔥` : (pendingScreening ? (pendingScreening.status === 'slot_booked' ? 'Booked' : 'Due') : '✓'),
            sub: currentStreak > 0 ? 'Consecutive days' : (pendingScreening ? `Part ${pendingScreening.part} test` : 'No pending tests'),
            icon: currentStreak > 0 ? Flame : Star,
            iconColor: currentStreak > 0 ? '#F59E0B' : (pendingScreening ? '#D97706' : '#22A66E'),
            iconBg: currentStreak > 0 ? '#FFFBEB' : (pendingScreening ? '#FFFBEB' : '#E8F8F2'),
            valueColor: currentStreak > 0 ? '#F59E0B' : (pendingScreening ? '#D97706' : '#22A66E'),
          },
        ].map(({ label, value, sub, icon: Icon, iconColor, iconBg, valueColor }) => (
          <div key={label} className="bg-white rounded-2xl p-5" style={{ boxShadow: '0 2px 16px rgba(0,0,0,0.05)' }}>
            <div className="flex items-start justify-between mb-3">
              <p className="text-xs text-[#94A3B8] font-medium">{label}</p>
              <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: iconBg }}>
                <Icon className="w-4 h-4" style={{ color: iconColor }} />
              </div>
            </div>
            <p className="text-xl font-bold" style={{ color: valueColor }}>{value}</p>
            <p className="text-xs text-[#94A3B8] mt-0.5">{sub}</p>
          </div>
        ))}
      </div>

      {/* ── Fee barrier banner ──────────────────────────────────── */}
      {isWeekFeeLocked && (
        <div className="bg-white rounded-2xl p-5 flex items-center gap-4" style={{ border: '1.5px solid #F2B3AC' }}>
          <div className="w-10 h-10 rounded-xl bg-[#FBE9E7] flex items-center justify-center flex-shrink-0">
            <IndianRupee className="w-5 h-5 text-[#D96C5F]" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-bold text-[#D96C5F] mb-0.5">Week access limited</p>
            <p className="text-sm text-[#475569]">
              {accessValidUntilWeek === 0
                ? 'No installment paid yet. Pay to unlock your task sheets.'
                : <>Fee covers up to <strong>Week {accessValidUntilWeek}</strong>. Pay next installment to continue.</>}
            </p>
          </div>
          <Link to="/student/fees" className="flex-shrink-0 inline-flex items-center gap-1.5 bg-[#CA6357] hover:bg-[#b85548] text-white text-xs font-bold px-3 py-2 rounded-xl transition-colors">
            <IndianRupee className="w-3.5 h-3.5" /> Pay
          </Link>
        </div>
      )}

      {/* ── Main grid ───────────────────────────────────────────── */}
      {isLoading ? (
        <div className="flex items-center justify-center h-40">
          <Loader2 className="w-5 h-5 text-[#CA6357] animate-spin" />
        </div>
      ) : !enrollment ? (
        <div className="bg-white rounded-2xl p-10 text-center" style={{ boxShadow: '0 2px 16px rgba(0,0,0,0.05)' }}>
          <BookOpen className="w-10 h-10 text-[#CBD5E1] mx-auto mb-3" strokeWidth={1.5} />
          <p className="text-base font-bold text-[#1E293B]">No course enrolled</p>
          <p className="text-sm text-[#94A3B8] mt-1">Contact your coordinator to get enrolled.</p>
        </div>
      ) : (
        <>
          {/* Journey bar — only for screening courses (Zero2Code) */}
          {isZero2Code && screenings.length > 0 && (
            <ScreeningJourneyBar
              screenings={screenings}
              weekReviews={weekReviews}
              allReviews={allReviews}
              currentWeek={currentWeek}
              durationWeeks={resolvedDuration}
              isCompleted={isCompleted}
            />
          )}

          {/* Learning progress chart + course progress donut */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <WeeklyProgressChart weekReviews={weekReviews} resolvedDuration={resolvedDuration} />
            <CourseProgressDonut weekReviews={weekReviews} resolvedDuration={resolvedDuration} isCompleted={isCompleted} />
          </div>

          {/* Today's action + current week detail */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <TodaysAction
              currentWeek={displayWeek}
              currentWeekReview={currentWeekReview}
              pendingScreening={pendingScreening}
              isCompleted={isCompleted}
              isWeekFeeLocked={isWeekFeeLocked}
            />

            {/* Current week day breakdown */}
            <div className="bg-white rounded-2xl p-5" style={{ boxShadow: '0 2px 16px rgba(0,0,0,0.05)' }}>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-xs font-bold text-[#94A3B8] uppercase tracking-wider mb-0.5">
                    {isCompleted ? 'Final Week' : 'This Week'}
                  </p>
                  <h3 className="text-base font-bold text-[#1E293B]">Week {displayWeek} Progress</h3>
                </div>
                {currentWeekReview && (
                  <span className="text-xs font-semibold text-[#CA6357] bg-[#FDEFEE] px-2.5 py-1 rounded-full">
                    {currentWeekReview.days.filter(d => d.status === 'approved').length} approved
                  </span>
                )}
              </div>

              {currentWeekReview ? (
                <>
                  <div className="h-1.5 bg-[#F1F5F9] rounded-full mb-4 overflow-hidden">
                    <div
                      className="h-full bg-[#CA6357] rounded-full transition-all duration-500"
                      style={{
                        width: currentWeekReview.status === 'approved'
                          ? '100%'
                          : currentWeekReview.days.length > 0
                            ? `${(currentWeekReview.days.filter(d => d.status === 'approved').length / currentWeekReview.days.length) * 100}%`
                            : '0%'
                      }}
                    />
                  </div>
                  <div className="space-y-2">
                    {buildDaySlots(currentWeekReview).map(({ day, status, mentorNote }) => {
                      const ss = DAY_STYLE[status] ?? DAY_STYLE.not_submitted;
                      return (
                        <div key={day} className="flex items-center gap-3">
                          <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: ss.bg }}>
                            <ss.icon className="w-3.5 h-3.5" style={{ color: ss.color }} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-[#1E293B]">Day {day}</p>
                            {mentorNote && <p className="text-xs text-[#D96C5F] truncate">{mentorNote}</p>}
                          </div>
                          <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full flex-shrink-0" style={{ background: ss.bg, color: ss.color }}>
                            {ss.label}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </>
              ) : (
                <div className="relative flex flex-col items-center justify-center py-6 gap-2 text-center">
                  <svg className="absolute inset-0 w-full h-full pointer-events-none" preserveAspectRatio="xMidYMid meet">
                    <circle cx="20%" cy="20%" r="3" fill="#7C6AF2" fillOpacity="0.3" />
                    <circle cx="82%" cy="30%" r="2.5" fill="#F59E0B" fillOpacity="0.35" />
                    <circle cx="75%" cy="80%" r="2" fill="#22C55E" fillOpacity="0.3" />
                    <circle cx="15%" cy="78%" r="2" fill="#CA6357" fillOpacity="0.3" />
                  </svg>
                  <div className="relative w-14 h-14 rounded-full flex items-center justify-center" style={{ background: '#F2EEFD' }}>
                    <Target className="w-7 h-7" style={{ color: '#7C6AF2' }} strokeWidth={1.5} />
                  </div>
                  <p className="relative text-sm text-[#94A3B8]">
                    {isCompleted ? 'All weeks complete!' : 'No submissions yet for this week.'}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* ── All weeks breakdown (Zero2Code) ───────────────────── */}
          {isZero2Code && resolvedDuration > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <p className="text-xs font-bold text-[#94A3B8] uppercase tracking-wider">Continue Learning</p>
                <div className="flex-1 h-px bg-[#F1F5F9]" />
                <Link to="/student/task-sheets" className="text-xs font-semibold text-[#CA6357] hover:text-[#A94E43] flex items-center gap-1 transition-colors">
                  View All <ArrowRight className="w-3 h-3" />
                </Link>
              </div>

              {/* Render weeks interleaved with screening cards */}
              {(() => {
                const sorted = [...screenings].sort((a, b) => a.afterWeek - b.afterWeek);
                const elements = [];
                let weekCursor = 1;

                // Build week grid blocks and screening rows
                const weekGrid = (fromWeek, toWeek, keyPrefix) => {
                  const weeks = Array.from({ length: toWeek - fromWeek + 1 }, (_, i) => fromWeek + i);
                  return (
                    <div key={keyPrefix} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 mb-3">
                      {weeks.map(w => {
                        const wr = weekReviews.find(r => r.week === w) ?? null;
                        const isCurrent = !isCompleted && w === currentWeek;
                        const isLocked = !isCompleted && w > currentWeek && !(wr);
                        return (
                          <WeekCard
                            key={w}
                            weekNum={w}
                            weekReview={wr}
                            isCurrent={isCurrent}
                            isLocked={isLocked}
                            isCompleted={isCompleted}
                          />
                        );
                      })}
                    </div>
                  );
                };

                for (const sc of sorted) {
                  if (weekCursor <= sc.afterWeek) {
                    elements.push(weekGrid(weekCursor, sc.afterWeek, `weeks-${weekCursor}`));
                    weekCursor = sc.afterWeek + 1;
                  }
                  const matchedReview = allReviews.find(r => r.reviewType === 'screening' && r.part === sc.part) ?? null;
                  elements.push(
                    <div key={`sc-${sc.part}`} className="mb-3">
                      <ScreeningCard
                        part={sc.part}
                        afterWeek={sc.afterWeek}
                        review={matchedReview}
                      />
                    </div>
                  );
                }

                // Remaining weeks after last screening
                if (weekCursor <= resolvedDuration) {
                  elements.push(weekGrid(weekCursor, resolvedDuration, `weeks-${weekCursor}`));
                }

                return elements;
              })()}
            </div>
          )}

          {/* Quick links */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: 'Task Sheets',   to: '/student/task-sheets',  icon: BookOpen,        bg: '#FDEFEE', color: '#CA6357' },
              { label: 'Attendance',    to: '/student/attendance',   icon: Calendar,        bg: '#F2EEFD', color: '#7C6AF2' },
              { label: 'Fee Payments',  to: '/student/fees',         icon: IndianRupee,     bg: '#FBE9E7', color: '#D96C5F' },
              { label: 'Screening',     to: '/student/screening',    icon: Star,            bg: '#FFFBEB', color: '#D97706' },
            ].map(({ label, to, icon: Icon, bg, color }) => (
              <Link key={label} to={to} className="bg-white rounded-2xl p-4 flex items-center gap-3 hover:shadow-md transition-shadow group" style={{ boxShadow: '0 1px 8px rgba(0,0,0,0.04)' }}>
                <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-105" style={{ background: bg }}>
                  <Icon className="w-4 h-4" style={{ color }} />
                </div>
                <span className="text-sm font-semibold text-[#1E293B]">{label}</span>
                <ChevronRight className="w-3.5 h-3.5 text-[#CBD5E1] ml-auto" />
              </Link>
            ))}
          </div>
        </>
      )}

    </div>
  );
}
