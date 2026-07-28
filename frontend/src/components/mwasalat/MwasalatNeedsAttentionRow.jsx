import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Sparkles, Loader2, MessageCircle } from 'lucide-react';
import MwasalatRiskBadge from './MwasalatRiskBadge.jsx';
import MwasalatStreakBadge from './MwasalatStreakBadge.jsx';
import { getLocalizedProgramField, localizeNumber } from '../../utils/mwasalatLocalize.js';

const ENCOURAGEMENT_TEMPLATE_KEYS = ['checking_in', 'almost_there', 'we_miss_you'];

// One row of the "Needs Attention" list — risk pill + last-active text +
// streak, a one-click canned "encourage" menu, and a direct chat shortcut.
// Shared by the per-course roster (MwasalatProgramDetailPage) and the
// cross-course "At Risk" / dashboard summary views — `programId` is passed
// in per-row since the cross-course views span more than one course.
export default function MwasalatNeedsAttentionRow({ entry, programId, onEncourage, sendingId, showProgram = false }) {
  const { t, i18n } = useTranslation('mwasalatApp');
  const [menuOpen, setMenuOpen] = useState(false);
  const isSending = sendingId === entry.learner?._id;

  return (
    <div className="flex items-center justify-between gap-3 px-5 py-3.5 border-b border-[#F1F5F9] last:border-0 flex-wrap">
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="text-sm font-medium text-[#1E293B] truncate">{entry.learner?.name}</p>
          <MwasalatRiskBadge level={entry.riskLevel} returned={entry.returned} overdue={entry.overdue} />
          {showProgram && entry.program && (
            <span className="px-2 py-0.5 rounded-full text-[10.5px] font-medium bg-[#F1F5F9] text-[#475569] truncate max-w-[160px]">
              {getLocalizedProgramField(entry.program, 'title', i18n.language)}
            </span>
          )}
        </div>
        <p className="text-xs text-[#94A3B8] mt-0.5">
          {entry.daysSinceActivity != null
            ? localizeNumber(t('programDetail.lastActiveDaysAgo', { count: entry.daysSinceActivity }), i18n.language)
            : t('programDetail.lastActiveNever')}
        </p>
      </div>
      <MwasalatStreakBadge current={entry.currentStreak} />
      <div className="flex items-center gap-2">
        <div className="relative">
          <button
            type="button"
            onClick={() => setMenuOpen((v) => !v)}
            disabled={isSending}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-mwasalatInk-500 bg-mwasalatInk-100 hover:bg-mwasalatInk-200 disabled:opacity-50 transition-colors"
          >
            {isSending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
            {t('programDetail.encourageBtn')}
          </button>
          {menuOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
              <div className="absolute end-0 top-full mt-1 w-56 bg-white rounded-xl shadow-lg border border-[#E2E8F0] py-1.5 z-20">
                {ENCOURAGEMENT_TEMPLATE_KEYS.map((key) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => { setMenuOpen(false); onEncourage(programId, entry.learner?._id, key); }}
                    className="w-full text-start px-3.5 py-2 text-xs text-[#1E293B] hover:bg-[#F1F5F9] transition-colors"
                  >
                    {t(`programDetail.encouragementTemplates.${key}`)}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
        <Link
          to={`/instructor/programs/${programId}/chat/${entry.learner?._id}`}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-mwasalatInk-500 hover:bg-mwasalatInk-400 transition-colors whitespace-nowrap"
        >
          <MessageCircle className="w-3.5 h-3.5" /> {t('programDetail.chatNowBtn')}
        </Link>
      </div>
    </div>
  );
}
