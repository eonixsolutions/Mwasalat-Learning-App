import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useMutation } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Star, Loader2, Send, ArrowLeft } from 'lucide-react';
import { mwasalatProgramService } from '../../services/mwasalatProgram.service.js';

function StarPicker({ value, onChange }) {
  return (
    <div className="flex items-center gap-1.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <button key={i} type="button" onClick={() => onChange(i)} className="transition-transform hover:scale-110">
          <Star className={`w-7 h-7 ${i <= value ? 'fill-mwasalatRed-500 text-mwasalatRed-500' : 'text-[#E2E8F0]'}`} />
        </button>
      ))}
    </div>
  );
}

export default function MwasalatFeedbackPage() {
  const { t } = useTranslation('mwasalatApp');
  const { id } = useParams();
  const navigate = useNavigate();
  const [courseRating, setCourseRating] = useState(0);
  const [instructorRating, setInstructorRating] = useState(0);
  const [comment, setComment] = useState('');

  const { mutate, isPending } = useMutation({
    mutationFn: () => mwasalatProgramService.submitFeedback(id, { courseRating, instructorRating, comment }),
    onSuccess: () => {
      toast.success(t('learnerFeedback.successToast'));
      navigate('/mwasalat/learner/dashboard');
    },
    onError: (err) => toast.error(err.response?.data?.message || t('learnerFeedback.errorToast')),
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!courseRating || !instructorRating) {
      toast.error(t('learnerFeedback.ratingRequiredToast'));
      return;
    }
    mutate();
  };

  return (
    <div className="min-h-screen bg-[#F8F9FB] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl p-8 max-w-md w-full" style={{ boxShadow: '0 4px 32px rgba(0,0,0,0.09)' }}>
        <div className="flex items-center gap-3 mb-6">
          <Link to="/mwasalat/learner/dashboard" className="w-9 h-9 rounded-xl border border-[#E2E8F0] flex items-center justify-center text-[#475569] hover:bg-[#F1F5F9] transition-colors flex-shrink-0">
            <ArrowLeft className="w-4 h-4 rtl:rotate-180" />
          </Link>
          <div>
            <h2 className="text-lg font-semibold text-[#1E293B]">{t('learnerFeedback.pageTitle')}</h2>
            <p className="text-xs text-[#94A3B8]">{t('learnerFeedback.pageSubtitle')}</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-[#1E293B] mb-2">{t('learnerFeedback.courseRatingLabel')}</label>
            <StarPicker value={courseRating} onChange={setCourseRating} />
          </div>

          <div>
            <label className="block text-sm font-medium text-[#1E293B] mb-2">{t('learnerFeedback.instructorRatingLabel')}</label>
            <StarPicker value={instructorRating} onChange={setInstructorRating} />
          </div>

          <div>
            <label className="block text-sm font-medium text-[#1E293B] mb-1.5">{t('learnerFeedback.commentsLabel')}</label>
            <textarea
              rows={4}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder={t('learnerFeedback.commentsPlaceholder')}
              className="w-full px-3.5 py-2.5 rounded-xl border border-[#E2E8F0] text-sm bg-white text-[#1E293B] placeholder:text-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-mwasalatInk-500/20 hover:border-mwasalatInk-300 transition-colors"
            />
          </div>

          <button
            type="submit"
            disabled={isPending}
            className="w-full flex items-center justify-center gap-2 bg-mwasalatInk-500 hover:bg-mwasalatInk-400 disabled:opacity-60 text-white font-semibold px-6 py-3 rounded-xl transition-colors text-sm"
          >
            {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            {isPending ? t('learnerFeedback.submitting') : t('learnerFeedback.submitBtn')}
          </button>
        </form>
      </div>
    </div>
  );
}
