import { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { Search, AlertTriangle, Loader2 } from 'lucide-react';
import MwasalatInstructorLayout from '../../layouts/MwasalatInstructorLayout.jsx';
import MwasalatNeedsAttentionRow from '../../components/mwasalat/MwasalatNeedsAttentionRow.jsx';
import { mwasalatProgramService } from '../../services/mwasalatProgram.service.js';
import { localizeNumber } from '../../utils/mwasalatLocalize.js';

const RISK_SEVERITY = { churned: 3, inactive: 2, at_risk: 1, on_track: 0 };

export default function MwasalatInstructorAtRiskPage() {
  const { t, i18n } = useTranslation('mwasalatApp');
  const [needsAttention, setNeedsAttention] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [encouragingId, setEncouragingId] = useState(null);

  useEffect(() => {
    mwasalatProgramService.getMyRoster()
      .then(({ needsAttention: list }) => setNeedsAttention(list))
      .finally(() => setIsLoading(false));
  }, []);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    const rows = q ? needsAttention.filter((s) => s.learner?.name?.toLowerCase().includes(q) || s.learner?.email?.toLowerCase().includes(q)) : needsAttention;
    return [...rows].sort((a, b) => {
      if (a.returned !== b.returned) return a.returned ? -1 : 1;
      return (RISK_SEVERITY[b.riskLevel] ?? 0) - (RISK_SEVERITY[a.riskLevel] ?? 0);
    });
  }, [needsAttention, query]);

  const handleEncourage = async (programId, learnerId, templateKey) => {
    setEncouragingId(learnerId);
    try {
      await mwasalatProgramService.sendEncouragement(programId, learnerId, templateKey);
      toast.success(t('programDetail.toastEncouragementSent'));
    } catch (err) {
      toast.error(err.response?.data?.message || t('programDetail.toastEncouragementFailed'));
    } finally {
      setEncouragingId(null);
    }
  };

  return (
    <MwasalatInstructorLayout
      title={t('instructorAtRisk.title')}
      subtitle={localizeNumber(t('instructorAtRisk.subtitle', { count: needsAttention.length }), i18n.language)}
    >
      <div className="max-w-4xl mx-auto">
        <div className="relative mb-4">
          <Search className="w-4 h-4 text-[#94A3B8] absolute start-3.5 top-1/2 -translate-y-1/2" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t('instructorAtRisk.searchPlaceholder')}
            className="w-full ps-10 pe-4 py-2.5 rounded-xl border border-[#E2E8F0] text-sm bg-white text-[#1E293B] placeholder:text-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-mwasalatInk-500/20 hover:border-mwasalatInk-300 transition-colors"
          />
        </div>

        <div className="card overflow-hidden">
          {isLoading ? (
            <div className="p-10 flex items-center justify-center text-[#94A3B8] text-sm">
              <Loader2 className="w-4 h-4 animate-spin me-2" /> {t('instructorAtRisk.loading')}
            </div>
          ) : visible.length === 0 ? (
            <div className="p-10 text-center">
              <AlertTriangle className="w-7 h-7 text-mwasalatInk-400 mx-auto mb-2.5" />
              <p className="text-sm text-[#475569]">{needsAttention.length === 0 ? t('instructorAtRisk.emptyAll') : t('instructorAtRisk.emptyMatch')}</p>
            </div>
          ) : (
            visible.map((entry) => (
              <MwasalatNeedsAttentionRow
                key={entry._id}
                entry={entry}
                programId={entry.program?._id}
                onEncourage={handleEncourage}
                sendingId={encouragingId}
                showProgram
              />
            ))
          )}
        </div>
      </div>
    </MwasalatInstructorLayout>
  );
}
