import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { Loader2, CheckCircle2, XCircle, Clock, ArrowLeft, Lock, Upload, FileText } from 'lucide-react';
import { mwasalatAssignmentService } from '../../services/mwasalatAssignment.service.js';
import { mwasalatProgramService } from '../../services/mwasalatProgram.service.js';
import { localizeNumber } from '../../utils/mwasalatLocalize.js';

export default function MwasalatAssignmentPage() {
  const { t, i18n } = useTranslation('mwasalatApp');
  const locale = i18n.language === 'ar' ? 'ar-OM' : 'en-GB';
  const { id } = useParams();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [assignment, setAssignment] = useState(null);
  const [contentOpened, setContentOpened] = useState(true);
  const [submissions, setSubmissions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [file, setFile] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const load = () => {
    Promise.all([
      mwasalatAssignmentService.getForLearner(id),
      mwasalatProgramService.getCompletionStatus(id),
      mwasalatAssignmentService.getMySubmissions(id),
    ])
      .then(([a, c, subs]) => {
        setAssignment(a);
        setContentOpened(Boolean(c?.contentOpened));
        setSubmissions(subs);
      })
      .finally(() => setIsLoading(false));
  };

  useEffect(load, [id]);

  const handleFilePick = (e) => {
    const picked = e.target.files?.[0];
    e.target.value = '';
    if (picked) setFile(picked);
  };

  const handleSubmit = async () => {
    if (!file) {
      toast.error(t('learnerAssignment.chooseFileFirst'));
      return;
    }
    setIsSubmitting(true);
    try {
      await mwasalatAssignmentService.submitAssignment(id, file);
      toast.success(t('learnerAssignment.submittedToast'));
      setFile(null);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || t('learnerAssignment.submitFailed'));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F8F9FB] flex items-center justify-center text-[#94A3B8]">
        <Loader2 className="w-5 h-5 animate-spin me-2" /> {t('learnerAssignment.loading')}
      </div>
    );
  }

  if (assignment && !contentOpened) {
    return (
      <div className="min-h-screen bg-[#F8F9FB] flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl p-8 max-w-sm w-full text-center">
          <div className="w-12 h-12 rounded-full bg-[#F1F5F9] flex items-center justify-center mx-auto mb-4">
            <Lock className="w-5 h-5 text-[#94A3B8]" />
          </div>
          <p className="text-sm font-semibold text-[#1E293B] mb-1.5">{t('learnerAssignment.lockedTitle')}</p>
          <p className="text-sm text-[#475569] mb-4">{t('learnerAssignment.lockedBody')}</p>
          <Link to="/learner/dashboard" className="text-sm font-medium text-mwasalatInk-500 hover:underline">{t('learnerAssignment.backToDashboardLink')}</Link>
        </div>
      </div>
    );
  }

  if (!assignment) {
    return (
      <div className="min-h-screen bg-[#F8F9FB] flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl p-8 max-w-sm w-full text-center">
          <p className="text-sm text-[#475569] mb-4">{t('learnerAssignment.noAssignmentYet')}</p>
          <Link to="/learner/dashboard" className="text-sm font-medium text-mwasalatInk-500 hover:underline">{t('learnerAssignment.backToDashboardLink')}</Link>
        </div>
      </div>
    );
  }

  const latest = submissions[0];
  const instructions = (i18n.language.startsWith('ar') && assignment.instructionsAr?.trim()) || assignment.instructions;

  return (
    <div className="min-h-screen bg-[#F8F9FB] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl p-8 max-w-lg w-full" style={{ boxShadow: '0 4px 32px rgba(0,0,0,0.09)' }}>
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => navigate(-1)} className="w-8 h-8 rounded-lg border border-[#E2E8F0] flex items-center justify-center text-[#475569] hover:bg-[#F1F5F9] transition-colors flex-shrink-0">
            <ArrowLeft className="w-3.5 h-3.5 rtl:rotate-180" />
          </button>
          <h1 className="text-lg font-semibold text-[#1E293B]">{assignment.title}</h1>
        </div>

        <p className="text-sm text-[#475569] whitespace-pre-wrap mb-6">{instructions}</p>

        {latest && (
          <div className={`p-4 rounded-xl border mb-6 ${latest.status === 'graded' ? (latest.passed ? 'border-mwasalatInk-200 bg-mwasalatInk-100/40' : 'border-mwasalatRed-300 bg-mwasalatRed-100/40') : 'border-[#E2E8F0] bg-[#F8F9FB]'}`}>
            <div className="flex items-start gap-2.5">
              {latest.status !== 'graded' ? (
                <Clock className="w-5 h-5 text-[#94A3B8] mt-0.5 flex-shrink-0" />
              ) : latest.passed ? (
                <CheckCircle2 className="w-5 h-5 text-mwasalatInk-500 mt-0.5 flex-shrink-0" />
              ) : (
                <XCircle className="w-5 h-5 text-mwasalatRed-500 mt-0.5 flex-shrink-0" />
              )}
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-[#1E293B]">
                  {latest.status !== 'graded'
                    ? t('learnerAssignment.pendingReview')
                    : latest.passed ? t('learnerAssignment.gradedPassed') : t('learnerAssignment.gradedFailed')}
                </p>
                <p className="text-xs text-[#94A3B8] mt-0.5">
                  {localizeNumber(t('learnerAssignment.submittedOn', { date: new Date(latest.submittedAt).toLocaleDateString(locale, { day: 'numeric', month: 'long', year: 'numeric' }) }), i18n.language)}
                </p>
                {latest.status === 'graded' && (
                  <>
                    {latest.score != null && (
                      <p className="text-sm font-bold text-[#1E293B] mt-2">{localizeNumber(latest.score, i18n.language)}%</p>
                    )}
                    {latest.feedback && (
                      <p className="text-xs text-[#475569] mt-1.5 whitespace-pre-wrap">{latest.feedback}</p>
                    )}
                  </>
                )}
              </div>
            </div>
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
          onClick={handleSubmit}
          disabled={!file || isSubmitting}
          className="w-full flex items-center justify-center gap-2 bg-mwasalatInk-500 hover:bg-mwasalatInk-400 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold px-6 py-3 rounded-xl transition-colors text-sm"
        >
          {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
          {isSubmitting ? t('learnerAssignment.submitting') : latest ? t('learnerAssignment.resubmitBtn') : t('learnerAssignment.submitBtn')}
        </button>
      </div>
    </div>
  );
}
