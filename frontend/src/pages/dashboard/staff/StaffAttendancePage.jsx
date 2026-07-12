import { useState, useMemo, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import {
  CalendarDays, ChevronLeft, ChevronRight, Loader2,
  CheckCircle2, XCircle, Clock, ShieldCheck,
  X, Layers, Building2, Users, MonitorSmartphone, RotateCcw, Pencil,
} from 'lucide-react';
import { attendanceService } from '../../../services/attendance.service.js';
import { appUsageService } from '../../../services/appUsage.service.js';
import { studentService } from '../../../services/student.service.js';
import { staffService } from '../../../services/staff.service.js';
import { batchService } from '../../../services/batch.service.js';
import { useAuth } from '../../../hooks/useAuth.js';
import { ROLES } from '../../../constants/roles.js';

// ── Thresholds ────────────────────────────────────────────────────────────────
const FULL_DAY_MINS = 360; // 6h
const HALF_DAY_MINS = 180; // 3h

const deriveStatus = (activeMinutes) => {
  if (activeMinutes == null) return 'absent';
  if (activeMinutes >= FULL_DAY_MINS) return 'present';
  if (activeMinutes >= HALF_DAY_MINS) return 'half_day';
  return 'absent';
};

const formatMins = (mins) => {
  if (mins == null || mins === 0) return '0m';
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
};

// ── Status config ─────────────────────────────────────────────────────────────
const STATUS_CONFIG = {
  present:  { label: 'Full Day',  color: '#22A66E', bg: '#E8F8F2', border: '#BBF7D0', icon: CheckCircle2 },
  half_day: { label: 'Half Day',  color: '#F59E0B', bg: '#FFFBEB', border: '#FDE68A', icon: Clock        },
  absent:   { label: 'Absent',    color: '#C76D64', bg: '#FDEFEE', border: '#FCA5A5', icon: XCircle      },
  excused:  { label: 'Excused',   color: '#7C6AF2', bg: '#F2EEFD', border: '#DDD6FE', icon: ShieldCheck  },
};
const OVERRIDE_STATUSES = ['present', 'half_day', 'absent', 'excused'];

const toISODate = (d) => d.toISOString().split('T')[0];
const todayStr  = () => toISODate(new Date());

// ── Sub-components ─────────────────────────────────────────────────────────────
function StatusPill({ status, dim }) {
  const cfg = STATUS_CONFIG[status];
  if (!cfg) return null;
  const Icon = cfg.icon;
  return (
    <span
      className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full"
      style={{
        backgroundColor: cfg.bg,
        color: dim ? '#94A3B8' : cfg.color,
        opacity: dim ? 0.7 : 1,
      }}
    >
      <Icon className="w-3.5 h-3.5" />
      {cfg.label}
    </span>
  );
}

function UsagePill({ minutes }) {
  const color = minutes >= FULL_DAY_MINS ? '#22A66E' : minutes >= HALF_DAY_MINS ? '#F59E0B' : '#94A3B8';
  const bg    = minutes >= FULL_DAY_MINS ? '#E8F8F2' : minutes >= HALF_DAY_MINS ? '#FFFBEB' : '#F1F5F9';
  return (
    <span
      className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-1 rounded-lg flex-shrink-0"
      style={{ color, backgroundColor: bg }}
      title="App usage today"
    >
      <MonitorSmartphone className="w-3 h-3" />
      {formatMins(minutes)}
    </span>
  );
}

function SummaryCard({ label, value, color, bg, icon: Icon }) {
  return (
    <div className="bg-white rounded-2xl p-4 flex items-center gap-3"
      style={{ boxShadow: '0 2px 16px rgba(0,0,0,0.05)' }}>
      <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
        style={{ backgroundColor: bg }}>
        <Icon className="w-4 h-4" style={{ color }} />
      </div>
      <div>
        <p className="text-xl font-extrabold text-[#1E293B] leading-none">{value}</p>
        <p className="text-xs text-[#94A3B8] mt-0.5">{label}</p>
      </div>
    </div>
  );
}

// ── Roll call row ─────────────────────────────────────────────────────────────
function AttendanceRow({ student, record, date, activeMinutes }) {
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState(false);

  const autoStatus   = deriveStatus(activeMinutes);
  const hasOverride  = !!record;
  const effectiveStatus = hasOverride ? record.status : autoStatus;

  const overrideMutation = useMutation({
    mutationFn: (status) =>
      attendanceService.markAttendance({ studentId: student._id, date, status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attendance', 'date', date] });
      setEditing(false);
    },
    onError: (err) => toast.error(err?.response?.data?.message ?? 'Failed to save'),
  });

  const resetMutation = useMutation({
    mutationFn: () =>
      attendanceService.deleteOverride({ studentId: student._id, date }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attendance', 'date', date] });
      toast.success('Reverted to auto attendance');
    },
    onError: (err) => toast.error(err?.response?.data?.message ?? 'Failed to reset'),
  });

  const initials = (student.user?.name ?? '?')
    .split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase();

  const isPending = overrideMutation.isPending || resetMutation.isPending;

  return (
    <div className="flex items-center gap-3 px-5 py-3.5 hover:bg-[#FAFAFA] transition-colors">
      {/* Avatar */}
      <div className="w-8 h-8 rounded-full bg-[#FDEFEE] flex items-center justify-center flex-shrink-0">
        <span className="text-xs font-bold text-[#CA6357]">{initials}</span>
      </div>

      {/* Name + email */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-[#1E293B] truncate">{student.user?.name ?? '—'}</p>
        <p className="text-xs text-[#94A3B8] truncate">{student.user?.email ?? ''}</p>
      </div>

      {/* Usage pill */}
      <UsagePill minutes={activeMinutes ?? 0} />

      {/* Status + actions */}
      {isPending ? (
        <Loader2 className="w-4 h-4 text-[#CA6357] animate-spin flex-shrink-0" />
      ) : editing ? (
        /* Override picker */
        <div className="flex items-center gap-1.5 flex-shrink-0 flex-wrap justify-end">
          {OVERRIDE_STATUSES.map((s) => {
            const cfg = STATUS_CONFIG[s];
            const active = effectiveStatus === s;
            return (
              <button
                key={s}
                onClick={() => overrideMutation.mutate(s)}
                title={cfg.label}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl border-2 text-[11px] font-semibold transition-all"
                style={{
                  borderColor:     active ? cfg.color : '#E2E8F0',
                  backgroundColor: active ? cfg.bg    : 'white',
                  color:           cfg.color,
                }}
              >
                <cfg.icon className="w-3 h-3" />
                {cfg.label}
              </button>
            );
          })}
          {hasOverride && (
            <button
              onClick={() => { resetMutation.mutate(); setEditing(false); }}
              title="Reset to auto"
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl border-2 border-[#E2E8F0] text-[11px] font-semibold text-[#475569] hover:bg-[#F8F9FB] transition-all"
            >
              <RotateCcw className="w-3 h-3" /> Auto
            </button>
          )}
          <button
            onClick={() => setEditing(false)}
            className="w-7 h-7 rounded-xl border border-[#E2E8F0] flex items-center justify-center hover:bg-[#F8F9FB]"
          >
            <X className="w-3.5 h-3.5 text-[#94A3B8]" />
          </button>
        </div>
      ) : (
        /* Display mode */
        <div className="flex items-center gap-2 flex-shrink-0">
          {hasOverride && (
            <span className="text-[9px] font-bold uppercase tracking-wider text-[#7C6AF2] bg-[#F2EEFD] px-1.5 py-0.5 rounded">
              Manual
            </span>
          )}
          <StatusPill status={effectiveStatus} dim={!hasOverride && autoStatus === 'absent' && (activeMinutes ?? 0) === 0} />
          <button
            onClick={() => setEditing(true)}
            title="Override attendance"
            className="w-7 h-7 rounded-xl border border-[#E2E8F0] flex items-center justify-center hover:bg-[#FDEFEE] hover:border-[#CA6357] transition-colors"
          >
            <Pencil className="w-3 h-3 text-[#94A3B8]" />
          </button>
        </div>
      )}
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function StaffAttendancePage() {
  const { user } = useAuth();
  const isBranchScoped =
    user?.role === ROLES.BRANCH_COORDINATOR || user?.role === ROLES.BRANCH_ADMIN;

  const [currentDate,   setCurrentDate]   = useState(todayStr);
  const [selectedBatch, setSelectedBatch] = useState(null);

  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ['staff', 'me'],
    queryFn:  staffService.getMyProfile,
  });

  const myBranchIds = useMemo(
    () => new Set((profile?.branches ?? []).map((b) => b._id ?? b)),
    [profile]
  );

  const { data: branchBatches = [], isLoading: branchBatchesLoading } = useQuery({
    queryKey: ['batches', 'active'],
    queryFn:  () => batchService.getAll({ active: 'true' }),
    enabled:  isBranchScoped && myBranchIds.size > 0,
  });

  const myBatches = useMemo(() => {
    if (isBranchScoped) {
      return branchBatches.filter((b) => myBranchIds.has(b.branch?._id ?? b.branch));
    }
    return profile?.batches ?? [];
  }, [isBranchScoped, branchBatches, myBranchIds, profile]);

  const batchesLoading = isBranchScoped ? branchBatchesLoading : false;

  useEffect(() => {
    if (myBatches.length && !selectedBatch) {
      setSelectedBatch(myBatches[0]._id);
    }
  }, [myBatches]);

  const { data: studentsData, isLoading: studentsLoading } = useQuery({
    queryKey: ['students', 'batch', selectedBatch],
    queryFn:  () => studentService.getAll({ batch: selectedBatch, status: 'active', limit: 500 }),
    enabled: !!selectedBatch,
  });
  const students = studentsData?.students ?? [];

  // Manual override records for the date
  const { data: records = [], isLoading: attLoading } = useQuery({
    queryKey: ['attendance', 'date', currentDate],
    queryFn:  () => attendanceService.getAttendanceByDate(currentDate),
    enabled:  !!selectedBatch,
  });

  // App usage → map of studentId → activeMinutes
  const { data: usageMap = {}, isLoading: usageLoading } = useQuery({
    queryKey: ['app-usage', 'date', currentDate],
    queryFn:  () => appUsageService.getUsageByDate(currentDate),
    enabled:  !!selectedBatch,
    refetchInterval: 5 * 60 * 1000,
  });

  const studentIds = useMemo(() => new Set(students.map((s) => s._id)), [students]);

  const overrideMap = useMemo(() => {
    const m = new Map();
    records.forEach((r) => {
      if (studentIds.has(r.student?._id)) m.set(r.student._id, r);
    });
    return m;
  }, [records, studentIds]);

  // Compute effective status for each student
  const counts = useMemo(() => {
    const c = { present: 0, half_day: 0, absent: 0, excused: 0, overridden: 0 };
    students.forEach((s) => {
      const override = overrideMap.get(s._id);
      const status = override
        ? override.status
        : deriveStatus(usageMap[s._id] ?? null);
      if (c[status] !== undefined) c[status]++;
      if (override) c.overridden++;
    });
    return c;
  }, [students, overrideMap, usageMap]);

  const isToday = currentDate === todayStr();
  const prevDay = () => {
    const d = new Date(currentDate); d.setDate(d.getDate() - 1);
    setCurrentDate(toISODate(d));
  };
  const nextDay = () => {
    const d = new Date(currentDate); d.setDate(d.getDate() + 1);
    if (toISODate(d) <= todayStr()) setCurrentDate(toISODate(d));
  };

  const displayDate = new Date(currentDate).toLocaleDateString('en-IN', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });

  const isLoading = studentsLoading || attLoading || usageLoading;

  return (
    <div className="space-y-6 pb-8">

      {/* ── Header ───────────────────────────────────────────────── */}
      <div
        className="relative rounded-2xl overflow-hidden p-6 sm:p-8"
        style={{ background: 'linear-gradient(135deg, #CA6357 0%, #A94E43 100%)' }}
      >
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-white/15 flex items-center justify-center flex-shrink-0">
            <CalendarDays className="w-7 h-7 text-white" strokeWidth={1.8} />
          </div>
          <div className="flex-1">
            <p className="text-xs font-bold tracking-widest text-[#F2B3AC] uppercase mb-1">Auto Attendance</p>
            <h2 className="text-2xl font-bold text-white mb-1">Attendance</h2>
            <p className="text-white/60 text-sm">
              {selectedBatch
                ? `Derived from app usage · ${counts.overridden} manual override${counts.overridden !== 1 ? 's' : ''} today`
                : 'Select a batch to view attendance'}
            </p>
          </div>
          {!isLoading && selectedBatch && students.length > 0 && (
            <div className="sm:ml-auto bg-white/10 rounded-2xl px-5 py-3 text-center flex-shrink-0">
              <p className="text-white/60 text-xs mb-0.5">Full day today</p>
              <p className="text-2xl font-extrabold text-white">
                {counts.present}
                <span className="text-base font-normal text-white/50"> / {students.length}</span>
              </p>
            </div>
          )}
        </div>
      </div>

      {/* ── Batch selector ───────────────────────────────────────── */}
      {(profileLoading || batchesLoading) ? (
        <div className="flex items-center justify-center py-4">
          <Loader2 className="w-5 h-5 text-[#CA6357] animate-spin" />
        </div>
      ) : myBatches.length === 0 ? (
        <div className="bg-white rounded-2xl p-6 flex flex-col items-center gap-3 text-center"
          style={{ boxShadow: '0 2px 16px rgba(0,0,0,0.05)' }}>
          <Layers className="w-8 h-8 text-[#CBD5E1]" strokeWidth={1.5} />
          <p className="text-sm font-bold text-[#1E293B]">No batches found</p>
          <p className="text-xs text-[#94A3B8]">
            {isBranchScoped
              ? 'No active batches exist in your assigned branch yet.'
              : 'Ask an admin to assign you to a batch before viewing attendance.'}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl p-3" style={{ boxShadow: '0 2px 16px rgba(0,0,0,0.05)' }}>
          <div className="flex items-center gap-2 mb-2 px-1">
            <Layers className="w-3.5 h-3.5 text-[#CA6357]" />
            <p className="text-xs font-bold text-[#475569] uppercase tracking-wider">Your Batches</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {myBatches.map((batch) => {
              const active = selectedBatch === batch._id;
              return (
                <button
                  key={batch._id}
                  onClick={() => setSelectedBatch(batch._id)}
                  className="flex items-center gap-2 px-3 py-2 rounded-xl border-2 transition-all text-sm font-semibold"
                  style={{
                    borderColor:     active ? '#CA6357' : '#E2E8F0',
                    backgroundColor: active ? '#FDEFEE' : 'white',
                    color:           active ? '#CA6357' : '#475569',
                  }}
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>{batch.name}</span>
                  {batch.branch && (
                    <span className="flex items-center gap-0.5 text-[10px] font-normal opacity-70">
                      <Building2 className="w-3 h-3" /> {batch.branch.code ?? batch.branch.name}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {selectedBatch && (
        <>
          {/* ── Date navigation ──────────────────────────────────────── */}
          <div className="bg-white rounded-2xl p-4 flex items-center gap-3"
            style={{ boxShadow: '0 2px 16px rgba(0,0,0,0.05)' }}>
            <button onClick={prevDay}
              className="p-2 rounded-xl border border-[#E2E8F0] hover:border-[#CA6357] hover:bg-[#FDEFEE] transition-colors">
              <ChevronLeft className="w-4 h-4 text-[#475569]" />
            </button>
            <div className="flex-1 text-center">
              <p className="text-sm font-bold text-[#1E293B]">{displayDate}</p>
              {isToday && (
                <span className="text-[10px] font-bold text-[#CA6357] bg-[#FDEFEE] px-2 py-0.5 rounded-full">Today</span>
              )}
            </div>
            <button onClick={nextDay} disabled={isToday}
              className="p-2 rounded-xl border border-[#E2E8F0] hover:border-[#CA6357] hover:bg-[#FDEFEE] transition-colors disabled:opacity-30 disabled:cursor-not-allowed">
              <ChevronRight className="w-4 h-4 text-[#475569]" />
            </button>
            <input
              type="date"
              value={currentDate}
              max={todayStr()}
              onChange={(e) => e.target.value && setCurrentDate(e.target.value)}
              className="border border-[#E2E8F0] rounded-xl px-3 py-2 text-sm text-[#1E293B] focus:outline-none focus:border-[#CA6357] focus:ring-1 focus:ring-[#CA6357]"
            />
          </div>

          {/* ── Summary cards ────────────────────────────────────────── */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <SummaryCard label="Full Day"  value={counts.present}  color="#22A66E" bg="#E8F8F2" icon={CheckCircle2} />
            <SummaryCard label="Half Day"  value={counts.half_day} color="#F59E0B" bg="#FFFBEB" icon={Clock}        />
            <SummaryCard label="Absent"    value={counts.absent}   color="#C76D64" bg="#FDEFEE" icon={XCircle}      />
            <SummaryCard label="Excused"   value={counts.excused}  color="#7C6AF2" bg="#F2EEFD" icon={ShieldCheck}  />
          </div>

          {/* ── Attendance list ───────────────────────────────────────── */}
          <div className="bg-white rounded-2xl overflow-hidden"
            style={{ boxShadow: '0 2px 16px rgba(0,0,0,0.05)' }}>
            <div className="px-5 py-4 border-b border-[#F1F5F9] flex items-center justify-between flex-wrap gap-2">
              <div>
                <p className="text-sm font-bold text-[#1E293B]">Student Attendance</p>
                <p className="text-xs text-[#94A3B8] mt-0.5">
                  Auto-derived from app usage — click <Pencil className="w-3 h-3 inline" /> to override
                </p>
              </div>
              <div className="flex items-center gap-3 text-xs text-[#94A3B8]">
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-[#22A66E] inline-block" /> ≥6h full
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-[#F59E0B] inline-block" /> ≥3h half
                </span>
              </div>
            </div>

            {isLoading ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="w-6 h-6 text-[#CA6357] animate-spin" />
              </div>
            ) : students.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 gap-3">
                <Users className="w-10 h-10 text-[#CBD5E1]" strokeWidth={1.5} />
                <p className="text-base font-bold text-[#1E293B]">No students in this batch</p>
                <p className="text-sm text-[#94A3B8]">Students need to be assigned to this batch first.</p>
              </div>
            ) : (
              <div className="divide-y divide-[#F8F9FB]">
                {students.map((student) => (
                  <AttendanceRow
                    key={student._id}
                    student={student}
                    record={overrideMap.get(student._id) ?? null}
                    date={currentDate}
                    activeMinutes={usageMap[student._id] ?? null}
                  />
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
