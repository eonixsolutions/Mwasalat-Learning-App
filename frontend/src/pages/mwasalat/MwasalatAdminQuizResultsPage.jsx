import { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Target, Star, ListChecks, Download, CheckCircle2, XCircle } from 'lucide-react';
import MwasalatAdminLayout from '../../layouts/MwasalatAdminLayout.jsx';
import MwasalatDataTable from '../../components/mwasalat/MwasalatDataTable.jsx';
import { mwasalatQuizService } from '../../services/mwasalatQuiz.service.js';
import { themeForCategory } from '../../utils/mwasalatCategoryTheme.js';
import { getLocalizedProgramField, localizeNumber } from '../../utils/mwasalatLocalize.js';

const initials = (name) => (name ?? '?').trim().split(/\s+/).map((p) => p[0]).slice(0, 2).join('').toUpperCase();

// Pass-rate tier — drives both the ring color on the program cards and the
// "Excellent/Good/Needs Attention" badge, so the two always agree with each
// other (unlike eyeballing two separately-chosen colors).
const tierFor = (passRate) => {
  if (passRate >= 90) return { key: 'excellent', ring: '#22C55E', badgeBg: 'bg-[#DCFCE7]', badgeText: 'text-[#22C55E]' };
  if (passRate >= 70) return { key: 'good', ring: '#3B82F6', badgeBg: 'bg-blue-50', badgeText: 'text-blue-600' };
  return { key: 'needsAttention', ring: '#F59E0B', badgeBg: 'bg-amber-50', badgeText: 'text-amber-600' };
};

function PassRateRing({ value, color, size = 78 }) {
  const { t, i18n } = useTranslation('mwasalatApp');
  const r = (size - 10) / 2;
  const circumference = 2 * Math.PI * r;
  const filled = (Math.max(0, Math.min(100, value)) / 100) * circumference;
  return (
    <div className="relative flex-shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden="true">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#F1F5F9" strokeWidth="8" />
        <circle
          cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth="8"
          strokeDasharray={`${filled} ${circumference}`} strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <p className="text-base font-bold text-[#1E293B]" dir="ltr">{localizeNumber(Math.round(value), i18n.language)}%</p>
        <p className="text-[9px] text-[#94A3B8] leading-none mt-0.5">{t('quizResultsPage.passRate')}</p>
      </div>
    </div>
  );
}

function ProgramPerformanceCard({ p }) {
  const { t, i18n } = useTranslation('mwasalatApp');
  const theme = themeForCategory(p.program?.category ?? '');
  const tier = tierFor(p.passRate);
  return (
    <div className="card p-4">
      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium capitalize mb-2.5 ${theme.bg} ${theme.text}`}>
        {getLocalizedProgramField(p.program, 'category', i18n.language) || t('programCard.generalCategory')}
      </span>
      <p className="font-semibold text-[#1E293B] leading-snug mb-3 line-clamp-2">{getLocalizedProgramField(p.program, 'title', i18n.language)}</p>
      <div className="flex items-center gap-4">
        <PassRateRing value={p.passRate} color={tier.ring} />
        <div className="space-y-1.5 min-w-0 flex-1">
          <div className="flex items-center gap-1.5 text-xs">
            <Star className="w-3 h-3 text-amber-400 flex-shrink-0" />
            <span className="text-[#475569]">{localizeNumber(p.avgScore, i18n.language)}% {t('quizResultsPage.avgScore')}</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs">
            <ListChecks className="w-3 h-3 text-[#94A3B8] flex-shrink-0" />
            <span className="text-[#475569]">{localizeNumber(p.attempts, i18n.language)} {t('quizResultsPage.attempts')}</span>
          </div>
        </div>
      </div>
      <span className={`inline-flex items-center mt-3 px-2.5 py-1 rounded-full text-[11px] font-medium ${tier.badgeBg} ${tier.badgeText}`}>
        {t(`quizResultsPage.tiers.${tier.key}`)}
      </span>
    </div>
  );
}

export default function MwasalatAdminQuizResultsPage() {
  const { t, i18n } = useTranslation('mwasalatApp');
  const dateLocale = i18n.language.startsWith('ar') ? 'ar-OM' : 'en-GB';
  const [results, setResults] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [tab, setTab] = useState('all');
  const [programFilter, setProgramFilter] = useState('all');

  useEffect(() => {
    mwasalatQuizService.getAdminResults().then(setResults).finally(() => setIsLoading(false));
  }, []);

  const totalAttempts = results?.totalAttempts ?? 0;
  const avgPassRate = totalAttempts ? Math.round(((results?.passedAttempts ?? 0) / totalAttempts) * 100) : 0;
  const growthPct = results?.attemptsPrevious30Days
    ? Math.round(((results.attemptsLast30Days - results.attemptsPrevious30Days) / results.attemptsPrevious30Days) * 100)
    : null;

  const programOptions = useMemo(() => {
    const map = new Map();
    (results?.attempts ?? []).forEach((a) => { if (a.program?._id) map.set(a.program._id, a.program); });
    return [...map.values()];
  }, [results]);

  const tabbedAttempts = useMemo(() => {
    const all = results?.attempts ?? [];
    if (tab === 'top') return all.filter((a) => a.passed && a.score >= 90).sort((a, b) => b.score - a.score);
    if (tab === 'risk') return all.filter((a) => !a.passed);
    return all;
  }, [results, tab]);

  const rows = useMemo(() => (
    programFilter === 'all' ? tabbedAttempts : tabbedAttempts.filter((a) => a.program?._id === programFilter)
  ), [tabbedAttempts, programFilter]);

  const handleExportCsv = () => {
    const header = ['Learner', 'Email', 'Program', 'Score', 'Result', 'Attempted On'];
    const csvRows = rows.map((a) => [
      a.learner?.name ?? '',
      a.learner?.email ?? '',
      a.program?.title ?? '',
      a.score,
      a.passed ? 'Passed' : 'Failed',
      new Date(a.attemptedAt).toISOString().slice(0, 10),
    ]);
    const csv = [header, ...csvRows]
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      .join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'mwasalat-quiz-results.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const COLUMNS = [
    {
      key: 'learner',
      label: t('common.name'),
      render: (a) => {
        const theme = themeForCategory(a.learner?.name ?? '');
        return (
          <div className="flex items-center gap-2.5">
            <span className={`w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-semibold flex-shrink-0 ${theme.bg} ${theme.text}`}>
              {initials(a.learner?.name)}
            </span>
            <div className="min-w-0">
              <p className="font-medium text-[#1E293B] truncate">{a.learner?.name}</p>
              <p className="text-xs text-[#94A3B8] truncate" dir="ltr">{a.learner?.email}</p>
            </div>
          </div>
        );
      },
    },
    { key: 'program', label: t('admin.nav.programs'), render: (a) => <span className="text-[#475569]">{getLocalizedProgramField(a.program, 'title', i18n.language)}</span> },
    { key: 'score', label: t('quizResultsPage.columns.score'), render: (a) => <span className="font-semibold text-[#1E293B]">{localizeNumber(a.score, i18n.language)}%</span> },
    {
      key: 'passed',
      label: t('quizResultsPage.columns.result'),
      render: (a) => (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
          a.passed ? 'bg-[#DCFCE7] text-[#22C55E]' : 'bg-mwasalatRed-100 text-mwasalatRed-600'
        }`}>
          {a.passed ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
          {a.passed ? t('learnerDetail.passed') : t('learnerDetail.failed')}
        </span>
      ),
    },
    {
      key: 'attemptedAt',
      label: t('quizResultsPage.columns.attempted'),
      render: (a) => (
        <span className="text-[#94A3B8]" dir="ltr">
          {localizeNumber(new Date(a.attemptedAt).toLocaleDateString(dateLocale, { day: 'numeric', month: 'short', year: 'numeric' }), i18n.language)}
        </span>
      ),
    },
  ];

  const TABS = [
    { value: 'all', label: t('quizResultsPage.tabs.all') },
    { value: 'top', label: t('quizResultsPage.tabs.top') },
    { value: 'risk', label: t('quizResultsPage.tabs.risk') },
  ];

  return (
    <MwasalatAdminLayout title={t('admin.nav.quizResults')} subtitle={t('quizResultsPage.subtitle')}>
      <div className="max-w-6xl mx-auto">
        {!isLoading && (
          <div className="rounded-2xl p-5 sm:p-6 mb-6 flex flex-wrap items-center gap-6" style={{ background: 'linear-gradient(135deg, #FBE7E9 0%, #FDEBED 100%)' }}>
            <div className="w-14 h-14 rounded-2xl bg-mwasalatRed-500 flex items-center justify-center flex-shrink-0">
              <Target className="w-6 h-6 text-white" />
            </div>
            <div className="flex flex-wrap gap-x-10 gap-y-4 flex-1">
              <div>
                <p className="text-2xl font-bold text-[#1E293B]" dir="ltr">{localizeNumber(results?.totalQuizzes ?? 0, i18n.language)}</p>
                <p className="text-xs text-[#475569] font-medium">{t('quizResultsPage.stats.totalQuizzes')}</p>
                <p className="text-[11px] text-[#94A3B8]">{t('quizResultsPage.stats.activeInSystem')}</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-[#1E293B]" dir="ltr">{localizeNumber(totalAttempts, i18n.language)}</p>
                <p className="text-xs text-[#475569] font-medium">{t('quizResultsPage.stats.totalAttempts')}</p>
                {growthPct !== null ? (
                  <p className={`text-[11px] font-medium ${growthPct >= 0 ? 'text-green-600' : 'text-mwasalatRed-600'}`}>
                    {growthPct >= 0 ? '↑' : '↓'} {growthPct >= 0 ? '+' : ''}{localizeNumber(growthPct, i18n.language)}% {t('quizResultsPage.stats.last30Days')}
                  </p>
                ) : (
                  <p className="text-[11px] text-[#94A3B8]">{t('quizResultsPage.stats.last30DaysNoData')}</p>
                )}
              </div>
              <div>
                <p className="text-2xl font-bold text-[#1E293B]" dir="ltr">{localizeNumber(avgPassRate, i18n.language)}%</p>
                <p className="text-xs text-[#475569] font-medium">{t('quizResultsPage.stats.avgPassRate')}</p>
                <p className="text-[11px] text-[#94A3B8]">{t('quizResultsPage.stats.acrossPrograms')}</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-[#1E293B]" dir="ltr">{localizeNumber(results?.totalCertificates ?? 0, i18n.language)}</p>
                <p className="text-xs text-[#475569] font-medium">{t('quizResultsPage.stats.certificatesIssued')}</p>
                <p className="text-[11px] text-[#94A3B8]">{t('quizResultsPage.stats.basedOnCompletion')}</p>
              </div>
            </div>
          </div>
        )}

        {!isLoading && results?.programResults?.length > 0 && (
          <>
            <p className="text-sm font-semibold text-[#1E293B] mb-3">{t('quizResultsPage.programPerformance')}</p>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
              {results.programResults.map((p) => <ProgramPerformanceCard key={p.program?._id} p={p} />)}
            </div>
          </>
        )}

        <div className="flex items-center gap-5 border-b border-[#E2E8F0] mb-4">
          {TABS.map(({ value, label }) => (
            <button
              key={value}
              onClick={() => setTab(value)}
              className={`pb-2.5 -mb-px text-sm font-medium border-b-2 transition-colors ${
                tab === value ? 'border-mwasalatRed-500 text-mwasalatRed-600' : 'border-transparent text-[#94A3B8] hover:text-[#475569]'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <MwasalatDataTable
          columns={COLUMNS}
          rows={rows}
          isLoading={isLoading}
          emptyLabel={t('quizResultsPage.empty')}
          searchPlaceholder={t('quizResultsPage.searchPlaceholder')}
          searchable={(a) => `${a.learner?.name ?? ''} ${a.learner?.email ?? ''} ${a.program?.title ?? ''}`}
          filters={(
            <>
              <select
                value={programFilter}
                onChange={(e) => setProgramFilter(e.target.value)}
                className="px-3 py-1.5 rounded-lg border border-[#E2E8F0] text-[13px] bg-white text-[#1E293B] focus:outline-none focus:ring-2 focus:ring-mwasalatInk-500/20 hover:border-mwasalatInk-300 transition-colors"
              >
                <option value="all">{t('quizResultsPage.allPrograms')}</option>
                {programOptions.map((p) => (
                  <option key={p._id} value={p._id}>{getLocalizedProgramField(p, 'title', i18n.language)}</option>
                ))}
              </select>
              {rows.length > 0 && (
                <button
                  type="button"
                  onClick={handleExportCsv}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#E2E8F0] text-[13px] font-medium text-[#475569] hover:bg-[#F1F5F9] transition-colors flex-shrink-0"
                >
                  <Download className="w-3.5 h-3.5" /> {t('quizResultsPage.export')}
                </button>
              )}
            </>
          )}
        />
      </div>
    </MwasalatAdminLayout>
  );
}
