import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate, Link } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { ArrowLeft, Loader2, BookPlus, Sparkles, FileText, Video, Radio, MapPin, HelpCircle, ClipboardCheck, CheckCircle2, ArrowRight, X, Users, Globe, Building2, Layers } from 'lucide-react';
import { mwasalatProgramService } from '../../services/mwasalatProgram.service.js';
import { mwasalatCategoryService } from '../../services/mwasalatCategory.service.js';
import { mwasalatDepartmentService } from '../../services/mwasalatDepartment.service.js';
import { mwasalatGroupService } from '../../services/mwasalatGroup.service.js';
import MwasalatQuizBuilder from '../../components/mwasalat/MwasalatQuizBuilder.jsx';
import MwasalatAssignmentBuilder from '../../components/mwasalat/MwasalatAssignmentBuilder.jsx';
import MwasalatModuleBuilder from '../../components/mwasalat/MwasalatModuleBuilder.jsx';
import { getLocalizedProgramField } from '../../utils/mwasalatLocalize.js';

const CONTENT_TYPES = [
  { value: 'modular', labelKey: 'addCourse.contentTypes.modular.label', hintKey: 'addCourse.contentTypes.modular.hint', icon: Layers },
  { value: 'pdf', labelKey: 'addCourse.contentTypes.pdf.label', hintKey: 'addCourse.contentTypes.pdf.hint', icon: FileText },
  { value: 'recording', labelKey: 'addCourse.contentTypes.recording.label', hintKey: 'addCourse.contentTypes.recording.hint', icon: Video },
  { value: 'live', labelKey: 'addCourse.contentTypes.live.label', hintKey: 'addCourse.contentTypes.live.hint', icon: Radio },
  { value: 'ilt', labelKey: 'addCourse.contentTypes.ilt.label', hintKey: 'addCourse.contentTypes.ilt.hint', icon: MapPin },
];

const AUDIENCE_OPTIONS = [
  { value: 'all', labelKey: 'addCourse.audience.all.label', hintKey: 'addCourse.audience.all.hint', icon: Users },
  { value: 'internal_only', labelKey: 'addCourse.audience.internal_only.label', hintKey: 'addCourse.audience.internal_only.hint', icon: Building2 },
  { value: 'external_only', labelKey: 'addCourse.audience.external_only.label', hintKey: 'addCourse.audience.external_only.hint', icon: Globe },
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
  const [categories, setCategories] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [groups, setGroups] = useState([]);
  const [audience, setAudience] = useState('all');
  const [selectedDepartments, setSelectedDepartments] = useState([]);
  const [selectedGroups, setSelectedGroups] = useState([]);
  const title = watch('title');
  const pdfFile = watch('pdfFile');
  const videoFile = watch('videoFile');
  const liveScheduledAt = watch('liveScheduledAt');
  const selectedCategoryName = watch('category');
  const subCategoryOptions = categories.find((c) => c.name === selectedCategoryName)?.subCategories ?? [];

  useEffect(() => {
    mwasalatProgramService.listMine()
      .then((courses) => setMyCourses(courses.filter((c) => c.status === 'active')))
      .catch(() => {});
    mwasalatCategoryService.listActive().then(setCategories).catch(() => {});
    mwasalatDepartmentService.listActive().then(setDepartments).catch(() => {});
    mwasalatGroupService.listActive().then(setGroups).catch(() => {});
  }, []);

  // 'modular' (the new module/lesson "super course" builder) is mutually
  // exclusive with the legacy pdf/recording/live/ilt types — a course is
  // either module-based or the old flat-content shape, never both.
  const toggleType = (value) => {
    setSelectedTypes((prev) => {
      if (value === 'modular') return prev.includes('modular') ? [] : ['modular'];
      const withoutModular = prev.filter((v) => v !== 'modular');
      return withoutModular.includes(value) ? withoutModular.filter((v) => v !== value) : [...withoutModular, value];
    });
  };

  const toggleDepartment = (id) => {
    setSelectedDepartments((prev) =>
      prev.includes(id) ? prev.filter((v) => v !== id) : [...prev, id]
    );
  };

  const toggleGroup = (id) => {
    setSelectedGroups((prev) =>
      prev.includes(id) ? prev.filter((v) => v !== id) : [...prev, id]
    );
  };

  const handleAudienceChange = (value) => {
    setAudience(value);
    // External-only courses have no department/cohort concept — drop any
    // selection made before switching away from an audience that included
    // internal learners.
    if (value === 'external_only') {
      setSelectedDepartments([]);
      setSelectedGroups([]);
    }
  };

  const { mutate: autofill, isPending: isAutofilling } = useMutation({
    mutationFn: mwasalatProgramService.aiAutofill,
    onSuccess: (suggestion) => {
      // The AI suggests a category by name, which may not exactly match a taxonomy
      // entry's casing/spelling — fall back to the closest case-insensitive match
      // rather than setting a value with no corresponding <option>.
      const matched = categories.find((c) => c.name.toLowerCase() === suggestion.category?.toLowerCase());
      setValue('category', matched?.name ?? '', { shouldValidate: true });
      // Same fallback as category: once a category has a managed subcategory list,
      // the field becomes a <select> that can only accept one of its options.
      const subOptions = matched?.subCategories ?? [];
      const matchedSub = subOptions.find((s) => s.name.toLowerCase() === suggestion.subCategory?.toLowerCase());
      setValue('subCategory', matchedSub?.name ?? (subOptions.length ? '' : suggestion.subCategory));
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
    formData.append('categoryAr', categories.find((c) => c.name === data.category)?.nameAr ?? '');
    formData.append('subCategory', data.subCategory ?? '');
    formData.append('subCategoryAr', data.subCategoryAr ?? '');
    formData.append('description', data.description ?? '');
    formData.append('descriptionAr', data.descriptionAr ?? '');
    formData.append('duration', data.duration ?? '');
    formData.append('durationAr', data.durationAr ?? '');
    formData.append('price', audience === 'internal_only' ? 0 : (data.price ?? 0));
    formData.append('expiryDate', data.expiryDate ?? '');
    formData.append('certificateValidityMonths', data.certificateValidityMonths ?? '');
    formData.append('autoRenewCertificate', data.autoRenewCertificate ? 'true' : 'false');
    formData.append('prerequisiteProgram', data.prerequisiteProgram ?? '');
    formData.append('requiresApproval', data.requiresApproval ? 'true' : 'false');
    formData.append('contentTypes', JSON.stringify(selectedTypes));
    formData.append('audience', audience);
    formData.append('departments', JSON.stringify(audience === 'external_only' ? [] : selectedDepartments));
    formData.append('targetGroups', JSON.stringify(audience === 'external_only' ? [] : selectedGroups));
    formData.append('expectedCompletionDays', data.expectedCompletionDays ?? '');
    formData.append('isMandatory', audience !== 'external_only' && data.isMandatory ? 'true' : 'false');

    if (selectedTypes.includes('pdf') && data.pdfFile?.length > 0) {
      Array.from(data.pdfFile).forEach((file) => formData.append('pdfFile', file));
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
          {createdProgram.contentTypes?.includes('modular') ? (
            <>
              <div className="card p-5 mb-5 flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-mwasalatInk-100 flex items-center justify-center text-mwasalatInk-500 flex-shrink-0">
                  <Layers className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-[#1E293B]">{t('addCourse.buildModulesTitle')}</p>
                  <p className="text-xs text-[#94A3B8] mt-0.5">{t('addCourse.buildModulesBody')}</p>
                </div>
              </div>

              <div className="card overflow-hidden">
                <MwasalatModuleBuilder programId={createdProgram._id} />
              </div>
            </>
          ) : (
            <>
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

              <div className="card overflow-hidden mb-5">
                <MwasalatQuizBuilder
                  programId={createdProgram._id}
                  onSaved={() => navigate(`/instructor/programs/${createdProgram._id}`)}
                />
              </div>

              <div className="card p-5 mb-5 flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-mwasalatInk-100 flex items-center justify-center text-mwasalatInk-500 flex-shrink-0">
                  <ClipboardCheck className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-[#1E293B]">{t('addCourse.addAssignmentTitle')}</p>
                  <p className="text-xs text-[#94A3B8] mt-0.5">
                    {t('addCourse.addAssignmentBody')}
                  </p>
                </div>
              </div>

              <div className="card overflow-hidden">
                <MwasalatAssignmentBuilder programId={createdProgram._id} />
              </div>
            </>
          )}

          <button
            type="button"
            onClick={() => navigate(`/instructor/programs/${createdProgram._id}`)}
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
        <Link to="/instructor/dashboard" className="w-9 h-9 rounded-xl border border-[#E2E8F0] flex items-center justify-center text-[#475569] hover:bg-[#F1F5F9] transition-colors">
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
              <select className={inputClass} {...register('category', { required: t('addCourse.errors.categoryRequired') })}>
                <option value="">{t('addCourse.categoryPlaceholder')}</option>
                {categories.map((c) => (
                  <option key={c._id} value={c.name}>{c.name}</option>
                ))}
              </select>
              {errors.category && <p className="text-xs text-[#C22033] mt-1">{errors.category.message}</p>}
              <p className="text-xs text-[#94A3B8] mt-1">{t('addCourse.categoryManagedHint')}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-[#1E293B] mb-1.5">{t('addCourse.subCategoryLabel')}</label>
              {subCategoryOptions.length > 0 ? (
                <select className={inputClass} {...register('subCategory')}>
                  <option value="">{t('addCourse.subCategoryPlaceholder')}</option>
                  {subCategoryOptions.map((s) => (
                    <option key={s.name} value={s.name}>{s.name}</option>
                  ))}
                </select>
              ) : (
                <input className={inputClass} placeholder={t('addCourse.subCategoryPlaceholder')} {...register('subCategory')} />
              )}
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

          {/* Audience — who this course is for. Drives whether price and the
              department picker below are shown; locked after creation. */}
          <div>
            <label className="block text-sm font-medium text-[#1E293B] mb-2">{t('addCourse.audienceLabel')}</label>
            <div className="grid sm:grid-cols-3 gap-3">
              {AUDIENCE_OPTIONS.map(({ value, labelKey, hintKey, icon: Icon }) => {
                const active = audience === value;
                return (
                  <button
                    key={value}
                    type="button"
                    onClick={() => handleAudienceChange(value)}
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
          </div>

          {audience !== 'external_only' && (
            <div>
              <label className="block text-sm font-medium text-[#1E293B] mb-2">{t('addCourse.departmentsLabel')}</label>
              {departments.length === 0 ? (
                <p className="text-xs text-[#94A3B8]">{t('addCourse.departmentsEmpty')}</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedDepartments([])}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors border ${
                      selectedDepartments.length === 0 ? 'border-mwasalatInk-500 bg-mwasalatInk-100 text-mwasalatInk-500' : 'border-[#E2E8F0] text-[#475569] hover:border-mwasalatInk-300'
                    }`}
                  >
                    {t('addCourse.departmentsAllOption')}
                  </button>
                  {departments.map((d) => {
                    const active = selectedDepartments.includes(d._id);
                    return (
                      <button
                        key={d._id}
                        type="button"
                        onClick={() => toggleDepartment(d._id)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors border ${
                          active ? 'border-mwasalatInk-500 bg-mwasalatInk-100 text-mwasalatInk-500' : 'border-[#E2E8F0] text-[#475569] hover:border-mwasalatInk-300'
                        }`}
                      >
                        {d.name}
                      </button>
                    );
                  })}
                </div>
              )}
              <p className="text-xs text-[#94A3B8] mt-1.5">{t('addCourse.departmentsHint')}</p>
            </div>
          )}

          {audience !== 'external_only' && (
            <div>
              <label className="block text-sm font-medium text-[#1E293B] mb-2">{t('addCourse.targetGroupsLabel')}</label>
              {groups.length === 0 ? (
                <p className="text-xs text-[#94A3B8]">{t('addCourse.targetGroupsEmpty')}</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {groups.map((g) => {
                    const active = selectedGroups.includes(g._id);
                    return (
                      <button
                        key={g._id}
                        type="button"
                        onClick={() => toggleGroup(g._id)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors border ${
                          active ? 'border-mwasalatInk-500 bg-mwasalatInk-100 text-mwasalatInk-500' : 'border-[#E2E8F0] text-[#475569] hover:border-mwasalatInk-300'
                        }`}
                      >
                        {g.name}
                      </button>
                    );
                  })}
                </div>
              )}
              <p className="text-xs text-[#94A3B8] mt-1.5">{t('addCourse.targetGroupsHint')}</p>
            </div>
          )}

          {selectedTypes.includes('pdf') && (
            <div className="p-4 rounded-xl bg-[#F8F9FB] border border-[#E2E8F0]">
              <label className="block text-sm font-medium text-[#1E293B] mb-1.5">{t('addCourse.pdf.uploadLabel')}</label>
              <input
                type="file"
                accept="application/pdf"
                multiple
                className={inputClass}
                {...register('pdfFile', { required: selectedTypes.includes('pdf') ? t('addCourse.pdf.required') : false })}
              />
              {errors.pdfFile && <p className="text-xs text-[#C22033] mt-1">{errors.pdfFile.message}</p>}
              {pdfFile?.length > 0 && (
                <ul className="text-xs text-mwasalatInk-500 mt-1 space-y-0.5">
                  {Array.from(pdfFile).map((f) => <li key={f.name}>{f.name}</li>)}
                </ul>
              )}
              <p className="text-xs text-[#94A3B8] mt-1">{t('addCourse.pdf.multipleHint')}</p>

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
            {audience !== 'internal_only' && (
              <div>
                <label className="block text-sm font-medium text-[#1E293B] mb-1.5">{t('addCourse.priceLabel')}</label>
                <input type="number" step="0.01" dir="ltr" className={`${inputClass} text-start`} placeholder="0.00" {...register('price', { valueAsNumber: true })} />
                <p className="text-xs text-[#94A3B8] mt-1">{t('addCourse.priceHint')}</p>
              </div>
            )}
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

          {watch('certificateValidityMonths') && (
            <label className="flex items-start gap-2.5 p-3.5 rounded-xl border border-[#E2E8F0] hover:border-mwasalatInk-300 transition-colors cursor-pointer">
              <input
                type="checkbox"
                className="mt-0.5 w-4 h-4 rounded border-[#E2E8F0] text-mwasalatInk-500 focus:ring-mwasalatInk-500/20"
                {...register('autoRenewCertificate')}
              />
              <span>
                <span className="block text-sm font-medium text-[#1E293B]">{t('addCourse.autoRenewLabel')}</span>
                <span className="block text-xs text-[#94A3B8] mt-0.5">{t('addCourse.autoRenewHint')}</span>
              </span>
            </label>
          )}

          <div>
            <label className="block text-sm font-medium text-[#1E293B] mb-1.5">{t('addCourse.expectedCompletionDaysLabel')}</label>
            <input
              type="number"
              min="1"
              step="1"
              dir="ltr"
              className={`${inputClass} text-start`}
              placeholder={t('addCourse.expectedCompletionDaysPlaceholder')}
              {...register('expectedCompletionDays', { min: { value: 1, message: t('addCourse.expectedCompletionDaysInvalid') } })}
            />
            {errors.expectedCompletionDays && <p className="text-xs text-[#C22033] mt-1">{errors.expectedCompletionDays.message}</p>}
            <p className="text-xs text-[#94A3B8] mt-1">{t('addCourse.expectedCompletionDaysHint')}</p>
          </div>

          {audience !== 'external_only' && watch('expectedCompletionDays') && (
            <label className="flex items-start gap-2.5 p-3.5 rounded-xl border border-[#E2E8F0] hover:border-mwasalatInk-300 transition-colors cursor-pointer">
              <input
                type="checkbox"
                className="mt-0.5 w-4 h-4 rounded border-[#E2E8F0] text-mwasalatInk-500 focus:ring-mwasalatInk-500/20"
                {...register('isMandatory')}
              />
              <span>
                <span className="block text-sm font-medium text-[#1E293B]">{t('addCourse.isMandatoryLabel')}</span>
                <span className="block text-xs text-[#94A3B8] mt-0.5">{t('addCourse.isMandatoryHint')}</span>
              </span>
            </label>
          )}

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

          <label className="flex items-start gap-2.5 p-3.5 rounded-xl border border-[#E2E8F0] hover:border-mwasalatInk-300 transition-colors cursor-pointer">
            <input
              type="checkbox"
              className="mt-0.5 w-4 h-4 rounded border-[#E2E8F0] text-mwasalatInk-500 focus:ring-mwasalatInk-500/20"
              {...register('requiresApproval')}
            />
            <span>
              <span className="block text-sm font-medium text-[#1E293B]">{t('addCourse.requiresApprovalLabel')}</span>
              <span className="block text-xs text-[#94A3B8] mt-0.5">{t('addCourse.requiresApprovalHint')}</span>
            </span>
          </label>

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
