import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Activity, Users, UserX, MailQuestion, Lock, History, Loader2, ChevronRight, Database } from 'lucide-react';
import MwasalatItSupportLayout from '../../layouts/MwasalatItSupportLayout.jsx';
import { mwasalatUserService } from '../../services/mwasalatUser.service.js';
import { localizeNumber } from '../../utils/mwasalatLocalize.js';

function StatTile({ icon: Icon, tone, label, value }) {
  return (
    <div className="card p-4 flex items-center gap-3">
      <span className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${tone.bg} ${tone.text}`}>
        <Icon className="w-5 h-5" />
      </span>
      <div className="min-w-0">
        <p className="text-xl font-bold text-[#1E293B] leading-tight" dir="ltr">{value}</p>
        <p className="text-xs text-[#94A3B8] truncate">{label}</p>
      </div>
    </div>
  );
}

// Formats a raw uptime-in-seconds count as "Xd Yh Zm" — matches what an
// operator scanning a health card actually wants, not a raw second count.
function formatUptime(seconds) {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const parts = [];
  if (days) parts.push(`${days}d`);
  if (hours || days) parts.push(`${hours}h`);
  parts.push(`${minutes}m`);
  return parts.join(' ');
}

export default function MwasalatItSupportDashboard() {
  const { t, i18n } = useTranslation('mwasalatApp');
  const dateLocale = i18n.language.startsWith('ar') ? 'ar-OM' : 'en-GB';
  const [overview, setOverview] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    mwasalatUserService.getItSupportOverview()
      .then(setOverview)
      .finally(() => setIsLoading(false));
  }, []);

  const isUp = overview?.health?.status === 'ok';

  return (
    <MwasalatItSupportLayout title={t('itSupport.dashboard.title')} subtitle={t('itSupport.dashboard.subtitle')}>
      {isLoading ? (
        <div className="p-10 flex items-center justify-center text-[#94A3B8]">
          <Loader2 className="w-5 h-5 animate-spin me-2" /> {t('itSupport.dashboard.loading')}
        </div>
      ) : (
        <div className="space-y-5">
          {/* Platform health */}
          <div className={`card p-4 sm:p-5 flex flex-wrap items-center gap-4 justify-between ${isUp ? '' : 'border border-mwasalatRed-300'}`}>
            <div className="flex items-center gap-3">
              <span className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${isUp ? 'bg-[#F0FDF4] text-green-600' : 'bg-mwasalatRed-100 text-mwasalatRed-600'}`}>
                <Activity className="w-5 h-5" />
              </span>
              <div>
                <p className="text-sm font-semibold text-[#1E293B]">
                  {isUp ? t('itSupport.dashboard.healthOk') : t('itSupport.dashboard.healthDegraded')}
                </p>
                <p className="text-xs text-[#94A3B8]">
                  {t('itSupport.dashboard.uptimeLabel', { uptime: formatUptime(overview?.health?.uptimeSeconds ?? 0) })}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#F1F5F9]">
              <Database className="w-3.5 h-3.5 text-[#475569]" />
              <span className="text-xs font-medium text-[#475569] capitalize">{overview?.health?.db}</span>
            </div>
          </div>

          {/* Account-status counts */}
          <div className="grid sm:grid-cols-3 gap-3.5">
            <StatTile
              icon={Users} tone={{ bg: 'bg-mwasalatInk-100', text: 'text-mwasalatInk-500' }}
              label={t('itSupport.dashboard.activeUsers')}
              value={localizeNumber(overview?.userCounts?.active ?? 0, i18n.language)}
            />
            <StatTile
              icon={UserX} tone={{ bg: 'bg-mwasalatRed-100', text: 'text-mwasalatRed-600' }}
              label={t('itSupport.dashboard.blockedUsers')}
              value={localizeNumber(overview?.userCounts?.blocked ?? 0, i18n.language)}
            />
            <StatTile
              icon={MailQuestion} tone={{ bg: 'bg-[#F1F5F9]', text: 'text-[#475569]' }}
              label={t('itSupport.dashboard.invitedUsers')}
              value={localizeNumber(overview?.userCounts?.invited ?? 0, i18n.language)}
            />
          </div>

          {/* Recent lockouts */}
          <div className="card p-4 sm:p-5">
            <div className="flex items-center gap-2 mb-3.5">
              <Lock className="w-4 h-4 text-mwasalatRed-600" />
              <h2 className="text-sm font-semibold text-[#1E293B]">{t('itSupport.dashboard.recentLockoutsTitle')}</h2>
            </div>
            {!overview?.recentLockouts?.length ? (
              <p className="text-sm text-[#94A3B8] py-4 text-center">{t('itSupport.dashboard.noLockouts')}</p>
            ) : (
              <div className="flex flex-col divide-y divide-[#F1F5F9]">
                {overview.recentLockouts.map((u) => (
                  <div key={u._id} className="flex items-center justify-between gap-3 py-2.5">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-[#1E293B] truncate">{u.name}</p>
                      <p className="text-xs text-[#94A3B8] truncate" dir="ltr">{u.email}</p>
                    </div>
                    <div className="text-end flex-shrink-0">
                      <p className="text-xs font-medium text-mwasalatRed-600">
                        {t('itSupport.dashboard.lockedUntil', { date: new Date(u.lockedUntil).toLocaleString(dateLocale) })}
                      </p>
                      <p className="text-[11px] text-[#94A3B8]">
                        {t('itSupport.dashboard.failedAttempts', { count: u.failedLoginAttempts ?? 0 })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Activity Log CTA */}
          <Link to="/admin/activity-log" className="card card-hover p-4 sm:p-5 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="w-10 h-10 rounded-xl bg-mwasalatInk-100 text-mwasalatInk-500 flex items-center justify-center flex-shrink-0">
                <History className="w-5 h-5" />
              </span>
              <div>
                <p className="text-sm font-semibold text-[#1E293B]">{t('itSupport.dashboard.activityLogCta')}</p>
                <p className="text-xs text-[#94A3B8]">{t('itSupport.dashboard.activityLogCtaBody')}</p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-[#94A3B8] rtl:rotate-180 flex-shrink-0" />
          </Link>
        </div>
      )}
    </MwasalatItSupportLayout>
  );
}
