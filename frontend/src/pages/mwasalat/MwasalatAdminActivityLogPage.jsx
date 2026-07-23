import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import MwasalatAdminLayout from '../../layouts/MwasalatAdminLayout.jsx';
import MwasalatDataTable from '../../components/mwasalat/MwasalatDataTable.jsx';
import { mwasalatActivityLogService } from '../../services/mwasalatActivityLog.service.js';
import { localizeNumber } from '../../utils/mwasalatLocalize.js';
import { MWASALAT_ACTIVITY_ACTION_KEYS } from '../../utils/mwasalatActivityLabels.js';

export default function MwasalatAdminActivityLogPage() {
  const { t, i18n } = useTranslation('mwasalatApp');
  const dateLocale = i18n.language.startsWith('ar') ? 'ar-OM' : 'en-GB';
  const [logs, setLogs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const actionLabel = (action) => (MWASALAT_ACTIVITY_ACTION_KEYS[action] ? t(`activityLogPage.actions.${MWASALAT_ACTIVITY_ACTION_KEYS[action]}`) : action);

  const COLUMNS = [
    {
      key: 'actor',
      label: t('activityLogPage.columns.actor'),
      render: (log) => (
        <>
          <p className="font-medium text-[#1E293B]">{log.actorName ?? t('activityLogPage.unknownActor')}</p>
          <p className="text-xs text-[#94A3B8] capitalize">{log.actorRole ? t(`common.roles.${log.actorRole}`) : ''}</p>
        </>
      ),
    },
    {
      key: 'action',
      label: t('activityLogPage.columns.action'),
      render: (log) => (
        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-[#F1F5F9] text-[#475569]">
          {actionLabel(log.action)}
        </span>
      ),
    },
    {
      key: 'metadata',
      label: t('activityLogPage.columns.detail'),
      render: (log) => (
        <span className="text-[#475569]">
          {log.metadata?.title ?? log.metadata?.targetName ?? log.metadata?.email ?? '—'}
        </span>
      ),
    },
    {
      key: 'createdAt',
      label: t('activityLogPage.columns.when'),
      render: (log) => (
        <span className="text-[#94A3B8]" dir="ltr">
          {localizeNumber(new Date(log.createdAt).toLocaleString(dateLocale, { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }), i18n.language)}
        </span>
      ),
    },
  ];

  useEffect(() => {
    mwasalatActivityLogService.list({ page: 1, limit: 200 })
      .then((data) => setLogs(data.logs))
      .finally(() => setIsLoading(false));
  }, []);

  return (
    <MwasalatAdminLayout title={t('admin.nav.activityLog')} subtitle={t('activityLogPage.subtitle')}>
      <div className="max-w-6xl mx-auto">
        <MwasalatDataTable
          columns={COLUMNS}
          rows={logs}
          isLoading={isLoading}
          emptyLabel={t('activityLogPage.empty')}
          searchPlaceholder={t('activityLogPage.searchPlaceholder')}
          searchable={(log) => `${log.actorName ?? ''} ${actionLabel(log.action)}`}
        />
      </div>
    </MwasalatAdminLayout>
  );
}
