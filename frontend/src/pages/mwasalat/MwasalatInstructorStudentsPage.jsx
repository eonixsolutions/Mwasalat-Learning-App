import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { MessageCircle } from 'lucide-react';
import MwasalatInstructorLayout from '../../layouts/MwasalatInstructorLayout.jsx';
import MwasalatDataTable from '../../components/mwasalat/MwasalatDataTable.jsx';
import MwasalatRiskBadge from '../../components/mwasalat/MwasalatRiskBadge.jsx';
import MwasalatStreakBadge from '../../components/mwasalat/MwasalatStreakBadge.jsx';
import { mwasalatProgramService } from '../../services/mwasalatProgram.service.js';
import { getLocalizedProgramField, localizeNumber } from '../../utils/mwasalatLocalize.js';

const RISK_FILTERS = ['all', 'on_track', 'at_risk', 'inactive', 'churned'];
const SORT_OPTIONS = ['recentActivity', 'name', 'progress', 'risk'];
const RISK_SEVERITY = { churned: 3, inactive: 2, at_risk: 1, on_track: 0 };

export default function MwasalatInstructorStudentsPage() {
  const { t, i18n } = useTranslation('mwasalatApp');
  const [students, setStudents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [programFilter, setProgramFilter] = useState('all');
  const [riskFilter, setRiskFilter] = useState('all');
  const [sortBy, setSortBy] = useState('recentActivity');

  useEffect(() => {
    mwasalatProgramService.getMyRoster().then(({ allStudents }) => setStudents(allStudents)).finally(() => setIsLoading(false));
  }, []);

  const programs = useMemo(() => {
    const map = new Map();
    students.forEach((s) => { if (s.program) map.set(s.program._id, s.program); });
    return [...map.values()];
  }, [students]);

  const filtered = useMemo(() => {
    let rows = students;
    if (programFilter !== 'all') rows = rows.filter((s) => s.program?._id === programFilter);
    if (riskFilter !== 'all') rows = rows.filter((s) => s.riskLevel === riskFilter);

    const sorted = [...rows];
    if (sortBy === 'name') {
      sorted.sort((a, b) => (a.learner?.name ?? '').localeCompare(b.learner?.name ?? ''));
    } else if (sortBy === 'progress') {
      sorted.sort((a, b) => b.progress - a.progress);
    } else if (sortBy === 'risk') {
      sorted.sort((a, b) => (RISK_SEVERITY[b.riskLevel] ?? 0) - (RISK_SEVERITY[a.riskLevel] ?? 0));
    } else {
      sorted.sort((a, b) => new Date(b.lastActivityAt ?? b.purchasedAt) - new Date(a.lastActivityAt ?? a.purchasedAt));
    }
    return sorted;
  }, [students, programFilter, riskFilter, sortBy]);

  const COLUMNS = [
    {
      key: 'learner',
      label: t('common.name'),
      render: (s) => (
        <>
          <p className="font-medium text-[#1E293B]">{s.learner?.name}</p>
          <p className="text-xs text-[#94A3B8]" dir="ltr">{s.learner?.email}</p>
        </>
      ),
    },
    {
      key: 'program',
      label: t('admin.nav.programs'),
      render: (s) => <span className="text-[#475569] truncate block max-w-[180px]">{getLocalizedProgramField(s.program, 'title', i18n.language)}</span>,
    },
    {
      key: 'risk',
      label: t('instructorStudents.columns.risk'),
      render: (s) => <MwasalatRiskBadge level={s.riskLevel} returned={s.returned} />,
    },
    {
      key: 'progress',
      label: t('programDetail.progressColumn'),
      render: (s) => <span className="text-[#475569]">{localizeNumber(s.progress, i18n.language)}%</span>,
    },
    {
      key: 'streak',
      render: (s) => <MwasalatStreakBadge current={s.currentStreak} />,
      label: t('programDetail.streakColumn'),
    },
    {
      key: 'lastActive',
      label: t('programDetail.lastActiveColumn'),
      render: (s) => (
        <span className="text-[#94A3B8] whitespace-nowrap">
          {s.daysSinceActivity != null
            ? localizeNumber(t('programDetail.lastActiveDaysAgo', { count: s.daysSinceActivity }), i18n.language)
            : t('programDetail.lastActiveNever')}
        </span>
      ),
    },
    {
      key: 'actions',
      label: '',
      className: 'text-end',
      render: (s) => (
        <Link
          to={`/mwasalat/instructor/programs/${s.program?._id}/chat/${s.learner?._id}`}
          className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-mwasalatInk-500 border border-[#E2E8F0] hover:border-mwasalatInk-300 hover:bg-mwasalatInk-100 transition-colors"
          title={t('programDetail.chatWithTooltip', { name: s.learner?.name })}
        >
          <MessageCircle className="w-3.5 h-3.5" />
        </Link>
      ),
    },
  ];

  const filterPills = (
    <div className="flex items-center gap-2 flex-wrap">
      <select
        value={programFilter}
        onChange={(e) => setProgramFilter(e.target.value)}
        className="px-3 py-1.5 rounded-lg border border-[#E2E8F0] text-xs font-medium bg-white text-[#475569] focus:outline-none focus:ring-2 focus:ring-mwasalatInk-500/20"
      >
        <option value="all">{t('instructorStudents.allPrograms')}</option>
        {programs.map((p) => (
          <option key={p._id} value={p._id}>{getLocalizedProgramField(p, 'title', i18n.language)}</option>
        ))}
      </select>
      <select
        value={riskFilter}
        onChange={(e) => setRiskFilter(e.target.value)}
        className="px-3 py-1.5 rounded-lg border border-[#E2E8F0] text-xs font-medium bg-white text-[#475569] focus:outline-none focus:ring-2 focus:ring-mwasalatInk-500/20"
      >
        {RISK_FILTERS.map((key) => (
          <option key={key} value={key}>{key === 'all' ? t('userFilters.all') : t(`riskBadge.${key}`)}</option>
        ))}
      </select>
      <select
        value={sortBy}
        onChange={(e) => setSortBy(e.target.value)}
        className="px-3 py-1.5 rounded-lg border border-[#E2E8F0] text-xs font-medium bg-white text-[#475569] focus:outline-none focus:ring-2 focus:ring-mwasalatInk-500/20"
      >
        {SORT_OPTIONS.map((key) => (
          <option key={key} value={key}>{t(`instructorStudents.sort.${key}`)}</option>
        ))}
      </select>
    </div>
  );

  return (
    <MwasalatInstructorLayout title={t('instructorStudents.title')} subtitle={t('instructorStudents.subtitle')}>
      <div className="max-w-6xl mx-auto">
        <MwasalatDataTable
          columns={COLUMNS}
          rows={filtered}
          isLoading={isLoading}
          emptyLabel={t('instructorStudents.empty')}
          searchPlaceholder={t('instructorStudents.searchPlaceholder')}
          searchable={(s) => `${s.learner?.name ?? ''} ${s.learner?.email ?? ''}`}
          filters={filterPills}
        />
      </div>
    </MwasalatInstructorLayout>
  );
}
