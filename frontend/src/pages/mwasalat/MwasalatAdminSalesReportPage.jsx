import { useState, useEffect } from 'react';
import { Wallet, TrendingUp, Receipt, Printer, FileSpreadsheet, Loader2 } from 'lucide-react';
import MwasalatAdminLayout from '../../layouts/MwasalatAdminLayout.jsx';
import MwasalatDataTable from '../../components/mwasalat/MwasalatDataTable.jsx';
import { TrendChart, HBarChart } from '../../components/mwasalat/MwasalatCharts.jsx';
import { mwasalatPaymentService } from '../../services/mwasalatPayment.service.js';
import { cn } from '../../utils/cn.js';

const PRESETS = [
  { key: 'today', label: 'Today' },
  { key: 'week', label: 'This Week' },
  { key: 'month', label: 'This Month' },
  { key: 'lastMonth', label: 'Last Month' },
  { key: 'all', label: 'All Time' },
  { key: 'custom', label: 'Custom' },
];

// Local Y/M/D components, not toISOString() — avoids shifting a day across the
// UTC boundary the backend then reapplies (`${date}T00:00:00.000Z`).
const toDateStr = (d) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

const formatDisplay = (dateStr) =>
  new Date(`${dateStr}T00:00:00`).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

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

function getRangeLabel(preset, range) {
  if (preset === 'all') return 'All Time';
  if (preset !== 'custom') return PRESETS.find((p) => p.key === preset)?.label ?? '';
  if (!range.from || !range.to) return 'Custom range';
  return `${formatDisplay(range.from)} – ${formatDisplay(range.to)}`;
}

const INK = 'FF23181A';
const INK_TINT = 'FFF6EFEF';

// Styled .xlsx workbook — a title/period header, a small summary block, then the
// full transaction table with bold header fill, currency/date number formats, and
// sized columns. Built client-side from data already loaded for the page.
// `exceljs` is ~800KB — dynamically imported here so it's only fetched when an
// admin actually clicks Export, not bundled into everyone's initial page load.
const buildSalesReportWorkbook = async ({ rangeLabel, report, transactions }) => {
  const { default: ExcelJS } = await import('exceljs');
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Mwasalat Learning Platform';
  workbook.created = new Date();

  const sheet = workbook.addWorksheet('Sales Report');
  sheet.columns = [
    { width: 14 }, { width: 20 }, { width: 26 }, { width: 26 },
    { width: 14 }, { width: 18 }, { width: 12 }, { width: 10 }, { width: 10 },
  ];

  sheet.mergeCells('A1:I1');
  sheet.getCell('A1').value = 'Mwasalat Sales Report';
  sheet.getCell('A1').font = { size: 16, bold: true, color: { argb: INK } };

  sheet.mergeCells('A2:I2');
  sheet.getCell('A2').value = `Period: ${rangeLabel}`;
  sheet.getCell('A2').font = { size: 11, color: { argb: 'FF475569' } };

  sheet.addRow([]);

  const summaryHeaderRow = sheet.addRow(['Total Revenue', 'Total Sales', 'Average Sale Value']);
  summaryHeaderRow.font = { bold: true };
  summaryHeaderRow.eachCell((cell) => {
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: INK_TINT } };
  });
  const summaryValuesRow = sheet.addRow([report.totalRevenue, report.totalSales, report.averageSaleValue]);
  summaryValuesRow.getCell(1).numFmt = '"OMR" #,##0.00';
  summaryValuesRow.getCell(3).numFmt = '"OMR" #,##0.00';

  sheet.addRow([]);

  const tableHeaderRow = sheet.addRow(
    ['Date', 'Learner', 'Email', 'Program', 'Category', 'Instructor', 'Amount', 'Currency', 'Status']
  );
  tableHeaderRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
  tableHeaderRow.eachCell((cell) => {
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: INK } };
  });

  transactions.forEach((t) => {
    const row = sheet.addRow([
      new Date(t.paidAt),
      t.learner?.name ?? '',
      t.learner?.email ?? '',
      t.program?.title ?? '',
      t.program?.category ?? '',
      t.program?.instructor?.name ?? '',
      t.amount,
      t.currency,
      t.status,
    ]);
    row.getCell(1).numFmt = 'dd mmm yyyy';
    row.getCell(7).numFmt = '#,##0.00';
  });

  return workbook;
};

const COLUMNS = [
  {
    key: 'paidAt', label: 'Date',
    render: (t) => <span className="text-[#94A3B8]">{new Date(t.paidAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</span>,
  },
  {
    key: 'learner', label: 'Learner',
    render: (t) => (
      <>
        <p className="font-medium text-[#1E293B]">{t.learner?.name}</p>
        <p className="text-xs text-[#94A3B8]">{t.learner?.email}</p>
      </>
    ),
  },
  { key: 'program', label: 'Program', render: (t) => <span className="text-[#475569]">{t.program?.title}</span> },
  { key: 'category', label: 'Category', render: (t) => <span className="text-[#475569] capitalize">{t.program?.category || '—'}</span> },
  { key: 'instructor', label: 'Instructor', render: (t) => <span className="text-[#475569]">{t.program?.instructor?.name || '—'}</span> },
  { key: 'amount', label: 'Amount', render: (t) => <span className="font-semibold text-[#1E293B]">{t.currency} {t.amount.toFixed(2)}</span> },
  {
    key: 'status', label: 'Status',
    render: (t) => (
      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium capitalize ${
        t.status === 'paid' ? 'bg-mwasalatInk-100 text-mwasalatInk-500' : 'bg-[#FBE7E9] text-mwasalatRed-600'
      }`}>
        {t.status}
      </span>
    ),
  },
];

export default function MwasalatAdminSalesReportPage() {
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

  const stats = report ? [
    { icon: Wallet, label: 'Total Revenue', value: `OMR ${report.totalRevenue.toFixed(2)}` },
    { icon: Receipt, label: 'Total Sales', value: report.totalSales },
    { icon: TrendingUp, label: 'Average Sale Value', value: `OMR ${report.averageSaleValue.toFixed(2)}` },
  ] : [];

  const handlePrint = () => window.print();

  const rangeLabel = getRangeLabel(preset, range);

  const handleExportExcel = async () => {
    const workbook = await buildSalesReportWorkbook({ rangeLabel, report, transactions });
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
    <MwasalatAdminLayout title="Sales Report" subtitle="Revenue analytics, filtered by date range">
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
              <div className="flex items-center gap-2 ml-1">
                <input
                  type="date"
                  value={customFrom}
                  onChange={(e) => setCustomFrom(e.target.value)}
                  className="px-3 py-1.5 rounded-lg border border-[#E2E8F0] text-xs text-[#1E293B]"
                />
                <span className="text-xs text-[#94A3B8]">to</span>
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
              <FileSpreadsheet className="w-3.5 h-3.5" /> Export Excel
            </button>
            <button
              type="button"
              onClick={handlePrint}
              disabled={!report}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-mwasalatInk-500 hover:bg-mwasalatInk-400 text-white text-xs font-semibold transition-colors disabled:opacity-50"
            >
              <Printer className="w-3.5 h-3.5" /> Print / Save as PDF
            </button>
          </div>
        </div>

        <p className="hidden print:block text-sm font-semibold text-[#1E293B] mb-4">
          Sales Report — {rangeLabel}
        </p>

        {isLoading ? (
          <div className="p-16 flex items-center justify-center text-[#94A3B8]">
            <Loader2 className="w-5 h-5 animate-spin mr-2" /> Loading report…
          </div>
        ) : (
          <>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-6">
              {stats.map(({ icon: Icon, label, value }) => (
                <div key={label} className="card p-5">
                  <div className="w-9 h-9 rounded-xl bg-mwasalatInk-100 flex items-center justify-center mb-4">
                    <Icon className="w-4.5 h-4.5 text-mwasalatInk-500" />
                  </div>
                  <p className="text-2xl font-semibold text-[#1E293B]">{value}</p>
                  <p className="text-sm text-[#475569] mt-1">{label}</p>
                </div>
              ))}
            </div>

            <div className="grid lg:grid-cols-2 gap-5 mb-6">
              <div className="card p-5">
                <p className="text-sm font-semibold text-[#1E293B] mb-4">Revenue Trend</p>
                {report?.trend?.length > 1 && report.trend.some((t) => t.value > 0) ? (
                  <TrendChart data={report.trend.map((t) => t.value)} formatValue={(v) => `OMR ${v.toFixed(0)}`} />
                ) : (
                  <p className="text-xs text-[#94A3B8] py-10 text-center">No sales in this range yet.</p>
                )}
              </div>
              <div className="card p-5">
                <p className="text-sm font-semibold text-[#1E293B] mb-4">Top Programs by Revenue</p>
                {report?.topProgramsByRevenue?.length ? (
                  <HBarChart
                    data={report.topProgramsByRevenue.map((p) => ({ label: p.program.title, value: p.revenue }))}
                    formatValue={(v) => `OMR ${v.toFixed(0)}`}
                  />
                ) : (
                  <p className="text-xs text-[#94A3B8] py-10 text-center">No sales in this range yet.</p>
                )}
              </div>
            </div>

            <div className="no-print">
              <MwasalatDataTable
                columns={COLUMNS}
                rows={transactions}
                isLoading={false}
                emptyLabel="No sales in this range."
                searchPlaceholder="Search by learner, program, or instructor…"
                searchable={(t) => `${t.learner?.name ?? ''} ${t.learner?.email ?? ''} ${t.program?.title ?? ''} ${t.program?.instructor?.name ?? ''}`}
              />
            </div>

            {/* Print-only: every matched row, independent of the interactive table's
                on-screen pagination/search — window.print() otherwise would only
                capture whatever 10 rows happen to be on the current page. */}
            <table className="print-only-table w-full text-xs border-collapse">
              <thead>
                <tr className="text-left border-b border-[#E2E8F0]">
                  {COLUMNS.map((col) => (
                    <th key={col.key} className="px-2 py-2 font-semibold text-[#1E293B]">{col.label}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {transactions.map((t) => (
                  <tr key={t._id} className="border-b border-[#F1F5F9]">
                    {COLUMNS.map((col) => (
                      <td key={col.key} className="px-2 py-2 align-top">{col.render(t)}</td>
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
