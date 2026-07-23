import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import MwasalatAdminLayout from '../../layouts/MwasalatAdminLayout.jsx';
import MwasalatDataTable from '../../components/mwasalat/MwasalatDataTable.jsx';
import { mwasalatProgramService } from '../../services/mwasalatProgram.service.js';
import { themeForCategory } from '../../utils/mwasalatCategoryTheme.js';
import { getLocalizedProgramField, localizeNumber } from '../../utils/mwasalatLocalize.js';

export default function MwasalatAdminCertificatesPage() {
  const { t, i18n } = useTranslation('mwasalatApp');
  const dateLocale = i18n.language.startsWith('ar') ? 'ar-OM' : 'en-GB';
  const [certificates, setCertificates] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const COLUMNS = [
    {
      key: 'learner',
      label: t('common.name'),
      render: (c) => (
        <>
          <p className="font-medium text-[#1E293B]">{c.learner?.name}</p>
          <p className="text-xs text-[#94A3B8]" dir="ltr">{c.learner?.email}</p>
        </>
      ),
    },
    { key: 'course', label: t('certificatesPage.columns.course'), render: (c) => <span className="text-[#475569]">{getLocalizedProgramField(c.program, 'title', i18n.language)}</span> },
    {
      key: 'category',
      label: t('certificatesPage.columns.category'),
      render: (c) => {
        const theme = themeForCategory(c.program?.category);
        return (
          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium capitalize ${theme.bg} ${theme.text}`}>
            {getLocalizedProgramField(c.program, 'category', i18n.language) || t('programCard.generalCategory')}
          </span>
        );
      },
    },
    {
      key: 'issuedAt',
      label: t('certificatesPage.columns.issued'),
      render: (c) => (
        <span className="text-[#94A3B8]" dir="ltr">
          {localizeNumber(new Date(c.issuedAt).toLocaleDateString(dateLocale, { day: 'numeric', month: 'short', year: 'numeric' }), i18n.language)}
        </span>
      ),
    },
    { key: 'certificateNumber', label: t('certificatesPage.columns.certificateNo'), render: (c) => <span className="text-[#94A3B8]" dir="ltr">{c.certificateNumber}</span> },
    {
      key: 'expiresAt',
      label: t('certificatesPage.columns.expires'),
      render: (c) => {
        if (!c.expiresAt) return <span className="text-[#94A3B8]">{t('certificatesPage.noExpiry')}</span>;
        const label = localizeNumber(new Date(c.expiresAt).toLocaleDateString(dateLocale, { day: 'numeric', month: 'short', year: 'numeric' }), i18n.language);
        if (c.isExpired) {
          return (
            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-mwasalatRed-100 text-mwasalatRed-600" dir="ltr">
              {t('certificatesPage.expiredLabel')} · {label}
            </span>
          );
        }
        return <span className="text-[#475569]" dir="ltr">{label}</span>;
      },
    },
  ];

  useEffect(() => {
    mwasalatProgramService.listAllCertificates().then(setCertificates).finally(() => setIsLoading(false));
  }, []);

  return (
    <MwasalatAdminLayout title={t('certificatesPage.title')} subtitle={t('certificatesPage.subtitle')}>
      <div className="max-w-5xl mx-auto">
        <MwasalatDataTable
          columns={COLUMNS}
          rows={certificates}
          isLoading={isLoading}
          emptyLabel={t('certificatesPage.empty')}
          searchPlaceholder={t('certificatesPage.searchPlaceholder')}
          searchable={(c) => `${c.learner?.name ?? ''} ${c.learner?.email ?? ''} ${c.program?.title ?? ''}`}
        />
      </div>
    </MwasalatAdminLayout>
  );
}
