import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useMutation } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Star, Loader2, Send, PartyPopper, Award, ThumbsUp, ThumbsDown } from 'lucide-react';
import { Link } from 'react-router-dom';
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

// The course-completion review pane — reached automatically once every
// module (modular courses) or the assessment/assignment (legacy courses) is
// done, never via a separate "Give Feedback" button/route. `embedded` skips
// the card/shadow chrome for callers that already nest this inside their own
// white card (e.g. MwasalatLearnerCourseDetailPage) — the course player uses
// the default standalone-card look since it sits directly on the page background.
export default function MwasalatCourseReviewInline({ programId, onSubmitted, embedded = false }) {
  const { t } = useTranslation('mwasalatApp');
  const [courseRating, setCourseRating] = useState(0);
  const [trainerClear, setTrainerClear] = useState(null);
  const [instructorRating, setInstructorRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const { mutate, isPending } = useMutation({
    mutationFn: () => mwasalatProgramService.submitFeedback(programId, { courseRating, trainerClear, instructorRating, comment }),
    onSuccess: () => {
      setSubmitted(true);
      onSubmitted?.();
    },
    onError: (err) => toast.error(err.response?.data?.message || t('courseReview.errorToast')),
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!courseRating || !instructorRating || trainerClear === null) {
      toast.error(t('courseReview.ratingRequiredToast'));
      return;
    }
    mutate();
  };

  if (submitted) {
    return (
      <div className={embedded ? 'text-center' : 'bg-white rounded-2xl p-8 text-center'} style={embedded ? undefined : { boxShadow: '0 4px 32px rgba(0,0,0,0.06)' }}>
        <PartyPopper className="w-12 h-12 text-mwasalatRed-500 mx-auto mb-3 animate-bounce" />
        <h2 className="text-xl font-bold text-[#1E293B] mb-1.5">{t('courseReview.thanksTitle')}</h2>
        <p className="text-sm text-[#475569] mb-6">{t('courseReview.thanksBody')}</p>
        <Link
          to={`/learner/programs/${programId}/certificate`}
          className="inline-flex items-center justify-center gap-1.5 bg-mwasalatInk-500 hover:bg-mwasalatInk-400 text-white font-semibold px-6 py-3 rounded-xl transition-colors text-sm"
        >
          <Award className="w-4 h-4" /> {t('courseReview.viewCertificateBtn')}
        </Link>
      </div>
    );
  }

  return (
    <div className={embedded ? '' : 'bg-white rounded-2xl p-6 sm:p-8'} style={embedded ? undefined : { boxShadow: '0 4px 32px rgba(0,0,0,0.06)' }}>
      <div className="mb-6">
        <h2 className="text-lg font-bold text-[#1E293B]">{t('courseReview.heading')}</h2>
        <p className="text-sm text-[#94A3B8] mt-1">{t('courseReview.subheading')}</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-[#1E293B] mb-2">{t('courseReview.usefulnessLabel')}</label>
          <StarPicker value={courseRating} onChange={setCourseRating} />
        </div>

        <div>
          <label className="block text-sm font-medium text-[#1E293B] mb-2">{t('courseReview.trainerClearLabel')}</label>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setTrainerClear(true)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-semibold border transition-colors ${
                trainerClear === true ? 'bg-mwasalatRed-500 border-mwasalatRed-500 text-white' : 'border-[#E2E8F0] text-[#475569] hover:border-mwasalatRed-300'
              }`}
            >
              <ThumbsUp className="w-4 h-4" /> {t('courseReview.yes')}
            </button>
            <button
              type="button"
              onClick={() => setTrainerClear(false)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-semibold border transition-colors ${
                trainerClear === false ? 'bg-mwasalatInk-500 border-mwasalatInk-500 text-white' : 'border-[#E2E8F0] text-[#475569] hover:border-mwasalatInk-300'
              }`}
            >
              <ThumbsDown className="w-4 h-4" /> {t('courseReview.no')}
            </button>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-[#1E293B] mb-2">{t('courseReview.trainerRatingLabel')}</label>
          <StarPicker value={instructorRating} onChange={setInstructorRating} />
        </div>

        <div>
          <label className="block text-sm font-medium text-[#1E293B] mb-1.5">{t('courseReview.commentsLabel')}</label>
          <textarea
            rows={4}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder={t('courseReview.commentsPlaceholder')}
            className="w-full px-3.5 py-2.5 rounded-xl border border-[#E2E8F0] text-sm bg-white text-[#1E293B] placeholder:text-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-mwasalatInk-500/20 hover:border-mwasalatInk-300 transition-colors"
          />
        </div>

        <button
          type="submit"
          disabled={isPending}
          className="w-full flex items-center justify-center gap-2 bg-mwasalatRed-500 hover:bg-mwasalatRed-600 disabled:opacity-60 text-white font-semibold px-6 py-3 rounded-xl transition-colors text-sm"
        >
          {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          {isPending ? t('courseReview.submitting') : t('courseReview.submitBtn')}
        </button>
      </form>
    </div>
  );
}
