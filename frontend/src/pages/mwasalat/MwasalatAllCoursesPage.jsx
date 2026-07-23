import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { Star, CheckCircle2, Clock, ChevronRight, Award, BookOpen } from 'lucide-react';
import { mwasalatProgramService } from '../../services/mwasalatProgram.service.js';
import MwasalatLearnerLayout from '../../layouts/MwasalatLearnerLayout.jsx';
import MwasalatDataTable from '../../components/mwasalat/MwasalatDataTable.jsx';
import { themeForCategory } from '../../utils/mwasalatCategoryTheme.js';
import { stageProgress } from '../../utils/mwasalatProgress.js';
import { getLocalizedProgramField, localizeNumber } from '../../utils/mwasalatLocalize.js';

const STATUS_FILTERS = ['all', 'inProgress', 'completed', 'starred'];

export default function MwasalatAllCoursesPage() {
  const { t, i18n } = useTranslation('mwasalatApp');
  const [enrollments, setEnrollments] = useState([]);
  const [completion, setCompletion] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const dateLocale = i18n.language.startsWith('ar') ? 'ar-OM' : 'en-GB';

  useEffect(() => {
    mwasalatProgramService.listMyEnrollments().then(async (e) => {
      setEnrollments(e);
      const entries = await Promise.all(
        e.map(async (enr) => [enr.program?._id, await mwasalatProgramService.getCompletionStatus(enr.program?._id)])
      );
      setCompletion(Object.fromEntries(entries));
    }).finally(() => setIsLoading(false));
  }, []);

  const handleToggleStar = async (enrollment) => {
    const nextStarred = !enrollment.isStarred;
    setEnrollments((prev) => prev.map((en) => (en._id === enrollment._id ? { ...en, isStarred: nextStarred } : en)));
    try {
      await mwasalatProgramService.toggleStar(enrollment.program?._id);
    } catch (err) {
      setEnrollments((prev) => prev.map((en) => (en._id === enrollment._id ? { ...en, isStarred: !nextStarred } : en)));
      toast.error(err.response?.data?.message || t('learner.dashboard.starToggleFailed'));
    }
  };

  const rows = useMemo(() => enrollments.map((e) => {
    const c = completion[e.program?._id];
    return { ...e, isCompleted: Boolean(c?.certificateIssued), progress: stageProgress(c) };
  }), [enrollments, completion]);

  const filteredRows = rows.filter((r) => {
    if (statusFilter === 'inProgress') return !r.isCompleted;
    if (statusFilter === 'completed') return r.isCompleted;
    if (statusFilter === 'starred') return r.isStarred;
    return true;
  });

  const COLUMNS = [
    {
      key: 'star',
      label: '',
      className: 'w-12',
      render: (r) => (
        <button
          type="button"
          onClick={(ev) => { ev.preventDefault(); ev.stopPropagation(); handleToggleStar(r); }}
          title={t(r.isStarred ? 'learner.dashboard.unstarCourse' : 'learner.dashboard.starCourse')}
          className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors mx-auto ${
            r.isStarred ? 'text-[#F59E0B]' : 'text-[#CBD5E1] hover:text-[#F59E0B] hover:bg-[#FEF3C7]'
          }`}
        >
          <Star className={`w-4 h-4 ${r.isStarred ? 'fill-current' : ''}`} />
        </button>
      ),
    },
    {
      key: 'course',
      label: t('allCoursesPage.columns.course'),
      className: 'min-w-[220px] max-w-[340px]',
      render: (r) => {
        const theme = themeForCategory(r.program?.category);
        return (
          <Link to={`/mwasalat/learner/programs/${r.program?._id}`} className="group flex items-center gap-3 min-w-0">
            <span className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${theme.bg} ${theme.text}`}>
              <BookOpen className="w-4 h-4" />
            </span>
            <span className="min-w-0">
              <p className="font-medium text-[#1E293B] group-hover:text-mwasalatInk-500 transition-colors truncate">
                {getLocalizedProgramField(r.program, 'title', i18n.language)}
              </p>
              <span className={`inline-flex items-center mt-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium capitalize ${theme.bg} ${theme.text}`}>
                {getLocalizedProgramField(r.program, 'category', i18n.language) || t('programCard.generalCategory')}
              </span>
            </span>
          </Link>
        );
      },
    },
    {
      key: 'status',
      label: t('allCoursesPage.columns.status'),
      className: 'w-40',
      render: (r) => (
        r.isCompleted ? (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-[#DCFCE7] text-[#16A34A] whitespace-nowrap">
            <CheckCircle2 className="w-3.5 h-3.5" /> {t('allCoursesPage.statusCompleted')}
          </span>
        ) : (
          <span className="flex items-center gap-2 text-xs text-[#475569] whitespace-nowrap">
            <Clock className="w-3.5 h-3.5 text-[#94A3B8] flex-shrink-0" />
            <span className="w-16 h-1.5 rounded-full bg-[#F1F5F9] overflow-hidden flex-shrink-0">
              <span className="block h-full rounded-full bg-mwasalatInk-400" style={{ width: `${r.progress}%` }} />
            </span>
            {localizeNumber(r.progress, i18n.language)}%
          </span>
        )
      ),
    },
    {
      key: 'purchasedAt',
      label: t('allCoursesPage.columns.enrolled'),
      className: 'w-32',
      render: (r) => (
        <span className="text-[#94A3B8] whitespace-nowrap" dir="ltr">
          {localizeNumber(new Date(r.purchasedAt).toLocaleDateString(dateLocale, { day: 'numeric', month: 'short', year: 'numeric' }), i18n.language)}
        </span>
      ),
    },
    {
      key: 'actions',
      label: '',
      className: 'w-24',
      render: (r) => (
        <div className="flex items-center gap-1.5 justify-end">
          {r.isCompleted && (
            <Link
              to={`/mwasalat/learner/programs/${r.program?._id}/certificate`}
              title={t('allCoursesPage.viewCertificate')}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-mwasalatInk-500 hover:bg-mwasalatInk-100 transition-colors flex-shrink-0"
            >
              <Award className="w-4 h-4" />
            </Link>
          )}
          <Link
            to={`/mwasalat/learner/programs/${r.program?._id}`}
            title={t('common.view')}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-[#475569] hover:bg-[#F1F5F9] transition-colors flex-shrink-0"
          >
            <ChevronRight className="w-4 h-4 rtl:rotate-180" />
          </Link>
        </div>
      ),
    },
  ];

  const filterPills = (
    <div className="flex items-center gap-1.5">
      {STATUS_FILTERS.map((key) => (
        <button
          key={key}
          type="button"
          onClick={() => setStatusFilter(key)}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
            statusFilter === key ? 'bg-mwasalatInk-500 text-white' : 'bg-white text-[#475569] border border-[#E2E8F0] hover:border-mwasalatInk-300'
          }`}
        >
          {t(`allCoursesPage.filters.${key}`)}
        </button>
      ))}
    </div>
  );

  return (
    <MwasalatLearnerLayout title={t('allCoursesPage.title')}>
      <div className="max-w-5xl mx-auto">
        <MwasalatDataTable
          columns={COLUMNS}
          rows={filteredRows}
          isLoading={isLoading}
          emptyLabel={t('allCoursesPage.empty')}
          searchPlaceholder={t('learner.dashboard.searchPlaceholder')}
          searchable={(r) => `${r.program?.title ?? ''} ${r.program?.titleAr ?? ''} ${r.program?.category ?? ''} ${r.program?.categoryAr ?? ''}`}
          filters={filterPills}
        />
      </div>
    </MwasalatLearnerLayout>
  );
}
