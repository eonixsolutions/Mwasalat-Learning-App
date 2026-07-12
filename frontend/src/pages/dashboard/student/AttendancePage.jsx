import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  CheckCircle2, XCircle, Clock, ShieldCheck, Loader2,
  CalendarDays, TrendingUp, MonitorSmartphone, ChevronLeft, ChevronRight,
  Calendar, AlignLeft,
} from 'lucide-react';
import { attendanceService } from '../../../services/attendance.service.js';
import { appUsageService } from '../../../services/appUsage.service.js';

// ── constants ────────────────────────────────────────────────────────────────

const STATUS_CONFIG = {
  present:  { label: 'Present',   color: '#22A66E', bg: '#E8F8F2',  icon: CheckCircle2, dot: 'bg-[#22A66E]' },
  half_day: { label: 'Half Day',  color: '#F59E0B', bg: '#FFFBEB',  icon: Clock,        dot: 'bg-[#F59E0B]' },
  late:     { label: 'Late',      color: '#F59E0B', bg: '#FFFBEB',  icon: Clock,        dot: 'bg-[#F59E0B]' },
  absent:   { label: 'Absent',    color: '#C76D64', bg: '#FDEFEE',  icon: XCircle,      dot: 'bg-[#C76D64]' },
  excused:  { label: 'Excused',   color: '#7C6AF2', bg: '#F2EEFD',  icon: ShieldCheck,  dot: 'bg-[#7C6AF2]' },
};

const PRESETS = [
  { key: 'today',      label: 'Today' },
  { key: 'this_week',  label: 'This Week' },
  { key: 'last_week',  label: 'Last Week' },
  { key: 'this_month', label: 'This Month' },
  { key: 'last_month', label: 'Last Month' },
  { key: 'all',        label: 'All Time' },
  { key: 'custom',     label: 'Custom' },
];

// ── helpers ──────────────────────────────────────────────────────────────────

const isoDate = (d) => {
  const dd = new Date(d);
  return `${dd.getFullYear()}-${String(dd.getMonth() + 1).padStart(2, '0')}-${String(dd.getDate()).padStart(2, '0')}`;
};

const today0 = () => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
};

const presetToRange = (preset) => {
  const t = today0();
  switch (preset) {
    case 'today':
      return { start: t, end: t };
    case 'this_week': {
      const dow = t.getDay();
      const mon = new Date(t);
      mon.setDate(t.getDate() - (dow === 0 ? 6 : dow - 1));
      return { start: mon, end: t };
    }
    case 'last_week': {
      const dow = t.getDay();
      const thisMon = new Date(t);
      thisMon.setDate(t.getDate() - (dow === 0 ? 6 : dow - 1));
      const lastMon = new Date(thisMon);
      lastMon.setDate(thisMon.getDate() - 7);
      const lastSun = new Date(thisMon);
      lastSun.setDate(thisMon.getDate() - 1);
      return { start: lastMon, end: lastSun };
    }
    case 'this_month': {
      const start = new Date(t.getFullYear(), t.getMonth(), 1);
      return { start, end: t };
    }
    case 'last_month': {
      const start = new Date(t.getFullYear(), t.getMonth() - 1, 1);
      const end = new Date(t.getFullYear(), t.getMonth(), 0);
      return { start, end };
    }
    default:
      return { start: null, end: null };
  }
};

const getDaysInRange = (start, end) => {
  if (!start || !end) return [];
  const days = [];
  const cur = new Date(start);
  const last = new Date(end);
  while (cur <= last) {
    days.push(new Date(cur));
    cur.setDate(cur.getDate() + 1);
  }
  return days;
};

const buildDayMap = (records, usage) => {
  const map = {};
  (records ?? []).forEach((r) => { map[isoDate(r.date)] = { ...map[isoDate(r.date)], override: r }; });
  (usage   ?? []).forEach((u) => { map[isoDate(u.date)] = { ...map[isoDate(u.date)], usage: u   }; });
  return map;
};

const effectiveStatus = (entry) => {
  if (!entry) return null;
  if (entry.override) return entry.override.status;
  if (entry.usage) {
    const m = entry.usage.activeMinutes ?? 0;
    if (m >= 360) return 'present';
    if (m >= 180) return 'half_day';
    if (m > 0)   return 'half_day';
  }
  return null;
};

const computePeriodStats = (days, dayMap) => {
  const t = today0();
  let total = 0, present = 0, late = 0, absent = 0, excused = 0, half_day = 0;
  days.forEach((day) => {
    if (day > t) return;
    if (day.getDay() === 0) return; // skip Sundays
    const entry = dayMap[isoDate(day)];
    if (!entry) return; // no data for this day, don't count
    total++;
    const s = effectiveStatus(entry);
    if (s === 'present')  present++;
    else if (s === 'late')     late++;
    else if (s === 'absent')   absent++;
    else if (s === 'excused')  excused++;
    else if (s === 'half_day') half_day++;
  });
  const pct = total > 0 ? Math.round(((present + late + half_day * 0.5) / total) * 100) : 0;
  return { total, present, late, absent, excused, half_day, percentage: pct };
};

const pctColor = (p) => p >= 75 ? '#22A66E' : p >= 50 ? '#F59E0B' : '#EF4444';
const pctBg    = (p) => p >= 75 ? '#E8F8F2' : p >= 50 ? '#FFFBEB' : '#FEF2F2';
const pctLabel = (p) => p >= 75 ? 'Good Standing' : p >= 50 ? 'Needs Improvement' : 'At Risk';

// ── sub-components ───────────────────────────────────────────────────────────

function StatCard({ label, value, sub, color, bg, icon: Icon }) {
  return (
    <div className="bg-white rounded-2xl p-5" style={{ boxShadow: '0 2px 16px rgba(0,0,0,0.05)' }}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs text-[#94A3B8] font-medium mb-1">{label}</p>
          <p className="text-2xl font-extrabold text-[#1E293B]">{value}</p>
          {sub && <p className="text-xs text-[#94A3B8] mt-0.5">{sub}</p>}
        </div>
        <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: bg }}>
          <Icon className="w-5 h-5" style={{ color }} />
        </div>
      </div>
    </div>
  );
}

function AttendanceBadge({ status }) {
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.absent;
  const Icon = cfg.icon;
  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full"
      style={{ backgroundColor: cfg.bg, color: cfg.color }}>
      <Icon className="w-3.5 h-3.5" />{cfg.label}
    </span>
  );
}

const WEEK_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

function DayCell({ day, entry, compact = false }) {
  const status = effectiveStatus(entry);
  const cfg    = status ? STATUS_CONFIG[status] : null;
  const t      = today0();
  const isFuture = day > t;
  const isToday  = isoDate(day) === isoDate(t);
  const isSun    = day.getDay() === 0;
  const mins     = entry?.usage?.activeMinutes ?? 0;

  const bg    = cfg ? cfg.bg : isSun ? '#F8F9FB' : '#F1F5F9';
  const color = cfg ? cfg.color : '#CBD5E1';

  return (
    <div className={`relative flex flex-col items-center justify-center rounded-xl transition-opacity ${isFuture ? 'opacity-30' : ''} ${compact ? 'p-1.5 aspect-square' : 'p-3'}`}
      style={{ backgroundColor: bg }}>
      {isToday && <div className="absolute inset-0 rounded-xl ring-2 ring-[#CA6357] pointer-events-none" />}
      {!compact && (
        <p className="text-[10px] font-medium mb-0.5" style={{ color: cfg ? cfg.color : '#94A3B8' }}>
          {day.toLocaleDateString('en-IN', { weekday: 'short' })}
        </p>
      )}
      <p className={`font-bold leading-none ${compact ? 'text-xs' : 'text-lg'}`} style={{ color }}>
        {day.getDate()}
      </p>
      {!compact && cfg && (
        <p className="text-[9px] font-bold mt-1 text-center leading-tight" style={{ color: cfg.color }}>
          {cfg.label}
        </p>
      )}
      {!compact && !cfg && mins > 0 && !isFuture && (
        <p className="text-[9px] text-[#94A3B8] mt-1">{Math.round(mins / 60)}h</p>
      )}
      {compact && cfg && (
        <div className="w-1.5 h-1.5 rounded-full mt-0.5" style={{ backgroundColor: cfg.color }} />
      )}
    </div>
  );
}

function WeekCalendar({ days, dayMap }) {
  return (
    <div className="grid grid-cols-7 gap-2">
      {WEEK_LABELS.map((l) => (
        <p key={l} className="text-center text-[10px] font-bold text-[#94A3B8] uppercase pb-1">{l}</p>
      ))}
      {days.map((day) => (
        <DayCell key={isoDate(day)} day={day} entry={dayMap[isoDate(day)]} />
      ))}
    </div>
  );
}

function MonthCalendar({ start, dayMap }) {
  const [offset, setOffset] = useState(0);
  const year  = start.getFullYear();
  const month = start.getMonth() + offset;
  const base  = new Date(year, month, 1);
  const last  = new Date(year, month + 1, 0);
  const pad   = (base.getDay() + 6) % 7; // Monday-indexed

  const cells = [];
  for (let i = 0; i < pad; i++) cells.push(null);
  for (let d = 1; d <= last.getDate(); d++) cells.push(new Date(year, month, d));
  while (cells.length % 7 !== 0) cells.push(null);

  const monthLabel = base.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <button onClick={() => setOffset((o) => o - 1)}
          className="p-1.5 rounded-xl hover:bg-[#F1F5F9] transition-colors">
          <ChevronLeft className="w-4 h-4 text-[#475569]" />
        </button>
        <p className="text-sm font-bold text-[#1E293B]">{monthLabel}</p>
        <button onClick={() => setOffset((o) => o + 1)}
          disabled={offset >= 0}
          className="p-1.5 rounded-xl hover:bg-[#F1F5F9] transition-colors disabled:opacity-30 disabled:cursor-not-allowed">
          <ChevronRight className="w-4 h-4 text-[#475569]" />
        </button>
      </div>
      <div className="grid grid-cols-7 gap-1 mb-1">
        {WEEK_LABELS.map((l) => (
          <p key={l} className="text-center text-[9px] font-bold text-[#94A3B8] uppercase">{l}</p>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {cells.map((day, i) =>
          day ? (
            <DayCell key={isoDate(day)} day={day} entry={dayMap[isoDate(day)]} compact />
          ) : (
            <div key={`pad-${i}`} />
          )
        )}
      </div>
    </div>
  );
}

// ── page ─────────────────────────────────────────────────────────────────────

export default function AttendancePage() {
  const [preset, setPreset]       = useState('this_month');
  const [customStart, setCS]      = useState('');
  const [customEnd, setCE]        = useState('');
  const [viewMode, setViewMode]   = useState('calendar'); // 'calendar' | 'list'

  // Compute API date params from preset or custom
  const { apiStart, apiEnd, rangeStart, rangeEnd } = useMemo(() => {
    if (preset === 'custom') {
      return {
        apiStart:   customStart || undefined,
        apiEnd:     customEnd   || undefined,
        rangeStart: customStart ? new Date(customStart) : null,
        rangeEnd:   customEnd   ? new Date(customEnd)   : null,
      };
    }
    if (preset === 'all') return { apiStart: undefined, apiEnd: undefined, rangeStart: null, rangeEnd: null };
    const { start, end } = presetToRange(preset);
    return {
      apiStart:   isoDate(start),
      apiEnd:     isoDate(end),
      rangeStart: start,
      rangeEnd:   end,
    };
  }, [preset, customStart, customEnd]);

  const queryParams = { startDate: apiStart, endDate: apiEnd };

  const { data, isLoading, isError } = useQuery({
    queryKey: ['attendance', 'me', queryParams],
    queryFn:  () => attendanceService.getMyAttendance(queryParams),
  });

  const { data: todayUsage } = useQuery({
    queryKey: ['app-usage', 'today'],
    queryFn:  appUsageService.getMyUsageToday,
    refetchInterval: 5 * 60 * 1000,
  });

  const { data: usageRange = [] } = useQuery({
    queryKey: ['app-usage', 'range', apiStart, apiEnd],
    queryFn:  () => appUsageService.getMyUsageRange(apiStart, apiEnd),
    enabled:  preset !== 'all' && (!!apiStart || !!apiEnd),
    staleTime: 60_000,
  });

  const records    = data?.records ?? [];
  const overallStats = data?.stats ?? { total: 0, present: 0, late: 0, absent: 0, excused: 0, percentage: 0 };

  const dayMap = useMemo(() => buildDayMap(records, usageRange), [records, usageRange]);

  const daysInRange = useMemo(
    () => rangeStart && rangeEnd ? getDaysInRange(rangeStart, rangeEnd) : [],
    [rangeStart, rangeEnd]
  );

  const periodStats = useMemo(() => {
    if (preset === 'all' || !rangeStart) return overallStats;
    return computePeriodStats(daysInRange, dayMap);
  }, [preset, daysInRange, dayMap, overallStats, rangeStart]);

  const showCalendar = preset !== 'all' && rangeStart && viewMode === 'calendar';
  const isMonthView  = (preset === 'this_month' || preset === 'last_month') ||
                       (preset === 'custom' && daysInRange.length > 7);
  const isWeekView   = preset === 'this_week' || preset === 'last_week' || preset === 'today' ||
                       (preset === 'custom' && daysInRange.length <= 7);

  const pct = overallStats.percentage;

  return (
    <div className="space-y-6 pb-8">

      {/* ── Hero ───────────────────────────────────────────────────────── */}
      <div className="relative rounded-2xl overflow-hidden p-6 sm:p-8"
        style={{ background: 'linear-gradient(135deg, #CA6357 0%, #A94E43 100%)' }}>
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center gap-5">
          <div className="w-14 h-14 rounded-2xl bg-white/15 flex items-center justify-center flex-shrink-0">
            <CalendarDays className="w-7 h-7 text-white" strokeWidth={1.8} />
          </div>
          <div className="flex-1">
            <p className="text-xs font-bold tracking-widest text-[#F2B3AC] uppercase mb-1">My Attendance</p>
            <h2 className="text-2xl font-bold text-white mb-1">Attendance Record</h2>
            <p className="text-white/60 text-sm">Track your daily presence and attendance history</p>
          </div>
          {!isLoading && !isError && (
            <div className="sm:ml-auto bg-white/10 rounded-2xl px-5 py-4 flex items-center gap-4">
              <div>
                <p className="text-white/60 text-xs mb-0.5">Overall Rate</p>
                <p className="text-3xl font-extrabold" style={{ color: pctColor(pct) }}>{pct}%</p>
                <p className="text-white/50 text-xs">{overallStats.present + overallStats.late} / {overallStats.total} days</p>
              </div>
              <div className="relative w-12 h-12">
                <svg className="w-12 h-12 -rotate-90" viewBox="0 0 48 48">
                  <circle cx="24" cy="24" r="18" fill="none" stroke="white" strokeOpacity="0.15" strokeWidth="4" />
                  <circle cx="24" cy="24" r="18" fill="none"
                    stroke={pctColor(pct)} strokeWidth="4" strokeLinecap="round"
                    strokeDasharray={`${2 * Math.PI * 18}`}
                    strokeDashoffset={`${2 * Math.PI * 18 * (1 - pct / 100)}`} />
                </svg>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Today's app usage ──────────────────────────────────────────── */}
      {todayUsage != null && (() => {
        const mins = todayUsage.activeMinutes ?? 0;
        const hrs  = Math.floor(mins / 60);
        const rem  = mins % 60;
        const label = mins >= 360 ? 'Full day' : mins >= 180 ? 'Half day' : mins > 0 ? 'Low usage' : 'Not started';
        const color = mins >= 360 ? '#22A66E' : mins >= 180 ? '#F59E0B' : '#94A3B8';
        const bg    = mins >= 360 ? '#E8F8F2' : mins >= 180 ? '#FFFBEB' : '#F1F5F9';
        return (
          <div className="bg-white rounded-2xl p-5 flex items-center gap-4"
            style={{ boxShadow: '0 2px 16px rgba(0,0,0,0.05)' }}>
            <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: bg }}>
              <MonitorSmartphone className="w-5 h-5" style={{ color }} />
            </div>
            <div className="flex-1">
              <p className="text-xs text-[#94A3B8] font-medium">Today's App Usage</p>
              <p className="text-lg font-extrabold text-[#1E293B]">{hrs > 0 ? `${hrs}h ` : ''}{rem}m</p>
              <p className="text-xs mt-0.5 font-semibold" style={{ color }}>{label}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-[#94A3B8]">≥ 6h = full day</p>
              <p className="text-xs text-[#94A3B8]">≥ 3h = half day</p>
            </div>
          </div>
        );
      })()}

      {/* ── Range selector ─────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl p-4" style={{ boxShadow: '0 2px 16px rgba(0,0,0,0.05)' }}>
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
          {PRESETS.map((p) => (
            <button
              key={p.key}
              onClick={() => setPreset(p.key)}
              className={`flex-shrink-0 px-4 py-2 rounded-xl text-xs font-bold transition-colors whitespace-nowrap ${
                preset === p.key
                  ? 'bg-[#CA6357] text-white'
                  : 'bg-[#F1F5F9] text-[#475569] hover:bg-[#FDEFEE] hover:text-[#CA6357]'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>

        {/* Custom date inputs */}
        {preset === 'custom' && (
          <div className="flex flex-col sm:flex-row gap-3 mt-4 pt-4 border-t border-[#F1F5F9]">
            <div className="flex-1">
              <label className="block text-xs font-medium text-[#475569] mb-1">From</label>
              <input type="date" value={customStart} onChange={(e) => setCS(e.target.value)}
                className="w-full border border-[#E2E8F0] rounded-xl px-3 py-2 text-sm text-[#1E293B] focus:outline-none focus:border-[#CA6357] focus:ring-1 focus:ring-[#CA6357]" />
            </div>
            <div className="flex-1">
              <label className="block text-xs font-medium text-[#475569] mb-1">To</label>
              <input type="date" value={customEnd} onChange={(e) => setCE(e.target.value)}
                className="w-full border border-[#E2E8F0] rounded-xl px-3 py-2 text-sm text-[#1E293B] focus:outline-none focus:border-[#CA6357] focus:ring-1 focus:ring-[#CA6357]" />
            </div>
          </div>
        )}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 text-[#CA6357] animate-spin" /></div>
      ) : isError ? (
        <div className="bg-white rounded-2xl p-10 text-center" style={{ boxShadow: '0 2px 16px rgba(0,0,0,0.05)' }}>
          <XCircle className="w-10 h-10 text-[#FECACA] mx-auto mb-3" strokeWidth={1.5} />
          <p className="text-sm text-[#94A3B8]">Failed to load attendance records.</p>
        </div>
      ) : (
        <>
          {/* ── Period stats ─────────────────────────────────────────────── */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <StatCard label="Period Days"   value={periodStats.total}    sub="Days with data"
              color="#CA6357" bg="#FDEFEE" icon={CalendarDays} />
            <StatCard label="Present"       value={periodStats.present}  sub={`+${periodStats.late} late`}
              color="#22A66E" bg="#E8F8F2" icon={CheckCircle2} />
            <StatCard label="Absent"        value={periodStats.absent}
              color="#C76D64" bg="#FDEFEE" icon={XCircle} />
            <StatCard label="Excused"       value={periodStats.excused}
              color="#7C6AF2" bg="#F2EEFD" icon={ShieldCheck} />
          </div>

          {/* ── Attendance rate bar ───────────────────────────────────────── */}
          {periodStats.total > 0 && (
            <div className="bg-white rounded-2xl p-5" style={{ boxShadow: '0 2px 16px rgba(0,0,0,0.05)' }}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-[#CA6357]" />
                  <p className="text-sm font-semibold text-[#1E293B]">
                    {preset === 'all' ? 'Overall Breakdown' : 'Period Breakdown'}
                  </p>
                </div>
                <span className="text-xs font-bold px-2.5 py-1 rounded-full"
                  style={{ backgroundColor: pctBg(periodStats.percentage), color: pctColor(periodStats.percentage) }}>
                  {pctLabel(periodStats.percentage)}
                </span>
              </div>
              <div className="h-3 rounded-full overflow-hidden bg-[#F1F5F9] flex">
                {periodStats.present > 0 && (
                  <div className="h-full bg-[#22A66E] transition-all duration-700"
                    style={{ width: `${(periodStats.present / periodStats.total) * 100}%` }} />
                )}
                {periodStats.late > 0 && (
                  <div className="h-full bg-[#F59E0B] transition-all duration-700"
                    style={{ width: `${(periodStats.late / periodStats.total) * 100}%` }} />
                )}
                {periodStats.excused > 0 && (
                  <div className="h-full bg-[#7C6AF2] transition-all duration-700"
                    style={{ width: `${(periodStats.excused / periodStats.total) * 100}%` }} />
                )}
                {periodStats.absent > 0 && (
                  <div className="h-full bg-[#FECACA] transition-all duration-700"
                    style={{ width: `${(periodStats.absent / periodStats.total) * 100}%` }} />
                )}
              </div>
              <div className="flex flex-wrap gap-4 mt-3">
                {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
                  <div key={key} className="flex items-center gap-1.5">
                    <div className={`w-2.5 h-2.5 rounded-full ${cfg.dot}`} />
                    <span className="text-xs text-[#475569]">{cfg.label}: <strong>{periodStats[key] ?? 0}</strong></span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── Calendar / list toggle + view ────────────────────────────── */}
          {showCalendar && (
            <div className="bg-white rounded-2xl p-5" style={{ boxShadow: '0 2px 16px rgba(0,0,0,0.05)' }}>
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm font-bold text-[#1E293B]">
                  {isMonthView ? 'Monthly View' : 'Weekly View'}
                </p>
                <div className="flex items-center gap-1 bg-[#F1F5F9] rounded-xl p-1">
                  <button onClick={() => setViewMode('calendar')}
                    className={`p-1.5 rounded-lg transition-colors ${viewMode === 'calendar' ? 'bg-white shadow-sm' : 'hover:bg-white/60'}`}>
                    <Calendar className="w-4 h-4 text-[#CA6357]" />
                  </button>
                  <button onClick={() => setViewMode('list')}
                    className={`p-1.5 rounded-lg transition-colors ${viewMode === 'list' ? 'bg-white shadow-sm' : 'hover:bg-white/60'}`}>
                    <AlignLeft className="w-4 h-4 text-[#CA6357]" />
                  </button>
                </div>
              </div>

              {isMonthView ? (
                <MonthCalendar start={rangeStart} dayMap={dayMap} />
              ) : (
                <WeekCalendar days={daysInRange} dayMap={dayMap} />
              )}

              {/* Legend */}
              <div className="flex flex-wrap gap-3 mt-4 pt-4 border-t border-[#F1F5F9]">
                {Object.entries(STATUS_CONFIG).slice(0, 4).map(([key, cfg]) => (
                  <div key={key} className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: cfg.color }} />
                    <span className="text-xs text-[#475569]">{cfg.label}</span>
                  </div>
                ))}
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-[#CBD5E1]" />
                  <span className="text-xs text-[#94A3B8]">No data</span>
                </div>
              </div>
            </div>
          )}

          {/* ── Records list (manual overrides) ──────────────────────────── */}
          <div className="bg-white rounded-2xl overflow-hidden" style={{ boxShadow: '0 2px 16px rgba(0,0,0,0.05)' }}>
            <div className="px-6 py-4 border-b border-[#F1F5F9] flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-[#1E293B]">Coordinator Overrides</p>
                <p className="text-xs text-[#94A3B8] mt-0.5">
                  {records.length > 0 ? `${records.length} record${records.length !== 1 ? 's' : ''}` : 'Manually marked records only'}
                </p>
              </div>
            </div>

            {records.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 gap-3">
                <CalendarDays className="w-10 h-10 text-[#CBD5E1]" strokeWidth={1.5} />
                <p className="text-base font-bold text-[#1E293B]">No overrides in this period</p>
                <p className="text-sm text-[#94A3B8] max-w-sm text-center">
                  Attendance is tracked automatically via app usage. Coordinator marks appear here when made.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-[#F8F9FB]">
                {records.map((rec) => {
                  const d = new Date(rec.date);
                  const usage = dayMap[isoDate(d)]?.usage;
                  const mins  = usage?.activeMinutes ?? null;
                  return (
                    <div key={rec._id} className="flex items-center gap-4 px-6 py-4 hover:bg-[#FAFAFA] transition-colors">
                      <div className="w-12 text-center flex-shrink-0">
                        <p className="text-xs text-[#94A3B8] font-medium">
                          {d.toLocaleDateString('en-IN', { weekday: 'short' })}
                        </p>
                        <p className="text-base font-bold text-[#1E293B]">{d.getDate()}</p>
                        <p className="text-xs text-[#94A3B8]">
                          {d.toLocaleDateString('en-IN', { month: 'short' })}
                        </p>
                      </div>
                      <div className="w-px h-10 bg-[#F1F5F9] flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-[#1E293B]">
                          {d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </p>
                        {rec.note && <p className="text-xs text-[#94A3B8] mt-0.5 truncate">{rec.note}</p>}
                        {rec.markedBy && (
                          <p className="text-xs text-[#CBD5E1] mt-0.5">Marked by {rec.markedBy.name}</p>
                        )}
                        {mins !== null && (
                          <p className="text-xs text-[#94A3B8] mt-0.5">
                            App usage: {Math.floor(mins / 60)}h {mins % 60}m
                          </p>
                        )}
                      </div>
                      <AttendanceBadge status={rec.status} />
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
