import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { BookOpen, Plus, Loader2, ChevronRight, Pencil, CheckCircle2, Archive, Users, AlertTriangle, ArrowRight, Megaphone, Send, Clock, PieChart } from 'lucide-react';
import { useMwasalatAuthStore } from '../../store/mwasalatAuthStore.js';
import { mwasalatProgramService } from '../../services/mwasalatProgram.service.js';
import { mwasalatNotificationService } from '../../services/mwasalatNotification.service.js';
import MwasalatInstructorLayout from '../../layouts/MwasalatInstructorLayout.jsx';
import MwasalatNeedsAttentionRow from '../../components/mwasalat/MwasalatNeedsAttentionRow.jsx';
import { DonutChart } from '../../components/mwasalat/MwasalatCharts.jsx';
import { themeForCategory } from '../../utils/mwasalatCategoryTheme.js';
import { getLocalizedProgramField, localizeNumber } from '../../utils/mwasalatLocalize.js';

const NEEDS_ATTENTION_PREVIEW_SIZE = 5;
const PROGRAMS_PREVIEW_SIZE = 5;

// Same modal shape as the admin's broadcast-to-everyone one (MwasalatAdminDashboard),
// but scoped to one or more of the instructor's own courses (or every learner
// they teach) — never platform-wide, since that's the admin-only action.
function MwasalatInstructorNotifyModal({ programs, onClose }) {
  const { t, i18n } = useTranslation('mwasalatApp');
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [sendToAll, setSendToAll] = useState(true);
  const [selectedProgramIds, setSelectedProgramIds] = useState([]);
  const [isSending, setIsSending] = useState(false);

  const allSelected = programs.length > 0 && selectedProgramIds.length === programs.length;
  const toggleProgram = (id) => {
    setSelectedProgramIds((prev) => (prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]));
  };
  const toggleSelectAll = () => {
    setSelectedProgramIds(allSelected ? [] : programs.map((p) => p._id));
  };

  const handleSend = async () => {
    if (!title.trim() || !message.trim()) {
      toast.error(t('instructorDashboard.notifyModal.validationError'));
      return;
    }
    if (!sendToAll && selectedProgramIds.length === 0) {
      toast.error(t('instructorDashboard.notifyModal.selectCourseError'));
      return;
    }
    setIsSending(true);
    try {
      const { recipientCount } = await mwasalatNotificationService.sendFromInstructor({
        title: title.trim(), message: message.trim(), programIds: sendToAll ? undefined : selectedProgramIds,
      });
      toast.success(localizeNumber(t('instructorDashboard.notifyModal.sentToast', { count: recipientCount }), i18n.language));
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || t('instructorDashboard.notifyModal.sendFailed'));
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-2xl w-full max-w-md p-6" style={{ boxShadow: '0 8px 40px rgba(0,0,0,0.15)' }}>
        <div className="w-11 h-11 rounded-2xl bg-mwasalatInk-100 flex items-center justify-center mb-4">
          <Megaphone className="w-5 h-5 text-mwasalatInk-500" />
        </div>
        <h3 className="text-base font-bold text-[#1E293B] mb-1">{t('instructorDashboard.notifyModal.title')}</h3>
        <p className="text-sm text-[#475569] mb-4">{t('instructorDashboard.notifyModal.body')}</p>

        <label className="block text-sm font-medium text-[#1E293B] mb-1.5">{t('instructorDashboard.notifyModal.sendToLabel')}</label>
        <div className="flex rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-1 mb-3">
          <button
            type="button"
            onClick={() => setSendToAll(true)}
            className={`flex-1 text-center px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${sendToAll ? 'bg-white text-mwasalatInk-500 shadow-sm' : 'text-[#64748B]'}`}
          >
            {t('instructorDashboard.notifyModal.allMyLearners')}
          </button>
          <button
            type="button"
            onClick={() => setSendToAll(false)}
            className={`flex-1 text-center px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${!sendToAll ? 'bg-white text-mwasalatInk-500 shadow-sm' : 'text-[#64748B]'}`}
          >
            {t('instructorDashboard.notifyModal.selectCourses')}
          </button>
        </div>

        {!sendToAll && (
          programs.length === 0 ? (
            <p className="text-xs text-[#94A3B8] mb-4">{t('instructorDashboard.notifyModal.noCourses')}</p>
          ) : (
            <div className="mb-4 max-h-40 overflow-y-auto rounded-xl border border-[#E2E8F0] divide-y divide-[#F1F5F9]">
              <label className="flex items-center gap-2.5 px-3.5 py-2 text-xs font-medium text-[#1E293B] cursor-pointer hover:bg-[#F8FAFC] transition-colors">
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={toggleSelectAll}
                  className="accent-mwasalatInk-500 w-3.5 h-3.5"
                />
                {t('instructorDashboard.notifyModal.selectAll')}
              </label>
              {programs.map((p) => (
                <label key={p._id} className="flex items-center gap-2.5 px-3.5 py-2 text-sm text-[#1E293B] cursor-pointer hover:bg-[#F8FAFC] transition-colors">
                  <input
                    type="checkbox"
                    checked={selectedProgramIds.includes(p._id)}
                    onChange={() => toggleProgram(p._id)}
                    className="accent-mwasalatInk-500 w-3.5 h-3.5"
                  />
                  {getLocalizedProgramField(p, 'title', i18n.language)}
                </label>
              ))}
            </div>
          )
        )}

        <label className="block text-sm font-medium text-[#1E293B] mb-1.5">{t('instructorDashboard.notifyModal.titleLabel')}</label>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder={t('instructorDashboard.notifyModal.titlePlaceholder')}
          className="w-full px-3.5 py-2.5 rounded-xl border border-[#E2E8F0] text-sm bg-white text-[#1E293B] placeholder:text-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-mwasalatInk-500/20 hover:border-mwasalatInk-300 transition-colors mb-4"
        />

        <label className="block text-sm font-medium text-[#1E293B] mb-1.5">{t('instructorDashboard.notifyModal.messageLabel')}</label>
        <textarea
          rows={3}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder={t('instructorDashboard.notifyModal.messagePlaceholder')}
          className="w-full px-3.5 py-2.5 rounded-xl border border-[#E2E8F0] text-sm bg-white text-[#1E293B] placeholder:text-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-mwasalatInk-500/20 hover:border-mwasalatInk-300 transition-colors resize-none"
        />

        <div className="flex gap-3 mt-5">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-4 py-2.5 rounded-xl border border-[#E2E8F0] text-sm font-medium text-[#475569] hover:bg-[#F1F5F9] transition-colors"
          >
            {t('common.cancel')}
          </button>
          <button
            type="button"
            onClick={handleSend}
            disabled={isSending}
            className="flex-1 flex items-center justify-center gap-2 bg-mwasalatInk-500 hover:bg-mwasalatInk-400 disabled:opacity-60 text-white font-semibold px-4 py-2.5 rounded-xl transition-colors text-sm"
          >
            {isSending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            {isSending ? t('instructorDashboard.notifyModal.sending') : t('instructorDashboard.notifyModal.sendButton')}
          </button>
        </div>
      </div>
    </div>
  );
}

function StatTile({ icon: Icon, label, value, tone }) {
  return (
    <div className="card p-3 flex items-center gap-2.5">
      <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${tone.bg} ${tone.text}`}>
        <Icon className="w-4 h-4" />
      </div>
      <div className="min-w-0">
        <p className="text-base font-bold text-[#1E293B] leading-tight">{value}</p>
        <p className="text-[11px] text-[#94A3B8] truncate">{label}</p>
      </div>
    </div>
  );
}

// Dense list of this instructor's live/ILT sessions scheduled for today —
// same visual language as the admin dashboard's Upcoming Classes card
// (MwasalatAdminDashboard.jsx), but a time badge instead of a date badge
// since every row is already "today" by definition.
function TodaysScheduleCard({ sessions }) {
  const { t, i18n } = useTranslation('mwasalatApp');
  const dateLocale = i18n.language.startsWith('ar') ? 'ar-OM' : 'en-GB';

  return (
    <div className="card p-3.5 h-full">
      <div className="flex items-center gap-2 mb-2.5">
        <Clock className="w-4 h-4 text-mwasalatInk-500 flex-shrink-0" />
        <div className="min-w-0">
          <p className="text-sm font-semibold text-[#1E293B]">{t('instructorDashboard.todaySchedule.title')}</p>
          {sessions.length > 0 && (
            <p className="text-[11px] text-[#94A3B8]">
              {localizeNumber(t('instructorDashboard.todaySchedule.subtitle', { count: sessions.length }), i18n.language)}
            </p>
          )}
        </div>
      </div>
      {sessions.length === 0 ? (
        <p className="text-xs text-[#94A3B8] py-6 text-center">{t('instructorDashboard.todaySchedule.empty')}</p>
      ) : (
        <ul className="space-y-2">
          {sessions.map((s) => {
            const date = new Date(s.scheduledAt);
            return (
              <li key={s.programId} className="flex items-center gap-2.5">
                <div className="w-14 h-9 rounded-lg bg-mwasalatInk-100 flex items-center justify-center flex-shrink-0" dir="ltr">
                  <p className="text-[11px] font-bold text-mwasalatInk-500 leading-none">
                    {localizeNumber(date.toLocaleTimeString(dateLocale, { hour: 'numeric', minute: '2-digit' }), i18n.language)}
                  </p>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[12.5px] font-semibold text-[#1E293B] truncate">{getLocalizedProgramField(s, 'title', i18n.language)}</p>
                  <p className="text-[10.5px] text-[#94A3B8] truncate">
                    {s.type === 'live' ? t('instructorDashboard.todaySchedule.live') : t('instructorDashboard.todaySchedule.ilt')}
                    {s.venue ? ` · ${s.venue}` : ''}
                  </p>
                </div>
                <span className="text-[10px] font-medium text-mwasalatInk-500 bg-mwasalatInk-100 px-2 py-1 rounded-full flex-shrink-0">
                  {localizeNumber(t('instructorDashboard.todaySchedule.enrolled', { count: s.enrolledCount }), i18n.language)}
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

// Enrollment-status breakdown across every learner in this instructor's
// programs — reuses the same DonutChart + color convention (green/amber/red
// for completed/in-progress/not-started) as the admin dashboard's
// Completion Rate chart, just scoped to one instructor's roster.
function LearnerProgressCard({ allStudents }) {
  const { t, i18n } = useTranslation('mwasalatApp');
  const completed = allStudents.filter((s) => s.status === 'completed').length;
  const inProgress = allStudents.filter((s) => s.status === 'in_progress').length;
  const notStarted = allStudents.filter((s) => s.status === 'enrolled').length;
  const total = completed + inProgress + notStarted;
  const completionRate = total ? Math.round((completed / total) * 100) : 0;

  return (
    <div className="card p-3.5 h-full">
      <div className="flex items-center gap-2 mb-2.5">
        <PieChart className="w-4 h-4 text-mwasalatInk-500 flex-shrink-0" />
        <div className="min-w-0">
          <p className="text-sm font-semibold text-[#1E293B]">{t('instructorDashboard.progressOverview.title')}</p>
          <p className="text-[11px] text-[#94A3B8]">{t('instructorDashboard.progressOverview.subtitle')}</p>
        </div>
      </div>
      {total === 0 ? (
        <p className="text-xs text-[#94A3B8] py-6 text-center">{t('instructorDashboard.progressOverview.empty')}</p>
      ) : (
        <DonutChart
          data={[
            { label: t('instructorDashboard.progressOverview.completed'), value: completed },
            { label: t('instructorDashboard.progressOverview.inProgress'), value: inProgress },
            { label: t('instructorDashboard.progressOverview.notStarted'), value: notStarted },
          ]}
          colors={['#22C55E', '#F59E0B', '#D6293C']}
          centerValue={`${localizeNumber(completionRate, i18n.language)}%`}
          centerLabel={t('instructorDashboard.progressOverview.centerLabel')}
          size={104}
        />
      )}
    </div>
  );
}

export default function MwasalatInstructorDashboard() {
  const { t, i18n } = useTranslation('mwasalatApp');
  const { user } = useMwasalatAuthStore();
  const [encouragingId, setEncouragingId] = useState(null);
  const [showNotifyModal, setShowNotifyModal] = useState(false);

  // Cached for staleTime (5 min, see lib/queryClient.js) so revisiting this
  // page doesn't re-fire all 4 requests every time.
  const { data, isLoading } = useQuery({
    queryKey: ['mwasalat-instructor-dashboard'],
    queryFn: async () => {
      const [myPrograms, summary, roster, schedule] = await Promise.all([
        mwasalatProgramService.listMine(),
        mwasalatProgramService.getMySummary(),
        mwasalatProgramService.getMyRoster(),
        mwasalatProgramService.getMyTodaySchedule(),
      ]);
      return {
        programs: myPrograms,
        totalLearners: summary.totalLearners,
        needsAttention: roster.needsAttention,
        allStudents: roster.allStudents,
        todaySchedule: schedule,
      };
    },
  });
  const {
    programs = [], totalLearners = 0, needsAttention = [], allStudents = [], todaySchedule = [],
  } = data ?? {};

  const handleEncourage = async (programId, learnerId, templateKey) => {
    setEncouragingId(learnerId);
    try {
      await mwasalatProgramService.sendEncouragement(programId, learnerId, templateKey);
      toast.success(t('programDetail.toastEncouragementSent'));
    } catch (err) {
      toast.error(err.response?.data?.message || t('programDetail.toastEncouragementFailed'));
    } finally {
      setEncouragingId(null);
    }
  };

  const activeCount = programs.filter((p) => p.status === 'active').length;
  const archivedCount = programs.filter((p) => p.status === 'archived').length;
  const firstName = user?.name?.split(' ')[0] ?? t('instructorDashboard.fallbackName');

  return (
    <MwasalatInstructorLayout
      title={t('instructorDashboard.welcomeTitle', { name: firstName })}
      subtitle={t('instructorDashboard.headerSubtitle')}
      actions={(
        <button
          onClick={() => setShowNotifyModal(true)}
          className="hidden sm:inline-flex items-center gap-2 bg-mwasalatInk-500 hover:bg-mwasalatInk-400 text-white font-semibold px-3.5 py-2 rounded-xl transition-colors text-xs"
        >
          <Megaphone className="w-3.5 h-3.5" /> {t('instructorDashboard.notifyModal.title')}
        </button>
      )}
    >
      {/* Stats strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
        <StatTile icon={BookOpen} label={t('instructorDashboard.statTotalPrograms')} value={localizeNumber(programs.length, i18n.language)} tone={{ bg: 'bg-mwasalatInk-100', text: 'text-mwasalatInk-500' }} />
        <StatTile icon={CheckCircle2} label={t('instructorDashboard.statActive')} value={localizeNumber(activeCount, i18n.language)} tone={{ bg: 'bg-[#DCFCE7]', text: 'text-[#22C55E]' }} />
        <StatTile icon={Users} label={t('instructorDashboard.statLearnersTaught')} value={localizeNumber(totalLearners, i18n.language)} tone={{ bg: 'bg-[#FEF3C7]', text: 'text-[#F59E0B]' }} />
        <StatTile icon={Archive} label={t('instructorDashboard.statArchived')} value={localizeNumber(archivedCount, i18n.language)} tone={{ bg: 'bg-mwasalatRed-100', text: 'text-mwasalatRed-600' }} />
      </div>

      {/* Today's Schedule + Learner Progress Overview — dense two-up row,
          same card language as the admin dashboard's chart/panel row. */}
      {!isLoading && (
        <div className="grid lg:grid-cols-5 gap-3.5 mb-5">
          <div className="lg:col-span-3">
            <TodaysScheduleCard sessions={todaySchedule} />
          </div>
          <div className="lg:col-span-2">
            <LearnerProgressCard allStudents={allStudents} />
          </div>
        </div>
      )}

      {/* Needs Attention — a cross-course preview of the same card each
          course's own detail page shows, so at-risk learners surface here
          without clicking into every course individually. */}
      {!isLoading && needsAttention.length > 0 && (
        <div className="card overflow-hidden mb-5">
          <div className="px-5 py-4 border-b border-[#F1F5F9] flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-mwasalatRed-500" />
              <p className="text-sm font-semibold text-[#1E293B]">
                {localizeNumber(t('instructorDashboard.needsAttentionHeading', { count: needsAttention.length }), i18n.language)}
              </p>
            </div>
            {needsAttention.length > NEEDS_ATTENTION_PREVIEW_SIZE && (
              <Link
                to="/instructor/at-risk"
                className="inline-flex items-center gap-1 text-xs font-medium text-mwasalatInk-500 hover:text-mwasalatInk-400 transition-colors"
              >
                {t('instructorDashboard.viewAllAtRisk')} <ArrowRight className="w-3 h-3 rtl:rotate-180" />
              </Link>
            )}
          </div>
          {needsAttention.slice(0, NEEDS_ATTENTION_PREVIEW_SIZE).map((entry) => (
            <MwasalatNeedsAttentionRow
              key={entry._id}
              entry={entry}
              programId={entry.program?._id}
              onEncourage={handleEncourage}
              sendingId={encouragingId}
              showProgram
            />
          ))}
        </div>
      )}

      <div className="flex items-center justify-between gap-3 mb-2.5">
        <h2 className="text-[13px] font-semibold text-[#1E293B]">{t('instructorDashboard.yourPrograms')}</h2>
        {!isLoading && programs.length > 0 && (
          <Link
            to="/instructor/programs"
            className="inline-flex items-center gap-1 text-xs font-medium text-mwasalatInk-500 hover:text-mwasalatInk-400 transition-colors"
          >
            {t('instructorDashboard.viewAllPrograms')} <ArrowRight className="w-3 h-3 rtl:rotate-180" />
          </Link>
        )}
      </div>

      {isLoading ? (
        <div className="p-8 flex items-center justify-center text-[#94A3B8] text-[13px]">
          <Loader2 className="w-4 h-4 animate-spin me-2" /> {t('instructorDashboard.loadingPrograms')}
        </div>
      ) : programs.length === 0 ? (
        <div className="card p-8 text-center">
          <BookOpen className="w-7 h-7 text-mwasalatInk-400 mx-auto mb-2.5" />
          <p className="text-[13px] font-medium text-[#1E293B] mb-1">{t('instructorDashboard.emptyTitle')}</p>
          <p className="text-xs text-[#94A3B8] mb-3.5">{t('instructorDashboard.emptyBody')}</p>
          <Link
            to="/instructor/programs/new"
            className="inline-flex items-center gap-2 bg-mwasalatInk-500 hover:bg-mwasalatInk-400 text-white font-semibold px-3.5 py-2 rounded-lg transition-colors text-[13px]"
          >
            <Plus className="w-3.5 h-3.5" /> {t('instructor.nav.addCourse')}
          </Link>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-3.5">
          {programs.slice(0, PROGRAMS_PREVIEW_SIZE).map((program) => {
            const theme = themeForCategory(program.category);
            return (
              <div key={program._id} className="card card-hover overflow-hidden flex flex-col">
                <div className="p-3.5 flex flex-col flex-1">
                  <div className="flex flex-wrap gap-1 mb-2">
                    {(program.contentTypes ?? []).map((type) => (
                      <span key={type} className="inline-flex items-center px-2 py-0.5 rounded-full text-[10.5px] font-medium bg-[#F1F5F9] text-[#475569] capitalize">
                        {t(`addCourse.contentTypes.${type}.label`)}
                      </span>
                    ))}
                    {program.status === 'archived' && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10.5px] font-medium bg-[#FBE7E9] text-mwasalatRed-600">
                        {t('instructorDashboard.badgeArchived')}
                      </span>
                    )}
                    {program.status === 'draft' && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10.5px] font-medium bg-[#FEF3C7] text-[#F59E0B]">
                        {t('instructorDashboard.badgeDraft')}
                      </span>
                    )}
                  </div>
                  <span className={`inline-flex items-center self-start gap-1.5 px-2 py-0.5 rounded-full text-[10.5px] font-medium capitalize mb-1.5 ${theme.bg} ${theme.text}`}>
                    {getLocalizedProgramField(program, 'category', i18n.language) || t('instructorDashboard.categoryFallback')}
                  </span>
                  <h3 className="text-[13px] font-semibold text-[#1E293B] leading-snug mb-0.5">{getLocalizedProgramField(program, 'title', i18n.language)}</h3>
                  <p className="text-[11px] text-[#94A3B8] mb-3">{getLocalizedProgramField(program, 'subCategory', i18n.language) || ' '}</p>
                  <div className="mt-auto flex items-center gap-1.5">
                    <Link
                      to={`/instructor/programs/${program._id}`}
                      className="flex-1 inline-flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11.5px] font-semibold text-mwasalatInk-500 border border-[#E2E8F0] hover:border-mwasalatInk-300 transition-colors"
                    >
                      {t('common.view')} <ChevronRight className="w-3 h-3 rtl:rotate-180" />
                    </Link>
                    <Link
                      to={`/instructor/programs/${program._id}/edit`}
                      className="inline-flex items-center justify-center w-7 h-7 rounded-lg text-[#475569] border border-[#E2E8F0] hover:border-mwasalatInk-300 hover:text-mwasalatInk-500 transition-colors flex-shrink-0"
                      title={t('instructorDashboard.editCourseTooltip')}
                      aria-label={t('instructorDashboard.editCourseTooltip')}
                    >
                      <Pencil className="w-3 h-3" />
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showNotifyModal && <MwasalatInstructorNotifyModal programs={programs} onClose={() => setShowNotifyModal(false)} />}
    </MwasalatInstructorLayout>
  );
}
