import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { ArrowLeft, Loader2, Save, Trash2, Video, X, FileText, Users, Globe, Building2, Clock } from 'lucide-react';
import { mwasalatProgramService } from '../../services/mwasalatProgram.service.js';
import { mwasalatCategoryService } from '../../services/mwasalatCategory.service.js';
import { mwasalatDepartmentService } from '../../services/mwasalatDepartment.service.js';
import { mwasalatGroupService } from '../../services/mwasalatGroup.service.js';
import { getLocalizedProgramField } from '../../utils/mwasalatLocalize.js';

const inputClass = 'w-full px-3.5 py-2.5 rounded-xl border border-[#E2E8F0] text-sm bg-white text-[#1E293B] placeholder:text-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-mwasalatInk-500/20 hover:border-mwasalatInk-300 transition-colors';

// AddCoursePage writes these fields from a raw <input type="datetime-local">/"date">
// value, which the browser interprets in its own local timezone (no offset info).
// Reading them back must use the same local getters — going through toISOString()
// here would shift to UTC first, silently changing the displayed time by the
// browser's UTC offset every time an existing scheduled class is reopened for edit.
const pad2 = (n) => String(n).padStart(2, '0');
const toDateTimeLocal = (value) => {
  if (!value) return '';
  const d = new Date(value);
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}T${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
};
const toDateLocal = (value) => {
  if (!value) return '';
  const d = new Date(value);
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
};

const AUDIENCE_META = {
  all: { labelKey: 'addCourse.audience.all.label', icon: Users },
  internal_only: { labelKey: 'addCourse.audience.internal_only.label', icon: Building2 },
  external_only: { labelKey: 'addCourse.audience.external_only.label', icon: Globe },
};

export default function MwasalatEditCoursePage() {
  const { t, i18n } = useTranslation('mwasalatApp');
  const { id } = useParams();
  const navigate = useNavigate();
  const [program, setProgram] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [zoomMeeting, setZoomMeeting] = useState(null);
  const [myCourses, setMyCourses] = useState([]);
  const [categories, setCategories] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [selectedDepartments, setSelectedDepartments] = useState([]);
  const [groups, setGroups] = useState([]);
  const [selectedGroups, setSelectedGroups] = useState([]);
  const [removedDocIds, setRemovedDocIds] = useState([]);
  const { register, handleSubmit, reset, watch, setValue, formState: { errors } } = useForm();
  const title = watch('title');
  const liveScheduledAt = watch('liveScheduledAt');
  const selectedCategoryName = watch('category');

  useEffect(() => {
    mwasalatProgramService.getById(id).then((p) => {
      setProgram(p);
      setSelectedDepartments((p.departments ?? []).map((d) => d?._id ?? d));
      setSelectedGroups((p.targetGroups ?? []).map((g) => g?._id ?? g));
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
        autoRenewCertificate: p.autoRenewCertificate ?? false,
        recordingLink: p.recordingLink ?? '',
        liveScheduledAt: toDateTimeLocal(p.liveScheduledAt),
        liveMeetingLink: p.liveMeetingLink ?? '',
        iltVenue: p.iltVenue ?? '',
        iltScheduledAt: toDateTimeLocal(p.iltScheduledAt),
        capacity: p.capacity ?? '',
        prerequisiteProgram: p.prerequisiteProgram?._id ?? '',
        requiresApproval: p.requiresApproval ?? false,
        enrollmentClosed: p.enrollmentClosed ?? false,
        expectedCompletionDays: p.expectedCompletionDays ?? '',
        isMandatory: p.isMandatory ?? false,
      });
    }).finally(() => setIsLoading(false));
    mwasalatProgramService.listMine()
      .then((courses) => setMyCourses(courses.filter((c) => c.status === 'active' && c._id !== id)))
      .catch(() => {});
    mwasalatCategoryService.listActive().then(setCategories).catch(() => {});
    mwasalatDepartmentService.listActive().then(setDepartments).catch(() => {});
    mwasalatGroupService.listActive().then(setGroups).catch(() => {});
  }, [id, reset]);

  const toggleDepartment = (deptId) => {
    setSelectedDepartments((prev) =>
      prev.includes(deptId) ? prev.filter((v) => v !== deptId) : [...prev, deptId]
    );
  };

  const toggleGroup = (groupId) => {
    setSelectedGroups((prev) =>
      prev.includes(groupId) ? prev.filter((v) => v !== groupId) : [...prev, groupId]
    );
  };

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
      navigate(`/instructor/programs/${id}`);
    },
    onError: (err) => toast.error(err.response?.data?.message || t('editCourse.toastUpdateFailed')),
  });

  const { mutate: deleteCourse, isPending: isDeleting } = useMutation({
    mutationFn: () => mwasalatProgramService.remove(id),
    onSuccess: () => {
      toast.success(t('editCourse.toastScheduled'));
      navigate('/instructor/dashboard');
    },
    onError: (err) => toast.error(err.response?.data?.message || t('editCourse.toastScheduleFailed')),
  });

  const { mutate: cancelScheduledDeletion, isPending: isCancelling } = useMutation({
    mutationFn: () => mwasalatProgramService.cancelScheduledDeletion(id),
    onSuccess: (updated) => {
      setProgram((prev) => ({ ...prev, deletionScheduledAt: null, enrollmentClosed: updated?.enrollmentClosed ?? prev?.enrollmentClosed }));
      toast.success(t('editCourse.toastCancelled'));
    },
    onError: (err) => toast.error(err.response?.data?.message || t('editCourse.toastCancelFailed')),
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F8F9FB] flex items-center justify-center text-[#94A3B8]">
        <Loader2 className="w-5 h-5 animate-spin me-2" /> {t('editCourse.loading')}
      </div>
    );
  }

  // A category deactivated after this course was created might no longer be in
  // `categories` — keep it selectable so saving the form doesn't silently blank it.
  const categoryOptions = program?.category && !categories.some((c) => c.name === program.category)
    ? [{ _id: 'current', name: program.category }, ...categories]
    : categories;
  const subCategoryOptions = categoryOptions.find((c) => c.name === selectedCategoryName)?.subCategories ?? [];

  return (
    <div className="min-h-screen bg-[#F8F9FB]">
      <header className="h-16 bg-white border-b border-[#E2E8F0] flex items-center justify-between px-8">
        <div className="flex items-center gap-4">
          <Link to={`/instructor/programs/${id}`} className="w-9 h-9 rounded-xl border border-[#E2E8F0] flex items-center justify-center text-[#475569] hover:bg-[#F1F5F9] transition-colors">
            <ArrowLeft className="w-4 h-4 rtl:rotate-180" />
          </Link>
          <div>
            <p className="text-sm font-semibold text-[#1E293B]">{t('editCourse.headerTitle')}</p>
            <p className="text-xs text-[#94A3B8]">{getLocalizedProgramField(program, 'title', i18n.language)}</p>
          </div>
        </div>
        {program?.deletionScheduledAt ? (
          <button
            type="button"
            onClick={() => cancelScheduledDeletion()}
            disabled={isCancelling}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-mwasalatRed-600 hover:text-mwasalatRed-700 disabled:opacity-60 transition-colors"
          >
            {isCancelling ? <Loader2 className="w-4 h-4 animate-spin" /> : <X className="w-4 h-4" />}
            {t('editCourse.cancelDeletionBtn')}
          </button>
        ) : (
          <button
            type="button"
            onClick={() => setShowDeleteConfirm(true)}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-mwasalatRed-600 hover:text-mwasalatRed-700 transition-colors"
          >
            <Trash2 className="w-4 h-4" /> {t('editCourse.deleteCourseBtn')}
          </button>
        )}
      </header>

      <main className="p-8 max-w-2xl mx-auto">
        {program?.deletionScheduledAt && (
          <div className="mb-5 flex items-start gap-2.5 rounded-xl border border-mwasalatRed-300 bg-mwasalatRed-100 px-4 py-3">
            <Clock className="w-4 h-4 text-mwasalatRed-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-mwasalatRed-700">
              {t('editCourse.scheduledBanner', { date: new Date(program.deletionScheduledAt).toLocaleDateString(i18n.language) })}
            </p>
          </div>
        )}
        <form
          onSubmit={handleSubmit((data) => {
            // Only overwrite categoryAr when the category actually changed to a taxonomy
            // entry we have data for — otherwise omit it so an unrelated edit doesn't
            // wipe out the Arabic name (e.g. the deactivated-category fallback option
            // below carries no nameAr of its own).
            const selectedCategory = categoryOptions.find((c) => c.name === data.category);
            const payload = {
              ...data,
              ...(data.category !== program.category && selectedCategory ? { categoryAr: selectedCategory.nameAr ?? '' } : {}),
              ...(zoomMeeting ? { liveMeetingProvider: 'zoom', liveMeetingStartUrl: zoomMeeting.startUrl } : {}),
              ...(removedDocIds.length ? { removeDocumentIds: removedDocIds } : {}),
              ...(program.audience !== 'external_only'
                ? { departments: selectedDepartments, targetGroups: selectedGroups }
                : { isMandatory: false }),
            };
            mutate(payload);
          })}
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
              <select className={inputClass} {...register('category', { required: t('editCourse.errors.categoryRequired') })}>
                <option value="">{t('addCourse.categoryPlaceholder')}</option>
                {categoryOptions.map((c) => (
                  <option key={c._id} value={c.name}>{c.name}</option>
                ))}
              </select>
              {errors.category && <p className="text-xs text-[#C22033] mt-1">{errors.category.message}</p>}
              <p className="text-xs text-[#94A3B8] mt-1">{t('addCourse.categoryManagedHint')}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-[#1E293B] mb-1.5">{t('editCourse.subCategoryLabel')}</label>
              {subCategoryOptions.length > 0 ? (
                <select className={inputClass} {...register('subCategory')}>
                  <option value="">{t('addCourse.subCategoryPlaceholder')}</option>
                  {subCategoryOptions.map((s) => (
                    <option key={s.name} value={s.name}>{s.name}</option>
                  ))}
                </select>
              ) : (
                <input className={inputClass} {...register('subCategory')} />
              )}
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

          {/* Audience is locked after creation — same treatment as content types above. */}
          {program?.audience && (
            <>
              <div>
                <label className="block text-sm font-medium text-[#1E293B] mb-2">{t('addCourse.audienceLabel')}</label>
                {(() => {
                  const meta = AUDIENCE_META[program.audience];
                  const Icon = meta?.icon ?? Users;
                  return (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-mwasalatInk-100 text-mwasalatInk-500">
                      <Icon className="w-3.5 h-3.5" /> {meta ? t(meta.labelKey) : program.audience}
                    </span>
                  );
                })()}
              </div>
              <p className="text-xs text-[#94A3B8] -mt-3">{t('editCourse.audienceLockedNote')}</p>
            </>
          )}

          {program?.audience !== 'external_only' && (
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

          {program?.audience !== 'external_only' && (
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

          {program?.contentTypes?.includes('pdf') && (
            <div className="p-4 rounded-xl bg-[#F8F9FB] border border-[#E2E8F0] space-y-4">
              {program.documents?.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-[#1E293B] mb-1.5">{t('editCourse.documentsLabel')}</label>
                  <div className="space-y-1.5">
                    {program.documents.map((doc) => {
                      const isRemoved = removedDocIds.includes(doc._id);
                      return (
                        <div
                          key={doc._id}
                          className={`flex items-center gap-2.5 px-3 py-2 rounded-lg border text-sm ${isRemoved ? 'border-[#E2E8F0] bg-white opacity-50' : 'border-[#E2E8F0] bg-white'}`}
                        >
                          <FileText className="w-4 h-4 text-mwasalatInk-500 flex-shrink-0" />
                          <span className={`truncate flex-1 ${isRemoved ? 'line-through text-[#94A3B8]' : 'text-[#1E293B]'}`}>{doc.name}</span>
                          <button
                            type="button"
                            onClick={() => setRemovedDocIds((prev) => (
                              isRemoved ? prev.filter((id) => id !== doc._id) : [...prev, doc._id]
                            ))}
                            className={`text-xs font-semibold flex-shrink-0 ${isRemoved ? 'text-mwasalatInk-500' : 'text-mwasalatRed-600'}`}
                          >
                            {isRemoved ? t('common.undo') : t('common.remove')}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                  <p className="text-xs text-[#94A3B8] mt-1.5">{t('editCourse.documentsHint')}</p>
                </div>
              )}
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
            {program?.audience !== 'internal_only' && (
              <div>
                <label className="block text-sm font-medium text-[#1E293B] mb-1.5">{t('editCourse.priceLabel')}</label>
                <input type="number" step="0.01" dir="ltr" className={`${inputClass} text-start`} {...register('price', { valueAsNumber: true })} />
              </div>
            )}
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
            <label className="block text-sm font-medium text-[#1E293B] mb-1.5">{t('editCourse.expectedCompletionDaysLabel')}</label>
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

          {program?.audience !== 'external_only' && watch('expectedCompletionDays') && (
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
            <label className="block text-sm font-medium text-[#1E293B] mb-1.5">{t('editCourse.prerequisiteLabel')}</label>
            <select className={inputClass} {...register('prerequisiteProgram')}>
              <option value="">{t('editCourse.prerequisiteNone')}</option>
              {myCourses.map((c) => (
                <option key={c._id} value={c._id}>{getLocalizedProgramField(c, 'title', i18n.language)}</option>
              ))}
            </select>
            <p className="text-xs text-[#94A3B8] mt-1">{t('editCourse.prerequisiteHint')}</p>
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

          <label className="flex items-start gap-2.5 p-3.5 rounded-xl border border-[#E2E8F0] hover:border-mwasalatInk-300 transition-colors cursor-pointer">
            <input
              type="checkbox"
              className="mt-0.5 w-4 h-4 rounded border-[#E2E8F0] text-mwasalatInk-500 focus:ring-mwasalatInk-500/20"
              {...register('enrollmentClosed')}
            />
            <span>
              <span className="block text-sm font-medium text-[#1E293B]">{t('addCourse.enrollmentClosedLabel')}</span>
              <span className="block text-xs text-[#94A3B8] mt-0.5">{t('addCourse.enrollmentClosedHint')}</span>
            </span>
          </label>

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
