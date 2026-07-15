import { useState, useEffect } from 'react';
import { Wallet, TrendingUp, Receipt } from 'lucide-react';
import MwasalatAdminLayout from '../../layouts/MwasalatAdminLayout.jsx';
import MwasalatDataTable from '../../components/mwasalat/MwasalatDataTable.jsx';
import { mwasalatPaymentService } from '../../services/mwasalatPayment.service.js';

const COLUMNS = [
  {
    key: 'learner',
    label: 'Learner',
    render: (t) => (
      <>
        <p className="font-medium text-[#1E293B]">{t.learner?.name}</p>
        <p className="text-xs text-[#94A3B8]">{t.learner?.email}</p>
      </>
    ),
  },
  { key: 'program', label: 'Program', render: (t) => <span className="text-[#475569]">{t.program?.title}</span> },
  { key: 'amount', label: 'Amount', render: (t) => <span className="font-semibold text-[#1E293B]">{t.currency} {t.amount.toFixed(2)}</span> },
  {
    key: 'status',
    label: 'Status',
    render: (t) => (
      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium capitalize ${
        t.status === 'paid' ? 'bg-mwasalatInk-100 text-mwasalatInk-500' : 'bg-[#FBE7E9] text-mwasalatRed-600'
      }`}>
        {t.status}
      </span>
    ),
  },
  {
    key: 'paidAt',
    label: 'Paid',
    render: (t) => (
      <span className="text-[#94A3B8]">
        {new Date(t.paidAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
      </span>
    ),
  },
];

export default function MwasalatAdminPaymentsPage() {
  const [summary, setSummary] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

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

  const stats = [
    { icon: Wallet, label: 'Total Revenue', value: `OMR ${(summary?.totalRevenue ?? 0).toFixed(2)}` },
    { icon: TrendingUp, label: 'This Month', value: `OMR ${(summary?.thisMonthRevenue ?? 0).toFixed(2)}` },
    { icon: Receipt, label: 'Total Transactions', value: summary?.totalTransactions ?? 0 },
  ];

  return (
    <MwasalatAdminLayout title="Payments" subtitle="Revenue and transaction history across the platform">
      <div className="max-w-6xl mx-auto">
        <div className="grid sm:grid-cols-3 gap-5 mb-6">
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

        <MwasalatDataTable
          columns={COLUMNS}
          rows={transactions}
          isLoading={isLoading}
          emptyLabel="No payments recorded yet."
          searchPlaceholder="Search by learner or program…"
          searchable={(t) => `${t.learner?.name ?? ''} ${t.learner?.email ?? ''} ${t.program?.title ?? ''}`}
        />
      </div>
    </MwasalatAdminLayout>
  );
}
