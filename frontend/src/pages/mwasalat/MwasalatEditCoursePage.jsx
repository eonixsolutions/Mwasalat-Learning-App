import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { ArrowLeft, Loader2, Save, Trash2, Video, X } from 'lucide-react';
import { mwasalatProgramService } from '../../services/mwasalatProgram.service.js';
import { getLocalizedProgramField } from '../../utils/mwasalatLocalize.js';

const inputClass = 'w-full px-3.5 py-2.5 rounded-xl border border-[#E2E8F0] text-sm bg-white text-[#1E293B] placeholder:text-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-mwasalatInk-500/20 hover:border-mwasalatInk-300 transition-colors';

const toDateTimeLocal = (value) => (value ? new Date(value).toISOString().slice(0, 16) : '');
const toDateLocal = (value) => (value ? new Date(value).toISOString().slice(0, 10) : '');

export default function MwasalatEditCoursePage() {
  const { t, i18n } = useTranslation('mwasalatApp');
  const { id } = useParams();
  const navigate = useNavigate();
  const [program, setProgram] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [zoomMeeting, setZoomMeeting] = useState(null);
  const [myCourses, setMyCourses] = useState([]);
  const { register, handleSubmit, reset, watch, setValue, formState: { errors } } = useForm();
  const title = watch('title');
  const liveScheduledAt = watch('liveScheduledAt');

  useEffect(() => {
    mwasalatProgramService.getById(id).then((p) => {
      setProgram(p);
      reset({
        title: p.title,
        titleAr: p.titleAr ?? '',
        category: p.category,
        categoryAr: p.categoryAr ?? '',
        subCategory: p.subCategory ?? '',
        subCategoryAr: p.subCategoryAr ?? '',
        description: p.description ?? '',
        descriptionAr: p.descriptionAr ?? '',
        duration: p.duration ?? '',
        durationAr: p.durationAr ?? '',
        pdfDurationDays: p.pdfDurationDays ?? '',
        price: p.price ?? 0,
        expiryDate: toDateLocal(p.expiryDate),
        certificateValidityMonths: p.certificateValidityMonths ?? '',
        recordingLink: p.recordingLink ?? '',
        liveScheduledAt: toDateTimeLocal(p.liveScheduledAt),
        liveMeetingLink: p.liveMeetingLink ?? '',
        iltVenue: p.iltVenue ?? '',
        iltScheduledAt: toDateTimeLocal(p.iltScheduledAt),
        capacity: p.capacity ?? '',
        prerequisiteProgram: p.prerequisiteProgram?._id ?? '',
      });
    }).finally(() => setIsLoading(false));
    mwasalatProgramService.listMine()
      .then((courses) => setMyCourses(courses.filter((c) => c.status === 'active' && c._id !== id)))
      .catch(() => {});
  }, [id, reset]);

  const { mutate: createZoomMeeting, isPending: isCreatingMeeting } = useMutation({
    mutationFn: () => mwasalatProgramService.createLiveMeeting({ title, liveScheduledAt }),
    onSuccess: (meeting) => {
      setValue('liveMeetingLink', meeting.joinUrl, { shouldValidate: true });
      setZoomMeeting({ startUrl: meeting.startUrl, meetingId: meeting.meetingId });
      toast.success(t('addCourse.live.zoomCreatedToast'));
    },
    onError: (err) => toast.error(err.response?.data?.message || t('addCourse.live.zoomCreateFailed')),
  });

  const { mutate, isPending } = useMutation({
    mutationFn: (data) => mwasalatProgramService.update(id, data),
    onSuccess: () => {
      toast.success(t('editCourse.toastUpdated'));
      navigate(`/mwasalat/instructor/programs/${id}`);
    },
    onError: (err) => toast.error(err.response?.data?.message || t('editCourse.toastUpdateFailed')),
  });

  const { mutate: deleteCourse, isPending: isDeleting } = useMutation({
    mutationFn: () => mwasalatProgramService.remove(id),
    onSuccess: () => {
      toast.success(t('editCourse.toastDeleted'));
      navigate('/mwasalat/instructor/dashboard');
    },
    onError: (err) => toast.error(err.response?.data?.message || t('editCourse.toastDeleteFailed')),
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F8F9FB] flex items-center justify-center text-[#94A3B8]">
        <Loader2 className="w-5 h-5 animate-spin me-2" /> {t('editCourse.loading')}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F9FB]">
      <header className="h-16 bg-white border-b border-[#E2E8F0] flex items-center justify-between px-8">
        <div className="flex items-center gap-4">
          <Link to={`/mwasalat/instructor/programs/${id}`} className="w-9 h-9 rounded-xl border border-[#E2E8F0] flex items-center justify-center text-[#475569] hover:bg-[#F1F5F9] transition-colors">
            <ArrowLeft className="w-4 h-4 rtl:rotate-180" />
          </Link>
          <div>
            <p className="text-sm font-semibold text-[#1E293B]">{t('editCourse.headerTitle')}</p>
            <p className="text-xs text-[#94A3B8]">{getLocalizedProgramField(program, 'title', i18n.language)}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setShowDeleteConfirm(true)}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-mwasalatRed-600 hover:text-mwasalatRed-700 transition-colors"
        >
          <Trash2 className="w-4 h-4" /> {t('editCourse.deleteCourseBtn')}
        </button>
      </header>

      <main className="p-8 max-w-2xl mx-auto">
        <form
          onSubmit={handleSubmit((data) => mutate(zoomMeeting ? { ...data, liveMeetingProvider: 'zoom', liveMeetingStartUrl: zoomMeeting.startUrl } : data))}
          className="card p-6 space-y-5"
        >

          <div>
            <label className="block text-sm font-medium text-[#1E293B] mb-1.5">{t('editCourse.courseTitleLabel')}</label>
            <input className={inputClass} {...register('title', { required: t('editCourse.errors.titleRequired') })} />
            {errors.title && <p className="text-xs text-[#C22033] mt-1">{errors.title.message}</p>}
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[#1E293B] mb-1.5">{t('editCourse.categoryLabel')}</label>
              <input className={inputClass} {...register('category', { required: t('editCourse.errors.categoryRequired') })} />
              {errors.category && <p className="text-xs text-[#C22033] mt-1">{errors.category.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-[#1E293B] mb-1.5">{t('editCourse.subCategoryLabel')}</label>
              <input className={inputClass} {...register('subCategory')} />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-[#1E293B] mb-1.5">{t('editCourse.descriptionLabel')}</label>
            <textarea rows={3} className={inputClass} {...register('description')} />
          </div>

          <div className="p-4 rounded-xl bg-[#F8F9FB] border border-[#E2E8F0] space-y-4">
            <div>
              <p className="text-sm font-semibold text-[#1E293B]">{t('editCourse.arabicSectionHeading')}</p>
              <p className="text-xs text-[#94A3B8] mt-0.5">{t('editCourse.arabicSectionHint')}</p>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-[#1E293B] mb-1.5">{t('editCourse.courseTitleArLabel')}</label>
                <input dir="rtl" className={inputClass} {...register('titleAr')} />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#1E293B] mb-1.5">{t('editCourse.categoryArLabel')}</label>
                <input dir="rtl" className={inputClass} {...register('categoryAr')} />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#1E293B] mb-1.5">{t('editCourse.subCategoryArLabel')}</label>
                <input dir="rtl" className={inputClass} {...register('subCategoryAr')} />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#1E293B] mb-1.5">{t('editCourse.durationArLabel')}</label>
                <input dir="rtl" className={inputClass} {...register('durationAr')} />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-[#1E293B] mb-1.5">{t('editCourse.descriptionArLabel')}</label>
              <textarea rows={3} dir="rtl" className={inputClass} {...register('descriptionAr')} />
            </div>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {program?.contentTypes?.map((type) => (
              <span key={type} className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-mwasalatInk-100 text-mwasalatInk-500 capitalize">
                {t(`addCourse.contentTypes.${type}.label`)}
              </span>
            ))}
          </div>
          <p className="text-xs text-[#94A3B8] -mt-3">{t('editCourse.contentTypesLockedNote')}</p>

          {program?.contentTypes?.includes('pdf') && (
            <div className="p-4 rounded-xl bg-[#F8F9FB] border border-[#E2E8F0]">
              <label className="block text-sm font-medium text-[#1E293B] mb-1.5">{t('addCourse.pdf.durationDaysLabel')}</label>
              <input
                type="number"
                min="1"
                step="1"
                dir="ltr"
                className={`${inputClass} text-start`}
                placeholder={t('addCourse.pdf.durationDaysPlaceholder')}
                {...register('pdfDurationDays', { min: { value: 1, message: t('addCourse.pdf.durationDaysInvalid') } })}
              />
              {errors.pdfDurationDays && <p className="text-xs text-[#C22033] mt-1">{errors.pdfDurationDays.message}</p>}
              <p className="text-xs text-[#94A3B8] mt-1">{t('addCourse.pdf.durationDaysHint')}</p>
            </div>
          )}

          {program?.contentTypes?.includes('recording') && (
            <div className="p-4 rounded-xl bg-[#F8F9FB] border border-[#E2E8F0]">
              <label className="block text-sm font-medium text-[#1E293B] mb-1.5">{t('editCourse.recording.linkLabel')}</label>
              <input dir="ltr" className={`${inputClass} text-start`} {...register('recordingLink')} />
            </div>
          )}

          {program?.contentTypes?.includes('live') && (
            <div className="p-4 rounded-xl bg-[#F8F9FB] border border-[#E2E8F0] space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#1E293B] mb-1.5">{t('editCourse.dateTimeLabel')}</label>
                <input type="datetime-local" dir="ltr" className={`${inputClass} text-start`} {...register('liveScheduledAt')} />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#1E293B] mb-1.5">{t('editCourse.live.meetingLinkLabel')}</label>
                <div className="flex gap-2">
                  <input
                    dir="ltr"
                    readOnly={Boolean(zoomMeeting)}
                    className={`${inputClass} text-start flex-1 ${zoomMeeting ? 'bg-[#F1F5F9] text-[#475569]' : ''}`}
                    {...register('liveMeetingLink')}
                  />
                  {zoomMeeting ? (
                    <button
                      type="button"
                      onClick={() => { setZoomMeeting(null); setValue('liveMeetingLink', ''); }}
                      className="flex-shrink-0 inline-flex items-center gap-1.5 px-3 py-2.5 rounded-xl border border-[#E2E8F0] text-xs font-semibold text-[#475569] hover:bg-[#F1F5F9] transition-colors"
                    >
                      <X className="w-3.5 h-3.5" /> {t('addCourse.live.clearZoomBtn')}
                    </button>
                  ) : (
                    <button
                      type="button"
                      disabled={!liveScheduledAt || isCreatingMeeting}
                      onClick={() => createZoomMeeting()}
                      className="flex-shrink-0 inline-flex items-center gap-1.5 px-3 py-2.5 rounded-xl bg-mwasalatInk-500 hover:bg-mwasalatInk-400 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-semibold transition-colors"
                    >
                      {isCreatingMeeting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Video className="w-3.5 h-3.5" />}
                      {t('addCourse.live.createZoomBtn')}
                    </button>
                  )}
                </div>
                {zoomMeeting && (
                  <>
                    <p className="text-[11px] text-mwasalatInk-500 mt-1">{t('addCourse.live.zoomReadyHint')}</p>
                    <label className="block text-xs font-medium text-mwasalatRed-600 mb-1.5 mt-3">{t('addCourse.live.hostLinkLabel')}</label>
                    <div className="flex gap-2">
                      <input readOnly dir="ltr" value={zoomMeeting.startUrl} className={`${inputClass} text-start flex-1 bg-[#FBE7E9]`} />
                      <button
                        type="button"
                        onClick={() => { navigator.clipboard.writeText(zoomMeeting.startUrl); toast.success(t('addCourse.live.copiedToast')); }}
                        className="flex-shrink-0 px-3 py-2.5 rounded-xl border border-[#E2E8F0] text-xs font-semibold text-[#475569] hover:bg-[#F1F5F9] transition-colors"
                      >
                        {t('addCourse.live.copyBtn')}
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          {program?.contentTypes?.includes('ilt') && (
            <div className="p-4 rounded-xl bg-[#F8F9FB] border border-[#E2E8F0] space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#1E293B] mb-1.5">{t('editCourse.ilt.venueLabel')}</label>
                <input className={inputClass} {...register('iltVenue')} />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#1E293B] mb-1.5">{t('editCourse.dateTimeLabel')}</label>
                <input type="datetime-local" dir="ltr" className={`${inputClass} text-start`} {...register('iltScheduledAt')} />
              </div>
            </div>
          )}

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[#1E293B] mb-1.5">{t('editCourse.durationLabel')}</label>
              <input className={inputClass} {...register('duration')} />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#1E293B] mb-1.5">{t('editCourse.priceLabel')}</label>
              <input type="number" step="0.01" dir="ltr" className={`${inputClass} text-start`} {...register('price', { valueAsNumber: true })} />
            </div>
          </div>

          {(program?.contentTypes?.includes('live') || program?.contentTypes?.includes('ilt')) && (
            <div>
              <label className="block text-sm font-medium text-[#1E293B] mb-1.5">{t('addCourse.capacityLabel')}</label>
              <input
                type="number"
                min="1"
                step="1"
                dir="ltr"
                className={`${inputClass} text-start`}
                placeholder={t('addCourse.capacityPlaceholder')}
                {...register('capacity', { min: { value: 1, message: t('addCourse.capacityInvalid') } })}
              />
              {errors.capacity && <p className="text-xs text-[#C22033] mt-1">{errors.capacity.message}</p>}
              <p className="text-xs text-[#94A3B8] mt-1">{t('addCourse.capacityHint')}</p>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-[#1E293B] mb-1.5">{t('editCourse.expiryDateLabel')}</label>
            <input type="date" dir="ltr" className={`${inputClass} text-start`} {...register('expiryDate')} />
            <p className="text-xs text-[#94A3B8] mt-1">{t('editCourse.expiryDateHint')}</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-[#1E293B] mb-1.5">{t('editCourse.certificateValidityLabel')}</label>
            <input
              type="number"
              min="1"
              step="1"
              dir="ltr"
              className={`${inputClass} text-start`}
              placeholder={t('editCourse.certificateValidityPlaceholder')}
              {...register('certificateValidityMonths', { min: { value: 1, message: t('editCourse.certificateValidityInvalid') } })}
            />
            {errors.certificateValidityMonths && <p className="text-xs text-[#C22033] mt-1">{errors.certificateValidityMonths.message}</p>}
            <p className="text-xs text-[#94A3B8] mt-1">{t('editCourse.certificateValidityHint')}</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-[#1E293B] mb-1.5">{t('editCourse.prerequisiteLabel')}</label>
            <select className={inputClass} {...register('prerequisiteProgram')}>
              <option value="">{t('editCourse.prerequisiteNone')}</option>
              {myCourses.map((c) => (
                <option key={c._id} value={c._id}>{getLocalizedProgramField(c, 'title', i18n.language)}</option>
              ))}
            </select>
            <p className="text-xs text-[#94A3B8] mt-1">{t('editCourse.prerequisiteHint')}</p>
          </div>

          <button
            type="submit"
            disabled={isPending}
            className="w-full flex items-center justify-center gap-2 bg-mwasalatInk-500 hover:bg-mwasalatInk-400 disabled:opacity-60 text-white font-semibold px-6 py-3 rounded-xl transition-colors text-sm"
          >
            {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {isPending ? t('editCourse.saving') : t('profile.saveChanges')}
          </button>
        </form>
      </main>

      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl w-full max-w-sm p-6">
            <h3 className="text-lg font-semibold text-[#1E293B] mb-2">{t('editCourse.deleteModal.title')}</h3>
            <p className="text-sm text-[#475569] mb-5">
              {t('editCourse.deleteModal.body')}
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 px-4 py-2.5 rounded-xl border border-[#E2E8F0] text-sm font-medium text-[#475569] hover:bg-[#F1F5F9] transition-colors"
              >
                {t('common.cancel')}
              </button>
              <button
                onClick={() => deleteCourse()}
                disabled={isDeleting}
                className="flex-1 inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-mwasalatRed-600 hover:bg-mwasalatRed-700 disabled:opacity-60 text-white text-sm font-semibold transition-colors"
              >
                {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                {t('common.delete')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
