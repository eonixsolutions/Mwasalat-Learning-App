import { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Wallet, TrendingUp, Receipt } from 'lucide-react';
import MwasalatAdminLayout from '../../layouts/MwasalatAdminLayout.jsx';
import MwasalatDataTable from '../../components/mwasalat/MwasalatDataTable.jsx';
import MwasalatStatCard from '../../components/mwasalat/MwasalatStatCard.jsx';
import { mwasalatPaymentService } from '../../services/mwasalatPayment.service.js';
import { themeForCategory } from '../../utils/mwasalatCategoryTheme.js';
import { getLocalizedProgramField, localizeNumber } from '../../utils/mwasalatLocalize.js';

const initials = (name) => (name ?? '?').trim().split(/\s+/).map((p) => p[0]).slice(0, 2).join('').toUpperCase();

export default function MwasalatAdminPaymentsPage() {
  const { t, i18n } = useTranslation('mwasalatApp');
  const dateLocale = i18n.language.startsWith('ar') ? 'ar-OM' : 'en-GB';
  const [summary, setSummary] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    Promise.all([
      mwasalatPaymentService.getRevenueSummary(),
      mwasalatPaymentService.listTransactions({ page: 1, limit: 200 }),
    ])
      .then(([summaryData, txData]) => {
        setSummary(summaryData);
        setTransactions(txData.transactions);
      })
      .finally(() => setIsLoading(false));
  }, []);

  const rows = useMemo(
    () => (statusFilter === 'all' ? transactions : transactions.filter((tx) => tx.status === statusFilter)),
    [transactions, statusFilter]
  );

  const monthly = summary?.monthlyRevenue ?? [];
  const lastMonth = monthly[monthly.length - 2];
  const thisMonth = monthly[monthly.length - 1];
  const revenueGrowthPct = lastMonth?.value ? Math.round(((thisMonth.value - lastMonth.value) / lastMonth.value) * 100) : null;
  const transactionsGrowthPct = lastMonth?.count ? Math.round(((thisMonth.count - lastMonth.count) / lastMonth.count) * 100) : null;

  const COLUMNS = [
    {
      key: 'learner',
      label: t('common.name'),
      render: (tx) => {
        const theme = themeForCategory(tx.learner?.name ?? '');
        return (
          <div className="flex items-center gap-2.5">
            <span className={`w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-semibold flex-shrink-0 ${theme.bg} ${theme.text}`}>
              {initials(tx.learner?.name)}
            </span>
            <div className="min-w-0">
              <p className="font-medium text-[#1E293B] truncate">{tx.learner?.name}</p>
              <p className="text-xs text-[#94A3B8] truncate" dir="ltr">{tx.learner?.email}</p>
            </div>
          </div>
        );
      },
    },
    {
      key: 'program',
      label: t('admin.nav.programs'),
      render: (tx) => {
        const theme = themeForCategory(tx.program?.category ?? '');
        return (
          <div>
            <p className="text-[#475569]">{getLocalizedProgramField(tx.program, 'title', i18n.language)}</p>
            {tx.program?.category && (
              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium capitalize mt-1 ${theme.bg} ${theme.text}`}>
                {getLocalizedProgramField(tx.program, 'category', i18n.language)}
              </span>
            )}
          </div>
        );
      },
    },
    { key: 'amount', label: t('paymentsPage.columns.amount'), render: (tx) => <span className="font-semibold text-[#1E293B]" dir="ltr">{tx.currency} {localizeNumber(tx.amount.toFixed(2), i18n.language)}</span> },
    {
      key: 'status',
      label: t('common.status'),
      render: (tx) => (
        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium capitalize ${
          tx.status === 'paid' ? 'bg-green-50 text-green-700' : 'bg-mwasalatRed-100 text-mwasalatRed-600'
        }`}>
          {tx.status === 'paid' ? t('paymentsPage.statusPaid') : t('paymentsPage.statusRefunded')}
        </span>
      ),
    },
    {
      key: 'paidAt',
      label: t('paymentsPage.columns.paid'),
      render: (tx) => (
        <span className="text-[#94A3B8]" dir="ltr">
          {localizeNumber(new Date(tx.paidAt).toLocaleDateString(dateLocale, { day: 'numeric', month: 'short', year: 'numeric' }), i18n.language)}
          {' · '}
          {localizeNumber(new Date(tx.paidAt).toLocaleTimeString(dateLocale, { hour: 'numeric', minute: '2-digit' }), i18n.language)}
        </span>
      ),
    },
  ];

  return (
    <MwasalatAdminLayout
      title={t('admin.nav.payments')}
      subtitle={t('paymentsPage.subtitle')}
    >
      <div className="max-w-6xl mx-auto">
        <div className="grid sm:grid-cols-3 gap-5 mb-6">
          <MwasalatStatCard
            icon={Wallet} iconBg="bg-mwasalatRed-500" sparkColor="#D6293C" label={t('paymentsPage.stats.totalRevenue')}
            value={`OMR ${localizeNumber((summary?.totalRevenue ?? 0).toFixed(2), i18n.language)}`}
            sub={t('paymentsPage.allTime')}
            delta={revenueGrowthPct} deltaLabel={t('paymentsPage.vsLastMonth')}
            sparkline={monthly.map((m) => m.value)}
          />
          <MwasalatStatCard
            icon={TrendingUp} iconBg="bg-[#22C55E]" sparkColor="#22C55E" label={t('paymentsPage.stats.thisMonth')}
            value={`OMR ${localizeNumber((summary?.thisMonthRevenue ?? 0).toFixed(2), i18n.language)}`}
            sub={new Date().toLocaleDateString(dateLocale, { month: 'long', year: 'numeric' })}
            delta={revenueGrowthPct} deltaLabel={t('paymentsPage.vsLastMonth')}
            sparkline={monthly.map((m) => m.value)}
          />
          <MwasalatStatCard
            icon={Receipt} iconBg="bg-blue-500" sparkColor="#3B82F6" label={t('paymentsPage.stats.totalTransactions')}
            value={localizeNumber(summary?.totalTransactions ?? 0, i18n.language)}
            sub={t('paymentsPage.allTime')}
            delta={transactionsGrowthPct} deltaLabel={t('paymentsPage.vsLastMonth')}
            sparkline={monthly.map((m) => m.count)}
          />
        </div>

        <MwasalatDataTable
          columns={COLUMNS}
          rows={rows}
          isLoading={isLoading}
          emptyLabel={t('paymentsPage.empty')}
          searchPlaceholder={t('paymentsPage.searchPlaceholder')}
          searchable={(tx) => `${tx.learner?.name ?? ''} ${tx.learner?.email ?? ''} ${tx.program?.title ?? ''}`}
          filters={(
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-1.5 rounded-lg border border-[#E2E8F0] text-[13px] bg-white text-[#1E293B] focus:outline-none focus:ring-2 focus:ring-mwasalatInk-500/20 hover:border-mwasalatInk-300 transition-colors"
            >
              <option value="all">{t('paymentsPage.allStatus')}</option>
              <option value="paid">{t('paymentsPage.statusPaid')}</option>
              <option value="refunded">{t('paymentsPage.statusRefunded')}</option>
            </select>
          )}
        />
      </div>
    </MwasalatAdminLayout>
  );
}
