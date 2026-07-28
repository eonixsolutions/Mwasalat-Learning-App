import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { MessageCircle, Check, X, Loader2 } from 'lucide-react';
import MwasalatInstructorLayout from '../../layouts/MwasalatInstructorLayout.jsx';
import MwasalatDataTable from '../../components/mwasalat/MwasalatDataTable.jsx';
import MwasalatRiskBadge from '../../components/mwasalat/MwasalatRiskBadge.jsx';
import MwasalatStreakBadge from '../../components/mwasalat/MwasalatStreakBadge.jsx';
import MwasalatEnrollmentStatusBadge from '../../components/mwasalat/MwasalatEnrollmentStatusBadge.jsx';
import { mwasalatProgramService } from '../../services/mwasalatProgram.service.js';
import { getLocalizedProgramField, localizeNumber } from '../../utils/mwasalatLocalize.js';

const RISK_FILTERS = ['all', 'on_track', 'at_risk', 'inactive', 'churned'];
const STATUS_FILTERS = ['all', 'pending_approval', 'waitlisted'];
const SORT_OPTIONS = ['recentActivity', 'name', 'progress', 'risk'];
const RISK_SEVERITY = { churned: 3, inactive: 2, at_risk: 1, on_track: 0 };
const NEEDS_ACTION_STATUSES = ['pending_approval', 'waitlisted'];

export default function MwasalatInstructorStudentsPage() {
  const { t, i18n } = useTranslation('mwasalatApp');
  const [students, setStudents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [programFilter, setProgramFilter] = useState('all');
  const [riskFilter, setRiskFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('recentActivity');
  const [actioningId, setActioningId] = useState(null);
  const [rejectTarget, setRejectTarget] = useState(null);
  const [rejectReason, setRejectReason] = useState('');

  const loadRoster = () => mwasalatProgramService.getMyRoster().then(({ allStudents }) => setStudents(allStudents));

  useEffect(() => {
    loadRoster().finally(() => setIsLoading(false));
  }, []);

  const handleApprove = async (student) => {
    setActioningId(student._id);
    try {
      await mwasalatProgramService.approveEnrollment(student.program?._id, student.learner?._id);
      toast.success(t('enrollmentActions.approveSuccess'));
      await loadRoster();
    } catch (err) {
      toast.error(err.response?.data?.message || t('enrollmentActions.actionFailed'));
    } finally {
      setActioningId(null);
    }
  };

  const handleReject = async () => {
    if (!rejectTarget) return;
    setActioningId(rejectTarget._id);
    try {
      await mwasalatProgramService.rejectEnrollment(rejectTarget.program?._id, rejectTarget.learner?._id, rejectReason);
      toast.success(t('enrollmentActions.rejectSuccess'));
      setRejectTarget(null);
      setRejectReason('');
      await loadRoster();
    } catch (err) {
      toast.error(err.response?.data?.message || t('enrollmentActions.actionFailed'));
    } finally {
      setActioningId(null);
    }
  };

  const programs = useMemo(() => {
    const map = new Map();
    students.forEach((s) => { if (s.program) map.set(s.program._id, s.program); });
    return [...map.values()];
  }, [students]);

  const filtered = useMemo(() => {
    let rows = students;
    if (programFilter !== 'all') rows = rows.filter((s) => s.program?._id === programFilter);
    if (riskFilter !== 'all') rows = rows.filter((s) => s.riskLevel === riskFilter);
    if (statusFilter !== 'all') rows = rows.filter((s) => s.status === statusFilter);

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
  }, [students, programFilter, riskFilter, statusFilter, sortBy]);

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
      key: 'status',
      label: t('instructorStudents.columns.status'),
      render: (s) => (
        <div className="flex items-center gap-1.5 flex-wrap">
          <MwasalatEnrollmentStatusBadge status={s.status} />
          {NEEDS_ACTION_STATUSES.includes(s.status) && (
            <div className="flex items-center gap-1">
              <button
                type="button"
                disabled={actioningId === s._id}
                onClick={() => handleApprove(s)}
                title={t('enrollmentActions.approve')}
                className="inline-flex items-center justify-center w-6 h-6 rounded-lg bg-[#DCFCE7] text-[#16A34A] hover:bg-[#BBF7D0] transition-colors disabled:opacity-50"
              >
                {actioningId === s._id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
              </button>
              <button
                type="button"
                disabled={actioningId === s._id}
                onClick={() => { setRejectTarget(s); setRejectReason(''); }}
                title={t('enrollmentActions.reject')}
                className="inline-flex items-center justify-center w-6 h-6 rounded-lg bg-mwasalatRed-100 text-mwasalatRed-600 hover:bg-mwasalatRed-300/60 transition-colors disabled:opacity-50"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          )}
        </div>
      ),
    },
    {
      key: 'risk',
      label: t('instructorStudents.columns.risk'),
      render: (s) => <MwasalatRiskBadge level={s.riskLevel} returned={s.returned} overdue={s.overdue} />,
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
          to={`/instructor/programs/${s.program?._id}/chat/${s.learner?._id}`}
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
        value={statusFilter}
        onChange={(e) => setStatusFilter(e.target.value)}
        className="px-3 py-1.5 rounded-lg border border-[#E2E8F0] text-xs font-medium bg-white text-[#475569] focus:outline-none focus:ring-2 focus:ring-mwasalatInk-500/20"
      >
        {STATUS_FILTERS.map((key) => (
          <option key={key} value={key}>{key === 'all' ? t('userFilters.all') : t(`enrollmentStatus.${key}`)}</option>
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

      {rejectTarget && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl w-full max-w-sm p-6">
            <h3 className="text-lg font-semibold text-[#1E293B] mb-2">{t('enrollmentActions.rejectPromptTitle')}</h3>
            <p className="text-sm text-[#475569] mb-4">{t('enrollmentActions.rejectPromptBody')}</p>
            <label className="block text-xs font-medium text-[#475569] mb-1.5">{t('enrollmentActions.rejectReasonLabel')}</label>
            <textarea
              rows={2}
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-[#E2E8F0] text-sm bg-white text-[#1E293B] focus:outline-none focus:ring-2 focus:ring-mwasalatInk-500/20 mb-5"
            />
            <div className="flex gap-3">
              <button
                onClick={() => setRejectTarget(null)}
                className="flex-1 px-4 py-2.5 rounded-xl border border-[#E2E8F0] text-sm font-medium text-[#475569] hover:bg-[#F1F5F9] transition-colors"
              >
                {t('common.cancel')}
              </button>
              <button
                onClick={handleReject}
                disabled={actioningId === rejectTarget._id}
                className="flex-1 inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-mwasalatRed-600 hover:bg-mwasalatRed-700 disabled:opacity-60 text-white text-sm font-semibold transition-colors"
              >
                {actioningId === rejectTarget._id ? <Loader2 className="w-4 h-4 animate-spin" /> : <X className="w-4 h-4" />}
                {t('enrollmentActions.confirm')}
              </button>
            </div>
          </div>
        </div>
      )}
    </MwasalatInstructorLayout>
  );
}
