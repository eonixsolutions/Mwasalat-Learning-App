import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { Users, Loader2, BookOpen, Award, CircleSlash, AlertTriangle, Send, CheckCircle2 } from 'lucide-react';
import MwasalatSupervisorLayout from '../../layouts/MwasalatSupervisorLayout.jsx';
import { mwasalatUserService } from '../../services/mwasalatUser.service.js';
import { localizeNumber, getLocalizedProgramField } from '../../utils/mwasalatLocalize.js';

export default function MwasalatSupervisorDashboard() {
  const { t, i18n } = useTranslation('mwasalatApp');
  const dateLocale = i18n.language.startsWith('ar') ? 'ar-OM' : 'en-GB';
  const [team, setTeam] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [escalatingKey, setEscalatingKey] = useState(null);
  const [escalatedKeys, setEscalatedKeys] = useState(new Set());

  useEffect(() => {
    mwasalatUserService.getMyTeamOverview()
      .then(setTeam)
      .finally(() => setIsLoading(false));
  }, []);

  const totalEnrolled = team.reduce((sum, m) => sum + m.enrolledCount, 0);
  const totalCompleted = team.reduce((sum, m) => sum + m.completedCount, 0);
  const overdueRows = team.flatMap((member) => (member.overdueCourses ?? []).map((course) => ({
    key: `${member._id}:${course.programId}`,
    learnerId: member._id,
    learnerName: member.name,
    ...course,
  })));

  const handleEscalate = async (row) => {
    setEscalatingKey(row.key);
    try {
      await mwasalatUserService.escalateOverdueToAdmin(row.learnerId, row.programId);
      setEscalatedKeys((prev) => new Set(prev).add(row.key));
      toast.success(t('supervisor.dashboard.overdue.escalateSuccess'));
    } catch (err) {
      toast.error(err.response?.data?.message || t('supervisor.dashboard.overdue.escalateFailed'));
    } finally {
      setEscalatingKey(null);
    }
  };

  return (
    <MwasalatSupervisorLayout title={t('supervisor.dashboard.title')} subtitle={t('supervisor.dashboard.subtitle')}>
      {isLoading ? (
        <div className="p-10 flex items-center justify-center text-[#94A3B8]">
          <Loader2 className="w-5 h-5 animate-spin me-2" /> {t('supervisor.dashboard.loading')}
        </div>
      ) : team.length === 0 ? (
        <div className="card p-10 text-center">
          <Users className="w-8 h-8 text-mwasalatInk-400 mx-auto mb-3" />
          <p className="text-sm text-[#475569]">{t('supervisor.dashboard.noReports')}</p>
        </div>
      ) : (
        <div className="space-y-5">
          <div className="grid sm:grid-cols-3 gap-3.5">
            <div className="card p-4 flex items-center gap-3">
              <span className="w-10 h-10 rounded-xl bg-mwasalatInk-100 text-mwasalatInk-500 flex items-center justify-center flex-shrink-0">
                <Users className="w-5 h-5" />
              </span>
              <div>
                <p className="text-xl font-bold text-[#1E293B] leading-tight" dir="ltr">{localizeNumber(team.length, i18n.language)}</p>
                <p className="text-xs text-[#94A3B8]">{t('supervisor.dashboard.directReports')}</p>
              </div>
            </div>
            <div className="card p-4 flex items-center gap-3">
              <span className="w-10 h-10 rounded-xl bg-[#F1F5F9] text-[#475569] flex items-center justify-center flex-shrink-0">
                <BookOpen className="w-5 h-5" />
              </span>
              <div>
                <p className="text-xl font-bold text-[#1E293B] leading-tight" dir="ltr">{localizeNumber(totalEnrolled, i18n.language)}</p>
                <p className="text-xs text-[#94A3B8]">{t('supervisor.dashboard.totalEnrollments')}</p>
              </div>
            </div>
            <div className="card p-4 flex items-center gap-3">
              <span className="w-10 h-10 rounded-xl bg-[#F0FDF4] text-green-600 flex items-center justify-center flex-shrink-0">
                <Award className="w-5 h-5" />
              </span>
              <div>
                <p className="text-xl font-bold text-[#1E293B] leading-tight" dir="ltr">{localizeNumber(totalCompleted, i18n.language)}</p>
                <p className="text-xs text-[#94A3B8]">{t('supervisor.dashboard.totalCompletions')}</p>
              </div>
            </div>
          </div>

          {overdueRows.length > 0 && (
            <div className="card p-4 sm:p-5 border border-mwasalatRed-300/40">
              <div className="flex items-center gap-2 mb-3.5">
                <AlertTriangle className="w-4 h-4 text-mwasalatRed-600 flex-shrink-0" />
                <h2 className="text-sm font-semibold text-[#1E293B]">{t('supervisor.dashboard.overdue.title', { count: overdueRows.length })}</h2>
              </div>
              <div className="flex flex-col divide-y divide-[#F1F5F9]">
                {overdueRows.map((row) => {
                  const isEscalating = escalatingKey === row.key;
                  const isEscalated = escalatedKeys.has(row.key);
                  return (
                    <div key={row.key} className="flex items-center justify-between gap-3 py-3 flex-wrap">
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-[#1E293B] truncate">{row.learnerName}</p>
                        <p className="text-xs text-[#94A3B8] truncate">
                          {getLocalizedProgramField(row, 'title', i18n.language)}
                          {' · '}
                          {t('supervisor.dashboard.overdue.dueOn', { date: new Date(row.dueAt).toLocaleDateString(dateLocale) })}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleEscalate(row)}
                        disabled={isEscalating || isEscalated}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-mwasalatRed-600 hover:bg-mwasalatRed-700 disabled:opacity-60 transition-colors flex-shrink-0"
                      >
                        {isEscalating ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : isEscalated ? (
                          <CheckCircle2 className="w-3.5 h-3.5" />
                        ) : (
                          <Send className="w-3.5 h-3.5" />
                        )}
                        {isEscalated ? t('supervisor.dashboard.overdue.escalated') : t('supervisor.dashboard.overdue.escalateCta')}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div className="card p-4 sm:p-5">
            <h2 className="text-sm font-semibold text-[#1E293B] mb-3.5">{t('supervisor.dashboard.rosterTitle')}</h2>
            <div className="flex flex-col divide-y divide-[#F1F5F9]">
              {team.map((member) => (
                <div key={member._id} className="flex items-center justify-between gap-3 py-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-full bg-mwasalatInk-500 flex items-center justify-center text-white text-xs font-semibold flex-shrink-0">
                      {member.name?.[0]?.toUpperCase() ?? '?'}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-[#1E293B] truncate">{member.name}</p>
                      <p className="text-xs text-[#94A3B8] truncate" dir="ltr">{member.email}</p>
                    </div>
                    {!member.isActive && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-mwasalatRed-100 text-mwasalatRed-600 flex-shrink-0">
                        <CircleSlash className="w-3 h-3" /> {t('supervisor.dashboard.blocked')}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-4 flex-shrink-0 text-end">
                    <div>
                      <p className="text-sm font-semibold text-[#1E293B]" dir="ltr">{localizeNumber(member.enrolledCount, i18n.language)}</p>
                      <p className="text-[10px] text-[#94A3B8]">{t('supervisor.dashboard.enrolledLabel')}</p>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-green-600" dir="ltr">{localizeNumber(member.completedCount, i18n.language)}</p>
                      <p className="text-[10px] text-[#94A3B8]">{t('supervisor.dashboard.completedLabel')}</p>
                    </div>
                    <div className="hidden sm:block min-w-[90px]">
                      <p className="text-xs text-[#475569]">
                        {member.lastLogin ? new Date(member.lastLogin).toLocaleDateString(dateLocale) : t('supervisor.dashboard.neverLoggedIn')}
                      </p>
                      <p className="text-[10px] text-[#94A3B8]">{t('supervisor.dashboard.lastLoginLabel')}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </MwasalatSupervisorLayout>
  );
}
