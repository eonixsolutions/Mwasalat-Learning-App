import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Clock, CheckCircle2, ChevronRight, MessageCircle, Star } from 'lucide-react';
import { themeForCategory } from '../../utils/mwasalatCategoryTheme.js';
import { stageProgress } from '../../utils/mwasalatProgress.js';
import { useMwasalatChatStore } from '../../store/mwasalatChatStore.js';
import { getLocalizedProgramField, localizeNumber } from '../../utils/mwasalatLocalize.js';
import MwasalatProgressRoad from './MwasalatProgressRoad.jsx';
import MwasalatStreakBadge from './MwasalatStreakBadge.jsx';

export default function MwasalatEnrollmentCard({ enrollment: e, completion: c, onToggleStar }) {
  const { t, i18n } = useTranslation('mwasalatApp');
  const theme = themeForCategory(e.program?.category);
  const progress = stageProgress(c);
  const unreadCount = useMwasalatChatStore(
    (s) => s.conversations.find((conv) => conv.program?._id === e.program?._id)?.unreadCount ?? 0
  );
  const locale = i18n.language === 'ar' ? 'ar-OM' : undefined;
  const title = getLocalizedProgramField(e.program, 'title', i18n.language);
  const category = getLocalizedProgramField(e.program, 'category', i18n.language);

  const handleStarClick = (event) => {
    event.preventDefault();
    event.stopPropagation();
    onToggleStar?.(e);
  };

  return (
    <Link
      to={`/mwasalat/learner/programs/${e.program?._id}`}
      data-card-id={e.program?._id}
      className="card card-hover overflow-hidden flex flex-col relative"
    >
      {onToggleStar && (
        <button
          type="button"
          onClick={handleStarClick}
          title={t(e.isStarred ? 'learner.dashboard.unstarCourse' : 'learner.dashboard.starCourse')}
          className={`absolute top-2.5 start-2.5 z-10 w-7 h-7 rounded-full flex items-center justify-center transition-colors ${
            e.isStarred ? 'bg-[#FEF3C7] text-[#F59E0B]' : 'bg-white/90 text-[#94A3B8] hover:text-[#F59E0B] shadow-sm'
          }`}
        >
          <Star className={`w-3.5 h-3.5 ${e.isStarred ? 'fill-current' : ''}`} />
        </button>
      )}
      {unreadCount > 0 && (
        <div className="absolute top-2.5 end-2.5 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-mwasalatRed-500 text-white shadow-sm z-10">
          <MessageCircle className="w-3 h-3" /> {localizeNumber(unreadCount > 9 ? '9+' : unreadCount, i18n.language)}
        </div>
      )}
      <div className="h-1" style={{ background: `linear-gradient(90deg, ${theme.solid}, ${theme.solid}99)` }} />
      <div className="p-3 flex flex-col flex-1">
        {/* The star toggle floats top-start over this row (w-7 h-7 at top-2.5/start-2.5)
            — reserve room so it doesn't sit on top of the category pill's text. */}
        <div className={`flex items-center justify-between mb-1.5 ${onToggleStar ? 'ps-8' : ''}`}>
          <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium capitalize ${theme.bg} ${theme.text}`}>
            {category || t('programCard.generalCategory')}
          </span>
          <div className="flex items-center gap-1.5">
            {!c?.certificateIssued && c?.streak?.current > 0 && <MwasalatStreakBadge current={c.streak.current} />}
            {c?.certificateIssued ? (
              <CheckCircle2 className="w-4 h-4 text-[#22C55E]" />
            ) : (
              <Clock className="w-3.5 h-3.5 text-[#94A3B8]" />
            )}
          </div>
        </div>

        <h3 className="text-[13px] font-semibold text-[#1E293B] leading-snug mb-0.5 line-clamp-2">{title}</h3>
        <p className="text-[11px] text-[#94A3B8] mb-2">
          {c?.certificateIssued && e.completedAt
            ? t('learner.dashboard.completedOn', { date: localizeNumber(new Date(e.completedAt).toLocaleDateString(locale), i18n.language) })
            : t('learner.dashboard.enrolledOn', { date: localizeNumber(new Date(e.purchasedAt).toLocaleDateString(locale), i18n.language) })}
        </p>

        <div className="mt-auto">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11px] font-semibold text-[#94A3B8] uppercase tracking-wide">{t('learner.dashboard.statsInProgress')}</span>
            <span className="text-[11px] font-semibold" style={{ color: theme.solid }}>{localizeNumber(progress, i18n.language)}%</span>
          </div>
          <MwasalatProgressRoad progress={progress} color={theme.solid} size="sm" />
          <span className="inline-flex items-center gap-1 text-xs font-semibold text-mwasalatInk-500 mt-1.5">
            {t('learner.dashboard.viewDetails')} <ChevronRight className="w-3.5 h-3.5 rtl:rotate-180" />
          </span>
        </div>
      </div>
    </Link>
  );
}
