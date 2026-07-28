import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { Save, Loader2, FileText, CheckCircle2, XCircle, Clock, X } from 'lucide-react';
import { mwasalatAssignmentService } from '../../services/mwasalatAssignment.service.js';
import { localizeNumber } from '../../utils/mwasalatLocalize.js';

const inputClass = 'w-full px-3.5 py-2.5 rounded-xl border border-[#E2E8F0] text-sm bg-white text-[#1E293B] placeholder:text-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-mwasalatInk-500/20 transition-colors';

function GradeModal({ submission, onClose, onGraded }) {
  const { t } = useTranslation('mwasalatApp');
  const [score, setScore] = useState(submission.score ?? '');
  const [passed, setPassed] = useState(submission.passed ?? true);
  const [feedback, setFeedback] = useState(submission.feedback ?? '');
  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = async () => {
    setIsSaving(true);
    try {
      const graded = await mwasalatAssignmentService.gradeSubmission(submission._id, {
        score: score === '' ? undefined : Number(score),
        passed,
        feedback,
      });
      toast.success(t('assignmentGrading.toastGraded'));
      onGraded(graded);
    } catch (err) {
      toast.error(err.response?.data?.message || t('assignmentGrading.toastGradeFailed'));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-1">
          <h3 className="text-lg font-semibold text-[#1E293B]">{t('assignmentGrading.modalTitle')}</h3>
          <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center text-[#94A3B8] hover:bg-[#F1F5F9]">
            <X className="w-4 h-4" />
          </button>
        </div>
        <p className="text-sm text-[#475569] mb-4">{submission.learner?.name}</p>
        <a href={submission.fileUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-sm font-medium text-mwasalatInk-500 hover:underline mb-4">
          <FileText className="w-4 h-4" /> {submission.fileName}
        </a>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[#1E293B] mb-1.5">{t('assignmentGrading.scoreLabel')}</label>
            <input type="number" min={0} max={100} dir="ltr" value={score} onChange={(e) => setScore(e.target.value)} className={`${inputClass} text-start`} />
          </div>
          <div>
            <label className="block text-sm font-medium text-[#1E293B] mb-1.5">{t('assignmentGrading.resultLabel')}</label>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setPassed(true)}
                className={`flex-1 py-2 rounded-xl text-sm font-semibold border transition-colors ${passed ? 'bg-[#DCFCE7] border-[#22C55E] text-[#22C55E]' : 'border-[#E2E8F0] text-[#475569]'}`}
              >
                {t('assignmentGrading.passed')}
              </button>
              <button
                type="button"
                onClick={() => setPassed(false)}
                className={`flex-1 py-2 rounded-xl text-sm font-semibold border transition-colors ${!passed ? 'bg-mwasalatRed-100 border-mwasalatRed-500 text-mwasalatRed-600' : 'border-[#E2E8F0] text-[#475569]'}`}
              >
                {t('assignmentGrading.failed')}
              </button>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-[#1E293B] mb-1.5">{t('assignmentGrading.feedbackLabel')}</label>
            <textarea rows={3} value={feedback} onChange={(e) => setFeedback(e.target.value)} placeholder={t('assignmentGrading.feedbackPlaceholder')} className={`${inputClass} resize-y`} />
          </div>
        </div>

        <button
          type="button"
          onClick={handleSubmit}
          disabled={isSaving}
          className="w-full mt-5 flex items-center justify-center gap-2 bg-mwasalatInk-500 hover:bg-mwasalatInk-400 disabled:opacity-60 text-white font-semibold px-6 py-2.5 rounded-xl transition-colors text-sm"
        >
          {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {t('assignmentGrading.saveGradeBtn')}
        </button>
      </div>
    </div>
  );
}

export default function MwasalatAssignmentBuilder({ programId, moduleId, lessonId, onSaved }) {
  const { t, i18n } = useTranslation('mwasalatApp');
  const [title, setTitle] = useState('');
  const [instructions, setInstructions] = useState('');
  const [instructionsAr, setInstructionsAr] = useState('');
  const [maxScore, setMaxScore] = useState(100);
  const [hasAssignment, setHasAssignment] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [submissions, setSubmissions] = useState([]);
  const [gradingSubmission, setGradingSubmission] = useState(null);

  const loadSubmissions = () => {
    mwasalatAssignmentService.listSubmissions(programId, moduleId, lessonId).then(setSubmissions).catch(() => {});
  };

  useEffect(() => {
    mwasalatAssignmentService.getForInstructor(programId, moduleId, lessonId)
      .then((assignment) => {
        if (assignment) {
          setTitle(assignment.title);
          setInstructions(assignment.instructions);
          setInstructionsAr(assignment.instructionsAr ?? '');
          setMaxScore(assignment.maxScore);
          setHasAssignment(true);
          loadSubmissions();
        }
      })
      .finally(() => setIsLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [programId, moduleId, lessonId]);

  const handleSave = async () => {
    if (!title.trim() || !instructions.trim()) {
      toast.error(t('assignmentBuilder.toastFillRequired'));
      return;
    }
    setIsSaving(true);
    try {
      await mwasalatAssignmentService.upsertAssignment(programId, { title, instructions, instructionsAr, maxScore }, moduleId, lessonId);
      toast.success(t('assignmentBuilder.toastSaved'));
      setHasAssignment(true);
      loadSubmissions();
      onSaved?.();
    } catch (err) {
      toast.error(err.response?.data?.message || t('assignmentBuilder.toastSaveFailed'));
    } finally {
      setIsSaving(false);
    }
  };

  const handleGraded = (graded) => {
    setSubmissions((prev) => prev.map((s) => (s._id === graded._id ? { ...s, ...graded } : s)));
    setGradingSubmission(null);
  };

  if (isLoading) {
    return (
      <div className="p-10 flex items-center justify-center text-[#94A3B8]">
        <Loader2 className="w-5 h-5 animate-spin me-2" /> {t('assignmentBuilder.loading')}
      </div>
    );
  }

  const ungradedCount = submissions.filter((s) => s.status !== 'graded').length;

  return (
    <div className="p-5 space-y-5">
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-[#1E293B] mb-1.5">{t('assignmentBuilder.titleLabel')}</label>
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder={t('assignmentBuilder.titlePlaceholder')} className={inputClass} />
        </div>
        <div>
          <label className="block text-sm font-medium text-[#1E293B] mb-1.5">{t('assignmentBuilder.instructionsLabel')}</label>
          <textarea rows={4} value={instructions} onChange={(e) => setInstructions(e.target.value)} placeholder={t('assignmentBuilder.instructionsPlaceholder')} className={`${inputClass} resize-y`} />
        </div>
        <div>
          <label className="block text-sm font-medium text-[#1E293B] mb-1.5">{t('assignmentBuilder.instructionsArLabel')}</label>
          <textarea rows={4} dir="rtl" value={instructionsAr} onChange={(e) => setInstructionsAr(e.target.value)} placeholder={t('assignmentBuilder.instructionsArPlaceholder')} className={`${inputClass} resize-y`} />
        </div>
        <div className="flex items-center gap-3">
          <label className="text-sm font-medium text-[#1E293B]">{t('assignmentBuilder.maxScoreLabel')}</label>
          <input type="number" min={1} dir="ltr" value={maxScore} onChange={(e) => setMaxScore(Number(e.target.value))} className="w-20 px-2.5 py-1.5 rounded-lg border border-[#E2E8F0] text-sm text-center" />
        </div>
      </div>

      <button
        type="button"
        onClick={handleSave}
        disabled={isSaving}
        className="w-full flex items-center justify-center gap-2 bg-mwasalatInk-500 hover:bg-mwasalatInk-400 disabled:opacity-60 text-white font-semibold px-6 py-2.5 rounded-xl transition-colors text-sm"
      >
        {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
        {isSaving ? t('assignmentBuilder.saving') : t('assignmentBuilder.saveAssignmentBtn')}
      </button>

      {hasAssignment && (
        <div className="pt-5 border-t border-[#E2E8F0]">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-[#1E293B]">{t('assignmentGrading.submissionsHeading')}</h3>
            {ungradedCount > 0 && (
              <span className="text-xs font-semibold text-mwasalatRed-600 bg-mwasalatRed-100 px-2.5 py-1 rounded-full">
                {localizeNumber(t('assignmentGrading.ungradedCount', { count: ungradedCount }), i18n.language)}
              </span>
            )}
          </div>

          {submissions.length === 0 ? (
            <p className="text-sm text-[#94A3B8]">{t('assignmentGrading.noSubmissions')}</p>
          ) : (
            <div className="rounded-xl border border-[#E2E8F0] divide-y divide-[#F1F5F9]">
              {submissions.map((s) => (
                <div key={s._id} className="flex items-center gap-3 px-4 py-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${s.status === 'graded' ? (s.passed ? 'bg-[#DCFCE7]' : 'bg-mwasalatRed-100') : 'bg-[#F1F5F9]'}`}>
                    {s.status !== 'graded' ? <Clock className="w-4 h-4 text-[#94A3B8]" /> : s.passed ? <CheckCircle2 className="w-4 h-4 text-[#22C55E]" /> : <XCircle className="w-4 h-4 text-mwasalatRed-500" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[#1E293B] truncate">{s.learner?.name}</p>
                    <p className="text-xs text-[#94A3B8] truncate">{s.learner?.email}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setGradingSubmission(s)}
                    className="text-sm font-medium text-mwasalatInk-500 hover:underline flex-shrink-0"
                  >
                    {s.status === 'graded' ? t('assignmentGrading.regradeBtn') : t('assignmentGrading.gradeBtn')}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {gradingSubmission && (
        <GradeModal submission={gradingSubmission} onClose={() => setGradingSubmission(null)} onGraded={handleGraded} />
      )}
    </div>
  );
}
