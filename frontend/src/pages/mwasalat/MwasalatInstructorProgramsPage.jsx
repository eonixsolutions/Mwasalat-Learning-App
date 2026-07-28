import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { BookOpen, Users, Pencil, ChevronRight, Plus, CheckCircle2, FileEdit, Archive } from 'lucide-react';
import { mwasalatProgramService } from '../../services/mwasalatProgram.service.js';
import MwasalatInstructorLayout from '../../layouts/MwasalatInstructorLayout.jsx';
import MwasalatDataTable from '../../components/mwasalat/MwasalatDataTable.jsx';
import { themeForCategory } from '../../utils/mwasalatCategoryTheme.js';
import { getLocalizedProgramField, localizeNumber } from '../../utils/mwasalatLocalize.js';

const STATUS_FILTERS = ['all', 'active', 'draft', 'archived'];

const STATUS_STYLES = {
  active: { icon: CheckCircle2, bg: 'bg-[#DCFCE7]', text: 'text-[#16A34A]' },
  draft: { icon: FileEdit, bg: 'bg-[#FEF3C7]', text: 'text-[#F59E0B]' },
  archived: { icon: Archive, bg: 'bg-[#FBE7E9]', text: 'text-mwasalatRed-600' },
};

export default function MwasalatInstructorProgramsPage() {
  const { t, i18n } = useTranslation('mwasalatApp');
  const [programs, setPrograms] = useState([]);
  const [allStudents, setAllStudents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    Promise.all([
      mwasalatProgramService.listMine(),
      mwasalatProgramService.getMyRoster(),
    ])
      .then(([myPrograms, roster]) => {
        setPrograms(myPrograms);
        setAllStudents(roster.allStudents);
      })
      .finally(() => setIsLoading(false));
  }, []);

  // The roster endpoint returns every enrollment across every one of this
  // instructor's programs — group it here rather than adding a per-program
  // count endpoint, since the roster call already happens on the dashboard.
  const rosterByProgram = useMemo(() => {
    const map = {};
    allStudents.forEach((s) => {
      const pid = s.program?._id;
      if (!pid) return;
      map[pid] ??= { enrolled: 0, completed: 0 };
      map[pid].enrolled += 1;
      if (s.status === 'completed') map[pid].completed += 1;
    });
    return map;
  }, [allStudents]);

  const rows = useMemo(() => programs.map((p) => {
    const stats = rosterByProgram[p._id] ?? { enrolled: 0, completed: 0 };
    const completionRate = stats.enrolled ? Math.round((stats.completed / stats.enrolled) * 100) : 0;
    return { ...p, enrolledCount: stats.enrolled, completionRate };
  }), [programs, rosterByProgram]);

  const filteredRows = rows.filter((r) => statusFilter === 'all' || r.status === statusFilter);

  const COLUMNS = [
    {
      key: 'course',
      label: t('instructorProgramsPage.columns.course'),
      className: 'min-w-[220px] max-w-[340px]',
      render: (r) => {
        const theme = themeForCategory(r.category);
        return (
          <Link to={`/instructor/programs/${r._id}`} className="group flex items-center gap-3 min-w-0">
            <span className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${theme.bg} ${theme.text}`}>
              <BookOpen className="w-4 h-4" />
            </span>
            <span className="min-w-0">
              <p className="font-medium text-[#1E293B] group-hover:text-mwasalatInk-500 transition-colors truncate">
                {getLocalizedProgramField(r, 'title', i18n.language)}
              </p>
              <span className={`inline-flex items-center mt-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium capitalize ${theme.bg} ${theme.text}`}>
                {getLocalizedProgramField(r, 'category', i18n.language) || t('instructorDashboard.categoryFallback')}
              </span>
            </span>
          </Link>
        );
      },
    },
    {
      key: 'status',
      label: t('instructorProgramsPage.columns.status'),
      className: 'w-32',
      render: (r) => {
        const style = STATUS_STYLES[r.status] ?? STATUS_STYLES.active;
        const Icon = style.icon;
        return (
          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium whitespace-nowrap ${style.bg} ${style.text}`}>
            <Icon className="w-3.5 h-3.5" /> {t(`instructorProgramsPage.filters.${r.status}`)}
          </span>
        );
      },
    },
    {
      key: 'learners',
      label: t('instructorProgramsPage.columns.learners'),
      className: 'w-28',
      render: (r) => (
        <span className="inline-flex items-center gap-1.5 text-xs text-[#475569] whitespace-nowrap">
          <Users className="w-3.5 h-3.5 text-[#94A3B8]" /> {localizeNumber(r.enrolledCount, i18n.language)}
        </span>
      ),
    },
    {
      key: 'completion',
      label: t('instructorProgramsPage.columns.completion'),
      className: 'w-32',
      render: (r) => (
        r.enrolledCount === 0 ? (
          <span className="text-xs text-[#94A3B8]">—</span>
        ) : (
          <span className="flex items-center gap-2 text-xs text-[#475569] whitespace-nowrap">
            <span className="w-16 h-1.5 rounded-full bg-[#F1F5F9] overflow-hidden flex-shrink-0">
              <span className="block h-full rounded-full bg-mwasalatInk-400" style={{ width: `${r.completionRate}%` }} />
            </span>
            {localizeNumber(r.completionRate, i18n.language)}%
          </span>
        )
      ),
    },
    {
      key: 'createdAt',
      label: t('instructorProgramsPage.columns.created'),
      className: 'w-32',
      render: (r) => (
        <span className="text-[#94A3B8] whitespace-nowrap" dir="ltr">
          {localizeNumber(new Date(r.createdAt).toLocaleDateString(i18n.language.startsWith('ar') ? 'ar-OM' : 'en-GB', { day: 'numeric', month: 'short', year: 'numeric' }), i18n.language)}
        </span>
      ),
    },
    {
      key: 'actions',
      label: '',
      className: 'w-24',
      render: (r) => (
        <div className="flex items-center gap-1.5 justify-end">
          <Link
            to={`/instructor/programs/${r._id}/edit`}
            title={t('instructorDashboard.editCourseTooltip')}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-[#475569] hover:bg-[#F1F5F9] transition-colors flex-shrink-0"
          >
            <Pencil className="w-4 h-4" />
          </Link>
          <Link
            to={`/instructor/programs/${r._id}`}
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
          {t(`instructorProgramsPage.filters.${key}`)}
        </button>
      ))}
    </div>
  );

  return (
    <MwasalatInstructorLayout
      title={t('instructorProgramsPage.title')}
      subtitle={t('instructorProgramsPage.subtitle')}
      actions={(
        <Link
          to="/instructor/programs/new"
          className="hidden sm:inline-flex items-center gap-2 bg-mwasalatInk-500 hover:bg-mwasalatInk-400 text-white font-semibold px-3.5 py-2 rounded-xl transition-colors text-xs"
        >
          <Plus className="w-3.5 h-3.5" /> {t('instructor.nav.addCourse')}
        </Link>
      )}
    >
      <div className="max-w-5xl mx-auto">
        <MwasalatDataTable
          columns={COLUMNS}
          rows={filteredRows}
          isLoading={isLoading}
          emptyLabel={t('instructorProgramsPage.empty')}
          searchPlaceholder={t('instructorProgramsPage.searchPlaceholder')}
          searchable={(r) => `${r.title ?? ''} ${r.titleAr ?? ''} ${r.category ?? ''} ${r.categoryAr ?? ''}`}
          filters={filterPills}
        />
      </div>
    </MwasalatInstructorLayout>
  );
}
