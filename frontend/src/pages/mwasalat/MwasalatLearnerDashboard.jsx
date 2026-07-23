import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import {
  Loader2, Compass, BookOpen, GraduationCap, Flame, Trophy, Clock, Star, ArrowRight, Table2,
  PlayCircle, Award, Target, Radio, MapPin, CreditCard,
} from 'lucide-react';
import { mwasalatProgramService } from '../../services/mwasalatProgram.service.js';
import { mwasalatPaymentService } from '../../services/mwasalatPayment.service.js';
import { mwasalatNotificationService } from '../../services/mwasalatNotification.service.js';
import { useMwasalatAuthStore } from '../../store/mwasalatAuthStore.js';
import MwasalatLearnerLayout from '../../layouts/MwasalatLearnerLayout.jsx';
import MwasalatEnrollmentCard from '../../components/mwasalat/MwasalatEnrollmentCard.jsx';
import MwasalatFlyingCar from '../../components/mwasalat/MwasalatFlyingCar.jsx';
import MwasalatProgressRoad from '../../components/mwasalat/MwasalatProgressRoad.jsx';
import { DonutChart } from '../../components/mwasalat/MwasalatCharts.jsx';
import { themeForCategory } from '../../utils/mwasalatCategoryTheme.js';
import { stageProgress } from '../../utils/mwasalatProgress.js';
import { getLocalizedProgramField, localizeNumber } from '../../utils/mwasalatLocalize.js';

// Cap on the "New" shelf — a taste of what's freshest, not a full listing.
// The full list lives on the All Courses table page.
const NEW_SHELF_SIZE = 3;
const RECOMMENDED_SIZE = 3;
const UPCOMING_SIZE = 4;

function StatTile({ icon: Icon, label, value, tone, animateIcon }) {
  return (
    <div className="card p-3 flex items-center gap-2.5">
      <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${tone.bg} ${tone.text}`}>
        <Icon className={`w-4 h-4 ${animateIcon ? 'flame-flicker' : ''}`} fill={animateIcon ? 'currentColor' : 'none'} />
      </div>
      <div className="min-w-0">
        <p className="text-base font-bold text-[#1E293B] leading-tight">{value}</p>
        <p className="text-[11px] text-[#94A3B8] truncate">{label}</p>
      </div>
    </div>
  );
}

// Notifications are the only real per-learner "activity" feed the backend
// exposes (broadcasts + auto-fired streak/welcome-back messages) — the
// admin-only activity log isn't reachable from here. Mirrors the timeAgo
// logic in MwasalatNotificationBell.
function timeAgo(dateStr, t, lang) {
  const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (seconds < 60) return t('common.justNow');
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return localizeNumber(t('common.minutesAgo', { count: minutes }), lang);
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return localizeNumber(t('common.hoursAgo', { count: hours }), lang);
  const days = Math.floor(hours / 24);
  return localizeNumber(t('common.daysAgo', { count: days }), lang);
}

// Distinct UTC day-keys active in the last 7 days, unioned across every
// enrolled course's own streak (recentActiveDates is per-course on the
// backend — there's no account-wide streak field to read instead).
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

// There's no lesson/module concept in this app — content is flat
// (pdf/recording/live/ilt) per course. "Next step" is synthesized from
// whichever content type hasn't been opened yet, else the quiz, else feedback.
function nextStepFor(completion, t) {
  if (!completion) return null;
  const missingType = (completion.contentTypes ?? []).find((type) => !completion.openedContentTypes?.includes(type));
  if (missingType) return t('learner.dashboard.nextStepContent', { type: t(`addCourse.contentTypes.${missingType}.label`) });
  if (completion.hasQuiz && !completion.quizPassed) return t('learner.dashboard.nextStepQuiz');
  if (!completion.feedbackSubmitted) return t('learner.dashboard.nextStepFeedback');
  return null;
}

// Learner's own enrolled programs with a future live/ILT session — there's
// no learner-scoped "upcoming classes" endpoint (the real one is admin-only),
// so this reads the scheduledAt fields already present on the populated
// program docs from listMyEnrollments().
function getUpcomingSessions(enrollments) {
  const now = new Date();
  return enrollments
    .map((e) => {
      const p = e.program;
      if (!p) return null;
      const types = p.contentTypes ?? [];
      if (types.includes('live') && p.liveScheduledAt && new Date(p.liveScheduledAt) >= now) {
        return { program: p, scheduledAt: p.liveScheduledAt, type: 'live' };
      }
      if (types.includes('ilt') && p.iltScheduledAt && new Date(p.iltScheduledAt) >= now) {
        return { program: p, scheduledAt: p.iltScheduledAt, type: 'ilt' };
      }
      return null;
    })
    .filter(Boolean)
    .sort((a, b) => new Date(a.scheduledAt) - new Date(b.scheduledAt))
    .slice(0, UPCOMING_SIZE);
}

function ContinueLearningCard({ enrollment, completion, t, i18n }) {
  const theme = themeForCategory(enrollment.program?.category);
  const progress = stageProgress(completion);
  const title = getLocalizedProgramField(enrollment.program, 'title', i18n.language);
  const category = getLocalizedProgramField(enrollment.program, 'category', i18n.language);
  const next = nextStepFor(completion, t);

  return (
    <div className="card overflow-hidden mb-4">
      <div className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center gap-4">
        <div
          className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0"
          style={{ background: `linear-gradient(135deg, ${theme.solid}, ${theme.solid}cc)` }}
        >
          <PlayCircle className="w-7 h-7 text-white" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 mb-1">
            <span className="text-[10px] font-semibold uppercase tracking-wide text-mwasalatRed-600">{t('learner.dashboard.continueLearningHeading')}</span>
            <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-[10.5px] font-medium capitalize ${theme.bg} ${theme.text}`}>
              {category || t('programCard.generalCategory')}
            </span>
          </div>
          <h3 className="text-base font-bold text-[#1E293B] leading-snug mb-2 truncate">{title}</h3>
          <div className="max-w-md">
            <div className="flex items-center justify-between mb-1 gap-2">
              <span className="text-[11px] text-[#94A3B8] flex-shrink-0">{localizeNumber(progress, i18n.language)}% {t('learner.dashboard.complete')}</span>
              {next && <span className="text-[11px] font-medium text-mwasalatInk-500 truncate">{next}</span>}
            </div>
            <MwasalatProgressRoad progress={progress} color={theme.solid} size="sm" />
          </div>
        </div>
        <Link
          to={`/mwasalat/learner/programs/${enrollment.program?._id}`}
          data-card-id={enrollment.program?._id}
          className="inline-flex items-center justify-center gap-2 bg-mwasalatRed-600 hover:bg-mwasalatRed-700 text-white font-semibold px-4 py-2.5 rounded-xl transition-colors text-sm flex-shrink-0"
        >
          {t('learner.dashboard.resumeCourse')} <ArrowRight className="w-3.5 h-3.5 rtl:rotate-180" />
        </Link>
      </div>
    </div>
  );
}

function AchievementBadge({ icon: Icon, label, earned }) {
  return (
    <div className={`flex flex-col items-center gap-1.5 py-1 ${earned ? '' : 'opacity-40'}`}>
      <div className={`w-9 h-9 rounded-full flex items-center justify-center ${earned ? 'bg-mwasalatRed-100 text-mwasalatRed-600' : 'bg-[#F1F5F9] text-[#94A3B8]'}`}>
        <Icon className="w-4 h-4" />
      </div>
      <span className="text-[10px] text-center text-[#475569] leading-tight">{label}</span>
    </div>
  );
}

function UpcomingSessionRow({ session, i18n, t }) {
  const dateLocale = i18n.language === 'ar' ? 'ar-OM' : 'en-GB';
  const date = new Date(session.scheduledAt);
  const title = getLocalizedProgramField(session.program, 'title', i18n.language);

  return (
    <Link
      to={`/mwasalat/learner/programs/${session.program._id}`}
      className="flex items-center gap-2.5 py-2 -mx-1.5 px-1.5 rounded-lg hover:bg-[#F8F9FB] transition-colors"
    >
      <div className="w-9 h-9 rounded-lg bg-mwasalatInk-100 flex flex-col items-center justify-center flex-shrink-0 text-mwasalatInk-500 leading-none">
        <span className="text-[13px] font-bold">{localizeNumber(date.getDate(), i18n.language)}</span>
        <span className="text-[8px] uppercase mt-0.5">{date.toLocaleDateString(dateLocale, { month: 'short' })}</span>
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[12.5px] font-medium text-[#1E293B] truncate">{title}</p>
        <p className="text-[10.5px] text-[#94A3B8]" dir="ltr">
          {date.toLocaleTimeString(dateLocale, { hour: 'numeric', minute: '2-digit' })}
        </p>
      </div>
      <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-medium flex-shrink-0 ${
        session.type === 'live' ? 'bg-mwasalatRed-100 text-mwasalatRed-600' : 'bg-[#EDE9FE] text-[#7C6AF2]'
      }`}>
        {session.type === 'live' ? <Radio className="w-2.5 h-2.5" /> : <MapPin className="w-2.5 h-2.5" />}
        {t(session.type === 'live' ? 'learner.dashboard.liveLabel' : 'learner.dashboard.iltLabel')}
      </span>
    </Link>
  );
}

function RecommendedCard({ program, onEnroll, onPurchase, busy, t, i18n }) {
  const theme = themeForCategory(program.category);
  const title = getLocalizedProgramField(program, 'title', i18n.language);
  const category = getLocalizedProgramField(program, 'category', i18n.language);

  return (
    <div className="card overflow-hidden flex flex-col">
      <div className="h-1" style={{ background: `linear-gradient(90deg, ${theme.solid}, ${theme.solid}99)` }} />
      <div className="p-3 flex flex-col flex-1">
        <span className={`self-start inline-flex items-center px-1.5 py-0.5 rounded-full text-[10.5px] font-medium capitalize mb-1.5 ${theme.bg} ${theme.text}`}>
          {category || t('programCard.generalCategory')}
        </span>
        <h3 className="text-[13px] font-semibold text-[#1E293B] leading-snug mb-2 line-clamp-2">{title}</h3>
        <div className="mt-auto flex items-center justify-between gap-2">
          <span dir="ltr" className={`text-[11px] font-bold ${program.price ? 'text-mwasalatRed-600' : 'text-[#22C55E]'}`}>
            {program.price ? `OMR ${localizeNumber(program.price, i18n.language)}` : t('learner.courses.freeLabel')}
          </span>
          <button
            type="button"
            onClick={() => (program.price > 0 ? onPurchase(program) : onEnroll(program))}
            disabled={busy}
            className="inline-flex items-center gap-1 bg-mwasalatInk-500 hover:bg-mwasalatInk-400 disabled:opacity-60 text-white font-semibold px-2.5 py-1.5 rounded-lg transition-colors text-[11px] flex-shrink-0"
          >
            {busy ? <Loader2 className="w-3 h-3 animate-spin" /> : program.price > 0 ? <CreditCard className="w-3 h-3" /> : null}
            {program.price > 0 ? t('learner.courses.purchase') : t('learner.courses.enrollNow')}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function MwasalatLearnerDashboard() {
  const { t, i18n } = useTranslation('mwasalatApp');
  const [searchParams, setSearchParams] = useSearchParams();
  const [enrollments, setEnrollments] = useState([]);
  const [completion, setCompletion] = useState({});
  const [achievements, setAchievements] = useState(null);
  const [recommended, setRecommended] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [enrollingId, setEnrollingId] = useState(null);
  const [flight, setFlight] = useState(null);
  const { user } = useMwasalatAuthStore();

  const load = () => {
    setIsLoading(true);
    Promise.all([
      mwasalatProgramService.listMyEnrollments(),
      mwasalatProgramService.getMyAchievements().catch(() => null),
      mwasalatProgramService.listPublic().catch(() => []),
      mwasalatNotificationService.list().catch(() => []),
    ]).then(async ([e, ach, pub, notifs]) => {
      setEnrollments(e);
      setAchievements(ach);
      setNotifications(notifs);
      const enrolledIds = new Set(e.map((enr) => enr.program?._id));
      setRecommended(pub.filter((p) => !enrolledIds.has(p._id)).slice(0, RECOMMENDED_SIZE));
      const entries = await Promise.all(
        e.map(async (enr) => [enr.program?._id, await mwasalatProgramService.getCompletionStatus(enr.program?._id)])
      );
      setCompletion(Object.fromEntries(entries));
    }).finally(() => setIsLoading(false));
  };

  useEffect(() => { load(); }, []);

  useEffect(() => {
    const purchase = searchParams.get('purchase');
    const sessionId = searchParams.get('session_id');

    if (purchase === 'success' && sessionId) {
      // Confirm the session ourselves instead of trusting the redirect alone —
      // this enrolls the learner immediately even if the Stripe webhook (which
      // needs `stripe listen` locally) hasn't fired yet.
      setSearchParams({}, { replace: true });
      mwasalatPaymentService.confirmSession(sessionId)
        .then(() => {
          toast.success(t('learner.dashboard.paymentSuccess'));
          load();
        })
        .catch((err) => toast.error(err.response?.data?.message || t('learner.dashboard.paymentConfirmFailed')));
    } else if (purchase === 'success') {
      toast.success(t('learner.dashboard.paymentSuccess'));
      setSearchParams({}, { replace: true });
      load();
    } else if (purchase === 'cancelled') {
      toast(t('learner.dashboard.checkoutCancelled'), { icon: 'ℹ️' });
      setSearchParams({}, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  // If we just came back from passing a quiz, fly a car from that course's
  // card to the points badge in the header. Runs once cards are on the page
  // so both endpoints of the flight actually exist in the DOM.
  useEffect(() => {
    if (isLoading) return;
    const raw = sessionStorage.getItem('mwasalat-fly-reward');
    if (!raw) return;
    sessionStorage.removeItem('mwasalat-fly-reward');

    let payload;
    try {
      payload = JSON.parse(raw);
    } catch {
      return;
    }

    const card = document.querySelector(`[data-card-id="${payload.programId}"]`);
    const badge = document.getElementById('mwasalat-points-badge');
    if (!card || !badge) return;

    const cardRect = card.getBoundingClientRect();
    const badgeRect = badge.getBoundingClientRect();
    setFlight({
      points: payload.points,
      from: { x: cardRect.left + cardRect.width / 2, y: cardRect.top + 24 },
      to: { x: badgeRect.left + badgeRect.width / 2, y: badgeRect.top + badgeRect.height / 2 },
    });
  }, [isLoading, enrollments]);

  const handleFlightDone = () => {
    if (flight) toast.success(localizeNumber(t('learner.dashboard.pointsToast', { points: flight.points }), i18n.language), { icon: '🚗' });
    setFlight(null);
    const badge = document.getElementById('mwasalat-points-badge');
    if (badge) {
      badge.classList.add('mwasalat-badge-pulse');
      setTimeout(() => badge.classList.remove('mwasalat-badge-pulse'), 500);
    }
  };

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

  const handleRecommendedEnroll = async (program) => {
    setEnrollingId(program._id);
    try {
      await mwasalatProgramService.enroll(program._id);
      toast.success(t('learner.courses.enrolledToast', { title: getLocalizedProgramField(program, 'title', i18n.language) }));
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || t('learner.courses.enrollFailed'));
    } finally {
      setEnrollingId(null);
    }
  };

  const handleRecommendedPurchase = async (program) => {
    setEnrollingId(program._id);
    try {
      const { url } = await mwasalatPaymentService.createCheckoutSession(program._id);
      window.location.href = url;
    } catch (err) {
      toast.error(err.response?.data?.message || t('learner.courses.checkoutFailed'));
      setEnrollingId(null);
    }
  };

  const completedEnrollments = enrollments.filter((e) => completion[e.program?._id]?.certificateIssued);
  const inProgressEnrollments = enrollments.filter((e) => !completion[e.program?._id]?.certificateIssued);
  const starredEnrollments = enrollments.filter((e) => e.isStarred);
  // Most-recently-purchased in-progress courses that aren't already pinned in
  // the Starred shelf above — enrollments arrive newest-first from the API.
  const newEnrollments = inProgressEnrollments.filter((e) => !e.isStarred).slice(0, NEW_SHELF_SIZE);
  const firstName = user?.name?.split(' ')[0] ?? 'there';
  const isNewUser = user?.isNewUser;
  const bestStreak = Math.max(0, ...Object.values(completion).map((c) => c.streak?.longest ?? 0));

  // Most recently active in-progress course (falling back to most recently
  // purchased if it's never been opened yet) is what "Continue Learning" resumes.
  const continueTarget = [...inProgressEnrollments].sort((a, b) => {
    const aDate = completion[a.program?._id]?.streak?.lastActiveDate || a.purchasedAt;
    const bDate = completion[b.program?._id]?.streak?.lastActiveDate || b.purchasedAt;
    return new Date(bDate) - new Date(aDate);
  })[0];

  const weeklyActiveDays = weeklyActiveDayCount(completion);
  const upcomingSessions = getUpcomingSessions(enrollments);
  const latestCertificate = achievements?.certificates?.[0];
  const quizChampion = achievements?.attempts?.some((a) => a.passed && a.attemptNumber === 1) ?? false;
  const perfectScore = achievements?.attempts?.some((a) => a.score === 100) ?? false;
  const dateLocale = i18n.language === 'ar' ? 'ar-OM' : 'en-GB';

  return (
    <MwasalatLearnerLayout
      title={t(isNewUser ? 'learner.dashboard.welcomeNewTitle' : 'learner.dashboard.welcomeTitle', { name: firstName })}
      subtitle={enrollments.length === 0
        ? t('learner.dashboard.startFirstProgram')
        : t('learner.dashboard.enrolledIn', { count: enrollments.length })}
    >
      {flight && <MwasalatFlyingCar from={flight.from} to={flight.to} onDone={handleFlightDone} />}

      {/* Stats strip */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-4">
        <StatTile icon={BookOpen} label={t('learner.dashboard.statsEnrolled')} value={localizeNumber(enrollments.length, i18n.language)} tone={{ bg: 'bg-mwasalatInk-100', text: 'text-mwasalatInk-500' }} />
        <StatTile icon={Clock} label={t('learner.dashboard.statsInProgress')} value={localizeNumber(inProgressEnrollments.length, i18n.language)} tone={{ bg: 'bg-mwasalatInk-100', text: 'text-mwasalatInk-500' }} />
        <Link to="/mwasalat/learner/completed">
          <StatTile icon={GraduationCap} label={t('learner.dashboard.statsCompleted')} value={localizeNumber(completedEnrollments.length, i18n.language)} tone={{ bg: 'bg-[#DCFCE7]', text: 'text-[#22C55E]' }} />
        </Link>
        <StatTile icon={Trophy} label={t('learner.dashboard.statsPoints')} value={localizeNumber(user?.points ?? 0, i18n.language)} tone={{ bg: 'bg-mwasalatRed-100', text: 'text-mwasalatRed-600' }} />
        <StatTile icon={Flame} label={t('learner.dashboard.statsBestStreak')} value={localizeNumber(bestStreak, i18n.language)} tone={{ bg: 'bg-[#FEF3C7]', text: 'text-[#F59E0B]' }} animateIcon={bestStreak > 0} />
      </div>

      {isLoading ? (
        <div className="p-10 flex items-center justify-center text-[#94A3B8]">
          <Loader2 className="w-5 h-5 animate-spin me-2" /> {t('learner.dashboard.loadingCourses')}
        </div>
      ) : enrollments.length === 0 ? (
        <div className="card p-14 text-center max-w-lg mx-auto rounded-2xl shadow-sm">
          <div className="w-16 h-16 rounded-2xl bg-mwasalatRed-100 text-mwasalatRed-600 flex items-center justify-center mx-auto mb-5">
            <Compass className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-[#1E293B] mb-2">{t('learner.dashboard.emptyTitle')}</h2>
          <p className="text-sm text-[#475569] mb-6 leading-relaxed">{t('learner.dashboard.emptyBody')}</p>
          <Link
            to="/mwasalat/learner/courses"
            className="inline-flex items-center gap-2 bg-mwasalatRed-600 hover:bg-mwasalatRed-700 text-white font-semibold px-6 py-3 rounded-xl transition-colors text-sm shadow-sm"
          >
            <Compass className="w-4 h-4" /> {t('learner.dashboard.browseCourses')}
          </Link>
        </div>
      ) : (
        <div className="grid lg:grid-cols-3 gap-4">
          {/* Main column */}
          <div className="lg:col-span-2 min-w-0">
            {continueTarget && (
              <ContinueLearningCard
                enrollment={continueTarget}
                completion={completion[continueTarget.program?._id]}
                t={t}
                i18n={i18n}
              />
            )}

            {starredEnrollments.length > 0 && (
              <>
                <h2 className="flex items-center gap-1.5 text-[13px] font-semibold text-[#1E293B] mb-2.5">
                  <Star className="w-3.5 h-3.5 text-[#F59E0B] fill-current" /> {t('learner.dashboard.starredHeading')}
                </h2>
                <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-3.5 mb-5">
                  {starredEnrollments.map((e) => (
                    <MwasalatEnrollmentCard key={e._id} enrollment={e} completion={completion[e.program?._id]} onToggleStar={handleToggleStar} />
                  ))}
                </div>
              </>
            )}

            {newEnrollments.length > 0 ? (
              <>
                <h2 className="text-[13px] font-semibold text-[#1E293B] mb-2.5">{t('learner.dashboard.newHeading')}</h2>
                <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-3.5 mb-4">
                  {newEnrollments.map((e) => (
                    <MwasalatEnrollmentCard key={e._id} enrollment={e} completion={completion[e.program?._id]} onToggleStar={handleToggleStar} />
                  ))}
                </div>
              </>
            ) : inProgressEnrollments.length === 0 && starredEnrollments.length === 0 && (
              <div className="card p-10 text-center mb-6">
                <GraduationCap className="w-8 h-8 text-[#22C55E] mx-auto mb-3" />
                <p className="text-sm font-medium text-[#1E293B] mb-1">{t('learner.dashboard.allCompleteTitle')}</p>
                <Link to="/mwasalat/learner/completed" className="text-sm font-medium text-mwasalatInk-500 hover:underline">
                  {t('learner.dashboard.viewCompleted')}
                </Link>
              </div>
            )}

            <Link
              to="/mwasalat/learner/all-courses"
              className="card card-hover flex items-center justify-between gap-3 p-3 mb-5"
            >
              <span className="flex items-center gap-2.5">
                <span className="w-8 h-8 rounded-lg bg-mwasalatInk-100 flex items-center justify-center text-mwasalatInk-500 flex-shrink-0">
                  <Table2 className="w-3.5 h-3.5" />
                </span>
                <span>
                  <span className="block text-[13px] font-semibold text-[#1E293B]">{t('learner.dashboard.viewAllCourses')}</span>
                  <span className="block text-[11px] text-[#94A3B8]">{localizeNumber(t('learner.dashboard.allCoursesCount', { count: enrollments.length }), i18n.language)}</span>
                </span>
              </span>
              <ArrowRight className="w-3.5 h-3.5 text-[#94A3B8] rtl:rotate-180 flex-shrink-0" />
            </Link>

            {recommended.length > 0 && (
              <>
                <h2 className="text-[13px] font-semibold text-[#1E293B] mb-2.5">{t('learner.dashboard.recommendedHeading')}</h2>
                <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-3.5">
                  {recommended.map((program) => (
                    <RecommendedCard
                      key={program._id}
                      program={program}
                      onEnroll={handleRecommendedEnroll}
                      onPurchase={handleRecommendedPurchase}
                      busy={enrollingId === program._id}
                      t={t}
                      i18n={i18n}
                    />
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Sidebar column */}
          <div className="min-w-0 flex flex-col gap-4">
            <div className="card p-3.5">
              <h2 className="text-[13px] font-semibold text-[#1E293B] mb-3">{t('learner.dashboard.weeklyActivityHeading')}</h2>
              <DonutChart
                data={[
                  { label: t('learner.dashboard.weeklyActivityActive'), value: weeklyActiveDays },
                  { label: t('learner.dashboard.weeklyActivityRest'), value: Math.max(0, 7 - weeklyActiveDays) },
                ]}
                colors={['#C22033', '#F1F5F9']}
                size={92}
                centerValue={`${localizeNumber(weeklyActiveDays, i18n.language)}/${localizeNumber(7, i18n.language)}`}
                centerLabel={t('learner.dashboard.weeklyActivityLabel')}
              />
            </div>

            <div className="card p-3.5">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-[13px] font-semibold text-[#1E293B]">{t('learner.dashboard.achievementsHeading')}</h2>
                <Link to="/mwasalat/learner/achievements" className="text-[11px] font-medium text-mwasalatInk-500 hover:underline">
                  {t('learner.dashboard.viewAll')}
                </Link>
              </div>
              <div className="grid grid-cols-4 gap-1">
                <AchievementBadge icon={GraduationCap} label={t('learner.dashboard.badgeFirstCourse')} earned={completedEnrollments.length > 0} />
                <AchievementBadge icon={Flame} label={t('learner.dashboard.badgeStreak')} earned={bestStreak >= 7} />
                <AchievementBadge icon={Target} label={t('learner.dashboard.badgeQuizChampion')} earned={quizChampion} />
                <AchievementBadge icon={Star} label={t('learner.dashboard.badgePerfectScore')} earned={perfectScore} />
              </div>
            </div>

            {upcomingSessions.length > 0 && (
              <div className="card p-3.5">
                <h2 className="text-[13px] font-semibold text-[#1E293B] mb-1.5">{t('learner.dashboard.upcomingHeading')}</h2>
                <div className="divide-y divide-[#F1F5F9]">
                  {upcomingSessions.map((session) => (
                    <UpcomingSessionRow key={`${session.program._id}-${session.scheduledAt}`} session={session} i18n={i18n} t={t} />
                  ))}
                </div>
              </div>
            )}

            {latestCertificate && (
              <div className="card p-3.5">
                <h2 className="text-[13px] font-semibold text-[#1E293B] mb-3">{t('learner.dashboard.latestCertificateHeading')}</h2>
                <div className="flex items-start gap-2.5">
                  <div className="w-9 h-9 rounded-lg bg-[#DCFCE7] flex items-center justify-center flex-shrink-0 text-[#22C55E]">
                    <Award className="w-4 h-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[12.5px] font-semibold text-[#1E293B] truncate">{getLocalizedProgramField(latestCertificate.program, 'title', i18n.language)}</p>
                    <p className="text-[10.5px] text-[#94A3B8] mt-0.5">
                      {localizeNumber(t('learner.achievements.issuedOn', { date: new Date(latestCertificate.issuedAt).toLocaleDateString(dateLocale) }), i18n.language)}
                    </p>
                  </div>
                </div>
                <Link
                  to={`/mwasalat/learner/programs/${latestCertificate.program?._id}/certificate`}
                  className="mt-3 inline-flex items-center justify-center gap-1.5 w-full bg-mwasalatInk-100 hover:bg-mwasalatInk-200 text-mwasalatInk-500 font-semibold px-3 py-2 rounded-lg transition-colors text-[12px]"
                >
                  {t('allCoursesPage.viewCertificate')} <ArrowRight className="w-3 h-3 rtl:rotate-180" />
                </Link>
              </div>
            )}

            <div className="card p-3.5">
              <h2 className="text-[13px] font-semibold text-[#1E293B] mb-3">{t('learner.dashboard.recentActivityHeading')}</h2>
              {notifications.length === 0 ? (
                <p className="text-[11.5px] text-[#94A3B8]">{t('learner.dashboard.recentActivityEmpty')}</p>
              ) : (
                <div className="space-y-2.5">
                  {notifications.slice(0, 5).map((n) => (
                    <div key={n._id} className="flex items-start gap-2">
                      <span className={`w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0 ${n.isRead ? 'bg-[#E2E8F0]' : 'bg-mwasalatRed-500'}`} />
                      <div className="min-w-0">
                        <p className="text-[12px] text-[#1E293B] leading-snug">{n.title}</p>
                        <p className="text-[10px] text-[#94A3B8] mt-0.5">{timeAgo(n.createdAt, t, i18n.language)}</p>
                      </div>
                    </div>
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
