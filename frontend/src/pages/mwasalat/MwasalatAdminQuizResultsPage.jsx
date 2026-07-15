import { useState, useEffect } from 'react';
import { CheckCircle2, XCircle } from 'lucide-react';
import MwasalatAdminLayout from '../../layouts/MwasalatAdminLayout.jsx';
import MwasalatDataTable from '../../components/mwasalat/MwasalatDataTable.jsx';
import { mwasalatQuizService } from '../../services/mwasalatQuiz.service.js';
import { themeForCategory } from '../../utils/mwasalatCategoryTheme.js';

const COLUMNS = [
  {
    key: 'learner',
    label: 'Learner',
    render: (a) => (
      <>
        <p className="font-medium text-[#1E293B]">{a.learner?.name}</p>
        <p className="text-xs text-[#94A3B8]">{a.learner?.email}</p>
      </>
    ),
  },
  { key: 'program', label: 'Program', render: (a) => <span className="text-[#475569]">{a.program?.title}</span> },
  { key: 'score', label: 'Score', render: (a) => <span className="font-semibold text-[#1E293B]">{a.score}%</span> },
  {
    key: 'passed',
    label: 'Result',
    render: (a) => (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
        a.passed ? 'bg-[#DCFCE7] text-[#22C55E]' : 'bg-mwasalatRed-100 text-mwasalatRed-600'
      }`}>
        {a.passed ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
        {a.passed ? 'Passed' : 'Failed'}
      </span>
    ),
  },
  {
    key: 'attemptedAt',
    label: 'Attempted',
    render: (a) => (
      <span className="text-[#94A3B8]">
        {new Date(a.attemptedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
      </span>
    ),
  },
];

export default function MwasalatAdminQuizResultsPage() {
  const [results, setResults] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    mwasalatQuizService.getAdminResults().then(setResults).finally(() => setIsLoading(false));
  }, []);

  return (
    <MwasalatAdminLayout title="Quiz Results" subtitle="Assessment performance across every program">
      <div className="max-w-6xl mx-auto">
        {!isLoading && results?.programResults?.length > 0 && (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 mb-6">
            {results.programResults.map((p) => {
              const theme = themeForCategory(p.program?.category);
              return (
                <div key={p.program?._id} className="card p-5">
                  <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium capitalize mb-3 ${theme.bg} ${theme.text}`}>
                    {p.program?.category || 'General'}
                  </span>
                  <p className="font-semibold text-[#1E293B] leading-snug mb-3">{p.program?.title}</p>
                  <div className="flex items-center justify-between text-sm">
                    <div>
                      <p className="text-xl font-bold text-[#1E293B]">{p.passRate}%</p>
                      <p className="text-xs text-[#94A3B8]">Pass rate</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-bold text-[#1E293B]">{p.avgScore}%</p>
                      <p className="text-xs text-[#94A3B8]">Avg score</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-bold text-[#1E293B]">{p.attempts}</p>
                      <p className="text-xs text-[#94A3B8]">Attempts</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <MwasalatDataTable
          columns={COLUMNS}
          rows={results?.attempts ?? []}
          isLoading={isLoading}
          emptyLabel="No quiz attempts recorded yet."
          searchPlaceholder="Search by learner or program…"
          searchable={(a) => `${a.learner?.name ?? ''} ${a.learner?.email ?? ''} ${a.program?.title ?? ''}`}
        />
      </div>
    </MwasalatAdminLayout>
  );
}
