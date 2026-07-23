import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import {
  ArrowLeft, Loader2, Clock, Calendar, MessageCircle, HelpCircle, Award, CheckCircle2, Lock, MessageSquare, MessagesSquare,
} from 'lucide-react';
import MwasalatLearnerLayout from '../../layouts/MwasalatLearnerLayout.jsx';
import { mwasalatProgramService } from '../../services/mwasalatProgram.service.js';
import { mwasalatChatService } from '../../services/mwasalatChat.service.js';
import MwasalatContentAccess from '../../components/mwasalat/MwasalatContentAccess.jsx';
import MwasalatProgressRoad from '../../components/mwasalat/MwasalatProgressRoad.jsx';
import MwasalatStreakBadge from '../../components/mwasalat/MwasalatStreakBadge.jsx';
import MwasalatStreakStrip from '../../components/mwasalat/MwasalatStreakStrip.jsx';
import { themeForCategory } from '../../utils/mwasalatCategoryTheme.js';
import { stageProgress } from '../../utils/mwasalatProgress.js';
import { getLocalizedProgramField, localizeNumber } from '../../utils/mwasalatLocalize.js';

export default function MwasalatLearnerCourseDetailPage() {
  const { t, i18n } = useTranslation('mwasalatApp');
  const locale = i18n.language === 'ar' ? 'ar-OM' : 'en-GB';
  const { id } = useParams();
  const navigate = useNavigate();
  const [program, setProgram] = useState(null);
  const [enrollment, setEnrollment] = useState(null);
  const [completion, setCompletion] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isStartingChat, setIsStartingChat] = useState(false);

  const refresh = () => {
    return Promise.all([
      mwasalatProgramService.getCompletionStatus(id),
      mwasalatProgramService.listMyEnrollments(),
    ]).then(([c, enrollments]) => {
      setCompletion(c);
      setEnrollment(enrollments.find((e) => e.program?._id === id) ?? null);
    });
  };

  useEffect(() => {
    Promise.all([
      mwasalatProgramService.getById(id),
      mwasalatProgramService.getCompletionStatus(id),
      mwasalatProgramService.listMyEnrollments(),
    ]).then(([p, c, enrollments]) => {
      setProgram(p);
      setCompletion(c);
      setEnrollment(enrollments.find((e) => e.program?._id === id) ?? null);
    }).finally(() => setIsLoading(false));
  }, [id]);

  const handleChat = async () => {
    setIsStartingChat(true);
    try {
      await mwasalatChatService.getOrCreateAsLearner(id);
      navigate(`/mwasalat/learner/programs/${id}/chat`);
    } catch (err) {
      toast.error(err.response?.data?.message || t('learnerCourseDetail.chatStartFailed'));
    } finally {
      setIsStartingChat(false);
    }
  };

  const theme = program ? themeForCategory(program.category) : null;
  const progress = completion ? stageProgress(completion) : 0;
  const title = getLocalizedProgramField(program, 'title', i18n.language);
  const category = getLocalizedProgramField(program, 'category', i18n.language);
  const description = getLocalizedProgramField(program, 'description', i18n.language);
  const duration = getLocalizedProgramField(program, 'duration', i18n.language);

  return (
    <MwasalatLearnerLayout title={title || t('learnerCourseDetail.titleFallback')} subtitle={category}>
      <div className="max-w-2xl mx-auto">
        {isLoading ? (
          <div className="p-10 flex items-center justify-center text-[#94A3B8]">
            <Loader2 className="w-5 h-5 animate-spin me-2" /> {t('learnerCourseDetail.loading')}
          </div>
        ) : !program ? (
          <div className="card p-10 text-center text-sm text-[#475569]">{t('learnerCourseDetail.notFound')}</div>
        ) : (
          <>
            <Link
              to="/mwasalat/learner/dashboard"
              className="inline-flex items-center gap-1.5 text-sm font-medium text-[#475569] hover:text-mwasalatInk-500 transition-colors mb-4"
            >
              <ArrowLeft className="w-4 h-4 rtl:rotate-180" /> {t('learnerCourseDetail.backToMyLearning')}
            </Link>

            <div className="card overflow-hidden">
              <div className="h-2" style={{ background: `linear-gradient(90deg, ${theme.solid}, ${theme.solid}99)` }} />
              <div className="p-6">
                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium capitalize mb-3 ${theme.bg} ${theme.text}`}>
                  {category || t('learnerCourseDetail.categoryFallback')}
                </span>
                <h1 className="text-xl font-bold text-[#1E293B] mb-2">{title}</h1>
                {description && <p className="text-sm text-[#475569] leading-relaxed mb-4">{description}</p>}

                <div className="flex flex-wrap items-center gap-4 text-xs text-[#94A3B8] mb-5">
                  <span className="inline-flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5" /> {duration || '—'}
                  </span>
                  {enrollment && (
                    <span className="inline-flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5" />
                      {completion?.certificateIssued && enrollment.completedAt
                        ? t('learner.dashboard.completedOn', { date: localizeNumber(new Date(enrollment.completedAt).toLocaleDateString(locale), i18n.language) })
                        : t('learner.dashboard.enrolledOn', { date: localizeNumber(new Date(enrollment.purchasedAt).toLocaleDateString(locale), i18n.language) })}
                    </span>
                  )}
                </div>

                <div className="mb-6">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[11px] font-semibold text-[#94A3B8] uppercase tracking-wide">{t('learnerCourseDetail.progressLabel')}</span>
                    <span className="text-[11px] font-semibold" style={{ color: theme.solid }}>{localizeNumber(progress, i18n.language)}%</span>
                  </div>
                  <MwasalatProgressRoad progress={progress} color={theme.solid} />
                </div>

                {completion?.streak && (completion.streak.current > 0 || completion.streak.longest > 0) && (
                  <div className="mb-6 p-4 rounded-xl bg-[#FEF3C7]/40 border border-[#FDE68A]/60">
                    <div className="flex items-center justify-between mb-2.5 flex-wrap gap-2">
                      <MwasalatStreakBadge current={completion.streak.current} size="lg" />
                      {completion.streak.longest > completion.streak.current && (
                        <span className="text-xs text-[#94A3B8]">
                          {localizeNumber(t('learnerCourseDetail.longestStreak', { count: completion.streak.longest }), i18n.language)}
                        </span>
                      )}
                    </div>
                    <MwasalatStreakStrip recentActiveDates={completion.streak.recentActiveDates} />
                  </div>
                )}

                <MwasalatContentAccess
                  program={program}
                  openedContentTypes={enrollment?.openedContentTypes ?? []}
                  pdfProgress={completion?.pdfProgress ?? null}
                  onContentOpened={refresh}
                />

                <div className="space-y-1.5 mb-5">
                  {completion?.certificateIssued ? (
                    <Link
                      to={`/mwasalat/learner/programs/${id}/certificate`}
                      className="w-full flex items-center justify-center gap-1.5 bg-mwasalatInk-100 hover:bg-mwasalatInk-200 text-mwasalatInk-500 font-semibold px-4 py-2.5 rounded-xl text-sm transition-colors"
                    >
                      <Award className="w-4 h-4" /> {t('learnerCourseDetail.viewCertificate')}
                    </Link>
                  ) : (
                    <>
                      {completion?.hasQuiz && !completion?.quizPassed && completion?.contentOpened && (
                        <Link
                          to={`/mwasalat/learner/programs/${id}/quiz`}
                          className="w-full flex items-center justify-center gap-1.5 bg-mwasalatInk-500 hover:bg-mwasalatInk-400 text-white font-semibold px-4 py-2.5 rounded-xl text-sm transition-colors"
                        >
                          <HelpCircle className="w-4 h-4" /> {t('learnerCourseDetail.takeAssessment')}
                        </Link>
                      )}
                      {completion?.hasQuiz && !completion?.quizPassed && !completion?.contentOpened && (
                        <p className="flex items-center gap-1.5 text-xs font-medium text-[#94A3B8] px-1">
                          <Lock className="w-3.5 h-3.5" /> {t('learnerCourseDetail.lockedNote')}
                        </p>
                      )}
                      {completion?.hasQuiz && completion?.quizPassed && (
                        <p className="flex items-center gap-1.5 text-xs font-medium text-[#22C55E] px-1">
                          <CheckCircle2 className="w-3.5 h-3.5" /> {t('learnerCourseDetail.assessmentPassed')}
                        </p>
                      )}
                      {(!completion?.hasQuiz || completion?.quizPassed) && !completion?.feedbackSubmitted && (
                        <Link
                          to={`/mwasalat/learner/programs/${id}/feedback`}
                          className="w-full flex items-center justify-center gap-1.5 bg-mwasalatInk-500 hover:bg-mwasalatInk-400 text-white font-semibold px-4 py-2.5 rounded-xl text-sm transition-colors"
                        >
                          <MessageSquare className="w-4 h-4" /> {t('learnerCourseDetail.giveFeedback')}
                        </Link>
                      )}
                    </>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={handleChat}
                    disabled={isStartingChat}
                    className="flex items-center justify-center gap-2 border border-mwasalatInk-300 hover:bg-mwasalatInk-100 text-mwasalatInk-500 font-semibold px-4 py-2.5 rounded-xl text-sm transition-colors disabled:opacity-60"
                  >
                    {isStartingChat ? <Loader2 className="w-4 h-4 animate-spin" /> : <MessageCircle className="w-4 h-4" />}
                    {t('learnerCourseDetail.chatWithInstructor')}
                  </button>
                  <Link
                    to={`/mwasalat/learner/programs/${id}/discussion`}
                    className="flex items-center justify-center gap-2 border border-mwasalatInk-300 hover:bg-mwasalatInk-100 text-mwasalatInk-500 font-semibold px-4 py-2.5 rounded-xl text-sm transition-colors"
                  >
                    <MessagesSquare className="w-4 h-4" /> {t('learnerCourseDetail.courseDiscussion')}
                  </Link>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </MwasalatLearnerLayout>
  );
}
