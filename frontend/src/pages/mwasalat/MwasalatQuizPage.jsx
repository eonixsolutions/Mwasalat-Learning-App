import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { Loader2, CheckCircle2, XCircle, PartyPopper, Sparkles, ArrowLeft, Lock } from 'lucide-react';
import { mwasalatQuizService } from '../../services/mwasalatQuiz.service.js';
import { mwasalatAuthService } from '../../services/mwasalatAuth.service.js';
import { mwasalatProgramService } from '../../services/mwasalatProgram.service.js';
import { localizeNumber } from '../../utils/mwasalatLocalize.js';

export default function MwasalatQuizPage() {
  const { t, i18n } = useTranslation('mwasalatApp');
  const locale = i18n.language === 'ar' ? 'ar-OM' : 'en-GB';
  const { id } = useParams();
  const navigate = useNavigate();
  const [quiz, setQuiz] = useState(null);
  const [contentOpened, setContentOpened] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState(null);

  useEffect(() => {
    Promise.all([
      mwasalatQuizService.getQuizForLearner(id),
      mwasalatProgramService.getCompletionStatus(id),
    ])
      .then(([q, c]) => {
        setQuiz(q);
        setContentOpened(Boolean(c?.contentOpened));
        if (q) setAnswers(new Array(q.questions.length).fill(null));
      })
      .finally(() => setIsLoading(false));
  }, [id]);

  const selectAnswer = (optionIndex) => {
    setAnswers((prev) => prev.map((a, i) => (i === currentIndex ? optionIndex : a)));
  };

  const isLast = quiz && currentIndex === quiz.questions.length - 1;

  const handleNext = async () => {
    if (!isLast) {
      setCurrentIndex((i) => i + 1);
      return;
    }
    setIsSubmitting(true);
    try {
      const res = await mwasalatQuizService.submitAttempt(id, answers);
      setResult(res);
      if (res.pointsAwarded > 0) {
        // The points total lives on the persisted user object, not in this
        // response — pull the fresh count so the header badge/stat tile update.
        mwasalatAuthService.refreshMe().catch(() => {});
      }
    } catch (err) {
      toast.error(err.response?.data?.message || t('learnerQuiz.submitFailed'));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F8F9FB] flex items-center justify-center text-[#94A3B8]">
        <Loader2 className="w-5 h-5 animate-spin me-2" /> {t('learnerQuiz.loading')}
      </div>
    );
  }

  if (quiz && !contentOpened) {
    return (
      <div className="min-h-screen bg-[#F8F9FB] flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl p-8 max-w-sm w-full text-center">
          <div className="w-12 h-12 rounded-full bg-[#F1F5F9] flex items-center justify-center mx-auto mb-4">
            <Lock className="w-5 h-5 text-[#94A3B8]" />
          </div>
          <p className="text-sm font-semibold text-[#1E293B] mb-1.5">{t('learnerQuiz.lockedTitle')}</p>
          <p className="text-sm text-[#475569] mb-4">{t('learnerQuiz.lockedBody')}</p>
          <Link to="/mwasalat/learner/dashboard" className="text-sm font-medium text-mwasalatInk-500 hover:underline">{t('learnerQuiz.backToDashboardLink')}</Link>
        </div>
      </div>
    );
  }

  if (!quiz) {
    return (
      <div className="min-h-screen bg-[#F8F9FB] flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl p-8 max-w-sm w-full text-center">
          <p className="text-sm text-[#475569] mb-4">{t('learnerQuiz.noQuizYet')}</p>
          <Link to="/mwasalat/learner/dashboard" className="text-sm font-medium text-mwasalatInk-500 hover:underline">{t('learnerQuiz.backToDashboardLink')}</Link>
        </div>
      </div>
    );
  }

  if (result) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-mwasalatInk-100 via-white to-mwasalatRed-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl p-8 max-w-lg w-full" style={{ boxShadow: '0 4px 32px rgba(0,0,0,0.09)' }}>
          <div className="text-center mb-6">
            {result.passed ? (
              <>
                <div className="relative inline-block mb-3">
                  <PartyPopper className="w-14 h-14 text-mwasalatInk-500 mx-auto animate-bounce" />
                </div>
                <h2 className="text-2xl font-bold text-[#1E293B] mb-1">{t('learnerQuiz.passedTitle')}</h2>
                {result.pointsAwarded > 0 && (
                  <p className="inline-flex items-center gap-1.5 text-sm font-semibold text-mwasalatRed-600 bg-mwasalatRed-100 px-3 py-1 rounded-full mt-2">
                    <Sparkles className="w-3.5 h-3.5" /> {localizeNumber(t('learnerQuiz.pointsEarned', { points: result.pointsAwarded }), i18n.language)}
                  </p>
                )}
              </>
            ) : (
              <>
                <XCircle className="w-14 h-14 text-mwasalatRed-500 mx-auto mb-3" />
                <h2 className="text-2xl font-bold text-[#1E293B] mb-1">{t('learnerQuiz.notPassedTitle')}</h2>
                <p className="text-sm text-[#475569]">{localizeNumber(t('learnerQuiz.notPassedBody', { percent: quiz.passPercentage }), i18n.language)}</p>
              </>
            )}
            <p className="text-4xl font-bold text-[#1E293B] mt-4">{localizeNumber(result.score, i18n.language)}%</p>
            <p className="text-xs text-[#94A3B8] mt-1.5">
              {localizeNumber(t('learnerQuiz.attemptLabel', { number: result.attemptNumber }), i18n.language)} · {localizeNumber(new Date(result.attemptedAt).toLocaleDateString(locale, { day: 'numeric', month: 'long', year: 'numeric' }), i18n.language)}
            </p>
          </div>

          <div className="space-y-3 mb-6 max-h-72 overflow-y-auto">
            {result.review.map((r, i) => (
              <div key={i} className={`p-3 rounded-xl border ${r.isCorrect ? 'border-mwasalatInk-200 bg-mwasalatInk-100/40' : 'border-mwasalatRed-300 bg-mwasalatRed-100/40'}`}>
                <div className="flex items-start gap-2">
                  {r.isCorrect ? <CheckCircle2 className="w-4 h-4 text-mwasalatInk-500 mt-0.5 flex-shrink-0" /> : <XCircle className="w-4 h-4 text-mwasalatRed-500 mt-0.5 flex-shrink-0" />}
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-[#1E293B]">{r.text}</p>
                    <p className="text-xs text-[#475569] mt-1">{t('learnerQuiz.correctAnswerLabel', { answer: r.options[r.correctIndex] })}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {result.passed && (
            <p className="text-center text-xs text-[#475569] bg-[#F8F9FB] rounded-xl px-4 py-2.5 mb-4">
              {t('learnerQuiz.oneLastStepNote')}
            </p>
          )}

          <div className="flex gap-3">
            {!result.passed && (
              <button
                onClick={() => { setResult(null); setCurrentIndex(0); setAnswers(new Array(quiz.questions.length).fill(null)); }}
                className="flex-1 px-4 py-2.5 rounded-xl border border-[#E2E8F0] text-sm font-medium text-[#475569] hover:bg-[#F1F5F9] transition-colors"
              >
                {t('learnerQuiz.tryAgain')}
              </button>
            )}
            <Link
              to={result.passed ? `/mwasalat/learner/programs/${id}/feedback` : '/mwasalat/learner/dashboard'}
              onClick={() => {
                if (result.passed && result.pointsAwarded > 0) {
                  // Picked up by the dashboard on mount to fly a car icon from
                  // this course's card to the points badge in the header.
                  sessionStorage.setItem('mwasalat-fly-reward', JSON.stringify({ programId: id, points: result.pointsAwarded }));
                }
              }}
              className="flex-1 text-center px-4 py-2.5 rounded-xl bg-mwasalatInk-500 hover:bg-mwasalatInk-400 text-white text-sm font-semibold transition-colors"
            >
              {result.passed ? t('learnerQuiz.continueToFeedbackBtn') : t('learnerQuiz.backToDashboardBtn')}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const question = quiz.questions[currentIndex];
  const progress = ((currentIndex + 1) / quiz.questions.length) * 100;

  return (
    <div className="min-h-screen bg-[#F8F9FB] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl p-8 max-w-lg w-full" style={{ boxShadow: '0 4px 32px rgba(0,0,0,0.09)' }}>
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => navigate(-1)} className="w-8 h-8 rounded-lg border border-[#E2E8F0] flex items-center justify-center text-[#475569] hover:bg-[#F1F5F9] transition-colors flex-shrink-0">
            <ArrowLeft className="w-3.5 h-3.5 rtl:rotate-180" />
          </button>
          <div className="flex-1">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-semibold text-[#94A3B8]">{localizeNumber(t('learnerQuiz.questionOf', { current: currentIndex + 1, total: quiz.questions.length }), i18n.language)}</span>
              <span className="text-xs font-semibold text-mwasalatInk-500">{localizeNumber(Math.round(progress), i18n.language)}%</span>
            </div>
            <div className="w-full h-2 bg-[#F1F5F9] rounded-full overflow-hidden">
              <div className="h-full bg-mwasalatInk-500 rounded-full transition-all duration-300" style={{ width: `${progress}%` }} />
            </div>
          </div>
        </div>

        <h2 className="text-lg font-semibold text-[#1E293B] mb-5">{question.text}</h2>

        <div className="space-y-2.5 mb-6">
          {question.options.map((opt, oi) => (
            <button
              key={oi}
              onClick={() => selectAnswer(oi)}
              className={`w-full text-start px-4 py-3 rounded-xl border text-sm font-medium transition-colors ${
                answers[currentIndex] === oi
                  ? 'border-mwasalatInk-500 bg-mwasalatInk-100 text-mwasalatInk-500'
                  : 'border-[#E2E8F0] text-[#1E293B] hover:border-mwasalatInk-300'
              }`}
            >
              {opt}
            </button>
          ))}
        </div>

        <button
          onClick={handleNext}
          disabled={answers[currentIndex] == null || isSubmitting}
          className="w-full flex items-center justify-center gap-2 bg-mwasalatInk-500 hover:bg-mwasalatInk-400 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold px-6 py-3 rounded-xl transition-colors text-sm"
        >
          {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
          {isSubmitting ? t('learnerQuiz.submitting') : isLast ? t('learnerQuiz.submitQuiz') : t('learnerQuiz.nextQuestion')}
        </button>
      </div>
    </div>
  );
}
