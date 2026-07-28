import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import {
  ArrowLeft, Loader2, Clock, Calendar, MessageCircle, HelpCircle, ClipboardCheck, Award, CheckCircle2, Lock, MessagesSquare, Hourglass, Users, XCircle, Layers, PlayCircle, CreditCard,
} from 'lucide-react';
import MwasalatLearnerLayout from '../../layouts/MwasalatLearnerLayout.jsx';
import { mwasalatProgramService } from '../../services/mwasalatProgram.service.js';
import { mwasalatChatService } from '../../services/mwasalatChat.service.js';
import { mwasalatPaymentService } from '../../services/mwasalatPayment.service.js';
import { useMwasalatAuthStore } from '../../store/mwasalatAuthStore.js';
import MwasalatContentAccess from '../../components/mwasalat/MwasalatContentAccess.jsx';
import MwasalatCourseReviewInline from '../../components/mwasalat/MwasalatCourseReviewInline.jsx';
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
  const { user } = useMwasalatAuthStore();
  const [program, setProgram] = useState(null);
  const [enrollment, setEnrollment] = useState(null);
  const [completion, setCompletion] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isStartingChat, setIsStartingChat] = useState(false);
  const [isReactivating, setIsReactivating] = useState(false);
  const [isEnrolling, setIsEnrolling] = useState(false);

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

  const handleReactivate = async () => {
    if (!enrollment?._id) return;
    setIsReactivating(true);
    try {
      const { url } = await mwasalatPaymentService.createReactivationCheckoutSession(enrollment._id);
      window.location.href = url;
    } catch (err) {
      toast.error(err.response?.data?.message || t('learnerCourseDetail.locked.reactivateFailed'));
      setIsReactivating(false);
    }
  };

  const handleChat = async () => {
    setIsStartingChat(true);
    try {
      await mwasalatChatService.getOrCreateAsLearner(id);
      navigate(`/learner/programs/${id}/chat`);
    } catch (err) {
      toast.error(err.response?.data?.message || t('learnerCourseDetail.chatStartFailed'));
    } finally {
      setIsStartingChat(false);
    }
  };

  const handleEnroll = async () => {
    setIsEnrolling(true);
    try {
      const enr = await mwasalatProgramService.enroll(id);
      const enrolledTitle = getLocalizedProgramField(program, 'title', i18n.language);
      if (enr.status === 'waitlisted') {
        toast(t('learner.courses.waitlistedToast', { title: enrolledTitle }));
      } else if (enr.status === 'pending_approval') {
        toast(t('learner.courses.pendingApprovalToast', { title: enrolledTitle }));
      } else {
        toast.success(t('learner.courses.enrolledToast', { title: enrolledTitle }));
      }
      await refresh();
    } catch (err) {
      toast.error(err.response?.data?.message || t('learner.courses.enrollFailed'));
    } finally {
      setIsEnrolling(false);
    }
  };

  const handlePurchase = async () => {
    setIsEnrolling(true);
    try {
      const { url } = await mwasalatPaymentService.createCheckoutSession(id);
      window.location.href = url;
    } catch (err) {
      toast.error(err.response?.data?.message || t('learner.courses.checkoutFailed'));
      setIsEnrolling(false);
    }
  };

  const theme = program ? themeForCategory(program.category) : null;
  const progress = completion ? stageProgress(completion) : 0;
  const title = getLocalizedProgramField(program, 'title', i18n.language);
  const category = getLocalizedProgramField(program, 'category', i18n.language);
  const description = getLocalizedProgramField(program, 'description', i18n.language);
  const duration = getLocalizedProgramField(program, 'duration', i18n.language);
  const isExternalLearner = user?.role === 'external_learner';
  // Internal learners are free regardless of a course's listed price — only
  // the paying external-learner audience ever sees a real price/checkout.
  const requiresPayment = Boolean(program) && isExternalLearner && program.price > 0;
  const isPendingStatus = ['pending_approval', 'waitlisted', 'rejected', 'locked'].includes(completion?.status);
  const isPrerequisiteLocked = Boolean(program?.prerequisiteProgram) && program?.prerequisiteCompleted === false;
  const prerequisiteTitle = getLocalizedProgramField(program?.prerequisiteProgram, 'title', i18n.language);

  // Legacy (non-modular) courses reach feedback the same way modular ones do —
  // automatically, once every gate (content opened, quiz/assignment passed)
  // clears, never via a separate "Give Feedback" button/page.
  const feedbackDue = Boolean(program) && !program.contentTypes?.includes('modular')
    && !isPendingStatus
    && !completion?.certificateIssued
    && !completion?.feedbackSubmitted
    && completion?.contentOpened
    && (!completion?.hasQuiz || completion?.quizPassed)
    && (!completion?.hasAssignment || completion?.assignmentPassed);

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
              to="/learner/dashboard"
              className="inline-flex items-center gap-1.5 text-sm font-medium text-[#475569] hover:text-mwasalatInk-500 transition-colors mb-4"
            >
              <ArrowLeft className="w-4 h-4 rtl:rotate-180" /> {t('learnerCourseDetail.backToMyLearning')}
            </Link>

            <div className="card overflow-hidden">
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
                  {(program.liveScheduledAt || program.iltScheduledAt) && (
                    <span className="inline-flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5" />
                      {t('learnerCourseDetail.scheduledFor', {
                        date: localizeNumber(new Date(program.liveScheduledAt || program.iltScheduledAt).toLocaleString(locale), i18n.language),
                      })}
                    </span>
                  )}
                  {enrollment && (
                    <span className="inline-flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5" />
                      {completion?.certificateIssued && enrollment.completedAt
                        ? t('learner.dashboard.completedOn', { date: localizeNumber(new Date(enrollment.completedAt).toLocaleDateString(locale), i18n.language) })
                        : t('learner.dashboard.enrolledOn', { date: localizeNumber(new Date(enrollment.purchasedAt).toLocaleDateString(locale), i18n.language) })}
                    </span>
                  )}
                </div>

                {enrollment && (
                  <div className="mb-6">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[11px] font-semibold text-[#94A3B8] uppercase tracking-wide">{t('learnerCourseDetail.progressLabel')}</span>
                      <span className="text-[11px] font-semibold" style={{ color: theme.solid }}>{localizeNumber(progress, i18n.language)}%</span>
                    </div>
                    <MwasalatProgressRoad progress={progress} color={theme.solid} />
                  </div>
                )}

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

                {completion?.status === 'pending_approval' && (
                  <div className="mb-6 p-4 rounded-xl bg-[#FEF3C7]/40 border border-[#FDE68A]/60 flex items-start gap-3">
                    <Hourglass className="w-5 h-5 text-[#B45309] flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-semibold text-[#1E293B]">{t('learnerCourseDetail.pendingApproval.title')}</p>
                      <p className="text-xs text-[#475569] mt-1">{t('learnerCourseDetail.pendingApproval.body')}</p>
                    </div>
                  </div>
                )}
                {completion?.status === 'waitlisted' && (
                  <div className="mb-6 p-4 rounded-xl bg-mwasalatInk-100 border border-mwasalatInk-300/40 flex items-start gap-3">
                    <Users className="w-5 h-5 text-mwasalatInk-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-semibold text-[#1E293B]">
                        {completion?.waitlistPosition
                          ? t('learnerCourseDetail.waitlisted.titleWithPosition', { position: localizeNumber(completion.waitlistPosition, i18n.language) })
                          : t('learnerCourseDetail.waitlisted.title')}
                      </p>
                      <p className="text-xs text-[#475569] mt-1">{t('learnerCourseDetail.waitlisted.body')}</p>
                    </div>
                  </div>
                )}
                {completion?.status === 'rejected' && (
                  <div className="mb-6 p-4 rounded-xl bg-mwasalatRed-100 border border-mwasalatRed-300/40 flex items-start gap-3">
                    <XCircle className="w-5 h-5 text-mwasalatRed-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-semibold text-[#1E293B]">{t('learnerCourseDetail.rejected.title')}</p>
                      <p className="text-xs text-[#475569] mt-1">
                        {completion?.rejectionReason || t('learnerCourseDetail.rejected.body')}
                      </p>
                    </div>
                  </div>
                )}
                {completion?.status === 'locked' && (
                  <div className="mb-6 p-4 rounded-xl bg-mwasalatRed-100 border border-mwasalatRed-300/40 flex items-start gap-3">
                    <Lock className="w-5 h-5 text-mwasalatRed-600 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-[#1E293B]">{t('learnerCourseDetail.locked.title')}</p>
                      <p className="text-xs text-[#475569] mt-1">{t('learnerCourseDetail.locked.body')}</p>
                      <button
                        type="button"
                        onClick={handleReactivate}
                        disabled={isReactivating}
                        className="mt-3 inline-flex items-center gap-1.5 bg-mwasalatRed-600 hover:bg-mwasalatRed-700 disabled:opacity-60 text-white font-semibold px-4 py-2 rounded-xl text-sm transition-colors"
                      >
                        {isReactivating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
                        {isReactivating ? t('learnerCourseDetail.locked.reactivating') : t('learnerCourseDetail.locked.reactivateCta')}
                      </button>
                    </div>
                  </div>
                )}

                {!enrollment && !isPendingStatus && (
                  <div className="mb-6 p-5 rounded-xl border border-[#F1F5F9] bg-[#F8F9FB]">
                    {program.contentTypes?.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mb-4">
                        {program.contentTypes.map((type) => (
                          <span key={type} className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-white text-[#475569] capitalize border border-[#E2E8F0]">
                            {t(`addCourse.contentTypes.${type}.label`)}
                          </span>
                        ))}
                      </div>
                    )}
                    <div className="mb-4">
                      <span dir="ltr" className={`text-lg font-display font-bold ${requiresPayment ? 'text-mwasalatRed-600' : 'text-[#22C55E]'}`}>
                        {requiresPayment ? `OMR ${localizeNumber(program.price, i18n.language)}` : t('learner.courses.freeLabel')}
                      </span>
                    </div>
                    {isPrerequisiteLocked && (
                      <p className="flex items-center gap-1.5 text-xs font-medium text-mwasalatRed-600 mb-3">
                        <Lock className="w-3.5 h-3.5 flex-shrink-0" />
                        {t('learner.courses.prerequisiteRequired', { title: prerequisiteTitle })}
                      </p>
                    )}
                    <button
                      type="button"
                      onClick={requiresPayment ? handlePurchase : handleEnroll}
                      disabled={isEnrolling || isPrerequisiteLocked}
                      className="w-full flex items-center justify-center gap-2 bg-mwasalatRed-600 hover:bg-mwasalatRed-700 disabled:opacity-60 text-white font-semibold px-4 py-2.5 rounded-xl text-sm transition-colors"
                    >
                      {isEnrolling ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : isPrerequisiteLocked ? (
                        <><Lock className="w-4 h-4" /> {t('learner.courses.prerequisiteLocked')}</>
                      ) : requiresPayment ? (
                        <><CreditCard className="w-4 h-4" /> {t('learner.courses.purchase')}</>
                      ) : (
                        t('learner.courses.enrollNow')
                      )}
                    </button>
                  </div>
                )}

                {enrollment && !isPendingStatus && program?.contentTypes?.includes('modular') && (
                  <div className="space-y-3 mb-5">
                    {completion?.modular && !completion?.certificateIssued && (
                      <div className="flex items-center gap-2 text-xs font-medium text-[#475569]">
                        <Layers className="w-3.5 h-3.5 text-mwasalatInk-500 flex-shrink-0" />
                        {localizeNumber(t('learnerCourseDetail.modulesSummary', {
                          completed: completion.modular.completedModules, total: completion.modular.totalModules,
                        }), i18n.language)}
                      </div>
                    )}
                    {completion?.certificateIssued ? (
                      <Link
                        to={`/learner/programs/${id}/certificate`}
                        className="w-full flex items-center justify-center gap-1.5 bg-mwasalatInk-100 hover:bg-mwasalatInk-200 text-mwasalatInk-500 font-semibold px-4 py-2.5 rounded-xl text-sm transition-colors"
                      >
                        <Award className="w-4 h-4" /> {t('learnerCourseDetail.viewCertificate')}
                      </Link>
                    ) : (
                      <Link
                        to={`/learner/programs/${id}/learn`}
                        className="w-full flex items-center justify-center gap-1.5 bg-mwasalatRed-500 hover:bg-mwasalatRed-600 text-white font-semibold px-4 py-2.5 rounded-xl text-sm transition-colors"
                      >
                        <PlayCircle className="w-4 h-4" />
                        {completion?.modular?.progressFraction > 0 ? t('learnerCourseDetail.continueLearning') : t('learnerCourseDetail.startCourse')}
                      </Link>
                    )}
                  </div>
                )}

                {enrollment && !isPendingStatus && !program?.contentTypes?.includes('modular') && (
                  feedbackDue ? (
                    <div className="mb-5">
                      <MwasalatCourseReviewInline programId={id} onSubmitted={refresh} embedded />
                    </div>
                  ) : (
                    <>
                      <MwasalatContentAccess
                        program={program}
                        openedContentTypes={enrollment?.openedContentTypes ?? []}
                        pdfProgress={completion?.pdfProgress ?? null}
                        onContentOpened={refresh}
                      />

                      <div className="space-y-1.5 mb-5">
                        {completion?.certificateIssued ? (
                          <Link
                            to={`/learner/programs/${id}/certificate`}
                            className="w-full flex items-center justify-center gap-1.5 bg-mwasalatInk-100 hover:bg-mwasalatInk-200 text-mwasalatInk-500 font-semibold px-4 py-2.5 rounded-xl text-sm transition-colors"
                          >
                            <Award className="w-4 h-4" /> {t('learnerCourseDetail.viewCertificate')}
                          </Link>
                        ) : (
                          <>
                            {completion?.hasQuiz && !completion?.quizPassed && completion?.contentOpened && completion?.sessionCompleted && (
                              <Link
                                to={`/learner/programs/${id}/quiz`}
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
                            {completion?.hasQuiz && !completion?.quizPassed && completion?.contentOpened && !completion?.sessionCompleted && (
                              <p className="flex items-center gap-1.5 text-xs font-medium text-[#94A3B8] px-1">
                                <Lock className="w-3.5 h-3.5" /> {t('learnerCourseDetail.awaitingClassCompletionNote')}
                              </p>
                            )}
                            {completion?.hasQuiz && completion?.quizPassed && (
                              <p className="flex items-center gap-1.5 text-xs font-medium text-[#22C55E] px-1">
                                <CheckCircle2 className="w-3.5 h-3.5" /> {t('learnerCourseDetail.assessmentPassed')}
                              </p>
                            )}
                            {(!completion?.hasQuiz || completion?.quizPassed) && completion?.hasAssignment && !completion?.assignmentPassed && completion?.contentOpened && (
                              <Link
                                to={`/learner/programs/${id}/assignment`}
                                className="w-full flex items-center justify-center gap-1.5 bg-mwasalatInk-500 hover:bg-mwasalatInk-400 text-white font-semibold px-4 py-2.5 rounded-xl text-sm transition-colors"
                              >
                                <ClipboardCheck className="w-4 h-4" /> {t('learnerCourseDetail.submitAssignment')}
                              </Link>
                            )}
                            {completion?.hasAssignment && !completion?.assignmentPassed && !completion?.contentOpened && (
                              <p className="flex items-center gap-1.5 text-xs font-medium text-[#94A3B8] px-1">
                                <Lock className="w-3.5 h-3.5" /> {t('learnerCourseDetail.lockedNote')}
                              </p>
                            )}
                            {completion?.hasAssignment && completion?.assignmentPassed && (
                              <p className="flex items-center gap-1.5 text-xs font-medium text-[#22C55E] px-1">
                                <CheckCircle2 className="w-3.5 h-3.5" /> {t('learnerCourseDetail.assignmentPassed')}
                              </p>
                            )}
                          </>
                        )}
                      </div>
                    </>
                  )
                )}

                {enrollment && (
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
                      to={`/learner/programs/${id}/discussion`}
                      className="flex items-center justify-center gap-2 border border-mwasalatInk-300 hover:bg-mwasalatInk-100 text-mwasalatInk-500 font-semibold px-4 py-2.5 rounded-xl text-sm transition-colors"
                    >
                      <MessagesSquare className="w-4 h-4" /> {t('learnerCourseDetail.courseDiscussion')}
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </MwasalatLearnerLayout>
  );
}
