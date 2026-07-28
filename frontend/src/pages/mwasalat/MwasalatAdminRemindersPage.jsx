import { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { BellRing, Award, UserMinus } from 'lucide-react';
import MwasalatAdminLayout from '../../layouts/MwasalatAdminLayout.jsx';
import MwasalatDataTable from '../../components/mwasalat/MwasalatDataTable.jsx';
import MwasalatStatCard from '../../components/mwasalat/MwasalatStatCard.jsx';
import { mwasalatNotificationService } from '../../services/mwasalatNotification.service.js';
import { localizeNumber } from '../../utils/mwasalatLocalize.js';

const TYPE_BADGE = {
  certificate_expiry: 'bg-mwasalatRed-100 text-mwasalatRed-600',
  inactivity_nudge: 'bg-mwasalatInk-100 text-mwasalatInk-500',
};

export default function MwasalatAdminRemindersPage() {
  const { t, i18n } = useTranslation('mwasalatApp');
  const dateLocale = i18n.language.startsWith('ar') ? 'ar-OM' : 'en-GB';
  const [reminders, setReminders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState('all');

  useEffect(() => {
    setIsLoading(true);
    mwasalatNotificationService.listReminders('all').then(setReminders).finally(() => setIsLoading(false));
  }, []);

  const rows = useMemo(
    () => (typeFilter === 'all' ? reminders : reminders.filter((r) => r.type === typeFilter)),
    [reminders, typeFilter]
  );

  const certExpiryCount = reminders.filter((r) => r.type === 'certificate_expiry').length;
  const inactivityCount = reminders.filter((r) => r.type === 'inactivity_nudge').length;

  const typeLabel = (type) => t(`remindersPage.types.${type === 'certificate_expiry' ? 'certificateExpiry' : 'inactivityNudge'}`);

  const COLUMNS = [
    {
      key: 'type',
      label: t('remindersPage.columns.type'),
      render: (r) => (
        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${TYPE_BADGE[r.type] ?? 'bg-[#F1F5F9] text-[#475569]'}`}>
          {typeLabel(r.type)}
        </span>
      ),
    },
    {
      key: 'recipient',
      label: t('remindersPage.columns.recipient'),
      render: (r) => (
        <div className="min-w-0">
          <p className="font-medium text-[#1E293B] truncate">{r.recipient?.name ?? '—'}</p>
          <p className="text-xs text-[#94A3B8] truncate" dir="ltr">{r.recipient?.email ?? ''}</p>
        </div>
      ),
    },
    {
      key: 'message',
      label: t('remindersPage.columns.message'),
      render: (r) => (
        <div>
          <p className="font-medium text-[#1E293B]">{r.title}</p>
          <p className="text-[#475569] line-clamp-2">{r.message}</p>
        </div>
      ),
    },
    {
      key: 'createdAt',
      label: t('remindersPage.columns.sentAt'),
      render: (r) => (
        <span dir="ltr" className="text-[#94A3B8]">
          {localizeNumber(new Date(r.createdAt).toLocaleString(dateLocale, { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }), i18n.language)}
        </span>
      ),
    },
  ];

  return (
    <MwasalatAdminLayout title={t('admin.nav.reminders')} subtitle={t('remindersPage.subtitle')}>
      <div className="max-w-5xl mx-auto">
        <div className="grid sm:grid-cols-3 gap-5 mb-6">
          <MwasalatStatCard
            icon={BellRing} iconBg="bg-mwasalatInk-500" label={t('remindersPage.stats.total')}
            value={localizeNumber(reminders.length, i18n.language)} sub={t('remindersPage.last200')}
          />
          <MwasalatStatCard
            icon={Award} iconBg="bg-mwasalatRed-500" label={t('remindersPage.types.certificateExpiry')}
            value={localizeNumber(certExpiryCount, i18n.language)} sub={t('remindersPage.last200')}
          />
          <MwasalatStatCard
            icon={UserMinus} iconBg="bg-[#7C6AF2]" label={t('remindersPage.types.inactivityNudge')}
            value={localizeNumber(inactivityCount, i18n.language)} sub={t('remindersPage.last200')}
          />
        </div>

        <MwasalatDataTable
          columns={COLUMNS}
          rows={rows}
          isLoading={isLoading}
          emptyLabel={t('remindersPage.empty')}
          searchPlaceholder={t('remindersPage.searchPlaceholder')}
          searchable={(r) => `${r.title} ${r.message} ${r.recipient?.name ?? ''} ${r.recipient?.email ?? ''}`}
          filters={(
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-3 py-1.5 rounded-lg border border-[#E2E8F0] text-[13px] bg-white text-[#1E293B] focus:outline-none focus:ring-2 focus:ring-mwasalatInk-500/20 hover:border-mwasalatInk-300 transition-colors"
            >
              <option value="all">{t('remindersPage.allTypes')}</option>
              <option value="certificate_expiry">{t('remindersPage.types.certificateExpiry')}</option>
              <option value="inactivity_nudge">{t('remindersPage.types.inactivityNudge')}</option>
            </select>
          )}
        />
      </div>
    </MwasalatAdminLayout>
  );
}
