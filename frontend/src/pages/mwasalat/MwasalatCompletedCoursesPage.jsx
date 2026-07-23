import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import {
  Loader2, GraduationCap, Compass, Search, Star, Clock, BookOpen, Target, Award, Download,
  ExternalLink, Trophy, ArrowRight, BarChart3,
} from 'lucide-react';
import { mwasalatProgramService } from '../../services/mwasalatProgram.service.js';
import MwasalatLearnerLayout from '../../layouts/MwasalatLearnerLayout.jsx';
import MwasalatCertificateMiniCard from '../../components/mwasalat/MwasalatCertificateMiniCard.jsx';
import { DonutChart } from '../../components/mwasalat/MwasalatCharts.jsx';
import { themeForCategory } from '../../utils/mwasalatCategoryTheme.js';
import { getLocalizedProgramField, localizeNumber } from '../../utils/mwasalatLocalize.js';

// Distinct UTC day-keys active in the last 7 days, unioned across every
// enrolled course's own streak (recentActiveDates is per-course on the
// backend — there's no account-wide streak field to read instead). Mirrors
// the identical helper on MwasalatLearnerDashboard.
function weeklyActiveDayCount(completion) {
  const now = new Date();
  const weekKeys = new Set();
  for (let i = 0; i < 7; i += 1) {
    const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - i));
    weekKeys.add(d.toISOString().slice(0, 10));
  }
  const active = new Set();
  Object.values(completion).forEach((c) => {
    (c?.streak?.recentActiveDates ?? []).forEach((d) => {
      if (weekKeys.has(d)) active.add(d);
    });
  });
  return active.size;
}

function SummaryTile({ value, label, color }) {
  return (
    <div className="rounded-xl bg-[#F8F9FB] p-3">
      <p className="text-xl font-bold leading-tight" style={{ color }}>{value}</p>
      <p className="text-[11px] text-[#94A3B8] mt-0.5 truncate">{label}</p>
    </div>
  );
}

function CompletedCourseCard({ enrollment, certificate, attempt, onToggleStar, t, i18n, delay }) {
  const theme = themeForCategory(enrollment.program?.category);
  const title = getLocalizedProgramField(enrollment.program, 'title', i18n.language);
  const category = getLocalizedProgramField(enrollment.program, 'category', i18n.language);
  const duration = getLocalizedProgramField(enrollment.program, 'duration', i18n.language);
  const dateLocale = i18n.language === 'ar' ? 'ar-OM' : 'en-GB';
  const contentTypes = enrollment.program?.contentTypes ?? [];
  const completedDate = enrollment.completedAt
    ? localizeNumber(new Date(enrollment.completedAt).toLocaleDateString(dateLocale, { day: 'numeric', month: 'short', year: 'numeric' }), i18n.language)
    : null;
  const issuedDate = certificate
    ? localizeNumber(new Date(certificate.issuedAt).toLocaleDateString(dateLocale, { day: 'numeric', month: 'short', year: 'numeric' }), i18n.language)
    : null;

  return (
    <div className="card overflow-hidden mwasalat-enter" style={{ animationDelay: `${delay}ms` }}>
      <div className="h-1.5" style={{ background: `linear-gradient(90deg, ${theme.solid}, ${theme.solid}99)` }} />
      <div className="p-4 flex flex-col lg:flex-row lg:items-center gap-4">
        {/* No real course imagery in the data model — a themed gradient block stands in for it. */}
        <div
          className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-2xl flex items-center justify-center flex-shrink-0"
          style={{ background: `linear-gradient(135deg, ${theme.solid}, ${theme.solid}cc)` }}
        >
          <GraduationCap className="w-7 h-7 text-white/90" />
          <button
            type="button"
            onClick={() => onToggleStar(enrollment)}
            title={t(enrollment.isStarred ? 'learner.dashboard.unstarCourse' : 'learner.dashboard.starCourse')}
            className={`absolute -top-1.5 -end-1.5 w-6 h-6 rounded-full flex items-center justify-center shadow-sm transition-colors ${
              enrollment.isStarred ? 'bg-[#FEF3C7] text-[#F59E0B]' : 'bg-white text-[#94A3B8] hover:text-[#F59E0B]'
            }`}
          >
            <Star className={`w-3 h-3 ${enrollment.isStarred ? 'fill-current' : ''}`} />
          </button>
        </div>

        <div className="flex-1 min-w-0">
          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium capitalize mb-2 ${theme.bg} ${theme.text}`}>
            {category || t('programCard.generalCategory')}
          </span>
          <h3 className="text-base font-bold text-[#1E293B] leading-snug mb-1">{title}</h3>
          {completedDate && <p className="text-xs text-[#94A3B8] mb-3">{t('learner.completed.completedOnLabel', { date: completedDate })}</p>}

          <div className="flex flex-wrap items-center gap-x-5 gap-y-2 mb-4 text-xs">
            <span className="inline-flex items-center gap-1.5 text-[#475569]">
              <Clock className="w-3.5 h-3.5 text-[#94A3B8]" /> {duration || '—'}
            </span>
            {contentTypes.length > 0 && (
              <span className="inline-flex items-center gap-1.5 text-[#475569]">
                <BookOpen className="w-3.5 h-3.5 text-[#94A3B8]" />
                {contentTypes.map((ct) => t(`addCourse.contentTypes.${ct}.label`)).join(', ')}
              </span>
            )}
            {attempt && (
              <span className="inline-flex items-center gap-1.5 text-[#475569]">
                <Target className="w-3.5 h-3.5 text-[#94A3B8]" /> {t('learner.completed.finalScoreLabel', { score: localizeNumber(attempt.score, i18n.language) })}
              </span>
            )}
          </div>

          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10.5px] font-bold tracking-wide text-[#22C55E]">{t('learner.completed.completedBadge')}</span>
            <span className="text-[10.5px] font-semibold text-[#22C55E]">{localizeNumber(100, i18n.language)}%</span>
          </div>
          <div className="w-full h-2 rounded-full bg-[#F1F5F9] overflow-hidden">
            <div className="h-full rounded-full bg-[#22C55E] w-full" />
          </div>
        </div>

        {certificate && (
          <div className="w-full lg:w-52 flex-shrink-0 flex flex-col gap-2.5 lg:justify-center">
            <div className="rounded-xl p-3.5 flex items-center gap-3" style={{ backgroundColor: `${theme.solid}0F` }}>
              <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${theme.solid}22`, color: theme.solid }}>
                <Award className="w-4.5 h-4.5" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-[#1E293B]">{t('learner.completed.certificateEarnedLabel')}</p>
                <p className="text-[11px] text-[#94A3B8]">{issuedDate}</p>
              </div>
            </div>
            <a
              href={`/mwasalat/learner/programs/${enrollment.program?._id}/certificate?download=1`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center justify-center gap-1.5 bg-white border font-semibold px-3.5 py-2.5 rounded-xl transition-colors text-xs hover:brightness-95"
              style={{ borderColor: theme.solid, color: theme.solid }}
            >
              <Download className="w-3.5 h-3.5" /> {t('learner.completed.downloadCertificate')}
            </a>
            <Link
              to={`/mwasalat/learner/programs/${enrollment.program?._id}/certificate`}
              className="inline-flex items-center justify-center gap-1.5 text-xs font-medium text-mwasalatInk-500 hover:underline"
            >
              {t('learner.completed.viewCertificateLink')} <ExternalLink className="w-3 h-3" />
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

export default function MwasalatCompletedCoursesPage() {
  const { t, i18n } = useTranslation('mwasalatApp');
  const [enrollments, setEnrollments] = useState([]);
  const [completion, setCompletion] = useState({});
  const [achievements, setAchievements] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('recent');

  useEffect(() => {
    Promise.all([
      mwasalatProgramService.listMyEnrollments(),
      mwasalatProgramService.getMyAchievements().catch(() => null),
    ]).then(async ([e, ach]) => {
      setEnrollments(e);
      setAchievements(ach);
      const entries = await Promise.all(
        e.map(async (enr) => [enr.program?._id, await mwasalatProgramService.getCompletionStatus(enr.program?._id)])
      );
      setCompletion(Object.fromEntries(entries));
    }).finally(() => setIsLoading(false));
  }, []);

  const handleToggleStar = async (enrollment) => {
    const nextStarred = !enrollment.isStarred;
    setEnrollments((prev) => prev.map((en) => (en._id === enrollment._id ? { ...en, isStarred: nextStarred } : en)));
    try {
      await mwasalatProgramService.toggleStar(enrollment.program?._id);
    } catch (err) {
      setEnrollments((prev) => prev.map((en) => (en._id === enrollment._id ? { ...en, isStarred: !nextStarred } : en)));
      toast.error(err.response?.data?.message || t('learner.dashboard.starToggleFailed'));
    }
  };

  const completedEnrollments = enrollments.filter((e) => completion[e.program?._id]?.certificateIssued);
  const showSearch = completedEnrollments.length > 4;

  const matchesSearch = useMemo(() => {
    const q = search.trim().toLowerCase();
    return (e) => {
      if (!q) return true;
      const p = e.program ?? {};
      return [p.title, p.titleAr, p.category, p.categoryAr].some((v) => v?.toLowerCase().includes(q));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  // Starred courses always float to the top; within each group, sort by the
  // selected criterion.
  const visibleCompleted = [...completedEnrollments]
    .filter(matchesSearch)
    .sort((a, b) => {
      if (a.isStarred !== b.isStarred) return a.isStarred ? -1 : 1;
      if (sortBy === 'alphabetical') {
        return getLocalizedProgramField(a.program, 'title', i18n.language).localeCompare(getLocalizedProgramField(b.program, 'title', i18n.language));
      }
      return new Date(b.completedAt ?? 0) - new Date(a.completedAt ?? 0);
    });
  const searchActive = showSearch && search.trim().length > 0;
  const noSearchResults = searchActive && visibleCompleted.length === 0;

  // Average of the passing-attempt score for each completed course that
  // actually had a quiz — courses without one never produced an attempt, so
  // they're simply excluded rather than counted as 0.
  const scoredCompletions = completedEnrollments
    .map((e) => achievements?.attempts?.find((a) => a.program?._id === e.program?._id && a.passed)?.score)
    .filter((s) => typeof s === 'number');
  const averageScore = scoredCompletions.length
    ? Math.round(scoredCompletions.reduce((sum, s) => sum + s, 0) / scoredCompletions.length)
    : null;

  const certificateCount = achievements?.certificates?.length ?? completedEnrollments.length;
  const bestStreak = Math.max(0, ...Object.values(completion).map((c) => c.streak?.longest ?? 0));
  const weeklyActiveDays = weeklyActiveDayCount(completion);
  const inProgressCount = enrollments.length - completedEnrollments.length;

  const searchBox = showSearch && (
    <div className="relative w-48 sm:w-64">
      <Search className="w-4 h-4 text-[#94A3B8] absolute start-3 top-1/2 -translate-y-1/2" />
      <input
        value={search}
        onChange={(ev) => setSearch(ev.target.value)}
        placeholder={t('learner.dashboard.searchPlaceholder')}
        className="w-full ps-9 pe-3 py-2 rounded-xl border border-[#E2E8F0] bg-white text-sm text-[#1E293B] placeholder:text-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-mwasalatInk-500/20 focus:border-mwasalatInk-300 transition-colors"
      />
    </div>
  );

  return (
    <MwasalatLearnerLayout title={t('learner.completed.title')} subtitle={t('learner.completed.subtitle')} actions={searchBox}>
      {isLoading ? (
        <div className="p-10 flex items-center justify-center text-[#94A3B8]">
          <Loader2 className="w-5 h-5 animate-spin me-2" /> {t('learner.completed.loading')}
        </div>
      ) : completedEnrollments.length === 0 ? (
        <div className="card p-12 text-center max-w-md mx-auto">
          <GraduationCap className="w-10 h-10 text-mwasalatInk-400 mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-[#1E293B] mb-1.5">{t('learner.completed.emptyTitle')}</h2>
          <p className="text-sm text-[#475569] mb-5">{t('learner.completed.emptyBody')}</p>
          <Link
            to="/mwasalat/learner/dashboard"
            className="inline-flex items-center gap-2 bg-mwasalatInk-500 hover:bg-mwasalatInk-400 text-white font-semibold px-5 py-2.5 rounded-xl transition-colors text-sm"
          >
            <Compass className="w-4 h-4" /> {t('learner.completed.goToMyLearning')}
          </Link>
        </div>
      ) : (
        <>
          {/* Hero */}
          <div className="relative overflow-hidden rounded-2xl p-5 sm:p-7 mb-5 flex items-center justify-between gap-5 bg-gradient-to-br from-mwasalatRed-100 via-white to-mwasalatInk-100">
            <div className="relative z-10 min-w-0">
              <h1 className="text-xl sm:text-2xl font-bold text-mwasalatInk-500 mb-1.5 flex items-center gap-2">
                {t('learner.completed.title')} <span aria-hidden="true">🎉</span>
              </h1>
              <p className="text-sm text-[#475569] max-w-md">
                {localizeNumber(t('learner.completed.heroSubtitle', { count: completedEnrollments.length, certCount: certificateCount }), i18n.language)}
              </p>
            </div>
            <div className="relative hidden sm:flex items-center justify-center w-24 h-24 rounded-full bg-white shadow-sm flex-shrink-0">
              <GraduationCap className="w-10 h-10 text-mwasalatRed-600" />
              <span className="absolute -bottom-1 -end-1 w-9 h-9 rounded-full bg-white shadow-sm flex items-center justify-center">
                <Trophy className="w-4.5 h-4.5 text-[#F59E0B]" fill="currentColor" />
              </span>
            </div>
          </div>

          <div className="grid lg:grid-cols-3 gap-4">
            {/* Main column */}
            <div className="lg:col-span-2 min-w-0">
              <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
                <h2 className="text-base font-semibold text-[#1E293B]">
                  {localizeNumber(t('learner.completed.completedCoursesHeading', { count: completedEnrollments.length }), i18n.language)}
                </h2>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="text-xs font-medium text-[#475569] bg-white border border-[#E2E8F0] rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-mwasalatInk-500/20 hover:border-mwasalatInk-300 transition-colors"
                >
                  <option value="recent">{t('learner.completed.sortRecent')}</option>
                  <option value="alphabetical">{t('learner.completed.sortAlphabetical')}</option>
                </select>
              </div>

              {noSearchResults ? (
                <div className="card p-10 text-center mb-6">
                  <Search className="w-8 h-8 text-[#94A3B8] mx-auto mb-3" />
                  <p className="text-sm text-[#475569]">{t('learner.dashboard.noSearchMatch')}</p>
                </div>
              ) : (
                <div className="flex flex-col gap-4 mb-6">
                  {visibleCompleted.map((e, i) => {
                    const programId = e.program?._id;
                    const certificate = achievements?.certificates?.find((c) => c.program?._id === programId);
                    const attempt = achievements?.attempts?.find((a) => a.program?._id === programId && a.passed);
                    return (
                      <CompletedCourseCard
                        key={e._id}
                        enrollment={e}
                        certificate={certificate}
                        attempt={attempt}
                        onToggleStar={handleToggleStar}
                        t={t}
                        i18n={i18n}
                        delay={i * 40}
                      />
                    );
                  })}
                </div>
              )}

              {achievements?.certificates?.length > 0 && (
                <>
                  <div className="flex items-center justify-between mb-3">
                    <h2 className="text-sm font-semibold text-[#1E293B]">
                      {localizeNumber(t('learner.completed.certificatesEarnedHeading', { count: achievements.certificates.length }), i18n.language)}
                    </h2>
                    <Link to="/mwasalat/learner/achievements" className="inline-flex items-center gap-1 text-xs font-medium text-mwasalatInk-500 hover:underline">
                      {t('learner.completed.viewAllCertificates')}
                    </Link>
                  </div>
                  <div className="grid sm:grid-cols-2 gap-4">
                    {achievements.certificates.slice(0, 4).map((c) => (
                      <MwasalatCertificateMiniCard key={c._id} certificate={c} theme={themeForCategory(c.program?.category)} />
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Sidebar column */}
            <div className="min-w-0 flex flex-col gap-4">
              <div className="card p-4">
                <div className="flex items-center gap-2 mb-3">
                  <BarChart3 className="w-4 h-4 text-mwasalatInk-500" />
                  <h2 className="text-[13px] font-semibold text-[#1E293B]">{t('learner.completed.summaryHeading')}</h2>
                </div>
                <div className="grid grid-cols-2 gap-2.5 mb-3">
                  <SummaryTile value={localizeNumber(completedEnrollments.length, i18n.language)} label={t('learner.completed.statCoursesCompleted')} color="#C22033" />
                  <SummaryTile value={localizeNumber(certificateCount, i18n.language)} label={t('learner.completed.statCertificatesEarned')} color="#23181A" />
                  <SummaryTile value={averageScore !== null ? `${localizeNumber(averageScore, i18n.language)}%` : '—'} label={t('learner.completed.statAverageScore')} color="#22C55E" />
                  <SummaryTile value={t('learner.achievements.bestStreakValue', { count: bestStreak })} label={t('learner.achievements.bestStreakLabel')} color="#F59E0B" />
                </div>
                <Link
                  to="/mwasalat/learner/achievements"
                  className="inline-flex items-center gap-1.5 text-xs font-medium text-mwasalatInk-500 hover:underline"
                >
                  {t('learner.completed.viewFullReport')} <ArrowRight className="w-3 h-3 rtl:rotate-180" />
                </Link>
              </div>

              {achievements?.certificates?.length > 0 && (
                <div className="card p-4">
                  <div className="w-10 h-10 rounded-xl bg-mwasalatRed-100 flex items-center justify-center text-mwasalatRed-600 mb-3">
                    <Trophy className="w-5 h-5" />
                  </div>
                  <p className="text-sm font-bold text-[#1E293B] mb-1">{t('learner.completed.greatWorkTitle')}</p>
                  <p className="text-xs text-[#475569] mb-3">
                    {localizeNumber(t('learner.completed.greatWorkBody', { count: completedEnrollments.length }), i18n.language)}
                  </p>
                  <Link
                    to="/mwasalat/learner/achievements"
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-mwasalatRed-600 bg-mwasalatRed-100 hover:bg-mwasalatRed-100/70 px-3 py-2 rounded-lg transition-colors w-fit"
                  >
                    <Trophy className="w-3.5 h-3.5" /> {t('learner.completed.viewAchievementsCta')}
                  </Link>
                </div>
              )}

              <div className="card p-4">
                <h2 className="text-[13px] font-semibold text-[#1E293B] mb-3">{t('learner.completed.keepGoingHeading')}</h2>
                <div className="flex justify-center mb-3">
                  <DonutChart
                    data={[
                      { label: t('learner.dashboard.weeklyActivityActive'), value: weeklyActiveDays },
                      { label: t('learner.dashboard.weeklyActivityRest'), value: Math.max(0, 7 - weeklyActiveDays) },
                    ]}
                    colors={['#C22033', '#F1F5F9']}
                    size={100}
                    centerValue={`${localizeNumber(weeklyActiveDays, i18n.language)}/${localizeNumber(7, i18n.language)}`}
                    centerLabel={t('learner.dashboard.weeklyActivityLabel')}
                  />
                </div>
                <p className="text-xs text-[#475569] text-center mb-3">
                  {inProgressCount > 0
                    ? localizeNumber(t('learner.completed.keepGoingBodyInProgress', { count: inProgressCount }), i18n.language)
                    : t('learner.dashboard.allCompleteTitle')}
                </p>
                <Link
                  to={inProgressCount > 0 ? '/mwasalat/learner/dashboard' : '/mwasalat/learner/courses'}
                  className="inline-flex items-center justify-center gap-1.5 w-full bg-mwasalatInk-100 hover:bg-mwasalatInk-200 text-mwasalatInk-500 font-semibold px-3 py-2 rounded-lg transition-colors text-[12px]"
                >
                  {inProgressCount > 0 ? t('learner.completed.keepGoingCta') : t('learner.dashboard.browseCourses')}
                  <ArrowRight className="w-3.5 h-3.5 rtl:rotate-180" />
                </Link>
              </div>
            </div>
          </div>
        </>
      )}
    </MwasalatLearnerLayout>
  );
}
