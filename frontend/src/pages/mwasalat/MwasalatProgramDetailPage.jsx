import { useState, useEffect, useMemo } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { ArrowLeft, Star, Loader2, Users, FileText, Video, Radio, ExternalLink, MapPin, QrCode, HelpCircle, ChevronDown, ChevronUp, Search, MessageCircle, MessagesSquare, UserCheck, AlertTriangle } from 'lucide-react';
import { mwasalatProgramService } from '../../services/mwasalatProgram.service.js';
import MwasalatQuizBuilder from '../../components/mwasalat/MwasalatQuizBuilder.jsx';
import MwasalatRiskBadge from '../../components/mwasalat/MwasalatRiskBadge.jsx';
import MwasalatStreakBadge from '../../components/mwasalat/MwasalatStreakBadge.jsx';
import MwasalatNeedsAttentionRow from '../../components/mwasalat/MwasalatNeedsAttentionRow.jsx';
import { useMwasalatChatStore } from '../../store/mwasalatChatStore.js';
import { getLocalizedProgramField, localizeNumber } from '../../utils/mwasalatLocalize.js';

const TEAL = '#23181A';
const TEAL_TRACK = '#D9C9CA';

function SortableHeader({ label, active, direction, onClick }) {
  return (
    <th className="px-5 py-3 font-medium">
      <button type="button" onClick={onClick} className="inline-flex items-center gap-1 hover:text-[#1E293B] transition-colors">
        {label}
        {active && (direction === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />)}
      </button>
    </th>
  );
}

function CompletionMeter({ rate }) {
  const { t, i18n } = useTranslation('mwasalatApp');
  const size = 120, stroke = 10, r = (size - stroke) / 2, c = 2 * Math.PI * r;
  const offset = c - (rate / 100) * c;
  return (
    <div className="relative w-[120px] h-[120px]">
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} stroke={TEAL_TRACK} strokeWidth={stroke} fill="none" />
        <circle
          cx={size / 2} cy={size / 2} r={r}
          stroke={TEAL} strokeWidth={stroke} fill="none"
          strokeDasharray={c} strokeDashoffset={offset}
          strokeLinecap="round"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-xl font-semibold text-[#1E293B]">{localizeNumber(rate, i18n.language)}%</span>
        <span className="text-[10px] text-[#94A3B8]">{t('programDetail.completedLabel')}</span>
      </div>
    </div>
  );
}

function StarRow({ value }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star key={i} className={`w-3.5 h-3.5 ${i <= Math.round(value) ? 'fill-mwasalatRed-500 text-mwasalatRed-500' : 'text-[#E2E8F0]'}`} />
      ))}
    </div>
  );
}

export default function MwasalatProgramDetailPage() {
  const { t, i18n } = useTranslation('mwasalatApp');
  const dateLocale = i18n.language.startsWith('ar') ? 'ar-OM' : 'en-GB';
  const fmtDate = (d) => localizeNumber(new Date(d).toLocaleDateString(dateLocale), i18n.language);
  const fmtDateTime = (d) => localizeNumber(new Date(d).toLocaleString(dateLocale), i18n.language);
  const fmtTime = (d) => localizeNumber(new Date(d).toLocaleTimeString(dateLocale), i18n.language);
  const { id } = useParams();
  const [program, setProgram] = useState(null);
  const [learners, setLearners] = useState([]);
  const [needsAttention, setNeedsAttention] = useState([]);
  const [feedback, setFeedback] = useState([]);
  const [stats, setStats] = useState(null);
  const [attendance, setAttendance] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isQuizOpen, setIsQuizOpen] = useState(false);
  const [learnerQuery, setLearnerQuery] = useState('');
  const [learnerSortKey, setLearnerSortKey] = useState(null);
  const [learnerSortDir, setLearnerSortDir] = useState('asc');
  const [pendingAttendanceId, setPendingAttendanceId] = useState(null);
  const [encouragingId, setEncouragingId] = useState(null);
  const chatConversations = useMwasalatChatStore((s) => s.conversations);

  useEffect(() => {
    Promise.all([
      mwasalatProgramService.getById(id),
      mwasalatProgramService.getLearners(id),
      mwasalatProgramService.getFeedback(id),
      mwasalatProgramService.getStats(id),
    ]).then(([p, l, f, s]) => {
      setProgram(p);
      setLearners(l.allStudents);
      setNeedsAttention(l.needsAttention);
      setFeedback(f);
      setStats(s);
      if (p.contentTypes?.includes('ilt')) {
        mwasalatProgramService.getAttendance(id).then(setAttendance);
      }
    }).finally(() => setIsLoading(false));
  }, [id]);

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

  const checkInUrl = `${window.location.origin}/mwasalat/learner/check-in/${id}`;
  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(checkInUrl)}`;

  const notCheckedIn = learners.filter((e) => !attendance.some((a) => a.learner?._id === e.learner?._id));

  const handleMarkPresent = async (learnerId) => {
    setPendingAttendanceId(learnerId);
    try {
      await mwasalatProgramService.markAttendance(id, learnerId);
      const updated = await mwasalatProgramService.getAttendance(id);
      setAttendance(updated);
      toast.success(t('programDetail.toastMarkedPresent'));
    } catch (err) {
      toast.error(err.response?.data?.message || t('programDetail.toastMarkAttendanceFailed'));
    } finally {
      setPendingAttendanceId(null);
    }
  };

  const toggleLearnerSort = (key) => {
    if (learnerSortKey === key) {
      setLearnerSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setLearnerSortKey(key);
      setLearnerSortDir('asc');
    }
  };

  const visibleLearners = useMemo(() => {
    const q = learnerQuery.trim().toLowerCase();
    const filteredList = q
      ? learners.filter((e) => e.learner?.name?.toLowerCase().includes(q) || e.learner?.email?.toLowerCase().includes(q))
      : learners;
    if (!learnerSortKey) return filteredList;
    const dir = learnerSortDir === 'asc' ? 1 : -1;
    return [...filteredList].sort((a, b) => {
      let aVal, bVal;
      if (learnerSortKey === 'name') { aVal = a.learner?.name ?? ''; bVal = b.learner?.name ?? ''; }
      else { aVal = new Date(a.purchasedAt).getTime(); bVal = new Date(b.purchasedAt).getTime(); }
      if (aVal < bVal) return -1 * dir;
      if (aVal > bVal) return 1 * dir;
      return 0;
    });
  }, [learners, learnerQuery, learnerSortKey, learnerSortDir]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F8F9FB] flex items-center justify-center text-[#94A3B8]">
        <Loader2 className="w-5 h-5 animate-spin me-2" /> {t('programDetail.loading')}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F9FB]">
      <header className="h-16 bg-white border-b border-[#E2E8F0] flex items-center justify-between px-8">
        <div className="flex items-center gap-4">
          <Link to="/mwasalat/instructor/dashboard" className="w-9 h-9 rounded-xl border border-[#E2E8F0] flex items-center justify-center text-[#475569] hover:bg-[#F1F5F9] transition-colors">
            <ArrowLeft className="w-4 h-4 rtl:rotate-180" />
          </Link>
          <div>
            <p className="text-sm font-semibold text-[#1E293B]">{getLocalizedProgramField(program, 'title', i18n.language)}</p>
            <p className="text-xs text-[#94A3B8] capitalize">
              {getLocalizedProgramField(program, 'category', i18n.language)}
              {program?.subCategory ? ` · ${getLocalizedProgramField(program, 'subCategory', i18n.language)}` : ''}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <Link
            to={`/mwasalat/instructor/programs/${id}/discussion`}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-mwasalatInk-500 hover:text-mwasalatInk-400 transition-colors"
          >
            <MessagesSquare className="w-4 h-4" /> {t('programDetail.discussionLink')}
          </Link>
          <Link
            to={`/mwasalat/instructor/programs/${id}/edit`}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-mwasalatInk-500 hover:text-mwasalatInk-400 transition-colors"
          >
            {t('programDetail.editCourseLink')}
          </Link>
        </div>
      </header>

      <main className="p-8 max-w-5xl mx-auto space-y-6">

        <div className="grid sm:grid-cols-3 gap-5">
          <div className="card p-5 flex items-center gap-5">
            <CompletionMeter rate={stats?.completionRate ?? 0} />
            <div>
              <p className="text-sm font-semibold text-[#1E293B]">{t('programDetail.enrollmentToCompletion')}</p>
              <p className="text-xs text-[#94A3B8] mt-1">{localizeNumber(t('programDetail.completionSummary', { completed: stats?.totalCompleted ?? 0, total: stats?.totalEnrolled ?? 0 }), i18n.language)}</p>
            </div>
          </div>
          <div className="card p-5">
            <p className="text-sm font-semibold text-[#1E293B] mb-2">{t('programDetail.courseRating')}</p>
            {stats?.avgCourseRating != null ? (
              <>
                <p className="text-2xl font-semibold text-[#1E293B]">{localizeNumber(stats.avgCourseRating.toFixed(1), i18n.language)}</p>
                <StarRow value={stats.avgCourseRating} />
              </>
            ) : (
              <p className="text-sm text-[#94A3B8]">{t('programDetail.noFeedbackYet')}</p>
            )}
            <p className="text-xs text-[#94A3B8] mt-2">{localizeNumber(t('programDetail.reviewCount', { count: stats?.feedbackCount ?? 0 }), i18n.language)}</p>
          </div>
          <div className="card p-5">
            <p className="text-sm font-semibold text-[#1E293B] mb-2">{t('programDetail.instructorRating')}</p>
            {stats?.avgInstructorRating != null ? (
              <>
                <p className="text-2xl font-semibold text-[#1E293B]">{localizeNumber(stats.avgInstructorRating.toFixed(1), i18n.language)}</p>
                <StarRow value={stats.avgInstructorRating} />
              </>
            ) : (
              <p className="text-sm text-[#94A3B8]">{t('programDetail.noFeedbackYet')}</p>
            )}
          </div>
        </div>

        <div className="card overflow-hidden">
          <div className="px-5 py-4 border-b border-[#F1F5F9]">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-mwasalatRed-500" />
              <p className="text-sm font-semibold text-[#1E293B]">
                {localizeNumber(t('programDetail.needsAttentionHeading', { count: needsAttention.length }), i18n.language)}
              </p>
            </div>
            <p className="text-xs text-[#94A3B8] mt-1">
              {localizeNumber(t('programDetail.needsAttentionSubtitle', {
                atRisk: stats?.atRiskCount ?? 0, returned: stats?.returnedThisWeek ?? 0,
              }), i18n.language)}
            </p>
          </div>
          {needsAttention.length === 0 ? (
            <div className="p-8 text-center text-sm text-[#94A3B8]">{t('programDetail.needsAttentionEmpty')}</div>
          ) : (
            <div>
              {needsAttention.map((entry) => (
                <MwasalatNeedsAttentionRow key={entry._id} entry={entry} programId={id} onEncourage={handleEncourage} sendingId={encouragingId} />
              ))}
            </div>
          )}
        </div>

        <div className="card overflow-hidden">
          <div className="px-5 py-4 border-b border-[#F1F5F9]">
            <p className="text-sm font-semibold text-[#1E293B]">{t('programDetail.courseContentHeading')}</p>
          </div>
          <div className="p-5 space-y-3">
            {program?.contentTypes?.includes('pdf') && program?.pdfUrl && (
              <a href={program.pdfUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-3 rounded-xl border border-[#E2E8F0] hover:border-mwasalatInk-300 transition-colors">
                <div className="w-9 h-9 rounded-lg bg-mwasalatInk-100 flex items-center justify-center flex-shrink-0">
                  <FileText className="w-4 h-4 text-mwasalatInk-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[#1E293B]">{t('programDetail.pdfHandout')}</p>
                  <p className="text-xs text-[#94A3B8]">{t('programDetail.clickToView')}</p>
                </div>
                <ExternalLink className="w-4 h-4 text-[#94A3B8]" />
              </a>
            )}
            {program?.contentTypes?.includes('recording') && program?.recordingVideoPublicId && (
              <Link to={`/mwasalat/instructor/programs/${program._id}/watch`} className="flex items-center gap-3 p-3 rounded-xl border border-[#E2E8F0] hover:border-mwasalatInk-300 transition-colors">
                <div className="w-9 h-9 rounded-lg bg-mwasalatInk-100 flex items-center justify-center flex-shrink-0">
                  <Video className="w-4 h-4 text-mwasalatInk-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[#1E293B]">{t('programDetail.recordingLabel')}</p>
                  <p className="text-xs text-[#94A3B8]">{t('programDetail.uploadedVideoHint')}</p>
                </div>
                <ExternalLink className="w-4 h-4 text-[#94A3B8]" />
              </Link>
            )}
            {program?.contentTypes?.includes('recording') && !program?.recordingVideoPublicId && program?.recordingLink && (
              <a href={program.recordingLink} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-3 rounded-xl border border-[#E2E8F0] hover:border-mwasalatInk-300 transition-colors">
                <div className="w-9 h-9 rounded-lg bg-mwasalatInk-100 flex items-center justify-center flex-shrink-0">
                  <Video className="w-4 h-4 text-mwasalatInk-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[#1E293B]">{t('programDetail.recordingLabel')}</p>
                  <p className="text-xs text-[#94A3B8] truncate" dir="ltr">{program.recordingLink}</p>
                </div>
                <ExternalLink className="w-4 h-4 text-[#94A3B8]" />
              </a>
            )}
            {program?.contentTypes?.includes('live') && program?.liveMeetingLink && (
              <a
                href={program.liveMeetingStartUrl || program.liveMeetingLink}
                onClick={(e) => {
                  e.preventDefault();
                  window.open(program.liveMeetingStartUrl || program.liveMeetingLink, 'mwasalat-live-class', 'noopener,noreferrer,width=1100,height=720');
                }}
                className="flex items-center gap-3 p-3 rounded-xl border border-[#E2E8F0] hover:border-mwasalatInk-300 transition-colors"
              >
                <div className="w-9 h-9 rounded-lg bg-mwasalatInk-100 flex items-center justify-center flex-shrink-0">
                  <Radio className="w-4 h-4 text-mwasalatInk-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[#1E293B]">
                    {program.liveMeetingStartUrl ? t('programDetail.startLiveClassLabel') : t('programDetail.liveClassLabel')}
                  </p>
                  <p className="text-xs text-[#94A3B8]">
                    {program.liveScheduledAt ? fmtDateTime(program.liveScheduledAt) : t('programDetail.noTimeSet')}
                  </p>
                </div>
                <ExternalLink className="w-4 h-4 text-[#94A3B8]" />
              </a>
            )}
            {program?.contentTypes?.includes('ilt') && program?.iltVenue && (
              <div className="flex items-center gap-3 p-3 rounded-xl border border-[#E2E8F0]">
                <div className="w-9 h-9 rounded-lg bg-mwasalatInk-100 flex items-center justify-center flex-shrink-0">
                  <MapPin className="w-4 h-4 text-mwasalatInk-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[#1E293B]">{t('programDetail.iltLabel')}</p>
                  <p className="text-xs text-[#94A3B8]">
                    {program.iltVenue} · {program.iltScheduledAt ? fmtDateTime(program.iltScheduledAt) : t('programDetail.noTimeSet')}
                  </p>
                </div>
              </div>
            )}
            {!program?.contentTypes?.length && (
              <p className="text-sm text-[#94A3B8]">{t('programDetail.noContentYet')}</p>
            )}
          </div>
        </div>

        {program?.contentTypes?.includes('ilt') && (
          <div className="card overflow-hidden">
            <div className="px-5 py-4 border-b border-[#F1F5F9] flex items-center gap-2">
              <QrCode className="w-4 h-4 text-mwasalatInk-500" />
              <p className="text-sm font-semibold text-[#1E293B]">{t('programDetail.checkInHeading')}</p>
            </div>
            <div className="p-5 grid sm:grid-cols-[auto_1fr] gap-6">
              <div className="flex flex-col items-center gap-2">
                <img src={qrImageUrl} alt={t('programDetail.qrAlt')} className="w-[140px] h-[140px] rounded-xl border border-[#E2E8F0]" />
                <p className="text-xs text-[#94A3B8]">{t('programDetail.qrHint')}</p>
              </div>
              <div>
                <p className="text-sm font-semibold text-[#1E293B] mb-3">{localizeNumber(t('programDetail.checkedInHeading', { count: attendance.length }), i18n.language)}</p>
                {attendance.length === 0 ? (
                  <p className="text-sm text-[#94A3B8] mb-5">{t('programDetail.noCheckIns')}</p>
                ) : (
                  <div className="space-y-2 mb-5">
                    {attendance.map((a) => (
                      <div key={a._id} className="flex items-center justify-between text-sm">
                        <span className="text-[#1E293B]">{a.learner?.name}</span>
                        <span className="text-xs text-[#94A3B8]">{fmtTime(a.checkedInAt)}</span>
                      </div>
                    ))}
                  </div>
                )}

                {notCheckedIn.length > 0 && (
                  <>
                    <p className="text-sm font-semibold text-[#1E293B] mb-3">{localizeNumber(t('programDetail.notCheckedInHeading', { count: notCheckedIn.length }), i18n.language)}</p>
                    <div className="space-y-2">
                      {notCheckedIn.map((e) => (
                        <div key={e._id} className="flex items-center justify-between text-sm">
                          <span className="text-[#475569]">{e.learner?.name}</span>
                          <button
                            onClick={() => handleMarkPresent(e.learner?._id)}
                            disabled={pendingAttendanceId === e.learner?._id}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold text-mwasalatInk-500 bg-mwasalatInk-100 hover:bg-mwasalatInk-200 disabled:opacity-50 transition-colors"
                          >
                            {pendingAttendanceId === e.learner?._id ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <UserCheck className="w-3.5 h-3.5" />
                            )}
                            {t('programDetail.markPresentBtn')}
                          </button>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        <div className="card overflow-hidden">
          <button
            type="button"
            onClick={() => setIsQuizOpen((v) => !v)}
            className="w-full px-5 py-4 border-b border-[#F1F5F9] flex items-center justify-between gap-2 hover:bg-[#F8F9FB] transition-colors text-start"
          >
            <div className="flex items-center gap-2">
              <HelpCircle className="w-4 h-4 text-mwasalatInk-500 flex-shrink-0" />
              <div>
                <p className="text-sm font-semibold text-[#1E293B]">{t('programDetail.assessmentQuizHeading')}</p>
                <p className="text-xs text-[#94A3B8]">{t('programDetail.assessmentQuizSubtitle')}</p>
              </div>
            </div>
            <span className="inline-flex items-center gap-1.5 text-sm font-medium text-mwasalatInk-500 flex-shrink-0">
              {isQuizOpen ? t('programDetail.closeBtn') : t('programDetail.openBtn')}
              {isQuizOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </span>
          </button>
          {isQuizOpen && <MwasalatQuizBuilder programId={id} />}
        </div>

        <div className="card overflow-hidden">
          <div className="px-5 py-4 border-b border-[#F1F5F9] flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-mwasalatInk-500" />
              <p className="text-sm font-semibold text-[#1E293B]">{t('programDetail.enrolledLearnersHeading')}</p>
            </div>
            {learners.length > 0 && (
              <div className="relative w-full sm:w-64">
                <Search className="w-4 h-4 text-[#94A3B8] absolute start-3 top-1/2 -translate-y-1/2" />
                <input
                  value={learnerQuery}
                  onChange={(e) => setLearnerQuery(e.target.value)}
                  placeholder={t('programDetail.searchLearnersPlaceholder')}
                  className="w-full ps-9 pe-3 py-2 rounded-lg border border-[#E2E8F0] text-sm bg-white text-[#1E293B] placeholder:text-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-mwasalatInk-500/20 hover:border-mwasalatInk-300 transition-colors"
                />
              </div>
            )}
          </div>
          {learners.length === 0 ? (
            <div className="p-8 text-center text-sm text-[#94A3B8]">{t('programDetail.noLearnersYet')}</div>
          ) : visibleLearners.length === 0 ? (
            <div className="p-8 text-center text-sm text-[#94A3B8]">{t('programDetail.noLearnersMatch')}</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#F1F5F9] text-start text-xs text-[#94A3B8] uppercase tracking-wide">
                    <SortableHeader label={t('common.name')} active={learnerSortKey === 'name'} direction={learnerSortDir} onClick={() => toggleLearnerSort('name')} />
                    <th className="px-5 py-3 font-medium">{t('common.email')}</th>
                    <th className="px-5 py-3 font-medium">{t('common.status')}</th>
                    <SortableHeader label={t('programDetail.purchasedColumn')} active={learnerSortKey === 'purchased'} direction={learnerSortDir} onClick={() => toggleLearnerSort('purchased')} />
                    <th className="px-5 py-3 font-medium">{t('programDetail.progressColumn')}</th>
                    <th className="px-5 py-3 font-medium">{t('programDetail.streakColumn')}</th>
                    <th className="px-5 py-3 font-medium">{t('programDetail.lastActiveColumn')}</th>
                    <th className="px-5 py-3 font-medium">{t('programDetail.riskColumn')}</th>
                    <th className="px-5 py-3 font-medium text-end">{t('programDetail.chatColumn')}</th>
                  </tr>
                </thead>
                <tbody>
                  {visibleLearners.map((e) => (
                    <tr key={e._id} className="border-b border-[#F1F5F9] last:border-0">
                      <td className="px-5 py-3.5 font-medium text-[#1E293B] whitespace-nowrap">{e.learner?.name}</td>
                      <td className="px-5 py-3.5 text-[#475569] whitespace-nowrap" dir="ltr">{e.learner?.email}</td>
                      <td className="px-5 py-3.5">
                        <span className="inline-flex px-2.5 py-1 rounded-full text-xs font-medium bg-mwasalatInk-100 text-mwasalatInk-500 capitalize whitespace-nowrap">
                          {e.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-[#94A3B8] whitespace-nowrap">{fmtDate(e.purchasedAt)}</td>
                      <td className="px-5 py-3.5 text-[#475569] whitespace-nowrap">{localizeNumber(e.progress, i18n.language)}%</td>
                      <td className="px-5 py-3.5 whitespace-nowrap"><MwasalatStreakBadge current={e.currentStreak} /></td>
                      <td className="px-5 py-3.5 text-[#94A3B8] whitespace-nowrap">
                        {e.daysSinceActivity != null
                          ? localizeNumber(t('programDetail.lastActiveDaysAgo', { count: e.daysSinceActivity }), i18n.language)
                          : t('programDetail.lastActiveNever')}
                      </td>
                      <td className="px-5 py-3.5 whitespace-nowrap"><MwasalatRiskBadge level={e.riskLevel} returned={e.returned} /></td>
                      <td className="px-5 py-3.5 text-end">
                        <Link
                          to={`/mwasalat/instructor/programs/${id}/chat/${e.learner?._id}`}
                          className="relative inline-flex items-center justify-center w-8 h-8 rounded-lg text-mwasalatInk-500 border border-[#E2E8F0] hover:border-mwasalatInk-300 hover:bg-mwasalatInk-100 transition-colors"
                          title={t('programDetail.chatWithTooltip', { name: e.learner?.name })}
                        >
                          <MessageCircle className="w-3.5 h-3.5" />
                          {chatConversations.find((c) => c.program?._id === id && c.learner?._id === e.learner?._id)?.unreadCount > 0 && (
                            <span className="absolute -top-1 -end-1 w-3 h-3 rounded-full bg-mwasalatRed-500 border-2 border-white" />
                          )}
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="card overflow-hidden">
          <div className="px-5 py-4 border-b border-[#F1F5F9]">
            <p className="text-sm font-semibold text-[#1E293B]">{t('programDetail.learnerFeedbackHeading')}</p>
          </div>
          {feedback.length === 0 ? (
            <div className="p-8 text-center text-sm text-[#94A3B8]">{t('programDetail.noFeedbackSubmitted')}</div>
          ) : (
            <div className="divide-y divide-[#F1F5F9]">
              {feedback.map((f) => (
                <div key={f._id} className="px-5 py-4">
                  <div className="flex items-center justify-between mb-1.5">
                    <p className="text-sm font-medium text-[#1E293B]">{f.learner?.name}</p>
                    <p className="text-xs text-[#94A3B8]">{fmtDate(f.createdAt)}</p>
                  </div>
                  <div className="flex items-center gap-4 mb-2">
                    <div className="flex items-center gap-1.5 text-xs text-[#94A3B8]">{t('programDetail.courseRatingShort')} <StarRow value={f.courseRating} /></div>
                    <div className="flex items-center gap-1.5 text-xs text-[#94A3B8]">{t('programDetail.instructorRatingShort')} <StarRow value={f.instructorRating} /></div>
                  </div>
                  {f.comment && <p className="text-sm text-[#475569]">{f.comment}</p>}
                </div>
              ))}
            </div>
          )}
        </div>

      </main>
    </div>
  );
}
