import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft, BookOpen, Calendar, Code2, CalendarOff,
  CreditCard, FileText, Star, Loader2, AlertTriangle,
  CheckCircle2, XCircle, Flame, ExternalLink,
  GraduationCap, User, MapPin, Settings2, Layers,
  RefreshCw, Mail, ChevronDown, ChevronUp, IndianRupee,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { studentService } from '../../../services/student.service.js';
import { tasksheetService } from '../../../services/tasksheet.service.js';
import { feesService } from '../../../services/fees.service.js';
import { batchService } from '../../../services/batch.service.js';
import { attendanceService } from '../../../services/attendance.service.js';
import { weekReviewService } from '../../../services/weekreview.service.js';
import { leaveService } from '../../../services/leave.service.js';
import { useAuth } from '../../../hooks/useAuth.js';

// ── helpers ──────────────────────────────────────────────────────────────────

const fmt = (d) =>
  d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';

const STATUS_CFG = {
  active:    { label: 'Active',    bg: '#E8F8F2', color: '#22A66E' },
  dropped:   { label: 'Dropped',  bg: '#FEE2E2', color: '#D96C5F' },
  graduated: { label: 'Graduated',bg: '#FDEFEE', color: '#CA6357' },
};

const REVIEW_STATUS_CFG = {
  pending_slot: { label: 'Pending Slot', color: '#F59E0B', bg: '#FFFBEB' },
  slot_booked:  { label: 'Slot Booked',  color: '#3B82F6', bg: '#EFF6FF' },
  completed:    { label: 'Completed',    color: '#22A66E', bg: '#E8F8F2' },
};

const TASK_CFG = {
  none:         { label: 'Not Provisioned', color: '#94A3B8', icon: FileText },
  provisioning: { label: 'Provisioning…',  color: '#F59E0B', icon: Loader2 },
  done:         { label: 'Provisioned',     color: '#22A66E', icon: CheckCircle2 },
  error:        { label: 'Error',           color: '#D96C5F', icon: XCircle },
};

// ── sub-components ────────────────────────────────────────────────────────────

function SummaryCard({ icon: Icon, title, iconColor = '#CA6357', children, linkTo, linkLabel }) {
  return (
    <div className="bg-white rounded-2xl border border-[#E2E8F0] p-5 flex flex-col gap-4" style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: `${iconColor}18` }}>
            <Icon className="w-4 h-4" style={{ color: iconColor }} strokeWidth={2} />
          </div>
          <p className="text-sm font-bold text-[#1E293B]">{title}</p>
        </div>
        {linkTo && (
          <Link to={linkTo} className="text-xs font-semibold text-[#CA6357] hover:underline flex items-center gap-1">
            {linkLabel ?? 'View all'} <ExternalLink className="w-3 h-3" />
          </Link>
        )}
      </div>
      {children}
    </div>
  );
}

function Stat({ label, value, color }) {
  return (
    <div className="text-center">
      <p className="text-xl font-bold" style={{ color: color ?? '#1E293B' }}>{value}</p>
      <p className="text-[11px] text-[#94A3B8] mt-0.5">{label}</p>
    </div>
  );
}

function CourseProgressCard({ cp, course }) {
  const daysSinceActive = cp.lastActivityDate
    ? Math.floor((Date.now() - new Date(cp.lastActivityDate)) / 86400000)
    : null;

  return (
    <SummaryCard icon={BookOpen} title="Course Progress">
      <div className="flex items-center justify-around">
        <Stat label="Current Week" value={`Week ${cp.currentWeek}`} color="#CA6357" />
        <div className="w-px h-10 bg-[#F1F5F9]" />
        <Stat label="Streak" value={cp.currentStreak} color="#F59E0B" />
        <div className="w-px h-10 bg-[#F1F5F9]" />
        <Stat label="Best Streak" value={cp.longestStreak} color="#7C6AF2" />
      </div>
      <div className="flex items-center gap-2 text-xs text-[#94A3B8]">
        <Calendar className="w-3.5 h-3.5" />
        <span>Enrolled {fmt(cp.enrollmentDate)}</span>
        {daysSinceActive !== null && (
          <>
            <span className="text-[#E2E8F0]">·</span>
            <Flame className="w-3.5 h-3.5 text-[#F59E0B]" />
            <span>
              {daysSinceActive === 0 ? 'Active today' : `Last active ${daysSinceActive}d ago`}
            </span>
          </>
        )}
      </div>
    </SummaryCard>
  );
}

function TaskSheetCard({ cp }) {
  const cfg = TASK_CFG[cp.taskSheetStatus] ?? TASK_CFG.none;
  const Icon = cfg.icon;
  return (
    <SummaryCard icon={FileText} title="Task Sheet" iconColor="#7C6AF2">
      <div className="flex items-center gap-2">
        <Icon className="w-4 h-4" style={{ color: cfg.color }} />
        <span className="text-sm font-semibold" style={{ color: cfg.color }}>{cfg.label}</span>
      </div>
      {cp.taskSheetUrl && cp.taskSheetStatus === 'done' && (
        <a
          href={cp.taskSheetUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#CA6357] hover:underline"
        >
          <ExternalLink className="w-3.5 h-3.5" /> Open OneDrive Folder
        </a>
      )}
    </SummaryCard>
  );
}

function AttendanceCard({ attendance, studentId, role }) {
  const basePath = role === 'super_admin' ? '/admin' : role === 'branch_admin' ? '/branch-admin' : role === 'branch_coordinator' ? '/coordinator' : '/mentor';
  const total = attendance.present + attendance.halfDay + attendance.absent;
  const pct = total ? Math.round((attendance.present + attendance.halfDay * 0.5) / total * 100) : 0;

  return (
    <SummaryCard
      icon={Calendar}
      title={`Attendance · ${attendance.month}`}
      iconColor="#22A66E"
      linkTo={`${basePath}/attendance`}
      linkLabel="Full view"
    >
      <div className="flex items-center justify-around">
        <Stat label="Present" value={attendance.present} color="#22A66E" />
        <div className="w-px h-10 bg-[#F1F5F9]" />
        <Stat label="Half Day" value={attendance.halfDay} color="#F59E0B" />
        <div className="w-px h-10 bg-[#F1F5F9]" />
        <Stat label="Absent" value={attendance.absent} color="#D96C5F" />
      </div>
      <div className="w-full bg-[#F1F5F9] rounded-full h-1.5">
        <div className="h-1.5 rounded-full bg-[#22A66E]" style={{ width: `${pct}%` }} />
      </div>
      <p className="text-xs text-[#94A3B8]">{pct}% attendance rate this month</p>
    </SummaryCard>
  );
}

function ScreeningsCard({ screenings }) {
  if (!screenings.length) {
    return (
      <SummaryCard icon={Star} title="Screenings" iconColor="#D96C5F">
        <p className="text-sm text-[#94A3B8]">No screenings yet</p>
      </SummaryCard>
    );
  }

  return (
    <SummaryCard icon={Star} title="Screenings" iconColor="#D96C5F">
      <div className="space-y-2">
        {screenings.map((s) => {
          const cfg = REVIEW_STATUS_CFG[s.status] ?? {};
          const resultColor = s.result === 'pass' ? '#22A66E' : s.result === 'fail' ? '#D96C5F' : null;
          return (
            <div key={s._id} className="flex items-center justify-between text-sm">
              <span className="font-semibold text-[#1E293B]">Part {s.part}</span>
              <div className="flex items-center gap-2">
                {s.result && (
                  <span className="text-xs font-bold" style={{ color: resultColor }}>
                    {s.result === 'pass' ? '✓ Pass' : '✗ Fail'}
                  </span>
                )}
                <span
                  className="text-[11px] font-semibold px-2 py-0.5 rounded-full"
                  style={{ background: cfg.bg, color: cfg.color }}
                >
                  {cfg.label}
                </span>
                {(s.attempt ?? 1) > 1 && (
                  <span className="text-[11px] text-[#94A3B8]">Attempt {s.attempt}</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </SummaryCard>
  );
}

function WeeklyReviewsCard({ weeklyReviews }) {
  const recent = [...weeklyReviews].sort((a, b) => b.weekNumber - a.weekNumber).slice(0, 4);
  const passed = weeklyReviews.filter(r => r.result === 'pass').length;

  return (
    <SummaryCard icon={Star} title="Weekly Reviews" iconColor="#7C6AF2">
      {weeklyReviews.length === 0 ? (
        <p className="text-sm text-[#94A3B8]">No reviews yet</p>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-2">
            {recent.map((r) => {
              const cfg = REVIEW_STATUS_CFG[r.status] ?? {};
              return (
                <div key={r._id} className="flex items-center justify-between bg-[#F8F9FB] rounded-xl px-3 py-2">
                  <span className="text-xs font-semibold text-[#1E293B]">Wk {r.weekNumber}</span>
                  <span className="text-[11px] font-bold" style={{ color: r.result === 'pass' ? '#22A66E' : r.result === 'fail' ? '#D96C5F' : cfg.color }}>
                    {r.result ? (r.result === 'pass' ? '✓' : '✗') : cfg.label}
                  </span>
                </div>
              );
            })}
          </div>
          <p className="text-xs text-[#94A3B8]">{passed} of {weeklyReviews.length} passed</p>
        </>
      )}
    </SummaryCard>
  );
}

function LeetCodeCard({ leetcode, studentId, role }) {
  const basePath = role === 'super_admin' ? '/admin' : role === 'branch_admin' ? '/branch-admin' : role === 'branch_coordinator' ? '/coordinator' : '/mentor';
  const pct = leetcode.totalSubmitted
    ? Math.round((leetcode.onTimeCount / leetcode.totalSubmitted) * 100)
    : 0;

  return (
    <SummaryCard
      icon={Code2}
      title="LeetCode"
      iconColor="#F59E0B"
      linkTo={`${basePath}/leetcode`}
      linkLabel="Full view"
    >
      {leetcode.hold && (
        <div className="flex items-center gap-2 bg-[#FEE2E2] text-[#D96C5F] text-xs font-semibold px-3 py-2 rounded-xl">
          <AlertTriangle className="w-3.5 h-3.5" /> LeetCode Hold Active
        </div>
      )}
      <div className="flex items-center gap-2 text-xs text-[#475569]">
        <Code2 className="w-3.5 h-3.5 text-[#94A3B8]" />
        <span>{leetcode.username ?? 'Username not set'}</span>
        <span className="text-[#E2E8F0]">·</span>
        <span className="capitalize">{leetcode.list} list</span>
      </div>
      <div className="flex items-center justify-around">
        <Stat label="Submitted" value={leetcode.totalSubmitted} color="#CA6357" />
        <div className="w-px h-10 bg-[#F1F5F9]" />
        <Stat label="On Time" value={leetcode.onTimeCount} color="#22A66E" />
        <div className="w-px h-10 bg-[#F1F5F9]" />
        <Stat label="On-time %" value={`${pct}%`} color={pct >= 70 ? '#22A66E' : '#F59E0B'} />
      </div>
    </SummaryCard>
  );
}

function LeaveCard({ leaves }) {
  return (
    <SummaryCard icon={CalendarOff} title="Upcoming Leave" iconColor="#7C6AF2">
      {leaves.length === 0 ? (
        <p className="text-sm text-[#94A3B8]">No upcoming approved leave</p>
      ) : (
        <div className="space-y-2">
          {leaves.map((l, i) => {
            const dayCount = Math.ceil((new Date(l.endDate) - new Date(l.startDate)) / 86400000) + 1;
            return (
              <div key={i} className="flex items-center justify-between text-sm">
                <span className="font-semibold text-[#1E293B]">{fmt(l.startDate)} → {fmt(l.endDate)}</span>
                <span className="text-xs text-[#94A3B8]">{dayCount}d</span>
              </div>
            );
          })}
        </div>
      )}
    </SummaryCard>
  );
}

function PaymentCard({ payment, canSeeFullPayment }) {
  if (!canSeeFullPayment && !payment.hasOutstandingFee) return null;

  return (
    <SummaryCard icon={CreditCard} title="Payment" iconColor={payment.hasOutstandingFee ? '#D96C5F' : '#22A66E'}>
      {payment.hasOutstandingFee && (
        <div className="flex items-center gap-2 bg-[#FEE2E2] text-[#D96C5F] text-xs font-semibold px-3 py-2 rounded-xl">
          <AlertTriangle className="w-3.5 h-3.5" /> Outstanding fee — access may be restricted
        </div>
      )}
      {canSeeFullPayment && payment.payments?.length > 0 && (
        <div className="space-y-2">
          {payment.payments.slice(0, 4).map((p) => (
            <div key={p._id} className="flex items-center justify-between text-xs">
              <span className="text-[#475569] capitalize">{p.type.replace('_', ' ')}</span>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-[#1E293B]">₹{p.amount.toLocaleString('en-IN')}</span>
                <span
                  className="font-semibold px-2 py-0.5 rounded-full"
                  style={{
                    background: p.status === 'approved' ? '#E8F8F2' : p.status === 'rejected' ? '#FEE2E2' : '#FFFBEB',
                    color:      p.status === 'approved' ? '#22A66E' : p.status === 'rejected' ? '#D96C5F' : '#F59E0B',
                  }}
                >
                  {p.status === 'approved' ? 'Paid' : p.status === 'rejected' ? 'Rejected' : 'Pending'}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
      {!canSeeFullPayment && !payment.hasOutstandingFee && (
        <p className="text-sm text-[#94A3B8]">No outstanding fees</p>
      )}
    </SummaryCard>
  );
}

// ── history cards ─────────────────────────────────────────────────────────────

const ATT_STATUS_CFG = {
  present:  { bg: '#E8F8F2', color: '#22A66E', label: 'Present' },
  late:     { bg: '#FFFBEB', color: '#F59E0B', label: 'Late' },
  absent:   { bg: '#FEE2E2', color: '#D96C5F', label: 'Absent' },
  excused:  { bg: '#EFF6FF', color: '#3B82F6', label: 'Excused' },
  half_day: { bg: '#FFF7ED', color: '#F97316', label: 'Half Day' },
};

const PERIOD_OPTIONS = [
  ['7d', 'Last 7 days'],
  ['30d', 'Last 30 days'],
  ['90d', 'Last 3 months'],
  ['all', 'All time'],
];

function getDateRange(period) {
  const now = new Date();
  const end = now.toISOString().split('T')[0];
  if (period === '7d')  { const s = new Date(now); s.setDate(s.getDate() - 6);  return { startDate: s.toISOString().split('T')[0], endDate: end }; }
  if (period === '30d') { const s = new Date(now); s.setDate(s.getDate() - 29); return { startDate: s.toISOString().split('T')[0], endDate: end }; }
  if (period === '90d') { const s = new Date(now); s.setDate(s.getDate() - 89); return { startDate: s.toISOString().split('T')[0], endDate: end }; }
  return {};
}

function HistoryCardShell({ icon: Icon, iconBg, iconColor, title, expanded, onToggle, children }) {
  return (
    <div className="bg-white rounded-2xl border border-[#E2E8F0] overflow-hidden" style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>
      <button
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-[#F8F9FB] transition-colors"
        onClick={onToggle}
      >
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-xl flex items-center justify-center" style={{ background: iconBg }}>
            <Icon className="w-3.5 h-3.5" style={{ color: iconColor }} />
          </div>
          <span className="text-sm font-bold text-[#1E293B]">{title}</span>
        </div>
        {expanded
          ? <ChevronUp className="w-4 h-4 text-[#94A3B8]" />
          : <ChevronDown className="w-4 h-4 text-[#94A3B8]" />}
      </button>
      {expanded && (
        <div className="border-t border-[#F1F5F9] px-5 py-4">{children}</div>
      )}
    </div>
  );
}

function AttendanceHistoryCard({ studentId }) {
  const [expanded, setExpanded] = useState(false);
  const [period, setPeriod] = useState('30d');
  const range = getDateRange(period);

  const { data, isLoading } = useQuery({
    queryKey: ['attendance-history', studentId, period],
    queryFn: () => attendanceService.getStudentAttendance(studentId, range),
    enabled: expanded,
  });

  return (
    <HistoryCardShell
      icon={Calendar} iconBg="#E8F8F2" iconColor="#22A66E"
      title="Attendance History" expanded={expanded} onToggle={() => setExpanded((e) => !e)}
    >
      <div className="space-y-4">
        <div className="flex gap-2 flex-wrap">
          {PERIOD_OPTIONS.map(([p, label]) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className="text-xs font-semibold px-3 py-1.5 rounded-xl border transition-colors"
              style={period === p
                ? { background: '#FDEFEE', color: '#CA6357', borderColor: '#CA6357' }
                : { borderColor: '#E2E8F0', color: '#475569' }}
            >
              {label}
            </button>
          ))}
        </div>
        {isLoading ? (
          <div className="flex justify-center py-6"><Loader2 className="w-5 h-5 text-[#CA6357] animate-spin" /></div>
        ) : data?.records?.length ? (
          <>
            <div className="grid grid-cols-4 gap-2">
              {[
                ['Present', data.stats.present, '#22A66E'],
                ['Late',    data.stats.late,    '#F59E0B'],
                ['Absent',  data.stats.absent,  '#D96C5F'],
                ['Excused', data.stats.excused, '#3B82F6'],
              ].map(([label, val, color]) => (
                <div key={label} className="text-center bg-[#F8F9FB] rounded-xl py-3">
                  <p className="text-lg font-bold" style={{ color }}>{val}</p>
                  <p className="text-[11px] text-[#94A3B8]">{label}</p>
                </div>
              ))}
            </div>
            <div className="space-y-1 max-h-72 overflow-y-auto pr-1">
              {[...data.records].reverse().map((r, i) => {
                const cfg = ATT_STATUS_CFG[r.status] ?? { bg: '#F1F5F9', color: '#94A3B8', label: r.status };
                return (
                  <div key={i} className="flex items-center justify-between py-1.5 border-b border-[#F1F5F9] last:border-0">
                    <span className="text-sm text-[#475569]">{fmt(r.date)}</span>
                    <div className="flex items-center gap-2">
                      {r.note && <span className="text-xs text-[#94A3B8] max-w-[120px] truncate">{r.note}</span>}
                      <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full" style={{ background: cfg.bg, color: cfg.color }}>
                        {cfg.label}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        ) : (
          <p className="text-sm text-center text-[#94A3B8] py-4">No attendance records for this period</p>
        )}
      </div>
    </HistoryCardShell>
  );
}

const FEE_INST_STATUS = {
  paid:           { bg: '#E8F8F2', color: '#22A66E', label: 'Paid' },
  pending_review: { bg: '#FFFBEB', color: '#F59E0B', label: 'Under Review' },
  due:            { bg: '#FFF7ED', color: '#F97316', label: 'Due' },
  overdue:        { bg: '#FEE2E2', color: '#D96C5F', label: 'Overdue' },
  upcoming:       { bg: '#F1F5F9', color: '#94A3B8', label: 'Upcoming' },
  waived:         { bg: '#FDEFEE', color: '#CA6357', label: 'Waived' },
  rejected:       { bg: '#FEE2E2', color: '#D96C5F', label: 'Rejected' },
};

function FeeInstallmentHistoryCard({ studentId }) {
  const [expanded, setExpanded] = useState(false);

  const { data: feeAccount, isLoading } = useQuery({
    queryKey: ['fee-account', studentId],
    queryFn: () => feesService.getFeeAccountByStudent(studentId),
    enabled: expanded,
    retry: false,
  });

  return (
    <HistoryCardShell
      icon={IndianRupee} iconBg="#FDEFEE" iconColor="#CA6357"
      title="Fee Payment History" expanded={expanded} onToggle={() => setExpanded((e) => !e)}
    >
      {isLoading ? (
        <div className="flex justify-center py-6"><Loader2 className="w-5 h-5 text-[#CA6357] animate-spin" /></div>
      ) : !feeAccount ? (
        <p className="text-sm text-center text-[#94A3B8] py-4">No fee account found</p>
      ) : (
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-4 text-xs text-[#475569] bg-[#F8F9FB] rounded-xl px-4 py-3">
            <span>Total: <span className="font-bold text-[#1E293B]">₹{feeAccount.totalFee?.toLocaleString('en-IN') ?? '—'}</span></span>
            <span className="text-[#E2E8F0]">|</span>
            <span>Paid: <span className="font-bold text-[#22A66E]">₹{feeAccount.totalPaid?.toLocaleString('en-IN') ?? '0'}</span></span>
            <span className="text-[#E2E8F0]">|</span>
            <span>Access till: <span className="font-bold text-[#CA6357]">Week {feeAccount.accessValidUntilWeek}</span></span>
          </div>
          <div className="space-y-2">
            {feeAccount.installments?.map((inst) => {
              const cfg = FEE_INST_STATUS[inst.status] ?? { bg: '#F1F5F9', color: '#94A3B8', label: inst.status };
              return (
                <div key={inst._id ?? inst.installmentNumber} className="flex items-center justify-between border border-[#F1F5F9] rounded-xl px-4 py-3">
                  <div>
                    <p className="text-sm font-semibold text-[#1E293B]">Installment {inst.installmentNumber}</p>
                    <p className="text-xs text-[#94A3B8]">
                      Due {fmt(inst.dueDate)}
                      {inst.paidAt && ` · Paid ${fmt(inst.paidAt)}`}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-bold text-[#1E293B]">₹{inst.amount?.toLocaleString('en-IN')}</span>
                    <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full" style={{ background: cfg.bg, color: cfg.color }}>{cfg.label}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </HistoryCardShell>
  );
}

const WR_STATUS_CFG = {
  approved:              { color: '#22A66E', label: 'Approved' },
  corrections_requested: { color: '#F59E0B', label: 'Corrections' },
  in_progress:           { color: '#3B82F6', label: 'In Progress' },
};

const WR_DAY_CFG = {
  approved:              { bg: '#E8F8F2', color: '#22A66E' },
  submitted:             { bg: '#EFF6FF', color: '#3B82F6' },
  corrections_requested: { bg: '#FFFBEB', color: '#F59E0B' },
};

function TaskSubmissionHistoryCard({ studentId }) {
  const [expanded, setExpanded] = useState(false);

  const { data: reviews, isLoading } = useQuery({
    queryKey: ['task-history', studentId],
    queryFn: () => weekReviewService.listByStudent(studentId),
    enabled: expanded,
  });

  const sorted = [...(reviews ?? [])].sort((a, b) => a.week - b.week);
  const approvedCount = sorted.filter((r) => r.status === 'approved').length;

  return (
    <HistoryCardShell
      icon={FileText} iconBg="#EFF6FF" iconColor="#3B82F6"
      title="Task Submission History" expanded={expanded} onToggle={() => setExpanded((e) => !e)}
    >
      {isLoading ? (
        <div className="flex justify-center py-6"><Loader2 className="w-5 h-5 text-[#CA6357] animate-spin" /></div>
      ) : !sorted.length ? (
        <p className="text-sm text-center text-[#94A3B8] py-4">No task submissions yet</p>
      ) : (
        <div className="space-y-3">
          <p className="text-xs text-[#94A3B8]">{approvedCount} of {sorted.length} weeks approved</p>
          <div className="space-y-2">
            {sorted.map((wr) => {
              const cfg = WR_STATUS_CFG[wr.status] ?? WR_STATUS_CFG.in_progress;
              return (
                <div key={wr._id} className="border border-[#F1F5F9] rounded-xl p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-bold text-[#1E293B]">Week {wr.week}</span>
                    <span className="text-xs font-semibold" style={{ color: cfg.color }}>{cfg.label}</span>
                  </div>
                  {wr.days?.length > 0 && (
                    <div className="flex gap-1.5 flex-wrap">
                      {[...wr.days].sort((a, b) => a.day - b.day).map((d) => {
                        const dc = WR_DAY_CFG[d.status] ?? { bg: '#F1F5F9', color: '#94A3B8' };
                        return (
                          <div
                            key={d._id ?? d.day}
                            className="text-[11px] font-bold px-2 py-0.5 rounded-lg"
                            style={{ background: dc.bg, color: dc.color }}
                            title={d.mentorNote ? `Day ${d.day}: ${d.mentorNote}` : `Day ${d.day}`}
                          >
                            D{d.day}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </HistoryCardShell>
  );
}

const LEAVE_STATUS_CFG = {
  pending:  { bg: '#FFFBEB', color: '#F59E0B', label: 'Pending' },
  approved: { bg: '#E8F8F2', color: '#22A66E', label: 'Approved' },
  rejected: { bg: '#FEE2E2', color: '#D96C5F', label: 'Rejected' },
};

function LeaveHistoryCard({ studentId }) {
  const [expanded, setExpanded] = useState(false);

  const { data: leaves, isLoading } = useQuery({
    queryKey: ['leave-history', studentId],
    queryFn: () => leaveService.getStudentLeaves(studentId),
    enabled: expanded,
  });

  return (
    <HistoryCardShell
      icon={CalendarOff} iconBg="#F2EEFD" iconColor="#7C6AF2"
      title="Leave History" expanded={expanded} onToggle={() => setExpanded((e) => !e)}
    >
      {isLoading ? (
        <div className="flex justify-center py-6"><Loader2 className="w-5 h-5 text-[#CA6357] animate-spin" /></div>
      ) : !leaves?.length ? (
        <p className="text-sm text-center text-[#94A3B8] py-4">No leave requests</p>
      ) : (
        <div className="space-y-2">
          {leaves.map((l) => {
            const cfg = LEAVE_STATUS_CFG[l.status] ?? LEAVE_STATUS_CFG.pending;
            const days = Math.ceil((new Date(l.endDate) - new Date(l.startDate)) / 86400000) + 1;
            return (
              <div key={l._id} className="flex items-center justify-between border border-[#F1F5F9] rounded-xl px-4 py-3">
                <div>
                  <p className="text-sm font-semibold text-[#1E293B]">{fmt(l.startDate)} → {fmt(l.endDate)}</p>
                  <p className="text-xs text-[#94A3B8]">
                    {days} day{days !== 1 ? 's' : ''}
                    {l.reason ? ` · ${l.reason}` : ''}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full" style={{ background: cfg.bg, color: cfg.color }}>{cfg.label}</span>
                  {l.reviewNote && <span className="text-[10px] text-[#94A3B8] max-w-[110px] text-right truncate">{l.reviewNote}</span>}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </HistoryCardShell>
  );
}

const TASK_SHEET_STATUS_CFG = {
  none:         { label: 'Not Provisioned', color: '#94A3B8', bg: '#F1F5F9' },
  provisioning: { label: 'Setting up…',    color: '#F59E0B', bg: '#FFFBEB' },
  done:         { label: 'Provisioned',     color: '#22A66E', bg: '#E8F8F2' },
  error:        { label: 'Error',           color: '#D96C5F', bg: '#FEE2E2' },
};

const STUDENT_STATUS_CFG = {
  active:    { label: 'Active',    color: '#22A66E', bg: '#E8F8F2' },
  dropped:   { label: 'Dropped',   color: '#D96C5F', bg: '#FEE2E2' },
  graduated: { label: 'Graduated', color: '#7C6AF2', bg: '#F2EEFD' },
};

function AdminActionsCard({ student }) {
  const qc = useQueryClient();
  const [assigningBatch, setAssigningBatch] = useState(false);
  const [selectedBatch, setSelectedBatch] = useState('');

  const { data: feeAccount } = useQuery({
    queryKey: ['fee-account', student._id],
    queryFn:  () => feesService.getFeeAccountByStudent(student._id),
    retry: false,
  });

  const { data: allBatches = [] } = useQuery({
    queryKey: ['batches'],
    queryFn:  () => batchService.getAll({ active: 'true' }),
  });

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['students'] });
    qc.invalidateQueries({ queryKey: ['student-academic-summary', student._id] });
  };

  const provisionMutation = useMutation({
    mutationFn: () => tasksheetService.provisionTaskSheet(student._id),
    onSuccess: () => { toast.success('Task sheet provisioned'); invalidate(); },
    onError:   (e) => toast.error(e.response?.data?.message ?? 'Provisioning failed'),
  });

  const resetMutation = useMutation({
    mutationFn: () => studentService.resetTaskSheet(student._id),
    onSuccess: () => { toast.success('Task sheet reset'); invalidate(); },
    onError:   (e) => toast.error(e.response?.data?.message ?? 'Reset failed'),
  });

  const reshareMutation = useMutation({
    mutationFn: () => studentService.reshareTaskSheet(student._id),
    onSuccess: (res) => toast.success(res?.message ?? 'Task sheet reshared with mentors'),
    onError:   (e)   => toast.error(e.response?.data?.message ?? 'Re-share failed'),
  });

  const statusMutation = useMutation({
    mutationFn: (status) => studentService.updateStatus({ id: student._id, status }),
    onSuccess: () => { toast.success('Status updated'); invalidate(); },
    onError:   (e) => toast.error(e.response?.data?.message ?? 'Failed to update status'),
  });

  const batchMutation = useMutation({
    mutationFn: (batchId) => studentService.assignBatch(student._id, batchId),
    onSuccess: () => { toast.success('Batch assigned'); invalidate(); setAssigningBatch(false); },
    onError:   (e) => toast.error(e.response?.data?.message ?? 'Failed'),
  });

  const taskStatus = student.taskSheetStatus ?? 'none';
  const taskCfg    = TASK_SHEET_STATUS_CFG[taskStatus] ?? TASK_SHEET_STATUS_CFG.none;
  const isZero2Code = student.course?.reviewType === 'screening';

  const FEE_STATUS_CFG = {
    paid:    { label: 'Paid',    color: '#22A66E', bg: '#E8F8F2' },
    partial: { label: 'Partial', color: '#F59E0B', bg: '#FFFBEB' },
    pending: { label: 'Pending', color: '#D96C5F', bg: '#FEE2E2' },
    overdue: { label: 'Overdue', color: '#D96C5F', bg: '#FEE2E2' },
  };

  return (
    <div className="bg-white rounded-2xl border border-[#E2E8F0] p-5 space-y-4" style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>
      <div className="flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-xl flex items-center justify-center bg-[#F2EEFD]">
          <Settings2 className="w-4 h-4 text-[#7C6AF2]" strokeWidth={2} />
        </div>
        <p className="text-sm font-bold text-[#1E293B]">Admin Actions</p>
      </div>

      {/* Status */}
      <div>
        <p className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-wider mb-2">Status</p>
        <div className="flex gap-2 flex-wrap">
          {Object.entries(STUDENT_STATUS_CFG).map(([key, cfg]) => (
            <button
              key={key}
              onClick={() => statusMutation.mutate(key)}
              disabled={statusMutation.isPending || student.studentStatus === key}
              className="text-xs font-semibold px-3 py-1.5 rounded-xl border transition-colors disabled:opacity-50"
              style={student.studentStatus === key
                ? { background: cfg.bg, color: cfg.color, borderColor: cfg.color }
                : { borderColor: '#E2E8F0', color: '#475569' }}
            >
              {cfg.label}{student.studentStatus === key ? ' ✓' : ''}
            </button>
          ))}
        </div>
      </div>

      {/* Batch */}
      <div>
        <p className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-wider mb-2">Batch</p>
        {assigningBatch ? (
          <div className="space-y-2">
            <div className="relative">
              <select
                value={selectedBatch}
                onChange={(e) => setSelectedBatch(e.target.value)}
                className="w-full appearance-none pl-3 pr-8 py-2 border border-[#E2E8F0] rounded-xl text-sm text-[#1E293B] focus:outline-none focus:border-[#CA6357] bg-white"
              >
                <option value="">Select a batch…</option>
                {allBatches.map((b) => (
                  <option key={b._id} value={b._id}>{b.name}{b.branch?.name ? ` — ${b.branch.name}` : ''}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#94A3B8] pointer-events-none" />
            </div>
            <div className="flex gap-2">
              <button onClick={() => setAssigningBatch(false)} className="flex-1 border border-[#E2E8F0] text-[#475569] text-sm font-medium px-3 py-2 rounded-xl hover:bg-[#F8F9FB]">Cancel</button>
              <button
                onClick={() => selectedBatch && batchMutation.mutate(selectedBatch)}
                disabled={!selectedBatch || batchMutation.isPending}
                className="flex-1 bg-[#CA6357] hover:bg-[#b85548] disabled:opacity-60 text-white text-sm font-semibold px-3 py-2 rounded-xl flex items-center justify-center gap-1.5"
              >
                {batchMutation.isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />} Assign
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => { setAssigningBatch(true); setSelectedBatch(student.batch?._id ?? ''); }}
            className="flex items-center gap-2 text-sm text-[#475569] hover:text-[#CA6357] transition-colors"
          >
            <Layers className="w-4 h-4 text-[#94A3B8]" />
            {student.batch?.name
              ? <span>{student.batch.name} <span className="text-[#94A3B8]">— change?</span></span>
              : <span className="text-[#D96C5F]">No batch — assign one</span>}
          </button>
        )}
      </div>

      {/* Task Sheet */}
      {isZero2Code && (
        <div>
          <div className="flex items-center justify-between mb-2">
            <p className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-wider">Task Sheet</p>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: taskCfg.bg, color: taskCfg.color }}>
              {taskCfg.label}
            </span>
          </div>

          {/* Fee info */}
          <div className="flex items-center gap-2 mb-2">
            <IndianRupee className="w-4 h-4 text-[#94A3B8] flex-shrink-0" />
            {feeAccount
              ? (() => {
                  const cfg = FEE_STATUS_CFG[feeAccount.feeStatus] ?? FEE_STATUS_CFG.pending;
                  return (
                    <span className="text-xs text-[#475569]">
                      Fee: <span className="font-semibold" style={{ color: cfg.color }}>{cfg.label}</span>
                      {feeAccount.accessValidUntilWeek > 0
                        ? <span className="text-[#94A3B8]"> · access up to Week {feeAccount.accessValidUntilWeek}</span>
                        : <span className="text-[#D96C5F]"> · no installment paid yet</span>}
                    </span>
                  );
                })()
              : <span className="text-xs text-[#CBD5E1] italic">No fee account yet</span>
            }
          </div>

          {/* Microsoft email */}
          <div className="flex items-center gap-2 mb-3">
            <Mail className="w-4 h-4 text-[#94A3B8] flex-shrink-0" />
            {student.microsoftEmail
              ? <span className="text-xs text-[#475569]">{student.microsoftEmail}</span>
              : <span className="text-xs text-[#CBD5E1] italic">Microsoft email not set by student</span>}
          </div>

          {/* Provision */}
          <button
            onClick={() => provisionMutation.mutate()}
            disabled={
              !student.batch || !student.microsoftEmail ||
              !feeAccount || feeAccount.accessValidUntilWeek === 0 ||
              taskStatus === 'done' || taskStatus === 'provisioning' ||
              provisionMutation.isPending
            }
            className="w-full inline-flex items-center justify-center gap-2 bg-[#CA6357] hover:bg-[#b85548] disabled:bg-[#E2E8F0] disabled:text-[#94A3B8] text-white font-semibold px-4 py-2.5 rounded-xl transition-colors text-sm"
          >
            {provisionMutation.isPending
              ? <><Loader2 className="w-4 h-4 animate-spin" /> Provisioning…</>
              : taskStatus === 'error'
                ? <><RefreshCw className="w-4 h-4" /> Retry Provision</>
                : <><FileText className="w-4 h-4" /> Provision Task Sheet</>}
          </button>

          {!student.batch && <p className="text-[10px] text-[#D96C5F] text-center mt-1">Assign a batch first</p>}
          {student.batch && (!feeAccount || feeAccount.accessValidUntilWeek === 0) && (
            <p className="text-[10px] text-[#D96C5F] text-center mt-1">Student hasn't paid any fee installment yet</p>
          )}
          {student.batch && feeAccount && feeAccount.accessValidUntilWeek > 0 && !student.microsoftEmail && (
            <p className="text-[10px] text-[#D96C5F] text-center mt-1">Student hasn't added their Microsoft email yet</p>
          )}

          {taskStatus === 'done' && (
            <div className="mt-2 space-y-1.5">
              {student.taskSheetUrl && (
                <a href={student.taskSheetUrl} target="_blank" rel="noopener noreferrer"
                  className="block text-center text-xs text-[#CA6357] font-semibold hover:underline">
                  View OneDrive folder ↗
                </a>
              )}
              <button
                onClick={() => reshareMutation.mutate()}
                disabled={reshareMutation.isPending}
                className="w-full inline-flex items-center justify-center gap-2 border border-[#CA6357] text-[#CA6357] hover:bg-[#FDEFEE] disabled:opacity-50 font-semibold px-4 py-2 rounded-xl text-sm"
              >
                {reshareMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                Re-share with Mentors
              </button>
              <button
                onClick={() => resetMutation.mutate()}
                disabled={resetMutation.isPending}
                className="w-full text-xs text-[#D96C5F] hover:underline disabled:opacity-50 text-center"
              >
                {resetMutation.isPending ? 'Resetting…' : 'Reset task sheet (admin)'}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── main page ─────────────────────────────────────────────────────────────────

export default function StudentAcademicProfile() {
  const { studentId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const role = user?.role ?? '';

  const { data, isLoading, isError } = useQuery({
    queryKey: ['student-academic-summary', studentId],
    queryFn: () => studentService.getAcademicSummary(studentId),
    enabled: !!studentId,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 text-[#CA6357] animate-spin" />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3">
        <XCircle className="w-10 h-10 text-[#CBD5E1]" strokeWidth={1.5} />
        <p className="text-base font-bold text-[#1E293B]">Failed to load profile</p>
      </div>
    );
  }

  const {
    student, courseProgress, screenings, weeklyReviews,
    leetcode, attendance, leaves, payment,
  } = data;

  const s = student;
  const statusCfg = STATUS_CFG[s.studentStatus] ?? STATUS_CFG.active;
  const isCode2Career = s.course?.slug?.includes('code2career');
  const canSeeFullPayment = ['super_admin', 'branch_admin', 'branch_coordinator'].includes(role);
  const isStaffWithManageAccess = ['super_admin', 'branch_admin', 'branch_coordinator'].includes(role);
  const canSeeFeeHistory = ['super_admin', 'branch_admin', 'branch_coordinator'].includes(role);

  const backPath =
    role === 'super_admin' ? '/admin/students' :
    role === 'branch_admin' ? '/branch-admin/students' :
    role === 'branch_coordinator' ? '/coordinator/students' : '/mentor/students';

  return (
    <div className="space-y-6 pb-8">

      {/* Back */}
      <button
        onClick={() => navigate(backPath)}
        className="inline-flex items-center gap-1.5 text-sm text-[#475569] hover:text-[#CA6357] transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Students
      </button>

      {/* Header card */}
      <div
        className="relative rounded-2xl overflow-hidden p-6 sm:p-8"
        style={{ background: 'linear-gradient(135deg, #CA6357 0%, #A94E43 100%)' }}
      >

        <div className="relative z-10 flex flex-col sm:flex-row sm:items-start gap-5">
          {/* Avatar */}
          <div className="w-16 h-16 rounded-2xl bg-white/15 flex items-center justify-center flex-shrink-0 text-2xl font-bold text-white">
            {s.user?.name?.charAt(0).toUpperCase() ?? '?'}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <h2 className="text-xl font-bold text-white">{s.user?.name ?? '—'}</h2>
              {s.rollNumber && (
                <span className="text-xs font-mono text-white/50">#{s.rollNumber}</span>
              )}
            </div>
            <p className="text-sm text-white/60 mb-3">{s.user?.email ?? '—'}</p>

            <div className="flex flex-wrap gap-2">
              <span
                className="text-xs font-bold px-3 py-1 rounded-full"
                style={{ background: statusCfg.bg, color: statusCfg.color }}
              >
                {statusCfg.label}
              </span>
              <span className="text-xs font-semibold px-3 py-1 rounded-full bg-white/10 text-white">
                {s.course?.name ?? '—'}
              </span>
              <span className="text-xs font-semibold px-3 py-1 rounded-full bg-white/10 text-white">
                Week {courseProgress.currentWeek}
              </span>
              {s.mentorshipMode && (
                <span className="text-xs font-semibold px-3 py-1 rounded-full bg-white/10 text-white capitalize">
                  {s.mentorshipMode}
                </span>
              )}
            </div>
          </div>

          {/* Right meta */}
          <div className="flex-shrink-0 text-right space-y-1 hidden sm:block">
            {s.batch?.name && (
              <div className="flex items-center gap-1.5 text-xs text-white/60 justify-end">
                <GraduationCap className="w-3.5 h-3.5" />
                <span>{s.batch.name}</span>
              </div>
            )}
            {s.branch?.name && (
              <div className="flex items-center gap-1.5 text-xs text-white/60 justify-end">
                <MapPin className="w-3.5 h-3.5" />
                <span>{s.branch.name}</span>
              </div>
            )}
            {s.educationQualification && (
              <div className="flex items-center gap-1.5 text-xs text-white/60 justify-end">
                <User className="w-3.5 h-3.5" />
                <span>{s.educationQualification}</span>
              </div>
            )}
            {s.user?.phone && (
              <p className="text-xs text-white/50">{s.user.phone}</p>
            )}
          </div>
        </div>
      </div>

      {/* Outstanding fee banner (always visible if has hold) */}
      {payment.hasOutstandingFee && (
        <div className="flex items-center gap-3 bg-[#FEE2E2] border border-[#FECACA] rounded-2xl px-5 py-4">
          <AlertTriangle className="w-5 h-5 text-[#D96C5F] flex-shrink-0" />
          <p className="text-sm font-semibold text-[#D96C5F]">
            This student has an outstanding fee. Their access may be restricted to dashboard and payment pages only.
          </p>
        </div>
      )}

      {/* Summary grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">

        <CourseProgressCard cp={courseProgress} course={s.course} />

        <AttendanceCard attendance={attendance} studentId={studentId} role={role} />

        <TaskSheetCard cp={courseProgress} />

        {isCode2Career ? (
          <WeeklyReviewsCard weeklyReviews={weeklyReviews} />
        ) : (
          <ScreeningsCard screenings={screenings} />
        )}

        {leetcode && (
          <LeetCodeCard leetcode={leetcode} studentId={studentId} role={role} />
        )}

        <LeaveCard leaves={leaves} />

        {(canSeeFullPayment || payment.hasOutstandingFee) && (
          <PaymentCard payment={payment} canSeeFullPayment={canSeeFullPayment} />
        )}

        {isStaffWithManageAccess && (
          <AdminActionsCard student={s} />
        )}

      </div>

      {/* Notes */}
      {s.notes && (
        <div className="bg-white rounded-2xl border border-[#E2E8F0] p-5" style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>
          <p className="text-xs font-bold text-[#94A3B8] uppercase tracking-wide mb-2">Staff Notes</p>
          <p className="text-sm text-[#475569] leading-relaxed">{s.notes}</p>
        </div>
      )}

      {/* History */}
      <div className="space-y-3">
        <p className="text-xs font-bold text-[#94A3B8] uppercase tracking-wider px-1">Student History</p>
        <AttendanceHistoryCard studentId={studentId} />
        {canSeeFeeHistory && <FeeInstallmentHistoryCard studentId={student._id} />}
        <TaskSubmissionHistoryCard studentId={student._id} />
        <LeaveHistoryCard studentId={student._id} />
      </div>

    </div>
  );
}
