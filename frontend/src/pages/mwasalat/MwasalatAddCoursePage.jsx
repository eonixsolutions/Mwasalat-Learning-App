import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate, Link } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { ArrowLeft, Loader2, BookPlus, Sparkles, FileText, Video, Radio, MapPin, HelpCircle, CheckCircle2, ArrowRight, X } from 'lucide-react';
import { mwasalatProgramService } from '../../services/mwasalatProgram.service.js';
import MwasalatQuizBuilder from '../../components/mwasalat/MwasalatQuizBuilder.jsx';
import { getLocalizedProgramField } from '../../utils/mwasalatLocalize.js';

const CONTENT_TYPES = [
  { value: 'pdf', labelKey: 'addCourse.contentTypes.pdf.label', hintKey: 'addCourse.contentTypes.pdf.hint', icon: FileText },
  { value: 'recording', labelKey: 'addCourse.contentTypes.recording.label', hintKey: 'addCourse.contentTypes.recording.hint', icon: Video },
  { value: 'live', labelKey: 'addCourse.contentTypes.live.label', hintKey: 'addCourse.contentTypes.live.hint', icon: Radio },
  { value: 'ilt', labelKey: 'addCourse.contentTypes.ilt.label', hintKey: 'addCourse.contentTypes.ilt.hint', icon: MapPin },
];

const inputClass = 'w-full px-3.5 py-2.5 rounded-xl border border-[#E2E8F0] text-sm bg-white text-[#1E293B] placeholder:text-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-mwasalatInk-500/20 hover:border-mwasalatInk-300 transition-colors';

export default function MwasalatAddCoursePage() {
  const { t, i18n } = useTranslation('mwasalatApp');
  const navigate = useNavigate();
  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm();
  const [aiSuggested, setAiSuggested] = useState(false);
  const [selectedTypes, setSelectedTypes] = useState([]);
  const [createdProgram, setCreatedProgram] = useState(null);
  const [recordingMode, setRecordingMode] = useState('link');
  const [zoomMeeting, setZoomMeeting] = useState(null);
  const [myCourses, setMyCourses] = useState([]);
  const title = watch('title');
  const pdfFile = watch('pdfFile');
  const videoFile = watch('videoFile');
  const liveScheduledAt = watch('liveScheduledAt');

  useEffect(() => {
    mwasalatProgramService.listMine()
      .then((courses) => setMyCourses(courses.filter((c) => c.status === 'active')))
      .catch(() => {});
  }, []);

  const toggleType = (value) => {
    setSelectedTypes((prev) =>
      prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]
    );
  };

  const { mutate: autofill, isPending: isAutofilling } = useMutation({
    mutationFn: mwasalatProgramService.aiAutofill,
    onSuccess: (suggestion) => {
      setValue('category', suggestion.category, { shouldValidate: true });
      setValue('subCategory', suggestion.subCategory);
      setValue('description', suggestion.description);
      setAiSuggested(true);
    },
    onError: (err) => toast.error(err.response?.data?.message || t('addCourse.toastAutofillFailed')),
  });

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
    mutationFn: mwasalatProgramService.create,
    onSuccess: (program) => {
      toast.success(t('addCourse.toastCreated'));
      setCreatedProgram(program);
    },
    onError: (err) => toast.error(err.response?.data?.message || t('addCourse.toastCreateFailed')),
  });

  const onSubmit = (data) => {
    if (selectedTypes.length === 0) {
      toast.error(t('addCourse.errors.selectContentType'));
      return;
    }

    const formData = new FormData();
    formData.append('title', data.title);
    formData.append('titleAr', data.titleAr ?? '');
    formData.append('category', data.category);
    formData.append('categoryAr', data.categoryAr ?? '');
    formData.append('subCategory', data.subCategory ?? '');
    formData.append('subCategoryAr', data.subCategoryAr ?? '');
    formData.append('description', data.description ?? '');
    formData.append('descriptionAr', data.descriptionAr ?? '');
    formData.append('duration', data.duration ?? '');
    formData.append('durationAr', data.durationAr ?? '');
    formData.append('price', data.price ?? 0);
    formData.append('expiryDate', data.expiryDate ?? '');
    formData.append('certificateValidityMonths', data.certificateValidityMonths ?? '');
    formData.append('prerequisiteProgram', data.prerequisiteProgram ?? '');
    formData.append('contentTypes', JSON.stringify(selectedTypes));

    if (selectedTypes.includes('pdf') && data.pdfFile?.[0]) {
      formData.append('pdfFile', data.pdfFile[0]);
      if (data.pdfDurationDays) formData.append('pdfDurationDays', data.pdfDurationDays);
    }
    if (selectedTypes.includes('recording')) {
      if (recordingMode === 'upload' && data.videoFile?.[0]) {
        formData.append('videoFile', data.videoFile[0]);
      } else {
        formData.append('recordingLink', data.recordingLink ?? '');
      }
    }
    if (selectedTypes.includes('live')) {
      formData.append('liveScheduledAt', data.liveScheduledAt ?? '');
      formData.append('liveMeetingLink', data.liveMeetingLink ?? '');
      if (zoomMeeting) {
        formData.append('liveMeetingProvider', 'zoom');
        formData.append('liveMeetingStartUrl', zoomMeeting.startUrl);
      }
    }
    if (selectedTypes.includes('ilt')) {
      formData.append('iltVenue', data.iltVenue ?? '');
      formData.append('iltScheduledAt', data.iltScheduledAt ?? '');
    }
    if (selectedTypes.includes('live') || selectedTypes.includes('ilt')) {
      formData.append('capacity', data.capacity ?? '');
    }

    mutate(formData);
  };

  if (createdProgram) {
    return (
      <div className="min-h-screen bg-[#F8F9FB]">
        <header className="h-16 bg-white border-b border-[#E2E8F0] flex items-center gap-4 px-8">
          <div className="w-9 h-9 rounded-xl bg-mwasalatInk-100 flex items-center justify-center text-mwasalatInk-500 flex-shrink-0">
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <div>
            <p className="text-sm font-semibold text-[#1E293B]">{getLocalizedProgramField(createdProgram, 'title', i18n.language)}</p>
            <p className="text-xs text-[#94A3B8]">{t('addCourse.step2Label')}</p>
          </div>
        </header>

        <main className="p-8 max-w-2xl mx-auto">
          <div className="card p-5 mb-5 flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-mwasalatInk-100 flex items-center justify-center text-mwasalatInk-500 flex-shrink-0">
              <HelpCircle className="w-4 h-4" />
            </div>
            <div>
              <p className="text-sm font-semibold text-[#1E293B]">{t('addCourse.addAssessmentTitle')}</p>
              <p className="text-xs text-[#94A3B8] mt-0.5">
                {t('addCourse.addAssessmentBody')}
              </p>
            </div>
          </div>

          <div className="card overflow-hidden">
            <MwasalatQuizBuilder
              programId={createdProgram._id}
              onSaved={() => navigate(`/mwasalat/instructor/programs/${createdProgram._id}`)}
            />
          </div>

          <button
            type="button"
            onClick={() => navigate(`/mwasalat/instructor/programs/${createdProgram._id}`)}
            className="w-full flex items-center justify-center gap-1.5 text-sm font-medium text-[#475569] hover:text-mwasalatInk-500 transition-colors mt-4"
          >
            {t('addCourse.skipForNow')} <ArrowRight className="w-3.5 h-3.5 rtl:rotate-180" />
          </button>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F9FB]">
      <header className="h-16 bg-white border-b border-[#E2E8F0] flex items-center gap-4 px-8">
        <Link to="/mwasalat/instructor/dashboard" className="w-9 h-9 rounded-xl border border-[#E2E8F0] flex items-center justify-center text-[#475569] hover:bg-[#F1F5F9] transition-colors">
          <ArrowLeft className="w-4 h-4 rtl:rotate-180" />
        </Link>
        <div>
          <p className="text-sm font-semibold text-[#1E293B]">{t('instructor.nav.addCourse')}</p>
          <p className="text-xs text-[#94A3B8]">{t('addCourse.headerSubtitle')}</p>
        </div>
      </header>

      <main className="p-8 max-w-2xl mx-auto">
        <form onSubmit={handleSubmit(onSubmit)} className="card p-6 space-y-5">

          <div>
            <label className="block text-sm font-medium text-[#1E293B] mb-1.5">{t('addCourse.courseTitleLabel')}</label>
            <input className={inputClass} placeholder={t('addCourse.courseTitlePlaceholder')} {...register('title', { required: t('addCourse.errors.titleRequired'), onChange: () => setAiSuggested(false) })} />
            {errors.title && <p className="text-xs text-[#C22033] mt-1">{errors.title.message}</p>}
            <button
              type="button"
              disabled={!title?.trim() || isAutofilling}
              onClick={() => autofill(title)}
              className="mt-2 inline-flex items-center gap-1.5 text-xs font-semibold text-mwasalatInk-500 hover:text-mwasalatInk-400 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              {isAutofilling ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
              {isAutofilling ? t('addCourse.autofillSuggesting') : t('addCourse.autofillCta')}
            </button>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="flex items-center gap-1.5 text-sm font-medium text-[#1E293B] mb-1.5">
                {t('addCourse.categoryLabel')}
                {aiSuggested && <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-mwasalatInk-500 bg-mwasalatInk-100 px-1.5 py-0.5 rounded-full"><Sparkles className="w-2.5 h-2.5" /> {t('addCourse.aiSuggestedBadge')}</span>}
              </label>
              <input className={inputClass} placeholder={t('addCourse.categoryPlaceholder')} {...register('category', { required: t('addCourse.errors.categoryRequired') })} />
              {errors.category && <p className="text-xs text-[#C22033] mt-1">{errors.category.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-[#1E293B] mb-1.5">{t('addCourse.subCategoryLabel')}</label>
              <input className={inputClass} placeholder={t('addCourse.subCategoryPlaceholder')} {...register('subCategory')} />
            </div>
          </div>

          <div>
            <label className="flex items-center gap-1.5 text-sm font-medium text-[#1E293B] mb-1.5">
              {t('addCourse.descriptionLabel')}
              {aiSuggested && <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-mwasalatInk-500 bg-mwasalatInk-100 px-1.5 py-0.5 rounded-full"><Sparkles className="w-2.5 h-2.5" /> {t('addCourse.aiSuggestedBadge')}</span>}
            </label>
            <textarea rows={3} className={inputClass} placeholder={t('addCourse.descriptionPlaceholder')} {...register('description')} />
          </div>

          <div className="p-4 rounded-xl bg-[#F8F9FB] border border-[#E2E8F0] space-y-4">
            <div>
              <p className="text-sm font-semibold text-[#1E293B]">{t('addCourse.arabicSectionHeading')}</p>
              <p className="text-xs text-[#94A3B8] mt-0.5">{t('addCourse.arabicSectionHint')}</p>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-[#1E293B] mb-1.5">{t('addCourse.courseTitleArLabel')}</label>
                <input dir="rtl" className={inputClass} placeholder={t('addCourse.courseTitleArPlaceholder')} {...register('titleAr')} />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#1E293B] mb-1.5">{t('addCourse.categoryArLabel')}</label>
                <input dir="rtl" className={inputClass} placeholder={t('addCourse.categoryArPlaceholder')} {...register('categoryAr')} />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#1E293B] mb-1.5">{t('addCourse.subCategoryArLabel')}</label>
                <input dir="rtl" className={inputClass} placeholder={t('addCourse.subCategoryArPlaceholder')} {...register('subCategoryAr')} />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#1E293B] mb-1.5">{t('addCourse.durationArLabel')}</label>
                <input dir="rtl" className={inputClass} placeholder={t('addCourse.durationArPlaceholder')} {...register('durationAr')} />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-[#1E293B] mb-1.5">{t('addCourse.descriptionArLabel')}</label>
              <textarea rows={3} dir="rtl" className={inputClass} placeholder={t('addCourse.descriptionArPlaceholder')} {...register('descriptionAr')} />
            </div>
          </div>

          {/* Content type multi-select */}
          <div>
            <label className="block text-sm font-medium text-[#1E293B] mb-2">{t('addCourse.contentTypeLabel')}</label>
            <div className="grid sm:grid-cols-2 gap-3">
              {CONTENT_TYPES.map(({ value, labelKey, icon: Icon, hintKey }) => {
                const active = selectedTypes.includes(value);
                return (
                  <button
                    key={value}
                    type="button"
                    onClick={() => toggleType(value)}
                    className={`text-start p-3.5 rounded-xl border transition-colors ${
                      active ? 'border-mwasalatInk-500 bg-mwasalatInk-100' : 'border-[#E2E8F0] hover:border-mwasalatInk-300'
                    }`}
                  >
                    <Icon className={`w-4.5 h-4.5 mb-2 ${active ? 'text-mwasalatInk-500' : 'text-[#94A3B8]'}`} />
                    <p className={`text-sm font-semibold ${active ? 'text-mwasalatInk-500' : 'text-[#1E293B]'}`}>{t(labelKey)}</p>
                    <p className="text-xs text-[#94A3B8] mt-0.5">{t(hintKey)}</p>
                  </button>
                );
              })}
            </div>
            {selectedTypes.length === 0 && (
              <p className="text-xs text-[#94A3B8] mt-2">{t('addCourse.contentTypeHint')}</p>
            )}
          </div>

          {selectedTypes.includes('pdf') && (
            <div className="p-4 rounded-xl bg-[#F8F9FB] border border-[#E2E8F0]">
              <label className="block text-sm font-medium text-[#1E293B] mb-1.5">{t('addCourse.pdf.uploadLabel')}</label>
              <input
                type="file"
                accept="application/pdf"
                className={inputClass}
                {...register('pdfFile', { required: selectedTypes.includes('pdf') ? t('addCourse.pdf.required') : false })}
              />
              {errors.pdfFile && <p className="text-xs text-[#C22033] mt-1">{errors.pdfFile.message}</p>}
              {pdfFile?.[0] && <p className="text-xs text-mwasalatInk-500 mt-1">{pdfFile[0].name}</p>}

              <label className="block text-sm font-medium text-[#1E293B] mb-1.5 mt-3">{t('addCourse.pdf.durationDaysLabel')}</label>
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

          {selectedTypes.includes('recording') && (
            <div className="p-4 rounded-xl bg-[#F8F9FB] border border-[#E2E8F0]">
              <div className="flex items-center gap-1.5 mb-3">
                <button
                  type="button"
                  onClick={() => setRecordingMode('link')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                    recordingMode === 'link' ? 'bg-mwasalatInk-500 text-white' : 'bg-white text-[#475569] border border-[#E2E8F0]'
                  }`}
                >
                  {t('addCourse.recording.pasteLink')}
                </button>
                <button
                  type="button"
                  onClick={() => setRecordingMode('upload')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                    recordingMode === 'upload' ? 'bg-mwasalatInk-500 text-white' : 'bg-white text-[#475569] border border-[#E2E8F0]'
                  }`}
                >
                  {t('addCourse.recording.uploadVideo')}
                </button>
              </div>

              {recordingMode === 'link' ? (
                <>
                  <label className="block text-sm font-medium text-[#1E293B] mb-1.5">{t('addCourse.recording.linkLabel')}</label>
                  <input
                    dir="ltr"
                    className={`${inputClass} text-start`}
                    placeholder={t('addCourse.recording.linkPlaceholder')}
                    {...register('recordingLink', { required: recordingMode === 'link' && selectedTypes.includes('recording') ? t('addCourse.recording.linkRequired') : false })}
                  />
                  {errors.recordingLink && <p className="text-xs text-[#C22033] mt-1">{errors.recordingLink.message}</p>}
                </>
              ) : (
                <>
                  <label className="block text-sm font-medium text-[#1E293B] mb-1.5">{t('addCourse.recording.uploadVideo')}</label>
                  <input
                    type="file"
                    accept="video/mp4,video/webm,video/quicktime"
                    className={inputClass}
                    {...register('videoFile', { required: recordingMode === 'upload' && selectedTypes.includes('recording') ? t('addCourse.recording.videoRequired') : false })}
                  />
                  {errors.videoFile && <p className="text-xs text-[#C22033] mt-1">{errors.videoFile.message}</p>}
                  {videoFile?.[0] && <p className="text-xs text-mwasalatInk-500 mt-1">{videoFile[0].name}</p>}
                  <p className="text-xs text-[#94A3B8] mt-1.5">
                    {t('addCourse.recording.videoHint')}
                  </p>
                </>
              )}
            </div>
          )}

          {selectedTypes.includes('live') && (
            <div className="p-4 rounded-xl bg-[#F8F9FB] border border-[#E2E8F0] space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#1E293B] mb-1.5">{t('addCourse.dateTimeLabel')}</label>
                <input
                  type="datetime-local"
                  dir="ltr"
                  className={`${inputClass} text-start`}
                  {...register('liveScheduledAt', { required: selectedTypes.includes('live') ? t('addCourse.errors.dateTimeRequired') : false })}
                />
                {errors.liveScheduledAt && <p className="text-xs text-[#C22033] mt-1">{errors.liveScheduledAt.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-[#1E293B] mb-1.5">{t('addCourse.live.meetingLinkLabel')}</label>
                <div className="flex gap-2">
                  <input
                    dir="ltr"
                    readOnly={Boolean(zoomMeeting)}
                    className={`${inputClass} text-start flex-1 ${zoomMeeting ? 'bg-[#F1F5F9] text-[#475569]' : ''}`}
                    placeholder={t('addCourse.live.meetingLinkPlaceholder')}
                    {...register('liveMeetingLink', { required: selectedTypes.includes('live') ? t('addCourse.live.meetingLinkRequired') : false })}
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
                {errors.liveMeetingLink && <p className="text-xs text-[#C22033] mt-1">{errors.liveMeetingLink.message}</p>}
                {!liveScheduledAt && !zoomMeeting && <p className="text-[11px] text-[#94A3B8] mt-1">{t('addCourse.live.setDateTimeFirstHint')}</p>}
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

          {selectedTypes.includes('ilt') && (
            <div className="p-4 rounded-xl bg-[#F8F9FB] border border-[#E2E8F0] space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#1E293B] mb-1.5">{t('addCourse.ilt.venueLabel')}</label>
                <input
                  className={inputClass}
                  placeholder={t('addCourse.ilt.venuePlaceholder')}
                  {...register('iltVenue', { required: selectedTypes.includes('ilt') ? t('addCourse.ilt.venueRequired') : false })}
                />
                {errors.iltVenue && <p className="text-xs text-[#C22033] mt-1">{errors.iltVenue.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-[#1E293B] mb-1.5">{t('addCourse.dateTimeLabel')}</label>
                <input
                  type="datetime-local"
                  dir="ltr"
                  className={`${inputClass} text-start`}
                  {...register('iltScheduledAt', { required: selectedTypes.includes('ilt') ? t('addCourse.errors.dateTimeRequired') : false })}
                />
                {errors.iltScheduledAt && <p className="text-xs text-[#C22033] mt-1">{errors.iltScheduledAt.message}</p>}
              </div>
              <p className="text-xs text-[#94A3B8]">{t('addCourse.ilt.qrHint')}</p>
            </div>
          )}

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[#1E293B] mb-1.5">{t('addCourse.durationLabel')}</label>
              <input className={inputClass} placeholder={t('addCourse.durationPlaceholder')} {...register('duration')} />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#1E293B] mb-1.5">{t('addCourse.priceLabel')}</label>
              <input type="number" step="0.01" dir="ltr" className={`${inputClass} text-start`} placeholder="0.00" {...register('price', { valueAsNumber: true })} />
            </div>
          </div>

          {(selectedTypes.includes('live') || selectedTypes.includes('ilt')) && (
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
            <label className="block text-sm font-medium text-[#1E293B] mb-1.5">{t('addCourse.expiryDateLabel')}</label>
            <input type="date" dir="ltr" className={`${inputClass} text-start`} {...register('expiryDate')} />
            <p className="text-xs text-[#94A3B8] mt-1">{t('addCourse.expiryDateHint')}</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-[#1E293B] mb-1.5">{t('addCourse.certificateValidityLabel')}</label>
            <input
              type="number"
              min="1"
              step="1"
              dir="ltr"
              className={`${inputClass} text-start`}
              placeholder={t('addCourse.certificateValidityPlaceholder')}
              {...register('certificateValidityMonths', { min: { value: 1, message: t('addCourse.certificateValidityInvalid') } })}
            />
            {errors.certificateValidityMonths && <p className="text-xs text-[#C22033] mt-1">{errors.certificateValidityMonths.message}</p>}
            <p className="text-xs text-[#94A3B8] mt-1">{t('addCourse.certificateValidityHint')}</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-[#1E293B] mb-1.5">{t('addCourse.prerequisiteLabel')}</label>
            <select className={inputClass} {...register('prerequisiteProgram')}>
              <option value="">{t('addCourse.prerequisiteNone')}</option>
              {myCourses.map((c) => (
                <option key={c._id} value={c._id}>{getLocalizedProgramField(c, 'title', i18n.language)}</option>
              ))}
            </select>
            <p className="text-xs text-[#94A3B8] mt-1">{t('addCourse.prerequisiteHint')}</p>
          </div>

          <button
            type="submit"
            disabled={isPending}
            className="w-full flex items-center justify-center gap-2 bg-mwasalatInk-500 hover:bg-mwasalatInk-400 disabled:opacity-60 text-white font-semibold px-6 py-3 rounded-xl transition-colors text-sm"
          >
            {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <BookPlus className="w-4 h-4" />}
            {isPending ? t('addCourse.submitting') : t('addCourse.submitCta')}
          </button>
        </form>
      </main>
    </div>
  );
}
