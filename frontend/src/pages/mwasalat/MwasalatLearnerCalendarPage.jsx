import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Loader2, ChevronLeft, ChevronRight, CalendarDays, Radio, MapPin, ArrowRight } from 'lucide-react';
import { mwasalatProgramService } from '../../services/mwasalatProgram.service.js';
import MwasalatLearnerLayout from '../../layouts/MwasalatLearnerLayout.jsx';
import { getLocalizedProgramField, localizeNumber } from '../../utils/mwasalatLocalize.js';

// Enrollment statuses that actually grant content access — a pending_approval
// or waitlisted enrollment shouldn't surface a session on the calendar since
// the learner doesn't have access to that course yet. Mirrors
// ACCESS_GRANTED_STATUSES in mwasalatProgram.constants.js (not imported
// directly since the frontend has no shared constants module for it).
const ACCESS_GRANTED_STATUSES = ['enrolled', 'in_progress', 'completed'];

const dayKey = (date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

// There's no learner-scoped "my schedule" endpoint on the backend — same as
// the Dashboard's upcoming-sessions widget, this reads the liveScheduledAt/
// iltScheduledAt fields already present on the populated program docs from
// listMyEnrollments(). Unlike the Dashboard widget, this keeps past sessions
// too (not just future ones) so the calendar grid has something to show when
// browsing earlier months.
function sessionsFromEnrollments(enrollments) {
  const sessions = [];
  enrollments
    .filter((e) => ACCESS_GRANTED_STATUSES.includes(e.status))
    .forEach((e) => {
      const p = e.program;
      if (!p) return;
      const types = p.contentTypes ?? [];
      if (types.includes('live') && p.liveScheduledAt) {
        sessions.push({ program: p, scheduledAt: new Date(p.liveScheduledAt), type: 'live' });
      }
      if (types.includes('ilt') && p.iltScheduledAt) {
        sessions.push({ program: p, scheduledAt: new Date(p.iltScheduledAt), type: 'ilt' });
      }
    });
  return sessions.sort((a, b) => a.scheduledAt - b.scheduledAt);
}

function getMonthGrid(year, month) {
  const firstOfMonth = new Date(year, month, 1);
  const startWeekday = firstOfMonth.getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrevMonth = new Date(year, month, 0).getDate();

  const cells = [];
  for (let i = startWeekday - 1; i >= 0; i -= 1) {
    cells.push({ date: new Date(year, month - 1, daysInPrevMonth - i), inMonth: false });
  }
  for (let d = 1; d <= daysInMonth; d += 1) {
    cells.push({ date: new Date(year, month, d), inMonth: true });
  }
  while (cells.length % 7 !== 0) {
    const last = cells[cells.length - 1].date;
    cells.push({ date: new Date(last.getFullYear(), last.getMonth(), last.getDate() + 1), inMonth: false });
  }
  return cells;
}

function SessionTypeBadge({ type, t }) {
  return (
    <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-medium flex-shrink-0 ${
      type === 'live' ? 'bg-mwasalatRed-100 text-mwasalatRed-600' : 'bg-[#EDE9FE] text-[#7C6AF2]'
    }`}>
      {type === 'live' ? <Radio className="w-2.5 h-2.5" /> : <MapPin className="w-2.5 h-2.5" />}
      {t(type === 'live' ? 'learner.calendar.liveLabel' : 'learner.calendar.iltLabel')}
    </span>
  );
}

function SessionRow({ session, i18n, t }) {
  const dateLocale = i18n.language === 'ar' ? 'ar-OM' : 'en-GB';
  const title = getLocalizedProgramField(session.program, 'title', i18n.language);

  return (
    <Link
      to={`/learner/programs/${session.program._id}`}
      className="flex items-center gap-2.5 py-2.5 -mx-1.5 px-1.5 rounded-lg hover:bg-[#F8F9FB] transition-colors"
    >
      <div className="w-10 h-10 rounded-lg bg-mwasalatInk-100 flex flex-col items-center justify-center flex-shrink-0 text-mwasalatInk-500 leading-none">
        <span className="text-sm font-bold">{localizeNumber(session.scheduledAt.getDate(), i18n.language)}</span>
        <span className="text-[8px] uppercase mt-0.5">{session.scheduledAt.toLocaleDateString(dateLocale, { month: 'short' })}</span>
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[12.5px] font-medium text-[#1E293B] truncate">{title}</p>
        <p className="text-[10.5px] text-[#94A3B8]" dir="ltr">
          {session.scheduledAt.toLocaleTimeString(dateLocale, { hour: 'numeric', minute: '2-digit' })}
          {session.type === 'ilt' && session.program.iltVenue ? ` · ${session.program.iltVenue}` : ''}
        </p>
      </div>
      <SessionTypeBadge type={session.type} t={t} />
    </Link>
  );
}

export default function MwasalatLearnerCalendarPage() {
  const { t, i18n } = useTranslation('mwasalatApp');
  const [enrollments, setEnrollments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const today = useMemo(() => new Date(), []);
  const [viewMonth, setViewMonth] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const [selectedDate, setSelectedDate] = useState(today);

  useEffect(() => {
    setIsLoading(true);
    mwasalatProgramService.listMyEnrollments()
      .then(setEnrollments)
      .finally(() => setIsLoading(false));
  }, []);

  const sessions = useMemo(() => sessionsFromEnrollments(enrollments), [enrollments]);

  const sessionsByDate = useMemo(() => {
    const map = {};
    sessions.forEach((s) => {
      const key = dayKey(s.scheduledAt);
      (map[key] ??= []).push(s);
    });
    return map;
  }, [sessions]);

  const upcomingSessions = useMemo(
    () => sessions.filter((s) => s.scheduledAt >= today).slice(0, 8),
    [sessions, today]
  );

  const cells = useMemo(
    () => getMonthGrid(viewMonth.getFullYear(), viewMonth.getMonth()),
    [viewMonth]
  );

  const dateLocale = i18n.language === 'ar' ? 'ar-OM' : 'en-GB';
  const weekdayLabels = useMemo(() => {
    // Jan 4–10 2026 is a reference week starting on a Sunday — used purely to
    // get locale-correct short weekday names, not tied to the visible month.
    return Array.from({ length: 7 }, (_, i) => new Date(2026, 0, 4 + i).toLocaleDateString(dateLocale, { weekday: 'short' }));
  }, [dateLocale]);

  const selectedKey = dayKey(selectedDate);
  const selectedSessions = sessionsByDate[selectedKey] ?? [];
  const todayKey = dayKey(today);

  const goToMonth = (offset) => {
    setViewMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() + offset, 1));
  };

  const goToToday = () => {
    setViewMonth(new Date(today.getFullYear(), today.getMonth(), 1));
    setSelectedDate(today);
  };

  return (
    <MwasalatLearnerLayout title={t('learner.calendar.title')} subtitle={t('learner.calendar.subtitle')}>
      {isLoading ? (
        <div className="p-10 flex items-center justify-center text-[#94A3B8]">
          <Loader2 className="w-5 h-5 animate-spin me-2" /> {t('learner.calendar.loading')}
        </div>
      ) : sessions.length === 0 ? (
        <div className="card p-14 text-center max-w-lg mx-auto rounded-2xl shadow-sm">
          <div className="w-16 h-16 rounded-2xl bg-mwasalatInk-100 text-mwasalatInk-500 flex items-center justify-center mx-auto mb-5">
            <CalendarDays className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-[#1E293B] mb-2">{t('learner.calendar.emptyStateTitle')}</h2>
          <p className="text-sm text-[#475569] leading-relaxed">{t('learner.calendar.emptyStateBody')}</p>
        </div>
      ) : (
        <div className="grid lg:grid-cols-3 gap-4">
          {/* Calendar grid */}
          <div className="lg:col-span-2 min-w-0">
            <div className="card p-3.5">
              <div className="flex items-center justify-between mb-3.5">
                <h2 className="text-[13px] font-semibold text-[#1E293B]">
                  {viewMonth.toLocaleDateString(dateLocale, { month: 'long', year: 'numeric' })}
                </h2>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={goToToday}
                    className="text-[11.5px] font-medium text-mwasalatInk-500 hover:bg-mwasalatInk-100 px-2.5 py-1 rounded-lg transition-colors"
                  >
                    {t('learner.calendar.today')}
                  </button>
                  <button
                    type="button"
                    onClick={() => goToMonth(-1)}
                    aria-label="Previous month"
                    className="w-7 h-7 rounded-lg flex items-center justify-center text-[#475569] hover:bg-[#F1F5F9] transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4 rtl:rotate-180" />
                  </button>
                  <button
                    type="button"
                    onClick={() => goToMonth(1)}
                    aria-label="Next month"
                    className="w-7 h-7 rounded-lg flex items-center justify-center text-[#475569] hover:bg-[#F1F5F9] transition-colors"
                  >
                    <ChevronRight className="w-4 h-4 rtl:rotate-180" />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-7 mb-1">
                {weekdayLabels.map((label) => (
                  <div key={label} className="text-center text-[10px] font-semibold uppercase tracking-wide text-[#94A3B8] py-1.5">
                    {label}
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-7 gap-1">
                {cells.map(({ date, inMonth }) => {
                  const key = dayKey(date);
                  const daySessions = sessionsByDate[key] ?? [];
                  const isToday = key === todayKey;
                  const isSelected = key === selectedKey;
                  const hasLive = daySessions.some((s) => s.type === 'live');
                  const hasIlt = daySessions.some((s) => s.type === 'ilt');

                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setSelectedDate(date)}
                      className={`aspect-square rounded-lg flex flex-col items-center justify-center gap-1 text-[12px] font-medium transition-colors relative ${
                        !inMonth ? 'text-[#CBD5E1]' : 'text-[#1E293B]'
                      } ${isSelected ? 'bg-mwasalatRed-600 text-white' : isToday ? 'bg-mwasalatInk-100' : 'hover:bg-[#F1F5F9]'}`}
                    >
                      <span>{localizeNumber(date.getDate(), i18n.language)}</span>
                      {(hasLive || hasIlt) && (
                        <span className="flex items-center gap-0.5">
                          {hasLive && <span className={`w-1 h-1 rounded-full ${isSelected ? 'bg-white' : 'bg-mwasalatRed-500'}`} />}
                          {hasIlt && <span className={`w-1 h-1 rounded-full ${isSelected ? 'bg-white' : 'bg-[#7C6AF2]'}`} />}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Selected day detail */}
            <div className="card p-3.5 mt-4">
              <h2 className="text-[13px] font-semibold text-[#1E293B] mb-3">
                {selectedDate.toLocaleDateString(dateLocale, { weekday: 'long', month: 'long', day: 'numeric' })}
              </h2>
              {selectedSessions.length === 0 ? (
                <p className="text-[11.5px] text-[#94A3B8]">{t('learner.calendar.noSessionsForDay')}</p>
              ) : (
                <div className="space-y-2.5">
                  {selectedSessions.map((s) => {
                    const title = getLocalizedProgramField(s.program, 'title', i18n.language);
                    return (
                      <div key={`${s.program._id}-${s.type}`} className="flex items-center gap-3 p-2.5 rounded-lg bg-[#F8F9FB]">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5 mb-1">
                            <SessionTypeBadge type={s.type} t={t} />
                            <span dir="ltr" className="text-[11px] text-[#475569]">
                              {s.scheduledAt.toLocaleTimeString(dateLocale, { hour: 'numeric', minute: '2-digit' })}
                            </span>
                          </div>
                          <p className="text-[13px] font-medium text-[#1E293B] truncate">{title}</p>
                          {s.type === 'ilt' && s.program.iltVenue && (
                            <p className="text-[11px] text-[#94A3B8] mt-0.5">{s.program.iltVenue}</p>
                          )}
                        </div>
                        <Link
                          to={`/learner/programs/${s.program._id}`}
                          className="inline-flex items-center gap-1 text-[11.5px] font-semibold text-mwasalatInk-500 hover:underline flex-shrink-0"
                        >
                          {t('learner.calendar.viewCourse')} <ArrowRight className="w-3 h-3 rtl:rotate-180" />
                        </Link>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Upcoming sessions sidebar */}
          <div className="min-w-0">
            <div className="card p-3.5">
              <h2 className="text-[13px] font-semibold text-[#1E293B] mb-1.5">{t('learner.calendar.upcomingHeading')}</h2>
              {upcomingSessions.length === 0 ? (
                <p className="text-[11.5px] text-[#94A3B8] py-2">{t('learner.calendar.upcomingEmpty')}</p>
              ) : (
                <div className="divide-y divide-[#F1F5F9]">
                  {upcomingSessions.map((s) => (
                    <SessionRow key={`${s.program._id}-${s.type}`} session={s} i18n={i18n} t={t} />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </MwasalatLearnerLayout>
  );
}
