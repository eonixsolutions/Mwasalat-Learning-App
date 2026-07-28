import { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import {
  Loader2, Lock, CheckCircle2, ExternalLink, ArrowLeft, Star, Upload,
  FileText, Link2, Video, Presentation, Music, ClipboardCheck, HelpCircle, BookOpen, PartyPopper, XCircle,
} from 'lucide-react';
import MwasalatLearnerLayout from '../../layouts/MwasalatLearnerLayout.jsx';
import { mwasalatProgramService } from '../../services/mwasalatProgram.service.js';
import { mwasalatQuizService } from '../../services/mwasalatQuiz.service.js';
import { mwasalatAssignmentService } from '../../services/mwasalatAssignment.service.js';
import MwasalatLessonMediaPlayer from '../../components/mwasalat/MwasalatLessonMediaPlayer.jsx';
import MwasalatCourseReviewInline from '../../components/mwasalat/MwasalatCourseReviewInline.jsx';
import MwasalatProgressRoad from '../../components/mwasalat/MwasalatProgressRoad.jsx';
import { themeForCategory } from '../../utils/mwasalatCategoryTheme.js';
import { stageProgress } from '../../utils/mwasalatProgress.js';
import { getLocalizedProgramField, localizeNumber } from '../../utils/mwasalatLocalize.js';

const LESSON_TYPE_ICON = {
  intro: BookOpen, video: Video, pdf: FileText, ppt: Presentation, audio: Music, link: Link2, assignment: ClipboardCheck, quiz: HelpCircle,
};

const cardShadow = { boxShadow: '0 4px 32px rgba(0,0,0,0.06)' };

// Quiz/assignment lessons gate on the module's own content lessons (video,
// pdf, ppt, audio, link, intro) being opened first — mirrors the backend's
// isModuleContentOpened check in mwasalatQuiz.service.js / mwasalatAssignment.service.js,
// so the assessment button never appears before the content it's testing.
const isModuleContentComplete = (mod) =>
  mod.lessons.filter((l) => l.type !== 'quiz' && l.type !== 'assignment').every((l) => l.opened);

function LockedLessonPane({ title, body }) {
  return (
    <div className="bg-white rounded-2xl p-8 text-center" style={cardShadow}>
      <div className="w-12 h-12 rounded-full bg-[#F1F5F9] flex items-center justify-center mx-auto mb-4">
        <Lock className="w-5 h-5 text-[#94A3B8]" />
      </div>
      <p className="text-sm font-semibold text-[#1E293B] mb-1.5">{title}</p>
      <p className="text-sm text-[#475569]">{body}</p>
    </div>
  );
}

function IntroLessonPane({ lesson, onOpened }) {
  const { t, i18n } = useTranslation('mwasalatApp');
  const text = (i18n.language.startsWith('ar') && lesson.contentAr?.trim()) || lesson.content;
  return (
    <div className="bg-white rounded-2xl p-6 sm:p-8" style={cardShadow}>
      <h3 className="text-lg font-bold text-[#1E293B] mb-4">{getLocalizedProgramField(lesson, 'title', i18n.language)}</h3>
      <p className="text-sm text-[#475569] whitespace-pre-wrap leading-relaxed mb-6">{text}</p>
      {!lesson.opened ? (
        <button onClick={onOpened} className="inline-flex items-center gap-1.5 bg-mwasalatInk-500 hover:bg-mwasalatInk-400 text-white font-semibold px-5 py-2.5 rounded-xl text-sm transition-colors">
          {t('coursePlayer.continueBtn')}
        </button>
      ) : (
        <p className="flex items-center gap-1.5 text-xs font-medium text-[#22C55E]"><CheckCircle2 className="w-3.5 h-3.5" /> {t('coursePlayer.markedDone')}</p>
      )}
    </div>
  );
}

function FileLessonPane({ lesson, onOpened }) {
  const { t, i18n } = useTranslation('mwasalatApp');
  return (
    <div className="bg-white rounded-2xl p-6 sm:p-8" style={cardShadow}>
      <h3 className="text-lg font-bold text-[#1E293B] mb-4">{getLocalizedProgramField(lesson, 'title', i18n.language)}</h3>
      <a href={lesson.fileUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-4 rounded-xl border border-[#E2E8F0] hover:border-mwasalatInk-300 transition-colors mb-6">
        <div className="w-10 h-10 rounded-lg bg-mwasalatInk-100 flex items-center justify-center flex-shrink-0">
          <FileText className="w-4.5 h-4.5 text-mwasalatInk-500" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-[#1E293B] truncate">{lesson.fileName || t('coursePlayer.viewFile')}</p>
          <p className="text-xs text-[#94A3B8]">{t('coursePlayer.opensNewTab')}</p>
        </div>
        <ExternalLink className="w-4 h-4 text-[#94A3B8] flex-shrink-0" />
      </a>
      {!lesson.opened ? (
        <button onClick={onOpened} className="inline-flex items-center gap-1.5 bg-mwasalatInk-500 hover:bg-mwasalatInk-400 text-white font-semibold px-5 py-2.5 rounded-xl text-sm transition-colors">
          <CheckCircle2 className="w-4 h-4" /> {t('coursePlayer.markAsDoneBtn')}
        </button>
      ) : (
        <p className="flex items-center gap-1.5 text-xs font-medium text-[#22C55E]"><CheckCircle2 className="w-3.5 h-3.5" /> {t('coursePlayer.markedDone')}</p>
      )}
    </div>
  );
}

function LinkLessonPane({ lesson, onOpened }) {
  const { t, i18n } = useTranslation('mwasalatApp');
  const handleClick = () => {
    window.open(lesson.externalUrl, '_blank', 'noopener,noreferrer');
    if (!lesson.opened) onOpened();
  };
  return (
    <div className="bg-white rounded-2xl p-6 sm:p-8" style={cardShadow}>
      <h3 className="text-lg font-bold text-[#1E293B] mb-4">{getLocalizedProgramField(lesson, 'title', i18n.language)}</h3>
      <button type="button" onClick={handleClick} className="flex items-center gap-3 p-4 rounded-xl border border-[#E2E8F0] hover:border-mwasalatInk-300 transition-colors w-full text-start">
        <div className="w-10 h-10 rounded-lg bg-mwasalatInk-100 flex items-center justify-center flex-shrink-0">
          <Link2 className="w-4.5 h-4.5 text-mwasalatInk-500" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-[#1E293B] truncate" dir="ltr">{lesson.externalUrl}</p>
          <p className="text-xs text-[#94A3B8]">{t('coursePlayer.opensNewTab')}</p>
        </div>
        <ExternalLink className="w-4 h-4 text-[#94A3B8] flex-shrink-0" />
      </button>
      {lesson.opened && <p className="flex items-center gap-1.5 text-xs font-medium text-[#22C55E] mt-4"><CheckCircle2 className="w-3.5 h-3.5" /> {t('coursePlayer.markedDone')}</p>}
    </div>
  );
}

function QuizLessonPane({ programId, moduleId, onPassed }) {
  const { t, i18n } = useTranslation('mwasalatApp');
  const [quiz, setQuiz] = useState(null);
  const [answers, setAnswers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState(null);

  useEffect(() => {
    setIsLoading(true);
    setResult(null);
    mwasalatQuizService.getQuizForLearner(programId, moduleId)
      .then((q) => { setQuiz(q); setAnswers(new Array(q?.questions?.length ?? 0).fill(null)); })
      .finally(() => setIsLoading(false));
  }, [programId, moduleId]);

  const handleSubmit = async () => {
    if (answers.some((a) => a == null)) { toast.error(t('learnerQuiz.answerAllRequired')); return; }
    setIsSubmitting(true);
    try {
      const res = await mwasalatQuizService.submitAttempt(programId, answers, moduleId);
      setResult(res);
      if (res.passed) onPassed?.();
    } catch (err) {
      toast.error(err.response?.data?.message || t('learnerQuiz.submitFailed'));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) return <div className="bg-white rounded-2xl p-10 flex items-center justify-center text-[#94A3B8]" style={cardShadow}><Loader2 className="w-5 h-5 animate-spin me-2" />{t('learnerQuiz.loading')}</div>;
  if (!quiz) return <div className="bg-white rounded-2xl p-10 text-center text-sm text-[#475569]" style={cardShadow}>{t('learnerQuiz.noQuizYet')}</div>;

  if (result) {
    return (
      <div className="bg-white rounded-2xl p-6 sm:p-8 text-center" style={cardShadow}>
        {result.passed ? <PartyPopper className="w-12 h-12 text-mwasalatInk-500 mx-auto mb-3" /> : <XCircle className="w-12 h-12 text-mwasalatRed-500 mx-auto mb-3" />}
        <h3 className="text-xl font-bold text-[#1E293B] mb-1">{result.passed ? t('learnerQuiz.passedTitle') : t('learnerQuiz.notPassedTitle')}</h3>
        <p className="text-4xl font-bold text-[#1E293B] mt-2">{localizeNumber(result.score, i18n.language)}%</p>
        {!result.passed && (
          <button
            type="button"
            onClick={() => { setResult(null); setAnswers(new Array(quiz.questions.length).fill(null)); }}
            className="mt-5 px-5 py-2.5 rounded-xl border border-[#E2E8F0] text-sm font-medium text-[#475569] hover:bg-[#F1F5F9] transition-colors"
          >
            {t('learnerQuiz.tryAgain')}
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl p-6 sm:p-8 space-y-6" style={cardShadow}>
      <div>
        <h3 className="text-lg font-bold text-[#1E293B]">{t('learnerQuiz.assessmentHeading')}</h3>
        <p className="text-xs text-[#94A3B8] mt-1">{localizeNumber(t('learnerQuiz.passScoreNote', { percent: quiz.passPercentage }), i18n.language)}</p>
      </div>
      {quiz.questions.map((q, qi) => (
        <div key={qi}>
          <p className="text-sm font-semibold text-[#1E293B] mb-2.5">{localizeNumber(qi + 1, i18n.language)}. {q.text}</p>
          <div className="space-y-2">
            {q.options.map((opt, oi) => (
              <button
                key={oi}
                type="button"
                onClick={() => setAnswers((prev) => prev.map((a, i) => (i === qi ? oi : a)))}
                className={`w-full text-start px-4 py-2.5 rounded-xl border text-sm font-medium transition-colors ${
                  answers[qi] === oi ? 'border-mwasalatInk-500 bg-mwasalatInk-100 text-mwasalatInk-500' : 'border-[#E2E8F0] text-[#1E293B] hover:border-mwasalatInk-300'
                }`}
              >
                {opt}
              </button>
            ))}
          </div>
        </div>
      ))}
      <button
        type="button"
        onClick={handleSubmit}
        disabled={isSubmitting}
        className="w-full flex items-center justify-center gap-2 bg-mwasalatInk-500 hover:bg-mwasalatInk-400 disabled:opacity-40 text-white font-semibold px-6 py-3 rounded-xl transition-colors text-sm"
      >
        {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
        {isSubmitting ? t('learnerQuiz.submitting') : t('learnerQuiz.submitQuiz')}
      </button>
    </div>
  );
}

function AssignmentLessonPane({ programId, moduleId, lessonId, onSubmitted }) {
  const { t, i18n } = useTranslation('mwasalatApp');
  const locale = i18n.language === 'ar' ? 'ar-OM' : 'en-GB';
  const fileInputRef = useRef(null);
  const [assignment, setAssignment] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [file, setFile] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const load = () => {
    Promise.all([
      mwasalatAssignmentService.getForLearner(programId, moduleId, lessonId),
      mwasalatAssignmentService.getMySubmissions(programId, moduleId, lessonId),
    ]).then(([a, subs]) => { setAssignment(a); setSubmissions(subs); }).finally(() => setIsLoading(false));
  };

  useEffect(() => { setIsLoading(true); load(); }, [programId, moduleId, lessonId]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleFilePick = (e) => {
    const picked = e.target.files?.[0];
    e.target.value = '';
    if (picked) setFile(picked);
  };

  const handleSubmit = async () => {
    if (!file) { toast.error(t('learnerAssignment.chooseFileFirst')); return; }
    setIsSubmitting(true);
    try {
      await mwasalatAssignmentService.submitAssignment(programId, file, moduleId, lessonId);
      toast.success(t('learnerAssignment.submittedToast'));
      setFile(null);
      load();
      onSubmitted?.();
    } catch (err) {
      toast.error(err.response?.data?.message || t('learnerAssignment.submitFailed'));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) return <div className="bg-white rounded-2xl p-10 flex items-center justify-center text-[#94A3B8]" style={cardShadow}><Loader2 className="w-5 h-5 animate-spin me-2" />{t('learnerAssignment.loading')}</div>;
  if (!assignment) return <div className="bg-white rounded-2xl p-10 text-center text-sm text-[#475569]" style={cardShadow}>{t('learnerAssignment.noAssignmentYet')}</div>;

  const latest = submissions[0];
  const instructions = (i18n.language.startsWith('ar') && assignment.instructionsAr?.trim()) || assignment.instructions;

  return (
    <div className="bg-white rounded-2xl p-6 sm:p-8" style={cardShadow}>
      <h3 className="text-lg font-bold text-[#1E293B] mb-3">{assignment.title}</h3>
      <p className="text-sm text-[#475569] whitespace-pre-wrap mb-6">{instructions}</p>

      {latest && (
        <div className={`p-4 rounded-xl border mb-6 ${latest.status === 'graded' ? (latest.passed ? 'border-mwasalatInk-200 bg-mwasalatInk-100/40' : 'border-mwasalatRed-300 bg-mwasalatRed-100/40') : 'border-[#E2E8F0] bg-[#F8F9FB]'}`}>
          <p className="text-sm font-semibold text-[#1E293B]">
            {latest.status !== 'graded' ? t('learnerAssignment.pendingReview') : latest.passed ? t('learnerAssignment.gradedPassed') : t('learnerAssignment.gradedFailed')}
          </p>
          <p className="text-xs text-[#94A3B8] mt-0.5">
            {localizeNumber(t('learnerAssignment.submittedOn', { date: new Date(latest.submittedAt).toLocaleDateString(locale, { day: 'numeric', month: 'long', year: 'numeric' }) }), i18n.language)}
          </p>
          {latest.status === 'graded' && latest.feedback && (
            <p className="text-xs text-[#475569] mt-1.5 whitespace-pre-wrap">{latest.feedback}</p>
          )}
        </div>
      )}

      <div className="mb-6">
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="w-full flex flex-col items-center justify-center gap-2 border-2 border-dashed border-[#E2E8F0] hover:border-mwasalatInk-300 rounded-xl px-4 py-8 text-center transition-colors"
        >
          <Upload className="w-5 h-5 text-[#94A3B8]" />
          {file ? (
            <span className="text-sm font-medium text-[#1E293B] flex items-center gap-1.5"><FileText className="w-3.5 h-3.5" /> {file.name}</span>
          ) : (
            <span className="text-sm text-[#475569]">{t('learnerAssignment.chooseFileCta')}</span>
          )}
          <span className="text-xs text-[#94A3B8]">{t('learnerAssignment.fileTypesHint')}</span>
        </button>
        <input ref={fileInputRef} type="file" accept=".pdf,.doc,.docx,.zip" onChange={handleFilePick} className="hidden" />
      </div>

      <button
        type="button"
        onClick={handleSubmit}
        disabled={!file || isSubmitting}
        className="w-full flex items-center justify-center gap-2 bg-mwasalatInk-500 hover:bg-mwasalatInk-400 disabled:opacity-40 text-white font-semibold px-6 py-3 rounded-xl transition-colors text-sm"
      >
        {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
        {isSubmitting ? t('learnerAssignment.submitting') : latest ? t('learnerAssignment.resubmitBtn') : t('learnerAssignment.submitBtn')}
      </button>
    </div>
  );
}

export default function MwasalatCoursePlayerPage() {
  const { t, i18n } = useTranslation('mwasalatApp');
  const { id } = useParams();
  const [program, setProgram] = useState(null);
  const [course, setCourse] = useState(null);
  const [completion, setCompletion] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeModuleId, setActiveModuleId] = useState(null);
  const [activeLessonId, setActiveLessonId] = useState(null);
  const [showingReview, setShowingReview] = useState(false);

  const refresh = async () => {
    const [p, c, comp] = await Promise.all([
      mwasalatProgramService.getById(id),
      mwasalatProgramService.getCourseForLearner(id),
      mwasalatProgramService.getCompletionStatus(id),
    ]);
    setProgram(p);
    setCourse(c);
    setCompletion(comp);
  };

  useEffect(() => {
    refresh().finally(() => setIsLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // Once every module is complete, the review pane takes over automatically —
  // there is no separate "Give Feedback" button/route for a modular course.
  // Otherwise, on first load, land on the first lesson of the first
  // unlocked-but-not-yet-complete module.
  useEffect(() => {
    if (!course) return;
    const allComplete = course.modules.length > 0 && course.modules.every((m) => m.completed);
    if (allComplete && completion && !completion.feedbackSubmitted) {
      setShowingReview(true);
      setActiveModuleId(null);
      setActiveLessonId(null);
      return;
    }
    if (activeModuleId) return;
    const target = course.modules.find((m) => m.unlocked && !m.completed) ?? course.modules.find((m) => m.unlocked);
    if (target) {
      setActiveModuleId(target._id);
      const firstUnopened = target.lessons.find((l) => !l.opened);
      setActiveLessonId((firstUnopened ?? target.lessons[0])?._id ?? null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [course, completion]);

  const handleSelectLesson = (moduleId, lessonId) => {
    setShowingReview(false);
    setActiveModuleId(moduleId);
    setActiveLessonId(lessonId);
  };

  const markOpened = async (lessonId) => {
    try {
      await mwasalatProgramService.markLessonOpened(id, activeModuleId, lessonId);
      await refresh();
    } catch (err) {
      toast.error(err.response?.data?.message || t('coursePlayer.markOpenedFailed'));
    }
  };

  const theme = program ? themeForCategory(program.category) : null;
  const progress = completion ? stageProgress(completion) : 0;
  const title = getLocalizedProgramField(program, 'title', i18n.language);
  const category = getLocalizedProgramField(program, 'category', i18n.language);

  const activeModule = course?.modules.find((m) => m._id === activeModuleId);
  const activeLesson = activeModule?.lessons.find((l) => l._id === activeLessonId);
  const allComplete = course?.modules.length > 0 && course.modules.every((m) => m.completed);

  const renderActiveLesson = () => {
    if (!activeLesson) return null;
    if ((activeLesson.type === 'quiz' || activeLesson.type === 'assignment') && activeModule && !isModuleContentComplete(activeModule)) {
      return activeLesson.type === 'quiz'
        ? <LockedLessonPane title={t('learnerQuiz.lockedTitle')} body={t('learnerQuiz.lockedBody')} />
        : <LockedLessonPane title={t('learnerAssignment.lockedTitle')} body={t('learnerAssignment.lockedBody')} />;
    }
    switch (activeLesson.type) {
      case 'intro': return <IntroLessonPane lesson={activeLesson} onOpened={() => markOpened(activeLesson._id)} />;
      case 'pdf':
      case 'ppt': return <FileLessonPane lesson={activeLesson} onOpened={() => markOpened(activeLesson._id)} />;
      case 'link': return <LinkLessonPane lesson={activeLesson} onOpened={() => markOpened(activeLesson._id)} />;
      case 'video': return <MwasalatLessonMediaPlayer programId={id} moduleId={activeModuleId} lessonId={activeLesson._id} mediaType="video" onOpened={refresh} />;
      case 'audio': return <MwasalatLessonMediaPlayer programId={id} moduleId={activeModuleId} lessonId={activeLesson._id} mediaType="audio" onOpened={refresh} />;
      case 'assignment': return <AssignmentLessonPane programId={id} moduleId={activeModuleId} lessonId={activeLesson._id} onSubmitted={refresh} />;
      case 'quiz': return <QuizLessonPane programId={id} moduleId={activeModuleId} onPassed={refresh} />;
      default: return null;
    }
  };

  return (
    <MwasalatLearnerLayout title={title || t('coursePlayer.titleFallback')} subtitle={category}>
      {isLoading ? (
        <div className="p-10 flex items-center justify-center text-[#94A3B8]">
          <Loader2 className="w-5 h-5 animate-spin me-2" /> {t('coursePlayer.loading')}
        </div>
      ) : !program || !course ? (
        <div className="card p-10 text-center text-sm text-[#475569]">{t('coursePlayer.notFound')}</div>
      ) : (
        <div className="max-w-5xl mx-auto">
          <Link
            to={`/learner/programs/${id}`}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-[#475569] hover:text-mwasalatInk-500 transition-colors mb-4"
          >
            <ArrowLeft className="w-4 h-4 rtl:rotate-180" /> {t('coursePlayer.backToOverview')}
          </Link>

          <div className="mb-5">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[11px] font-semibold text-[#94A3B8] uppercase tracking-wide">{t('coursePlayer.progressLabel')}</span>
              <span className="text-[11px] font-semibold" style={{ color: theme.solid }}>{localizeNumber(progress, i18n.language)}%</span>
            </div>
            <MwasalatProgressRoad progress={progress} color={theme.solid} />
          </div>

          <div className="flex flex-col lg:flex-row gap-5 items-start">
            <aside className="w-full lg:w-72 flex-shrink-0 space-y-2">
              {course.modules.map((mod, mi) => (
                <div key={mod._id} className={`rounded-2xl border bg-white overflow-hidden ${!showingReview && activeModuleId === mod._id ? 'border-mwasalatRed-300' : 'border-[#E2E8F0]'}`}>
                  <div className="flex items-center gap-2.5 px-4 py-3">
                    <span className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold ${
                      mod.completed ? 'bg-[#DCFCE7] text-[#22C55E]' : mod.unlocked ? 'bg-mwasalatInk-500 text-white' : 'bg-[#F1F5F9] text-[#94A3B8]'
                    }`}>
                      {mod.completed ? <CheckCircle2 className="w-4 h-4" /> : mod.unlocked ? localizeNumber(mi + 1, i18n.language) : <Lock className="w-3.5 h-3.5" />}
                    </span>
                    <p className={`text-sm font-semibold truncate flex-1 ${mod.unlocked ? 'text-[#1E293B]' : 'text-[#94A3B8]'}`}>
                      {getLocalizedProgramField(mod, 'title', i18n.language)}
                    </p>
                  </div>
                  {mod.unlocked && (
                    <div className="px-2 pb-2 space-y-0.5">
                      {mod.lessons.map((lesson) => {
                        const Icon = LESSON_TYPE_ICON[lesson.type] ?? FileText;
                        const active = !showingReview && activeLessonId === lesson._id;
                        const locked = (lesson.type === 'quiz' || lesson.type === 'assignment') && !isModuleContentComplete(mod);
                        if (locked) {
                          return (
                            <div
                              key={lesson._id}
                              title={lesson.type === 'quiz' ? t('learnerQuiz.lockedBody') : t('learnerAssignment.lockedBody')}
                              className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-xs font-medium text-start text-[#94A3B8] cursor-not-allowed"
                            >
                              <Lock className="w-3.5 h-3.5 flex-shrink-0" />
                              <span className="truncate flex-1">{getLocalizedProgramField(lesson, 'title', i18n.language)}</span>
                            </div>
                          );
                        }
                        return (
                          <button
                            key={lesson._id}
                            type="button"
                            onClick={() => handleSelectLesson(mod._id, lesson._id)}
                            className={`w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-xs font-medium text-start transition-colors ${
                              active ? 'bg-mwasalatRed-100 text-mwasalatRed-600' : 'text-[#475569] hover:bg-[#F8F9FB]'
                            }`}
                          >
                            <Icon className="w-3.5 h-3.5 flex-shrink-0" />
                            <span className="truncate flex-1">{getLocalizedProgramField(lesson, 'title', i18n.language)}</span>
                            {lesson.opened && <CheckCircle2 className="w-3.5 h-3.5 text-[#22C55E] flex-shrink-0" />}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              ))}

              {allComplete && (
                <button
                  type="button"
                  onClick={() => setShowingReview(true)}
                  className={`w-full flex items-center gap-2.5 px-4 py-3 rounded-2xl border text-sm font-semibold transition-colors ${
                    showingReview ? 'border-mwasalatRed-300 bg-mwasalatRed-100 text-mwasalatRed-600' : 'border-[#E2E8F0] bg-white text-[#1E293B] hover:border-mwasalatRed-300'
                  }`}
                >
                  <Star className="w-4 h-4" /> {t('coursePlayer.reviewNavLabel')}
                </button>
              )}
            </aside>

            <div className="flex-1 min-w-0 w-full">
              {showingReview ? (
                <MwasalatCourseReviewInline programId={id} onSubmitted={refresh} />
              ) : activeLesson ? (
                renderActiveLesson()
              ) : (
                <div className="bg-white rounded-2xl p-10 text-center text-sm text-[#94A3B8]" style={cardShadow}>
                  {t('coursePlayer.selectLessonPrompt')}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </MwasalatLearnerLayout>
  );
}
