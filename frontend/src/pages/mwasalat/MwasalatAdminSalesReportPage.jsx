import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { Wallet, TrendingUp, Receipt, Printer, FileSpreadsheet, Loader2, ArrowRight } from 'lucide-react';
import MwasalatAdminLayout from '../../layouts/MwasalatAdminLayout.jsx';
import MwasalatDataTable from '../../components/mwasalat/MwasalatDataTable.jsx';
import MwasalatStatCard from '../../components/mwasalat/MwasalatStatCard.jsx';
import { LabeledAreaChart, HBarChart } from '../../components/mwasalat/MwasalatCharts.jsx';
import { mwasalatPaymentService } from '../../services/mwasalatPayment.service.js';
import { cn } from '../../utils/cn.js';
import { getLocalizedProgramField, localizeNumber } from '../../utils/mwasalatLocalize.js';

// Local Y/M/D components, not toISOString() — avoids shifting a day across the
// UTC boundary the backend then reapplies (`${date}T00:00:00.000Z`).
const toDateStr = (d) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

const formatDisplay = (dateStr, locale = 'en-GB', lang = 'en') =>
  localizeNumber(new Date(`${dateStr}T00:00:00`).toLocaleDateString(locale, { day: 'numeric', month: 'short', year: 'numeric' }), lang);

function getPresetRange(preset, customFrom, customTo) {
  const now = new Date();
  if (preset === 'today') return { from: toDateStr(now), to: toDateStr(now) };
  if (preset === 'week') {
    const diffToMonday = (now.getDay() + 6) % 7;
    const start = new Date(now);
    start.setDate(now.getDate() - diffToMonday);
    return { from: toDateStr(start), to: toDateStr(now) };
  }
  if (preset === 'month') {
    return { from: toDateStr(new Date(now.getFullYear(), now.getMonth(), 1)), to: toDateStr(now) };
  }
  if (preset === 'lastMonth') {
    const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const end = new Date(now.getFullYear(), now.getMonth(), 0);
    return { from: toDateStr(start), to: toDateStr(end) };
  }
  if (preset === 'custom') return { from: customFrom || undefined, to: customTo || undefined };
  return { from: undefined, to: undefined }; // 'all'
}

function getRangeLabel(preset, range, presets, t, locale, lang) {
  if (preset === 'all') return t('salesReportPage.presets.all');
  if (preset !== 'custom') return presets.find((p) => p.key === preset)?.label ?? '';
  if (!range.from || !range.to) return t('salesReportPage.customRangeLabel');
  return `${formatDisplay(range.from, locale, lang)} – ${formatDisplay(range.to, locale, lang)}`;
}

const INK = 'FF23181A';
const INK_TINT = 'FFF6EFEF';

// Styled .xlsx workbook — a title/period header, a small summary block, then the
// full transaction table with bold header fill, currency/date number formats, and
// sized columns. Built client-side from data already loaded for the page.
// `exceljs` is ~800KB — dynamically imported here so it's only fetched when an
// admin actually clicks Export, not bundled into everyone's initial page load.
// `t` is the i18next translate function from the calling component — plain
// function reference, safe to invoke outside a component/hook context.
const buildSalesReportWorkbook = async ({ rangeLabel, report, transactions, t }) => {
  const { default: ExcelJS } = await import('exceljs');
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Mwasalat Learning Platform';
  workbook.created = new Date();

  const sheet = workbook.addWorksheet(t('salesReportPage.title'));
  sheet.columns = [
    { width: 14 }, { width: 20 }, { width: 26 }, { width: 26 },
    { width: 14 }, { width: 18 }, { width: 12 }, { width: 10 }, { width: 10 },
  ];

  sheet.mergeCells('A1:I1');
  sheet.getCell('A1').value = t('salesReportPage.workbook.heading');
  sheet.getCell('A1').font = { size: 16, bold: true, color: { argb: INK } };

  sheet.mergeCells('A2:I2');
  sheet.getCell('A2').value = t('salesReportPage.workbook.periodLabel', { range: rangeLabel });
  sheet.getCell('A2').font = { size: 11, color: { argb: 'FF475569' } };

  sheet.addRow([]);

  const summaryHeaderRow = sheet.addRow([
    t('salesReportPage.stats.totalRevenue'), t('salesReportPage.stats.totalSales'), t('salesReportPage.stats.averageSaleValue'),
  ]);
  summaryHeaderRow.font = { bold: true };
  summaryHeaderRow.eachCell((cell) => {
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: INK_TINT } };
  });
  const summaryValuesRow = sheet.addRow([report.totalRevenue, report.totalSales, report.averageSaleValue]);
  summaryValuesRow.getCell(1).numFmt = '"OMR" #,##0.00';
  summaryValuesRow.getCell(3).numFmt = '"OMR" #,##0.00';

  sheet.addRow([]);

  const tableHeaderRow = sheet.addRow([
    t('salesReportPage.columns.date'), t('common.name'), t('common.email'), t('admin.nav.programs'),
    t('salesReportPage.columns.category'), t('salesReportPage.columns.instructor'),
    t('paymentsPage.columns.amount'), t('salesReportPage.columns.currency'), t('common.status'),
  ]);
  tableHeaderRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
  tableHeaderRow.eachCell((cell) => {
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: INK } };
  });

  transactions.forEach((tx) => {
    const row = sheet.addRow([
      new Date(tx.paidAt),
      tx.learner?.name ?? '',
      tx.learner?.email ?? '',
      tx.program?.title ?? '',
      tx.program?.category ?? '',
      tx.program?.instructor?.name ?? '',
      tx.amount,
      tx.currency,
      tx.status,
    ]);
    row.getCell(1).numFmt = 'dd mmm yyyy';
    row.getCell(7).numFmt = '#,##0.00';
  });

  return workbook;
};

export default function MwasalatAdminSalesReportPage() {
  const { t, i18n } = useTranslation('mwasalatApp');
  const dateLocale = i18n.language.startsWith('ar') ? 'ar-OM' : 'en-GB';

  const PRESETS = [
    { key: 'today', label: t('salesReportPage.presets.today') },
    { key: 'week', label: t('salesReportPage.presets.week') },
    { key: 'month', label: t('salesReportPage.presets.month') },
    { key: 'lastMonth', label: t('salesReportPage.presets.lastMonth') },
    { key: 'all', label: t('salesReportPage.presets.all') },
    { key: 'custom', label: t('salesReportPage.presets.custom') },
  ];

  const COLUMNS = [
    {
      key: 'paidAt', label: t('salesReportPage.columns.date'),
      render: (tx) => <span className="text-[#94A3B8]" dir="ltr">{localizeNumber(new Date(tx.paidAt).toLocaleDateString(dateLocale, { day: 'numeric', month: 'short', year: 'numeric' }), i18n.language)}</span>,
    },
    {
      key: 'learner', label: t('common.name'),
      render: (tx) => (
        <>
          <p className="font-medium text-[#1E293B]">{tx.learner?.name}</p>
          <p className="text-xs text-[#94A3B8]" dir="ltr">{tx.learner?.email}</p>
        </>
      ),
    },
    { key: 'program', label: t('admin.nav.programs'), render: (tx) => <span className="text-[#475569]">{getLocalizedProgramField(tx.program, 'title', i18n.language)}</span> },
    { key: 'category', label: t('salesReportPage.columns.category'), render: (tx) => <span className="text-[#475569] capitalize">{getLocalizedProgramField(tx.program, 'category', i18n.language) || '—'}</span> },
    { key: 'instructor', label: t('salesReportPage.columns.instructor'), render: (tx) => <span className="text-[#475569]">{tx.program?.instructor?.name || '—'}</span> },
    { key: 'amount', label: t('paymentsPage.columns.amount'), render: (tx) => <span className="font-semibold text-[#1E293B]" dir="ltr">{tx.currency} {localizeNumber(tx.amount.toFixed(2), i18n.language)}</span> },
    {
      key: 'status', label: t('common.status'),
      render: (tx) => (
        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium capitalize ${
          tx.status === 'paid' ? 'bg-mwasalatInk-100 text-mwasalatInk-500' : 'bg-[#FBE7E9] text-mwasalatRed-600'
        }`}>
          {tx.status === 'paid' ? t('paymentsPage.statusPaid') : t('paymentsPage.statusRefunded')}
        </span>
      ),
    },
  ];

  const [preset, setPreset] = useState('month');
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');
  const [report, setReport] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const range = getPresetRange(preset, customFrom, customTo);
  const rangeReady = preset !== 'custom' || (customFrom && customTo);

  useEffect(() => {
    if (!rangeReady) return;
    setIsLoading(true);
    Promise.all([
      mwasalatPaymentService.getSalesReport(range),
      mwasalatPaymentService.listReportTransactions(range),
    ])
      .then(([reportData, txData]) => {
        setReport(reportData);
        setTransactions(txData.transactions);
      })
      .finally(() => setIsLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [preset, customFrom, customTo, rangeReady]);

  // "vs previous period" — the equal-length window immediately before the
  // selected range (see previousPeriod in getSalesReport), so this stays
  // meaningful across every preset and custom range, not just "This Month".
  const prev = report?.previousPeriod;
  const revenueGrowthPct = prev?.totalRevenue ? Math.round(((report.totalRevenue - prev.totalRevenue) / prev.totalRevenue) * 100) : null;
  const salesGrowthPct = prev?.totalSales ? Math.round(((report.totalSales - prev.totalSales) / prev.totalSales) * 100) : null;
  const avgSaleGrowthPct = prev?.averageSaleValue ? Math.round(((report.averageSaleValue - prev.averageSaleValue) / prev.averageSaleValue) * 100) : null;

  const revenueSparkline = report?.trend?.map((pt) => pt.value) ?? [];
  const salesSparkline = report?.trend?.map((pt) => pt.count) ?? [];
  const avgSaleSparkline = report?.trend?.map((pt) => (pt.count ? pt.value / pt.count : 0)) ?? [];

  const stats = report ? [
    {
      icon: Wallet, iconBg: 'bg-mwasalatRed-500', sparkColor: '#D6293C',
      label: t('salesReportPage.stats.totalRevenue'), value: `OMR ${localizeNumber(report.totalRevenue.toFixed(2), i18n.language)}`,
      delta: revenueGrowthPct, sparkline: revenueSparkline,
    },
    {
      icon: Receipt, iconBg: 'bg-[#22C55E]', sparkColor: '#22C55E',
      label: t('salesReportPage.stats.totalSales'), value: localizeNumber(report.totalSales, i18n.language),
      delta: salesGrowthPct, sparkline: salesSparkline,
    },
    {
      icon: TrendingUp, iconBg: 'bg-amber-400', sparkColor: '#F59E0B',
      label: t('salesReportPage.stats.averageSaleValue'), value: `OMR ${localizeNumber(report.averageSaleValue.toFixed(2), i18n.language)}`,
      delta: avgSaleGrowthPct, sparkline: avgSaleSparkline,
    },
  ] : [];

  const handlePrint = () => window.print();

  const rangeLabel = getRangeLabel(preset, range, PRESETS, t, dateLocale, i18n.language);

  const handleExportExcel = async () => {
    const workbook = await buildSalesReportWorkbook({ rangeLabel, report, transactions, t });
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `mwasalat-sales-report-${preset}.xlsx`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <MwasalatAdminLayout title={t('admin.nav.salesReport')} subtitle={t('salesReportPage.subtitle')}>
      <style>{`
        @media print {
          .no-print { display: none !important; }
          .print-only-table { display: table !important; }
          aside, header { display: none !important; }
          main { padding: 0 !important; }
          body { background: #fff !important; }
        }
        .print-only-table { display: none; }
      `}</style>

      <div className="max-w-6xl mx-auto">
        <div className="no-print flex flex-wrap items-center justify-between gap-3 mb-6">
          <div className="flex flex-wrap items-center gap-2">
            {PRESETS.map((p) => (
              <button
                key={p.key}
                type="button"
                onClick={() => setPreset(p.key)}
                className={cn(
                  'px-3.5 py-1.5 rounded-full text-xs font-semibold transition-colors',
                  preset === p.key
                    ? 'bg-mwasalatInk-500 text-white'
                    : 'border border-[#E2E8F0] text-[#475569] hover:bg-[#F1F5F9]'
                )}
              >
                {p.label}
              </button>
            ))}
            {preset === 'custom' && (
              <div className="flex items-center gap-2 ms-1">
                <input
                  type="date"
                  value={customFrom}
                  onChange={(e) => setCustomFrom(e.target.value)}
                  className="px-3 py-1.5 rounded-lg border border-[#E2E8F0] text-xs text-[#1E293B]"
                />
                <span className="text-xs text-[#94A3B8]">{t('salesReportPage.rangeTo')}</span>
                <input
                  type="date"
                  value={customTo}
                  onChange={(e) => setCustomTo(e.target.value)}
                  className="px-3 py-1.5 rounded-lg border border-[#E2E8F0] text-xs text-[#1E293B]"
                />
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleExportExcel}
              disabled={!transactions.length}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-[#E2E8F0] text-xs font-semibold text-[#475569] hover:bg-[#F1F5F9] transition-colors disabled:opacity-50"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" /> {t('salesReportPage.exportExcel')}
            </button>
            <button
              type="button"
              onClick={handlePrint}
              disabled={!report}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-mwasalatInk-500 hover:bg-mwasalatInk-400 text-white text-xs font-semibold transition-colors disabled:opacity-50"
            >
              <Printer className="w-3.5 h-3.5" /> {t('salesReportPage.printSaveAsPdf')}
            </button>
          </div>
        </div>

        <p className="hidden print:block text-sm font-semibold text-[#1E293B] mb-4">
          {t('salesReportPage.printHeading', { range: rangeLabel })}
        </p>

        {isLoading ? (
          <div className="p-16 flex items-center justify-center text-[#94A3B8]">
            <Loader2 className="w-5 h-5 animate-spin me-2" /> {t('salesReportPage.loadingReport')}
          </div>
        ) : (
          <>
            <div className="grid sm:grid-cols-3 gap-5 mb-6">
              {stats.map(({ icon, iconBg, sparkColor, label, value, delta, sparkline }) => (
                <MwasalatStatCard
                  key={label}
                  icon={icon} iconBg={iconBg} sparkColor={sparkColor}
                  label={label} value={value}
                  sub={rangeLabel}
                  delta={delta} deltaLabel={t('salesReportPage.vsPreviousPeriod')}
                  sparkline={sparkline}
                />
              ))}
            </div>

            <div className="grid lg:grid-cols-2 gap-5 mb-6">
              <div className="card p-5">
                <p className="text-sm font-semibold text-[#1E293B] mb-4">{t('salesReportPage.charts.revenueTrend')}</p>
                {report?.trend?.length > 1 && report.trend.some((pt) => pt.value > 0) ? (
                  <LabeledAreaChart points={report.trend.map((pt) => ({ label: pt.label, value: pt.value }))} />
                ) : (
                  <p className="text-xs text-[#94A3B8] py-10 text-center">{t('salesReportPage.charts.noSales')}</p>
                )}
              </div>
              <div className="card p-5">
                <div className="flex items-center justify-between mb-4">
                  <p className="text-sm font-semibold text-[#1E293B]">{t('salesReportPage.charts.topProgramsByRevenue')}</p>
                  <Link to="/admin/programs" className="inline-flex items-center gap-0.5 text-xs font-medium text-mwasalatInk-500 hover:text-mwasalatInk-400 transition-colors flex-shrink-0">
                    {t('adminDashboard.activity.viewAll')} <ArrowRight className="w-3 h-3 rtl:rotate-180" />
                  </Link>
                </div>
                {report?.topProgramsByRevenue?.length ? (
                  <HBarChart
                    data={report.topProgramsByRevenue.map((p) => ({ label: getLocalizedProgramField(p.program, 'title', i18n.language), value: p.revenue }))}
                    formatValue={(v) => `OMR ${v.toFixed(0)}`}
                  />
                ) : (
                  <p className="text-xs text-[#94A3B8] py-10 text-center">{t('salesReportPage.charts.noSales')}</p>
                )}
              </div>
            </div>

            <div className="no-print">
              <MwasalatDataTable
                columns={COLUMNS}
                rows={transactions}
                isLoading={false}
                emptyLabel={t('salesReportPage.emptyRange')}
                searchPlaceholder={t('salesReportPage.searchPlaceholder')}
                searchable={(tx) => `${tx.learner?.name ?? ''} ${tx.learner?.email ?? ''} ${tx.program?.title ?? ''} ${tx.program?.instructor?.name ?? ''}`}
              />
            </div>

            {/* Print-only: every matched row, independent of the interactive table's
                on-screen pagination/search — window.print() otherwise would only
                capture whatever 10 rows happen to be on the current page. */}
            <table className="print-only-table w-full text-xs border-collapse">
              <thead>
                <tr className="text-start border-b border-[#E2E8F0]">
                  {COLUMNS.map((col) => (
                    <th key={col.key} className="px-2 py-2 font-semibold text-[#1E293B]">{col.label}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {transactions.map((tx) => (
                  <tr key={tx._id} className="border-b border-[#F1F5F9]">
                    {COLUMNS.map((col) => (
                      <td key={col.key} className="px-2 py-2 align-top">{col.render(tx)}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}
      </div>
    </MwasalatAdminLayout>
  );
}
